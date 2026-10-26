import type { Building } from "./types.ts";

// The Forge: building 6, taught with functions (SYLLABUS.md). Each challenge
// adds one stage of forge.glb (art/specs/forge.md, stage_01 … stage_15).
// Ingrid the smith arrives when the chapter opens and speaks lines that start
// with "Ingrid: ".
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks. Functions
// are tested the strong way: the rune calls the learner's own functions with
// fresh values, so typed-in answers and hard-coded numbers fail.
//   fn("name")                      the function, or friendly feedback if it's missing or misnamed
//   takes("name", 2, "two values")  checks how many parameters it has
//   call("name", args, kw, crash)   -> (result, printed lines, "name(args)") without crashing the checker
//   gives(...)                      like call, but None (nothing returned) is feedback
//   want("name", args, expected, advice)   the result must be exactly expected (type too)
//   says("name", args)              -> (printed lines, "name(args)") for functions that print
//   swapped("name", fake, test)     runs test() with a variable or function of the program swapped out
//   again(("old", "new"))           reruns the program with a starter line swapped -> (variables, lines)
//   nums(line), missing(lines, values), show(lines)   flexible reading of printed lines
const PRE = r`import re, io, sys, inspect

def show(ls):
    if not ls:
        return " (nothing)"
    nl = chr(10) + "  "
    return nl + nl.join(ls[:8]) + (nl + "..." if len(ls) > 8 else "")

def nums(line):
    return [int(x) for x in re.findall(r"-?\d+", line)]

def missing(ls, values):
    seq = [x for l in ls for x in nums(l)]
    i = 0
    for v in values:
        while i < len(seq) and seq[i] != v:
            i += 1
        if i >= len(seq):
            return v
        i += 1
    return None

def variant(v, when):
    try:
        return rerun(v)
    except Exception as e:
        check(False, when + "your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the variables and your functions, so the program fits other values, not just today's.")

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    return variant(v, "With " + " and ".join(new for old, new in swaps) + ", ")

def mine():
    return [k for k, v in ns.items() if callable(v) and getattr(getattr(v, "__code__", None), "co_filename", "") == "main.py"]

def fn(name):
    if name not in ns:
        others = mine()
        if others:
            check(False, "The rune looked for a function called " + name + ", but your program only has " + ", ".join(others) + ". The rune calls it " + name + ", so the name after def must match exactly.")
        check(False, "The rune looked for a function called " + name + " and couldn't find one. Make it with def, starting at the left edge of the program (not indented inside anything).")
    f = ns[name]
    check(callable(f), name + " is a " + type(f).__name__ + " in your program, not a function. Did a later line reuse the name " + name + " for something else?")
    return f

def takes(name, n, what):
    f = fn(name)
    got = len(inspect.signature(f).parameters)
    check(got == n, name + " should take " + what + ", but yours takes " + str(got) + " value" + ("" if got == 1 else "s") + ".")
    return f

def call(name, args=(), kw=None, crash=""):
    f = fn(name)
    kw = kw or {}
    shown = name + "(" + ", ".join([repr(a) for a in args] + [k + "=" + repr(v) for k, v in kw.items()]) + ")"
    try:
        inspect.signature(f).bind(*args, **kw)
    except TypeError:
        check(False, "The rune tried " + shown + ", but your " + name + " can't take those values. Compare its brackets with the task.")
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        result = f(*args, **kw)
    except Exception as e:
        sys.stdout = old
        check(False, "The rune tried " + shown + " and it crashed with " + type(e).__name__ + ": " + str(e) + "." + (" " + crash if crash else ""))
    finally:
        sys.stdout = old
    return result, as_output([l.rstrip() for l in buf.getvalue().splitlines()]), shown

def gives(name, args=(), kw=None, crash=""):
    res, printed, shown = call(name, args, kw, crash)
    if res is None:
        if printed:
            check(False, shown + " printed " + repr(printed[-1]) + " but gave nothing back, so the rest of the program gets None. print only shows a value; return hands it back.")
        check(False, shown + " gave back None, nothing at all. Does every path through " + name + " reach a return?")
    return res, printed, shown

def same(a, b):
    return a == b and type(a) is type(b)

def want(name, args, expected, advice, kw=None, crash=""):
    res, printed, shown = gives(name, args, kw, crash)
    if type(expected) is int and type(res) is float and res == expected:
        check(False, shown + " gave back " + repr(res) + ", a number with a decimal point. The answer here is a whole number, and // divides without one.")
    if type(expected) is bool and type(res) is str:
        check(False, shown + " gave back the text " + repr(res) + ", in quotes. The rune wants the value True or False itself, with no quotes.")
    if type(expected) is str and type(res) is str and res != expected and res.lower() == expected.lower():
        check(False, shown + " gave back " + repr(res) + ". Capital letters matter: give back the words exactly as the task writes them.")
    check(same(res, expected), shown + " gave back " + repr(res) + ". " + advice)
    return res

def says(name, args=(), crash=""):
    res, printed, shown = call(name, args, None, crash)
    return printed, shown

def swapped(name, fake, test):
    real = ns[name]
    ns[name] = fake
    try:
        return test()
    finally:
        ns[name] = real

`;

