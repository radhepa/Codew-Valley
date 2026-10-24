import { store } from "../state.ts";

// Items for village life: everything the founder can carry in the bag (crops, seeds,
// fish, dishes, forage). Each system defines its own items with defineItems() in its own
// folder; ids are global, so other systems can use them (a recipe names "trout").
// This file is plain data and save access, no DOM and no three.js, so the Node content
// tests can import anything that imports it.

export type ItemKind = "seed" | "crop" | "fish" | "ingredient" | "dish" | "forage" | "treasure" | "tool";

export interface ItemDef {
  /** Global id, lowercase with underscores ("trout", "carrot_seeds", "bram_stew"). */
  id: string;
  name: string;
  kind: ItemKind;
  /** One or two cozy sentences for the bag. */
  desc: string;
  /**
   * Inner SVG markup of a 24×24 line icon, stroked in currentColor like src/ui/icons.ts
   * (paths, circles; no fill unless it's fill="currentColor" detail).
   */
  icon: string;
  /** Icon tint (CSS colour); the default is the ink colour. */
  color?: string;
  /**
   * Words gifts and recipes match on. Use these where they fit, add new ones freely:
   * fish, crop, veg, fruit, grain, flower, herb, sweet, hearty, savory, spicy, warm,
   * bread, soup, rare, shiny, old, sea, pond, egg, dairy.
   */
  tags: string[];
  /** Can be given as a gift (default: true except seeds and tools). */
  gift?: boolean;
  /** The highest a stack can hold (default 999). */
  stack?: number;
}

const ITEMS = new Map<string, ItemDef>();
const KIND_ORDER: ItemKind[] = ["dish", "fish", "crop", "ingredient", "forage", "seed", "treasure", "tool"];

/** Add items to the game. Call at import time from a system's own module. */
export function defineItems(defs: ItemDef[]) {
  for (const d of defs) {
    if (ITEMS.has(d.id)) throw new Error(`Item "${d.id}" is defined twice`);
    ITEMS.set(d.id, d);
  }
}

export function item(id: string): ItemDef | undefined {
  return ITEMS.get(id);
}

export function allItems(): ItemDef[] {
  return [...ITEMS.values()];
}

export const giftable = (d: ItemDef) => d.gift ?? (d.kind !== "seed" && d.kind !== "tool");

/** The bag. Counts live in the save (store.data.items); every change saves and redraws. */
export const bag = {
  count(id: string) {
    return store.data.items[id] ?? 0;
  },
  has(id: string, n = 1) {
    return bag.count(id) >= n;
  },
  /** Add n of an item; returns how many fit. */
  add(id: string, n = 1) {
    const d = ITEMS.get(id);
    if (!d) throw new Error(`Unknown item "${id}"`);
    const room = (d.stack ?? 999) - bag.count(id);
    const got = Math.max(0, Math.min(n, room));
    if (got) {
      store.data.items[id] = bag.count(id) + got;
      store.changed();
    }
    return got;
  },
  /** Take n of an item if there are enough; returns whether it happened. */
  take(id: string, n = 1) {
    if (!bag.has(id, n)) return false;
    const left = bag.count(id) - n;
    if (left > 0) store.data.items[id] = left;
    else delete store.data.items[id];
    store.changed();
    return true;
  },
  /** Everything carried, sorted by kind then name. Unknown ids (from an older save) are skipped. */
  contents(): { item: ItemDef; count: number }[] {
    return Object.entries(store.data.items)
      .filter(([id, n]) => n > 0 && ITEMS.has(id))
      .map(([id, count]) => ({ item: ITEMS.get(id)!, count }))
      .sort((a, b) => KIND_ORDER.indexOf(a.item.kind) - KIND_ORDER.indexOf(b.item.kind) || a.item.name.localeCompare(b.item.name));
  },
};
