# Village life: farming, fishing, cooking

Phase 4 of `ROADMAP.md`, started early. Three cozy systems, each in its own folder
under `src/life/`, built on a shared foundation. They should feel like part of
the same game as the buildings: the field-journal UI, the painterly
Legends-Arceus look, Animal Crossing softness, gentle sound, and Python woven
in without ever blocking play.

## The loop

Farm → mill → cook → give.

- **Farming** grows crops by the mill (wheat, vegetables, fruit, herbs).
- **Fishing** pulls fish (and the odd old coin) out of the pond.
- **Cooking** turns crops and fish into dishes at Bram's hearth, and bread and
  tarts in Hazel's oven once the bakery stands. Wheat becomes flour at Wren's
  mill.
- **Gifts** give it all a purpose: one gift a day per villager, matched to
  their taste (`src/life/gifts.ts`), raising friendship. Dishes are the best
  gifts. (Selling at the market comes later, with the market's chapter of
  village life.)

No stamina, no money, nothing that punishes. Rewards are friendship, recipes
learned, a fuller journal, and the world visibly changing (rows of crops, fish
on the drying rack, smoke from the tavern chimney).

## When each opens

| System | Opens when | Host | Villager |
|---|---|---|---|
| Cooking | the tavern is finished (Bram's hearth) | tavern; baking at the bakery once it's finished | Bram; Hazel for baking |
| Farming | the mill is finished (its field) | the land beside the mill | Wren |
| Fishing | the dock is finished | the pond and the pier | Marlo (gives the rod) |

Use `ctx.app.finished("mill")` etc. Before that, nothing of the system shows
(or only a hint, like a dusty pot by the tavern).

## Python: village runes

Each system has one or more **village runes**: optional small Python tasks
(`LifeRune` in `src/life/context.ts`) that switch on a helpful automation.
They open the normal workbench (`ctx.app.openRune(rune, onSolved)`), use the
same format as challenges, and `npm test -- life` checks them like any
challenge (CHALLENGES.md applies in full). A rune may only use Python taught by
the building in its `requires` (SYLLABUS.md), and should feel like that
building's lesson put to work:

- Farming (`requires: "mill"`, conditionals): a field rune that decides each
  morning which plots to water from the weather and the soil; solved, dry plots
  water themselves at dawn.
- Fishing (`requires: "dock"`, `while` loops): e.g. a line rune that keeps
  casting until a condition, or a tide table that tells you what's biting.
- Cooking (`requires: "tavern"` for a first one; later ones with the bakery
  (`for` loops) or the forge (functions)): e.g. a recipe that scales with the
  number of guests, or a function that cooks a batch.

The system decides what the reward is; it must be a nice-to-have, never
required. A rune's `topic`, three hints, `wrong` answers and re-run checks all
follow CHALLENGES.md. Mark progress with `runeSolved(id)` (`src/life/save.ts`).

## The foundation (already built)

- `src/life/items.ts`: `defineItems`, `item(id)`, and the **bag**
  (`bag.add/take/count/has/contents`), saved in `store.data.items`. The bag
  sheet opens with **B**. Each system's items live in its own `items.ts`; the
  ids there are the contract between systems (cooking's recipes name
  "potato", gifts match tags).
- `src/life/gifts.ts`: tastes for all 13 villagers by tag or id, one gift a
  day, the gift picker after a chat. Loved tags to cover with items: Pip
  stew/warm, Bram garlic/cider/hearty, Wren grain/wheat, Marlo rare/old, Sable
  honey/shiny, Hazel grain/dairy, Ingrid hearty/spicy, Odo tea/old, Mirela
  herb/flower/chamomile, Thistle peppermint/sweet, Tock oil/shiny/old, Rook
  tea/hearty, Vane fancy/rare.
- `src/life/save.ts`: `lifeSave(key, init)` for a system's own save (call it
  each time; don't keep the object), `runeSolved`, `markRune`.
- `src/life/clock.ts`: `clock.day`, `clock.onDawn(fn)`, `clock.timeOfDay`,
  `clock.raining` (one valley day = 24 real minutes, `src/game/weather.ts`).
- `src/life/context.ts`: what `install(ctx)` gets:
  - `ctx.world` (`src/game/world.ts`): `addSpot` / `removeSpot` (things to
    use with E or a click, with their own prompt), `onFrame`, `hold` (freeze
    walking during a minigame), `addProp(obj, collide)`, `playerPos`,
    `playerFacing`, `playerObject`, `face(p)`, `fx` (dust and chips),
    `screenPos(p)`, `playAnim(name)`, `scene`, `camera`. Module helpers:
    `reserveArea(rect)` (flat ground with no decor or meadow grass; call at
    import time), `siteInfo(id)`, `POND`, `groundHeight(x, z)`.
  - `ctx.app`: `toast`, `gained(itemId, n)`, `say(lines, buttons)`,
    `openSheet` / `closeSheet`, `finished(id)`, `partsBuilt(id)`,
    `openRune`, `hudButton({ icon, title, key, onClick })`, `befriend`.
- `src/game/anim.ts`: `registerClip(name, clip)` and `registerTool(name,
  grip)` add animations and hand props (a hoe, a watering can, a rod) without
  editing the animator; call them at import time. `keyed`, `ease`, `Pose` are
  exported for writing clips the way the chop and mine swings are written.
- Dev hook: `__pv.item("trout", 3)`, `__pv.items()`, `__pv.day()` (next
  dawn), plus `__pv.time(0.5)`, `__pv.weather("rain")`, `__pv.stage(n, id)`.

## Quality bar

- **Feel:** every action has an animation, a sound, and a small visual
  response (soil puffs, a splash, steam). Timings are generous, minigames are
  forgiving, nothing is fiddly on a trackpad. Test on the default camera.
- **Art:** models in Blender through re-runnable scripts in `art/scripts/`
  (shared `common.py`, `art/blender.ps1`, `ART.md`, `art/BRIEF.md`; no triangle
  limits, report the count). Match the valley's muted palette and soft shapes.
  Never touch the character models or their files.
- **UI:** field-journal style (`.sheet`, `.plate`, `.btn` classes, tokens in
  `src/style.css`, line icons). A system's CSS lives in its own folder,
  imported by its module.
- **Sound:** `src/game/audio.ts` (`play`, `pluck`, `chime`, buses). New sound
  files only from CC0 sources; list each in your folder's `CREDITS.md`
  (source, author, licence) so it can be merged into `public/audio/CREDITS.md`.
  No voices, no AI-made music.
- **Words:** cozy, short, in the villagers' voices (their profiles in
  `src/content/people/`). Pip hints, never answers.
