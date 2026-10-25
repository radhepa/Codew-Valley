import type { Emote } from "../content/scenes/types.ts";

// Emote bubbles: a little paper bubble over someone's head with an ink drawing in it, in the
// field journal's hand (no emoji). The engine moves it with the actor every frame.

const INK = `fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;

const ART: Record<Emote, string> = {
  "!": `<path ${INK} d="M32 12c1 9 0 18-1 26"/><circle cx="31" cy="50" r="3.6" fill="currentColor"/>`,
  "?": `<path ${INK} d="M21 22c1-8 8-11 13-10 7 1 10 7 8 12-2 6-9 7-10 14"/><circle cx="32" cy="51" r="3.6" fill="currentColor"/>`,
  heart: `<path ${INK} d="M32 50C20 41 13 34 14 25c1-7 9-10 14-5l4 4 4-4c5-5 13-2 14 5 1 9-6 16-18 25z" fill="#e88a8a" fill-opacity=".55"/>`,
  "...": `<circle cx="17" cy="36" r="4.2" fill="currentColor"/><circle cx="32" cy="36" r="4.2" fill="currentColor"/><circle cx="47" cy="36" r="4.2" fill="currentColor"/>`,
  note: `<path ${INK} d="M24 46V18l22-5v28"/><path ${INK} d="M24 25l22-5"/><ellipse cx="19" cy="46" rx="6" ry="4.6" fill="currentColor" transform="rotate(-18 19 46)"/><ellipse cx="41" cy="41" rx="6" ry="4.6" fill="currentColor" transform="rotate(-18 41 41)"/>`,
  sweat: `<path ${INK} d="M34 14c-6 10-11 17-11 23a10 10 0 0 0 20 0c0-6-4-13-9-23z" fill="#9fc4dc" fill-opacity=".5"/>`,
};

export function emoteEl(kind: Emote): HTMLElement {
  const d = document.createElement("div");
  d.className = `scene-emote emote-${kind === "..." ? "dots" : kind === "!" ? "bang" : kind === "?" ? "ask" : kind}`;
  d.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true">${ART[kind] ?? ART["..."]}</svg>`;
  return d;
}
