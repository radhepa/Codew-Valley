import type { Building } from "./types.ts";

// The Observatory: building 12, taught with the capstone: searching, sorting,
// recursion and generators (SYLLABUS.md). Each challenge adds one stage of
// observatory.glb (art/specs/observatory.md, stage_01 … stage_16), so the
// building has exactly 16 challenges. Until it has challenges its chapter stays
// closed.
export const OBSERVATORY: Building = {
  id: "observatory",
  name: "The Observatory",
  blurb: "On the north hill, where the Great Rune sleeps.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
