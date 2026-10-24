import type { Spec, Template } from "../build.ts";
import { CROPS, FIELDS, PEOPLE } from "../rng.ts";

// The tavern: print, strings, variables, arithmetic, f-strings, string methods, indexing.
// No `if` here (that is the mill), no lists, no loops.

const GRAINS = ["wheat", "barley", "oats", "rye"];
const two = (n: number) => String(n).padStart(2, "0");

export const TAVERN: Template[] = [
  {
    id: "tv-sacks",
    topics: ["tavern"],
    difficulty: 1,
    make(r): Spec {
      const sack = r.int(15, 40);
      const grain = sack * r.int(4, 12) + r.int(1, sack - 1);
      const who = r.pick(PEOPLE);
      const crop = r.pick(GRAINS);
      const twist = r.pick(["full", "left", "both"] as const);
      const story = `${who} tipped a heap of ${crop} on the mill floor: \`grain\` kilos of it. Wren fills sacks that hold \`sack\` kilos each, and a sack only counts once it is filled right to the top.`;
      const data = { grain, sack };
      const variants = [
        { data: { grain: sack * 9 }, note: "This heap fills the sacks exactly, with nothing loose on the floor." },
        { data: { grain: sack - 3 }, note: "Not even one sack fills up today." },
        { data: { grain: 257, sack: 30 } },
      ];
      if (twist === "full")
        return {
          title: "Full Sacks",
          topic: "whole-number division",
          task: [story, "Print how many full sacks Wren ends up with, as one whole number."],
          data,
          plan: ["How many whole sacks fit in the heap?"],
          body: "print(grain // sack)",
          variants,
          wrong: ["print(grain / sack)", "print(grain % sack)", "print(grain // sack + 1)", "print(round(grain / sack))"],
          hints: [
            "How many times does one whole sack fit into the heap? The loose kilos at the end don't make a sack.",
            "Python has a division that drops the leftover: `23 // 5` is 4, while `23 / 5` is 4.6.",
            "`print(grain ___ sack)`",
          ],
          advice: "One whole number: the full sacks, nothing else.",
          codex: ["math"],
        };
      if (twist === "left")
        return {
          title: "Loose Grain",
          topic: "the leftover of a division",
          task: [story, "Wren fills as many full sacks as she can. Print how many kilos are left loose on the floor after that, as one number."],
          data,
          plan: ["What is left once every full sack is filled?"],
          body: "print(grain % sack)",
          variants,
          wrong: ["print(grain // sack)", "print(grain - sack)", "print(sack - grain % sack)"],
          hints: [
            "Try it on paper: 23 kilos into sacks of 5. How much is left over once the full sacks are tied?",
            "`%` gives the leftover of a division: `23 % 5` is 3, because four fives make 20.",
            "`print(grain ___ sack)`",
          ],
          advice: "One number: the loose kilos.",
          codex: ["math"],
        };
      return {
        title: "Sacks and Sweepings",
        topic: "// and %",
        task: [story, "Print two lines: first how many full sacks Wren fills, then how many kilos are left loose."],
        data,
        plan: ["The full sacks", "The loose kilos"],
        body: "print(grain // sack)\nprint(grain % sack)",
        variants,
        wrong: ["print(grain % sack)\nprint(grain // sack)", "print(grain / sack)\nprint(grain % sack)", "print(grain // sack, grain % sack)"],
        hints: [
          "Two questions about the same division: how many times does a sack fit, and what is left over?",
          "`23 // 5` is 4 (whole fives) and `23 % 5` is 3 (the leftover). Each `print` makes its own line.",
          "`print(grain // sack)` and then `print(grain ___ sack)`.",
        ],
        advice: "Two lines: the full sacks, then the loose kilos.",
        codex: ["math"],
      };
    },
  },
  {
    id: "tv-bill",
    topics: ["tavern"],
    difficulty: 1,
    make(r): Spec {
      const [buyer, other] = r.sample(PEOPLE, 2);
      const [crop, crop2] = r.sample(CROPS, 2);
      const bunches = r.int(3, 12);
      const price = r.int(2, 9);
      if (r.chance(0.5))
        return {
          title: "Chalking the Bill",
          topic: "f-strings",
          task: [
            "Wren chalks up what each neighbour owes for vegetables from her stall.",
            "`bunches` is how many bunches they took, and `price` is the coins for one bunch.",
            "Print one sentence in the shape `<buyer> owes <total> coins for <bunches> <crop> bunches.`, with every `<...>` filled in from the starter's values (the total worked out by your program). Single spaces, and a full stop at the end.",
          ],
          data: { buyer, crop, bunches, price },
          plan: ["The total", "The sentence"],
          body: 'total = bunches * price\nprint(f"{buyer} owes {total} coins for {bunches} {crop} bunches.")',
          variants: [
            { data: { buyer: other, crop: crop2, bunches: 2, price: 7 }, note: "Another neighbour and another crop." },
            { data: { bunches: 10, price: 0 }, note: "Wren is giving them away today: the total is 0." },
            { data: { bunches: 13, price: 4 } },
          ],
          wrong: [
            'print(f"{buyer} owes {bunches + price} coins for {bunches} {crop} bunches.")',
            'print("{buyer} owes {bunches * price} coins for {bunches} {crop} bunches.")',
            'print(f"{buyer} owes {bunches * price} coins for {bunches} {crop} bunches")',
            'print(buyer + " owes " + bunches * price + " coins.")',
          ],
          hints: [
            "Work the total out first and keep it in a variable. Then build the sentence piece by piece, spaces and full stop included.",
            'An f-string fills values into a sentence: `f"{hens} hens lay {hens * 2} eggs."`. Values that belong together multiply with `*`.',
            '`total = bunches * price`, then `print(f"{buyer} owes {___} coins for {bunches} {crop} bunches.")`',
          ],
          advice: "Check the f before the quotes, the spaces and the full stop.",
          codex: ["fstrings"],
        };
      const paid = bunches * price + r.int(1, 15);
      return {
        title: "Counting the Change",
        topic: "f-strings",
        task: [
          "A neighbour pays Wren for vegetables from her stall and wants change.",
          "`bunches` is how many bunches they took, `price` is the coins for one bunch and `paid` is the coins they handed over.",
          "Print one sentence in the shape `<buyer> pays <paid> coins and gets <change> back.`, with every `<...>` filled in (the change worked out by your program). Single spaces, and a full stop at the end.",
        ],
        data: { buyer, bunches, price, paid },
        plan: ["The cost of the bunches", "The change", "The sentence"],
        body: 'change = paid - bunches * price\nprint(f"{buyer} pays {paid} coins and gets {change} back.")',
        variants: [
          { data: { buyer: other, bunches: 4, price: 5, paid: 20 }, note: "Paid exactly right: no change." },
          { data: { bunches: 1, price: 9, paid: 50 } },
          { data: { bunches: 12, price: 3, paid: 40 } },
        ],
        wrong: [
          'change = bunches * price - paid\nprint(f"{buyer} pays {paid} coins and gets {change} back.")',
          'change = paid - price\nprint(f"{buyer} pays {paid} coins and gets {change} back.")',
          'change = paid - bunches * price\nprint("{buyer} pays {paid} coins and gets {change} back.")',
        ],
        hints: [
          "First work out what the bunches cost altogether. The change is what is left of the coins after that.",
          'An f-string fills values into a sentence: `f"{hens} hens lay {hens * 2} eggs."`. Taking away is `-`.',
          '`change = paid - ___`, then `print(f"{buyer} pays {paid} coins and gets {change} back.")`',
        ],
        advice: "Check the sum, the f before the quotes and the full stop.",
        codex: ["fstrings"],
      };
    },
  },
  {
    id: "tv-label",
    topics: ["tavern"],
    difficulty: 2,
    make(r): Spec {
      const crop = r.pick(CROPS);
      const field = r.pick(FIELDS);
      const messy = (s: string) =>
        s
          .split("")
          .map((c) => (r.chance(0.5) ? c.toUpperCase() : c.toLowerCase()))
          .join("");
      const twist = r.pick(["tidy", "count", "dashes"] as const);
      if (twist === "dashes") {
        const label = messy(`${crop}-${field.replace(/ /g, "-")}`);
        return {
          title: "Dashes on the Crate",
          topic: "string methods",
          task: [
            "Pip scrawled a crate label in a hurry: dashes where the spaces should be, and capitals all over the place.",
            "Print the label tidied: every dash turned back into a space, and every word starting with a capital letter with the rest small.",
          ],
          data: { label },
          plan: ["Dashes back to spaces", "Fix the capitals"],
          body: 'print(label.replace("-", " ").title())',
          variants: [
            { data: { label: "rIVER-strip-SOUTH-end" } },
            { data: { label: "cAbbAGE" }, note: "No dashes at all on this one." },
            { data: { label: "OLD-well-BEANS" } },
          ],
          wrong: ["print(label.title())", 'print(label.replace("-", "").title())', 'print(label.replace("-", " ").upper())', 'print(label.replace("-", " "))'],
          hints: [
            "Two jobs, one after the other: put the spaces back, then fix the capitals.",
            '`"a+b".replace("+", " and ")` gives `a and b`; `"oAk dOOR".title()` gives `Oak Door`. Methods can follow each other: `x.lower().replace("o", "0")`.',
            '`print(label.replace(___, " ").title())`',
          ],
          advice: "Spaces between the words, a capital at the start of each.",
          codex: ["string-methods"],
        };
      }
      const label = " ".repeat(r.int(1, 3)) + messy(`${crop} from the ${field}`) + " ".repeat(r.int(1, 4));
      if (twist === "tidy")
        return {
          title: "A Tidy Label",
          topic: "string methods",
          task: [
            "A crate label came back from the market smudged: stray spaces at both ends, and capitals all over the place.",
            "Print the label tidied: no spaces before or after it, and every word starting with a capital letter with the rest small.",
          ],
          data: { label },
          plan: ["Clear the ends", "Fix the capitals"],
          body: "print(label.strip().title())",
          variants: [
            { data: { label: "   oNIoN by the OLD well  " } },
            { data: { label: "Leeks" }, note: "This one has no spaces at the ends at all." },
            { data: { label: "  sweet PEAS " } },
          ],
          wrong: ["print(label.title())", "print(label.strip().upper())", "print(label.strip())", "print(label.strip().lower())"],
          hints: [
            "Two jobs: clear the spaces off the ends, then fix the capitals.",
            '`"  oak door ".strip()` gives `oak door`, and `"oAk dOOR".title()` gives `Oak Door`. Methods can follow each other: `x.lower().upper()`.',
            "`print(label.strip().___())`",
          ],
          advice: "No spaces at the ends, a capital at the start of each word.",
          codex: ["string-methods"],
        };
      return {
        title: "Measuring the Label",
        topic: "len and strip",
        task: [
          "Wren is painting a crate label onto a board and wants to know how many letters wide the board must be.",
          "The label has stray spaces at its ends. Print how many characters it has once those are cleared off. Spaces between the words still count.",
        ],
        data: { label },
        plan: ["Clear the ends", "Count what is left"],
        body: "print(len(label.strip()))",
        variants: [
          { data: { label: "pumpkin" }, note: "No spaces at the ends here." },
          { data: { label: "    hill plot      " } },
          { data: { label: " mint by the gate " } },
        ],
        wrong: ["print(len(label))", "print(len(label) - 2)", 'print(len(label.strip().replace(" ", "")))'],
        hints: [
          "Clear the ends first, then count. The spaces inside the label stay.",
          '`len("oak door")` is 8 (the space counts), and `"  oak ".strip()` gives `oak`. A method\'s result can go straight into `len()`.',
          "`print(len(label.___()))`",
        ],
        advice: "One number: the characters left once the ends are clear.",
        codex: ["string-methods", "indexing"],
      };
    },
  },
  {
    id: "tv-code",
    topics: ["tavern"],
    difficulty: 2,
    make(r): Spec {
      const crop = r.pick(CROPS);
      const field = r.int(1, 12);
      const sacks = r.int(10, 60);
      const code = crop.slice(0, 3) + two(field) + two(sacks);
      const about = [
        "Bram chalks a code on every crate: three letters for the crop, then two digits for the field it came from, then two digits for how many sacks are inside.",
        "A crate of beans from field 9 holding 15 sacks reads `bea0915`.",
      ];
      const variants = [
        { data: { code: "lee1260" } },
        { data: { code: "oni0305" }, note: "Field 3, and just 5 sacks: zeros in front." },
        { data: { code: "bea1149" } },
      ];
      const twist = r.pick(["tag", "sacks", "next"] as const);
      if (twist === "tag")
        return {
          title: "The Crop Letters",
          topic: "slicing strings",
          task: [...about, "Print the crate's crop letters in capitals, and nothing else."],
          data: { code },
          plan: ["Cut out the crop letters", "Make them capitals"],
          body: "print(code[:3].upper())",
          variants,
          wrong: ["print(code[:3])", "print(code[:2].upper())", "print(code.upper())", "print(code[1:4].upper())"],
          hints: [
            "Which places in the code hold the crop letters? Counting starts at 0.",
            '`"lantern"[:4]` gives `lant`, the first four characters. `.upper()` makes a string shout.',
            "`print(code[:___].upper())`",
          ],
          advice: "Just the three crop letters, in capitals.",
          codex: ["indexing", "string-methods"],
        };
      if (twist === "sacks")
        return {
          title: "More Sacks",
          topic: "slicing and int()",
          task: [...about, "Odo is adding `extra` more sacks to the crate. Print how many sacks it will hold then, as a plain number."],
          data: { code, extra: r.int(2, 9) },
          plan: ["Cut out the sacks part", "Turn it into a number", "Add the extra"],
          body: "print(int(code[5:]) + extra)",
          variants: [...variants, { data: { code: "cab0720", extra: 10 } }],
          wrong: ["print(code[5:] + str(extra))", "print(int(code[4:]) + extra)", "print(int(code[-1]) + extra)", "print(int(code[3:5]) + extra)"],
          hints: [
            "The sacks are the last two characters. They are text, though, and text can't be added to a number.",
            '`"oak12"[3:]` gives `12` (from place 3 to the end), and `int("12")` turns it into the number 12.',
            "`print(int(code[___:]) + extra)`",
          ],
          advice: "One number: the sacks after Odo's extra ones go in.",
          codex: ["indexing", "types"],
        };
      return {
        title: "The Next Field",
        topic: "slicing and int()",
        task: [...about, "The crate is moving on to the next field along, the one numbered one higher. Print that field's number as a plain number, with no zero in front."],
        data: { code },
        plan: ["Cut out the field digits", "Turn them into a number", "One higher"],
        body: "print(int(code[3:5]) + 1)",
        variants,
        wrong: ['print(code[3:5] + "1")', "print(int(code[3:5]))", "print(int(code[2:4]) + 1)", "print(int(code[4]) + 1)"],
        hints: [
          "The field is the two digits right after the three letters. Which places are those, counting from 0?",
          '`"oak0712"[3:5]` gives `07`, and `int("07")` is the number 7, without the zero.',
          "`print(int(code[3:___]) + 1)`",
        ],
        advice: "One plain number: the next field's.",
        codex: ["indexing", "types"],
      };
    },
  },
];
