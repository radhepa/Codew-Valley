import { BUILDINGS } from "../content/index.ts";
import { PEOPLE } from "../content/people/index.ts";
import type { Person } from "../content/types.ts";
import { bond, hearts, MAX_HEARTS, PER_HEART, talkedToday } from "../friends.ts";
import { icon } from "./icons.ts";
import { esc, el } from "./md.ts";
import { knownLoves } from "../life/gifts.ts";
import { item } from "../life/items.ts";
import { portrait } from "./portrait.ts";

/** A row of hearts, filled up to h. */
export function heartRow(h: number, cls = ""): string {
  let s = "";
  for (let i = 0; i < MAX_HEARTS; i++) s += icon("heart", i < h ? "full" : "");
  return `<span class="hearts ${cls}" title="${h} of ${MAX_HEARTS} hearts">${s}</span>`;
}

const SILHOUETTE = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="12"/><path d="M12 60c0-12 9-20 20-20s20 8 20 20z"/></svg>`;

/** The Friends journal: everyone you've met, your hearts, what you've learned about them. */
export function friendsBook(close: () => void): HTMLElement {
  const root = el(`<div class="sheet modal friends" role="dialog" aria-label="Friends">
    <div class="modal-head">
      <span class="mark">${icon("people")}</span>
      <div class="titles"><div class="eyebrow">Your friends in the valley</div><h2>Friends</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="friends-body">
      <nav class="friends-list"></nav>
      <main class="friend-page"></main>
    </div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", close);
  const list = root.querySelector<HTMLElement>(".friends-list")!;
  const page = root.querySelector<HTMLElement>(".friend-page")!;
  const met = (p: Person) => bond(p.id).met;
  let current = PEOPLE.find(met) ?? PEOPLE[0];

  const arrives = (p: Person) => BUILDINGS.find((b) => b.id === p.home)?.name ?? "a later chapter";

  function drawList() {
    list.innerHTML = "";
    for (const p of PEOPLE) {
      const known = met(p);
      const b = el<HTMLButtonElement>(`<button class="${p === current ? "on" : ""} ${known ? "" : "unknown"}">
        <span class="face">${known ? `<img alt="">` : SILHOUETTE}</span>
        <span class="nm">${known ? esc(p.name) : "???"}</span>
        ${known ? heartRow(hearts(p.id), "mini") : `<small>Arrives with ${esc(arrives(p))}</small>`}
        ${known && talkedToday(p.id) ? `<span class="today" title="Talked today">${icon("check")}</span>` : ""}
      </button>`);
      if (known) void portrait(p.id).then((u) => u && (b.querySelector("img")!.src = u));
      b.addEventListener("click", () => {
        current = p;
        drawList();
        drawPage();
      });
      list.append(b);
    }
  }

  function drawPage() {
    const p = current;
    page.innerHTML = "";
    if (!met(p)) {
      page.append(el(`<div class="stranger"><span class="face big">${SILHOUETTE}</span><h3 class="lesson-title">Someone new</h3><p>You haven't met them yet. They'll arrive with <b>${esc(arrives(p))}</b>.</p></div>`));
      return;
    }
    const h = hearts(p.id);
    const pts = bond(p.id).points;
    const toNext = h >= MAX_HEARTS ? "" : `${PER_HEART - (pts % PER_HEART)} to the next heart`;
    const loves = knownLoves(p.id).map((id) => item(id)?.name ?? id);
    const locked = (need: number) => `<p class="locked">${icon("lock")} Reach ${need} hearts to learn this.</p>`;
    const card = el(`<article>
      <header class="friend-head">
        <span class="face big"><img alt=""></span>
        <div>
          <div class="eyebrow">${esc(p.title)}</div>
          <h3 class="lesson-title">${esc(p.name)}</h3>
          ${heartRow(h)}
          <div class="pts">${h} of ${MAX_HEARTS} hearts${toNext ? ` · ${toNext}` : ""}${talkedToday(p.id) ? " · talked today" : " · say hello today"}</div>
        </div>
      </header>
      <div class="traits">${p.traits.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      <section><div class="label">Likes</div>${h >= 2 ? `<p>${p.likes.map(esc).join(" · ")}</p>` : locked(2)}</section>
      <section><div class="label">Dislikes</div>${h >= 4 ? `<p>${p.dislikes.map(esc).join(" · ")}</p>` : locked(4)}</section>
      <section><div class="label">What they wish for</div>${h >= 6 ? `<p>${esc(p.want)}</p>` : locked(6)}</section>
      ${loves.length ? `<section><div class="label">Gifts they loved</div><p>${loves.map(esc).join(" · ")}</p></section>` : ""}
      <p class="how">Talk to everyone once a day, answer their questions in a way that suits them, give them a gift now and then, and help build their home. Heart events will open at 2, 4, 6, 8 and 10 hearts in a later update.</p>
    </article>`);
    void portrait(p.id).then((u) => u && (card.querySelector("img")!.src = u));
    page.append(card);
  }

  drawList();
  drawPage();
  return root;
}
