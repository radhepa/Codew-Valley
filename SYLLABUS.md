# Syllabus: buildings 3–12

How the Python course runs from the dock to the observatory. Each building is
written in its own session, often at the same time as others, so this file is
what keeps them one course: what each building teaches, in what order, what it
may assume, and what it must not use yet.

Read with: `CHALLENGES.md` (the quality bar, required), `STORY.md` (acts,
villagers, Chronicle pages, writing rules), `ROADMAP.md`, the villager's
profile in `src/content/people/<model>.ts` (their voice), the building's
model spec in `art/specs/<id>.md` (one challenge per stage), and the two
finished buildings `src/content/tavern.ts` and `src/content/mill.ts` (the
format, the check helpers, the tone).

## Rules for every building

- **One challenge per model stage**, in stage order. The stage's pieces are
  the challenge's `part` (short, e.g. "Pier piles"). Counts: dock 12, market
  14, bakery 14, forge 15, library 14, apothecary 14, town hall 14, clock
  tower 14, guild hall 16, observatory 16. `npm test` checks the count.
- **Only what has been taught.** A building may use everything from earlier
  buildings and nothing from later ones, in its tasks, starters, solutions,
  quizzes, Codex examples and hints. The "Known so far" line under each
  building is the full list. If a task would be nicer with a later tool, find
  another task. `npm test` rejects Codex pages from a later building; the rest
  is on you (and the reviewer).
- **Ascend.** The first challenge of a building is gentle and leans on one new
  idea. Each later one adds a little. The last two or three combine the
  building's ideas with older ones, and the final challenge is a small whole
  program in the building's story. A building ends harder than it began, and
  each building starts a little harder than the previous one started.
- **Show the topic.** Every challenge has a short `topic` ("while loops",
  "break and continue"). It is shown on the rune stone and in the workbench.
- **Teach in the Codex.** Each new idea gets a Codex page in
  `src/content/pages/<id>.ts` (ids below; adjust if a page needs splitting, but
  keep ids unique and lowercase-with-dashes). Every example's `out`/`err` is
  run by the tests. Examples use other names and values than the task
  (CHALLENGES.md).
- **Story.** Fill `villager`, `opening`, `finale`, `chatDuring`, `chatAfter`,
  every challenge's `intro` and `done`, and the building's `chronicle` (Ysolde's
  page, 3–4 short paragraphs in her voice, see tavern.ts and mill.ts). Keep the
  story beats in STORY.md, and keep the villager consistent with their profile.
  Pip hints, never answers; Pip is dramatic, warm, and occasionally hisses an
  s ("Ssso").
- **Materials** go up slowly: the dock costs 2–7 wood + stone per part, and
  each later building adds about one, up to 8–13 at the observatory. A few
  parts can be free (stone-only, wood-only or 0) for pacing.
