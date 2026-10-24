import { registerClip, registerTool, keyed, ease, type Clip, type Pose } from "../../game/anim.ts";

// The player's cooking moves (src/game/anim.ts registerClip / registerTool), registered at
// import time, before the world builds the player. Rotations follow anim.ts: rx negative
// swings an arm forward and up, ry turns, rz tilts (an arm out to the side); positions in metres.
//   cook_chop    knife over the pot: two quick chops (one per press)
//   cook_stir    held while the pot simmers; cookMoves.stir (0..1) sets how hard you stir
//   cook_taste   a sip from the spoon, a happy wiggle
//   cook_pan     held while the pan sizzles over the fire
//   cook_flip    a toss of the pan
//   cook_knead   both hands push the dough
//   cook_peel    the peel slides the loaf into the oven (or out)
//   cook_present both hands hold the dish up for everyone to see
//   cook_pour    a sack of wheat tipped into the mill's hopper

const { io, out, back, env, easeIn, lin } = ease;
const ARMS_HEAD = ["arm_r", "arm_l", "head", "body"] as const;
const ALL = ["body", "head", "arm_l", "arm_r", "leg_l", "leg_r"] as const;

/** Live inputs for the held clips, set by the cooking minigame. */
export const cookMoves = { stir: 0, phase: 0, sizzle: 0 };

registerTool("cook_spoon", { beta: 0.2, lead: "down", scale: 1.15 });
registerTool("cook_knife", { beta: 0.25, lead: "down", scale: 1.25 });
registerTool("cook_pan", { beta: 0.05, lead: "down", scale: 1.2 });
registerTool("cook_peel", { beta: 0.1, lead: "down", scale: 1.1 });

const chopKeys = keyed([
  [0, {}],
  // left hand steadies the vegetable over the pot, the knife comes up
  [0.14, { arm_r: [-1.85, 0.25, 0.1], arm_l: [-1.2, -0.35, -0.05], head: [0.28], body: [0.08, 0, 0, 0, -0.01] }],
  [0.22, { arm_r: [-1.1, 0.3, 0.12], arm_l: [-1.2, -0.35, -0.05], head: [0.32], body: [0.12, 0, 0, 0, -0.02] }, easeIn],
  [0.3, { arm_r: [-1.2, 0.28, 0.12], arm_l: [-1.18, -0.35, -0.05], head: [0.3], body: [0.11, 0, 0, 0, -0.018] }, out],
  [0.55, {}],
]);

const tasteKeys = keyed([
  [0, { arm_r: [-1.25, 0.2, 0.1], head: [0.3], body: [0.08] }],
  // spoon up to the mouth, a little blow, a sip
  [0.4, { arm_r: [-2.1, 0.75, 0.35], arm_l: [-0.2, 0, 0.2], head: [0.05, 0.1], body: [-0.02] }, out],
  [0.8, { arm_r: [-2.15, 0.78, 0.35], arm_l: [-0.2, 0, 0.2], head: [-0.1, 0.12, 0.05], body: [-0.06, 0, 0, 0, 0.01] }],
  // mm! eyes up, a happy little shimmy
  [1.15, { arm_r: [-1.5, 0.4, 0.2], arm_l: [-0.1, 0, 0.35], head: [-0.25, 0, 0.12], body: [-0.08, 0, 0, 0, 0.03] }, back],
  [1.7, {}],
]);

const flipKeys = keyed([
  [0, { arm_r: [-1.3, 0.2, 0.05], arm_l: [-0.35, 0, 0.25], head: [0.3], body: [0.06] }],
  [0.14, { arm_r: [-1.05, 0.2, 0.05], arm_l: [-0.35, 0, 0.25], head: [0.32], body: [0.12, 0, 0, 0, -0.025] }],
  // flick!
  [0.26, { arm_r: [-1.75, 0.2, 0.05], arm_l: [-0.6, 0, 0.5], head: [-0.15], body: [-0.04, 0, 0, 0, 0.04] }, out],
  // catch
  [0.55, { arm_r: [-1.2, 0.2, 0.05], arm_l: [-0.35, 0, 0.25], head: [0.3], body: [0.1, 0, 0, 0, -0.015] }, io],
  [0.75, { arm_r: [-1.3, 0.2, 0.05], arm_l: [-0.35, 0, 0.25], head: [0.3], body: [0.06] }],
]);

