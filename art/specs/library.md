### `library.glb`: "The Scribe's Library" (building 7)

A two-storey library: a **stone ground floor** with tall arched leaded windows and an
arched double door, a **timber-framed upper floor** with a jetty and a front wall-dormer
(another tall arched window), a steep blue-grey **slate roof** and a chimney, and a round
**book turret** on the front-right corner with a timber book room and a tall slate cone.
Outside: a reading bench with books, a crate of books, flower boxes and potted plants, and
**Ysolde's sealed vault** in the front-left yard: a round carved stone hatch in a stone kerb,
its rune ring and coiled-serpent sigil glowing.

Same rules as the tavern and mill: top-level `stage_01` … `stage_14`, each holding only its
new pieces, each stage charming as the last visible one. Built by `art/scripts/library.py`.

- **Origin:** bottom centre of the main hall (the stone block is x −3.5…3.5, y −2.8…2.8).
  Front faces −Y; the door is centred on the front.
- **Footprint:** hall 7.3 × 5.9 m on its plinth; with the turret (centre (3.75, −3.05),
  radius 1.3–1.5) and the yard it covers about **11.3 × 9.3 m** (x −5.7…5.6, y −5.4…3.8;
  the vault sits at (−4.5, −4.0)).
- **Height:** eaves 6.2 m, main ridge 9.0 m (ridge tiles to 9.4), turret cone tip 10.0 m,
  pennant **10.45 m**.
- **Triangles:** 24,991 total. Per stage: 1 = 1,202 · 2 = 1,152 · 3 = 1,961 · 4 = 2,300 ·
  5 = 4,212 · 6 = 1,560 · 7 = 1,872 · 8 = 880 · 9 = 2,700 · 10 = 516 · 11 = 1,804 ·
  12 = 1,006 · 13 = 2,462 · 14 = 1,364. It is right at the budget, so add nothing without trimming.

| Node | Adds |
|---|---|
| `stage_01` | Cleared dirt yard, survey stakes and string for the hall rectangle and the turret circle (centre peg + measuring string), the plan held down by pebbles, mallet and spare stakes |
| `stage_02` | Stone plinth for the hall and the round turret, flagstone floor, two front steps, stones waiting on the left wall line |
| `stage_03` | **Ysolde's vault turns up in the dig:** a stone kerb around a round carved hatch (`vault_hatch`) whose runes glow (`vault_runes`), moss, a heap of dug earth with a shovel, a pickaxe, lifted paving, a marker flag |
| `stage_04` | Ground-floor stone walls to 2 m with the door and window gaps, the lower turret, a stone pile and mortar tub at the back-left |
| `stage_05` | Walls to 3.6 m: stone arches (voussoirs with keystones) and jamb stones round the tall windows and door, corner quoins, side string courses, the turret to match with its two lower arched windows |
| `stage_06` | The book turret rises to 6.4 m with a third window and a corbelled stone crown |
| `stage_07` | Upper floor deck, jetty joist ends and corner brackets, the dark oak frame of the timber storey and the front dormer (posts, rails, chevron braces), spare beams by the right wall |
| `stage_08` | Plaster infill, the side gables with round windows, the dormer gable and cheeks |
| `stage_09` | Glazing: tall arched leaded windows with stone sills below, framed windows with blue shutters above, the dormer's tall arched window |
| `stage_10` | Arched double door (planks, iron straps, ring pulls, threshold) under a carved open-book plaque |
| `stage_11` | Steep slate roof in chunky courses, dormer roof, bargeboards and finials, ridge tiles, stone chimney with a pot (`smoke` empty on top) |
| `stage_12` | The turret's book room (timber drum with four little arched windows) and its tall slate cone with an iron finial and pennant |
| `stage_13` | Reading bench with an open book, cushion, book stack, inkwell and quill; a crate of books; potted plants on the step; flower boxes under the front windows; ivy on the turret |
| `stage_14` | Two hanging lanterns by the door (`glow`), the hanging sign (open book and quill) off the front-left corner, stone posts with a rope round the vault and a lantern post (`glow`) |

Preview renders: `art/previews/library_stage_01.png` … `library_stage_14.png`, and
`library.png` (finished, low angle).

#### Special nodes

| Node | What | Pivot / axis | Game use |
|---|---|---|---|
| `vault_hatch` (mesh, child of `stage_03`) | The round carved stone slab | Origin on its **back edge hinge** at (−4.5, −3.4, 0.03) Blender = glTF (−4.5, 0.03, 3.4). Rotate around local **X**; negative angles lift the front edge (opens toward the back). | Optional: swing it open for the midpoint reveal. Below it is a dark soil pit. |
| `vault_runes` (mesh, child of `vault_hatch`, same origin) | 16 rune glyphs in a ring + the coiled-serpent sigil, all material `glow` | Moves with the hatch | Pulse its emissive (it is the only thing in stage 3 that glows). |
| material `glow` | `vault_runes`; the two door lanterns and the vault lantern (stage 14, inside `stage_14_mesh`) | — | Bloom / evening light. Lantern centres ≈ (±1.07, −3.2, 1.7) and (−5.09, −3.05, 1.0). |
| `smoke` (empty, child of `stage_11`) | Chimney pot top | (−2.2, 1.55, 10.05) Blender = glTF (−2.2, 10.05, −1.55) | Smoke particles. |

No swaying parts. Stage meshes are named `stage_NN_mesh`.
