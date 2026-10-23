import type { Building } from "./types.ts";

// The Sleepy Serpent: the first building. Each challenge adds one stage of the
// tavern model (ART.md, stage_01 … stage_12). Checks are Python run after the
// learner's program; see python/helper.ts _pg_grade for what they can use.
const r = String.raw;

export const TAVERN: Building = {
  id: "tavern",
  name: "The Sleepy Serpent",
  blurb: "Every valley needs a warm hearth, a hot stew and a place to tell stories.",
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
        "You need three separate `print()` lines.",
        "The last line has an apostrophe. Wrap that text in double quotes so the apostrophe doesn't end the string.",
        "The last line is: `print(\"Pip's stone: set.\")`",
      ],
      solution: r`print("Stone one: set.")
print("Stone two: set.")
print("Pip's stone: set.")`,
      wrong: [r`print("Stone one: set.")
print("Stone two: set.")`, r`print("Stone one: set.", "Stone two: set.", "Pip's stone: set.")`, r`print("Stone one: set.")
print("Stone two: set.")
print("Pips stone: set.")`],
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
        "Print `Planks: 24` and then `Nails: 60` using the variables (try `print(\"Planks:\", planks)`).",
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
        "A variable is made like this: `name = value`.",
        "`print(\"Planks:\", planks)` prints the text, a space, then the value in planks.",
        "Write `planks = 24` and `nails = 60`, then `print(\"Planks:\", planks)` and `print(\"Nails:\", nails)`.",
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
        "Variables can change! `wood = wood + 6` means: take the old wood, add 6, and store the result back in wood.",
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
      tests: r`check("wood = 10" in src, "Keep the first line exactly as it was: wood = 10")
check(ns.get("wood") == 8, "wood should end up as 8 (10 + 6 - 8), but it is " + repr(ns.get("wood")) + ".")
variant, vlines = rerun(src.replace("wood = 10", "wood = 20", 1))
check(variant.get("wood") == 18, "If wood started at 20 your program should finish with 18. Change wood with + and -, instead of typing the final number.")
expect_lines(["Wood left: 8"])`,
      hints: [
        "To add to a variable, use it on both sides: `wood = wood + 6`.",
        "Taking away works the same way with `-`. Or use the shortcuts `wood += 6` and `wood -= 8`.",
        "Under the comments write `wood = wood + 6` and `wood = wood - 8`.",
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
        "`total_beams`: beams for all the walls (walls × beams per wall).",
        "`carts`: how many **full** cart trips that is (use `//`).",
        "`leftover`: beams left after the full trips (use `%`).",
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
      tests: r`for name in ["total_beams", "carts", "leftover"]:
    check(name in ns, "Create the variable " + name + " before the print lines use it.")
check(ns["total_beams"] == 28, "total_beams should be walls * beams_per_wall = 28, not " + repr(ns["total_beams"]) + ".")
check(ns["carts"] == 5, "carts should be total_beams // beams_per_cart = 5, not " + repr(ns["carts"]) + ".")
check(ns["leftover"] == 3, "leftover should be total_beams % beams_per_cart = 3, not " + repr(ns["leftover"]) + ".")
check("walls = 4" in src, "Keep the line walls = 4 as it was.")
variant, vlines = rerun(src.replace("walls = 4", "walls = 5", 1))
check(variant.get("total_beams") == 35 and variant.get("carts") == 7 and variant.get("leftover") == 0, "With 5 walls you should get 35 beams, 7 carts and 0 left over. Use the variables (walls, beams_per_wall, beams_per_cart) instead of typing the numbers.")
expect_lines(["Total beams: 28", "Full carts: 5", "Leftover beams: 3"])`,
      hints: [
        "Multiply the two variables: `walls * beams_per_wall`.",
        "`carts` uses `//` and `leftover` uses `%`, both on `total_beams` and `beams_per_cart`.",
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
check(ns["tavern_name"] == "The Sleepy Serpent", "tavern_name should be exactly \"The Sleepy Serpent\" but it is " + repr(ns["tavern_name"]) + ". Check the spaces: \"The \" + first + \" \" + second.")
check(src.count("Sleepy") == 1 and src.count("Serpent") == 1, "Use the variables first and second instead of typing Sleepy and Serpent again.")
check("+" in src, "Join the pieces with +.")
expect_lines(["The Sleepy Serpent"])`,
      hints: [
        "`\"The \" + first` gives \"The Sleepy\". Notice the space inside the quotes.",
        "You also need a space between first and second: `\" \"`.",
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
      tests: r`check(isinstance(ns.get("founder"), str) and ns["founder"].strip() != "", "founder should hold your name as a string.")
check(ns["founder"] != "your name here", "Put your own name inside the quotes on the founder line.")
check("f\"" in src or "f'" in src, "Use an f-string: put f right before the opening quote, like f\"Welcome to {name}!\"")
check("Welcome to The Sleepy Serpent" not in src, "Use {name} inside the f-string instead of typing the tavern name again.")
expect_lines(["Welcome to " + ns["name"] + "!", "Founded in year " + str(ns["year"]) + " by " + ns["founder"] + "."])`,
      hints: [
        "An f-string looks like `f\"Welcome to {name}!\"`.",
        "The second line needs two variables: `{year}` and `{founder}`. Don't forget the full stop at the end.",
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
print(f"Founded in year {year} by {founder}.")`],
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
      tests: r`check("total_panes" in ns, "Create the variable total_panes.")
check(ns["total_panes"] != "64", "total_panes is \"64\": the strings were glued, not added. Convert each one with int() first.")
check(isinstance(ns["total_panes"], int) and not isinstance(ns["total_panes"], bool), "total_panes should be a number (an int), but it is " + repr(ns["total_panes"]) + ".")
check(ns["total_panes"] == 10, "total_panes should be 10, but it is " + repr(ns["total_panes"]) + ".")
check("int(" in src, "Convert the notes with int().")
check("str(" in src, "Turn total_panes back into text with str() so you can glue it with +.")
variant, vlines = rerun(src.replace("front_panes = \"6\"", "front_panes = \"9\"", 1))
check(variant.get("total_panes") == 13, "If the note said 9 front panes, total_panes should be 13. Convert the variables instead of typing 10.")
expect_lines(["Windows need 10 panes"])`,
      hints: [
        "`int(front_panes)` gives the number 6.",
        "Add the two converted numbers. To print, glue `\"Windows need \"`, `str(total_panes)` and `\" panes\"`.",
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
print("Windows need " + str(total_panes) + " panes")`],
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
        "`clean`: `messy` without the spaces at both ends (`.strip()`).",
        "`fixed`: `clean` with `vallee` replaced by `valley`.",
        "Print `fixed` in Title Case, then in ALL CAPS.",
      ],
      starter: r`messy = "   the sleepy serpent - finest stew in the vallee   "

# clean =
# fixed =

# Print fixed in Title Case, then in ALL CAPS:
`,
      tests: r`check(ns.get("clean") == "the sleepy serpent - finest stew in the vallee", "clean should be messy with the outside spaces removed: messy.strip()")
check(ns.get("fixed") == "the sleepy serpent - finest stew in the valley", "fixed should be clean with \"vallee\" replaced by \"valley\": clean.replace(\"vallee\", \"valley\")")
check(".title()" in src and ".upper()" in src, "Use the .title() and .upper() methods to print the two versions.")
expect_lines(["The Sleepy Serpent - Finest Stew In The Valley", "THE SLEEPY SERPENT - FINEST STEW IN THE VALLEY"])`,
      hints: [
        "`clean = messy.strip()`",
        "`.replace(\"vallee\", \"valley\")` swaps the misspelt word. Call it on `clean`.",
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
        "`count`: how many bricks there are (`len`).",
        "`first`: the first brick.",
        "`cap`: the **last** brick (use a negative index).",
        "`bottom_three`: the first three bricks (a slice).",
      ],
      starter: r`bricks = "RRGRRGRRGRRB"   # R = red, G = grey, B = black cap

# count =
# first =
# cap =
# bottom_three =

print(count, first, cap, bottom_three)
`,
      tests: r`for name in ["count", "first", "cap", "bottom_three"]:
    check(name in ns, "Create the variable " + name + " before the print line.")
check(ns["count"] == 12, "count should be len(bricks), which is 12, not " + repr(ns["count"]) + ".")
check(ns["first"] == "R", "first should be bricks[0], the first letter.")
check(ns["cap"] == "B", "cap should be the last letter, bricks[-1].")
check(ns["bottom_three"] == "RRG", "bottom_three should be the first three letters, bricks[:3].")
check("bricks = \"RRGRRGRRGRRB\"" in src, "Keep the bricks line exactly as it was.")
variant, vlines = rerun(src.replace("\"RRGRRGRRGRRB\"", "\"GRRBGB\"", 1))
check(variant.get("count") == 6, "If the bricks change, count should change too. Use len(bricks) instead of typing 12.")
check(variant.get("first") == "G", "If the bricks were \"GRRBGB\", first should be \"G\". The first brick is bricks[0] (counting starts at 0).")
check(variant.get("bottom_three") == "GRR", "If the bricks change, bottom_three should change too. Slice it: bricks[:3]")
expect_lines(["12 R B RRG"])`,
      hints: [
        "`len(bricks)` counts the letters. Indexes go in square brackets: `bricks[0]`.",
        "The last item is `bricks[-1]`. A slice of the first three is `bricks[:3]` (or `bricks[0:3]`).",
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
        "Comparisons like `oil >= lanterns` give `True` or `False`, and `and` joins two of them.",
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
        "`enough_oil`: whether `oil` is greater than or equal to `lanterns` (a comparison, not the word True).",
        "`light_them`: True only if there is enough oil **and** it is night.",
        "Print `Enough oil: True` and `Light them: True` using the variables.",
      ],
      starter: r`oil = 7
lanterns = 6
is_night = True

# enough_oil =
# light_them =

`,
      tests: r`check(ns.get("enough_oil") is True, "With 7 oil and 6 lanterns, enough_oil should be True. Use a comparison: oil >= lanterns")
check(ns.get("light_them") is True, "light_them should be True here (enough oil and it is night). Use: enough_oil and is_night")
for line in ["oil = 7", "lanterns = 6", "is_night = True"]:
    check(line in src, "Keep the line " + line + " as it was.")
v1, l1 = rerun(src.replace("oil = 7", "oil = 3", 1))
check(v1.get("enough_oil") is False, "If oil were 3, enough_oil should be False. Compare oil with lanterns instead of typing True.")
check(v1.get("light_them") is False, "If oil were 3, light_them should be False.")
v2, l2 = rerun(src.replace("is_night = True", "is_night = False", 1))
check(v2.get("light_them") is False, "In daytime (is_night = False), light_them should be False. Combine both conditions with and.")
expect_lines(["Enough oil: True", "Light them: True"])
check(l1 == ["Enough oil: False", "Light them: False"], "Print the variables, not the words True, so the lines change when the oil runs out.")`,
      hints: [
        "A comparison gives True or False on its own: `enough_oil = oil >= lanterns`.",
        "`and` is True only if both sides are True: `light_them = enough_oil and is_night`.",
        "Then `print(\"Enough oil:\", enough_oil)` and `print(\"Light them:\", light_them)`.",
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
print("Light them: True")`],
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
      tests: r`check(ns.get("dinner") == 6, "dinner should be stew_price + bread_price = 6, not " + repr(ns.get("dinner")) + ".")
check(ns.get("takings") == 54, "takings should be dinner * guests = 54, not " + repr(ns.get("takings")) + ".")
for line in ["stew_price = 4", "guests = 9"]:
    check(line in src, "Keep the line " + line + " as it was.")
expect_lines(["The Sleepy Serpent", "Dinner: 6 coins", "Tonight's takings: 54 coins", "Full house: True"])
v1, l1 = rerun(src.replace("guests = 9", "guests = 5", 1))
check(l1[2:] == ["Tonight's takings: 30 coins", "Full house: False"], "With 5 guests your board should say 30 coins and Full house: False. Work the numbers out from the variables.")
v2, l2 = rerun(src.replace("stew_price = 4", "stew_price = 5", 1))
check(l2[1:3] == ["Dinner: 7 coins", "Tonight's takings: 63 coins"], "If stew cost 5, dinner should be 7 and takings 63. Use the price variables.")`,
      hints: [
        "Start with `print(tavern.title())`. Then `dinner = stew_price + bread_price`.",
        "`takings = dinner * guests`. f-strings make the lines easy: `f\"Dinner: {dinner} coins\"`. The apostrophe in Tonight's means you need double quotes.",
        "The last line is `print(f\"Full house: {guests >= 8}\")`.",
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
print(f"Full house: {guests >= 8}")`],
      done: "The Sleepy Serpent is OPEN! Bram is already polishing mugs. You did it, founder. This valley is becoming a village.",
    },
  ],
};
