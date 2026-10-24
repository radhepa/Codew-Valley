import { defineItems, type ItemDef } from "../items.ts";

// Fishing's items: what the pond gives. The ids are a contract (cooking's recipes and the
// villagers' gift tastes use them): refine names, words and icons freely, but keep the ids
// and the tags that matter for gifts (LIFE.md).

const FISH = `<path d="M3 12c3-4 9-5 13-2l4-3v10l-4-3c-4 3-10 2-13-2z"/><circle cx="7" cy="11" r=".8" fill="currentColor"/>`;
const BIG_FISH = `<path d="M2 12c3-5 11-6 15-2l5-3v10l-5-3c-4 4-12 3-15-2z"/><circle cx="6" cy="11" r=".9" fill="currentColor"/><path d="M10 9c1 2 1 4 0 6"/>`;

export const FISH_ITEMS: ItemDef[] = [
  { id: "minnow", name: "Minnow", kind: "fish", desc: "A tiny silver flicker. Everyone's first catch.", icon: `<path d="M6 12c2-2 6-3 9-1l3-2v6l-3-2c-3 2-7 1-9-1z"/><circle cx="8.5" cy="11.6" r=".6" fill="currentColor"/>`, color: "#8a98a0", tags: ["fish", "pond"] },
  { id: "perch", name: "Perch", kind: "fish", desc: "Striped and spiny, and it knows it.", icon: `${FISH}<path d="M9 9v6M12 8.5v7"/>`, color: "#7f8d4f", tags: ["fish", "pond"] },
  { id: "brown_trout", name: "Brown Trout", kind: "fish", desc: "Speckled and stubborn. Bites best in the cool of the morning.", icon: `${FISH}<circle cx="10" cy="12" r=".5" fill="currentColor"/><circle cx="12.5" cy="11" r=".5" fill="currentColor"/>`, color: "#8a6a45", tags: ["fish", "pond"] },
  { id: "carp", name: "Carp", kind: "fish", desc: "A slow, golden-brown old-timer. Marlo says some carp outlive the people who name them.", icon: BIG_FISH, color: "#9a7b3c", tags: ["fish", "pond", "old"] },
  { id: "pike", name: "Pike", kind: "fish", desc: "Long, toothy and in a terrible mood. A prize catch.", icon: `<path d="M2 12c3-2 12-3 16-1l4-2v6l-4-2c-4 2-13 1-16-1z"/><circle cx="5" cy="11.6" r=".7" fill="currentColor"/><path d="M3 12h2"/>`, color: "#5d7650", tags: ["fish", "pond", "rare"] },
  { id: "eel", name: "Eel", kind: "fish", desc: "Comes out at night and slides out of your hands twice.", icon: `<path d="M3 14c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><circle cx="4.5" cy="13" r=".6" fill="currentColor"/>`, color: "#4d5a52", tags: ["fish", "pond", "slimy"] },
  { id: "crayfish", name: "Crayfish", kind: "fish", desc: "A small grumpy lobster of the pond. Pinches.", icon: `<path d="M12 8v10M9 10c-2-1-4-3-3-5 2 0 3 2 3 5zM15 10c2-1 4-3 3-5-2 0-3 2-3 5z"/><path d="M10 12h4M10 15h4M11 18l-1 2M13 18l1 2"/>`, color: "#b2553a", tags: ["fish", "pond", "spicy"] },
  { id: "golden_koi", name: "Golden Koi", kind: "fish", desc: "It shines like a coin under the water. Nobody knows how it got into the pond.", icon: `${BIG_FISH}<path d="M14 6l1-2M17 7l2-1"/>`, color: "#d7a32c", tags: ["fish", "pond", "rare", "shiny"] },
  { id: "old_boot", name: "Old Boot", kind: "forage", desc: "Soggy, and not even a pair.", icon: `<path d="M7 4h5v9l6 2c1.5.5 2 1.5 2 3v1H6z"/><path d="M6 19v1h14"/>`, color: "#6b5a48", tags: ["junk"] },
  { id: "willowmere_coin", name: "Willowmere Coin", kind: "treasure", desc: "A green-bronze coin stamped with a rune. Three hundred years under the pond.", icon: `<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 8.5v7M10 10.5l2 1.5 2-1.5"/>`, color: "#5f9c86", tags: ["treasure", "old", "shiny", "rare"] },
];

defineItems(FISH_ITEMS);
