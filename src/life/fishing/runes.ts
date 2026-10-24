import type { LifeRune } from "../context.ts";

// Fishing's village runes (LifeRune in ../context.ts). Plain data: the Node content tests import it.
// Gran's water diary uses only what the dock teaches (SYLLABUS.md): while loops, counters,
// if inside a loop, walking a string with an index. Solved, the fishing note shows what's biting.
const r = String.raw;

const START = (body: string) => r`water = "ccrrchrrrcrrc"   # Gran's water diary: one letter an hour
first_hour = 6            # the hour of the first letter (6 means 6:00)
# r = rings on the water (fish rising), c = calm, h = the heron's out
` + body;

const SOLUTION = START(r`
i = 0
run = 0
best = 0
best_start = 0
while i < len(water):
    if water[i] == "r":
        run += 1
        if run > best:
            best = run
            best_start = i - run + 1
    else:
        run = 0
    i += 1

if best == 0:
    print("No rings today. Mend the nets instead.")
else:
    print(f"Best fishing from {first_hour + best_start}:00, {best} in a row.")`);

// the same shape with one thing changed (each is a mistake the checks must catch)
const swap = (from: string, to: string) => {
  if (!SOLUTION.includes(from)) throw new Error(`fishing rune: no "${from}" in the solution`);
  return SOLUTION.replace(from, to);
};

