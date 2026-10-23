import { CODEX, codexById } from "../content/codex.ts";
import type { PythonRunner } from "../python/runner.ts";
import { renderBlocks } from "./blocks.ts";
import { esc, el } from "./md.ts";

/** The Codex book: every page, searchable, with runnable examples. */
export function codexBook(runner: PythonRunner, startPage: string | undefined, close: () => void): HTMLElement {
  const root = el(`<div class="panel modal codex" role="dialog" aria-label="The Codex">
    <div class="modal-head"><span style="font-size:1.6rem">📖</span><h2>The Codex</h2><button class="close" aria-label="Close">✕</button></div>
    <div class="codex-body">
      <nav class="codex-nav"><input type="search" placeholder="Search the Codex…" aria-label="Search the Codex"><div class="list"></div></nav>
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
    for (const p of CODEX) {
      if (q && !text(p.id).includes(q)) continue;
      const b = el<HTMLButtonElement>(`<button class="${p.id === current ? "on" : ""}">${esc(p.title)}<small>${esc(p.summary)}</small></button>`);
      b.addEventListener("click", () => show(p.id));
      list.append(b);
    }
    if (!list.children.length) list.append(el(`<p style="font-size:.9rem;color:var(--ink-soft);padding:0 6px">No pages mention “${esc(q)}”.</p>`));
  }
  function show(id: string) {
    current = id;
    const p = codexById.get(id)!;
    main.innerHTML = "";
    main.append(el(`<h2>${esc(p.title)}</h2>`), renderBlocks(p.blocks, runner));
    main.scrollTop = 0;
    drawList();
  }
  search.addEventListener("input", drawList);
  show(current);
  return root;
}
