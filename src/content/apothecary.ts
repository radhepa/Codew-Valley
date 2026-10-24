import type { Building } from "./types.ts";

// Apothecary and Herb Garden: building 8, taught with split / join, tuples, sets
// and try / except (SYLLABUS.md). Each challenge adds one stage of
// apothecary.glb (art/specs/apothecary.md, stage_01 … stage_14), so the building
// has exactly 14 challenges. Mirela arrives when the chapter opens and speaks
// lines that start with "Mirela: ". The Hush comes down from the north hill
// during the build, and Pip grows faint until the tonic (stage 14).
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks.
//   again((old, new), ...)       -> (variables, printed lines) of a variant
//   call("name", *args)          -> what the learner's function gives back
//   attempt("name", *args)       -> (label, result, error) without failing
//   uses("outer", "inner", args) -> True if outer(*args) calls inner
// Functions are called with fresh values and their prints are hidden, so
// typed-in answers fail and the output panel stays tidy.
const PRE = r`import io, sys

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        check(False, "When " + when + ", your program crashes with " + tell(e) + ". Work from the starting values, so it fits any day's list, not just today's.")

def tell(err):
    msg = str(err).rstrip(".")
    return type(err).__name__ + (": " + msg if msg else "")

def code_only():
    # The program without its comments, so "# join" can't pass a check.
    return "\n".join(line.split("#")[0] for line in src.splitlines())

def shown(name, args):
    return name + "(" + ", ".join(repr(a) for a in args) + ")"

def want_fn(name):
    check(name in ns and callable(ns[name]), "Make a function called " + name + ". The rune calls it with fresh values to test it, so the name must match.")
    return ns[name]

def quiet(f, args):
    old = sys.stdout
    sys.stdout = io.StringIO()
    try:
        return f(*args), None
    except Exception as e:
        return None, e
    finally:
        sys.stdout = old

def attempt(name, *args):
    label = shown(name, args)
    got, err = quiet(want_fn(name), args)
    return label, got, err

def crashed(label, err):
    check(err is None, label + " crashed with " + tell(err) + ".")

def call(name, *args):
    label, got, err = attempt(name, *args)
    crashed(label, err)
    return got

def uses(outer, inner, args):
    real = want_fn(inner)
    seen = []
    def spy(*a, **k):
        seen.append(1)
        return real(*a, **k)
    ns[inner] = spy
    try:
        quiet(want_fn(outer), args)
    finally:
        ns[inner] = real
    return len(seen) > 0

`;

