import { TAVERN } from "./tavern.ts";
import { MILL } from "./mill.ts";
import { UPCOMING } from "./upcoming.ts";
import type { Building } from "./types.ts";

/** Buildings in the order the story unlocks them. */
export const BUILDINGS: Building[] = [TAVERN, MILL, ...UPCOMING];
