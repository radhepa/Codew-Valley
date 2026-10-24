import type { Building } from "./types.ts";

// Apothecary and Herb Garden: building 8, taught with split / join, tuples, sets
// and try / except (SYLLABUS.md). Each challenge adds one stage of
// apothecary.glb (art/specs/apothecary.md, stage_01 … stage_14), so the building
// has exactly 14 challenges. Until it has challenges its chapter stays closed.
export const APOTHECARY: Building = {
  id: "apothecary",
  name: "Apothecary and Herb Garden",
  blurb: "Herbs, tonics and a greenhouse full of green.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
