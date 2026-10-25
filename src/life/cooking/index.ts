import * as THREE from "three";
import type { LifeCtx, LifeLine, LifeSystem } from "../context.ts";
import { store } from "../../state.ts";
import { hearts, bond } from "../../friends.ts";
import { siteInfo } from "../../game/world.ts";
import { el, esc } from "../../ui/md.ts";
import { itemIcon } from "../bagbook.ts";
import { bag, item } from "../items.ts";
import { personById } from "../../content/people/index.ts";
import "./items.ts";
import "./moves.ts";
import { RECIPES, ingredientsFor, match, recipe, needName, type Recipe, type Vessel } from "./recipes.ts";
import { bigPot, cooked, cookSave, knows, learn, markSeen, seen } from "./state.ts";
import { recipeBook, potIcon, type CookChoice } from "./book.ts";
import { Hearth, HEARTH, millPlaces, ovenPlaces } from "./hearth.ts";
import { CookSession } from "./cook.ts";
import { connectPantry, openAsks, phrase } from "./pantry.ts";
import { cookSfx } from "./sound.ts";
import { COOKING_RUNES } from "./runes.ts";
import { cardExtra, cardToday, openCard, takeExtra, type Host } from "./card.ts";
import { runeSolved } from "../save.ts";
import "./cooking.css";

// Cooking (LIFE.md): Bram's hearth beside the Sleepy Serpent opens when the tavern is finished
// (pot and pan), Hazel's oven when the bakery is (bread, tarts, pies), and Wren's millstone turns
// wheat into flour once the mill stands. Recipes are learned from villagers (their first lesson,
// a building finished, a friendship grown) or by trying a mix of your own. Ingredients come from
// the villagers themselves (pantry.ts). Dishes are the best gifts.

const sayer = (who: string) => personById.get(who)?.name ?? who;
const L = (who: string, ...texts: string[]): LifeLine[] => texts.map((text) => ({ who: sayer(who), text }));

let ctx: LifeCtx;
let hearth: Hearth;
let busy = false;
let hudAdded = false;

function open() {
  return ctx.app.finished("tavern");
}

/** A dialogue or sheet is up, or something's cooking: don't start anything else. */
const calm = () => !busy && !ctx.world.paused && !ctx.world.hold && !ctx.app.ui.querySelector(".dialog, .modal-back");

// ---- the hearth ---------------------------------------------------------------------

function showHearth(pop: boolean) {
  hearth.show(true);
  if (!hudAdded) {
    hudAdded = true;
    ctx.app.hudButton({ icon: potIcon(), title: "Recipes", key: "r", onClick: () => openBook() });
  }
  if (!pop || !hearth.root) return;
  // it builds itself in front of you, like a building part
  const r = hearth.root;
  let t = 0;
  r.scale.setScalar(0.001);
  ctx.world.fx.dust(HEARTH.clone(), 16, 2);
  const stop = ctx.world.onFrame((dt) => {
    t += dt;
    const u = Math.min(1, t / 0.7);
    r.scale.setScalar(Math.max(0.001, 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2));
    if (u >= 1) stop();
  });
}

/** The kitchen runes whose building is finished, for the bottom of the book. */
function runeChips() {
  return COOKING_RUNES.filter((r) => ctx.app.finished(r.requires)).map((r) => ({
    title: r.part,
    topic: r.topic,
    reward: r.reward,
    solved: runeSolved(r.id),
    open: () => {
      ctx.app.closeSheet();
      ctx.app.openRune(r, () => {
        cookSfx.learn();
        window.setTimeout(() => ctx.app.toast(`**${r.part}**: ${r.reward}`), 800);
      });
    },
  }));
}

function openBook(focus?: string) {
  ctx.app.openSheet(recipeBook({ close: () => ctx.app.closeSheet(), focus, runes: runeChips() }));
}

