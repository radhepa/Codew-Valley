import type { Building } from "./types.ts";

// Market Square: building 4, taught with lists (SYLLABUS.md). Each challenge
// adds one stage of market.glb (art/specs/market.md, stage_01 … stage_14), so
// the building has exactly 14 challenges. Sable the trader arrives when the
// chapter opens and speaks lines that start with "Sable: ". The finale ends
// Act I: Lord Vane nails up his writ and the rank becomes Village.
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks.
//   again(("cart = [...]", "cart = [...]"))  -> (variables, printed lines)
//   expect_when([(old, new)], [lines...], "advice")   exact lines
//   says(lines, [(value, "what it is", [(trap, "advice")]), ...], when)
// says() is for answers whose wording is the learner's own: line k must show
// value k (a number as a whole number, text anywhere in the line, a list
// exactly as Python prints it). Numbers and text inside a printed list don't
// count, so printing a whole list can't answer "the biggest". A trap is a
// likely wrong value with advice for when the line shows it instead.
const PRE = r`import re as _re

def again(*swaps):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    try:
        return rerun(v)
    except Exception as e:
        when = " and ".join(new for old, new in swaps)
        extra = "Work from the lists themselves, so the program fits any market day, not just today's."
        if type(e).__name__ == "ValueError" and "not in list" in str(e):
            extra = "That happens when you remove or look up something that isn't in the list. Ask with in first."
        if type(e).__name__ == "IndexError":
            extra = "Something asks for a position the list doesn't have. Is a number typed in that only fits today's list, or does a walk go one step too far?"
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". " + extra)

def expect_when(swaps, want, advice=""):
    vns, got = again(*swaps)
    nl = chr(10) + "  "
    when = " and ".join(new for old, new in swaps)
    msg = "If " + when + ", the rune expects:" + nl + nl.join(want) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    if advice:
        msg = msg + chr(10) + advice
    check(got == want, msg)
    return vns

def _plain(line):
    return _re.sub(r"\[[^\]]*\]", "", line)

def shows(line, value):
    if isinstance(value, list):
        return str(value) in line
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return _re.search(r"(?<![\d.])" + _re.escape(str(value)) + r"(?!\d|\.\d)", _plain(line)) is not None
    return str(value) in _plain(line)

def says(got, want, when=""):
    nl = chr(10) + "  "
    pre = "When " + when + ", " if when else ""
    printed = nl + (nl.join(got) if got else "(nothing)")
    check(len(got) == len(want), pre + "the rune expects " + str(len(want)) + " lines, one for each answer in the order the task gives, but your program printed " + str(len(got)) + ":" + printed)
    for i, item in enumerate(want):
        value, what = item[0], item[1]
        traps = item[2] if len(item) > 2 else []
        line = got[i]
        if shows(line, value):
            continue
        for bad, advice in traps:
            check(not shows(line, bad), pre + "line " + str(i + 1) + " says:" + nl + line + chr(10) + advice)
        check(False, pre + "line " + str(i + 1) + " should show " + what + " (" + str(value) + "), but it says:" + nl + line)

`;

export const MARKET: Building = {
  id: "market",
  name: "Market Square",
  blurb: "Stalls, striped awnings and news from beyond the valley.",
  villager: { name: "Sable", model: "merchant", arrives: "start" },
  opening: [
    "Sable: Hello, hello, HELLO! Is this it? The valley that came back from nowhere? I heard about you at three fairs and a toll bridge, partner.",
    "Sable: Sable. Trader. Buttons, ribbons, rumours, and a teapot that whistles in two keys at once. Don't ask what it costs. Everything costs something. Except advice. Advice is half price.",
    "Sable: A tavern, a mill, a dock with a bell that rings every time you get something right. Do you know what you've got here? Neighbours! Neighbours who need things! And nowhere to buy them.",
    "A market? Pip has never been to a market. Pip has never been very far from this stone at all, actually. Is it loud? Pip hopes it's loud.",
    "Sable: Loud, busy, and it runs on lists, partner. Stock lists, price lists, the list of who owes me money. Short list. Everyone's honest round here. It's unnerving.",
    "Then the rune stone will keep **lists** too: lots of values under one name, in order, that can grow and shrink and be sorted. Let's build the Market Square!",
  ],
  finale: [
    "Sable: Lanterns lit, stalls full, bunting up, and look, LOOK, partner: customers! Wren's buying fish. Marlo's buying bread. Bram is haggling with me over the teapot and losing.",
    "Bram: I'm not losing. I'm letting you win. It's good for morale.",
    "Wren: Founder, look how many of us there are now. A tavern, a mill, a dock, and a whole square of neighbours!",
    "Four buildings! Four! Do you know what that makes us? A **Village**! Pip is going to need a much longer welcome speech.",
    "...Who's that? There's a carriage on the east road. A black one. With a crest on the door. Pip doesn't like crests.",
    "Vane: Good evening. Lord Aldous Vane, Vane Trading Company. Please, don't stop on my account. I shan't be a moment. I've only come to nail something up.",
    "Hsss! ...Sorry. That just came out. Pip apologises. Hsss. Sorry.",
    "Vane: A writ, duly sealed. Per the Company's charter of lands: any valley without a royal charter by midsummer reverts to the Company. This valley has none. Nothing personal. It's all in triplicate, which is the very opposite of personal.",
    "Sable: Reverts? REVERTS? Partner, I only just unpacked.",
    "Vane: The stalls are charming, by the way. The signage is non-compliant. Good evening.",
    "The lanterns are still lit. Everyone's still here. ...A royal charter, by midsummer. Founder, we've built four buildings out of an empty valley. We'll think of something. We always do, don't we?",
  ],
  chatDuring: [
    "Sable: Rule one of a market: the well goes in the middle. Rule two: the best stall goes behind the well. Rule three: the best stall is mine. Rules are rules, partner.",
    "Sable: I keep everything in lists. Stock, prices, who smiled at me today. Short list, that one. You're on it.",
    "Sable: Marlo says the bell rings when you get the runes right. I tried shouting the right answer at it. Nothing. Apparently it has standards.",
    "Sable: Fennick Gale? Who told you about Fennick Gale? ...Pip. Of course. Never trust a serpent with gossip, partner. They've nowhere to keep it.",
  ],
  chatAfter: [
    "Sable: First stall I've ever had that doesn't have wheels. I keep checking. Still no wheels.",
    "Sable: That writ on the notice post? I've read it six times. Very well written, I'll give him that. Horrible, but well written.",
    "Sable: Midsummer. A charter. Fine. I've beaten worse deadlines with a cart and one good wheel. Rule one, partner: never let a man with a seal tell you what your valley's worth.",
    "Sable: Sold out of honey cakes by noon. Bram says it's because I keep eating them. Bram is right, but he didn't have to say it.",
  ],
  chronicle: {
    title: "The First Silence",
    text: [
      "Traders came over the ridge in our fifth summer, with salt and cloth and news, and we laid a square of cobbles round the old well so that they would stay. They stayed. Willowmere grew loud with haggling, and I loved every bit of the noise.",
      "So it was strange, on a market morning in our ninth year, when I asked the well-stone for water and it did not answer. Not an error. Not a grumble. Nothing at all, for the space of three breaths. Then the bucket rose as it always had, the square went on with its business, and nobody noticed but me.",
      "I have been counting. When I came here, everyone spoke to the stones. Now most of the village asks one of the few who speak well, and the few are busy, and the asking is quicker than the learning. I do not know yet whether the two things are joined. I am afraid that they are.",
      "I have carved a rune into the well's keystone, facing the square, so that everyone who comes for water will see one and wonder what it says. It is a small thing. It is what I can think of.",
    ],
  },
  challenges: [
    {
      id: "mk01-survey-pegs",
      part: "Survey pegs",
      title: "Sable's Plan Sheet",
      topic: "making lists",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Sable: Five stalls round a well, partner. I drew the whole square on a sheet. Then I lost the sheet. Then Pip found the sheet.",
        "Pip was sitting on it. It was warm! Anyway: Sable's plan is a **list**, lots of values kept in order under one name.",
        "Square brackets go round the outside and commas go between the items. Each piece of text keeps its own quotes, and `len()` counts the items.",
      ],
      codex: ["lists"],
      quiz: {
        code: r`crates = ["eggs", "jam"]
print(len(crates))`,
        question: "What does this program show?",
        options: ["2", "7", "['eggs', 'jam']", "TypeError"],
        answer: 0,
        why: "On a list, len() counts the items, not the letters. There are two crates.",
      },
      task: [
        "Keep all five stalls from Sable's plan sheet together in one list, in the order the sheet gives them. Give it a name that says what it holds.",
        "Print the list itself, so Sable can see exactly what Python is holding.",
        "On another line, print how many stalls the plan has. Let Python do the counting.",
      ],
      starter: r`# Sable's plan sheet, stall by stall, from the left:
#   produce, trading, cloth, fish, bread
`,
      tests: PRE + r`plan = ["produce", "trading", "cloth", "fish", "bread"]
made = [v for k, v in ns.items() if isinstance(v, list) and not k.startswith("_")]
glued = [v for k, v in ns.items() if isinstance(v, str) and "produce" in v and "bread" in v]
check(made or not glued, "That's one long string with commas inside it, not a list. A list has square brackets round the outside, and each stall name is its own string, with its own quotes.")
check(made, "Keep the stalls in a list: square brackets round the outside, each stall name in quotes, commas between them.")
if plan not in made:
    biggest = max(made, key=len)
    check(sorted(biggest) != plan and sorted(biggest) != sorted(plan), "All five stalls are there, but not in the order of Sable's plan sheet. A list keeps the order you write it in.")
    check(len(biggest) >= 5, "Your list has only " + str(len(biggest)) + " items: " + str(biggest) + ". Is a comma missing? Two strings with nothing between them glue together into one item.")
    check(False, "Your list is " + str(biggest) + ". Check every stall against the plan sheet: the same words, all lowercase, in the same order.")
check(str(plan) in out, "Print the list itself, brackets and all, so Sable can see exactly what Python is holding.")
check("len(" in src, "Let Python count the stalls instead of counting them yourself. There's a tool from the tavern that counts.")
rest = [l for l in lines if str(plan) not in l]
check(any(shows(l, 5) for l in rest), "Print how many stalls there are, on a line of its own.")
if _re.search(r'"bread"\s*\]', src):
    vns, got = rerun(_re.sub(r'"bread"\s*\]', '"bread", "honey"]', src, count=1))
    more = [l for l in got if "honey" not in l]
    check(any(shows(l, 6) for l in more), "If Sable adds a sixth stall to the list, your count should say 6, but it doesn't. Print what len() counts, rather than typing the number.")`,
      hints: [
        "One name for many values. What goes round the outside of a list, and what goes between the items? Each stall name is text, so what does each one need around it?",
        "`trees = [\"oak\", \"ash\"]` is a list of two strings. `print(trees)` shows it with its brackets, and `len(trees)` counts its items.",
        "`stalls = [\"produce\", \"trading\", ...]` with all five names in the plan's order. Then print the list, and on the next line let a tool count it for you.",
      ],
      solution: r`stalls = ["produce", "trading", "cloth", "fish", "bread"]
print(stalls)
print(len(stalls), "stalls")`,
      wrong: [r`stalls = "produce, trading, cloth, fish, bread"
print(stalls)
print(len(stalls))`, r`stalls = ["produce", "cloth", "trading", "fish", "bread"]
print(stalls)
print(len(stalls))`, r`stalls = ["produce", "trading" "cloth", "fish", "bread"]
print(stalls)
print(len(stalls))`, r`stalls = ["produce", "trading", "cloth", "fish", "bread"]
print(stalls)
print(5)`, r`stalls = ["produce", "trading", "cloth", "fish", "bread"]
print(len(stalls))`, r`stalls = ["Produce", "Trading", "Cloth", "Fish", "Bread"]
print(stalls)
print(len(stalls))`, r`stalls = ["produce", "trading", "cloth", "fish", "bread"]
n = len(stalls)
print(stalls)
print("Stalls: 5")`],
      done: "Sable: Pegs in, string tight, five plots and a well in the middle. I can hear the haggling already. Lovely sound. Better than the bell. Don't tell Marlo.",
    },
    {
      id: "mk02-unloading",
      part: "Gravel bed and kerb",
      title: "Off the Cart",
      topic: "list indexes",
      cost: { wood: 0, stone: 5 },
      intro: [
        "Sable: Gravel first, then kerbstones all the way round, then the cobbles. I loaded the cart in order. In AN order.",
        "Every item in a list has a position, its **index**, and just like the letters in a string, counting starts at 0. Negative indexes count from the back.",
        "Ssso if you ask for a position that isn't there, the rune stone hisses an `IndexError` at you. Pip taught it that.",
      ],
      codex: ["list-index", "lists"],
      quiz: {
        code: r`bells = ["low", "mid", "high"]
print(bells[3])`,
        question: "What does this program show?",
        options: ["IndexError", "high", "low", "(nothing)"],
        answer: 0,
        why: "Three items have the indexes 0, 1 and 2. There is no index 3, so Python stops with an IndexError. The last bell is bells[2], or bells[-1].",
      },
      task: [
        "Print what's at the front of the cart: the first thing on the list.",
        "Print what's at the very back: the last thing. Do it in a way that still finds the back when Sable loads more, or less.",
        "Print the third thing on the list. (Sable counts like a person: first, second, third.)",
        "Print the thing just in front of the back one.",
        "One per line, in that order.",
      ],
      starter: r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]

# Unload: the front, the back, the third, and the one just before the back.
`,
      tests: PRE + r`C6 = 'cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]'
C8 = 'cart = ["sand", "kerbstones", "gravel", "rake", "string", "mallet", "lunch", "cobbles"]'
says(lines, [
    ("gravel", "the front of the cart", [("rake", "That's the second thing on the cart. Python counts from 0, so the front of the list is position 0.")]),
    ("cobble crate", "the very back of the cart", [("string", "That's one before the back.")]),
    ("kerbstones", "the third thing", [("mallet", "That's the fourth thing. Python counts from 0, so the third thing sits one place lower than a person would count."), ("rake", "That's the second thing.")]),
    ("string", "the thing just in front of the back", [("cobble crate", "That's the very back. You want the one just in front of it."), ("mallet", "That's two in front of the back.")]),
])
vns, got = again((C6, C8))
says(got, [
    ("sand", "the front of the cart"),
    ("cobbles", "the very back of the cart", [("mallet", "That's position 5 counted from the front, which was the back only while the cart held six things. Count from the back instead, so it finds the back of any cart.")]),
    ("gravel", "the third thing"),
    ("lunch", "the thing just in front of the back", [("string", "That's position 4 counted from the front, which only fitted a six-item cart. Count from the back.")]),
], "the cart holds eight things")`,
      hints: [
        "Write the six items on paper and number them the way Python does, starting at 0. Where does the third one sit? And which number always means \"the last one\", however long the list is?",
        "`hats = [\"red\", \"blue\", \"green\", \"gold\"]`: `hats[0]` is red and `hats[1]` is blue. Counting from the back, `hats[-1]` is gold and `hats[-3]` is blue again.",
        "`print(cart[0])` and `print(cart[-1])` for the front and back. The third thing and the one before the back follow the same pattern: you fill in those two numbers.",
      ],
      solution: r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[0])
