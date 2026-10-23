import * as THREE from "three";
import { model, preload, realModels } from "./models.ts";

// Character animation. The models have no skeleton: each character is a `body` (origin on the
// ground) with `head`, `arm_l`, `arm_r`, `leg_l` and `leg_r` children pivoting at their joints
// (art/specs/characters.md). An Animator poses those parts every frame from three layers:
//   loop     idle, talk or cast, blended with walk/run by speed (all procedural cycles)
//   action   a one-shot keyframed clip (chop, mine, wave, ...) that overrides some parts
//   fade     a snapshot of the last pose, faded out over a short time on every change,
//            so any clip can start or stop from any pose without popping
// The body pivots at the hips and the legs counter its lean and sway, so the feet stay planted.
// Offsets are in radians (rx: lean/nod forward, or a limb swinging back; ry: turn to the
// character's left; rz: tilt toward their right, or a limb out to their left) and metres.

export const PARTS = ["body", "head", "arm_l", "arm_r", "leg_l", "leg_r"] as const;
export type PartName = (typeof PARTS)[number];
type ArmName = "arm_l" | "arm_r";

export type LoopName = "idle" | "talk" | "cast";
export type ClipName = "chop" | "mine" | "pickup" | "wave" | "celebrate" | "stretch" | "happy" | "fidget";
export type AnimName = LoopName | ClipName | "walk" | "run";

/** When the tool lands (seconds into the swing) and how long a swing lasts; the world syncs hits to these. */
/** Tools are drawn a little bigger than life so they read from the game camera. */
const TOOL_SCALE = 1.2;

export const SWING = {
  chop: { impact: 0.215, dur: 0.5 },
  mine: { impact: 0.285, dur: 0.6 },
} as const;

// ---- poses ---------------------------------------------------------------------

class Pose {
  readonly v = {} as Record<PartName, Float32Array>;
  constructor() {
    for (const p of PARTS) this.v[p] = new Float32Array(6);
  }
  clear() {
    for (const p of PARTS) this.v[p].fill(0);
    return this;
  }
  copy(o: Pose) {
    for (const p of PARTS) this.v[p].set(o.v[p]);
    return this;
  }
  clone() {
    return new Pose().copy(this);
  }
  add(p: PartName, rx = 0, ry = 0, rz = 0, px = 0, py = 0, pz = 0) {
    const a = this.v[p];
    a[0] += rx;
    a[1] += ry;
    a[2] += rz;
    a[3] += px;
    a[4] += py;
    a[5] += pz;
    return this;
  }
  /** this += (o - this) * w over the given parts. */
  mix(o: Pose, w: number, parts: readonly PartName[] = PARTS) {
    for (const p of parts) {
      const a = this.v[p];
      const b = o.v[p];
      for (let c = 0; c < 6; c++) a[c] += (b[c] - a[c]) * w;
    }
    return this;
  }
}

// ---- easing and keyframes -------------------------------------------------------

type Ease = (x: number) => number;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const io: Ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);
const easeIn: Ease = (x) => x * x * x;
const out: Ease = (x) => 1 - (1 - x) ** 3;
const lin: Ease = (x) => x;
const back: Ease = (x) => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2;
/** 0 → 1 → 0 bump between a and b. */
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
/** 0 outside [a, b], 1 inside, with soft edges of width f. */
const env = (t: number, a: number, b: number, f = 0.12) => clamp01((t - a) / f) * clamp01((b - t) / f);

/** A keyed scalar: [time, value, easing into this key]. */
function curve(keys: [number, number, Ease?][]) {
  return (t: number) => {
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const [t1, b, ease = io] = keys[i + 1];
    return a + (b - a) * ease(clamp01((t - t0) / (t1 - t0)));
  };
}

/** Partial pose: [rx, ry, rz, px, py, pz] per part; missing parts and channels are 0. */
type KeyPose = Partial<Record<PartName, number[]>>;
/** [time, pose, easing into this key (default in-out)] */
type Key = [number, KeyPose, Ease?];

/** A keyframed clip body: adds the interpolated pose at t to P; s scales positions to the character. */
function keyed(keys: Key[]) {
  return (t: number, P: Pose, s = 1) => {
    let i = 0;
    while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
    const [t0, a] = keys[i];
    const [t1, b, ease = io] = keys[i + 1];
    const u = ease(clamp01((t - t0) / (t1 - t0)));
    for (const p of PARTS) {
      const va = a[p];
      const vb = b[p];
      if (!va && !vb) continue;
      const d = P.v[p];
      for (let c = 0; c < 6; c++) {
        const x = va?.[c] ?? 0;
        const y = vb?.[c] ?? 0;
        d[c] += (x + (y - x) * u) * (c >= 3 ? s : 1);
      }
    }
  };
}

// ---- characters ----------------------------------------------------------------

