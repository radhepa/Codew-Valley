import type { Spec, Template } from "../build.ts";
import { CROPS, PEOPLE } from "../rng.ts";

// Market Square: lists (indexes, methods, sorting, sum/min/max, slicing, walking with while).

const weights = (r: { int(a: number, b: number): number }, n: number) => Array.from({ length: n }, () => r.int(8, 40));
const L = (...lines: string[]) => lines.join("\n");

export const MARKET: Template[] = [
  {
    id: "mk-sacks",
    topics: ["market"],
    difficulty: 1,
    make(r): Spec {
      const n = r.int(4, 6);
      const who = r.sample(PEOPLE, n);
      const kg = weights(r, n);
      const twist = r.pick(["name", "second", "spread"] as const);
      const other = r.sample(PEOPLE, 4);
      if (twist === "name")
        return {
          title: "The Heaviest Sack",
          topic: "lists: max and index",
          task: ["Each neighbour brought Wren one sack of grain. The two lists line up: the first name goes with the first weight.", "Print the name of whoever brought the heaviest sack, and nothing else.", "If two sacks tie for heaviest, the one who came first wins."],
          data: { names: who, kilos: kg },
          plan: ["Find the heaviest weight", "Find where it sits in its list", "The name at the same place"],
          body: "top = max(kilos)\nspot = kilos.index(top)\nprint(names[spot])",
          variants: [
            { data: { names: other, kilos: [12, 31, 7, 20] } },
            { data: { names: other, kilos: [25, 9, 25, 3] }, note: "Two sacks weigh the same here: the one who came first wins." },
            { data: { names: other.slice(0, 1), kilos: [14] }, note: "Only one sack today." },
          ],
          wrong: ["print(names[kilos.index(min(kilos))])", "print(max(names))", "print(names[max(kilos)])", "top = max(kilos)\nprint(top)"],
          hints: [
            "Two questions in a row: how heavy is the heaviest sack, and where in the list does it sit? The name lives at that same place in the other list.",
            "`max(eggs)` gives the biggest value; `eggs.index(12)` says where 12 first sits; `hens[2]` is the hen at place 2.",
            "`spot = kilos.index(max(kilos))`, then print the item of `names` at ___.",
          ],
          needs: [["max\\(|sort", "Let Python find the heaviest: today's numbers are only today's."]],
          advice: "Just the name, nothing else on the line.",
        };
      if (twist === "second")
        return {
          title: "Second in Line",
          topic: "lists: sorting",
          task: ["Wren lines today's sacks up from heaviest to lightest.", "Print the weight of the sack that ends up second in that line, as a plain number."],
          data: { kilos: kg },
          plan: ["Put the weights in order", "Pick out the second heaviest"],
          body: "line = sorted(kilos, reverse=True)\nprint(line[1])",
          variants: [
            { data: { kilos: [12, 31, 7, 20] } },
            { data: { kilos: [25, 9, 25, 3] }, note: "Two sacks weigh the same: both stand in the line." },
            { data: { kilos: [5, 40] } },
          ],
          wrong: ["print(sorted(kilos)[1])", "print(sorted(kilos, reverse=True)[2])", "kilos.sort()\nprint(kilos[1])", "print(kilos[1])"],
          hints: [
            "Line the sacks up first. Which end of the line is the heaviest, and which place is second?",
            "`sorted(loaves)` gives a new list from small to big; `sorted(loaves, reverse=True)` from big to small. Places start at 0.",
            "`line = sorted(kilos, reverse=True)` and then print `line[___]`.",
          ],
          advice: "One number: the weight of the second sack in the line.",
        };
      return {
        title: "Heaviest Against Lightest",
        topic: "lists: min and max",
        task: ["Wren wants to know how uneven today's sacks are.", "Print how many kilos heavier the heaviest sack is than the lightest, as a plain number."],
        data: { kilos: kg },
        plan: ["The heaviest", "The lightest", "The difference"],
        body: "print(max(kilos) - min(kilos))",
        variants: [{ data: { kilos: [12, 31, 7, 20] } }, { data: { kilos: [18, 18, 18] }, note: "All the sacks weigh the same today." }, { data: { kilos: [40, 5] } }],
        wrong: ["print(kilos[-1] - kilos[0])", "print(min(kilos) - max(kilos))", "print(max(kilos) + min(kilos))"],
        hints: [
          "Two numbers matter here, and neither of them is the first or the last sack.",
          "`max(jars)` and `min(jars)` find the biggest and smallest value in a list, wherever they sit.",
          "`print(max(kilos) ___ min(kilos))`",
        ],
        needs: [["max\\(|sort", "Let Python find the heaviest and lightest, so it works on any day's sacks."]],
        advice: "One number on its own.",
      };
    },
  },
  {
    id: "mk-stall",
    topics: ["market"],
    difficulty: 1,
    make(r): Spec {
      const row = r.sample(CROPS, r.int(4, 6));
      const fresh = r.pick(CROPS.filter((c) => !row.includes(c)));
      const twist = r.pick(["swap", "sold", "cart"] as const);
      const stall = "Sable's stall is a row of crates, one crop each, listed from the near end to the far end.";
      if (twist === "swap")
        return {
          title: "A Soft Crate",
          topic: "lists: changing an item",
          task: [stall, "The crate at the far end has gone soft. Put a crate of `fresh` in its place; every other crate stays where it is.", "Print the row afterwards."],
          data: { row, fresh },
          plan: ["Swap the crate at the far end", "Show the row"],
          body: L("row[-1] = fresh", "print(row)"),
          variants: [
            { data: { row: ["potato", "mint", "garlic"], fresh: "wheat" } },
            { data: { row: ["cabbage"], fresh: "carrot" }, note: "Only one crate today: it is the near end and the far end at once." },
            { data: { row: ["mint", "wheat", "mint", "wheat", "pumpkin", "garlic", "carrot"], fresh: "strawberry" }, note: "A longer row than today's." },
          ],
          wrong: [L("row[len(row)] = fresh", "print(row)"), L("row.append(fresh)", "print(row)"), L("row[0] = fresh", "print(row)"), L("row[4] = fresh", "print(row)")],
          hints: [
            "The far end moves when the row is longer or shorter. Is there a way to name the last place without counting?",
            "`jars[-1]` is the last jar, however many there are. `jars[2] = \"fig\"` puts a fig at place 2 and drops what was there.",
            "`row[___] = fresh`, then print the row.",
          ],
          advice: "Print the whole row, after the swap.",
          codex: ["list-index", "lists"],
        };
      if (twist === "sold") {
        const gone = r.pick(row);
        const at = row.indexOf(gone);
        const twice = [...row];
        if (r.chance(0.5)) twice.splice(r.int(at + 1, twice.length), 0, gone);
        return {
          title: "One Crate Sold",
          topic: "lists: remove and insert",
          task: [
            stall,
            "A buyer just took a crate of `gone`. If the row has more than one, they took the one nearest the near end.",
            "Take that crate out of the row, put a crate of `fresh` at the very front (the near end), then print the row.",
          ],
          data: { row: twice, gone, fresh },
          plan: ["Take out the crate that was bought", "A new crate at the front", "Show the row"],
          body: L("row.remove(gone)", "row.insert(0, fresh)", "print(row)"),
          variants: [
            { data: { row: ["mint", "garlic", "mint", "wheat"], gone: "mint", fresh: "carrot" }, note: "Two crates of mint: only the nearest one was bought." },
            { data: { row: ["wheat", "potato", "cabbage"], gone: "cabbage", fresh: "pumpkin" }, note: "The crate that was bought is at the far end." },
            { data: { row: ["garlic"], gone: "garlic", fresh: "mint" }, note: "Only one crate, and it was bought." },
          ],
          wrong: [
            L("row.pop(0)", "row.insert(0, fresh)", "print(row)"),
            L("row.remove(gone)", "row.append(fresh)", "print(row)"),
            L("row[row.index(gone)] = fresh", "print(row)"),
            L("row.remove(gone)", "row.insert(1, fresh)", "print(row)"),
          ],
          hints: [
            "Two jobs, in order: take one crate out by what's in it, then slide a new one in ahead of all the others.",
            "`jars.remove(\"plum\")` takes out the first plum only. `jars.insert(2, \"fig\")` slides a fig in at place 2 and pushes the rest along.",
            "`row.remove(gone)`, then `row.insert(___, fresh)`, then print the row.",
          ],
          advice: "Print the whole row, after both changes.",
          codex: ["list-methods"],
        };
      }
      return {
        title: "Onto the Cart",
        topic: "lists: pop",
        task: [stall, "The crate at the far end goes onto Wren's cart: take it off the row, so it isn't on the stall any more.", "Print the crop that went on the cart, and on the next line the row that's left."],
        data: { row },
        plan: ["Take the far crate off, keeping hold of it", "Show the crop on the cart", "Show the row"],
        body: L("cart = row.pop()", "print(cart)", "print(row)"),
        variants: [{ data: { row: ["potato", "mint", "garlic"] } }, { data: { row: ["wheat"] }, note: "One crate: once it's on the cart, the stall is empty." }],
        wrong: [L("cart = row.pop(0)", "print(cart)", "print(row)"), L("cart = row[-1]", "print(cart)", "print(row)"), L("row.pop()", "print(row[-1])", "print(row)")],
        hints: [
          "Taking a crate off and remembering what it was can happen in one step, if you keep what comes back.",
          "`last = jars.pop()` takes the last jar off the list and keeps it in `last`. `jars.pop(0)` would take the first.",
          "`cart = row.___()`, then print `cart`, then the row.",
        ],
        advice: "Two lines: the crop on the cart, then the row.",
        codex: ["list-methods"],
      };
    },
  },
  {
    id: "mk-fair",
    topics: ["market"],
    difficulty: 2,
    make(r): Spec {
      const baskets = Array.from({ length: r.int(5, 7) }, () => r.int(3, 15));
      const twist = r.pick(["mean", "trimmed", "recent"] as const);
      if (twist === "mean")
        return {
          title: "The Picking Fair",
          topic: "lists: averages",
          task: [
            "At the picking fair everyone hands in one basket, and Wren writes down how many kilos of berries were in it.",
            "Print the average basket, rounded to one place after the point.",
            "On a day with no baskets at all, print 0 instead.",
          ],
          data: { baskets },
          plan: ["No baskets? Then 0", "Otherwise the average, rounded"],
          body: L("if len(baskets) == 0:", "    print(0)", "else:", "    print(round(sum(baskets) / len(baskets), 1))"),
          variants: [
            { data: { baskets: [3, 4, 4] }, note: "The average here doesn't come out even: round it to one place." },
            { data: { baskets: [] }, note: "Nobody came to the fair: no baskets at all." },
            { data: { baskets: [4, 6] } },
            { data: { baskets: [9] } },
          ],
          wrong: [
            "print(round(sum(baskets) / len(baskets), 1))",
            L("if len(baskets) == 0:", "    print(0)", "else:", "    print(round(sum(baskets) / len(baskets)))"),
            L("if len(baskets) == 0:", "    print(0)", "else:", "    print(sum(baskets) // len(baskets))"),
            L("if len(baskets) == 0:", "    print(0)", "else:", "    print(round(sum(baskets) / 6, 1))"),
          ],
          hints: [
            "An average is the whole lot shared out evenly. Think about the empty day first: what would sharing nothing between nobody do?",
            "`sum(jars)` adds a list up and `len(jars)` counts it. `round(17 / 6, 1)` keeps one place after the point. `if len(jars) == 0:` catches an empty list.",
            "Inside the else: `print(round(sum(baskets) / ___, 1))`.",
          ],
          needs: [["sum\\(|while", "Let Python add the baskets up, so it works on any day's list."]],
          advice: "One number: the average rounded to one place, or 0 on an empty day.",
          codex: ["list-maths"],
        };
      if (twist === "trimmed")
        return {
          title: "The Judges' Average",
          topic: "lists: sorting and slicing",
          task: [
            "At the picking fair everyone hands in one basket of berries, and Wren writes down its kilos.",
            "The judges set aside the single heaviest basket and the single lightest one, then take the average of the rest.",
            "Print that average, rounded to one place after the point.",
          ],
          data: { baskets },
          plan: ["Line the baskets up by weight", "Leave out both ends", "Average what's left, rounded"],
          body: L("line = sorted(baskets)", "rest = line[1:-1]", "print(round(sum(rest) / len(rest), 1))"),
          variants: [
            { data: { baskets: [9, 2, 9, 5] }, note: "Two baskets tie for heaviest: only one of them is set aside." },
            { data: { baskets: [4, 8, 6] }, note: "Three baskets: only the middle one is left." },
            { data: { baskets: [7, 3, 7, 7, 12, 1] } },
          ],
          wrong: [
            L("rest = baskets[1:-1]", "print(round(sum(rest) / len(rest), 1))"),
            L("rest = sorted(baskets)[1:]", "print(round(sum(rest) / len(rest), 1))"),
            L("rest = sorted(baskets)[1:-1]", "print(round(sum(rest) / len(baskets), 1))"),
            L("rest = sorted(baskets)[2:-2]", "print(round(sum(rest) / len(rest), 1))"),
          ],
          hints: [
            "Once the baskets stand in order from light to heavy, the two to set aside are easy to find. Where are they?",
            "`sorted(jars)` gives a new list from small to big. `jars[1:]` is everything but the first; `jars[:-1]` everything but the last.",
            "`rest = sorted(baskets)[___]`, then the average of `rest`, rounded to one place.",
          ],
          needs: [["sort", "Line the baskets up by weight first: today's order is only today's."]],
          advice: "One number: the average of the middle baskets, rounded to one place.",
          codex: ["list-slicing", "sorting", "list-maths"],
        };
      const days = r.int(2, baskets.length - 1);
      return {
        title: "This Week's Baskets",
        topic: "lists: slicing",
        task: ["Wren writes down every basket of berries brought to the stall, newest at the end of the list.", "Only the newest `days` baskets count this week. Print their average, rounded to one place after the point."],
        data: { baskets, days },
        plan: ["Cut out the newest baskets", "Their average, rounded"],
        body: L("newest = baskets[-days:]", "print(round(sum(newest) / len(newest), 1))"),
        variants: [
          { data: { baskets: [3, 10, 4, 4, 5], days: 3 }, note: "The newest three, rounded." },
          { data: { baskets: [6, 2, 9], days: 3 }, note: "Every basket counts this week." },
          { data: { baskets: [5, 8, 11, 2], days: 1 }, note: "Only the newest basket counts." },
        ],
        wrong: [
          L("newest = baskets[:days]", "print(round(sum(newest) / len(newest), 1))"),
          L("newest = baskets[days:]", "print(round(sum(newest) / len(newest), 1))"),
          L("newest = baskets[-days:]", "print(round(sum(newest) / len(baskets), 1))"),
          L("newest = baskets[-days:-1]", "print(round(sum(newest) / len(newest), 1))"),
        ],
        hints: [
          "Count from the end of the list, not the start. How do you say \"the last few\" without knowing how long the list is?",
          "`jars[-2:]` is the last two jars; `jars[:2]` is the first two. `round(17 / 6, 1)` keeps one place after the point.",
          "`newest = baskets[___]`, then the average of `newest`, rounded.",
        ],
        needs: [["\\[[^\\]]*:", "Cut the newest baskets out of the list with a slice."]],
        advice: "One number: the average of the newest baskets, rounded to one place.",
        codex: ["list-slicing", "list-maths"],
      };
    },
  },
  {
    id: "mk-board",
    topics: ["market"],
    difficulty: 2,
    make(r): Spec {
      const n = r.int(4, 6);
      const crops = r.sample(CROPS, n);
      const prices = r.ints(n, 2, 12);
      const wanted = r.pick(crops);
      const twist = r.pick(["ask", "raise", "cheapest"] as const);
      const board = "Sable's price board is two lists that line up: the first price is for the first crop, and so on.";
      if (twist === "ask")
        return {
          title: "Asking the Price",
          topic: "lists in step",
          task: [board, "A shopper asks about `wanted`. Print just its price.", "If it isn't on the board at all, print `sold out` instead."],
          data: { crops, prices, wanted },
          plan: ["Is it on the board?", "Where it sits, and the price at that place"],
          body: L("if wanted in crops:", "    spot = crops.index(wanted)", "    print(prices[spot])", "else:", '    print("sold out")'),
          variants: [
            { data: { crops: ["mint", "garlic", "wheat"], prices: [4, 9, 3], wanted: "wheat" }, note: "The crop is the last one on the board." },
            { data: { crops: ["carrot", "potato"], prices: [5, 2], wanted: "pumpkin" }, note: "Pumpkin isn't on the board today." },
            { data: { crops: ["cabbage", "mint", "cabbage"], prices: [6, 3, 8], wanted: "cabbage" }, note: "Cabbage is written up twice: the first price is the one that counts." },
          ],
          wrong: [
            L("spot = crops.index(wanted)", "print(prices[spot])"),
            L("if wanted in crops:", "    print(crops.index(wanted))", "else:", '    print("sold out")'),
            L("if wanted in crops:", "    print(prices[crops.index(wanted) + 1])", "else:", '    print("sold out")'),
          ],
          hints: [
            "Two steps: where does the crop sit on the board, and what price sits at that same place? Ask first whether it's there at all.",
            "`if \"fig\" in jams:` asks before you look. `jams.index(\"fig\")` says where the first fig sits, and `costs[2]` is the cost at place 2.",
            "Inside the if: `print(prices[crops.index(___)])`; the else prints the sold-out words.",
          ],
          advice: "Just the price on its own, or the sold-out words.",
          codex: ["parallel-lists", "list-search"],
        };
      if (twist === "raise") {
        const extra = r.int(1, 3);
        return {
          title: "Selling Fast",
          topic: "lists in step",
          task: [board, "`wanted` is selling fast, so Sable puts its price up by `extra` coins.", "Print the list of prices afterwards."],
          data: { crops, prices, wanted, extra },
          plan: ["Where the crop sits", "Put the price at that place up", "Show the prices"],
          body: L("spot = crops.index(wanted)", "prices[spot] += extra", "print(prices)"),
          variants: [
            { data: { crops: ["mint", "garlic", "wheat"], prices: [4, 9, 3], wanted: "mint", extra: 2 }, note: "The first crop on the board goes up." },
            { data: { crops: ["carrot", "potato", "cabbage", "pumpkin"], prices: [5, 2, 6, 11], wanted: "pumpkin", extra: 1 }, note: "The last crop on the board goes up." },
          ],
          wrong: [
            L("spot = crops.index(wanted)", "prices[spot] = extra", "print(prices)"),
            L("spot = crops.index(wanted)", "prices[spot + 1] += extra", "print(prices)"),
            L("prices.append(extra)", "print(prices)"),
            L("spot = crops.index(wanted)", "print(prices[spot] + extra)"),
          ],
          hints: [
            "Find where the crop sits on one list; its price sits at the same place on the other. Then change that one price.",
            "`spot = jams.index(\"fig\")` finds the fig. `costs[spot] += 3` makes the cost at that place 3 more.",
            "`spot = crops.index(wanted)`, then `prices[spot] ___ extra`, then print the prices.",
          ],
          advice: "Print the whole list of prices, after the change.",
          codex: ["parallel-lists", "list-index"],
        };
      }
      return {
        title: "The Bargain",
        topic: "lists in step",
        task: [board, "Print the cheapest crop on the board: its name, a colon and a space, then its price.", "If two crops tie for cheapest, the one nearer the top of the board wins."],
        data: { crops, prices },
        plan: ["The lowest price", "Where it sits", "The crop at that place, and the price"],
        body: L("low = min(prices)", "spot = prices.index(low)", 'print(crops[spot] + ": " + str(low))'),
        variants: [
          { data: { crops: ["mint", "garlic", "wheat"], prices: [4, 9, 3] } },
          { data: { crops: ["carrot", "potato", "cabbage"], prices: [5, 2, 2] }, note: "Two crops tie for cheapest: the one nearer the top wins." },
          { data: { crops: ["pumpkin"], prices: [11] } },
        ],
        wrong: [
          L("low = max(prices)", "spot = prices.index(low)", 'print(crops[spot] + ": " + str(low))'),
          L("low = min(prices)", 'print(min(crops) + ": " + str(low))'),
          L("low = min(prices)", "spot = prices.index(low)", 'print(crops[spot] + ": " + str(spot))'),
          L("low = min(prices)", "spot = prices.index(low)", "print(crops[spot], low)"),
        ],
        hints: [
          "Find the lowest price first, then work out where it sits. The crop's name lives at that same place on the other list.",
          "`min(costs)` is the smallest number; `costs.index(2)` says where the first 2 sits; `str(5)` turns a number into text you can join on.",
          "`spot = prices.index(min(prices))`, then print `crops[spot]`, a colon and a space, and ___.",
        ],
        advice: "One line: the crop's name, a colon and a space, then its price.",
        codex: ["parallel-lists", "list-search"],
      };
    },
  },
  {
    id: "mk-walk",
    topics: ["market"],
    difficulty: 3,
    make(r): Spec {
      const twist = r.pick(["bill", "goal", "cart"] as const);
      const walk: [string, string] = ["\\bwhile\\b", "This one is while-loop practice: let a while loop do the walking."];
      if (twist === "bill") {
        const n = r.int(4, 5);
        const crops = r.sample(CROPS, n);
        const prices = r.ints(n, 2, 12);
        const basket = Array.from({ length: r.int(2, 4) }, () => r.pick(crops));
        return {
          title: "Adding Up the Basket",
          topic: "walking a list with while",
          task: [
            "Sable's price board is two lists that line up: the first price is for the first crop, and so on.",
            "A shopper hands over `basket`, one crop per thing they're buying (the same crop can come twice).",
            "Walk through the basket one item at a time, find each item's price on the board, and add up the bill. Print the bill as one number.",
          ],
          data: { crops, prices, basket },
          plan: ["Start the bill at nothing", "Walk the basket with an index", "Add each item's price", "Show the bill"],
          body: L("bill = 0", "i = 0", "while i < len(basket):", "    item = basket[i]", "    bill += prices[crops.index(item)]", "    i += 1", "print(bill)"),
          variants: [
            { data: { crops: ["mint", "garlic", "wheat"], prices: [4, 9, 3], basket: ["wheat", "mint", "wheat"] }, note: "Wheat comes twice: it's paid for twice." },
            { data: { crops: ["carrot", "potato"], prices: [5, 2], basket: [] }, note: "An empty basket costs nothing." },
            { data: { crops: ["cabbage", "pumpkin", "mint", "carrot"], prices: [6, 11, 3, 5], basket: ["carrot"] } },
          ],
          wrong: [
            L("bill = 0", "i = 0", "while i <= len(basket):", "    bill += prices[crops.index(basket[i])]", "    i += 1", "print(bill)"),
            L("bill = 0", "i = 0", "while i < len(basket) - 1:", "    bill += prices[crops.index(basket[i])]", "    i += 1", "print(bill)"),
            L("bill = 0", "i = 0", "while i < len(basket):", "    bill += prices[i]", "    i += 1", "print(bill)"),
            L("bill = 0", "i = 0", "while i < len(basket):", "    bill = prices[crops.index(basket[i])]", "    i += 1", "print(bill)"),
          ],
          hints: [
            "Keep a running bill and a place in the basket. Each round: look at the item at that place, find its price, add it on, move along. Stop before you fall off the end.",
            "`i = 0` and `while i < len(jars):` walk a list; `jars[i]` is the jar you're at, and `i += 1` moves on. `costs[names.index(\"fig\")]` is the fig's cost.",
            "Inside the loop: `bill += prices[crops.index(___)]`, then `i += 1`.",
          ],
          needs: [walk],
          advice: "One number: the whole bill.",
          codex: ["lists-while", "parallel-lists"],
        };
      }
      if (twist === "goal") {
        const n = r.int(6, 8);
        const catches = Array.from({ length: n }, () => r.int(2, 9));
        const k = r.int(2, n - 1);
        const upTo = (m: number) => catches.slice(0, m).reduce((a, b) => a + b, 0);
        const goal = r.int(upTo(k - 1) + 1, upTo(k));
        return {
          title: "Marlo's Good Week",
          topic: "walking a list with while",
          task: [
            "`catches` is how many fish Marlo landed each day this week, in order.",
            "Walk the days one at a time, keeping a running total. Print the number of the day the total first reaches at least `goal` (the first day is day 1).",
            "If the week ends before the total gets there, print `not yet` instead.",
          ],
          data: { catches, goal },
          plan: ["A running total and a place in the week", "Walk until the goal or the end of the week", "The day, or not yet"],
          body: L("total = 0", "i = 0", "while i < len(catches) and total < goal:", "    total += catches[i]", "    i += 1", "if total >= goal:", "    print(i)", "else:", '    print("not yet")'),
          variants: [
            { data: { catches: [3, 5, 2, 6], goal: 8 }, note: "The total lands exactly on the goal on day 2." },
            { data: { catches: [2, 3, 1], goal: 20 }, note: "The week ends first: the goal is never reached." },
            { data: { catches: [9, 1, 4], goal: 5 }, note: "The first day alone is enough." },
          ],
          wrong: [
            L("total = 0", "i = 0", "while i < len(catches) and total <= goal:", "    total += catches[i]", "    i += 1", "if total > goal:", "    print(i)", "else:", '    print("not yet")'),
            L("total = 0", "i = 0", "while i < len(catches) and total < goal:", "    total += catches[i]", "    i += 1", "print(i)"),
            L("total = 0", "i = 0", "while i < len(catches) and total < goal:", "    total += catches[i]", "    i += 1", "if total >= goal:", "    print(i + 1)", "else:", '    print("not yet")'),
            L("total = 0", "i = 0", "while i < len(catches):", "    total += catches[i]", "    i += 1", "if total >= goal:", "    print(i)", "else:", '    print("not yet")'),
          ],
          hints: [
            "Two reasons to stop walking: the goal is reached, or there are no days left. The day number comes from where you stopped.",
            "`while i < len(jars) and total < 30:` keeps going only while both are true. After the loop, `i` says how many items were walked.",
            "After the loop: `if total ___ goal:` print the day, else the not-yet words.",
          ],
          needs: [walk],
          advice: "One line: the day the goal was first reached, or the not-yet words.",
          codex: ["lists-while", "while"],
        };
      }
      const kilos = weights(r, r.int(6, 8));
      const limit = r.int(15, 30);
      return {
        title: "Sacks for the Big Cart",
        topic: "walking a list with while",
        task: [
          "`kilos` lists today's sacks in the order they were filled.",
          "Only sacks heavier than `limit` go on the big cart. Walk the sacks and gather those into a new list, in the same order.",
          "Print that list, then on the next line how many sacks are in it.",
        ],
        data: { kilos, limit },
        plan: ["An empty cart", "Walk the sacks, keeping the heavy ones", "Show the cart and how many"],
        body: L("cart = []", "i = 0", "while i < len(kilos):", "    if kilos[i] > limit:", "        cart.append(kilos[i])", "    i += 1", "print(cart)", "print(len(cart))"),
        variants: [
          { data: { kilos: [12, 20, 31, 20], limit: 20 }, note: "Two sacks weigh exactly the limit: they aren't heavier, so they stay off." },
          { data: { kilos: [5, 9, 3], limit: 20 }, note: "No sack is heavy enough today." },
          { data: { kilos: [33, 40], limit: 20 } },
        ],
        wrong: [
          L("cart = []", "i = 0", "while i < len(kilos):", "    if kilos[i] >= limit:", "        cart.append(kilos[i])", "    i += 1", "print(cart)", "print(len(cart))"),
          L("cart = []", "i = 0", "while i < len(kilos):", "    if kilos[i] > limit:", "        cart.append(kilos[i])", "    i += 1", "print(cart)", "print(len(kilos))"),
          L("cart = []", "i = 0", "while i < len(kilos):", "    if kilos[i] > limit:", "        cart.append(i)", "    i += 1", "print(cart)", "print(len(cart))"),
          L("cart = []", "i = 1", "while i < len(kilos):", "    if kilos[i] > limit:", "        cart.append(kilos[i])", "    i += 1", "print(cart)", "print(len(cart))"),
        ],
        hints: [
          "Start with an empty cart. Walk the sacks; each one either goes on or it doesn't. Watch the sacks that weigh exactly the limit.",
          "`picked = []` makes an empty list and `picked.append(7)` adds 7 to its end. `while i < len(jars):` with `jars[i]` walks a list.",
          "Inside the loop: `if kilos[i] ___ limit:` then append it; after the loop, print the cart and its length.",
        ],
        needs: [walk],
        advice: "Two lines: the list of heavy sacks, then how many.",
        codex: ["lists-while", "list-methods"],
      };
    },
  },
];
