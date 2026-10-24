import { store } from "../../state.ts";
import { hearts } from "../../friends.ts";
import { clock } from "../clock.ts";
import { tasteOf } from "../gifts.ts";
import { bag, item } from "../items.ts";
import { lifeSave } from "../save.ts";
import type { LifeApp } from "../context.ts";
import { RECIPES } from "./recipes.ts";
import { cookSfx } from "./sound.ts";
import { knows } from "./state.ts";

// Where the ingredients come from: the villagers share them. Once a valley day, the first chat
// with someone who has settled in (their building is finished) ends with a little something
// from their own life: Bram's cellar, Wren's field, Marlo's catch, Hazel's hens and churn...
// More, and rarer, as friendship grows. Now and then they ask for a dish in return, and they
// take it gladly the next time you visit with it in your bag (friendship, and a thank-you).
// The chat flow calls villageChat() (src/ui/app.ts converse); everything else lives here.

/** [item id, weight, hearts needed] */
type Good = [string, number, number?];

interface Giver {
  /** Their building: they share once it's finished and they've settled in. */
  home: string;
  goods: Good[];
  /** Why they're giving it, in their voice. {gift} becomes "two potatoes and a bulb of garlic". */
  lines: string[];
  /** Asking for a dish ({dish}), and thanking you for it. */
  ask: string;
  thanks: string;
}

