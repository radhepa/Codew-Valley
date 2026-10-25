import * as THREE from "three";
import type { LifeCtx } from "../context.ts";
import { bag, item } from "../items.ts";
import { clock } from "../clock.ts";
import { lifeSave, runeSolved } from "../save.ts";
import { store } from "../../state.ts";
import { esc, el } from "../../ui/md.ts";
import { model, preload } from "../../game/models.ts";
import { CAST_DUR, CAST_RELEASE, CATCH_DUR, rig } from "./anims.ts";
import { FISH, biting, fishInfo, pickCatch, rollSize, type FishSpot } from "./fish.ts";
import { newReel, stepReel, type Reel } from "./reel.ts";
import { fishShadow, Line, WATER_Y, WaterFx } from "./fx.ts";
import { fishSfx } from "./sound.ts";
import { FORECAST_RUNE } from "./runes.ts";
import { hasLuck, luckyCatch, openRipple, rippleToday, spendLuck } from "./ripple.ts";

// One fishing trip: walk out (on the pier), cast, wait, a bite, the reel, the catch. A small
// state machine run from the world's frame hook, with the player held in place (world.hold).

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface FishingSpot {
  id: FishSpot;
  /** Where the spot's prompt sits (and where a walk out starts). */
  prompt: THREE.Vector3;
  /** Walk from the prompt to the casting place (the pier), or just step to it (the shore). */
  path: THREE.Vector3[];
  /** Where the float lands (with a little scatter). */
  water: THREE.Vector3;
}

export interface Catch {
  id: string;
  size: number;
}

export interface FishSave {
  rod: boolean;
  caught: Record<string, { n: number; best: number; day: number }>;
  casts: number;
}
export const fishSave = () => lifeSave<FishSave>("fishing", () => ({ rod: false, caught: {}, casts: 0 }));

