import { ease, keyed, registerClip, registerTool, type Pose } from "../../game/anim.ts";

// The player's fishing animations and Gran's rod in the right hand (game/anim.ts). Registered
// at import time, before any character is built. The long clips (wait, bite, reel) read `rig`,
// which the fishing session writes every frame, so the pose follows the minigame.

const { io, out, easeIn, env, clamp01 } = ease;

/** Live values from the session for the long clips. */
export const rig = {
  /** 0..1 how hard the line is pulling (reel). */
  tension: 0,
  /** The player is reeling right now (the left hand cranks). */
  reeling: false,
  /** The fish is making a run. */
  pull: false,
  /** Seconds since the last nibble, for a little flinch. */
  nibble: 9,
};

// the rod held out in front, tip up over the water; the left hand rests by the reel
const HOLD = { body: [0.05, 0, 0], head: [0.14, 0, 0], arm_r: [-0.95, 0.22, -0.06], arm_l: [-0.62, -0.42, 0.12] };

const castKeys = keyed([
  [0, HOLD],
  // wind up: rod swept back over the right shoulder, weight on the back foot
  [0.36, { body: [-0.1, -0.32, 0.03, 0, 0.01], head: [-0.05, 0.22, 0], arm_r: [-2.75, -0.35, -0.25], arm_l: [-0.9, -0.2, 0.2], leg_l: [-0.12, 0.3], leg_r: [0.1, 0.3] }],
  // the whip forward: fast, leaning in
  [0.52, { body: [0.16, 0.12, -0.02, 0, -0.02], head: [0.2, -0.05, 0], arm_r: [-1.05, 0.25, -0.05], arm_l: [-0.7, -0.45, 0.12], leg_l: [-0.12, -0.1], leg_r: [0.1, -0.1] }, easeIn],
  // follow through and settle into the hold, eyes on the float
  [0.7, { body: [0.1, 0.04, 0, 0, -0.01], head: [0.18, 0, 0], arm_r: [-0.85, 0.24, -0.06], arm_l: [-0.62, -0.42, 0.12] }, out],
  [1.0, HOLD],
]);
/** When in the cast the line leaves the rod (the session launches the float then). */
export const CAST_RELEASE = 0.5;
export const CAST_DUR = 1.0;

registerTool("fishing_rod", { beta: 1.25, lead: "down", scale: 1.15 });

registerClip("fish_cast", {
  dur: CAST_DUR, parts: ["body", "head", "arm_l", "arm_r", "leg_l", "leg_r"], tool: "fishing_rod", fadeIn: 0.12, fadeOut: 0.2,
  pose(t, P, a) {
    castKeys(t, P, a.size);
    a.wrist = 0.35 * env(t, 0.2, 0.42, 0.1) - 0.25 * env(t, 0.48, 0.62, 0.06);
  },
});

const holdKeys = keyed([[0, HOLD], [1, HOLD]]);

function hold(t: number, P: Pose, size: number) {
  holdKeys(0, P, size);
  // slow breathing and a lazy rod sway; a little flinch on a nibble
  const b = Math.sin(t * 1.6);
  P.add("body", -0.01 * b, 0, Math.sin(t * 0.4) * 0.02, 0, 0.005 * size * b);
  P.add("arm_r", 0.03 * Math.sin(t * 0.9), 0.02 * Math.sin(t * 0.6), 0).add("arm_l", 0.015 * b);
  P.add("head", 0.02 * Math.sin(t * 0.7 + 1), 0.06 * Math.sin(t * 0.23), 0);
  const f = rig.nibble < 0.35 ? Math.sin((rig.nibble / 0.35) * Math.PI) : 0;
  P.add("arm_r", -0.1 * f).add("head", 0.06 * f).add("body", 0.03 * f);
}

const ALL = ["body", "head", "arm_l", "arm_r", "leg_l", "leg_r"] as const;

registerClip("fish_wait", {
  dur: 1e6, parts: ALL, tool: "fishing_rod", fadeIn: 0.3, fadeOut: 0.3,
  pose(t, P, a) {
    hold(t, P, a.size);
    a.wrist = 0.04 * Math.sin(t * 0.9);
  },
});