- **Python in this game:** each run starts in an empty folder (plus the
  challenge's `files`), `input()` gets no input (never use it), a program is
  stopped after 5 seconds in the game, and the tests give each run a budget of
  3 million lines, so a listed mistake that loops forever fails instead of
  hanging. Randomness must be checkable: run variants with a fixed seed in the
  checks, e.g. `rerun("import random\nrandom.seed(4)\n" + src)`, or check
  properties that hold for any roll.
- **Starting files** (town hall onward): put them in the challenge's `files`
  (name → text). The workbench shows them read-only, and every run and rerun
  starts with fresh copies. Checks can read files the program wrote (the
  folder is the current directory) and see `files`; read what the main run
  wrote before calling `rerun`, which resets the folder.

## Known so far after the mill

`print` (with commas), strings and quotes, comments, variables, `+ - * / //
%`, `+=` `-=` `*=`, joining and repeating strings, f-strings, `int()`
`float()` `str()` and `type()`, string methods `.upper() .lower() .title()
.strip() .replace() .count() .find() .startswith() .endswith()`, `len()`,
indexing and slicing strings, booleans, comparisons, `if` / `elif` / `else`,
`and` / `or` / `not`, `in` on strings, nested ifs, truthiness and `% 2`,
chained comparisons, `min()` `max()` `abs()` `round()` on numbers,
indentation, reading errors (`SyntaxError`, `NameError`, `TypeError`,
`ValueError`, `IndentationError`, `IndexError`, `ZeroDivisionError`).

Not taught: `**`, `bool()`, `.split()`/`.join()`, and every structure
(lists, loops, functions). Check the Codex pages in `src/content/codex.ts`
when unsure.

---

## 3 · Fisher's Dock · loops that wait (`while`)

- **Villager:** Marlo (`fisher`), arrives at the start. Quiet, old, raised on
  his grandmother's stories of a bell under a lake.
- **Beat:** building the pier, Marlo fishes up Willowmere's old bell; rehung
  at the pier head (stage 12), it rings whenever a challenge is solved.
- **Chronicle III:** *The Bell*: it rang every time a new speaker learned a
  rune.
- **Codex pages:** `while`, `loop-counters`, `endless-loops`,
  `break-continue`, `random`, `walking-strings`.
- **Plan** (12):
  1. `while`: repeat while something is true; a counter that climbs.
  2. Counting down and counting in steps; where the loop stops (`<` vs `<=`).
  3. Adding up until a target is reached, when you can't know the number of
     rounds in advance (the real reason `while` exists).
  4. A loop whose condition is not a counter (doubling, halving, a tide that
     rises); choosing the stop condition.
  5. Endless loops: a starter that never stops; find why and fix it (the
     variable the condition needs is never changed). Teach the Stop button.
  6. A decision inside a loop: an `if` in the body (every third plank, only
     the rounds when something happens), counting the matches.
  7. `while True` + `break`: wait for the right moment.
  8. `continue`: skip a round without stopping the loop.
  9. `import random`: `random.randint`, `random.random`; what a seed is.
  10. A simulation: keep casting until a bite, count the casts, with a safety
      limit (a condition with `and`).
  11. Walking through a string with an index (`while i < len(text)`), counting
      or building something from it: Gran's knotted message.
  12. Capstone: raising the bell. A whole program with `while True`, `break`,
      `continue`, random (checked with a seed), counters and an f-string
      report.
- **Known so far:** the mill's list, plus `while`, `break`, `continue`,
  `import random` (`randint`, `random`, `seed`).
- **Not yet:** lists, `for`, `range`, functions.

## 4 · Market Square · lists

- **Villager:** Sable (`merchant`, they/them), arrives at the start. A
  fast-talking trader; old rival Fennick Gale.
- **Beat:** traders bring news and people. At the opening (finale), Lord
  Aldous Vane arrives with a writ: no royal charter by midsummer and the
  valley belongs to the Vane Trading Company. **End of Act I**, and the rank
  becomes **Village** (4 buildings). Leave it on that cliffhanger, gently.
- **Chronicle IV:** *The First Silence*: the stones dimming, in Ysolde's
  worried hand.
- **Codex pages:** `lists`, `list-index`, `list-methods`, `list-search`,
  `sorting`, `list-maths`, `list-slicing`, `lists-while`, `parallel-lists`.
- **Plan** (14):
  1. Making a list; printing it; `len`.
  2. Indexing and negative indexes; `IndexError`.
  3. Changing an item by index (lists can change, strings can't).
  4. `append`: building a list up from empty.
  5. `insert`, `remove`, `pop` (and `remove` only takes the first match).
  6. `in` / `not in` on lists, and how it differs from `in` on a string.
  7. `sort()`, `sorted()`, `reverse=True`, and the `sort()` returns `None` trap.
  8. `sum`, `min`, `max`, `len`: averages with `round`.
  9. Slicing lists (the first three, the last two, a copy with `[:]`).
  10. `count` and `index`.
  11. Walking a list with `while` and an index: a running total.
  12. Walking and choosing: build a new list of the items that pass a test.
  13. Two lists in step (names and prices at the same index).
  14. Capstone: market day: stock, sales, restock, sort, report. Then Vane.
  The `while`-walking challenges should make a learner wish for an easier way;
  Hazel's bakery brings `for`.
- **Known so far:** + lists and their methods, `in`/`not in` on lists,
  `sum`/`min`/`max` on lists, slicing lists.
- **Not yet:** `for`, `range`, `split`/`join`, functions, dictionaries.

## 5 · The Hearth Bakery · `for` loops

- **Villager:** Hazel (`baker`), arrives at the start. Bram's younger sister;
  they haven't spoken in ten years (he left on the caravans the week she
  opened her first bakery).
- **Beat:** Act II begins: the King's charter needs proof of a real town,
  starting with bread for the royal envoy. The envoy's feast. Bram and Hazel
  thaw over a loaf (her braided festival loaf, stage 14). Small seeds only;
  their full reconciliation is a heart event.
- **Chronicle V:** *Bread and Runes*: the old harvest festival.
- **Codex pages:** `for-loops`, `range`, `accumulators`, `loop-search`,
  `building-lists`, `enumerate`, `zip`, `nested-loops`, `string-building`.
- **Plan** (14):
  1. `for` over a list: one round per item.
  2. `for` over a string: one round per letter.
  3. `range(n)`: do something n times.
  4. `range(start, stop)` and `range(start, stop, step)`, counting down.
  5. Accumulators: a total, and counting with an `if`.
  6. Finding the best by hand (the biggest, the first that fits) with a
     tracker variable; `break` in a `for`.
  7. Building a new list in a loop (changed items).
  8. Filtering in a loop (only the items that pass).
  9. `enumerate`: a numbered order list, starting from 1.
  10. `zip`: two lists side by side.
  11. Building strings in a loop (a row of loaves, a pattern).
  12. Nested loops: trays and rows, a grid.
  13. A loop with a flag: did anything burn? (search, and what to say when
      nothing matched).
  14. Capstone: the envoy's feast: an order with `enumerate`/`zip`,
      accumulators and a neat receipt.
- **Known so far:** + `for`, `range`, `enumerate`, `zip`, nested loops,
  `break`/`continue` in `for`.
- **Not yet:** functions, dictionaries, `split`/`join`, tuples as a topic
  (just don't mention them; `zip` and `enumerate` can be used without the
  word), comprehensions.

## 6 · The Forge · functions

- **Villager:** Ingrid (`smith`), arrives at the start. A smith who quit the
  Vane Company in disgust; her old crew Dagny, Hollis and young Pell.
- **Beat:** she knows Vane's plan: drain the pond, quarry the hills (his plan
  pinned to the wall, stage 15). Tools for the town.
