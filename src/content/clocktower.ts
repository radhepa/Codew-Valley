import type { Building } from "./types.ts";

// The Clock Tower: building 10, taught with modules and list comprehensions
// (SYLLABUS.md). Each challenge adds one stage of clocktower.glb
// (art/specs/clocktower.md, stage_01 … stage_14), so the building has exactly 14
// challenges. Tock the tinkerer arrives when the chapter opens and speaks lines
// that start with "Tock: ".
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks. The tasks
// describe what to print in words, so the checks look for the right values in
// whatever the program printed instead of matching whole lines:
//   again(("side = 4", "side = 5"))  -> (variables, printed lines) of a variant
//   shows(lines, 5.66)    a number printed on its own (5.66, not 5.667 or 15.66)
//   near(lines, 5.66, g)  some printed number within g of it
//   shown(lines, value)   a printed list or dictionary exactly like value
//   at(lines, "4:15")     a clock time printed on its own (not inside 14:15; 04:15 counts)
//   nodes("ListComp")     how many of that kind of piece the program has
const PRE = r`import ast, re, math

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the starting values, so it fits any of them, not just today's.")

def shows(got, value):
    pat = r"(?<![\d.:])" + re.escape(str(value)) + r"(?!\d|[.:]\d)"
    return any(re.search(pat, line) for line in got)

def near(got, value, gap):
    for line in got:
        for t in re.findall(r"\d+(?:\.\d+)?", line):
            if abs(float(t) - value) <= gap:
                return True
    return False

def printed(got):
    found = []
    for line in got:
        depth = 0
        start = 0
        for i, ch in enumerate(line):
            if ch in "[{":
                if depth == 0:
                    start = i
                depth += 1
            elif ch in "]}" and depth > 0:
                depth -= 1
                if depth == 0:
                    try:
                        found.append(ast.literal_eval(line[start:i + 1]))
                    except Exception:
                        pass
    return found

def shown(got, want):
    return any(repr(x) == repr(want) for x in printed(got))

def at(got, t):
    pat = r"(?<![\d:])0?" + re.escape(t) + r"(?![\d:])"
    return any(re.search(pat, line) for line in got)

def nodes(kind):
    return sum(1 for n in ast.walk(ast.parse(src)) if type(n).__name__ == kind)

`;

const CREW = `["Bram", "Wren", "Marlo", "Sable", "Hazel", "Ingrid", "Odo", "Mirela", "Thistle"]`;
const STONES = `["grey", "blue", "speckled", "cracked?", "mossy", "pale", "square-ish", "Tock's favourite"]`;
const TURNS = `turns = [date(2026, 12, 21), date(2027, 3, 20), date(2027, 6, 21), date(2027, 9, 23)]`;
const REQUESTS = `requests = [360, 405, 480, 690, 720, 1035, 1080, 1260, 1275]`;
const GEARS = `gears = {"gable cog": 10, "rod gear": 32, "hour wheel": 48, "bell trip": 8, "vane gear": 16}`;

// The capstone's listed mistakes are one program with one piece changed each.
const WEEK_WRONG = (chimes: string, tins: string, days: string, test: string) => `import math
from datetime import date, timedelta
restart = date(2026, 10, 21)
first = 420
last = 1320
every = 75
drops = 3
tin = 250
days = 61
market = "Saturday"
def dial(minutes):
    hour, minute = divmod(minutes, 60)
    hour = hour % 12
    if hour == 0:
        hour = 12
    return f"{hour}:{minute:02}"
${chimes}
print("Chimes:", chimes)
${tins}
print("Oil until the season turns:", tins, "tins")
for i in ${days}:
    d = restart + timedelta(days=i)
    print(d.strftime("%A %d %B") + ":", "long" if ${test} else "short")`;

