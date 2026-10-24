import { allItems, bag, item, type ItemDef } from "../items.ts";
import "./items.ts";

// The recipes: what each dish needs, what it's cooked in, and who teaches it. Plain data plus
// matching, no DOM, so it can be checked without the game. The pantry basics (water, salt,
// oil, sugar) are always at hand, so a recipe only asks for crops, fish and flour.

export type Vessel = "pot" | "pan" | "oven";

export interface Recipe {
  /** The dish's item id (cooking/items.ts). */
  id: string;
  vessel: Vessel;
  /** Item ids, or "#tag" for any food with that tag ("#fish": any fish). Repeat an id for two. */
  needs: string[];
  /** Who teaches it, and when. Without one, it's found only by trying. */
  teach?: Teach;
  /** Shown on the "???" card until it's learned: a nudge, never the list. */
  hint: string;
  /** Colour of the pot or pan while it cooks. */
  tint: string;
}

export interface Teach {
  /** Person id. */
  who: string;
  /** Taught in their first lesson at the hearth or the oven. */
  intro?: boolean;
  /** Taught once this building is finished. */
  finished?: string;
  /** Taught at this many hearts with them. */
  hearts?: number;
  /** What they say as they hand it over (in their voice). */
  note: string;
}

export const RECIPES: Recipe[] = [
  {
    id: "bram_stew",
    vessel: "pot",
    needs: ["potato", "carrot", "garlic"],
    teach: { who: "innkeeper", intro: true, note: "My own stew. Potato, carrot, and garlic. More garlic than that. No, more." },
    hint: "Bram's own. Ask him at the hearth.",
    tint: "#9a5230",
  },
  {
    id: "carrot_soup",
    vessel: "pot",
    needs: ["carrot", "carrot"],
    teach: { who: "innkeeper", intro: true, note: "Two carrots, water, a pinch of salt and patience. Every caravan cook starts here." },
    hint: "The first soup every caravan cook learns.",
    tint: "#d6752e",
  },
  {
    id: "fish_chowder",
    vessel: "pot",
    needs: ["#fish", "potato"],
    teach: { who: "innkeeper", finished: "dock", note: "Fish in the valley at last! Any fish and a potato, friend, and you've got my chowder. A hug for your insides." },
    hint: "Bram has a pond recipe, once there's a dock to fish from.",
    tint: "#e2d2b0",
  },
  {
    id: "pumpkin_soup",
    vessel: "pot",
    needs: ["pumpkin", "carrot"],
    hint: "Something big, round and orange, with a smaller orange friend. Try it in the pot.",
    tint: "#e0912f",
  },
  {
    id: "crayfish_boil",
    vessel: "pot",
    needs: ["crayfish", "crayfish", "garlic"],
    teach: { who: "smith", finished: "forge", note: "Two crayfish, a fistful of garlic, and pepper till you sweat. My old crew lived on it. Don't burn your tongue." },
    hint: "A forge-crew supper. Ingrid would know it.",
    tint: "#b5503a",
  },
  {
    id: "herb_tea",
    vessel: "pot",
    needs: ["chamomile", "chamomile"],
    teach: { who: "herbalist", finished: "apothecary", note: "Two handfuls of chamomile, water just off the boil, and let it think for a while. It's very good at thinking." },
    hint: "Little flowers that smell of apples, steeped in hot water.",
    tint: "#c9a13e",
  },
  {
    id: "mint_humbug",
    vessel: "pot",
    needs: ["mint", "mint"],
    teach: { who: "mayor", finished: "townhall", note: "My secret, citizen, for the good of the town: two sprigs of mint, boiled down with sugar till it shines. Then you stripe it. With dignity." },
    hint: "Something cool and green, boiled with sugar until it shines.",
    tint: "#6fae80",
  },
  {
    id: "grilled_trout",
    vessel: "pan",
    needs: ["brown_trout", "garlic"],
    teach: { who: "fisher", hearts: 1, note: "...Trout. Garlic in the pan first. Skin side down, and leave it be. That's the whole secret. Leaving it be." },
    hint: "Marlo's way with a speckled fish. He shares it with friends.",
    tint: "#9c7a52",
  },
  {
    id: "potato_cakes",
    vessel: "pan",
    needs: ["potato", "potato"],
    hint: "A hot pan, a splash of oil, and the valley's favourite lump. Twice.",
    tint: "#d4a04a",
  },
  {
    id: "cabbage_rolls",
    vessel: "pan",
    needs: ["cabbage", "potato"],
    teach: { who: "miller", hearts: 2, note: "Grandmother's cabbage rolls! A cabbage leaf, potato rolled up inside, fried till the edges crackle. She made them every harvest. Now you will too." },
    hint: "A harvest dish from Wren's grandmother. Wren shares it with friends.",
    tint: "#8db061",
  },
  {
    id: "egg_omelette",
    vessel: "pan",
    needs: ["egg", "egg", "garlic"],
    teach: { who: "tinker", finished: "clocktower", note: "Henrietta's eggs, two of them, and a garlic for luck. Whisk till your arm forgets it's an arm, then fold. Folding is just a very small hinge!" },
    hint: "Two of something a hen is proud of, and a strong white bulb. In the pan.",
    tint: "#e7c35a",
  },
  {
    id: "bread_loaf",
    vessel: "oven",
    needs: ["flour", "flour"],
    teach: { who: "baker", intro: true, note: "Two scoops of flour, water, salt, and time. Knead it till it springs back. Bake it till it sings." },
    hint: "Hazel's everyday loaf. Ask her at the oven.",
    tint: "#c88a44",
  },
  {
    id: "strawberry_tart",
    vessel: "oven",
    needs: ["strawberry", "strawberry", "flour"],
    teach: { who: "baker", hearts: 2, note: "A tart. One scoop of flour for the case, two handfuls of strawberries, sugar to glaze. Forty minutes. Don't open the oven door to look. I'll know." },
    hint: "Something sweet and red on a buttery case. Hazel shares it with friends.",
    tint: "#c93b3a",
  },
  {
    id: "fish_pie",
    vessel: "oven",
    needs: ["#fish", "potato", "flour"],
    teach: { who: "fisher", hearts: 3, note: "Gran's pie. Any fish, a potato, flour for the crust. She'd cut a little fish out of the pastry for the top. ...I'd like it if you did too." },
    hint: "A very old fisher's recipe. Marlo keeps it for close friends.",
    tint: "#d9a458",
  },
  {
    id: "shortbread",
    vessel: "oven",
    needs: ["flour", "butter"],
    teach: { who: "baker", hearts: 4, note: "Shortbread. Flour, butter, sugar, nothing else. Cut it in wedges before it cools. I don't make it for just anyone. You're not just anyone." },
    hint: "Hazel's one indulgence. She shares it with good friends.",
    tint: "#e2b66c",
  },
  {
    id: "honey_cake",
    vessel: "oven",
    needs: ["flour", "honey", "egg"],
    teach: { who: "merchant", hearts: 3, note: "Partner, I traded a whole song for this one on the Lantern Road. Flour, an egg, a jar of honey. Bake it tall. Drip the honey down the sides. Charge nothing, it's a gift. Ugh. Fine." },
    hint: "A Lantern Road recipe. Sable traded a song for it.",
    tint: "#d6a537",
  },
  {
    id: "garlic_bread",
    vessel: "oven",
    needs: ["flour", "garlic"],
    hint: "Bram would put garlic in anything. Even bread. Especially bread.",
    tint: "#c99a4e",
  },
];

