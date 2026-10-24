### Cooking models (village life: `src/life/cooking`)

Scripts: `art/scripts/cook_common.py` (kitchen palette, bowls, plates, logs, flames, bake/export),
`cook_hearth.py`, `cook_dishes.py`, `cook_tools.py`. Run each with
`powershell -File art/blender.ps1 art/scripts/<name>.py`. Same look as the valley: muted colours,
soft chunky shapes, AO baked into vertex colours; materials starting with `glow` are emissive in game.

#### `cook_hearth.glb`: Bram's hearth (20,572 triangles)

The outdoor cooking fire beside the Sleepy Serpent, placed by the game at world (6.45, 0, -5.4),
its woodpile against the tavern's east wall. Origin: the centre of the fire on the ground; front
(-Y) faces the camera; the cook stands behind it (+Y 0.95) facing the front. Footprint about
5.0 × 2.1 m (x -2.25..2.77, y -0.96..1.16), crane post 1.87 m.

| Node | What | Pivot (Blender) | The game |
|---|---|---|---|
| `base` | fire ring of fieldstones, ash bed, charred logs, crane post with iron arm, garlic and herbs drying, grill, woodpile, worktable (board, carrot coins, salt crock, sugar jar, oil bottle, bowls, spoon crock), potato basket, sack, bucket, dirt patch | origin | static (14,694 tris) |
| `pot` | iron cauldron on its bail and chain | the hook, (-0.36, 0, 1.2) | sways a touch; more while stirring (1,790) |
| `soup` (child of `pot`) | the soup surface with a few chunks; material `soup` | its centre, z 0.745 | recoloured per dish (208) |
| `pot_mouth` (empty, child of `pot`) | the soup surface | | steam, bubbles, things dropped in |
| `fire_pot`, `fire_pan` | flames (`glow_fire`, `glow_flame`) under the pot and the grill | on the embers | flicker; grow while cooking on them (1,680 each) |
| `embers` | glowing coals (`glow_ember`) | (0, 0, 0.05) | pulse (520) |
| `grill` (empty) | top of the grill, (0.47, 0, 0.39) | | sparks, steam |
| `smoke` (empty) | above the fire | | wood smoke |

Previews: `cook_hearth.png`, `cook_hearth_side.png`.

#### `cook_dishes.glb`: the dishes (38,814 triangles)

One top-level object per dish, named by item id, origin at the centre of its base: `bram_stew`
2,160, `carrot_soup` 2,024, `pumpkin_soup` 2,200, `fish_chowder` 1,876, `crayfish_boil` 3,272,
`herb_tea` 2,720, `mint_humbug` 3,800, `grilled_trout` 2,384, `potato_cakes` 2,112,
`cabbage_rolls` 3,340, `egg_omelette` 1,456, `bread_loaf` 1,346, `garlic_bread` 1,788,
`strawberry_tart` 3,136, `fish_pie` 1,380, `shortbread` 1,888, `honey_cake` 1,932. Real-life
size (a bowl is ~24 cm); the game shows one at 1.7× in the player's hands at the reveal.
Preview: `cook_dishes.png`.

#### Hand tools (tools_common.py format: origin at the fist grip, handle up +Z)

| File | Triangles | Held for |
|---|---|---|
| `cook_spoon.glb` | 2,060 | stirring, tasting (bowl dished toward +Y) |
| `cook_knife.glb` | 1,540 | chopping (edge -Y) |
| `cook_pan.glb` | 940 | frying (cooking side +Y) |
| `cook_peel.glb` | 1,028 | Hazel's oven (blade thin along Y) |

Preview: `cook_tools.png`.
