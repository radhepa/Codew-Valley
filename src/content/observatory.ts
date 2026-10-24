import type { Building } from "./types.ts";

// The Observatory: building 12 and the finale, taught with the capstone:
// searching, sorting by hand, sort keys, recursion, generators and a program
// bigger than any before it (SYLLABUS.md). Each challenge adds one stage of
// observatory.glb (art/specs/observatory.md, stage_01 … stage_16). No new
// villager moves in: this is Pip's chapter, and Pip's secret comes out at the
// rune circle (stage 13). Villagers who drop by speak lines that start with
// their name ("Rook: ", "Odo: " …).
const r = String.raw;

/** A listed mistake made from a reference answer: every [from, to] edit must apply. */
function mistake(base: string, ...edits: [string, string][]): string {
  let s = base;
  for (const [from, to] of edits) {
    if (!s.includes(from)) throw new Error(`observatory mistake(): ${JSON.stringify(from)} not found`);
    s = s.replace(from, to);
  }
  return s;
}

// Shared check helpers, put in front of every challenge's checks. This
// building's checks mostly call the learner's functions with fresh values:
//   call("find_stake", ["Ash"], "Ash")   -> what the function gave back
//   self_calls("posts", 5)               -> (result, how often it called itself)
//   Counted([...])                       -> a list that counts looks, moves and walks
//   again(("tonight = [..]", "tonight = [..]"))  -> (variables, lines) of a variant
//   with_files({"runes.txt": "..."})     -> rerun with other starting files
// A crash, an endless search or endless recursion inside a learner function
// becomes friendly feedback instead of tripping the checker.
const PRE = r`import types as _types
import re as _re

def _short(v):
    t = repr(v)
    if len(t) > 70:
        t = t[:67] + "..."
    return t

def _nums(text):
    return [int(x) for x in _re.findall(r"\d+", text)]

class _Lost(Exception):
    pass

class Counted(list):
    # A list that notices how it is used: looks inside by position, moves
    # (stores, pops, inserts) and walks (for, in, .index). Too many looks or
    # moves means the program is going round and round, so it stops it.
    def __init__(self, items, limit=3000):
        list.__init__(self, items)
        self.looks = 0
        self.seen = set()
        self.moves = 0
        self.walked = False
        self.limit = limit
    def __getitem__(self, i):
        self.looks += 1
        if self.looks > self.limit:
            raise _Lost()
        if isinstance(i, int):
            self.seen.add(i if i >= 0 else i + len(self))
        return list.__getitem__(self, i)
    def _moved(self):
        self.moves += 1
        if self.moves > self.limit:
            raise _Lost()
    def __setitem__(self, i, v):
        self._moved()
        list.__setitem__(self, i, v)
    def pop(self, *a):
        self._moved()
        return list.pop(self, *a)
    def insert(self, *a):
        self._moved()
        return list.insert(self, *a)
    def __iter__(self):
        self.walked = True
        return list.__iter__(self)
    def __contains__(self, v):
        self.walked = True
        return list.__contains__(self, v)
    def index(self, *a):
        self.walked = True
        return list.index(self, *a)

_LOST = "it kept going and going without stopping. Does the part still left to search really get smaller every time round?"

def need(name):
    check(name in ns, "Define a function called " + name + " (the task names it), so the rune can try it with its own values.")
    check(callable(ns[name]), name + " should be a function made with def, but it is a " + type(ns[name]).__name__ + ".")
    return ns[name]

def _guarded(f, name, args, lost=_LOST):
    shown = name + "(" + ", ".join(_short(a) for a in args) + ")"
    try:
        return f(*args)
    except _Lost:
        check(False, "When the rune called " + shown + ", " + lost)
    except RecursionError:
        check(False, "When the rune called " + shown + ", it called itself forever and never reached a base case: a case small enough to answer without calling itself.")
    except Exception as e:
        check(False, "When the rune called " + shown + ", it crashed with " + type(e).__name__ + ": " + str(e) + ".")

def call(name, *args, lost=_LOST):
    return _guarded(need(name), name, args, lost)

def self_calls(name, *args):
    # Calls the function and counts how often it called itself by its own name.
    f = need(name)
    box = [0]
    def spy(*a, **k):
        box[0] += 1
        return f(*a, **k)
    ns[name] = spy
    try:
        result = _guarded(f, name, args)
    finally:
        ns[name] = f
    return result, box[0]

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the values you're given, so it fits any night, not just this one.")

def with_files(new_files):
    # Runs the program again with other starting files in its folder.
    g = rerun.__globals__
    saved = g["_pg_files"]
    g["_pg_files"] = dict(new_files)
    try:
        return rerun(src)
    except Exception as e:
        check(False, "With another copy of the files, your program crashes with " + type(e).__name__ + ": " + str(e) + ". It has to work for any file written the same way, not just this one.")
    finally:
        g["_pg_files"] = saved

`;

// ---- reference answers (the listed mistakes are made from them) ----

const S01 = r`stakes = ["Kettle", "Lantern", "Thimble", "Acorn", "Heron", "Bellwether",
          "Wheel", "Lamb", "Heron", "Ember", "Plough", "Willow"]

def find_stake(stakes, name):
    for i, stake in enumerate(stakes):
        if stake == name:
            return i
    return -1

print(f"The Heron stake is at position {find_stake(stakes, 'Heron')}.")
spot = find_stake(stakes, "Comet")
if spot == -1:
    print("The Comet is not on the ring.")
else:
    print(f"The Comet is at position {spot}.")`;

const S02 = r`sky = [("Kettle", 4, False), ("Heron", 9, True), ("Lantern", 6, False),
       ("Ember", 8, True), ("Thimble", 7, False), ("Wheel", 10, False)]

def first_clear(sky, limit):
    for name, glow, hidden in sky:
        if glow > limit and not hidden:
            return name
    return None

print(f"Lay the terrace by the light of {first_clear(sky, 6)}.")`;

const S03 = r`import random
random.seed(1300)
catalogue = sorted(random.sample(range(1, 10000), 1000))

tonight = [6562, 4001, 9990, 6]

def find_number(catalogue, number):
    low = 0
    high = len(catalogue) - 1
    while low <= high:
        mid = (low + high) // 2
        if catalogue[mid] == number:
            return mid
        elif catalogue[mid] < number:
            low = mid + 1
        else:
            high = mid - 1
    return -1

for star in tonight:
    spot = find_number(catalogue, star)
    if spot == -1:
        print(f"Star {star} is not in the catalogue.")
    else:
        print(f"Star {star} is at position {spot}.")`;

const S04 = r`import random
random.seed(1300)
catalogue = sorted(random.sample(range(1, 10000), 1000))

tonight = [6, 5246, 9990, 4002, 1334]

def linear_looks(catalogue, number):
    looks = 0
    for i, star in enumerate(catalogue):
        looks += 1
        if star == number:
            return i, looks
    return -1, looks

def binary_looks(catalogue, number):
    low = 0
    high = len(catalogue) - 1
    looks = 0
    while low <= high:
        mid = (low + high) // 2
        looks += 1
        if catalogue[mid] == number:
            return mid, looks
        elif catalogue[mid] < number:
            low = mid + 1
        else:
            high = mid - 1
    return -1, looks

saved = 0
for star in tonight:
    spot, slow = linear_looks(catalogue, star)
    spot, fast = binary_looks(catalogue, star)
    print(f"Star {star}: {slow} looks one by one, {fast} looks by halving")
    saved += slow - fast
print(f"Halving saved {saved} looks tonight.")`;

const S05 = r`stones = [38, 51, 29, 64, 47, 55, 33, 60]

def heaviest_first(stones):
    for i in range(len(stones)):
        best = i
        for j in range(i + 1, len(stones)):
            if stones[j] > stones[best]:
                best = j
        stones[i], stones[best] = stones[best], stones[i]

heaviest_first(stones)
print(stones)`;

const S06 = r`cards = [12, 15, 14, 20, 21, 19, 25, 30, 28, 33]

def slot_in(row, card):
    spot = len(row)
    while spot > 0 and row[spot - 1] > card:
        spot -= 1
    row.insert(spot, card)

def insertion_sort(cards):
    row = []
    for card in cards:
        slot_in(row, card)
    return row

print(insertion_sort(cards))`;

const S07 = r`stars = [
    {"name": "Crest", "constellation": "Heron", "glow": 9},
    {"name": "Lid", "constellation": "Kettle", "glow": 4},
    {"name": "Beak", "constellation": "Heron", "glow": 7},
    {"name": "Wick", "constellation": "Lantern", "glow": 6},
    {"name": "Spout", "constellation": "Kettle", "glow": 8},
    {"name": "Arch", "constellation": "Heron", "glow": 7},
    {"name": "Glass", "constellation": "Lantern", "glow": 6},
    {"name": "Handle", "constellation": "Kettle", "glow": 4},
    {"name": "Flame", "constellation": "Lantern", "glow": 10},
]

def ysolde_key(star):
    return (star["constellation"], -star["glow"], star["name"])

def window_order(stars):
    return [star["name"] for star in sorted(stars, key=ysolde_key)]

for name in window_order(stars):
    print(name)`;

const S08 = r`def posts(rings):
    if rings == 0:
        return 0
    return rings + posts(rings - 1)

def echo(word, times):
    if times == 0:
        return ""
    if times == 1:
        return word
    return word + " " + echo(word, times - 1)

print(f"A 12-ring gallery needs {posts(12)} posts.")
print(echo("hello", 2))`;

const S09 = r`ribs = [412, 398, 405, 421, 399, 410, 407, 415]

def timber(ribs):
    if ribs == []:
        return 0
    return ribs[0] + timber(ribs[1:])

def longest(ribs):
    if len(ribs) == 1:
        return ribs[0]
    rest = longest(ribs[1:])
    if ribs[0] > rest:
        return ribs[0]
    return rest

print(f"Timber in the frame: {timber(ribs)} cm")
print(f"Longest rib: {longest(ribs)} cm")`;

const HERON = r`heron = {"name": "The Great Heron", "stars": ["Beak", "Crest"], "inside": [
    {"name": "The Neck", "stars": ["Arch"], "inside": []},
    {"name": "The Left Wing", "stars": ["Shoulder", "Elbow"], "inside": [
        {"name": "The Long Feathers", "stars": ["Sweep", "Drift", "Plume"], "inside": [
            {"name": "The Wingtip", "stars": ["Flick"], "inside": [
                {"name": "The Last Feather", "stars": ["Quill", "Down"], "inside": []},
            ]},
        ]},
    ]},
    {"name": "The Legs", "stars": ["Knee", "Wade"], "inside": [
        {"name": "The Feet", "stars": ["Toe", "Ripple"], "inside": []},
    ]},
]}`;

const S10 = HERON + r`

def count_stars(c):
    total = len(c["stars"])
    for part in c["inside"]:
        total += count_stars(part)
    return total

def find_home(c, star):
    if star in c["stars"]:
        return c["name"]
    for part in c["inside"]:
        found = find_home(part, star)
        if found is not None:
            return found
    return None

print(f"The Great Heron holds {count_stars(heron)} stars.")
print(f"Quill belongs to {find_home(heron, 'Quill')}.")`;

const S11 = r`colours = ["gold", "green", "blue"]

def watch_hours(start, end):
    hour = start
    while True:
        yield hour
        if hour == end:
            return
        hour = (hour + 1) % 24

def lantern_colours(colours):
    while True:
        for colour in colours:
            yield colour

for hour, colour in zip(watch_hours(21, 5), lantern_colours(colours)):
    print(f"{hour}:00 - lantern {colour}")`;

const SWEEP = r`# Tock's sweeping rune: an endless stream of readings, (angle, glow).
def sweep(start):
    angle = start
    while True:
        glow = (angle * 37 + 11) % 100
        yield angle, glow
        angle += 1`;

const S12 = SWEEP + r`

def peek(readings, n):
    return [next(readings) for _ in range(n)]

def first_bright(readings, limit):
    return next(angle for angle, glow in readings if glow > limit)

def count_bright(readings, n, limit):
    return sum(1 for _ in range(n) if next(readings)[1] > limit)

print(peek(sweep(0), 3))
print(f"First glow above 97 at angle {first_bright(sweep(0), 97)}")
print(f"{count_bright(sweep(0), 100, 50)} of the first 100 readings glow above 50")`;

const STONES = r`stones = [
    " 4: A language lives / 9:written by their own hand, /1: Little one, ",
    "7: who learns it, not one who borrows it. //  2:keep the stone warm",
    "10: you are free. / 5: only while it is taught.",
    " 8:When the Great Rune hears a program/3: and the words inside it. / 6: Wait for a speaker ",
]`;

const S13 = STONES + r`

def pieces(carving):
    found = []
    for bit in carving.split("/"):
        if bit.strip() == "":
            continue
        number, words = bit.split(":")
        found.append((int(number), words.strip()))
    return found

def stitch(parts):
    return " ".join(words for number, words in sorted(parts))

def verse(stones):
    every = []
    for carving in stones:
        every += pieces(carving)
    return stitch(every)

text = verse(stones)
print(text)
print(f"{len(text.split())} words")`;

const REGISTER = [
  "stone,keeper,glow,walk",
  "Sleepy Serpent, Bram, 62, 4",
  "Whistling Mill, Wren, 48, 9",
  "Fisher's Dock, Marlo, 35, 6",
  "Market Square, Sable, 71, 3",
  "Hearth Bakery, Hazel, ??, 5",
  "",
  "The Forge, Ingrid, 40, 7",
  "Scribe's Library, Odo, 58, 4",
  "Apothecary, Mirela, 22, 8",
  "Town Hall, Thistle, 66, 2",
  "Clock Tower, Tock, 30, 6",
  "Guild Hall, Rook, 44, ten",
  "",
].join("\n");

const LOADER = r`import csv

def load_stones(filename):
    stones = []
    smudged = 0
    with open(filename) as f:
        for row in csv.DictReader(f):
            try:
                stones.append({
                    "stone": row["stone"].strip(),
                    "keeper": row["keeper"].strip(),
                    "glow": int(row["glow"]),
                    "walk": int(row["walk"]),
                })
            except ValueError:
                smudged += 1
    return stones, smudged

def by_glow_then_walk(stone):
    return (stone["glow"], stone["walk"])

def dimmest_first(stones):
    return sorted(stones, key=by_glow_then_walk)`;

const S14 = LOADER + r`

stones, smudged = load_stones("stones.csv")
print(f"{len(stones)} stones read, {smudged} lines smudged by the Hush.")
print("Dimmest first:")
for stone in dimmest_first(stones)[:3]:
    print(f"  {stone['stone']} ({stone['keeper']}), glow {stone['glow']}")`;

const S15 = r`# From the lanterns' rune (Pip copied it in): your loader and sorter.
` + LOADER + r`

def clock(minutes):
    hours, mins = divmod(21 * 60 + minutes, 60)
    return f"{hours % 24:02}:{mins:02}"

def lighting_round(stones, minutes):
    now = 0
    for stone in dimmest_first(stones):
        home = now + 2 * stone["walk"] + 5
        if home > minutes:
            continue
        yield now + stone["walk"] + 5, stone["stone"], stone["keeper"]
        now = home

stones, smudged = load_stones("stones.csv")
round_trip = list(lighting_round(stones, 120))
with open("night_plan.txt", "w") as f:
    for minute, stone, keeper in round_trip:
        f.write(f"{clock(minute)} {stone} ({keeper})\n")
lit = [stone for minute, stone, keeper in round_trip]
left = [s["keeper"] for s in stones if s["stone"] not in lit]
print(f"{len(round_trip)} stones on the round.")
print("Relighting their own: " + ", ".join(left))`;

const RUNES = [
  "# Ysolde's runes: each rune, then the runes it is built on.",
  "# (A rune built on nothing doesn't always get a line of its own.)",
  "",
  "loops: if, variables",
  "functions: loops,variables",
  "lists: variables",
  "if: comparisons",
  "comparisons:  variables",
  "variables: print",
  "",
  "dictionaries: lists, functions",
  "files: loops, strings",
  "strings: print",
  "classes: functions, dictionaries",
  "recursion: functions, if",
  "generators: loops, functions",
  "great rune: recursion, generators, classes, files",
  "",
].join("\n");

