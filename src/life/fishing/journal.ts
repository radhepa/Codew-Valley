import { icon } from "../../ui/icons.ts";
import { esc, el } from "../../ui/md.ts";
import { item } from "../items.ts";
import { runeSolved } from "../save.ts";
import { clock } from "../clock.ts";
import { BAND_NAME, FISH, SPOT_NAME, biting, habits, type FishSpot, type TimeBand } from "./fish.ts";
import { FORECAST_RUNE } from "./runes.ts";
import { fishImg, fishSave } from "./session.ts";

// The fish journal (J): every catch as a painted plate, or a dark silhouette and ??? until it's
// been caught. Caught ones show where and when they bite and the biggest so far; uncaught ones
// carry Marlo's tip instead.

export const FISH_ICON = `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12c3-4.5 9.5-5.5 13.5-2L21 7v10l-4.5-3c-4 3.5-10.5 2.5-13.5-2z"/><circle cx="7.3" cy="11.2" r=".9" fill="currentColor"/><path d="M11 9.2c.8 1.8.8 3.8 0 5.6"/></svg>`;

const BAND_ICON: Record<TimeBand, string> = {
  dawn: `<path d="M4 17h16M7 17a5 5 0 0 1 10 0M12 7v2M6.3 10.3l1.4 1.4M17.7 10.3l-1.4 1.4"/>`,
  day: `<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>`,
  dusk: `<path d="M4 15h16M8 15a4 4 0 0 1 8 0M6 19h12"/><path d="M12 6v3"/>`,
  night: `<path d="M16.5 15.5A7 7 0 0 1 9 6.2a7 7 0 1 0 7.5 9.3z"/>`,
};
const RAIN_ICON = `<path d="M7 14a4 4 0 0 1 .5-8A5 5 0 0 1 17 7.5 3.5 3.5 0 0 1 17 14z"/><path d="M8.5 17l-1 2.5M12.5 17l-1 2.5M16.5 17l-1 2.5"/>`;
const svg = (inner: string) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export function journalSheet(close: () => void, spotNow: FishSpot | null, openDiary: () => void): HTMLElement {
  const caught = fishSave().caught;
  const found = FISH.filter((f) => caught[f.id]).length;
  const root = el(`<div class="sheet modal fish-journal" role="dialog" aria-label="Fish journal">
    <div class="modal-head">
      <span class="mark">${FISH_ICON}</span>
      <div class="titles"><div class="eyebrow">Fish journal · ${found} of ${FISH.length} found</div><h2>The Pond</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="fj-body"><div class="fj-grid"></div><aside class="fj-info"></aside></div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", close);
  const grid = root.querySelector<HTMLElement>(".fj-grid")!;
  const info = root.querySelector<HTMLElement>(".fj-info")!;
  // what's biting now, if Gran's water diary is solved (for the spot you're at, or both)
  const diary = runeSolved(FORECAST_RUNE.id);
  const now = new Set<string>();
  if (diary) for (const s of spotNow ? [spotNow] : (["pier", "shore"] as FishSpot[])) for (const b of biting(s, clock.timeOfDay, clock.raining)) now.add(b.id);

  const show = (id: string) => {
    const f = FISH.find((x) => x.id === id)!;
    const d = item(id)!;
    const c = caught[id];
    const h = habits(id);
    if (!c) {
      info.innerHTML = `<div class="fj-plate unknown"><img src="${fishImg(id)}" alt=""></div>
        <h3 class="lesson-title">???</h3>
        <div class="eyebrow">Not caught yet</div>
        <p class="fj-hint">${esc(f.hint.replace(/^Marlo: /, ""))}</p>
        <p class="small">Marlo's tip</p>`;
      return;
    }
    const when = h.bands.map((b) => `<span class="fj-chip" title="${BAND_NAME[b]}">${svg(BAND_ICON[b])}${BAND_NAME[b]}</span>`).join("");
    const rain = h.rain === "better" ? `<span class="fj-chip">${svg(RAIN_ICON)}More in rain</span>` : h.rain === "never" ? `<span class="fj-chip">${svg(BAND_ICON.day)}Clear days only</span>` : "";
    const size = id === "old_boot" ? "" : `<div><span class="label">Biggest</span><b>${c.best.toFixed(1)} cm</b></div>`;
    info.innerHTML = `<div class="fj-plate"><img src="${fishImg(id)}" alt=""></div>
      <h3 class="lesson-title">${esc(d.name)}${f.rarity >= 2 ? ` <span class="fj-rare">rare</span>` : ""}</h3>
      <p>${esc(d.desc)}</p>
      <div class="fj-facts">${size}<div><span class="label">Caught</span><b>${c.n}</b></div><div><span class="label">First on</span><b>day ${c.day}</b></div></div>
      <div class="label">Where</div><div class="fj-chips">${h.spots.map((s) => `<span class="fj-chip">${SPOT_NAME[s]}</span>`).join("")}</div>
      <div class="label">When</div><div class="fj-chips">${when}${rain}</div>
      ${now.has(id) ? `<p class="fj-now">${icon("spark")} Biting ${spotNow ? "here" : "in the pond"} right now</p>` : ""}`;
  };

  for (const f of FISH) {
    const c = caught[f.id];
    const d = item(f.id)!;
    const b = el<HTMLButtonElement>(`<button class="fj-card${c ? "" : " unknown"}">
      <span class="fj-pic"><img src="${fishImg(f.id)}" alt=""></span>
      <span class="fj-name">${c ? esc(d.name) : "???"}</span>
      <span class="fj-sub">${c ? (f.id === "old_boot" ? `${c.n} found` : `${c.best.toFixed(1)} cm`) : "&nbsp;"}</span>
      ${diary && now.has(f.id) ? `<span class="fj-dot" title="Biting now"></span>` : ""}
    </button>`);
    b.addEventListener("click", () => {
      grid.querySelectorAll(".fj-card.on").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      show(f.id);
    });
    grid.append(b);
  }
  const first = FISH.find((f) => caught[f.id]) ?? FISH[0];
  grid.children[FISH.indexOf(first)]?.classList.add("on");
  show(first.id);
  const foot = el(diary
    ? `<p class="fj-foot">${icon("spark")} Gran's water diary marks what's biting ${spotNow ? "here" : "in the pond"} right now.</p>`
    : `<p class="fj-foot">Marlo's gran kept a water diary of when the fish rise. <button class="btn line">${icon("rune")} Gran's water diary (village rune)</button></p>`);
  foot.querySelector("button")?.addEventListener("click", openDiary);
  root.append(foot);
  return root;
}
