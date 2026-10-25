import { clock } from "../clock.ts";
import type { LifeApp } from "../context.ts";
import { lifeSave } from "../save.ts";
import { store } from "../../state.ts";
import { drawQuestion, openQuestion, questionById, type Question } from "../review/pool.ts";

// The kitchen card: once a valley day, whoever keeps the fire you're cooking at (Bram at the
// hearth, Hazel at the oven) has a Python question chalked on a card, from the practice pool and
// leaning on kitchen sums (lists, for loops, dictionaries). Solve it and the next dish you cook
// comes out with extra servings: two with no hints, one with hints. Close it unsolved and it
// waits for the rest of the day.

export type Host = "innkeeper" | "baker";

interface CardSave {
  /** The valley day of the current card, its question, and whether it's solved. */
  day: number;
  template: string;
  seed: number;
  done: boolean;
  /** Extra servings waiting for the next dish (they keep until you cook). */
  extra: number;
  /** Who has explained the card once. */
  seen: Host[];
}

const cardSave = () => lifeSave<CardSave>("cooking-card", () => ({ day: 0, template: "", seed: 0, done: false, extra: 0, seen: [] }));

/** Today's card while it's unsolved; null before the mill stands, or once it's solved. */
export function cardToday(): Question | null {
  const s = cardSave();
  if (s.day === clock.day) return s.done ? null : questionById(s.template, s.seed);
  const q = drawQuestion({ lean: ["market", "bakery", "library"] });
  if (!q) return null;
  Object.assign(s, { day: clock.day, template: q.template, seed: q.seed, done: false });
  store.changed();
  return q;
}

/** Extra servings waiting for the next dish. */
export const cardExtra = () => cardSave().extra;

/** Take the waiting servings (the dish is cooking). */
export function takeExtra(): number {
  const s = cardSave();
  const n = s.extra;
  if (n) {
    s.extra = 0;
    store.changed();
  }
  return n;
}

const INTRO: Record<Host, { first: string[]; again: string[] }> = {
  innkeeper: {
    first: [
      "Bram: Every morning on the caravan, the cook chalked a sum on a card. Get it right, and you got the big ladle.",
      "Bram: I've kept it up! One card a day, friend. Work it out and your next pot comes out with extra bowls. Don't ask me how. Kitchen magic.",
    ],
    again: ["Bram: Today's card, friend! Work it out and the next pot stretches a little further."],
  },
  baker: {
    first: [
      "Hazel: My brother does a card every morning. A sum, for luck. I said it was silly. Then I started doing them too.",
      "Hazel: Solve it and the next batch comes out bigger. I don't explain it. I just bake.",
    ],
    again: ["Hazel: Today's card. Solve it before the oven's hot."],
  },
};

/** Open today's card in the workbench; onDone runs with the servings it earned once it's solved. */
export function openCard(app: LifeApp, host: Host, onDone: (extra: number) => void) {
  const q = cardToday();
  if (!q) return;
  const s0 = cardSave();
  const first = !s0.seen.includes(host);
  openQuestion(
    app,
    q,
    (r) => {
      if (!r.solved) return;
      const s = cardSave();
      const extra = r.hints === 0 ? 2 : 1;
      s.done = true;
      s.extra += extra;
      store.changed();
      onDone(extra);
    },
    {
      id: `review-card-${clock.day}`,
      eyebrow: host === "baker" ? "Hazel's kitchen card" : "Bram's kitchen card",
      action: "Back to the kitchen",
      intro: first ? INTRO[host].first : INTRO[host].again,
    },
  );
  if (first) {
    s0.seen.push(host);
    store.changed();
  }
}