const S16 = r`needs = {}
with open("runes.txt") as f:
    for line in f:
        line = line.strip()
        if line == "" or line.startswith("#"):
            continue
        rune, bases = line.split(":")
        needs[rune.strip()] = [b.strip() for b in bases.split(",") if b.strip() != ""]

taught = []

def teach(rune):
    if rune in taught:
        return
    for base in needs.get(rune, []):
        teach(base)
    taught.append(rune)

def depth(rune):
    bases = needs.get(rune, [])
    if bases == []:
        return 1
    return 1 + max(depth(b) for b in bases)

for rune in needs:
    teach(rune)

with open("great_rune.txt", "w") as f:
    for rune in taught:
        f.write(rune + "\n")

print(f"{len(taught)} runes taught. The great rune lies {depth('great rune')} runes deep.")`;

export const OBSERVATORY: Building = {
  id: "observatory",
  name: "The Observatory",
  blurb: "On the north hill, where the Great Rune sleeps.",
  opening: [
    "Rook: Road's clear, recruit, right to the top of the north hill. Took the whole guild and most of a week, and the Hush sat up there watching us the entire time, like a cat on a fence.",
    "Rook: Funny thing at the summit. A ring of old survey stakes, still standing, and a flat stone with a drawing on it, held down by four pebbles. The pebbles were warm.",
    "...Warm. Yes. They would be.",
    "That's Ysolde's observatory. The plan for it, anyway. She drew it the spring before the Long Quiet, and she never got to build it. The Hush came down off that hill first.",
    "I can't come up with you. I never could. Don't ask why, not yet. I'll tell you before the end, I promise. Ssso. Before the end.",
    "We'll build it the way we've built everything: you speak, the stone builds, and I sit here being supportive. Very supportive. Maximum support.",
    "This last building needs the last of the Old Tongue: how to **search**, how to **sort**, functions that call **themselves**, and **generators** that hand things out one at a time. And then a program bigger than any we've written. Let's build The Observatory.",
  ],
  finale: [
    "It's lit. The Great Rune is burning on the north hill like a second moon, and every stone in the valley is answering it. The tavern. The mill. The bell's ringing all on its own. Can you hear it?",
    "And the Hush is lifting. Look at the hill now: grass, rocks, a view. It was always just a hill. It only needed someone to speak up there.",
    "Oh. Oh! I'm sliding. I'm off the stone. My tail is on the grass. Real grass! Nobody told me grass was wet. It's wonderful. It's cold. It's wonderful!",
    "Bram: Pip? You're off your rock!",
    "Wren: PIP'S OFF THE ROCK! Everyone! Come and look!",
    "Rook: Steady, all of you. Give the serpent a moment. Three hundred years is a long time to sit still.",
    "She bound me to wait for a speaker. Not one who borrowed the words, but one who learned them, out loud, wrong and then right, and passed them on. That's you. Every one of those years was worth it.",
    "Thistle: By the powers vested in me by eight voters and one serpent, I declare this valley... Pip, you say it. You've earned it.",
    "Willowmere has its voice back. This is **Rune Town**! And now, if nobody minds, I have a valley to see. All of it. All at once. I'll be very tired. Walk with me tomorrow?",
  ],
  chatDuring: [
    "Is it tall yet? Describe it. No, use more words. Use all the words.",
    "I'm not looking at the north hill. I'm looking near the north hill. It's different.",
    "Every rune you speak up there, my scales go warm. I used to think that was the sun.",
  ],
  chatAfter: [
    "Did you know the grass behind the tavern is softer than the grass by the pond? I know that now. I know so many things now.",
    "The lens never sleeps. Some nights I lie on the terrace and let it light me up. Purely for warmth. Not at all for showing off.",
    "A language lives while it's taught. I've decided to teach the village children. Mostly indentation. I'm very firm about indentation.",
  ],
  chronicle: {
    title: "Written by You",
    text: [
      "This is the last page I will write, and the first that is not mine. If you are reading it, the lens is lit, my small friend is off the stone, and this book belongs to you.",
      "I kept the Old Tongue the way a miser keeps gold, and so did the others, and that is how we lost it. You did the opposite. You learned it with your hands, out loud, wrong and then right, and you taught it to a cook and a miller and a mayor without ever once calling it teaching. That is how a language comes back: not in a vault, but in a village.",
      "Look after Pip. Pip will tell you that Pip is looking after you. Let them.",
      "The rest of this page is yours. Write what you built, and who you built it with, and what you would tell the next speaker who comes over the east ridge with a deed and no idea what they are doing. They will come. Someone always does.",
      "*Here the handwriting stops, and the page waits for yours.*",
    ],
  },
  challenges: [
    {
      id: "o01-survey-ring",
      part: "Survey ring and plan",
      title: "Ysolde's Survey Ring",
      topic: "linear search",
      cost: { wood: 6, stone: 2 },
      intro: [
        "Rook was right: a ring of survey stakes at the top of the hill, and under four warm pebbles, Ysolde's plan. A round tower, a dome, and stars. So many stars.",
        "Every stake has a star's name painted on it, in order round the ring. Her note says the centre peg lines up with the **Heron** stake. But which stake is the Heron? Some names turn up twice, and some stars on her plan never got a stake at all.",
        "Looking through a list one item at a time until you find the one you want is a **linear search**, the oldest search there is. She always drew the stars first, you know. I mean. I'd imagine she did.",
      ],
      codex: ["searching"],
      quiz: {
        code: r`def has_ash(row):
    for tree in row:
        if tree == "ash":
            return True
        return False

print(has_ash(["oak", "ash"]))`,
        question: "What does this program show?",
        options: ["False", "True", "None", "oak"],
        answer: 0,
        why: "Sneaky! return False is inside the loop, so the function gives up after checking only the first tree. The \"not found\" answer belongs after the loop, once every tree has been checked.",
      },
      task: [
        "Write a function `find_stake(stakes, name)` that gives back the **position** of the first stake with that name. Positions count from 0, like list indexes.",
        "If no stake has that name, give back -1. Ysolde used -1 for \"not on the ring\", because no real position is ever -1.",
        "Do the looking yourself, one stake at a time. (`.index()` would do it for you, but this whole building is about how searching works.)",
        "Then use it to report where the Heron stake stands, and whether the Comet from her plan is on the ring at all.",
      ],
      starter: r`# The names painted on the survey stakes, in order round the ring.
stakes = ["Kettle", "Lantern", "Thimble", "Acorn", "Heron", "Bellwether",
          "Wheel", "Lamb", "Heron", "Ember", "Plough", "Willow"]

# find_stake(stakes, name): the first stake with that name, or -1.


# Where does the Heron stake stand? Is the Comet on the ring?
`,
      tests: PRE + r`check(".index(" not in src, "Nice try! .index() does the searching for you. Walk the stakes yourself, one at a time: that's the whole lesson of this stake.")
ring = ["Ash", "Birch", "Cedar"]
got = call("find_stake", ring, "Ash")
check(got is not None, "find_stake gave back None. Does it return the position, or only print it?")
check(got == 0, "find_stake(['Ash', 'Birch', 'Cedar'], 'Ash') gave back " + _short(got) + ". Ash is the first stake, and Python counts from 0.")
got = call("find_stake", ring, "Cedar")
check(got == 2, "find_stake(['Ash', 'Birch', 'Cedar'], 'Cedar') gave back " + _short(got) + ", but Cedar is at position 2. Does your search give up before it reaches the last stake?")
got = call("find_stake", ring, "Rowan")
check(got is not None, "When the name isn't on the ring, find_stake gave back None. Once every stake has been checked and none matched, give back -1.")
check(got == -1, "find_stake(['Ash', 'Birch', 'Cedar'], 'Rowan') gave back " + _short(got) + ", but Rowan isn't on the ring at all, so the answer is -1.")
got = call("find_stake", ["Oak", "Elm", "Oak", "Elm"], "Elm")
check(got == 1, "Two stakes can share a name. find_stake(['Oak', 'Elm', 'Oak', 'Elm'], 'Elm') should give back 1, the first Elm, but gave back " + _short(got) + ". Stop looking the moment you find one.")
got = call("find_stake", [], "Oak")
check(got == -1, "An empty ring has no stakes at all, so find_stake([], 'Oak') should give back -1, not " + _short(got) + ".")
check(any("Heron" in l and 4 in _nums(l) for l in lines), "Now print a line about the Heron stake that says where it stands (ask find_stake).")
check(any("Comet" in l for l in lines), "Print a line about the Comet too: is it on the ring?")`,
      hints: [
        "Imagine walking round the ring with your finger on each stake in turn. What do you need to know at every stake? When can you stop walking, and what do you say if you get all the way round?",
        "`enumerate` hands you each position and item together, and `return` leaves the function the moment it runs, even from inside a loop. So any line placed **after** the loop only runs if the loop never found anything.",
        "`for i, stake in enumerate(stakes):` / `    if stake == name:` / `        return ___` and then, after the loop (lined up with `for`, not inside it), `return -1`.",
      ],
      solution: S01,
      wrong: [
        mistake(S01, ["    for i, stake in enumerate(stakes):\n        if stake == name:\n            return i\n    return -1", "    if name in stakes:\n        return stakes.index(name)\n    return -1"]),
        mistake(S01, ["            return i\n    return -1", "            return i\n        else:\n            return -1"]),
        mistake(S01, ["            return i\n    return -1", "            return i"]),
        mistake(S01, ["    for i, stake in enumerate(stakes):\n        if stake == name:\n            return i\n    return -1", "    spot = -1\n    for i, stake in enumerate(stakes):\n        if stake == name:\n            spot = i\n    return spot"]),
        mistake(S01, ["    for i, stake in enumerate(stakes):\n        if stake == name:\n            return i\n    return -1", "    count = 1\n    for stake in stakes:\n        if stake == name:\n            return count\n        count += 1\n    return -1"]),
        mistake(S01, ["            return i\n    return -1", "            print(i)\n            return\n    print(-1)"]),
      ],
      done: "The centre peg is in, lined up with the Heron, just as she drew it. Ysolde always said a good search knows when to stop. Said. Would have said. Probably.",
    },
    {
      id: "o02-first-clear-star",
      part: "Stairs and terrace",
      title: "The First Clear Star",
      topic: "searching with a condition",
      cost: { wood: 2, stone: 6 },
      intro: [
        "Next: stone stairs up the mound, and a flagstone terrace to stand on. In the corner of the plan, in tiny writing: *Lay the terrace by the light of the first clear star.*",
        "Tonight's stars rise one after another, but the Hush drifts in front of some of them. She wanted the first star that glows brightly enough **and** isn't hidden by the fog.",
        "Still a search, but now we're not hunting for a name. We're hunting for the first thing that passes a test. And if nothing passes, Python has a word for \"nothing at all\": `None`.",
      ],
      codex: ["searching"],
      quiz: {
        code: r`def first_long(words):
    for w in words:
        if len(w) > 4:
            return w

print(first_long(["fog", "mist"]))`,
        question: "What does this program show?",
        options: ["None", "mist", "-1", "(nothing)"],
        answer: 0,
        why: "Neither word is longer than 4 letters, so the loop ends without returning. A function that reaches its end without a return gives back None, and print shows it as None.",
      },
      task: [
        "Each star in the sky list is a tuple: its name, how brightly it glows, and `True` if the Hush is in front of it. The list is in the order the stars rise.",
        "Write `first_clear(sky, limit)`: give back the **name** of the first star that glows more brightly than `limit` and isn't hidden.",
        "If no star fits, give back `None`. (Not -1: there's no position here, just no star.)",
        "Ysolde's plan wants a glow above 6. Print which star the terrace is laid by.",
      ],
      starter: r`# Tonight's sky, in the order the stars rise: (name, glow, hidden by the Hush?)
sky = [("Kettle", 4, False), ("Heron", 9, True), ("Lantern", 6, False),
       ("Ember", 8, True), ("Thimble", 7, False), ("Wheel", 10, False)]

# first_clear(sky, limit): the name of the first clear star glowing more than limit, or None.


# Which star is the terrace laid by?
`,
      tests: PRE + r`got = call("first_clear", [("Ash", 5, False), ("Birch", 9, False)], 6)
check(got is not None, "first_clear gave back None, but Birch glows 9 and nothing hides it. Does your search stop too early, or only print the name?")
check(not isinstance(got, tuple), "first_clear gave back the whole tuple " + _short(got) + ". Give back just the star's name.")
check(got == "Birch", "With a limit of 6, first_clear([('Ash', 5, False), ('Birch', 9, False)], 6) should find Birch, but gave back " + _short(got) + ".")
got = call("first_clear", [("Ash", 9, True), ("Birch", 8, False)], 6)
check(got == "Birch", "Ash is bright, but the Hush is in front of it (its third value is True), so nobody can lay a terrace by it. Expected Birch, got " + _short(got) + ".")
got = call("first_clear", [("Ash", 6, False), ("Birch", 7, False)], 6)
check(got == "Birch", "Ash glows exactly 6. The plan wants more than the limit, so exactly 6 isn't enough. Expected Birch, got " + _short(got) + ".")
got = call("first_clear", [("Ash", 9, False), ("Birch", 10, False)], 6)
check(got == "Ash", "Both stars fit, and Ash rises first, so the answer is Ash, not " + _short(got) + ". Stop at the first star that fits.")
got = call("first_clear", [("Ash", 3, False), ("Birch", 9, True)], 6)
check(got != -1, "No star fits, and first_clear gave back -1. -1 is for \"no position in a list\", but here we mean \"no star at all\": None.")
check(got is None, "No star in that sky fits, so first_clear should give back None, not " + _short(got) + ".")
got = call("first_clear", [], 6)
check(got is None, "An empty sky has no stars, so first_clear([], 6) should give back None, not " + _short(got) + ".")
check("Thimble" in out, "Print which star the terrace is laid by: ask first_clear, with Ysolde's limit of 6.")`,
      hints: [
        "For each star, ask two questions at once: is it bright enough, and can we see it? You want the first star where both answers are yes. What should the function say when it has looked at every star and none passed?",
        "Unpack each tuple right in the `for` line: `for fruit, weight, bruised in basket:`. Two tests that must both be true join with `and`, and `not` flips True and False. A `return` inside the loop stops at the first match.",
        "`for name, glow, hidden in sky:` / `    if glow > limit and ___:` / `        return name`, then `return None` after the loop.",
      ],
      solution: S02,
      wrong: [
        mistake(S02, ["if glow > limit and not hidden:", "if glow > limit:"]),
        mistake(S02, ["if glow > limit and not hidden:", "if glow >= limit and not hidden:"]),
        mistake(S02, ["    for name, glow, hidden in sky:\n        if glow > limit and not hidden:\n            return name\n    return None", "    best = None\n    for name, glow, hidden in sky:\n        if glow > limit and not hidden:\n            best = name\n    return best"]),
        mistake(S02, ["    return None", "    return -1"]),
        mistake(S02, ["    for name, glow, hidden in sky:\n        if glow > limit and not hidden:\n            return name", "    for star in sky:\n        if star[1] > limit and not star[2]:\n            return star"]),
        mistake(S02, ["            return name\n    return None", "            return name\n        else:\n            return None"]),
      ],
      done: "The stairs are set and the terrace is flat, laid by Thimble-light, just as she wanted. Don't ask how I know she'd want that. I'm a good guesser. Suspiciously good, some might say. Nobody say it.",
    },
    {
      id: "o03-catalogue",
      part: "Plinth and floor",
      title: "Ysolde's Catalogue",
      topic: "binary search",
      cost: { wood: 1, stone: 8 },
      intro: [
        "Digging for the plinth, the stone struck something: a lead box, and inside it Ysolde's star catalogue. A thousand stars, each with a number, written out from the smallest number to the largest.",
        "One star at a time, that's all night. But the catalogue is **in order**, and that changes everything: open it in the middle. If your star's number is bigger than the middle one, it can't be anywhere in the first half. Throw that half away, and do it again with what's left.",
        "That's a **binary search**. Every look throws away half of what's left, so a thousand stars take about ten looks. Ten! The rune counts your looks this time, so no reading every page.",
      ],
      codex: ["binary-search", "searching"],
      quiz: {
        code: r`low = 0
high = 9
mid = (low + high) // 2
print(mid)`,
        question: "What does this program show?",
        options: ["4", "4.5", "5", "9"],
        answer: 0,
        why: "9 // 2 is 4: floor division drops the half. That's handy, because a position in a list must be a whole number.",
      },
      task: [
        "Write `find_number(catalogue, number)`: give back the position of `number` in the catalogue, or -1 if Ysolde never catalogued it.",
        "The catalogue is always in order, smallest first. Use that: every look should rule out half of the stars still in play.",
        "The rune will hand it a thousand-star catalogue and count every look. A couple of dozen is plenty; walking the list from the front isn't allowed.",
        "Then print where each star in `tonight` is in the catalogue, or say that it isn't there.",
      ],
      starter: r`import random
random.seed(1300)      # Ysolde's catalogue: the same thousand stars every time
catalogue = sorted(random.sample(range(1, 10000), 1000))

tonight = [6562, 4001, 9990, 6]   # stars to look up tonight

# find_number(catalogue, number): the star's position, or -1.


# Where is each of tonight's stars?
`,
      tests: PRE + r`import random as _random
_g = _random.Random(2024)
cat = sorted(_g.sample(range(1, 50000), 1000))
for spot in [500, 0, 999, 377, 1, 640]:
    book = Counted(cat)
    got = call("find_number", book, cat[spot])
    check(not book.walked, "find_number went through the catalogue from the front (a for loop, in, or .index all do that). The catalogue is in order, so open it in the middle and throw half away instead.")
    check(got is not None, "find_number gave back None for star " + str(cat[spot]) + ", which is in the catalogue. Return its position.")
    check(got != -1, "find_number said star " + str(cat[spot]) + " isn't catalogued, but it is, at position " + str(spot) + ". Check which half you throw away, and remember that when low and high meet, one star is still in play.")
    check(got == spot, "find_number found star " + str(cat[spot]) + " at position " + _short(got) + ", but it's at position " + str(spot) + ".")
    check(book.looks <= 40, "find_number found star " + str(cat[spot]) + ", but it looked inside the catalogue " + str(book.looks) + " times. Each look should throw away half of what's left, so a thousand stars need about ten.")
gap = next(n for n in range(cat[300], cat[700]) if n not in cat)
for missing in [0, gap, 60000]:
    book = Counted(cat)
    got = call("find_number", book, missing)
    check(not book.walked, "find_number went through the catalogue from the front to check for a missing star. Halving works for missing stars too: when there's nothing left in play, the star isn't there.")
    check(got is not None, "Star " + str(missing) + " isn't in the catalogue, and find_number gave back None. Give back -1 for a star that isn't there.")
    check(got == -1, "Star " + str(missing) + " isn't in the catalogue, so find_number should give back -1, not " + _short(got) + ".")
    check(book.looks <= 40, "Star " + str(missing) + " isn't in the catalogue, and find_number took " + str(book.looks) + " looks to be sure. Halving should settle it in about ten.")
got = call("find_number", Counted([]), 5)
check(got == -1, "An empty catalogue has no stars, so find_number([], 5) should give back -1, not " + _short(got) + ".")
got = call("find_number", Counted([5]), 5)
check(got == 0, "find_number([5], 5) should give back 0, but gave back " + _short(got) + ". With one star, low and high start at the same place, and that star still needs a look.")
got = call("find_number", Counted([5]), 4)
check(got == -1, "find_number([5], 4) should give back -1, not " + _short(got) + ".")
got = call("find_number", Counted([3, 8]), 8)
check(got == 1, "find_number([3, 8], 8) should give back 1, not " + _short(got) + ".")
for star, spot in [(6562, 641), (9990, 999), (6, 0)]:
    check(any(star in _nums(l) and spot in _nums(l) for l in lines), "Print a line for star " + str(star) + " from tonight's list that says where it is in the catalogue.")
check(any(4001 in _nums(l) for l in lines), "Print a line for star 4001 from tonight's list too, saying whether it's in the catalogue.")`,
      hints: [
        "Play it on paper with ten numbers: 2 5 8 12 16 23 38 56 72 91. Find 23. Which number do you look at first? What can you cross out after that one look? What's left to look at when you can cross out everything?",
        "Keep two markers for the part still in play, `low` and `high`, starting at the two ends. While anything is still in play (`low <= high`), look at the middle position, `(low + high) // 2`. If the star there is too small, yours must be after it; too big, before it. Move one marker past the middle.",
        "Inside `while low <= high:` work out `mid = (low + high) // 2`. If `catalogue[mid] == number`, return mid; elif `catalogue[mid] < number`, `low = ___`; else `high = ___`. After the loop, return -1.",
      ],
      solution: S03,
      wrong: [
        mistake(S03, ["    low = 0\n    high = len(catalogue) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if catalogue[mid] == number:\n            return mid\n        elif catalogue[mid] < number:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1", "    for i, star in enumerate(catalogue):\n        if star == number:\n            return i\n    return -1"]),
        mistake(S03, ["    low = 0\n    high = len(catalogue) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if catalogue[mid] == number:\n            return mid\n        elif catalogue[mid] < number:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1", "    i = 0\n    while i < len(catalogue):\n        if catalogue[i] == number:\n            return i\n        i += 1\n    return -1"]),
        mistake(S03, ["while low <= high:", "while low < high:"]),
        mistake(S03, ["            low = mid + 1", "            low = mid"], ["tonight = [6562, 4001, 9990, 6]", "tonight = [6562]"]),
        mistake(S03, ["            high = mid - 1\n    return -1", "            high = mid - 1"]),
        mistake(S03, ["    low = 0\n", "    if number not in catalogue:\n        return -1\n    low = 0\n"]),
      ],
      done: "A thousand stars, and every one found in ten looks or so. Floor's down, plinth's in. Ysolde would have... well. She'd have been pleased. Mind the lead box. It's heavy, and it's hers.",
    },
    {
      id: "o04-counting-looks",
      part: "Lower walls",
      title: "Ten Looks or Five Hundred",
      topic: "counting steps",
      cost: { wood: 0, stone: 9 },
      intro: [
        "The lower walls are going up, and Odo has come puffing up the hill with a book under each arm. He heard about binary search and thinks it sounds like cheating.",
        "Odo: My dear founder, I have searched shelves one book at a time for thirty-one years. If there is a quicker way, I demand to see the numbers. Gently. With footnotes.",
        "Let's give him numbers. Teach both searches to count how many stars they look at, then race them on the same catalogue. A function can hand back two things at once: `return spot, looks` gives back a tuple.",
      ],
      codex: ["binary-search", "searching"],
      quiz: {
        code: r`looks = 0
for n in [4, 8, 15, 16]:
    looks += 1
    if n == 15:
        break
print(looks)`,
        question: "What does this program show?",
        options: ["3", "4", "2", "15"],
        answer: 0,
        why: "The count goes up before the check, so 4, 8 and 15 are each counted, and break stops the loop at 15. Three looks.",
      },
      task: [
        "Write `linear_looks(catalogue, number)` and `binary_looks(catalogue, number)`. Each searches in its own way and gives back two things: the position (or -1) **and** how many stars it looked at.",
        "A look is one star you compared with `number`. Linear search starts at the front; binary search halves, like on the plinth.",
        "Race them on every star in `tonight`: print each star's two counts side by side, then how many looks halving saved, all of tonight's stars together.",
      ],
      starter: r`import random
random.seed(1300)      # Ysolde's catalogue again
catalogue = sorted(random.sample(range(1, 10000), 1000))

tonight = [6, 5246, 9990, 4002, 1334]

# linear_looks(catalogue, number) -> (position or -1, looks)
# binary_looks(catalogue, number) -> (position or -1, looks)


# The race, and the looks saved.
`,
      tests: PRE + r`import random as _random
_g = _random.Random(99)
cat = sorted(_g.sample(range(1, 30000), 1000))
for spot in [0, 1, 456, 999]:
    got = call("linear_looks", Counted(cat), cat[spot])
    check(isinstance(got, tuple) and len(got) == 2, "linear_looks should give back two things, the position and the number of looks (return a, b gives back both). It gave back " + _short(got) + ".")
    where, looks = got
    check(where == spot, "linear_looks found star " + str(cat[spot]) + " at position " + _short(where) + ", but it's at position " + str(spot) + ".")
    check(looks == spot + 1, "Star " + str(cat[spot]) + " is at position " + str(spot) + ", so a search from the front takes " + str(spot + 1) + " looks to reach it (the star at position 0 counts as a look too), but linear_looks said " + _short(looks) + ".")
got = call("linear_looks", Counted(cat), 30001)
check(isinstance(got, tuple) and len(got) == 2, "linear_looks should give back two things even when the star is missing: -1 and the number of looks.")
where, looks = got
check(where == -1, "Star 30001 isn't in that catalogue, so linear_looks should give back -1 as the position, not " + _short(where) + ".")
check(looks == 1000, "To be sure a star is missing, a linear search has to look at every one of the 1000 stars, but linear_looks said " + _short(looks) + ".")
gap = next(n for n in range(cat[200], cat[800]) if n not in cat)
for target, spot in [(cat[500], 500), (cat[0], 0), (cat[999], 999), (cat[731], 731), (gap, -1), (0, -1)]:
    book = Counted(cat)
    got = call("binary_looks", book, target)
    check(isinstance(got, tuple) and len(got) == 2, "binary_looks should give back two things, the position and the number of looks. It gave back " + _short(got) + ".")
    where, looks = got
    check(not book.walked, "binary_looks went through the catalogue from the front. Halve it, like on the plinth.")
    check(where == spot, "binary_looks(catalogue, " + str(target) + ") gave back position " + _short(where) + ", but the right answer is " + str(spot) + ".")
    check(looks == len(book.seen), "binary_looks counted " + _short(looks) + " looks, but it really checked " + str(len(book.seen)) + " different stars. Count one look each time a middle star is checked, no more, no less.")
    check(looks <= 11, "binary_looks took " + str(looks) + " looks in a thousand-star catalogue. Halving needs about ten.")
def _saved(nums):
    total = 0
    for n in nums:
        total += ns["linear_looks"](ns["catalogue"], n)[1] - ns["binary_looks"](ns["catalogue"], n)[1]
    return total
for star in [6, 5246, 9990, 4002, 1334]:
    check(any(star in _nums(l) for l in lines), "Print a line for star " + str(star) + " with its two counts.")
check(_saved([6, 5246, 9990, 4002, 1334]) in _nums(out), "Print how many looks halving saved: for every star tonight, the linear looks minus the binary looks, added together.")
vns, vlines = again(("tonight = [6, 5246, 9990, 4002, 1334]", "tonight = [76, 4001, 9990]"))
check(_saved([76, 4001, 9990]) in _nums(" ".join(vlines)), "With another night's stars, the looks saved didn't come out right. Add up the difference for whatever stars are in tonight, rather than typing a number.")`,
      hints: [
        "Take your search from the plinth and give it a tally: a number that starts at 0 and goes up by one every time the search looks at a star. Where in each loop does a look actually happen? And for the race: what do you do with the two counts for each star?",
        "Return two values with a comma and unpack them the same way: `return found, tries` … `where, tries = guess_game(jar, 40)`. For the total, a running sum that grows by each star's difference, like any accumulator.",
        "In `binary_looks`, put `looks += 1` right where a middle star gets checked, and finish with `return mid, looks` or `return -1, looks`. In `linear_looks`, a star found at position i took ___ looks. Then `saved += slow - fast` for each star.",
      ],
      solution: S04,
      wrong: [
        mistake(S04, ["    looks = 0\n    for i, star in enumerate(catalogue):\n        looks += 1\n        if star == number:", "    looks = 0\n    for i, star in enumerate(catalogue):\n        if star == number:"], ["            return i, looks\n    return -1, looks", "            return i, looks\n        looks += 1\n    return -1, looks"]),
        mistake(S04, ["            return i, looks\n    return -1, looks", "            return i, looks\n    return -1, 0"]),
        mistake(S04, ["            return mid, looks", "            return mid, 1"], ["            high = mid - 1\n    return -1, looks", "            high = mid - 1\n    return -1, 1"]),
        mistake(S04, ["    high = len(catalogue) - 1\n    looks = 0", "    high = len(catalogue) - 1\n    looks = 1"]),
        mistake(S04, ["            return mid, looks", "            return looks"], ["            high = mid - 1\n    return -1, looks", "            high = mid - 1\n    return looks"], ["    spot, fast = binary_looks(catalogue, star)", "    fast = binary_looks(catalogue, star)"]),
        mistake(S04, ["    saved += slow - fast", "    saved += slow"]),
        mistake(S04, ["print(f\"Halving saved {saved} looks tonight.\")", "print(\"Halving saved 1945 looks tonight.\")"]),
      ],
      done: "Odo: Ten looks against hundreds! I shall have to rewrite chapter six. And seven. Possibly the whole index. Don't tell my publisher. I don't have a publisher. Don't tell them anyway.",
    },
    {
      id: "o05-heaviest-first",
      part: "Upper walls and floor",
      title: "Heaviest Stones First",
      topic: "selection sort",
      cost: { wood: 4, stone: 6 },
      intro: [
        "The upper walls rise to the cap course, and Ingrid has hauled up the stones herself. Each one has its weight chalked on it.",
        "Ingrid: Heaviest at the bottom, lightest at the top, or the cap course sits on a wobble. I'd just use `sorted`, but Pip says the old speakers sorted by hand and that's the point.",
        "It is the point! Sorting by hand is how you learn what `sorted` does behind your back. The simplest way: find the heaviest stone and put it in the first place. Then find the heaviest of the rest and put it in the second place. And so on. That's a **selection sort**.",
      ],
      codex: ["sorting-algorithms"],
      quiz: {
        code: r`row = [3, 1, 2]
row[0], row[1] = row[1], row[0]
print(row)`,
        question: "What does this program show?",
        options: ["[1, 3, 2]", "[3, 1, 2]", "[1, 1, 2]", "[2, 1, 3]"],
        answer: 0,
        why: "Python works out the whole right side first (1 and 3), then stores both at once. So the two items swap places, with no temporary variable needed.",
      },
      task: [
        "Write `heaviest_first(stones)`: put the list of weights in order from heaviest to lightest. Change the list itself (the wall uses this very pile); don't make a new one.",
        "Sort it the selection way: each place in the row, from the first, gets the heaviest stone not yet placed, swapped into it. No `sort` or `sorted` here.",
        "A selection sort moves each stone at most once. The rune hands you its own pile and watches how often stones change places.",
        "Then sort the starter's stones and print them.",
      ],
      starter: r`stones = [38, 51, 29, 64, 47, 55, 33, 60]   # weights chalked on the stones

# heaviest_first(stones): heaviest to lightest, sorting this very list by hand.


# Sort the pile and print it.
`,
      tests: PRE + r`check(".sort(" not in src and "sorted(" not in src, "No sort or sorted for this one: the stones get sorted by your own hands, so you can see how sorting works.")
def _try(items):
    pile = Counted(items)
    got = call("heaviest_first", pile)
    return list(pile), got
start = [5, 2, 9, 1, 7]
pile, got = _try(start)
check(not (pile == start and isinstance(got, list) and got != start), "heaviest_first gave back a new, sorted list, but the pile itself didn't change. Sort the list you were given, by swapping stones inside it.")
check(pile != [1, 2, 5, 7, 9], "That's lightest first. The wall wants the heaviest stone in the first place.")
check(pile == [9, 7, 5, 2, 1], "After heaviest_first, the pile [5, 2, 9, 1, 7] became " + _short(pile) + ", but heaviest to lightest is [9, 7, 5, 2, 1].")
for items in [[4, 8, 4, 8, 1], [1, 9], [3], [], [1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1]]:
    pile, got = _try(items)
    want = sorted(items, reverse=True)
    check(pile == want, "After heaviest_first, the pile " + _short(items) + " became " + _short(pile) + ", but heaviest to lightest is " + _short(want) + ".")
import random as _random
_g = _random.Random(12)
items = [_g.randint(20, 90) for _ in range(12)]
pile = Counted(items)
call("heaviest_first", pile)
check(pile.moves <= 2 * len(items), "Your sort works, but stones changed places " + str(pile.moves) + " times in a pile of 12. A selection sort hunts for the heaviest stone left, and only then swaps it into place: one swap per place in the row.")
check(any("64" in l and "29" in l for l in lines), "Print the starter's stones after sorting them.")
check(lines and lines[-1].find("64") < lines[-1].find("29"), "Print the stones after heaviest_first has sorted them.")`,
      hints: [
        "Do it with real things first: five cards with numbers on them. Find the biggest and swap it into the far-left place. Now ignore that place and repeat with the rest. How many times do you repeat? While you hunt for the biggest, what do you need to remember about it?",
        "Two loops: the outer one walks the places in the row, the inner one hunts from that place to the end. Remember the **position** of the best stone so far, not only its weight, or you won't know where to swap from. `row[a], row[b] = row[b], row[a]` swaps two places.",
        "`for i in range(len(stones)):` / `    best = i` / `    for j in range(i + 1, len(stones)):` / `        if stones[j] > stones[best]:` / `            best = ___` and then, after the inner loop, swap places `i` and `best`.",
      ],
      solution: S05,
      wrong: [
        mistake(S05, ["    for i in range(len(stones)):\n        best = i\n        for j in range(i + 1, len(stones)):\n            if stones[j] > stones[best]:\n                best = j\n        stones[i], stones[best] = stones[best], stones[i]", "    for i in range(len(stones)):\n        for j in range(len(stones) - 1):\n            if stones[j] < stones[j + 1]:\n                stones[j], stones[j + 1] = stones[j + 1], stones[j]"]),
        mistake(S05, ["    for i in range(len(stones)):\n        best = i\n        for j in range(i + 1, len(stones)):\n            if stones[j] > stones[best]:\n                best = j\n        stones[i], stones[best] = stones[best], stones[i]", "    stones.sort(reverse=True)"]),
        mistake(S05, ["    for i in range(len(stones)):\n        best = i\n        for j in range(i + 1, len(stones)):\n            if stones[j] > stones[best]:\n                best = j\n        stones[i], stones[best] = stones[best], stones[i]", "    left = stones[:]\n    row = []\n    while left:\n        heavy = max(left)\n        left.remove(heavy)\n        row.append(heavy)\n    return row"], ["heaviest_first(stones)\nprint(stones)", "print(heaviest_first(stones))"]),
        mistake(S05, ["if stones[j] > stones[best]:", "if stones[j] < stones[best]:"]),
        mistake(S05, ["        stones[i], stones[best] = stones[best], stones[i]", "        stones[i] = stones[best]\n        stones[best] = stones[i]"]),
        mistake(S05, ["for j in range(i + 1, len(stones)):", "for j in range(i + 1, len(stones) - 1):"]),
      ],
      done: "Ingrid: Heaviest at the bottom, lightest on the cap, and every stone moved once. That's a wall that'll still be standing when your grandchildren are arguing about who built it.",
    },
    {
      id: "o06-insertion-sort",
      part: "Front door",
      title: "Cards Under the Door",
      topic: "insertion sort",
      cost: { wood: 7, stone: 2 },
      intro: [
        "Ingrid has hung the door: night-blue planks, iron straps and a brass star. And people keep pushing star cards under it. Half the town is copying Ysolde's charts, and the cards arrive one at a time, almost in order, but not quite.",
        "When things arrive one by one, there's a better way: keep the cards you already have in order, and slide each new card into its place. Usually it hardly moves. That's an **insertion sort**, and it's how most people sort a hand of cards without thinking about it.",
        "The trick is to slide each new card in from the **back**, because that's where an almost-in-order card belongs.",
      ],
      codex: ["sorting-algorithms"],
      quiz: {
        code: r`hand = [2, 5, 9]
hand.insert(1, 4)
print(hand)`,
        question: "What does this program show?",
        options: ["[2, 4, 5, 9]", "[4, 2, 5, 9]", "[2, 5, 4, 9]", "[2, 5, 9, 4]"],
        answer: 0,
        why: "insert(1, 4) puts 4 at position 1 and shifts everything from there one place along.",
      },
      task: [
        "Write `slot_in(row, card)`. `row` is already in order, smallest first. Put `card` into its place in `row` (change `row` itself; there's nothing to give back).",
        "Look for the place starting from the back of the row: a card that belongs at the end should need only a look or two.",
        "Then write `insertion_sort(cards)`: give back a **new** list of the cards in order, built by slotting each card in turn into a row that starts empty. Leave `cards` as it was.",
        "No `sort` or `sorted`. Print the starter's cards, sorted.",
      ],
      starter: r`cards = [12, 15, 14, 20, 21, 19, 25, 30, 28, 33]   # the order they came under the door

# slot_in(row, card): put card into its place in the sorted row.

# insertion_sort(cards): a new sorted list, one card slotted in at a time.


# Print the cards, sorted.
`,
      tests: PRE + r`check(".sort(" not in src and "sorted(" not in src, "No sort or sorted for this one: you're building the sort yourself.")
_cmp = [0]
class Glow(int):
    def __lt__(self, o):
        _cmp[0] += 1
        return int.__lt__(self, o)
    def __gt__(self, o):
        _cmp[0] += 1
        return int.__gt__(self, o)
    def __le__(self, o):
        _cmp[0] += 1
        return int.__le__(self, o)
    def __ge__(self, o):
        _cmp[0] += 1
        return int.__ge__(self, o)
def G(xs):
    return [Glow(x) for x in xs]
row = G([2, 5, 9])
call("slot_in", row, Glow(7))
check(row != [2, 5, 9], "slot_in should put the card into row itself, but row is still [2, 5, 9]. (Making a new list doesn't change the old one.)")
check(row == [2, 5, 7, 9], "Slotting 7 into [2, 5, 9] should make [2, 5, 7, 9], but row became " + _short(row) + ".")
row = []
call("slot_in", row, Glow(4))
check(row == [4], "Slotting 4 into an empty row should make [4], but row became " + _short(row) + ".")
row = G([3, 6])
call("slot_in", row, Glow(1))
check(row == [1, 3, 6], "Slotting 1 into [3, 6] should make [1, 3, 6]: a card smaller than all the others goes right at the front. Row became " + _short(row) + ".")
row = G([3, 6])
call("slot_in", row, Glow(8))
check(row == [3, 6, 8], "Slotting 8 into [3, 6] should make [3, 6, 8]: a card bigger than all the others goes at the very end. Row became " + _short(row) + ".")
row = G([1, 4, 4, 9])
call("slot_in", row, Glow(4))
check(row == [1, 4, 4, 4, 9], "Slotting 4 into [1, 4, 4, 9] should make [1, 4, 4, 4, 9], but row became " + _short(row) + ".")
row = G(range(0, 80, 2))
_cmp[0] = 0
call("slot_in", row, Glow(100))
check(_cmp[0] <= 2, "slot_in put 100 in the right place in a row of 40 cards, but compared it with " + str(_cmp[0]) + " cards on the way. It belongs at the very end, so start looking from the back: one comparison should settle it.")
cards = G([5, 2, 8, 1])
got = call("insertion_sort", cards)
check(cards == [5, 2, 8, 1], "insertion_sort changed the cards it was given into " + _short(cards) + ". Build a new row and leave cards as it was.")
check(got is not None, "insertion_sort gave back None. Did you return the row?")
check(got == [1, 2, 5, 8], "insertion_sort([5, 2, 8, 1]) gave back " + _short(got) + ", not [1, 2, 5, 8].")
got = call("insertion_sort", [])
check(got == [], "insertion_sort([]) should give back an empty list, not " + _short(got) + ".")
got = call("insertion_sort", G([9, 7, 3, 3, 1]))
check(got == [1, 3, 3, 7, 9], "insertion_sort([9, 7, 3, 3, 1]) gave back " + _short(got) + ", not [1, 3, 3, 7, 9].")
_cmp[0] = 0
got = call("insertion_sort", G(range(30)))
check(got == list(range(30)), "insertion_sort of 30 cards already in order should give them back in the same order.")
check(_cmp[0] <= 90, "insertion_sort works, but 30 cards that were already in order took " + str(_cmp[0]) + " comparisons. Slotting each card in from the back, an in-order card needs just one look.")
check(any("12" in l and "33" in l and l.find("14") < l.find("15") for l in lines), "Print the starter's cards, sorted.")`,
      hints: [
        "Hold three cards in order, say 2 5 9, and slide a 7 in from the right-hand end. Which cards do you look at, and when do you stop? Now try it with a 1, and with a 10, and with an empty hand.",
        "`.insert(position, item)` puts an item into a list at a position and shifts the rest along, so the real job is finding the position. Start just past the end of the row and step left, as long as you're not at the front yet and the card just before that spot is bigger than the new one.",
        "`spot = len(row)` / `while spot > 0 and ___:` / `    spot -= 1` / `row.insert(spot, card)`. Then `insertion_sort` starts with `row = []`, slots every card in, and gives back `row`.",
      ],
      solution: S06,
      wrong: [
        mistake(S06, ["    spot = len(row)\n    while spot > 0 and row[spot - 1] > card:\n        spot -= 1", "    spot = 0\n    while spot < len(row) and row[spot] < card:\n        spot += 1"]),
        mistake(S06, ["    spot = len(row)\n    while spot > 0 and row[spot - 1] > card:\n        spot -= 1\n    row.insert(spot, card)", "    row.append(card)\n    row.sort()"]),
        mistake(S06, ["    spot = len(row)\n    while spot > 0 and row[spot - 1] > card:\n        spot -= 1\n    row.insert(spot, card)", "    for i in range(len(row)):\n        if row[i] > card:\n            row.insert(i, card)\n            return"]),
        mistake(S06, ["    row = []\n    for card in cards:\n        slot_in(row, card)\n    return row", "    row = []\n    for card in cards:\n        slot_in(row, card)\n    cards[:] = row\n    return cards"]),
        mistake(S06, ["        slot_in(row, card)\n    return row", "        slot_in(row, card)"]),
        mistake(S06, ["    row.insert(spot, card)", "    row = row[:spot] + [card] + row[spot:]\n    return row"]),
      ],
      done: "Every card in its place, and the late ones barely moved. And look at that door. Night-blue, with a brass star. She always said a door should look like the sky it opens onto. ...I'm told. I read it. Somewhere.",
    },
    {
      id: "o07-window-order",
      part: "Windows and buttresses",
      title: "Six Windows, Many Stars",
      topic: "sort keys",
      cost: { wood: 4, stone: 6 },
      intro: [
        "Six tall windows with leaded glass, and Ysolde wanted every one to face a constellation. Odo copied her window list from the charts, and it's jumbled.",
        "Her rule, in the margin: *by constellation, A to Z; within one constellation, the brightest star first; and if two glow the same, by name.* That's sorting by three things at once!",
        "`sorted` can do it if you give it a **key**: a function that turns each item into the thing to compare. If the key gives back a tuple, Python compares the first parts, and only looks at the next part when those are equal.",
      ],
      codex: ["sort-keys"],
      quiz: {
        code: r`print(sorted([(2, "b"), (1, "z"), (2, "a")]))`,
        question: "What does this program show?",
        options: ["[(1, 'z'), (2, 'a'), (2, 'b')]", "[(1, 'z'), (2, 'b'), (2, 'a')]", "[(2, 'a'), (2, 'b'), (1, 'z')]", "TypeError"],
        answer: 0,
        why: "Tuples compare part by part: 1 comes before 2, and between the two 2s the second parts decide, so 'a' comes before 'b'.",
      },
      task: [
        "Each star in the list is a dictionary with a `name`, a `constellation` and a `glow`.",
        "Write `window_order(stars)`: give back a list of just the star **names**, in Ysolde's order (her rule is above). Don't change the list you're given.",
        "Print the window order for the starter's stars, one name per line.",
      ],
      starter: r`stars = [
    {"name": "Crest", "constellation": "Heron", "glow": 9},
    {"name": "Lid", "constellation": "Kettle", "glow": 4},
    {"name": "Beak", "constellation": "Heron", "glow": 7},
    {"name": "Wick", "constellation": "Lantern", "glow": 6},
    {"name": "Spout", "constellation": "Kettle", "glow": 8},
    {"name": "Arch", "constellation": "Heron", "glow": 7},
    {"name": "Glass", "constellation": "Lantern", "glow": 6},
    {"name": "Handle", "constellation": "Kettle", "glow": 4},
    {"name": "Flame", "constellation": "Lantern", "glow": 10},
]

# window_order(stars): the names, in Ysolde's window order.


# Print the window order.
`,
      tests: PRE + r`def S(name, con, glow):
    return {"name": name, "constellation": con, "glow": glow}
chart = [S("Wren", "Heron", 5), S("Bell", "Anvil", 3), S("Crest", "Heron", 9), S("Moss", "Anvil", 7), S("Ash", "Heron", 5), S("Pike", "Comb", 1)]
copy = [dict(s) for s in chart]
got = call("window_order", chart)
check(chart == copy, "window_order changed the list it was given. Use sorted, which makes a new list, instead of .sort().")
check(isinstance(got, list), "window_order should give back a list of names, but gave back " + _short(got) + ".")
check(all(isinstance(g, str) for g in got), "window_order should give back just the names, but the list holds " + _short(got) + ".")
want = ["Moss", "Bell", "Pike", "Crest", "Ash", "Wren"]
check(got != ["Bell", "Moss", "Pike", "Wren", "Crest", "Ash"], "The constellations are in the right order, but within one constellation the brightest star goes first.")
check(got[:2] != ["Wren", "Crest"] and got[0] in ["Moss", "Bell"], "The constellations go A to Z: Anvil, then Comb, then Heron. window_order gave back " + _short(got) + ".")
check(got[:2] != ["Bell", "Moss"], "Within the Anvil, Moss (glow 7) is brighter than Bell (glow 3), so Moss goes first: brightest first.")
check(got[-2:] != ["Wren", "Ash"], "Ash and Wren both glow 5, so the rule's last part decides: by name, A to Z.")
check(got == want, "For that chart, window_order gave back " + _short(got) + ", but Ysolde's rule gives " + _short(want) + ".")
chart = [S("Tarn", "Ox", 2), S("Hob", "Lute", 8), S("Fen", "Ox", 2), S("Dart", "Lute", 9), S("Gale", "Ox", 6)]
got = call("window_order", chart)
check(got == ["Dart", "Hob", "Gale", "Fen", "Tarn"], "For another chart, window_order gave back " + _short(got) + ", which doesn't follow Ysolde's rule.")
order = ["Crest", "Arch", "Beak", "Spout", "Handle", "Lid", "Flame", "Glass", "Wick"]
spots = [out.find(n) for n in order]
check(all(s >= 0 for s in spots) and spots == sorted(spots), "Print the starter's stars in window order, one name per line.")`,
      hints: [
        "Say Ysolde's rule out loud for any two stars: which goes first, and which part of the rule decided it? The rule has three parts, and each one only matters when the parts before it are tied.",
        "A key function can give back a tuple: `def by_shelf(book): return (book[\"shelf\"], book[\"title\"])`. To flip the order of one **number** inside the tuple, give back its negative: then the biggest sorts first.",
        "`def ysolde_key(star): return (star[\"constellation\"], ___, star[\"name\"])`, then a list comprehension over `sorted(stars, key=ysolde_key)` that keeps each star's name.",
      ],
      solution: S07,
      wrong: [
        mistake(S07, ["    return (star[\"constellation\"], -star[\"glow\"], star[\"name\"])", "    return star[\"constellation\"]"]),
        mistake(S07, ["    return (star[\"constellation\"], -star[\"glow\"], star[\"name\"])", "    return (star[\"constellation\"], star[\"glow\"], star[\"name\"])"], ["sorted(stars, key=ysolde_key)", "sorted(stars, key=ysolde_key, reverse=True)"]),
        mistake(S07, ["    return (star[\"constellation\"], -star[\"glow\"], star[\"name\"])", "    return (star[\"constellation\"], star[\"glow\"], star[\"name\"])"]),
        mistake(S07, ["    return [star[\"name\"] for star in sorted(stars, key=ysolde_key)]", "    return sorted(stars, key=ysolde_key)"], ["for name in window_order(stars):\n    print(name)", "for star in window_order(stars):\n    print(star[\"name\"])"]),
        mistake(S07, ["    return [star[\"name\"] for star in sorted(stars, key=ysolde_key)]", "    stars.sort(key=ysolde_key)\n    return [star[\"name\"] for star in stars]"]),
        mistake(S07, ["    return (star[\"constellation\"], -star[\"glow\"], star[\"name\"])", "    return (star[\"constellation\"], -star[\"glow\"])"]),
      ],
      done: "Six lancet windows, four buttresses, and every window facing exactly the right patch of sky. Ysolde would have cried. She cried at windows. Allegedly. I've heard. From the windows.",
    },
    {
      id: "o08-railing",
      part: "Stargazing gallery",
      title: "Rings of Railing",
      topic: "recursion",
      cost: { wood: 9, stone: 1 },
      intro: [
        "The stargazing gallery wraps round the top of the tower, and Tock is fitting the railing. Tock has found something odd in Ysolde's notes.",
        "Tock: She describes the railing like this: *a railing of n rings is one ring of n posts on top of a railing of n − 1 rings.* She explains the railing... using the railing! Delightful. Possibly broken. I love it.",
        "That's **recursion**: a function that calls itself on a smaller version of the same problem. It needs a **base case**, a problem so small you can answer it straight away, or it calls itself forever.",
        "From up on that gallery you can see the whole valley, you know. The pond, the roofs, the smoke from Bram's chimney. I mean. I imagine you can. One imagines.",
      ],
      codex: ["recursion"],
      quiz: {
        code: r`def down(n):
    if n == 0:
        return "go"
    return str(n) + " " + down(n - 1)

print(down(3))`,
        question: "What does this program show?",
        options: ["3 2 1 go", "go", "go 1 2 3", "RecursionError"],
        answer: 0,
        why: "down(3) is \"3 \" plus down(2), which is \"2 \" plus down(1), and so on until down(0), the base case, gives back \"go\". Then every waiting call adds its piece on the way back.",
      },
      task: [
        "The railing's top ring has 1 post, the ring below it 2, the next 3, and so on. Write `posts(rings)`: how many posts a railing with that many rings needs altogether. A railing of 0 rings needs none.",
        "Write `echo(word, times)`: the dome echoes a word back, so `echo` gives back the word that many times with one space between each, and an empty string for 0 times.",
        "Both must work by calling **themselves** on a smaller problem, the way Ysolde describes. The rune listens for the echo.",
        "Print how many posts a 12-ring gallery needs, and the dome's echo of `hello`, twice. (Pip's favourite.)",
      ],
      starter: r`# posts(rings): every post in a railing of that many rings.

# echo(word, times): the word that many times, with spaces between.


# 12 rings of railing, and hello, twice.
`,
      tests: PRE + r`got, inner = self_calls("posts", 0)
check(got == 0, "posts(0) should be 0: a railing with no rings needs no posts. It gave back " + _short(got) + ".")
got, inner = self_calls("posts", 1)
check(got == 1, "posts(1) should be 1: one ring of one post. It gave back " + _short(got) + ".")
got, inner = self_calls("posts", 4)
check(got == 10, "posts(4) should be 10 (rings of 1, 2, 3 and 4 posts), but it gave back " + _short(got) + ".")
got, inner = self_calls("posts", 30)
check(got == 465, "posts(30) should be 465, but it gave back " + _short(got) + ".")
check(inner >= 29, "posts gives the right answers, but it never calls itself. Solve it Ysolde's way: a railing of n rings is n posts on top of a railing of n - 1 rings.")
got, inner = self_calls("echo", "hush", 3)
check(got is not None, "echo gave back None. Does every path through it end in a return?")
check(not (isinstance(got, str) and got.endswith(" ")), "echo(\"hush\", 3) gave back " + _short(got) + ", with a space dangling at the end. Spaces go between the words only.")
check(got == "hush hush hush", "echo(\"hush\", 3) should give back \"hush hush hush\", but gave back " + _short(got) + ".")
got, inner = self_calls("echo", "owl", 1)
check(got == "owl", "echo(\"owl\", 1) should give back just \"owl\", but gave back " + _short(got) + ".")
got, inner = self_calls("echo", "hoo", 0)
check(got == "", "echo(\"hoo\", 0) should give back an empty string, but gave back " + _short(got) + ".")
got, inner = self_calls("echo", "hi", 5)
check(got == "hi hi hi hi hi", "echo(\"hi\", 5) should give back \"hi hi hi hi hi\", but gave back " + _short(got) + ".")
check(inner >= 4, "echo gives the right answers, but it never calls itself. An echo of a word 5 times is the word, then an echo of it 4 times.")
check(78 in _nums(out), "Print how many posts a 12-ring gallery needs (ask posts).")
check("hello hello" in out, "Print the dome's echo of hello, twice (ask echo).")`,
      hints: [
        "Don't try to picture the whole railing. If someone handed you the finished railing for one ring fewer, what would you add to get yours? And which railing is so small that you know its answer without doing any work at all?",
        "Every recursive function has the same two parts. If the problem is tiny, return its answer straight away. Otherwise, return something built from a call on a smaller problem, and trust that call to be right. For example, `def stairs(n): if n == 0: return 0` / `return 2 + stairs(n - 1)` counts two blocks per step.",
        "`if rings == 0: return 0`, then `return rings + posts(___)`. For echo, the tiny cases are 0 times (an empty string) and 1 time (just the word); otherwise it's the word, a space, and `echo(word, ___)`.",
      ],
      solution: S08,
      wrong: [
        mistake(S08, ["    if rings == 0:\n        return 0\n    return rings + posts(rings - 1)", "    total = 0\n    for ring in range(rings + 1):\n        total += ring\n    return total"]),
        mistake(S08, ["    if rings == 0:\n        return 0\n    return rings + posts(rings - 1)", "    return rings + posts(rings - 1)"]),
        mistake(S08, ["    if rings == 0:\n        return 0\n", "    if rings == 1:\n        return 1\n"]),
        mistake(S08, ["    return rings + posts(rings - 1)", "    rings + posts(rings - 1)"]),
        mistake(S08, ["    if times == 1:\n        return word\n    return word + \" \" + echo(word, times - 1)", "    return word + \" \" + echo(word, times - 1)"]),
        mistake(S08, ["    if times == 0:\n        return \"\"\n    if times == 1:", "    if times == 1:"]),
        mistake(S08, ["    if times == 0:\n        return \"\"\n    if times == 1:\n        return word\n    return word + \" \" + echo(word, times - 1)", "    return \" \".join([word] * times)"]),
      ],
      done: "Hello hello! Twelve rings of railing, all the way round. And the view. Oh, the view. ...Is it a nice view? You'd tell me if it was a nice view. Tell me about the roofs.",
    },
    {
      id: "o09-dome-ribs",
      part: "Dome frame",
      title: "The Ribs of the Dome",
      topic: "recursion over a list",
      cost: { wood: 10, stone: 1 },
      intro: [
        "The dome's frame: a timber ring, and curved ribs meeting at the crown. Tock has measured every rib, and Ysolde's note says how to check them. Recursively, of course.",
        "Tock: *The timber in a frame is the first rib, plus the timber in all the other ribs.* And the longest rib is either the first one, or the longest of the rest. She explained everything with itself! I'd have liked her enormously.",
        "Lists are made for recursion: a list is its first item, plus the rest of the list. `ribs[1:]` is the rest, a new list one shorter. Keep handing over the rest and you always end up at the smallest list of all.",
      ],
      codex: ["recursion-data", "recursion"],
      quiz: {
        code: r`ribs = [7]
print(ribs[1:])`,
        question: "What does this program show?",
        options: ["[]", "[7]", "IndexError", "None"],
        answer: 0,
        why: "A slice never raises IndexError. Everything after position 0 of a one-item list is nothing at all, so you get an empty list: the place where list recursion stops.",
      },
      task: [
        "Write `timber(ribs)`: the total length of all the ribs. No ribs at all means no timber.",
        "Write `longest(ribs)`: the longest rib. The frame always has at least one.",
        "Both must work by recursion: each call deals with the first rib and hands the rest of the list to itself. The rune counts the calls. Leave the list just as you found it.",
        "Print the frame's total timber and its longest rib.",
      ],
      starter: r`ribs = [412, 398, 405, 421, 399, 410, 407, 415]   # each rib's length, in cm

# timber(ribs): the total length, recursively.

# longest(ribs): the longest rib, recursively.


# Print the total timber and the longest rib.
`,
      tests: PRE + r`got, inner = self_calls("timber", [])
check(got == 0, "timber([]) should be 0: no ribs, no timber. It gave back " + _short(got) + ".")
got, inner = self_calls("timber", [4])
check(got == 4, "timber([4]) should be 4, but gave back " + _short(got) + ".")
got, inner = self_calls("timber", [3, 5, 2])
check(got != 0, "timber([3, 5, 2]) gave back 0. Each call should add its first rib to the timber of the rest.")
check(got == 10, "timber([3, 5, 2]) should be 10, but gave back " + _short(got) + ".")
ribs = list(range(1, 21))
got, inner = self_calls("timber", ribs)
check(ribs == list(range(1, 21)), "timber changed the list it was given. Hand the rest over as a slice, which makes a new list, instead of removing ribs.")
check(got == 210, "timber of the ribs 1 to 20 should be 210, but gave back " + _short(got) + ".")
check(inner >= 19, "timber adds up correctly, but it doesn't call itself on the rest of the list. The rune wants Ysolde's way: the first rib, plus the timber of all the others.")
got, inner = self_calls("longest", [6])
check(got == 6, "longest([6]) should be 6: with one rib, it's the longest. It gave back " + _short(got) + ".")
for ribs, want in [([2, 9, 4], 9), ([9, 2, 4], 9), ([3, 1, 8], 8)]:
    before = ribs[:]
    got, inner = self_calls("longest", ribs)
    check(ribs == before, "longest changed the list it was given (it became " + _short(ribs) + "). Hand the rest over as a slice instead of removing ribs.")
    check(got == want, "longest(" + _short(before) + ") should be " + str(want) + ", but gave back " + _short(got) + ".")
ribs = [5, 12, 3, 17, 8, 1, 14, 6, 11, 2, 9, 4, 16, 7, 10]
got, inner = self_calls("longest", ribs[:])
check(got == 17, "longest of a 15-rib frame should be 17, but gave back " + _short(got) + ".")
check(inner >= 14, "longest finds the right rib, but it doesn't call itself on the rest of the list. The rune wants Ysolde's way: the first rib, or the longest of the rest, whichever is longer.")
check(3267 in _nums(out), "Print the frame's total timber (ask timber).")
check(421 in _nums(out), "Print the frame's longest rib (ask longest).")`,
      hints: [
        "Say it in words before writing it: the total of a list is its first rib plus the total of ___. What's the total of an empty list? Then the same for longest: what's the longest rib of a list with just one rib in it?",
        "`items[0]` is the first item and `items[1:]` is a new list of everything after it, so the original stays as it was. A recursive call on `items[1:]` gets a list one shorter every time, until it reaches your base case.",
        "`if ribs == []: return 0`, then `return ribs[0] + timber(___)`. For longest: if `len(ribs) == 1`, return that rib; otherwise compare `ribs[0]` with `longest(ribs[1:])` and give back the bigger.",
      ],
      solution: S09,
      wrong: [
        mistake(S09, ["    if ribs == []:\n        return 0\n    return ribs[0] + timber(ribs[1:])", "    return sum(ribs)"]),
        mistake(S09, ["    if ribs == []:\n        return 0\n    return ribs[0] + timber(ribs[1:])", "    if len(ribs) == 1:\n        return ribs[0]\n    return ribs[0] + timber(ribs[1:])"]),
        mistake(S09, ["    rest = longest(ribs[1:])\n    if ribs[0] > rest:\n        return ribs[0]\n    return rest", "    first = ribs.pop(0)\n    rest = longest(ribs)\n    if first > rest:\n        return first\n    return rest"]),
        mistake(S09, ["    if ribs[0] > rest:", "    if ribs[0] < rest:"]),
        mistake(S09, ["    return ribs[0] + timber(ribs[1:])", "    return timber(ribs[1:])"]),
        mistake(S09, ["    if len(ribs) == 1:\n        return ribs[0]\n    rest = longest(ribs[1:])\n    if ribs[0] > rest:\n        return ribs[0]\n    return rest", "    return max(ribs)"]),
      ],
      done: "Ribs up, crown ring on. It looks like the inside of a great wooden flower. Or a whale. A nice whale. Tock says the frame is perfect, and Tock is suspicious of perfect, so that's high praise.",
    },
    {
      id: "o10-constellations",
      part: "Copper dome",
      title: "Constellations Inside Constellations",
      topic: "recursion over nested data",
      cost: { wood: 2, stone: 9 },
      intro: [
        "The copper skin goes on the dome, and the Hush is pressing down off the summit as if it doesn't like it one bit. And my scales are... glowing? They do that sometimes. Ignore it. Look at the stars.",
        "Ysolde's charts are nested. The Great Heron is a constellation, its wing is a constellation inside it, and the wing's tip is a constellation inside *that*. Some charts go three deep, some go ten. You never know how deep.",
        "A loop inside a loop handles two levels. For any number of levels, let the function call itself on each smaller constellation inside, and let each of those do the same. This is where recursion really shines.",
      ],
      codex: ["recursion-data", "recursion"],
      quiz: {
        code: r`def depth(box):
    if box["inside"] == []:
        return 1
    return 1 + depth(box["inside"][0])

doll = {"inside": [{"inside": [{"inside": []}]}]}
print(depth(doll))`,
        question: "What does this program show?",
        options: ["3", "2", "1", "KeyError"],
        answer: 0,
        why: "Three boxes, one inside the next. The innermost has nothing inside, so it gives back 1, and each box around it adds 1 on the way back out.",
      },
      task: [
        "A constellation is a dictionary: its `name`, a list of its own `stars` (names), and a list of the smaller constellations `inside` it, each built the same way. Any of them can be empty.",
        "Write `count_stars(c)`: every star in `c`, in its insides, in their insides, all the way down.",
        "Write `find_home(c, star)`: the name of the constellation that lists `star` among its **own** stars, however deep that is, or `None` if the star isn't anywhere in the chart.",
        "Print how many stars the Great Heron holds, and which constellation the star Quill belongs to.",
      ],
      starter: HERON + r`

# count_stars(c): every star in c, all the way down.

# find_home(c, star): the name of the constellation that holds star itself, or None.


# How many stars in the Great Heron? Where does Quill live?
`,
      tests: PRE + r`def C(name, stars, inside=None):
    return {"name": name, "stars": stars, "inside": inside or []}
deep = C("Root", ["a"], [C("L1", ["b", "c"], [C("L2", [], [C("L3", ["d"], [C("L4", ["e", "f"])])])]), C("R1", ["g"], [C("R2", ["h"])])])
got = call("count_stars", C("Lone", ["x", "y"]))
check(got == 2, "count_stars of a constellation with 2 stars and nothing inside should be 2, but gave back " + _short(got) + ".")
got = call("count_stars", C("Empty", []))
check(got == 0, "count_stars of an empty constellation (no stars, nothing inside) should be 0, but gave back " + _short(got) + ". Count stars, not constellations.")
got = call("count_stars", C("Pair", ["a"], [C("Inner", ["b", "c"])]))
check(got == 3, "count_stars of a constellation with 1 star of its own and 2 more inside should be 3, but gave back " + _short(got) + ".")
got = call("count_stars", deep)
check(got == 8, "That chart has 8 stars, some of them five levels deep, but count_stars gave back " + _short(got) + ". Does it reach every level, however deep, or only the first one or two?")
got = call("find_home", deep, "a")
check(got == "Root", "find_home(chart, 'a') should give back 'Root', which lists a among its own stars, but gave back " + _short(got) + ".")
got = call("find_home", deep, "e")
check(got is not None, "find_home(chart, 'e') gave back None, but e is in there, five levels down. Search inside every smaller constellation, all the way down.")
check(got == "L4", "find_home should give back the constellation that lists the star itself, the innermost one, not one of the bigger constellations around it. For 'e' that's 'L4', but you gave back " + _short(got) + ".")
got = call("find_home", deep, "h")
check(got is not None, "find_home(chart, 'h') gave back None, but h is in R2, inside the second part. When the first part says None (not here), keep looking in the other parts.")
check(got == "R2", "find_home(chart, 'h') should give back 'R2', but gave back " + _short(got) + ".")
got = call("find_home", deep, "zz")
check(got is None, "'zz' isn't anywhere in the chart, so find_home should give back None, not " + _short(got) + ".")
got = call("find_home", C("Empty", []), "a")
check(got is None, "find_home of an empty constellation should give back None, not " + _short(got) + ".")
check(15 in _nums(out), "Print how many stars the Great Heron holds (ask count_stars).")
check("The Last Feather" in out, "Print which constellation Quill belongs to (ask find_home).")`,
      hints: [
        "Imagine asking each smaller constellation to count its own stars and report back. What would the big one do with all the reports? For find_home: if one smaller constellation says \"not here\", should you give up, or ask the next one?",
        "The pattern: start with what this level holds, then loop over the parts and call the same function on each one. Keep a running total that starts with this constellation's own stars. For find_home, keep each part's answer in a variable, and only `return` it when it isn't `None`.",
        "`total = len(c[\"stars\"])` / `for part in c[\"inside\"]:` / `    total += ___` / `return total`. For find_home: if `star in c[\"stars\"]`, give back `c[\"name\"]`; otherwise, for each part, `found = find_home(part, star)` and `if found is not None: return found`. After the loop, `return None`.",
      ],
      solution: S10,
      wrong: [
        mistake(S10, ["    total = len(c[\"stars\"])\n    for part in c[\"inside\"]:\n        total += count_stars(part)\n    return total", "    total = len(c[\"stars\"])\n    for part in c[\"inside\"]:\n        total += len(part[\"stars\"])\n        for inner in part[\"inside\"]:\n            total += len(inner[\"stars\"])\n    return total"]),
        mistake(S10, ["        found = find_home(part, star)\n        if found is not None:\n            return found", "        return find_home(part, star)"]),
        mistake(S10, ["        if found is not None:\n            return found", "        if found is not None:\n            return c[\"name\"]"]),
        mistake(S10, ["    total = len(c[\"stars\"])", "    total = 1"]),
        mistake(S10, ["    for part in c[\"inside\"]:\n        found = find_home(part, star)\n        if found is not None:\n            return found\n    return None", "    return None"]),
      ],
      done: "The dome is skinned in copper, green as a frog in spring, and Quill was hiding five constellations deep in the Heron's wing. The Hush hates it. Good. My scales are still glowing. I'm still ignoring it.",
    },
    {
      id: "o11-night-watch",
      part: "Slit shutters and finial",
      title: "The Night Watch",
      topic: "generators",
      cost: { wood: 6, stone: 5 },
      intro: [
        "Two copper shutters for the dome's slit, and a brass star on the very top. Rook wants a night watch up on the gallery: someone at the slit every hour from dusk till dawn, with a signal lantern changing colour each hour so the town knows all is well.",
        "Rook: Dusk's at 21, dawn's at 5. In my day we wrote the rota out by hand, and every time it went past midnight, someone argued that 24 was a real hour.",
        "A **generator** hands out values one at a time with `yield` instead of `return`. It pauses after each one and carries on from that exact spot when asked for the next. It can even go on forever, because it only makes what you ask for.",
      ],
      codex: ["generators"],
      quiz: {
        code: r`def evens(n):
    for i in range(n):
        if i % 2 == 0:
            yield i

print(list(evens(5)))`,
        question: "What does this program show?",
        options: ["[0, 2, 4]", "[0, 2, 4, 6]", "[1, 3]", "0"],
        answer: 0,
        why: "Each yield hands out one value and pauses. list() keeps asking for the next value until the generator ends, collecting 0, 2 and 4.",
      },
      task: [
        "Write a generator `watch_hours(start, end)` that yields each hour of the watch, from `start` to `end`, both included. Hours go round the clock: after 23 comes 0.",
        "Write a generator `lantern_colours(colours)` that yields the colours in order, then starts over, forever.",
        "Print tonight's watch, from 21 to 5: each hour beside its lantern colour, with the starter's colours.",
      ],
      starter: r`colours = ["gold", "green", "blue"]   # the signal lantern's colours, in turn

# watch_hours(start, end): yield every hour from start to end, round the clock.

# lantern_colours(colours): yield the colours in turn, forever.


# Tonight's watch, 21 to 5, each hour with its colour.
`,
      tests: PRE + r`from itertools import islice as _islice
def drain(name, args, n):
    shown = name + "(" + ", ".join(_short(a) for a in args) + ")"
    g = call(name, *args)
    check(isinstance(g, _types.GeneratorType), shown + " gave back " + type(g).__name__ + " " + _short(g) + ", not a generator. Use yield to hand the values out one at a time, instead of returning them all at once.")
    try:
        return list(_islice(g, n))
    except Exception as e:
        check(False, "While the rune was taking values from " + shown + ", it crashed with " + type(e).__name__ + ": " + str(e) + ".")
got = drain("watch_hours", (3, 6), 30)
check(len(got) < 30, "watch_hours(3, 6) never stopped handing out hours. Once it has handed out the end hour, it should finish.")
check(got != [3, 4, 5], "watch_hours(3, 6) handed out " + _short(got) + ". The watch includes the end hour too.")
check(got == [3, 4, 5, 6], "watch_hours(3, 6) should hand out 3, 4, 5 and 6, but handed out " + _short(got) + ".")
got = drain("watch_hours", (21, 2), 30)
check(got != [], "watch_hours(21, 2) handed out nothing at all. The watch goes round past midnight: after 23 comes 0.")
check(len(got) < 30, "watch_hours(21, 2) never stopped. Once it has handed out the end hour, it should finish.")
check(got == [21, 22, 23, 0, 1, 2], "watch_hours(21, 2) should hand out 21, 22, 23, 0, 1 and 2, but handed out " + _short(got) + ".")
got = drain("watch_hours", (22, 22), 30)
check(got == [22], "watch_hours(22, 22) is a one-hour watch, so it should hand out just 22, but handed out " + _short(got) + ".")
got = drain("watch_hours", (23, 0), 30)
check(got == [23, 0], "watch_hours(23, 0) should hand out 23 and 0, but handed out " + _short(got) + ".")
got = drain("watch_hours", (0, 23), 30)
check(got == list(range(24)), "watch_hours(0, 23) should hand out all 24 hours, 0 to 23, but handed out " + _short(got) + ".")
got = drain("lantern_colours", (["red", "green"],), 7)
check(len(got) == 7, "lantern_colours(['red', 'green']) handed out " + str(len(got)) + " colours and stopped. It should start over from the first colour and keep going forever.")
check(got == ["red", "green", "red", "green", "red", "green", "red"], "lantern_colours(['red', 'green']) should hand out red, green, red, green and so on, but the first seven were " + _short(got) + ".")
got = drain("lantern_colours", (["blue"],), 3)
check(got == ["blue", "blue", "blue"], "With one colour, lantern_colours should hand it out again and again, but the first three were " + _short(got) + ".")
want = [(21, "gold"), (22, "green"), (23, "blue"), (0, "gold"), (1, "green"), (2, "blue"), (3, "gold"), (4, "green"), (5, "blue")]
watch = [l for l in lines if any(c in l for c in ["gold", "green", "blue"])]
check(len(watch) == len(want), "Print tonight's watch, 21 to 5: one line for each of its 9 hours, with that hour's lantern colour. You printed " + str(len(watch)) + " such lines.")
for (hour, colour), line in zip(want, watch):
    check(hour in _nums(line) and colour in line, "In tonight's watch, hour " + str(hour) + " should have the " + colour + " lantern, but the line says: " + line)`,
      hints: [
        "Think of Tock's clock: what hour comes after 23? How does the watch know it's finished? And for the lantern: what should happen when it runs out of colours?",
        "`yield` inside a loop hands out one value each time round, and `return` inside a generator ends it. `% 24` turns 24 back into 0. A generator can loop forever with `while True:`, and that's fine: it only runs when someone asks for the next value, and `zip` stops asking as soon as one side runs out.",
        "`hour = start`, then a `while True:` loop that yields `hour`, finishes with `return` when `hour == end`, and otherwise moves on with `hour = (hour + 1) % ___`. For the colours: a `for` loop that yields each colour, inside a `while True:`.",
      ],
      solution: S11,
      wrong: [
        mistake(S11, ["    hour = start\n    while True:\n        yield hour\n        if hour == end:\n            return\n        hour = (hour + 1) % 24", "    hours = []\n    hour = start\n    while True:\n        hours.append(hour)\n        if hour == end:\n            return hours\n        hour = (hour + 1) % 24"]),
        mistake(S11, ["    hour = start\n    while True:\n        yield hour\n        if hour == end:\n            return\n        hour = (hour + 1) % 24", "    for hour in range(start, end + 1):\n        yield hour"]),
        mistake(S11, ["    hour = start\n    while True:\n        yield hour\n        if hour == end:\n            return\n        hour = (hour + 1) % 24", "    hour = start\n    while hour != end:\n        yield hour\n        hour = (hour + 1) % 24"]),
        mistake(S11, ["    while True:\n        for colour in colours:\n            yield colour", "    for colour in colours:\n        yield colour"]),
        mistake(S11, ["        hour = (hour + 1) % 24", "        hour = hour + 1"], ["zip(watch_hours(21, 5)", "zip(watch_hours(1, 5)"]),
        mistake(S11, ["for hour, colour in zip(watch_hours(21, 5), lantern_colours(colours)):", "for hour, colour in zip(watch_hours(21, 5), colours):"]),
      ],
      done: "Shutters slid open, a star on top, and Rook has a watch rota that goes past midnight without a single argument. Two, actually. Small ones. About tea.",
    },
    {
      id: "o12-telescope",
      part: "The great telescope",
      title: "Sweeping the Sky",
      topic: "generator expressions and next()",
      cost: { wood: 3, stone: 9 },
      intro: [
        "The great brass telescope, on its stone pier, reaching out through the slit! Tock has fitted it with a rune that sweeps the sky and reports what it sees, one reading at a time. Forever.",
        "Forever is a problem. Ask for a list of an endless sweep and Python tries to finish the list, and never does. Instead: `next()` takes one reading when you want it, and a **generator expression** (a comprehension in round brackets) looks through readings lazily, one at a time, stopping when it has what it needs.",
        "The socket at the end, where the lens goes, is empty. Dark. Don't look at it too long. Look at the sky.",
      ],
      codex: ["generator-expressions", "generators"],
      quiz: {
        code: r`g = (n * 2 for n in [1, 2, 3])
print(sum(g))
print(sum(g))`,
        question: "What does this program show?",
        options: ["12\n0", "12\n12", "6\n6", "TypeError"],
        answer: 0,
        why: "A generator can only be read once. The first sum uses up 2, 4 and 6; the second sum finds nothing left, and the sum of nothing is 0.",
      },
      task: [
        "`peek(readings, n)`: give back a list of the next `n` readings from the stream, taken with `next()`. Take exactly `n`, no more.",
        "`first_bright(readings, limit)`: the **angle** of the first reading whose glow is above `limit`. The stream never ends, so never try to make a list of it. (A bright reading always comes eventually.)",
        "`count_bright(readings, n, limit)`: how many of the next `n` readings glow above `limit`. Again, take exactly `n`.",
        "Try them on fresh sweeps from angle 0: print the first three readings, the first angle with a glow above 97, and how many of the first 100 readings glow above 50.",
      ],
      starter: SWEEP + r`

# peek(readings, n): a list of the next n readings.

# first_bright(readings, limit): the angle of the first reading glowing above limit.

# count_bright(readings, n, limit): how many of the next n readings glow above limit.


# Try them on sweep(0), a fresh sweep each time.
`,
      tests: PRE + r`check("next(" in src, "Take readings with next(): it's the tool this telescope is built around.")
_ENDLESS = "it tried to read the whole endless stream, and an endless stream has no end. Take only the readings you need."
def endless(pairs):
    taken = 0
    for p in pairs:
        yield p
    angle = 1000
    while True:
        taken += 1
        if taken > 5000:
            raise _Lost()
        yield (angle, 0)
        angle += 1
s = endless([(0, 5), (1, 7), (2, 9), (3, 1), (4, 4)])
got = call("peek", s, 3, lost=_ENDLESS)
check(isinstance(got, list), "peek should give back a list of readings, but gave back " + _short(got) + ".")
check(got == [(0, 5), (1, 7), (2, 9)], "peek(stream, 3) should give back the next three readings, but gave back " + _short(got) + ".")
check(next(s) == (3, 1), "peek(stream, 3) gave back the right readings, but took more than three from the stream, so the next reader missed one. Take exactly n.")
got = call("peek", endless([(8, 8)]), 0, lost=_ENDLESS)
check(got == [], "peek(stream, 0) should give back an empty list, not " + _short(got) + ".")
got = call("first_bright", endless([(0, 10), (1, 50), (2, 80), (3, 95), (4, 99)]), 80, lost=_ENDLESS)
check(got != 95, "first_bright gave back 95, which is a glow. Give back the reading's angle.")
check(got != 2, "first_bright gave back angle 2, whose glow is exactly 80. The limit is 80, so the glow has to be above it.")
check(got == 3, "With a limit of 80, the first bright reading is at angle 3, but first_bright gave back " + _short(got) + ".")
got = call("first_bright", endless([(40, 1), (41, 97), (42, 2)]), 96, lost=_ENDLESS)
check(got == 41, "first_bright should give back 41 for that stream, but gave back " + _short(got) + ".")
s = endless([(0, 60), (1, 20), (2, 70), (3, 51), (4, 50), (5, 99)])
got = call("count_bright", s, 5, 50, lost=_ENDLESS)
check(got == 3, "Of the next 5 readings (glows 60, 20, 70, 51 and 50), three are above 50, but count_bright gave back " + _short(got) + ".")
check(next(s) == (5, 99), "count_bright gave the right answer, but took more than 5 readings from the stream. Take exactly n.")
got = call("count_bright", endless([]), 4, 10, lost=_ENDLESS)
check(got == 0, "count_bright should give back 0 when none of the readings glow above the limit, not " + _short(got) + ".")
nums = _nums(out)
check(all(n in nums for n in [11, 48, 85]), "Print the first three readings of a fresh sweep(0) (ask peek).")
check(24 in nums, "Print the first angle of sweep(0) with a glow above 97 (ask first_bright, with a fresh sweep).")
check(49 in nums, "Print how many of the first 100 readings of sweep(0) glow above 50 (ask count_bright, with a fresh sweep).")`,
      hints: [
        "Picture the telescope's tape spooling out of the rune: you can read the next bit, or keep reading until you see what you want, but you can never read to the end. Which of your tools stop the moment they have an answer?",
        "`next(stream)` takes one value. `next(x for x in stream if test)` takes the first value that passes, and stops right there. `sum(1 for ... if ...)` counts without building a list, and a comprehension over `range(5)` that calls `next` each time takes exactly five.",
        "`first_bright` is one line: `next(angle for angle, glow in readings if ___)`. For `count_bright`, take exactly `n` readings with `next(readings)` inside a generator expression over `range(n)`, and count the bright ones with `sum`.",
      ],
      solution: S12,
      wrong: [
        mistake(S12, ["    return next(angle for angle, glow in readings if glow > limit)", "    return [angle for angle, glow in readings if glow > limit][0]"], ["print(f\"First glow above 97 at angle {first_bright(sweep(0), 97)}\")\n", ""]),
        mistake(S12, ["if glow > limit)", "if glow >= limit)"]),
        mistake(S12, ["    return [next(readings) for _ in range(n)]", "    return list(readings)[:n]"], ["print(peek(sweep(0), 3))\n", ""]),
        mistake(S12, ["    return sum(1 for _ in range(n) if next(readings)[1] > limit)", "    return sum(1 for angle, glow in readings if glow > limit)"], ["print(f\"{count_bright(sweep(0), 100, 50)} of the first 100 readings glow above 50\")", ""]),
        mistake(S12, ["    return next(angle for angle, glow in readings if glow > limit)", "    return next(glow for angle, glow in readings if glow > limit)"]),
        mistake(S12, ["    return [next(readings) for _ in range(n)]", "    taken = []\n    for reading in readings:\n        if len(taken) == n:\n            break\n        taken.append(reading)\n    return taken"]),
      ],
      done: "The telescope's in, sweeping and reporting, and Tock is happier than I've ever seen anyone be about brass. But look at the end of it: the lens socket, still empty, still dark. ...I know where the lens is. I've always known. Come and sit by the stone. There's something I should have told you a long time ago.",
    },
    {
      id: "o13-binding-verse",
      part: "The rune circle",
      title: "The Binding Verse",
      topic: "breaking a problem into functions",
      cost: { wood: 0, stone: 10 },
      intro: [
        "Sit down. No, closer. I want to say this right, and I've had three hundred years to practise, and I still don't know how it starts.",
        "I'm not just a serpent who happened to stay. I'm Ysolde's familiar. Hers. The night the Hush came down off that hill, the last speakers had gone, and nobody was left who could teach the Old Tongue. So she bound me to the last rune stone, to keep the words alive until a new speaker came.",
        "And she hid the Great Rune, the lens, inside this stone. Under me. You all thought I was keeping the stone warm. I was keeping *it* warm. For three hundred years.",
        "Up on the terrace, the rune circle is going in, with its four standing stones. That's her binding, carved round the ring and cut into numbered pieces across the four stones. I've never been able to read it. Not allowed. But you can.",
        "A big job like this is three small jobs in a long coat: pull the pieces out of one carving, put pieces in order, put the whole verse together. Give each job its own function, test each one on its own, then let one function use the others.",
      ],
      codex: ["big-programs"],
      quiz: {
        code: r`bit = " 7: the owl "
number, words = bit.split(":")
print(int(number) + 1, words.strip())`,
        question: "What does this program show?",
        options: ["8 the owl", "71 the owl", "8  the owl", "ValueError"],
        answer: 0,
        why: "split(\":\") gives \" 7\" and \" the owl \". int() ignores the spaces around a number, so you get 7 + 1 = 8, and strip() tidies the words.",
      },
      task: [
        "A carving is a string of pieces with `/` between them; each piece is a number, a colon, and some words. Weathering has left stray spaces, and even empty pieces.",
        "`pieces(carving)`: give back a list of `(number, words)` tuples, one for each real piece, with the number as a number and the words tidied.",
        "`stitch(parts)`: given a list of such tuples, give back their words joined into one string, in number order, with single spaces between.",
        "`verse(stones)`: given the list of carvings, one per standing stone, give back the whole verse. Let it use the other two to do the work. Then print the verse, and how many words it has.",
      ],
      starter: STONES + r`

# pieces(carving): (number, words) for each piece of one carving.

# stitch(parts): the words of the pieces, in number order.

# verse(stones): the whole verse, from every stone.


# Read the verse, and count its words.
`,
      tests: PRE + r`got = call("pieces", " 2: soft rain / 1:the  /3: falls ")
check(isinstance(got, list) and all(isinstance(p, tuple) and len(p) == 2 for p in got), "pieces should give back a list of (number, words) tuples, but gave back " + _short(got) + ".")
check(len(got) == 3, "pieces(' 2: soft rain / 1:the  /3: falls ') should find 3 pieces, but found " + str(len(got)) + ": " + _short(got) + ".")
check(all(isinstance(n, int) for n, w in got), "In " + _short(got) + " the numbers are still text. Turn them into numbers, or 10 will sort before 2.")
check(got == [(2, "soft rain"), (1, "the"), (3, "falls")], "pieces(' 2: soft rain / 1:the  /3: falls ') should give back [(2, 'soft rain'), (1, 'the'), (3, 'falls')], with the words tidied, but gave back " + _short(got) + ".")
got = call("pieces", "4:far //5:away")
check(got == [(4, "far"), (5, "away")], "Some carvings have empty pieces where the stone wore away, like the gap in '4:far //5:away'. Skip them. pieces gave back " + _short(got) + ".")
got = call("pieces", "")
check(got == [], "An empty carving has no pieces, so pieces('') should give back [], not " + _short(got) + ".")
got = call("stitch", [(2, "b"), (1, "a"), (3, "c")])
check(got == "a b c", "stitch([(2, 'b'), (1, 'a'), (3, 'c')]) should give back 'a b c', but gave back " + _short(got) + ".")
got = call("stitch", [(10, "end"), (2, "middle"), (1, "start")])
check(got == "start middle end", "stitch([(10, 'end'), (2, 'middle'), (1, 'start')]) should give back 'start middle end', but gave back " + _short(got) + ". Is 10 being compared as a number?")
got = call("verse", ["3:c / 1:a", "2:b"])
check(got != "a c b", "verse(['3:c / 1:a', '2:b']) gave back 'a c b': each stone is in order, but the pieces from different stones aren't. Gather every piece from every stone first, then put them all in order together.")
check(got == "a b c", "verse(['3:c / 1:a', '2:b']) should give back 'a b c', but gave back " + _short(got) + ".")
f_pieces = need("pieces")
f_stitch = need("stitch")
used = [0, 0]
def spy_pieces(*a):
    used[0] += 1
    return f_pieces(*a)
def spy_stitch(*a):
    used[1] += 1
    return f_stitch(*a)
ns["pieces"] = spy_pieces
ns["stitch"] = spy_stitch
try:
    got = call("verse", ["10: fine", "2: all / 1:  It", " 3: ends / 9: well,", ""])
finally:
    ns["pieces"] = f_pieces
    ns["stitch"] = f_stitch
check(got == "It all ends well, fine", "verse gave back " + _short(got) + " for another set of stones, which isn't right.")
check(used[0] >= 4, "verse gets the right answer, but it doesn't ask pieces for help with each carving. Let verse call your smaller functions instead of doing their jobs again itself.")
check(used[1] >= 1, "verse gets the right answer, but it never asks stitch to put the pieces together. Let verse call your smaller functions instead of doing their jobs again itself.")
text = f_stitch(sum([f_pieces(c) for c in ns["stones"]], []))
check(text in out, "Print the whole verse (ask verse).")
check(len(text.split()) in _nums(out.replace(text, "")), "Print how many words the verse has.")`,
      hints: [
        "Before any code, take one carving and do it by hand on paper: what do you get when you cut it at each slash? Then each bit at its colon? Which of those jobs is the smallest one you could test on its own?",
        "Write and test one function at a time, with a quick print of a tiny example, before writing the next: `print(pieces(\"2: b / 1: a\"))`. `split` cuts, `strip` tidies, `int` makes the number a number, and `sorted` puts tuples in order by their first part. A list grows with `+=` another list.",
        "`pieces`: split on `/`, skip bits that are blank once stripped, then `number, words = bit.split(\":\")` and append `(int(number), words.strip())`. `verse`: gather `pieces(carving)` for every carving into one list, then give that list to `___`.",
      ],
      solution: S13,
      wrong: [
        mistake(S13, ["found.append((int(number), words.strip()))", "found.append((number.strip(), words.strip()))"]),
        mistake(S13, ["found.append((int(number), words.strip()))", "found.append((int(number), words))"]),
        mistake(S13, ["    every = []\n    for carving in stones:\n        every += pieces(carving)\n    return stitch(every)", "    parts = []\n    for carving in stones:\n        parts.append(stitch(pieces(carving)))\n    return \" \".join(parts)"]),
        mistake(S13, ["    every = []\n    for carving in stones:\n        every += pieces(carving)\n    return stitch(every)", "    every = []\n    for carving in stones:\n        for bit in carving.split(\"/\"):\n            if bit.strip() != \"\":\n                number, words = bit.split(\":\")\n                every.append((int(number), words.strip()))\n    return \" \".join(words for number, words in sorted(every))"]),
        mistake(S13, ["        if bit.strip() == \"\":\n            continue\n", ""]),
        mistake(S13, ["    return \" \".join(words for number, words in sorted(parts))", "    return \"\".join(words for number, words in sorted(parts))"]),
      ],
      done: "...*When the Great Rune hears a program written by their own hand, you are free.* She never told me that part. Three hundred years, and she never told me. Oh. Oh, I'm going to need a minute. Possibly several.",
    },
    {
      id: "o14-every-stone",
      part: "Lanterns and signpost",
      title: "Every Stone in the Valley",
      topic: "reading and organising data",
      cost: { wood: 6, stone: 6 },
      intro: [
        "Lanterns at the top of the stairs, and a signpost at the bottom with a painted star. Now the real work: the Great Rune will only wake if every rune stone in the valley is lit when it's set, and the Hush has dimmed them all.",
        "Thistle: Every stone has a keeper, and every keeper has signed my register: the stone, how brightly it glows, and how many minutes' walk it is from the hill. I have the file. I always have the file.",
        "Half the village has offered to help. Did you notice they all speak a little Python now? Bram adds up his stew bill in it. Hazel times her loaves. You've been teaching them all along without calling it teaching.",
        "This is the first part of a bigger program, so build it to be built on: one function to read the register into tidy records, one to put them in order.",
      ],
      codex: ["big-programs", "sort-keys", "errors"],
      quiz: {
        code: r`bad = 0
for word in ["4", "x", "9", ""]:
    try:
        n = int(word)
    except ValueError:
        bad += 1
print(bad)`,
        question: "What does this program show?",
        options: ["2", "1", "3", "ValueError"],
        answer: 0,
        why: "int(\"x\") and int(\"\") both raise ValueError, and each is caught and counted. The program carries on instead of crashing.",
      },
      task: [
        "`load_stones(filename)`: read a register like `stones.csv` and give back two things: a list of records, one dictionary per stone, with the keys `stone`, `keeper`, `glow` and `walk` (glow and walk as numbers, names tidied of stray spaces), and how many lines the Hush smudged.",
        "A smudged line has a number nobody can read; skip it, and count it. Blank lines are just gaps, not smudges.",
        "`dimmest_first(records)`: a new list of the records, dimmest first; when two glow the same, the shorter walk first.",
        "Print how many stones were read, how many lines were smudged, and the three dimmest stones with their keepers.",
      ],
      files: { "stones.csv": REGISTER },
      starter: r`# load_stones(filename): (records, smudged lines) from a register like stones.csv.

# dimmest_first(records): dimmest first; equal glow, shorter walk first.


# How many stones, how many smudges, and the three dimmest.
`,
      tests: PRE + r`with open("test_register.csv", "w") as f:
    f.write("stone,keeper,glow,walk\nBarn, Juno ,12,3\n\nWell,Pell,x7,2\nGate,Ada,30, 5\nShed,Bo,12,1\n")
got = call("load_stones", "test_register.csv")
check(isinstance(got, tuple) and len(got) == 2, "load_stones should give back two things: the list of records and the number of smudged lines. It gave back " + _short(got) + ".")
recs, smudged = got
check(isinstance(recs, list) and all(isinstance(x, dict) for x in recs), "load_stones should give back a list of dictionaries, one per stone, but the first thing it gave back was " + _short(recs) + ".")
names = [x.get("stone") for x in recs]
check(not any(x.get("stone") in ["Sleepy Serpent", "Apothecary"] for x in recs), "load_stones read stones.csv, but the rune asked it for another register. Open the file whose name it's given.")
check(all(set(x) == {"stone", "keeper", "glow", "walk"} for x in recs), "Each record should have exactly the keys stone, keeper, glow and walk, but one is " + _short(recs[0] if recs else {}) + ".")
check(len(recs) == 3, "That register has 3 good stones (one smudged line, one blank line), but load_stones gave back " + str(len(recs)) + " records: " + _short(names) + ".")
check(all(isinstance(x["glow"], int) and isinstance(x["walk"], int) for x in recs), "glow and walk should be numbers, so they sort properly, but a record holds " + _short(recs[0]) + ".")
check([x["keeper"] for x in recs] == ["Juno", "Ada", "Bo"], "The keepers should be Juno, Ada and Bo, tidied of stray spaces, but load_stones gave " + _short([x["keeper"] for x in recs]) + ".")
check(recs[0] == {"stone": "Barn", "keeper": "Juno", "glow": 12, "walk": 3}, "The first record should be stone Barn, keeper Juno, glow 12, walk 3, but load_stones gave " + _short(recs[0]) + ".")
check(smudged != 2, "load_stones counted 2 smudged lines, but one of those is just a blank line, a gap, not a smudge.")
check(smudged == 1, "That register has 1 smudged line, but load_stones counted " + _short(smudged) + ".")
pile = [{"stone": "Barn", "keeper": "Juno", "glow": 12, "walk": 3}, {"stone": "Gate", "keeper": "Ada", "glow": 30, "walk": 5}, {"stone": "Shed", "keeper": "Bo", "glow": 12, "walk": 1}, {"stone": "Mere", "keeper": "Cy", "glow": 7, "walk": 9}]
before = [dict(x) for x in pile]
got = call("dimmest_first", pile)
check(pile == before, "dimmest_first changed the list it was given. Give back a new, sorted list instead.")
check(isinstance(got, list) and len(got) == 4, "dimmest_first should give back a list of all the records, but gave back " + _short(got) + ".")
order = [x["stone"] for x in got]
check(order[0] == "Mere", "dimmest_first should put the dimmest stone first (Mere, glow 7), but the order was " + _short(order) + ".")
check(order != ["Mere", "Barn", "Shed", "Gate"], "Barn and Shed both glow 12, so the shorter walk goes first: Shed (1 minute) before Barn (3).")
check(order == ["Mere", "Shed", "Barn", "Gate"], "dimmest_first gave the order " + _short(order) + ", but dimmest first, then shorter walk, is Mere, Shed, Barn, Gate.")
nums = _nums(out)
check(9 in nums, "Print how many stones were read from stones.csv.")
check(2 in nums, "Print how many lines of stones.csv the Hush smudged.")
first = [out.find(n) for n in ["Apothecary", "Clock Tower", "Fisher's Dock"]]
check(all(p >= 0 for p in first) and first == sorted(first), "Print the three dimmest stones, dimmest first.")
check("Mirela" in out and "Tock" in out and "Marlo" in out, "Print the keeper beside each of the three dimmest stones.")`,
      hints: [
        "Open stones.csv and read it with your own eyes first. What does each line hold? Which lines would trip up `int()`, and what should happen to them? What should one stone look like once it's in Python?",
        "`csv.DictReader` gives one dictionary per line, keyed by the header, and skips blank lines for you. Put the risky part inside `try:` and count in `except ValueError:` instead of crashing. A key function that gives back a tuple sorts by two things, like at the windows.",
        "In the loop: `try:` append `{\"stone\": row[\"stone\"].strip(), ..., \"glow\": int(row[\"glow\"]), ...}`; `except ValueError:` add 1 to `smudged`. Finish with `return stones, smudged`. Then `dimmest_first` is `sorted(records, key=___)` with a key giving back glow, then walk.",
      ],
      solution: S14,
      wrong: [
        mistake(S14, ["                    \"glow\": int(row[\"glow\"]),\n                    \"walk\": int(row[\"walk\"]),", "                    \"glow\": row[\"glow\"].strip(),\n                    \"walk\": row[\"walk\"].strip(),"]),
        mistake(S14, ["            try:\n                stones.append({", "            if True:\n                stones.append({"], ["            except ValueError:\n                smudged += 1", ""]),
        mistake(S14, ["                    \"keeper\": row[\"keeper\"].strip(),", "                    \"keeper\": row[\"keeper\"],"]),
        mistake(S14, ["    return sorted(stones, key=by_glow_then_walk)", "    stones.sort(key=by_glow_then_walk)\n    return stones"]),
        mistake(S14, ["    return (stone[\"glow\"], stone[\"walk\"])", "    return stone[\"glow\"]"]),
        mistake(S14, ["    with open(filename) as f:", "    with open(\"stones.csv\") as f:"]),
        mistake(S14, ["        for row in csv.DictReader(f):\n            try:", "        lines = f.read().split(\"\\n\")[1:]\n        for line in lines:\n            row = dict(zip([\"stone\", \"keeper\", \"glow\", \"walk\"], line.split(\",\")))\n            try:"], ["            except ValueError:", "            except (ValueError, KeyError):"]),
      ],
      done: "Thistle: Nine stones read, two smudges noted (Hazel's and Rook's; they'll light their own), and the dimmest at the top of the list. The tidiest records this valley has ever kept. I'm having them framed. Both copies.",
    },
    {
      id: "o15-night-of-lighting",
      part: "Orrery, bench and star charts",
      title: "The Night of Lighting",
      topic: "planning with your program",
      cost: { wood: 7, stone: 5 },
      intro: [
        "Odo carried up Ysolde's brass orrery, Mirela potted herbs by the door, and somebody left a blanket and a stack of books on the bench. Bram, I suspect. It looks as if someone lives up there now.",
        "Tonight's the night. At nine o'clock you walk the round from the hill, relighting the dimmest stones first, and you must be back by eleven, when the Heron stands over the dome. Each stone is a trip there, five minutes to relight, and the walk back. Any stone you can't fit in, its keeper relights.",
        "I copied your loader and sorter from the lanterns' rune into this one, so you can build on them. Big programs grow like that: one tested piece on top of another.",
      ],
      codex: ["big-programs", "generators"],
      quiz: {
        code: r`hours, mins = divmod(21 * 60 + 185, 60)
print(f"{hours % 24:02}:{mins:02}")`,
        question: "What does this program show?",
        options: ["00:05", "24:05", "0:5", "21:185"],
        answer: 0,
        why: "21 * 60 + 185 is 1445 minutes, which divmod splits into 24 hours and 5 minutes. % 24 turns 24 into 0, and :02 pads each number to two digits.",
      },
      task: [
        "`clock(minutes)`: the time on Tock's clock that many minutes after nine in the evening, with two digits for the hours and two for the minutes, like `21:00` or `00:10` (the clock goes round at midnight).",
        "`lighting_round(stones, minutes)`: a generator for your round. Go through the stones dimmest first. If a trip would bring you back later than `minutes` after nine, skip that stone (a nearer one might still fit). For each stone you do relight, yield the minute it's lit (when its five minutes are up), its name and its keeper.",
        "Write tonight's plan, back by eleven, into `night_plan.txt`: one line for each stone on your round, with its time from `clock`, the stone and its keeper. Then print how many stones you'll relight, and which keepers relight their own.",
      ],
      files: { "stones.csv": REGISTER },
      starter: r`# From the lanterns' rune (Pip copied it in): your loader and sorter.
` + LOADER + r`

# clock(minutes): the time, minutes after 21:00, as HH:MM.

# lighting_round(stones, minutes): yield (minute lit, stone, keeper) for each stone on the round.


# Tonight's plan, back by eleven, into night_plan.txt.
`,
      tests: PRE + r`import os as _os
plan = None
if _os.path.exists("night_plan.txt"):
    with open("night_plan.txt") as f:
        plan = [l.strip() for l in f if l.strip()]
got = call("clock", 0)
check(got == "21:00", "clock(0) should be '21:00', nine o'clock itself, but gave back " + _short(got) + ".")
got = call("clock", 7)
check(got != "21:7", "clock(7) gave back '21:7'. The minutes always take two digits: '21:07'.")
check(got == "21:07", "clock(7) should be '21:07', but gave back " + _short(got) + ".")
got = call("clock", 65)
check(got == "22:05", "clock(65) should be '22:05', but gave back " + _short(got) + ".")
got = call("clock", 190)
check(got != "24:10", "clock(190) gave back '24:10', but Tock's clock goes round at midnight: '00:10'.")
check(got == "00:10", "clock(190) should be '00:10', but gave back " + _short(got) + ".")
from itertools import islice as _islice
def R(stone, keeper, glow, walk):
    return {"stone": stone, "keeper": keeper, "glow": glow, "walk": walk}
recs = [R("D", "Dee", 40, 7), R("C", "Cee", 30, 2), R("B", "Bee", 20, 20), R("A", "Ay", 10, 5)]
def plan_for(minutes):
    g = call("lighting_round", recs, minutes)
    check(isinstance(g, _types.GeneratorType), "lighting_round gave back " + type(g).__name__ + ", not a generator. Use yield to hand out each stone of the round as you reach it.")
    try:
        return list(_islice(g, 20))
    except Exception as e:
        check(False, "While the rune was taking stones from lighting_round, it crashed with " + type(e).__name__ + ": " + str(e) + ".")
got = plan_for(50)
check(all(isinstance(t, tuple) and len(t) == 3 for t in got), "lighting_round should yield (minute, stone, keeper) for each stone, but yielded " + _short(got) + ".")
check(not got or got[0][1] == "A", "The round goes dimmest first, so it starts at A (glow 10), but lighting_round started at " + _short(got[0][1] if got else None) + ".")
check([t[1] for t in got] != ["A"], "With 50 minutes, B's trip won't fit, but C and D still do. Skip a stone that doesn't fit and try the next one, rather than ending the round.")
check(got[:1] != [(15, "A", "Ay")], "A is 5 minutes' walk away, so it's lit 5 + 5 = 10 minutes after nine. lighting_round said 15, which is when you'd be back.")
check(got == [(10, "A", "Ay"), (22, "C", "Cee"), (36, "D", "Dee")], "With 50 minutes, the round should be A lit at minute 10, C at 22 and D at 36 (B's trip doesn't fit), but lighting_round gave " + _short(got) + ".")
got = plan_for(60)
check(got == [(10, "A", "Ay"), (40, "B", "Bee")], "With 60 minutes, B's trip gets you back at exactly minute 60, which is in time. The round should be A at 10 and B at 40, but lighting_round gave " + _short(got) + ".")
check(plan is not None, "Write tonight's plan into night_plan.txt.")
want = [("21:13", "Apothecary", "Mirela"), ("21:32", "Clock Tower", "Tock"), ("21:49", "Fisher's Dock", "Marlo"), ("22:07", "The Forge", "Ingrid"), ("22:28", "Whistling Mill", "Wren"), ("22:46", "Scribe's Library", "Odo"), ("22:57", "Town Hall", "Thistle")]
check(len(plan) == len(want), "Tonight's round, back by eleven, has " + str(len(want)) + " stones, so night_plan.txt should have " + str(len(want)) + " lines, but it has " + str(len(plan)) + ". Did you give lighting_round the right number of minutes?")
for (t, stone, keeper), line in zip(want, plan):
    check(t in line and stone in line and keeper in line, "In night_plan.txt, " + stone + " should be lit at " + t + " by its round, with its keeper " + keeper + ", but the line says: " + line)
check(7 in _nums(out), "Print how many stones you'll relight on your round.")
check("Bram" in out and "Sable" in out, "Print which keepers relight their own stones: the ones whose stones aren't on your round.")`,
      hints: [
        "Walk one trip on paper: leave at minute 0, walk 8 minutes, relight for 5, walk 8 back. When is the stone lit? When are you home? Now: what decides whether the next trip is allowed, and what happens to the clock after it?",
        "Keep a clock variable that only moves forward. For each stone, work out when you'd be home. If that's past the limit, `continue` to the next stone; otherwise `yield` and move the clock on. `divmod(95, 60)` gives `(1, 35)`, and `f\"{7:02}\"` writes 7 as `07`.",
        "`home = now + 2 * stone[\"walk\"] + 5`. If `home` is past `minutes`, skip this stone; otherwise yield the lighting minute (`now`, plus the walk there, plus ___), the stone and the keeper, then set `now = home`. For clock: `divmod` the minutes since midnight by 60, then `% 24` the hours.",
      ],
      solution: S15,
      wrong: [
        mistake(S15, ["    return f\"{hours % 24:02}:{mins:02}\"", "    return f\"{hours % 24}:{mins}\""]),
        mistake(S15, ["    return f\"{hours % 24:02}:{mins:02}\"", "    return f\"{hours:02}:{mins:02}\""]),
        mistake(S15, ["    now = 0\n    for stone in dimmest_first(stones):\n        home = now + 2 * stone[\"walk\"] + 5\n        if home > minutes:\n            continue\n        yield now + stone[\"walk\"] + 5, stone[\"stone\"], stone[\"keeper\"]\n        now = home", "    now = 0\n    trips = []\n    for stone in dimmest_first(stones):\n        home = now + 2 * stone[\"walk\"] + 5\n        if home > minutes:\n            continue\n        trips.append((now + stone[\"walk\"] + 5, stone[\"stone\"], stone[\"keeper\"]))\n        now = home\n    return trips"]),
        mistake(S15, ["        if home > minutes:\n            continue", "        if home > minutes:\n            break"]),
        mistake(S15, ["        yield now + stone[\"walk\"] + 5, stone[\"stone\"], stone[\"keeper\"]", "        yield home, stone[\"stone\"], stone[\"keeper\"]"]),
        mistake(S15, ["        if home > minutes:", "        if home >= minutes:"]),
        mistake(S15, ["    for stone in dimmest_first(stones):", "    for stone in stones:"]),
        mistake(S15, ["round_trip = list(lighting_round(stones, 120))", "round_trip = list(lighting_round(stones, 180))"]),
        mistake(S15, ["with open(\"night_plan.txt\", \"w\") as f:\n    for minute, stone, keeper in round_trip:\n        f.write(f\"{clock(minute)} {stone} ({keeper})\\n\")", "for minute, stone, keeper in round_trip:\n    print(f\"{clock(minute)} {stone} ({keeper})\")"]),
      ],
      done: "Everything up there looks lived in now: the orrery turning, blankets on the bench, star charts rolled in a crate. And a plan for tonight, with you on the round, every keeper at their stone, and the whole village speaking at once. She'd have loved tonight.",
    },
    {
      id: "o16-great-rune",
      part: "The Great Rune",
      title: "The Great Rune",
      topic: "your own program",
      cost: { wood: 6, stone: 7 },
      intro: [
        "It's time. Lift me up a little. There. Underneath. That's it: the Great Rune. It's warm, isn't it? I kept it warm.",
        "Carry it up the hill and set it in the telescope. Every stone in the valley is lit, the keepers are at their posts, the whole town is holding its breath, and Rook is pretending not to.",
        "And then the program. Yours. The verse said *written by their own hand*, and it meant it: I can't help with this one. Not one word. Ysolde left three notes in the margin of her last page. If you're stuck, I'll read you those, and nothing else.",
        "Her page says the Great Rune is a lens for the Old Tongue itself. To wake, it has to hear how the Tongue is *taught*: every rune, each one only after the runes it's built on. A language lives while it is taught. Teach it to the lens.",
      ],
      codex: ["big-programs", "recursion-data", "recursion"],
      quiz: {
        code: r`lines = ["# note", "", "tea: water, leaves"]
kept = [l for l in lines if l and not l.startswith("#")]
print(len(kept))`,
        question: "What does this program show?",
        options: ["1", "2", "3", "0"],
        answer: 0,
        why: "The empty string counts as False, so it's dropped, and the note starting with # is dropped too. Only the line about tea is kept.",
      },
      task: [
        "Ysolde's `runes.txt` names each rune of the Old Tongue and, after a colon, the runes it is built on. Lines starting with `#` are her notes; blank lines are gaps. A rune built on nothing may have no line of its own, or a line with nothing after its colon.",
        "Teach the lens: write every rune into a new file, `great_rune.txt`, one per line, each rune exactly once, and never before a rune it is built on. Any order that keeps that rule will do.",
        "Then tell the lens how deep the great rune lies (a rune built on nothing is 1 deep; any other rune is one deeper than the deepest rune it is built on), and print it.",
        "The lens will test your program on other copies of Ysolde's runes, so it must work for any runes she might have written down this way.",
      ],
      files: { "runes.txt": RUNES },
      starter: r`# The Great Rune.
`,
      tests: PRE + r`import os as _os
def _order():
    check(_os.path.exists("great_rune.txt"), "The lens found no great_rune.txt. Write the teaching order into that file, one rune per line.")
    with open("great_rune.txt") as f:
        return [l.strip() for l in f if l.strip()]
def _needs(text):
    needs = {}
    for line in text.splitlines():
        line = line.strip()
        if line == "" or line.startswith("#"):
            continue
        rune, colon, rest = line.partition(":")
        needs[rune.strip()] = [b.strip() for b in rest.split(",") if b.strip()]
    for bases in list(needs.values()):
        for b in bases:
            needs.setdefault(b, [])
    return needs
def _depth(needs, rune):
    return 1 + max([_depth(needs, b) for b in needs[rune]] + [0])
def _judge(order, text, where, printed):
    needs = _needs(text)
    notes = [o for o in order if o.startswith("#")]
    check(not notes, "One of Ysolde's notes ended up in the teaching order" + where + ": " + _short(notes[0] if notes else "") + ". Lines starting with # are notes, not runes.")
    seen = []
    for rune in order:
        check(rune in needs, _short(rune) + " is in great_rune.txt" + where + ", but it isn't one of Ysolde's runes. Write just the rune names, one per line.")
        check(rune not in seen, rune + " is taught twice" + where + ". Teach each rune once: if a rune has already been taught, skip it.")
        for base in needs[rune]:
            check(base in seen, rune + " is taught before " + base + where + ", but " + rune + " is built on " + base + ". A rune can only be taught once everything it's built on has been.")
        seen.append(rune)
    missing = [r for r in needs if r not in seen]
    check(not missing, ", ".join(missing) + " never got taught" + where + ". A rune built on nothing may not have a line of its own, but it still needs teaching.")
    deep = _depth(needs, "great rune")
    check(deep in _nums(printed), "Now tell the lens how deep the great rune lies" + where + ". A rune built on nothing is 1 deep, and every other rune is one deeper than the deepest rune it's built on. What you printed doesn't have the right depth in it.")
_judge(_order(), files["runes.txt"], "", out)
ALT1 = "# An early draft.\ngreat rune: weaving, singing\nweaving: threads\nsinging:   breath ,  threads\n\nthreads: breath\n"
vns, vlines = with_files({"runes.txt": ALT1})
_judge(_order(), ALT1, " (with another copy of Ysolde's runes)", "\n".join(vlines))
ALT2 = "great rune: tide, ember\nember: spark, kindling\nkindling: spark\n# the oldest runes last\nspark: dawn\ntide: moon, dawn\nmoon:\ndawn:\n"
vns, vlines = with_files({"runes.txt": ALT2})
_judge(_order(), ALT2, " (with a third copy, where some runes have nothing after their colon)", "\n".join(vlines))`,
      hints: [
        "*Ysolde, in the margin:* Before you teach a rune, teach what it is built on. Before those, teach what *they* are built on. Where have you met a problem that holds smaller copies of itself? And whatever order you choose, how will you avoid teaching a rune twice?",
        "*Ysolde:* First read the runes into a dictionary: each rune, and the list of runes it is built on (an empty list when it's built on nothing). Keep a list of what has been taught. To teach a rune: if it's already taught, stop; otherwise teach each rune it's built on, then write it down. The depth has the same shape: one more than the deepest rune beneath, or 1 when there's nothing beneath.",
        "*Ysolde:* `def teach(rune):` / `    if rune in taught: return` / `    for base in needs.get(rune, []):` / `        ___` / `    taught.append(rune)`. Call it for every rune in the dictionary, then write `taught` into the file, one rune per line.",
      ],
      solution: S16,
      wrong: [
        mistake(S16, ["for rune in needs:\n    teach(rune)", "for rune in needs:\n    for base in needs[rune]:\n        if base not in needs and base not in taught:\n            taught.append(base)\n    taught.append(rune)"]),
        mistake(S16, ["for rune in needs:\n    teach(rune)", "for rune in sorted(needs):\n    taught.append(rune)\nfor rune in needs:\n    teach(rune)"]),
        mistake(S16, ["    for base in needs.get(rune, []):\n        teach(base)\n    taught.append(rune)", "    for base in needs.get(rune, []):\n        if base in needs:\n            teach(base)\n    taught.append(rune)"]),
        mistake(S16, ["    if rune in taught:\n        return\n    for base", "    for base"]),
        mistake(S16, ["    if bases == []:\n        return 1", "    if bases == []:\n        return 0"]),
        mistake(S16, ["        if line == \"\" or line.startswith(\"#\"):\n            continue", "        if line == \"\":\n            continue"], ["        rune, bases = line.split(\":\")", "        rune, colon, bases = line.partition(\":\")"]),
        mistake(S16, ["        needs[rune.strip()] = [b.strip() for b in bases.split(\",\") if b.strip() != \"\"]", "        needs[rune.strip()] = [b.strip() for b in bases.split(\",\")]"]),
        r`order = ["print", "variables", "comparisons", "if", "loops", "functions", "lists", "dictionaries", "strings", "files", "classes", "recursion", "generators", "great rune"]
with open("great_rune.txt", "w") as f:
    for rune in order:
        f.write(rune + "\n")
print("The great rune lies 9 runes deep.")`,
      ],
      done: "It's lit. It's LIT! Look at it! Look at the whole valley!",
    },
  ],
};
