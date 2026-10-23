import type { Person } from "../types.ts";
import { PIP } from "./pip.ts";
import { BRAM } from "./innkeeper.ts";
import { WREN } from "./miller.ts";
import { MARLO } from "./fisher.ts";
import { SABLE } from "./merchant.ts";
import { VANE } from "./lord_vane.ts";
import { HAZEL } from "./baker.ts";
import { INGRID } from "./smith.ts";
import { ODO } from "./librarian.ts";
import { MIRELA } from "./herbalist.ts";
import { THISTLE } from "./mayor.ts";
import { TOCK } from "./tinker.ts";
import { ROOK } from "./captain.ts";

/** Everyone you can befriend, in the order they arrive (STORY.md). */
export const PEOPLE: Person[] = [PIP, BRAM, WREN, MARLO, SABLE, VANE, HAZEL, INGRID, ODO, MIRELA, THISTLE, TOCK, ROOK];

export const personById = new Map(PEOPLE.map((p) => [p.id, p]));
