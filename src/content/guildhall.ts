import type { Building } from "./types.ts";

// The Guild Hall: building 11, taught with classes (SYLLABUS.md). Each challenge
// adds one stage of guildhall.glb (art/specs/guildhall.md, stage_01 … stage_16).
// Captain Rook arrives when the chapter opens and speaks lines that start with
// "Rook: "; Lord Vane comes back to help ("Vane: ", story lines only).
const r = String.raw;

/** A listed mistake made from a reference answer by swapping pieces. Throws when a piece is missing, so a typo can't quietly turn a "mistake" back into the answer. */
function swap(s: string, ...pairs: [string, string][]): string {
  for (const [a, b] of pairs) {
    if (!s.includes(a)) throw new Error(`guildhall: "${a}" not found`);
    s = s.replace(a, b);
  }
  return s;
}

// Shared check helpers, put in front of every challenge's checks. Classes are
// tested by building fresh objects from the learner's own classes with other
// values and calling their methods:
//   need_class("Scout", "Member")      the class exists (and is a kind of Member)
//   need_method(cls, "train", 1, "…")  the method is inside the class, self first
//   make(cls, *args)                   a fresh object, with friendly crash messages
//   call(obj, "m", *args)              -> (value, printed)
//   ask(obj, "m", *args)               -> value; fails a method that prints instead of returning
//   attr(obj, "level")                 the attribute, or a message naming the ones it has
//   found(cls)                         objects of cls the program made (also inside lists)
//   run_fn("name", label, *args)       call one of the program's own functions
//   page_of(obj)                       str(obj), failing kindly if __str__ prints
//   again(old, new, label)             rerun with a starter line swapped -> (variables, lines)
const PRE = r`import io, sys, re

def _gh_show(a):
    n = getattr(a, "name", None)
    if isinstance(n, str) and not isinstance(a, str):
        return n
    return repr(a)

def _gh_args(args, kw):
    parts = [_gh_show(a) for a in args] + [k + "=" + repr(v) for k, v in kw.items()]
    return "(" + ", ".join(parts) + ")"

def who(obj):
    n = getattr(obj, "name", None)
    if isinstance(n, str):
        return n
    return "a " + type(obj).__name__

def _gh_advice(e):
    s = src.replace(" ", "")
    kind = type(e).__name__
    msg = str(e)
    if kind == "UnboundLocalError":
        return " Inside a method, a name on its own is a brand-new local variable. The object's own value is reached through self (self.xp, not xp)."
    if kind == "NameError":
        return " Inside a method, the object's values are reached through self (self.name, not just name)."
    if kind == "AttributeError" and "herbs" in msg:
        return " Only healers carry herbs. Ask what kind each person is before reading .herbs."
    if kind == "AttributeError" and "object has no attribute" in msg:
        return " Every self.something that is read has to be stored first under exactly that name (usually in __init__). Check the spelling on both sides."
    if kind == "TypeError" and "super().__init__(self" in s:
        return " super() hands self over by itself, so leave self out of the brackets after super().__init__."
    if kind == "TypeError" and ("positional argument" in msg or "required" in msg):
        return " Count the values: self comes first in every def inside a class (Python fills it in), then the values in the order the task gives them."
    return ""

def _gh_quiet(f, args, kw, what):
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        val = f(*args, **kw)
    except Exception as e:
        sys.stdout = old
        check(False, what + " crashed with " + type(e).__name__ + ": " + str(e) + "." + _gh_advice(e))
    finally:
        sys.stdout = old
    return val, buf.getvalue()

def need_class(name, parent=None):
    check(name in ns, "The rune can't find a class called " + name + ". Write it as class " + name + ": (the capital letter matters).")
    cls = ns[name]
    check(isinstance(cls, type), name + " is a " + type(cls).__name__ + " here, not a class. A class begins with the word class: class " + name + ":")
    if parent and isinstance(ns.get(parent), type):
        check(cls is not ns[parent] and issubclass(cls, ns[parent]), name + " should be a kind of " + parent + ". Put the parent in brackets after the name: class " + name + "(" + parent + "):")
    return cls

def need_method(cls, meth, params, about):
    owner = None
    for c in cls.__mro__:
        if c is not object and meth in c.__dict__:
            owner = c
            break
    if owner is None:
        check(not callable(ns.get(meth)), meth + " is written as a function of its own, outside the class. Indent the whole def under class " + cls.__name__ + ": so it belongs to every " + cls.__name__ + ".")
        check(False, cls.__name__ + " has no method called " + meth + ". Write it as a def indented inside the class.")
    f = owner.__dict__[meth]
    code = getattr(f, "__code__", None)
    if code is None:
        return
    names = list(code.co_varnames[:code.co_argcount])
    check(len(names) > 0 and names[0] == "self", "The first parameter of " + meth + " should be self. Python hands every method the object it was called on, so the def needs a place to catch it: def " + meth + "(self" + (", ..." if params else "") + "):")
    extra = names[1:]
    optional = len(f.__defaults__ or ())
    check(len(extra) >= params and len(extra) - optional <= params, meth + " should take " + about + " after self, but yours takes " + (", ".join(extra) if extra else "nothing") + ".")

def make(cls, *args, **kw):
    return _gh_quiet(cls, args, kw, "The rune tried " + cls.__name__ + _gh_args(args, kw) + ", and it")[0]

def call(obj, meth, *args):
    f = getattr(obj, meth, None)
    check(callable(f), type(obj).__name__ + " has no method called " + meth + ".")
    return _gh_quiet(f, args, {}, "The rune called " + meth + _gh_args(args, {}) + " on " + who(obj) + ", and it")

def ask(obj, meth, *args):
    val, printed = call(obj, meth, *args)
    check(not (val is None and printed.strip()), meth + " printed " + repr(printed.strip()) + " but handed back nothing (None). Use return, so whoever asked gets the answer and can decide what to do with it.")
    check(val is not None, meth + " handed back nothing (None) for " + who(obj) + ". Does every path through it end with a return?")
    return val

def attr(obj, name):
    have = list(vars(obj)) if hasattr(obj, "__dict__") else []
    if not hasattr(obj, name):
        check(not have, who(obj) + "'s page has no attribute " + name + ". It has: " + ", ".join(have) + ". Store the value on self under exactly the name the task gives (self." + name + " = ...).")
        check(False, (who(obj) + "'s page").replace("a ", "This ", 1) + " has no attributes at all. A plain variable inside __init__ vanishes when __init__ ends; to keep a value on the page, store it on self (self." + name + " = ...).")
    return getattr(obj, name)

def found(cls, space=None):
    seen = []
    for v in list((space if space is not None else ns).values()):
        for x in (v if isinstance(v, list) else [v]):
            if isinstance(x, cls) and not any(x is s for s in seen):
                seen.append(x)
    return seen

def named(cls, name, space=None):
    for x in found(cls, space):
        if getattr(x, "name", None) == name:
            return x
    return None

def run_fn(name, label, *args):
    f = ns.get(name)
    check(callable(f) and not isinstance(f, type), "Write a function called " + name + " (def " + name + "(...):) at the left edge, outside the classes.")
    val, printed = _gh_quiet(f, args, {}, "The rune called " + label + ", and it")
    check(not (val is None and printed.strip()), name + " printed " + repr(printed.strip()) + " but handed back nothing (None). Use return so the caller gets the answer.")
    check(val is not None, name + " handed back nothing (None). Does it end with a return?")
    return val

def page_of(obj):
    buf = io.StringIO()
    old = sys.stdout
    sys.stdout = buf
    try:
        s = str(obj)
    except Exception as e:
        sys.stdout = old
        check(not (buf.getvalue().strip() and "NoneType" in str(e)), "__str__ printed the page instead of handing it back. print() wants the text returned to it, so use return.")
        check(False, "Turning " + who(obj) + "'s page into text crashed with " + type(e).__name__ + ": " + str(e) + "." + _gh_advice(e))
    finally:
        sys.stdout = old
    return s

def again(old, new, label):
    check(old in src, "Keep " + label + " exactly as the starter had it, so the rune can try your program with other values.")
    try:
        return rerun(src.replace(old, new, 1))
    except Exception as e:
        check(False, "When the rune changes " + label + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the objects, so it fits any values, not just today's.")

`;

// The guild ledger as it grows. Starters carry the finished pieces forward, so
// each challenge is about its own new idea.
const PAGE3 = r`class Member:
    def __init__(self, name, role, years):
        self.name = name
        self.role = role
        self.years = years
`;

const PAGE_LV = r`class Member:
    def __init__(self, name, role, years):
        self.name = name
        self.role = role
        self.years = years
        self.level = 1
        self.xp = 0
`;

const TRAIN = r`
    def train(self, hours):
        self.xp += hours * 5
        while self.xp >= 20:
            self.xp -= 20
            self.level += 1
`;

const RANK = r`
    def rank(self):
        if self.years < 5:
            return "recruit"
        elif self.years < 20:
            return "guard"
        else:
            return "veteran"
`;

const LIMIT = r`
    def pack_limit(self):
        return 12 + 3 * (self.level - 1)
`;

const STR = r`
    def __str__(self):
        return f"{self.rank().title()} {self.name} the {self.role} (level {self.level})"
`;

const PACK = r`
    def pack(self, item):
        self.kit.append(item)
`;

const INIT_KIT = r`class Member:
    def __init__(self, name, role="recruit", years=0, kit=None):
        self.name = name
        self.role = role
        self.years = years
        self.level = 1
        self.xp = 0
        if kit is None:
            kit = []
        self.kit = kit
`;

const INIT_BADGE = r`class Member:
    motto = "Pack socks. Know where the door is."
    count = 0

    def __init__(self, name, role="recruit", years=0, kit=None):
        self.name = name
        self.role = role
        self.years = years
        self.level = 1
        self.xp = 0
        if kit is None:
            kit = []
        self.kit = kit
        Member.count += 1
        self.badge = Member.count
`;

const LEDGER7 = INIT_KIT + TRAIN + RANK + LIMIT + PACK + STR;
const LEDGER = INIT_BADGE + TRAIN + RANK + LIMIT + PACK + STR;

const SCOUT = r`

class Scout(Member):
    def sight(self, fog):
        return max(0, 40 + 10 * self.level - 15 * fog)
`;

const HEALER = r`

class Healer(Member):
    def __init__(self, name, years, herbs):
        super().__init__(name, "healer", years)
        self.herbs = herbs

    def tonics(self):
        return self.herbs // 3
`;

const SCOUT_OVER = SCOUT + r`
    def pack_limit(self):
        return super().pack_limit() - 4
`;

const HEALER_OVER = HEALER + r`
    def pack_limit(self):
        return super().pack_limit() - self.herbs // 5

    def __str__(self):
        return super().__str__() + f", {self.herbs} herbs"
`;

const RANGER = r`

class Ranger(Scout):
    def shortcut(self):
        return f"{self.name} knows a shortcut."
`;

const PARTY = r`

class Party:
    def __init__(self, name, size=4):
        self.name = name
        self.size = size
        self.members = []

    def add(self, member):
        if member in self.members or len(self.members) >= self.size:
            return False
        self.members.append(member)
        return True

    def total_carry(self):
        total = 0
        for m in self.members:
            total += m.pack_limit()
        return total

    def has_healer(self):
        for m in self.members:
            if isinstance(m, Healer):
                return True
        return False

    def leader(self):
        best = None
        for m in self.members:
            if best is None or m.level > best.level:
                best = m
        return best
`;

// ---- Reference answers that the listed mistakes are made from ----

const SOL1 = r`class Member:
    def __init__(self, name, role, years):
        self.name = name
        self.role = role
        self.years = years

rook = Member("Rook", "captain", 31)
print(f"{rook.name} the {rook.role}: {rook.years} years on the road")`;

const SOL2 = PAGE3 + r`
bram = Member("Bram", "cook", 22)
wren = Member("Wren", "miller", 9)
marlo = Member("Marlo", "fisher", 48)
marlo.years += 2
total = bram.years + wren.years + marlo.years
print(f"Years on the road between us: {total}")`;

const MAIN3 = r`
bram = Member("Bram", "cook", 22)
wren = Member("Wren", "miller", 9)
marlo = Member("Marlo", "fisher", 50)
`;

const SOL3 = PAGE3 + r`
    def roll_call(self):
        print(f"{self.name}: present! ({self.role})")

    def stripes(self):
        count = self.years // 5
        if count == 0:
            print(f"{self.name}: no stripes yet")
        else:
            print("*" * count)
` + MAIN3 + r`
for member in [bram, wren, marlo]:
    member.roll_call()
    member.stripes()`;

const SOL4 = PAGE_LV + TRAIN + r`

wren = Member("Wren", "miller", 9)
wren.train(3)
print(f"Wren: level {wren.level}, {wren.xp} experience saved")
wren.train(7)
print(f"Wren: level {wren.level}, {wren.xp} experience saved")`;

const MAIN5 = r`

rook = Member("Rook", "captain", 31)
bram = Member("Bram", "cook", 22)
wren = Member("Wren", "miller", 9)
marlo = Member("Marlo", "fisher", 50)
rook.train(30)
bram.train(9)
wren.train(7)
marlo.train(20)

tent = 18   # kilos
`;

const SOL5 = PAGE_LV + TRAIN + RANK + LIMIT + MAIN5 + r`
for member in [rook, bram, wren, marlo]:
    if member.pack_limit() >= tent:
        print(member.name)`;

const MAIN6 = r`

rook = Member("Rook", "captain", 31)
bram = Member("Bram", "cook", 22)
wren = Member("Wren", "miller", 9)
rook.train(30)
bram.train(9)
wren.train(7)
`;

const SOL6 = PAGE_LV + TRAIN + RANK + LIMIT + STR + MAIN6 + r`
print(rook)
print(bram)
print(wren)`;

const SOL7 = LEDGER7 + r`

vane = Member("Vane")
vane.pack("quill")
vane.pack("ream of paper")
vane.pack("very small umbrella")
print(vane)
print(vane.kit)`;

const SHEET = r`signups = [
    ("Rook", "captain", 31),
    ("Bram", "cook", 22),
    ("Wren", "miller", 9),
    ("Marlo", "fisher", 50),
    ("Vane", "recruit", 0),
    ("Hazel", "baker", 6),
    ("Ingrid", "smith", 18),
    ("Odo", "scholar", 40),
    ("Thistle", "mayor", 3),
]`;

const SHEET2 = r`signups = [
    ("Ottilie", "archer", 2),
    ("Corwin", "guard", 25),
    ("Juniper", "scout", 33),
    ("Bea", "cook", 8),
    ("Dov", "trader", 20),
]`;

const SOL8 = LEDGER7 + `\n\n` + SHEET + r`

roster = []
for name, role, years in signups:
    roster.append(Member(name, role, years))

def years_of(member):
    return member.years

for member in sorted(roster, key=years_of, reverse=True):
    print(member)

veterans = 0
for member in roster:
    if member.rank() == "veteran":
        veterans += 1
print(f"Veterans on the roll: {veterans}")`;

const SPAR = r`
    def can_spar(self, other):
        if other is self:
            return False
        return abs(self.level - other.level) <= 2

    def mentor(self, other):
        if self.level <= other.level:
            return 0
        hours = 2 * (self.level - other.level)
        other.train(hours)
        return hours
`;

const MAIN9 = r`

rook = Member("Rook", "captain", 31)
wren = Member("Wren", "miller", 9)
bram = Member("Bram", "cook", 22)
vane = Member("Vane")
rook.train(30)
wren.train(10)
bram.train(9)
`;

const SOL9 = LEDGER7 + SPAR + MAIN9 + r`
for member in [rook, bram, vane]:
    print(member.name, "and Wren, fair match:", member.can_spar(wren))
hours = rook.mentor(vane)
print(f"Rook mentored Vane for {hours} hours. {vane}")`;

const MAIN10 = r`

rook = Member("Rook", "captain", 31)
bram = Member("Bram", "cook", 22)
wren = Member("Wren", "miller", 9)
marlo = Member("Marlo", "fisher", 50)
vane = Member("Vane")
`;

