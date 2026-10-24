import type { CodexPage } from "../types.ts";

// Codex pages for The Forge (building 6): functions.
// Page ids must be unique across the whole Codex (content tests check).
// Examples use their own names and values (hens, kettles, jam), never a
// challenge's, so a page teaches the idea without handing over an answer.
const r = String.raw;

export const FORGE_PAGES: CodexPage[] = [
  {
    id: "functions",
    title: "Functions: def and calling",
    summary: "Give a block of lines a name with def, then run it by calling the name.",
    blocks: [
      { p: "A **function** is a block of lines with a name. You write it once with `def`, and from then on the name runs the whole block whenever you **call** it." },
      { code: r`def feed_hens():
    print("Scatter the grain.")
    print("Fill the water dish.")

print("Morning!")
feed_hens()
print("Evening!")
feed_hens()`, out: "Morning!\nScatter the grain.\nFill the water dish.\nEvening!\nScatter the grain.\nFill the water dish." },
      { p: "The first line is `def`, the function's name, a pair of brackets and a colon. The lines that belong to it are indented four spaces underneath, just like the lines under an `if`. The function ends where the indentation goes back to the edge." },
      { h: "Defining is not running" },
      { p: "A `def` only **teaches** Python the job. Nothing inside it happens until a call. This program never rings the bell:" },
      { code: r`def ring_bell():
    print("Ding!")

print("The bell is ready.")`, out: "The bell is ready." },
      { h: "A call needs brackets" },
      { p: "To call a function, write its name **with brackets**: `ring_bell()`. The name on its own, `ring_bell`, only points at the function. Python shrugs and runs nothing." },
      { h: "Define first, call after" },
      { p: "Python reads from the top. A call to a function it hasn't met yet is a `NameError`:" },
      { code: r`water_plants()

def water_plants():
    print("Splash.")`, err: "NameError" },
      { p: "Calls can go anywhere a line can go: one after another, inside an `if`, or inside a loop that runs the job several times." },
      { code: r`def knock():
    print("Knock.")

for i in range(3):
    knock()`, out: "Knock.\nKnock.\nKnock." },
      { tip: "Name a function after the job it does, in small letters with underscores: `feed_hens`, `ring_bell`. The same rules as variable names apply." },
    ],
  },
  {
    id: "parameters",
    title: "Parameters: handing values in",
    summary: "Names in a def's brackets that receive the values of each call, matched in order.",
    blocks: [
      { p: "Most jobs are *almost* the same every time, with one thing that changes. That thing becomes a **parameter**: a name inside the def's brackets. Each call puts a value in the brackets, and for that run of the function the parameter holds it." },
      { code: r`def greet(name):
    print(f"Morning, {name}!")

greet("Wren")
greet("Bram")`, out: "Morning, Wren!\nMorning, Bram!" },
      { p: "The value in the call is called an **argument**. Here `\"Wren\"` is the argument, and `name` is the parameter that receives it. Inside the function, use the parameter like any variable." },
      { p: "Calls in a loop hand in a different value each round:" },
      { code: r`def greet(name):
    print(f"Morning, {name}!")

for friend in ["Marlo", "Hazel"]:
    greet(friend)`, out: "Morning, Marlo!\nMorning, Hazel!" },
      { h: "Several parameters" },
      { p: "Separate parameters with commas. The arguments are matched up **by position**: the first argument goes to the first parameter, the second to the second, and so on. Mix up the order and the values land in the wrong places:" },
      { code: r`def describe(animal, legs):
    print(f"A {animal} has {legs} legs.")

describe("hen", 2)
describe(4, "dog")`, out: "A hen has 2 legs.\nA 4 has dog legs." },
      { h: "The right number of values" },
      { p: "A call must give one argument for every parameter. Too few or too many is a `TypeError`, and its message says which one is missing:" },
      { code: r`def describe(animal, legs):
    print(animal, legs)

describe("hen")`, err: "TypeError" },
      { tip: "Inside the function, use the parameter, not some variable from outside. Then the function works for whatever value it is handed, not just today's." },
    ],
  },
  {
    id: "return",
    title: "return: handing an answer back",
    summary: "return gives a value back to the call, which can then be stored, printed or compared.",
    blocks: [
      { p: "Some functions do a job. Others work something out and **give the answer back**. `return` hands a value back to the place the function was called, and the call then stands for that value." },
      { code: r`def dozen(boxes):
    return boxes * 12

eggs = dozen(3)
print(eggs)
print(dozen(2) + 1)`, out: "36\n25" },
      { h: "Using a returned value" },
      { p: "A call that returns a value can go anywhere a value can: in a sum, in an f-string, in an `if`, or as the argument of another call." },
      { code: r`def cups_for(guests):
    return guests * 2 + 1

if cups_for(4) > 8:
    print("Borrow cups from Bram.")
print(f"Brew {cups_for(4)} cups.")
print(max(cups_for(1), 5))`, out: "Borrow cups from Bram.\nBrew 9 cups.\n5" },
      { p: "A call can even sit in a `while` condition. Then the loop asks the function a fresh question every round, with whatever values the variables hold by then." },
      { code: r`def tide(hour):
    return 10 + hour * 4

hour = 0
while tide(hour) < 30:
    print(f"Hour {hour}: the tide is at {tide(hour)}")
    hour += 2`, out: "Hour 0: the tide is at 10\nHour 2: the tide is at 18\nHour 4: the tide is at 26" },
      { h: "return ends the function" },
      { p: "The moment Python reaches a `return`, the function is finished. Any lines after it in the same block never run." },
      { code: r`def kettle():
    return "boiling"
    print("This line is never reached.")

print(kettle())`, out: "boiling" },
      { tip: "A function can return any kind of value: a number, some text, `True` or `False`, even a list." },
    ],
  },
  {
    id: "return-vs-print",
    title: "return vs print, and None",
    summary: "print shows a value to you; return hands it to the program. No return means None.",
    blocks: [
      { p: "`print` and `return` look alike, but they do different jobs. `print` **shows** a value on the screen, for the person watching, and then it is gone. `return` **hands** the value back to the program, so the next line can use it." },
      { p: "A function with no `return` still gives something back: the special value `None`, which means \"nothing\"." },
      { code: r`def shout(word):
    print(word.upper())

result = shout("hi")
print(result)`, out: "HI\nNone" },
      { h: "The NoneType error" },
      { p: "If a function prints its answer instead of returning it, the program gets `None` and can't do sums with it. Python says `TypeError` and mentions `NoneType` (the type of `None`):" },
      { code: r`def with_tax(price):
    print(price + 2)

total = with_tax(5) + with_tax(3)`, err: "TypeError" },
      { p: "The fix is to `return` the value. The main program can then add, compare or print it, as it likes:" },
      { code: r`def with_tax(price):
    return price + 2

total = with_tax(5) + with_tax(3)
print(f"Total: {total}")`, out: "Total: 12" },
      { tip: "A good habit: a function that **works something out** returns it, and the main program decides what to print. Return gives, print shows." },
    ],
  },
  {
    id: "bool-functions",
    title: "Functions that answer yes or no",
    summary: "Return True or False, use the answer in if and while, and the \"True\" text trap.",
    blocks: [
      { p: "Many questions have a yes-or-no answer: is it ripe? is it full? A function can answer them by returning `True` or `False`. A comparison already **is** `True` or `False`, so it can go straight after `return`." },
      { code: r`def is_ripe(days):
    return days >= 5

print(is_ripe(7))
print(is_ripe(2))`, out: "True\nFalse" },
      { p: "This longer version does exactly the same thing. Both are fine; the short one is just shorter." },
      { code: r`def is_heavy(kilos):
    if kilos > 20:
        return True
    else:
        return False

print(is_heavy(25))`, out: "True" },
      { h: "Asking the function" },
      { p: "Because the call **is** True or False, it reads well in an `if`, with `not`, and in a `while`:" },
      { code: r`def is_full(eggs):
    return eggs >= 12

basket = 0
while not is_full(basket):
    basket += 5
print(basket)`, out: "15" },
      { h: "The text trap" },
      { p: "`\"True\"` with quotes is text, not a yes. Any non-empty text counts as true in an `if`, even `\"False\"`:" },
      { code: r`def is_open(hour):
    if hour > 8:
        return "True"
    return "False"

if is_open(6):
    print("Come in!")`, out: "Come in!" },
      { tip: "Give yes-or-no functions question names: `is_ripe`, `has_eggs`, `can_bake`. Then `if is_ripe(days):` reads like a sentence." },
    ],
  },
  {
    id: "choosing-returns",
    title: "Choosing what to return",
    summary: "Several returns in if / elif / else; the first one reached wins, so order matters.",
    blocks: [
      { p: "A function can have a `return` in each branch of an `if` / `elif` / `else`. Python checks the conditions from the top, and the first `return` it reaches is the answer." },
      { code: r`def coat_for(temp):
    if temp < 0:
        return "thick coat"
    elif temp < 15:
        return "jumper"
    else:
        return "no coat"

print(coat_for(-3))
print(coat_for(10))
print(coat_for(22))`, out: "thick coat\njumper\nno coat" },
      { h: "Order matters" },
      { p: "A rule that must win **whatever else is true** goes first. Here members always ride free, even small ones, so that question is asked before the age:" },
      { code: r`def ticket(age, member):
    if member:
        return "free"
    if age < 12:
        return "half"
    return "full"

print(ticket(8, True))
print(ticket(8, False))
print(ticket(40, False))`, out: "free\nhalf\nfull" },
      { p: "Notice the plain `if`s: once a branch has returned, the function is over, so the next `if` only runs when the ones above it didn't return. `elif` works too." },
      { h: "Two conditions, one answer" },
      { p: "When two different reasons give the same answer, join them with `or`:" },
      { code: r`def can_sail(wind, leaking):
    if leaking or wind > 40:
        return "stay in port"
    return "set sail"

print(can_sail(10, True))`, out: "stay in port" },
      { tip: "Return the words exactly as asked. `\"Good\"` and `\"good\"` are different strings, so a check for one won't match the other." },
    ],
  },
  {
    id: "defaults-keywords",
    title: "Default values and keyword arguments",
    summary: "spare=4 in the def gives a usual value; name=value in a call picks a parameter by name.",
    blocks: [
      { h: "Default values" },
      { p: "A parameter can have a **default**: a usual value it gets when the call leaves it out. Write it with `=` in the def line. A call can still give its own value instead." },
      { code: r`def brew(cups, sugar=1):
    print(f"{cups} cups, {sugar} sugar each")

brew(3)
brew(2, 0)`, out: "3 cups, 1 sugar each\n2 cups, 0 sugar each" },
      { p: "Parameters with defaults go **after** the ones without. Otherwise Python couldn't tell which value is which:" },
      { code: r`def brew(sugar=1, cups):
    print(cups)`, err: "SyntaxError" },
      { h: "Keyword arguments" },
      { p: "In a call you can name the parameter: `note=True`. That's a **keyword argument**. Python matches it by its name, not its place, so you can set just the one value you want to change and leave the others at their defaults." },
      { code: r`def pack(item, box="small", ribbon="red", note=False):
    print(item, box, ribbon, note)

pack("jam")
pack("jam", note=True)
pack("pie", ribbon="blue", box="big")`, out: "jam small red False\njam small red True\npie big blue False" },
      { p: "Without names, `pack(\"jam\", True)` would put `True` into `box`, the next parameter in line. Naming it says exactly which one you mean." },
      { p: "Keyword arguments come **after** the plain ones in a call:" },
      { code: r`def pack(item, box="small"):
    print(item, box)

pack(box="big", "jam")`, err: "SyntaxError" },
      { h: "Why name them?" },
      { p: "A call with names is easier to read: `pack(\"pie\", ribbon=\"blue\")` says what the blue is for. And when a call leaves a value to its default, it follows along if the default is ever changed in the def line, while a call that typed the old value keeps the old value." },
      { tip: "The name must be the parameter's exact name. `pack(\"jam\", colour=\"red\")` is a `TypeError`: there is no parameter called colour." },
    ],
  },
  {
    id: "list-functions",
    title: "Functions that take a list",
    summary: "A list as a parameter, looping over it, returning from inside the loop, and leaving it unchanged.",
    blocks: [
      { p: "A parameter can hold a whole list. Inside the function, loop over it like any list, and return what you found." },
      { code: r`def count_big(eggs):
    n = 0
    for e in eggs:
        if e >= 60:
            n += 1
    return n

print(count_big([55, 62, 70, 58]))
print(count_big([]))`, out: "2\n0" },
      { p: "The function works for any list it's handed, including an empty one, so try that case too." },
      { h: "Returning from inside the loop" },
      { p: "A `return` inside the loop ends the loop **and** the function at once. That's handy when you know the answer early. The `return` after the loop only runs if the loop finished without returning." },
      { code: r`def has_rotten(apples):
    for a in apples:
        if a == "rotten":
            return True
    return False

print(has_rotten(["red", "rotten", "green"]))
print(has_rotten(["red"]))`, out: "True\nFalse" },
      { h: "Mind the indent of return" },
      { p: "A `return` indented into the loop by mistake gives up after the very first item:" },
      { code: r`def total(nums):
    t = 0
    for n in nums:
        t += n
        return t

print(total([4, 5, 6]))`, out: "4" },
      { h: "Don't change the list you're given" },
      { p: "The parameter is the **same list** the caller has, not a copy. If the function `pop`s or `remove`s from it, the caller's list changes too:" },
      { code: r`def take_first(basket):
    return basket.pop(0)

fruit = ["fig", "plum"]
take_first(fruit)
print(fruit)`, out: "['plum']" },
      { tip: "Read the list; leave it as it was, unless changing it is the function's whole job." },
    ],
  },
  {
    id: "calling-functions",
    title: "Functions calling functions",
    summary: "Build small functions first, then let a bigger one use them.",
    blocks: [
      { p: "A function can call other functions. Big jobs are easier as **small functions working together**: each one does one part, and a bigger one uses their answers." },
      { code: r`def price(apples):
    return apples * 2

def with_basket(apples):
    return price(apples) + 5

print(with_basket(3))`, out: "11" },
      { p: "Now the price of an apple lives in one place. Change `price`, and `with_basket` (and everything else that asks it) follows along." },
      { h: "Small answers in conditions" },
      { p: "A yes-or-no helper reads well inside another function's `if`:" },
      { code: r`def is_heavy(kilos):
    return kilos > 20

def porters(loads):
    n = 0
    for kilos in loads:
        if is_heavy(kilos):
            n += 2
        else:
            n += 1
    return n

print(porters([5, 30, 12]))`, out: "4" },
      { h: "Which comes first?" },
      { p: "A function may call one defined further down the file. What matters is that both have been defined by the time the call actually **runs**:" },
      { code: r`def outer():
    return inner() + 1

def inner():
    return 10

print(outer())`, out: "11" },
      { tip: "Test each small function on its own first: print a couple of calls and check the answers by hand. Then build the bigger one on top, and remove the test prints." },
    ],
  },
  {
    id: "scope",
    title: "Scope: a function's own variables",
    summary: "Variables made in a function stay in it; assigning makes a new local; pass in and return out.",
    blocks: [
      { p: "Every call of a function gets its own private set of variables, called its **local** variables: its parameters and every name it assigns. They exist while the function runs and vanish when it ends." },
      { code: r`def bake():
    loaves = 6
    return loaves

bake()
print(loaves)`, err: "NameError" },
      { p: "To get a value out, `return` it and catch it: `loaves = bake()`." },
      { h: "Same name, different variable" },
      { p: "A variable assigned inside a function is a **new** variable, even when the program has one with the same name outside. The outside one is left alone:" },
      { code: r`count = 100

def reset():
    count = 0
    return count

print(reset())
print(count)`, out: "0\n100" },
      { h: "Reading from outside is fine" },
      { p: "A function may **read** a variable from the main program, as long as it never assigns to that name:" },
      { code: r`price = 3

def cost(n):
    return n * price

print(cost(4))`, out: "12" },
      { h: "UnboundLocalError" },
      { p: "If a function assigns to a name **anywhere** in its body, that name is local for the whole function. So reading it before it has a value is an error, even though a variable with that name exists outside:" },
      { code: r`eggs = 10

def use_two():
    eggs = eggs - 2

use_two()`, err: "UnboundLocalError" },
      { h: "The fix: in through the brackets, out through return" },
      { code: r`eggs = 10

def use_two(eggs):
    return eggs - 2

eggs = use_two(eggs)
print(eggs)`, out: "8" },
      { tip: "Python does have a `global` keyword that lets a function change an outside variable, but it ties functions into knots. Hand values in as parameters and hand answers back with return instead." },
    ],
  },
  {
    id: "none-guards",
    title: "None and returning early",
    summary: "Return None when there is no answer, guard odd cases at the top, and test with is None.",
    blocks: [
      { p: "Sometimes a question has **no sensible answer**. A function can say so by returning `None`. It's a real value that means \"nothing here\", different from 0 or empty text." },
      { h: "A guard at the top" },
      { p: "Check for the odd case first, at the very top, and `return` early. The rest of the function then only deals with the normal case, without an extra layer of indents:" },
      { code: r`def initials(name):
    if name == "":
        return None
    return name[0].upper()

print(initials("odo"))
print(initials(""))`, out: "O\nNone" },
      { p: "Guards are good at stopping trouble before it starts: an empty text, a missing item, a number that would make a sum crash." },
      { h: "Testing for None: is None" },
      { p: "Ask about it with `is None` (or `is not None`). Don't use `not`: 0 and empty text also count as false, so `not` can't tell \"no answer\" from an answer that happens to be 0." },
      { code: r`def score(answers):
    if len(answers) == 0:
        return None
    return answers.count("yes")

result = score(["no", "no"])
if not result:
    print("No score?")
if result is None:
    print("Really no score")
else:
    print(f"Score: {result}")`, out: "No score?\nScore: 0" },
      { p: "The first `if` got it wrong: a score of 0 is a real score. The second one asked properly." },
      { tip: "Don't invent a fake answer for \"none\", like -1 or the text `\"None\"`. -1 is a perfectly good list index in Python (the last item), and text is not the value None." },
    ],
  },
  {
    id: "function-patterns",
    title: "Tidying code into functions",
    summary: "Spot repeated code, turn what changes into parameters, and plan a program as small jobs.",
    blocks: [
      { p: "When the same lines appear again and again with only a few values different, they want to be **one function**. The values that change become its parameters. Everything else is written once, inside it." },
      { p: "Before: three copies of the same sum." },
      { code: r`plum = 3 * 2 + 1
print(f"Plum jam: {plum} coins")
fig = 4 * 2 + 1
print(f"Fig jam: {fig} coins")
pear = 2 * 2 + 1
print(f"Pear jam: {pear} coins")`, out: "Plum jam: 7 coins\nFig jam: 9 coins\nPear jam: 5 coins" },
      { p: "After: one function, called once per jar. Same output, and the sum lives in one place." },
      { code: r`def label(name, fruit_cost):
    price = fruit_cost * 2 + 1
    return f"{name} jam: {price} coins"

print(label("Plum", 3))
print(label("Fig", 4))
print(label("Pear", 2))`, out: "Plum jam: 7 coins\nFig jam: 9 coins\nPear jam: 5 coins" },
      { h: "Why copies are dangerous" },
      { p: "Copied code hides copied mistakes. Change one copy and forget another, or paste and forget to rename one variable, and the program is wrong in one place only, which is the hardest kind of wrong to spot. A function can't be half-updated." },
      { h: "Planning a program in functions" },
      { p: "For a bigger program, plan on paper first. Write down the jobs it has to do, one line each. Every job that has a name (\"look up a price\", \"count the boxes\") is a function. Write the smallest ones first and test them alone, then the ones that use them. The main part at the bottom then reads like a to-do list." },
      { code: r`def jar_cost(fruit_cost):
    return fruit_cost * 2 + 1

def order_cost(fruit_costs):
    total = 0
    for f in fruit_costs:
        total += jar_cost(f)
    return total

def can_afford(fruit_costs, purse):
    return order_cost(fruit_costs) <= purse

print(order_cost([3, 4]))
print(can_afford([3, 4], 15))`, out: "16\nFalse" },
      { tip: "One function, one job. If you can't say what a function does in a few words, it's probably two functions." },
    ],
  },
];
