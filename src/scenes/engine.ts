import * as THREE from "three";
import type { Actor, Mark, Scene, Step } from "../content/scenes/types.ts";
import type { LifeCtx, LifeLine, LifeRune } from "../life/context.ts";
import { PEOPLE } from "../content/people/index.ts";
import { audioCtx, bus } from "../game/audio.ts";
import { music } from "../game/music.ts";
import { portrait } from "../ui/portrait.ts";
import { store } from "../state.ts";
import { emoteEl } from "./emote.ts";
import { hum, sceneSound } from "./hum.ts";
import { makeProp } from "./props.ts";
import "./gestures.ts";

// Plays a heart-event scene (src/content/scenes): fades and letterbox bars, eased camera
// shots, actors walking to marks, emotes, dialogue through the game's own say(), choices that
// set flags, props, and an optional personal rune. While it plays the player can't walk, the
// HUD steps back, and time stands still. Holding Escape (or the Skip chip) fast-forwards to the
// end: every flag and the keepsake still land, and choices take their first option.

/** Pace in metres a second. */
const PACE = { slow: 1.3, walk: 2.3, run: 5.6 } as const;
/** How long Escape or the Skip chip must be held. */
const HOLD_TO_SKIP = 0.8;

const smooth = (t: number) => t * t * (3 - 2 * t);
const _sitQ = new THREE.Quaternion();
const _sitE = new THREE.Euler();
const turnToward = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;

interface Live {
  id: Actor;
  obj: THREE.Object3D;
  anim: { update(dt: number, speed?: number, running?: boolean): void; play(n: string): void; setLoop(n: "idle" | "talk" | "cast"): void; lookAt(y: number | null): void } | null;
  /** Where they stood before the scene, to put them back. */
  home: { pos: THREE.Vector3; rot: number };
  walk: { to: THREE.Vector3; speed: number; done: () => void } | null;
  yaw: number;
  speed: number;
  loop: "idle" | "talk" | "cast";
  /** Set by a loop step: the speaker's talk loop doesn't override it. */
  pinned: boolean;
  /** Sitting: the seat's height, and how far down they are (0 standing, 1 seated). */
  seat: number;
  sitK: number;
  sitting: boolean;
  /** Height of the head's top above its pivot, measured the first time an emote needs it. */
  headTop?: number;
}

interface Shot {
  fromPos: THREE.Vector3;
  fromLook: THREE.Vector3;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  follow?: Actor;
  t: number;
  dur: number;
  done?: () => void;
}

interface PropTween {
  obj: THREE.Object3D;
  from: THREE.Vector3;
  to: THREE.Vector3;
  rotFrom: number;
  rotTo: number;
  t: number;
  dur: number;
  done: () => void;
}

/** Thrown to stop a scene whose actors aren't in the valley yet. */
class Missing extends Error {}

export class Director {
  /** The scene playing now, if any. */
  playing: Scene | null = null;
  private skipping = false;
  private actors = new Map<Actor, Live>();
  private props = new Map<string, THREE.Object3D>();
  private tweens: PropTween[] = [];
  private shot: Shot | null = null;
  private emotes: { el: HTMLElement; actor: Actor; until: number }[] = [];
  private layer!: HTMLElement;
  private fadeEl!: HTMLElement;
  private skipEl!: HTMLElement;
  private time = 0;
  /** When the skip key or chip went down (performance.now ms), or null; real time, so a slow frame rate can't stall it. */
  private holdAt: number | null = null;
  private hushed: number | null = null;
  /** Wakes waits early when a skip starts. */
  private wakers = new Set<() => void>();
  private nameToActor = new Map<string, Actor>(PEOPLE.map((p) => [p.name, p.id]));

  constructor(private ctx: LifeCtx) {}

  get world() {
    return this.ctx.world;
  }