const SOL10 = LEDGER + MAIN10 + r`
for member in [rook, bram, wren, marlo, vane]:
    print(f"Badge {member.badge}: {member.name}")
print("Motto:", Member.motto)`;

const MAIN11 = r`

wren = Member("Wren", "miller", 9)
wren.train(7)
`;

const SOL11 = LEDGER + SCOUT + MAIN11 + r`
tock = Scout("Tock", "scout", 7)
tock.train(10)
print(tock)
print("In fog 3, Tock sees", tock.sight(3), "metres.")
print("In fog 6, Tock sees", tock.sight(6), "metres.")`;

const MAIN12 = r`

tock = Scout("Tock", "scout", 7)
tock.train(10)
`;

const SOL12 = LEDGER + SCOUT + HEALER + MAIN12 + r`
mirela = Healer("Mirela", 12, 20)
print(mirela)
print("Tonics Mirela can brew:", mirela.tonics())`;

const MAIN13 = r`

rook = Member("Rook", "captain", 31)
tock = Scout("Tock", "scout", 7)
mirela = Healer("Mirela", 12, 20)
vane = Member("Vane")
rook.train(30)
tock.train(10)
mirela.train(5)
`;

const SOL13 = LEDGER + SCOUT_OVER + HEALER_OVER + MAIN13 + r`
for member in [rook, tock, mirela, vane]:
    print(member, "carries", member.pack_limit(), "kilos")`;

const MAIN14 = r`

yard = [
    Member("Rook", "captain", 31),
    Scout("Tock", "scout", 7),
    Healer("Mirela", 12, 20),
    Member("Bram", "cook", 22),
    Ranger("Sable", "ranger", 12),
    Member("Vane"),
    Member("Hazel", "baker", 6),
]
`;

const SOL14 = LEDGER + SCOUT_OVER + HEALER_OVER + RANGER + MAIN14 + r`
def groups(people):
    result = {"scouts": [], "healers": [], "others": []}
    for person in people:
        if isinstance(person, Scout):
            result["scouts"].append(person.name)
        elif isinstance(person, Healer):
            result["healers"].append(person.name)
        else:
            result["others"].append(person.name)
    return result

def herbs_in(people):
    total = 0
    for person in people:
        if isinstance(person, Healer):
            total += person.herbs
    return total

print(groups(yard))
print("Herbs in the yard:", herbs_in(yard))`;

const MAIN15 = r`

rook = Member("Rook", "captain", 31)
tock = Scout("Tock", "scout", 7)
mirela = Healer("Mirela", 12, 20)
bram = Member("Bram", "cook", 22)
vane = Member("Vane")
rook.train(30)
tock.train(10)
bram.train(9)
`;

const SOL15 = LEDGER + SCOUT_OVER + HEALER_OVER + PARTY + MAIN15 + r`
road = Party("Hill Road")
for member in [rook, tock, mirela, bram, vane]:
    print(member.name, "joins:", road.add(member))
print("The party can carry", road.total_carry(), "kilos.")
print("Healer along:", road.has_healer())
print("Leader:", road.leader())`;

const ROSTER = `name,role,years,level,herbs
Rook,captain,31,8,0
Bram,cook,22,3,0
Wren,miller,9,3,0
Marlo,fisher,50,6,0
Sable,scout,12,4,0
Hazel,baker,6,2,0
Ingrid,smith,18,5,0
Odo,scholar,40,1,0
Mirela,healer,12,2,20
Thistle,mayor,3,1,0
Tock,scout,7,5,0
Vane,recruit,0,2,0
`;

const SUPPLIES = `item,kilos
rope,9
tent,18
lanterns,7
tonic crate,12
shovels,15
rations,20
`;

const HEAD16 = r`import csv

` + LEDGER + SCOUT_OVER + HEALER_OVER + PARTY;

const SOL16 = HEAD16 + r`

def load_guild(filename):
    guild = []
    with open(filename) as f:
        for row in csv.DictReader(f):
            name = row["name"]
            role = row["role"]
            years = int(row["years"])
            if role == "scout":
                member = Scout(name, role, years)
            elif role == "healer":
                member = Healer(name, years, int(row["herbs"]))
            else:
                member = Member(name, role, years)
            member.level = int(row["level"])
            guild.append(member)
    return guild

def level_of(member):
    return member.level

def herbs_of(healer):
    return healer.herbs

def choose_party(guild, size):
    party = Party("North Hill Road", size)
    scouts = [m for m in guild if isinstance(m, Scout)]
    healers = [m for m in guild if isinstance(m, Healer)]
    if scouts:
        party.add(sorted(scouts, key=level_of, reverse=True)[0])
    if healers:
        party.add(sorted(healers, key=herbs_of, reverse=True)[0])
    for member in sorted(guild, key=level_of, reverse=True):
        party.add(member)
    return party

party_size = 5
guild = load_guild("roster.csv")
party = choose_party(guild, party_size)
for member in party.members:
    print(member)

needed = 0
with open("supplies.csv") as f:
    for row in csv.DictReader(f):
        needed += int(row["kilos"])
can = party.total_carry()
if can >= needed:
    print(f"The party can carry it all, with {can - needed} kilos to spare.")
else:
    print(f"The party is {needed - can} kilos short.")`;

