# `apothecary.glb`: Apothecary and herb garden (building 8, Mirela)

A crooked little timber-and-stone cottage with a mossy slate roof, a glass lean-to
greenhouse on its +X gable, and a herb garden on the -X side (three raised beds, a stone
herb spiral and a wattle fence). The whole cottage leans gently toward +X, twists a little
and has a sagging ridge. Every stage is bent the same way, so stages line up.

Built by `art/scripts/apothecary.py`. Source is `art/blend/apothecary.blend`, and the
previews are `art/previews/apothecary.png` and `apothecary_stage_01.png` … `_14.png`.

## Size and orientation

- **Footprint**: about **12.0 m wide × 8.9 m deep**, x from -6.5 to 5.5 and y from -5.0 to 3.9.
  - Cottage walls: x ±2.5, y ±2.0, plinth to 0.35 m.
  - Greenhouse: x 2.5 … 5.3, y ±1.6.
  - Garden: x -6.4 … -3.15.
- **Origin**: bottom centre of the cottage. The cottage front and its door face **-Y**.
- **Height**:
  - Eaves about 2.6 m at the front edge.
  - Ridge 5.8 m, sagging to about 5.65 m in the middle.
  - Chimney pots on the -X gable reach about **7.0 m**.
- **Doors**:
  - The cottage door is at **x = -0.3**, deliberately off-centre (crooked charm), on the front wall y = -2.0.
  - The greenhouse door is on its front wall (y = -1.6), x 3.35 … 4.15.
- **Triangles**: **24,800** in total (budget 25k).

## Stages

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch, six survey stakes with string and flags, the plan with a crooked cottage sketch, a seedling tray and a trowel |
| `stage_02` | Stone plinth with a flagstone floor, and three stones waiting at the back |
| `stage_03` | Rubble stone lower walls to 1.1 m (door gap), spare stone pile and a mortar tub |
| `stage_04` | Timber frame: sill, corner posts, studs, mid rails, corner braces, wall plate, gable trusses (king post + collar), rafters, ridge beam; a wheelbarrow of soil |
| `stage_05` | Plaster infill between the timbers and in both gables; plaster tub by the corner |
| `stage_06` | Steep mossy slate roof: stepped slate courses with moss patches, verge rafters, bargeboards, ridge cap |
| `stage_07` | Arched green plank door with iron straps and a ring, two stone steps, a doormat |
| `stage_08` | Leaded diamond-pane windows (front, back, -X gable, and one into the greenhouse), sage shutters, flower boxes on the two front windows, round attic windows in both gables |
| `stage_09` | Stone chimney up the -X gable with a crooked cap and two pots (empty `smoke` on the tall one), woodpile against it |
| `stage_10` | Greenhouse base and frame: stone sill walls, flagstone floor, posts, rafters, wall ledger, door frame, door step |
| `stage_11` | Greenhouse glazing (`greenhouse_glass`), glazing bars, a glass door; inside a potting bench with six seedling pots, seed trays, a potted lemon tree and a watering can |
| `stage_12` | The herb garden: dug plot, three raised timber beds, a stone herb spiral on a soil mound, a wattle fence, stepping stones to the door, garden and greenhouse, a watering can |
| `stage_13` | Herbs growing: 17 clumps `herb_01` … `herb_17` (lavender, sage, rosemary, chamomile, marigold, mint, foxglove), 12 in the beds and 5 up the spiral |
| `stage_14` | Lived-in: drying herb bundles on two poles under the front eave, a lantern by the door, a potion display table with glowing bottles and **Mirela's tonic** (the big flask with a paper tag), small bottles on the left window sill, a bench with a herb basket and a mortar and pestle, a cauldron under the gable window, a hanging mortar-and-pestle sign at the garden gate |

Each stage node holds a mesh `stage_NN_mesh`. Stages 11 and 13 also hold the separate
objects below.

## Special nodes

| Node / material | Where | Animate or light |
|---|---|---|
| `herb_01` … `herb_17` | under `stage_13`, each origin at the base of the clump on the soil | **Sway** (like the mill's `wheat*`): small rotation about local X/Z around the origin. 0.3–0.8 m tall. |
| material `glow` | in `stage_14_mesh`: the potion bottles, the big tonic flask, the lantern glass | Emissive `#FFC861`. Soft evening bloom; a faint flicker or pulse on the bottles would suit. |
| `smoke` (empty) | under `stage_09`, at Blender (-2.48, 0.00, 7.06) = glTF (-2.48, 7.06, 0.00), the top of the tall chimney pot | Smoke particle source. |
| `greenhouse_glass` | under `stage_11`, origin (0, 0, 0), 192 tris | Material `greenhouse_glass` is **alphaMode BLEND, alpha 0.3** (pale green-blue). In Three.js, render it as transparent (`depthWrite = false` helps) so you can see the bench and lemon tree inside. Its vertex colours are flat white (no AO). |

The opaque window panes use the regular `glass` material, as in the tavern.

## Notes for the game

- Vertex-colour AO (`COLOR_0`) is baked per stage: each stage was baked with only itself and
  earlier stages present. Herbs also get a darker-at-the-base gradient.
- Suggested colliders (Blender x/y):
  - cottage: box x -2.6 … 2.6, y -2.1 … 2.1
  - chimney: x -3.3 … -2.5, y -0.3 … 1.0
  - greenhouse: x 2.5 … 5.4, y ±1.7
  - beds: x -6.0 … -4.1, at y -3.7 … -2.6, -2.0 … -0.9 and -0.3 … 0.8
  - herb spiral: circle r 1.05 at (-5.0, 2.55)
  - fence: x = -6.4
- The footpath runs from the door straight forward (x ≈ -0.3), and the garden path runs
  along x ≈ -3.5.
- New palette entries were added inside the script: `slate*`, `moss*`, `terracotta*`,
  `sage_paint`, `potion`, `greenhouse_glass`, the herb colours and `dried_*`.
  `common.py` is unchanged.