- **Done:** `npx tsc --noEmit` and `npm test` green, verified in the running
  game with screenshots (headless Edge on your own debugging port, see below),
  committed with exact paths.

## Working in parallel

Three sessions build the three systems at the same time, while other sessions
write building challenges in `src/content/`.

- **Your files:** everything in `src/life/<system>/` (index, items, runes,
  CSS, CREDITS), your art scripts `art/scripts/<system>_*.py` (or names you
  choose that no one else uses) and their models and previews.
- **Shared files** (`src/game/world.ts`, `src/game/anim.ts`, `src/ui/*`,
  `src/state.ts`, `src/style.css`, `src/main.ts`, the rest of `src/life/`):
  avoid them. If you truly need a change, keep it small and additive, and
  commit it only if `git diff <file>` shows nothing but your own lines;
  otherwise leave it uncommitted and say so in your report.
- **Commit only your paths:** `git commit -m "..." -- <your paths>` (the `--`
  form ignores anything someone else staged). If git reports `index.lock`,
  wait and retry.
- **Screenshots:** the Browser pane can be stale when hidden. Run your own
  headless Edge (`"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  --headless=new --remote-debugging-port=<yours> --user-data-dir=<your
  scratch>\profile --enable-unsafe-swiftshader --use-angle=swiftshader
  --ignore-gpu-blocklist`) and drive it with `puppeteer-core`
  `connect({ browserURL, protocolTimeout: 600000 })`. Stub `window.WebSocket`
  with `evaluateOnNewDocument` so other sessions' edits don't reload the page
  mid-shot. The dev server is the "village" preview on port 5190 (start it
  with the preview tool if it isn't running).