const GIVERS: Record<string, Giver> = {
  innkeeper: {
    home: "tavern",
    goods: [["potato", 3], ["carrot", 3], ["garlic", 2.5], ["cabbage", 1, 4], ["pumpkin", 0.6, 7]],
    lines: [
      "Before you go, friend: the cellar's overflowing. Take {gift}. Cook something that makes you happy.",
      "Supply cart came by. Here's {gift} for your bag. A cook should never walk about empty-handed.",
      "I over-ordered again. Don't tell anyone. Take {gift} off my hands, eh?",
    ],
    ask: "I've a hankering, friend, and it's not for my own cooking for once. Make me {dish} one of these days?",
    thanks: "Is that {dish}? For me? Sit, sit. No, I'll sit. Mm. Mmm! You've the knack, friend. Take these, from the cellar.",
  },
  miller: {
    home: "mill",
    goods: [["wheat", 4], ["carrot", 1, 2], ["cabbage", 1, 3], ["pumpkin", 0.8, 5]],
    lines: [
      "The field gave more than I can mill on my own, and I hate waste more than still air. Take {gift}.",
      "Here, {gift}. Fresh from the field edge this morning. Well, this dawn. Same thing.",
      "Wind's good, wheat's good, so you get {gift}. Bring the wheat to the millstone and I'll show you flour.",
    ],
    ask: "Can I ask a favour? If the wind's right and you're cooking anyway: {dish}. I've been dreaming about it.",
    thanks: "{dish}! You made it! Grandmother would say a friend who feeds you is worth two mills. Here, take these.",
  },
  fisher: {
    home: "dock",
    goods: [["minnow", 3], ["perch", 3], ["brown_trout", 2, 2], ["crayfish", 1.5, 3], ["carp", 1, 5], ["pike", 0.5, 7]],
    lines: ["...Caught more than I need. Take {gift}.", "Gran said share the first catch. ...So. {gift}.", "Bell rang twice this morning. Good luck. Here: {gift}."],
    ask: "...Been a long time since anyone cooked for me. {dish}, maybe. If it's no trouble.",
    thanks: "...{dish}. Smells like Gran's kitchen. ...Thank you. Take these. Don't argue.",
  },
  merchant: {
    home: "market",
    goods: [["strawberry", 3], ["honey", 1.5, 2], ["pumpkin", 1, 4], ["egg", 1, 1]],
    lines: [
      "Partner! Fell off a caravan, entirely legally: {gift}. On the house. Don't tell the house.",
      "A trader came through with more than he could sell. His loss! Here's {gift}.",
      "Market rule: friends get first pick. Today's pick: {gift}.",
    ],
    ask: "Partner, a business proposal. You make me {dish}, I pay you in gratitude. Excellent exchange rate.",
    thanks: "{dish}! For me? I'd sell it, but I'm eating it. Here: payment in kind, as agreed. Very fair. To you.",
  },
  baker: {
    home: "bakery",
    goods: [["egg", 3], ["butter", 2], ["flour", 2], ["strawberry", 1, 5]],
    lines: [
      "My hens laid early and the churn's full. {gift}. Use them properly.",
      "{gift}. Fresh this morning. I measured them. Don't ask why.",
      "Take {gift}. Butter keeps four days. Eggs a week. You'll use them in two. I've seen you.",
    ],
    ask: "I'd like {dish}. Made by someone else, for once. You'll do. That's a compliment.",
    thanks: "{dish}. ...Good. Very good. Better than I'd have done, which I won't say twice. Take these.",
  },
  smith: {
    home: "forge",
    goods: [["garlic", 3], ["cabbage", 2], ["potato", 1]],
    lines: [
      "Grow garlic by a forge wall and it never feels the frost. Take {gift}.",
      "Cabbages behind the forge came up enormous again. Must be the heat. {gift}. Go on.",
      "Here. {gift}. Proper food for proper work.",
    ],
    ask: "Something hearty would go down well after the forge. {dish}, if you've the time.",
    thanks: "{dish}. That's proper food. Thanks. Here, from the forge garden.",
  },
  librarian: {
    home: "library",
    goods: [["mint", 3], ["chamomile", 1.5]],
    lines: [
      "My windowsill mint has escaped its pot again. Please, take {gift} before it reaches the reading room.",
      "I was pressing flowers between the pages and, er, ran out of pages. {gift}, for you.",
    ],
    ask: "I have a theory that {dish} improves reading speed. I would be delighted to test it. Rigorously.",
    thanks: "{dish}! For science! And for me. Mostly for me. Thank you! Here, from the windowsill.",
  },
  herbalist: {
    home: "apothecary",
    goods: [["chamomile", 3], ["mint", 2], ["strawberry", 1, 3]],
    lines: [
      "The garden insisted. Here's {gift}. They'd like to become something warm.",
      "The chamomile asked about you this morning. Take {gift}, dear.",
      "{gift}, picked while the dew was still on them. They're in a very good mood.",
    ],
    ask: "Would you make me {dish}, dear? The garden thinks I don't eat enough. The garden is right.",
    thanks: "{dish}! Oh, it's still warm. The mint is jealous. Take these, with the garden's thanks.",
  },
  mayor: {
    home: "townhall",
    goods: [["carrot", 2], ["mint", 1.5], ["pumpkin", 1.2, 3]],
    lines: [
      "On behalf of the Town Vegetable Committee (me), I present {gift}! Applause optional. Encouraged.",
      "From the ceremonial vegetable plot: {gift}. Officially recorded. Unofficially delicious.",
    ],
    ask: "Citizen! The town requests, by decree, {dish}. The decree is that I'm hungry.",
    thanks: "{dish}! I declare this the finest act of public service of the year. Here, from the Committee.",
  },
  tinker: {
    home: "clocktower",
    goods: [["egg", 3], ["potato", 1]],
    lines: [
      "Henrietta laid again! My clockwork hen. Don't ask how. Here's {gift}.",
      "I built a potato sorter. It sorted them into 'yours'. Take {gift}!",
    ],
    ask: "Could you make me {dish}? I keep forgetting to eat. I built a reminder. I forgot to wind it.",
    thanks: "{dish}! Oh, that's better than oil. Don't tell my gears. Here, Henrietta laid these for you.",
  },
  captain: {
    home: "guildhall",
    goods: [["potato", 2], ["garlic", 2], ["brown_trout", 1, 4]],
    lines: ["Trail rations, recruit: {gift}. Never march hungry.", "Quartermaster's surplus. {gift}. Sign nothing, take everything."],
    ask: "Recruit. A request, not an order: {dish}. Like the camp cooks used to make.",
    thanks: "{dish}. That's a proper camp supper. You'd have made a fine quartermaster. Take these.",
  },
  lord_vane: {
    home: "guildhall",
    goods: [["strawberry", 2], ["honey", 2]],
    lines: [
      "The Company hothouse sent me {gift}. I find I would rather they went to someone who cooks.",
      "{gift}. Delivered in error to my lodgings. I am correcting the error. In your favour.",
    ],
    ask: "I would be... most obliged... for {dish}. Should it happen to be convenient. In triplicate.",
    thanks: "{dish}. Most... most kind. I shall file it under 'pleasant surprises'. A thin file, until lately. Please, take these.",
  },
};

