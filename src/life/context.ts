import type { Challenge } from "../content/types.ts";
import type { World } from "../game/world.ts";

/**
 * A small Python task that belongs to a village-life system instead of a building: a
 * "village rune". Same format and same content tests as a challenge (part = the rune's
 * name, cost = no materials). Solving it switches on something in that system, e.g. a
 * field that waters itself.
 */
export interface LifeRune extends Challenge {
  /** The rune appears once this building is finished (it may only use Python taught by then). */
  requires: string;
  /** What solving it does, one short line for the rune card. */
  reward: string;
}

/** A line of dialogue: "Pip" or a villager's name. */
export interface LifeLine {
  who: string;
  text: string;
}

/** What the game gives a village-life system. */
export interface LifeApp {
  /** The overlay every HUD plate and sheet lives in (#ui). */
  readonly ui: HTMLElement;
  /** A short toast at the top of the screen (supports `code` and **bold**). */
  toast(text: string): void;
  /** Show "got 3 × Trout" with the item's icon. */
  gained(itemId: string, n?: number): void;
  /** Dialogue; the last line can end in buttons. Resolves when it closes. */
  say(lines: LifeLine[], finalButtons?: { label: string; cls?: string; action: () => void }[]): Promise<void>;
  /** Open a paper sheet as a modal (pauses the world); closeSheet() or Escape closes it. */
  openSheet(sheet: HTMLElement): void;
  closeSheet(): void;
  /** Whether a building is finished, and how many of its parts are built. */
  finished(buildingId: string): boolean;
  partsBuilt(buildingId: string): number;
  /** Open the workbench on a village rune; onSolved runs once its checks pass and the player confirms. */
  openRune(rune: LifeRune, onSolved: () => void): void;
  /** Add a round HUD button next to Friends/Codex. key is a single letter shortcut. */
  hudButton(o: { icon: string; title: string; key?: string; onClick: () => void }): HTMLButtonElement;
  /** Add (or take) friendship points; shows the heart toast when a heart is gained. */
  befriend(personId: string, points: number): void;
}

export interface LifeCtx {
  world: World;
  app: LifeApp;
}

/** A village-life system: its install runs once the world and HUD exist. */
export interface LifeSystem {
  id: string;
  install(ctx: LifeCtx): void;
}