export const APOTHECARY: Building = {
  id: "apothecary",
  name: "Apothecary and Herb Garden",
  blurb: "Herbs, tonics and a greenhouse full of green.",
  villager: { name: "Mirela", model: "herbalist", arrives: "start" },
  opening: [
    "Pip's been quiet since the vault under the library. Pip is only thinking. About old things. Don't mind Pip.",
    "Mirela: Hello? Oh! Careful, careful, you're standing on a seedling. There. No harm done. It says it forgives you.",
    "Mirela: I'm Mirela. I grow herbs, and I talk to them, and before you ask: yes, they listen. Odo wrote to me about this valley. He said the soil here remembers being a garden.",
    "Mirela: My mother grew herbs on a windowsill in the city. Three pots and a dream. I've brought the dream, and rather a lot more pots.",
    "A town that wants a royal charter needs a healer. Ssso the envoy said. And here's one, walking up our path with a basket of seedlings!",
    "Mirela: I'll need a cottage for drying and brewing, a greenhouse for the tender ones, and a garden. And help with my labels and lists. My handwriting is... lively.",
    "Then we'll teach the stone to read. Not just numbers: whole lines of text, cut into pieces, tidied, and kept going even when a line makes no sense. Let's build the Apothecary!",
  ],
  finale: [
    "Mirela: Bottles on the sill, herbs drying under the eaves, and the tonic in the big flask with its paper tag. Now: one drop, right on the rune stone.",
    "...oh. Oh! Pip can feel the runes again. All of them, humming like bees. Founder, look, Pip's scales are glowing!",
    "Mirela: The fog's drawn back up the north hill. Not gone. Waiting. The flowers on that side still lean away from it.",
    "It's called the Hush. Pip... remembers the name. Pip doesn't know how Pip remembers it.",
    "Mirela: Then we keep the stone lit. A drop of tonic every morning, and runes spoken here every day. That's the cure for a hush, I think. Talking.",
    "Mirela: Now, everyone in. Chamomile for the whole valley. Bram, put the kettle on. Pip, you're having the first cup, and no arguing.",
    "A healer, a greenhouse and a garden that grows. One more building and the charter hearing comes. Pip will be strong for it. Pip promises.",
  ],
  chatDuring: [
    "Mirela: The seedlings like the sound of you working at the rune stone. It sounds like rain on a roof.",
    "Mirela: Cut the text, tidy the pieces, keep the good ones and set the bad ones aside. That's just weeding, really. You're a born gardener.",
    "Mirela: Pip hums when nervous, did you know? Pip's been humming all week. I hum back. It seems to help us both.",
    "Mirela: The fog leaves a grey dew on the leaves. I wipe each one by hand and tell it it's doing very well.",
  ],
  chatAfter: [
    "Mirela: A drop of tonic on the stone every morning, and Pip's scales stay bright. I keep a list of the mornings. A set, really. No repeats.",
    "Mirela: My mother would have cried at this greenhouse. Happy crying. I did, a little, on the first night.",
    "Mirela: The old clay pot sits on my sill now, runes facing out. I put a sprig of lavender in it. It seemed to want one.",
    "Mirela: Three herbs still missing from my pressed-leaf book: feverfew, betony and valerian. They'll turn up. Things come back.",
  ],
  chronicle: {
    title: "The Hush",
    text: [
      "There is a hill to the north where nobody goes to talk. In the autumn of our ninth year a grey fog came down off it, soft as wool, and wherever it lay, the stones went dim. The mill sails slowed. The bell rang flat. Even the bees went quiet in their skeps.",
      "Our herb-wife said it was only weather. But I watched the stones, and I saw that the fog was thickest where the village was silent and thinnest where people spoke. A stone that nobody talks to forgets how to answer. We called the fog **the Hush**.",
      "Her tonic helped: lavender, rain and something else she would not name. But the true cure was talking. Every morning the children came to the stones and said a rune, any rune, even a wrong one, and the stones listened, and the fog kept to its hill.",
      "I write this for whoever comes after us: *the Hush grows where no one speaks.* Keep speaking. Teach someone else to speak. While there are voices in the valley, the stones stay warm.",
    ],
  },
  challenges: [
    {
      id: "a01-seed-packet",
      part: "Survey stakes and seedlings",
      title: "The Seed Packet",
      topic: "split()",
      cost: { wood: 3, stone: 1 },
      intro: [
        "Mirela: Every garden starts with a list. Mine starts with a seed packet. I wrote the names on it myself, in between conversations with the seeds.",
        "Ssso the packet is one long string. To Python it's just letters and spaces in a row: it has no idea where one herb ends and the next begins.",
        "**`.split()`** cuts a string into a **list** of pieces. Once it's a list, you already know how to count it and pick things out of it by position.",
      ],
      codex: ["split-join", "string-methods"],
      quiz: {
        code: r`words = "two  big   loaves".split()
print(len(words))`,
        question: "What does this program show?",
        options: ["3", "6", "17", "1"],
        answer: 0,
        why: "split() with empty brackets cuts at every stretch of spaces, however long, so there are three words. 17 would be the letters and spaces of the whole string.",
      },
      task: [
        "`herbs`: the herb names from `packet`, as a list, in the order Mirela wrote them. She sometimes leaves two spaces between names, and that must not make an extra, empty herb.",
        "Print how many kinds of seed the packet holds.",
        "Print the herb she'll sow first (the first on the packet) and the one she'll sow last. Just those two, not the whole packet.",
        "It must still work if Mirela writes a different packet tomorrow, with more herbs or fewer.",
      ],
      starter: r`packet = "sage mint  rosemary thyme chamomile lavender"   # Mirela's handwriting

# herbs =

# How many kinds?

# Sown first, and sown last?
`,
      tests: PRE + r`check("herbs" in ns, "Make a variable herbs: the names from packet, as a list.")
h = ns["herbs"]
check(not isinstance(h, str), "herbs is still one long string. There's a string method that cuts a string into a list of words.")
check(isinstance(h, list), "herbs should be a list of names, but it is " + repr(h) + ".")
check("" not in h, "One of your herbs is an empty string ''. Where two spaces sit side by side, cutting at every single space leaves nothing between them. With empty brackets, Python cuts at each stretch of spaces instead.")
check(h == ["sage", "mint", "rosemary", "thyme", "chamomile", "lavender"], "herbs should hold the six names from the packet, in order, but it is " + repr(h) + ".")
check(len(lines) > 0, "The rune heard nothing. Print how many kinds there are, and the first and last herb.")
check("44" not in out, "44 is how many letters and spaces the packet string has. Mirela wants the number of herbs: count the list, not the string.")
check("6" in out, "The rune can't see how many kinds of seed there are. Print the number of herbs in your list.")
check("sage" in out and "lavender" in out, "Print the herb sown first and the herb sown last.")
check("rosemary" not in out and "thyme" not in out, "Print only the first and the last herb, not the whole packet.")
vns, vl = again(('packet = "sage mint  rosemary thyme chamomile lavender"', 'packet = "dill   basil fennel"'))
vout = " ".join(vl)
check(vns.get("herbs") == ["dill", "basil", "fennel"], "With a different packet, \"dill   basil fennel\", herbs should hold its three names, but it is " + repr(vns.get("herbs")) + ". Make herbs from packet instead of typing the list.")
check("3" in vout and "6" not in vout, "With a packet of three herbs your program should say 3. Let the list count itself instead of typing the number.")
check("dill" in vout and "fennel" in vout and "basil" not in vout, "With the packet \"dill   basil fennel\" your program printed: " + vout + ". The first herb there is dill and the last is fennel. Ask the list for its ends by position; one position always means \"the last\", however long the list.")`,
      hints: [
        "The packet is one string, and you need it cut into pieces at the gaps. Once it's a list, the list itself can tell you how long it is and what sits at each end.",
        "`\"eggs  milk flour\".split()` gives `['eggs', 'milk', 'flour']`: empty brackets cut at any stretch of spaces. `len(a_list)` counts the items, `a_list[0]` is the first, and `a_list[-1]` is the last, however long the list is.",
        "`herbs = packet.split()`. Then print `len(herbs)`, and print `herbs[0]` and `herbs[...]` with the position that always means \"the last one\".",
      ],
      solution: r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split()
print("Kinds of seed:", len(herbs))
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`,
      wrong: [r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split(" ")
print("Kinds of seed:", len(herbs))
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet
print("Kinds of seed:", len(herbs))
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = ["sage", "mint", "rosemary", "thyme", "chamomile", "lavender"]
print("Kinds of seed:", len(herbs))
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split()
print("Kinds of seed:", len(packet))
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split()
print("Kinds of seed:", len(herbs))
print("Sow first:", herbs[0])
print("Sow last:", herbs[5])`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split()
print("Kinds of seed:", len(herbs))
print(herbs)`, r`packet = "sage mint  rosemary thyme chamomile lavender"
herbs = packet.split()
print("Kinds of seed: 6")
print("Sow first:", herbs[0])
print("Sow last:", herbs[-1])`],
      done: "Mirela: Six kinds, from sage to lavender. The stakes are in, the string's pulled tight, and the seedlings are watching. They like to see where they'll live.",
    },
    {
      id: "a02-delivery-note",
      part: "Stone plinth and floor",
      title: "Sable's Delivery Note",
      topic: "split(\",\") and strip()",
      cost: { wood: 0, stone: 7 },
      intro: [
        "Mirela: Sable sent the floor stones up with a delivery note. Sable writes the way Sable talks: fast, with commas flying everywhere.",
        "This list can't be cut at the spaces: some stones have two words in their name. Put a separator in the brackets and **`.split()`** cuts only there.",
        "But a cut keeps everything between the separators, spaces and all. The pieces will want tidying, and `.strip()` tidies one string at a time.",
      ],
      codex: ["split-join", "string-methods"],
      quiz: {
        code: r`parts = "jam, butter ,honey".split(",")
print(len(parts[1]))`,
        question: "What does this program show?",
        options: ["8", "6", "7", "3"],
        answer: 0,
        why: "The cut happens only at the commas, so the middle piece is \" butter \": six letters plus a space at each end.",
      },
      task: [
        "`stones`: a list of the stones on `note`, in the note's order, each name tidy: no spaces at either end.",
        "A name like \"river stone\" is one stone, not two.",
        "Then print the stones one per line, tidy, and nothing else, so Mirela can tick them off as they're laid.",
      ],
      starter: r`note = "flagstone, cobble ,  river stone,slate , flagstone"   # Sable's delivery note

# stones =

# One tidy stone per line:
`,
      tests: PRE + r`check("stones" in ns, "Make a variable stones: the list of stones on the note.")
s = ns["stones"]
check(isinstance(s, list), "stones should be a list, but it is " + repr(s) + ".")
check("river" not in s, "\"river\" and \"stone\" have come apart: " + repr(s) + ". Cut the note only where the commas are.")
check(all(isinstance(x, str) and x == x.strip() for x in s), "Some stones still have spaces at their ends: " + repr(s) + ". A cut keeps the spaces beside the commas, so each piece needs tidying on its own.")
check(s == ["flagstone", "cobble", "river stone", "slate", "flagstone"], "stones should be the five stones in the note's order, but it is " + repr(s) + ".")
check(lines == s, "Print each stone on its own line, tidy, and nothing else. You printed:\n  " + "\n  ".join(lines))
vns, vl = again(('note = "flagstone, cobble ,  river stone,slate , flagstone"', 'note = " moss rock,garden wall stone , pebble"'))
check(vns.get("stones") == ["moss rock", "garden wall stone", "pebble"], "With another note, \" moss rock,garden wall stone , pebble\", stones comes out as " + repr(vns.get("stones")) + ". Build stones from note, piece by piece, instead of typing them.")
check(vl == ["moss rock", "garden wall stone", "pebble"], "With another note your program should print that note's stones, one per line. It printed:\n  " + "\n  ".join(vl))`,
      hints: [
        "Two jobs, in order: cut the note where the commas are, then tidy each piece. The cutting is one method call; the tidying has to happen to every piece, one at a time.",
        "`\"a , b\".split(\",\")` gives `['a ', ' b']`. A `for` loop can walk those pieces, tidy each one, and `append` the tidy piece to a new list that started out empty.",
        "`stones = []`, then `for piece in note.split(\",\"):` with `stones.append(...)` inside, given the tidied piece. A second loop prints each stone.",
      ],
      solution: r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = []
for piece in note.split(","):
    stones.append(piece.strip())
for stone in stones:
    print(stone)`,
      wrong: [r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = note.split()
for stone in stones:
    print(stone)`, r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = note.split(",")
for stone in stones:
    print(stone)`, r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = note.strip().split(",")
for stone in stones:
    print(stone)`, r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = []
for piece in note.split(","):
    piece.strip()
    stones.append(piece)
for stone in stones:
    print(stone)`, r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = ["flagstone", "cobble", "river stone", "slate", "flagstone"]
for stone in stones:
    print(stone)`, r`note = "flagstone, cobble ,  river stone,slate , flagstone"
stones = []
for piece in note.split(","):
    stones.append(piece.strip())
print(stones)`],
      done: "Mirela: Flagstones down, swept and cool underfoot. The mint keeps peeking at the floor. It's never had a floor before.",
    },
    {
      id: "a03-chalk-line",
      part: "Rubble walls",
      title: "Chalk on the Wall",
      topic: "join()",
      cost: { wood: 0, stone: 8 },
      intro: [
        "Mirela: Along this wall go my shelves. I want to chalk on the stones what lives on each shelf, top to bottom, so the jars don't argue about it.",
        "We've been cutting strings into lists. **`.join()`** goes the other way: it glues a list of strings into one string, with whatever you choose between them.",
        "It's written glue-first: `\" - \".join(words)` puts a space, a dash and a space between every pair of words.",
        "Mirela: But I want it to read the way you'd say it. Nobody says \"thyme, sage, mint\" and just stops. You say \"and\" before the last one.",
      ],
      codex: ["split-join"],
      quiz: {
        code: r`print("-".join(["a", "b", "c"]))`,
        question: "What does this program show?",
        options: ["a-b-c", "-a-b-c-", "abc", "['a', 'b', 'c']"],
        answer: 0,
        why: "join puts the glue only between pieces, never before the first or after the last.",
      },
      task: [
        "Write a function `chalk_line(names)`. It takes a list of shelf names and gives back (returns, not prints) one string that reads the way you'd say it out loud, like a shopping list: `eggs, milk and flour`.",
        "So: a comma and a space between names, except the last two, which have the word \"and\" between them, with a space each side. No comma before \"and\".",
        "Two names: just the two with \"and\" between. One name: only that name. Mirela's list must not be changed by your function.",
        "This wall is for practising `join`: let it glue the comma part of the line.",
      ],
      starter: r`shelves = ["thyme", "sage", "mint", "chamomile"]   # top shelf to bottom

# def chalk_line(names):

# Try it on the shelves:
# print(chalk_line(shelves))
`,
      tests: PRE + r`want_fn("chalk_line")
four = ["thyme", "sage", "mint", "chamomile"]
r1 = call("chalk_line", four)
check(four == ["thyme", "sage", "mint", "chamomile"], "chalk_line changed the list it was given (now it's " + repr(four) + "). Mirela still needs her shelves! Read names by position or with a slice instead of taking them out.")
check(r1 is not None, "chalk_line gives back None. Does it print the line instead of returning it? The rune needs return.")
check(isinstance(r1, str), "chalk_line should give back one string, but it gave back " + repr(r1) + ".")
check(" and " in r1, "Say it the way you would out loud: the last two names have the word and between them. chalk_line gave back " + repr(r1) + ".")
check(", and " not in r1, "No comma before and: the last two names are joined only by the word and. chalk_line gave back " + repr(r1) + ".")
check(r1 == "thyme, sage, mint and chamomile", "For the four shelves, chalk_line gave back " + repr(r1) + ". Between names: a comma and one space. Before the last name: the word and, with one space each side.")
r2 = call("chalk_line", ["rosemary", "dill"])
check(r2 == "rosemary and dill", "With two names there's no comma at all, just and between them. chalk_line(['rosemary', 'dill']) gave back " + repr(r2) + ".")
r3 = call("chalk_line", ["lavender"])
check(r3 == "lavender", "With only one name, the line is just that name. chalk_line(['lavender']) gave back " + repr(r3) + ".")
r5 = call("chalk_line", ["lemon balm", "dill", "sorrel", "tansy", "rue"])
check(r5 == "lemon balm, dill, sorrel, tansy and rue", "With five names, chalk_line gave back " + repr(r5) + ". Work from whatever list it is given.")
check(".join(" in code_only(), "That works, but this wall is for practising join: build the comma part of the line with join instead of adding names on one at a time.")`,
      hints: [
        "Say a few lists out loud and listen: which gaps get a comma, and which one gets \"and\"? Then think about what's different when there's only one name.",
        "`\" - \".join([\"a\", \"b\", \"c\"])` gives `\"a - b - c\"`. Slicing works on lists too: `items[:-1]` is everything but the last, and `items[-1]` is the last, and neither changes the list.",
        "If there's only one name, return it. Otherwise glue every name but the last with `\", \".join(...)`, then add `\" and \"` and the last name, and return that.",
      ],
      solution: r`shelves = ["thyme", "sage", "mint", "chamomile"]

def chalk_line(names):
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + " and " + names[-1]

print(chalk_line(shelves))`,
      wrong: [r`def chalk_line(names):
    # TODO: ", ".join(names) one day
    if len(names) == 1:
        return names[0]
    line = names[0]
    for name in names[1:-1]:
        line += ", " + name
    return line + " and " + names[-1]`, r`def chalk_line(names):
    return ", ".join(names)`, r`def chalk_line(names):
    if len(names) == 1:
        print(names[0])
    print(", ".join(names[:-1]) + " and " + names[-1])`, r`def chalk_line(names):
    return ", ".join(names[:-1]) + " and " + names[-1]`, r`def chalk_line(names):
    if len(names) == 1:
        return names[0]
    return ", ".join(names[:-1]) + ", and " + names[-1]`, r`def chalk_line(names):
    if len(names) == 1:
        return names[0]
    last = names.pop()
    return ", ".join(names) + " and " + last`, r`def chalk_line(names):
    return " and ".join(names)`, r`def chalk_line(names):
    if len(names) == 1:
        return names[0]
    line = names[0]
    for name in names[1:-1]:
        line = line + ", " + name
    return line + " and " + names[-1]`, r`def chalk_line(names):
    return "thyme, sage, mint and chamomile"`],
      done: "Mirela: \"Thyme, sage, mint and chamomile.\" Chalked as neat as a seed row. The walls are up to my waist now, and the stones are warm from the sun.",
    },
    {
      id: "a04-timber-tally",
      part: "Timber frame",
      title: "Ingrid's Timber Tally",
      topic: "numbers from text",
      cost: { wood: 9, stone: 0 },
      intro: [
        "Ingrid has sent the frame timbers up from the forge on two carts, with a tally pinned to each one.",
        "Mirela: She writes the way she hammers. Short and certain. But it's all words, and I need to know how many timbers to sort before the frame goes up.",
        "Careful: text that *looks* like a number is still text. `\"12\" + \"4\"` is `\"124\"`. Pull each number out of its piece, turn it into a real number with `int()`, and then it adds up properly.",
      ],
      codex: ["parsing", "split-join"],
      quiz: {
        code: r`print("3" * 2, int("3") * 2)`,
        question: "What does this program show?",
        options: ["33 6", "6 6", "33 33", "TypeError"],
        answer: 0,
        why: "\"3\" is text, and text times 2 repeats it. int(\"3\") is the number 3, and 3 times 2 is 6.",
      },
      task: [
        "Write a function `count_timbers(tally)`. A tally is one string of entries separated by commas; each entry is a kind of timber, then how many of them.",
        "It gives back the total number of timbers on that tally, as a whole number.",
        "Look closely at the tally in the starter: some kinds have two words, and the spacing is wherever Ingrid's pencil landed. The other cart's tally is just as untidy in its own way.",
      ],
      starter: r`tally = "posts 4, studs 18 , rails 6, ridge beam 1, rafters 12"   # Ingrid's tally, cart one

# def count_timbers(tally):

# print(count_timbers(tally))
`,
      tests: PRE + r`want_fn("count_timbers")
label, t1, err = attempt("count_timbers", "posts 4, studs 18 , rails 6, ridge beam 1, rafters 12")
check(not (isinstance(err, ValueError) and "beam" in str(err)), "int() was handed the word 'beam'. Some kinds of timber have two words in their name, so the number isn't always the second word. Where does the number sit in every entry?")
crashed(label, err)
check(t1 is not None, "count_timbers gives back None. Does it return the total, or only print it?")
check(not isinstance(t1, str), "count_timbers gave back the text " + repr(t1) + ". Numbers that are still text glue together instead of adding up. Turn each one into a real number first.")
check(t1 == 41, "Cart one's tally adds up to 41 timbers, but count_timbers gave back " + repr(t1) + ".")
t2 = call("count_timbers", "braces 8,collar ties 2, king posts  2")
check(t2 == 12, "Cart two's tally, \"braces 8,collar ties 2, king posts  2\", is 12 timbers, but count_timbers gave back " + repr(t2) + ". Look closely at where that tally's commas and spaces are.")
t3 = call("count_timbers", "sill 3")
check(t3 == 3, "A tally with only one entry, \"sill 3\", is 3 timbers, but count_timbers gave back " + repr(t3) + ".")`,
      hints: [
        "Do one entry on paper. What do you cut at first, the commas or the spaces? And once you're holding one entry, where is its number, even in `ridge beam 1`?",
        "`\"rye loaves 7\".split()` gives `['rye', 'loaves', '7']`, and `int(\"7\")` is the number 7. A total starts at 0 and grows inside a loop, like the accumulators at the bakery.",
        "`for entry in tally.split(\",\"):` then cut the entry into its words and add `int(...)` of its *last* word to a running total. Return the total after the loop.",
      ],
      solution: r`tally = "posts 4, studs 18 , rails 6, ridge beam 1, rafters 12"

def count_timbers(tally):
    total = 0
    for entry in tally.split(","):
        words = entry.split()
        total += int(words[-1])
    return total

print(count_timbers(tally))`,
      wrong: [r`def count_timbers(tally):
    total = 0
    for entry in tally.split(","):
        words = entry.split()
        total += int(words[1])
    return total`, r`def count_timbers(tally):
    total = ""
    for entry in tally.split(","):
        words = entry.split()
        total += words[-1]
    return total`, r`def count_timbers(tally):
    total = 0
    for entry in tally.split(", "):
        words = entry.split()
        total += int(words[-1])
    return total`, r`def count_timbers(tally):
    total = 0
    for entry in tally.split(","):
        words = entry.split()
        total += int(words[-1])
    print(total)`, r`def count_timbers(tally):
    return 41`, r`def count_timbers(tally):
    total = 0
    for entry in tally.split(","):
        words = entry.split()
        total += int(words[-1])
        return total`],
      done: "Mirela: Forty-one timbers, every one where it belongs. The frame leans a little to the east, like it's listening for something. Ingrid says that's on purpose. I don't believe her.",
    },
    {
      id: "a05-plaster-mix",
      part: "Plaster infill",
      title: "A Recipe That Won't Change",
      topic: "tuples",
      cost: { wood: 1, stone: 5 },
      intro: [
        "Mirela: Plaster next, between the timbers. My mother's mix: lime, sand and water, in that order, always. Two, five and one. I don't let anyone change it. Not even me.",
        "Then keep it in a **tuple**: like a list, but in round brackets, and once it's made nothing in it can change. You still read it by position, like a list.",
        "Mirela: There's a grey haze on the north hill this morning. Look, the lavender seedlings have turned their backs on it.",
        "Hm? Oh. Fog. Only fog. Let's... let's plaster, shall we?",
      ],
      codex: ["tuples", "errors"],
      quiz: {
        code: r`oven = (180, 40)
oven[0] = 200
print(oven)`,
        question: "What does this program show?",
        options: ["TypeError", "(200, 40)", "(180, 40)", "SyntaxError"],
        answer: 0,
        why: "A tuple can't be changed once it's made, so putting 200 into it stops the program with a TypeError. Nothing gets printed.",
      },
      task: [
        "Run the starter first. Mirela's helper tried to make the gable batch by changing her recipe itself, and the rune stone refused. Read the error.",
        "`gable`: a new mix for the tall gable walls, with twice as much of everything as the recipe.",
        "`damp`: a new mix for the damp back wall, just like the recipe but with one scoop less water.",
        "`recipe` must stay exactly as Mirela wrote it, and both new mixes must be tuples too, so nobody can change them either.",
      ],
      starter: r`recipe = (2, 5, 1)   # Mirela's plaster: scoops of lime, sand and water. Never changes!

# The helper's go at a gable batch:
gable = recipe
gable[0] = gable[0] * 2
gable[1] = gable[1] * 2
gable[2] = gable[2] * 2

# damp =
`,
      tests: PRE + r`rc = ns.get("recipe")
check(isinstance(rc, tuple) and rc == (2, 5, 1), "recipe must stay exactly as Mirela wrote it, (2, 5, 1), and still a tuple, but now it is " + repr(rc) + ". Make new mixes instead of changing hers.")
for name in ["gable", "damp"]:
    check(name in ns, "Make the variable " + name + ": a new mix of its own.")
    m = ns[name]
    check(isinstance(m, tuple), name + " is " + repr(m) + ", which isn't a tuple. Mirela keeps her mixes in round brackets, so nobody can change them by accident.")
    check(len(m) != 6, name + " has six amounts: " + repr(m) + ". Multiplying a whole tuple repeats it, the way \"ab\" * 2 is \"abab\". Double each amount on its own.")
    check(len(m) == 3, name + " should hold three amounts (lime, sand, water), but it holds " + str(len(m)) + ".")
check(ns["gable"] == (4, 10, 2), "gable should have twice as much of each thing as the recipe, but it is " + repr(ns["gable"]) + ".")
check(ns["damp"] == (2, 5, 0), "damp should be the recipe with one scoop less water, and the lime and sand just as they were. It is " + repr(ns["damp"]) + ".")
vns, vl = again(("recipe = (2, 5, 1)", "recipe = (3, 4, 2)"))
check(vns.get("gable") == (6, 8, 4), "If Mirela's recipe were (3, 4, 2), your gable mix would come out as " + repr(vns.get("gable")) + ". Build gable from the recipe's own amounts instead of typing numbers.")
check(vns.get("damp") == (3, 4, 1), "If Mirela's recipe were (3, 4, 2), your damp mix would come out as " + repr(vns.get("damp")) + ". Build damp from the recipe's own amounts too.")`,
      hints: [
        "Run it and read the last line of the error. If a tuple can't be changed, what's the other way to end up with a tuple that has different numbers in it?",
        "You can't change a tuple, but you can build a new one from its parts: with `tray = (12, 6)`, `bigger = (tray[0] + 1, tray[1])` is a fresh tuple, and `tray` is left alone.",
        "Delete the helper's four lines. `gable = (recipe[0] * 2, ..., ...)` with all three amounts doubled; `damp` the same way, keeping lime and sand and changing only the water.",
      ],
      solution: r`recipe = (2, 5, 1)
gable = (recipe[0] * 2, recipe[1] * 2, recipe[2] * 2)
damp = (recipe[0], recipe[1], recipe[2] - 1)`,
      wrong: [r`recipe = (2, 5, 1)
gable = recipe
gable[0] = gable[0] * 2
gable[1] = gable[1] * 2
gable[2] = gable[2] * 2
damp = (2, 5, 0)`, r`recipe = (2, 5, 1)
gable = recipe * 2
damp = (recipe[0], recipe[1], recipe[2] - 1)`, r`recipe = (2, 5, 1)
gable = [recipe[0] * 2, recipe[1] * 2, recipe[2] * 2]
damp = [recipe[0], recipe[1], recipe[2] - 1]`, r`recipe = (2, 5, 1)
gable = (4, 10, 2)
damp = (2, 5, 0)`, r`recipe = (2, 5, 1)
gable = (recipe[0] * 2, recipe[1] * 2, recipe[2] * 2)
damp = (recipe[0], recipe[1], recipe[2] + 1)`, r`recipe = (2, 5, 1)
gable = (recipe[0] * 2, recipe[1] * 2, recipe[2] * 2)
recipe = list(recipe)
recipe[2] = recipe[2] - 1
damp = tuple(recipe)`],
      done: "Mirela: Smooth and white between the timbers, like cream on bread. And the recipe's still two, five and one. Good. The haze on the hill is thicker, though. The lavender still won't look at it.",
    },
    {
      id: "a06-slate-tally",
      part: "Slate roof",
      title: "Backwards Slates",
      topic: "unpacking and swapping",
      cost: { wood: 4, stone: 6 },
      intro: [
        "Sable's slate cart has rattled up the path, and the carter's tally with it: each course of the roof and how many slates it takes, as pairs.",
        "Mirela: Some of the pairs are backwards. Number first, then the course. The carter says it was raining. The moss says the carter was eating a pie.",
        "A pair can be **unpacked** into two names in one go: `day, rain = pair`. A loop can unpack each pair as it walks: `for bird, eggs in nests:`. And two names can swap their values in one line: `a, b = b, a`.",
      ],
      codex: ["unpacking", "tuples", "types"],
      quiz: {
        code: r`a, b = 1, 2
a, b = b, a
print(a, b)`,
        question: "What does this program show?",
        options: ["2 1", "1 2", "2 2", "ValueError"],
        answer: 0,
        why: "Python works out the whole right side first, (2, 1), and only then unpacks it into a and b. So they swap without losing anything.",
      },
      task: [
        "Write `fix_tally(tally)`. It takes a list of pairs, each holding one course name and one number in either order, and gives back a new list of pairs (tuples, like the ones it was given) with every name first and every number second. Keep the courses in the same order.",
        "Write `count_slates(tally)`: the total number of slates on a tally, even a muddled one. Your two functions can help each other.",
      ],
      starter: r`tally = [("eaves", 40), (36, "second course"), ("third course", 33), (30, "fourth course"), ("ridge", 14)]

# def fix_tally(tally):

# def count_slates(tally):

# print(fix_tally(tally))
# print(count_slates(tally))
`,
      tests: PRE + r`want_fn("fix_tally")
def roof():
    return [("eaves", 40), (36, "second course"), ("third course", 33), (30, "fourth course"), ("ridge", 14)]
f1 = call("fix_tally", roof())
check(f1 is not None, "fix_tally gives back None. Does it return the new list?")
check(isinstance(f1, list), "fix_tally should give back a list of pairs, but it gave back " + repr(f1) + ".")
check(all(isinstance(p, tuple) for p in f1), "Each pair in the list should be a tuple, in round brackets, like the pairs it was given. fix_tally gave back " + repr(f1) + ".")
check(f1 == [("eaves", 40), ("second course", 36), ("third course", 33), ("fourth course", 30), ("ridge", 14)], "Every pair should come out name first, number second, in the tally's order. Pairs that were already the right way round stay as they are. fix_tally gave back " + repr(f1) + ".")
f2 = call("fix_tally", [(5, "porch"), ("shed", 7), (2, "well")])
check(f2 == [("porch", 5), ("shed", 7), ("well", 2)], "fix_tally([(5, 'porch'), ('shed', 7), (2, 'well')]) gave back " + repr(f2) + ". Decide for each pair on its own, from what's inside it.")
f3 = call("fix_tally", [])
check(f3 == [], "An empty tally should give back an empty list, but fix_tally gave back " + repr(f3) + ".")
want_fn("count_slates")
label, c1, err = attempt("count_slates", roof())
check(not isinstance(err, TypeError), label + " crashed with TypeError: " + str(err) + ". Some pairs have their number first, so taking the second of every pair adds words to numbers. Tidy the tally before you add it up: you've got a function for that.")
crashed(label, err)
check(c1 == 153, "The roof's courses take 153 slates altogether, but count_slates gave back " + repr(c1) + ".")
c2 = call("count_slates", [(12, "gable"), ("verge", 8)])
check(c2 == 20, "count_slates([(12, 'gable'), ('verge', 8)]) should be 20 slates, but it gave back " + repr(c2) + ". Add up the numbers from the tally it is given.")
c3 = call("count_slates", [])
check(c3 == 0, "An empty tally has 0 slates, but count_slates gave back " + repr(c3) + ".")`,
      hints: [
        "Look at one pair at a time. How can your program tell which way round it is? What kind of value is in front: a name, or a number?",
        "`for bird, eggs in nests:` unpacks each pair as the loop walks. `type(7) == int` is True and `type(\"wren\") == int` is False. `a, b = b, a` swaps two values.",
        "In `fix_tally`: `for first, second in tally:`; if `first` is the number, swap the two; then append the pair `(first, second)` to a new list, and return it. `count_slates` can loop over `fix_tally(tally)` and add up the second of each pair.",
      ],
      solution: r`tally = [("eaves", 40), (36, "second course"), ("third course", 33), (30, "fourth course"), ("ridge", 14)]

def fix_tally(tally):
    fixed = []
    for first, second in tally:
        if type(first) == int:
            first, second = second, first
        fixed.append((first, second))
    return fixed

def count_slates(tally):
    total = 0
    for course, slates in fix_tally(tally):
        total += slates
    return total

print(fix_tally(tally))
print(count_slates(tally))`,
      wrong: [r`def fix_tally(tally):
    fixed = []
    for first, second in tally:
        fixed.append((second, first))
    return fixed

def count_slates(tally):
    total = 0
    for course, slates in fix_tally(tally):
        total += slates
    return total`, r`def fix_tally(tally):
    fixed = []
    for first, second in tally:
        if type(first) == int:
            first, second = second, first
        fixed.append([first, second])
    return fixed

def count_slates(tally):
    total = 0
    for course, slates in fix_tally(tally):
        total += slates
    return total`, r`def fix_tally(tally):
    fixed = []
    for first, second in tally:
        if type(first) == int:
            first, second = second, first
        fixed.append((first, second))
    return fixed

def count_slates(tally):
    total = 0
    for course, slates in tally:
        total += slates
    return total`, r`def fix_tally(tally):
    fixed = []
    for first, second in tally:
        if type(first) == int:
            first = second
            second = first
        fixed.append((first, second))
    return fixed

def count_slates(tally):
    total = 0
    for course, slates in fix_tally(tally):
        total += slates
    return total`, r`def fix_tally(tally):
    fixed = []
    for first, second in tally:
        if type(first) == int:
            first, second = second, first
        fixed.append((first, second))
    return fixed

def count_slates(tally):
    return 153`, r`def fix_tally(tally):
    for first, second in tally:
        if type(first) == int:
            first, second = second, first
    return tally

def count_slates(tally):
    total = 0
    for course, slates in fix_tally(tally):
        total += slates
    return total`],
      done: "Mirela: Every course on, in the right order, and the moss already moving in. I asked it to. Moss is very obliging, if you ask nicely.",
    },
    {
      id: "a07-doorstep-slate",
      part: "Arched door and steps",
      title: "Notes on the Doorstep",
      topic: "returning two values",
      cost: { wood: 7, stone: 2 },
      intro: [
        "Mirela: The door's on, green as a new leaf. I've hung a little slate beside it. Anyone who needs something writes their name and what they need, with a colon between, and I'll know before I open the door.",
        "Mirela: But everybody writes however they please. Shouting capitals, whispering lowercase, spaces wherever the chalk slipped.",
        "A function can give back **two** values at once: `return low, high` hands back a pair (a tuple), and the caller unpacks it: `cold, warm = coldest_warmest(temps)`.",
      ],
      codex: ["unpacking", "tuples", "string-methods"],
      quiz: {
        code: r`def edges(word):
    return word[0], word[-1]

print(edges("pip"))`,
        question: "What does this program show?",
        options: ["('p', 'p')", "p p", "pp", "TypeError"],
        answer: 0,
        why: "return a, b gives back one tuple holding both values, and printing a tuple shows its round brackets and quotes.",
      },
      task: [
        "Write `read_note(note)`. It gives back two values: the person's name, tidy and starting with a capital letter (the rest small), and what they need, tidy and all in lowercase. Each note has exactly one colon.",
        "Write `tally_needs(notes)`. It takes a list of notes and gives back a dictionary: each need, and how many people wrote it. Let `read_note` do the reading of each note.",
      ],
      starter: r`slate = ["bram: sleep", "  HAZEL :Sore Throat", "wren:sleep ", "Marlo : calm", "odo: Sleep"]

# def read_note(note):

# def tally_needs(notes):

# print(read_note(slate[1]))
# print(tally_needs(slate))
`,
      tests: PRE + r`want_fn("read_note")
rn = call("read_note", "  HAZEL :Sore Throat")
check(rn is not None, "read_note gives back None. Does it return the two values, or print them?")
check(isinstance(rn, tuple) and len(rn) == 2, "read_note should give back two values at once, the name and the need. It gave back " + repr(rn) + ". A comma between two values in a return makes a pair.")
name, wish = rn
check(isinstance(name, str) and name == name.strip(), "The name still has spaces at its ends: " + repr(name) + ".")
check(name == "Hazel", "From the note \"  HAZEL :Sore Throat\", the name should be tidy, with only its first letter a capital. read_note gave back " + repr(name) + ".")
check(isinstance(wish, str) and wish == wish.strip(), "The need still has spaces at its ends: " + repr(wish) + ".")
check(wish == "sore throat", "From the note \"  HAZEL :Sore Throat\", the need should be tidy and all lowercase. read_note gave back " + repr(wish) + ".")
rp = call("read_note", "pell:a splinter")
check(rp == ("Pell", "a splinter"), "read_note('pell:a splinter') gave back " + repr(rp) + ". Work from the note it is given.")
rd = call("read_note", " dagny  :  SORE FEET  ")
check(rd == ("Dagny", "sore feet"), "read_note(' dagny  :  SORE FEET  ') gave back " + repr(rd) + ".")
want_fn("tally_needs")
t = call("tally_needs", ["bram: sleep", "  HAZEL :Sore Throat", "wren:sleep ", "Marlo : calm", "odo: Sleep"])
check(isinstance(t, dict), "tally_needs should give back a dictionary of needs and how many people wrote each. It gave back " + repr(t) + ".")
check("Bram" not in t and "bram" not in t, "tally_needs is counting people. Mirela wants each need as a key, and how many people wrote it.")
check(t == {"sleep": 3, "sore throat": 1, "calm": 1}, "For the slate by the door, tally_needs gave back " + repr(t) + ". The same need written in different ways is still the same need.")
t2 = call("tally_needs", ["ingrid: calm", "Hollis :CALM"])
check(t2 == {"calm": 2}, "tally_needs(['ingrid: calm', 'Hollis :CALM']) gave back " + repr(t2) + ".")
t3 = call("tally_needs", [])
check(t3 == {}, "An empty slate should give back an empty dictionary, but tally_needs gave back " + repr(t3) + ".")
check(uses("tally_needs", "read_note", (["sable: a map"],)), "tally_needs gets the right answers, but it reads each note by itself. Let read_note do the reading, and catch its two values: one job, one function.")`,
      hints: [
        "One note at a time: where does the name stop and the need start? Each half then needs its own clean-up, and the two halves go back to the caller together.",
        "`\"rye: 3\".split(\":\")` gives `['rye', ' 3']`, which unpacks into two names. `return low, high` gives back both at once, and `low, high = some_function(...)` catches them. A dictionary tally grows with `counts[key] = counts.get(key, 0) + 1`.",
        "`read_note`: split at the colon into two names, then `return` the first tidied and `.title()`d, and the second tidied and lowercased. `tally_needs`: loop over the notes, start each round with `name, need = read_note(note)`, and count `need` in a dictionary.",
      ],
      solution: r`slate = ["bram: sleep", "  HAZEL :Sore Throat", "wren:sleep ", "Marlo : calm", "odo: Sleep"]

def read_note(note):
    name, need = note.split(":")
    return name.strip().title(), need.strip().lower()

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] = counts.get(need, 0) + 1
    return counts

print(read_note(slate[1]))
print(tally_needs(slate))`,
      wrong: [r`def read_note(note):
    name, need = note.split(":")
    return name.strip().title()

def tally_needs(notes):
    counts = {}
    for note in notes:
        need = note.split(":")[1].strip().lower()
        counts[need] = counts.get(need, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return [name.strip().title(), need.strip().lower()]

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] = counts.get(need, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    print(name.strip().title(), need.strip().lower())

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] = counts.get(need, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return name.strip(), need.strip().lower()

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] = counts.get(need, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return name.strip().title(), need.strip().lower()

def tally_needs(notes):
    counts = {}
    for note in notes:
        need = note.split(":")[1].strip().lower()
        counts[need] = counts.get(need, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return name.strip().title(), need.strip().lower()

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[name] = counts.get(name, 0) + 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return name.strip().title(), need.strip().lower()

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] += 1
    return counts`, r`def read_note(note):
    name, need = note.split(":")
    return name.strip().title(), need.strip()

def tally_needs(notes):
    counts = {}
    for note in notes:
        name, need = read_note(note)
        counts[need] = counts.get(need, 0) + 1
    return counts`],
      done: "Mirela: Three people need sleep. Of course they do: you've all been building since dawn. Chamomile for everyone, then. And look at the doormat. It says WELCOME. The mint helped.",
    },
    {
      id: "a08-window-boxes",
      part: "Windows and flower boxes",
      title: "One of Every Flower",
      topic: "sets",
      cost: { wood: 5, stone: 2 },
      intro: [
        "Mirela: The windows are in. Diamond panes! And flower boxes under the front ones. I have a rule for window boxes: one of every flower the bees visited this week. Only one of each. Bees can't abide repeats.",
        "The bee list has the same flowers again and again, written every which way. A **set** keeps each thing only **once**: add it twice and it's still there once. `in` and `len()` work on sets too.",
        "Mirela: Pip, you've gone very quiet. The fog's come down as far as the garden fence.",
        "Pip's fine! Pip is thinking. About sets. Yes. Sets are very interesting.",
      ],
      codex: ["sets", "unpacking"],
      quiz: {
        code: r`jars = {"jam", "honey"}
jars.add("jam")
print(len(jars))`,
        question: "What does this program show?",
        options: ["2", "3", "1", "TypeError"],
        answer: 0,
        why: "\"jam\" is already in the set, so adding it again changes nothing. There are still two different jars.",
      },
      task: [
        "Write `window_box(visits)`: it takes the bees' list and gives back a set of the different flowers in it, each tidy and in lowercase.",
        "Marigold goes in every window box for luck, whether the bees found it or not.",
        "Write `box_note(box)`: it gives back two values: how many different flowers are in a box, and whether there's foxglove in it (True or False), because foxglove is pretty but nobody should nibble it.",
        "Neither function should change what it's given.",
      ],
      starter: r`bees = ["Lavender", "clover", " lavender", "Foxglove", "clover", "THYME ", "lavender"]   # where the bees went this week

# def window_box(visits):

# def box_note(box):

# box = window_box(bees)
# print(box)
# print(box_note(box))
`,
      tests: PRE + r`want_fn("window_box")
bees = ["Lavender", "clover", " lavender", "Foxglove", "clover", "THYME ", "lavender"]
label, b, err = attempt("window_box", bees)
check(not (isinstance(err, AttributeError) and "dict" in str(err)), label + " crashed: " + str(err) + ". Empty curly brackets {} make an empty dictionary, not a set. An empty set is set().")
crashed(label, err)
check(bees == ["Lavender", "clover", " lavender", "Foxglove", "clover", "THYME ", "lavender"], "window_box changed the bees' list it was given. Build something new instead.")
check(b is not None, "window_box gives back None. Does it return the set?")
check(isinstance(b, set), "window_box should give back a set, so every flower is in it only once. It gave back " + repr(b) + ".")
check(" lavender" not in b and "Lavender" not in b, "Lavender has sneaked in more than once, written different ways: " + repr(sorted(b)) + ". Tidy each name and make it lowercase before it goes in.")
check("marigold" in b, "There's no marigold. It goes in every box for luck.")
check(b == {"lavender", "clover", "foxglove", "thyme", "marigold"}, "For this week's bees, window_box gave back " + repr(sorted(b)) + ".")
m = call("window_box", ["MARIGOLD", " marigold"])
check(m == {"marigold"}, "When the bees found marigold themselves, it's still in the box only once. window_box(['MARIGOLD', ' marigold']) gave back " + repr(m) + ".")
e = call("window_box", [])
check(e == {"marigold"}, "A week with no bees still gets its marigold. window_box([]) gave back " + repr(e) + ".")
want_fn("box_note")
n = call("box_note", {"mint", "marigold"})
check(isinstance(n, tuple) and len(n) == 2, "box_note should give back two values: how many flowers, and whether there's foxglove. It gave back " + repr(n) + ".")
check(n[0] == 2, "A box of mint and marigold holds 2 different flowers, but box_note counted " + repr(n[0]) + ".")
check(n[1] is False, "A box of mint and marigold has no foxglove, so the second value should be False, but it is " + repr(n[1]) + ".")
f = call("box_note", {"foxglove", "clover", "rue", "marigold"})
check(f == (4, True), "With foxglove among 4 flowers, box_note should say 4 and True. It gave back " + repr(f) + ". Ask the box whether foxglove is in it.")`,
      hints: [
        "How would you do it with a pencil? Tidy each name, then write it down only if it's new. A set does the \"only if it's new\" part for you.",
        "`set()` makes an empty set (`{}` would make an empty dictionary). `jars.add(\"honey\")` puts something in, and adding it again changes nothing. `\"honey\" in jars` asks whether it's there, and `len(jars)` counts.",
        "`window_box`: start with `set()`, loop over the visits and `add` each tidied, lowercased name, then add `\"marigold\"` and return the set. `box_note` can `return len(box), ...` with the foxglove question second.",
      ],
      solution: r`bees = ["Lavender", "clover", " lavender", "Foxglove", "clover", "THYME ", "lavender"]

def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower.strip().lower())
    box.add("marigold")
    return box

def box_note(box):
    return len(box), "foxglove" in box

box = window_box(bees)
print(box_note(box))`,
      wrong: [r`def window_box(visits):
    box = []
    for flower in visits:
        flower = flower.strip().lower()
        if flower not in box:
            box.append(flower)
    box.append("marigold")
    return box

def box_note(box):
    return len(box), "foxglove" in box`, r`def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower)
    box.add("marigold")
    return box

def box_note(box):
    return len(box), "foxglove" in box`, r`def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower.strip().lower())
    return box

def box_note(box):
    return len(box), "foxglove" in box`, r`def window_box(visits):
    box = {}
    for flower in visits:
        box.add(flower.strip().lower())
    box.add("marigold")
    return box

def box_note(box):
    return len(box), "foxglove" in box`, r`def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower.strip().lower())
    box.add("marigold")
    return box

def box_note(box):
    return len(box)`, r`def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower.strip().lower())
    box.add("marigold")
    return box

def box_note(box):
    return len(box), "Foxglove" in box`, r`def window_box(visits):
    box = set()
    for flower in visits:
        box.add(flower.strip().lower())
    box.add("marigold")
    return box

def box_note(box):
    return 5, True`],
      done: "Mirela: Five flowers in each box, one of everything, and a marigold winking in the corner. The panes catch the light like dragonfly wings. Well. They would, if the fog would lift.",
    },
    {
      id: "a09-pressed-leaves",
      part: "Chimney and woodpile",
      title: "The Pressed-Leaf Book",
      topic: "& | - with sets",
      cost: { wood: 2, stone: 8 },
      intro: [
        "The chimney's going up the gable and... the rune stone flickered. Did you see? Like a candle in a draught.",
        "Mirela: It's the fog. It's crept over the garden and lies on everything like a grey blanket. The leaves are curling up tight. I've never seen plants go so quiet.",
        "Mirela: Let's work, and talk while we work. Plants like talk. Here: my pressed-leaf book, every herb that ever grew in this valley, as far as I know. I want a bed of every one. I need to know where I stand.",
        "Two sets can be compared in one stroke: `a & b` is what's in **both**, `a | b` is everything in **either**, and `a - b` is what's in `a` but **not** in `b`.",
      ],
      codex: ["set-ops", "sets"],
      quiz: {
        code: r`a = {1, 2, 3}
b = {2, 3, 4}
print(len(a | b), len(a & b))`,
        question: "What does this program show?",
        options: ["4 2", "6 2", "4 1", "2 4"],
        answer: 0,
        why: "a | b is {1, 2, 3, 4}: everything, each once, so 4. a & b is {2, 3}: only what's in both, so 2.",
      },
      task: [
        "`book` holds the herbs pressed in Mirela's book (a few are pressed twice). `found` holds what she's dug up in the valley so far, scribbled down with muddy hands, some of it twice.",
        "`growing`: the herbs from the book she has already found.",
        "`missing`: the herbs from the book she hasn't found yet.",
        "`new_pages`: the herbs she found that her book doesn't have yet. She'll press one of each.",
        "`only_one`: the herbs that are in the book or found, but not in both: every herb that still needs either a bed or a page.",
        "All four are sets of tidy, lowercase names.",
      ],
      starter: r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]   # scribbled in the mud

