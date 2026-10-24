import type { Spec, Template } from "../build.ts";
import { py } from "../build.ts";
import { CROPS, FIELDS, FISH, PEOPLE, SKY } from "../rng.ts";

// Town Hall: files (read, lines, write, append, with) and CSV.

const L = (...lines: string[]) => lines.join("\n");
/** A CSV file's text: the header, then one line per row. */
const csvText = (header: string, rows: (string | number)[][]) => header + "\n" + rows.map((row) => row.join(",")).join("\n") + (rows.length ? "\n" : "");
/** Python that prints a file the program wrote, for the checks. */
const showFile = (name: string) => `print(open(${JSON.stringify(name)}).read().rstrip())`;

const NOTICE_LINES = [
  "The mill wheel turns at dawn",
  "Bring your sacks to the square by noon",
  "Rain is coming in from the hills",
  "Pip has eaten the mayor's quill again",
  "The pond is full of trout this week",
  "Market day moves to Friday",
  "Mind the geese on the bridge",
  "Thistle thanks all eight voters",
  "Lanterns go up along the lane at dusk",
  "The bakery needs more flour",
  "Fresh nets are drying by the dock",
  "Odo has found another old book",
];
const PLOTS = ["north", "river", "hill", "orchard", "meadow", "pond"];

export const TOWNHALL: Template[] = [
  {
    id: "th-read",
    topics: ["townhall"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["words", "shout", "lines"] as const);
      const name = r.pick(["notice.txt", "minutes.txt", "letter.txt"]);
      const picked = r.sample(NOTICE_LINES, r.int(3, 5)).map((l, i) => (i === 0 ? l.replace(" ", "  ") : l));
      picked.splice(r.int(1, picked.length - 1), 0, r.pick(["", "   "]));
      const today = picked.join("\n") + "\n";
      const open = `with open("${name}") as f:`;
      const files = (text: string) => ({ [name]: text });
      if (twist === "words")
        return {
          title: "How Long Is the Notice?",
          topic: "counting words in a file",
          task: [`Thistle pinned ${name} up in the Town Hall, and Wren wants to know how long it is.`, "Print how many words the file holds, as one number. Some gaps between words are wider than one space, and some lines are empty."],
          files: files(today),
          plan: ["Open the file", "Count the words on every line"],
          body: L("words = 0", open, "    for line in f:", "        words += len(line.split())", "print(words)"),
          variants: [
            { files: files(""), note: "An empty file: no words at all." },
            { files: files("Bring   honey\n\n\nand  bread\n"), note: "Wide gaps and empty lines." },
            { files: files("Rain"), note: "One word, and no line break at the end." },
          ],
          wrong: [
            L("lines = 0", open, "    for line in f:", "        lines += 1", "print(lines)"),
            L("words = 0", open, "    for line in f:", '        words += len(line.split(" "))', "print(words)"),
            L(open, "    print(len(f.read()))"),
          ],
          hints: [
            "Go through the file a line at a time and count the words on each line, however wide the gaps are.",
            "`for row in f:` walks an open file one line at a time; `\"oats  and   hay\".split()` gives `['oats', 'and', 'hay']`, and an empty line splits into nothing.",
            `\`${open}\`, then for each line, \`words += len(line.___())\`.`,
          ],
          needs: [["open\\(", "Open the file itself: Wren pins up other notices to try your program."]],
          advice: "One number: every word in the file.",
          codex: ["files-lines", "files-reading"],
        };
      if (twist === "shout")
        return {
          title: "Read It Out Loud",
          topic: "a file, line by line",
          task: [`Thistle wants ${name} read out at the meeting, loud enough for the back row.`, "Print every line of the file in capital letters, in order, with no empty gap after each one.", "Leave the empty lines out."],
          files: files(today),
          plan: ["Open the file", "Each line with writing on it, in capitals"],
          body: L(open, "    for line in f:", "        if line.strip():", "            print(line.strip().upper())"),
          variants: [
            { files: files("lock the hens in\n  \nfeed the cat\n"), note: "A line of only spaces in the middle." },
            { files: files("one line, no line break"), note: "A single line, with no line break at the end." },
            { files: files(""), note: "An empty notice: print nothing." },
          ],
          wrong: [
            L(open, "    for line in f:", "        print(line.upper())"),
            L(open, "    for line in f:", "        print(line.strip().upper())"),
            L(open, "    for line in f:", "        if line.strip():", "            print(line.strip())"),
          ],
          hints: [
            "Every line of a file ends in a line break of its own, and print adds another. Take the extra off, and skip the lines with nothing left.",
            "`for row in f:` walks the file; `\" plums \\n\".strip()` is `'plums'`; an empty string counts as False in an `if`; `.upper()` shouts.",
            "`for line in f:` then `if line.strip():` and print `line.strip().___()`.",
          ],
          needs: [["open\\(", "Open the file itself: Wren pins up other notices to try your program."]],
          advice: "Each line in capitals, no gaps, no empty lines.",
          codex: ["files-lines", "files-reading"],
        };
      return {
        title: "Room on the Slate",
        topic: "counting lines in a file",
        task: [`Wren is copying ${name} onto the slate by the field and wants to know how much room to leave.`, "Print how many lines have writing on them, as one number. Empty lines, and lines with only spaces, don't count."],
        files: files(today),
        plan: ["Open the file", "Count the lines with something on them"],
        body: L("count = 0", open, "    for line in f:", "        if line.strip():", "            count += 1", "print(count)"),
        variants: [
          { files: files(""), note: "An empty file." },
          { files: files("   \n\nhay\n   \n"), note: "Lines of only spaces, and one line of writing." },
          { files: files("ducks\ngeese"), note: "No line break after the last line." },
        ],
        wrong: [
          L("count = 0", open, "    for line in f:", "        count += 1", "print(count)"),
          L("count = 0", open, "    for line in f:", '        if line != "\\n":', "            count += 1", "print(count)"),
          L(open, '    print(f.read().count("\\n"))'),
        ],
        hints: [
          "Walk the file a line at a time and ask each line one question: is anything really here once the spaces and line break are gone?",
          "`for row in f:` walks the file; `\"   \\n\".strip()` is `''`, which counts as False in an `if`.",
          "Inside `for line in f:`, `if line.___():` add one to the count.",
        ],
        needs: [["open\\(", "Open the file itself: Wren pins up other notices to try your program."]],
        advice: "One number: the lines with writing on them.",
        codex: ["files-lines", "files-reading"],
      };
    },
  },
  {
    id: "th-write",
    topics: ["townhall"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["fresh", "diary"] as const);
      if (twist === "fresh") {
        const old = r.sample(CROPS, 3);
        const crops = r.sample(CROPS, r.int(3, 4));
        const write = (mode: string, line: string) => L(`with open("planting.txt", "${mode}") as f:`, "    for crop in crops:", `        f.write(${line})`);
        return {
          title: "This Year's Planting",
          topic: "writing a file",
          task: [
            "Last year's planting list is still in planting.txt.",
            "Write this year's crops into planting.txt instead, one crop per line, in the list's order. Last year's list should be gone.",
          ],
          data: { crops },
          files: { "planting.txt": old.join("\n") + "\n" },
          plan: ["Open the file for a fresh start", "One crop per line"],
          body: write("w", 'crop + "\\n"'),
          drive: showFile("planting.txt"),
          variants: [
            { data: { crops: ["pumpkin", "mint"] }, files: { "planting.txt": "wheat\ngarlic\ncabbage\nstrawberry\n" } },
            { data: { crops: [] }, note: "Nothing to plant this year: the file should end up empty." },
          ],
          wrong: [write("a", 'crop + "\\n"'), write("w", "crop"), L("for crop in crops:", '    with open("planting.txt", "w") as f:', '        f.write(crop + "\\n")')],
          hints: [
            "Opening a file to write can either start it fresh or add to the end. Which one throws last year away?",
            "`with open(\"jobs.txt\", \"w\") as f:` starts jobs.txt empty, and `f.write(\"sweep\\n\")` adds one line. write never adds the line break for you.",
            "`with open(\"planting.txt\", \"___\") as f:` and inside it, for each crop, `f.write(crop + \"\\n\")`.",
          ],
          needs: [["\\bwith\\b", "Open the file in a with block, so it closes itself."]],
          advice: "planting.txt should hold this year's crops, one per line, and nothing else.",
          codex: ["files-writing", "with"],
        };
      }
      const start = r.int(3, 9);
      const old = [0, 1, 2].map((i) => `Day ${start + i}: ${r.pick(SKY)}`);
      const write = (mode: string, text: string) => L(`with open("diary.txt", "${mode}") as f:`, `    f.write(${text})`);
      return {
        title: "The Weather Diary",
        topic: "adding to a file",
        task: [
          "Wren keeps a weather diary in diary.txt, one line per day.",
          "Add today's line at the end: the word Day, a space, the day's number, a colon and a space, then the sky. Everything already in the diary stays.",
        ],
        data: { day: start + 3, sky: r.pick(SKY) },
        files: { "diary.txt": old.join("\n") + "\n" },
        plan: ["Open the diary to add to it", "Today's line"],
        body: write("a", 'f"Day {day}: {sky}\\n"'),
        drive: showFile("diary.txt"),
        variants: [
          {
            data: { day: 30, sky: "windy" },
            drive: L('with open("diary.txt", "a") as _f:', '    _f.write("Day 31: misty\\n")', showFile("diary.txt")),
            note: "Wren writes tomorrow's line straight after yours, so yours must finish its line.",
          },
          { data: { day: 1, sky: "sunny" }, files: { "diary.txt": "" }, note: "A brand-new, empty diary." },
        ],
        wrong: [write("w", 'f"Day {day}: {sky}\\n"'), write("a", 'f"Day {day}: {sky}"'), write("a", '"Day " + day + ": " + sky + "\\n"')],
        hints: [
          "Opening a file to write can start it fresh or add to the end. A diary keeps every day.",
          "`with open(\"log.txt\", \"a\") as f:` adds to the end of log.txt; `f.write(f\"{hens} hens\\n\")` writes one finished line, numbers and all.",
          "`with open(\"diary.txt\", \"___\") as f:` and `f.write(f\"Day {day}: {sky}\\n\")`.",
        ],
        needs: [["\\bwith\\b", "Open the file in a with block, so it closes itself."]],
        advice: "The old lines, then today's on a line of its own.",
        codex: ["files-writing", "with"],
      };
    },
  },
  {
    id: "th-records",
    topics: ["townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["total", "fields", "biggest"] as const);
      const c = r.sample(CROPS, 4);
      const rows: (string | number)[][] = r.shuffle([
        [c[0], r.pick(FIELDS), r.int(3, 40)],
        [c[0], r.pick(FIELDS), r.int(3, 40)],
        [c[1], r.pick(FIELDS), r.int(3, 40)],
        [c[2], r.pick(FIELDS), r.int(3, 40)],
        [r.pick([c[0], c[1]]), r.pick(FIELDS), r.int(3, 40)],
      ]);
      const lines = csvText("crop,field,kilos", rows).split("\n");
      lines.splice(r.int(2, lines.length - 2), 0, "");
      const harvest = lines.join("\n");
      const head = L('with open("harvest.csv") as f:', "    lines = f.readlines()", "for line in lines[1:]:", "    if not line.strip():", "        continue", '    name, field, kilos = line.strip().split(",")');
      const noSkip = L('with open("harvest.csv") as f:', "    lines = f.readlines()", "for line in lines[1:]:", '    name, field, kilos = line.strip().split(",")');
      const intro = "harvest.csv has a header line, then one record per pick: the crop, the field it came from and the kilos, with commas between. The clerk left a blank line here and there: skip those.";
      const other = csvText("crop,field,kilos", [
        ["mint", "hill plot", 4],
        ["wheat", "north field", 30],
        ["mint", "river strip", 7],
      ]);
      if (twist === "total")
        return {
          title: "One Crop's Kilos",
          topic: "records and fields",
          task: [intro, "Print how many kilos of the crop named in `crop` were picked altogether, as one number."],
          data: { crop: c[0] },
          files: { "harvest.csv": harvest },
          plan: ["Read the records, skipping the header", "Cut each into its fields", "Add up the kilos of the crop"],
          body: L("total = 0", head, "    if name == crop:", "        total += int(kilos)", "print(total)"),
          variants: [
            { data: { crop: c[3] }, note: "Nobody picked that crop: 0." },
            { data: { crop: "mint" }, files: { "harvest.csv": other }, note: "Mint was picked twice." },
            { files: { "harvest.csv": "crop,field,kilos\n" }, note: "Only the header line: no records yet." },
          ],
          wrong: [
            L("total = 0", head, "    total += int(kilos)", "print(total)"),
            L("total = 0", noSkip, "    if name == crop:", "        total += int(kilos)", "print(total)"),
            L("total = 0", head, "    if name == crop:", "        total += 1", "print(total)"),
          ],
          hints: [
            "Each record is one line of text. Cut it into its three fields, and only add the kilos when the crop matches. The header isn't a record.",
            "`hen, coop, eggs = \"Moss,east,4\".split(\",\")` gives three fields, all text; `int(eggs)` makes a number. `f.readlines()[1:]` skips the first line.",
            "`name, field, kilos = line.strip().split(\",\")`, and `if name == crop:` add `___` to the total.",
          ],
          needs: [["open\\(", "Read harvest.csv itself: Wren swaps in other harvests."]],
          advice: "One number: that crop's kilos.",
          codex: ["records", "files-lines"],
        };
      if (twist === "fields")
        return {
          title: "Where It Grew",
          topic: "records and fields",
          task: [intro, "Print the field of every record of the crop named in `crop`, one per line, in the file's order."],
          data: { crop: c[0] },
          files: { "harvest.csv": harvest },
          plan: ["Read the records, skipping the header", "Cut each into its fields", "The field of each matching record"],
          body: L(head, "    if name == crop:", "        print(field)"),
          variants: [
            { data: { crop: c[3] }, note: "Nobody picked that crop: print nothing." },
            { data: { crop: "mint" }, files: { "harvest.csv": other }, note: "Mint was picked twice." },
            { files: { "harvest.csv": "crop,field,kilos\n" }, note: "Only the header line: no records yet." },
          ],
          wrong: [L(noSkip, "    if name == crop:", "        print(field)"), L(head, "    print(field)"), L(head, "    if name == crop:", "        print(name)")],
          hints: [
            "Each record is one line of text: cut it into its three fields, then decide whether it's the crop you want. The header isn't a record.",
            "`hen, coop, eggs = \"Moss,east,4\".split(\",\")` names all three fields at once; `f.readlines()[1:]` skips the first line, and `if not row.strip():` spots a blank one.",
            "`name, field, kilos = line.strip().split(\",\")` and `if name == crop:` print the ___.",
          ],
          needs: [["open\\(", "Read harvest.csv itself: Wren swaps in other harvests."]],
          advice: "One field name per line.",
          codex: ["records", "files-lines"],
        };
      return {
        title: "The Biggest Pick",
        topic: "records and fields",
        task: [intro, "Print the field where the single biggest pick (of any crop) was made: just the field's name.", "If two picks tie, the first in the file wins. There is always at least one record."],
        files: { "harvest.csv": harvest },
        plan: ["Read the records, skipping the header", "Keep the biggest pick so far, and its field"],
        body: L('best = ""', "most = -1", head, "    if int(kilos) > most:", "        most = int(kilos)", "        best = field", "print(best)"),
        variants: [
          { files: { "harvest.csv": other }, note: "The biggest pick is in the middle." },
          { files: { "harvest.csv": csvText("crop,field,kilos", [["garlic", "east meadow", 9], ["carrot", "mill patch", 12], ["wheat", "orchard row", 12]]) }, note: "Two picks of 12: the first in the file wins." },
          { files: { "harvest.csv": csvText("crop,field,kilos", [["potato", "hill plot", 5]]) }, note: "Just one record." },
        ],
        wrong: [
          L('best = ""', "most = -1", 'with open("harvest.csv") as f:', "    for line in f:", "        if not line.strip():", "            continue", '        name, field, kilos = line.strip().split(",")', "        if int(kilos) > most:", "            most = int(kilos)", "            best = field", "print(best)"),
          L('best = ""', "most = -1", head, "    if int(kilos) >= most:", "        most = int(kilos)", "        best = field", "print(best)"),
          L("most = -1", head, "    if int(kilos) > most:", "        most = int(kilos)", "print(most)"),
        ],
        hints: [
          "Walk the records keeping the biggest pick so far and where it was. The header line isn't a record: its kilos field is the word kilos.",
          "`f.readlines()[1:]` skips the first line; `hen, coop, eggs = \"Moss,east,4\".split(\",\")` names the fields; `int(eggs)` compares as a number.",
          "After cutting each record up: when `int(kilos) ___ most`, remember the kilos and the field.",
        ],
        needs: [["open\\(", "Read harvest.csv itself: Wren swaps in other harvests."]],
        advice: "Just the field's name.",
        codex: ["records", "files-lines"],
      };
    },
  },
  {
    id: "th-csv",
    topics: ["townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["coins", "buyers", "columns"] as const);
      if (twist === "columns") {
        const c = r.sample(CROPS, 3);
        const who = r.sample(PEOPLE, 4);
        const rows = r.shuffle([
          [who[0], c[0], r.int(1, 9)],
          [who[1], c[1], r.int(1, 9)],
          [who[2], c[0], r.int(1, 9)],
          [who[3], c[2], r.int(1, 9)],
        ]);
        const read = (inner: string[]) => L("import csv", 'with open("deliveries.csv", newline="") as f:', "    for row in csv.DictReader(f):", ...inner);
        return {
          title: "Columns in Any Order",
          topic: "csv.DictReader",
          task: [
            "deliveries.csv has a header line naming its columns: who, crop and sacks. The clerk doesn't always write the columns in the same order, so go by their names.",
            "Print one line for every delivery of the crop named in `crop`, in the file's order: who brought it, a colon and a space, then the sacks.",
          ],
          data: { crop: c[0] },
          files: { "deliveries.csv": csvText("who,crop,sacks", rows) },
          plan: ["Read the rows by column name", "The deliveries of the crop"],
          body: read(['        if row["crop"] == crop:', '            print(f"{row[\'who\']}: {row[\'sacks\']}")']),
          variants: [
            { files: { "deliveries.csv": csvText("sacks,crop,who", [[4, c[0], "Hazel"], [2, c[1], "Bram"], [7, c[0], "Pip"]]) }, note: "The columns come in a different order this time." },
            { data: { crop: "pumpkin" }, files: { "deliveries.csv": csvText("crop,who,sacks", [["garlic", "Odo", 3]]) }, note: "Nobody brought pumpkins: print nothing." },
            { files: { "deliveries.csv": "who,crop,sacks\n" }, note: "Only the header line." },
          ],
          wrong: [
            L("import csv", 'with open("deliveries.csv", newline="") as f:', "    rows = list(csv.reader(f))", "for who, name, sacks in rows[1:]:", "    if name == crop:", '        print(f"{who}: {sacks}")'),
            read(['        print(f"{row[\'who\']}: {row[\'sacks\']}")']),
            read(['        if row["crop"] == crop:', '            print(row["who"], row["sacks"])']),
          ],
          hints: [
            "If the columns can move, a field's position means nothing. Its column name always means the same thing.",
            "`for row in csv.DictReader(f):` gives each row as a dictionary keyed by the header, so `row[\"honey\"]` is the honey column wherever it sits.",
            "`if row[\"crop\"] == crop:` print `row[\"who\"]`, a colon and a space, then `row[\"___\"]`.",
          ],
          needs: [["import csv", "Let the csv module read the rows."]],
          advice: "One line per delivery: who, a colon and a space, then the sacks.",
          codex: ["csv-dicts", "csv-reading"],
        };
      }
      const c = r.sample(CROPS, 4);
      const who = r.sample(PEOPLE, 4);
      const quoted = (a: string, b: string) => `"${a}, ${b}"`;
      const rows = r.shuffle([
        [quoted(c[0], c[1]), r.int(2, 15), who[0]],
        [c[2], r.int(2, 15), who[1]],
        [quoted(c[3], c[0]), r.int(2, 15), who[2]],
        [c[1], r.int(2, 15), who[3]],
      ]);
      const intro = "orders.csv has a header line, then one order per line: the basket, the coins paid and who bought it. A basket with more than one crop is written in quotes, with commas inside.";
      const read = L("import csv", 'with open("orders.csv", newline="") as f:', "    rows = list(csv.reader(f))", "for basket, coins, who in rows[1:]:");
      const bySplit = L('with open("orders.csv") as f:', "    lines = f.readlines()", "for line in lines[1:]:", '    basket, coins, who = line.strip().split(",")');
      const files2 = { "orders.csv": csvText("basket,coins,who", [[quoted("wheat", "mint"), 7, "Rook"], ["garlic", 3, "Pip"], [quoted("mint", "potato"), 10, "Sable"]]) };
      if (twist === "coins")
        return {
          title: "The Day's Coins",
          topic: "csv.reader",
          task: [intro, "Print how many coins the orders came to, as one number."],
          files: { "orders.csv": csvText("basket,coins,who", rows) },
          plan: ["Read the rows, quotes and all", "Add up the coins, skipping the header"],
          body: L("total = 0", read, "    total += int(coins)", "print(total)"),
          variants: [
            { files: files2 },
            { files: { "orders.csv": "basket,coins,who\n" }, note: "Only the header line: no orders yet." },
            { files: { "orders.csv": csvText("basket,coins,who", [[quoted("carrot", "cabbage"), 12, "Odo"]]) }, note: "A single order, with commas in its basket." },
          ],
          wrong: [
            L("total = 0", bySplit, "    total += int(coins)", "print(total)"),
            L("total = 0", "import csv", 'with open("orders.csv", newline="") as f:', "    for basket, coins, who in csv.reader(f):", "        total += int(coins)", "print(total)"),
            L("total = 0", read, "    total += 1", "print(total)"),
          ],
          hints: [
            "Cutting each line at every comma breaks the quoted baskets apart. Python has a module that knows the quoting rules.",
            "`import csv`, then `csv.reader(f)` gives each row as a list of fields with the quotes handled; `list(...)` keeps them all, and `[1:]` skips the header.",
            "`for basket, coins, who in rows[1:]:` and add `___` to the total.",
          ],
          needs: [["import csv", "Let the csv module read the rows: it knows about the quotes."]],
          advice: "One number: all the coins.",
          codex: ["csv-reading"],
        };
      return {
        title: "Who Bought It?",
        topic: "csv.reader",
        task: [intro, "Print the name of everyone whose basket has the crop named in `crop` in it, one per line, in the file's order."],
        data: { crop: c[0] },
        files: { "orders.csv": csvText("basket,coins,who", rows) },
        plan: ["Read the rows, quotes and all", "Who bought a basket with the crop in it"],
        body: L(read, "    if crop in basket:", "        print(who)"),
        variants: [
          { data: { crop: "mint" }, files: files2, note: "Mint is in two baskets, both with commas inside." },
          { data: { crop: "pumpkin" }, files: files2, note: "Nobody bought pumpkins: print nothing." },
          { data: { crop: "garlic" }, files: files2 },
        ],
        wrong: [L(bySplit, "    if crop in basket:", "        print(who)"), L(read, "    if crop == basket:", "        print(who)"), L(read, "    if crop in basket:", "        print(basket)")],
        hints: [
          "Cutting each line at every comma breaks the quoted baskets apart. Python has a module that knows the quoting rules. And a basket can hold more than one crop.",
          "`import csv`, then `csv.reader(f)` gives each row as a list of fields with the quotes handled. `\"fig\" in \"plum, fig\"` is True.",
          "`for basket, coins, who in rows[1:]:` and `if crop ___ basket:` print who.",
        ],
        needs: [["import csv", "Let the csv module read the rows: it knows about the quotes."]],
        advice: "One name per line.",
        codex: ["csv-reading"],
      };
    },
  },
  {
    id: "th-update",
    topics: ["townhall"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["stock", "totals"] as const);
      if (twist === "stock") {
        const c = r.sample(CROPS, 5);
        const counts = c.slice(0, 4).map(() => r.int(6, 20));
        const sold: Record<string, number> = { [c[1]]: r.int(1, 5), [c[3]]: r.int(1, 5) };
        if (r.chance(0.5)) sold[c[4]] = r.int(1, 3);
        const read = L("import csv", 'with open("stock.csv", newline="") as f:', "    rows = list(csv.reader(f))");
        const change = L("for row in rows[1:]:", "    if row[0] in sold:", "        row[1] = int(row[1]) - sold[row[0]]");
        const write = (mode: string, what: string) => L(`with open("stock.csv", "${mode}", newline="") as f:`, `    csv.writer(f).writerows(${what})`);
        return {
          title: "After the Market",
          topic: "read, change, write back",
          task: [
            "The store's sacks are counted in stock.csv: a header line, then one line per crop with its sacks.",
            "`sold` says how many sacks of each crop went at the market. Take them off and write stock.csv back: the same header, the same crops in the same order, with the new counts.",
            "A crop that sold nothing keeps its count. A crop in `sold` that the store doesn't keep is ignored.",
          ],
          data: { sold },
          files: { "stock.csv": csvText("crop,sacks", c.slice(0, 4).map((x, i) => [x, counts[i]])) },
          plan: ["Read every row first", "Change the counts", "Write it all back"],
          body: L(read, change, write("w", "rows")),
          drive: showFile("stock.csv"),
          variants: [
            { data: { sold: {} }, note: "Nothing sold today: the file stays as it was." },
            { data: { sold: { wheat: 4, plum: 2 } }, files: { "stock.csv": csvText("crop,sacks", [["mint", 3], ["wheat", 10]]) }, note: "Plum isn't kept in the store." },
            { data: { sold: { wheat: 1 } }, files: { "stock.csv": "crop,sacks\n" }, note: "An empty store: just the header." },
          ],
          wrong: [
            L(read, L("for row in rows[1:]:", "    row[1] = int(row[1]) - sold[row[0]]"), write("w", "rows")),
            L(read, change, write("w", "rows[1:]")),
            L(read, change, write("a", "rows")),
          ],
          hints: [
            "Read everything first and keep it. Only once the reading is done, open the file again to write the changed version over it.",
            "`rows = list(csv.reader(f))` keeps every row as a list you can change, like `rows[2][1] = 9`. `csv.writer(f).writerows(rows)` writes them all back. `if pear in basket:` checks a dictionary key before you look it up.",
            "Change each row in `rows[1:]` whose crop is in `sold`, then `with open(\"stock.csv\", \"___\", newline=\"\") as f:` and write all of `rows`.",
          ],
          needs: [["\\bwith\\b", "Open the file in a with block, so it closes itself."]],
          advice: "stock.csv should hold the header, then every crop with its new count.",
          codex: ["csv-writing", "csv-reading"],
        };
      }
      const c = r.sample(CROPS, 3);
      const rows = r.shuffle([
        [c[0], r.pick(FIELDS), r.int(3, 30)],
        [c[1], r.pick(FIELDS), r.int(3, 30)],
        [c[0], r.pick(FIELDS), r.int(3, 30)],
        [c[2], r.pick(FIELDS), r.int(3, 30)],
        [c[1], r.pick(FIELDS), r.int(3, 30)],
      ]);
      const read = (add: string) => L("import csv", "totals = {}", 'with open("harvest.csv", newline="") as f:', "    for row in csv.DictReader(f):", `        totals[row["crop"]] = ${add}`);
      const sum = 'totals.get(row["crop"], 0) + int(row["kilos"])';
      const write = (header: boolean) =>
        L('with open("totals.csv", "w", newline="") as f:', "    writer = csv.writer(f)", ...(header ? ['    writer.writerow(["crop", "kilos"])'] : []), "    for crop, kilos in totals.items():", "        writer.writerow([crop, kilos])");
      return {
        title: "The Totals Sheet",
        topic: "writing CSV",
        task: [
          "harvest.csv has a header line naming its columns (crop, field and kilos), then one row per pick. A crop can be picked many times.",
          "Write a new file, totals.csv: a header line with the columns crop and kilos, then one row per crop, in the order each crop first appears, with all its kilos added up.",
        ],
        files: { "harvest.csv": csvText("crop,field,kilos", rows) },
        plan: ["Add up each crop's kilos", "Write the header, then one row per crop"],
        body: L(read(sum), write(true)),
        drive: showFile("totals.csv"),
        variants: [
          { files: { "harvest.csv": "crop,field,kilos\n" }, note: "Only the header line: totals.csv gets just its header." },
          { files: { "harvest.csv": csvText("crop,field,kilos", [["mint", "hill plot", 4], ["mint", "north field", 6], ["mint", "river strip", 1]]) }, note: "One crop, picked three times." },
          { files: { "harvest.csv": csvText("kilos,crop,field", [[5, "wheat", "east meadow"], [2, "garlic", "mill patch"]]) }, note: "The columns come in another order." },
        ],
        wrong: [L(read(sum), write(false)), L(read('int(row["kilos"])'), write(true)), L(read('totals.get(row["crop"], "") + row["kilos"]'), write(true))],
        hints: [
          "Two halves: a tally of the harvest (a dictionary does that), then the writing. A CSV file starts with its header line.",
          "`writer = csv.writer(f)` then `writer.writerow([\"hive\", \"jars\"])` writes one row; numbers are fine in there. `csv.DictReader(f)` reads rows by column name.",
          "After the tally: open totals.csv with `\"w\"` and `newline=\"\"`, `writer.writerow([\"crop\", \"kilos\"])`, then for each `crop, kilos in totals.items()`, `writer.writerow(___)`.",
        ],
        needs: [["csv\\.(writer|DictWriter)", "Let the csv module write the rows for you."]],
        advice: "totals.csv: the header, then one row per crop with its kilos.",
        codex: ["csv-writing", "csv-dicts", "counting"],
      };
    },
  },
  {
    id: "th-missing",
    topics: ["townhall"],
    difficulty: 3,
    make(r): Spec {
      const plots = r.sample(PLOTS, 4);
      const kept = plots.slice(0, 3);
      const files: Record<string, string> = {};
      kept.forEach((p, i) => {
        const nums = Array.from({ length: r.int(2, 4) }, () => String(r.int(2, 25)));
        if (i === 1) nums.splice(1, 0, "");
        files[`${p}.txt`] = nums.join("\n") + "\n";
      });
      const fields = r.shuffle(plots);
      const total = L("        total = 0", "        for line in lines:", "            if line.strip():", "                total += int(line)", '        print(f"{field}: {total}")');
      const body = L(
        "for field in fields:",
        "    try:",
        '        with open(field + ".txt") as f:',
        "            lines = f.readlines()",
        "    except FileNotFoundError:",
        '        print(f"{field}: missing")',
        "    else:",
        total,
      );
      return {
        title: "The Field Books",
        topic: "FileNotFoundError",
        task: [
          "Each field keeps a book: a file named after the field with .txt on the end, holding one pick's kilos per line. Some books have blank lines; skip them.",
          "For each field in `fields`, in order, print one line: the field, a colon and a space, then its kilos added up.",
          "Some books have gone missing. For a field with no book, print the field, a colon and a space, then the word `missing`, and carry on with the next field.",
        ],
        data: { fields },
        files,
        plan: ["For each field: try to open its book", "Missing? Say so and go on", "Otherwise add up its kilos"],
        body,
        variants: [
          { data: { fields: [kept[2], "nowhere", kept[0]] }, note: "A field with no book in the middle." },
          { data: { fields: ["meadow", "pond"] }, files: { "meadow.txt": "", "pond.txt": "\n4\n\n" }, note: "An empty book adds up to 0." },
          { data: { fields: ["moor", "fen"] }, note: "Every book is missing." },
        ],
        wrong: [
          L(
            "try:",
            "    for field in fields:",
            '        with open(field + ".txt") as f:',
            "            lines = f.readlines()",
            total,
            "except FileNotFoundError:",
            '    print(f"{field}: missing")',
          ),
          body.replace("            if line.strip():\n                total += int(line)", "            total += int(line)"),
          body.replace("total += int(line)", "total += 1"),
        ],
        hints: [
          "Each field is its own small adventure: its book might be there or not. Let one missing book spoil only its own line, not the whole list.",
          "`try:` `with open(name) as f:` ... `except FileNotFoundError:` catches a missing file; put the `try` inside the loop so the loop carries on. `else:` runs only when the file opened.",
          "Inside `for field in fields:`: `try:` open `field + \".txt\"` and read its lines, `except ___:` print the missing line, `else:` add up and print.",
        ],
        needs: [["FileNotFoundError", "Catch the missing books by name: FileNotFoundError."]],
        advice: "One line per field, in order.",
        codex: ["file-errors", "files-lines"],
      };
    },
  },
  {
    id: "th-fn-total",
    topics: ["forge", "townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["total", "best"] as const);
      const c = r.sample(CROPS, 4);
      const year = (crops: string[]) =>
        csvText(
          "crop,field,kilos",
          r.shuffle([
            [crops[0], r.pick(FIELDS), r.int(3, 30)],
            [crops[0], r.pick(FIELDS), r.int(3, 30)],
            [crops[1], r.pick(FIELDS), r.int(3, 30)],
            [crops[2], r.pick(FIELDS), r.int(3, 30)],
          ]),
        );
      const files = { "harvest.csv": year([c[0], c[1], c[2]]), "last_year.csv": year([c[1], c[2], c[3]]) };
      const intro = "Wren's harvest files all look alike: a header line naming the columns crop, field and kilos, then one row per pick. harvest.csv is this year; last_year.csv is last year.";
      if (twist === "total") {
        const fn = (head: string[], ret: string[], name = "filename") =>
          L(
            "import csv",
            "",
            "def total_for(filename, crop):",
            "    total = 0",
            `    with open(${name}, newline="") as f:`,
            "        for row in csv.DictReader(f):",
            '            if row["crop"] == crop:',
            ...head,
            ...ret,
          );
        const call = (f: string, crop: string) => `print(total_for("${f}", "${crop}"))`;
        return {
          title: "Kilos on File",
          topic: "a function that reads a file",
          task: [intro, "Write a function `total_for(filename, crop)` that reads the harvest file with that name and hands back the crop's kilos added up (0 if it never turns up)."],
          files,
          plan: ["Your function goes here"],
          body: fn(['                total += int(row["kilos"])'], ["    return total"]),
          drive: L(call("harvest.csv", c[0]), call("last_year.csv", c[1])),
          variants: [
            { drive: L(call("harvest.csv", c[3]), call("last_year.csv", c[0])), note: "Crops nobody picked that year: 0." },
            { drive: L(call("harvest.csv", c[2]), call("last_year.csv", c[2])), note: "The same crop, two different years." },
            { files: { "harvest.csv": "crop,field,kilos\n" }, drive: call("harvest.csv", c[0]), note: "A harvest file with only its header." },
          ],
          wrong: [
            fn(['                total += int(row["kilos"])'], ["    print(total)"]),
            fn(['                total += int(row["kilos"])'], ["    return total"], '"harvest.csv"'),
            fn(['                total += int(row["kilos"])', "                return total"], ["    return total"]),
          ],
          hints: [
            "The function opens whichever file it's given, not always the same one, and hands its answer back rather than printing it.",
            "`def jars_in(path, hive):` can `with open(path, newline=\"\") as f:` and walk `csv.DictReader(f)`; `return` hands the answer back once the loop has finished.",
            "Inside `def total_for(filename, crop):`, open `filename`, add `int(row[\"kilos\"])` for each row whose crop matches, and after the loop `return ___`.",
          ],
          needs: [["def\\s+total_for\\s*\\(", "Wren asks for a function named total_for."]],
          advice: "Hand the total back with return.",
          codex: ["csv-dicts", "return"],
        };
      }
      const fn = (cmp: string, keep: string, start: string, name = "filename") =>
        L(
          "import csv",
          "",
          "def best_field(filename, crop):",
          `    best = ${start}`,
          "    most = -1",
          `    with open(${name}, newline="") as f:`,
          "        for row in csv.DictReader(f):",
          `            if row["crop"] == crop and int(row["kilos"]) ${cmp} most:`,
          '                most = int(row["kilos"])',
          `                best = ${keep}`,
          "    return best",
        );
      const call = (f: string, crop: string) => `print(best_field("${f}", "${crop}"))`;
      const tie = csvText("crop,field,kilos", [
        ["wheat", "east meadow", 9],
        ["wheat", "mill patch", 14],
        ["mint", "hill plot", 20],
        ["wheat", "orchard row", 14],
      ]);
      return {
        title: "The Best Field",
        topic: "a function that reads a file",
        task: [
          intro,
          "Write a function `best_field(filename, crop)` that reads the harvest file with that name and hands back the field where the biggest single pick of that crop was made.",
          "If two picks tie, the first in the file wins. If the crop never turns up, hand back None.",
        ],
        files,
        plan: ["Your function goes here"],
        body: fn(">", 'row["field"]', "None"),
        drive: L(call("harvest.csv", c[0]), call("last_year.csv", c[1])),
        variants: [
          { drive: L(call("harvest.csv", c[3]), call("last_year.csv", c[0])), note: "Crops nobody picked that year: None." },
          { files: { "harvest.csv": tie }, drive: L(call("harvest.csv", "wheat"), call("harvest.csv", "mint")), note: "Two wheat picks of 14: the first in the file wins." },
        ],
        wrong: [fn(">=", 'row["field"]', "None"), fn(">", 'row["kilos"]', "None"), fn(">", 'row["field"]', '""'), fn(">", 'row["field"]', "None", '"harvest.csv"')],
        hints: [
          "Walk the file keeping the biggest pick of the crop so far and the field it came from. Start with nothing found, and hand back whatever you end with.",
          "`def ripest(path, tree):` can open `path` and walk `csv.DictReader(f)`; a variable can start as `None` and only change when something is found. `int(row[\"apples\"])` compares as a number.",
          "When the row's crop matches and `int(row[\"kilos\"]) ___ most`, remember the kilos and `row[\"field\"]`; after the loop, `return best`.",
        ],
        needs: [["def\\s+best_field\\s*\\(", "Wren asks for a function named best_field."]],
        advice: "Hand the field's name back with return, or None.",
        codex: ["csv-dicts", "none-guards"],
      };
    },
  },
  {
    id: "th-fn-write",
    topics: ["forge", "townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["log", "list"] as const);
      if (twist === "log") {
        const [f1, f2, f3, f4] = r.sample(FISH, 4);
        const fn = (mode: string, line: string) => L("def log_catch(fish, count):", `    with open("catch_log.txt", "${mode}") as f:`, `        f.write(${line})`);
        const calls = (xs: [string, number][]) => L(...xs.map(([f, n]) => `log_catch("${f}", ${n})`), showFile("catch_log.txt"));
        return {
          title: "The Catch Log",
          topic: "a function that adds to a file",
          task: [
            "Marlo keeps every catch in catch_log.txt, one line per catch: how many fish, a space, then the kind of fish.",
            "Write a function `log_catch(fish, count)` that adds one catch's line to the end of the log, keeping everything already there.",
          ],
          files: { "catch_log.txt": `${r.int(1, 6)} ${f3}\n${r.int(1, 6)} ${f4}\n` },
          plan: ["Your function goes here"],
          body: fn("a", 'f"{count} {fish}\\n"'),
          drive: calls([
            [f1, r.int(1, 9)],
            [f2, r.int(1, 9)],
          ]),
          variants: [
            { files: { "catch_log.txt": "" }, drive: calls([["eel", 1]]), note: "A brand-new, empty log." },
            {
              drive: calls([
                ["pike", 2],
                ["carp", 12],
                ["pike", 1],
              ]),
              note: "Three catches in a row.",
            },
          ],
          wrong: [fn("w", 'f"{count} {fish}\\n"'), fn("a", 'f"{count} {fish}"'), fn("a", 'f"{fish} {count}\\n"')],
          hints: [
            "Every call adds one finished line to the end. Opening the log the wrong way would wipe Marlo's old catches.",
            "`with open(\"jobs.txt\", \"a\") as f:` adds to the end of jobs.txt; `f.write(f\"{n} {job}\\n\")` writes one whole line.",
            "Inside `def log_catch(fish, count):`, `with open(\"catch_log.txt\", \"___\") as f:` and write the line, ending in `\\n`.",
          ],
          needs: [["def\\s+log_catch\\s*\\(", "Wren asks for a function named log_catch."]],
          advice: "Each call adds one line at the end: the count, a space, the fish.",
          codex: ["files-writing", "functions"],
        };
      }
      const old = r.sample(CROPS, 3);
      const fn = (mode: string, line: string, end: string) => L("def save_list(filename, items):", `    with open(filename, "${mode}") as f:`, "        for item in items:", `            f.write(${line})`, end);
      const call = (f: string, xs: string[]) => L(`print(save_list("${f}", ${py(xs)}))`, showFile(f));
      return {
        title: "Lists on Paper",
        topic: "a function that writes a file",
        task: [
          "Wren writes lists out for the villagers. Write a function `save_list(filename, items)` that writes the items into the file with that name, one per line, in order.",
          "The file holds only this list afterwards, even if it held something before. The function hands back how many items it wrote.",
        ],
        files: { "shopping.txt": old.join("\n") + "\n" },
        plan: ["Your function goes here"],
        body: fn("w", 'item + "\\n"', "    return len(items)"),
        drive: call("shopping.txt", r.sample(CROPS, r.int(2, 4))),
        variants: [
          { drive: call("seeds.txt", ["pumpkin", "mint", "garlic"]), note: "A file that isn't there yet." },
          { drive: call("shopping.txt", []), note: "An empty list: nothing written, and the old list gone." },
        ],
        wrong: [fn("a", 'item + "\\n"', "    return len(items)"), fn("w", 'item + "\\n"', "    print(len(items))"), fn("w", "item", "    return len(items)")],
        hints: [
          "Two jobs: write the lines over whatever was there, and hand the count back. Which way of opening a file starts it fresh?",
          "`with open(path, \"w\") as f:` starts the file empty; `f.write(job + \"\\n\")` adds one line; `return len(jobs)` hands a count back.",
          "Inside `def save_list(filename, items):` open `filename` with `\"___\"`, write each item and a line break, then `return len(items)`.",
        ],
        needs: [["def\\s+save_list\\s*\\(", "Wren asks for a function named save_list."]],
        advice: "Write the list over the file, and hand back how many items went in.",
        codex: ["files-writing", "return"],
      };
    },
  },
  {
    id: "th-tally",
    topics: ["library", "townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["crops", "buyers"] as const);
      const c = r.sample(CROPS, 3);
      const who = r.sample(PEOPLE, 3);
      const rows = r.shuffle([
        [who[0], c[0], r.int(1, 9)],
        [who[1], c[1], r.int(1, 9)],
        [who[0], c[2], r.int(1, 9)],
        [who[2], c[0], r.int(1, 9)],
        [who[1], c[0], r.int(1, 9)],
      ]);
      const files = { "market.csv": csvText("buyer,crop,sacks", rows) };
      const intro = "market.csv has a header line naming its columns (buyer, crop and sacks), then one order per row. The clerk doesn't always write the columns in the same order.";
      const key = twist === "crops" ? "crop" : "buyer";
      const loop = (add: string, show = true) =>
        L(
          "import csv",
          "tally = {}",
          'with open("market.csv", newline="") as f:',
          "    for row in csv.DictReader(f):",
          `        tally[row["${key}"]] = ${add}`,
          ...(show ? ["for name, n in tally.items():", '    print(f"{name}: {n}")'] : ['        print(f"{row[\'' + key + '\']}: {tally[row[\'' + key + '\']]}")']),
        );
      const right = twist === "crops" ? 'tally.get(row["crop"], 0) + int(row["sacks"])' : 'tally.get(row["buyer"], 0) + 1';
      const otherAdd = twist === "crops" ? 'tally.get(row["crop"], 0) + 1' : 'tally.get(row["buyer"], 0) + int(row["sacks"])';
      return {
        title: twist === "crops" ? "Sacks per Crop" : "Orders per Buyer",
        topic: "DictReader into a tally",
        task: [
          intro,
          twist === "crops"
            ? "Print one line per crop, in the order each crop first appears: the crop, a colon and a space, then all its sacks added up."
            : "Print one line per buyer, in the order each buyer first appears: the name, a colon and a space, then how many orders they placed (not sacks: orders).",
        ],
        files,
        plan: ["Read the rows by column name", "Keep a tally", "Print it"],
        body: loop(right),
        variants: [
          { files: { "market.csv": csvText("sacks,crop,buyer", [[3, "mint", "Pip"], [5, "wheat", "Rook"], [2, "mint", "Rook"]]) }, note: "The columns come in another order." },
          { files: { "market.csv": "buyer,crop,sacks\n" }, note: "Only the header line: print nothing." },
          { files: { "market.csv": csvText("crop,buyer,sacks", [["garlic", "Hazel", 4]]) }, note: "A single order." },
        ],
        wrong: [
          loop(otherAdd),
          loop(right, false),
          L(
            "import csv",
            "tally = {}",
            'with open("market.csv", newline="") as f:',
            "    rows = list(csv.reader(f))",
            ...(twist === "crops" ? ["for buyer, crop, sacks in rows[1:]:", "    tally[crop] = tally.get(crop, 0) + int(sacks)"] : ["for buyer, crop, sacks in rows[1:]:", "    tally[buyer] = tally.get(buyer, 0) + 1"]),
            "for name, n in tally.items():",
            '    print(f"{name}: {n}")',
          ),
        ],
        hints: [
          "Read the rows by their column names, since the columns move. Keep a running tally in a dictionary, and print it once the reading is done.",
          "`for row in csv.DictReader(f):` gives each row as a dictionary keyed by the header; `count[k] = count.get(k, 0) + 1` adds to a tally whether or not `k` is there yet.",
          twist === "crops" ? "`tally[row[\"crop\"]] = tally.get(row[\"crop\"], 0) + ___`, then print each crop and its total." : "`tally[row[\"buyer\"]] = tally.get(row[\"buyer\"], 0) + ___`, then print each buyer and their count.",
        ],
        needs: [["DictReader", "Read the rows by column name with csv.DictReader: the columns move."]],
        advice: "One line per name: the name, a colon and a space, then the tally.",
        codex: ["csv-dicts", "counting"],
      };
    },
  },
  {
    id: "th-stop",
    topics: ["dock", "townhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["print", "count"] as const);
      const marker = r.pick(["---", "END", "~~~"]);
      const notes = r.sample(NOTICE_LINES, r.int(3, 4));
      notes.splice(r.int(1, notes.length - 1), 0, "");
      const doodles = r.sample(["a frog", "Pip was here", "a very small dragon", "three moons", "Pip again"], 2);
      const minutes = [...notes, marker, ...doodles].join("\n") + "\n";
      const read = L('with open("minutes.txt") as f:', "    lines = f.readlines()", "i = 0");
      const intro = `Thistle writes the meeting's minutes in minutes.txt. Under them she draws a line made of the text in \`marker\`, and everything below it is Pip's doodles.`;
      const tail = ["    i += 1"];
      const p = twist === "print";
      const act = p ? ["    if lines[i].strip():", "        print(lines[i].strip())"] : ["    if lines[i].strip():", "        count += 1"];
      const start = p ? read : L(read, "count = 0");
      const end = p ? [] : ["print(count)"];
      const body = L(start, "while i < len(lines) and lines[i].strip() != marker:", ...act, ...tail, ...end);
      return {
        title: p ? "Until the Line" : "How Many Minutes",
        topic: "while over a file",
        task: [
          intro,
          p
            ? "Print the minutes: every line above the marker line, without its line break, in order. Leave out empty lines, and stop at the first marker line."
            : "Print how many lines with writing on them come before the first marker line, as one number. Empty lines don't count.",
          "If there's no marker line at all, the whole file is minutes.",
        ],
        data: { marker },
        files: { "minutes.txt": minutes },
        plan: ["Read the lines", "Walk them until the marker line"],
        body,
        variants: [
          { files: { "minutes.txt": "Bridge repairs on Monday\nThe well needs a bucket\n" }, note: "No marker line: it's all minutes." },
          { files: { "minutes.txt": `${marker}\nPip was here\n` }, note: "The marker is the very first line: no minutes at all." },
          { data: { marker: "END" }, files: { "minutes.txt": "Vote on the new fence\n\nEND\nhats for geese\nEND\n" }, note: "Two marker lines: stop at the first." },
        ],
        wrong: [
          L(start, "while lines[i].strip() != marker:", ...act, ...tail, ...end),
          L(start, "while i < len(lines) and lines[i].strip() != marker:", p ? "    print(lines[i].strip())" : "    count += 1", ...tail, ...end),
          L(start, "while i < len(lines):", "    if lines[i].strip() != marker:", ...act.map((l) => "    " + l), ...tail, ...end),
        ],
        hints: [
          "Walk the lines one at a time with your own counter, and keep going only while there are lines left and this one isn't the marker.",
          "`while n < len(eggs) and eggs[n] != \"cracked\":` stops at the first cracked egg, or at the end of the basket, whichever comes first. `f.readlines()` gives the lines as a list.",
          "`while i < len(lines) and lines[i].strip() ___ marker:` and inside, deal with the line, then `i += 1`.",
        ],
        needs: [["\\bwhile\\b", "This one is while-loop practice: let a while loop do the walking."]],
        advice: p ? "The minutes, one line each, no empty lines." : "One number: the lines of minutes.",
        codex: ["while", "files-lines"],
      };
    },
  },
];