/** Today's kitchen card at this station (card.ts), once the mill stands. */
function cardChip(where: "hearth" | "oven") {
  const host: Host = where === "oven" ? "baker" : "innkeeper";
  const extra = cardExtra();
  const q = cardToday();
  if (!q) return extra ? { title: "Kitchen card", sub: `Solved: +${extra} on your next dish`, done: true, open: () => {} } : undefined;
  return {
    title: where === "oven" ? "Hazel's kitchen card" : "Bram's kitchen card",
    sub: "Solve it for extra servings",
    done: false,
    open: () => {
      ctx.app.closeSheet();
      openCard(ctx.app, host, (n) => {
        cookSfx.learn();
        window.setTimeout(() => {
          ctx.app.toast(`**Kitchen card** solved: your next dish comes out with **${n} extra** ${n > 1 ? "servings" : "serving"}.`);
          openStation(where);
        }, 700);
      });
    },
  };
}

function openStation(where: "hearth" | "oven") {
  const vessels: Vessel[] = where === "oven" ? ["oven"] : ["pot", "pan"];
  const sheet = recipeBook({
    close: () => ctx.app.closeSheet(),
    runes: runeChips(),
    card: cardChip(where),
    station: {
      name: where === "oven" ? "Hazel's Oven" : "Bram's Hearth",
      eyebrow: where === "oven" ? "The bakery" : "By the Sleepy Serpent",
      vessels,
      cook: (c) => {
        ctx.app.closeSheet();
        void startCook(c, where);
      },
    },
  });
  ctx.app.openSheet(sheet);
}

async function bramIntro() {
  await ctx.app.say(
    L(
      "innkeeper",
      "Friend! Come here, come here. Every inn worth its salt has a fire outside for the big pots, and now the Serpent does too.",
      "Twenty years I cooked for a caravan. Now I'll teach you. Two to start: my garlic stew, and a carrot soup even a snake could make.",
      "Here, a basket from the cellar to get you going. Chat with me any day and there's more where that came from.",
      "Water, salt, oil and sugar are always in the crocks on the table. You bring the good stuff. Now let's see you cook!",
    ),
  );
  learn("bram_stew", "innkeeper");
  learn("carrot_soup", "innkeeper");
  bag.add("potato", 2);
  bag.add("carrot", 3);
  bag.add("garlic", 2);
  markSeen("bram");
  cookSfx.learn();
  learnedCard("bram_stew", "innkeeper", "My own stew, and a carrot soup. Write them down, friend.");
}

async function hazelIntro() {
  await ctx.app.say(
    L(
      "baker",
      "So you're the one my brother won't stop talking about. He talks about you. Not me. That's fine.",
      "This oven comes up to heat in forty minutes. It deserves better than standing about. I'll show you my everyday loaf.",
      "Two scoops of flour, knead till it springs back, bake till it sings. Take these to start: flour, an egg, a pat of butter.",
      "Wren mills wheat into flour, if you bring it to her. And don't slam my oven door.",
    ),
  );
  learn("bread_loaf", "baker");
  bag.add("flour", 2);
  bag.add("egg", 1);
  bag.add("butter", 1);
  markSeen("hazel");
  cookSfx.learn();
  learnedCard("bread_loaf", "baker", recipe("bread_loaf")!.teach!.note);
}

// ---- cooking ---------------------------------------------------------------------------

/** Something in the mix that points to a recipe you haven't found: its nudge. */
function nudgeFor(vessel: Vessel, items: string[]) {
  const other = (["pot", "pan", "oven"] as Vessel[]).filter((v) => v !== vessel).map((v) => match(v, items)).find((r) => r);
  if (other) return `That mix makes ${item(other.id)!.name.toLowerCase()}, but it wants the ${other.vessel === "oven" ? "oven at the bakery" : other.vessel}.`;
  const unknown = RECIPES.filter((r) => !knows(r.id) && (r.vessel === vessel || items.length === 0));
  const near = unknown.find((r) => r.vessel === vessel && r.needs.some((n) => items.some((id) => n === id || (n.startsWith("#") && item(id)?.tags.includes(n.slice(1))))));
  return (near ?? unknown.find((r) => r.vessel === vessel))?.hint ?? null;
}

