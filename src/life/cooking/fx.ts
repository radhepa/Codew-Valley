import * as THREE from "three";

// Kitchen particles: steam that curls up and fades, bubbles that swell and pop on the soup,
// chopped pieces that tumble into the pot, sparks off the fire, flour puffs. A small pool of
// sprites and meshes of its own, so it can do what the world's chips and dust can't
// (die at the soup's surface, grow soft and transparent).

function softDot() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.45, "rgba(255,255,255,0.55)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Bit {
  obj: THREE.Object3D;
  vel: THREE.Vector3;
  life: number;
  max: number;
  kind: "steam" | "bubble" | "piece" | "spark" | "puff" | "heart";
  size: number;
  /** pieces vanish at this height (the soup), with a plop */
  floor?: number;
  onLand?: () => void;
  spin?: THREE.Vector3;
}

const BOX = new THREE.BoxGeometry(1, 1, 1);
const BALL = new THREE.IcosahedronGeometry(1, 1);

export class KitchenFx {
  private bits: Bit[] = [];
  private tex = softDot();
  private pieceMats = new Map<string, THREE.MeshStandardMaterial>();
  private bubbleMat = new THREE.MeshStandardMaterial({ color: "#fff3e0", roughness: 0.2, transparent: true, opacity: 0.85 });
  constructor(private scene: THREE.Scene) {}

  private sprite(color: string, opacity: number, additive = false) {
    const m = new THREE.SpriteMaterial({ map: this.tex, color, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    m.userData.base = opacity;
    return new THREE.Sprite(m);
  }

  /** A curl of steam from a point; strength 0..1 makes it denser and taller. */
  steam(p: THREE.Vector3, strength = 0.6, spread = 0.18) {
    const s = this.sprite("#fbf6ee", 0.1 + 0.16 * strength);
    s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread));
    const size = 0.13 + Math.random() * 0.08;
    s.scale.setScalar(size);
    this.scene.add(s);
    this.bits.push({ obj: s, vel: new THREE.Vector3((Math.random() - 0.5) * 0.12, 0.4 + 0.4 * strength + Math.random() * 0.2, (Math.random() - 0.5) * 0.12), life: 1.6 + strength, max: 1.6 + strength, kind: "steam", size });
  }

  /** A bubble that swells on the surface and pops. */
  bubble(p: THREE.Vector3, r = 0.03) {
    const m = new THREE.Mesh(BALL, this.bubbleMat);
    m.position.copy(p);
    m.scale.set(r, r * 0.6, r);
    this.scene.add(m);
    this.bits.push({ obj: m, vel: new THREE.Vector3(), life: 0.45 + Math.random() * 0.3, max: 0.75, kind: "bubble", size: r });
  }

