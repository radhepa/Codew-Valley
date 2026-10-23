import { BUILDINGS } from "../content/index.ts";
import type { Building, Challenge } from "../content/types.ts";
import type { PythonRunner } from "../python/runner.ts";
import { store, GAME_TITLE } from "../state.ts";
import { sfx } from "../game/audio.ts";
import type { Resource, World } from "../game/world.ts";
import { codexBook } from "./codexbook.ts";
import { esc, md, el } from "./md.ts";
import { portrait } from "./portrait.ts";
import { modelOf, nameTag, toLine, toLines, type Line } from "./speakers.ts";
import { workbench } from "./workbench.ts";

const ICON: Record<Resource, string> = { wood: "🪵", stone: "🪨" };

/** Everything drawn over the 3D world: HUD, dialogue, menus. */
export class App {
  private ui = document.getElementById("ui")!;
  private world!: World;
  private modal: HTMLElement | null = null;
  private dialogEl: HTMLElement | null = null;
  private promptEl = el(`<div class="panel prompt" hidden></div>`);
  private resEls: Record<Resource, HTMLElement> = {} as never;
  private questEl = el(`<div class="panel quest" aria-live="polite"></div>`);
  private toastTimer = 0;

  constructor(private runner: PythonRunner) {}

  /** The building being worked on: the first unfinished one (the last when all are done). */
  get building(): Building {
    const ready = BUILDINGS.filter((b) => b.challenges.length);
    return ready.find((b) => !this.finished(b)) ?? ready[ready.length - 1];
  }

  finished(b: Building) {
    return b.challenges.length > 0 && b.challenges.every((c) => store.isDone(c.id));
  }

  unlocked(b: Building) {
    const i = BUILDINGS.indexOf(b);
    return i === 0 || this.finished(BUILDINGS[i - 1]);
  }

  buildingOf(c: Challenge) {
    return BUILDINGS.find((b) => b.challenges.includes(c))!;
  }

  /** The next unsolved challenge, or null when every building is finished. */
  nextChallenge(): Challenge | null {
    return this.building.challenges.find((c) => !store.isDone(c.id)) ?? null;
  }

  stageCount(b = this.building) {
    return b.challenges.filter((c) => store.isDone(c.id)).length;
  }

  /** Parts built per building id, for the world. */
  progress(): Record<string, number> {
    return Object.fromEntries(BUILDINGS.map((b) => [b.id, this.stageCount(b)]));
  }

  /** Villagers who have arrived: at the start of their chapter, or once their building is done. */
  private syncVillagers() {
    for (const b of BUILDINGS) if (b.villager && (b.villager.arrives === "start" ? this.unlocked(b) : this.finished(b))) void this.world.showVillager(b.id);
  }