async function startCook(c: CookChoice, where: "hearth" | "oven") {
  if (busy) return;
  let r: Recipe | null = c.recipe;
  let items = c.items;
  const host = where === "oven" ? "baker" : "innkeeper";
  if (!r) {
    if (items.includes("golden_koi")) {
      cookSfx.hmm();
      await ctx.app.say(where === "oven" ? L("baker", "Not the koi. Some things are for looking at. Put it back in the pond, or in your bag. Not in my oven.") : L("innkeeper", "Whoa there, friend! Not the koi. Some things are for looking at, not for supper."));
      return;
    }
    r = match(c.vessel, items);
    if (!r) {
      cookSfx.hmm();
      const what = items.map((id) => item(id)?.name.toLowerCase() ?? id);
      const mix = what.length > 1 ? `${what.slice(0, -1).join(", ")} and ${what[what.length - 1]}` : what[0];
      const hint = nudgeFor(c.vessel, items);
      const lines =
        where === "oven"
          ? L("baker", `${mix[0].toUpperCase()}${mix.slice(1)}, in the oven. That isn't a recipe. That's a guess. Keep them.`, ...(hint ? [`Here's a thought: ${hint}`] : []))
          : L("innkeeper", `Hm. ${mix[0].toUpperCase()}${mix.slice(1)} in the ${c.vessel}? I've seen braver pots, friend, but that one won't come together. Keep it, nothing's wasted.`, ...(hint ? [`Psst. ${hint}`] : []));
      await ctx.app.say(lines);
      return;
    }
  } else {
    items = ingredientsFor(r, c.times) ?? [];
    if (!items.length) return;
  }
  const isNew = !knows(r.id);
  for (const id of items) bag.take(id);
  busy = true;
  const extra = takeExtra();
  try {
    const session = new CookSession(ctx, hearth, {
      vessel: r.vessel,
      recipe: r,
      items,
      times: c.times,
      isNew,
      bonus: (r.vessel === "pot" && bigPot() ? c.times : 0) + extra,
    });
    let res;
    try {
      res = await session.run();
    } catch (e) {
      // something broke mid-cook: nothing is lost
      if (!session.made) for (const id of items) bag.add(id, 1);
      throw e;
    }
    bag.add(r.id, res.servings);
    cooked(r.id, res.servings);
    ctx.app.gained(r.id, res.servings);
    if (extra) window.setTimeout(() => ctx.app.toast(`The kitchen card's luck: **${extra} extra** in that batch.`), 2400);
    if (isNew) {
      learn(r.id, "tried");
      cookSfx.learn();
      learnedCard(r.id, "tried", where === "oven" ? "Hazel nods, very slightly. From her, that's applause." : "Bram whistles from the doorway. \"Now there's a new one!\"");
    }
    await afterCook(r, host);
  } catch (e) {
    console.error("[cook] cooking failed", e);
  } finally {
    busy = false;
  }
}