print(cart[-1])
print(cart[2])
print(cart[-2])`,
      wrong: [r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[1])
print(cart[-1])
print(cart[3])
print(cart[-2])`, r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[0])
print(cart[5])
print(cart[2])
print(cart[4])`, r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[0])
print(cart[-1])
print(cart[3])
print(cart[-2])`, r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[0])
print(cart[-1])
print(cart[2])
print(cart[-1])`, r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print("gravel")
print("cobble crate")
print("kerbstones")
print("string")`, r`cart = ["gravel", "rake", "kerbstones", "mallet", "string", "cobble crate"]
print(cart[0])
print(cart[6])
print(cart[2])
print(cart[5])`],
      done: "Sable: Gravel raked, kerb laid, everything off the cart in the right order. I've never unloaded a cart in the right order. I usually just tip it.",
    },
    {
      id: "mk03-cobbles",
      part: "Cobbles",
      title: "Holes in the Row",
      topic: "changing list items",
      cost: { wood: 0, stone: 7 },
      intro: [
        "Sable: Cobbles, partner! Row after row of them. Except this row. This row has holes in it. I didn't do it. Probably the goat.",
        "Lists can **change**. Put an index on the left of `=` and that one item is replaced, while the rest of the list stays exactly where it is.",
        "Strings can't do that. Try to swap one letter of a string and the rune stone says `TypeError`. For text, you build a new string instead.",
      ],
      codex: ["list-index", "indexing"],
      quiz: {
        code: r`jars = ["jam", "honey"]
jars[0] = "pickles"
print(jars)`,
        question: "What does this program show?",
        options: ["['pickles', 'honey']", "['jam', 'honey']", "['pickles', 'jam', 'honey']", "TypeError"],
        answer: 0,
        why: "jars[0] = \"pickles\" replaces the item at index 0. Nothing is added and the other item stays where it was.",
      },
      task: [
        "Pip found holes in the third place of the row and in the very last place. Fill each one with a wedge stone, `\"wedge\"`, by changing the row itself. Don't write the row out again.",
        "Sable painted the entrance sign in a hurry and spelled MARKET wrong. Strings can't be changed in place, so make the mended sign out of the old one and keep it in `sign`.",
      ],
      starter: r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"

# 1. Fill the holes in the row
# 2. Mend the sign

print(row)
print(sign)
`,
      tests: PRE + r`R8 = 'row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]'
R10 = 'row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "cobble", "cobble", "hole"]'
check(len(_re.findall(r"\brow\s*=\s*\[", src)) == 1, "Keep the row from the starter and change it in place, one stone at a time. Writing the whole row out again doesn't count, partner.")
row = ns.get("row")
check(isinstance(row, list), "row should still be a list.")
check(len(row) == 8, "The row should still have 8 stones, but it has " + str(len(row)) + ". Replace the holes; don't add or take away stones.")
check(row[3] != "wedge", "There's a wedge in the fourth place. Python counts from 0, so the third place is one index lower than you'd think.")
check(row[2] == "wedge", "The third place is still " + repr(row[2]) + ".")
check(row[-1] == "wedge", "The last place is still " + repr(row[-1]) + ".")
check(row.count("wedge") == 2, "Only the two holes should get wedges.")
check(ns.get("sign") != "MARKIT SQUARE", "The sign still says MARKIT SQUARE. Build the mended sign and keep it in sign itself, so the last line prints it.")
check(ns.get("sign") == "MARKET SQUARE", "The sign says " + repr(ns.get("sign")) + ". Only the one wrong letter should change.")
vns, got = again((R8, R10), ('sign = "MARKIT SQUARE"', 'sign = "MARKIT ROW"'))
r2 = vns["row"]
check(r2[2] == "wedge" and r2[-1] == "wedge" and r2.count("wedge") == 2, "When the row is ten stones long, its last hole is at a different index, and your program missed it. Count from the back, so it finds the last place in any row.")
check(vns["sign"] == "MARKET ROW", "When the sign says MARKIT ROW, your program turns it into " + repr(vns["sign"]) + ". Keep the right pieces of the old sign and swap only the wrong letter.")`,
      hints: [
        "Two separate fixes. For the row: which indexes are \"the third place\" and \"the last place\" when Python counts from 0? For the sign: which letter is wrong, and which pieces of the old sign are already right?",
        "`pots[1] = \"new\"` replaces the second pot and leaves the rest alone. Text is rebuilt instead: `name = \"PIPP\"` can become `name[:3]`, or `name.replace(\"PP\", \"P\")`, a new string stored back in the same name.",
        "`row[2] = \"wedge\"`, then the same for the last place, counted from the back. For the sign: the first four letters, `sign[:4]`, then the right letter, then everything after the wrong one.",
      ],
      solution: r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[2] = "wedge"
