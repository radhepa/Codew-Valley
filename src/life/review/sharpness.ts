import { icon } from "../../ui/icons.ts";
import { esc, el } from "../../ui/md.ts";
import { clock } from "../clock.ts";
import type { BuildingId } from "./build.ts";
import { ORDER, learned, reviewSave, staleness, syncLearned } from "./memory.ts";
import { TOPIC_NAME } from "./pool.ts";
import { WREN_LINES, pickLine } from "./lines.ts";

// The Sharpness page: Wren's field notes on what the founder knows. Every learned building's
// Python is a plant, drawn in ink with a watercolour wash: upright and green when fresh,
// drooping and straw-coloured when it hasn't been practised in a while. Unlearned ones are
// seed markers. Nothing here is a score; it says what's worth practising.

/** Line icons in the house style (24×24, stroked in currentColor). */
export const REVIEW_ICONS = {
  sprout: `<path d="M12 21v-8"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-3.5 2.5-6 6.5-6 0 3.5-2.5 6-6.5 6z"/><path d="M8 21h8"/>`,
  basket: `<path d="M4 10h16l-1.6 9.2a1.5 1.5 0 0 1-1.5 1.3H7.1a1.5 1.5 0 0 1-1.5-1.3z"/><path d="M8 10a4 4 0 0 1 8 0"/><path d="M5 14h14M9.5 10.5 10 20M14.5 10.5 14 20"/>`,
  slate: `<path d="M5 4h14v11H5z"/><path d="M8 8h5M8 11h7"/><path d="M8 15l-3 6M16 15l3 6M12 15v6"/>`,
};
export const reviewIcon = (name: keyof typeof REVIEW_ICONS, cls = "") =>
  `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${REVIEW_ICONS[name]}</svg>`;

/** Each topic's plant and what it covers. */
const PLANTS: Record<BuildingId, { plant: string; leaf: Leaf; head: Head; ideas: string }> = {
  tavern: { plant: "Thyme", leaf: "small", head: "none", ideas: "print, variables, f-strings, slicing" },
  mill: { plant: "Barley", leaf: "blade", head: "grain", ideas: "if, elif, else, and, or" },
  dock: { plant: "Watercress", leaf: "round", head: "tiny", ideas: "while, break, continue" },
  market: { plant: "Runner bean", leaf: "heart", head: "pods", ideas: "lists, sorting, slicing" },
  bakery: { plant: "Wheat", leaf: "blade", head: "wheat", ideas: "for, range, enumerate, zip" },
  forge: { plant: "Rosemary", leaf: "needle", head: "tiny", ideas: "def, return, defaults" },
  library: { plant: "Sage", leaf: "oval", head: "none", ideas: "dictionaries, .get, tallies" },
  apothecary: { plant: "Chamomile", leaf: "needle", head: "daisy", ideas: "split, join, sets, try" },
  townhall: { plant: "Flax", leaf: "blade", head: "cup", ideas: "files, with, csv" },
  clocktower: { plant: "Marigold", leaf: "oval", head: "marigold", ideas: "math, dates, comprehensions" },
  guildhall: { plant: "Oak sapling", leaf: "lobed", head: "none", ideas: "classes, methods, inheritance" },
  observatory: { plant: "Moonflower", leaf: "heart", head: "trumpet", ideas: "search, sort, recursion" },
};
type Leaf = "small" | "blade" | "round" | "heart" | "needle" | "oval" | "lobed";
type Head = "none" | "grain" | "tiny" | "pods" | "wheat" | "daisy" | "cup" | "marigold" | "trumpet";

const HEAD_COLOR: Record<Head, string> = { none: "", grain: "#c9a656", tiny: "#a9b8d8", pods: "#7d9a52", wheat: "#cfa54a", daisy: "#f4efe2", cup: "#7f9fd0", marigold: "#e09a3a", trumpet: "#f2eee4" };

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, "0")).join("");
};

