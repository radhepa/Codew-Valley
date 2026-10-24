import type { Building } from "./types.ts";

// Market Square: building 4, taught with lists (SYLLABUS.md). Each challenge
// adds one stage of market.glb (art/specs/market.md, stage_01 … stage_14), so
// the building has exactly 14 challenges. Until it has challenges its chapter
// stays closed.
export const MARKET: Building = {
  id: "market",
  name: "Market Square",
  blurb: "Stalls, striped awnings and news from beyond the valley.",
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
};
