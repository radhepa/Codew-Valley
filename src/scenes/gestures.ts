import { registerClip, keyed, ease, type Clip, type PartName } from "../game/anim.ts";

// Gestures for heart-event scenes, played by name on any character ({ anim: "innkeeper", name: "laugh" }).
// Registered at import, like village life's moves (src/life/cooking/moves.ts), so anim.ts stays as it is.
// Poses are [rx, ry, rz, px, py, pz] per part: a negative arm rx swings the arm forward and up,
// a positive head rx looks down.

const UPPER: readonly PartName[] = ["body", "head", "arm_l", "arm_r"];
const { out, easeIn } = ease;

const clip = (name: string, c: Clip) => registerClip(name, c);

// startled: a jolt back, arms flung a little out, then settle
const react = keyed([
  [0, {}],
  [0.12, { body: [-0.14, 0, 0, 0, 0.035], head: [-0.22], arm_l: [-0.7, 0, 0.55], arm_r: [-0.7, 0, -0.55] }, out],
  [0.55, { body: [-0.06, 0, 0, 0, 0.01], head: [-0.1], arm_l: [-0.35, 0, 0.3], arm_r: [-0.35, 0, -0.3] }],
  [1.0, {}],
]);
clip("react", { dur: 1.0, parts: UPPER, gain: true, fadeIn: 0.04, fadeOut: 0.25, pose: (t, P, a) => react(t, P, a.size) });

const nod = keyed([
  [0, {}],
  [0.18, { head: [0.28] }],
  [0.36, { head: [-0.04] }],
  [0.55, { head: [0.22] }],
  [0.85, {}],
]);
clip("nod", { dur: 0.85, parts: ["head"], fadeIn: 0.05, fadeOut: 0.15, pose: (t, P) => nod(t, P) });

// a big laugh: head back, belly bouncing, a hand to the belly
const laughBase = keyed([
  [0, {}],
  [0.2, { body: [-0.12], head: [-0.32], arm_r: [-0.7, 0, 0.5], arm_l: [-0.2, 0, 0.25] }, out],
  [1.4, { body: [-0.08], head: [-0.2], arm_r: [-0.6, 0, 0.45], arm_l: [-0.15, 0, 0.2] }],
  [1.8, {}],
]);
clip("laugh", {
  dur: 1.8, parts: UPPER, gain: true, fadeIn: 0.08, fadeOut: 0.25,
  pose(t, P, a) {
    laughBase(t, P, a.size);
    const shake = Math.sin(t * 34) * Math.min(1, t / 0.2) * Math.max(0, 1 - (t - 1.2) / 0.5);
    P.add("body", 0, 0, 0, 0, Math.abs(shake) * 0.02 * a.size).add("head", shake * 0.05);
  },
});

// wiping tears with the back of a hand, head bowed
const wipe = keyed([
  [0, {}],
  [0.35, { head: [0.3, 0, 0.05], body: [0.08], arm_r: [-2.05, 0.2, 0.55] }],
  [0.8, { head: [0.26, 0, -0.06], body: [0.08], arm_r: [-2.15, 0.3, 0.45] }],
  [1.2, { head: [0.3, 0, 0.05], body: [0.08], arm_r: [-2.05, 0.2, 0.55] }],
  [1.9, {}],
]);
clip("wipe", { dur: 1.9, parts: UPPER, gain: true, fadeIn: 0.15, fadeOut: 0.3, pose: (t, P, a) => wipe(t, P, a.size) });

// holding something out with both hands, and keeping it there a moment
const give = keyed([
  [0, {}],
  [0.35, { body: [0.12], head: [0.12], arm_l: [-1.35, 0, -0.08], arm_r: [-1.35, 0, 0.08] }, out],
  [1.1, { body: [0.1], head: [0.1], arm_l: [-1.3, 0, -0.08], arm_r: [-1.3, 0, 0.08] }],
  [1.5, {}],
]);
clip("give", { dur: 1.5, parts: UPPER, gain: true, fadeIn: 0.1, fadeOut: 0.25, pose: (t, P, a) => give(t, P, a.size) });

// reading something held low in both hands (a ledger, a letter)
const read = keyed([
  [0, {}],
  [0.5, { head: [0.42], body: [0.06], arm_l: [-1.0, 0, -0.32], arm_r: [-1.0, 0, 0.32] }],
  [3.6, { head: [0.4, 0.06], body: [0.06], arm_l: [-1.05, 0, -0.3], arm_r: [-1.05, 0, 0.3] }],
  [4.2, {}],
]);
clip("read", { dur: 4.2, parts: UPPER, gain: true, fadeIn: 0.2, fadeOut: 0.3, pose: (t, P, a) => read(t, P, a.size) });

// a long breath out: shoulders drop, head down
const sigh = keyed([
  [0, {}],
  [0.4, { body: [-0.05, 0, 0, 0, 0.02], head: [-0.12] }],
  [1.1, { body: [0.12, 0, 0, 0, -0.02], head: [0.32], arm_l: [0.08, 0, -0.06], arm_r: [0.08, 0, 0.06] }, easeIn],
  [1.9, {}],
]);
clip("sigh", { dur: 1.9, parts: UPPER, fadeIn: 0.15, fadeOut: 0.3, pose: (t, P, a) => sigh(t, P, a.size) });

// a mug raised high
const toast = keyed([
  [0, {}],
  [0.3, { arm_r: [-2.55, 0, -0.25], head: [-0.15], body: [-0.05] }, out],
  [1.2, { arm_r: [-2.5, 0, -0.2], head: [-0.12], body: [-0.04] }],
  [1.6, {}],
]);
clip("toast", { dur: 1.6, parts: UPPER, gain: true, fadeIn: 0.08, fadeOut: 0.25, pose: (t, P, a) => toast(t, P, a.size) });

const point = keyed([
  [0, {}],
  [0.3, { arm_r: [-1.5, 0, 0.05], head: [-0.05], body: [0.03] }, out],
  [1.1, { arm_r: [-1.45, 0, 0.05] }],
  [1.4, {}],
]);
clip("point", { dur: 1.4, parts: UPPER, gain: true, fadeIn: 0.08, fadeOut: 0.2, pose: (t, P, a) => point(t, P, a.size) });

// stirring a pot with a long spoon, slow circles (a loop the scene stops by playing another clip)
clip("stir", {
  dur: 6, parts: UPPER, gain: true, fadeIn: 0.25, fadeOut: 0.3,
  pose(t, P) {
    const ph = t * 3.2;
    const k = Math.min(1, t / 0.3) * Math.min(1, (6 - t) / 0.3);
    P.add("arm_r", (-1.15 + Math.sin(ph) * 0.12) * k, (0.3 + Math.cos(ph) * 0.2) * k, 0.12 * k);
    P.add("arm_l", -0.15 * k, 0, 0.3 * k);
    P.add("head", 0.36 * k, Math.cos(ph) * 0.04 * k);
    P.add("body", 0.1 * k);
  },
});

// humming along: a gentle sway with the eyes half shut
clip("sway", {
  dur: 6, parts: UPPER, fadeIn: 0.4, fadeOut: 0.5,
  pose(t, P) {
    const k = Math.min(1, t / 0.5) * Math.min(1, (6 - t) / 0.5);
    const s = Math.sin(t * Math.PI * 2 * 0.45);
    P.add("body", 0, 0, s * 0.07 * k).add("head", -0.1 * k, 0, s * 0.14 * k);
  },
});