row[-1] = "wedge"
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`,
      wrong: [r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[3] = "wedge"
row[-1] = "wedge"
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[2] = "wedge"
row[7] = "wedge"
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row = ["cobble", "cobble", "wedge", "cobble", "cobble", "cobble", "cobble", "wedge"]
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[2] = "wedge"
row[-1] = "wedge"
sign[4] = "E"
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[2] = "wedge"
row[-1] = "wedge"
sign = "MARKET SQUARE"
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row.append("wedge")
row[2] = "wedge"
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row=["cobble", "cobble", "wedge", "cobble", "cobble", "cobble", "cobble", "wedge"]
sign = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`, r`row = ["cobble", "cobble", "hole", "cobble", "cobble", "cobble", "cobble", "hole"]
sign = "MARKIT SQUARE"
row[2] = "wedge"
row[-1] = "wedge"
fixed = sign[:4] + "E" + sign[5:]
print(row)
print(sign)`],
      done: "Sable: A whole square of cobbles, not a hole in it, and a sign spelled like I went to school. I didn't. Now nobody needs to know.",
    },
    {
      id: "mk04-well",
      part: "Rebuilt well",
      title: "Course by Course",
      topic: "append",
      cost: { wood: 1, stone: 6 },
      intro: [
        "Right in the middle of the cobbles: the old well shaft. Pip remembers... Pip has *heard* there was a well here. A long time ago.",
        "Sable: We rebuild it course by course, bottom to top, and every course goes in my ledger the moment it's laid. Not before. I don't write down things that haven't happened. Mostly.",
        "Start with an empty list `[]` and `.append()` each new thing as it happens. Append always adds to the **end**, and it changes the list itself.",
      ],
      codex: ["list-methods", "lists"],
      quiz: {
        code: r`basket = ["plum"]
print(basket.append("fig"))`,
        question: "What does this program show?",
        options: ["None", "['plum', 'fig']", "fig", "(nothing)"],
        answer: 0,
        why: "append changes the list and gives back None. The fig is in the basket now, but what append handed back to print was None.",
      },
      task: [
        "Lay the well from the bottom up. Each time a course is laid, add an entry to Sable's ledger naming it: the first is `course 1`, then `course 2`, and so on.",
        "Lay as many courses as `courses` says (Sable might yet order a deeper well).",
        "When every course is down, the rim goes on top: it goes in the ledger last, as `rim`.",
        "Build the ledger up from the empty list; don't write it out in one go.",
      ],
      starter: r`courses = 3      # rings of stone the well needs
well = []        # Sable's ledger of the well, bottom to top

# 1. The courses, one at a time, from the bottom
# 2. The rim

print(well)
print(len(well), "pieces")
`,
      tests: PRE + r`w = ns.get("well")
check(isinstance(w, list), "well isn't a list any more, it's " + repr(w) + ". append changes the list itself and gives back None, so storing what it gives back throws the ledger away. Call it on a line of its own.")
check(".append(" in src, "Build the ledger up with append, one piece at a time, as each piece is laid.")
check(len(w) > 0, "The ledger is still empty. Add each course to well as it's laid.")
check("course 0" not in w, "Your ledger has a course 0. Sable counts courses like a mason does, from course 1.")
check(w.count("rim") <= 1, "The rim went on " + str(w.count("rim")) + " times. It goes on once, after every course, so it belongs after the loop, not inside it.")
check(w[-1] == "rim", "The rim should be the last thing in the ledger, after every course.")
check(w == ["course 1", "course 2", "course 3", "rim"], "Your ledger says " + str(w) + ". It needs one entry per course, named course 1, course 2 and so on, and then the rim.")
for n in [5, 1, 0]:
    vns, got = again(("courses = 3", "courses = " + str(n)))
    want = ["course " + str(k) for k in range(1, n + 1)] + ["rim"]
    check(vns.get("well") == want, "When courses = " + str(n) + ", the ledger should be " + str(want) + ", but yours is " + str(vns.get("well")) + ". Lay one course per round, as many rounds as courses says.")`,
      hints: [
        "Picture Sable with the chalk: lay a course, write it down, lay the next, write that down. That repeating part needs a counter that climbs, like the dock's loops, and it stops once every course is laid. The rim happens once, after all that.",
        "`songs = []` then `songs.append(\"hum\")` gives `['hum']`, and every append adds to the end. Inside a loop, `f\"verse {n}\"` builds a label from the counter.",
        "`n = 1`, then `while n <= courses:` with two lines inside: append the label for course `n`, then move the counter on. After the loop, not indented, one last append.",
      ],
      solution: r`courses = 3
well = []
n = 1
while n <= courses:
    well.append(f"course {n}")
    n += 1
well.append("rim")
print(well)
print(len(well), "pieces")`,
      wrong: [r`courses = 3
well = []
well.append("course 1")
well.append("course 2")
well.append("course 3")
well.append("rim")
print(well)
print(len(well), "pieces")`, r`courses = 3
well = []
n = 1
while n <= courses:
    well.append(f"course {n}")
    well.append("rim")
    n += 1
print(well)
print(len(well), "pieces")`, r`courses = 3
well = []
n = 0
while n < courses:
    well.append(f"course {n}")
    n += 1
well.append("rim")
print(well)
print(len(well), "pieces")`, r`courses = 3
well = []
n = 1
while n <= courses:
    well = well.append(f"course {n}")
    n += 1
well.append("rim")
print(well)
print(len(well), "pieces")`, r`courses = 3
well = []
n = 0
while n <= courses:
    well.append(f"course {n + 1}")
    n += 1
well.append("rim")
print(well)
print(len(well), "pieces")`, r`courses = 3
well = []
n = 1
while n <= courses:
    well.append("course " + n)
    n += 1
well.append("rim")
print(well)
print(len(well), "pieces")`, r`courses = 3
well = ["course 1", "course 2", "course 3"]
well.append("rim")
print(well)
print(len(well), "pieces")`],
      done: "Sable: Three courses and a rim, and look at the keystone: there's a rune carved on it, facing the square. Pip, why is your tail glowing? ...Pip says it's the sun. It's cloudy, Pip.",
    },
    {
      id: "mk05-windlass",
      part: "Well roof and windlass",
      title: "Jobs in Order",
      topic: "insert, remove and pop",
      cost: { wood: 6, stone: 1 },
      intro: [
        "Sable: A roof on the well, a windlass to wind the bucket up, a crank to turn it. I've written the jobs down in order. Wren has opinions about my order.",
        "Wren: The windlass goes in *before* the roof, Sable. Otherwise where does it go, through the shingles?",
        "Three new tools: `.insert(index, item)` slips an item in at a position, `.remove(item)` takes away the first match, and `.pop()` takes an item out **and hands it back** to you.",
      ],
      codex: ["list-methods"],
      quiz: {
        code: r`boxes = ["tea", "salt", "tea"]
boxes.pop()
print(boxes)`,
        question: "What does this program show?",
        options: ["['tea', 'salt']", "['salt', 'tea']", "tea", "['tea', 'salt', 'tea']"],
        answer: 0,
        why: "pop() with nothing in the brackets takes out the last item. (remove(\"tea\") would have taken the first one instead.)",
      },
      task: [
        "Wren is right: the windlass job goes after the braces and just before the roof. Slip `windlass` into its place.",
        "Sweeping up twice is silly: Sable will sweep once, at the very end. Take away the first sweep-up and keep the last.",
        "Bram already hung a bucket for us (he's thoughtful like that). Take the bucket job off the list.",
        "Then start work: take the first job off the list, and announce on its own line what you're starting. The last print shows the jobs still waiting.",
        "Change the list; don't write it out again.",
      ],
      starter: r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]

# Sort the jobs out, then start on the first one.

print(jobs)
`,
      tests: PRE + r`check(src.count("jobs = [") == 1, "Keep the jobs list from the starter and change it with its own methods. Writing it out again doesn't count.")
j = ns.get("jobs")
check(isinstance(j, list), "jobs isn't a list any more, it's " + repr(j) + ". insert and remove change the list and give back None, so don't store what they give back.")
check("posts" not in j, "The posts are still on the list. Starting work takes the first job off the list.")
check("windlass" in j, "The windlass job isn't on the list yet.")
check("braces" in j and "roof" in j and j.index("braces") < j.index("windlass") and j.index("roof") == j.index("windlass") + 1, "The windlass is in the wrong place. It goes after the braces and just before the roof.")
check(j.count("sweep up") != 0, "Both sweep-ups are gone. remove takes away one match each time you call it.")
check(j.count("sweep up") == 1, "There are still two sweep-ups on the list.")
check(j[-1] == "sweep up", "The sweep-up that stays should be the last job, at the very end.")
check("bucket" not in j, "The bucket job is still on the list. Bram already did it.")
check(j == ["braces", "windlass", "roof", "shingles", "sweep up"], "The jobs left are " + str(j) + ", which isn't quite right. Write the list on paper after each change.")
check(".pop(" in src, "Take the first job off with pop, so it hands the job back for you to announce.")
check(len(lines) == 2, "Print two lines: what you're starting, then the jobs still waiting (the starter's last line).")
check("posts" in lines[0] and "[" not in lines[0], "The first line should announce the job you took off the list, in words (not the whole list).")
vns, got = again(('jobs = ["posts",', 'jobs = ["stone pads",'))
check(len(got) == 2 and "stone pads" in got[0], "When the first job is stone pads, your announcement should say stone pads. Announce the job pop handed back, instead of typing its name.")`,
      hints: [
        "Do the four changes in the order the task gives, and after each one write the list out on paper to see where everything has shifted to. Which change needs a position, which needs a name, and which hands something back?",
        "`hats.insert(1, \"cap\")` puts cap at index 1 and shuffles the rest along. `hats.remove(\"scarf\")` takes away the first scarf. `first = hats.pop(0)` takes the first hat off and keeps it in `first`.",
        "`jobs.insert(___, \"windlass\")` with the position the windlass should end up at (count it on paper). Then remove the sweep-up and the bucket by name, then `doing = jobs.pop(...)` with the position of the first job, and print `doing` in a sentence.",
      ],
      solution: r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
