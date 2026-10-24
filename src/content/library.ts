import type { Building } from "./types.ts";

// The Scribe's Library: building 7, taught with dictionaries (SYLLABUS.md). Each
// challenge adds one stage of library.glb (art/specs/library.md, stage_01 …
// stage_14), so the building has exactly 14 challenges. Odo the librarian
// arrives when the chapter opens and speaks lines that start with "Odo: ".
// Stage 3 turns up Ysolde's sealed vault; the last challenge decodes her
// journal from it (the midpoint reveal).
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks.
//   again(("ring = [...]", "ring = [...]"))  -> (variables, printed lines) of a
//       rerun with other starting values, like the mill's helper.
//   call("meaning", "oro", {"oro": "moon"})  -> what the learner's function
//       gives back for fresh arguments. Anything it prints is kept out of the
//       console, and a crash becomes friendly feedback.
const PRE = r`import io as _io
import sys as _sys

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the variables, so it fits any starting values, not just today's.")

def call(name, *args):
    check(name in ns, "Write a function called " + name + ". The rune calls it by that name to try it out.")
    check(callable(ns[name]), name + " should be a function, made with def.")
    shown = ", ".join(repr(a) for a in args)
    buf = _io.StringIO()
    old = _sys.stdout
    _sys.stdout = buf
    try:
        return ns[name](*args)
    except Exception as e:
        _sys.stdout = old
        check(False, name + "(" + shown + ") crashes with " + type(e).__name__ + ": " + str(e) + ". Try your function on those values on paper.")
    finally:
        _sys.stdout = old

`;

export const LIBRARY: Building = {
  id: "library",
  name: "The Scribe's Library",
  blurb: "Shelves for every record, and something old sealed under the floor.",
  villager: { name: "Odo", model: "librarian", arrives: "start" },
  opening: [
    "A cart is creaking up the valley road. It's so stacked with crates of books that it leans, and somewhere behind the crates, someone is apologising to the horse.",
    "Odo: Hello! Is this the valley with the speaking stones? Ingrid said, well, she said a great deal about hammers, but also that someone here can read runes. I'm Odo. A scholar. Of forgotten alphabets, mostly.",
    "Odo: I've been writing a book about them for thirty-one years. It's very nearly... is that a pond? What a lovely pond.",
    "A scholar! With books! The King's charter wants a town that keeps proper records, and there's no better keeper of records than a library.",
    "Odo: A library needs a catalogue, and a catalogue is only a great many things, each filed under its name so you can find it again. Footnote: I lose things anyway. That's my contribution.",
    "In the Old Tongue that's called a **dictionary**: every value filed under a key. Ssso, a dictionary for a scholar. Let's build The Scribe's Library!",
  ],
  finale: [
    "Odo: That's the last page. Five pages, three hundred years under the yard, and every word of it written for whoever came next.",
    "Odo: So that's what the Long Quiet was. Not a curse. Not a storm. Only a few people ever spoke the Old Tongue, and they never taught anyone else. When they went away to the cities, there was nobody left who could.",
    "Odo: Thirty-one years I've written about forgotten alphabets, and I never once asked who forgot to teach them.",
    "Odo: Well. Not this one. You're learning it, Founder, and the stones answer you. Footnote: I'd very much like to learn it from you. I've brought a notebook. Several. I've lost one already.",
    "Odo: Pip? You've gone very quiet. You're never quiet.",
    "...",
    "Sorry. Just listening. It's a lot to hear all at once. It's a beautiful library, Odo. It really is.",
  ],
  chatDuring: [
    "Odo: Did you know 'dictionary' comes from an old word for 'saying'? A book of sayings. And now the Old Tongue has one too. I'm not crying. It's the ink. It gets everywhere.",
    "Odo: A dictionary key has to be unique, you know. Two shelves can't both be called 'west'. I tried. The second one won.",
    "Odo: Pip asked what's in my crates. Books, mostly. A teapot. And, I've just discovered, a sandwich from last spring. Purely archival.",
    "Odo: My book? Oh, it's, ah, coming along. Is that a new beam? Look at that beam. Lovely beam.",
  ],
  chatAfter: [
    "Odo: Come in, come in! Mind the rope round the vault. Footnote: the rope is mostly for me. I lean over it to look in, and I lean a great deal.",
    "Odo: I've copied Ysolde's journal out in plain letters and left it on the bench by the door, so anyone can read it. That seemed rather the point.",
    "Odo: Every book in here is filed under a key now. Except the ones I'm reading, which are filed under 'Odo, somewhere'.",
    "Odo: Some evenings I read aloud by the rune stone. Pip says it's for the stone's benefit. I think Pip just likes stories.",
  ],
  chronicle: {
    title: "A Language Lives While It Is Taught",
    text: [
      "There were never many of us who could speak to the stones. A dozen at the most, in the good years, and we were proud of being few. It made us feel like the keepers of something rare. It was rare. We made sure of it.",
      "Teaching was slow. A child would stumble over one line for a week, and it was so much quicker to say the line myself. So the speakers spoke, and everyone else asked us to, and being asked felt like being needed. I did not see that we were the only door into the Old Tongue, and that we were walking out of it.",
      "When the others left for the cities, the stones did not go dark at once. They dimmed the way a hearth does when nobody adds a log: slowly enough that you can tell yourself it is only the evening.",
      "I have sealed my journal in the ground where we always meant to build a library, and never did. It is written in the rune-letters of the little primer I made too late for the children, in case one day someone comes who can read them. If you are reading this, then somebody taught you. Whoever it was, thank them for me.",
    ],
  },
  challenges: [
    {
      id: "l01-odos-plan",
      part: "Survey stakes",
      title: "Odo's Plan",
      topic: "dictionaries",
      cost: { wood: 4, stone: 2 },
      intro: [
        "Odo: The plan! Found it. Under my hat. It says the hall is 7 metres wide and 6 deep, and the book turret is marked out from a centre peg with a 1.5 metre measuring string. I think. My handwriting has opinions.",
        "Numbers scattered on a scrap of paper get lost. A **dictionary** keeps them together, each one filed under a name called its **key**: `{\"oats\": 4, \"milk\": 2}` files 4 under \"oats\" and 2 under \"milk\".",
        "You read a value back with its key in square brackets, like a list but with names instead of positions. Ssso, let's stake out a library!",
      ],
      codex: ["dictionaries"],
      quiz: {
        code: r`inks = {"black": 3, "blue": 5}
print(inks["blue"])`,
        question: "What does this program show?",
        options: ["5", "blue", "3", "KeyError"],
        answer: 0,
        why: "inks[\"blue\"] looks up the key \"blue\" and gives back the value filed under it, 5.",
      },
      task: [
        "Make a dictionary `plan` that files Odo's three measurements under the keys `\"width\"`, `\"depth\"` and `\"turret\"` (the turret's measuring string, centre peg to edge).",
        "Odo needs one string that runs all the way round the hall, plus the turret's measuring string. Work out `to_cut`, the total length of string to cut, by looking the numbers up in `plan`.",
        "Print a line telling Odo how many metres of string to cut.",
        "If Odo changes a number in the plan, `to_cut` and your line should change with it.",
      ],
      starter: r`# Odo's scrap of paper (his handwriting has opinions):
#   the hall: 7 metres wide, 6 metres deep
#   the turret: 1.5 metres from the centre peg to the edge

# plan =

# to_cut =
`,
      tests: PRE + r`import re
check("plan" in ns, "Make a dictionary called plan to hold Odo's measurements.")
p = ns["plan"]
check(isinstance(p, dict), "plan should be a dictionary (curly brackets, each number filed under its key), but it is a " + type(p).__name__ + ".")
for k in ["width", "depth", "turret"]:
    check(k in p, "plan has no key " + repr(k) + ". Its keys are " + repr([x for x in p]) + ". A key has to be spelled exactly, small letters and all.")
check(len(p) == 3, "plan should hold just Odo's three measurements, but it has " + str(len(p)) + " keys.")
for k in p:
    check(type(p[k]) in (int, float), "plan[" + repr(k) + "] is " + repr(p[k]) + ". A measurement is a number, so it needs no quotes.")
check(p["width"] == 7 and p["depth"] == 6, "The hall is 7 metres wide and 6 metres deep. Check which number is filed under which key.")
check(p["turret"] == 1.5, "The turret's measuring string runs 1.5 metres from the centre peg to the edge.")
check("to_cut" in ns, "Work out to_cut: the total length of string Odo has to cut.")
s = ns["to_cut"]
check(type(s) in (int, float), "to_cut should be a number of metres, but it is " + repr(s) + ".")
check(s != 26, "26 metres goes round the hall, but Odo needs the turret's measuring string as well.")
check(s != 14.5, "All the way round the hall means all four sides: two long ones and two short ones.")
check(s == 27.5, "to_cut should be the string all the way round the hall plus the turret's string, but it is " + repr(s) + ". Work it out on paper first.")
v, n = re.subn(r"""(["']width["']\s*[:\]]\s*=?\s*)7(?![\d.])""", r"\g<1>9", src, count=1)
v, m = re.subn(r"""(["']turret["']\s*[:\]]\s*=?\s*)1\.5(?!\d)""", r"\g<1>2", v, count=1)
check(n == 1 and m == 1, "Write Odo's numbers into the plan dictionary itself (the width as 7, the turret as 1.5), so the rune can try a different plan.")
try:
    vns, vlines = rerun(v)
except Exception as e:
    check(False, "With a different plan your program crashes with " + type(e).__name__ + ": " + str(e) + ".")
check(vns.get("to_cut") == 32, "If the plan said 9 metres wide and a 2 metre turret string, to_cut should change to match. Look the numbers up in plan instead of typing them.")
check(any("27.5" in l for l in lines), "Print a line telling Odo how many metres of string to cut.")
check(any("32" in l for l in vlines), "When the plan changes, your printed line should change too. Put to_cut itself into the line with an f-string.")`,
      hints: [
        "A dictionary is a row of labelled jars: the label is the key, what's inside is the value. Work out on paper which number goes in which jar, and how long a loop of string round a 7 by 6 rectangle is.",
        "Make one with curly brackets and `key: value` pairs with commas between: `jars = {\"jam\": 3, \"honey\": 2}`. Read one back with its key in square brackets: `jars[\"jam\"] + jars[\"honey\"]` is 5.",
        "`plan = {\"width\": 7, ...}` with all three measurements, then `to_cut = 2 * (plan[\"width\"] + plan[\"depth\"]) + ...` with the turret's jar where the dots are. Print it with an f-string.",
      ],
      solution: r`plan = {"width": 7, "depth": 6, "turret": 1.5}
to_cut = 2 * (plan["width"] + plan["depth"]) + plan["turret"]
print(f"Cut {to_cut} metres of string, Odo.")`,
      wrong: [r`plan = [7, 6, 1.5]
to_cut = 2 * (plan[0] + plan[1]) + plan[2]
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"Width": 7, "Depth": 6, "Turret": 1.5}
to_cut = 2 * (plan["Width"] + plan["Depth"]) + plan["Turret"]
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"width": "7", "depth": "6", "turret": "1.5"}
to_cut = plan["width"] + plan["depth"] + plan["turret"]
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"width": 7, "depth": 6, "turret": 1.5}
to_cut = 27.5
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"width": 7, "depth": 6, "turret": 1.5}
to_cut = 2 * (plan["width"] + plan["depth"])
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"width": 7, "depth": 6, "turret": 1.5}
to_cut = plan["width"] + plan["depth"] + plan["turret"]
print(f"Cut {to_cut} metres of string, Odo.")`, r`plan = {"width": 7, "depth": 6, "turret": 1.5}
to_cut = 2 * (plan["width"] + plan["depth"]) + plan["turret"]
print("Cut 27.5 metres of string, Odo.")`],
      done: "Odo: Twenty-seven and a half metres! I'd have guessed twenty and run out at the turret. Again. Footnote: 'again' is doing a great deal of work in that sentence.",
    },
    {
      id: "l02-stone-tally",
      part: "Stone plinth and floor",
      title: "The Stone Tally",
      topic: "adding and changing entries",
      cost: { wood: 0, stone: 9 },
      intro: [
        "Odo: Stone, stone, everywhere stone, and I'm meant to keep count. I've started a tally. In a dictionary! The same name as my favourite kind of book. I may never recover.",
        "A dictionary can change. Store a value under a key it already has, and the old value is thrown away. Store one under a key it hasn't seen, and a brand-new entry appears.",
        "And `+=` works on an entry too, as long as the entry is there to add to.",
      ],
      codex: ["dict-changes", "dictionaries"],
      quiz: {
        code: r`jars = {"honey": 2}
jars["honey"] = 5
jars["jam"] = 1
print(jars)`,
        question: "What does this program show?",
        options: ["{'honey': 5, 'jam': 1}", "{'honey': 2, 'jam': 1}", "{'honey': 7, 'jam': 1}", "KeyError"],
        answer: 0,
        why: "Storing under \"honey\" again replaces the 2 with 5, and storing under the new key \"jam\" adds an entry. Nothing is added up.",
      },
      task: [
        "Marlo's barge brings 12 more plinth stones.",
        "The first flagstones for the floor arrive: 18 of them. The tally has no line for flagstones yet, so give it one under the key `\"flagstones\"`.",
        "Odo recounts the mortar: there are 5 buckets, whatever the tally said before.",
        "Change `yard` itself (no brand-new dictionary), then print the whole tally so Odo can see it.",
      ],
      starter: r`yard = {"plinth stones": 30, "mortar": 3}   # Odo's tally this morning

# 1. Marlo's barge
# 2. The flagstones
# 3. Odo's recount
`,
      tests: PRE + r`check(isinstance(ns.get("yard"), dict), "Keep yard as Odo's tally dictionary.")
y = ns["yard"]
check("plinth stones" in y, "The tally has lost its \"plinth stones\" entry.")
check(y["plinth stones"] != 12, "The plinth stones went down to 12: that threw away the 30 already in the yard. The barge brings 12 more.")
check(y["plinth stones"] == 42, "There were 30 plinth stones and the barge brought 12 more, but the tally says " + repr(y["plinth stones"]) + ".")
check("flagstones" in y, "The tally has no \"flagstones\" entry yet. Give yard a new key, and its value.")
check(y["flagstones"] == 18, "18 flagstones arrived, but the tally says " + repr(y["flagstones"]) + ".")
check(y.get("mortar") != 8, "You added 5 buckets to the 3, but Odo's recount means there are 5 buckets altogether.")
check(y.get("mortar") == 5, "After Odo's recount the tally should say 5 buckets of mortar, but it says " + repr(y.get("mortar")) + ".")
check(len(y) == 3, "The tally should have three entries, but it has " + str(len(y)) + ": " + repr(y))
check("42" in out and "18" in out, "Print the whole tally for Odo at the end, once every change is made.")
vns, vl = again(('"plinth stones": 30', '"plinth stones": 25'), ('"mortar": 3', '"mortar": 9'))
vy = vns.get("yard", {})
check(vy.get("plinth stones") == 37, "If the yard had started with 25 plinth stones, the barge would bring it to 37. Add the 12 to what's already there instead of typing the total.")
check(vy.get("mortar") == 5, "Whatever the tally said before, after the recount there are exactly 5 buckets of mortar.")`,
      hints: [
        "Three different kinds of change: one adds to what's there, one makes a line that didn't exist, and one throws the old number away. Which is which?",
        "On other jars: `pantry[\"eggs\"] += 6` adds six to the eggs already there, and `pantry[\"flour\"] = 2` makes a new entry if there was none, or replaces the old value if there was.",
        "The barge is `yard[\"plinth stones\"] += ...`. The flagstones are a store under a key the tally has never seen, and the recount is a store that throws the old number away. Finish by printing `yard` itself.",
      ],
      solution: r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] += 12
yard["flagstones"] = 18
yard["mortar"] = 5
print(yard)`,
      wrong: [r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] = 12
yard["flagstones"] = 18
yard["mortar"] = 5
print(yard)`, r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] += 12
yard["flagstones"] += 18
yard["mortar"] = 5
print(yard)`, r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] += 12
yard["flagstones"] = 18
yard["mortar"] += 5
print(yard)`, r`yard = {"plinth stones": 30, "mortar": 3}
yard = {"plinth stones": 42, "mortar": 5, "flagstones": 18}
print(yard)`, r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] + 12
yard["flagstones"] = 18
yard["mortar"] = 5
print(yard)`, r`yard = {"plinth stones": 30, "mortar": 3}
print(yard)
yard["plinth stones"] += 12
yard["flagstones"] = 18
yard["mortar"] = 5`, r`yard = {"plinth stones": 30, "mortar": 3}
yard["plinth stones"] += 12
yard["flagstones"] = 18
yard["mortar"] = 5
yard["flagstones"] = 18
yard["Mortar"] = 5
print(yard)`],
      done: "Odo: A floor at last! Flat as a fresh page. I tested it by lying down on it. For science. And a little bit for my back.",
    },
    {
      id: "l03-runes-in-the-dig",
      part: "Ysolde's vault",
      title: "Runes in the Dig",
      topic: "in and KeyError",
      cost: { wood: 2, stone: 4 },
      intro: [
        "Odo: Clang! The shovel hit something. Not a rock. Rocks don't have... carvings. Pip! Come and look!",
        "A round stone hatch, sealed tight, with a ring of runes that glow when you speak near it. And in the middle, a coiled serpent. Ssso. That's... a very old seal. Hmm-hmm-hmm. Let's dig round it. Carefully.",
        "Odo: I know some of these runes! Thirty-one years of forgotten alphabets, and here they are in the dirt. My lexicon will tell us what they mean. Except the ones it won't.",
        "Look up a key a dictionary doesn't have, and Python stops with a **KeyError**. So ask first: `key in d` is True when `key` is one of the dictionary's **keys**. It never looks at the values.",
      ],
      codex: ["dict-safe", "dictionaries"],
      quiz: {
        code: r`moons = {"harvest": "orange", "frost": "white"}
