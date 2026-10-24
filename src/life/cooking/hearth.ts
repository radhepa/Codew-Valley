import * as THREE from "three";
import { model, preload } from "../../game/models.ts";
import { reserveArea, siteInfo, type World } from "../../game/world.ts";
import { clock } from "../clock.ts";
import { KitchenFx } from "./fx.ts";
import { cookSfx } from "./sound.ts";

// The places you cook, in the world: Bram's hearth by the Sleepy Serpent (art/scripts/cook_hearth.py),
// Hazel's oven (the bakery model's own oven) and Wren's millstone (the mill's door). This file
// owns their 3D side: placing the hearth, its fire and light, the pot's steam and bubbles, the
// soup's colour, the food in the pan, and the dish that comes out at the end.

/** Bram's hearth, world position: tucked against the tavern's east wall, fire facing the camera. */
export const HEARTH = new THREE.Vector3(6.45, 0, -5.4);
// keep the meadow grass and decor off the cooking patch (at import, before the world builds)
reserveArea({ x: HEARTH.x + 0.25, z: HEARTH.z - 0.05, hw: 2.5, hd: 1.15 });

/** Hearth-local (Blender) x, y to world: glTF puts Blender (x, y, z) at (x, z, -y). */
const at = (x: number, y: number, h = 0) => new THREE.Vector3(HEARTH.x + x, h, HEARTH.z - y);
/** Where the cook stands for the pot and for the pan (behind the fire, facing the camera). */
export const STAND = { pot: at(-0.36, 0.95), pan: at(0.47, 0.95) };

export class Hearth {
  root: THREE.Object3D | null = null;
  private pot: THREE.Object3D | null = null;
  private soupMat: THREE.MeshStandardMaterial | null = null;
  private mouth: THREE.Object3D | null = null;
  private grill: THREE.Object3D | null = null;
  private fires: THREE.Object3D[] = [];
  private fireMats: THREE.MeshStandardMaterial[] = [];
  private emberMat: THREE.MeshStandardMaterial | null = null;
  private light = new THREE.PointLight("#ffb066", 0, 7, 1.6);
  readonly fx: KitchenFx;
  /** 0..1: how hard the pot is boiling (bubbles, steam, sound). */
  boil = 0.15;
  /** 0..1: the pot fire / the pan fire roaring (while cooking). */
  potHeat = 0;
  panHeat = 0;
  /** Less steam for a moment (the reveal). */
  quiet = false;
  /** Is the hearth lit at all (the tavern is finished). */
  lit = false;
  private t = 0;
  private steamT = 0;
  private bubbleT = 0;
  private crackleT = 0;
  private baseSoup = new THREE.Color("#9a5230");
  private soupGoal = new THREE.Color("#9a5230");

  constructor(private world: World) {
    this.fx = new KitchenFx(world.scene);
  }

