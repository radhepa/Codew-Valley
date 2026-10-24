import { defineItems, type ItemDef } from "../items.ts";

// Cooking's items: flour (milled from wheat) and the dishes. The ids are a contract (the
// villagers' gift tastes use their tags): refine names, words and icons freely, add more
// dishes, but keep these ids and the tags that matter for gifts (LIFE.md).

const BOWL = `<path d="M4 11h16a8 8 0 0 1-16 0z"/>`;
const STEAM = `<path d="M9 7c0-1 1-1 1-2M13 7c0-1 1-1 1-2"/>`;
const PLATE = `<ellipse cx="12" cy="15" rx="9" ry="3.5"/>`;

export const COOK_ITEMS: ItemDef[] = [
  { id: "flour", name: "Flour", kind: "ingredient", desc: "Soft white flour from Wren's millstone.", icon: `<path d="M7 7h10l1 13H6z"/><path d="M8 7c0-1.5 1-3 4-3s4 1.5 4 3"/><path d="M10 12h4"/>`, color: "#b9a98a", tags: ["grain", "flour"] },
  { id: "bram_stew", name: "Bram's Garlic Stew", kind: "dish", desc: "Potatoes, carrots and far too much garlic. Bram's own recipe, older than the tavern.", icon: BOWL + STEAM + `<path d="M8 13h8"/>`, color: "#a5552f", tags: ["dish", "hearty", "garlic", "stew", "warm", "savory"] },
  { id: "carrot_soup", name: "Carrot Soup", kind: "dish", desc: "Smooth, orange and warming.", icon: BOWL + STEAM, color: "#d0702e", tags: ["dish", "soup", "warm", "veg"] },
  { id: "pumpkin_soup", name: "Pumpkin Soup", kind: "dish", desc: "Sweet and golden, with a swirl on top.", icon: BOWL + STEAM + `<path d="M10 14c1-1 3-1 4 0"/>`, color: "#d07a2b", tags: ["dish", "soup", "warm", "sweet"] },
  { id: "grilled_trout", name: "Grilled Trout", kind: "dish", desc: "Crispy skin, a squeeze of herbs. Marlo approves, quietly.", icon: PLATE + `<path d="M6 13c2-2 7-3 10-1l2-1.5v4L16 13c-3 2-8 1-10-0z"/>`, color: "#8a6a45", tags: ["dish", "fish", "savory"] },
  { id: "fish_pie", name: "Fisher's Pie", kind: "dish", desc: "Fish and potato under a golden crust. Feeds a whole crew.", icon: `<path d="M3 13h18l-2 6H5z"/><path d="M4 13c2-3 14-3 16 0"/><path d="M8 11.5l1 1M12 11l0 1.5M16 11.5l-1 1"/>`, color: "#c08a3e", tags: ["dish", "fish", "hearty", "warm"] },
  { id: "crayfish_boil", name: "Spicy Crayfish Boil", kind: "dish", desc: "Crayfish and garlic in a peppery broth. Ingrid asks for seconds.", icon: BOWL + `<path d="M10 9l-1-2M14 9l1-2M9 13c2 1 4 1 6 0"/>`, color: "#b2553a", tags: ["dish", "spicy", "hearty", "savory"] },
  { id: "cabbage_rolls", name: "Cabbage Rolls", kind: "dish", desc: "Little leafy parcels, tied up neat.", icon: PLATE + `<rect x="6" y="10" width="5" height="4" rx="2"/><rect x="12" y="10" width="5" height="4" rx="2"/>`, color: "#6f8f4a", tags: ["dish", "veg", "savory"] },
  { id: "herb_tea", name: "Chamomile Tea", kind: "dish", desc: "A cup that smells of apples and evenings.", icon: `<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2 2 0 0 1 0 4H16"/><path d="M9 6c0-1 1-1 1-2M12 6c0-1 1-1 1-2"/>`, color: "#b9952f", tags: ["dish", "tea", "herb", "warm"] },
  { id: "mint_humbug", name: "Mint Humbugs", kind: "dish", desc: "Striped boiled sweets that make your eyes water. The Mayor keeps a tin.", icon: `<path d="M7 12l-3-3v6zM17 12l3-3v6z"/><ellipse cx="12" cy="12" rx="5" ry="3.5"/><path d="M10 9l1 6M13 9l1 6"/>`, color: "#4f9a6b", tags: ["dish", "sweet", "peppermint"] },
  { id: "bread_loaf", name: "Country Loaf", kind: "dish", desc: "Crackly crust, soft inside. Baked in Hazel's oven.", icon: `<path d="M4 14c0-4 4-6 8-6s8 2 8 6v3H4z"/><path d="M8 10l1 3M12 9.5v3.5M16 10l-1 3"/>`, color: "#b07a3c", tags: ["dish", "bread", "grain", "warm"] },
  { id: "strawberry_tart", name: "Strawberry Tart", kind: "dish", desc: "Glazed berries on a buttery case. Lord Vane calls it 'acceptable', then has three.", icon: `<path d="M3 13h18l-2 5H5z"/><circle cx="8" cy="11" r="1.6"/><circle cx="12" cy="10.5" r="1.6"/><circle cx="16" cy="11" r="1.6"/>`, color: "#c2453c", tags: ["dish", "sweet", "fancy", "fruit"] },
];

defineItems(COOK_ITEMS);
