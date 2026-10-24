import type { Person } from "../content/types.ts";
import { icon } from "../ui/icons.ts";
import { esc, el } from "../ui/md.ts";
import { tasteOf } from "./gifts.ts";
import { bag, giftable, type ItemDef, type ItemKind } from "./items.ts";

// The bag sheet (B) and the gift picker, in the field-journal style.

const KIND_ONE: Record<ItemKind, string> = { dish: "Dish", fish: "Fish", crop: "Crop", ingredient: "Ingredient", forage: "Found thing", seed: "Seeds", treasure: "Treasure", tool: "Tool" };
const KIND_LABEL: Record<ItemKind, string> = {
  dish: "Dishes",
  fish: "Fish",
  crop: "Crops",
  ingredient: "Ingredients",
  forage: "Found things",
  seed: "Seeds",
  treasure: "Treasures",
  tool: "Tools",
};

/** An item's line icon. */
export function itemIcon(d: ItemDef, cls = ""): string {
  return `<svg class="ico item-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${d.color ? ` style="color:${d.color}"` : ""}>${d.icon}</svg>`;
}

function grid(items: { item: ItemDef; count: number }[], onPick: (d: ItemDef) => void, mark?: (d: ItemDef) => string): HTMLElement {
  const wrap = el(`<div class="bag-groups"></div>`);
  let kind: ItemKind | null = null;
  let row: HTMLElement | null = null;
  for (const { item: d, count } of items) {
    if (d.kind !== kind) {
      kind = d.kind;
      wrap.append(el(`<div class="label">${KIND_LABEL[d.kind]}</div>`));
      row = el(`<div class="bag-grid"></div>`);
      wrap.append(row);
    }
    const b = el<HTMLButtonElement>(`<button class="bag-slot" title="${esc(d.name)}">${itemIcon(d)}<span class="n">${count}</span>${mark ? mark(d) : ""}</button>`);
    b.addEventListener("click", () => {
      wrap.querySelectorAll(".bag-slot.on").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      onPick(d);
    });
    row!.append(b);
  }
  return wrap;
}

/** The bag: everything carried, grouped by kind, with a description of the chosen item. */
export function bagSheet(close: () => void): HTMLElement {
  const root = el(`<div class="sheet modal bag" role="dialog" aria-label="Bag">
    <div class="modal-head">
      <span class="mark">${icon("bag")}</span>
      <div class="titles"><div class="eyebrow">What you carry</div><h2>Bag</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="bag-body"></div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", close);
  const body = root.querySelector<HTMLElement>(".bag-body")!;
  const items = bag.contents();
  if (!items.length) {
    body.append(el(`<p class="bag-empty">Your bag is empty. Crops, fish and cooking will fill it as the village grows.</p>`));
    return root;
  }
  const info = el(`<aside class="bag-info"></aside>`);
  const show = (d: ItemDef) => {
    info.innerHTML = `<div class="big">${itemIcon(d)}</div><h3 class="lesson-title">${esc(d.name)}</h3><div class="eyebrow">${KIND_ONE[d.kind]} · ${bag.count(d.id)} carried</div><p>${esc(d.desc)}</p>${giftable(d) ? `<p class="small">${icon("gift")} Can be given as a gift.</p>` : ""}`;
  };
  body.append(grid(items, show), info);
  show(items[0].item);
  (body.querySelector(".bag-slot") as HTMLElement | null)?.classList.add("on");
  return root;
}

/** Choose a gift for someone. Loved/liked marks show only for tastes already discovered. */
export function giftPicker(p: Person, known: Set<string>, onGive: (itemId: string) => void, close: () => void): HTMLElement {
  const root = el(`<div class="sheet modal bag gift-picker" role="dialog" aria-label="Choose a gift">
    <div class="modal-head">
      <span class="mark">${icon("gift")}</span>
      <div class="titles"><div class="eyebrow">One gift a day</div><h2>A gift for ${esc(p.name)}</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="bag-body"></div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", close);
  const body = root.querySelector<HTMLElement>(".bag-body")!;
  const items = bag.contents().filter((c) => giftable(c.item));
  const info = el(`<aside class="bag-info"></aside>`);
  const mark = (d: ItemDef) => (known.has(d.id) && tasteOf(p.id, d.id) === "loved" ? `<span class="loved" title="${esc(p.name)} loves this">${icon("heart", "full")}</span>` : "");
  const show = (d: ItemDef) => {
    info.innerHTML = `<div class="big">${itemIcon(d)}</div><h3 class="lesson-title">${esc(d.name)}</h3><p>${esc(d.desc)}</p>`;
    const give = el<HTMLButtonElement>(`<button class="btn gold">${icon("gift")} Give the ${esc(d.name.toLowerCase())}</button>`);
    give.addEventListener("click", () => onGive(d.id));
    info.append(give);
  };
  body.append(grid(items, show, mark), info);
  if (items.length) {
    show(items[0].item);
    (body.querySelector(".bag-slot") as HTMLElement | null)?.classList.add("on");
  }
  return root;
}