export const recipe = (id: string) => RECIPES.find((r) => r.id === id);

/** Never cooked, whatever's in the bag: the golden koi is for looking at. */
export const NOT_FOOD = new Set(["golden_koi"]);

/** Whether an item can go into a pot, pan or oven at all. */
export function isFood(d: ItemDef) {
  return !NOT_FOOD.has(d.id) && (d.kind === "crop" || d.kind === "fish" || d.kind === "ingredient");
}

const fits = (need: string, id: string) => {
  if (!need.startsWith("#")) return need === id;
  const d = item(id);
  return !!d && isFood(d) && d.tags.includes(need.slice(1));
};

/** The recipe these exact ingredients make in this vessel (any order), or null. */
export function match(vessel: Vessel, chosen: string[]): Recipe | null {
  for (const r of RECIPES) {
    if (r.vessel !== vessel || r.needs.length !== chosen.length) continue;
    const left = [...chosen];
    // exact ids first, then the "any" slots
    const order = [...r.needs].sort((a, b) => Number(a.startsWith("#")) - Number(b.startsWith("#")));
    let ok = true;
    for (const n of order) {
      const i = left.findIndex((id) => fits(n, id));
      if (i < 0) {
        ok = false;
        break;
      }
      left.splice(i, 1);
    }
    if (ok) return r;
  }
  return null;
}

/** Ingredients some recipe asks for by name (kept back from "any fish" slots when there's a choice). */
const NAMED = new Set(RECIPES.flatMap((r) => r.needs.filter((n) => !n.startsWith("#"))));

/** Fish to use for a "#fish" slot: the most plentiful ordinary fish first, rare ones last. */
function pickFor(need: string, taken: Map<string, number>, count: (id: string) => number): string | null {
  const options = allItems()
    .filter((d) => fits(need, d.id) && count(d.id) - (taken.get(d.id) ?? 0) > 0)
    .sort((a, b) => Number(a.tags.includes("rare")) - Number(b.tags.includes("rare")) || Number(NAMED.has(a.id)) - Number(NAMED.has(b.id)) || count(b.id) - count(a.id));
  return options[0]?.id ?? null;
}

/**
 * The exact items one cook of this recipe would take from the bag, or null if something's missing.
 * `times` asks for that many cooks at once.
 */
export function ingredientsFor(r: Recipe, times = 1, count: (id: string) => number = bag.count): string[] | null {
  const taken = new Map<string, number>();
  const out: string[] = [];
  for (let k = 0; k < times; k++) {
    for (const n of [...r.needs].sort((a, b) => Number(a.startsWith("#")) - Number(b.startsWith("#")))) {
      const id = n.startsWith("#") ? pickFor(n, taken, count) : count(n) - (taken.get(n) ?? 0) > 0 ? n : null;
      if (!id) return null;
      taken.set(id, (taken.get(id) ?? 0) + 1);
      out.push(id);
    }
  }
  return out;
}

/** How many times the bag can cook this recipe right now. */
export function canCook(r: Recipe, count: (id: string) => number = bag.count) {
  let n = 0;
  while (n < 50 && ingredientsFor(r, n + 1, count)) n++;
  return n;
}

/** A need as words: "Potato", "Any fish". */
export function needName(n: string) {
  if (n.startsWith("#")) return `Any ${n.slice(1)}`;
  return item(n)?.name ?? n;
}

/** Needs grouped with counts: [["potato", 2], ["#fish", 1]]. */
export function grouped(needs: string[]): [string, number][] {
  const m = new Map<string, number>();
  for (const n of needs) m.set(n, (m.get(n) ?? 0) + 1);
  return [...m.entries()];
}

/** How many of a need the bag holds (any fish counts every fish but the koi). */
export function have(n: string, count: (id: string) => number = bag.count) {
  if (!n.startsWith("#")) return count(n);
  return allItems().filter((d) => fits(n, d.id)).reduce((s, d) => s + count(d.id), 0);
}
