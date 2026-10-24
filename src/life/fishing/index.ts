import * as THREE from "three";
import type { LifeCtx, LifeSystem } from "../context.ts";
import { POND, groundHeight } from "../../game/world.ts";
import { bag } from "../items.ts";
import { store } from "../../state.ts";
import "./items.ts";
import "./anims.ts";
import "./fishing.css";
import { FishingTrip, fishSave, type FishingSpot } from "./session.ts";
import { FISH_ICON, journalSheet } from "./journal.ts";
import { FORECAST_RUNE } from "./runes.ts";

// Fishing: the pond and the pier, Gran's rod from Marlo, fish by time and weather (LIFE.md).
// Opens when the dock is finished. Two places to fish: the pier head (the founder walks out
// along the deck) and the pond's east shore.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const DECK = 0.6;

// The dock stands at (13, 3) and its pier runs south over the pond to the pier head (z 11.4 to 13).
const SPOTS: FishingSpot[] = [
  {
    id: "pier",
    prompt: V(13, 0, 4.55),
    path: [V(13, 0, 4.75), V(13, DECK, 5.5), V(13, DECK, 11.2), V(14.15, DECK, 11.7)],
    water: V(16.15, 0, 10.25),
  },
  {
    id: "shore",
    prompt: V(17.7, 0, 7.6),
    path: [V(17.6, groundHeight(17.6, 7.65), 7.65)],
    water: V(15.45, 0, 8.45),
  },
];

let trip: FishingTrip | null = null;

export const FISHING: LifeSystem = {
  id: "fishing",
  install(ctx: LifeCtx) {
    const { world, app } = ctx;
    trip = new FishingTrip(ctx);
    const open = () => app.finished("dock");
    const hasRod = () => fishSave().rod;
    const unlocked = () => open() && hasRod();

    // the journal (J), shown once the rod is yours
    const openJournal = () => {
      if (!hasRod()) return;
      const s = journalSheet(() => app.closeSheet(), trip?.active ? trip.spotId : null, () => {
        app.closeSheet();
        app.openRune(FORECAST_RUNE, () => {
          app.toast("Gran's water diary is yours: the fishing note now says what's biting.");
          trip?.refresh();
        });
      });
      app.openSheet(s);
    };
    const btn = app.hudButton({ icon: FISH_ICON, title: "Fish journal", key: "j", onClick: openJournal });
    const sync = () => (btn.hidden = !unlocked());
    sync();
    store.on(sync);

    // an invisible post at each spot, so a click (or a trackpad tap) can start a trip too
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });
    for (const s of SPOTS) {
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.8, 10), hitMat);
      hit.position.set(s.prompt.x, 0.9, s.prompt.z);
      world.scene.add(hit);
      world.addSpot({
        id: `fishing-${s.id}`,
        pos: s.prompt,
        radius: 0.7,
        obj: hit,
        height: s.id === "pier" ? 1.9 : 1.6,
        label: () => (unlocked() && !trip!.active ? (s.id === "pier" ? "Fish from the pier head" : "Fish from the shore") : null),
        use: () => trip!.start(s),
      });
    }

    // Marlo gives Gran's rod in the dock's finale; the first time you come down to the dock after
    // it, he shows you how to use it (and a save from before fishing existed gets the rod here)
    world.onFrame(() => {
      if (hasRod() || !open() || world.paused || world.hold) return;
      if (world.playerPos.distanceTo(V(14, 0, 4.4)) > 5) return;
      giveRod(ctx);
    });
    if (unlocked()) trip.warm();

    // fish rising here and there on the pond, once there's a dock to fish from
    let next = 3;
    world.onFrame((dt) => {
      if (!open()) return;
      next -= dt;
      if (next > 0) return;
      next = 2.5 + Math.random() * 6;
      for (let tries = 0; tries < 6; tries++) {
        const a = Math.random() * Math.PI * 2;
        const r = 0.8 + Math.random() * (POND.r - 1.4);
        const x = POND.x + Math.cos(a) * r;
        const z = POND.z + Math.sin(a) * r;
        if (Math.abs(x - 13) < 1.3 && z > 5) continue; // not under the pier or the boat
        if (x < 12.2 && z > 6.5 && z < 10.8) continue;
        trip!.rise(V(x, 0, z));
        break;
      }
    });

    if (import.meta.env.DEV) (window as unknown as { __fish: unknown }).__fish = { trip, spots: SPOTS, save: fishSave, giveRod: () => giveRod(ctx) };
  },
};

function giveRod(ctx: LifeCtx) {
  const { app } = ctx;
  // the rod is yours before a word is said, so closing the dialogue early can't lose it
  const s = fishSave();
  s.rod = true;
  if (!bag.has("grans_rod")) bag.add("grans_rod");
  store.changed();
  trip?.warm();
  void app.say([
    { who: "Marlo", text: "...Gran's rod suits you. Thought it might. Come, I'll show you the water." },
    { who: "Marlo", text: "Pier head's the deep water. The east shore's kinder, and the carp like it. Cast, then watch the float." },
    { who: "Marlo", text: "When it goes right under, strike. Reel while the fish rests. When it runs, let it. ...That's all fishing is. Patience, in bits." },
    { who: "Pip", text: "And Pip will keep a **fish journal** for you! Every fish you meet gets a page. Press **J** to see it. Pip loves a list." },
  ]).then(() => app.gained("grans_rod"));
}
