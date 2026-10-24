import type { Building } from "./types.ts";

// The Scribe's Library: building 7, taught with dictionaries (SYLLABUS.md). Each
// challenge adds one stage of library.glb (art/specs/library.md, stage_01 …
// stage_14), so the building has exactly 14 challenges. Until it has challenges
// its chapter stays closed.
export const LIBRARY: Building = {
  id: "library",
  name: "The Scribe's Library",
  blurb: "Shelves for every record, and something old sealed under the floor.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
