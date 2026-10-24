import type { CodexPage } from "../types.ts";

// Codex pages for Fisher's Dock (building 3): while loops, counters, break / continue and import random.
// Page ids must be unique across the whole Codex (content tests check).
const r = String.raw;

export const DOCK_PAGES: CodexPage[] = [
  {
    id: "while",
    title: "while: doing it again",
    summary: "Repeat some lines for as long as a condition stays True.",
    blocks: [
      { p: "A **while loop** repeats its indented lines for as long as its condition is `True`. Python asks the question, runs the block, goes back up, asks again, and so on. The first time the answer is `False`, it skips past the loop and carries on below." },
      { code: r`knocks = 0
while knocks < 3:
    print("Knock!")
    knocks = knocks + 1
print("Who's there?")`, out: "Knock!\nKnock!\nKnock!\nWho's there?" },
      { h: "Round by round" },
      { p: "`knocks` is 0, and `0 < 3` is True: knock, and `knocks` becomes 1. `1 < 3`: knock, 2. `2 < 3`: knock, 3. Now `3 < 3` is False, so the loop is over and \"Who's there?\" prints. Each trip through the block is called a **round** (or an *iteration*)." },
      { p: "The last line of the block is what makes the loop end: it moves `knocks` closer to 3 every round. A variable like this, which keeps count of the rounds, is called a **counter**. You can print it, too:" },
      { code: r`lap = 10
while lap < 13:
    print(f"Lap {lap} done")
    lap = lap + 1`, out: "Lap 10 done\nLap 11 done\nLap 12 done" },
      { h: "Checked before every round" },
      { p: "The condition is asked **before** each round, never in the middle. So if it is False right at the start, the block never runs at all:" },
      { code: r`logs = 0
while logs > 0:
    print("Burn a log")
    logs = logs - 1
print("The fire is out.")`, out: "The fire is out." },
      { h: "Any question will do" },
      { p: "The condition doesn't have to be about a counter. Any True-or-False question works, as long as something inside the loop changes the answer eventually. This one shrinks:" },
      { code: r`soup = 100
while soup > 30:
    soup = soup - 25
    print(f"Slurp! {soup} left")`, out: "Slurp! 75 left\nSlurp! 50 left\nSlurp! 25 left" },
      { p: "Notice it went below 30: at 50 the question was still True, so one more slurp happened. And this one grows by doubling:" },
      { code: r`coins = 1
while coins < 50:
    coins = coins * 2
print(coins)`, out: "64" },
      { p: "To pick the condition, finish the sentence \"keep going *while*...\". *While* the soup is more than 30. *While* the coins are fewer than 50. If you think of it as \"stop *when*...\", flip it round: stop when the coins reach 50 means keep going while they are below 50." },
      { tip: "A while line looks like an if line: the word, a condition, a colon, and an indented block. In fact, a while is an if that keeps asking." },
    ],
  },
  {
    id: "loop-counters",
    title: "Counters: up, down and in steps",
    summary: "Counting down, counting by fives, < vs <=, running totals, and counting only some rounds.",
    blocks: [
      { p: "A counter can move any way you like. Count **down** by taking away, and the loop runs while there is something left:" },
      { code: r`candles = 3
while candles > 0:
    candles = candles - 1
    print(f"Puff! Still lit: {candles}")`, out: "Puff! Still lit: 2\nPuff! Still lit: 1\nPuff! Still lit: 0" },
      { p: "Or count in **steps** bigger than one:" },
      { code: r`pages = 5
while pages <= 20:
    print(pages)
    pages = pages + 5`, out: "5\n10\n15\n20" },
      { h: "Where does it stop?" },
      { p: "`<` stops *before* the end; `<=` gives the end a turn too. Here are the same fence posts, every 2 metres, with the two signs:" },
      { code: r`post = 2
while post < 8:
    print(post)
    post = post + 2`, out: "2\n4\n6" },
      { code: r`post = 2
while post <= 8:
    print(post)
    post = post + 2`, out: "2\n4\n6\n8" },
      { p: "Before you run a loop, work out its **last round** on paper: what is the counter, and is the condition still True? That one question catches most loop mistakes." },
      { h: "Running totals" },
      { p: "Some loops don't count to a number you know. They keep **adding up** until a total is big enough, and count the rounds as they go. You find out how many rounds it took only at the end:" },
      { code: r`honey = 0
jars = 0
while honey < 20:
    honey = honey + 6
    jars = jars + 1
print(f"{jars} jars, {honey} spoonfuls")`, out: "4 jars, 24 spoonfuls" },
      { p: "The amount you add can change every round too. Here each push rolls the snowball 3 further than the last:" },
      { code: r`push = 2
rolled = 0
while rolled < 20:
    rolled = rolled + push
    push = push + 3
    print(rolled)`, out: "2\n7\n15\n26" },
      { h: "Counting only some rounds" },
      { p: "Put an `if` inside the loop, indented one step further, and it is asked every round. A second counter that only changes inside the `if` counts the rounds where the answer was yes:" },
      { code: r`n = 1
odd = 0
while n <= 9:
    if n % 2 == 1:
        odd = odd + 1
    n = n + 1
print(f"{odd} odd numbers")`, out: "5 odd numbers" },
      { p: "Look at the indentation: `odd = odd + 1` belongs to the `if`, but `n = n + 1` belongs to the loop, so it happens every round, yes or no." },
      { tip: "Most counters change on the last line of the block. If you need the new value straight away (to print \"round 1\" in the first round, say), change it first and use it after." },
    ],
  },
  {
    id: "endless-loops",
    title: "Endless loops",
    summary: "Why a loop never stops, what the stone does about it, and how to find the cause.",
    blocks: [
      { p: "A while loop stops only when its condition is False at the moment it's asked. If nothing inside the loop ever moves the condition towards False, the loop runs **forever**: an *endless* (or *infinite*) loop." },
      { p: "Don't worry, you can't break anything. If a program is still running after a few seconds, the rune stone stops it, and Pip says *That took too long*. Then it's detective time." },
      { h: "Three ways to get stuck" },
      { p: "**1. The variable never changes.** In `while bread > 0:` with only `print(\"Nibble\")` inside, `bread` stays the same forever. The fix is a line inside the loop, like `bread = bread - 1`." },
      { p: "**2. It changes in the wrong place.** A `bread = bread - 1` that sits at the left edge, under the loop instead of inside it, only runs after the loop is over, which is never. Indentation decides what belongs to the loop." },
      { p: "**3. It jumps over the finish.** With `!=`, the counter has to land on the exact number. Counting by 4 from 1 goes 1, 5, 9, 13... and never lands on 10, so `while jump != 10:` never ends. Use `<`, `>`, `<=` or `>=`, which can't be jumped over:" },
      { code: r`jump = 1
while jump < 10:
    jump = jump + 4
print(jump)`, out: "13" },
      { h: "Watch it run" },
      { p: "When a loop surprises you, put a `print` inside it and watch the numbers go by. You'll often see the problem in the first few lines:" },
      { code: r`level = 50
while level > 10:
    level = level // 3
    print("level is now", level)`, out: "level is now 16\nlevel is now 5" },
      { tip: "Ask the detective's question: *what has to change for this condition to become False, and does it?* Then check that the changing line is inside the loop, and moving the right way." },
    ],
  },
  {
    id: "break-continue",
    title: "while True, break and continue",
    summary: "Leave a loop with break; skip one round with continue.",
    blocks: [
      { h: "break" },
      { p: "`break` leaves the loop **at once**, even if its condition is still True. Python carries on with the first line after the loop. It is usually inside an `if`, which says when." },
      { p: "`while True:` asks a question whose answer is always True, so the loop would run forever. Add a `break` and *it* decides when the loop ends. This is handy when the right moment to stop is in the middle of a round, or when you'll only know it when you see it:" },
      { code: r`kettle = 15
while True:
    kettle = kettle + 20
    print(f"Kettle at {kettle} degrees")
    if kettle >= 90:
        break
print("Tea time!")`, out: "Kettle at 35 degrees\nKettle at 55 degrees\nKettle at 75 degrees\nKettle at 95 degrees\nTea time!" },
      { p: "It's a good way to search, too: try one number after another until one fits. Here, the first number after 50 that ends in 7:" },
      { code: r`n = 50
while True:
    n = n + 1
    if n % 10 == 7:
        break
print(n)`, out: "57" },
      { h: "continue" },
      { p: "`continue` skips the **rest of this round** and goes straight back up to the loop's condition. The loop isn't over, only this round is:" },
      { code: r`plate = 0
while plate < 4:
    plate = plate + 1
    if plate == 2:
        print("Plate 2 is chipped. Skip it.")
        continue
    print(f"Washing plate {plate}")`, out: "Washing plate 1\nPlate 2 is chipped. Skip it.\nWashing plate 3\nWashing plate 4" },
      { h: "The continue trap" },
      { p: "Everything below a `continue` is skipped, *including* a counter change at the bottom of the loop. If `plate = plate + 1` were the last line above, plate 2 would be skipped, then checked again, then skipped again, forever. That's why the counter moves at the **top** of the round here." },
      { tip: "`break` and `continue` work on the loop they are in, even from inside an `if`. A `break` inside an `if` leaves the whole loop, not just the `if`." },
    ],
  },
  {
    id: "random",
    title: "Random numbers and seeds",
    summary: "import random, randint, random() and why seeds make dice repeatable.",
    blocks: [
      { p: "Python keeps extra tools in **modules**. `import random` at the top of a program opens the box of chance; then you use its tools with a dot: `random.randint(...)`. Forget the import and you get a `NameError`." },
      { h: "Whole numbers: randint" },
      { p: "`random.randint(a, b)` rolls a whole number from `a` to `b`, **both ends included**. `random.randint(1, 6)` is a six-sided die: it can give 1 and it can give 6." },
      { code: r`import random
roll = random.randint(1, 6)
print(roll >= 1 and roll <= 6)`, out: "True" },
      { h: "Chances: random()" },
      { p: "`random.random()` gives a decimal from 0 up to, but never quite, 1. That makes chances easy: `random.random() < 0.25` is True about a quarter of the time." },
      { code: r`import random
if random.random() < 0.25:
    print("A rare blue butterfly!")
print("The meadow is quiet.")` },
      { h: "Seeds" },
      { p: "A program with dice does something different each run, which is fun to play and hard to check. A **seed** fixes the dice: after `random.seed(n)`, the same rolls come out in the same order every single run. A different seed gives different (but just as repeatable) rolls." },
      { code: r`import random
random.seed(12)
first = random.randint(1, 100)
random.seed(12)
again = random.randint(1, 100)
print(first == again)`, out: "True" },
      { p: "Here are three dice added up with a seed, so this example prints the same total every time:" },
      { code: r`import random
random.seed(8)
total = 0
dice = 0
while dice < 3:
    total = total + random.randint(1, 6)
    dice = dice + 1
print(total)`, out: "9" },
      { p: "When the rune stone checks a program with dice, it seeds the dice itself, so it knows which rolls will come out. Seed your own program only when a task asks you to." },
      { tip: "The order of the rolls matters with a seed: the first roll after `random.seed(8)` is always the same, and so is the second. Roll in the order the task describes." },
    ],
  },
  {
    id: "walking-strings",
    title: "Walking through a string",
    summary: "Visit every character with an index: while i < len(text).",
    blocks: [
      { p: "`len(text)` is how many characters a string has, and `text[i]` is the one at position `i`, counting from 0. So the positions go from 0 up to `len(text) - 1`, and a counter that climbs while `i < len(text)` visits every one of them:" },
      { code: r`word = "pond"
i = 0
while i < len(word):
    print(i, word[i])
    i = i + 1`, out: "0 p\n1 o\n2 n\n3 d" },
      { p: "Use `<`, not `<=`. With `<=`, the last round asks for `word[4]`, one past the end:" },
      { code: r`word = "pond"
i = 0
while i <= len(word):
    print(word[i])
    i = i + 1`, err: "IndexError" },
      { h: "Building a new string" },
      { p: "Start with an empty string `\"\"` and add to it, one piece per round:" },
      { code: r`word = "heron"
i = 0
loud = ""
while i < len(word):
    loud = loud + word[i].upper() + "!"
    i = i + 1
print(loud)`, out: "H!E!R!O!N!" },
      { h: "Remembering between rounds" },
      { p: "A variable made before the loop remembers things from one round to the next. Here the loop compares each letter with the one before it, and counts the doubles:" },
      { code: r`word = "bookkeeper"
i = 1
doubles = 0
while i < len(word):
    if word[i] == word[i - 1]:
        doubles = doubles + 1
    i = i + 1
print(doubles)`, out: "3" },
      { h: "A string as a lookup table" },
      { p: "A number can pick a character out of another string, like looking something up in a table:" },
      { code: r`grades = "FDCBA"
score = 3
print(grades[score])`, out: "B" },
      { tip: "For one simple question, a string method may be quicker: `\"reel\".count(\"e\")` is 2. Walking with an index is for when each step needs a decision, or when you're building something as you go." },
    ],
  },
];
