### `clocktower.glb`: "The Clock Tower" (building 10, Tock)

A slim square stone tower with a big clock face on the front, a steep slate spire with a
serpent weather vane, a bell in an open belfry, and Tock's lean-to tinker's workshop on the
**-X side**. Same rules as the mill: top-level `stage_01` … `stage_14`, each holding only its
new pieces, each stage charming as the last visible one.

Built by `art/scripts/clocktower.py` (re-runnable; `CLOCKTOWER_STAGES=0` skips the stage
renders). Source `art/blend/clocktower.blend`, previews `art/previews/clocktower.png` and
`clocktower_stage_01.png` … `clocktower_stage_14.png`.

**Footprint** about **8.0 m wide × 6.2 m deep** (x -5.2 … 2.8, y -3.3 … 2.9, props
included). The origin is the **bottom centre of the tower**. The tower stands on a 4 × 4 m
plinth (0.5 m high); the shaft is 3.24 m square at the base, tapering to 2.96 m at 7.8 m;
the clock chamber (8.1–11 m) is 3.2 m square; the spire tip is at 13.5 m and the vane top at
**14.7 m**. The door and the clock face the front (-Y). The workshop spans x -4.3 … -1.6,
y -1.9 … 1.9, open at the front, with its roof running from 4.0 m at the tower wall down to
2.55 m at the eave.

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch, survey stakes + string for the tower square and the workshop, the plan sheet (a tower sketch) with Tock's pocket watch on it, a mallet, spare stakes |
| `stage_02` | Square stone plinth of big rounded blocks, flagstone floor, two front steps, a few dressed stones waiting |
| `stage_03` | Lower shaft: stone courses to 4.2 m with the door hole, a plank floor on top, a ladder up the +X side, a mortar tub |
| `stage_04` | Light stone string course at 4.2 m, the upper shaft to 7.8 m, a plank floor on top |
| `stage_05` | Arched green plank door with voussoirs, iron straps, ring handle and threshold |
| `stage_06` | Five slit windows (frames, panes, stone sills and lintels), a flower box under the front one |
| `stage_07` | Clock chamber: corbels and a band at 7.8 m, wider stone walls with round belfry arches on the sides and back, the ring of dial stones on the front (dark backing), a cornice, the chamber floor |
| `stage_08` | Steep slate spire with flared eaves, iron hip rolls, a brass ball finial |
| `stage_09` | The clock: cream dial, brass bezel, hour marks, a sun and a moon, and the hands `hand_hour` + `hand_minute` |
| `stage_10` | The bronze bell (`bell`) in its timber frame, the compass cross and the serpent weather vane (`vane`) |
| `stage_11` | Workshop frame on the -X side: stone piers, plank floor and step, posts, tie beams, braces, a wall plate on corbels, five rafters, a lumber stack |
| `stage_12` | Shingled lean-to roof, plank walls (back, side with a shuttered window and flower box, the front gable), an iron stove with a glowing door and a stovepipe (`smoke`) |
| `stage_13` | Tock's gears: two meshing gears on the gable (`gear_01`, `gear_02`), a drive rod up the tower to the clock, the workbench with a vise, a half-built clock and an oil lamp (`glow`), a pegboard of tools, a big spare gear leaning outside, a crate of cogs |
| `stage_14` | Two lanterns by the door (`glow`), Tock's hanging gear sign, barrels, a bench, flower pots |

**Triangles:** 24,396 total. Per stage: 01 1,052 · 02 1,608 · 03 2,288 · 04 1,860 · 05 650 ·
06 632 · 07 3,460 · 08 3,008 · 09 1,188 · 10 778 · 11 644 · 12 1,924 · 13 3,280 · 14 2,024.

#### Special nodes

All are children of their stage node. Pivot = the object's origin, in Blender coordinates
(glTF: x stays, Blender z → glTF y, Blender y → glTF -z).

| Node | Stage | Pivot (Blender x, y, z) | What the game does |
|---|---|---|---|
| `hand_hour` | 09 | (0, -1.70, 9.55), the clock centre | Turns about its local **Blender Y** (the front axis; glTF/Three.js **Z**). At rotation 0 it points at 12. Clockwise as seen from the front = positive Blender Y = **negative** `rotation.z` in Three.js: `hand_hour.rotation.z = -(h % 12 + m / 60) / 12 * 2π` |
| `hand_minute` | 09 | (0, -1.70, 9.55), same | Same axis and sign: `hand_minute.rotation.z = -(m / 60) * 2π`. Before the clock is restarted (story) the game can leave them stopped at any time it likes |
| `bell` | 10 | (0, 0, 10.38), the axle at the top of the bell | Optional: swings about local **Blender Y** (Three.js `rotation.z`), ±25° when the clock strikes. The headstock and axle are part of `bell` |
| `vane` | 10 | (0, 0, 14.12), on the spire's rod | Optional: turns about **Blender Z** (Three.js `rotation.y`) to follow the wind |
| `gear_01` | 13 | (-2.62, -1.86, 2.90) | Spins about local **Blender Y** (Three.js `rotation.z`) once the clock runs. 16 teeth |
| `gear_02` | 13 | (-3.212, -1.86, 2.685) | Meshes with `gear_01`. 10 teeth, so it turns the other way and faster: `gear_02.rotation.z = -gear_01.rotation.z * 1.6`. The teeth only line up when both start at rotation 0 |
| `smoke` | 12 | (-3.75, 1.05, 3.82) | Empty at the top of the workshop stovepipe: smoke particles |

**Glow (material `glow`):** the stove door (stage 12), the oil lamp on the workbench
(stage 13) and the two door lanterns (stage 14). The rest of the model has no emissive parts.

Extra palette colours added by the script (not in ART.md): `brass` `#B39250`, `brass_dark`
`#8C7140`, `copper` `#A86A48`, `dial` `#E6DDC6`, `slate` `#66707A`, `slate_dark` `#4D555E`,
`slate_light` `#7E8790`. AO is baked into `COLOR_0`; moving parts are baked without
occluding the static parts, so they look right at any angle.
