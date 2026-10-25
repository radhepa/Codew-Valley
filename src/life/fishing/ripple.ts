import { clock } from "../clock.ts";
import type { LifeApp } from "../context.ts";
import { lifeSave } from "../save.ts";
import { store } from "../../state.ts";
import { drawQuestion, openQuestion, questionById, type Question } from "../review/pool.ts";
import { biting, fishInfo, rollSize, type FishSpot } from "./fish.ts";
import { fishSave } from "./session.ts";

// The rune ripple: once a valley day, while you fish, a ripple of old rune-light glimmers on the
// water. Read it (a Python question from the practice pool, leaning on the dock's while loops)
// and the pond owes you one: the next fish you land is a rare one, and a big one. Close it
// unsolved and it waits there for the rest of the day; nothing is lost.

interface RippleSave {
  /** The valley day of the current ripple, its question (template and seed), and whether it's read. */
  day: number;
  template: string;
  seed: number;
  done: boolean;
  /** Read, and the lucky catch not landed yet (it keeps until a fish is landed). */
  luck: boolean;
  /** Marlo has explained it once. */
  seen: boolean;
}

const rippleSave = () => lifeSave<RippleSave>("fishing-ripple", () => ({ day: 0, template: "", seed: 0, done: false, luck: false, seen: false }));

/** Today's ripple question, while it's unread; null before the mill stands, or once it's read. */
export function rippleToday(): Question | null {
  const s = rippleSave();
  if (s.day === clock.day) return s.done ? null : questionById(s.template, s.seed);
  const q = drawQuestion({ lean: ["dock"] });
  if (!q) return null;
  Object.assign(s, { day: clock.day, template: q.template, seed: q.seed, done: false });
  store.changed();
  return q;
}

export const hasLuck = () => rippleSave().luck;

/** Open today's ripple in the workbench; onLuck runs once it's solved. */
export function openRipple(app: LifeApp, onLuck: () => void) {
  const q = rippleToday();
  if (!q) return;
  const s0 = rippleSave();
  const first = !s0.seen;
  openQuestion(
    app,
    q,
    (r) => {
      if (!r.solved) return;
      const s = rippleSave();
      s.done = true;
      s.luck = true;
      store.changed();
      onLuck();
    },
    {
      id: `review-ripple-${clock.day}`,
      eyebrow: "The rune ripple",
      action: "Back to the water",
      intro: first
        ? [
            "Marlo: See that? Gold rings, where nothing's risen. Gran called it the pond remembering.",
            "Marlo: She said the old town's runes are still down there. Read one right and the water pays you back. ...Daft. Go on, then.",
          ]
        : ["Marlo: There it is again. The pond remembering. Read it, and see what it gives you."],
    },
  );
  if (first) {
    s0.seen = true;
    store.changed();
  }
}

/**
 * The lucky catch: something rare or uncommon that bites here now (never the boot), leaning
 * hard on what isn't in the journal yet; and its size from the top of its range.
 */
export function luckyCatch(spot: FishSpot, tod: number, raining: boolean): { id: string; size: number } {
  const caught = fishSave().caught;
  const list = biting(spot, tod, raining)
    .map((b) => ({ id: b.id, info: fishInfo(b.id)! }))
    .filter((b) => b.id !== "old_boot")
    .map((b) => ({ id: b.id, w: (b.info.rarity === 2 ? 8 : b.info.rarity === 1 ? 4 : 0.4) * (caught[b.id] ? 1 : 3) }));
  const total = list.reduce((a, b) => a + b.w, 0);
  let r = Math.random() * total;
  let id = list[list.length - 1]?.id ?? "perch";
  for (const b of list) {
    r -= b.w;
    if (r <= 0) {
      id = b.id;
      break;
    }
  }
  return { id, size: Math.max(rollSize(id), rollSize(id), rollSize(id)) };
}

/** The lucky fish is landed: the luck is spent. */
export function spendLuck() {
  rippleSave().luck = false;
  store.changed();
}
