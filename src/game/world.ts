import * as THREE from "three";
import { model, preload, realModels } from "./models.ts";
import { Particles } from "./particles.ts";
import { Animator, SWING, lineup, type AnimName } from "./anim.ts";
import { Blinker } from "./blink.ts";
import { sfx } from "./audio.ts";
import { ATMOS, WEATHER_U, addWeather, createComposer, createHills, createMeadow, createSky } from "./atmosphere.ts";
import { Weather } from "./weather.ts";
import { weatherState } from "./weather-state.ts";
import type { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { BUILDINGS } from "../content/index.ts";

export type Resource = "wood" | "stone";

export interface WorldHooks {
  /** A resource was gathered at this screen position. */
  gain(kind: Resource, x: number, y: number): void;
  /** The interaction prompt changed (null hides it). */
  prompt(label: string | null, x: number, y: number): void;
  rune(): void;
  pip(): void;
  /** Talk to the villager of this building. */
  villager(buildingId: string): void;
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
  /** "pip", "rune", or "v:<building id>" for a villager. */
  id: string;
  obj: THREE.Object3D;
  pos: THREE.Vector3;
  radius: number;
  label: string;
}

interface Collider {
  x: number;
  z: number;
  r: number;
  /** Only solid once this building has its first part. */
  site?: string;
}

const NODE_HP = 3;
const RESPAWN_S = 30;
const PLAY_RADIUS = 46;
const TAVERN_POS = new THREE.Vector3(0, 0, -7);
const RUNE_POS = new THREE.Vector3(6.2, 0, -1.6);
const PIP_POS = new THREE.Vector3(7.4, 0, -0.9);
const MILL_POS = new THREE.Vector3(-9, 0, -19);
const SPAWN = new THREE.Vector3(0, 0, 9);
const POND = { x: 13, z: 9, r: 4.2 };
/** Dirt paths (polyline points on the ground). */
const PATHS: [number, number][][] = [
  [
    [0, 14],
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
    [10, -2],
    [16, -4],
    [24, -2],
    [29, -1],
  ],
  // the market road splits round the square to its front entrance (the
  // southern buildings face the camera, so their doors are on the far side)
  [
    [0, 14],
    [-5, 15],
    [-8.6, 17],
    [-9.2, 21],
    [-9.2, 29],
    [-8.4, 31.2],
    [-4, 32.5],
    [0, 32.7],
  ],
  [
    [0, 14],
    [5, 15],
    [8.4, 17],
    [8.8, 21],
    [8.8, 29],
    [8, 31.2],
    [4, 32.5],
    [0, 32.7],
  ],
  // and on to the apothecary and bakery doors
  [
    [-9.2, 28.5],
    [-12.5, 29.8],
    [-16, 29.2],
  ],
  [
    [8.8, 28.5],
    [11.5, 29.8],
    [14.5, 29.3],
  ],
  // guild hall past the grove, library to the north-west
  [
    [-14, 1],
    [-22, 3],
    [-29, 10],
  ],
  [
    [-8, -5],
    [-20, -8],
    [-28, -9.5],
  ],
  // town hall and the clock tower
  [
    [7, -2],
    [8.5, -13],
    [13, -19],
  ],
  [
    [16, -4],
    [22, 4],
    [29, 16.5],
  ],
  // up the north hill to the observatory
  [
    [-8, -5],
    [-4.5, -13.5],
    [-2.5, -26],
    [0, -30.8],
  ],
  [
    [-1, -2.6],
    [-8, -5],
    [-8.6, -13],
    [-9, -15.8],
  ],
];

interface Rect {
  /** Centre offset from the site position. */
  x: number;
  z: number;
  hw: number;
  hd: number;
}

/** Where each building stands (ids match content/index.ts) and what its stages switch on. */
interface Site {
  pos: THREE.Vector3;
  /** Kept clear of decor and flattened. */
  area: Rect;
  /** Solid once the plot exists. */
  solid: Rect;
  villager?: THREE.Vector3;
  villagerRot?: number;
  /** Glow materials light from this stage on (the first stage that has any). */
  litAt: number;
  /** Rough height, for the default build camera. */
  height: number;
  /** Camera look-at and position for the build cinematic of stage n, relative to pos. */
  cine?(n: number): { look: [number, number, number]; view: [number, number, number] };
}

/** A site; `who` is where its villager stands, relative to the site: [dx, dz, facing]. */
const site = (x: number, z: number, area: Rect, solid: Rect, height: number, litAt: number, who?: [number, number, number]): Site => ({
  pos: new THREE.Vector3(x, 0, z),
  area,
  solid,
  height,
  litAt,
  ...(who ? { villager: new THREE.Vector3(x + who[0], 0, z + who[1]), villagerRot: who[2] } : {}),
});

const SITES: Record<string, Site> = {
  tavern: {
    pos: TAVERN_POS,
    area: { x: 0, z: 0, hw: 6, hd: 5.5 },
    solid: { x: 0, z: 0, hw: 3.6, hd: 2.6 },
    villager: new THREE.Vector3(2.3, 0, TAVERN_POS.z + 4.8),
    villagerRot: 0.2,
    litAt: 11,
    height: 8,
    cine: () => ({ look: [0, 2, 0], view: [7, 8, 13] }),
  },
  mill: {
    pos: MILL_POS,
    area: { x: -3, z: 0, hw: 6.5, hd: 5 },
    solid: { x: 0, z: 0, hw: 2.6, hd: 2.6 },
    villager: new THREE.Vector3(MILL_POS.x + 2.6, 0, MILL_POS.z + 4),
    villagerRot: -0.5,
    litAt: 14,
    height: 11,
    cine: (n) => (n >= 11 && n <= 13 ? { look: [-5, 0.8, 0], view: [-1, 9, 15] } : { look: [0, 4.6, 0], view: [9, 10, 26] }),
  },
  // footprints and glow stages from art/specs/<id>.md
  dock: site(13, 3, { x: -0.3, z: 2.85, hw: 4.6, hd: 6.9 }, { x: 0, z: -1.5, hw: 2.4, hd: 2.2 }, 6, 12, [2.6, 1.2, -0.5]),
  market: site(0, 24, { x: 0, z: 0.35, hw: 7.8, hd: 7.2 }, { x: 0, z: 0, hw: 0.6, hd: 0.6 }, 4.5, 4, [1.7, 1.9, 0.3]),
  bakery: site(14, 24, { x: 1.05, z: 0, hw: 5.2, hd: 4.1 }, { x: -0.5, z: 0, hw: 3, hd: 2.6 }, 7, 11, [-2.6, 3.7, 0.4]),
  forge: site(30, -6, { x: 0, z: 0, hw: 5.5, hd: 4.5 }, { x: 0, z: -0.5, hw: 3.6, hd: 2.6 }, 8, 5, [-2.4, 3.3, 0.4]),
  library: site(-30, -15, { x: 0.5, z: 0.5, hw: 6, hd: 5.5 }, { x: 0, z: 0, hw: 3.6, hd: 2.6 }, 10, 3, [2.7, 3.8, -0.4]),
  apothecary: site(-16, 22, { x: -0.5, z: 0.55, hw: 6.5, hd: 5 }, { x: 0.5, z: -0.5, hw: 3.4, hd: 2.6 }, 7.5, 14, [-1.8, 3.2, 0.3]),
  townhall: site(14, -25, { x: 0, z: 0, hw: 7.5, hd: 5.5 }, { x: 0, z: -1, hw: 5.4, hd: 3.4 }, 13.6, 14, [2.2, 3.8, -0.3]),
  clocktower: site(31, 13, { x: -1.2, z: 0.2, hw: 4.5, hd: 3.6 }, { x: 0, z: 0, hw: 1.8, hd: 1.8 }, 14.5, 12, [2.0, 2.9, -0.4]),
  guildhall: site(-31, 4, { x: 0, z: 0, hw: 9, hd: 5.5 }, { x: 0, z: -1, hw: 6, hd: 2.6 }, 8.5, 13, [3.4, 3.6, -0.3]),
  observatory: site(0, -37, { x: 0, z: 0.2, hw: 5.9, hd: 6.2 }, { x: 0, z: 0.2, hw: 4.4, hd: 4.4 }, 10.5, 16),
};

/** A camera that frames the whole building from the front-right. */
function defaultCine(s: Site) {
  const d = Math.max(14, Math.max(s.area.hw * 2, s.height * 1.3) * 1.35);
  return { look: [s.area.x, s.height * 0.4, s.area.z] as [number, number, number], view: [s.area.x + d * 0.3, s.height * 0.4 + d * 0.42, s.area.z + d * 0.9] as [number, number, number] };
}

/** 1 inside a site's area, fading to 0 four metres out. */
function siteMask(x: number, z: number) {
  let m = 0;
  for (const s of Object.values(SITES)) {
    const dx = Math.max(0, Math.abs(x - s.pos.x - s.area.x) - s.area.hw);
    const dz = Math.max(0, Math.abs(z - s.pos.z - s.area.z) - s.area.hd);
    m = Math.max(m, 1 - Math.min(1, Math.hypot(dx, dz) / 4));
  }
  return m;
}

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
/** Low spots on the paths where puddles gather when it rains. */
function puddleSpots() {
  let seed = 77;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const spots: { x: number; z: number; r: number }[] = [];
  for (const p of PATHS)
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, az] = p[i];
      const [bx, bz] = p[i + 1];
      const len = Math.hypot(bx - ax, bz - az);
      for (let d = 1.5; d < len - 1; d += 2.5 + rnd() * 3) {
        if (rnd() < 0.45) continue;
        const off = (rnd() - 0.5) * 0.7;
        const x = ax + ((bx - ax) * d) / len - ((bz - az) / len) * off;
        const z = az + ((bz - az) * d) / len + ((bx - ax) / len) * off;
        if (Math.hypot(x - POND.x, z - POND.z) > POND.r + 1.5) spots.push({ x, z, r: 0.35 + rnd() * 0.45 });
      }
    }
  return spots;
}

