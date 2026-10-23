import * as THREE from "three";

interface P {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  max: number;
  grow: number;
  gravity: number;
  spin: THREE.Vector3;
}

const geoBox = new THREE.BoxGeometry(1, 1, 1);
const geoBall = new THREE.IcosahedronGeometry(1, 0);

/** A small pool of short-lived chips, puffs and sparkles. */
export class Particles {
  private live: P[] = [];
  constructor(private scene: THREE.Scene) {}

  private spawn(shape: "box" | "ball", color: string, size: number, pos: THREE.Vector3, vel: THREE.Vector3, life: number, gravity: number, grow = 0, opacity = 1) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, transparent: true, opacity });
    if (color === "#FFE58A") (m.emissive = new THREE.Color(color)), (m.emissiveIntensity = 1);
    const mesh = new THREE.Mesh(shape === "box" ? geoBox : geoBall, m);
    mesh.scale.setScalar(size);
    mesh.position.copy(pos);
    this.scene.add(mesh);
    this.live.push({ mesh, vel, life, max: life, grow, gravity, spin: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8) });
  }

  chips(pos: THREE.Vector3, color: string, n = 6) {
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3((Math.random() - 0.5) * 4, 2.5 + Math.random() * 2.5, (Math.random() - 0.5) * 4);
      this.spawn("box", color, 0.08 + Math.random() * 0.07, pos.clone(), v, 0.7 + Math.random() * 0.3, 12);
    }
  }

  dust(pos: THREE.Vector3, n = 8, spread = 1.5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const p = pos.clone().add(new THREE.Vector3(Math.cos(a) * spread * Math.random(), 0.2, Math.sin(a) * spread * Math.random()));
      const v = new THREE.Vector3(Math.cos(a) * 1.5, 0.8 + Math.random(), Math.sin(a) * 1.5);
      this.spawn("ball", "#F4ECDD", 0.12 + Math.random() * 0.1, p, v, 0.8 + Math.random() * 0.4, -0.5, 0.5, 0.75);
    }
  }

  sparkles(pos: THREE.Vector3, n = 20, spread = 3) {
    for (let i = 0; i < n; i++) {
      const p = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * spread * 2, Math.random() * spread, (Math.random() - 0.5) * spread * 2));
      const v = new THREE.Vector3((Math.random() - 0.5) * 0.6, 1 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6);
      this.spawn("ball", "#FFE58A", 0.06 + Math.random() * 0.06, p, v, 1.2 + Math.random() * 0.8, -0.3);
    }
  }

  smoke(pos: THREE.Vector3) {
    const v = new THREE.Vector3((Math.random() - 0.3) * 0.4, 1 + Math.random() * 0.4, (Math.random() - 0.5) * 0.3);
    this.spawn("ball", "#E9E6E0", 0.18 + Math.random() * 0.1, pos.clone(), v, 2.8, -0.1, 0.5, 0.6);
  }

  update(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        this.live.splice(i, 1);
        continue;
      }
      p.vel.y -= p.gravity * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.mesh.position.y < 0.05 && p.gravity > 0) {
        p.mesh.position.y = 0.05;
        p.vel.multiplyScalar(0.4);
        p.vel.y = Math.abs(p.vel.y) * 0.3;
      }
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
      if (p.grow) p.mesh.scale.multiplyScalar(1 + p.grow * dt);
      const m = p.mesh.material as THREE.MeshStandardMaterial;
      const fade = Math.min(1, p.life / (p.max * 0.4));
      m.opacity = (m.userData.base ??= m.opacity) * fade;
    }
  }
}