print("orange" in moons, "frost" in moons)`,
        question: "What does this program show?",
        options: ["False True", "True True", "True False", "KeyError"],
        answer: 0,
        why: "in only looks at the keys. \"orange\" is a value, so it is not in moons; \"frost\" is a key, so it is.",
      },
      task: [
        "Odo's `lexicon` goes one way only: from a rune to what it means.",
        "Write a function `meaning(rune, lexicon)` that gives back what `rune` means in the lexicon it is given. For a rune the lexicon has no entry for, it gives back `\"?\"` instead of crashing.",
        "Then go round the `ring` on the hatch, in order, and print one line per rune showing the rune and what it means.",
      ],
      starter: r`# Odo's lexicon: a rune, and what it means
lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}

# The runes carved round the hatch, starting at the top
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

# def meaning(rune, lexicon):

# Then the ring, one line per rune
`,
      tests: PRE + r`r = call("meaning", "oro", {"fen": "owl", "oro": "moon"})
check(r is not None, "meaning gave back None. Did it print the meaning instead of handing it back with return?")
check(r == "moon", "meaning('oro', {'fen': 'owl', 'oro': 'moon'}) gave back " + repr(r) + ". Look the rune up in the lexicon the function was given.")
r = call("meaning", "pell", {"fen": "owl", "oro": "moon"})
check(r == "?", "meaning('pell', {'fen': 'owl', 'oro': 'moon'}) gave back " + repr(r) + ". When the lexicon has no entry for a rune, the answer is \"?\".")
r = call("meaning", "owl", {"fen": "owl", "oro": "moon"})
check(r == "?", "meaning('owl', {'fen': 'owl', 'oro': 'moon'}) gave back " + repr(r) + ". 'owl' is a meaning in that lexicon, not a rune, so the answer is \"?\".")
r = call("meaning", "ka", {})
check(r == "?", "An empty lexicon knows no runes at all, so meaning('ka', {}) should give back \"?\", not " + repr(r) + ".")
lex = ns.get("lexicon", {})
ring = ns.get("ring", [])
check(len(lines) == len(ring), "Print one line for each of the " + str(len(ring)) + " runes on the ring. You printed " + str(len(lines)) + ".")
for rune, line in zip(ring, lines):
    m = lex[rune] if rune in lex else "?"
    check(rune in line and m in line, "The line for the rune " + rune + " should show the rune and what it means (or the ?), but it says: " + line)
vns, vl = again(('ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]', 'ring = ["ven", "pell", "ka"]'))
check(len(vl) == 3 and "home" in vl[0] and "?" in vl[1] and "water" in vl[2], "If the ring held other runes, your lines should change to match. Go round ring with a loop and ask meaning about each rune.")`,
      hints: [
        "There are two cases: the rune is one of the lexicon's keys, or it isn't. Ask that question before you look anything up, not after.",
        "`if \"jam\" in pantry:` is True only when \"jam\" is a key. Inside that `if`, `pantry[\"jam\"]` is safe. A `return` in each case hands the answer back.",
        "Inside `def meaning(rune, lexicon):`, one `if` asks whether the rune is a key and returns its meaning; after the `if`, a second `return` hands back `\"?\"`. Then a `for` loop over `ring` prints each rune beside `meaning(rune, lexicon)`.",
      ],
      solution: r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    if rune in lexicon:
        return lexicon[rune]
    return "?"

for rune in ring:
    print(rune, "means", meaning(rune, lexicon))`,
      wrong: [r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    return lexicon[rune]

for rune in ring:
    print(rune, "means", meaning(rune, lexicon))`, r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    for key in lexicon:
        if key == rune:
            return lexicon[key]
        else:
            return "?"

for rune in ring:
    print(rune, "means", meaning(rune, lexicon))`, r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    if rune in lexicon:
        print(lexicon[rune])
    else:
        print("?")

for rune in ring:
    meaning(rune, lexicon)`, r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, words):
    if rune in lexicon:
        return lexicon[rune]
    return "?"

for rune in ring:
    print(rune, "means", meaning(rune, lexicon))`, r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    if rune in lexicon:
        return lexicon[rune]
    return "?"

for rune in ring:
    print(meaning(rune, lexicon))`, r`lexicon = {"ka": "water", "tor": "stone", "ys": "light", "ven": "home", "ul": "speak", "sen": "serpent"}
ring = ["ys", "tor", "mir", "ul", "ka", "sen", "dra", "ven"]

def meaning(rune, lexicon):
    if rune in lexicon:
        return lexicon[rune]
    return "?"

print("ys means light")
print("tor means stone")
print("mir means ?")
print("ul means speak")
print("ka means water")
print("sen means serpent")
print("dra means ?")
print("ven means home")`],
      done: "Odo: Light... stone... speak... water... serpent... home. Who seals a door with words like those? Pip, you've gone very still. Pip? Ah, humming. Good. Humming is good.",
    },
    {
      id: "l04-walls-not-yet-begun",
      part: "Ground-floor walls",
      title: "Walls Not Yet Begun",
      topic: ".get with a default",
      cost: { wood: 1, stone: 9 },
      intro: [
        "Odo keeps a dictionary of how high each wall has risen. A wall nobody has started isn't in it at all.",
        "Odo: I tried to look up the south wall and the rune stone said KeyError. Rather rude, I thought. Accurate. But rude.",
        "`d.get(key, default)` looks a key up without the fuss: you get its value if it's there, and the default if it isn't. No KeyError, and no `if` needed.",
      ],
      codex: ["dict-safe", "dict-changes"],
      quiz: {
        code: r`seeds = {"poppy": 4}
print(seeds.get("tulip", 0) + seeds.get("poppy", 0))`,
        question: "What does this program show?",
        options: ["4", "KeyError", "None", "0"],
        answer: 0,
        why: "There is no tulip, so .get gives back the default, 0. The poppy is there, so .get gives back its 4. 0 + 4 is 4.",
      },
      task: [
        "Write `height(walls, side)`: how high that side's wall stands. A side that isn't in `walls` hasn't been started, so it stands at 0.",
        "Write `add_course(walls, side)`: one course of stone raises that side by half a metre. It changes `walls` itself, and it works for a side that hasn't been started too.",
        "`todays_courses` has one entry for every course laid today. Lay them all, then print how high each of the four walls stands, in the order north, east, south, west.",
      ],
      starter: r`walls = {"north": 1.0, "east": 0.5}   # metres of wall so far
todays_courses = ["north", "west", "east", "north", "west"]   # one course each

# def height(walls, side):

# def add_course(walls, side):

# Lay today's courses, then print the four walls' heights
`,
      tests: PRE + r`r = call("height", {"moss": 2.5}, "moss")
check(r == 2.5, "height({'moss': 2.5}, 'moss') gave back " + repr(r) + ". Look the side up in the walls the function was given.")
r = call("height", {"moss": 2.5}, "fern")
check(r is not None, "height({'moss': 2.5}, 'fern') gave back None. A side that isn't in walls hasn't been started, so it stands at 0. Give .get something to fall back on.")
check(r == 0, "A side that isn't in walls hasn't been started, so its height is 0, but height gave back " + repr(r) + ".")
w = {"moss": 1.0}
call("add_course", w, "moss")
check(w.get("moss") != 1.0, "After add_course({'moss': 1.0}, 'moss') the moss wall is still 1.0. The new height has to be stored back in walls, under the side's key.")
check(w == {"moss": 1.5}, "add_course({'moss': 1.0}, 'moss') should raise the moss wall by half a metre, but walls is now " + repr(w) + ".")
w = {"moss": 1.0}
call("add_course", w, "fern")
check("fern" in w, "add_course({'moss': 1.0}, 'fern') should start a fern wall, but walls is still " + repr(w) + ".")
check(w == {"moss": 1.0, "fern": 0.5}, "After add_course({'moss': 1.0}, 'fern'), walls is " + repr(w) + ". A wall that wasn't started rises from 0 by half a metre, and the moss wall shouldn't change.")
w = {}
call("add_course", w, "reed")
call("add_course", w, "reed")
check(w == {"reed": 1.0}, "Two courses on a brand-new side should make it a metre high, but walls is " + repr(w) + ".")
check(".get(" in src, "Use .get with a default for walls that haven't been started: that's the trick this wall is here to teach.")
sides = ["north", "east", "south", "west"]
def wall_lines(ls, want, when):
    check(len(ls) == 4, when + "print one line for each of the four walls, north, east, south and west, even one nobody has started. You printed " + str(len(ls)) + " lines.")
    for side, h, line in zip(sides, want, ls):
        check(side in line and str(h) in line, when + "the " + side + " line should say how high that wall stands, but it says: " + line)
wall_lines(lines, [2.0, 1.0, 0, 1.0], "After today's courses, ")
vns, vl = again(('todays_courses = ["north", "west", "east", "north", "west"]', 'todays_courses = ["south", "south"]'))
wall_lines(vl, [1.0, 0.5, 1.0, 0], "If only two courses went on the south wall, ")`,
      hints: [
        "Both jobs start with the same question: how high is this side right now? Answer it once, safely, in `height`, and `add_course` can lean on it.",
        "`stock.get(\"pears\", 0)` gives the pears if there are any, and 0 if there's no entry. To raise an entry, store the old amount plus the new bit back under the same key.",
        "`height` is a single `return walls.get(side, ...)`. `add_course` works out the new height from `height(walls, side)` and stores it back under `walls[side]`. Then one loop lays `todays_courses`, and a second walks a list of the four side names in order to print.",
      ],
      solution: r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side, 0)