const kneadKeys = keyed([
  [0, {}],
  [0.18, { arm_r: [-1.0, 0.35, 0.05], arm_l: [-1.0, -0.35, -0.05], head: [0.3], body: [0.1, 0, 0, 0, 0.005] }],
  [0.32, { arm_r: [-0.75, 0.45, 0.05], arm_l: [-0.75, -0.45, -0.05], head: [0.35], body: [0.25, 0, 0, 0, -0.03] }, easeIn],
  [0.6, {}],
]);

const peelKeys = keyed([
  [0, {}],
  [0.25, { arm_r: [-1.35, 0.25, 0], arm_l: [-1.2, -0.3, 0], head: [0.2], body: [-0.05], leg_l: [0.15], leg_r: [-0.1] }],
  // lunge in, slide, draw back
  [0.55, { arm_r: [-1.5, 0.25, 0], arm_l: [-1.35, -0.3, 0], head: [0.15], body: [0.22, 0, 0, 0, -0.02], leg_l: [-0.35], leg_r: [0.25] }, out],
  [0.8, { arm_r: [-1.4, 0.25, 0], arm_l: [-1.25, -0.3, 0], head: [0.2], body: [0.05], leg_l: [-0.1], leg_r: [0.05] }],
  [1.1, {}],
]);

const presentKeys = keyed([
  [0, {}],
  [0.12, { body: [0.08, 0, 0, 0, -0.03], arm_l: [-0.6, -0.3, 0.1], arm_r: [-0.6, 0.3, -0.1], head: [0.1] }],
  // up it goes, held out in front for everyone to see
  [0.42, { body: [-0.1, 0, 0, 0, 0.06], arm_l: [-2.05, -0.45, -0.25], arm_r: [-2.05, 0.45, 0.25], head: [-0.3], leg_l: [-0.12], leg_r: [0.08] }, back],
  [1.9, { body: [-0.06, 0, 0, 0, 0.02], arm_l: [-2.0, -0.45, -0.25], arm_r: [-2.0, 0.45, 0.25], head: [-0.22] }],
  [2.4, {}],
]);

const pourKeys = keyed([
  [0, {}],
  [0.3, { arm_l: [-1.9, -0.3, 0], arm_r: [-1.9, 0.3, 0], head: [-0.1], body: [-0.04] }],
  [0.6, { arm_l: [-2.3, -0.3, 0], arm_r: [-2.3, 0.3, 0], head: [-0.2], body: [0.06, 0, 0, 0, 0.015] }, out],
  [1.0, { arm_l: [-2.25, -0.3, 0], arm_r: [-2.25, 0.3, 0], head: [-0.15], body: [0.05, 0, 0, 0, 0.01] }],
  [1.4, {}],
]);

const clip = (c: Clip) => c;

registerClip(
  "cook_chop",
  clip({
    dur: 0.55, parts: ARMS_HEAD, tool: "cook_knife", fadeIn: 0.06, fadeOut: 0.18,
    pose(t, P, a) {
      chopKeys(t, P, a.size);
      a.wrist = 0.25 * env(t, 0.08, 0.2, 0.06) - 0.15 * env(t, 0.22, 0.32, 0.04);
      // the board buzzes a little on the hit
      const k = t - 0.22;
      if (k > 0 && k < 0.12) P.add("arm_r", Math.sin(k * 80) * 0.03 * (1 - k / 0.12));
    },
  }),
);