async function afterCook(r: Recipe, host: string) {
  const total = Object.values(cookSave().cooked).reduce((a, b) => a + b, 0);
  if (total >= 3 && !seen("rune_hint") && !runeSolved("cook-guest-pot")) {
    markSeen("rune_hint");
    window.setTimeout(() => ctx.app.toast("Bram has a sum for you, for when a crowd comes in: a **kitchen rune** at the bottom of the Recipe Book (**R**)."), 5200);
  }
  // Bram tries your first stew
  if (r.id === "bram_stew" && !seen("stew")) {
    markSeen("stew");
    await wait(1.4);
    ctx.world.playAnim("happy", "tavern");
    await ctx.app.say(
      L(
        "innkeeper",
        "Hold on, hold on! Is that... my stew? Give it here. Just a spoonful.",
        "...Hm. Mm. MMM. Friend, that's better than mine. Don't you dare tell anyone.",
        "Off you go, give a bowl to someone who needs warming up. That's what stew is for.",
      ),
    );
    const at = siteInfo("tavern")?.villager;
    if (at) hearth.fx.hearts(at.clone().setY(1.7), 4);
    ctx.app.befriend("innkeeper", 50);
    return;
  }
  if (host === "baker" && !seen("first_bake")) {
    markSeen("first_bake");
    await wait(1.2);
    await ctx.app.say(L("baker", "Hm. Listen. Hear it crackle as it cools? That's the bread telling you it's done right.", "...Not bad. Come back tomorrow. Bring flour."));
    ctx.app.befriend("baker", 30);
    return;
  }
  const askers = openAsks().filter(([, dish]) => dish === r.id).map(([who]) => sayer(who));
  if (askers.length) {
    await wait(2.6);
    ctx.app.toast(`**${askers.join("** and **")}** asked for ${item(r.id)!.name.toLowerCase()}. Take it to them!`);
  }
}

const wait = (s: number) => new Promise<void>((r) => window.setTimeout(r, s * 1000));

// ---- recipes taught by friends ----------------------------------------------------------

/** "A new recipe from Marlo": a little card, with what they said. Click it to open the book. */
function learnedCard(id: string, from: string, note: string) {
  const d = item(id)!;
  ctx.app.ui.querySelector(".cook-learn")?.remove();
  const who = from === "tried" ? "Worked out by you" : `From ${sayer(from)}`;
  const c = el<HTMLButtonElement>(`<button class="plate cook-learn" aria-label="Open the recipe book">
    <span class="cl-dish">${itemIcon(d)}</span>
    <span class="cl-text"><span class="eyebrow">New recipe · ${esc(who)}</span><span class="cl-name">${esc(d.name)}</span><span class="cl-note">${esc(note)}</span></span>
  </button>`);
  c.addEventListener("click", () => {
    c.remove();
    openBook(id);
  });
  // wait for any dialogue or sheet to close, then stay up a while
  const show = () => {
    if (ctx.app.ui.querySelector(".dialog, .modal-back") || busy) return void window.setTimeout(show, 300);
    ctx.app.ui.append(c);
    window.setTimeout(() => c.classList.add("out"), 9000);
    window.setTimeout(() => c.remove(), 9600);
  };
  window.setTimeout(show, 400);
}

function teachWatch() {
  if (!open() || !calm()) return;
  for (const r of RECIPES) {
    const t = r.teach;
    if (!t || t.intro || knows(r.id)) continue;
    if (t.finished && !ctx.app.finished(t.finished)) continue;
    if (t.hearts !== undefined && (!bond(t.who).met || hearts(t.who) < t.hearts)) continue;
    learn(r.id, t.who);
    cookSfx.learn();
    learnedCard(r.id, t.who, t.note);
    return;
  }
}

// ---- Wren's millstone ----------------------------------------------------------------