interface Clip {
  dur: number;
  /** Parts the clip drives; the loop keeps the rest (so a wave works while walking). */
  parts: readonly PartName[];
  pose(t: number, P: Pose, a: Animator): void;
  tool?: "axe" | "pickaxe";
  /** Scale arm swings by the character's prop-arm limits. */
  gain?: boolean;
  /** Stops when the character starts moving. */
  cancelOnMove?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

interface Style {
  /** Walk/run stride, cadence, side-to-side waddle, bounce and arm swing, all relative to the player. */
  stride: number;
  cadence: number;
  waddle: number;
  bounce: number;
  armSwing: number;
  /** Arms held a little out from a round belly. */
  armOut: number;
  /** Head pitch at rest (a stoop is positive). */
  stoop: number;
  /** Limits for arms that hold props (1 = free). */
  gain: Record<ArmName, number>;
  /** The free arm used to wave and gesture. */
  wave: ArmName;
  /** A personal idle touch played now and then while the player isn't close. */
  fidget?: Clip;
  /** Continuous personal motion added to the idle loop. */
  idle?(t: number, P: Pose): void;
}

const ALL = PARTS;

const BASE: Style = { stride: 1, cadence: 1, waddle: 1, bounce: 1, armSwing: 1, armOut: 0.1, stoop: 0, gain: { arm_l: 1, arm_r: 1 }, wave: "arm_r" };
const style = (o: Partial<Omit<Style, "gain">> & { gain?: Partial<Style["gain"]> }): Style => ({ ...BASE, ...o, gain: { ...BASE.gain, ...o.gain } });
const fidget = (dur: number, parts: readonly PartName[], keys: Key[], extra?: (t: number, P: Pose) => void): Clip => {
  const k = keyed(keys);
  return { dur, parts, cancelOnMove: true, fadeIn: 0.2, fadeOut: 0.3, pose: (t, P, a) => (k(t, P, a.size), extra?.(t, P)) };
};

/** Per-character tuning by model id: body type, prop arms, and a small personal touch. */
const STYLES: Record<string, Style> = {
  player: BASE,
  // Bram: round and heavy; polishes the mug in his right hand, and now and then holds it up to the light
  innkeeper: style({
    waddle: 1.6, bounce: 0.7, cadence: 0.88, armSwing: 0.7, armOut: 0.22, gain: { arm_r: 0.6 }, wave: "arm_l",
    idle: (t, P) => P.add("arm_r", -0.6 + Math.sin(t * 3) * 0.28, Math.sin(t * 3 + 1.2) * 0.12),
    fidget: fidget(2.2, ["arm_r", "head", "body"], [
      [0, {}], [0.45, { arm_r: [-0.85, 0.35, 0], head: [-0.08, -0.32, 0.06] }], [0.75, { arm_r: [-0.95, 0.4, 0], head: [-0.12, -0.36, 0.1] }],
      [1.5, { arm_r: [-0.95, 0.4, 0], head: [-0.1, -0.34, -0.06], body: [-0.03] }], [2.2, {}],
    ], (t, P) => P.add("arm_r", -0.6 * (1 - bump(t, 0, 2.2)))),
  }),
  // Wren: tips the brim of her big straw hat
  miller: style({
    gain: { arm_l: 1, arm_r: 1 }, wave: "arm_r",
    fidget: fidget(1.6, ["arm_r", "head"], [
      [0, {}], [0.4, { arm_r: [-2.35, 0.55, 0.15], head: [0.04, 0.08, -0.05] }, back], [0.7, { arm_r: [-2.25, 0.5, 0.15], head: [0.16, 0.08, -0.05] }],
      [1.0, { arm_r: [-2.3, 0.55, 0.15], head: [0.02, 0.06, -0.04] }], [1.6, {}],
    ]),
  }),
  // Marlo: the rod bobs as if the line is in the water; sometimes he flicks it
  fisher: style({
    cadence: 0.9, armSwing: 0.7, gain: { arm_r: 0.3, arm_l: 0.5 }, wave: "arm_l",
    idle: (t, P) => P.add("arm_r", Math.sin(t * 1.3) * 0.035 + Math.sin(t * 3.1) * 0.01),
    fidget: fidget(1.5, ["arm_r", "head", "body"], [
      [0, {}], [0.35, { arm_r: [0.18, 0, 0], head: [-0.06], body: [-0.03] }], [0.5, { arm_r: [-0.32, 0, 0], head: [0.04], body: [0.03] }, easeIn],
      [0.7, { arm_r: [-0.22, 0, 0], head: [0.05] }, out], [1.5, {}],
    ]),
  }),
  // Sable: jingles the coin purse, smug
  merchant: style({
    gain: { arm_l: 0.4 }, wave: "arm_r",
    fidget: fidget(1.7, ["arm_l", "head", "body"], [
      [0, {}], [0.3, { arm_l: [-0.38, 0, 0.05], head: [-0.05, 0.12, -0.1], body: [0, 0.1] }],
      [1.3, { arm_l: [-0.38, 0, 0.05], head: [-0.06, 0.14, -0.12], body: [0, 0.1] }], [1.7, {}],
    ], (t, P) => P.add("arm_l", Math.abs(Math.sin((t - 0.3) * 13)) * -0.16 * env(t, 0.35, 1.25, 0.08))),
  }),
  // Hazel: rolls out dough with the rolling pin
  baker: style({
    gain: { arm_r: 0.6 }, wave: "arm_l",
    fidget: fidget(2.4, ["arm_r", "arm_l", "head", "body"], [
      [0, {}], [0.35, { arm_r: [-0.6, 0.3, 0], arm_l: [-0.5, -0.35, 0], body: [0.1], head: [0.18] }],
      [2.0, { arm_r: [-0.6, 0.3, 0], arm_l: [-0.5, -0.35, 0], body: [0.1], head: [0.18] }], [2.4, {}],
    ], (t, P) => {
      const r = Math.sin((t - 0.35) * Math.PI * 2 * 1.4) * env(t, 0.35, 2.0, 0.15);
      P.add("arm_r", r * 0.22).add("arm_l", r * 0.22).add("body", r * 0.04, 0, 0, 0, Math.abs(r) * -0.006);
    }),
  }),
  // Ingrid: broad and sturdy; taps her hammer twice
  smith: style({
    waddle: 1.3, bounce: 0.75, cadence: 0.92, armOut: 0.18, gain: { arm_r: 0.4 }, wave: "arm_l",
    fidget: fidget(1.9, ["arm_r", "head", "body"], [
      [0, {}], [0.35, { arm_r: [-1.15, 0.2, 0], head: [0.1], body: [0.04] }], [0.43, { arm_r: [-0.3, 0.2, 0], head: [0.16], body: [0.07] }, easeIn],
      [0.6, { arm_r: [-0.95, 0.2, 0], head: [0.1], body: [0.04] }, out], [0.68, { arm_r: [-0.3, 0.2, 0], head: [0.16], body: [0.07] }, easeIn],
      [0.95, { arm_r: [-0.5, 0.2, 0], head: [0.06] }, out], [1.9, {}],
    ]),
  }),
  // Odo: thin and stooped; pushes his spectacles up
  librarian: style({
    armSwing: 0.7, bounce: 0.8, stoop: 0.08, gain: { arm_l: 0.3 }, wave: "arm_r",
    fidget: fidget(1.5, ["arm_r", "head"], [
      [0, {}], [0.4, { arm_r: [-2.2, 0.75, 0.3], head: [0.05] }], [0.6, { arm_r: [-2.32, 0.75, 0.3], head: [-0.06] }],
      [0.9, { arm_r: [-2.25, 0.75, 0.3], head: [-0.04] }], [1.5, {}],
    ]),
  }),
  // Mirela: lifts her basket and smells the flowers
  herbalist: style({
    gain: { arm_l: 0.3 }, wave: "arm_r",
    idle: (t, P) => P.add("body", 0, 0, Math.sin(t * 0.6) * 0.02),
    fidget: fidget(2.4, ["arm_l", "head", "body"], [
      [0, {}], [0.5, { arm_l: [-0.32, 0, 0], head: [0.3, 0.35, -0.12], body: [0.06, 0.12] }],
      [1.3, { arm_l: [-0.34, 0, 0], head: [0.32, 0.36, -0.12], body: [0.06, 0.12, 0, 0, 0.012] }],
      [1.8, { head: [-0.08, 0.1, 0.1], body: [-0.02, 0.04] }], [2.4, {}],
    ]),
  }),
  // Thistle: the roundest; puffs out his chest and taps his cane
  mayor: style({
    waddle: 1.8, bounce: 0.6, cadence: 0.85, armSwing: 0.6, armOut: 0.25, gain: { arm_r: 0.25 }, wave: "arm_l",
    fidget: fidget(2.0, ["arm_r", "head", "body"], [
      [0, {}], [0.4, { body: [-0.07, 0, 0, 0, 0.012], head: [-0.14] }], [0.7, { body: [-0.07, 0, 0, 0, 0.012], head: [-0.14], arm_r: [-0.28] }],
      [0.82, { body: [-0.07, 0, 0, 0, 0.012], head: [-0.12], arm_r: [0.04] }, easeIn], [1.05, { body: [-0.06, 0, 0, 0, 0.01], head: [-0.14], arm_r: [-0.25] }, out],
      [1.17, { body: [-0.06, 0, 0, 0, 0.01], head: [-0.12], arm_r: [0.04] }, easeIn], [2.0, {}],
    ]),
  }),
  // Tock: small and fidgety; flicks his wrench round
  tinker: style({
    cadence: 1.25, stride: 0.85, bounce: 1.2, gain: { arm_r: 0.6 }, wave: "arm_l",
    idle: (t, P) => P.add("body", 0, 0, 0, 0, Math.abs(Math.sin(t * 2.6)) * 0.006),
    fidget: fidget(1.3, ["arm_r", "head"], [
      [0, {}], [0.25, { arm_r: [-0.7, 0.2, -0.3], head: [0.1, -0.15] }], [0.38, { arm_r: [-0.75, 0.2, 0.15], head: [0.1, -0.12, 0.06] }, easeIn],
      [0.5, { arm_r: [-0.7, 0.2, -0.3], head: [0.1, -0.15] }, easeIn], [0.62, { arm_r: [-0.75, 0.2, 0.15], head: [0.1, -0.12, 0.06] }, easeIn],
      [1.3, {}],
    ]),
  }),
  // Rook: rests a hand on his sword and scans the horizon
  captain: style({
    armSwing: 0.8, gain: { arm_l: 0.3 }, wave: "arm_r",
    fidget: fidget(3.2, ["arm_l", "head", "body"], [
      [0, {}], [0.4, { arm_l: [0.12, 0, -0.16], body: [-0.04] }], [1.2, { arm_l: [0.12, 0, -0.16], body: [-0.04], head: [-0.04, 0.6] }],
      [1.6, { arm_l: [0.12, 0, -0.16], body: [-0.04], head: [-0.04, 0.6] }], [2.5, { arm_l: [0.12, 0, -0.16], body: [-0.04], head: [-0.04, -0.5] }],
      [3.2, {}],
    ]),
  }),
  // Aldous Vane: tall and stiff; twirls his moustache
  lord_vane: style({
    cadence: 0.85, stride: 0.9, bounce: 0.55, armSwing: 0.55, waddle: 0.6, gain: { arm_l: 0.4 }, wave: "arm_r",
    fidget: fidget(2.0, ["arm_r", "head"], [
      [0, {}], [0.45, { arm_r: [-2.05, 0.65, 0.3], head: [-0.12, -0.1, 0.06] }], [1.6, { arm_r: [-2.05, 0.65, 0.3], head: [-0.14, -0.12, 0.08] }], [2.0, {}],
    ], (t, P) => P.add("arm_r", 0, 0, Math.sin((t - 0.45) * 16) * 0.07 * env(t, 0.5, 1.55, 0.1))),
  }),
};

// ---- clips ---------------------------------------------------------------------

const chopKeys = keyed([
  [0, {}],
  // wind-up: twist right and lift the axe over the right shoulder, eyes stay on the trunk
  [0.17, { body: [-0.06, -0.55, 0.05, 0, -0.012], head: [0.02, 0.45, -0.05], arm_r: [-2.25, -0.95, -0.35], arm_l: [-0.6, 0.5, 0.15], leg_l: [-0.18, 0.55], leg_r: [0.12, 0.55] }],
  // the swing comes down and across, accelerating into the trunk
  [0.215, { body: [0.08, 0.05, -0.02, 0, -0.03], head: [0.14, -0.04, 0.03], arm_r: [-1.3, 0.05, -0.08], arm_l: [-0.3, 0.1, 0.12], leg_l: [-0.18, -0.05], leg_r: [0.12, -0.05] }, easeIn],
  // a beat on the hit, bouncing back a little
  [0.255, { body: [0.09, 0.03, -0.02, 0, -0.035], head: [0.15, -0.03, 0.04], arm_r: [-1.4, -0.03, -0.08], arm_l: [-0.3, 0.1, 0.12], leg_l: [-0.18, -0.03], leg_r: [0.12, -0.03] }, lin],
  // follow through and settle
  [0.36, { body: [0.05, 0.3, -0.03, 0, -0.01], head: [0.06, -0.15, 0.02], arm_r: [-0.85, 0.5, 0.05], arm_l: [-0.2, -0.1, 0.08], leg_l: [-0.1, -0.3], leg_r: [0.06, -0.3] }, out],
  [0.5, {}],
]);

/** Wrist: + cocks the tool back along the arm, - snaps the head forward. */
const chopWrist = curve([[0, 0], [0.17, 0.45], [0.215, -0.12, easeIn], [0.255, -0.05, lin], [0.36, -0.2, out], [0.5, 0]]);
const mineWrist = curve([[0, 0], [0.2, 0.35], [0.235, 0.4, lin], [0.285, -0.1, easeIn], [0.36, 0.05, out], [0.6, 0]]);

const mineKeys = keyed([
  [0, {}],
  // both hands lift the pick high, leaning back onto the heels
  [0.2, { body: [-0.14, -0.35, 0, 0, 0.03], head: [-0.2, 0.3], arm_r: [-2.75, 0.75, 0], arm_l: [-2.65, -0.75, 0], leg_l: [-0.1, 0.35], leg_r: [0.08, 0.35] }],
  // hang at the top
  [0.235, { body: [-0.16, -0.36, 0, 0, 0.035], head: [-0.22, 0.31], arm_r: [-2.85, 0.75, 0], arm_l: [-2.75, -0.75, 0], leg_l: [-0.1, 0.36], leg_r: [0.08, 0.36] }, lin],
  // drive it down into the rock
  [0.285, { body: [0.3, -0.38, 0, 0, -0.045], head: [0.25, 0.3], arm_r: [-0.95, 0.85, 0], arm_l: [-0.9, -0.85, 0], leg_l: [-0.1, 0.38], leg_r: [0.08, 0.38] }, easeIn],
  // the rock is hard: the pick bounces back up
  [0.36, { body: [0.2, -0.3, 0, 0, -0.025], head: [0.15, 0.24], arm_r: [-1.35, 0.8, 0], arm_l: [-1.3, -0.8, 0], leg_l: [-0.08, 0.3], leg_r: [0.06, 0.3] }, out],
  [0.6, {}],
]);

/** Buzz in the arms just after a hit. */
const buzz = (P: Pose, t: number, at: number, amp: number) => {
  const k = t - at;
  if (k < 0 || k > 0.14) return;
  const v = Math.sin(k * 75) * amp * (1 - k / 0.14);
  P.add("arm_r", v).add("arm_l", v * 0.6).add("head", v * 0.3);
};

const pickupKeys = keyed([
  [0, {}],
  [0.14, { body: [-0.06, 0, 0, 0, 0.012], head: [-0.08], arm_l: [0.18, 0, 0.05], arm_r: [0.18, 0, -0.05] }],
  // bend at the hips and reach down in front
  [0.42, { body: [0.48, 0, 0, 0, -0.03], head: [0.16], arm_l: [-0.62, -0.3, 0.05], arm_r: [-0.62, 0.3, -0.05], leg_l: [-0.12], leg_r: [0.16] }],
  [0.52, { body: [0.5, 0, 0, 0, -0.035], head: [0.18], arm_l: [-0.68, -0.36, 0.04], arm_r: [-0.68, 0.36, -0.04], leg_l: [-0.12], leg_r: [0.16] }, lin],
  // straighten up hugging it to the chest
  [0.78, { body: [-0.08, 0, 0, 0, 0.02], head: [-0.1, 0, 0.12], arm_l: [-1.25, -0.8, 0], arm_r: [-1.25, 0.8, 0] }, out],
  [0.9, { body: [0, 0, 0, 0, -0.012], head: [0, 0, 0.1], arm_l: [-1.15, -0.78, 0], arm_r: [-1.15, 0.78, 0] }],
  [1.15, {}],
]);

/** Wave with the free arm: up, three sways, down. */
const waveClip = (arm: ArmName): Clip => {
  const o = arm === "arm_l" ? 1 : -1;
  const k = keyed([
    [0, {}],
    // hand up beside the big round head and a little forward, so it never hides behind it
    [0.24, { [arm]: [-0.5, 0, o * 2.15], head: [-0.06, -o * 0.08, -o * 0.12] }, back],
    [1.18, { [arm]: [-0.5, 0, o * 2.15], head: [-0.06, -o * 0.08, -o * 0.12] }],
    [1.5, {}],
  ]);
  return {
    dur: 1.5, parts: [arm, "head"], fadeIn: 0.06, fadeOut: 0.2,
    pose(t, P, a) {
      k(t, P, a.size);
      const w = env(t, 0.2, 1.22, 0.1);
      const s = Math.sin((t - 0.24) * Math.PI * 2 * 2.6);
      P.add(arm, Math.sin((t - 0.24) * Math.PI * 2 * 2.6 + 1.2) * 0.1 * w, 0, o * s * 0.34 * w);
      P.add("head", 0, 0, -o * s * 0.03 * w);
    },
  };
};
const WAVE = { arm_l: waveClip("arm_l"), arm_r: waveClip("arm_r") };

const celebrateKeys = keyed([
  [0, {}],
  // crouch
  [0.2, { body: [0.18, 0, 0, 0, -0.05], head: [0.1], arm_l: [0.5, 0, 0.12], arm_r: [0.5, 0, -0.12], leg_l: [-0.05], leg_r: [0.05] }],
  // jump, arms thrown up
  [0.42, { body: [-0.1, 0, 0, 0, 0.22], head: [-0.22], arm_l: [-0.3, 0, 2.3], arm_r: [-0.3, 0, -2.3], leg_l: [-0.5], leg_r: [0.35] }, out],
  [0.6, { body: [-0.04, 0, 0, 0, 0.04], head: [-0.15], arm_l: [-0.3, 0, 2.2], arm_r: [-0.3, 0, -2.2], leg_l: [-0.15], leg_r: [0.1] }, easeIn],
  // land and squash
  [0.68, { body: [0.15, 0, 0, 0, -0.055], head: [0.08], arm_l: [-0.1, 0, 1.2], arm_r: [-0.1, 0, -1.2] }, out],
  // fist pump, other hand on the hip
  [0.9, { body: [-0.05, 0, 0.05, 0, 0.01], head: [-0.12, 0, 0.1], arm_r: [-2.8, 0, -0.25], arm_l: [0.1, 0, 0.4] }, back],
  [1.5, { body: [-0.05, 0, 0.05, 0, 0.01], head: [-0.12, 0, 0.1], arm_r: [-2.8, 0, -0.25], arm_l: [0.1, 0, 0.4] }],
  [1.9, {}],
]);

const stretchKeys = keyed([
  [0, {}],
  // arms up, rising onto the toes, leaning back
  [0.55, { body: [-0.14, 0, 0, 0, 0.03], head: [-0.25], arm_l: [-2.95, 0, 0.3], arm_r: [-2.95, 0, -0.3] }],
  [1.1, { body: [-0.16, 0, 0, 0, 0.035], head: [-0.28], arm_l: [-3.0, 0, 0.32], arm_r: [-3.0, 0, -0.32] }, lin],
  // lean to one side, then the other
  [1.5, { body: [-0.08, 0, 0.2, 0, 0.02], head: [-0.12, 0, 0.12], arm_l: [-2.9, 0, 0.45], arm_r: [-2.9, 0, -0.15] }],
  [1.95, { body: [-0.08, 0, -0.2, 0, 0.02], head: [-0.12, 0, -0.12], arm_l: [-2.9, 0, 0.15], arm_r: [-2.9, 0, -0.45] }],
  // arms drop and shake out
  [2.35, { body: [0.04, 0, 0, 0, -0.012], head: [0.1], arm_l: [0.05, 0, 0.25], arm_r: [0.05, 0, -0.25] }, out],
  [2.8, {}],
]);

const happyKeys = keyed([
  [0, {}],
  [0.1, { body: [0.06, 0, 0, 0, -0.03], arm_l: [0.2, 0, 0.3], arm_r: [0.2, 0, -0.3], head: [0.06] }],
  [0.28, { body: [-0.06, 0, 0, 0, 0.1], arm_l: [-0.4, 0, 1.8], arm_r: [-0.4, 0, -1.8], head: [-0.12], leg_l: [-0.25], leg_r: [0.2] }, out],
  [0.45, { body: [0.06, 0, 0, 0, -0.035], arm_l: [-0.2, 0, 1.2], arm_r: [-0.2, 0, -1.2], head: [0.05] }, easeIn],
  [0.72, { body: [-0.04, 0, 0, 0, 0.075], arm_l: [-0.4, 0, 1.9], arm_r: [-0.4, 0, -1.9], head: [-0.1], leg_l: [0.2], leg_r: [-0.25] }, out],
  [0.92, { body: [0.04, 0, 0, 0, -0.02], arm_l: [-0.3, 0, 1.4], arm_r: [-0.3, 0, -1.4], head: [0.02] }, easeIn],
  [1.25, { arm_l: [-0.15, 0, 0.5], arm_r: [-0.15, 0, -0.5], head: [-0.04, 0, 0.12] }],
  [1.7, {}],
]);

const CLIPS: Record<Exclude<ClipName, "wave" | "fidget">, Clip> = {
  chop: {
    dur: SWING.chop.dur, parts: ALL, tool: "axe", fadeIn: 0.06, fadeOut: 0.15,
    pose(t, P, a) {
      chopKeys(t, P, a.size);
      a.wrist = chopWrist(t);
      buzz(P, t, SWING.chop.impact, 0.045);
    },
  },
  mine: {
    dur: SWING.mine.dur, parts: ALL, tool: "pickaxe", fadeIn: 0.06, fadeOut: 0.15,
    pose(t, P, a) {
      mineKeys(t, P, a.size);
      a.wrist = mineWrist(t);
      // a slightly higher target: stop the swing higher and lean in less
      const k = env(t, 0.21, 0.5, 0.07) * a.aim;
      P.add("arm_r", -0.9 * k).add("arm_l", -0.9 * k).add("body", -0.42 * k).add("head", -0.3 * k);
      buzz(P, t, SWING.mine.impact, 0.07);
    },
  },
  pickup: { dur: 1.15, parts: ALL, cancelOnMove: true, fadeIn: 0.1, pose: (t, P, a) => pickupKeys(t, P, a.size) },
  celebrate: {
    dur: 1.9, parts: ALL, fadeIn: 0.1, fadeOut: 0.25,
    pose(t, P, a) {
      celebrateKeys(t, P, a.size);
      // pumping fist with little bounces
      const pump = Math.sin((t - 0.9) * Math.PI * 2 * 2.6) * env(t, 0.9, 1.5, 0.1);
      P.add("arm_r", pump * 0.32).add("body", 0, 0, 0, 0, Math.abs(pump) * 0.015 * a.size).add("head", pump * 0.05);
      // a full spin in the air when a whole building is finished
      if (a.big) P.add("body", 0, Math.PI * 2 * io(clamp01((t - 0.2) / 0.45)));
    },
  },
  stretch: {
    dur: 2.8, parts: ALL, cancelOnMove: true, fadeIn: 0.25, fadeOut: 0.3,
    pose(t, P, a) {
      stretchKeys(t, P, a.size);
      const tremble = Math.sin(t * 38) * 0.02 * env(t, 0.55, 1.15, 0.1);
      const shake = Math.sin(t * 31) * 0.1 * env(t, 2.2, 2.7, 0.08);
      P.add("arm_l", tremble, 0, shake).add("arm_r", tremble, 0, -shake).add("head", 0, Math.sin(t * 9) * 0.06 * env(t, 2.3, 2.75, 0.1));
    },
  },
  happy: {
    dur: 1.7, parts: ALL, gain: true, fadeIn: 0.08, fadeOut: 0.2,
    pose(t, P, a) {
      happyKeys(t, P, a.size);
      const w = env(t, 0.1, 1.45, 0.15);
      P.add("head", 0, 0, Math.sin(t * Math.PI * 2 * 2.2) * 0.13 * w).add("body", 0, Math.sin(t * Math.PI * 2 * 1.6) * 0.16 * w);
    },
  },
};

// ---- talk gestures --------------------------------------------------------------

type Gesture = (T: ArmName) => KeyPose;
const side = (T: ArmName) => (T === "arm_l" ? 1 : -1);
const other = (T: ArmName): ArmName => (T === "arm_l" ? "arm_r" : "arm_l");
const GESTURES: Record<string, Gesture> = {
  rest: () => ({}),
  nod: () => ({ head: [0.02] }),
  explain: (T) => ({ [T]: [-0.85, -side(T) * 0.25, side(T) * 0.2], head: [0, 0, -side(T) * 0.08] }),
  open: () => ({ arm_l: [-0.5, 0, 0.5], arm_r: [-0.5, 0, -0.5], head: [-0.06], body: [-0.02] }),
  self: (T) => ({ [T]: [-1.2, -side(T) * 0.75, -side(T) * 0.1], head: [0.08], body: [-0.02] }),
  shrug: (T) => ({ arm_l: [-0.25, 0, 0.6], arm_r: [-0.25, 0, -0.6], head: [0, 0, side(T) * 0.14], body: [0, 0, 0, 0, 0.012] }),
  point: (T) => ({ [T]: [-1.45, side(T) * 0.25, side(T) * 0.15], head: [-0.03, side(T) * 0.2], [other(T)]: [0.05, 0, 0] }),
  beat: (T) => ({ [T]: [-0.6, -side(T) * 0.2, side(T) * 0.1] }),
};
const TALKER = ["explain", "open", "self", "shrug", "point", "beat", "beat", "rest"];
const LISTENER = ["rest", "nod", "rest", "nod", "explain", "rest", "beat"];

// ---- the animator ---------------------------------------------------------------

interface Joint {
  o: THREE.Object3D;
  q: THREE.Quaternion;
  p: THREE.Vector3;
}

const _e = new THREE.Euler(0, 0, 0, "YXZ");
const _q = new THREE.Quaternion();
const _lean = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

export class Animator {
  readonly style: Style;
  /** Character size relative to the player (scales bobs and hops). */
  readonly size: number;
  /** The current action is the big version (celebrate: a building is finished). */
  big = false;
  /** How far up (m) the current swing has to land: a tall boulder is struck high, a pebble low. */
  aim = 0;
  /** Wrist angle of the held tool, set by the swing clips. */
  wrist = 0;
  private joints: Partial<Record<PartName, Joint>> = {};
  private hipY: number;
  private time = Math.random() * 100;
  private phase = 0;
  private moveW = 0;
  private runW = 0;
  private loop: LoopName = "idle";
  private loopT = 0;
  private action: { name: ClipName; clip: Clip; t: number } | null = null;
  private fade: { from: Pose; t: number; dur: number } | null = null;
  private outP = new Pose();
  private baseP = new Pose();
  private tmpP = new Pose();
  private actP = new Pose();
  /** Walk or run in place (dev hook). */
  forceMove: "walk" | "run" | null = null;
  // head look: a target yaw from the game, or the character's own glances when idle
  private lookGoal: number | null = null;
  private look = 0;
  private glance = 0;
  private glanceGoal = 0;
  private nextGlance = 3 + Math.random() * 4;
  private idleT = 0;
  private nextFidget = 5 + Math.random() * 6;
  private talkCur = new Pose();
  private talkGoal = new Pose();
  private talkNext = 0;
  private talkBeat = 0;
  private talkNod = 0;
  /** 1 for a full talker, less for someone mostly listening (the player). */
  talkIntensity = 1;
  private tools = new Map<string, THREE.Object3D>();
  private tool: { name: string; t: number; idle: number } | null = null;
  private queued: { name: AnimName; at: number; big: boolean } | null = null;

