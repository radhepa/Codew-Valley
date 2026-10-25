import type { LifeCtx, LifeSystem } from "./context.ts";
import { clock } from "./clock.ts";
// Farming was dropped (2026-10-24); its crops stay as ingredients for cooking.
import "./farming/items.ts";
import { FISHING } from "./fishing/index.ts";
import { COOKING } from "./cooking/index.ts";
import { REVIEW } from "./review/index.ts";
import { SCENES_SYSTEM } from "../scenes/index.ts";
import "./life.css";

// Village life (LIFE.md): fishing, cooking and Wren's daily practice, each a system in its own folder.
// The game imports this module before the world is built (so systems can reserve ground
// and register animation clips and hand tools at import time), then calls installLife once
// the world and the HUD exist.

// Heart-event scenes (src/scenes) hook in the same way: they need the world, the HUD and say().
export const SYSTEMS: LifeSystem[] = [FISHING, COOKING, REVIEW, SCENES_SYSTEM];

export function installLife(ctx: LifeCtx) {
  ctx.world.onFrame(() => clock.tick());
  for (const s of SYSTEMS) {
    try {
      s.install(ctx);
    } catch (e) {
      // one broken system must not take the whole village down
      console.error(`Village life: ${s.id} failed to start`, e);
    }
  }
}
