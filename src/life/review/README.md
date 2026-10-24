# Wren's daily practice (`src/life/review`)

Spaced practice that keeps the course's Python fresh, during the course and long after it.
Once the mill stands, Wren (the miller, now also the farmer) has one fresh question waiting
each valley day; solving it fills a basket of crops. Extra practice after the daily one has
no reward. The Sharpness page shows every learned building's Python as a plant that wilts
when it hasn't been practised.

## Files

| File | What |
|---|---|
| `rng.ts` | seeded randomness (`makeRng`, `seedOf`) and word pools |
| `build.ts` | the template format (`Template`, `Spec`, `Variant`) and `build(spec)`, which writes the starter, solution, wrong answers and Python checks |
| `question.ts` | `makeQuestion(template, seed)`; plain data, imported by the content tests |
| `templates/*.ts` | the question templates, one file per building (mixed ones live with their latest building) |
| `memory.ts` | per-topic memory (Leitner boxes) in `lifeSave("review")` |
| `pool.ts` | **the pool API** for other systems (below) |
| `index.ts` | the village side: Wren's slate by the field, the daily flow, the basket, the HUD button |
| `sharpness.ts` | the Sharpness page |
| `lines.ts` | Wren's words for all of this |

## The pool API (for fishing, cooking, anything else)

```ts
import { drawQuestion, openQuestion, recordAnswer } from "../review/pool.ts";

const q = drawQuestion({ lean: ["dock"], difficulty: 1 });  // null until the mill is finished
if (q) openQuestion(ctx.app, q, (result) => {               // the workbench, in practice mode
  if (result.solved) giveBonusFish(result.hints);           // recordAnswer is already done for you
});
```

- `drawQuestion({ lean?, difficulty?, mixed?, rng? })` picks a question the player can do
  (only finished buildings' Python), preferring topics that are due or weak. `lean` names
  building ids to favour (a fishing minigame might lean on `dock`); `rng` makes the pick
  repeatable. Returns a `Question` (`template`, `seed`, `topics`, `difficulty`, `mixed`,
  `made`) or `null`.
- `openQuestion(app, q, done, opts?)` opens it in the workbench and calls `done({ solved,
  hints, fails })` when the player leaves; the answer has already gone into the memory.
- `recordAnswer(q, result)` feeds the memory yourself if you show a question some other way.
- `questionById(template, seed)` rebuilds a saved question.

## Writing a template

A template is `{ id, topics, difficulty, make(rng) }`; `make` returns a `Spec` (see the
comments in `build.ts`). `npm test -- review` builds every template with seeds 1–20 and
checks: the solution passes; the starter, every `wrong` and a typed-in copy of the output
fail without tripping the checker; the same seed builds the same question; task and hints
never contain the output; nothing uses Python taught after the template's latest topic.
`npm test -- review:dk-` runs only ids starting with `dk-`; add `-v` to read each failure
message.

The rules (all of `CHALLENGES.md` applies):

- **Only what the topics teach.** `topics` are building ids; the template may use what
  `SYLLABUS.md` lists as "Known so far" after the latest of them, nothing from "Not yet".
- **Make them think.** The task says the goal in story words, never the exact output, the
  exact line or the operator. Describe the output's shape in words ("just the name", "one line
  per crop: its name, a colon and a space, then the count"). Data names are given (they are
  in the starter); the learner chooses every other name. Functions and classes are named,
  since Wren calls them.
- **Randomise** the numbers, names, words and, where it fits, the twist (heaviest, then
  second heaviest, then lightest over a limit), each twist with its own task and hints.
- **Variants** re-run the program with other values (`data`), other starting files
  (`files`) or extra code that calls the learner's functions (`drive`). Include the edge
  cases (ties, nothing found, exactly on the limit, an empty list) and give each a `note`
  that says what is special about it. At least two variants.
- **Three hints:** a nudge with no code; the technique shown on other names and values; the
  near-answer with one piece left as `___`.
- **Wrong answers** (two to four) are the real mistakes people make: off by one, `<` for
  `<=`, `print` instead of `return`, the first match instead of the last, a hard-coded number.
  Each must fail.
- `needs` makes the program use the topic's idea (`["while", "Today's question is practice
  for while loops: let one do the walking."]`), so a later shortcut doesn't skip the practice.
- `difficulty`: 1 one idea, 2 two steps or an edge case, 3 a small whole program.