registerClip("fish_bite", {
  dur: 1e6, parts: ALL, tool: "fishing_rod", fadeIn: 0.08, fadeOut: 0.15,
  pose(t, P, a) {
    hold(t, P, a.size);
    // the twitch: rod tip jerks down with the float, then the whole body leans in, trembling
    const jerk = t < 0.3 ? Math.sin((t / 0.3) * Math.PI) : 0;
    const lean = io(clamp01((t - 0.12) / 0.25));
    const tr = Math.sin(t * 34) * 0.025 * lean;
    P.add("arm_r", 0.28 * jerk + tr, 0, 0).add("arm_l", tr * 0.6);
    P.add("body", 0.1 * lean + 0.04 * jerk, 0, 0, 0, -0.025 * lean * a.size).add("head", 0.12 * lean);
    P.add("leg_l", -0.12 * lean).add("leg_r", -0.12 * lean);
    a.wrist = 0.2 * jerk;
  },
});

registerClip("fish_reel", {
  dur: 1e6, parts: ALL, tool: "fishing_rod", fadeIn: 0.1, fadeOut: 0.2,
  pose(t, P, a) {
    const k = a.size;
    const T = rig.tension;
    // strike at the start: rod snaps up
    const strike = t < 0.35 ? Math.sin((t / 0.35) * Math.PI) : 0;
    // rod raised and pulled back, more the harder the fish pulls; braced legs
    P.add("body", -0.08 - 0.12 * T, 0.1, 0, 0, -0.02 * k).add("head", 0.08 - 0.06 * T, 0.05);
    P.add("arm_r", -1.3 - 0.35 * T - 0.5 * strike, 0.18, -0.05);
    P.add("leg_l", -0.22, 0.1).add("leg_r", 0.16, 0.1);
    // the left hand cranks the reel while reeling
    const crank = rig.reeling ? 1 : 0.15;
    const w = t * (rig.reeling ? 13 : 4);
    P.add("arm_l", -0.95 + 0.2 * Math.sin(w) * crank, -0.45 + 0.08 * Math.cos(w) * crank, 0.15 + 0.12 * Math.cos(w) * crank);
    // a run: the fish yanks you forward, everything shakes a little
    if (rig.pull) {
      const s = Math.sin(t * 27) * 0.05;
      P.add("body", 0.14 + s, 0, s * 0.5).add("arm_r", 0.35 + s * 2).add("head", 0.08);
    }
    a.wrist = -0.15 * T + 0.1 * strike;
  },
});

const catchKeys = keyed([
  [0, { arm_r: [-1.2, 0.2, 0], arm_l: [-0.9, -0.4, 0.1] }],
  // a little hop as the catch comes up into both hands
  [0.18, { body: [0.06, 0, 0, 0, -0.04], arm_l: [-1.3, 0, -0.1], arm_r: [-1.3, 0, 0.1], head: [0.05] }],
  // and holds it out in front, proudly, for everyone to see (the chibi's arms are too short to
  // lift anything over that head, so the catch is presented at chest height instead)
  [0.36, { body: [-0.1, 0, 0, 0, 0.08], arm_l: [-1.75, 0, -0.34], arm_r: [-1.75, 0, 0.34], head: [-0.1], leg_l: [-0.22], leg_r: [0.18] }, out],
  [0.52, { body: [-0.06, 0, 0, 0, 0.0], arm_l: [-1.7, 0, -0.32], arm_r: [-1.7, 0, 0.32], head: [-0.06] }, easeIn],
  [2.3, { body: [-0.07, 0, 0, 0, 0.01], arm_l: [-1.72, 0, -0.33], arm_r: [-1.72, 0, 0.33], head: [-0.08] }],
  [2.8, {}],
]);
export const CATCH_DUR = 2.8;

registerClip("fish_catch", {
  dur: CATCH_DUR, parts: ALL, fadeIn: 0.1, fadeOut: 0.3,
  pose(t, P, a) {
    catchKeys(t, P, a.size);
    // a proud little sway while holding it up
    const w = env(t, 0.5, 2.3, 0.2);
    P.add("body", 0, Math.sin(t * 3.2) * 0.12 * w, Math.sin(t * 3.2 + 1) * 0.04 * w).add("head", 0, 0, Math.sin(t * 3.2) * 0.08 * w);
  },
});

const stowKeys = keyed([[0, HOLD], [0.45, { arm_r: [-0.3, 0.1, 0], arm_l: [0, 0, 0.05] }]]);
registerClip("fish_stow", {
  dur: 0.45, parts: ALL, tool: "fishing_rod", fadeIn: 0.05, fadeOut: 0.25,
  pose: (t, P, a) => stowKeys(t, P, a.size),
});