  /** Play a scene to the end. Control always comes back, even if a step throws. */
  async play(scene: Scene) {
    if (this.playing) return;
    this.playing = scene;
    this.skipping = false;
    const w = this.world;
    const ui = this.ctx.app.ui;
    const prev = { hold: w.hold, weatherHold: w.weather.hold };
    w.hold = true;
    w.weather.hold = true;
    w.stage = { actors: new Set(), cam: null };
    if (!store.data.scenes.includes(scene.id)) store.data.scenes.push(scene.id);
    store.changed();
    this.buildLayer(ui);
    const stopFrame = w.onFrame((dt) => this.frame(dt));
    const keys = (e: KeyboardEvent) => this.key(e);
    const keysUp = (e: KeyboardEvent) => e.key === "Escape" && (this.holdAt = null);
    let aborted = false;
    window.addEventListener("keydown", keys, true);
    window.addEventListener("keyup", keysUp, true);
    // warm the portraits so the first lines don't wait on a render
    for (const id of Object.keys(scene.cast)) void portrait(id === "player" ? "player" : id);
    try {
      await this.fade("out", 0.5);
      ui.classList.add("in-scene");
      this.layer.classList.add("bars-on");
      for (const [id, [x, z, facing]] of Object.entries(scene.cast)) this.cast(id, x, z, facing);
      for (const [id, def] of Object.entries(scene.props ?? {})) {
        const o = makeProp(def.kind);
        o.position.set(...def.at);
        o.rotation.y = def.rot ?? 0;
        if (def.scale) o.scale.setScalar(def.scale);
        o.visible = !!def.shown;
        w.addProp(o);
        this.props.set(id, o);
      }
      await this.run(scene.steps);
    } catch (e) {
      if (e instanceof Missing) {
        // not ready after all (a villager hasn't arrived): it can play another time
        aborted = true;
        store.data.scenes = store.data.scenes.filter((id) => id !== scene.id);
        console.warn(`Scene ${scene.id}: ${e.message}`);
      } else console.error(`Scene ${scene.id} stopped`, e);
    } finally {
      try {
        this.skipping = false;
        if (this.fadeEl.style.opacity !== "1") await this.fade("out", 0.6);
        this.restore();
        ui.classList.remove("in-scene");
        this.layer.classList.remove("bars-on");
        if (this.hushed !== null) this.musicBack();
        await new Promise((r) => setTimeout(r, 350));
        await this.fade("in", 0.8);
      } finally {
        if (!aborted) this.giveKeepsake();
        stopFrame();
        window.removeEventListener("keydown", keys, true);
        window.removeEventListener("keyup", keysUp, true);
        this.layer?.remove();
        this.fadeEl?.remove();
        for (const e of this.emotes) e.el.remove();
        this.emotes = [];
        w.stage = null;
        w.hold = prev.hold;
        w.weather.hold = prev.weatherHold;
        this.playing = null;
        store.changed();
      }
    }
  }

  // ---- steps ------------------------------------------------------------------

  private async run(steps: Step[]): Promise<void> {
    for (const s of steps) await this.step(s);
  }