# growing =
# missing =
# new_pages =
# only_one =
`,
      tests: PRE + r`for name in ["growing", "missing", "new_pages", "only_one"]:
    check(name in ns, "Make the variable " + name + ".")
    check(isinstance(ns[name], set), name + " should be a set of herbs, but it is " + repr(ns[name]) + ".")
every = ns["growing"] | ns["missing"] | ns["new_pages"] | ns["only_one"]
untidy = sorted(h for h in every if not isinstance(h, str) or h != h.strip().lower())
check(untidy == [], "Some names are untidy: " + repr(untidy) + ". To a set, \"Mint\" and \"mint\" are two different herbs. Tidy every find before it goes into a set.")
check(ns["growing"] == {"sage", "mint", "comfrey"}, "growing should hold the herbs that are in the book and also found. You have " + repr(sorted(ns["growing"])) + ".")
check(ns["missing"] != {"wild garlic", "nettle"}, "missing holds the herbs she found that aren't in the book. That's the wrong way round: with -, you keep from the set on the left.")
check(ns["missing"] == {"yarrow", "feverfew", "betony", "valerian"}, "missing should hold the herbs in the book that she hasn't found. You have " + repr(sorted(ns["missing"])) + ".")
check(ns["new_pages"] == {"wild garlic", "nettle"}, "new_pages should hold the herbs she found that the book doesn't have. You have " + repr(sorted(ns["new_pages"])) + ".")
check(not (ns["only_one"] & ns["growing"]), "only_one still has herbs that are in both the book and the finds, like " + repr(sorted(ns["only_one"] & ns["growing"])) + ". Those already have a bed and a page: take them out.")
check(ns["only_one"] == {"yarrow", "feverfew", "betony", "valerian", "wild garlic", "nettle"}, "only_one should hold every herb that's in just one of the two: the book or the finds. You have " + repr(sorted(ns["only_one"])) + ".")
vns, vl = again(('book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]', 'book = ["tansy", "rue", "rue"]'), ('found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]', 'found = ["Rue ", "dill"]'))
got = (vns.get("growing"), vns.get("missing"), vns.get("new_pages"), vns.get("only_one"))
check(got == ({"rue"}, {"tansy"}, {"dill"}, {"tansy", "dill"}), "With another book (tansy, rue, rue) and other finds (\"Rue \", dill), your growing, missing, new_pages and only_one come out as " + repr(got) + ". Work all four out from book and found.")`,
      hints: [
        "Draw two overlapping circles on paper: the book's herbs in one, the finds in the other. Each answer is a region of that drawing, and one of them is made of two pieces. And look hard at the finds: would \"Mint\" match \"mint\"?",
        "`set([\"a\", \"b\", \"a\"])` is `{'a', 'b'}`, and a loop can build a set too: start with `set()` and `add` each tidied name. With `x = {1, 2, 3}` and `y = {3, 4}`: `x & y` is `{3}`, `x | y` is `{1, 2, 3, 4}`, `x - y` is `{1, 2}` and `y - x` is `{4}`.",
        "Make a set of the book, and a set of the tidied finds with a loop. The first three answers are each one operator between your two sets. `only_one` needs two: everything, minus something.",
      ],
      solution: r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set()
for herb in found:
    dug_up.add(herb.strip().lower())
growing = in_book & dug_up
missing = in_book - dug_up
new_pages = dug_up - in_book
only_one = (in_book | dug_up) - (in_book & dug_up)`,
      wrong: [r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
growing = book & found
missing = book - found
new_pages = found - book
only_one = book | found`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set(found)
growing = in_book & dug_up
missing = in_book - dug_up
new_pages = dug_up - in_book
only_one = (in_book | dug_up) - (in_book & dug_up)`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set()
for herb in found:
    dug_up.add(herb.strip().lower())
growing = in_book & dug_up
missing = dug_up - in_book
new_pages = in_book - dug_up
only_one = (in_book | dug_up) - (in_book & dug_up)`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set()
for herb in found:
    dug_up.add(herb.strip().lower())
growing = in_book | dug_up
missing = in_book - dug_up
new_pages = dug_up - in_book
only_one = (in_book | dug_up) - (in_book & dug_up)`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set()
for herb in found:
    dug_up.add(herb.strip().lower())
growing = in_book & dug_up
missing = in_book - dug_up
new_pages = dug_up - in_book
only_one = in_book | dug_up`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
in_book = set(book)
dug_up = set()
for herb in found:
    dug_up.add(herb.strip().lower())
growing = in_book & dug_up
missing = in_book - dug_up
new_pages = dug_up - in_book
only_one = in_book - dug_up`, r`book = ["yarrow", "sage", "feverfew", "mint", "betony", "sage", "comfrey", "valerian"]
found = ["Mint", "sage ", "wild garlic", "mint", " Comfrey", "nettle"]
growing = {"sage", "mint", "comfrey"}
missing = {"yarrow", "feverfew", "betony", "valerian"}
new_pages = {"wild garlic", "nettle"}
only_one = {"yarrow", "feverfew", "betony", "valerian", "wild garlic", "nettle"}`],
      done: "Mirela: Four still to find: yarrow, feverfew, betony and valerian. I will. And the chimney's drawing well: look at that curl of smoke. The fog doesn't like smoke. It's backing off the doorstep. A little.",
    },
    {
      id: "a10-smudged-marks",
      part: "Greenhouse frame",
      title: "Smudged Marks",
      topic: "try / except",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Mirela: Now the greenhouse. My mother always wanted one. And the fog has been into my measuring book overnight. Half the marks are smudged: this one says 120, and this one says... a sad grey smear.",
        "Sorry. Pip's a bit... faint today. The fog makes Pip's scales feel heavy. Pip will be fine. Let's measure.",
        "`int(\"smear\")` stops the whole program with a `ValueError`. Put the risky line inside **`try:`**, and say what to do instead under **`except ValueError:`**. Then the program carries on.",
      ],
      codex: ["try-except", "parsing", "errors"],
      quiz: {
        code: r`try:
    n = int("3.5")
except ValueError:
    n = -1
print(n)`,
        question: "What does this program show?",
        options: ["-1", "3", "3.5", "ValueError"],
        answer: 0,
        why: "int() only takes whole numbers, so int(\"3.5\") raises a ValueError. The except block catches it and sets n to -1, and the program carries on.",
      },
      task: [
        "Write `read_mark(mark)`. It gives back the measurement as a whole number when the mark can be read, and `None` (no measurement at all) when it can't.",
        "Spaces around a number don't spoil it. Words, smears, halves like `4.5` and empty marks can't be read.",
        "Catch only the trouble you're expecting, by its name.",
        "Then add up every mark in `marks` that can be read, and print the total.",
      ],
      starter: r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]   # greenhouse frame, in cm

