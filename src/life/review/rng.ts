// Seeded randomness for Wren's questions. Plain data and maths only (the Node content
// tests import the templates), so the same seed always builds the same question.

export interface Rng {
  /** 0 ≤ x < 1 */
  (): number;
  /** Whole number from a to b, both included. */
  int(a: number, b: number): number;
  pick<T>(xs: readonly T[]): T;
  /** n different items in random order. */
  sample<T>(xs: readonly T[], n: number): T[];
  shuffle<T>(xs: readonly T[]): T[];
  /** true with probability p. */
  chance(p: number): boolean;
  /** n whole numbers from a to b, all different. */
  ints(n: number, a: number, b: number): number[];
}

/** A small, fast seeded generator (mulberry32). */
export function makeRng(seed: number): Rng {
  let s = seed >>> 0 || 1;
  const next = (() => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  next.int = (a, b) => a + Math.floor(next() * (b - a + 1));
  next.pick = (xs) => xs[Math.floor(next() * xs.length)];
  next.shuffle = (xs) => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  next.sample = (xs, n) => next.shuffle(xs).slice(0, n);
  next.chance = (p) => next() < p;
  next.ints = (n, a, b) => {
    const seen = new Set<number>();
    while (seen.size < n) seen.add(next.int(a, b));
    return [...seen];
  };
  return next;
}

/** Mix numbers into one seed (day + per-save salt + a stream id). */
export function seedOf(...parts: (number | string)[]) {
  let h = 2166136261;
  for (const p of parts.join("|")) {
    h ^= p.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---- word pools the templates draw from --------------------------------------------------

export const PEOPLE = ["Wren", "Bram", "Marlo", "Sable", "Hazel", "Ingrid", "Odo", "Mirela", "Thistle", "Tock", "Rook", "Pip"];
export const CROPS = ["wheat", "carrot", "potato", "garlic", "cabbage", "pumpkin", "strawberry", "chamomile", "mint"];
export const FISH = ["trout", "perch", "carp", "pike", "bream", "roach", "eel"];
export const FIELDS = ["north field", "river strip", "hill plot", "orchard row", "mill patch", "east meadow"];
export const SKY = ["sunny", "cloudy", "rainy", "windy", "misty"];