  private async step(s: Step): Promise<void> {
    if ("fade" in s) return this.fade(s.fade, s.t ?? 0.9);
    if ("bars" in s) return void this.layer.classList.toggle("bars-on", s.bars);
    if ("cam" in s) {
      const p = this.camTo(s.cam.pos, s.cam.look, s.t ?? 0, s.cam.follow);
      return s.wait === false ? undefined : p;
    }
    if ("place" in s) {
      const a = this.live(s.place);
      a.obj.position.set(s.at[0], 0, s.at[1]);
      if (s.facing !== undefined) a.yaw = a.obj.rotation.y = s.facing;
      a.walk = null;
      return;
    }
    if ("walk" in s) {
      const p = this.walk(s.walk, s.to, PACE[s.pace ?? "walk"], s.stop ?? 0);
      return s.wait === false ? undefined : p;
    }
    if ("face" in s) {
      const a = this.live(s.face);
      const p = this.point(s.to);
      a.yaw = Math.atan2(p.x - a.obj.position.x, p.z - a.obj.position.z);
      return this.wait(this.skipping ? 0 : 0.35);
    }
    if ("anim" in s) {
      const a = this.live(s.anim);
      if (!this.skipping) a.anim?.play(s.name);
      const t = typeof s.wait === "number" ? s.wait : s.wait ? 1.2 : 0;
      return this.wait(t);
    }
    if ("sit" in s) {
      const a = this.live(s.sit);
      a.sitting = !s.stand;
      if (s.seat) a.seat = s.seat;
      if (this.skipping) a.sitK = a.sitting ? 1 : 0;
      return this.wait(0.5);
    }
    if ("loop" in s) {
      const a = this.live(s.loop);
      a.loop = s.name;
      a.pinned = s.name !== "idle";
      a.anim?.setLoop(s.name);
      return;
    }
    if ("emote" in s) {
      if (!this.skipping) this.emote(s.emote, s.kind, s.t ?? 1.6);
      return this.wait(s.wait ? (s.t ?? 1.6) : 0.25);
    }
    if ("say" in s) return this.say(s.say.map(line));
    if ("choice" in s) {
      const c = s.choice;
      let picked = c.options[0];
      await this.say(
        c.ask.map(line),
        c.options.map((o) => ({ label: o.label, cls: "line", action: () => (picked = o) })),
      );
      store.data.flags[c.flag] = picked.value;
      store.changed();
      return this.run(picked.then);
    }
    if ("if" in s) return this.run(store.flagged(s.if) ? s.then : (s.else ?? []));
    if ("flag" in s) {
      store.data.flags[s.flag] = s.value ?? "yes";
      store.changed();
      return;
    }
    if ("wait" in s && typeof s.wait === "number") return this.wait(s.wait);
    if ("music" in s) {
      if (s.music === "hush") this.musicHush();
      else if (s.music === "back") this.musicBack();
      else if (!this.skipping) music.sting(s.music);
      return;
    }
    if ("hum" in s) {
      if (this.skipping) return;
      const p = hum(s.hum, s.duet ? 2 : s.hum === "gorran_all" ? 3 : 1);
      return s.wait === false ? undefined : this.race(p);
    }
    if ("sound" in s) return void (!this.skipping && sceneSound(s.sound));
    if ("prop" in s) return this.prop(s);
    if ("fx" in s) {
      if (this.skipping) return;
      const at = new THREE.Vector3(...s.at);
      const fx = this.world.fx as unknown as Record<string, (p: THREE.Vector3, n?: number, r?: number) => void>;
      if (s.fx === "dust") fx.dust?.(at, 4, 0.5);
      else if (s.fx === "sparkles") fx.sparkles?.(at, 26, 1.5);
      else fx.smoke?.(at);
      return;
    }
    if ("rune" in s) return this.rune(s.rune, s.solved, s.skipped);
    if ("keepsake" in s) return void this.giveKeepsake();
    if ("befriend" in s) return void this.ctx.app.befriend(s.befriend, s.points);
  }

  // ---- actors -----------------------------------------------------------------

  private cast(id: Actor, x: number, z: number, facing = 0) {
    const a = this.live(id);
    a.obj.position.set(x, 0, z);
    a.yaw = a.obj.rotation.y = facing;
  }

  /** The actor, taken over for the scene the first time it's used. */
  private live(id: Actor): Live {
    let a = this.actors.get(id);
    if (a) return a;
    const got = this.world.actor(id);
    if (!got) throw new Missing(`${id} is not in the valley yet`);
    const home = got.key === "player" || got.key === "pip" ? { pos: got.obj.position.clone(), rot: got.obj.rotation.y } : (this.world.villagerHome(got.key) ?? { pos: got.obj.position.clone(), rot: got.obj.rotation.y });
    a = { id, obj: got.obj, anim: got.anim as Live["anim"], home, walk: null, yaw: got.obj.rotation.y, speed: 0, loop: "idle", pinned: false, seat: 0.5, sitK: 0, sitting: false };
    a.anim?.setLoop("idle");
    a.anim?.lookAt(null);
    this.actors.set(id, a);
    this.world.stage?.actors.add(got.key);
    return a;
  }

