import * as THREE from "three";
import { model } from "../../game/models.ts";

// Water effects and tackle drawn in the world: ripples and splash crowns (fishing_bits.glb from
// art/scripts/fishing_gear.py), droplets, the float, the line from the rod tip, and the shadow of
// a fish under the surface while it's being reeled in.

/** The pond's surface (world.ts water()). */
export const WATER_Y = -0.18;

interface Live {
  obj: THREE.Object3D;
  mat: THREE.MeshStandardMaterial;
  t: number;
  life: number;
  kind: "ripple" | "splash" | "drop";
  size: number;
  vel?: THREE.Vector3;
  base?: number;
}

const foam = (opacity: number, color = "#EEF5F3") =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0, transparent: true, opacity, depthWrite: false });

export class WaterFx {
  private bits: Record<string, THREE.Object3D> = {};
  private live: Live[] = [];
  ready: Promise<void>;
  constructor(private scene: THREE.Scene) {
    this.ready = model("fishing_bits").then((root) => {
      for (const n of ["float", "ripple", "splash", "drop"]) {
        const o = root.getObjectByName(n);
        if (o) {
          o.position.set(0, 0, 0);
          this.bits[n] = o;
        }
      }
    }).catch(() => undefined);
  }

  /** A fresh float (cork and quill), origin on the waterline. */
  makeFloat(): THREE.Object3D {
    const f = this.bits.float?.clone() ?? new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshStandardMaterial({ color: "#C8473A" }));
    f.scale.setScalar(2.8);
    f.traverse((o) => ((o as THREE.Mesh).castShadow = false));
    return f;
  }

  private mesh(kind: "ripple" | "splash" | "drop", opacity: number, color?: string) {
    const src = this.bits[kind];
    const mat = foam(opacity, color);
    // a model with several materials loads as a group of meshes: give them all the one fading material
    const m: THREE.Object3D = src ? src.clone(true) : new THREE.Mesh(kind === "ripple" ? new THREE.TorusGeometry(0.94, 0.04, 6, 48).rotateX(Math.PI / 2) : new THREE.SphereGeometry(kind === "drop" ? 0.012 : 0.1, 8, 6), mat);
    m.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = mat;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = 2;
    });
    this.scene.add(m);
    return { m, mat };
  }

  /** A ring spreading out on the water. */
  ripple(at: THREE.Vector3, size = 0.6, life = 1.6, opacity = 0.55) {
    const { m, mat } = this.mesh("ripple", opacity);
    m.position.set(at.x, WATER_Y + 0.006, at.z);
    m.scale.setScalar(0.05);
    this.live.push({ obj: m, mat, t: 0, life, kind: "ripple", size, base: opacity });
  }

  /** A crown of water thrown up, a ring or two, and droplets. */
  splash(at: THREE.Vector3, size = 1, drops = 8) {
    const { m, mat } = this.mesh("splash", 0.85);
    m.position.set(at.x, WATER_Y, at.z);
    m.rotation.y = Math.random() * Math.PI * 2;
    m.scale.set(size, 0.01, size);
    this.live.push({ obj: m, mat, t: 0, life: 0.55, kind: "splash", size, base: 0.85 });
    this.ripple(at, 0.55 * size + 0.25, 1.4);
    this.ripple(at, 0.9 * size + 0.4, 2.0, 0.35);
    this.drops(at, drops, size);
  }

  drops(at: THREE.Vector3, n: number, size = 1) {
    for (let i = 0; i < n; i++) {
      const { m, mat } = this.mesh("drop", 0.9);
      const a = Math.random() * Math.PI * 2;
      const s = (0.5 + Math.random()) * size;
      m.position.set(at.x + Math.cos(a) * 0.05, WATER_Y + 0.05, at.z + Math.sin(a) * 0.05);
      m.scale.setScalar(0.7 + Math.random() * 0.8);
      const vel = new THREE.Vector3(Math.cos(a) * 0.9 * s, 1.6 + Math.random() * 1.6 * size, Math.sin(a) * 0.9 * s);
      this.live.push({ obj: m, mat, t: 0, life: 1.4, kind: "drop", size: 1, vel, base: 0.9 });
    }
  }

  /** Drips falling from something lifted out of the water. */
  drip(at: THREE.Vector3) {
    const { m, mat } = this.mesh("drop", 0.85);
    m.position.copy(at);
    m.scale.setScalar(0.6 + Math.random() * 0.5);
    this.live.push({ obj: m, mat, t: 0, life: 1.4, kind: "drop", size: 1, vel: new THREE.Vector3((Math.random() - 0.5) * 0.2, 0, (Math.random() - 0.5) * 0.2), base: 0.85 });
  }

  update(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.t += dt;
      const u = p.t / p.life;
      let dead = u >= 1;
      if (p.kind === "ripple") {
        const s = 0.05 + p.size * (1 - (1 - Math.min(1, u)) ** 2.2);
        p.obj.scale.set(s, 1, s);
        p.mat.opacity = p.base! * (1 - u) ** 1.4;
      } else if (p.kind === "splash") {
        const up = u < 0.35 ? Math.sin((u / 0.35) * Math.PI * 0.5) : 1 - (u - 0.35) / 0.65;
        p.obj.scale.set(p.size * (0.7 + 0.5 * u), Math.max(0.01, p.size * up), p.size * (0.7 + 0.5 * u));
        p.mat.opacity = p.base! * Math.min(1, (1 - u) * 2.2);
      } else {
        p.vel!.y -= 9.8 * dt;
        p.obj.position.addScaledVector(p.vel!, dt);
        if (p.obj.position.y < WATER_Y) {
          // a droplet back into the pond makes its own tiny ring (on the water only)
          if (p.vel!.y < -1.2 && Math.random() < 0.5) this.ripple(p.obj.position, 0.12, 0.6, 0.4);
          dead = true;
        }
      }
      if (dead) {
        this.scene.remove(p.obj);
        p.mat.dispose();
        this.live.splice(i, 1);
      }
    }
  }
}

