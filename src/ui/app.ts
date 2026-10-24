import { BUILDINGS } from "../content/index.ts";
import type { Building, Challenge } from "../content/types.ts";
import type { PythonRunner } from "../python/runner.ts";
import { store, GAME_TITLE } from "../state.ts";
import { sfx } from "../game/audio.ts";
import { music } from "../game/music.ts";
import { soundscape } from "../game/soundscape.ts";
import type { Resource, World } from "../game/world.ts";
import { codexBook } from "./codexbook.ts";
import { esc, md, el } from "./md.ts";
import { icon } from "./icons.ts";
import { portrait } from "./portrait.ts";
import { modelOf, nameTag, toLine, toLines, type Line } from "./speakers.ts";
import { workbench } from "./workbench.ts";
import { installUiSounds, soundButton } from "./sound-panel.ts";
import { personById } from "../content/people/index.ts";
import type { Person } from "../content/types.ts";
import { answer, befriend, bond, chat, GAIN, hearts, meet, type Gain } from "../friends.ts";
import { friendsBook, heartRow } from "./friendsbook.ts";
import { chronicleSheet } from "./chronicle.ts";
import { installLife } from "../life/index.ts";
import type { LifeApp, LifeRune } from "../life/context.ts";
import { bagSheet, giftPicker, itemIcon } from "../life/bagbook.ts";
import { canGift, give, knownLoves } from "../life/gifts.ts";
import { item } from "../life/items.ts";
import { markRune, runeSolved } from "../life/save.ts";

const ICON: Record<Resource, string> = { wood: icon("wood"), stone: icon("stone") };
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

