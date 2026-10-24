import type { CodexPage } from "../types.ts";

// Codex pages for Apothecary and Herb Garden (building 8): split / join, tuples, sets and try / except.
// Page ids must be unique across the whole Codex (content tests check).
// Examples use bakery, dock and market things, never the garden's own tasks (CHALLENGES.md).
const r = String.raw;

export const APOTHECARY_PAGES: CodexPage[] = [
  {
    id: "split-join",
    title: "Splitting and joining text",
    summary: "Cut a string into a list with .split(), and glue a list into a string with .join().",
    blocks: [
      { p: "A sentence is one string: to Python, `\"three brown hens\"` is just letters and spaces in a row. **`.split()`** cuts a string into a **list** of pieces, so you can count them, loop over them and pick them out by position." },
      { code: r`words = "  three  brown hens ".split()
print(words)
print(len(words))`, out: "['three', 'brown', 'hens']\n3" },
      { p: "With **empty brackets**, `.split()` cuts at every stretch of spaces, however long, and ignores the spaces at both ends. You never get an empty piece." },
      { h: "Cutting somewhere else" },
      { p: "Put a separator in the brackets and Python cuts **only** there. Everything between the cuts is kept exactly as it was, spaces and all." },
      { code: r`print("rye, oat ,barley".split(","))`, out: "['rye', ' oat ', 'barley']" },
      { p: "So the pieces often need tidying. `.strip()` tidies one string at a time, so each piece needs its own." },
      { code: r`print(" oat ".strip() + "cakes")`, out: "oatcakes" },
      { tip: "`.split(\" \")` (with one space inside) is not the same as `.split()`. It cuts at every single space, so two spaces side by side leave an empty string `''` between them." },
      { code: r`print("a  b".split(" "))
print("a  b".split())`, out: "['a', '', 'b']\n['a', 'b']" },
      { h: "Joining" },
      { p: "**`.join()`** goes the other way: it glues a list of strings into one string. It is written glue-first: the string you want *between* the pieces, then `.join(`, then the list." },
      { code: r`print(" + ".join(["flour", "water", "salt"]))
print("".join(["r", "y", "e"]))`, out: "flour + water + salt\nrye" },
      { p: "The glue only goes *between* pieces, never before the first or after the last. A list with one piece gives just that piece, and an empty list gives an empty string." },
      { code: r`print("-".join(["solo"]))
print(len("-".join([])))`, out: "solo\n0" },
      { tip: "`join` only glues strings. A list of numbers gives a `TypeError`; turn them into text with `str()` first." },
      { code: r`print(", ".join([3, 4]))`, err: "TypeError" },
      { p: "Splitting and joining undo each other, which makes a handy way to change the gaps in a sentence:" },
      { code: r`print("-".join("warm crusty loaf".split()))`, out: "warm-crusty-loaf" },
    ],
  },
  {
    id: "parsing",
    title: "Pulling numbers out of text",
    summary: "Text that looks like a number is still text: cut it out, then int() it.",
    blocks: [
      { p: "People write numbers inside sentences: `\"loaves 12\"`, `\"crew of 3\"`. To Python those digits are still **text**, and text adds up by gluing." },
      { code: r`print("3" + "4")
print(int("3") + int("4"))`, out: "34\n7" },
      { p: "**Parsing** means pulling the useful bits out of a line of text. Usually it goes: cut the line into pieces, pick the piece you want, then turn it into a number." },
      { code: r`order = "loaves 12"
parts = order.split()
print(parts)
print(int(parts[1]) * 2)`, out: "['loaves', '12']\n24" },
      { p: "`int()` doesn't mind spaces at the ends of the text, so a piece straight from a split is fine." },
      { code: r`print(int(" 12 ") + 1)`, out: "13" },
      { h: "Lines inside lines" },
      { p: "A line can hold several entries. Cut it at the big separator first (the commas), then cut each entry again at its spaces." },
      { code: r`line = "rye 2, spelt 5"
for entry in line.split(","):
    print(entry.split())`, out: "['rye', '2']\n['spelt', '5']" },
      { h: "When the text isn't a number" },
      { p: "`int()` only takes whole numbers. Words, empty text and decimals give a `ValueError`. (`float()` reads decimals.) To keep going when a piece can't be read, see **Catching errors with try / except**." },
      { code: r`print(int("4.5"))`, err: "ValueError" },
      { code: r`print(float("4.5") * 2)`, out: "9.0" },
    ],
  },
  {
    id: "tuples",
    title: "Tuples: lists that can't change",
    summary: "Round brackets, read like a list, but fixed once made.",
    blocks: [
      { p: "A **tuple** is a collection written with **round brackets**. You read it just like a list: by index (from 0, or negative from the end), with `len()`, with `in` and with a `for` loop." },
      { code: r`oven = ("bread oven", 220, 40)
print(oven[0])
print(oven[-1])
print(len(oven))`, out: "bread oven\n40\n3" },
      { h: "Why can't it change?" },
      { p: "Once a tuple is made, nothing in it can be changed, added or taken away. That's the point: some things should stay fixed, like a recipe, a spot on a map, or a pair that belongs together. Nobody can spoil them by accident." },
      { code: r`oven = ("bread oven", 220, 40)
oven[1] = 250`, err: "TypeError" },
      { p: "The error says *'tuple' object does not support item assignment*: you tried to put something into a tuple." },
      { h: "Making a different one" },
      { p: "To get a tuple with other values, build a **new** one from the old one's parts. The old tuple is left exactly as it was." },
      { code: r`spot = (3, 7)
moved = (spot[0] + 1, spot[1])
print(spot, moved)`, out: "(3, 7) (4, 7)" },
      { tip: "`+` and `*` on a whole tuple work like they do on strings: they glue and repeat, they don't do sums on each item." },
      { code: r`print((1, 2) * 2)
print((1, 2) + (3,))`, out: "(1, 2, 1, 2)\n(1, 2, 3)" },
      { p: "A tuple with just one thing needs a comma, `(5,)`, because `(5)` is just the number 5 in brackets. And `list()` turns a tuple into a list when you really do need to change things." },
      { code: r`print(type((5)), type((5,)))
print(list(("a", "b")))`, out: "<class 'int'> <class 'tuple'>\n['a', 'b']" },
    ],
  },
  {
    id: "unpacking",
    title: "Unpacking, swapping and returning two values",
    summary: "a, b = pair; a, b = b, a; for x, y in pairs; return one, two.",
    blocks: [
      { p: "**Unpacking** takes a tuple (or a list) apart into separate names in one go. Put as many names on the left as there are things on the right." },
      { code: r`boat = ("Heron", 3)
name, crew = boat
print(name, "has a crew of", crew)`, out: "Heron has a crew of 3" },
      { p: "The count must match exactly. Too many or too few pieces is a `ValueError`, and that includes the pieces from a split:" },
      { code: r`first, second = "one two three".split()`, err: "ValueError" },
      { h: "Telling the pieces apart" },
      { p: "A pair can hold different kinds of value, like a name and a number. `type(value) == int` asks whether a value is a whole number, so you can tell which piece is which." },
      { code: r`stall = ("pears", 6)
fruit, count = stall
print(type(fruit) == int, type(count) == int)`, out: "False True" },
      { h: "Swapping" },
      { p: "Two names can trade values in one line. Python works out the whole right side first, then unpacks it into the left." },
      { code: r`left = "oar"
right = "net"
left, right = right, left
print(left, right)`, out: "net oar" },
      { h: "Unpacking in a for loop" },
      { p: "When a list holds pairs, the loop can unpack each pair as it goes:" },
      { code: r`catches = [("perch", 4), ("eel", 1)]
for fish, count in catches:
    print(fish, "x", count)`, out: "perch x 4\neel x 1" },
      { h: "Returning two values" },
      { p: "A function can give back two (or more) values at once: `return a, b`. Really it returns one tuple, which the caller can unpack." },
      { code: r`def coldest_warmest(temps):
    return min(temps), max(temps)

low, high = coldest_warmest([12, 9, 15])
print(low, high)
print(coldest_warmest([4, 8]))`, out: "9 15\n(4, 8)" },
      { tip: "The caller decides the names: `cold, warm = coldest_warmest(...)` works just as well. What matters is the order the function returns them in." },
    ],
  },
  {
    id: "sets",
    title: "Sets: one of each",
    summary: "A collection with no repeats and no order: set(), .add(), in, len().",
    blocks: [
      { p: "A **set** holds each thing at most **once**. Add something that's already there and nothing changes. `set(a_list)` makes a set from a list, dropping the repeats." },
      { code: r`birds = set(["wren", "robin", "wren", "owl", "robin"])
print(len(birds))
print("owl" in birds)`, out: "3\nTrue" },
      { p: "Sets are written with curly brackets, `{\"wren\", \"owl\"}`. They have **no order**: they may print in any order, and there's no `[0]`. `sorted()` gives you their items as a list, in order." },
      { code: r`birds = {"wren", "robin", "owl"}
print(sorted(birds))`, out: "['owl', 'robin', 'wren']" },
      { code: r`birds = {"wren", "robin", "owl"}
print(birds[0])`, err: "TypeError" },
      { h: "Adding" },
      { p: "`.add()` puts one thing in. Start an empty set with **`set()`**: empty curly brackets `{}` make an empty *dictionary*, not a set." },
      { code: r`seen = set()
seen.add("heron")
seen.add("heron")
seen.add("kingfisher")
print(len(seen))
print(type({}), type(set()))`, out: "2\n<class 'dict'> <class 'set'>" },
      { tip: "A set only spots repeats that are *exactly* the same. `\"Owl\"` and `\"owl \"` are two different strings, so tidy text before it goes in." },
      { code: r`print(len({"owl", "Owl", "owl "}))`, out: "3" },
      { p: "A `for` loop visits every item of a set, in no particular order. Loop over `sorted(...)` when the order matters." },
    ],
  },
  {
    id: "set-ops",
    title: "Comparing sets: & | -",
    summary: "What's in both, in either, or in one but not the other.",
    blocks: [
      { p: "Two sets can be compared in one stroke. Picture two overlapping circles:" },
      { p: "**`a & b`**: what's in **both** (the overlap). **`a | b`**: everything in **either** (both circles). **`a - b`**: what's in `a` but **not** in `b`." },
      { code: r`monday = {"rye", "oat", "spelt"}
tuesday = {"oat", "barley"}
print(sorted(monday & tuesday))
print(sorted(monday | tuesday))
print(sorted(monday - tuesday))
print(sorted(tuesday - monday))`, out: "['oat']\n['barley', 'oat', 'rye', 'spelt']\n['rye', 'spelt']\n['barley']" },
      { tip: "With `-`, order matters: you keep from the set on the **left**. `&` and `|` give the same answer either way round." },
      { p: "Each answer is a new set; the two sets you started with don't change. `len()` of a `|` counts every thing once, even if it was in both." },
      { code: r`a = {1, 2, 3}
b = {3, 4}
print(len(a) + len(b), len(a | b))`, out: "5 4" },
      { h: "Lists first become sets" },
      { p: "Lists can't do any of this. Turn them into sets first with `set(...)`." },
      { code: r`print(["rye", "oat"] - ["oat"])`, err: "TypeError" },
      { code: r`print(set(["rye", "oat"]) - set(["oat"]))`, out: "{'rye'}" },
    ],
  },
  {
    id: "try-except",
    title: "Catching errors with try / except",
    summary: "Keep going when a line fails: try, except, several excepts, else, and try inside a loop.",
    blocks: [
      { p: "Some lines can fail for reasons your program can't control: smudged text, a missing entry, nobody to share with. Without help, the first error stops everything. **`try:`** runs a block; if a named error happens inside it, Python jumps to the matching **`except`** block instead of stopping, then carries on after it." },
      { code: r`answer = "a dozen"
try:
    eggs = int(answer)
except ValueError:
    eggs = 0
print("Eggs:", eggs)`, out: "Eggs: 0" },
      { p: "If nothing goes wrong, the `except` block is skipped." },
      { tip: "Name the error you expect: `except ValueError:`. A bare `except:` catches *every* error, even your own typing mistakes, and hides them from you." },
      { h: "Several kinds of trouble" },
      { p: "Looking up a key that isn't in a dictionary is a **`KeyError`**; dividing by zero is a **`ZeroDivisionError`**; `int()` on text that isn't a whole number is a **`ValueError`**. One `try` can have an `except` for each kind, and each can answer differently. Only the first matching one runs." },
      { code: r`prices = {"rye": 3, "oat": 2}

def cost(loaf, how_many):
    try:
        return prices[loaf] * int(how_many)
    except KeyError:
        return "we don't bake " + loaf
    except ValueError:
        return "how many?"

print(cost("rye", "4"))
print(cost("plum", "2"))
print(cost("oat", "lots"))`, out: "12\nwe don't bake plum\nhow many?" },
      { h: "else: when nothing went wrong" },
      { p: "An **`else:`** after the excepts runs only when the `try` block finished without an error. Keep the `try` small, just the risky lines, and put what comes next in `else`." },
      { code: r`text = "7"
try:
    boats = int(text)
except ValueError:
    print("Not a number")
else:
    print("Boats out:", boats)`, out: "Boats out: 7" },
      { h: "Trying inside a loop" },
      { p: "Put the `try` *inside* the loop and every round gets its own chance: a bad item is dealt with and the loop moves on to the next one." },
      { code: r`readings = ["4", "x", "6", ""]
total = 0
bad = 0
for reading in readings:
    try:
        total += int(reading)
    except ValueError:
        bad += 1
print(total, bad)`, out: "10 2" },
      { tip: "If the `try` wraps the *whole* loop instead, the first error jumps out of the loop and every item after it is skipped." },
      { p: "`continue` works inside an `except` too: it skips the rest of this round, straight on to the next item." },
    ],
  },
  {
    id: "raise",
    title: "Raising your own errors",
    summary: "raise ValueError(\"...\") says no clearly; except ValueError as e catches the message.",
    blocks: [
      { p: "Your own functions can refuse impossible requests the way Python does. **`raise ValueError(\"message\")`** stops the function right there and hands the trouble, with your message, to whoever called it." },
      { code: r`def ring_bell(times):
    if times < 1:
        raise ValueError(f"Ring the bell {times} times? That's just silence.")
    return "dong " * times

print(ring_bell(2))
print(ring_bell(0))`, err: "ValueError" },
      { p: "The first call prints `dong dong`. The second stops the program with `ValueError: Ring the bell 0 times? That's just silence.`" },
      { h: "Catching the message" },
      { p: "The caller can catch your error like any other. `except ValueError as problem:` also gives the error a name, and `str(problem)` (or printing it) is your message." },
      { code: r`def ring_bell(times):
    if times < 1:
        raise ValueError(f"Ring the bell {times} times? That's just silence.")
    return "dong " * times

try:
    print(ring_bell(-1))
except ValueError as problem:
    print("The bell-ringer says:", problem)`, out: "The bell-ringer says: Ring the bell -1 times? That's just silence." },
      { h: "Why raise, and not return a message?" },
      { p: "A returned string could be mistaken for a real answer, and a printed warning is easy to miss. A raised error can't be ignored: either the caller catches it on purpose, or the program stops and points at it." },
      { tip: "**ValueError** is the usual choice when the type is right but the value is impossible: a negative count, an unknown name, an empty line. Write a message that says *what* was wrong, and include the value." },
      { code: r`problem = ValueError("too wet to bake")
print(str(problem))`, out: "too wet to bake" },
    ],
  },
];
