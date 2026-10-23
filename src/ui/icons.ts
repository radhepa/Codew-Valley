// Line icons drawn for the game (24×24, stroked in currentColor), used
// instead of emoji so the UI reads as one hand-made set.
const P: Record<string, string> = {
  wood: `<ellipse cx="8" cy="12" rx="4.2" ry="6"/><ellipse cx="8" cy="12" rx="1.8" ry="2.8"/><path d="M8 6h9.5c2.3 0 4.2 2.7 4.2 6s-1.9 6-4.2 6H8"/><path d="M13 9.5h4M14.5 14.5h4"/>`,
  stone: `<path d="M3.5 17.5 6 9.5l5-4 6.5 1.5 3 6.5-2 4z"/><path d="M6 9.5l5 3 6.5-5.5M11 12.5l-1 5.5M11 12.5l7.5 5"/>`,
  book: `<path d="M12 6.5c-2-1.5-4.8-2-8-1.5v13c3.2-.5 6 0 8 1.5 2-1.5 4.8-2 8-1.5V5c-3.2-.5-6 0-8 1.5z"/><path d="M12 6.5v13"/>`,
  sound: `<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>`,
  mute: `<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  play: `<path d="M7.5 5.5v13l11-6.5z"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  reset: `<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v4h4"/>`,
  hint: `<path d="M9 17.5h6M10 20.5h4"/><path d="M12 3.5a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1v1h5v-1c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3.5z"/>`,
  rune: `<path d="M12 2.5 19 7v10l-7 4.5L5 17V7z"/><path d="M12 7v10M9 9.5l3 2.5 3-2.5"/>`,
  hammer: `<path d="M13.5 4.5 19.5 10.5M11 7l6 6M11 7l2.5-2.5M17 13l2.5-2.5"/><path d="m12.5 11.5-8 8a1.4 1.4 0 0 1-2-2l8-8"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  scroll: `<path d="M7 4.5h11a2 2 0 0 1 2 2V8h-3"/><path d="M17 6.5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V16h3"/><path d="M7 4.5a2 2 0 0 0-2 2V16M10 9h4M10 12.5h4"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>`,
  lock: `<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`,
  quiz: `<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.5M12 17h.01"/>`,
  task: `<path d="M9 5.5h10M9 12h10M9 18.5h10"/><path d="m3.5 5.5 1.3 1.3L7 4.5M3.5 12l1.3 1.3L7 11M3.5 18.5l1.3 1.3L7 17.5"/>`,
  heart: `<path d="M12 19.5s-7-4.3-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.6-7 9.6z"/>`,
  people: `<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.8a3 3 0 0 1 0 5.4M17.5 13.6A5.5 5.5 0 0 1 20.5 19"/>`,
  spark: `<path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5z"/><path d="M18.5 16.5v4M16.5 18.5h4"/>`,
};

export type IconName = keyof typeof P;

/** An inline SVG icon. */
export function icon(name: IconName, cls = ""): string {
  return `<svg class="ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
}
