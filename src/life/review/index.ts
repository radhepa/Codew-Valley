import * as THREE from "three";
import { store } from "../../state.ts";
import { siteInfo, reserveArea } from "../../game/world.ts";
import { model } from "../../game/models.ts";
import { play, pluck, chime } from "../../game/audio.ts";
import { esc, el } from "../../ui/md.ts";
import type { LifeApp, LifeCtx, LifeSystem } from "../context.ts";
import { bag, item } from "../items.ts";
import { itemIcon } from "../bagbook.ts";
import { clock } from "../clock.ts";
import { makeRng, seedOf } from "./rng.ts";
import { afterHints, counted, rollBasket } from "./basket.ts";
import { pickTemplate, reviewSave, syncLearned, learned, type Daily } from "./memory.ts";
import { drawQuestion, openQuestion, questionById, TOPIC_NAME } from "./pool.ts";
import type { BuildingId } from "./build.ts";
import type { Question } from "./question.ts";
import { WREN_LINES, pickLine } from "./lines.ts";
import { reviewIcon, sharpnessSheet } from "./sharpness.ts";
import "./review.css";

// Wren's daily practice (README.md): once the mill stands, a slate by Wren's field holds one
// fresh Python question each valley day. Solving it fills a basket of crops; extra practice
// afterwards has no reward. The Sharpness page (K) shows what's fresh and what's wilting.

// The slate stands on the open ground in front of the mill, between Wren and her field, facing the path.
const MILL = siteInfo("mill");
const WREN_AT = MILL?.villager ?? new THREE.Vector3(-6.4, 0, -15);
const SLATE_AT = WREN_AT.clone().add(new THREE.Vector3(-2.3, 0, 1.1));
const BASKET_AT = SLATE_AT.clone().add(new THREE.Vector3(-0.78, 0, 0.12));
reserveArea({ x: SLATE_AT.x + 0.35, z: SLATE_AT.z, hw: 1.0, hd: 0.7 });

const unlocked = (app: LifeApp) => app.finished("mill");

/** Today's question, chosen once per valley day (the same day always shows the same one). */
function today(): Daily | null {
  syncLearned();
  const s = reviewSave();
  const day = clock.day;
  if (s.daily?.day === day && questionById(s.daily.template, s.daily.seed)) return s.daily;
  const t = pickTemplate({ rng: makeRng(seedOf(s.salt, day, "daily")), avoid: s.recent });
  if (!t) return null;
  const mixed = t.topics.length > 1;
  s.daily = { day, template: t.id, seed: seedOf(s.salt, day, "question") & 0x7fffffff, done: false, basket: rollBasket(makeRng(seedOf(s.salt, day, "basket")), t.difficulty, mixed) };
  store.changed();
  return s.daily;
}

function skyNote() {
  const day = clock.day;
  if (clock.raining) return pickLine(WREN_LINES.sky.rain, day);
  const t = clock.timeOfDay;
  if (t < 0.22 || t > 0.85) return pickLine(WREN_LINES.sky.night, day);
  if (t < 0.4) return pickLine(WREN_LINES.sky.morning, day);
  if (t > 0.7) return pickLine(WREN_LINES.sky.evening, day);
  return pickLine(WREN_LINES.sky.clear, day);
}

// ---- the slate and the basket in the world ------------------------------------------------

