import type { LifeCtx, LifeSystem } from "./context.ts";
import { clock } from "./clock.ts";
import { FARMING } from "./farming/index.ts";
import { FISHING } from "./fishing/index.ts";
import { COOKING } from "./cooking/index.ts";
import "./life.css";

// Village life (LIFE.md): farming, fishing and cooking, each a system in its own folder.
// The game imports this module before the world is built (so systems can reserve ground
// and register animation clips and hand tools at import time), then calls installLife once
// the world and the HUD exist.

export const SYSTEMS: LifeSystem[] = [FARMING, FISHING, COOKING];

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
