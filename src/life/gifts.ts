import type { Person } from "../content/types.ts";
import { befriend, bond, today, type Gain } from "../friends.ts";
import { store } from "../state.ts";
import { bag, item, giftable, type ItemDef } from "./items.ts";

// Gifts: one a day per villager, from anything in the bag that can be given. How much it
// means depends on their taste, matched on item ids or tags (items.ts). Nothing is ever a
// cruel gift: a disliked one just earns nothing, and they're polite about it.

export type Taste = "loved" | "liked" | "neutral" | "disliked";
export const GIFT_POINTS: Record<Taste, number> = { loved: 80, liked: 45, neutral: 20, disliked: 0 };

interface Tastes {
  loved: string[];
  liked: string[];
  disliked: string[];
  /** What they say, by taste; {item} becomes the item's name in lower case. */
  say: Record<Taste, string>;
}

/** Each villager's taste, by person id. Tags and item ids both work. */
const TASTES: Record<string, Tastes> = {
  pip: {
    loved: ["stew", "warm"],
    liked: ["egg", "shiny", "fish"],
    disliked: ["cold", "sour"],
    say: {
      loved: "For me? Is it warm? It IS warm. Pip is going to curl up around this {item} and never move again.",
      liked: "Ooh, {item}! Pip will guard it with great dignity. And then possibly eat it.",
      neutral: "A {item}! How thoughtful. Pip will put it somewhere safe. Somewhere. Ssso many safe places.",
      disliked: "Ah. {item}. Pip is very grateful, and also very cold now, just looking at it.",
    },
  },
  innkeeper: {
    loved: ["garlic", "cider", "hearty"],
    liked: ["soup", "stew", "bread", "veg", "fish"],
    disliked: ["cold", "junk"],
    say: {
      loved: "Now THIS is a gift. {item}! I'm putting it on the menu tonight and telling everyone it was my idea.",
      liked: "{item}, eh? That'll find its way into a pot before supper. Thank you, founder.",
      neutral: "Well, that's kind. I'll find a shelf for the {item}. The Serpent has a lot of shelves.",
      disliked: "That's... thank you. I'll keep the {item} somewhere it can't go cold on me. Colder.",
    },
  },
  miller: {
    loved: ["grain", "wheat"],
    liked: ["bread", "sweet", "flower"],
    disliked: ["junk", "rotten"],
    say: {
      loved: "Oh! {item}! Feel the weight of that. My grandmother would've hugged you. I might.",
      liked: "{item}! Thank you. That's going straight on the windowsill where the wind can smell it.",
      neutral: "For me? Thank you! I'll find a use for the {item}. I always find a use.",
      disliked: "Ah, {item}. That's kind of you. I'll put it... over there. Downwind.",
    },
  },
  fisher: {
    loved: ["rare", "old"],
    liked: ["fish", "soup", "warm"],
    disliked: ["junk", "loud"],
    say: {
      loved: "...{item}. Gran would've told a story about this. Give me a minute and I'll remember which one.",
      liked: "{item}. That's a good one. Thank you.",
      neutral: "Hm. {item}. Kind of you.",
      disliked: "...Right. {item}. I'll, er, put it with the tangled lines.",
    },
  },
  merchant: {
    loved: ["honey", "shiny"],
    liked: ["sweet", "rare", "treasure"],
    disliked: ["junk", "plain"],
    say: {
      loved: "Partner! {item}! Do you know what this would fetch at the Lantern Road fair? Never mind, I'm keeping it.",
      liked: "{item}, nice, very nice. I'd haggle you up for it, but it's a gift, so I'll just say thank you. Twice.",
      neutral: "A {item}! Every stall needs one. Probably. I'll find the right buyer. Or shelf.",
      disliked: "{item}. Hm. Not my usual stock. I'll be honest, partner: I'll be passing this one along.",
    },
  },
  baker: {
    loved: ["grain", "dairy"],
    liked: ["herb", "fruit", "sweet", "soup", "egg"],
    disliked: ["burnt", "junk"],
    say: {
      loved: "{item}. Good. Very good. I know exactly what loaf this wants to be. Thank you.",
      liked: "{item}? That'll go in tomorrow's bake. Thank you.",
      neutral: "Thank you. I'll find a place for the {item}. Not on the bread board.",
      disliked: "{item}. I'll take it, since you brought it. Please don't bring it near the oven again.",
    },
  },
  smith: {
    loved: ["hearty", "spicy"],
    liked: ["fish", "bread", "veg", "soup"],
    disliked: ["fancy", "junk"],
    say: {
      loved: "{item}. That's proper food for proper work. Thank you.",
      liked: "{item}. Good. That'll do me after the forge.",
      neutral: "Thanks. {item}. I'll find a use.",
      disliked: "{item}. Hm. Honest answer? Not for me. Still, thanks for thinking of me.",
    },
  },
  librarian: {
    loved: ["tea", "old"],
    liked: ["bread", "sweet", "herb"],
    disliked: ["slimy", "damp"],
    say: {
      loved: "Oh! Oh, {item}! This deserves a footnote. Several footnotes. A chapter, possibly!",
      liked: "{item}, how lovely. I shall enjoy it at once. Or after this paragraph. Or the next.",
      neutral: "Ah, a {item}! Thank you. I'll file it under, er, G. For Gift. Yes.",
      disliked: "{item}! How... damp. Thank you. I'll keep it well away from the shelves.",
    },
  },
  herbalist: {
    loved: ["herb", "flower", "chamomile"],
    liked: ["veg", "fruit", "tea"],
    disliked: ["junk", "spicy"],
    say: {
      loved: "{item}! Oh, listen to it. It's happy to be here. So am I. Thank you.",
      liked: "{item}, how kind. The garden will want to know all about you.",
      neutral: "Thank you! I'll tell the {item} it's welcome. It helps.",
      disliked: "Oh. {item}. The mint is very upset. I'm only a little upset. Thank you anyway, dear.",
    },
  },
  mayor: {
    loved: ["peppermint", "sweet"],
    liked: ["fancy", "bread", "soup"],
    disliked: ["sour", "junk"],
    say: {
      loved: "{item}! Citizen, this is the finest gift ever given in this town! I'll mention it in my speech.",
      liked: "A {item}! Splendid. Noted in the town record. Unofficially. For now.",
      neutral: "Why, thank you! The town hall gratefully accepts this {item} on behalf of the people. Me.",
      disliked: "Ah! A {item}. How, er, democratic. I shall consult a committee about it.",
    },
  },
  tinker: {
    loved: ["oil", "shiny", "old"],
    liked: ["sweet", "veg", "egg"],
    disliked: ["sticky", "junk"],
    say: {
      loved: "{item}! Oh, I know exactly what this fixes. Nothing's broken yet, but it will be, and then: ready!",
      liked: "A {item}! Thank you. Hold this. No, that's yours. Thank you!",
      neutral: "Thank you! The {item} goes... here. No. Here. There. Perfect.",
      disliked: "{item}. Ah. It's a bit sticky, isn't it? I'll keep it away from the gears.",
    },
  },
  captain: {
    loved: ["tea", "hearty"],
    liked: ["fish", "spicy", "bread"],
    disliked: ["sweet", "junk"],
    say: {
      loved: "{item}. Recruit, that's the best thing anyone's handed me since my first map.",
      liked: "{item}. Good kit. Thank you.",
      neutral: "{item}, is it? Thank you, recruit. It'll go in the pack.",
      disliked: "{item}. Hm. In my day we called that dessert, and we didn't trust it.",
    },
  },
  lord_vane: {
    loved: ["fancy", "rare"],
    liked: ["tea", "sweet", "bread"],
    disliked: ["mud", "junk"],
    say: {
      loved: "{item}! This is... most generous. I shall file a letter of thanks. In triplicate.",
      liked: "A {item}. How very civil of you. Thank you.",
      neutral: "A {item}. Received, with thanks. Initial here.",
      disliked: "A {item}. It is... noted. Please don't let it near my boots.",
    },
  },
};

