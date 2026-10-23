import * as THREE from "three";
import { model, preload, realModels } from "./models.ts";
import { Particles } from "./particles.ts";
import { sfx } from "./audio.ts";
import { ATMOS, createComposer, createHills, createMeadow, createSky } from "./atmosphere.ts";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";

export type Resource = "wood" | "stone";

export interface WorldHooks {
  /** A resource was gathered at this screen position. */
  gain(kind: Resource, x: number, y: number): void;
  /** The interaction prompt changed (null hides it). */
  prompt(label: string | null, x: number, y: number): void;
  rune(): void;
  pip(): void;
  bram(): void;
}

interface Node {
  kind: Resource;
  obj: THREE.Object3D;
  stump: THREE.Object3D | null;
  pos: THREE.Vector3;
  radius: number;
  hp: number;
  respawnAt: number;
  shake: number;
  falling: number;
}

interface Npc {
  id: "pip" | "bram" | "rune";
  obj: THREE.Object3D;
  pos: THREE.Vector3;
  radius: number;
  label: string;
}

interface Collider {
  x: number;
  z: number;
  r: number;
}

const NODE_HP = 3;
const RESPAWN_S = 30;
const PLAY_RADIUS = 30;
const TAVERN_POS = new THREE.Vector3(0, 0, -7);
const RUNE_POS = new THREE.Vector3(6.2, 0, -1.6);
const PIP_POS = new THREE.Vector3(7.4, 0, -0.9);
const BRAM_POS = new THREE.Vector3(2.3, 0, TAVERN_POS.z + 4.8);
const SPAWN = new THREE.Vector3(0, 0, 9);
const POND = { x: 13, z: 9, r: 4.2 };
/** Dirt paths (polyline points on the ground). */
const PATHS: [number, number][][] = [
  [
    [0, 13],
    [0, 4],
    [0, TAVERN_POS.z + 3.6],
  ],
  [
    [0, 2],
    [4, 0],
    [RUNE_POS.x - 0.6, RUNE_POS.z + 1.2],
  ],
  [
    [0, 3],
    [-7, 3],
    [-14, 1],
  ],
  [
    [4, 0],
    [10, -1],
    [16, -3],
  ],
];

function noise2(x: number, z: number) {
  return Math.sin(x * 0.21 + Math.sin(z * 0.13) * 2) * 0.5 + Math.sin(z * 0.17 - x * 0.07) * 0.5;
}
function distToSeg(px: number, pz: number, a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (pz - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - (a[0] + dx * t), pz - (a[1] + dz * t));
}
function pathDist(x: number, z: number) {
  let d = Infinity;
  for (const p of PATHS) for (let i = 0; i < p.length - 1; i++) d = Math.min(d, distToSeg(x, z, p[i], p[i + 1]));
  return d;
}
function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let y = 0;
  if (r > PLAY_RADIUS - 2) {
    // a soft grassy rim around the valley, then gently rolling land out to the hills
    const t = Math.min(1, (r - (PLAY_RADIUS - 2)) / 14);
    y += t * t * (3 - 2 * t) * 4 + noise2(x * 1.7, z * 1.7) * t * 1.4;
  }
  const dp = Math.hypot(x - POND.x, z - POND.z);
  if (dp < POND.r + 0.8) y -= (1 - Math.min(1, Math.max(0, (dp - POND.r + 0.8) / 1.6))) * 0.55;
  return y;
}

/** Ease with a little overshoot, for things popping into place. */
const easeOutBack = (t: number) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

export class World {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
  /** Freezes the player while a menu is open. */
  paused = true;