// how ingredients read in a sentence: [one, many] ({n} is the count)
const UNITS: Record<string, [string, string]> = {
  potato: ["a potato", "{n} potatoes"],
  carrot: ["a carrot", "{n} carrots"],
  garlic: ["a bulb of garlic", "{n} bulbs of garlic"],
  cabbage: ["a cabbage", "{n} cabbages"],
  pumpkin: ["a pumpkin", "{n} pumpkins"],
  wheat: ["a sheaf of wheat", "{n} sheaves of wheat"],
  strawberry: ["a handful of strawberries", "{n} handfuls of strawberries"],
  chamomile: ["a bunch of chamomile", "{n} bunches of chamomile"],
  mint: ["a sprig of mint", "{n} sprigs of mint"],
  egg: ["an egg", "{n} eggs"],
  butter: ["a pat of butter", "{n} pats of butter"],
  honey: ["a jar of honey", "{n} jars of honey"],
  flour: ["a scoop of flour", "{n} scoops of flour"],
  minnow: ["a minnow", "{n} minnows"],
  perch: ["a perch", "{n} perch"],
  brown_trout: ["a brown trout", "{n} brown trout"],
  crayfish: ["a crayfish", "{n} crayfish"],
  carp: ["a carp", "{n} carp"],
  pike: ["a pike", "{n} pike"],
};
const WORDS = ["", "", "two", "three", "four", "five"];

export function phrase(id: string, n: number) {
  const u = UNITS[id] ?? [`a ${(item(id)?.name ?? id).toLowerCase()}`, `{n} ${(item(id)?.name ?? id).toLowerCase()}`];
  return n === 1 ? u[0] : u[1].replace("{n}", WORDS[n] ?? String(n));
}