const IMGS = import.meta.glob("./img/*.png", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
export const fishImg = (id: string) => IMGS[`./img/${id}.png`] ?? "";

type State = "off" | "walk" | "ready" | "cast" | "wait" | "bite" | "reel" | "land" | "show" | "back";

export class FishingTrip {
  private state: State = "off";
  private t = 0;
  private spot: FishingSpot | null = null;
  private fx: WaterFx;
  private line: Line;
  private float: THREE.Object3D;
  private shadow = fishShadow();
  private floatFrom = new THREE.Vector3();
  private floatAt = new THREE.Vector3();
  private biteIn = 0;
  private nibbles: number[] = [];
  private catchNow: Catch | null = null;
  private reel: Reel | null = null;
  private held = false;
  private tapped = false;
  private trophy: THREE.Object3D | null = null;
  private trophyFrom = new THREE.Vector3();
  private walk: { pts: THREE.Vector3[]; i: number; then: () => void } | null = null;
  private hud: HTMLElement;
  private bang: HTMLElement;
  private reelEl: HTMLElement;
  private card: HTMLElement | null = null;
  private thrashT = 0;
  private catchModels: Promise<THREE.Object3D | null> | null = null;
  private missed = 0;
  /** Today's rune ripple is out on the water (unread), and when it next rings. */
  private rippleOn = false;
  private rippleT = 0;
  private rippleEl: HTMLButtonElement;
  /** This bite is the ripple's lucky catch. */
  private lucky = false;
  /** Called with each catch (the index updates the journal button). */
  onCatch: (c: Catch) => void = () => {};

  constructor(private ctx: LifeCtx) {
    const w = ctx.world;
    this.fx = new WaterFx(w.scene);
    this.line = new Line(w.scene, w.camera);
    this.float = new THREE.Group();
    void this.fx.ready.then(() => this.float.add(this.fx.makeFloat()));
    this.float.visible = false;
    w.scene.add(this.float, this.shadow);
    this.hud = el(`<div class="plate fish-hud" hidden><div class="fish-status"></div><div class="fish-keys"></div><div class="fish-forecast"></div><button class="btn small rune fish-ripple" hidden>Read the rune ripple <kbd>Q</kbd></button></div>`);
    this.rippleEl = this.hud.querySelector(".fish-ripple")!;
    this.rippleEl.addEventListener("click", () => this.readRipple());
    this.bang = el(`<div class="fish-bang" hidden>!</div>`);
    this.reelEl = el(`<div class="plate fish-reel" hidden>
      <div class="fish-reel-top"><span class="fish-reel-title">Reel it in</span><span class="fish-reel-mode"></span></div>
      <div class="fish-track"><span class="fish-track-water"></span><span class="fish-marker"></span><span class="fish-you"></span></div>
      <div class="fish-tension"><span></span></div>
      <div class="fish-reel-hint">Hold <kbd>E</kbd>, <kbd>Space</kbd> or the mouse to reel. Let go when it runs.</div>
    </div>`);
    ctx.app.ui.append(this.hud, this.bang, this.reelEl);
    w.onFrame((dt) => this.frame(dt));
    this.bindInput();
  }

  get active() {
    return this.state !== "off";
  }

  get spotId(): FishSpot | null {
    return this.spot?.id ?? null;
  }

  /** Redraw the fishing note (after Gran's water diary is solved). */
  refresh() {
    if (this.state === "ready" || this.state === "wait") this.forecast();
  }

  /** A fish rising somewhere on the pond: a ring, now and then a little flick of water. */
  rise(at: THREE.Vector3) {
    this.fx.ripple(at, 0.5 + Math.random() * 0.4, 2.2, 0.4);
    if (Math.random() < 0.25) {
      this.fx.drops(at, 3, 0.4);
      window.setTimeout(() => this.fx.ripple(at, 0.35, 1.6, 0.35), 260);
    }
  }

  /** Start loading the catch models (big), so the first reveal doesn't wait. */
  warm() {
    this.catchModels ??= model("fishing_catch").catch(() => null);
    void preload(["fishing_bits"]);
  }

  // ---- starting and stopping ---------------------------------------------------------

  start(spot: FishingSpot) {
    if (this.state !== "off") return;
    const w = this.ctx.world;
    this.warm();
    this.spot = spot;
    w.hold = true;
    // forget any click-to-walk still in progress, or the founder wanders off after the trip
    const walker = w as unknown as { target: unknown; pendingInteract: unknown };
    walker.target = null;
    walker.pendingInteract = null;
    this.state = "walk";
    this.hud.hidden = false;
    this.status("Heading out...", "");
    const from = w.playerPos;
    const pts = [from, ...spot.path];
    this.walk = { pts, i: 1, then: () => this.ready() };
    w.playAnim("walk");
  }

  /** Put the rod away and walk back (Esc, or a step key). */
  stop() {
    if (this.state === "off" || this.state === "back" || this.state === "walk") return;
    const w = this.ctx.world;
    this.clearWater();
    this.hideCard();
    if (this.trophy) {
      w.scene.remove(this.trophy);
      this.trophy = null;
      this.setRodVisible(true);
    }
    this.reelEl.hidden = true;
    this.bang.hidden = true;
    w.playAnim("fish_stow");
    this.state = "back";
    this.status("", "");
    // off the pier the way you came; at the shore you just lower the rod
    const back = this.spot!.id === "pier" ? [...this.spot!.path.slice(0, -1).reverse(), this.spot!.prompt.clone().setY(0)] : [];
    window.setTimeout(() => {
      if (!back.length) return this.end();
      this.walk = { pts: [w.playerPos, ...back], i: 1, then: () => this.end() };
      w.playAnim("walk");
    }, 350);
  }

  private end() {
    const w = this.ctx.world;
    const p = w.playerObject.position;
    p.y = 0;
    w.playAnim("idle");
    w.hold = false;
    this.state = "off";
    this.hud.hidden = true;
    this.spot = null;
  }

  private ready() {
    const w = this.ctx.world;
    w.playAnim("idle");
    w.face(this.spot!.water);
    w.playAnim("fish_wait");
    this.setRodVisible(true);
    this.state = "ready";
    this.t = 0;
    this.status(hasLuck() ? "The pond owes you one. Cast!" : "Ready to cast.", "<kbd>E</kbd> or click to cast · <kbd>Esc</kbd> to put the rod away");
    this.forecast();
    this.rippleOn = !hasLuck() && !!rippleToday();
    this.rippleT = 0.6;
  }

  // ---- the rune ripple (ripple.ts): once a day, a Python question for a lucky catch ----------

  private readRipple() {
    if (!this.rippleOn || this.ctx.world.paused) return;
    openRipple(this.ctx.app, () => {
      this.rippleOn = false;
      const w = this.ctx.world;
      const at = this.spot ? this.spot.water.clone().setY(WATER_Y + 0.1) : w.playerPos;
      w.fx.sparkles(at, 14, 0.7);
      fishSfx.fanfare(1, false);
      this.status("<b>The ripple goes still.</b> The pond owes you one: your next fish is a rare one.", "<kbd>E</kbd> or click to cast · <kbd>Esc</kbd> to put the rod away");
    });
  }

  /** Gold rings on the water beside the float's spot, now and then, while the ripple waits. */
  private stepRipple(dt: number) {
    const show = this.rippleOn && (this.state === "ready" || this.state === "wait");
    this.rippleEl.hidden = !show;
    if (!show || !this.spot) return;
    this.rippleT -= dt;
    if (this.rippleT > 0) return;
    this.rippleT = 1.5;
    const at = this.spot.water.clone().add(V(0.9, 0, -0.5)).setY(WATER_Y);
    this.fx.ripple(at, 0.6, 1.8, 0.5);
    this.ctx.world.fx.sparkles(at.clone().setY(WATER_Y + 0.06), 3, 0.25);
  }

  // ---- input -------------------------------------------------------------------------

  private bindInput() {
    const canvas = this.ctx.world.renderer.domElement;
    window.addEventListener("keydown", (e) => {
      if (this.state === "off" || this.ctx.world.paused) return;
      if ((e.target as HTMLElement).closest?.("input, textarea, .cm-editor")) return;
      const k = e.key.toLowerCase();
      if (k === "e" || k === " " || k === "enter") {
        e.preventDefault();
        if (!e.repeat) this.press();
      } else if (k === "q") {
        if (this.state === "ready" || this.state === "wait") this.readRipple();
      } else if (k === "escape" || k === "w" || k === "a" || k === "s" || k === "d" || k.startsWith("arrow")) {
        if (this.state === "ready" || this.state === "wait" || this.state === "show" || (k === "escape" && this.state !== "land")) this.stop();
      }
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if (k === "e" || k === " " || k === "enter") this.held = false;
    });
    // clicks on the world act like E while fishing (and don't walk the player off)
    window.addEventListener(
      "pointerdown",
      (e) => {
        if (this.state === "off" || e.target !== canvas || e.button !== 0 || this.ctx.world.paused) return;
        e.stopImmediatePropagation();
        this.press();
      },
      { capture: true },
    );
    window.addEventListener("pointerup", () => (this.held = false));
    window.addEventListener("blur", () => (this.held = false));
  }

  private press() {
    this.held = true;
    this.tapped = true;
    switch (this.state) {
      case "ready":
        return this.cast();
      case "wait":
        // a nibble isn't a bite: don't waste the cast on a twitch
        if (rig.nibble < 0.7) return this.status("Not yet... wait for it to go right under.", "Watch the float");
        return this.reelInEmpty();
      case "bite":
        return this.hook();
      case "show":
        if (this.t > 0.8) this.afterShow();
        return;
    }
  }

  // ---- the trip ----------------------------------------------------------------------

  private cast() {
    const w = this.ctx.world;
    const s = this.spot!;
    w.playAnim("fish_cast");
    fishSfx.cast();
    this.state = "cast";
    this.t = 0;
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.55;
    this.floatAt.copy(s.water).add(V(Math.cos(a) * r, 0, Math.sin(a) * r)).setY(WATER_Y);
    this.status("", "");
    const save = fishSave();
    save.casts++;
    store.changed();
  }

  private landFloat() {
    this.fx.splash(this.floatAt, 0.45, 4);
    fishSfx.plop();
    this.state = "wait";
    this.t = 0;
    this.newBite();
    this.ctx.world.playAnim("fish_wait");
    this.status("Watch the float...", "<kbd>E</kbd> to reel in · <kbd>Esc</kbd> to put the rod away");
  }

  private newBite() {
    const rain = clock.raining;
    // the first few casts of all come quickly, so a new fisher isn't left wondering
    const first = Object.keys(fishSave().caught).length === 0;
    this.biteIn = (first ? 2.2 : 3) + Math.random() * (first ? 2 : 5.5) * (rain ? 0.65 : 1);
    this.nibbles = [];
    const n = Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) this.nibbles.push(0.8 + Math.random() * (this.biteIn - 1.2));
    this.nibbles.sort((x, y) => x - y);
  }

  private reelInEmpty() {
    fishSfx.reelIn();
    this.floatFrom.copy(this.float.position);
    this.state = "ready";
    this.t = 0;
    this.float.visible = false;
    this.line.hide();
    this.fx.ripple(this.floatAt, 0.4, 1.0);
    this.ctx.world.playAnim("fish_wait");
    this.status("Nothing yet. Cast again?", "<kbd>E</kbd> or click to cast · <kbd>Esc</kbd> to put the rod away");
  }

  private bite() {
    this.state = "bite";
    this.t = 0;
    this.lucky = hasLuck();
    if (this.lucky) this.catchNow = luckyCatch(this.spot!.id, clock.timeOfDay, clock.raining);
    else {
      this.catchNow = { id: pickCatch(this.spot!.id, clock.timeOfDay, clock.raining), size: 0 };
      this.catchNow.size = rollSize(this.catchNow.id);
    }
    this.fx.splash(this.floatAt, 0.55, 6);
    fishSfx.bite();
    this.ctx.world.playAnim("fish_bite");
    this.bang.hidden = false;
    this.bang.classList.remove("pop");
    void this.bang.offsetWidth;
    this.bang.classList.add("pop");
    this.status("<b>A bite!</b>", "<kbd>E</kbd> or click, now!");
  }

  private hook() {
    this.bang.hidden = true;
    fishSfx.hook();
    const f = fishInfo(this.catchNow!.id)!;
    this.reel = newReel(f.fight);
    this.state = "reel";
    this.t = 0;
    this.thrashT = 0;
    this.missed = 0;
    this.ctx.world.playAnim("fish_reel");
    this.reelEl.hidden = false;
    this.reelEl.classList.remove("pull", "warn");
    this.status("", "");
    this.hud.hidden = true;
  }

  private missedBite() {
    this.bang.hidden = true;
    fishSfx.away();
    this.missed++;
    this.state = "wait";
    this.t = 0;
    this.newBite();
    this.ctx.world.playAnim("fish_wait");
    this.status(this.missed > 1 ? "Too slow again. The bait's still on." : "It got away. The bait's still on.", "Watch the float, and press <kbd>E</kbd> when it dips under");
  }

  private escaped() {
    this.reelEl.hidden = true;
    this.hud.hidden = false;
    fishSfx.away();
    this.fx.splash(this.shadow.position, 0.7, 6);
    this.clearWater();
    this.ctx.world.playAnim("fish_wait");
    this.state = "ready";
    this.t = 0;
    this.status("It slipped the hook. Gran would say: next one.", "<kbd>E</kbd> or click to cast · <kbd>Esc</kbd> to put the rod away");
  }

  private async landed() {
    const w = this.ctx.world;
    this.reelEl.hidden = true;
    const at = this.shadow.position.clone();
    this.clearWater();
    this.fx.splash(at, 1.0, 12);
    fishSfx.landed();
    this.state = "land";
    this.t = 0;
    rig.tension = 0;
    // the catch flies up out of the water and into the founder's hands, who turns to show it off
    // never keep the founder waiting on a slow download: after 3 s a stand-in will do
    const load = this.catchModels ?? model("fishing_catch").catch(() => null);
    const root = await Promise.race([load, new Promise<null>((res) => window.setTimeout(() => res(null), 3000))]);
    const src = root?.getObjectByName(this.catchNow!.id);
    const trophy = src ? src.clone(true) : new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: item(this.catchNow!.id)?.color ?? "#999" }));
    trophy.position.set(0, 0, 0);
    trophy.rotation.set(0, 0, 0);
    trophy.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(trophy);
    const len = Math.max(box.max.x - box.min.x, 0.02);
    const show = this.showLength(this.catchNow!);
    const holder = new THREE.Group();
    trophy.position.sub(box.getCenter(new THREE.Vector3()));
    holder.add(trophy);
    holder.scale.setScalar(show / len);
    holder.position.copy(at);
    this.trophyFrom.copy(at);
    w.scene.add(holder);
    this.trophy = holder;
    const p = w.playerPos;
    w.face(p.clone().add(V(0, 0, 1)));
    w.playAnim("fish_catch");
    this.setRodVisible(false);
    this.record();
  }

  /** How long the catch looks in the founder's hands: bigger than life (like the tools), never too tiny to see. */
  private showLength(c: Catch) {
    if (c.id === "willowmere_coin") return 0.24;
    if (c.id === "old_boot") return 0.52;
    if (c.id === "crayfish") return 0.44;
    return Math.min(1.1, Math.max(0.46, (c.size / 100) * 1.55));
  }

  private record() {
    const c = this.catchNow!;
    const s = fishSave();
    const prev = s.caught[c.id];
    const isNew = !prev;
    const best = !prev || c.size > prev.best;
    s.caught[c.id] = { n: (prev?.n ?? 0) + 1, best: Math.max(prev?.best ?? 0, c.size), day: prev?.day ?? clock.day };
    bag.add(c.id);
    store.changed();
    const f = fishInfo(c.id)!;
    const junk = c.id === "old_boot";
    fishSfx.fanfare(f.rarity, junk);
    if (f.rarity >= 2) this.ctx.world.fx.sparkles(this.ctx.world.playerPos.add(V(0, 1.6, 0)), 18, 0.8);
    if (isNew && !junk) this.ctx.app.befriend("fisher", 12);
    this.showCard(c, isNew, best && !isNew);
    if (this.lucky) {
      this.lucky = false;
      spendLuck();
      window.setTimeout(() => this.ctx.app.toast("**The rune ripple** paid you back. Marlo would call it luck. Gran wouldn't."), 1800);
    }
    const total = Object.values(s.caught).reduce((a, b) => a + b.n, 0);
    if (total === 3 && !runeSolved(FORECAST_RUNE.id)) window.setTimeout(() => this.ctx.app.toast("Marlo has a page of his gran's **water diary** for you. Open the fish journal (**J**)."), 3600);
    this.onCatch(c);
  }

  private afterShow() {
    const w = this.ctx.world;
    this.hideCard();
    if (this.trophy) {
      w.scene.remove(this.trophy);
      this.trophy = null;
    }
    this.hud.hidden = false;
    this.ready();
  }

  private clearWater() {
    this.float.visible = false;
    this.line.hide();
    this.shadow.visible = false;
    this.bang.hidden = true;
    rig.tension = 0;
    rig.reeling = false;
    rig.pull = false;
    const tip = this.ctx.world.playerObject.getObjectByName("fishing_rod_tip");
    if (tip) tip.rotation.x = 0;
  }

  // ---- every frame ---------------------------------------------------------------------

  private frame(dt: number) {
    this.fx.update(dt);
    if (this.state === "off") return;
    const w = this.ctx.world;
    if (w.paused) {
      this.held = false;
      return;
    }
    this.t += dt;
    rig.nibble += dt;
    this.stepRipple(dt);
    if (this.walk) this.stepWalk(dt);
    const tip = this.rodTip();
    switch (this.state) {
      case "cast": {
        if (this.t >= CAST_RELEASE) {
          // the float flies out on a lazy arc
          const u = Math.min(1, (this.t - CAST_RELEASE) / 0.62);
          if (!this.float.visible) {
            this.floatFrom.copy(tip);
            this.float.visible = true;
          }
          this.float.position.lerpVectors(this.floatFrom, this.floatAt, u);
          this.float.position.y += Math.sin(u * Math.PI) * 1.1 * (1 - u * 0.3);
          this.float.rotation.set(Math.sin(this.t * 14) * 0.5, 0, Math.cos(this.t * 11) * 0.5);
          this.line.set(tip, this.float.position, 0.05);
          if (u >= 1) this.landFloat();
        }
        if (this.t > CAST_DUR + 0.6 && this.state === "cast") this.landFloat();
        break;
      }
      case "wait": {
        const t = this.t;
        let y = WATER_Y + 0.004 * Math.sin(t * 2.3);
        // nibbles: two quick dips and a ring
        for (const n of this.nibbles) {
          const k = t - n;
          if (k >= 0 && k < 0.5) {
            y -= 0.035 * Math.max(0, Math.sin(k * Math.PI * 4)) * (1 - k * 1.6);
            if (k < dt) {
              this.fx.ripple(this.floatAt, 0.32, 0.9, 0.5);
              fishSfx.nibble();
              rig.nibble = 0;
              this.status("Something's nibbling...", "Wait for it to go right under");
            }
          }
        }
        this.float.position.set(this.floatAt.x, y, this.floatAt.z);
        this.float.rotation.set(Math.sin(t * 1.3) * 0.08, 0, Math.cos(t * 1.1) * 0.08);
        if (Math.random() < dt * 0.25) this.fx.ripple(this.floatAt, 0.22, 1.2, 0.3);
        this.line.set(tip, this.float.position, 0.32);
        this.bendRod(0.05);
        if (t >= this.biteIn) this.bite();
        break;
      }
      case "bite": {
        const t = this.t;
        // the float plunges and jerks about
        const dip = Math.min(1, t / 0.12);
        this.float.position.set(this.floatAt.x + Math.sin(t * 31) * 0.03, WATER_Y - 0.075 * dip + Math.sin(t * 23) * 0.012, this.floatAt.z + Math.cos(t * 27) * 0.03);
        if (Math.random() < dt * 6) this.fx.ripple(this.floatAt, 0.3, 0.8, 0.5);
        this.line.set(tip, this.float.position, 0.08);
        this.bendRod(0.22 + 0.06 * Math.sin(t * 30));
        const sp = w.screenPos(this.float.position.clone().add(V(0, 0.55, 0)));
        this.bang.style.transform = `translate(${sp.x}px, ${sp.y}px)`;
        // a generous window; the very first bites wait even longer
        const win = Object.keys(fishSave().caught).length === 0 ? 2.4 : 1.6;
        if (t > win) this.missedBite();
        break;
      }
      case "reel":
        this.stepReel(dt, tip);
        break;
      case "land": {
        const h = this.trophy;
        if (!h) break;
        const u = Math.min(1, this.t / 0.6);
        const to = this.handsPoint();
        h.position.lerpVectors(this.trophyFrom, to, 1 - (1 - u) ** 2);
        h.position.y += Math.sin(u * Math.PI) * 0.9;
        h.rotation.set(-0.85 * u, w.playerObject.rotation.y + (1 - u) * 3, Math.sin(this.t * 20) * 0.4 * (1 - u));
        if (Math.random() < dt * 30) this.fx.drip(h.position);
        if (u >= 1) {
          this.state = "show";
          this.t = 0;
        }
        break;
      }
      case "show": {
        const h = this.trophy;
        if (h) {
          h.position.copy(this.handsPoint());
          // a happy little wiggle, and drips for the first moments
          // tipped toward the camera, which looks down on the valley, so the whole flank shows
          h.rotation.set(-0.85, w.playerObject.rotation.y, Math.sin(this.t * 9) * 0.12 * Math.max(0, 1 - this.t / 1.6));
          if (this.t < 1.4 && Math.random() < dt * 8) this.fx.drip(h.position.clone().add(V((Math.random() - 0.5) * 0.3, -0.05, 0)));
        }
        if (this.t > CATCH_DUR + 0.6) this.afterShow();
        break;
      }
    }
    this.tapped = false;
  }

  private stepWalk(dt: number) {
    const w = this.ctx.world;
    const wk = this.walk!;
    const p = w.playerObject.position;
    const goal = wk.pts[wk.i];
    const d = new THREE.Vector3(goal.x - p.x, 0, goal.z - p.z);
    const dist = d.length();
    const step = 2.6 * dt;
    if (dist <= step) {
      p.set(goal.x, goal.y, goal.z);
      wk.i++;
      if (wk.i >= wk.pts.length) {
        this.walk = null;
        wk.then();
      }
      return;
    }
    d.multiplyScalar(step / dist);
    p.x += d.x;
    p.z += d.z;
    // step up onto the deck (or down off it) smoothly over the first half metre
    const prev = wk.pts[wk.i - 1];
    const along = 1 - (dist - step) / Math.max(1e-3, prev.distanceTo(goal));
    p.y = prev.y + (goal.y - prev.y) * Math.min(1, along * 2.5);
    w.face(goal);
  }

  private stepReel(dt: number, tip: THREE.Vector3) {
    const r = this.reel!;
    const res = stepReel(r, dt, this.held, this.tapped);
    rig.tension = r.tension;
    rig.reeling = this.held;
    rig.pull = r.mode === "pull";
    for (const e of r.events) {
      if (e === "click") fishSfx.click(r.mode === "pull" ? 0.8 : 1);
      else if (e === "run") fishSfx.thrash();
      else if (e === "slack") {
        fishSfx.slack();
        this.ctx.app.toast("The line sang! Ease off when it runs.");
      }
    }
    // the fish under the water: from where it bit toward the founder's feet, darting on a run
    const s = this.spot!;
    const stand = s.path[s.path.length - 1];
    const near = stand.clone().lerp(this.floatAt, 0.32).setY(WATER_Y);
    const pos = this.floatAt.clone().lerp(near, r.progress);
    const across = new THREE.Vector3().subVectors(near, this.floatAt).normalize();
    const side = V(-across.z, 0, across.x);
    const run = r.mode === "pull" ? 1 : r.mode === "warn" ? 0.5 : 0.15;
    pos.addScaledVector(side, Math.sin(this.t * (r.mode === "pull" ? 6 : 2.2)) * (0.15 + 0.35 * run));
    this.shadow.position.set(pos.x, WATER_Y + 0.003, pos.z);
    this.shadow.visible = true;
    const f = fishInfo(this.catchNow!.id)!;
    const big = Math.min(1.4, Math.max(0.25, this.catchNow!.size / 60));
    this.shadow.scale.setScalar(0.32 * big + 0.08);
    this.shadow.rotation.y = Math.atan2(-(near.z - this.floatAt.z), near.x - this.floatAt.x) + Math.sin(this.t * 7) * 0.25 * run;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.32 + 0.12 * run;
    this.float.position.set(pos.x, WATER_Y - 0.02, pos.z);
    this.line.set(tip, this.float.position, 0.02 + 0.12 * (1 - r.tension) * (r.mode === "pull" ? 0.2 : 1));
    this.bendRod(0.22 + 0.5 * r.tension + (r.mode === "pull" ? 0.18 : 0));
    // splashes when it fights; a warning ring just before a run
    this.thrashT -= dt;
    if (r.mode === "pull" && this.thrashT <= 0 && f.fight > 0.02) {
      this.fx.splash(pos, 0.45 + 0.35 * f.fight, 5);
      this.thrashT = 0.32;
    } else if (r.mode === "warn" && this.thrashT <= 0) {
      this.fx.ripple(pos, 0.5, 0.8, 0.6);
      this.thrashT = 0.25;
    } else if (r.mode === "rest" && this.held && Math.random() < dt * 3) this.fx.ripple(pos, 0.25, 0.8, 0.35);
    this.drawReel(r);
    if (res === "won") void this.landed();
    else if (res === "lost") this.escaped();
  }

  private drawReel(r: Reel) {
    const el = this.reelEl;
    el.classList.toggle("pull", r.mode === "pull");
    el.classList.toggle("warn", r.mode === "warn");
    el.classList.toggle("reeling", this.held && r.mode !== "pull");
    (el.querySelector(".fish-marker") as HTMLElement).style.left = `${(1 - r.progress) * 100}%`;
    (el.querySelector(".fish-tension span") as HTMLElement).style.width = `${r.tension * 100}%`;
    el.classList.toggle("strain", r.tension > 0.7);
    (el.querySelector(".fish-reel-mode") as HTMLElement).textContent = r.mode === "pull" ? "It's running! Let go" : r.mode === "warn" ? "Careful..." : this.held ? "Reeling..." : "Resting: reel now";
  }

  // ---- helpers ---------------------------------------------------------------------------

  private rodTip(): THREE.Vector3 {
    const w = this.ctx.world;
    const end = w.playerObject.getObjectByName("fishing_rod_end");
    const hold = w.playerObject.getObjectByName("tool_fishing_rod");
    if (end && hold?.visible && hold.scale.x > 0.5) return end.getWorldPosition(new THREE.Vector3());
    const p = w.playerPos;
    const f = w.playerFacing;
    return p.add(V(Math.sin(f) * 1.0, 1.75, Math.cos(f) * 1.0));
  }

  private bendRod(b: number) {
    const tip = this.ctx.world.playerObject.getObjectByName("fishing_rod_tip");
    if (tip) tip.rotation.x += (b - tip.rotation.x) * 0.25;
  }

  private setRodVisible(on: boolean) {
    const hold = this.ctx.world.playerObject.getObjectByName("tool_fishing_rod");
    hold?.children.forEach((c) => (c.visible = on));
  }

  /** Between the founder's two hands. */
  private handsPoint(): THREE.Vector3 {
    const w = this.ctx.world;
    const pl = w.playerObject;
    const hold = pl.getObjectByName("tool_fishing_rod");
    const armL = pl.getObjectByName("arm_l");
    if (!hold || !armL) return w.playerPos.add(V(0, 1.75, 0));
    const r = hold.getWorldPosition(new THREE.Vector3());
    const l = armL.localToWorld(V(-hold.position.x, hold.position.y, hold.position.z));
    const f = w.playerFacing;
    // between the two mittens, a hand's width in front so the catch sits in them, not through them
    return r.add(l).multiplyScalar(0.5).add(V(Math.sin(f) * 0.1, 0.03, Math.cos(f) * 0.1));
  }

  private status(main: string, keys: string) {
    (this.hud.querySelector(".fish-status") as HTMLElement).innerHTML = main;
    (this.hud.querySelector(".fish-keys") as HTMLElement).innerHTML = keys;
  }

  /** Gran's water diary (the village rune): what's biting here, now. */
  private forecast() {
    const box = this.hud.querySelector(".fish-forecast") as HTMLElement;
    if (!runeSolved(FORECAST_RUNE.id) || !this.spot) {
      box.innerHTML = "";
      return;
    }
    const list = biting(this.spot.id, clock.timeOfDay, clock.raining).sort((a, b) => b.w - a.w);
    const caught = fishSave().caught;
    const known = list.filter((b) => caught[b.id] && b.id !== "old_boot").map((b) => item(b.id)?.name ?? b.id);
    const unknown = list.filter((b) => !caught[b.id] && b.id !== "old_boot").length;
    const rare = list.filter((b) => FISH.find((f) => f.id === b.id)!.rarity >= 2 && caught[b.id]).map((b) => item(b.id)?.name);
    box.innerHTML = `<span class="label">Water diary</span> Biting here now: ${known.length ? esc(known.slice(0, 4).join(", ")) : "nothing you've met yet"}${unknown ? ` · <b>${unknown} you haven't met</b>` : ""}${rare.length ? ` · ${esc(rare.join(", "))} about` : ""}`;
  }

  private showCard(c: Catch, isNew: boolean, best: boolean) {
    this.hideCard();
    const d = item(c.id)!;
    const f = fishInfo(c.id)!;
    const sizeWord = c.id === "willowmere_coin" ? `${c.size.toFixed(1)} cm across` : c.id === "old_boot" ? "one boot" : `${c.size.toFixed(1)} cm`;
    const extra =
      c.id === "willowmere_coin" && isNew
        ? "Marlo will want to see this."
        : c.id === "old_boot"
          ? "Not quite what you were after."
          : f.rarity >= 2 && isNew
            ? "Marlo won't believe this."
            : "";
    const card = el(`<div class="sheet fish-card${f.rarity >= 2 ? " rare" : ""}" role="status">
      <img src="${fishImg(c.id)}" alt="">
      <div class="fish-card-text">
        <div class="eyebrow">${c.id === "old_boot" ? "You fished up" : c.id === "willowmere_coin" ? "Treasure!" : "You caught"}</div>
        <h3>${esc(d.name)}</h3>
        <div class="fish-card-tags">${isNew ? `<span class="tag new">New for the journal</span>` : ""}${best ? `<span class="tag best">Biggest yet</span>` : ""}<span class="tag">${sizeWord}</span></div>
        <p>${esc(d.desc)}${extra ? ` <em>${esc(extra)}</em>` : ""}</p>
      </div>
    </div>`);
    this.ctx.app.ui.append(card);
    this.card = card;
  }

  private hideCard() {
    if (!this.card) return;
    const c = this.card;
    this.card = null;
    c.classList.add("out");
    window.setTimeout(() => c.remove(), 300);
  }
}