# def read_mark(mark):

# Add up the marks that can be read, and print the total.
`,
      tests: PRE + r`want_fn("read_mark")
label, got, err = attempt("read_mark", "smear")
check(not isinstance(err, ValueError), label + " stopped with ValueError: " + str(err) + ". That's exactly the trouble to catch: put the risky line inside try, and say what to give back under except ValueError.")
crashed(label, err)
check(got != 0, "read_mark('smear') gave back 0, but 0 would be a real (very short) measurement. For a mark nobody can read, give back None: no measurement at all.")
check(got is None, "read_mark('smear') should give back None, but it gave back " + repr(got) + ".")
for mark, want in [("120", 120), (" 85", 85), ("60 ", 60), ("7", 7)]:
    g = call("read_mark", mark)
    check(not isinstance(g, str), "read_mark(" + repr(mark) + ") gave back the text " + repr(g) + ". Give back a real number.")
    check(g == want, "read_mark(" + repr(mark) + ") should give back the number " + str(want) + ", but it gave back " + repr(g) + ". Spaces around a number are fine: int() copes with them.")
for mark in ["4.5", "", "??", "nine", "3 4"]:
    g = call("read_mark", mark)
    check(g is None, "read_mark(" + repr(mark) + ") should give back None, because it isn't a whole number, but it gave back " + repr(g) + ".")
