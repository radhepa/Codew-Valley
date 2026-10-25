import type { LifeRune } from "../../life/context.ts";

// Personal runes: small optional Python tasks inside heart events (HEARTS.md). Same format
// and same content tests as a challenge (`npm test -- scenes`). Each may only use what the
// building in `requires` (and every building before it) has taught (SYLLABUS.md).
const r = String.raw;

const LETTERS = "letters = [6, 2, 9, 1, 4, 7, 3, 8, 5]";
const DRAWER = r`# Bram's letters, in the order they came out of the drawer.
# Each number is the winter he wrote it: 1 is the first winter after he lost the crew.
${LETTERS}
`;

// ---- Letters to Nowhere (Bram, 6 hearts), once the bakery has taught for loops --------------

const LOOP_SOLUTION = DRAWER + r`
letters.sort()
count = 0
for winter in letters:
    print(f"Winter {winter}")
    count += 1
print(f"{count} letters. The newest is from winter {letters[-1]}.")`;

const loopSwap = (from: string, to: string) => {
  if (!LOOP_SOLUTION.includes(from)) throw new Error(`letters rune: no "${from}" in the solution`);
  return LOOP_SOLUTION.replace(from, to);
};

/** The same checks for both versions: swap in other drawers so typed-in answers fail. */
const drawerChecks = (want: string) => r`L = "${LETTERS}"
nl = chr(10) + "  "

${want}

def drawer(letters):
    check(L in src, "Keep the line " + L + " exactly as it was in the starter, so the rune can try other drawers.")
    v = src.replace(L, "letters = " + str(letters), 1)
    try:
        return rerun(v)[1]
    except Exception as e:
        check(False, "With the letters " + str(letters) + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the list, so it fits any drawer.")

def same(letters, advice=""):
    got = drawer(letters)
    w = want(letters)
    if got == w:
        return
    msg = "With the letters " + str(letters) + ", the rune expects:" + nl + nl.join(w) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    check(False, msg + (chr(10) + advice if advice else ""))
`;

export const LETTERS_RUNE: LifeRune = {
  id: "scene-bram-letters",
  requires: "bakery",
  reward: "Bram's letters sorted, winter by winter, and counted.",
  part: "Letters to Nowhere",
  title: "Letters to Nowhere",
  topic: "sorting a list, a for loop that counts",
  cost: { wood: 0, stone: 0 },
  intro: [
    "Bram: One a winter, friend. Never sent a single one. And look at them. Mixed up like a stew someone sat on.",
    "Bram: Put them in order for me? First winter first. Read me each one's winter, and tell me how many there are. I've lost count. Or I'm scared to know.",
    "Sort the list, then walk it with a `for` loop, like Hazel's trays. A counter that goes up inside the loop does the counting.",
  ],
  codex: ["sorting", "for-loops", "accumulators"],
  quiz: {
    code: r`jars = [3, 1, 2]
count = 0
for jar in jars:
    count += 1
jars.sort()
print(jars[0], count)`,
    question: "What does this program show?",
    options: ["1 3", "3 3", "1 2", "3 1"],
    answer: 0,
    why: "The loop runs once per jar, so count ends at 3. Then sort() puts the list in order, so jars[0] is the smallest, 1. Sorting after the loop doesn't change how many times it ran.",
  },
  task: [
    "Sort `letters` so the first winter comes first.",
    "With a `for` loop, print `Winter <number>` for each letter, one line each, in order.",
    "Count the letters as you go, with a counter that goes up inside the loop.",
    "After the loop, print `<count> letters. The newest is from winter <newest>.`",
  ],
  starter: DRAWER + r`
# Sort them, read each winter out, and count them as you go.
`,
  tests: drawerChecks(r`def want(letters):
    s = sorted(letters)
    return ["Winter " + str(w) for w in s] + [str(len(s)) + " letters. The newest is from winter " + str(s[-1]) + "."]`) + r`
check(len(lines) > 0, "Nothing printed yet. Bram is waiting to hear the first winter.")
check("for " in src, "Bram asked for a loop: walk the letters with for, and count them inside it.")
check(lines[0].startswith("Winter "), "The first line should be the first winter, like: Winter 1")
check(lines[-1].endswith("."), "The last line, after the loop, ends with a full stop: <count> letters. The newest is from winter <newest>.")
check(lines[:-1] != ["Winter " + str(w) for w in [6, 2, 9, 1, 4, 7, 3, 8, 5]], "Those are in drawer order. Sort the list before the loop reads it.")
check(lines[:-1] != ["Winter " + str(w) for w in [9, 8, 7, 6, 5, 4, 3, 2, 1]], "Newest first! Bram wants the first winter first: a plain sort() goes smallest to biggest.")
check(sum(1 for l in lines if l[:1].isdigit()) <= 1, "The count line is printed more than once. Is it inside the loop? Print it after the loop, once.")
same([6, 2, 9, 1, 4, 7, 3, 8, 5], "Sort, then one line per letter, then the count line.")
same([4, 7, 5], "Take the newest and the count from the list itself: the newest is the last item once it is sorted, and the counter counts whatever the loop visits.")
same([10, 2, 6, 3], "Count from the list, not from what this drawer happens to hold: here there are 4.")
same([8, 8, 1], "Two letters can share a winter (a long one). Each still gets its own line and its own count.")`,
  hints: [
    "Two jobs, one after the other: put the list in order, then read it out. Which list method sorts a list in place?",
    "`letters.sort()` puts them in order. Then `for winter in letters:` visits each one; inside, print the line and add one to a counter that starts at 0 before the loop.",
    "After `letters.sort()`, set `count = 0`. In `for winter in letters:` print `f\"Winter {winter}\"` and do `count += 1`. After the loop (not indented), print the count line with `letters[-1]` for the newest.",
  ],
  solution: LOOP_SOLUTION,
  wrong: [
    // forgot to sort
    loopSwap("letters.sort()\n", ""),
    // newest first
    loopSwap("letters.sort()", "letters.sort(reverse=True)"),
    // the oldest, not the newest
    loopSwap("{letters[-1]}", "{letters[0]}"),
    // a typed-in count
    loopSwap("{count} letters", "9 letters"),
    // the count line inside the loop
    loopSwap(`    count += 1
print(`, `    count += 1
    print(`),
    // the count never goes up
    loopSwap("    count += 1\n", ""),
    // typed-in answer
    DRAWER + "\n" + [1, 2, 3, 4, 5, 6, 7, 8, 9].map((w) => `print("Winter ${w}")`).join("\n") + `\nprint("9 letters. The newest is from winter 9.")`,
  ],
  done: "Bram: Nine winters. Nine. I'd have said five, if you'd asked me. Thank you, friend.",
};

