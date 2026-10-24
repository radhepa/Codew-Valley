import type { Building } from "./types.ts";

// The Clock Tower: building 10, taught with modules and list comprehensions
// (SYLLABUS.md). Each challenge adds one stage of clocktower.glb
// (art/specs/clocktower.md, stage_01 … stage_14), so the building has exactly 14
// challenges. Until it has challenges its chapter stays closed.
export const CLOCKTOWER: Building = {
  id: "clocktower",
  name: "The Clock Tower",
  blurb: "The valley's clock, stopped for three hundred years.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