check("except ValueError" in code_only(), "Name the trouble you're catching: except ValueError:. A bare except catches every mistake, even typing errors, and hides them from you.")
check("265" in out, "Add up the marks that can be read and print the total. The rune can't see the right total in what you printed.")
vns, vl = again(('marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]', 'marks = ["10", "x", " 5"]'))
vout = " ".join(vl)
check("15" in vout and "265" not in vout, "With other marks, \"10\", \"x\" and \" 5\", the readable total is 15, but your program printed: " + vout + ". Add up from marks using read_mark, instead of typing the total.")`,
      hints: [
        "Which single line in `read_mark` could go wrong? Everything else is safe. Then: what should the function hand back when that line fails?",
        "`try:` runs its block; if a `ValueError` happens inside it, Python jumps to `except ValueError:` instead of stopping. For example: `try:` / `    eggs = int(\"a dozen\")` / `except ValueError:` / `    eggs = 0`.",
        "Inside `read_mark`: `try:` / `    return ...` / `except ValueError:` / `    return ...`. For the total: which marks should the loop leave out, and how can it tell?",
      ],
      solution: r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except ValueError:
        return None

total = 0
for mark in marks:
    length = read_mark(mark)
    if length is not None:
        total += length
print("Readable marks add up to", total, "cm")`,
      wrong: [r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    return int(mark)

print(265)`, r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except ValueError:
        return 0

