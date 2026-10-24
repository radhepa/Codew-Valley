import type { Building } from "./types.ts";

// The Hearth Bakery: building 5, taught with for loops, range, accumulators,
// enumerate, zip and nested loops (SYLLABUS.md). Each challenge adds one stage
// of bakery.glb (art/specs/bakery.md, stage_01 … stage_14), so the building has
// exactly 14 challenges. Until it has challenges its chapter stays closed.
export const BAKERY: Building = {
  id: "bakery",
  name: "The Hearth Bakery",
  blurb: "A domed brick oven and the smell of warm bread all day long.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