function matches(list: string[], d: ItemDef) {
  return list.includes(d.id) || d.tags.some((t) => list.includes(t));
}

export function tasteOf(personId: string, itemId: string): Taste {
  const t = TASTES[personId];
  const d = item(itemId);
  if (!t || !d) return "neutral";
  if (matches(t.loved, d)) return "loved";
  if (matches(t.disliked, d)) return "disliked";
  if (matches(t.liked, d)) return "liked";
  return "neutral";
}

/** Whether the founder can give this villager a gift right now (once a day, and something to give). */
export function canGift(personId: string) {
  return bond(personId).giftedOn !== today() && giftables().length > 0;
}

export const giftables = () => bag.contents().filter((c) => giftable(c.item));

/** Give one of an item: it leaves the bag, they react, friendship grows. */
export function give(p: Person, itemId: string): { taste: Taste; line: string; gain: Gain | null } | null {
  const d = item(itemId);
  if (!d || !giftable(d) || !canGift(p.id) || !bag.take(itemId)) return null;
  const taste = tasteOf(p.id, itemId);
  const b = bond(p.id);
  b.giftedOn = today();
  (b.gifts ??= []).push(itemId);
  store.changed();
  const say = TASTES[p.id]?.say[taste] ?? "Thank you! A {item}.";
  const line = say.replaceAll("{item}", d.name.toLowerCase()).replace(/^./, (c) => c.toUpperCase());
  return { taste, line, gain: befriend(p.id, GIFT_POINTS[taste]) };
}

/** For the Friends journal: the gifts they've loved so far (known tastes), by item id. */
export function knownLoves(personId: string): string[] {
  const given = bond(personId).gifts ?? [];
  return [...new Set(given.filter((id) => tasteOf(personId, id) === "loved"))];
}
