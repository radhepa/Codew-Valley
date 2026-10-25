# Characters

All characters are in one soft **Animal Crossing** style, chosen by the user for Marlo the
fisher and applied to everyone on 2026-10-23. There is no triangle limit (see ART.md); counts
are listed so the game can plan for them.

Each is built by `art/scripts/<model>.py` on the shared kit `art/scripts/villagers_common.py`
(geometry helpers, `Garment`, `Head`, default arm/leg, `build`). Output:
`public/models/<model>.glb`, `art/blend/<model>.blend`, `art/previews/<model>.png` plus
`<model>_closeup.png` (head and chest) and a few extra shots per model (`_back`, prop close-ups).

## The style

- Big round head (ellipsoid, ~0.3 m radius) on a short soft body (~0.8 m garment).
- Face: glossy black oval eyes with one small white highlight (some characters add a
  skin-coloured half-lid for a smug or calm look), soft button nose, blush, a small mouth.
- Hair, beards, brows and boots sculpted from metaballs, decimated to ~40%.
- Clothes with real construction: hems, seams, running stitches, buttons with thread holes,
  pockets, belts and buckles. Mitten hands with a thumb.
- Smooth shading everywhere; soft AO baked into vertex colours (`COLOR_0`) as before.

## Parts and pivots (villagers, player, Bram, Wren)

- `body` is the root, origin on the ground at the feet. Faces -Y; the character's left is +X.
- `head` (pivot at the neck), `arm_l` / `arm_r` (pivots at the shoulders), `leg_l` / `leg_r`
  (pivots at the hips), all parented to `body`.
- **Accessories** are separate meshes parented to the part that holds them, origin at the grip.
- Hats, hair, glasses, the monocle and goggles are part of `head`; coats, aprons, belts,
  satchels, backpacks, the mayor's chain and the captain's cape are part of `body`; the
  captain's pauldron is part of `arm_l`.

## The list

| model | Who | Tris | Size x×y×z (m)* | Accessory (parent) | Silhouette |
|---|---|---|---|---|---|
| `player` | the player | 113,178 | 0.69×0.67×1.49 | none | Chestnut side-parted hair with a cowlick, blue belted tunic with a sprout badge and zig-zag hem, satchel across the chest, laced boots |
| `innkeeper` | Bram | 108,260 | 0.86×0.70×1.46 | `mug` (arm_r): wooden tankard with pewter hoops and a polishing cloth | Round belly, bald crown with a horseshoe of hair and one curl, handlebar moustache, green vest with watch chain, white apron, striped towel on the shoulder |
| `miller` | Wren | 126,646 | 1.05×0.93×1.53 | none | Wide coiled-straw hat with a green band and wheat ears, copper bob, freckles, red polka-dot bandana, mustard tunic, burlap apron with flour |
| `fisher` | Marlo | 74,222 | 1.22×1.11×1.47 | `rod` (arm_r): cork grip, brass reel, bent blank with wrapped guides, a fly on the keeper, float and hook; `tackle_box` (arm_l) | Ribbed knit beanie with pinecone and feather, cloud beard and moustache, toggled oilskin coat, green scarf, rubber boots |
| `merchant` | Sable | 119,704 | 1.07×0.80×1.73 | `purse` (arm_l): leather coin purse with drawstrings and coins | Puffy plum cap with a long barred red plume, smug squint, gold-tooth grin, goatee, patchwork coat of pockets, rust sash |
| `baker` | Hazel | 122,180 | 1.08×0.84×1.54 | `rolling_pin` (arm_r) | Puffy mushroom toque, Bram's `hair` colour in a bun, freckles, rose dress, lace apron with flour |
| `smith` | Ingrid | 126,068 | 0.86×0.77×1.45 | `hammer` (arm_r): cross-peen, wrapped ash handle | Broadest build, blond braids, short rolled linen sleeves, riveted leather apron with tools, gauntlets, soot smudge |
| `librarian` | Odo | 93,872 | 0.73×0.77×1.44 | `books` (arm_l): stack of 4 books with ribbons and a loose page, held out front | Thinnest, bald crown with grey tufts and a cowlick, round brass spectacles, quill, ink-stained indigo robe, rope belt |
| `herbalist` | Mirela | 138,668 | 0.80×0.69×1.39 | `basket` (arm_l): woven basket of herbs and flowers | Long dark hair, flower crown, calm half-lids, knitted sage shawl, embroidered earthy skirt |
| `mayor` | Thistle | 103,242 | 0.92×0.75×1.44 | `cane` (arm_r): tip at the ground | Roundest, plum chaperon hat with its tail over the left shoulder, cloud brows and curled moustache, double-breasted plum coat, gold chain with thistle medallion |
| `tinker` | Tock | 124,236 | 0.68×0.64×1.30 | `wrench` (arm_r): adjustable wrench | Smallest (built at 0.85 scale), spiky hair, brass goggles, rust shirt, leather vest, tool belt, gear backpack |
| `captain` | Rook | 120,138 | 0.68×0.70×1.41 | `sword` (**body**): sheathed at the left hip | Grey swept-back hair and ponytail, short beard, stitched scar past the right eye, leather jerkin, slate-blue shoulder cape, steel pauldron |
| `lord_vane` | Aldous Vane | 122,834 | 0.94×0.90×1.77 | `ledger` (arm_l) | Tallest, wide black plumed hat, smug half-lids, monocle on a chain, thin moustache, burgundy frock coat with tails, ruff, riding boots |

