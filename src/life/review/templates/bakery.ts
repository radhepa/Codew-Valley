import type { Spec, Template } from "../build.ts";
import { CROPS, FISH, PEOPLE } from "../rng.ts";

// The Hearth Bakery: for loops, range, accumulators, enumerate, zip, nested loops, flags.

const L = (...lines: string[]) => lines.join("\n");
const BREADS = ["rye loaf", "seed roll", "plum bun", "honey cake", "oat bread", "braid", "currant scone", "pretzel"];
const loop: [string, string] = ["\\bfor\\b", "This one is for-loop practice: let a for loop do the visiting."];

export const BAKERY: Template[] = [
  {
    id: "bk-trays",
    topics: ["bakery"],
    difficulty: 1,
    make(r): Spec {
      const trays = Array.from({ length: r.int(5, 7) }, () => r.int(6, 24));
      const twist = r.pick(["total", "full", "flowers"] as const);
      if (twist === "total")
        return {
          title: "The Morning's Bake",
          topic: "for loops: a running total",
          task: ["`trays` holds how many loaves came out of the oven on each tray this morning.", "Hazel wants the whole morning's count. Let a loop visit the trays one at a time and add them up.", "Print one number."],
          data: { trays },
          plan: ["A total that starts at nothing", "Visit every tray", "Show the total"],
          body: L("total = 0", "for t in trays:", "    total += t", "print(total)"),
          variants: [{ data: { trays: [] }, note: "The oven stayed cold: no trays at all." }, { data: { trays: [12] } }, { data: { trays: [6, 18, 9, 11] } }],
          wrong: [L("total = 0", "for t in trays:", "    total = t", "print(total)"), L("total = 0", "for t in trays:", "    total += 1", "print(total)"), L("total = 0", "for t in trays:", "    total += t", "    print(total)")],
          hints: [
            "Keep a running count that starts at nothing, and let each tray add its share as the loop reaches it.",
            "`for jar in jars:` runs once per jar, with `jar` being each one in turn. `eggs += 4` adds 4 to what `eggs` already holds.",
            "`total = 0`, then `for t in trays:` with `total ___ t` inside; print after the loop.",
          ],
          needs: [loop],
          advice: "One number, printed once, after the loop.",
          codex: ["for-loops", "accumulators"],
        };
      if (twist === "full") {
        const full = r.int(10, 18);
        return {
          title: "Full Trays",
          topic: "for loops: counting with if",
          task: ["`trays` holds how many loaves came out of the oven on each tray.", "A tray counts as full when it holds at least `full` loaves. Print how many trays were full."],
          data: { trays, full },
          plan: ["A count that starts at nothing", "Visit every tray, counting the full ones", "Show the count"],
          body: L("count = 0", "for t in trays:", "    if t >= full:", "        count += 1", "print(count)"),
          variants: [
            { data: { trays: [10, 14, 9, 14], full: 14 }, note: "Two trays hold exactly enough: they count as full." },
            { data: { trays: [3, 5], full: 14 }, note: "Not one full tray today." },
            { data: { trays: [20, 22, 15], full: 14 } },
          ],
          wrong: [
            L("count = 0", "for t in trays:", "    if t > full:", "        count += 1", "print(count)"),
            L("count = 0", "for t in trays:", "    if t >= full:", "        count += t", "print(count)"),
            L("count = 0", "for t in trays:", "    if t < full:", "        count += 1", "print(count)"),
          ],
          hints: [
            "Each tray answers one question: full or not? Count the yeses. Careful with a tray that holds exactly enough.",
            "`if jar >= 6:` inside `for jar in jars:` picks out the jars holding 6 or more; `n += 1` counts one more.",
            "Inside the loop: `if t ___ full:` then add one to the count.",
          ],
          needs: [loop],
          advice: "One number: how many trays were full.",
          codex: ["accumulators", "for-loops"],
        };
      }
      const word = r.pick([...CROPS, ...FISH]);
      return {
        title: "Sugar Flowers",
        topic: "for over a string",
        task: [
          "Hazel pipes the word `word` in icing on a cake, and every vowel (a, e, i, o or u) gets a little sugar flower.",
          "Go through the word one letter at a time and print how many sugar flowers she needs.",
        ],
        data: { word },
        plan: ["No flowers yet", "Visit every letter", "Show how many"],
        body: L("flowers = 0", "for ch in word:", '    if ch in "aeiou":', "        flowers += 1", "print(flowers)"),
        variants: [{ data: { word: "pumpkin" }, note: "A word with a u in it." }, { data: { word: "chamomile" } }, { data: { word: "myrrh" }, note: "No vowels at all (y doesn't count)." }],
        wrong: [
          L("flowers = 0", "for ch in word:", '    if ch in "aeio":', "        flowers += 1", "print(flowers)"),
          L("flowers = 0", "for ch in word:", '    if ch not in "aeiou":', "        flowers += 1", "print(flowers)"),
          L("flowers = 0", "for ch in word:", "    flowers += 1", "print(flowers)"),
        ],
        hints: [
          "Walk the word letter by letter and ask each letter one question: are you a vowel?",
          "`for ch in \"oven\":` runs once per letter. `if ch in \"xyz\":` asks whether a letter is one of x, y or z.",
          "Inside the loop: `if ch in ___:` then one more flower.",
        ],
        needs: [loop],
        advice: "One number: how many vowels.",
        codex: ["for-loops", "accumulators"],
      };
    },
  },
  {
    id: "bk-timer",
    topics: ["bakery"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["down", "turns", "pyramid"] as const);
      const rng: [string, string] = ["range\\(", "Let range do the counting today."];
      if (twist === "down") {
        const start = r.int(5, 9);
        return {
          title: "The Oven Timer",
          topic: "range: counting down",
          task: ["Hazel's oven timer counts down from `start`.", "Print every number from `start` down to 1, one per line, and nothing else."],
          data: { start },
          plan: ["Count down to 1"],
          body: L("for n in range(start, 0, -1):", "    print(n)"),
          variants: [{ data: { start: 3 } }, { data: { start: 1 }, note: "Only one number to count." }],
          wrong: [L("for n in range(start, 1, -1):", "    print(n)"), L("for n in range(start):", "    print(n)"), L("for n in range(start, -1, -1):", "    print(n)")],
          hints: [
            "Where does the count start, where does it stop, and which way does it go? The stop number itself is never reached.",
            "`range(10, 4, -2)` gives 10, 8 and 6: it starts at 10, steps by -2 and stops before 4.",
            "`for n in range(start, ___, -1):` and print each one.",
          ],
          needs: [rng],
          advice: "One number per line, from the start down to 1.",
          codex: ["range"],
        };
      }
      if (twist === "turns") {
        const step = r.int(3, 6);
        const end = step * r.int(3, 6) + (r.chance(0.5) ? r.int(1, step - 1) : 0);
        return {
          title: "Turning the Loaves",
          topic: "range with a step",
          task: [
            "Hazel turns the loaves every `step` minutes: first at minute `step`, then every `step` minutes after that.",
            "The bake ends at minute `end`. A turn that falls exactly at the end still happens.",
            "Print each minute she turns the loaves, one per line.",
          ],
          data: { step, end },
          plan: ["Every turning minute"],
          body: L("for m in range(step, end + 1, step):", "    print(m)"),
          variants: [
            { data: { step: 5, end: 20 }, note: "The last turn falls exactly at the end." },
            { data: { step: 4, end: 3 }, note: "The bake is over before the first turn: nothing to print." },
            { data: { step: 3, end: 11 } },
          ],
          wrong: [L("for m in range(step, end, step):", "    print(m)"), L("for m in range(0, end + 1, step):", "    print(m)"), L("for m in range(step, end + 1):", "    print(m)")],
          hints: [
            "Three things decide the count: where it starts, how big each step is, and where it must stop. Is the end itself included?",
            "`range(2, 9, 3)` gives 2, 5 and 8: the stop number is never reached, so to include 9 you'd stop at 10.",
            "`for m in range(step, ___, step):` and print each minute.",
          ],
          needs: [rng],
          advice: "One minute per line, in order.",
          codex: ["range"],
        };
      }
      const n = r.int(3, 6);
      return {
        title: "A Pyramid of Rolls",
        topic: "range from a start",
        task: [
          "Hazel stacks rolls in a little pyramid on the counter. Draw it with the letter `o` for each roll.",
          "The top row has one roll, the next row one more, and so on down to the bottom row of `n` rolls.",
          "Print the rows top to bottom, one per line.",
        ],
        data: { n },
        plan: ["One row per line, top to bottom"],
        body: L("for k in range(1, n + 1):", '    print("o" * k)'),
        variants: [{ data: { n: 1 }, note: "A pyramid of one roll." }, { data: { n: 4 } }],
        wrong: [L("for k in range(n):", '    print("o" * k)'), L("for k in range(1, n):", '    print("o" * k)'), L("for k in range(n, 0, -1):", '    print("o" * k)')],
        hints: [
          "Which numbers of rolls do the rows need, top to bottom? Count them on paper for a small pyramid.",
          "`\"x\" * 3` repeats a string three times. `range(2, 6)` gives 2, 3, 4 and 5: it starts at the first number and stops before the second.",
          "`for k in range(1, ___):` and print that many rolls.",
        ],
        needs: [rng],
        advice: "One row per line, from one roll at the top.",
        codex: ["range", "string-building"],
      };
    },
  },
  {
    id: "bk-newlist",
    topics: ["bakery"],
    difficulty: 2,
    make(r): Spec {
      if (r.chance(0.5)) {
        const flour = Array.from({ length: r.int(4, 6) }, () => r.int(1, 9));
        return {
          title: "Double Everything",
          topic: "building a new list",
          task: [
            "`flour` holds the cups of flour in each of Hazel's recipes.",
            "For the envoy's feast every recipe is doubled. Make a new list with each amount doubled, in the same order, and leave `flour` as it was.",
            "Print the new list, then on the next line the old one.",
          ],
          data: { flour },
          plan: ["An empty list for the doubled amounts", "Fill it, recipe by recipe", "Show both lists"],
          body: L("doubled = []", "for cups in flour:", "    doubled.append(cups * 2)", "print(doubled)", "print(flour)"),
          variants: [{ data: { flour: [3, 1, 4] } }, { data: { flour: [] }, note: "No recipes today: both lists are empty." }, { data: { flour: [7] } }],
          wrong: [
            L("doubled = []", "for cups in flour:", "    doubled.append(cups + 2)", "print(doubled)", "print(flour)"),
            L("doubled = []", "for cups in flour:", "    doubled = [cups * 2]", "print(doubled)", "print(flour)"),
            L("i = 0", "while i < len(flour):", "    flour[i] = flour[i] * 2", "    i += 1", "print(flour)", "print(flour)"),
            L("doubled = []", "for cups in flour:", "    doubled.append(cups * 2)", "print(doubled)"),
          ],
          hints: [
            "Start with an empty list and let the loop add one doubled amount for each recipe. The old list is never touched.",
            "`bigger = []`, then `for egg in eggs:` with `bigger.append(egg * 3)` inside, builds a tripled copy.",
            "Inside the loop: `doubled.append(___)`; after it, print both lists.",
          ],
          needs: [loop],
          advice: "Two lines: the doubled list, then the old one, unchanged.",
          codex: ["building-lists"],
        };
      }
      const loaves = Array.from({ length: r.int(5, 7) }, () => r.int(30, 60) * 10);
      const least = r.int(40, 50) * 10;
      return {
        title: "Fit for the Envoy",
        topic: "filtering in a loop",
        task: [
          "`loaves` holds the weight of each loaf in grams, in the order they were baked.",
          "Only loaves of at least `least` grams go to the envoy. Make a new list of those, in the same order.",
          "Print the new list, then on the next line how many loaves were left behind.",
        ],
        data: { loaves, least },
        plan: ["An empty list for the envoy", "Keep the loaves that are heavy enough", "Show the list and how many stayed behind"],
        body: L("keep = []", "for w in loaves:", "    if w >= least:", "        keep.append(w)", "print(keep)", "print(len(loaves) - len(keep))"),
        variants: [
          { data: { loaves: [300, 310, 520, 480], least: 450 }, note: "The two light loaves sit side by side." },
          { data: { loaves: [450, 440, 600], least: 450 }, note: "One loaf weighs exactly the least allowed: it goes." },
          { data: { loaves: [320, 350], least: 450 }, note: "No loaf is heavy enough today." },
        ],
        wrong: [
          L("keep = []", "for w in loaves:", "    if w > least:", "        keep.append(w)", "print(keep)", "print(len(loaves) - len(keep))"),
          L("keep = []", "for w in loaves:", "    if w >= least:", "        keep.append(w)", "print(keep)", "print(len(keep))"),
          L("gone = 0", "for w in loaves:", "    if w < least:", "        loaves.remove(w)", "        gone += 1", "print(loaves)", "print(gone)"),
        ],
        hints: [
          "Start an empty list for the good loaves. Each loaf either joins it or doesn't. Then: how many didn't make it?",
          "`if egg >= 50:` inside `for egg in eggs:` picks the big eggs, and `big.append(egg)` keeps one. `len(eggs) - len(big)` is how many were left out.",
          "Inside the loop: `if w ___ least:` then append it; after the loop print `keep` and how many were left behind.",
        ],
        needs: [loop],
        advice: "Two lines: the envoy's loaves, then how many stayed behind.",
        codex: ["building-lists"],
      };
    },
  },
  {
    id: "bk-orders",
    topics: ["bakery"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["numbered", "bakers", "shorthand"] as const);
      if (twist === "numbered")
        return {
          title: "The Order Book",
          topic: "enumerate",
          task: ["`orders` is today's order book, first order first.", "Print the orders as a numbered list: one line per order, its number (the first order is number 1), a dot and a space, then the order."],
          data: { orders: r.sample(BREADS, r.int(3, 5)) },
          plan: ["One numbered line per order"],
          body: L("for n, order in enumerate(orders, start=1):", '    print(f"{n}. {order}")'),
          variants: [{ data: { orders: ["pretzel", "braid"] } }, { data: { orders: [] }, note: "No orders yet: nothing to print." }, { data: { orders: ["oat bread"] } }],
          wrong: [
            L("for n, order in enumerate(orders):", '    print(f"{n}. {order}")'),
            L("for n, order in enumerate(orders, start=1):", '    print(n, ".", order)'),
            L("n = 1", "for order in orders:", '    print(f"{n}. {order}")'),
          ],
          hints: [
            "The number goes up by one with each order. Python likes to count from 0; Hazel's book doesn't.",
            "`for place, hen in enumerate(hens, start=1):` gives 1 and the first hen, then 2 and the second. `f\"{a}-{b}\"` puts two values into one line.",
            "`for n, order in enumerate(orders, start=___):` and print the number, a dot and a space, then the order.",
          ],
          needs: [loop],
          advice: "One line per order: its number, a dot and a space, then the order.",
          codex: ["enumerate"],
        };
      if (twist === "bakers") {
        const n = r.int(3, 4);
        return {
          title: "Who Baked What",
          topic: "zip",
          task: [
            "`bakers` and `loaves` line up: the first baker baked the first number of loaves, and so on.",
            "Print one line per baker: the name, a colon and a space, then their loaves.",
            "Then one last line with the total of all the loaves.",
          ],
          data: { bakers: r.sample(PEOPLE, n), loaves: Array.from({ length: n }, () => r.int(5, 30)) },
          plan: ["One line per baker", "The total last"],
          body: L("total = 0", "for who, n in zip(bakers, loaves):", '    print(f"{who}: {n}")', "    total += n", "print(total)"),
          variants: [{ data: { bakers: ["Hazel", "Bram"], loaves: [14, 9] } }, { data: { bakers: ["Pip"], loaves: [3] }, note: "Only one baker today." }],
          wrong: [
            L("for who in bakers:", "    for n in loaves:", '        print(f"{who}: {n}")', "print(sum(loaves))"),
            L("for who, n in zip(bakers, loaves):", '    print(f"{who}: {n}")'),
            L("total = 0", "for who, n in zip(bakers, loaves):", '    print(who + ": " + str(n))', "    total += n", "    print(total)"),
          ],
          hints: [
            "Walk both lists side by side, so each round has one baker and their own number. Keep a running total as you go.",
            "`for hen, eggs in zip(hens, counts):` gives the first hen with the first count, then the second hen with the second.",
            "`for who, n in zip(bakers, ___):` print the line and add `n` to the total; print the total after the loop.",
          ],
          needs: [loop],
          advice: "One line per baker, then the total on a line of its own.",
          codex: ["zip", "accumulators"],
        };
      }
      return {
        title: "Hazel's Shorthand",
        topic: "building strings in a loop",
        task: ["`orders` is today's order book.", "Hazel's shorthand for the day is the first letter of every order, as a capital, all run together in order on one line. Print it."],
        data: { orders: r.sample(BREADS, r.int(3, 5)) },
        plan: ["An empty string", "One letter per order", "Show it"],
        body: L('code = ""', "for order in orders:", "    code += order[0].upper()", "print(code)"),
        variants: [{ data: { orders: ["pretzel", "braid", "oat bread"] } }, { data: { orders: ["honey cake"] }, note: "One order: one letter." }],
        wrong: [
          L('code = ""', "for order in orders:", "    code += order[0]", "print(code)"),
          L('code = ""', "for order in orders:", "    code = order[0].upper()", "print(code)"),
          L('code = ""', "for order in orders:", "    code += order[0].upper()", "    print(code)"),
          L('code = ""', "for order in orders:", "    code += order[-1].upper()", "print(code)"),
        ],
        hints: [
          "Start with an empty string and let the loop add one letter for each order.",
          "`word[0]` is a word's first letter and `.upper()` makes it a capital. `tag = \"\"` then `tag += \"x\"` grows a string.",
          "Inside the loop: `code += ___`; print after the loop.",
        ],
        needs: [loop],
        advice: "One line: the capital letters run together.",
        codex: ["string-building"],
      };
    },
  },
  {
    id: "bk-burn",
    topics: ["bakery"],
    difficulty: 3,
    make(r): Spec {
      if (r.chance(0.5)) {
        const limit = r.int(215, 230);
        const temps = Array.from({ length: r.int(6, 8) }, () => r.int(180, 235));
        if (!temps.some((t) => t > limit)) temps[r.int(1, temps.length - 1)] = limit + r.int(1, 10);
        const flag = L("burnt = False", "for n, t in enumerate(temps, start=1):", "    if t > limit:", "        print(n)", "        print(t)", "        burnt = True");
        return {
          title: "Did Anything Burn?",
          topic: "a loop with a flag",
          task: [
            "`temps` holds each check of Hazel's oven heat, in order. The bread burns if a check goes above `limit` (exactly `limit` is still safe).",
            "Find the first check that went above it. Print which check it was (the first check is check 1) and, on the next line, how hot it was. Stop looking once you've found it.",
            "If no check ever went above it, print `all good` instead.",
          ],
          data: { temps, limit },
          plan: ["Walk the checks until one is too hot", "Nothing too hot? Say so"],
          body: L(flag, "        break", "if not burnt:", '    print("all good")'),
          variants: [
            { data: { temps: [200, 220, 231, 240], limit: 220 }, note: "One check is exactly at the limit: still safe. Two go over: only the first counts." },
            { data: { temps: [190, 205, 210], limit: 220 }, note: "Nothing went over: the bread is fine." },
            { data: { temps: [250, 200], limit: 220 }, note: "The very first check went over." },
          ],
          wrong: [
            L(flag, "if not burnt:", '    print("all good")'),
            L(flag.replace("t > limit", "t >= limit"), "        break", "if not burnt:", '    print("all good")'),
            L(flag.replace(", start=1", ""), "        break", "if not burnt:", '    print("all good")'),
            L("for n, t in enumerate(temps, start=1):", "    if t > limit:", "        print(n)", "        print(t)", "        break", "    else:", '        print("all good")'),
          ],
          hints: [
            "Walk the checks in order. The moment one is too hot, report it and stop. You only know nothing burned once the whole walk is over.",
            "A flag like `found = False` before a loop, set to `True` inside it, tells you afterwards whether anything matched. `break` leaves a loop at once.",
            "Inside the loop, after printing, set the flag and `break`. After the loop: `if not ___:` print the all-good words.",
          ],
          needs: [["\\bbreak\\b", "Stop looking once you've found it: that's a job for break."]],
          advice: "Two lines for the first check that went over, or the all-good words.",
          codex: ["flags", "loop-search", "enumerate"],
        };
      }
      const sacks = Array.from({ length: r.int(5, 7) }, () => r.int(3, 20));
      const [i, j] = r.sample(Array.from({ length: sacks.length }, (_, k) => k), 2);
      const target = sacks[i] + sacks[j];
      return {
        title: "Balancing the Scale",
        topic: "nested loops",
        task: [
          "`sacks` holds the weights of the flour sacks in Hazel's store.",
          "The cart's scale balances best with exactly `target` kilos on it, two sacks at a time. Print how many different pairs of sacks weigh exactly that together.",
          "A pair is two different sacks; count each pair once, whichever sack you name first.",
        ],
        data: { sacks, target },
        plan: ["Try every pair of sacks once", "Count the pairs that balance"],
        body: L("pairs = 0", "for i in range(len(sacks)):", "    for j in range(i + 1, len(sacks)):", "        if sacks[i] + sacks[j] == target:", "            pairs += 1", "print(pairs)"),
        variants: [
          { data: { sacks: [5, 5, 5], target: 10 }, note: "Three sacks of 5: any two of them make a pair." },
          { data: { sacks: [4, 9, 2], target: 30 }, note: "No pair weighs that much." },
          { data: { sacks: [6, 4, 10, 0], target: 10 } },
        ],
        wrong: [
          L("pairs = 0", "for i in range(len(sacks)):", "    for j in range(len(sacks)):", "        if sacks[i] + sacks[j] == target:", "            pairs += 1", "print(pairs)"),
          L("pairs = 0", "for i in range(len(sacks)):", "    for j in range(i, len(sacks)):", "        if sacks[i] + sacks[j] == target:", "            pairs += 1", "print(pairs)"),
          L("pairs = 0", "for i in range(len(sacks)):", "    for j in range(i + 1, len(sacks) - 1):", "        if sacks[i] + sacks[j] == target:", "            pairs += 1", "print(pairs)"),
          L("pairs = 0", "for a in sacks:", "    for b in sacks:", "        if a + b == target and a != b:", "            pairs += 1", "print(pairs)"),
        ],
        hints: [
          "Try it on paper with four sacks: which pairs are there? Each pair only needs checking once, and a sack can't pair with itself.",
          "`for a in range(4):` with `for b in range(a + 1, 4):` inside visits every pair of places once: 0-1, 0-2, 0-3, 1-2, 1-3, 2-3.",
          "The inner loop: `for j in range(___, len(sacks)):`; inside it, check whether the two sacks make the target together.",
        ],
        needs: [["for[\\s\\S]*\\n\\s+for\\b", "This one wants a loop inside a loop: one for the first sack, one for the second."]],
        advice: "One number: how many pairs.",
        codex: ["nested-loops", "range"],
      };
    },
  },
  {
    id: "bk-restock",
    topics: ["market", "bakery"],
    difficulty: 2,
    make(r): Spec {
      if (r.chance(0.5)) {
        const stock = r.sample(CROPS, r.int(4, 5));
        const wanted = Array.from({ length: r.int(4, 6) }, () => r.pick(CROPS));
        return {
          title: "Hazel's Shopping List",
          topic: "lists and for loops",
          task: [
            "`stock` is what Sable has on the stall; `wanted` is Hazel's shopping list (she sometimes writes a thing twice).",
            "Make a list of the things Hazel wants that the stall doesn't have, each written only once, in A-to-Z order.",
            "Print that list (an empty list if nothing is missing).",
          ],
          data: { stock, wanted },
          plan: ["An empty list of missing things", "Check every wanted thing", "Put it in order and show it"],
          body: L("missing = []", "for w in wanted:", "    if w not in stock and w not in missing:", "        missing.append(w)", "missing.sort()", "print(missing)"),
          variants: [
            { data: { stock: ["wheat", "mint"], wanted: ["garlic", "wheat", "garlic", "carrot"] }, note: "Garlic is on the list twice: it goes on the missing list once." },
            { data: { stock: ["wheat", "mint", "potato"], wanted: ["mint", "potato"] }, note: "The stall has everything." },
            { data: { stock: [], wanted: ["pumpkin", "cabbage"] }, note: "The stall is bare." },
          ],
          wrong: [
            L("missing = []", "for w in wanted:", "    if w not in stock:", "        missing.append(w)", "missing.sort()", "print(missing)"),
            L("missing = []", "for w in wanted:", "    if w not in stock and w not in missing:", "        missing.append(w)", "print(missing.sort())"),
            L("missing = []", "for w in wanted:", "    if w not in stock and w not in missing:", "        missing.append(w)", "print(missing)"),
            L("missing = []", "for w in wanted:", "    if w in stock and w not in missing:", "        missing.append(w)", "missing.sort()", "print(missing)"),
          ],
          hints: [
            "Walk the wanted list. A thing goes on the missing list only if the stall lacks it and it isn't on the missing list already. Sort at the end.",
            "`if egg not in basket:` asks whether something is missing from a list. `jars.sort()` sorts a list itself and gives back nothing worth printing.",
            "Inside the loop: `if w not in stock and w not in ___:` append it; after the loop sort, then print.",
          ],
          needs: [loop],
          advice: "One list, in A-to-Z order, each thing once.",
          codex: ["building-lists", "list-search", "sorting"],
        };
      }
      const stall = Array.from({ length: r.int(5, 7) }, () => r.pick(CROPS));
      const sold = Array.from({ length: r.int(2, 3) }, () => (r.chance(0.75) ? r.pick(stall) : r.pick(CROPS)));
      return {
        title: "After the Morning Rush",
        topic: "lists and for loops",
        task: [
          "`stall` lists the crates on Sable's stall, one crop per crate. `sold` lists what was sold this morning, one crate per entry.",
          "Take one crate off the stall for each sale. If something was sold that isn't on the stall (Sable sold it from the cart), leave the stall alone for that one.",
          "Then print the stall's crates in A-to-Z order.",
        ],
        data: { stall, sold },
        plan: ["One crate off for each sale", "Put the stall in order and show it"],
        body: L("for s in sold:", "    if s in stall:", "        stall.remove(s)", "stall.sort()", "print(stall)"),
        variants: [
          { data: { stall: ["mint", "wheat", "mint", "garlic"], sold: ["mint", "mint"] }, note: "Two crates of mint sold: both come off." },
          { data: { stall: ["carrot", "potato"], sold: ["pumpkin"] }, note: "Pumpkin was sold from the cart: the stall doesn't change." },
          { data: { stall: ["cabbage", "wheat"], sold: [] } },
        ],
        wrong: [
          L("for s in sold:", "    stall.remove(s)", "stall.sort()", "print(stall)"),
          L("for s in sold:", "    if s in stall:", "        stall.remove(s)", "print(stall.sort())"),
          L("for s in sold:", "    if s in stall:", "        stall.remove(s)", "print(stall)"),
          L("for s in sold:", "    if s in stall:", "        stall.remove(s)", "stall.sort(reverse=True)", "print(stall)"),
        ],
        hints: [
          "One sale at a time: is that crop on the stall? Then one crate of it comes off. Put the stall in order last.",
          "`jars.remove(\"fig\")` takes one fig out, and stops with a ValueError if there's no fig, so ask `if \"fig\" in jars:` first. `jars.sort()` sorts in place.",
          "Inside the loop: `if s in stall:` then `stall.___(s)`; after the loop sort and print.",
        ],
        needs: [loop],
        advice: "One list: the stall's crates in A-to-Z order.",
        codex: ["list-methods", "for-loops", "sorting"],
      };
    },
  },
];