/** The fishing line: a thin camera-facing ribbon sagging between the rod tip and the float. */
export class Line {
  readonly mesh: THREE.Mesh;
  private pos: Float32Array;
  private readonly n = 28;
  private pts: THREE.Vector3[] = [];
  constructor(scene: THREE.Scene, private camera: THREE.Camera) {
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array((this.n + 1) * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const idx: number[] = [];
    for (let i = 0; i < this.n; i++) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    geo.setIndex(idx);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#EDE8D6", transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, fog: true }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    this.mesh.visible = false;
    for (let i = 0; i <= this.n; i++) this.pts.push(new THREE.Vector3());
    scene.add(this.mesh);
  }

  /** Draw from a to b with a sag (metres at the middle); 0 is taut. width in metres. */
  set(a: THREE.Vector3, b: THREE.Vector3, sag: number, width = 0.011) {
    this.mesh.visible = true;
    const cam = this.camera.position;
    for (let i = 0; i <= this.n; i++) {
      const t = i / this.n;
      // a hanging curve: lowest a little past the middle, like a real line off a raised tip
      this.pts[i].lerpVectors(a, b, t).y -= sag * 4 * t * (1 - t) * (1 - 0.3 * t);
    }
    const side = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const view = new THREE.Vector3();
    for (let i = 0; i <= this.n; i++) {
      const p = this.pts[i];
      dir.subVectors(this.pts[Math.min(this.n, i + 1)], this.pts[Math.max(0, i - 1)]).normalize();
      view.subVectors(cam, p).normalize();
      side.crossVectors(dir, view).normalize().multiplyScalar(width / 2);
      this.pos.set([p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z], i * 6);
    }
    (this.mesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}

/** A soft dark fish shape just under the surface. */
export function fishShadow(): THREE.Mesh {
  const g = new THREE.CircleGeometry(1, 20);
  g.rotateX(-Math.PI / 2);
  g.scale(1, 1, 0.34);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: "#1F3338", transparent: true, opacity: 0, depthWrite: false }));
  m.renderOrder = 1;
  return m;
}