def add_course(walls, side):
    walls[side] = height(walls, side) + 0.5

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`,
      wrong: [r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls[side]

def add_course(walls, side):
    walls[side] = walls.get(side, 0) + 0.5

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`, r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side)

def add_course(walls, side):
    walls[side] = walls.get(side, 0) + 0.5

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`, r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side, 0)

def add_course(walls, side):
    walls[side] += 0.5

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`, r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side, 0)

def add_course(walls, side):
    new = height(walls, side) + 0.5
    return new

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`, r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side, 0)

def add_course(walls, side):
    walls[side] = height(walls, side) + 0.5

for side in todays_courses:
    add_course(walls, side)
for side in walls:
    print(f"{side}: {height(walls, side)} m")`, r`walls = {"north": 1.0, "east": 0.5}
todays_courses = ["north", "west", "east", "north", "west"]

def height(walls, side):
    return walls.get(side, 0)

def add_course(walls, side):
    walls[side] = height(walls, side) + 1

for side in todays_courses:
    add_course(walls, side)
for side in ["north", "east", "south", "west"]:
    print(f"{side}: {height(walls, side)} m")`],
      done: "Odo: Two metres on the north side, and gaps for the windows! I measured the gaps with my arms. I have long arms. It's all the reaching for top shelves.",
    },
    {
      id: "l05-every-arch-by-name",
      part: "Arches and quoins",
      title: "Every Arch by Name",
      topic: "looping over a dictionary",
      cost: { wood: 0, stone: 10 },
      intro: [
        "Odo: Arches! Every window and door gets one, built of wedge-shaped stones. The stonecutters want to be told each arch, and how many wedges to cut for it.",
        "A `for` loop over a dictionary visits its **keys**, in the order they were added. `for key, value in d.items():` hands you each key **and** its value together.",
        "Odo: Footnote: an arch with an odd number of wedges has one stone right in the middle at the top. The keystone. It holds all the others up. I find that terribly moving.",
      ],
      codex: ["dict-loops"],
      quiz: {
        code: r`pets = {"cat": 2, "owl": 1}
for p in pets:
    print(p)`,
        question: "What does this program show?",
        options: ["cat\nowl", "2\n1", "cat 2\nowl 1", "TypeError"],
        answer: 0,
        why: "A for loop over a dictionary gives you its keys, one per round, in the order they were added. To get the values as well, loop over pets.items().",
      },
      task: [
        "`arches` maps each arch to the number of wedge stones it needs.",
        "Print one line per arch, in the dictionary's order, telling the stonecutters the arch and how many wedges to cut for it.",
        "Write `keystone_arches(arches)`: it gives back a list of the names of the arches that have a keystone, in the dictionary's order.",
        "Print that list last.",
      ],
      starter: r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

# 1. One line per arch, for the stonecutters

# 2. def keystone_arches(arches):

# 3. Print the arches that have a keystone
`,
      tests: PRE + r`r = call("keystone_arches", {"gate": 7, "loft": 6, "well": 3})
check(isinstance(r, list), "keystone_arches should give back a list of names, but it gave back " + repr(r) + ".")
check(r != ["gate"], "keystone_arches({'gate': 7, 'loft': 6, 'well': 3}) gave back only ['gate']. Did it return inside the loop, before it had looked at every arch?")
check(r != ["loft"], "keystone_arches({'gate': 7, 'loft': 6, 'well': 3}) gave back ['loft'], the even one. A keystone sits in the middle of an odd number of wedges.")
check(r == ["gate", "well"], "keystone_arches({'gate': 7, 'loft': 6, 'well': 3}) gave back " + repr(r) + ". It should hold the names of the arches with an odd number of wedges, in the dictionary's order.")
r = call("keystone_arches", {})
check(r == [], "With no arches at all, keystone_arches should give back an empty list, not " + repr(r) + ".")
r = call("keystone_arches", {"vent": 2, "hatch": 4})
check(r == [], "Arches with an even number of wedges have no keystone, so keystone_arches({'vent': 2, 'hatch': 4}) should give back an empty list, not " + repr(r) + ".")
def arch_lines(ls, arches, when):
    check(len(ls) == len(arches) + 1, when + "print one line per arch (" + str(len(arches)) + " of them), then the list of keystone arches: " + str(len(arches) + 1) + " lines. You printed " + str(len(ls)) + ".")
    for name, line in zip(arches, ls):
        check(name in line and str(arches[name]) in line, when + "the line for the " + name + " should give its name and how many wedges to cut, but it says: " + line)
    last = ls[-1]
    for name in arches:
        if arches[name] % 2 == 1:
            check(name in last, when + "the last line should show the arches with a keystone, but the " + name + " is missing: " + last)
        else:
            check(name not in last, when + "the last line should show only the arches with a keystone, but it has the " + name + ": " + last)
arch_lines(lines, {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}, "For Odo's arches, ")
vns, vl = again(('arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}', 'arches = {"gate": 7, "loft": 6}'))
arch_lines(vl, {"gate": 7, "loft": 6}, "If the arches were a gate of 7 and a loft of 6, ")`,
      hints: [
        "Two jobs: a loop that *says* something about every arch, and a function that *collects* some of them. Which numbers have a middle stone? Try 15, 11 and 4 on paper with `%`.",
        "`for crop, rows in field.items():` gives each name and its number together, one pair per round. To collect, start with an empty list and `append` the names that pass a test, like at the bakery.",
        "`for name, wedges in arches.items():` and print both. In the function: `found = []`, loop over `.items()` again, `if wedges % 2 == 1:` then `found.append(...)`, and `return found` after the loop.",
      ],
      solution: r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches.items():
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(arches):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 1:
            found.append(name)
    return found

print(keystone_arches(arches))`,
      wrong: [r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches.items():
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(arches):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 1:
            found.append(name)
            return found
    return found

print(keystone_arches(arches))`, r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches.items():
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(arches):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 0:
            found.append(name)
    return found

print(keystone_arches(arches))`, r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name in arches:
    print(name)

def keystone_arches(arches):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 1:
            found.append(name)
    return found

print(keystone_arches(arches))`, r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches:
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(arches):
    found = []
    for name, wedges in arches:
        if wedges % 2 == 1:
            found.append(name)
    return found

print(keystone_arches(arches))`, r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches.items():
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(stones):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 1:
            found.append(name)
    return found

print(keystone_arches(arches))`, r`arches = {"front door": 15, "west window": 11, "east window": 11, "turret window": 9, "cellar vent": 4}

for name, wedges in arches.items():
    print(f"{name}: cut {wedges} wedges")

def keystone_arches(arches):
    found = []
    for name, wedges in arches.items():
        if wedges % 2 == 1:
            found.append(name)
    return found

print(["front door", "west window", "east window", "turret window"])`],
      done: "Odo: Four keystones and one humble cellar vent. And the quoins at the corners, like the edging on a good page. I've decided arches are the footnotes of doors. Don't ask me to explain that.",
    },
    {
      id: "l06-books-in-the-tower",
      part: "Book turret",
      title: "Books in the Tower",
      topic: ".values() with sum and max",
      cost: { wood: 1, stone: 10 },
      intro: [
        "The book turret rises: a round stone tower just for books! Odo wants to know whether his collection will fit.",
        "Odo: How many books do I own? Er. Some. A great many some. They're sorted by subject, at least. Roughly. In spirit.",
        "`d.values()` gives just the values, and `sum`, `max` and `min` work on it like on a list. Careful, though: `max(d)` all by itself looks at the **keys**!",
      ],
      codex: ["dict-loops", "min-max"],
      quiz: {
        code: r`coins = {"Mon": 3, "Tue": 7, "Wed": 2}
print(max(coins))`,
        question: "What does this program show?",
        options: ["Wed", "7", "Tue", "TypeError"],
        answer: 0,
        why: "max on a dictionary compares its keys, and for text that means A to Z: \"Wed\" comes last. max(coins.values()) would give 7.",
      },
      task: [
        "`collection` maps each subject to how many of Odo's books are about it.",
        "Write `count_books(collection)`: the total number of books.",
        "Write `biggest_subject(collection)`: the subject with the most books. When two subjects tie, the one that comes first in the dictionary wins. An empty collection has no biggest subject, so it gives back `None`.",
        "Each turret shelf holds 40 books, and a part-full shelf still needs a whole shelf. Work out `shelves`, how many the turret needs, then print how many books Odo has, his biggest subject, and the shelves.",
      ],
      starter: r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

# def count_books(collection):

# def biggest_subject(collection):

# shelves =
`,
      tests: PRE + r`r = call("count_books", {"owls": 5, "moss": 12})
check(r != 2, "count_books({'owls': 5, 'moss': 12}) gave back 2: that's how many subjects there are, not how many books.")
check(r == 17, "count_books({'owls': 5, 'moss': 12}) gave back " + repr(r) + ". It should add up the books in every subject.")
r = call("count_books", {})
check(r == 0, "An empty collection has 0 books, but count_books({}) gave back " + repr(r) + ".")
r = call("biggest_subject", {"elm": 2, "ash": 9})
check(r != "elm", "biggest_subject({'elm': 2, 'ash': 9}) gave back 'elm'. max on a dictionary compares the keys (the names, A to Z), not how many books each subject has.")
check(r != 9, "biggest_subject gave back the number of books. Odo wants the subject's name.")
check(r == "ash", "biggest_subject({'elm': 2, 'ash': 9}) gave back " + repr(r) + ". It should give back the subject with the most books.")
r = call("biggest_subject", {"a": 3, "b": 5, "c": 5})
check(r == "b", "biggest_subject({'a': 3, 'b': 5, 'c': 5}) gave back " + repr(r) + ". When two subjects tie, the first one in the dictionary wins.")
r = call("biggest_subject", {"tea": 4})
check(r == "tea", "With only one subject, that subject is the biggest, but biggest_subject({'tea': 4}) gave back " + repr(r) + ".")
r = call("biggest_subject", {})
check(r is None, "An empty collection has no biggest subject, so biggest_subject({}) should give back None, not " + repr(r) + ".")
check("shelves" in ns, "Work out shelves: how many turret shelves Odo's books need.")
check(ns["shelves"] != 10, "10 shelves hold 400 books, and Odo has more than that. A part-full shelf still needs a whole shelf.")
check(ns["shelves"] == 11, "shelves should be how many 40-book shelves the whole collection needs, but it is " + repr(ns["shelves"]) + ".")
check("421" in out and "alphabets" in out and "11" in out, "Print how many books Odo has, his biggest subject, and how many shelves the turret needs.")
vns, vl = again(('collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}', 'collection = {"ink": 150, "owls": 250}'))
check(vns.get("shelves") == 10, "With exactly 400 books, Odo needs exactly 10 shelves, with no part-full one. Work shelves out from the number of books.")
vout = " ".join(vl)
check("400" in vout and "owls" in vout, "With another collection, your printed lines should change too. Print what your functions give back.")`,
      hints: [
        "The total only needs the numbers. Finding *which subject* is biggest needs the names too, so you'll walk through the dictionary keeping track of the best so far. For the shelves: what's left over after filling whole shelves of 40?",
        "`sum(prices.values())` adds up every value. To find the best by hand, start with `best = None` and a count of 0, and in a loop over `.items()` replace both whenever you meet a bigger count. `%` tells you whether anything is left over.",
        "count_books is one `return` with `sum` of the values. biggest_subject starts with `best = None` and `most = 0`, and in a loop over `.items()` changes both only when a subject has more books than `most` (more, not as many: ties keep the first). Shelves: whole shelves are `total // 40`, and one more when `%` says some are left over.",
      ],
      solution: r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books > most:
            best = subject
            most = books
    return best

total = count_books(collection)
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`,
      wrong: [r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return len(collection)

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books > most:
            best = subject
            most = books
    return best

total = sum(collection.values())
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    if collection:
        return max(collection)

total = count_books(collection)
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books >= most:
            best = subject
            most = books
    return best

total = count_books(collection)
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    most = max(collection.values())
    for subject, books in collection.items():
        if books == most:
            return subject

total = count_books(collection)
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books > most:
            best = subject
            most = books
    return best

total = count_books(collection)
shelves = total // 40
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books > most:
            best = subject
            most = books
    return best

total = count_books(collection)
shelves = total // 40 + 1
print(f"Odo has {total} books.")
print(f"His biggest subject is {biggest_subject(collection)}.")
print(f"The turret needs {shelves} shelves.")`, r`collection = {"alphabets": 212, "rivers": 37, "tea": 9, "bells": 58, "serpents": 64, "maps": 41}

def count_books(collection):
    return sum(collection.values())

def biggest_subject(collection):
    best = None
    most = 0
    for subject, books in collection.items():
        if books > most:
            best = subject
            most = books
    return most

total = count_books(collection)
shelves = total // 40
if total % 40 > 0:
    shelves += 1
print(f"Odo has {total} books.")
print("His biggest subject is alphabets.")
print(f"The turret needs {shelves} shelves.")`],
      done: "Odo: Four hundred and twenty-one books, eleven shelves, and a third window to read them by. Footnote: I've just remembered the box under my bed. Let's say eleven and a half.",
    },
    {
      id: "l07-which-rune-is-most-common",
      part: "Timber frame",
      title: "Which Rune Is Most Common?",
      topic: "counting with a dictionary",
      cost: { wood: 10, stone: 0 },
      intro: [
        "While the oak frame of the upper floor goes up, Odo sits on a beam copying the runes from the vault's ring into his notebook. Each rune is written with two or three little marks, glyphs, and he copies them one glyph at a time.",
        "Odo: Here's a scholar's trick. In every alphabet some signs turn up far more often than others. Count how often each one appears, and you've a clue to what it stands for!",
        "Counting with a dictionary: each thing you meet becomes a key, and its value is how many times you've met it. The first time you meet something, it isn't a key yet, so its count starts from 0.",
      ],
      codex: ["counting", "dict-safe"],
      quiz: {
        code: r`votes = {}
for v in ["oak", "elm"]:
    votes[v] += 1
print(votes)`,
        question: "What does this program show?",
        options: ["KeyError", "{'oak': 1, 'elm': 1}", "{}", "{'oak': 0, 'elm': 0}"],
        answer: 0,
        why: "votes starts empty, so votes[\"oak\"] isn't there to add 1 to. += needs a value to start from: check with in first, or use .get with a default of 0.",
      },
      task: [
        "Write `tally(marks)`: it goes through `marks` (a list, or a string of letters) and gives back a dictionary of how many times each one appears.",
        "Each call starts a fresh count: tallying twice must not add the two counts together.",
        "Tally the glyphs Odo `copied`, then print each glyph with its count, in the order they first appear, and finally a line saying how many different glyphs there are.",
      ],
      starter: r`copied = "ystormirulkasendraven"   # the hatch's ring, glyph by glyph

# def tally(marks):

# One line per glyph, then how many different glyphs
`,
      tests: PRE + r`r = call("tally", ["ka", "tor", "ka"])
check(isinstance(r, dict), "tally should give back a dictionary, but it gave back " + repr(r) + ".")
check(not [k for k in r if k not in ["ka", "tor"]], "tally(['ka', 'tor', 'ka']) gave back counts for things that aren't in that list: " + repr(r) + ". Each call should start a fresh count, so make the empty dictionary inside the function.")
check(r != {"ka": 1, "tor": 1}, "tally(['ka', 'tor', 'ka']) says 'ka' appears once, but it's there twice. Each time you meet something again, add one to its count.")
check(r == {"ka": 2, "tor": 1}, "tally(['ka', 'tor', 'ka']) gave back " + repr(r) + ". Each thing should be a key, and its value how many times it appears.")
r = call("tally", [])
check(r == {}, "Tallying nothing should give back an empty dictionary, not " + repr(r) + ".")
r = call("tally", "noon")
check(r == {"n": 2, "o": 2}, "tally('noon') gave back " + repr(r) + ". It should work on a string of letters too: a for loop goes through a string one letter at a time.")
call("tally", "ab")
r = call("tally", "ab")
check(r == {"a": 1, "b": 1}, "Calling tally('ab') a second time gave back " + repr(r) + ". Each call should start a fresh count, so make the empty dictionary inside the function.")
def glyph_lines(ls, text, when):
    t = {}
    for g in text:
        t[g] = t.get(g, 0) + 1
    check(len(ls) == len(t) + 1, when + "print one line for each different glyph (" + str(len(t)) + " of them), then one line saying how many different glyphs there are. You printed " + str(len(ls)) + " lines.")
    for g, line in zip(t, ls):
        check(g in line and str(t[g]) in line, when + "the line for the glyph " + g + " should show it and how many times it appears, in the order the glyphs first turn up, but it says: " + line)
    check(str(len(t)) in ls[-1], when + "the last line should say how many different glyphs there are, but it says: " + ls[-1])
glyph_lines(lines, "ystormirulkasendraven", "For Odo's copy, ")
vns, vl = again(('copied = "ystormirulkasendraven"', 'copied = "noon"'))
glyph_lines(vl, "noon", "If Odo had copied noon, ")`,
      hints: [
        "Picture a page of tally marks: each new glyph gets its own row, and every time you meet a glyph again, its row gets one more mark. What's different about the very first time?",
        "`if bird in seen:` add one to its value; `else:` give it a value of 1. Or in one line, with a default of 0: `seen[bird] = seen.get(bird, 0) + 1`.",
        "Inside the function: `counts = {}`, then `for mark in marks:` and add one to `counts[mark]` (starting from 0 when it's new), and `return counts` after the loop. The number of different glyphs is the `len` of the tally.",
      ],
      solution: r`copied = "ystormirulkasendraven"

def tally(marks):
    counts = {}
    for mark in marks:
        counts[mark] = counts.get(mark, 0) + 1
    return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(glyphs)} different glyphs")`,
      wrong: [r`copied = "ystormirulkasendraven"
counts = {}

def tally(marks):
    for mark in marks:
        counts[mark] = counts.get(mark, 0) + 1
    return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(glyphs)} different glyphs")`, r`copied = "ystormirulkasendraven"

def tally(marks):
    counts = {}
    for mark in marks:
        counts[mark] += 1
    return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(glyphs)} different glyphs")`, r`copied = "ystormirulkasendraven"

def tally(marks):
    counts = {}
    for mark in marks:
        counts[mark] = 1
    return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(glyphs)} different glyphs")`, r`copied = "ystormirulkasendraven"

def tally(marks):
    counts = {}
    for mark in marks:
        counts[mark] = counts.get(mark, 0) + 1
        return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(glyphs)} different glyphs")`, r`copied = "ystormirulkasendraven"

def tally(marks):
    counts = {}
    for mark in marks:
        counts[mark] = counts.get(mark, 0) + 1
    return counts

glyphs = tally(copied)
for glyph, n in glyphs.items():
    print(f"{glyph}: {n}")
print(f"{len(copied)} different glyphs")`],
      done: "Odo: 'r' three times! In nearly every old script I know, the commonest sign is a sound you can't do without. We may read that hatch yet. Footnote: I'm so excited I've put ink in my tea. Again.",
    },
    {
      id: "l08-books-come-home",
      part: "Plaster and gables",
      title: "Books Come Home",
      topic: "removing entries",
      cost: { wood: 5, stone: 3 },
      intro: [
        "While the plaster dries, villagers keep turning up at the door with Odo's books under their arms. He lends them out faster than he can remember who has what.",
        "Odo: My lending list! When a book comes back, it comes off the list, or the list will say Bram has my *Grammar of Owls* until the end of time.",
        "`del d[key]` removes an entry. `d.pop(key)` removes it **and** hands you its value. Both stop with KeyError when the key isn't there, unless you give `pop` a default to hand back instead. And `len(d)` says how many entries are left.",
      ],
      codex: ["dict-changes", "dict-safe"],
      quiz: {
        code: r`hats = {"red": 2, "blue": 5}
left = hats.pop("red")
print(left, len(hats))`,
        question: "What does this program show?",
        options: ["2 1", "red 1", "2 2", "KeyError"],
        answer: 0,
        why: "pop takes \"red\" out of the dictionary and hands back its value, 2. Only \"blue\" is left, so len(hats) is 1.",
      },
      task: [
        "`loans` maps each book that's out to the person who borrowed it.",
        "Write `return_book(loans, title)`: it takes the book off `loans` and gives back who had it. If that book isn't on loan, nothing changes and it gives back `None`.",
        "Take back each book in `returned`, in order, printing a line for each that says who brought it back (or, if nobody had it, says so in words).",
        "Finish with a line saying how many books are still out.",
      ],
      starter: r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

# def return_book(loans, title):

# Take back today's books, then say how many are still out
`,
      tests: PRE + r`d = {"Fen": "Pip", "Oak": "Tock"}
r = call("return_book", d, "Fen")
check(r == "Pip", "return_book({'Fen': 'Pip', 'Oak': 'Tock'}, 'Fen') gave back " + repr(r) + ". It should give back who had the book.")
check("Fen" not in d, "return_book gave back the right person, but 'Fen' is still on the loans afterwards. The book has to come off the list too.")
check(d == {"Oak": "Tock"}, "Returning 'Fen' should leave only the other loan, but the loans are " + repr(d) + ".")
d = {"Oak": "Tock"}
r = call("return_book", d, "Moths")
check(r is None, "return_book({'Oak': 'Tock'}, 'Moths') gave back " + repr(r) + ". When the book isn't on loan, it should give back None.")
check(d == {"Oak": "Tock"}, "Returning a book that isn't on loan shouldn't change the loans, but they became " + repr(d) + ".")
d = {"Oak": "Tock"}
call("return_book", d, "Oak")
r = call("return_book", d, "Oak")
check(r is None and d == {}, "Returning the same book twice: the second time nobody has it, so it should give back None and change nothing.")
want = [("The Patient Oven", "Hazel"), ("A Grammar of Owls", "Bram"), ("Moths I Have Known", None), ("Ledgers for Pleasure", "Sable")]
people = ["Bram", "Marlo", "Hazel", "Wren", "Sable", "Ingrid"]
check(len(lines) == 5, "Print one line for each of the 4 returned books, then how many books are still out: 5 lines. You printed " + str(len(lines)) + ".")
for (title, who), line in zip(want, lines):
    check(title in line, "Each returned book's line should name the book. This one says: " + line)
    if who is not None:
        check(who in line, "The line for " + title + " should say who brought it back, but it says: " + line)
    else:
        check("None" not in line, "Nobody had " + title + ". Say so in words: Odo doesn't know anyone called None.")
        check(not any(p in line for p in people), "Nobody had " + title + " on loan, but the line names someone: " + line)
check("3" in lines[4] or "three" in lines[4].lower(), "The last line should say how many books are still out, but it says: " + lines[4])
vns, vl = again(('returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]', 'returned = ["Wind, A Biography"]'))
check(len(vl) == 2 and "Wren" in vl[0] and "5" in vl[1], "If only Wren's book came back, there'd be one line for it and 5 books still out. Work from returned and loans, not from today's answers.")`,
      hints: [
        "Order matters: you need to know who had the book *before* it comes off the list. And there are two cases to think about: on loan, or not.",
        "`cakes.pop(\"plum\", None)` takes plum out and hands back its value, or hands back None if there was no plum. With `del`, check with `in` first and read the value before you delete it.",
        "In return_book, `.pop` with a default does both jobs at once: it takes the book off and hands back who had it. In the loop, keep what `return_book` gives back and test it with `is None` to choose which line to print. Then print the `len` of loans.",
      ],
      solution: r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    return loans.pop(title, None)

for title in returned:
    who = return_book(loans, title)
    if who is not None:
        print(f"{who} brought back {title}.")
    else:
        print(f"Nobody had {title}. Odo is puzzled.")
print(f"{len(loans)} books are still out.")`,
      wrong: [r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    who = loans[title]
    del loans[title]
    return who

for title in returned:
    who = return_book(loans, title)
    print(f"{who} brought back {title}.")
print(f"{len(loans)} books are still out.")`, r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    if title in loans:
        return loans[title]
        del loans[title]
    return None

for title in returned:
    who = return_book(loans, title)
    if who is not None:
        print(f"{who} brought back {title}.")
    else:
        print(f"Nobody had {title}. Odo is puzzled.")
print(f"{len(loans)} books are still out.")`, r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    return loans.pop(title)

for title in returned:
    who = return_book(loans, title)
    print(f"{who} brought back {title}.")
print(f"{len(loans)} books are still out.")`, r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    return loans.pop(title, None)

for title in returned:
    who = return_book(loans, title)
    print(f"{who} brought back {title}.")
print(f"{len(loans)} books are still out.")`, r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    return loans.pop(title, None)

for title in returned:
    who = return_book(loans, title)
    if who is not None:
        print(f"{who} brought back {title}.")
    else:
        print(f"Nobody had {title}. Odo is puzzled.")
print("3 books are still out.")`, r`loans = {
    "A Grammar of Owls": "Bram",
    "Knots and Their Meanings": "Marlo",
    "The Patient Oven": "Hazel",
    "Wind, A Biography": "Wren",
    "Ledgers for Pleasure": "Sable",
    "Iron and Gentle Fire": "Ingrid",
}
returned = ["The Patient Oven", "A Grammar of Owls", "Moths I Have Known", "Ledgers for Pleasure"]

def return_book(loans, title):
    if title in loans:
        return loans[title]
    return None

for title in returned:
    who = return_book(loans, title)
    if who is not None:
        print(f"{who} brought back {title}.")
    else:
        print(f"Nobody had {title}. Odo is puzzled.")
print(f"{len(loans)} books are still out.")`],
      done: "Odo: Three still out, and my owls are home. Footnote: Bram has left a gravy thumbprint on page forty. I shall treasure it. Furiously. And I don't own a book about moths. Do I? I'd like to.",
    },
    {
      id: "l09-a-shelf-for-every-window",
      part: "Windows",
      title: "A Shelf for Every Window",
      topic: "dictionaries of lists",
      cost: { wood: 6, stone: 2 },
      intro: [
        "The windows go in: tall arched ones below, blue-shuttered ones above. Under every window Odo wants a shelf of books, so you can read in the light.",
        "A dictionary's values can be anything, even lists. Then `rooms[\"loft\"]` is a whole list, and `rooms[\"loft\"].append(...)` adds to that list.",
        "Odo: Footnote: a list inside a dictionary is like a pocket inside a coat. I have eleven pockets. I know what's in four of them.",
      ],
      codex: ["nested-data", "dict-safe"],
      quiz: {
        code: r`pegs = {"hall": ["coat"]}
pegs["hall"].append("hat")
pegs["door"] = ["scarf"]
print(len(pegs), len(pegs["hall"]))`,
        question: "What does this program show?",
        options: ["2 2", "3 2", "2 3", "1 2"],
        answer: 0,
        why: "pegs has two keys, \"hall\" and \"door\", so len(pegs) is 2. The hall's list is [\"coat\", \"hat\"], so its len is 2 as well.",
      },
      task: [
        "`shelves` maps each window to the list of books on the shelf below it.",
        "Write `shelve(shelves, window, title)`: it puts `title` at the end of that window's shelf. A window with no shelf yet gets a new one, holding just that book.",
        "Write `find(shelves, title)`: the window whose shelf holds `title`, or `None` if it isn't on any shelf.",
        "Shelve each book in `arrivals` under the window at the same place in `windows`. Then print a line for each window saying how many books its shelf holds, and last, which window *Moss and Its Many Friends* ended up under.",
      ],
      starter: r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]   # where each new book goes