  private hooks: WorldHooks;
  private clock = new THREE.Clock();
  private sun!: THREE.DirectionalLight;
  private particles: Particles;
  private player!: THREE.Object3D;
  private parts: Record<string, THREE.Object3D | undefined> = {};
  private pip!: THREE.Object3D;
  private bram: THREE.Object3D | null = null;
  private tavern!: THREE.Object3D;
  private stages: THREE.Object3D[] = [];
  private stageShown = 0;
  private nodes: Node[] = [];
  private npcs: Npc[] = [];
  private colliders: Collider[] = [];
  private swaying: { obj: THREE.Object3D; phase: number; base: THREE.Euler }[] = [];
  private butterflies: { obj: THREE.Object3D; phase: number; center: THREE.Vector3 }[] = [];
  private keys = new Set<string>();
  private target: THREE.Vector3 | null = null;
  private pendingInteract: Node | Npc | null = null;
  private facing = Math.PI;
  private walkPhase = 0;
  private swing = 0;
  private cooldown = 0;
  private zoom = 1.2;
  /** Trees that turn see-through when they stand between the camera and the player. */
  private fadeables: { obj: THREE.Object3D; mats: THREE.MeshStandardMaterial[]; opacity: number }[] = [];
  private cam = new THREE.Vector3();
  private cinematic: { t: number; dur: number; look: THREE.Vector3; pos: THREE.Vector3 } | null = null;
  private building: { meshes: THREE.Object3D[]; base: { y: number; s: THREE.Vector3 }[]; t: number } | null = null;
  private smokeTimer = 0;
  private time = 0;
  private raycaster = new THREE.Raycaster();
  private lanternLights: THREE.PointLight[] = [];
  private nearest: Node | Npc | null = null;
  private composer: EffectComposer;
  private tickSky: (t: number, camera: THREE.Camera) => void = () => {};
  private tickMeadow: (t: number) => void = () => {};

  constructor(canvas: HTMLCanvasElement, hooks: WorldHooks) {
    this.hooks = hooks;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.composer = createComposer(this.renderer, this.scene, this.camera);
    this.particles = new Particles(this.scene);
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  // ---- setup ----------------------------------------------------------------

  async build(stage: number) {
    await preload(["tavern", "tree_oak", "tree_pine", "tree_stump", "rock_large", "rock_small", "bush", "flowers", "grass_tuft", "fence", "log_pile", "stone_pile", "rune_stone", "signpost", "lantern_post", "player", "innkeeper", "pip"]);
    this.tickSky = createSky(this.scene);
    createHills(this.scene);
    this.lights();
    this.ground();
    this.water();
    await this.placeTavern(stage);
    await this.placeCharacters();
    await this.placeResources();
    await this.placeDecor();
    this.bindInput();
    this.cam.copy(this.player.position).add(this.camOffset());
    this.camera.position.copy(this.cam);
  }

  private lights() {
    this.scene.add(new THREE.HemisphereLight("#CFE0F0", "#86935F", 1.35));
    const sun = new THREE.DirectionalLight(ATMOS.sunColor, 2.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const s = sun.shadow.camera;
    s.left = -28;
    s.right = 28;
    s.top = 28;
    s.bottom = -28;
    s.near = 1;
    s.far = 120;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun, sun.target);
    this.sun = sun;
  }

  private ground() {
    const size = 320;
    const seg = 200;
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.getAttribute("position");
    const colors: number[] = [];
    const g1 = new THREE.Color("#86A355");
    const g2 = new THREE.Color("#729249");
    const g3 = new THREE.Color("#A8B76A");
    const dirt = new THREE.Color("#BBA47C");
    const dirtEdge = new THREE.Color("#8F9663");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, groundHeight(x, z));
      const n = noise2(x * 0.9, z * 0.9);
      c.copy(g1).lerp(n > 0 ? g3 : g2, Math.abs(n) * 0.7);
      const d = pathDist(x, z);
      if (d < 1.6) c.lerp(dirtEdge, 0.5);
      if (d < 1.0) c.copy(dirt).offsetHSL(0, 0, noise2(x * 3, z * 3) * 0.03);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    ground.receiveShadow = true;
    ground.name = "ground";
    this.scene.add(ground);
  }

