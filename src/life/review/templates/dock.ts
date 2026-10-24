import type { Spec, Template } from "../build.ts";

// Fisher's Dock: while loops, counters, break / continue, random with a seed, walking strings.
// Mixed mill + dock questions live here too (the dock is the latest building they use).

const WHILE: [string, string] = ["\\bwhile\\b", "This one is while-loop practice: let a while loop do the walking."];
const WORDS = ["bell", "rope", "pier", "gull", "reed", "moss", "heron", "anchor", "lantern", "otter", "willow", "harbour"];
const NOISE = "bcdfghjklmnpqrstvwxyz";

export const DOCK: Template[] = [
  {
    id: "dk-count",
    topics: ["dock"],
    difficulty: 1,
    make(r): Spec {
      if (r.chance(0.5)) {
        const first = r.int(1, 5);
        const step = r.int(2, 5);
        const last = first + step * r.int(4, 8) + r.int(0, step - 1);
        return {
          title: "Lantern Hooks",
          topic: "while loops: counting in steps",
          task: [
            "Marlo is fixing lantern hooks along the new pier. The first hook goes on plank `first`; each next hook goes `step` planks further along.",
            "He keeps going as long as the plank number isn't past `last`.",
            "Print the number of every plank that gets a hook, one per line, in order.",
          ],
          data: { first, step, last },
          plan: ["Start at the first plank", "Hook it, then move along, until you pass the last plank"],
          body: "plank = first\nwhile plank <= last:\n    print(plank)\n    plank += step",
          variants: [
            { data: { first: 2, step: 3, last: 14 }, note: "The walk lands exactly on the last plank: it gets a hook too." },
            { data: { first: 9, step: 2, last: 5 }, note: "The first plank is already past the last one: no hooks at all." },
            { data: { first: 1, step: 1, last: 4 } },
          ],
          wrong: [
            "plank = first\nwhile plank < last:\n    print(plank)\n    plank += step",
            "plank = first\nwhile plank <= last:\n    plank += step\n    print(plank)",
            "plank = 0\nwhile plank <= last:\n    print(plank)\n    plank += step",
          ],
          hints: [
            "Keep the plank you're standing on in a variable. Each round: hook it (print it), then step along. When must the walk stop?",
            "`egg = 3`, then `while egg <= 9:` with `print(egg)` and `egg += 2` inside prints 3, 5, 7 and 9.",
            "`plank = first`, then `while plank ___ last:` with `print(plank)` and `plank += step` inside.",
          ],
          needs: [WHILE],
          advice: "One plank number per line, from the first hook to the last.",
          codex: ["while", "loop-counters"],
        };
      }
      return {
        title: "Ringing the Bell",
        topic: "while loops: counting down",
        task: [
          "Marlo rings the old bell `rings` times. Before each ring he calls out how many rings are still to come, counting the one he's about to ring.",
          "Print what he calls out, one number per line.",
        ],
        data: { rings: r.int(4, 12) },
        plan: ["Start from the number of rings", "Call it out, then one fewer, until none are left"],
        body: "left = rings\nwhile left > 0:\n    print(left)\n    left -= 1",
        variants: [{ data: { rings: 1 }, note: "Just one ring today." }, { data: { rings: 0 }, note: "No rings today: nothing to call out." }, { data: { rings: 7 } }],
        wrong: [
          "left = rings\nwhile left >= 0:\n    print(left)\n    left -= 1",
          "left = rings\nwhile left > 0:\n    left -= 1\n    print(left)",
          "left = rings\nwhile left > 1:\n    print(left)\n    left -= 1",
        ],
        hints: [
          "Before the first ring, all of them are still to come. Before the last ring, just one is. Nothing is called after that.",
          "`jars = 3`, then `while jars > 0:` with `print(jars)` and `jars -= 1` inside prints 3, 2 and 1.",
          "`left = rings`, then `while left ___ 0:` with a print and `left -= 1` inside.",
        ],
        needs: [WHILE],
        advice: "One number per line, from the most down to the last ring.",
        codex: ["while", "loop-counters"],
      };
    },
  },
  {
    id: "dk-target",
    topics: ["dock"],
    difficulty: 1,
    make(r): Spec {
      if (r.chance(0.5))
        return {
          title: "The Coin Jar",
          topic: "while loops: adding up to a target",
          task: [
            "Marlo is saving for a new net. He drops 1 coin in his jar on the first day, 2 on the second, 3 on the third, always one more than the day before.",
            "Print the number of the day on which the jar first holds `goal` coins or more.",
          ],
          data: { goal: r.int(20, 80) },
          plan: ["A day counter and a coin total, both starting empty", "Add each day's coins until the goal is met"],
          body: "day = 0\ncoins = 0\nwhile coins < goal:\n    day += 1\n    coins += day\nprint(day)",
          variants: [
            { data: { goal: 15 }, note: "This goal is met exactly on one day: that day counts." },
            { data: { goal: 1 }, note: "The very first coin is enough." },
            { data: { goal: 50 } },
          ],
          wrong: [
            "day = 0\ncoins = 0\nwhile coins <= goal:\n    day += 1\n    coins += day\nprint(day)",
            "day = 0\ncoins = 0\nwhile coins < goal:\n    day += 1\n    coins += day\nprint(coins)",
            "day = 0\ncoins = 0\nwhile coins < goal:\n    day += 1\n    coins += 1\nprint(day)",
          ],
          hints: [
            "You can't know how many days ahead of time, so keep adding a day at a time and stop as soon as the jar is full enough.",
            "`total = 0`, `n = 0`, then `while total < 10:` with `n += 1` and `total += n` inside adds 1, 2, 3, 4 until the total reaches 10.",
            "`while coins ___ goal:` with `day += 1` and `coins += day` inside, then print the day.",
          ],
          needs: [WHILE],
          advice: "One number: the day the goal is reached.",
          codex: ["while", "loop-counters"],
        };
      const level = r.int(20, 60);
      const rise = r.int(3, 9);
      const top = level + r.int(20, 60);
      return {
        title: "Waiting for the Tide",
        topic: "while loops: adding up to a target",
        task: [
          "The water by the pier stands at `level` cm and rises `rise` cm every hour.",
          "Marlo's boat floats free once the water reaches `top` cm or more. Print how many hours he waits.",
        ],
        data: { level, rise, top },
        plan: ["Count the hours", "Raise the water an hour at a time until it is high enough"],
        body: "hours = 0\nwhile level < top:\n    level += rise\n    hours += 1\nprint(hours)",
        variants: [
          { data: { level: top }, note: "The water is already high enough: no waiting." },
          { data: { level: top - rise * 4 }, note: "The water lands exactly on the mark after a few hours." },
          { data: { level: 5, rise: 7 } },
        ],
        wrong: [
          "hours = 0\nwhile level <= top:\n    level += rise\n    hours += 1\nprint(hours)",
          "hours = 0\nwhile level < top:\n    level += rise\n    hours += 1\nprint(level)",
          "hours = 1\nwhile level < top:\n    level += rise\n    hours += 1\nprint(hours)",
        ],
        hints: [
          "Each hour two things change: the water goes up and the hour count goes up. Stop the moment the water is high enough.",
          "`cups = 2`, `turns = 0`, then `while cups < 11:` with `cups += 3` and `turns += 1` inside counts the turns until cups reaches 11 or more.",
          "`while level ___ top:` with `level += rise` and `hours += 1` inside, then print the hours.",
        ],
        needs: [WHILE],
        advice: "One number: the hours of waiting.",
        codex: ["while", "loop-counters"],
      };
    },
  },
  {
    id: "dk-double",
    topics: ["dock"],
    difficulty: 2,
    make(r): Spec {
      if (r.chance(0.5)) {
        const start = r.int(5, 30);
        return {
          title: "Rising Dough",
          topic: "while loops: doubling",
          task: [
            "Hazel's sourdough starter doubles in weight every hour. It begins at `start` grams, and she needs at least `need` grams for the morning bake.",
            "Print two lines: how many hours she waits, then how many grams she has by then.",
          ],
          data: { start, need: r.int(start * 5, start * 40) },
          plan: ["Hours and grams", "Double until there is enough", "Report both"],
          body: "hours = 0\ngrams = start\nwhile grams < need:\n    grams *= 2\n    hours += 1\nprint(hours)\nprint(grams)",
          variants: [
            { data: { start: 25, need: 200 }, note: "Doubling lands exactly on what she needs." },
            { data: { start: 90, need: 60 }, note: "There's already enough: no waiting." },
            { data: { start: 3, need: 1000 } },
          ],
          wrong: [
            "hours = 0\ngrams = start\nwhile grams <= need:\n    grams *= 2\n    hours += 1\nprint(hours)\nprint(grams)",
            "hours = 0\ngrams = start\nwhile grams < need:\n    grams += start\n    hours += 1\nprint(hours)\nprint(grams)",
            "hours = 0\ngrams = start\nwhile grams < need:\n    grams *= 2\n    hours += 1\nprint(hours)",
          ],
          hints: [
            "Each hour the whole amount doubles, not just the first bit. Stop as soon as there's enough.",
            "`eggs = 3`, then `while eggs < 20:` with `eggs *= 2` inside goes 3, 6, 12, 24 and stops.",
            "`while grams ___ need:` with `grams *= 2` and `hours += 1` inside; then print both.",
          ],
          needs: [WHILE],
          advice: "Two lines: the hours, then the grams.",
          codex: ["while", "loop-counters"],
        };
      }
      return {
        title: "The Draining Pond",
        topic: "while loops: halving",
        task: [
          "The mill pond is draining. Each night it loses half its water, and Wren counts in whole buckets, dropping any half bucket.",
          "It starts with `water` buckets. Print two lines: how many nights pass until fewer than `dry` buckets are left, then how many buckets are left by then.",
        ],
        data: { water: r.int(100, 900), dry: r.int(5, 40) },
        plan: ["Count the nights", "Halve the water until it is low enough", "Report both"],
        body: "nights = 0\nwhile water >= dry:\n    water //= 2\n    nights += 1\nprint(nights)\nprint(water)",
        variants: [
          { data: { water: 20, dry: 25 }, note: "Already below the line: no nights pass." },
          { data: { water: 64, dry: 8 }, note: "Halving lands exactly on the line once: that's not fewer yet." },
          { data: { water: 999, dry: 10 } },
        ],
        wrong: [
          "nights = 0\nwhile water >= dry:\n    water /= 2\n    nights += 1\nprint(nights)\nprint(water)",
          "nights = 0\nwhile water > dry:\n    water //= 2\n    nights += 1\nprint(nights)\nprint(water)",
          "nights = 0\nwhile water >= dry:\n    water //= 2\n    nights += 1\nprint(nights)",
        ],
        hints: [
          "Keep halving while there's still too much water. 'Fewer than' means the line itself isn't low enough yet.",
          "`logs = 50`, then `while logs >= 10:` with `logs //= 2` inside goes 50, 25, 12, 6 and stops. `//` keeps it whole.",
          "`while water ___ dry:` with `water //= 2` and `nights += 1` inside; then print both.",
        ],
        needs: [WHILE],
        advice: "Two lines: the nights, then the buckets left.",
        codex: ["while", "loop-counters"],
      };
    },
  },
  {
    id: "dk-every",
    topics: ["dock"],
    difficulty: 2,
    make(r): Spec {
      if (r.chance(0.5)) {
        const [a, b] = r.ints(2, 3, 7);
        return {
          title: "Iron Bolts",
          topic: "an if inside a while loop",
          task: [
            "Marlo lays `planks` planks along the pier, numbered from 1.",
            "A plank gets an iron bolt when its number divides evenly by `a`, or by `b` (a plank that does both still gets only one bolt).",
            "Print how many bolts he needs.",
          ],
          data: { planks: r.int(20, 40), a, b },
          plan: ["Walk the planks from 1", "Count the ones that get a bolt"],
          body: "plank = 1\nbolts = 0\nwhile plank <= planks:\n    if plank % a == 0 or plank % b == 0:\n        bolts += 1\n    plank += 1\nprint(bolts)",
          variants: [
            { data: { planks: 12, a: 4, b: 6 }, note: "Plank 12 divides by both: one bolt. And it's the last plank." },
            { data: { planks: 2 }, note: "Too few planks for any bolt." },
            { data: { planks: 30, a: 5, b: 3 } },
          ],
          wrong: [
            "plank = 1\nbolts = 0\nwhile plank <= planks:\n    if plank % a == 0 and plank % b == 0:\n        bolts += 1\n    plank += 1\nprint(bolts)",
            "plank = 1\nbolts = 0\nwhile plank < planks:\n    if plank % a == 0 or plank % b == 0:\n        bolts += 1\n    plank += 1\nprint(bolts)",
            "plank = 1\nbolts = 0\nwhile plank <= planks:\n    if plank % a == 0:\n        bolts += 1\n    if plank % b == 0:\n        bolts += 1\n    plank += 1\nprint(bolts)",
            "plank = 0\nbolts = 0\nwhile plank <= planks:\n    if plank % a == 0 or plank % b == 0:\n        bolts += 1\n    plank += 1\nprint(bolts)",
          ],
          hints: [
            "Walk the planks one by one. At each, ask one question with two halves; count it once if either half is true.",
            "`n % 3 == 0` is True when n divides evenly by 3. Inside a loop, `if ...: found += 1` counts the rounds that match.",
            "Inside `while plank <= planks:`, `if plank % a == 0 ___ plank % b == 0:` adds a bolt; then `plank += 1`.",
          ],
          needs: [WHILE, ["\\bif\\b", "Let an if inside the loop decide which planks get a bolt."]],
          advice: "One number: the bolts.",
          codex: ["loop-counters", "while"],
        };
      }
      const [oddSeeds, evenSeeds] = r.ints(2, 2, 9);
      return {
        title: "Seeds and Paths",
        topic: "continue",
        task: [
          "Wren sows `rows` rows, numbered from 1. Every row whose number divides evenly by `path` is a footpath: it gets no seeds at all.",
          "Each other row gets `odd_seeds` seeds if its number is odd, or `even_seeds` if it's even.",
          "Print how many seeds she sows altogether. Skip the footpaths in the loop, rather than working around them.",
        ],
        data: { rows: r.int(10, 20), path: r.int(3, 5), odd_seeds: oddSeeds, even_seeds: evenSeeds },
        plan: ["Walk the rows from 1", "Skip the footpaths", "Add each row's seeds"],
        body: "row = 0\nseeds = 0\nwhile row < rows:\n    row += 1\n    if row % path == 0:\n        continue\n    if row % 2 == 1:\n        seeds += odd_seeds\n    else:\n        seeds += even_seeds\nprint(seeds)",
        variants: [
          { data: { rows: 2, path: 2 }, note: "Only two rows, and the second is a path." },
          { data: { rows: 10, path: 7 } },
          { data: { path: 1 }, note: "Every row is a path today." },
        ],
        wrong: [
          "row = 0\nseeds = 0\nwhile row < rows:\n    row += 1\n    if row % 2 == 1:\n        seeds += odd_seeds\n    else:\n        seeds += even_seeds\nprint(seeds)",
          "row = 0\nseeds = 0\nwhile row < rows:\n    row += 1\n    if row % path == 0:\n        continue\n    if row % 2 == 0:\n        seeds += odd_seeds\n    else:\n        seeds += even_seeds\nprint(seeds)",
          "row = 0\nseeds = 0\nwhile row <= rows:\n    row += 1\n    if row % path == 0:\n        continue\n    if row % 2 == 1:\n        seeds += odd_seeds\n    else:\n        seeds += even_seeds\nprint(seeds)",
        ],
        hints: [
          "Walk the rows one by one. At a footpath, jump straight to the next row; otherwise, odd or even decides the seeds.",
          "`continue` skips the rest of this round and goes back to the loop's question. Step the counter before it, or the loop never moves on.",
          "`row += 1` first; then `if row % path == 0:` and `___` skips the row; then add odd_seeds or even_seeds.",
        ],
        needs: [WHILE, ["\\bcontinue\\b", "Today's question practises continue: let it skip the footpaths."]],
        advice: "One number: all the seeds.",
        codex: ["break-continue", "while"],
      };
    },
  },
  {
    id: "dk-bells",
    topics: ["dock"],
    difficulty: 2,
    make(r): Spec {
      const needs: [string, string][] = [
        ["\\bwhile\\s+True\\b", "Today's question practises while True: keep going until the right moment comes."],
        ["\\bbreak\\b", "Leave the loop with break once you've found it."],
      ];
      if (r.chance(0.5)) {
        const [small, big] = r.ints(2, 2, 9);
        return {
          title: "Two Bells Together",
          topic: "while True and break",
          task: [
            "Two bells hang at the pier head. The small one rings every `small` minutes and the big one every `big` minutes. Both rang together at minute 0.",
            "Print the first minute after that when both ring together again.",
          ],
          data: { small, big },
          plan: ["Start at minute 1", "Keep checking minutes until both bells ring"],
          body: "minute = 1\nwhile True:\n    if minute % small == 0 and minute % big == 0:\n        break\n    minute += 1\nprint(minute)",
          variants: [
            { data: { small: 4, big: 6 }, note: "These two share a factor, so they meet sooner than you'd think." },
            { data: { small: 3, big: 12 } },
            { data: { small: 5, big: 5 }, note: "Both bells keep the same time." },
          ],
          wrong: [
            "minute = 0\nwhile True:\n    if minute % small == 0 and minute % big == 0:\n        break\n    minute += 1\nprint(minute)",
            "minute = 1\nwhile True:\n    if minute % small == 0 or minute % big == 0:\n        break\n    minute += 1\nprint(minute)",
            "print(small * big)",
          ],
          hints: [
            "You don't know how long the wait is. Check minute after minute and stop at the first one where both bells ring.",
            "`while True:` loops for ever until a `break` inside it runs. `n % 4 == 0` asks whether 4 goes into n evenly.",
            "`minute = 1`; inside `while True:`, `if minute % small == 0 ___ minute % big == 0:` breaks out; otherwise `minute += 1`.",
          ],
          needs: [WHILE, ...needs],
          advice: "One number: the minute they ring together.",
          codex: ["break-continue", "endless-loops"],
        };
      }
      const [a, b] = r.sample([4, 5, 6, 8, 9, 10, 12], 2);
      return {
        title: "Beds That Fit",
        topic: "while True and break",
        task: [
          "Wren is marking out a new strip of field. It must be at least `least` paces long.",
          "She wants a length that splits evenly into beds of `a` paces, and also evenly into beds of `b` paces.",
          "Print the shortest length that does both.",
        ],
        data: { least: r.int(30, 90), a, b },
        plan: ["Start at the shortest allowed length", "Try longer lengths until one fits both"],
        body: "length = least\nwhile True:\n    if length % a == 0 and length % b == 0:\n        break\n    length += 1\nprint(length)",
        variants: [
          { data: { least: 24, a: 6, b: 8 }, note: "The shortest allowed length fits already." },
          { data: { least: 25, a: 6, b: 8 } },
          { data: { least: 1, a: 4, b: 10 }, note: "These two share a factor." },
        ],
        wrong: [
          "length = least + 1\nwhile True:\n    if length % a == 0 and length % b == 0:\n        break\n    length += 1\nprint(length)",
          "length = least\nwhile True:\n    if length % a == 0 or length % b == 0:\n        break\n    length += 1\nprint(length)",
          "print(a * b)",
        ],
        hints: [
          "You don't know how far to go. Try one length after another, starting with the shortest allowed, and stop at the first that fits both.",
          "`while True:` loops for ever until a `break` inside it runs. `n % 4 == 0` asks whether 4 goes into n evenly.",
          "`length = least`; inside `while True:`, `if length % a == 0 ___ length % b == 0:` breaks out; otherwise `length += 1`.",
        ],
        needs: [WHILE, ...needs],
        advice: "One number: the length in paces.",
        codex: ["break-continue", "endless-loops"],
      };
    },
  },
  {
    id: "dk-knots",
    topics: ["dock"],
    difficulty: 3,
    make(r): Spec {
      const word = r.pick(WORDS);
      let knots = "";
      for (const ch of word) {
        for (let k = r.int(0, 2); k > 0; k--) knots += r.pick(NOISE.split(""));
        knots += ch + "*";
      }
      for (let k = r.int(1, 2); k > 0; k--) knots += r.pick(NOISE.split(""));
      const body = 'word = ""\nspare = 0\ni = 0\nwhile i < len(knots):\n    if knots[i] != "*":\n        if knots[i + 1:i + 2] == "*":\n            word += knots[i]\n        else:\n            spare += 1\n    i += 1\nprint(word.upper())\nprint(spare)';
      return {
        title: "Gran's Knotted Message",
        topic: "walking a string",
        task: [
          "Marlo found one of Gran's knotted messages. She tied a star right after every letter she meant; the other letters are only there to fool nosy gulls.",
          "Print two lines: Gran's hidden word in capital letters, then how many letters in the message were only there to fool the gulls (the stars aren't letters).",
          "Walk the message with an index.",
        ],
        data: { knots },
        plan: ["Start at the first place, with an empty word", "At each letter: is a star right after it?", "The word, then the fake letters"],
        body,
        variants: [
          { data: { knots: "r*o*p*e*" }, note: "No fake letters, and the message ends with a star." },
          { data: { knots: "zzh*qe*r*ko*n*t" } },
          { data: { knots: "abc" }, note: "No stars at all: no word, and every letter is fake." },
        ],
        wrong: [
          'word = ""\nspare = 0\ni = 0\nwhile i < len(knots):\n    if knots[i] != "*":\n        if knots[i + 1] == "*":\n            word += knots[i]\n        else:\n            spare += 1\n    i += 1\nprint(word.upper())\nprint(spare)',
          'word = ""\nspare = 0\ni = 0\nwhile i < len(knots):\n    if knots[i + 1:i + 2] == "*":\n        word += knots[i]\n    else:\n        spare += 1\n    i += 1\nprint(word.upper())\nprint(spare)',
          'word = ""\nspare = 0\ni = 0\nwhile i < len(knots):\n    if knots[i] != "*":\n        if i > 0 and knots[i - 1] == "*":\n            word += knots[i]\n        else:\n            spare += 1\n    i += 1\nprint(word.upper())\nprint(spare)',
          'word = ""\nspare = 0\ni = 0\nwhile i < len(knots):\n    if knots[i] != "*":\n        if knots[i + 1:i + 2] == "*":\n            word += knots[i]\n        else:\n            spare += 1\n    i += 1\nprint(word)\nprint(spare)',
        ],
        hints: [
          "Stand on each place in turn. Stars are only markers: pass over them. At a letter, peek one place ahead. Careful at the very end, where there is no place ahead.",
          '`i = 0` and `while i < len(note):` walk a string; `note[i]` is the letter there. `note[i + 1:i + 2]` peeks at the next one and is just empty at the end (no IndexError). `found += letter` grows a string.',
          'At each letter that isn\'t a star: `if knots[i + 1:i + 2] == ___:` adds it to the word, `else:` counts a fake one. Then `i += 1`.',
        ],
        needs: [WHILE, ["\\[\\s*i", "Walk the message with an index, like knots[i]."]],
        advice: "Two lines: the word in capitals, then the number of fake letters.",
        codex: ["walking-strings", "while"],
      };
    },
  },
  {
    id: "dk-cast",
    topics: ["dock"],
    difficulty: 3,
    make(r): Spec {
      return {
        title: "Waiting for a Bite",
        topic: "random with a seed",
        task: [
          "Marlo casts until a fish bites, but he gives up after `limit` casts.",
          "Before the first cast, seed Python's random rolls with `seed`, so Wren can check your rolls against hers.",
          "Each cast is exactly one roll of a whole number from 1 to `sides`. A roll of 1 is a bite.",
          "Print two lines: how many casts he made, then True if a fish bit and False if none did.",
        ],
        data: { seed: r.int(1, 99), sides: r.int(4, 8), limit: r.int(8, 20) },
        plan: ["Seed the rolls", "Cast while there are casts left and nothing has bitten", "Report"],
        body: "import random\nrandom.seed(seed)\ncasts = 0\nbite = False\nwhile casts < limit and not bite:\n    casts += 1\n    if random.randint(1, sides) == 1:\n        bite = True\nprint(casts)\nprint(bite)",
        variants: [
          { data: { seed: 1, sides: 6, limit: 12 } },
          { data: { limit: 1 }, note: "Only one cast allowed." },
          { data: { limit: 0 }, note: "No time to fish today: no casts at all." },
          { data: { sides: 1 }, note: "Every roll is a 1 here: the first cast bites." },
        ],
        wrong: [
          "import random\nrandom.seed(seed)\ncasts = 0\nbite = False\nwhile casts < limit or not bite:\n    casts += 1\n    if random.randint(1, sides) == 1:\n        bite = True\nprint(casts)\nprint(bite)",
          "import random\ncasts = 0\nbite = False\nwhile casts < limit and not bite:\n    casts += 1\n    random.seed(seed)\n    if random.randint(1, sides) == 1:\n        bite = True\nprint(casts)\nprint(bite)",
          "import random\nrandom.seed(seed)\ncasts = 0\nbite = False\nwhile casts <= limit and not bite:\n    casts += 1\n    if random.randint(1, sides) == 1:\n        bite = True\nprint(casts)\nprint(bite)",
          "import random\nrandom.seed(seed)\ncasts = 1\nbite = False\nwhile casts < limit and not bite:\n    casts += 1\n    if random.randint(1, sides) == 1:\n        bite = True\nprint(casts)\nprint(bite)",
        ],
        hints: [
          "Three things change as he fishes: how many casts so far, whether anything has bitten, and the rolls. He keeps going only while he has casts left AND nothing has bitten.",
          "`import random` then `random.seed(7)` makes the rolls repeat every run; `random.randint(1, 4)` rolls a whole number from 1 to 4. `while tries < 5 and not found:` stops on whichever comes first.",
          "Seed once at the top. Then `while casts < limit and ___:` with `casts += 1` and one roll inside; a roll of 1 sets `bite = True`.",
        ],
        needs: [WHILE, ["random\\.seed\\(\\s*seed\\s*\\)", "Seed the rolls with the starter's seed, so Wren rolls the same as you."]],
        advice: "Two lines: the casts, then True or False.",
        codex: ["random", "while"],
      };
    },
  },
  {
    id: "dk-tide",
    topics: ["mill", "dock"],
    difficulty: 2,
    make(r): Spec {
      const fast = r.int(5, 9);
      const slow = r.int(2, 4);
      const drop = r.int(slow + 1, fast);
      const level = r.int(10, 40);
      const top = level + r.int(20, 60);
      return {
        title: "Tide and Sluice",
        topic: "if / elif inside a while loop",
        task: [
          "The tide by the pier stands at `level` cm. Hour by hour, starting with hour 1:",
          "In an odd-numbered hour it rises `fast` cm, and in an even-numbered hour it rises `slow` cm.",
          "But every hour whose number divides evenly by 4, the mill's sluice opens and the water drops `drop` cm instead.",
          "Print two lines: how many hours until the water reaches `top` cm or more, then the water level by then.",
        ],
        data: { level, top, fast, slow, drop },
        plan: ["Count the hours", "Each hour: sluice, odd or even?", "Report both"],
        body: "hour = 0\nwhile level < top:\n    hour += 1\n    if hour % 4 == 0:\n        level -= drop\n    elif hour % 2 == 1:\n        level += fast\n    else:\n        level += slow\nprint(hour)\nprint(level)",
        variants: [
          { data: { level: top }, note: "The water already reaches the mark: no hours pass." },
          { data: { level: top - fast }, note: "The first hour lands exactly on the mark." },
          { data: { level: top - 2 * fast - slow - 1 }, note: "Nearly there after three hours, but hour 4 opens the sluice." },
        ],
        wrong: [
          "hour = 0\nwhile level < top:\n    hour += 1\n    if hour % 2 == 0:\n        level += slow\n    elif hour % 4 == 0:\n        level -= drop\n    else:\n        level += fast\nprint(hour)\nprint(level)",
          "hour = 0\nwhile level <= top:\n    hour += 1\n    if hour % 4 == 0:\n        level -= drop\n    elif hour % 2 == 1:\n        level += fast\n    else:\n        level += slow\nprint(hour)\nprint(level)",
          "hour = 0\nwhile level < top:\n    if hour % 4 == 0:\n        level -= drop\n    elif hour % 2 == 1:\n        level += fast\n    else:\n        level += slow\n    hour += 1\nprint(hour)\nprint(level)",
        ],
        hints: [
          "Every fourth hour is also an even hour. Which rule must be asked first so the sluice ever gets its turn?",
          "`if n % 3 == 0:` ... `elif n % 2 == 0:` ... `else:` picks exactly one branch, the first that's True.",
          "Inside `while level < top:`, step `hour += 1` first, then `if hour % ___ == 0:` drops the water, `elif hour % 2 == 1:` adds fast and `else:` adds slow.",
        ],
        needs: [WHILE, ["\\bif\\b", "Let an if inside the loop choose each hour's change."]],
        advice: "Two lines: the hours, then the water level.",
        codex: ["loop-counters", "else-elif"],
      };
    },
  },
  {
    id: "dk-haul",
    topics: ["mill", "dock"],
    difficulty: 3,
    make(r): Spec {
      const keep = r.int(3, 6);
      const digits = (n: number, hi: number) => Array.from({ length: n }, () => String(r.int(0, hi))).join("");
      // today's haul always has a fish of exactly keep kilos and a boot in it
      const core = r.shuffle([String(keep), "0", ...digits(r.int(5, 8), 8).split("")]).join("");
      const torn = r.chance(0.5);
      const cut = r.int(3, core.length - 2);
      const haul = torn ? core.slice(0, cut) + "9" + core.slice(cut) : core;
      const edge = `${keep}${keep - 1}0${keep + 1}`;
      const head = [
        "Marlo wrote down today's haul as a string of digits, one per thing his net brought up: the fish's weight in kilos, or 0 for an old boot.",
        "He keeps fish of `keep` kilos or more and throws the smaller ones back.",
      ];
      const report = "Print one line in the shape `Kept <kept>, back <back>, boots <boots>` with the three counts filled in, then a second line: the total kilos of the fish he kept.";
      const step = (cmp: string, order = "boot") => {
        const boot = "    if w == 0:\n        boots += 1\n";
        const fish = `    if w ${cmp} keep:\n        kept += 1\n        kilos += w\n`;
        const rest = order === "boot" ? boot + fish.replace("    if", "    elif") : fish + boot.replace("    if", "    elif");
        return rest + "    else:\n        back += 1\n";
      };
      const start = "kept = 0\nback = 0\nboots = 0\nkilos = 0\ni = 0\nwhile i < len(haul):\n    w = int(haul[i])\n";
      const end = '    i += 1\nprint(f"Kept {kept}, back {back}, boots {boots}")\nprint(kilos)';
      const stop = "    if w == 9:\n        break\n";
      if (!torn)
        return {
          title: "Sorting the Haul",
          topic: "if / elif inside a while loop",
          task: [...head, report],
          data: { haul, keep },
          plan: ["Counters for kept, back, boots and kilos", "Walk the haul one digit at a time", "Report"],
          body: start + step(">=") + end,
          variants: [
            { data: { haul: edge }, note: `A fish of exactly ${keep} kilos is a keeper.` },
            { data: { haul: "0000" }, note: "Nothing but boots today." },
            { data: { haul: "" }, note: "The net came up empty." },
          ],
          wrong: [
            start + step(">") + end,
            "kept = 0\nback = 0\nboots = 0\nkilos = 0\ni = 0\nwhile i < len(haul):\n    w = int(haul[i])\n    if w < keep:\n        back += 1\n    elif w == 0:\n        boots += 1\n    else:\n        kept += 1\n        kilos += w\n" + end,
            start.replace("int(haul[i])", "haul[i]") + step(">=") + end,
          ],
          hints: [
            "Walk the digits one at a time. Each digit is text, so turn it into a number before comparing. A boot weighs 0, which is also smaller than any keeper, so ask about boots first.",
            "`int(\"7\")` is the number 7. In a walk, `if n == 0:` ... `elif n >= 5:` ... `else:` sorts each item into exactly one pile.",
            "Inside the walk: `w = int(haul[i])`; `if w == 0:` counts a boot, `elif w ___ keep:` counts a keeper and adds its kilos, `else:` counts one thrown back.",
          ],
          needs: [WHILE, ["\\bif\\b", "Let an if / elif inside the loop sort each catch."]],
          advice: "Line one: Kept, back and boots with their counts. Line two: the kept kilos.",
          codex: ["walking-strings", "else-elif"],
        };
      return {
        title: "The Torn Net",
        topic: "break inside a while loop",
        task: [...head, "A 9 isn't a fish: it means the net tore just there. Nothing from the 9 on counts.", report],
        data: { haul, keep },
        plan: ["Counters for kept, back, boots and kilos", "Walk the haul until the net tore", "Report"],
        body: start + stop + step(">=") + end,
        variants: [
          { data: { haul: edge + "9" + "777" }, note: `A fish of exactly ${keep} kilos is a keeper, and nothing after the tear counts.` },
          { data: { haul: "9123" }, note: "The net tore straight away." },
          { data: { haul: "1234567" }, note: "No tear today: everything counts." },
        ],
        wrong: [
          start + step(">=") + end,
          start + step(">=") + stop + end,
          start + stop + step(">") + end,
          start.replace("int(haul[i])", "haul[i]") + stop + step(">=") + end,
        ],
        hints: [
          "Walk the digits one at a time, turning each into a number. Check for the tear before anything else, and leave the walk the moment you find it.",
          "`break` leaves a while loop at once. `int(\"7\")` is the number 7. `if n == 0:` ... `elif n >= 5:` ... `else:` sorts each item into exactly one pile.",
          "Inside the walk: `w = int(haul[i])`; `if w == 9:` and `___` leaves; then `if w == 0:` counts a boot, `elif w >= keep:` a keeper, `else:` one thrown back.",
        ],
        needs: [WHILE, ["\\bbreak\\b", "Stop the walk with break when the net tore."]],
        advice: "Line one: Kept, back and boots with their counts. Line two: the kept kilos.",
        codex: ["break-continue", "walking-strings"],
      };
    },
  },
];