jobs.remove("bucket")
doing = jobs.pop(0)
print(f"Now working on: {doing}")
print(jobs)`,
      wrong: [r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(3, "windlass")
jobs.remove("sweep up")
jobs.remove("bucket")
doing = jobs.pop(0)
print(f"Now working on: {doing}")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
jobs.remove("sweep up")
jobs.remove("bucket")
doing = jobs.pop(0)
print(f"Now working on: {doing}")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
jobs.remove("bucket")
doing = jobs.pop()
print(f"Now working on: {doing}")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
jobs.remove("bucket")
jobs.pop(0)
print("Now working on: posts")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
jobs.remove("bucket")
jobs.remove("posts")
print("Now working on: posts")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs.insert(2, "windlass")
jobs.remove("sweep up")
doing = jobs.pop(0)
print(f"Now working on: {doing}")
print(jobs)`, r`jobs = ["posts", "braces", "roof", "sweep up", "shingles", "bucket", "sweep up"]
jobs = jobs.insert(2, "windlass")
print(jobs)`],
      done: "Wren: Windlass, crank, a shingled roof and a bucket that comes up full. In the right order, too. Sable says they'll write that down in the ledger. In very small letters.",
    },
    {
      id: "mk06-stall-frames",
      part: "Stall frames",
      title: "Is It on the Cart?",
      topic: "in and not in on lists",
      cost: { wood: 7, stone: 2 },
      intro: [
        "Five stall frames: posts on stone pads, roof beams, plank counters and shelves. Sable's cart is piled high. Is everything on it? Is anything on it that shouldn't be?",
        "`in` works on lists too, but on a list it looks for a **whole item**, not a few letters: `\"pad\" in [\"stone pads\"]` is False.",
        "And look before you leap! Removing something that isn't in the list makes the rune stone shout `ValueError`. Ask with `in` first.",
      ],
      codex: ["list-search", "list-methods"],
      quiz: {
        code: r`cart = ["roof beams", "nails"]
print("beam" in cart)`,
        question: "What does this program show?",
        options: ["False", "True", "roof beams", "TypeError"],
        answer: 0,
        why: "On a list, in looks for a whole item that is exactly \"beam\". \"roof beams\" has those letters inside it, but it isn't the same item, so the answer is False.",
      },
      task: [
        "A frame can only stand with posts **and** stone pads. If both are on the cart, print `The frames can go up.` Otherwise print `Not yet. Something's missing.`",
        "Every stall needs shelves. If there are none on the cart, add them (as `shelves`), but never add a second lot.",
        "Sable sold the sawhorse to a passing tinker on the way here (of course they did). If it's still on the cart, take it off. If it's already gone, leave the cart alone.",
        "The starter's last line prints the cart.",
      ],
      starter: r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]

# 1. Can the frames stand today?
# 2. The shelves
# 3. The sawhorse

print(cart)
`,
      tests: PRE + r`C = 'cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]'
c = ns.get("cart")
check(isinstance(c, list), "cart should still be a list.")
check("shelves" in c, "There are no shelves on the cart. Add them when they're missing.")
check("sawhorse" not in c, "The sawhorse is still on the cart. Sable sold it.")
expect_lines(["The frames can go up.", "['posts', 'roof beams', 'counter planks', 'stone pads', 'shelves']"])
expect_when([(C, 'cart = ["stone pads", "roof beams", "sawhorse"]')], ["Not yet. Something's missing.", "['stone pads', 'roof beams', 'shelves']"], "There are no posts on this cart, so the frames can't stand. Ask the cart about the posts and about the stone pads, each as a whole question of its own.")
expect_when([(C, 'cart = ["posts", "roof beams", "sawhorse"]')], ["Not yet. Something's missing.", "['posts', 'roof beams', 'shelves']"], "No stone pads here, so the frames can't stand: both are needed.")
expect_when([(C, 'cart = ["posts", "shelves", "stone pads", "sawhorse"]')], ["The frames can go up.", "['posts', 'shelves', 'stone pads']"], "The shelves are already on this cart, so don't add a second lot.")
expect_when([(C, 'cart = ["posts", "stone pads", "counter planks"]')], ["The frames can go up.", "['posts', 'stone pads', 'counter planks', 'shelves']"], "The sawhorse is already gone from this cart, so leave the cart alone.")`,
      hints: [
        "Three separate decisions, each with its own if. Which one needs an else? For the other two, think about what goes wrong if you just do it without asking first: a second lot of shelves, or removing a sawhorse that isn't there.",
        "`\"jam\" in jars` is True only when one of the items is exactly \"jam\", and `not in` asks the opposite. Both fit straight into an if, like `if \"owl\" not in birds:`. A change written inside such an if only happens when the answer allows it.",
        "The frames: `if \"posts\" in cart and ... in cart:`, with both sides whole questions, and an else. The shelves and the sawhorse each need their own question first, with the change indented underneath: which of the two asks `in`, and which asks `not in`?",
      ],
      solution: r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
if "posts" in cart and "stone pads" in cart:
    print("The frames can go up.")
else:
    print("Not yet. Something's missing.")
if "shelves" not in cart:
    cart.append("shelves")
if "sawhorse" in cart:
    cart.remove("sawhorse")
print(cart)`,
      wrong: [r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
if "posts" in cart or "stone pads" in cart:
    print("The frames can go up.")
else:
    print("Not yet. Something's missing.")
if "shelves" not in cart:
    cart.append("shelves")
if "sawhorse" in cart:
    cart.remove("sawhorse")
print(cart)`, r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
if "posts" and "stone pads" in cart:
    print("The frames can go up.")
else:
    print("Not yet. Something's missing.")
if "shelves" not in cart:
    cart.append("shelves")
if "sawhorse" in cart:
    cart.remove("sawhorse")
print(cart)`, r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
if "posts" in cart and "stone pads" in cart:
    print("The frames can go up.")
else:
    print("Not yet. Something's missing.")
cart.append("shelves")
if "sawhorse" in cart:
    cart.remove("sawhorse")
print(cart)`, r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
if "posts" in cart and "stone pads" in cart:
    print("The frames can go up.")
else:
    print("Not yet. Something's missing.")
if "shelves" not in cart:
    cart.append("shelves")
cart.remove("sawhorse")
print(cart)`, r`cart = ["posts", "roof beams", "counter planks", "stone pads", "sawhorse"]
print("The frames can go up.")
if "shelves" not in cart:
    cart.append("shelves")
if "sawhorse" in cart:
    cart.remove("sawhorse")
print(cart)`],
      done: "Sable: Five frames standing, a shelf in every one, and not a sawhorse in sight. I got two coppers for it. And a pencil. The pencil was the real prize.",
    },
    {
      id: "mk07-awnings",
      part: "Striped awnings",
      title: "Stripes in Order",
      topic: "sort and sorted",
      cost: { wood: 4, stone: 0 },
      intro: [
        "Sable: Awnings! Stripes! Colour! I keep my cloth bolts in the ledger in the order I bought them, and that order is sacred, partner. Sacred.",
        "Sable: But the awnings go up A to Z, because a tidy square sells better. And the poles go up tallest first.",
        "Two ways to sort: `list.sort()` sorts the list itself, and `sorted(list)` makes a sorted **copy** and leaves the original alone. Either one takes `reverse=True` for biggest first.",
        "Careful: `sort()` changes the list and gives back `None`. Ssso don't store what it gives back!",
      ],
      codex: ["sorting"],
      quiz: {
        code: r`nums = [3, 1, 2]
print(nums.sort())`,
        question: "What does this program show?",
        options: ["None", "[1, 2, 3]", "[3, 1, 2]", "(nothing)"],
        answer: 0,
        why: "sort() sorts nums where it is and gives back None, and None is what got printed. print(nums) on the next line would show [1, 2, 3].",
      },
      task: [
        "Print the cloths in A-to-Z order for hanging. Then print Sable's ledger, to show it is still in the order the cloths were bought.",
        "Sable's coin sign will hang over the third awning in the row. Print which cloth that is.",
        "The poles go up tallest first, and nobody needs their old order: put the `poles` list itself in that order, then print it.",
      ],
      starter: r`cloths = ["saffron", "rose", "moss", "cream", "sky"]   # Sable's ledger, in the order they were bought
poles = [2.4, 2.65, 2.5, 2.3, 2.55]                    # awning pole lengths, in metres

# 1. The awning order (and Sable's untouched ledger)
# 2. The awning under Sable's sign
# 3. The poles, tallest first
`,
      tests: PRE + r`C0 = ["saffron", "rose", "moss", "cream", "sky"]
