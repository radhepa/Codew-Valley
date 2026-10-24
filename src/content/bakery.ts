import type { Building } from "./types.ts";

// The Hearth Bakery: building 5, taught with for loops, range, accumulators,
// enumerate, zip and nested loops (SYLLABUS.md). Each challenge adds one stage
// of bakery.glb (art/specs/bakery.md, stage_01 … stage_14). Hazel the baker
// arrives when the chapter opens and speaks lines that start with "Hazel: ".
// Act II begins here: the King's envoy is coming to a feast.
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks. Loops are
// tested by running the program again with other lists and numbers:
//   again(("stakes = [...]", "stakes = [...]"))  -> (variables, printed lines)
//   expect_when([(old, new), ...], [lines...], "extra advice")
// A variant that crashes gives friendly feedback (plus the advice) instead of
// tripping the checker. `code` is the program with its comments taken out,
// and need_for() asks for a real for loop (a while loop would also pass the
// output checks, but this chapter is about for).
const PRE = r`def again(*swaps, advice=""):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with Hazel's other batches.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        msg = "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the lists and numbers you're given, so it fits any batch, not just today's."
        if advice:
            msg = msg + chr(10) + advice
        check(False, msg)

def expect_when(swaps, want, advice=""):
    vns, got = again(*swaps, advice=advice)
    nl = chr(10) + "  "
    when = " and ".join(new for old, new in swaps)
    msg = "If " + when + ", the rune expects:" + nl + nl.join(want) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    if advice:
        msg = msg + chr(10) + advice
    check(got == want, msg)
    return vns

def _no_comments():
    kept = []
    for l in src.splitlines():
        kept.append(l.split("#")[0].rstrip())
    return chr(10).join(kept)

code = _no_comments()

def has_for():
    for l in code.splitlines():
        s = l.strip()
        if s.startswith("for ") and " in " in s and s.endswith(":"):
            return True
    return False

def need_for(what):
    check(has_for(), "Walk " + what + " with a for loop: a line that starts with for, names one item, says in and what to walk, and ends with a colon. The work goes indented under it.")

`;

const STAKES = `stakes = ["front left", "front right", "back right", "back left", "oven centre"]`;
const PANELS = "panels = [3, 6, 4, 2, 5, 3]";
const PILE = "pile = [25, 18, 23, 21, 22, 20]";
const CARD = "card = [500, 350, 10, 5]";
const WEIGHTS = "weights = [806, 780, 815, 795, 800, 789, 830, 810]";
const ORDERS = `orders = ["Seed loaf", "Rye loaf", "Honey buns", "Plain loaf", "Seed rolls", "Rye loaf", "Oat rolls"]`;
const BREADS = `breads = ["Seed loaf", "Rye loaf", "Honey buns", "Oat rolls"]`;
const READINGS = "readings = [120, 180, 230, 230, 260, 250]";
const MINUTES = "minutes = [41, 39, 44, 40, 43, 38, 42]";
const FEAST_BREADS = `breads = ["Seed loaf", "Rye loaf", "Honey buns", "Plain loaf", "Oat rolls"]`;

