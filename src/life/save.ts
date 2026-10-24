import { store } from "../state.ts";

/**
 * A village-life system's own part of the save, created on first use. Call it each time
 * you need it (don't keep the object: a reset replaces the whole save), change it in
 * place, then call store.changed() to save.
 *
 *   const farm = lifeSave("farming", () => ({ plots: [] as Plot[] }));
 */
export function lifeSave<T extends object>(key: string, init: () => T): T {
  const life = store.data.life;
  if (!life[key] || typeof life[key] !== "object") life[key] = init();
  return life[key] as T;
}

/** Village runes solved so far (the app marks them; systems read them). */
export function runeSolved(id: string) {
  return lifeSave("runes", () => ({ solved: [] as string[] })).solved.includes(id);
}

export function markRune(id: string) {
  const r = lifeSave("runes", () => ({ solved: [] as string[] }));
  if (!r.solved.includes(id)) r.solved.push(id);
  store.changed();
}
