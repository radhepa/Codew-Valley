import { CODEX, codexById } from "../content/codex.ts";
import type { PythonRunner } from "../python/runner.ts";
import { renderBlocks } from "./blocks.ts";
import { esc, md, el } from "./md.ts";
import { icon } from "./icons.ts";

/** The Codex book: every page, searchable, with runnable examples. */
export function codexBook(runner: PythonRunner, startPage: string | undefined, close: () => void): HTMLElement {
  const root = el(`<div class="sheet modal codex" role="dialog" aria-label="The Codex">
    <div class="modal-head">
      <span class="mark">${icon("book")}</span>
      <div class="titles"><div class="eyebrow">Ysolde's notes on the Old Tongue</div><h2>The Codex</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="codex-body">
      <nav class="codex-nav"><label class="search">${icon("search")}<input type="search" placeholder="Search the Codex" aria-label="Search the Codex"></label><div class="list"></div></nav>
      <main class="codex-main"></main>
    </div>
  </div>`);
  const list = root.querySelector<HTMLElement>(".list")!;
  const main = root.querySelector<HTMLElement>(".codex-main")!;
  const search = root.querySelector<HTMLInputElement>("input")!;
  root.querySelector(".close")!.addEventListener("click", close);
  let current = startPage && codexById.has(startPage) ? startPage : CODEX[0].id;

  const text = (id: string) => {
    const p = codexById.get(id)!;
    return (p.title + " " + p.summary + " " + p.blocks.map((b) => Object.values(b).join(" ")).join(" ")).toLowerCase();
  };
  function drawList() {
    const q = search.value.trim().toLowerCase();
    list.innerHTML = "";
    CODEX.forEach((p, i) => {
      if (q && !text(p.id).includes(q)) return;
      const b = el<HTMLButtonElement>(`<button class="${p.id === current ? "on" : ""}"><span class="no">${i + 1}</span><span>${esc(p.title)}</span><small>${esc(p.summary)}</small></button>`);
      b.addEventListener("click", () => show(p.id));
      list.append(b);
    });
    if (!list.children.length) list.append(el(`<p style="font-size:.9rem;color:var(--ink-3);padding:0 6px">No pages mention “${esc(q)}”.</p>`));
  }
  function show(id: string) {
    current = id;
    const p = codexById.get(id)!;
    main.innerHTML = "";
    const page = el(`<article class="page"><div class="eyebrow">Page ${CODEX.indexOf(p) + 1} of ${CODEX.length}</div><h2>${esc(p.title)}</h2><p class="summary">${md(p.summary)}</p></article>`);
    page.append(renderBlocks(p.blocks, runner));
    main.append(page);
    main.scrollTop = 0;
    drawList();
  }
  search.addEventListener("input", drawList);
  show(current);
  return root;
}
