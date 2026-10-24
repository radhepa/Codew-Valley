import * as THREE from "three";
import type { LifeCtx } from "../context.ts";
import { el, esc } from "../../ui/md.ts";
import { itemIcon } from "../bagbook.ts";
import { item } from "../items.ts";
import { ease } from "../../game/anim.ts";
import type { Recipe, Vessel } from "./recipes.ts";
import { Hearth, dishModel, ovenPlaces, STAND } from "./hearth.ts";
import { cookMoves } from "./moves.ts";
import { cookSfx } from "./sound.ts";

// One go at the hearth or the oven: a short, forgiving hands-on moment, then the reveal.
//   pot   chop each ingredient into the pot (two presses each), then keep it at a gentle
//         simmer (hold to stir when it bubbles up), taste, and out comes the dish
//   pan   toss each ingredient into the hot pan, then flip it when it's golden (twice)
//   oven  knead the dough (three presses), slide it in, pull it out when the crust is golden
// Space, E, Enter or a click/tap anywhere is the one button. Nothing burns and nothing fails:
// a cook that stays in the sweet spot earns a bonus serving ("Perfect!").

export interface CookSpec {
  vessel: Vessel;
  recipe: Recipe;
  /** The ingredients already taken from the bag (one batch's worth shown as chopping). */
  items: string[];
  times: number;
  /** A discovery: the name stays hidden until the reveal. */
  isNew: boolean;
  /** Extra servings on top of `times` (the Guest Pot rune). */
  bonus: number;
}

export interface CookResult {
  perfect: boolean;
  servings: number;
}

const { out, back } = ease;

export class CookSession {
  private panel: HTMLElement;
  private holding = false;
  private early = 0;
  private nudgeT = 0;
  private card: HTMLElement | null = null;
  private ovenGlow: { mat: THREE.MeshStandardMaterial; base: number } | null = null;
  /** The dish was made (the caller gives back the ingredients if not). */
  made = false;
  private pressQ: (() => void)[] = [];
  private waits: { t: number; done: () => void }[] = [];
  private frame: ((dt: number) => void) | null = null;
  private stopFrame: () => void;
  private listeners: [string, EventListener, boolean][] = [];
  private panFood: THREE.Mesh | null = null;
  private flipT = -1;
  private dish: THREE.Object3D | null = null;
  private dishT = 0;
  private dishGone = -1;
  private gauge: { fill: HTMLElement; mark: HTMLElement; band: HTMLElement; ring: HTMLElement } | null = null;