/** Chalk writing for the slate: today's question, a tick when it's done, nothing before the mill. */
function drawSlate(cv: HTMLCanvasElement, state: { title: string; topic: string; done: boolean } | null) {
  const g = cv.getContext("2d")!;
  const W = 512; // drawn at 512 × 384, the canvas is twice that for crisp chalk
  const H = 384;
  g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  g.fillStyle = "#33393a";
  g.fillRect(0, 0, W, H);
  // old smudges of wiped chalk
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(230,228,215,${0.025 + rnd() * 0.03})`;
    g.beginPath();
    g.ellipse(rnd() * W, rnd() * H, 30 + rnd() * 80, 8 + rnd() * 20, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  if (!state) return;
  const chalk = (text: string, x: number, y: number, size: number, alpha = 0.92, font = "Fraunces Variable, Georgia, serif") => {
    g.font = `600 ${size}px ${font}`;
    g.textBaseline = "alphabetic";
    // a few offset passes make a dry, grainy chalk line
    for (let k = 0; k < 4; k++) {
      g.fillStyle = `rgba(240,236,222,${alpha * (k ? 0.22 : 0.8)})`;
      g.fillText(text, x + (rnd() - 0.5) * 2.2, y + (rnd() - 0.5) * 2.2);
    }
  };
  const fit = (text: string, max: number, size: number) => {
    g.font = `600 ${size}px Fraunces Variable, Georgia, serif`;
    while (g.measureText(text).width > max && size > 18) g.font = `600 ${--size}px Fraunces Variable, Georgia, serif`;
    return size;
  };
  chalk(state.done ? "Done today!" : "Today's question", 34, 70, 34, 0.7);
  g.strokeStyle = "rgba(240,236,222,.45)";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(34, 86);
  g.quadraticCurveTo(W / 2, 80, W - 40, 88);
  g.stroke();
  chalk(state.title, 34, 168, fit(state.title, W - 70, 52));
  chalk(state.topic, 34, 226, fit(state.topic, W - 70, 34), 0.7, "JetBrains Mono, monospace");
  if (state.done) {
    g.lineWidth = 7;
    g.strokeStyle = "rgba(196,232,190,.85)";
    g.beginPath();
    g.moveTo(W - 120, 300);
    g.lineTo(W - 92, 330);
    g.lineTo(W - 40, 262);
    g.stroke();
    chalk("Tomorrow, another!", 34, 322, 30, 0.6);
  } else {
    // a little wheat sheaf doodle and an arrow to the basket
    g.lineWidth = 3;
    g.strokeStyle = "rgba(240,236,222,.6)";
    g.beginPath();
    g.moveTo(W - 70, 330);
    g.lineTo(W - 70, 270);
    for (let i = 0; i < 4; i++) {
      g.moveTo(W - 70, 285 + i * 11);
      g.lineTo(W - 82, 276 + i * 11);
      g.moveTo(W - 70, 285 + i * 11);
      g.lineTo(W - 58, 276 + i * 11);
    }
    g.stroke();
    chalk("Solve it, fill the basket", 34, 322, 28, 0.6);
  }
}

/** Shapes to use while the Blender kit (review_kit.glb) isn't there. */
function fallbackKit(): Record<string, THREE.Object3D> {
  const wood = new THREE.MeshStandardMaterial({ color: "#8a6a4a", roughness: 0.9 });
  const straw = new THREE.MeshStandardMaterial({ color: "#c49a5c", roughness: 0.95 });
  const slate = new THREE.Group();
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.18, 0.05), wood);
    leg.position.set(s * 0.3, 0.57, 0.04);
    leg.rotation.x = -0.12;
    slate.add(leg);
  }
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.05), wood);
  back.position.set(0, 0.53, -0.2);
  back.rotation.x = 0.3;
  slate.add(back);
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.54, 0.04), wood);
  board.position.set(0, 0.86, 0.08);
  board.rotation.x = -0.12;
  slate.add(board);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshStandardMaterial({ color: "#3a4142", roughness: 0.95, name: "review_chalk" }));
  face.name = "slate_face";
  face.position.set(0, 0.86, 0.103);
  face.rotation.x = -0.12;
  slate.add(face);
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.08), wood);
  ledge.position.set(0, 0.58, 0.13);
  slate.add(ledge);
  const basket = new THREE.Group();
  const pts = [0, 0.05, 0.1, 0.16, 0.22, 0.25].map((y, i) => new THREE.Vector2(0.17 + i * 0.016, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 22), straw);
  (body.material as THREE.Material).side = THREE.DoubleSide;
  basket.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 6, 24, Math.PI), wood);
  handle.position.y = 0.25;
  basket.add(handle);
  const kit: Record<string, THREE.Object3D> = { review_slate: slate, review_basket: basket };
  return kit;
}

function cropMesh(kit: Record<string, THREE.Object3D>, id: string) {
  const node = kit[`crop_${id}`];
  if (node) return node.clone(true);
  const c = item(id)?.color ?? "#c9a656";
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 1), new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
  m.position.y = 0.07;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

interface Flight {
  obj: THREE.Object3D;
  from: THREE.Vector3;
  t: number;
  dur: number;
  delay: number;
  note: number;
  done?: boolean;
}

// D major pentatonic, rising as each crop flies into the bag
const NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99, 880, 987.77, 1174.66];

// ---- the system -----------------------------------------------------------------------------

let open: (() => void) | null = null;
let openExtra: ((lean?: BuildingId[]) => void) | null = null;

export const REVIEW: LifeSystem = {
  id: "review",
  install(ctx: LifeCtx) {
    const { world, app } = ctx;
    let kit: Record<string, THREE.Object3D> = {};
    let slate: THREE.Object3D | null = null;
    let basket: THREE.Object3D | null = null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 768;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const dot = document.createElement("canvas");
    dot.width = dot.height = 64;
    const dg = dot.getContext("2d")!;
    const grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.4, "rgba(255,255,255,.45)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    dg.fillStyle = grad;
    dg.fillRect(0, 0, 64, 64);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(dot), color: "#f6edd2", transparent: true, opacity: 0, depthWrite: false }));
    glow.scale.setScalar(0.16);
    const flights: Flight[] = [];
    let wobble = 0;

    const redraw = () => {
      const d = unlocked(app) ? today() : null;
      const q = d && questionById(d.template, d.seed);
      drawSlate(canvas, q ? { title: q.made.title, topic: q.made.topic, done: d!.done } : null);
      tex.needsUpdate = true;
      if (slate) slate.visible = unlocked(app);
      if (basket) basket.visible = unlocked(app);
    };

    void (async () => {
      try {
        const root = await model("review_kit");
        for (const c of [...root.children]) kit[c.name] = c;
        // the kit's slate face has glTF UVs (v up), like the loader's own textures
        tex.flipY = false;
      } catch {
        kit = {};
      }
      if (!kit.review_slate) kit = { ...fallbackKit(), ...kit };
      slate = kit.review_slate.clone(true);
      slate.position.copy(SLATE_AT);
      slate.rotation.y = 0.18; // turned a little toward the path
      slate.traverse((o) => {
        if (o.name === "slate_face" && (o as THREE.Mesh).isMesh) {
          const m = ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).clone();
          m.map = tex;
          m.color.set("#ffffff");
          m.roughness = 0.95;
          (o as THREE.Mesh).material = m;
        }
      });
      slate.scale.setScalar(1.2); // readable from the follow camera
      world.addProp(slate, 0.45);
      basket = kit.review_basket.clone(true);
      basket.position.copy(BASKET_AT);
      basket.rotation.y = -0.3;
      basket.scale.setScalar(1.2);
      world.addProp(basket, 0.3);
      glow.position.copy(SLATE_AT).add(new THREE.Vector3(0, 1.6, 0));
      world.scene.add(glow);
      redraw();
    })();

    // the slate: today's question, or extra practice once it's done
    world.addSpot({
      id: "review-slate",
      pos: SLATE_AT,
      radius: 1.25,
      height: 1.5,
      label: () => {
        if (!unlocked(app)) return null;
        return reviewSave().daily?.day === clock.day && reviewSave().daily?.done ? "Practise at Wren's slate" : "Wren's question";
      },
      use: () => (reviewSave().daily?.day === clock.day && reviewSave().daily?.done ? offerExtra() : greet()),
    });

    const hud = app.hudButton({ icon: reviewIcon("sprout"), title: "Sharpness", key: "k", onClick: () => openSharpness() });
    const sync = () => {
      hud.hidden = !unlocked(app);
      redraw();
    };
    sync();
    clock.onDawn(() => {
      sync();
      if (!unlocked(app)) return;
      app.toast("Wren has chalked a new question on the slate by the mill.");
      chalkDust(10);
    });
    // the mill can be finished at any moment; a light poll keeps the HUD and the slate honest
    let wasOpen = unlocked(app);
    let poll = 0;
    world.onFrame((dt, time) => {
      poll += dt;
      if (poll > 1) {
        poll = 0;
        const now = unlocked(app);
        if (now !== wasOpen) {
          wasOpen = now;
          sync();
        }
      }
      // a soft chalk glint over the slate while today's question waits
      const waiting = wasOpen && !(reviewSave().daily?.day === clock.day && reviewSave().daily?.done);
      const mat = glow.material as THREE.SpriteMaterial;
      mat.opacity += ((waiting ? 0.55 + Math.sin(time * 2.2) * 0.25 : 0) - mat.opacity) * Math.min(1, dt * 3);
      glow.position.y = SLATE_AT.y + 1.6 + Math.sin(time * 1.6) * 0.04;
      // the basket bounces when it fills
      if (basket && wobble > 0) {
        wobble = Math.max(0, wobble - dt);
        const k = wobble / 0.9;
        const w = Math.sin(wobble * 22) * k;
        basket.scale.set(1.2 * (1 + w * 0.07), 1.2 * (1 - w * 0.09), 1.2 * (1 + w * 0.07));
      }
      for (const f of flights) {
        if (f.done) continue;
        if (f.delay > 0) {
          f.delay -= dt;
          if (f.delay <= 0) {
            f.obj.visible = true;
            pluck(NOTES[f.note % NOTES.length], 0, 0.16);
          }
          continue;
        }
        f.t += dt / f.dur;
        const to = world.playerPos.add(new THREE.Vector3(0, 1.05, 0));
        const t = Math.min(1, f.t);
        const e = t < 0.35 ? t / 0.35 : 1;
        // up out of the basket, a hang in the air, then into the founder's arms
        const up = f.from.clone().add(new THREE.Vector3(0, 0.75 * Math.sin(Math.min(1, e) * Math.PI * 0.5), 0));
        const k = t < 0.35 ? 0 : (t - 0.35) / 0.65;
        const s = k * k * (3 - 2 * k);
        f.obj.position.lerpVectors(up, to, s).add(new THREE.Vector3(0, Math.sin(s * Math.PI) * 0.5, 0));
        f.obj.rotation.y += dt * 4;
        f.obj.scale.setScalar(2.4 * (1 - s * 0.7));
        if (t >= 1) {
          f.done = true;
          world.scene.remove(f.obj);
          world.fx.sparkles(to, 3, 0.4);
          play("leather", { vol: 0.18, rate: 1.3, spread: 0.1 });
        }
      }
      if (flights.length && flights.every((f) => f.done)) flights.length = 0;
    });

    function chalkDust(n: number) {
      world.fx.sparkles(SLATE_AT.clone().add(new THREE.Vector3(0, 0.95, 0.15)), n, 0.5);
      play("tick", { vol: 0.25, rate: 0.7 });
    }

    // ---- the daily question -----------------------------------------------------------------

    function greet() {
      const d = today();
      if (!d) return;
      world.face(WREN_AT);
      const q = questionById(d.template, d.seed)!;
      const s = reviewSave();
      const first = !store.data.drafts[`review-day-${d.day}`];
      const line = first ? pickLine(WREN_LINES.greet, d.day + s.salt).replace("{sky}", skyNote()) : pickLine(WREN_LINES.again, d.day);
      void app.say([{ who: "Wren", text: line }], [
        { label: "Read the slate", cls: "gold", action: () => openDaily(q, d) },
        { label: "Later", cls: "quiet", action: () => {} },
      ]);
    }

    function openDaily(q: Question, d: Daily) {
      chalkDust(6);
      openQuestion(app, q, (r) => {
        if (!r.solved) {
          if (r.fails >= 3) app.toast(pickLine(WREN_LINES.encourage, d.day + r.fails));
          return;
        }
        d.done = true;
        reviewSave().answered++;
        store.changed();
        redraw();
        giveBasket(q, d, r.hints);
      }, {
        id: `review-day-${d.day}`,
        eyebrow: "Wren's question",
        action: `${reviewIcon("basket")} Take the basket`,
        intro: [`Wren: ${pickLine(WREN_LINES.greet, d.day + reviewSave().salt).replace("{sky}", skyNote())}`],
      });
    }

    function giveBasket(q: Question, d: Daily, hints: number) {
      const crops = afterHints(d.basket, hints);
      for (const [id, n] of counted(crops)) bag.add(id, n);
      world.face(BASKET_AT);
      world.playAnim("pickup");
      world.playAnim("happy", "mill");
      wobble = 0.9;
      play("leather", { vol: 0.5 });
      play("wood", { vol: 0.3, rate: 1.4, delay: 0.05 });
      world.fx.sparkles(BASKET_AT.clone().setY(0.35), 8, 0.6);
      // every crop hops out of the basket into the founder's arms, each a note higher
      crops.forEach((id, i) => {
        const obj = cropMesh(kit, id);
        obj.visible = false;
        const from = BASKET_AT.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3, (Math.random() - 0.5) * 0.2));
        obj.position.copy(from);
        world.scene.add(obj);
        flights.push({ obj, from, t: 0, dur: 0.95, delay: 0.35 + i * 0.16, note: i });
      });
      const end = 0.35 + crops.length * 0.16 + 0.95;
      chime(880, end, 2, 0.05);
      chime(1174.66, end + 0.12, 2, 0.04);
      basketCard(crops, hints, d.basket.length - crops.length, q);
      setTimeout(() => {
        const best = item(crops[0])?.name.toLowerCase() ?? "wheat";
        const lines = [pickLine(WREN_LINES.basket, d.day).replace("{n}", String(crops.length)).replace("{best}", best)];
        if (crops.length < d.basket.length) lines.push(pickLine(WREN_LINES.lighter, d.day));
        if (q.mixed || q.difficulty === 3) lines.push(pickLine(WREN_LINES.hard, d.day));
        lines.push(pickLine(WREN_LINES.tomorrow, d.day));
        void app.say(lines.map((text) => ({ who: "Wren", text })));
      }, Math.max(end + 0.8, 3.4) * 1000);
    }

    /** The basket card: every crop pops in, then it tucks itself away. */
    function basketCard(crops: string[], hints: number, lost: number, q: Question) {
      app.ui.querySelector(".basket-card")?.remove();
      const card = el(`<div class="plate basket-card" role="status">
        <div class="basket-head">${reviewIcon("basket", "basket-ico")}<div><div class="eyebrow">Wren's basket</div><b>${esc(q.made.title)}</b></div></div>
        <div class="basket-row"></div>
        ${lost ? `<div class="basket-note">${hints} ${hints === 1 ? "hint" : "hints"}, so ${lost} ${lost === 1 ? "crop" : "crops"} stayed in the field.</div>` : ""}
      </div>`);
      const row = card.querySelector<HTMLElement>(".basket-row")!;
      counted(crops).forEach(([id, n], i) => {
        const def = item(id);
        if (!def) return;
        const slot = el(`<div class="basket-slot ${id === "pumpkin" || id === "strawberry" ? "rare" : ""}" title="${esc(def.name)}">${itemIcon(def)}<span class="n">${n}</span></div>`);
        slot.style.animationDelay = `${0.35 + i * 0.16}s`;
        row.append(slot);
      });
      app.ui.append(card);
      const close = () => {
        card.classList.add("away");
        setTimeout(() => card.remove(), 450);
      };
      card.addEventListener("click", close);
      setTimeout(close, 5200);
    }

    // ---- extra practice (no reward) ---------------------------------------------------------

    function offerExtra() {
      world.face(WREN_AT);
      void app.say([{ who: "Wren", text: pickLine(WREN_LINES.extra, clock.day + reviewSave().extra.n) }], [
        { label: "Another one", cls: "gold", action: () => extra() },
        { label: "Not now", cls: "quiet", action: () => {} },
      ]);
    }

    function extra(lean?: BuildingId[]) {
      const s = reviewSave();
      if (s.extra.day !== clock.day) s.extra = { day: clock.day, n: 0 };
      s.extra.n++;
      store.changed();
      const q = drawQuestion({ lean, rng: makeRng(seedOf(s.salt, clock.day, "extra", s.extra.n)) });
      if (!q) return;
      openQuestion(app, q, (r) => {
        if (!r.solved) return;
        pluck(587.33, 0, 0.18);
        pluck(880, 0.1, 0.16);
        app.toast(`**Wren:** ${pickLine(WREN_LINES.extraDone, clock.day + s.extra.n)}`);
      }, { id: `review-x-${clock.day}-${s.extra.n}`, eyebrow: "Practice", action: "Well done" });
    }

    function openSharpness() {
      if (!unlocked(app)) return;
      app.openSheet(
        sharpnessSheet({
          close: () => app.closeSheet(),
          practise: (lean) => {
            app.closeSheet();
            const d = today();
            // today's question comes first; after that, practice leans on what's wilting
            if (d && !d.done) greet();
            else extra(lean.length ? lean : undefined);
          },
          today: () => {
            if (!unlocked(app)) return null;
            const d = reviewSave().daily;
            return d?.day === clock.day && d.done ? "done" : "waiting";
          },
        }),
      );
    }

    open = () => {
      const d = today();
      if (d) openDaily(questionById(d.template, d.seed)!, d);
    };
    openExtra = extra;
  },
};

/**
 * For the villager chat (src/ui/app.ts): Wren offers today's question, or practice once it's
 * done. Null for anyone else, or before the mill stands.
 */
export function wrenOffer(personId: string): { label: string; cls: string; action: () => void } | null {
  if (personId !== "miller" || !open || !learned().includes("mill")) return null;
  const d = reviewSave().daily;
  const done = d?.day === clock.day && d.done;
  return done ? { label: "A practice question", cls: "line", action: () => openExtra?.() } : { label: "Today's question", cls: "gold", action: () => open?.() };
}

export { TOPIC_NAME };