total = 0
for mark in marks:
    total += read_mark(mark)
print(total)`, r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except:
        return None

total = 0
for mark in marks:
    length = read_mark(mark)
    if length is not None:
        total += length
print(total)`, r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except ValueError:
        return "smudged"

total = 0
for mark in marks:
    length = read_mark(mark)
    if length != "smudged":
        total += length
print(total)`, r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except ValueError:
        return None

print("Total: 265")`, r`marks = ["120", " 85", "smear", "4.5", "", "60 ", "??"]

def read_mark(mark):
    try:
        return int(mark)
    except ValueError:
        return None

total = 0
for mark in marks:
    length = read_mark(mark)
    if length is not None:
        total += length`],
      done: "Mirela: Posts, rafters and a door frame. The greenhouse has its bones. Every mark we could read was right, and the smudged ones I'll measure with my thumb, the way my mother did.",
    },
    {
      id: "a11-potting-bench",
      part: "Greenhouse glass and bench",
      title: "The Potting Bench",
      topic: "several excepts",
      cost: { wood: 3, stone: 3 },
      intro: [
        "Glass! You can see right through it. The seedlings can see out... and the fog can see in. Pip doesn't care for that.",
        "Mirela: Inside, where it's warm, I pot up the seedlings. I share each tray out evenly between the pots, and whatever won't share evenly stays in the tray for spares.",
        "Different troubles want different answers. One `try` can have **several** `except` blocks, one for each kind of error, and an **`else:`** after them runs only when nothing went wrong.",
        "Asking a dictionary for a key it hasn't got is a `KeyError`. Dividing by zero is a `ZeroDivisionError`.",
      ],
      codex: ["try-except", "errors"],
      quiz: {
        code: r`try:
    loaves = 12 // 4
except ZeroDivisionError:
    print("No baskets!")
else:
    print(loaves, "per basket")`,
        question: "What does this program show?",
        options: ["3 per basket", "No baskets!", "No baskets!\n3 per basket", "(nothing)"],
        answer: 0,
        why: "Nothing went wrong in the try block, so the except is skipped and else runs.",
      },
      task: [
        "Write `pot_up(trays, herb, pots)`. `trays` is a dictionary of the seedling trays on the bench: herb name, and how many seedlings. It gives back two numbers: how many of that herb's seedlings go in each pot, and how many stay behind in the tray.",
        "If there's no tray of that herb on the bench, there's nothing to pot: none in each pot, none left.",
        "If there are no pots, nothing gets potted: none in each pot, and the whole tray stays.",
        "This bench is for practising catching: let Python run into each trouble, and give each one its own `except`.",
      ],
      starter: r`bench = {"basil": 14, "mint": 9, "lemon balm": 6}   # seedlings in each tray

# def pot_up(trays, herb, pots):

# print(pot_up(bench, "basil", 6))
# print(pot_up(bench, "yarrow", 6))
# print(pot_up(bench, "mint", 0))
`,
      tests: PRE + r`want_fn("pot_up")
def bench():
    return {"basil": 14, "mint": 9, "lemon balm": 6}
label, gy, err = attempt("pot_up", bench(), "yarrow", 6)
check(not isinstance(err, KeyError), label + " stopped with KeyError: " + str(err) + ". There's no yarrow tray on the bench. That's one of the troubles to catch.")
crashed(label, err)
label, gz, err = attempt("pot_up", bench(), "mint", 0)
check(not isinstance(err, ZeroDivisionError), label + " stopped with ZeroDivisionError. With no pots, nothing can be shared out. That's a trouble to catch too.")
crashed(label, err)
rb = call("pot_up", bench(), "basil", 6)
check(isinstance(rb, tuple) and len(rb) == 2, "pot_up should give back two numbers: seedlings in each pot, and seedlings left in the tray. pot_up(bench, 'basil', 6) gave back " + repr(rb) + ".")
check(rb == (2, 2), "14 basil seedlings into 6 pots: pot_up gave back " + repr(rb) + ". The first number is how many go in each pot; the second, how many can't be shared out evenly and stay in the tray.")
rm = call("pot_up", bench(), "mint", 4)
check(rm == (2, 1), "9 mint seedlings into 4 pots: pot_up gave back " + repr(rm) + ".")
rl = call("pot_up", bench(), "lemon balm", 6)
check(rl == (1, 0), "6 lemon balm seedlings into 6 pots: pot_up gave back " + repr(rl) + ".")
check(gy == (0, 0), "With no yarrow on the bench there's nothing to pot: none in each pot and none left. pot_up(bench, 'yarrow', 6) gave back " + repr(gy) + ".")
check(gz != (0, 0), "With no pots nothing gets potted, but the mint is still there: the whole tray stays. pot_up(bench, 'mint', 0) gave back (0, 0).")
check(gz == (0, 9), "With no pots nothing gets potted, and every mint seedling stays in its tray. pot_up(bench, 'mint', 0) gave back " + repr(gz) + ".")
ry = call("pot_up", bench(), "yarrow", 0)
check(ry == (0, 0), "No yarrow and no pots: there's still no yarrow to leave in a tray. pot_up(bench, 'yarrow', 0) gave back " + repr(ry) + ".")
b = bench()
call("pot_up", b, "basil", 6)
check(b == bench(), "pot_up changed the bench dictionary it was given (now " + repr(b) + "). It only works out the numbers.")
plain = code_only()
check("try" in plain and "except KeyError" in plain and "except ZeroDivisionError" in plain,"The answers are right, but this bench is for practising catching: do the sums inside try, and give each trouble its own except, one for KeyError and one for ZeroDivisionError.")`,
      hints: [
        "Work out basil into 6 pots on paper first. Then ask: which part of your sum breaks when the herb isn't on the bench, and which breaks when there are no pots? Each of those gets its own answer.",
        "One try, several excepts, each with its own answer: `try:` / `    cost = prices[loaf] * int(how_many)` / `except KeyError:` ... / `except ValueError:` ... and an `else:` after them runs only when nothing went wrong. For the sums: `//` gives the even share and `%` the leftover.",
        "Inside `try`, work out the share and the spares from `trays[herb]` and `pots`. Under `except KeyError:` there's nothing to pot at all. Under `except ZeroDivisionError:`, what is still sitting in the tray? `else:` hands back what you worked out.",
      ],
      solution: r`bench = {"basil": 14, "mint": 9, "lemon balm": 6}

def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
        left = trays[herb] % pots
    except KeyError:
        return 0, 0
    except ZeroDivisionError:
        return 0, trays[herb]
    else:
        return each, left

print(pot_up(bench, "basil", 6))
print(pot_up(bench, "yarrow", 6))
print(pot_up(bench, "mint", 0))`,
      wrong: [r`def pot_up(trays, herb, pots):
    return trays[herb] // pots, trays[herb] % pots`, r`def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
        left = trays[herb] % pots
    except (KeyError, ZeroDivisionError):
        return 0, 0
    else:
        return each, left`, r`def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
        left = trays[herb] % pots
    except KeyError:
        return 0, 0
    except ZeroDivisionError:
        return trays[herb], 0
    else:
        return each, left`, r`def pot_up(trays, herb, pots):
    if herb not in trays:
        return 0, 0
    if pots == 0:
        return 0, trays[herb]
    return trays[herb] // pots, trays[herb] % pots`, r`def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
    except KeyError:
        return 0
    except ZeroDivisionError:
        return 0
    else:
        return each`, r`def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
        left = trays[herb] - each
    except KeyError:
        return 0, 0
    except ZeroDivisionError:
        return 0, trays[herb]
    else:
        return each, left`, r`def pot_up(trays, herb, pots):
    try:
        each = trays[herb] // pots
        trays[herb] = trays[herb] % pots
    except KeyError:
        return 0, 0
    except ZeroDivisionError:
        return 0, trays[herb]
    else:
        return each, trays[herb]`],
      done: "Mirela: Two basil in every pot, two spare in the tray, and the lemon tree in the corner looking very pleased with itself. It's warm in here. Pip, I'll bring a sprig of lemon out to your stone. You look pale. Paler. Less green?",
    },
    {
      id: "a12-planting-list",
      part: "Herb garden beds",
      title: "The Fogged Planting List",
      topic: "keeping good lines, counting bad ones",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Mirela: Spades out! Three raised beds, a herb spiral and a wattle fence. I wrote the planting list last night, and look at it now. The fog's been at it like a slug at a lettuce.",
        "Mirela: Oh! My spade's hit something. A clay pot, very old, with runes scratched round the rim. And there's a card inside, rolled up tight.",
        "That's... Willowmere writing. Keep it safe, Mirela. Keep it dry. We'll read it once the garden's planted.",
        "For the list, the stone must **try** each line, keep the good ones and count the bad ones, instead of giving up at the first smudge. Remember: unpacking the wrong number of pieces is a `ValueError` too.",
      ],
      codex: ["try-except", "unpacking", "parsing"],
      quiz: {
        code: r`total = 0
try:
    for word in ["2", "two", "3"]:
        total += int(word)
except ValueError:
    total += 100
print(total)`,
        question: "What does this program show?",
        options: ["102", "105", "5", "ValueError"],
        answer: 0,
        why: "The try wraps the whole loop, so the error on \"two\" jumps straight out of it. The 3 is never added: 2 + 100 = 102.",
      },
      task: [
        "Write `read_planting(lines)`. A good line is a herb's name (one word) and a whole number of plants, more than 0, with spaces between them.",
        "It gives back two values: a dictionary of how many plants of each herb go in, with lowercase names (a herb on two lines adds up), and how many lines were too smudged to read.",
        "Blank lines (nothing, or only spaces) are just gaps between beds: skip them, and don't count them as smudges.",
        "A smudged line mustn't stop the rest of the list from being read.",
      ],
      starter: r`planting = [
    "Lavender 6",
    "sage 4",
    "mint ??",
    "",
    "rosemary",
    "chamomile 5",
    "SAGE 2",
    "thyme -1",
    "   ",
    "marigold 3 4",
]

# def read_planting(lines):

# plants, smudged = read_planting(planting)
# print(plants, smudged)
`,
      tests: PRE + r`want_fn("read_planting")
plan = ["Lavender 6", "sage 4", "mint ??", "", "rosemary", "chamomile 5", "SAGE 2", "thyme -1", "   ", "marigold 3 4"]
label, rr, err = attempt("read_planting", plan)
check(not isinstance(err, ValueError), label + " stopped with ValueError: " + str(err) + ". One smudged line shouldn't stop the whole list: catch the trouble for that line, count it, and carry on with the next.")
check(not isinstance(err, IndexError), label + " crashed with IndexError: " + str(err) + ". A line like \"rosemary\" has only one piece, so there's no second one to read. Unpacking into two names notices a wrong number of pieces for you, as a ValueError you can catch.")
crashed(label, err)
check(isinstance(rr, tuple) and len(rr) == 2, "read_planting should give back two values: the dictionary of plants and the number of smudged lines. It gave back " + repr(rr) + ".")
plants, bad = rr
check(isinstance(plants, dict), "The first value should be a dictionary of herbs and plants, but it is " + repr(plants) + ".")
check(isinstance(bad, int), "The second value should be a number, how many lines were smudged, but it is " + repr(bad) + ".")
check("chamomile" in plants or "Chamomile" in plants, "Nothing after the first smudge made it into the dictionary: " + repr(plants) + ". Does one smudge end the whole loop? Each line needs its own try.")
check(all(isinstance(k, str) and k == k.lower() for k in plants), "Mirela wants the herb names in lowercase: " + repr(plants) + ".")
check("thyme" not in plants, "\"thyme -1\" isn't a planting: nobody can put in fewer than one plant. A number of 0 or less makes a line smudged.")
check("marigold" not in plants, "\"marigold 3 4\" has three parts, and a good line has exactly two. Count it as smudged.")
check(plants.get("sage") != 4 and plants.get("sage") != 2, "Sage is on the list twice, as \"sage 4\" and \"SAGE 2\". Both lines count: add them up instead of keeping one.")
check(plants == {"lavender": 6, "sage": 6, "chamomile": 5}, "For Mirela's list the dictionary came out as " + repr(plants) + ". Check that every good line made it in, with its number as a real number.")
check(bad != 6, "Blank lines are gaps between beds, not smudges. Skip them without counting them.")
check(bad == 4, "Mirela's list has 4 smudged lines, but read_planting counted " + repr(bad) + ".")
r2 = call("read_planting", ["Fennel 2", "fennel x", "dill 0", "basil 1"])
check(r2 == ({"fennel": 2, "basil": 1}, 2), "read_planting(['Fennel 2', 'fennel x', 'dill 0', 'basil 1']) gave back " + repr(r2) + ". Work from the lines it is given.")
r3 = call("read_planting", ["Mint 2", "mint 3", "MINT 1"])
check(r3 == ({"mint": 6}, 0), "read_planting(['Mint 2', 'mint 3', 'MINT 1']) gave back " + repr(r3) + ". However it's written, it's the same mint.")
r4 = call("read_planting", ["", "   "])
check(r4 == ({}, 0), "A list of only gaps has no plants and no smudges, but read_planting gave back " + repr(r4) + ".")
r5 = call("read_planting", [])
check(r5 == ({}, 0), "An empty list should give back an empty dictionary and 0, but read_planting gave back " + repr(r5) + ".")`,
      hints: [
        "Go down the list by hand and sort each line into three piles: gap, smudge or good. Exactly what makes a line a smudge? There are three different ways in this list.",
        "Put the `try` *inside* the loop so every line gets its own chance: `for word in words:` / `    try:` / `        n = int(word)` / `    except ValueError:` / `        bad += 1` / `        continue`. And `a, b = \"one two three\".split()` is a ValueError too: too many pieces to unpack.",
        "In the loop: skip the gaps; `try:` unpack `line.split()` into two names and make the number an `int`; `except ValueError:` count it and `continue`. One more test is needed before a line counts as good: which one? Then add it into the dictionary under its lowercase name.",
      ],
      solution: r`planting = ["Lavender 6", "sage 4", "mint ??", "", "rosemary", "chamomile 5", "SAGE 2", "thyme -1", "   ", "marigold 3 4"]

def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        herb = herb.lower()
        plants[herb] = plants.get(herb, 0) + number
    return plants, smudged

plants, smudged = read_planting(planting)
print(plants, smudged)`,
      wrong: [r`def read_planting(lines):
    plants = {}
    smudged = 0
    try:
        for line in lines:
            if line.strip() == "":
                continue
            herb, number = line.split()
            number = int(number)
            if number <= 0:
                smudged += 1
                continue
            herb = herb.lower()
            plants[herb] = plants.get(herb, 0) + number
    except ValueError:
        smudged += 1
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        herb = herb.lower()
        plants[herb] = plants.get(herb, 0) + number
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        herb = herb.lower()
        plants[herb] = plants.get(herb, 0) + number
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        plants[herb.lower()] = number
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        plants[herb] = plants.get(herb, 0) + number
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        parts = line.split()
        try:
            number = int(parts[1])
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        herb = parts[0].lower()
        plants[herb] = plants.get(herb, 0) + number
    return plants, smudged`, r`def read_planting(lines):
    plants = {}
    smudged = 0
    for line in lines:
        if line.strip() == "":
            continue
        try:
            herb, number = line.split()
            number = int(number)
        except ValueError:
            smudged += 1
            continue
        if number <= 0:
            smudged += 1
            continue
        herb = herb.lower()
        plants[herb] = plants.get(herb, 0) + number
    return plants`],
      done: "Mirela: Beds dug, the spiral built, the fence woven. Seventeen plants to go in: twelve for the beds and five up the spiral, and the four smudges I'll fill in from memory. Now. That card from the pot...",
    },
    {
      id: "a13-watering-rune",
      part: "Herbs growing",
      title: "A Rune That Says No",
      topic: "raise",
      cost: { wood: 0, stone: 0 },
      intro: [
        "Mirela: The card from the pot. It's a recipe, in old, careful writing. *A tonic for a tired stone.* Well. I know a stone that's tired.",
        "Pip doesn't remember everything. But Pip remembers that smell. Lavender and rain.",
        "Mirela: Then first the herbs must grow, and quickly. They grow when they're watered, and when runes are spoken near them. I'll do the watering. You do the speaking.",
        "A good rune says **no** clearly when it's asked something impossible. `raise ValueError(\"...\")` stops your function and hands the trouble, with your message, back to whoever called it. They can catch it with `try` / `except`, just like Python's own errors.",
      ],
      codex: ["raise", "try-except", "unpacking"],
      quiz: {
        code: r`def check_age(age):
    if age < 0:
        raise ValueError("too young to exist")
    return age

try:
    print(check_age(-1))
except ValueError as e:
    print("Oops:", e)`,
        question: "What does this program show?",
        options: ["Oops: too young to exist", "-1", "ValueError", "Oops: ValueError"],
        answer: 0,
        why: "The raise stops check_age before it returns, so the first print never happens. The except catches the error as e, and printing e shows its message.",
      },
      task: [
        "`EVERY` (in the starter) says how often each herb needs water: mint every day, sage every 3 days, and so on.",
        "Write `waterings(herb, days)`: how many times to water `herb` over `days` days. Only full stretches count: sage over 7 days is 2 waterings, and 0 days is no watering at all.",
        "When it's asked the impossible, it doesn't guess: it raises a `ValueError` with a message saying what's wrong. A herb that isn't in `EVERY` is impossible (name the herb in your message), and so is a number of days below 0 (put the number in your message).",
        "Write `plan_week(requests)`. `requests` is a list of (herb, days) pairs. It gives back two values: a dictionary of herb → waterings for the requests that work, and a list of the messages from the ones that don't, in order. One impossible request mustn't stop the others.",
      ],
      starter: r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}   # water every this many days

