import type { Scene } from "./types.ts";
import { BRAM_SCENES } from "./bram.ts";

/** Every heart-event scene (HEARTS.md), played by src/scenes. */
export const SCENES: Scene[] = [...BRAM_SCENES];

export const sceneById = new Map(SCENES.map((s) => [s.id, s]));