export const BAKERY: Building = {
  id: "bakery",
  name: "The Hearth Bakery",
  blurb: "A domed brick oven and the smell of warm bread all day long.",
  villager: { name: "Hazel", model: "baker", arrives: "start" },
  opening: [
    "Lord Vane's writ is still nailed to the market post. Pip has read it eleven times. It doesn't get any shorter.",
    "But this morning Sable's traders brought another letter, with a real wax seal: the King's. Ssso listen. A royal charter can be granted to any valley that proves it is a **real town**.",
    "The proof: bread, a forge, records kept properly, a healer and a hall. And first of all, the King's envoy is coming to a feast. A feast needs bread. Lots of bread.",
    "Hazel: Is this the valley that wants a baker? Sable's notice said 'urgent, royal, bring your own yeast'. I brought my own yeast.",
    "Hazel: Hazel. I bake. I measure. I don't do loud entrances, so this is as loud as I get.",
    "A baker! Bram will be so pleased. Bram runs the Sleepy Serpent, our tavern. Big man, big laugh, tells every story twice...",
    "Hazel: ...Burns the onions. Yes. I know Bram. He's my brother. We haven't spoken in ten years. Where would you like the oven?",
    "Pip has a great many questions. Pip will ask none of them. (Pip will ask all of them later.)",
    "A bakery does the same work over and over: knead, shape, bake, for every loaf on the board. In Python that's a **for loop**. Let's build The Hearth Bakery!",
  ],
  finale: [
    "The envoy's feast! Long tables on the green, the Serpent's stew in great steaming pots, and in the middle of it all, Hazel's braided festival loaf.",
    "The King's envoy ate three helpings and wrote a great deal in a small brown book. Pip has decided that's good.",
    "Bram: That loaf. Three strands, left over the middle first. That's Mum's festival braid.",
    "Hazel: Somebody had to remember how it goes.",
    "Bram: ...It's good, Hazel. It's really good.",
    "Hazel: Your stew's too salty. ...It needs bread with it. That's all I mean.",
    "Bram: I'll... send over some onions. For the bread.",
    "Hazel: I have onions. ...Send them anyway.",
    "Ten years, and they talked about salt and onions. Pip is told that's how these things start. And the envoy's book says *Bread: excellent*. One proof for the charter, founder. Four to go!",
  ],
  chatDuring: [
    "Hazel: Your loop goes round once for every item on the list. My oven goes round once for every loaf on the board. We understand each other.",
    "Hazel: The envoy eats at noon, I'm told. Envoys are always told noon. They always arrive at three. I'll have bread for both.",
    "Hazel: Bram sent over a crate of onions 'for the envoy's feast'. I didn't order onions. I'm keeping them. They're good onions.",
    "Hazel: Pip asked if I miss my old shop. I said I miss the oven. Ovens are easier to miss than people. They don't talk back.",
  ],
  chatAfter: [
    "Hazel: Oven on before dawn. Bread out by six. Then I sit on the bench and watch the valley wake up. Best hour of the day.",
    "Hazel: The loaf sign creaks when the wind's from the north. I've oiled it twice. I think it just likes to talk.",
    "Hazel: You held the envoy's receipt like it was a crown. It was a list of buns. ...It was a very good list of buns.",
    "Hazel: Somebody left a jar of stew on my step this morning. No knock. I've washed the jar. I haven't decided what to put back in it.",
  ],
  chronicle: {
    title: "Bread and Runes",
    text: [
      "At the end of our third summer the barley came in all at once, and we had not sacks enough, or hands enough, or, I am ashamed to say, patience enough. So the baker asked the stone to count it for us. *For every sheaf on the threshing floor*, she said, and the stone went round them one by one and never once lost its place.",
      "We made a festival of it. Every household brought a measure of flour to the big oven, and the stone named each house in turn, *for each of them, a loaf*, until there was bread in every hand in the valley. The children braided the festival loaves in three strands, which they swore stood for the field, the mill and the oven. I think they stood for whatever the children were arguing about that year.",
      "I have come to think a loop is a kind of fairness. It does not skip the small house at the end of the row, and it does not serve the loud house twice. I should like our village to be more like a loop.",
      "We feasted until the lanterns guttered. Two cousins quarrelled over the last of the braid, and somebody cut it in half between them, and that, I think, is the whole art of keeping a village together.",
    ],
  },
  challenges: [
    {
      id: "b01-survey-stakes",
      part: "Survey stakes",
      title: "One Stake at a Time",
      topic: "for loops",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Hazel: Four stakes for the cottage corners, one for the middle of the oven. I wrote them down. I always write them down.",
        "At the market you walked lists with `while` and an index: start at 0, check the length, add 1, and hope you remembered the adding. Ssso much bookkeeping.",
        "A **for loop** keeps the place for you. `for egg in basket:` runs the indented lines once for every item, and each time round `egg` holds the next one.",
        "Lines indented under the `for` run every round. The first line back at the edge runs once, when the loop is finished.",
      ],
      codex: ["for-loops"],
      quiz: {
        code: r`basket = ["egg", "milk"]
for thing in basket:
    print(thing)
print("done")`,
        question: "What does this program show?",
        options: ["egg\nmilk\ndone", "egg\ndone\nmilk\ndone", "['egg', 'milk']\ndone", "thing\nthing\ndone"],
        answer: 0,
        why: "The indented print runs once per item, with thing holding egg, then milk. print(\"done\") is back at the edge, so it runs once, after the loop.",
      },
      task: [
        "Drive in every stake on Hazel's list, in order: one line per stake, `Stake in: ` followed by that stake's name.",
        "When the last stake is in, and only then, one more line with how many went in: `<number> stakes driven.`",
        "Hazel may cross stakes out or add new ones, so the program has to work for whatever is on the list.",
      ],
      starter: STAKES + r`

# 1. Drive each stake: a line for every one.
# 2. Then, once, how many went in.
`,
      tests: PRE + r`need_for("Hazel's list")
check(len(lines) > 0, "Nothing was printed yet. Every stake needs its own line.")
check("[" not in lines[0], "That line shows the whole list at once. Inside the loop, print just the one stake the loop is holding this round.")
n = 0
for l in lines:
    if "stakes driven" in l.lower():
        n += 1
check(n <= 1, "Your count line printed " + str(n) + " times, once every round. It's indented inside the loop; bring it back to the edge so it runs once, after the last stake.")
check(n == 1, "After the stakes, finish with one line saying how many stakes were driven.")
check(lines[0] == "Stake in: front left", "The first line should name the first stake on Hazel's list, after Stake in: and a space. Inside the loop, the loop's own variable holds this round's stake.")
expect_lines(["Stake in: front left", "Stake in: front right", "Stake in: back right", "Stake in: back left", "Stake in: oven centre", "5 stakes driven."])
expect_when([('` + STAKES + r`', 'stakes = ["oven centre", "back left", "front right"]')], ["Stake in: oven centre", "Stake in: back left", "Stake in: front right", "3 stakes driven."], "Hazel crossed two out and changed the order. Print what the loop hands you, and count the list itself instead of typing a number.")`,
      hints: [
        "From one stake line to the next, only the name changes. The loop hands you each name in turn; your job is the one line that uses it. Then ask: does the count belong to every round, or to the end?",
        "`for jar in shelf:` runs its indented lines once per jar, with `jar` holding this round's jar. Whatever sits back at the edge, below the loop, waits until every round is done. And you met the tool that counts a list at the market.",
        "`for stake in stakes:` with one indented line that prints `\"Stake in: \"` and `stake`. Then, back at the edge: `print(f\"{___} stakes driven.\")`, with the list's length in the gap.",
      ],
      solution: STAKES + r`
for stake in stakes:
    print("Stake in: " + stake)
print(f"{len(stakes)} stakes driven.")`,
      wrong: [STAKES + r`
for stake in stakes:
    print("Stake in: " + stake)
    print(f"{len(stakes)} stakes driven.")`, STAKES + r`
for stake in stakes:
    print("Stake in: " + stake)
print("5 stakes driven.")`, STAKES + r`
for stake in stakes:
    print("Stake in:", stakes)
print(f"{len(stakes)} stakes driven.")`, STAKES + r`
print("Stake in: front left")
print("Stake in: front right")
print("Stake in: back right")
print("Stake in: back left")
print("Stake in: oven centre")
print("5 stakes driven.")`, STAKES + r`
i = 0
while i < len(stakes):
    print("Stake in: " + stakes[i])
    i += 1
print(f"{len(stakes)} stakes driven.")`],
      done: "Hazel: Five stakes, string pulled tight, no guessing. You'll do.",
    },
    {
      id: "b02-name-stones",
      part: "Stone plinth",
      title: "A Letter to a Stone",
      topic: "for over a string",
      cost: { wood: 1, stone: 6 },
      intro: [
        "Hazel: Where I come from, a bakery's name is cut into its first course of stone. One letter to a stone. Spaces don't get a stone. Stones cost money.",
        "A `for` loop can walk a string too: one round for every **character**, left to right.",
        "A space is a character as well, so the loop hands it to you just like a letter. What you do with it is up to you.",
      ],
      codex: ["for-loops"],
      quiz: {
        code: r`for ch in "a b":
    print(ch + "!")`,
        question: "What does this program show?",
        options: ["a!\n !\nb!", "a!\nb!", "a b!", "a!b!"],
        answer: 0,
        why: "The loop goes round once per character, and the space in the middle is a character too, so it gets its own line with a ! after it.",
      },
      task: [
        "Cut the bakery's name into the plinth: one line per letter, in order, each `Stone: ` followed by that letter in capitals.",
        "A space gets no stone, and so no line.",
        "Hazel hasn't quite settled on the name, so it must work for any name.",
      ],
      starter: r`name = "Hearth Bakery"

# One stone for each letter, cut in capitals.
# Spaces get no stone.
`,
      tests: PRE + r`need_for("the name")
check(len(lines) > 0, "Nothing was printed yet. Every letter needs a stone, and every stone needs a line.")
check("Stone:" not in lines, "One of your stones is blank: that's the space getting a stone of its own. Look at each character before you cut it, and let the spaces go by.")
check(not any(l.startswith("Stone: ") and len(l) > 8 for l in lines), "A stone has more than one letter on it. Each stone gets just the one character the loop is holding this round, not the whole name.")
check(not any(l.startswith("Stone: ") and l[7:] != l[7:].upper() for l in lines), "Some stones are cut in small letters. Every letter goes on in capitals: you met a string method for that at the mill.")
want = []
for ch in "HEARTHBAKERY":
    want.append("Stone: " + ch)
if len(lines) < len(want) and lines == want[:len(lines)]:
    check(False, "Your stones stop at the space. A space should be passed over, not end the whole loop. At the dock, one word skipped a round and another stopped everything.")
expect_lines(want)
expect_when([('name = "Hearth Bakery"', 'name = "Rye and Rose"')], ["Stone: R", "Stone: Y", "Stone: E", "Stone: A", "Stone: N", "Stone: D", "Stone: R", "Stone: O", "Stone: S", "Stone: E"], "Walk the name itself, so any name works, with any number of spaces.")
expect_when([('name = "Hearth Bakery"', 'name = "crust"')], ["Stone: C", "Stone: R", "Stone: U", "Stone: S", "Stone: T"])`,
      hints: [
        "The loop will hand you the space just like any letter. Before you cut a stone, ask one question about the character you're holding.",
        "`for ch in \"hi you\":` hands you h, i, a space, y, o, u. An `if` inside the loop can let only some characters through (or skip a round with `continue`, like at the dock). `.upper()` gives capitals: `\"y\".upper()` is `\"Y\"`.",
        "`for letter in name:` then, indented, `if letter ___ \" \":` and, indented once more, `print(\"Stone: \" + letter.upper())`.",
      ],
      solution: r`name = "Hearth Bakery"
for letter in name:
    if letter != " ":
        print("Stone: " + letter.upper())`,
      wrong: [r`name = "Hearth Bakery"
for letter in name:
    print("Stone: " + letter.upper())`, r`name = "Hearth Bakery"
for letter in name:
    if letter != " ":
        print("Stone: " + letter)`, r`name = "Hearth Bakery"
for letter in name:
    if letter == " ":
        break
    print("Stone: " + letter.upper())`, r`name = "Hearth Bakery"
for letter in name:
    if letter != " ":
        print("Stone: " + name.upper())`, r`name = "Hearth Bakery"
for letter in "HEARTHBAKERY":
    print("Stone: " + letter)`],
      done: "Hazel: Twelve letters, twelve stones, not a space wasted. My grandfather would have liked it. He'd have said it needs a space. Then he'd have paid for the stone.",
    },
    {
      id: "b03-oven-courses",
      part: "Oven hearth",
      title: "Round and Round the Oven",
      topic: "range()",
      cost: { wood: 0, stone: 5 },
      intro: [
        "Hazel: The oven sits on its own round plinth of fieldstone. Course after course, all the same height. I'd like to know the height after every one. I like knowing.",
        "There's no list to walk this time, just a number of rounds. That's what **range** is for: `for i in range(3):` goes round three times, with `i` as 0, then 1, then 2.",
        "Yes, it starts at 0. Python counts the way it counts list positions. If you'd rather count from 1, remember the loop's variable is an ordinary number: you can do sums with it.",
      ],
      codex: ["range"],
      quiz: {
        code: r`for n in range(3):
    print(n * 10)`,
        question: "What does this program show?",
        options: ["0\n10\n20", "10\n20\n30", "0\n10\n20\n30", "30"],
        answer: 0,
        why: "range(3) gives 0, 1 and 2 (three numbers, starting at 0), so the loop prints 0, 10 and 20.",
      },
      task: [
        "Lay the oven plinth one course at a time. For each course, one line: which course it is, counting from 1, out of how many, and how tall the plinth stands once that course is down.",
        "The 2nd of 6 courses, at 10 cm each, would read `Course 2 of 6: 20 cm`.",
        "Hazel hasn't decided on the stone yet, so work from `courses` and `course_height`.",
      ],
      starter: r`courses = 4          # rounds of fieldstone in the oven plinth
course_height = 15   # cm that each round adds

# Lay every course, counting from 1.
`,
      tests: PRE + r`need_for("the courses")
check("range(" in code, "Let range make the rounds: one for every course.")
check(len(lines) > 0, "Nothing was printed yet: one line for every course.")
check(not lines[0].startswith("Course 0"), "Your first course is course 0. range starts counting at 0, but Hazel counts from 1, so the loop's number needs a little sum before you print it.")
check(len(lines) == 4, "You printed " + str(len(lines)) + " lines, but the plinth has 4 courses: one line each, no more and no fewer.")
check(lines[0] != "Course 1 of 4: 0 cm", "After the first course is down, the plinth is one course tall, not 0 cm. Work out the height from the course you've just laid.")
expect_lines(["Course 1 of 4: 15 cm", "Course 2 of 4: 30 cm", "Course 3 of 4: 45 cm", "Course 4 of 4: 60 cm"])
expect_when([("courses = 4", "courses = 7"), ("course_height = 15", "course_height = 12")], ["Course 1 of 7: 12 cm", "Course 2 of 7: 24 cm", "Course 3 of 7: 36 cm", "Course 4 of 7: 48 cm", "Course 5 of 7: 60 cm", "Course 6 of 7: 72 cm", "Course 7 of 7: 84 cm"], "Hazel changed the plan. Use courses and course_height everywhere, instead of typing today's numbers.")
expect_when([("courses = 4", "courses = 1")], ["Course 1 of 1: 15 cm"])`,
      hints: [
        "range counts from 0, Hazel counts from 1. And the height after a course is how many courses are down, times the height of one. Do course 1 on paper: what should it say?",
        "`for i in range(3): print(i + 1)` prints 1, 2, 3. The loop's number is an ordinary whole number, so you can store a sum of it in a variable and use that variable in more sums.",
        "`for i in range(courses):`, then `course = i + 1`, then `print(f\"Course {course} of {courses}: {___} cm\")`.",
      ],
      solution: r`courses = 4
course_height = 15
for i in range(courses):
    course = i + 1
    print(f"Course {course} of {courses}: {course * course_height} cm")`,
      wrong: [r`courses = 4
course_height = 15
for i in range(courses):
    print(f"Course {i} of {courses}: {i * course_height} cm")`, r`courses = 4
course_height = 15
for i in range(4):
    course = i + 1
    print(f"Course {course} of {courses}: {course * course_height} cm")`, r`courses = 4
course_height = 15
for i in range(courses):
    course = i + 1
    print(f"Course {course} of {courses}: {i * course_height} cm")`, r`courses = 4
course_height = 15
for i in range(1, courses):
    print(f"Course {i} of {courses}: {i * course_height} cm")`, r`courses = 4
course_height = 15
for i in range(courses):
    course = i + 1
    print(f"Course {course} of 4: {course * 15} cm")`],
      done: "Hazel: Sixty centimetres of fieldstone, fifteen at a time, and the hearth slab sits level. I checked twice. Then once more, for luck. I don't believe in luck.",
    },
    {
      id: "b04-rafters",
      part: "Timber frame",
      title: "Every Sixty Centimetres",
      topic: "range with a start, stop and step",
      cost: { wood: 8, stone: 0 },
      intro: [
        "Hazel: Rafters every sixty centimetres. Not fifty-eight. Not 'about sixty'. I'll be checking with my tape.",
        "`range` can do more than count from 0. `range(2, 6)` gives 2, 3, 4 and 5: it starts at the first number and stops *just before* the second.",
        "A third number is the **step**, how far to jump each round: `range(0, 20, 5)` gives 0, 5, 10, 15. And a step below zero counts down.",
        "The stop is never included. That one little rule has fooled every builder in this valley at least once. Including Pip. Especially Pip.",
      ],
      codex: ["range"],
      quiz: {
        code: r`for x in range(10, 0, -4):
    print(x)`,
        question: "What does this program show?",
        options: ["10\n6\n2", "10\n6\n2\n0", "10\n6\n2\n-2", "(nothing)"],
        answer: 0,
        why: "It starts at 10 and jumps by -4: 10, 6, 2. The next would be -2, which is past the stop (0), so the loop ends.",
      },
      task: [
        "Mark a rafter every `spacing` cm along the frame, starting at 0 on the near gable. Keep going towards the far gable at `length` cm but never past it; a mark that lands exactly on the far gable counts too. One line per rafter: `Rafter at <position> cm`.",
        "Then the crew lifts the ridge beam on a countdown: the numbers from `count` down to 1, one per line, and after them `Heave!`",
      ],
      starter: r`length = 600    # cm from the near gable to the far one
spacing = 60    # cm between rafters
count = 3       # the crew's countdown for the ridge beam

# 1. A rafter every spacing cm, from 0 to the far gable.
# 2. Count down, then heave.
`,
      tests: PRE + r`check("range(" in code, "Both jobs are for range: one counting up in steps, one counting down.")
need_for("the rafter marks")
raft = [l for l in lines if l.startswith("Rafter")]
rest = [l for l in lines if not l.startswith("Rafter")]
want_r = ["Rafter at " + str(p) + " cm" for p in range(0, 601, 60)]
check(len(raft) > 0, "No rafters yet: one line per rafter, starting at 0.")
check(raft != want_r[:-1], "Every rafter's there except the one on the far gable at 600 cm. A mark landing exactly on length counts, but range always stops just before its stop number.")
check(raft[0] == "Rafter at 0 cm", "The first rafter goes at 0, right on the near gable.")
check(len(rest) > 0 and rest[-1] == "Heave!", "After the countdown, the crew needs to hear Heave! on the very last line.")
nums = rest[:-1]
check(nums != [], "Your countdown printed no numbers. range only counts down if its step goes down.")
check("0" not in nums, "Your countdown says 0. The crew heaves straight after 1: where does range stop?")
check(nums != ["1", "2", "3"], "That count goes up. A countdown needs a step that goes down.")
check(nums != ["3", "2"], "Your countdown stops at 2. The crew counts all the way down to 1.")
check(", -" in code or ",-" in code, "Let range do the countdown too: range can count down if you give it a step that goes down.")
expect_lines(want_r + ["3", "2", "1", "Heave!"])
vns, got = again(("length = 600", "length = 590"))
past = [l for l in got if l.startswith("Rafter at ") and l.endswith(" cm") and l[10:-3].isdigit() and int(l[10:-3]) > 590]
check(not past, "With the far gable at 590 cm, your program puts a rafter at " + (past[0][10:] if past else "") + ", past the gable. Rafters may land on the far gable but never beyond it.")
expect_when([("length = 600", "length = 590")], ["Rafter at " + str(p) + " cm" for p in range(0, 541, 60)] + ["3", "2", "1", "Heave!"], "590 isn't a multiple of 60, so the last rafter is the last mark before the gable.")
expect_when([("length = 600", "length = 200"), ("spacing = 60", "spacing = 50")], ["Rafter at 0 cm", "Rafter at 50 cm", "Rafter at 100 cm", "Rafter at 150 cm", "Rafter at 200 cm", "3", "2", "1", "Heave!"], "Use length and spacing in your range, not today's numbers.")
expect_when([("count = 3", "count = 5")], want_r + ["5", "4", "3", "2", "1", "Heave!"], "The crew counts down from count, whatever it is.")`,
      hints: [
        "Two separate loops. For the rafters: which numbers do you want, from where to where, jumping by how much? Remember the stop is never included. For the countdown: which way are the numbers going?",
        "`range(0, 30, 10)` gives 0, 10, 20 but not 30; `range(0, 31, 10)` reaches 30, and so would any stop up to 40 (never further, or you'd overshoot). `range(4, 0, -1)` gives 4, 3, 2, 1.",
        "`for spot in range(0, length + ___, spacing):` prints the rafter line. Then `for n in range(count, ___, -1):` prints `n`, and `Heave!` goes after that loop, at the edge.",
      ],
      solution: r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, 0, -1):
    print(n)
print("Heave!")`,
      wrong: [r`length = 600
spacing = 60
count = 3
for spot in range(0, length, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, 0, -1):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + spacing, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, 0, -1):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, 0):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, -1, -1):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
for n in range(1, count + 1):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
print(3)
print(2)
print(1)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(spacing, length + 1, spacing):
    print(f"Rafter at {spot} cm")