export const FORECAST_RUNE: LifeRune = {
  id: "life-fish-diary",
  requires: "dock",
  reward: "Gran's water diary: when you fish, a note says what's biting there right now.",
  part: "Water diary",
  title: "Gran's Water Diary",
  topic: "walking a string, keeping the best",
  cost: { wood: 0, stone: 0 },
  intro: [
    "Marlo: Gran kept a water diary. One letter for every hour she sat by the pond. ...I've kept it up. Here's yesterday's.",
    "Marlo: **r** is rings on the water: fish rising. **c** is calm. **h** means the heron's out, and nothing bites while he's watching.",
    "Marlo: The best fishing is the longest stretch of rings in a row. Teach your stone to find it, and I'll leave it a page each morning.",
    "Walk the diary letter by letter with a `while` loop and an index, like Gran's knotted message. Ooh, it's like finding the high score. For fish!",
  ],
  codex: ["walking-strings", "loop-counters", "while"],
  quiz: {
    code: r`log = "aab"
i = 0
count = 0
while i < len(log):
    if log[i] == "a":
        count += 1
    else:
        count = 0
    i += 1
print(count)`,
    question: "What does this program show?",
    options: ["0", "2", "3", "1"],
    answer: 0,
    why: "count climbs to 2 on the two a's, but the last letter is b, which sets it back to 0. A streak counter only says how long the streak is right now; to keep the longest one, remember it in another variable before it resets.",
  },
  task: [
    "Walk through `water` one hour at a time. The first letter is the hour `first_hour`, the next is the hour after, and so on.",
    "Find the longest stretch of `r` hours in a row. Calm water (`c`) and the heron (`h`) both end a stretch.",
    "Print `Best fishing from <hour>:00, <length> in a row.` with the hour that stretch begins. If two stretches are just as long, Marlo wants the earlier one.",
    "If there are no rings at all, print `No rings today. Mend the nets instead.`",
  ],
  starter: START(r`
# Walk the diary and find the longest stretch of rings.
`),
  tests: r`def want(water, first, heron_ends=True, hour_at_end=False):
    best = 0
    start = 0
    run = 0
    i = 0
    while i < len(water):
        if water[i] == "r" or (water[i] == "h" and not heron_ends):
            run += 1
            if run > best:
                best = run
                start = i if hour_at_end else i - run + 1
        else:
            run = 0
        i += 1
    if best == 0:
        return ["No rings today. Mend the nets instead."]
    return ["Best fishing from " + str(first + start) + ":00, " + str(best) + " in a row."]

W = 'water = "ccrrchrrrcrrc"'
F = "first_hour = 6"
nl = chr(10) + "  "

def diary(water, first):
    v = src
    check(W in v, "Keep the line " + W + " exactly as it was in the starter, so the rune can read other diaries.")
    check(F in v, "Keep the line " + F + " exactly as it was in the starter, so the rune can try other mornings.")
    v = v.replace(W, 'water = "' + water + '"', 1).replace(F, "first_hour = " + str(first), 1)
    try:
        return rerun(v)[1]
    except Exception as e:
        if type(e).__name__ == "LoopLimit":
            check(False, 'With the diary "' + water + '", your loop never stops. Does the index move on every round, on a c or an h as well as an r?')
        check(False, 'With the diary "' + water + '", your program crashes with ' + type(e).__name__ + ": " + str(e) + ". Work from water and first_hour, so it fits any diary.")

def same(water, first=6, advice=""):
    got = diary(water, first)
    w = want(water, first)
    if got == w:
        return
    check(len(got) <= 1, 'For the diary "' + water + '" you printed ' + str(len(got)) + " lines. The rune wants one, after the loop has read the whole diary.")
    msg = 'With the diary "' + water + '" starting at ' + str(first) + ":00, the rune expects:" + nl + nl.join(w) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    check(False, msg + (chr(10) + advice if advice else ""))

check(len(lines) > 0, "Nothing printed yet. The rune is waiting for one line about the best fishing.")
check(len(lines) == 1, "You printed " + str(len(lines)) + " lines. The rune wants just one, after the loop: check what's indented inside it.")
check(lines[0].startswith("Best fishing from ") or lines[0].startswith("No rings"), "The line should start with Best fishing from (or say No rings today, when there are none).")
check(lines[0].endswith(" in a row."), "Nearly! The line ends with how many hours in a row, then a full stop.")
if lines != want("ccrrchrrrcrrc", 6):
    check(lines != want("ccrrchrrrcrrc", 6, heron_ends=False), "The heron scares the fish off: an h ends a stretch just like calm water does.")
    check(lines != want("ccrrchrrrcrrc", 6, hour_at_end=True), "That's the hour the best stretch ends. Marlo wants the hour it begins: count back from where it ends.")
same("ccrrchrrrcrrc", 6, "Read the diary on paper: which stretch of r's is longest, and what hour does it begin?")
same("crrcrrr", 6, "The longest stretch here runs right to the end of the diary. If you only note a stretch when it ends, the last one is never noted.")
same("rrcrr", 6, "Two stretches are just as long here. Marlo wants the earlier one: only a longer stretch should take the best one's place.")
same("rrhrr", 6, "The heron scares the fish off: an h ends a stretch just like calm water does.")
same("ccrcc", 6, "One hour of rings is still a stretch.")
same("cchcc", 6, "No rings at all, so the rune wants the line about the nets.")
same("", 6, "An empty diary has no rings either.")
same("rrrr", 6)
same("ccrrchrrrcrrc", 5, "The hour comes from first_hour: a diary that starts at 5:00 moves every hour back by one.")
same("hrrrcrrrrc", 7)`,
  hints: [
    "Try it on paper first: read the diary left to right with a finger, counting the rings in the stretch you're in. What happens to the count at a c or an h? And when do you write down a new best?",
    "Two counters do it: one for the streak you're in, one for the longest so far. For a streak of sunny days: `if days[i] == \"s\":` add one to `streak`, else set `streak = 0`; and whenever `streak > longest`, save it. A streak that is `streak` long and ends at index `i` began at `i - streak + 1`.",
    "Inside `while i < len(water):` use `if water[i] == \"r\":` to add one to `run`, then `if run > best:` save `best = run` and where this stretch began (count back from `i`). `else:` sets `run` back to 0. Move `i` on every round. After the loop, print the hour, or the nets line if `best` is still 0.",
  ],
  solution: SOLUTION,
  wrong: [
    // only notes a stretch when it ends, so one running to the end of the diary is missed
    swap(
      `    if water[i] == "r":
        run += 1
        if run > best:
            best = run
            best_start = i - run + 1
    else:
        run = 0`,
      `    if water[i] == "r":
        run += 1
    else:
        if run > best:
            best = run
            best_start = i - run
        run = 0`,
    ),
    // a tie goes to the later stretch
    swap("if run > best:", "if run >= best:"),
    // the heron doesn't end a stretch
    swap(`if water[i] == "r":`, `if water[i] != "c":`),
    // the hour where the stretch ends, not where it begins
    swap("best_start = i - run + 1", "best_start = i"),
    // a typed-in first hour
    swap("{first_hour + best_start}", "{6 + best_start}"),
    // printing every new best inside the loop
    swap(
      `            best_start = i - run + 1
`,
      `            best_start = i - run + 1
            print(f"Best fishing from {first_hour + best_start}:00, {best} in a row.")
`,
    ),
    // no line for a day without rings
    swap(
      `if best == 0:
    print("No rings today. Mend the nets instead.")
else:
    print(f"Best fishing from {first_hour + best_start}:00, {best} in a row.")`,
      `print(f"Best fishing from {first_hour + best_start}:00, {best} in a row.")`,
    ),
    // the index only moves on rings: calm water stops it forever
    swap(
      `    else:
        run = 0
    i += 1`,
      `        i += 1
    else:
        run = 0`,
    ),
  ],
  done: "Marlo: ...Gran would've liked that. Your stone reads the water now. I'll leave it a page each morning. Look for it when you fish.",
};

export const FISHING_RUNES: LifeRune[] = [FORECAST_RUNE];
