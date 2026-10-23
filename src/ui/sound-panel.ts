// The sound panel (off the HUD sound button) and the small UI sounds that
// follow panels, tabs and buttons without each call site wiring its own.
import { settings, setSetting, onSettings, sfx, type Bus } from "../game/audio.ts";
import { music, CREDITS } from "../game/music.ts";
import { esc, el } from "./md.ts";
import { icon } from "./icons.ts";

const SLIDERS: [Bus, string][] = [
  ["music", "Music"],
  ["sfx", "Effects"],
  ["amb", "Nature"],
];

/** Wire the HUD sound button: click opens the panel, M mutes. */
export function soundButton(btn: HTMLButtonElement, ui: HTMLElement) {
  const drawIcon = () => (btn.innerHTML = icon(settings.muted ? "mute" : "sound"));
  drawIcon();
  onSettings(drawIcon);
  btn.title = "Sound (M to mute)";
  btn.setAttribute("aria-label", "Sound settings");
  btn.setAttribute("aria-expanded", "false");

  let panel: HTMLElement | null = null;
  const close = () => {
    panel?.remove();
    panel = null;
    btn.setAttribute("aria-expanded", "false");
  };
  const outside = (e: PointerEvent) => {
    if (panel && !panel.contains(e.target as Node) && !btn.contains(e.target as Node)) close();
  };
  window.addEventListener("pointerdown", outside, true);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel) {
      e.stopImmediatePropagation();
      close();
    }
  }, true);

  btn.addEventListener("click", () => {
    if (panel) return close();
    panel = buildPanel();
    ui.append(panel);
    btn.setAttribute("aria-expanded", "true");
  });
}

function buildPanel(): HTMLElement {
  const p = el(`<div class="plate sound-panel" role="dialog" aria-label="Sound">
    <div class="eyebrow"><span>Sound</span></div>
    <div class="sliders"></div>
    <div class="now"></div>
    <div class="row">
      <button class="btn small line mute-all"></button>
      <button class="btn small line credits-btn" aria-expanded="false">Credits</button>
    </div>
    <div class="credits" hidden></div>
  </div>`);
  const sliders = p.querySelector<HTMLElement>(".sliders")!;
  for (const [k, label] of SLIDERS) {
    const row = el(`<label class="slider"><span>${label}</span><input type="range" min="0" max="100" step="1" value="${Math.round(settings[k] * 100)}" aria-label="${label} volume"><b>${Math.round(settings[k] * 100)}</b></label>`);
    const input = row.querySelector("input")!;
    const out = row.querySelector("b")!;
    input.addEventListener("input", () => {
      setSetting(k, Number(input.value) / 100);
      out.textContent = input.value;
    });
    // a sample of the bus at its new level
    input.addEventListener("change", () => (k === "sfx" ? sfx.pickup() : k === "amb" ? sfx.step("grass") : undefined));
    sliders.append(row);
  }
  const mute = p.querySelector<HTMLButtonElement>(".mute-all")!;
  const drawMute = () => {
    mute.innerHTML = `${icon(settings.muted ? "sound" : "mute")} ${settings.muted ? "Unmute" : "Mute all"}`;
    p.classList.toggle("muted", settings.muted);
  };
  drawMute();
  const off = onSettings(drawMute);
  mute.addEventListener("click", () => sfx.toggleMute());

  const now = p.querySelector<HTMLElement>(".now")!;
  const drawNow = () => {
    const t = music.playing;
    now.innerHTML = t ? `<span class="lbl">Now playing</span> ${esc(t)}` : `<span class="lbl">Between songs</span> the valley is quiet`;
  };
  drawNow();
  const timer = setInterval(() => (p.isConnected ? drawNow() : (clearInterval(timer), off())), 1000);

  const creditsBtn = p.querySelector<HTMLButtonElement>(".credits-btn")!;
  const credits = p.querySelector<HTMLElement>(".credits")!;
  // one entry per author and licence, listing their pieces
  const groups = new Map<string, { by: string; licence: string; titles: string[] }>();
  for (const c of CREDITS) {
    const g = groups.get(c.by + c.licence) ?? { by: c.by, licence: c.licence, titles: [] };
    g.titles.push(`“${c.title}”`);
    groups.set(c.by + c.licence, g);
  }
  credits.innerHTML = [...groups.values()].map((g) => `<p><b>${esc(g.by)}</b>: ${esc(g.titles.join(", "))}<br><span>${esc(g.licence)}</span></p>`).join("") +
    `<p class="small">Sound effects: Kenney (kenney.nl), CC0. Nature recordings from OpenGameArt.org (Thimras, Ylmir, Luke.RUSTLTD, Wolfgang_, WuxiaScrub), CC0. Full list in audio/CREDITS.md.</p>`;
  creditsBtn.addEventListener("click", () => {
    credits.hidden = !credits.hidden;
    creditsBtn.setAttribute("aria-expanded", String(!credits.hidden));
  });
  return p;
}

/** Sounds for panels opening and closing, tabs, and buttons, by watching the UI. */
export function installUiSounds(ui: HTMLElement) {
  const kind = (n: Node) => {
    if (!(n instanceof HTMLElement)) return null;
    if (n.classList.contains("modal-back")) return n.querySelector(".codex") ? "book" : "sheet";
    if (n.classList.contains("dialog")) return "dialog";
    if (n.classList.contains("toast")) return "toast";
    return null;
  };
  new MutationObserver((records) => {
    const added: string[] = [];
    const removed: string[] = [];
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        const k = kind(n);
        if (k) added.push(k);
      });
      r.removedNodes.forEach((n) => {
        const k = kind(n);
        if (k) removed.push(k);
      });
    }
    if (added.includes("book")) sfx.bookOpen();
    else if (added.includes("sheet")) sfx.open(); // also covers one sheet replacing another
    else if (removed.includes("book")) sfx.bookClose();
    else if (removed.includes("sheet")) sfx.close();
    if (added.includes("dialog") && !removed.includes("dialog")) sfx.dialog();
    if (added.includes("toast")) sfx.notice();
  }).observe(ui, { childList: true });

  ui.addEventListener(
    "click",
    (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("button, a.link");
      if (!b || (b as HTMLButtonElement).disabled) return;
      // these play their own sounds (or the panel watcher does)
      if (b.closest(".title-screen") || b.matches(".opt, .close, .codex-btn")) return;
      if (b.closest(".sound-panel") || b.matches(".mute-btn")) sfx.toggle();
      else if (b.matches(".steps button, .building-tabs button, .codex-nav .list button")) sfx.tab();
      else if (b.matches(".run, .try")) sfx.run();
      else sfx.click();
    },
    true,
  );
}