for n in range(count, 0, -1):
    print(n)
print("Heave!")`, r`length = 600
spacing = 60
count = 3
for spot in range(0, length + 1, spacing):
    print(f"Rafter at {spot} cm")
n = count
while n > 0:
    print(n)
    n -= 1
print("Heave!")`],
      done: "Hazel: Eleven rafters, sixty apart. I measured every one. Wren says I'm 'thorough'. Wren says it like it's a warning.",
    },
    {
      id: "b05-plaster",
      part: "Plaster walls",
      title: "Buckets of Plaster",
      topic: "accumulators",
      cost: { wood: 1, stone: 5 },
      intro: [
        "Hazel: Wren's come over to mix the plaster. She asked how much. I said 'enough'. She said that isn't a number. She's right, which is annoying.",
        "To add things up in a loop, keep a running total: make a variable **before** the loop, starting at 0, and add to it in every round. That's an **accumulator**.",
        "Counting is the same trick: start at 0 and add 1, but only in the rounds where your `if` says so.",
        "`sum()` from the market adds a whole list in one go, but it can't help when some items count double. That needs you.",
      ],
      codex: ["accumulators"],
      quiz: {
        code: r`total = 0
for coin in [2, 5, 1]:
    total += coin
    print(total)`,
        question: "What does this program show?",
        options: ["2\n7\n8", "8", "2\n5\n1", "8\n8\n8"],
        answer: 0,
        why: "The print is inside the loop, so it shows the running total after each coin: 0 + 2 = 2, then 2 + 5 = 7, then 7 + 1 = 8.",
      },
      task: [
        "Every square metre of wall takes one bucket of plaster. Panels bigger than 4 m² face the wind on the gables and get a second coat, so they take twice as much.",
        "Work out how many buckets the walls need in all, and how many panels get a second coat.",
        "Report both, the buckets first: `Buckets: <number>`, then `Second coats: <number>`.",
        "Hazel may still add or change panels, so work from the list.",
      ],
      starter: PANELS + r`   # area of each wall panel, in m²

# Keep a running total of buckets, and count the second coats.
`,
      tests: PRE + r`need_for("the panels")
b = [l for l in lines if l.startswith("Buckets:")]
s = [l for l in lines if l.startswith("Second coats:")]
check(len(b) <= 1 and len(s) <= 1, "Your report prints every round. Let the loop finish adding everything up, then print the totals once, after it.")
check(len(b) == 1, "Report the buckets on a line that starts with Buckets: and a space.")
check(len(s) == 1, "Report the second coats on a line that starts with Second coats: and a space.")
check(b[0] != "Buckets: 23", "23 buckets is one coat everywhere. The big gable panels need twice as much plaster.")
check(b[0] != "Buckets: 3", "Your total only remembers the last panel. Is it being set back to 0 in every round? Start it once, before the loop.")
check(s[0] != "Second coats: 3", "A panel of exactly 4 m² isn't bigger than 4, so it gets just the one coat.")
expect_lines(["Buckets: 34", "Second coats: 2"])
expect_when([('` + PANELS + r`', "panels = [5, 5, 1]")], ["Buckets: 21", "Second coats: 2"], "Work from the list, not today's numbers.")
expect_when([('` + PANELS + r`', "panels = [2, 4, 1]")], ["Buckets: 7", "Second coats: 0"], "With no big panels, nobody gets a second coat.")
expect_when([('` + PANELS + r`', "panels = []")], ["Buckets: 0", "Second coats: 0"], "With no panels at all the walls need nothing, and your accumulators should still say so.")`,
      hints: [
        "Work it out on paper for the first three panels: how many buckets does each one take, and what's the running total after each? Your loop should do exactly what your pencil did.",
        "Accumulators start before the loop: `eggs = 0`, then inside the loop `eggs += n`. To count only some rounds, put `found += 1` inside an `if`. An `if` / `else` can add different amounts in different rounds.",
        "`buckets = 0` and `second = 0` before the loop. Inside `for area in panels:`, `if area > 4:` adds `area * 2` to `buckets` and 1 to `second`; `else:` adds ___ to `buckets`. Print both after the loop.",
      ],
      solution: PANELS + r`
buckets = 0
second = 0
for area in panels:
    if area > 4:
        buckets += area * 2
        second += 1
    else:
        buckets += area
print(f"Buckets: {buckets}")
print(f"Second coats: {second}")`,
      wrong: [PANELS + r`
second = 0
for area in panels:
    if area > 4:
        second += 1
print(f"Buckets: {sum(panels)}")
print(f"Second coats: {second}")`, PANELS + r`
buckets = 0
second = 0
for area in panels:
    if area >= 4:
        buckets += area * 2
        second += 1
    else:
        buckets += area
print(f"Buckets: {buckets}")
print(f"Second coats: {second}")`, PANELS + r`
for area in panels:
    buckets = 0
    second = 0
    if area > 4:
        buckets += area * 2
        second += 1
    else:
        buckets += area
print(f"Buckets: {buckets}")
print(f"Second coats: {second}")`, PANELS + r`
buckets = 0
second = 0
for area in panels:
    if area > 4:
        buckets += area * 2
        second += 1
    else:
        buckets += area
    print(f"Buckets: {buckets}")
    print(f"Second coats: {second}")`, PANELS + r`
for area in panels:
    print(area)
print("Buckets: 34")
print("Second coats: 2")`],
      done: "Hazel: Thirty-four buckets, exactly. Wren mixed thirty-five. She says the spare one is 'for luck'. I've told her what I think of luck.",
    },
    {
      id: "b06-keystone",
      part: "Brick oven dome",
      title: "The Keystone",
      topic: "searching with break",
      cost: { wood: 0, stone: 9 },
      intro: [
        "Hazel: The dome closes with one last brick at the top of the arch: the keystone. Too wide and it won't go in. Too narrow and it drops out onto my bread.",
        "The bricks are in a pile, and you pick them up one at a time. Once you've found the one you want, you stop. No sense disturbing the rest.",
        "`break` works in a `for` loop just as it did in your `while` loops at the dock: it ends the loop at once. Keep the brick you found in a variable, and it's still there after the loop.",
      ],
      codex: ["loop-search"],
      quiz: {
        code: r`for n in [4, 9, 2, 12]:
    if n > 5:
        print(n)
        break
