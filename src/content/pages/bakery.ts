import type { CodexPage } from "../types.ts";

// Codex pages for The Hearth Bakery (building 5): for loops, range, accumulators, enumerate, zip and nested loops.
// Page ids must be unique across the whole Codex (content tests check).
const r = String.raw;

export const BAKERY_PAGES: CodexPage[] = [
  {
    id: "for-loops",
    title: "for loops",
    summary: "Run the same lines once for every item in a list, or every character in a string.",
    blocks: [
      { p: "A **for loop** runs the same lines once for every item in a list. Each time round, the loop's variable holds the next item, from the first to the last." },
      { code: r`basket = ["egg", "butter", "honey"]
for thing in basket:
    print("Into the bowl:", thing)`, out: "Into the bowl: egg\nInto the bowl: butter\nInto the bowl: honey" },
      { p: "Read it as English: *for each thing in the basket, do this*. You choose the variable's name; pick one that names a single item, like `for apple in apples:`. The line ends with a colon, and the lines that repeat are indented under it." },
      { h: "Inside the loop, and after it" },
      { p: "Indented lines run every round. The first line back at the edge runs once, after the last round." },
      { code: r`for jar in ["plum", "pear"]:
    print("Label the", jar)
    print("Shelve the", jar)
print("Wipe the table.")`, out: "Label the plum\nShelve the plum\nLabel the pear\nShelve the pear\nWipe the table." },
      { h: "for and while" },
      { p: "At the market you walked lists with `while` and an index. A `for` loop does the same walk and keeps the place for you, so there's no index to forget to add 1 to. These two loops print the same thing:" },
      { code: r`hens = ["Bess", "Dot"]
i = 0
while i < len(hens):
    print(hens[i])
    i += 1
for hen in hens:
    print(hen)`, out: "Bess\nDot\nBess\nDot" },
      { p: "`while` is still the right tool when you can't know the number of rounds in advance (keep casting until a bite). When you're walking something from start to end, `for` is simpler." },
      { h: "Walking a string" },
      { p: "A string is a row of characters, and a `for` loop walks it one character at a time, left to right. Spaces and punctuation are characters too, so they get a round of their own." },
      { code: r`for ch in "a cup":
    print(ch)`, out: "a\n \nc\nu\np" },
      { p: "An `if` inside the loop can let some characters through and pass over others. `continue` and `break` from the dock work in `for` loops too: `continue` skips to the next round, `break` ends the loop." },
      { code: r`for ch in "Oh, hi!":
    if ch == "," or ch == "!":
        continue
    print(ch)`, out: "O\nh\n \nh\ni" },
      { tip: "The colon matters: without it, Python can't tell where the loop's lines begin." },
      { code: r`for n in [1, 2]
    print(n)`, err: "SyntaxError" },
      { tip: "Changing the loop variable doesn't change the list. The variable only holds this round's item; the list is left as it was." },
      { code: r`nums = [1, 2]
for n in nums:
    n = n * 10
print(nums)`, out: "[1, 2]" },
    ],
  },
  {
    id: "range",
    title: "range()",
    summary: "Loop a number of times, count in steps, and count down.",
    blocks: [
      { p: "Sometimes there's no list to walk, just a number of times to do something. **range** makes the numbers for you. `range(3)` gives 0, 1 and 2: three rounds, starting from 0." },
      { code: r`for i in range(3):
    print("Knead", i)`, out: "Knead 0\nKnead 1\nKnead 2" },
      { p: "If you don't need the number, the loop still runs the right number of times:" },
      { code: r`for i in range(2):
    print("Fold the dough.")`, out: "Fold the dough.\nFold the dough." },
      { h: "Counting from 1" },
      { p: "range starts at 0 because Python counts positions from 0, like list indexes. The loop variable is an ordinary number, so a little sum turns it into whatever you need." },
      { code: r`for i in range(3):
    print("Day", i + 1)`, out: "Day 1\nDay 2\nDay 3" },
      { h: "Start and stop" },
      { p: "With two numbers, `range(start, stop)` begins at start and stops **just before** stop." },
      { code: r`for n in range(2, 5):
    print(n)`, out: "2\n3\n4" },
      { h: "Steps" },
      { p: "A third number is the step: how far to jump each round." },
      { code: r`for minute in range(0, 20, 5):
    print(minute)`, out: "0\n5\n10\n15" },
      { p: "20 isn't printed: the stop is never included, even when the steps land on it exactly. To include it, stop a little later: `range(0, 21, 5)` reaches 20." },
      { h: "Counting down" },
      { p: "A step below zero counts down. The stop still isn't included." },
      { code: r`for n in range(9, 0, -2):
    print(n)
print("Bells!")`, out: "9\n7\n5\n3\n1\nBells!" },
      { p: "To count down by ones, the step is `-1`." },
      { tip: "If the numbers can't get from start to stop, there are no rounds at all, and Python doesn't complain. `range(5, 2)` counts up from 5, and 5 is already past 2." },
      { code: r`for n in range(5, 2):
    print(n)
print("done")`, out: "done" },
      { h: "range and a list's length" },
      { p: "`range(len(things))` gives every index of a list, which is handy when you need positions. Hazel's bakery has a neater way to get positions too: see **enumerate**." },
      { code: r`tools = ["saw", "plane"]
for i in range(len(tools)):
    print(i, tools[i])`, out: "0 saw\n1 plane" },
    ],
  },
  {
    id: "accumulators",
    title: "Accumulators: totals and counts",
    summary: "Add up, count and multiply as a loop goes round.",
    blocks: [
      { p: "An **accumulator** is a variable that gathers an answer as a loop goes round. Make it before the loop, then add to it in every round. When the loop ends, it holds the whole answer." },
      { code: r`jars = [250, 400, 150]
total = 0
for grams in jars:
    total += grams
print("Honey:", total, "g")`, out: "Honey: 800 g" },
      { p: "Follow it by hand: total is 0, then 250, then 650, then 800. That's exactly what the loop does." },
      { h: "Counting" },
      { p: "Counting is an accumulator that adds 1, with an `if` deciding which rounds count." },
      { code: r`apples = [120, 90, 150, 101]
big = 0
for a in apples:
    if a > 100:
        big += 1
print(big, "big apples")`, out: "3 big apples" },
      { h: "Adding different amounts" },
      { p: "`sum()` adds up a whole list in one go, but only when every item counts the same. When some items count differently, the loop decides each one's share. Here heavy parcels cost more to carry:" },
      { code: r`parcels = [2, 7, 4, 9]
coins = 0
for kg in parcels:
    if kg > 5:
        coins += 3
    else:
        coins += 1
print(coins, "coins")`, out: "8 coins" },
      { p: "One loop can keep several accumulators at once: a total and a count, side by side." },
      { tip: "Make the accumulator **before** the loop. Made inside the loop, it's wiped back to 0 every round, and you're left with only the last item." },
      { code: r`jars = [250, 400, 150]
for grams in jars:
    total = 0
    total += grams
print(total)`, out: "150" },
      { h: "Multiplying" },
      { p: "To multiply things together, start at 1 instead of 0 (start at 0, and everything times 0 stays 0)." },
      { code: r`growth = [2, 3, 2]
size = 1
for g in growth:
    size *= g
print(size)`, out: "12" },
    ],
  },
  {
    id: "loop-search",
    title: "Searching with loops",
    summary: "The first match (break) and the best so far (a tracker).",
    blocks: [
      { p: "Loops are good at looking for things. Two patterns come up again and again: the first match, and the best one. (A third, whether there's any match at all, has its own page: **Flags**.)" },
      { h: "The first match: break" },
      { p: "When you only need the first thing that fits, stop as soon as you find it. `break` ends the loop at once, just as it did in `while` loops. Keep what you found in a variable: it's still there after the loop." },
      { code: r`eggs = [52, 58, 64, 61]
for egg in eggs:
    if egg > 60:
        big_egg = egg
        break
print("First big egg:", big_egg)`, out: "First big egg: 64" },
      { p: "Without `break`, the loop carries on, and the variable ends up holding the **last** match (61), not the first." },
      { h: "The best so far: a tracker" },
      { p: "`max()` finds the biggest number in a list. When 'best' means something `max()` can't see, keep a **tracker**: a variable holding the best so far, replaced only when something beats it." },
      { code: r`words = ["fig", "pumpkin", "pear", "parsnip"]
longest = ""
for w in words:
    if len(w) > len(longest):
        longest = w
print(longest)`, out: "pumpkin" },
      { tip: "pumpkin and parsnip are both 7 letters. With `>` the tracker keeps the first one it found; `>=` would switch to the later one on every tie." },
    ],
  },
  {
    id: "flags",
    title: "Flags: did anything match?",
    summary: "A True/False variable that remembers whether any round of a loop found something.",
    blocks: [
      { p: "Sometimes the question is yes or no: is *any* apple bruised? Use a **flag**, a variable set to `False` before the loop. Any round that finds a match sets it to `True`. Nothing sets it back, so after the loop it remembers." },
      { code: r`apples = ["red", "green", "bruised", "red"]
bruised = False
for a in apples:
    if a == "bruised":
        bruised = True
if bruised:
    print("Sort the crate.")
else:
    print("All good.")`, out: "Sort the crate." },
      { tip: "Don't give the 'none matched' answer in an `else` inside the loop. It would speak up for every single apple that wasn't bruised:" },
      { code: r`apples = ["red", "bruised", "red"]
for a in apples:
    if a == "bruised":
        print("Bruised!")
    else:
        print("All good.")`, out: "All good.\nBruised!\nAll good." },
    ],
  },
  {
    id: "building-lists",
    title: "Building lists in a loop",
    summary: "Make a new list of changed items, or only the items that pass a test.",
    blocks: [
      { p: "To make a new list from an old one, start with an empty list `[]` before the loop and `append` to it each round." },
      { code: r`ages = [7, 30, 12]
next_year = []
for a in ages:
    next_year.append(a + 1)
print(next_year)`, out: "[8, 31, 13]" },
      { p: "`ages` hasn't changed: the loop only read it, and every new number went into `next_year`." },
      { tip: "Multiplying a whole list doesn't multiply its numbers. It repeats the list:" },
      { code: r`print([2, 5] * 3)`, out: "[2, 5, 2, 5, 2, 5]" },
      { h: "Filtering: only some items" },
      { p: "Put an `if` around the `append`, and only the items that pass go into the new list." },
      { code: r`words = ["oak", "willow", "ash", "birch"]
short = []
for w in words:
    if len(w) <= 3:
        short.append(w)
print(short)`, out: "['oak', 'ash']" },
      { h: "Two lists from one loop" },
      { p: "With an `else`, every item lands in one list or the other." },
      { code: r`marks = [7, 3, 9, 4]
passed = []
retry = []
for m in marks:
    if m >= 5:
        passed.append(m)
    else:
        retry.append(m)
print(passed, retry)`, out: "[7, 9] [3, 4]" },
      { tip: "Never `remove` items from the list you're walking. The loop loses its place and skips the item after each one you take out. Here 6 is even, but it survives:" },
      { code: r`nums = [2, 4, 5, 6]
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)`, out: "[4, 5]" },
    ],
  },
  {
    id: "enumerate",
    title: "enumerate(): numbers with your items",
    summary: "Get each item's position along with the item, counting from 0 or from 1.",
    blocks: [
      { p: "Sometimes you need each item **and** its position. `enumerate` hands you both every round: first the number, then the item." },
      { code: r`flowers = ["rose", "tulip", "daisy"]
for n, flower in enumerate(flowers):
    print(n, flower)`, out: "0 rose\n1 tulip\n2 daisy" },
      { p: "Put two names between `for` and `in`, with a comma between them: the number first, then the item." },
      { h: "Counting from 1" },
      { p: "Like `range`, `enumerate` counts from 0 unless you tell it otherwise. `start=1` makes it count the way people do." },
      { code: r`queue = ["Wren", "Marlo", "Sable"]
for place, name in enumerate(queue, start=1):
    print(f"{place}: {name}")`, out: "1: Wren\n2: Marlo\n3: Sable" },
      { p: "The numbers come from `enumerate`; the list itself isn't changed." },
      { h: "Using the number" },
      { p: "The number is an ordinary whole number, so it works in sums and `if`s. Here every even-numbered seat gets a cushion:" },
      { code: r`seats = ["oak", "pine", "ash", "elm"]
for n, seat in enumerate(seats, start=1):
    if n % 2 == 0:
        print(seat, "gets a cushion")`, out: "pine gets a cushion\nelm gets a cushion" },
      { h: "enumerate or range(len(...))?" },
      { p: "Both give you positions. `enumerate` is easier to read and hands you the item too, so there's no indexing to get wrong." },
      { code: r`tools = ["saw", "hammer"]
for i in range(len(tools)):
    print(i, tools[i])
for i, tool in enumerate(tools):
    print(i, tool)`, out: "0 saw\n1 hammer\n0 saw\n1 hammer" },
    ],
  },
  {
    id: "zip",
    title: "zip(): lists side by side",
    summary: "Walk two or more lists in step, one item from each every round.",
    blocks: [
      { p: "At the market you kept two lists in step with one index: `names[i]` and `prices[i]`. **zip** walks them together and hands you one item from each list every round." },
      { code: r`hens = ["Bess", "Dot", "Flo"]
eggs = [3, 1, 2]
for hen, laid in zip(hens, eggs):
    print(hen, "laid", laid)`, out: "Bess laid 3\nDot laid 1\nFlo laid 2" },
      { p: "Put one name between `for` and `in` for each list, in the same order as the lists inside `zip(...)`." },
      { h: "Three lists or more" },
      { code: r`fruit = ["plum", "fig"]
boxes = [4, 2]
each = [6, 9]
for f, b, e in zip(fruit, boxes, each):
    print(f, b * e)`, out: "plum 24\nfig 18" },
      { h: "Lists of different lengths" },
      { p: "zip stops as soon as the shortest list runs out. There's no error; the extra items are just left out, so make sure your lists really are in step." },
      { code: r`for colour, n in zip(["red", "blue", "green"], [5, 8]):
    print(colour, n)`, out: "red 5\nblue 8" },
      { tip: "The names in the `for` line are yours to choose, but their order must match the lists in `zip(...)`. Swap them and every hen lays a name." },
    ],
  },
  {
    id: "string-building",
    title: "Building strings in a loop",
    summary: "Grow a string piece by piece with +=, and remember the item before.",
    blocks: [
      { p: "A string can be an accumulator too. Start with an empty string `\"\"` before the loop and add a piece each round with `+=`." },
      { code: r`names = ["Pip", "Wren", "Bram"]
initials = ""
for name in names:
    initials += name[0]
print(initials)`, out: "PWB" },
      { h: "Choosing each piece" },
      { p: "An `if` in the loop decides which piece gets added this round." },
      { code: r`skies = ["sun", "rain", "sun", "cloud"]
chart = ""
for s in skies:
    if s == "sun":
        chart += "*"
    elif s == "rain":
        chart += "~"
    else:
        chart += "."
print("Week:", chart)`, out: "Week: *~*." },
      { h: "Numbers need str()" },
      { p: "Adding a number to a string with `+` is a `TypeError`. Turn it into text first with `str()`, or use an f-string." },
      { code: r`line = ""
for n in [3, 1, 4]:
    line += str(n) + " "
print(line)`, out: "3 1 4" },
      { p: "There's a space after the 4 as well. You can't see it, but it's there: every round added a number *and* a space." },
      { h: "Remembering the one before" },
      { p: "Some loops need the previous item as well as this one. Keep it in a variable: start it with the first item, walk the rest with a slice, and update it at the end of every round." },
      { code: r`steps = [3, 5, 5, 2]
last = steps[0]
for s in steps[1:]:
    print(s - last)
    last = s`, out: "2\n0\n-3" },
      { tip: "Build the line in the loop and print it once, after the loop, and you get one line. Print it inside the loop and you get a line every round, each a little longer." },
    ],
  },
  {
    id: "nested-loops",
    title: "Nested loops",
    summary: "A loop inside a loop: rows and columns, trays and buns, grids.",
    blocks: [
      { p: "A loop can sit inside another loop. The **outer** loop goes round once, and in that one round the **inner** loop runs all the way through. Then the outer loop goes round again, and the inner loop starts over." },
      { code: r`for row in ["A", "B"]:
    for seat in range(1, 4):
        print(row, seat)`, out: "A 1\nA 2\nA 3\nB 1\nB 2\nB 3" },
      { p: "2 rows times 3 seats makes 6 rounds of the inner line." },
      { h: "A grid, one line at a time" },
      { p: "To print a grid, build each line in the inner loop and print it when the inner loop is done. Start each line fresh at the top of the outer loop." },
      { code: r`for r in range(3):
    line = ""
    for c in range(4):
        line += "."
    print(line)`, out: "....\n....\n...." },
      { h: "Using both numbers" },
      { p: "Inside the inner loop you can use both loop variables. The inner range can even depend on the outer number:" },
      { code: r`for r in range(1, 4):
    line = ""
    for c in range(r):
        line += "*"
    print(line)`, out: "*\n**\n***" },
      { p: "Or decide each spot from where it is. Here only the spots where the row and the column are the same get a mark:" },
      { code: r`for r in range(3):
    line = ""
    for c in range(3):
        if r == c:
            line += "X"
        else:
            line += "-"
    print(line)`, out: "X--\n-X-\n--X" },
      { tip: "Indentation decides which loop a line belongs to. A `print` indented under the inner loop runs every inner round; under the outer loop, once per row; back at the edge, once in all." },
      { tip: "A counter for the whole grid starts before both loops. Started inside the outer loop, it's wiped at every new row." },
    ],
  },
];
