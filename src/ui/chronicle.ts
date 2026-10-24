import type { Chronicle } from "../content/types.ts";
import { esc, md, el } from "./md.ts";
import { icon } from "./icons.ts";

/** A page of Ysolde's Chronicle, on old paper. */
export function chronicleSheet(page: Chronicle, numeral: string, close: () => void): HTMLElement {
  const root = el(`<div class="sheet modal chronicle" role="dialog" aria-label="Chronicle page ${esc(numeral)}">
    <div class="modal-head">
      <span class="mark">${icon("scroll")}</span>
      <div class="titles"><div class="eyebrow">The Chronicle of Willowmere · Page ${esc(numeral)}</div><h2>${esc(page.title)}</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="chronicle-body">
      ${page.text.map((p) => `<p>${md(p).replace(/\*([^*]+)\*/g, "<em>$1</em>")}</p>`).join("")}
      <div class="sign">Ysolde</div>
    </div>
    <div class="chronicle-foot"><button class="btn rune">Close the Chronicle ${icon("arrow")}</button></div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", close);
  root.querySelector(".chronicle-foot .btn")!.addEventListener("click", close);
  return root;
}