function leafPath(kind: Leaf, len: number) {
  const w = { small: 0.32, blade: 0.12, round: 0.5, heart: 0.48, needle: 0.08, oval: 0.34, lobed: 0.42 }[kind] * len;
  if (kind === "round") return `M0 0 C ${w} ${-len * 0.1} ${w} ${-len} 0 ${-len} C ${-w} ${-len} ${-w} ${-len * 0.1} 0 0`;
  if (kind === "heart") return `M0 0 C ${w} ${-len * 0.2} ${w * 1.1} ${-len} 0 ${-len * 0.82} C ${-w * 1.1} ${-len} ${-w} ${-len * 0.2} 0 0`;
  if (kind === "lobed")
    return `M0 0 Q ${w} ${-len * 0.15} ${w * 0.55} ${-len * 0.35} Q ${w * 1.1} ${-len * 0.5} ${w * 0.5} ${-len * 0.66} Q ${w * 0.8} ${-len * 0.9} 0 ${-len} Q ${-w * 0.8} ${-len * 0.9} ${-w * 0.5} ${-len * 0.66} Q ${-w * 1.1} ${-len * 0.5} ${-w * 0.55} ${-len * 0.35} Q ${-w} ${-len * 0.15} 0 0`;
  return `M0 0 Q ${w} ${-len * 0.45} 0 ${-len} Q ${-w} ${-len * 0.45} 0 0`;
}

/**
 * One plant, drawn for a staleness: 0 fresh and upright, 1 due (a little tired), 2+ wilting.
 * seed varies the leaves so the twelve plants don't look stamped.
 */
