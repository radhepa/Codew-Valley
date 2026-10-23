# `dock.glb`: Fisher's Dock (building 3)

Marlo's thatched fisher's hut on the shore, a wooden pier on piles reaching about 7 m out
over the pond, and Willowmere's old bronze bell rehung on a timber frame at the pier head.
Built by `art/scripts/dock.py` (12 cumulative stages; previews `art/previews/dock_stage_01..12.png`
and `dock.png`).

## Size, origin, water

- Origin: bottom centre of the hut (ground level, z = 0). The front (door, pier) faces -Y.
- Footprint about **8.2 m wide × 13.7 m deep**: x from -4.4 (net rack) to +3.8 (crates),
  y from +3.0 (behind the hut) to -10.0 (front of the pier head; the marker buoy floats at -10.45).
- Hut: 4.0 × 3.2 m walls on a 0.46 m stone plinth, thatch ridge 4.6 m (ridge roll top 5.4 m,
  crossed poles 6.0 m).
- Deck and hut floor at **z = 0.6**. The shoreline (stone quay face) is at **y = -2.85**; the pier
  runs from there to y = -8.4, then the pier head (4.1 m wide) to y = -9.95.
- **Water is assumed at z = -0.3** (the boat's waterline, the floats). The piles reach down to
  z = -1.6, so the pond bed under the pier should be deeper than that or simply hidden by the
  water. The preview pond is preview-only and not in the .glb.
- Note for placement: the pier needs about 7.5 m of water in front of the shore, more than the
  current `POND` radius (4.2 m) in `world.ts`.

## Stages

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch, survey stakes and string for the hut, a shore stake with a cork float line across the water to a red marker buoy where the pier will end, the plan held down by pebbles, a mallet and spare stakes |
| `stage_02` | Stone plinth for the hut, a dry-stone quay along the waterline with three steps down to the water, leftover stones |
| `stage_03` | Six rows of piles driven into the pond bed with cap beams and cross braces, a ledger on short posts at the landing, two tall bollard piles at the pier head, spare piles and a maul behind the hut |
| `stage_04` | Stringers and deck planks: the landing by the door, the 1.8 m pier, the pier head; spare planks behind the hut |
| `stage_05` | Hut frame: sills and floor, corner posts, door and window framing, plates, rafters, ridge beam and purlins, a ladder against the left wall |
| `stage_06` | Board-and-batten walls with the gables filled in, three glazed windows, the door casing |
| `stage_07` | Thick reed thatch in four overlapping courses, a rope-bound ridge roll, crossed ridge poles at both gables, spare reed bundles |
| `stage_08` | Green plank door with strap hinges, blue shutters, a stovepipe through the thatch (`smoke`), a bench with a pot of thrift, a bucket |
| `stage_09` | Pier fittings: a rail along the right side, bollards and rope fenders on the left, a ladder down into the water at the head, a rope coil |
| `stage_10` | Marlo's rowboat `boat` tied up along the left of the pier, with oars and a heap of net, and two mooring lines |
| `stage_11` | Fishing gear: net rack with `net_01`, `net_02` over the pier rail, three rods by the door, a rod in a holder at the head with its line and float, crates (one full of fish), two barrels, two lobster pots, floats on the wall, rope coils |
| `stage_12` | The bell frame at the pier head with Willowmere's old bronze `bell` (verdigris, a glowing rune band), two lanterns on posts (`glow`), a carved fish sign on a post at the landing |

## Special nodes

| Node | Type | Pivot (Blender x, y, z) | What the game does |
|---|---|---|---|
| `bell` | mesh (stage 12) | (0, -9.2, 2.94): on the yoke axle | Swings around its local **X** axis (Blender X = glTF X). Bell, headstock, clapper and pull rope are one mesh, so they swing together. A small swing (±15–25°) when a challenge is solved; the rune band uses `glow`, so it can pulse with the ring. |
| `boat` | mesh (stage 10) | (-1.66, -5.95, -0.3): centre of the hull on the waterline | Can bob (a few cm up and down, a degree or two of roll around Y). The mooring lines are static, so keep it small. |
| `net_01` | mesh (stage 11) | (-3.5, 0.1, 2.09): on the drying-rack bar | Gentle sway around its local Y axis (the bar). |
| `net_02` | mesh (stage 11) | (0.84, -6.37, 1.57): on the pier rail | Gentle sway around its local Y axis (the rail). |
| `smoke` | empty (stage 8) | (1.0, 0.8, 5.4): above the stovepipe hat | Chimney smoke particles. |
| `glow` | material | – | Lantern glass at the pier head (stage 12) and the bell's rune band (stage 12). |

All five names are exact and unique. Stage empties keep their pieces at their world positions
(each child's origin is its pivot).

## Triangles

19,402 in total (budget 25k).

| Stage | Tris | Stage | Tris | Stage | Tris |
|---|---|---|---|---|---|
| 01 | 1,154 | 05 | 1,088 | 09 | 1,568 |
| 02 | 1,536 | 06 | 1,704 | 10 | 1,300 |
| 03 | 1,512 | 07 | 1,560 | 11 | 3,908 |
| 04 | 660 | 08 | 1,068 | 12 | 2,344 |

## Colours

Shared palette names plus dock-only ones added in the script: `driftwood`, `reed`, `reed_dark`,
`rope`, `net`, `cork`, `boat`, `fish`, `fish_dark`, `bronze`, `bronze_dark`, `verdigris`, `pot`.
Baked AO is in the vertex colours (`COLOR_0`), as in every other model.
