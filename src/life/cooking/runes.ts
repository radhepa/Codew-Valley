import type { LifeRune } from "../context.ts";

// Cooking's village runes (LifeRune in ../context.ts). Plain data: the Node content tests import
// it (npm test -- life). Each switches on a nice-to-have at the hearth (state.ts):
//   cook-guest-pot   (tavern Python: maths and f-strings)  every pot dish makes an extra bowl
//   cook-batch-bake  (bakery Python: for loops)            cook several of a dish in one go
const r = String.raw;

// again("guests = 20", "guests = 13") -> (variables, printed lines) of the program with another
// starting value, so typed-in answers fail (the same helper as tavern.ts).
const PRE = r`def again(old, new):
    check(old in src, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
    try:
        return rerun(src.replace(old, new, 1))
    except Exception as e:
        check(False, "When " + new + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the variables so it fits any starting value, not just tonight's.")

`;

export const GUEST_POT: LifeRune = {
  id: "cook-guest-pot",
  requires: "tavern",
  reward: "Every pot dish you cook makes one extra bowl.",
  part: "The Guest Pot",
  title: "Soup for a Crowd",
  topic: "// and % for sharing out",
  cost: { wood: 0, stone: 0 },
  intro: [
    "Bram: Friend! A caravan's just pulled up. Twenty hungry drivers, and my big pot only fills six bowls.",
    "Bram: Before I start peeling I need my sums: how many full pots, how many folk left waiting after that, and how many potatoes. Can your runes do sums?",
  ],
  codex: ["math", "fstrings"],
  quiz: {
    code: r`print(22 // 6, 22 % 6)`,
    question: "What does this program show?",
    options: ["3 4", "3.67 4", "4 3", "3 4.0"],
    answer: 0,
    why: "22 // 6 is how many whole sixes fit in 22 (three), and 22 % 6 is what's left over after them (four).",
  },
  task: [
    "`full_pots`: how many pots the guests fill completely.",
    "`waiting`: how many guests are still waiting once the full pots are served.",
    "`potatoes`: what the full pots need, at `potatoes_per_pot` each.",
    "Print one line for Bram, in the shape `<pots> full pots, <waiting> waiting, <potatoes> potatoes`, built from your variables.",
    "It must still add up if a different crowd turns up, or Bram buys a different pot.",
  ],
  starter: r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4

# full_pots =
# waiting =
# potatoes =

`,
  tests:
    PRE +
    r`for name in ["full_pots", "waiting", "potatoes"]:
    check(name in ns, "Make a variable called " + name + ".")
check(type(ns["full_pots"]) == int, "full_pots should be a whole number of pots, not " + repr(ns["full_pots"]) + ". One kind of division throws the remainder away.")
check(ns["full_pots"] == 3, "20 guests fill 3 whole pots of 6 bowls, but full_pots is " + repr(ns["full_pots"]) + ". A pot only counts when it's full.")
check(ns["waiting"] == 2, "After 3 full pots (18 bowls), 2 guests are still waiting, but waiting is " + repr(ns["waiting"]) + ".")
check(ns["potatoes"] == 12, "3 full pots at 4 potatoes each need 12 potatoes, but potatoes is " + repr(ns["potatoes"]) + ". Count potatoes for the full pots, not for every guest.")
expect_lines(["3 full pots, 2 waiting, 12 potatoes"])
v1, l1 = again("guests = 20", "guests = 13")
check(v1.get("full_pots") == 2 and v1.get("waiting") == 1, "With 13 guests there are 2 full pots and 1 guest waiting. Work it out from guests and bowls_per_pot instead of typing the numbers.")
check(l1 == ["2 full pots, 1 waiting, 8 potatoes"], "With 13 guests Bram's line should change too. Build it from your variables.")
v5, l5 = again("guests = 20", "guests = 23")
check(v5.get("full_pots") == 3 and v5.get("waiting") == 5, "With 23 guests only 3 pots are full (18 bowls) and 5 guests wait. A nearly-full pot still isn't full: don't round up.")
v2, l2 = again("guests = 20", "guests = 18")
check(v2.get("full_pots") == 3 and v2.get("waiting") == 0, "With exactly 18 guests every pot is full and nobody waits: 3 full pots, 0 waiting.")
v3, l3 = again("bowls_per_pot = 6", "bowls_per_pot = 5")
check(v3.get("full_pots") == 4 and v3.get("waiting") == 0 and v3.get("potatoes") == 16, "If Bram's pot held 5 bowls, 20 guests would fill 4 pots, nobody would wait, and he'd need 16 potatoes. Use bowls_per_pot.")
v4, l4 = again("potatoes_per_pot = 4", "potatoes_per_pot = 5")
check(v4.get("potatoes") == 15, "If each pot took 5 potatoes, 3 full pots would need 15. Use potatoes_per_pot.")`,
  hints: [
    "Share it out on paper first: twenty people, six bowls to a pot. How many pots get completely filled, and how many people are left over once they're served?",
    "`//` divides and throws away the remainder, and `%` gives only the remainder: `14 // 4` is 3 and `14 % 4` is 2. An f-string like `f\"{a} apples, {b} pears\"` drops variables into one line.",
    "`full_pots = guests // ...`, `waiting = ... % bowls_per_pot`, `potatoes = full_pots * ...`, then one `print(f\"...\")` with all three in braces.",
  ],
  solution: r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = guests // bowls_per_pot