export const CLOCKTOWER: Building = {
  id: "clocktower",
  name: "The Clock Tower",
  blurb: "The valley's clock, stopped for three hundred years.",
  villager: { name: "Tock", model: "tinker", arrives: "start" },
  opening: [
    "Hello hello, founder. Don't mind Pip. Pip is a little... see-through this morning. It's the light. Don't look at Pip's tail. The tail is fine.",
    "Tock: Hello! Hold this. No, the other end. Ah! Perfect. You're a natural. Don't let go.",
    "Tock: Tock. Tinkerer. I heard there was a new town with a charter and no clock. A town without a clock is just a lot of people being late together.",
    "Tock: And then, up on the knoll, in the long grass: dial stones. Old ones. And two iron hands, rusted solid. Stopped at a quarter past four.",
    "Tock: Here's the odd part. The sundial by the mill path, the water clock in the race, these hands: every clock in the valley stopped at the same moment. Three hundred years ago.",
    "The Long Quiet. Pip... has heard the stories. Just stories.",
    "Tock: And the valley stopped with them. Look at the willows. Same leaves, always. The days blur. No proper nights, no proper seasons. Nothing gets counted. Things that aren't counted get lost.",
    "Tock: So I'll build a tower, and a clock to carry the old hands, and we start the valley ticking again. But a clock is all numbers. Seconds, gears, dates. Ah! I need someone who counts faster than me.",
    "Python can help! And here's a secret: not every tool has to be built from scratch. Python comes with **modules**, boxes of ready-made tools you `import`. Act Three, founder. Let's build The Clock Tower!",
  ],
  finale: [
    "Tock: Lanterns lit. Sign hung. Oil in every gear. Six times. Seven. Everyone stand back. Further. Not that far, Bram, you'll miss it.",
    "Tock: Three. Two. One.",
    "Tick.",
    "Tock: ...Tock. Ah! AH! It's running! The hands moved! Quarter past four and one second! And two! And three!",
    "The bell! Listen to the bell! And look, look at the willows. They're going gold at the edges. Autumn. The valley's first autumn in three hundred years.",
    "Wren: The sky's going pink. Is that... evening? A proper one?",
    "Bram: First proper night in three hundred years, and I've nothing on the stove. Everyone back to the Serpent. Tock, bring your bell.",
    "Tock: I can't bring the bell. It weighs nine hundred pounds. I'll bring a small one. I've got a small one. I've always got a small one.",
    "Something in Pip's chest just went *tick*. Pip feels... a little more here. Like a knot came loose somewhere. Somewhere north.",
    "Tock: Founder. Here. Sit on the second stool. Just for a minute. ...You're the first one who's stayed past an afternoon.",
  ],
  chatDuring: [
    "Tock: Your boot lace is coming undone. Not yet. In about forty minutes. Hold still. There. Double knot. You're welcome.",
    "Tock: Python folk keep their tools in modules and only open the box they need. My workshop has eleven boxes. All open. That's different.",
    "Tock: Pip asked me to look at the old hands. Then asked me not to. Then asked what time they'd stopped at, very quietly, as if Pip didn't already know.",
    "Tock: I count everything. Stones, steps, seconds. Five hundred and twelve steps from here to the tavern. Five hundred and eleven if Bram's put the stew on.",
  ],
  chatAfter: [
    "Tock: Hear it? Tick, tick, tick. The whole valley's going round again. Days, nights, seasons. I oil it at dusk. Forty-two turns of the key. Not forty-one.",
    "Tock: The old hands are on the new dial, right where they belong. They were stopped at a quarter past four. Now they're never stopped. Lovely.",
    "Tock: The seasons are back on the board. Next turn's in winter. I've already oiled the winter. Well. The gears that do winter.",
    "Tock: There's a second stool at my bench. Nobody's ever stayed on it longer than an afternoon. You've sat on it twice. I counted. Of course I counted.",
  ],
  chronicle: {
    title: "The Binding",
    text: [
      "The last of the speakers left in the spring. By the autumn the stones answered no one but me, and only in a whisper. On the twenty-first of September, at a quarter past four in the afternoon, the great stone on the green went dark, and every clock in Willowmere stopped with it, as if the valley had decided to hold its breath until somebody came back.",
      "I am old now, and I cannot hold my breath that long. But a language does not die while one voice still keeps it. So I have asked the bravest small heart I know to keep it for me. With the last true rune I had, I bound my familiar to the last stone: to keep it warm, to keep the Old Tongue in it, and to wait for a new speaker, however long that takes.",
      "It argued, of course. It has never once in its life let me have the last word. I am told it will forget a great deal over so many years, and grow faint when no one speaks. Let it forget whatever it must. I do not think it will forget how to talk.",
      "Forgive me, little one. When they come, and they will come, teach them everything. Then let them set you free.",
    ],
  },
  challenges: [
    {
      id: "c01-corner-to-corner",
      part: "Survey stakes",
      title: "Corner to Corner",
      topic: "import math: sqrt and pi",
      cost: { wood: 3, stone: 4 },
      intro: [
        "Tock: Stakes in. String tight. Now: is it square? A square is honest when its two corner-to-corner strings come out exactly as long as they should. I know how long that is.",
        "Tock: The old surveyors' rule: multiply the side by itself, do it again for the other side, add the two, and take the **square root** of the total. Square roots I do with a pencil. It takes an hour. The pencil hates me.",
        "Tock: And while I'm here: the clock face will be round, with a brass rim all the way round it. All the way round a circle is **pi** times the width across. Pi goes on forever. I stop at 3.14 and feel bad about it.",
        "No need to feel bad! The **math** module knows square roots and every digit of pi. `import math` at the top, then reach in with a dot: `math.sqrt(...)` and `math.pi`.",
      ],
      codex: ["modules", "math-module"],
      quiz: {
        code: r`import math
print(math.sqrt(49))`,
        question: "What does this program show?",
        options: ["7.0", "7", "49", "NameError"],
        answer: 0,
        why: "math.sqrt always hands back a float, even when the square root comes out whole, so it prints 7.0.",
      },
      task: [
        "Work out how long each corner-to-corner string should be on a square plot `side` metres along every edge, using the surveyors' rule.",
        "Work out the length of the brass rim that goes all the way round the clock face, which is `dial` metres across.",
        "Print both lengths, each rounded to 2 decimal places, with words that say which is which.",
        "Let the math module do the maths: no square roots worked out by hand, and no 3.14.",
      ],
      starter: r`side = 4       # metres along each edge of the tower's square plot
dial = 2.4     # metres across the round clock face

# 1. The corner-to-corner string
# 2. The brass rim, all the way round the clock face
# 3. Print both, rounded to 2 decimal places
`,
      tests: PRE + r`check(not any(type(n).__name__ == "Constant" and isinstance(n.value, float) and abs(n.value - 3.14) < 0.002 for n in ast.walk(ast.parse(src))), "Let math.pi do the work instead of typing 3.14. The real pi goes on and on, and the rim needs every bit of it.")
def survey(got, side, dial):
    d = round(math.sqrt(side * side + side * side), 2)
    rim = round(math.pi * dial, 2)
    when = " (with side = " + str(side) + " and dial = " + str(dial) + ")"
    if not shows(got, d):
        check(not near(got, d, 0.01), "The corner-to-corner length is right, but round it to 2 decimal places before you print it" + when + ".")
        check(False, "The corner-to-corner string isn't the right length yet" + when + ". A diagonal is longer than one edge but shorter than two. Follow the surveyors' rule: side times side, plus side times side, then the square root of the total.")
    if not shows(got, rim):
        check(not near(got, rim, 0.01), "The rim is right, but round it to 2 decimal places before you print it" + when + ".")
        check(not near(got, math.pi * dial / 2, 0.01), "That rim only reaches halfway round" + when + ". All the way round a circle is pi times the whole width across.")
        check(False, "The brass rim isn't the right length yet" + when + ". All the way round a circle is pi times the width across.")
survey(lines, 4, 2.4)
survey(again(("side = 4", "side = 5"))[1], 5, 2.4)
survey(again(("dial = 2.4", "dial = 10"))[1], 4, 10)`,
      hints: [
        "Two separate sums, each one line. Say the surveyors' rule out loud with the number 4 and see what you'd do on paper. Which step needs a tool you don't have yet?",
        "After `import math`, the tools are `math.sqrt(...)` and `math.pi`, and they mix with ordinary maths: a round pond 3 m from middle to edge covers `math.pi * 3 * 3` square metres. `round(value, 2)` keeps 2 decimal places.",
        "The string is `math.sqrt(side * side + ...)`, and the rim is `math.pi` times one of the starting values. Print each with `round(..., 2)` and a few words.",
      ],
      solution: r`import math

side = 4
dial = 2.4

diagonal = math.sqrt(side * side + side * side)
rim = math.pi * dial
print(f"Corner to corner: {round(diagonal, 2)} m")
print(f"Brass rim: {round(rim, 2)} m")`,
      wrong: [r`side = 4
dial = 2.4
diagonal = math.sqrt(side * side + side * side)
rim = math.pi * dial
print(f"Corner to corner: {round(diagonal, 2)} m")
print(f"Brass rim: {round(rim, 2)} m")`, r`import math
side = 4
dial = 2.4
diagonal = math.sqrt(side * side + side * side)
rim = 3.14 * dial
print(f"Corner to corner: {round(diagonal, 2)} m")
print(f"Brass rim: {round(rim, 2)} m")`, r`import math
side = 4
dial = 2.4
diagonal = math.sqrt(side * side + side * side)
rim = math.pi * dial
print(f"Corner to corner: {diagonal} m")
print(f"Brass rim: {rim} m")`, r`import math
side = 4
dial = 2.4
diagonal = math.sqrt(side * side + side * side)
rim = math.pi * dial / 2
print(f"Corner to corner: {round(diagonal, 2)} m")
print(f"Brass rim: {round(rim, 2)} m")`, r`import math
side = 4
dial = 2.4
diagonal = math.sqrt(side * side)
rim = math.pi * dial
print(f"Corner to corner: {round(diagonal, 2)} m")
print(f"Brass rim: {round(rim, 2)} m")`, r`import math
side = 4
dial = 2.4
print("Corner to corner: 5.66 m")
print("Brass rim: 7.54 m")`],
      done: "Tock: Five point six six, both ways. Honest as a Tuesday. And seven and a half metres of brass for the rim. Ah! I'll order eight. Things shrink when you look away.",
    },
    {
      id: "c02-sixty-four-flagstones",
      part: "Stone plinth",
      title: "Sixty-Four Flagstones",
      topic: "from math import, and as",
      cost: { wood: 0, stone: 9 },
      intro: [
        "Tock: The plinth! Big rounded blocks round the edge, flagstones on top. The flagstones go down in one big square, the same number along every edge. I've a pile of them. How many along each edge? Ah! Square root again.",
        "Tock: Yesterday I wrote `math.` eleven times. Eleven! My pencil wore down to a stub. I'm very fond of that pencil.",
        "Ssso let's not write it! `from math import sqrt` takes the `sqrt` tool out of the box, so you can call it on its own. The Codex shows how, and a trick called `as` for giving a module a shorter name.",
      ],
      codex: ["from-import", "modules"],
      quiz: {
        code: r`from math import pi
print(round(math.pi, 2))`,
        question: "What does this program show?",
        options: ["NameError", "3.14", "3.1", "3.141592653589793"],
        answer: 0,
        why: "from math import pi brings out pi and nothing else. The name math itself was never made, so math.pi is a NameError. Here you'd write round(pi, 2).",
      },
      task: [
        "The pile of `flagstones` is laid as one square, with the same number of stones along every edge. Work out that number, as a whole number: a stone is a stone, not 8.0 of one.",
        "Work out how wide that square floor is in metres. Each flagstone is `stone_size` metres along its edge.",
        "Print both, then a line that says `True` or `False`: is the floor wide enough to cover the whole `plinth` (at least as wide)?",
        "Bring `sqrt` in with `from ... import`, so your program never needs to write `math.`",
      ],
      starter: r`flagstones = 64     # flagstones in the pile (always a square number)
stone_size = 0.5    # metres along one flagstone's edge
plinth = 4          # metres across the stone plinth

# 1. Flagstones along each edge (a whole number)
# 2. How wide the floor is
# 3. Is it wide enough to cover the plinth?
`,
      tests: PRE + r`check(nodes("ImportFrom") > 0, "Bring sqrt out of the math box with from ... import, so you can call it on its own.")
check("math." not in src, "With from math import, the tool comes out of the box: call it on its own, with no math. in front.")
def floor(got, n, size, plinth):
    k = int(math.sqrt(n))
    w = k * size
    when = " (with " + str(n) + " flagstones of " + str(size) + " m and a plinth " + str(plinth) + " m across)"
    check(not shows(got, str(k) + ".0"), str(k) + ".0 flagstones? A stone is a stone. Turn the square root into a whole number before you print it" + when + ".")
    check(shows(got, k), "The number of flagstones along an edge isn't right yet" + when + ". The pile is laid as a square, so an edge's count times itself gives back the whole pile.")
    check(shows(got, w), "The floor's width isn't right yet" + when + ". Every flagstone along one edge adds its own size to the width.")
    verdict = [l for l in got if "True" in l or "False" in l]
    check(len(verdict) == 1, "Finish with one line that says True or False: is the floor wide enough to cover the plinth?")
    says = "True" in verdict[0]
    if w >= plinth and not says:
        check(w != plinth, "The floor is exactly as wide as the plinth" + when + ", and that covers it: wide enough means at least as wide.")
        check(False, "This floor is wide enough to cover the plinth" + when + ", but your line says False.")
    check(w >= plinth or not says, "This floor is too narrow to cover the plinth" + when + ", but your line says True. Compare the floor's width with the plinth, not the number of stones.")
floor(lines, 64, 0.5, 4)
floor(again(("flagstones = 64", "flagstones = 81"))[1], 81, 0.5, 4)
floor(again(("flagstones = 64", "flagstones = 49"))[1], 49, 0.5, 4)
floor(again(("stone_size = 0.5", "stone_size = 0.25"))[1], 64, 0.25, 4)
floor(again(("plinth = 4", "plinth = 5"))[1], 64, 0.5, 5)`,
      hints: [
        "On paper: if 25 stones make a square, how many are along each edge? What did you just do to 25? Then think about what one row of stones measures end to end.",
        "`from math import sqrt` at the top lets you write `sqrt(25)` on its own. It gives `5.0`, and `int(...)` turns that into `5`. A comparison like `pond >= field` is already True or False, so you can print it straight away.",
        "`per_edge = int(sqrt(...))`, then the width is `per_edge` times one of the starting values, and the last line prints `width >= ...` with some words.",
      ],
      solution: r`from math import sqrt

flagstones = 64
stone_size = 0.5
plinth = 4

per_edge = int(sqrt(flagstones))
width = per_edge * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {width >= plinth}")`,
      wrong: [r`import math
flagstones = 64
stone_size = 0.5
plinth = 4
per_edge = int(math.sqrt(flagstones))
width = per_edge * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {width >= plinth}")`, r`from math import sqrt
flagstones = 64
stone_size = 0.5
plinth = 4
per_edge = sqrt(flagstones)
width = per_edge * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {width >= plinth}")`, r`from math import sqrt
flagstones = 64
stone_size = 0.5
plinth = 4
per_edge = int(sqrt(flagstones))
width = per_edge * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {width > plinth}")`, r`from math import sqrt
flagstones = 64
stone_size = 0.5
plinth = 4
per_edge = int(sqrt(flagstones))
width = flagstones * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {width >= plinth}")`, r`from math import sqrt
flagstones = 64
stone_size = 0.5
plinth = 4
per_edge = int(sqrt(flagstones))
width = per_edge * stone_size
print(f"{per_edge} flagstones along each edge")
print(f"The floor is {width} m wide")
print(f"Covers the plinth: {per_edge >= plinth}")`, r`from math import sqrt
flagstones = 64
print("8 flagstones along each edge")
print("The floor is 4.0 m wide")
print("Covers the plinth: True")`],
      done: "Tock: Eight by eight, edge to edge, not a crack of daylight. And not one `math.` in sight. My pencil sends its thanks. It's resting.",
    },
    {
      id: "c03-courses-rungs-gears",
      part: "Lower shaft",
      title: "Courses, Rungs and Gears",
      topic: "math.floor, ceil and gcd",
      cost: { wood: 2, stone: 8 },
      intro: [
        "Tock: The lower shaft goes up in stone courses, every course the same height, until it reaches the plank floor. A course can't stop halfway. If we're short, we lay one more and trim the top.",
        "Tock: The ladder's the other way round. A rung sits at the top of each gap, and a rung poking up through the floor is a rung somebody trips on. Only whole gaps count.",
        "Tock: And while the mortar sets: gears. Mark one tooth on my big drive gear and one on the small one, and start them touching. How many teeth go by before the two marks touch again? My rule: one gear's teeth times the other's, divided by the **greatest common divisor** of the two. The biggest number that divides both evenly.",
        "Rounding up, rounding down, and the greatest common divisor. The `math` box has a tool for each one. Peek in the Codex!",
      ],
      codex: ["math-module", "modules"],
      quiz: {
        code: r`import math
print(math.floor(7.9), math.ceil(7.1))`,
        question: "What does this program show?",
        options: ["7 8", "8 7", "8 8", "7.0 8.0"],
        answer: 0,
        why: "floor always goes down (7.9 becomes 7) and ceil always goes up (7.1 becomes 8), whichever whole number is nearer. Both give back ints.",
      },
      task: [
        "Work out how many courses of stone, each `course` cm high, it takes to reach at least `floor_height` cm.",
        "Work out how many rungs fit on the ladder: one at the top of every `rung_gap` cm going up from the plinth, and none above the floor (a rung exactly level with the floor is fine).",
        "Work out how many teeth go by before the marked teeth of the `big_gear` and the `small_gear` touch again, using Tock's rule. Teeth come whole.",
        "Print the three answers with words that say what each one is.",
      ],
      starter: r`floor_height = 420   # cm from the plinth up to the plank floor
course = 32          # cm: the height of one course of stone
rung_gap = 27        # cm between one ladder rung and the next
big_gear = 16        # teeth on Tock's big drive gear
small_gear = 10      # teeth on the small gear

# 1. Courses of stone to reach the floor
# 2. Rungs that fit on the ladder
# 3. Teeth that go by before the marks touch again
`,
      tests: PRE + r`def shaft(got, h, c, g, a, b):
    courses = math.ceil(h / c)
    rungs = h // g
    meet = a * b // math.gcd(a, b)
    when = " (with floor_height = " + str(h) + ", course = " + str(c) + ", rung_gap = " + str(g) + " and gears of " + str(a) + " and " + str(b) + " teeth)"
    if not shows(got, courses):
        check(not (h % c != 0 and shows(got, h // c)), "That many courses stops short of the floor" + when + ". A course can't stop halfway: if any height is left over, one more course goes on.")
        check(not (h % c == 0 and shows(got, h // c + 1)), "One course too many" + when + ". Here the courses reach the floor exactly, with nothing left over, so no extra course is needed.")
        check(False, "The number of courses isn't right yet" + when + ".")
    if not shows(got, rungs):
        check(not shows(got, rungs + 1), "That's one rung too many" + when + ": the top one would poke up through the floor. Only whole gaps fit, so round down.")
        check(False, "The number of rungs isn't right yet" + when + ".")
    check(not shows(got, str(meet) + ".0"), str(meet) + ".0 teeth? Teeth come whole: use the division that keeps whole numbers.")
    if not shows(got, meet):
        check(not shows(got, a * b), "Too many teeth" + when + ": that's just the two counts multiplied. Tock's rule then divides by their greatest common divisor.")
        check(False, "The teeth before the marks touch again aren't right yet" + when + ". Tock's rule: one gear's teeth times the other's, divided by their greatest common divisor.")
shaft(lines, 420, 32, 27, 16, 10)
shaft(again(("course = 32", "course = 30"))[1], 420, 30, 27, 16, 10)
shaft(again(("rung_gap = 27", "rung_gap = 28"))[1], 420, 32, 28, 16, 10)
shaft(again(("big_gear = 16", "big_gear = 12"), ("small_gear = 10", "small_gear = 8"))[1], 420, 32, 27, 12, 8)
shaft(again(("big_gear = 16", "big_gear = 7"), ("small_gear = 10", "small_gear = 5"))[1], 420, 32, 27, 7, 5)`,
      hints: [
        "Work each one out on paper first. 420 ÷ 32 isn't whole: what do you do with the leftover bit for the stones, and what for the ladder? For the gears, try a tiny case: gears of 4 and 6 teeth.",
        "`math.ceil(23 / 6)` is 4 and `math.floor(23 / 6)` is 3, so pick by the story: \"enough to reach\" goes up, \"only whole ones fit\" goes down. `math.gcd(4, 6)` is 2, and `//` divides without a `.0`.",
        "Courses: `math.____(floor_height / course)`. Rungs: `math.____(...)` of the ladder's division. Fill each blank by asking \"up or down?\". Gears: `big_gear * small_gear // math.gcd(..., ...)`.",
      ],
      solution: r`import math

floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10

courses = math.ceil(floor_height / course)
rungs = math.floor(floor_height / rung_gap)
meet = big_gear * small_gear // math.gcd(big_gear, small_gear)
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`,
      wrong: [r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
courses = floor_height // course
rungs = math.floor(floor_height / rung_gap)
meet = big_gear * small_gear // math.gcd(big_gear, small_gear)
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`, r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
courses = floor_height // course + 1
rungs = math.floor(floor_height / rung_gap)
meet = big_gear * small_gear // math.gcd(big_gear, small_gear)
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`, r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
courses = math.ceil(floor_height / course)
rungs = round(floor_height / rung_gap)
meet = big_gear * small_gear // math.gcd(big_gear, small_gear)
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`, r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
courses = math.ceil(floor_height / course)
rungs = math.floor(floor_height / rung_gap)
meet = big_gear * small_gear
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`, r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
courses = math.ceil(floor_height / course)
rungs = math.floor(floor_height / rung_gap)
meet = big_gear * small_gear / math.gcd(big_gear, small_gear)
print(f"Courses of stone: {courses}")
print(f"Ladder rungs: {rungs}")
print(f"The marked teeth touch again after {meet} teeth")`, r`import math
floor_height = 420
course = 32
rung_gap = 27
big_gear = 16
small_gear = 10
print("Courses of stone: 14")
print("Ladder rungs: 15")
print("The marked teeth touch again after 80 teeth")`],
      done: "Tock: Fourteen courses, fifteen rungs, and the marks kiss every eighty teeth. Ah! I knew it was eighty. I just like being told.",
    },
    {
      id: "c04-lots-for-the-shaft",
      part: "Upper shaft",
      title: "Lots for the Upper Shaft",
      topic: "random: choice, shuffle and sample",
      cost: { wood: 2, stone: 9 },
      intro: [
        "Tock: The upper shaft needs the whole town carrying stone. Everyone wants to go first. Everyone wants to set the last stone. Nobody wants to carry the mortar.",
        "Tock: So: lots. Fair ones. I mix up the carrying order so everyone carries once, I pick three different stones from the pile to test with my hammer, and one lucky name sets the last stone.",
        "Remember `random` from the dock? It works with lists too: there's a tool for picking one thing, one for mixing a whole list, and one for picking several different things. And the **seed** keeps the lots repeatable, so nobody can say Tock rolled again until he liked it.",
      ],
      codex: ["random-lists", "modules"],
      quiz: {
        code: r`import random
bag = ["a", "b", "c"]
result = random.shuffle(bag)
print(result)`,
        question: "What does this program show?",
        options: ["None", "['b', 'c', 'a']", "a", "TypeError"],
        answer: 0,
        why: "shuffle mixes the list where it stands and hands back None. Print bag itself to see the new order.",
      },
      task: [
        "Mix up the carrying order of the whole `crew`, so everyone carries once, in a random order. Print the order as a list.",
        "Pick three different stones from `stones` for the hammer test: no stone can be tested twice. Print them as a list.",
        "Pick one person from the crew to set the last stone, and print a line naming them.",
        "Keep the seed line exactly as it is: the rune checks your lots with other seeds.",
      ],
      starter: r`import random
random.seed(12)   # the same lots every run (the rune tries other seeds)

crew = ${CREW}
stones = ${STONES}

# 1. The carrying order
# 2. Three different stones for the hammer
# 3. Who sets the last stone
`,
      tests: PRE + r`crew0 = ${CREW}
stones0 = ${STONES}
seen = []
for seed in range(1, 13):
    vns, got = again(("random.seed(12)", "random.seed(" + str(seed) + ")"))
    check("None" not in " ".join(got), "None got printed. shuffle mixes a list where it stands and hands back None, so mix the crew, then print the crew itself.")
    found = [x for x in printed(got) if isinstance(x, list)]
    orders = [x for x in found if sorted(x) == sorted(crew0)]
    check(orders, "Print the whole crew's carrying order as a list: every name once, in a mixed-up order.")
    tests = [x for x in found if len(x) == 3 and all(t in stones0 for t in x)]
    check(tests, "Print the three stones for the hammer test as a list, picked from the stones.")
    check(len(set(tests[0])) == 3, "With some seeds the same stone gets picked twice for the hammer test. Pick all three together, with the tool that never repeats an item.")
    words = [l for l in got if "[" not in l]
    named = tuple(n for n in crew0 if any(n in l for l in words))
    check(named, "Print a line naming who sets the last stone, picked from the crew (not inside a list).")
    seen.append((tuple(orders[0]), tuple(tests[0]), named))
check(any(s[0] != tuple(crew0) for s in seen), "The carrying order is always the crew's order from the starter. Mix the crew up with the random module.")
check(len(set(s[0] for s in seen)) > 1, "The carrying order is the same whatever the seed. Let random mix it.")
check(len(set(s[1] for s in seen)) > 1, "The hammer-test stones are the same whatever the seed. Let random pick them.")
check(len(set(s[2] for s in seen)) > 1, "The same person sets the last stone whatever the seed. Let random pick them from the crew.")`,
      hints: [
        "Three different kinds of draw: mix everyone, pick several that can't repeat, pick just one. Which `random` tool fits each? And for the mixing one, what does it give back?",
        "On other values: `random.shuffle(cards)` changes `cards` itself (then `print(cards)`), `random.sample(apples, 2)` gives a new list of 2 different apples, and `random.choice(pies)` gives one pie.",
        "`random.shuffle(crew)` on its own line, then `print(crew)`. For the hammer test, the tool that draws several different items at once, told how many. For the last stone, `random.____(...)` with the list the name comes from.",
      ],
      solution: r`import random
random.seed(12)

crew = ${CREW}
stones = ${STONES}

random.shuffle(crew)
print("Carrying order:", crew)
tested = random.sample(stones, 3)
print("Stones for the hammer:", tested)
print("Setting the last stone:", random.choice(crew))`,
      wrong: [r`import random
random.seed(12)
crew = ${CREW}
stones = ${STONES}
crew = random.shuffle(crew)
print("Carrying order:", crew)
print("Stones for the hammer:", random.sample(stones, 3))
print("Setting the last stone:", random.choice(${CREW}))`, r`import random
random.seed(12)
crew = ${CREW}
stones = ${STONES}
random.shuffle(crew)
print("Carrying order:", crew)
tested = [random.choice(stones), random.choice(stones), random.choice(stones)]
print("Stones for the hammer:", tested)
print("Setting the last stone:", random.choice(crew))`, r`import random
random.seed(12)
crew = ${CREW}
stones = ${STONES}
random.shuffle(crew)
print("Carrying order:", crew)
print("Stones for the hammer:", random.sample(stones, 3))
print("Setting the last stone:", random.choice(stones))`, r`import random
random.seed(12)
crew = ${CREW}
stones = ${STONES}
print("Carrying order:", crew)
print("Stones for the hammer:", random.sample(stones, 3))
print("Setting the last stone:", random.choice(crew))`, r`import random
random.seed(12)
crew = ${CREW}
stones = ${STONES}
print("Carrying order:", ["Odo", "Bram", "Wren", "Thistle", "Marlo", "Sable", "Mirela", "Hazel", "Ingrid"])
print("Stones for the hammer:", ["mossy", "pale", "grey"])
print("Setting the last stone: Hazel")`],
      done: "Tock: Seven point eight metres of stone, carried in a fair order, hammer-tested, and nobody argued. Well. Bram argued. He argues with dice.",
    },
    {
      id: "c05-the-date-stone",
      part: "Arched door",
      title: "The Date Stone",
      topic: "datetime.date",
      cost: { wood: 8, stone: 2 },
      intro: [
        "Tock: Door's hung. Arched, green, iron straps, a ring you could swing on. Please don't swing on it. Above it goes a date stone: the day the door was hung, the weekday, and how long the valley waited for it.",
        "The clock stopped on the twenty-first of September, three hundred years ago. In the afternoon. Pip knows because... because Tock said. Didn't Tock say?",
        "Tock: I didn't say.",
        "Ahem. Dates are tricky by hand: months are different lengths, and which weekday was it? The `datetime` module has a `date` for that. Every date knows its year, its month, its day, and which day of the week it falls on.",
      ],
      codex: ["dates", "from-import"],
      quiz: {
        code: r`from datetime import date
d = date(2026, 1, 5)
print(d.weekday())`,
        question: "What does this program show? (5 January 2026 was a Monday.)",
        options: ["0", "1", "5", "Monday"],
        answer: 0,
        why: ".weekday() counts from 0 for Monday up to 6 for Sunday, and it gives a number, not a name.",
      },
      task: [
        "Make a date for the day the door was hung, from `year`, `month` and `day`.",
        "Print the weekday it fell on as a word, with the help of Tock's `day_names`.",
        "Print how many years had passed since the clock stopped (that day is `stopped`).",
        "If the door was hung on the clock's anniversary (the same month and day that it stopped), print a line with the word `anniversary` in it. Otherwise, say nothing more.",
      ],
      starter: r`from datetime import date

stopped = date(1726, 9, 21)    # the day the valley clock stopped

year = 2026                    # the day the door was hung
month = 9
day = 21

day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# 1. The day the door was hung, as a date
# 2. Its weekday, as a word
# 3. Years since the clock stopped
# 4. The anniversary?
`,
      tests: PRE + r`from datetime import date
names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
def stone(got, y, m, d, stopped=date(1726, 9, 21)):
    hung = date(y, m, d)
    when = " (for a door hung on " + hung.isoformat() + ")"
    said = [n for n in names if any(n in l for l in got)]
    check(said, "Print the weekday the door was hung on as a word, like Friday" + when + ". .weekday() gives a number; day_names turns it into a word.")
    check(len(said) == 1, "Print just the one weekday the door was hung on, not the whole list of names" + when + ".")
    check(said[0] == names[hung.weekday()], "The weekday isn't right yet" + when + ". Check which number .weekday() gives for a Monday, and where Monday sits in day_names.")
    when = " (for a door hung on " + hung.isoformat() + ", with the clock stopped on " + stopped.isoformat() + ")"
    check(shows(got, y - stopped.year), "The years since the clock stopped aren't right yet" + when + ". Count from the year in stopped to the year the door was hung.")
    told = "anniversary" in " ".join(got).lower()
    if (m, d) == (stopped.month, stopped.day):
        check(told, "This door was hung on the very same month and day the clock stopped" + when + ", but your program doesn't mention the anniversary.")
    else:
        check(not told, "That's not the anniversary" + when + ": the month and the day must both match the day the clock stopped.")
stone(lines, 2026, 9, 21)
stone(again(("day = 21", "day = 22"))[1], 2026, 9, 22)
stone(again(("month = 9", "month = 10"))[1], 2026, 10, 21)
stone(again(("year = 2026", "year = 2031"))[1], 2031, 9, 21)
stone(again(("stopped = date(1726, 9, 21)", "stopped = date(1730, 3, 2)"))[1], 2026, 9, 21, date(1730, 3, 2))`,
      hints: [
        "Four small jobs, in order. The date first, because the other three all ask it questions. For the anniversary: what two things have to match, and what mustn't be compared?",
        "On another date: `fair = date(2026, 6, 20)`, then `fair.year`, `fair.month`, `fair.day` are numbers and `fair.weekday()` is 0 to 6 with 0 for Monday, ready to use as an index: `names[fair.weekday()]`.",
        "`hung = date(year, month, day)`, then print `day_names[...]` and `hung.year - ...`. Last: `if hung.month == stopped.month and ...:` with its anniversary line.",
      ],
      solution: r`from datetime import date

stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

hung = date(year, month, day)
print("The door was hung on a", day_names[hung.weekday()])
print(hung.year - stopped.year, "years since the clock stopped")
if hung.month == stopped.month and hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`,
      wrong: [r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on a", day_names[hung.weekday() - 1])
print(hung.year - stopped.year, "years since the clock stopped")
if hung.month == stopped.month and hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`, r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on a", day_names[hung.weekday()])
print(hung.year - stopped.year, "years since the clock stopped")
if hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`, r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on a", day_names[hung.weekday()])
print(hung.year - stopped.year, "years since the clock stopped")
if hung == stopped:
    print("Hung on the clock's anniversary!")`, r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on a", day_names[hung.weekday()])
print("300 years since the clock stopped")
if hung.month == stopped.month and hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`, r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on day", hung.weekday())
print(hung.year - stopped.year, "years since the clock stopped")
if hung.month == stopped.month and hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`, r`from datetime import date
stopped = date(1726, 9, 21)
year = 2026
month = 9
day = 21
day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
hung = date(year, month, day)
print("The door was hung on a", day_names[hung.isoweekday()])
print(hung.year - stopped.year, "years since the clock stopped")
if hung.month == stopped.month and hung.day == stopped.day:
    print("Hung on the clock's anniversary!")`],
      done: "Tock: Monday, three hundred years to the day. Ah. Ah! I didn't plan that. I plan everything. I didn't plan that. ...Pip? Pip's gone very quiet.",
    },
    {
      id: "c06-glass-by-cart",
      part: "Slit windows",
      title: "Glass by Cart",
      topic: "timedelta",
      cost: { wood: 3, stone: 5 },
      intro: [
        "Tock: Five slit windows, five panes. The glass comes from a glassmaker in the city. She takes her time. Then the cart takes its time. Then I take mine, because I check every pane twice.",
        "Tock: I'd like to know the day it's ready to fit. And Pip asked me something odd. How many days the clock had been stopped. Exactly. On that day.",
        "Just curious! Pip is a curious creature. That's all that is.",
        "Days don't add up like plain numbers: the 25th plus ten days isn't the 35th. A **timedelta** is a length of time, like \"ten days\". Add one to a date to get a new date, and take one date away from another to find the days in between.",
      ],
      codex: ["timedelta", "dates"],
      quiz: {
        code: r`from datetime import date, timedelta
d = date(2026, 1, 30) + timedelta(days=3)
print(d)`,
        question: "What does this program show?",
        options: ["2026-02-02", "2026-01-33", "2026-02-03", "TypeError"],
        answer: 0,
        why: "January has 31 days, so three days after the 30th is the 2nd of February. The timedelta carries over into the next month for you.",
      },
      task: [
        "Work out the day the glass is ready to fit: it was ordered on `ordered`, the glassmaker takes `making` days, the cart `on_road` days, and Tock spends `checking` days checking it.",
        "Print that day.",
        "Print how many days the clock had been stopped (since `stopped`) on the day the glass is ready: just the number of days.",
      ],
      starter: r`from datetime import date, timedelta

stopped = date(1726, 9, 21)    # the day the valley clock stopped
ordered = date(2026, 9, 25)    # the day Tock ordered the glass
making = 12                    # days the glassmaker takes
on_road = 4                    # days on the cart
checking = 2                   # days Tock spends checking every pane twice

# 1. The day the glass is ready
# 2. Print it
# 3. Days the clock had been stopped by then
`,
      tests: PRE + r`from datetime import date, timedelta
def glass(got, ordered, total):
    ready = ordered + timedelta(days=total)
    stopped = date(1726, 9, 21)
    when = " (ordered on " + ordered.isoformat() + ", with " + str(total) + " days of waiting in all)"
    text = " ".join(got)
    check(ready.isoformat() in text, "The day the glass is ready isn't right yet" + when + ". Start from the order day and add every wait: the glassmaker, the cart and Tock's checking.")
    check("0:00:00" not in text, "Print just the number of days. A whole timedelta prints as '... days, 0:00:00'; its .days is the plain number.")
    if not shows(got, (ready - stopped).days):
        check(not shows(got, (ordered - stopped).days), "That's how long the clock had been stopped on the day Tock ordered the glass" + when + ". Count to the day it's ready instead.")
        check(False, "The days the clock had been stopped aren't right yet" + when + ". Take the day it stopped away from the day the glass is ready.")
glass(lines, date(2026, 9, 25), 18)
glass(again(("making = 12", "making = 20"))[1], date(2026, 9, 25), 26)
glass(again(("ordered = date(2026, 9, 25)", "ordered = date(2026, 12, 20)"))[1], date(2026, 12, 20), 18)
glass(again(("on_road = 4", "on_road = 0"))[1], date(2026, 9, 25), 14)`,
      hints: [
        "Count on a calendar: how many days of waiting are there in all? Then think about why the 25th plus that many isn't simply a bigger day number.",
        "On other dates: `date(2026, 5, 25) + timedelta(days=10)` is the 4th of June. `(date(2026, 8, 1) - date(2026, 5, 25)).days` is 68: the days in between, as a plain number.",
        "`ready = ordered + timedelta(days=making + ... + ...)`, print `ready`, then print `(ready - ...).days` with some words.",
      ],
      solution: r`from datetime import date, timedelta

stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2

ready = ordered + timedelta(days=making + on_road + checking)
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", (ready - stopped).days, "days")`,
      wrong: [r`from datetime import date, timedelta
stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2
ready = ordered + timedelta(days=making + on_road)
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", (ready - stopped).days, "days")`, r`from datetime import date, timedelta
stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2
ready = ordered.day + making + on_road + checking
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", (ordered - stopped).days, "days")`, r`from datetime import date, timedelta
stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2
ready = ordered + timedelta(days=making + on_road + checking)
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", (ordered - stopped).days, "days")`, r`from datetime import date, timedelta
stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2
ready = ordered + timedelta(days=making + on_road + checking)
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", ready - stopped)`, r`from datetime import date, timedelta
stopped = date(1726, 9, 21)
ordered = date(2026, 9, 25)
making = 12
on_road = 4
checking = 2
ready = date(2026, 10, 13)
print("The glass is ready to fit on", ready)
print("By then the clock had been stopped for", (ready - stopped).days, "days")`],
      done: "Tock: The thirteenth of October, and five panes without a bubble. One hundred and nine thousand, five hundred and ninety-five days stopped. Pip didn't even blink at that number. Pip knew it already, didn't you? ...Pip says Pip was guessing.",
    },
    {
      id: "c07-the-season-board",
      part: "Clock chamber",
      title: "The Season Board",
      topic: "formatting dates",
      cost: { wood: 2, stone: 10 },
      intro: [
        "Tock: The clock chamber! Corbels, belfry arches, the ring of dial stones. And look what I found behind the old dial stone: a carving. The number four, and next to it a little curled-up shape. Asleep, I think.",
        "That's a... cat. A curled-up cat. Definitely a cat. Stonemasons love cats. Shall we talk about the board?",
        "Tock: Hm. The board, yes. By the chamber stairs. When the clock runs, the seasons turn again, and the board says when. My logbook likes dates as numbers, biggest first. The board likes words: the weekday, the day, the month's name and the year. Same day, two coats.",
        "A date can dress itself! One method gives the tidy logbook style, and `strftime` fills in a pattern of codes like `%A` for the weekday's name. The Codex has the table of codes.",
      ],
      codex: ["date-formatting", "dates", "timedelta"],
      quiz: {
        code: r`from datetime import date
d = date(2026, 3, 7)
print(d.strftime("%d %b"))`,
        question: "What does this program show?",
        options: ["07 Mar", "7 March", "03 Jul", "07 March"],
        answer: 0,
        why: "%d is the day with two digits (07) and %b is the short month name (Mar). %B would give the whole name, March.",
      },
      task: [
        "For every date in `turns`, print one line: the logbook style first, then a space, a `|` and a space, then the board style.",
        "The board style is the weekday's name, the day (two digits), the month's name and the whole year, with single spaces. For the first day of 2026 the line would read `2026-01-01 | Thursday 01 January 2026`.",
        "After the board, print how many days the year of seasons covers, from the first turn to the last.",
      ],
      starter: r`from datetime import date

# The days the seasons turn in the clock's first year
${TURNS}

# 1. One line per season turn: logbook | board
# 2. Days from the first turn to the last
`,
      tests: PRE + r`from datetime import date
def board(got, turns):
    for d in turns:
        iso = d.isoformat()
        where = "The line for " + iso
        rows = [l for l in got if l.startswith(iso)]
        if not rows:
            check(not any(iso in l for l in got), where + " should start with the logbook style, with nothing in front of it.")
            check(False, "Print one line for each season turn, starting with its date in the logbook style: the year, the month and the day as numbers, biggest first. There's no line like that for " + iso + ".")
        line = rows[0]
        rest = line[len(iso):]
        check(rest.startswith(" | "), where + ": put a space, a | and a space between the two styles.")
        b = rest[3:]
        check(d.strftime("%A") in b, where + ": the board style starts with the weekday's whole name.")
        check(d.strftime("%B") in b, where + ": the board wants the month's whole name, not its number or a short name.")
        check(str(d.year) in b, where + ": finish the board style with the whole year, all four digits.")
        check(b == d.strftime("%A %d %B %Y"), where + ": the board style should be the weekday, the day as two digits, the month's name and the year, in that order, with single spaces.")
    days = (turns[-1] - turns[0]).days
    others = [l for l in got if not any(l.startswith(d.isoformat()) for d in turns)]
    if not shows(others, days):
        check(False, "The days from the first season turn to the last aren't right yet. Take the first date in the list away from the last one.")
board(lines, [date(2026, 12, 21), date(2027, 3, 20), date(2027, 6, 21), date(2027, 9, 23)])
board(again(("${TURNS}", "turns = [date(2027, 1, 5), date(2027, 2, 9), date(2027, 3, 1)]"))[1], [date(2027, 1, 5), date(2027, 2, 9), date(2027, 3, 1)])`,
      hints: [
        "One line for each date in the list: which loop from the bakery does that? Then look up each part of the board style in the Codex's table of codes, one at a time.",
        "On another date: `fair.isoformat()` gives `2026-06-05`, and `fair.strftime(\"%a %d/%m\")` gives `Fri 05/06`. Words and spaces in the pattern are copied as they are. `things[-1]` is a list's last item.",
        "`for turn in turns:` then `print(turn.isoformat(), \"|\", turn.strftime(\"%A ...\"))`. After the loop: `(turns[-1] - ...).days`.",
      ],
      solution: r`from datetime import date

${TURNS}

for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%A %d %B %Y"))
print("From the first turn to the last:", (turns[-1] - turns[0]).days, "days")`,
      wrong: [r`from datetime import date
${TURNS}
for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%A %d %m %Y"))
print("From the first turn to the last:", (turns[-1] - turns[0]).days, "days")`, r`from datetime import date
${TURNS}
for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%a %d %B %Y"))
print("From the first turn to the last:", (turns[-1] - turns[0]).days, "days")`, r`from datetime import date
${TURNS}
for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%A %d %B %y"))
print("From the first turn to the last:", (turns[-1] - turns[0]).days, "days")`, r`from datetime import date
${TURNS}
for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%A %d %B %Y"))
print("From the first turn to the last:", (turns[1] - turns[0]).days, "days")`, r`from datetime import date
${TURNS}
for turn in turns:
    print(turn.isoformat(), "|", turn.strftime("%A, %d %B %Y"))
print("From the first turn to the last:", (turns[-1] - turns[0]).days, "days")`, r`from datetime import date
${TURNS}
print("2026-12-21 | Monday 21 December 2026")
print("2027-03-20 | Saturday 20 March 2027")
print("2027-06-21 | Monday 21 June 2027")
print("2027-09-23 | Thursday 23 September 2027")
print("From the first turn to the last: 276 days")`],
      done: "Tock: Winter, spring, summer, autumn, painted on the board. Two hundred and seventy-six days of seasons, waiting their turn. And a little stone cat, asleep at four o'clock. I'll leave it where it is. It looks like it's waiting for something.",
    },
    {
      id: "c08-quarter-past-four",
      part: "Slate spire",
      title: "Quarter Past Four",
      topic: "clock arithmetic with divmod",
      cost: { wood: 4, stone: 7 },
      intro: [
        "Tock: The spire's up! Slate, iron rolls, a brass ball on top. I timed it, of course. I time everything in seconds. Then nobody understands me.",
        "Tock: And the old hands, stuck at a quarter past four. If the clock had never stopped, and ran on a few hundred minutes, where would they point? Round and round they'd go. A clock face only has twelve hours on it. There's no zero o'clock anywhere on mine.",
        "Pip was having a nap at a quarter past four. A long one. Never mind. **divmod** does two jobs at once: how many whole ones fit, and what's left over. Seconds into minutes, minutes into hours. The Codex also shows the trick for two-digit times.",
      ],
      codex: ["clock-arithmetic", "math-module"],
      quiz: {
        code: r`print(divmod(100, 60))`,
        question: "What does this program show?",
        options: ["(1, 40)", "1.6666666666666667", "(40, 1)", "1 40"],
        answer: 0,
        why: "divmod gives two answers in brackets: how many whole 60s fit into 100 (1), then what's left over (40).",
      },
      task: [
        "Turn `spire_seconds` into hours, minutes and seconds, and print it the way a clock does: hours, a colon, the minutes as two digits, a colon, the seconds as two digits.",
        "The old hands show `stuck_hour` and `stuck_minute`. Work out where they would point `extra` minutes later on a twelve-hour face, and print it the same way, hours and two-digit minutes.",
        "Use divmod to split the numbers.",
      ],
      starter: r`spire_seconds = 14235    # seconds of hammering on the spire
stuck_hour = 4           # the old hands: a quarter past four
stuck_minute = 15
extra = 500              # minutes the clock might have run on

# 1. The spire's time, hours:minutes:seconds
# 2. Where the hands would point after the extra minutes
`,
      tests: PRE + r`def tower(got, s, h, m, extra):
    hh, rest = divmod(s, 3600)
    mm, ss = divmod(rest, 60)
    when = " (with spire_seconds = " + str(s) + ", the hands at " + str(h) + ":" + f"{m:02}" + " and extra = " + str(extra) + ")"
    if not at(got, f"{hh}:{mm:02}:{ss:02}"):
        check(not at(got, f"{hh}:{mm}:{ss}"), "Nearly" + when + "! A clock always shows two digits for the minutes and the seconds: 5 is written 05.")
        check(False, "The spire's time isn't right yet" + when + ". Take out the whole hours first. What's left over then splits into minutes and seconds.")
    fh, fm = divmod((h * 60 + m + extra) % 720, 60)
    shown_hour = 12 if fh == 0 else fh
    if not at(got, f"{shown_hour}:{fm:02}"):
        check(not at(got, f"0:{fm:02}"), "A twelve-hour face has no 0 o'clock" + when + ". When the hour comes out as 0, the hour hand is pointing at the 12.")
        check(not at(got, f"{shown_hour}:{fm}"), "Nearly" + when + "! Two digits for the minutes: 5 past is written :05.")
        check(False, "The hands aren't in the right place yet" + when + ". Count every minute since 12 o'clock, and remember the hands keep going round: once all the way round is 12 hours.")
tower(lines, 14235, 4, 15, 500)
tower(again(("spire_seconds = 14235", "spire_seconds = 7505"))[1], 7505, 4, 15, 500)
tower(again(("extra = 500", "extra = 45"))[1], 14235, 4, 15, 45)
tower(again(("extra = 500", "extra = 465"))[1], 14235, 4, 15, 465)
tower(again(("extra = 500", "extra = 3000"))[1], 14235, 4, 15, 3000)
tower(again(("stuck_hour = 4", "stuck_hour = 12"), ("stuck_minute = 15", "stuck_minute = 30"), ("extra = 500", "extra = 0"))[1], 14235, 12, 30, 0)
check("divmod" in src, "Right answers! Now let divmod do the splitting: it gives the whole part and the leftover in one go.")`,
      hints: [
        "Work the spire out on paper: how many whole hours are in 14235 seconds, and what's left? For the hands, count the minutes from 12 o'clock to a quarter past four first. Then where does 12:00 come back round?",
        "`hours, rest = divmod(walk, 3600)` splits seconds into hours and leftover seconds; do it again with 60. `(start + more) % 720` keeps only the minutes past the last time the hands passed 12. `f\"{m:02}\"` pads to two digits.",
        "`hours, rest = divmod(spire_seconds, 3600)`, then split `rest` the same way. For the hands: `total = (stuck_hour * 60 + ... + ...) % ...`, split `total` into hour and minute with divmod, and one `if` for the hour a twelve-hour face doesn't have.",
      ],
      solution: r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500

hours, rest = divmod(spire_seconds, 3600)
minutes, seconds = divmod(rest, 60)
print(f"The spire took {hours}:{minutes:02}:{seconds:02}")

total = (stuck_hour * 60 + stuck_minute + extra) % 720
hour, minute = divmod(total, 60)
if hour == 0:
    hour = 12
print(f"The old hands would point at {hour}:{minute:02}")`,
      wrong: [r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500
hours, rest = divmod(spire_seconds, 3600)
minutes, seconds = divmod(rest, 60)
print(f"The spire took {hours}:{minutes}:{seconds}")
total = (stuck_hour * 60 + stuck_minute + extra) % 720
hour, minute = divmod(total, 60)
if hour == 0:
    hour = 12
print(f"The old hands would point at {hour}:{minute}")`, r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500
hours, rest = divmod(spire_seconds, 3600)
minutes, seconds = divmod(rest, 60)
print(f"The spire took {hours}:{minutes:02}:{seconds:02}")
total = (stuck_hour * 60 + stuck_minute + extra) % 720
hour, minute = divmod(total, 60)
print(f"The old hands would point at {hour}:{minute:02}")`, r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500
hours, rest = divmod(spire_seconds, 3600)
minutes, seconds = divmod(rest, 60)
print(f"The spire took {hours}:{minutes:02}:{seconds:02}")
total = stuck_hour * 60 + stuck_minute + extra
hour, minute = divmod(total, 60)
if hour == 0:
    hour = 12
print(f"The old hands would point at {hour}:{minute:02}")`, r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500
hours = spire_seconds // 3600
minutes = spire_seconds % 3600 // 60
seconds = spire_seconds % 60
print(f"The spire took {hours}:{minutes:02}:{seconds:02}")
total = (stuck_hour * 60 + stuck_minute + extra) % 720
hour = total // 60
minute = total % 60
if hour == 0:
    hour = 12
print(f"The old hands would point at {hour}:{minute:02}")`, r`spire_seconds = 14235
stuck_hour = 4
stuck_minute = 15
extra = 500
hours, rest = divmod(spire_seconds, 3600)
minutes, seconds = divmod(rest, 60)
print(f"The spire took {hours}:{minutes:02}:{seconds:02}")
hour, minute = divmod(stuck_minute + extra, 60)
hour = stuck_hour + hour
print(f"The old hands would point at {hour}:{minute:02}")`, r`print("The spire took 3:57:15")
print("The old hands would point at 12:35")`],
      done: "Tock: Three hours, fifty-seven minutes, fifteen seconds of slate. And if the old clock had kept going, five hundred minutes on, it'd say twenty-five to one. It didn't keep going. But it will.",
    },
    {
      id: "c09-angles-for-the-hands",
      part: "Clock face and hands",
      title: "Angles for the Hands",
      topic: "list comprehensions",
      cost: { wood: 3, stone: 4 },
      intro: [
        "Tock: The dial! Cream face, brass bezel, a little sun and a little moon. And the old hands, scrubbed and oiled, back where they belong. Still at a quarter past four. Not for long.",
        "Tock: Before I trust a hand, I test it, at every position I can think of. Minute hand: 6 degrees for every minute past the hour. Hour hand: 30 degrees for every hour past twelve. I've a list of test times, and I want a list of angles. Writing them out takes all night.",
        "Here's a shortcut you'll love: a **list comprehension** builds a new list out of an old one in a single line. The part at the front says what each new item is. One item in, one new item out, for every item in the list.",
      ],
      codex: ["comprehensions"],
      quiz: {
        code: r`nums = [1, 2, 3]
print([n * 10 for n in nums])`,
        question: "What does this program show?",
        options: ["[10, 20, 30]", "[1, 2, 3]", "60", "SyntaxError"],
        answer: 0,
        why: "The comprehension makes a new list with n * 10 for every n in nums. The old list is left as it was.",
      },
      task: [
        "From `test_minutes`, make a list of the minute hand's angle for each test, and print it.",
        "From `test_hours`, which are 24-hour times from 0 to 23, make a list of the hour hand's angle for each one on the twelve-hour face (whole hours only), and print it.",
        "Build each list with a comprehension.",
      ],
      starter: r`test_minutes = [0, 15, 30, 45, 59]       # minutes past the hour
test_hours = [0, 3, 9, 12, 16, 23]       # 24-hour times, whole hours

# 1. The minute hand's angles
# 2. The hour hand's angles, on the twelve-hour face
`,
      tests: PRE + r`def hands(got, mins, hrs):
    a = [m * 6 for m in mins]
    b = [(h % 12) * 30 for h in hrs]
    when = " (with test_minutes = " + str(mins) + " and test_hours = " + str(hrs) + ")"
    check(shown(got, a), "The minute hand's angles aren't right yet" + when + ". Each minute past the hour turns it 6 degrees. Print the new list, not the old one.")
    if not shown(got, b):
        check(not shown(got, [h * 30 for h in hrs]), "Some hour angles are 360 or more" + when + ". The hour hand goes round a twelve-hour face, so 13 o'clock points exactly where 1 o'clock does.")
        check(False, "The hour hand's angles aren't right yet" + when + ". Each hour past 12 turns it 30 degrees.")
hands(lines, [0, 15, 30, 45, 59], [0, 3, 9, 12, 16, 23])
hands(again(("test_minutes = [0, 15, 30, 45, 59]", "test_minutes = [5, 20, 40]"), ("test_hours = [0, 3, 9, 12, 16, 23]", "test_hours = [1, 12, 13, 22]"))[1], [5, 20, 40], [1, 12, 13, 22])
check(nodes("ListComp") >= 2, "The angles are right! Now build each list with a comprehension, in one line, instead of a loop and append.")`,
      hints: [
        "Take one test time and work out its angle on paper. What did you do to it? That sum is the front of the comprehension. For the hour hand, where does 16:00 point on a twelve-hour face?",
        "On other values: `[p * 2 for p in prices]` doubles every price. The front part can be any sum. `% 12` turns 24-hour times into twelve-hour ones: `15 % 12` is 3.",
        "`[m ... for m in test_minutes]` and `[(h ...) * 30 for h in test_hours]`, each printed. The blanks are the sums you did on paper.",
      ],
      solution: r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]

minute_angles = [m * 6 for m in test_minutes]
hour_angles = [(h % 12) * 30 for h in test_hours]
print("Minute hand:", minute_angles)
print("Hour hand:", hour_angles)`,
      wrong: [r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]
minute_angles = [m * 6 for m in test_minutes]
hour_angles = [h * 30 for h in test_hours]
print("Minute hand:", minute_angles)
print("Hour hand:", hour_angles)`, r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]
minute_angles = []
for m in test_minutes:
    minute_angles.append(m * 6)
hour_angles = []
for h in test_hours:
    hour_angles.append((h % 12) * 30)
print("Minute hand:", minute_angles)
print("Hour hand:", hour_angles)`, r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]
minute_angles = [m * 6 for m in test_minutes]
hour_angles = [(h % 12) * 30 for h in test_hours]
print("Minute hand:", test_minutes)
print("Hour hand:", hour_angles)`, r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]
minute_angles = [m * 6 for m in test_minutes]
hour_angles = [(h % 12) * 15 for h in test_hours]
print("Minute hand:", minute_angles)
print("Hour hand:", hour_angles)`, r`test_minutes = [0, 15, 30, 45, 59]
test_hours = [0, 3, 9, 12, 16, 23]
print("Minute hand:", [0, 90, 180, 270, 354])
print("Hour hand:", [0, 90, 270, 0, 120, 330])`],
      done: "Tock: Every angle true, both hands, both lists, one line each. Ah! I tested them anyway. Twice. They're perfect. I'm a little sad. I like fixing things.",
    },
    {
      id: "c10-only-on-the-hour",
      part: "Bell and weather vane",
      title: "Only on the Hour",
      topic: "comprehensions with if",
      cost: { wood: 6, stone: 3 },
      intro: [
        "Tock: The bell's up! Bronze. Beautiful. Loud. Ah! Very loud. Mirela asked me, politely, with a fern in each ear, to keep it to proper hours.",
        "Tock: The town sent me the moments they'd like a chime, in minutes after midnight. Some are on the hour. Some are \"about eleven-ish\". The bell only strikes on the hour, and it strikes the hour it is.",
        "Tock: And the serpent vane's on the spire. It reports the wind every hour, but it only swings round for a proper breeze.",
        "A comprehension can **filter**: an `if` at the end keeps only the items that pass the test, and the front part still changes each one you keep.",
      ],
      codex: ["comprehension-filters", "comprehensions"],
      quiz: {
        code: r`print([n for n in [4, 7, 10, 13] if n % 2 == 0])`,
        question: "What does this program show?",
        options: ["[4, 10]", "[7, 13]", "[True, False, True, False]", "[4, 7, 10, 13]"],
        answer: 0,
        why: "Only the items that pass the test at the end are kept: the even ones, 4 and 10.",
      },
      task: [
        "From `requests`, keep only the moments that fall exactly on the hour, and turn each one into the hour it is, counted from midnight the way the town's notices do (so the 180th minute is hour 3 and the 900th is hour 15). Print the list.",
        "From `winds`, make a list of only the readings strong enough to turn the vane: `turns_at` or more. Print it.",
        "Then print how many readings turned the vane, and their average rounded to 1 decimal place.",
        "Make both lists with a comprehension that filters.",
      ],
      starter: r`${REQUESTS}   # minutes after midnight
winds = [3, 8, 12, 5, 15, 9, 21, 7]     # the vane's reading each hour
turns_at = 8                            # the weakest wind that turns the vane

# 1. The hours the bell strikes
# 2. The winds that turn the vane
# 3. How many, and their average
`,
      tests: PRE + r`def belfry(got, req, winds, at_least):
    hours = [m // 60 for m in req if m % 60 == 0]
    strong = [w for w in winds if w >= at_least]
    when = " (with " + "requests = " + str(req) + " and turns_at = " + str(at_least) + ")"
    if not shown(got, hours):
        check(not shown(got, [m for m in req if m % 60 == 0]), "Those are the right moments, but still in minutes" + when + ". Turn each one you keep into the hour it is.")
        check(not shown(got, [m / 60 for m in req if m % 60 == 0]), "The bell strikes whole hours" + when + ": " + str(float(hours[0])) + " is a float. Use the division that keeps whole numbers.")
        check(False, "The bell's hours aren't right yet" + when + ". Keep only the minutes that are an exact number of hours, and turn each into its hour.")
    if not shown(got, strong):
        check(not shown(got, [w for w in winds if w > at_least]), "A wind of exactly turns_at is strong enough" + when + ": \"or more\" counts it.")
        check(False, "The winds that turn the vane aren't right yet" + when + ".")
    avg = round(sum(strong) / len(strong), 1)
    check(shows(got, len(strong)), "Print how many readings turned the vane" + when + ".")
    if not shows(got, avg):
        check(not near(got, sum(strong) / len(strong), 0.06), "The average is right, but round it to 1 decimal place" + when + ".")
        check(False, "The average of the winds that turned the vane isn't right yet" + when + ". Add them up and share by how many there are.")
belfry(lines, [360, 405, 480, 690, 720, 1035, 1080, 1260, 1275], [3, 8, 12, 5, 15, 9, 21, 7], 8)
belfry(again(("${REQUESTS}", "requests = [0, 59, 60, 61, 600, 1380]"))[1], [0, 59, 60, 61, 600, 1380], [3, 8, 12, 5, 15, 9, 21, 7], 8)
belfry(again(("turns_at = 8", "turns_at = 9"))[1], [360, 405, 480, 690, 720, 1035, 1080, 1260, 1275], [3, 8, 12, 5, 15, 9, 21, 7], 9)
filtered = sum(1 for n in ast.walk(ast.parse(src)) if type(n).__name__ == "ListComp" and any(g.ifs for g in n.generators))
check(filtered >= 2, "Right answers! Now make both lists with a comprehension that filters: an if at the end of the brackets.")`,
      hints: [
        "Two questions for each request: is it on the hour, and if so, which hour? Which one decides what's kept, and which one decides what the kept item becomes? Try 405 and 480 on paper.",
        "`[p * 2 for p in prices if p < 10]` keeps only the cheap prices and doubles each one it keeps. `%` tells you whether a number divides evenly, and `len`, `sum` and `round(..., 1)` work on any list.",
        "`[m ... 60 for m in requests if m ... 60 == 0]` and `[w for w in winds if w ... turns_at]`, each printed; then `len(...)` and `round(sum(...) / len(...), 1)` of the winds list.",
      ],
      solution: r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8

chime_hours = [m // 60 for m in requests if m % 60 == 0]
print("The bell strikes at:", chime_hours)
strong = [w for w in winds if w >= turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`,
      wrong: [r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
chime_hours = [m for m in requests if m % 60 == 0]
print("The bell strikes at:", chime_hours)
strong = [w for w in winds if w >= turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`, r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
chime_hours = [m / 60 for m in requests if m % 60 == 0]
print("The bell strikes at:", chime_hours)
strong = [w for w in winds if w >= turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`, r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
chime_hours = [m // 60 for m in requests if m % 60 == 0]
print("The bell strikes at:", chime_hours)
strong = [w for w in winds if w > turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`, r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
chime_hours = [m // 60 for m in requests if m % 60 == 0]
print("The bell strikes at:", chime_hours)
strong = [w for w in winds if w >= turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", sum(strong) / len(strong))`, r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
chime_hours = []
for m in requests:
    if m % 60 == 0:
        chime_hours.append(m // 60)
print("The bell strikes at:", chime_hours)
strong = []
for w in winds:
    if w >= turns_at:
        strong.append(w)
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`, r`${REQUESTS}
winds = [3, 8, 12, 5, 15, 9, 21, 7]
turns_at = 8
print("The bell strikes at:", [6, 8, 12, 18, 21])
strong = [w for w in winds if w >= turns_at]
print("Winds that turn the vane:", strong)
print(len(strong), "readings, averaging", round(sum(strong) / len(strong), 1))`],
      done: "Tock: Six, eight, twelve, eighteen and twenty-one, and not one \"eleven-ish\". The vane swings for a proper breeze and dozes for the rest. The town's very relieved. So are Mirela's ferns.",
    },
    {
      id: "c11-rafters-and-chimes",
      part: "Workshop frame",
      title: "Rafters and Chime Times",
      topic: "comprehensions over range",
      cost: { wood: 10, stone: 2 },
      intro: [
        "Tock: My workshop! Lean-to on the tower's west side. Stone piers, posts, a wall plate, and five rafters, evenly spaced, starting right against the tower wall.",
        "Tock: And on the tie beam I'll paint the day's chime times. As times, mind. Two digits for the hour and two for the minutes, like a proper station clock. Nobody reads \"minute 450\". Except me.",
        "`range` works inside a comprehension too, and it's the quickest way to build evenly spaced numbers. The front part can be anything, even an f-string that turns each number into a label.",
      ],
      codex: ["comprehension-range", "comprehensions", "clock-arithmetic"],
      quiz: {
        code: r`print([i * 5 for i in range(1, 4)])`,
        question: "What does this program show?",
        options: ["[5, 10, 15]", "[0, 5, 10, 15]", "[5, 10, 15, 20]", "[0, 5, 10]"],
        answer: 0,
        why: "range(1, 4) gives 1, 2 and 3 (it stops before 4), and each one is multiplied by 5.",
      },
      task: [
        "Make a list of where each of the `rafters` rafters sits along the wall plate, in cm from the tower wall: the first right against the wall, then one every `spacing` cm. Print it.",
        "Make a list of the day's chime labels: the first chime `first` minutes after midnight, then one every `every` minutes, and the last one at `last` when the steps land exactly on it. Each label is a 24-hour time with two digits for the hour and two for the minutes. Print it.",
        "Build both lists with comprehensions.",
      ],
      starter: r`rafters = 5        # rafters on the workshop roof
spacing = 62       # cm between one rafter and the next
first = 360        # the first chime, in minutes after midnight
last = 1260        # the last chime can't be later than this
every = 90         # minutes between chimes

# 1. Where the rafters sit
# 2. The chime labels for the tie beam
`,
      tests: PRE + r`def frame(got, n, gap, first, last, every):
    pos = [i * gap for i in range(n)]
    times = list(range(first, last + 1, every))
    labels = [f"{m // 60:02}:{m % 60:02}" for m in times]
    when = " (with rafters = " + str(n) + ", spacing = " + str(gap) + ", first = " + str(first) + ", last = " + str(last) + " and every = " + str(every) + ")"
    if not shown(got, pos):
        check(not shown(got, [i * gap for i in range(1, n + 1)]), "The first rafter sits right against the tower wall, at 0 cm" + when + ".")
        check(False, "The rafter positions aren't right yet" + when + ". There should be one number for each rafter, starting at 0 and growing by spacing.")
    if not shown(got, labels):
        check(not ((last - first) % every == 0 and shown(got, labels[:-1])), "The last chime is missing" + when + ". The steps land exactly on last, but range stops just before the end you give it.")
        check(not shown(got, [f"{m // 60}:{m % 60:02}" for m in times]), "Nearly" + when + "! The beam wants two digits for the hour too: 6 o'clock is painted 06:00.")
        check(False, "The chime labels aren't right yet" + when + ". Start at first, step by every, stop after last, and turn each minute count into hours and minutes.")
frame(lines, 5, 62, 360, 1260, 90)
frame(again(("rafters = 5", "rafters = 3"), ("spacing = 62", "spacing = 75"))[1], 3, 75, 360, 1260, 90)
frame(again(("first = 360", "first = 420"), ("last = 1260", "last = 1200"), ("every = 90", "every = 120"))[1], 5, 62, 420, 1200, 120)
frame(again(("first = 360", "first = 375"), ("last = 1260", "last = 600"), ("every = 90", "every = 45"))[1], 5, 62, 375, 600, 45)
check(nodes("ListComp") >= 2, "Right answers! Now build both lists with a comprehension instead of a loop and append.")`,
      hints: [
        "Write the first two and the last item of each list on paper. Where does each list start, how big is each step, and where must it stop? Then: what turns 450 into 07:30?",
        "`[n * 3 for n in range(4)]` is `[0, 3, 6, 9]`. `range(10, 31, 5)` reaches 30 but `range(10, 30, 5)` doesn't. `f\"{h:02}:{m:02}\"` makes a label from two numbers, and `//` and `%` work inside the braces.",
        "`[i * ... for i in range(...)]` and `[f\"{m // 60:02}:{...}\" for m in range(first, ..., every)]`, each printed.",
      ],
      solution: r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90

positions = [i * spacing for i in range(rafters)]
print("Rafters at:", positions)
labels = [f"{m // 60:02}:{m % 60:02}" for m in range(first, last + 1, every)]
print("Chimes:", labels)`,
      wrong: [r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90
positions = [i * spacing for i in range(1, rafters + 1)]
print("Rafters at:", positions)
labels = [f"{m // 60:02}:{m % 60:02}" for m in range(first, last + 1, every)]
print("Chimes:", labels)`, r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90
positions = [i * spacing for i in range(rafters)]
print("Rafters at:", positions)
labels = [f"{m // 60:02}:{m % 60:02}" for m in range(first, last, every)]
print("Chimes:", labels)`, r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90
positions = [i * spacing for i in range(rafters)]
print("Rafters at:", positions)
labels = [f"{m // 60}:{m % 60:02}" for m in range(first, last + 1, every)]
print("Chimes:", labels)`, r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90
positions = []
for i in range(rafters):
    positions.append(i * spacing)
print("Rafters at:", positions)
labels = []
for m in range(first, last + 1, every):
    labels.append(f"{m // 60:02}:{m % 60:02}")
print("Chimes:", labels)`, r`rafters = 5
spacing = 62
first = 360
last = 1260
every = 90
print("Rafters at:", [0, 62, 124, 186, 248])
print("Chimes:", ["06:00", "07:30", "09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30", "21:00"])`],
      done: "Tock: Five rafters, true as a plumb line. Eleven chimes on the beam, six in the morning to nine at night, every one with its zeros. Ah! I'd paint them again just for the fun of it.",
    },
    {
      id: "c12-sun-or-moon",
      part: "Workshop roof and stove",
      title: "Sun or Moon",
      topic: "conditional expressions",
      cost: { wood: 8, stone: 3 },
      intro: [
        "Tock: Roof on, walls up, and an iron stove with a glowing door. I light it when it's cold out. I don't when it isn't. One decision, one line. Ah! I love a one-line decision.",
        "Ooh, a stove. Pip might just sit by it for a minute. Pip has been cold for... a while. A long while.",
        "Tock: The dial has a little sun and a little moon on a wheel. Every hour of the day shows one or the other. I want a list for all twenty-four, so I can cut the wheel.",
        "Python has a **one-line if** for choosing a value: `a if test else b`. It's a value itself, so it fits on the right of `=`, or at the front of a comprehension, where it chooses for every item.",
      ],
      codex: ["conditional-expressions", "comprehension-range"],
      quiz: {
        code: r`x = 5
print("big" if x > 9 else "small")`,
        question: "What does this program show?",
        options: ["small", "big", "False", "SyntaxError"],
        answer: 0,
        why: "5 > 9 is False, so the one-line if gives the value after else.",
      },
      task: [
        "In one line, choose the stove's state: `lit` when `outside` is colder than `cold_below` degrees, otherwise `out`. Print a line about the stove saying which.",
        "Make a list for every hour of the day, 0 to 23, holding `sun` from the `sunrise` hour up to (not including) the `sunset` hour, and `moon` for every other hour. Print it.",
        "Print how many sun hours there are, counted from the list.",
        "Use the one-line if for the stove, and again inside the list's comprehension.",
      ],
      starter: r`outside = 9        # degrees outside the workshop
cold_below = 12    # the stove is lit below this
sunrise = 7        # the first sun hour
sunset = 19        # the first moon hour of the evening

# 1. The stove, in one line
# 2. Sun or moon for every hour, 0 to 23
# 3. How many sun hours
`,
      tests: PRE + r`def workshop(vns, got, outside, cold, rise, sets):
    stove = "lit" if outside < cold else "out"
    other = "out" if stove == "lit" else "lit"
    sky = ["sun" if rise <= h < sets else "moon" for h in range(24)]
    when = " (with outside = " + str(outside) + ", cold_below = " + str(cold) + ", sunrise = " + str(rise) + " and sunset = " + str(sets) + ")"
    words = [l for l in got if "[" not in l]
    rows = [l.lower() for l in words if "stove" in l.lower()]
    check(rows, "Print a line about the stove that says whether it's lit or out" + when + ".")
    says = any(re.search(r"\b" + stove + r"\b", l) for l in rows)
    says_other = any(re.search(r"\b" + other + r"\b", l) for l in rows)
    states = [v for v in vns.values() if isinstance(v, str) and v.strip().lower() in ("lit", "out")]
    if states:
        good = says and stove in [v.strip().lower() for v in states] and other not in [v.strip().lower() for v in states]
    else:
        good = says and not says_other
    if not good:
        check(not (outside == cold), "When it's exactly cold_below outside, that isn't colder than cold_below, so the stove stays out" + when + ".")
        check(False, "The stove's line isn't right yet" + when + ". It should say lit only when it's colder outside than cold_below, and out otherwise.")
    if not shown(got, sky):
        check(not shown(got, ["sun"] * (sets - rise)), "That list only has the sun hours" + when + ". An if at the end of a comprehension throws items away. To choose between two values for every hour, the one-line if goes at the front.")
        check(not shown(got, ["sun" if rise <= h <= sets else "moon" for h in range(24)]), "One sun hour too many" + when + ": at the sunset hour the moon is already out.")
        check(False, "The sun-and-moon list isn't right yet" + when + ". It needs 24 entries, one for each hour from 0 to 23.")
    check(shows(words, sets - rise), "Print how many sun hours there are, counted from your list" + when + ".")
workshop(ns, lines, 9, 12, 7, 19)
workshop(*again(("outside = 9", "outside = 12")), 12, 12, 7, 19)
workshop(*again(("outside = 9", "outside = 15")), 15, 12, 7, 19)
workshop(*again(("sunrise = 7", "sunrise = 5"), ("sunset = 19", "sunset = 21")), 9, 12, 5, 21)
check(nodes("IfExp") >= 2, "Right answers! Now make both choices with the one-line if: one for the stove, and one at the front of the comprehension.")`,
      hints: [
        "For each hour, ask the same yes/no question: is the sun up? What's the test, using the hour, `sunrise` and `sunset`? Try hours 6, 7, 18 and 19 on paper.",
        "`word = \"apple\" if apples == 1 else \"apples\"` chooses in one line, and `[\"pass\" if s >= 5 else \"try again\" for s in scores]` chooses for every item. `things.count(x)` counts how often `x` is in a list.",
        "`stove = \"lit\" if ... else \"out\"`. The list: `[\"sun\" if ... else \"moon\" for h in range(24)]`, where the blank is the test you tried on paper; then print its `.count(\"sun\")`.",
      ],
      solution: r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19

stove = "lit" if outside < cold_below else "out"
print("The stove is", stove)
sky = ["sun" if sunrise <= h < sunset else "moon" for h in range(24)]
print(sky)
print("Sun hours:", sky.count("sun"))`,
      wrong: [r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19
stove = "lit" if outside <= cold_below else "out"
print("The stove is", stove)
sky = ["sun" if sunrise <= h < sunset else "moon" for h in range(24)]
print(sky)
print("Sun hours:", sky.count("sun"))`, r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19
stove = "lit" if outside < cold_below else "out"
print("The stove is", stove)
sky = ["sun" for h in range(24) if sunrise <= h < sunset]
print(sky)
print("Sun hours:", sky.count("sun"))`, r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19
stove = "lit" if outside < cold_below else "out"
print("The stove is", stove)
sky = ["sun" if sunrise <= h <= sunset else "moon" for h in range(24)]
print(sky)
print("Sun hours:", sky.count("sun"))`, r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19
if outside < cold_below:
    stove = "lit"
else:
    stove = "out"
print("The stove is", stove)
sky = ["sun" if sunrise <= h < sunset else "moon" for h in range(24)]
print(sky)
print("Sun hours:", sky.count("sun"))`, r`outside = 9
cold_below = 12
sunrise = 7
sunset = 19
stove = "lit" if outside < cold_below else "out"
print("The stove is", stove)
sky = ["sun" if sunrise <= h < sunset else "moon" for h in range(24)]
print(sky)
print("Sun hours: 12")`],
      done: "Tock: Stove lit, kettle on, and twelve suns and twelve moons on the little wheel. Pip's curled up by the stove door. Pip looks a bit less see-through. Warmth helps everything. Especially springs.",
    },
    {
      id: "c13-the-gear-train",
      part: "Tock's gears",
      title: "The Gear Train",
      topic: "dictionary comprehensions",
      cost: { wood: 4, stone: 0 },
      intro: [
        "Tock: Gears! Real ones! Two meshing on the gable, a drive rod up the tower, a crate of cogs, and the workbench with a half-built clock on it. Every gear turns at its own speed, and I want to know every one.",
        "Tock: The rule: when the drive gear turns once, a gear meshed with it turns the drive's teeth divided by its own teeth times. Fewer teeth, faster. More teeth, slower. Same teeth, same speed.",
        "A **dictionary comprehension** builds a dictionary in one line: curly braces, and `key: value` at the front. Walk a dictionary's `.items()` and unpack each pair, just like in a `for` loop.",
      ],
      codex: ["dict-comprehensions", "comprehension-filters"],
      quiz: {
        code: r`stock = {"jam": 2, "honey": 5}
print({k: v + 1 for k, v in stock.items() if v > 3})`,
        question: "What does this program show?",
        options: ["{'honey': 6}", "{'honey': 5}", "{'jam': 3, 'honey': 6}", "{'honey': True}"],
        answer: 0,
        why: "Only honey passes the test v > 3, and the front part then makes its value 5 + 1. Jam is left out altogether.",
      },
      task: [
        "From `gears` (each gear's name and its teeth), make a dictionary of how many times each gear turns for one turn of the `drive` gear, rounded to 2 decimal places. Print it.",
        "Then make a second dictionary of just the gears that spin faster than the drive gear, with their speeds, and print it.",
        "Build both dictionaries with comprehensions.",
      ],
      starter: r`drive = 16    # teeth on the drive gear on the gable
${GEARS}

# 1. Every gear's turns for one turn of the drive gear
# 2. Only the gears that spin faster than the drive
`,
      tests: PRE + r`def train(got, drive, gears):
    speeds = {n: round(drive / t, 2) for n, t in gears.items()}
    fast = {n: s for n, s in speeds.items() if s > 1}
    when = " (with drive = " + str(drive) + " and gears = " + str(gears) + ")"
    if not shown(got, speeds):
        check(not shown(got, {n: round(t / drive, 2) for n, t in gears.items()}), "The speeds are upside down" + when + ": a gear with fewer teeth than the drive should spin faster, so its number should be bigger than 1.")
        check(not shown(got, {n: drive / t for n, t in gears.items()}), "The speeds are right, but round each one to 2 decimal places" + when + ".")
        check(False, "The gear speeds aren't right yet" + when + ". Each gear turns the drive's teeth divided by its own teeth times.")
    if not shown(got, fast):
        check(not shown(got, {n: s for n, s in speeds.items() if s >= 1}), "A gear that turns exactly once isn't faster than the drive" + when + ": it keeps the same speed.")
        check(not shown(got, {n: t for n, t in gears.items() if drive / t > 1}), "Those are the right gears, but the second dictionary should hold each one's speed, not its teeth" + when + ".")
        check(False, "The dictionary of fast gears isn't right yet" + when + ". Keep only the gears that turn more than once for each turn of the drive.")
train(lines, 16, {"gable cog": 10, "rod gear": 32, "hour wheel": 48, "bell trip": 8, "vane gear": 16})
train(again(("drive = 16", "drive = 20"), ('${GEARS}', 'gears = {"pinion": 5, "great wheel": 60, "twin": 20, "trip": 15}'))[1], 20, {"pinion": 5, "great wheel": 60, "twin": 20, "trip": 15})
check(nodes("DictComp") >= 2, "Right answers! Now build both dictionaries with a comprehension, in curly braces, instead of a loop.")`,
      hints: [
        "For each gear, the key stays its name; only the value is new. Work out the gable cog's speed on paper. Then: which test decides whether a gear is faster than the drive?",
        "`{item: price * 2 for item, price in cost.items()}` keeps every key and changes every value, and an `if` at the end keeps only some pairs. `round(x, 2)` goes inside, around the value.",
        "`{name: round(..., 2) for name, teeth in gears.items()}` with Tock's rule in the blank, then `{name: speed for name, speed in ....items() if ...}`, each printed.",
      ],
      solution: r`drive = 16
${GEARS}

speeds = {name: round(drive / teeth, 2) for name, teeth in gears.items()}
print("Turns for one turn of the drive:", speeds)
faster = {name: speed for name, speed in speeds.items() if speed > 1}
print("Faster than the drive:", faster)`,
      wrong: [r`drive = 16
${GEARS}
speeds = {name: round(teeth / drive, 2) for name, teeth in gears.items()}
print("Turns for one turn of the drive:", speeds)
faster = {name: speed for name, speed in speeds.items() if speed > 1}
print("Faster than the drive:", faster)`, r`drive = 16
${GEARS}
speeds = {name: round(drive / teeth, 2) for name, teeth in gears.items()}
print("Turns for one turn of the drive:", speeds)
faster = {name: speed for name, speed in speeds.items() if speed >= 1}
print("Faster than the drive:", faster)`, r`drive = 16
${GEARS}
speeds = {name: drive / teeth for name, teeth in gears.items()}
print("Turns for one turn of the drive:", speeds)
faster = {name: speed for name, speed in speeds.items() if speed > 1}
print("Faster than the drive:", faster)`, r`drive = 16
${GEARS}
speeds = {name: round(drive / teeth, 2) for name, teeth in gears.items()}
print("Turns for one turn of the drive:", speeds)
faster = {name: teeth for name, teeth in gears.items() if teeth < drive}
print("Faster than the drive:", faster)`, r`drive = 16
${GEARS}
speeds = {}
for name, teeth in gears.items():
    speeds[name] = round(drive / teeth, 2)
print("Turns for one turn of the drive:", speeds)
faster = {}
for name, speed in speeds.items():
    if speed > 1:
        faster[name] = speed
print("Faster than the drive:", faster)`, r`drive = 16
${GEARS}
print("Turns for one turn of the drive:", {"gable cog": 1.6, "rod gear": 0.5, "hour wheel": 0.33, "bell trip": 2.0, "vane gear": 1.0})
print("Faster than the drive:", {"gable cog": 1.6, "bell trip": 2.0})`],
      done: "Tock: The gable cog spins one point six times for every turn of the drive, and the hour wheel dawdles at a third. The whole train's meshing. Listen. Tick-tick-tick, tock. That's the sound of everything being where it should.",
    },
    {
      id: "c14-the-clocks-first-day",
      part: "Lanterns and sign",
      title: "The Clock's First Day",
      topic: "putting it together",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Tock: Lanterns by the door. My gear sign. Barrels, a bench, flowers, because Mirela insisted. That's the tower. All that's left is the clock's own program: when it chimes, how much oil it drinks, and what it does on market days.",
        "Tock: The chime list goes on a card behind the old dial, and the old dial is a twelve-hour face, like the spire puzzle. On market day the town wants long chimes, so the stalls know when to open. Every other day, short ones. The hands are waiting at a quarter past four.",
        "This uses the whole tower: `divmod` and the twelve-hour face, comprehensions over `range`, `math`, dates with `timedelta` and `strftime`, and the one-line if. A little function from the forge can help too. Plan it on paper first, one part of the report at a time. When it runs, the clock starts.",
      ],
      codex: ["comprehension-range", "clock-arithmetic", "timedelta", "date-formatting", "conditional-expressions", "math-module"],
      quiz: {
        code: r`from datetime import date, timedelta
days = [date(2026, 2, 27) + timedelta(days=i) for i in range(3)]
print(days[-1].day)`,
        question: "What does this program show?",
        options: ["1", "29", "3", "28"],
        answer: 0,
        why: "The list holds the 27th and 28th of February 2026 and then the 1st of March (2026 isn't a leap year), and .day of the last one is 1.",
      },
      task: [
        "Print a list of the day's chime labels the way the old twelve-hour dial shows them: the hour from 1 to 12, a colon, and the minutes as two digits. The first chime is `first` minutes after midnight, then one every `every` minutes, and none later than `last`.",
        "Print how many tins of oil the clock needs to ring every one of those chimes, every day, for `days` days, at `drops` drops a chime and `tin` drops in a tin. A part-used tin still has to be bought whole.",
        "Print the first week, starting on `restart`: one line per day with the board style from the clock chamber without the year (weekday's name, day, month's name), then `long` on the `market` day and `short` on the others.",
      ],
      starter: r`import math
from datetime import date, timedelta

restart = date(2026, 10, 21)  # the day the clock starts again
first = 420                   # the first chime, in minutes after midnight
last = 1320                   # no chime later than this
every = 75                    # minutes between chimes
drops = 3                     # drops of oil for each chime
tin = 250                     # drops of oil in one tin
days = 61                     # days until the season turns
market = "Saturday"           # the day of long chimes

# The clock's first day. The task list has each part of the report.
`,
      tests: PRE + r`from datetime import date, timedelta
def dial(m):
    h, mm = divmod(m % 720, 60)
    return str(12 if h == 0 else h) + ":" + f"{mm:02}"
def clock(got, restart, first, last, every, drops, tin, days, market):
    times = list(range(first, last + 1, every))
    labels = [dial(m) for m in times]
    padded = ["0" + x if len(x) == 4 else x for x in labels]
    when = " (with restart = " + restart.isoformat() + ", first = " + str(first) + ", every = " + str(every) + ", drops = " + str(drops) + ", days = " + str(days) + " and market = " + market + ")"
    if not (shown(got, labels) or shown(got, padded)):
        check(not shown(got, [f"{m // 60:02}:{m % 60:02}" for m in times]) and not shown(got, [f"{m // 60}:{m % 60:02}" for m in times]), "Those are station-clock times" + when + ". The old dial is a twelve-hour face: after 12 o'clock the hours start again at 1.")
        check(not shown(got, [str(m % 720 // 60) + ":" + f"{m % 60:02}" for m in times]), "A twelve-hour face has no 0 o'clock" + when + ": where the hour comes out as 0, the dial shows 12.")
        check(not ((last - first) % every == 0 and (shown(got, labels[:-1]) or shown(got, padded[:-1]))), "The last chime is missing" + when + ". The steps land exactly on last, and a chime then is allowed.")
        check(False, "The chime labels aren't right yet" + when + ". Start at first, step by every, stop after last, and write each one as the twelve-hour dial shows it.")
    need = len(labels) * drops * days
    tins = math.ceil(need / tin)
    if not shows(got, tins):
        check(not (need % tin != 0 and shows(got, need // tin)), "One tin short" + when + ": the last tin is only partly used, but it still has to be bought. Round up.")
        check(not (need % tin == 0 and shows(got, need // tin + 1)), "One tin too many" + when + ": here the oil fills the tins exactly, with none left over.")
        check(False, "The tins of oil aren't right yet" + when + ". Count every drop: chimes in a day, times drops a chime, times days. Then how many tins hold that?")
    for i in range(7):
        d = restart + timedelta(days=i)
        styles = [d.strftime("%A %d %B"), d.strftime("%A") + " " + str(d.day) + " " + d.strftime("%B")]
        rows = [l for l in got if any(s in l for s in styles) and re.search(r"\b(long|short)\b", l)]
        if not rows and i == 0:
            check(not any((restart + timedelta(days=7)).strftime("%A %d %B") in l for l in got), "The week is one day late" + when + ": it starts on the restart day itself.")
        check(rows, "The week needs a line for " + d.isoformat() + when + ", in the board style without the year (the weekday's name, the day and the month's name), saying long or short.")
        word = "long" if d.strftime("%A") == market else "short"
        other = "short" if word == "long" else "long"
        check(all(re.search(r"\b" + word + r"\b", l) and not re.search(r"\b" + other + r"\b", l) for l in rows), "The line for " + d.isoformat() + " should say " + word + when + ": long only on the market day. Compare the date's weekday name with market.")
clock(lines, date(2026, 10, 21), 420, 1320, 75, 3, 250, 61, "Saturday")
clock(again(("every = 75", "every = 180"))[1], date(2026, 10, 21), 420, 1320, 180, 3, 250, 61, "Saturday")
clock(again(("restart = date(2026, 10, 21)", "restart = date(2027, 2, 25)"), ('market = "Saturday"', 'market = "Monday"'))[1], date(2027, 2, 25), 420, 1320, 75, 3, 250, 61, "Monday")
clock(again(("days = 61", "days = 250"), ("drops = 3", "drops = 1"))[1], date(2026, 10, 21), 420, 1320, 75, 1, 250, 250, "Saturday")
clock(again(("first = 420", "first = 30"))[1], date(2026, 10, 21), 30, 1320, 75, 3, 250, 61, "Saturday")`,
      hints: [
        "Three parts, three small programs. Start with single chimes on paper: what does the dial show for minute 780? For minute 720? Then the oil depends on how many chimes there are, and the week on seven dates in a row.",
        "A function can do the fiddly part for one item, and a comprehension calls it for every item: after `def double(n): return n * 2`, `[double(n) for n in range(3)]` is `[0, 2, 4]`. `math.ceil` rounds up, `fair + timedelta(days=i)` steps through the days, and `d.strftime(\"%A\")` is a weekday's name, ready to compare.",
        "`def dial(m):` splits `m` with divmod, takes the hour round a twelve-hour face, turns 0 into 12 and returns an f-string; then `[dial(m) for m in range(first, ..., every)]`. Oil: `math.____(len(chimes) * ...)`. Week: `for i in range(7):` with `d = restart + timedelta(days=i)` and a one-line if comparing with `market`.",
      ],
      solution: r`import math
from datetime import date, timedelta

restart = date(2026, 10, 21)
first = 420
last = 1320
every = 75
drops = 3
tin = 250
days = 61
market = "Saturday"

def dial(minutes):
    hour, minute = divmod(minutes, 60)
    hour = hour % 12
    if hour == 0:
        hour = 12
    return f"{hour}:{minute:02}"

chimes = [dial(m) for m in range(first, last + 1, every)]
print("Chimes:", chimes)
tins = math.ceil(len(chimes) * drops * days / tin)
print("Oil until the season turns:", tins, "tins")
week = [restart + timedelta(days=i) for i in range(7)]
for d in week:
    style = "long" if d.strftime("%A") == market else "short"
    print(d.strftime("%A %d %B") + ":", style, "chimes")`,
      wrong: [
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last, every)]", "tins = math.ceil(len(chimes) * drops * days / tin)", "range(7)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last + 1, every)]", "tins = len(chimes) * drops * days // tin", "range(7)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last + 1, every)]", "tins = len(chimes) * drops * days // tin + 1", "range(7)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last + 1, every)]", "tins = math.ceil(len(chimes) * drops * days / tin)", "range(1, 8)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last + 1, every)]", "tins = math.ceil(len(chimes) * drops * days / tin)", "range(7)", "d == market"),
        WEEK_WRONG("chimes = [dial(m) for m in range(first, last + 1, every)]", "tins = 10", "range(7)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [f\"{m // 60:02}:{m % 60:02}\" for m in range(first, last + 1, every)]", "tins = math.ceil(len(chimes) * drops * days / tin)", "range(7)", "d.strftime(\"%A\") == market"),
        WEEK_WRONG("chimes = [f\"{m // 60 % 12}:{m % 60:02}\" for m in range(first, last + 1, every)]", "tins = math.ceil(len(chimes) * drops * days / tin)", "range(7)", "d.strftime(\"%A\") == market"),
      ],
      done: "Tock: Thirteen chimes a day, ten tins to the winter, and long chimes on Saturday for the market. The program's in the stone. The hands are trembling. Ah! Everyone. Everyone come and look!",
    },
  ],
};
