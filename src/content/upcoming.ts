import type { Building } from "./types.ts";

// Buildings 3–12: models exist (art/specs/<id>.md), challenges and villagers
// come later. Each moves to its own file (like mill.ts) once its challenges
// are written. Order and topics follow ROADMAP.md.
const upcoming = (id: string, name: string, blurb: string): Building => ({
  id,
  name,
  blurb,
  opening: [],
  finale: [],
  chatDuring: [],
  chatAfter: [],
  challenges: [],
});

export const UPCOMING: Building[] = [
  upcoming("dock", "Fisher's Dock", "A pier over the pond, nets in the sun, and an old bell waiting under the water."),
  upcoming("market", "Market Square", "Stalls, striped awnings and news from beyond the valley."),
  upcoming("bakery", "The Hearth Bakery", "A domed brick oven and the smell of warm bread all day long."),
  upcoming("forge", "The Forge", "Coals, an anvil and the tools a growing town needs."),
  upcoming("library", "The Scribe's Library", "Shelves for every record, and something old sealed under the floor."),
  upcoming("apothecary", "Apothecary and Herb Garden", "Herbs, tonics and a greenhouse full of green."),
  upcoming("townhall", "Town Hall", "Where the village becomes a town."),
  upcoming("clocktower", "The Clock Tower", "The valley's clock, stopped for three hundred years."),
  upcoming("guildhall", "The Guild Hall", "Banners, a training yard and a lookout over the north hill."),
  upcoming("observatory", "The Observatory", "On the north hill, where the Great Rune sleeps."),
];
