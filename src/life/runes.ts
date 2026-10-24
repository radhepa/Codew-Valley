import type { LifeRune } from "./context.ts";
import { FARMING_RUNES } from "./farming/runes.ts";
import { FISHING_RUNES } from "./fishing/runes.ts";
import { COOKING_RUNES } from "./cooking/runes.ts";

/** Every village rune, checked by the content tests like any challenge. */
export const LIFE_RUNES: LifeRune[] = [...FARMING_RUNES, ...FISHING_RUNES, ...COOKING_RUNES];
