import type { Spec, Template } from "../build.ts";
import { py, tup } from "../build.ts";
import { CROPS, FIELDS, PEOPLE } from "../rng.ts";

// Apothecary: split / join, tuples, unpacking, sets, try / except / raise.

const L = (...lines: string[]) => lines.join("\n");
const HERBS = ["mint", "sage", "thyme", "rosemary", "chamomile", "lavender", "basil", "dill", "fennel", "marigold"];
const GARDENERS = ["Mirela", "Hazel", "Sable", "Bram", "Odo", "Ingrid"];

export const APOTHECARY: Template[] = [
  {
    id: "ap-words",
    topics: ["apothecary"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["pieces", "glue", "count"] as const);
      const who = r.pick(PEOPLE.filter((p) => p !== "Wren"));
      if (twist === "pieces") {
        const messy = (xs: string[]) => xs.map((c, i) => (i === 1 || (i > 1 && r.chance(0.5)) ? " ".repeat(r.int(1, 2)) : "") + c + (r.chance(0.4) ? " " : "")).join(",");
        const today = messy(r.sample(CROPS, r.int(3, 5)));
        const other = messy(r.sample(CROPS, 4));
        return {
          title: "The Crop List",
          topic: "split and strip",
          task: [
            `${who} left Wren a list of crops to bring in, with commas between them. The spacing is all over the place.`,
            "Print each crop on a line of its own, in the list's order, with no spaces before or after it.",
          ],
          data: { wanted: today },
          plan: ["Cut the list where the commas are", "Tidy each piece and print it"],
          body: L('for crop in wanted.split(","):', "    print(crop.strip())"),
          variants: [
            { data: { wanted: other } },
            { data: { wanted: "  pumpkin  " }, note: "Only one crop on the list, with spaces round it." },
            { data: { wanted: "mint,garlic,wheat" }, note: "No spaces at all this time." },
          ],
          wrong: [
            L('for crop in wanted.split(","):', "    print(crop)"),
            L("for crop in wanted.split():", "    print(crop)"),
            'print(wanted.split(","))',
            L('for crop in wanted.split(", "):', "    print(crop.strip())"),
          ],
          hints: [
            "Two jobs: cut the list where the commas are, then tidy each piece before it goes on the slate.",
            "`\"eggs ;  milk\".split(\";\")` gives `['eggs ', '  milk']`, and `\"  milk\".strip()` gives `'milk'`.",
            "`for crop in wanted.split(___):` and print each `crop.strip()`.",
          ],
          needs: [["\\.split\\(", "Cut the list into pieces: Wren swaps in other lists to try your program."]],
          advice: "One crop per line, and nothing else on the line.",
          codex: ["split-join"],
        };
      }
      if (twist === "glue") {
        const [sep, said] = r.pick([
          [" / ", "a slash with a space on each side"],
          [", ", "a comma and a space"],
          [" - ", "a dash with a space on each side"],
          [" + ", "a plus sign with a space on each side"],
        ] as const);
        return {
          title: "Chalk on the Board",
          topic: "join",
          task: [
            "Wren chalks today's crops on the board by the field, all on one line.",
            `Print the crops in the list's order, with ${said} between each crop and the next, and nothing before the first or after the last.`,
          ],
          data: { crops: r.sample(CROPS, r.int(3, 5)) },
          plan: ["Glue the crops into one line", "Print it"],
          body: `print("${sep}".join(crops))`,
          variants: [
            { data: { crops: r.sample(CROPS, 4) } },
            { data: { crops: ["pumpkin"] }, note: "Only one crop: nothing goes between." },
            { data: { crops: ["mint", "garlic"] }, note: "Two crops: the glue goes in once." },
          ],
          wrong: [
            "print(crops)",
            L('line = ""', "for crop in crops:", `    line += crop + "${sep}"`, "print(line)"),
            `print("${sep.trim()}".join(crops))`,
            L("for crop in crops:", "    print(crop)"),
          ],
          hints: [
            "Building the line by hand leaves a spare piece of glue at one end. There's a tool that only puts the glue between items.",
            "`\"-\".join([\"a\", \"b\", \"c\"])` gives `a-b-c`: the glue goes in front of the dot, the list goes in the brackets.",
            "`print(___.join(crops))`",
          ],
          needs: [["\\.join\\(", "This one is practice for gluing a list into one string in one go."]],
          advice: "One line, with the glue only between the crops.",
          codex: ["split-join"],
        };
      }
      const crop = r.pick(CROPS);
      const field = r.pick(FIELDS);
      const text = r.pick([
        `${who} says the ${crop} in the ${field} is ready`,
        `the ${crop} by the ${field} needs water before the rain`,
        `please leave two sacks of ${crop} at the mill for ${who}`,
        `${who} saw a heron in the ${field} again`,
      ]);
      const message = text
        .split(" ")
        .map((w, i) => (i === 0 ? "" : " ".repeat(i === 2 ? 2 : r.int(1, 3))) + w)
        .join("");
      return {
        title: "Words on the Slate",
        topic: "split",
        task: [`${who} left a message on Wren's slate. Some of the gaps between words are wider than others.`, "Print how many words the message has, as one number."],
        data: { message },
        plan: ["Cut the message into words", "Count them"],
        body: "print(len(message.split()))",
        variants: [
          { data: { message: "  the   geese  are   loose  " }, note: "Spaces before, after and in between." },
          { data: { message: "rain" }, note: "A single word." },
          { data: { message: "" }, note: "An empty slate: no words at all." },
        ],
        wrong: ['print(len(message.split(" ")))', "print(len(message))", 'print(message.count(" ") + 1)'],
        hints: [
          "A word is whatever sits between gaps, however wide the gap is. Count the pieces, not the spaces.",
          "`\"hay   and  oats\".split()` gives `['hay', 'and', 'oats']`: with nothing in the brackets it cuts at any run of spaces. `len()` counts a list.",
          "`print(len(message.___()))`",
        ],
        needs: [["\\.split\\(", "Cut the message into words and let Python count them."]],
        advice: "One number: how many words.",
        codex: ["split-join"],
      };
    },
  },
  {
    id: "ap-pairs",
    topics: ["apothecary"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["total", "most", "pair"] as const);
      const names = r.sample(PEOPLE, r.int(4, 5));
      const kg = names.map(() => r.int(3, 40));
      const glue = r.pick([", ", ",", " , "]);
      const log = names.map((n, i) => `${n} ${kg[i]}`).join(glue);
      if (twist === "total")
        return {
          title: "The Morning Weigh-In",
          topic: "numbers from text",
          task: [
            "Wren wrote down the morning's weigh-in as one line of text: each entry is a name, a space, then the kilos, with commas between the entries.",
            "Print how many kilos came in altogether, as one number.",
          ],
          data: { log },
          plan: ["Cut the line into entries", "Cut each entry into a name and its kilos", "Add up the kilos"],
          body: L("total = 0", 'for entry in log.split(","):', "    name, kilos = entry.split()", "    total += int(kilos)", "print(total)"),
          variants: [
            { data: { log: "Rook 9, Pip 14, Odo 0" }, note: "Odo brought nothing today." },
            { data: { log: "Sable 27" }, note: "Only one entry." },
            { data: { log: "Tock 5,Hazel 12 , Bram 30" }, note: "The spacing round the commas is uneven." },
          ],
          wrong: [
            L("total = 0", 'for entry in log.split(","):', "    name, kilos = entry.split()", "total += int(kilos)", "print(total)"),
            'print(len(log.split(",")))',
            L('name, kilos = log.split(",")[0].split()', "print(int(kilos))"),
          ],
          hints: [
            "Two cuts: first into entries, then each entry into its name and its number. The number is still text until you turn it into one.",
            "`beast, legs = \"ox 4\".split()` names both pieces of `\"ox 4\"`, and `int(legs)` makes the 4 a number you can add.",
            "`for entry in log.split(\",\"):`, then `name, kilos = entry.split()` and `total += ___`.",
          ],
          needs: [["\\.split\\(", "Cut the line into pieces: Wren swaps in other weigh-ins."]],
          advice: "One number: all the kilos added up.",
          codex: ["parsing", "unpacking"],
        };
      if (twist === "most")
        return {
          title: "Biggest Load",
          topic: "numbers from text",
          task: [
            "Wren wrote down the morning's weigh-in as one line of text: each entry is a name, a space, then the kilos, with commas between the entries.",
            "Print the name of whoever brought the most kilos, and nothing else.",
            "If two tie for the most, the one written first wins.",
          ],
          data: { log },
          plan: ["Walk the entries", "Keep the biggest weight so far, and whose it was"],
          body: L('best = ""', "most = -1", 'for entry in log.split(","):', "    name, kilos = entry.split()", "    if int(kilos) > most:", "        most = int(kilos)", "        best = name", "print(best)"),
          variants: [
            { data: { log: "Rook 9, Pip 14, Odo 14" }, note: "Pip and Odo tie: the one written first wins." },
            { data: { log: "Hazel 9, Bram 12" }, note: "9 against 12: compare them as numbers, not as text." },
            { data: { log: "Tock 3, Sable 5, Ingrid 21" }, note: "The heaviest is written last." },
          ],
          wrong: [
            L('best = ""', "most = -1", 'for entry in log.split(","):', "    name, kilos = entry.split()", "    if int(kilos) >= most:", "        most = int(kilos)", "        best = name", "print(best)"),
            L('best = ""', 'most = ""', 'for entry in log.split(","):', "    name, kilos = entry.split()", "    if kilos > most:", "        most = kilos", "        best = name", "print(best)"),
            L("most = -1", 'for entry in log.split(","):', "    name, kilos = entry.split()", "    if int(kilos) > most:", "        most = int(kilos)", "print(most)"),
          ],
          hints: [
            "Walk the entries keeping two things in mind: the biggest weight so far, and whose it was. Only a strictly bigger weight changes your mind.",
            "Compared as text, `\"9\" > \"12\"` is True, because text is compared letter by letter. `int(\"9\") > int(\"12\")` is False.",
            "Inside the loop: `name, kilos = entry.split()`, and when `int(kilos) ___ most`, remember both the weight and the name.",
          ],
          needs: [["\\.split\\(", "Cut the line into pieces: Wren swaps in other weigh-ins."]],
          advice: "Just the name, nothing else on the line.",
          codex: ["parsing", "unpacking"],
        };
      const call = (xs: unknown) => `low, high = lightest_and_heaviest(${xs})\nprint(low)\nprint(high)`;
      return {
        title: "Both Ends of the Scale",
        topic: "returning two values",
        task: [
          "Wren keeps the day's sacks as a list of pairs: a name, then the kilos.",
          "Write a function `lightest_and_heaviest(sacks)` that is given such a list and hands back two values: the name with the lightest sack, then the name with the heaviest.",
          "If two sacks tie, the one earlier in the list counts. The list always has at least one sack.",
        ],
        data: { sacks: names.map((n, i) => tup(n, kg[i])) },
        plan: ["Your function goes here"],
        body: L(
          "def lightest_and_heaviest(sacks):",
          "    low_name, low = sacks[0]",
          "    high_name, high = sacks[0]",
          "    for name, kilos in sacks:",
          "        if kilos < low:",
          "            low_name, low = name, kilos",
          "        if kilos > high:",
          "            high_name, high = name, kilos",
          "    return low_name, high_name",
        ),
        drive: call("sacks"),
        variants: [
          { drive: call(py([tup("Rook", 9), tup("Pip", 4), tup("Odo", 4), tup("Hazel", 20), tup("Tock", 20)])), note: "Two ties: the earlier name wins both." },
          { drive: call(py([tup("Sable", 12)])), note: "One sack is both the lightest and the heaviest." },
          { drive: call(py([tup("Ingrid", 33), tup("Marlo", 18), tup("Bram", 7)])), note: "The heaviest comes first, the lightest last." },
        ],
        wrong: [
          L(
            "def lightest_and_heaviest(sacks):",
            "    low_name, low = sacks[0]",
            "    high_name, high = sacks[0]",
            "    for name, kilos in sacks:",
            "        if kilos < low:",
            "            low_name, low = name, kilos",
            "        if kilos > high:",
            "            high_name, high = name, kilos",
            "    return high_name, low_name",
          ),
          L(
            "def lightest_and_heaviest(sacks):",
            "    low_name, low = sacks[0]",
            "    high_name, high = sacks[0]",
            "    for name, kilos in sacks:",
            "        if kilos <= low:",
            "            low_name, low = name, kilos",
            "        if kilos >= high:",
            "            high_name, high = name, kilos",
            "    return low_name, high_name",
          ),
          L(
            "def lightest_and_heaviest(sacks):",
            "    low_name, low = sacks[0]",
            "    high_name, high = sacks[0]",
            "    for name, kilos in sacks:",
            "        if kilos < low:",
            "            low_name, low = name, kilos",
            "        if kilos > high:",
            "            high_name, high = name, kilos",
            "    print(low_name, high_name)",
          ),
          L(
            "def lightest_and_heaviest(sacks):",
            "    low_name, low = sacks[0]",
            "    high_name, high = sacks[0]",
            "    for name, kilos in sacks:",
            "        if kilos < low:",
            "            low_name, low = name, kilos",
            "        if kilos > high:",
            "            high_name, high = name, kilos",
            "    return low, high",
          ),
        ],
        hints: [
          "Keep two running answers as you walk the list, one for each end. Hand both back together at the very end.",
          "`for hen, eggs in coop:` unpacks each pair as it comes; `return fewest, most` hands back two values, and `a, b = count_eggs(coop)` catches them.",
          "Start both answers from `sacks[0]`, update them inside `for name, kilos in sacks:`, and finish with `return low_name, ___`.",
        ],
        needs: [["def\\s+lightest_and_heaviest\\s*\\(", "Wren asks for a function named lightest_and_heaviest."]],
        advice: "Hand back two names with return: the lightest first.",
        codex: ["unpacking", "tuples"],
      };
    },
  },
  {
    id: "ap-sets",
    topics: ["apothecary"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["both", "only", "count", "visitors"] as const);
      if (twist === "visitors") {
        const folk = r.sample(PEOPLE.filter((p) => p !== "Mirela"), r.int(3, 4));
        const visitors = r.shuffle([...folk, r.pick(folk), r.pick(folk)]);
        return {
          title: "Who Came By",
          topic: "sets: add, in, len",
          task: [
            "Mirela keeps a list of everyone who came by the herb garden today, in the order they came. Some came more than once.",
            "Print each visitor's name the first time they turn up in the list, one per line. Then, on a last line, print how many different visitors there were.",
          ],
          data: { visitors },
          plan: ["Remember who you've already seen", "Print each name only the first time", "How many different visitors"],
          body: L("seen = set()", "for name in visitors:", "    if name not in seen:", "        print(name)", "        seen.add(name)", "print(len(seen))"),
          variants: [
            { data: { visitors: ["Pip", "Pip", "Pip"] }, note: "Only Pip, three times over." },
            { data: { visitors: ["Odo", "Hazel", "Rook", "Hazel", "Odo"] } },
            { data: { visitors: [] }, note: "Nobody came by today." },
          ],
          wrong: [
            L("for name in visitors:", "    print(name)", "print(len(set(visitors)))"),
            L("seen = set()", "for name in visitors:", "    if name not in seen:", "        print(name)", "        seen.add(name)", "print(len(visitors))"),
            L("seen = set()", "for name in visitors:", "    if name in seen:", "        print(name)", "    seen.add(name)", "print(len(seen))"),
          ],
          hints: [
            "Keep a bag of names you've already met. Before printing a name, ask whether it's in the bag yet.",
            "`met = set()` makes an empty set; `met.add(\"fox\")` puts a fox in it; `\"fox\" in met` asks; `len(met)` counts, and adding a fox twice still counts one.",
            "Start with `seen = set()`; inside the loop, `if name not in seen:` print it and `seen.___(name)`.",
          ],
          needs: [["set\\(", "Keep the names you've met in a set."]],
          advice: "Each name once, in the order they first came, then the count.",
          codex: ["sets"],
        };
      }
      const [a, b] = r.sample(GARDENERS, 2);
      const ka = `${a.toLowerCase()}_herbs`;
      const kb = `${b.toLowerCase()}_herbs`;
      const pool = r.shuffle(HERBS);
      const both = pool.slice(0, 2);
      const onlyA = pool.slice(2, 2 + r.int(1, 2));
      const onlyB = pool.slice(4, 4 + r.int(1, 2));
      const listA = r.shuffle([...both, ...onlyA, r.pick(both)]);
      const listB = r.shuffle([...both, ...onlyB]);
      const intro = `${a} and ${b} each wrote down the herbs in their beds. A herb in several beds is on the list more than once.`;
      const v = (x: string[], y: string[]) => ({ [ka]: x, [kb]: y });
      if (twist === "both")
        return {
          title: "Grown in Both",
          topic: "sets: what's in both",
          task: [intro, "Print every herb that grows in both gardens, once each, in alphabetical order, one per line."],
          data: v(listA, listB),
          plan: ["What's in both gardens", "Each once, in order"],
          body: L(`for herb in sorted(set(${ka}) & set(${kb})):`, "    print(herb)"),
          variants: [
            { data: v(["sage", "mint", "sage", "dill"], ["sage", "mint", "mint"]), note: "Sage and mint are each listed more than once." },
            { data: v(["dill", "basil"], ["mint", "fennel"]), note: "Nothing grows in both: print nothing." },
            { data: v(["thyme"], ["thyme", "lavender", "basil"]) },
          ],
          wrong: [
            L(`for herb in sorted(set(${ka}) | set(${kb})):`, "    print(herb)"),
            L(`for herb in sorted(set(${ka}) - set(${kb})):`, "    print(herb)"),
            L(`for herb in ${ka}:`, `    if herb in ${kb}:`, "        print(herb)"),
          ],
          hints: [
            "Lists can repeat and keep their order; the question is only which herbs are shared. A tool that forgets repeats makes it easy.",
            "`set([\"plum\", \"fig\", \"plum\"])` keeps one plum. `{\"plum\", \"fig\"} & {\"fig\", \"pear\"}` is `{'fig'}`, what's in both, and `sorted()` puts a set in order as a list.",
            `\`for herb in sorted(set(${ka}) ___ set(${kb})):\` and print each herb.`,
          ],
          needs: [["set\\(", "This one is practice for sets: let them do the comparing."]],
          advice: "One herb per line, alphabetical, each only once.",
          codex: ["set-ops", "sets"],
        };
      if (twist === "only")
        return {
          title: "Only in One Garden",
          topic: "sets: what's missing",
          task: [intro, `Print every herb in ${a}'s garden that ${b} doesn't grow, once each, in alphabetical order, one per line.`],
          data: v(listA, listB),
          plan: [`What ${a} grows and ${b} doesn't`, "Each once, in order"],
          body: L(`for herb in sorted(set(${ka}) - set(${kb})):`, "    print(herb)"),
          variants: [
            { data: v(["sage", "dill", "sage", "basil", "mint"], ["mint"]), note: "Sage is listed twice." },
            { data: v(["thyme", "mint"], ["mint", "thyme", "dill"]), note: `${b} grows everything ${a} does: print nothing.` },
            { data: v(["fennel", "lavender"], []), note: `${b}'s list is empty.` },
          ],
          wrong: [
            L(`for herb in sorted(set(${kb}) - set(${ka})):`, "    print(herb)"),
            L(`for herb in sorted(set(${ka}) & set(${kb})):`, "    print(herb)"),
            L(`for herb in ${ka}:`, `    if herb not in ${kb}:`, "        print(herb)"),
          ],
          hints: [
            `Start from ${a}'s herbs and take away anything ${b} grows. Which garden comes first matters.`,
            "`{\"plum\", \"fig\", \"pear\"} - {\"fig\"}` is `{'plum', 'pear'}`: what's in the first and not the second. `set()` turns a list into a set, and `sorted()` puts a set in order.",
            `\`for herb in sorted(set(${ka}) ___ set(${kb})):\` and print each herb.`,
          ],
          needs: [["set\\(", "This one is practice for sets: let them do the comparing."]],
          advice: "One herb per line, alphabetical, each only once.",
          codex: ["set-ops", "sets"],
        };
      return {
        title: "Herbs in the Valley",
        topic: "sets: everything in either",
        task: [intro, "Print how many different herbs grow across the two gardens together, as one number."],
        data: v(listA, listB),
        plan: ["Every herb from either garden, once", "How many"],
        body: `print(len(set(${ka}) | set(${kb})))`,
        variants: [
          { data: v(["sage", "mint", "sage"], ["mint", "sage", "mint"]), note: "Both gardens grow the same two herbs." },
          { data: v(["dill", "basil", "fennel"], []), note: `${b}'s list is empty.` },
          { data: v(["thyme", "dill"], ["mint", "lavender", "thyme"]) },
        ],
        wrong: [`print(len(${ka}) + len(${kb}))`, `print(len(set(${ka})) + len(set(${kb})))`, `print(len(set(${ka}) & set(${kb})))`],
        hints: [
          "A herb counts once however many beds it's in, and however many gardens it's in.",
          "`{\"plum\", \"fig\"} | {\"fig\", \"pear\"}` is `{'plum', 'fig', 'pear'}`: everything in either, each once. `len()` counts a set.",
          `\`print(len(set(${ka}) ___ set(${kb})))\``,
        ],
        needs: [["set\\(", "This one is practice for sets: let them do the counting."]],
        advice: "One number: how many different herbs.",
        codex: ["set-ops", "sets"],
      };
    },
  },
  {
    id: "ap-tally",
    topics: ["apothecary"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["slips", "shares"] as const);
      if (twist === "slips") {
        const c = r.sample(CROPS, 3);
        const good = [`${c[0]} ${r.int(2, 9)}`, `${c[1]} ${r.int(2, 9)}`, `${c[0]} ${r.int(2, 9)}`, `${c[2]} ${r.int(10, 20)}`];
        const bad = r.sample([`${c[1]} lots`, `${c[2]}`, `${c[0]} 3 4`, `${c[1]} 2.5`, "??"], 2);
        const slips = [...r.shuffle([...good, ...bad]), r.pick(["", "   "])];
        const at = r.int(1, slips.length - 1);
        slips.splice(at, 0, slips.pop()!);
        const tally = L(
          "sacks = {}",
          "bad = 0",
          "for slip in slips:",
          "    if not slip.strip():",
          "        continue",
          "    try:",
          "        crop, count = slip.split()",
          "        count = int(count)",
          "    except ValueError:",
          "        bad += 1",
          "    else:",
          "        sacks[crop] = sacks.get(crop, 0) + count",
        );
        const show = L("for crop, count in sacks.items():", '    print(f"{crop}: {count}")', "print(bad)");
        return {
          title: "Smudged Slips",
          topic: "keeping good lines, counting bad ones",
          task: [
            "The rain got at Wren's harvest slips. A readable slip is a crop and a whole number of sacks, with a space between.",
            "Print one line per crop, in the order the crops first turn up on readable slips: the crop, a colon and a space, then its sacks added up.",
            "Then one more line: how many slips couldn't be read, as a plain number.",
            "Blank slips (empty, or only spaces) are just gaps: skip them, and don't count them as unreadable. One bad slip mustn't stop the rest being read.",
          ],
          data: { slips },
          plan: ["Skip the blank slips", "Try to read each slip; count the ones that fail", "Add up each crop's sacks", "Print the crops, then the count"],
          body: tally + "\n" + show,
          variants: [
            { data: { slips: ["mint 4", "", "mint x", "mint 3"] }, note: "One crop on two good slips, a blank slip and a smudge." },
            { data: { slips: ["??", "carrot", "   ", "wheat 1 2"] }, note: "Nothing readable at all: only the count of bad slips." },
            { data: { slips: [] }, note: "No slips today." },
          ],
          wrong: [
            L(
              "sacks = {}",
              "bad = 0",
              "for slip in slips:",
              "    try:",
              "        crop, count = slip.split()",
              "        count = int(count)",
              "    except ValueError:",
              "        bad += 1",
              "    else:",
              "        sacks[crop] = sacks.get(crop, 0) + count",
            ) +
              "\n" +
              show,
            L(
              "sacks = {}",
              "bad = 0",
              "try:",
              "    for slip in slips:",
              "        if not slip.strip():",
              "            continue",
              "        crop, count = slip.split()",
              "        sacks[crop] = sacks.get(crop, 0) + int(count)",
              "except ValueError:",
              "    bad += 1",
            ) +
              "\n" +
              show,
            tally.replace("sacks[crop] = sacks.get(crop, 0) + count", "sacks[crop] = count") + "\n" + show,
          ],
          hints: [
            "Three kinds of slip: blank (skip it), readable (add it up), smudged (count it). Let Python try each one, so a smudge only spoils its own slip.",
            "`try:` then `a, b = \"oat 2 2\".split()` fails with a ValueError (three pieces into two names), and so does `int(\"two\")`; `except ValueError:` catches either, and `else:` runs only when nothing failed.",
            "Inside the loop: `try:` `crop, count = slip.split()` and `count = int(count)`, `except ValueError:` add one to `bad`, `else:` add `count` to `sacks[___]`.",
          ],
          needs: [["\\btry\\b", "This one is practice for try and except: let Python try each slip."]],
          advice: "First the crops, one line each, then the number of bad slips.",
          codex: ["try-except", "unpacking", "parsing"],
        };
      }
      const c = r.sample(CROPS, 4);
      const harvest: Record<string, number> = { [c[0]]: r.int(10, 40), [c[1]]: r.int(10, 40), [c[2]]: r.int(10, 40) };
      const shares = r.shuffle([`${c[0]} ${r.int(2, 5)}`, `${c[1]} ${r.int(2, 5)}`, `${c[3]} ${r.int(2, 4)}`, `${c[2]} ${r.pick(["lots", "two", "some"])}`, `${c[r.int(0, 2)]} 0`]);
      const loop = (...inner: string[]) => L("for line in shares:", "    crop, helpers = line.split()", ...inner);
      const tryEach = "    try:\n        each = harvest[crop] // int(helpers)";
      const notGrown = '    except KeyError:\n        print(f"{crop}: not grown")';
      const badNumber = '    except ValueError:\n        print(f"{crop}: bad number")';
      const noHelpers = '    except ZeroDivisionError:\n        print(f"{crop}: no helpers")';
      const fine = '    else:\n        print(f"{crop}: {each} each")';
      return {
        title: "Sharing the Sacks",
        topic: "several excepts and else",
        task: [
          "Wren shares out each crop's sacks among helpers. Each line in `shares` is a crop, a space, then how many helpers.",
          "Print one line per share, in order, starting with the crop, a colon and a space. After that:",
          "if all is well, how many whole sacks each helper gets, a space, and the word `each` (Wren keeps any left over);",
          "if the crop isn't in the harvest, the words `not grown`; if the helpers aren't a whole number, the words `bad number`; if there are no helpers, the words `no helpers`.",
        ],
        data: { harvest, shares },
        plan: ["For each share: try the sharing", "One answer for each kind of trouble", "And one for when it all worked"],
        body: loop(tryEach, notGrown, badNumber, noHelpers, fine),
        variants: [
          { data: { harvest: { wheat: 12, mint: 7 }, shares: ["wheat 4", "mint 2", "wheat 5"] }, note: "Every share works out." },
          { data: { harvest: { wheat: 12 }, shares: ["wheat 0", "plum 3", "wheat x", "wheat 1"] }, note: "One of each kind of trouble, then a fine one." },
          { data: { harvest: { carrot: 3 }, shares: ["carrot 4"] }, note: "Fewer sacks than helpers: nobody gets a whole sack." },
        ],
        wrong: [
          loop(tryEach.replace("//", "/"), notGrown, badNumber, noHelpers, fine),
          loop(tryEach, notGrown, badNumber, fine),
          loop(tryEach, notGrown.replace("not grown", "bad number"), badNumber.replace("bad number", "not grown"), noHelpers, fine),
        ],
        hints: [
          "Three different things can go wrong on a line, and each has its own name in Python. Try the sharing, then answer each kind of trouble in its own way.",
          "One `try:` can have several `except` blocks: `except KeyError:` for a missing key, `except ValueError:` for `int(\"lots\")`, `except ZeroDivisionError:` for dividing by 0. Only the first that matches runs, and `else:` runs when none did.",
          "`try:` `each = harvest[crop] // int(helpers)`, then one `except` for each of `KeyError`, `ValueError` and `___`, and an `else:` that prints the share.",
        ],
        needs: [
          ["\\btry\\b", "This one is practice for try and except: let Python try each share."],
          ["except\\s+KeyError", "Let a missing crop be caught as the KeyError it is."],
        ],
        advice: "One line per share: the crop, a colon and a space, then the answer.",
        codex: ["try-except"],
      };
    },
  },
  {
    id: "ap-raise",
    topics: ["apothecary"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["sack", "share"] as const);
      if (twist === "sack") {
        const most = r.int(4, 6) * 10;
        const [c1, c2, c3, c4, c5] = r.sample(CROPS, 5);
        const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
        const tries = (good: string, xs: string[]) =>
          L(
            `crop, kilos = read_sack(${JSON.stringify(good)})`,
            "print(crop, kilos)",
            `for text in ${py(xs)}:`,
            "    try:",
            "        read_sack(text)",
            "    except ValueError:",
            '        print("refused:", text)',
            "    else:",
            '        print("taken:", text)',
          );
        const good = (body: string[]) => L("def read_sack(text):", ...body);
        const rules = (lt: string, ret: string) => [
          "    pieces = text.split()",
          "    if len(pieces) != 2:",
          '        raise ValueError("a sack is a crop and a number: " + text)',
          "    crop, kilos = pieces",
          "    kilos = int(kilos)",
          `    if ${lt}:`,
          '        raise ValueError(f"no sack weighs {kilos} kilos")',
          ret,
        ];
        return {
          title: "Reading a Sack Label",
          topic: "raise",
          task: [
            `Every sack at the mill has a label: a crop, a space, then its kilos. Wren's sacks hold at least 1 kilo and at most ${most}.`,
            "Write a function `read_sack(text)` that is given a label and hands back two values: the crop's name in lowercase, and the kilos as a whole number.",
            "If the label isn't exactly a crop and a whole number, or the kilos are outside what a sack can hold, raise a ValueError (the message is up to you).",
          ],
          plan: ["Your function goes here"],
          body: good(rules(`kilos < 1 or kilos > ${most}`, "    return crop.lower(), kilos")),
          drive: tries(`${cap(c1)} 12`, [`${c2} 0`, `${c3}`, `${c4} ${most}`, `${c5} ${most + 1}`, `${c2} lots`]),
          variants: [
            { drive: tries(`MINT 1`, [`garlic 1`, `wheat -4`, `carrot 2 3`, `pumpkin 7`]), note: "1 kilo is the lightest a sack can be; -4 kilos isn't a sack." },
            { drive: tries(`potato ${most}`, [`cabbage ${most - 1}`, `potato ${most + 1}`, "", `${c1} 2.5`]), note: `Exactly ${most} is fine; an empty label, or half a kilo, is not.` },
          ],
          wrong: [
            good(rules(`kilos < 0 or kilos > ${most}`, "    return crop.lower(), kilos")),
            good(rules(`kilos < 1 or kilos >= ${most}`, "    return crop.lower(), kilos")),
            good(rules(`kilos < 1 or kilos > ${most}`, "    return crop, kilos")),
            L(
              "def read_sack(text):",
              "    pieces = text.split()",
              "    if len(pieces) != 2:",
              '        return "bad label", 0',
              "    crop, kilos = pieces",
              "    kilos = int(kilos)",
              `    if kilos < 1 or kilos > ${most}:`,
              '        return "bad label", 0',
              "    return crop.lower(), kilos",
            ),
          ],
          hints: [
            "Three ways a label can be wrong: the wrong number of pieces, a number that isn't whole, a weight no sack can have. Each one should stop the function loudly, not hand back an answer.",
            "`raise ValueError(\"no such hive\")` stops a function and hands the trouble to whoever called it. `int(\"lots\")` already raises a ValueError of its own, and `return name, size` hands back two values.",
            `After cutting the label up and turning the kilos into a number: \`if kilos < 1 or kilos > ${most}:\` then \`___ ValueError(...)\`, and at the end \`return crop.lower(), kilos\`.`,
          ],
          needs: [
            ["def\\s+read_sack\\s*\\(", "Wren asks for a function named read_sack."],
            ["\\braise\\b", "Turn a bad label away by raising a ValueError."],
          ],
          advice: "Hand back the lowercase crop and the kilos; raise a ValueError for a bad label.",
          codex: ["raise", "unpacking", "parsing"],
        };
      }
      const kilos = r.int(17, 45);
      const helpers = r.int(3, 6);
      const tries = (k: number, h: number, xs: [number, number][]) =>
        L(
          `each, left = share(${k}, ${h})`,
          "print(each, left)",
          `for kilos, helpers in ${py(xs.map(([a, b]) => tup(a, b)))}:`,
          "    try:",
          "        each, left = share(kilos, helpers)",
          "    except ValueError:",
          '        print("refused:", kilos, helpers)',
          "    else:",
          "        print(each, left)",
        );
      const fn = (helperCheck: string, ret: string, refuse = "raise ValueError") =>
        L(
          "def share(kilos, helpers):",
          `    if ${helperCheck}:`,
          `        ${refuse}("nobody to share with")`.replace('return("nobody to share with")', "return"),
          "    if kilos < 0:",
          `        ${refuse}("kilos can't be negative")`.replace("return(\"kilos can't be negative\")", "return"),
          `    return ${ret}`,
        );
      return {
        title: "Fair Shares",
        topic: "raise",
        task: [
          "Wren splits a pile of kilos fairly among helpers: everyone gets the same whole number of kilos, and whatever can't be shared stays behind.",
          "Write a function `share(kilos, helpers)` that hands back two values: how many kilos each helper gets, then how many are left over.",
          "If there's nobody to share with (fewer than 1 helper), or the kilos are below zero, raise a ValueError (the message is up to you).",
        ],
        plan: ["Your function goes here"],
        body: fn("helpers < 1", "kilos // helpers, kilos % helpers"),
        drive: tries(kilos, helpers, [
          [10, 0],
          [-3, 2],
          [0, 4],
          [9, 1],
        ]),
        variants: [
          { drive: tries(20, 5, [[7, -1], [5, 9], [12, 3]]), note: "20 shares exactly; 5 kilos among 9 helpers gives nobody a whole kilo." },
          { drive: tries(1, 1, [[-1, -1], [30, 7]]), note: "One kilo, one helper." },
        ],
        wrong: [
          fn("helpers < 0", "kilos // helpers, kilos % helpers"),
          fn("helpers < 1", "kilos % helpers, kilos // helpers"),
          fn("helpers < 1", "kilos // helpers, kilos % helpers", "return"),
          fn("helpers <= 1", "kilos // helpers, kilos % helpers"),
        ],
        hints: [
          "Work one out on paper: 17 kilos among 5 helpers. How many each, and how many stay behind? Then: what should happen with 0 helpers?",
          "`23 // 4` is 5 and `23 % 4` is 3. `raise ValueError(\"no cups\")` stops a function and hands the trouble back to the caller, and `return a, b` hands back two values.",
          "`if helpers < 1:` then `raise ValueError(...)`, the same for negative kilos, and at the end `return kilos // helpers, ___`.",
        ],
        needs: [
          ["def\\s+share\\s*\\(", "Wren asks for a function named share."],
          ["\\braise\\b", "Turn an impossible share away by raising a ValueError."],
        ],
        advice: "Hand back two numbers: each helper's kilos, then the leftover.",
        codex: ["raise", "unpacking"],
      };
    },
  },
  {
    id: "ap-ledger",
    topics: ["library", "apothecary"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["totals", "biggest"] as const);
      const c = r.sample(CROPS, 3);
      const entries = r.shuffle([`${c[0]}:${r.int(2, 15)}`, `${c[1]}:${r.int(2, 15)}`, `${c[2]}:${r.int(2, 15)}`, `${c[0]}:${r.int(2, 15)}`]);
      const ledger = entries.join(r.pick([", ", ","]));
      const add = L("totals = {}", 'for entry in ledger.split(","):', '    crop, amount = entry.strip().split(":")', "    totals[crop] = totals.get(crop, 0) + int(amount)");
      const task0 = "Wren's ledger is one line of text: entries with commas between them, each a crop, a colon, then sacks. A crop can turn up in more than one entry.";
      if (twist === "totals") {
        const show = L("for crop, amount in totals.items():", '    print(f"{crop}: {amount}")');
        return {
          title: "The Ledger Line",
          topic: "parsing into a dictionary",
          task: [task0, "Print one line per crop, in the order each crop first appears: the crop, a colon and a space, then all its sacks added up."],
          data: { ledger },
          plan: ["Cut the ledger into entries", "Cut each entry into crop and sacks", "Add each crop's sacks up", "Print them"],
          body: add + "\n" + show,
          variants: [
            { data: { ledger: "wheat:4, mint:2, wheat:6, wheat:1" }, note: "Wheat turns up three times." },
            { data: { ledger: "pumpkin:9" }, note: "A single entry." },
            { data: { ledger: "garlic:3,carrot:0, garlic:12" }, note: "No spaces after some commas, and a crop with nothing." },
          ],
          wrong: [
            add.replace("entry.strip().split", "entry.split") + "\n" + show,
            add.replace("totals.get(crop, 0) + int(amount)", "int(amount)") + "\n" + show,
            L('for entry in ledger.split(","):', '    crop, amount = entry.strip().split(":")', '    print(f"{crop}: {amount}")'),
          ],
          hints: [
            "Two cuts again, first at the commas, then at the colon, and a dictionary to add up into. Mind the spaces after the commas.",
            "`fruit, n = \"fig:3\".split(\":\")` gives `\"fig\"` and `\"3\"`; `basket[fruit] = basket.get(fruit, 0) + int(n)` adds to a tally whether or not the fruit is in it yet.",
            "`crop, amount = entry.strip().split(\":\")` and then `totals[crop] = totals.get(crop, 0) + ___`.",
          ],
          needs: [["\\.split\\(", "Cut the ledger into pieces: Wren swaps in other ledgers."]],
          advice: "One line per crop: the crop, a colon and a space, then its total.",
          codex: ["parsing", "counting"],
        };
      }
      const pickBest = L('best = ""', "most = -1", "for crop, amount in totals.items():", "    if amount > most:", "        most = amount", "        best = crop", "print(best)");
      return {
        title: "The Biggest Crop",
        topic: "parsing into a dictionary",
        task: [task0, "Print the crop with the most sacks once all its entries are added up: just the name.", "If two crops tie, the one that appears first in the ledger wins."],
        data: { ledger },
        plan: ["Add each crop's sacks up", "Find the crop with the most"],
        body: add + "\n" + pickBest,
        variants: [
          { data: { ledger: "wheat:10, mint:12, wheat:5" }, note: "Mint has the biggest single entry, but wheat has more in all." },
          { data: { ledger: "carrot:6, potato:4, potato:2" }, note: "Carrot and potato tie on 6: carrot came first." },
          { data: { ledger: "garlic:3" }, note: "A single entry." },
        ],
        wrong: [
          L('best = ""', "most = -1", 'for entry in ledger.split(","):', '    crop, amount = entry.strip().split(":")', "    if int(amount) > most:", "        most = int(amount)", "        best = crop", "print(best)"),
          add + "\n" + pickBest.replace("amount > most", "amount >= most"),
          add + "\n" + pickBest.replace("print(best)", "print(most)"),
        ],
        hints: [
          "First add every crop's entries together, then look for the biggest total. Looking for the biggest single entry is a different question.",
          "`basket[fruit] = basket.get(fruit, 0) + int(n)` builds a tally; `for fruit, n in basket.items():` walks it, in the order the fruit went in.",
          "Build `totals` first, then walk `totals.items()`, and when `amount ___ most` remember the crop.",
        ],
        needs: [["\\.split\\(", "Cut the ledger into pieces: Wren swaps in other ledgers."]],
        advice: "Just the crop's name.",
        codex: ["parsing", "counting"],
      };
    },
  },
];