  constructor(readonly root: THREE.Object3D, readonly id: string) {
    this.style = STYLES[id] ?? BASE;
    for (const p of PARTS) {
      const o = root.getObjectByName(p);
      if (o) this.joints[p] = { o, q: o.quaternion.clone(), p: o.position.clone() };
    }
    this.hipY = this.joints.leg_l?.p.y ?? 0.36;
    this.size = this.hipY / 0.36;
  }

  /** What the character is doing right now. */
  get current(): AnimName {
    return this.action?.name ?? (this.moveW > 0.5 ? (this.runW > 0.5 ? "run" : "walk") : this.loop);
  }

  get busy() {
    return this.action !== null;
  }

  /** Play an animation: a loop (idle, talk, cast; walk/run in place) or a one-shot clip. */
  play(name: AnimName, opts: { big?: boolean; aim?: number } = {}) {
    if (name === "walk" || name === "run") {
      this.forceMove = name;
      return;
    }
    if (name === "idle" || name === "talk" || name === "cast") {
      this.forceMove = null;
      this.setLoop(name);
      return;
    }
    const clip = name === "wave" ? WAVE[this.style.wave] : name === "fidget" ? this.style.fidget : CLIPS[name];
    if (!clip) return;
    this.big = !!opts.big;
    this.aim = opts.aim ?? 0;
    this.snapshot(clip.fadeIn ?? 0.12);
    this.action = { name, clip, t: 0 };
    this.idleT = 0;
    if (clip.tool) this.showTool(clip.tool);
  }

