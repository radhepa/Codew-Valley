import type { Building } from "./types.ts";

// The Whistling Mill: the second building, taught with conditionals. Each
// challenge adds one stage of the mill model (ART.md, stage_01 … stage_14).
// Wren the miller arrives when the chapter opens and speaks lines that start
// with "Wren: ".
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks. Conditionals
// are tested by running the program again with other starting values:
//   again(("wind = 14", "wind = 30"))  -> (variables, printed lines)
//   expect_when([("wind = 14", "wind = 30")], [lines...], "extra advice")
// A variant that crashes (say, a variable only made inside one branch) gives
// friendly feedback instead of tripping the checker.
const PRE = r`def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Every path through your ifs has to work, not just today's.")

def expect_when(swaps, want, advice=""):
    vns, got = again(*swaps)
    nl = chr(10) + "  "
    when = " and ".join(new for old, new in swaps)
    msg = "If " + when + ", the rune expects:" + nl + nl.join(want) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    if advice:
        msg = msg + chr(10) + advice
    check(got == want, msg)
    return vns

`;

export const MILL: Building = {
  id: "mill",
  name: "The Whistling Mill",
  blurb: "Bread needs flour, flour needs a mill, and a mill needs someone who can read the wind.",
  villager: { name: "Wren", model: "miller", arrives: "start" },
  opening: [
    "Wren: Hello there! Is this the tavern Bram won't stop talking about? He told everyone on the road his stew is wonderful.",
    "Wren: He also says it's lonely. Stew wants bread, bread wants flour, and flour wants a mill. I'm Wren. I'm a miller.",
    "Wren: Well. I had a mill. My family's, four generations of it, until a debt took it. Never mind that. I don't stay sad, I stay busy.",
    "Ssso you want to build a new one? Here? On our empty hill?",
    "Wren: Everyone on the road said one stubborn miller can't raise a mill alone. Good thing I'm not alone, then.",
    "Wren: A mill makes choices all day long. Too windy? Too wet? Enough grain? I can read the wind, but I can't read runes.",
    "Then we'll teach the rune stone to decide things. In Python that's called a **conditional**: *if* this, do that. Let's build The Whistling Mill!",
  ],
  finale: [
    "Wren: Listen... hear that? The sails are whistling. Oh, I've missed that sound.",
    "Wren: First flour of the valley! Bram! BRAM! Light the oven!",
    "Bram: Real flour? Give it here before you change your mind.",
    "Bram: ...There. The first loaf this valley has smelled in a very long time. Bit lopsided.",
    "Wren: It's lopsided because you kneaded it like it owed you money.",
    "Bram: And it'll taste all the better for it. Stew and bread on one table, founder. That's a proper supper.",
    "A tavern, a mill, two neighbours and warm bread. Do you know what that makes us? A **Hamlet**! Pip is very proud. Pip may be crying a little. It's the onions in the stew.",
  ],
  chatDuring: [
    "Wren: Wind's from the west today. Good milling wind. Not that I have a mill yet. Soon!",
    "Wren: Pip says Python reads the indents, like a recipe. The stirring goes under the step it belongs to.",
    "Wren: Bram told me to take a day off. I said if the sails aren't up, I'm not resting. He said what if you fall over? I said that's an else, and I don't plan on it.",
  ],
  chatAfter: [
    "Wren: Every morning I check the weather report your rune writes. It's never wrong. Well, unless the sky is.",
    "Wren: I set the old millstone by the door, runes facing out. Pip knew an awful lot about it, didn't Pip? And then suddenly had to go and check on the wheat.",
    "Wren: My family's mill had a blue door. This one's green. I think I like green. Don't tell my grandmother.",
    "Wren: If the wind's up, the sails go round. Else, I nap. Elif it's raining, I nap indoors.",
  ],
  challenges: [
    {
      id: "m01-reading-the-wind",
      part: "Survey stakes",
      title: "Reading the Wind",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Wren: Before a single stone goes down, I read the wind. A mill on a still hill is just a very tall shed.",
        "Let's ask the rune stone some questions. A **comparison** like `wind >= 10` answers with `True` or `False`.",
        "And remember: one `=` stores a value, two `==` asks \"are these equal?\".",
      ],
      codex: ["comparisons", "booleans"],
      quiz: {
        code: r`stakes = 8
print(stakes != 8)`,
        question: "What does this program show?",
        options: ["False", "True", "8", "SyntaxError"],
        answer: 0,
        why: "!= means \"is not equal to\". stakes IS equal to 8, so the answer is False.",
      },
      task: [
        "`good_wind`: True when `wind` is 10 or more.",
        "`ring_done`: True when `stakes_placed` equals `stakes_needed`.",
        "`too_strong`: True when `wind` is more than 25.",
        "Use comparisons, not the words True and False.",
      ],
      starter: r`wind = 14            # wind speed on the hill today
stakes_placed = 8
stakes_needed = 8

# good_wind =
# ring_done =
# too_strong =

print(f"Good wind: {good_wind}")
print(f"Ring done: {ring_done}")
print(f"Too strong: {too_strong}")
`,
      tests: PRE + r`for name in ["good_wind", "ring_done", "too_strong"]:
    check(name in ns, "Create the variable " + name + " before the print lines use it.")
    check(isinstance(ns[name], bool), name + " holds " + repr(ns[name]) + ", not True or False. A single = stores a value; == compares two values. Example: ring_done = stakes_placed == stakes_needed")
check(ns["good_wind"] is True, "With wind 14, good_wind should be True. Compare: wind >= 10")
check(ns["ring_done"] is True, "8 stakes placed and 8 needed, so ring_done should be True. Compare them with ==.")
check(ns["too_strong"] is False, "Wind 14 is not more than 25, so too_strong should be False. Compare: wind > 25")
expect_lines(["Good wind: True", "Ring done: True", "Too strong: False"])
expect_when([("wind = 14", "wind = 10")], ["Good wind: True", "Ring done: True", "Too strong: False"], "10 counts as good wind: \"10 or more\" is >=.")
expect_when([("wind = 14", "wind = 6")], ["Good wind: False", "Ring done: True", "Too strong: False"], "Compare wind with 10 instead of typing True.")
expect_when([("wind = 14", "wind = 30")], ["Good wind: True", "Ring done: True", "Too strong: True"], "Compare wind with 25 instead of typing False.")
expect_when([("stakes_placed = 8", "stakes_placed = 7")], ["Good wind: True", "Ring done: False", "Too strong: False"], "Compare stakes_placed with stakes_needed instead of typing True.")`,
      hints: [
        "A comparison is a value all by itself: `good_wind = wind >= 10` stores True or False.",
        "Equal is `==` (two signs). More than is `>`. 10 or more is `>=`.",
        "`good_wind = wind >= 10`, `ring_done = stakes_placed == stakes_needed`, `too_strong = wind > 25`",
      ],
      solution: r`wind = 14
stakes_placed = 8
stakes_needed = 8
good_wind = wind >= 10
ring_done = stakes_placed == stakes_needed
too_strong = wind > 25
print(f"Good wind: {good_wind}")
print(f"Ring done: {ring_done}")
print(f"Too strong: {too_strong}")`,
      wrong: [r`wind = 14
stakes_placed = 8
stakes_needed = 8
good_wind = wind >= 10
ring_done = stakes_placed = stakes_needed
too_strong = wind > 25
print(f"Good wind: {good_wind}")
print(f"Ring done: {ring_done}")
print(f"Too strong: {too_strong}")`, r`wind = 14
stakes_placed = 8
stakes_needed = 8
good_wind = True
ring_done = True
too_strong = False
print(f"Good wind: {good_wind}")
print(f"Ring done: {ring_done}")
print(f"Too strong: {too_strong}")`, r`wind = 14
stakes_placed = 8
stakes_needed = 8
good_wind = wind > 10
ring_done = stakes_placed == stakes_needed
too_strong = wind > 25
print(f"Good wind: {good_wind}")
print(f"Ring done: {ring_done}")
print(f"Too strong: {too_strong}")`, r`wind = 14
stakes_placed = 8
stakes_needed = 8
good_wind = wind >= 10
ring_done = stakes_placed == stakes_needed
too_strong = wind > 25
print("Good wind: True")
print("Ring done: True")
print("Too strong: False")`],
      done: "Wren: Fourteen and steady from the west. Perfect! Stakes in, string pulled tight. That's a mill-shaped circle if ever I saw one.",
    },
    {
      id: "m02-first-stones",
      part: "Stone foundation",
      title: "If There's Enough Stone",
      cost: { wood: 0, stone: 5 },
      intro: [
        "Wren: The plinth is one big ring of stone. Half a plinth is worse than none, so we only start if the cart has enough.",
        "That's an **if**! `if` checks a condition. When it's True, Python runs the indented lines under it. When it's False, it skips them.",
        "The colon `:` at the end and the four spaces at the start of the inside lines are both important.",
      ],
      codex: ["if", "indentation"],
      quiz: {
        code: r`logs = 3
if logs > 5:
    print("Big pile")
print("Done")`,
        question: "What does this program show?",
        options: ["Done", "Big pile\nDone", "Big pile", "(nothing)"],
        answer: 0,
        why: "3 > 5 is False, so the indented line is skipped. print(\"Done\") isn't indented, so it always runs.",
      },
      task: [
        "If `stone` is at least `needed`:",
        "  print `Laying the plinth.` and take `needed` away from `stone`.",
        "Both of those lines go inside the if (indented).",
        "The last line, `Stone left: ...`, always prints.",
      ],
      starter: r`stone = 12      # stone in the cart
needed = 10     # stone the plinth needs

# If stone is at least needed:
#     print: Laying the plinth.
#     and take needed away from stone

print(f"Stone left: {stone}")
`,
      tests: PRE + r`expect_lines(["Laying the plinth.", "Stone left: 2"])
expect_when([("stone = 12", "stone = 7")], ["Stone left: 7"], "With too little stone nothing should be laid, and all 7 stone should still be left. Put both the print and the subtraction inside the if, indented under it, and print the stone variable at the end.")
expect_when([("stone = 12", "stone = 10")], ["Laying the plinth.", "Stone left: 0"], "Exactly enough is enough: \"at least\" is >=.")
expect_when([("needed = 10", "needed = 4")], ["Laying the plinth.", "Stone left: 8"], "Use the variable needed instead of typing 10.")`,
      hints: [
        "An if looks like `if stone >= needed:` with a colon at the end.",
        "Indent the lines that belong inside the if by four spaces. `stone = stone - needed` goes in there too.",
        "`if stone >= needed:` then, indented, `print(\"Laying the plinth.\")` and `stone = stone - needed`.",
      ],
      solution: r`stone = 12
needed = 10
if stone >= needed:
    print("Laying the plinth.")
    stone = stone - needed
print(f"Stone left: {stone}")`,
      wrong: [r`stone = 12
needed = 10
print("Laying the plinth.")
stone = stone - needed
print(f"Stone left: {stone}")`, r`stone = 12
needed = 10
if stone >= needed
    print("Laying the plinth.")
    stone = stone - needed
print(f"Stone left: {stone}")`, r`stone = 12
needed = 10
if stone >= needed:
    print("Laying the plinth.")
stone = stone - needed
print(f"Stone left: {stone}")`, r`stone = 12
needed = 10
if stone > needed:
    print("Laying the plinth.")
    stone = stone - needed
print(f"Stone left: {stone}")`, r`stone = 12
needed = 10
if stone >= needed:
    print("Laying the plinth.")
print("Stone left: 2")`],
      done: "Wren: A full ring, not a pebble short. You know, I've never seen stone lay itself before. I could get used to it.",
    },
    {
      id: "m03-wall-or-wait",
      part: "Lower tower",
      title: "Stack or Wait",
      cost: { wood: 0, stone: 6 },
      intro: [
        "Wren: The tower goes up one ring of stone at a time. But stack on wet mortar and the whole lot slumps like a sad pudding.",
        "When there are two choices, use **if / else**. `else:` has no condition; it runs whenever the `if` was False.",
      ],
      codex: ["else-elif", "if"],
      quiz: {
        code: r`rain = True
if rain:
    print("Cover the stones")
else:
    print("Keep building")`,
        question: "What does this program show?",
        options: ["Cover the stones", "Keep building", "Cover the stones\nKeep building", "(nothing)"],
        answer: 0,
        why: "rain is True, so the if block runs. The else block only runs when the if was False.",
      },
      task: [
        "If the mortar has dried for **4 hours or more**: print `Stack the next course.` and add 1 to `wall_height`.",
        "Otherwise (`else`): print `Wait for the mortar to dry.`",
        "The height line always prints at the end.",
      ],
      starter: r`wall_height = 2     # metres of wall so far
hours_dried = 5     # how long the mortar has been drying

# If the mortar has dried for 4 hours or more:
#     print: Stack the next course.
#     and add 1 to wall_height
# Otherwise:
#     print: Wait for the mortar to dry.

print(f"Wall height: {wall_height} m")
`,
      tests: PRE + r`expect_lines(["Stack the next course.", "Wall height: 3 m"])
expect_when([("hours_dried = 5", "hours_dried = 2")], ["Wait for the mortar to dry.", "Wall height: 2 m"], "When the mortar is still wet, only the else part should run.")
expect_when([("hours_dried = 5", "hours_dried = 4")], ["Stack the next course.", "Wall height: 3 m"], "4 hours is enough: \"4 or more\" is >= 4.")
expect_when([("wall_height = 2", "wall_height = 1")], ["Stack the next course.", "Wall height: 2 m"], "Add 1 to wall_height (wall_height = wall_height + 1) instead of setting it to 3.")
check("else" in src, "Use else: for the \"otherwise\" part.")`,
      hints: [
        "Start with `if hours_dried >= 4:` and indent the two lines that belong to it.",
        "`else:` lines up with the `if` (no spaces before it) and has no condition. Its own line is indented under it.",
        "`if hours_dried >= 4:` / `    print(\"Stack the next course.\")` / `    wall_height = wall_height + 1` / `else:` / `    print(\"Wait for the mortar to dry.\")`",
      ],
      solution: r`wall_height = 2
hours_dried = 5
if hours_dried >= 4:
    print("Stack the next course.")
    wall_height = wall_height + 1
else:
    print("Wait for the mortar to dry.")
print(f"Wall height: {wall_height} m")`,
      wrong: [r`wall_height = 2
hours_dried = 5
if hours_dried >= 4:
    print("Stack the next course.")
    wall_height = wall_height + 1
print(f"Wall height: {wall_height} m")`, r`wall_height = 2
hours_dried = 5
if hours_dried >= 4:
    print("Stack the next course.")
    wall_height = wall_height + 1
else hours_dried < 4:
    print("Wait for the mortar to dry.")
print(f"Wall height: {wall_height} m")`, r`wall_height = 2
hours_dried = 5
if hours_dried > 4:
    print("Stack the next course.")
    wall_height = wall_height + 1
else:
    print("Wait for the mortar to dry.")
print(f"Wall height: {wall_height} m")`, r`wall_height = 2
hours_dried = 5
if hours_dried >= 4:
    print("Stack the next course.")
    wall_height = 3
else:
    print("Wait for the mortar to dry.")
print(f"Wall height: {wall_height} m")`, r`wall_height = 2
hours_dried = 5
if hours_dried >= 4:
    print("Stack the next course.")
    wall_height = wall_height + 1
print("Wait for the mortar to dry.")
print(f"Wall height: {wall_height} m")`],
      done: "Wren: Three metres of good grey stone, and not one slump. My old mill leaned. This one won't.",
    },
    {
      id: "m04-tower-weather",
      part: "Upper tower",
      title: "Three Kinds of Wind",
      cost: { wood: 2, stone: 6 },
      intro: [
        "Up top, the wind matters even more. Wren has three rules for the scaffold, and only **one** should ever be followed.",
        "For more than two choices, use **elif** (\"else if\"). Python checks each condition from the top and runs only the **first** one that's True.",
        "Wren: So put the scariest wind first. Trust me.",
      ],
      codex: ["else-elif"],
      quiz: {
        code: r`score = 7
if score > 5:
    print("A")
elif score > 3:
    print("B")
else:
    print("C")`,
        question: "What does this program show?",
        options: ["A", "A\nB", "B", "C"],
        answer: 0,
        why: "7 > 3 is True too, but in an if / elif / else chain only the first True branch runs. The rest are skipped.",
      },
      task: [
        "If `wind` is 30 or more: print `Too windy. Everyone off the tower!`",
        "Else, if `wind` is 15 or more: print `Lay stones from the inside.`",
        "Otherwise: print `Raise the timber band.`",
      ],
      starter: r`wind = 18    # wind speed up on the scaffold

# If wind is 30 or more:          print Too windy. Everyone off the tower!
# Else, if wind is 15 or more:    print Lay stones from the inside.
# Otherwise:                      print Raise the timber band.
`,
      tests: PRE + r`expect_lines(["Lay stones from the inside."])
expect_when([("wind = 18", "wind = 35")], ["Too windy. Everyone off the tower!"], "Exactly one line should print, and it should change with the wind. Check the strongest wind first: an elif is only tried when everything above it was False.")
expect_when([("wind = 18", "wind = 30")], ["Too windy. Everyone off the tower!"], "30 is already too windy: \"30 or more\" is >= 30.")
expect_when([("wind = 18", "wind = 15")], ["Lay stones from the inside."], "15 counts: \"15 or more\" is >= 15.")
expect_when([("wind = 18", "wind = 5")], ["Raise the timber band."], "A gentle wind should reach the else.")
check("elif" in src, "Use elif for the middle case.")`,
      hints: [
        "Three branches: `if ...:`, `elif ...:`, `else:`. Each ends with a colon and has its print indented under it.",
        "Order matters! Put `wind >= 30` first. If `wind >= 15` came first, a gale of 35 would stop there.",
        "`if wind >= 30:` / `elif wind >= 15:` / `else:`, each with its own indented print.",
      ],
      solution: r`wind = 18
if wind >= 30:
    print("Too windy. Everyone off the tower!")
elif wind >= 15:
    print("Lay stones from the inside.")
else:
    print("Raise the timber band.")`,
      wrong: [r`wind = 18
if wind >= 15:
    print("Lay stones from the inside.")
elif wind >= 30:
    print("Too windy. Everyone off the tower!")
else:
    print("Raise the timber band.")`, r`wind = 18
if wind >= 30:
    print("Too windy. Everyone off the tower!")
if wind >= 15:
    print("Lay stones from the inside.")
else:
    print("Raise the timber band.")`, r`wind = 18
if wind >= 30:
    print("Too windy. Everyone off the tower!")
else if wind >= 15:
    print("Lay stones from the inside.")
else:
    print("Raise the timber band.")`, r`wind = 18
print("Lay stones from the inside.")`, r`wind = 18
if wind > 30:
    print("Too windy. Everyone off the tower!")
elif wind >= 15:
    print("Lay stones from the inside.")
else:
    print("Raise the timber band.")`],
      done: "Wren: Six and a half metres, and a timber band to hold her together. From up here I can see Bram waving a ladle.",
    },
    {
      id: "m05-knock-knock",
      part: "Door",
      title: "The Miller's Word",
      cost: { wood: 4, stone: 1 },
      intro: [
        "Wren: Every mill door I've ever had opens for one word: **wheat**. Old millers' custom. Keeps the crows guessing.",
        "But visitors say it every which way: `WHEAT`, `Wheat`, ` wheat `. To Python those are all different strings!",
        "Tidy the text first with `.strip()` and `.lower()`, then compare.",
      ],
      codex: ["comparisons", "string-methods"],
      quiz: {
        code: r`print("Wren".lower() == "wren")`,
        question: "What does this program show?",
        options: ["True", "False", "wren", "Wren"],
        answer: 0,
        why: "\"Wren\".lower() is \"wren\", and \"wren\" == \"wren\" is True. Without .lower(), the capital W would make them different.",
      },
      task: [
        "`word`: `spoken` with the spaces at both ends removed, in lowercase.",
        "If `word` is `\"wheat\"`: print `The door swings open.`",
        "Otherwise: print `The door stays shut.`",
      ],
      starter: r`spoken = "  WHEAT "   # what the visitor said at the door

# word =     (spoken, tidied up: no spaces at the ends, all lowercase)

# If word is "wheat":  print The door swings open.
# Otherwise:           print The door stays shut.
`,
      tests: PRE + r`check("word" in ns, "Make a variable word: spoken without the outside spaces, in lowercase.")
check(isinstance(ns["word"], str), "word isn't text. Did you forget the () after a method? It's .lower(), not .lower")
check(ns["word"] == "wheat", "word should be \"wheat\" but it is " + repr(ns["word"]) + ". Use .strip() to remove the spaces and .lower() to make it lowercase, like spoken.strip().lower()")
expect_lines(["The door swings open."])
expect_when([('spoken = "  WHEAT "', 'spoken = "Wheat"')], ["The door swings open."])
expect_when([('spoken = "  WHEAT "', 'spoken = "wHeAt   "')], ["The door swings open."], "Compare the tidied word, not spoken.")
expect_when([('spoken = "  WHEAT "', 'spoken = "barley"')], ["The door stays shut."], "Only the miller's word opens the door. Use if / else with word == \"wheat\".")`,
      hints: [
        "Methods can be chained: `spoken.strip().lower()` strips first, then lowercases.",
        "Compare with two equals signs and all-lowercase text: `if word == \"wheat\":`",
        "`word = spoken.strip().lower()` then `if word == \"wheat\":` print the open line, `else:` print the shut line.",
      ],
      solution: r`spoken = "  WHEAT "
word = spoken.strip().lower()
if word == "wheat":
    print("The door swings open.")
else:
    print("The door stays shut.")`,
      wrong: [r`spoken = "  WHEAT "
word = spoken.lower()
if word == "wheat":
    print("The door swings open.")
else:
    print("The door stays shut.")`, r`spoken = "  WHEAT "
word = spoken.strip().lower
if word == "wheat":
    print("The door swings open.")
else:
    print("The door stays shut.")`, r`spoken = "  WHEAT "
word = spoken.strip().lower()
if word = "wheat":
    print("The door swings open.")
else:
    print("The door stays shut.")`, r`spoken = "  WHEAT "
word = spoken.strip().lower()
if word == "Wheat":
    print("The door swings open.")
else:
    print("The door stays shut.")`, r`spoken = "  WHEAT "
word = spoken.strip().lower()
print("The door swings open.")`],
      done: "Wren: \"Wheat!\" And it swings right open. Oh, it's a lovely door. Round at the top, like a loaf.",
    },
    {
      id: "m06-shutters",
      part: "Windows",
      title: "Shutters and Candles",
      cost: { wood: 3, stone: 2 },
      intro: [
        "Wren: Little windows, with shutters. Shut them when it rains **or** when the wind howls. Either one is reason enough.",
        "Wren: And in the evening I put a candle in the window, but only if it's dark **and** I have a candle. Learned that one the hard way.",
        "`or` is True when at least one side is True. `and` needs both sides True.",
      ],
      codex: ["logic"],
      quiz: {
        code: r`wind = 30
rain = False
print(rain or wind > 25)`,
        question: "What does this program show?",
        options: ["True", "False", "30", "rain"],
        answer: 0,
        why: "rain is False, but wind > 25 is True, and or only needs one True side.",
      },
      task: [
        "If it is `raining` **or** the `wind` is over 25: print `Shutters closed.` Otherwise print `Shutters open.`",
        "Then, if the `hour` is 18 or later **and** there is at least one candle: print `A candle in the window.`",
      ],
      starter: r`raining = False
wind = 12
hour = 19       # 0 is midnight, 13 is one in the afternoon
candles = 3

# 1. If it is raining OR the wind is over 25:   print Shutters closed.
#    Otherwise:                                 print Shutters open.
# 2. If the hour is 18 or later AND there is at least one candle:
#                                               print A candle in the window.
`,
      tests: PRE + r`expect_lines(["Shutters open.", "A candle in the window."])
expect_when([("raining = False", "raining = True")], ["Shutters closed.", "A candle in the window."], "Rain alone is reason enough to close them: join the two conditions with or.")
expect_when([("wind = 12", "wind = 30")], ["Shutters closed.", "A candle in the window."], "A howling wind alone is reason enough too.")
expect_when([("wind = 12", "wind = 25")], ["Shutters open.", "A candle in the window."], "\"Over 25\" means more than 25: wind > 25.")
expect_when([("hour = 19", "hour = 12")], ["Shutters open."], "No candle at noon: the hour must be 18 or later.")
expect_when([("hour = 19", "hour = 18")], ["Shutters open.", "A candle in the window."], "\"18 or later\" includes 18: hour >= 18.")
expect_when([("candles = 3", "candles = 0")], ["Shutters open."], "No candles, no candle in the window. Both things must be true: join them with and.")`,
      hints: [
        "Each side of `or` / `and` must be a whole comparison: `raining or wind > 25`.",
        "The candle needs both: `hour >= 18 and candles > 0`. It has no else.",
        "`if raining or wind > 25:` closed, `else:` open. Then `if hour >= 18 and candles > 0:` print the candle line.",
      ],
      solution: r`raining = False
wind = 12
hour = 19
candles = 3
if raining or wind > 25:
    print("Shutters closed.")
else:
    print("Shutters open.")
if hour >= 18 and candles > 0:
    print("A candle in the window.")`,
      wrong: [r`raining = False
wind = 12
hour = 19
candles = 3
if raining and wind > 25:
    print("Shutters closed.")
else:
    print("Shutters open.")
if hour >= 18 and candles > 0:
    print("A candle in the window.")`, r`raining = False
wind = 12
hour = 19
candles = 3
if raining or wind > 25:
    print("Shutters closed.")
else:
    print("Shutters open.")
if hour >= 18 or candles > 0:
    print("A candle in the window.")`, r`raining = False
wind = 12
hour = 19
candles = 3
if wind or raining > 25:
    print("Shutters closed.")
else:
    print("Shutters open.")
if hour >= 18 and candles > 0:
    print("A candle in the window.")`, r`raining = False
wind = 12
hour = 19
candles = 3
if raining or wind > 25:
    print("Shutters closed.")
else:
    print("Shutters open.")
print("A candle in the window.")`],
      done: "Wren: Shutters that know when to close. And look, a candle. Now it feels like somebody lives here.",
    },
    {
      id: "m07-gallery",
      part: "Gallery",
      title: "Not Yet, Wren!",
      cost: { wood: 5, stone: 0 },
      intro: [
        "A wooden balcony ring, the **gallery**, goes around the tower. Wren keeps trying to step out onto it before it's finished.",
        "Wren: I just want to see the view!",
        "`not` flips True to False and False to True. `if not ready:` reads just like English: if it's not ready...",
      ],
      codex: ["logic"],
      quiz: {
        code: r`print(not 5 > 3)`,
        question: "What does this program show?",
        options: ["False", "True", "5", "SyntaxError"],
        answer: 0,
        why: "5 > 3 is worked out first (True), then not flips it to False.",
      },
      task: [
        "`ready`: True when `railing_done` is True **and** `boards` is at least `needed`.",
        "If the gallery is **not** ready: print `Keep off the gallery, Wren!` Otherwise print `Step out and enjoy the view.`",
        "Use `if not ready:`.",
      ],
      starter: r`railing_done = False
boards = 18
needed = 16

# ready =   (railing done AND enough boards)

print(f"Ready: {ready}")
# If the gallery is NOT ready:  print Keep off the gallery, Wren!
# Otherwise:                    print Step out and enjoy the view.
`,
      tests: PRE + r`check("ready" in ns, "Create the variable ready: railing_done and boards >= needed")
check(isinstance(ns["ready"], bool), "ready should be True or False, but it is " + repr(ns["ready"]) + ".")
check(ns["ready"] is False, "The railing isn't done, so ready should be False. Both things must be true: railing_done and boards >= needed")
expect_lines(["Ready: False", "Keep off the gallery, Wren!"])
expect_when([("railing_done = False", "railing_done = True")], ["Ready: True", "Step out and enjoy the view."], "Railing done and 18 boards: the gallery is ready.")
expect_when([("railing_done = False", "railing_done = True"), ("boards = 18", "boards = 10")], ["Ready: False", "Keep off the gallery, Wren!"], "A railing with too few boards still isn't ready.")
expect_when([("railing_done = False", "railing_done = True"), ("boards = 18", "boards = 16")], ["Ready: True", "Step out and enjoy the view."], "16 boards is enough: \"at least\" is >=.")
check("if not" in src, "Use not to flip ready: if not ready:")`,
      hints: [
        "`ready = railing_done and boards >= needed`",
        "`if not ready:` runs its block when ready is False.",
        "`if not ready:` print the keep-off line, `else:` print the view line.",
      ],
      solution: r`railing_done = False
boards = 18
needed = 16
ready = railing_done and boards >= needed
print(f"Ready: {ready}")
if not ready:
    print("Keep off the gallery, Wren!")
else:
    print("Step out and enjoy the view.")`,
      wrong: [r`railing_done = False
boards = 18
needed = 16
ready = railing_done and boards >= needed
print(f"Ready: {ready}")
if not ready:
    print("Step out and enjoy the view.")
else:
    print("Keep off the gallery, Wren!")`, r`railing_done = False
boards = 18
needed = 16
ready = railing_done or boards >= needed
print(f"Ready: {ready}")
if not ready:
    print("Keep off the gallery, Wren!")
else:
    print("Step out and enjoy the view.")`, r`railing_done = False
boards = 18
needed = 16
ready = railing_done and boards >= needed
print(f"Ready: {ready}")
if ready == False:
    print("Keep off the gallery, Wren!")
else:
    print("Step out and enjoy the view.")`, r`railing_done = False
boards = 18
needed = 16
ready = not railing_done and boards >= needed
print(f"Ready: {ready}")
if not ready:
    print("Keep off the gallery, Wren!")
else:
    print("Step out and enjoy the view.")`, r`railing_done = False
boards = 18
needed = 16
ready = railing_done and boards >= needed
print(f"Ready: {ready}")
if not ready
    print("Keep off the gallery, Wren!")
else:
    print("Step out and enjoy the view.")`],
      done: "Wren: NOW can I go out? ...Oh. Oh, the whole valley. The tavern, the pond, the hills going blue. Worth the wait.",
    },
    {
      id: "m08-cap-shingles",
      part: "Cap",
      title: "What's in the Cart?",
      cost: { wood: 5, stone: 1 },
      intro: [
        "The cap is the mill's hat. It needs shingles and tar. Wren packed the cart this morning. Probably.",
        "Wren: I definitely packed... things.",
        "`\"tar\" in cart` is True when the text `tar` appears anywhere inside `cart`. And `not in` asks the opposite.",
      ],
      codex: ["in"],
      quiz: {
        code: r`cart = "oats, honey, star anise"
print("tar" in cart)`,
        question: "What does this program show?",
        options: ["True", "False", "tar", "TypeError"],
        answer: 0,
        why: "in looks for those letters anywhere in the text, and \"star\" has \"tar\" hiding inside it!",
      },
      task: [
        "`has_shingles`: whether `\"shingles\"` is in `cart`. `has_tar`: whether `\"tar\"` is in `cart`.",
        "If both are packed: print `Up to the cap we go!`",
        "Else, if `\"tar\"` is **not in** the cart: print `Pip, fetch the tar!`",
        "Otherwise: print `Pip, fetch the shingles!`",
      ],
      starter: r`cart = "shingles, nails, rope, cheese sandwich"

# has_shingles =   (is "shingles" in the cart?)
# has_tar =        (is "tar" in the cart?)

# If both are packed:            print Up to the cap we go!
# Else, if "tar" is not in it:   print Pip, fetch the tar!
# Otherwise:                     print Pip, fetch the shingles!
`,
      tests: PRE + r`for name in ["has_shingles", "has_tar"]:
    check(name in ns, "Create the variable " + name + ".")
    check(isinstance(ns[name], bool), name + " should be True or False, but it is " + repr(ns[name]) + ". Use in, like: \"tar\" in cart")
check(ns["has_shingles"] is True, "\"shingles\" is in the cart, so has_shingles should be True.")
check(ns["has_tar"] is False, "There's no tar in the cart, so has_tar should be False.")
expect_lines(["Pip, fetch the tar!"])
expect_when([('cart = "shingles, nails, rope, cheese sandwich"', 'cart = "shingles, tar, nails"')], ["Up to the cap we go!"], "With shingles and tar both in the cart, it's time to go up. Look inside cart with in (all lowercase: \"tar\").")
expect_when([('cart = "shingles, nails, rope, cheese sandwich"', 'cart = "tar, rope"')], ["Pip, fetch the shingles!"], "Tar is packed here, so it's the shingles that are missing.")
expect_when([('cart = "shingles, nails, rope, cheese sandwich"', 'cart = "rope, nails"')], ["Pip, fetch the tar!"], "When both are missing, the elif (tar not in cart) comes first.")
check(" in cart" in src, "Use in to look inside the cart, like: \"tar\" in cart")`,
      hints: [
        "`has_tar = \"tar\" in cart` stores True or False.",
        "Both packed is `has_shingles and has_tar`. The elif can use `\"tar\" not in cart`.",
        "`if has_shingles and has_tar:` / `elif \"tar\" not in cart:` / `else:`, each with its print.",
      ],
      solution: r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = "tar" in cart
if has_shingles and has_tar:
    print("Up to the cap we go!")
elif "tar" not in cart:
    print("Pip, fetch the tar!")
else:
    print("Pip, fetch the shingles!")`,
      wrong: [r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = cart == "tar"
if has_shingles and has_tar:
    print("Up to the cap we go!")
elif "tar" not in cart:
    print("Pip, fetch the tar!")
else:
    print("Pip, fetch the shingles!")`, r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = "Tar" in cart
if has_shingles and has_tar:
    print("Up to the cap we go!")
elif not has_tar:
    print("Pip, fetch the tar!")
else:
    print("Pip, fetch the shingles!")`, r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = "tar" in cart
if has_shingles or has_tar:
    print("Up to the cap we go!")
elif "tar" not in cart:
    print("Pip, fetch the tar!")
else:
    print("Pip, fetch the shingles!")`, r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = "tar" in cart
if has_shingles and has_tar:
    print("Up to the cap we go!")
elif "tar" in cart:
    print("Pip, fetch the tar!")
else:
    print("Pip, fetch the shingles!")`, r`cart = "shingles, nails, rope, cheese sandwich"
has_shingles = "shingles" in cart
has_tar = "tar" in cart
print("Pip, fetch the tar!")`],
      done: "Ssso heavy, that tar pot. Pip has no arms, you know. Pip rolled it. Anyway, the cap is on and it's very handsome.",
    },
    {
      id: "m09-windshaft",
      part: "Windshaft",
      title: "Grease and Brakes",
      cost: { wood: 6, stone: 0 },
      intro: [
        "The windshaft is the big axle that pokes out of the cap. The sails will hang on it. Wren checks it in a very particular order.",
        "Wren: First, is the brake off? If it's on, nothing else matters. **Then**, and only then, is there enough grease?",
        "A question inside a question is a **nested if**: an `if` indented inside another `if`.",
      ],
      codex: ["nested-if", "indentation"],
      quiz: {
        code: r`dry = True
warm = False
if dry:
    if warm:
        print("Plant")
    else:
        print("Wait")`,
        question: "What does this program show?",
        options: ["Wait", "Plant", "Plant\nWait", "(nothing)"],
        answer: 0,
        why: "dry is True, so Python goes inside. There, warm is False, so the inner else runs.",
      },
      task: [
        "If the brake is **not** on:",
        "  if `grease` is 2 or more, print `The shaft turns smoothly.`; otherwise print `Squeak! Needs more grease.`",
        "Otherwise (the brake is on): print `The brake is on. Nothing moves.`",
      ],
      starter: r`brake_on = False
grease = 3      # spoonfuls of grease on the shaft

# If the brake is NOT on:
#     If grease is 2 or more:   print The shaft turns smoothly.
#     Otherwise:                print Squeak! Needs more grease.
# Otherwise (the brake is on):  print The brake is on. Nothing moves.
`,
      tests: PRE + r`expect_lines(["The shaft turns smoothly."])
expect_when([("grease = 3", "grease = 1")], ["Squeak! Needs more grease."], "Too little grease should squeak. The inner else belongs to the grease check, so it is indented to line up with the inner if.")
expect_when([("grease = 3", "grease = 2")], ["The shaft turns smoothly."], "2 spoonfuls is enough: \"2 or more\" is >= 2.")
expect_when([("brake_on = False", "brake_on = True")], ["The brake is on. Nothing moves."], "With the brake on, only the brake line should print.")
expect_when([("brake_on = False", "brake_on = True"), ("grease = 3", "grease = 1")], ["The brake is on. Nothing moves."], "With the brake on, the grease doesn't matter at all. The grease check goes inside the brake check.")
nested = False
for line in src.splitlines():
    if line[:1] in (" ", chr(9)) and line.strip().startswith("if "):
        nested = True
check(nested, "Put the grease check inside the brake check: an if indented under if not brake_on:")`,
      hints: [
        "The outer if is `if not brake_on:`. The outer else is lined up with it.",
        "The inner `if grease >= 2:` and its `else:` are indented 4 spaces; their prints are indented 8.",
        "`if not brake_on:` / `    if grease >= 2:` / `        print(...)` / `    else:` / `        print(...)` / `else:` / `    print(\"The brake is on. Nothing moves.\")`",
      ],
      solution: r`brake_on = False
grease = 3
if not brake_on:
    if grease >= 2:
        print("The shaft turns smoothly.")
    else:
        print("Squeak! Needs more grease.")
else:
    print("The brake is on. Nothing moves.")`,
      wrong: [r`brake_on = False
grease = 3
if brake_on:
    print("The brake is on. Nothing moves.")
if grease >= 2:
    print("The shaft turns smoothly.")
else:
    print("Squeak! Needs more grease.")`, r`brake_on = False
grease = 3
if not brake_on:
    if grease >= 2:
        print("The shaft turns smoothly.")
else:
    print("Squeak! Needs more grease.")`, r`brake_on = False
grease = 3
if not brake_on:
    if grease > 2:
        print("The shaft turns smoothly.")
    else:
        print("Squeak! Needs more grease.")
else:
    print("The brake is on. Nothing moves.")`, r`brake_on = False
grease = 3
if not brake_on:
if grease >= 2:
    print("The shaft turns smoothly.")
else:
    print("Squeak! Needs more grease.")`, r`brake_on = False
grease = 3
if brake_on:
    if grease >= 2:
        print("The shaft turns smoothly.")
    else:
        print("Squeak! Needs more grease.")
else:
    print("The brake is on. Nothing moves.")`],
      done: "Wren: Not a squeak. Listen to it hum! ...Pip, are your scales glowing? No? Huh. Must be the light up here.",
    },
    {
      id: "m10-sails",
      part: "Sails",
      title: "Sails Up!",
      cost: { wood: 6, stone: 0 },
      intro: [
        "The big moment: four lattice sails, dressed in cloth. Wren sews the cloths in **pairs**, so an odd one out means a wobbly sail.",
        "To test for even, use `%`, the remainder: `cloths % 2 == 0` is True for even numbers.",
        "And a secret: values can stand in for True or False. An empty string `\"\"` and the number `0` count as False; anything else counts as True. That's called **truthiness**.",
      ],
      codex: ["truthiness", "math"],
      quiz: {
        code: r`name = ""
if name:
    print("Hello")
else:
    print("Nobody here")`,
        question: "What does this program show?",
        options: ["Nobody here", "Hello", "(nothing)", "SyntaxError"],
        answer: 0,
        why: "An empty string counts as False, so the else runs. Any string with something in it would count as True.",
      },
      task: [
        "If `cloths` is even: print `The cloths pair up nicely.` Otherwise: `One cloth is left over.`",
        "If there is a `helper` (any name): print `<helper> holds the ladder.` Otherwise: `Nobody holds the ladder. Wait for help.`",
        "If there is any `wind` (not 0): print `The sails begin to turn!` Otherwise: `Not a breath of wind.`",
      ],
      starter: r`cloths = 6        # sail cloths Wren sewed
helper = "Pip"    # who holds the ladder ("" means nobody)
wind = 9          # wind speed (0 means no wind at all)

# 1. If cloths is even:     print The cloths pair up nicely.
#    Otherwise:             print One cloth is left over.
# 2. If there is a helper:  print <helper> holds the ladder.
#    Otherwise:             print Nobody holds the ladder. Wait for help.
# 3. If there is any wind:  print The sails begin to turn!
#    Otherwise:             print Not a breath of wind.
`,
      tests: PRE + r`expect_lines(["The cloths pair up nicely.", "Pip holds the ladder.", "The sails begin to turn!"])
expect_when([("cloths = 6", "cloths = 7")], ["One cloth is left over.", "Pip holds the ladder.", "The sails begin to turn!"], "An even number has remainder 0 when divided by 2: cloths % 2 == 0")
expect_when([("cloths = 6", "cloths = 4")], ["The cloths pair up nicely.", "Pip holds the ladder.", "The sails begin to turn!"])
expect_when([('helper = "Pip"', 'helper = "Wren"')], ["The cloths pair up nicely.", "Wren holds the ladder.", "The sails begin to turn!"], "Put the helper's name in with an f-string: f\"{helper} holds the ladder.\"")
expect_when([('helper = "Pip"', 'helper = ""')], ["The cloths pair up nicely.", "Nobody holds the ladder. Wait for help.", "The sails begin to turn!"], "An empty name counts as False, so if helper: is all you need.")
expect_when([("wind = 9", "wind = 0")], ["The cloths pair up nicely.", "Pip holds the ladder.", "Not a breath of wind."], "0 counts as False, so if wind: skips to the else.")
check("%" in src, "Use % to test for even: cloths % 2 == 0")`,
      hints: [
        "`cloths % 2` is the remainder after dividing by 2: 0 for even numbers, 1 for odd ones.",
        "`if helper:` is True for any name and False for `\"\"`. `if wind:` is False only for 0. Don't write `== True`!",
        "`if cloths % 2 == 0:` ... `if helper:` with `print(f\"{helper} holds the ladder.\")` ... `if wind:` ... each with an else.",
      ],
      solution: r`cloths = 6
helper = "Pip"
wind = 9
if cloths % 2 == 0:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
if helper:
    print(f"{helper} holds the ladder.")
else:
    print("Nobody holds the ladder. Wait for help.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`,
      wrong: [r`cloths = 6
helper = "Pip"
wind = 9
if cloths / 2 == 0:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
if helper:
    print(f"{helper} holds the ladder.")
else:
    print("Nobody holds the ladder. Wait for help.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`, r`cloths = 6
helper = "Pip"
wind = 9
if cloths % 2 == 0:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
if helper == True:
    print(f"{helper} holds the ladder.")
else:
    print("Nobody holds the ladder. Wait for help.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`, r`cloths = 6
helper = "Pip"
wind = 9
if cloths % 2 == 0:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
if helper:
    print("{helper} holds the ladder.")
else:
    print("Nobody holds the ladder. Wait for help.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`, r`cloths = 6
helper = "Pip"
wind = 9
if cloths % 2:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
if helper:
    print(f"{helper} holds the ladder.")
else:
    print("Nobody holds the ladder. Wait for help.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`, r`cloths = 6
helper = "Pip"
wind = 9
if cloths % 2 == 0:
    print("The cloths pair up nicely.")
else:
    print("One cloth is left over.")
print("Pip holds the ladder.")
if wind:
    print("The sails begin to turn!")
else:
    print("Not a breath of wind.")`],
      done: "Wren: They're turning... they're TURNING! Hear that whistle? That's the sound of a mill that means it.",
    },
    {
      id: "m11-field",
      part: "Field",
      title: "Just Right Soil",
      cost: { wood: 3, stone: 2 },
      intro: [
        "A mill needs wheat, and wheat needs a field. Wren crumbles a handful of soil and frowns at it like a picky aunt.",
        "Wren: Too dry and the seed blows away. Too wet and it rots. It has to be **between**.",
        "Python can check a range in one go: `30 <= moisture <= 60`. That's a **chained comparison**.",
      ],
      codex: ["chained"],
      quiz: {
        code: r`x = 5
print(1 < x < 4)`,
        question: "What does this program show?",
        options: ["False", "True", "5", "SyntaxError"],
        answer: 0,
        why: "1 < x < 4 means 1 < x and x < 4. 1 < 5 is True, but 5 < 4 is False, so the whole thing is False.",
      },
      task: [
        "If `moisture` is from 30 to 60 (both included): print `Perfect for tilling.`",
        "Else, if it is below 30: print `Too dry. Water the rows first.` Otherwise: `Too muddy. Wait a day.`",
        "`good_temp`: True when `temperature` is from 8 to 25 (both included).",
        "Write each range as one chained comparison.",
      ],
      starter: r`moisture = 45      # how damp the soil is, 0 to 100
temperature = 14   # degrees

# 1. If moisture is from 30 to 60 (both included):  print Perfect for tilling.
#    Else, if it is below 30:                       print Too dry. Water the rows first.
#    Otherwise:                                     print Too muddy. Wait a day.
# 2. good_temp =   (temperature from 8 to 25, both included, as one chained comparison)

print(f"Good for sowing: {good_temp}")
`,
      tests: PRE + r`import re
expect_lines(["Perfect for tilling.", "Good for sowing: True"])
expect_when([("moisture = 45", "moisture = 30")], ["Perfect for tilling.", "Good for sowing: True"], "30 is included in the range, so use <= on both sides: 30 <= moisture <= 60")
expect_when([("moisture = 45", "moisture = 60")], ["Perfect for tilling.", "Good for sowing: True"], "60 is included in the range too.")
expect_when([("moisture = 45", "moisture = 29")], ["Too dry. Water the rows first.", "Good for sowing: True"], "Below 30 is too dry.")
expect_when([("moisture = 45", "moisture = 61")], ["Too muddy. Wait a day.", "Good for sowing: True"], "Above 60 is too muddy. Check the range with both ends: 30 <= moisture <= 60")
expect_when([("temperature = 14", "temperature = 8")], ["Perfect for tilling.", "Good for sowing: True"], "8 degrees is included: 8 <= temperature <= 25")
expect_when([("temperature = 14", "temperature = 25")], ["Perfect for tilling.", "Good for sowing: True"], "25 degrees is included.")
expect_when([("temperature = 14", "temperature = 7")], ["Perfect for tilling.", "Good for sowing: False"], "Work good_temp out with a comparison instead of typing True.")
expect_when([("temperature = 14", "temperature = 26")], ["Perfect for tilling.", "Good for sowing: False"], "26 degrees is too hot.")
check(len(re.findall(r"\w\s*<=?\s*\w+\s*<=?\s*\w", src)) >= 2, "Write each range as one chained comparison, like 30 <= moisture <= 60 and 8 <= temperature <= 25.")`,
      hints: [
        "`30 <= moisture <= 60` is True when moisture is anywhere from 30 to 60.",
        "Check the range first, then `elif moisture < 30:`, then `else:`.",
        "`if 30 <= moisture <= 60:` ... `elif moisture < 30:` ... `else:` ... and `good_temp = 8 <= temperature <= 25`.",
      ],
      solution: r`moisture = 45
temperature = 14
if 30 <= moisture <= 60:
    print("Perfect for tilling.")
elif moisture < 30:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = 8 <= temperature <= 25
print(f"Good for sowing: {good_temp}")`,
      wrong: [r`moisture = 45
temperature = 14
if 30 < moisture < 60:
    print("Perfect for tilling.")
elif moisture < 30:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = 8 <= temperature <= 25
print(f"Good for sowing: {good_temp}")`, r`moisture = 45
temperature = 14
if 30 <= moisture <= 60:
    print("Perfect for tilling.")
elif moisture > 60:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = 8 <= temperature <= 25
print(f"Good for sowing: {good_temp}")`, r`moisture = 45
temperature = 14
if moisture >= 30 <= 60:
    print("Perfect for tilling.")
elif moisture < 30:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = 8 <= temperature <= 25
print(f"Good for sowing: {good_temp}")`, r`moisture = 45
temperature = 14
if 30 <= moisture <= 60:
    print("Perfect for tilling.")
elif moisture < 30:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = 8 <= temperature >= 25
print(f"Good for sowing: {good_temp}")`, r`moisture = 45
temperature = 14
if moisture >= 30 and moisture <= 60:
    print("Perfect for tilling.")
elif moisture < 30:
    print("Too dry. Water the rows first.")
else:
    print("Too muddy. Wait a day.")
good_temp = temperature >= 8 and temperature <= 25
print(f"Good for sowing: {good_temp}")`],
      done: "Wren: Crumbly, dark, just damp enough. Like good cake. Neat little rows... ow! My hoe hit something. Something big, and round, and... carved?",
    },
    {
      id: "m12-wheat",
      part: "Wheat",
      title: "Measuring the Wheat",
      cost: { wood: 3, stone: 2 },
      intro: [
        "Wren: It's a millstone. An old one, older than any mill I've heard of. And Pip, look: it's carved with the same runes as your stone.",
        "Ah. Yesss. That's a Willowmere stone. Grey granite from the east bank, the spiral cut by the Founder's own guild, three hundred years old if it's a day.",
        "Wren: Willowmere? Pip, how do you know all that?",
        "Lucky guess! Oh look, the wheat is up! Wren, your measuring stick! Quickly, before it grows!",
        "Python has built-in helpers for deciding with numbers: `min()` and `max()` pick the smallest and biggest, `abs()` drops the minus sign, and `round()` tidies decimals.",
      ],
      codex: ["min-max", "math"],
      quiz: {
        code: r`print(min(5, 2, 8), abs(-3))`,
        question: "What does this program show?",
        options: ["2 3", "8 3", "2 -3", "5 3"],
        answer: 0,
        why: "min picks the smallest (2), and abs(-3) is 3: the distance from zero, always positive.",
      },
      task: [
        "`planted`: the smaller of `rows` and `seed_bags`.",
        "`tallest`: the biggest of `north`, `south` and `east`.",
        "`average`: the average of the three heights, rounded to 1 decimal place.",
        "`off_by`: how far `average` is from `target`, never negative, rounded to 1 place.",
        "If `off_by` is 1 or less: print `The wheat is right on time.` Otherwise: `The wheat needs more sun.`",
      ],
      starter: r`rows = 12          # rows of tilled soil
seed_bags = 9      # one bag sows one row
north = 14.6       # wheat height in cm, measured in three spots
south = 11.2
east = 13.9
target = 13        # how tall Wren hoped it would be today

# planted =
# tallest =
# average =
# off_by =

print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
# If off_by is 1 or less:  print The wheat is right on time.
# Otherwise:               print The wheat needs more sun.
`,
      tests: PRE + r`for name in ["planted", "tallest", "average", "off_by"]:
    check(name in ns, "Create the variable " + name + " before the print lines use it.")
check(ns["planted"] == 9, "You can only plant as many rows as you have seed bags: planted = min(rows, seed_bags), which is 9, not " + repr(ns["planted"]) + ".")
check(ns["tallest"] == 14.6, "tallest should be max(north, south, east), which is 14.6, not " + repr(ns["tallest"]) + ".")
check(ns["average"] == 13.2, "average should be (north + south + east) / 3, rounded to 1 place: 13.2. You have " + repr(ns["average"]) + ". Brackets first, then round(..., 1).")
check(isinstance(ns["off_by"], (int, float)) and abs(ns["off_by"] - 0.2) < 0.001, "off_by should be round(abs(average - target), 1), which is 0.2, not " + repr(ns["off_by"]) + ".")
expect_lines(["Rows planted: 9", "Tallest: 14.6 cm", "Average: 13.2 cm", "The wheat is right on time."])
expect_when([("seed_bags = 9", "seed_bags = 15")], ["Rows planted: 12", "Tallest: 14.6 cm", "Average: 13.2 cm", "The wheat is right on time."], "With 15 bags but only 12 rows, you plant 12. Use min(rows, seed_bags).")
expect_when([("north = 14.6", "north = 20.0")], ["Rows planted: 9", "Tallest: 20.0 cm", "Average: 15.0 cm", "The wheat needs more sun."], "Use max() on the three heights instead of typing 14.6.")
expect_when([("south = 11.2", "south = 8.0")], ["Rows planted: 9", "Tallest: 14.6 cm", "Average: 12.2 cm", "The wheat is right on time."])
expect_when([("south = 11.2", "south = 5.0")], ["Rows planted: 9", "Tallest: 14.6 cm", "Average: 11.2 cm", "The wheat needs more sun."], "Here average is 1.8 BELOW target, so average - target is -1.8. Wrap it in abs() so the distance is never negative.")`,
      hints: [
        "`min(rows, seed_bags)` and `max(north, south, east)`. They take as many values as you like.",
        "Brackets first: `(north + south + east) / 3`. Then `round(that, 1)`. For off_by: `abs(average - target)`, then round it.",
        "`average = round((north + south + east) / 3, 1)`, `off_by = round(abs(average - target), 1)`, then `if off_by <= 1:` ... `else:` ...",
      ],
      solution: r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = min(rows, seed_bags)
tallest = max(north, south, east)
average = round((north + south + east) / 3, 1)
off_by = round(abs(average - target), 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`,
      wrong: [r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = min(rows, seed_bags)
tallest = max(north, south, east)
average = round((north + south + east) / 3, 1)
off_by = round(average - target, 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`, r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = max(rows, seed_bags)
tallest = max(north, south, east)
average = round((north + south + east) / 3, 1)
off_by = round(abs(average - target), 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`, r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = min(rows, seed_bags)
tallest = max(north, south, east)
average = (north + south + east) / 3
off_by = round(abs(average - target), 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`, r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = min(rows, seed_bags)
tallest = max(north, south, east)
average = round(north + south + east / 3, 1)
off_by = round(abs(average - target), 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`, r`rows = 12
seed_bags = 9
north = 14.6
south = 11.2
east = 13.9
target = 13
planted = min(rows, seed_bags)
tallest = 14.6
average = round((north + south + east) / 3, 1)
off_by = round(abs(average - target), 1)
print(f"Rows planted: {planted}")
print(f"Tallest: {tallest} cm")
print(f"Average: {average} cm")
if off_by <= 1:
    print("The wheat is right on time.")
else:
    print("The wheat needs more sun.")`],
      done: "Wren: Thirteen point two! Right on time, swaying like it's listening to music. I may have named a few of them.",
    },
    {
      id: "m13-ledger",
      part: "Fence and cart",
      title: "The Miller's Ledger",
      cost: { wood: 6, stone: 2 },
      intro: [
        "The first sacks of flour are milled! Bram has put in an order, and Wren keeps a ledger, a little book of every sale.",
        "Wren: A good ledger reads like a sentence. \"Sold 1 sacks\" is not a sentence. That's a crime.",
        "Mix your ifs with f-strings: choose the right word **first**, then drop it into the line.",
      ],
      codex: ["else-elif", "fstrings", "min-max"],
      quiz: {
        code: r`n = 1
word = "sacks"
if n == 1:
    word = "sack"
print(f"{n} {word}")`,
        question: "What does this program show?",
        options: ["1 sack", "1 sacks", "{n} {word}", "n word"],
        answer: 0,
        why: "n == 1 is True, so word is changed to \"sack\" before the f-string is printed.",
      },
      task: [
        "`sold`: the smaller of `bram_wants` and `sacks`. `coins`: what Bram pays. `left`: sacks still at the mill.",
        "`word`: `\"sack\"` if `sold` is 1, otherwise `\"sacks\"`.",
        "Print `Sold 5 sacks to Bram for 15 coins.` with an f-string.",
        "Then: if nothing is left, `Nothing left. The cart rolls home empty.`; elif `left` fits in the cart (`cart_holds` or fewer), `3 left over. Into the cart they go.`; otherwise `9 left over. Two cart trips today!` (with the real numbers).",
      ],
      starter: r`sacks = 8          # flour sacks milled today
bram_wants = 5     # sacks Bram ordered
price = 3          # coins per sack
cart_holds = 6     # sacks the cart carries in one trip

# sold  = the smaller of bram_wants and sacks
# coins = what Bram pays
# left  = sacks still at the mill
# word  = "sack" if sold is 1, otherwise "sacks"

# Ledger line 1:  Sold 5 sacks to Bram for 15 coins.
# Ledger line 2:
#   if nothing is left:          Nothing left. The cart rolls home empty.
#   elif left fits in the cart:  3 left over. Into the cart they go.
#   otherwise:                   9 left over. Two cart trips today!
`,
      tests: PRE + r`expect_lines(["Sold 5 sacks to Bram for 15 coins.", "3 left over. Into the cart they go."])
expect_when([("price = 3", "price = 4")], ["Sold 5 sacks to Bram for 20 coins.", "3 left over. Into the cart they go."], "Work out coins from sold and price instead of typing 15.")
expect_when([("bram_wants = 5", "bram_wants = 1")], ["Sold 1 sack to Bram for 3 coins.", "7 left over. Two cart trips today!"], "One sack is \"1 sack\", not \"1 sacks\". Choose word with an if before printing.")
expect_when([("bram_wants = 5", "bram_wants = 12")], ["Sold 8 sacks to Bram for 24 coins.", "Nothing left. The cart rolls home empty."], "You can't sell more than you milled: sold = min(bram_wants, sacks). And check for nothing left first.")
expect_when([("bram_wants = 5", "bram_wants = 2")], ["Sold 2 sacks to Bram for 6 coins.", "6 left over. Into the cart they go."], "6 sacks still fit in a cart that holds 6: left <= cart_holds.")
expect_when([("sacks = 8", "sacks = 20")], ["Sold 5 sacks to Bram for 15 coins.", "15 left over. Two cart trips today!"])`,
      hints: [
        "`sold = min(bram_wants, sacks)`, `coins = sold * price`, `left = sacks - sold`.",
        "Set `word = \"sacks\"`, then `if sold == 1: word = \"sack\"`. Then `print(f\"Sold {sold} {word} to Bram for {coins} coins.\")`",
        "`if left == 0:` empty line, `elif left <= cart_holds:` `print(f\"{left} left over. Into the cart they go.\")`, `else:` the two-trips line.",
      ],
      solution: r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = min(bram_wants, sacks)
coins = sold * price
left = sacks - sold
if sold == 1:
    word = "sack"
else:
    word = "sacks"
print(f"Sold {sold} {word} to Bram for {coins} coins.")
if left == 0:
    print("Nothing left. The cart rolls home empty.")
elif left <= cart_holds:
    print(f"{left} left over. Into the cart they go.")
else:
    print(f"{left} left over. Two cart trips today!")`,
      wrong: [r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = min(bram_wants, sacks)
coins = sold * price
left = sacks - sold
print(f"Sold {sold} sacks to Bram for {coins} coins.")
if left == 0:
    print("Nothing left. The cart rolls home empty.")
elif left <= cart_holds:
    print(f"{left} left over. Into the cart they go.")
else:
    print(f"{left} left over. Two cart trips today!")`, r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = bram_wants
coins = sold * price
left = sacks - sold
if sold == 1:
    word = "sack"
else:
    word = "sacks"
print(f"Sold {sold} {word} to Bram for {coins} coins.")
if left == 0:
    print("Nothing left. The cart rolls home empty.")
elif left <= cart_holds:
    print(f"{left} left over. Into the cart they go.")
else:
    print(f"{left} left over. Two cart trips today!")`, r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = min(bram_wants, sacks)
coins = sold * price
left = sacks - sold
if sold == 1:
    word = "sack"
else:
    word = "sacks"
print(f"Sold {sold} {word} to Bram for {coins} coins.")
if left <= cart_holds:
    print(f"{left} left over. Into the cart they go.")
elif left == 0:
    print("Nothing left. The cart rolls home empty.")
else:
    print(f"{left} left over. Two cart trips today!")`, r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = min(bram_wants, sacks)
coins = sold * price
left = sacks - sold
if sold == 1:
    word = "sack"
else:
    word = "sacks"
print(f"Sold {sold} {word} to Bram for {coins} coins.")
if left == 0:
    print("Nothing left. The cart rolls home empty.")
elif left < cart_holds:
    print(f"{left} left over. Into the cart they go.")
else:
    print(f"{left} left over. Two cart trips today!")`, r`sacks = 8
bram_wants = 5
price = 3
cart_holds = 6
sold = min(bram_wants, sacks)
left = sacks - sold
if sold == 1:
    word = "sack"
else:
    word = "sacks"
print(f"Sold {sold} {word} to Bram for 15 coins.")
if left == 0:
    print("Nothing left. The cart rolls home empty.")
elif left <= cart_holds:
    print(f"{left} left over. Into the cart they go.")
else:
    print(f"{left} left over. Two cart trips today!")`],
      done: "Wren: A fence to keep the rabbits honest, a cart by the door, and a ledger that reads like poetry. Bram's flour is on its way!",
    },
    {
      id: "m14-weather-report",
      part: "Lanterns and sign",
      title: "The Morning Report",
      cost: { wood: 5, stone: 4 },
      intro: [
        "Last piece: a weather vane on the cap, lanterns by the door and a sign with a wheat sheaf. Wren wants the mill to decide its own day, every morning, from the weather.",
        "Wren: If I write it down, I'll lose it. If the rune stone remembers, I'll never have to think before breakfast again.",
        "This uses everything from the mill: if / elif / else, `and` / `or`, string tidying, `min()` and `%`. Take it one line of the report at a time.",
      ],
      codex: ["else-elif", "logic", "min-max", "truthiness"],
      quiz: {
        code: r`sky = "sunny"
if sky == "rainy" or "stormy":
    print("Lanterns lit")
else:
    print("Lanterns out")`,
        question: "What does this program show?",
        options: ["Lanterns lit", "Lanterns out", "(nothing)", "SyntaxError"],
        answer: 0,
        why: "Sneaky! The right side of or is just \"stormy\", a non-empty string, which counts as True. Write the whole comparison twice: sky == \"rainy\" or sky == \"stormy\".",
      },
      task: [
        "`sky`: `weather` with the spaces stripped, in lowercase.",
        "If `sky` is `\"stormy\"` or `wind` is over 40: print `Sails: tied down` and mill nothing. Elif `wind` is 10 or more: print `Sails: turning` and `milled` is the smaller of `grain` and `wind // 2`. Otherwise: print `Sails: resting` and mill nothing.",
        "Print `Milled 11 sacks, 4 left.` using `milled` and `grain`.",
        "Print `Lanterns: lit` if `sky` is `\"rainy\"` or `\"stormy\"`, otherwise `Lanterns: out`.",
        "On even days, finish with `Bread day! Bram gets fresh flour.`",
      ],
      starter: r`weather = "  Windy "   # from the weather vane: sunny, windy, rainy or stormy
wind = 22              # wind speed
grain = 15             # sacks of grain waiting to be milled
day = 4                # day of the week, 1 to 7

# Write the mill's morning report. The task list has every step.
`,
      tests: PRE + r`check("sky" in ns, "Make a variable sky: weather tidied with .strip().lower()")
check(ns["sky"] == "windy", "sky should be \"windy\", but it is " + repr(ns["sky"]) + ". Use weather.strip().lower()")
check("milled" in ns, "Make a variable milled: how many sacks were milled today.")
expect_lines(["Sails: turning", "Milled 11 sacks, 4 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."])
expect_when([('weather = "  Windy "', 'weather = "STORMY"')], ["Sails: tied down", "Milled 0 sacks, 15 left.", "Lanterns: lit", "Bread day! Bram gets fresh flour."], "In a storm the sails are tied down and nothing is milled, whatever the wind. Compare the tidied sky, not weather.")
expect_when([('weather = "  Windy "', 'weather = " rainy"')], ["Sails: turning", "Milled 11 sacks, 4 left.", "Lanterns: lit", "Bread day! Bram gets fresh flour."], "Rain lights the lanterns, but the sails still turn.")
expect_when([("wind = 22", "wind = 50")], ["Sails: tied down", "Milled 0 sacks, 15 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."], "A gale over 40 ties the sails down. Check that before the turning case.")
expect_when([("grain = 15", "grain = 5")], ["Sails: turning", "Milled 5 sacks, 0 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."], "You can't mill more grain than you have: min(grain, wind // 2).")
expect_when([("wind = 22", "wind = 40")], ["Sails: turning", "Milled 15 sacks, 0 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."], "40 is not over 40, so the sails turn: wind > 40.")
expect_when([("wind = 22", "wind = 6")], ["Sails: resting", "Milled 0 sacks, 15 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."], "A light breeze means resting sails and nothing milled.")
expect_when([("wind = 22", "wind = 10")], ["Sails: turning", "Milled 5 sacks, 10 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."], "Wind 10 counts as turning, and mills 10 // 2 = 5 sacks.")
expect_when([("day = 4", "day = 3")], ["Sails: turning", "Milled 11 sacks, 4 left.", "Lanterns: out"], "Day 3 is odd, so no bread line. Even means day % 2 == 0.")
expect_when([("day = 4", "day = 6")], ["Sails: turning", "Milled 11 sacks, 4 left.", "Lanterns: out", "Bread day! Bram gets fresh flour."])`,
      hints: [
        "Start with `sky = weather.strip().lower()`. Then an `if / elif / else` for the sails, setting `milled` in every branch.",
        "Stormy-or-gale goes first: `if sky == \"stormy\" or wind > 40:`. In the turning branch: `milled = min(grain, wind // 2)`. The others: `milled = 0`.",
        "Then `print(f\"Milled {milled} sacks, {grain - milled} left.\")`, `if sky == \"rainy\" or sky == \"stormy\":` for the lanterns, and `if day % 2 == 0:` for bread day.",
      ],
      solution: r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.strip().lower()
if sky == "stormy" or wind > 40:
    print("Sails: tied down")
    milled = 0
elif wind >= 10:
    print("Sails: turning")
    milled = min(grain, wind // 2)
else:
    print("Sails: resting")
    milled = 0
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or sky == "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`,
      wrong: [r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.strip().lower()
if sky == "stormy" or wind > 40:
    print("Sails: tied down")
    milled = 0
elif wind >= 10:
    print("Sails: turning")
    milled = min(grain, wind // 2)
else:
    print("Sails: resting")
    milled = 0
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`, r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.lower()
if sky == "stormy" or wind > 40:
    print("Sails: tied down")
    milled = 0
elif wind >= 10:
    print("Sails: turning")
    milled = min(grain, wind // 2)
else:
    print("Sails: resting")
    milled = 0
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or sky == "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`, r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.strip().lower()
if sky == "stormy" or wind > 40:
    print("Sails: tied down")
    milled = 0
elif wind >= 10:
    print("Sails: turning")
    milled = wind // 2
else:
    print("Sails: resting")
    milled = 0
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or sky == "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`, r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.strip().lower()
if sky == "stormy" or wind >= 40:
    print("Sails: tied down")
    milled = 0
elif wind >= 10:
    print("Sails: turning")
    milled = min(grain, wind // 2)
else:
    print("Sails: resting")
    milled = 0
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or sky == "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`, r`weather = "  Windy "
wind = 22
grain = 15
day = 4
sky = weather.strip().lower()
if sky == "stormy" or wind > 40:
    print("Sails: tied down")
elif wind >= 10:
    print("Sails: turning")
    milled = min(grain, wind // 2)
else:
    print("Sails: resting")
print(f"Milled {milled} sacks, {grain - milled} left.")
if sky == "rainy" or sky == "stormy":
    print("Lanterns: lit")
else:
    print("Lanterns: out")
if day % 2 == 0:
    print("Bread day! Bram gets fresh flour.")`],
      done: "Wren: Lanterns lit, the weather vane spinning, and a sign with a wheat sheaf on it. The Whistling Mill is open! Now, where's that bread...",
    },
  ],
};