P0 = [2.4, 2.65, 2.5, 2.3, 2.55]
check(ns.get("cloths") == C0, "Sable's ledger has changed: cloths is now " + str(ns.get("cloths")) + ". It must stay in the order the cloths were bought. One of the two ways of sorting leaves the original alone.")
p = ns.get("poles")
check(isinstance(p, list), "poles isn't a list any more, it's " + repr(p) + ". sort() sorts the list where it is and gives back None, so don't store what it gives back.")
check(p != sorted(P0), "The poles are sorted shortest first. Sable wants the tallest first.")
check(p == sorted(P0, reverse=True), "The poles list itself should end up tallest first. Printing a sorted copy isn't enough here: the list has to change.")
says(lines, [
    (sorted(C0), "the cloths in A-to-Z order", [(sorted(C0, reverse=True), "That's Z to A. The awnings go up A to Z.")]),
    (C0, "Sable's ledger, still in the order the cloths were bought", [(sorted(C0), "That's sorted. The ledger has to stay in the order the cloths were bought.")]),
    ("rose", "the cloth of the third awning in the row", [("moss", "That's the third cloth in the ledger. The awnings hang in A-to-Z order, so look at the third one in that order."), ("saffron", "That's the fourth awning. Python counts from 0.")]),
    (sorted(P0, reverse=True), "the poles, tallest first"),
])
vns, got = again(('cloths = ["saffron", "rose", "moss", "cream", "sky"]', 'cloths = ["teal", "amber", "plum", "lilac"]'), ("poles = [2.4, 2.65, 2.5, 2.3, 2.55]", "poles = [3.1, 2.2, 2.9]"))
says(got, [
    (["amber", "lilac", "plum", "teal"], "the cloths in A-to-Z order"),
    (["teal", "amber", "plum", "lilac"], "Sable's ledger, unchanged"),
    ("plum", "the cloth of the third awning in the row"),
    ([3.1, 2.9, 2.2], "the poles, tallest first"),
], "the cloths and poles are different ones")`,
      hints: [
        "Two different jobs. One list must stay exactly as it is while you show a sorted version of it; the other list may be changed for good. Which sorting tool fits which job? And the sign: the third awning in which order?",
        "`sorted(names)` is a sorted copy that leaves `names` alone, and a copy is a list like any other: you can store it in a name and index it. `scores.sort(reverse=True)` reorders `scores` itself, biggest first, and gives back nothing worth keeping.",
        "Keep the hanging order in its own name, e.g. `hanging = sorted(cloths)`, and print it and the ledger. The sign's awning is one index into `hanging`. The poles are sorted in place, biggest first, and then printed.",
      ],
      solution: r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
hanging = sorted(cloths)
print(hanging)
print(cloths)
print(hanging[2])
poles.sort(reverse=True)
print(poles)`,
      wrong: [r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
cloths.sort()
print(cloths)
print(cloths)
poles.sort(reverse=True)
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths))
print(cloths)
poles.sort()
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths))
print(cloths)
poles = poles.sort(reverse=True)
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths))
print(cloths)
print(sorted(poles, reverse=True))`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths, reverse=True))
print(cloths)
print(sorted(cloths, reverse=True)[2])
poles.sort(reverse=True)
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(["cream", "moss", "rose", "saffron", "sky"])
print(cloths)
print("rose")
poles.sort(reverse=True)
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths))
print(cloths)
print(cloths[2])
poles.sort(reverse=True)
print(poles)`, r`cloths = ["saffron", "rose", "moss", "cream", "sky"]
poles = [2.4, 2.65, 2.5, 2.3, 2.55]
print(sorted(cloths))
print(cloths)
print(sorted(cloths)[3])
poles.sort(reverse=True)
print(poles)`],
      done: "Sable: Cream, moss, rose, saffron and sky, flapping in exactly the right order, and my coin sign over the rose. Of course the rose. Folk will come from three valleys just to look at my awnings. And then buy things. Mostly the buying.",
    },
    {
      id: "mk08-bread-stall",
      part: "Produce and bread stalls",
      title: "A Week of Loaves",
      topic: "sum, min, max and averages",
      cost: { wood: 3, stone: 1 },
      intro: [
        "The village's own goods arrive: apples and cabbages, pumpkins as big as Pip (Pip measured), and Wren's flour sacks stacked like pillows.",
        "Wren: I've been selling bread from the tavern window all week while you built. I kept count of every day, of course. I want to know if it's worth a second oven.",
        "Lists come with friends: `sum()`, `min()`, `max()` and `len()` each work on a whole list at once. An average is the total shared out over how many there are.",
      ],
      codex: ["list-maths", "min-max"],
      quiz: {
        code: r`weights = [2, 4, 9]
print(sum(weights) / len(weights))`,
        question: "What does this program show?",
        options: ["5.0", "5", "15", "TypeError"],
        answer: 0,
        why: "sum is 15 and len is 3, and / always gives a decimal number, so 15 / 3 is 5.0.",
      },
      task: [
        "Print the total loaves sold this week, then the most sold on one day, then the fewest. One per line, in that order.",
        "Next, how many loaves the worst day fell short of Wren's goal. If even the worst day reached the goal, it fell short by 0, not by a negative number.",
        "Then the average a day, rounded to 1 decimal place. Work it out so it still comes out right when Wren adds tomorrow's count to the list.",
        "Last line: if the average reaches Wren's goal (exactly the goal counts), print `Wren: Two ovens it is!`, otherwise `Wren: One oven will do.`",
      ],
      starter: r`loaves = [32, 41, 27, 38, 45, 29]   # loaves sold from the tavern window, day by day
goal = 35                            # Wren hopes to sell this many a day, on average

# The total, the best day, the worst day, the average, and the oven.
`,
      tests: PRE + r`def bread(loaves, goal):
    avg = sum(loaves) / len(loaves)
    oven = "Wren: Two ovens it is!" if avg >= goal else "Wren: One oven will do."
    other = "Wren: One oven will do." if avg >= goal else "Wren: Two ovens it is!"
    return [
        (sum(loaves), "the total loaves sold"),
        (max(loaves), "the most sold on one day", [(min(loaves), "That's the fewest. Which tool gives the biggest?")]),
        (min(loaves), "the fewest sold on one day", [(max(loaves), "That's the most. Which tool gives the smallest?")]),
        (max(0, goal - min(loaves)), "how far the worst day fell short of the goal", [(goal - min(loaves), "That's below zero: the worst day beat the goal, so it fell short by nothing at all. Which tool picks the bigger of two numbers?"), (min(loaves) - goal, "That's the wrong way round: take the worst day away from the goal.")]),
        (round(avg, 1), "the average a day, to 1 decimal place", [(avg, "That's the average with every decimal still on. Round it to 1 decimal place."), (round(avg), "That's rounded to a whole number. Wren wants 1 decimal place.")]),
        (oven, "Wren's oven line", [(other, "That's the wrong oven. Compare the average with the goal, and remember that exactly the goal counts.")]),
    ]
L6 = "loaves = [32, 41, 27, 38, 45, 29]"
says(lines, bread([32, 41, 27, 38, 45, 29], 35))
vns, got = again((L6, "loaves = [30, 40, 35, 35, 25, 45, 50]"))
says(got, bread([30, 40, 35, 35, 25, 45, 50], 35), "there are seven days of loaves")
vns, got = again(("goal = 35", "goal = 36"))
says(got, bread([32, 41, 27, 38, 45, 29], 36), "goal = 36")
vns, got = again((L6, "loaves = [35, 35, 35, 35]"))
says(got, bread([35, 35, 35, 35], 35), "loaves = [35, 35, 35, 35]")
vns, got = again((L6, "loaves = [40, 38]"))
says(got, bread([40, 38], 35), "loaves = [40, 38] (even the worst day beats the goal)")`,
      hints: [
        "Each of the first three answers is one built-in tool used on the whole list. The shortfall is a subtraction that must never go below zero: which mill tool picks the bigger of two numbers? The average needs dividing: by what, so it still works with seven days, or eight?",
        "`sum(scores)`, `max(scores)`, `min(scores)` and `len(scores)` each work on a whole list. `max(0, 3 - 5)` is 0, because 0 is bigger than -2. `round(7.256, 1)` keeps 1 decimal place, giving 7.3.",
        "Shortfall: the goal take away the worst day, held at zero or above with `max(0, ...)`. `average = sum(loaves) / ___` with the number of days filled in by a tool, then print it rounded. For the oven, an if/else comparing the average with the goal: which comparison lets exactly the goal count?",
      ],
      solution: r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / len(loaves)
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", round(average, 1))
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`,
      wrong: [r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / 6
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", round(average, 1))
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / len(loaves)
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", average)
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / len(loaves)
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", round(average, 1))
if average > goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / len(loaves)
print("Total:", sum(loaves))
print("Best day:", min(loaves))
print("Worst day:", max(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", round(average, 1))
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
print("Total: 212")
print("Best day: 45")
print("Worst day: 27")
print("Short by: 8")
print("Average: 35.3")
print("Wren: Two ovens it is!")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = round(sum(loaves) / len(loaves))
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", max(0, goal - min(loaves)))
print("Average:", average)
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`, r`loaves = [32, 41, 27, 38, 45, 29]
goal = 35
average = sum(loaves) / len(loaves)
print("Total:", sum(loaves))
print("Best day:", max(loaves))
print("Worst day:", min(loaves))
print("Short by:", goal - min(loaves))
print("Average:", round(average, 1))
if average >= goal:
    print("Wren: Two ovens it is!")
else:
    print("Wren: One oven will do.")`],
      done: "Wren: Two hundred and twelve loaves! Bram, did you hear that? I need a second oven! ...Bram says he heard, and that he isn't carrying it.",
    },
    {
      id: "mk09-fish-stall",
      part: "Fish and cloth stalls",
      title: "Freshest First",
      topic: "slicing lists",
      cost: { wood: 4, stone: 1 },
      intro: [
        "Marlo: Morning. Brought the catch up from the dock. Freshest at the front of the list, the way my grandmother kept them. The cloth and pottery stall's going up next door.",
        "Marlo: Best ones go on the ice. Last ones go to Bram for the stew. Sable wants... something. Sable always wants something.",
        "Slices work on lists just like on strings: `items[1:4]` is a new list of the items from index 1 up to, but not including, 4. And `[:]` copies the whole list.",
        "Careful! `mine = items` doesn't copy anything. It's one list with two names: cross something off one and you've crossed it off both.",
      ],
      codex: ["list-slicing", "list-methods"],
      quiz: {
        code: r`pots = ["jug", "bowl", "vase", "urn"]
print(pots[1:3])`,
        question: "What does this program show?",
        options: ["['bowl', 'vase']", "['jug', 'bowl']", "['bowl', 'vase', 'urn']", "bowl"],
        answer: 0,
        why: "The slice starts at index 1 (bowl) and stops just before index 3, so you get bowl and vase, as a new list.",
      },
      task: [
        "The three freshest fish go on the ice at the front of the stall. Print them as a list.",
        "The last two go to Bram's stew pot, however big the catch is. Print them as a list.",
        "Sable wants their own copy of the whole catch for the ledger. Make it, cross the first fish off Sable's copy (sold already!) and print Sable's copy.",
        "Marlo's `catch` must still hold every fish at the end.",
      ],
      starter: r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]   # Marlo's catch, freshest first

# 1. The ice
# 2. The stew pot
# 3. Sable's copy
`,
      tests: PRE + r`F0 = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
c = ns.get("catch")
twins = [k for k, v in ns.items() if v is c and k != "catch"]
check(not twins or c == F0, "Marlo's own catch has lost its first fish! Sable's copy and catch are the same list under two names, so crossing a fish off one crosses it off both. Make a real copy.")
check(c != F0[1:], "Marlo's own catch has lost its first fish! Cross it off Sable's copy, not Marlo's list.")
check(c == F0, "Marlo's catch should still have every fish in order, but it is " + str(c) + ".")
copies = [k for k, v in ns.items() if isinstance(v, list) and v == F0[1:] and not k.startswith("_")]
check(copies, "Make Sable's copy of the whole catch, cross its first fish off, and keep it in its own name.")
def fish(f):
    return [
        (f[:3], "the three freshest fish, as a list", [(f[:2], "That's only two fish: a slice stops just before its end number."), (f[1:4], "Those start at the second fish. The freshest is at index 0.")]),
        (f[-2:], "the last two fish, as a list", [(f[-1], "That's one fish, not a list of the last two. A slice has a colon inside the brackets.")]),
        (f[1:], "Sable's copy with the first fish crossed off", [(f, "That's still the whole catch. Cross the first fish off Sable's copy.")]),
    ]
says(lines, fish(F0))
vns, got = again(('catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]', 'catch = ["eel", "pike", "perch", "trout", "carp", "roach", "bream", "tench", "rudd"]'))
says(got, fish(["eel", "pike", "perch", "trout", "carp", "roach", "bream", "tench", "rudd"]), "the catch is nine fish")`,
      hints: [
        "Count on paper: which index does the freshest fish sit at, and where does a slice stop? For the stew pot, can you count from the back instead? For Sable, ask yourself: is it a copy, or the same list with a new name?",
        "`hens[:2]` is a new list of the first two hens, and `hens[-3:]` the last three. `mine = hens[:]` is a real copy: append to `mine` and `hens` doesn't change.",
        "`print(catch[:3])`, then a slice counted from the back for the stew pot. For Sable: make a real copy first and give it its own name, then take the first fish off the copy (not off `catch`), and print the copy.",
      ],
      solution: r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[:3])
print(catch[-2:])
ledger = catch[:]
ledger.pop(0)
print(ledger)`,
      wrong: [r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[:3])
