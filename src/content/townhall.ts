import type { Building } from "./types.ts";

// Town Hall: building 9, taught with files and CSV (SYLLABUS.md). Each challenge
// adds one stage of townhall.glb (art/specs/townhall.md, stage_01 … stage_14),
// so the building has exactly 14 challenges. Mayor Thistle arrives when the
// chapter opens and speaks lines that start with "Thistle: ".
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks.
//   variant(records={name: text}, gone=[names], swaps=[(old, new)], why="...")
//     runs the program again with other records in the folder (written fresh
//     before it starts, or removed) and other starting values, so typed-in
//     answers fail -> (variables, printed lines). A crash gives friendly feedback.
//   written(name, advice) -> the text of a file the program wrote
//   csv_rows(name, advice) -> that file's rows, read with the csv module
//   same(got, want, when) -> compares line lists and names the first difference
//   has_number(line, n) -> whether the whole number n appears in the line
const PRE = r`import csv as _csv
import re as _re

def variant(records=None, gone=(), swaps=(), why="other records"):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    pre = ""
    for name, text in (records or {}).items():
        pre = pre + "with open(" + repr(name) + ", 'w') as _pg_rec:\n    _pg_rec.write(" + repr(text) + ")\n"
    for name in gone:
        pre = pre + "__import__('os').remove(" + repr(name) + ")\n"
    try:
        return rerun(pre + v)
    except Exception as e:
        check(False, "With " + why + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". It has to work for any records, not just today's.")

def written(name, advice):
    try:
        with open(name) as _f:
            return _f.read()
    except FileNotFoundError:
        check(False, "There's no file called " + name + " in the folder. " + advice)

def csv_rows(name, advice):
    try:
        with open(name, newline="") as _f:
            return [row for row in _csv.reader(_f) if row]
    except FileNotFoundError:
        check(False, "There's no file called " + name + " in the folder. " + advice)

def same(got, want, when):
    nl = chr(10) + "  "
    for i in range(len(want)):
        if i >= len(got):
            check(False, when + ", line " + str(i + 1) + " is missing. It should be:" + nl + want[i])
        if got[i] != want[i]:
            check(False, when + ", line " + str(i + 1) + " should be:" + nl + want[i] + chr(10) + "but it is:" + nl + got[i])
    if len(got) > len(want):
        check(False, when + ", there should be " + str(len(want)) + " lines, but there are " + str(len(got)) + ". This one is extra:" + nl + got[len(want)])

def has_number(line, n):
    return _re.search(r"(?<![0-9])" + str(n) + r"(?![0-9])", line) is not None

def shows(got_lines, file_lines):
    printed = [l for l in got_lines if l.strip()]
    want = [l for l in file_lines if l.strip()]
    for i in range(len(printed) - len(want) + 1):
        if printed[i:i + len(want)] == want:
            return True
    return False

`;

// Starting records, shared by several challenges.
const SUMMONS = `By order of the King's envoy:
a charter hearing will be held in the valley
on Midsummer Eve, at noon.
The village must bring its records.
The Vane Trading Company will bring its claim.
Bring chairs.
`;

// Thistle's minutes as the player first sees them (th03), and as they stand
// a few days later (th06, th12).
const MINUTES = `1. Meeting opened by the Mayor. Present: the Mayor and one duck.
2. The duck was elected to the Committee for Ponds.
3. Motion to build a town hall. Carried, one vote to none, the Duck abstaining.
4. Bram asked whether the minutes needed to be this long. Minuted.
5. Wren proposed a weathervane on every roof. Referred to committee.
6. Pip hummed all the way through item six.
7. Item six was the duck's report on the pond.
8. Meeting closed, with a humbug for everyone who stayed.
`;

const MINUTES_LOG = MINUTES + `9. The walls are up. Lord Vane objected to the walls. Objection noted.
10. Our notice is pinned to the steps. Lord Vane's is in the bin.
`;

const REGISTER_TXT = `Bram
Wren
Marlo
Sable
Hazel
Ingrid
Odo
Mirela
Thistle
The Founder
`;

const LEDGER_TXT = `who,what,coins
Bram,stew for the envoy,12
Wren,flour,8
Sable,market fees,22
Hazel,bread for the envoy,16
Bram,a barrel of cider,15
Odo,fines for overdue books,3
Sable,more market fees,1
`;

const CENSUS = `household,people,chickens,cats
The Sleepy Serpent,4,0,1
The Whistling Mill,1,6,1
Fisher's Dock,1,0,3
Market Square,3,2,0
The Hearth Bakery,1,9,0
The Forge,2,0,1
The Library,1,0,2
The Apothecary,1,3,1
`;

