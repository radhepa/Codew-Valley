# `guildhall.glb`: "The Guild Hall" (building 11)

Captain Rook's guild: a long timber hall on a stone plinth, with a gabled entrance
porch, a carved rune door, the guild crest (a sword with a coiled serpent on a blue
shield over crossed spears) and serpent-headed crossed barge boards on every gable.
On its **-X side** is the training yard: sand ground, a split-rail fence open toward
the hall, a sparring ring, three straw dummies, an archery target, a weapon rack
against the gable, and a lookout platform watching the north hill (+Y).
Built by `art/scripts/guildhall.py`.

Same rules as the mill: top-level `stage_01` … `stage_16`, each holding only its
new pieces; showing stages 1..N gives the building after N challenges.

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch, survey stakes + string for the hall and porch, flagged pegs at the yard corners, the plan held down by pebbles, a mallet and spare stakes |
| `stage_02` | Two courses of stone plinth for the hall and the porch platform, porch flagstones, two front steps, spare blocks |
| `stage_03` | Sill logs and the plank floor, timber pile and a sawhorse inside |
| `stage_04` | Thick timber posts around the hall |
| `stage_05` | Wall plates, tie beams, mid rails and knee braces |
| `stage_06` | Vertical plank walls with the door and window openings |
| `stage_07` | Plank gable ends (round vent hole), rafters, battens, ridge beam, a ladder on the back wall |
| `stage_08` | Shingle roof, ridge log, moss, crossed barge boards ending in carved serpent heads |
| `stage_09` | Entrance porch: carved posts, beams, plank gable, its own shingle roof with a serpent-crossed gable |
| `stage_10` | Carved arched double door (iron straps, ring handles), rune lintel, threshold stone, the guild crest on the porch gable |
| `stage_11` | Windows with blue-grey shutters, flower boxes on the front, round gable vents |
| `stage_12` | Stone chimney through the back slope with two pots (`smoke`), woodpile on the +X gable, chopping block and axe |
| `stage_13` | Banners `banner_01`…`banner_04` (two on the front wall, two on poles flanking the steps) and two lanterns on the porch posts (`glow`) |
| `stage_14` | Training yard: sand ground with scuffs, split-rail fence on three sides, a ring of stones for sparring |
| `stage_15` | Three straw dummies (pot helmet / guild shield / straw hat), archery target with arrows, weapon rack (practice swords, spears, staff, bow, shields), bench with helmet and cloak, bucket, barrel of staves |
| `stage_16` | Lookout platform (braced posts, ladder, railed deck, shingled roof, `flag`, spyglass aimed north, horn, lantern `glow`) and the guild notice board with Rook's map of the road up the north hill under the storm |

Stage previews: `art/previews/guildhall_stage_01.png` … `guildhall_stage_16.png`,
full view `guildhall.png`.

## Size

- Origin: bottom centre of the hall. Front (door, porch, crest) faces **-Y**.
- Hall: 9 × 5.6 m walls on a 9.5 × 6.1 m plinth, eaves at 3.0 m, ridge log top ~6.7 m,
  serpent heads ~7.5 m, chimney pots ~8.0 m. Porch reaches y ≈ -4.75, steps to -5.2.
- Yard (-X side): x ≈ -10.2 … -5.3, y ≈ -3.9 … 3.75. Lookout centred at (-8.85, 2.5),
  deck 4.0 m, roof peak ~7.3 m, flag to ~8.3 m.
- Whole model bounding box: x -10.24 … 6.56, y -5.4 … 3.88, z 0 … 8.27
  (about **16.8 × 9.3 m**; the woodpile and chopping block sit on the +X side).

## Triangles

24,880 total (under 25k).

| Stage | Tris | Stage | Tris |
|---|---|---|---|
| 01 | 972 | 09 | 1,756 |
| 02 | 1,480 | 10 | 1,410 |
| 03 | 536 | 11 | 1,960 |
| 04 | 572 | 12 | 1,780 |
| 05 | 584 | 13 | 1,288 |
| 06 | 1,452 | 14 | 1,238 |
| 07 | 1,200 | 15 | 2,982 |
| 08 | 3,688 | 16 | 1,982 |

## Special nodes

Blender coordinates (Z up). In glTF/Three.js: x stays x, Blender Z → Y, Blender Y → -Z.

| Node | Stage | What | Pivot (object origin) | Motion |
|---|---|---|---|---|
| `banner_01` | 13 | front wall banner, left | top centre (-3.55, -3.07, 3.10) | sway: rotate around its local **X** (the hanging rod) |
| `banner_02` | 13 | front wall banner, right | top centre (3.55, -3.07, 3.10) | same |
| `banner_03` | 13 | pole banner left of the steps | top centre (-2.65, -5.05, 4.40) | same |
| `banner_04` | 13 | pole banner right of the steps | top centre (2.65, -5.05, 4.40) | same |
| `flag` | 16 | pennant on the lookout roof | at the pole (-8.82, 2.50, 8.12) | flutter: rotate around the vertical pole (Blender Z = glTF Y) |
| `smoke` | 12 | empty at the left chimney pot | (2.70, 1.00, 8.05) | spawn smoke particles here |
| material `glow` | 13, 16 | lantern glass: two on the porch posts (z ≈ 1.9–2.1), one under the lookout roof | — | light / bloom at night |

Banners are guild blue with gold trim and a gold serpent; give them a small phase
offset each so they don't sway in step. Every mesh carries baked AO in `COLOR_0`
(glow and glass are left at full brightness).

## Story hooks

- Crest: a sword with a serpent coiled round it, on a blue shield: the guild of the
  Codew Valley. The door lintel is carved with runes.
- Notice board (stage 16): Rook's map pinned in the middle, a green hill with a red
  dotted road up to a dark storm cloud, the Hush gathering on the north hill.
- Lookout spyglass points north (+Y), toward that hill.
