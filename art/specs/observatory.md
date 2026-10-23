# `observatory.glb`: "The Observatory" (building 12, the finale)

A round stone observatory on a low rocky mound at the top of the north hill. It has a
green copper dome with an open slit and a great brass telescope reaching out of it. The
telescope's lens is the Great Rune. A rune circle glows on the terrace around the tower.
Same rules as the mill: top-level `stage_01` … `stage_16`, each holding only its new
pieces, and each stage charming as the last visible one.

Built by `art/scripts/observatory.py`. Source is `art/blend/observatory.blend`. Previews are
`art/previews/observatory.png` and `observatory_stage_01.png` … `observatory_stage_16.png`.

## Size

- **Footprint:** about 10.7 m × 11.4 m (x -5.4…5.4, y -5.9…5.5 in Blender). The mound is
  about 10.7 m across. The stairs and a signpost stick out about 0.6 m further at the
  front (-Y).
- **Height:** the dome peaks at 9.0 m. The finial star reaches 10.25 m, and the telescope
  lens sits at about 9.8 m.
- **Origin:** the origin is the centre of the tower at ground level. The mound rises to
  1.0 m, the terrace top is at 1.12 m and the tower floor is at 1.5 m. A few buried
  boulders dip to -0.29 m.
- **Front:** the door, stairs, dome slit and telescope all face the front (-Y).
- **Triangles:** 23,096 in total.

## Stages

| Node | Adds | Tris |
|---|---|---|
| `stage_01` | The rocky grass mound with boulders and tufts, a cleared dirt patch on top, survey stakes and string in a circle, a centre peg, and the plan (dome and star sketch) held down by pebbles, plus a mallet | 1864 |
| `stage_02` | Stone stairs up the front of the mound with cheek boulders, and a flagstone terrace with a low curb | 1708 |
| `stage_03` | Round stone plinth with a flagstone floor, a step up to the door, and stones waiting for the wall | 908 |
| `stage_04` | Lower tower walls up to about 3.4 m, with the door gap | 1300 |
| `stage_05` | Upper walls to 6.1 m, a projecting stone cap course on corbels, and the upper wooden floor | 2592 |
| `stage_06` | Arched front door (night-blue planks, iron straps, a brass star) with stone voussoirs and a threshold | 560 |
| `stage_07` | Six lancet windows with leaded glass and stone surrounds, and four stepped buttresses | 896 |
| `stage_08` | Wooden stargazing gallery around the top of the tower, on brackets, with a railing | 1872 |
| `stage_09` | Dome frame: timber curb ring, curved ribs, a hoop, the slit's frame and a crown ring | 2116 |
| `stage_10` | Dome skin in green copper, double-skinned so the open slit shows a wooden inside | 1252 |
| `stage_11` | The slit's two copper shutters, slid open over the dome, and a brass star finial | 1184 |
| `stage_12` | The great brass telescope (`telescope`) on a stone pier and brass fork, reaching out of the slit. The lens socket is empty and dark | 1128 |
| `stage_13` | The rune circle: a dark stone band round the terrace inlaid with glowing runes, and four standing stones with a rune each (`rune_circle`) | 2060 |
| `stage_14` | Lanterns: two posts at the top of the stairs and two wall lanterns by the door. A signpost at the foot of the stairs with a painted star | 928 |
| `stage_15` | Lived-in props: a brass orrery on a pedestal, a bench with a blanket and books, a tripod spyglass, a crate of lenses, rolled star charts, potted herbs by the door, and ivy on the back-left wall | 2240 |
| `stage_16` | **The Great Rune:** the glowing lens set in the telescope with brass claws, and a ring of runes around the dew cap (`great_rune`) | 488 |

## Special nodes

Coordinates are given for Blender first, then for glTF/Three.js, where (x, y, z) becomes
(x, z, -y).

| Node | Parent | What | Pivot (Blender → glTF) | Animate |
|---|---|---|---|---|
| `great_rune` | `stage_16` | Lens disc plus a ring of rune marks round the dew cap. Everything uses the `glow` material | Lens centre (0, -2.841, 9.743) → (0, 9.743, 2.841) | Pulse its emissive, or spin it slowly around the tube axis. The tube axis is Blender (0, -0.788, 0.616) → glTF (0, 0.616, 0.788). This is the finale beat: light it brightly when the capstone passes |
| `rune_circle` | `stage_13` | Glowing rune ring on the terrace (r 3.29 to 3.56 m) plus the runes on the four standing stones. Everything uses the `glow` material | (0, 0, 1.175) → (0, 1.175, 0) | Pulse or breathe its emissive. It can stay dim until stage 16, then flare |
| `telescope` | `stage_12` | Brass tube, finder scope, eyepiece and trunnion bosses | Altitude axis (0, 0.35, 7.25) → (0, 7.25, -0.35); rotates around **X** | Static as built (38° up). If the game tilts it, apply the same rotation around the same pivot to `great_rune`, which is a separate stage node |
| lanterns (in `stage_14_mesh`) | `stage_14` | Lantern glass in the `glow` material | — | Evening glow, like the tavern's lanterns |

The building has no `smoke` empties and no swaying parts.

## Notes

- **Materials:** extra palette entries are defined in the script without touching
  `common.py`: `brass`, `brass_dark`, `brass_light`, `verdigris`, `verdigris_dark` and
  `night`. Glow parts use the shared `glow` material.
- **Ambient occlusion:** baked per stage into `COLOR_0`, with only the stages that exist
  when each one appears. `glow` and `glass` are left unbaked.
- **Collision:** walkable ground is the stairs from y -5.6 up to the terrace (z 1.12, r ≤ 4.05),
  then the door step to the floor at 1.5 m. The door is closed, so a cylinder collider
  for the tower (r 2.6) plus the mound works.
