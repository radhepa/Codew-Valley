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
      { p: "A line starts with spaces where it should not (or does not where it should). For now, start every line at the very left edge." },
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
