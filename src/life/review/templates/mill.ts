import type { Spec, Template } from "../build.ts";
import { CROPS, PEOPLE } from "../rng.ts";

// The mill: comparisons and conditionals (if / elif / else, and / or / not, in, min / max / round).

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const MILL: Template[] = [
  {
    id: "ml-millday",
    topics: ["mill"],
    difficulty: 1,
    make(r): Spec {
      const calm = r.int(8, 15);
      const twist = r.pick(["rain", "band", "help"] as const);
      if (twist === "rain")
        return {
          title: "A Milling Day?",
          topic: "and / not",
          task: [
            "Wren only grinds when the sails can turn and the grain stays dry.",
            `\`wind\` is today's wind in km/h, and \`raining\` says whether it rains. She grinds when the wind is ${calm} or more and it isn't raining.`,
            "Print True if she grinds today and False if she doesn't.",
          ],
          data: { wind: r.int(calm - 4, calm + 10), raining: r.chance(0.3) },
          plan: ["Enough wind?", "Dry?", "Both together"],
          body: `print(wind >= ${calm} and not raining)`,
          variants: [
            { data: { wind: calm, raining: false }, note: `Exactly ${calm} km/h: that is enough wind.` },
            { data: { wind: calm + 12, raining: true }, note: "Plenty of wind, but it rains." },
            { data: { wind: calm - 1, raining: false }, note: "Dry, but just short of enough wind." },
          ],
          wrong: [`print(wind > ${calm} and not raining)`, `print(wind >= ${calm} or not raining)`, `print(wind >= ${calm} and raining)`, `print(wind >= ${calm})`],
          hints: [
            "Two things must both be right: enough wind, and no rain. Say each one as a question with a True or False answer.",
            "`hungry and not tired` is True only when hungry is True and tired is False. `>=` means 'at least'.",
            `\`print(wind >= ${calm} ___ not raining)\``,
          ],
          advice: "Just True or False.",
          codex: ["logic", "comparisons"],
        };
      if (twist === "band") {
        const lo = r.int(6, 10);
        const hi = r.int(25, 40);
        return {
          title: "Safe Sails",
          topic: "chained comparisons",
          task: [
            `The mill's sails turn safely when the wind is from ${lo} to ${hi} km/h, both included. Any less and they stand still; any more and a sail could snap.`,
            "`wind` is today's wind. Print True if the sails can turn safely today, False if not.",
          ],
          data: { wind: r.int(lo - 4, hi + 6) },
          plan: ["Is the wind inside the safe range?"],
          body: `print(${lo} <= wind <= ${hi})`,
          variants: [
            { data: { wind: lo }, note: `Exactly ${lo}: the low edge is included.` },
            { data: { wind: hi }, note: `Exactly ${hi}: the high edge is included too.` },
            { data: { wind: hi + 1 }, note: "Just over the top." },
            { data: { wind: lo - 1 }, note: "Just under the bottom." },
          ],
          wrong: [`print(${lo} < wind < ${hi})`, `print(wind <= ${hi})`, `print(${lo} <= wind or wind <= ${hi})`],
          hints: [
            "Picture a number line: too calm on the left, safe in the middle, too stormy on the right. Ask about the middle.",
            "`3 <= eggs <= 9` is True when eggs is anywhere from 3 to 9, the ends included.",
            `\`print(${lo} ___ wind ___ ${hi})\``,
          ],
          advice: "Just True or False.",
          codex: ["chained", "comparisons"],
        };
      }
      const n = r.int(2, 4);
      return {
        title: "Wind or Helpers",
        topic: "or",
        task: [
          "The millstones can turn by wind, or by hand if enough neighbours come to push the bars.",
          `\`wind\` is today's wind in km/h and \`helpers\` is how many neighbours came. Wren grinds when the wind is ${calm} or more, or when at least ${n} helpers came.`,
          "Print True if she grinds today and False if not.",
        ],
        data: { wind: r.int(calm - 6, calm + 6), helpers: r.int(0, n + 2) },
        plan: ["Enough wind?", "Enough helpers?", "Either will do"],
        body: `print(wind >= ${calm} or helpers >= ${n})`,
        variants: [
          { data: { wind: calm - 3, helpers: n }, note: `Not enough wind, but exactly ${n} helpers came.` },
          { data: { wind: calm, helpers: 0 }, note: `Nobody came, but the wind is exactly ${calm}.` },
          { data: { wind: calm - 1, helpers: n - 1 }, note: "A little short on both." },
        ],
        wrong: [`print(wind >= ${calm} and helpers >= ${n})`, `print(wind >= ${calm} or helpers > ${n})`, `print(wind > ${calm} or helpers >= ${n})`],
        hints: [
          "Either way works for Wren. Ask the two questions separately, then join them.",
          "`sunny or warm` is True when at least one of them is True. `>=` means 'at least'.",
          `\`print(wind >= ${calm} ___ helpers >= ${n})\``,
        ],
        advice: "Just True or False.",
        codex: ["logic", "comparisons"],
      };
    },
  },
  {
    id: "ml-bigger",
    topics: ["mill"],
    difficulty: 1,
    make(r): Spec {
      const [a, b, c, d] = r.sample(PEOPLE.filter((p) => p !== "Wren"), 4);
      const [kg1, kg2] = r.ints(2, 20, 90);
      const crop = r.pick(["pumpkin", "potato", "cabbage", "carrot"]);
      const story = `Two neighbours are weighing their ${crop} harvests at the mill. The starter holds each name and the kilos that go with it.`;
      if (r.chance(0.5))
        return {
          title: "The Bigger Harvest",
          topic: "if / else",
          task: [story, "Print the name of whoever grew more, and nothing else.", "If the two weigh the same, the one written first in the starter gets it: theirs was weighed first."],
          data: { name1: a, kg1, name2: b, kg2 },
          plan: ["Compare the kilos", "Print the name that goes with the bigger harvest"],
          body: "if kg1 >= kg2:\n    print(name1)\nelse:\n    print(name2)",
          variants: [
            { data: { kg1: 40, kg2: 40 }, note: "A tie: the first one weighed wins." },
            { data: { name1: c, kg1: 31, name2: d, kg2: 58 } },
            { data: { name1: d, kg1: 70, name2: c, kg2: 12 } },
          ],
          wrong: ["if kg1 > kg2:\n    print(name1)\nelse:\n    print(name2)", "print(max(kg1, kg2))", "if kg1 < kg2:\n    print(name1)\nelse:\n    print(name2)", "print(name1)"],
          hints: [
            "Compare the two weights first. Which name goes with the bigger one, and what happens on a tie?",
            "`if eggs >= jars:` runs its block when eggs is at least jars; `else:` catches every other case.",
            "`if kg1 ___ kg2:` prints name1, and `else:` prints name2.",
          ],
          advice: "Just the name.",
          codex: ["else-elif", "comparisons"],
        };
      return {
        title: "How Far Apart",
        topic: "min and max",
        task: [story, "Print how many kilos more the bigger harvest weighs than the smaller one, as a plain number (never below zero)."],
        data: { name1: a, kg1, name2: b, kg2 },
        plan: ["The bigger harvest", "The smaller harvest", "The difference"],
        body: "print(max(kg1, kg2) - min(kg1, kg2))",
        variants: [
          { data: { kg1: 40, kg2: 40 }, note: "A tie: no difference at all." },
          { data: { kg1: 31, kg2: 58 }, note: "The second harvest is the bigger one." },
          { data: { kg1: 70, kg2: 12 }, note: "The first harvest is the bigger one." },
        ],
        wrong: ["print(kg1 - kg2)", "print(kg2 - kg1)", "print(max(kg1, kg2))"],
        hints: [
          "You don't know which harvest is bigger until the program looks. Find the bigger and the smaller first.",
          "`max(3, 8)` is 8 and `min(3, 8)` is 3, whichever order you give them in.",
          "`print(max(kg1, kg2) ___ min(kg1, kg2))`",
        ],
        advice: "One number, never negative.",
        codex: ["min-max"],
      };
    },
  },
  {
    id: "ml-basket",
    topics: ["mill"],
    difficulty: 2,
    make(r): Spec {
      const lo = r.int(6, 9) * 10;
      const hi = lo + r.int(5, 9) * 10;
      const crop = r.pick(["potatoes", "onions", "apples", "turnips"]);
      const data = { grams: r.int(lo - 30, hi + 30) };
      if (r.chance(0.5))
        return {
          title: "Three Baskets",
          topic: "if / elif / else",
          task: [
            `Wren sorts ${crop} into three baskets by weight. \`grams\` is the weight of the one in her hand.`,
            `Under ${lo} grams goes in basket 1. From ${lo} to ${hi} grams, both included, goes in basket 2. Over ${hi} grams goes in basket 3.`,
            "Print just the basket's number.",
          ],
          data,
          plan: ["Light?", "Middling?", "Otherwise heavy"],
          body: `if grams < ${lo}:\n    print(1)\nelif grams <= ${hi}:\n    print(2)\nelse:\n    print(3)`,
          variants: [
            { data: { grams: lo }, note: `Exactly ${lo} grams belongs in basket 2.` },
            { data: { grams: hi }, note: `Exactly ${hi} grams still belongs in basket 2.` },
            { data: { grams: hi + 1 }, note: "Just over the middle band." },
            { data: { grams: lo - 1 }, note: "Just under the middle band." },
          ],
          wrong: [
            `if grams <= ${lo}:\n    print(1)\nelif grams <= ${hi}:\n    print(2)\nelse:\n    print(3)`,
            `if grams < ${lo}:\n    print(1)\nelif grams < ${hi}:\n    print(2)\nelse:\n    print(3)`,
            `if grams <= ${hi}:\n    print(2)\nelif grams < ${lo}:\n    print(1)\nelse:\n    print(3)`,
            `if grams < ${lo}:\n    print(1)\nif grams <= ${hi}:\n    print(2)\nelse:\n    print(3)`,
          ],
          hints: [
            "Work down from the lightest: is it in basket 1? If not, is it in basket 2? If neither, there's only one basket left. Watch which edges are included.",
            "`if eggs < 6:` ... `elif eggs <= 12:` ... `else:` ... asks one question after another and stops at the first True one.",
            `\`if grams < ${lo}:\` prints 1, then \`elif grams ___ ${hi}:\` prints 2, and \`else:\` prints 3.`,
          ],
          advice: "Just the basket number. Check the two edges of the middle band.",
          codex: ["else-elif", "comparisons"],
        };
      return {
        title: "Three Baskets",
        topic: "if / elif / else",
        task: [
          `Wren sorts ${crop} into three baskets by weight. \`grams\` is the weight of the one in her hand.`,
          `Up to ${lo} grams, ${lo} included, goes in basket 1. More than ${lo} but under ${hi} grams goes in basket 2. ${hi} grams or more goes in basket 3.`,
          "Print just the basket's number.",
        ],
        data,
        plan: ["Light?", "Middling?", "Otherwise heavy"],
        body: `if grams <= ${lo}:\n    print(1)\nelif grams < ${hi}:\n    print(2)\nelse:\n    print(3)`,
        variants: [
          { data: { grams: lo }, note: `Exactly ${lo} grams belongs in basket 1.` },
          { data: { grams: hi }, note: `Exactly ${hi} grams belongs in basket 3.` },
          { data: { grams: lo + 1 }, note: "Just over the light band." },
          { data: { grams: hi - 1 }, note: "Just under the heavy band." },
        ],
        wrong: [
          `if grams < ${lo}:\n    print(1)\nelif grams < ${hi}:\n    print(2)\nelse:\n    print(3)`,
          `if grams <= ${lo}:\n    print(1)\nelif grams <= ${hi}:\n    print(2)\nelse:\n    print(3)`,
          `if grams < ${hi}:\n    print(2)\nelif grams <= ${lo}:\n    print(1)\nelse:\n    print(3)`,
          `if grams <= ${lo}:\n    print(1)\nif grams < ${hi}:\n    print(2)\nelse:\n    print(3)`,
        ],
        hints: [
          "Work down from the lightest: is it in basket 1? If not, is it in basket 2? If neither, there's only one basket left. Watch which edges are included.",
          "`if eggs <= 6:` ... `elif eggs < 12:` ... `else:` ... asks one question after another and stops at the first True one.",
          `\`if grams ___ ${lo}:\` prints 1, then \`elif grams < ${hi}:\` prints 2, and \`else:\` prints 3.`,
        ],
        advice: "Just the basket number. Check the edges: which basket owns each one?",
        codex: ["else-elif", "comparisons"],
      };
    },
  },
  {
    id: "ml-rows",
    topics: ["mill"],
    difficulty: 2,
    make(r): Spec {
      const rows = r.int(8, 16);
      const [even, odd, edge] = r.sample(CROPS, 3);
      return {
        title: "Which Crop in Which Row",
        topic: "% 2 and or",
        task: [
          "Wren's field has `rows` rows, numbered from 1.",
          "The first row and the last row are edge rows: they always get `edge_crop`, which keeps the pests off.",
          "Every other row gets `even_crop` if its number is even and `odd_crop` if it is odd.",
          "Print just the crop for row number `row`.",
        ],
        data: { rows, row: r.int(2, rows - 1), even_crop: even, odd_crop: odd, edge_crop: edge },
        plan: ["Is it an edge row?", "Otherwise: even or odd?"],
        body: "if row == 1 or row == rows:\n    print(edge_crop)\nelif row % 2 == 0:\n    print(even_crop)\nelse:\n    print(odd_crop)",
        variants: [
          { data: { row: 1 }, note: "Row 1 is an edge row." },
          { data: { rows: 12, row: 12 }, note: "The last row, and an even one: still an edge row." },
          { data: { rows: 15, row: 13 }, note: "Odd, but not the last row." },
          { data: { rows: 15, row: 6 } },
        ],
        wrong: [
          "if row % 2 == 0:\n    print(even_crop)\nelif row == 1 or row == rows:\n    print(edge_crop)\nelse:\n    print(odd_crop)",
          "if row == 1:\n    print(edge_crop)\nelif row % 2 == 0:\n    print(even_crop)\nelse:\n    print(odd_crop)",
          "if row == 1 or row == rows - 1:\n    print(edge_crop)\nelif row % 2 == 0:\n    print(even_crop)\nelse:\n    print(odd_crop)",
          "if row == 1 or row == rows:\n    print(edge_crop)\nelif row % 2 == 1:\n    print(even_crop)\nelse:\n    print(odd_crop)",
        ],
        hints: [
          "The edge rule beats the even/odd rule, so ask about the edges first. Which two numbers are the edges?",
          "`n % 2` is 0 for even numbers and 1 for odd ones. `if a == 1 or a == last:` catches either end.",
          "`if row == 1 or row == ___:` prints edge_crop, then `elif row % 2 == 0:` and `else:` for the rest.",
        ],
        advice: "Just the crop's name.",
        codex: ["truthiness", "logic", "else-elif"],
      };
    },
  },
  {
    id: "ml-report",
    topics: ["mill"],
    difficulty: 3,
    make(r): Spec {
      const lo = r.int(8, 12);
      const hi = r.int(30, 40);
      const day = r.pick(DAYS);
      const rainy = r.chance(0.3);
      const sky = rainy ? r.pick(["light rain", "rainy", "heavy rain later"]) : r.pick(["sunny", "cloudy", "misty", "windy"]);
      return {
        title: "The Word on the Door",
        topic: "if / elif / else and in",
        task: [
          "Each morning Wren chalks one word on the mill door. The starter holds today's day and weather.",
          "Any sky with rain in it means `cover`, whatever the wind does.",
          `Otherwise it's down to the wind: below ${lo} km/h means \`wait\`, above ${hi} means \`brake\`, and from ${lo} to ${hi} (both included) means \`grind\`.`,
          "Print one line: the day, a colon and a space, then the word.",
          "Only on a grinding day, print a second line: `Hours: ` followed by how long the `sacks` take at `per_hour` sacks an hour, rounded to one decimal place.",
        ],
        data: { day, sky, wind: r.int(lo - 3, hi + 5), sacks: r.int(10, 60), per_hour: r.int(3, 8) },
        plan: ["Choose the word", "The day and the word", "The hours, on grinding days only"],
        body: `if "rain" in sky:\n    word = "cover"\nelif wind < ${lo}:\n    word = "wait"\nelif wind > ${hi}:\n    word = "brake"\nelse:\n    word = "grind"\nprint(f"{day}: {word}")\nif word == "grind":\n    print(f"Hours: {round(sacks / per_hour, 1)}")`,
        variants: [
          { data: { sky: "light rain", wind: hi + 5 }, note: "Rain and a gale together: the rain decides." },
          { data: { sky: "misty", wind: lo, sacks: 30, per_hour: 6 }, note: `Exactly ${lo} km/h is grinding weather.` },
          { data: { sky: "sunny", wind: hi, sacks: 25, per_hour: 3 }, note: `Exactly ${hi} km/h is still grinding weather.` },
          { data: { sky: "cloudy", wind: hi + 1 }, note: "Just over the storm limit." },
          { data: { sky: "windy", wind: lo - 1 }, note: "Just under the calm limit." },
        ],
        wrong: [
          `if sky == "rain":\n    word = "cover"\nelif wind < ${lo}:\n    word = "wait"\nelif wind > ${hi}:\n    word = "brake"\nelse:\n    word = "grind"\nprint(f"{day}: {word}")\nif word == "grind":\n    print(f"Hours: {round(sacks / per_hour, 1)}")`,
          `if wind < ${lo}:\n    word = "wait"\nelif wind > ${hi}:\n    word = "brake"\nelif "rain" in sky:\n    word = "cover"\nelse:\n    word = "grind"\nprint(f"{day}: {word}")\nif word == "grind":\n    print(f"Hours: {round(sacks / per_hour, 1)}")`,
          `if "rain" in sky:\n    word = "cover"\nelif wind <= ${lo}:\n    word = "wait"\nelif wind >= ${hi}:\n    word = "brake"\nelse:\n    word = "grind"\nprint(f"{day}: {word}")\nif word == "grind":\n    print(f"Hours: {round(sacks / per_hour, 1)}")`,
          `if "rain" in sky:\n    word = "cover"\nelif wind < ${lo}:\n    word = "wait"\nelif wind > ${hi}:\n    word = "brake"\nelse:\n    word = "grind"\nprint(f"{day}: {word}")\nprint(f"Hours: {round(sacks / per_hour, 1)}")`,
        ],
        hints: [
          "Settle the word first and keep it in a variable; the rain question comes before any wind question. Then print, and ask once more whether it's a grinding day.",
          "`if \"salt\" in label:` is True for any label containing salt anywhere. `round(7 / 3, 1)` gives 2.3.",
          `Start with \`if "rain" in sky:\`, then \`elif wind < ${lo}:\`, \`elif wind > ${hi}:\` and \`else:\` to set the word; after printing, \`if word == ___:\` prints the hours line.`,
        ],
        advice: "First the day, a colon, a space and the word; the hours line only when grinding.",
        codex: ["in", "else-elif", "chained", "min-max"],
      };
    },
  },
];