print(catch[-2:])
ledger = catch
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[0:2])
print(catch[-2:])
ledger = catch[:]
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[:3])
print(catch[5:7])
ledger = catch[:]
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[:3])
print(catch[-2])
ledger = catch[:]
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[1:4])
print(catch[-2:])
ledger = catch[:]
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(["pike", "perch", "trout"])
print(["bream", "tench"])
ledger = catch[:]
ledger.pop(0)
print(ledger)`, r`catch = ["pike", "perch", "trout", "carp", "roach", "bream", "tench"]
print(catch[:3])
print(catch[-2:])
ledger = catch[:]
catch.pop(0)
print(ledger)`],
      done: "Marlo: Fish on the ice, two for the stew, and Sable's got their own list to scribble on. My grandmother would have liked this stall. She'd have haggled with Sable. And won.",
    },
    {
      id: "mk10-sables-stall",
      part: "Sable's trading stall",
      title: "Twenty Years for This",
      topic: "count and index",
      cost: { wood: 6, stone: 2 },
      intro: [
        "Sable: My stall. MINE. The grandest one: a brass balance, a chest of coins, rugs over the rail, and my coin sign swinging over it all. Twenty years I've waited for a stall without wheels.",
        "Sable: I sold a few things while you built it, purely to test the counter. Here's the tally, one entry per sale, in order.",
        "`.count(item)` says how many times something is in a list, and `.index(item)` says where the **first** one is, counting from 0. Asking `index` for something that isn't there is a `ValueError`, so check with `in` first.",
      ],
      codex: ["list-search"],
      quiz: {
        code: r`pets = ["cat", "dog", "cat", "hen"]
print(pets.index("cat"))`,
        question: "What does this program show?",
        options: ["0", "2", "1", "[0, 2]"],
        answer: 0,
        why: "index gives the position of the first match only, counting from 0. The first cat is at index 0.",
      },
      task: [
        "How many buttons did Sable sell? (Their favourite. They'll check.)",
        "Which sale was the first teapot? Sable numbers sales like a shopkeeper: the first sale of the day is sale 1.",
        "Which sale was the rug, numbered the same way?",
        "Sable stocked one lantern, just to undercut Fennick Gale (don't mention Fennick). If a lantern was sold, print which sale it was. If not, print `No lanterns sold. Fennick wins this round.`",
        "One answer per line, in that order.",
      ],
      starter: r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]   # Sable's test sales, in order

# Buttons, the first teapot, the rug, the lantern.
`,
      tests: PRE + r`S0 = 'sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]'
from1 = "That's where it sits counting from 0. Sable numbers sales from 1."
def tally(s):
    t = s.index("teapot")
    g = s.index("rug")
    want = [
        (s.count("button"), "how many buttons were sold", [(0, "That's 0. Is the item spelled exactly as it is in the list?")]),
        (t + 1, "the sale number of the first teapot", [(t, from1)]),
        (g + 1, "the sale number of the rug", [(g, from1)]),
    ]
    if "lantern" in s:
        n = s.index("lantern")
        want.append((n + 1, "the sale number of the lantern", [(n, from1), ("Fennick wins", "A lantern was sold this time, so say which sale it was.")]))
    else:
        want.append(("No lanterns sold. Fennick wins this round.", "the no-lantern line"))
    return want
says(lines, tally(["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]))
vns, got = again((S0, 'sales = ["teapot", "button", "lantern", "rug", "button", "teapot"]'))
says(got, tally(["teapot", "button", "lantern", "rug", "button", "teapot"]), "a lantern was sold")
vns, got = again((S0, 'sales = ["rug", "ribbon", "ribbon", "button", "teapot", "ribbon"]'))
says(got, tally(["rug", "ribbon", "ribbon", "button", "teapot", "ribbon"]), "the sales are different ones")`,
      hints: [
        "Two kinds of question here: \"how many?\" and \"where?\". For the where-questions, remember Python counts from 0 and Sable counts from 1. And the lantern might not be there at all, so ask before you look.",
        "`birds.count(\"owl\")` counts the owls. `birds.index(\"jay\")` is the position of the first jay, counting from 0, the way Python counts. `if \"wren\" in birds:` keeps `index` from crashing.",
        "Line 2 is the teapot's `index`, moved from Python's counting to Sable's (what do you add?), and line 3 the same for the rug. Line 4 is an if/else: the if asks whether \"lantern\" is in the list at all, and only then uses index.",
      ],
      solution: r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("button"))
print("First teapot: sale", sales.index("teapot") + 1)
print("The rug: sale", sales.index("rug") + 1)
if "lantern" in sales:
    print("Lantern: sale", sales.index("lantern") + 1)
else:
    print("No lanterns sold. Fennick wins this round.")`,
      wrong: [r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("button"))
print("First teapot: sale", sales.index("teapot"))
print("The rug: sale", sales.index("rug"))
if "lantern" in sales:
    print("Lantern: sale", sales.index("lantern"))
else:
    print("No lanterns sold. Fennick wins this round.")`, r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("button"))
print("First teapot: sale", sales.index("teapot") + 1)
print("The rug: sale", sales.index("rug") + 1)
print("Lantern: sale", sales.index("lantern") + 1)`, r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold: 4")
print("First teapot: sale", sales.index("teapot") + 1)
print("The rug: sale", sales.index("rug") + 1)
if "lantern" in sales:
    print("Lantern: sale", sales.index("lantern") + 1)
else:
    print("No lanterns sold. Fennick wins this round.")`, r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("buttons"))
print("First teapot: sale", sales.index("teapot") + 1)
print("The rug: sale", sales.index("rug") + 1)
if "lantern" in sales:
    print("Lantern: sale", sales.index("lantern") + 1)
else:
    print("No lanterns sold. Fennick wins this round.")`, r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("button"))
print("First teapot: sale", sales.index("teapot") + 1)
print("The rug: sale", sales.index("rug") + 1)
if "lantern" in sales:
    print("Lantern: sale", sales.index("lantern"))
else:
    print("No lanterns sold. Fennick wins this round.")`, r`sales = ["ribbon", "button", "teapot", "button", "ribbon", "button", "rug", "button", "ribbon", "teapot"]
print("Buttons sold:", sales.count("button"))
print("First teapot: sale 3")
print("The rug: sale 7")
print("No lanterns sold. Fennick wins this round.")`],
      done: "Sable: Four buttons! FOUR! And a teapot as the third sale of the day, very respectable for a teapot. No lanterns. Fennick would laugh. Fennick isn't here. Good. ...Good.",
    },
    {
      id: "mk11-well-fund",
      part: "Notice post",
      title: "The Well Fund",
      topic: "walking a list with while",
      cost: { wood: 4, stone: 2 },
      intro: [
        "By the entrance goes the notice post: market days, a lost goat, and a drawing of Pip that Wren made. Pip has asked for it to be pinned higher, where everyone can see it.",
        "Sable: And a jar for the well fund: a new rope and a bucket chain. Folk drop coins in every market day, and I chalk the total on the notice so they can watch it grow.",
        "To visit every item in turn, **walk** the list with an index: start at 0, look at the item at that index, move the index on by one, and stop when it reaches `len()`. It's the dock's `while`, pointed at a list.",
      ],
      codex: ["lists-while", "list-index"],
      quiz: {
        code: r`beads = ["red", "blue"]
i = 0
while i <= len(beads):
    print(beads[i])
    i += 1`,
        question: "This prints red and blue. What happens next?",
        options: ["IndexError", "red\nblue", "red", "blue"],
        answer: 0,
        why: "len(beads) is 2, and <= lets i reach 2 as well. There's no index 2 in a two-item list, so the walk goes one step too far and stops with an IndexError. i < len(beads) stops in time.",
      },
      task: [
        "Walk through the gifts one market day at a time. For each day, print a line with the day's number (the first market day is day 1) and how many coins the jar holds **so far**.",
        "Keep an eye out for the first day the jar holds at least `target` coins. After the walk, print one last line naming that day. If the jar never gets there, the last line says so, with the word `never` in it.",
        "It has to work for any list of gifts, of any length. Print nothing else: one line per day, then the last line.",
      ],
      starter: r`gifts = [4, 7, 0, 9, 3, 6]   # coins dropped in the well-fund jar on each market day
target = 20                   # coins for a new rope and bucket chain

# 1. One line per market day
# 2. The day the jar first held enough (or never)
`,
      tests: PRE + r`def fund(got, gifts, target, when=""):
    pre = "When " + when + ", " if when else ""
    nl = chr(10) + "  "
    n = len(gifts)
    check(len(got) == n + 1, pre + "the rune expects " + str(n + 1) + " lines: one for each of the " + str(n) + " market days, then one at the end. Your program printed " + str(len(got)) + ".")
    total = 0
    first = 0
    k = 0
    while k < n:
        total += gifts[k]
        if first == 0 and total >= target:
            first = k + 1
        line = got[k]
        check(shows(line, k + 1), pre + "line " + str(k + 1) + " should name market day " + str(k + 1) + " (the first day is day 1), but it says:" + nl + line)
        hint = chr(10) + "That looks like just that day's gift. The jar holds everything so far." if shows(line, gifts[k]) and gifts[k] != total else ""
        check(shows(line, total), pre + "line " + str(k + 1) + " should show what the jar holds so far (" + str(total) + "), but it says:" + nl + line + hint)
        k += 1
    last = got[n]
    if first:
        check("never" not in last.lower(), pre + "the jar does reach " + str(target) + ", but your last line says never:" + nl + last)
        check(shows(last, first), pre + "the jar first holds " + str(target) + " or more on day " + str(first) + ", but your last line says:" + nl + last)
    else:
        check("never" in last.lower(), pre + "the jar never reaches " + str(target) + ", so the last line should say so, with the word never in it. It says:" + nl + last)
G = "gifts = [4, 7, 0, 9, 3, 6]"
fund(lines, [4, 7, 0, 9, 3, 6], 20)
vns, got = again((G, "gifts = [10, 2, 1]"))
fund(got, [10, 2, 1], 20, "gifts = [10, 2, 1]")
vns, got = again((G, "gifts = [5, 20, 3]"))
fund(got, [5, 20, 3], 20, "gifts = [5, 20, 3]")
vns, got = again((G, "gifts = [25]"))
fund(got, [25], 20, "gifts = [25]")
vns, got = again(("target = 20", "target = 11"))
fund(got, [4, 7, 0, 9, 3, 6], 11, "target = 11")
vns, got = again((G, "gifts = []"))
fund(got, [], 20, "gifts = [] (no market days yet)")`,
      hints: [
        "Two things change as you walk: where you are in the list, and the jar's total. Keep a variable for each. A third can remember the day the target was first reached. What should it hold before that has happened, so you can tell afterwards?",
        "`i = 0`, `while i < len(cups):`, then inside `total += cups[i]` and `i += 1` adds a list up one item at a time. Print inside the loop and you see the total grow; print after it and you see only the end.",
        "Start `reached = 0` before the loop. Inside: add `gifts[i]` to the total and print the day (`i + 1`) with it; then `if reached == 0 and ...:` remember the day, so only the first day ever gets stored. After the loop, an if/else on `reached`.",
      ],
      solution: r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {total} coins in the jar")
    if reached == 0 and total >= target:
        reached = i + 1
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`,
      wrong: [r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i <= len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {total} coins in the jar")
    if reached == 0 and total >= target:
        reached = i + 1
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {total} coins in the jar")
    if total >= target:
        reached = i + 1
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {total} coins in the jar")
    if reached == 0 and total > target:
        reached = i + 1
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i}: {total} coins in the jar")
    if reached == 0 and total >= target:
        reached = i
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {gifts[i]} coins in the jar")
    if reached == 0 and total >= target:
        reached = i + 1
    i += 1
if reached:
    print(f"The jar reached {target} on day {reached}.")
else:
    print(f"The jar never reached {target}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
total = 0
reached = 0
i = 0
while i < len(gifts):
    total += gifts[i]
    print(f"Day {i + 1}: {total} coins in the jar")
    if reached == 0 and total >= target:
        reached = i + 1
print(f"The jar reached {target} on day {reached}.")`, r`gifts = [4, 7, 0, 9, 3, 6]
target = 20
i = 0
while i < len(gifts):
    print(f"Day {i + 1}: {sum(gifts)} coins in the jar")
    i += 1
print("The jar reached 20 on day 4.")`],
      done: "Sable: Twenty coins by the fourth market day! A new rope by summer, and I've chalked it up big enough to read from the tavern. Pip says the drawing of Pip is wonky. The drawing of Pip is perfect.",
    },
    {
      id: "mk12-bunting",
      part: "Bunting",
      title: "Up or Mended",
      topic: "choosing items into a new list",
      cost: { wood: 5, stone: 0 },
      intro: [
        "Sable: Bunting! Four tall poles and five strings of pennants. You can't open a market without bunting, partner. It's the law. It isn't the law. It should be.",
        "Sable: The crate's a muddle, mind. Some pennants are torn. Torn ones go in the mending basket; everything else goes up.",
        "Pip can't sew. Pip has no hands. Pip will *supervise* the mending. Every pennant goes one place or the other, and the crate itself stays as it is.",
      ],
      codex: ["lists-while", "string-methods"],
      quiz: {
        code: r`sizes = [3, 8, 5, 1]
big = []
i = 0
while i < len(sizes):
    if sizes[i] > 4:
        big.append(sizes[i])
    i += 1
print(big)`,
        question: "What does this program show?",
        options: ["[8, 5]", "[3, 1]", "[8]", "8\n5"],
        answer: 0,
        why: "The walk visits every size. Only 8 and 5 are more than 4, so only they are appended to big, in the order they were met.",
      },
      task: [
        "Go through the crate pennant by pennant. A torn one (it has `torn` at the front of its label) goes in the mending basket; every other one goes up on the bunting. Build both as new lists, in the order the pennants come out of the crate.",
        "Print the bunting list, then the mending basket, then how many pennants went up.",
        "Leave the crate itself as it is.",
      ],
      starter: r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]