  attach(world: World) {
    this.world = world;
    const res = el(`<div class="hud-res"></div>`);
    for (const k of ["wood", "stone"] as Resource[]) {
      const r = el(`<div class="panel res" title="${k}"><span class="ico">${ICON[k]}</span><span class="v">0</span></div>`);
      this.resEls[k] = r;
      res.append(r);
    }
    const buttons = el(`<div class="hud-buttons">
      <button class="icon-btn codex-btn" title="The Codex (C)" aria-label="Open the Codex">📖</button>
      <button class="icon-btn mute-btn" title="Sound on/off (M)" aria-label="Toggle sound">🔊</button>
    </div>`);
    buttons.querySelector(".codex-btn")!.addEventListener("click", () => this.openCodex());
    const mute = buttons.querySelector<HTMLButtonElement>(".mute-btn")!;
    mute.addEventListener("click", () => (mute.textContent = sfx.toggleMute() ? "🔈" : "🔊"));
    this.ui.append(this.questEl, res, buttons, this.promptEl);
    store.on(() => this.drawHud());
    this.drawHud();
    this.syncVillagers();
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement).closest?.("input, textarea, .cm-editor")) return;
      if (e.key === "Escape") {
        if (this.modal) this.closeModal();
        else if (this.dialogEl) this.closeDialog();
      } else if (e.key.toLowerCase() === "c" && !this.modal && !this.dialogEl && !this.world.paused) this.openCodex();
      else if (e.key.toLowerCase() === "m") mute.click();
    });
  }

  // ---- HUD ------------------------------------------------------------------

  private drawHud() {
    const d = store.data;
    for (const k of ["wood", "stone"] as Resource[]) this.resEls[k].querySelector(".v")!.textContent = String(d[k]);
    const next = this.nextChallenge();
    const done = this.stageCount();
    const total = this.building.challenges.length;
    const bar = this.building.challenges.map((c, i) => `<i class="${store.isDone(c.id) ? "on" : i === done ? "next" : ""}"></i>`).join("");
    let goal: string;
    let sub: string;
    if (!next) {
      goal = `${this.building.name} is open! 🎉`;
      sub = `${this.building.villager ? `Talk to ${this.building.villager.name}. ` : ""}More of the valley is coming soon.`;
    } else if (!store.canAfford(next.cost)) {
      const need: string[] = [];
      if (d.wood < next.cost.wood) need.push(`${next.cost.wood - d.wood} more wood ${ICON.wood}`);
      if (d.stone < next.cost.stone) need.push(`${next.cost.stone - d.stone} more stone ${ICON.stone}`);
      goal = `Gather ${need.join(" and ")}`;
      sub = `For the ${next.part.toLowerCase()}. Trees grow in the west grove, rocks in the east quarry. Press <kbd>E</kbd> next to one.`;
    } else {
      goal = `Use the rune stone: “${esc(next.title)}”`;
      sub = `You have the materials for the ${esc(next.part.toLowerCase())}. The glowing stone is beside Pip.`;
    }
    this.questEl.innerHTML = `<h3>${esc(this.building.name)} · ${done}/${total}</h3><div class="goal">${goal}</div><div class="sub">${sub}</div><div class="progress">${bar}</div>`;
  }

  prompt(label: string | null, x: number, y: number) {
    if (!label || this.modal || this.dialogEl) {
      this.promptEl.hidden = true;
      return;
    }
    this.promptEl.hidden = false;
    this.promptEl.innerHTML = `<kbd>E</kbd>${esc(label)}`;
    this.promptEl.style.left = `${x}px`;
    this.promptEl.style.top = `${y}px`;
  }

  gain(kind: Resource, x: number, y: number) {
    store.add(kind, 1);
    const f = el(`<div class="float">+1 ${ICON[kind]}</div>`);
    f.style.left = `${x}px`;
    f.style.top = `${y}px`;
    this.ui.append(f);
    setTimeout(() => f.remove(), 1000);
    const r = this.resEls[kind];
    r.classList.remove("bump");
    void r.offsetWidth;
    r.classList.add("bump");
    setTimeout(() => sfx.pickup(), 120);
    const next = this.nextChallenge();
    if (next && store.canAfford(next.cost) && store.data[kind] === next.cost[kind] && next.cost[kind] > 0) this.toast(`Enough materials for the ${next.part.toLowerCase()}! Head to the rune stone.`);
  }

  toast(text: string) {
    this.ui.querySelector(".toast")?.remove();
    const t = el(`<div class="panel toast">${md(text)}</div>`);
    this.ui.append(t);
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.remove(), 3200);
  }

  // ---- dialogue ---------------------------------------------------------------

  /** Show lines one by one. Resolves when the last line is dismissed. */
  say(lines: Line[], finalButtons?: { label: string; cls?: string; action: () => void }[]): Promise<void> {
    this.closeDialog();
    this.world.paused = true;
    return new Promise((resolve) => {
      let i = 0;
      const box = el(`<div class="panel dialog" role="dialog" aria-live="polite">
        <img class="portrait" alt="">
        <div style="flex:1;min-width:0"><div class="who"></div><div class="text"></div><div class="next"></div></div>
      </div>`);
      this.dialogEl = box;
      this.ui.append(box);
      const img = box.querySelector<HTMLImageElement>("img")!;
      const who = box.querySelector<HTMLElement>(".who")!;
      const text = box.querySelector<HTMLElement>(".text")!;
      const next = box.querySelector<HTMLElement>(".next")!;
      let typing = 0;
      let full = "";
      const finishTyping = () => {
        clearInterval(typing);
        typing = 0;
        text.innerHTML = md(full);
      };
      const step = () => {
        const line = lines[i];
        void portrait(modelOf(line.who)).then((u) => (img.src = u));
        who.textContent = nameTag(line.who);
        full = line.text;
        // type the plain text, then swap in the formatted version
        const plain = full.replace(/\*\*|`/g, "");
        let n = 0;
        text.textContent = "";
        clearInterval(typing);
        typing = window.setInterval(() => {
          n += 2;
          text.textContent = plain.slice(0, n);
          if (n % 6 === 0) sfx.blip();
          if (n >= plain.length) finishTyping();
        }, 22);
        next.innerHTML = "";
        const last = i === lines.length - 1;
        if (last && finalButtons) {
          for (const fb of finalButtons) {
            const b = el<HTMLButtonElement>(`<button class="btn ${fb.cls ?? ""}">${esc(fb.label)}</button>`);
            b.addEventListener("click", () => {
              this.closeDialog();
              resolve();
              fb.action();
            });
            next.append(b);
          }
        } else {
          const b = el<HTMLButtonElement>(`<button class="btn">${last ? "Okay!" : "Next ▸"}</button>`);
          b.addEventListener("click", advance);
          next.append(b);
        }
      };
      const advance = () => {
        if (typing) return finishTyping();
        i++;
        if (i >= lines.length) {
          this.closeDialog();
          resolve();
        } else step();
      };
      box.addEventListener("click", (e) => {
        if (!(e.target as HTMLElement).closest("button")) advance();
      });
      const key = (e: KeyboardEvent) => {
        if (this.dialogEl !== box) return window.removeEventListener("keydown", key);
        if ((e.key === "Enter" || e.key === " " || e.key.toLowerCase() === "e") && !(i === lines.length - 1 && finalButtons && !typing)) {
          e.preventDefault();
          advance();
        }
      };
      setTimeout(() => window.addEventListener("keydown", key), 50);
      step();
    });
  }

  private closeDialog() {
    if (!this.dialogEl) return;
    this.dialogEl.remove();
    this.dialogEl = null;
    if (!this.modal) this.world.paused = false;
  }

  // ---- modals -----------------------------------------------------------------

  private openModal(content: HTMLElement) {
    this.closeModal();
    this.closeDialog();
    this.world.paused = true;
    const back = el(`<div class="modal-back"></div>`);
    back.append(content);
    back.addEventListener("pointerdown", (e) => {
      if (e.target === back) this.closeModal();
    });
    this.ui.append(back);
    this.modal = back;
    this.promptEl.hidden = true;
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.querySelectorAll(".bench").forEach((b) => b.dispatchEvent(new Event("bench:destroy")));
    this.modal.remove();
    this.modal = null;
    if (!this.dialogEl) this.world.paused = false;
  }

  openCodex(page?: string) {
    // The Codex opens on top of the workbench without closing it.
    const book = codexBook(this.runner, page, () => {
      layer.remove();
      if (!this.modal) this.world.paused = false;
    });
    const layer = el(`<div class="modal-back" style="z-index:40"></div>`);
    layer.append(book);
    layer.addEventListener("pointerdown", (e) => e.target === layer && layer.remove());
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && layer.isConnected) {
        e.stopImmediatePropagation();
        layer.remove();
        if (!this.modal) this.world.paused = false;
      }
      if (!layer.isConnected) window.removeEventListener("keydown", esc, true);
    };
    window.addEventListener("keydown", esc, true);
    this.world.paused = true;
    this.ui.append(layer);
  }

  // ---- rune stone ---------------------------------------------------------------

  openRune(view?: Building) {
    const b = view ?? this.building;
    const current = b === this.building && !this.finished(b);
    const next = current ? this.nextChallenge() : null;
    const done = this.stageCount(b);
    const root = el(`<div class="panel modal" style="--w:720px" role="dialog" aria-label="Rune stone">
      <div class="modal-head"><span style="font-size:1.5rem">✨</span><h2>The Rune Stone · ${esc(b.name)}</h2><button class="close" aria-label="Close">✕</button></div>
      <div class="build-body">
        <div class="building-tabs"></div>
        <p style="margin:0;color:var(--ink-soft)">${esc(b.blurb)} Each part is built by speaking Python to the stone.</p>
        <div class="stages"></div>
        <div class="next-slot"></div>
      </div>
    </div>`);
    root.querySelector(".close")!.addEventListener("click", () => this.closeModal());
    const open = BUILDINGS.filter((x) => this.unlocked(x) && x.challenges.length);
    const tabs = root.querySelector<HTMLElement>(".building-tabs")!;
    if (open.length > 1) {
      for (const x of open) {
        const t = el<HTMLButtonElement>(`<button class="btn small ${x === b ? "amber" : "ghost"}">${this.finished(x) ? "✓ " : ""}${esc(x.name)}</button>`);
        t.addEventListener("click", () => x !== b && this.openRune(x));
        tabs.append(t);
      }
    } else tabs.remove();
    const stages = root.querySelector<HTMLElement>(".stages")!;
    b.challenges.forEach((c, i) => {
      const cls = store.isDone(c.id) ? "done" : i === done ? "next" : "";
      const tag = store.isDone(c.id) ? "button" : "div";
      const s = el(`<${tag} class="stage ${cls}" ${tag === "button" ? `title="Revisit “${esc(c.title)}”"` : ""}><span class="n">${store.isDone(c.id) ? "✓" : i + 1}</span><span>${esc(c.part)}</span></${tag}>`);
      if (tag === "button") s.addEventListener("click", () => this.openBench(c));
      stages.append(s);
    });
    const slot = root.querySelector<HTMLElement>(".next-slot")!;
    if (!next) {
      slot.append(el(`<div class="next-card"><h3>🎉 ${esc(b.name)} is finished!</h3><p style="margin:0">Every part is built. You can reopen any finished part above to practise again.</p></div>`));
    } else {
      const d = store.data;
      const can = store.canAfford(next.cost);
      const cost = (["wood", "stone"] as Resource[])
        .filter((k) => next.cost[k] > 0)
        .map((k) => `<span class="${d[k] < next.cost[k] ? "short" : ""}">${ICON[k]} ${d[k]} / ${next.cost[k]} ${k}</span>`)
        .join("");
      const card = el(`<div class="next-card">
        <h3>Next: ${esc(next.part)} · “${esc(next.title)}”</h3>
        <div class="cost">${cost || "<span>No materials needed</span>"}</div>
      </div>`);
      const btn = el<HTMLButtonElement>(`<button class="btn amber" ${can ? "" : "disabled"}>${can ? "Start the challenge" : "Gather more materials first"}</button>`);
      btn.addEventListener("click", () => this.openBench(next));
      card.append(btn);
      slot.append(card);
    }
    this.openModal(root);
  }

  openBench(c: Challenge) {
    const list = this.buildingOf(c).challenges;
    const stage = list.indexOf(c) + 1;
    this.openModal(
      workbench({
        challenge: c,
        stage,
        total: list.length,
        runner: this.runner,
        close: () => this.closeModal(),
        openCodex: (p) => this.openCodex(p),
        build: () => void this.build(c, stage),
      }),
    );
  }

  private async build(c: Challenge, stage: number) {
    const b = this.buildingOf(c);
    this.closeModal();
    store.complete(c.id, c.cost);
    this.world.paused = true;
    this.world.buildStage(b.id, stage);
    await new Promise((r) => setTimeout(r, 3300));
    const lines: Line[] = [toLine(c.done)];
    if (this.finished(b)) {
      this.syncVillagers();
      lines.push(...toLines(b.finale));
      const after = BUILDINGS[BUILDINGS.indexOf(b) + 1];
      if (!after || !after.challenges.length) lines.push({ who: "Pip", text: "That's the end of this chapter. More of the valley is coming soon. Practise any part again at the rune stone." });
      await this.say(lines);
      if (after?.challenges.length) await this.openChapter(after);
      return;
    }
    const next = this.nextChallenge()!;
    if (!store.canAfford(next.cost)) {
      lines.push({ who: "Pip", text: `Next up: the **${next.part.toLowerCase()}**. We'll need ${next.cost.wood ? `${next.cost.wood} wood` : ""}${next.cost.wood && next.cost.stone ? " and " : ""}${next.cost.stone ? `${next.cost.stone} stone` : ""}.` });
    } else lines.push({ who: "Pip", text: `We already have the materials for the **${next.part.toLowerCase()}**. Back to the rune stone whenever you're ready!` });
    await this.say(lines);
  }

  /** A new building's chapter begins: its villager arrives and tells their story once. */
  private async openChapter(b: Building) {
    this.syncVillagers();
    if (store.data.opened.includes(b.id)) return;
    store.data.opened.push(b.id);
    store.changed();
    if (b.opening.length) await this.say(toLines(b.opening));
  }

  /** After the title screen: carry on the story where the save left it. */
  resume() {
    const b = this.building;
    if (this.unlocked(b) && BUILDINGS.indexOf(b) > 0 && !store.data.opened.includes(b.id) && b.challenges.length) void this.openChapter(b);
    else this.world.paused = false;
  }

  // ---- characters -------------------------------------------------------------

  talkPip() {
    const next = this.nextChallenge();
    const d = store.data;
    if (!next) {
      void this.say([
        { who: "Pip", text: `We did it! ${this.building.name} is finished, and your Python grows stronger every day.` },
        { who: "Pip", text: "There's so much more of the valley to build. For now, rest your fingers. And maybe reread the Codex with a mug of cider." },
      ]);
      return;
    }
    const lines: Line[] = [];
    if (!store.canAfford(next.cost)) {
      const need: string[] = [];
      if (d.wood < next.cost.wood) need.push(`**${next.cost.wood - d.wood} more wood**`);
      if (d.stone < next.cost.stone) need.push(`**${next.cost.stone - d.stone} more stone**`);
      lines.push({ who: "Pip", text: `For the ${next.part.toLowerCase()} we need ${need.join(" and ")}.` });
      lines.push({ who: "Pip", text: "Trees grow west of the tavern and rocks sit to the east. Walk up close and press **E** (or click them). They grow back, so don't worry!" });
    } else {
      lines.push({ who: "Pip", text: `We have everything for the ${next.part.toLowerCase()}. Speak to the rune stone right behind me!` });
    }
    lines.push({ who: "Pip", text: pipTips[(d.done.length + d.wood) % pipTips.length] });
    void this.say(lines);
  }

  talkVillager(id: string) {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b?.villager) return;
    const lines = toLines(this.finished(b) ? b.chatAfter : b.chatDuring);
    void this.say(lines.length ? lines : [{ who: b.villager.name, text: "Lovely day for building, isn't it?" }]);
  }

  // ---- start ------------------------------------------------------------------

  titleScreen(onStart: () => void) {
    const hasSave = store.hasSave;
    const screen = el(`<div class="title-screen">
      <div class="panel title-card">
        <h1>${esc(GAME_TITLE)}</h1>
        <p class="tag">Found a village. Speak the Old Tongue. Build it with real Python.</p>
        <div class="row"></div>
        <div class="status"></div>
        <div class="controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or click to walk · <kbd>E</kbd> to chop, mine and talk · <kbd>C</kbd> Codex</div>
      </div>
    </div>`);
    const row = screen.querySelector<HTMLElement>(".row")!;
    const status = screen.querySelector<HTMLElement>(".status")!;
    const begin = el<HTMLButtonElement>(`<button class="btn amber" style="font-size:1.15rem;padding:12px 26px">${hasSave ? "Continue" : "Begin"}</button>`);
    begin.addEventListener("click", () => {
      sfx.click();
      screen.remove();
      onStart();
    });
    row.append(begin);
    if (hasSave) {
      const fresh = el<HTMLButtonElement>(`<button class="btn ghost">New game</button>`);
      fresh.addEventListener("click", () => {
        if (!confirm("Start over? Your village and code will be erased.")) return;
        store.reset();
        location.reload();
      });
      row.append(fresh);
    }
    this.runner.onStatus((s) => (status.textContent = s.state === "ready" ? `🐍 ${s.message}, entirely offline` : s.message));
    this.ui.append(screen);
  }

  async intro() {
    await this.say([
      { who: "Pip", text: "Oh! A visitor! Hello hello. Welcome to the valley. I'm **Pip**." },
      { who: "Pip", text: "This deed says the valley is yours now. It's a bit... empty. But it's full of possibility. And trees. Mostly trees." },
      { who: "Pip", text: "The valley's magic answers to the Old Tongue, **Python**. Speak it to the glowing rune stone and it builds things for you." },
      { who: "Pip", text: "Let's start with a tavern. Every village needs a warm place. First, gather some wood: walk with **WASD** (or click), and press **E** next to a tree." },
      { who: "Pip", text: "When you have enough, come back to the rune stone. And don't worry: I'll teach you every word of Python you need. Everything's in the **Codex** (press **C**)." },
    ]);
    store.data.introSeen = true;
    store.changed();
  }
}

const pipTips = [
  "Tip: in the workbench, **▶ Run** shows what your program does. Run early, run often!",
  "Tip: if Python shows an error, I'll translate it. Fix one thing, then run again.",
  "Tip: every example in the Codex has a **▶ Try it** button that runs it for real.",
  "Tip: stuck? Hints in the workbench go from a gentle nudge to almost the answer.",
  "Tip: scroll the mouse wheel to zoom the camera in and out.",
];
