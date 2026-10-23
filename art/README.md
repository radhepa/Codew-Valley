# Python Village art

Models for the game, built entirely by Blender Python scripts (Blender 5.2). The contract
for names, pivots and budgets is `ART.md` at the repo root.

## Look

Soft and atmospheric, after the user's reference (Pokémon Legends: Arceus): muted natural
palette, chunky low-poly shapes, and **ambient occlusion baked into vertex colours**
(glTF `COLOR_0`) on every model. Three.js `GLTFLoader` turns `vertexColors` on
automatically. Keep it on, because it multiplies the base colour. Previews use AgX
(Punchy), a warm sun, a gradient sky and distance haze. The game should do the same
(tone mapping, fog, hemisphere light). See `../ART.md` for the contract.

## Layout

| Path | What |
|---|---|
| `scripts/common.py` | Palette, `Part` mesh builder, AO bake, export, preview rig (meadow, hills, clouds, fog) |
| `scripts/tavern.py` | `tavern.glb`, 12 cumulative stages + per-stage previews |
| `scripts/pip.py`, `player.py`, `innkeeper.py`, `chibi.py` | characters |
| `scripts/nature.py` | trees, rocks, plants and props (`ONLY=[...]` to rebuild some) |
| `scripts/scene_preview.py` | preview-only village scene that imports the exported `.glb`s |
| `blend/` | source `.blend` per model |
| `previews/` | one render per model, `tavern_stage_01..12.png`, `village_scene*.png` |

## Rebuilding a model

In the open Blender (Scripting tab or the MCP):

```python
path = r"C:\Users\minal\python-village\art\scripts\tavern.py"
exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
```

Or headless: `blender -b --python art/scripts/tavern.py -- ` (each script runs `main()`
as `__main__`). Every run clears the open file first, then builds the model, bakes the AO,
exports `public/models/<name>.glb`, renders `art/previews/<name>.png` and saves
`art/blend/<name>.blend`.
