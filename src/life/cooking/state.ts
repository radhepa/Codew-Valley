import { store } from "../../state.ts";
import { lifeSave, runeSolved } from "../save.ts";

// Cooking's part of the save (src/life/save.ts): recipes learned, dishes cooked, and which
// first-time scenes have played.

export interface CookSave {
  /** Recipe ids learned, in the order they were learned. */
  known: string[];
  /** How many times each dish has been cooked. */
  cooked: Record<string, number>;
  /** Who taught each recipe ("innkeeper", ...), or "tried" for a discovery. */
  from: Record<string, string>;
  /** First-time scenes already played: "bram", "hazel", "wren", "stew", "open", "bakery", "mill". */
  seen: string[];
  /** Recipes learned but not yet looked at in the book (a dot on the card). */
  fresh: string[];
}

export const cookSave = () => lifeSave<CookSave>("cooking", () => ({ known: [], cooked: {}, from: {}, seen: [], fresh: [] }));

export const knows = (id: string) => cookSave().known.includes(id);
export const seen = (key: string) => cookSave().seen.includes(key);

export function markSeen(key: string) {
  const s = cookSave();
  if (!s.seen.includes(key)) s.seen.push(key);
  store.changed();
}

/** Learn a recipe; returns false if it was already known. */
export function learn(id: string, from: string) {
  const s = cookSave();
  if (s.known.includes(id)) return false;
  s.known.push(id);
  s.from[id] = from;
  s.fresh.push(id);
  store.changed();
  return true;
}

export function cooked(id: string, n: number) {
  const s = cookSave();
  s.cooked[id] = (s.cooked[id] ?? 0) + n;
  store.changed();
}

export function unfresh(id: string) {
  const s = cookSave();
  const i = s.fresh.indexOf(id);
  if (i >= 0) {
    s.fresh.splice(i, 1);
    store.changed();
  }
}

// The runes (runes.ts) switch these on.
export const RUNE_GUEST_POT = "cook-guest-pot";
export const RUNE_BATCH = "cook-batch-bake";
/** Pot dishes make an extra bowl. */
export const bigPot = () => runeSolved(RUNE_GUEST_POT);
/** Cook several of a dish in one go. */
export const batching = () => runeSolved(RUNE_BATCH);