# 1. Two new lists, filled pennant by pennant
# 2. Print them, and how many went up
`,
      tests: PRE + r`K = 'crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]'
K0 = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
check(ns.get("crate") == K0, "The crate has changed! Leave it as it is and build new lists instead. (Taking things out of a list while you walk it shifts everything along, and the walk skips pennants.)")
def bunting(k):
    up = [p for p in k if not p.startswith("torn")]
    mend = [p for p in k if p.startswith("torn")]
    return [
        (up, "the pennants that go up", [(k, "That's the whole crate. Only the pennants that aren't torn go up.")]),
        (mend, "the mending basket"),
        (len(up), "how many pennants went up", [(len(k), "That's every pennant in the crate. Count the ones that went up.")]),
    ]
says(lines, bunting(K0))
vns, got = again((K, 'crate = ["torn green", "blue", "blue", "torn white", "red"]'))
says(got, bunting(["torn green", "blue", "blue", "torn white", "red"]), "the crate holds different pennants")
vns, got = again((K, 'crate = ["torn red", "torn gold"]'))
says(got, bunting(["torn red", "torn gold"]), "every pennant in the crate is torn")`,
      hints: [
        "Before the walk, two empty lists are waiting. During the walk, each pennant goes into exactly one of them. Which question decides which, and which string method from the mill answers it?",
        "`if word.startswith(\"un\"):` asks about the front of a string. `keep.append(apples[i])` adds the item you're looking at to another list, and `else:` catches everything that didn't pass.",
        "Two empty lists before the walk. Inside the walk, one if/else asks about the front of `crate[i]` and appends it to one list or the other; the step to the next pennant comes after the if/else, at the loop's own indent. Then the three prints.",
      ],
      solution: r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
up = []
mending = []
i = 0
while i < len(crate):
    if crate[i].startswith("torn"):
        mending.append(crate[i])
    else:
        up.append(crate[i])
    i += 1
print(up)
print(mending)
print(len(up), "pennants went up")`,
      wrong: [r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
mending = []
i = 0
while i < len(crate):
    if crate[i].startswith("torn"):
        mending.append(crate[i])
        crate.remove(crate[i])
    i += 1
print(crate)
print(mending)
print(len(crate), "pennants went up")`, r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
up = []
mending = []
i = 0
while i <= len(crate):
    if crate[i].startswith("torn"):
        mending.append(crate[i])
    else:
        up.append(crate[i])
    i += 1
print(up)
print(mending)
print(len(up), "pennants went up")`, r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
up = []
mending = []
i = 0
while i < len(crate):
    if crate[i].startswith("torn"):
        mending.append(crate[i])
    up.append(crate[i])
    i += 1
print(up)
print(mending)
print(len(up), "pennants went up")`, r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
up = []
mending = []
i = 0
while i < len(crate):
    if crate[i].startswith("torn"):
        mending.append(crate[i])
    else:
        up.append(crate[i])
    i += 1
print(up)
print(mending)
print(len(crate), "pennants went up")`, r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
up = []
mending = []
i = 0
while i < len(crate):
    if crate[i] == "torn":
        mending.append(crate[i])
    else:
        up.append(crate[i])
    i += 1
print(up)
print(mending)
print(len(up), "pennants went up")`, r`crate = ["red", "torn gold", "blue", "green", "torn red", "white", "gold", "torn blue", "green"]
print(["red", "blue", "green", "white", "gold", "green"])
print(["torn gold", "torn red", "torn blue"])
print(6, "pennants went up")`],
      done: "Sable: Six pennants a-flutter and three in the mending basket. Pip is supervising the mending very loudly. Pip, the basket can't hear you. ...Pip says the basket can hear.",
    },
    {
      id: "mk13-price-tags",
      part: "Benches, barrels and carts",
      title: "The Price List",
      topic: "lists in step",
      cost: { wood: 5, stone: 3 },
      intro: [
        "Benches by the well, a handcart of sacks, barrels and crates between the stalls. The square looks lived in. All it needs now is prices.",
        "Sable: My price list is three lists, partner: goods in one, prices in another, stock in the third, and the same position means the same thing in all of them. Fennick used to write their prices on their hand. Not that I remember.",
        "Sable: Traders on the east road say a Company carriage has been asking about this valley. Probably nothing. Rumours with the ink still wet. Prices, partner!",
        "Lists **in step**: find where something is in one list, then look at the same position in another. And to walk them together, one index does for all of them.",
      ],
      codex: ["parallel-lists", "list-search", "lists-while"],
      quiz: {
        code: r`fruit = ["fig", "plum", "pear"]
cost = [5, 2, 3]
print(fruit[cost.index(2)])`,
        question: "What does this program show?",
        options: ["plum", "pear", "2", "1"],
        answer: 0,
        why: "cost.index(2) is 1 (the 2 sits at index 1), so this prints fruit[1], the fruit at the same position: plum.",
      },
      task: [
        "A customer asks for whatever `asked` names. If Sable sells it, print its price (even if it's sold out right now; Sable takes orders). If not, print `Sable: Never heard of it. Try Fennick. Actually, don't.`",
        "What is everything in stock worth? Each good's price times how many are left, all added up. Print the total.",
        "Print the name of the most expensive good.",
        "One answer per line, in that order. It has to work with any price list, not just today's.",
      ],
      starter: r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]       # coins each, in the same order as goods
stock = [40, 12, 0, 2, 1, 25]      # how many of each are left, same order again
asked = "rug"                      # what the customer at the counter wants

# 1. Answer the customer
# 2. What everything in stock is worth
# 3. The priciest good
`,
      tests: PRE + r`def tags(goods, prices, stock, asked):
    if asked in goods:
        i = goods.index(asked)
        first = (prices[i], "the price of " + asked, [(i, "That's where " + asked + " sits in goods, not its price. Look at the same position in prices.")])
    else:
        first = ("Sable: Never heard of it. Try Fennick. Actually, don't.", "Sable's answer when the good isn't sold here")
    worth = 0
    k = 0
    while k < len(goods):
        worth += prices[k] * stock[k]
        k += 1
    top = goods[prices.index(max(prices))]
    return [
        first,
        (worth, "what everything in stock is worth", [(sum(prices) * sum(stock), "That multiplies the two totals together. Each good's price goes with its own stock, at the same position."), (sum(prices), "That's just the prices added up. Multiply each by how many are left.")]),
        (top, "the name of the most expensive good", [(max(prices), "That's the highest price. Sable wants the name of the good that costs it.")]),
    ]
