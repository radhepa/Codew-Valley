import type { CodexPage } from "./types.ts";

// The Codex: the in-game Python book. Every concept a challenge needs is
// explained here, with examples whose output the content tests verify, so a
// player never has to search the web.
const r = String.raw;

export const CODEX: CodexPage[] = [
  {
    id: "print",
    title: "Speaking with print()",
    summary: "Show text on the screen with print().",
    blocks: [
      { p: "Programs talk to you by **printing**. `print()` shows whatever you put inside its parentheses, then moves to a new line." },
      { code: r`print("Good morning, valley!")`, out: "Good morning, valley!" },
      { p: "Text in Python goes inside quotes. The quotes tell Python \"this is text, not a command\". They are not printed." },
      { h: "Several lines" },
      { p: "Each `print()` gives you its own line. Python runs your lines from top to bottom." },
      { code: r`print("Chop wood.")
print("Carry stone.")
print("Build tavern.")`, out: "Chop wood.\nCarry stone.\nBuild tavern." },
      { h: "Printing more than one thing" },
      { p: "Separate things with commas and `print()` puts **one space** between them." },
      { code: r`print("Logs:", 12)`, out: "Logs: 12" },
      { p: "An empty `print()` prints a blank line." },
      { tip: "The spelling matters: `print` is all lowercase, and the parentheses are required. `Print(\"hi\")` or `print \"hi\"` will not work." },
      { code: r`Print("hi")`, err: "NameError" },
    ],
  },
  {
    id: "strings",
    title: "Strings and quotes",
    summary: "Text values, single vs double quotes, and apostrophes.",
    blocks: [
      { p: "A piece of text is called a **string** (a string of characters). You can write it with double quotes `\"...\"` or single quotes `'...'`; both mean the same thing." },
      { code: r`print("Pip")
print('Pip')`, out: "Pip\nPip" },
      { h: "Quotes inside text" },
      { p: "If your text contains an apostrophe, wrap it in **double** quotes. If it contains double quotes, wrap it in **single** quotes." },
      { code: r`print("Pip's lantern")
print('Pip said "hello"')`, out: "Pip's lantern\nPip said \"hello\"" },
      { p: "Using the same quote inside and outside confuses Python, because it thinks the string ended early:" },
      { code: r`print('Pip's lantern')`, err: "SyntaxError" },
      { tip: "Every opening quote needs a matching closing quote of the same kind. Forgetting one gives \"unterminated string literal\"." },
    ],
  },
  {
    id: "comments",
    title: "Comments",
    summary: "Notes for humans that Python ignores.",
    blocks: [
      { p: "Anything after a `#` on a line is a **comment**. Python skips it. Comments are notes to yourself (and to Pip)." },
      { code: r`# This line is ignored
print("Stew is ready")  # so is this part`, out: "Stew is ready" },
      { p: "The challenge starter code uses comments to tell you what to write. You can leave them in or delete them." },
    ],
  },
  {
    id: "variables",
    title: "Variables",
    summary: "Give a value a name so you can use it later.",
    blocks: [
      { p: "A **variable** is a name that holds a value, like a labelled crate in your storehouse. Make one with `=`:" },
      { code: r`logs = 12
print(logs)`, out: "12" },
      { p: "Read `logs = 12` as \"logs **gets** 12\". The name goes on the left, the value on the right." },
      { h: "Names vs text" },
      { p: "Without quotes, Python looks up the variable. With quotes, it is just text." },
      { code: r`logs = 12
print(logs)
print("logs")`, out: "12\nlogs" },
      { h: "Rules for names" },
      { p: "Names use letters, digits and underscores, and cannot start with a digit. Use lowercase words joined by underscores: `stone_count`, `tavern_name`. Capitals matter: `Logs` and `logs` are different variables." },
      { p: "Using a name you never created gives a `NameError`:" },
      { code: r`print(planks)`, err: "NameError" },
      { tip: "Numbers do not need quotes. `nails = 60` is a number you can do maths with; `nails = \"60\"` is text that only looks like a number." },
    ],
  },
  {
    id: "math",
    title: "Numbers and maths",
    summary: "+ - * / // % and changing a variable's value.",
    blocks: [
      { p: "Python is a very fast abacus. These are the maths operators:" },
      { code: r`print(7 + 2)
print(7 - 2)
print(7 * 2)
print(7 / 2)
print(7 // 2)
print(7 % 2)`, out: "9\n5\n14\n3.5\n3\n1" },
      { p: "`*` multiplies. `/` divides and always gives a decimal (a **float**). `//` divides and throws away the remainder (floor division). `%` gives just the **remainder**." },
      { p: "So 17 logs split into carts of 5 is `17 // 5` = 3 full carts, with `17 % 5` = 2 logs left over." },
      { h: "Changing a variable" },
      { p: "A variable can be given a new value at any time. The right side is worked out first, using the old value:" },
      { code: r`wood = 10
wood = wood + 5
print(wood)`, out: "15" },
      { p: "There is a shortcut for this: `+=`, `-=`, `*=`." },
      { code: r`stone = 9
stone -= 4
print(stone)`, out: "5" },
      { h: "Order of operations" },
      { p: "Like school maths: `*` and `/` happen before `+` and `-`. Use parentheses to choose the order." },
      { code: r`print(2 + 3 * 4)
print((2 + 3) * 4)`, out: "14\n20" },
      { tip: "Dividing by zero is impossible, and Python says so with a `ZeroDivisionError`." },
    ],
  },
  {
    id: "concat",
    title: "Joining strings",
    summary: "Glue strings together with + and repeat them with *.",
    blocks: [
      { p: "`+` between two strings joins them (this is called **concatenation**). It does not add spaces for you." },
      { code: r`first = "Oak"
second = "barrel"
print(first + second)
print(first + " " + second)`, out: "Oakbarrel\nOak barrel" },
      { p: "`*` repeats a string:" },
      { code: r`print("ha" * 3)`, out: "hahaha" },
      { h: "Strings and numbers do not mix with +" },
      { p: "Python refuses to `+` a string and a number, because it cannot guess whether you want maths or gluing:" },
      { code: r`print("Logs: " + 12)`, err: "TypeError" },
      { p: "Turn the number into text first with `str()` (see **Types and converting**), or use a comma in `print()`, or an f-string." },
      { code: r`print("Logs: " + str(12))`, out: "Logs: 12" },
    ],
  },
  {
    id: "fstrings",
    title: "f-strings",
    summary: "Put variables straight into text with f\"...{name}...\".",
    blocks: [
      { p: "Put an `f` right before the opening quote and you can drop values into the text with curly braces `{}`. It works with numbers too, no `str()` needed." },
      { code: r`name = "Pip"
logs = 12
print(f"{name} carried {logs} logs.")`, out: "Pip carried 12 logs." },
      { p: "Anything inside the braces is worked out first, even maths:" },
      { code: r`price = 3
print(f"Two stews cost {price * 2} coins.")`, out: "Two stews cost 6 coins." },
      { p: "Forget the `f` and the braces are printed as they are:" },
      { code: r`name = "Pip"
print("Hello {name}")`, out: "Hello {name}" },
      { tip: "f-strings are the clearest way to build a sentence out of variables. Most Python programmers use them every day." },
    ],
  },
  {
    id: "types",
    title: "Types and converting",
    summary: "int, float, str, bool, and int() / str() / float().",
    blocks: [
      { p: "Every value has a **type**. The main ones you have met:" },
      { code: r`print(type(12))
print(type(3.5))
print(type("12"))
print(type(True))`, out: "<class 'int'>\n<class 'float'>\n<class 'str'>\n<class 'bool'>" },
      { p: "`int` is a whole number, `float` a decimal number, `str` a string of text, `bool` is `True` or `False`." },
      { h: "Converting" },
      { p: "`int()`, `float()` and `str()` make a new value of that type:" },
      { code: r`panes = "6"
print(int(panes) + 4)
print(float("2.5") * 2)
print("Panes: " + str(10))`, out: "10\n5.0\nPanes: 10" },
      { p: "Notice `\"6\" + \"4\"` would be `\"64\"`: strings are glued, not added. Convert first when you want maths." },
      { code: r`print("6" + "4")
print(int("6") + int("4"))`, out: "64\n10" },
      { p: "`int()` only works on text that really is a whole number:" },
      { code: r`int("six")`, err: "ValueError" },
      { tip: "`int(3.9)` chops off the decimal and gives `3`. It does not round." },
    ],
  },
  {
    id: "string-methods",
    title: "String methods",
    summary: ".upper() .lower() .title() .strip() .replace() and friends.",
    blocks: [
      { p: "A **method** is a function that belongs to a value. You call it with a dot: `value.method()`. Strings have lots of handy ones." },
      { code: r`sign = "sleepy serpent"
print(sign.upper())
print(sign.title())
print("LOUD".lower())`, out: "SLEEPY SERPENT\nSleepy Serpent\nloud" },
      { h: "Cleaning up text" },
      { p: "`.strip()` removes spaces (and blank lines) from both ends. `.replace(old, new)` swaps every `old` for `new`." },
      { code: r`messy = "   stew   "
print("[" + messy.strip() + "]")
print("mead and mead".replace("mead", "cider"))`, out: "[stew]\ncider and cider" },
      { h: "Methods make a new string" },
      { p: "Strings never change. A method gives you back a **new** string, so save it in a variable if you want to keep it:" },
      { code: r`word = "stew"
word.upper()
print(word)
word = word.upper()
print(word)`, out: "stew\nSTEW" },
      { p: "You can chain methods, left to right:" },
      { code: r`print("  hello  ".strip().title())`, out: "Hello" },
      { tip: "Other useful ones: `.startswith(\"x\")`, `.endswith(\"x\")`, `.count(\"x\")`, `.find(\"x\")`. Methods need the parentheses even when empty: `sign.upper()`, not `sign.upper`." },
    ],
  },
  {
    id: "indexing",
    title: "Length, indexing and slicing",
    summary: "len(), s[0], s[-1], s[1:4].",
    blocks: [
      { p: "`len()` tells you how many characters a string has (spaces count too)." },
      { code: r`print(len("Pip"))
print(len("oak log"))`, out: "3\n7" },
      { h: "Indexing" },
      { p: "Each character has a position called an **index**, and counting starts at **0**. Use square brackets to grab one:" },
      { code: r`word = "STEW"
print(word[0])
print(word[1])`, out: "S\nT" },
      { p: "Negative indexes count from the end: `[-1]` is the last character, `[-2]` the one before it." },
      { code: r`word = "STEW"
print(word[-1])`, out: "W" },
      { p: "Asking for a position that does not exist gives an `IndexError`:" },
      { code: r`print("STEW"[10])`, err: "IndexError" },
      { h: "Slicing" },
      { p: "`word[start:stop]` takes characters from `start` up to **but not including** `stop`. Leave a side empty to go from the beginning or to the end." },
      { code: r`word = "LANTERN"
print(word[0:4])
print(word[:3])
print(word[4:])`, out: "LANT\nLAN\nERN" },
      { tip: "`word[:3]` is always the first three characters, and `word[-3:]` the last three." },
    ],
  },
  {
    id: "booleans",
    title: "True, False and comparisons",
    summary: "== != < > <= >= and, or, not.",
    blocks: [
      { p: "A **boolean** is either `True` or `False` (capital first letter, no quotes). Comparisons produce booleans:" },
      { code: r`print(5 > 3)
print(5 < 3)
print(4 == 4)
print(4 != 4)
print(6 >= 6)`, out: "True\nFalse\nTrue\nFalse\nTrue" },
      { p: "`==` asks \"are these equal?\". A single `=` is different: it **stores** a value in a variable." },
      { code: r`oil = 7
enough = oil >= 5
print(enough)`, out: "True" },
      { h: "and, or, not" },
      { p: "`and` is `True` only when both sides are. `or` is `True` when at least one side is. `not` flips a boolean." },
      { code: r`night = True
oil = 0
print(night and oil > 0)
print(night or oil > 0)
print(not night)`, out: "False\nTrue\nFalse" },
      { p: "Strings can be compared too. Capitals matter:" },
      { code: r`print("pip" == "Pip")`, out: "False" },
      { tip: "Write the comparison itself, like `full = guests >= 8`, instead of typing `True`. Then the answer stays right when the numbers change." },
    ],
  },
  {
    id: "comparisons",
    title: "Comparing values",
    summary: "== != < > <= >=, = vs ==, and comparing text.",
    blocks: [
      { p: "A **comparison** asks Python a yes-or-no question. The answer is always `True` or `False`." },
      { code: r`wind = 14
print(wind > 10)
print(wind == 14)
print(wind != 14)
print(wind <= 13)`, out: "True\nTrue\nFalse\nFalse" },
      { p: "The six comparison operators: `==` equal, `!=` not equal, `<` less than, `>` greater than, `<=` less than or equal, `>=` greater than or equal." },
      { tip: "Say them out loud: `>=` is \"at least\", `<=` is \"at most\". \"10 or more\" is `>= 10`, but \"more than 10\" is `> 10`. That one-number difference is the most common bug in the valley." },
      { h: "= stores, == compares" },
      { p: "One `=` puts a value in a variable. Two `==` asks whether two values are equal. Mixing them up inside an `if` is a `SyntaxError`:" },
      { code: r`wind = 10
if wind = 10:
    print("Ten!")`, err: "SyntaxError" },
      { p: "A comparison is a value of its own, so you can store it:" },
      { code: r`stakes = 8
ring_done = stakes == 8
print(ring_done)`, out: "True" },
      { h: "Comparing text" },
      { p: "Strings can be compared with `==` too, but every character must match, **capitals included**. Tidy text with `.strip()` and `.lower()` before comparing:" },
      { code: r`word = "Wheat"
print(word == "wheat")
print(word.lower() == "wheat")
spoken = "  WHEAT "
print(spoken.strip().lower() == "wheat")`, out: "False\nTrue\nTrue" },
      { p: "`<` and `>` on strings compare in dictionary order:" },
      { code: r`print("apple" < "barley")`, out: "True" },
      { h: "Numbers and text are never equal" },
      { p: "The number `5` and the text `\"5\"` are different things, so `==` says `False`. And asking which is bigger is an error:" },
      { code: r`print(5 == "5")`, out: "False" },
      { code: r`print(5 < "6")`, err: "TypeError" },
    ],
  },
  {
    id: "if",
    title: "if: making a decision",
    summary: "Run some lines only when a condition is True.",
    blocks: [
      { p: "An **if statement** lets your program choose. If the condition is `True`, the indented lines under it run. If it's `False`, Python skips them." },
      { code: r`stone = 12
if stone >= 10:
    print("Enough stone!")
print("Done checking.")`, out: "Enough stone!\nDone checking." },
      { p: "Change the stone and the indented line is skipped, but the last line still runs, because it isn't indented:" },
      { code: r`stone = 4
if stone >= 10:
    print("Enough stone!")
print("Done checking.")`, out: "Done checking." },
      { h: "The parts of an if" },
      { p: "`if`, then a condition, then a **colon** `:`. The lines that belong to the if go underneath, each indented by **four spaces**. That indented group is called a **block**." },
      { p: "A block can hold as many lines as you like, including ones that change variables:" },
      { code: r`stone = 12
needed = 10
if stone >= needed:
    print("Laying the plinth.")
    stone = stone - needed
print(f"Stone left: {stone}")`, out: "Laying the plinth.\nStone left: 2" },
      { h: "Forgetting the colon" },
      { p: "Without the colon, Python stops with `expected ':'`:" },
      { code: r`wind = 12
if wind > 10
    print("Windy!")`, err: "SyntaxError" },
      { tip: "Read an if out loud: \"if stone is at least needed, then...\". The colon is the \"then\"." },
    ],
  },
  {
    id: "else-elif",
    title: "else and elif",
    summary: "Two choices with else, many choices with elif. Order matters.",
    blocks: [
      { p: "`else:` gives the if a second path. It has **no condition**: it runs whenever the if's condition was `False`. Exactly one of the two blocks runs." },
      { code: r`hours = 2
if hours >= 4:
    print("Stack the stones.")
else:
    print("Wait for the mortar.")`, out: "Wait for the mortar." },
      { p: "`else:` lines up with its `if` (same indentation), and its own lines are indented under it." },
      { h: "elif: more than two choices" },
      { p: "`elif` means \"else, if\". Python checks each condition from the top and runs only the **first** block whose condition is `True`. Everything after that is skipped. The final `else` catches whatever is left." },
      { code: r`wind = 18
if wind >= 30:
    print("Too windy!")
elif wind >= 15:
    print("Work inside.")
else:
    print("Raise the band.")`, out: "Work inside." },
      { h: "Order matters" },
      { p: "Because only the first True branch runs, put the most specific (or most extreme) case first. Here a gale of 35 stops at the first check, which is the wrong one:" },
      { code: r`wind = 35
if wind >= 15:
    print("Work inside.")
elif wind >= 30:
    print("Too windy!")`, out: "Work inside." },
      { h: "elif vs separate ifs" },
      { p: "Two separate `if`s are two separate questions, and both can run. Use `elif` when only **one** answer should happen:" },
      { code: r`wind = 35
if wind >= 30:
    print("Too windy!")
if wind >= 15:
    print("Work inside.")`, out: "Too windy!\nWork inside." },
      { h: "Choosing a value" },
      { p: "Branches can set a variable, then you use it afterwards. Handy for getting a word just right:" },
      { code: r`n = 1
if n == 1:
    word = "sack"
else:
    word = "sacks"
print(f"{n} {word}")`, out: "1 sack" },
      { tip: "Python spells it `elif`. Writing `else if` is a `SyntaxError`, and so is giving `else` a condition." },
      { code: r`x = 5
if x > 9:
    print("big")
else if x > 3:
    print("medium")`, err: "SyntaxError" },
    ],
  },
  {
    id: "logic",
    title: "and, or, not",
    summary: "Combine conditions, flip them, and avoid the or trap.",
    blocks: [
      { p: "`and` is `True` only when **both** sides are True. `or` is `True` when **at least one** side is. `not` flips True and False." },
      { code: r`raining = False
wind = 30
print(raining or wind > 25)
print(raining and wind > 25)
print(not raining)`, out: "True\nFalse\nTrue" },
      { p: "They are most useful inside an if:" },
      { code: r`hour = 19
candles = 3
if hour >= 18 and candles > 0:
    print("Light a candle.")`, out: "Light a candle." },
      { h: "not" },
      { p: "`if not ready:` reads like English and runs when `ready` is False. `not` happens before `and`, and `and` before `or`. Use brackets to make your meaning clear:" },
      { code: r`print(not True and False)
print(not (True and False))`, out: "False\nTrue" },
      { code: r`railing_done = True
boards = 10
ready = railing_done and boards >= 16
if not ready:
    print("Keep off!")`, out: "Keep off!" },
      { h: "The or trap" },
      { p: "Each side of `or` must be a whole condition. This looks right but is not:" },
      { code: r`sky = "sunny"
if sky == "rainy" or "stormy":
    print("Lanterns lit")`, out: "Lanterns lit" },
      { p: "Python reads it as `(sky == \"rainy\") or (\"stormy\")`, and a non-empty string counts as True (see **Truthiness**). Repeat the comparison on both sides:" },
      { code: r`sky = "sunny"
if sky == "rainy" or sky == "stormy":
    print("Lanterns lit")
else:
    print("Lanterns out")`, out: "Lanterns out" },
      { tip: "Same with and: write `hour >= 18 and candles > 0`, never `hour >= 18 and > 0`." },
    ],
  },
  {
    id: "in",
    title: "in: looking inside text",
    summary: "\"tar\" in cart, not in, and the substring surprise.",
    blocks: [
      { p: "`in` checks whether one piece of text appears **anywhere inside** another. `not in` asks the opposite." },
      { code: r`cart = "shingles, nails, rope"
print("nails" in cart)
print("tar" in cart)
print("tar" not in cart)`, out: "True\nFalse\nTrue" },
      { p: "It is great in an if:" },
      { code: r`cart = "oats, honey"
if "honey" in cart:
    print("Sweet!")`, out: "Sweet!" },
      { h: "Capitals matter" },
      { code: r`cart = "shingles, nails, rope"
print("Nails" in cart)
print("nails" in cart.lower())`, out: "False\nTrue" },
      { h: "The substring surprise" },
      { p: "`in` looks for the **letters**, not whole words. \"star\" has \"tar\" hiding inside it:" },
      { code: r`print("tar" in "star anise")`, out: "True" },
      { tip: "`in` works on lists too, and there it does match whole items. You'll meet lists at the Market Square." },
    ],
  },
  {
    id: "nested-if",
    title: "Nested ifs",
    summary: "An if inside an if, and which else belongs to which.",
    blocks: [
      { p: "A block can contain another if. The inner question is only asked when the outer one was True. That's a **nested if**." },
      { code: r`brake_on = False
grease = 1
if not brake_on:
    if grease >= 2:
        print("Turns smoothly.")
    else:
        print("Squeak!")
else:
    print("Brake is on.")`, out: "Squeak!" },
      { p: "Look at the indentation levels: the outer `if`/`else` start at the edge, the inner `if`/`else` are 4 spaces in, and the inner prints are 8 spaces in." },
      { h: "Which if does an else belong to?" },
      { p: "An `else` belongs to the `if` it lines up with. Move it and the meaning changes completely. Here the else belongs to the **outer** if, so with grease 1 nothing prints at all:" },
      { code: r`brake_on = False
grease = 1
if not brake_on:
    if grease >= 2:
        print("Turns smoothly.")
else:
    print("Squeak!")`, out: "" },
      { tip: "Nesting is great when one question only makes sense after another. If the levels get deep, an `and` or an `elif` chain is often flatter and easier to read." },
    ],
  },
  {
    id: "truthiness",
    title: "Truthiness and even numbers",
    summary: "0 and \"\" count as False; % 2 tells even from odd.",
    blocks: [
      { p: "An if doesn't need a comparison. Any value can be used as a condition. `0`, `0.0` and the empty string `\"\"` count as **False**; every other number and string counts as **True**. `bool()` shows you how a value counts:" },
      { code: r`print(bool(0))
print(bool(7))
print(bool(""))
print(bool("Pip"))`, out: "False\nTrue\nFalse\nTrue" },
      { p: "So `if helper:` means \"if there is a helper\":" },
      { code: r`helper = ""
if helper:
    print(f"{helper} holds the ladder.")
else:
    print("Nobody holds the ladder.")`, out: "Nobody holds the ladder." },
      { h: "Don't compare with True" },
      { p: "A name is truthy, but it is not **equal** to `True`:" },
      { code: r`helper = "Pip"
print(helper == True)
print(bool(helper))`, out: "False\nTrue" },
      { p: "Just write `if helper:`, never `if helper == True:`." },
      { h: "Even or odd" },
      { p: "`%` gives the remainder of a division. Even numbers leave remainder 0 when divided by 2, odd numbers leave 1:" },
      { code: r`print(6 % 2)
print(7 % 2)`, out: "0\n1" },
      { code: r`cloths = 7
if cloths % 2 == 0:
    print("Even")
else:
    print("Odd")`, out: "Odd" },
      { tip: "The same trick works for any \"every Nth\": `day % 7 == 0` is True on every seventh day." },
    ],
  },
  {
    id: "chained",
    title: "Chained comparisons",
    summary: "Check a range in one go: 30 <= x <= 60.",
    blocks: [
      { p: "To check that a value is between two others, Python lets you **chain** comparisons, just like in maths:" },
      { code: r`moisture = 45
print(30 <= moisture <= 60)
print(30 <= 75 <= 60)`, out: "True\nFalse" },
      { p: "`30 <= x <= 60` means exactly the same as `30 <= x and x <= 60`:" },
      { code: r`x = 45
print(30 <= x and x <= 60)`, out: "True" },
      { h: "Is the edge included?" },
      { p: "`<=` includes the edge, `<` doesn't. Pick carefully when the task says \"from 30 to 60\":" },
      { code: r`x = 30
print(30 < x < 60)
print(30 <= x <= 60)`, out: "False\nTrue" },
      { h: "A chain that doesn't mean what it looks like" },
      { p: "Keep the variable in the **middle**. This one really means `x >= 30 and 30 <= 60`, so any big number passes:" },
      { code: r`x = 99
print(x >= 30 <= 60)`, out: "True" },
      { tip: "Write ranges small-to-big, left-to-right: `low <= x <= high`. It reads like a number line." },
    ],
  },
  {
    id: "min-max",
    title: "min, max, abs and round",
    summary: "Built-in helpers for deciding with numbers.",
    blocks: [
      { p: "`min()` gives the smallest of its values and `max()` the biggest. They take as many values as you like." },
      { code: r`print(min(12, 9))
print(max(14.6, 11.2, 13.9))`, out: "9\n14.6" },
      { p: "`min` is perfect for limits: you can only sell what you have, so `sold = min(wanted, stock)`." },
      { code: r`wanted = 12
stock = 8
sold = min(wanted, stock)
print(sold)`, out: "8" },
      { h: "abs: distance from zero" },
      { p: "`abs()` drops the minus sign. Use it for \"how far apart\", when you don't care which is bigger:" },
      { code: r`print(abs(-4))
print(abs(4))
print(abs(11 - 13))`, out: "4\n4\n2" },
      { h: "round" },
      { p: "`round(x)` rounds to a whole number. `round(x, 1)` keeps 1 decimal place." },
      { code: r`print(round(13.2333, 1))
print(round(7.8))`, out: "13.2\n8" },
      { p: "Brackets first when you take an average, then round:" },
      { code: r`a = 14.6
b = 11.2
c = 13.9
average = round((a + b + c) / 3, 1)
print(average)`, out: "13.2" },
      { h: "Deciding with them" },
      { code: r`target = 13
average = 11.2
off_by = round(abs(average - target), 1)
if off_by <= 1:
    print("On time")
else:
    print(f"Off by {off_by}")`, out: "Off by 1.8" },
      { tip: "Halfway numbers round to the nearest **even** number: `round(2.5)` is 2 and `round(3.5)` is 4. Python does this on purpose so totals don't drift upward." },
      { code: r`print(round(2.5))
print(round(3.5))`, out: "2\n4" },
    ],
  },
  {
    id: "indentation",
    title: "Indentation",
    summary: "How Python knows which lines belong inside an if.",
    blocks: [
      { p: "The spaces at the start of a line are called **indentation**. Python uses them to know which lines belong to an if (or an else, or an elif). Indented lines are inside; the first line back at the edge is outside again." },
      { code: r`x = 5
if x > 3:
    print("inside")
    print("also inside")
print("outside")`, out: "inside\nalso inside\noutside" },
      { p: "The usual indent is **four spaces**. In the workbench, the Tab key puts in four spaces for you." },
      { h: "A colon needs an indented block" },
      { p: "Every line that ends in `:` must be followed by at least one indented line:" },
      { code: r`if True:
print("hi")`, err: "IndentationError" },
      { h: "Indenting where you shouldn't" },
      { p: "A line indented for no reason is an \"unexpected indent\":" },
      { code: r`print("a")
    print("b")`, err: "IndentationError" },
      { h: "Lining up" },
      { p: "All lines in one block must start at the same column. Going back out must land exactly on an earlier level:" },
      { code: r`if True:
    print("a")
  print("b")`, err: "IndentationError" },
      { tip: "Colons and indents come in pairs: a line ending with `:` opens a block, and the block ends where the indentation goes back. Mixing tabs and spaces confuses Python too (a `TabError`), so stick to spaces." },
    ],
  },
  {
    id: "errors",
    title: "Reading error messages",
    summary: "What NameError, SyntaxError, TypeError and friends mean.",
    blocks: [
      { p: "Errors are not failures, they are Python pointing at the problem. Read the **last line** first: it names the error type and gives a message. The line number tells you where to look." },
      { h: "SyntaxError" },
      { p: "Python could not even read your code: a missing quote, bracket or colon, or a typo in the grammar. Check the line it points to and the line just above." },
      { code: r`print("hello"`, err: "SyntaxError" },
      { h: "NameError" },
      { p: "You used a name Python does not know. Usually a typo, a missing quote around text, or using a variable before creating it." },
      { code: r`print(helo)`, err: "NameError" },
      { h: "TypeError" },
      { p: "You used a value the wrong way for its type, such as adding text to a number." },
      { code: r`print("Stew: " + 4)`, err: "TypeError" },
      { h: "ValueError" },
      { p: "The type is right but the value is not, such as `int(\"ten\")`." },
      { code: r`int("ten")`, err: "ValueError" },
      { h: "IndentationError" },
      { p: "A line starts with spaces where it should not, or does not where it should. Lines inside an if are indented four spaces; every other line starts at the left edge. See **Indentation**." },
      { code: r`print("a")
    print("b")`, err: "IndentationError" },
      { h: "IndexError" },
      { p: "You asked for a position past the end of a string or list." },
      { code: r`print("abc"[5])`, err: "IndexError" },
      { tip: "In the workbench, Pip translates every error into plain words and points at the line. Fix one error at a time, then run again." },
    ],
  },
];

export const codexById = new Map(CODEX.map((p) => [p.id, p]));
