# Art contract

The game (Three.js) loads every model from `public/models/*.glb` by the exact
file and node names below. Until a file exists it draws a simple placeholder,
so models can land one at a time in any order.

## Look

Cozy, Stardew-Valley-like warmth in **low-poly 3D**: chunky rounded
proportions, slightly exaggerated (big roofs, fat trunks, stubby characters),
soft bevels, no realism. Flat colours from the palette (material base colour
or vertex colour); no image textures needed. Lighting is done in game: export
plain materials (Principled BSDF base colour + roughness only).

Palette (hex):

| Use | Colours |
|---|---|
| Grass / leaves | `#7FB24A` `#5E9A3A` `#A5CC5B` `#3F7A34` |
| Wood (logs, planks, beams) | `#A0673A` `#7A4A2A` `#C58B52` `#5A3620` |
| Stone | `#A9A39A` `#8A847C` `#C9C2B6` `#6E6962` |
| Thatch / roof | `#D9A84E` `#B9823A` (or roof tiles `#B5523B` `#8E3E2E`) |
| Plaster walls | `#F2E3C6` `#E6CFA4` |
| Accents | lantern glow `#FFC861`, door green `#4F7A5A`, cloth red `#C8553D`, Pip green `#6CC46A` |

## Units and orientation

- 1 Blender unit = 1 metre. Export glTF binary (`.glb`), **+Y up** (the
  default exporter setting), apply all transforms before export.
- Origin at the **bottom centre of the footprint** (the object stands on y = 0).
- The front of every building and character faces **-Y in Blender** (which
  becomes +Z in glTF/Three.js, toward the camera).

## Files

### `tavern.glb`: "The Sleepy Serpent"

About 8 m wide × 6 m deep, two storeys with a big roof, peak around 8 m.
Built **in stages**. The file has 12 top-level objects (empties or parents)
named exactly `stage_01` … `stage_12`. Each holds **only the new pieces** for
that stage, so showing stages 1..N gives the building after N challenges.
Every stage must look good as the last visible one (a half-built tavern
should look charming, not broken).

| Node | Adds |
|---|---|
| `stage_01` | Survey stakes at the four corners + string lines, a little cleared dirt patch |
| `stage_02` | Stone foundation ring / plinth |
| `stage_03` | Wooden floor planks on the foundation |
| `stage_04` | Four thick corner posts |
| `stage_05` | Wall frame: beams between the posts, upper floor joists |
| `stage_06` | Walls: plaster panels with timber framing (leave door + window holes) |
| `stage_07` | Front door (rounded top, green) with step and hinges |
| `stage_08` | Windows: frames, panes, shutters, a flower box |
| `stage_09` | Roof: big thatch or tiled roof, overhanging eaves |
| `stage_10` | Stone chimney with a cap |
| `stage_11` | Lanterns: two by the door, one hanging sign bracket; glass parts use a material named `glow` |
| `stage_12` | Hanging sign with a sleepy snake on it, barrels, bench, a crate, potted plants |

Keep the door centred on the front (-Y) side. Under 25k triangles total.

### Nature and props (each under 2k triangles)

`tree_oak.glb`, `tree_pine.glb`, `tree_stump.glb`, `rock_large.glb`,
`rock_small.glb`, `bush.glb`, `flowers.glb` (small cluster), `grass_tuft.glb`,
`fence.glb` (one 2 m section), `log_pile.glb`, `stone_pile.glb`,
`rune_stone.glb` (waist-high standing stone with glowing carved runes; the
rune parts use a material named `glow`), `signpost.glb`, `lantern_post.glb`.

Trees: the stump/trunk base sits at the origin; foliage meshes named
`leaves*` (the game sways them). Trees about 4–6 m tall.

### Characters (each under 3k triangles)

No skeleton needed: the game animates parts in code. Each character is
separate meshes **named exactly** below, each with its origin at its joint
(pivot), parented to `body`.

- `player.glb`: chibi villager founder, about 1.4 m, big head, simple tunic,
  boots, a little satchel. Parts: `body`, `head`, `arm_l`, `arm_r`, `leg_l`,
  `leg_r` (arm pivots at shoulders, leg pivots at hips, head pivot at neck).
- `innkeeper.glb`: Bram, the first villager. Round, apron, moustache, same
  part names as the player.
- `pip.glb`: Pip the serpent mentor, cute and friendly (big eyes, tiny
  scholar's cap or scarf), about 0.6 m tall when coiled upright. Parts:
  `pip_head` and body segments `seg_01` … `seg_08` from neck to tail tip,
  each origin at its own centre.

## Deliverables besides the .glb files

- `art/scripts/*.py`: the Blender Python that builds each model (re-runnable).
- `art/blend/*.blend`: source files.
- `art/previews/*.png`: a render of each model, and for the tavern one render
  per stage (`tavern_stage_01.png` … `tavern_stage_12.png`).
- Any pre-made CC0 asset used must be listed in `art/LICENSES.md` with its
  source URL and licence.
