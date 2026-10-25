import type { Conditions, Scene } from "../content/scenes/types.ts";
import { SCENES, sceneById } from "../content/scenes/index.ts";
import type { LifeCtx, LifeSystem } from "../life/context.ts";
import { bond, hearts, PER_HEART } from "../friends.ts";
import { weatherState } from "../game/weather-state.ts";
import { store } from "../state.ts";
import { esc } from "../ui/md.ts";
import { Director } from "./engine.ts";
import { keepsakeArt } from "./keepsakes.ts";
import "./scenes.css";

// Heart events (HEARTS.md). Each scene plays the first time all its conditions hold as the
// player walks into its place: hearts with the villager, the time, the weather, buildings
// finished, flags and earlier scenes. Checked a few times a second, never while a sheet, a
// dialogue, a minigame or another scene is open, and at most one scene per walk in.

let director: Director | null = null;
let ctx: LifeCtx | null = null;
/** Whether the player was inside each scene's area at the last check (a scene needs a walk in). */
const inside = new Map<string, boolean>();

const MOMENTS: Record<string, [number, number]> = { morning: [0.2, 0.42], day: [0.42, 0.72], evening: [0.72, 0.88], night: [0.88, 0.2] };
const within = (t: number, [a, b]: [number, number]) => (a <= b ? t >= a && t < b : t >= a || t < b);

function timeFits(when: Conditions["time"]) {
  if (!when) return true;
  const t = weatherState.timeOfDay;
  if (typeof when[0] === "number") return within(t, when as [number, number]);
  return (when as string[]).some((m) => MOMENTS[m] && within(t, MOMENTS[m]));
}

/** Everything but the walk-in: is this scene ready to play? */
export function ready(s: Scene) {
  const c = ctx;
  if (!c || store.data.scenes.includes(s.id)) return false;
  const w = s.when;
  if (hearts(s.who) < w.hearts) return false;
  // everyone in it has to be in the valley (a villager arrives with their building)
  if (![s.who, ...Object.keys(s.cast)].every((id) => c.world.actor(id))) return false;
  if (w.built?.some((id) => !c.app.finished(id))) return false;
  if (w.after?.some((id) => !store.data.scenes.includes(id))) return false;
  if (w.flags?.some((f) => !store.flagged(f))) return false;
  if (w.weather && (weatherState.rain > 0.4 ? "rain" : "clear") !== w.weather) return false;
  return timeFits(w.time);
}

function calm(c: LifeCtx) {
  const w = c.world;
  const ui = c.app.ui;
  return store.data.introSeen && !w.paused && !w.hold && !w.stage && !(w as unknown as { cinematic: unknown }).cinematic && !ui.classList.contains("titling") && !ui.querySelector(".dialog, .modal-back");
}

function check() {
  const c = ctx;
  if (!c || !director || director.playing) return;
  const p = c.world.playerPos;
  let start: Scene | null = null;
  for (const s of SCENES) {
    const [x, z, r] = s.when.area;
    const now = Math.hypot(p.x - x, p.z - z) < r;
    const was = inside.get(s.id);
    inside.set(s.id, now);
    if (now && was === false && !start && ready(s) && calm(c)) start = s;
  }
  if (!start) return;
  // walking into one scene's place counts as the walk in for all of them
  for (const s of SCENES) inside.set(s.id, true);
  void director.play(start);
}

export const SCENES_SYSTEM: LifeSystem = {
  id: "scenes",
  install(c) {
    ctx = c;
    director = new Director(c);
    // a few times a second, in real time (a slow frame rate mustn't miss a walk in)
    window.setInterval(check, 300);
  },
};

// ---- keepsakes: the shelf in the Friends journal --------------------------------------

/** The keepsakes this villager's scenes have left, as a shelf for their journal page ("" if none yet). */
export function keepsakeShelf(personId: string): string {
  const got = SCENES.filter((s) => s.who === personId && s.keepsake && store.data.keepsakes.includes(s.keepsake.id));
  const total = SCENES.filter((s) => s.who === personId && s.keepsake).length;
  if (!total) return "";
  const items = got.map((s) => `<li title="${esc(s.title)}">${keepsakeArt(s.keepsake!.icon)}<div><b>${esc(s.keepsake!.name)}</b><span>${esc(s.keepsake!.note)}</span></div></li>`);
  const empty = Array.from({ length: total - got.length }, () => `<li class="empty" aria-label="Not found yet"><span class="slot"></span></li>`);
  return `<section class="keepsakes"><div class="label">Keepsakes · ${got.length} of ${total}</div><ul>${items.join("")}${empty.join("")}</ul></section>`;
}

// ---- dev hooks (main.ts puts them on window.__pv) --------------------------------------

export const sceneDev = {
  /** Play any scene now, whatever its conditions (sets the scene's time of day first). */
  scene(id: string) {
    const s = sceneById.get(id);
    if (!s || !director || !ctx) return `No scene "${id}". Try: ${SCENES.map((x) => x.id).join(", ")}`;
    if (s.devTime !== undefined) ctx.world.weather.setTime(s.devTime);
    void director.play(s);
    return s.title;
  },
  /** Set hearts with a villager (milestone lines up to there count as said). */
  hearts(id: string, n: number) {
    const b = bond(id);
    b.points = Math.max(0, Math.min(10, n)) * PER_HEART;
    b.milestones = Math.min(5, Math.floor(n / 2));
    b.met = true;
    store.changed();
    return hearts(id);
  },
  /** Flags, scenes seen and keepsakes; flags({}) clears them all, so scenes can play again. */
  flags(reset?: object) {
    if (reset) {
      store.data.flags = {};
      store.data.scenes = [];
      store.data.keepsakes = [];
      store.changed();
    }
    return { flags: { ...store.data.flags }, scenes: [...store.data.scenes], keepsakes: [...store.data.keepsakes] };
  },
  /** Every scene, and whether it would play on the next walk in. */
  scenes: () => SCENES.map((s) => ({ id: s.id, title: s.title, seen: store.data.scenes.includes(s.id), ready: ready(s) })),
  get playing() {
    return director?.playing?.id ?? null;
  },
};