async function useMill() {
  if (busy) return;
  const w = ctx.world;
  const n = bag.count("wheat");
  if (!seen("mill")) {
    markSeen("mill");
    await ctx.app.say(
      L(
        "miller",
        "The millstone! Pour wheat in the hopper and the sails do the rest. One sheaf makes two scoops of flour.",
        "Bram wants it for bread, and Hazel will want it for everything. The wheat comes from me, when you stop by for a chat.",
      ),
    );
  }
  if (!n) {
    cookSfx.hmm();
    await ctx.app.say(L("miller", "No wheat? Chat with me now and then. I've always got a sheaf or two spare. Usually more."));
    return;
  }
  const places = millPlaces()!;
  busy = true;
  w.hold = true;
  w.face(places.door);
  w.playAnim("cook_pour");
  const sails = w.scene.getObjectByName("sails");
  let stop = () => {};
  try {
    cookSfx.mill.start(0.9);
    let t = 0;
    stop = w.onFrame((dt) => {
      t += dt;
      const k = Math.sin(Math.min(1, t / 2.6) * Math.PI);
      if (sails) sails.rotation.z -= dt * 7 * k;
      cookSfx.mill.level = 0.3 + 0.7 * k;
      if (Math.random() < dt * 9 * k) hearth.fx.puff(places.door.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.3, 0.3)), 1, "#f4eee0", 0.4);
    });
    await wait(2.6);
    if (bag.take("wheat", n)) {
      bag.add("flour", n * 2);
      ctx.world.fx.dust(places.door.clone().add(new THREE.Vector3(0, 0, 0.4)), 10, 0.8);
      ctx.app.gained("flour", n * 2);
    }
  } finally {
    stop();
    cookSfx.mill.stop();
    w.hold = false;
    busy = false;
  }
  if (!seen("first_flour")) {
    markSeen("first_flour");
    ctx.world.playAnim("happy", "mill");
    await wait(0.6);
    await ctx.app.say(L("miller", `${phrase("flour", n * 2)[0].toUpperCase()}${phrase("flour", n * 2).slice(1)}! Feel how fine that is. Grandmother would be proud. Of the millstone. And of you, a bit.`));
  }
}

// ---- install ------------------------------------------------------------------------

export const COOKING: LifeSystem = {
  id: "cooking",
  install(c) {
    ctx = c;
    hearth = new Hearth(c.world);
    connectPantry(c.app);
    let wasOpen = open();
    void hearth.load().then(() => {
      if (open()) showHearth(false);
    });
    store.on(() => {
      const now = open();
      if (now && !wasOpen && hearth.root) {
        showHearth(true);
        if (!seen("open")) {
          markSeen("open");
          window.setTimeout(() => ctx.app.toast("A cooking fire is lit beside the **Sleepy Serpent**. Bram has something to show you."), 4200);
        }
      }
      wasOpen = now;
    });
    if (wasOpen) markSeen("open");

    c.world.addSpot({
      id: "cook-hearth",
      pos: HEARTH.clone().add(new THREE.Vector3(0, 0, 0.1)),
      radius: 1.3,
      height: 1.9,
      get obj() {
        return hearth.root ?? undefined;
      },
      label: () => (!hearth.lit || busy ? null : seen("bram") ? "Cook at the hearth" : "Bram's hearth"),
      use: () => {
        if (busy) return;
        if (!seen("bram")) void bramIntro().then(() => openStation("hearth"));
        else openStation("hearth");
      },
    });

    const oven = ovenPlaces();
    if (oven)
      c.world.addSpot({
        id: "cook-oven",
        pos: oven.spot,
        radius: 0.7,
        height: 1.7,
        label: () => (!c.app.finished("bakery") || busy ? null : seen("hazel") ? "Bake in Hazel's oven" : "Hazel's oven"),
        use: () => {
          if (busy) return;
          if (!seen("hazel")) void hazelIntro().then(() => openStation("oven"));
          else openStation("oven");
        },
      });

    const mill = millPlaces();
    if (mill)
      c.world.addSpot({
        id: "cook-mill",
        pos: mill.door,
        radius: 0.6,
        height: 2.2,
        label: () => (!c.app.finished("mill") || busy ? null : bag.count("wheat") ? `Mill wheat into flour (${bag.count("wheat")})` : "Wren's millstone"),
        use: () => void useMill(),
      });

    window.setInterval(teachWatch, 1500);
    // dev: __pv.cook = { learnAll(), book() }
    (window as unknown as { __cook: unknown }).__cook = {
      learnAll: () => RECIPES.forEach((r) => learn(r.id, r.teach?.who ?? "tried")),
      book: () => openBook(),
      state: () => cookSave(),
      needs: (id: string) => recipe(id)?.needs.map(needName),
    };
  },
};