# def shelve(shelves, window, title):

# def find(shelves, title):
`,
      tests: PRE + r`s = {"moss": ["Fern Facts"]}
call("shelve", s, "moss", "Lichen")
check(s == {"moss": ["Fern Facts", "Lichen"]}, "shelve(shelves, 'moss', 'Lichen') should put 'Lichen' on the end of the moss shelf, next to 'Fern Facts', but the shelves are now " + repr(s) + ".")
s = {"moss": ["Fern Facts"]}
call("shelve", s, "attic", "Dust")
check("attic" in s, "shelve({'moss': ['Fern Facts']}, 'attic', 'Dust') should give the attic window a new shelf, but the shelves are still " + repr(s) + ". The new list has to be stored in shelves.")
check(s == {"moss": ["Fern Facts"], "attic": ["Dust"]}, "After shelving 'Dust' under a new attic window, the shelves are " + repr(s) + ". The attic shelf should hold just that book, and the moss shelf shouldn't change.")
call("shelve", s, "attic", "Cobwebs")
check(s.get("attic") == ["Dust", "Cobwebs"], "Shelving a second book under the attic window should add it after 'Dust', but the attic shelf is " + repr(s.get("attic")) + ". Only make a new shelf when there isn't one yet.")
s = {"moss": ["A", "B"], "attic": ["C"]}
r = call("find", s, "C")
check(r == "attic", "find({'moss': ['A', 'B'], 'attic': ['C']}, 'C') gave back " + repr(r) + ". It should give back the window whose shelf holds that book. Look inside every shelf before giving up.")
r = call("find", s, "B")
check(r == "moss", "find({'moss': ['A', 'B'], 'attic': ['C']}, 'B') gave back " + repr(r) + ". 'B' is on the moss shelf.")
r = call("find", s, "Z")
check(r is None, "find(..., 'Z') gave back " + repr(r) + ". A book that isn't on any shelf should give back None.")
r = call("find", {}, "A")
check(r is None, "With no shelves at all, find should give back None, not " + repr(r) + ".")
want = [("west", 3), ("east", 2), ("dormer", 2)]
check(len(lines) == 4, "Print one line per window (3 of them once the new books are in), then which window Moss and Its Many Friends is under: 4 lines. You printed " + str(len(lines)) + ".")
for w, n in want:
    found = [line for line in lines[:3] if w in line]
    check(found, "Print a line for the " + w + " window saying how many books its shelf holds. None of your first three lines mentions it.")
    check(str(n) in found[0], "The line for the " + w + " window should say how many books its shelf holds, but it says: " + found[0])