  private point(m: Mark): THREE.Vector3 {
    if (typeof m === "string") return this.live(m).obj.position.clone();
    return new THREE.Vector3(m[0], 0, m[1]);
  }

  private walk(id: Actor, to: Mark, speed: number, stop: number): Promise<void> {
    const a = this.live(id);
    const target = this.point(to);
    if (stop > 0) {
      // stop short of another actor, on the line between
      const d = target.clone().sub(a.obj.position).setY(0);
      const len = d.length();
      if (len > stop) target.copy(a.obj.position).addScaledVector(d, (len - stop) / len);
      else target.copy(a.obj.position);
    }
    if (this.skipping) {
      a.obj.position.copy(target);
      return Promise.resolve();
    }
    return new Promise((done) => {
      a.walk?.done();
      a.walk = { to: target, speed, done };
    });
  }

  private emote(id: Actor, kind: Parameters<typeof emoteEl>[0], t: number) {
    this.live(id);
    const el = emoteEl(kind);
    this.layer.append(el);
    this.emotes = this.emotes.filter((e) => (e.actor === id ? (e.el.remove(), false) : true));
    const e = { el, actor: id, until: this.time + t };
    this.emotes.push(e);
    // in place at once, not a frame later in the corner
    this.placeEmote(e);
  }

  private placeEmote(e: { el: HTMLElement; actor: Actor }) {
    const a = this.actors.get(e.actor);
    if (!a) return;
    const p = this.world.screenPos(this.headTop(a));
    // never under the top bar
    const y = Math.max(p.y, innerHeight * 0.09 + 62);
    e.el.style.transform = `translate(${p.x}px, ${y}px)`;
    e.el.hidden = p.behind;
  }

  // ---- camera and props -------------------------------------------------------