print("stop")`,
        question: "What does this program show?",
        options: ["9\nstop", "9\n12\nstop", "stop", "9"],
        answer: 0,
        why: "9 is the first number over 5, so it's printed and break ends the loop straight away. 12 is never reached. Then the line after the loop runs.",
      },
      task: [
        "Pick bricks off the pile, top first, until you find the keystone: a brick no wider than the `gap`, and no more than 2 cm narrower than it (any looser and it drops out).",
        "Stop as soon as you find it: Hazel doesn't want the rest of the pile disturbed.",
        "Report the keystone's width and how many bricks you picked up to find it, the keystone included: a 20 cm keystone that was the 3rd brick would read `Keystone: 20 cm, bricks picked up: 3`.",
        "Hazel checked: there is always at least one brick in the pile that fits.",
      ],
      starter: r`gap = 22                           # cm, the space at the top of the arch
` + PILE + r`    # brick widths in cm, top of the pile first

# Pick bricks up one by one until one fits snugly.
`,
      tests: PRE + r`need_for("the pile")
check("break" in code, "Once the keystone is found, stop looking: there's a word that leaves a loop early.")
k = [l for l in lines if l.startswith("Keystone:")]
check(len(k) == 1, "Report the keystone on one line that starts with Keystone:, once, after the search.")
check(k[0] != "Keystone: 20 cm, bricks picked up: 6", "You found the keystone, then kept picking up bricks, and ended with the last brick that fits instead of the first. Stop the loop the moment one fits.")
check(k[0] != "Keystone: 21 cm, bricks picked up: 3", "The keystone itself counts as a brick you picked up: it was the 4th. Count each brick as soon as you pick it up, before checking it.")
check(not k[0].startswith("Keystone: 23 cm"), "A 23 cm brick is wider than the 22 cm gap: it won't go in at all, however close it is. Snug means no wider than the gap and at most 2 cm narrower.")
expect_lines(["Keystone: 21 cm, bricks picked up: 4"])
vns, got = again(("gap = 22", "gap = 30"), ('` + PILE + r`', "pile = [33, 28, 29]"))
check(got != ["Keystone: 29 cm, bricks picked up: 3"], "With a 30 cm gap and the pile 33, 28, 29, your search passes over the 28. A brick exactly 2 cm narrower than the gap is still snug enough: check both ends of your test.")
expect_when([("gap = 22", "gap = 30"), ('` + PILE + r`', "pile = [33, 28, 29]")], ["Keystone: 28 cm, bricks picked up: 2"], "28 is exactly 2 cm narrower than a 30 cm gap, which is still snug enough.")
expect_when([("gap = 22", "gap = 30"), ('` + PILE + r`', "pile = [33, 27, 28, 31]")], ["Keystone: 28 cm, bricks picked up: 3"], "28 is exactly 2 cm narrower than a 30 cm gap, which is still snug enough. 27 is too loose, and 33 is too wide.")
expect_when([("gap = 22", "gap = 20"), ('` + PILE + r`', "pile = [20, 19]")], ["Keystone: 20 cm, bricks picked up: 1"], "A brick exactly as wide as the gap fits perfectly.")
expect_when([('` + PILE + r`', "pile = [24, 21, 22]")], ["Keystone: 21 cm, bricks picked up: 2"], "A brick wider than the gap won't go in at all, even 2 cm wider.")`,
      hints: [
        "Keep track of two things: how many bricks you've picked up, and the one that fitted. A brick counts as picked up even if it doesn't fit. And once one fits, what should the loop do?",
        "Three separate tools. A counter that goes up as the very first line of every round counts every round, the last one included. A chained comparison like `5 <= x <= 9` checks both ends at once. And `break` ends a loop the moment it runs, so anything you stored just before it is still there afterwards.",
        "`picked = 0` before the loop. In the loop, `picked += 1` first, then `if gap - 2 <= brick <= ___:` with `keystone = brick` and `break` inside. Print the report after the loop.",
      ],
      solution: r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    picked += 1
    if gap - 2 <= brick <= gap:
        keystone = brick
        break
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`,
      wrong: [r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    picked += 1
    if gap - 2 <= brick <= gap:
        keystone = brick
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`, r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    if gap - 2 <= brick <= gap:
        keystone = brick
        break
    picked += 1
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`, r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    picked += 1
    if gap - 2 < brick <= gap:
        keystone = brick
        break
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`, r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    picked += 1
    if abs(brick - gap) <= 2:
        keystone = brick
        break
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`, r`gap = 22
` + PILE + r`
picked = 0
for brick in pile:
    picked += 1
    if gap - 2 <= brick < gap:
        keystone = brick
        break
print(f"Keystone: {keystone} cm, bricks picked up: {picked}")`, r`gap = 22
` + PILE + r`
for brick in pile:
    if brick == 21:
        break
print("Keystone: 21 cm, bricks picked up: 4")`],
      done: "Hazel: It's in. Tap it. Hear that? Solid. That dome will stand longer than either of us. That's what a keystone is for.",
    },
    {
      id: "b07-envoy-dough",
      part: "Arched door",
      title: "Dough for the Envoy",
      topic: "building a new list",
      cost: { wood: 6, stone: 1 },
      intro: [
        "While Wren hangs the green door, Hazel sits at the trestle with her recipe card and a pencil behind her ear.",
        "Hazel: My card makes one batch. The envoy's feast needs a great deal more. I am not crossing out my card to do it. Write the new amounts somewhere new.",
        "To make a new list from an old one: start an empty list `[]` before the loop, and every round `append` a changed item to it. The old list stays exactly as it was.",
      ],
      codex: ["building-lists"],
      quiz: {
        code: r`old = [1, 2, 3]
new = []
for n in old:
    new.append(n + 10)
print(old)`,
        question: "What does this program show?",
        options: ["[1, 2, 3]", "[11, 12, 13]", "[]", "[1, 2, 3, 11, 12, 13]"],
        answer: 0,
        why: "The loop only reads old; the changed numbers go into new. Printing old shows it just as it was.",
      },
      task: [
        "Hazel's `card` gives the grams of each ingredient for one batch. The feast needs `batches` batches.",
        "Make a new list holding the grams for the whole feast, in the card's order, and print it.",
        "Then print the card, to show Hazel it hasn't been touched.",
        "Last, the total weight of the feast's dough: `Dough: <grams> g`.",
      ],
      starter: CARD + r`   # grams of flour, water, salt and yeast for one batch
batches = 6                # batches the envoy's feast needs

# A new list for the feast, in the card's order. Leave the card alone.
`,
      tests: PRE + r`need_for("the card")
check(ns.get("card") == [500, 350, 10, 5], "Hazel's card has been changed! Leave card exactly as it was, and put the feast's amounts in a new list of their own.")
check(len(lines) > 0, "Nothing was printed yet: the feast's list, the card, then the dough line.")
check(lines[0] != str([500, 350, 10, 5] * 6), "That's the card written out six times over. Multiplying a whole list repeats it; each amount needs multiplying on its own.")
check(lines[0] != "[]", "Your new list is empty. Every round should add the changed amount to it.")
check(lines[0] != "[30]", "Your new list only holds the last amount. It's being made fresh every round: make it once, before the loop.")
check(len([l for l in lines if l.startswith("[")]) <= 2, "You print the list every round, a little longer each time. Print it once, after the loop has filled it.")
expect_lines(["[3000, 2100, 60, 30]", "[500, 350, 10, 5]", "Dough: 5190 g"])
expect_when([("batches = 6", "batches = 2")], ["[1000, 700, 20, 10]", "[500, 350, 10, 5]", "Dough: 1730 g"], "Multiply by batches, not by today's number.")
expect_when([('` + CARD + r`', "card = [400, 300, 8, 4, 50]"), ("batches = 6", "batches = 3")], ["[1200, 900, 24, 12, 150]", "[400, 300, 8, 4, 50]", "Dough: 2286 g"], "Hazel added honey to her card. Walk whatever is on the card, however long it is.")`,
      hints: [
        "There are two lists in this story: the card, which stays as it is, and a new one that grows. Where should the new list be made, so it isn't wiped every round?",
        "`doubled = []` before the loop, then `for n in nums: doubled.append(n * 2)` fills it. Multiplying a whole list (`nums * 2`) repeats it instead of multiplying each number. `sum()` adds up any list.",
        "`feast = []`, then `for grams in card:` with `feast.append(___)` indented under it. After the loop: print `feast`, then `card`, then `f\"Dough: {sum(feast)} g\"`.",
      ],
      solution: CARD + r`
batches = 6
feast = []
for grams in card:
    feast.append(grams * batches)
print(feast)
print(card)
print(f"Dough: {sum(feast)} g")`,
      wrong: [CARD + r`
batches = 6
for grams in card:
    print(grams)
print(card * batches)`, CARD + r`
batches = 6
for grams in card:
    feast = []
    feast.append(grams * batches)
print(feast)
print(card)
print(f"Dough: {sum(feast)} g")`, CARD + r`
batches = 6
for i in range(len(card)):
    card[i] = card[i] * batches
print(card)
print(card)
print(f"Dough: {sum(card)} g")`, CARD + r`
batches = 6
feast = []
for grams in card:
    feast.append(grams * batches)
    print(feast)
print(card)
print(f"Dough: {sum(feast)} g")`, CARD + r`
batches = 6
feast = []
for grams in card:
    feast.append(grams * 6)
print(feast)
print(card)
print(f"Dough: {sum(feast)} g")`],
      done: "Hazel: Three kilos of flour and a card without a single crossing-out. Good. ...That door's very green. Bram would say it's cheerful. I'd say it's very green.",
    },
    {
      id: "b08-shop-window",
      part: "Windows and shop counter",
      title: "Fit for the Window",
      topic: "filtering in a loop",
      cost: { wood: 6, stone: 1 },
      intro: [
        "Hazel: The shop window is for my best bread. Not my bread. My *best* bread.",
        "Hazel: A loaf should weigh what I meant it to weigh. Within ten grams, it goes in the window. Otherwise it goes in the seconds basket.",
        "The seconds basket goes to the Sleepy Serpent, for dipping. Hazel says that's 'just practical'. Pip notices that Hazel says it very fast.",
        "Filtering is building a list with an `if` around the `append`: only the items that pass get in. With an `else`, one loop can fill two lists.",
      ],
      codex: ["building-lists"],
      quiz: {
        code: r`kept = []
for n in [3, 8, 5, 10]:
    if n > 4:
        kept.append(n)
print(len(kept))`,
        question: "What does this program show?",
        options: ["3", "4", "[8, 5, 10]", "2"],
        answer: 0,
        why: "Only 8, 5 and 10 pass the test, so kept holds three numbers and len(kept) is 3.",
      },
      task: [
        "Every loaf from Hazel's test bake in her little camp oven was weighed (`weights`, in grams, in the order they came out). A loaf goes in the window if it's within 10 g of `target`, heavy or light. Every other loaf goes in the seconds basket.",
        "Print the window's loaves as a list, in the order they were weighed, then the basket's the same way.",
        "Last, one line saying how many of the loaves made the window: three out of eight would read `3 of 8 for the window.`",
      ],
      starter: r`target = 800   # grams a loaf should weigh
` + WEIGHTS + r`   # the test bake

# Sort the loaves: window, or seconds basket.
`,
      tests: PRE + r`need_for("the weights")
check(ns.get("weights") == [806, 780, 815, 795, 800, 789, 830, 810], "The weights list changed while your loop was walking it, so the loop lost its place and skipped loaves. Leave weights alone and put the loaves into new lists.")
check(len(lines) >= 3, "Print three things: the window's list, the basket's list, and the line saying how many made the window.")
check(lines[0] != "[806, 780, 795, 800, 789, 810]", "Some loaves that are far too light made the window. 'Within 10 g' works both ways: too heavy and too light both count against a loaf.")
check(lines[0] != "[806, 795, 800]", "The 810 g loaf is exactly 10 g heavy, and exactly 10 g still counts as within 10 g.")
expect_lines(["[806, 795, 800, 810]", "[780, 815, 789, 830]", "4 of 8 for the window."])
expect_when([("target = 800", "target = 500"), ('` + WEIGHTS + r`', "weights = [490, 511, 505, 470]")], ["[490, 505]", "[511, 470]", "2 of 4 for the window."], "490 is exactly 10 g light, so it makes the window.")
expect_when([("target = 800", "target = 300"), ('` + WEIGHTS + r`', "weights = [300, 305]")], ["[300, 305]", "[]", "2 of 2 for the window."], "When every loaf is good, the seconds basket is empty, and the count still comes from the lists.")`,
      hints: [
        "Ask each loaf one question: how far is it from the target, whichever way? A loaf 6 g light and a loaf 6 g heavy are equally good.",
        "`abs(a - b)` is the distance between two numbers, whichever is bigger: `abs(3 - 7)` is 4. Two lists can fill in one loop: `if ...: good.append(x)` and `else: bad.append(x)`. `len` counts a list.",
        "`window = []` and `seconds = []`, then `for w in weights:` / `if abs(w - target) ___ 10:` appends to `window`, `else:` to `seconds`. After the loop, print both lists, then the count line from their lengths.",
      ],
      solution: r`target = 800
` + WEIGHTS + r`
window = []
seconds = []
for w in weights:
    if abs(w - target) <= 10:
        window.append(w)
    else:
        seconds.append(w)
print(window)
print(seconds)
print(f"{len(window)} of {len(weights)} for the window.")`,
      wrong: [r`target = 800
` + WEIGHTS + r`
window = []
seconds = []
for w in weights:
    if w - target <= 10:
        window.append(w)
    else:
        seconds.append(w)
print(window)
print(seconds)
print(f"{len(window)} of {len(weights)} for the window.")`, r`target = 800
` + WEIGHTS + r`
window = []
seconds = []
for w in weights:
    if abs(w - target) < 10:
        window.append(w)
    else:
        seconds.append(w)
print(window)
print(seconds)
print(f"{len(window)} of {len(weights)} for the window.")`, r`target = 800
` + WEIGHTS + r`
seconds = []
for w in weights:
    if abs(w - target) > 10:
        seconds.append(w)
        weights.remove(w)
print(weights)
print(seconds)
print(f"{len(weights)} of 8 for the window.")`, r`target = 800
` + WEIGHTS + r`
window = []
seconds = []
for w in weights:
    if abs(w - target) <= 10:
        window.append(w)
    else:
        seconds.append(w)
print(window)
print(seconds)
print("4 of 8 for the window.")`],
      done: "Hazel: Four in the window, four for dipping. Pip, take the basket over to the Serpent. Don't say who it's from. ...He'll know who it's from.",
    },
    {
      id: "b09-order-board",
      part: "Tile roof",
      title: "The Order Board",
      topic: "enumerate",
      cost: { wood: 4, stone: 5 },
      intro: [
        "While the roofers lay the red tiles, the envoy's steward sends the first orders, and Hazel chalks every one on the board by the counter.",
        "Hazel: Numbered. People like a number. It makes them feel the queue is moving.",
        "**enumerate** hands you two things every round: a number and the item. `for n, cake in enumerate(cakes):` counts from 0, and `enumerate(cakes, start=1)` counts from 1.",
        "Two names go between `for` and `in`, with a comma: the number first, then the item.",
      ],
      codex: ["enumerate"],
      quiz: {
        code: r`for n, pie in enumerate(["plum", "pear"], start=5):
    print(n, pie)`,
        question: "What does this program show?",
        options: ["5 plum\n6 pear", "0 plum\n1 pear", "1 plum\n2 pear", "5 plum\n5 pear"],
        answer: 0,
        why: "start=5 makes the counting begin at 5, and it goes up by one each round: 5 for plum, 6 for pear.",
      },
      task: [
        "Chalk every order on the board, numbered from 1, one line each: the number, a full stop, a space and the order. The seventh order, if it were a rye loaf, would read `7. Rye loaf`.",
        "The oven holds `oven_holds` orders at once. After every full ovenful, chalk a line `-- oven full --` to show where one bake ends. A last oven that isn't full gets no line.",
      ],
      starter: ORDERS + r`
oven_holds = 3    # orders that fit in the oven at once

# Chalk every order on the board, numbered from 1,
# and mark where each full ovenful ends.
`,
      tests: PRE + r`need_for("the orders")
check("enumerate(" in code, "Let enumerate do the numbering: it hands you a number along with every order.")
check(len(lines) > 0, "Nothing was chalked yet: one line for every order.")
check(not lines[0].startswith("0."), "Your board starts at 0. People like their order numbers to start at 1, and enumerate can be told where to start.")
check(lines[0] == "1. Seed loaf", "The first line should be the number 1, a full stop, a space and the first order.")
check(len(lines) < 2 or lines[1] != "-- oven full --", "Your first oven-full mark comes straight after the first order. The oven holds 3, so the first mark goes after order 3. Which number is your test looking at?")
check(lines.count("-- oven full --") != 1, "Only one oven-full mark, but seven orders fill the oven twice. The mark belongs after every full ovenful, not just the first.")
expect_lines(["1. Seed loaf", "2. Rye loaf", "3. Honey buns", "-- oven full --", "4. Plain loaf", "5. Seed rolls", "6. Rye loaf", "-- oven full --", "7. Oat rolls"])
expect_when([("oven_holds = 3", "oven_holds = 2"), ('` + ORDERS + r`', 'orders = ["Buns", "Rye loaf", "Seed loaf", "Oat rolls"]')], ["1. Buns", "2. Rye loaf", "-- oven full --", "3. Seed loaf", "4. Oat rolls", "-- oven full --"], "With an oven that holds 2, a mark goes after every 2nd order, including the last one when it fills the oven.")
expect_when([("oven_holds = 3", "oven_holds = 5")], ["1. Seed loaf", "2. Rye loaf", "3. Honey buns", "4. Plain loaf", "5. Seed rolls", "-- oven full --", "6. Rye loaf", "7. Oat rolls"], "Use oven_holds for the oven's size, not today's number.")`,
      hints: [
        "Each line needs a number and an order, so ask enumerate for both. When is the oven full? After order 3, order 6, order 9... What do those numbers have in common?",
        "`for n, x in enumerate(things, start=1):` numbers from 1. `n % 4 == 0` is True for 4, 8, 12 and so on: every number that 4 divides into evenly.",
        "`for n, order in enumerate(orders, start=1):` prints `f\"{n}. {order}\"`, then `if n % ___ == 0:` prints the oven-full line.",
      ],
      solution: ORDERS + r`
oven_holds = 3
for n, order in enumerate(orders, start=1):
    print(f"{n}. {order}")
    if n % oven_holds == 0:
        print("-- oven full --")`,
      wrong: [ORDERS + r`
oven_holds = 3
for n, order in enumerate(orders):
    print(f"{n}. {order}")
    if n % oven_holds == 0:
        print("-- oven full --")`, ORDERS + r`
oven_holds = 3
for n, order in enumerate(orders, start=1):
    print(f"{n}. {order}")
    if n % 3 == 0:
        print("-- oven full --")`, ORDERS + r`
oven_holds = 3
for n, order in enumerate(orders):
    print(f"{n + 1}. {order}")
    if n % oven_holds == 0:
        print("-- oven full --")`, ORDERS + r`
oven_holds = 3
for n, order in enumerate(orders, start=1):
    print(n, order)
    if n % oven_holds == 0:
        print("-- oven full --")`, ORDERS + r`
oven_holds = 3
n = 0
for order in orders:
    n += 1
    print(f"{n}. {order}")
    if n % oven_holds == 0:
        print("-- oven full --")`],
      done: "Hazel: A tiled roof and a full board. Seven orders, three ovenfuls. I'll be up at four. I'm always up at four.",
    },
    {
      id: "b10-still-to-bake",
      part: "Chimney",
      title: "Still to Bake",
      topic: "zip",
      cost: { wood: 0, stone: 8 },
      intro: [
        "The chimney's up, and Hazel has lit a small trial fire to see it draw. While it smokes, she checks what her little camp oven has baked for the feast against the envoy's order: the order in one list, what's cooling on the racks in another.",
        "Hazel: Same order in every list. Rye with rye, buns with buns. Don't you dare get them out of step.",
        "At the market you kept lists in step with one index for all of them. **zip** walks them together for you: `for hen, laid in zip(hens, eggs):` hands you one from each list every round. It works for three lists as well.",
      ],
      codex: ["zip", "loop-search"],
      quiz: {
        code: r`for a, b in zip(["x", "y", "z"], [1, 2]):
    print(a, b)`,
        question: "What does this program show?",
        options: ["x 1\ny 2", "x 1\ny 2\nz", "x 1\ny 2\nz None", "IndexError"],
        answer: 0,
        why: "zip stops as soon as the shorter list runs out. There's no partner for z, so z is simply left out: no error.",
      },
      task: [
        "`breads` names each bread on the envoy's order, `ordered` says how many of each the envoy wants, and `baked` how many are cooling already. The three lists are in step.",
        "For each bread, one line: if there are enough, `<bread>: ready`; if not, how many are still to bake, `<bread>: <number> to bake`.",
        "Last line: the bread with the most still to bake, so Hazel can start on it first: `Start with: <bread>`. On a tie, the one earlier on the order. (There's always at least one still to bake.)",
      ],
      starter: BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]

