import type { Spec, Template } from "../build.ts";
import { CROPS, FISH } from "../rng.ts";

// The Guild Hall: classes, methods, __str__, class attributes, inheritance, composition.

const HERBS = ["mint", "chamomile", "sage", "thyme", "rosemary", "lavender"];
const PLOTS = ["north field", "river strip", "hill plot", "orchard row", "mill patch", "east meadow"];
const FOOD = ["eggs", "jam", "oats", "honey", "flour", "apples", "cheese", "butter"];
const BOATS = ["Minnow", "Heron", "Reed", "Otter", "Kelp", "Puddle", "Drift", "Pebble"];

export const GUILDHALL: Template[] = [
  {
    id: "gh-sack",
    topics: ["guildhall"],
    difficulty: 1,
    make(r): Spec {
      const twist = r.pick(["heavy", "share"] as const);
      if (twist === "heavy") {
        const limit = r.int(15, 30);
        const [c1, c2, c3] = r.sample(CROPS, 3);
        const k1 = r.int(5, 40);
        const body = `class Sack:\n    def __init__(self, crop, kilos):\n        self.crop = crop\n        self.kilos = kilos\n\n    def is_heavy(self):\n        return self.kilos >= ${limit}`;
        return {
          title: "A Sack of Its Own",
          topic: "classes: __init__ and a method",
          task: [
            "Write a class `Sack`. Making one takes the crop's name and the kilos, as in `Sack(\"oats\", 12)`, and keeps them as `crop` and `kilos`.",
            `Give it a method \`is_heavy()\` that answers True when the sack weighs at least ${limit} kilos, and False when it weighs less.`,
          ],
          plan: ["Your class goes here"],
          body,
          drive: `s = Sack("${c1}", ${k1})\nprint(s.crop, s.kilos)\nprint(s.is_heavy())`,
          variants: [
            { drive: `print(Sack("${c2}", ${limit}).is_heavy())\nprint(Sack("${c2}", ${limit - 1}).is_heavy())`, note: "One sack weighs exactly the limit, one just under." },
            { drive: `a = Sack("${c1}", ${k1})\nb = Sack("${c3}", ${limit + 6})\nprint(a.crop, a.kilos, a.is_heavy())\nprint(b.crop, b.kilos, b.is_heavy())`, note: "Two sacks at once: each keeps its own crop and kilos." },
          ],
          wrong: [
            body.replace(">=", ">"),
            `class Sack:\n    def __init__(self, crop, kilos):\n        self.crop = crop\n        self.weight = kilos\n\n    def is_heavy(self):\n        return self.weight >= ${limit}`,
            `class Sack:\n    def __init__(self, crop, kilos):\n        self.crop = crop\n        self.kilos = kilos\n\n    def is_heavy(self):\n        return kilos >= ${limit}`,
          ],
          hints: [
            "What Sack is given when it's made has to be kept on the object itself, or the method can't see it later.",
            "`def __init__(self, flavour, slices):` then `self.slices = slices` keeps a value on the object; a method reads it back as `self.slices`.",
            `Inside \`is_heavy(self)\`: \`return self.___ >= ${limit}\``,
          ],
          needs: [
            ["class\\s+Sack\\b", "Wren asks for a class named Sack."],
            ["def\\s+is_heavy\\s*\\(\\s*self", "Give Sack a method is_heavy, with self in its brackets."],
          ],
          advice: "Keep the crop and kilos under those exact names.",
          codex: ["classes", "init", "methods"],
        };
      }
      const cls = r.pick(["Catch", "Haul"]);
      const fish = r.pick(FISH);
      const count = r.int(10, 40);
      const people = r.int(2, 5);
      const body = `class ${cls}:\n    def __init__(self, fish, count):\n        self.fish = fish\n        self.count = count\n\n    def each(self, people):\n        return self.count // people`;
      return {
        title: "Sharing the Catch",
        topic: "classes: a method that uses self",
        task: [
          `Write a class \`${cls}\`. Making one takes the kind of fish and how many were caught, as in \`${cls}("minnow", 9)\`, and keeps them as \`fish\` and \`count\`.`,
          "Give it a method `each(people)` that hands back how many whole fish each person gets when the catch is shared out evenly. Leftover fish go back in the river.",
        ],
        plan: ["Your class goes here"],
        body,
        drive: `h = ${cls}("${fish}", ${count})\nprint(h.fish, h.count)\nprint(h.each(${people}))`,
        variants: [
          { drive: `h = ${cls}("${fish}", 3)\nprint(h.each(4))\nprint(h.each(1))`, note: "Fewer fish than people; then one person takes the lot." },
          { drive: `a = ${cls}("perch", 20)\nb = ${cls}("eel", 7)\nprint(a.each(3), b.each(3))`, note: "Two catches at once." },
        ],
        wrong: [
          body.replace("//", "/"),
          body.replace("//", "%"),
          body.replace("return self.count // people", "print(self.count // people)"),
        ],
        hints: [
          "The method knows how many people there are; the catch knows how many fish. Where does the method find the fish count?",
          "`self.slices = slices` in `__init__` keeps a value; another method reads it back as `self.slices`. `17 // 5` drops the leftover.",
          "Inside `each(self, people)`: `return self.count ___ people`",
        ],
        needs: [
          [`class\\s+${cls}\\b`, `Wren asks for a class named ${cls}.`],
          ["def\\s+each\\s*\\(\\s*self", `Give ${cls} a method each, with self in its brackets.`],
        ],
        advice: "Hand the number back with return.",
        codex: ["classes", "methods"],
      };
    },
  },
  {
    id: "gh-jar",
    topics: ["guildhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["jar", "plot"] as const);
      if (twist === "jar") {
        const [h1, h2] = r.sample(HERBS, 2);
        const add = r.int(20, 60);
        const use = r.int(5, add - 5);
        const z = r.int(10, 90);
        const body = `class Jar:\n    def __init__(self, herb, grams=0):\n        self.herb = herb\n        self.grams = grams\n\n    def add(self, g):\n        self.grams += g\n\n    def use(self, g):\n        self.grams = max(0, self.grams - g)\n\n    def __str__(self):\n        return f"{self.herb}: {self.grams} g"`;
        return {
          title: "Mirela's Herb Jars",
          topic: "classes: defaults, changes and __str__",
          task: [
            "Write a class `Jar` for Mirela's herb shelf. `Jar(herb, grams)` keeps the herb's name and how many grams are in it. When no grams are given, the jar starts empty.",
            "`add(g)` puts g more grams in. `use(g)` takes g grams out, but a jar can't hold less than nothing: if there isn't enough, it ends up empty.",
            "Printing a jar shows the herb, a colon and a space, the grams, a space, then the letter g.",
          ],
          plan: ["Your class goes here"],
          body,
          drive: `a = Jar("${h1}")\na.add(${add})\na.use(${use})\nprint(a)\nb = Jar("${h2}", ${z})\nb.add(7)\nprint(b)`,
          variants: [
            { drive: `a = Jar("${h2}", 10)\na.use(25)\nprint(a)\na.add(4)\nprint(a)`, note: "Mirela uses more than the jar holds." },
            { drive: `a = Jar("${h1}", 30)\na.use(30)\nprint(a)\nprint(Jar("${h2}"))`, note: "Every last gram used; and a brand-new jar." },
          ],
          wrong: [
            body.replace("grams=0", "grams"),
            body.replace("self.grams = max(0, self.grams - g)", "self.grams -= g"),
            body.replace("self.grams += g", "self.grams = g"),
            body.replace('return f"{self.herb}: {self.grams} g"', 'print(f"{self.herb}: {self.grams} g")'),
          ],
          hints: [
            "Three separate jobs: a fallback value when grams is left out, a floor of zero when using, and the text a jar shows when printed.",
            "`def __init__(self, flavour, slices=8):` gives a fallback. `max(0, n)` never goes below zero. `def __str__(self):` must hand back text with `return`.",
            "In `use`: `self.grams = max(___, self.grams - g)`",
          ],
          needs: [
            ["class\\s+Jar\\b", "Wren asks for a class named Jar."],
            ["def\\s+__str__\\s*\\(", "Printing a jar should show its text: that's what __str__ is for."],
          ],
          advice: "Check the printed jar: herb, colon, space, grams, space, g.",
          codex: ["str-method", "init", "methods"],
        };
      }
      const [p1, p2] = r.sample(PLOTS, 2);
      const [dc, c2] = r.sample(CROPS, 2);
      const a = r.int(2, 6);
      const b = r.int(1, 5);
      const body = `class Plot:\n    def __init__(self, name, crop="${dc}"):\n        self.name = name\n        self.crop = crop\n        self.rows = 0\n\n    def plant(self, n):\n        self.rows += n\n\n    def __str__(self):\n        return f"{self.name}: {self.rows} rows of {self.crop}"`;
      return {
        title: "Plots on the Board",
        topic: "classes: defaults, changes and __str__",
        task: [
          `Write a class \`Plot\`. \`Plot(name, crop)\` keeps the plot's name and its crop; when no crop is given, it's ${dc}. Every new plot starts with no rows planted.`,
          "`plant(n)` plants n more rows.",
          "Printing a plot shows its name, a colon and a space, the number of rows, the word rows, the word of, then the crop, with single spaces between words.",
        ],
        plan: ["Your class goes here"],
        body,
        drive: `p = Plot("${p1}")\np.plant(${a})\np.plant(${b})\nprint(p)\nq = Plot("${p2}", "${c2}")\nprint(q)`,
        variants: [
          { drive: `p = Plot("${p2}", "${c2}")\nprint(p)`, note: "A plot with nothing planted yet." },
          { drive: `p = Plot("${p1}")\nq = Plot("${p2}")\np.plant(3)\nq.plant(1)\nq.plant(1)\nprint(p)\nprint(q)`, note: "Two plots, each with its own rows." },
        ],
        wrong: [
          body.replace(`crop="${dc}"`, "crop"),
          body.replace("self.rows += n", "self.rows = n"),
          body.replace(`return f"{self.name}: {self.rows} rows of {self.crop}"`, `print(f"{self.name}: {self.rows} rows of {self.crop}")`),
          body.replace("{self.rows} rows of {self.crop}", "{self.rows} {self.crop}"),
        ],
        hints: [
          "Three things to get right: the fallback crop, rows that add up over several plantings, and the text a plot shows when printed.",
          "`def __init__(self, flavour, slices=8):` gives a fallback. `self.count += 2` adds to what's there. `def __str__(self):` hands back text with `return`.",
          "In `plant`: `self.rows ___ n`",
        ],
        needs: [
          ["class\\s+Plot\\b", "Wren asks for a class named Plot."],
          ["def\\s+__str__\\s*\\(", "Printing a plot should show its text: that's what __str__ is for."],
        ],
        advice: "Check the printed plot word by word.",
        codex: ["str-method", "init", "methods"],
      };
    },
  },
  {
    id: "gh-crew",
    topics: ["guildhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["tally", "cart"] as const);
      if (twist === "tally") {
        const [x, y, z] = [r.int(2, 9), r.int(2, 9), r.int(1, 6)];
        const body = "class Fisher:\n    landed = 0\n\n    def __init__(self, name):\n        self.name = name\n        self.catch = 0\n\n    def land(self, n):\n        self.catch += n\n        Fisher.landed += n";
        return {
          title: "The Dock Tally",
          topic: "class attributes and instance attributes",
          task: [
            "Write a class `Fisher`. `Fisher(name)` keeps the name, and each fisher's own `catch` starts at 0.",
            "The class itself keeps `landed`: every fish landed by any fisher, all added together. It starts at 0 before anyone fishes.",
            "`land(n)` adds n fish to this fisher's catch, and to the class's `landed`.",
          ],
          plan: ["Your class goes here"],
          body,
          drive: `a = Fisher("Odo")\nb = Fisher("Pip")\na.land(${x})\nb.land(${y})\na.land(${z})\nprint(a.catch, b.catch, Fisher.landed)`,
          variants: [
            { drive: `c = Fisher("Sable")\nprint(c.catch, Fisher.landed)`, note: "Nobody has landed a fish yet." },
            { drive: `a = Fisher("Rook")\na.land(4)\nb = Fisher("Hazel")\nb.land(1)\nprint(a.name, a.catch, b.name, b.catch, Fisher.landed)`, note: "A new fisher arrives after fish were already landed." },
          ],
          wrong: [
            body.replace("Fisher.landed += n", "self.landed += n"),
            body.replace("self.catch = 0", "self.catch = 0\n        Fisher.landed = 0"),
            "class Fisher:\n    landed = 0\n    catch = 0\n\n    def __init__(self, name):\n        self.name = name\n\n    def land(self, n):\n        Fisher.catch += n\n        Fisher.landed += n",
          ],
          hints: [
            "Two kinds of number here: one that belongs to each fisher, and one shared by the whole class. Where does each one live?",
            "`class Hen:` with `eggs_laid = 0` right under it gives the class one shared value, changed with `Hen.eggs_laid += 2`. `self.eggs = 0` in `__init__` gives each hen her own.",
            "In `land`: `self.catch += n`, then `___.landed += n`",
          ],
          needs: [["class\\s+Fisher\\b", "Wren asks for a class named Fisher."]],
          advice: "Each fisher's own catch, and the class's shared landed.",
          codex: ["class-attributes", "methods"],
        };
      }
      const limit = r.int(18, 30);
      const [a, b, c] = [r.int(5, limit - 1), r.int(limit + 1, 45), r.int(5, 45)];
      const body = `class Sack:\n    limit = ${limit}\n\n    def __init__(self, owner, kilos):\n        self.owner = owner\n        self.kilos = kilos\n\n    def fits(self):\n        return self.kilos <= Sack.limit\n\n\ndef count_fitting(sacks):\n    count = 0\n    for s in sacks:\n        if s.fits():\n            count += 1\n    return count`;
      const make = `sacks = [Sack("Bram", ${a}), Sack("Odo", ${b}), Sack("Pip", ${limit}), Sack("Ingrid", ${c})]`;
      return {
        title: "What the Cart Can Take",
        topic: "class attributes and objects in a list",
        task: [
          `The mill cart takes sacks of at most ${limit} kilos. Write a class \`Sack\` that keeps that limit as \`limit\` on the class itself, shared by every sack, so Wren can change it for all of them at once.`,
          "`Sack(owner, kilos)` keeps both. `fits()` answers True when this sack is within the cart's limit.",
          "Then write a function `count_fitting(sacks)` that hands back how many sacks in the list fit.",
        ],
        plan: ["Your class goes here", "Your function goes here"],
        body,
        drive: `${make}\nprint(sacks[0].fits(), sacks[1].fits())\nprint(count_fitting(sacks))`,
        variants: [
          { drive: `${make}\nSack.limit = 10\nprint(count_fitting(sacks))\nSack.limit = 50\nprint(count_fitting(sacks))`, note: "Wren changes the cart's limit for every sack at once." },
          { drive: `print(count_fitting([]))\nprint(Sack("Rook", ${limit}).fits())`, note: "No sacks at all; then one exactly on the limit." },
        ],
        wrong: [
          body.replace(`    limit = ${limit}\n\n`, "").replace("self.kilos = kilos", `self.kilos = kilos\n        self.limit = ${limit}`).replace("Sack.limit", "self.limit"),
          body.replace("<=", "<"),
          body.replace("    count = 0\n    for s in sacks:\n        if s.fits():\n            count += 1\n    return count", "    return len(sacks)"),
        ],
        hints: [
          "The limit belongs to all sacks together, not to any one sack. Then the function walks the list and asks each sack.",
          "`class Hen:` with `nest_size = 4` under it gives every hen one shared value, read as `Hen.nest_size`. A loop can call a method on each object: `if hen.laid():`.",
          "In `fits`: `return self.kilos ___ Sack.limit`",
        ],
        needs: [
          ["class\\s+Sack\\b", "Wren asks for a class named Sack."],
          ["def\\s+count_fitting\\s*\\(", "Wren asks for a function named count_fitting."],
        ],
        advice: "Read the limit from the class, so changing it changes every sack.",
        codex: ["class-attributes", "object-lists"],
      };
    },
  },
  {
    id: "gh-guild",
    topics: ["guildhall"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["pay", "boats"] as const);
      if (twist === "pay") {
        const rate = r.int(2, 5);
        const bonus = r.int(1, 4);
        const [h1, h2, t2, h3] = [r.int(1, 6), r.int(1, 6), r.int(1, 5), r.int(1, 6)];
        const helper = `class Helper:\n    def __init__(self, name, hours):\n        self.name = name\n        self.hours = hours\n\n    def pay(self):\n        return self.hours * ${rate}\n\n\n`;
        const smith = `class Smith(Helper):\n    def __init__(self, name, hours, tools):\n        super().__init__(name, hours)\n        self.tools = tools\n\n    def pay(self):\n        return super().pay() + self.tools * ${bonus}\n\n\n`;
        const roll = "def payroll(people):\n    total = 0\n    for p in people:\n        total += p.pay()\n    return total";
        return {
          title: "The Guild Payroll",
          topic: "inheritance, super() and overriding",
          task: [
            `Write a class \`Helper\`: \`Helper(name, hours)\` keeps both, and \`pay()\` hands back ${rate} coins for every hour.`,
            "Write `Smith`, a kind of Helper, made with `Smith(name, hours, tools)`. Let Helper's own setup keep the name and hours, then keep the tools too.",
            `A smith's \`pay()\` is what a helper would get, plus ${bonus} coins for every tool.`,
            "Write a function `payroll(people)` that hands back everyone's pay in the list, added up.",
          ],
          plan: ["The Helper class", "The Smith class", "The payroll function"],
          body: helper + smith + roll,
          drive: `crew = [Helper("Bram", ${h1}), Smith("Ingrid", ${h2}, ${t2}), Helper("Pip", ${h3})]\nprint(crew[1].name, crew[1].hours, crew[1].tools)\nfor p in crew:\n    print(p.pay())\nprint(payroll(crew))`,
          variants: [
            { drive: "print(payroll([]))", note: "Nobody worked today." },
            { drive: `s = Smith("Rook", 0, 3)\nprint(s.pay())\nprint(payroll([s, Helper("Hazel", 2)]))`, note: "A smith with no hours still brings tools." },
          ],
          wrong: [
            helper + smith.replace(/\n\n    def pay\(self\):\n.*\n/, "\n") + roll,
            helper + smith.replace("        super().__init__(name, hours)\n", "") + roll,
            helper + smith.replace("super().pay() + ", "") + roll,
            helper + smith + "def payroll(people):\n    return len(people)",
          ],
          hints: [
            "A smith is a helper with something extra. Which parts can Smith borrow from Helper, and which must it change?",
            "`class Pie(Cake):` makes a kind of Cake. Inside Pie's methods, `super().__init__(flavour)` runs Cake's setup and `super().price()` gets Cake's answer to build on.",
            `In Smith's \`pay\`: \`return super().___() + self.tools * ${bonus}\``,
          ],
          needs: [
            ["class\\s+Smith\\s*\\(\\s*Helper\\s*\\)", "Make Smith a kind of Helper: class Smith(Helper)."],
            ["super\\(\\)\\.__init__", "Let Helper's own setup keep the name and hours, with super()."],
            ["def\\s+payroll\\s*\\(", "Wren asks for a function named payroll."],
          ],
          advice: "Check each pay, then the total.",
          codex: ["inheritance", "super", "overriding"],
        };
      }
      const [n1, n2, n3, n4] = r.sample(BOATS, 4);
      const [s1, s2, s3, s4] = [r.int(2, 6), r.int(4, 8), r.int(2, 6), r.int(4, 8)];
      const [k2, k4] = [r.int(1, 3), r.int(1, 3)];
      const boat = "class Boat:\n    def __init__(self, name, seats):\n        self.name = name\n        self.seats = seats\n\n    def room(self):\n        return self.seats\n\n\n";
      const fishing = "class FishingBoat(Boat):\n    def __init__(self, name, seats, nets):\n        super().__init__(name, seats)\n        self.nets = nets\n\n    def room(self):\n        return self.seats - self.nets\n\n\n";
      const out = "def nets_out(boats):\n    total = 0\n    for b in boats:\n        if isinstance(b, FishingBoat):\n            total += b.nets\n    return total";
      return {
        title: "Boats at the Dock",
        topic: "inheritance, overriding and isinstance",
        task: [
          "Write a class `Boat`: `Boat(name, seats)` keeps both, and `room()` hands back how many people fit, which for a plain boat is its seats.",
          "Write `FishingBoat`, a kind of Boat, made with `FishingBoat(name, seats, nets)`. Let Boat's own setup keep the name and seats, then keep the nets too. Each net takes up a seat, so a fishing boat's `room()` is its seats minus its nets.",
          "Write a function `nets_out(boats)` that hands back how many nets there are on the fishing boats in the list, all together. Plain boats have none.",
        ],
        plan: ["The Boat class", "The FishingBoat class", "The nets_out function"],
        body: boat + fishing + out,
        drive: `fleet = [Boat("${n1}", ${s1}), FishingBoat("${n2}", ${s2}, ${k2}), Boat("${n3}", ${s3}), FishingBoat("${n4}", ${s4}, ${k4})]\nfor b in fleet:\n    print(b.name, b.room())\nprint(nets_out(fleet))`,
        variants: [
          { drive: `print(nets_out([Boat("${n1}", 3)]))\nprint(nets_out([]))`, note: "Only a plain boat, then no boats at all: no nets." },
          { drive: `k = FishingBoat("${n3}", 5, 2)\nprint(isinstance(k, Boat), k.seats, k.room())\nprint(nets_out([k, k]))`, note: "The same fishing boat listed twice." },
        ],
        wrong: [
          boat + fishing + "def nets_out(boats):\n    total = 0\n    for b in boats:\n        total += b.nets\n    return total",
          boat + fishing.replace("\n\n    def room(self):\n        return self.seats - self.nets", "") + out,
          boat + fishing.replace("        super().__init__(name, seats)\n", "") + out,
          boat + fishing + out.replace("total += b.nets", "total += 1"),
        ],
        hints: [
          "A fishing boat is a boat with something extra. And when you walk the fleet, some boats have nets and some don't: ask each one what kind it is first.",
          "`class Pie(Cake):` makes a kind of Cake, and a method with the same name replaces Cake's. `isinstance(rex, Puppy)` answers whether rex is a Puppy.",
          "In `nets_out`: `if isinstance(b, ___):` before adding its nets.",
        ],
        needs: [
          ["class\\s+FishingBoat\\s*\\(\\s*Boat\\s*\\)", "Make FishingBoat a kind of Boat: class FishingBoat(Boat)."],
          ["super\\(\\)\\.__init__", "Let Boat's own setup keep the name and seats, with super()."],
          ["def\\s+nets_out\\s*\\(", "Wren asks for a function named nets_out."],
        ],
        advice: "Check each boat's room, then the nets.",
        codex: ["inheritance", "overriding", "isinstance"],
      };
    },
  },
  {
    id: "gh-basket",
    topics: ["market", "guildhall"],
    difficulty: 2,
    make(r): Spec {
      const twist = r.pick(["heaviest", "spread"] as const);
      const cls = r.pick(["Basket", "Crate"]);
      const items = Array.from({ length: r.int(3, 5) }, () => r.int(2, 20));
      const init = `class ${cls}:\n    def __init__(self):\n        self.items = []\n\n    def add(self, kilos):\n        self.items.append(kilos)\n\n`;
      const fill = `a = ${cls}()\nfor k in ${JSON.stringify(items)}:\n    a.add(k)`;
      const method = twist === "heaviest" ? "heaviest" : "spread";
      const tail =
        twist === "heaviest"
          ? "    def heaviest(self):\n        if len(self.items) == 0:\n            return 0\n        return max(self.items)"
          : "    def spread(self):\n        if len(self.items) == 0:\n            return 0\n        return max(self.items) - min(self.items)";
      const body = init + tail;
      const wrongLast =
        twist === "heaviest"
          ? init + "    def heaviest(self):\n        if len(self.items) == 0:\n            return 0\n        return self.items[-1]"
          : init + "    def spread(self):\n        if len(self.items) == 0:\n            return 0\n        return self.items[-1] - self.items[0]";
      return {
        title: twist === "heaviest" ? `The Heaviest in the ${cls}` : `How Uneven Is the ${cls}?`,
        topic: "a class holding a list",
        task: [
          `Write a class \`${cls}\`. \`${cls}()\` starts empty, and \`add(kilos)\` puts in one more thing of that weight.`,
          twist === "heaviest"
            ? "Give it a method `heaviest()` that hands back the weight of the heaviest thing in it, or 0 when it's empty."
            : "Give it a method `spread()` that hands back how many kilos heavier its heaviest thing is than its lightest, or 0 when it's empty.",
          `Each ${cls.toLowerCase()} keeps its own things: filling one never fills another.`,
        ],
        plan: ["Your class goes here"],
        body,
        drive: `${fill}\nprint(a.${method}())\nb = ${cls}()\nprint(b.${method}())`,
        variants: [
          { drive: `b = ${cls}()\nb.add(3)\nc = ${cls}()\nc.add(9)\nc.add(4)\nprint(b.${method}(), c.${method}())`, note: `Two ${cls.toLowerCase()}s, each with its own things.` },
          { drive: `c = ${cls}()\nc.add(5)\nc.add(5)\nprint(c.${method}())\nc.add(12)\nc.add(1)\nprint(c.${method}())`, note: "Two things weigh the same; then more go in." },
        ],
        wrong: [
          body.replace("    def __init__(self):\n        self.items = []", "    items = []\n\n    def __init__(self):\n        pass"),
          body.replace("        if len(self.items) == 0:\n            return 0\n", ""),
          body.replace("self.items.append(kilos)", "self.items = [kilos]"),
          wrongLast,
        ],
        hints: [
          `Where does each ${cls.toLowerCase()}'s list live? If it's made once for the whole class, every ${cls.toLowerCase()} shares it.`,
          "`self.eggs = []` inside `__init__` gives every hen her own list; `self.eggs.append(3)` adds to it. `max(...)` and `min(...)` work on a list, but not on an empty one.",
          twist === "heaviest" ? "In `heaviest`: if the list is empty, `return 0`; otherwise `return ___(self.items)`." : "In `spread`: if the list is empty, `return 0`; otherwise `return max(self.items) - ___(self.items)`.",
        ],
        needs: [
          [`class\\s+${cls}\\b`, `Wren asks for a class named ${cls}.`],
          [`def\\s+${method}\\s*\\(\\s*self`, `Give ${cls} a method ${method}, with self in its brackets.`],
        ],
        advice: "Check an empty one, and two at once.",
        codex: ["init", "methods", "list-maths"],
      };
    },
  },
  {
    id: "gh-pantry",
    topics: ["library", "guildhall"],
    difficulty: 2,
    make(r): Spec {
      const cls = r.pick(["Pantry", "Larder"]);
      const [i1, i2, i3] = r.sample(FOOD, 3);
      const [a, b, c] = [r.int(2, 9), r.int(2, 9), r.int(1, 6)];
      const body = `class ${cls}:\n    def __init__(self):\n        self.stock = {}\n\n    def store(self, item, n):\n        self.stock[item] = self.stock.get(item, 0) + n\n\n    def take(self, item, n):\n        if self.stock.get(item, 0) >= n:\n            self.stock[item] -= n\n            return True\n        return False\n\n    def count(self, item):\n        return self.stock.get(item, 0)`;
      return {
        title: `The ${cls} Book`,
        topic: "a class holding a dictionary",
        task: [
          `Write a class \`${cls}\`. \`${cls}()\` starts with nothing in it, and each ${cls.toLowerCase()} keeps its own stock.`,
          "`store(item, n)` puts n more of that item in. `count(item)` hands back how many there are, which is 0 for something never stored.",
          "`take(item, n)` takes n out and answers True, but only when there are at least n. When there aren't, it changes nothing and answers False.",
        ],
        plan: ["Your class goes here"],
        body,
        drive: `p = ${cls}()\np.store("${i1}", ${a})\np.store("${i2}", ${b})\np.store("${i1}", ${c})\nprint(p.count("${i1}"), p.count("${i2}"), p.count("${i3}"))\nprint(p.take("${i1}", ${a + c + 1}))\nprint(p.take("${i2}", ${b}))\nprint(p.count("${i1}"), p.count("${i2}"))`,
        variants: [
          { drive: `q = ${cls}()\nprint(q.take("${i3}", 1))\nprint(q.count("${i3}"))`, note: "An empty pantry: nothing to take." },
          { drive: `p = ${cls}()\nq = ${cls}()\np.store("${i2}", 4)\nq.store("${i2}", 1)\nprint(p.take("${i2}", 3), q.take("${i2}", 3))\nprint(p.count("${i2}"), q.count("${i2}"))`, note: "Two pantries, each with its own stock." },
        ],
        wrong: [
          body.replace("self.stock[item] = self.stock.get(item, 0) + n", "self.stock[item] = n"),
          body.replace(">= n", "> n"),
          body.replace("    def count(self, item):\n        return self.stock.get(item, 0)", "    def count(self, item):\n        return self.stock[item]"),
          body.replace("    def __init__(self):\n        self.stock = {}", "    stock = {}\n\n    def __init__(self):\n        pass"),
        ],
        hints: [
          "A dictionary from item to how many fits this well. What should happen the first time an item is stored, or counted before it ever was?",
          "`self.jars = {}` in `__init__` gives each shelf its own dictionary. `self.jars.get(\"plum\", 0)` gives 0 instead of a KeyError when plum isn't there.",
          "In `take`: `if self.stock.get(item, 0) ___ n:` take them and answer True; otherwise answer False.",
        ],
        needs: [
          [`class\\s+${cls}\\b`, `Wren asks for a class named ${cls}.`],
          ["\\{\\s*\\}|dict\\(", "Keep the stock in a dictionary: that's today's practice."],
        ],
        advice: "Check the counts after every store and take.",
        codex: ["init", "methods", "dict-safe"],
      };
    },
  },
];