function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  let y = 0;
  if (r > PLAY_RADIUS - 2) {
    // a soft grassy rim around the valley, then gently rolling land out to the hills
    const t = Math.min(1, (r - (PLAY_RADIUS - 2)) / 14);
    y += (t * t * (3 - 2 * t) * 4 + noise2(x * 1.7, z * 1.7) * t * 1.4) * (1 - siteMask(x, z));
  }
  const dp = Math.hypot(x - POND.x, z - POND.z);
  if (dp < POND.r + 0.8) y -= (1 - Math.min(1, Math.max(0, (dp - POND.r + 0.8) / 1.6))) * 0.55;
  return y;
}

/** Visible along its whole parent chain. */
function isShown(o: THREE.Object3D) {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** Turn from angle a toward b the short way round. */
function lerpAngle(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
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
  private hemi!: THREE.HemisphereLight;
  private groundMat!: THREE.MeshStandardMaterial;
  /** Rain, wind, cloud and the time of day. */
  weather!: Weather;
  /** Lantern glows and lights that brighten at dusk and in rain (base strength in userData.glow / userData.base). */
  private glows = new Set<THREE.MeshStandardMaterial>();
  private lamps = new Set<THREE.PointLight>();
  private butterflyShow = 1;
  private particles: Particles;
  private player!: THREE.Object3D;
  /** Animations: the player's, and each villager's by building id (dev lineup: "dev:<model>"). */
  private anim!: Animator;
  private animators = new Map<string, Animator>();
  private playerLoop = "idle";
  /** A swing that lands on this node at this time, in sync with the chop/mine animation. */
  private pendingHit: { node: Node; at: number } | null = null;
  /** A short step in to striking distance before the swing. */
  private stepIn: { from: THREE.Vector3; to: THREE.Vector3; t: number } | null = null;
  /** Who the player is talking to while a dialogue is open. */
  private talkTo: string | null = null;
  /** When each villager last waved hello. */
  private greeted = new Map<string, number>();
  private pip!: THREE.Object3D;
  private pipEyes: Blinker | null = null;
  private villagers = new Map<string, THREE.Object3D>();
  private sites = new Map<string, { root: THREE.Object3D; stages: THREE.Object3D[]; shown: number; lights: THREE.PointLight[]; glow: THREE.MeshStandardMaterial[] }>();
  /** Named moving parts from the building specs (sails, clock hands, gears, bellows). */
  private special = new Map<string, THREE.Object3D>();
  private flags: { obj: THREE.Object3D; phase: number; base: number }[] = [];
  private smokers: { obj: THREE.Object3D; timer: number }[] = [];
  private nodes: Node[] = [];
  private npcs: Npc[] = [];
  private colliders: Collider[] = [];
  /** Leaves and plants sway; cloth flutters faster and leans further downwind. yaw: the parent's world turn, to lean the right way. */
  private swaying: { obj: THREE.Object3D; phase: number; base: THREE.Euler; cloth?: boolean; yaw?: number }[] = [];
  private butterflies: { obj: THREE.Object3D; phase: number; center: THREE.Vector3 }[] = [];
  private keys = new Set<string>();
  private target: THREE.Vector3 | null = null;
  private pendingInteract: Node | Npc | null = null;
  private facing = Math.PI;
  private cooldown = 0;
  private zoom = 1.2;
  /** Trees that turn see-through when they stand between the camera and the player. */
  private fadeables: { obj: THREE.Object3D; mats: THREE.MeshStandardMaterial[]; opacity: number }[] = [];
  private cam = new THREE.Vector3();
  private cinematic: { t: number; dur: number; look: THREE.Vector3; pos: THREE.Vector3 } | null = null;
  private building: { meshes: THREE.Object3D[]; base: { y: number; s: THREE.Vector3 }[]; t: number; at: THREE.Vector3 } | null = null;
  private smokeTimer = 0;
  private time = 0;
  private raycaster = new THREE.Raycaster();
  private nearest: Node | Npc | null = null;
  private composer: EffectComposer;
  private tickSky: (t: number, camera: THREE.Camera) => void = () => {};
  private tickMeadow: (wet: number) => void = () => {};

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

  /** progress: parts built per building id. */
  async build(progress: Record<string, number>) {
    await preload([...BUILDINGS.flatMap((b) => (b.villager ? [b.id, b.villager.model] : [b.id])), "tree_oak", "tree_pine", "tree_stump", "rock_large", "rock_small", "bush", "flowers", "grass_tuft", "fence", "log_pile", "stone_pile", "rune_stone", "signpost", "lantern_post", "player", "pip"]);
    this.tickSky = createSky(this.scene);
    createHills(this.scene);
    this.lights();
    this.ground();
    this.water();
    for (const b of BUILDINGS) await this.placeSite(b.id, progress[b.id] ?? 0);
    await this.placeVillage();
    await this.placeCharacters();
    await this.placeResources();
    await this.placeDecor();
    this.weather = new Weather(
      { scene: this.scene, sun: this.sun, hemi: this.hemi, ground: this.groundMat, grassWet: (w) => this.tickMeadow(w), pond: { ...POND, y: -0.18 }, puddles: puddleSpots() },
      this.camera,
    );
    // cloud shadows and the rainbow on everything lit; collect the lanterns for dusk
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) for (const mt of [m.material].flat()) addWeather(mt);
      const mt = m.material as THREE.MeshStandardMaterial | undefined;
      if (m.isMesh && mt?.name.toLowerCase().startsWith("glow")) {
        mt.userData.glow ??= mt.emissiveIntensity;
        this.glows.add(mt);
      }
      if ((o as THREE.PointLight).isPointLight) {
        o.userData.base ??= (o as THREE.PointLight).intensity;
        this.lamps.add(o as THREE.PointLight);
      }
    });
    this.bindInput();
    this.cam.copy(this.player.position).add(this.camOffset());
    this.camera.position.copy(this.cam);
  }

  private lights() {
    this.hemi = new THREE.HemisphereLight("#CFE0F0", "#86935F", 1.35);
    this.scene.add(this.hemi);
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
    this.groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true });
    const ground = new THREE.Mesh(geo, this.groundMat);
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

  private async placeSite(id: string, stage: number) {
    const site = SITES[id];
    const root = await model(id);
    root.position.copy(site.pos);
    this.scene.add(root);
    const stages: THREE.Object3D[] = [];
    for (let i = 1; ; i++) {
      const st = root.getObjectByName(`stage_${String(i).padStart(2, "0")}`);
      if (!st) break;
      stages.push(st);
    }
    const lights: THREE.PointLight[] = [];
    const glow: THREE.MeshStandardMaterial[] = [];
    root.traverse((o) => {
      if ((o as THREE.PointLight).isPointLight) lights.push(o as THREE.PointLight);
      const m = o as THREE.Mesh;
      const mt = m.material as THREE.MeshStandardMaterial | undefined;
      if (m.isMesh && mt?.name.toLowerCase().startsWith("glow")) {
        // own copy, so lighting this building doesn't light another
        m.material = mt.clone();
        glow.push(m.material as THREE.MeshStandardMaterial);
      }
      if (/^(wheat|herb|awning|banner|net_|bunting|bucket)/i.test(o.name) || (o.name === "sign" && id !== "tavern"))
        this.swaying.push({ obj: o, phase: o.position.x * 1.7 + o.position.z, base: o.rotation.clone(), cloth: /^(awning|banner|net_|bunting)/i.test(o.name) });
      if (/^flag/i.test(o.name)) this.flags.push({ obj: o, phase: o.position.x, base: o.rotation.y });
      if (o.name === "smoke") this.smokers.push({ obj: o, timer: Math.random() * 0.5 });
      if (["sails", "hand_hour", "hand_minute", "gear_01", "gear_02", "bellows_lever"].includes(o.name)) this.special.set(o.name, o);
    });
    this.sites.set(id, { root, stages, shown: 0, lights, glow });
    this.showStages(id, stage);
    // the plot turns solid once building starts (see the movement code)
    const r = site.solid;
    for (let x = -r.hw; x <= r.hw + 0.01; x += 1.2)
      for (let z = -r.hd; z <= r.hd + 0.01; z += 1.3) this.colliders.push({ x: site.pos.x + r.x + x, z: site.pos.z + r.z + z, r: 0.95, site: id });
  }

  private async placeVillage() {
    const rune = await model("rune_stone");
    rune.position.copy(RUNE_POS);
    rune.rotation.y = -0.5;
    rune.scale.setScalar(1.35);
    this.scene.add(rune);
    this.npcs.push({ id: "rune", obj: rune, pos: RUNE_POS, radius: 0.8, label: "Use the rune stone" });
    this.colliders.push({ x: RUNE_POS.x, z: RUNE_POS.z, r: 0.75 });
    const sign = await model("signpost");
    sign.position.set(-1.6, 0, 5);
    sign.rotation.y = 0.3;
    this.scene.add(sign);
    this.colliders.push({ x: -1.6, z: 5, r: 0.3 });
  }

  /** Parts built so far for a building. */
  stagesShown(id: string) {
    return this.sites.get(id)?.shown ?? 0;
  }

  showStages(id: string, n: number) {
    const site = this.sites.get(id);
    if (!site) return;
    site.shown = n;
    site.stages.forEach((st, i) => (st.visible = i < n));
    const lit = n >= SITES[id].litAt;
    for (const l of site.lights) l.intensity = l.userData.base = lit ? 5 : 0;
    for (const m of site.glow) m.emissiveIntensity = m.userData.glow = lit ? 2.6 : 0.15;
  }

  /** Reveal stage n of a building with a building animation and a short camera move. */
  buildStage(id: string, n: number) {
    this.showStages(id, n);
    const st = this.sites.get(id)?.stages[n - 1];
    if (!st) return;
    const site = SITES[id];
    const meshes: THREE.Object3D[] = [];
    st.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.parent === st) meshes.push(o);
    });
    if (!meshes.length) st.children.forEach((c) => meshes.push(c));
    const base = meshes.map((m) => ({ y: m.position.y, s: m.scale.clone() }));
    meshes.forEach((m) => m.scale.setScalar(0.0001));
    const { look, view } = site.cine?.(n) ?? defaultCine(site);
    const at = site.pos.clone().add(new THREE.Vector3(...look));
    this.building = { meshes, base, t: 0, at };
    this.cinematic = { t: 0, dur: 3.6, look: at, pos: site.pos.clone().add(new THREE.Vector3(...view)) };
    // the player casts toward the site while it builds, then celebrates as the camera comes back;
    // the building's villager is happy as the last part lands
    this.facing = Math.atan2(site.pos.x - this.player.position.x, site.pos.z - this.player.position.z);
    this.anim.queue("celebrate", 3.3, { big: n >= (this.sites.get(id)?.stages.length ?? 0) });
    this.animators.get(id)?.queue("happy", 2.2);
    sfx.build();
    this.particles.dust(at.clone().setY(0).add(new THREE.Vector3(0, 0, 3.5)), 14, 4);
  }

  /** Put a building's villager at their spot (once). */
  async showVillager(id: string) {
    if (this.villagers.has(id)) return;
    const b = BUILDINGS.find((x) => x.id === id);
    const site = SITES[id];
    if (!b?.villager || !site?.villager) return;
    const v = await model(b.villager.model);
    if (this.villagers.has(id)) return;
    this.villagers.set(id, v);
    this.animators.set(id, new Animator(v, b.villager.model));
    v.position.copy(site.villager);
    v.rotation.y = site.villagerRot ?? 0;
    v.userData.rot = site.villagerRot ?? 0;
    this.scene.add(v);
    if (this.weather) v.traverse((o) => (o as THREE.Mesh).isMesh && [(o as THREE.Mesh).material].flat().forEach(addWeather));
    this.npcs.push({ id: `v:${id}`, obj: v, pos: site.villager, radius: 0.5, label: `Talk to ${b.villager.name}` });
    this.colliders.push({ x: site.villager.x, z: site.villager.z, r: 0.4 });
  }

  private async placeCharacters() {
    this.player = await model("player");
    this.player.position.copy(SPAWN);
    this.player.rotation.y = this.facing;
    this.scene.add(this.player);
    this.anim = new Animator(this.player, "player");
    this.anim.talkIntensity = 0.6;
    await this.anim.attachTools();
    this.pip = await model("pip");
    this.pip.position.copy(PIP_POS);
    this.pip.scale.setScalar(1.6);
    this.scene.add(this.pip);
    this.pipEyes = Blinker.on(this.pip.getObjectByName("pip_head"));
    this.npcs.push({ id: "pip", obj: this.pip, pos: PIP_POS, radius: 0.5, label: "Talk to Pip" });
    this.colliders.push({ x: PIP_POS.x, z: PIP_POS.z, r: 0.45 });
  }

  private async placeResources() {
    // forest grove to the west, quarry to the east
    const trees: [number, number][] = [
      [-11, -3], [-13.5, 0.5], [-16, -2.5], [-12, 4.5], [-15.5, 6], [-18.5, 2], [-19, -5], [-14, -7.5], [-9.5, 8], [-17, 9.5], [-21, 6.5], [-16.5, -11],
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
      for (const st of Object.values(SITES)) if (Math.abs(x - st.pos.x - st.area.x) < st.area.hw + pad && Math.abs(z - st.pos.z - st.area.z) < st.area.hd + pad) return false;
      if (Math.hypot(x - POND.x, z - POND.z) < POND.r + 1 + pad) return false;
      if (Math.hypot(x - RUNE_POS.x, z - RUNE_POS.z) < 2.5 + pad) return false;
      for (const n of this.nodes) if (Math.hypot(x - n.pos.x, z - n.pos.z) < n.radius + 1.2 + pad) return false;
      return true;
    };
    // a ring of big trees around the valley edge
    let seed = 50;
    for (let i = 0; i < 110; i++) {
      const a = (i / 110) * Math.PI * 2 + rnd() * 0.05;
      const r = PLAY_RADIUS + 1 + rnd() * 9;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const kind = rnd() < 0.45 ? "tree_pine" : "tree_oak";
      if (siteMask(x, z) > 0.3) continue;
      const t = await model(kind, seed++);
      t.position.set(x, groundHeight(x, z) - 0.2, z);
      t.scale.setScalar(1.1 + rnd() * 0.6);
      t.rotation.y = rnd() * 6;
      this.scene.add(t);
      this.addSway(t);
      this.addFade(t);
    }
    for (let i = 0; i < 55; i++) {
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
    for (let i = 0; i < 120 && props.length; i++) {
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
      const swing = SWING[t.kind === "wood" ? "chop" : "mine"];
      this.cooldown = swing.dur;
      this.pendingHit = { node: t, at: this.time + swing.impact };
      // step in (or back) to striking distance: just outside the trunk, or a stride from the rock's face
      const away = this.player.position.clone().sub(t.pos).setY(0);
      const d = Math.max(away.length(), 1e-3);
      away.divideScalar(d);
      let reach = t.radius + 0.38;
      if (t.kind === "stone") {
        // the pick lands about 0.62 m ahead at knee-to-waist height: stand that far from the rock's face there
        for (const y of [0.35, 0.12]) {
          this.raycaster.set(t.pos.clone().addScaledVector(away, 4).setY(y), away.clone().negate());
          const face = this.raycaster.intersectObject(t.obj, true)[0];
          if (face) {
            reach = 4 - face.distance + (y > 0.2 ? 0.62 : 0.5);
            break;
          }
        }
      }
      const stand = Math.abs(d - reach) > 0.04 ? t.pos.clone().addScaledVector(away, reach) : this.player.position.clone();
      if (!stand.equals(this.player.position)) this.stepIn = { from: this.player.position.clone(), to: stand, t: 0 };
      // a low stone is struck where its top is, a boulder on its face
      let aim = 0;
      if (t.kind === "stone") {
        this.raycaster.set(stand.clone().addScaledVector(away, -0.62).setY(5), new THREE.Vector3(0, -1, 0));
        const top = this.raycaster.intersectObject(t.obj, true)[0]?.point.y ?? 0;
        aim = THREE.MathUtils.clamp((top - 0.25) / 0.8, 0, 0.3);
      }
      this.anim.play(t.kind === "wood" ? "chop" : "mine", { aim });
      return;
    }
    this.keys.clear();
    if (t.id !== "rune") this.talkTo = t.id;
    if (t.id === "rune") this.hooks.rune();
    else if (t.id === "pip") this.hooks.pip();
    else if (t.id.startsWith("v:")) this.hooks.villager(t.id.slice(2));
  }

  /** The tool lands: chips fly, the resource is gained. */
  private hit(t: Node) {
    if (t.hp <= 0) return;
    t.hp--;
    t.shake = 1;
    const hitPos = t.pos.clone().add(new THREE.Vector3(0, t.kind === "wood" ? 0.8 : 0.6, 0));
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
    if (this.stepIn) {
      const s = this.stepIn;
      s.t = Math.min(1, s.t + dt / 0.15);
      this.player.position.lerpVectors(s.from, s.to, s.t * s.t * (3 - 2 * s.t));
      if (s.t >= 1) this.stepIn = null;
    }
    if (this.pendingHit && this.time >= this.pendingHit.at) {
      this.hit(this.pendingHit.node);
      this.pendingHit = null;
    }
    if (!this.cinematic && !this.paused) this.movePlayer(dt);
    else this.animatePlayer(dt, 0);
    if (!this.paused && this.keys.has("e") && this.nearest && "kind" in this.nearest) this.doInteract(this.nearest);
    this.updateNodes(dt);
    this.weather.update(dt, this.player.position);
    this.updateAmbient(dt);
    this.updateFades(dt);
    this.updateBuild(dt);
    this.updateCamera(dt);
    this.updatePrompt();
    this.particles.update(dt);
    this.tickSky(this.time, this.camera);
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
      // Shift runs, and so does a long click-to-walk trip (easing into a walk near the end)
      speed = k.has("shift") || (this.target !== null && this.target.distanceTo(this.player.position) > 7) ? 7.4 : 5.2;
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
        if (c.site && !this.stagesShown(c.site)) continue;
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
    // cast while a stage builds, talk while a dialogue is open; look at whoever is in reach
    if (this.talkTo && !this.paused) this.talkTo = null;
    const loop = this.building ? "cast" : this.talkTo ? "talk" : "idle";
    if (loop !== this.playerLoop) this.anim.setLoop((this.playerLoop = loop));
    const p = this.player.position;
    const tgt = this.talkTo ? this.npcs.find((n) => n.id === this.talkTo) : this.nearest;
    this.anim.lookAt(tgt ? Math.atan2(tgt.pos.x - p.x, tgt.pos.z - p.z) - this.player.rotation.y : null);
    this.anim.update(dt, speed, speed > 6);
    for (const [k, a] of this.animators) if (k.startsWith("dev:")) a.update(dt);
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
          if (n.pos.distanceTo(this.player.position) < n.radius + 2.2 && !this.anim.busy) this.anim.play("pickup");
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
    // everything that moves in the wind follows its strength, leaning downwind
    const w = weatherState.wind;
    const wt = this.weather.windTime;
    const dir = WEATHER_U.windDir.value;
    for (const s of this.swaying) {
      if (s.yaw === undefined) s.yaw = new THREE.Euler().setFromQuaternion(s.obj.parent?.getWorldQuaternion(new THREE.Quaternion()) ?? new THREE.Quaternion(), "YXZ").y;
      const lx = dir.x * Math.cos(s.yaw) - dir.y * Math.sin(s.yaw);
      const lz = dir.x * Math.sin(s.yaw) + dir.y * Math.cos(s.yaw);
      const amp = s.cloth ? 0.015 + w * 0.08 : 0.01 + w * 0.05;
      const lean = (s.cloth ? 0.1 : 0.035) * w;
      const f = s.cloth ? 2.4 : 1;
      s.obj.rotation.x = s.base.x + lz * lean + Math.sin(wt * 1.1 * f + s.phase) * amp;
      s.obj.rotation.z = s.base.z - lx * lean + Math.cos(wt * 0.8 * f + s.phase) * amp;
    }
    this.particles.wind.set(dir.x, 0, dir.y).multiplyScalar(0.2 + w * 2.6);
    // lanterns glow brighter at dusk, at night and under rain clouds
    const boost = 1 + this.weather.lamps * 1.3;
    for (const m of this.glows) m.emissiveIntensity = m.userData.glow > 1 ? m.userData.glow * boost : m.userData.glow;
    for (const l of this.lamps) l.intensity = l.userData.base * (0.8 + this.weather.lamps * 1.7);
    // butterflies shelter from rain and settle for the night
    const show = (1 - THREE.MathUtils.smoothstep(weatherState.rain, 0.08, 0.3)) * (1 - THREE.MathUtils.smoothstep(this.weather.night, 0.4, 0.7));
    this.butterflyShow = THREE.MathUtils.lerp(this.butterflyShow, show, Math.min(1, dt * 0.8));
    for (const b of this.butterflies) {
      b.obj.visible = this.butterflyShow > 0.02;
      b.obj.scale.setScalar(this.butterflyShow);
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
      // Pip blinks, and blinks again on turning to the player
      if (near !== this.pip.userData.near) this.pipEyes?.blink();
      this.pip.userData.near = near;
      this.pipEyes?.update(dt);
      for (let i = 1; i <= 8; i++) {
        const s = this.pip.getObjectByName(`seg_${String(i).padStart(2, "0")}`);
        if (s) s.scale.setScalar(1 + Math.sin(t * 2.2 - i * 0.5) * 0.04);
      }
    }
    // villagers (anim.ts): the head turns to the player first and the body follows; they wave
    // hello when the player comes close (the player waves back) and gesture while talking
    for (const [id, v] of this.villagers) {
      const d = this.player.position.distanceTo(v.position);
      const near = d < 5;
      const to = Math.atan2(this.player.position.x - v.position.x, this.player.position.z - v.position.z);
      v.rotation.y = lerpAngle(v.rotation.y, near ? to : v.userData.rot, Math.min(1, dt * 3));
      const a = this.animators.get(id);
      if (!a) continue;
      a.lookAt(near ? to - v.rotation.y : null);
      const talking = this.talkTo === `v:${id}`;
      if (talking !== !!v.userData.talking) a.setLoop((v.userData.talking = talking) ? "talk" : "idle");
      if (d < 4.2 && !talking && !this.paused && !this.cinematic && t - (this.greeted.get(id) ?? -1e9) > 60) {
        this.greeted.set(id, t);
        a.queue("wave", 0.25);
        if (!this.anim.busy) this.anim.queue("wave", 0.6);
      }
      a.update(dt);
    }
    // sails turn once they're up
    const sp = (n: string) => this.special.get(n);
    if (sp("sails") && this.stagesShown("mill") >= 10) sp("sails")!.rotation.z -= dt * (0.25 + w * 1.5);
    for (const f of this.flags) f.obj.rotation.y = f.base + Math.sin(wt * 1.9 + f.phase) * (0.05 + w * 0.42) + Math.sin(wt * 8.3 + f.phase) * (0.01 + w * 0.1);
    if (sp("bellows_lever")) sp("bellows_lever")!.rotation.x = Math.sin(t * 2.2) * 0.17;
    // the clock runs once the tower is finished (it stopped at the Long Quiet)
    if (sp("hand_hour") && this.stagesShown("clocktower") >= 14) {
      const d = new Date();
      const h = d.getHours() % 12 + d.getMinutes() / 60;
      sp("hand_hour")!.rotation.z = -(h / 12) * Math.PI * 2;
      sp("hand_minute")!.rotation.z = -((d.getMinutes() + d.getSeconds() / 60) / 60) * Math.PI * 2;
      if (sp("gear_01")) {
        sp("gear_01")!.rotation.z -= dt * 0.6;
        if (sp("gear_02")) sp("gear_02")!.rotation.z = -sp("gear_01")!.rotation.z * 1.6;
      }
    }
    for (const s of this.smokers) {
      if (!isShown(s.obj)) continue;
      s.timer -= dt;
      if (s.timer <= 0) {
        s.timer = 0.5;
        this.particles.smoke(s.obj.getWorldPosition(new THREE.Vector3()));
      }
    }
    // chimney smoke once the chimney exists
    if (this.stagesShown("tavern") >= 10) {
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
      this.particles.sparkles(b.at, 30, 4);
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

  /** Dev: play an animation on the player, a villager (building id or model id), a lineup model, or "all". */
  playAnim(name: AnimName, who = "player", big = false) {
    const list = who === "all" ? [this.anim, ...this.animators.values()] : who === "player" ? [this.anim] : [...this.animators.entries()].filter(([k, a]) => k === who || k === `dev:${who}` || a.id === who).map(([, a]) => a);
    for (const a of list) a.play(name, { big });
    return list.length;
  }

  /** Dev: every character in a row just in front of the player, to try the animations on. */
  async animLineup() {
    const at = this.player.position.clone().add(new THREE.Vector3(0, 0, 2.6));
    for (const [id, a] of await lineup(this.scene, at)) this.animators.set(`dev:${id}`, a);
  }

  /** Where the player stands, for the dev hook. */
  teleport(x: number, z: number) {
    this.player.position.set(x, 0, z);
  }
}
