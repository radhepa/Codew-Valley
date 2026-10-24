import { py } from "../build.ts";
import type { Py, Spec, Template } from "../build.ts";
import { CROPS, FIELDS, PEOPLE } from "../rng.ts";
import type { Rng } from "../rng.ts";

// The Scribe's Library: dictionaries (lookups, .get, loops, counting, nested data, sorting).

const L = (...lines: string[]) => lines.join("\n");
const ledger = "`store` is the village store's ledger: each crop and how many sacks of it are in.";
const loop: [string, string] = ["\\bfor\\b", "Let a for loop walk through it."];
const PLACES = ["well", "mill", "dock", "old oak", "bridge", "barn", "stile", "orchard", "bell tower", "pond", "beehives", "scarecrow"];

/** A store ledger of n crops, each with 1 to top sacks. */
function stock(r: Rng, n: number, top = 20): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of r.sample(CROPS, n)) out[c] = r.int(1, top);
  return out;
}

export const LIBRARY: Template[] = [
  {
    id: "lb-lookup",
    topics: ["library"],
    difficulty: 1,
    make(r): Spec {
      const store = stock(r, r.int(3, 5));
      const keys = Object.keys(store);
      if (r.chance(0.5)) {
        const crop = r.chance(0.5) ? r.pick(keys) : r.pick(CROPS.filter((c) => !keys.includes(c)));
        return {
          title: "What's in the Store?",
          topic: ".get with a default",
          task: [ledger, "Print how many sacks of `crop` there are, as one number. A crop that isn't in the ledger has none."],
          data: { store, crop },
          plan: ["How many of that crop, or none"],
          body: "print(store.get(crop, 0))",
          variants: [
            { data: { store: { wheat: 6, mint: 2 }, crop: "pumpkin" }, note: "No pumpkin in the ledger." },
            { data: { store: { wheat: 6, mint: 2 }, crop: "mint" } },
            { data: { store: {}, crop: "wheat" }, note: "An empty ledger." },
          ],
          wrong: ["print(store[crop])", "print(store.get(crop))", "print(crop in store)", "print(len(store))"],
          hints: [
            "Asking the ledger straight out for a crop it doesn't have stops the program. Is there a gentler way to ask, with an answer ready for when it's missing?",
            "`jars.get(\"fig\", 0)` gives the figs if there are any, and 0 if fig isn't a key at all.",
            "`print(store.get(crop, ___))`",
          ],
          needs: [["\\.get\\(|\\bin\\b", "Make sure a crop that isn't in the ledger can't stop the program."]],
          advice: "One number: the sacks of that crop, or 0.",
          codex: ["dict-safe", "dictionaries"],
        };
      }
      const prices: Record<string, number> = {};
      for (const k of keys) prices[k] = r.int(2, 12);
      return {
        title: "Sable's Board",
        topic: "in and KeyError",
        task: ["`prices` maps each crop on Sable's board to its price in coins.", "Print the price of `crop`. If it isn't on the board, print `not sold here` instead."],
        data: { prices, crop: r.pick(keys) },
        plan: ["Is it on the board?", "Its price, or the not-sold words"],
        body: L("if crop in prices:", "    print(prices[crop])", "else:", '    print("not sold here")'),
        variants: [{ data: { prices: { garlic: 4, wheat: 2 }, crop: "carrot" }, note: "Carrot isn't on the board." }, { data: { prices: { garlic: 4, wheat: 2 }, crop: "wheat" } }],
        wrong: [
          "print(prices[crop])",
          L("if crop in prices:", "    print(crop)", "else:", '    print("not sold here")'),
          L("if prices[crop]:", "    print(prices[crop])", "else:", '    print("not sold here")'),
        ],
        hints: [
          "Ask the board whether it has the crop at all before you ask for its price.",
          "`if \"fig\" in jars:` checks the keys of a dictionary. `jars[\"fig\"]` looks a key up, and stops with a KeyError if it isn't there.",
          "`if crop ___ prices:` print its price, else the not-sold words.",
        ],
        advice: "Just the price, or the not-sold words.",
        codex: ["dict-safe", "dictionaries"],
      };
    },
  },
  {
    id: "lb-ledger",
    topics: ["library"],
    difficulty: 1,
    make(r): Spec {
      const store = stock(r, r.int(3, 4));
      const keys = Object.keys(store);
      const crop = r.chance(0.5) ? r.pick(keys) : r.pick(CROPS.filter((c) => !keys.includes(c)));
      if (r.chance(0.5))
        return {
          title: "A Delivery",
          topic: "adding and changing entries",
          task: [ledger, "Bram delivers `amount` sacks of `crop`. Add them to the ledger: a crop the ledger hasn't seen yet starts from nothing.", "Print the whole ledger afterwards."],
          data: { store, crop, amount: r.int(1, 9) },
          plan: ["Add the delivery", "Show the ledger"],
          body: L("store[crop] = store.get(crop, 0) + amount", "print(store)"),
          variants: [
            { data: { store: { wheat: 6, mint: 2 }, crop: "garlic", amount: 5 }, note: "Garlic is new to the ledger." },
            { data: { store: { wheat: 6, mint: 2 }, crop: "wheat", amount: 4 }, note: "Wheat is in already: it grows." },
          ],
          wrong: [
            L("store[crop] = amount", "print(store)"),
            L("store[crop] += amount", "print(store)"),
            L("store.get(crop, 0) + amount", "print(store)"),
            L('store["crop"] = store.get("crop", 0) + amount', "print(store)"),
          ],
          hints: [
            "The new count is the old count plus the delivery. What is the old count of a crop the ledger has never seen?",
            "`jars[\"fig\"] = 7` adds or changes the fig entry. `jars.get(\"plum\", 0)` is the plums, or 0 if there's no plum key.",
            "`store[crop] = store.get(crop, 0) ___ amount`, then print the ledger.",
          ],
          advice: "Print the whole ledger, after the delivery.",
          codex: ["dict-changes", "dict-safe"],
        };
      return {
        title: "Sold Out",
        topic: "removing entries",
        task: [ledger, "Sable bought every sack of `crop`. Take it out of the ledger, if it's there at all.", "Print the ledger, then on the next line how many crops are left in it."],
        data: { store, crop },
        plan: ["Take the crop out, if it's there", "Show the ledger and how many crops"],
        body: L("if crop in store:", "    del store[crop]", "print(store)", "print(len(store))"),
        variants: [
          { data: { store: { wheat: 6, mint: 2 }, crop: "garlic" }, note: "Garlic was never in the ledger: nothing to take out." },
          { data: { store: { mint: 2 }, crop: "mint" }, note: "The last crop goes: the ledger is empty." },
          { data: { store: { wheat: 6, mint: 2, potato: 3 }, crop: "wheat" } },
        ],
        wrong: [
          L("del store[crop]", "print(store)", "print(len(store))"),
          L("if crop in store:", "    store[crop] = 0", "print(store)", "print(len(store))"),
          L("if crop in store:", "    del store[crop]", "print(store)", "print(len(store) - 1)"),
        ],
        hints: [
          "Two jobs: make sure the crop is there before taking it out, then report. Taking out a key that isn't there stops the program.",
          "`del jars[\"fig\"]` takes the fig entry out; `jars.pop(\"fig\", None)` does too, and doesn't mind if there's no fig. `len(jars)` counts the keys.",
          "`if crop in store:` then take it out with `___ store[crop]`; print the ledger and its length.",
        ],
        advice: "Two lines: the ledger, then how many crops are left.",
        codex: ["dict-changes", "dict-safe"],
      };
    },
  },
  {
    id: "lb-read",
    topics: ["library"],
    difficulty: 2,
    make(r): Spec {
      const store = stock(r, r.int(4, 6));
      if (r.chance(0.5)) {
        const low = r.int(4, 10);
        return {
          title: "Running Low",
          topic: "looping over a dictionary",
          task: [
            ledger,
            "Print one line for every crop with fewer than `low` sacks, in ledger order: the crop, a colon and a space, then the sacks.",
            "Then one last line: how many sacks there are in the whole store.",
          ],
          data: { store, low },
          plan: ["One line per crop running low", "The whole store's sacks"],
          body: L("for name, n in store.items():", "    if n < low:", '        print(f"{name}: {n}")', "print(sum(store.values()))"),
          variants: [
            { data: { store: { wheat: 6, mint: 2, garlic: 5 }, low: 5 }, note: "Garlic has exactly 5: that isn't fewer than 5." },
            { data: { store: { wheat: 16, mint: 12 }, low: 5 }, note: "Nothing is running low." },
            { data: { store: {}, low: 5 }, note: "An empty store." },
          ],
          wrong: [
            L("for name, n in store.items():", "    if n <= low:", '        print(f"{name}: {n}")', "print(sum(store.values()))"),
            L("total = 0", "for name, n in store.items():", "    if n < low:", '        print(f"{name}: {n}")', "        total += n", "print(total)"),
            L("for name, n in store.items():", "    if n < low:", "        print(name, n)", "print(sum(store.values()))"),
            L("for name in store:", "    if store[name] < low:", '        print(f"{name}: {store[name]}")', "print(len(store))"),
          ],
          hints: [
            "Walk the ledger one entry at a time, with both the crop and its count in hand. The grand total doesn't care about running low.",
            "`for name, count in jars.items():` gives each key with its value. `sum(jars.values())` adds up every value.",
            "Inside the loop: `if n ___ low:` print the line; after the loop print the total.",
          ],
          needs: [loop],
          advice: "One line per crop running low, then the total on its own line.",
          codex: ["dict-loops"],
        };
      }
      const pick = (cmp: string) => L('best = ""', "most = -1", "for name, n in store.items():", `    if n ${cmp} most:`, "        best = name", "        most = n");
      return {
        title: "The Fullest Bin",
        topic: ".values() with sum and max",
        task: [ledger, "Print the crop with the most sacks. If two tie, the one that comes first in the ledger wins.", "On the next line, print how many sacks there are in the whole store."],
        data: { store },
        plan: ["The crop with the most sacks", "The whole store's sacks"],
        body: L(pick(">"), "print(best)", "print(sum(store.values()))"),
        variants: [{ data: { store: { wheat: 6, mint: 9, garlic: 9 } }, note: "Mint and garlic tie: mint comes first in the ledger." }, { data: { store: { potato: 3 } }, note: "Only one crop in the store." }],
        wrong: [
          L(pick(">="), "print(best)", "print(sum(store.values()))"),
          L("print(max(store))", "print(sum(store.values()))"),
          L("print(max(store.values()))", "print(sum(store.values()))"),
          L(pick(">"), "print(best)", "print(most)"),
        ],
        hints: [
          "Walk the ledger keeping the best crop so far and its count. Only a bigger count should take its place.",
          "`for name, count in jars.items():` gives each key with its value. `max(jars)` compares the keys, not the values. `sum(jars.values())` adds up every value.",
          "Inside the loop: `if n ___ most:` remember both the name and the count; after the loop print the name and the total.",
        ],
        advice: "Two lines: the fullest crop's name, then the total sacks.",
        codex: ["dict-loops"],
      };
    },
  },
  {
    id: "lb-fields",
    topics: ["library"],
    difficulty: 2,
    make(r): Spec {
      const names = r.sample(FIELDS, r.int(3, 4));
      const fields: Record<string, Py> = {};
      for (const f of names) fields[f] = r.sample(CROPS, r.int(1, 3));
      const intro = "`fields` maps each field to the list of crops growing in it.";
      if (r.chance(0.5)) {
        const grown = Object.values(fields).flat() as string[];
        const flag = L("found = False", "for field, crops in fields.items():", "    if crop in crops:", "        print(field)", "        found = True");
        return {
          title: "Where Does It Grow?",
          topic: "dictionaries of lists",
          task: [intro, "Print the name of every field that grows `crop`, one per line, in ledger order.", "If no field grows it, print `nowhere`."],
          data: { fields, crop: r.pick(grown) },
          plan: ["Every field that grows it", "None at all? Say so"],
          body: L(flag, "if not found:", '    print("nowhere")'),
          variants: [
            { data: { fields: { "north field": ["wheat", "mint"], "hill plot": ["mint"], "river strip": ["carrot"] }, crop: "mint" }, note: "Mint grows in two fields." },
            { data: { fields: { "north field": ["wheat"], "hill plot": ["carrot"] }, crop: "pumpkin" }, note: "No field grows pumpkin." },
          ],
          wrong: [
            L(flag, "        break", "if not found:", '    print("nowhere")'),
            L("for field, crops in fields.items():", "    if crop in crops:", "        print(field)", "    else:", '        print("nowhere")'),
            L("if crop in fields:", "    print(crop)", "else:", '    print("nowhere")'),
          ],
          hints: [
            "Each field holds a whole list. Look inside each list for the crop, and remember whether you ever found it.",
            "`for shelf, books in library.items():` gives each key with its list, and `if \"owl\" in books:` looks inside that list. A flag set before the loop says afterwards whether anything matched.",
            "Inside the loop: `if crop in ___:` print the field and set the flag; after the loop, the nowhere word if the flag never changed.",
          ],
          needs: [loop],
          advice: "One field per line, or the nowhere word.",
          codex: ["nested-data", "dict-loops"],
        };
      }
      const field = r.chance(0.5) ? r.pick(names) : r.pick(FIELDS.filter((f) => !names.includes(f)));
      return {
        title: "Planting Day",
        topic: "dictionaries of lists",
        task: [intro, "Plant `crop` in `field`: it goes at the end of that field's list. A field that isn't in the ledger yet starts with just this crop.", "Print the ledger afterwards."],
        data: { fields, field, crop: r.pick(CROPS) },
        plan: ["Plant it", "Show the ledger"],
        body: L("if field in fields:", "    fields[field].append(crop)", "else:", "    fields[field] = [crop]", "print(fields)"),
        variants: [
          { data: { fields: { "north field": ["wheat"], "hill plot": ["carrot"] }, field: "east meadow", crop: "mint" }, note: "The east meadow is new to the ledger." },
          { data: { fields: { "north field": ["wheat"], "hill plot": ["carrot"] }, field: "north field", crop: "mint" }, note: "The north field already grows wheat: mint joins it." },
        ],
        wrong: [
          L("fields[field] = [crop]", "print(fields)"),
          L("fields[field].append(crop)", "print(fields)"),
          L("if field in fields:", "    fields[field].append(crop)", "else:", "    fields[field] = crop", "print(fields)"),
        ],
        hints: [
          "Two cases: the field already has a list to add to, or it needs a brand-new list.",
          "`shelves[\"top\"].append(\"atlas\")` adds to the list stored under top. `shelves[\"low\"] = [\"atlas\"]` makes a new entry holding a one-book list.",
          "`if field in fields:` append to its list; else `fields[field] = ___`; then print.",
        ],
        advice: "Print the whole ledger, after planting.",
        codex: ["nested-data", "dict-changes"],
      };
    },
  },
  {
    id: "lb-records",
    topics: ["library"],
    difficulty: 3,
    make(r): Spec {
      const who = r.sample(PEOPLE, 3);
      const kinds = r.sample(CROPS, 3);
      const sacks: Py[] = Array.from({ length: r.int(5, 7) }, () => ({ who: r.pick(who), crop: r.pick(kinds), kg: r.int(5, 30) }));
      const intro = "`sacks` is the mill's record of today: one dictionary per sack, saying who brought it, which crop, and its kilos.";
      if (r.chance(0.5)) {
        const show = (cmp: string) => L('best = ""', "for who, kg in totals.items():", '    print(f"{who}: {kg}")', `    if best == "" or kg ${cmp} totals[best]:`, "        best = who", "print(best)");
        const tally = (add: string) => L("totals = {}", "for s in sacks:", '    who = s["who"]', `    totals[who] = ${add}`);
        const right = tally('totals.get(who, 0) + s["kg"]');
        return {
          title: "Who Brought What",
          topic: "lists of dictionaries",
          task: [
            intro,
            "Add up the kilos each villager brought. Print one line per villager, in the order they first appear: the name, a colon and a space, then their kilos.",
            "Last line: the name of whoever brought the most kilos in all (if two tie, whoever appeared first).",
          ],
          data: { sacks },
          plan: ["Each villager's total", "One line each", "Whoever brought the most"],
          body: L(right, show(">")),
          variants: [
            {
              data: { sacks: [{ who: "Bram", crop: "wheat", kg: 10 }, { who: "Hazel", crop: "mint", kg: 4 }, { who: "Hazel", crop: "wheat", kg: 6 }] },
              note: "Bram and Hazel both brought 10 kilos: Bram appeared first.",
            },
            { data: { sacks: [{ who: "Odo", crop: "garlic", kg: 7 }] }, note: "Only one sack today." },
            {
              data: { sacks: [{ who: "Tock", crop: "potato", kg: 9 }, { who: "Sable", crop: "mint", kg: 6 }, { who: "Sable", crop: "carrot", kg: 6 }] },
              note: "The heaviest single sack isn't the biggest total.",
            },
          ],
          wrong: [
            L(tally('s["kg"]'), show(">")),
            L(right, show(">=")),
            L(right, "for who, kg in totals.items():", '    print(f"{who}: {kg}")', "best = sacks[0]", "for s in sacks:", '    if s["kg"] > best["kg"]:', "        best = s", 'print(best["who"])'),
          ],
          hints: [
            "Two walks: one over the sacks to build a total per villager, then one over those totals to print them and spot the biggest.",
            "`rec[\"kg\"]` reaches into one record. `tally[name] = tally.get(name, 0) + 3` adds 3 to a running total that may not exist yet.",
            "In the first loop: `totals[who] = totals.get(who, 0) + ___`; then walk `totals.items()` to print and keep the best.",
          ],
          needs: [loop],
          advice: "One line per villager, then the name of whoever brought the most.",
          codex: ["nested-data", "counting"],
        };
      }
      const fix = (body: string) => L("for s in sacks:", body);
      const report = L("total = 0", "for s in sacks:", '    print(s["who"], s["crop"], s["kg"])', '    total += s["kg"]', "print(total)");
      const sample3 = [{ who: "Bram", crop: "wheat", kg: 10 }, { who: "Hazel", crop: "mint", kg: 4 }];
      return {
        title: "The Crooked Scale",
        topic: "changing nested data",
        task: [
          intro,
          "The scale was crooked for `crop`: every sack of it really weighs `extra` kilos more than written. Fix those records in the list itself.",
          "Then print each sack on its own line: who brought it, the crop and the kilos, with a space between each. Last line: the total kilos of all the sacks.",
        ],
        data: { sacks, crop: r.pick(kinds), extra: r.int(1, 4) },
        plan: ["Fix the crooked records", "One line per sack", "The total"],
        body: L(fix(L('    if s["crop"] == crop:', '        s["kg"] += extra')), report),
        variants: [
          { data: { sacks: sample3, crop: "pumpkin", extra: 3 }, note: "No sack of pumpkin today: nothing changes." },
          { data: { sacks: [{ who: "Bram", crop: "wheat", kg: 10 }, { who: "Pip", crop: "wheat", kg: 4 }], crop: "wheat", extra: 2 }, note: "Every sack is wheat." },
        ],
        wrong: [
          L(fix('    s["kg"] += extra'), report),
          L(fix(L('    if s["crop"] == crop:', '        s["kg"] = extra')), report),
          L(fix(L('    kg = s["kg"]', '    if s["crop"] == crop:', "        kg += extra")), report),
        ],
        hints: [
          "Walk the records and change only the ones for that crop, right inside each dictionary. Then a second walk prints and adds up.",
          "`for rec in records:` gives each dictionary in turn, and `rec[\"kg\"] += 2` changes that record itself, inside the list.",
          "In the first loop: `if s[\"crop\"] == crop:` then `s[\"kg\"] ___ extra`.",
        ],
        needs: [loop],
        advice: "One line per sack, then the total.",
        codex: ["nested-data"],
      };
    },
  },
  {
    id: "lb-rank",
    topics: ["library"],
    difficulty: 3,
    make(r): Spec {
      if (r.chance(0.5)) {
        const sales = stock(r, r.int(4, 6), 30);
        const keys = Object.keys(sales);
        if (r.chance(0.5)) sales[keys[keys.length - 1]] = sales[keys[0]];
        const print = L("for name in ranked[:n]:", '    print(f"{name}: {sales[name]}")');
        return {
          title: "Odo's Best Sellers",
          topic: "sorting dictionaries",
          task: [
            "`sales` maps each crop to how many sacks of it sold this season.",
            "Print the `n` best-selling crops, best first, one line each: the crop, a colon and a space, then how many sold.",
            "Crops that sold equally keep their ledger order. If there are fewer than `n` crops, print them all.",
          ],
          data: { sales, n: r.int(2, 3) },
          plan: ["The crops in order, best first", "The first few"],
          body: L("ranked = sorted(sales, key=sales.get, reverse=True)", print),
          variants: [
            { data: { sales: { wheat: 5, mint: 9, garlic: 9, carrot: 2 }, n: 2 }, note: "Mint and garlic tie: mint comes first in the ledger." },
            { data: { sales: { potato: 4 }, n: 3 }, note: "Only one crop: print it on its own." },
            { data: { sales: { cabbage: 3, pumpkin: 12, mint: 7 }, n: 3 } },
          ],
          wrong: [
            L("ranked = sorted(sales, key=sales.get)", "for name in ranked[-n:]:", '    print(f"{name}: {sales[name]}")'),
            L("ranked = sorted(sales, reverse=True)", print),
            L("ranked = sorted(sales.values(), reverse=True)", "for v in ranked[:n]:", "    print(v)"),
            L("ranked = sorted(sales, key=sales.get, reverse=True)", "for name in ranked[1:n + 1]:", '    print(f"{name}: {sales[name]}")'),
          ],
          hints: [
            "Line the crops up by what they sold, biggest first, then take the first few. Sorting can look at the values while handing back the keys.",
            "`sorted(heights, key=heights.get)` gives the keys of `heights`, shortest first, and ties keep their order. `xs[:3]` is the first three of a list.",
            "`ranked = sorted(sales, key=sales.get, reverse=___)`, then print the first `n` of them.",
          ],
          needs: [["sorted\\(", "Let sorted put the crops in order."]],
          advice: "One line per crop, best seller first.",
          codex: ["sorting-dicts"],
        };
      }
      const kinds = r.sample(CROPS, r.int(3, 4));
      const days = Array.from({ length: r.int(6, 9) }, () => r.pick(kinds));
      const build = (start: string, add: string) => L("index = {}", `day = ${start}`, "for c in days:", "    if c not in index:", "        index[c] = []", add, "    day += 1");
      const right = build("1", "    index[c].append(day)");
      const show = L("for c in sorted(index):", '    print(f"{c}: {index[c]}")');
      return {
        title: "Odo's Index",
        topic: "building an index",
        task: [
          "`days` lists the crop Sable sold most of on each market day, in order (the first is day 1).",
          "Build an index: for every crop, the list of days it was the best seller.",
          "Print one line per crop in A-to-Z order: the crop, a colon and a space, then its list of days.",
        ],
        data: { days },
        plan: ["Build the index, day by day", "One line per crop, A to Z"],
        body: L(right, show),
        variants: [
          { data: { days: ["mint", "mint", "mint"] }, note: "The same crop every day." },
          { data: { days: ["wheat", "carrot", "garlic"] }, note: "A different crop each day: three lists of one day each." },
          { data: { days: ["potato", "cabbage", "potato", "wheat", "cabbage"] } },
        ],
        wrong: [
          L(build("0", "    index[c].append(day)"), show),
          L(build("1", "    index[c] = [day]"), show),
          L(right, "for c, d in index.items():", '    print(f"{c}: {d}")'),
        ],
        hints: [
          "Keep a day counter as you walk. Each crop needs its own list, made the first time you meet it, and then added to.",
          "`if word not in index:` then `index[word] = []` makes an empty list for a new key; `index[word].append(7)` adds to it. `sorted(index)` gives the keys A to Z.",
          "Inside the loop: start a list for a new crop, then `index[c].append(___)`; afterwards walk `sorted(index)` to print.",
        ],
        needs: [loop],
        advice: "One line per crop, A to Z, each with its list of days.",
        codex: ["sorting-dicts", "nested-data"],
      };
    },
  },
  {
    id: "lb-tally",
    topics: ["bakery", "library"],
    difficulty: 2,
    make(r): Spec {
      const kinds = r.sample(CROPS, 4);
      const count = L("tally = {}", "for p in picks:", "    tally[p] = tally.get(p, 0) + 1");
      const intro = "`picks` lists every crate the pickers brought in today, one crop per crate.";
      if (r.chance(0.5)) {
        const picks = Array.from({ length: r.int(8, 12) }, () => r.pick(kinds.slice(0, r.int(3, 4))));
        return {
          title: "Tallying the Picks",
          topic: "counting with a dictionary",
          task: [intro, "Count the crates of each crop. Print one line per crop, in the order each crop first turned up: the crop, a colon and a space, then its crates."],
          data: { picks },
          plan: ["Count each crop", "One line per crop"],
          body: L(count, "for crop, n in tally.items():", '    print(f"{crop}: {n}")'),
          variants: [
            { data: { picks: ["mint", "mint", "mint"] }, note: "Only one crop today." },
            { data: { picks: ["wheat", "carrot", "garlic"] }, note: "Every crop once." },
            { data: { picks: [] }, note: "Nothing picked: nothing to print." },
          ],
          wrong: [
            L("tally = {}", "for p in picks:", "    tally[p] = 1", "for crop, n in tally.items():", '    print(f"{crop}: {n}")'),
            L("tally = {}", "for p in picks:", "    tally[p] += 1", "for crop, n in tally.items():", '    print(f"{crop}: {n}")'),
            L(count, "for crop in sorted(tally):", '    print(f"{crop}: {tally[crop]}")'),
            L("for p in picks:", '    print(f"{p}: {picks.count(p)}")'),
          ],
          hints: [
            "One crate at a time: add one to that crop's count, starting a count the first time a crop turns up.",
            "`tally[w] = tally.get(w, 0) + 1` adds one to the count for w, whether or not w was there before. A dictionary remembers the order its keys were added.",
            "Inside the loop: `tally[p] = tally.get(p, ___) + 1`; then walk `tally.items()` to print.",
          ],
          needs: [loop],
          advice: "One line per crop, in the order they first turned up.",
          codex: ["counting", "dict-loops"],
        };
      }
      const picks = Array.from({ length: r.int(6, 9) }, () => r.pick(kinds.slice(0, 3)));
      picks.splice(r.int(0, picks.length), 0, kinds[3]);
      const flag = (test: string) => L("found = False", "for crop, n in tally.items():", `    if ${test}:`, "        print(crop)", "        found = True", "if not found:", '    print("none")');
      return {
        title: "Odd Ones Out",
        topic: "counting with a dictionary",
        task: [intro, "Print every crop that turned up in exactly one crate, one per line, in the order they turned up.", "If every crop came in more than one crate, print `none` instead."],
        data: { picks },
        plan: ["Count each crop", "The crops that came only once", "None of them? Say so"],
        body: L(count, flag("n == 1")),
        variants: [
          { data: { picks: ["mint", "wheat", "mint"] }, note: "Mint came twice: only wheat came once." },
          { data: { picks: ["garlic", "garlic", "carrot", "carrot"] }, note: "Every crop came twice." },
          { data: { picks: ["potato", "cabbage", "pumpkin"] } },
        ],
        wrong: [
          L(count, flag("n > 1")),
          L("tally = {}", "for p in picks:", "    tally[p] = 1", flag("n == 1")),
          L(count, "for crop, n in tally.items():", "    if n == 1:", "        print(crop)"),
          L(count, "for crop, n in tally.items():", "    if n == 1:", "        print(crop)", "    else:", '        print("none")'),
        ],
        hints: [
          "Count every crop first; only then do you know which came just once. Remember whether you found any.",
          "`tally[w] = tally.get(w, 0) + 1` counts. A flag like `seen = False`, set to `True` in a loop, says afterwards whether anything matched.",
          "In the second loop: `if n ___ 1:` print the crop and set the flag; after it, the none word if the flag never changed.",
        ],
        needs: [loop],
        advice: "One crop per line, or the none word.",
        codex: ["counting", "flags"],
      };
    },
  },
  {
    id: "lb-best",
    topics: ["bakery", "library"],
    difficulty: 2,
    make(r): Spec {
      const names = r.sample(PEOPLE, 3);
      const n = r.int(6, 8);
      const most = r.chance(0.5);
      const cmp = most ? ">" : "<";
      const tally = L("totals = {}", "for who, n in zip(sellers, loaves):", "    totals[who] = totals.get(who, 0) + n");
      const pick = (c: string) => L('best = ""', "for who in totals:", `    if best == "" or totals[who] ${c} totals[best]:`, "        best = who", "print(best)", "print(totals[best])");
      return {
        title: most ? "Best Seller" : "A Slow Day",
        topic: "zip and a tally",
        task: [
          "`sellers` and `loaves` line up: one entry per sale at the bakery counter, who made it and how many loaves. The same baker can appear many times.",
          `Add up each baker's loaves. Print the baker who sold the ${most ? "most" : "fewest"} loaves in all, and on the next line their total.`,
          "If two tie, the one who appears first in `sellers` wins.",
        ],
        data: { sellers: Array.from({ length: n }, () => r.pick(names)), loaves: Array.from({ length: n }, () => r.int(2, 15)) },
        plan: ["Each baker's total", `The ${most ? "most" : "fewest"} loaves, and how many`],
        body: L(tally, pick(cmp)),
        variants: [
          { data: { sellers: ["Hazel", "Bram", "Hazel", "Bram"], loaves: [5, 3, 2, 4] }, note: "Both bakers sold 7: the one who appears first wins." },
          { data: { sellers: ["Pip"], loaves: [6] }, note: "One sale today." },
          { data: { sellers: ["Tock", "Sable", "Sable"], loaves: [9, 6, 6] }, note: "No single sale tells you the totals." },
        ],
        wrong: [
          L(tally, pick(cmp + "=")),
          L("totals = {}", "for who, n in zip(sellers, loaves):", "    totals[who] = n", pick(cmp)),
          L("best = 0", "for i in range(len(loaves)):", `    if loaves[i] ${cmp} loaves[best]:`, "        best = i", "print(sellers[best])", "print(loaves[best])"),
          L(tally, `best = ${most ? "max" : "min"}(totals)`, "print(best)", "print(totals[best])"),
        ],
        hints: [
          "First add up each baker's sales into one total per baker. Only then compare the totals.",
          "`for hen, eggs in zip(hens, counts):` walks two lists side by side, and `tally[hen] = tally.get(hen, 0) + eggs` keeps a running total per hen.",
          `After the tally, walk the bakers and keep \`best\` whenever \`totals[who] ___ totals[best]\`.`,
        ],
        needs: [loop],
        advice: "Two lines: the baker's name, then their total.",
        codex: ["counting", "zip"],
      };
    },
  },
  {
    id: "lb-fn",
    topics: ["forge", "library"],
    difficulty: 2,
    make(r): Spec {
      const store = stock(r, r.int(3, 5));
      if (r.chance(0.5)) {
        const low = r.int(5, 12);
        const fn = (cmp: string, end: string) => L("def restock(store, low):", "    out = []", "    for crop, n in store.items():", `        if n ${cmp} low:`, "            out.append(crop)", end);
        return {
          title: "What Needs Restocking",
          topic: "a function over a dictionary",
          task: [
            "Write a function `restock(store, low)`: `store` maps each crop to how many sacks are in, and `low` is a number of sacks.",
            "It hands back a list of the crops with fewer than `low` sacks, in ledger order (an empty list if none).",
          ],
          plan: ["Your function goes here"],
          body: fn("<", "    return out"),
          drive: `print(restock(${py(store)}, ${low}))`,
          variants: [
            { drive: 'print(restock({"wheat": 5, "mint": 2, "garlic": 9}, 5))\nprint(restock({}, 3))', note: "Wheat has exactly 5: not fewer. An empty store needs nothing." },
            { drive: 'need = restock({"carrot": 1, "potato": 0}, 4)\nprint(len(need))\nprint(need)' },
          ],
          wrong: [fn("<=", "    return out"), fn("<", "        return out"), fn("<", "    print(out)"), fn("<", "    return len(out)")],
          hints: [
            "Walk the ledger inside the function, collecting the low crops in a new list. Hand the list back once the walk is done.",
            "`def light(jars, most):` can walk `for name, n in jars.items():`, append the names it wants to a list, and `return` that list after the loop.",
            "Inside the loop: `if n ___ low:` append the crop; after the loop, `return out`.",
          ],
          needs: [["def\\s+restock\\s*\\(", "Wren asks for a function named restock."]],
          advice: "Hand the list back with return.",
          codex: ["list-functions", "dict-loops"],
        };
      }
      const prices: Record<string, number> = {};
      for (const k of Object.keys(store).slice(1)) prices[k] = r.int(2, 9);
      const fn = (add: string, end = "    return total") => L("def worth(store, prices):", "    total = 0", "    for crop, n in store.items():", `        total += ${add}`, end);
      return {
        title: "What the Store Is Worth",
        topic: "a function over a dictionary",
        task: [
          "Write a function `worth(store, prices)`: `store` maps each crop to its sacks, and `prices` maps crops to coins per sack.",
          "It hands back how many coins the whole store is worth. A crop with no price on the board is worth nothing.",
        ],
        plan: ["Your function goes here"],
        body: fn("n * prices.get(crop, 0)"),
        drive: `print(worth(${py(store)}, ${py(prices)}))`,
        variants: [
          { drive: 'print(worth({"wheat": 3, "mint": 2}, {"wheat": 4}))\nprint(worth({}, {"wheat": 4}))', note: "Mint has no price: it adds nothing. An empty store is worth nothing." },
          { drive: 'print(worth({"carrot": 5}, {"carrot": 2, "garlic": 9}))' },
        ],
        wrong: [fn("n * prices[crop]"), fn("prices.get(crop, 0)"), fn("n * prices.get(crop, 0)", "        return total"), fn("n")],
        hints: [
          "For each crop in the store: its sacks times its price, all added up. What price does a crop off the board have?",
          "`for name, n in jars.items():` walks one dictionary while `costs.get(name, 0)` looks the same name up in another, with 0 if it's missing.",
          "Inside the loop: `total += n * prices.get(crop, ___)`; after it, `return total`.",
        ],
        needs: [["def\\s+worth\\s*\\(", "Wren asks for a function named worth."]],
        advice: "Hand the coins back with return.",
        codex: ["list-functions", "dict-safe"],
      };
    },
  },
  {
    id: "lb-trail",
    topics: ["dock", "library"],
    difficulty: 2,
    make(r): Spec {
      const k = r.int(2, 4);
      const spots = r.sample(PLACES, k + 3);
      const trail = spots.slice(0, k + 1);
      const links: [string, string][] = trail.slice(0, k).map((p, i) => [p, trail[i + 1]]);
      links.push([spots[k + 1], r.pick(trail)]);
      const notes: Record<string, string> = {};
      for (const [a, b] of r.shuffle(links)) notes[a] = b;
      const start = trail[0];
      const intro = "Pip has hidden notes around the valley. `notes` says, for each place with a note, where that note sends you next.";
      const walk: [string, string] = ["\\bwhile\\b", "This one is while-loop practice: keep walking while there's a note."];
      if (r.chance(0.5)) {
        const go = (cond: string) => L("place = start", "read = 0", "print(place)", `${cond}:`, "    place = notes[place]", "    read += 1", "    print(place)", "print(read)");
        return {
          title: "Pip's Treasure Notes",
          topic: "a while loop with a dictionary",
          task: [
            intro,
            "Begin at `start`. While the place you're standing at has a note, go where it says. Print every place you stand at, one per line, beginning with `start`.",
            "Last line: how many notes you read.",
          ],
          data: { notes, start },
          plan: ["Stand at the start", "Follow the notes while there are any", "How many notes"],
          body: go("while place in notes"),
          variants: [
            { data: { notes: { well: "barn", barn: "pond" }, start: "well" } },
            { data: { notes: { well: "barn" }, start: "stile" }, note: "There's no note at the start: you never move." },
            { data: { notes: { "old oak": "mill", bridge: "old oak", mill: "dock" }, start: "bridge" } },
          ],
          wrong: [
            go("if place in notes"),
            L("place = start", "read = 0", "while place in notes:", "    place = notes[place]", "    read += 1", "    print(place)", "print(read)"),
            L("for place in notes:", "    print(place)", "print(len(notes))"),
            go("while notes[place]"),
          ],
          hints: [
            "Stand at the start and ask: is there a note here? If so, move and ask again. That question is the loop's condition.",
            "`while spot in arrows:` keeps going as long as the dictionary has a key for where you are, and `spot = arrows[spot]` moves you along.",
            "`while place ___ notes:` move to `notes[place]`, count the note, and print the new place.",
          ],
          needs: [walk],
          advice: "One place per line, starting place first, then how many notes.",
          codex: ["dict-safe", "while"],
        };
      }
      const coins: Record<string, number> = {};
      for (const p of [...trail.filter((_, i) => i !== 1), spots[k + 2]]) coins[p] = r.int(1, 9);
      const go = (first: string, add: string, cond = "while place in notes") => L("place = start", `total = ${first}`, `${cond}:`, "    place = notes[place]", `    total += ${add}`, "print(total)");
      return {
        title: "Pip's Coin Trail",
        topic: "a while loop with a dictionary",
        task: [
          intro + " `coins` says how many coins are hidden at some of the places.",
          "Begin at `start` and follow the notes until you stand somewhere without one. Pick up the coins at every place you stand, the start included; a place missing from `coins` has none.",
          "Print how many coins you end up with.",
        ],
        data: { notes, coins, start },
        plan: ["Pick up the start's coins", "Follow the notes, picking up as you go", "Show the coins"],
        body: go("coins.get(place, 0)", "coins.get(place, 0)"),
        variants: [
          { data: { notes: { well: "barn", barn: "pond" }, coins: { well: 2, pond: 5, mill: 9 }, start: "well" }, note: "The barn has no coins, and the mill isn't on the trail." },
          { data: { notes: { well: "barn" }, coins: { stile: 4 }, start: "stile" }, note: "No note at the start: just the start's coins." },
        ],
        wrong: [
          go("coins[place]", "coins[place]"),
          go("0", "coins.get(place, 0)"),
          "print(sum(coins.values()))",
          go("coins.get(place, 0)", "coins.get(place, 0)", "if place in notes"),
        ],
        hints: [
          "Pick up what's at the start first. Then, while there's a note where you stand, move and pick up what's there.",
          "`while spot in arrows:` with `spot = arrows[spot]` follows a trail of keys. `gold.get(spot, 0)` is the gold at a spot, or 0 if the spot isn't a key.",
          "Start with `total = coins.get(start, 0)`; in the loop move, then `total += coins.get(place, ___)`.",
        ],
        needs: [walk],
        advice: "One number: all the coins picked up along the trail.",
        codex: ["dict-safe", "while"],
      };
    },
  },
];