G = 'goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]'
P = "prices = [2, 3, 4, 15, 9, 1]"
S = "stock = [40, 12, 0, 2, 1, 25]"
A = 'asked = "rug"'
says(lines, tags(["apples", "flour", "fish", "rug", "teapot", "ribbon"], [2, 3, 4, 15, 9, 1], [40, 12, 0, 2, 1, 25], "rug"))
vns, got = again((A, 'asked = "fish"'))
says(got, tags(["apples", "flour", "fish", "rug", "teapot", "ribbon"], [2, 3, 4, 15, 9, 1], [40, 12, 0, 2, 1, 25], "fish"), 'asked = "fish"')
vns, got = again((A, 'asked = "lanterns"'))
says(got, tags(["apples", "flour", "fish", "rug", "teapot", "ribbon"], [2, 3, 4, 15, 9, 1], [40, 12, 0, 2, 1, 25], "lanterns"), 'asked = "lanterns"')
vns, got = again((G, 'goods = ["salt", "silk", "cheese"]'), (P, "prices = [1, 20, 6]"), (S, "stock = [10, 2, 0]"), (A, 'asked = "cheese"'))
says(got, tags(["salt", "silk", "cheese"], [1, 20, 6], [10, 2, 0], "cheese"), "the price list is salt, silk and cheese")`,
      hints: [
        "Every question here is \"find the position in one list, then look at the same position in another\". Where is the customer's good? Where is the highest price? And for the stock's worth, you need every position in turn.",
        "`i = names.index(\"Cy\")` then `ages[i]` gives Cy's age. To walk two lists at once, use one `while i < len(names):` and `names[i]` with `ages[i]` inside it. `max(ages)` is the biggest age, and `ages.index(...)` says where it is.",
        "Line 1: `if asked in goods:` then the price at `goods.index(asked)`. Line 2: walk every `i`, adding `prices[i] * stock[i]` to a total. Line 3: find where the top price sits, then use that same position somewhere else.",
      ],
      solution: r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {prices[goods.index(asked)]} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
worth = 0
i = 0
while i < len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print(f"Priciest: {goods[prices.index(max(prices))]}")`,
      wrong: [r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
print(f"{asked}: {prices[goods.index(asked)]} coins each")
worth = 0
i = 0
while i < len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print(f"Priciest: {goods[prices.index(max(prices))]}")`, r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {goods.index(asked)} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
worth = 0
i = 0
while i < len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print(f"Priciest: {goods[prices.index(max(prices))]}")`, r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {prices[goods.index(asked)]} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
print(f"Stock worth: {sum(prices) * sum(stock)} coins")
print(f"Priciest: {goods[prices.index(max(prices))]}")`, r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {prices[goods.index(asked)]} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
worth = 0
i = 0
while i < len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print(f"Priciest: {max(prices)}")`, r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {prices[goods.index(asked)]} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
worth = 0
i = 0
while i < len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print("Priciest: rug")`, r`goods = ["apples", "flour", "fish", "rug", "teapot", "ribbon"]
prices = [2, 3, 4, 15, 9, 1]
stock = [40, 12, 0, 2, 1, 25]
asked = "rug"
if asked in goods:
    print(f"{asked}: {prices[goods.index(asked)]} coins each")
else:
    print("Sable: Never heard of it. Try Fennick. Actually, don't.")
worth = 0
i = 0
while i <= len(goods):
    worth += prices[i] * stock[i]
    i += 1
print(f"Stock worth: {worth} coins")
print(f"Priciest: {goods[prices.index(max(prices))]}")`],
      done: "Sable: A hundred and eighty coins of stock, and the rug's the priciest thing in the square, as it should be. It's a very good rug. I'll be sad when it sells. I'll be sadder if it doesn't.",
    },
    {
      id: "mk14-market-day",
      part: "Lanterns and opening day",
      title: "Market Day",
      topic: "putting lists together",
      cost: { wood: 6, stone: 3 },
      intro: [
        "Lanterns on every stall, flowers at the entrance, and tomorrow is opening day! Sable wants a rehearsal first: a whole market day, run by the rune stone, customer by customer.",
        "Sable: Rule one: serve everyone in the order they come. Rule two: never sell what you haven't got. Rule three: restock whatever's running low, and tell me which, alphabetically, because I like things alphabetical when I'm nervous. I'm not nervous.",
        "This uses everything from the square, and you choose which tools fit where. Plan it on paper first, then build it one part at a time.",
      ],
      codex: ["parallel-lists", "lists-while", "list-maths", "sorting"],
      quiz: {
        code: r`stock = [2, 0, 5]
served = 0
i = 0
while i < len(stock):
    if stock[i] == 0:
        i += 1
        continue
    served += 1
    i += 1
print(served)`,
        question: "What does this program show?",
        options: ["2", "3", "1", "(nothing)"],
        answer: 0,
        why: "continue skips the rest of the round for the empty stall, so only the two stalls with stock are counted. Notice the i += 1 before continue: without it, the walk would be stuck on that stall forever.",
      },
      task: [
        "Serve the customers in the order they arrive; each wants one of something. If Sable doesn't sell it, or it's sold out, the customer goes home empty-handed (count them). Otherwise one comes out of that good's stock, and it counts as one sale of that good.",
        "Keep track of how many of each good were sold.",
        "After the last customer, restock every good that has fewer than `low` left by adding `refill` to it, and note which goods you restocked.",
        "Then the report, one line each, in this order: how many were sold altogether; how many customers went home empty-handed; the best-selling good; the restocked goods in A-to-Z order (as a list); the stock after restocking (as a list). Print only those five lines, nothing during the day.",
      ],
      starter: r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]    # how many of each, in the same order as goods
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2                    # a good with fewer than this left gets restocked
refill = 5                 # how many Sable brings out for each restock

# Plan it on paper first: what do you need to keep track of during the day?
`,
      tests: PRE + r`def market(goods, stock, customers, low, refill):
    stock = stock[:]
    sold = [0] * len(goods)
    away = 0
    for want in customers:
        if want not in goods or stock[goods.index(want)] == 0:
            away += 1
            continue
        i = goods.index(want)
        stock[i] -= 1
        sold[i] += 1
    before = stock[:]
    again_ = []
    for i in range(len(goods)):
        if stock[i] < low:
            stock[i] += refill
            again_.append(goods[i])
    best = goods[sold.index(max(sold))]
    return [
        (sum(sold), "how many were sold altogether"),
        (away, "how many customers went home empty-handed"),
        (best, "the best-selling good", [(max(sold), "That's how many the best seller sold. Sable wants its name.")]),
        (sorted(again_), "the restocked goods, A to Z", [(again_, "Those are in the order you restocked them. Sable wants them A to Z.")]),
        (stock, "the stock after restocking", [(before, "That's the stock before restocking.")]),
    ]
G = 'goods = ["pots", "bread", "apples", "fish", "ribbon"]'
S = "stock = [2, 5, 6, 3, 4]"
C = 'customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]'
goods0 = ["pots", "bread", "apples", "fish", "ribbon"]
cust0 = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
says(lines, market(goods0, [2, 5, 6, 3, 4], cust0, 2, 5))
vns, got = again((C, 'customers = ["apples", "apples", "ribbon", "cheese", "apples", "fish"]'))
says(got, market(goods0, [2, 5, 6, 3, 4], ["apples", "apples", "ribbon", "cheese", "apples", "fish"], 2, 5), "the customers are different ones (and nothing ends the day with fewer than 2)")
vns, got = again(("low = 2", "low = 3"), ("refill = 5", "refill = 4"))
says(got, market(goods0, [2, 5, 6, 3, 4], cust0, 3, 4), "low = 3 and refill = 4")
vns, got = again((S, "stock = [9, 1, 6, 2, 4]"))
says(got, market(goods0, [9, 1, 6, 2, 4], cust0, 2, 5), "stock = [9, 1, 6, 2, 4]")`,
      hints: [
        "Work it out on paper first: what must you remember during the day? (The stock you have, how many of each good were sold, how many customers went home empty-handed.) Then it's one walk over the customers, one walk over the goods to restock, and five prints.",
        "A counting list in step with another: `votes = [0] * len(names)` then `votes[i] += 1` counts one for `names[i]`. Inside a walk, `continue` skips the rest of the round, which suits a customer you can't serve (move your index on first!).",
        "For each customer, in this order: is the good sold here at all? (If not, count them and `continue`.) Where is it in `goods`? Is any left at that position? (If not, count them and continue.) Only then take one from its stock and add one to its sales. The restock is a second walk, over the goods this time.",
      ],
      solution: r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] += refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`,
      wrong: [r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] += refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] += refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] += refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {restocked}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] <= low:
        stock[j] += refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] = refill
        restocked.append(goods[j])
    j += 1
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {max(sold)}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
sold = [0] * len(goods)
away = 0
c = 0
while c < len(customers):
    want = customers[c]
    c += 1
    if want not in goods:
        away += 1
        continue
    i = goods.index(want)
    if stock[i] == 0:
        away += 1
        continue
    stock[i] -= 1
    sold[i] += 1
restocked = []
j = 0
while j < len(goods):
    if stock[j] < low:
        stock[j] = refill
        restocked.append(goods[j])
    j += 1
best = goods[sold.index(max(sold))]
print(f"Sold today: {sum(sold)}")
print(f"Went home empty-handed: {away}")
print(f"Best seller: {best}")
print(f"Restocked: {sorted(restocked)}")
print(f"Stock now: {stock}")`, r`goods = ["pots", "bread", "apples", "fish", "ribbon"]
stock = [2, 5, 6, 3, 4]
customers = ["bread", "fish", "apples", "honey", "bread", "pots", "fish", "fish", "fish", "bread", "pots", "pots", "silk", "bread"]
low = 2
refill = 5
print("Sold today: 10")
print("Went home empty-handed: 4")
print("Best seller: bread")
print("Restocked: ['bread', 'fish', 'pots']")
print("Stock now: [5, 6, 5, 5, 4]")`],
      done: "Sable: Ten sold, four sent home sad, and bread the champion of the day. I'd have bet on the teapot. Never bet on the teapot, partner. That's rule four. I just made it up. Now light the lanterns!",
    },
  ],
};
