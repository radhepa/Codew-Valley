import type { Spec, Template } from "../build.ts";
import { CROPS, PEOPLE, seedOf } from "../rng.ts";

// The Clock Tower: math, random with lists, dates, divmod, comprehensions, conditional expressions.

/** Villagers who can be drawn or listed (Wren asks the question, so she never is the answer). */
const FOLK = PEOPLE.filter((p) => p !== "Wren");
const csv = (rows: [string, string, number][]) => "name,crop,kilos\n" + rows.map((x) => x.join(",")).join("\n") + "\n";
/** A starter line that changes with today's file: Wren's own answer is remembered by its code, so code that only reads files needs one. */
const bookLine = (text: string) => `# Mill book no. ${10000 + (seedOf(text) % 90000)}`;
/** A list built in one line (the brackets come before the for; an inner [..] is fine). */
const ONE_LINE_LIST = "\\[[^\\n]*\\bfor\\b";

export const CLOCKTOWER: Template[] = [
  {
    id: "ct-gears",
    topics: ["clocktower"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["rim", "crates", "baskets", "fence"] as const);
      if (twist === "rim") {
        const radius = r.int(3, 9);
        return {
          title: "Brass Around the Face",
          topic: "the math module: pi",
          task: [
            "Tock is fitting a brass band all the way around the round clock face. `radius` says how many hand-widths it is from the middle of the face to its edge.",
            "Print how many hand-widths of brass the band needs, rounded to one decimal place.",
          ],
          data: { radius },
          plan: ["Bring in the maths module", "The distance around the circle, rounded"],
          body: "import math\nprint(round(2 * math.pi * radius, 1))",
          variants: [{ data: { radius: 10 } }, { data: { radius: 1 }, note: "A tiny clock face, one hand-width across to the middle." }, { data: { radius: 15 } }],
          wrong: ["import math\nprint(round(math.pi * radius, 1))", "import math\nprint(round(math.pi * radius * radius, 1))", "import math\nprint(2 * math.pi * radius)", "print(round(2 * 3.14 * radius, 1))"],
          hints: [
            "The way around a circle is a little over six times its radius. The maths module knows the exact number to multiply by.",
            "`import math` brings the module in, and `math.pi` is the circle number. `round(some_float, 1)` keeps one decimal place.",
            "`print(round(2 * ___ * radius, 1))`, with the maths module brought in first.",
          ],
          needs: [["math\\.pi|\\bpi\\b", "Ask the maths module for pi: it knows more digits than anyone in the valley."]],
          advice: "One number, rounded to one decimal place.",
          codex: ["math-module", "modules"],
        };
      }
      if (twist === "crates") {
        const per = r.int(4, 9);
        const jars = per * r.int(3, 8) + r.int(1, per - 1);
        return {
          title: "Crates of Honey",
          topic: "the math module: rounding up",
          task: [
            "Hazel's honey jars travel to market in crates that hold `per_crate` jars each. A crate may go out part-full, but every jar needs a place.",
            "Print how many crates she needs for her `jars`, as a whole number.",
          ],
          data: { jars, per_crate: per },
          plan: ["Bring in the maths module", "How many crates, counting a part-full one"],
          body: "import math\nprint(math.ceil(jars / per_crate))",
          variants: [
            { data: { jars: per * 5, per_crate: per }, note: "The jars fill the crates exactly: no part-full crate today." },
            { data: { jars: 13, per_crate: 6 } },
            { data: { jars: 0, per_crate: 6 }, note: "No honey at all today." },
          ],
          wrong: ["print(jars // per_crate)", "import math\nprint(math.floor(jars / per_crate))", "print(round(jars / per_crate))", "print(jars // per_crate + 1)"],
          hints: [
            "Work it out on paper with 13 jars and crates of 6. Two crates leave one jar standing on the cart: what then?",
            "`math.floor(x)` rounds a float down to a whole number and `math.ceil(x)` rounds it up, so `math.ceil(7 / 2)` keeps the half. `from math import ceil` also works.",
            "`print(math.___(jars / per_crate))`",
          ],
          needs: [["math\\.ceil|\\bceil\\(", "Today's question is maths-module practice: let it do the rounding up."]],
          advice: "One whole number: the crates.",
          codex: ["math-module", "from-import"],
        };
      }
      if (twist === "baskets") {
        const [x, y] = r.pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7], [4, 7]] as const);
        const g = r.int(2, 9);
        const [carrots, turnips] = r.chance(0.5) ? [g * x, g * y] : [g * y, g * x];
        return {
          title: "Even Baskets",
          topic: "the math module: gcd",
          task: [
            "Marlo packs carrots and turnips into baskets that all match: the same number of carrots in each basket, the same number of turnips in each, and nothing left over.",
            "Print the most baskets he can fill that way, as a plain number.",
          ],
          data: { carrots, turnips },
          plan: ["Bring in the tool you need from the maths module", "The most matching baskets"],
          body: "from math import gcd\nprint(gcd(carrots, turnips))",
          variants: [
            { data: { carrots: 12, turnips: 18 } },
            { data: { carrots: 7, turnips: 9 }, note: "Nothing but 1 splits both piles evenly: one big basket." },
            { data: { carrots: 8, turnips: 24 }, note: "One pile splits the other exactly." },
          ],
          wrong: ["print(min(carrots, turnips))", "print(carrots % turnips)", "print(carrots // turnips)", "import math\nprint(math.gcd(carrots, turnips) * 2)"],
          hints: [
            "Try it on paper with 4 carrots and 6 turnips: can you fill 3 baskets? 2? The number of baskets has to split both piles evenly.",
            "`from math import gcd` brings one tool in by name. `gcd(10, 15)` gives the biggest whole number that splits both 10 and 15 with nothing left over.",
            "`print(gcd(___, turnips))`, with gcd brought in first.",
          ],
          needs: [["gcd\\(", "Let the maths module find the biggest number that splits both piles."]],
          advice: "One number: how many baskets.",
          codex: ["math-module", "from-import"],
        };
      }
      const side = r.int(4, 12);
      return {
        title: "Fencing the Pen",
        topic: "the math module: sqrt",
        task: [
          "The new sheep pen is a perfect square, and `area` says how many square steps of grass it covers.",
          "Print how many steps of fence go all the way around it, as a whole number.",
        ],
        data: { area: side * side },
        plan: ["Bring in the maths module", "How long one side is", "All the way around"],
        body: "import math\nprint(int(4 * math.sqrt(area)))",
        variants: [{ data: { area: 49 } }, { data: { area: 144 }, note: "A big pen." }, { data: { area: 1 }, note: "The smallest pen there is." }],
        wrong: ["import math\nprint(int(math.sqrt(area)))", "print(area // 4)", "import math\nprint(4 * math.sqrt(area))", "import math\nprint(int(2 * math.sqrt(area)))"],
        hints: [
          "First find how long one side is: which number times itself makes the area? Then walk around all four sides.",
          "`math.sqrt(25)` gives the number that times itself makes 25, as a float. `int(...)` turns a whole float into a plain whole number.",
          "`side = math.sqrt(area)`, then print `int(___ * side)`.",
        ],
        needs: [["sqrt\\(", "Let the maths module find the side: today's pen is only today's."]],
        advice: "One whole number, with no decimal point.",
        codex: ["math-module", "modules"],
      };
    },
  },
  {
    id: "ct-draw",
    topics: ["clocktower"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["pair", "order", "fields"] as const);
      const seed = r.int(1, 99);
      const helpers = r.sample(FOLK, r.int(4, 6));
      const others = r.sample(FOLK, 5);
      if (twist === "pair")
        return {
          title: "Two Fair Helpers",
          topic: "random: sample with a seed",
          task: [
            "Two helpers will carry the first sacks to the mill. Wren draws them fairly from `helpers`, so nobody can grumble.",
            "Start the dice from `seed`, then draw two different helpers together in one go.",
            "Print the two names, each on its own line, in the order they were drawn.",
          ],
          data: { seed, helpers },
          plan: ["Start the dice from the seed", "Draw two different helpers at once", "Print them"],
          body: "import random\nrandom.seed(seed)\npair = random.sample(helpers, 2)\nprint(pair[0])\nprint(pair[1])",
          variants: [
            { data: { seed: seed + 7 } },
            { data: { seed: 3, helpers: others } },
            { data: { seed: 11, helpers: others.slice(0, 2) }, note: "Only two helpers today: both go, in the order they're drawn." },
          ],
          wrong: [
            "import random\nrandom.seed(seed)\nprint(random.choice(helpers))\nprint(random.choice(helpers))",
            "import random\nrandom.seed(seed)\nprint(random.sample(helpers, 2))",
            "import random\nrandom.seed(seed)\npair = random.sample(helpers, 2)\nprint(pair[0])",
          ],
          hints: [
            "Two separate single draws could land on the same person twice. Is there a way to draw both at once, so that can't happen?",
            "`random.seed(5)` starts the dice in a known place. `random.sample(pies, 3)` draws three different pies as a new list.",
            "`random.seed(seed)`, then `pair = random.sample(helpers, ___)` and print each name.",
          ],
          needs: [
            ["random\\.seed\\(\\s*seed\\s*\\)", "Start the dice from seed, so Wren can check the draw was fair."],
            ["sample\\(", "Draw the two together, in one go, so nobody is picked twice."],
          ],
          advice: "Two lines, one name on each, in the order drawn.",
          codex: ["random-lists", "modules"],
        };
      if (twist === "order")
        return {
          title: "Turns at the Millstone",
          topic: "random: shuffle with a seed",
          task: [
            "Today the helpers take turns at the millstone, in an order drawn fairly from `helpers`.",
            "Start the dice from `seed`, then mix the whole list into a new order right where it stands.",
            "Print the turns, one line each: the turn number counting from 1, a full stop and a space, then the name.",
          ],
          data: { seed, helpers },
          plan: ["Start the dice from the seed", "Mix the helpers", "One line per turn"],
          body: 'import random\nrandom.seed(seed)\nrandom.shuffle(helpers)\nfor i in range(len(helpers)):\n    print(f"{i + 1}. {helpers[i]}")',
          variants: [
            { data: { seed: seed + 5 } },
            { data: { seed: 8, helpers: others } },
            { data: { seed: 2, helpers: others.slice(0, 1) }, note: "Only one helper today: they take every turn there is, which is one." },
          ],
          wrong: [
            'import random\nrandom.seed(seed)\nrandom.shuffle(helpers)\nfor i in range(len(helpers)):\n    print(f"{i}. {helpers[i]}")',
            'import random\nrandom.seed(seed)\nfor i in range(len(helpers)):\n    print(f"{i + 1}. {helpers[i]}")',
            'import random\nrandom.seed(seed)\norder = random.shuffle(helpers)\nfor i in range(len(order)):\n    print(f"{i + 1}. {order[i]}")',
          ],
          hints: [
            "Mixing a deck of cards changes the deck itself. What does the mixing hand back, if anything?",
            "`random.seed(6)` then `random.shuffle(cards)` mixes `cards` where it stands and hands back nothing. Loop over the list afterwards.",
            "`random.shuffle(helpers)`, then for each place `i`, print the turn number `i + ___`, a full stop and the name.",
          ],
          needs: [
            ["random\\.seed\\(\\s*seed\\s*\\)", "Start the dice from seed, so Wren can check the draw was fair."],
            ["shuffle\\(", "Mix the whole list where it stands: that's today's practice."],
          ],
          advice: "One line per turn, numbered from 1.",
          codex: ["random-lists", "modules"],
        };
      const fields = r.sample(["north field", "river strip", "hill plot", "orchard row", "mill patch", "east meadow"], r.int(3, 4));
      const crops = r.sample(CROPS, 4);
      return {
        title: "What Grows Where",
        topic: "random: choice with a seed",
        task: [
          "Wren can't decide what to sow, so the dice will. For each field in `fields`, in order, draw one crop from `crops`. Two fields may well get the same crop.",
          "Start the dice from `seed` once, before the first draw.",
          "Print one line per field: the field, a colon and a space, then its crop.",
        ],
        data: { seed, fields, crops },
        plan: ["Start the dice from the seed", "One draw for each field"],
        body: 'import random\nrandom.seed(seed)\nfor field in fields:\n    print(f"{field}: {random.choice(crops)}")',
        variants: [
          { data: { seed: seed + 4 } },
          { data: { seed: 17, fields: ["mill patch", "east meadow", "north field", "river strip"] } },
          { data: { seed: 6, fields: ["hill plot"] }, note: "Just one field to sow." },
        ],
        wrong: [
          'import random\nfor field in fields:\n    random.seed(seed)\n    print(f"{field}: {random.choice(crops)}")',
          'import random\nrandom.seed(seed)\npicks = random.sample(crops, len(fields))\nfor i in range(len(fields)):\n    print(f"{fields[i]}: {picks[i]}")',
          'import random\nrandom.seed(seed)\ncrop = random.choice(crops)\nfor field in fields:\n    print(f"{field}: {crop}")',
        ],
        hints: [
          "Each field gets its own draw. Where does the seed go so the dice start once, and then keep rolling on?",
          "`random.choice(pies)` draws one pie, and each call is a fresh draw. `random.seed(5)` sets where the dice start.",
          "`random.seed(seed)` once, then for each field print it with `random.choice(___)`.",
        ],
        needs: [
          ["random\\.seed\\(\\s*seed\\s*\\)", "Start the dice from seed, so Wren can check the draw was fair."],
          ["choice\\(", "One fresh draw for each field is today's practice."],
        ],
        advice: "One line per field, in the order of the list.",
        codex: ["random-lists", "modules"],
      };
    },
  },
  {
    id: "ct-dates",
    topics: ["clocktower"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["ready", "grew", "sign"] as const);
      const day = () => [r.int(2026, 2028), r.int(1, 12), r.int(1, 28)];
      if (twist === "ready") {
        const sown = day();
        const grow = r.int(40, 110);
        return {
          title: "When Is It Ripe?",
          topic: "dates: timedelta and weekdays",
          task: [
            "Hazel sowed a row of pumpkins on the day in `sown` (year, month, day). They need `grow` days to ripen.",
            "Print the day they're ready, in the tidy year-month-day style, and on the next line the full name of that day of the week.",
          ],
          head: "from datetime import date, timedelta",
          data: { sown, grow },
          plan: ["The sowing day as a date", "Add the growing days", "Print the day, then its weekday's name"],
          body: 'ready = date(sown[0], sown[1], sown[2]) + timedelta(days=grow)\nprint(ready)\nprint(ready.strftime("%A"))',
          variants: [
            { data: { sown: [2026, 12, 20], grow: 15 }, note: "The pumpkins ripen in the new year." },
            { data: { sown: [2028, 2, 20], grow: 10 }, note: "2028 is a leap year: February has 29 days." },
            { data: { sown: [2027, 6, 1], grow: 1 } },
          ],
          wrong: [
            'ready = date(sown[0], sown[1], sown[2]) + timedelta(weeks=grow)\nprint(ready)\nprint(ready.strftime("%A"))',
            'ready = date(sown[0], sown[1], sown[2]) + timedelta(days=grow)\nprint(ready)\nprint(ready.strftime("%a"))',
            "ready = date(sown[0], sown[1], sown[2]) + timedelta(days=grow)\nprint(ready)\nprint(ready.weekday())",
            'ready = date(sown[0], sown[1], sown[2]) + timedelta(days=grow - 1)\nprint(ready)\nprint(ready.strftime("%A"))',
          ],
          hints: [
            "Months have different lengths, and leap years come and go, so counting on fingers goes wrong. Let a date do the counting.",
            "`date(2026, 1, 9) + timedelta(days=3)` is three days later; printing a date gives the tidy style. `.strftime(\"%B\")` writes a date's month name, and `%A` is the code for the weekday's full name.",
            "`ready = date(sown[0], sown[1], sown[2]) + timedelta(days=___)`, then print `ready` and `ready.strftime(\"%A\")`.",
          ],
          needs: [["timedelta\\(", "Let a timedelta add the days: it knows how long every month is."]],
          advice: "Two lines: the date, then the weekday's full name.",
          codex: ["timedelta", "dates", "date-formatting"],
        };
      }
      if (twist === "grew") {
        const sown = [2026, r.int(3, 5), r.int(1, 28)];
        const picked = [2026, sown[1] + r.int(1, 3), r.int(1, 28)];
        return {
          title: "Days in the Ground",
          topic: "dates: the days between",
          task: [
            "The carrots went in on the day in `sown` and came out on the day in `picked` (year, month, day each).",
            "Print how many days they grew, as a plain number, and on the next line how many whole weeks that makes.",
          ],
          head: "from datetime import date",
          data: { sown, picked },
          plan: ["Both days as dates", "The days between them", "Whole weeks"],
          body: "days = (date(picked[0], picked[1], picked[2]) - date(sown[0], sown[1], sown[2])).days\nprint(days)\nprint(days // 7)",
          variants: [
            { data: { sown: [2028, 2, 1], picked: [2028, 3, 1] }, note: "February 2028 has 29 days." },
            { data: { sown: [2026, 9, 3], picked: [2026, 9, 16] }, note: "Thirteen days: only one whole week." },
            { data: { sown: [2026, 12, 27], picked: [2027, 1, 3] }, note: "Exactly a week, across the new year." },
          ],
          wrong: [
            "grew = date(picked[0], picked[1], picked[2]) - date(sown[0], sown[1], sown[2])\nprint(grew)\nprint(grew.days // 7)",
            "days = (date(picked[0], picked[1], picked[2]) - date(sown[0], sown[1], sown[2])).days\nprint(days)\nprint(round(days / 7))",
            "days = (date(picked[0], picked[1], picked[2]) - date(sown[0], sown[1], sown[2])).days + 1\nprint(days)\nprint(days // 7)",
            "days = (picked[1] - sown[1]) * 30 + picked[2] - sown[2]\nprint(days)\nprint(days // 7)",
          ],
          hints: [
            "Months aren't all 30 days long. Turn both days into dates and let Python take one from the other.",
            "`(date(2026, 8, 1) - date(2026, 5, 25)).days` is the plain number of days between them. `//` keeps only whole groups.",
            "`days = (date(picked[0], picked[1], picked[2]) - date(sown[0], sown[1], sown[2])).___`, then print `days` and `days // 7`.",
          ],
          needs: [["date\\(", "Let dates count the days: they know how long every month is."]],
          advice: "Two plain numbers: days, then whole weeks.",
          codex: ["timedelta", "dates"],
        };
      }
      const fair = day();
      return {
        title: "The Fair Sign",
        topic: "dates: strftime",
        task: [
          "Tock is painting the sign for the harvest fair, held on the day in `fair` (year, month, day).",
          "Print one line: the weekday's full name, a space, the day of the month as two digits, a space, then the month's full name.",
        ],
        head: "from datetime import date",
        data: { fair },
        plan: ["The fair day as a date", "Write it the sign's way"],
        body: 'print(date(fair[0], fair[1], fair[2]).strftime("%A %d %B"))',
        variants: [
          { data: { fair: [2026, 3, 4] }, note: "A day below ten still gets two digits." },
          { data: { fair: [2027, 11, 21] } },
          { data: { fair: [2028, 2, 29] }, note: "A leap day." },
        ],
        wrong: [
          'print(date(fair[0], fair[1], fair[2]).strftime("%a %d %b"))',
          'print(date(fair[0], fair[1], fair[2]).strftime("%A %m %B"))',
          'print(date(fair[0], fair[1], fair[2]).strftime("%A %d %b"))',
          "print(date(fair[0], fair[1], fair[2]))",
        ],
        hints: [
          "A date can write itself out in many styles. You give it a pattern, with a code for each part you want.",
          "`picnic.strftime(\"%d/%m/%Y\")` writes the day, month and year as numbers. Capitals matter: `%B` is the month's whole name and `%b` the short one; `%A` and `%a` are the same pair for weekdays.",
          "`print(date(fair[0], fair[1], fair[2]).strftime(\"%A ___ %B\"))`",
        ],
        needs: [["strftime\\(", "Let the date write itself out with a pattern: that's today's practice."]],
        advice: "One line: weekday, two-digit day, month, with single spaces.",
        codex: ["date-formatting", "dates"],
      };
    },
  },
  {
    id: "ct-chimes",
    topics: ["clocktower"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["chimes", "tags", "long"] as const);
      if (twist === "chimes") {
        const start = r.int(5, 9) * 60 + r.pick([0, 5, 10, 15, 30, 45]);
        const gap = r.pick([20, 25, 30, 45, 50, 75, 90]);
        const count = r.int(3, 6);
        return {
          title: "The Chime Board",
          topic: "comprehensions and divmod",
          task: [
            "The clock tower chimes `count` times today. The first chime is `start` minutes after midnight, and each chime comes `gap` minutes after the one before.",
            "Build the list of chime times (in minutes after midnight) in a single line.",
            "Then print one line per chime: the hour as two digits, a colon, then the minutes as two digits.",
          ],
          data: { start, gap, count },
          plan: ["Every chime time, in one line", "Each one as hours and minutes"],
          body: 'times = [start + n * gap for n in range(count)]\nfor t in times:\n    h, m = divmod(t, 60)\n    print(f"{h:02}:{m:02}")',
          variants: [
            { data: { start: 0, gap: 45, count: 3 }, note: "The first chime is at midnight, hour zero." },
            { data: { start: 12 * 60 + 50, gap: 15, count: 1 }, note: "Just one chime today." },
            { data: { start: 21 * 60 + 5, gap: 55, count: 4 } },
          ],
          wrong: [
            'times = [start + n * gap for n in range(1, count + 1)]\nfor t in times:\n    h, m = divmod(t, 60)\n    print(f"{h:02}:{m:02}")',
            'times = [start + n * gap for n in range(count)]\nfor t in times:\n    h, m = divmod(t, 60)\n    print(f"{h}:{m}")',
            'times = [start + n * gap for n in range(count)]\nfor t in times:\n    m, h = divmod(t, 60)\n    print(f"{h:02}:{m:02}")',
            'times = [start + n * gap for n in range(count - 1)]\nfor t in times:\n    h, m = divmod(t, 60)\n    print(f"{h:02}:{m:02}")',
          ],
          hints: [
            "The first chime is at the start, with no gap added yet. And 130 minutes is how many whole hours, with how many minutes left over?",
            "`[n * 3 for n in range(4)]` builds a list in one line. `hours, mins = divmod(200, 60)` splits minutes into whole hours and what's left. `f\"{n:02}\"` writes a number with two digits.",
            "`times = [start + n * gap for n in range(___)]`, then for each time `h, m = divmod(t, 60)` and print both with two digits.",
          ],
          needs: [
            [ONE_LINE_LIST, "Build the chime times as a list in a single line: that's today's practice."],
            ["divmod\\(", "Let divmod split each time into hours and minutes in one go."],
          ],
          advice: "One line per chime, two digits, a colon, two digits.",
          codex: ["comprehension-range", "clock-arithmetic", "comprehensions"],
        };
      }
      if (twist === "tags") {
        const crops = r.sample(CROPS, r.int(3, 5));
        const limit = r.int(18, 30);
        const weights: Record<string, number> = {};
        crops.forEach((c, i) => (weights[c] = i === 0 ? limit : r.int(8, 40)));
        const shuffled: Record<string, number> = {};
        for (const c of r.shuffle(crops)) shuffled[c] = weights[c];
        return {
          title: "Heavy or Light",
          topic: "dictionary comprehensions and if-else in a line",
          task: [
            "Each crop's sack in `weights` gets a tag: heavy when it weighs at least `limit` kilos, light when it weighs less.",
            "Build a dictionary of tags (each crop to its tag) in a single line.",
            "Then print one line per crop, in the same order: the crop, a colon and a space, then its tag.",
          ],
          data: { weights: shuffled, limit },
          plan: ["Every crop's tag, in one line", "One line per crop"],
          body: 'tags = {crop: ("heavy" if kg >= limit else "light") for crop, kg in weights.items()}\nfor crop in tags:\n    print(f"{crop}: {tags[crop]}")',
          variants: [
            { data: { weights: { mint: 20, wheat: 31, garlic: 19 }, limit: 20 }, note: "The mint weighs exactly the limit." },
            { data: { weights: { potato: 5, carrot: 9 }, limit: 25 }, note: "Every sack is light today." },
            { data: { weights: { cabbage: 40, pumpkin: 26, chamomile: 12 }, limit: 12 } },
          ],
          wrong: [
            'tags = {crop: ("heavy" if kg > limit else "light") for crop, kg in weights.items()}\nfor crop in tags:\n    print(f"{crop}: {tags[crop]}")',
            'tags = {crop: ("light" if kg >= limit else "heavy") for crop, kg in weights.items()}\nfor crop in tags:\n    print(f"{crop}: {tags[crop]}")',
            'tags = {crop: ("heavy" if kg >= limit else "light") for crop, kg in weights.items()}\nprint(tags)',
          ],
          hints: [
            "Each crop's tag depends on one question about its weight. Can you ask that question right inside the line that builds the dictionary?",
            "`{name: n * 2 for name, n in jars.items()}` builds a dictionary in one line. `\"open\" if hour < 18 else \"shut\"` picks one of two values.",
            "`tags = {crop: (\"heavy\" if kg ___ limit else \"light\") for crop, kg in weights.items()}`, then print each crop and its tag.",
          ],
          needs: [
            ["\\{[^}\\n]*\\bfor\\b", "Build the tags as a dictionary in a single line: that's today's practice."],
            ["\\bif\\b[^\\n]*\\belse\\b", "Choose each tag inside the line, with if and else."],
          ],
          advice: "One line per crop: the crop, a colon and a space, then heavy or light.",
          codex: ["dict-comprehensions", "conditional-expressions"],
        };
      }
      const jobs = Array.from({ length: r.int(5, 7) }, () => r.int(20, 200));
      jobs[r.int(0, jobs.length - 1)] = r.int(61, 190);
      return {
        title: "The Long Jobs",
        topic: "comprehensions with if, and divmod",
        task: [
          "`jobs` holds how many minutes each of today's farm jobs took.",
          "In a single line, make a list of just the jobs that took an hour or more, in the same order.",
          "Print one line for each of them: the whole hours, the letter h, a space, then the minutes left over and the letter m.",
        ],
        data: { jobs },
        plan: ["Keep the long jobs, in one line", "Each one as hours and minutes"],
        body: 'long = [m for m in jobs if m >= 60]\nfor m in long:\n    h, rest = divmod(m, 60)\n    print(f"{h}h {rest}m")',
        variants: [
          { data: { jobs: [45, 60, 59, 61] }, note: "One job took exactly an hour." },
          { data: { jobs: [10, 25, 59] }, note: "No long jobs today." },
          { data: { jobs: [125, 30, 240] } },
        ],
        wrong: [
          'long = [m for m in jobs if m > 60]\nfor m in long:\n    h, rest = divmod(m, 60)\n    print(f"{h}h {rest}m")',
          'long = [m for m in jobs if m >= 60]\nfor m in long:\n    print(f"{m // 60}h {m}m")',
          'long = [m for m in jobs if m >= 60]\nfor m in long:\n    print(f"{m / 60}h {m % 60}m")',
          'for m in jobs:\n    h, rest = divmod(m, 60)\n    print(f"{h}h {rest}m")',
        ],
        hints: [
          "Two jobs here: first keep only the long ones, then turn each into hours and leftover minutes.",
          "`[a for a in ages if a > 9]` keeps some items in one line. `hours, mins = divmod(200, 60)` splits minutes into whole hours and the rest.",
          "`long = [m for m in jobs if m ___ 60]`, then `h, rest = divmod(m, 60)` for each.",
        ],
        needs: [["\\[[^\\]\\n]*\\bfor\\b[^\\]\\n]*\\bif\\b", "Keep the long jobs with a one-line list and an if inside it: that's today's practice."]],
        advice: "One line per long job, like a number, h, a space, a number, m.",
        codex: ["comprehension-filters", "clock-arithmetic"],
      };
    },
  },
  {
    id: "ct-rows",
    topics: ["townhall", "clocktower"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["names", "total"] as const);
      const crops = r.sample(CROPS, 3);
      const rows = (n: number): [string, string, number][] => Array.from({ length: n }, () => [r.pick(FOLK), r.pick(crops), r.int(5, 40)]);
      const today = rows(r.int(5, 7));
      today[r.int(0, today.length - 1)][2] = r.int(30, 40);
      const other: [string, string, number][] = [["Bram", "wheat", 9], ["Sable", "garlic", 25], ["Odo", "wheat", 31], ["Pip", "mint", 24], ["Hazel", "wheat", 6]];
      const intro = "`deliveries.csv` lists today's deliveries to the mill: who brought it, the crop, and the kilos.";
      if (twist === "names") {
        const limit = r.int(15, 28);
        return {
          title: "The Big Deliveries",
          topic: "comprehensions over file rows",
          task: [intro, "In a single line, make a list of the names on every delivery of at least `limit` kilos, in the file's order.", "Print each of those names on its own line."],
          data: { limit },
          head: bookLine(csv(today)),
          files: { "deliveries.csv": csv(today) },
          plan: ["Read the rows", "The names on the big deliveries, in one line", "Print them"],
          body: 'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nbig = [row["name"] for row in rows if int(row["kilos"]) >= limit]\nfor name in big:\n    print(name)',
          variants: [
            { files: { "deliveries.csv": csv(other) }, data: { limit: 24 }, note: "One delivery weighs exactly the limit, and one only 9 kilos." },
            { files: { "deliveries.csv": csv(other) }, data: { limit: 35 }, note: "No delivery is that big today." },
            { files: { "deliveries.csv": csv(rows(4)) }, data: { limit: 10 } },
          ],
          wrong: [
            'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nbig = [row["name"] for row in rows if row["kilos"] >= str(limit)]\nfor name in big:\n    print(name)',
            'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nbig = [row["name"] for row in rows if int(row["kilos"]) > limit]\nfor name in big:\n    print(name)',
            'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nbig = [row["name"] for row in rows]\nfor name in big:\n    print(name)',
          ],
          hints: [
            "Every value read from a file is text. What has to happen to the kilos before you can compare them with a number?",
            "`[row[\"title\"] for row in rows if int(row[\"pages\"]) > 50]` keeps some rows and takes one field from each, in one line.",
            "`big = [row[\"name\"] for row in rows if int(row[\"kilos\"]) ___ limit]`",
          ],
          needs: [[ONE_LINE_LIST, "Make the list of names in a single line: that's today's practice."]],
          advice: "Just the names, one per line, in the file's order.",
          codex: ["comprehension-filters", "csv-dicts"],
        };
      }
      const crop = today[r.int(0, today.length - 1)][1];
      return {
        title: "One Crop's Weight",
        topic: "comprehensions over file rows",
        task: [intro, "In a single line, make a list of the kilos (as numbers) of every delivery of `crop`.", "Print the total kilos of that crop, as a plain number."],
        data: { crop },
        head: bookLine(csv(today)),
        files: { "deliveries.csv": csv(today) },
        plan: ["Read the rows", "That crop's kilos, in one line", "The total"],
        body: 'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nkilos = [int(row["kilos"]) for row in rows if row["crop"] == crop]\nprint(sum(kilos))',
        variants: [
          { files: { "deliveries.csv": csv(other) }, data: { crop: "wheat" } },
          { files: { "deliveries.csv": csv(other) }, data: { crop: "pumpkin" }, note: "Nobody brought any pumpkin today." },
          { files: { "deliveries.csv": csv(other) }, data: { crop: "mint" }, note: "Just one delivery of mint." },
        ],
        wrong: [
          'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nkilos = [int(row["kilos"]) for row in rows if row["crop"] == crop]\nprint(len(kilos))',
          'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nkilos = [int(row["kilos"]) for row in rows]\nprint(sum(kilos))',
          'import csv\nwith open("deliveries.csv") as f:\n    rows = list(csv.DictReader(f))\nkilos = [row["kilos"] for row in rows if row["crop"] == crop]\nprint(sum(kilos))',
        ],
        hints: [
          "Two steps: pick out the right crop's deliveries and their kilos, then add them up. The kilos come out of the file as text.",
          "`[int(row[\"pages\"]) for row in rows if row[\"shelf\"] == \"top\"]` takes one number from each matching row, in one line. `sum(...)` adds a list up.",
          "`kilos = [int(row[\"kilos\"]) for row in rows if row[\"crop\"] == ___]`, then print the sum.",
        ],
        needs: [[ONE_LINE_LIST, "Make the list of kilos in a single line: that's today's practice."]],
        advice: "One number: that crop's kilos, added up.",
        codex: ["comprehension-filters", "csv-dicts"],
      };
    },
  },
  {
    id: "ct-fn",
    topics: ["forge", "clocktower"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["ready", "crates", "apart"] as const);
      if (twist === "ready") {
        const fn = r.pick(["ready_day", "ripe_on"]);
        const a = [2026, r.int(1, 12), r.int(1, 28)];
        const g = r.int(20, 90);
        return {
          title: "The Ripening Function",
          topic: "functions with dates",
          task: [
            `Write a function \`${fn}(sown, grow)\`. \`sown\` is a list of the year, month and day a crop went in, and \`grow\` is how many days it needs.`,
            "Hand back the date the crop is ready (as a date). Don't print inside the function.",
          ],
          head: "from datetime import date, timedelta",
          plan: ["Your function goes here"],
          body: `def ${fn}(sown, grow):\n    return date(sown[0], sown[1], sown[2]) + timedelta(days=grow)`,
          drive: `print(${fn}(${JSON.stringify(a)}, ${g}))\nprint(${fn}([2027, 3, 10], 7))`,
          variants: [
            { drive: `print(${fn}([2026, 12, 25], 10))`, note: "The crop ripens in the new year." },
            { drive: `print(${fn}([2028, 2, 27], 3))\nprint(${fn}([2027, 5, 5], 0))`, note: "2028 is a leap year; a crop that needs no days is ready the day it's sown." },
          ],
          wrong: [
            `def ${fn}(sown, grow):\n    print(date(sown[0], sown[1], sown[2]) + timedelta(days=grow))`,
            `def ${fn}(sown, grow):\n    return date(sown[0], sown[1], sown[2] + grow)`,
            `def ${fn}(sown, grow):\n    return date(sown[0], sown[1], sown[2]) + timedelta(weeks=grow)`,
            `def ${fn}(sown, grow):\n    return date(sown[0], sown[1], sown[2]) + timedelta(days=grow + 1)`,
          ],
          hints: [
            "Adding to the day number alone breaks at the end of a month. What can add a length of time to a whole date?",
            "`date(2026, 1, 9) + timedelta(days=3)` is three days later, months and years carried over for you. A function hands its answer back with `return`.",
            `\`def ${fn}(sown, grow):\` and \`return date(sown[0], sown[1], sown[2]) + timedelta(days=___)\``,
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`]],
          advice: "Hand the date back with return.",
          codex: ["timedelta", "return"],
        };
      }
      if (twist === "crates") {
        const fn = r.pick(["crates_for", "crates_needed"]);
        const d = r.int(4, 8);
        const j = d * r.int(2, 6) + r.int(1, d - 1);
        return {
          title: "The Crate Counter",
          topic: "functions with math",
          task: [
            `Write a function \`${fn}(jars, per_crate)\` that hands back how many crates the jars need. A crate may go out part-full, but every jar needs a place.`,
            `When nobody says how many fit, a crate holds ${d} jars.`,
            "Hand the number back; don't print inside the function.",
          ],
          plan: ["Bring in what you need", "Your function goes here"],
          body: `import math\n\ndef ${fn}(jars, per_crate=${d}):\n    return math.ceil(jars / per_crate)`,
          drive: `print(${fn}(${j}))\nprint(${fn}(${j}, ${d + 2}))`,
          variants: [
            { drive: `print(${fn}(${d * 4}))\nprint(${fn}(0))`, note: "The jars fill the crates exactly; and no jars need no crates." },
            { drive: `print(${fn}(per_crate=5, jars=11))\nprint(${fn}(1))` },
          ],
          wrong: [
            `def ${fn}(jars, per_crate=${d}):\n    return jars // per_crate`,
            `import math\n\ndef ${fn}(jars, per_crate):\n    return math.ceil(jars / per_crate)`,
            `def ${fn}(jars, per_crate=${d}):\n    return jars // per_crate + 1`,
            `import math\n\ndef ${fn}(jars, per_crate=${d}):\n    print(math.ceil(jars / per_crate))`,
          ],
          hints: [
            "A part-full crate still counts as a crate, so you round up. And the second value needs a fallback for when it isn't given.",
            "`math.ceil(7 / 2)` rounds up to a whole number. `def bake(loaves, oven=3):` gives `oven` a value when the caller leaves it out.",
            `\`def ${fn}(jars, per_crate=${d}):\` and \`return math.___(jars / per_crate)\``,
          ],
          needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`]],
          advice: "Hand the number back with return.",
          codex: ["math-module", "defaults-keywords"],
        };
      }
      const fn = r.pick(["days_apart", "days_between"]);
      const a = [2026, r.int(1, 6), r.int(1, 28)];
      const b = [2026, r.int(7, 12), r.int(1, 28)];
      return {
        title: "Days Apart",
        topic: "functions with dates",
        task: [
          `Write a function \`${fn}(first, second)\`. Each is a list of a year, month and day.`,
          "Hand back how many days apart the two days are, as a plain number. It doesn't matter which one comes first: the answer is never below zero.",
        ],
        head: "from datetime import date",
        plan: ["Your function goes here"],
        body: `def ${fn}(first, second):\n    gap = date(second[0], second[1], second[2]) - date(first[0], first[1], first[2])\n    return abs(gap.days)`,
        drive: `print(${fn}(${JSON.stringify(a)}, ${JSON.stringify(b)}))`,
        variants: [
          { drive: `print(${fn}(${JSON.stringify(b)}, ${JSON.stringify(a)}))`, note: "The later day comes first this time." },
          { drive: `print(${fn}([2027, 4, 9], [2027, 4, 9]))\nprint(${fn}([2028, 2, 28], [2028, 3, 1]))`, note: "The same day twice; then a leap-year February." },
        ],
        wrong: [
          `def ${fn}(first, second):\n    gap = date(second[0], second[1], second[2]) - date(first[0], first[1], first[2])\n    return gap.days`,
          `def ${fn}(first, second):\n    gap = date(second[0], second[1], second[2]) - date(first[0], first[1], first[2])\n    return abs(gap.days) + 1`,
          `def ${fn}(first, second):\n    return date(second[0], second[1], second[2]) - date(first[0], first[1], first[2])`,
        ],
        hints: [
          "Take one date from the other. What if the second day is the earlier one?",
          "`(date(2026, 8, 1) - date(2026, 5, 25)).days` is a plain number of days, below zero when the first date is the later one. `abs(-4)` drops the minus sign.",
          `\`gap = date(second[0], second[1], second[2]) - date(first[0], first[1], first[2])\`, then \`return ___(gap.days)\``,
        ],
        needs: [["def\\s+" + fn + "\\s*\\(", `Wren asks for a function named ${fn}.`]],
        advice: "Hand back a plain number of days with return.",
        codex: ["timedelta", "return"],
      };
    },
  },
];