// ---- the same moment before the bakery: the market has taught lists, not for loops -----------

const LIST_SOLUTION = DRAWER + r`
letters.sort()
print(f"Winter {letters[0]} to winter {letters[-1]}: {len(letters)} letters.")`;

const listSwap = (from: string, to: string) => {
  if (!LIST_SOLUTION.includes(from)) throw new Error(`letters rune (lists): no "${from}" in the solution`);
  return LIST_SOLUTION.replace(from, to);
};

export const LETTERS_LIST_RUNE: LifeRune = {
  id: "scene-bram-letters-list",
  requires: "market",
  reward: "Bram's letters in order, first winter to the newest, and counted.",
  part: "Letters to Nowhere",
  title: "Letters to Nowhere",
  topic: "sorting a list, first, last and len",
  cost: { wood: 0, stone: 0 },
  intro: [
    "Bram: One a winter, friend. Never sent a single one. And look at them. Mixed up like a stew someone sat on.",
    "Bram: Put them in order for me? Then tell me the first winter, the newest, and how many there are. I've lost count. Or I'm scared to know.",
    "Sort the list like Sable's price tags. Then the first and last items are the oldest and newest, and `len()` counts them.",
  ],
  codex: ["sorting", "list-index", "list-maths"],
  quiz: {
    code: r`tally = [5, 2, 8]
tally.sort()
print(tally[-1], len(tally))`,
    question: "What does this program show?",
    options: ["8 3", "5 3", "2 3", "8 2"],
    answer: 0,
    why: "After sort() the list is [2, 5, 8], so the last item, tally[-1], is 8. len() counts the items: 3.",
  },
  task: [
    "Sort `letters` so the first winter comes first.",
    "Print one line: `Winter <first> to winter <newest>: <count> letters.`",
    "Take all three numbers from the sorted list: its first item, its last item, and its length.",
  ],
  starter: DRAWER + r`
# Sort them, then tell Bram the first winter, the newest, and how many.
`,
  tests: drawerChecks(r`def want(letters):
    s = sorted(letters)
    return ["Winter " + str(s[0]) + " to winter " + str(s[-1]) + ": " + str(len(s)) + " letters."]`) + r`
check(len(lines) > 0, "Nothing printed yet. Bram is waiting to hear how many winters.")
check(len(lines) == 1, "The rune wants just one line about the letters.")
check(lines[0] != "Winter 6 to winter 5: 9 letters.", "Those are the first and last letters in drawer order. Sort the list first.")
check(lines[0] != "Winter 9 to winter 1: 9 letters.", "Newest first! A plain sort() goes smallest to biggest, so the first winter comes first.")
same([6, 2, 9, 1, 4, 7, 3, 8, 5], "Sort first, then letters[0], letters[-1] and len(letters).")
same([4, 7, 5], "Take the newest and the count from the sorted list itself (its last item and its length), so they fit any drawer.")
same([10, 2, 6, 3], "Count with len(letters), so it fits any drawer.")`,
  hints: [
    "First put the list in order. Once it's sorted, where in the list are the oldest and the newest letters?",
    "`letters.sort()` sorts it in place. Then `letters[0]` is the first item, `letters[-1]` the last, and `len(letters)` how many there are.",
    "After `letters.sort()`, print an f-string: `f\"Winter {letters[0]} to winter {letters[-1]}: {len(letters)} letters.\"`",
  ],
  solution: LIST_SOLUTION,
  wrong: [
    listSwap("letters.sort()\n", ""),
    listSwap("letters.sort()", "letters.sort(reverse=True)"),
    listSwap("{len(letters)}", "9"),
    listSwap("{letters[-1]}", "{letters[8]}"),
    // the sort() returns None trap
    listSwap("letters.sort()", "letters = letters.sort()"),
  ],
  done: "Bram: Nine winters. Nine. I'd have said five, if you'd asked me. Thank you, friend.",
};

/** Every personal rune, checked by the content tests. */
export const SCENE_RUNES: LifeRune[] = [LETTERS_RUNE, LETTERS_LIST_RUNE];
