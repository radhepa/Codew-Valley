import { tup, type Spec, type Template } from "../build.ts";
import { CROPS, PEOPLE, seedOf, type Rng } from "../rng.ts";

// The Observatory: searching, sorting by hand, sort keys, recursion, generators, and small whole programs.

/** Villagers who can be listed (Wren asks the question, so she never is the answer). */
const FOLK = PEOPLE.filter((p) => p !== "Wren");
const CHORES = ["weeding", "milking", "baking", "mending", "sweeping", "fishing", "feeding hens", "chopping wood"];
const NO_INDEX: [string, string] = ["^(?![\\s\\S]*\\.index\\()", "Walk the list yourself today, without .index(): Wren wants to see the search."];
const NO_SORT: [string, string] = ["^(?![\\s\\S]*(\\bsorted\\(|\\.sort\\())", "Do the sorting by hand today, with no sorted() or .sort(): Wren wants to see every swap."];
const csv = (rows: [string, string, number][]) => "name,crop,kilos\n" + rows.map((x) => x.join(",")).join("\n") + "\n";
/** A starter line that changes with today's file: Wren's own answer is remembered by its code, so code that only reads files needs one. */
const bookLine = (text: string) => `# Harvest book no. ${10000 + (seedOf(text) % 90000)}`;

/** Two names where the first comes later in the alphabet (so ties expose the tie-break). */
const backwards = (r: Rng): [string, string] => {
  const [a, b] = r.sample(FOLK, 2);
  return a > b ? [a, b] : [b, a];
};