export const FORGE: Building = {
  id: "forge",
  name: "The Forge",
  blurb: "Coals, an anvil and the tools a growing town needs.",
  villager: { name: "Ingrid", model: "smith", arrives: "start" },
  opening: [
    "Someone's coming down the east road. One cart, one very large anvil, one woman with arms like oak beams. And a crate with a burgundy crest on it... crossed out in chalk. Very firmly.",
    "Ingrid: Ingrid. Smith. Heard your charter wants a forge. A town that can't mend a hinge isn't a town.",
    "Ingrid: Twelve years I made tools for the Vane Company. Then I put my hammer down and walked. Don't ask why. Not yet.",
    "A Vane Company smith? Pip is going to keep one eye on that crate.",
    "Ingrid: Keep both on it. It's kindling. ...Mostly.",
    "Ingrid: Smithing's simple. A good tool does one job, does it well, and you use it a thousand times. You make it once.",
    "Then the rune stone needs tools of its own! In Python they're called **functions**: write a job once, give it a name, and use it whenever you like. Let's build the Forge!",
  ],
  finale: [
    "Ingrid: Lanterns lit. Sign's up. Forge is open.",
    "Ingrid: Now. The paper from the bottom of that crate. I said I'd tell you why I walked.",
    "Ingrid: Vane's plan for the valley. Copied it off his desk at the works the day I quit. Pumps on the pond till it's a mud flat. Picks in the hills till they're a quarry. Stone sold to the cities by the cartload.",
    "Ingrid: That order you just ran was the start of it. I was meant to make the tools. I didn't.",
    "Ingrid: There. Pinned to the wall with my best knife. Everyone who walks in here sees what we're up against.",
    "Drain the pond? Marlo's bell came out of that pond! Pip is very small, but Pip can be very, very loud.",
    "Ingrid: Good. Loud's useful. Vane's not cruel, mind. He's never stood next to a drained pond, that's all. Men who only read maps forget there's water under them.",
    "Ingrid: So we show him. Every door in this valley gets a good tool. When the King's people come counting, they'll count a town that can build and mend for itself.",
    "A forge, tools for the whole town, and a plan on the wall that will never, ever happen. Pip feels very brave. Pip may need to sit down.",
  ],
  chatDuring: [
    "Ingrid: Don't touch anything orange. Don't touch anything black either. Black iron can be hotter than it looks.",
    "Ingrid: Pip asked what a parameter is. Told Pip: the bit of the job that changes. Same hammer. Different nail.",
    "Ingrid: A function that prints instead of returning is a smith who shows you the horseshoe and keeps it.",
    "Ingrid: Had a crew at the Company works. Dagny, Hollis, young Pell. ...Not now. Work.",
  ],
  chatAfter: [
    "Ingrid: Every tool that leaves this forge has my mark on the handle. Breaks, bring it back. It won't break.",
    "Ingrid: The plan stays on the wall. Every morning I look at it. Then I make something it can't have.",
    "Ingrid: Pip keeps asking about a tiny helmet. I've measured Pip's head. That's all I'm saying.",
    "Ingrid: Good functions are like good tongs. One job. Fits the hand. Lasts.",
  ],
  chronicle: {
    title: "The Speakers Leave",
    text: [
      "By our tenth year the stones could do more than any of us could name, so we gave the best workings names of their own. A farmer could call *Sow the north field* without knowing one line of what was inside it. It was the cleverest thing we ever did. I have begun to fear it was also the most dangerous.",
      "People learned to call the workings and stopped learning how they were made. Only a handful of us still wrote new ones: Corwin, who taught the mill to choose; old Ama, who taught the bell to ring; the Brannock sisters at their forge by the lean-to, who could make a stone hum like a struck anvil.",
      "Then the letters came from the cities. Good wages, fine rooms, a chair at the King's own college. Each time, someone I loved packed their books and promised to come back. Corwin went in the spring. Ama went in the autumn. By the next winter the forge was cold.",
      "The workings still answer when the village calls them. But when one breaks, there is nobody left who knows what is inside it, and I am only one pair of hands.",
    ],
  },
  challenges: [
    {
      id: "f01-four-corners",
      part: "Survey stakes",
      title: "Four Corners",
      topic: "def and calling a function",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Ingrid: Four corners. Same job at every one. Stake, string, sight the line. I'm not saying it four times.",
        "Then don't! Teach the rune stone a new word. A **function** is a block of lines with a name: write it once with `def`, then call the name whenever the job needs doing.",
        "Careful, though. Writing a function only teaches the stone the word. Nothing happens until you call it, with brackets: `name()`.",
      ],
      codex: ["functions"],
      quiz: {
        code: r`def wave():
    print("Hello!")

print("Start")`,
        question: "What does this program show?",
        options: ["Start", "Hello!\nStart", "Start\nHello!", "(nothing)"],
        answer: 0,
        why: "The def only teaches Python what wave means. Nobody ever calls wave(), so \"Hello!\" is never printed.",
      },
      task: [
        "The starter marks the first corner with three lines. Ingrid does exactly those three at every corner.",
        "Turn those three lines into a function called `mark_corner`, with nothing in its brackets.",
        "Use it so all **four** corners of the forge get marked, one after another, and keep the closing line at the very end, said once.",
        "Each of the three corner lines should be written only once in your program.",
      ],
      starter: r`# Ingrid marks the first corner like this:
print("Tap in a stake.")
print("Tie on the string.")
print("Sight along the line.")

# The forge has four corners, and every one gets the same three steps.

print("The plot is marked out.")
`,
      tests: PRE + r`corner = ["Tap in a stake.", "Tie on the string.", "Sight along the line."]
takes("mark_corner", 0, "nothing in its brackets, because every corner is marked exactly the same way")
got, shown = says("mark_corner")
check("The plot is marked out." not in got, "The closing line is inside mark_corner, so it would be said at every corner. Bring it back out to the left edge, below the corners.")
check(got == corner, "When the rune calls mark_corner(), it should print the three corner steps from the starter, in order, and nothing else. It printed:" + show(got))
for step in corner:
    check(src.count(step) == 1, "The step " + repr(step) + " is written more than once in your program. Write the three steps once, inside mark_corner, and let your calls repeat them.")
check(re.search(r"^[ \t]*mark_corner[ \t]*$", src, re.M) is None, "A function's name on its own only points at the function; it doesn't run it. A call needs brackets after the name.")
n = lines.count(corner[0])
check(n > 0, "Your program printed no corner steps at all. Writing mark_corner teaches the stone the job, but the job only happens when you call it.")
check(n == 4, "Ingrid counted " + str(n) + " corner" + ("" if n == 1 else "s") + " marked. The forge has four.")
check(lines.count("The plot is marked out.") == 1, "The closing line should be said once, at the very end.")
expect_lines(corner * 4 + ["The plot is marked out."])`,
      hints: [
        "Which lines are the job Ingrid repeats? Those go inside the function. What happens only once stays outside it.",
        "A function is `def`, a name, empty brackets and a colon, with its lines indented under it: `def feed_hens():` and then the indented prints. To run it, write the name with brackets, `feed_hens()`. Every call runs the whole block again.",
        "Indent the three corner prints under `def mark_corner():`. Then, before the closing line, call `mark_corner()` once for each corner (four lines, or a loop: `for corner in range(_):`).",
      ],
      solution: r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")

mark_corner()
mark_corner()
mark_corner()
mark_corner()

print("The plot is marked out.")`,
      wrong: [r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")

print("The plot is marked out.")`, r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")

mark_corner()
print("The plot is marked out.")`, r`print("Tap in a stake.")
print("Tie on the string.")
print("Sight along the line.")
print("Tap in a stake.")
print("Tie on the string.")
print("Sight along the line.")
print("Tap in a stake.")
print("Tie on the string.")
print("Sight along the line.")
print("Tap in a stake.")
print("Tie on the string.")
print("Sight along the line.")
print("The plot is marked out.")`, r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")

mark_corner
mark_corner
mark_corner
mark_corner
print("The plot is marked out.")`, r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")
    print("The plot is marked out.")

for i in range(4):
    mark_corner()`, r`def mark_corner():
    print("Tap in a stake.")
    print("Tie on the string.")
    print("Sight along the line.")

for i in range(4):
    mark_corner()
    print("Tap in a stake.")
print("The plot is marked out.")`],
      done: "Ingrid: Four stakes. Four strings. Square to a hair. Wrote the job once, did it four times. That's how a smith thinks.",
    },
    {
      id: "f02-flagstones",
      part: "Stone plinth",
      title: "Row by Row",
      topic: "a parameter",
      cost: { wood: 0, stone: 7 },
      intro: [
        "Ingrid: Floor next. Stone plinth, flagstones on top, row by row. Level floor, level anvil.",
        "Ingrid: Rows aren't all the same, mind. The hearth takes a bite out of the middle ones.",
        "Ssso the job is the same each time, but one thing changes: how many stones. Give the function a **parameter**, a name in its brackets. Each call hands it a value, and inside the function the parameter holds that value.",
      ],
      codex: ["parameters", "functions"],
      quiz: {
        code: r`def shout(word):
    print(word.upper() + "!")

shout("hens")
shout("eggs")`,
        question: "What does this program show?",
        options: ["HENS!\nEGGS!", "WORD!\nWORD!", "hens!\neggs!", "TypeError"],
        answer: 0,
        why: "Each call hands a value to the parameter word: first \"hens\", then \"eggs\". Inside, word.upper() uses whatever word holds on that call.",
      },
      task: [
        "Write `lay_row`, a function that is handed one value: how many flagstones go in the row.",
        "Each call prints one line: a picture of the row, with `[]` for every flagstone, and then how many flagstones it has.",
        "Lay every row of the plinth, front to back, from the list in the starter.",
      ],
      starter: r`rows = [6, 6, 4, 4, 6]    # flagstones in each row, front to back

# lay_row: one row of flagstones, drawn with [] for each stone.

# Lay every row in the list.
`,
      tests: PRE + r`takes("lay_row", 1, "one value: how many flagstones are in the row")
for n in [3, 1, 9]:
    got, shown = says("lay_row", (n,))
    check(len(got) == 1, shown + " should print exactly one line, the row, but it printed " + str(len(got)) + ":" + show(got))
    check(got[0].count("[]") == n, shown + " drew " + str(got[0].count("[]")) + " flagstones:" + show(got) + chr(10) + "The row should have one [] for each stone the function is handed, whatever that number is.")
    check(n in nums(got[0]), shown + " drew the row but didn't say how many stones are in it:" + show(got))
def rows_ok(ls, rows, when):
    check(len(ls) == len(rows), when + "the rune expected " + str(len(rows)) + " rows laid, one line each, but your program printed " + str(len(ls)) + " line" + ("" if len(ls) == 1 else "s") + ":" + show(ls) + chr(10) + "Lay every row in the list, and only those.")
    for i in range(len(rows)):
        check(ls[i].count("[]") == rows[i] and rows[i] in nums(ls[i]), when + "row " + str(i + 1) + " should have " + str(rows[i]) + " flagstones, but your program printed:" + show([ls[i]]))
rows_ok(lines, [6, 6, 4, 4, 6], "Today ")
vns, got = again(("rows = [6, 6, 4, 4, 6]", "rows = [2, 7, 3]"))
rows_ok(got, [2, 7, 3], "With rows = [2, 7, 3], ")`,
      hints: [
        "One thing changes from row to row: how many stones. That's the value the function needs to be handed. Inside, use the parameter, never one particular number.",
        "A parameter is a name in the def's brackets: `def greet(name):`. The call `greet(\"Hazel\")` puts \"Hazel\" into name for that run. And text repeats with `*`: `\"ab\" * 3` is `ababab`.",
        "`def lay_row(stones):` with one print: `\"[]\" * stones`, then the number. Below it, `for n in rows:` and call `lay_row(...)` with each one.",
      ],
      solution: r`rows = [6, 6, 4, 4, 6]

def lay_row(stones):
    print("[]" * stones, stones)

for n in rows:
    lay_row(n)`,
      wrong: [r`rows = [6, 6, 4, 4, 6]

def lay_row():
    print("[]" * 6, 6)

for n in rows:
    lay_row()`, r`rows = [6, 6, 4, 4, 6]

def lay_row(stones):
    print("[][][][][][]", 6)

for n in rows:
    lay_row(n)`, r`rows = [6, 6, 4, 4, 6]

def lay_row(stones):
    print("[]" * stones)

for n in rows:
    lay_row(n)`, r`rows = [6, 6, 4, 4, 6]

def lay_row(stones):
    print("[]" * stones, stones)

lay_row(rows[0])`, r`rows = [6, 6, 4, 4, 6]

def lay_row(count):
    print("[]" * row, row)

for row in rows:
    lay_row(row)`, r`rows = [6, 6, 4, 4, 6]

def lay_row(stones):
    print("[]" * stones, stones)

lay_row(6)
lay_row(6)
lay_row(4)
lay_row(4)
lay_row(6)`],
      done: "Ingrid: Floor's flat. Put a ball bearing on it. Didn't roll. That's the test.",
    },
    {
      id: "f03-wall-courses",
      part: "Lower walls",
      title: "Name, Length, Courses",
      topic: "several parameters",
      cost: { wood: 0, stone: 8 },
      intro: [
        "Ingrid: Walls. Waist high today. Back wall, two sides, two piers at the front. Every stretch a different length.",
        "Ingrid: Count the stones before you lift one. Running out halfway up is scrap work.",
        "A function can take **several** parameters, separated by commas. The values in a call are matched up by position: the first value goes to the first parameter, the second to the second, and so on.",
      ],
      codex: ["parameters"],
      quiz: {
        code: r`def share(loaves, people):
    print(loaves // people)

share(2, 10)`,
        question: "What does this program show?",
        options: ["0", "5", "2 10", "ZeroDivisionError"],
        answer: 0,
        why: "Values go in by position: loaves gets 2 and people gets 10. 2 // 10 is 0. To share 10 loaves between 2, the call would need share(10, 2).",
      },
      task: [
        "Write `lay_wall`, which is handed three values in this order: the stretch's name, its length in metres, and how many courses (layers of stone) high it goes.",
        "Every metre of every course takes 3 stones. Each call prints one line that names the stretch and says how many stones it takes.",
        "Lay all five stretches from the starter, in the order listed, using `courses` for their height.",
      ],
      starter: r`# The lower walls, every stretch the same number of courses high:
#   Back wall    6 metres long
#   Left wall    5 metres
#   Right wall   5 metres
#   Left pier    1 metre
#   Right pier   1 metre
# Every metre of every course takes 3 stones.
courses = 5
`,
      tests: PRE + r`takes("lay_wall", 3, "three values: the stretch's name, its length and its courses")
for name, length, c in [("Garden wall", 2, 4), ("Well", 3, 1), ("Sheep pen", 7, 2)]:
    got, shown = says("lay_wall", (name, length, c), "The values arrive in order: the name first, then the length, then the courses. Is your def's list in that order?")
    check(len(got) == 1, shown + " should print exactly one line, but it printed " + str(len(got)) + ":" + show(got))
    check(name in got[0], shown + " printed:" + show(got) + chr(10) + "The line should name the stretch it was handed.")
    check(length * c * 3 in nums(got[0]), shown + " printed:" + show(got) + chr(10) + "That's a " + str(length) + " m stretch, " + str(c) + " course" + ("" if c == 1 else "s") + " high, at 3 stones per metre per course. Check the sum, and check the values arrive in the order name, length, courses.")
walls = ["back wall", "left wall", "right wall", "left pier", "right pier"]
def walls_ok(ls, courses, when):
    stones = [m * courses * 3 for m in [6, 5, 5, 1, 1]]
    check(len(ls) == 5, when + "the rune expected five lines, one for each stretch, but your program printed " + str(len(ls)) + ":" + show(ls))
    for i in range(5):
        check(walls[i] in ls[i].lower(), when + "line " + str(i + 1) + " should be the " + walls[i] + "'s line, but it says:" + show([ls[i]]) + chr(10) + "Lay the stretches in the order the starter lists them, and name each one.")
        check(stones[i] in nums(ls[i]), when + "the " + walls[i] + "'s stones don't add up:" + show([ls[i]]) + chr(10) + "Check the values in that call, and their order: name, length, courses.")
walls_ok(lines, 5, "Today ")
vns, got = again(("courses = 5", "courses = 4"))
walls_ok(got, 4, "With courses = 4, ")`,
      hints: [
        "Work out one stretch on paper first: 6 metres, 5 courses, 3 stones per metre per course. Then ask which of those changes from stretch to stretch, and which never does.",
        "Several parameters go in the brackets with commas: `def describe(animal, legs):`. A call fills them in order, so `describe(\"hen\", 2)` puts \"hen\" in animal and 2 in legs.",
        "`def lay_wall(name, length, courses):` with one print of the name and the stones (`length * courses * ...`). Then one call per stretch, like `lay_wall(\"Back wall\", 6, courses)`, and four more.",
      ],
      solution: r`courses = 5

def lay_wall(name, length, courses):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", 6, courses)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", 5, courses)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, courses)`,
      wrong: [r`courses = 5

def lay_wall(length, name, courses):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", 6, courses)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", 5, courses)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, courses)`, r`courses = 5

def lay_wall(name, length, courses):
    print(f"{name}: {length * courses} stones")

lay_wall("Back wall", 6, courses)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", 5, courses)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, courses)`, r`courses = 5

def lay_wall(name, length, high):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", 6, courses)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", 5, courses)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, courses)`, r`courses = 5

def lay_wall(name, length, courses):
    print(length * courses * 3, "stones")

lay_wall("Back wall", 6, courses)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", 5, courses)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, courses)`, r`courses = 5

def lay_wall(name, length, courses):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", courses, 6)
lay_wall("Left wall", 5, courses)
lay_wall("Right wall", courses, 5)
lay_wall("Left pier", 1, courses)
lay_wall("Right pier", 1, 1)`, r`courses = 5

def lay_wall(name, length):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", 6)
lay_wall("Left wall", 5)
lay_wall("Right wall", 5)
lay_wall("Left pier", 1)
lay_wall("Right pier", 1)`, r`courses = 5

def lay_wall(name, length, courses):
    print(f"{name}: {length * courses * 3} stones")

lay_wall("Back wall", 6, 5)
lay_wall("Left wall", 5, 5)
lay_wall("Right wall", 5, 5)
lay_wall("Left pier", 1, 5)
lay_wall("Right pier", 1, 5)`],
      done: "Ingrid: Walls to my waist. Counted every stone before we lifted one. Not one wasted. ...Good.",
    },
    {
      id: "f04-hand-it-back",
      part: "Walls and lintel",
      title: "Hand It Back",
      topic: "return vs print",
      cost: { wood: 3, stone: 7 },
      intro: [
        "Ingrid: Walls up to the eaves, then the lintel. Big oak beam over the open front, strapped with iron.",
        "Ingrid: Wrote a function for the wall stones. Tried to add the walls up. The stone threw a fit. Something about a NoneType. Never met him.",
        "Ha! `print` only shows a value to whoever is watching. To give an answer to the rest of the program, a function needs `return`. Without one, every call gives back `None`: nothing at all.",
      ],
      codex: ["return-vs-print", "return"],
      quiz: {
        code: r`def double(n):
    print(n * 2)

x = double(4)
print(x)`,
        question: "What does this program show?",
        options: ["8\nNone", "8\n8", "8", "None"],
        answer: 0,
        why: "Calling double(4) prints 8, but the function has no return, so x gets None. Then print(x) shows None.",
      },
      task: [
        "Run the starter and read its error. Fix `stones_for` so the main program can add up its answers. It should hand its number back quietly, without printing anything itself.",
        "Write `straps_for`: handed the lintel's length in centimetres, it gives back how many iron straps that beam needs. Ingrid puts a strap at the left end, then one more at every full 50 cm along it.",
        "After the walls' total, print how many straps the open front's lintel needs.",
      ],
      starter: r`lintel_cm = 460     # the open front is 4.6 m wide

def stones_for(length, courses):
    print(length * courses * 3)

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

# straps_for: how many straps a lintel this long needs.
`,
      tests: PRE + r`want("stones_for", (2, 3), 18, "A 2 m stretch, 3 courses high, at 3 stones per metre per course.")
res, printed, shown = call("stones_for", (2, 3))
check(printed == [], shown + " still prints something:" + show(printed) + chr(10) + "Let stones_for hand its number back quietly. The main program decides what to print.")
check(len(lines) > 0 and lines[0] == "Upper walls: 288 stones", "The first line should still be the starter's total for the upper walls. Your program printed:" + show(lines[:3]))
for cm, n, why in [(100, 3, "Count them on paper for a 100 cm beam: a strap at the left end (0 cm), one at 50 cm and one at 100 cm."), (49, 1, "A beam shorter than 50 cm still gets its strap at the left end."), (50, 2, "A strap at the left end, and one at 50 cm."), (120, 3, "Only full 50 cm steps get a new strap: 0, 50 and 100 fit on a 120 cm beam, 150 doesn't."), (250, 6, "")]:
    want("straps_for", (cm,), n, why + " Work it out from the length straps_for is handed.")
res, printed, shown = call("straps_for", (100,))
check(printed == [], shown + " prints something:" + show(printed) + chr(10) + "Let straps_for hand its number back quietly, and print it in the main program.")
def straps_ok(ls, cm, when):
    n = cm // 50 + 1
    check(any(n in nums(l) for l in ls[1:]), when + "after the walls' total, the rune expected a line with how many straps a " + str(cm) + " cm lintel needs. Your program printed:" + show(ls) + chr(10) + "Ask straps_for, handing it the lintel's length, and print what it gives back.")
straps_ok(lines, 460, "Today ")
vns, got = again(("lintel_cm = 460", "lintel_cm = 310"))
straps_ok(got, 310, "With lintel_cm = 310, ")`,
      hints: [
        "Read the error's last line: Python is trying to add None to None. Where do those Nones come from? What does stones_for give back to the line that called it? For the straps, draw a short beam on paper and mark where each strap goes.",
        "`return` hands a value back to the call, and the call then stands for it: with `def dozen(boxes): return boxes * 12`, the sum `dozen(2) + 1` is 25. The program can then print it, add it or store it.",
        "In stones_for, the print becomes `return length * courses * 3`. For the straps: `def straps_for(cm):` and `return cm // 50 + ...`. Then print `straps_for(lintel_cm)` in a sentence.",
      ],
      solution: r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm // 50 + 1

print(f"Lintel straps: {straps_for(lintel_cm)}")`,
      wrong: [r`lintel_cm = 460

def stones_for(length, courses):
    print(length * courses * 3)

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm // 50 + 1

print(f"Lintel straps: {straps_for(lintel_cm)}")`, r`lintel_cm = 460

def stones_for(length, courses):
    print(length * courses * 3)
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm // 50 + 1

print(f"Lintel straps: {straps_for(lintel_cm)}")`, r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    print(cm // 50 + 1)

straps_for(lintel_cm)`, r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm // 50

print(f"Lintel straps: {straps_for(lintel_cm)}")`, r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return lintel_cm // 50 + 1

print(f"Lintel straps: {straps_for(lintel_cm)}")`, r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm / 50 + 1

print(f"Lintel straps: {straps_for(lintel_cm)}")`, r`lintel_cm = 460

def stones_for(length, courses):
    return length * courses * 3

back = stones_for(6, 6)
left = stones_for(5, 6)
right = stones_for(5, 6)
total = back + left + right
print(f"Upper walls: {total} stones")

def straps_for(cm):
    return cm // 50 + 1

print("Lintel straps: 10")`],
      done: "Ingrid: Lintel's up. Ten straps, oak beam, not a sag in it. And the sums add up now. Funny that. Hand a thing over and people can use it.",
    },
    {
      id: "f05-hearth-coal",
      part: "The hearth",
      title: "Coal for the Fire",
      topic: "using a returned value",
      cost: { wood: 0, stone: 8 },
      intro: [
        "Ingrid: Found this digging the hearth pit. A horseshoe. Old. Older than old. Somebody's marks stamped in it.",
        "Those are runes! Willowmere had a smith once. Right here, where your hearth goes. Pip has goosebumps. Pip didn't know serpents could get goosebumps.",
        "Ingrid: Hm. Then we'd best do the place proud. Fire eats coal: two scoops to light it, three for every hour it burns. My scuttle holds what it holds.",
        "A returned value is just a value. Store it, do sums with it, drop it in an f-string, ask an `if` about it, or call the function again and again in a loop.",
      ],
      codex: ["return"],
      quiz: {
        code: r`def eggs(boxes):
    return boxes * 6

if eggs(2) > 10:
    print("Plenty")
else:
    print("Few")`,
        question: "What does this program show?",
        options: ["Plenty", "Few", "12", "(nothing)"],
        answer: 0,
        why: "eggs(2) gives back 12, so the if asks 12 > 10, which is True.",
      },
      task: [
        "`scoops_for` is handed how many hours a fire will burn and gives back how many scoops of coal that fire eats, lighting included.",
        "Print how many scoops today's fire needs.",
        "Then one line comparing that with a full `scuttle`. If the fire needs more than the scuttle holds, say how many scoops short Ingrid is, with the word short in the line. Otherwise say how many scoops will be left, with the word left.",
        "Last, print the most whole hours one full scuttle can keep a fire burning. Let `scoops_for` do the sums for you.",
      ],
      starter: r`hours = 5        # hours Ingrid will work the fire today
scuttle = 20     # scoops in a full coal scuttle
`,
      tests: PRE + r`want("scoops_for", (0,), 2, "A fire that burns 0 hours still has to be lit.")
want("scoops_for", (1,), 5, "One hour: the lighting, plus one hour of coal.")
want("scoops_for", (10,), 32, "Ten hours: the lighting, plus ten hours of coal.")
def report(ls, hours, scuttle, when):
    need = 2 + 3 * hours
    longest = (scuttle - 2) // 3
    check(len(ls) >= 3, when + "the rune expected three lines: today's need, short or left, and the longest fire. Your program printed:" + show(ls))
    check(need in nums(ls[0]), when + "the first line should say how many scoops a " + str(hours) + "-hour fire needs. It says:" + show(ls[:1]))
    second = ls[1].lower()
    if need > scuttle:
        check("short" in second and "left" not in second, when + "the fire needs more than a full scuttle, so the second line should say how many scoops short Ingrid is, with the word short. It says:" + show(ls[1:2]))
        check(need - scuttle in nums(ls[1]), when + "the second line has the wrong number of scoops short:" + show(ls[1:2]) + chr(10) + "Short means how many more she'd need on top of a full scuttle, as a plain number.")
    else:
        check("left" in second and "short" not in second, when + "a full scuttle is enough" + (" (exactly enough counts)" if need == scuttle else "") + ", so the second line should say how many scoops will be left, with the word left. It says:" + show(ls[1:2]))
        check(scuttle - need in nums(ls[1]), when + "the second line has the wrong number of scoops left:" + show(ls[1:2]))
    check(longest in nums(ls[2]), when + "the last line should give the longest fire, in whole hours, that one full scuttle can feed. It says:" + show(ls[2:3]) + chr(10) + "Try hours one at a time with scoops_for, and stop before the first one that doesn't fit.")
report(lines, 5, 20, "Today ")
for old, new, h, s in [("hours = 5", "hours = 8", 8, 20), ("hours = 5", "hours = 6", 6, 20), ("scuttle = 20", "scuttle = 4", 5, 4), ("scuttle = 20", "scuttle = 21", 5, 21)]:
    vns, got = again((old, new))
    report(got, h, s, "With " + new + ", ")`,
      hints: [
        "Function first: what does a 0-hour fire eat? A 1-hour fire? Then the last line: how could you find the longest fire without dividing anything by hand? Try hours one by one, asking the function each time.",
        "A returned value goes anywhere a value can: `if cost(3) > 10:`, `change = 20 - cost(3)`, or a loop that keeps going while the next try still fits: `while cost(n + 1) <= 10: n += 1`.",
        "`def scoops_for(hours): return 2 + ...`. Then `need = scoops_for(hours)` and an if/else on `need > scuttle`. For the last line, start `longest = 0` and add 1 while `scoops_for(longest + 1)` still fits in the scuttle.",
      ],
      solution: r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 2 + 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need > scuttle:
    print(f"Ingrid is {need - scuttle} scoops short.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")

longest = 0
while scoops_for(longest + 1) <= scuttle:
    longest += 1
print(f"A full scuttle lasts {longest} hours.")`,
      wrong: [r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need > scuttle:
    print(f"Ingrid is {need - scuttle} scoops short.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")
longest = 0
while scoops_for(longest + 1) <= scuttle:
    longest += 1
print(f"A full scuttle lasts {longest} hours.")`, r`hours = 5
scuttle = 20

def scoops_for(hours):
    print(2 + 3 * hours)

scoops_for(hours)
print("3 scoops left.")
print("6 hours")`, r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 2 + 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need >= scuttle:
    print(f"Ingrid is {need - scuttle} scoops short.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")
longest = 0
while scoops_for(longest + 1) <= scuttle:
    longest += 1
print(f"A full scuttle lasts {longest} hours.")`, r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 2 + 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need > scuttle:
    print(f"Ingrid is {need - scuttle} scoops short.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")
print(f"A full scuttle lasts {scuttle // 3} hours.")`, r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 2 + 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need > scuttle:
    print(f"Ingrid is {need - scuttle} scoops short.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")
longest = 0
while scoops_for(longest) <= scuttle:
    longest += 1
print(f"A full scuttle lasts {longest} hours.")`, r`hours = 5
scuttle = 20

def scoops_for(hours):
    return 2 + 3 * hours

need = scoops_for(hours)
print(f"Today's fire needs {need} scoops.")
if need > scuttle:
    print(f"Ingrid is short by {scuttle - need} scoops.")
else:
    print(f"{scuttle - need} scoops left in the scuttle.")
longest = 0
while scoops_for(longest + 1) <= scuttle:
    longest += 1
print(f"A full scuttle lasts {longest} hours.")`],
      done: "The coals are glowing! Pip can feel it from the rune stone. Pip's scales are toasty. Ingrid says Pip is not, under any circumstances, allowed to nap on the hearth.",
    },
    {
      id: "f06-chimney-draw",
      part: "Chimney",
      title: "Will It Draw?",
      topic: "functions that answer yes or no",
      cost: { wood: 0, stone: 9 },
      intro: [
        "Ingrid: Chimney. Stone, up from the hood, past the roof. Too short and the smoke rolls back in your face. Smiths with short chimneys cough a lot.",
        "Ingrid: Old rule. The top stands at least 60 cm above the ridge, or it doesn't draw.",
        "A function can answer a yes-or-no question by giving back `True` or `False`. A comparison already is True or False, so it can go straight after `return`.",
      ],
      codex: ["bool-functions", "return"],
      quiz: {
        code: r`def is_even(n):
    return n % 2 == 0

print(is_even(7))`,
        question: "What does this program show?",
        options: ["False", "True", "n % 2 == 0", "None"],
        answer: 0,
        why: "7 % 2 is 1, and 1 == 0 is False. The function gives back the comparison's answer, False.",
      },
      task: [
        "`draws_well` is handed two heights in centimetres from the ground, in this order: the top of a chimney, and the roof's ridge. It answers True if that chimney will draw, and False if it won't.",
        "The chimney starts at the top of the hood (`hood`) and goes up in courses of stone, each `course` cm tall. Using your function, find the fewest courses that make the chimney draw, and print that number.",
      ],
      starter: r`hood = 240      # the top of the stone hood, in cm from the ground
ridge = 590     # the roof's ridge, in cm from the ground
course = 30     # each course of chimney stone adds this much
`,
      tests: PRE + r`for top, ridge, ans, why in [(800, 600, True, "200 cm above the ridge is plenty."), (650, 600, False, "Only 50 cm above the ridge: not enough."), (700, 640, True, "Exactly 60 cm above the ridge counts: at least 60."), (699, 640, False, "59 cm above isn't 60."), (500, 600, False, "That top is below the ridge!")]:
    want("draws_well", (top, ridge), ans, why + " Is your function comparing the top with the ridge, in the order they're handed in?")
check(src.count("draws_well(") >= 2, "Find the courses by asking draws_well, the way Ingrid would: try a height, ask, add a course, ask again.")
def courses_ok(ls, hood, ridge, course, when):
    n = 0
    while hood + n * course - ridge < 60:
        n += 1
    check(len(ls) > 0 and n in nums(ls[-1]), when + "your last line isn't the fewest courses that make the chimney draw" + (". Here the hood alone is already high enough" if n == 0 else "") + ". Your program printed:" + show(ls) + chr(10) + "Count up from 0 courses, asking draws_well about the height each time.")
courses_ok(lines, 240, 590, 30, "Today ")
for old, new, h, rg, c in [("ridge = 590", "ridge = 600", 240, 600, 30), ("ridge = 590", "ridge = 500", 240, 500, 30), ("hood = 240", "hood = 650", 650, 590, 30), ("course = 30", "course = 50", 240, 590, 50)]:
    vns, got = again((old, new))
    courses_ok(got, h, rg, c, "With " + new + ", ")`,
      hints: [
        "Two separate jobs. The function only answers \"would a chimney this tall draw?\". The searching happens outside it: try 0 courses, then 1, then 2, and stop at the first that draws.",
        "A comparison is already True or False, so return it directly: `def is_ripe(days): return days >= 5`. A loop can keep going while the answer is no: `while not is_full(basket): basket += 5`.",
        "`def draws_well(top, ridge): return top - ridge >= ...`. Then `courses = 0` and `while not draws_well(hood + courses * course, ridge):` add one course. Print courses after the loop.",
      ],
      solution: r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    return top - ridge >= 60

courses = 0
while not draws_well(hood + courses * course, ridge):
    courses += 1
print(f"The chimney needs {courses} courses.")`,
      wrong: [r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    return top - ridge > 60

courses = 0
while not draws_well(hood + courses * course, ridge):
    courses += 1
print(f"The chimney needs {courses} courses.")`, r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    print(top - ridge >= 60)

print("The chimney needs 14 courses.")`, r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    if top - ridge >= 60:
        return "True"
    return "False"

courses = 0
while draws_well(hood + courses * course, ridge) == "False":
    courses += 1
print(f"The chimney needs {courses} courses.")`, r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    return top - ridge >= 60

courses = 1
while not draws_well(hood + courses * course, ridge):
    courses += 1
print(f"The chimney needs {courses} courses.")`, r`hood = 240
ridge = 590
course = 30

def draws_well(top, ridge):
    return top - ridge >= 60

print(draws_well(660, 590))
print("The chimney needs 14 courses.")`, r`hood = 240
ridge = 590
course = 30

def draws_well(ridge, top):
    return top - ridge >= 60

courses = 0
while not draws_well(ridge, hood + courses * course):
    courses += 1
print(f"The chimney needs {courses} courses.")`],
      done: "Ingrid: Smoke goes up. Not in my eyes. That's a chimney.",
    },
    {
      id: "f07-good-or-scrap",
      part: "Roof frame",
      title: "Good Work or Scrap",
      topic: "choosing what to return",
      cost: { wood: 9, stone: 0 },
      intro: [
        "Ingrid: Roof frame. Rafters, a ridge beam, a tie beam. Timber came on Sable's cart. I don't trust timber I haven't graded.",
        "Ingrid: Every beam is one of three things. Good. Patch it. Scrap.",
        "One function, three possible answers. Put a `return` in each branch of an `if` / `elif` / `else`. The first `return` Python reaches ends the function on the spot, so the order of your questions matters.",
      ],
      codex: ["choosing-returns", "bool-functions"],
      quiz: {
        code: r`def size(n):
    if n > 10:
        return "big"
    return "small"
    print("done")

print(size(12))`,
        question: "What does this program show?",
        options: ["big", "big\ndone", "small", "None"],
        answer: 0,
        why: "12 > 10, so the function returns \"big\" and stops right there. The lines after that return never run for this call.",
      },
      task: [
        "`grade` is handed a beam's length in cm, how many knots it has, and whether it is split (True or False), in that order. It gives back one word: `\"good\"`, `\"patch\"` or `\"scrap\"`.",
        "Ingrid's rules: a split beam is scrap, always. So is a beam shorter than 300 cm. A sound beam that's long enough but has more than 4 knots needs a patch. Anything else is good.",
        "Grade every beam in the starter, then print how many came out good, how many need a patch and how many are scrap: one line each, with its word in it.",
      ],
      starter: r`# Sable's timber: one beam for each position in the three lists.
lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]
`,
      tests: PRE + r`for args, ans, why in [
    ((320, 2, False), "good", "Long enough, few knots, no split: good work."),
    ((300, 1, False), "good", "Exactly 300 cm is long enough: only shorter beams are scrap."),
    ((350, 4, False), "good", "Exactly 4 knots is fine: a patch is for more than 4."),
    ((299, 0, False), "scrap", "299 cm is shorter than 300: scrap."),
    ((400, 5, False), "patch", "Sound and long enough, but more than 4 knots: patch it."),
    ((400, 0, True), "scrap", "A split beam is scrap, always. Is your function asking about split as a True or False value?"),
    ((400, 8, True), "scrap", "A split beam is scrap however many knots it has. Which rule does your function ask first?"),
    ((250, 7, False), "scrap", "A short beam is scrap even if it has knots too. Which rule does your function ask first?"),
]:
    want("grade", args, ans, why)
def counts_ok(ls, g, p, s, when):
    for word, n in [("good", g), ("patch", p), ("scrap", s)]:
        found = [l for l in ls if word in l.lower()]
        check(found, when + "the rune couldn't find a line with the word " + word + " in it. Your program printed:" + show(ls))
        check(n in nums(found[0]), when + "the " + word + " count is off:" + show(found[:1]) + chr(10) + "Count it by grading every beam with grade, not by hand.")
counts_ok(lines, 5, 2, 3, "Today ")
vns, got = again(("splits = [False, False, False, True, False, False, False, True, False, False]", "splits = [False, False, False, False, False, False, False, False, False, False]"))
counts_ok(got, 6, 3, 1, "With no split beams, ")
vns, got = again(("knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]", "knots = [2, 2, 1, 0, 4, 3, 2, 5, 2, 1]"))
counts_ok(got, 7, 0, 3, "With fewer knots, ")`,
      hints: [
        "Put the rules in the order Ingrid would check them. Which rules make a beam scrap no matter what else is true? Those have to be asked first.",
        "A chain with a `return` in each branch, where the first True one decides: `if member: return \"free\"` comes before `if age < 12: return \"half\"`. To count, keep a counter per word and add 1 when grade gives back that word; `zip` walks the three lists together.",
        "`if split or length < 300: return \"scrap\"`, then `elif knots > 4:`, then `else:`. Below, `for l, k, s in zip(lengths, knots, splits):` and look at what `grade(l, k, s)` gives back.",
      ],
      solution: r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length < 300:
        return "scrap"
    elif knots > 4:
        return "patch"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`,
      wrong: [r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if knots > 4:
        return "patch"
    elif split or length < 300:
        return "scrap"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split:
        return "scrap"
    elif knots > 4:
        return "patch"
    elif length < 300:
        return "scrap"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length <= 300:
        return "scrap"
    elif knots > 4:
        return "patch"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length < 300:
        return "scrap"
    elif knots >= 4:
        return "patch"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length < 300:
        print("scrap")
    elif knots > 4:
        print("patch")
    else:
        print("good")

print("Good beams: 5")
print("To patch: 2")
print("Scrap: 3")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length < 300:
        return "Scrap"
    elif knots > 4:
        return "Patch"
    else:
        return "Good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "Good":
        good += 1
    elif word == "Patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split == "True" or length < 300:
        return "scrap"
    elif knots > 4:
        return "patch"
    else:
        return "good"

good = 0
patch = 0
scrap = 0
for l, k, s in zip(lengths, knots, splits):
    word = grade(l, k, s)
    if word == "good":
        good += 1
    elif word == "patch":
        patch += 1
    else:
        scrap += 1
print(f"Good beams: {good}")
print(f"To patch: {patch}")
print(f"Scrap: {scrap}")`, r`lengths = [320, 305, 290, 340, 300, 315, 330, 310, 360, 300]
knots = [2, 6, 1, 0, 4, 3, 9, 5, 2, 1]
splits = [False, False, False, True, False, False, False, True, False, False]

def grade(length, knots, split):
    if split or length < 300:
        return "scrap"
    elif knots > 4:
        return "patch"
    else:
        return "good"

print("Good beams: 5")
print("To patch: 2")
print("Scrap: 3")`],
      done: "Ingrid: Good timber up, patches where patches go, scrap in the kindling box. Sable can have the scrap back. With my compliments.",
    },
    {
      id: "f08-tile-order",
      part: "Tile roof",
      title: "Four Spare Tiles",
      topic: "default parameter values",
      cost: { wood: 2, stone: 8 },
      intro: [
        "Ingrid: Clay tiles. Red, a few mossy ones for luck. Tiles crack. So I always order four spare. Always.",
        "Ingrid: Unless I say different. Then I mean different.",
        "That's a **default value**! Write the usual value with `=` in the def line, and when a call leaves that value out, the parameter gets the usual. A call can still hand in its own value instead.",
      ],
      codex: ["defaults-keywords"],
      quiz: {
        code: r`def brew(cups, sugar=1):
    print(cups, sugar)

brew(3)
brew(2, 0)`,
        question: "What does this program show?",
        options: ["3 1\n2 0", "3\n2 0", "3 1\n2 1", "TypeError"],
        answer: 0,
        why: "brew(3) leaves sugar out, so it gets its default, 1. brew(2, 0) hands in 0, which replaces the default.",
      },
      task: [
        "`tile_order` is handed the number of rows, the tiles in each row, and the spares, in that order. It gives back how many tiles to order: every tile on the roof, plus the spares. When a call doesn't say how many spares, it's Ingrid's usual four.",
        "Order the roof: both slopes in one order, each slope `rows_per_slope` rows of `tiles_per_row` tiles, with the usual spares.",
        "Order the ridge: one row of `ridge_caps`. Ridge caps are thick and never crack, so no spares at all.",
        "Print the roof order, then the ridge order, then the total of both.",
      ],
      starter: r`rows_per_slope = 11    # rows of tiles on each side of the roof
tiles_per_row = 18     # tiles in one row
ridge_caps = 15        # caps along the top, in a single row
`,
      tests: PRE + r`f = takes("tile_order", 3, "three values: the rows, the tiles in each row, and the spares")
ps = list(inspect.signature(f).parameters.values())
check(ps[2].default is not inspect.Parameter.empty, "A call that leaves out the spares should get Ingrid's usual four. Give the spares parameter its usual value in the def line.")
check(ps[2].default == 4, "Ingrid's usual is four spares, but your def line gives the spares a usual value of " + repr(ps[2].default) + ".")
want("tile_order", (2, 3), 10, "Two rows of three, and the call doesn't mention spares: so the usual spares go on top.")
want("tile_order", (2, 3, 0), 6, "This call asks for 0 spares. When a call names the spares, use them instead of the usual.")
want("tile_order", (1, 1, 9), 10, "One tile, and nine spares.")
def orders_ok(ls, rps, tpr, caps, spare, when, tail):
    roof = 2 * rps * tpr + spare
    total = roof + caps
    seen = [x for l in ls for x in nums(l)]
    if roof not in seen:
        check(2 * rps * tpr + 2 * spare not in seen, when + "your roof order has the spares twice. Order both slopes together, with the usual spares once.")
        check(False, when + "the roof order is wrong or missing. It's every tile on both slopes, plus the usual spares. Your program printed:" + show(ls) + tail)
    check(not (caps + spare in seen and total + spare in seen), when + "your ridge order has spares on it. Ridge caps never crack: no spares at all, not even the usual.")
    check(caps in seen, when + "the ridge order is wrong or missing: one row of ridge caps, no spares. Your program printed:" + show(ls))
    check(missing(ls, [roof, caps, total]) is None, when + "print the roof order, then the ridge order, then the total of the two. Your program printed:" + show(ls))
orders_ok(lines, 11, 18, 15, 4, "Today ", "")
vns, got = again(("rows_per_slope = 11", "rows_per_slope = 10"))
orders_ok(got, 10, 18, 15, 4, "With rows_per_slope = 10, ", "")
vns, got = again(("ridge_caps = 15", "ridge_caps = 12"))
orders_ok(got, 11, 18, 12, 4, "With ridge_caps = 12, ", "")
m = re.search(r"def\s+tile_order\s*\(.*\)\s*:", src)
check(m is not None, "Keep the def line of tile_order on one line, so the rune can read it.")
old_def = m.group(0)
new_def = re.sub(r"\b" + ps[2].name + r"\s*=\s*4\b", ps[2].name + "=6", old_def)
vns, got = variant(src.replace(old_def, new_def, 1), "When Ingrid changes her usual to six spares, ")
orders_ok(got, 11, 18, 15, 6, "When Ingrid changes her usual to six spares, ", chr(10) + "Your roof order didn't follow her new usual. Leave the spares out of the roof's call, so it gets whatever the usual is.")`,
      hints: [
        "One function, two very different orders. The roof's call leaves the spares out; the ridge's call says something else. What should the def line say, so that leaving the spares out means four?",
        "A default goes in the def line: `def brew(cups, sugar=1):`. Then `brew(3)` gets sugar 1, and `brew(3, 0)` gets sugar 0. Parameters with defaults go after the ones without.",
        "`def tile_order(rows, per_row, spare=4):` gives back every tile plus the spares. The roof is `tile_order(2 * rows_per_slope, tiles_per_row)`; the ridge is `tile_order(1, ridge_caps, ...)`.",
      ],
      solution: r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=4):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`,
      wrong: [r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row, 4)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(spare=4, rows, per_row):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=4):
    return rows * per_row + 4

roof = tile_order(2 * rows_per_slope, tiles_per_row)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=4):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row)
ridge = tile_order(1, ridge_caps)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=4):
    return rows * per_row + spare

roof = tile_order(rows_per_slope, tiles_per_row) + tile_order(rows_per_slope, tiles_per_row)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=4):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row, 4)
ridge = tile_order(1, ridge_caps, 0)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`, r`rows_per_slope = 11
tiles_per_row = 18
ridge_caps = 15

def tile_order(rows, per_row, spare=0):
    return rows * per_row + spare

roof = tile_order(2 * rows_per_slope, tiles_per_row, 4)
ridge = tile_order(1, ridge_caps)
print(f"Roof tiles: {roof}")
print(f"Ridge caps: {ridge}")
print(f"Total: {roof + ridge}")`],
      done: "Ingrid: Tiles on. Four spare in the corner. I'll need them. I always need them.",
    },
    {
      id: "f09-bellows-keywords",
      part: "Bellows",
      title: "Say Which One You Mean",
      topic: "keyword arguments",
      cost: { wood: 5, stone: 0 },
      intro: [
        "Ingrid: Bellows. Leather, pleats, a lever on a post. Pump it and the fire roars. Young Pell worked ours at the Company. Never stopped talking. Never stopped pumping either.",
        "Ingrid: Wrote my fire down as a function. Pumps, coal, wind, damp. Most days I only change one thing.",
        "When a function has several defaults and you only want to change one, name it in the call, like `damp=True`. That's a **keyword argument**: Python matches it by its name, not its place, and the others keep their usual values.",
      ],
      codex: ["defaults-keywords"],
      quiz: {
        code: r`def label(item, colour="grey", size="small"):
    print(size, colour, item)

label("cup", size="big")`,
        question: "What does this program show?",
        options: ["big grey cup", "small big cup", "big cup", "SyntaxError"],
        answer: 0,
        why: "size=\"big\" is matched by its name, so colour keeps its default, \"grey\". The print puts size first, then colour, then item.",
      },
      task: [
        "Ingrid's `fire_heat` is in the starter. Leave it exactly as she wrote it: its defaults are her usual coal, her usual wind and a dry day.",
        "Print how hot the fire gets for each of her three questions, in this order. 1: 10 pumps of the bellows on a usual day. 2: 10 pumps on a damp morning, everything else usual. 3: 8 pumps with the wind at 5 through the open front, on a damp morning, with the usual coal.",
        "Ingrid may change her usual values one day. Your answers should follow when she does.",
      ],
      starter: r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

# Ingrid's three questions (see the task):
`,
      tests: PRE + r`def_line = "def fire_heat(pumps, coal=3, wind=0, damp=False):"
check(def_line in src, "Keep Ingrid's def line exactly as she wrote it. Her usual values live there.")
want("fire_heat", (1,), 520, "That's Ingrid's own function: leave the inside of fire_heat as she wrote it.")
qs = ["question 1 (10 pumps on a usual day)", "question 2 (10 pumps on a damp morning)", "question 3 (8 pumps, the wind at 5, a damp morning, the usual coal)"]
def heats_ok(ls, vals, when, tail):
    for k in range(3):
        if missing(ls, vals[:k + 1]) is not None:
            extra = tail
            if k == 1 and 760 in [x for l in ls for x in nums(l)] and vals[0] == 880:
                extra = chr(10) + "760 is what you get when the True lands in coal: values without names fill the parameters in order, and the second one is coal. Say which parameter you mean."
            check(False, when + "the rune couldn't find the answer to " + qs[k] + " in what you printed:" + show(ls) + extra)
heats_ok(lines, [880, 780, 750], "Today ", chr(10) + "Work each answer out with fire_heat, saying only the values that differ from Ingrid's usual.")
vns, got = variant(src.replace(def_line, "def fire_heat(pumps, coal=5, wind=1, damp=False):", 1), "When Ingrid changes her usual coal to 5 and her usual wind to 1, ")
heats_ok(got, [1010, 910, 870], "When Ingrid changes her usual coal to 5 and her usual wind to 1, ", chr(10) + "An answer that didn't follow her new usual has her old usual typed into the call (or a number typed in). Name only the values that change, and let the defaults do the rest.")`,
      hints: [
        "For each question, ask: which of Ingrid's values are different from her usual? Only those need saying. Everything else, leave to her defaults.",
        "Name a parameter in the call to set just that one: `pack(\"jam\", note=True)` keeps box and ribbon at their defaults. Values without names fill the parameters in order, so they come first.",
        "Question 1 is plain `fire_heat(10)`. Question 2 adds one keyword: `fire_heat(10, damp=True)`. Question 3 hands in 8 and needs two keywords. Print all three.",
      ],
      solution: r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(10, damp=True)} degrees")