  private water() {
    const geo = new THREE.CircleGeometry(POND.r + 0.3, 28);
    geo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#4C8CA3", roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.82 }));
    water.position.set(POND.x, -0.18, POND.z);
    water.receiveShadow = true;
    this.scene.add(water);
    const pad = new THREE.MeshStandardMaterial({ color: "#5E9A3A", roughness: 0.8, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const a = i * 1.9;
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 9, 1, false, 0.4, Math.PI * 1.8), pad);
      p.position.set(POND.x + Math.cos(a) * (1 + (i % 3)), -0.15, POND.z + Math.sin(a) * (1 + (i % 3)));
      p.rotation.y = a;
      this.scene.add(p);
      if (i % 2 === 0) {
        const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), new THREE.MeshStandardMaterial({ color: "#F6B8C8", flatShading: true }));
        f.position.copy(p.position).add(new THREE.Vector3(0.05, 0.07, 0.05));
        this.scene.add(f);
      }
    }
    this.colliders.push({ x: POND.x, z: POND.z, r: POND.r - 0.3 });
  }

  private async placeTavern(stage: number) {
    this.tavern = await model("tavern");
    this.tavern.position.copy(TAVERN_POS);
    this.scene.add(this.tavern);
    this.stages = [];
    for (let i = 1; i <= 12; i++) {
      const s = this.tavern.getObjectByName(`stage_${String(i).padStart(2, "0")}`);
      if (s) this.stages.push(s);
    }
    this.tavern.traverse((o) => {
      if ((o as THREE.PointLight).isPointLight) this.lanternLights.push(o as THREE.PointLight);
    });
    this.showStages(stage);
    // the building plot is solid once building starts
    for (let x = -3.6; x <= 3.6; x += 1.2) for (const z of [-2.6, -1.3, 0, 1.3, 2.6]) this.colliders.push({ x: TAVERN_POS.x + x, z: TAVERN_POS.z + z, r: 0.95 });

    const rune = await model("rune_stone");
    rune.position.copy(RUNE_POS);
    rune.rotation.y = -0.5;
    this.scene.add(rune);
    this.npcs.push({ id: "rune", obj: rune, pos: RUNE_POS, radius: 0.8, label: "Use the rune stone" });
    this.colliders.push({ x: RUNE_POS.x, z: RUNE_POS.z, r: 0.75 });
    const sign = await model("signpost");
    sign.position.set(-1.6, 0, 5);
    sign.rotation.y = 0.3;
    this.scene.add(sign);
    this.colliders.push({ x: -1.6, z: 5, r: 0.3 });
  }

  showStages(n: number) {
    this.stageShown = n;
    this.stages.forEach((s, i) => (s.visible = i < n));
    const lit = n >= 11;
    for (const l of this.lanternLights) l.intensity = lit ? 5 : 0;
    this.tavern?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && m.name.toLowerCase().startsWith("glow")) m.emissiveIntensity = lit ? 2.6 : 0.15;
    });
    if (n >= 12) void this.spawnBram();
  }

  /** Reveal stage n with a building animation and a short camera move. */
  buildStage(n: number) {
    this.showStages(n);
    const s = this.stages[n - 1];
    if (!s) return;
    const meshes: THREE.Object3D[] = [];
    s.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.parent === s) meshes.push(o);
    });
    if (!meshes.length) s.children.forEach((c) => meshes.push(c));
    const base = meshes.map((m) => ({ y: m.position.y, s: m.scale.clone() }));
    meshes.forEach((m) => m.scale.setScalar(0.0001));
    this.building = { meshes, base, t: 0 };
    const look = TAVERN_POS.clone().add(new THREE.Vector3(0, 2, 0));
    this.cinematic = { t: 0, dur: 3.6, look, pos: TAVERN_POS.clone().add(new THREE.Vector3(7, 8, 13)) };
    sfx.build();
    this.particles.dust(TAVERN_POS.clone().add(new THREE.Vector3(0, 0, 3.5)), 14, 4);
  }

  private async placeCharacters() {
    this.player = await model("player");
    this.player.position.copy(SPAWN);
    this.player.rotation.y = this.facing;
    this.scene.add(this.player);
    for (const k of ["body", "head", "arm_l", "arm_r", "leg_l", "leg_r"]) {
      const o = this.player.getObjectByName(k);
      if (o) {
        o.userData.rest = o.rotation.clone();
        o.userData.restY = o.position.y;
      }
      this.parts[k] = o;
    }
    this.pip = await model("pip");
    this.pip.position.copy(PIP_POS);
    this.pip.scale.setScalar(1.6);
    this.scene.add(this.pip);
    this.npcs.push({ id: "pip", obj: this.pip, pos: PIP_POS, radius: 0.5, label: "Talk to Pip" });
    this.colliders.push({ x: PIP_POS.x, z: PIP_POS.z, r: 0.45 });
  }

  private async spawnBram() {
    if (this.bram) return;
    const b = await model("innkeeper");
    if (this.bram) return;
    this.bram = b;
    b.position.copy(BRAM_POS);
    b.rotation.y = 0.2;
    this.scene.add(b);
    this.npcs.push({ id: "bram", obj: b, pos: BRAM_POS, radius: 0.5, label: "Talk to Bram" });
  }

  private async placeResources() {
    // forest grove to the west, quarry to the east
    const trees: [number, number][] = [
      [-11, -3], [-13.5, 0.5], [-16, -2.5], [-12, 4.5], [-15.5, 6], [-18.5, 2], [-19, -5], [-14, -7.5], [-9.5, 8], [-17, 9.5], [-21, 6.5], [-10, -9],
    ];
    let seed = 1;
    for (const [x, z] of trees) {
      const kind = seed % 3 === 0 ? "tree_pine" : "tree_oak";
      const obj = await model(kind, seed);
      const stump = await model("tree_stump", seed);
      obj.position.set(x, 0, z);
      obj.rotation.y = seed * 1.3;
      obj.scale.setScalar(0.9 + (seed % 4) * 0.07);
      stump.position.set(x, 0, z);
      stump.visible = false;
      this.scene.add(obj, stump);
      this.addSway(obj);
      this.addFade(obj);
      this.nodes.push({ kind: "wood", obj, stump, pos: new THREE.Vector3(x, 0, z), radius: 0.55, hp: NODE_HP, respawnAt: 0, shake: 0, falling: 0 });
      seed++;
    }
    const rocks: [number, number, boolean][] = [
      [12, -5, true], [15, -7.5, false], [17.5, -4, true], [19, -8, false], [14, -10.5, true], [20.5, -1, false], [11, -9, false], [17, -12, true],
    ];
    for (const [x, z, large] of rocks) {
      const obj = await model(large ? "rock_large" : "rock_small", seed++);
      obj.position.set(x, 0, z);
      obj.rotation.y = seed * 0.9;
      if (!large) obj.scale.setScalar(1.6);
      this.scene.add(obj);
      this.nodes.push({ kind: "stone", obj, stump: null, pos: new THREE.Vector3(x, 0, z), radius: large ? 1.0 : 0.6, hp: NODE_HP, respawnAt: 0, shake: 0, falling: 0 });
    }
    for (const n of this.nodes) this.colliders.push({ x: n.pos.x, z: n.pos.z, r: n.radius });
    const logs = await model("log_pile");
    logs.position.set(-8, 0, 0.5);
    logs.rotation.y = 0.4;
    const stones = await model("stone_pile");
    stones.position.set(9.5, 0, -3);
    this.scene.add(logs, stones);
    this.colliders.push({ x: -8, z: 0.5, r: 0.8 }, { x: 9.5, z: -3, r: 0.6 });
  }

  private async placeDecor() {
    const rnd = (() => {
      let s = 1234;
      return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    })();
    const clear = (x: number, z: number, pad = 0) => {
      if (pathDist(x, z) < 1.5 + pad) return false;
      if (Math.abs(x - TAVERN_POS.x) < 6 + pad && Math.abs(z - TAVERN_POS.z) < 5.5 + pad) return false;
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1 + pad) return false;
      if (Math.hypot(x - RUNE_POS.x, z - RUNE_POS.z) < 2.5 + pad) return false;
      for (const n of this.nodes) if (Math.hypot(x - n.pos.x, z - n.pos.z) < n.radius + 1.2 + pad) return false;
      return true;
    };
    // a ring of big trees around the valley edge
    let seed = 50;
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + rnd() * 0.08;
      const r = PLAY_RADIUS + 1 + rnd() * 9;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const t = await model(rnd() < 0.45 ? "tree_pine" : "tree_oak", seed++);
      t.position.set(x, groundHeight(x, z) - 0.2, z);
      t.scale.setScalar(1.1 + rnd() * 0.6);
      t.rotation.y = rnd() * 6;
      this.scene.add(t);
      this.addSway(t);
      this.addFade(t);
    }
    for (let i = 0; i < 30; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 6 + rnd() * (PLAY_RADIUS - 8);
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (!clear(x, z)) continue;
      const b = await model("bush", seed++);
      b.position.set(x, 0, z);
      b.rotation.y = rnd() * 6;
      this.scene.add(b);
      this.colliders.push({ x, z, r: 0.5 });
    }
    // scattered props only when real models exist; the meadow covers the rest
    const props = ["grass_tuft", "flowers"].filter((n) => realModels.has(n));
    for (let i = 0; i < 55 && props.length; i++) {
      const x = (rnd() - 0.5) * 2 * (PLAY_RADIUS - 2);
      const z = (rnd() - 0.5) * 2 * (PLAY_RADIUS - 2);
      if (Math.hypot(x, z) > PLAY_RADIUS - 2 || !clear(x, z, -0.6)) continue;
      const f = await model(props[i % props.length], seed++);
      f.position.set(x, 0, z);
      f.rotation.y = rnd() * 6;
      this.scene.add(f);
    }
    this.tickMeadow = createMeadow(this.scene, { radius: PLAY_RADIUS, height: groundHeight, clear });
    // fence along the tavern plot's sides, lantern posts on the path
    for (const [x, z, ry] of [
      [-6.2, TAVERN_POS.z - 2, Math.PI / 2], [-6.2, TAVERN_POS.z + 0.1, Math.PI / 2], [6.2, TAVERN_POS.z - 2, Math.PI / 2], [-5.1, TAVERN_POS.z - 4.3, 0], [5.1, TAVERN_POS.z - 4.3, 0], [3, TAVERN_POS.z - 4.3, 0], [-3, TAVERN_POS.z - 4.3, 0],
    ] as [number, number, number][]) {
      const f = await model("fence");
      f.position.set(x, 0, z);
      f.rotation.y = ry;
      this.scene.add(f);
    }
    for (const [x, z] of [[-1.5, 0.8], [-1.3, 7.5]] as [number, number][]) {
      const l = await model("lantern_post");
      l.position.set(x, 0, z);
      this.scene.add(l);
      this.colliders.push({ x, z, r: 0.25 });
    }
    // butterflies
    const wingM = [new THREE.MeshStandardMaterial({ color: "#F6D04D", side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: "#F2F2F2", side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ color: "#E98AB0", side: THREE.DoubleSide })];
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Group();
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(new THREE.CircleGeometry(0.12, 5), wingM[i % 3]);
        w.position.x = sx * 0.1;
        w.name = sx < 0 ? "wl" : "wr";
        b.add(w);
      }
      const center = new THREE.Vector3((rnd() - 0.5) * 36, 1 + rnd(), (rnd() - 0.5) * 36);
      b.position.copy(center);
      this.scene.add(b);
      this.butterflies.push({ obj: b, phase: rnd() * 10, center });
    }
  }

  private addFade(obj: THREE.Object3D) {
    const mats: THREE.MeshStandardMaterial[] = [];
    obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.material = (m.material as THREE.MeshStandardMaterial).clone();
      mats.push(m.material as THREE.MeshStandardMaterial);
    });
    this.fadeables.push({ obj, mats, opacity: 1 });
  }

  private updateFades(dt: number) {
    const p = this.player.position;
    for (const f of this.fadeables) {
      const dz = f.obj.position.z - p.z;
      const dx = Math.abs(f.obj.position.x - p.x);
      const blocking = !this.cinematic && f.obj.visible && dz > -3 && dz < 9 && dx < 2.6;
      const target = blocking ? 0.28 : 1;
      if (Math.abs(f.opacity - target) < 0.01) continue;
      f.opacity = THREE.MathUtils.lerp(f.opacity, target, Math.min(1, dt * 8));
      if (Math.abs(f.opacity - target) < 0.01) f.opacity = target;
      for (const m of f.mats) {
        m.transparent = f.opacity < 1;
        m.depthWrite = f.opacity >= 1;
        m.opacity = f.opacity;
      }
    }
  }

  private addSway(obj: THREE.Object3D) {
    obj.traverse((o) => {
      if (/^leaves/i.test(o.name)) this.swaying.push({ obj: o, phase: Math.random() * 10, base: o.rotation.clone() });
    });
  }

  // ---- input ------------------------------------------------------------------

  private bindInput() {
    const canvas = this.renderer.domElement;
    window.addEventListener("keydown", (e) => {
      if (this.paused || (e.target as HTMLElement).closest?.("input, textarea, .cm-editor")) return;
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === "e" || k === " ") {
        e.preventDefault();
        this.interact();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => this.keys.clear());
    canvas.addEventListener("wheel", (e) => {
      this.zoom = Math.min(1.45, Math.max(0.6, this.zoom + Math.sign(e.deltaY) * 0.08));
    }, { passive: true });
    canvas.addEventListener("pointerdown", (e) => {
      if (this.paused || this.cinematic || e.button !== 0) return;
      const ndc = new THREE.Vector2((e.clientX / canvas.clientWidth) * 2 - 1, -(e.clientY / canvas.clientHeight) * 2 + 1);
      this.raycaster.setFromCamera(ndc, this.camera);
      const things: (Node | Npc)[] = [...this.nodes.filter((n) => n.hp > 0), ...this.npcs];
      const hits = this.raycaster.intersectObjects(things.map((t) => t.obj), true);
      if (hits.length) {
        let o: THREE.Object3D | null = hits[0].object;
        while (o && !things.some((t) => t.obj === o)) o = o.parent;
        const thing = things.find((t) => t.obj === o);
        if (thing) {
          if (this.inReach(thing)) {
            this.target = null;
            this.doInteract(thing);
          } else {
            const dir = this.player.position.clone().sub(thing.pos).setY(0).normalize();
            this.target = thing.pos.clone().addScaledVector(dir, thing.radius + 0.9);
            this.pendingInteract = thing;
          }
          return;
        }
      }
      const p = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p)) {
        this.target = p;
        this.pendingInteract = null;
      }
    });
  }

  private inReach(t: Node | Npc) {
    return t.pos.distanceTo(this.player.position.clone().setY(0)) < t.radius + 1.5;
  }

  interact() {
    if (this.nearest) this.doInteract(this.nearest);
  }

  private doInteract(t: Node | Npc) {
    this.facing = Math.atan2(t.pos.x - this.player.position.x, t.pos.z - this.player.position.z);
    if ("kind" in t) {
      if (this.cooldown > 0 || t.hp <= 0) return;
      this.cooldown = 0.38;
      this.swing = 1;
      t.hp--;
      t.shake = 1;
      const hitPos = t.pos.clone().add(new THREE.Vector3(0, t.kind === "wood" ? 1.2 : 0.6, 0));
      if (t.kind === "wood") {
        sfx.chop();
        this.particles.chips(hitPos, "#C58B52");
        this.particles.chips(hitPos.clone().setY(3), "#7FB24A", 3);
      } else {
        sfx.clink();
        this.particles.chips(hitPos, "#A9A39A");
      }
      const sp = hitPos.clone().project(this.camera);
      this.hooks.gain(t.kind, ((sp.x + 1) / 2) * innerWidth, ((1 - sp.y) / 2) * innerHeight);
      if (t.hp <= 0) {
        t.respawnAt = this.time + RESPAWN_S;
        t.falling = 0.001;
      }
      return;
    }
    this.keys.clear();
    if (t.id === "rune") this.hooks.rune();
    else if (t.id === "pip") this.hooks.pip();
    else this.hooks.bram();
  }

  // ---- loop ---------------------------------------------------------------------

  private camOffset() {
    return new THREE.Vector3(0, 12.5, 13.5).multiplyScalar(this.zoom);
  }

  private resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer?.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.renderer.setAnimationLoop(() => this.frame());
  }

  private frame() {
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!this.cinematic && !this.paused) this.movePlayer(dt);
    else this.animatePlayer(dt, 0);
    if (!this.paused && this.keys.has("e") && this.nearest && "kind" in this.nearest) this.doInteract(this.nearest);
    this.updateNodes(dt);
    this.updateAmbient(dt);
    this.updateFades(dt);
    this.updateBuild(dt);
    this.updateCamera(dt);
    this.updatePrompt();
    this.particles.update(dt);
    this.tickSky(this.time, this.camera);
    this.tickMeadow(this.time);
    this.composer.render(dt);
  }

  private movePlayer(dt: number) {
    const k = this.keys;
    const dir = new THREE.Vector3((k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0), 0, (k.has("s") || k.has("arrowdown") ? 1 : 0) - (k.has("w") || k.has("arrowup") ? 1 : 0));
    if (dir.lengthSq() > 0) {
      this.target = null;
      this.pendingInteract = null;
    } else if (this.target) {
      dir.copy(this.target).sub(this.player.position).setY(0);
      if (dir.length() < 0.15) {
        this.target = null;
        const p = this.pendingInteract;
        this.pendingInteract = null;
        if (p && this.inReach(p)) this.doInteract(p);
        dir.set(0, 0, 0);
      }
    }
    let speed = 0;
    if (dir.lengthSq() > 0) {
      dir.normalize();
      speed = 5.2;
      this.facing = Math.atan2(dir.x, dir.z);
      const next = this.player.position.clone().addScaledVector(dir, speed * dt);
      this.resolve(next);
      this.player.position.copy(next);
    }
    this.animatePlayer(dt, speed);
  }

  private resolve(p: THREE.Vector3) {
    const pr = 0.35;
    for (let iter = 0; iter < 2; iter++) {
      for (const c of this.colliders) {
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const d = Math.hypot(dx, dz);
        const min = c.r + pr;
        if (d < min && d > 1e-5) {
          p.x = c.x + (dx / d) * min;
          p.z = c.z + (dz / d) * min;
        }
      }
    }
    const r = Math.hypot(p.x, p.z);
    if (r > PLAY_RADIUS - 1) p.multiplyScalar((PLAY_RADIUS - 1) / r);
    p.y = 0;
  }

  private animatePlayer(dt: number, speed: number) {
    let dRot = this.facing - this.player.rotation.y;
    dRot = Math.atan2(Math.sin(dRot), Math.cos(dRot));
    this.player.rotation.y += dRot * Math.min(1, dt * 12);
    const moving = speed > 0;
    this.walkPhase += dt * (moving ? 11 : 0);
    const sw = moving ? Math.sin(this.walkPhase) : 0;
    const p = this.parts;
    const set = (o: THREE.Object3D | undefined, x: number) => {
      if (!o) return;
      const rest = o.userData.rest as THREE.Euler;
      o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, rest.x + x, Math.min(1, dt * 14));
    };
    this.swing = Math.max(0, this.swing - dt * 3.2);
    const chop = this.swing > 0 ? Math.sin(this.swing * Math.PI) * -2.2 : 0;
    set(p.leg_l, sw * 0.7);
    set(p.leg_r, -sw * 0.7);
    set(p.arm_l, -sw * 0.6);
    set(p.arm_r, chop || sw * 0.6);
    if (p.body) p.body.position.y = (p.body.userData.restY as number) + (moving ? Math.abs(Math.sin(this.walkPhase)) * 0.06 : Math.sin(this.time * 2) * 0.012);
    if (p.head) p.head.rotation.z = moving ? 0 : Math.sin(this.time * 0.9) * 0.04;
  }

  private updateNodes(dt: number) {
    for (const n of this.nodes) {
      if (n.shake > 0) {
        n.shake = Math.max(0, n.shake - dt * 4);
        const s = Math.sin(n.shake * 30) * n.shake;
        if (n.kind === "wood") n.obj.rotation.z = s * 0.05;
        else n.obj.position.x = n.pos.x + s * 0.06;
      }
      if (n.falling > 0) {
        n.falling += dt;
        const t = Math.min(1, n.falling / 0.7);
        if (n.kind === "wood") {
          n.obj.rotation.z = (t * t * Math.PI) / 2.2;
          if (n.stump) n.stump.visible = true;
        } else n.obj.scale.setScalar(Math.max(0.0001, (1 - t) * (n.obj.userData.baseScale ??= n.obj.scale.x)));
        if (t >= 1) {
          n.falling = 0;
          n.obj.visible = false;
          this.particles.dust(n.pos, 6, 1);
        }
      }
      if (n.hp <= 0 && n.falling === 0 && this.time > n.respawnAt) {
        n.hp = NODE_HP;
        n.obj.visible = true;
        n.obj.rotation.z = 0;
        n.obj.userData.grow = 0.001;
        if (n.stump) n.stump.visible = false;
      }
      if (n.obj.userData.grow) {
        const g = (n.obj.userData.grow += dt / 0.8);
        const base = (n.obj.userData.baseScale ??= n.obj.scale.x) as number;
        n.obj.scale.setScalar(base * easeOutBack(Math.min(1, g)));
        if (g >= 1) n.obj.userData.grow = 0;
      }
    }
  }

  private updateAmbient(dt: number) {
    const t = this.time;
    for (const s of this.swaying) {
      s.obj.rotation.x = s.base.x + Math.sin(t * 1.1 + s.phase) * 0.025;
      s.obj.rotation.z = s.base.z + Math.cos(t * 0.8 + s.phase) * 0.025;
    }
    for (const b of this.butterflies) {
      const p = b.phase + t * 0.4;
      b.obj.position.set(b.center.x + Math.sin(p) * 3, b.center.y + Math.sin(p * 3) * 0.4, b.center.z + Math.cos(p * 0.7) * 3);
      b.obj.rotation.y = -p;
      const flap = Math.sin(t * 18 + b.phase) * 1.1;
      b.obj.getObjectByName("wl")!.rotation.y = flap;
      b.obj.getObjectByName("wr")!.rotation.y = -flap;
    }
    // Pip: gentle sway, head turns toward the player when close
    if (this.pip) {
      const head = this.pip.getObjectByName("pip_head");
      const toPlayer = Math.atan2(this.player.position.x - PIP_POS.x, this.player.position.z - PIP_POS.z);
      const near = this.player.position.distanceTo(PIP_POS) < 7;
      this.pip.rotation.y = THREE.MathUtils.lerp(this.pip.rotation.y, near ? toPlayer : -0.6, Math.min(1, dt * 3));
      if (head) {
        head.position.y = (head.userData.y ??= head.position.y) + Math.sin(t * 2.2) * 0.03;
        head.rotation.z = Math.sin(t * 1.3) * 0.12;
      }
      for (let i = 1; i <= 8; i++) {
        const s = this.pip.getObjectByName(`seg_${String(i).padStart(2, "0")}`);
        if (s) s.scale.setScalar(1 + Math.sin(t * 2.2 - i * 0.5) * 0.04);
      }
    }
    if (this.bram) {
      const b = this.bram.getObjectByName("body");
      if (b) b.position.y = (b.userData.y ??= b.position.y) + Math.sin(t * 1.8) * 0.015;
      const arm = this.bram.getObjectByName("arm_r");
      if (arm) arm.rotation.x = Math.sin(t * 3) * 0.3 - 0.6;
    }
    // chimney smoke once the chimney exists
    if (this.stageShown >= 10) {
      this.smokeTimer -= dt;
      if (this.smokeTimer <= 0) {
        this.smokeTimer = 0.45;
        this.particles.smoke(TAVERN_POS.clone().add(new THREE.Vector3(2.4, 8, -1.3)));
      }
    }
    // keep the shadow camera centred on the player
    this.sun.position.copy(this.player.position).addScaledVector(ATMOS.sunDir, 50);
    this.sun.target.position.copy(this.player.position);
  }

  private updateBuild(dt: number) {
    const b = this.building;
    if (!b) return;
    b.t += dt;
    const n = b.meshes.length;
    const stagger = Math.min(0.06, 1.4 / Math.max(1, n));
    let doneAll = true;
    b.meshes.forEach((m, i) => {
      const t = Math.max(0, Math.min(1, (b.t - 0.4 - i * stagger) / 0.45));
      if (t < 1) doneAll = false;
      const e = easeOutBack(t);
      m.scale.copy(b.base[i].s).multiplyScalar(Math.max(0.0001, e));
      m.position.y = b.base[i].y + (1 - t) * 2.5;
    });
    if (doneAll) {
      this.particles.sparkles(TAVERN_POS.clone().add(new THREE.Vector3(0, 1, 0)), 30, 4);
      this.building = null;
    }
  }

  private updateCamera(dt: number) {
    let pos: THREE.Vector3;
    let look: THREE.Vector3;
    const c = this.cinematic;
    if (c) {
      c.t += dt;
      pos = c.pos;
      look = c.look;
      if (c.t > c.dur) this.cinematic = null;
    } else {
      look = this.player.position.clone().add(new THREE.Vector3(0, 1, 0));
      pos = this.player.position.clone().add(this.camOffset());
    }
    this.cam.lerp(pos, Math.min(1, dt * (c ? 2 : 5)));
    this.camera.position.copy(this.cam);
    const curLook = (this.camera.userData.look ??= look.clone()) as THREE.Vector3;
    curLook.lerp(look, Math.min(1, dt * (c ? 2 : 6)));
    this.camera.lookAt(curLook);
  }

  private updatePrompt() {
    let best: Node | Npc | null = null;
    let bestD = Infinity;
    if (!this.paused && !this.cinematic) {
      const pp = this.player.position.clone().setY(0);
      for (const t of [...this.nodes, ...this.npcs]) {
        if ("kind" in t && t.hp <= 0) continue;
        const d = t.pos.distanceTo(pp) - t.radius;
        if (d < 1.5 && d < bestD) {
          best = t;
          bestD = d;
        }
      }
    }
    this.nearest = best;
    if (!best) return this.hooks.prompt(null, 0, 0);
    const label = "kind" in best ? (best.kind === "wood" ? "Chop" : "Mine") : best.label;
    const top = best.pos.clone().add(new THREE.Vector3(0, "kind" in best ? (best.kind === "wood" ? 2.4 : 1.6) : 1.9, 0)).project(this.camera);
    this.hooks.prompt(label, ((top.x + 1) / 2) * innerWidth, ((1 - top.y) / 2) * innerHeight);
  }

  /** Where the player stands, for the dev hook. */
  teleport(x: number, z: number) {
    this.player.position.set(x, 0, z);
  }
}