  constructor(private ctx: LifeCtx, private hearth: Hearth, private spec: CookSpec) {
    const d = item(spec.recipe.id)!;
    const steps = spec.vessel === "pot" ? ["Chop", "Simmer", "Taste"] : spec.vessel === "pan" ? ["Into the pan", "Flip"] : ["Knead", "Bake"];
    this.panel = el(`<div class="plate cook-panel" role="group" aria-label="Cooking">
      <div class="cp-head">
        <span class="cp-dish${spec.isNew ? " mystery" : ""}">${itemIcon(d, spec.isNew ? "shadow" : "")}</span>
        <div><div class="eyebrow">${spec.isNew ? "Something new…" : spec.times > 1 ? `Cooking ×${spec.times}` : "Cooking"}</div><div class="cp-name">${spec.isNew ? "???" : esc(d.name)}</div></div>
        <ol class="cp-steps">${steps.map((s, i) => `<li data-i="${i}">${s}</li>`).join("")}</ol>
      </div>
      <div class="cp-say"></div>
      <div class="cp-gauge" hidden><div class="band"></div><div class="fill"></div><div class="mark"></div><div class="ends"><span></span><span></span></div></div>
      <div class="cp-row"><div class="cp-chips"></div><button class="cp-press"><kbd>Space</kbd><span>Chop</span></button></div>
    </div>`);
    ctx.app.ui.append(this.panel);
    const press = this.panel.querySelector<HTMLButtonElement>(".cp-press")!;
    press.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.down();
    });
    // the whole screen is the button while cooking (a trackpad tap anywhere works)
    const canvasDown = (e: Event) => {
      if (this.ctx.world.paused) return;
      const t = e.target as HTMLElement;
      if (t.tagName !== "CANVAS") return;
      e.stopPropagation();
      e.preventDefault();
      this.down();
    };
    const up = () => (this.holding = false);
    const key = (e: Event) => {
      const k = (e as KeyboardEvent).key.toLowerCase();
      if (this.ctx.world.paused || k === "m" || k === "escape") return;
      e.stopPropagation();
      if (k === " " || k === "e" || k === "enter") {
        e.preventDefault();
        if (!(e as KeyboardEvent).repeat) this.down();
      }
    };
    const keyUp = (e: Event) => {
      const k = (e as KeyboardEvent).key.toLowerCase();
      if (k === " " || k === "e" || k === "enter") this.holding = false;
    };
    this.listen("pointerdown", canvasDown, true);
    this.listen("pointerup", up, true);
    this.listen("pointercancel", up, true);
    this.listen("keydown", key, true);
    this.listen("keyup", keyUp, true);
    this.listen("blur", up, false);
    this.stopFrame = ctx.world.onFrame((dt) => this.tick(dt));
  }

  private listen(type: string, f: EventListener, capture: boolean) {
    window.addEventListener(type, f, capture);
    this.listeners.push([type, f, capture]);
  }

  private down() {
    this.holding = true;
    const q = this.pressQ.shift();
    if (q) q();
    // a press just before the button is ready counts for the next one (mashing is fine)
    else this.early = performance.now();
  }

  private press(label: string, keyHint = "Space") {
    const b = this.panel.querySelector<HTMLElement>(".cp-press")!;
    b.innerHTML = `<kbd>${keyHint}</kbd><span>${esc(label)}</span>`;
    b.classList.remove("nudge");
    b.hidden = false;
    this.panel.dataset.wait = label;
    return new Promise<void>((res) => {
      let nudge = 0;
      clearInterval(this.nudgeT);
      this.nudgeT = window.setInterval(() => ++nudge > 1 && b.classList.add("nudge"), 2500);
      this.pressQ = [
        () => {
          clearInterval(this.nudgeT);
          delete this.panel.dataset.wait;
          b.classList.remove("nudge");
          b.classList.remove("pop");
          void b.offsetWidth;
          b.classList.add("pop");
          res();
        },
      ];
      if (performance.now() - this.early < 650) {
        this.early = 0;
        this.pressQ.shift()!();
      }
    });
  }

  /** Show the button's label without waiting on a press (the held stir). */
  private label(text: string) {
    const b = this.panel.querySelector<HTMLElement>(".cp-press")!;
    b.innerHTML = `<kbd>Space</kbd><span>${esc(text)}</span>`;
    b.classList.remove("nudge");
    b.hidden = false;
  }

  private cancelPress() {
    this.pressQ = [];
    clearInterval(this.nudgeT);
    this.panel.querySelector(".cp-press")?.classList.remove("nudge");
    delete this.panel.dataset.wait;
  }

  private sleep(s: number) {
    return new Promise<void>((done) => this.waits.push({ t: s, done }));
  }

  private say(text: string) {
    const s = this.panel.querySelector<HTMLElement>(".cp-say")!;
    s.textContent = text;
    s.classList.remove("in");
    void s.offsetWidth;
    s.classList.add("in");
  }

  private step(i: number) {
    this.panel.querySelectorAll<HTMLElement>(".cp-steps li").forEach((li) => {
      const k = Number(li.dataset.i);
      li.className = k < i ? "done" : k === i ? "on" : "";
    });
  }

  private tick(dt: number) {
    if (this.ctx.world.paused) return;
    for (let i = this.waits.length - 1; i >= 0; i--) {
      const w = this.waits[i];
      w.t -= dt;
      if (w.t <= 0) {
        this.waits.splice(i, 1);
        w.done();
      }
    }
    this.frame?.(dt);
    this.updatePan(dt);
    this.updateDish(dt);
  }

  // ---- getting into place ----

  private async walkTo(to: THREE.Vector3, look: THREE.Vector3) {
    const w = this.ctx.world;
    const p = w.playerObject.position;
    const path: THREE.Vector3[] = [];
    // coming from the front of the hearth: round its east end, between the fire and the table
    // (the woodpile and the tavern close off the west end)
    if (this.spec.vessel !== "oven" && p.z > to.z + 0.4) {
      const gap = this.hearth.root!.position.x + 1.13;
      path.push(new THREE.Vector3(gap, 0, this.hearth.root!.position.z + 0.95));
      path.push(new THREE.Vector3(gap, 0, to.z));
    }
    path.push(to.clone());
    for (const target of path) {
      if (p.distanceTo(target) < 0.08) continue;
      w.playAnim("walk");
      await new Promise<void>((done) => {
        this.frame = (dt) => {
          const d = target.clone().sub(p).setY(0);
          const len = d.length();
          if (len < 0.05) {
            this.frame = null;
            done();
            return;
          }
          w.face(target.clone().add(d));
          p.addScaledVector(d.normalize(), Math.min(len, dt * 2.6));
        };
      });
    }
    w.playAnim("idle");
    w.face(new THREE.Vector3(look.x, 0, look.z));
    await this.sleep(0.25);
  }

  // ---- the gauge ----

  private showGauge(left: string, right: string, band: [number, number]) {
    const g = this.panel.querySelector<HTMLElement>(".cp-gauge")!;
    g.hidden = false;
    const [l, r] = g.querySelectorAll(".ends span");
    l.textContent = left;
    r.textContent = right;
    const b = g.querySelector<HTMLElement>(".band")!;
    b.style.left = `${band[0] * 100}%`;
    b.style.width = `${(band[1] - band[0]) * 100}%`;
    this.gauge = { fill: g.querySelector(".fill")!, mark: g.querySelector(".mark")!, band: b, ring: g };
  }
  private setGauge(mark: number, fill: number, inBand: boolean) {
    if (!this.gauge) return;
    this.gauge.mark.style.left = `${Math.min(1, Math.max(0, mark)) * 100}%`;
    this.gauge.fill.style.width = `${Math.min(1, fill) * 100}%`;
    this.gauge.ring.classList.toggle("sweet", inBand);
  }
  private hideGauge() {
    this.panel.querySelector<HTMLElement>(".cp-gauge")!.hidden = true;
    this.gauge = null;
  }

  private chips(ids: string[], on = -1, done = 0) {
    const c = this.panel.querySelector<HTMLElement>(".cp-chips")!;
    c.innerHTML = ids.map((id, i) => `<span class="chip${i < done ? " done" : i === on ? " on" : ""}">${itemIcon(item(id)!)}</span>`).join("");
  }

  /** Roughly where the player's hands are: in front of the chest. */
  private hands(up = 0.95, fwd = 0.38) {
    const w = this.ctx.world;
    const f = w.playerFacing;
    return w.playerPos.add(new THREE.Vector3(Math.sin(f) * fwd, up, Math.cos(f) * fwd));
  }

  // ---- the run ----

  async run(): Promise<CookResult> {
    const { vessel } = this.spec;
    const w = this.ctx.world;
    w.hold = true;
    let perfect = false;
    try {
      if (vessel === "oven") {
        const o = ovenPlaces()!;
        await this.walkTo(o.stand, o.mouth);
        perfect = await this.bake(o.mouth);
      } else {
        const stand = vessel === "pot" ? STAND.pot : STAND.pan;
        const look = vessel === "pot" ? this.hearth.soupPos : this.hearth.grillPos;
        await this.walkTo(stand, new THREE.Vector3(stand.x, 0, stand.z + 2));
        void look;
        perfect = vessel === "pot" ? await this.potGo() : await this.panGo();
      }
      const servings = this.spec.times + this.spec.bonus + (perfect ? 1 : 0);
      await this.reveal(perfect, servings);
      return { perfect, servings };
    } finally {
      this.end();
    }
  }

  private distinct() {
    return this.spec.items.slice(0, this.spec.recipe.needs.length);
  }

  private async potGo() {
    const h = this.hearth;
    const ids = this.distinct();
    const tint = new THREE.Color(this.spec.recipe.tint);
    // 1. chop each ingredient into the pot
    this.step(0);
    h.potHeat = 0.4;
    cookSfx.draw();
    for (let i = 0; i < ids.length; i++) {
      const d = item(ids[i])!;
      this.chips(ids, i, i);
      this.say(i === 0 ? `Chop the ${d.name.toLowerCase()} into the pot.` : `Now the ${d.name.toLowerCase()}.`);
      for (let k = 0; k < 2; k++) {
        await this.press(k === 0 ? "Chop" : "Into the pot");
        this.ctx.world.playAnim("cook_chop");
        await this.sleep(0.2);
        cookSfx.chop();
        const last = k === 1;
        h.fx.pieces(this.hands(0.85, 0.45), h.soupPos, d.color ?? "#d0a060", last ? 5 : 3, h.soupPos.y, () => {
          cookSfx.plop();
          h.fx.steam(h.soupPos, 0.8);
          for (let j = 0; j < 3; j++) h.fx.bubble(h.soupPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.01, (Math.random() - 0.5) * 0.25)), 0.035);
        });
        if (last) {
          const cur = new THREE.Color("#9a5230").lerp(tint, (i + 1) / ids.length);
          h.tint(`#${cur.getHexString()}`);
        }
        await this.sleep(0.32);
      }
    }
    this.chips(ids, -1, ids.length);
    h.tint(this.spec.recipe.tint);
    // 2. the simmer
    this.step(1);
    const perfect = await this.simmer();
    // 3. a taste
    this.step(2);
    this.hideGauge();
    this.say("Mmm. Just a taste…");
    this.panel.querySelector<HTMLElement>(".cp-press")!.hidden = true;
    this.ctx.world.playAnim("cook_taste");
    await this.sleep(0.75);
    cookSfx.taste();
    await this.sleep(0.35);
    if (perfect) h.fx.hearts(this.hands(1.35, 0.15), 3);
    await this.sleep(0.6);
    return perfect;
  }

  private simmer(): Promise<boolean> {
    const h = this.hearth;
    const BAND: [number, number] = [0.36, 0.7];
    this.showGauge("calm", "boiling over", BAND);
    this.say("Keep it at a gentle simmer. Hold to stir when it bubbles up.");
    this.label("Hold to stir");
    this.ctx.world.playAnim("cook_stir");
    cookSfx.pot.start(0.3);
    let level = 0.3;
    let vel = 0;
    let prog = 0;
    let inT = 0;
    let all = 0;
    let stirTick = 0;
    let lastQuarter = 0;
    let stir = 0;
    return new Promise((done) => {
      this.frame = (dt) => {
        const holding = this.holding;
        // heat builds on its own; stirring calms it
        vel += (holding ? -1.25 : 0.55) * dt;
        vel *= 1 - dt * 2.2;
        level = Math.max(0, Math.min(1, level + vel * dt + (holding ? -0.18 : 0.1) * dt));
        const inBand = level >= BAND[0] && level <= BAND[1];
        prog += (dt / 3.6) * (inBand ? 1 : 0.4);
        all += dt;
        if (inBand) inT += dt;
        stir += ((holding ? 1 : 0.12) - stir) * Math.min(1, dt * 6);
        cookMoves.stir = stir;
        cookMoves.phase += dt * (2.2 + 6 * stir);
        h.boil = level;
        h.potHeat = 0.35 + 0.65 * level;
        cookSfx.pot.level = 0.2 + 0.8 * level;
        stirTick -= dt;
        if (holding && stirTick <= 0) {
          stirTick = 0.55;
          cookSfx.stir();
        }
        const q = Math.floor(prog * 4);
        if (q > lastQuarter && q < 4) {
          lastQuarter = q;
          cookSfx.tick(q);
        }
        this.setGauge(level, prog, inBand);
        if (prog >= 1) {
          this.frame = null;
          cookSfx.pot.start(0.3);
          h.boil = 0.3;
          h.potHeat = 0.3;
          cookMoves.stir = 0;
          done(inT / all >= 0.68);
        }
      };
    });
  }

  private panFoodMesh() {
    const holder = this.ctx.world.playerObject.getObjectByName("tool_cook_pan");
    const pan = holder?.children[0];
    if (!pan) return null;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: this.spec.recipe.tint, roughness: 0.6, flatShading: false }));
    m.scale.set(0.001, 0.001, 0.001);
    m.position.set(0, 0.39, -0.02);
    pan.add(m);
    return m;
  }

  private updatePan(dt: number) {
    const f = this.panFood;
    if (!f || this.flipT < 0) return;
    this.flipT += dt;
    const t = this.flipT;
    // up out of the pan, a full turn, and back down with a squash
    if (t < 0.55) {
      const u = t / 0.55;
      f.position.z = -0.02 - Math.sin(Math.PI * u) * 0.32;
      f.rotation.x = Math.PI * 2 * out(u);
    } else {
      f.position.z = -0.02;
      f.rotation.x = 0;
      this.flipT = -1;
    }
  }

  private async panGo() {
    const h = this.hearth;
    const ids = this.distinct();
    this.step(0);
    this.ctx.world.playAnim("cook_pan");
    h.panHeat = 0.5;
    cookSfx.pan.start(0.25);
    await this.sleep(0.5);
    this.panFood = this.panFoodMesh();
    const pan = () => (this.panFood ? this.panFood.getWorldPosition(new THREE.Vector3()) : h.grillPos.clone().add(new THREE.Vector3(0, 0.3, 0)));
    for (let i = 0; i < ids.length; i++) {
      const d = item(ids[i])!;
      this.chips(ids, i, i);
      this.say(i === 0 ? `Into the hot pan with the ${d.name.toLowerCase()}!` : `And the ${d.name.toLowerCase()}.`);
      await this.press("Into the pan");
      h.fx.pieces(pan().add(new THREE.Vector3(0, 0.45, 0)), pan(), d.color ?? "#d0a060", 4, pan().y, () => {
        cookSfx.sizzleHit();
        h.fx.sparks(pan(), 4, 0.2);
        h.fx.steam(pan(), 0.5, 0.1);
      });
      await this.sleep(0.45);
      if (this.panFood) {
        const s = 0.05 + 0.04 * ((i + 1) / ids.length);
        this.panFood.scale.set(s * 1.25, s * 1.25, s * 0.38);
      }
    }
    this.chips(ids, -1, ids.length);
    this.step(1);
    let good = 0;
    for (let side = 0; side < 2; side++) {
      const ok = await this.fry(side);
      if (ok) good++;
    }
    this.hideGauge();
    cookSfx.pan.start(0.15);
    h.panHeat = 0.2;
    await this.sleep(0.4);
    return good === 2;
  }

  private fry(side: number): Promise<boolean> {
    const h = this.hearth;
    const BAND: [number, number] = [0.52, 0.84];
    this.showGauge("raw", "toasty", BAND);
    this.say(side === 0 ? "Let it sizzle. Flip it when it's golden!" : "Now the other side. Flip when it's golden.");
    let prog = 0;
    let flipped = false;
    let toldWait = false;
    const flip = (inBand: boolean, auto: boolean) => {
      flipped = true;
      this.ctx.world.playAnim("cook_flip");
      cookSfx.flip();
      this.flipT = 0;
      void this.sleep(0.76).then(() => this.ctx.world.playAnim("cook_pan"));
      h.fx.sparks(h.grillPos, 6, 0.3);
      if (this.panFood) (this.panFood.material as THREE.MeshStandardMaterial).color.lerp(new THREE.Color("#a7682c"), inBand ? 0.25 : 0.45);
      this.say(auto ? "Whoops, a little toasty! Still lovely." : inBand ? "Golden!" : prog < BAND[0] ? "A touch early, but it'll do." : "Nicely done.");
      if (inBand) cookSfx.tick(3);
    };
    const waitPress = () =>
      this.press("Flip!").then(() => {
        if (flipped) return;
        if (prog < 0.22) {
          if (!toldWait) this.say("Not yet, let it sizzle a moment…");
          toldWait = true;
          void waitPress();
          return;
        }
        flip(prog >= BAND[0] && prog <= BAND[1], false);
      });
    void waitPress();
    return new Promise((done) => {
      const start = prog;
      void start;
      this.frame = (dt) => {
        if (!flipped) {
          prog += dt / 2.8;
          cookMoves.sizzle = prog;
          h.panHeat = 0.5 + 0.5 * prog;
          cookSfx.pan.level = 0.3 + 0.7 * prog;
          if (Math.random() < dt * (3 + 6 * prog)) h.fx.sparks(h.grillPos, 1, 0.3);
          if (Math.random() < dt * 4) h.fx.steam(this.panFood?.getWorldPosition(new THREE.Vector3()) ?? h.grillPos, 0.3 + 0.4 * prog, 0.12);
          this.setGauge(prog, prog, prog >= BAND[0] && prog <= BAND[1]);
          if (prog >= 1) {
            this.cancelPress();
            flip(false, true);
          }
          return;
        }
        this.frame = null;
        const inBand = prog >= BAND[0] && prog <= BAND[1];
        this.cancelPress();
        void this.sleep(0.9).then(() => done(inBand));
      };
    });
  }

  private ovenMat(): THREE.MeshStandardMaterial | null {
    const g = this.ctx.world.scene.getObjectByName("oven_glow") as THREE.Mesh | undefined;
    const m = g?.material as THREE.MeshStandardMaterial | undefined;
    return m ?? null;
  }

  private async bake(mouth: THREE.Vector3) {
    const h = this.hearth;
    const ids = this.distinct();
    // 1. knead
    this.step(0);
    this.chips(ids, 0, 0);
    for (let k = 0; k < 3; k++) {
      this.say(k === 0 ? "Knead the dough. Push, fold, turn." : k === 1 ? "Fold…" : "And turn. Lovely.");
      await this.press("Knead");
      this.ctx.world.playAnim("cook_knead");
      await this.sleep(0.28);
      cookSfx.knead();
      h.fx.puff(this.hands(0.75, 0.45), 4, "#f6f0e2", 0.2);
      this.chips(ids, k + 1 < ids.length ? k + 1 : -1, Math.min(ids.length, k + 1));
      await this.sleep(0.25);
    }
    this.chips(ids, -1, ids.length);
    // 2. slide it in with the peel
    this.say("In it goes…");
    this.panel.querySelector<HTMLElement>(".cp-press")!.hidden = true;
    this.ctx.world.playAnim("cook_peel");
    await this.sleep(0.45);
    cookSfx.peel();
    cookSfx.whoosh();
    h.fx.sparks(mouth, 6, 0.3);
    await this.sleep(0.6);
    // 3. bake until golden
    this.step(1);
    const BAND: [number, number] = [0.58, 0.86];
    this.showGauge("pale", "very well done", BAND);
    this.say("Watch the crust. Take it out when it's golden.");
    cookSfx.oven.start(0.3);
    const mat = this.ovenMat();
    const base = mat?.emissiveIntensity ?? 2;
    if (mat) this.ovenGlow = { mat, base };
    let prog = 0;
    let pulled = false;
    let auto = false;
    let toldWait = false;
    const waitPress = () =>
      this.press("Take it out").then(() => {
        if (pulled) return;
        if (prog < 0.25) {
          if (!toldWait) this.say("It's only just gone in. Patience…");
          toldWait = true;
          void waitPress();
          return;
        }
        pulled = true;
      });
    void waitPress();
    await new Promise<void>((done) => {
      this.frame = (dt) => {
        prog += dt / 4.6;
        cookSfx.oven.level = 0.3 + 0.7 * prog;
        if (mat) mat.emissiveIntensity = base * (1.1 + 0.3 * prog + Math.sin(prog * 40) * 0.08);
        if (Math.random() < dt * 3) h.fx.steam(mouth.clone().add(new THREE.Vector3(0, 0.25, 0.1)), 0.25 + 0.3 * prog, 0.25);
        if (Math.random() < dt * 2) h.fx.sparks(mouth, 1, 0.3);
        this.setGauge(prog, prog, prog >= BAND[0] && prog <= BAND[1]);
        if (prog >= 1 && !pulled) {
          pulled = true;
          auto = true;
          this.cancelPress();
        }
        if (pulled) {
          this.frame = null;
          done();
        }
      };
    });
    const inBand = !auto && prog >= BAND[0] && prog <= BAND[1];
    this.hideGauge();
    this.panel.querySelector<HTMLElement>(".cp-press")!.hidden = true;
    this.say(auto ? "Very well done. Hazel says that's how her grandfather liked it." : inBand ? "Golden all over!" : "A little pale, but it smells wonderful.");
    this.ctx.world.playAnim("cook_peel");
    await this.sleep(0.5);
    cookSfx.peel();
    cookSfx.oven.stop();
    if (mat) mat.emissiveIntensity = base;
    h.fx.steam(mouth.clone().add(new THREE.Vector3(0, 0.2, 0.4)), 1, 0.3);
    await this.sleep(0.6);
    return inBand;
  }

  // ---- the reveal ----

  private async reveal(perfect: boolean, servings: number) {
    const w = this.ctx.world;
    const d = item(this.spec.recipe.id)!;
    this.panel.classList.add("out");
    // turn to the camera and hold it up
    w.face(w.playerPos.add(new THREE.Vector3(0, 0, 3)));
    await this.sleep(0.2);
    w.playAnim("cook_present");
    this.hearth.quiet = true;
    const model = await dishModel(d.id);
    if (model) {
      model.scale.setScalar(0.001);
      w.scene.add(model);
      this.dish = model;
      this.dishT = 0;
    }
    await this.sleep(0.35);
    cookSfx.reveal(perfect);
    cookSfx.plate();
    const pos = this.hands(1.3, 0.3);
    w.fx.sparkles(pos.clone().add(new THREE.Vector3(0, 0.15, 0)), perfect ? 12 : 7, 0.45);
    const card = el(`<div class="plate cook-card${perfect ? " perfect" : ""}" role="status">
      <div class="eyebrow">${this.spec.isNew ? "A new recipe!" : perfect ? "Perfect!" : "Ready"}</div>
      <div class="cc-name">${esc(d.name)}</div>
      <div class="cc-sub">${servings > 1 ? `${servings} ${this.spec.vessel === "pot" ? "bowls" : "servings"}` : "One serving"}${perfect ? " · a bonus one for doing it just right" : ""}</div>
    </div>`);
    this.ctx.app.ui.append(card);
    this.card = card;
    this.made = true;
    await this.sleep(1.9);
    card.classList.add("out");
    this.dishGone = 0;
    await this.sleep(0.45);
    card.remove();
  }

  private updateDish(dt: number) {
    const m = this.dish;
    if (!m) return;
    this.dishT += dt;
    const w = this.ctx.world;
    const pos = this.hands(1.22, 0.3);
    const grow = back(Math.min(1, this.dishT / 0.4));
    let s = 1.7 * grow;
    if (this.dishGone >= 0) {
      this.dishGone += dt;
      const u = Math.min(1, this.dishGone / 0.4);
      s *= 1 - u;
      pos.y += u * 0.6;
      if (u >= 1) {
        w.scene.remove(m);
        this.dish = null;
        w.fx.sparkles(pos, 8, 0.3);
        return;
      }
    }
    m.position.copy(pos);
    m.scale.setScalar(Math.max(0.001, s));
    m.rotation.set(0.35, this.dishT * 0.9, 0);
  }

  private end() {
    this.stopFrame();
    clearInterval(this.nudgeT);
    this.card?.remove();
    if (this.ovenGlow) this.ovenGlow.mat.emissiveIntensity = this.ovenGlow.base;
    // let go of any held pose (the stir and the pan run until something replaces them)
    if (!this.made) this.ctx.world.playAnim("cook_rest");
    if (this.panFood) {
      this.panFood.geometry.dispose();
      (this.panFood.material as THREE.Material).dispose();
    }
    for (const [t, f, c] of this.listeners) window.removeEventListener(t, f, c);
    this.panel.remove();
    if (this.dish) this.ctx.world.scene.remove(this.dish);
    this.panFood?.parent?.remove(this.panFood);
    cookSfx.stopAll();
    this.hearth.potHeat = 0;
    this.hearth.panHeat = 0;
    this.hearth.boil = 0.15;
    this.hearth.quiet = false;
    this.hearth.tint(null);
    cookMoves.stir = 0;
    cookMoves.sizzle = 0;
    this.ctx.world.hold = false;
  }
}