print(f"Windy and damp: {fire_heat(8, wind=5, damp=True)} degrees")`,
      wrong: [r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(10, 3, 0, True)} degrees")
print(f"Windy and damp: {fire_heat(8, 3, 5, True)} degrees")`, r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(10, True)} degrees")
print(f"Windy and damp: {fire_heat(8, wind=5, damp=True)} degrees")`, r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(10, damp=True)} degrees")
print(f"Windy and damp: {fire_heat(8, wind=5)} degrees")`, r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(10, damp=True)} degrees")
print(f"Windy and damp: {fire_heat(8, 5, damp=True)} degrees")`, r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print(f"Usual day: {fire_heat(10)} degrees")
print(f"Damp morning: {fire_heat(damp=True, 10)} degrees")
print(f"Windy and damp: {fire_heat(8, wind=5, damp=True)} degrees")`, r`def fire_heat(pumps, coal=3, wind=0, damp=False):
    heat = 300 + pumps * 40 + coal * 60 + wind * 10
    if damp:
        heat = heat - 100
    return heat

print("Usual day: 880 degrees")
print("Damp morning: 780 degrees")
print("Windy and damp: 750 degrees")`],
      done: "Ingrid: Seven hundred and fifty, on a damp morning with the wind in. Ha. That's right. Pell used to guess it from the roar. Pell was usually right.",
    },
    {
      id: "f10-hot-blows",
      part: "Anvil",
      title: "While It's Hot",
      topic: "a function that takes a list",
      cost: { wood: 2, stone: 5 },
      intro: [
        "Ingrid: Anvil. On an oak stump, banded with iron. Now we work metal.",
        "Ingrid: Strike while it's hot. I mean it. Under cherry red, iron cracks when you hit it. That's 750 degrees. Below that, back in the fire.",
        "A parameter can hold a whole list. Inside, loop over it like any list. And a `return` inside the loop ends the loop and the function at once, the moment you know the answer.",
      ],
      codex: ["list-functions", "return"],
      quiz: {
        code: r`def total(nums):
    t = 0
    for n in nums:
        t += n
    return t

print(total([2, 3]) + total([]))`,
        question: "What does this program show?",
        options: ["5", "None", "TypeError", "0"],
        answer: 0,
        why: "total([2, 3]) is 5. For the empty list the loop runs zero times, so t stays 0 and the function returns 0. 5 + 0 is 5.",
      },
      task: [
        "`hot_blows` is handed a list: the bar's temperature at the moment each hammer blow was about to land, in order. It gives back how many blows Ingrid lands before the iron is too cold.",
        "She strikes while the iron is 750 degrees or more. At the first reading below that, the bar goes back in the fire, so that blow and everything after it don't count.",
        "Work all three bars in the starter: print how many blows each got, in order, and then the total for all three.",
      ],
      starter: r`# The bar's temperature as each blow was about to land, one list per bar.
bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]
`,
      tests: PRE + r`takes("hot_blows", 1, "one value: the list of temperatures")
for temps, n, why in [
    ([1000, 980, 960], 3, "Every reading is hot enough, so every blow lands."),
    ([800, 790, 760, 749, 900], 3, "Ingrid stops at the first reading below 750, the 749. The 900 after it doesn't count: by then the bar is back in the fire."),
    ([750, 750], 2, "750 is still hot enough: only below 750 does iron crack."),
    ([700, 900], 0, "The very first reading is too cold, so not one blow lands."),
    ([], 0, "A bar with no readings gets no blows."),
]:
    given = list(temps)
    want("hot_blows", (given,), n, why, crash="Check what your function does when the list runs out before any cold reading, and when it's empty.")
    check(given == temps, "hot_blows changed the list it was handed (it became " + repr(given) + "). Read the temperatures; don't take them out of Ingrid's list.")
def bars_ok(ls, counts, when):
    check(missing(ls, counts + [sum(counts)]) is None, when + "the rune expected each bar's blow count, in order, then the total. Your program printed:" + show(ls) + chr(10) + "Let hot_blows count each bar, and add up what it gives back.")
bars_ok(lines, [5, 2, 0], "Today ")
vns, got = again(("bar3 = [700, 950, 940]", "bar3 = [950, 940, 700]"))
bars_ok(got, [5, 2, 2], "With bar3 = [950, 940, 700], ")`,
      hints: [
        "Walk through the first bar on paper: count the blows, and stop at the first reading that's too cold. What should come back if every reading is hot? If the list is empty?",
        "Loop over the list parameter with `for`. A `return` inside the loop ends the whole function at once: `for a in apples:` / `if a == \"rotten\": return True`. The `return` after the loop only runs if the loop finished without one.",
        "`count = 0`, then `for t in temps:` with `if t < 750: return count` and `count += 1`. After the loop, return ... Then call `hot_blows` on each bar and add up the answers.",
      ],
      solution: r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t < 750:
            return count
        count += 1
    return count

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`,
      wrong: [r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t >= 750:
            count += 1
    return count

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t <= 750:
            return count
        count += 1
    return count

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t < 750:
            return count
        count += 1

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t < 750:
            return count
        count += 1
        return count
    return count

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    i = 0
    while temps[i] >= 750:
        i += 1
    return i

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    while len(temps) > 0 and temps[0] >= 750:
        temps.pop(0)
        count += 1
    return count

total = 0
for bar in [bar1, bar2, bar3]:
    blows = hot_blows(bar)
    print(f"{blows} blows")
    total += blows
print(f"Total: {total} blows")`, r`bar1 = [910, 880, 845, 800, 770, 740, 720]
bar2 = [760, 750, 749, 900]
bar3 = [700, 950, 940]

def hot_blows(temps):
    count = 0
    for t in temps:
        if t < 750:
            return count
        count += 1
    return count

print(hot_blows(bar1))
print(hot_blows(bar2))
print(hot_blows(bar3))
print("Total: 7")`],
      done: "Ingrid: First bar drawn out on the new anvil. Struck it hot, put it back in time. Never once hit cold iron. That's the whole trade.",
    },
    {
      id: "f11-quench",
      part: "Quench trough",
      title: "Cold Water",
      topic: "functions calling functions",
      cost: { wood: 0, stone: 7 },
      intro: [
        "Ingrid: Quench trough. Hot iron goes in, steam comes out. Cold water's the only thing that tells iron to stay put.",
        "Ingrid: Every piece warms the water. Too warm and the quench is useless. Then someone fetches a bucket of cold from the pond. Usually me.",
        "Big jobs are easier as small functions working together. Write the small ones, test them, then let the big one call them. If a rule ever changes, you change it in one place.",
      ],
      codex: ["calling-functions", "bool-functions"],
      quiz: {
        code: r`def half(n):
    return n // 2

def quarter(n):
    return half(half(n))

print(quarter(20))`,
        question: "What does this program show?",
        options: ["5", "10", "2", "NameError"],
        answer: 0,
        why: "quarter(20) asks for half(half(20)). The inner call gives back 10, then half(10) gives back 5.",
      },
      task: [
        "`warms_by` is handed a piece's weight in kilos and gives back how many degrees it heats the trough: 4 degrees for every kilo.",
        "`too_hot` is handed the water's temperature and answers True once the water is 60 degrees or more, False below that.",
        "`buckets` is handed the water's starting temperature and a list of the weights Ingrid will quench, in order. Each piece warms the water as it goes in. Then, as long as the water is too hot, Ingrid pours in a bucket of cold, which cools it by 15 degrees. It gives back how many buckets she carried. Let it ask your other two functions for their parts of the job.",
        "Print how many buckets today's work takes.",
      ],
      starter: r`water = 40                     # the trough's temperature this morning
pieces = [3, 2, 5, 1, 4, 2]    # weights in kilos, in the order Ingrid quenches them
`,
      tests: PRE + r`want("warms_by", (1,), 4, "4 degrees for every kilo.")
want("warms_by", (3,), 12, "4 degrees for every kilo.")
want("warms_by", (0,), 0, "A piece that weighs nothing warms nothing.")
want("too_hot", (60,), True, "60 degrees already counts as too hot.")
want("too_hot", (59,), False, "59 is still cool enough.")
want("too_hot", (75,), True, "75 is far too hot.")
for args, n, why in [
    ((20, []), 0, "No pieces to quench, no buckets."),
    ((10, [2, 2]), 0, "The water never gets to 60."),
    ((58, [1]), 1, "The water is checked after each piece goes in: 58 warms past 60."),
    ((50, [10]), 3, "After one bucket the water can still be too hot. Ingrid keeps pouring until it isn't."),
    ((15, [15]), 2, "Exactly 60 after a bucket is still too hot: one more trip."),
    ((40, [3, 2, 5, 1]), 2, "Follow the water on paper, one piece at a time."),
]:
    want("buckets", args, n, why)
res = swapped("warms_by", lambda w: w * 10, lambda: call("buckets", (20, [5]))[0])
check(res == 1, "Ingrid tried a new rule in warms_by, and buckets didn't follow it. Let buckets ask warms_by how much each piece heats the water, instead of doing that sum itself.")
res = swapped("too_hot", lambda t: t >= 30, lambda: call("buckets", (20, [3]))[0])
check(res == 1, "Ingrid tried a new rule in too_hot, and buckets didn't follow it. Let buckets ask too_hot whether the water needs a bucket, instead of comparing it itself.")
def today_ok(ls, n, when):
    check(len(ls) > 0 and n in nums(ls[-1]), when + "your last line should say how many buckets the work takes. Your program printed:" + show(ls) + chr(10) + "Ask buckets, handing it the water and the pieces.")
today_ok(lines, 4, "Today ")
vns, got = again(("pieces = [3, 2, 5, 1, 4, 2]", "pieces = [10, 1]"))
today_ok(got, 2, "With pieces = [10, 1], ")
vns, got = again(("water = 40", "water = 0"))
today_ok(got, 1, "With water = 0, ")`,
      hints: [
        "Write the two small functions first, and test them: print a couple of calls and check them by hand. Then tell buckets' job as a story: for each piece, warm the water; then, while it's too hot, pour a bucket.",
        "A function can use another's answer: `def with_basket(apples): return price(apples) + 5`. Inside a loop it works the same: `temp = temp + warms_by(...)`, and `while too_hot(temp):` keeps going while the answer is yes.",
        "`def buckets(start, weights):` sets `temp = start` and `n = 0`. `for w in weights:` adds `warms_by(w)` to temp, then `while too_hot(temp):` takes 15 away and counts 1. Return ...",
      ],
      solution: r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + warms_by(w)
        while too_hot(temp):
            temp = temp - 15
            n += 1
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`,
      wrong: [r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + w * 4
        while too_hot(temp):
            temp = temp - 15
            n += 1
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + warms_by(w)
        while temp >= 60:
            temp = temp - 15
            n += 1
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp > 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + warms_by(w)
        while too_hot(temp):
            temp = temp - 15
            n += 1
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + warms_by(w)
        if too_hot(temp):
            temp = temp - 15
            n += 1
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        while too_hot(temp):
            temp = temp - 15
            n += 1
        temp = temp + warms_by(w)
    return n

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    return weight * 4

def too_hot(temp):
    return temp >= 60

def buckets(start, weights):
    temp = start
    n = 0
    for w in weights:
        temp = temp + warms_by(w)
        while too_hot(temp):
            temp = temp - 15
            n += 1
    return temp

print(f"Today's quenching takes {buckets(water, pieces)} buckets.")`, r`water = 40
pieces = [3, 2, 5, 1, 4, 2]

def warms_by(weight):
    print(weight * 4)

def too_hot(temp):
    return temp >= 60

print("Today's quenching takes 4 buckets.")`],
      done: "Ingrid: Steam. Hiss. Good. Trough's full, bucket's by the anvil, and I know how many trips I'm making before I make them.",
    },
    {
      id: "f12-tool-racks",
      part: "Tool racks",
      title: "Every Tool on Its Peg",
      topic: "scope: a function's own variables",
      cost: { wood: 6, stone: 0 },
      intro: [
        "Ingrid: Racks. Pegs for hammers, tongs, files, horseshoes. A tool on the floor is a tool you trip over.",
        "Ingrid: Wrote the peg count myself. It's scrap. The stone keeps shouting something about an UnboundLocalError.",
        "A function's variables are its own. Names made inside a function live and vanish inside it, and assigning to a name inside a function makes a brand-new local one, even if the same name exists outside. So hand values in as parameters, and hand answers back with return.",
      ],
      codex: ["scope", "calling-functions"],
      quiz: {
        code: r`n = 5

def bump():
    n = 10
    return n

bump()
print(n)`,
        question: "What does this program show?",
        options: ["5", "10", "UnboundLocalError", "None"],
        answer: 0,
        why: "The n inside bump is the function's own new variable. The n outside is never touched, so it is still 5.",
      },
      task: [
        "Run the starter and read its errors. Rebuild it so each function is handed what it needs and hands its answer back.",
        "`pegs_used` is handed a list of tools and gives back how many pegs they take. Tongs are long and take two pegs; anything else takes one.",
        "`pegs_free` is handed how many pegs a rack has and a list of tools, in that order, and gives back how many pegs are still empty once they're all hung. Let it ask `pegs_used`.",
        "Print how many pegs are still free on the forge's rack. No `global`: each function keeps to its own peg.",
      ],
      starter: r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used():
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1

def pegs_free():
    pegs = pegs - used

pegs_used()
pegs_free()
print(f"Pegs still free: {pegs}")
`,
      tests: PRE + r`check(re.search(r"\bglobal\b", src) is None, "No global here: each function keeps to its own peg. Hand values in through the brackets and hand the answer back with return.")
takes("pegs_used", 1, "one value: the list of tools")
want("pegs_used", (["tongs"],), 2, "Tongs are long: two pegs.")
want("pegs_used", ([],), 0, "No tools, no pegs.")
want("pegs_used", (["file", "rasp", "tongs", "tongs"],), 6, "One peg each for the file and the rasp, two for each pair of tongs. pegs_used should count the list it is handed, not the forge's own list.")
takes("pegs_free", 2, "two values: how many pegs the rack has, and the list of tools")
want("pegs_free", (10, ["tongs", "hammer"]), 7, "A 10-peg rack, with tongs and a hammer hung on it. Work from the 10 pegs_free is handed, not the forge rack's count.")
want("pegs_free", (5, []), 5, "Nothing hung, so every peg is still free.")
want("pegs_free", (20, ["hammer", "hammer", "hammer"]), 17, "Three hammers, one peg each.")
res = swapped("pegs_used", lambda t: 100, lambda: call("pegs_free", (150, ["file"]))[0])
check(res == 50, "Let pegs_free ask pegs_used how many pegs the tools take, instead of counting them all over again.")
def free_ok(ls, n, when):
    check(len(ls) > 0 and n in nums(ls[-1]), when + "the last line should say how many pegs are still free on the forge's rack. Your program printed:" + show(ls) + chr(10) + "pegs_free hands its answer back: catch it in a variable, or print it directly.")
free_ok(lines, 6, "Today ")
vns, got = again(("pegs = 14", "pegs = 20"))
free_ok(got, 12, "With pegs = 20, ")
vns, got = again(('tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]', 'tools = ["tongs", "file"]'))
free_ok(got, 11, "With tools = [\"tongs\", \"file\"], ")`,
      hints: [
        "Read the first error: inside pegs_free, Python thinks pegs is a brand-new variable of the function's own, with nothing in it yet. Which values does each function need to be handed, and what should each one hand back?",
        "In through the brackets, out through return: `def use_two(eggs): return eggs - 2`, then `eggs = use_two(eggs)`. A function's own variables vanish when it ends, unless it returns them.",
        "`def pegs_used(tools):` keeps its loop and ends with `return used`. `def pegs_free(pegs, tools):` gives back `pegs - pegs_used(...)`. At the bottom, print what `pegs_free(pegs, tools)` hands back.",
      ],
      solution: r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(tools):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1
    return used

def pegs_free(pegs, tools):
    return pegs - pegs_used(tools)

print(f"Pegs still free: {pegs_free(pegs, tools)}")`,
      wrong: [r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used():
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1

def pegs_free():
    pegs = pegs - used

pegs_used()
pegs_free()
print(f"Pegs still free: {pegs}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]
used = 0

def pegs_used():
    global used
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1

def pegs_free():
    global pegs
    pegs = pegs - used

pegs_used()
pegs_free()
print(f"Pegs still free: {pegs}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(items):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1
    return used

def pegs_free(pegs, tools):
    return pegs - pegs_used(tools)

print(f"Pegs still free: {pegs_free(pegs, tools)}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(tools):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1
    return used

def pegs_free(rack, items):
    return pegs - pegs_used(items)

print(f"Pegs still free: {pegs_free(pegs, tools)}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(tools):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1

def pegs_free(pegs, tools):
    return pegs - pegs_used(tools)

print(f"Pegs still free: {pegs_free(pegs, tools)}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(tools):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1
    return used

def pegs_free(pegs, tools):
    used = 0
    for tool in tools:
        used = used + 1
    return pegs - used

print(f"Pegs still free: {pegs_free(pegs, tools)}")`, r`pegs = 14
tools = ["hammer", "tongs", "file", "tongs", "hammer", "horseshoe"]

def pegs_used(tools):
    used = 0
    for tool in tools:
        if tool == "tongs":
            used = used + 2
        else:
            used = used + 1
    return used

def pegs_free(pegs, tools):
    return pegs - pegs_used(tools)

pegs_free(pegs, tools)
print(f"Pegs still free: {pegs}")`],
      done: "Ingrid: Every tool on its peg. Nobody's peg reaching into anybody else's. That's a tidy rack.",
    },
    {
      id: "f13-charcoal",
      part: "Charcoal lean-to",
      title: "No Answer Is an Answer",
      topic: "None and returning early",
      cost: { wood: 8, stone: 1 },
      intro: [
        "Ingrid: Lean-to for the charcoal. Roof on posts, bin underneath. Damp charcoal spits and smokes. Dry charcoal sings.",
        "Ingrid: Two questions every morning. How long will the bin last? Which sack do I open first?",
        "Sometimes there is no good answer: a cold forge burns no charcoal, and a stack of damp sacks has no dry one. A function can say so by giving back `None`. Check for that trouble right at the top and return early, so the rest of the function only deals with the normal case.",
      ],
      codex: ["none-guards", "list-functions"],
      quiz: {
        code: r`def find(word, letter):
    if letter not in word:
        return None
    return word.find(letter)

spot = find("oak", "o")
if not spot:
    print("missing")
else:
    print(spot)`,
        question: "What does this program show?",
        options: ["missing", "0", "None", "o"],
        answer: 0,
        why: "The o is found at index 0, so spot is 0. But 0 counts as False, so not spot is True and the program wrongly says missing. Asking spot is None would get it right.",
      },
      task: [
        "`days_left` is handed how many scoops of charcoal are in the bin and how many the forge burns a day, in that order. It gives back how many whole days the bin lasts. If the forge burns nothing a day (or less than nothing: someone's been fiddling), no number of days makes sense, so it gives back None, before any sums.",
        "`first_dry` is handed a list of the sacks' damp readings, in the order they're stacked. It gives back the index of the first sack dry enough to burn, which means a reading under 15. If no sack is dry, it gives back None.",
        "Print how many days the bin lasts. Then, if there is a dry sack, say which index to open; if there isn't, say Ingrid will wait for the sun, with the word wait in the line.",
      ],
      starter: r`heap = 90                     # scoops of charcoal in the bin
per_day = 12                  # scoops the forge burns in a day
sacks = [40, 22, 9, 31, 5]    # each sack's damp reading, in stacking order
`,
      tests: PRE + r`want("days_left", (30, 4), 7, "30 scoops at 4 a day lasts 7 whole days. The 2 left over aren't a whole day.")
want("days_left", (8, 8), 1, "Exactly one day's worth.")
want("days_left", (3, 4), 0, "Not even one whole day's worth.")
guard = "A cold forge burns 0 a day, and nothing can be divided by 0. Check for that at the very top of the function and give back None before any sums."
for args, why in [((30, 0), "A cold forge burns nothing, so no number of days makes sense"), ((10, -2), "Burning less than nothing a day means someone's been fiddling. That's no sensible answer either")]:
    res, printed, shown = call("days_left", args, crash=guard)
    if isinstance(res, str) and res.lower() == "none":
        check(False, shown + " gave back the text " + repr(res) + ". The rune wants the value None itself, with no quotes.")
    check(res is None, shown + " gave back " + repr(res) + ". " + why + (": 0 would mean the bin runs out today" if res == 0 else "") + ". Give back None.")
res, printed, shown = call("first_dry", ([20, 14, 3],))
check(res is not None, shown + " gave back None, but the sack at index 1 is dry. Is a return None inside the loop giving up after the first damp sack? Only give up once the loop has looked at every sack.")
check(res != 14, shown + " gave back 14, the sack's damp reading. The rune wants where the sack is in the stack: its index.")
check(same(res, 1), shown + " gave back " + repr(res) + ". Indexes count from 0, and the first dry sack in that list is the second one.")
want("first_dry", ([5],), 0, "The very first sack is dry: index 0.")
want("first_dry", ([15, 15, 14],), 2, "A reading of exactly 15 is still too damp: dry means under 15.")
for sacks in [[30, 40], []]:
    res, printed, shown = call("first_dry", (sacks,))
    check(res is None, shown + " gave back " + repr(res) + ". No sack in that list is dry, so there's no index to give: give back None." + (" -1 is a real index in Python (it means the last item), so it can't stand for none." if res == -1 else ""))
def morning_ok(ls, heap, per_day, sacks, when):
    check(len(ls) >= 2, when + "the rune expected two lines: the days the bin lasts, then which sack to open (or that Ingrid will wait). Your program printed:" + show(ls))
    check(heap // per_day in nums(ls[0]), when + "the first line should say how many whole days the bin lasts. It says:" + show(ls[:1]))
    spot = None
    for i in range(len(sacks)):
        if sacks[i] < 15:
            spot = i
            break
    second = ls[1]
    if spot is None:
        check("wait" in second.lower(), when + "no sack is dry, so the second line should say Ingrid will wait for the sun, with the word wait. It says:" + show([second]))
    else:
        check("wait" not in second.lower(), when + "there is a dry sack, but your program says to wait:" + show([second]) + ("" if spot else chr(10) + "Here the dry sack is at index 0, and 0 counts as False, so not can't tell 0 from None. Ask whether the answer is None instead."))
        check(spot in nums(second), when + "the second line should say the index of the first dry sack. It says:" + show([second]))
morning_ok(lines, 90, 12, [40, 22, 9, 31, 5], "Today ")
vns, got = again(("sacks = [40, 22, 9, 31, 5]", "sacks = [3, 22, 9]"))
morning_ok(got, 90, 12, [3, 22, 9], "With sacks = [3, 22, 9], ")
vns, got = again(("sacks = [40, 22, 9, 31, 5]", "sacks = [40, 22]"))
morning_ok(got, 90, 12, [40, 22], "With sacks = [40, 22], ")
vns, got = again(("per_day = 12", "per_day = 30"))
morning_ok(got, 90, 30, [40, 22, 9, 31, 5], "With per_day = 30, ")`,
      hints: [
        "For each function, ask first: when is there no sensible answer? Deal with that at the very top. And in your main program, careful: is index 0 a real answer or not?",
        "A guard returns early: `if name == \"\": return None` at the top, then the normal work below it. To test the answer, ask `if result is None:`. `if not result:` would also treat 0 as missing.",
        "`days_left`: `if per_day <= 0: return None`, then the whole days. `first_dry`: `for i in range(len(sacks)):` with `if sacks[i] < 15: return i`, and after the loop `return None`. Below: `spot = first_dry(sacks)` and `if spot is None:` ...",
      ],
      solution: r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`,
      wrong: [r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return 0
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day == 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return -1

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot == -1:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
        else:
            return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] < 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if not spot:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for i in range(len(sacks)):
        if sacks[i] <= 15:
            return i
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`, r`heap = 90
per_day = 12
sacks = [40, 22, 9, 31, 5]

def days_left(heap, per_day):
    if per_day <= 0:
        return None
    return heap // per_day

def first_dry(sacks):
    for s in sacks:
        if s < 15:
            return s
    return None

print(f"The bin lasts {days_left(heap, per_day)} days.")
spot = first_dry(sacks)
if spot is None:
    print("Every sack is damp. Ingrid will wait for the sun.")
else:
    print(f"Open the sack at index {spot}.")`],
      done: "Ingrid: Charcoal's in, dry sacks on top. Hear that? That's dry charcoal singing. ...No? You will.",
    },
    {
      id: "f14-town-tools",
      part: "Yard and town tools",
      title: "Write It Once",
      topic: "turning repeated code into functions",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Ingrid: The yard. Workbench, vise, grindstone. And a rack for the town's tools. Shovels, a hoe, a pick, a rake, an axe. Your charter wants a town that can dig its own ditches.",
        "Ingrid: Pip did my price list. Same sum, five times. One of them's wrong. I can smell it.",
        "Pip was helping! Pip copied and pasted, which, Pip now sees, is a very good way to copy a mistake. When the same lines come again and again with only a few values changing, those values want to be parameters.",
      ],
      codex: ["function-patterns", "calling-functions"],
      quiz: {
        code: r`def tag(name, n):
    return name + ": " + str(n * 2)

print(tag("Mug", 3))
print(tag("Jug", 5))`,
        question: "What does this program show?",
        options: ["Mug: 6\nJug: 10", "Mug: 3\nJug: 5", "Mug: 6", "TypeError"],
        answer: 0,
        why: "One function, two calls. Each call builds its own line from the values it is handed: 3 * 2 is 6, and 5 * 2 is 10.",
      },
      task: [
        "The starter prices the town's tools the long way, five times over. One copy has a mistake. Find it by reading carefully.",
        "`tool_price` is handed a tool's kilos of iron and its hours at the anvil, in that order, and gives back its price in coins: the iron, one handle, and Ingrid's hours, at the prices at the top of the program.",
        "`tool_line` is handed a tool's name, kilos and hours, and gives back that tool's line for the list, written just like the starter's lines, dear note and all. Let it ask `tool_price` for the number.",
        "Print the same price list and the same last line as the starter, but with the mistake gone and no copies left: the price sum and the dear check each written only once.",
      ],
      starter: r`iron = 3        # coins for a kilo of iron
handle = 2      # coins for a handle
hour = 4        # coins for an hour at the anvil

shovel = 2 * iron + handle + 3 * hour
if shovel > 20:
    print(f"Shovel: {shovel} coins (dear)")
else:
    print(f"Shovel: {shovel} coins")

hoe = 1 * iron + handle + 2 * hour
if hoe > 20:
    print(f"Hoe: {hoe} coins (dear)")
else:
    print(f"Hoe: {hoe} coins")

pick = 3 * iron + handle + 4 * hour
if pick > 20:
    print(f"Pick: {pick} coins (dear)")
else:
    print(f"Pick: {pick} coins")

rake = 1 * iron + handle + 5 * hour
if hoe > 20:
    print(f"Rake: {rake} coins (dear)")
else:
    print(f"Rake: {rake} coins")

axe = 2 * iron + handle + 4 * hour
if axe > 20:
    print(f"Axe: {axe} coins (dear)")
else:
    print(f"Axe: {axe} coins")

total = shovel + hoe + pick + rake + axe
print(f"All five: {total} coins")
`,
      tests: PRE + r`takes("tool_price", 2, "two values: the kilos of iron and the hours at the anvil")
want("tool_price", (1, 1), 9, "One kilo of iron, one handle and one hour.")
want("tool_price", (0, 0), 2, "No iron and no hours, but every tool still has its handle.")
want("tool_price", (4, 2), 22, "Four kilos of iron, a handle and two hours.")
res = swapped("iron", 10, lambda: call("tool_price", (1, 0))[0])
check(res == 12, "Ingrid raised the price of iron at the top of the program, and tool_price didn't notice. Use iron, handle and hour from the top instead of typing their numbers.")
takes("tool_line", 3, "three values: the tool's name, its kilos and its hours")
want("tool_line", ("Spade", 1, 1), "Spade: 9 coins", "The line should look just like the starter's lines, with the name it is handed.")
want("tool_line", ("Anchor", 5, 2), "Anchor: 25 coins (dear)", "Over 20 coins gets the dear note, just like the starter's lines.")
want("tool_line", ("Hook", 2, 3), "Hook: 20 coins", "Exactly 20 coins isn't over 20, so no dear note.")
res = swapped("tool_price", lambda k, h: 99, lambda: call("tool_line", ("Nail", 0, 0))[0])
check(res == "Nail: 99 coins (dear)", "Let tool_line ask tool_price for the number, instead of doing the price sum all over again.")
check(len(re.findall(r"\*\s*hour\b", src)) <= 1, "The price sum is still written out more than once. Write it once, in tool_price, and call it for every tool.")
check(len(re.findall(r">\s*20\b", src)) <= 1, "The dear check is still written out more than once. Write it once, in tool_line.")
rake = [l for l in lines if l.startswith("Rake")]
check(not rake or "(dear)" in rake[0], "The rake costs over 20 coins but isn't marked dear:" + show(rake) + chr(10) + "That's the copy-paste mistake. Let tool_line decide the note from each tool's own price, and it can't happen.")
def list_ok(ls, iron, when):
    want_lines = []
    total = 0
    for name, k, h in [("Shovel", 2, 3), ("Hoe", 1, 2), ("Pick", 3, 4), ("Rake", 1, 5), ("Axe", 2, 4)]:
        p = k * iron + 2 + h * 4
        total += p
        want_lines.append(name + ": " + str(p) + " coins" + (" (dear)" if p > 20 else ""))
    want_lines.append("All five: " + str(total) + " coins")
    check(ls == want_lines, when + "the rune expected the starter's price list (with the rake's mistake fixed), then its last line:" + show(want_lines) + chr(10) + "but your program printed:" + show(ls))
list_ok(lines, 3, "Today ")
vns, got = again(("iron = 3", "iron = 5"))
list_ok(got, 5, "With iron = 5, ")`,
      hints: [
        "Read the five copies side by side. What's the same in every one? What changes? The changes become parameters. Then read each copy once more, slowly: one of them asks the wrong question.",
        "One function per job: `def label(name, fruit_cost):` works out a price and gives back a line built with an f-string. The main program calls it once per item and prints what comes back. The total still needs every price, so the price function is handy there too.",
        "`def tool_price(kilos, hours):` gives back `kilos * iron + handle + hours * hour`. `def tool_line(name, kilos, hours):` sets `price = tool_price(kilos, hours)` and gives back one of two f-strings, depending on `price > 20`. Then one `print(tool_line(...))` per tool, and the total.",
      ],
      solution: r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price > 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

names = ["Shovel", "Hoe", "Pick", "Rake", "Axe"]
kilos = [2, 1, 3, 1, 2]
hours = [3, 2, 4, 5, 4]
total = 0
for n, k, h in zip(names, kilos, hours):
    print(tool_line(n, k, h))
    total += tool_price(k, h)
print(f"All five: {total} coins")`,
      wrong: [r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price > 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

shovel = 2 * iron + handle + 3 * hour
print(tool_line("Shovel", 2, 3))
hoe = 1 * iron + handle + 2 * hour
print(tool_line("Hoe", 1, 2))
pick = 3 * iron + handle + 4 * hour
print(tool_line("Pick", 3, 4))
rake = 1 * iron + handle + 5 * hour
print(tool_line("Rake", 1, 5))
axe = 2 * iron + handle + 4 * hour
print(tool_line("Axe", 2, 4))
total = shovel + hoe + pick + rake + axe
print(f"All five: {total} coins")`, r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * 3 + 2 + hours * 4

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price > 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

total = 0
for n, k, h in zip(["Shovel", "Hoe", "Pick", "Rake", "Axe"], [2, 1, 3, 1, 2], [3, 2, 4, 5, 4]):
    print(tool_line(n, k, h))
    total += tool_price(k, h)
print(f"All five: {total} coins")`, r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = kilos * iron + handle + hours * hour
    if price > 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

total = 0
for n, k, h in zip(["Shovel", "Hoe", "Pick", "Rake", "Axe"], [2, 1, 3, 1, 2], [3, 2, 4, 5, 4]):
    print(tool_line(n, k, h))
    total += tool_price(k, h)
print(f"All five: {total} coins")`, r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price > 20:
        print(f"{name}: {price} coins (dear)")
    else:
        print(f"{name}: {price} coins")

total = 0
for n, k, h in zip(["Shovel", "Hoe", "Pick", "Rake", "Axe"], [2, 1, 3, 1, 2], [3, 2, 4, 5, 4]):
    tool_line(n, k, h)
    total += tool_price(k, h)
print(f"All five: {total} coins")`, r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price >= 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

total = 0
for n, k, h in zip(["Shovel", "Hoe", "Pick", "Rake", "Axe"], [2, 1, 3, 1, 2], [3, 2, 4, 5, 4]):
    print(tool_line(n, k, h))
    total += tool_price(k, h)
print(f"All five: {total} coins")`, r`iron = 3
handle = 2
hour = 4

def tool_price(kilos, hours):
    return kilos * iron + handle + hours * hour

def tool_line(name, kilos, hours):
    price = tool_price(kilos, hours)
    if price > 20:
        return f"{name}: {price} coins (dear)"
    return f"{name}: {price} coins"

for n, k, h in zip(["Shovel", "Hoe", "Pick", "Rake", "Axe"], [2, 1, 3, 1, 2], [3, 2, 4, 5, 4]):
    print(tool_line(n, k, h))
print("All five: 109 coins")`],
      done: "Ingrid: Five tools, one sum. The rake's dear, like it should've been all along. And Pip's mistake can't come back. Nowhere left for it to hide.",
    },
    {
      id: "f15-tool-orders",
      part: "Sign and lanterns",
      title: "Orders for the Town",
      topic: "functions working together",
      cost: { wood: 5, stone: 5 },
      intro: [
        "Ingrid: Last of it. Lanterns on the piers, the old horseshoe over the lintel for luck, a sign with an anvil and hammer. Then the forge is open, and the orders start.",
        "Ingrid: Got them already. Bram, Wren, Marlo, Sable, Hazel. Half of them asked for things I don't make. Scales. A bread peel. I'm a smith, not a carpenter.",
        "Ingrid: And one more. From the bottom of the Company crate: my last order from the Vane works. Never filled it. Run it through too. You'll see why.",
        "This is the whole forge in one program: a few small functions, each with one job, and a main part that uses them. Plan it on paper first, then build the smallest piece.",
      ],
      codex: ["function-patterns", "none-guards", "defaults-keywords", "list-functions"],
      quiz: {
        code: r`def heat(n, extra=0):
    return n * 10 + extra

def total(a, b):
    return heat(a) + heat(b, extra=5)

print(total(1, 2))`,
        question: "What does this program show?",
        options: ["35", "30", "40", "TypeError"],
        answer: 0,
        why: "heat(1) uses the default extra of 0 and gives back 10. heat(2, extra=5) gives back 25. 10 + 25 is 35.",
      },
      task: [
        "Ingrid's book is in the starter: `book_kinds` and `book_hours`, side by side, are what she makes and the hours each one takes.",
        "`hours_for` is handed one kind of tool and gives back the hours it takes, from the book. For a kind she doesn't make, None.",
        "`order_hours` is handed an order (a list of kinds) and gives back the hours for the whole order. Kinds she doesn't make add nothing. `refused` is handed an order and gives back how many of its tools are kinds she doesn't make.",
        "`days_needed` is handed a number of hours and `per_day`, the hours she works a day (usually 6), and gives back the whole working days that takes. A part-day still takes a whole day.",
        "Print one line per villager with their name and their order's hours, then a line with how many days the whole town's orders take (with the word day in it). Then, for the Company order, its hours and how many of its tools Ingrid refuses.",
      ],
      starter: r`# Ingrid's book: what she makes, and how many hours each one takes.
book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

# The town's orders.
bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

# The order from the bottom of the Vane Company crate.
company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]
`,
      tests: PRE + r`look = "A kind that isn't in the book makes .index crash. Check whether the kind is in book_kinds first."
want("hours_for", ("pick",), 4, "Look the kind up in Ingrid's book.", crash=look)
want("hours_for", ("nails",), 1, "Look the kind up in Ingrid's book.", crash=look)
res, printed, shown = call("hours_for", ("pump",), crash=look)
check(res is None, shown + " gave back " + repr(res) + ". Ingrid doesn't make pumps, so there are no hours to give: None.")
res = swapped("book_hours", [9, 9, 9, 9, 9, 9, 9, 9], lambda: call("hours_for", ("hoe",))[0])
check(res == 9, "Ingrid rewrote the hours in her book, and hours_for didn't notice. Look the hours up in book_kinds and book_hours instead of typing them in.")
skip = "For a kind she doesn't make, hours_for gives back None, and None can't be added. Skip those kinds."
want("order_hours", (["axe", "axe"],), 6, "Two axes.", crash=skip)
want("order_hours", ([],), 0, "An empty order takes no time.", crash=skip)
want("order_hours", (["pump", "hook"],), 1, "The pump adds nothing; the hook takes 1 hour.", crash=skip)
want("order_hours", (["pump"],), 0, "Nothing she makes, so 0 hours. That's a real number of hours, not None.", crash=skip)
want("refused", (["pump", "axe", "drill"],), 2, "The pump and the drill aren't in her book; the axe is.")
want("refused", ([],), 0, "An empty order has nothing to refuse.")
want("refused", (["axe", "hoe"],), 0, "Ingrid makes axes and hoes.")
f = takes("days_needed", 2, "two values: the hours, and per_day")
ps = list(inspect.signature(f).parameters.values())
check(ps[1].name == "per_day", "The rune hands days_needed its hours a day by name, per_day=..., so its second parameter must be called per_day.")
check(ps[1].default == 6, "Ingrid works 6 hours a day unless she says otherwise: give per_day that usual value in the def line.")
for args, kw, n, why in [((12,), {}, 2, "12 hours is exactly two 6-hour days."), ((13,), {}, 3, "13 hours is two full days and one hour more, and a part-day still takes a whole day."), ((1,), {}, 1, "Even one hour takes a day."), ((0,), {}, 0, "No hours, no days."), ((10, 4), {}, 3, "10 hours at 4 a day: two full days and a part-day."), ((10,), {"per_day": 5}, 2, "10 hours at 5 a day.")]:
    want("days_needed", args, n, why, kw=kw)
def town_ok(ls, hrs, days, comp_hours, comp_refused, when):
    for name, h in zip(["bram", "wren", "marlo", "sable", "hazel"], hrs):
        found = [l for l in ls if name in l.lower()]
        check(found, when + "the rune couldn't find a line for " + name.title() + ". Your program printed:" + show(ls))
        check(h in nums(found[0]), when + name.title() + "'s line has the wrong hours:" + show(found[:1]) + chr(10) + "Work them out with order_hours, so kinds Ingrid doesn't make add nothing.")
    at = [i for i in range(len(ls)) if "day" in ls[i].lower()]
    check(at, when + "the rune couldn't find the line with how many days the town's orders take (it looks for the word day). Your program printed:" + show(ls))
    check(days in nums(ls[at[0]]), when + "the days line is off:" + show([ls[at[0]]]) + chr(10) + "Add up every villager's hours first, then ask days_needed once. A part-day still takes a whole day.")
    rest = ls[at[0] + 1:]
    check(missing(rest, [comp_hours, comp_refused]) is None, when + "after the days, the rune expected the Company order's hours, then how many of its tools Ingrid refuses. After the days line your program printed:" + show(rest))
town_ok(lines, [5, 7, 4, 1, 3], 4, 24, 4, "Today ")
vns, got = again(("book_hours = [3, 2, 3, 4, 2, 1, 3, 1]", "book_hours = [5, 2, 3, 2, 2, 2, 3, 1]"))
town_ok(got, [7, 7, 5, 2, 3], 4, 12, 4, "With book_hours = [5, 2, 3, 2, 2, 2, 3, 1], ")
vns, got = again(('bram = ["cleaver", "hook", "hook"]', 'bram = ["anvil", "axe"]'))
town_ok(got, [3, 7, 4, 1, 3], 3, 24, 4, "With bram = [\"anvil\", \"axe\"], ")
vns, got = again(('company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]', 'company = ["pick", "pump"]'))
town_ok(got, [5, 7, 4, 1, 3], 4, 4, 1, "With company = [\"pick\", \"pump\"], ")`,
      hints: [
        "Plan on paper: four small functions, one job each. Write hours_for first and test it on a kind she makes and one she doesn't; the others can lean on it. For the days, work out by hand: 12 hours? 13? 1?",
        "Looking things up in side-by-side lists: `if fruit not in fruits: return None`, then `prices[fruits.index(fruit)]`. Rounding up without decimals: count the full days with `//`, then add one more if `%` says some hours are left over.",
        "order_hours starts at 0 and, for each kind, adds `hours_for(kind)` only when it `is not None`. refused counts the kinds `not in book_kinds`. days_needed: `days = hours // per_day`, plus 1 when `hours % per_day` isn't 0. Then the prints, with `days_needed(` the town's total `)`.",
      ],
      solution: r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`,
      wrong: [r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        if kind in book_kinds:
            total += hours_for(kind)
    return total

def refused(order):
    n = 0
    for kind in order:
        if kind not in book_kinds:
            n += 1
    return n

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        total += hours_for(kind)
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    return hours // per_day

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    return hours // per_day + 1

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, hours_a_day=6):
    days = hours // hours_a_day
    if hours % hours_a_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    return len(order)

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind not in book_kinds:
        return None
    return book_hours[book_kinds.index(kind)]

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

days = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    days += days_needed(h)
    print(f"{name}: {h} hours")
print(f"The town's orders take {days} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`, r`book_kinds = ["axe", "hoe", "shovel", "pick", "rake", "hook", "cleaver", "nails"]
book_hours = [3, 2, 3, 4, 2, 1, 3, 1]

bram = ["cleaver", "hook", "hook"]
wren = ["hoe", "rake", "shovel"]
marlo = ["hook", "nails", "nails", "nails"]
sable = ["scales", "hook"]
hazel = ["peel", "shovel"]

company = ["pick", "pick", "pump", "pick", "pump", "pick", "pick", "pump", "drill", "pick"]

def hours_for(kind):
    if kind == "axe" or kind == "shovel" or kind == "cleaver":
        return 3
    if kind == "hoe" or kind == "rake":
        return 2
    if kind == "pick":
        return 4
    if kind == "hook" or kind == "nails":
        return 1
    return None

def order_hours(order):
    total = 0
    for kind in order:
        h = hours_for(kind)
        if h is not None:
            total += h
    return total

def refused(order):
    n = 0
    for kind in order:
        if hours_for(kind) is None:
            n += 1
    return n

def days_needed(hours, per_day=6):
    days = hours // per_day
    if hours % per_day > 0:
        days += 1
    return days

town = 0
for name, order in zip(["Bram", "Wren", "Marlo", "Sable", "Hazel"], [bram, wren, marlo, sable, hazel]):
    h = order_hours(order)
    town += h
    print(f"{name}: {h} hours")
print(f"The town's orders take {days_needed(town)} days.")
print(f"The Company order: {order_hours(company)} hours.")
print(f"Tools Ingrid refuses to make: {refused(company)}")`],
      done: "Ingrid: Lanterns lit. Sign swinging. Hazel brought pots of flowers for the front. I said they'd get in the way. ...They can stay.",
    },
  ],
};
