import type { CodexPage } from "../types.ts";

// Codex pages for The Observatory (building 12): the capstone: searching, sorting, recursion and generators.
// Page ids must be unique across the whole Codex (content tests check).
const r = String.raw;

export const OBSERVATORY_PAGES: CodexPage[] = [
  {
    id: "searching",
    title: "Searching a list",
    summary: "Look through items one at a time, stop at the first match, and say clearly when nothing matched.",
    blocks: [
      { p: "The simplest search walks through a list from the front, one item at a time, until it finds what it wants. It's called a **linear search**, and it works on any list, in any order." },
      { p: "Inside a function, `return` doesn't just give back a value: it leaves the function **at once**, even from the middle of a loop. That makes searching neat:" },
      { code: r`def has_cracked(eggs):
    for egg in eggs:
        if egg == "cracked":
            return True
    return False

print(has_cracked(["whole", "cracked", "whole"]))
print(has_cracked(["whole", "whole"]))`, out: "True\nFalse" },
      { p: "Read the shape carefully. The `return True` is **inside** the loop, so it fires the moment a match turns up. The `return False` is **after** the loop, lined up with `for`, so it only runs once every egg has been checked and none matched." },
      { tip: "The classic search bug is putting the \"not found\" answer inside the loop, under an `else`. Then the function gives up after looking at only the first item." },
      { h: "Saying \"not found\"" },
      { p: "A search that finds a **position** needs an answer that can't be mistaken for a real one. Positions count up from 0, so many programs use **-1** to mean \"not there\". (Careful: in Python, `row[-1]` is the last item, so always check for -1 before using the answer as an index.)" },
      { p: "A search that finds a **thing** can give back `None`, Python's value for \"nothing at all\". A function that reaches its end without a `return` gives back `None` too." },
      { code: r`def quiet():
    x = 1

print(quiet())`, out: "None" },
      { h: "Searching with a test" },
      { p: "You don't have to search for one exact value. You can search for the first item that **passes a test**, as long as the test is a condition. Here the test is \"ripe for at least 5 days\":" },
      { code: r`def first_ripe(pears):
    for name, days in pears:
        if days >= 5:
            return name
    return None

print(first_ripe([("Bosc", 2), ("Comice", 6), ("Anjou", 7)]))
print(first_ripe([("Bosc", 1)]))`, out: "Comice\nNone" },
      { p: "Anjou is ripe too, but the search stops at Comice, the first one that passes." },
    ],
  },
  {
    id: "binary-search",
    title: "Binary search",
    summary: "Find things in a sorted list by halving: about ten looks for a thousand items.",
    blocks: [
      { p: "A linear search might look at every item. When the list is **sorted**, you can do much better. Play the guessing game: I'm thinking of a number from 1 to 100, and after each guess I say \"higher\" or \"lower\". The clever first guess is 50, because whatever I say, half the numbers are gone." },
      { code: r`secret = 37
low = 1
high = 100
guesses = 0
while low <= high:
    guess = (low + high) // 2
    guesses += 1
    if guess == secret:
        break
    elif guess < secret:
        low = guess + 1
    else:
        high = guess - 1
print(guess, guesses)`, out: "37 3" },
      { p: "`low` and `high` mark the numbers still **in play**. Each guess is the middle one. Too low? Then the secret is above the guess, so `low` jumps past it. Too high? `high` jumps below it. The loop runs while anything is still in play, `low <= high`. If they cross, there's nothing left: the thing you want isn't there." },
      { h: "On a list" },
      { p: "Searching a sorted list works the same way, with **positions** instead of numbers: start with the first and last positions in play, look at the item in the middle position, and move one marker past the middle depending on whether that item is too small or too big." },
      { tip: "The `+ 1` and `- 1` matter. Without them, when only two items are left, the middle can stay the same forever and the loop never ends. And keep `<=`, not `<`: when `low` and `high` are equal, one item is still in play and needs a look." },
      { h: "Why it's so fast" },
      { p: "Every look throws away half of what's left. Ask how many times a number can be halved before only one is left:" },
      { code: r`size = 1000
halvings = 0
while size > 1:
    size = size // 2
    halvings += 1
print(halvings)`, out: "9" },
      { p: "Nine halvings, then one last look: about ten looks for a thousand items, where a linear search could need a thousand. For a million items it's about twenty against a million. That's why sorted lists are worth keeping sorted." },
      { h: "Counting steps" },
      { p: "To compare two ways of doing something, count the steps each one takes. Add a counter that starts at 0 and goes up by one every time the step you care about happens (here, every look at an item), and give it back with the answer. A function can give back two things with a comma, which makes a tuple: `return spot, looks`." },
    ],
  },
  {
    id: "sorting-algorithms",
    title: "Sorting by hand",
    summary: "Selection sort and insertion sort: what sorted() is doing behind your back.",
    blocks: [
      { p: "`sorted()` is quick and you should use it in real programs. But sorting by hand once is the best way to understand it, and the two simplest ways are both things people do with cards on a table." },
      { h: "Swapping two places" },
      { p: "Most hand sorts swap items. Python can swap two places in one line, because it works out the whole right side before storing anything:" },
      { code: r`jars = [5, 3, 8]
jars[0], jars[2] = jars[2], jars[0]
print(jars)`, out: "[8, 3, 5]" },
      { h: "Selection sort" },
      { p: "**Selection sort** fills the row one place at a time. For the first place, find the smallest item anywhere in the row and swap it there. For the second place, find the smallest of everything **after** the first place and swap it there. Keep going until every place is filled. For the row 4 9 2 7:" },
      { p: "Place 0: the smallest is 2, swap it in → 2 9 4 7. Place 1: the smallest of 9 4 7 is 4 → 2 4 9 7. Place 2: the smallest of 9 7 is 7 → 2 4 7 9. Done." },
      { p: "The hunting part is a tracker loop, like finding the best by hand at the bakery, except it remembers the best item's **position**, so you know where to swap from:" },
      { code: r`scores = [12, 40, 7, 33]
best = 0
for i in range(1, len(scores)):
    if scores[i] < scores[best]:
        best = i
print(best, scores[best])`, out: "2 7" },
      { p: "Selection sort compares a lot, but it moves each item at most once: one swap per place." },
      { h: "Insertion sort" },
      { p: "**Insertion sort** is how most people sort a hand of cards. Keep the cards you hold in order. Pick up a new card and slide it in from the right-hand end, past every card bigger than it, until it reaches a smaller one (or the front). Then the hand is in order again, one card bigger." },
      { p: "`.insert(position, item)` puts an item at a position and shifts the rest along, so the work is finding the position:" },
      { code: r`row = [3, 8, 12]
row.insert(2, 10)
print(row)`, out: "[3, 8, 10, 12]" },
      { tip: "Insertion sort shines when things arrive **almost in order**. Sliding in from the back, a card that's already in the right place needs just one comparison, so a nearly sorted list is sorted almost instantly." },
    ],
  },
  {
    id: "sort-keys",
    title: "Sort keys",
    summary: "sorted() with key=, tuples as keys to sort by several things, and negatives to flip one part.",
    blocks: [
      { p: "`sorted(items, key=f)` calls the function `f` on each item and sorts by what it gives back. The items themselves don't change; only the order does." },
      { code: r`def by_length(word):
    return len(word)

print(sorted(["plum", "fig", "apple"], key=by_length))`, out: "['fig', 'plum', 'apple']" },
      { h: "Tuples compare part by part" },
      { p: "Python compares two tuples by their first parts. Only if those are equal does it look at the second parts, and so on. So a key that gives back a tuple sorts by several things at once: first by the first part, and only ties are settled by the next." },
      { code: r`print((2, "b") < (2, "c"))
print(sorted([(3, "z"), (1, "y"), (3, "a")]))`, out: "True\n[(1, 'y'), (3, 'a'), (3, 'z')]" },
      { h: "Several things, different directions" },
      { p: "`reverse=True` flips the whole order. To flip just **one number** inside a tuple key, give back its negative: the biggest number becomes the most negative, so it sorts first. Here cakes go cheapest first, and among cakes of the same price, the tallest first:" },
      { code: r`cakes = [
    {"name": "Plum", "layers": 2, "price": 5},
    {"name": "Lemon", "layers": 3, "price": 5},
    {"name": "Fig", "layers": 1, "price": 3},
]

def cheap_then_tall(cake):
    return (cake["price"], -cake["layers"])

for cake in sorted(cakes, key=cheap_then_tall):
    print(cake["name"])`, out: "Fig\nLemon\nPlum" },
      { tip: "`sorted()` gives back a new list and leaves the old one alone. `.sort()` changes the list itself and gives back `None`. When a function is handed a list it shouldn't change, use `sorted()`." },
      { h: "lambda: a key in one line" },
      { p: "For a tiny key function, Python has a short way to write it right where it's used: `lambda item: what_to_give_back`. It's a function with no name and no `def`. Anything you can do with lambda, you can do with a small named function, so use whichever you find clearer." },
      { code: r`words = ["owl", "moth", "bat"]
print(sorted(words, key=lambda w: w[-1]))`, out: "['moth', 'owl', 'bat']" },
    ],
  },
  {
    id: "recursion",
    title: "Recursion",
    summary: "A function that calls itself on a smaller problem, with a base case to stop.",
    blocks: [
      { p: "A function can call **itself**. That sounds like a trick, but it's a way of thinking: solve a big problem by solving a slightly smaller copy of the same problem, then doing a little more. This is **recursion**." },
      { p: "Every recursive function needs two parts:" },
      { p: "**The base case:** a problem so small you can answer it straight away, without calling yourself. **The step:** for anything bigger, call yourself on a smaller problem, and use the answer." },
      { code: r`def countdown(n):
    if n == 0:
        print("Liftoff!")
        return
    print(n)
    countdown(n - 1)

countdown(3)`, out: "3\n2\n1\nLiftoff!" },
      { p: "Functions that give back a value work the same way. Five factorial is 5 × 4 × 3 × 2 × 1, which is just 5 times (four factorial):" },
      { code: r`def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`, out: "120" },
      { p: "Each call **waits** for the smaller call to answer. factorial(5) waits for factorial(4), which waits for factorial(3)… down to factorial(1), which answers 1 straight away. Then the answers flow back up: 2, 6, 24, 120." },
      { tip: "Trust the smaller call. When you write the step, don't trace every level in your head: assume the call on the smaller problem gives the right answer, and ask only \"what do I do with it?\"" },
      { h: "Forgetting the base case" },
      { p: "Without a base case (or with one the problem never reaches), the function calls itself forever, and Python stops it with a `RecursionError`. Check that every call gets closer to the base case, and that the smallest possible input, like 0 or an empty list, is covered." },
      { code: r`def forever(n):
    return forever(n - 1)

forever(3)`, err: "RecursionError" },
      { tip: "Also make sure the step really **returns** its answer. A step line without `return` works out the answer and then throws it away, so the function gives back `None`." },
    ],
  },
  {
    id: "recursion-data",
    title: "Recursion over lists and nested data",
    summary: "Lists as first item plus the rest; walking data that holds smaller copies of itself.",
    blocks: [
      { h: "A list is its first item, plus the rest" },
      { p: "`items[0]` is the first item, and `items[1:]` is a **new** list of everything after it. Hand the rest to a recursive call and each call gets a list one shorter, until it's empty, which makes the empty list `[]` a natural base case. Slicing never changes the original list." },
      { code: r`def count_ripe(days):
    if days == []:
        return 0
    if days[0] >= 5:
        return 1 + count_ripe(days[1:])
    return count_ripe(days[1:])

print(count_ripe([2, 6, 5, 1]))`, out: "2" },
      { p: "Some questions only make sense when there's at least one item (the biggest item of an empty list is… nothing). For those, the base case can be a list of **one** item: `if len(items) == 1:`." },
      { h: "Nested data" },
      { p: "Recursion really shines on data that holds smaller copies of itself: boxes inside boxes, folders inside folders, constellations inside constellations. A loop inside a loop handles exactly two levels. A function that calls itself on each inner part handles **any** number of levels, because every inner part gets the same treatment." },
      { code: r`def buttons(box):
    total = box["buttons"]
    for inner in box["boxes"]:
        total += buttons(inner)
    return total

sewing = {"buttons": 3, "boxes": [
    {"buttons": 2, "boxes": []},
    {"buttons": 1, "boxes": [{"buttons": 4, "boxes": []}]},
]}
print(buttons(sewing))`, out: "10" },
      { p: "Here the base case is hidden: a box with nothing inside never enters the loop, so it just gives back its own buttons." },
      { h: "Searching nested data" },
      { p: "To **find** something, check this level first. Then ask each inner part in turn. Careful: if the first part says \"not here\" (`None`), that doesn't mean it isn't anywhere. Keep each part's answer in a variable and only return it if it found something; give up with `None` only after every part has said no." },
      { tip: "`isinstance(x, list)` and `isinstance(x, dict)` tell you what kind of thing you're holding, handy when an inner part could be a single item or another whole group." },
    ],
  },
  {
    id: "generators",
    title: "Generators and yield",
    summary: "Functions that hand out values one at a time with yield, pausing in between, even forever.",
    blocks: [
      { p: "A normal function works out its answer and `return`s it, all at once. A **generator** hands out values **one at a time** with `yield`. After each yield it pauses, right where it is, and carries on from that spot when someone asks for the next value." },
      { code: r`def countdown_gen(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown_gen(3):
    print(x)`, out: "3\n2\n1" },
      { p: "Calling a generator function doesn't run it yet. It gives you a generator object, and the body only runs, a piece at a time, as values are asked for. You can see the pausing:" },
      { code: r`def chores():
    print("sweeping")
    yield 1
    print("dusting")
    yield 2

for c in chores():
    print("done", c)`, out: "sweeping\ndone 1\ndusting\ndone 2" },
      { p: "A `for` loop asks for values until the generator ends, which happens when its body finishes or reaches a `return`. `list(gen)` collects everything a (finite!) generator hands out." },
      { h: "Forever is fine" },
      { p: "Because a generator only makes what it's asked for, it can loop **forever** with `while True:`. Something else decides when to stop asking. `zip` stops as soon as its shorter side runs out:" },
      { code: r`def odd_numbers():
    n = 1
    while True:
        yield n
        n += 2

for day, odd in zip(["Mon", "Tue", "Wed"], odd_numbers()):
    print(day, odd)`, out: "Mon 1\nTue 3\nWed 5" },
      { tip: "Never call `list()` on an endless generator, or loop over one with no `break`: Python would keep asking forever. The workbench stops programs after a few seconds, but it's better to only take what you need." },
    ],
  },
  {
    id: "generator-expressions",
    title: "next() and generator expressions",
    summary: "Take one value with next(), and search or count lazily with (... for ... in ...).",
    blocks: [
      { h: "next()" },
      { p: "`next(gen)` asks a generator for its next value, just one. Ask again and you get the one after. A second argument is what to give back if the generator has nothing left (without it, an empty generator raises `StopIteration`)." },
      { code: r`def bells():
    yield "ding"
    yield "dong"

b = bells()
print(next(b))
print(next(b))
print(next(b, "silence"))`, out: "ding\ndong\nsilence" },
      { p: "To take exactly a few values, call `next` that many times. `_` is a name people use for a loop variable they don't need:" },
      { code: r`def evens():
    n = 0
    while True:
        yield n
        n += 2

e = evens()
print([next(e) for _ in range(3)])
print(next(e))`, out: "[0, 2, 4]\n6" },
      { h: "Generator expressions" },
      { p: "A comprehension in **round** brackets is a **generator expression**. It looks like a list comprehension, but it doesn't build a list: it hands out one value at a time, only when asked. Give one to `next` and you get the first value that passes the test, and nothing more is looked at. Give one to `sum`, `min` or `max` and they add up or compare as they go." },
      { code: r`nums = [3, 8, 12, 5]
print(next(n for n in nums if n > 10))
print(sum(n * n for n in nums))
print(sum(1 for n in nums if n % 2 == 1))`, out: "12\n242\n2" },
      { tip: "The last line is a neat way to **count** matches: add up a 1 for every item that passes." },
      { p: "Because nothing is built in advance, a generator expression can even look through an **endless** generator, as long as it stops: `next(...)` stops at the first match, but a list comprehension over an endless generator would never finish." },
      { h: "Used up" },
      { p: "A generator remembers how far it has got, and once it has handed everything out, it's empty. Reading it again gives nothing:" },
      { code: r`squares = (n * n for n in range(4))
print(list(squares))
print(list(squares))`, out: "[0, 1, 4, 9]\n[]" },
    ],
  },
  {
    id: "big-programs",
    title: "Building a bigger program",
    summary: "Plan on paper, split the work into small tested functions, and build one piece on another.",
    blocks: [
      { p: "Every program in this book so far fits on one screen. Real programs are bigger, and nobody writes them in one go. The trick is to never write a big program at all: write several small ones that work together." },
      { h: "1. Say what it does, in one sentence" },
      { p: "Before any code: what goes in, and what comes out? \"It reads the picnic list and tells me how many things to pack.\" If you can't say it in a sentence, you're not ready to type." },
      { h: "2. List the jobs" },
      { p: "Break the sentence into jobs, each small enough to describe in a line: read one line into a name and a number; add up the numbers; put the report together. Each job becomes a **function**, with a clear answer to \"what does it take, and what does it give back?\"" },
      { h: "3. Build and test one job at a time" },
      { p: "Write the smallest job first and **try it** on a tiny example before writing the next. A bug in a ten-line function is easy to find; a bug somewhere in a hundred lines is not. Then the bigger functions can call the smaller ones, which you already trust." },
      { code: r`def parse(line):
    name, count = line.split("=")
    return name.strip(), int(count)

def total(pairs):
    return sum(count for name, count in pairs)

def report(lines):
    pairs = [parse(line) for line in lines]
    return f"{len(pairs)} kinds, {total(pairs)} things to pack"

print(parse("apples = 4"))
print(report(["apples = 4", "pears=2", " plums =6"]))`, out: "('apples', 4)\n3 kinds, 12 things to pack" },
      { p: "Notice that `report` doesn't split anything itself. It asks `parse` and `total`. If parsing ever needs to change, there's exactly one place to change it." },
      { h: "Keep the data in one shape" },
      { p: "Decide early what one thing looks like in Python (say, a dictionary with the same keys for every record, or a tuple of a name and a number) and turn messy input into that shape **once**, as soon as you read it. Every other function can then rely on it." },
      { h: "Neat numbers" },
      { p: "Inside an f-string, `:02` after a number pads it to two digits with a leading zero, which is just right for times. `divmod(a, b)` gives back how many whole b's fit in a, and what's left." },
      { code: r`hours, mins = divmod(125, 60)
print(f"{hours:02}:{mins:02}")`, out: "02:05" },
      { tip: "When a later program builds on an earlier one, copy in the functions you've already tested rather than rewriting them. Big programs grow like that: one tested piece on top of another." },
    ],
  },
];
