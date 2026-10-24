import type { Template } from "../build.ts";
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

// Every question template Wren can ask (see ../README.md). One file per building's Python;
// a mixed question lives with the latest building it uses.
export const TEMPLATES: Template[] = [
  ...TAVERN,
  ...MILL,
  ...DOCK,
  ...MARKET,
  ...BAKERY,
  ...FORGE,
  ...LIBRARY,
  ...APOTHECARY,
  ...TOWNHALL,
  ...CLOCKTOWER,
  ...GUILDHALL,
  ...OBSERVATORY,
];