const list = (parts: string[]) => (parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`);
const cap = (s: string) => s.replace(/^(\W*)(\w)/, (_, a, b) => a + b.toUpperCase());

interface PantrySave {
  /** Valley day of each person's last gift. */
  gave: Record<string, number>;
  /** Open dish requests: person id -> { dish, day asked }. */
  asks: Record<string, { dish: string; day: number }>;
  /** Requests fulfilled so far. */
  done: number;
}
const pantrySave = () => lifeSave<PantrySave>("cooking_pantry", () => ({ gave: {}, asks: {}, done: 0 }));

let app: LifeApp | null = null;
let finished: (id: string) => boolean = () => false;
/** Set by the cooking system at install. */
export function connectPantry(a: LifeApp) {
  app = a;
  finished = (id) => a.finished(id);
}

/** Open requests, for the recipe book: [person id, dish id]. */
export function openAsks(): [string, string][] {
  return Object.entries(pantrySave().asks).map(([who, a]) => [who, a.dish]);
}

/** Draw today's gift: n units, at most three kinds, weighted, the rarer ones only with friendship. */
function draw(g: Giver, h: number, rnd: () => number): [string, number][] {
  const pool = g.goods.filter(([, , min = 0]) => h >= min);
  const n = h < 2 ? 2 : h < 5 ? 3 : h < 8 ? 4 : 5;
  const got = new Map<string, number>();
  for (let k = 0; k < n; k++) {
    const options = pool.filter(([id]) => got.has(id) || got.size < 3);
    const total = options.reduce((s, [, w]) => s + w, 0);
    let r = rnd() * total;
    for (const [id, w] of options) {
      r -= w;
      if (r <= 0) {
        got.set(id, (got.get(id) ?? 0) + 1);
        break;
      }
    }
  }
  return [...got.entries()];
}

/** A dish they'd love (or like) that the founder already knows how to cook, if any. */
function wish(who: string, rnd: () => number): string | null {
  const known = RECIPES.map((r) => r.id).filter(knows);
  const loved = known.filter((id) => tasteOf(who, id) === "loved");
  const liked = known.filter((id) => tasteOf(who, id) === "liked");
  const pick = loved.length ? loved : liked;
  return pick.length ? pick[Math.floor(rnd() * pick.length)] : null;
}

/**
 * Called by the chat flow every time you talk to a villager. Returns extra lines for them to
 * say at the end of the chat (in their own voice), having already put any gift in the bag.
 */
export function villageChat(personId: string): string[] {
  const g = GIVERS[personId];
  if (!g || !finished(g.home)) return [];
  const s = pantrySave();
  const out: string[] = [];
  const got: [string, number][] = [];
  const name = (id: string) => (item(id)?.name ?? id).toLowerCase();
  // a dish they asked for, now in the bag: they take it gladly
  const ask = s.asks[personId];
  if (ask && bag.has(ask.dish)) {
    bag.take(ask.dish);
    delete s.asks[personId];
    s.done++;
    out.push(cap(g.thanks.replaceAll("{dish}", name(ask.dish))));
    const h = hearts(personId);
    got.push(...draw(g, Math.max(h, 5), Math.random));
    for (const [id, n] of got) bag.add(id, n);
    store.changed();
    afterChat(personId, got, 60);
    return out;
  }
  // once a valley day: a little something from their life
  if (s.gave[personId] === clock.day) return [];
  s.gave[personId] = clock.day;
  const h = hearts(personId);
  const today = draw(g, h, Math.random);
  for (const [id, n] of today) bag.add(id, n);
  got.push(...today);
  const line = g.lines[(clock.day + personId.length) % g.lines.length];
  out.push(cap(line.replace("{gift}", `**${list(today.map(([id, n]) => phrase(id, n)))}**`)));
  // now and then, once you're friends, a request
  if (!ask && h >= 2 && Math.random() < 0.3) {
    const dish = wish(personId, Math.random);
    if (dish) {
      s.asks[personId] = { dish, day: clock.day };
      out.push(cap(g.ask.replaceAll("{dish}", name(dish))));
    }
  }
  store.changed();
  afterChat(personId, got, 0);
  return out;
}

/** Once the dialogue has closed: show what went into the bag, and any friendship from a request. */
function afterChat(personId: string, got: [string, number][], points: number) {
  const a = app;
  if (!a) return;
  const wait = () => {
    if (a.ui.querySelector(".dialog, .modal-back")) return void setTimeout(wait, 250);
    if (points) a.befriend(personId, points);
    showBasket(a, got);
  };
  setTimeout(wait, 300);
}

let basketTimer = 0;
function showBasket(a: LifeApp, got: [string, number][]) {
  a.ui.querySelector(".cook-basket")?.remove();
  const el = document.createElement("div");
  el.className = "plate cook-basket";
  el.setAttribute("role", "status");
  el.innerHTML =
    `<span class="lbl">Into your bag</span>` +
    got
      .map(([id, n]) => {
        const d = item(id);
        return d ? `<span class="it" title="${d.name}"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:${d.color ?? "currentColor"}">${d.icon}</svg><b>${n}</b></span>` : "";
      })
      .join("");
  a.ui.append(el);
  clearTimeout(basketTimer);
  basketTimer = window.setTimeout(() => el.classList.add("out"), 3600);
  window.setTimeout(() => el.remove(), 4200);
  cookSfx.basket();
}
