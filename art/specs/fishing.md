# Fishing models (src/life/fishing)

Built by `art/scripts/fishing_gear.py` and `art/scripts/fishing_catch.py` (shared kit
`fishing_kit.py`), headless: `powershell -File art/blender.ps1 art/scripts/fishing_gear.py`.

## `fishing_rod.glb`: Gran's rod (hand tool "fishing_rod")

Split cane with green silk wraps, a cork grip mended with Gran's teal cloth, a lucky knot of red
wool, a walnut centrepin reel with brass rims. Origin at the fist grip, rod up +Z, reel and guides
on -Y (tool format of `tools_common.py`; registered with `beta 1.25, lead "down", scale 1.15`).

| Node | What the game does |
|---|---|
| `fishing_rod` | Held in the player's right hand during the fishing clips. |
| `fishing_rod_tip` | Upper section, pivot on the ferrule (z 0.68). Turned about local X to bend the rod toward the line. Kinks a touch to +X ("casts a bit to the left"). |
| `fishing_rod_end` | Empty at the tip-top ring: where the line is tied. |

Triangles: 7,008 (base 5,898, tip 1,110). Length 1.25 m (1.44 m in game).

## `fishing_bits.glb`: float and water effects

| Node | Use | Tris |
|---|---|---|
| `float` | Cork float, red cap and quill; origin on the waterline (drawn ×2.8). | 1,156 |
| `ripple` | Unit ring (radius 1), scaled and faded by the game. | 768 |
| `splash` | A crown of droplets, radius about 0.14. | 2,728 |
| `drop` | One droplet. | 144 |

The game swaps the effect materials for one fading foam material.

## `fishing_catch.glb`: the ten catches

One object per item id, laid out in a row for the AO bake; the game recentres each clone. Fish lie
along X, head +X, back up; true-ish sizes. Journal art (transparent renders) in
`src/life/fishing/img/<id>.png`; contact sheet `art/previews/fishing_catch.png`.

| Object | Tris | Object | Tris |
|---|---|---|---|
| `minnow` | 8,488 | `eel` | 7,636 |
| `perch` | 12,756 | `crayfish` | 9,388 |
| `brown_trout` | 25,424 | `golden_koi` | 21,052 |
| `carp` | 20,656 | `old_boot` | 3,770 |
| `pike` | 23,968 | `willowmere_coin` | 4,396 |

Total 137,534 (only one is ever on screen). The file is 4.3 MB, loaded lazily once the rod is yours.