# One line per bread: ready, or how many still to bake.
# Then: which bread to start with.
`,
      tests: PRE + r`need_for("the order")
check("zip(" in code, "Walk the lists together with zip, so each bread stays in step with its own numbers.")
check(not any(" -" in l and "to bake" in l for l in lines), "One bread says a negative number to bake. More cooling than were ordered means that bread is ready.")
check("Seed loaf: 0 to bake" not in lines, "Seed loaf has 0 still to bake. Nothing left to bake means it's ready.")
s = [l for l in lines if l.startswith("Start with:")]
check(len(s) == 1, "Finish with one line, after all the breads, saying which bread to start with.")
check(s[0] != "Start with: 6", "Start with should name the bread, not how many it's short. Keep track of the name as well as the number.")
expect_lines(["Seed loaf: ready", "Rye loaf: 5 to bake", "Honey buns: 6 to bake", "Oat rolls: ready", "Start with: Honey buns"])
vns, got = again(('` + BREADS + r`', 'breads = ["Rye loaf", "Seed loaf", "Oat rolls"]'), ("ordered = [12, 8, 24, 10]", "ordered = [9, 4, 3]"), ("baked = [12, 3, 18, 11]", "baked = [2, 0, 3]"))
check(got[-1:] != ["Start with: Seed loaf"], "With Rye loaf 7 short and Seed loaf 4 short, your program starts with Seed loaf, the last bread that was short. Does your tracker change the name but not the biggest shortfall it compares against? Keep both up to date together.")
expect_when([('` + BREADS + r`', 'breads = ["Rye loaf", "Seed loaf", "Oat rolls"]'), ("ordered = [12, 8, 24, 10]", "ordered = [9, 4, 3]"), ("baked = [12, 3, 18, 11]", "baked = [2, 0, 3]")], ["Rye loaf: 7 to bake", "Seed loaf: 4 to bake", "Oat rolls: ready", "Start with: Rye loaf"], "The bread furthest behind comes first, wherever it is on the order.")
expect_when([('` + BREADS + r`', 'breads = ["Plain loaf", "Rye loaf", "Honey buns"]'), ("ordered = [12, 8, 24, 10]", "ordered = [4, 9, 6]"), ("baked = [12, 3, 18, 11]", "baked = [0, 2, 0]")], ["Plain loaf: 4 to bake", "Rye loaf: 7 to bake", "Honey buns: 6 to bake", "Start with: Rye loaf"], "Work everything out from the three lists, including which bread to start with.")
expect_when([('` + BREADS + r`', 'breads = ["Seed loaf", "Oat rolls", "Rye loaf"]'), ("ordered = [12, 8, 24, 10]", "ordered = [5, 6, 3]"), ("baked = [12, 3, 18, 11]", "baked = [2, 3, 3]")], ["Seed loaf: 3 to bake", "Oat rolls: 3 to bake", "Rye loaf: ready", "Start with: Seed loaf"], "Seed loaf and Oat rolls are both 3 short. On a tie, start with the one earlier on the order: only switch to a bread that's strictly further behind.")`,
      hints: [
        "Do one bread by hand: how many are wanted, how many are cooling, so how many are left to bake? What if that's zero, or less? For the last line you'll need to remember two things as you go: the biggest shortfall so far, *and* whose it was.",
        "`for name, a, b in zip(names, firsts, seconds):` gives one from each list per round. For the best so far, keep two trackers, like `top = 0` and `top_name = \"\"`, and change both together, only when you find a strictly bigger one.",
        "`short = want - have`. `if short <= 0:` prints the ready line; `else:` prints the to-bake line, and `if short > most:` sets `most = short` and `first = ___`. After the loop, print the start-with line.",
      ],
      solution: BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