/** Everything drawn over the 3D world: HUD, dialogue, menus. */
export class App {
  private ui = document.getElementById("ui")!;
  private world!: World;
  private modal: HTMLElement | null = null;
  private dialogEl: HTMLElement | null = null;
  private promptEl = el(`<div class="plate prompt" hidden></div>`);
  private resEls: Record<Resource, HTMLElement> = {} as never;
  private questEl = el(`<div class="plate quest" aria-live="polite"></div>`);
  private toastTimer = 0;
  private hudButtons!: HTMLElement;
  private hotkeys = new Map<string, () => void>();

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
    if (store.data.introSeen) meet("pip");
    for (const b of BUILDINGS)
      if (b.villager && (b.villager.arrives === "start" ? this.unlocked(b) : this.finished(b))) {
        meet(b.villager.model);
        void this.world.showVillager(b.id);
      }
  }

  attach(world: World) {
    this.world = world;
    const res = el(`<div class="plate hud-res"></div>`);
    for (const k of ["wood", "stone"] as Resource[]) {
      const r = el(`<div class="res" title="${k}">${ICON[k]}<span class="v">0</span></div>`);
      this.resEls[k] = r;
      res.append(r);
    }
    const buttons = el(`<div class="hud-buttons">
      <button class="plate icon-btn bag-btn" title="Bag (B)" aria-label="Open your bag">${icon("bag")}</button>
      <button class="plate icon-btn friends-btn" title="Friends (F)" aria-label="Open your friends journal">${icon("people")}</button>
      <button class="plate icon-btn codex-btn" title="The Codex (C)" aria-label="Open the Codex">${icon("book")}</button>
      <button class="plate icon-btn mute-btn" title="Sound on/off (M)" aria-label="Toggle sound">${icon("sound")}</button>
    </div>`);
    buttons.querySelector(".codex-btn")!.addEventListener("click", () => this.openCodex());
    buttons.querySelector(".friends-btn")!.addEventListener("click", () => this.openFriends());
    buttons.querySelector(".bag-btn")!.addEventListener("click", () => this.openBag());
    this.hudButtons = buttons;
    const mute = buttons.querySelector<HTMLButtonElement>(".mute-btn")!;
    soundButton(mute, this.ui);
    installUiSounds(this.ui);
    soundscape.attach(world);
    this.ui.append(this.questEl, res, buttons, this.promptEl);
    store.on(() => this.drawHud());
    this.drawHud();
    this.syncVillagers();
    installLife({ world, app: this.lifeApp() });
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement).closest?.("input, textarea, .cm-editor")) return;
      if (e.key === "Escape") {
        if (this.modal) this.closeModal();
        else if (this.dialogEl) this.closeDialog();
      } else if (e.key.toLowerCase() === "c" && !this.modal && !this.dialogEl && !this.world.paused) this.openCodex();
      else if (e.key.toLowerCase() === "f" && !this.modal && !this.dialogEl && !this.world.paused) this.openFriends();
      else if (e.key.toLowerCase() === "b" && !this.modal && !this.dialogEl && !this.world.paused) this.openBag();
      else if (!this.modal && !this.dialogEl && !this.world.paused && this.hotkeys.has(e.key.toLowerCase())) this.hotkeys.get(e.key.toLowerCase())!();
      else if (e.key.toLowerCase() === "m") sfx.toggleMute();
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
      goal = `${esc(this.building.name)} is open`;
      sub = `${this.building.villager ? `Talk to ${this.building.villager.name}. ` : ""}More of the valley is coming soon.`;
    } else if (!store.canAfford(next.cost)) {
      const need: string[] = [];
      if (d.wood < next.cost.wood) need.push(`${next.cost.wood - d.wood} more wood`);
      if (d.stone < next.cost.stone) need.push(`${next.cost.stone - d.stone} more stone`);
      goal = `Gather ${need.join(" and ")}`;
      sub = `For the ${next.part.toLowerCase()}. Trees grow in the west grove, rocks in the east quarry. Press <kbd>E</kbd> next to one.`;
    } else {
      goal = `Speak to the rune stone`;
      sub = `“${esc(next.title)}” builds the ${esc(next.part.toLowerCase())}. The glowing stone stands beside Pip.`;
    }
    const chapter = ROMAN[BUILDINGS.indexOf(this.building)] ?? "";
    this.questEl.innerHTML = `<div class="eyebrow"><span>Chapter ${chapter} · ${esc(this.building.name)}</span><b>${done} / ${total}</b></div><div class="goal">${goal}</div><div class="sub">${sub}</div><div class="progress">${bar}</div>`;
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

  /** A heart toast when a friendship grows a heart. */
  private heartToast(g: Gain | null) {
    if (!g || g.after <= g.before) return;
    this.ui.querySelector(".toast")?.remove();
    const t = el(`<div class="plate toast heart-toast" role="status">${icon("heart", "full")}<span><b>${esc(g.person.name)}</b> · ${g.after} ${g.after === 1 ? "heart" : "hearts"}</span></div>`);
    this.ui.append(t);
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.remove(), 3600);
  }

  toast(text: string) {
    this.ui.querySelector(".toast")?.remove();
    const t = el(`<div class="plate toast" role="status">${icon("spark")}<span>${md(text)}</span></div>`);
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
      const box = el(`<div class="plate dialog" role="dialog" aria-live="polite">
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
        const person = personById.get(modelOf(line.who));
        who.innerHTML = `${esc(nameTag(line.who))}${person && bond(person.id).met ? heartRow(hearts(person.id), "mini") : ""}`;
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
          const b = el<HTMLButtonElement>(`<button class="btn">${last ? "Okay" : `Next ${icon("arrow")}`}</button>`);
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
    const root = el(`<div class="sheet modal rune-panel" role="dialog" aria-label="Rune stone">
      <div class="modal-head">
        <span class="mark">${icon("rune")}</span>
        <div class="titles"><div class="eyebrow">The rune stone · Chapter ${ROMAN[BUILDINGS.indexOf(b)] ?? ""}</div><h2>${esc(b.name)}</h2></div>
        <button class="close" aria-label="Close">${icon("close")}</button>
      </div>
      <div class="building-tabs" role="tablist"></div>
      <div class="build-body">
        <p class="blurb">${esc(b.blurb)} Each part is built by speaking Python to the stone.</p>
        <div class="stages" style="--rows:${Math.ceil(b.challenges.length / 2)}"></div>
        <div class="next-slot"></div>
      </div>
    </div>`);
    root.querySelector(".close")!.addEventListener("click", () => this.closeModal());
    const open = BUILDINGS.filter((x) => this.unlocked(x) && x.challenges.length);
    const tabs = root.querySelector<HTMLElement>(".building-tabs")!;
    if (open.length > 1) {
      for (const x of open) {
        const t = el<HTMLButtonElement>(`<button class="${x === b ? "on" : ""}" role="tab" aria-selected="${x === b}">${this.finished(x) ? icon("check") : ""}${esc(x.name)}</button>`);
        t.addEventListener("click", () => x !== b && this.openRune(x));
        tabs.append(t);
      }
    } else tabs.remove();
    const stages = root.querySelector<HTMLElement>(".stages")!;
    b.challenges.forEach((c, i) => {
      const cls = store.isDone(c.id) ? "done" : i === done ? "next" : "";
      const tag = store.isDone(c.id) ? "button" : "div";
      const tagText = store.isDone(c.id) ? "Revisit" : i === done && current ? "Next" : "";
      const s = el(`<${tag} class="stage ${cls}" ${tag === "button" ? `title="Revisit “${esc(c.title)}”"` : ""}><span class="n">${store.isDone(c.id) ? icon("check") : i + 1}</span><span class="what">${esc(c.part)}<small>${esc(c.topic)}</small></span>${tagText ? `<span class="tag">${tagText}</span>` : ""}</${tag}>`);
      if (tag === "button") s.addEventListener("click", () => this.openBench(c));
      stages.append(s);
    });
    const slot = root.querySelector<HTMLElement>(".next-slot")!;
    if (!next) {
      const card = el(`<div class="next-card"><div><div class="label">Complete</div><h3>${esc(b.name)} is finished</h3></div><p>Every part is built. Reopen any part above to practise it again.</p></div>`);
      if (b.chronicle) {
        const read = el<HTMLButtonElement>(`<button class="btn line">${icon("scroll")} Chronicle page ${ROMAN[BUILDINGS.indexOf(b)]}</button>`);
        read.addEventListener("click", () => this.openChronicle(b));
        card.append(read);
      }
      slot.append(card);
    } else {
      const d = store.data;
      const can = store.canAfford(next.cost);
      const cost = (["wood", "stone"] as Resource[])
        .filter((k) => next.cost[k] > 0)
        .map((k) => `<span class="${d[k] < next.cost[k] ? "short" : ""}" title="You have ${d[k]} ${k}">${ICON[k]} ${next.cost[k]} ${k}${d[k] < next.cost[k] ? ` · you have ${d[k]}` : ""}</span>`)
        .join("");
      const card = el(`<div class="next-card">
        <div class="label">Part ${done + 1} · ${esc(next.part)} · ${esc(next.topic)}</div>
        <h3>${esc(next.title)}</h3>
        <div class="cost">${cost || "<span>No materials needed</span>"}</div>
      </div>`);
      const btn = el<HTMLButtonElement>(`<button class="btn ${can ? "rune" : ""}" ${can ? "" : "disabled"}>${can ? `Begin ${icon("arrow")}` : "Gather materials first"}</button>`);
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
    music.sting(this.finished(b) ? "finish" : "stage");
    const gains = [befriend("pip", GAIN.pipPart)];
    if (b.villager) gains.push(befriend(b.villager.model, GAIN.part + (this.finished(b) ? GAIN.finished : 0)));
    await new Promise((r) => setTimeout(r, 3300));
    const lines: Line[] = [toLine(c.done)];
    for (const g of gains) if (g) lines.push(...g.milestones.map((text) => ({ who: g.person.name, text })));
    gains.forEach((g) => this.heartToast(g));
    if (this.finished(b)) {
      this.syncVillagers();
      lines.push(...toLines(b.finale));
      const after = BUILDINGS[BUILDINGS.indexOf(b) + 1];
      if (!after || !after.challenges.length) lines.push({ who: "Pip", text: "That's the end of this chapter. More of the valley is coming soon. Practise any part again at the rune stone." });
      await this.say(lines);
      if (b.chronicle) await this.openChronicle(b);
      if (after?.challenges.length) await this.openChapter(after);
      return;
    }
    const next = this.nextChallenge()!;
    if (!store.canAfford(next.cost)) {
      lines.push({ who: "Pip", text: `Next up: the **${next.part.toLowerCase()}**. We'll need ${next.cost.wood ? `${next.cost.wood} wood` : ""}${next.cost.wood && next.cost.stone ? " and " : ""}${next.cost.stone ? `${next.cost.stone} stone` : ""}.` });
    } else lines.push({ who: "Pip", text: `We already have the materials for the **${next.part.toLowerCase()}**. Back to the rune stone whenever you're ready!` });
    await this.say(lines);
  }

  /** Ysolde's Chronicle page for a finished building; resolves when it is closed. */
  openChronicle(b: Building) {
    return new Promise<void>((done) => {
      const sheet = chronicleSheet(b.chronicle!, ROMAN[BUILDINGS.indexOf(b)], () => this.closeModal());
      sheet.addEventListener("chronicle:closed", () => done(), { once: true });
      this.openModal(sheet);
      new MutationObserver((_, obs) => {
        if (!sheet.isConnected) {
          obs.disconnect();
          sheet.dispatchEvent(new Event("chronicle:closed"));
        }
      }).observe(this.ui, { childList: true });
    });
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

  openBag() {
    this.openModal(bagSheet(() => this.closeModal()));
  }

  /** Pick something from the bag for this villager; they react in dialogue. */
  private openGift(p: Person) {
    const sheet = giftPicker(p, new Set(knownLoves(p.id)), (id) => {
      this.closeModal();
      const r = give(p, id);
      if (!r) return;
      sfx.pass();
      void this.say([{ who: p.name, text: r.line }, ...(r.gain?.milestones ?? []).map((text) => ({ who: p.name, text }))]).then(() => this.heartToast(r.gain));
    }, () => this.closeModal());
    this.openModal(sheet);
  }

  /** What village life (src/life) can use from the HUD and the dialogue. */
  private lifeApp(): LifeApp {
    return {
      ui: this.ui,
      toast: (text) => this.toast(text),
      gained: (id, n = 1) => this.itemToast(id, n),
      say: (lines, buttons) => this.say(lines, buttons),
      openSheet: (sheet) => this.openModal(sheet),
      closeSheet: () => this.closeModal(),
      finished: (id) => {
        const b = BUILDINGS.find((x) => x.id === id);
        return !!b && this.finished(b);
      },
      partsBuilt: (id) => {
        const b = BUILDINGS.find((x) => x.id === id);
        return b ? this.stageCount(b) : 0;
      },
      openRune: (rune, onSolved) => this.openLifeRune(rune, onSolved),
      hudButton: (o) => {
        const b = el<HTMLButtonElement>(`<button class="plate icon-btn" title="${esc(o.title)}${o.key ? ` (${o.key.toUpperCase()})` : ""}" aria-label="${esc(o.title)}">${o.icon}</button>`);
        b.addEventListener("click", o.onClick);
        this.hudButtons.insertBefore(b, this.hudButtons.querySelector(".codex-btn"));
        if (o.key) this.hotkeys.set(o.key.toLowerCase(), o.onClick);
        return b;
      },
      befriend: (id, points) => this.heartToast(befriend(id, points)),
    };
  }

  /** "Got 3 × Trout", with the item's icon. */
  private itemToast(id: string, n: number) {
    const d = item(id);
    if (!d) return;
    this.ui.querySelector(".toast")?.remove();
    const t = el(`<div class="plate toast item-toast" role="status">${itemIcon(d)}<span>Got ${n > 1 ? `${n} × ` : ""}<b>${esc(d.name)}</b></span></div>`);
    this.ui.append(t);
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.remove(), 2600);
  }

  /** The workbench on a village rune instead of a building part. */
  private openLifeRune(rune: LifeRune, onSolved: () => void) {
    this.openModal(
      workbench({
        challenge: rune,
        stage: 1,
        total: 1,
        runner: this.runner,
        close: () => this.closeModal(),
        openCodex: (p) => this.openCodex(p),
        build: () => {
          this.closeModal();
          markRune(rune.id);
          music.sting("stage");
          onSolved();
        },
        village: true,
        solved: runeSolved(rune.id),
      }),
    );
  }

  openFriends() {
    this.openModal(friendsBook(() => this.closeModal()));
  }

  /**
   * Talk to someone: `before` (Pip's guidance, say) comes first, then a line
   * from their personality and, on the first chat of the day, maybe a question.
   */
  private async converse(p: Person, before: Line[] = [], extra: string[] = []) {
    meet(p.id);
    const c = chat(p, extra);
    const lines = [...before, ...c.lines.map((text) => ({ who: p.name, text }))];
    const talk = c.firstToday ? befriend(p.id, GAIN.talk) : null;
    if (talk) lines.push(...talk.milestones.map((text) => ({ who: p.name, text })));
    const q = c.question;
    if (!q) {
      // a gift can follow any chat that doesn't end in a question
      const gift = canGift(p.id) ? [{ label: "Give a gift", cls: "gold", action: () => this.openGift(p) }, { label: "Goodbye", cls: "quiet", action: () => {} }] : undefined;
      await this.say(lines, gift);
      this.heartToast(talk);
      return;
    }
    lines.push({ who: p.name, text: q.ask });
    await this.say(
      lines,
      q.choices.map((ch, i) => ({
        label: ch.label,
        cls: "line",
        action: () => {
          const g = answer(p, q, i);
          void this.say([{ who: p.name, text: ch.reply }, ...(g?.milestones ?? []).map((text) => ({ who: p.name, text }))]).then(() => this.heartToast(g && g.after > g.before ? g : talk));
        },
      })),
    );
  }

  talkPip() {
    const next = this.nextChallenge();
    const d = store.data;
    const pip = personById.get("pip")!;
    if (!next) {
      void this.converse(pip, [{ who: "Pip", text: `We did it! ${this.building.name} is finished, and your Python grows stronger every day.` }]);
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
    if (bond("pip").heard % 3 === 2) lines.push({ who: "Pip", text: pipTips[(d.done.length + d.wood) % pipTips.length] });
    void this.converse(pip, lines);
  }

  talkVillager(id: string) {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b?.villager) return;
    const v = b.villager;
    // chapter lines from the building mix in with their everyday ones
    const extra = toLines(this.finished(b) ? b.chatAfter : b.chatDuring)
      .filter((l) => l.who === v.name)
      .map((l) => l.text);
    const p = personById.get(v.model);
    if (p) void this.converse(p, [], extra);
    else void this.say(extra.length ? extra.map((text) => ({ who: v.name, text })) : [{ who: v.name, text: "Lovely day for building, isn't it?" }]);
  }

  // ---- start ------------------------------------------------------------------

  titleScreen(onStart: () => void) {
    const hasSave = store.hasSave;
    const [first, second] = GAME_TITLE.split(" & ");
    const screen = el(`<div class="title-screen">
      <div class="eyebrow">A valley built in Python</div>
      <h1>${esc(first)} <em>&amp;</em><br>${esc(second ?? "")}</h1>
      <p class="tag">Found a village from nothing. Learn the Old Tongue, and every line you write raises another wall.</p>
      <div class="row"></div>
      <div class="foot">
        <span class="status status-dot"></span>
        <span class="controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk <kbd>E</kbd> gather and talk <kbd>C</kbd> Codex</span>
      </div>
    </div>`);
    const row = screen.querySelector<HTMLElement>(".row")!;
    const status = screen.querySelector<HTMLElement>(".status")!;
    const begin = el<HTMLButtonElement>(`<button class="btn gold">${hasSave ? "Continue" : "Begin"} ${icon("arrow")}</button>`);
    this.ui.classList.add("titling");
    begin.addEventListener("click", () => {
      sfx.click();
      this.ui.classList.remove("titling");
      screen.remove();
      onStart();
    });
    row.append(begin);
    if (hasSave) {
      const fresh = el<HTMLButtonElement>(`<button class="btn line">New game</button>`);
      fresh.addEventListener("click", () => {
        if (!confirm("Start over? Your village and code will be erased.")) return;
        store.reset();
        location.reload();
      });
      row.append(fresh);
    }
    this.runner.onStatus((s) => {
      status.textContent = s.state === "ready" ? `${s.message}, entirely offline` : s.message;
      status.classList.toggle("ready", s.state === "ready");
    });
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
    meet("pip");
    store.changed();
  }
}

const pipTips = [
  "Tip: in the workbench, **Run** shows what your program does. Run early, run often!",
  "Tip: if Python shows an error, I'll translate it. Fix one thing, then run again.",
  "Tip: every example in the Codex has a **Try it** button that runs it for real.",
  "Tip: stuck? Hints in the workbench go from a gentle nudge to almost the answer.",
  "Tip: scroll the mouse wheel to zoom the camera in and out.",
];