  /** Play an animation after a delay (replaces anything already queued). */
  queue(name: AnimName, delay: number, opts: { big?: boolean } = {}) {
    this.queued = { name, at: this.time + delay, big: !!opts.big };
  }

  setLoop(name: LoopName) {
    if (this.loop === name) return;
    this.snapshot(name === "idle" ? 0.35 : 0.25);
    this.loop = name;
    this.loopT = 0;
    this.talkNext = 0;
  }

  /** Turn the head toward a yaw (radians, relative to where the character faces), or null to look around freely. */
  lookAt(yaw: number | null) {
    this.lookGoal = yaw === null ? null : THREE.MathUtils.clamp(Math.atan2(Math.sin(yaw), Math.cos(yaw)), -0.85, 0.85);
  }

  stop() {
    if (!this.action) return;
    this.snapshot(this.action.clip.fadeOut ?? 0.15);
    this.action = null;
  }

  private snapshot(dur: number) {
    this.fade = { from: this.outP.clone(), t: 0, dur };
  }

  /** speed in m/s (0 when standing); running picks the run cycle. */
  update(dt: number, speed = 0, running = false) {
    const s = this.style;
    this.time += dt;
    this.loopT += dt;
    if (this.queued && this.time >= this.queued.at) {
      const q = this.queued;
      this.queued = null;
      this.play(q.name, { big: q.big });
    }
    const moving = speed > 0.1 || this.forceMove !== null;
    const run = running || this.forceMove === "run";
    this.moveW = THREE.MathUtils.clamp(this.moveW + (moving ? dt * 7 : -dt * 5), 0, 1);
    this.runW = THREE.MathUtils.clamp(this.runW + (run && moving ? dt * 4 : -dt * 4), 0, 1);
    if (this.moveW > 0) this.phase += dt * Math.PI * 2 * THREE.MathUtils.lerp(1.75, 2.35, this.runW) * s.cadence;
    else this.phase = 0;

    // loop layer
    const B = this.baseP.clear();
    if (this.loop === "talk") this.talkPose(B, dt);
    else if (this.loop === "cast") this.castPose(B);
    else this.idlePose(B, dt);
    if (this.moveW > 0) {
      const M = this.tmpP.clear();
      this.walkPose(M, this.phase, 1 - this.runW);
      if (this.runW > 0) this.runPose(M, this.phase, this.runW);
      B.mix(M, io(this.moveW));
    }

    // action layer
    const O = this.outP.copy(B);
    const a = this.action;
    if (a) {
      a.t += dt;
      if (moving && a.clip.cancelOnMove) this.stop();
      else if (a.t >= a.clip.dur) {
        this.action = null;
        this.fade = { from: this.actP.clone(), t: 0, dur: a.clip.fadeOut ?? 0.2 };
        for (const p of PARTS) if (!a.clip.parts.includes(p)) this.fade.from.v[p].set(B.v[p]);
      } else {
        const A = this.actP.copy(B);
        for (const p of a.clip.parts) A.v[p].fill(0);
        a.clip.pose(a.t, A, this);
        if (a.clip.gain) this.limitArms(A);
        O.copy(A);
        this.idleT = 0;
      }
    }

    // fade from the last pose after any change
    const f = this.fade;
    if (f) {
      f.t += dt;
      const u = clamp01(f.t / f.dur);
      if (u >= 1) this.fade = null;
      else O.copy(this.tmpP.copy(f.from).mix(O, io(u)));
    }

    // head look (less while a clip drives the head)
    const goal = this.lookGoal ?? this.glance;
    this.look += (goal - this.look) * Math.min(1, dt * (this.lookGoal === null ? 3 : 5));
    const headBusy = this.action?.clip.parts.includes("head") ? 0.25 : 1;
    O.add("head", Math.abs(this.look) * -0.05 * headBusy, this.look * 0.85 * headBusy).add("body", 0, this.look * 0.12 * headBusy);

    this.apply(O);
    this.updateTool(dt);
  }