export function plantSvg(id: BuildingId, stale: number, seed: number) {
  const p = PLANTS[id];
  const wilt = Math.max(0, Math.min(1, (stale - 0.5) / 1.8));
  const leafCol = mix(mix("#6f9a4e", "#a7a35a", Math.min(1, wilt * 1.4)), "#b08a55", Math.max(0, wilt - 0.55) * 2);
  const ink = "#4a3f33";
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const H = 64 - wilt * 10;
  const bend = 4 + wilt * 26; // the stem bows over as it wilts
  // stem as a quadratic curve from the pot (50, 96) to the tip
  const tip = { x: 50 + bend * 0.9, y: 96 - H + wilt * 14 };
  const ctl = { x: 50 - 2 + bend * 0.1, y: 96 - H * 0.7 };
  const at = (t: number) => ({ x: (1 - t) ** 2 * 50 + 2 * (1 - t) * t * ctl.x + t * t * tip.x, y: (1 - t) ** 2 * 96 + 2 * (1 - t) * t * ctl.y + t * t * tip.y });
  const parts: string[] = [];
  // a watercolour wash behind
  parts.push(`<ellipse cx="${52 + bend * 0.3}" cy="${66 + wilt * 6}" rx="${30 - wilt * 4}" ry="${26 - wilt * 6}" fill="${leafCol}" opacity="${0.16 - wilt * 0.06}"/>`);
  parts.push(`<path d="M50 96 Q ${ctl.x} ${ctl.y} ${tip.x} ${tip.y}" fill="none" stroke="${leafCol}" stroke-width="2.4"/>`);
  parts.push(`<path d="M50 96 Q ${ctl.x} ${ctl.y} ${tip.x} ${tip.y}" fill="none" stroke="${ink}" stroke-width=".8" opacity=".55"/>`);
  const n = p.leaf === "needle" ? 9 : p.leaf === "blade" ? 4 : p.leaf === "small" ? 8 : 5;
  for (let i = 0; i < n; i++) {
    const t = 0.18 + (i / n) * 0.72;
    const q = at(t);
    const side = i % 2 ? 1 : -1;
    const len = (p.leaf === "blade" ? 30 : p.leaf === "needle" ? 11 : p.leaf === "small" ? 9 : 17) * (1.1 - t * 0.45) * (0.85 + rnd() * 0.3);
    // fresh leaves reach up and out; wilted ones hang
    const ang = side * (38 + rnd() * 14) + wilt * side * 95 + wilt * 20;
    parts.push(`<path d="${leafPath(p.leaf, len)}" transform="translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${ang.toFixed(1)})" fill="${leafCol}" fill-opacity=".85" stroke="${ink}" stroke-width=".7" stroke-opacity=".6"/>`);
  }
  const top = at(1);
  const hc = mix(HEAD_COLOR[p.head] || "#000000", "#b9a27a", wilt * 0.7);
  const hang = wilt * 70;
  const head = (inner: string) => parts.push(`<g transform="translate(${top.x.toFixed(1)} ${top.y.toFixed(1)}) rotate(${hang.toFixed(1)})">${inner}</g>`);
  const pet = (k: number, r: number, w: number, c: string) =>
    Array.from({ length: k }, (_, i) => `<ellipse cx="0" cy="${-r}" rx="${w}" ry="${r * 0.75}" transform="rotate(${(360 / k) * i})" fill="${c}" stroke="${ink}" stroke-width=".5" stroke-opacity=".5"/>`).join("");
  if (p.head === "grain" || p.head === "wheat")
    head(Array.from({ length: 6 }, (_, i) => `<ellipse cx="${i % 2 ? 2.4 : -2.4}" cy="${-3 - i * 3.2}" rx="2.2" ry="3.4" transform="rotate(${i % 2 ? 22 : -22} ${i % 2 ? 2.4 : -2.4} ${-3 - i * 3.2})" fill="${hc}" stroke="${ink}" stroke-width=".5" stroke-opacity=".55"/>`).join("") + (p.head === "grain" ? `<path d="M0 -20 l-3 -9 M0 -20 l3 -9 M0 -20 v-10" stroke="${hc}" stroke-width=".8"/>` : ""));
  else if (p.head === "daisy") head(pet(12, 6, 1.8, hc) + `<circle r="2.6" fill="#e1b53c" stroke="${ink}" stroke-width=".5"/>`);
  else if (p.head === "marigold") head(pet(10, 6, 3, hc) + pet(8, 3.5, 2.2, mix(hc, "#c9662a", 0.4)) + `<circle r="1.8" fill="#8f5a24"/>`);
  else if (p.head === "cup") head(pet(5, 5.5, 3.2, hc) + `<circle r="1.4" fill="#f1e2a8"/>`);
  else if (p.head === "trumpet") head(`<path d="M0 0 L-7 -14 Q0 -19 7 -14 Z" fill="${hc}" stroke="${ink}" stroke-width=".6" stroke-opacity=".6"/><path d="M0 0 L0 -15" stroke="${ink}" stroke-width=".4" opacity=".4"/>`);
  else if (p.head === "pods") head(`<path d="M0 0 q6 8 2 18 q-4 -8 -2 -18" fill="${hc}" stroke="${ink}" stroke-width=".6"/><path d="M0 0 q-6 6 -4 15 q4 -6 4 -15" fill="${hc}" stroke="${ink}" stroke-width=".6"/>`);
  else if (p.head === "tiny") head([[-3, -3], [3, -4], [0, -7], [-4, -8], [4, -9]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${hc}" stroke="${ink}" stroke-width=".4"/>`).join(""));
  // the pot: a terracotta pot for every plant, the same pot for all (a field journal's tidy row)
  parts.push(`<path d="M36 96 h28 l-3 14 h-22 z" fill="#c98a5c" stroke="${ink}" stroke-width=".9" stroke-opacity=".7"/><path d="M34 93 h32 v4 h-32 z" fill="#d79a6b" stroke="${ink}" stroke-width=".9" stroke-opacity=".7"/>`);
  if (wilt > 0.6) parts.push(`<path d="M${tip.x + 8} ${tip.y + 28} q2 4 0 6" fill="none" stroke="#b08a55" stroke-width="1.2" opacity=".7"/>`); // a fallen leaf
  return `<svg class="plant" viewBox="0 0 100 112" aria-hidden="true">${parts.join("")}</svg>`;
}

/** A seed marker for Python not learned yet. */
function seedSvg() {
  return `<svg class="plant seed" viewBox="0 0 100 112" aria-hidden="true"><path d="M50 98 v-20" stroke="#8a7c6a" stroke-dasharray="2 3" stroke-width="1.2"/><path d="M42 78 h16 v-10 h-16 z" fill="none" stroke="#8a7c6a" stroke-width="1" stroke-dasharray="2 2"/><ellipse cx="50" cy="102" rx="16" ry="3.5" fill="#8a7c6a" opacity=".18"/></svg>`;
}

function mood(stale: number) {
  if (stale < 0.6) return { word: "Fresh", cls: "fresh" };
  if (stale < 1) return { word: "Doing fine", cls: "fine" };
  if (stale < 2) return { word: "Could use water", cls: "due" };
  return { word: "Wilting", cls: "wilt" };
}

function ago(days: number) {
  if (days <= 0) return "practised today";
  if (days === 1) return "practised yesterday";
  return `practised ${days} days ago`;
}

export interface SharpnessHooks {
  close(): void;
  /** Practise now, leaning on these topics (the page closes first). */
  practise(lean: BuildingId[]): void;
  /** Today's question: "waiting", "done", or null before the mill is finished. */
  today(): "waiting" | "done" | null;
}

/** The Sharpness sheet. */
export function sharpnessSheet(h: SharpnessHooks): HTMLElement {
  syncLearned();
  const s = reviewSave();
  const known = learned();
  const day = clock.day;
  const root = el(`<div class="sheet modal sharp" role="dialog" aria-label="Sharpness">
    <div class="modal-head">
      <span class="mark">${reviewIcon("sprout")}</span>
      <div class="titles"><div class="eyebrow">Wren's field notes</div><h2>Sharpness</h2></div>
      <button class="close" aria-label="Close">${icon("close")}</button>
    </div>
    <div class="sharp-body"></div>
  </div>`);
  root.querySelector(".close")!.addEventListener("click", h.close);
  const body = root.querySelector<HTMLElement>(".sharp-body")!;
  const today = h.today();
  body.append(
    el(`<p class="sharp-note">${esc(pickLine(WREN_LINES.journal, day))} ${
      today === "waiting" ? "<b>Today's question is waiting on the slate by the mill.</b>" : today === "done" ? "Today's basket is collected; extra practice is always open." : ""
    }</p>`),
  );

  const rows = ORDER.map((id) => ({ id, m: s.topics[id], stale: s.topics[id] ? staleness(s.topics[id]!, day) : 0 }));
  const due = rows.filter((r) => r.m && known.includes(r.id)).sort((a, b) => b.stale - a.stale || a.m!.box - b.m!.box).filter((r) => r.stale >= 0.8 || r.m!.box <= 1).slice(0, 3);

  const bed = el(`<div class="sharp-bed"></div>`);
  rows.forEach(({ id, m, stale }, i) => {
    const p = PLANTS[id];
    if (!m || !known.includes(id)) {
      bed.append(el(`<div class="sharp-plot unplanted" title="Learned at the ${esc(id)}">${seedSvg()}<div class="name">${esc(TOPIC_NAME[id])}</div><div class="state">Not planted yet</div></div>`));
      return;
    }
    const md = mood(stale);
    const leaves = Array.from({ length: 5 }, (_, k) => `<i class="${k < m.box ? "on" : ""}"></i>`).join("");
    const plot = el<HTMLButtonElement>(`<button class="sharp-plot ${md.cls}" title="Practise ${esc(TOPIC_NAME[id])}">
      ${plantSvg(id, stale, 7 + i * 31)}
      <div class="name">${esc(TOPIC_NAME[id])}</div>
      <div class="plant-name">${esc(p.plant)} · <span>${esc(p.ideas)}</span></div>
      <div class="state"><span class="dot"></span>${md.word}</div>
      <div class="roots" title="How deep it's rooted">${leaves}</div>
      <div class="when">${ago(day - m.last)}</div>
    </button>`);
    plot.style.setProperty("--i", String(i));
    plot.addEventListener("click", () => h.practise([id]));
    bed.append(plot);
  });
  body.append(bed);

  const foot = el(`<div class="sharp-foot"></div>`);
  if (known.length) {
    if (due.length) {
      foot.append(el(`<div class="label">Worth practising</div>`));
      const chips = el(`<div class="sharp-chips"></div>`);
      for (const r of due) chips.append(el(`<span class="sharp-chip">${esc(TOPIC_NAME[r.id])}</span>`));
      foot.append(chips);
    } else foot.append(el(`<p class="small">Everything's green. The best time to practise is still now, mind.</p>`));
    const go = el<HTMLButtonElement>(`<button class="btn">${reviewIcon("slate")} Practise ${due.length ? "what's wilting" : "something"}</button>`);
    go.addEventListener("click", () => h.practise(due.map((r) => r.id)));
    foot.append(go);
  } else foot.append(el(`<p class="small">Finish the mill and Wren will start planting what you've learned.</p>`));
  body.append(foot);
  return root;
}
