### `bakery.glb`: "The Hearth Bakery" (building 5, Hazel)

A timber-framed, plaster cottage under a steep red clay-tile roof. A big domed
brick oven is built against its **+X gable**, with the mouth facing the front
(-Y). The stone chimney rises from the back of the oven to the gable peak. The
front has a green arched door and an open **shop window**: shelves inside and a
drop-down counter with a striped awning above, both full of bread. Same rules as
the mill: top-level `stage_01` … `stage_14`, each holding only its new pieces.

- **Origin:** bottom centre of the cottage. The cottage is 6 × 5 m
  (x -3..3, y -2.5..2.5), with the front wall at y = -2.5.
- **Oven:** dome centre (4.1, -1.2). The plinth is 1.45 m in radius and
  0.95 m high. The dome is 1.3 m in radius and peaks at 2.45 m. The mouth porch
  front is at y ≈ -2.75.
- **Footprint:** about **9.4 × 7.2 m**. Buildings and props run from x -3.65
  to 5.8 and y -3.7 to 3.5. The cleared dirt patch is 10 × 7.6 m
  (x -3.96..6.11, y -4.0..3.65).
- **Height:** roof ridge 5.3 m (ridge tiles 5.42 m). The chimney pot tops out
  at 6.5 m.
- **Triangles:** 23,004 in total (see the table).

| Node | Adds |
|---|---|
| `stage_01` | Survey stakes with flags and string around the cottage, a scratched soil circle and a centre peg with a measuring string for the oven, a cleared dirt patch, the plan held down by pebbles, a mallet and spare stakes |
| `stage_02` | Stone plinth of two courses of dressed blocks, a plank floor, a mortar tub and spare stones |
| `stage_03` | Round fieldstone oven plinth with a hearth slab, bricks stacked ready, a trowel on a board |
| `stage_04` | Timber frame: corner and opening posts, sill beams, top plates, gable queen posts, raking rafters, ridge beam and roof rafters. A ladder and a plank stack at the back |
| `stage_05` | Plaster walls between the timbers, with door/window holes, lintels, sill rails, diagonal braces, plaster gables and gable struts |
| `stage_06` | The domed brick oven: brick courses, an arched brick mouth porch with keystone and stone hood, and a soot-dark inside |
| `stage_07` | Arched green plank door with spandrels, trim, iron straps and ring handle, threshold and two stone steps |
| `stage_08` | Shuttered side windows (left and back) with glass and flower-box sills, a little loft window on the left gable, and the open shop window: a recess, two shelves and a drop-down counter on chains and knee brackets |
| `stage_09` | Red clay tile roof (two sides of overlapping tiles, deep eaves), bargeboards and round ridge tiles |
| `stage_10` | Stone chimney stack from the back of the oven up past the gable peak: a brick top, a cap slab and a terracotta pot, plus a brick flue collar. **Empty `smoke`** at the pot mouth |
| `stage_11` | First fire: **`oven_glow`** (glowing mouth and embers, burning logs), the iron oven door leaning on the plinth, a baker's peel against the wall, and a firewood stack behind the oven |
| `stage_12` | Bread: boules and long loaves on the shop shelves, a basket of buns, loaves on a cloth on the counter, a tall basket of baguettes, and the striped **`awning`** over the shop window |
| `stage_13` | Flower boxes under the side windows, a bench along the left wall, a potted plant by the door, and the hanging loaf sign on an iron bracket |
| `stage_14` | Flour sacks with spilled flour, a barrel (with a loaf on it) and a crate, two hanging lanterns (glass `glow`), a wheat wreath with a red bow on the door, and **Hazel's braided festival loaf** on a cooling rack on the bench with a basket of rolls (the loaf that thaws Bram and Hazel's quarrel) |

Triangles per stage:

| stage | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tris | 900 | 3176 | 608 | 960 | 436 | 1446 | 718 | 812 | 5360 | 1264 | 808 | 2880 | 1248 | 2388 | **23004** |

## Special nodes

All positions below are Blender coordinates (Z up, front -Y). In glTF/Three.js,
(x, y, z) becomes (x, z, -y).

| Node | Type | Where (Blender) | What the game does |
|---|---|---|---|
| `oven_glow` | mesh under `stage_11`, all material `glow` | origin (4.1, -2.1, 0.95): the mouth floor | Flicker its emissive intensity (fire). Optionally add a warm point light about 0.4 m above the origin, toward the front. Do not move it |
| `smoke` | empty under `stage_10` | (3.32, -0.25, 6.53): top of the chimney pot | Spawn the chimney smoke particles here (drifting up) |
| `awning` | mesh under `stage_12` | origin (1.3, -2.52, 2.46): the wall batten along its top edge | Gentle sway: rotate around its local **X** axis (the top edge, along the wall), about ±3°. The cloth hangs toward -Y |
| lanterns | glass faces in `stage_14_mesh`, material `glow` | left of the door (-2.22, -2.95, ~1.8) and on the left wall (-3.45, -1.6, ~1.8) | Evening glow / bloom, like the tavern lanterns |

Other materials named `glow`: none besides the above. Every mesh has baked AO
in `COLOR_0`; the glow faces are left at full brightness.

Previews: `bakery.png` (final), `bakery_stage_01.png` … `bakery_stage_14.png`.
Source: `art/scripts/bakery.py`, `art/blend/bakery.blend`.