export const GUILDHALL: Building = {
  id: "guildhall",
  name: "The Guild Hall",
  blurb: "Banners, a training yard and a lookout over the north hill.",
  villager: { name: "Rook", model: "captain", arrives: "start" },
  opening: [
    "Tick... tock. The clock tower chimes roll down the valley, and for the first time in three hundred years, evening comes on time.",
    "Someone comes up the road with the evening: boots worn soft, a pack on one shoulder, a scar from eyebrow to ear, and a map case held like a precious loaf.",
    "Rook: Captain Rook. Not retired. Resting between adventures. Heard there's a village here that talks to stones. Heard there's a storm on the hill that doesn't move.",
    "Rook: Three days it's sat up there. Doesn't drift. Doesn't rain. Just sits. Grey as old porridge, and twice as friendly.",
    "Pip looks north at the grey storm crouched on the hill... and looks away again, quickly. Pip has never liked that hill. Pip couldn't tell you why.",
    "Rook: A thing like that, you don't walk up to alone. You need a guild. Members, roles, a ledger to keep it all straight. Can your stone do ledgers, recruit?",
    "Ssso, it can do better than ledgers! In Python you can invent your **own kinds of things**: a **class** for guild members, and one **object** for every person in it. Let's build the Guild Hall!",
  ],
  finale: [
    "Rook: That's the hall. Banners up, yard swept, lookout manned, and a kettle that actually boils. Guild of Willowmere: fall in!",
    "And they do. Bram with a ladle, Wren with a shovel, Marlo with rope, Ingrid with the new picks, Mirela with her bag, Tock with something that whirs, and Lord Vane with a clipboard.",
    "All day the guild works up the north hill road: fallen trees sawn and stacked, boulders rolled aside, old waymarkers stood back up. By evening there's a road all the way to the top, where the storm hangs low over a ring of very old stones.",
    "Vane: Founder. A word, for the record. My grandfather, eleven greats back, was one of the speakers who left this valley. He took the Old Tongue to the cities and kept it in a drawer.",
    "Vane: I can't bring him back to teach it. But I can carry shovels for the people who will. I find that's a very great deal better than nothing.",
    "Rook: Well said, recruit. Even for a lord.",
    "That ring at the top... Pip knows those stones. Pip doesn't know *how* Pip knows them. But they're waiting. Whatever's under that storm, it's been waiting a very long time.",
    "The road is open. Willowmere has a **Guild Hall**, a guild to fill it, and one building left to raise.",
  ],
  chatDuring: [
    "Rook: Rule nine of the road: label your packs. Rule two I still can't remember. Nine's the useful one anyway.",
    "Rook: The scar? Bear. Big one. Wanted my sandwich. Got half. We both went home a bit hungry and a lot wiser.",
    "Rook: Classes, eh? Like a muster sheet. One sheet, a hundred soldiers, every one of them different. Could've used your stone in the old days.",
    "Rook: The lord keeps calling me 'Captain, sir, per regulation'. Told him once is plenty. He wrote it down. Once.",
    "Rook: Don't stare at that storm too long, recruit. Look at the hall instead. That's ours.",
  ],
  chatAfter: [
    "Rook: Guild tea's at dawn. Strong, no sugar. Bring your badge. Don't polish it.",
    "Rook: Road's clear to the top. Whatever's under that storm, we'll meet it together. Not today, though. Today's for tea.",
    "Rook: Vane's out on the yard every morning, drilling with a practice sword in one hand and a clipboard in the other. He's terrible. He's getting better. Don't tell him I said either.",
    "Rook: Same page for everybody, and everybody fills it in differently. That's a guild, recruit. That's all a guild is.",
  ],
  chronicle: {
    title: "The Last Speaker",
    text: [
      "They left the way snow leaves: not all at once, but a little more gone every morning. One spring there were fourteen of us who could speak to the stones. By the autumn there were three.",
      "Edric Vane went last of all. He kept our ledgers in the finest hand I have ever seen, and he could make a stone sing a column of numbers. I asked him to stay and teach the children. He said the city would listen to him as the valley never could, and that he would come back when he had made something of himself. I do not think he was wicked. I think he was young, and afraid of being ordinary, and the city paid well.",
      "The ones who stayed could not speak to the stones, but they stayed anyway: the miller's family, a fisher and her children, a cook who fed whoever was left. They listened to me kindly. But I had waited too long to teach them, and now the stones answered more slowly every day.",
      "So I am the last speaker in Willowmere, and I am writing that down plainly, because it is true and I am tired of softer words. My small companion sits on the stone beside me as I write, and will not leave it. If you are reading this, someone has learned to speak again, and I was wrong to call myself the last. I have never been so glad to be wrong.",
    ],
  },
  challenges: [
    {
      id: "g01-the-first-page",
      part: "Survey stakes",
      title: "The First Page",
      topic: "class and __init__",
      cost: { wood: 4, stone: 3 },
      intro: [
        "Rook: Every guild starts the same way, recruit. Not with a sword. With a ledger. One page per member: who they are, what they do, how long they've walked.",
        "The same boxes on every page? That's a **class**! A class is the blank form, and each filled-in page is an **object** made from it.",
        "Python fills in the form with a method called `__init__` (two underscores each side). It runs every time a new object is made, and `self` is the page being filled in: `self.colour = colour` writes onto it.",
      ],
      codex: ["classes", "init"],
      quiz: {
        code: r`class Boot:
    def __init__(self, size):
        self.size = size + 1

b = Boot(7)
print(b.size)`,
        question: "What does this program show?",
        options: ["8", "7", "size", "TypeError"],
        answer: 0,
        why: "Boot(7) runs __init__ with size 7, and __init__ stores size + 1 on the new boot. b.size reads back what was stored: 8.",
      },
      task: [
        "Write a class called `Member`: the guild's blank page.",
        "A member is made with three values, in this order: their name, their role, and how many years they've spent on the road. The page keeps them as attributes called `name`, `role` and `years`.",
        "Make Rook's page: the guild's captain, 31 years on the road.",
        "Print one line about Rook that shows all three, read back out of the object rather than typed in again.",
      ],
      starter: r`# The guild ledger: one class, one page per member.

# 1. The Member class

# 2. Rook's page

# 3. A line about Rook, read from the page
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "__init__", 3, "a name, a role and the years on the road")
m = make(Member, "Juniper", "scout", 2)
check(attr(m, "name") == "Juniper", "A member made as Member('Juniper', 'scout', 2) has the name " + repr(m.name) + ". The values arrive in the order name, role, years: store each one under its own attribute.")
check(attr(m, "role") == "scout", "A member made as Member('Juniper', 'scout', 2) has the role " + repr(m.role) + ". The values arrive in the order name, role, years: store each one under its own attribute.")
check(attr(m, "years") == 2, "A member made as Member('Juniper', 'scout', 2) has years " + repr(m.years) + ". The values arrive in the order name, role, years: store each one under its own attribute.")
rook = named(Member, "Rook")
check(rook is not None, "Make Rook's page: a Member whose name is Rook.")
check(rook.role == "captain", "Rook's role should be captain (all lowercase), but the page says " + repr(rook.role) + ".")
check(rook.years != "31", "Rook's years should be the number 31, not the text \"31\": leave off the quotes.")
check(rook.years == 31, "Rook has been on the road 31 years, but the page says " + repr(rook.years) + ".")
check(any("Rook" in l and "captain" in l and "31" in l for l in lines), "Print one line about Rook that shows the name, the role and the years together.")
if "31" in src:
    _, l2 = again("31", "17", "Rook's 31 years")
    check(any("17" in l for l in l2) and not any("31" in l for l in l2), "If Rook's page said 17 years instead, your line would still say 31. Read the years back out of the object instead of typing them again.")
check(".name" in src and ".role" in src, "Read Rook's name and role back out of the object too (the object's name, a dot, then the attribute), so the line always matches the page.")`,
      hints: [
        "Think of a paper form: the class is the blank form, and `__init__` is the moment a clerk fills one in. What three boxes does each page need, and where must each value be written so it stays on the page after `__init__` is done?",
        "A class for lanterns: `class Lantern:`, then indented `def __init__(self, colour, hours):` with `self.colour = colour` and `self.hours = hours` inside. Make one with `lamp = Lantern(\"amber\", 6)` and read it back with `lamp.colour`.",
        "`class Member:` / `    def __init__(self, name, role, years):` / three lines like `        self.name = name`. Then `rook = Member(...)` with Rook's three values in order, and an f-string that uses `rook.name`, `rook.role` and ...",
      ],
      solution: SOL1,
      wrong: [
        swap(SOL1, ["self.role = role", "self.job = role"], ["rook.role", "rook.job"]),
        r`class Member:
    def __init__(self, name, role, years):
        name = name
        role = role
        years = years

rook = Member("Rook", "captain", 31)
print("Rook the captain: 31 years on the road")`,
        swap(SOL1, ['print(f"{rook.name} the {rook.role}: {rook.years} years on the road")', 'print(f"{rook.name} the {rook.role}: 31 years on the road")']),
        swap(SOL1, ["31)", '"31")']),
        swap(SOL1, ["def __init__(self, name, role, years)", "def __init__(self, name, years, role)"], ['"captain", 31', '31, "captain"']),
        swap(SOL1, ["def __init__(self, name, role, years)", "def __init__(name, role, years)"]),
        swap(SOL1, ['print(f"{rook.name} the {rook.role}: {rook.years} years on the road")', 'print("Rook the captain: 31 years on the road")']),
      ],
      done: "Rook: Page one. Name, role, years. Neat hand, recruit. Neater than mine. Stakes are in and the string's tight: that's a guild hall-shaped rectangle.",
    },
    {
      id: "g02-pages-of-their-own",
      part: "Stone plinth",
      title: "Pages of Their Own",
      topic: "several objects",
      cost: { wood: 0, stone: 8 },
      intro: [
        "Rook: Word's got round. Three names on the sign-up sheet already. Bram, Wren, Marlo. Each one wants a page.",
        "One class can make as many objects as you like. Every call `Member(...)` makes a brand-new page with its own values, and changing one page leaves the others alone.",
        "Pip's warning: `b = a` does **not** copy a page. It gives the same page a second name, so changing `b` changes `a` too!",
      ],
      codex: ["classes", "init"],
      quiz: {
        code: r`class Cup:
    def __init__(self, tea):
        self.tea = tea

a = Cup("mint")
b = a
b.tea = "nettle"
print(a.tea)`,
        question: "What does this program show?",
        options: ["nettle", "mint", "tea", "AttributeError"],
        answer: 0,
        why: "b = a doesn't make a second cup. It's one cup with two names, so changing b.tea changes the only cup there is, and a.tea is \"nettle\" too.",
      },
      task: [
        "Give each of today's recruits a page of their own: Bram the cook (22 years on the road), Wren the miller (9) and Marlo the fisher (48).",
        "Marlo comes back: he forgot the two years he spent fishing before he could properly walk. Correct his page after it's made, by adding to what's on it rather than typing in his new total.",
        "Print the guild's total years on the road, worked out from the three pages.",
      ],
      starter: PAGE3 + r`
# 1. Three new pages: Bram, Wren and Marlo

# 2. Marlo's correction

# 3. The guild's total years on the road
`,
      tests: PRE + r`Member = need_class("Member")
pages = found(Member)
def page(n):
    p = named(Member, n)
    hint = " (If you wrote one name = another, that isn't a new page: it's the same page with two names, so filling it in for one rubbed out the other.)" if len(pages) < 3 else ""
    check(p is not None, "There's no page for " + n + " yet. Each recruit needs a Member of their own." + hint)
    return p
bram, wren, marlo = page("Bram"), page("Wren"), page("Marlo")
check(bram.role == "cook" and bram.years == 22, "Bram's page should say cook, 22 years on the road, but it says " + repr(bram.role) + ", " + repr(bram.years) + ".")
check(wren.role == "miller" and wren.years == 9, "Wren's page should say miller, 9 years on the road, but it says " + repr(wren.role) + ", " + repr(wren.years) + ".")
check(marlo.role == "fisher", "Marlo's role should be fisher, but the page says " + repr(marlo.role) + ".")
check(marlo.years != 48, "Marlo's page still says 48. Add his two forgotten years to his page after it's made.")
check("48" in src, "Make Marlo's page with the 48 years he first gave, then correct it: a ledger shows its corrections.")
check(marlo.years == 50, "Marlo's page says " + repr(marlo.years) + " years. It should be the 48 he first gave plus the 2 he forgot.")
check(not re.search(r"\.years\s*=\s*50", src), "Add the 2 years to what's already on Marlo's page instead of typing his new total.")
check(re.search(r"\.years\s*\+=", src) or re.search(r"\.years\s*=\s*\w+\.years\s*\+", src), "Correct Marlo's page by adding to the years already on it.")
total = bram.years + wren.years + marlo.years
check(any(str(total) in l for l in lines), "Print the guild's total years on the road: all three pages added together, after Marlo's correction.")
_, l2 = again("22", "25", "Bram's 22 years")
check(any(str(total + 3) in l for l in l2), "If Bram's page said 25 years instead of 22, your total wouldn't change. Add up the three pages' years instead of typing numbers.")`,
      hints: [
        "Each recruit is one call to the class, and each call makes a separate page. Once a page exists, you can read and change its values through its name, a dot and the attribute.",
        "With lanterns: `a = Lantern(\"amber\", 6)` and `b = Lantern(\"blue\", 4)` are two separate lanterns. `b.hours += 3` adds to b's hours only, and `a.hours + b.hours` adds the two together.",
        "Three lines like `wren = Member(\"Wren\", ..., ...)`, then `marlo.years += ...`, then add `bram.years`, `wren.years` and `marlo.years` together and print the result.",
      ],
      solution: SOL2,
      wrong: [
        PAGE3 + r`
bram = Member("Bram", "cook", 22)
wren = bram
wren.name = "Wren"
wren.role = "miller"
wren.years = 9
marlo = Member("Marlo", "fisher", 48)
marlo.years += 2
print(bram.years + wren.years + marlo.years)`,
        swap(SOL2, ['"fisher", 48)', '"fisher", 50)'], ["marlo.years += 2\n", ""]),
        swap(SOL2, ["marlo.years += 2\n", ""]),
        swap(SOL2, ["marlo.years += 2", "marlo.years = 50"]),
        swap(SOL2, ["total = bram.years + wren.years + marlo.years", "total = 81"]),
        swap(SOL2, ["total = bram.years + wren.years + marlo.years", "total = 22 + 9 + marlo.years"]),
      ],
      done: "Rook: Three pages, three people. Marlo's crossed out and corrected, proper ledger fashion. Plinth's down. Stone's honest stuff, like a good ledger.",
    },
    {
      id: "g03-roll-call",
      part: "Plank floor",
      title: "Roll Call",
      topic: "methods and self",
      cost: { wood: 7, stone: 1 },
      intro: [
        "Rook: Rule six of the road: roll call every morning. Everyone answers for themselves. No answering for your mate.",
        "A function written *inside* a class is a **method**, and every object of the class can use it: `lamp.light()`.",
        "A method's first parameter is `self`: the very object it was called on. So inside the method, `self.name` is *this* member's name, whoever they happen to be.",
      ],
      codex: ["methods", "classes"],
      quiz: {
        code: r`class Goat:
    def __init__(self, name):
        self.name = name

    def bleat(self):
        print(self.name + " says baa")

a = Goat("Nibbles")
b = Goat("Clover")
b.bleat()`,
        question: "What does this program show?",
        options: ["Clover says baa", "Nibbles says baa", "self.name says baa", "TypeError"],
        answer: 0,
        why: "bleat was called on b, so inside it self is b, and self.name is \"Clover\". The other goat isn't involved at all.",
      },
      task: [
        "Teach every member to answer the roll: a method `roll_call()` that prints one line with the member's name, the word `present`, and their role.",
        "Rook sews one stripe on a sleeve for every **full** five years on the road. A method `stripes()` prints a member's stripes as a row of `*`, one per stripe. Anyone without a single full five yet has no stripes, and their line should say `no stripes yet`.",
        "Have the three recruits in the starter answer the roll and show their stripes.",
      ],
      starter: PAGE3 + r`
    # roll_call(): the member's name, the word present, and their role

    # stripes(): one * for every full five years on the road

` + MAIN3 + r`
# Roll call, then stripes, for all three
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "roll_call", 0, "nothing")
need_method(Member, "stripes", 0, "nothing")
m = make(Member, "Juniper", "scout", 3)
_, said = call(m, "roll_call")
said = said.strip()
check(said, "roll_call didn't print anything. It should print the member's line for the roll.")
check("Juniper" in said, "For a member named Juniper, roll_call printed " + repr(said) + ". Inside the method, self is whichever member it was called on, so self.name is that member's own name.")
check("scout" in said, "Juniper's roll call should also say the role, scout. It printed: " + repr(said))
check("present" in said.lower(), "Juniper's roll call needs the word present. It printed: " + repr(said))
check(len(said.splitlines()) == 1, "roll_call should print just one line.")
for y in [0, 3, 5, 14, 22]:
    _, row = call(make(Member, "Corwin", "guard", y), "stripes")
    row = row.strip()
    want = y // 5
    if want == 0:
        check("no stripes yet" in row.lower() and "*" not in row, "A member with " + str(y) + " years on the road hasn't earned a stripe yet, so stripes() should say no stripes yet. It printed: " + repr(row))
    else:
        check(row.count("*") == want, "A member with " + str(y) + " years on the road has " + str(want) + " full five" + ("s" if want > 1 else "") + ", but stripes() printed " + repr(row) + ". Only whole fives earn a stripe; what's left over doesn't.")
        check("no stripes" not in row.lower(), "A member with " + str(y) + " years has stripes, but the line still says no stripes.")
for n in ["Bram", "Wren", "Marlo"]:
    check(any(n in l and "present" in l.lower() for l in lines), "Call roll_call() on each of the three recruits: " + n + " didn't answer.")
check(out.count("*") >= 15, "Show the stripes of all three recruits too.")`,
      hints: [
        "Write each method as if for one member you can't see: you don't know their name, only that it's on *their* page. How does the method reach that page? For stripes, work a few out on paper: 4 years, 5 years, 14 years.",
        "Inside a goat method, `self.name` is that goat's name: `def bleat(self): print(self.name, \"says baa\")`. Whole fives come from `//`, and `\"*\" * 3` gives `***`.",
        "`def roll_call(self):` printing `self.name`, `present` and `self.role`. `def stripes(self):` works out `self.years // 5`, then `if` it is 0 print the no-stripes line, `else:` print `\"*\" * ...`. Then call both on each recruit: `bram.roll_call()`.",
      ],
      solution: SOL3,
      wrong: [
        swap(SOL3, ['print(f"{self.name}: present! ({self.role})")', 'print(f"{bram.name}: present! ({bram.role})")']),
        swap(SOL3, ["def stripes(self):", "def stripes():"], ["    member.stripes()", "    print(member.years // 5)"]),
        swap(SOL3, ["count = self.years // 5", "count = round(self.years / 5)"]),
        swap(SOL3, ['print(f"{self.name}: no stripes yet")', 'print("")']),
        swap(SOL3, ['print(f"{self.name}: present! ({self.role})")', 'print(f"{self.name}: here! ({self.role})")']),
        swap(SOL3, ["    member.roll_call()\n", ""]),
        PAGE3 + r`
def roll_call(member):
    print(member.name, "present", member.role)
` + MAIN3 + r`
roll_call(bram)
roll_call(wren)
roll_call(marlo)`,
      ],
      done: "Rook: Three answers, three voices, nobody answering for anybody. Good. Floor's down, too. Mind the sawhorse.",
    },
    {
      id: "g04-drill-day",
      part: "Timber posts",
      title: "Drill Day",
      topic: "methods that change an object",
      cost: { wood: 8, stone: 1 },
      intro: [
        "Rook: Posts go up, recruits go out. Drill day. Nobody's born knowing how to march uphill in fog.",
        "A method can change the object it belongs to: `self.honey += 2` inside a method changes *that* object's honey, and the change stays after the method ends.",
        "Values every new object starts with don't need passing in: `__init__` can simply set them, like `self.lit = False`.",
      ],
      codex: ["methods", "init"],
      quiz: {
        code: r`class Jar:
    def __init__(self):
        self.honey = 0

    def fill(self, spoons):
        self.honey += spoons

j = Jar()
j.fill(2)
j.fill(3)
print(j.honey)`,
        question: "What does this program show?",
        options: ["5", "3", "0", "TypeError"],
        answer: 0,
        why: "Each fill adds to self.honey on the same jar, and the jar keeps it: 0 + 2 + 3 = 5.",
      },
      task: [
        "Every new member starts at level 1 with no experience saved up. Give each page a `level` and an `xp` from the moment it's made (nobody passes them in).",
        "A method `train(hours)`: each hour of drill earns 5 experience. Whenever a member has 20 experience saved up, they spend those 20 to go up a level. A long drill can be worth more than one level, and whatever is left over stays saved for next time.",
        "Send Wren to drill for 3 hours and then 7 more, and print her level and experience after each drill.",
      ],
      starter: PAGE3 + r`        # every member starts at level 1, with no experience

    # train(hours): 5 experience an hour; every 20 saved buys a level


wren = Member("Wren", "miller", 9)
# Two drills for Wren, with a report after each
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "train", 1, "the hours of drill")
m = make(Member, "Corwin", "guard", 4)
check(attr(m, "level") == 1, "A brand-new member should start at level 1, but the page says level " + repr(m.level) + ".")
check(attr(m, "xp") == 0, "A brand-new member should start with no experience saved, but the page says " + repr(m.xp) + ".")
call(m, "train", 3)
check((m.level, m.xp) != (1, 0), "train didn't change Corwin's page at all. To change the object, change the values on self (self.xp), not a new variable that vanishes when the method ends.")
check(m.xp == 15 or m.level != 1, "Each hour of drill earns 5 experience, but after a 3-hour drill Corwin's page says " + repr(m.xp) + " experience.")
check((m.level, m.xp) == (1, 15), "A 3-hour drill isn't worth a level yet, but Corwin's page says level " + str(m.level) + " with " + str(m.xp) + " experience saved.")
call(m, "train", 1)
check(m.level == 2, "One more hour brings Corwin to exactly 20 saved, and 20 is enough for a level. The page still says level " + str(m.level) + ".")
check(m.xp == 0, "After spending exactly 20 on a level, nothing should be left over, but Corwin's page says " + str(m.xp) + " experience.")
call(m, "train", 9)
check(not (m.level == 3 and m.xp == 25), "A 9-hour drill earns enough for two levels, but Corwin only went up one. After a level-up there may still be 20 saved: keep spending while there is.")
check(not (m.level == 3 and m.xp == 0), "Corwin went up a level but lost the leftover experience. Take away only the 20 that pays for each level; the rest stays saved.")
check((m.level, m.xp) == (4, 5), "After a 9-hour drill from level 2 with nothing saved, Corwin's page says level " + str(m.level) + " with " + str(m.xp) + " experience. Work it through on paper: how much does 9 hours earn, and how many 20s does it buy?")
other = make(Member, "Bea", "cook", 1)
check((other.level, other.xp) == (1, 0), "A brand-new member should start at level 1 with nothing saved, even after someone else has trained.")
wren = named(Member, "Wren")
check(wren is not None, "Keep Wren's page from the starter.")
check((wren.level, wren.xp) == (3, 10), "Send Wren to drill for 3 hours and then 7 more. Her page says level " + str(wren.level) + " with " + str(wren.xp) + " experience.")
check(len(lines) >= 2, "Print Wren's level and experience after each drill.")`,
      hints: [
        "Work Wren's drills out on paper first. How much experience after 3 hours? After 7 more? How many times do you take 20 away? Notice that 'how many times' isn't always once.",
        "A method changes its object through self: `self.honey += spoons`. Repeating something *while* a condition holds is a `while` loop: `while self.honey >= 10:` take 10 away and add one to `self.jars`.",
        "In `__init__`: `self.level = 1` and `self.xp = 0`. In `train`: add `hours * 5` to `self.xp`, then `while self.xp >= 20:` take 20 from `self.xp` and add 1 to ...",
      ],
      solution: SOL4,
      wrong: [
        swap(SOL4, ["while self.xp >= 20:", "if self.xp >= 20:"]),
        swap(SOL4, ["self.xp -= 20", "self.xp = 0"]),
        swap(SOL4, ["self.xp += hours * 5", "self.xp += hours"]),
        swap(SOL4, ["while self.xp >= 20:", "while self.xp > 20:"]),
        swap(SOL4, ["self.level = 1", "self.level = 0"]),
        swap(SOL4, ["self.xp += hours * 5", "xp = self.xp + hours * 5"]),
        swap(SOL4, ["wren.train(7)", "wren.train(4)"]),
      ],
      done: "Rook: Level three by lunch. Wren drills like she mills: no stopping till it's done. Posts are up, recruit. That's the bones of the place.",
    },
    {
      id: "g05-ask-dont-shout",
      part: "Wall frame",
      title: "Ask, Don't Shout",
      topic: "methods that return values",
      cost: { wood: 8, stone: 2 },
      intro: [
        "Rook: Planning a march means asking questions. Who can carry what. Who's seen enough road to lead. I don't want answers shouted across the yard. I want them handed to me.",
        "A method can **return** a value, just like the functions at the forge. A method that only prints shouts its answer and hands back `None`; one that returns lets your program use the answer in an `if`, a sum or an f-string.",
        "A method can even ask another method of the same object: `self.other_method()`.",
      ],
      codex: ["methods"],
      quiz: {
        code: r`class Oven:
    def __init__(self, heat):
        self.heat = heat

    def ready(self):
        print(self.heat >= 200)

o = Oven(220)
answer = o.ready()
print(answer)`,
        question: "What does this program show?",
        options: ["True\nNone", "True\nTrue", "True", "None"],
        answer: 0,
        why: "ready() prints True, but it never returns anything, so answer is None. Printing shouts the answer; only return hands it back.",
      },
      task: [
        "A method `rank()` hands back a member's rank as a word, from their years on the road: under 5 years is a `recruit`, under 20 a `guard`, and 20 or more makes a `veteran`.",
        "A method `pack_limit()` hands back how many kilos a member can carry up the hill: 12 at level 1, and 3 more for every level above that.",
        "The guild tent weighs `tent` kilos. Print the name of every member in the starter who could carry it alone, and nobody else's.",
      ],
      starter: PAGE_LV + TRAIN + r`
    # rank(): recruit, guard or veteran, from the years on the road

    # pack_limit(): the kilos this member can carry up the hill
` + MAIN5 + r`# Who could carry the tent alone?
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "rank", 0, "nothing")
need_method(Member, "pack_limit", 0, "nothing")
for y, want in [(0, "recruit"), (4, "recruit"), (5, "guard"), (19, "guard"), (20, "veteran"), (31, "veteran")]:
    got = ask(make(Member, "Bea", "cook", y), "rank")
    check(not (isinstance(got, str) and got.lower() == want and got != want), "rank() should hand back the word in lowercase, like the task's words, but it gave " + repr(got) + ".")
    edge = ""
    if y in (5, 20):
        edge = " Exactly " + str(y) + " years is enough: 'under " + str(y) + "' stops one year short of it."
    if y in (4, 19):
        edge = " 'Under' means fewer than, not 'up to'."
    check(got == want, "A member with " + str(y) + " years on the road should be a " + want + ", but rank() handed back " + repr(got) + "." + edge)
for lv in [1, 2, 5]:
    m = make(Member, "Dov", "guard", 3)
    m.level = lv
    got = ask(m, "pack_limit")
    if lv == 1:
        check(got == 12, "A level 1 member carries just the base 12 kilos: the extra 3s are only for levels above the first. pack_limit() handed back " + repr(got) + ".")
    check(got == 12 + 3 * (lv - 1), "For a level " + str(lv) + " member, pack_limit() handed back " + repr(got) + ". It's 12 kilos, and 3 more for each level above the first.")
tent = ns.get("tent", 18)
for x in found(Member):
    n = getattr(x, "name", "")
    lim = ask(x, "pack_limit")
    if lim >= tent:
        check(n in out, n + " can carry the tent alone, but isn't on your list." + (" Carrying exactly as much as the tent weighs is enough." if lim == tent else ""))
    else:
        check(n not in out, n + " can't carry the tent alone, but your program printed that name.")
for old, new, label, heavy in [("tent = 18", "tent = 30", "the line tent = 18", 30), ("bram.train(9)", "bram.train(4)", "the line bram.train(9)", 18)]:
    ns2, l2 = again(old, new, label)
    text = chr(10).join(l2)
    for x in found(ns2["Member"], ns2):
        n = getattr(x, "name", "")
        if x.pack_limit() >= heavy:
            check(n in text, "When the rune changes " + label + ", " + n + " can still carry the tent, but your program didn't print that name. Ask each member's pack_limit() instead of choosing names yourself.")
        else:
            check(n not in text, "When the rune changes " + label + ", " + n + " can't carry the tent any more, but your program still printed that name. Ask each member's pack_limit() instead of choosing names yourself.")`,
      hints: [
        "Each method answers one question about *this* member, so it works from self's values and hands the answer back. Try each rule on paper with a few members first: what should 4, 5, 19 and 20 years give?",
        "Handing back is `return`: `def ready(self): return self.heat >= 200`. A chain of choices can return from each branch: `if self.heat < 100: return \"cold\"`, then `elif`, then `else`.",
        "`rank`: `if self.years < 5: return \"recruit\"`, then an `elif` for under 20, else veteran. `pack_limit`: `return 12 + 3 * (...)`. For the tent: loop over the four members, and `if member.pack_limit() >= tent:` print ...",
      ],
      solution: SOL5,
      wrong: [
        swap(SOL5, ['            return "recruit"', '            print("recruit")']),
        swap(SOL5, ["if self.years < 5:", "if self.years <= 5:"]),
        swap(SOL5, ["return 12 + 3 * (self.level - 1)", "return 12 + 3 * self.level"]),
        swap(SOL5, ["if member.pack_limit() >= tent:", "if member.pack_limit() > tent:"]),
        swap(SOL5, ["return 12 + 3 * (self.level - 1)", "print(12 + 3 * (self.level - 1))"], ["if member.pack_limit() >= tent:", "if member.level >= 3:"]),
        PAGE_LV + TRAIN + RANK + LIMIT + MAIN5 + r`
print("Rook")
print("Bram")
print("Marlo")`,
        swap(SOL5, ['return "veteran"', 'return "Veteran"']),
      ],
      done: "Rook: Frame's up, and I've got answers I can use. Three of you could carry the tent alone. Wren says she could too, out of spite. I believe her.",
    },
    {
      id: "g06-a-proper-page",
      part: "Plank walls",
      title: "A Proper Page",
      topic: "__str__",
      cost: { wood: 9, stone: 0 },
      intro: [
        "Rook: Tried printing a page for the notice board. Got `<__main__.Member object at 0x7f3a…>`. That's not a name, recruit. That's a mule's sneeze.",
        "When you `print()` an object, Python looks for a method called `__str__` and prints whatever text it **returns**. Without one, you only get the object's address in memory.",
      ],
      codex: ["str-method", "methods"],
      quiz: {
        code: r`class Hat:
    def __init__(self, colour):
        self.colour = colour

    def __str__(self):
        return "a " + self.colour + " hat"

h = Hat("green")
print(h)
print("I wear", h)`,
        question: "What does this program show?",
        options: ["a green hat\nI wear a green hat", "a green hat\nI wear h", "green\nI wear green", "TypeError"],
        answer: 0,
        why: "print() asks the hat for its __str__ every time it prints it, whether on its own or after other words, and gets back \"a green hat\".",
      },
      task: [
        "Give `Member` a `__str__` so that printing a member shows their page in one line: their rank with a capital letter, their name, the word `the`, their role, and their level in brackets.",
        "For example, an archer called Ottilie with 7 years on the road, at level 2, prints as `Guard Ottilie the archer (level 2)`.",
        "Print the pages of the members in the starter.",
      ],
      starter: PAGE_LV + TRAIN + RANK + LIMIT + r`
    # __str__(): the member's page, in one line
` + MAIN6 + r`# Print everyone's page
`,
      tests: PRE + r`Member = need_class("Member")
own = [k for k in Member.__dict__ if "str" in k.lower() and k != "__str__"]
check("__str__" in Member.__dict__, ("Python only uses a method spelled exactly __str__, with two underscores on each side. Yours is called " + ", ".join(own) + ".") if own else "Give Member a __str__ method: print() looks for one, and without it you only get the object's address.")
need_method(Member, "__str__", 0, "nothing")
m = make(Member, "Ottilie", "archer", 7)
m.level = 2
s = page_of(m)
check(isinstance(s, str), "__str__ should hand back text.")
check("bound method" not in s, "The page reads " + repr(s) + ": a method was used without the brackets that call it. Add ().")
check(not s.startswith("guard"), "The rank needs its capital letter at the start of the page. The page reads " + repr(s) + ".")
check(s == "Guard Ottilie the archer (level 2)", "For the task's example (a level 2 archer called Ottilie, 7 years on the road) your page reads " + repr(s) + ". Compare it with the example letter by letter: words, spaces and brackets.")
for n, role, y, lv, rk in [("Bea", "cook", 31, 6, "Veteran"), ("Dov", "scout", 0, 1, "Recruit")]:
    x = make(Member, n, role, y)
    x.level = lv
    got = page_of(x)
    check(got == rk + " " + n + " the " + role + " (level " + str(lv) + ")", "A level " + str(lv) + " " + role + " called " + n + " with " + str(y) + " years on the road prints as " + repr(got) + ". Is every part read from this member's own page, with the rank asked fresh each time?")
for x in found(Member):
    check(page_of(x) in lines, "Print the pages of the members in the starter: " + x.name + "'s is missing. print(member) shows its __str__.")`,
      hints: [
        "`__str__` is a method like the others, with one job: build this member's page as text and hand it back. Which values are attributes already, and which comes from a method you wrote last time?",
        "For a hat: `def __str__(self): return f\"a {self.colour} hat\"`. A method's answer can go inside the braces too, brackets and all: `{self.size()}`. And `\"guard\".title()` gives `\"Guard\"`.",
        "`return f\"{self.rank().title()} {self.name} the ...\"`, finishing with the role and the level in brackets. Then `print(rook)` and the others.",
      ],
      solution: SOL6,
      wrong: [
        swap(SOL6, ['return f"{self.rank().title()} {self.name} the {self.role} (level {self.level})"', 'print(f"{self.rank().title()} {self.name} the {self.role} (level {self.level})")'], ["print(rook)\nprint(bram)\nprint(wren)", "rook.__str__()"]),
        swap(SOL6, ["def __str__(self):", "def _str_(self):"]),
        swap(SOL6, ["{self.rank().title()}", "{self.rank}"]),
        swap(SOL6, ["{self.rank().title()}", "{self.rank()}"]),
        swap(SOL6, ["(level {self.level})", "level {self.level}"]),
        swap(SOL6, ["print(rook)\nprint(bram)\nprint(wren)", "print(rook.name)\nprint(bram.name)\nprint(wren.name)"]),
        swap(SOL6, ["{self.rank().title()}", "{rook.rank().title()}"]),
      ],
      done: "Rook: Pages on the board, one line each. 'Veteran Rook the captain.' Sounds good. Sounds tall. Walls are up; somebody nail a tea shelf on that one.",
    },
    {
      id: "g07-lord-vanes-form",
      part: "Gables and rafters",
      title: "Lord Vane's Form",
      topic: "default values in __init__",
      cost: { wood: 9, stone: 1 },
      intro: [
        "A tall figure waits at the gate with a very neat stack of paper. Pip knows those boots. **Lord Vane.**",
        "Vane: Captain. Founder. I have come to join your guild, if it will have me. I filled in your form myself, in triplicate. 'Role' I left blank. 'Years on the road' I left blank too, as I have never been on a road that wasn't paved.",
        "Rook: Then the form's broken, recruit. Not you. The form. Fix it.",
        "A parameter can have a **default**: `def __init__(self, colour, hours=6):`. Leave it out when making the object and the default is used. Parameters with defaults go after the ones without.",
        "Ssso, one warning: a default **list** is made only once, and shared by everyone who leaves it out. The Codex shows the safe way.",
      ],
      codex: ["init", "classes"],
      quiz: {
        code: r`class Basket:
    def __init__(self, eggs=[]):
        self.eggs = eggs

a = Basket()
b = Basket()
a.eggs.append("brown")
print(b.eggs)`,
        question: "What does this program show?",
        options: ["['brown']", "[]", "['brown', 'brown']", "TypeError"],
        answer: 0,
        why: "The default [] was made once, when Python read the def, and both baskets were handed that same list. An egg in a's basket is an egg in b's.",
      },
      task: [
        "Change the form so a member can be made with just a name. Anyone who leaves out the role joins as a `recruit`; anyone who leaves out the years has 0.",
        "Members now carry a `kit`: a list of what they've packed. A kit can be handed over when the member is made (after the years). A member made without one starts with an empty kit **of their own**.",
        "A method `pack(item)` puts an item in that member's kit.",
        "Sign Lord Vane up with nothing but his name, `Vane`, and pack his three essentials: a quill, a ream of paper and a very small umbrella. Then print his page and his kit.",
      ],
      starter: PAGE_LV.replace("        self.xp = 0\n", "        self.xp = 0\n        # the kit\n") + TRAIN + RANK + LIMIT + STR + r`
    # pack(item)


# Lord Vane's page, his three essentials, then his page and kit
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "__init__", 1, "a name")
f = Member.__dict__["__init__"]
names = list(f.__code__.co_varnames[:f.__code__.co_argcount])
optional = len(f.__defaults__ or ())
check(len(names) - 1 - optional <= 1, "Only the name should be needed to make a member. Give the role and the years default values (name=value in the def), so they can be left out.")
check(len(names) >= 5, "A member can also be handed a kit after the years, so __init__ needs a place for it.")
a = make(Member, "Corwin")
check(attr(a, "role") == "recruit", "Someone made with only a name should join as a recruit (all lowercase), but Corwin's role is " + repr(a.role) + ".")
check(attr(a, "years") == 0, "Someone made with only a name should have 0 years on the road, but Corwin's page says " + repr(a.years) + ".")
check(attr(a, "level") == 1 and attr(a, "xp") == 0, "New members should still start at level 1 with no experience.")
k = attr(a, "kit")
check(not (k and any(x.kit is k for x in found(Member) if x is not a and hasattr(x, "kit"))), "Corwin was made without a kit, but already holds " + repr(k) + ": things someone else packed! A default list is made only once, when Python reads the def, so everyone who leaves the kit out shares that one list. Give each member a list of their own.")
check(k is not None, "Corwin's kit is None. When nobody hands over a kit, the member should get a fresh empty list instead.")
check(isinstance(k, list) and k == [], "Corwin was made without a kit, so the kit should be an empty list, but it is " + repr(k) + ".")
b = make(Member, "Juniper")
need_method(Member, "pack", 1, "the item")
call(a, "pack", "rope")
check(a.kit == ["rope"], "After packing a rope, Corwin's kit should hold just the rope, but it holds " + repr(a.kit) + ".")
check(b.kit == [], "Corwin packed a rope, and it turned up in Juniper's kit too! A default list is made only once, when Python reads the def, so everyone who leaves the kit out shares that one list. Give each member a list of their own.")
c = make(Member, "Bea", "cook", 12, ["ladle"])
check(c.role == "cook" and c.years == 12 and c.kit == ["ladle"], "Member('Bea', 'cook', 12, ['ladle']) should keep all four values, but the page has role " + repr(c.role) + ", years " + repr(c.years) + ", kit " + repr(c.kit) + ".")
call(c, "pack", "pot")
check(c.kit == ["ladle", "pot"], "Bea brought a ladle and then packed a pot, so the kit should hold both, but it holds " + repr(c.kit) + ".")
d = make(Member, "Dov", years=3)
check(d.role == "recruit" and d.years == 3, "Member('Dov', years=3) should be a recruit with 3 years, but the page says " + repr(d.role) + ", " + repr(d.years) + ".")
v = named(Member, "Vane")
check(v is not None, "Sign up Lord Vane: a Member whose name is Vane.")
check(v.role == "recruit" and v.years == 0, "Make Vane's page with nothing but his name, so the form fills in the rest. His page says role " + repr(v.role) + ", years " + repr(v.years) + ".")
check(len(v.kit) == 3, "Pack Vane's three essentials into his kit (a quill, a ream of paper and a very small umbrella). His kit holds " + repr(v.kit) + ".")
check(page_of(v) in lines, "Print Vane's page.")
check(all(str(item) in out for item in v.kit), "Print Vane's kit too.")`,
      hints: [
        "Two puzzles. First: which values may be left out, and what should they be when they are? Second: how could two members who both brought no kit end up sharing one? Try the quiz's baskets on paper.",
        "Defaults go in the def: `def __init__(self, colour, hours=6):`. For a list, the safe pattern is a default of `None` and a fresh list made inside: `if eggs is None:` then `eggs = []`, so every call builds its own.",
        "`def __init__(self, name, role=\"recruit\", years=0, kit=None):`, then `if kit is None:` make a new empty list before `self.kit = kit`. `pack` is one line: add the item to the end of ...",
      ],
      solution: SOL7,
      wrong: [
        swap(SOL7, ["kit=None):", "kit=[]):"], ["        if kit is None:\n            kit = []\n", ""]),
        swap(SOL7, ['role="recruit"', 'role="Recruit"']),
        swap(SOL7, ["        if kit is None:\n            kit = []\n", ""]),
        swap(SOL7, ['vane = Member("Vane")', 'vane = Member("Vane", "lord", 0)']),
        swap(SOL7, ["kit=None):", "):"], ["        if kit is None:\n            kit = []\n        self.kit = kit", "        self.kit = []"]),
        swap(SOL7, ["self.kit.append(item)", "self.kit = [item]"]),
        swap(SOL7, ["print(vane.kit)", 'print("quill, paper, umbrella")']),
      ],
      done: "Vane: 'Recruit Vane the recruit.' It has a certain... symmetry. I shall have it framed. Rook: You'll have it carried. Gables up, rafters on. The hall has a shape now.",
    },
    {
      id: "g08-the-whole-roll",
      part: "Shingle roof",
      title: "The Whole Roll",
      topic: "objects in a list",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Rook: Hazel, Ingrid, Odo and the mayor signed up this morning. I've copied the whole sheet out fresh. Can't keep a variable for every one of you. We'd run out of names before we ran out of recruits.",
        "Objects fit in lists like anything else. Make them in a loop, keep them in a list, and walk the list: `for jar in pantry: print(jar)`.",
        "Careful: printing a *whole list* shows each object's inside view, not its page. Print them one at a time to see their `__str__`.",
      ],
      codex: ["object-lists", "str-method"],
      quiz: {
        code: r`class Jar:
    def __init__(self, honey):
        self.honey = honey

jars = [Jar(3), Jar(5), Jar(1)]
total = 0
for j in jars:
    total += j.honey
print(total, len(jars))`,
        question: "What does this program show?",
        options: ["9 3", "3 3", "9 1", "TypeError"],
        answer: 0,
        why: "The loop visits each jar in turn and adds its honey: 3 + 5 + 1 = 9. The list holds 3 jars.",
      },
      task: [
        "Turn every line of the sign-up sheet in the starter into a `Member`, and keep them all together in one list.",
        "Print the roll: every member's page, the one with the most years on the road first, and so on down.",
        "Finish with one line saying how many of them are veterans.",
      ],
      starter: LEDGER7 + `\n\n` + SHEET + r`

# 1. A Member for every line, all kept in one list

# 2. The roll: most years on the road first

# 3. How many veterans?
`,
      tests: PRE + "SHEET = " + JSON.stringify(SHEET) + "\nSHEET2 = " + JSON.stringify(SHEET2) + "\n" + r`Member = need_class("Member")
def roll_for(sheet_text):
    d = {}
    exec(sheet_text, d)
    data = d["signups"]
    def years(t):
        return t[2]
    pages = []
    for n, role, y in sorted(data, key=years, reverse=True):
        rk = "recruit" if y < 5 else ("guard" if y < 20 else "veteran")
        pages.append(rk.title() + " " + n + " the " + role + " (level 1)")
    vets = len([t for t in data if t[2] >= 20])
    return pages, vets
def judge(got, sheet_text, when):
    pages, vets = roll_for(sheet_text)
    def say(m):
        m = when + m
        return m[0].upper() + m[1:]
    check(not any("object at 0x" in l for l in got), "Printing a whole list shows each member's inside view, not their page. Loop over the list and print each member on its own.")
    check(len(got) >= len(pages) + 1, say("the roll should be one page per recruit and then the veterans line, but your program printed " + str(len(got)) + " line(s)."))
    check(sorted(got[:len(pages)]) == sorted(pages), say("every line of the roll should be one member's page. Print the member itself, so its __str__ is used."))
    check(got[:len(pages)] == pages, say("the roll is in the wrong order: the member with the most years on the road comes first, then the next most, and so on down."))
    last = got[len(pages)]
    check(str(vets) in last and "veteran" in last.lower(), say("the last line should say how many veterans there are (with the word veteran). Yours says " + repr(last) + "."))
    check(len(got) == len(pages) + 1, say("nothing more should be printed after the veterans line."))
check(any(isinstance(v, list) and v and all(isinstance(x, Member) for x in v) for v in ns.values()), "Keep all the new members together in one list: start with an empty list and add each new Member to it.")
judge(lines, SHEET, "")
_, l2 = again(SHEET, SHEET2, "the sign-up sheet")
judge(l2, SHEET2, "With another sign-up sheet, ")`,
      hints: [
        "Three jobs, in order: make the list, print it in the right order, count. For the order, ask: what does sorting need to know about each member to put them in line?",
        "Unpacking works in a loop: `for flavour, spoons in orders:`. `sorted()` takes a `key=` function that says what to compare: `def honey_of(jar): return jar.honey`, then `sorted(jars, key=honey_of, reverse=True)`.",
        "`for name, role, years in signups:` add `Member(name, role, years)` to your list. Then a small `def years_of(m): return ...`, a loop over `sorted(roster, key=years_of, reverse=True)` printing each member, and a counter for when `m.rank()` is a veteran.",
      ],
      solution: SOL8,
      wrong: [
        swap(SOL8, ["for member in sorted(roster, key=years_of, reverse=True):\n    print(member)", "print(sorted(roster, key=years_of, reverse=True))"]),
        swap(SOL8, ["key=years_of, reverse=True", "key=years_of"]),
        swap(SOL8, ['print(f"Veterans on the roll: {veterans}")', 'print("Veterans on the roll: 4")']),
        swap(SOL8, ["    print(member)\n", "    print(member.name)\n"]),
        swap(SOL8, ["for member in sorted(roster, key=years_of, reverse=True):\n    print(member)", "for member in roster:\n    print(member)"]),
        swap(SOL8, ['if member.rank() == "veteran":', "if member.years > 20:"]),
      ],
      done: "Rook: Every name on the roll, oldest boots first. Odo's been on the road forty years, apparently. Mostly the road to the library. Still counts. Roof's on: shingles, moss, and a serpent on every gable.",
    },
    {
      id: "g09-sparring-partners",
      part: "Entrance porch",
      title: "Sparring Partners",
      topic: "objects working together",
      cost: { wood: 7, stone: 3 },
      intro: [
        "Rook: Sparring ring's next. Rule four: never put a level one in with a level eight. Nobody learns a thing from a flattened recruit.",
        "A method can take **another object** as a parameter: `def share(self, other):`. Inside, `self` is the object the method was called on and `other` is the one handed in, and you can read or change either.",
        "In `a.share(b)`, `self` is `a` and `other` is `b`.",
      ],
      codex: ["objects-together", "methods"],
      quiz: {
        code: r`class Pot:
    def __init__(self, soup):
        self.soup = soup

    def pour_into(self, other, ladles):
        self.soup -= ladles
        other.soup += ladles

big = Pot(10)
small = Pot(2)
big.pour_into(small, 3)
print(big.soup, small.soup)`,
        question: "What does this program show?",
        options: ["7 5", "5 7", "10 2", "7 2"],
        answer: 0,
        why: "big.pour_into(small, 3) runs with self = big and other = small: big loses 3 ladles and small gains them.",
      },
      task: [
        "A method `can_spar(other)` answers yes or no: two members are a fair match when their levels are no more than 2 apart. Nobody can spar with themselves.",
        "A method `mentor(other)`: when the mentor's level is higher, the other member drills for 2 hours for every level between them, and the method hands back how many hours that was. A mentor who isn't higher teaches nothing: nothing changes, and the answer is 0.",
        "Try both on the members in the starter (who's a fair match for Wren? what happens when Rook mentors Vane?) and print what they say.",
      ],
      starter: LEDGER7 + r`
    # can_spar(other): a fair match?

    # mentor(other): a lesson, in hours of drill
` + MAIN9 + r`# Fair matches for Wren, and Rook mentoring Vane
`,
      tests: PRE + r`Member = need_class("Member")
need_method(Member, "can_spar", 1, "the other member")
need_method(Member, "mentor", 1, "the other member")
def at(n, lv):
    x = make(Member, n, "guard", 6)
    x.level = lv
    x.xp = 0
    return x
a, b, c, d = at("Corwin", 3), at("Bea", 5), at("Dov", 6), at("Ena", 3)
got = ask(a, "can_spar", b)
check(isinstance(got, bool), "can_spar should hand back True or False, but it gave " + repr(got) + ".")
check(got is True, "Levels 3 and 5 are 2 apart, which is still a fair match, but can_spar said False.")
check(ask(b, "can_spar", a) is True, "Levels 5 and 3 are a fair match too: the same pair, asked the other way round.")
check(ask(a, "can_spar", c) is False, "Levels 3 and 6 are 3 apart, so not a fair match, but can_spar said True.")
check(ask(at("Fen", 1), "can_spar", at("Gil", 8)) is False, "A level 1 and a level 8 are no fair match, whichever of them asks. Work out how far apart they are in a way that doesn't care about the order.")
check(ask(a, "can_spar", d) is True, "Two different members on the same level are a fair match, but can_spar said False.")
check(ask(a, "can_spar", a) is False, "A member can't spar with themselves, but can_spar said True when asked about the very same member.")
m, s = at("Hal", 5), at("Ivo", 2)
h = ask(m, "mentor", s)
check((m.level, m.xp) == (5, 0), "The mentor's own page changed! The one who learns is the other member, not self.")
check(h == 6, "Levels 5 and 2 are 3 apart, so the lesson is 2 hours for each, but mentor handed back " + repr(h) + ".")
check(s.level != 5, "mentor simply gave the student the mentor's level. The student should drill instead (their own train method) and earn their levels the honest way.")
check((s.level, s.xp) == (3, 10), "After that lesson the student should have drilled those hours with their own train method, but their page says level " + str(s.level) + " with " + str(s.xp) + " experience.")
p, q = at("Jo", 4), at("Kit", 4)
got = ask(p, "mentor", q)
check(got == 0 and (q.level, q.xp) == (4, 0), "A mentor who isn't higher than the other member teaches nothing: hand back 0 and change nothing. Two level 4s gave " + repr(got) + ".")
lo, hi = at("Lu", 2), at("Mo", 6)
got = ask(lo, "mentor", hi)
check(got == 0 and (hi.level, hi.xp) == (6, 0) and (lo.level, lo.xp) == (2, 0), "When a level 2 tries to mentor a level 6, nothing should change and the answer is 0, but mentor handed back " + repr(got) + ".")
check(out.strip(), "Try both methods on the starter's members and print what they say.")`,
      hints: [
        "Picture two members facing each other in the ring. Inside the method, which one is `self` and which is `other`? Then find a way to say 'how far apart' that doesn't care who asked.",
        "`abs()` gives the distance between two numbers either way round: `abs(3 - 8)` is 5. To ask whether two names are the very same object, Python has `is`: `if other is self:`. A method can call the other object's methods too: `other.fill(2)`.",
        "`can_spar`: first `if other is self: return False`, then return whether `abs(...)` is at most 2. `mentor`: if `self.level <= other.level` return 0; otherwise work out the hours, call `other.train(hours)` and return ...",
      ],
      solution: SOL9,
      wrong: [
        swap(SOL9, ["        if other is self:\n            return False\n", ""]),
        swap(SOL9, ["abs(self.level - other.level) <= 2", "abs(self.level - other.level) < 2"]),
        swap(SOL9, ["abs(self.level - other.level) <= 2", "self.level - other.level <= 2"]),
        swap(SOL9, ["other.train(hours)", "self.train(hours)"]),
        swap(SOL9, ["other.train(hours)", "other.level = self.level"]),
        swap(SOL9, ["        if self.level <= other.level:\n            return 0\n", ""]),
        swap(SOL9, ["return abs(self.level - other.level) <= 2", "print(abs(self.level - other.level) <= 2)"]),
      ],
      done: "Rook: Porch is up and the pairs are sorted. Wren and Bram in the ring, and Vane's been mentored. He's very proud. He's drafted himself a certificate.",
    },
    {
      id: "g10-the-guild-crest",
      part: "Rune door and crest",
      title: "The Guild Crest",
      topic: "class attributes",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Rook: Door's carved. Crest goes over the porch: a sword with a serpent coiled round it, on a blue shield. One crest, recruit. Not one per member. It belongs to the guild.",
        "Vane: I... have seen that crest before. In the margins of the Company's oldest ledgers. Drawn small, in my grandfather's hand.",
        "A **class attribute** is written in the class itself, outside any method. There's only one, shared by every object: `Bee.hive` and `buzz.hive` both read it.",
        "Change it through the class (`Bee.made += 1`), not through `self`: `self.made += 1` quietly makes a new value on that one object instead!",
      ],
      codex: ["class-attributes", "init"],
      quiz: {
        code: r`class Bee:
    hive = "Willow Hive"

    def __init__(self, name):
        self.name = name

a = Bee("Buzz")
b = Bee("Hum")
Bee.hive = "Oak Hive"
print(a.hive, b.hive)`,
        question: "What does this program show?",
        options: ["Oak Hive Oak Hive", "Willow Hive Willow Hive", "Willow Hive Oak Hive", "AttributeError"],
        answer: 0,
        why: "Neither bee has a hive of its own, so both read the one on the class. Changing Bee.hive changes it for every bee at once.",
      },
      task: [
        "The guild's motto belongs to the whole guild: keep it once, as a class attribute called `motto` on `Member`. Rook leaves the words up to you.",
        "The class also keeps `count`: how many members have ever been made, starting from none.",
        "Every new member gets a `badge` number as they're made: the very first member is badge 1, the next badge 2, and so on.",
        "Print each starter member's badge, and the motto.",
      ],
      starter: LEDGER7.replace("class Member:\n", "class Member:\n    # the motto, and the count of members made\n\n").replace("        self.kit = kit\n", "        self.kit = kit\n        # count this member, and hand out their badge\n") + MAIN10 + r`
# Everyone's badge, and the motto
`,
      tests: PRE + r`Member = need_class("Member")
pages = found(Member)
if "motto" not in Member.__dict__:
    check(not any("motto" in vars(x) for x in pages), "Each page has its own copy of the motto (self.motto in __init__). It belongs to the whole guild: write it once in the class itself, under the class line and outside any def.")
    check(False, "Give the class a motto: a class attribute called motto, written under class Member: and outside any def.")
mo = Member.motto
check(isinstance(mo, str) and mo.strip() != "", "The motto should be some words (a string), but it is " + repr(mo) + ".")
check("count" in Member.__dict__, "Give the class a count of the members made: a class attribute called count, starting from none.")
c0 = Member.count
check(isinstance(c0, int), "count should be a whole number, but it is " + repr(c0) + ".")
x1, x2, x3 = make(Member, "Corwin"), make(Member, "Bea"), make(Member, "Dov")
check("motto" not in vars(x1), "Every new page gets a copy of the motto of its own. Leave it on the class only.")
check(not ("count" in vars(x1) and Member.count == c0), "self.count += 1 makes a new count on that one member and leaves the class's count alone, so every badge comes out the same. Change the count on the class itself.")
check(Member.count == c0 + 3, "After three more members are made, the class's count should have gone up by three, but it went from " + str(c0) + " to " + str(Member.count) + ".")
b1, b2, b3 = attr(x1, "badge"), attr(x2, "badge"), attr(x3, "badge")
check(b2 == b1 + 1 and b3 == b2 + 1, "Badges should go up by one with each new member, but three new members got " + repr(b1) + ", " + repr(b2) + " and " + repr(b3) + ".")
check(b3 == Member.count, "The newest member's badge should be the count including them, but they got badge " + str(b3) + " while the count is " + str(Member.count) + ". Count them first, then hand out the number.")
badges = sorted(getattr(x, "badge", 0) for x in pages)
check(pages and badges[0] == 1, "The very first member ever made should wear badge 1, but the first one in your program got badge " + repr(badges[0] if badges else None) + ". Does count start from none?")
old = Member.motto
Member.motto = "Tea first."
try:
    shared = x1.motto == "Tea first." and x2.motto == "Tea first."
finally:
    Member.motto = old
check(shared, "Changing the motto on the class should change it for every member at once.")
check(any(mo in l for l in lines), "Print the guild's motto.")
for x in pages:
    check(any(str(x.badge) in l and x.name in l for l in lines), "Print each starter member's badge: " + x.name + "'s is missing.")`,
      hints: [
        "What belongs to the whole guild, and what belongs to one page? Where in the class would something live so there's only ever one of it? And who should hand a new member their number: the member, or the guild?",
        "On a hive: `class Bee:` then `hive = \"Willow Hive\"` and `made = 0`, indented in the class but outside any def. Inside `__init__`, `Bee.made += 1` changes the shared one, and `self.number = Bee.made` copies its value onto this bee.",
        "Under `class Member:` put `motto = \"...\"` and `count = 0`. At the end of `__init__`: `Member.count += 1`, then `self.badge = ...`.",
      ],
      solution: SOL10,
      wrong: [
        swap(SOL10, ["Member.count += 1\n        self.badge = Member.count", "self.count += 1\n        self.badge = self.count"]),
        swap(SOL10, ['    motto = "Pack socks. Know where the door is."\n', ""], ["        self.badge = Member.count", '        self.badge = Member.count\n        self.motto = "Pack socks. Know where the door is."'], ['print("Motto:", Member.motto)', 'print("Motto:", vane.motto)']),
        swap(SOL10, ["        Member.count += 1\n        self.badge = Member.count", "        self.badge = Member.count\n        Member.count += 1"]),
        swap(SOL10, ["count = 0", "count = 1"]),
        swap(SOL10, ['print("Motto:", Member.motto)', 'print("Motto: nothing yet")']),
        swap(SOL10, ['print(f"Badge {member.badge}: {member.name}")', 'print(f"Badge: {member.name}")']),
      ],
      done: "Rook: Crest's up, door's hung, badges handed out. Vane's number five. He asked if he could be number one. I said Rook's number one. Not retired. Senior.",
    },
    {
      id: "g11-scouts",
      part: "Windows and shutters",
      title: "Scouts",
      topic: "inheritance",
      cost: { wood: 7, stone: 3 },
      intro: [
        "Rook: Fog on the hill road's thick as porridge. We need scouts: members who go ahead and see. Same page as anyone else, plus one thing more.",
        "A class can be built on another: `class Puppy(Dog):` makes every `Puppy` a `Dog`, with everything a dog has, before you write a single line. That's **inheritance**.",
        "Only write what's new. The parent's `__init__` and methods come along for free.",
      ],
      codex: ["inheritance", "classes"],
      quiz: {
        code: r`class Lamp:
    def __init__(self, oil):
        self.oil = oil

    def hours(self):
        return self.oil * 2

class Lantern(Lamp):
    def swing(self):
        return "swinging"

x = Lantern(4)
print(x.hours(), x.swing())`,
        question: "What does this program show?",
        options: ["8 swinging", "AttributeError", "4 swinging", "TypeError"],
        answer: 0,
        why: "Lantern has no __init__ or hours of its own, so it uses Lamp's: oil is 4 and hours() gives 8. swing is the lantern's own extra.",
      },
      task: [
        "Make a class `Scout` that is a kind of `Member`: made exactly the same way, with everything a member has.",
        "Scouts have one extra skill. `sight(fog)` hands back how many metres a scout can see when the Hush is `fog` thick: 40 metres, plus 10 for each of the scout's levels, minus 15 for each step of fog. No fog is thick enough to make anyone see less than nothing.",
        "Ordinary members don't get `sight`; only scouts do.",
        "Tock signs up as a scout, with 7 years on the road and a spyglass of his own making. Make his page, drill him for 10 hours, and print how far he can see in fog 3 and in fog 6.",
      ],
      starter: LEDGER + r`

# The Scout class
` + MAIN11 + r`
# Tock's page, a 10-hour drill, and his sight in fog 3 and fog 6
`,
      tests: PRE + r`Member = need_class("Member")
Scout = need_class("Scout", "Member")
copied = [k for k, v in Scout.__dict__.items() if callable(v) and k in Member.__dict__]
check(not copied, "Scout already gets " + ", ".join(copied) + " from Member, so there's no need to write it again. A subclass only holds what's new.")
need_method(Scout, "sight", 1, "the fog")
s = make(Scout, "Corwin", "scout", 4)
check(attr(s, "level") == 1 and attr(s, "role") == "scout" and hasattr(s, "badge"), "A scout should be made just like a member, with everything a member has.")
check(not hasattr(make(Member, "Bea"), "sight"), "Plain members have sight too. It's a scout's skill only: write it in Scout, not in Member.")
for lv, fog, want in [(1, 0, 50), (1, 2, 20), (3, 2, 40), (2, 4, 0), (1, 4, 0), (1, 9, 0)]:
    s.level = lv
    got = ask(s, "sight", fog)
    check(not (want == 0 and isinstance(got, (int, float)) and got < 0), "A level " + str(lv) + " scout in fog " + str(fog) + " would see " + str(got) + " metres. Nobody sees less than nothing: the answer should never go below zero.")
    check(got == want, "For a level " + str(lv) + " scout in fog " + str(fog) + ", sight handed back " + repr(got) + ". Check the sum: 40, plus 10 per level, minus 15 per step of fog.")
tock = named(Scout, "Tock")
check(tock is not None or named(Member, "Tock") is None, "Tock is on the roll as a plain Member. Make his page with Scout(...) instead.")
check(tock is not None, "Sign Tock up as a Scout.")
check(tock.role == "scout" and tock.years == 7, "Tock's page should say scout, 7 years on the road, but it says " + repr(tock.role) + ", " + repr(tock.years) + ".")
check(tock.level == 3, "Drill Tock for 10 hours before checking his sight.")
for fog in [3, 6]:
    check(any(str(tock.sight(fog)) in l for l in lines), "Print how far Tock can see in fog " + str(fog) + ".")`,
      hints: [
        "What's different about a scout? Only the one skill. Everything else a scout already is, by being a member. So how little does the Scout class need to contain?",
        "`class Puppy(Dog):` and then only the new methods, indented as usual. For 'never below zero', `max(0, x)` gives x, unless x is negative.",
        "`class Scout(Member):` with one method, `def sight(self, fog):`, that works out `40 + 10 * self.level - ...` and returns `max(0, ...)`.",
      ],
      solution: SOL11,
      wrong: [
        swap(SOL11, ["class Scout(Member):", "class Scout:"], ['tock = Scout("Tock", "scout", 7)\ntock.train(10)', 'tock = Scout()\ntock.level = 3']),
        swap(SOL11, ["class Scout(Member):\n    def sight(self, fog):\n        return max(0, 40 + 10 * self.level - 15 * fog)", "class Scout(Member):\n    role = \"scout\""], ["        self.badge = Member.count\n", "        self.badge = Member.count\n\n    def sight(self, fog):\n        return max(0, 40 + 10 * self.level - 15 * fog)\n"]),
        swap(SOL11, ["return max(0, 40 + 10 * self.level - 15 * fog)", "return 40 + 10 * self.level - 15 * fog"]),
        swap(SOL11, ["class Scout(Member):\n", "class Scout(Member):\n    def __init__(self, name, role, years):\n        self.name = name\n        self.role = role\n        self.years = years\n        self.level = 1\n        self.xp = 0\n        self.kit = []\n        Member.count += 1\n        self.badge = Member.count\n\n"]),
        swap(SOL11, ["return max(0, 40 + 10 * self.level - 15 * fog)", "print(max(0, 40 + 10 * self.level - 15 * fog))"], ['print("In fog 3, Tock sees", tock.sight(3), "metres.")\nprint("In fog 6, Tock sees", tock.sight(6), "metres.")', "tock.sight(3)\ntock.sight(6)"]),
        swap(SOL11, ['tock = Scout("Tock", "scout", 7)', 'tock = Member("Tock", "scout", 7)'], ['print("In fog 3, Tock sees", tock.sight(3), "metres.")\nprint("In fog 6, Tock sees", tock.sight(6), "metres.")', 'print("Tock sees 25 and 0 metres.")']),
        swap(SOL11, ["40 + 10 * self.level - 15 * fog", "40 + 10 - 15 * fog"]),
      ],
      done: "Rook: Windows in, shutters painted blue, and a scout on the roll. Tock's added a second spyglass to his hat. The first one wasn't broken. He's fixing it anyway.",
    },
    {
      id: "g12-the-healers-bag",
      part: "Chimney and woodpile",
      title: "The Healer's Bag",
      topic: "super().__init__",
      cost: { wood: 5, stone: 6 },
      intro: [
        "Mirela comes up from the apothecary with a bag that smells of mint and woodsmoke. Rook signs her up on the spot: no expedition goes anywhere without a healer.",
        "Rook: A healer's page needs one box more. Herbs. And we know her role already, so don't make her write it.",
        "When a subclass writes its own `__init__`, that *replaces* the parent's. To still get everything the parent sets up, call it from inside: `super().__init__(...)`. `super()` means \"my parent class\", and it passes `self` along for you.",
      ],
      codex: ["super", "inheritance"],
      quiz: {
        code: r`class Cake:
    def __init__(self, flavour):
        self.flavour = flavour
        self.slices = 8

class Pie(Cake):
    def __init__(self, flavour, crust):
        super().__init__(flavour)
        self.crust = crust

p = Pie("apple", "flaky")
print(p.slices, p.crust)`,
        question: "What does this program show?",
        options: ["8 flaky", "AttributeError", "None flaky", "TypeError"],
        answer: 0,
        why: "Pie's __init__ calls Cake's first with super(), which sets flavour and slices, and then adds the crust. Without that super() line, p.slices would be an AttributeError.",
      },
      task: [
        "Make a class `Healer`, a kind of `Member`. A healer is made with a name, their years on the road and how many herbs they carry, in that order. Their role is always `healer`, so nobody passes it in.",
        "A healer must still get everything a member gets when made: level, experience, kit, badge and all.",
        "A method `tonics()` hands back how many tonics the healer can brew: each one takes 3 herbs.",
        "Sign Mirela up: 12 years on the road and 20 herbs. Print her page and how many tonics she can brew.",
      ],
      starter: LEDGER + SCOUT + r`

# The Healer class
` + MAIN12 + r`
# Mirela's page, and her tonics
`,
      tests: PRE + r`Member = need_class("Member")
Healer = need_class("Healer", "Member")
check("__init__" in Healer.__dict__, "A healer is made with different values from a member (name, years, herbs), so Healer needs an __init__ of its own.")
need_method(Healer, "__init__", 3, "a name, the years on the road and the herbs (the role is always healer)")
c0 = Member.count
h = make(Healer, "Juniper", 5, 7)
check(getattr(h, "name", None) is not h, "super().__init__ hands self over by itself, so leave self out of its brackets. As it is, the healer's name became the healer.")
missing = [a for a in ["level", "xp", "kit", "badge"] if not hasattr(h, a)]
check(not missing, "Your healer has no " + ", ".join(missing) + ". Healer's own __init__ replaced Member's, so Member's never ran. Call it from inside Healer's, with super().")
check(attr(h, "name") == "Juniper" and attr(h, "role") == "healer" and attr(h, "years") == 5, "Healer('Juniper', 5, 7) should make a healer named Juniper with 5 years on the road, but the page says name " + repr(h.name) + ", role " + repr(h.role) + ", years " + repr(h.years) + ".")
check(attr(h, "herbs") == 7, "Healer('Juniper', 5, 7) should carry 7 herbs, but the page says " + repr(h.herbs) + ".")
check(h.level == 1 and h.xp == 0 and h.kit == [], "A new healer should start like any member: level 1, no experience, an empty kit.")
check(Member.count == c0 + 1 and h.badge == Member.count, "Making a healer should count as a new member and hand out the next badge, like any member.")
check("super()" in src, "Healer gets Member's setup by calling it, but use super() for that: it always means 'my parent class'.")
need_method(Healer, "tonics", 0, "nothing")
for herbs, word in [(7, "7"), (9, "9"), (2, "2"), (20, "20")]:
    h.herbs = herbs
    got = ask(h, "tonics")
    check(isinstance(got, int) and got == herbs // 3, "For " + word + " herbs, tonics handed back " + repr(got) + ". Each tonic takes 3 herbs, and half a tonic isn't a tonic.")
mirela = named(Healer, "Mirela")
check(mirela is not None or named(Member, "Mirela") is None, "Mirela is on the roll as a plain Member. Make her page with Healer(...) instead.")
check(mirela is not None, "Sign Mirela up as a Healer.")
check(mirela.years == 12 and mirela.herbs == 20, "Mirela has 12 years on the road and 20 herbs, but her page says " + repr(mirela.years) + " years and " + repr(mirela.herbs) + " herbs.")
check(page_of(mirela) in lines, "Print Mirela's page.")
check(any(str(mirela.tonics()) in l for l in lines if l != page_of(mirela)), "Print how many tonics Mirela can brew.")`,
      hints: [
        "When a healer is made, two things must happen: everything that happens for any member, and one thing more. Who already knows how to do the 'any member' part? Can Healer ask them to do it?",
        "`super().__init__(flavour)` runs the parent's `__init__` on this very object, with the values you hand it (not self: super() hands that over). After it, add the extra: `self.crust = crust`.",
        "`class Healer(Member):` / `def __init__(self, name, years, herbs):` / `super().__init__(name, \"healer\", ...)` / `self.herbs = herbs`. Then `tonics` returns the herbs split into whole ...",
      ],
      solution: SOL12,
      wrong: [
        swap(SOL12, ['        super().__init__(name, "healer", years)\n', '        self.name = name\n        self.role = "healer"\n        self.years = years\n']),
        swap(SOL12, ['super().__init__(name, "healer", years)', 'super().__init__(self, name, "healer", years)']),
        swap(SOL12, ["def __init__(self, name, years, herbs):", "def __init__(self, name, role, years, herbs):"], ['super().__init__(name, "healer", years)', "super().__init__(name, role, years)"], ['Healer("Mirela", 12, 20)', 'Healer("Mirela", "healer", 12, 20)']),
        swap(SOL12, ['super().__init__(name, "healer", years)', 'Member.__init__(self, name, "healer", years)']),
        swap(SOL12, ["return self.herbs // 3", "return self.herbs / 3"]),
        swap(SOL12, ["        self.herbs = herbs\n", ""], ["return self.herbs // 3", "return 20 // 3"]),
        swap(SOL12, ['print("Tonics Mirela can brew:", mirela.tonics())', 'print("Tonics Mirela can brew: lots")']),
      ],
      done: "Mirela: Twenty herbs, six tonics, and one very smoky chimney. Rook, your woodpile says you stack it badly. Rook: Woodpile's lying. Seen worse.",
    },
    {
      id: "g13-every-banner-its-own",
      part: "Banners and lanterns",
      title: "Every Banner Its Own",
      topic: "overriding methods",
      cost: { wood: 6, stone: 4 },
      intro: [
        "Rook: Banners up for the march. And every role packs differently. Scouts go light. Healers lug that bag. One rule for everybody won't do.",
        "A subclass can **override** a method: write a method with the same name, and that version is used for its objects instead of the parent's.",
        "An override can still ask the parent for its answer and adjust it: inside an override, `super().price()` gives the parent's version.",
      ],
      codex: ["overriding", "super"],
      quiz: {
        code: r`class Bird:
    def song(self):
        return "tweet"

class Owl(Bird):
    def song(self):
        return super().song() + "-hoo"

class Crow(Bird):
    def song(self):
        return "caw"

print(Owl().song(), Crow().song(), Bird().song())`,
        question: "What does this program show?",
        options: ["tweet-hoo caw tweet", "tweet tweet tweet", "-hoo caw tweet", "tweet-hoo caw caw"],
        answer: 0,
        why: "Each bird uses its own class's song. The owl's starts from the parent's \"tweet\" and adds to it; the crow's replaces it completely; a plain bird is untouched.",
      },
      task: [
        "Scouts travel light: a scout can carry 4 kilos less than an ordinary member of the same level.",
        "A healer's herbs count against their pack: every full 5 herbs weighs a kilo.",
        "A healer's page shows everything a member's page shows, then a comma and how many herbs they carry. A healer called Tansy at level 2 with 7 years on the road and 9 herbs prints as `Guard Tansy the healer (level 2), 9 herbs`.",
        "Rook will change the member rules one day, so scouts and healers should start from whatever a member's version says, not from a copy of it.",
        "Print every starter member's page with how many kilos they can carry.",
      ],
      starter: LEDGER + SCOUT + r`    # scouts carry 4 kilos less
` + HEALER + r`    # herbs weigh on the pack, and show on the page
` + MAIN13 + r`
# Everyone's page, and what they can carry
`,
      tests: PRE + r`Member = need_class("Member")
Scout = need_class("Scout", "Member")
Healer = need_class("Healer", "Member")
check("pack_limit" in Scout.__dict__, "Scouts still carry by the member's rule. Give Scout a pack_limit of its own to override it.")
check("pack_limit" in Healer.__dict__, "Healers still carry by the member's rule. Give Healer a pack_limit of its own to override it.")
check("__str__" in Healer.__dict__, "Healers still print a plain member's page. Give Healer a __str__ of its own to override it.")
need_method(Scout, "pack_limit", 0, "nothing")
need_method(Healer, "pack_limit", 0, "nothing")
need_method(Healer, "__str__", 0, "nothing")
plain = make(Member, "Bea")
check(ask(plain, "pack_limit") == 12, "An ordinary level 1 member should still carry 12 kilos: only scouts and healers change.")
s = make(Scout, "Corwin", "scout", 4)
for lv in [1, 3]:
    s.level = lv
    got = ask(s, "pack_limit")
    check(got == 12 + 3 * (lv - 1) - 4, "A level " + str(lv) + " scout should carry 4 kilos less than a level " + str(lv) + " member, but pack_limit handed back " + repr(got) + ".")
h = make(Healer, "Tansy", 7, 9)
for lv, herbs in [(1, 4), (1, 5), (1, 23), (2, 10)]:
    h.level = lv
    h.herbs = herbs
    got = ask(h, "pack_limit")
    check(isinstance(got, int), "For a healer with " + str(herbs) + " herbs, pack_limit handed back " + repr(got) + ". Only full fives of herbs weigh a kilo.")
    check(got == 12 + 3 * (lv - 1) - herbs // 5, "For a level " + str(lv) + " healer with " + str(herbs) + " herbs, pack_limit handed back " + repr(got) + ". Start from what a member of that level carries, and take a kilo away for each full five herbs.")
real_limit = Member.__dict__["pack_limit"]
def _rule(self):
    return 100
Member.pack_limit = _rule
try:
    s.level = 1
    h.herbs = 10
    sv = ask(s, "pack_limit")
    hv = ask(h, "pack_limit")
finally:
    Member.pack_limit = real_limit
check(sv == 96, "Imagine Rook changes what a member can carry: your scouts wouldn't change with it, because Scout repeats the member's sum instead of asking the parent. Start from the parent's answer with super().")
check(hv == 98, "Imagine Rook changes what a member can carry: your healers wouldn't change with it, because Healer repeats the member's sum instead of asking the parent. Start from the parent's answer with super().")
h.level = 2
h.herbs = 9
page = page_of(h)
check(page == "Guard Tansy the healer (level 2), 9 herbs", "For the task's example (Tansy, a level 2 healer with 7 years on the road and 9 herbs) the page reads " + repr(page) + ". Compare it with the example: the member's page, a comma, then the herbs.")
real_str = Member.__dict__["__str__"]
def _page(self):
    return "PAGE"
Member.__str__ = _page
try:
    rebuilt = page_of(h)
finally:
    Member.__str__ = real_str
check(rebuilt == "PAGE, 9 herbs", "Healer's page rebuilds the member's page by hand, so if Rook ever changes how a page looks, healers won't follow. Start from the parent's page with super().__str__().")
for x in found(Member):
    p = page_of(x)
    check(any(p in l and str(ask(x, "pack_limit")) in l.replace(p, "") for l in lines), "Print each starter member's page with how many kilos they can carry: " + x.name + "'s line is missing.")`,
      hints: [
        "For each role, ask: what would an ordinary member of the same level carry, and what changes from there? The ordinary member's answer already exists. Can the override ask for it?",
        "`super().price()` inside an override runs the parent's version and hands back its answer, so `return super().price() + 2` builds on it. The same works for pages: `super().__str__()` is the parent's page text.",
        "In each override, `return super().pack_limit() - ...` (what does each role take away?), and for the healer's page `return super().__str__() + f\"...\"` with the comma and the herbs.",
      ],
      solution: SOL13,
      wrong: [
        swap(SOL13, ["return super().pack_limit() - 4", "return 12 + 3 * (self.level - 1) - 4"]),
        swap(SOL13, ['return super().__str__() + f", {self.herbs} herbs"', 'return f"{self.rank().title()} {self.name} the {self.role} (level {self.level}), {self.herbs} herbs"']),
        swap(SOL13, ["return super().pack_limit() - self.herbs // 5", "return super().pack_limit() - self.herbs / 5"]),
        swap(SOL13, ['return super().__str__() + f", {self.herbs} herbs"', 'return f", {self.herbs} herbs"']),
        swap(SOL13, ["return super().pack_limit() - 4", "super().pack_limit() - 4"]),
        swap(SOL13, ["return 12 + 3 * (self.level - 1)", "return 12 + 3 * (self.level - 1) - 4"], ["    def pack_limit(self):\n        return super().pack_limit() - 4\n", ""]),
        swap(SOL13, ['return super().__str__() + f", {self.herbs} herbs"', 'return super().__str__() + f" {self.herbs} herbs"']),
      ],
      done: "Rook: Banners flying, lanterns lit, and every pack weighed fair. Mirela's carrying her herbs and then some. Vane's carrying his umbrella. It's very small. We've agreed it counts.",
    },
    {
      id: "g14-whos-in-the-yard",
      part: "Training yard",
      title: "Who's in the Yard?",
      topic: "isinstance",
      cost: { wood: 6, stone: 5 },
      intro: [
        "Rook: Yard's full. Scouts, healers, a cook, a lord, and Sable, who swears they know every back road from here to the Lantern Road fairs. Signed up as a ranger.",
        "Rook: I need everybody sorted into groups before we march, and I need to know how many herbs we've got between us.",
        "`isinstance(thing, Kind)` asks: is this object a `Kind`? It says yes for subclasses too, because a `Puppy` *is* a `Dog`. So when you sort, ask about the most specific kind first.",
      ],
      codex: ["isinstance", "inheritance"],
      quiz: {
        code: r`class Dog:
    def __init__(self, name):
        self.name = name

class Puppy(Dog):
    def play(self):
        return "fetch"

p = Puppy("Biscuit")
print(isinstance(p, Dog), type(p) == Dog)`,
        question: "What does this program show?",
        options: ["True False", "False True", "True True", "False False"],
        answer: 0,
        why: "A Puppy is a kind of Dog, so isinstance says True. type() gives the exact class, Puppy, which isn't the same as Dog.",
      },
      task: [
        "The starter has a `Ranger` class: a kind of scout who knows the shortcuts. Rangers are scouts too.",
        "Write a function `groups(people)` that takes a list of guild members and hands back a dictionary with three lists of names: `\"scouts\"` (rangers included), `\"healers\"` and `\"others\"`. Names stay in the order they come in the list.",
        "Write a function `herbs_in(people)` that hands back how many herbs a list of members carries between them. Only healers carry herbs; nobody else even has the attribute.",
        "Try both on the yard in the starter and print what they hand back.",
      ],
      starter: LEDGER + SCOUT_OVER + HEALER_OVER + RANGER + MAIN14 + r`
# groups(people): scouts, healers and others, by name

# herbs_in(people): every herb in the list

# Try both on the yard
`,
      tests: PRE + r`Member = need_class("Member")
Scout = need_class("Scout", "Member")
Healer = need_class("Healer", "Member")
Ranger = need_class("Ranger", "Scout")
def yard():
    return [make(Member, "Ada", "cook", 3), make(Scout, "Ben", "scout", 4), make(Healer, "Cas", 3, 9), make(Ranger, "Dee", "ranger", 12), make(Member, "Eli"), make(Healer, "Fay", 1, 4)]
res = run_fn("groups", "groups() on a yard of Ada (member), Ben (scout), Cas (healer), Dee (ranger), Eli (member) and Fay (healer)", yard())
check(isinstance(res, dict), "groups should hand back a dictionary, but it gave " + type(res).__name__ + ".")
for k in ["scouts", "healers", "others"]:
    check(k in res, "The dictionary from groups needs the key " + repr(k) + ". It has: " + ", ".join(repr(x) for x in res) + ".")
check(all(isinstance(n, str) for k in ["scouts", "healers", "others"] for n in res[k]), "groups should list the members' names, not the member objects themselves.")
check(res["others"] != ["Ada", "Ben", "Cas", "Dee", "Eli", "Fay"], "Everyone landed in others. A scout is a member too, and so is a healer, so asking about Member first catches everybody. Ask about the more specific kinds first.")
check("Dee" in res["scouts"], "Dee is a ranger, and a ranger is a kind of scout, so Dee belongs with the scouts. type() only matches the exact class; isinstance also says yes for kinds of it.")
check(res["scouts"] == ["Ben", "Dee"], "For that yard the scouts should be Ben and Dee, in that order, but groups gave " + repr(res["scouts"]) + ".")
check(res["healers"] == ["Cas", "Fay"], "For that yard the healers should be Cas and Fay, in that order, but groups gave " + repr(res["healers"]) + ".")
check(res["others"] == ["Ada", "Eli"], "For that yard the others should be Ada and Eli, in that order, but groups gave " + repr(res["others"]) + ".")
empty = run_fn("groups", "groups([])", [])
check(empty == {"scouts": [], "healers": [], "others": []}, "For an empty yard, groups should still hand back all three keys, each with an empty list, but it gave " + repr(empty) + ".")
t = run_fn("herbs_in", "herbs_in() on that yard", yard())
check(t == 13, "In that yard Cas carries 9 herbs and Fay carries 4, but herbs_in handed back " + repr(t) + ".")
check(run_fn("herbs_in", "herbs_in([])", []) == 0, "An empty yard carries 0 herbs.")
check(run_fn("herbs_in", "herbs_in() on a yard with no healers", [make(Member, "Gus"), make(Scout, "Hob", "scout", 2)]) == 0, "A yard with no healers carries 0 herbs.")
check("isinstance" in src, "Use isinstance to tell the kinds apart.")
check(any("Sable" in l for l in lines) and any("20" in l for l in lines), "Try both functions on the starter's yard and print what they hand back.")`,
      hints: [
        "A ranger is a scout, and a scout is a member. If your first question is 'is this a member?', who says yes? Put your questions in the order that sends everyone to the right group.",
        "`isinstance(p, Puppy)` is True for puppies only; `isinstance(p, Dog)` for dogs *and* puppies. A dictionary of lists fills up with `result[\"pups\"].append(p.name)`. And checking an object's kind before reading one of its attributes keeps you from asking a cat for its bark.",
        "In groups: start with a dictionary of three empty lists, then `if isinstance(person, Scout):`, `elif isinstance(person, Healer):`, `else:`, adding `person.name` to the right list, and return the dictionary. In herbs_in: only add `person.herbs` when ...",
      ],
      solution: SOL14,
      wrong: [
        swap(SOL14, ["        if isinstance(person, Scout):\n            result[\"scouts\"].append(person.name)\n        elif isinstance(person, Healer):", "        if isinstance(person, Member):\n            result[\"others\"].append(person.name)\n        elif isinstance(person, Scout):\n            result[\"scouts\"].append(person.name)\n        elif isinstance(person, Healer):"]),
        swap(SOL14, ["if isinstance(person, Scout):", "if type(person) == Scout:"]),
        swap(SOL14, ["        if isinstance(person, Healer):\n            total += person.herbs", "        total += person.herbs"]),
        swap(SOL14, ['result["scouts"].append(person.name)', 'result["scouts"].append(person)']),
        swap(SOL14, ["    return result", "    print(result)"]),
        swap(SOL14, ['    result = {"scouts": [], "healers": [], "others": []}', '    result = {"scouts": [], "healers": []}']),
        swap(SOL14, ['print(groups(yard))\nprint("Herbs in the yard:", herbs_in(yard))', 'print("Herbs in the yard: 20")']),
      ],
      done: "Rook: Yard's sorted. Scouts left, healers right, everybody else in the middle trying to look useful. Sand's down and the ring's marked. Somebody fetch the dummies.",
    },
    {
      id: "g15-the-party",
      part: "Dummies, target and weapon rack",
      title: "The Party",
      topic: "composition",
      cost: { wood: 7, stone: 5 },
      intro: [
        "Rook: An expedition isn't a member. It's a party: a handful of members walking together, with rules of its own. How many fit. Whether anyone can patch a knee. How much it can carry.",
        "An object can hold other objects: a `Box` can keep a list of `Egg`s and add up their weight. That's called **composition**: a box *has* eggs; it isn't an egg.",
        "Its methods ask each member in turn: `egg.grams`, `egg.cracked()`.",
      ],
      codex: ["composition", "object-lists"],
      quiz: {
        code: r`class Egg:
    def __init__(self, grams):
        self.grams = grams

class Box:
    def __init__(self):
        self.eggs = []

    def add(self, egg):
        self.eggs.append(egg)

    def weight(self):
        total = 0
        for e in self.eggs:
            total += e.grams
        return total

b = Box()
b.add(Egg(50))
b.add(Egg(60))
print(len(b.eggs), b.weight())`,
        question: "What does this program show?",
        options: ["2 110", "2 2", "110 2", "0 0"],
        answer: 0,
        why: "The box holds a list of two eggs, and weight() asks each one for its grams: 50 + 60 = 110.",
      },
      task: [
        "Make a class `Party`. A party is made with a name and how many members fit in it at most (4, if nobody says). Every party starts with an empty list of `members` of its own.",
        "`add(member)` puts a member in the party and hands back `True`, unless the party is already full or that member is already in it: then nothing changes and it hands back `False`.",
        "`total_carry()` hands back how many kilos the whole party can carry, each member by their own rule.",
        "`has_healer()` answers whether anyone in the party is a healer.",
        "`leader()` hands back the member with the highest level (if two tie, whoever joined first), or `None` for an empty party.",
        "Make a party for the hill road, try adding the starter's members, and print what it can carry.",
      ],
      starter: LEDGER + SCOUT_OVER + HEALER_OVER + r`

# The Party class
` + MAIN15 + r`
# A party for the hill road
`,
      tests: PRE + r`Member = need_class("Member")
Scout = need_class("Scout", "Member")
Healer = need_class("Healer", "Member")
Party = need_class("Party")
need_method(Party, "__init__", 2, "a name and how many fit (with a default)")
check(Party.__dict__["__init__"].__defaults__, "A party made without saying its size should hold 4: give the size a default value.")
p = make(Party, "Test", 3)
q = make(Party, "Other")
check(attr(p, "members") is not attr(q, "members"), "Two parties share one list of members! A list written in the class itself (outside any def) is shared by every party. Make the list in __init__ (self.members = ...), so each party gets its own.")
check(attr(p, "name") == "Test", "Party('Test', 3) should keep its name, but the party's name is " + repr(p.name) + ".")
check(isinstance(attr(p, "members"), list) and p.members == [], "A new party should start with an empty list of members, but it has " + repr(p.members) + ".")
for meth in ["add", "total_carry", "has_healer", "leader"]:
    need_method(Party, meth, 1 if meth == "add" else 0, "the member" if meth == "add" else "nothing")
ms = [make(Member, n) for n in ["Ada", "Ben", "Cas", "Dee", "Eli"]]
got = ask(p, "add", ms[0])
check(got is True, "Adding a new member to an empty party should hand back True, but add gave " + repr(got) + ".")
check(len(p.members) == 1 and p.members[0] is ms[0], "After adding Ada, the party's members should be just Ada.")
check(q.members == [], "Adding Ada to one party put Ada in another party too! Each party needs a members list of its own, made in __init__ (self.members), not one list shared by the class.")
got = ask(p, "add", ms[0])
check(got is False, "Ada is already in the party, so adding Ada again should hand back False, but add gave " + repr(got) + ".")
check(len(p.members) == 1, "Adding someone who's already in the party shouldn't change it, but now it lists " + str(len(p.members)) + " members.")
ask(p, "add", ms[1])
ask(p, "add", ms[2])
got = ask(p, "add", ms[3])
check(got is False and len(p.members) == 3, "A party made for 3 is full once it has 3 members, so adding a fourth should hand back False and change nothing.")
for x in ms[:4]:
    check(ask(q, "add", x) is True, "A party made without a size should have room for 4.")
got = ask(q, "add", ms[4])
check(got is False and len(q.members) == 4, "A party made without a size holds 4 at most, so the fifth should be turned away.")
t = make(Party, "Carry", 5)
plain = make(Member, "Fen")
sc = make(Scout, "Gil", "scout", 3)
sc.level = 3
he = make(Healer, "Hal", 4, 10)
check(ask(make(Party, "Empty"), "total_carry") == 0, "An empty party carries 0 kilos.")
for x in [plain, sc, he]:
    ask(t, "add", x)
got = ask(t, "total_carry")
check(got == plain.pack_limit() + sc.pack_limit() + he.pack_limit(), "For a party of a level 1 member, a level 3 scout and a level 1 healer with 10 herbs, total_carry handed back " + repr(got) + ". Ask each member for their own pack_limit(), so scouts and healers count by their own rules.")
hp = make(Party, "Herbs")
got = ask(hp, "has_healer")
check(got is False, "An empty party has no healer, but has_healer gave " + repr(got) + ".")
ask(hp, "add", plain)
ask(hp, "add", sc)
check(ask(hp, "has_healer") is False, "A party of a member and a scout has no healer, but has_healer said it does.")
ask(hp, "add", he)
check(ask(hp, "has_healer") is True, "This party has a healer, just not first in line, but has_healer said False. Don't decide 'no' until you've looked at everyone.")
lp = make(Party, "Lead", 5)
ws = [make(Member, n) for n in ["Ivo", "Jo", "Kit", "Lu"]]
for x, lv in zip(ws, [2, 5, 5, 1]):
    x.level = lv
    ask(lp, "add", x)
val, printed = call(lp, "leader")
check(not (val is None and printed.strip()), "leader printed instead of handing back the member. Use return.")
check(not isinstance(val, str), "leader should hand back the member itself, not their name: whoever asked can still read .name from it.")
check(val is not ws[2], "Jo and Kit share the highest level and Jo joined first, so Jo should lead. Only replace your best-so-far when someone is strictly higher.")
check(val is ws[1], "In a party of Ivo (level 2), Jo (level 5), Kit (level 5) and Lu (level 1), leader handed back " + (who(val) if val is not None else "None") + ".")
val, _ = call(make(Party, "Nobody", 3), "leader")
check(val is None, "An empty party has no leader, so leader should hand back None, but it gave " + repr(val) + ".")
check(found(Party), "Make a party for the hill road and add the starter's members to it.")
check(out.strip(), "Print what your party can carry.")`,
      hints: [
        "A party is a list of members with rules around it. For each method, picture Rook asking out loud: 'Room for one more?', 'Can we carry it?', 'Anyone who can patch a knee?', 'Who's in charge?' Which members does each question need to look at?",
        "A box of eggs: `self.eggs = []` in `__init__` gives every box its own list. A method can loop over it and ask each egg: `for e in self.eggs: total += e.grams`. For 'is anyone...?', return True the moment you find one, and False only after the loop has looked at everyone.",
        "`add`: `if member in self.members or len(self.members) >= ...: return False`, otherwise append and return True. `total_carry` adds up `m.pack_limit()`. `leader` keeps a best-so-far, and replaces it only when someone's level is strictly ...",
      ],
      solution: SOL15,
      wrong: [
        swap(SOL15, ["class Party:\n    def __init__(self, name, size=4):", "class Party:\n    members = []\n\n    def __init__(self, name, size=4):"], ["        self.size = size\n        self.members = []\n", "        self.size = size\n"]),
        swap(SOL15, ["if member in self.members or len(self.members) >= self.size:", "if len(self.members) >= self.size:"]),
        swap(SOL15, ["if member in self.members or len(self.members) >= self.size:", "if member in self.members:"]),
        swap(SOL15, ["total += m.pack_limit()", "total += 12 + 3 * (m.level - 1)"]),
        swap(SOL15, ["if best is None or m.level > best.level:", "if best is None or m.level >= best.level:"]),
        swap(SOL15, ["        return best\n", "        return best.name\n"]),
        swap(SOL15, ["            if isinstance(m, Healer):\n                return True\n        return False", "            if isinstance(m, Healer):\n                return True\n            else:\n                return False\n        return False"]),
        swap(SOL15, ["def __init__(self, name, size=4):", "def __init__(self, name, size):"], ['road = Party("Hill Road")', 'road = Party("Hill Road", 4)']),
      ],
      done: "Rook: Dummies stuffed, target up, a weapon rack full of swords nobody's allowed to touch. And a party that adds itself up. That's a guild, recruit. Nearly.",
    },
    {
      id: "g16-the-road-up-the-hill",
      part: "Lookout and notice board",
      title: "The Road Up the North Hill",
      topic: "putting it together",
      cost: { wood: 7, stone: 5 },
      intro: [
        "The storm on the north hill hasn't moved in days. It just sits there, grey and quiet, swallowing the light. Pip has stopped looking at it.",
        "Rook: Roster's on file and the supplies are counted. Last job: pick the party, see if it can carry the lot, and pin the plan on the board. Then we clear the road.",
        "This is the whole guild at once: read the file, make the right kind of page for each line, choose with `isinstance`, sort, and let a `Party` add itself up. Plan it on paper first, one function at a time.",
      ],
      codex: ["composition", "isinstance", "object-lists"],
      quiz: {
        code: r`class Seed:
    def __init__(self, kind, grams):
        self.kind = kind
        self.grams = grams

def grams_of(seed):
    return seed.grams

packets = [Seed("bean", 30), Seed("pea", 50), Seed("leek", 50), Seed("kale", 10)]
best = sorted(packets, key=grams_of, reverse=True)
print(best[0].kind, best[1].kind)`,
        question: "What does this program show?",
        options: ["pea leek", "leek pea", "bean pea", "pea bean"],
        answer: 0,
        why: "The pea and the leek tie at 50 grams. A sort keeps tied items in the order they started in, even with reverse=True, so the pea stays ahead of the leek.",
      },
      task: [
        "`load_guild(filename)` reads a roster file like `roster.csv` and hands back a list with one page per line, in the same order: a `Scout` for scouts, a `Healer` (with their herbs) for healers, and a plain `Member` for everyone else, each at the level the file gives.",
        "`choose_party(guild, size)` hands back a `Party` of that size, chosen by Rook's rules: first the highest-level scout, then the healer with the most herbs, then the highest levels of everyone left, until it's full. Ties go to whoever comes first on the roster. With no scout, or no healer, skip that place.",
        "The program loads `roster.csv`, chooses a party of `party_size`, and prints each member's page in the order they were chosen.",
        "Last, one line: if the party can carry everything in `supplies.csv`, how many kilos they have to spare (with the word `spare`); if not, how many kilos short they are (with the word `short`).",
      ],
      files: { "roster.csv": ROSTER, "supplies.csv": SUPPLIES },
      starter: HEAD16 + r`

# load_guild(filename): one page per line of the roster, the right kind for each

# choose_party(guild, size): Rook's rules (see the task)

party_size = 5
# Load roster.csv, choose the party and print each member's page,
# then say whether it can carry everything in supplies.csv.
`,
      tests: PRE + r`Member = need_class("Member")
Scout = need_class("Scout", "Member")
Healer = need_class("Healer", "Member")
Party = need_class("Party")
with open("test_roster.csv", "w") as f:
    f.write("name,role,years,level,herbs" + chr(10) + "Ottilie,healer,4,3,11" + chr(10) + "Corwin,guard,15,2,0" + chr(10) + "Juniper,scout,2,6,0" + chr(10) + "Bea,healer,30,1,4" + chr(10))
g = run_fn("load_guild", 'load_guild("test_roster.csv"), with a 4-line roster', "test_roster.csv")
check(isinstance(g, list) and len(g) == 4, "load_guild should hand back a list with one page per line of the roster (not counting the header). For a 4-line roster it gave " + (str(len(g)) + " item(s)" if isinstance(g, list) else "a " + type(g).__name__) + ".")
kinds = [type(x).__name__ for x in g]
check(kinds == [Healer.__name__, Member.__name__, Scout.__name__, Healer.__name__], "Each line should become the right kind of page: a Scout for scouts, a Healer for healers, a plain Member for anyone else. For a roster of a healer, a guard, a scout and a healer, load_guild made: " + ", ".join(kinds) + ".")
o, c, j, b = g
check([x.name for x in g] == ["Ottilie", "Corwin", "Juniper", "Bea"], "The pages should come out in the roster's order, with the roster's names.")
check(c.role == "guard" and j.role == "scout" and o.role == "healer", "Each page should keep the role from the roster.")
check(all(isinstance(x.years, int) and isinstance(x.level, int) for x in g), "years and level should be numbers. The csv reader hands every value over as text, so turn the numbers into ints.")
check([x.years for x in g] == [4, 15, 2, 30], "Each page should keep the years from the roster, but they came out as " + repr([x.years for x in g]) + ".")
check([x.level for x in g] == [3, 2, 6, 1], "Each page should be at the level the roster gives, but the levels came out as " + repr([x.level for x in g]) + ".")
check(o.herbs == 11 and b.herbs == 4, "Each healer should carry the herbs the roster gives (as a number), but they came out as " + repr(o.herbs) + " and " + repr(b.herbs) + ".")
def pick(guild, size, label):
    party = run_fn("choose_party", "choose_party() on " + label, guild, size)
    check(isinstance(party, Party), "choose_party should hand back a Party, but it gave " + type(party).__name__ + ".")
    return [x.name for x in party.members]
got = pick(g, 3, "that 4-line roster, size 3")
check(got[:1] == ["Juniper"], "The first place goes to the highest-level scout. On that roster the only scout is Juniper, but your party starts with " + repr(got[:1]) + ".")
check(got[1:2] == ["Ottilie"], "The second place goes to the healer with the most herbs: on that roster, Ottilie has 11 and Bea has 4. Your party's second is " + repr(got[1:2]) + ".")
check(got == ["Juniper", "Ottilie", "Corwin"], "After the scout and the healer, fill up with the highest levels of everyone left. For that roster your party is " + ", ".join(got) + ".")
def mk(kind, name, level, herbs=0):
    if kind == "s":
        x = make(Scout, name, "scout", 3)
    elif kind == "h":
        x = make(Healer, name, 3, herbs)
    else:
        x = make(Member, name, "guard", 3)
    x.level = level
    return x
got = pick([mk("m", "Ari", 3), mk("s", "Bo", 2), mk("s", "Cy", 4), mk("h", "Di", 1, 5), mk("h", "Ed", 1, 9), mk("m", "Flo", 3), mk("m", "Gus", 5)], 4, "a roster of seven, size 4")
check(got[:2] == ["Cy", "Ed"], "On a roster with scouts Bo (level 2) and Cy (level 4), and healers Di (5 herbs) and Ed (9 herbs), the first two places should go to the best scout and the best-stocked healer, but your party starts " + ", ".join(got[:2]) + ".")
check(got == ["Cy", "Ed", "Gus", "Ari"], "After the scout and the healer come the highest levels of everyone left. Ari and Flo tie on level 3, and Ari comes first on the roster, so Ari gets the place. Your party: " + ", ".join(got) + ".")
got = pick([mk("m", "Hu", 1), mk("s", "Ivy", 4), mk("s", "Jem", 4), mk("h", "Kai", 1, 6), mk("h", "Lark", 1, 6)], 2, "a roster with tied scouts and tied healers, size 2")
check(got == ["Ivy", "Kai"], "When two scouts (or two healers) tie, the one earlier on the roster gets the place. Your party: " + ", ".join(got) + ".")
got = pick([mk("m", "Mo", 2), mk("h", "Ned", 1, 3), mk("m", "Oz", 4)], 2, "a roster with no scout, size 2")
check(got == ["Ned", "Oz"], "With no scout on the roster, skip that place: the healer comes first, then the highest levels. Your party: " + ", ".join(got) + ".")
got = pick([mk("m", "Pa", 1), mk("m", "Qi", 2)], 5, "a roster of two with no scout or healer, size 5")
check(got == ["Qi", "Pa"], "With no scout and no healer, the party is simply the highest levels first, and a small roster can't fill a big party. Your party: " + ", ".join(got) + ".")
guild = run_fn("load_guild", 'load_guild("roster.csv")', "roster.csv")
mp = run_fn("choose_party", 'choose_party() on roster.csv, size 5', guild, 5)
pages = [page_of(x) for x in mp.members]
check(lines[:len(pages)] == pages, "First print the chosen party's pages, one per line, in the order they were chosen.")
check(len(lines) == len(pages) + 1, "After the pages, print one line about the supplies, and nothing else.")
check(re.search(r"open\(\s*[\"']supplies\.csv", src), "Read the supplies from supplies.csv and add up their kilos.")
spare = mp.total_carry() - 81
check("spare" in lines[-1].lower() and str(spare) in lines[-1], "This party can carry everything in supplies.csv, so the last line should say how many kilos they have to spare (with the word spare). Yours says " + repr(lines[-1]) + ".")
_, l2 = again("party_size = 5", "party_size = 2", "the line party_size = 5")
short = 81 - mp.members[0].pack_limit() - mp.members[1].pack_limit()
check(l2 and "short" in l2[-1].lower() and str(short) in l2[-1], "With a party of 2, they can't carry everything, so the last line should say how many kilos short they are (with the word short). Your program said " + repr(l2[-1] if l2 else "nothing") + ". Work it out from the party and the file rather than typing numbers.")`,
      hints: [
        "Plan on paper. What does one line of the roster turn into? For choosing, write Rook's rules as three steps, and notice that the party already turns away anyone twice and anyone once it's full, so you can offer it everyone.",
        "`csv.DictReader` hands you each line as a dictionary of text, so numbers need `int()`. To get the best of a group, sort it with a key function and take the first: `sorted(jars, key=honey_of, reverse=True)[0]`. Sorting keeps ties in their starting order, even with `reverse=True`.",
        "load_guild: pick `Scout(...)`, `Healer(...)` or `Member(...)` with an if on the role, set `member.level = int(row[\"level\"])` and append. choose_party: make a `Party(..., size)`, add the best scout if there are any, then the healer with the most herbs, then everyone sorted by level, highest first: `party.add` does the turning away. Then add up supplies.csv and compare with ...",
      ],
      solution: SOL16,
      wrong: [
        swap(SOL16, ["            if role == \"scout\":\n                member = Scout(name, role, years)\n            elif role == \"healer\":\n                member = Healer(name, years, int(row[\"herbs\"]))\n            else:\n                member = Member(name, role, years)", "            member = Member(name, role, years)"]),
        swap(SOL16, ['member.level = int(row["level"])', 'member.level = row["level"]']),
        swap(SOL16, ["    if scouts:\n        party.add(sorted(scouts, key=level_of, reverse=True)[0])\n    if healers:\n        party.add(sorted(healers, key=herbs_of, reverse=True)[0])\n", ""]),
        swap(SOL16, ["    for member in sorted(guild, key=level_of, reverse=True):", "    for member in sorted(guild, key=level_of)[::-1]:"]),
        swap(SOL16, ["sorted(healers, key=herbs_of, reverse=True)[0]", "sorted(healers, key=level_of, reverse=True)[0]"]),
        swap(SOL16, ['    print(f"The party is {needed - can} kilos short.")', '    print("The party is short.")']),
        swap(SOL16, ["needed = 0\nwith open(\"supplies.csv\") as f:\n    for row in csv.DictReader(f):\n        needed += int(row[\"kilos\"])", "needed = 81"]),
        swap(SOL16, ["party.add(sorted(scouts, key=level_of, reverse=True)[0])", "party.add(scouts[0])"]),
      ],
      done: "Rook: Party picked, packs weighed, plan pinned to the board. Lookout's up and the spyglass is on the hill. Look at that storm, recruit. Not moving. Waiting. Well. So are we. And we've got tea.",
    },
  ],
};
