// The reel minigame, as plain state (the session draws it and plays the sounds). Forgiving by
// design: hold to reel while the fish rests, ease off when it makes a run. Too much pull doesn't
// snap the line, it just lets the fish take some back. A fish only escapes if you keep
// fighting it through run after run, and even then the float comes back.

export type ReelMode = "rest" | "warn" | "pull";

export interface Reel {
  /** 0..1: how far it has been reeled in. */
  progress: number;
  /** 0..1: strain on the line. */
  tension: number;
  mode: ReelMode;
  /** Seconds left in the current mode. */
  left: number;
  fight: number;
  /** Something happened this step, for sound and effects. */
  events: ("run" | "rest" | "slack" | "click")[];
  clickAcc: number;
}

export function newReel(fight: number, rnd = Math.random): Reel {
  return { progress: 0.22, tension: 0, mode: "rest", left: 1.5 - 0.6 * fight + rnd() * 0.8, fight, events: [], clickAcc: 0 };
}

const WARN = 0.45;

/** Advance by dt seconds. holding: reeling now; tapped: a press started this frame. */
export function stepReel(r: Reel, dt: number, holding: boolean, tapped: boolean, rnd = Math.random): "won" | "lost" | null {
  r.events.length = 0;
  const f = r.fight;
  const speed = 0.3 - 0.19 * f;
  r.left -= dt;
  if (r.left <= 0) {
    if (r.mode === "rest") {
      if (f <= 0.02) r.left = 3; // a boot or a coin never runs
      else {
        r.mode = "warn";
        r.left = WARN;
      }
    } else if (r.mode === "warn") {
      r.mode = "pull";
      r.left = 0.55 + f * 0.9 + rnd() * 0.4;
      r.events.push("run");
    } else {
      r.mode = "rest";
      r.left = 2.5 - f * 1.1 + rnd() * 0.9;
      r.events.push("rest");
    }
  }
  if (r.mode === "pull") {
    r.progress -= 0.045 * f * dt;
    if (holding) {
      r.tension += (0.5 + 0.55 * f) * dt;
      r.progress += speed * 0.2 * dt;
    } else r.tension -= 0.7 * dt;
  } else {
    if (holding) {
      r.progress += speed * dt;
      r.tension += 0.08 * dt;
    } else r.tension -= 0.55 * dt;
    if (tapped) r.progress += 0.018;
  }
  if (holding) {
    r.clickAcc += dt * (r.mode === "pull" ? 5 : 12);
    if (r.clickAcc >= 1) {
      r.clickAcc = 0;
      r.events.push("click");
    }
  }
  r.tension = Math.max(0, r.tension);
  if (r.tension >= 1) {
    // the line sings and slips: the fish takes some back, but nothing breaks
    r.tension = 0.45;
    r.progress -= 0.1;
    r.mode = "rest";
    r.left = 1.4;
    r.events.push("slack");
  }
  if (r.progress >= 1) return "won";
  if (r.progress <= 0) return "lost";
  return null;
}