\* Bounding box including hats, feathers and props.

### Pip

`pip`: Pip the serpent mentor, **80,332** tris, 0.45×0.48×0.63 m. A plump green snake
(`#6CC46A`) with a cream belly band, darker spots, big black oval eyes, blush, a tiny smile
and a navy mortarboard with a gold tassel. Same node format as before: `pip_head` and
`seg_01` … `seg_08`, all top-level, each origin at its own centre (on the body centre line,
middle of its length). Segments overlap with tucked-in ends, so the game's ±4% pulse and the
head bob never open gaps (checked in `art/previews/pip_pose.png`).

## Joint positions (metres, in `body` space)

| model | neck (head pivot z) | shoulders (x, z) | hips (x, z) |
|---|---|---|---|
| player | 0.78 | ±0.18, 0.69 | ±0.09, 0.36 |
| innkeeper | 0.85 | ±0.20, 0.715 | ±0.105, 0.34 |
| miller | 0.825 | ±0.17, 0.705 | ±0.085, 0.39 |
| fisher | 0.80 | ±0.185, 0.70 | ±0.09, 0.36 |
| merchant | 0.80 | ±0.182, 0.695 | ±0.09, 0.36 |
| baker | 0.78 | ±0.175, 0.68 | ±0.085, 0.35 |
| smith | 0.835 | ±0.232, 0.68 | ±0.11, 0.36 |
| librarian | 0.84 | ±0.152, 0.69 | ±0.075, 0.36 |
| herbalist | 0.80 | ±0.165, 0.665 | ±0.075, 0.36 |
| mayor | 0.80 | ±0.235, 0.68 | ±0.12, 0.36 |
| tinker | 0.68 | ±0.157, 0.595 | ±0.0765, 0.306 |
| captain | 0.82 | ±0.19, 0.70 | ±0.092, 0.36 |
| lord_vane | 1.00 | ±0.168, 0.885 | ±0.076, 0.48 |

## Notes for the game

- Animate exactly as before: swing `arm_*` / `leg_*` around X at their pivots, bob or turn
  `head`. Held props come along automatically.
- Some arms are posed out or forward at rest to hold their props clear of the body (Marlo's
  rod arm, Odo's books, Mirela's basket, Ingrid's hammer, Sable's purse); big swings on those
  arms may push props into the body, so keep their swing small.
- Bram's `mug` was checked through his polishing swing (`arm_r` rotation.x from -0.9 to -0.3):
  it never enters the belly or apron.
- The mayor's cane reaches the ground and the captain's sword hangs at his hip, so a large
  swing of the mayor's `arm_r` or the captain's `arm_l` will clip; small swings are fine.
- Hair that hangs down the back (Mirela, Rook's ponytail, Ingrid's braids) belongs to `head`,
  so a big head turn can swing it through the shoulders.
- Tock is about 15% smaller and Lord Vane about 20 cm taller than the others, so put name
  tags and speech bubbles at each model's own head height.
- Previews were rendered with several Blender builds running at once; a couple of runs
  crashed or rendered black under that load and were simply re-run.