  /** Chopped pieces tumbling from `from` into the pot (they vanish at floorY and call onLand once). */
  pieces(from: THREE.Vector3, to: THREE.Vector3, color: string, n = 5, floorY = to.y, onLand?: () => void) {
    let mat = this.pieceMats.get(color);
    if (!mat) this.pieceMats.set(color, (mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true })));
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(BOX, mat);
      const s = 0.03 + Math.random() * 0.025;
      m.scale.set(s, s * 0.8, s);
      m.position.copy(from).add(new THREE.Vector3((Math.random() - 0.5) * 0.08, Math.random() * 0.05, (Math.random() - 0.5) * 0.08));
      const t = 0.42;
      const v = to.clone().sub(m.position).divideScalar(t);
      v.y += 0.5 * 9 * t + (Math.random() - 0.5) * 0.4;
      v.x += (Math.random() - 0.5) * 0.35;
      v.z += (Math.random() - 0.5) * 0.35;
      this.scene.add(m);
      this.bits.push({ obj: m, vel: v, life: 1.4, max: 1.4, kind: "piece", size: s, floor: floorY, onLand: i === 0 ? onLand : undefined, spin: new THREE.Vector3(Math.random() * 9, Math.random() * 9, Math.random() * 9) });
    }
  }

  /** Little embers that fly up from the fire or the pan. */
  sparks(p: THREE.Vector3, n = 3, spread = 0.25) {
    for (let i = 0; i < n; i++) {
      const s = this.sprite(Math.random() < 0.5 ? "#ffb347" : "#ffd27a", 0.95, true);
      s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * spread, 0, (Math.random() - 0.5) * spread));
      const size = 0.035 + Math.random() * 0.03;
      s.scale.setScalar(size);
      this.scene.add(s);
      this.bits.push({ obj: s, vel: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.8 + Math.random() * 1.2, (Math.random() - 0.5) * 0.5), life: 0.7 + Math.random() * 0.6, max: 1.3, kind: "spark", size });
    }
  }

  /** Soft puffs (flour from the dough or the millstone, ash from the fire). */
  puff(p: THREE.Vector3, n = 6, color = "#f6f0e2", spread = 0.3) {
    for (let i = 0; i < n; i++) {
      const s = this.sprite(color, 0.7);
      s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * spread, Math.random() * 0.1, (Math.random() - 0.5) * spread));
      const size = 0.14 + Math.random() * 0.12;
      s.scale.setScalar(size);
      this.scene.add(s);
      const a = Math.random() * Math.PI * 2;
      this.bits.push({ obj: s, vel: new THREE.Vector3(Math.cos(a) * 0.5, 0.3 + Math.random() * 0.4, Math.sin(a) * 0.5), life: 0.9 + Math.random() * 0.5, max: 1.4, kind: "puff", size });
    }
  }

  /** Little hearts that float up (a happy taste, a thank-you). */
  hearts(p: THREE.Vector3, n = 3) {
    for (let i = 0; i < n; i++) {
      const s = this.sprite("#ff8f8f", 0.95);
      (s.material as THREE.SpriteMaterial).map = heartTex;
      s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, Math.random() * 0.1, (Math.random() - 0.5) * 0.2));
      s.scale.setScalar(0.13);
      this.scene.add(s);
      this.bits.push({ obj: s, vel: new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.5 + Math.random() * 0.3, 0), life: 1.3 + i * 0.15, max: 1.6, kind: "heart", size: 0.13 });
    }
  }

  update(dt: number) {
    for (let i = this.bits.length - 1; i >= 0; i--) {
      const b = this.bits[i];
      b.life -= dt;
      const u = 1 - b.life / b.max;
      if (b.kind === "piece") {
        b.vel.y -= 9 * dt;
        b.obj.position.addScaledVector(b.vel, dt);
        if (b.spin) b.obj.rotation.set(b.obj.rotation.x + b.spin.x * dt, b.obj.rotation.y + b.spin.y * dt, b.obj.rotation.z + b.spin.z * dt);
        if (b.vel.y < 0 && b.floor !== undefined && b.obj.position.y <= b.floor) {
          b.onLand?.();
          b.life = 0;
        }
      } else if (b.kind === "bubble") {
        b.obj.scale.set(b.size * (0.6 + u), b.size * 0.6 * (0.6 + u), b.size * (0.6 + u));
      } else {
        // steam, sparks, puffs and hearts drift up and slow, with a little sway
        b.obj.position.addScaledVector(b.vel, dt);
        b.vel.multiplyScalar(b.kind === "spark" ? 1 - dt * 1.2 : 1 - dt * 0.6);
        if (b.kind === "steam") b.obj.position.x += Math.sin((b.max - b.life) * 3 + i) * 0.08 * dt;
        const grow = b.kind === "steam" ? 1 + u * 1.7 : b.kind === "puff" ? 1 + u * 1.5 : b.kind === "heart" ? 0.7 + Math.min(1, u * 4) * 0.5 : 1 - u * 0.5;
        b.obj.scale.setScalar(b.size * grow);
        const m = (b.obj as THREE.Sprite).material as THREE.SpriteMaterial;
        const fadeIn = Math.min(1, (b.max - b.life) / 0.25);
        m.opacity = m.userData.base * fadeIn * Math.min(1, b.life / (b.max * 0.5));
      }
      if (b.life <= 0) {
        this.scene.remove(b.obj);
        const mt = (b.obj as THREE.Mesh).material as THREE.Material;
        if (mt !== this.bubbleMat && b.kind !== "piece") mt.dispose();
        this.bits.splice(i, 1);
      }
    }
  }
}

const heartTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fff";
  g.beginPath();
  g.moveTo(32, 54);
  g.bezierCurveTo(6, 36, 8, 12, 22, 12);
  g.bezierCurveTo(28, 12, 32, 18, 32, 22);
  g.bezierCurveTo(32, 18, 36, 12, 42, 12);
  g.bezierCurveTo(56, 12, 58, 36, 32, 54);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
