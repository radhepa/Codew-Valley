import type { CodexPage } from "../types.ts";

// Codex pages for The Guild Hall (building 11): classes.
// Page ids must be unique across the whole Codex (content tests check).
const r = String.raw;

export const GUILDHALL_PAGES: CodexPage[] = [
  {
    id: "classes",
    title: "Classes and objects",
    summary: "Invent your own kind of thing: a class is the blank form, each object a filled-in copy.",
    blocks: [
      { p: "So far every value has been a kind Python already knew: numbers, strings, lists, dictionaries. A **class** lets you invent a new kind. The class is the blank form; each **object** made from it is one filled-in copy, with its own values." },
      { code: r`class Hen:
    def __init__(self, name, eggs):
        self.name = name
        self.eggs = eggs

hetty = Hen("Hetty", 3)
print(hetty.name, hetty.eggs)`, out: "Hetty 3" },
      { p: "`class Hen:` starts the form. The `__init__` part fills in a new hen (the `init` page has the details). `Hen(\"Hetty\", 3)` **makes an object**: a brand-new hen with those values. The values stored on an object are its **attributes**, and you reach them with a dot: `hetty.name`." },
      { tip: "Class names start with a capital letter (`Hen`, `Lantern`, `TeaPot`); objects and attributes are lowercase (`hetty`, `hetty.eggs`). Python doesn't force it, but everyone does it, so code is easy to read." },
      { h: "Many objects, one class" },
      { p: "Call the class again for another object. Each one keeps its own values, and changing one leaves the others alone." },
      { code: r`class Hen:
    def __init__(self, name, eggs):
        self.name = name
        self.eggs = eggs

hetty = Hen("Hetty", 3)
pearl = Hen("Pearl", 5)
pearl.eggs += 1
print(hetty.eggs, pearl.eggs)`, out: "3 6" },
      { p: "Attributes can be read, changed and added to just like variables: `pearl.eggs += 1` adds one to Pearl's eggs only." },
      { h: "A second name is not a copy" },
      { p: "`b = a` doesn't make a new object. It gives the **same** object a second name, so a change through either name is a change to the one object." },
      { code: r`class Hen:
    def __init__(self, name, eggs):
        self.name = name
        self.eggs = eggs

hetty = Hen("Hetty", 3)
also_hetty = hetty
also_hetty.eggs = 10
print(hetty.eggs)`, out: "10" },
      { p: "To get a second hen, call `Hen(...)` again." },
      { h: "Asking for something that isn't there" },
      { p: "Reading an attribute the object doesn't have is an `AttributeError`. Usually it's a spelling slip, or a value that was never stored." },
      { code: r`class Hen:
    def __init__(self, name, eggs):
        self.name = name
        self.eggs = eggs

hetty = Hen("Hetty", 3)
print(hetty.feathers)`, err: "AttributeError" },
    ],
  },
  {
    id: "init",
    title: "__init__ and self",
    summary: "__init__ fills in each new object; self is the object being filled in. Defaults, and the shared-list trap.",
    blocks: [
      { p: "`__init__` (two underscores on each side) is a special method Python runs **by itself** every time a new object is made. Its job is to fill in the new object." },
      { code: r`class Lantern:
    def __init__(self, colour, hours):
        print("Making a lantern...")
        self.colour = colour
        self.hours = hours

lamp = Lantern("amber", 6)
print(lamp.colour, lamp.hours)`, out: "Making a lantern...\namber 6" },
      { p: "The first parameter, `self`, is the new object itself. You never pass it: Python does. The other parameters (`colour`, `hours`) take the values in the brackets, in order. `self.colour = colour` writes the value **onto the object**, where it stays." },
      { h: "Store it on self, or lose it" },
      { p: "A plain variable inside `__init__` is like any variable inside a function: it vanishes when `__init__` ends. Only what's stored on `self` stays with the object." },
      { code: r`class Lantern:
    def __init__(self, colour):
        colour = colour

lamp = Lantern("amber")
print(lamp.colour)`, err: "AttributeError" },
      { h: "Values every object starts with" },
      { p: "Not everything has to be passed in. `__init__` can set starting values of its own:" },
      { code: r`class Oven:
    def __init__(self, name):
        self.name = name
        self.heat = 20
        self.loaves = 0

o = Oven("Big Bertha")
print(o.name, o.heat, o.loaves)`, out: "Big Bertha 20 0" },
      { h: "Default values" },
      { p: "Just like a function, `__init__` can give parameters a **default**, used whenever that value is left out. Parameters with defaults come after the ones without." },
      { code: r`class Lantern:
    def __init__(self, colour, hours=6):
        self.colour = colour
        self.hours = hours

a = Lantern("amber")
b = Lantern("blue", 10)
c = Lantern("green", hours=2)
print(a.hours, b.hours, c.hours)`, out: "6 10 2" },
      { h: "The shared-list trap" },
      { p: "A default value is made **once**, when Python reads the `def`, not each time an object is made. For a number or a string that's harmless. For a **list** it means every object that leaves it out gets the very same list:" },
      { code: r`class Basket:
    def __init__(self, owner, eggs=[]):
        self.owner = owner
        self.eggs = eggs

a = Basket("Ada")
b = Basket("Bo")
a.eggs.append("brown")
print(b.eggs)`, out: "['brown']" },
      { p: "The safe pattern: make the default `None`, and build a fresh list inside `__init__` when nothing was handed over." },
      { code: r`class Basket:
    def __init__(self, owner, eggs=None):
        self.owner = owner
        if eggs is None:
            eggs = []
        self.eggs = eggs

a = Basket("Ada")
b = Basket("Bo")
c = Basket("Cy", ["speckled"])
a.eggs.append("brown")
print(a.eggs, b.eggs, c.eggs)`, out: "['brown'] [] ['speckled']" },
      { h: "Forgot self?" },
      { p: "Every method in a class needs `self` first, `__init__` included. Without it, Python still hands the object over and the numbers stop adding up:" },
      { code: r`class Lantern:
    def __init__(colour):
        print(colour)

lamp = Lantern("amber")`, err: "TypeError" },
      { tip: "\"takes 1 positional argument but 2 were given\" from a class almost always means a missing `self`: Python gave the method the object *and* your value, and it only had room for one." },
    ],
  },
  {
    id: "methods",
    title: "Methods",
    summary: "Functions inside a class: they use self to read, change and answer questions about their own object.",
    blocks: [
      { p: "A function written inside a class is a **method**. Every object of the class can use it, with a dot: `oven.bake()`." },
      { code: r`class Oven:
    def __init__(self, name, heat):
        self.name = name
        self.heat = heat

    def describe(self):
        print(self.name, "is at", self.heat, "degrees")

a = Oven("Big Bertha", 180)
b = Oven("Little Lou", 220)
a.describe()
b.describe()`, out: "Big Bertha is at 180 degrees\nLittle Lou is at 220 degrees" },
      { p: "When you write `a.describe()`, Python runs `describe` with `self` set to `a`. With `b.describe()`, `self` is `b`. That's why one method works for every oven: inside it, `self.name` is always *this* oven's name." },
      { tip: "Inside a method, reach the object's values through `self`: `self.heat`, never just `heat`, and never the name of one particular object outside (that would always give *that* object's value, whoever called)." },
      { h: "Methods that change the object" },
      { p: "A method can change its object's attributes, and the change stays after the method ends. It can take extra values, too, after `self`." },
      { code: r`class Oven:
    def __init__(self, heat):
        self.heat = heat

    def warm(self, degrees):
        self.heat += degrees
        if self.heat > 250:
            self.heat = 250

o = Oven(180)
o.warm(30)
o.warm(100)
print(o.heat)`, out: "250" },
      { h: "Methods that answer" },
      { p: "A method can `return` a value, just like a function. Then the program can use the answer: in an `if`, a sum or an f-string." },
      { code: r`class Oven:
    def __init__(self, heat):
        self.heat = heat

    def ready(self):
        return self.heat >= 200

    def minutes_left(self):
        return (200 - self.heat) // 10

o = Oven(160)
if not o.ready():
    print(f"Not yet: about {o.minutes_left()} minutes")`, out: "Not yet: about 4 minutes" },
      { p: "A method that only *prints* its answer hands back `None`, so nothing can use it:" },
      { code: r`class Oven:
    def __init__(self, heat):
        self.heat = heat

    def ready(self):
        print(self.heat >= 200)

answer = Oven(220).ready()
print(answer)`, out: "True\nNone" },
      { h: "A method asking another" },
      { p: "Inside a method, `self.other()` calls another method of the same object." },
      { code: r`class Oven:
    def __init__(self, heat):
        self.heat = heat

    def ready(self):
        return self.heat >= 200

    def sign(self):
        if self.ready():
            return "Come in, bread's on!"
        return "Warming up..."

print(Oven(210).sign())`, out: "Come in, bread's on!" },
      { h: "Forgot self?" },
      { p: "Python always hands the object to a method, so a method with no `self` gets one value more than it has room for:" },
      { code: r`class Oven:
    def ready():
        return True

Oven().ready()`, err: "TypeError" },
    ],
  },
  {
    id: "str-method",
    title: "__str__: how an object prints",
    summary: "Give print() something readable: __str__ returns the object's text.",
    blocks: [
      { p: "Print an object from your own class and Python doesn't know what to show, so it shows the class and the object's address in memory, something like `<__main__.Hat object at 0x7f3a1c2b5e10>`:" },
      { code: r`class Hat:
    def __init__(self, colour):
        self.colour = colour

print(Hat("green"))` },
      { p: "Give the class a method called `__str__` (two underscores on each side) that **returns** the text, and `print()` uses it:" },
      { code: r`class Hat:
    def __init__(self, colour, size):
        self.colour = colour
        self.size = size

    def __str__(self):
        return f"a {self.colour} hat, size {self.size}"

h = Hat("green", 7)
print(h)
print("Today I wear", h)
label = f"Shelf 3: {h}"
print(label)`, out: "a green hat, size 7\nToday I wear a green hat, size 7\nShelf 3: a green hat, size 7" },
      { p: "`print()`, f-strings and `str(h)` all ask the object for its `__str__`." },
      { tip: "`__str__` must **return** a string. If it prints instead, it hands back `None`, and Python complains that `__str__` returned a non-string." },
      { code: r`class Hat:
    def __str__(self):
        print("a hat")

print(Hat())`, err: "TypeError" },
      { h: "Building the text" },
      { p: "Anything works inside the f-string: attributes, sums, other methods (with their brackets), string methods." },
      { code: r`class Hat:
    def __init__(self, colour, size):
        self.colour = colour
        self.size = size

    def fit(self):
        if self.size < 6:
            return "small"
        return "roomy"

    def __str__(self):
        return f"{self.fit().title()} {self.colour} hat"

print(Hat("blue", 8))`, out: "Roomy blue hat" },
    ],
  },
  {
    id: "object-lists",
    title: "Lists of objects",
    summary: "Keep objects in a list, make them in a loop, and sort them by an attribute.",
    blocks: [
      { p: "Objects go in lists like any other value. Make them in a loop, keep them together, and walk the list later." },
      { code: r`class Jar:
    def __init__(self, flavour, spoons):
        self.flavour = flavour
        self.spoons = spoons

    def __str__(self):
        return f"{self.flavour} ({self.spoons} spoons)"

orders = [("honey", 4), ("plum", 9), ("mint", 2)]
pantry = []
for flavour, spoons in orders:
    pantry.append(Jar(flavour, spoons))

for jar in pantry:
    print(jar)`, out: "honey (4 spoons)\nplum (9 spoons)\nmint (2 spoons)" },
      { h: "Adding up and finding the best" },
      { p: "Loop over the list and ask each object, exactly as with numbers:" },
      { code: r`class Jar:
    def __init__(self, flavour, spoons):
        self.flavour = flavour
        self.spoons = spoons

pantry = [Jar("honey", 4), Jar("plum", 9), Jar("mint", 2)]
total = 0
fullest = pantry[0]
for jar in pantry:
    total += jar.spoons
    if jar.spoons > fullest.spoons:
        fullest = jar
print(total, fullest.flavour)`, out: "15 plum" },
      { h: "Sorting objects" },
      { p: "Python can't guess how to put objects in order (by flavour? by spoons?), so `sorted()` needs a `key=`: a function that takes one object and gives back what to compare." },
      { code: r`class Jar:
    def __init__(self, flavour, spoons):
        self.flavour = flavour
        self.spoons = spoons

def spoons_of(jar):
    return jar.spoons

pantry = [Jar("honey", 4), Jar("plum", 9), Jar("mint", 2)]
for jar in sorted(pantry, key=spoons_of, reverse=True):
    print(jar.flavour)`, out: "plum\nhoney\nmint" },
      { tip: "When two objects tie, `sorted()` keeps them in the order they started in, even with `reverse=True`." },
      { h: "Printing the whole list" },
      { p: "`print(pantry)` doesn't use each jar's `__str__`: a list shows its items' inside view instead, something like `[<__main__.Jar object at 0x...>, ...]`. To see each object's page, print them one at a time in a loop." },
      { code: r`class Jar:
    def __init__(self, flavour):
        self.flavour = flavour

    def __str__(self):
        return self.flavour

pantry = [Jar("honey"), Jar("plum")]
print(pantry)` },
    ],
  },
  {
    id: "objects-together",
    title: "Objects working together",
    summary: "A method can take another object, read it, change it and ask it things. Plus `is`.",
    blocks: [
      { p: "A method's extra parameters can be other objects, even of the same class. Inside, `self` is the object the method was called on and `other` is the one handed in." },
      { code: r`class Squirrel:
    def __init__(self, name, nuts):
        self.name = name
        self.nuts = nuts

    def share(self, other, count):
        if count > self.nuts:
            count = self.nuts
        self.nuts -= count
        other.nuts += count
        return count

red = Squirrel("Red", 10)
grey = Squirrel("Grey", 1)
given = red.share(grey, 4)
print(given, red.nuts, grey.nuts)`, out: "4 6 5" },
      { p: "`red.share(grey, 4)` runs with `self = red` and `other = grey`. The method can read and change both." },
      { h: "Asking the other object" },
      { p: "A method can call the other object's methods too, so each object stays in charge of its own rules:" },
      { code: r`class Squirrel:
    def __init__(self, name, nuts):
        self.name = name
        self.nuts = nuts

    def eat(self, count):
        self.nuts -= count

    def feed(self, other):
        other.eat(2)

red = Squirrel("Red", 10)
grey = Squirrel("Grey", 5)
red.feed(grey)
print(red.nuts, grey.nuts)`, out: "10 3" },
      { h: "The same object, or just alike?" },
      { p: "`is` asks whether two names point at the very **same** object. Two squirrels with the same values are still two squirrels." },
      { code: r`class Squirrel:
    def __init__(self, name):
        self.name = name

a = Squirrel("Red")
b = Squirrel("Red")
c = a
print(a is b, a is c)`, out: "False True" },
      { p: "That's handy when a method must refuse to work on itself: `if other is self:`." },
      { h: "How far apart?" },
      { p: "`abs()` turns a difference into a distance, so the order doesn't matter: `abs(3 - 8)` and `abs(8 - 3)` are both 5." },
      { code: r`print(abs(3 - 8), abs(8 - 3))`, out: "5 5" },
    ],
  },
  {
    id: "class-attributes",
    title: "Class attributes",
    summary: "One value shared by every object, kept on the class itself. Counting with them, and the self trap.",
    blocks: [
      { p: "An attribute written in the class itself, outside any method, is a **class attribute**. There's only one of it, and every object shares it." },
      { code: r`class Bee:
    hive = "Willow Hive"

    def __init__(self, name):
        self.name = name

buzz = Bee("Buzz")
hum = Bee("Hum")
print(buzz.hive, hum.hive, Bee.hive)`, out: "Willow Hive Willow Hive Willow Hive" },
      { p: "When Python looks for `buzz.hive`, it checks Buzz's own attributes first, finds nothing, and then looks on the class. So change a class attribute **through the class**, and every object sees the change:" },
      { code: r`class Bee:
    hive = "Willow Hive"

buzz = Bee()
hum = Bee()
Bee.hive = "Oak Hive"
print(buzz.hive, hum.hive)`, out: "Oak Hive Oak Hive" },
      { h: "Counting objects" },
      { p: "A class attribute can keep a tally of every object ever made. Change it through the class name inside `__init__`:" },
      { code: r`class Bee:
    made = 0

    def __init__(self, name):
        self.name = name
        Bee.made += 1

a = Bee("Buzz")
print(Bee.made)
b = Bee("Hum")
c = Bee("Fizz")
print(Bee.made)`, out: "1\n3" },
      { p: "Inside `__init__`, the tally already counts the object being made, so an object can also copy the current value onto itself if it wants to remember it." },
      { h: "The self trap" },
      { p: "`self.made += 1` *looks* similar, but it reads the class's value and then stores the result as a **new attribute on that one bee**. The class's count never moves:" },
      { code: r`class Bee:
    made = 0

    def __init__(self, name):
        self.name = name
        self.made += 1

a = Bee("Buzz")
b = Bee("Hum")
print(a.made, b.made, Bee.made)`, out: "1 1 0" },
      { tip: "Read a class attribute however you like. Change it only through the class name: `Bee.made`, not `self.made`." },
    ],
  },
  {
    id: "inheritance",
    title: "Inheritance",
    summary: "Build a new class on an old one: it gets everything the parent has, and adds its own.",
    blocks: [
      { p: "A class can be built on another class. Put the parent in brackets: `class Puppy(Dog):`. Every `Puppy` is a `Dog`: it gets the dog's `__init__` and every dog method, without writing them again. Then you add only what's new." },
      { code: r`class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def greet(self):
        return f"{self.name} wags"

class Puppy(Dog):
    def chew(self, thing):
        return f"{self.name} chews the {thing}"

p = Puppy("Biscuit", 1)
print(p.greet())
print(p.chew("slipper"))`, out: "Biscuit wags\nBiscuit chews the slipper" },
      { p: "`Puppy(\"Biscuit\", 1)` used the dog's `__init__`, because Puppy doesn't have one of its own. `greet` came from Dog; `chew` is Puppy's own extra." },
      { h: "Extras stay with the subclass" },
      { p: "The parent doesn't get the child's extras. A plain dog can't chew:" },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def chew(self):
        return "chomp"

Dog("Rex").chew()`, err: "AttributeError" },
      { h: "Only write what's new" },
      { p: "Copying the parent's methods into the subclass works, but then there are two copies to keep in step. Leave them out, and the subclass always uses the parent's current version." },
      { tip: "A subclass is a *kind of* its parent: a puppy is a dog, a lantern is a lamp. If you can't say \"a ___ is a kind of ___\", inheritance probably isn't the right fit (see `composition`)." },
    ],
  },
  {
    id: "super",
    title: "super().__init__",
    summary: "A subclass with its own __init__ still gets the parent's setup by calling super().__init__().",
    blocks: [
      { p: "When a subclass needs to be made with different values, it writes an `__init__` of its own. But that **replaces** the parent's, so the parent's setup never runs:" },
      { code: r`class Cake:
    def __init__(self, flavour):
        self.flavour = flavour
        self.slices = 8

class Pie(Cake):
    def __init__(self, flavour, crust):
        self.crust = crust

p = Pie("apple", "flaky")
print(p.slices)`, err: "AttributeError" },
      { p: "The fix is to call the parent's `__init__` from inside the child's. `super()` means \"my parent class\":" },
      { code: r`class Cake:
    def __init__(self, flavour):
        self.flavour = flavour
        self.slices = 8

class Pie(Cake):
    def __init__(self, flavour, crust):
        super().__init__(flavour)
        self.crust = crust

p = Pie("apple", "flaky")
print(p.flavour, p.slices, p.crust)`, out: "apple 8 flaky" },
      { p: "`super().__init__(flavour)` runs Cake's setup on this very pie. Then the pie adds its own extra." },
      { tip: "Don't put `self` in the brackets after `super().__init__`: `super()` passes it along for you, just like calling any method on an object." },
    ],
  },
  {
    id: "overriding",
    title: "Overriding methods",
    summary: "A subclass can replace a parent's method, or build on it with super().",
    blocks: [
      { p: "If a subclass writes a method with the **same name** as one of its parent's, it **overrides** it: objects of the subclass use their own version." },
      { code: r`class Bird:
    def song(self):
        return "tweet"

class Crow(Bird):
    def song(self):
        return "caw"

print(Bird().song(), Crow().song())`, out: "tweet caw" },
      { h: "Building on the parent's answer" },
      { p: "Often the subclass doesn't want something completely different, just a little change. Inside the override, `super().song()` runs the parent's version and hands back its answer, ready to adjust:" },
      { code: r`class Ticket:
    def __init__(self, rides):
        self.rides = rides

    def price(self):
        return 3 * self.rides

class FamilyTicket(Ticket):
    def price(self):
        return super().price() - 5

print(Ticket(4).price(), FamilyTicket(4).price())`, out: "12 7" },
      { p: "If the parent's rule ever changes, the family ticket changes with it, because it starts from whatever the parent says instead of a copy of the old sum." },
      { h: "Overriding __str__" },
      { p: "`__str__` can be overridden like any method, and `super().__str__()` is the parent's text:" },
      { code: r`class Ticket:
    def __init__(self, rides):
        self.rides = rides

    def __str__(self):
        return f"Ticket for {self.rides} rides"

class GoldTicket(Ticket):
    def __str__(self):
        return "GOLD! " + super().__str__().upper()

print(GoldTicket(6))`, out: "GOLD! TICKET FOR 6 RIDES" },
      { tip: "A method in a parent that calls `self.price()` uses the override for subclass objects too: Python always looks for the method on the object's own class first." },
    ],
  },
  {
    id: "isinstance",
    title: "isinstance",
    summary: "Ask what kind of object you have. Subclasses count, so ask about the most specific kind first.",
    blocks: [
      { p: "`isinstance(thing, Kind)` answers `True` or `False`: is this object a `Kind`? It says yes for subclasses too, because a puppy *is* a dog." },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def chew(self):
        return "chomp"

rex = Dog("Rex")
bix = Puppy("Biscuit")
print(isinstance(rex, Dog), isinstance(bix, Dog), isinstance(rex, Puppy))`, out: "True True False" },
      { h: "isinstance or type?" },
      { p: "`type(bix)` gives the *exact* class, Puppy, so `type(bix) == Dog` is False. `isinstance` is usually what you want: it understands that a subclass is a kind of its parent." },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def chew(self):
        return "chomp"

bix = Puppy("Biscuit")
print(type(bix) == Dog, isinstance(bix, Dog))`, out: "False True" },
      { h: "Ask about the specific kind first" },
      { p: "Because every puppy is also a dog, an `if` that asks \"is it a dog?\" first catches the puppies too, and the puppy branch never runs:" },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def chew(self):
        return "chomp"

pack = [Dog("Rex"), Puppy("Biscuit")]
for d in pack:
    if isinstance(d, Dog):
        print(d.name, "is a dog")
    elif isinstance(d, Puppy):
        print(d.name, "is a puppy")`, out: "Rex is a dog\nBiscuit is a dog" },
      { p: "Put the most specific kind first, and the general one after it:" },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def chew(self):
        return "chomp"

pack = [Dog("Rex"), Puppy("Biscuit")]
for d in pack:
    if isinstance(d, Puppy):
        print(d.name, "is a puppy")
    else:
        print(d.name, "is a dog")`, out: "Rex is a dog\nBiscuit is a puppy" },
      { h: "Checking before you ask" },
      { p: "Only some objects have some attributes. Asking what kind it is first keeps you from asking a dog for a puppy's toy:" },
      { code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def __init__(self, name, toys):
        super().__init__(name)
        self.toys = toys

pack = [Dog("Rex"), Puppy("Biscuit", 3)]
for d in pack:
    if isinstance(d, Puppy):
        print(d.name, "has", d.toys, "toys")
    else:
        print(d.name, "has grown out of toys")`, out: "Rex has grown out of toys\nBiscuit has 3 toys" },
    ],
  },
  {
    id: "composition",
    title: "Composition",
    summary: "An object that holds other objects, and works by asking each of them.",
    blocks: [
      { p: "Not every relationship is \"a kind of\". A bookshelf isn't a kind of book; it **has** books. When an object keeps other objects (usually in a list attribute) and works by asking them, that's called **composition**." },
      { code: r`class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

class Shelf:
    def __init__(self, room):
        self.room = room
        self.books = []

    def put(self, book):
        if len(self.books) >= self.room:
            return False
        self.books.append(book)
        return True

    def total_pages(self):
        total = 0
        for b in self.books:
            total += b.pages
        return total

s = Shelf(2)
print(s.put(Book("Moss", 120)), s.put(Book("Fern", 80)), s.put(Book("Oak", 300)))
print(len(s.books), s.total_pages())`, out: "True True False\n2 200" },
      { p: "The shelf keeps its own rules (how much room it has) and asks each book for its pages. Make the list in `__init__` (`self.books = []`), so every shelf gets a list of its own." },
      { h: "Each object answers by its own rules" },
      { p: "The shelf just asks `b.weight()`; it doesn't care what kind of book it is. A subclass with an overridden method answers in its own way, and the shelf's sum is still right:" },
      { code: r`class Book:
    def __init__(self, pages):
        self.pages = pages

    def weight(self):
        return self.pages // 100

class Atlas(Book):
    def weight(self):
        return super().weight() + 3

class Shelf:
    def __init__(self):
        self.books = []

    def load(self):
        total = 0
        for b in self.books:
            total += b.weight()
        return total

s = Shelf()
s.books.append(Book(250))
s.books.append(Atlas(100))
print(s.load())`, out: "6" },
      { h: "Is anyone...?" },
      { p: "To ask \"does any book on the shelf...?\", return `True` the moment you find one, and `False` only after the loop has looked at all of them:" },
      { code: r`class Book:
    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

def has_long_book(books):
    for b in books:
        if b.pages > 200:
            return True
    return False

print(has_long_book([Book("Moss", 120), Book("Oak", 300)]))`, out: "True" },
      { tip: "`in` works on a list of objects: `book in self.books` is True when that very book is already on the shelf." },
    ],
  },
];
