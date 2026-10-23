# Brief for the parallel model sessions

Several sessions build models **at the same time** in this folder, one
building (or the character set) each. This page is everything you need. Keep
token use low: read what's listed here once, don't reread files, and don't
explore the rest of the repo.

## Read first, in this order

1. `graphify-out/GRAPH_REPORT.md`: the code map. Use it instead of browsing.
2. `ART.md`: look, palette, units, orientation and node rules. The
   `mill.glb` section is the format your spec should follow.
3. `art/README.md`: the pipeline.
4. `art/scripts/common.py`: skim its function list (`grep -n "^def " …`)
   and read only the helpers you use. **Gotcha:** `bm_cyl(r1, r2, h, segs)`.
   Passing `(r, h, segs)` silently makes 4–8 m cones.
5. The template: `art/scripts/mill.py` for a building, or
   `art/scripts/miller.py` + `chibi.py` for a character. Read it once and
   copy its structure.
6. Your row in `STORY.md` (the story props your model must include) and in
   `ROADMAP.md`.

## Rules

- **Only touch your own files**:
  - `art/scripts/<id>.py`
  - `art/specs/<id>.md`
  - `public/models/<id>.glb`
  - `art/blend/<id>.blend`
  - `art/previews/<id>*.png`
- **Never edit** `common.py`, `chibi.py`, other scripts, `ART.md`, `src/`,
  or anything else. If you need a helper, put it in your own script.
- **Run Blender only through the headless wrapper**, never the Blender MCP or
  the user's open Blender (other sessions use it too):
  `powershell -NoProfile -ExecutionPolicy Bypass -File art/blender.ps1 art/scripts/<id>.py`
  It prints the log tail and the exit code. The full log is in
  `art/logs/<id>.log`.
- Don't start the game, the dev server or the browser. Don't run `npm`.
  Don't commit. The main session wires models into the game later.
- **Images cost tokens.** Look at no more than about 6 renders in total: your
  final full render plus a few stage renders where something might be wrong.
  Check geometry with numbers instead (dimensions, triangle counts, node
  names) printed from your script.
- **Look:** Pokémon Legends: Arceus, NOT cartoonish.
  - Muted natural palette and chunky low-poly shapes.
  - Baked AO in vertex colours, as `common.py` already does.
  - Cozy and lived-in.
- Under 25k triangles per building and 3k per character.

## Buildings

Same rules as the mill:
- Top-level `stage_01` … `stage_NN`, each holding only that stage's new
  pieces.
- Every stage must look charming as the last visible one.
- Stage 1 is always survey stakes and a cleared patch.
- Origin at the bottom centre of the main building, front facing -Y.
- Stage previews `<id>_stage_01.png` …

Design your stages so the building grows in a satisfying order; each stage
is unlocked by one Python challenge later. Write `art/specs/<id>.md` with:
- the stage table, in the same format as the mill table in `ART.md`
- the footprint and height
- triangle count
- every **special node** the game should animate or light, with its pivot and
  axis (glow materials named `glow`, swaying parts, spinning or swinging
  parts, smoke points as empties named `smoke`)

| id | Building | Stages | Footprint (w × d) | Must include |
|---|---|---|---|---|
| `dock` | Fisher's Dock | 12 | ~10 × 12, pier reaching ~7 m toward the front (-Y) over water | Fisher's hut on the shore at the origin, a wooden pier on posts, a frame holding Willowmere's old bronze bell (mesh `bell`, pivot at its top, swings around X), nets, rods, crates, a little rowboat |
| `market` | Market Square | 14 | ~14 × 12 | Cobbled square, 4–5 stalls with striped cloth awnings (cloth meshes `awning*` sway), a central stone well, crates and baskets of goods, bunting strings, a notice post |
| `bakery` | The Hearth Bakery | 14 | ~9 × 8 | Cottage with a big domed brick oven (glowing mouth in `glow`), chimney with a `smoke` empty, bread display window, flower boxes, a bench, sacks of flour |
| `forge` | The Forge | 15 | ~10 × 8 | Stone smithy with an open front, anvil, glowing hearth (`glow`), bellows, quench trough, tool racks, chimney with a `smoke` empty |
| `library` | The Scribe's Library | 14 | ~10 × 9, peak ~10 m | Two-storey stone and timber library, tall arched windows, a little book turret, reading bench outside, and Ysolde's sealed vault: a carved stone hatch whose runes glow (`glow`) |
| `apothecary` | Apothecary and herb garden | 14 | ~12 × 9 | Crooked cottage with a glass lean-to greenhouse, raised herb beds (plants `herb*` sway), drying herbs, softly glowing potion bottles (`glow`) |
| `townhall` | Town Hall | 14 | ~14 × 10, peak ~12 m | The grandest building: stone ground floor, timber upper floor, a small tower with a flag (`flag` sways, pivot at the pole), wide steps, a notice board, banners |
| `clocktower` | The Clock Tower | 14 | ~7 × 7, ~14 m tall | Slim stone tower with a big clock face on the front, hands `hand_hour` and `hand_minute` (pivot at the clock centre, rotating around the front axis), a tinker's workshop at the base with gears |
| `guildhall` | The Guild Hall | 16 | ~14 × 10 | Long timber hall with a carved door and crest, banners, a training yard with dummies and a weapon rack, a lookout platform |
| `observatory` | The Observatory | 16 | ~11 × 11, dome peak ~10 m | Round stone observatory on a low rocky mound, a dome with an opening, a great brass telescope whose lens is the Great Rune (`glow`), a rune circle on the ground (`glow`), stairs. Stage 16 is the Great Rune itself |

## Characters (one session does all of them)

Same chibi build and part names as `miller.glb`:
- Parts are `body`, `head`, `arm_l`, `arm_r`, `leg_l` and `leg_r`, with
  pivots at the joints.
- Accessories (rod, hammer, book…) are separate meshes parented to the
  arm that holds them.
- Each villager must read differently at gameplay distance. A distinct
  silhouette (hat, hair, prop) matters more than detail.

Write `art/specs/characters.md` with the list, triangle counts and
accessory names. Make the previews `<model>.png`.

| model | Who | Look |
|---|---|---|
| `fisher` | Marlo, quiet old fisher | White beard, bucket hat, oilskin coat, tall boots, fishing rod |
| `merchant` | Sable, fast-talking trader | Feathered cap, patchwork coat full of pockets, coin purse, sharp grin |
| `baker` | Hazel, Bram's younger sister | Bram's reddish-brown colouring, hair in a bun under a baker's cap, apron, rolling pin |
| `smith` | Ingrid, blacksmith | Broad and strong, blond braids, leather apron, thick gloves, hammer |
| `librarian` | Odo, absent-minded scholar | Thin, round spectacles, long ink-stained robe, a stack of books |
| `herbalist` | Mirela, herbalist | Long dark hair with a flower crown, green shawl, herb basket |
| `mayor` | Mayor Thistle, elderly | Round, plum coat, chain of office, soft chaperon hat, walking cane |
| `tinker` | Tock, tinkerer | Short, goggles pushed up on the forehead, tool belt, backpack of gears |
| `captain` | Captain Rook, retired adventurer | Grey ponytail, scar over one eye, short cape, one pauldron, sheathed sword |
| `lord_vane` | Lord Aldous Vane, rival from the trading company | Tall and thin, burgundy and black fine coat, ruffled collar, feathered hat, monocle, ledger |

## When you finish

Reply with a few lines: the file names, the stage list (one line each),
triangle count, and anything the game needs to know.