requests = [("mint", 7), ("sage", 7), ("yarrow", 5), ("lavender", 14), ("basil", -2)]

# def waterings(herb, days):

# def plan_week(requests):

# print(plan_week(requests))
`,
      tests: PRE + r`want_fn("waterings")
label, g0, err = attempt("waterings", "rosemary", 0)
check(err is None, label + " raised " + tell(err) + ". 0 days is fine: it just means no watering at all.")
check(g0 == 0, "Over 0 days, rosemary needs no watering, but waterings('rosemary', 0) gave back " + repr(g0) + ".")
for herb, days, want in [("sage", 7, 2), ("mint", 7, 7), ("lavender", 6, 0), ("basil", 9, 4)]:
    g = call("waterings", herb, days)
    check(g == want, "waterings(" + repr(herb) + ", " + str(days) + ") gave back " + repr(g) + ". Count only the full stretches between waterings, using that herb's own number from EVERY: sage over 7 days is 2.")
def says_no(herb, days, mention, what):
    label, got, err = attempt("waterings", herb, days)
    check(err is not None, label + " gave back " + repr(got) + " instead of saying no. Raise a ValueError when the rune is asked the impossible.")
    check(not isinstance(err, KeyError), label + " let Python's own KeyError slip out. Check for the trouble first, and raise your own ValueError with a message Mirela can understand.")
    check(isinstance(err, ValueError), label + " raised " + type(err).__name__ + ", but the rune expects a ValueError.")
    msg = str(err)
    check(msg.strip() != "", label + " raised a ValueError with no message. Say what's wrong, inside the brackets.")
    check(mention == "" or mention.lower() in msg.lower(),label + " says " + repr(msg) + ". Put " + what + " in the message, so Mirela knows which request went wrong.")
says_no("yarrow", 5, "yarrow", "the herb's name")
says_no("nettle", 3, "nettle", "the herb's name")
says_no("mint", -3, "-3", "the number of days")
says_no("basil", -1, "-1", "the number of days")
says_no("nettle", -1, "", "")
want_fn("plan_week")
reqs = [("mint", 7), ("sage", 7), ("yarrow", 5), ("lavender", 14), ("basil", -2)]
label, rr, err = attempt("plan_week", reqs)
check(not isinstance(err, ValueError), label + " stopped at the first impossible request (" + str(err) + "). Catch each ValueError and carry on with the next request.")
crashed(label, err)
check(isinstance(rr, tuple) and len(rr) == 2, "plan_week should give back two values: the dictionary of waterings and the list of problem messages. It gave back " + repr(rr) + ".")
plan, problems = rr
check(isinstance(plan, dict), "The first value should be a dictionary of herb and waterings, but it is " + repr(plan) + ".")
check(plan == {"mint": 7, "sage": 2, "lavender": 2}, "The plan should hold the requests that work, each herb with its number of waterings. plan_week gave back " + repr(plan) + ".")
check(isinstance(problems, list), "The second value should be a list of messages, but it is " + repr(problems) + ".")
check(all(isinstance(p, str) for p in problems), "The problems list should hold the messages as text, but it holds " + repr(problems) + ". str() of a caught error gives its message.")
wanted = [str(attempt("waterings", "yarrow", 5)[2]), str(attempt("waterings", "basil", -2)[2])]
check(problems == wanted, "The problems list should hold the messages your own waterings raised for the two impossible requests, in order. It holds " + repr(problems) + ".")
r2 = call("plan_week", [("rue", 2), ("mint", 3)])
check(isinstance(r2, tuple) and len(r2) == 2 and r2[0] == {"mint": 3} and r2[1] == [str(attempt("waterings", "rue", 2)[2])], "plan_week([('rue', 2), ('mint', 3)]) gave back " + repr(r2) + ". Work from the requests it is given.")
r3 = call("plan_week", [])
check(r3 == ({}, []), "No requests should give back an empty dictionary and an empty list, but plan_week gave back " + repr(r3) + ".")`,
      hints: [
        "First the happy path: how many full gaps between waterings fit into the days? Then list the two impossible asks, and decide what each message should tell Mirela.",
        "`if eggs < 0:` / `    raise ValueError(f\"{eggs} eggs? That can't be right.\")` stops the function right there. A caller catches it with `except ValueError as problem:`, and `str(problem)` is your message.",
        "`waterings`: two guards at the top, each raising a `ValueError` with an f-string message, then one line of arithmetic. `plan_week`: loop over the pairs, `try:` the call, `except ValueError as problem:`. What goes into each of your two results?",
      ],
      solution: r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

