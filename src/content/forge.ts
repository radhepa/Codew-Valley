import type { Building } from "./types.ts";

// The Forge: building 6, taught with functions (SYLLABUS.md). Each challenge
// adds one stage of forge.glb (art/specs/forge.md, stage_01 … stage_15), so the
// building has exactly 15 challenges. Until it has challenges its chapter stays
// closed.
export const FORGE: Building = {
  id: "forge",
  name: "The Forge",
  blurb: "Coals, an anvil and the tools a growing town needs.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
