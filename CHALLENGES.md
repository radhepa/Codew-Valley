# Challenge checklist

The user's words: "If we give the exact variables and output, it doesn't really let us think."
Every challenge in buildings 3–12 must pass all of this before it is committed. It came out of the tavern + mill review (commit 6a4f9d1); `SYLLABUS.md` says what each building teaches.
Each building gets an independent review against this list after it lands.

## Solvable from the screen
- The intro, the first Codex page (the Learn tab), the task and the starter together hold everything needed. No outside knowledge.
- No Codex example, intro example or starter is the solution with the names changed back. Teach the idea with other names and values (eggs, oven, basket), never this task's.

## Makes the player think
- The task describes the goal in story words ("at least one measure of oil for every lantern"), not the operator or method ("use >=", "use .strip()").
- Don't print the exact expected line in the task unless the format itself is the lesson; describe what it must say instead.
- Starters give the given values and at most a plan in comments ("# 1. The shutters"), not the shape of each line.
- Early challenges of a building can be gentler; the last few should combine ideas.

## Hints (exactly three)
1. Nudge: what to think about, a question, or "work it out on paper first". No code.
2. Technique: the tool or pattern, shown on other values.
3. Near-answer: the shape of the line with one piece left to fill in. Never the whole solution.

## Checker messages
- Say what is wrong ("the leftover is too big", "Nearly! + never adds spaces"), never paste the correct expression or line.
- Split checks by mistake so each message fits the mistake that triggered it.
- Re-run with other values (`again(old, new)` in tavern.ts, `again(*swaps)` / `expect_when` in mill.ts) so typed-in answers and hard-coded numbers fail. Include edge cases (exactly equal, zero, the boundary).
- Add a `wrong` entry for every new check, and confirm with `node scripts/test-content.mjs -v` that each one fails for the intended reason.
- Printed output is checked without minding capitals: `out`, `lines`, `rerun` lines, regex on them and text wrapped in `as_output(...)` all compare case-blind, so `hello, valley!` passes for `Hello, valley!`. A challenge whose solution uses `upper`, `title`, `capitalize` or `swapcase` is strict automatically; set `strictCase: true` when the task asks for particular capitals some other way. Variables and returned values are always compared exactly. `npm test` swaps the capitals of the text in each solution's print lines and fails if a lenient challenge then rejects it.

## Done means
- `npm test` and `npx tsc --noEmit` green.
- Cozy voice kept.
