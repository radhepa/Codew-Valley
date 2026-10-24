import { py } from "../build.ts";
import type { Spec, Template } from "../build.ts";
import { CROPS } from "../rng.ts";

// The Forge: functions (parameters, return, defaults, keywords, early returns).

const L = (...lines: string[]) => lines.join("\n");
const named = (fn: string): [string, string] => ["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`];

export const FORGE: Template[] = [
  {
    id: "fg-bundles",
    topics: ["forge"],
    difficulty: 1,
    make(r): Spec {
      const size = r.int(4, 7);
      const fn = r.pick(["bundles", "sheaves_tied"]);
      return {
        title: "Tying Sheaves",
        topic: "functions: return",
        task: [
          `Wren ties loose stalks into sheaves of ${size}. A sheaf with fewer stalks than that isn't tied yet.`,
          `Write a function \`${fn}\` that is given a number of stalks and hands back how many whole sheaves Wren can tie.`,
          "Hand the answer back; don't print it inside the function.",
        ],
        plan: ["Your function goes here"],
        body: `def ${fn}(stalks):\n    return stalks // ${size}`,
        drive: `print(${fn}(${size * 3 + 1}))\nprint(${fn}(${size - 1}))`,
        variants: [{ drive: `print(${fn}(${size * 5}))\nprint(${fn}(0))`, note: "Exactly enough stalks makes whole sheaves; none makes none." }, { drive: `print(${fn}(${size * 7 + size - 1}))` }],
        wrong: [`def ${fn}(stalks):\n    print(stalks // ${size})`, `def ${fn}(stalks):\n    return stalks / ${size}`, `def ${fn}(stalks):\n    return stalks % ${size}`, `def ${fn}(stalks):\n    return 3`],
        hints: [
          "How many times does a whole sheaf fit into the pile? Try 13 stalks with sheaves of 4 on paper.",
          "`//` divides and drops the leftover: `17 // 5` is 3. A function hands a value back with `return`.",
          `\`def ${fn}(stalks):\` and inside it \`return stalks ___ ${size}\`.`,
        ],
        needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`]],
        advice: "Hand the number back with return.",
      };
    },
  },
  {
    id: "fg-yesno",
    topics: ["forge"],
    difficulty: 1,
    make(r): Spec {
      if (r.chance(0.5)) {
        const a = r.int(6, 12);
        const b = r.int(2, 5);
        const n = r.int(3, 9);
        return {
          title: "Ripe Yet?",
          topic: "functions that answer yes or no",
          task: [
            "A crop is ripe once it has grown for at least as many days as it needs.",
            "Write a function `is_ripe(days, needs)`: `days` is how long the crop has grown, `needs` is how long it needs. It hands back True if the crop is ripe and False if not.",
            "Hand the answer back; don't print it inside the function.",
          ],
          plan: ["Your function goes here"],
          body: L("def is_ripe(days, needs):", "    return days >= needs"),
          drive: `print(is_ripe(${a}, ${b}))\nprint(is_ripe(${b}, ${a}))`,
          variants: [
            { drive: "print(is_ripe(5, 5))\nprint(is_ripe(0, 3))", note: "Grown exactly as long as it needs: that's ripe." },
            { drive: `print(is_ripe(${n}, ${n + 1}))\nprint(is_ripe(${n + 1}, ${n}))` },
          ],
          wrong: [
            L("def is_ripe(days, needs):", "    return days > needs"),
            L("def is_ripe(days, needs):", "    print(days >= needs)"),
            L("def is_ripe(days, needs):", "    return needs >= days"),
            L("def is_ripe(days, needs):", "    if days >= needs:", '        return "yes"', "    else:", '        return "no"'),
          ],
          hints: [
            "Ripe or not is a yes-or-no question. A comparison already gives a True or a False you can hand back.",
            "`def big(n):` with `return n > 10` inside hands back True for 12 and False for 3, with no if needed.",
            "`def is_ripe(days, needs):` and inside it `return days ___ needs`.",
          ],
          needs: [named("is_ripe")],
          advice: "Hand back True or False with return.",
          codex: ["bool-functions", "parameters"],
        };
      }
      const [c1, c2] = r.sample(CROPS, 2);
      const k1 = r.int(5, 40);
      const k2 = r.int(5, 40);
      return {
        title: "Sack Labels",
        topic: "return vs print",
        task: [
          "Every sack in the mill gets a chalk label: the crop's name in capitals, a space, then the kilos with kg straight after the number (no space).",
          "Write a function `sack_label(crop, kilos)` that hands back the label for a sack of `kilos` kilos of `crop`.",
          "Hand the label back; don't print it inside the function. Wren chalks it up herself.",
        ],
        plan: ["Your function goes here"],
        body: L("def sack_label(crop, kilos):", '    return crop.upper() + " " + str(kilos) + "kg"'),
        drive: `print(sack_label("${c1}", ${k1}))\nprint(sack_label("${c2}", ${k2}))`,
        variants: [
          { drive: 'label = sack_label("mint", 3)\nprint(label + "!")', note: "Wren adds to the label you hand back, so it has to come back as text." },
          { drive: 'print(len(sack_label("garlic", 20)))\nprint(sack_label("fig", 100))' },
        ],
        wrong: [
          L("def sack_label(crop, kilos):", '    print(crop.upper() + " " + str(kilos) + "kg")'),
          L("def sack_label(crop, kilos):", '    return crop + " " + str(kilos) + "kg"'),
          L("def sack_label(crop, kilos):", '    return crop.upper() + str(kilos) + "kg"'),
          L("def sack_label(crop, kilos):", '    return crop.upper() + " " + str(kilos) + " kg"'),
        ],
        hints: [
          "The function builds one piece of text and hands it back. Which parts does it glue together, and where do the spaces go?",
          "`def tag(name, n):` with `return name.title() + \" x\" + str(n)` inside hands back text like Fig x3, ready for whoever called it to use.",
          "`return crop.upper() + \" \" + ___ + \"kg\"`.",
        ],
        needs: [named("sack_label")],
        advice: "Hand the label back with return.",
        codex: ["return-vs-print", "return"],
      };
    },
  },
  {
    id: "fg-choose",
    topics: ["forge"],
    difficulty: 2,
    make(r): Spec {
      if (r.chance(0.5)) {
        const low = r.int(8, 12);
        const high = low + r.int(6, 12);
        const mid = r.int(low + 1, high - 1);
        return {
          title: "Pumpkins for the Fair",
          topic: "choosing what to return",
          task: [
            "Wren sorts pumpkins for the fair by their weight in kilos.",
            `Write a function \`grade(kilos)\` that hands back one word: \`small\` for a pumpkin under ${low} kilos, \`prize\` for one over ${high} kilos, and \`fine\` for anything from ${low} to ${high}, both included.`,
          ],
          plan: ["Your function goes here"],
          body: L("def grade(kilos):", `    if kilos < ${low}:`, '        return "small"', `    elif kilos > ${high}:`, '        return "prize"', "    else:", '        return "fine"'),
          drive: `print(grade(${low - 2}))\nprint(grade(${mid}))\nprint(grade(${high + 3}))`,
          variants: [
            { drive: `print(grade(${low}))\nprint(grade(${high}))`, note: "Exactly on the edges: both are fine." },
            { drive: `print(grade(${low - 1}))\nprint(grade(${high + 1}))`, note: "Just outside the edges." },
          ],
          wrong: [
            L("def grade(kilos):", `    if kilos <= ${low}:`, '        return "small"', `    elif kilos > ${high}:`, '        return "prize"', "    else:", '        return "fine"'),
            L("def grade(kilos):", `    if kilos < ${low}:`, '        return "small"', `    elif kilos >= ${high}:`, '        return "prize"', "    else:", '        return "fine"'),
            L("def grade(kilos):", `    if kilos < ${low}:`, '        print("small")', `    elif kilos > ${high}:`, '        print("prize")', "    else:", '        print("fine")'),
            L("def grade(kilos):", `    if kilos >= ${low}:`, '        return "fine"', `    elif kilos > ${high}:`, '        return "prize"', "    else:", '        return "small"'),
          ],
          hints: [
            "Three possible answers. Decide which question to ask first, and think hard about a pumpkin that weighs exactly one of the two edge numbers.",
            "`if n < 5:` hands back \"low\", `elif n > 9:` hands back \"high\", and `else:` hands back \"middle\". The first test that is true wins.",
            `\`if kilos < ${low}:\` hands back small, then \`elif kilos ___ ${high}:\` hands back prize, and the else hands back fine.`,
          ],
          needs: [named("grade")],
          advice: "Hand back one of the three words with return.",
          codex: ["choosing-returns"],
        };
      }
      const per = r.int(4, 8);
      return {
        title: "Enough Trays",
        topic: "default parameter values",
        task: [
          "Hazel's loaves go into the oven on trays. A tray that's only partly full still counts as a tray.",
          "Write a function `trays(loaves, per_tray)` that hands back how many trays she needs for `loaves` loaves when each tray holds `per_tray`.",
          `If Wren leaves out per_tray, a tray holds ${per}.`,
        ],
        plan: ["Your function goes here"],
        body: L(`def trays(loaves, per_tray=${per}):`, "    need = loaves // per_tray", "    if loaves % per_tray > 0:", "        need += 1", "    return need"),
        drive: `print(trays(${per * 2 + 1}))\nprint(trays(${per * 3}))\nprint(trays(10, per_tray=3))`,
        variants: [
          { drive: "print(trays(0))\nprint(trays(1))", note: "No loaves need no trays; one loaf needs one tray." },
          { drive: `print(trays(12, per_tray=5))\nprint(trays(${per * 4}))`, note: "per_tray given by name, then left out with every tray full." },
        ],
        wrong: [
          L(`def trays(loaves, per_tray=${per}):`, "    return loaves // per_tray"),
          L(`def trays(loaves, per_tray=${per}):`, "    return loaves // per_tray + 1"),
          L(`def trays(loaves, per_tray=${per + 1}):`, "    need = loaves // per_tray", "    if loaves % per_tray > 0:", "        need += 1", "    return need"),
          L(`def trays(loaves, per_tray=${per}):`, `    need = loaves // ${per}`, `    if loaves % ${per} > 0:`, "        need += 1", "    return need"),
        ],
        hints: [
          "Work out 13 loaves on trays of 4 on paper. How many full trays, and is anything left over that needs one more?",
          "`17 // 5` is how many whole fives fit and `17 % 5` is what's left over. `def brew(cups, size=2):` lets a caller leave size out.",
          `\`def trays(loaves, per_tray=${per}):\` with the whole trays from \`//\`, plus one more when \`loaves % per_tray\` is more than ___.`,
        ],
        needs: [named("trays")],
        advice: "Hand the number of trays back with return.",
        codex: ["defaults-keywords", "choosing-returns"],
      };
    },
  },
  {
    id: "fg-list",
    topics: ["forge"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["heavy", "long", "average"] as const);
      if (twist === "heavy") {
        const sacks = Array.from({ length: r.int(4, 6) }, () => r.int(8, 40));
        const limit = r.int(15, 30);
        return {
          title: "The Heavy Sacks",
          topic: "a function that takes a list",
          task: [
            "Write a function `heavy_total(sacks, limit)`: `sacks` is a list of sack weights and `limit` a weight.",
            "It hands back the total weight of the sacks heavier than `limit` (a sack of exactly `limit` doesn't count). No heavy sacks, or no sacks at all, makes 0.",
          ],
          plan: ["Your function goes here"],
          body: L("def heavy_total(sacks, limit):", "    total = 0", "    for s in sacks:", "        if s > limit:", "            total += s", "    return total"),
          drive: `print(heavy_total(${py(sacks)}, ${limit}))`,
          variants: [
            { drive: "print(heavy_total([12, 20, 31, 20], 20))\nprint(heavy_total([], 10))", note: "Sacks exactly at the limit don't count, and an empty list makes 0." },
            { drive: "print(heavy_total([5, 9], 20))\nprint(heavy_total([40, 33], 20))" },
          ],
          wrong: [
            L("def heavy_total(sacks, limit):", "    total = 0", "    for s in sacks:", "        if s >= limit:", "            total += s", "    return total"),
            L("def heavy_total(sacks, limit):", "    total = 0", "    for s in sacks:", "        if s > limit:", "            total += s", "        return total"),
            L("def heavy_total(sacks, limit):", "    total = 0", "    for s in sacks:", "        if s > limit:", "            total += 1", "    return total"),
            L("def heavy_total(sacks, limit):", "    total = 0", "    for s in sacks:", "        if s > limit:", "            total += s", "    print(total)"),
          ],
          hints: [
            "Walk the list inside the function, keeping a running total of only the heavy sacks. Hand the total back once the walk is done.",
            "`def big_eggs(eggs, size):` can loop `for e in eggs:`, add up the ones over `size`, then `return` the sum after the loop, not inside it.",
            "Inside the loop: `if s ___ limit:` add it on; after the loop, `return total`.",
          ],
          needs: [named("heavy_total")],
          advice: "Hand the total back with return, after the loop.",
          codex: ["list-functions"],
        };
      }
      if (twist === "long") {
        const words = r.sample(CROPS, 4);
        const n = r.int(4, 7);
        return {
          title: "A Long Enough Name",
          topic: "returning early",
          task: [
            "Write a function `first_long(names, n)`: `names` is a list of words and `n` a number of letters.",
            "It hands back the first word in the list with more than `n` letters. If no word is that long, it hands back None.",
          ],
          plan: ["Your function goes here"],
          body: L("def first_long(names, n):", "    for name in names:", "        if len(name) > n:", "            return name", "    return None"),
          drive: `print(first_long(${py(words)}, ${n}))`,
          variants: [
            { drive: 'print(first_long(["fig", "plum", "apple", "quince"], 4))\nprint(first_long(["fig", "plum"], 4))', note: "Two words are long enough: the first wins. Then none is: None." },
            { drive: 'print(first_long(["pear", "kale"], 3))\nprint(first_long([], 2))', note: "Four letters is more than 3. An empty list has no long word." },
          ],
          wrong: [
            L("def first_long(names, n):", "    for name in names:", "        if len(name) > n:", "            return name", "        else:", "            return None"),
            L("def first_long(names, n):", "    for name in names:", "        if len(name) >= n:", "            return name", "    return None"),
            L("def first_long(names, n):", "    found = None", "    for name in names:", "        if len(name) > n:", "            found = name", "    return found"),
            L("def first_long(names, n):", "    for name in names:", "        if len(name) > n:", "            return name", '    return ""'),
          ],
          hints: [
            "Walk the words. The moment one is long enough, the function can hand it back at once. Only after the whole walk do you know there's none.",
            "`return` inside a loop leaves the function straight away. A `return None` after the loop only runs if nothing was handed back during it.",
            "Inside the loop: `if len(name) ___ n:` hand the name back; after the loop, hand back None.",
          ],
          needs: [named("first_long")],
          advice: "Hand back the first long word, or None.",
          codex: ["none-guards", "list-functions"],
        };
      }
      const kilos = Array.from({ length: r.int(3, 6) }, () => r.int(3, 15));
      return {
        title: "An Average Day",
        topic: "None and returning early",
        task: [
          "Write a function `average(kilos)` that hands back the average of a list of weights, rounded to one place after the point.",
          "An empty list has no average: hand back None for it.",
        ],
        plan: ["Your function goes here"],
        body: L("def average(kilos):", "    if len(kilos) == 0:", "        return None", "    return round(sum(kilos) / len(kilos), 1)"),
        drive: `print(average(${py(kilos)}))`,
        variants: [{ drive: "print(average([]))", note: "An empty list." }, { drive: "print(average([3, 4, 4]))\nprint(average([7]))", note: "Rounding to one place." }],
        wrong: [
          L("def average(kilos):", "    return round(sum(kilos) / len(kilos), 1)"),
          L("def average(kilos):", "    if len(kilos) == 0:", "        return 0", "    return round(sum(kilos) / len(kilos), 1)"),
          L("def average(kilos):", "    if len(kilos) == 0:", "        return None", "    return round(sum(kilos) / len(kilos))"),
          L("def average(kilos):", "    if len(kilos) == 0:", "        return None", "    print(round(sum(kilos) / len(kilos), 1))"),
        ],
        hints: [
          "Guard the door first: what should happen for an empty list, before any dividing?",
          "`if len(eggs) == 0:` with `return None` under it, at the top of a function, stops it early. `round(17 / 6, 1)` keeps one place after the point.",
          "After the guard: `return round(sum(kilos) / ___, 1)`.",
        ],
        needs: [named("average")],
        advice: "Hand back the rounded average, or None for an empty list.",
        codex: ["none-guards", "return"],
      };
    },
  },
  {
    id: "fg-team",
    topics: ["forge"],
    difficulty: 3,
    make(r): Spec {
      if (r.chance(0.5)) {
        const per = r.int(4, 8);
        const trays = L(`def trays(loaves, per_tray=${per}):`, "    need = loaves // per_tray", "    if loaves % per_tray > 0:", "        need += 1", "    return need");
        const day = (call: string) => L(`def bake_day(orders, per_tray=${per}):`, "    total = 0", "    for o in orders:", `        total += ${call}`, "    return total");
        return {
          title: "The Baking Day",
          topic: "functions calling functions",
          task: [
            "Hazel bakes each order on its own trays; a part-full tray still counts as a tray.",
            `Write \`trays(loaves, per_tray)\`: how many trays \`loaves\` loaves need when each holds \`per_tray\`. Left out, per_tray is ${per}.`,
            `Write \`bake_day(orders, per_tray)\`: \`orders\` is a list of order sizes. Hand back how many trays the whole day needs, asking \`trays\` about each order. Left out, per_tray is ${per} here too.`,
          ],
          plan: ["def trays(...):", "def bake_day(...):"],
          body: L(trays, "", day("trays(o, per_tray)")),
          drive: `print(trays(${per + 1}))\nprint(bake_day([${per * 2 + 1}, ${per}, 1]))`,
          variants: [
            { drive: "print(bake_day([10, 10], per_tray=3))\nprint(bake_day([]))", note: "per_tray given by name has to reach trays too. No orders need no trays." },
            { drive: `print(bake_day([1, 1, 1]))\nprint(trays(${per * 2}))`, note: "Three tiny orders each need a tray of their own." },
          ],
          wrong: [
            L(trays, "", day("trays(o)")),
            L(trays, "", `def bake_day(orders, per_tray=${per}):`, "    return trays(sum(orders), per_tray)"),
            L(trays, "", `def bake_day(orders, per_tray=${per}):`, "    total = 0", "    for o in orders:", "        total += trays(o, per_tray)", "    print(total)"),
            L(`def trays(loaves, per_tray=${per}):`, "    return loaves // per_tray", "", day("trays(o, per_tray)")),
          ],
          hints: [
            "Get trays right on its own first, then let bake_day lean on it: one question to trays per order, adding up the answers.",
            "One function can call another: with `def boxes(eggs, size=12):` written, `def boxes_for_all(orders, size=12):` can add up `boxes(o, size)` for each order, passing the size along.",
            "Inside bake_day's loop: `total += trays(o, ___)`.",
          ],
          needs: [named("trays"), named("bake_day"), ["trays\\s*\\([\\s\\S]*trays\\s*\\(", "Let bake_day ask trays about each order, instead of working the trays out a second time."]],
          advice: "Both functions hand their answers back with return.",
          codex: ["calling-functions", "defaults-keywords"],
        };
      }
      const needs = r.int(5, 9);
      const verdict = (test: string, guard = true) =>
        L("def verdict(fields):", ...(guard ? ["    if len(fields) == 0:", '        return "empty"'] : []), `    if ${test}:`, '        return "harvest"', '    return "wait"');
      const ripe = (cmp: string) => L("def is_ripe(days):", `    return days ${cmp} ${needs}`);
      const count = (add: string) => L("def ripe_count(fields):", "    count = 0", "    for d in fields:", "        if is_ripe(d):", `            count += ${add}`, "    return count");
      const all = (a: string, b: string, c: string) => L(a, "", b, "", c);
      return {
        title: "Harvest or Wait",
        topic: "functions calling functions",
        task: [
          `A crop is ripe once it has grown for at least ${needs} days.`,
          "Write `is_ripe(days)`: True if a crop that has grown `days` days is ripe, False if not.",
          "Write `ripe_count(fields)`: `fields` is a list of how many days each field's crop has grown. Hand back how many are ripe, asking `is_ripe` about each.",
          "Write `verdict(fields)`: hand back `harvest` when at least half the fields are ripe, `wait` when fewer are, and `empty` when there are no fields at all.",
        ],
        plan: ["def is_ripe(...):", "def ripe_count(...):", "def verdict(...):"],
        body: all(ripe(">="), count("1"), verdict("ripe_count(fields) * 2 >= len(fields)")),
        drive: `print(is_ripe(${needs}))\nprint(ripe_count([${needs - 1}, ${needs + 2}, ${needs}, 1]))\nprint(verdict([${needs + 1}, 1, 2]))`,
        variants: [
          { drive: `print(verdict([${needs}, 1]))\nprint(verdict([]))`, note: "Exactly half the fields are ripe: that's enough to harvest. Then no fields at all." },
          { drive: `print(ripe_count([${needs - 1}, ${needs - 1}]))\nprint(verdict([${needs + 3}, ${needs}, 2]))` },
        ],
        wrong: [
          all(ripe(">"), count("1"), verdict("ripe_count(fields) * 2 >= len(fields)")),
          all(ripe(">="), count("1"), verdict("ripe_count(fields) * 2 >= len(fields)", false)),
          all(ripe(">="), count("1"), verdict("ripe_count(fields) * 2 > len(fields)")),
          all(ripe(">="), count("d"), verdict("ripe_count(fields) * 2 >= len(fields)")),
        ],
        hints: [
          "Build from the bottom up: is_ripe answers about one field, ripe_count asks it about every field, and verdict asks ripe_count. Check for no fields before anything else.",
          "`def is_big(n):` with `return n > 9`, then a counting loop with `if is_big(x):`, then `if count * 2 >= len(xs):` tests for at least half without any dividing.",
          "In verdict: hand back empty for no fields first, then `if ripe_count(fields) * 2 ___ len(fields):` hand back harvest, else wait.",
        ],
        needs: [
          named("is_ripe"),
          named("ripe_count"),
          named("verdict"),
          ["is_ripe\\s*\\([\\s\\S]*is_ripe\\s*\\(", "Let ripe_count ask is_ripe about each field."],
          ["ripe_count\\s*\\([\\s\\S]*ripe_count\\s*\\(", "Let verdict ask ripe_count, instead of counting again."],
        ],
        advice: "Each function hands its answer back with return.",
        codex: ["calling-functions", "bool-functions", "choosing-returns"],
      };
    },
  },
  {
    id: "fg-spell",
    topics: ["bakery", "forge"],
    difficulty: 2,
    make(r): Spec {
      const loop: [string, string] = ["\\bfor\\b", "Let a for loop walk through it inside the function."];
      if (r.chance(0.5)) {
        const words = r.sample(CROPS, r.int(3, 5));
        const longest = (cmp: string) => L("def longest(words):", '    best = ""', "    for w in words:", `        if len(w) ${cmp} len(best):`, "            best = w", "    return best");
        return {
          title: "The Longest Word",
          topic: "a function with a loop",
          task: [
            "Write a function `longest(words)` that hands back the longest word in a list of words.",
            "If two words tie for longest, the one that comes first wins. An empty list hands back an empty string.",
          ],
          plan: ["Your function goes here"],
          body: longest(">"),
          drive: `print(longest(${py(words)}))`,
          variants: [
            { drive: 'print(longest(["kiwi", "fig", "plum", "pear"]))', note: "kiwi, plum and pear tie: kiwi came first." },
            { drive: 'print(longest([]))\nprint(longest(["quince"]))', note: "An empty list, then a list of one." },
          ],
          wrong: [
            longest(">="),
            L("def longest(words):", "    best = words[0]", "    for w in words:", "        if len(w) > len(best):", "            best = w", "    return best"),
            L("def longest(words):", '    best = ""', "    for w in words:", "        if len(w) > len(best):", "            best = w", "    return len(best)"),
            L("def longest(words):", "    if len(words) == 0:", '        return ""', "    return max(words)"),
          ],
          hints: [
            "Keep the best word so far and compare every word with it. What should the best word be before you've seen any?",
            "`len(\"oats\")` is 4. A tracker starts at something any real answer beats, and only a strictly longer word should replace it.",
            "Inside the loop: `if len(w) ___ len(best):` then `best = w`; hand back `best` after the loop.",
          ],
          needs: [named("longest"), loop],
          advice: "Hand back the longest word with return.",
          codex: ["list-functions", "loop-search"],
        };
      }
      const [w1, w2] = r.sample(CROPS, 2);
      return {
        title: "The Sign-Painter",
        topic: "building a string in a function",
        task: [
          "Hazel's sign-painter wants words spelled out in capitals, with a dash between each letter and the next, and no dash at either end.",
          "Write a function `spaced(word)` that hands that back for any word. An empty word hands back an empty string.",
        ],
        plan: ["Your function goes here"],
        body: L("def spaced(word):", '    out = ""', "    for ch in word:", '        if out != "":', '            out += "-"', "        out += ch.upper()", "    return out"),
        drive: `print(spaced("${w1}"))\nprint(spaced("${w2}"))`,
        variants: [
          { drive: 'print(spaced("fig"))\nprint(spaced("a"))', note: "A one-letter word has no dashes." },
          { drive: 'print(spaced(""))\nprint(len(spaced("oats")))', note: "An empty word, then the length of a spelled-out word." },
        ],
        wrong: [
          L("def spaced(word):", '    out = ""', "    for ch in word:", '        out += ch.upper() + "-"', "    return out"),
          L("def spaced(word):", '    out = ""', "    for ch in word:", '        if out != "":', '            out += "-"', "        out += ch", "    return out"),
          L("def spaced(word):", '    out = ""', "    for ch in word:", '        if out != "":', '            out += "-"', "        out += ch.upper()", "    print(out)"),
          L("def spaced(word):", '    out = ""', "    for ch in word:", '        out = "-" + ch.upper()', "    return out"),
        ],
        hints: [
          "Build the answer one letter at a time. A dash only goes between letters: before every letter except the first.",
          "`tag = \"\"` then `tag += \"x\"` grows a string in a loop, and `if tag != \"\":` is true once something is in it. `\"k\".upper()` is a capital K.",
          "Inside the loop: if `out` already holds something, add a dash; then add `ch.___()`.",
        ],
        needs: [named("spaced"), loop],
        advice: "Hand back the spelled-out word with return.",
        codex: ["string-building", "return"],
      };
    },
  },
];