  private limitArms(P: Pose) {
    for (const arm of ["arm_l", "arm_r"] as const) {
      const g = this.style.gain[arm];
      if (g < 1) for (let c = 0; c < 3; c++) P.v[arm][c] *= g;
    }
  }

  // ---- loops ----

  private idlePose(P: Pose, dt: number) {
    const t = this.time;
    const s = this.style;
    const k = this.size;
    // breathing: chest rises, arms drift out a touch, head follows a beat later
    const b = Math.sin(t * 1.7);
    P.add("body", -0.012 * b, 0, Math.sin(t * 0.37) * 0.022, 0, 0.006 * k * b);
    P.add("arm_l", 0.015 * b, 0, s.armOut + 0.025 * (b + 1)).add("arm_r", 0.015 * b, 0, -s.armOut - 0.025 * (b + 1));
    P.add("head", s.stoop + 0.015 * Math.sin(t * 1.7 - 0.7), 0, Math.sin(t * 0.53) * 0.03);
    s.idle?.(t, P);
    this.limitArms(P);

    // glance around now and then
    if (this.lookGoal === null && !this.action) {
      this.nextGlance -= dt;
      if (this.nextGlance <= 0) {
        if (this.glanceGoal === 0) {
          this.glanceGoal = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.4);
          this.nextGlance = 0.9 + Math.random() * 1.1;
        } else {
          this.glanceGoal = 0;
          this.nextGlance = 4 + Math.random() * 5;
        }
      }
    } else this.glanceGoal = 0;
    this.glance += (this.glanceGoal - this.glance) * Math.min(1, dt * 3.5);

