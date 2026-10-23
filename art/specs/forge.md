# `forge.glb`: "The Forge" (building 6, Ingrid)

Ingrid's stone smithy. It has a gabled roof, and the front gable is open under a big timber
lintel, so the hearth, anvil and racks show from the path. A charcoal lean-to stands on the -X
side and a work yard on the +X side. Built by `art/scripts/forge.py`. Same rules as the mill:
top-level `stage_01` … `stage_15` hold only their own new pieces, and each stage looks finished
when it is the last one visible.

## Size and orientation

- **Origin:** bottom centre of the smithy (x 0, y 0, on the ground). The front (the open
  gable) faces **-Y**.
- **Smithy walls:** 6.0 m wide (x -3..3) × 4.6 m deep (y -2.3..2.3). The floor sits on a 0.3 m
  plinth. The eaves are at 3.1 m and the top of the ridge caps at about 5.9 m. The ridge runs along Y.
- **Chimney:** at the back, slightly left of centre. Its cap is at 6.85 m and the pot top at
  about 7.2 m.
- **Whole model:** x -5.25..5.15, y -3.45..3.05, z 0..7.2, about **10.4 × 6.5 m**. The lean-to
  and yard make it wide; the brief asked for about 8 m of depth, and it uses 6.5.
- **Open front:** 4.6 m wide, clear height about 2.5 m (floor to lintel).

## Stages

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch. Survey stakes at the four corners and at the edges of the open front, with string. A ring of pebbles and a charcoal cross where the hearth will go. The plan (an anvil sketch) held down by pebbles. Mallet and spare stakes |
| `stage_02` | Stone plinth with a flagstone floor, a long front step, flat stones on the ground in front, piles of stones waiting |
| `stage_03` | Lower walls to about 1.5 m: back wall, both side walls, the two front piers. A mortar tub with a trowel, spare stones |
| `stage_04` | Walls up to the eaves, the stepped stone back gable, the great timber lintel (with iron straps) over the open front, and the side window (+X wall) with frame, panes, sill and open blue shutters |
| `stage_05` | **The hearth:** a raised stone forge with a firepot of glowing coals and a glowing fire mouth behind a grate on its front (`glow`). A stone hood with an iron lip on two iron stays. Soot on the floor, a coal scuttle, poker and rake |
| `stage_06` | Stone chimney from the hood up past the ridge, a cap stone and a clay pot. **`smoke` empty** on top |
| `stage_07` | Roof frame: wall plates, ridge beam, 9 rafter pairs, a tie-beam truss inside, the plank front gable with a louvred vent, barge boards that cross above the front apex like horns |
| `stage_08` | Clay tile roof on battens (muted reds with a few mossy tiles), ridge caps |
| `stage_09` | Leather bellows with pleats on a trestle left of the hearth, piped into the fire. The **`bellows_lever`** rocker on its post, with a link rod, chain and pull ring |
| `stage_10` | Anvil on an iron-banded stump. A hot bar on its face (glowing end in `glow`), a hammer resting across it, tongs leaning on the stump, iron stock on the floor |
| `stage_11` | Stone quench trough of water right of the hearth with tongs dipped in it, a water bucket by the anvil |
| `stage_12` | Tool racks: hammers, tongs, a file and a horseshoe on pegs over the trough, a shelf of jars and bars above, and a rack of horseshoes on the right wall |
| `stage_13` | Charcoal lean-to on the -X side: posts and a shingle roof, a plank bin heaped with charcoal (shovel stuck in), stacked firewood, two coal sacks |
| `stage_14` | The yard on the +X side: a workbench with a vise and horseshoes under the window, a grindstone with a crank over a water tub. A rack of **new tools for the town** (two shovels, a hoe, a pick, a rake, an axe) and a barrel of handles |
| `stage_15` | Lanterns on both piers (`glow`), the swinging **`sign`** (anvil and hammer) on a bracket off the right pier, and a lucky horseshoe over the lintel. Story props: the **Vane Company crate** (burgundy crest crossed out in chalk) now holding kindling, and **Vane's plan** pinned to the inside of the right wall with a knife, a pond and hills marked with red crosses (drain the pond, quarry the hills). Pots of flowers by the front |

Preview renders: `art/previews/forge_stage_01.png` … `forge_stage_15.png` and `forge.png`.

## Special nodes

| Node / material | Stage | Pivot (Blender coords) | What the game does |
|---|---|---|---|
| material `glow` | 05, 10, 15 | n/a | Emissive warm light: coals and fire mouth in the hearth (05), the hot bar on the anvil (10), the lantern glass (15). Good for a flickering point light at the hearth, about (-0.6, 1.36, 1.3) |
| empty `smoke` | 06 | (-0.6, 1.825, 7.2) | Chimney smoke particles start here. In Three.js that is (-0.6, 7.2, -1.825) |
| `bellows_lever` | 09 | (-2.05, 0.75, 2.3), the fulcrum on the post | Rocks around its local **X** axis, about ±10°, while Ingrid works the fire. The link rod and chain are part of it and swing with it. The bellows body stays still |
| `sign` | 15 | (3.55, -2.08, 2.66), top of the hanging links | Swings gently around its local **X** axis (a breeze sway), like the dock's bell |

The `bellows_lever` and `sign` origins sit on their pivots. Both are children of their stage
node. AO is baked in vertex colours (`COLOR_0`) on every mesh, as for the other buildings.

## Triangles

**23,964 in total.** The budget is 25k.

| Stage | Tris | Stage | Tris | Stage | Tris |
|---|---|---|---|---|---|
| 01 | 1,124 | 06 | 888 | 11 | 468 |
| 02 | 1,624 | 07 | 684 | 12 | 1,388 |
| 03 | 1,924 | 08 | 4,884 | 13 | 2,796 |
| 04 | 2,688 | 09 | 730 | 14 | 1,502 |
| 05 | 1,013 | 10 | 482 | 15 | 1,769 |

## Notes for the game

- **Where Ingrid stands:** between the hearth and the anvil, at about (0.1, 0.3) on the floor
  (z 0.3). She faces the anvil at (0.45, -0.35), and its face is at about z 1.25.
- **Extra colours.** The script adds these to `common.PALETTE` at runtime, so `common.py` is
  unchanged:
  - `coal`, `soot`, `water` (roughness 0.15), `leather`, `iron_light`
  - `vane` (Lord Vane's burgundy), `paper`, `tile_moss`, `sack_dark`
- **Floor collision:** the smithy floor is 0.3 m up, and the long front step (0.16 m) runs
  across the opening.
