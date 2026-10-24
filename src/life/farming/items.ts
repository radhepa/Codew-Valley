import { defineItems, type ItemDef } from "../items.ts";

// Farming's items: seeds and the crops they grow. The ids are a contract (cooking's recipes
// and the villagers' gift tastes use them): refine names, words and icons freely, but keep
// the ids and the tags that matter for gifts (LIFE.md).

const CROPS: { id: string; name: string; desc: string; seedDesc: string; icon: string; color: string; tags: string[] }[] = [
  {
    id: "wheat",
    name: "Wheat",
    desc: "A golden sheaf. Wren can mill it into flour.",
    seedDesc: "Wheat grains for sowing. The valley grew wheat long before the mill.",
    icon: `<path d="M12 21V7"/><path d="M12 9c-2-1-3-3-3-5 2 1 3 3 3 5zM12 9c2-1 3-3 3-5-2 1-3 3-3 5zM12 13c-2-1-3-3-3-5 2 1 3 3 3 5zM12 13c2-1 3-3 3-5-2 1-3 3-3 5zM12 17c-2-1-3-3-3-5 2 1 3 3 3 5zM12 17c2-1 3-3 3-5-2 1-3 3-3 5z"/>`,
    color: "#b8892f",
    tags: ["crop", "grain", "wheat"],
  },
  {
    id: "carrot",
    name: "Carrot",
    desc: "Crunchy, sweet and very orange.",
    seedDesc: "Tiny carrot seeds. They take their time.",
    icon: `<path d="M14 10 5 20c-1 1 0 2 1 1l10-9z"/><path d="M14 10c1-3 3-5 6-6M15 11c2-1 4-1 6 0M14 10c0-2 0-4-1-6"/><path d="M9 15l1.5 1M11 13l1.5 1"/>`,
    color: "#d0702e",
    tags: ["crop", "veg"],
  },
  {
    id: "potato",
    name: "Potato",
    desc: "Lumpy, earthy, and the backbone of every good stew.",
    seedDesc: "Seed potatoes, already sprouting eyes.",
    icon: `<path d="M5 13c0-4 4-7 8-7s6 3 6 6-3 7-8 7c-4 0-6-3-6-6z"/><circle cx="10" cy="11" r=".6" fill="currentColor"/><circle cx="14" cy="14" r=".6" fill="currentColor"/><circle cx="11" cy="16" r=".6" fill="currentColor"/>`,
    color: "#a07b4f",
    tags: ["crop", "veg", "hearty"],
  },
  {
    id: "garlic",
    name: "Garlic",
    desc: "A fat white bulb. Bram can smell it from across the valley.",
    seedDesc: "Garlic cloves, pointy end up.",
    icon: `<path d="M12 4c0 3-6 5-6 10a6 5 0 0 0 12 0c0-5-6-7-6-10z"/><path d="M12 9c-1 3-1 7 0 10M9.5 11c-1 2-1 5 0 7.5M14.5 11c1 2 1 5 0 7.5"/>`,
    color: "#a49a86",
    tags: ["crop", "veg", "garlic", "spicy"],
  },
  {
    id: "cabbage",
    name: "Cabbage",
    desc: "Round, leafy and surprisingly heavy.",
    seedDesc: "Cabbage seeds. Plant them and stand back.",
    icon: `<circle cx="12" cy="13" r="7"/><path d="M12 6c-2 3-2 9 0 14M12 6c2 3 2 9 0 14M6 11c3 1 9 1 12 0"/>`,
    color: "#6f8f4a",
    tags: ["crop", "veg"],
  },
  {
    id: "pumpkin",
    name: "Pumpkin",
    desc: "A great orange pumpkin. Rare, round and very proud of itself.",
    seedDesc: "Flat pumpkin seeds. They need room and patience.",
    icon: `<path d="M12 7c-4 0-8 2-8 6s4 7 8 7 8-3 8-7-4-6-8-6z"/><path d="M12 7c-2 2-2 11 0 13M12 7c2 2 2 11 0 13M12 7c0-2 1-3 2-3"/>`,
    color: "#d07a2b",
    tags: ["crop", "veg", "sweet", "rare"],
  },
  {
    id: "strawberry",
    name: "Strawberry",
    desc: "Small, red and gone in one bite.",
    seedDesc: "Strawberry runners, ready to settle in.",
    icon: `<path d="M12 8c-4 0-6 2-6 5 0 4 4 7 6 8 2-1 6-4 6-8 0-3-2-5-6-5z"/><path d="M9 6l3 2 3-2M12 8V5"/><circle cx="10" cy="12" r=".5" fill="currentColor"/><circle cx="14" cy="12" r=".5" fill="currentColor"/><circle cx="12" cy="15" r=".5" fill="currentColor"/>`,
    color: "#c2453c",
    tags: ["crop", "fruit", "sweet"],
  },
  {
    id: "chamomile",
    name: "Chamomile",
    desc: "Little daisy-like flowers that smell of apples. Mirela's favourite for tea.",
    seedDesc: "Chamomile seed, fine as dust.",
    icon: `<circle cx="12" cy="10" r="2"/><path d="M12 6V4M12 16v-2M8 10H6M18 10h-2M9 7 7.5 5.5M15 7l1.5-1.5M9 13l-1.5 1.5M15 13l1.5 1.5"/><path d="M12 14v7M12 18c-2 0-3-1-4-2"/>`,
    color: "#c9a93a",
    tags: ["crop", "flower", "herb", "chamomile", "tea"],
  },
  {
    id: "mint",
    name: "Mint",
    desc: "Bright, cool leaves. Shy, according to Mirela.",
    seedDesc: "Mint cuttings. It spreads if you let it.",
    icon: `<path d="M12 21V9"/><path d="M12 13c-4 0-6-3-6-6 4 0 6 3 6 6zM12 11c4 0 6-3 6-6-4 0-6 3-6 6z"/><path d="M12 17c-3 0-5-2-5-4 3 0 5 2 5 4z"/>`,
    color: "#4f9a6b",
    tags: ["crop", "herb", "peppermint"],
  },
];

const SEED_ICON = `<path d="M6 7h12l-1 12H7z"/><path d="M8 7c0-2 2-3 4-3s4 1 4 3"/><circle cx="10" cy="12" r=".7" fill="currentColor"/><circle cx="14" cy="13" r=".7" fill="currentColor"/><circle cx="12" cy="16" r=".7" fill="currentColor"/>`;

export const FARM_ITEMS: ItemDef[] = [
  ...CROPS.map((c): ItemDef => ({ id: c.id, name: c.name, kind: "crop", desc: c.desc, icon: c.icon, color: c.color, tags: c.tags })),
  ...CROPS.map((c): ItemDef => ({ id: `${c.id}_seeds`, name: `${c.name} seeds`, kind: "seed", desc: c.seedDesc, icon: SEED_ICON, color: c.color, tags: ["seed"] })),
];

defineItems(FARM_ITEMS);