  private camTo(pos: [number, number, number], look: [number, number, number], t: number, follow?: Actor): Promise<void> {
    const cam = this.world.camera;
    const cur = this.world.stage?.cam;
    const fromPos = cur?.pos.clone() ?? cam.position.clone();
    const fromLook = cur?.look.clone() ?? ((cam.userData.look as THREE.Vector3 | undefined)?.clone() ?? new THREE.Vector3());
    if (follow) this.live(follow);
    const shot: Shot = { fromPos, fromLook, pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look), follow, t: 0, dur: this.skipping ? 0 : t };
    this.shot = shot;
    this.applyShot(0);
    if (shot.dur <= 0) return Promise.resolve();
    return new Promise((done) => (shot.done = done));
  }

  private applyShot(dt: number) {
    const s = this.shot;
    const stage = this.world.stage;
    if (!s || !stage) return;
    s.t = Math.min(s.dur, s.t + dt);
    const u = s.dur > 0 ? smooth(s.t / s.dur) : 1;
    const base = s.follow ? (this.actors.get(s.follow)?.obj.position ?? new THREE.Vector3()) : null;
    const pos = base ? s.pos.clone().add(base) : s.pos.clone();
    const look = base ? s.look.clone().add(base) : s.look.clone();
    stage.cam = { pos: s.fromPos.clone().lerp(pos, u), look: s.fromLook.clone().lerp(look, u) };
    if (s.t >= s.dur && s.done) {
      const d = s.done;
      s.done = undefined;
      d();
    }
  }

  private prop(s: Extract<Step, { prop: string }>): Promise<void> {
    const o = this.props.get(s.prop);
    if (!o) return Promise.resolve();
    if (s.show !== undefined) o.visible = s.show;
    if (s.on) {
      // carried: hold it in front of the actor, about hand height
      const a = this.live(s.on);
      a.obj.add(o);
      o.position.set(...(s.at ?? [0, 0.95, 0.42]));
      o.rotation.y = s.rot ?? 0;
      return Promise.resolve();
    }
    if (o.parent !== this.world.scene) {
      const p = o.getWorldPosition(new THREE.Vector3());
      this.world.scene.add(o);
      o.position.copy(p);
    }
    if (!s.at) return Promise.resolve();
    const to = new THREE.Vector3(...s.at);
    const dur = this.skipping ? 0 : (s.t ?? 0);
    if (dur <= 0) {
      o.position.copy(to);
      if (s.rot !== undefined) o.rotation.y = s.rot;
      return Promise.resolve();
    }
    const p = new Promise<void>((done) => this.tweens.push({ obj: o, from: o.position.clone(), to, rotFrom: o.rotation.y, rotTo: s.rot ?? o.rotation.y, t: 0, dur, done }));
    return s.wait ? p : Promise.resolve();
  }

  // ---- dialogue, runes ----------------------------------------------------------

  private say(lines: LifeLine[], buttons?: { label: string; cls?: string; action: () => void }[]) {
    return this.ctx.app.say(lines, buttons);
  }

  private async rune(ids: string[], solved: Step[], skipped: Step[]) {
    const { SCENE_RUNES } = await import("../content/scenes/runes.ts");
    const rune = ids.map((id) => SCENE_RUNES.find((r) => r.id === id)).find((r): r is LifeRune => !!r && this.ctx.app.finished(r.requires));
    if (!rune || this.skipping) return this.run(skipped);
    let ok = false;
    // the workbench is a sheet over the scene; the scene waits until it closes
    this.layer.classList.add("rune-open");
    await new Promise<void>((done) => {
      this.ctx.app.openRune(rune, () => (ok = true));
      const iv = window.setInterval(() => {
        if (!this.ctx.app.ui.querySelector(".modal-back")) {
          clearInterval(iv);
          done();
        }
      }, 200);
    });
    this.layer.classList.remove("rune-open");
    return this.run(ok ? solved : skipped);
  }

  private giveKeepsake() {
    const k = this.playing?.keepsake;
    if (!k || store.data.keepsakes.includes(k.id)) return;
    store.data.keepsakes.push(k.id);
    store.changed();
    this.ctx.app.toast(`Keepsake: **${k.name}**. It's on the shelf in your Friends journal (F).`);
  }

  // ---- music --------------------------------------------------------------------

  private musicHush() {
    if (!audioCtx() || this.hushed !== null) return;
    const g = bus("music").gain;
    this.hushed = g.value;
    g.setTargetAtTime(this.hushed * 0.12, audioCtx()!.currentTime, 0.5);
  }

  private musicBack() {
    if (!audioCtx() || this.hushed === null) return;
    bus("music").gain.setTargetAtTime(this.hushed, audioCtx()!.currentTime, 1.2);
    this.hushed = null;
  }

  // ---- time ---------------------------------------------------------------------

  private wait(s: number): Promise<void> {
    if (this.skipping || s <= 0) return Promise.resolve();
    return this.race(new Promise((r) => setTimeout(r, s * 1000)));
  }

  /** A promise that also ends the moment a skip starts. */
  private race(p: Promise<void>): Promise<void> {
    let wake!: () => void;
    const skip = new Promise<void>((r) => (wake = r));
    this.wakers.add(wake);
    return Promise.race([p, skip]).finally(() => this.wakers.delete(wake));
  }

  private fade(dir: "in" | "out", t: number): Promise<void> {
    const el = this.fadeEl;
    void el.offsetWidth;
    const t2 = this.skipping && dir === "in" ? 0 : t;
    el.style.transition = `opacity ${t2}s ease`;
    el.style.opacity = dir === "out" ? "1" : "0";
    return this.wait(t2);
  }

  // ---- every frame ------------------------------------------------------------------

  private frame(dt: number) {
    this.time += dt;
    // who's talking: the dialogue box names them; they gesture while the others listen
    const who = this.ctx.app.ui.querySelector(".dialog .who")?.firstChild?.textContent?.trim() ?? "";
    const speaker = who === "Pip" ? "pip" : (this.nameToActor.get(who) ?? "");
    for (const a of this.actors.values()) {
      const w = a.walk;
      if (w) {
        const d = w.to.clone().sub(a.obj.position).setY(0);
        const len = d.length();
        const step = w.speed * dt;
        if (len <= step || this.skipping) {
          a.obj.position.copy(w.to);
          a.walk = null;
          a.speed = 0;
          w.done();
        } else {
          a.obj.position.addScaledVector(d, step / len);
          a.yaw = Math.atan2(d.x, d.z);
          a.speed = w.speed;
        }
      } else a.speed = 0;
      a.obj.rotation.y = turnToward(a.obj.rotation.y, a.yaw, Math.min(1, dt * 7));
      const talk = !a.pinned && !a.walk && a.id === speaker && a.id !== "pip";
      const loop = a.pinned ? a.loop : talk ? "talk" : "idle";
      if (loop !== a.loop) {
        a.loop = loop;
        a.anim?.setLoop(loop);
      }
      a.anim?.update(dt, a.speed, a.speed > 5);
      a.sitK = Math.min(1, Math.max(0, a.sitK + (a.sitting ? dt : -dt) / 0.45));
      if (a.sitK > 0) this.seated(a);
    }
    for (const t of [...this.tweens]) {
      t.t = Math.min(t.dur, t.t + dt);
      const u = smooth(t.t / t.dur);
      const was = t.obj.position.clone();
      t.obj.position.lerpVectors(t.from, t.to, u);
      // a wagon's wheels turn with the ground it covers
      const rolled = was.distanceTo(t.obj.position) / 0.42;
      if (rolled > 0) t.obj.traverse((o) => o.name === "wheel" && (o.rotation.x -= rolled));
      t.obj.rotation.y = t.rotFrom + (t.rotTo - t.rotFrom) * u;
      if (t.t >= t.dur) {
        this.tweens.splice(this.tweens.indexOf(t), 1);
        t.done();
      }
    }
    this.applyShot(dt);
    // emotes ride above heads
    this.emotes = this.emotes.filter((e) => {
      const a = this.actors.get(e.actor);
      if (!a || this.time > e.until) {
        e.el.classList.add("out");
        setTimeout(() => e.el.remove(), 250);
        return false;
      }
      this.placeEmote(e);
      return true;
    });
    // hold to skip
    const held = this.holdAt === null || this.skipping ? 0 : (performance.now() - this.holdAt) / 1000;
    this.skipEl.style.setProperty("--p", String(Math.min(1, held / HOLD_TO_SKIP)));
  }

  /**
   * Sitting, on top of whatever the animator just posed: hips up (or down) to the seat and legs
   * out in front, so a sitter can still talk, laugh and sway. The animator sets every joint
   * fresh each frame, so this never builds up.
   */
  private seated(a: Live) {
    const k = smooth(a.sitK);
    const size = (a.anim as unknown as { size?: number } | null)?.size ?? 1;
    const lift = (a.seat - 0.36 * size) * k;
    const body = a.obj.getObjectByName("body");
    if (body) body.position.y += lift;
    for (const [n, out] of [["leg_l", 0.05], ["leg_r", -0.05]] as const) {
      const leg = a.obj.getObjectByName(n);
      if (!leg) continue;
      leg.position.y += lift;
      leg.quaternion.multiply(_sitQ.setFromEuler(_sitE.set(-1.35 * k, 0, out * k)));
    }
  }

  /** Just above the top of someone's head (the heads are big, and sitting moves them). */
  private headTop(a: Live): THREE.Vector3 {
    const head = a.obj.getObjectByName("head") ?? a.obj.getObjectByName("pip_head");
    if (!head) return a.obj.position.clone().add(new THREE.Vector3(0, 2.2, 0));
    if (a.headTop === undefined) {
      // measured once: how far the top of the head sits above its pivot
      const box = new THREE.Box3().setFromObject(head);
      a.headTop = box.max.y - head.getWorldPosition(new THREE.Vector3()).y;
    }
    return head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, a.headTop + 0.12, 0));
  }

  /** Skip once the key or chip is still held HOLD_TO_SKIP seconds later (the ring fills each frame). */
  private pressSkip() {
    const at = (this.holdAt = performance.now());
    setTimeout(() => {
      if (this.holdAt === at && this.playing) this.startSkip();
    }, HOLD_TO_SKIP * 1000);
  }

  private startSkip() {
    if (this.skipping) return;
    this.skipping = true;
    this.holdAt = null;
    this.fadeEl.style.transition = "opacity 0.25s ease";
    this.fadeEl.style.opacity = "1";
    for (const w of [...this.wakers]) w();
    for (const a of this.actors.values()) {
      if (a.walk) {
        a.obj.position.copy(a.walk.to);
        const d = a.walk.done;
        a.walk = null;
        d();
      }
    }
    for (const t of this.tweens.splice(0)) {
      t.obj.position.copy(t.to);
      t.done();
    }
    if (this.shot) this.shot.t = this.shot.dur;
    // click through the dialogue (choices take their first option) until the scene ends
    const iv = window.setInterval(() => {
      if (!this.playing || !this.skipping) return clearInterval(iv);
      if (this.ctx.app.ui.querySelector(".modal-back")) return;
      this.ctx.app.ui.querySelector<HTMLButtonElement>(".dialog .next button")?.click();
    }, 30);
  }

  private key(e: KeyboardEvent) {
    // the workbench (a personal rune) gets every key
    if (this.ctx.app.ui.querySelector(".modal-back")) return;
    const k = e.key.toLowerCase();
    if (k === "escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat && this.holdAt === null) this.pressSkip();
      return;
    }
    // dialogue keys and mute pass; the rest (HUD shortcuts, walking) wait for the scene to end
    if (k === "enter" || k === " " || k === "e" || k === "m") return;
    e.stopImmediatePropagation();
  }

  // ---- layer and restore ------------------------------------------------------------

  private buildLayer(ui: HTMLElement) {
    const layer = document.createElement("div");
    layer.className = "scene-layer";
    layer.innerHTML = `<div class="scene-bar top"></div><div class="scene-bar bottom"></div>
      <button class="scene-skip plate" title="Hold to skip (or hold Esc)"><span class="ring"></span>Hold to skip</button>`;
    // the dark between shots covers the dialogue too, so it lives outside the bars' layer
    this.fadeEl = document.createElement("div");
    this.fadeEl.className = "scene-fade";
    this.fadeEl.style.opacity = "0";
    ui.append(layer, this.fadeEl);
    this.layer = layer;
    this.skipEl = layer.querySelector(".scene-skip")!;
    const down = (e: Event) => {
      e.preventDefault();
      if (this.holdAt === null) this.pressSkip();
    };
    const up = () => (this.holdAt = null);
    this.skipEl.addEventListener("pointerdown", down);
    this.skipEl.addEventListener("pointerup", up);
    this.skipEl.addEventListener("pointerleave", up);
  }

  /** Everyone back where they belong; props gone; the camera follows the player again. */
  private restore() {
    const w = this.world;
    for (const a of this.actors.values()) {
      a.walk = null;
      a.anim?.setLoop("idle");
      a.anim?.update(0.016, 0);
      if (a.id === "player") {
        // the player stays where the scene left them, facing the same way
        const ahead = a.obj.position.clone().add(new THREE.Vector3(Math.sin(a.yaw), 0, Math.cos(a.yaw)));
        w.face(ahead);
        continue;
      }
      a.obj.position.copy(a.home.pos);
      a.obj.rotation.y = a.home.rot;
    }
    this.actors.clear();
    for (const o of this.props.values()) {
      o.removeFromParent();
      o.traverse((m) => (m as THREE.Mesh).geometry?.dispose());
    }
    this.props.clear();
    this.tweens = [];
    this.shot = null;
    if (w.stage) {
      w.stage.cam = null;
      w.stage.actors.clear();
    }
  }
}

/** "Bram: Hello" is Bram's line (a name with no model is a voice off-screen); anything else is Pip's. */
function line(s: string): LifeLine {
  const m = /^([A-Z][a-z]+(?: [A-Z][a-z]+)?): ([\s\S]*)$/.exec(s);
  if (m) return { who: m[1], text: m[2] };
  return { who: "Pip", text: s };
}