check("dormer" in lines[3], "The last line should say which window's shelf Moss and Its Many Friends is on, but it says: " + lines[3])
vns, vl = again(('arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]', 'arrivals = ["Moss and Its Many Friends"]'), ('windows = ["dormer", "east", "west", "dormer"]', 'windows = ["north"]'))
check(len(vl) == 4 and "north" in vl[2] and "1" in vl[2] and "north" in vl[3], "If Moss were the only new book and went under a north window, your lines should change to match. Work them out from shelves and your find function.")`,
      hints: [
        "Two kinds of window: one that already has a shelf (add to its list) and one that doesn't (make the list first). To find a book, you'll have to look inside every shelf's list.",
        "`if \"plums\" in baskets:` then `baskets[\"plums\"].append(...)` adds to the list that's already there, and `baskets[\"figs\"] = []` makes a new, empty one. `\"fig\" in baskets[\"figs\"]` asks whether a list holds something.",
        "In shelve, a window that isn't a key yet first gets an empty list; then the book is appended, whichever kind of window it was. In find, loop over `.items()` and return the window as soon as its list holds the title, and only after the loop return None. `zip` walks `arrivals` and `windows` together.",
      ],
      solution: r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    if window not in shelves:
        shelves[window] = []
    shelves[window].append(title)

def find(shelves, title):
    for window, books in shelves.items():
        if title in books:
            return window
    return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`,
      wrong: [r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    shelves[window] = [title]

def find(shelves, title):
    for window, books in shelves.items():
        if title in books:
            return window
    return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`, r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    shelves.get(window, []).append(title)

def find(shelves, title):
    for window, books in shelves.items():
        if title in books:
            return window
    return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`, r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    if window not in shelves:
        shelves[window] = []
    shelves[window].append(title)

def find(shelves, title):
    for window, books in shelves.items():
        if title in books:
            return window
        else:
            return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`, r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    shelves[window].append(title)

def find(shelves, title):
    for window, books in shelves.items():
        if title in books:
            return window
    return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`, r`shelves = {
    "west": ["Rivers I Have Followed", "A Grammar of Owls"],
    "east": ["Bells of the Old Lakes"],
}
arrivals = ["Moss and Its Many Friends", "Tea, Considered", "The Last Lantern", "Ninety Kinds of Rain"]
windows = ["dormer", "east", "west", "dormer"]

def shelve(shelves, window, title):
    if window not in shelves:
        shelves[window] = []
    shelves[window].append(title)

def find(shelves, title):
    if title in shelves:
        return title
    return None

for title, window in zip(arrivals, windows):
    shelve(shelves, window, title)
for window, books in shelves.items():
    print(f"{window}: {len(books)} books")
print("Moss is under the", find(shelves, "Moss and Its Many Friends"), "window.")`],
      done: "Odo: Glass! Leaded and arched and full of sky. And Moss under the dormer, where the light is greenest. I put it there on purpose. Mostly on purpose.",
    },
    {
      id: "l10-the-card-catalogue",
      part: "Front door",
      title: "The Card Catalogue",
      topic: "lists of dictionaries",
      cost: { wood: 8, stone: 1 },
      intro: [
        "A library needs a door, and behind every good library door is a catalogue: one card for every book.",
        "Odo: Each card is a little dictionary: the title, who wrote it, the year. And the catalogue is a list of cards. A list of dictionaries! Footnote: I'm aware I sound like a child on festival morning.",
        "`cards[0]` is the first card, a whole dictionary, and `cards[0][\"year\"]` reaches into it. A `for` loop over the list hands you one card at a time.",
      ],
      codex: ["nested-data", "dict-loops"],
      quiz: {
        code: r`cards = [{"name": "Fern", "age": 7}, {"name": "Rook", "age": 70}]
print(cards[1]["name"], len(cards[0]))`,
        question: "What does this program show?",
        options: ["Rook 2", "Fern 2", "Rook 70", "KeyError"],
        answer: 0,
        why: "cards[1] is the second card, and its \"name\" is Rook. cards[0] is a dictionary with two keys, so its len is 2.",
      },
      task: [
        "`catalogue` is a list of cards. Every card has a `\"title\"`, an `\"author\"` and a `\"year\"`.",
        "Write `by_author(catalogue, author)`: a list of the titles that author wrote, in catalogue order.",
        "Write `oldest(catalogue)`: the title of the oldest book, the one with the earliest year. If two share the earliest year, the first in the catalogue wins. An empty catalogue gives back `None`.",
        "Odo has a feeling one of his authors sounds familiar. Use your functions to print the titles by Ysolde, then the title of the oldest book he owns.",
      ],
      starter: r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

# def by_author(catalogue, author):