/** Stirring: the spoon down in the pot, circling; faster and wider while the button is held. */
function stirPose(t: number, P: Pose, size: number) {
  const s = cookMoves.stir;
  const ph = cookMoves.phase;
  const r = 0.12 + 0.16 * s;
  const lean = env(t, 0, 1e9, 0.25);
  P.add("arm_r", (-1.15 + Math.sin(ph) * r * 0.9) * lean, (0.3 + Math.cos(ph) * r * 1.6) * lean, (0.12 + Math.cos(ph) * r * 0.5) * lean);
  P.add("arm_l", -0.15 * lean, 0, 0.3 * lean);
  P.add("head", (0.36 + Math.sin(ph) * 0.03) * lean, Math.cos(ph) * 0.06 * s * lean);
  P.add("body", (0.1 + Math.sin(ph) * 0.02 * s) * lean, Math.cos(ph) * 0.05 * s * lean, 0, 0, -0.01 * size * lean);
}

registerClip("cook_stir", clip({ dur: 600, parts: ARMS_HEAD, tool: "cook_spoon", fadeIn: 0.25, fadeOut: 0.3, pose: (t, P, a) => stirPose(t, P, a.size) }));

registerClip(
  "cook_taste",
  clip({
    dur: 1.7, parts: ARMS_HEAD, tool: "cook_spoon", fadeIn: 0.1, fadeOut: 0.3,
    pose(t, P, a) {
      tasteKeys(t, P, a.size);
      const w = env(t, 1.1, 1.6, 0.1);
      P.add("body", 0, Math.sin(t * 26) * 0.08 * w).add("head", 0, 0, Math.sin(t * 26) * 0.08 * w);
    },
  }),
);

registerClip(
  "cook_pan",
  clip({
    dur: 600, parts: ARMS_HEAD, tool: "cook_pan", fadeIn: 0.25, fadeOut: 0.3,
    pose(t, P) {
      const w = env(t, 0, 1e9, 0.25);
      const j = Math.sin(t * 9) * 0.025 * cookMoves.sizzle + Math.sin(t * 2.1) * 0.02;
      P.add("arm_r", (-1.3 + j) * w, 0.2 * w, 0.05 * w).add("arm_l", -0.35 * w, 0, 0.25 * w).add("head", 0.3 * w).add("body", 0.06 * w);
    },
  }),
);

registerClip("cook_flip", clip({ dur: 0.75, parts: ARMS_HEAD, tool: "cook_pan", fadeIn: 0.05, fadeOut: 0.1, pose: (t, P, a) => flipKeys(t, P, a.size) }));
registerClip("cook_knead", clip({ dur: 0.6, parts: ARMS_HEAD, fadeIn: 0.06, fadeOut: 0.15, pose: (t, P, a) => kneadKeys(t, P, a.size) }));
registerClip("cook_peel", clip({ dur: 1.1, parts: ALL, tool: "cook_peel", fadeIn: 0.1, fadeOut: 0.2, pose: (t, P, a) => peelKeys(t, P, a.size) }));
registerClip(
  "cook_present",
  clip({
    dur: 2.4, parts: ALL, fadeIn: 0.08, fadeOut: 0.3,
    pose(t, P, a) {
      presentKeys(t, P, a.size);
      const w = env(t, 0.45, 1.9, 0.15);
      P.add("body", 0, 0, 0, 0, Math.abs(Math.sin(t * 7)) * 0.015 * w * a.size).add("head", 0, 0, Math.sin(t * 5) * 0.06 * w);
    },
  }),
);
// a blink-short empty clip: ends whatever the cook was holding, softly
registerClip("cook_rest", clip({ dur: 0.05, parts: ARMS_HEAD, fadeIn: 0.05, fadeOut: 0.35, pose: () => {} }));
registerClip("cook_pour", clip({ dur: 1.4, parts: ARMS_HEAD, fadeIn: 0.1, fadeOut: 0.2, cancelOnMove: true, pose: (t, P, a) => pourKeys(t, P, a.size) }));

void lin;
