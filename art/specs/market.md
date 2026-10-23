### `market.glb`: Market Square (building 4)

A cobbled square with five striped market stalls round a roofed stone well, bunting on four
tall corner poles, and a notice post by the entrance. Same rules as the mill: top-level
`stage_01` … `stage_14`, each holding only its new pieces, each stage charming as the last
visible one. Built by `art/scripts/market.py`.

**Footprint** about **14.6 m wide × 13.3 m deep** (x −7.3 … 7.3, y −7.0 … 6.3): the paved
square inside the kerb is 13.2 × 11.2 m, plus a dirt rim and a small dirt apron at the
entrance (front, −Y). **Height**: well roof ridge 3.0 m, stall roofs 2.5 m, bunting poles
4.9 m (pole tops). The **origin is the centre of the square at ground level, under the
well**. The open side (the way in) faces the front (−Y). Ground: the cobbles' top is at
z = 0.1 m, so characters walking on the square should stand at about 0.1 m.

Layout: three stalls along the back (+Y) facing the front, one on each side facing inward,
the well in the middle, benches either side of the well, the notice post front-left, a
handcart front-right.

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt patch and entrance apron, low pegs and string along the line of the future kerb, four tall flagged corner stakes, a ring of pebbles round the old well shaft with a centre peg, the plan sheet held down by pebbles, a mallet and a bundle of spare stakes |
| `stage_02` | Raked gravel bed and a stone kerb all round the square, a crate of cobbles waiting |
| `stage_03` | Cobbles: staggered rows, two rings of wedge stones round the centre, the old shaft opening uncovered; five flat unpaved rectangles (the stall plots, covered by the stalls later) |
| `stage_04` | The well rebuilt: three stone courses, a rounded rim, water, and the old keystone with a carved rune facing the front (`glow`); a bucket on the rim and a coil of rope |
| `stage_05` | Well roof: two posts with braces, a windlass with a crank, a shingled gable roof with knobbed ends, and the hanging bucket (`bucket`) |
| `stage_06` | Five bare stall frames: posts on stone pads, roof beams, plank counters, back shelves; a sawhorse and spare planks |
| `stage_07` | Striped cloth roofs on every stall; the front flaps with scalloped valances are `awning_01` … `awning_05` |
| `stage_08` | The village's own goods: produce stall (apples, cabbages, carrots, pumpkins, baskets of potatoes, onion strings) and bread & flour stall (loaves, buns, Wren's flour sacks, a wheat sheaf) |
| `stage_09` | Marlo's fish stall (fish on ice, fish hung from the beam, barrel, coiled net with floats) and the cloth & pottery stall (folded cloth, bolts, jugs, big pots, a rolled rug) |
| `stage_10` | Sable's trading stall, the grandest: brass balance, open chest of coins, bottles and trinket boxes, rugs over the rail, an iron-banded chest, rolled rugs, Sable's hanging coin sign |
| `stage_11` | Notice post near the entrance: post on a stone, board with a little shingle roof, the first notices (market days, a lost goat, a child's drawing of Pip), paste pot and brush |
| `stage_12` | Bunting: four tall poles at the corners with pennants and brass knobs, five strings of pennants (`bunting_01` … `bunting_05`) |
| `stage_13` | Lived in: two benches by the well, a handcart of sacks, barrels and stacked crates between the stalls, sacks, a water trough, a broom |
| `stage_14` | Opening day: lanterns on every stall and on the two front poles (`glow`), flower planters at the entrance, and **Lord Vane's writ** nailed over the notices with a red wax seal and black ribbon (the end of Act I) |

Stalls (centre, facing), so the game can place Sable and shoppers:

| Stall | Centre (Blender x, y) | Faces | Goods |
|---|---|---|---|
| 1 | (−4.3, 4.4) | front (−Y) | produce |
| 2 | (0.0, 4.5) | front (−Y) | **Sable's** trading stall (stand Sable behind it at about (0, 4.9)) |
| 3 | (4.3, 4.4) | front (−Y) | cloth and pottery |
| 4 | (−5.5, 0.2) | +X | fish |
| 5 | (5.5, 0.2) | −X | bread and flour |

Counters are 0.9 m high (top at z ≈ 1.0) at the stall front; shoppers stand about 1.2 m in
front of a stall's centre.

**Triangles**: **24,120** total (by stage: 1392, 1328, 3474, 976, 860, 1908, 1852, 2910, 1836, 1764, 456, 1280, 2072, 2012).

#### Special nodes

| Node | Stage | Pivot (object origin, Blender x, y, z) | What the game does |
|---|---|---|---|
| `awning_01` | 7 | (−4.3, 3.67, 2.18) | sway around **Blender X** (glTF X): a few degrees, slow; pivot is the stall's front beam |
| `awning_02` | 7 | (0.0, 3.72, 2.18) | same, around X |
| `awning_03` | 7 | (4.3, 3.67, 2.18) | same, around X |
| `awning_04` | 7 | (−4.77, 0.2, 2.18) | same, but the beam runs along **Blender Y** (glTF −Z), so sway around that axis |
| `awning_05` | 7 | (4.77, 0.2, 2.18) | same as `awning_04`, around Blender Y (glTF −Z) |
| `bucket` | 5 | (0, 0, 1.49), top of its rope under the windlass | optional gentle swing around X (pivot at the rope top) |
| `bunting_01` … `bunting_05` | 12 | the string's first anchor at a pole top (z 4.45) | optional: a slight sway around the line between its two anchors (or leave static) |
| material `glow` | 4 | keystone rune on the well's front face, about (0, −0.99, 0.38) | soft glow; the chronicle page for this building is about the stones dimming, so it can be dimmed or pulsed |
| material `glow` | 14 | 7 lantern glasses: one on the left front post of each stall and one on each front bunting pole | warm lantern light, bloom in the evening |

No node has rotation or scale: every special node is located only, so animating its local
rotation turns it around its own origin. There are no `smoke` empties (nothing burns here).

Preview renders: `art/previews/market.png` and `market_stage_01.png` … `market_stage_14.png`.