# def oldest(catalogue):
`,
      tests: PRE + r`cat = [
    {"title": "Hops", "author": "Bee", "year": 900},
    {"title": "Moss", "author": "Ann", "year": 700},
    {"title": "Ink", "author": "Bee", "year": 700},
]
r = call("by_author", cat, "Bee")
check(isinstance(r, list), "by_author should give back a list of titles, but it gave back " + repr(r) + ".")
check(not (r and isinstance(r[0], dict)), "by_author gave back whole cards. Odo only wants the titles from them.")
check(r == ["Hops", "Ink"], "by_author gave back " + repr(r) + " for the author Bee, who wrote Hops and Ink. It should give back the titles of every card by that author, in catalogue order.")
r = call("by_author", cat, "Pip")
check(r == [], "An author with no cards should give back an empty list, not " + repr(r) + ".")
r = call("oldest", cat)
check(r != 700, "oldest gave back the year. Odo wants the title of the oldest book.")
check(r != "Ink", "Two books share the earliest year, 700, and oldest gave back the second. The first one in the catalogue should win.")
check(r == "Moss", "oldest gave back " + repr(r) + " for cards from the years 900, 700 and 700. It should give back the title of the book with the earliest year.")
r = call("oldest", [{"title": "Solo", "author": "X", "year": 1000}])
check(r == "Solo", "With only one card, that book is the oldest, but oldest gave back " + repr(r) + ".")
r = call("oldest", [])
check(r is None, "An empty catalogue has no oldest book, so oldest([]) should give back None, not " + repr(r) + ".")
check(src.count("by_author(") >= 2 and src.count("oldest(") >= 2, "Use your two functions to find what Odo asked for: call them, and print what they give back.")
check("Runes for Small Hands" in out and "The Stone That Hummed" in out, "Print the titles of the books Ysolde wrote.")
check("Bells of the Old Lakes" in out, "Print the title of the oldest book in the catalogue.")
check("Tea, Considered" not in out and "Ninety Kinds of Rain" not in out, "Print only what Odo asked for: Ysolde's titles and the oldest book.")
vns, vl = again(('{"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640}', '{"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 1040}'), ('{"title": "Runes for Small Hands", "author": "Ysolde", "year": 712}', '{"title": "Runes for Small Hands", "author": "Marta Reed", "year": 712}'))
vout = " ".join(vl)
check("The Stone That Hummed" in vout and "Runes for Small Hands" not in vout and "Bells of the Old Lakes" not in vout, "If the Bells book were newer and the primer were by someone else, Ysolde would have one book, and it would be the oldest. Print what your functions give back, so the lines change with the catalogue.")`,
      hints: [
        "A card is a dictionary, and the catalogue is a list of them. So you loop over the list, and on each card you look up the key you need.",
        "`for card in deck:` gives you one dictionary at a time, and `card[\"suit\"]` reaches into it. Collect titles with `append`. For the earliest year keep a tracker, like the biggest subject in the turret, but hunting for smaller.",
        "`found = []` / `for card in catalogue:` / `if card[\"author\"] == author:` / `found.append(card[...])`. For oldest, start with `best = None` and replace it with the card when `best is None or card[\"year\"] < ...`; at the end give back the title of `best` (or None).",
      ],
      solution: r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    best = None
    for card in catalogue:
        if best is None or card["year"] < best["year"]:
            best = card
    if best is None:
        return None
    return best["title"]

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`,
      wrong: [r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card)
    return found

def oldest(catalogue):
    best = None
    for card in catalogue:
        if best is None or card["year"] < best["year"]:
            best = card
    if best is None:
        return None
    return best["title"]

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`, r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    best = None
    for card in catalogue:
        if best is None or card["year"] <= best["year"]:
            best = card
    if best is None:
        return None
    return best["title"]

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`, r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    years = []
    for card in catalogue:
        years.append(card["year"])
    return min(years)

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`, r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    best = catalogue[0]
    for card in catalogue:
        if card["year"] < best["year"]:
            best = card
    return best["title"]

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`, r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    best = None
    for card in catalogue:
        if best is None or card["year"] < best["year"]:
            best = card
    if best is None:
        return None
    return best["title"]

print("Ysolde wrote:", by_author(catalogue, "Ysolde"))
print("The oldest book is", oldest(catalogue))`, r`catalogue = [
    {"title": "Rivers I Have Followed", "author": "Marta Reed", "year": 1021},
    {"title": "Runes for Small Hands", "author": "Ysolde", "year": 712},
    {"title": "Bells of the Old Lakes", "author": "Ansel Brook", "year": 640},
    {"title": "Tea, Considered", "author": "Marta Reed", "year": 1030},
    {"title": "The Stone That Hummed", "author": "Ysolde", "year": 709},
    {"title": "Ninety Kinds of Rain", "author": "Ansel Brook", "year": 990},
]

def by_author(catalogue, author):
    found = []
    for card in catalogue:
        if card["author"] == author:
            found.append(card["title"])
    return found

def oldest(catalogue):
    best = None
    for card in catalogue:
        if best is None or card["year"] < best["year"]:
            best = card
    if best is None:
        return None
    return best["title"]

ysolde = by_author(catalogue, "Ysolde")
first = oldest(catalogue)
print("Ysolde wrote: Runes for Small Hands, The Stone That Hummed")
print("The oldest book is Bells of the Old Lakes")`],
      done: "Odo: Ysolde? *The* Ysolde, of the old stories? I've owned her little primer for twenty years! Half my rune-letters came out of it, and I never once read the name on the spine. Footnote: I need to sit down. On the new doorstep. Which is lovely, by the way.",
    },
    {
      id: "l11-footnotes-under-the-slates",
      part: "Slate roof and chimney",
      title: "Footnotes Under the Slates",
      topic: "changing nested data",
      cost: { wood: 5, stone: 6 },
      intro: [
        "The roof goes on: steep blue-grey slate, and a stone chimney so Odo can have a fire that's nowhere near the books.",
        "With a dry roof overhead at last, Odo fetches the thing he never lets out of his sight: the manuscript of *A Gentle History of Forgotten Alphabets*. He keeps track of it in a dictionary of dictionaries.",
        "Data inside data is reached one step at a time: `town[\"bakery\"][\"loaves\"]` finds the bakery's dictionary first, then the loaves inside it. Change something in there and it stays changed, because it's the very same inner dictionary.",
      ],
      codex: ["nested-data", "dict-changes"],
      quiz: {
        code: r`town = {"bakery": {"loaves": 4}}
shop = town["bakery"]
shop["loaves"] = 9
print(town["bakery"]["loaves"])`,
        question: "What does this program show?",
        options: ["9", "4", "KeyError", "13"],
        answer: 0,
        why: "shop isn't a copy: it's another name for the very same inner dictionary. Changing shop changes what town[\"bakery\"] holds.",
      },
      task: [
        "`manuscript` maps each chapter's name to a small dictionary of its own: its `\"pages\"`, and a list of its `\"footnotes\"`.",
        "Write `count_footnotes(manuscript)`: how many footnotes there are in the whole book.",
        "Write `add_footnote(manuscript, chapter, note)`: it adds `note` to the end of that chapter's footnotes, and every footnote makes its chapter one page longer. A chapter that doesn't exist yet is started first, with no pages and no footnotes.",
        "Add Odo's `new_notes` to the chapters at the same places in `to_chapters`. Then print how many footnotes the whole book has, and a line for each chapter with its pages.",
      ],
      starter: r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

# def count_footnotes(manuscript):

# def add_footnote(manuscript, chapter, note):
`,
      tests: PRE + r`m = {"A": {"pages": 3, "footnotes": ["x", "y"]}, "B": {"pages": 5, "footnotes": ["z"]}}
r = call("count_footnotes", m)
check(r != 2, "count_footnotes gave back 2: that's how many chapters there are. Count the footnotes inside each chapter.")
check(r != 8, "count_footnotes gave back 8: that's the pages. Count the footnotes instead.")
check(r == 3, "count_footnotes gave back " + repr(r) + " for a book whose two chapters have 2 and 1 footnotes.")
r = call("count_footnotes", {})
check(r == 0, "A book with no chapters has no footnotes, but count_footnotes({}) gave back " + repr(r) + ".")
r = call("count_footnotes", {"E": {"pages": 4, "footnotes": []}})
check(r == 0, "A chapter whose footnote list is empty has no footnotes, but count_footnotes gave back " + repr(r) + ".")
m = {"A": {"pages": 3, "footnotes": ["x"]}}
call("add_footnote", m, "A", "y")
check(m["A"]["footnotes"] == ["x", "y"], "add_footnote(book, 'A', 'y') should put 'y' at the end of chapter A's footnotes, but they are " + repr(m["A"]["footnotes"]) + ".")
check(m["A"]["pages"] == 4, "Each footnote makes its chapter one page longer, so chapter A should go from 3 pages to 4, but it has " + repr(m["A"]["pages"]) + ".")
m = {"A": {"pages": 3, "footnotes": ["x"]}}
call("add_footnote", m, "Z", "new")
check("Z" in m, "add_footnote(book, 'Z', 'new') should start a chapter Z, but the book is still " + repr(m) + ".")
check(m["Z"] == {"pages": 1, "footnotes": ["new"]}, "A new chapter starts with no pages and no footnotes, then gets its footnote and its page, but chapter Z is " + repr(m["Z"]) + ".")
check(m["A"] == {"pages": 3, "footnotes": ["x"]}, "Starting chapter Z shouldn't change chapter A, but it is now " + repr(m["A"]) + ".")
call("add_footnote", m, "Z", "again")
check(m["Z"] == {"pages": 2, "footnotes": ["new", "again"]}, "A second footnote in chapter Z should join the first, but chapter Z is " + repr(m["Z"]) + ". Only start a chapter when it isn't there yet.")
want = [("Runes of the Reed People", 213), ("The Knotted Script", 99), ("Bells That Spelled", 140), ("The Last Chapter", 1)]
check(len(lines) == 5, "Print how many footnotes the book has, then one line for each of its 4 chapters: 5 lines. You printed " + str(len(lines)) + ".")
check("6" in lines[0], "The first line should say how many footnotes the whole book has now, but it says: " + lines[0])
for c, p in want:
    found = [line for line in lines[1:] if c in line]
    check(found, "Print a line for the chapter " + c + " with its pages. None of your chapter lines mentions it.")
    check(str(p) in found[0], "The line for " + c + " should show the chapter and its pages, but it says: " + found[0])
vns, vl = again(('new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]', 'new_notes = ["Owls again"]'), ('to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]', 'to_chapters = ["Bells That Spelled"]'))
check(len(vl) == 4 and "4" in vl[0] and "141" in vl[3], "If Odo had only one new footnote, for Bells That Spelled, your lines should change to match. Print what your functions work out.")`,
      hints: [
        "Reach in one step at a time: first the chapter's own dictionary, then the thing inside it. And for a chapter that doesn't exist yet: what should its little dictionary look like before anything is added?",
        "Two steps of square brackets reach in: `school[\"class A\"][\"pupils\"] -= 1` changes a number inside, and `school[\"class A\"][\"names\"].append(\"Fern\")` adds to a list inside. A value can be any dictionary at all, so `school[\"class B\"] = {\"pupils\": 0, \"names\": []}` makes a new inner one.",
        "add_footnote: if the chapter isn't a key yet, store a fresh little dictionary for it first (no pages, an empty list). After that, every chapter gets the same two changes: the note appended to `manuscript[chapter][\"footnotes\"]`, and one more page. count_footnotes adds up the `len` of each chapter's footnote list.",
      ],
      solution: r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    total = 0
    for chapter in manuscript.values():
        total += len(chapter["footnotes"])
    return total

def add_footnote(manuscript, chapter, note):
    if chapter not in manuscript:
        manuscript[chapter] = {"pages": 0, "footnotes": []}
    manuscript[chapter]["footnotes"].append(note)
    manuscript[chapter]["pages"] += 1

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`,
      wrong: [r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    return len(manuscript)

def add_footnote(manuscript, chapter, note):
    if chapter not in manuscript:
        manuscript[chapter] = {"pages": 0, "footnotes": []}
    manuscript[chapter]["footnotes"].append(note)
    manuscript[chapter]["pages"] += 1

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`, r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    total = 0
    for chapter in manuscript.values():
        total += len(chapter["footnotes"])
    return total

def add_footnote(manuscript, chapter, note):
    manuscript[chapter] = {"pages": 0, "footnotes": []}
    manuscript[chapter]["footnotes"].append(note)
    manuscript[chapter]["pages"] += 1

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`, r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    total = 0
    for chapter in manuscript.values():
        total += len(chapter["footnotes"])
    return total

def add_footnote(manuscript, chapter, note):
    if chapter not in manuscript:
        manuscript[chapter] = {"pages": 0, "footnotes": []}
    manuscript[chapter]["footnotes"].append(note)

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`, r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    total = 0
    for chapter in manuscript.values():
        total += len(chapter["footnotes"])
    return total

def add_footnote(manuscript, chapter, note):
    manuscript[chapter]["footnotes"].append(note)
    manuscript[chapter]["pages"] += 1

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`, r`manuscript = {
    "Runes of the Reed People": {"pages": 212, "footnotes": ["On damp reeds", "A rude reed"]},
    "The Knotted Script": {"pages": 98, "footnotes": []},
    "Bells That Spelled": {"pages": 140, "footnotes": ["Bell or ball?"]},
}
new_notes = ["Knots in wet rope", "Another rude reed", "Where it all ended"]
to_chapters = ["The Knotted Script", "Runes of the Reed People", "The Last Chapter"]

def count_footnotes(manuscript):
    total = 0
    for chapter in manuscript.values():
        total += chapter["pages"]
    return total

def add_footnote(manuscript, chapter, note):
    if chapter not in manuscript:
        manuscript[chapter] = {"pages": 0, "footnotes": []}
    manuscript[chapter]["footnotes"].append(note)
    manuscript[chapter]["pages"] += 1

for note, chapter in zip(new_notes, to_chapters):
    add_footnote(manuscript, chapter, note)
print(f"{count_footnotes(manuscript)} footnotes in all")
for name, chapter in manuscript.items():
    print(f"{name}: {chapter['pages']} pages")`],
      done: "Odo: A roof! My manuscript is dry for the first time in thirty-one years. And there's a chapter called The Last Chapter now. It's one page long. It's only a footnote. Is that the chimney smoking already? Lovely chimney. Let's go and look at the chimney.",
    },
    {
      id: "l12-the-librarians-order",
      part: "Turret book room",
      title: "The Librarian's Order",
      topic: "sorting dictionaries",
      cost: { wood: 7, stone: 3 },
      intro: [
        "At the top of the turret: a little round book room under a tall slate cone. Odo wants its shelves in a proper order. Several proper orders, actually.",
        "`sorted(d)` gives a list of a dictionary's keys in order. `key=` tells sorted what to sort **by**: hand it a function, like `len` or `d.get`, and sorted asks that function about every item. `reverse=True` turns any order upside down.",
        "Odo: And librarians have a rule. A title is filed without a 'The' or an 'A' at the front, and capital letters don't count. *The Last Lantern* lives under L! People have fought duels over less. Footnote: one of them was me.",
      ],
      codex: ["sorting-dicts", "string-methods", "dict-loops"],
      quiz: {
        code: r`heights = {"fir": 9, "ash": 4, "yew": 6}
print(sorted(heights, key=heights.get))`,
        question: "What does this program show?",
        options: ["['ash', 'yew', 'fir']", "[4, 6, 9]", "['ash', 'fir', 'yew']", "['fir', 'yew', 'ash']"],
        answer: 0,
        why: "sorted goes through the keys, but key=heights.get sorts them by their values: ash (4), yew (6), fir (9). It still gives back the keys, not the numbers.",
      },
      task: [
        "`borrowed` maps each title in the turret to how many times it has been borrowed.",
        "Write `filing_name(title)`: the title the way a librarian files it: all small letters, and without a `The` or an `A` as its first word (in capitals or not).",
        "Write `shelf_order(titles)`: the titles in the librarian's order, by their filing names. Titles that file the same keep their order.",
        "Write `favourites(borrowed, n)`: the `n` most borrowed titles, most borrowed first. Titles borrowed equally often keep the dictionary's order.",
        "Print every title in shelf order, one per line. Last, on one line, the three favourites, also in shelf order.",
      ],
      starter: r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

# def filing_name(title):

# def shelf_order(titles):

# def favourites(borrowed, n):
`,
      tests: PRE + r`r = call("filing_name", "The Last Lantern")
check(isinstance(r, str), "filing_name should give back the title as text, but it gave back " + repr(r) + ".")
check(r == "last lantern", "filing_name('The Last Lantern') gave back " + repr(r) + ". The 'The' at the front doesn't count, and nor do capital letters.")
r = call("filing_name", "A Grammar of Owls")
check(r == "grammar of owls", "filing_name('A Grammar of Owls') gave back " + repr(r) + ". A first word 'A' doesn't count either.")
r = call("filing_name", "An Atlas of Puddles")
check(r == "an atlas of puddles", "filing_name('An Atlas of Puddles') gave back " + repr(r) + ". Its first word is 'An', not 'A', so it is filed as it is (in small letters). Check for the space after the A.")
r = call("filing_name", "Theory of Tea")
check(r == "theory of tea", "filing_name('Theory of Tea') gave back " + repr(r) + ". 'Theory' only starts with the letters t-h-e; its first word isn't 'The'. Check for the space after the word.")
r = call("filing_name", "the owl")
check(r == "owl", "filing_name('the owl') gave back " + repr(r) + ". Capital letters don't count, so a small 'the' at the front doesn't count either.")
r = call("filing_name", "MOSS")
check(r == "moss", "filing_name('MOSS') gave back " + repr(r) + ". A filing name is all small letters.")
r = call("shelf_order", ["The Moss", "apple", "A Bee"])
check(isinstance(r, list), "shelf_order should give back a list of titles, but it gave back " + repr(r) + ".")
check(r != ["A Bee", "The Moss", "apple"], "shelf_order(['The Moss', 'apple', 'A Bee']) sorted the titles as they are written. Sort them by their filing names: moss, apple, bee.")
check(r == ["apple", "A Bee", "The Moss"], "shelf_order(['The Moss', 'apple', 'A Bee']) gave back " + repr(r) + ". By filing name that's apple, bee, moss, and the titles themselves come back, not their filing names.")
r = call("shelf_order", ["The Fern", "Fern", "Ash"])
check(r == ["Ash", "The Fern", "Fern"], "shelf_order(['The Fern', 'Fern', 'Ash']) gave back " + repr(r) + ". The Fern and Fern file the same, so they keep their order.")
r = call("favourites", {"a": 1, "b": 5, "c": 3}, 2)
check(isinstance(r, list), "favourites should give back a list of titles, but it gave back " + repr(r) + ".")
check(r != [5, 3], "favourites gave back how many times the titles were borrowed. Odo wants the titles themselves.")
check(r != ["a", "c"], "favourites gave back the least borrowed titles. The most borrowed come first: turn the order round.")
check(r == ["b", "c"], "favourites({'a': 1, 'b': 5, 'c': 3}, 2) gave back " + repr(r) + ". It should be the 2 most borrowed titles, most borrowed first.")
r = call("favourites", {"x": 2, "y": 2, "z": 1}, 2)
check(r == ["x", "y"], "favourites({'x': 2, 'y': 2, 'z': 1}, 2) gave back " + repr(r) + ". x and y tie, so they keep the dictionary's order. Flipping a sorted list round flips the ties too; sorted can do the reversing itself.")
r = call("favourites", {"x": 2}, 5)
check(r == ["x"], "Asking for more favourites than there are titles should give back all of them, but favourites({'x': 2}, 5) gave back " + repr(r) + ".")
def filed(t):
    t = t.lower()
    if t.startswith("the "):
        return t[4:]
    if t.startswith("a "):
        return t[2:]
    return t
def shelf_lines(ls, books, when):
    check(len(ls) == len(books) + 1, when + "print each of the " + str(len(books)) + " titles on its own line in shelf order, then the favourites on one last line: " + str(len(books) + 1) + " lines. You printed " + str(len(ls)) + ".")
    for t, line in zip(sorted(books, key=filed), ls):
        check(t in line, when + "the titles should come in shelf order (by filing name), so this line should be " + t + ", but it says: " + line)
    favs = sorted(books, key=books.get, reverse=True)[:3]
    order = sorted(favs, key=filed)
    last = ls[-1]
    ps = [last.find(t) for t in order]
    check(all(p >= 0 for p in ps), when + "the last line should show the three favourites, but it says: " + last)
    check(ps[0] < ps[1] < ps[2], when + "the last line has the three favourites, but not in shelf order: " + last)
    for t in books:
        check(t in favs or t not in last, when + "the last line should show only the three favourites, but it has " + t + ": " + last)
shelf_lines(lines, {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}, "For Odo's books, ")
vns, vl = again(('borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}', 'borrowed = {"The Fog": 1, "Owls": 5, "A Map": 3, "Ink": 4}'))
shelf_lines(vl, {"The Fog": 1, "Owls": 5, "A Map": 3, "Ink": 4}, "With other books, ")`,
      hints: [
        "There are two different things to sort by: how a title is filed, and how often it's borrowed. File a few titles on paper first. What happens to 'The Last Lantern'? To 'Theory of Tea'? To 'An Atlas'?",
        "`word.lower()` makes capitals stop counting, `word.startswith(\"the \")` asks about the front (the space matters), and a slice like `word[4:]` drops the first four characters. Any function that takes one item can be a `key=`: `sorted(names, key=shout)` sorts by whatever `shout` gives back. `[:3]` keeps the front of a sorted list.",
        "filing_name: make the title small letters first; if it starts with `\"the \"`, give back the slice after those four characters; if it starts with `\"a \"`, the slice after two; otherwise the small-letter title. shelf_order and favourites are each one `return sorted(...)` with the right `key=` (a function's name, no brackets), and favourites also needs `reverse=True` and a slice.",
      ],
      solution: r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`,
      wrong: [r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the"):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    if title.startswith("The "):
        return title[4:].lower()
    if title.startswith("A "):
        return title[2:].lower()
    return title.lower()

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a"):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name())

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    found = []
    for title in titles:
        found.append(filing_name(title))
    return sorted(found)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    order = sorted(borrowed, key=borrowed.get)
    order.reverse()
    return order[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get)[:n]

for title in shelf_order(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in sorted(borrowed):
    print(title)
print(shelf_order(favourites(borrowed, 3)))`, r`borrowed = {"The Last Lantern": 4, "A Grammar of Owls": 12, "Moss and Its Many Friends": 12, "Ninety Kinds of Rain": 2, "Tea, Considered": 9, "An Atlas of Puddles": 7}

def filing_name(title):
    name = title.lower()
    if name.startswith("the "):
        return name[4:]
    if name.startswith("a "):
        return name[2:]
    return name

def shelf_order(titles):
    return sorted(titles, key=filing_name)

def favourites(borrowed, n):
    return sorted(borrowed, key=borrowed.get, reverse=True)[:n]

for title in shelf_order(borrowed):
    print(title)
print(favourites(borrowed, 3))`],
      done: "Odo: An Atlas, then A Grammar under G, and The Last Lantern under L, exactly where a librarian would look. And a pennant on the cone! A library with a flag. I've no idea what it stands for. Reading, I suppose. Let's say reading.",
    },
    {
      id: "l13-an-index-for-the-vault",
      part: "Reading bench",
      title: "An Index for the Vault",
      topic: "building an index",
      cost: { wood: 6, stone: 0 },
      intro: [
        "A reading bench by the door, with a cushion, an inkwell and a quill. Odo sits down with all his notes on the vault, and sighs.",
        "Odo: I wrote down every word I noticed on every page of my notes, and now I can't find anything. What I need is an **index**: for each word, the pages it's on. Footnote: I also dropped them, so the pages are out of order. Naturally.",
        "An index is a dictionary turned inside out. Odo's notes go page → words; the index goes word → pages. Each word's value is a list that grows every time you meet the word on another page.",
      ],
      codex: ["counting", "sorting-dicts", "nested-data"],
      quiz: {
        code: r`pages = {}
for p in [3, 1, 3]:
    if "moss" not in pages:
        pages["moss"] = []
    pages["moss"].append(p)
print(pages)`,
        question: "What does this program show?",
        options: ["{'moss': [3, 1, 3]}", "{'moss': [3]}", "{'moss': [1, 3]}", "KeyError"],
        answer: 0,
        why: "The list is made once, the first time, and then every page is appended in the order it came, repeats and all. Keeping pages in order, or only once, takes extra care.",
      },
      task: [
        "`notes` maps each page number to the list of words Odo jotted on that page.",
        "Write `make_index(notes)`: a dictionary from each word to the list of pages it's on, in page order. A word jotted twice on one page lists that page only once.",
        "Write `pages_for(index, word)`: the pages for that word, or an empty list if the word isn't in the index.",
        "Print the index A to Z, a line per word with its pages. Then print what `pages_for` gives back for \"key\", and for \"dragon\" (Odo is sure he wrote that down somewhere).",
      ],
      starter: r`notes = {   # page number: the words Odo jotted on it (he dropped them, so they're out of order)
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

# def make_index(notes):

# def pages_for(index, word):
`,
      tests: PRE + r`r = call("make_index", {2: ["b"], 1: ["a", "b"]})
check(isinstance(r, dict), "make_index should give back a dictionary, but it gave back " + repr(r) + ".")
check(not [k for k in r if k not in ["a", "b"]], "make_index({2: ['b'], 1: ['a', 'b']}) gave back words that aren't in those notes: " + repr(r) + ". Each call should start a fresh index, made inside the function.")
check(r.get("b") != [2, 1], "make_index gave 'b' the pages [2, 1]. The notes aren't in order, but the index should list pages in page order.")
check(r == {"a": [1], "b": [1, 2]}, "make_index({2: ['b'], 1: ['a', 'b']}) gave back " + repr(r) + ". Each word should map to the list of the pages it's on.")
r = call("make_index", {5: ["x", "x", "y"]})
check(isinstance(r, dict) and r.get("x") == [5], "A word jotted twice on page 5 should list page 5 only once, but the index gives it " + repr(r.get("x") if isinstance(r, dict) else r) + ".")
check(r == {"x": [5], "y": [5]}, "make_index({5: ['x', 'x', 'y']}) gave back " + repr(r) + ".")
r = call("make_index", {})
check(r == {}, "No notes, no index: make_index({}) should give back an empty dictionary, not " + repr(r) + ".")
call("make_index", {1: ["q"]})
r = call("make_index", {1: ["q"]})
check(r == {"q": [1]}, "Making the same index twice gave back " + repr(r) + " the second time. Each call should start a fresh index, made inside the function.")
r = call("pages_for", {"moss": [1, 4]}, "moss")
check(r == [1, 4], "pages_for({'moss': [1, 4]}, 'moss') gave back " + repr(r) + ".")
r = call("pages_for", {"moss": [1, 4]}, "fog")
check(r is not None, "pages_for gave back None for a word that isn't in the index. Give back an empty list instead.")
check(r == [], "For a word that isn't in the index, pages_for should give back an empty list, not " + repr(r) + ".")
want = [("hatch", [1]), ("journal", [3]), ("key", [3, 4]), ("light", [1, 2]), ("ring", [1, 4]), ("seal", [2, 4]), ("serpent", [1, 3, 4]), ("stone", [2])]
check(len(lines) == 10, "Print one line per word in the index (8 words), A to Z, then the pages for key, then the pages for dragon: 10 lines. You printed " + str(len(lines)) + ".")
for (w, ps), line in zip(want, lines):
    check(w in line and all(str(p) in line for p in ps), "The index should go A to Z, one word per line with its pages. Line for " + w + " says: " + line)
check("3" in lines[8] and "4" in lines[8], "The next line should show the pages for key, but it says: " + lines[8])
check("[]" in lines[9], "The last line should show what pages_for gives back for dragon (an empty list), but it says: " + lines[9])
check(src.count("make_index(") >= 2 and src.count("pages_for(") >= 3, "Use your functions: make the index with make_index, and ask pages_for about key and dragon.")
vns, vl = again(('    3: ["serpent", "key", "journal"],', '    3: ["dragon", "key"],'))
vout = " ".join(vl)
check("journal" not in vout and len(vl) == 10 and "3" in vl[-1], "If page 3 said only dragon and key, the index and the pages for dragon should change to match. Print what your functions work out, not today's answers.")`,
      hints: [
        "Turn it round on paper first: take page 1, and for each word on it, write 1 next to the word. Then page 2, and so on. What do you do the first time you meet a word? And what if this page is already written next to it?",
        "Grouping is counting with lists instead of numbers: `if fruit not in baskets: baskets[fruit] = []`, then `baskets[fruit].append(day)`. `for day in sorted(diary):` walks a dictionary's keys in order, and `x not in some_list` stops repeats.",
        "`index = {}` / `for page in sorted(notes):` / `for word in notes[page]:` / give a new word an empty list / `if page not in index[word]:` append it, and return the index. `pages_for` is one `.get` with an empty list as the default.",
      ],
      solution: r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word, [])

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`,
      wrong: [r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in notes:
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word, [])

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word, [])

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            index[word] = [page]
    return index

def pages_for(index, word):
    return index.get(word, [])

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}
index = {}

def make_index(notes):
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word, [])

make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index[word]

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word)

index = make_index(notes)
for word in sorted(index):
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`, r`notes = {
    2: ["light", "stone", "seal", "light"],
    4: ["seal", "key", "ring", "serpent"],
    1: ["hatch", "serpent", "ring", "light"],
    3: ["serpent", "key", "journal"],
}

def make_index(notes):
    index = {}
    for page in sorted(notes):
        for word in notes[page]:
            if word not in index:
                index[word] = []
            if page not in index[word]:
                index[word].append(page)
    return index

def pages_for(index, word):
    return index.get(word, [])

index = make_index(notes)
for word in index:
    print(word, index[word])
print("key:", pages_for(index, "key"))
print("dragon:", pages_for(index, "dragon"))`],
      done: "Odo: 'Serpent: pages 1, 3 and 4.' It's everywhere, that serpent. On the seal, in my notes, in my dreams last night. Pip says it's 'a very common sort of serpent'. Pip is humming again.",
    },
    {
      id: "l14-ysoldes-journal",
      part: "Lanterns, sign and vault rope",
      title: "Ysolde's Journal",
      topic: "putting it together",
      cost: { wood: 5, stone: 4 },
      intro: [
        "Evening. The runes on the vault hatch have grown brighter with every piece of the library, and tonight they're blazing. Ssso... I think it's ready. I think it was waiting for a library to sit beside.",
        "Odo: It opens! It... oh. Wrapped in oilcloth, dry as a biscuit. A little book. Ysolde's journal! And every page is in her rune-letters, the ones from her primer. Footnote: her rune-letters have no capitals, so neither will the reading.",
        "Odo: I have a card for every rune I've ever worked out. Thirty-one years of cards, oldest first. Each says a rune and the letter it stands for. Where two cards disagree, the newer one is right: I learned as I went.",
        "This uses the whole library: a list of dictionaries, building a dictionary, safe lookups, loops and strings. One function at a time, and Odo will hang the lanterns and rope off the vault while you read.",
      ],
      codex: ["dict-safe", "nested-data", "counting"],
      quiz: {
        code: r`shades = {"r": "red", "b": "blue"}
word = ""
for ch in "rgb":
    word += shades.get(ch, "?") + " "
print(word.strip())`,
        question: "What does this program show?",
        options: ["red ? blue", "red blue", "KeyError", "red g blue"],
        answer: 0,
        why: "\"g\" isn't a key, so .get hands back its default, \"?\". Nothing crashes, and the strip() at the end takes off the last space.",
      },
      task: [
        "`cards` is Odo's catalogue of rune cards, oldest first. Each card has a `\"rune\"` and the `\"letter\"` it stands for.",
        "Write `make_key(cards)`: a dictionary that tells you, for each rune, its letter. When two cards share a rune, the newer card wins.",
        "Write `decode(text, key)`: it gives back `text` with every rune swapped for its letter. Anything that isn't a rune in the key (spaces, commas, full stops) stays exactly as it is.",
        "Build the key from Odo's cards, then print every page of the `journal`, decoded, in order, one line per page, each numbered from 1.",
      ],
      starter: r`cards = [   # Odo's rune cards, oldest first
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [   # Ysolde's journal, page by page
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

# def make_key(cards):

# def decode(text, key):
`,
      tests: PRE + r`r = call("make_key", [{"rune": "Q", "letter": "a"}, {"rune": "W", "letter": "b"}, {"rune": "Q", "letter": "e"}])
check(isinstance(r, dict), "make_key should give back a dictionary, but it gave back " + repr(r) + ".")
check("a" not in r and "b" not in r, "make_key filed each rune under its letter, the wrong way round. The key answers 'what letter is this rune?', so the runes are the keys.")
check(r.get("Q") != "a", "Two cards say what Q is, and the newer one (later in the list) is right, but make_key kept the older one.")
check(r == {"Q": "e", "W": "b"}, "make_key gave back " + repr(r) + " for cards saying Q is a, W is b, then Q is e.")
r = call("make_key", [])
check(r == {}, "No cards, no key: make_key([]) should give back an empty dictionary, not " + repr(r) + ".")
r = call("decode", "QW, Q!", {"Q": "a", "W": "b"})
check(isinstance(r, str), "decode should give back the decoded text as a string, but it gave back " + repr(r) + ".")
check(r != "aba", "decode dropped the spaces and punctuation. Anything that isn't a rune in the key should stay exactly as it is.")
check(r == "ab, a!", "decode('QW, Q!', {'Q': 'a', 'W': 'b'}) gave back " + repr(r) + ". Every rune becomes its letter in the key decode was given, and everything else stays as it is.")
r = call("decode", "", {"Q": "a"})
check(r == "", "Decoding an empty page should give back an empty string, not " + repr(r) + ".")
r = call("decode", "X Q", {"Q": "a", "W": "b"})
check(r == "X a", "decode('X Q', {'Q': 'a', 'W': 'b'}) gave back " + repr(r) + ". X isn't in that key, so it stays an X.")
key = {}
for c in ns.get("cards", []):
    key[c["rune"]] = c["letter"]
journal = ns.get("journal", [])
check(len(lines) == len(journal), "Print each of the journal's " + str(len(journal)) + " pages on its own line, decoded. You printed " + str(len(lines)) + " lines.")
for i, (page, line) in enumerate(zip(journal, lines)):
    plain = ""
    for ch in page:
        plain += key.get(ch, ch)
    check(plain in line, "Line " + str(i + 1) + " should be page " + str(i + 1) + " of the journal, decoded with the key from Odo's cards, but it says: " + line)
    check(str(i + 1) in line.replace(plain, ""), "Number the pages from 1: line " + str(i + 1) + " should show its page number.")
check(src.count("make_key(") >= 2 and src.count("decode(") >= 2, "Use your functions: build the key with make_key, and decode each page with decode.")
vns, vl = again(('    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",', '    "ZSN NGR.",'))
check(len(vl) == 5 and "the end." in vl[-1], "If the last page said something else, your last line should change to match. Decode each page with your functions instead of typing what it says.")`,
      hints: [
        "Two functions, then a short loop. Work out on paper what `decode` should do with one rune, and then with a space. The key is the dictionary that answers 'what letter is this rune?'",
        "To build a dictionary from cards, store something for every card: `prices[card[\"fruit\"]] = card[\"cost\"]`. A later card with the same key simply overwrites the earlier one. `.get(ch, ch)` hands back the character itself when it isn't a key, and strings are built up with `+=`.",
        "make_key: start with an empty dictionary and, for every card, store its letter under its rune (later cards simply overwrite earlier ones), then return it. decode: start with an empty string and add one character for each character of the text, using `.get` with a default that leaves non-runes as they are. Then `enumerate` the journal with `start=1`.",
      ],
      solution: r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`,
      wrong: [r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        if card["rune"] not in key:
            key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key[ch]
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        if ch in key:
            plain += key[ch]
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["letter"]] = card["rune"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
        return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, k):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
    return plain

key = make_key(cards)
for number, page in enumerate(journal, start=1):
    print(f"Page {number}: {decode(page, key)}")`, r`cards = [
    {"rune": "W", "letter": "a"}, {"rune": "N", "letter": "a"}, {"rune": "Z", "letter": "t"},
    {"rune": "T", "letter": "o"}, {"rune": "K", "letter": "z"}, {"rune": "S", "letter": "h"},
    {"rune": "G", "letter": "n"}, {"rune": "Q", "letter": "i"}, {"rune": "E", "letter": "r"},
    {"rune": "N", "letter": "e"}, {"rune": "F", "letter": "l"}, {"rune": "R", "letter": "d"},
    {"rune": "K", "letter": "s"}, {"rune": "I", "letter": "w"}, {"rune": "M", "letter": "u"},
    {"rune": "Y", "letter": "c"}, {"rune": "L", "letter": "g"}, {"rune": "P", "letter": "v"},
    {"rune": "U", "letter": "f"}, {"rune": "V", "letter": "y"}, {"rune": "J", "letter": "p"},
    {"rune": "A", "letter": "k"}, {"rune": "D", "letter": "m"}, {"rune": "C", "letter": "b"},
    {"rune": "B", "letter": "q"}, {"rune": "O", "letter": "x"},
]

journal = [
    "TGFV W UNI TU MK NPNE FNWEGNR ZT KJNWA ZT ZSN KZTGNK, WGR IN INEN JETMR TU QZ.",
    "ZNWYSQGL IWK KFTI. KT IN KZTJJNR ZNWYSQGL, WGR KJTAN UTE NPNEVTGN QGKZNWR.",
    "ZSNG ZSN TZSNEK INGZ WIWV ZT ZSN YQZQNK, WGR ZSN KZTGNK UNFF BMQNZ TGN CV TGN.",
    "Q IWK TGN PTQYN, WGR Q SWR ZWMLSZ GT TGN. Q KNWF ZSQK SNEN UTE ISTNPNE YTDNK GNOZ.",
    "W FWGLMWLN FQPNK TGFV ISQFN QZ QK ZWMLSZ.",
]

def make_key(cards):
    key = {}
    for card in cards:
        key[card["rune"]] = card["letter"]
    return key

def decode(text, key):
    plain = ""
    for ch in text:
        plain += key.get(ch, ch)
    return plain

key = make_key(cards)
for page in journal:
    print(decode(page, key))`],
      done: "Odo: Five pages. Three hundred years in the dark. And she wrote every one of them for whoever came next. That's you, Founder. That's... that's us.",
    },
  ],
};
