# Codew Valley

A cozy 3D village-builder that teaches Python. You found a village in an empty
valley, gather wood and stone, and every Python challenge you solve at the rune
stone builds the next part of a building. Pip the serpent teaches you; the
in-game Codex explains every concept, so you never need to search the web.

Phase 0 slice: **The Sleepy Serpent** tavern, built in 12 challenges (print,
strings, variables, maths, joining strings, f-strings, types, string methods,
indexing and slicing, booleans, and a capstone).

## Run it

```bash
npm install
npm run dev      # http://localhost:5190
npm test         # checks every Codex example, quiz and challenge with real Python
npm run build
```

Python is real CPython 3.14 (Pyodide) running in a Web Worker, fully offline.

## Layout

- `src/content/`: the Codex (`codex.ts`), the tavern challenges (`tavern.ts`), content types.
- `src/python/`: the Pyodide worker, runner, and `helper.ts` (shared by the game and the tests; `_pg_grade` runs a challenge's checks).
- `src/game/`: the Three.js world, model loading, procedural placeholders, particles, sound.
- `src/ui/`: HUD, dialogue, rune stone panel, workbench (editor + checks), Codex book, error translator.
- `public/models/*.glb` and `art/`: Blender-made models; `ART.md` is the contract they follow. Missing models fall back to placeholders.
- `graphify-out/`: code map. Read `GRAPH_REPORT.md`, refresh with `graphify update .`.

## Writing a challenge

Each challenge in `src/content/tavern.ts` has a story intro, Codex pages, a
quiz, a task, starter code, Python checks, three hints, a reference solution
and a list of plausible mistakes. `npm test` fails unless the solution passes,
every mistake fails, the starter fails, and the quiz answer matches what Python
really prints. Checks can call `check(cond, msg)`, `expect_lines([...])` and
`rerun(changed_source)` (to make sure typed-in answers don't pass).

Saves live in `localStorage` under `pyvillage.save.v1`. Dev hook in the
console: `__pv.give()`, `__pv.stage(n)`, `__pv.build(n)`.