first = ""
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short <= 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short > most:
            most = short
            first = bread
print(f"Start with: {first}")`,
      wrong: [BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
first = ""
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short == 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short > most:
            most = short
            first = bread
print(f"Start with: {first}")`, BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
first = ""
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short < 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short > most:
            most = short
            first = bread
print(f"Start with: {first}")`, BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
first = ""
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short <= 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short >= most:
            most = short
            first = bread
print(f"Start with: {first}")`, BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short <= 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short > most:
            most = short
print(f"Start with: {most}")`, BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short <= 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
print("Start with: Honey buns")`, BREADS + r`
ordered = [12, 8, 24, 10]
baked = [12, 3, 18, 11]
most = 0
first = ""
for bread, want, have in zip(breads, ordered, baked):
    short = want - have
    if short <= 0:
        print(f"{bread}: ready")
    else:
        print(f"{bread}: {short} to bake")
        if short > most:
            first = bread
print(f"Start with: {first}")`],
      done: "Smoke from the chimney, and the whole valley can see it! Bram came out of the Serpent to look and stood there for a very long time. Pip pretended not to notice. Pip noticed.",
    },
    {
      id: "b11-fire-trace",
      part: "First fire",
      title: "Watching the Fire",
      topic: "building strings in a loop",
      cost: { wood: 5, stone: 0 },
      intro: [
        "The first full firing of the big oven, hot enough for the feast! Hazel sits on an upturned bucket in front of the oven mouth with a thermometer, and does not blink.",
        "Hazel: An oven tells you everything if you watch it. Climbing? Holding? Dropping? I want it written in one line I can read at a glance.",
        "A string can be an accumulator too. Start with an empty string `\"\"` before the loop and add a piece each round with `+=`. When the loop ends, the string holds the whole story.",
      ],
      codex: ["string-building"],
      quiz: {
        code: r`row = ""
for n in range(3):
    row += str(n) + "-"
print(row)`,
        question: "What does this program show?",
        options: ["0-1-2-", "0-1-2", "2-", "012"],
        answer: 0,
        why: "Each round adds the number and a dash to the end of row, so the last dash stays too. The print is after the loop, so it runs once.",
      },
      task: [
        "Hazel read the oven every five minutes (`readings`, in degrees). Compare each reading with the one just before it and mark it: `+` if the heat climbed, `-` if it dropped, `=` if it held. The very first reading has nothing before it, so it gets no mark.",
        "Print all the marks on one line after `Fire: `. Five readings that climbed, climbed, held, then dropped would read `Fire: ++=-`.",
        "Then one more line: `Ready to bake.` if the last reading is at least `bake_heat`, otherwise `More wood!`",
      ],
      starter: READINGS + r`   # oven heat, every five minutes
bake_heat = 240

# Mark each reading against the one before: + climbed, - dropped, = held.
# Then: is it hot enough to bake?
`,
      tests: PRE + r`need_for("the readings")
f = [l for l in lines if l.startswith("Fire:")]
check(len(f) <= 1, "Your Fire: line prints every round. Build the whole line inside the loop, then print it once, after.")
check(len(f) == 1, "Print the marks on one line that starts with Fire: and a space.")
marks = f[0][5:].strip()
check(len(marks) != 6, "You have a mark for every reading, but the first reading has nothing before it to compare with. Six readings means five changes, so five marks.")
check(marks != "+++++", "Every mark is a +. Is each reading being compared with the very first one? Compare it with the reading just before it.")
check(len(marks) != 1, "Your line only holds one mark. Add each new mark onto the end of the string, rather than replacing what's there.")
expect_lines(["Fire: ++=+-", "Ready to bake."])
expect_when([('` + READINGS + r`', "readings = [200, 190, 190, 210]"), ("bake_heat = 240", "bake_heat = 210")], ["Fire: -=+", "Ready to bake."], "210 is exactly the baking heat, and at least 210 is hot enough.")
expect_when([('` + READINGS + r`', "readings = [150, 200]")], ["Fire: +", "More wood!"], "200 isn't hot enough to bake at 240.")
expect_when([('` + READINGS + r`', "readings = [200, 250, 230]")], ["Fire: +-", "More wood!"], "The fire touched 250 but has dropped to 230. Hazel bakes on the heat the oven has now: the last reading.")
expect_when([('` + READINGS + r`', "readings = [300, 300, 280]")], ["Fire: =-", "Ready to bake."], "Work from the readings, not today's numbers.")`,
      hints: [
        "Write today's marks on paper first: 120 to 180, 180 to 230, and so on. Each reading is compared with the one just before it, so the loop has to remember 'the one before'. And what happens with the very first reading?",
        "`line = \"\"` then `line += \"x\"` adds a piece. What must the loop carry from one round to the next? The Learn page's last section shows a loop that keeps 'the one before' in a variable. `nums[1:]` is everything but the first item, and `nums[-1]` is the last.",
        "`before = readings[0]` and `marks = \"\"`, then `for heat in readings[1:]:` with an `if` / `elif` / `else` adding `+`, `-` or `=`, and `before = ___` last in the loop. After it, print `\"Fire: \" + marks`, then check `readings[-1]`.",
      ],
      solution: READINGS + r`
bake_heat = 240
marks = ""
before = readings[0]
for heat in readings[1:]:
    if heat > before:
        marks += "+"
    elif heat < before:
        marks += "-"
    else:
        marks += "="
    before = heat
print("Fire: " + marks)
if readings[-1] >= bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`,
      wrong: [READINGS + r`
bake_heat = 240
marks = ""
before = readings[0]
for heat in readings[1:]:
    if heat > before:
        marks += "+"
    elif heat < before:
        marks += "-"
    else:
        marks += "="
print("Fire: " + marks)
if readings[-1] >= bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`, READINGS + r`
bake_heat = 240
marks = ""
before = 0
for heat in readings:
    if heat > before:
        marks += "+"
    elif heat < before:
        marks += "-"
    else:
        marks += "="
    before = heat
print("Fire: " + marks)
if readings[-1] >= bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`, READINGS + r`
bake_heat = 240
marks = ""
before = readings[0]
for heat in readings[1:]:
    if heat > before:
        marks += "+"
    elif heat < before:
        marks += "-"
    else:
        marks += "="
    before = heat
    print("Fire: " + marks)
if readings[-1] >= bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`, READINGS + r`
bake_heat = 240
marks = ""
before = readings[0]
for heat in readings[1:]:
    if heat > before:
        marks = "+"
    elif heat < before:
        marks = "-"
    else:
        marks = "="
    before = heat
print("Fire: " + marks)
if readings[-1] >= bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`, READINGS + r`
bake_heat = 240
marks = ""
before = readings[0]
for heat in readings[1:]:
    if heat > before:
        marks += "+"
    elif heat < before:
        marks += "-"
    else:
        marks += "="
    before = heat
print("Fire: " + marks)
if readings[-1] > bake_heat:
    print("Ready to bake.")
else:
    print("More wood!")`],
      done: "Hazel: Up to two-sixty, settling at two-fifty. That's a proper oven. Listen to it breathe.",
    },
    {
      id: "b12-shop-shelves",
      part: "Bread shelves and awning",
      title: "Boule, Baguette, Boule",
      topic: "nested loops",
      cost: { wood: 2, stone: 0 },
      intro: [
        "The shelves are up in the shop window, and the awning is striped like a deckchair. Now: bread on every shelf.",
        "Hazel: Round boules and long baguettes, turn and turn about, like a chessboard. Two of a kind side by side look like they've quarrelled.",
        "A loop inside a loop is a **nested loop**. The outer loop picks a shelf; the inner loop walks along that shelf, spot by spot. Every time the outer loop goes round once, the inner loop runs all the way through.",
      ],
      codex: ["nested-loops", "string-building"],
      quiz: {
        code: r`count = 0
for tray in range(3):
    for bun in range(4):
        count += 1
print(count)`,
        question: "What does this program show?",
        options: ["12", "7", "4", "3"],
        answer: 0,
        why: "For each of the 3 trays, the inner loop runs 4 times, so count goes up 3 × 4 = 12 times.",
      },
      task: [
        "The window has `shelves` shelves, with room for `spots` loaves on each. Fill them like a chessboard: `O` for a round boule, `I` for a long baguette, alternating along each shelf, and each shelf starting with the opposite loaf to the shelf above it. The top shelf starts with a boule.",
        "Print one line per shelf, top shelf first, with a space between loaves: a three-spot shelf that starts with a baguette reads `I O I`.",
        "Last line: how many of each, `Boules: <number>, baguettes: <number>`.",
      ],
      starter: r`shelves = 4    # shelves in the shop window
spots = 5      # loaves that fit on one shelf

# Fill every shelf, boule and baguette turn about, like a chessboard.
# Then count each kind.
`,
      tests: PRE + r`need_for("the shelves")
fors = [l for l in code.splitlines() if l.strip().startswith("for ")]
check(len(fors) >= 2, "This needs a loop inside a loop: one for the shelves, and inside it one for the spots along each shelf.")
rows = [l for l in lines if not l.startswith("Boules")]
check(len(rows) <= 4, "You printed " + str(len(rows)) + " shelf lines, but the window has 4 shelves. Print each shelf once, after its inner loop has filled it.")
check(len(rows) == 4, "Print one line for every shelf: 4 of them.")
check(len(rows[1]) <= len(rows[0]) + 1, "Each shelf's line also holds the loaves from the shelves before it. Start the line afresh for every shelf.")
check(" " in rows[0], "Put a space between the loaves on a shelf.")
check(rows[1] != rows[0], "Every shelf starts with the same loaf, so the boules line up in columns. Each shelf should start with the opposite of the one above: the pattern depends on the shelf and the spot together.")
c = [l for l in lines if l.startswith("Boules")]
check(len(c) == 1, "Finish with one line counting both kinds of loaf.")
check(c[0] != "Boules: 2, baguettes: 3", "Your counts only cover the last shelf. Counters for the whole window start before both loops.")
expect_lines(["O I O I O", "I O I O I", "O I O I O", "I O I O I", "Boules: 10, baguettes: 10"])
expect_when([("shelves = 4", "shelves = 3"), ("spots = 5", "spots = 3")], ["O I O", "I O I", "O I O", "Boules: 5, baguettes: 4"], "Use shelves and spots for your loops, and count each loaf as you place it.")
expect_when([("shelves = 4", "shelves = 2"), ("spots = 5", "spots = 4")], ["O I O I", "I O I O", "Boules: 4, baguettes: 4"], "With an even number of spots, each shelf must still start with the opposite loaf to the one above. Base each choice on the shelf and the spot together, not on the loaf before.")`,
      hints: [
        "Number the shelves and the spots from 0 and draw the first two shelves on paper. Which spots get a boule? Look for a rule that uses the shelf number and the spot number together.",
        "Outer loop for the shelves, a fresh `row = \"\"` at the start of each round, an inner loop that adds one loaf per spot, and `print(row)` after the inner loop. Add two whole numbers and the answer flips between even and odd whenever either one goes up by 1.",
        "Inside both loops: `if (shelf + spot) % 2 == ___:` adds `\"O \"` and counts a boule, `else:` adds `\"I \"` and counts a baguette. Both counters start before the outer loop.",
      ],
      solution: r`shelves = 4
spots = 5
boules = 0
baguettes = 0
for shelf in range(shelves):
    row = ""
    for spot in range(spots):
        if (shelf + spot) % 2 == 0:
            row += "O "
            boules += 1
        else:
            row += "I "
            baguettes += 1
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`,
      wrong: [r`shelves = 4
spots = 5
boules = 0
baguettes = 0
for shelf in range(shelves):
    row = ""
    for spot in range(spots):
        if spot % 2 == 0:
            row += "O "
            boules += 1
        else:
            row += "I "
            baguettes += 1
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
boules = 0
baguettes = 0
row = ""
for shelf in range(shelves):
    for spot in range(spots):
        if (shelf + spot) % 2 == 0:
            row += "O "
            boules += 1
        else:
            row += "I "
            baguettes += 1
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
boules = 0
baguettes = 0
for shelf in range(shelves):
    row = ""
    for spot in range(spots):
        if (shelf + spot) % 2 == 0:
            row += "O "
            boules += 1
        else:
            row += "I "
            baguettes += 1
        print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
for shelf in range(shelves):
    boules = 0
    baguettes = 0
    row = ""
    for spot in range(spots):
        if (shelf + spot) % 2 == 0:
            row += "O "
            boules += 1
        else:
            row += "I "
            baguettes += 1
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
boules = 0
baguettes = 0
for shelf in range(shelves):
    row = ""
    for spot in range(spots):
        if (shelf + spot) % 2 == 0:
            row += "O"
            boules += 1
        else:
            row += "I"
            baguettes += 1
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
boules = 0
baguettes = 0
loaf = "O"
for shelf in range(shelves):
    row = ""
    for spot in range(spots):
        row += loaf + " "
        if loaf == "O":
            boules += 1
            loaf = "I"
        else:
            baguettes += 1
            loaf = "O"
    print(row)
print(f"Boules: {boules}, baguettes: {baguettes}")`, r`shelves = 4
spots = 5
for shelf in range(2):
    print("O I O I O")
    print("I O I O I")
print("Boules: 10, baguettes: 10")`],
      done: "Hazel: Boule, baguette, boule. Nobody quarrelling. Now that's a window.",
    },
    {
      id: "b13-loaf-sign",
      part: "Bench and loaf sign",
      title: "Not One Burnt",
      topic: "flags",
      cost: { wood: 5, stone: 1 },
      intro: [
        "The sign is ready: an iron bracket and a painted wooden loaf. Hazel won't hang it yet.",
        "Hazel: A sign is a promise. I don't make promises over a burnt batch.",
        "To ask 'did *anything* match?', use a **flag**: a variable set to `False` before the loop. Any round that finds a match sets it to `True`. After the loop, the flag remembers.",
        "Careful where the 'nothing matched' answer goes. Inside the loop, it would speak up for every single good loaf.",
      ],
      codex: ["flags", "enumerate"],
      quiz: {
        code: r`found = False
for x in [3, 7, 2]:
    if x > 5:
        found = True
print(found)`,
        question: "What does this program show?",
        options: ["True", "False", "True\nFalse\nFalse", "7"],
        answer: 0,
        why: "7 sets found to True. 2 comes after it, but nothing sets found back to False, so after the loop it's still True. The print is after the loop, so it runs once.",
      },
      task: [
        "The first full bake is out. `minutes` says how long each loaf was in the oven, in the order they went in. A loaf is burnt if it was in for more than 4 minutes past `perfect`.",
        "For every burnt loaf, one line: which loaf it was, counting from 1, and how long it baked. The 3rd loaf burnt at 47 minutes would read `Loaf 3 burnt (47 min)`.",
        "When every loaf has been checked: if any burnt, `The sign waits.`; if none did, `Not one burnt. Up goes the sign!`",
      ],
      starter: r`perfect = 40    # minutes for a perfect loaf
` + MINUTES + r`   # how long each loaf baked, in oven order

# Find every burnt loaf, then decide about the sign.
`,
      tests: PRE + r`need_for("the loaves")
def burnt_checks(got, burnt_any):
    n = got.count("Not one burnt. Up goes the sign!")
    check(n <= 1, "Your program says 'Not one burnt' " + str(n) + " times, once for every good loaf. Whether none burnt can only be known after checking them all, so say it once, after the loop.")
    if burnt_any:
        check(n == 0, "Loaves burnt, but your sign still goes up. Whether any loaf burnt can't be decided from one loaf alone (say, the last): remember it from the moment a burnt one turns up, and don't let a good loaf undo that.")
check(not any("(44 min)" in l for l in lines), "Loaf 3 was in for 44 minutes: exactly 4 past perfect. That's fine. Only more than 4 minutes past is burnt.")
burnt_checks(lines, False)
expect_lines(["Not one burnt. Up goes the sign!"])
vns, got = again(('` + MINUTES + r`', "minutes = [41, 46, 40, 44, 47, 42]"))
burnt_checks(got, True)
check(got != ["Loaf 2 burnt (46 min)", "The sign waits."], "When loaves 2 and 5 burn, your program stops at loaf 2. Hazel wants every burnt loaf listed, so keep checking to the end.")
check("Loaf 1 burnt (46 min)" not in got, "When the 2nd loaf burns, your program calls it loaf 1. Count the loaves from 1: the first into the oven is loaf 1.")
expect_when([('` + MINUTES + r`', "minutes = [41, 46, 40, 44, 47, 42]")], ["Loaf 2 burnt (46 min)", "Loaf 5 burnt (47 min)", "The sign waits."], "Every burnt loaf gets a line, then the sign waits.")
expect_when([("perfect = 40", "perfect = 30"), ('` + MINUTES + r`', "minutes = [35, 30]")], ["Loaf 1 burnt (35 min)", "The sign waits."], "Work from perfect, not today's 40 minutes.")`,
      hints: [
        "There are two questions here: which loaves burnt, and whether any did. The first is answered loaf by loaf. The second isn't known until every loaf has been checked. Where does that line belong?",
        "A flag like `spoiled = False` is made before the loop, and only ever switched to `True` inside it. Nothing inside the loop should set it back to False, so after the loop it tells you whether any round found one. `enumerate(things, start=1)` numbers from 1.",
        "`for n, m in enumerate(minutes, start=1):` / `if m > perfect + 4:` prints the burnt line and sets `burnt = True`. After the loop: `if burnt:` the sign waits, `else:` ___.",
      ],
      solution: r`perfect = 40
` + MINUTES + r`
burnt = False
for n, m in enumerate(minutes, start=1):
    if m > perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        burnt = True
if burnt:
    print("The sign waits.")
else:
    print("Not one burnt. Up goes the sign!")`,
      wrong: [r`perfect = 40
` + MINUTES + r`
for n, m in enumerate(minutes, start=1):
    if m > perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        print("The sign waits.")
    else:
        print("Not one burnt. Up goes the sign!")`, r`perfect = 40
` + MINUTES + r`
burnt = False
for n, m in enumerate(minutes, start=1):
    if m > perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        burnt = True
        break
if burnt:
    print("The sign waits.")
else:
    print("Not one burnt. Up goes the sign!")`, r`perfect = 40
` + MINUTES + r`
burnt = False
for n, m in enumerate(minutes, start=1):
    if m > perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        burnt = True
    else:
        burnt = False
if burnt:
    print("The sign waits.")
else:
    print("Not one burnt. Up goes the sign!")`, r`perfect = 40
` + MINUTES + r`
burnt = False
for n, m in enumerate(minutes, start=1):
    if m >= perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        burnt = True
if burnt:
    print("The sign waits.")
else:
    print("Not one burnt. Up goes the sign!")`, r`perfect = 40
` + MINUTES + r`
burnt = False
for n, m in enumerate(minutes):
    if m > perfect + 4:
        print(f"Loaf {n} burnt ({m} min)")
        burnt = True
if burnt:
    print("The sign waits.")
else:
    print("Not one burnt. Up goes the sign!")`, r`perfect = 40
` + MINUTES + r`
for m in minutes:
    print(m)
print("Not one burnt. Up goes the sign!")`],
      done: "Hazel: Not one burnt. Up it goes. ...It's crooked. Leave it. It's my sign. It's allowed to be a bit crooked.",
    },
    {
      id: "b14-envoy-feast",
      part: "Festival loaf",
      title: "The Envoy's Feast",
      topic: "putting it together",
      cost: { wood: 4, stone: 4 },
      intro: [
        "The envoy is coming up the valley road! Bunting on the market, stew on at the Serpent, and Hazel's festival loaf cooling on the bench: three strands, braided.",
        "Hazel: The envoy's steward wants a receipt. A proper one. The King's people think a town that can't write a receipt can't be trusted with a charter. They're not wrong.",
        "This uses everything from the bakery: walk the order with `zip`, skip what isn't there, keep running totals, and build a tidy receipt. Plan it on paper first, line by line.",
      ],
      codex: ["zip", "for-loops", "accumulators", "enumerate"],
      quiz: {
        code: r`n = 0
for item in ["tea", "", "jam"]:
    if item == "":
        continue
    n += 1
    print(n, item)`,
        question: "What does this program show?",
        options: ["1 tea\n2 jam", "1 tea\n3 jam", "1 tea\n2\n3 jam", "1 tea"],
        answer: 0,
        why: "continue skips the rest of the round for the empty item, including n += 1, so n only counts the items that are printed: 1 for tea, 2 for jam.",
      },
      task: [
        "`breads`, `counts` and `prices` are the envoy's order, in step: the bread, how many, and the coins for one.",
        "One receipt line for each bread really ordered (a count of 0 means the steward crossed it out, so it isn't on the receipt), numbered 1, 2, 3… with no gaps. Each line gives its number, the count, the bread and what that line costs: `2. 6 x Rye loaf = 18 coins` would be a second line of six rye loaves at 3 coins.",
        "After the lines: `Loaves: <number>` for all the loaves, then `Total: <number> coins` for the whole order.",
        "Hazel's rule: an order of 20 loaves or more gets her braided festival loaf free. If it does, finish with `Festival braid: free`; if it doesn't, the receipt just ends at the total.",
      ],
      starter: FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]   # coins for one

