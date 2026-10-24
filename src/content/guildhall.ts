import type { Building } from "./types.ts";

// The Guild Hall: building 11, taught with classes (SYLLABUS.md). Each challenge
// adds one stage of guildhall.glb (art/specs/guildhall.md, stage_01 … stage_16),
// so the building has exactly 16 challenges. Until it has challenges its chapter
// stays closed.
export const GUILDHALL: Building = {
  id: "guildhall",
  name: "The Guild Hall",
  blurb: "Banners, a training yard and a lookout over the north hill.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
