import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/fredoka/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "./style.css";
import { PythonRunner } from "./python/runner.ts";
import { World } from "./game/world.ts";
import { App } from "./ui/app.ts";
import { store } from "./state.ts";
import { BUILDINGS } from "./content/index.ts";

// Python starts loading straight away (in its worker) while the world builds.
const runner = new PythonRunner();
const app = new App(runner);

const world = new World(document.getElementById("scene") as HTMLCanvasElement, {
  gain: (k, x, y) => app.gain(k, x, y),
  prompt: (l, x, y) => app.prompt(l, x, y),
  rune: () => app.openRune(),
  pip: () => app.talkPip(),
  bram: () => app.talkBram(),
});

await world.build(app.stageCount());
app.attach(world);
world.start();
app.titleScreen(() => {
  if (!store.data.introSeen) void app.intro();
  else world.paused = false;
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
  /** Mark the first n tavern parts solved and show them. */
  stage(n: number) {
    store.data.done = BUILDINGS[0].challenges.slice(0, n).map((c) => c.id);
    store.changed();
    world.showStages(n);
  },
  build(n: number) {
    world.buildStage(n);
  },
};