# Write the envoy's receipt.
`,
      tests: PRE + r`need_for("the order")
check(not any(". 0 x " in l for l in lines), "The crossed-out Rye loaf is still on the receipt. A count of 0 gets no line at all.")
nums = [l.split(".")[0] for l in lines if "." in l and l[0].isdigit()]
check(nums != ["1", "3", "4", "5"], "Your receipt numbers jump from 1 to 3, leaving a gap where the crossed-out bread was. Number only the lines you actually print.")
t = [l for l in lines if l.startswith("Total:")]
check(len(t) <= 1, "Your totals print every round. Let the loop finish adding up, then print them once, after it.")
check(len(t) == 1, "After the receipt lines, give the total on a line that starts with Total:")
check(t[0] != "Total: 10 coins", "Your total adds up the price of one of each bread. Each line costs its count times its price.")
check("zip(" in code, "Walk the three lists together with zip, so each bread keeps its own count and price.")
expect_lines(["1. 6 x Seed loaf = 18 coins", "2. 12 x Honey buns = 12 coins", "3. 4 x Plain loaf = 8 coins", "4. 3 x Oat rolls = 3 coins", "Loaves: 25", "Total: 41 coins", "Festival braid: free"])
expect_when([("counts = [6, 0, 12, 4, 3]", "counts = [1, 2, 0, 0, 5]")], ["1. 1 x Seed loaf = 3 coins", "2. 2 x Rye loaf = 6 coins", "3. 5 x Oat rolls = 5 coins", "Loaves: 8", "Total: 14 coins"], "Work the numbers and totals out from the lists. Two crossed-out breads still leave no gaps, and an order this small gets no festival braid.")
expect_when([("counts = [6, 0, 12, 4, 3]", "counts = [10, 5, 0, 5, 0]")], ["1. 10 x Seed loaf = 30 coins", "2. 5 x Rye loaf = 15 coins", "3. 5 x Plain loaf = 10 coins", "Loaves: 20", "Total: 55 coins", "Festival braid: free"], "Exactly 20 loaves counts: 20 or more gets the braid.")
expect_when([("prices = [3, 3, 1, 2, 1]", "prices = [4, 2, 2, 3, 1]")], ["1. 6 x Seed loaf = 24 coins", "2. 12 x Honey buns = 24 coins", "3. 4 x Plain loaf = 12 coins", "4. 3 x Oat rolls = 3 coins", "Loaves: 25", "Total: 63 coins", "Festival braid: free"], "Use the prices list, not today's prices.")`,
      hints: [
        "Plan on paper: which numbers on the receipt aren't in any list (the line numbers, each line's cost, the totals)? Which bread gets left off, and should it use up a line number?",
        "`zip` can walk three lists at once. `continue` skips the rest of a round. A line counter that you add 1 to only when you print a line never has gaps, whereas enumerate counts the skipped bread too. Totals are accumulators, made before the loop.",
        "Before the loop: `line = 0`, `loaves = 0`, `coins = 0`. Inside `for bread, count, price in zip(breads, counts, prices):` skip a zero count, then `line += 1`, print the receipt line, and add to both totals. After the loop: the two total lines, then `if loaves ___ 20:`.",
      ],
      solution: FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
loaves = 0
coins = 0
for bread, count, price in zip(breads, counts, prices):
    if count == 0:
        continue
    line += 1
    cost = count * price
    print(f"{line}. {count} x {bread} = {cost} coins")
    loaves += count
    coins += cost
print(f"Loaves: {loaves}")
print(f"Total: {coins} coins")
if loaves >= 20:
    print("Festival braid: free")`,
      wrong: [FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
loaves = 0
coins = 0
for n, bread in enumerate(breads, start=1):
    count = counts[n - 1]
    price = prices[n - 1]
    if count == 0:
        continue
    cost = count * price
    print(f"{n}. {count} x {bread} = {cost} coins")
    loaves += count
    coins += cost
print(f"Loaves: {loaves}")
print(f"Total: {coins} coins")
if loaves >= 20:
    print("Festival braid: free")`, FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
loaves = 0
coins = 0
for bread, count, price in zip(breads, counts, prices):
    line += 1
    cost = count * price
    print(f"{line}. {count} x {bread} = {cost} coins")
    loaves += count
    coins += cost
print(f"Loaves: {loaves}")
print(f"Total: {coins} coins")
if loaves >= 20:
    print("Festival braid: free")`, FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
loaves = 0
coins = 0
for bread, count, price in zip(breads, counts, prices):
    if count == 0:
        continue
    line += 1
    cost = count * price
    print(f"{line}. {count} x {bread} = {cost} coins")
    loaves += count
    coins += cost
    print(f"Loaves: {loaves}")
    print(f"Total: {coins} coins")
if loaves >= 20:
    print("Festival braid: free")`, FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
loaves = 0
coins = 0
for bread, count, price in zip(breads, counts, prices):
    if count == 0:
        continue
    line += 1
    cost = count * price
    print(f"{line}. {count} x {bread} = {cost} coins")
    loaves += count
    coins += cost
print(f"Loaves: {loaves}")
print(f"Total: {coins} coins")
if loaves > 20:
    print("Festival braid: free")`, FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
loaves = 0
for bread, count, price in zip(breads, counts, prices):
    if count == 0:
        continue
    line += 1
    print(f"{line}. {count} x {bread} = {count * price} coins")
    loaves += count
print(f"Loaves: {loaves}")
print(f"Total: {sum(prices)} coins")
if loaves >= 20:
    print("Festival braid: free")`, FEAST_BREADS + r`
counts = [6, 0, 12, 4, 3]
prices = [3, 3, 1, 2, 1]
line = 0
for bread, count, price in zip(breads, counts, prices):
    if count == 0:
        continue
    line += 1
    print(f"{line}. {count} x {bread} = {count * price} coins")
print("Loaves: 25")
print("Total: 41 coins")
print("Festival braid: free")`],
      done: "Hazel: Four lines, no gaps, and a free braid. The steward folded the receipt into his coat like it was money. Well. It nearly was.",
    },
  ],
};
