import type { Building } from "./types.ts";

// Town Hall: building 9, taught with files and CSV (SYLLABUS.md). Each challenge
// adds one stage of townhall.glb (art/specs/townhall.md, stage_01 … stage_14),
// so the building has exactly 14 challenges. Until it has challenges its chapter
// stays closed.
export const TOWNHALL: Building = {
  id: "townhall",
  name: "Town Hall",
  blurb: "Where the village becomes a town.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
