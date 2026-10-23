# `townhall.glb`: the Town Hall (building 9)

Built by `art/scripts/townhall.py` (re-runnable, headless:
`powershell -NoProfile -ExecutionPolicy Bypass -File art/blender.ps1 art/scripts/townhall.py`).
Source `art/blend/townhall.blend`, previews `art/previews/townhall.png` and
`townhall_stage_01.png` … `townhall_stage_14.png`.

The grandest building in Willowmere, where Mayor Thistle holds the charter hearing.
It has a coursed stone ground floor with arched windows and a great arched double door,
and a jettied half-timbered upper floor. Above that sits a big terracotta-tiled gable
roof with a front cross gable, two dormers and a chimney. A balcony over the door gives
the mayor somewhere to make speeches. A stone corner tower at the front right carries
an open timber belfry, a slate spire and the town flag. Out front are wide stone steps
between lantern pedestals, the quest notice board and a handcart of town records.

## Footprint, height, origin

- Origin: the bottom centre of the main hall (the stone ground floor spans
  x -5.4…5.4, y -3.4…3.4). The front faces -Y and the door is centred on x = 0.
- Overall: x -6.5…8.3 (about 14.7 m), y -6.1…4.4 (about 10.5 m). That includes the
  roof eaves, the steps (out to y -5.15), the notice board (front left) and the
  barrels (front right).
- The tower stands at x 4.7…7.5, y -3.6…-0.8 (it projects 0.2 m in front of the
  facade).
- Heights:

  | Part | Height |
  |---|---|
  | Plinth / ground floor | 0.5 m |
  | Stone ground floor top | 3.6 m |
  | Upper floor | 3.85 m |
  | Eaves | 6.45 m |
  | Main ridge | 10.0 m |
  | Tower stonework | 7.55 m |
  | Belfry top | 9.6 m |
  | Spire tip (the building's peak) | 12.05 m |
  | Top of the flagpole | 13.6 m |

- **23,026 triangles** in total, under the 25k budget.

## Stages

Top-level `stage_01` … `stage_14`. Each holds only its new pieces, and each looks
finished as the last visible stage. Until stage 11, the corner where the tower goes is
a notch on the plinth with cut stones waiting on it.

| Node | Adds | Tris |
|---|---|---|
| `stage_01` | Cleared dirt patch, survey stakes and string around the hall and the tower square, a door peg, the plan sheet held down by pebbles, a mallet and spare stakes | 964 |
| `stage_02` | Stone plinth for the hall and the tower, flagstone floor, the first tower stones waiting in the corner | 1576 |
| `stage_03` | Ground floor in coursed stone (0.5 m walls): the arched doorway and ten arched windows with voussoirs, keystones and stone sills | 4072 |
| `stage_04` | Wide three-step stone stair between cheek walls, with two lantern pedestals | 752 |
| `stage_05` | The great double door (green planks, iron straps, ring handles, threshold) and the glazed arched windows | 1416 |
| `stage_06` | Upper floor deck, the jetty beam with joist ends showing under the overhang, the half-timber wall frame (posts, rails, chevron braces, top plate) | 2160 |
| `stage_07` | Plaster infill between the timbers | 384 |
| `stage_08` | Upper windows (front ones get blue shutters and flower boxes), the glazed French door and the mayor's balcony on two brackets | 1808 |
| `stage_09` | The big tiled gable roof, the front cross gable (half-timbered, with an empty panel for the crest), half-timbered gable ends with small windows, verge boards, ridge tiles | 2596 |
| `stage_10` | Two dormer windows on the front slope and a tall stone chimney with two pots (empty `smoke`) | 836 |
| `stage_11` | The corner tower in coursed stone: a small arched door with a step, arrow slits, a string course and a corbelled cornice | 2776 |
| `stage_12` | Open timber belfry (railings, knee braces) under a flared slate spire with a gold finial | 792 |
| `stage_13` | Civic colours: the flagpole and the town flag (`flag`), two hanging banners (`banner_l`, `banner_r`) on rods, the gold-rimmed town crest with a coiled serpent rune on the front gable | 778 |
| `stage_14` | Open for business: lanterns on the pedestals (`glow`), the quest notice board with pinned notices, a handcart of scrolls and ledgers (the town records), barrels and a crate by the tower, a bench, two potted bay trees on the top step | 2116 |

## Special nodes

| Node | Type | Pivot (Blender, metres) | Animate |
|---|---|---|---|
| `flag` | mesh, child of `stage_13` | (6.1, -2.2, 13.45): on the pole, at the top of the flag's hoist edge | Sway or flutter around the pole: Blender Z, which is glTF/Three.js **Y**. A few degrees plus a small, fast wobble. The flag flies toward +X. |
| `banner_l` | mesh, child of `stage_13` | (-2.25, -3.87, 6.05): on its hanging rod | Gentle swing around the rod: Blender/glTF **X** (front to back), a few degrees, slower than the flag |
| `banner_r` | mesh, child of `stage_13` | (2.25, -3.87, 6.05) | Same as `banner_l`, phase-shifted |
| `smoke` | empty, child of `stage_10` | (-2.6, 1.9, 11.96): just above the left chimney pot | Smoke particle emitter |
| material `glow` | the two lanterns' glass in `stage_14_mesh`, at about (±2.63, -4.88, 1.3) | n/a | Emissive / bloom in the evening, optional point lights there |

Glass panes use the material `glass`. Like `glow`, they skip the AO darkening, so a
night pass can light the windows by swapping that material.

## Notes for the game

- Baked AO is in the vertex colours (`COLOR_0`). Keep `vertexColors` on.
- The flag and banners are two-sided geometry (a back layer, or real thickness), so
  the default `FrontSide` material is fine.
- Story hooks: the notice board is the quests board, the records cart holds the files
  for the charter hearing, and the balcony is where Thistle speaks when the village
  becomes a Town.
