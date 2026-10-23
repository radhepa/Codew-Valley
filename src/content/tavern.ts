import type { Building } from "./types.ts";

// The Sleepy Serpent: the first building. Each challenge adds one stage of the
// tavern model (ART.md, stage_01 … stage_12). Checks are Python run after the
// learner's program; see python/helper.ts _pg_grade for what they can use.
const r = String.raw;

// Shared check helper, put in front of checks that try the program again
// with another starting value: again("wood = 10", "wood = 20") -> (variables,
// printed lines). A variant that crashes gives friendly feedback instead of
// tripping the checker.
const PRE = r`def again(old, new):
    check(old in src, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
    try:
        return rerun(src.replace(old, new, 1))
    except Exception as e:
        check(False, "When " + new + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the variables so it fits any starting value, not just today's.")

`;

export const TAVERN: Building = {
  id: "tavern",
  name: "The Sleepy Serpent",
  blurb: "Every valley needs a warm hearth, a hot stew and a place to tell stories.",
  villager: { name: "Bram", model: "innkeeper", arrives: "end" },
  opening: [],
  finale: [
    "Bram: Well I'll be! A proper tavern, built with runes. Pull up a stool, founder. First stew's on the house.",
  ],
  chatDuring: [],
  chatAfter: [
    "Bram: Welcome to The Sleepy Serpent! Mind the step, I made it myself. Well, you did.",
    "Bram: Pip tells me there's a whole village waiting to be built. Wherever there's a village, there's thirsty builders. I'll keep the stew warm.",
  ],
  challenges: [
    {
      id: "t01-first-words",
      part: "Survey stakes",
      title: "The First Words",
      cost: { wood: 2, stone: 0 },
      intro: [
        "Ssso! You're the new founder. Welcome to the valley. I'm Pip, keeper of the old rune stone.",
        "This valley listens to one language: **Python**, the Old Tongue. Speak it to the rune stone and the land itself helps you build.",
        "Let's start our tavern! First, greet the valley. The stone will mark out the plot.",
      ],
      codex: ["print", "strings"],
      quiz: {
        code: r`print("Pip")`,
        question: "What does this program show?",
        options: ["Pip", "\"Pip\"", "print Pip", "(nothing)"],
        answer: 0,
        why: "The quotes only tell Python where the text starts and ends. They are not printed.",
      },
      task: ["Print exactly: `Hello, valley!`"],
      starter: r`# Speak to the rune stone.
# Write your line below:
`,
      tests: r`check(len(lines) > 0, "The rune stone heard nothing. Use print(...) to say something out loud.")
check(lines[0].lower().replace(",", "").replace("!", "").strip() == "hello valley", "The stone wants you to say: Hello, valley!")
check(lines[0] == "Hello, valley!", "So close! Match it exactly: capital H, a comma after Hello, and an exclamation mark at the end.")
expect_lines(["Hello, valley!"])`,
      hints: [
        "`print()` shows whatever is inside its parentheses.",
        "Text must be wrapped in quotes, like `\"this\"`.",
        "Type: `print(\"Hello, valley!\")`",
      ],
      solution: r`print("Hello, valley!")`,
      wrong: [r`"Hello, valley!"`, r`print("hello valley")`, r`print("Hello, valley!")
print("Hi")`],
      done: "Look! The stakes are in the ground. Our tavern has a home. Next we'll need a foundation.",
    },
    {
      id: "t02-laying-stones",
      part: "Stone foundation",
      title: "Laying Stones",
      cost: { wood: 0, stone: 4 },
      intro: [
        "A tavern without a foundation sinks into the mud by spring. We need stones, set one line at a time.",
        "Each `print()` is its own line. And careful: one stone has my name on it, with an apostrophe!",
      ],
      codex: ["strings", "print"],
      quiz: {
        code: r`print("A")
print("B")`,
        question: "What does this program show?",
        options: ["A\nB", "AB", "A B", "B\nA"],
        answer: 0,
        why: "Each print() starts a new line, and Python runs lines from top to bottom.",
      },
      task: [
        "Print these three lines, exactly, in this order:",
        "`Stone one: set.`",
        "`Stone two: set.`",
        "`Pip's stone: set.`",
      ],
      starter: r`# Three print() lines, one per stone.
`,
      tests: r`expect_lines(["Stone one: set.", "Stone two: set.", "Pip's stone: set."])`,
      hints: [
        "Python reads your program from the top, one line at a time, and every `print()` finishes its own line. How many lines does the stone want?",
        "The apostrophe in `Pip's` looks just like a single quote. If the string is wrapped in single quotes, Python thinks it ends at Pip. Wrap that one in double quotes instead.",
        "Three `print()` lines, one per stone. The last is `print(\"Pip's stone: set.\")`",
      ],
      solution: r`print("Stone one: set.")
print("Stone two: set.")
print("Pip's stone: set.")`,
      wrong: [r`print("Stone one: set.")
print("Stone two: set.")`, r`print("Stone one: set.", "Stone two: set.", "Pip's stone: set.")`, r`print("Stone one: set.")
print("Stone two: set.")
print("Pips stone: set.")`, r`print('Stone one: set.')
print('Stone two: set.')
print('Pip's stone: set.')`],
      done: "Solid as a mountain! Now let's put a floor on it.",
    },
    {
      id: "t03-counting-planks",
      part: "Floor planks",
      title: "Counting Planks",
      cost: { wood: 4, stone: 0 },
      intro: [
        "The sawmill crew left us a note: 24 planks and 60 nails. Let's write that down so we don't forget.",
        "In Python we keep values in **variables**: a name, an `=`, and the value. Like labelled crates.",
      ],
      codex: ["variables", "comments"],
      quiz: {
        code: r`x = 5
print("x")`,
        question: "What does this program show?",
        options: ["x", "5", "x 5", "NameError"],
        answer: 0,
        why: "With quotes, \"x\" is just the letter x. To print the variable's value you write print(x) without quotes.",
      },
      task: [
        "Make a variable `planks` that holds the number 24.",
        "Make a variable `nails` that holds the number 60.",
        "Print `Planks: 24` and then `Nails: 60`. The numbers must come from the variables, not be typed into the text.",
      ],
      starter: r`# Make your two variables here:


# Now print them:
`,
      tests: r`check("planks" in ns, "Create a variable named planks (all lowercase), like: planks = 24")
check(ns["planks"] != "24", "planks holds the text \"24\". Numbers don't need quotes: planks = 24")
check(ns["planks"] == 24, "planks should hold 24, but it holds " + repr(ns["planks"]) + ".")
check("nails" in ns, "Create a variable named nails, like: nails = 60")
check(ns["nails"] != "60", "nails holds the text \"60\". Numbers don't need quotes: nails = 60")
check(ns["nails"] == 60, "nails should hold 60, but it holds " + repr(ns["nails"]) + ".")
check("Planks: 24" not in src and "Nails: 60" not in src, "Print the variables instead of typing the numbers into the text, like: print(\"Planks:\", planks)")
expect_lines(["Planks: 24", "Nails: 60"])`,
      hints: [
        "A variable is made like this: `name = value`, with the name on the left. Numbers need no quotes.",
        "`print()` can show several things if you separate them with commas, and it puts a space between them. The label is text in quotes; the variable has no quotes.",
        "Write `planks = 24` and `nails = 60`, then `print(\"Planks:\", planks)` and the same kind of line for nails.",
      ],
      solution: r`planks = 24
nails = 60
print("Planks:", planks)
print("Nails:", nails)`,
      wrong: [r`planks = "24"
nails = "60"
print("Planks:", planks)
print("Nails:", nails)`, r`planks = 24
nails = 60
print("Planks: 24")
print("Nails: 60")`, r`Planks = 24
Nails = 60
print("Planks:", Planks)
print("Nails:", Nails)`],
      done: "Planks down, nice and snug. I can already picture the dancing!",
    },
    {
      id: "t04-raising-posts",
      part: "Corner posts",
      title: "Raising the Posts",
      cost: { wood: 4, stone: 0 },
      intro: [
        "Time for the four big corner posts. We started with 10 logs, I found 6 more by the river, and the posts will eat 8.",
        "Variables can change! `wood = wood + 1` means: take the old wood, add 1, and store the result back in wood.",
      ],
      codex: ["math", "variables"],
      quiz: {
        code: r`apples = 3
apples = apples + 2
print(apples)`,
        question: "What does this program show?",
        options: ["5", "3", "apples + 2", "32"],
        answer: 0,
        why: "The right side is worked out first using the old value (3 + 2), then stored back into apples.",
      },
      task: [
        "Add the 6 river logs to `wood`.",
        "Take away the 8 logs used by the posts.",
        "Don't just type the answer: change `wood` with `+` and `-` (or `+=` and `-=`).",
      ],
      starter: r`wood = 10
# Pip found 6 more logs by the river. Add them to wood:

# The 4 corner posts use up 8 logs. Take them away:

print("Wood left:", wood)
`,
      tests: PRE + r`check("wood = 10" in src, "Keep the first line exactly as it was: wood = 10")
check(ns.get("wood") != 10, "wood is still 10. A line like wood + 6 works out a new number and then throws it away. Store the answer back into wood with =.")
check(ns.get("wood") == 8, "wood should end up as 8 (10 + 6 - 8), but it is " + repr(ns.get("wood")) + ".")
variant, vlines = again("wood = 10", "wood = 20")
check(variant.get("wood") == 18, "If wood started at 20 your program should finish with 18. Change wood with + and -, instead of typing the final number.")
expect_lines(["Wood left: 8"])`,
      hints: [
        "A variable can appear on both sides of `=`. Python works out the right side first, using the old value, then stores the answer back.",
        "Adding the river logs is `wood = wood + 6`. Taking away works the same way with `-`. The shortcuts `+=` and `-=` do the same job.",
        "Under the first comment write `wood = wood + 6`, and under the second `wood = wood - 8`.",
      ],
      solution: r`wood = 10
wood = wood + 6
wood -= 8
print("Wood left:", wood)`,
      wrong: [r`wood = 10
wood = 8
print("Wood left:", wood)`, r`wood = 10
wood + 6
wood - 8
print("Wood left:", wood)`, r`wood = 10
wood = wood + 6
print("Wood left:", wood)`],
      done: "Four tall posts! It's starting to look like something. Pip approves.",
    },
    {
      id: "t05-framing",
      part: "Wall frame",
      title: "Framing the Walls",
      cost: { wood: 5, stone: 0 },
      intro: [
        "Now the beams between the posts. 4 walls, 7 beams each, and the cart carries 5 beams per trip.",
        "Python does maths for us: `*` multiplies, `//` counts whole groups, and `%` gives what's left over.",
      ],
      codex: ["math"],
      quiz: {
        code: r`print(7 / 2)`,
        question: "What does this program show?",
        options: ["3.5", "3", "4", "3.0"],
        answer: 0,
        why: "A single / always gives a decimal answer. Use // when you want only the whole part (3).",
      },
      task: [
        "`total_beams`: how many beams all the walls need together.",
        "`carts`: how many **full** cart trips that many beams makes.",
        "`leftover`: how many beams are left over after those full trips.",
        "Work each one out from the variables at the top, not by typing the numbers.",
      ],
      starter: r`walls = 4
beams_per_wall = 7
beams_per_cart = 5

# 1. total_beams =
# 2. carts =
# 3. leftover =

print("Total beams:", total_beams)
print("Full carts:", carts)
print("Leftover beams:", leftover)
`,
      tests: PRE + r`for name in ["total_beams", "carts", "leftover"]:
    check(name in ns, "Create the variable " + name + " before the print lines use it.")
check(ns["total_beams"] == 28, "4 walls with 7 beams each need 28 beams, but total_beams is " + repr(ns["total_beams"]) + ". Which operator multiplies?")
check(ns["carts"] != 5.6, "carts is 5.6, but a cart can't make 0.6 of a trip. A single / gives decimals; the Codex shows a division that keeps only the whole groups.")
check(ns["carts"] == 5, "28 beams in carts of 5 makes 5 full trips, but carts is " + repr(ns["carts"]) + ". Divide total_beams by beams_per_cart, keeping only whole trips.")
check(ns["leftover"] == 3, "After 5 full trips of 5 beams, 3 beams are left, but leftover is " + repr(ns["leftover"]) + ". One operator gives just the remainder of a division.")
check("walls = 4" in src, "Keep the line walls = 4 as it was.")
variant, vlines = again("walls = 4", "walls = 5")
check(variant.get("total_beams") == 35 and variant.get("carts") == 7 and variant.get("leftover") == 0, "With 5 walls you should get 35 beams, 7 carts and 0 left over. Use the variables (walls, beams_per_wall, beams_per_cart) instead of typing the numbers.")
expect_lines(["Total beams: 28", "Full carts: 5", "Leftover beams: 3"])`,
      hints: [
        "Do it on paper first: 4 walls of 7 beams is 28 beams. How many full carts of 5 is that, and how many beams are left? Now say the same steps with the variable names.",
        "`*` multiplies. `//` counts the whole groups and throws the rest away, and `%` gives only the rest. Both divide `total_beams` by `beams_per_cart`.",
        "`total_beams = walls * beams_per_wall`, `carts = total_beams // beams_per_cart`, `leftover = total_beams % beams_per_cart`.",
      ],
      solution: r`walls = 4
beams_per_wall = 7
beams_per_cart = 5
total_beams = walls * beams_per_wall
carts = total_beams // beams_per_cart
leftover = total_beams % beams_per_cart
print("Total beams:", total_beams)
print("Full carts:", carts)
print("Leftover beams:", leftover)`,
      wrong: [r`walls = 4
beams_per_wall = 7
beams_per_cart = 5
total_beams = 28
carts = 5
leftover = 3
print("Total beams:", total_beams)
print("Full carts:", carts)
print("Leftover beams:", leftover)`, r`walls = 4
beams_per_wall = 7
beams_per_cart = 5
total_beams = walls * beams_per_wall
carts = total_beams / beams_per_cart
leftover = total_beams % beams_per_cart
print("Total beams:", total_beams)
print("Full carts:", carts)
print("Leftover beams:", leftover)`, r`walls = 4
beams_per_wall = 7
beams_per_cart = 5
total_beams = walls * beams_per_wall
carts = total_beams // beams_per_cart
leftover = total_beams - carts
print("Total beams:", total_beams)
print("Full carts:", carts)
print("Leftover beams:", leftover)`],
      done: "A proper frame! You can see the shape of every room now.",
    },
    {
      id: "t06-walls",
      part: "Plaster walls",
      title: "Putting Up Walls",
      cost: { wood: 3, stone: 3 },
      intro: [
        "While the plaster dries, let's settle the name. I've been calling it \"The Sleepy Serpent\". For no reason. Ahem.",
        "You can glue strings together with `+`. But Python never adds spaces for you, so you add them yourself.",
      ],
      codex: ["concat", "strings"],
      quiz: {
        code: r`print("Wood" + "fire")`,
        question: "What does this program show?",
        options: ["Woodfire", "Wood fire", "Wood+fire", "TypeError"],
        answer: 0,
        why: "+ glues the two strings exactly as they are, with no space in between.",
      },
      task: [
        "Make `tavern_name` hold `The Sleepy Serpent`.",
        "Build it with `+`, using the variables `first` and `second` (don't type Sleepy or Serpent again).",
      ],
      starter: r`first = "Sleepy"
second = "Serpent"
# tavern_name =

print(tavern_name)
`,
      tests: r`check("tavern_name" in ns, "Create the variable tavern_name.")
check(isinstance(ns["tavern_name"], str), "tavern_name should be a string.")
check(ns["tavern_name"].replace(" ", "") == "TheSleepySerpent", "tavern_name should be \"The Sleepy Serpent\" but it is " + repr(ns["tavern_name"]) + ". Check the words, their order and their capitals.")
check(ns["tavern_name"] == "The Sleepy Serpent", "Nearly! tavern_name is " + repr(ns["tavern_name"]) + ". The words are right, but + never adds spaces, so each space has to be glued in by you, inside quotes.")
check(src.count("Sleepy") == 1 and src.count("Serpent") == 1, "Use the variables first and second instead of typing Sleepy and Serpent again.")
check("+" in src, "Join the pieces with +.")
expect_lines(["The Sleepy Serpent"])`,
      hints: [
        "List the pieces in order: `The`, a space, `Sleepy`, a space, `Serpent`. Which pieces are already in variables, and which must you type yourself in quotes?",
        "`\"The \" + first` gives `The Sleepy`. The space lives inside the quotes after The. Between first and second you need one more: a string that is just a space, `\" \"`.",
        "`tavern_name = \"The \" + first + \" \" + second`",
      ],
      solution: r`first = "Sleepy"
second = "Serpent"
tavern_name = "The " + first + " " + second
print(tavern_name)`,
      wrong: [r`first = "Sleepy"
second = "Serpent"
tavern_name = "The" + first + second
print(tavern_name)`, r`first = "Sleepy"
second = "Serpent"
tavern_name = "The Sleepy Serpent"
print(tavern_name)`, r`first = "Sleepy"
second = "Serpent"
tavern_name = "The " + first + second
print(tavern_name)`],
      done: "Walls up and a name to be proud of. The Sleepy Serpent! Not that I'm biased.",
    },
    {
      id: "t07-door",
      part: "Front door",
      title: "Hanging the Door",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Every good door has a plaque. Ours should say who built this place: you!",
        "**f-strings** make this easy: put an `f` before the quotes, and anything in `{curly braces}` is filled in.",
      ],
      codex: ["fstrings"],
      quiz: {
        code: r`pip = "Pip"
print(f"Hi {pip}!")`,
        question: "What does this program show?",
        options: ["Hi Pip!", "Hi {pip}!", "Hi pip!", "f\"Hi Pip!\""],
        answer: 0,
        why: "Inside an f-string, {pip} is replaced by the value of the variable pip.",
      },
      task: [
        "Put your own name in `founder`.",
        "Using f-strings, print the plaque's two lines:",
        "`Welcome to The Sleepy Serpent!`",
        "`Founded in year 1 by <your name>.`",
      ],
      starter: r`name = "The Sleepy Serpent"
year = 1
founder = "your name here"   # put your own name in the quotes!

# Print the two plaque lines with f-strings:
`,
      tests: PRE + r`check(isinstance(ns.get("founder"), str) and ns["founder"].strip() != "", "founder should hold your name as a string.")
check(ns["founder"] != "your name here", "Put your own name inside the quotes on the founder line.")
check("f\"" in src or "f'" in src, "Use an f-string: put an f right before the opening quote, so the {braces} inside get filled in.")
check("{" not in out, "Your plaque shows curly braces. The braces only get filled in when there is an f right before the opening quote.")
check("Welcome to The Sleepy Serpent" not in src, "Use the name variable inside the f-string instead of typing the tavern name again.")
expect_lines(["Welcome to " + ns["name"] + "!", "Founded in year " + str(ns["year"]) + " by " + ns["founder"] + "."])
check("year = 1" in src, "Keep the line year = 1 as it was.")
variant, vlines = again("year = 1", "year = 2")
check(len(vlines) == 2 and "year 2 " in vlines[1], "If year were 2, the plaque should say year 2. Put the year variable in braces instead of typing 1.")`,
      hints: [
        "Look at the starter: the tavern name, the year and your name are already stored in variables. In an f-string, those parts go in `{braces}` and everything else is typed as plain text.",
        "An f-string has an `f` right before the opening quote: `f\"Welcome to {name}!\"`. The second line needs two sets of braces, and it ends with a full stop.",
        "`print(f\"Welcome to {name}!\")` and `print(f\"Founded in year {year} by {founder}.\")`",
      ],
      solution: r`name = "The Sleepy Serpent"
year = 1
founder = "Robin"
print(f"Welcome to {name}!")
print(f"Founded in year {year} by {founder}.")`,
      wrong: [r`name = "The Sleepy Serpent"
year = 1
founder = "Robin"
print("Welcome to {name}!")
print("Founded in year {year} by {founder}.")`, r`name = "The Sleepy Serpent"
year = 1
founder = "your name here"
print(f"Welcome to {name}!")
print(f"Founded in year {year} by {founder}.")`, r`name = "The Sleepy Serpent"
year = 1
founder = "Robin"
print(f"Welcome to {name}!")
print(f"Founded in year 1 by {founder}.")`],
      done: "A fine green door, with your name on it. Knock knock!",
    },
    {
      id: "t08-windows",
      part: "Windows",
      title: "Glazing the Windows",
      cost: { wood: 2, stone: 2 },
      intro: [
        "The glassblower sent her order as a note, so the numbers arrived as **text**. \"6\" + \"4\" would give \"64\" panes. Oops.",
        "`int()` turns text into a whole number, and `str()` turns a number back into text.",
      ],
      codex: ["types", "concat"],
      quiz: {
        code: r`print("3" + "4")`,
        question: "What does this program show?",
        options: ["34", "7", "3 + 4", "TypeError"],
        answer: 0,
        why: "\"3\" and \"4\" are strings, so + glues them together instead of adding.",
      },
      task: [
        "`total_panes`: the **number** 10, made by converting both notes with `int()` and adding.",
        "Print `Windows need 10 panes`, built with `+` and `str()`.",
      ],
      starter: r`front_panes = "6"
side_panes = "4"
# These came from a note, so they are strings!

# total_panes =

# Print: Windows need 10 panes
`,
      tests: PRE + r`check("total_panes" in ns, "Create the variable total_panes.")
check(ns["total_panes"] != "64", "total_panes is \"64\": the strings were glued, not added. Convert each one with int() first.")
check(isinstance(ns["total_panes"], int) and not isinstance(ns["total_panes"], bool), "total_panes should be a number (an int), but it is " + repr(ns["total_panes"]) + ".")
check(ns["total_panes"] == 10, "total_panes should be 10, but it is " + repr(ns["total_panes"]) + ".")
check("int(" in src, "Convert the notes with int().")
check("str(" in src, "Turn total_panes back into text with str() so you can glue it with +.")
variant, vlines = again("front_panes = \"6\"", "front_panes = \"9\"")
check(variant.get("total_panes") == 13, "If the note said 9 front panes, total_panes should be 13. Convert the variables instead of typing 10.")
expect_lines(["Windows need 10 panes"])
check(vlines == ["Windows need 13 panes"], "If the note said 9 front panes, the line should say 13. Glue total_panes into the sentence instead of typing 10.")`,
      hints: [
        "Right now `front_panes + side_panes` would glue two pieces of text into `\"64\"`. Each note has to become a real number before you add.",
        "`int(front_panes)` gives the number 6. To glue a number into a sentence with `+`, turn it back into text with `str()`. Watch the spaces around the number.",
        "`total_panes = int(front_panes) + int(side_panes)` then `print(\"Windows need \" + str(total_panes) + \" panes\")`",
      ],
      solution: r`front_panes = "6"
side_panes = "4"
total_panes = int(front_panes) + int(side_panes)
print("Windows need " + str(total_panes) + " panes")`,
      wrong: [r`front_panes = "6"
side_panes = "4"
total_panes = front_panes + side_panes
print("Windows need " + total_panes + " panes")`, r`front_panes = "6"
side_panes = "4"
total_panes = 10
print("Windows need " + str(total_panes) + " panes")`, r`front_panes = "6"
side_panes = "4"
total_panes = int(front_panes) + int(side_panes)
print("Windows need " + str(10) + " panes")`],
      done: "Sunlight pouring in! And the flower box is a nice touch, if I say so myself.",
    },
    {
      id: "t09-roof",
      part: "Thatched roof",
      title: "Thatching the Roof",
      cost: { wood: 4, stone: 0 },
      intro: [
        "The roofers want to paint our motto along the beam, but the note they got is a mess: extra spaces and a spelling mistake.",
        "Strings have **methods**, little tools you call with a dot: `.strip()`, `.replace()`, `.title()`, `.upper()`.",
      ],
      codex: ["string-methods"],
      quiz: {
        code: r`word = "stew"
word.upper()
print(word)`,
        question: "What does this program show?",
        options: ["stew", "STEW", "Stew", "AttributeError"],
        answer: 0,
        why: "Methods return a NEW string. word.upper() made \"STEW\" but nothing saved it, so word is still \"stew\".",
      },
      task: [
        "`clean`: `messy` without the extra spaces at both ends.",
        "`fixed`: `clean` with the misspelt word mended. (Read the motto closely: one word is spelt wrong.)",
        "Print `fixed` in Title Case (a capital at the start of every word), then in ALL CAPS.",
        "Let the methods do the work. Don't type the motto out again.",
      ],
      starter: r`messy = "   the sleepy serpent - finest stew in the vallee   "

# clean =
# fixed =

# Print fixed in Title Case, then in ALL CAPS:
`,
      tests: PRE + r`check("clean" in ns, "Make a variable called clean: messy, tidied at both ends.")
check("messy = \"   the sleepy serpent - finest stew in the vallee   \"" in src, "Keep the messy line exactly as it was in the starter.")
check(ns["clean"] != ns["messy"], "clean is exactly the same as messy, spaces and all. There's a method that trims spaces off both ends. Did you save its result in clean?")
check(ns["clean"] == "the sleepy serpent - finest stew in the vallee", "clean should be messy with only the outside spaces removed, but it is " + repr(ns["clean"]) + ".")
check("fixed" in ns, "Make a variable called fixed: clean, with the spelling mended.")
check("vallee" not in ns["fixed"], "fixed still says \"vallee\". That's the misspelt word. A method can swap one piece of text for another, and like every string method it gives back a NEW string. Save that result in fixed.")
check(ns["fixed"] == "the sleepy serpent - finest stew in the valley", "fixed should be clean with just that one word mended, but it is " + repr(ns["fixed"]) + ".")
check(".title()" in src and ".upper()" in src, "Use the .title() and .upper() methods to print the two versions.")
expect_lines(["The Sleepy Serpent - Finest Stew In The Valley", "THE SLEEPY SERPENT - FINEST STEW IN THE VALLEY"])
variant, vlines = again("\"   the sleepy serpent - finest stew in the vallee   \"", "\"  warm bread all over the vallee \"")
check(vlines == ["Warm Bread All Over The Valley", "WARM BREAD ALL OVER THE VALLEY"], "If the note said \"  warm bread all over the vallee \", your program should print that motto, mended. Build both lines from fixed instead of typing the motto.")`,
      hints: [
        "Three jobs, one method each: trim the ends, swap the wrong word for the right one, then change the capitals. The String methods page has a method for every job.",
        "`.strip()` trims the ends. `.replace(old, new)` swaps text: the wrong word is `vallee`. Each method gives back a **new** string, so save it: `clean = messy.strip()`.",
        "`fixed = clean.replace(\"vallee\", \"valley\")`, then `print(fixed.title())` and `print(fixed.upper())`.",
      ],
      solution: r`messy = "   the sleepy serpent - finest stew in the vallee   "
clean = messy.strip()
fixed = clean.replace("vallee", "valley")
print(fixed.title())
print(fixed.upper())`,
      wrong: [r`messy = "   the sleepy serpent - finest stew in the vallee   "
clean = messy.strip()
fixed = clean
print(fixed.title())
print(fixed.upper())`, r`messy = "   the sleepy serpent - finest stew in the vallee   "
clean = messy
fixed = clean.replace("vallee", "valley")
print(fixed.title())
print(fixed.upper())`, r`messy = "   the sleepy serpent - finest stew in the vallee   "
clean = messy.strip()
fixed = clean.replace("vallee", "valley")
x = fixed.title() + fixed.upper()
print("The Sleepy Serpent - Finest Stew In The Valley")
print("THE SLEEPY SERPENT - FINEST STEW IN THE VALLEY")`, r`messy = "   the sleepy serpent - finest stew in the vallee   "
clean = messy.strip()
clean.replace("vallee", "valley")
fixed = clean
print(fixed.title())
print(fixed.upper())`],
      done: "A roof over our heads! Rain, do your worst.",
    },
    {
      id: "t10-chimney",
      part: "Stone chimney",
      title: "Stacking the Chimney",
      cost: { wood: 0, stone: 6 },
      intro: [
        "A tavern needs a chimney for the stew pot. The mason wrote the brick order as one long string of letters.",
        "`len()` counts characters, `[0]` grabs the first, `[-1]` the last, and `[0:3]` slices off a piece.",
      ],
      codex: ["indexing"],
      quiz: {
        code: r`print("Pip"[1])`,
        question: "What does this program show?",
        options: ["i", "P", "p", "Pi"],
        answer: 0,
        why: "Counting starts at 0: \"Pip\"[0] is P, so [1] is i.",
      },
      task: [
        "`count`: how many bricks there are.",
        "`first`: the first brick.",
        "`cap`: the **last** brick, found without counting how long the string is.",
        "`bottom_three`: the first three bricks, as one piece of text.",
        "Every answer must still be right if the mason sends a different brick order.",
      ],
      starter: r`bricks = "RRGRRGRRGRRB"   # R = red, G = grey, B = black cap

# count =
# first =
# cap =
# bottom_three =

print(count, first, cap, bottom_three)
`,
      tests: PRE + r`for name in ["count", "first", "cap", "bottom_three"]:
    check(name in ns, "Create the variable " + name + " before the print line.")
check(ns["count"] == 12, "There are 12 bricks (one per letter), but count is " + repr(ns["count"]) + ".")
check(ns["first"] == "R", "first should be the first letter, \"R\", but it is " + repr(ns["first"]) + ".")
check(ns["cap"] == "B", "cap should be the last letter, \"B\", but it is " + repr(ns["cap"]) + ". Negative positions count from the end.")
check(ns["bottom_three"] == "RRG", "bottom_three should be the first three letters, \"RRG\", but it is " + repr(ns["bottom_three"]) + ". Remember a slice stops just BEFORE its second number.")
variant, vlines = again("bricks = \"RRGRRGRRGRRB\"", "bricks = \"GRRBGB\"")
check(variant.get("count") == 6, "If the bricks change, count should change too. Use len(bricks) instead of typing 12.")
check(variant.get("first") == "G", "If the bricks were \"GRRBGB\", first should be \"G\", not " + repr(variant.get("first")) + ". Which number is the very first position?")
check(variant.get("cap") == "B" and again("bricks = \"RRGRRGRRGRRB\"", "bricks = \"BRRG\"")[0].get("cap") == "G", "If the bricks change, cap should still be the last one. Take it from bricks instead of typing \"B\".")
check(variant.get("bottom_three") == "GRR", "If the bricks were \"GRRBGB\", bottom_three should be \"GRR\". Slice it from bricks instead of typing the letters.")
expect_lines(["12 R B RRG"])`,
      hints: [
        "Every brick is one letter. Python numbers the positions from **0**, not 1, and it can also count backwards from the end.",
        "`len()` counts letters. Square brackets pick a position: `bricks[0]` is the first, and `[-1]` is the last. A slice `[start:stop]` stops just before `stop`.",
        "`count = len(bricks)`, `first = bricks[0]`, `cap = bricks[-1]`, `bottom_three = bricks[:3]`",
      ],
      solution: r`bricks = "RRGRRGRRGRRB"
count = len(bricks)
first = bricks[0]
cap = bricks[-1]
bottom_three = bricks[:3]
print(count, first, cap, bottom_three)`,
      wrong: [r`bricks = "RRGRRGRRGRRB"
count = 12
first = "R"
cap = "B"
bottom_three = "RRG"
print(count, first, cap, bottom_three)`, r`bricks = "RRGRRGRRGRRB"
count = len(bricks)
first = bricks[1]
cap = bricks[-1]
bottom_three = bricks[:3]
print(count, first, cap, bottom_three)`, r`bricks = "RRGRRGRRGRRB"
count = len(bricks)
first = bricks[0]
cap = bricks[-1]
bottom_three = bricks[1:3]
print(count, first, cap, bottom_three)`, r`bricks = "RRGRRGRRGRRB"
count = len(bricks)
first = bricks[0]
cap = bricks[11]
bottom_three = bricks[:3]
print(count, first, cap, bottom_three)`, r`bricks = "RRGRRGRRGRRB"
count = len(bricks)
first = bricks[0]
cap = "B"
bottom_three = bricks[:3]
print(count, first, cap, bottom_three)`],
      done: "Smoke will curl out of that chimney soon. I can almost smell the stew.",
    },
    {
      id: "t11-lanterns",
      part: "Lanterns",
      title: "Lighting the Lanterns",
      cost: { wood: 2, stone: 2 },
      intro: [
        "Night falls fast in the valley. The lanterns should light only if it's dark **and** we have enough oil.",
        "Each lantern burns one measure of oil. A comparison like `oil > 0` answers with `True` or `False`, and `and` joins two answers.",
      ],
      codex: ["booleans"],
      quiz: {
        code: r`print(10 >= 10)`,
        question: "What does this program show?",
        options: ["True", "False", "10", "SyntaxError"],
        answer: 0,
        why: ">= means \"greater than OR equal to\", and 10 is equal to 10.",
      },
      task: [
        "`enough_oil`: True when there is at least one measure of oil for every lantern. Work it out with a comparison, not by typing True.",
        "`light_them`: True only if there is enough oil **and** it is night.",
        "Print `Enough oil: True` and `Light them: True`, using the variables so the words change when the oil runs out.",
      ],
      starter: r`oil = 7
lanterns = 6
is_night = True

# enough_oil =
# light_them =

`,
      tests: PRE + r`check("enough_oil" in ns, "Make a variable called enough_oil.")
check(ns["enough_oil"] is True, "With 7 oil and 6 lanterns there's enough, so enough_oil should be True, but it is " + repr(ns["enough_oil"]) + ". Compare oil with lanterns.")
check("light_them" in ns, "Make a variable called light_them.")
check(ns["light_them"] is True, "There's enough oil and it is night, so light_them should be True, but it is " + repr(ns["light_them"]) + ".")
for line in ["oil = 7", "lanterns = 6", "is_night = True"]:
    check(line in src, "Keep the line " + line + " as it was.")
v1, l1 = again("oil = 7", "oil = 3")
check(v1.get("enough_oil") is False, "If oil were 3, enough_oil should be False. Compare oil with lanterns instead of typing True.")
check(v1.get("light_them") is False, "If oil were 3, light_them should be False: no oil, no light, even at night.")
check(again("oil = 7", "oil = 6")[0].get("enough_oil") is True, "With exactly 6 oil for 6 lanterns there's just enough, so enough_oil should be True. \"At least\" includes equal.")
v2, l2 = again("is_night = True", "is_night = False")
check(v2.get("light_them") is False, "In daytime (is_night = False), light_them should be False. Both things have to be true at once.")
expect_lines(["Enough oil: True", "Light them: True"])
check(l1 == ["Enough oil: False", "Light them: False"], "Print the variables, not the words True, so the lines change when the oil runs out.")`,
      hints: [
        "A comparison is a True/False value you can store: `x = a > b`. \"At least one measure for every lantern\" means oil is greater than **or equal to** lanterns.",
        "`enough_oil = oil >= lanterns`. `and` gives True only when both of its sides are True, so join `enough_oil` and `is_night` with it.",
        "`light_them = enough_oil and is_night`, then `print(\"Enough oil:\", enough_oil)` and `print(\"Light them:\", light_them)`.",
      ],
      solution: r`oil = 7
lanterns = 6
is_night = True
enough_oil = oil >= lanterns
light_them = enough_oil and is_night
print("Enough oil:", enough_oil)
print("Light them:", light_them)`,
      wrong: [r`oil = 7
lanterns = 6
is_night = True
enough_oil = True
light_them = True
print("Enough oil:", enough_oil)
print("Light them:", light_them)`, r`oil = 7
lanterns = 6
is_night = True
enough_oil = oil >= lanterns
light_them = enough_oil or is_night
print("Enough oil:", enough_oil)
print("Light them:", light_them)`, r`oil = 7
lanterns = 6
is_night = True
enough_oil = oil >= lanterns
light_them = enough_oil and is_night
print("Enough oil: True")
print("Light them: True")`, r`oil = 7
lanterns = 6
is_night = True
enough_oil = oil > lanterns
light_them = enough_oil and is_night
print("Enough oil:", enough_oil)
print("Light them:", light_them)`],
      done: "Ohhh, look at them glow. Travellers will see us from the hills!",
    },
    {
      id: "t12-grand-opening",
      part: "Sign and grand opening",
      title: "The Grand Opening",
      cost: { wood: 4, stone: 2 },
      intro: [
        "Everything's ready. A traveller named **Bram** says he'll run the tavern if we can show him a proper menu board.",
        "This one uses everything you've learned. Take it step by step, and peek at the Codex whenever you need it.",
      ],
      codex: ["fstrings", "math", "string-methods", "booleans"],
      quiz: {
        code: r`print(f"{2 + 3} coins")`,
        question: "What does this program show?",
        options: ["5 coins", "2 + 3 coins", "{2 + 3} coins", "23 coins"],
        answer: 0,
        why: "Anything inside the braces of an f-string is worked out first, so 2 + 3 becomes 5.",
      },
      task: [
        "Print the tavern name in Title Case.",
        "`dinner`: the price of one stew plus one bread.",
        "`takings`: dinner for every guest.",
        "Print `Dinner: 6 coins` and `Tonight's takings: 54 coins`.",
        "Print `Full house: True`, which is True when there are 8 or more guests.",
      ],
      starter: r`stew_price = 4
bread_price = 2
guests = 9
tavern = "the sleepy serpent"

`,
      tests: PRE + r`check("dinner" in ns, "Make a variable called dinner: what one stew and one bread cost together.")
check(ns["dinner"] == 6, "One stew (4) and one bread (2) cost 6, but dinner is " + repr(ns["dinner"]) + ".")
check("takings" in ns, "Make a variable called takings: what all tonight's guests pay.")
check(ns["takings"] == 54, "9 guests each buying a 6-coin dinner pay 54, but takings is " + repr(ns["takings"]) + ".")
for line in ["stew_price = 4", "guests = 9"]:
    check(line in src, "Keep the line " + line + " as it was.")
expect_lines(["The Sleepy Serpent", "Dinner: 6 coins", "Tonight's takings: 54 coins", "Full house: True"])
v1, l1 = again("guests = 9", "guests = 5")
check(l1[2:] == ["Tonight's takings: 30 coins", "Full house: False"], "With 5 guests your board should say 30 coins and Full house: False. Work the numbers out from the variables.")
v2, l2 = again("stew_price = 4", "stew_price = 5")
check(l2[1:3] == ["Dinner: 7 coins", "Tonight's takings: 63 coins"], "If stew cost 5, dinner should be 7 and takings 63. Use the price variables.")
v3, l3 = again("guests = 9", "guests = 8")
check(l3[3:] == ["Full house: True"], "Exactly 8 guests is a full house too: \"8 or more\" includes 8.")`,
      hints: [
        "Go down the task one line at a time. For each number on the board, ask: which variables is it made from, and with which operator?",
        "`tavern` has a method that capitalises every word. `dinner` adds the two prices; `takings` multiplies. f-strings drop numbers into text, like `f\"Dinner: {dinner} coins\"`. The apostrophe in Tonight's means double quotes.",
        "`print(tavern.title())`, `dinner = stew_price + bread_price`, `takings = dinner * guests`, and the last line puts a comparison in the braces: `print(f\"Full house: {guests >= 8}\")`.",
      ],
      solution: r`stew_price = 4
bread_price = 2
guests = 9
tavern = "the sleepy serpent"
print(tavern.title())
dinner = stew_price + bread_price
takings = dinner * guests
print(f"Dinner: {dinner} coins")
print(f"Tonight's takings: {takings} coins")
print(f"Full house: {guests >= 8}")`,
      wrong: [r`stew_price = 4
bread_price = 2
guests = 9
tavern = "the sleepy serpent"
print(tavern.title())
dinner = 6
takings = 54
print(f"Dinner: {dinner} coins")
print(f"Tonight's takings: {takings} coins")
print("Full house: True")`, r`stew_price = 4
bread_price = 2
guests = 9
tavern = "the sleepy serpent"
print(tavern)
dinner = stew_price + bread_price
takings = dinner * guests
print(f"Dinner: {dinner} coins")
print(f"Tonight's takings: {takings} coins")
print(f"Full house: {guests >= 8}")`, r`stew_price = 4
bread_price = 2
guests = 9
tavern = "the sleepy serpent"
print(tavern.title())
dinner = stew_price + bread_price
takings = dinner * guests
print(f"Dinner: {dinner} coins")
print(f"Tonight's takings: {takings} coins")
print(f"Full house: {guests > 8}")`],
      done: "The Sleepy Serpent is OPEN! Bram is already polishing mugs. You did it, founder. This valley is becoming a village.",
    },
  ],
};
