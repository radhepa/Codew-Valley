import type { CodexPage } from "../types.ts";

// Codex pages for The Clock Tower (building 10): modules and list comprehensions.
// Page ids must be unique across the whole Codex (content tests check). The
// base Codex already has a "math" page (the operators), so the math module's
// page is "math-module".
const r = String.raw;

export const CLOCKTOWER_PAGES: CodexPage[] = [
  {
    id: "modules",
    title: "Modules and import",
    summary: "Open a box of ready-made tools with import, then reach in with a dot.",
    blocks: [
      { p: "Python comes with hundreds of ready-made tools, packed into **modules**: boxes of functions and values that somebody has already written and tested. A box stays shut until you `import` it." },
      { code: r`import math
print(math.sqrt(81))
print(math.pi)`, out: "9.0\n3.141592653589793" },
      { p: "After `import math`, reach inside the box with a dot: `math.sqrt` is the `sqrt` tool from the `math` box, and `math.pi` is the number pi, already worked out to many places." },
      { h: "sqrt: the square root" },
      { p: "The **square root** of a number is the number that, multiplied by itself, makes it: 9 times 9 is 81, so the square root of 81 is 9. `math.sqrt` always hands back a float, even when the answer is whole." },
      { code: r`import math
print(math.sqrt(2.25))
print(math.sqrt(10))`, out: "1.5\n3.1622776601683795" },
      { h: "pi" },
      { p: "Pi is how many times the width across a circle fits round its edge: a little more than 3. It never ends, so let `math.pi` remember it for you rather than typing a short version. Here it works out the size of a round pond, 3 metres from the middle to the edge:" },
      { code: r`import math
reach = 3
print(round(math.pi * reach * reach, 1))`, out: "28.3" },
      { h: "Forgetting the import" },
      { p: "Without the `import` line, Python has never heard of `math`:" },
      { code: r`print(math.sqrt(16))`, err: "NameError" },
      { tip: "Put imports at the very top of your program, so they have run before anything needs them. You already know one module: `random`, from the dock. `import random` and then `random.randint(1, 6)` is exactly this pattern." },
    ],
  },
  {
    id: "from-import",
    title: "from ... import, and as",
    summary: "Take one tool out of a module, or give a module a shorter name.",
    blocks: [
      { p: "`import math` brings in the whole box, and every tool needs `math.` in front. When you use one tool a lot, take it out of the box instead:" },
      { code: r`from math import sqrt
print(sqrt(49))
print(sqrt(0.25))`, out: "7.0\n0.5" },
      { p: "You can take out several at once, with commas:" },
      { code: r`from math import sqrt, pi
print(round(pi, 3))
print(sqrt(144))`, out: "3.142\n12.0" },
      { h: "Only what you asked for" },
      { p: "`from math import sqrt` brings out `sqrt` and nothing else. The name `math` itself was never made, so `math.` stops working:" },
      { code: r`from math import sqrt
print(math.sqrt(9))`, err: "NameError" },
      { h: "as: a shorter name" },
      { p: "`as` gives the box a nickname. It is the same box, with a shorter label:" },
      { code: r`import math as m
print(m.sqrt(100))`, out: "10.0" },
      { tip: "Which to use? `import math` reads clearly, because every line says where its tool came from. `from math import sqrt` saves typing when the same tool turns up again and again." },
    ],
  },
  {
    id: "math-module",
    title: "The math module",
    summary: "floor, ceil and gcd: rounding down, rounding up, and the greatest common divisor.",
    blocks: [
      { p: "The `math` module is a toolbox for numbers. Besides `sqrt` and `pi` (see **Modules and import**), here are three tools for whole numbers." },
      { h: "floor and ceil: rounding down and up" },
      { code: r`import math
print(math.floor(4.7))
print(math.ceil(4.2))
print(math.ceil(5.0))`, out: "4\n5\n5" },
      { p: "`math.floor` always goes **down** to the whole number below (down to the floor). `math.ceil` always goes **up** (up to the ceiling). A number that is already whole stays as it is. Both hand back an `int`." },
      { p: "`round` is different: it goes to whichever whole number is **nearer**. Choose by the story, not by habit:" },
      { code: r`import math
apples = 23
per_basket = 6
print(math.floor(apples / per_basket), "baskets can be filled to the top")
print(math.ceil(apples / per_basket), "baskets are needed to carry every apple")
print(round(apples / per_basket), "is just the nearest whole number")`, out: "3 baskets can be filled to the top\n4 baskets are needed to carry every apple\n4 is just the nearest whole number" },
      { tip: "For whole numbers, `//` rounds down too: `23 // 6` is 3. There is no operator that rounds up, which is exactly what `ceil` is for. Careful with tricks like \"`//` and then add 1\": when the division comes out exact, they give one too many." },
      { h: "gcd: the greatest common divisor" },
      { p: "`math.gcd(a, b)` gives the biggest whole number that divides both `a` and `b` with nothing left over." },
      { code: r`import math
print(math.gcd(12, 18))
print(math.gcd(20, 8))
print(math.gcd(7, 5))`, out: "6\n4\n1" },
      { p: "Use it to split two piles into the biggest matching groups: 12 red beads and 18 blue beads make 6 identical bracelets, each with 2 red beads and 3 blue ones." },
      { code: r`import math
red = 12
blue = 18
bracelets = math.gcd(red, blue)
print(bracelets, "bracelets, each with", red // bracelets, "red and", blue // bracelets, "blue")`, out: "6 bracelets, each with 2 red and 3 blue" },
    ],
  },
  {
    id: "random-lists",
    title: "random with lists",
    summary: "random.choice, random.shuffle and random.sample, and why a seed keeps them fair.",
    blocks: [
      { p: "At the dock, `random` rolled numbers. It can also draw from lists. The examples set a seed first, so they show the same draw every time (more on seeds below)." },
      { h: "choice: one item" },
      { code: r`import random
random.seed(5)
pies = ["apple", "plum", "cherry", "pear"]
print(random.choice(pies))`, out: "cherry" },
      { h: "shuffle: mix a list where it stands" },
      { p: "`random.shuffle` mixes the list itself into a new order. It changes the list and hands back nothing, so print the list afterwards:" },
      { code: r`import random
random.seed(6)
cards = ["ace", "two", "three", "four", "five"]
random.shuffle(cards)
print(cards)`, out: "['four', 'three', 'two', 'ace', 'five']" },
      { p: "\"Hands back nothing\" really means `None`. Store what `shuffle` gives back and you have thrown your list away:" },
      { code: r`import random
cards = ["ace", "two", "three"]
cards = random.shuffle(cards)
print(cards)`, out: "None" },
      { h: "sample: several different items" },
      { p: "`random.sample(things, k)` picks `k` different items and gives them back as a new list. No item is picked twice, and the original list isn't changed." },
      { code: r`import random
random.seed(5)
apples = ["red", "green", "yellow", "russet", "spotty"]
print(random.sample(apples, 2))
print(apples)`, out: "['spotty', 'yellow']\n['red', 'green', 'yellow', 'russet', 'spotty']" },
      { tip: "`random.choice` called twice can pick the same item twice, like two dice can both land on 4. When the picks must all be different, `sample` them together." },
      { h: "Seeds" },
      { p: "A **seed** sets where the dice start. The same seed gives the same draws, in the same order, every run: handy for testing, and for a draw everyone agrees was made fairly. Each draw uses up some of the dice, so the order you draw in matters too." },
      { code: r`import random
random.seed(9)
first = random.choice(["oak", "ash", "elm"])
random.seed(9)
again = random.choice(["oak", "ash", "elm"])
print(first == again)`, out: "True" },
    ],
  },
  {
    id: "dates",
    title: "Dates with datetime",
    summary: "datetime.date: make a date, read its year, month and day, and find its weekday.",
    blocks: [
      { p: "Dates are tricky by hand: months have different lengths, leap years come and go, and who remembers which weekday the 3rd of March was? The `datetime` module has a `date` that knows all of that." },
      { code: r`from datetime import date
picnic = date(2026, 4, 3)
print(picnic)`, out: "2026-04-03" },
      { p: "Make one with `date(year, month, day)`, in that order, as whole numbers. A printed date shows the year, the month and the day as numbers, biggest first." },
      { h: "Year, month and day" },
      { code: r`from datetime import date
picnic = date(2026, 4, 3)
print(picnic.year)
print(picnic.month)
print(picnic.day)`, out: "2026\n4\n3" },
      { p: "These are plain numbers, so you can do maths with them: `picnic.year - 2000` is 26." },
      { h: "Which weekday?" },
      { p: "`.weekday()` (with brackets: it's a method) gives the day of the week as a number: **0 is Monday**, 1 is Tuesday, and so on up to 6 for Sunday. A list of names in that order turns the number into a word." },
      { code: r`from datetime import date
names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
picnic = date(2026, 4, 3)
print(picnic.weekday())
print(names[picnic.weekday()])`, out: "4\nFri" },
      { h: "Comparing dates" },
      { p: "Dates compare like numbers: earlier is smaller. `==` is True only when the year, the month and the day all match." },
      { code: r`from datetime import date
picnic = date(2026, 4, 3)
fair = date(2026, 6, 20)
print(picnic < fair)
print(picnic == date(2027, 4, 3))`, out: "True\nFalse" },
      { p: "A date that doesn't exist is a `ValueError`:" },
      { code: r`from datetime import date
print(date(2026, 2, 30))`, err: "ValueError" },
      { tip: "Programs in this game never ask for today's date: every challenge works from dates written into the program, so it gives the same answer every time you run it." },
    ],
  },
  {
    id: "timedelta",
    title: "timedelta: lengths of time",
    summary: "Add days to a date, and find the days between two dates.",
    blocks: [
      { p: "A `timedelta` is a **length** of time, like \"ten days\", rather than a day on the calendar. Make one with `timedelta(days=...)`." },
      { h: "Adding days to a date" },
      { p: "A date plus a timedelta is a new date. Python carries over into the next month or year for you:" },
      { code: r`from datetime import date, timedelta
sown = date(2026, 5, 25)
print(sown + timedelta(days=10))
print(date(2026, 12, 30) + timedelta(days=3))`, out: "2026-06-04\n2027-01-02" },
      { p: "Taking a timedelta away goes back in time: `sown - timedelta(days=7)` is the week before." },
      { p: "A date and a plain number don't add, because Python can't tell if you mean days, weeks or years:" },
      { code: r`from datetime import date
print(date(2026, 5, 25) + 10)`, err: "TypeError" },
      { h: "Days between two dates" },
      { p: "One date minus another gives a timedelta. Its `.days` is the plain number of days:" },
      { code: r`from datetime import date
sown = date(2026, 5, 25)
picked = date(2026, 8, 1)
grew = picked - sown
print(grew)
print(grew.days)`, out: "68 days, 0:00:00\n68" },
      { p: "Printing a whole timedelta shows the days and then hours:minutes:seconds. When you want just the number, use `.days`." },
      { h: "Weeks too" },
      { code: r`from datetime import date, timedelta
print(date(2026, 5, 25) + timedelta(weeks=2))`, out: "2026-06-08" },
    ],
  },
  {
    id: "date-formatting",
    title: "Dressing up dates",
    summary: "isoformat() and strftime(): print a date the way you want it.",
    blocks: [
      { p: "A date can be written many ways: `2026-04-03`, `03/04/2026`, `Friday 3 April`. Python can write it in any of them." },
      { h: "isoformat: the tidy number style" },
      { p: "`.isoformat()` gives the year, month and day as numbers, biggest first, with two digits for the month and the day. It's the same text you see when you print a date, and it sorts properly as text, which is why logbooks love it." },
      { code: r`from datetime import date
fair = date(2026, 6, 5)
print(fair.isoformat())`, out: "2026-06-05" },
      { h: "strftime: a pattern of codes" },
      { p: "`.strftime(pattern)` (\"string from time\") fills a pattern in. Each `%` code is replaced by a part of the date; everything else in the pattern is copied as it is." },
      { code: r`from datetime import date
fair = date(2026, 6, 5)
print(fair.strftime("%d/%m/%Y"))
print(fair.strftime("Fair day: %a %d %b"))`, out: "05/06/2026\nFair day: Fri 05 Jun" },
      { p: "The codes you need most:" },
      { p: "`%A` the weekday's name (Friday) · `%a` short (Fri) · `%d` the day, two digits (05) · `%B` the month's name (June) · `%b` short (Jun) · `%m` the month as two digits (06) · `%Y` the whole year (2026) · `%y` just its last two digits (26)" },
      { code: r`from datetime import date
fair = date(2026, 6, 5)
print(fair.strftime("%A, the %d of %B"))`, out: "Friday, the 05 of June" },
      { tip: "Capitals matter: `%B` is June but `%b` is Jun, and `%Y` is 2026 but `%y` is 26. If a date looks nearly right, check the case of each code." },
    ],
  },
  {
    id: "clock-arithmetic",
    title: "Clock arithmetic and divmod",
    summary: "divmod for hours and minutes, two-digit times, and clocks that go round.",
    blocks: [
      { p: "`divmod(a, b)` does `//` and `%` in one go. It gives back two numbers: how many whole `b`s fit into `a`, and what is left over." },
      { code: r`print(divmod(17, 5))
print(divmod(130, 60))`, out: "(3, 2)\n(2, 10)" },
      { p: "Unpack the two answers into two names, like any pair:" },
      { code: r`eggs = 40
boxes, loose = divmod(eggs, 12)
print(boxes, "boxes and", loose, "loose eggs")`, out: "3 boxes and 4 loose eggs" },
      { h: "Minutes into hours" },
      { p: "Time is the classic use: 60 minutes make an hour, 60 seconds make a minute. Split the big unit off first, then split what's left." },
      { code: r`walk = 200
hours, minutes = divmod(walk, 60)
print(hours, "hours", minutes, "minutes")`, out: "3 hours 20 minutes" },
      { h: "Two digits" },
      { p: "Clocks show `3:05`, not `3:5`. In an f-string, `:02` after a value means \"at least 2 digits, padded with zeros in front\":" },
      { code: r`h = 3
m = 5
print(f"{h}:{m:02}")
print(f"{h:02}:{m:02}")`, out: "3:05\n03:05" },
      { h: "Going round" },
      { p: "A clock face goes round and round, and `%` keeps the part that's left after all the full trips. A 24-hour day is 1440 minutes, so a baker who starts at 22:00 and works 5 hours finishes at:" },
      { code: r`start = 22 * 60
done = (start + 5 * 60) % 1440
h, m = divmod(done, 60)
print(f"{h:02}:{m:02}")`, out: "03:00" },
      { tip: "Work out a few cases on paper before you trust a clock program: what about exactly midnight, exactly noon, and a time just after?" },
    ],
  },
  {
    id: "comprehensions",
    title: "List comprehensions",
    summary: "Build a new list from an old one in a single line.",
    blocks: [
      { p: "You know how to build a new list with a loop: start empty, then `append` one new item for every old one." },
      { code: r`prices = [2, 5, 3]
doubled = []
for p in prices:
    doubled.append(p * 2)
print(doubled)`, out: "[4, 10, 6]" },
      { p: "That pattern is so common that Python has a shortcut, a **list comprehension**. It says the same thing in one line:" },
      { code: r`prices = [2, 5, 3]
doubled = [p * 2 for p in prices]
print(doubled)`, out: "[4, 10, 6]" },
      { p: "Read it from the middle out: `for p in prices` walks the old list, and the part at the front, `p * 2`, says what each new item is. The square brackets mean \"collect them all into a list\"." },
      { h: "Anything can go at the front" },
      { p: "Maths, a method, a function call, an f-string: whatever turns one old item into one new item." },
      { code: r`herbs = ["mint", "sage", "thyme"]
print([h.upper() for h in herbs])
print([len(h) for h in herbs])
print([f"{h} tea" for h in herbs])`, out: "['MINT', 'SAGE', 'THYME']\n[4, 4, 5]\n['mint tea', 'sage tea', 'thyme tea']" },
      { h: "The old list stays as it was" },
      { code: r`marks = [7, 9, 4]
bigger = [m + 1 for m in marks]
print(marks)
print(bigger)`, out: "[7, 9, 4]\n[8, 10, 5]" },
      { tip: "A comprehension always gives one new item for every old one (until you add a filter: see **Comprehensions with if**). If you need to print or do several steps for each item, a plain `for` loop is still the right tool." },
    ],
  },
  {
    id: "comprehension-filters",
    title: "Comprehensions with if",
    summary: "Keep only some items: [x for x in things if test].",
    blocks: [
      { p: "Put an `if` at the **end** of a comprehension and only the items that pass the test are kept. The others are simply left out." },
      { code: r`ages = [4, 12, 7, 15, 9]
print([a for a in ages if a >= 9])`, out: "[12, 15, 9]" },
      { p: "It's the filtering loop you know, folded into one line:" },
      { code: r`ages = [4, 12, 7, 15, 9]
older = []
for a in ages:
    if a >= 9:
        older.append(a)
print(older)`, out: "[12, 15, 9]" },
      { h: "Keep some, and change them" },
      { p: "The front part still says what each kept item becomes, so a comprehension can filter and change at once. Python tests each item first, and only the ones that pass are changed and kept." },
      { code: r`prices = [3, 12, 7, 20]
print([p * 2 for p in prices if p < 10])`, out: "[6, 14]" },
      { h: "How many passed?" },
      { p: "The result is an ordinary list, so `len`, `sum`, `min` and `max` all work on it:" },
      { code: r`ages = [4, 12, 7, 15, 9]
older = [a for a in ages if a >= 9]
print(len(older), "of them are 9 or older")
print(sum(older))`, out: "3 of them are 9 or older\n36" },
      { tip: "The `if` at the end can only **drop** items: it has no `else`. To pick between two values for every item, use the one-line if at the front instead (see **The one-line if**)." },
    ],
  },
  {
    id: "comprehension-range",
    title: "Comprehensions with range",
    summary: "Build numbered lists, steps and labels from range().",
    blocks: [
      { p: "`range` works in a comprehension like any list. It's the quickest way to build a list of evenly spaced numbers:" },
      { code: r`print([n * 3 for n in range(4)])
print([n for n in range(10, 30, 5)])`, out: "[0, 3, 6, 9]\n[10, 15, 20, 25]" },
      { p: "Remember that `range` stops **before** its end: `range(10, 30, 5)` never reaches 30. If you want the end too (when the steps land on it), give `range` a stop a little past it." },
      { code: r`print([n for n in range(10, 30, 5)])
print([n for n in range(10, 31, 5)])`, out: "[10, 15, 20, 25]\n[10, 15, 20, 25, 30]" },
      { h: "Building labels" },
      { p: "An f-string at the front turns each number into a label. Here every bench in a row of four gets a seat number, starting from 1:" },
      { code: r`print([f"seat {n + 1}" for n in range(4)])`, out: "['seat 1', 'seat 2', 'seat 3', 'seat 4']" },
      { p: "And the two-digit trick from **Clock arithmetic** works inside the braces too:" },
      { code: r`print([f"row {n:02}" for n in range(8, 12)])`, out: "['row 08', 'row 09', 'row 10', 'row 11']" },
      { tip: "Write out the first two and the last item on paper before you build the list. If your list starts or ends one step off, it's almost always the start or the stop of `range`." },
    ],
  },
  {
    id: "conditional-expressions",
    title: "The one-line if",
    summary: "a if test else b: choose a value in one line, even inside a comprehension.",
    blocks: [
      { p: "Often an `if` / `else` only exists to choose between two values:" },
      { code: r`apples = 1
if apples == 1:
    word = "apple"
else:
    word = "apples"
print(apples, word)`, out: "1 apple" },
      { p: "Python can say that in one line. `a if test else b` **is** a value: `a` when the test is True, `b` when it's False." },
      { code: r`apples = 3
word = "apple" if apples == 1 else "apples"
print(apples, word)`, out: "3 apples" },
      { p: "Because it's a value (an **expression**), it can go anywhere a value can: on the right of `=`, in a `print`, or inside an f-string's braces." },
      { code: r`rain = 6
print(f"Take {'boots' if rain > 4 else 'shoes'}.")`, out: "Take boots." },
      { h: "Inside a comprehension" },
      { p: "At the **front** of a comprehension it chooses a value for **every** item, so the new list is just as long as the old one:" },
      { code: r`scores = [3, 8, 5, 9]
print(["pass" if s >= 5 else "try again" for s in scores])`, out: "['try again', 'pass', 'pass', 'pass']" },
      { p: "Compare the filter at the end, which only keeps some items:" },
      { code: r`scores = [3, 8, 5, 9]
print([s for s in scores if s >= 5])`, out: "[8, 5, 9]" },
      { h: "The else is not optional" },
      { p: "A one-line if must say what to give when the test is False:" },
      { code: r`apples = 3
word = "apple" if apples == 1
print(word)`, err: "SyntaxError" },
      { tip: "Keep the one-line if for choosing between two simple values. When each branch needs several steps, a normal `if` / `else` is easier to read." },
    ],
  },
  {
    id: "dict-comprehensions",
    title: "Dictionary comprehensions",
    summary: "Build a dictionary in one line: {key: value for ... in ...}.",
    blocks: [
      { p: "A comprehension in **curly braces**, with a `key: value` pair at the front, builds a dictionary instead of a list." },
      { code: r`fruit = ["fig", "plum", "banana"]
print({f: len(f) for f in fruit})`, out: "{'fig': 3, 'plum': 4, 'banana': 6}" },
      { h: "From another dictionary" },
      { p: "Walk a dictionary's `.items()` and unpack each pair into two names, exactly as in a `for` loop. Then say what the new key and value are:" },
      { code: r`cost = {"tea": 2, "cake": 3, "pie": 4}
print({item: price * 2 for item, price in cost.items()})`, out: "{'tea': 4, 'cake': 6, 'pie': 8}" },
      { h: "With a filter" },
      { p: "An `if` at the end keeps only some pairs. The test can look at the key, the value, or both:" },
      { code: r`cost = {"tea": 2, "cake": 3, "pie": 4}
print({item: price for item, price in cost.items() if "a" in item})`, out: "{'tea': 2, 'cake': 3}" },
      { code: r`cost = {"tea": 2, "cake": 3, "pie": 4}
print({item: price + 1 for item, price in cost.items() if len(item) == 3})`, out: "{'tea': 3, 'pie': 5}" },
      { h: "From two lists side by side" },
      { p: "`zip` pairs two lists up, item by item:" },
      { code: r`names = ["Ada", "Ben"]
ages = [9, 11]
print({n: a for n, a in zip(names, ages)})`, out: "{'Ada': 9, 'Ben': 11}" },
      { tip: "Keys must be unique. If two items give the same key, the later one wins and the earlier one quietly disappears." },
    ],
  },
];