- **Chronicle VI:** *The Speakers Leave*: the experts take their knowledge
  to the cities.
- **Codex pages:** `functions`, `parameters`, `return`, `return-vs-print`,
  `defaults-keywords`, `scope`, `function-patterns`.
- **Plan** (15):
  1. `def` and calling a function with no parameters.
  2. One parameter.
  3. Several parameters, and their order.
  4. `return` vs `print` (the function that prints but returns `None`).
  5. Using a returned value: in an expression, an f-string, an `if`.
  6. Functions that answer yes/no (return a boolean).
  7. Choosing what to return with `if`/`elif`/`else`.
  8. Default parameter values.
  9. Keyword arguments.
  10. A function that takes a list and loops over it.
  11. Functions calling functions.
  12. Scope: a function's own variables; return a value instead of changing a
      global.
  13. `None` and returning early (a guard at the top).
  14. Tidy-up: a starter full of repeated code; turn it into one function.
  15. Capstone: the town's tool orders, several small functions working
      together. Vane's plan comes to light.
  Checks should call the learner's functions with fresh arguments (this
  building is the best defence against typed-in answers).
- **Known so far:** + `def`, parameters, `return`, defaults, keyword
  arguments, local scope.
- **Not yet:** dictionaries, `split`/`join`, tuples, sets, `try`, classes.