    // a stretch after standing still for a while (player); a personal touch (villagers)
    if (this.moveW === 0 && !this.action && this.loop === "idle") {
      this.idleT += dt;
      if (this.id === "player" && this.idleT > 16) {
        this.play("stretch");
        this.idleT = -20;
      } else if (s.fidget && this.lookGoal === null && this.idleT > this.nextFidget) {
        this.play("fidget");
        this.nextFidget = 6 + Math.random() * 7;
      }
    }
  }

  private walkPose(P: Pose, ph: number, w: number) {
    if (w <= 0) return;
    const s = this.style;
    const k = this.size;
    const sn = Math.sin(ph);
    const A = 0.55 * s.stride;
    const arm = 0.5 * s.armSwing;
    const twist = 0.07 * sn;
    const sway = 0.045 * s.waddle * Math.cos(ph);
    // legs swing from the hips; the body dips when they're spread so the feet stay on the ground
    P.add("leg_l", -A * sn * w).add("leg_r", A * sn * w);
    P.add("body", (0.05 + 0.02 * Math.cos(2 * ph)) * w, twist * w, sway * w, 0, (0.016 * (1 - sn * sn) - 0.034 * sn * sn) * s.bounce * k * w);
    // arms counter-swing, dragging a little behind
    const as = Math.sin(ph - 0.35);
    P.add("arm_l", (arm * as - 0.08) * w * s.gain.arm_l, 0, (s.armOut + 0.02) * w);
    P.add("arm_r", (-arm * as - 0.08) * w * s.gain.arm_r, 0, -(s.armOut + 0.02) * w);
    // head keeps steady: counters the twist and sway, nods a beat after each step
    P.add("head", (s.stoop - 0.03 + 0.03 * Math.cos(2 * ph - 0.9)) * w, -twist * 0.6 * w, -sway * 0.4 * w);
  }