export const TOWNHALL: Building = {
  id: "townhall",
  name: "Town Hall",
  blurb: "Where the village becomes a town.",
  villager: { name: "Thistle", model: "mayor", arrives: "start" },
  opening: [
    "Thistle: Ahem! AHEM. Is this thing on? Citizens of the valley! I am Thistle, and as of last night, I am your mayor.",
    "Thistle: Seven votes out of eight. A landslide! I've had the result carved on a turnip. Temporarily.",
    "Ssso we have a mayor. Pip voted too. Pip's vote was not counted. Pip has no hands, and apparently that matters.",
    "Thistle: And not a moment too soon. The King's envoy returns on Midsummer Eve to hear the charter case: Lord Vane's claim for the Company, against ours for the village.",
    "Thistle: A real town, says the King's letter, keeps proper records. Registers, minutes, ledgers, on paper, in order, where anyone may read them. I have kept minutes all my life. I've simply never kept them anywhere in particular.",
    "Then the rune stone will keep them! In Python, records live in **files**: text with a name, waiting in a folder. A program can open them, read them, and write new ones.",
    "Thistle: Paperwork! Against Lord Vane! He'll hate it. Or love it. With him it's hard to tell. Citizen founder, let's build a Town Hall!",
  ],
  finale: [
    "Midsummer Eve. The whole valley squeezed into the new hall: forty borrowed chairs, a barrel of Bram's cider, and a duck nobody invited.",
    "Lord Vane spoke first, for the Company. Forty pages, in triplicate. *No town, no charter; no charter, no valley.* Per regulation.",
    "Thistle: Ahem! The village calls its records. Citizen founder, the dossier, if you please.",
    "The envoy read every page. The register, the minutes (even item six), the ledger, the census, the petition, the dossier... and last of all, Ysolde's old charter from the iron box under the tower.",
    "Then Lord Vane asked to see the old charter. He read the names of its witnesses twice, very slowly. And he put down his pen.",
    "The Company's claim was withdrawn, for the record. Vane said the records were in order. He said *impeccably*. He said it as if it surprised him how little he minded.",
    "And the envoy pressed the King's seal into the wax. *Thunk.* The most satisfying thunk in three hundred years. We are a **Town**!",
    "Thistle: Citizens! From the balcony, a short speech. Nine pages. Ahem. ...No. Just this: thank you. This is a town because all of you turned up. Motion carried!",
    "The flag went up, the bell rang, and somebody painted the sign on the valley road fresh: TOWN. Pip watched it dry. Pip is not crying. Pip is a serpent.",
    "...Founder? Is it Pip, or has it gone cold? Look at the north hill. That grey. It's coming down the slope like a slow tide, and the lanterns are dimming as it comes.",
    "Pip is fine. Pip is just a little... faint. See-through at the edges. It's nothing. Stay near the stone tonight? Please. Pip doesn't want to go quiet.",
  ],
  chatDuring: [
    "Thistle: I've drafted my hearing speech. It opens with the founding of the valley and closes with the duck. The middle needs work. The middle is mostly duck.",
    "Thistle: Lord Vane sent me a form asking whether I'd received his previous form. I replied in the minutes. He'll have to attend a meeting to read them.",
    "Thistle: A file is just minutes that don't wander off, citizen. If I'd had files at the turnip committee, the turnips would be with us today.",
    "Thistle: Between us, I do worry. An old mayor, a new town. Then I see the records in their neat little rows and think: well. At least the paperwork believes in me.",
  ],
  chatAfter: [
    "Thistle: A Town, citizen! I've had it carved on a new turnip. Permanently, this time. Well. Until it sprouts.",
    "Thistle: The notice board's full already. Most of the notices are from Pip. 'Find Pip a hat.' I've filed it under urgent.",
    "Thistle: Lord Vane came by for a copy of the minutes. All of them. For the record, he says. I think he likes the duck.",
    "Thistle: I keep looking at the north hill. Don't tell Pip. A mayor is meant to gaze at the horizon bravely. I'm only managing the gazing.",
  ],
  chronicle: {
    title: "The Charter of Willowmere",
    text: [
      "In our ninth summer a rider came over the east ridge with a leather satchel and the King's own question: *is this a town?* I told him a town is people who agree to keep something together. He told me a town is paperwork. We were both right, and we spent a long week proving it.",
      "We wrote it all down, in the Old Tongue and in plain ink: every household, every hearth, every coin in the chest, and every promise we made each other at the hall door. The stones kept the records, and the records kept us honest. The rider said he had never read a village so clearly.",
      "The charter was signed by every hand in the valley and witnessed by our seven speakers, the best of us at the Old Tongue. I was so proud of them that day. I did not yet see that seven was far too few.",
      "I have sealed a copy in an iron box under the corner of the hall. If the paper is ever lost, let the stone remember: **Willowmere was a town, because its people said so, and wrote it down.**",
    ],
  },
  challenges: [
    {
      id: "th01-the-summons",
      part: "Survey stakes and plan",
      title: "The Summons",
      topic: "open and read()",
      cost: { wood: 4, stone: 2 },
      intro: [
        "Thistle: Ahem! Before a single stake goes in: the summons. A royal rider brought it this morning, sealed with so much wax it could stand up on its own.",
        "Pip unrolled it into the rune stone's folder, ssso now it's a **file** called `summons.txt`. You can open it under the task and see what's inside.",
        "To get at the words, `open` the file by its name, then ask it for `.read()`. The Learn tab shows how.",
      ],
      codex: ["files-reading", "strings"],
      quiz: {
        code: r`# (first, make a little file to read)
f = open("jar.txt", "w")
f.write("ab\ncd\n")
f.close()

f = open("jar.txt")
text = f.read()
f.close()
print(len(text))`,
        question: "What does this program show?",
        options: ["6", "4", "2", "5"],
        answer: 0,
        why: "Every character counts, line breaks included: a, b, \\n, c, d, \\n. That's 6.",
      },
      task: [
        "Read everything in `summons.txt` and print it, so Thistle can hear it read out.",
        "Then, on one more line, print how many characters the summons holds. The envoy counts everything, line breaks too.",
      ],
      starter: r`# The summons is waiting in the folder: summons.txt
# 1. Get the text out of the file and print it
# 2. Then a line with how many characters it holds
`,
      files: { "summons.txt": SUMMONS },
      tests: PRE + r`text = files["summons.txt"]
check("built-in method" not in out, "read is a method, so it needs its brackets: .read()")
check("TextIOWrapper" not in out, "That's the file itself being printed, not what's written in it. Ask the file for its text with .read().")
got = [l for l in lines if l.strip()]
want = text.splitlines()
check(len(got) > 0, "Nothing was printed yet. Open summons.txt, read it, and print what's inside.")
check(got[:len(want)] == want, "Print the summons exactly as it is in the file, every line in order, before anything else.")
check(len(got) > len(want), "After the summons, print one more line: how many characters it holds.")
check(len(got) == len(want) + 1, "Just one line after the summons, please: the number of characters.")
check(not (has_number(got[-1], 0) and not has_number(got[-1], len(text))), "Your count is 0: the file had already been read to the end, so a second .read() found nothing left. Keep the text in a variable, and use that variable for both jobs.")
check(not has_number(got[-1], len("summons.txt")),"11 is how long the file's name is. Count the text you read from inside the file.")
check(has_number(got[-1], len(text)), "The last line should hold how many characters are in the summons. Count the text you read, line breaks and all, with len().")
other = "By order of the Mayor:" + chr(10) + "bring humbugs." + chr(10)
vns, vlines = variant({"summons.txt": other}, why="a different summons in the folder")
vgot = [l for l in vlines if l.strip()]
check(vgot[:2] == ["By order of the Mayor:", "bring humbugs."], "When summons.txt holds a different summons, your program still prints the old one. Print the text you read from the file, not a copy typed into your program.")
check(len(vgot) == 3 and has_number(vgot[-1], len(other)), "With a different summons, the count should change too. Work it out with len() on the text you read.")`,
      hints: [
        "Two steps: first get the text out of the file and into a variable, then use that variable twice, once to print and once to count. You already know a tool that counts the characters in a string.",
        "`open(\"pantry.txt\")` gives you the file, and `.read()` on it gives you its text. `len()` works on any string, including one that came out of a file.",
        "`text = open(\"summons.txt\").read()` keeps the words in a variable. Print that variable, then measure it with `len()`: the text, not the file and not its name.",
      ],
      solution: r`f = open("summons.txt")
text = f.read()
f.close()
print(text)
print(f"The summons holds {len(text)} characters.")`,
      wrong: [r`f = open("summons.txt")
print(f)
print(len(f.read()))
f.close()`, r`f = open("summons.txt")
text = f.read
f.close()
print(text)`, r`print("By order of the King's envoy:")
print("a charter hearing will be held in the valley")
print("on Midsummer Eve, at noon.")
print("The village must bring its records.")
print("The Vane Trading Company will bring its claim.")
print("Bring chairs.")
print(199)`, r`f = open("summons.txt")
text = f.read()
f.close()
print(text)
print(len("summons.txt"))`, r`f = open("summons.txt")
text = f.read()
f.close()
print(text)
print(text.count("\n"), "lines")`],
      done: "Thistle: Stakes in, string pulled tight, and the summons read aloud twice. *Bring chairs.* I do like an envoy who thinks of the chairs.",
    },
    {
      id: "th02-roll-call",
      part: "Stone plinth and floor",
      title: "The Roll Call",
      topic: "reading line by line",
      cost: { wood: 0, stone: 8 },
      intro: [
        "Thistle: The plinth goes down, and out comes the register: every citizen of the valley, in my own hand. My quill ran dry now and then. You'll see the gaps.",
        "Thistle: The envoy will want a proper roll call. Numbered! Nothing says *real town* like a number.",
        "A `for` loop can walk through a file one **line** at a time. Each line still has its line break `\\n` stuck on the end, though. Watch what `print` does with that.",
      ],
      codex: ["files-lines", "files-reading"],
      quiz: {
        code: r`f = open("pets.txt", "w")
f.write("cat\ndog\n")
f.close()
f = open("pets.txt")
for line in f:
    print(line)
f.close()`,
        question: "What does this program show?",
        options: ["cat\n\ndog", "cat\ndog", "catdog", "cat dog"],
        answer: 0,
        why: "Each line from the file ends with \\n, and print adds a line break of its own, so there's an empty line after each pet.",
      },
      task: [
        "Read the roll call out of `register.txt`: one line per citizen, numbered from 1, with a full stop after the number. A register with only Pip on it would print `1. Pip`.",
        "Where the quill ran dry there are empty lines. Skip them, and don't give them a number.",
        "No gaps between the names, no stray spaces around them, and nothing else printed.",
      ],
      starter: r`# The register is waiting in the folder: register.txt
# Read it one line at a time and print a numbered roll call.
`,
      files: { "register.txt": "Bram\nWren\nMarlo\n\nSable\n  Hazel\nIngrid\n\nOdo\nMirela   \nThistle\nThe Founder\n" },
      tests: PRE + r`def roll(text):
    want = []
    for raw in text.splitlines():
        if raw.strip():
            want.append(str(len(want) + 1) + ". " + raw.strip())
    return want

def look(got, when):
    check(len(got) > 0, when + ", nothing was printed. Read the register and print the roll call.")
    check("" not in got, when + ", there are empty lines in your roll call. Each line from the file still carries its line break \\n, and print adds another. Take it off before printing.")
    for l in got:
        check(_re.match(r"^[0-9]+\.?$", l) is None, when + ", an empty line got a number of its own: " + l + chr(10) + "Skip the lines with no name on them (a line of only spaces has no name either), and don't count them.")

want = roll(files["register.txt"])
look(lines, "With today's register")
check("TextIOWrapper" not in out, "That's the file object being printed. Loop over it to get its lines.")
names = [l.split(". ", 1)[-1] for l in lines]
check(not any(n.startswith(" ") for n in names), "Some names still have spaces in front of them. Strip each line before you print it.")
if [n.strip() for n in names] == [w.split(". ", 1)[1] for w in want] and lines != want:
    check(False, "The names are right, but the numbers aren't: count 1, 2, 3, ... with a counter of your own that only goes up for a real name.")
same(lines, want, "With today's register")
other = chr(10) + "Nettle" + chr(10) + "Briar  " + chr(10) + "   " + chr(10) + "Thorn" + chr(10) + "Hollyhock"
vns, vlines = variant({"register.txt": other}, why="a different register in the folder")
look(vlines, "With a different register (one that starts with an empty line and has a line of only spaces)")
check(vlines[-1:] != ["4. Hollyhoc"], "The last name lost its last letter! The final line of a file doesn't always end with \\n, so strip the line instead of cutting off its last character.")
same(vlines, roll(other), "With a different register")`,
      hints: [
        "For each line, ask two questions: is there a name on it at all, and if so, what number is it? The number has to be a counter of your own, because the empty lines don't count.",
        "`for line in f:` gives one line per round, `\\n` and all. `line.strip()` takes that off (and any spaces at the ends). An empty line strips down to `\"\"`, which counts as False, and `continue` skips to the next round.",
        "The heart of the loop is `name = line.strip()`, then `if not name: continue`. What has to happen to your counter after that, and before the print? (It starts at 0, before the loop.)",
      ],
      solution: r`number = 0
f = open("register.txt")
for line in f:
    name = line.strip()
    if not name:
        continue
    number += 1
    print(f"{number}. {name}")
f.close()`,
      wrong: [r`f = open("register.txt")
for i, line in enumerate(f, 1):
    print(f"{i}. {line}")
f.close()`, r`f = open("register.txt")
for i, line in enumerate(f, 1):
    if line.strip():
        print(f"{i}. {line.strip()}")
f.close()`, r`number = 0
f = open("register.txt")
for line in f:
    if line == "\n":
        continue
    number += 1
    print(f"{number}. {line.strip()}")
f.close()`, r`number = 0
f = open("register.txt")
for line in f:
    name = line[:-1]
    if not name:
        continue
    number += 1
    print(f"{number}. {name}")
f.close()`, r`names = ["Bram", "Wren", "Marlo", "Sable", "Hazel", "Ingrid", "Odo", "Mirela", "Thistle"]
for i, name in enumerate(names, 1):
    print(f"{i}. {name}")`],
      done: "Thistle: A plinth of good grey stone and a roll call with no gaps in it. Every citizen present and numbered. I may have it framed.",
    },
    {
      id: "th03-minutes",
      part: "Ground floor walls",
      title: "Minutes of Everything",
      topic: "counting lines and words",
      cost: { wood: 1, stone: 9 },
      intro: [
        "Thistle: The walls are rising, and Lord Vane has sent his first objection. Ahem. He says my minutes *cannot possibly be real, as nobody attends that many meetings.*",
        "Thistle: I attended them! Several were just me and a duck. The duck made some very good points.",
        "The envoy's clerk wants three numbers about the minutes: how many entries, how many words, and how many entries mention the duck. Pip would also like to know about the duck.",
      ],
      codex: ["files-lines", "string-methods"],
      quiz: {
        code: r`text = "one\ntwo\n"
pieces = text.split("\n")
print(len(pieces))`,
        question: "What does this program show?",
        options: ["3", "2", "1", "6"],
        answer: 0,
        why: "The text ends with a line break, so split cuts once more and leaves an empty piece at the end: ['one', 'two', ''].",
      },
      task: [
        "From `minutes.txt` work out three numbers: how many entries there are (one per line), how many words there are in all, and how many entries mention the duck, whatever capitals it's written with.",
        "Print them as three lines, in that order, labelled `Entries:`, `Words:` and `Duck entries:`.",
      ],
      starter: r`# Thistle's minutes are in the folder: minutes.txt
# Three numbers: entries, words, and entries that mention the duck.
`,
      files: { "minutes.txt": MINUTES },
      tests: PRE + r`def facts(text):
    entries = 0
    words = 0
    ducks = 0
    quacks = 0
    for raw in text.splitlines():
        if raw.strip():
            entries += 1
            words += len(raw.split())
            if "duck" in raw.lower():
                ducks += 1
            quacks += raw.lower().count("duck")
    return entries, words, ducks, quacks

def report(got, when):
    nums = []
    for label in ["Entries", "Words", "Duck entries"]:
        found = [l for l in got if l.startswith(label + ":")]
        check(len(found) == 1, when + ", print one line that starts with " + label + ":")
        try:
            nums.append(int(found[0][len(label) + 1:]))
        except ValueError:
            check(False, "After " + label + ": put just the number, so the clerk can read it.")
    return nums

def judge(text, got, when):
    entries, words, ducks, quacks = facts(text)
    e, w, d = report(got, when)
    check(e != entries + 1, when + ", you counted one entry too many. The file ends with a line break, and splitting on it leaves an empty piece at the end. Count only lines with words on them.")
    check(e == entries, when + ", there are " + str(entries) + " entries (one per line), but you counted " + str(e) + ".")
    check(w != len(text) and w != len(text) - entries, when + ", that's a count of characters, not words. Cut each line into its words first, then count them.")
    check(w == words, when + ", the word count is off: you have " + str(w) + ". Add up the words of every entry. split() cuts a line into words at the spaces.")
    check(not (d == quacks and quacks != ducks), when + ", one entry mentions the duck twice, but it's still only one entry. Count entries that mention the duck, not every quack.")
    check(d == ducks, when + ", your duck count is " + str(d) + ". Is one of the ducks written in capitals? Compare in one kind of letters.")

text = files["minutes.txt"]
judge(text, lines, "With today's minutes")
entries, words, ducks, quacks = facts(text)
expect_lines(["Entries: " + str(entries), "Words: " + str(words), "Duck entries: " + str(ducks)])
other = "The DUCK called the meeting to order." + chr(10) + chr(10) + "Present: the Mayor, the duck, and the duck's cousin." + chr(10) + "Nobody else came." + chr(10)
vns, vlines = variant({"minutes.txt": other}, why="different minutes in the folder")
judge(other, vlines, "With different minutes")`,
      hints: [
        "One walk through the file can collect all three numbers at once. Before you start: how many counters do you need, and when does each one go up?",
        "`line.split()` cuts a line into a list of words, so `len(line.split())` is that line's word count. `\"cat\" in words.lower()` finds a cat however it was capitalised.",
        "Three counters start at 0 before the loop. One line of the loop is `words += len(line.split())`. The duck needs an `if` that looks for `\"duck\"` in a lowercase copy of the line. And the third counter?",
      ],
      solution: r`entries = 0
words = 0
ducks = 0
f = open("minutes.txt")
for line in f:
    if not line.strip():
        continue
    entries += 1
    words += len(line.split())
    if "duck" in line.lower():
        ducks += 1
f.close()
print(f"Entries: {entries}")
print(f"Words: {words}")
print(f"Duck entries: {ducks}")`,
      wrong: [r`f = open("minutes.txt")
text = f.read()
f.close()
entries = len(text.split("\n"))
words = len(text.split())
ducks = 0
for line in text.split("\n"):
    if "duck" in line.lower():
        ducks += 1
print(f"Entries: {entries}")
print(f"Words: {words}")
print(f"Duck entries: {ducks}")`, r`entries = 0
words = 0
ducks = 0
f = open("minutes.txt")
for line in f:
    entries += 1
    words += len(line)
    if "duck" in line.lower():
        ducks += 1
f.close()
print(f"Entries: {entries}")
print(f"Words: {words}")
print(f"Duck entries: {ducks}")`, r`entries = 0
words = 0
ducks = 0
f = open("minutes.txt")
for line in f:
    entries += 1
    words += len(line.split())
    if "duck" in line:
        ducks += 1
f.close()
print(f"Entries: {entries}")
print(f"Words: {words}")
print(f"Duck entries: {ducks}")`, r`entries = 0
words = 0
ducks = 0
f = open("minutes.txt")
for line in f:
    entries += 1
    words += len(line.split())
    ducks += line.lower().count("duck")
f.close()
print(f"Entries: {entries}")
print(f"Words: {words}")
print(f"Duck entries: {ducks}")`, r`print("Entries: 8")
print("Words: 89")
print("Duck entries: 4")`],
      done: "Thistle: Real numbers, from real minutes! I'll send them to Lord Vane with a covering note. And a feather, so the duck is represented.",
    },
    {
      id: "th04-the-notice",
      part: "Steps and lantern pedestals",
      title: "Pin Up the Notice",
      topic: "writing a file",
      cost: { wood: 0, stone: 7 },
      intro: [
        "Lord Vane has pinned a notice to the plan board. It's in the folder as `notice.txt`. It says the valley belongs to the Company, and that trespassers *will be issued a form*.",
        "Thistle: Ahem. The steps of a town hall are where a town's notices go. Ours, not his. We shall write our own notice right over the top of it.",
        "Open a file with `\"w\"` (write) and it starts fresh and empty, even if something was in it before. Then `.write()` puts your text in. Careful: `write` never adds a line break for you.",
      ],
      codex: ["files-writing", "files-reading"],
      quiz: {
        code: r`f = open("list.txt", "w")
f.write("eggs")
f.write("milk")
f.close()
f = open("list.txt")
print(f.read())
f.close()`,
        question: "What does this program show?",
        options: ["eggsmilk", "eggs\nmilk", "eggs milk", "milk"],
        answer: 0,
        why: "write puts in exactly what it's given. Neither piece had a \\n, so they run together on one line.",
      },
      task: [
        "Write the town's notice into `notice.txt`, three lines: the title, then the day, then a line saying how many seats there are (the number and the word seats).",
        "Lord Vane's notice must be gone.",
        "When you've finished writing, close the file, then open it again, read it and print it, so you can see what's really pinned up.",
      ],
      starter: r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40          # chairs Thistle has borrowed so far

# 1. Write the town's notice into notice.txt
# 2. Read it back and print it
`,
      files: { "notice.txt": "NOTICE: This valley is the property of the Vane Trading Company.\nTrespassers will be issued a form.\n" },
      tests: PRE + r`def notice(when, title, day, seats):
    content = written("notice.txt", "Open it for writing and put the notice in.")
    check(content != "", when + ", notice.txt is empty! What you write waits in a basket until the file is closed, and yours never was. Finish with .close().")
    check("Vane" not in content, when + ", Lord Vane's notice is still pinned up. Open notice.txt for writing with \"w\": that starts it fresh.")
    got = content.splitlines()
    if len(got) == 1:
        check(not (title in got[0] and day in got[0]), when + ", the whole notice is on one line. write() never adds a line break: end each line with \\n yourself.")
        check(False, when + ", only one line of the notice made it. Opening a file with \"w\" empties it each time, so open it once, write all three lines, and then close it.")
    check(len(got) == 3, when + ", the notice should have exactly three lines, but it has " + str(len(got)) + ".")
    check(got[0] == title, when + ", the first line of the notice should be the title, as it is in the variable title.")
    check(got[1] == day, when + ", the second line should be the day, as it is in the variable day.")
    check(has_number(got[2], seats) and "seat" in got[2].lower(), when + ", the third line should say how many seats there are: " + str(seats) + " and the word seats. Use the variable seats, not a number you typed.")
    return got

got = notice("Today", "CHARTER HEARING", "Midsummer Eve, at noon", 40)
printed = [l for l in lines if l.strip()]
found = False
for i in range(len(printed)):
    if printed[i:i + 3] == got:
        found = True
check(src.count("open(") >= 2, "Open notice.txt a second time and read it back: print what's really in the file, not your variables.")
check(found, "Now open notice.txt again, read it, and print what's in it, to see what's really pinned up.")
vns, vlines = variant(swaps=[("seats = 40", "seats = 25"), ('day = "Midsummer Eve, at noon"', 'day = "Midsummer Day, at dawn"')], why="25 seats and a different day")
notice("With 25 seats and the day changed to Midsummer Day", "CHARTER HEARING", "Midsummer Day, at dawn", 25)`,
      hints: [
        "Think of it in two halves: open, write and close; then open again and read. Every line you write needs its own line break at the end.",
        "`f = open(\"jam.txt\", \"w\")`, then `f.write(\"Strawberry\\n\")` for each line, then `f.close()`. `write` only takes text, so build the seats line with an f-string.",
        "The seats line is the only tricky one: an f-string with `{seats}` in it and `\\n` on the end. After `f.close()`, open the file again with no mode and read it, the way you read the summons.",
      ],
      solution: r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write(title + "\n")
f.write(day + "\n")
f.write(f"{seats} seats for citizens\n")
f.close()

f = open("notice.txt")
print(f.read())
f.close()`,
      wrong: [r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write(title + "\n")
f.write(day + "\n")
f.write(f"{seats} seats for citizens\n")

g = open("notice.txt")
print(g.read())
g.close()`, r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write(title)
f.write(day)
f.write(f"{seats} seats")
f.close()

f = open("notice.txt")
print(f.read())
f.close()`, r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

open("notice.txt", "w").write(title + "\n")
open("notice.txt", "w").write(day + "\n")
open("notice.txt", "w").write(f"{seats} seats\n")

f = open("notice.txt")
print(f.read())
f.close()`, r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write("CHARTER HEARING\n")
f.write("Midsummer Eve, at noon\n")
f.write("40 seats\n")
f.close()

f = open("notice.txt")
print(f.read())
f.close()`, r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write(title + "\n")
f.write(day + "\n")
f.write(f"{seats} seats\n")
f.close()`, r`title = "CHARTER HEARING"
day = "Midsummer Eve, at noon"
seats = 40

f = open("notice.txt", "w")
f.write(title + "\n")
f.write(day + "\n")
f.write(seats)
f.close()`],
      done: "Our notice is up, and Lord Vane's is in the bin. Lord Vane read ours very closely and said it was *adequately formatted*. Pip thinks that's the nicest thing he's ever said.",
    },
    {
      id: "th05-the-oath",
      part: "Great door and windows",
      title: "The Oath at the Door",
      topic: "with",
      cost: { wood: 7, stone: 1 },
      intro: [
        "Thistle: The great door! On hearing day every citizen will say the town oath as they come through it. I wrote the oath last night. I was very excited.",
        "Thistle: Ahem. I may have started a few of the lines with *Ahem!* It's a habit. An oath must not clear its throat.",
        "From now on, let Python close your files for you: `with open(...) as f:` opens the file, runs the indented lines, and closes it the moment the block ends. No forgotten `close()`, ever.",
      ],
      codex: ["with", "files-writing", "indexing"],
      quiz: {
        code: r`with open("bag.txt", "w") as bag:
    bag.write("apples\n")
print(bag.closed)`,
        question: "What does this program show?",
        options: ["True", "False", "apples", "ValueError"],
        answer: 0,
        why: "The with block closed the file as soon as it ended, so by the print it's closed. Asking whether it's closed is fine; reading from it would be the error.",
      },
      task: [
        "Make a clean copy of Thistle's draft in a new file, `oath.txt`: the same lines in the same order, except that a line starting with `Ahem! ` loses it (the space too).",
        "Only an *Ahem!* at the very start of a line goes. Anywhere else it's part of the oath.",
        "Open every file with `with`. Then print how many lines needed fixing.",
      ],
      starter: r`# The draft is in the folder: oath_draft.txt
# Write the clean oath into oath.txt, using with for every file.
`,
      files: { "oath_draft.txt": `Ahem! We will keep our records open to all.
We will write things down, and read them back.
Ahem! We will welcome every newcomer to the valley.
Ahem! We will mend what breaks, together.
We will be kind to ducks.
` },
      tests: PRE + r`def cleaned(text):
    keep = []
    fixed = 0
    for raw in text.splitlines():
        if raw.startswith("Ahem! "):
            keep.append(raw[6:])
            fixed += 1
        else:
            keep.append(raw)
    return keep, fixed

def judge(draft, got_lines, when):
    content = written("oath.txt", "Write the clean oath into a new file called oath.txt.")
    want, fixed = cleaned(draft)
    got = content.splitlines()
    check(len(got) > 1, when + ", the whole oath is on one line of oath.txt. Each line you write needs its line break: strip it off and you have to add \\n back.")
    check(len(got) == len(want), when + ", the oath should have " + str(len(want)) + " lines, the same as the draft, but oath.txt has " + str(len(got)) + ". Every line of the draft goes into the copy, fixed or not.")
    for i in range(len(want)):
        if got[i] == want[i]:
            continue
        check(got[i] != " " + want[i], when + ", line " + str(i + 1) + " still starts with a space. \"Ahem! \" is six characters, counting its space.")
        check(not got[i].startswith("Ahem"), when + ", line " + str(i + 1) + " still clears its throat: " + got[i])
        check(got[i] != want[i].replace("Ahem! ", ""), when + ", line " + str(i + 1) + " lost an Ahem! from the middle. Only an Ahem! at the very start of a line goes; anywhere else it's part of the oath.")
        check(False, when + ", line " + str(i + 1) + " of oath.txt should match line " + str(i + 1) + " of the draft (minus an Ahem! at the start), but it is:" + chr(10) + "  " + got[i])
    check(any(has_number(l, fixed) for l in got_lines), when + ", " + str(fixed) + " lines needed fixing. Print that count, worked out as you go.")

for line in src.splitlines():
    if "open(" in line:
        check(line.strip().startswith("with "), "Open every file with a with block this time: with open(...) as name:")
judge(files["oath_draft.txt"], lines, "Today")
other = "Ahem! We will plant a tree for every new citizen." + chr(10) + "The Mayor may say Ahem! as often as the Mayor likes." + chr(10) + "Ahem! We will keep the minutes short."
vns, vlines = variant({"oath_draft.txt": other}, why="a different draft in the folder")
judge(other, vlines, "With a different draft")`,
      hints: [
        "Go through the draft line by line. For each line there's one question: does it start with the throat-clearing? The answer decides what gets written. Count the yeses as you go.",
        "`line.startswith(\"Psst \")` answers that question, and a slice like `line[5:]` drops the first five characters. One `with` block can sit inside another, so you can read from one file while you write into the other.",
        "Inside the loop there's one decision: `if line.startswith(\"Ahem! \"):`. In that branch, write the line from character ___ onwards and add 1 to your count; otherwise write the line just as it is.",
      ],
      solution: r`fixed = 0
with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            if line.startswith("Ahem! "):
                clean.write(line[6:])
                fixed += 1
            else:
                clean.write(line)
print(f"Lines fixed: {fixed}")`,
      wrong: [r`fixed = 0
with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            if "Ahem! " in line:
                fixed += 1
            clean.write(line.replace("Ahem! ", ""))
print(f"Lines fixed: {fixed}")`, r`fixed = 0
with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            if line.startswith("Ahem!"):
                clean.write(line[5:])
                fixed += 1
            else:
                clean.write(line)
print(f"Lines fixed: {fixed}")`, r`fixed = 0
with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            line = line.strip()
            if line.startswith("Ahem! "):
                line = line[6:]
                fixed += 1
            clean.write(line)
print(f"Lines fixed: {fixed}")`, r`fixed = 0
draft = open("oath_draft.txt")
clean = open("oath.txt", "w")
for line in draft:
    if line.startswith("Ahem! "):
        clean.write(line[6:])
        fixed += 1
    else:
        clean.write(line)
draft.close()
clean.close()
print(f"Lines fixed: {fixed}")`, r`fixed = 0
with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            if line.startswith("Ahem! "):
                clean.write(line[6:])
                fixed += 1
print(f"Lines fixed: {fixed}")`, r`with open("oath_draft.txt") as draft:
    with open("oath.txt", "w") as clean:
        for line in draft:
            if line.startswith("Ahem! "):
                clean.write(line[6:])
            else:
                clean.write(line)
print("Lines fixed: 3")`],
      done: "Thistle: *We will mend what breaks, together.* Not one ahem in it. I read it aloud through the new door, and my voice hardly wobbled at all.",
    },
    {
      id: "th06-minuted",
      part: "Upper floor frame",
      title: "Minuted!",
      topic: "appending",
      cost: { wood: 9, stone: 0 },
      intro: [
        "Thistle: The upper floor is framed! That's minute-worthy. Everything is minute-worthy, but this especially.",
        "Thistle: My minutes are numbered, citizen, one entry per line, and today's must carry on where the last one left off. Never start again at one. Starting again at one is how you lose a duck.",
        "Opening with `\"w\"` would wipe out every old entry. Open with `\"a\"` (append) instead, and whatever you write goes on the end.",
      ],
      codex: ["files-writing", "with", "files-lines"],
      quiz: {
        code: r`with open("log.txt", "w") as f:
    f.write("A\n")
with open("log.txt", "a") as f:
    f.write("B\n")
with open("log.txt", "w") as f:
    f.write("C\n")
with open("log.txt") as f:
    print(f.read())`,
        question: "What does this program show?",
        options: ["C", "A\nB\nC", "B\nC", "A\nC"],
        answer: 0,
        why: "\"a\" added B after A, but the last open used \"w\", which emptied the file before writing C.",
      },
      task: [
        "Add each of today's entries to the end of `minutes.txt` as a new numbered line, with the numbers carrying on from the last entry already there.",
        "Every old entry must still be there, exactly as it was.",
        "Then print the whole minutes, old entries and new.",
      ],
      starter: r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

# 1. Find out how many entries the minutes already have
# 2. Add today's entries to the end of minutes.txt, numbered on from there
# 3. Print the whole minutes
`,
      files: { "minutes.txt": MINUTES_LOG },
      tests: PRE + r`def after(old, today):
    n = len([l for l in old.splitlines() if l.strip()])
    new = []
    for entry in today:
        n += 1
        new.append(str(n) + ". " + entry)
    return new

def judge(old, today, got_lines, when):
    content = written("minutes.txt", "The minutes should still be called minutes.txt.")
    first = old.splitlines()[0]
    check(first in content, when + ", the old minutes are gone! \"w\" empties a file before it writes. Which mode adds to the end instead?")
    check(content.startswith(old), when + ", the old entries have changed. Leave them exactly as they were, and only add to the end.")
    new = content[len(old):].splitlines()
    want = after(old, today)
    check(len(new) > 0, when + ", nothing was added to the end of minutes.txt.")
    check("" not in new, when + ", there's an empty line among today's entries. The old minutes already end with a line break, so put \\n at the end of each new entry, not the start.")
    check(len(new) == len(want), when + ", " + str(len(want)) + " new entries should go on the end, one line each, but there are " + str(len(new)) + " new lines.")
    check(not new[0].startswith("1. "), when + ", today's entries started again at 1. Count the entries already in the file, and carry on from there.")
    same(new, want, when + ", among the new entries")
    whole = content.splitlines()
    check(shows(got_lines, whole), when + ", print the whole minutes after adding to them, every line, old and new, just as they are in the file.")

judge(files["minutes.txt"], ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."], lines, "Today")
nl = chr(10)
eleven = ""
for i in range(1, 12):
    eleven = eleven + str(i) + ". Item " + str(i) + " was about the duck." + nl
vns, vlines = variant({"minutes.txt": eleven}, why="eleven entries in the minutes")
judge(eleven, ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."], vlines, "With eleven entries already in the minutes")
two = "1. Meeting opened." + nl + "2. Meeting closed." + nl
three = ["Bram brought soup.", "Hazel brought bread.", "The duck brought nothing."]
vns, vlines = variant({"minutes.txt": two}, swaps=[('today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]', 'today = ["Bram brought soup.", "Hazel brought bread.", "The duck brought nothing."]')], why="two old entries and three new ones")
judge(two, three, vlines, "With two old entries and three new ones")`,
      hints: [
        "First count, then write. How many entries are there already? That tells you the number of the first new one. The counting and the adding are two separate visits to the file.",
        "Count the lines the way you counted the minutes before. Then `with open(\"diary.txt\", \"a\") as f:` adds to the end; inside it, a `for` loop over the new entries writes one numbered line each, `\\n` on the end.",
        "Two blocks: one `with` that counts the entries already there, then `with open(\"minutes.txt\", \"a\") as f:` and a loop over `today`. In each round, what must happen to the number before its line is written? Last, open the file a third time to print it.",
      ],
      solution: r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

count = 0
with open("minutes.txt") as f:
    for line in f:
        if line.strip():
            count += 1

number = count
with open("minutes.txt", "a") as f:
    for entry in today:
        number += 1
        f.write(f"{number}. {entry}\n")

with open("minutes.txt") as f:
    print(f.read())`,
      wrong: [r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

count = 0
with open("minutes.txt") as f:
    for line in f:
        count += 1

number = count
with open("minutes.txt", "w") as f:
    for entry in today:
        number += 1
        f.write(f"{number}. {entry}\n")

with open("minutes.txt") as f:
    print(f.read())`, r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

number = 0
with open("minutes.txt", "a") as f:
    for entry in today:
        number += 1
        f.write(f"{number}. {entry}\n")

with open("minutes.txt") as f:
    print(f.read())`, r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

number = 10
with open("minutes.txt", "a") as f:
    for entry in today:
        number += 1
        f.write(f"{number}. {entry}\n")

with open("minutes.txt") as f:
    print(f.read())`, r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

count = 0
with open("minutes.txt") as f:
    for line in f:
        count += 1

number = count
with open("minutes.txt", "a") as f:
    for entry in today:
        number += 1
        f.write(f"\n{number}. {entry}")

with open("minutes.txt") as f:
    print(f.read())`, r`today = ["The upper floor is framed.", "Ingrid says the joists are straight. Marlo says they are nearly straight."]

count = 0
with open("minutes.txt") as f:
    for line in f:
        count += 1

number = count
with open("minutes.txt", "a") as f:
    for entry in today:
        number += 1
        f.write(f"{number}. {entry}\n")`],
      done: "Thistle: Entries eleven and twelve, right where they belong, and not a duck lost. And the upper floor is up! Motion carried.",
    },
    {
      id: "th07-roll-of-buildings",
      part: "Plaster infill",
      title: "The Roll of Buildings",
      topic: "writing lines in a loop",
      cost: { wood: 2, stone: 5 },
      intro: [
        "Thistle: Plaster between the timbers, and between us and the Company, a Roll of Buildings: every building in the valley and who keeps it. The charter asks for eight at least.",
        "A loop can write as many lines as you like: one `write` per round, each with its `\\n`. Pip has counted the buildings. Twice. Pip got eight both times, which is a record.",
      ],
      codex: ["files-writing", "with", "string-methods"],
      quiz: {
        code: r`for word in ["oak", "ash", "elm"]:
    with open("trees.txt", "w") as f:
        f.write(word + "\n")
with open("trees.txt") as f:
    print(f.read())`,
        question: "What does this program show?",
        options: ["elm", "oak\nash\nelm", "oak", "oakashelm"],
        answer: 0,
        why: "The file is opened with \"w\" inside the loop, so every round empties it before writing. Only the last tree is left.",
      },
      task: [
        "Write `roll.txt` with one line per building, in the dictionary's order: the building's name with capitals, like a sign, then its keeper. A town well kept by Pip would read `Town Well, kept by Pip`.",
        "After the buildings, one last line saying how many there are in all, for example `5 buildings in all`. Get the wording right even if there were only one.",
        "Then read `roll.txt` back and print it.",
      ],
      starter: r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

# Write roll.txt, then read it back and print it.
`,
      tests: PRE + r`def roll(keepers):
    want = []
    for b, k in keepers.items():
        want.append(b.title() + ", kept by " + k)
    n = len(keepers)
    if n == 1:
        want.append("1 building in all")
    else:
        want.append(str(n) + " buildings in all")
    return want

def judge(keepers, got_lines, when):
    content = written("roll.txt", "Write the roll into a file called roll.txt.")
    got = content.splitlines()
    want = roll(keepers)
    check(len(got) > 0, when + ", roll.txt is empty.")
    check(not (len(got) == 1 and got[0].count("kept by") > 1), when + ", the whole roll is on one line. End every line you write with \\n.")
    check(len(got) > 2 or len(want) <= 2, when + ", only the last building made it into roll.txt. Opening a file with \"w\" empties it, so open it once, before the loop, not in every round.")
    check(not any(l[:1].islower() for l in got), when + ", some buildings have no capitals. A sign needs them: there's a string method that capitalises every word.")
    check(not (want[-1] == "1 building in all" and got[-1] == "1 buildings in all"), when + ", it's 1 building, not 1 buildings. Choose the word with an if.")
    check(len(got) == len(want), when + ", roll.txt should have " + str(len(want)) + " lines (one per building, then the total), but it has " + str(len(got)) + ".")
    for i in range(len(want)):
        check(not (got[i] != want[i] and got[i].lower() == want[i].lower()), when + ", " + got[i] + ": every word of a building's name needs its capital, like a sign.")
    same(got, want, when + ", in roll.txt")
    check(shows(got_lines, got), when + ", read roll.txt back and print it, every line just as it is in the file.")

check(src.count("open(") >= 2, "Read roll.txt back from the file and print it, so you see what was really written.")
judge({"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}, lines, "Today")
line = 'keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}'
three = {"town well": "Pip", "notice board": "Thistle", "bell": "Marlo"}
vns, vlines = variant(swaps=[(line, "keepers = " + repr(three))], why="three other buildings")
judge(three, vlines, "With three other buildings (some with two-word names)")
one = {"tavern": "Bram"}
vns, vlines = variant(swaps=[(line, "keepers = " + repr(one))], why="just one building")
judge(one, vlines, "With just one building")`,
      hints: [
        "Open the file once, before the loop, and write inside it. What has to happen once (opening the file, the last line) and what has to happen once per building?",
        "`for name, food in feeds.items():` walks a dictionary's pairs. Each round writes one line ending in `\\n`. `len()` of the dictionary says how many there are, and an if decides between one building and several.",
        "Inside the loop, one line per building: `f.write(f\"{___}, kept by {keeper}\\n\")`, where the blank is the building's name with its capitals. The total goes after the loop, with an if choosing between building and buildings.",
      ],
      solution: r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

with open("roll.txt", "w") as f:
    for building, keeper in keepers.items():
        f.write(f"{building.title()}, kept by {keeper}\n")
    if len(keepers) == 1:
        f.write("1 building in all\n")
    else:
        f.write(f"{len(keepers)} buildings in all\n")

with open("roll.txt") as f:
    print(f.read())`,
      wrong: [r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

for building, keeper in keepers.items():
    with open("roll.txt", "w") as f:
        f.write(f"{building.title()}, kept by {keeper}\n")
with open("roll.txt", "a") as f:
    f.write(f"{len(keepers)} buildings in all\n")

with open("roll.txt") as f:
    print(f.read())`, r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

with open("roll.txt", "w") as f:
    for building, keeper in keepers.items():
        f.write(f"{building}, kept by {keeper}\n")
    f.write(f"{len(keepers)} buildings in all\n")

with open("roll.txt") as f:
    print(f.read())`, r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

with open("roll.txt", "w") as f:
    for building, keeper in keepers.items():
        f.write(f"{building.title()}, kept by {keeper}")
    f.write(f"{len(keepers)} buildings in all")

with open("roll.txt") as f:
    print(f.read())`, r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

with open("roll.txt", "w") as f:
    for building, keeper in keepers.items():
        f.write(f"{building.title()}, kept by {keeper}\n")
    f.write("8 buildings in all\n")

with open("roll.txt") as f:
    print(f.read())`, r`keepers = {"tavern": "Bram", "mill": "Wren", "dock": "Marlo", "market": "Sable", "bakery": "Hazel", "forge": "Ingrid", "library": "Odo", "apothecary": "Mirela"}

with open("roll.txt", "w") as f:
    for building, keeper in keepers.items():
        f.write(f"{building.title()}, kept by {keeper}\n")
    f.write(f"{len(keepers)} buildings in all\n")

with open("roll.txt") as f:
    print(f.read())`],
      done: "Eight buildings, eight keepers, one roll. Pip read it out to the rune stone, and the rune stone glowed. Pip glowed a little too. Just a little.",
    },
    {
      id: "th08-town-chest",
      part: "Upper windows and balcony",
      title: "The Town Chest",
      topic: "records with split",
      cost: { wood: 8, stone: 1 },
      intro: [
        "Thistle: Ahem! The balcony, where I'll make my speech. But a speech needs facts, and the facts are in the town chest.",
        "Thistle: Sable keeps the ledger: every gift to the chest, one per line, with commas between the parts. The first line just names the columns. Very professional. Sable charged me for the ink.",
        "Each line is a **record**, and each piece between the commas is a **field**. `split(\",\")` cuts a record into its fields, and every field is a string, even the numbers.",
      ],
      codex: ["records", "parsing", "files-lines", "with"],
      quiz: {
        code: r`record = "Pip,rune stone,3"
name, home, naps = record.split(",")
print(naps + naps)`,
        question: "What does this program show?",
        options: ["33", "6", "naps", "TypeError"],
        answer: 0,
        why: "Fields cut out of text are text too, so \"3\" + \"3\" joins them into \"33\". int(naps) would give a number you can add.",
      },
      task: [
        "Read `ledger.txt` and work out how many coins are in the chest altogether, and who has given the most, adding up all of each person's gifts (some people gave more than once).",
        "Print two lines: `Chest: <coins> coins`, then `Most generous: <name> (<their coins> coins)`.",
      ],
      starter: r`# Sable's ledger is in the folder: ledger.txt
# 1. The chest's total
# 2. Each person's own total, and who gave the most
`,
      files: { "ledger.txt": LEDGER_TXT },
      tests: PRE + r`def chest(text):
    total = 0
    per = {}
    biggest = None
    big = -1
    for raw in text.splitlines()[1:]:
        if raw.strip():
            who, what, coins = raw.split(",")
            per[who] = per.get(who, 0) + int(coins)
            total += int(coins)
            if int(coins) > big:
                big = int(coins)
                biggest = who
    best = None
    for who in per:
        if best is None or per[who] > per[best]:
            best = who
    return ["Chest: " + str(total) + " coins", "Most generous: " + best + " (" + str(per[best]) + " coins)"], biggest, best

def judge(text, got, when):
    want, biggest, best = chest(text)
    check(len(got) > 0, when + ", nothing was printed.")
    check(any(l.startswith("Chest:") for l in got), when + ", print a line that starts with Chest: and gives the total coins.")
    chest_line = [l for l in got if l.startswith("Chest:")][0]
    check(chest_line == want[0], when + ", the chest's total isn't right: " + chest_line + ". Add up the coins field of every gift, as numbers.")
    check(any(l.startswith("Most generous:") for l in got), when + ", print a line that starts with Most generous: and names who gave the most.")
    gen = [l for l in got if l.startswith("Most generous:")][0]
    if biggest != best:
        check(not gen.startswith("Most generous: " + biggest + " "), when + ", " + biggest + " gave the biggest single gift, but someone else gave more altogether. Add up each person's gifts before you choose.")
    last = {}
    for raw in text.splitlines()[1:]:
        if raw.strip():
            who, what, coins = raw.split(",")
            last[who] = int(coins)
    lb = None
    for who in last:
        if lb is None or last[who] > last[lb]:
            lb = who
    if lb != best:
        check(not gen.startswith("Most generous: " + lb + " "), when + ", each new gift seems to replace that person's total instead of adding onto it.")
    check(gen.startswith("Most generous: " + best + " "), when + ", that's not who gave the most altogether. Add up each person's gifts, then compare the totals.")
    same(got, want, when)

judge(files["ledger.txt"], lines, "With today's ledger")
other = "who,what,coins" + chr(10) + "Marlo,fish for the feast,5" + chr(10) + "Ingrid,mended hinges,30" + chr(10) + "Marlo,more fish,9" + chr(10) + "Marlo,a lot more fish,18" + chr(10) + "Wren,flour,12" + chr(10)
vns, vlines = variant({"ledger.txt": other}, why="a different ledger in the folder")
judge(other, vlines, "With a different ledger")`,
      hints: [
        "Two jobs for every record: add its coins to the chest, and add them to that person's own total. A dictionary is good at *their own total*. Choose the most generous only after every line has been read.",
        "`name, item, price = line.strip().split(\",\")` unpacks a record into its three fields, and `int(price)` turns the price into a number. The first line is the column names: `f.readlines()[1:]` skips it.",
        "`totals[who] = totals.get(who, 0) + int(coins)` adds a gift onto that person's total. After the loop, walk `totals.items()` with a tracker that remembers two things whenever it meets a bigger total. Which two?",
      ],
      solution: r`chest = 0
totals = {}
with open("ledger.txt") as f:
    records = f.readlines()[1:]
for line in records:
    who, what, coins = line.strip().split(",")
    chest += int(coins)
    totals[who] = totals.get(who, 0) + int(coins)

best = ""
most = 0
for who, amount in totals.items():
    if amount > most:
        most = amount
        best = who

print(f"Chest: {chest} coins")
print(f"Most generous: {best} ({most} coins)")`,
      wrong: [r`chest = 0
totals = {}
with open("ledger.txt") as f:
    for line in f:
        who, what, coins = line.strip().split(",")
        chest += int(coins)
        totals[who] = totals.get(who, 0) + int(coins)
best = ""
most = 0
for who, amount in totals.items():
    if amount > most:
        most = amount
        best = who
print(f"Chest: {chest} coins")
print(f"Most generous: {best} ({most} coins)")`, r`chest = 0
best = ""
most = 0
with open("ledger.txt") as f:
    records = f.readlines()[1:]
for line in records:
    who, what, coins = line.strip().split(",")
    chest += int(coins)
    if int(coins) > most:
        most = int(coins)
        best = who
print(f"Chest: {chest} coins")
print(f"Most generous: {best} ({most} coins)")`, r`chest = 0
totals = {}
with open("ledger.txt") as f:
    records = f.readlines()[1:]
for line in records:
    who, what, coins = line.strip().split(",")
    chest += int(coins)
    totals[who] = int(coins)
best = ""
most = 0
for who, amount in totals.items():
    if amount > most:
        most = amount
        best = who
print(f"Chest: {chest} coins")
print(f"Most generous: {best} ({most} coins)")`, r`print("Chest: 77 coins")
print("Most generous: Bram (27 coins)")`],
      done: "Thistle: Bram, the most generous citizen in the valley! I'll mention it in the speech. Bram will pretend to be cross about it. Bram will be delighted.",
    },
    {
      id: "th09-the-petition",
      part: "The big roof",
      title: "Commas in the Petition",
      topic: "csv.reader",
      cost: { wood: 6, stone: 5 },
      intro: [
        "Thistle: The roof goes on, and the petition goes round: every citizen signs to say they want the charter. Odo copied it out for the envoy as a proper **CSV** file.",
        "Thistle: Some of the homes have commas in them. *The Sleepy Serpent, by the pond.* Odo put those in double quotes, which is how it's done, apparently.",
        "And that's where `split(\",\")` trips over its own tail: it cuts at every comma, even inside the quotes. The `csv` module knows the quoting rules. `import csv`, and `csv.reader` hands you each row as a list of fields.",
      ],
      codex: ["csv-reading", "with"],
      quiz: {
        code: r`line = 'Pip,"stone, warm",yes'
print(len(line.split(",")))`,
        question: "What does this program show?",
        options: ["4", "3", "2", "5"],
        answer: 0,
        why: "split cuts at every comma, including the one inside the quotes, so you get four pieces. csv.reader would give the three real fields.",
      },
      task: [
        "Read `petition.csv` with the `csv` module. Print the name of everyone who hasn't signed yet, one per line, in the order of the file. Signed means the signed column says yes.",
        "Then a last line: `<how many signed> of <how many people> have signed.` Print nothing else.",
      ],
      starter: r`# The petition is in the folder: petition.csv
`,
      files: { "petition.csv": `name,home,signed
Bram,"The Sleepy Serpent, by the pond",yes
Wren,The Whistling Mill,yes
Marlo,"Fisher's Dock, end of the pier",yes
Sable,Market Square,no
Hazel,The Hearth Bakery,yes
Ingrid,The Forge,yes
Odo,"The Library, top floor, mind the stairs",no
Mirela,The Apothecary,yes
` },
      tests: PRE + r`def petition(text):
    rows = [row for row in _csv.reader(text.splitlines()) if row][1:]
    unsigned = [row[0] for row in rows if row[2] != "yes"]
    return unsigned + [str(len(rows) - len(unsigned)) + " of " + str(len(rows)) + " have signed."]

def judge(text, got, when):
    check(len(got) > 0, when + ", nothing was printed.")
    check("name" not in got, when + ", the column names aren't a person. Skip the first row.")
    check(not any(l.startswith('"') or l.endswith('"') for l in got), when + ", a name came out with a quote mark on it. split cut a quoted field in two at its comma; let csv.reader read the rows.")
    want = petition(text)
    check(got[:-1] == want[:-1], when + ", the list of people who haven't signed isn't right. Print each name whose signed field isn't yes, in the file's order, and nobody else.")
    same(got, want, when)

check("csv.reader" in src or "csv.DictReader" in src, "Read the petition with the csv module: import csv, then csv.reader on the open file.")
check("Bram" not in lines, "Bram signed! split cut Bram's home in two at the comma inside the quotes, so the signed field came from the wrong place. csv.reader keeps a quoted field whole.")
judge(files["petition.csv"], lines, "With today's petition")
nl = chr(10)
other = "name,home,signed" + nl + '"Thistle, Mayor","The Town Hall, upstairs",yes' + nl + "Pip,The Rune Stone,no" + nl + 'Odo,"The Library, top floor",yes' + nl
vns, vlines = variant({"petition.csv": other}, why="a different petition in the folder")
judge(other, vlines, "With a different petition (one name has a comma in it too)")
done = "name,home,signed" + nl + "Wren,The Whistling Mill,yes" + nl + "Sable,Market Square,yes" + nl
vns, vlines = variant({"petition.csv": done}, why="a petition everyone has signed")
judge(done, vlines, "With a petition everyone has signed")`,
      hints: [
        "Each row is one person. Which field says whether they signed, and what should happen when it doesn't say yes? Keep two counts as you go: people, and signatures.",
        "`import csv` at the top; then `rows = list(csv.reader(f))` inside a `with` block gives a list of rows, each a list like `[\"Pip\", \"the rune stone\", \"yes\"]`. The first row is the column names.",
        "Each row unpacks as `name, home, signed`. Then it's one `if` on `signed`: which branch counts a signature, and which prints? The number of people is the number of rows, less one. Why less one?",
      ],
      solution: r`import csv

with open("petition.csv", newline="") as f:
    rows = list(csv.reader(f))

signed_count = 0
for name, home, signed in rows[1:]:
    if signed == "yes":
        signed_count += 1
    else:
        print(name)
print(f"{signed_count} of {len(rows) - 1} have signed.")`,
      wrong: [r`signed_count = 0
people = 0
with open("petition.csv") as f:
    for line in f.readlines()[1:]:
        fields = line.strip().split(",")
        people += 1
        if fields[2] == "yes":
            signed_count += 1
        else:
            print(fields[0])
print(f"{signed_count} of {people} have signed.")`, r`import csv

with open("petition.csv", newline="") as f:
    rows = list(csv.reader(f))

signed_count = 0
for name, home, signed in rows:
    if signed == "yes":
        signed_count += 1
    else:
        print(name)
print(f"{signed_count} of {len(rows)} have signed.")`, r`import csv

with open("petition.csv", newline="") as f:
    rows = list(csv.reader(f))

signed_count = 0
for name, home, signed in rows[1:]:
    if signed == "yes":
        signed_count += 1
    else:
        print(name)
print(f"{signed_count} of 8 have signed.")`, r`import csv

with open("petition.csv", newline="") as f:
    rows = list(csv.reader(f))

for name, home, signed in rows[1:]:
    if signed != "yes":
        print(name)
print("6 of 8 have signed.")`],
      done: "Thistle: The roof's on! Sable signed on the spot (they said they were waiting for the price to go up). Odo signed three times, in three alphabets, to be safe.",
    },
    {
      id: "th10-the-census",
      part: "Dormers and chimney",
      title: "The Census",
      topic: "csv.DictReader",
      cost: { wood: 4, stone: 6 },
      intro: [
        "Thistle: Two dormers and a chimney, and the census! The King counts heads before he grants a charter. Hazel went door to door with a slate and a pie for every household.",
        "Thistle: The trouble is, the envoy's clerk sends forms back with the columns in whatever order they fell out of the satchel. *Per regulation*, says Lord Vane. He sounded delighted.",
        "Then read the columns by **name**, not by position. `csv.DictReader` turns each row into a dictionary keyed by the header line, so it never matters which column comes first.",
      ],
      codex: ["csv-dicts", "csv-reading"],
      quiz: {
        code: r`import csv
with open("jars.csv", "w") as f:
    f.write("jam,count\nplum,4\n")
with open("jars.csv", newline="") as f:
    for row in csv.DictReader(f):
        print(row["count"] * 2)`,
        question: "What does this program show?",
        options: ["44", "8", "countcount", "KeyError"],
        answer: 0,
        why: "row[\"count\"] is the text \"4\", and text times 2 repeats it. int(row[\"count\"]) * 2 would be 8.",
      },
      task: [
        "From `census.csv`, work out how many people live in the valley altogether, and which household keeps the most chickens (the envoy asked; nobody knows why).",
        "Print `People: <total>` and then `Most chickens: <household>`, and nothing else.",
        "Your program must still be right if the clerk sends the census back with its columns in another order.",
      ],
      starter: r`# The census is in the folder: census.csv
`,
      files: { "census.csv": CENSUS },
      tests: PRE + r`def census(text):
    people = 0
    best = None
    most = -1
    for row in _csv.DictReader(text.splitlines()):
        people += int(row["people"])
        if int(row["chickens"]) > most:
            most = int(row["chickens"])
            best = row["household"]
    return ["People: " + str(people), "Most chickens: " + best]

check("csv." in src, "Read the census with the csv module (csv.DictReader).")
want = census(files["census.csv"])
p = [l for l in lines if l.startswith("People:")]
check(len(p) == 1, "Print one line that starts with People: and gives the total.")
check(p[0] == want[0], "The people total isn't right. Add up the people column of every household, as numbers.")
c = [l for l in lines if l.startswith("Most chickens:")]
check(len(c) == 1, "Print one line that starts with Most chickens: and names the household.")
check(c[0] == want[1], "That isn't the household with the most chickens. Compare each household's chickens, as numbers, with the most you've seen so far.")
same(lines, want, "With today's census")
nl = chr(10)
other = "cats,chickens,household,people" + nl + "2,9,Cobble Cottage,3" + nl + "0,12,Hen House Farm,2" + nl + "1,4,The Mill Loft,1" + nl
vns, vlines = variant({"census.csv": other}, why="the census columns in another order")
want = census(other)
check(len(vlines) > 0 and vlines[0] == want[0], "When the census comes back with its columns in another order (cats,chickens,household,people), your people total is wrong. Look each value up by its column's name, not its position.")
check("Most chickens: Cobble Cottage" not in vlines, "With the reordered census, Hen House Farm has 12 chickens, more than Cobble Cottage's 9. Compare numbers, not text: as text, \"9\" comes after \"12\".")
same(vlines, want, "With the columns in another order")`,
      hints: [
        "Look each value up by its column's name, never by where it sits in the row. And remember that every value comes out of the file as text.",
        "`for row in csv.DictReader(f):` gives dictionaries like `{\"jar\": \"honey\", \"count\": \"3\"}`, so `row[\"count\"]` works whichever column it was in. `int()` it before adding or comparing.",
        "`people += int(row[\"people\"])` is the first line of the loop. The chickens need a tracker: an `if` that compares this household's chickens, as a number, with the most so far, and remembers two things when it wins.",
      ],
      solution: r`import csv

people = 0
most = -1
best = ""
with open("census.csv", newline="") as f:
    for row in csv.DictReader(f):
        people += int(row["people"])
        if int(row["chickens"]) > most:
            most = int(row["chickens"])
            best = row["household"]
print(f"People: {people}")
print(f"Most chickens: {best}")`,
      wrong: [r`import csv

people = 0
most = -1
best = ""
with open("census.csv", newline="") as f:
    rows = list(csv.reader(f))
for row in rows[1:]:
    people += int(row[1])
    if int(row[2]) > most:
        most = int(row[2])
        best = row[0]
print(f"People: {people}")
print(f"Most chickens: {best}")`, r`import csv

people = 0
most = ""
best = ""
with open("census.csv", newline="") as f:
    for row in csv.DictReader(f):
        people += int(row["people"])
        if row["chickens"] > most:
            most = row["chickens"]
            best = row["household"]
print(f"People: {people}")
print(f"Most chickens: {best}")`, r`import csv

people = 0
with open("census.csv", newline="") as f:
    for row in csv.DictReader(f):
        people += int(row["people"])
print(f"People: {people}")
print("Most chickens: The Hearth Bakery")`, r`import csv

people = 0
most = -1
best = ""
with open("census.csv", newline="") as f:
    for row in csv.DictReader(f):
        people += 1
        if int(row["chickens"]) > most:
            most = int(row["chickens"])
            best = row["household"]
print(f"People: {people}")
print(f"Most chickens: {best}")`],
      done: "Thistle: Fourteen souls, and the Hearth Bakery wins the chickens: nine of them, all named after loaves. Hazel says Sourdough is the clever one.",
    },
    {
      id: "th11-roll-of-trades",
      part: "Corner tower",
      title: "The Roll of Trades",
      topic: "csv.writer",
      cost: { wood: 1, stone: 10 },
      intro: [
        "The cut stones in the corner have waited since the plinth went down. When Ingrid levered up the last one for the tower, there was an iron box underneath it.",
        "Thistle: A parchment! *The Charter of Willowmere.* Signed... Ysolde. Ahem. Ahem. I don't have a speech for this.",
        "...That's her hand. Pip would know it anywhere. Pip means, Pip has seen it carved on the millstone. That's all Pip means. Into the dossier it goes!",
        "Thistle: Quite right. But first, the Roll of Trades. I jotted everyone's trade in my notebook, *Name: trade*, and the envoy wants it as a proper CSV. `csv.writer` writes rows for you, quotes and all.",
      ],
      codex: ["csv-writing", "csv-reading", "files-lines"],
      quiz: {
        code: r`import csv
with open("out.csv", "w", newline="") as f:
    csv.writer(f).writerow(["Pip", "small, green"])
with open("out.csv") as f:
    print(f.read())`,
        question: "What does this program show?",
        options: ["Pip,\"small, green\"", "Pip,small, green", "['Pip', 'small, green']", "Pip small, green"],
        answer: 0,
        why: "The writer puts commas between the fields, and wraps a field that has a comma of its own in double quotes so it stays one field.",
      },
      task: [
        "Turn Thistle's notebook, `trades.txt`, into `trades.csv`: a header row with the columns `name` and `trade`, then one row per citizen with their name and their whole trade.",
        "Some trades have commas in them, and they must stay one field each. Thistle's notebook may have empty lines too; they aren't citizens.",
        "Then print how many citizens you wrote.",
      ],
      starter: r`# Thistle's notebook is in the folder: trades.txt
`,
      files: { "trades.txt": `Bram: cook, innkeeper
Wren: miller
Marlo: fisher
Sable: trader
Hazel: baker
Ingrid: smith, farrier, mender of hinges
Odo: scribe, librarian

Mirela: herbalist
Thistle: mayor
` },
      tests: PRE + r`def trades(text):
    rows = [["name", "trade"]]
    for raw in text.splitlines():
        if raw.strip():
            name, trade = raw.strip().split(": ")
            rows.append([name, trade])
    return rows

def judge(text, got_lines, when):
    rows = csv_rows("trades.csv", "Write the roll into a file called trades.csv.")
    want = trades(text)
    check(len(rows) > 0, when + ", trades.csv is empty.")
    check(rows[0] == ["name", "trade"], when + ", the first row of trades.csv should be the column names, name and trade.")
    for row in rows[1:]:
        check(len(row) <= 2, when + ", the row for " + row[0] + " has " + str(len(row)) + " fields: the commas inside its trade were written as plain commas. Let the csv writer write each row; it quotes a field that has commas.")
        check(len(row) == 2, when + ", every row needs two fields, a name and a trade.")
        check(not row[0].endswith(":"), when + ", " + row[0] + " still has its colon. Cut each line at the colon and its space.")
        check(not row[1].startswith(" "), when + ", the trade for " + row[0] + " starts with a space. Cut each line at the colon and its space together.")
    same([",".join(r) for r in rows], [",".join(r) for r in want], when + ", reading trades.csv row by row (fields joined with commas here)")
    check(len(got_lines) > 0 and has_number(got_lines[-1], len(want) - 1), when + ", " + str(len(want) - 1) + " citizens went into trades.csv. Print that count, worked out as you go.")

check("csv.writer" in src or "csv.DictWriter" in src, "Let the csv module write the rows: csv.writer (or csv.DictWriter) on the open file.")
judge(files["trades.txt"], lines, "Today")
nl = chr(10)
other = "Nettle: goose-herd, gate-mender" + nl + nl + "Briar: thatcher" + nl + "Thorn: hedge-layer, and in winter, storyteller" + nl + nl
vns, vlines = variant({"trades.txt": other}, why="a different notebook (with empty lines in it)")
judge(other, vlines, "With a different notebook")`,
      hints: [
        "Each notebook line holds a name and a trade with a colon and a space between them. Cut each line into those two pieces, and hand them to the csv writer as one row. Count the rows as you write them.",
        "`writer = csv.writer(f)` inside `with open(\"jars.csv\", \"w\", newline=\"\") as f:`, and then `writer.writerow([\"honey\", \"sweet, golden\"])` writes one row, adding quotes where they're needed.",
        "Write the header row once, before the loop. In the loop, after skipping empty lines, one line cuts the notebook line in two: `name, trade = line.strip().split(___)`. What exactly sits between a name and its trade?",
      ],
      solution: r`import csv

count = 0
with open("trades.txt") as notes:
    with open("trades.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "trade"])
        for line in notes:
            if not line.strip():
                continue
            name, trade = line.strip().split(": ")
            writer.writerow([name, trade])
            count += 1
print(f"Citizens written: {count}")`,
      wrong: [r`count = 0
with open("trades.txt") as notes:
    with open("trades.csv", "w") as f:
        f.write("name,trade\n")
        for line in notes:
            if not line.strip():
                continue
            name, trade = line.strip().split(": ")
            f.write(f"{name},{trade}\n")
            count += 1
print(f"Citizens written: {count}")`, r`import csv

count = 0
with open("trades.txt") as notes:
    with open("trades.csv", "w", newline="") as f:
        writer = csv.writer(f)
        for line in notes:
            if not line.strip():
                continue
            name, trade = line.strip().split(": ")
            writer.writerow([name, trade])
            count += 1
print(f"Citizens written: {count}")`, r`import csv

count = 0
with open("trades.txt") as notes:
    with open("trades.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "trade"])
        for line in notes:
            if not line.strip():
                continue
            name, trade = line.strip().split(":")
            writer.writerow([name, trade])
            count += 1
print(f"Citizens written: {count}")`, r`import csv

count = 0
with open("trades.txt") as notes:
    with open("trades.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "trade"])
        for line in notes:
            name, trade = line.strip().split(": ")
            writer.writerow([name, trade])
            count += 1
print(f"Citizens written: {count}")`, r`import csv

with open("trades.txt") as notes:
    with open("trades.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["name", "trade"])
        for line in notes:
            if not line.strip():
                continue
            name, trade = line.strip().split(": ")
            writer.writerow([name, trade])
print("Citizens written: 9")`],
      done: "Thistle: A tower, a Roll of Trades, and a three-hundred-year-old charter in an iron box. Ahem. I'm going to need a bigger handcart.",
    },
    {
      id: "th12-missing-records",
      part: "Belfry and spire",
      title: "Which Records Are Missing?",
      topic: "FileNotFoundError",
      cost: { wood: 7, stone: 4 },
      intro: [
        "Lord Vane has sent a list. *Per regulation 14, subsection b, a town must bring the following records to a hearing.* He has underlined the ones we haven't got.",
        "Thistle: Ahem. How does he know which ones we haven't got?",
        "He doesn't. He underlined all of them. He says it saves time. Opening a file that isn't there raises a **FileNotFoundError**, and you know how to catch an error with `try` and `except`. Let's go down his list without falling over at the first gap.",
      ],
      codex: ["file-errors", "try-except", "files-lines", "with"],
      quiz: {
        code: r`with open("a.txt", "w") as f:
    f.write("hi")
try:
    for name in ["b.txt", "a.txt"]:
        with open(name) as f:
            print(name, "found")
except FileNotFoundError:
    print("missing")`,
        question: "What does this program show?",
        options: ["missing", "missing\na.txt found", "a.txt found", "FileNotFoundError"],
        answer: 0,
        why: "The try is around the whole loop. b.txt isn't there, so Python jumps straight to except, and the loop never comes back for a.txt.",
      },
      task: [
        "Go down Vane's list. For each record that's in the folder, print its name and how many lines it has, like `stores.txt: 12 lines`. For each one that isn't, print its name and `missing`, like `stores.txt: missing`.",
        "Finish with `<found> of <on the list> records found`, and print nothing else.",
        "A missing record mustn't stop the rest of the list.",
      ],
      starter: r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

# Check every record on Lord Vane's list.
`,
      files: { "register.txt": REGISTER_TXT, "minutes.txt": MINUTES_LOG, "ledger.txt": LEDGER_TXT, "census.csv": CENSUS },
      tests: PRE + r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

def report(present):
    want = []
    found = 0
    for name in needed:
        if name in present:
            want.append(name + ": " + str(len(present[name].splitlines())) + " lines")
            found += 1
        else:
            want.append(name + ": missing")
    want.append(str(found) + " of " + str(len(needed)) + " records found")
    return want

def judge(present, got, when):
    want = report(present)
    check(len(got) > 0, when + ", nothing was printed.")
    gap = [n for n in needed if n not in present][0]
    later = needed[needed.index(gap) + 1:]
    check(any(l.startswith(n + ":") for n in later for l in got), when + ", your program stopped at " + gap + ": nothing came out for the records after it. Put the try inside the loop, so a missing record only spoils its own round.")
    for name in needed:
        mine = [l for l in got if l.startswith(name + ":")]
        check(len(mine) == 1, when + ", print one line for " + name + ", starting with its name and a colon.")
        if name in present:
            check("missing" not in mine[0], when + ", " + name + " is in the folder, but your line says it's missing.")
            check(has_number(mine[0], len(present[name].splitlines())), when + ", the count for " + name + " is off. Count its lines, not its characters.")
        else:
            check("missing" in mine[0], when + ", " + name + " isn't in the folder, so its line should say missing.")
    same(got, want, when)

check("FileNotFoundError" in src, "Name the error you're catching: except FileNotFoundError:. A bare except would hide every other mistake too.")
judge(files, lines, "With today's records")
present = dict(files)
deeds = "Deed of the old mill" + chr(10) + "Deed of the pond" + chr(10)
present["deeds.txt"] = deeds
present.pop("minutes.txt")
present.pop("ledger.txt")
vns, vlines = variant({"deeds.txt": deeds}, gone=["minutes.txt", "ledger.txt"], why="the deeds found, and the minutes and ledger missing")
judge(present, vlines, "With deeds.txt found, and minutes.txt and ledger.txt missing")`,
      hints: [
        "Each name on the list gets its own attempt. If the attempt fails, that's one missing record, and the loop goes on to the next name. So where does the `try` have to go?",
        "`try:` the opening and the counting, then `except FileNotFoundError:` says it's missing. Put both inside the `for` loop, and count the ones that opened.",
        "Both the `try` and its `except FileNotFoundError:` sit inside `for name in needed:`. The line count, its print and `found += 1` belong where they only happen if the file opened. What belongs in the `except`?",
      ],
      solution: r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

found = 0
for name in needed:
    try:
        with open(name) as f:
            count = len(f.readlines())
    except FileNotFoundError:
        print(f"{name}: missing")
    else:
        print(f"{name}: {count} lines")
        found += 1
print(f"{found} of {len(needed)} records found")`,
      wrong: [r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

found = 0
try:
    for name in needed:
        with open(name) as f:
            count = len(f.readlines())
        print(f"{name}: {count} lines")
        found += 1
except FileNotFoundError:
    print(f"{name}: missing")
print(f"{found} of {len(needed)} records found")`, r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

found = 0
for name in needed:
    with open(name) as f:
        count = len(f.readlines())
    print(f"{name}: {count} lines")
    found += 1
print(f"{found} of {len(needed)} records found")`, r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

for name in needed:
    try:
        with open(name) as f:
            count = len(f.readlines())
        print(f"{name}: {count} lines")
    except FileNotFoundError:
        print(f"{name}: missing")
print("4 of 6 records found")`, r`needed = ["register.txt", "minutes.txt", "ledger.txt", "deeds.txt", "census.csv", "seal.txt"]

found = 0
for name in needed:
    try:
        with open(name) as f:
            count = len(f.read())
        print(f"{name}: {count} lines")
        found += 1
    except FileNotFoundError:
        print(f"{name}: missing")
print(f"{found} of {len(needed)} records found")`],
      done: "Thistle: Four of six! The deeds? We have something older than any deed: a charter from the iron box. And the town seal is being carved this very afternoon. Ingrid says it'll go *thunk* beautifully.",
    },
    {
      id: "th13-per-regulation",
      part: "Flag, banners and crest",
      title: "Per Regulation",
      topic: "read, change, write back",
      cost: { wood: 3, stone: 2 },
      intro: [
        "Lord Vane has examined the register. He calls it *charming*: names in lowercase, names with spaces hanging off them, and one name written twice. Per regulation, he is obliged to object. In triplicate.",
        "Thistle: He's right, blast him. I wrote your name twice, citizen. The first one wobbled. My hands aren't what they were.",
        "Then we tidy the register and put it back where it was. Read every row first, fix them, and only then open the file again to write. Open it with `\"w\"` too early and the register is gone before you've read a word!",
      ],
      codex: ["csv-writing", "csv-reading", "sets", "with"],
      quiz: {
        code: r`with open("pie.txt", "w") as f:
    f.write("apple\n")
f = open("pie.txt")
g = open("pie.txt", "w")
g.write(f.read().upper())
g.close()
f.close()
with open("pie.txt") as f:
    print(f.read())`,
        question: "What does this program show?",
        options: ["(nothing)", "APPLE", "apple", "ValueError"],
        answer: 0,
        why: "Opening pie.txt with \"w\" emptied it at once, before f.read() had read anything. So an empty string was written back.",
      },
      task: [
        "Tidy `register.csv` and write it back to the same file: every name with no spaces at either end and capitals at the start of each word, and each citizen only once (keep their first row, drop any repeat).",
        "The header row stays at the top, and the other columns stay exactly as they were.",
        "Then print how many repeats you removed.",
      ],
      starter: r`# The register is in the folder: register.csv
# 1. Read every row
# 2. Tidy the names and drop the repeats
# 3. Write the tidy register back to register.csv
`,
      files: { "register.csv": `name,home,since
bram,"The Sleepy Serpent, by the pond",spring
Wren  ,The Whistling Mill,spring
  marlo,Fisher's Dock,summer
Sable,Market Square,summer
the founder,The Rune Stone,spring
hazel,The Hearth Bakery,autumn
The Founder,The Rune Stone,spring
Ingrid,The Forge,autumn
odo,"The Library, top floor",autumn
mirela,The Apothecary,autumn
Thistle ,The Town Hall,summer
` },
      tests: PRE + r`def tidy(text):
    rows = [row for row in _csv.reader(text.splitlines()) if row]
    keep = [rows[0]]
    seen = set()
    repeats = 0
    for row in rows[1:]:
        name = row[0].strip().title()
        if name in seen:
            repeats += 1
            continue
        seen.add(name)
        keep.append([name] + row[1:])
    return keep, repeats

def judge(text, got_lines, when):
    rows = csv_rows("register.csv", "Write the tidy register back to register.csv.")
    want, repeats = tidy(text)
    check(len(rows) > 1, when + ", the register lost its citizens! Opening register.csv with \"w\" empties it at once, so read every row first, let that with block end, and only then open it again to write.")
    check(rows[0] == want[0], when + ", the header row (" + ",".join(want[0]) + ") should still be at the top of register.csv.")
    for row in rows[1:]:
        check(len(row) == len(want[0]), when + ", the row for " + row[0].strip() + " has " + str(len(row)) + " fields instead of " + str(len(want[0])) + ". A home with a comma in it needs its quotes: let csv.writer write the rows.")
        check(row[0] == row[0].strip(), when + ", the name " + repr(row[0]) + " still has spaces at its ends.")
        check(row[0] == row[0].title(), when + ", the name " + row[0] + " still needs its capitals.")
    names = [row[0] for row in rows[1:]]
    for name in names:
        check(names.count(name) == 1, when + ", " + name + " is on the register more than once. Tidy each name before you ask whether you've seen it: rows that differ only in capitals or spaces are the same citizen. Keep the first row and drop the repeats.")
    same([",".join(r) for r in rows], [",".join(r) for r in want], when + ", reading register.csv row by row (fields joined with commas here)")
    check(len(got_lines) > 0 and has_number(got_lines[-1], repeats), when + ", " + str(repeats) + " repeats should have been removed. Print that count (the last thing you print), worked out as you go.")

check("csv." in src, "Read and write the register with the csv module, so homes with commas in them keep their quotes.")
judge(files["register.csv"], lines, "Today")
nl = chr(10)
other = "name,home,since" + nl + 'nettle,"Willow Cottage, east bank",spring' + nl + "Briar,The Old Barn,summer" + nl + 'NETTLE,"Willow Cottage, east bank",spring' + nl + " briar ,The Old Barn,summer" + nl + "Thorn,Hill Farm,autumn" + nl
vns, vlines = variant({"register.csv": other}, why="a different register in the folder")
judge(other, vlines, "With a different register")`,
      hints: [
        "Two separate visits to the file: one to read every row into a list, and, once that `with` block has ended, one to write the tidy rows back. In between, tidy each name and watch for names you've already seen.",
        "`list(csv.reader(f))` keeps every row safe in a list. A set remembers the names you've seen (`if name in seen:`). `\" pip \".strip().title()` gives `\"Pip\"`. `writer.writerows(rows)` writes a whole list of rows.",
        "Inside the loop, order matters: tidy the name first (`row[0].strip().title()`), then ask `if name in seen:`. Which branch counts a repeat, and which adds the name to `seen` and keeps the row? The writing happens once, after the loop.",
      ],
      solution: r`import csv

with open("register.csv", newline="") as f:
    rows = list(csv.reader(f))

tidy = [rows[0]]
seen = set()
repeats = 0
for row in rows[1:]:
    name = row[0].strip().title()
    if name in seen:
        repeats += 1
        continue
    seen.add(name)
    tidy.append([name, row[1], row[2]])

with open("register.csv", "w", newline="") as f:
    csv.writer(f).writerows(tidy)

print(f"Repeats removed: {repeats}")`,
      wrong: [r`import csv

f = open("register.csv", newline="")
out = open("register.csv", "w", newline="")
rows = list(csv.reader(f))
tidy = []
seen = set()
repeats = 0
for row in rows:
    name = row[0].strip().title()
    if name in seen:
        repeats += 1
        continue
    seen.add(name)
    tidy.append([name, row[1], row[2]])
csv.writer(out).writerows(tidy)
out.close()
f.close()
print(f"Repeats removed: {repeats}")`, r`import csv

with open("register.csv", newline="") as f:
    rows = list(csv.reader(f))

tidy = [rows[0]]
for row in rows[1:]:
    tidy.append([row[0].strip().title(), row[1], row[2]])

with open("register.csv", "w", newline="") as f:
    csv.writer(f).writerows(tidy)

print("Repeats removed: 0")`, r`import csv

with open("register.csv", newline="") as f:
    rows = list(csv.reader(f))

tidy = [rows[0]]
seen = set()
repeats = 0
for row in rows[1:]:
    name = row[0].strip()
    if name in seen:
        repeats += 1
        continue
    seen.add(name)
    tidy.append([name, row[1], row[2]])

with open("register.csv", "w", newline="") as f:
    csv.writer(f).writerows(tidy)

print(f"Repeats removed: {repeats}")`, r`import csv

with open("register.csv", newline="") as f:
    rows = list(csv.reader(f))

seen = set()
repeats = 0
with open("register.csv", "w") as f:
    f.write(",".join(rows[0]) + "\n")
    for row in rows[1:]:
        name = row[0].strip().title()
        if name in seen:
            repeats += 1
            continue
        seen.add(name)
        f.write(name + "," + row[1] + "," + row[2] + "\n")

print(f"Repeats removed: {repeats}")`, r`import csv

with open("register.csv", newline="") as f:
    rows = list(csv.reader(f))

tidy = []
seen = set()
repeats = 0
for row in rows[1:]:
    name = row[0].strip().title()
    if name in seen:
        repeats += 1
        continue
    seen.add(name)
    tidy.append([name, row[1], row[2]])

with open("register.csv", "w", newline="") as f:
    csv.writer(f).writerows(tidy)

print(f"Repeats removed: {repeats}")`],
      done: "Lord Vane read the register twice. *Every name tidy, none twice. I... have no objection.* He wrote that down, very slowly, as if he'd never had to spell it before.",
    },
    {
      id: "th14-the-dossier",
      part: "Open for business",
      title: "The Charter Dossier",
      topic: "putting it together",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Thistle: Lanterns, a notice board, a handcart of records... and tomorrow, the hearing. Ahem. I'm not nervous. I chaired the turnip committee. Nothing frightens me after the turnips.",
        "Thistle: The envoy's rules are in `charter_rules.txt`: what a town needs, and how much of it. Our records are all in the cart. What the hearing wants is one page, citizen: the dossier, saying plainly, for each rule, what we have and whether it's enough.",
        "This uses the whole hall: reading lines, the `csv` module, writing a file, and not falling over when a record is missing. Plan it on paper first. Pip believes in you. Pip also believes in paper.",
      ],
      codex: ["csv-reading", "file-errors", "files-writing", "functions", "with"],
      quiz: {
        code: r`have = 3
need = 3
if have > need:
    print("met")
else:
    print("short by", need - have)`,
        question: "What does this program show?",
        options: ["short by 0", "met", "short by 3", "(nothing)"],
        answer: 0,
        why: "3 is not more than 3, so the else runs. When having exactly enough is enough, the comparison you need is >=.",
      },
      task: [
        "Each line of `charter_rules.txt` is a rule's name and the amount it needs. Work out what the town has for each: **citizens** are the people in `register.csv`; **buildings** are the buildings listed in `buildings.txt`, one per line (empty lines don't count); **coins** are all the coins in `ledger.csv` added up; **signatures** are the rows of `petition.csv` whose signed column says yes.",
        "Write `dossier.txt` with one line per rule, in the rules file's order: `<rule>: <have> of <need> - met` when there's enough, `<rule>: <have> of <need> - short by <how many>` when there isn't, or `<rule>: record missing` when its file isn't in the folder (that rule isn't met).",
        "End the dossier with `Rules met: <met> of <rules>`, then print it.",
      ],
      starter: r`# The rules: charter_rules.txt
# The records: register.csv, buildings.txt, ledger.csv, petition.csv
# Plan first. One small job per record, then a loop over the rules.
`,
      files: {
        "charter_rules.txt": "citizens 10\nbuildings 8\ncoins 80\nsignatures 6\n",
        "register.csv": `name,home,since
Bram,"The Sleepy Serpent, by the pond",spring
Wren,The Whistling Mill,spring
Marlo,Fisher's Dock,summer
Sable,Market Square,summer
The Founder,The Rune Stone,spring
Hazel,The Hearth Bakery,autumn
Ingrid,The Forge,autumn
Odo,"The Library, top floor",autumn
Mirela,The Apothecary,autumn
Thistle,The Town Hall,summer
`,
        "buildings.txt": "The Sleepy Serpent\nThe Whistling Mill\nFisher's Dock\nMarket Square\nThe Hearth Bakery\nThe Forge\nThe Library\nThe Apothecary\nThe Town Hall\n",
        "ledger.csv": `who,what,coins
Bram,stew for the envoy,12
Wren,flour,8
Sable,"market fees, spring",10
Hazel,bread for the envoy,24
Bram,a barrel of cider,15
Odo,fines for overdue books,3
Sable,"market fees, summer",11
Ingrid,"hinges, nails and a gate",9
`,
        "petition.csv": `name,home,signed
Bram,"The Sleepy Serpent, by the pond",yes
Wren,The Whistling Mill,yes
Marlo,"Fisher's Dock, end of the pier",yes
Sable,Market Square,yes
Hazel,The Hearth Bakery,yes
Ingrid,The Forge,yes
Odo,"The Library, top floor, mind the stairs",yes
Mirela,The Apothecary,yes
`,
      },
      tests: PRE + r`RECORD = {"citizens": "register.csv", "buildings": "buildings.txt", "coins": "ledger.csv", "signatures": "petition.csv"}
HOW = {"citizens": "one per row, not counting the header", "buildings": "one per line that isn't empty", "coins": "the coins column added up, as numbers", "signatures": "the rows whose signed column says yes"}

def amount(rule, texts):
    name = RECORD[rule]
    if name not in texts:
        return None
    text = texts[name]
    if rule == "buildings":
        return len([l for l in text.splitlines() if l.strip()])
    rows = [row for row in _csv.reader(text.splitlines()) if row][1:]
    if rule == "citizens":
        return len(rows)
    if rule == "coins":
        total = 0
        for row in rows:
            total += int(row[2])
        return total
    return len([row for row in rows if row[2] == "yes"])

def dossier(texts):
    want = []
    met = 0
    rules = 0
    for raw in texts["charter_rules.txt"].splitlines():
        if not raw.strip():
            continue
        rule, need = raw.split()
        need = int(need)
        rules += 1
        have = amount(rule, texts)
        if have is None:
            want.append(rule + ": record missing")
        elif have >= need:
            want.append(rule + ": " + str(have) + " of " + str(need) + " - met")
            met += 1
        else:
            want.append(rule + ": " + str(have) + " of " + str(need) + " - short by " + str(need - have))
    want.append("Rules met: " + str(met) + " of " + str(rules))
    return want

def judge(texts, got_lines, when):
    content = written("dossier.txt", "Write the dossier into a file called dossier.txt.")
    got = content.splitlines()
    want = dossier(texts)
    check(len(got) > 0, when + ", dossier.txt is empty.")
    for rule in ["citizens", "signatures"]:
        a = amount(rule, texts)
        if a is not None:
            for g in got:
                check(not g.startswith(rule + ": " + str(a + 1) + " of "), when + ", the " + rule + " count is one too many: it includes the header row. The column names are a row too, but not a " + rule[:-1] + ".")
    for w in want[:-1]:
        rule = w.split(":")[0]
        mine = [g for g in got if g.startswith(rule + ":")]
        check(len(mine) == 1, when + ", the dossier needs one line for the rule " + rule + ", starting with its name and a colon.")
        if w.endswith("record missing"):
            check("missing" in mine[0], when + ", " + RECORD[rule] + " isn't in the folder, so the " + rule + " line should say the record is missing.")
        else:
            check(mine[0].startswith(rule + ": " + str(amount(rule, texts)) + " "), when + ", the amount for " + rule + " is off: " + mine[0] + ". Work it out from " + RECORD[rule] + " (" + HOW[rule] + ").")
    same(got, want, when + ", in dossier.txt")
    check(shows(got_lines, got), when + ", print the dossier after writing it, every line just as it is in dossier.txt.")

judge(files, lines, "With today's records")
nl = chr(10)
texts = dict(files)
texts["charter_rules.txt"] = "coins 120" + nl + "citizens 12" + nl + "buildings 9" + nl
vns, vlines = variant({"charter_rules.txt": texts["charter_rules.txt"]}, why="other rules (three of them, in another order)")
judge(texts, vlines, "With other rules (coins 120, citizens 12, buildings 9)")
texts = dict(files)
texts.pop("petition.csv")
texts["buildings.txt"] = files["buildings.txt"] + nl + "The Old Well" + nl + nl
vns, vlines = variant({"buildings.txt": texts["buildings.txt"]}, gone=["petition.csv"], why="petition.csv missing")
judge(texts, vlines, "With petition.csv missing and empty lines in buildings.txt")`,
      hints: [
        "Plan on paper: one small job per record (count the register, count the roll, add up the ledger, count the yeses on the petition), then one loop over the rules that compares and writes a line each. Which record a rule needs depends on its name.",
        "A function per record keeps it tidy, like `def count_jars(): ... return total`. In the rules loop, `rule, need = line.split()` names the parts, and a `try` / `except FileNotFoundError:` around getting the amount means one missing record only spoils its own line.",
        "Inside the rules loop: `rule, need = line.split()`, then a `try` around getting the amount, whose `except FileNotFoundError:` writes the missing line and moves on. What's left is one `if`: which comparison makes exactly enough count as met?",
      ],
      solution: r`import csv

def csv_rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

def citizens():
    return len(csv_rows("register.csv"))

def buildings():
    count = 0
    with open("buildings.txt") as f:
        for line in f:
            if line.strip():
                count += 1
    return count

def coins():
    total = 0
    for who, what, amount in csv_rows("ledger.csv"):
        total += int(amount)
    return total

def signatures():
    count = 0
    for name, home, signed in csv_rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

def amount_for(rule):
    if rule == "citizens":
        return citizens()
    elif rule == "buildings":
        return buildings()
    elif rule == "coins":
        return coins()
    else:
        return signatures()

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()

with open("dossier.txt", "w") as out:
    for line in rule_lines:
        if not line.strip():
            continue
        rule, need = line.split()
        need = int(need)
        rules += 1
        try:
            have = amount_for(rule)
        except FileNotFoundError:
            out.write(f"{rule}: record missing\n")
            continue
        if have >= need:
            out.write(f"{rule}: {have} of {need} - met\n")
            met += 1
        else:
            out.write(f"{rule}: {have} of {need} - short by {need - have}\n")
    out.write(f"Rules met: {met} of {rules}\n")

with open("dossier.txt") as f:
    print(f.read())`,
      wrong: [r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

citizens = len(rows("register.csv"))
with open("buildings.txt") as f:
    buildings = len(f.readlines())
coins = 0
for who, what, amount in rows("ledger.csv"):
    coins += int(amount)
signatures = 0
for name, home, signed in rows("petition.csv"):
    if signed == "yes":
        signatures += 1

with open("dossier.txt", "w") as out:
    out.write(f"citizens: {citizens} of 10 - met\n")
    out.write(f"buildings: {buildings} of 8 - met\n")
    out.write(f"coins: {coins} of 80 - met\n")
    out.write(f"signatures: {signatures} of 6 - met\n")
    out.write("Rules met: 4 of 4\n")

with open("dossier.txt") as f:
    print(f.read())`, r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))

def amount_for(rule):
    if rule == "citizens":
        return len(rows("register.csv"))
    if rule == "buildings":
        return len(rows("buildings.txt"))
    if rule == "coins":
        total = 0
        for who, what, amount in rows("ledger.csv")[1:]:
            total += int(amount)
        return total
    count = 0
    for name, home, signed in rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()
with open("dossier.txt", "w") as out:
    for line in rule_lines:
        rule, need = line.split()
        need = int(need)
        rules += 1
        try:
            have = amount_for(rule)
        except FileNotFoundError:
            out.write(f"{rule}: record missing\n")
            continue
        if have >= need:
            out.write(f"{rule}: {have} of {need} - met\n")
            met += 1
        else:
            out.write(f"{rule}: {have} of {need} - short by {need - have}\n")
    out.write(f"Rules met: {met} of {rules}\n")
with open("dossier.txt") as f:
    print(f.read())`, r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

def amount_for(rule):
    if rule == "citizens":
        return len(rows("register.csv"))
    if rule == "buildings":
        count = 0
        with open("buildings.txt") as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    if rule == "coins":
        total = 0
        for who, what, amount in rows("ledger.csv"):
            total += int(amount)
        return total
    count = 0
    for name, home, signed in rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()
with open("dossier.txt", "w") as out:
    for line in rule_lines:
        rule, need = line.split()
        need = int(need)
        rules += 1
        have = amount_for(rule)
        if have >= need:
            out.write(f"{rule}: {have} of {need} - met\n")
            met += 1
        else:
            out.write(f"{rule}: {have} of {need} - short by {need - have}\n")
    out.write(f"Rules met: {met} of {rules}\n")
with open("dossier.txt") as f:
    print(f.read())`, r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

def amount_for(rule):
    if rule == "citizens":
        return len(rows("register.csv"))
    if rule == "buildings":
        count = 0
        with open("buildings.txt") as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    if rule == "coins":
        total = 0
        with open("ledger.csv") as f:
            for line in f.readlines()[1:]:
                total += int(line.strip().split(",")[2])
        return total
    count = 0
    for name, home, signed in rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()
with open("dossier.txt", "w") as out:
    for line in rule_lines:
        rule, need = line.split()
        need = int(need)
        rules += 1
        try:
            have = amount_for(rule)
        except FileNotFoundError:
            out.write(f"{rule}: record missing\n")
            continue
        if have >= need:
            out.write(f"{rule}: {have} of {need} - met\n")
            met += 1
        else:
            out.write(f"{rule}: {have} of {need} - short by {need - have}\n")
    out.write(f"Rules met: {met} of {rules}\n")
with open("dossier.txt") as f:
    print(f.read())`, r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

def amount_for(rule):
    if rule == "citizens":
        return len(rows("register.csv"))
    if rule == "buildings":
        count = 0
        with open("buildings.txt") as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    if rule == "coins":
        total = 0
        for who, what, amount in rows("ledger.csv"):
            total += int(amount)
        return total
    count = 0
    for name, home, signed in rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()
for line in rule_lines:
    rule, need = line.split()
    need = int(need)
    rules += 1
    try:
        have = amount_for(rule)
    except FileNotFoundError:
        print(f"{rule}: record missing")
        continue
    if have >= need:
        print(f"{rule}: {have} of {need} - met")
        met += 1
    else:
        print(f"{rule}: {have} of {need} - short by {need - have}")
print(f"Rules met: {met} of {rules}")`, r`import csv

def rows(name):
    with open(name, newline="") as f:
        return list(csv.reader(f))[1:]

def amount_for(rule):
    if rule == "citizens":
        return len(rows("register.csv"))
    if rule == "buildings":
        count = 0
        with open("buildings.txt") as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    if rule == "coins":
        total = 0
        for who, what, amount in rows("ledger.csv"):
            total += int(amount)
        return total
    count = 0
    for name, home, signed in rows("petition.csv"):
        if signed == "yes":
            count += 1
    return count

met = 0
rules = 0
with open("charter_rules.txt") as f:
    rule_lines = f.readlines()
with open("dossier.txt", "w") as out:
    for line in rule_lines:
        rule, need = line.split()
        need = int(need)
        rules += 1
        try:
            have = amount_for(rule)
        except FileNotFoundError:
            out.write(f"{rule}: record missing\n")
            continue
        if have > need:
            out.write(f"{rule}: {have} of {need} - met\n")
            met += 1
        else:
            out.write(f"{rule}: {have} of {need} - short by {need - have}\n")
    out.write(f"Rules met: {met} of {rules}\n")
with open("dossier.txt") as f:
    print(f.read())`],
      done: "Thistle: Four rules of four, written plain on one page. The hall is open, the lanterns are lit, and the records are in the cart. Tomorrow, citizen, we go to the hearing.",
    },
  ],
};