## 7 · The Scribe's Library · dictionaries

- **Villager:** Odo (`librarian`), arrives at the start. Absent-minded scholar
  with ink on everything; his book *A Gentle History of Forgotten Alphabets*,
  31 years in the making.
- **Beat:** under the library, Ysolde's sealed vault and journal (the
  `vault_hatch`, stage 3). **Midpoint reveal:** the Long Quiet happened
  because only a few spoke the Old Tongue, and when they left nobody could
  teach it. Say the theme once, gently: *a language lives only while it is
  taught.* Pip goes very quiet (no reveal of Pip's secret).
- **Chronicle VII:** *A Language Lives While It Is Taught*.
- **Codex pages:** `dictionaries`, `dict-changes`, `dict-safe`,
  `dict-loops`, `counting`, `nested-data`, `sorting-dicts`.
- **Plan** (14):
  1. Making a dictionary; looking up by key.
  2. Adding and changing entries.
  3. `in` on a dictionary (it checks keys); `KeyError`.
  4. `.get` with a default.
  5. Looping over keys and over `.items()`.
  6. `.values()` with `sum`/`max`.
  7. Counting with a dictionary (a tally).
  8. Removing (`del`, `.pop`) and `len`.
  9. A dictionary of lists (shelves → books).
  10. A list of dictionaries (records).
  11. Reaching into nested data and changing it.
  12. Sorting: `sorted(d)`, by value with `key=d.get`, `key=len`, `reverse`.
  13. Building an index: word → list of pages.
  14. Capstone: the catalogue, and the journal from the vault (decode it with
      a dictionary) → the midpoint reveal.
- **Known so far:** + dictionaries, `.get`, `.items()`, `.keys()`,
  `.values()`, `del`, `.pop`, `sorted(..., key=...)` with a named function.
- **Not yet:** `split`/`join`, tuples, sets, `try`, files, `lambda`.

## 8 · Apothecary and Herb Garden · text, tuples, sets, errors

- **Villager:** Mirela (`herbalist`), arrives at the start. Talks to plants
  (and they listen).
- **Beat:** **the Hush**, a grey fog from the north hill, starts dimming
  runes. Pip grows faint. Mirela's tonic (stage 14) and your code keep the
  stone lit.
- **Chronicle VIII:** *The Hush*: what grows where no one speaks.
- **Codex pages:** `split-join`, `parsing`, `tuples`, `unpacking`, `sets`,
  `set-ops`, `try-except`, `raise`.
- **Plan** (14):
  1. `split()` on spaces.
  2. `split(",")` and stripping each piece.
  3. `join`.
  4. Pulling numbers out of text (`split` + `int`).
  5. Tuples: making, indexing, why they can't change.
  6. Unpacking, swapping, `for name, amount in pairs`.
  7. A function that returns two values.
  8. Sets: unique items, `add`, `in`, `len`.
  9. `&`, `|`, `-` between sets.
  10. `try` / `except ValueError` around `int()`.
  11. More than one `except` (`KeyError`, `ZeroDivisionError`), and `else`.
  12. A loop that keeps the good lines and counts the bad ones.
  13. `raise ValueError("...")` in your own function.
  14. Capstone: Mirela's tonic from a messy recipe card: parse, validate,
      combine with sets and dictionaries, and survive bad lines.
- **Known so far:** + `split`, `join`, tuples, unpacking, sets and their
  operators, `try`/`except`/`else`, `raise`.
- **Not yet:** files, modules other than `random`, comprehensions, classes.

## 9 · Town Hall · files and records

- **Villager:** Mayor Thistle (`mayor`), arrives at the start, elected by a
  landslide (there are 8 voters).
- **Beat:** the charter hearing. Vane against the village; you prepare the
  town's records as files and win. The village becomes a **Town**. **End of
  Act II**, with the Hush and Pip's fading as the cliffhanger.
- **Chronicle IX:** *The Charter of Willowmere*: the old charter, signed by
  Ysolde.
- **Codex pages:** `files-reading`, `files-lines`, `files-writing`, `with`,
  `csv-reading`, `csv-dicts`, `csv-writing`, `file-errors`.
- **Plan** (14), with starting files from challenge 1:
  1. `open` and `read()`: print a whole file.
  2. Looping over a file's lines, stripping the newline.
  3. Counting lines and words in a file.
  4. Writing a new file (`"w"`).
  5. `with` (it closes the file for you); use it from here on.
  6. Adding to a file (`"a"`).
  7. Writing many lines in a loop, with `\n`.
  8. Records: comma-separated lines → fields.
  9. `csv.reader` (and why commas inside quotes break `split`).
  10. `csv.DictReader`.
  11. `csv.writer` / `csv.DictWriter`.
  12. `FileNotFoundError` with `try`.
  13. Read, change, write back: updating a record file.
  14. Capstone: the charter dossier: read several files, work out the
      numbers, write the summary file the hearing needs.
- **Known so far:** + `open` modes `r`/`w`/`a`, `with`, `import csv`
  (`reader`, `writer`, `DictReader`, `DictWriter`), `FileNotFoundError`.
- **Not yet:** `math`, `datetime`, comprehensions, classes.

## 10 · The Clock Tower · modules and comprehensions

- **Villager:** Tock (`tinker`), arrives at the start. Fixes things that
  aren't broken yet.
- **Beat:** Act III. The valley's clock stopped at the moment of the Long
  Quiet; restarting it brings back days, nights and seasons.
- **Chronicle X:** *The Binding*: Ysolde bound her familiar to the last
  stone, to wait for a new speaker. (A strong hint, not yet the reveal: the
  familiar is not named.)
- **Codex pages:** `modules`, `math`, `random-lists`, `dates`, `timedelta`,
  `comprehensions`, `comprehension-filters`, `conditional-expressions`,
  `dict-comprehensions`.
- **Plan** (14):
  1. `import math`: `sqrt`, `pi`.
  2. `from math import ...`, and `as`.
  3. `math` at work (`floor`, `ceil`, `gcd` for gears).
  4. `random` with lists: `choice`, `shuffle`, `sample`, seeds.
  5. `datetime.date`: making dates, `.year`, `.weekday()`.
  6. `timedelta`: adding days, the days between two dates.
  7. Formatting dates (`strftime`, `isoformat`).
  8. Clock arithmetic with `divmod` (seconds → hours and minutes).
  9. List comprehensions that change each item.
  10. Comprehensions with `if` (keep some).
  11. Comprehensions over `range`, building labels and times.
  12. `x if cond else y`, alone and inside a comprehension.
  13. Dictionary comprehensions.
  14. Capstone: the clock's day: chime times with `datetime`/`timedelta`,
      comprehensions and `math`. The clock starts.
  Never use today's date or the current time (tests must be repeatable).
- **Known so far:** + `math`, `random.choice/shuffle/sample`,
  `datetime.date/timedelta`, `divmod`, comprehensions, conditional
  expressions.
- **Not yet:** classes, generators, recursion, `lambda`.

## 11 · The Guild Hall · classes

- **Villager:** Captain Rook (`captain`), arrives at the start. Retired
  adventurer; the real story of the scar is funnier than the legend. A
  humbled **Lord Vane** returns to help (story lines only, no model): his
  grandfather was one of the speakers who left.
- **Beat:** the Hush gathers into a storm on the north hill. The guild clears
  the road up the hill.
- **Chronicle XI:** *The Last Speaker*: who left, and who stayed.
- **Codex pages:** `classes`, `init`, `methods`, `str-method`,
  `object-lists`, `class-attributes`, `inheritance`, `super`, `overriding`,
  `composition`.
- **Plan** (16):
  1. `class` and `__init__`; attributes; one object.
  2. Several objects from one class.
  3. Methods that use `self`.
  4. Methods that change an object.
  5. Methods that return values.
  6. `__str__`.
  7. Default values in `__init__`.
  8. Objects in a list, and looping over them.
  9. Objects working together (a method that takes another object).
  10. Class attributes vs instance attributes.
  11. Inheritance: a subclass with something extra.
  12. `super().__init__`.
  13. Overriding a method (each role describes itself differently).
  14. `isinstance`.
  15. Composition: a party that holds members and adds them up.
  16. Capstone: the guild roster and the expedition plan up the north hill.
- **Known so far:** + classes, `__init__`, methods, `__str__`, class
  attributes, inheritance, `super()`, `isinstance`.
- **Not yet:** recursion, generators, `yield`, `lambda`.

## 12 · The Observatory · the capstone

- **Villager:** none new: Pip. The secret: Pip is Ysolde's familiar, bound to
  the stone for 300 years to keep the Old Tongue alive. The Great Rune (the
  observatory lens) can be relit only by a program the founder writes alone.
  The valley lights up, the Hush lifts, and **Pip is free** to roam. Rank:
  **Rune Town**. Leave room for the epilogue (not written here).
- **Chronicle XII:** *written by you*: the founder's own page. Write it as
  Ysolde's last page handing the book over, plus an empty-feeling line
  inviting the founder to write their own (a later system may fill it).
- **Codex pages:** `searching`, `binary-search`, `sorting-algorithms`,
  `sort-keys`, `recursion`, `recursion-data`, `generators`,
  `generator-expressions`, `big-programs`.
- **Plan** (16):
  1. Linear search as a function (index, or -1 when missing).
  2. Searching with a condition (the first star brighter than ...).
  3. Binary search on a sorted list.
  4. Counting steps: linear vs binary on the same list.
  5. Selection sort by hand.
  6. Insertion sort by hand.
  7. `sorted` with `key=` and tuples as keys (sort by two things).
  8. Recursion: base case and the step (countdown, factorial).
  9. Recursion over a list (sum, largest).
  10. Recursion over nested data (constellations inside constellations).
  11. Generators with `yield`.
  12. Generator expressions and `next()`.
  13. Breaking a big problem into functions (planning on paper, then code).
  14. The village program, part 1: read and organise the village's data.
  15. The village program, part 2: plan the day with it.
  16. The Great Rune: the founder's own program, with the fewest scaffolds of
      the whole game (still three good hints). The lens lights.
- **Known so far:** everything.

---

## Working in parallel (for the sessions)

- **Your files:** `src/content/<id>.ts`, `src/content/pages/<id>.ts`, and your
  villager's own profile `src/content/people/<model>.ts` if a line there
  contradicts your story. Nothing else. If you think the engine needs a
  change, describe it in your final report instead of making it.
- **Test only your building:** `npm test -- <id>` (add `-v` to see why each
  mistake fails). `npx tsc --noEmit` may show errors in files other sessions
  are editing; only errors in your files are yours.
- **Commit only your paths:** `git commit -m "..." -- src/content/<id>.ts
  src/content/pages/<id>.ts` (the `--` form commits just those files even if
  someone else has staged something). If git says `index.lock` exists, wait a
  few seconds and retry.
- **Village life:** farming opens with the mill's field, cooking with the
  tavern kitchen (and baking with the bakery), fishing when the dock is
  finished. Those systems are built in other sessions. Your story may hint at
  them in a line (Marlo can hand you a spare rod in the dock's finale), but
  don't build or promise mechanics.