  private runPose(P: Pose, ph: number, w: number) {
    const s = this.style;
    const k = this.size;
    const sn = Math.sin(ph);
    const A = 0.9 * s.stride;
    const twist = 0.12 * sn;
    P.add("leg_l", -A * sn * w).add("leg_r", A * sn * w);
    // lean into it; the body is highest in the flight between steps
    P.add("body", (0.17 + 0.03 * Math.cos(2 * ph)) * w, twist * w, 0.035 * s.waddle * Math.cos(ph) * w, 0, (0.055 * sn * sn - 0.005) * s.bounce * k * w);
    // arms pump, forward-biased
    const as = Math.sin(ph - 0.3);
    P.add("arm_l", (1.0 * as - 0.25) * w * s.gain.arm_l, 0, (s.armOut + 0.14) * w);
    P.add("arm_r", (-1.0 * as - 0.25) * w * s.gain.arm_r, 0, -(s.armOut + 0.14) * w);
    P.add("head", (s.stoop - 0.12 + 0.04 * Math.cos(2 * ph - 0.8)) * w, -twist * 0.7 * w, 0);
  }

  private talkPose(P: Pose, dt: number) {
    const T = this.style.wave;
    const n = this.talkIntensity;
    if (this.loopT >= this.talkNext) {
      const set = n >= 1 ? TALKER : LISTENER;
      let g = set[Math.floor(Math.random() * set.length)];
      if (this.loopT < 0.1 && n >= 1) g = "explain";
      this.talkGoal.clear();
      keyed([[0, GESTURES[g](T)], [1, {}]])(0, this.talkGoal, this.size);
      this.limitArms(this.talkGoal);
      this.talkBeat = g === "beat" || g === "explain" ? 1 : 0;
      this.talkNod = g === "nod" ? 1 : 0;
      this.talkNext = this.loopT + (0.9 + Math.random() * 1.0) / (0.6 + 0.4 * n);
    }
    this.talkCur.mix(this.talkGoal, 1 - Math.exp(-dt * 5));
    P.copy(this.talkCur);
    const t = this.time;
    // speech rhythm: uneven little nods and bobs
    const r = Math.sin(t * 7.1) * 0.6 + Math.sin(t * 3.3 + 1) * 0.4;
    P.add("head", 0.03 * n * r + this.style.stoop, Math.sin(t * 0.9) * 0.05, Math.sin(t * 0.7) * 0.04);
    P.add("body", 0, Math.sin(t * 0.55) * 0.03, Math.sin(t * 0.8) * 0.02, 0, Math.abs(r) * 0.004 * n * this.size);
    P.add(T, this.talkBeat * Math.sin(t * 7.5) * 0.09 * n * this.style.gain[T]);
    P.add("head", this.talkNod * Math.max(0, Math.sin((this.loopT - this.talkNext) * 6.5)) * 0.12);
    P.add("arm_l", 0, 0, this.style.armOut).add("arm_r", 0, 0, -this.style.armOut);
  }

