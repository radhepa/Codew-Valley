import type { Building } from "./types.ts";

// Fisher's Dock: building 3, taught with while loops, counters, break / continue
// and import random (SYLLABUS.md). Each challenge adds one stage of dock.glb
// (art/specs/dock.md, stage_01 … stage_12), so the building has exactly 12
// challenges. Until it has challenges its chapter stays closed.
export const DOCK: Building = {
  id: "dock",
  name: "Fisher's Dock",
  blurb: "A pier over the pond, nets in the sun, and an old bell waiting under the water.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