export const OBSERVATORY: Template[] = [
  {
    id: "ob-search",
    topics: ["observatory"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["linear", "bright", "binary"] as const);
      if (twist === "linear") {
        const [dup, missing, ...rest] = r.sample(CROPS, 6);
        const drawers = r.shuffle([...rest, dup]);
        const at = r.int(0, drawers.length - 1);
        drawers.splice(at, 0, dup);
        const fn = "drawer_of";
        const body = `def ${fn}(drawers, wanted):\n    for i in range(len(drawers)):\n        if drawers[i] == wanted:\n            return i\n    return -1`;
        return {
          title: "The Seed Cabinet",
          topic: "linear search",
          task: [
            "Wren's seed cabinet has a row of drawers. A list of what's in each drawer, from the left, is called `drawers`.",
            `Write a function \`${fn}(drawers, wanted)\` that hands back the place of the first drawer holding \`wanted\` (places count from 0), or -1 when no drawer holds it.`,
            "Walk the drawers yourself, one by one.",
          ],
          plan: ["Your function goes here"],
          body,
          drive: `d = ${JSON.stringify(drawers)}\nprint(${fn}(d, "${dup}"))\nprint(${fn}(d, "${drawers[drawers.length - 1]}"))\nprint(${fn}(d, "${missing}"))`,
          variants: [
            { drive: `print(${fn}([], "${dup}"))\nprint(${fn}(["${missing}"], "${missing}"))`, note: "An empty cabinet; then a cabinet of one drawer." },
            { drive: `d = ["mint", "oats", "mint", "rye"]\nprint(${fn}(d, "mint"))\nprint(${fn}(d, "rye"))\nprint(${fn}(d, "kale"))`, note: "Mint is in two drawers: the first one counts." },
          ],
          wrong: [
            `def ${fn}(drawers, wanted):\n    for i in range(len(drawers)):\n        if drawers[i] == wanted:\n            return i\n        else:\n            return -1`,
            `def ${fn}(drawers, wanted):\n    place = -1\n    for i in range(len(drawers)):\n        if drawers[i] == wanted:\n            place = i\n    return place`,
            `def ${fn}(drawers, wanted):\n    for i in range(len(drawers)):\n        if drawers[i] == wanted:\n            return i`,
            `def ${fn}(drawers, wanted):\n    if wanted in drawers:\n        return drawers.index(wanted)\n    return -1`,
          ],
          hints: [
            "When can you be sure the seed isn't there? Only after you've looked in every drawer, not after the first wrong one.",
            "`for i in range(len(eggs)):` walks the places; `return i` stops the whole function as soon as you find what you want.",
            `In the loop, \`if drawers[i] == wanted: return i\`; after the loop, \`return ___\``,
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`], NO_INDEX],
          advice: "Hand back a place number, or -1.",
          codex: ["searching"],
        };
      }
      if (twist === "bright") {
        const limit = r.int(5, 8);
        const stars = Array.from({ length: r.int(5, 7) }, () => r.int(1, limit - 1));
        stars[r.int(1, stars.length - 2)] = r.int(limit + 1, 10);
        stars.push(limit);
        const fn = "first_bright";
        const body = `def ${fn}(stars, limit):\n    for i in range(len(stars)):\n        if stars[i] >= limit:\n            return i\n    return -1`;
        return {
          title: "The First Bright Star",
          topic: "searching with a condition",
          task: [
            "Pip has noted how bright each star in a row of the sky is, from left to right.",
            `Write a function \`${fn}(stars, limit)\` that hands back the place (counting from 0) of the first star at least as bright as \`limit\`, or -1 when none is that bright.`,
            "Walk the stars yourself, one by one.",
          ],
          plan: ["Your function goes here"],
          body,
          drive: `s = ${JSON.stringify(stars)}\nprint(${fn}(s, ${limit}))\nprint(${fn}(s, 11))`,
          variants: [
            { drive: `print(${fn}([3, 7, 9, 7], 7))\nprint(${fn}([], 4))`, note: "The first star is exactly as bright as the limit; then an empty sky." },
            { drive: `print(${fn}([9, 1, 2], 2))\nprint(${fn}([1, 2, 3], 3))` },
          ],
          wrong: [
            body.replace(">=", ">"),
            body.replace("return i", "return stars[i]"),
            `def ${fn}(stars, limit):\n    place = -1\n    for i in range(len(stars)):\n        if stars[i] >= limit:\n            place = i\n    return place`,
          ],
          hints: [
            "You want the first one that's bright enough, and its place in the row, not how bright it is.",
            "`for i in range(len(jars)):` walks the places, `jars[i]` is the item there, and `return i` stops as soon as one passes the test.",
            `In the loop, \`if stars[i] ___ limit: return i\`; after the loop, \`return -1\``,
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`], NO_INDEX],
          advice: "Hand back a place number, or -1.",
          codex: ["searching"],
        };
      }
      const heights = r.ints(r.int(7, 11), 1, 60).sort((a, b) => a - b);
      const fn = "binary_find";
      const body = `def ${fn}(heights, target):\n    lo = 0\n    hi = len(heights) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if heights[mid] == target:\n            return mid\n        if heights[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1`;
      return {
        title: "Halving the Shelf",
        topic: "binary search",
        task: [
          "Odo's star charts stand on a long shelf, sorted from shortest to tallest, and no two are the same height.",
          `Write a function \`${fn}(heights, target)\` that hands back the place (counting from 0) of the chart that is \`target\` tall, or -1 when there is none.`,
          "Be quick about it: look at the middle of the part still left each time, and throw away the half it can't be in.",
        ],
        plan: ["Your function goes here"],
        body,
        drive: `h = ${JSON.stringify(heights)}\nprint(${fn}(h, ${heights[r.int(0, heights.length - 1)]}))\nprint(${fn}(h, ${heights[heights.length - 1]}))\nprint(${fn}(h, 61))\nprint(${fn}(h, 0))`,
        variants: [
          { drive: `print(${fn}([5], 5))\nprint(${fn}([], 5))`, note: "A shelf of one chart; then an empty shelf." },
          { drive: `h = [2, 4, 6, 8, 10, 12]\nfor t in [2, 7, 12, 10]:\n    print(${fn}(h, t))`, note: "The very ends of the shelf, and a gap between charts." },
        ],
        wrong: [
          body.replace("while lo <= hi", "while lo < hi"),
          body.replace("    return -1", "    return lo"),
          body.replace("hi = len(heights) - 1", "hi = len(heights)"),
        ],
        hints: [
          "Keep two markers: the first and last place the chart could still be. Each look at the middle moves one of them past the middle.",
          "With `lo = 0` and `hi = len(row) - 1`, `mid = (lo + hi) // 2` is the middle. If `row[mid]` is too small, the answer is to the right: `lo = mid + 1`.",
          `\`while lo ___ hi:\`, then look at \`mid = (lo + hi) // 2\` and move \`lo\` or \`hi\`.`,
        ],
        needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`], ["\\bwhile\\b", "Let a while loop keep halving until the markers cross."], ["//\\s*2", "Look at the middle each time: halfway between the two markers."], NO_INDEX],
        advice: "Hand back a place number, or -1.",
        codex: ["binary-search", "searching"],
      };
    },
  },
  {
    id: "ob-sort",
    topics: ["observatory"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["byhand", "keys"] as const);
      if (twist === "byhand") {
        const fn = r.pick(["line_up", "sort_sacks"]);
        const kilos = Array.from({ length: r.int(5, 7) }, () => r.int(3, 40));
        const sel = (inner: string) =>
          `def ${fn}(kilos):\n    line = kilos[:]\n    for i in range(len(line)):\n        small = i\n        for j in ${inner}:\n            if line[j] < line[small]:\n                small = j\n        line[i], line[small] = line[small], line[i]\n    return line`;
        const body = sel("range(i + 1, len(line))");
        return {
          title: "Sacks in a Row",
          topic: "sorting by hand",
          task: [
            `Write a function \`${fn}(kilos)\` that hands back a new list of the same weights from lightest to heaviest.`,
            "Leave the list you were given just as it was.",
            "Do the sorting yourself: find the lightest, put it first, then the lightest of the rest, and so on (or slide each one back into place).",
          ],
          plan: ["Your function goes here"],
          body,
          drive: `w = ${JSON.stringify(kilos)}\nprint(${fn}(w))\nprint(w)`,
          variants: [
            { drive: `w = [9, 3, 9, 1, 3]\nprint(${fn}(w))\nprint(w)`, note: "Some sacks weigh the same." },
            { drive: `print(${fn}([]))\nprint(${fn}([7]))\nprint(${fn}([2, 1]))`, note: "No sacks, one sack, two sacks." },
          ],
          wrong: [
            body.replace("line = kilos[:]", "line = kilos"),
            sel("range(i + 1, len(line) - 1)"),
            body.replace("line[j] < line[small]", "line[j] > line[small]"),
            `def ${fn}(kilos):\n    return sorted(kilos)`,
          ],
          hints: [
            "Copy the list first, so the one you were given doesn't change. Then, for each place from the front, which weight belongs there?",
            "`row[:]` is a copy of `row`. `row[a], row[b] = row[b], row[a]` swaps two items. Remember where the smallest so far is, not just its value.",
            "For each `i`, look at every `j` in `range(i + 1, ___)` for something lighter, then swap it into place `i`.",
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`], NO_SORT],
          advice: "A new list, lightest first, and the old one untouched.",
          codex: ["sorting-algorithms"],
        };
      }
      const n = r.int(5, 6);
      const names = r.sample(FOLK, n);
      const kg = names.map(() => r.int(8, 40));
      const [i, j] = r.sample(Array.from({ length: n }, (_, k) => k), 2).sort((a, b) => a - b);
      kg[j] = kg[i];
      if (names[i] < names[j]) [names[i], names[j]] = [names[j], names[i]];
      const [p, q] = backwards(r);
      const body = "def heavy_first(sack):\n    return (-sack[1], sack[0])\n\nfor name, kg in sorted(sacks, key=heavy_first):\n    print(name)";
      return {
        title: "Who Brought the Most",
        topic: "sorting with a key",
        task: [
          "`sacks` holds who brought each sack to the mill and how many kilos it weighs.",
          "Print the names from the heaviest sack to the lightest, one name per line.",
          "When two sacks weigh the same, the name that comes first in the alphabet goes first.",
        ],
        data: { sacks: names.map((x, k) => tup(x, kg[k])) },
        plan: ["Decide what to sort by", "Print the names in that order"],
        body,
        variants: [
          { data: { sacks: [tup(p, 20), tup(q, 20), tup("Odo", 31)] }, note: "Two sacks weigh the same." },
          { data: { sacks: [tup(p, 5)] }, note: "Just one sack." },
          { data: { sacks: [tup("Tock", 12), tup("Bram", 30), tup("Pip", 12), tup("Hazel", 12)] }, note: "Three sacks tie." },
        ],
        wrong: [
          "for name, kg in sorted(sacks, key=lambda s: (s[1], s[0]), reverse=True):\n    print(name)",
          "for name, kg in sorted(sacks, key=lambda s: s[1], reverse=True):\n    print(name)",
          "def heavy_first(sack):\n    return (sack[1], sack[0])\n\nfor name, kg in sorted(sacks, key=heavy_first):\n    print(name)",
        ],
        hints: [
          "Two things decide the order: the weight first, then the name. One of them goes big to small and the other A to Z. Can a single key say both?",
          "A key can hand back a tuple: tuples compare their first items, then their second on a tie. A minus sign flips a number: `(-height, name)` puts the tallest first and breaks ties A to Z.",
          "`def heavy_first(sack): return (___, sack[0])`, then loop over `sorted(sacks, key=heavy_first)`.",
        ],
        needs: [["key\\s*=", "Give sorted a key that says what to sort by."]],
        advice: "Just the names, heaviest first, one per line.",
        codex: ["sort-keys"],
      };
    },
  },
  {
    id: "ob-nest",
    topics: ["observatory"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["nested", "gen", "next"] as const);
      if (twist === "nested") {
        const n = () => r.int(1, 9);
        const pile = `[${n()}, [${n()}, ${n()}], [[${n()}], ${n()}, [${n()}, [${n()}]]]]`;
        const fn = "weigh_all";
        const body = `def ${fn}(pile):\n    total = 0\n    for x in pile:\n        if isinstance(x, list):\n            total += ${fn}(x)\n        else:\n            total += x\n    return total`;
        return {
          title: "Baskets in Baskets",
          topic: "recursion over nested lists",
          task: [
            "Wren's stores are a muddle: some baskets hold apples' weights as numbers, some hold smaller baskets, which hold numbers or yet smaller baskets, as deep as you like.",
            `Write a function \`${fn}(pile)\` that hands back the total of every number in the pile, however deep it sits.`,
            "Let the function handle the baskets inside by calling itself.",
          ],
          plan: ["Your function goes here"],
          body,
          drive: `print(${fn}(${pile}))`,
          variants: [
            { drive: `print(${fn}([]))\nprint(${fn}([[], [[]]]))`, note: "Empty baskets, and baskets of empty baskets." },
            { drive: `print(${fn}([1, [2, [3, [4, [5]]]]]))\nprint(${fn}([7, 8]))`, note: "Five baskets deep; then no inner baskets at all." },
          ],
          wrong: [
            body.replace(`total += ${fn}(x)`, "total += sum(x)"),
            body.replace(`total += ${fn}(x)`, `${fn}(x)`),
            body.replace(`total += ${fn}(x)`, "total += 1").replace("total += x", "total += 1"),
          ],
          hints: [
            "A basket inside a basket is just a smaller pile. Who already knows how to weigh a pile?",
            "`isinstance(thing, list)` says whether you're holding another list. A function may call itself on the smaller part and use what it hands back.",
            `For each \`x\`: if it's a list, \`total += ___(x)\`; otherwise \`total += x\`.`,
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`], [`${fn}\\s*\\([\\s\\S]*${fn}\\s*\\(`, `Let ${fn} call itself for the baskets inside baskets.`]],
          advice: "Hand back one total.",
          codex: ["recursion-data", "recursion"],
        };
      }
      if (twist === "gen") {
        const limit = r.int(4, 8);
        const rain = Array.from({ length: r.int(6, 9) }, () => r.int(0, 12));
        rain[r.int(0, rain.length - 1)] = limit;
        const fn = "wet_days";
        const body = `def ${fn}(rain, limit):\n    for i in range(len(rain)):\n        if rain[i] >= limit:\n            yield i + 1`;
        return {
          title: "The Wet Days",
          topic: "generators and yield",
          task: [
            "`rain` lists how much rain fell each day, from day 1 on.",
            `Write a generator \`${fn}(rain, limit)\` that hands out, one at a time, the day number (counting from 1) of every day with at least \`limit\` rain.`,
            "Hand them out as you find them; don't build a list.",
          ],
          plan: ["Your generator goes here"],
          body,
          drive: `r = ${JSON.stringify(rain)}\nprint(list(${fn}(r, ${limit})))\ng = ${fn}(r, ${limit})\nprint(next(g))\nprint(next(g, 0))`,
          variants: [
            { drive: `print(list(${fn}([1, 2, 0], 5)))\nprint(next(${fn}([1, 2, 0], 5), 0))`, note: "A dry week: no wet days at all." },
            { drive: `g = ${fn}([5, 9, 5, 2], 5)\nprint(next(g), next(g), next(g))\nprint(next(g, 0))`, note: "Some days had exactly the limit." },
          ],
          wrong: [body.replace("yield i + 1", "yield i"), body.replace(">=", ">"), `def ${fn}(rain, limit):\n    days = []\n    for i in range(len(rain)):\n        if rain[i] >= limit:\n            days.append(i + 1)\n    return days`],
          hints: [
            "A generator pauses each time it hands something out, and carries on from there when asked again. Where in the loop should it hand out a day?",
            "`yield n` hands out n and pauses. `next(gen)` asks for one value; `next(gen, 0)` gives 0 when nothing is left; `list(gen)` collects them all.",
            "In the loop, when `rain[i] >= limit`, `yield ___`",
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a generator named ${fn}.`], ["\\byield\\b", "This one is generator practice: hand the days out one at a time with yield."]],
          advice: "Day numbers count from 1.",
          codex: ["generators", "generator-expressions"],
        };
      }
      const start = r.int(1, 9);
      const gap = r.int(3, 9);
      const day = start + gap * r.int(3, 8) + r.int(1, gap - 1);
      const body = "def sowing_days(start, gap):\n    day = start\n    while True:\n        yield day\n        day += gap\n\n\ndef first_after(start, gap, day):\n    return next(d for d in sowing_days(start, gap) if d > day)";
      return {
        title: "The Endless Almanac",
        topic: "endless generators and next()",
        task: [
          "Write a generator `sowing_days(start, gap)` that never ends: it hands out `start`, then the day `gap` days after that, and so on, one at a time.",
          "Write a function `first_after(start, gap, day)` that hands back the first sowing day that comes after `day` (not on it), taking days from your generator only until it finds one.",
        ],
        plan: ["Your generator goes here", "Your function goes here"],
        body,
        drive: `g = sowing_days(${start}, ${gap})\nprint(next(g), next(g), next(g))\nprint(first_after(${start}, ${gap}, ${day}))`,
        variants: [
          { drive: `print(first_after(3, 5, 18))\nprint(first_after(10, 4, 2))`, note: "Day 18 is itself a sowing day: Wren wants the one after. Then a day before the first sowing." },
          { drive: `print(first_after(1, 3, 500))`, note: "A day far into the year." },
        ],
        wrong: [
          body.replace("if d > day", "if d >= day"),
          body.replace("    while True:\n        yield day\n        day += gap", "    while True:\n        day += gap\n        yield day"),
          body.replace("    day = start\n    while True:\n        yield day\n        day += gap", "    for k in range(50):\n        yield start + k * gap"),
        ],
        hints: [
          "The generator only works when asked, so it's fine for it to go on forever. The function asks it for days until one is late enough.",
          "`while True:` with a `yield` inside never ends, safely. `next(n for n in nums if n > 10)` gives the first value that passes the test and looks no further.",
          "`return next(d for d in sowing_days(start, gap) if d ___ day)`",
        ],
        needs: [["def\\s+sowing_days\\s*\\(", "Wren asks for a generator named sowing_days."], ["\\byield\\b", "Hand the days out one at a time with yield."], ["def\\s+first_after\\s*\\(", "Wren asks for a function named first_after."], ["next\\(", "Take days from the generator with next()."]],
        advice: "The first sowing day strictly after the given day.",
        codex: ["generator-expressions", "generators"],
      };
    },
  },
  {
    id: "ob-report",
    topics: ["townhall", "library", "observatory"],
    difficulty: 3,
    make(r): Spec {
      const by = r.pick(["crop", "name"] as const);
      const crops = r.sample(CROPS, 5);
      const folk = r.sample(FOLK, 5);
      const today: [string, string, number][] = Array.from({ length: r.int(9, 12) }, () => [r.pick(folk), r.pick(crops), r.int(2, 30)]);
      const what = by === "crop" ? "crop" : "villager";
      const tie: [string, string, number][] =
        by === "crop"
          ? [["Odo", "wheat", 10], ["Pip", "mint", 6], ["Bram", "garlic", 4], ["Odo", "carrot", 9], ["Hazel", "mint", 4]]
          : [["Tock", "wheat", 8], ["Bram", "mint", 5], ["Tock", "garlic", 2], ["Bram", "carrot", 5], ["Sable", "mint", 3], ["Ingrid", "wheat", 1]];
      const two: [string, string, number][] = [["Rook", "potato", 7], ["Mirela", "chamomile", 3], ["Rook", "potato", 2]];
      const body = `import csv\n\ntotals = {}\nwith open("harvest.csv") as f:\n    for row in csv.DictReader(f):\n        key = row["${by}"]\n        totals[key] = totals.get(key, 0) + int(row["kilos"])\n\n\ndef heaviest_first(key):\n    return (-totals[key], key)\n\n\nfor key in sorted(totals, key=heaviest_first)[:3]:\n    print(f"{key}: {totals[key]}")`;
      return {
        title: "The Week's Top Three",
        topic: "a small program: files, dictionaries and sort keys",
        task: [
          "`harvest.csv` holds every basket brought in this week: who brought it, which crop, and the kilos.",
          `Add up the kilos for each ${what}.`,
          `Print the top three, heaviest total first, one line each: the ${what === "crop" ? "crop" : "name"}, a colon and a space, then the total. When two totals tie, the one first in the alphabet goes first.`,
          `If there are fewer than three ${what}s, print them all.`,
        ],
        head: bookLine(csv(today)),
        files: { "harvest.csv": csv(today) },
        plan: ["Read the file and add up the totals", "Decide the order", "Print the top three"],
        body,
        variants: [
          { files: { "harvest.csv": csv(tie) }, note: "Two totals tie at the top." },
          { files: { "harvest.csv": csv(two) }, note: "Only two different ones this week." },
          { files: { "harvest.csv": csv(Array.from({ length: 8 }, () => [r.pick(folk), r.pick(crops), r.int(2, 30)])) } },
        ],
        wrong: [
          body.replace('totals.get(key, 0) + int(row["kilos"])', "totals.get(key, 0) + 1"),
          body.replace("sorted(totals, key=heaviest_first)", "sorted(totals, key=totals.get, reverse=True)"),
          body.replace("sorted(totals, key=heaviest_first)[:3]", "sorted(totals, key=heaviest_first)"),
          body.replace('row["' + by + '"]', 'row["' + (by === "crop" ? "name" : "crop") + '"]'),
        ],
        hints: [
          "Three jobs, one after another: add up, put in order, print the first few. Work out on paper what the order rule needs when two totals are equal.",
          "`counts[w] = counts.get(w, 0) + n` adds to a running total. A key can hand back a tuple like `(-score, name)`: biggest score first, ties A to Z. `[:3]` keeps the first three, or fewer.",
          "`for key in sorted(totals, key=heaviest_first)[:___]:` and print each with its total.",
        ],
        needs: [["key\\s*=", "Give sorted a key that ranks by total, then by name."]],
        advice: `Up to three lines: the ${what}, a colon and a space, the total.`,
        codex: ["big-programs", "sort-keys", "csv-dicts"],
      };
    },
  },
  {
    id: "ob-roster",
    topics: ["guildhall", "observatory"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["anglers", "shelf"] as const);
      if (twist === "anglers") {
        const [p, q] = backwards(r);
        const others = r.sample(FOLK.filter((x) => x !== p && x !== q), 3);
        const tied = r.int(3, 12);
        const list = r.shuffle([`Angler("${p}", ${tied})`, `Angler("${q}", ${tied})`, ...others.map((o) => `Angler("${o}", ${r.int(1, 14)})`)]);
        // keep the tied pair in backwards order in the list, so a tie-break that only keeps the list's order fails
        const ip = list.indexOf(`Angler("${p}", ${tied})`);
        const iq = list.indexOf(`Angler("${q}", ${tied})`);
        if (ip > iq) [list[ip], list[iq]] = [list[iq], list[ip]];
        const cls = "class Angler:\n    def __init__(self, name, fish):\n        self.name = name\n        self.fish = fish\n\n\n";
        const body = cls + "def by_catch(a):\n    return (-a.fish, a.name)\n\n\ndef ranking(anglers):\n    return [a.name for a in sorted(anglers, key=by_catch)]";
        return {
          title: "The Fishing Match",
          topic: "objects sorted by two keys",
          task: [
            "Write a class `Angler`: `Angler(name, fish)` keeps the angler's name and how many fish they caught.",
            "Write a function `ranking(anglers)` that hands back a list of the names, most fish first. When two anglers caught the same number, the name first in the alphabet goes first.",
          ],
          plan: ["The Angler class", "The ranking function"],
          body,
          drive: `print(ranking([${list.join(", ")}]))`,
          variants: [
            { drive: `print(ranking([]))\nprint(ranking([Angler("${q}", 2)]))`, note: "Nobody fished; then just one angler." },
            { drive: `print(ranking([Angler("Tock", 5), Angler("Bram", 5), Angler("Pip", 5), Angler("Odo", 9)]))`, note: "Three anglers tie." },
          ],
          wrong: [
            cls + "def ranking(anglers):\n    return [a.name for a in sorted(anglers, key=lambda a: (a.fish, a.name), reverse=True)]",
            cls + "def ranking(anglers):\n    return [a.name for a in sorted(anglers, key=lambda a: a.fish, reverse=True)]",
            cls + "def by_catch(a):\n    return (a.fish, a.name)\n\n\ndef ranking(anglers):\n    return [a.name for a in sorted(anglers, key=by_catch)]",
            cls + "def ranking(anglers):\n    return [a.name for a in sorted(anglers)]",
          ],
          hints: [
            "Python can't compare two anglers by itself: you tell it what to look at. Two things decide the order, and they go in opposite directions.",
            "`sorted(cakes, key=cheap_then_tall)` with `def cheap_then_tall(c): return (c.price, -c.height)` sorts by price, then tallest first on a tie.",
            "`def by_catch(a): return (___, a.name)`, then the names from `sorted(anglers, key=by_catch)`.",
          ],
          needs: [["class\\s+Angler\\b", "Wren asks for a class named Angler."], ["def\\s+ranking\\s*\\(", "Wren asks for a function named ranking."]],
          advice: "A list of names, most fish first.",
          codex: ["sort-keys", "object-lists"],
        };
      }
      const [c1, c2, c3] = r.sample(CROPS, 3);
      const list = r.shuffle([`Sack("${c1}", ${r.int(5, 20)})`, `Sack("${c2}", ${r.int(5, 20)})`, `Sack("${c1}", ${r.int(21, 40)})`, `Sack("${c3}", ${r.int(5, 40)})`, `Sack("${c2}", ${r.int(21, 40)})`]);
      const cls = 'class Sack:\n    def __init__(self, crop, kilos):\n        self.crop = crop\n        self.kilos = kilos\n\n    def __str__(self):\n        return f"{self.crop} {self.kilos}"\n\n\n';
      const body = cls + "def shelf_key(s):\n    return (s.crop, -s.kilos)\n\n\ndef shelf_order(sacks):\n    return sorted(sacks, key=shelf_key)";
      const show = "for s in shelf_order(xs):\n    print(s)\nprint(xs[0])";
      return {
        title: "The Storeroom Shelf",
        topic: "objects sorted by two keys",
        task: [
          "Write a class `Sack`: `Sack(crop, kilos)` keeps both. Printing a sack shows its crop, a space, then its kilos.",
          "Write a function `shelf_order(sacks)` that hands back a new list of the sacks in shelf order: crops A to Z, and within one crop, the heaviest sack first.",
          "Leave the list you were given in its old order.",
        ],
        plan: ["The Sack class", "The shelf_order function"],
        body,
        drive: `xs = [${list.join(", ")}]\n${show}`,
        variants: [
          { drive: `xs = [Sack("rye", 3), Sack("oats", 4), Sack("rye", 9), Sack("oats", 4)]\n${show}`, note: "Two oat sacks weigh the same." },
          { drive: `xs = [Sack("${c3}", 6)]\n${show}`, note: "Just one sack." },
        ],
        wrong: [
          cls + "def shelf_order(sacks):\n    return sorted(sacks, key=lambda s: (s.crop, s.kilos), reverse=True)",
          cls + "def shelf_order(sacks):\n    return sorted(sacks, key=lambda s: s.crop)",
          cls + "def shelf_key(s):\n    return (s.crop, -s.kilos)\n\n\ndef shelf_order(sacks):\n    sacks.sort(key=shelf_key)\n    return sacks",
          cls.replace('return f"{self.crop} {self.kilos}"', 'print(self.crop, self.kilos)') + "def shelf_key(s):\n    return (s.crop, -s.kilos)\n\n\ndef shelf_order(sacks):\n    return sorted(sacks, key=shelf_key)",
        ],
        hints: [
          "Two things decide the order, in opposite directions: the crop A to Z, the kilos big to small. And `sorted` makes a new list, while `.sort()` changes the old one.",
          "`def cheap_then_tall(c): return (c.price, -c.height)` as a key sorts by price, then tallest first on a tie. `def __str__(self):` hands back the text a print shows.",
          "`def shelf_key(s): return (s.crop, ___)`, then `return sorted(sacks, key=shelf_key)`.",
        ],
        needs: [["class\\s+Sack\\b", "Wren asks for a class named Sack."], ["def\\s+shelf_order\\s*\\(", "Wren asks for a function named shelf_order."], ["def\\s+__str__\\s*\\(", "Printing a sack should show its text: that's what __str__ is for."]],
        advice: "Crops A to Z, heaviest first within a crop.",
        codex: ["sort-keys", "str-method"],
      };
    },
  },
  {
    id: "ob-planner",
    topics: ["forge", "dock", "library", "observatory"],
    difficulty: 3,
    make(r): Spec {
      const names = r.sample(CHORES, r.int(4, 6));
      const chores: Record<string, number> = {};
      for (const c of names) chores[c] = r.pick([10, 15, 20, 25, 30, 40, 45, 60, 90]);
      const total = Object.values(chores).reduce((a, b) => a + b, 0);
      const free = r.int(Math.min(...Object.values(chores)), total - 1);
      const body =
        "def plan_day(chores, free):\n    order = sorted([(mins, name) for name, mins in chores.items()])\n    done = []\n    i = 0\n    while i < len(order) and order[i][0] <= free:\n        free -= order[i][0]\n        done.append(order[i][1])\n        i += 1\n    return done";
      return {
        title: "Planning Wren's Day",
        topic: "a small program: functions, while and a dictionary",
        task: [
          "`chores` is a dictionary of today's chores and how many minutes each one takes. Wren has `free` minutes.",
          "Write a function `plan_day(chores, free)` that hands back the list of chores Wren does, in the order she does them.",
          "She does the shortest chore first, then the next shortest, and so on; two chores of the same length go in alphabetical order. She keeps going while the next chore still fits in the minutes she has left, and stops at the first one that doesn't.",
        ],
        plan: ["Put the chores in Wren's order", "Walk them while there's time", "Hand back what she did"],
        body,
        drive: `print(plan_day(${JSON.stringify(chores)}, ${free}))`,
        variants: [
          { drive: 'print(plan_day({"weeding": 20, "baking": 20, "mending": 45}, 40))', note: "Two chores take the same time." },
          { drive: 'print(plan_day({"milking": 30, "sweeping": 15, "fishing": 60}, 45))\nprint(plan_day({"fishing": 30, "milking": 25, "sweeping": 10}, 40))', note: "The chores fill the time exactly; then the time runs short partway." },
          { drive: 'print(plan_day({"milking": 30, "sweeping": 15}, 5))\nprint(plan_day({}, 60))\nprint(plan_day({"baking": 25}, 100))', note: "Nothing fits; no chores at all; then plenty of time." },
        ],
        wrong: [
          body.replace("order[i][0] <= free", "order[i][0] < free"),
          body.replace("sorted([(mins, name) for name, mins in chores.items()])", "[(chores[c], c) for c in sorted(chores, key=chores.get)]"),
          body.replace("        free -= order[i][0]\n", ""),
          body.replace("while i < len(order) and order[i][0] <= free:", "while i < len(order) and free > 0:"),
        ],
        hints: [
          "Two jobs: first put the chores in Wren's order, then walk that order while there's still time. A loop that stops on a condition is a good fit for the walk.",
          "Tuples sort by their first item, then their second on a tie: `sorted([(3, \"plum\"), (1, \"fig\"), (3, \"apple\")])`. `while i < len(row) and row[i] <= left:` stops at the first that doesn't fit.",
          "`while i < len(order) and order[i][0] ___ free:` do it: take its minutes off `free`, add its name, and move on.",
        ],
        needs: [["def\\s+plan_day\\s*\\(", "Wren asks for a function named plan_day."], ["\\bwhile\\b", "Walk the chores with a while loop: it stops at the first one that doesn't fit."]],
        advice: "A list of chore names, in the order she does them.",
        codex: ["big-programs", "sort-keys", "while"],
      };
    },
  },
];