waiting = guests % bowls_per_pot
potatoes = full_pots * potatoes_per_pot
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
  wrong: [
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = 3
waiting = 2
potatoes = 12
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = guests / bowls_per_pot
waiting = guests % bowls_per_pot
potatoes = full_pots * potatoes_per_pot
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = round(guests / bowls_per_pot)
waiting = guests % bowls_per_pot
potatoes = full_pots * potatoes_per_pot
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = guests // bowls_per_pot
waiting = guests // bowls_per_pot
potatoes = full_pots * potatoes_per_pot
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = guests // bowls_per_pot
waiting = guests % bowls_per_pot
potatoes = guests * potatoes_per_pot
print(f"{full_pots} full pots, {waiting} waiting, {potatoes} potatoes")`,
    r`guests = 20
bowls_per_pot = 6
potatoes_per_pot = 4
full_pots = guests // bowls_per_pot
waiting = guests % bowls_per_pot
potatoes = full_pots * potatoes_per_pot
print("3 full pots, 2 waiting, 12 potatoes")`,
  ],
  done: "Bram: Three pots and two drivers waiting... I'll stretch the last pot with an extra ladle of broth. From now on, every pot gets an extra bowl!",
};

export const BATCH_BAKE: LifeRune = {
  id: "cook-batch-bake",
  requires: "bakery",
  reward: "Cook several of the same dish in one go.",
  part: "The Batch Bake",
  title: "The Morning Orders",
  topic: "for loops and totals",
  cost: { wood: 0, stone: 0 },
  intro: [
    "Hazel: Orders. A list of them, one number per order, each the loaves someone wants. Every loaf takes the same flour.",
    "Hazel: I want a line per order, numbered from one, so I can tick them off. Then the totals. Do it once properly and the oven can bake a whole batch in one go.",
  ],
  codex: ["for-loops", "enumerate", "accumulators"],
  quiz: {
    code: r`total = 0
for n in [2, 5, 1]:
    total += n
print(total)`,
    question: "What does this program show?",
    options: ["8", "1", "3", "251"],
    answer: 0,
    why: "The loop adds each number to total in turn: 0 + 2 + 5 + 1 is 8. It prints once, after the loop.",
  },
  task: [
    "For each order, print a line numbered from 1, in the shape `Order <n>: <loaves> loaves, <flour> flour`.",
    "After the orders, print `Total: <loaves> loaves, <flour> flour` for all of them together.",
    "Work it all out from `orders` and `flour_per_loaf`: tomorrow's list will be different.",
  ],
  starter: r`orders = [3, 2, 4, 2]
flour_per_loaf = 2

# 1. A line for each order, numbered from 1
# 2. The totals, once, at the end
`,
  tests:
    PRE +
    r`check(len(lines) > 0, "Nothing was printed yet. Hazel wants a line per order.")
check(lines[0].startswith("Order 1:"), "The first line should be for order 1 (Hazel counts from one), but it is: " + lines[0])
check(lines[0] == "Order 1: 3 loaves, 6 flour", "The first order is 3 loaves at 2 flour each. Its line should say 3 loaves, 6 flour, but it says: " + lines[0])
check(len(lines) == 5, "Hazel wants one line per order (4 of them) and then one line of totals: 5 lines, but there are " + str(len(lines)) + ". Is the totals line inside the loop?")
expect_lines(["Order 1: 3 loaves, 6 flour", "Order 2: 2 loaves, 4 flour", "Order 3: 4 loaves, 8 flour", "Order 4: 2 loaves, 4 flour", "Total: 11 loaves, 22 flour"])
v1, l1 = again("orders = [3, 2, 4, 2]", "orders = [5, 2]")
check(l1[:2] == ["Order 1: 5 loaves, 10 flour", "Order 2: 2 loaves, 4 flour"], "With orders [5, 2] there should be just two order lines. Loop over the orders list instead of writing a line for each.")
check(l1[2:] == ["Total: 7 loaves, 14 flour"], "With orders [5, 2] the totals should be 7 loaves and 14 flour. Add each order up as the loop goes.")
v2, l2 = again("flour_per_loaf = 2", "flour_per_loaf = 3")
check(l2 == ["Order 1: 3 loaves, 9 flour", "Order 2: 2 loaves, 6 flour", "Order 3: 4 loaves, 12 flour", "Order 4: 2 loaves, 6 flour", "Total: 11 loaves, 33 flour"], "If a loaf took 3 flour every line should change. Use flour_per_loaf.")
v3, l3 = again("orders = [3, 2, 4, 2]", "orders = []")
check(l3 == ["Total: 0 loaves, 0 flour"], "On a quiet morning with no orders, there are no order lines and the totals are 0 loaves, 0 flour. Start your totals at 0 before the loop.")`,
  hints: [
    "Do it by hand for the first two orders: what goes on each line, and what do you keep a running count of? A loop can do the same thing for every order.",
    "`for i, x in enumerate(things, 1):` gives each item with a number counting from 1. A total starts at 0 before the loop and grows inside it: `count += x`.",
    "Start `total_loaves = 0` and `total_flour = 0`. Inside `for n, loaves in enumerate(orders, 1):` work out `flour = loaves * ...`, print the order line and add to both totals. Print the totals after the loop.",
  ],
  solution: r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
total_loaves = 0
total_flour = 0
for n, loaves in enumerate(orders, 1):
    flour = loaves * flour_per_loaf
    print(f"Order {n}: {loaves} loaves, {flour} flour")
    total_loaves += loaves
    total_flour += flour
print(f"Total: {total_loaves} loaves, {total_flour} flour")`,
  wrong: [
    r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
total_loaves = 0
total_flour = 0
for n, loaves in enumerate(orders):
    flour = loaves * flour_per_loaf
    print(f"Order {n}: {loaves} loaves, {flour} flour")
    total_loaves += loaves
    total_flour += flour
print(f"Total: {total_loaves} loaves, {total_flour} flour")`,
    r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
total_loaves = 0
total_flour = 0
for n, loaves in enumerate(orders, 1):
    flour = loaves * flour_per_loaf
    print(f"Order {n}: {loaves} loaves, {flour} flour")
    total_loaves += loaves
    total_flour += flour
    print(f"Total: {total_loaves} loaves, {total_flour} flour")`,
    r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
for n, loaves in enumerate(orders, 1):
    flour = loaves * flour_per_loaf
    print(f"Order {n}: {loaves} loaves, {flour} flour")
print("Total: 11 loaves, 22 flour")`,
    r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
total_loaves = 0
for n, loaves in enumerate(orders, 1):
    print(f"Order {n}: {loaves} loaves, {loaves * 2} flour")
    total_loaves += loaves
print(f"Total: {total_loaves} loaves, {total_loaves * 2} flour")`,
    r`orders = [3, 2, 4, 2]
flour_per_loaf = 2
print("Order 1: 3 loaves, 6 flour")
print("Order 2: 2 loaves, 4 flour")
print("Order 3: 4 loaves, 8 flour")
print("Order 4: 2 loaves, 4 flour")
print("Total: 11 loaves, 22 flour")`,
  ],
  done: "Hazel: Eleven loaves, twenty-two scoops, every order ticked. Good. From now on, cook a batch at once: one go at the oven or the hearth, as many as you like.",
};

export const COOKING_RUNES: LifeRune[] = [GUEST_POT, BATCH_BAKE];
