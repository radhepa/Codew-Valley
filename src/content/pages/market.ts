import type { CodexPage } from "../types.ts";

// Codex pages for Market Square (building 4): lists.
// Page ids must be unique across the whole Codex (content tests check).
// Examples use their own names and values, never a challenge's (CHALLENGES.md).
const r = String.raw;

export const MARKET_PAGES: CodexPage[] = [
  {
    id: "lists",
    title: "Lists",
    summary: "Many values in one name, in order: [ ], len(), empty lists.",
    blocks: [
      { p: "A **list** keeps many values together under one name, in order. Square brackets go round the outside and commas go between the items." },
      { code: r`eggs = ["brown", "white", "speckled"]
print(eggs)`, out: "['brown', 'white', 'speckled']" },
      { p: "Python prints a list with its brackets and quotes, so you can see exactly what it holds. (It shows text in single quotes; that's just its habit.)" },
      { p: "A list can hold numbers too. `len()` counts the **items** in a list, not the letters." },
      { code: r`weights = [3, 12, 7, 1]
print(len(weights))
print(len(["oak", "ash"]))`, out: "4\n2" },
      { h: "One string, or a list?" },
      { p: "`\"oak, ash, elm\"` is one string that happens to have commas in it. `[\"oak\", \"ash\", \"elm\"]` is three separate items, each with its own quotes." },
      { code: r`print(len("oak, ash, elm"))
print(len(["oak", "ash", "elm"]))`, out: "13\n3" },
      { tip: "Every text item needs its own quotes, and every pair of items needs a comma between them. Forget a comma between two strings and Python quietly glues them into one item:" },
      { code: r`print(["fig" "plum", "pear"])`, out: "['figplum', 'pear']" },
      { h: "Empty lists" },
      { p: "`[]` is a list with nothing in it yet. Its length is 0." },
      { code: r`basket = []
print(basket)
print(len(basket))`, out: "[]\n0" },
      { p: "An empty list counts as False in an if, just like `\"\"` and `0`. Any list with something in it counts as True." },
      { code: r`crumbs = []
if crumbs:
    print("Feed the ducks")
else:
    print("Nothing for the ducks")`, out: "Nothing for the ducks" },
      { h: "Joining and repeating" },
      { p: "`+` joins two lists into a new one, and `*` repeats a list, just as they do for strings." },
      { code: r`left = ["hat", "scarf"]
right = ["boots"]
print(left + right)
print([0] * 4)`, out: "['hat', 'scarf', 'boots']\n[0, 0, 0, 0]" },
    ],
  },
  {
    id: "list-index",
    title: "List indexes and changing items",
    summary: "items[0], items[-1], IndexError, and items[i] = new.",
    blocks: [
      { p: "Each item in a list has a position, its **index**, and counting starts at **0**, exactly as it does for the letters of a string." },
      { code: r`boats = ["skiff", "punt", "raft", "barge"]
print(boats[0])
print(boats[1])`, out: "skiff\npunt" },
      { tip: "People count from 1 and Python counts from 0, so the \"fifth\" item is at index 4. When in doubt, write the indexes under the items on paper." },
      { h: "Counting from the end" },
      { p: "Negative indexes count from the back: `[-1]` is the last item, and each step further from the end is one more below zero." },
      { code: r`boats = ["skiff", "punt", "raft", "barge"]
print(boats[-1])
print(boats[-3])`, out: "barge\npunt" },
      { p: "`[-1]` finds the last item however long the list grows. A fixed number like `[3]` only finds the last item while the list has exactly four." },
      { h: "IndexError" },
      { p: "Asking for a position the list doesn't have stops the program with an `IndexError`. A list of four items has indexes 0 to 3:" },
      { code: r`boats = ["skiff", "punt", "raft", "barge"]
print(boats[4])`, err: "IndexError" },
      { h: "Changing an item" },
      { p: "Put an index on the left of `=` and that one item is replaced. The rest of the list stays exactly where it was. No new list is made: the list itself changes." },
      { code: r`cups = ["blue", "chipped", "green", "cracked"]
cups[1] = "yellow"
cups[-1] = "red"
print(cups)`, out: "['blue', 'yellow', 'green', 'red']" },
      { h: "Strings can't change" },
      { p: "Lists can be changed after they're made. Strings can't: trying to swap one letter is a `TypeError`." },
      { code: r`word = "BOAT"
word[0] = "C"`, err: "TypeError" },
      { p: "Instead, build a **new** string out of pieces (slices, `+`, `.replace()`) and store it back in the same name:" },
      { code: r`word = "BOAT"
word = "C" + word[1:]
print(word)`, out: "COAT" },
    ],
  },
  {
    id: "list-methods",
    title: "append, insert, remove, pop",
    summary: "Growing and shrinking a list, and the None trap.",
    blocks: [
      { p: "A **method** is something a list can do to itself, written `name.method(...)`. These four change the list in place." },
      { h: "append: add to the end" },
      { code: r`shopping = []
shopping.append("eggs")
shopping.append("milk")
print(shopping)`, out: "['eggs', 'milk']" },
      { p: "Lists are often built up like this: start empty, and append each thing as it happens. A loop can do the appending:" },
      { code: r`lane = []
steps = 3
while steps > 0:
    lane.append(steps)
    steps -= 1
print(lane)`, out: "[3, 2, 1]" },
      { h: "The None trap" },
      { p: "`append` changes the list and gives back `None` (Python's word for \"nothing\"). So never store what it gives back: `jars = jars.append(\"x\")` throws your list away and leaves `None` in its place." },
      { code: r`jars = ["jam"]
result = jars.append("honey")
print(result)
print(jars)`, out: "None\n['jam', 'honey']" },
      { h: "insert: add at a position" },
      { p: "`list.insert(index, item)` puts the item at that index, and everything from there on shuffles one place to the right." },
      { code: r`queue = ["Ada", "Ben", "Cy"]
queue.insert(1, "Dot")
print(queue)`, out: "['Ada', 'Dot', 'Ben', 'Cy']" },
      { h: "remove: take away by value" },
      { p: "`list.remove(item)` takes away the **first** item equal to it. Any others stay." },
      { code: r`socks = ["red", "grey", "red"]
socks.remove("red")
print(socks)`, out: "['grey', 'red']" },
      { p: "Removing something that isn't in the list is a `ValueError`. (The page on searching lists shows how to ask first.)" },
      { code: r`socks = ["grey"]
socks.remove("blue")`, err: "ValueError" },
      { h: "pop: take out by position, and keep it" },
      { p: "`list.pop()` takes the last item out and **gives it back**, so you can store it. `list.pop(0)` takes the first one instead; any index works." },
      { code: r`stack = ["plate", "bowl", "cup"]
top = stack.pop()
print(top)
first = stack.pop(0)
print(first)
print(stack)`, out: "cup\nplate\n['bowl']" },
      { tip: "`remove` asks *which value*. `pop` asks *which position*, and hands you the item." },
    ],
  },
  {
    id: "list-search",
    title: "Searching lists: in, count, index",
    summary: "Whole-item in, guards before remove, count() and index().",
    blocks: [
      { p: "`in` works on lists too, but on a list it looks for a **whole item**. On a string it looks for any run of letters." },
      { code: r`pantry = ["oatmeal", "salt"]
print("oat" in pantry)
print("oat" in "oatmeal, salt")
print("salt" in pantry)`, out: "False\nTrue\nTrue" },
      { p: "`not in` asks the opposite question." },
      { h: "Look before you leap" },
      { p: "`in` and `not in` give True or False, so they fit straight into an if:" },
      { code: r`pantry = ["oatmeal", "salt"]
if "salt" in pantry:
    print("Pass the salt")
if "sugar" not in pantry:
    print("Sugar goes on the shopping list")`, out: "Pass the salt\nSugar goes on the shopping list" },
      { p: "Some list methods only work when the item is there: `remove` and `index` stop with a `ValueError` otherwise. Others are harmless but can do a job twice. Asking with `in` first, and only acting on the answer, protects you from both." },
      { h: "count: how many?" },
      { code: r`votes = ["owl", "fox", "owl", "owl", "hare"]
print(votes.count("owl"))
print(votes.count("bear"))`, out: "3\n0" },
      { h: "index: where?" },
      { p: "`list.index(item)` gives the position of the **first** match, counting from 0." },
      { code: r`votes = ["owl", "fox", "owl", "owl", "hare"]
print(votes.index("fox"))
print(votes.index("owl"))`, out: "1\n0" },
      { p: "`index` works on a slice too, but then it counts from the start of the slice, not the start of the list:" },
      { code: r`votes = ["owl", "fox", "owl", "owl", "hare"]
print(votes[3:])
print(votes[3:].index("hare"))`, out: "['owl', 'hare']\n1" },
      { p: "Asking for the index of something that isn't there is a `ValueError`, so check with `in` first when it might be missing." },
      { code: r`votes = ["owl", "fox"]
print(votes.index("bear"))`, err: "ValueError" },
    ],
  },
  {
    id: "sorting",
    title: "Sorting: sort() and sorted()",
    summary: "Sort in place or make a sorted copy; reverse=True; the None trap.",
    blocks: [
      { p: "`list.sort()` sorts the list itself: numbers from small to big, text from A to Z." },
      { code: r`ages = [9, 3, 7]
ages.sort()
print(ages)`, out: "[3, 7, 9]" },
      { p: "Add `reverse=True` for big to small (or Z to A):" },
      { code: r`ages = [9, 3, 7]
ages.sort(reverse=True)
print(ages)`, out: "[9, 7, 3]" },
      { h: "sorted(): a sorted copy" },
      { p: "`sorted(list)` makes a **new**, sorted list and leaves the original exactly as it was. It takes `reverse=True` too." },
      { code: r`birds = ["wren", "jay", "owl"]
print(sorted(birds))
print(sorted(birds, reverse=True))
print(birds)`, out: "['jay', 'owl', 'wren']\n['wren', 'owl', 'jay']\n['wren', 'jay', 'owl']" },
      { tip: "Use `sort()` when the old order doesn't matter any more. Use `sorted()` when you must keep the original and want a sorted version to show or use." },
      { h: "The None trap" },
      { p: "Like `append`, `sort()` changes the list and gives back `None`. Store what it gives back and the list is gone:" },
      { code: r`ages = [9, 3, 7]
ages = ages.sort()
print(ages)`, out: "None" },
      { tip: "Capital letters sort before small ones, so keep your text all one case if the order matters." },
      { code: r`print(sorted(["b", "A", "a"]))`, out: "['A', 'a', 'b']" },
    ],
  },
  {
    id: "list-maths",
    title: "sum, min, max and averages",
    summary: "Totals, extremes and averages of a whole list at once.",
    blocks: [
      { p: "`sum()`, `min()`, `max()` and `len()` each take a whole list." },
      { code: r`rain = [4, 0, 11, 6, 3]
print(sum(rain))
print(min(rain))
print(max(rain))
print(len(rain))`, out: "24\n0\n11\n5" },
      { h: "Averages" },
      { p: "An average is the total shared out over how many there are. Use `len()` rather than typing the count, so the average stays right when the list grows. `round(x, 1)` keeps one decimal place." },
      { code: r`rain = [4, 0, 11, 6, 3]
print(sum(rain) / len(rain))
rain.append(9)
print(round(sum(rain) / len(rain), 1))`, out: "4.8\n5.5" },
      { p: "The difference between the biggest and the smallest is called the **spread**:" },
      { code: r`rain = [4, 0, 11, 6, 3]
print(max(rain) - min(rain))`, out: "11" },
      { p: "`min` and `max` work on text too, by A-to-Z order:" },
      { code: r`print(max(["fig", "apple", "date"]))`, out: "fig" },
      { h: "Empty lists" },
      { p: "`sum([])` is 0, but there is no biggest item in an empty list, and you can't share a total out over nothing:" },
      { code: r`print(max([]))`, err: "ValueError" },
      { code: r`days = []
print(sum(days) / len(days))`, err: "ZeroDivisionError" },
    ],
  },
  {
    id: "list-slicing",
    title: "Slicing and copying lists",
    summary: "items[1:3], items[:2], items[-2:], and real copies with [:].",
    blocks: [
      { p: "Slices work on lists exactly as on strings: `items[start:stop]` is a **new list** of the items from `start` up to, but not including, `stop`. Leave a side empty to go from the beginning or to the end." },
      { code: r`hens = ["Ada", "Bea", "Cleo", "Dot", "Eve"]
print(hens[1:3])
print(hens[:2])
print(hens[-3:])`, out: "['Bea', 'Cleo']\n['Ada', 'Bea']\n['Cleo', 'Dot', 'Eve']" },
      { tip: "`[:3]` is always the first three and `[-3:]` the last three, however long the list is. A slice never gives an `IndexError`: it just gives what there is." },
      { code: r`print(["oak"][:3])`, out: "['oak']" },
      { h: "Two names, one list" },
      { p: "`b = a` does **not** copy a list. It gives the same list a second name, so a change through either name shows up in both." },
      { code: r`a = ["oak", "ash"]
b = a
b.append("elm")
print(a)`, out: "['oak', 'ash', 'elm']" },
      { h: "A real copy" },
      { p: "A slice of the whole list, `[:]`, is a new list with the same items. Change the copy and the original stays as it was." },
      { code: r`a = ["oak", "ash"]
c = a[:]
c.append("elm")
print(a)
print(c)`, out: "['oak', 'ash']\n['oak', 'ash', 'elm']" },
    ],
  },
  {
    id: "lists-while",
    title: "Walking a list with while",
    summary: "Visit every item with an index: totals, changes, choosing.",
    blocks: [
      { p: "To do something with every item, walk the list with an index: start at 0, look at `list[i]`, move `i` on by one, and stop when `i` reaches `len(list)`." },
      { code: r`cups = ["tea", "cocoa", "milk"]
i = 0
while i < len(cups):
    print(f"Cup {i + 1}: {cups[i]}")
    i += 1`, out: "Cup 1: tea\nCup 2: cocoa\nCup 3: milk" },
      { tip: "`i < len(cups)` stops just in time: the last index is one less than the length. With `<=` the walk goes one step too far:" },
      { code: r`cups = ["tea", "cocoa"]
i = 0
while i <= len(cups):
    print(cups[i])
    i += 1`, err: "IndexError" },
      { h: "Adding up as you go" },
      { p: "Keep a total that starts at 0 and grows by each item:" },
      { code: r`steps = [1200, 3400, 900]
total = 0
i = 0
while i < len(steps):
    total += steps[i]
    i += 1
print(total)`, out: "5500" },
      { h: "Changing every item" },
      { code: r`heights = [3, 5, 2]
i = 0
while i < len(heights):
    heights[i] = heights[i] * 2
    i += 1
print(heights)`, out: "[6, 10, 4]" },
      { h: "Choosing items into a new list" },
      { p: "Start an empty list, then append only the items that pass a test. The original list stays as it was." },
      { code: r`apples = [140, 95, 180, 120, 60]
big = []
i = 0
while i < len(apples):
    if apples[i] >= 120:
        big.append(apples[i])
    i += 1
print(big)`, out: "[140, 180, 120]" },
      { tip: "Put `i += 1` at the end of the loop body, not inside an if: if it only happens sometimes, the walk can get stuck on one item forever (that's what the Stop button is for). And don't remove items from the list you're walking: everything shifts left and the walk skips one." },
      { tip: "That's a lot of bookkeeping just to say \"do this with each item\". There is a shorter way. Hazel, at the bakery, will show you. Pip has promised not to spoil it." },
    ],
  },
  {
    id: "parallel-lists",
    title: "Lists in step",
    summary: "Two lists where the same index means the same thing.",
    blocks: [
      { p: "Sometimes two lists go together: the item at index 0 in one belongs with the item at index 0 in the other, and so on. They are **in step**." },
      { code: r`names = ["Ada", "Bo", "Cy"]
ages = [7, 9, 4]
print(names[1], ages[1])`, out: "Bo 9" },
      { h: "Looking something up" },
      { p: "Find the position in one list with `index`, then look at the same position in the other:" },
      { code: r`names = ["Ada", "Bo", "Cy"]
ages = [7, 9, 4]
i = names.index("Cy")
print(ages[i])`, out: "4" },
      { h: "Walking both at once" },
      { p: "One index walks both lists, because the same position means the same person:" },
      { code: r`names = ["Ada", "Bo", "Cy"]
ages = [7, 9, 4]
i = 0
while i < len(names):
    print(f"{names[i]} is {ages[i]}")
    i += 1`, out: "Ada is 7\nBo is 9\nCy is 4" },
      { h: "A counting list" },
      { p: "To count something for each name, keep a list of zeros in step with the names, and add 1 at the right position:" },
      { code: r`names = ["Ada", "Bo", "Cy"]
stars = [0] * len(names)
stars[names.index("Bo")] += 1
stars[names.index("Bo")] += 1
stars[names.index("Ada")] += 1
print(stars)`, out: "[1, 2, 0]" },
      { tip: "Lists in step only work while they stay in step. If you add to one, add to the other at the same position, and never sort just one of them." },
    ],
  },
];
