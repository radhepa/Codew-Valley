import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/figtree/800.css";
import "@fontsource/pixelify-sans/400.css";
import "@fontsource/pixelify-sans/500.css";
import "@fontsource/pixelify-sans/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./style.css";
import { PythonRunner } from "./python/runner.ts";
import { World } from "./game/world.ts";
import { App } from "./ui/app.ts";
import { store } from "./state.ts";
import { BUILDINGS } from "./content/index.ts";
import { settings as soundSettings, soundLog } from "./game/audio.ts";
import { music } from "./game/music.ts";
import { soundscape } from "./game/soundscape.ts";
import { allItems, bag } from "./life/items.ts";
import { clock } from "./life/clock.ts";
import { sceneDev } from "./scenes/index.ts";

// Python starts loading straight away (in its worker) while the world builds.
const runner = new PythonRunner();
const app = new App(runner);

const world = new World(document.getElementById("scene") as HTMLCanvasElement, {
  gain: (k, x, y) => app.gain(k, x, y),
  prompt: (l, x, y) => app.prompt(l, x, y),
  rune: () => app.openRune(),
  pip: () => app.talkPip(),
  villager: (id) => app.talkVillager(id),
});

await world.build(app.progress());
app.attach(world);
world.start();
app.titleScreen(() => {
  if (!store.data.introSeen) void app.intro();
  else app.resume();
});

// Dev hook for testing from the console or the preview browser.
declare global {
  interface Window {
    __pv: unknown;
  }
}
window.__pv = {
  world,
  app,
  store,
  give(wood = 20, stone = 20) {
    store.add("wood", wood);
    store.add("stone", stone);
  },
  /** Mark the first n parts of a building solved (and every earlier building) and show them. */
  stage(n: number, id = app.building.id) {
    const i = BUILDINGS.findIndex((b) => b.id === id);
    store.data.done = [...BUILDINGS.slice(0, i).flatMap((b) => b.challenges.map((c) => c.id)), ...BUILDINGS[i].challenges.slice(0, n).map((c) => c.id)];
    store.changed();
    BUILDINGS.forEach((b, j) => world.showStages(b.id, j < i ? b.challenges.length : j === i ? n : 0));
  },
  build(n: number, id = app.building.id) {
    world.buildStage(id, n);
  },
  /** Animations (game/anim.ts): anim("chop"), anim("wave", "tavern"), anim("happy", "all"); "big" celebrates a finished building. */
  anim: (name: Parameters<World["playAnim"]>[0], who = "player", big = false) => world.playAnim(name, who, big),
  /** Every character in a row in front of the player, to try the animations on: then anim("talk", "smith"). */
  lineup: () => world.animLineup(),
  /** What the sound is doing: music scene and piece, nature levels, the recent sound log. */
  audio: () => ({ ...soundscape.state, musicScene: music.scene, playing: music.playing, settings: soundSettings, log: soundLog.slice(-25) }),
  /** Force the weather ("clear", "drizzle", "rain", "storm", "rainbow"); time(0.5) is noon, hold = stop the clock. */
  weather: (kind: Parameters<World["weather"]["force"]>[0], now = false) => world.weather.force(kind, now),
  time: (tod: number, hold = false) => (world.weather.setTime(tod), (world.weather.hold = hold)),
  /** Village life (src/life): item("trout", 3) puts it in the bag; items() lists every item id; day() starts the next day. */
  item: (id: string, n = 1) => bag.add(id, n),
  items: () => allItems().map((d) => d.id),
  day: () => clock.advance(),
  /** Heart events (src/scenes): scene("bram-ledger") plays one now; hearts("innkeeper", 6); flags() (flags({}) clears); scenes() lists them. */
  scene: (id: string) => sceneDev.scene(id),
  hearts: (id: string, n: number) => sceneDev.hearts(id, n),
  flags: (reset?: object) => sceneDev.flags(reset),
  scenes: () => sceneDev.scenes(),
};