  private castPose(P: Pose) {
    const t = this.loopT;
    if (t < 0.6) castIn(t, P, this.size);
    else {
      castIn(0.6, P, this.size);
      const c = this.time;
      const tremble = Math.sin(c * 37) * 0.012;
      P.add("arm_l", tremble + Math.cos(c * 2.1) * 0.06, Math.sin(c * 2.1) * 0.12, Math.cos(c * 2.1) * 0.05);
      P.add("arm_r", tremble + Math.cos(c * 2.1 + 0.5) * 0.06, -Math.sin(c * 2.1 + 0.5) * 0.12, -Math.cos(c * 2.1 + 0.5) * 0.05);
      P.add("body", 0, 0, 0, 0, (0.02 * Math.sin(c * 2.4) + 0.012) * this.size).add("head", 0, 0, Math.sin(c * 1.3) * 0.04);
    }
  }

  // ---- tools ----

  /** Load the axe and pickaxe and put them in the right hand, hidden until needed. */
  async attachTools() {
    const arm = this.joints.arm_r?.o;
    if (!arm) return;
    await preload(["axe", "pickaxe"]);
    // the mitten: the bottom of the arm's meshes (glTF splits a part per material), in the
    // arm's own space with the pivot at the shoulder
    const pts: THREE.Vector3[] = [];
    arm.updateMatrixWorld(true);
    const toArm = arm.matrixWorld.clone().invert();
    arm.traverse((o) => {
      const g = (o as THREE.Mesh).geometry;
      if (!(o as THREE.Mesh).isMesh || !g) return;
      const m = toArm.clone().multiply(o.matrixWorld);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m));
    });
    if (!pts.length) return;
    const minY = pts.reduce((m, q) => Math.min(m, q.y), Infinity);
    const low = pts.filter((q) => q.y < minY + 0.03);
    const hand = new THREE.Vector3(low.reduce((a, q) => a + q.x, 0) / low.length, minY + 0.064, low.reduce((a, q) => a + q.z, 0) / low.length);
    const along = hand.clone().normalize();
    // the axe swings sideways (edge leading to the left); the pick strikes down (point leading)
    const grips: Record<string, number> = { axe: 0.61, pickaxe: 0.35 };
    for (const name of ["axe", "pickaxe"]) {
      if (!realModels.has(name)) continue;
      const tool = await model(name);
      const beta = grips[name];
      const H = along.clone().multiplyScalar(Math.cos(beta)).add(new THREE.Vector3(0, 0, Math.sin(beta))).normalize();
      // the edge leads the swing: across into the side of the trunk for the axe, down for the pick
      const E = name === "axe" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3().crossVectors(new THREE.Vector3(1, 0, 0), H).normalize();
      E.sub(H.clone().multiplyScalar(E.dot(H))).normalize();
      const X = new THREE.Vector3().crossVectors(H, E);
      const holder = new THREE.Object3D();
      holder.name = `tool_${name}`;
      holder.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, H, E));
      holder.userData.grip = holder.quaternion.clone();
      holder.position.copy(hand);
      // a touch oversized, like the tools in Animal Crossing, so they read from the game camera
      tool.scale.setScalar(TOOL_SCALE);
      holder.add(tool);
      holder.visible = false;
      arm.add(holder);
      this.tools.set(name, holder);
    }
  }

  private showTool(name: string) {
    if (this.tool?.name !== name) {
      for (const [n, h] of this.tools) h.visible = n === name;
      this.tool = { name, t: 0, idle: 0 };
    } else this.tool.idle = 0;
  }

  private updateTool(dt: number) {
    const tl = this.tool;
    if (!tl) return;
    const h = this.tools.get(tl.name);
    if (h) h.quaternion.setFromAxisAngle(_v.set(1, 0, 0), -this.wrist).multiply(h.userData.grip);
    tl.t += dt;
    if (!this.action?.clip.tool) tl.idle += dt;
    // pops into the hand, and away again once the swinging stops
    const pop = back(clamp01(tl.t / 0.16));
    const away = clamp01((tl.idle - 0.6) / 0.15);
    if (h) h.scale.setScalar(Math.max(0.001, pop * (1 - io(away))));
    if (away >= 1) {
      if (h) h.visible = false;
      this.tool = null;
    }
  }

  // ---- output ----

  private apply(P: Pose) {
    const j = this.joints;
    const b = j.body;
    _lean.identity();
    if (b) {
      const v = P.v.body;
      _q.setFromEuler(_e.set(v[0], v[1], v[2]));
      b.o.quaternion.copy(b.q).multiply(_q);
      // pivot at the hips rather than the feet
      _v.set(0, this.hipY, 0);
      _w.copy(_v).applyQuaternion(_q);
      _v.sub(_w).applyQuaternion(b.q);
      b.o.position.set(b.p.x + v[3] + _v.x, b.p.y + v[4] + _v.y, b.p.z + v[5] + _v.z);
      _lean.setFromEuler(_e.set(v[0], 0, v[2])).invert();
    }
    for (const p of ["head", "arm_l", "arm_r", "leg_l", "leg_r"] as const) {
      const jt = j[p];
      if (!jt) continue;
      const v = P.v[p];
      _q.setFromEuler(_e.set(v[0], v[1], v[2]));
      // legs stay upright under a leaning body, so the feet stay planted
      if (p === "leg_l" || p === "leg_r") jt.o.quaternion.copy(_lean).multiply(jt.q).multiply(_q);
      else jt.o.quaternion.copy(jt.q).multiply(_q);
      jt.o.position.set(jt.p.x + v[3], jt.p.y + v[4], jt.p.z + v[5]);
    }
  }
}

const castIn = keyed([
  [0, {}],
  // gather: hands drop back, a little crouch
  [0.22, { body: [0.08, 0, 0, 0, -0.03], head: [0.12], arm_l: [0.35, 0, 0.1], arm_r: [0.35, 0, -0.1] }],
  // and sweep up toward the building, rising
  [0.6, { body: [-0.08, 0, 0, 0, 0.03], head: [-0.18], arm_l: [-2.5, 0, 0.7], arm_r: [-2.5, 0, -0.7] }, back],
]);

/** Every character model the animations are tuned for (the dev lineup). */
export const CHARACTERS = ["player", "innkeeper", "miller", "fisher", "merchant", "baker", "smith", "librarian", "herbalist", "mayor", "tinker", "captain", "lord_vane"];

/** Dev: every character in a row facing the camera, each with an animator. */
export async function lineup(scene: THREE.Scene, at: THREE.Vector3, gap = 1.25) {
  const out = new Map<string, Animator>();
  for (const [i, id] of CHARACTERS.entries()) {
    const m = await model(id);
    m.position.set(at.x + (i - (CHARACTERS.length - 1) / 2) * gap, 0, at.z);
    scene.add(m);
    const a = new Animator(m, id);
    if (id === "player") await a.attachTools();
    out.set(id, a);
  }
  return out;
}