requests = [("mint", 7), ("sage", 7), ("yarrow", 5), ("lavender", 14), ("basil", -2)]

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    if days < 0:
        raise ValueError(f"{days} days is less than no days at all.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems

print(plan_week(requests))`,
      wrong: [r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        return "unknown herb"
    if days < 0:
        return "too few days"
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        plan[herb] = waterings(herb, days)
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if days < 0:
        raise ValueError(f"{days} days is less than no days at all.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError()
    if days < 0:
        raise ValueError()
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError("Unknown herb.")
    if days < 0:
        raise ValueError("Too few days.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    if days <= 0:
        raise ValueError(f"{days} days is too few.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(str(problem))
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    if days < 0:
        raise ValueError(f"{days} days is less than no days at all.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        plan[herb] = waterings(herb, days)
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    if days < 0:
        raise ValueError(f"{days} days is less than no days at all.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            problems.append(problem)
    return plan, problems`, r`EVERY = {"mint": 1, "basil": 2, "sage": 3, "rosemary": 4, "lavender": 7}

def waterings(herb, days):
    if herb not in EVERY:
        raise ValueError(f"There's no {herb} in the garden.")
    if days < 0:
        raise ValueError(f"{days} days is less than no days at all.")
    return days // EVERY[herb]

def plan_week(requests):
    plan = {}
    problems = []
    for herb, days in requests:
        try:
            plan[herb] = waterings(herb, days)
        except ValueError as problem:
            print(problem)
    return plan, problems`],
      done: "Mirela: Look at them. Seventeen clumps, swaying, and the fog curling back from the beds wherever the runes reach. Lavender and rain, Pip. Can you smell it? Now: the tonic.",
    },
    {
      id: "a14-tonic",
      part: "Drying herbs, lantern and tonic",
      title: "A Tonic for a Tired Stone",
      topic: "putting it together",
      cost: { wood: 6, stone: 5 },
      intro: [
        "The stone is so dim now. Pip can hardly... hold the light. Sorry. Pip is being dramatic. Pip is also very, very tired.",
        "Mirela: Then we brew. Now. The card from the pot is the recipe, but three hundred years haven't been kind to it. Some lines are fine, some are cracked, and every measure is written the old way: the herb, an equals sign, then the scoops.",
        "Mirela: And I can only brew with what's on my shelf. Whatever's missing, someone will have to run down to the village and fetch.",
        "This uses the whole garden at once: cutting and tidying text, unpacking, `int()`, `try` / `except`, your own `raise`, sets and a dictionary. Write the small functions first and test each one, then let them work together.",
      ],
      codex: ["raise", "try-except", "parsing", "set-ops"],
      quiz: {
        code: r`line = "sweet bay = 2"
herb, n = line.split("=")
print(herb.strip().upper(), int(n) + 1)`,
        question: "What does this program show?",
        options: ["SWEET BAY 3", "SWEET BAY 21", "sweet bay 3", "ValueError"],
        answer: 0,
        why: "Cutting at the = gives two pieces, \"sweet bay \" and \" 2\", so the unpacking works. int() doesn't mind the space, so it's the number 2, plus 1.",
      },
      task: [
        "`read_line(line)`: reads one line of the card and gives back the pair: the herb (tidy and lowercase; some herbs have two words) and the scoops as a whole number. A line it can't read raises a `ValueError`: no equals sign, more than one, no herb before it, or scoops that aren't a whole number above 0.",
        "`brew(card, shelf)`: `card` is a list of lines and `shelf` a set of the herbs Mirela has. It gives back three values: the recipe as a dictionary (herb → total scoops; a herb on two lines adds up), the set of herbs the recipe needs that aren't on the shelf, and how many lines were too cracked to read. Blank lines are just gaps. Let `read_line` do the reading.",
        "`fetch_list(missing)`: one string to send down to the village: the missing herbs in alphabetical order, with a comma and a space between them. If nothing is missing, it says `nothing to fetch`.",
        "Finally, brew the old card with Mirela's shelf, and print what has to be fetched.",
      ],
      starter: r`card = [
    "Lavender = 3",
    "lemon balm=2",
    "  chamomile =  1 ",
    "rain water = a cup",
    "= 4",
    "",
    "mint = 2 = 3",
    "LAVENDER = 1",
    "feverfew = 0",
    "yarrow = 2",
]
shelf = {"lavender", "chamomile", "mint", "sage", "rosemary"}   # what Mirela has

# def read_line(line):

# def brew(card, shelf):

# def fetch_list(missing):

# Brew the old card, and print what has to be fetched.
`,
      tests: PRE + r`want_fn("read_line")
for line, want in [("Lavender = 3", ("lavender", 3)), ("  lemon balm=2", ("lemon balm", 2)), (" Sweet Cicely =  10 ", ("sweet cicely", 10))]:
    label, got, err = attempt("read_line", line)
    check(err is None, label + " crashed with " + tell(err) + ". That line is fine and should be read.")
    check(isinstance(got, tuple) and len(got) == 2, label + " should give back a pair: the herb and the scoops. It gave back " + repr(got) + ".")
    check(got[0] == want[0], label + " gave back the herb " + repr(got[0]) + ". The herb should be tidy and lowercase, and remember that some herbs have two words.")
    check(isinstance(got[1], int) and got[1] == want[1], label + " gave back the scoops " + repr(got[1]) + ". They should be a whole number.")
for line, why in [("rain water = a cup", "its scoops aren't a whole number"), ("= 4", "there's no herb before the ="), ("mint = 2 = 3", "it has more than one ="), ("feverfew = 0", "0 scoops is no scoops at all"), ("nettle", "there's no = at all"), ("yarrow = -2", "its scoops are below 0"), ("sage = 2.5", "its scoops aren't a whole number")]:
    label, got, err = attempt("read_line", line)
    check(err is not None, label + " gave back " + repr(got) + ", but that line is cracked: " + why + ". Raise a ValueError for it.")
    check(isinstance(err, ValueError), label + " raised " + tell(err) + ". A cracked line should raise a ValueError, so brew can catch every kind of crack the same way.")
    check(str(err).strip() != "", label + " raised a ValueError with no message. Say what's wrong with the line.")
want_fn("brew")
card = ["Lavender = 3", "lemon balm=2", "  chamomile =  1 ", "rain water = a cup", "= 4", "", "mint = 2 = 3", "LAVENDER = 1", "feverfew = 0", "yarrow = 2"]
shelf = {"lavender", "chamomile", "mint", "sage", "rosemary"}
label, rb, err = attempt("brew", card, set(shelf))
check(not isinstance(err, ValueError), label + " stopped at a cracked line (" + str(err) + "). Catch it, count it, and carry on with the next line.")
crashed(label, err)
check(isinstance(rb, tuple) and len(rb) == 3, "brew should give back three values: the recipe, the missing herbs and the number of cracked lines. It gave back " + repr(rb) + ".")
recipe, missing, cracked = rb
check(isinstance(recipe, dict), "The recipe should be a dictionary of herbs and scoops, but it is " + repr(recipe) + ".")
check(recipe.get("lavender") != 3 and recipe.get("lavender") != 1, "Lavender is on the card twice. Add both lines' scoops together.")
check(recipe == {"lavender": 4, "lemon balm": 2, "chamomile": 1, "yarrow": 2}, "The recipe from the old card came out as " + repr(recipe) + ".")
check(isinstance(missing, set), "The missing herbs should be a set, but brew gave back " + repr(missing) + ".")
check(missing != {"mint", "sage", "rosemary"}, "Those are the shelf herbs the tonic doesn't use. Mirela wants it the other way round: herbs the recipe needs that the shelf hasn't got.")
check(missing == {"lemon balm", "yarrow"}, "The missing herbs came out as " + repr(sorted(missing)) + ". Which of the recipe's herbs aren't on the shelf?")
check(cracked != 5, "Blank lines are gaps on the card, not cracks. Skip them without counting them.")
check(cracked == 4, "The old card has 4 cracked lines, but brew counted " + repr(cracked) + ".")
r2 = call("brew", ["Sage = 1", "sage=2", "", "   ", "nettle", "Mint = 1"], {"mint"})
check(r2 == ({"sage": 3, "mint": 1}, {"sage"}, 1), "brew on a second card gave back " + repr(r2) + ". Work from the card and shelf it is given.")
r3 = call("brew", [], set())
check(r3 == ({}, set(), 0), "An empty card should give back an empty recipe, no missing herbs and 0 cracked lines, but brew gave back " + repr(r3) + ".")
s = {"mint"}
call("brew", ["mint = 1", "rue = 1"], s)
check(s == {"mint"}, "brew changed the shelf it was given (now " + repr(s) + "). It only works things out.")
check(uses("brew", "read_line", (["mint = 1"], {"mint"})), "brew gets the right answers, but it reads the lines by itself. Let read_line do the reading, and catch its ValueError: that's what it's for.")
want_fn("fetch_list")
for herbs, want in [({"yarrow", "lemon balm"}, "lemon balm, yarrow"), ({"tansy"}, "tansy"), ({"rue", "betony", "sorrel", "angelica", "dill"}, "angelica, betony, dill, rue, sorrel")]:
    g = call("fetch_list", set(herbs))
    check(isinstance(g, str), "fetch_list should give back one string, but it gave back " + repr(g) + ".")
    check(g == want, "For the herbs " + repr(herbs) + ", fetch_list gave back " + repr(g) + ". The herbs go in alphabetical order, with a comma and a space between them, and nothing else.")
ge = call("fetch_list", set())
check(ge == "nothing to fetch", "When nothing is missing, fetch_list should say nothing to fetch, but it gave back " + repr(ge) + ".")
check("lemon balm, yarrow" in out, "Brew the old card with Mirela's shelf, and print what has to be fetched, using fetch_list.")`,
      hints: [
        "Write and test one function at a time, starting with `read_line` on one good line and one cracked one. How many ways can a line be cracked? Python notices some of them on its own; the others only you can spot.",
        "`\"rye flour = 2\".split(\"=\")` gives `['rye flour ', ' 2']`, ready to unpack (and a line with two `=` won't unpack: a ValueError for free). For the rest, `raise ValueError(\"...\")`. Sets subtract with `-`, and `sorted()` gives a list in alphabetical order, ready for `\", \".join(...)`.",
        "`read_line`: unpack, tidy, two checks that raise, return the pair. `brew`: your planting-list loop again, with `read_line` inside the `try`; the missing herbs are one set operation away (`set(a_dict.keys())` is a set of its keys). `fetch_list`: the empty case first.",
      ],
      solution: r`card = [
    "Lavender = 3",
    "lemon balm=2",
    "  chamomile =  1 ",
    "rain water = a cup",
    "= 4",
    "",
    "mint = 2 = 3",
    "LAVENDER = 1",
    "feverfew = 0",
    "yarrow = 2",
]
shelf = {"lavender", "chamomile", "mint", "sage", "rosemary"}

def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    missing = set(recipe.keys()) - shelf
    return recipe, missing, cracked

def fetch_list(missing):
    if len(missing) == 0:
        return "nothing to fetch"
    return ", ".join(sorted(missing))

recipe, missing, cracked = brew(card, shelf)
print("The tonic:", recipe)
print("Cracked lines:", cracked)
print("Please fetch:", fetch_list(missing))`,
      wrong: [r`def read_line(line):
    parts = line.split()
    herb = parts[0].lower()
    scoops = int(parts[-1])
    if scoops <= 0:
        raise ValueError("Too few scoops.")
    return herb, scoops`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    return herb, int(scoops)`, r`def read_line(line):
    try:
        herb, scoops = line.split("=")
        herb = herb.strip().lower()
        scoops = int(scoops)
    except ValueError:
        return None
    if herb == "" or scoops <= 0:
        return None
    return herb, scoops`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        herb, scoops = read_line(line)
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, shelf - set(recipe.keys()), cracked`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = scoops
    return recipe, set(recipe.keys()) - shelf, cracked`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        if line.count("=") != 1:
            cracked += 1
            continue
        herb, scoops = line.split("=")
        herb = herb.strip().lower()
        try:
            scoops = int(scoops)
        except ValueError:
            cracked += 1
            continue
        if herb == "" or scoops <= 0:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked

def fetch_list(missing):
    if len(missing) == 0:
        return "nothing to fetch"
    return ", ".join(missing)`, r`def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked

def fetch_list(missing):
    return ", ".join(sorted(missing))`, r`card = ["Lavender = 3", "lemon balm=2", "  chamomile =  1 ", "rain water = a cup", "= 4", "", "mint = 2 = 3", "LAVENDER = 1", "feverfew = 0", "yarrow = 2"]
shelf = {"lavender", "chamomile", "mint", "sage", "rosemary"}

def read_line(line):
    herb, scoops = line.split("=")
    herb = herb.strip().lower()
    if herb == "":
        raise ValueError("This line has no herb on it.")
    scoops = int(scoops)
    if scoops <= 0:
        raise ValueError(f"{scoops} scoops of {herb} won't make a tonic.")
    return herb, scoops

def brew(card, shelf):
    recipe = {}
    cracked = 0
    for line in card:
        if line.strip() == "":
            continue
        try:
            herb, scoops = read_line(line)
        except ValueError:
            cracked += 1
            continue
        recipe[herb] = recipe.get(herb, 0) + scoops
    return recipe, set(recipe.keys()) - shelf, cracked

def fetch_list(missing):
    if len(missing) == 0:
        return "nothing to fetch"
    return ", ".join(sorted(missing))

recipe, missing, cracked = brew(card, shelf)
print("The tonic:", recipe)`],
      done: "Mirela: Lavender, lemon balm, chamomile and yarrow. Bram ran down for the lemon balm, Wren for the yarrow, and the flask is glowing like a little sun. Drink up, stone. There. Pip? Pip, look: you're shining.",
    },
  ],
};