  async load() {
    await preload(["cook_hearth", "cook_dishes"]);
    const root = await model("cook_hearth");
    root.position.copy(HEARTH);
    root.visible = false;
    this.world.addProp(root);
    this.root = root;
    this.pot = root.getObjectByName("pot") ?? null;
    this.mouth = root.getObjectByName("pot_mouth") ?? null;
    this.grill = root.getObjectByName("grill") ?? null;
    for (const n of ["fire_pot", "fire_pan"]) {
      const f = root.getObjectByName(n);
      if (f) this.fires.push(f);
    }
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = [m.material].flat() as THREE.MeshStandardMaterial[];
      mats.forEach((mt, i) => {
        if (!mt?.name) return;
        if (mt.name.startsWith("glow")) {
          // fire shouldn't cast shadows; each fire flickers on its own
          m.castShadow = false;
          const c = mt.clone();
          if (Array.isArray(m.material)) m.material[i] = c;
          else m.material = c;
          if (mt.name === "glow_ember") this.emberMat = c;
          else this.fireMats.push(c);
        }
        if (mt.name === "soup" && o.name.startsWith("soup")) {
          const c = mt.clone();
          if (Array.isArray(m.material)) m.material[i] = c;
          else m.material = c;
          this.soupMat = c;
        }
      });
    });
    if (this.soupMat) this.baseSoup.copy(this.soupMat.color);
    this.soupGoal.copy(this.baseSoup);
    this.light.position.copy(at(0, 0, 0.9));
    this.world.scene.add(this.light);
    this.world.onFrame((dt) => this.update(dt));
  }

  /** The pot's soup surface in the world (for steam, bubbles and things dropped in). */
  get soupPos() {
    return this.mouth ? this.mouth.getWorldPosition(new THREE.Vector3()) : at(-0.36, 0, 0.75);
  }
  get grillPos() {
    return this.grill ? this.grill.getWorldPosition(new THREE.Vector3()) : at(0.47, 0, 0.39);
  }
  /** A point on the hearth to click. */
  get obj() {
    return this.root ?? undefined;
  }

  private solid = false;
  show(on: boolean) {
    if (this.root) this.root.visible = on;
    this.lit = on;
    if (on && !this.solid) {
      // solid where things stand: the fire ring, the post, the woodpile, the table and bucket
      this.solid = true;
      for (const [x, y, r] of [[-0.45, 0, 0.55], [0.45, 0, 0.55], [-1.16, 0.14, 0.18], [-1.7, 0, 0.42], [1.78, 0.18, 0.5], [2.38, -0.04, 0.2]] as const) {
        const c = new THREE.Object3D();
        c.position.copy(at(x, y));
        this.world.addProp(c, r);
      }
    }
  }

  /** Tint the soup toward a recipe's colour (or back to Bram's everyday stew with null). */
  tint(color: string | null) {
    this.soupGoal.set(color ?? this.baseSoup);
  }

  private update(dt: number) {
    // the oven and the mill use these particles too, so they always run
    this.fx.update(dt);
    if (!this.lit || !this.root) return;
    this.t += dt;
    const t = this.t;
    const night = nightness();
    // the fires flicker; they roar while you cook on them
    this.fires.forEach((f, i) => {
      const heat = i === 0 ? this.potHeat : this.panHeat;
      const k = 0.85 + 0.35 * heat + Math.sin(t * 13 + i * 2) * 0.06 + Math.sin(t * 23.7 + i) * 0.04;
      f.scale.set(1 + heat * 0.15, k, 1 + heat * 0.15);
      f.rotation.y = Math.sin(t * 2.3 + i) * 0.15;
    });
    const flick = 0.75 + Math.sin(t * 17) * 0.1 + Math.sin(t * 29.3) * 0.08 + Math.random() * 0.05;
    for (const m of this.fireMats) m.emissiveIntensity = (1.6 + 1.2 * night) * flick * (1 + 0.3 * Math.max(this.potHeat, this.panHeat));
    if (this.emberMat) this.emberMat.emissiveIntensity = (1.4 + 1.2 * night) * (0.8 + Math.sin(t * 3.1) * 0.2);
    this.light.intensity = (0.6 + 4.2 * night) * flick * (1 + 0.4 * Math.max(this.potHeat, this.panHeat));
    // the pot sways a touch on its chain, more while you stir
    if (this.pot) this.pot.rotation.z = Math.sin(t * 1.4) * 0.008 + Math.sin(t * 6) * 0.01 * this.potHeat;
    // soup colour eases toward its goal
    this.soupMat?.color.lerp(this.soupGoal, Math.min(1, dt * 2.5));
    // steam and bubbles from the pot: always a little (Bram keeps it simmering), lots when it boils
    const sp = this.soupPos;
    this.steamT -= dt * (this.quiet ? 0.25 : 1);
    if (this.steamT <= 0) {
      this.steamT = 0.5 - 0.38 * this.boil;
      this.fx.steam(sp.clone().add(new THREE.Vector3(0, 0.03, 0)), 0.25 + 0.75 * this.boil);
    }
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      this.bubbleT = 0.7 - 0.6 * this.boil + Math.random() * 0.2;
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.2;
      this.fx.bubble(sp.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.005, Math.sin(a) * r)), 0.02 + 0.025 * this.boil);
    }
    if (Math.random() < dt * (0.6 + 4 * Math.max(this.potHeat, this.panHeat))) this.fx.sparks(at(Math.random() < 0.5 ? -0.36 : 0.47, 0, 0.25), 1);
    // a wisp of wood smoke above the fire
    if (Math.random() < dt * 1.2) this.world.fx.smoke(at(0.1, 0, 1.0));
    // the fire's crackle, heard close by
    this.crackleT -= dt;
    if (this.crackleT <= 0) {
      this.crackleT = 0.08 + Math.random() * 0.35;
      const d = this.world.playerPos.distanceTo(HEARTH);
      cookSfx.crackle(Math.max(0, 1 - d / 9) * 0.8);
    }
  }
}

/** 0 by day, 1 at night (the hearth glows brighter in the evening). */
export function nightness() {
  const t = clock.timeOfDay;
  const d = Math.min(Math.abs(t - 0.5), 0.5);
  return THREE.MathUtils.smoothstep(d, 0.2, 0.3);
}

/** The dishes, for the reveal: a fresh copy of one dish model, or null. */
export async function dishModel(id: string): Promise<THREE.Object3D | null> {
  const all = await model("cook_dishes").catch(() => null);
  if (!all) return null;
  const d = all.getObjectByName(id);
  if (!d) return null;
  const c = d.clone(true);
  c.position.set(0, 0, 0);
  c.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = false;
  });
  return c;
}

/** Hazel's oven mouth (bakery.glb, art/specs/bakery.md) and where the baker stands to use it. */
export function ovenPlaces() {
  const b = siteInfo("bakery");
  if (!b) return null;
  // oven mouth: Blender (4.1, -2.75, 0.95) from the bakery's origin
  const mouth = new THREE.Vector3(b.pos.x + 4.1, 0.95, b.pos.z + 2.75);
  return { mouth, stand: new THREE.Vector3(mouth.x, 0, mouth.z + 1.05), spot: new THREE.Vector3(mouth.x, 0, mouth.z + 0.45) };
}

/** Wren's millstone: the mill's door (mill.glb, the tower faces the camera). */
export function millPlaces() {
  const m = siteInfo("mill");
  if (!m) return null;
  const door = new THREE.Vector3(m.pos.x, 0, m.pos.z + 2.45);
  return { door, stand: new THREE.Vector3(door.x + 0.15, 0, door.z + 0.95) };
}
