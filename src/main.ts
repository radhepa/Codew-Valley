import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "@fontsource/figtree/800.css";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
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
  /** What the sound is doing: music scene and piece, nature levels, the recent sound log. */
  audio: () => ({ ...soundscape.state, musicScene: music.scene, playing: music.playing, settings: soundSettings, log: soundLog.slice(-25) }),
};
