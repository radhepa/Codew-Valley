import type { Rng } from "./rng.ts";

// Wren's basket: crops from her field (ids in ../farming/items.ts), rolled with the day's
// question. Harder and mixed questions fill a bigger basket and are likelier to hold the rare
// crops; every hint opened takes one crop back out (never below two).

const FIELD: { id: string; weight: number; rare?: boolean }[] = [
  { id: "wheat", weight: 6 },
  { id: "potato", weight: 4 },
  { id: "carrot", weight: 4 },
  { id: "cabbage", weight: 3 },
  { id: "garlic", weight: 3 },
  { id: "mint", weight: 2 },
  { id: "chamomile", weight: 2 },
  { id: "strawberry", weight: 1, rare: true },
  { id: "pumpkin", weight: 0.35, rare: true },
];

/** The basket for a question: crop ids, best first. */
export function rollBasket(r: Rng, difficulty: number, mixed: boolean): string[] {
  const n = 2 + difficulty * 2 + (mixed ? 2 : 0) + r.int(0, 1);
  const rareBoost = 1 + (difficulty - 1) * 0.9 + (mixed ? 1 : 0);
  const pool = FIELD.map((c) => ({ ...c, w: c.weight * (c.rare ? rareBoost : 1) }));
  const total = pool.reduce((a, c) => a + c.w, 0);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    let roll = r() * total;
    out.push((pool.find((c) => (roll -= c.w) <= 0) ?? pool[0]).id);
  }
  // the best crops sit on top (and stay in when hints take some out)
  const rank = (id: string) => FIELD.findIndex((c) => c.id === id);
  return out.sort((a, b) => rank(b) - rank(a));
}

/** What's left after the hints: one crop out per hint, never fewer than two. */
export function afterHints(basket: string[], hints: number) {
  return basket.slice(0, Math.max(2, basket.length - hints));
}

/** Group a basket into [id, count] pairs, best first. */
export function counted(basket: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const id of basket) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m];
}
