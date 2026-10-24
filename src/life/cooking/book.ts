import { icon } from "../../ui/icons.ts";
import { el, esc, md } from "../../ui/md.ts";
import { itemIcon } from "../bagbook.ts";
import { bag, item } from "../items.ts";
import { personById } from "../../content/people/index.ts";
import { RECIPES, canCook, grouped, have, isFood, needName, recipe, type Recipe, type Vessel } from "./recipes.ts";
import { batching, cookSave, knows, unfresh } from "./state.ts";
import { openAsks } from "./pantry.ts";

// The recipe book (R) and the station sheet (the same book open at the hearth or the oven,
// with a Cook button and a page for trying your own mix). Field-journal paper, cards for
// recipes, unknown ones drawn as silhouettes with "???" and a nudge.

export const POT_ICON = `<path d="M4 10h16v3.5a8 6 0 0 1-16 0z"/><path d="M2.5 10h19M7 6.5c0-1 1-1 1-2M12 6.5c0-1 1-1 1-2M17 6.5c0-1 1-1 1-2"/><path d="M8 20.5h8"/>`;
const PAN_ICON = `<circle cx="9.5" cy="12" r="6.5"/><path d="M16 12h6.5"/><circle cx="9.5" cy="12" r="3.5"/>`;
const OVEN_ICON = `<path d="M3.5 19.5V11a8.5 7.5 0 0 1 17 0v8.5z"/><path d="M7.5 19.5v-5a4.5 4 0 0 1 9 0v5"/><path d="M10 17h4"/>`;
const ico = (inner: string, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
export const potIcon = () => ico(POT_ICON);

const VESSEL: Record<Vessel, { name: string; icon: string; where: string }> = {
  pot: { name: "Pot", icon: POT_ICON, where: "In the pot at Bram's hearth" },
  pan: { name: "Pan", icon: PAN_ICON, where: "In the pan at Bram's hearth" },
  oven: { name: "Oven", icon: OVEN_ICON, where: "In Hazel's oven at the bakery" },
};

const personName = (id: string) => personById.get(id)?.name ?? id;

/** What the station sheet hands back when you choose to cook. */
export interface CookChoice {
  recipe: Recipe | null;
  vessel: Vessel;
  /** Exactly what you chose (a try), or empty to let the recipe take what it needs. */
  items: string[];
  times: number;
}

interface BookOpts {
  close: () => void;
  /** Open at a station: which vessels are here, and what to do on Cook. */
  station?: { name: string; eyebrow: string; vessels: Vessel[]; cook: (c: CookChoice) => void };
  /** Recipe to show first. */
  focus?: string;
  /** Kitchen runes (village runes) that are open, shown along the bottom. */
  runes?: { title: string; topic: string; reward: string; solved: boolean; open: () => void }[];
}

export function recipeBook(o: BookOpts): HTMLElement {
  const st = o.station;
  const known = cookSave().known.length;
  const root = el(`<div class="sheet modal cook-book" role="dialog" aria-label="${st ? esc(st.name) : "Recipe book"}">
    <div class="modal-head">
      <span class="mark">${ico(st && st.vessels[0] === "oven" ? OVEN_ICON : POT_ICON)}</span>
      <div class="titles"><div class="eyebrow">${st ? esc(st.eyebrow) : `${known} of ${RECIPES.length} recipes learned`}</div><h2>${st ? esc(st.name) : "Recipe Book"}</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="cook-tabs" role="tablist"></div>
    <div class="cook-body"><div class="cook-cards"></div><aside class="cook-info"></aside></div>
  </div>`);
  if (o.runes?.length) {
    const strip = el(`<div class="cook-runes"><span class="lbl">${icon("rune")} Kitchen runes</span></div>`);
    for (const r of o.runes) {
      const b = el<HTMLButtonElement>(`<button class="rune-chip${r.solved ? " solved" : ""}" title="${esc(r.reward)}">${icon(r.solved ? "check" : "rune")}<span><b>${esc(r.title)}</b><small>${r.solved ? esc(r.reward) : esc(r.topic)}</small></span></button>`);
      b.addEventListener("click", r.open);
      strip.append(b);
    }
    root.append(strip);
  }
  root.querySelector(".close")!.addEventListener("click", o.close);
  const tabs = root.querySelector<HTMLElement>(".cook-tabs")!;
  const cards = root.querySelector<HTMLElement>(".cook-cards")!;
  const info = root.querySelector<HTMLElement>(".cook-info")!;
  const vessels: Vessel[] = st ? st.vessels : ["pot", "pan", "oven"];
  const asks = openAsks();
  let vessel: Vessel = vessels[0];
  const focus = o.focus ? recipe(o.focus) : null;
  if (focus && vessels.includes(focus.vessel)) vessel = focus.vessel;

  const drawTabs = () => {
    tabs.innerHTML = "";
    for (const v of vessels) {
      const n = RECIPES.filter((r) => r.vessel === v);
      const k = n.filter((r) => knows(r.id)).length;
      const b = el<HTMLButtonElement>(`<button class="cook-tab${v === vessel ? " on" : ""}" role="tab">${ico(VESSEL[v].icon)}<span>${VESSEL[v].name}</span><span class="cnt">${k}/${n.length}</span></button>`);
      b.addEventListener("click", () => {
        vessel = v;
        drawTabs();
        drawCards();
      });
      tabs.append(b);
    }
  };

  const select = (b: HTMLElement) => {
    cards.querySelectorAll(".on").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
  };

  const drawCards = (pick?: string) => {
    cards.innerHTML = "";
    const list = RECIPES.filter((r) => r.vessel === vessel);
    // ready to cook first, then the rest you know, then the unknown
    const ready = (r: Recipe) => (knows(r.id) && canCook(r) > 0 ? 1 : 0);
    list.sort((a, b) => Number(knows(b.id)) - Number(knows(a.id)) || ready(b) - ready(a));
    let first: { b: HTMLElement; show: () => void } | null = null;
    if (st) {
      const b = el<HTMLButtonElement>(`<button class="rc try">${ico(`<path d="M12 5v14M5 12h14"/>`, "big")}<span class="nm">Try something new</span><span class="sub">Your own mix</span></button>`);
      const show = () => (select(b), tryPage());
      b.addEventListener("click", show);
      cards.append(b);
    }
    for (const r of list) {
      const d = item(r.id)!;
      const k = knows(r.id);
      const ready = k ? canCook(r) : 0;
      const asked = asks.filter(([, dish]) => dish === r.id);
      const fresh = cookSave().fresh.includes(r.id);
      const b = el<HTMLButtonElement>(`<button class="rc${k ? "" : " unknown"}${ready ? " ready" : ""}">
        <span class="plate-dot">${itemIcon(d, k ? "" : "shadow")}</span>
        <span class="nm">${k ? esc(d.name) : "???"}</span>
        <span class="sub">${k ? (ready ? `Ready${st && ready > 1 ? ` ×${ready}` : ""}` : "Missing something") : "Not learned yet"}</span>
        ${fresh ? `<span class="new">New</span>` : ""}${asked.length ? `<span class="asked" title="Someone asked for this">${icon("heart", "full")}</span>` : ""}
      </button>`);
      const show = () => {
        select(b);
        detail(r);
        if (fresh) {
          unfresh(r.id);
          b.querySelector(".new")?.remove();
        }
      };
      b.addEventListener("click", show);
      cards.append(b);
      if (!first || pick === r.id) first = { b, show };
    }
    if (st && !first) tryPage();
    else first?.show();
  };

  const needsHtml = (r: Recipe, times = 1) =>
    `<ul class="needs">${grouped(r.needs)
      .map(([n, c]) => {
        const h = have(n);
        const d = n.startsWith("#") ? null : item(n);
        const want = c * times;
        return `<li class="${h >= want ? "ok" : "short"}">${d ? itemIcon(d) : ico(`<path d="M3 12c3-4 9-5 13-2l4-3v10l-4-3c-4 3-10 2-13-2z"/>`)}<span>${want > 1 ? `${want} × ` : ""}${esc(needName(n))}</span><b>${h}</b></li>`;
      })
      .join("")}<li class="pantry">${ico(`<path d="M7 4h10v3H7zM6 7h12l-1 13H7z"/>`)}<span>Water, salt, oil, sugar</span><b>pantry</b></li></ul>`;

  const detail = (r: Recipe) => {
    const d = item(r.id)!;
    const k = knows(r.id);
    const s = cookSave();
    const from = s.from[r.id];
    const asked = asks.filter(([, dish]) => dish === r.id).map(([who]) => personName(who));
    const teacher = r.teach ? personName(r.teach.who) : null;
    info.innerHTML = `<div class="big">${itemIcon(d, k ? "" : "shadow")}</div>
      <h3 class="lesson-title">${k ? esc(d.name) : "???"}</h3>
      <div class="eyebrow">${ico(VESSEL[r.vessel].icon, "tiny")} ${VESSEL[r.vessel].where}</div>
      ${k ? `<p>${esc(d.desc)}</p>${needsHtml(r)}` : `<p class="hint">${md(r.hint)}</p>`}
      <p class="small">${k ? (from === "tried" ? "You worked this one out yourself." : `Learned from ${esc(personName(from ?? r.teach?.who ?? ""))}.`) + (s.cooked[r.id] ? ` Cooked ${s.cooked[r.id]} time${s.cooked[r.id] > 1 ? "s" : ""}.` : "") : teacher ? `${esc(teacher)} knows this one. Or try your luck.` : "Nobody's going to tell you this one. Try things!"}</p>
      ${asked.length ? `<p class="small asked-line">${icon("heart", "full")} ${esc(asked.join(" and "))} asked for this.</p>` : ""}`;
    if (st && k) {
      const n = canCook(r);
      let times = 1;
      const row = el(`<div class="cook-go"></div>`);
      const go = el<HTMLButtonElement>(`<button class="btn gold">${ico(VESSEL[r.vessel].icon)} Cook</button>`);
      if (!n) go.disabled = true;
      go.addEventListener("click", () => st.cook({ recipe: r, vessel: r.vessel, items: [], times }));
      if (batching() && n > 1) {
        const step = el(`<div class="batch"><button class="btn small line" aria-label="Fewer">−</button><span>×1</span><button class="btn small line" aria-label="More">+</button></div>`);
        const [minus, plus] = step.querySelectorAll("button");
        const lab = step.querySelector("span")!;
        const set = (v: number) => {
          times = Math.max(1, Math.min(n, v));
          lab.textContent = `×${times}`;
          const ul = info.querySelector("ul.needs");
          if (ul) ul.outerHTML = needsHtml(r, times);
        };
        minus.addEventListener("click", () => set(times - 1));
        plus.addEventListener("click", () => set(times + 1));
        row.append(step);
      }
      row.append(go);
      if (!n) row.append(el(`<p class="small">You're missing something. Villagers share ingredients when you chat with them.</p>`));
      info.append(row);
    }
  };

  /** Try your own mix: pick up to three things from the bag. */
  const tryPage = () => {
    const chosen: string[] = [];
    let v: Vessel = vessels.includes(vessel) ? vessel : vessels[0];
    const foods = bag.contents().filter((c) => isFood(c.item) || c.item.id === "golden_koi");
    info.innerHTML = `<h3 class="lesson-title">Try something new</h3>
      <p>Pick up to three things from your bag. If they make a dish, you'll learn it. If not, nothing's lost.</p>
      ${vessels.length > 1 ? `<div class="seg">${vessels.map((x) => `<button class="seg-b${x === v ? " on" : ""}" data-v="${x}">${ico(VESSEL[x].icon)} ${VESSEL[x].name}</button>`).join("")}</div>` : ""}
      <div class="mix"></div><div class="pick"></div><div class="cook-go"></div>`;
    const mix = info.querySelector<HTMLElement>(".mix")!;
    const pick = info.querySelector<HTMLElement>(".pick")!;
    const goRow = info.querySelector<HTMLElement>(".cook-go")!;
    const go = el<HTMLButtonElement>(`<button class="btn gold">${icon("spark")} Cook it</button>`);
    go.addEventListener("click", () => st!.cook({ recipe: null, vessel: v, items: [...chosen], times: 1 }));
    goRow.append(go);
    info.querySelectorAll<HTMLButtonElement>(".seg-b").forEach((b) =>
      b.addEventListener("click", () => {
        v = b.dataset.v as Vessel;
        info.querySelectorAll(".seg-b").forEach((x) => x.classList.toggle("on", x === b));
      }),
    );
    const draw = () => {
      mix.innerHTML = "";
      for (let i = 0; i < 3; i++) {
        const id = chosen[i];
        const d = id ? item(id) : null;
        const s = el<HTMLButtonElement>(`<button class="mix-slot${d ? " full" : ""}" ${d ? `title="Take out the ${esc(d.name.toLowerCase())}"` : "disabled"}>${d ? itemIcon(d) : ""}</button>`);
        if (d) s.addEventListener("click", () => (chosen.splice(i, 1), draw()));
        mix.append(s);
      }
      pick.innerHTML = foods.length ? "" : `<p class="small">Nothing to cook with yet. Villagers share ingredients when you chat with them.</p>`;
      for (const { item: d, count } of foods) {
        const used = chosen.filter((x) => x === d.id).length;
        const b = el<HTMLButtonElement>(`<button class="bag-slot" title="${esc(d.name)}">${itemIcon(d)}<span class="n">${count - used}</span></button>`);
        if (count - used <= 0 || chosen.length >= 3) b.disabled = true;
        b.addEventListener("click", () => {
          if (d.id === "golden_koi") {
            st!.cook({ recipe: null, vessel: v, items: ["golden_koi"], times: 1 });
            return;
          }
          chosen.push(d.id);
          draw();
        });
        pick.append(b);
      }
      go.disabled = chosen.length === 0;
    };
    draw();
  };

  drawTabs();
  drawCards(o.focus);
  return root;
}
