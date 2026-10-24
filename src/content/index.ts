import { TAVERN } from "./tavern.ts";
import { MILL } from "./mill.ts";
import { DOCK } from "./dock.ts";
import { MARKET } from "./market.ts";
import { BAKERY } from "./bakery.ts";
import { FORGE } from "./forge.ts";
import { LIBRARY } from "./library.ts";
import { APOTHECARY } from "./apothecary.ts";
import { TOWNHALL } from "./townhall.ts";
import { CLOCKTOWER } from "./clocktower.ts";
import { GUILDHALL } from "./guildhall.ts";
import { OBSERVATORY } from "./observatory.ts";
import type { Building } from "./types.ts";

/** Buildings in the order the story unlocks them (ROADMAP.md, SYLLABUS.md). */
export const BUILDINGS: Building[] = [TAVERN, MILL, DOCK, MARKET, BAKERY, FORGE, LIBRARY, APOTHECARY, TOWNHALL, CLOCKTOWER, GUILDHALL, OBSERVATORY];
