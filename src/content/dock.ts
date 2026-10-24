import type { Building } from "./types.ts";

// Fisher's Dock: building 3, taught with while loops, counters, break / continue
// and import random (SYLLABUS.md). Each challenge adds one stage of dock.glb
// (art/specs/dock.md, stage_01 … stage_12). Marlo the fisher arrives when the
// chapter opens and speaks lines that start with "Marlo: ".
const r = String.raw;

// Shared check helpers, put in front of every challenge's checks.
//   variant([("corks = 5", "corks = 3")])          -> (variables, printed lines)
//   variant([], seed=4)                            -> run with the dice seeded
//   expect_when([("corks = 5", "corks = 3")], [lines...], "extra advice", seed=None)
//   once("The pile is set", "\"set\"")             -> that line printed at most once
// A seeded variant puts random.seed(n) in front of the program and turns the
// program's own seed calls into no-ops, so the checks know exactly which rolls
// come out. A variant that loops forever or crashes gives friendly feedback
// instead of tripping the checker.
const PRE = r`import random as _dock_random

def _dock_when(swaps, seed):
    parts = [new for old, new in swaps]
    if seed is not None:
        parts.append("the dice fall another way (seed " + str(seed) + ")")
    return " and ".join(parts)

def variant(swaps, seed=None):
    v = src
    for old, new in swaps:
        check(old in v, "Keep the line " + old + " exactly as it was in the starter, so the rune can try your program with other values.")
        v = v.replace(old, new, 1)
    if seed is not None:
        v = "import random" + chr(10) + "random.seed(" + str(seed) + ")" + chr(10) + "_dock_skip = lambda *a, **k: None" + chr(10) + v.replace("random.seed(", "_dock_skip(")
    try:
        return rerun(v)
    except Exception as e:
        when = _dock_when(swaps, seed)
        if type(e).__name__ == "LoopLimit":
            check(False, "When " + when + ", your loop never stops. Look at what its condition needs: does it ever change the right way?")
        check(False, "When " + when + ", your program crashes with " + type(e).__name__ + ": " + str(e) + ". Work from the variables so it fits any starting value, not just today's.")

def expect_when(swaps, want, advice="", seed=None):
    vns, got = variant(swaps, seed)
    nl = chr(10) + "  "
    msg = "If " + _dock_when(swaps, seed) + ", the rune expects:" + nl + nl.join(want) + chr(10) + "but your program printed:" + nl + (nl.join(got) if got else "(nothing)")
    if advice:
        msg = msg + chr(10) + advice
    check(got == want, msg)
    return vns

def once(start, what):
    n = len([l for l in lines if l.startswith(start)])
    check(n <= 1, "The " + what + " line prints " + str(n) + " times. It belongs after the loop, not inside it: check its indentation.")

`;

export const DOCK: Building = {
  id: "dock",
  name: "Fisher's Dock",
  blurb: "A pier over the pond, nets in the sun, and an old bell waiting under the water.",
  villager: { name: "Marlo", model: "fisher", arrives: "start" },
  opening: [
    "Wren: Founder! There's an old man sitting on our shore. He's been there since dawn and he hasn't moved once. I think he's fishing. Or asleep. Possibly both.",
    "Marlo: ...Both, some days. Morning. Marlo. Heard there was a pond over the ridge with nobody fishing it. Seemed a shame.",
    "Marlo: Pushed my boat here on a handcart. She complained the whole way. Boats do.",
    "Marlo: My gran used to tell me about a valley like this one. Willows on the water. A bell under a lake that rang on its own. ...Daft story. I still listen, mind.",
    "A bell? Under the... no. No, that's just a story. Probably. Pip has heard lots of stories. Pip is perfectly fine.",
    "Marlo: I'd like a dock. A hut, a pier, somewhere to tie the boat. Fishing's mostly doing the same thing again and again, until something changes.",
    "Then the rune stone needs a new word: **while**. Do it again, and again, *while* something is still true. Let's build Fisher's Dock!",
  ],
  finale: [
    "Marlo: ...Go on. You ring it. You found the words for it.",
    "*DONNNG.* Oh! Oh, feel that! It went right through the rune stone. Right through Pip's scales! Pip is glowing. Is Pip glowing? Pip is definitely glowing.",
    "Marlo: Gran said it rang for anyone learning something new. ...I thought that was a story for children.",
    "Bram: I heard that from the kitchen! Dropped a whole ladle of stew. Worth it.",
    "Wren: I heard it from the top of the mill! Is it going to do that every time?",
    "It is! From now on, every time a rune comes right, Willowmere's old bell will ring. Home again, after all this time.",
    "Marlo: ...Here. A spare rod. It was Gran's. Casts a bit to the left. So did she. The fish in this pond have had it easy for a long while. Let's see how they like company.",
  ],
  chatDuring: [
    "Marlo: Heron's back on his rock. Same rock, same time, every morning. You could set a loop by him.",
    "Marlo: Pip asked me if a loop gets tired. Told Pip only if you never let it stop. ...Same as people.",
    "Marlo: Gran knotted me messages in fishing line when I was small. One knot, two knots, a bit of plain cord. I was hopeless at reading them. Still am, probably.",
    "Marlo: Don't hurry the water. It's been here longer than both of us.",
  ],
  chatAfter: [
    "Marlo: Bell rang four times this morning. You must've been busy. ...The heron's stopped flinching. He's used to you now.",
    "Marlo: Gran's cord said *ring it*. So I ring it, every morning, once. Just to let the valley know we're still here.",
    "Marlo: Two lanterns on the pier head, two more in the water underneath. Four lanterns for the price of two. Gran would've liked that sum.",
    "Marlo: Pip sits by the bell some evenings, very still, like listening for something far off. I don't ask. Folk are allowed their quiet.",
  ],
  chronicle: {
    title: "The Bell",
    text: [
      "We cast the bell in our fifth summer, from every scrap of bronze the valley owned: two cook pots, a cracked plough-blade, and the buckle off my best belt, which I have still not forgiven anyone for.",
      "We hung it at the end of the fishing pier. The first time a child spoke a rune right and the stone answered, the bell rang by itself. Nobody had touched it. The child was so startled she fell into the pond, came up laughing, and spoke three more runes before supper just to hear it again.",
      "After that it rang for every new speaker, every first rune, every stubborn mistake finally mended. Some days it rang so often the fishers complained it frightened the fish. I told them a noisy bell is a good problem to have. A silent bell would be a bad one.",
      "If you are reading this, and the bell is ringing again, then someone is learning. *Keep it ringing.*",
    ],
  },
  challenges: [
    {
      id: "d01-float-line",
      part: "Stakes and float line",
      title: "Cork by Cork",
      topic: "while loops",
      cost: { wood: 2, stone: 0 },
      intro: [
        "Marlo: ...Morning. Pip says you build with words. I tie corks on a line. Same thing, slower.",
        "Marlo: The float line runs from the shore stake out to the red buoy, where the pier will end. One cork, then the next, then the next. Until there aren't any more.",
        "Ssso: the same steps, again and again, until something stops being true. In Python that's a **while loop**. *While* its condition is True, Python runs the indented lines, then goes back up and asks again.",
        "To know which cork you're on, keep a **counter**: a variable that remembers the round and climbs by one each time.",
      ],
      codex: ["while"],
      quiz: {
        code: r`bait = 3
while bait > 0:
    print("Cast!")
    bait = bait - 1
print(bait)`,
        question: "What does this program show?",
        options: ["Cast!\nCast!\nCast!\n0", "Cast!\nCast!\nCast!", "Cast!\nCast!\n0", "Cast!\nCast!\nCast!\n3"],
        answer: 0,
        why: "bait goes 3, 2, 1, and each time bait > 0 is True, so Cast! prints three times. When bait reaches 0 the condition is False, the loop ends, and the last line prints 0.",
      },
      task: [
        "Tie the corks in order, starting from cork 1. For each one, print a line saying `Cork <number> tied.` with that cork's number.",
        "Use a `while` loop, so the program fits any number of `corks`, even none at all.",
        "After the last cork, print `The float line reaches the buoy.` once.",
      ],
      starter: r`corks = 5    # corks to tie along the float line

# While there are still corks to tie:
#     say which cork you're tying
#     and move on to the next one

print("The float line reaches the buoy.")
`,
      tests: PRE + r`check("while" in src, "Tie the corks with a while loop, so it fits however many corks there are.")
def corks_want(n):
    want = []
    c = 1
    while c <= n:
        want.append("Cork " + str(c) + " tied.")
        c += 1
    return want + ["The float line reaches the buoy."]
once("The float line", "buoy")
check("Cork 0 tied." not in lines, "There's a cork 0 on your line. Fishers count from 1.")
check("Cork 6 tied." not in lines, "There are only 5 corks, but you tied a cork 6. The loop runs one round too many.")
check(not ("Cork 4 tied." in lines and "Cork 5 tied." not in lines), "Cork 5 never gets tied: the loop stops one cork early. Should it still have a turn when the counter equals corks?")
expect_lines(corks_want(5))
expect_when([("corks = 5", "corks = 3")], corks_want(3), "With 3 corks there should be 3 cork lines. Compare the counter with corks instead of a number you typed.")
expect_when([("corks = 5", "corks = 1")], corks_want(1))
expect_when([("corks = 5", "corks = 0")], corks_want(0), "With no corks at all, the loop shouldn't run even once: just the buoy line.")`,
      hints: [
        "Think of tying them by hand: you say which cork you're on, then move on to the next. Which number do you start from, and what's the last number that still gets tied?",
        "A counter is a variable made before the loop and changed at the end of each round, like `k = k + 1`. The loop's condition compares it with the last value that should get a turn, and an f-string puts its value in the line: `print(f\"Knock number {k}\")`.",
        "Make `cork = 1` before the loop, then `while cork <= ...:` with two indented lines: the print, and `cork = cork + 1`. The buoy line stays at the left edge.",
      ],
      solution: r`corks = 5
cork = 1
while cork <= corks:
    print(f"Cork {cork} tied.")
    cork = cork + 1
print("The float line reaches the buoy.")`,
      wrong: [r`corks = 5
cork = 1
while cork <= corks:
    print(f"Cork {cork} tied.")
print("The float line reaches the buoy.")`, r`corks = 5
cork = 1
while cork < corks:
    print(f"Cork {cork} tied.")
    cork = cork + 1
print("The float line reaches the buoy.")`, r`corks = 5
cork = 0
while cork < corks:
    print(f"Cork {cork} tied.")
    cork = cork + 1
print("The float line reaches the buoy.")`, r`corks = 5
cork = 1
while cork <= 5:
    print(f"Cork {cork} tied.")
    cork = cork + 1
print("The float line reaches the buoy.")`, r`corks = 5
cork = 1
while cork <= corks:
    print(f"Cork {cork} tied.")
    cork = cork + 1
    print("The float line reaches the buoy.")`, r`corks = 5
print("Cork 1 tied.")
print("Cork 2 tied.")
print("Cork 3 tied.")
print("Cork 4 tied.")
print("Cork 5 tied.")
print("The float line reaches the buoy.")`],
      done: "Marlo: Five corks, bobbing in a row. ...Buoy's red. Gran always said red, so the fish know where the trouble starts.",
    },
    {
      id: "d02-quay",
      part: "Plinth and quay",
      title: "Down to the Water",
      topic: "counting down and in steps",
      cost: { wood: 0, stone: 5 },
      intro: [
        "Marlo: Stone along the waterline for the quay, with steps down into the pond. So I can reach the boat without filling my boots.",
        "Marlo: And a stone plinth for the hut, so the floor stays dry when the pond gets ideas.",
        "A counter doesn't have to climb by one. It can count **down** (`- 1`), or jump in bigger **steps** (`+ 50`).",
        "And watch where it stops! `<` stops *before* the end, `<=` gives the end a turn too. Work out the last round in your head before you run it.",
      ],
      codex: ["loop-counters", "while"],
      quiz: {
        code: r`mark = 0
while mark < 10:
    mark = mark + 4
print(mark)`,
        question: "What does this program show?",
        options: ["12", "8", "10", "4"],
        answer: 0,
        why: "The condition is only checked at the top of each round. 8 < 10 is still True, so 4 more is added and mark ends at 12, past 10.",
      },
      task: [
        "The quay steps, from the top one down to the water: the top step has the biggest number, `steps`, and the last one is step 1. Print `Step <number> laid.` for each, then `Down to the water.`",
        "The plinth: Marlo sets a stone at the very start of the wall (0 cm), then one every `gap` cm along it. A stone may sit right on the far end of the wall, but never past it. Print `Stone at <position> cm` for each stone.",
      ],
      starter: r`steps = 3     # steps from the top of the quay down to the water
wall = 300    # length of the hut wall, in cm
gap = 100     # space between plinth stones, in cm

# 1. The quay steps, counting down
# 2. The plinth stones along the wall
`,
      tests: PRE + r`def quay_want(steps, wall, gap):
    want = []
    s = steps
    while s >= 1:
        want.append("Step " + str(s) + " laid.")
        s -= 1
    want.append("Down to the water.")
    p = 0
    while p <= wall:
        want.append("Stone at " + str(p) + " cm")
        p += gap
    return want
check("Step 0 laid." not in lines, "Step 0 is under the water! Stop once step 1 is laid.")
check(not ("Step 2 laid." in lines and "Step 1 laid." not in lines), "Step 1 is missing: the countdown stops one step early. Should the loop still have a turn when the counter is 1?")
check(not (lines and lines[0] == "Step 1 laid."), "Your steps count up. Start from the top step, the biggest number, and count down to 1.")
once("Down to the water", "water")
check("Stone at 400 cm" not in lines, "A stone at 400 cm sits past the end of a 300 cm wall.")
check(not ("Stone at 200 cm" in lines and "Stone at 300 cm" not in lines), "The far end of the wall needs its stone too: 300 cm is still on a 300 cm wall.")
expect_lines(quay_want(3, 300, 100))
expect_when([("steps = 3", "steps = 5")], quay_want(5, 300, 100), "Count down from steps, not from a number you typed.")
expect_when([("gap = 100", "gap = 50")], quay_want(3, 300, 50), "Step along the wall by gap, not by a number you typed.")
expect_when([("wall = 300", "wall = 250")], quay_want(3, 250, 100), "On a 250 cm wall the last stone sits at 200 cm: one at 300 would be past the end.")
expect_when([("steps = 3", "steps = 1"), ("wall = 300", "wall = 0")], quay_want(1, 0, 100), "Even a wall of 0 cm gets its stone at 0.")`,
      hints: [
        "Two separate loops, one after the other. For each one ask: where does the counter start, which way does it move, and what's the last value that should still get a turn?",
        "Counting down is a counter that shrinks: `n = n - 1`. Counting in steps is a counter that grows by more than one: `n = n + 5`. Whether the end gets its turn depends on `<` or `<=` (or `>` and `>=` when counting down).",
        "Steps: start a counter at `steps` and loop `while ... >= 1:`, taking 1 away each round. Stones: start a second counter at 0 and loop `while ... <= wall:`, adding `gap` each round.",
      ],
      solution: r`steps = 3
wall = 300
gap = 100
step = steps
while step >= 1:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot <= wall:
    print(f"Stone at {spot} cm")
    spot = spot + gap`,
      wrong: [r`steps = 3
wall = 300
gap = 100
step = steps
while step > 1:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot <= wall:
    print(f"Stone at {spot} cm")
    spot = spot + gap`, r`steps = 3
wall = 300
gap = 100
step = steps
while step >= 0:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot <= wall:
    print(f"Stone at {spot} cm")
    spot = spot + gap`, r`steps = 3
wall = 300
gap = 100
step = 1
while step <= steps:
    print(f"Step {step} laid.")
    step = step + 1
print("Down to the water.")
spot = 0
while spot <= wall:
    print(f"Stone at {spot} cm")
    spot = spot + gap`, r`steps = 3
wall = 300
gap = 100
step = steps
while step >= 1:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot < wall:
    print(f"Stone at {spot} cm")
    spot = spot + gap`, r`steps = 3
wall = 300
gap = 100
step = steps
while step >= 1:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot <= wall:
    print(f"Stone at {spot} cm")
    spot = spot + 100`, r`steps = 3
wall = 300
gap = 100
step = steps
while step >= 1:
    print(f"Step {step} laid.")
    step = step - 1
print("Down to the water.")
spot = 0
while spot < wall + gap:
    print(f"Stone at {spot} cm")
    spot = spot + gap`],
      done: "Marlo: Three steps down, and the water's right where I left it. ...Plinth's level too. Good stone, this. Stubborn. I like that in a stone.",
    },
    {
      id: "d03-piles",
      part: "Piles",
      title: "Driving the Piles",
      topic: "adding up to a target",
      cost: { wood: 6, stone: 0 },
      intro: [
        "Marlo: Piles next. Big posts, driven into the pond bed with the maul, until they're deep enough to hold up a pier and an old man.",
        "Marlo: First blow goes in easy. Every blow after that goes in a bit less. The mud fights back.",
        "Ssso how many blows will it take? We can't know until we try! That's what `while` is really for: keep going **until** you reach a target, however many rounds that turns out to be.",
        "Keep a running total that grows each round, and count the rounds as you go.",
      ],
      codex: ["loop-counters", "while"],
      quiz: {
        code: r`saved = 0
weeks = 0
while saved < 10:
    saved = saved + 4
    weeks = weeks + 1
print(weeks, saved)`,
        question: "What does this program show?",
        options: ["3 12", "2 8", "3 10", "4 16"],
        answer: 0,
        why: "saved goes 4, 8, 12. After two weeks 8 < 10 is still True, so a third week runs. Then 12 < 10 is False: 3 weeks, 12 saved.",
      },
      task: [
        "Swing the maul until the pile is at least `target` cm into the pond bed.",
        "The first blow sinks it `first_blow` cm. Every blow after that sinks it `harder` cm less than the blow before it.",
        "After each blow, print which blow it was and how deep the pile is now: `Blow <number>: <depth> cm deep`.",
        "Once it's deep enough, print `The pile is set after <blows> blows.`",
      ],
      starter: r`target = 100      # how deep the pile must go, in cm
first_blow = 30   # cm the first blow sinks it
harder = 4        # each blow sinks it this many cm less than the one before

# Keep swinging until the pile is deep enough.
`,
      tests: PRE + r`def piles_want(target, first, harder):
    want = []
    depth = 0
    sink = first
    blows = 0
    while depth < target:
        depth += sink
        blows += 1
        want.append("Blow " + str(blows) + ": " + str(depth) + " cm deep")
        sink -= harder
    return want + ["The pile is set after " + str(blows) + " blows."]
once("The pile is set", "\"pile is set\"")
check(not lines or not lines[0].startswith("Blow 0"), "Your first blow is blow 0. Count blows from 1: the maul has landed once by the time you print the first line.")
check(not lines or lines[0] != "Blow 1: 26 cm deep", "The first blow only went in 26 cm. The very first blow sinks the full first_blow; the mud only gets harder after it has landed.")
check("Blow 2: 60 cm deep" not in lines, "Every blow sinks the pile the same 30 cm. The mud fights back: each blow should sink it harder cm less than the blow before.")
expect_lines(piles_want(100, 30, 4))
expect_when([("target = 100", "target = 95"), ("first_blow = 30", "first_blow = 40"), ("harder = 4", "harder = 10")], piles_want(95, 40, 10), "Work from target, first_blow and harder, not from today's numbers.")
expect_when([("first_blow = 30", "first_blow = 25"), ("harder = 4", "harder = 0")], piles_want(100, 25, 0))
expect_when([("target = 100", "target = 56")], piles_want(56, 30, 4), "After two blows the pile is exactly 56 cm deep, and that's enough: it only has to be at least target deep.")`,
      hints: [
        "You can't know the number of blows in advance, so let the depth decide when to stop. Two things change with every blow: how deep the pile is, and how hard the next blow will sink it.",
        "A running total grows inside the loop: `total = total + amount`. The amount itself can change each round too: after using it, make it smaller, like `push = push - 2`. Keep looping while the total is still short of the target.",
        "Before the loop: `depth = 0`, `sink = first_blow` and a blow counter at 0. Inside `while depth < target:` four things, in this order: deepen by `sink`, count the blow, print the blow line, then soften (`sink = sink - harder`).",
      ],
      solution: r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth < target:
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
    sink = sink - harder
print(f"The pile is set after {blows} blows.")`,
      wrong: [r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth <= target:
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
    sink = sink - harder
print(f"The pile is set after {blows} blows.")`, r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth < target:
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
print(f"The pile is set after {blows} blows.")`, r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth < target:
    sink = sink - harder
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
print(f"The pile is set after {blows} blows.")`, r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth < target:
    depth = depth + sink
    print(f"Blow {blows}: {depth} cm deep")
    blows = blows + 1
    sink = sink - harder
print(f"The pile is set after {blows} blows.")`, r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while blows < 5:
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
    sink = sink - harder
print(f"The pile is set after {blows} blows.")`, r`target = 100
first_blow = 30
harder = 4
depth = 0
sink = first_blow
blows = 0
while depth < target:
    depth = depth + sink
    blows = blows + 1
    print(f"Blow {blows}: {depth} cm deep")
    sink = sink - harder
    print(f"The pile is set after {blows} blows.")`],
      done: "Marlo: Six rows of piles, solid as a heron's leg. ...Steadier, actually. Herons wobble.",
    },
    {
      id: "d04-deck",
      part: "Deck planks",
      title: "Dry Enough to Nail",
      topic: "choosing the stop condition",
      cost: { wood: 5, stone: 0 },
      intro: [
        "Marlo: Deck planks came off the cart soaked through. Nail a wet plank and it shrinks in the sun and pulls its own nails out. ...Ask me how I know.",
        "Marlo: Lay them out in the sun. Every hour they give up half their water.",
        "A while loop doesn't need a counter in its condition. Any True or False question will do: *while the planks are still too wet*... The tricky part is choosing that question, and which way round it goes.",
      ],
      codex: ["while", "math"],
      quiz: {
        code: r`rumour = 1
days = 0
while rumour < 20:
    rumour = rumour * 2
    days = days + 1
print(days)`,
        question: "What does this program show?",
        options: ["5", "4", "20", "6"],
        answer: 0,
        why: "rumour doubles 1 → 2 → 4 → 8 → 16 → 32. That's 5 days; then 32 < 20 is False and the loop stops.",
      },
      task: [
        "The planks start `wet` percent wet. Each hour in the sun they lose half their water. The stone only measures whole percents, so halving 25 gives 12.",
        "They're ready to nail at `dry` percent wet or drier. Until then, let another hour pass and print `Hour <number>: <water>% wet`.",
        "Then print `Ready to nail after <hours> hours.` Planks that are already dry enough need 0 hours, and no hour lines at all.",
      ],
      starter: r`wet = 80   # how wet the planks are now, in percent
dry = 10   # ready to nail at this, or drier

# Let the hours pass until the planks are dry enough.
`,
      tests: PRE + r`def planks_want(wet, dry):
    want = []
    w = wet
    h = 0
    while w > dry:
        w = w // 2
        h += 1
        want.append("Hour " + str(h) + ": " + str(w) + "% wet")
    return want + ["Ready to nail after " + str(h) + " hours."]
once("Ready to nail", "\"ready to nail\"")
check(".0%" not in out and ".5%" not in out, "Your planks have gone decimal (like 40.0%). The stone measures whole percents: halve with the division that throws the remainder away.")
check(lines != ["Ready to nail after 0 hours."], "80% is far too wet to nail, but your loop never ran. It should keep going while the planks are still too wet.")
check("Hour 4: 5% wet" not in lines, "At 10% the planks were already dry enough, but you waited another hour. Ready means at dry or drier.")
check(not lines or not lines[0].startswith("Hour 0"), "Count the hours from 1: an hour has passed by the time you print it.")
expect_lines(planks_want(80, 10))
expect_when([("wet = 80", "wet = 100")], planks_want(100, 10), "Start from wet, not from a number you typed.")
expect_when([("dry = 10", "dry = 5")], planks_want(80, 5), "Stop at dry, not at a number you typed. When dry is 5, 5% is dry enough.")
expect_when([("wet = 80", "wet = 10")], planks_want(10, 10), "Planks that are already dry enough need 0 hours, and no hour lines at all.")`,
      hints: [
        "Say the rule out loud: keep waiting *while* the planks are still too wet. What is the 'too wet' question, in terms of the water and `dry`? And which division keeps whole numbers?",
        "A loop can wait on any question, like `while soup > 30:`. Inside, change the thing the question is about, here by halving it. `//` divides and drops the remainder: `25 // 2` is 12, where `25 / 2` is 12.5.",
        "Copy `wet` into a variable you can change, start an hour counter at 0, then `while water > ...:` halve the water with `//`, add an hour, and print the hour line. The ready line goes after the loop.",
      ],
      solution: r`wet = 80
dry = 10
water = wet
hours = 0
while water > dry:
    water = water // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`,
      wrong: [r`wet = 80
dry = 10
water = wet
hours = 0
while water > dry:
    water = water / 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`, r`wet = 80
dry = 10
water = wet
hours = 0
while water >= dry:
    water = water // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`, r`wet = 80
dry = 10
water = wet
hours = 0
while water < dry:
    water = water // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`, r`wet = 80
dry = 10
water = wet
hours = 0
while water > dry:
    water = wet // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`, r`wet = 80
dry = 10
water = wet
hours = 0
while hours < 3:
    water = water // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`, r`wet = 80
dry = 10
water = wet
hours = 0
while water > 10:
    water = water // 2
    hours = hours + 1
    print(f"Hour {hours}: {water}% wet")
print(f"Ready to nail after {hours} hours.")`],
      done: "Marlo: Dry as old bread. Nail them before they change their minds. ...There. A pier you can walk on. Mind the end, it's wet. Everything at the end of a pier is wet.",
    },
    {
      id: "d05-frame",
      part: "Hut frame",
      title: "The Loop That Wouldn't Stop",
      topic: "endless loops",
      cost: { wood: 6, stone: 1 },
      intro: [
        "Pip got excited and wrote the program for the hut frame all alone. Pip is very proud of it. It has one small problem: it never, ever finishes.",
        "Marlo: ...Like the heron. Except the heron eventually eats.",
        "A loop stops only when its condition turns False. If nothing inside the loop ever moves the condition towards False, it runs forever: an **endless loop**.",
        "You can't break the stone. If a program is still going after a few seconds, the stone stops it and says *That took too long*. Then read each loop and ask: what has to change for this to end? Does it?",
      ],
      codex: ["endless-loops", "while"],
      quiz: {
        code: r`ropes = 7
while ropes > 0:
    ropes = ropes - 2
print(ropes)`,
        question: "What does this program show?",
        options: ["-1", "0", "1", "It never stops"],
        answer: 0,
        why: "ropes goes 7, 5, 3, 1, -1. It steps right over 0, but -1 > 0 is False, so the loop stops and prints -1. Written as while ropes != 0, it would step over 0 and never stop!",
      },
      task: [
        "Pip's program raises the hut frame, but it never finishes. Run it and see, then fix it. Keep Pip's lines where you can.",
        "It should raise every corner post, one line each, numbered from 1.",
        "Then it nails rafters, 3 nails each, for as long as there are enough nails left for a whole rafter, and says how many rafters were nailed and how many nails are left.",
        "It has to finish for any number of `posts` and `nails`, not just today's.",
      ],
      starter: r`posts = 4    # corner posts for the hut frame
nails = 20   # nails in Marlo's pouch; each rafter takes 3

# Pip's program. It never finishes! Find out why, and fix it.

up = 0
while up < posts:
    print(f"Post {up + 1} raised.")

rafters = 0
while nails != 0:
    nails = nails - 3
    rafters = rafters + 1

print(f"{rafters} rafters nailed, {nails} nails left.")
`,
      tests: PRE + r`def frame_want(posts, nails):
    want = []
    u = 0
    while u < posts:
        want.append("Post " + str(u + 1) + " raised.")
        u += 1
    r = 0
    while nails >= 3:
        nails -= 3
        r += 1
    return want + [str(r) + " rafters nailed, " + str(nails) + " nails left."]
check(", -" not in out, "Marlo can't have fewer than 0 nails! The last rafter was nailed without enough nails for it. Only nail another rafter while there are enough left for a whole one.")
check("Post 0 raised." not in lines, "There's a post 0. Number the posts from 1.")
check("Post 5 raised." not in lines, "There's no post 5 on a hut with 4 posts: your numbers are one too high. Did the counter climb before the line was printed?")
expect_lines(frame_want(4, 20))
expect_when([("nails = 20", "nails = 21")], frame_want(4, 21), "With exactly 3 nails left there's still enough for one more rafter.")
expect_when([("nails = 20", "nails = 3")], frame_want(4, 3), "3 nails is exactly one rafter's worth.")
expect_when([("nails = 20", "nails = 2")], frame_want(4, 2), "2 nails aren't enough for even one rafter.")
expect_when([("posts = 4", "posts = 2")], frame_want(2, 20), "Raise as many posts as posts says, not a number you typed.")`,
      hints: [
        "Run it, and while you wait, read each loop and ask: what must change for its condition to become False? Does anything inside the loop change it? Putting a `print` inside a loop lets you watch its numbers go by.",
        "A loop gets stuck in two ways: the variable in its condition never changes inside the loop, or it changes but jumps over the finish. `while jump != 10:` with `jump = jump + 4` from 1 goes 1, 5, 9, 13... and never lands on 10. `<`, `>`, `<=` and `>=` can't be jumped over.",
        "Loop 1 needs `up = up + 1` inside it (indented). Loop 2 should only nail while a whole rafter's worth is left: `while nails >= ...:`.",
      ],
      solution: r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
    up = up + 1
rafters = 0
while nails >= 3:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`,
      wrong: [r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
    up = up + 1
rafters = 0
while nails != 0:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`, r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
    up = up + 1
rafters = 0
while nails > 0:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`, r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
    up = up + 1
rafters = 0
while nails > 3:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`, r`posts = 4
nails = 20
up = 0
while up < posts:
    up = up + 1
    print(f"Post {up + 1} raised.")
rafters = 0
while nails >= 3:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`, r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
    up = up + 1
rafters = 0
while nails != 2:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`, r`posts = 4
nails = 20
up = 0
while up < posts:
    print(f"Post {up + 1} raised.")
up = up + 1
rafters = 0
while nails >= 3:
    nails = nails - 3
    rafters = rafters + 1
print(f"{rafters} rafters nailed, {nails} nails left.")`],
      done: "Marlo: Posts up, rafters on, and not one nail wasted. ...Pip's gone very quiet. Don't be embarrassed, Pip. I've tied knots that never ended either.",
    },
    {
      id: "d06-walls",
      part: "Walls and windows",
      title: "A Window Now and Then",
      topic: "if inside a loop",
      cost: { wood: 5, stone: 0 },
      intro: [
        "Marlo: Boards up the walls, one after another. And every few boards, Gran's way, a window. So I can watch the water from my chair.",
        "Marlo: Not in the corners, mind. Corners hold the hut up. Windows hold the view up. Different jobs.",
        "A loop can make a decision every round! Put an `if` inside the loop, indented one step further, and it's asked fresh each time round.",
        "And a second counter, changed only inside that `if`, counts just the rounds where the answer was yes.",
      ],
      codex: ["loop-counters", "logic"],
      quiz: {
        code: r`n = 1
while n <= 5:
    if n % 2 == 1:
        print(n)
    n = n + 1`,
        question: "What does this program show?",
        options: ["1\n3\n5", "2\n4", "1\n2\n3\n4\n5", "1\n3"],
        answer: 0,
        why: "The loop visits 1 to 5, but the if only lets the odd numbers through (n % 2 == 1). n = n + 1 is outside the if, so it happens every round.",
      },
      task: [
        "Walk along the wall's `boards`, numbered from 1. Every `every`-th board is cut short for a window: boards 4, 8, 12... when `every` is 4.",
        "But the first and the last board are corner boards, and corner boards always stay whole.",
        "For each window, print `Window at board <number>`. At the end, print `<boards> boards, <windows> windows.`",
      ],
      starter: r`boards = 12   # boards along this wall, numbered from 1
every = 4     # every 4th board gets a window

# Walk along the wall, board by board.
`,
      tests: PRE + r`def walls_want(boards, every):
    want = []
    b = 1
    w = 0
    while b <= boards:
        if b % every == 0 and b != 1 and b != boards:
            want.append("Window at board " + str(b))
            w += 1
        b += 1
    return want + [str(boards) + " boards, " + str(w) + " windows."]
once("12 boards,", "count")
check("12 boards, 12 windows." not in lines, "Your window count counts every board, window or not. Only count a board when it gets a window.")
check("Window at board 12" not in lines, "Board 12 is the last board: a corner. Corners always stay whole.")
expect_lines(walls_want(12, 4))
expect_when([("every = 4", "every = 3")], walls_want(12, 3), "Use every to pick the window boards, not a number you typed.")
expect_when([("boards = 12", "boards = 13")], walls_want(13, 4), "On a 13-board wall, board 12 isn't the corner any more, so it gets its window. The corner is always the last board, whichever that is.")
expect_when([("boards = 12", "boards = 5"), ("every = 4", "every = 1")], walls_want(5, 1), "Board 1 is a corner too, so it stays whole even when every board is a window board.")
expect_when([("boards = 12", "boards = 4")], walls_want(4, 4), "A 4-board wall has no room for a window: board 4 is its corner.")`,
      hints: [
        "Visit the boards one at a time and ask the same question about each: does this one get a window? Two things must be true at once: it's on the window rhythm, and it isn't a corner.",
        "An `if` inside the loop is asked every round. 'Every 4th' is a remainder question: `n % 4 == 0` is True for 4, 8, 12... Join it to the corner question with `and`. A second counter, changed only inside the `if`, counts the yeses.",
        "Inside `while board <= boards:` put `if board % every == 0 and ...:` (the corner rule goes in the gap), with the window print and `windows = windows + 1` under it. Then, outside the `if`, move on to the next board.",
      ],
      solution: r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0 and board != 1 and board != boards:
        print(f"Window at board {board}")
        windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`,
      wrong: [r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0:
        print(f"Window at board {board}")
        windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`, r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % 4 == 0 and board != 1 and board != boards:
        print(f"Window at board {board}")
        windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`, r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0 and board != 1 and board != boards:
        print(f"Window at board {board}")
    windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`, r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0 and board != 1 and board != boards:
        print(f"Window at board {board}")
        windows = windows + 1
        board = board + 1
print(f"{boards} boards, {windows} windows.")`, r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0 and board != boards:
        print(f"Window at board {board}")
        windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`, r`boards = 12
every = 4
board = 1
windows = 0
while board <= boards:
    if board % every == 0 and board != 1 and board != 12:
        print(f"Window at board {board}")
        windows = windows + 1
    board = board + 1
print(f"{boards} boards, {windows} windows.")`],
      done: "Marlo: Walls up, glass in. ...I can see the buoy from here. And the heron. He can see me too. We've agreed not to mention it.",
    },
    {
      id: "d07-thatch",
      part: "Thatch",
      title: "When the Heron Comes",
      topic: "while True and break",
      cost: { wood: 3, stone: 0 },
      intro: [
        "Marlo: Reed thatch, four courses, and the ridge roll on top. But I won't crown the roof until the moment's right.",
        "Marlo: Gran's rule. The heron lands on the water every so many minutes, regular as a clock. The kingfisher too, on its own count. When they both come down in the same minute, that's when you crown a roof. ...Never had one leak.",
        "Ssso we wait, and we don't know how long! Here's a new way to wait: `while True:` would loop forever, and `break` jumps out of the loop the moment you say so. Check for the right moment inside the loop, and break when it comes.",
      ],
      codex: ["break-continue", "while"],
      quiz: {
        code: r`kettle = 20
while True:
    kettle = kettle + 30
    if kettle >= 100:
        break
print(kettle)`,
        question: "What does this program show?",
        options: ["110", "100", "80", "It never stops"],
        answer: 0,
        why: "kettle goes 50, 80, 110. At 110 the if is True and break leaves the loop at once. The loop can't stop at exactly 100, because 100 is never one of its values.",
      },
      task: [
        "Count the minutes from minute 1. The heron lands on every minute that's a multiple of `heron`, and the kingfisher on every multiple of `kingfisher`.",
        "Find the first minute when both of them land, and stop waiting right then.",
        "Print `Both birds land at minute <minute>.` and then `The heron came <times> times while we waited.` (counting that last landing too).",
      ],
      starter: r`heron = 7        # the heron lands every 7 minutes
kingfisher = 5   # the kingfisher lands every 5 minutes

# Wait, minute by minute, for the moment they both land.
`,
      tests: PRE + r`def birds_want(heron, king):
    m = 0
    h = 0
    while True:
        m += 1
        if m % heron == 0:
            h += 1
        if m % heron == 0 and m % king == 0:
            break
    return ["Both birds land at minute " + str(m) + ".", "The heron came " + str(h) + " times while we waited."]
check("Both birds land at minute 0." not in lines, "Minute 0 is before the waiting begins (and every count lands on 0!). Start counting from minute 1.")
check("Both birds land at minute 5." not in lines, "At minute 5 only the kingfisher is on the water. Wait for a minute when both of them land.")
check("Both birds land at minute 7." not in lines, "At minute 7 only the heron is on the water. Wait for a minute when both of them land.")
check("The heron came 4 times while we waited." not in lines, "The heron's count is one short: it landed in the last minute too. Count that landing before you stop.")
expect_lines(birds_want(7, 5))
expect_when([("heron = 7", "heron = 4"), ("kingfisher = 5", "kingfisher = 6")], birds_want(4, 6), "A heron every 4 minutes and a kingfisher every 6 can meet sooner than 4 times 6: check minute by minute.")
expect_when([("heron = 7", "heron = 6"), ("kingfisher = 5", "kingfisher = 3")], birds_want(6, 3), "Work from heron and kingfisher, not today's numbers.")
expect_when([("heron = 7", "heron = 5")], birds_want(5, 5))
expect_when([("heron = 7", "heron = 2"), ("kingfisher = 5", "kingfisher = 9")], birds_want(2, 9))
check("break" in src, "Wait with while True, and break out of it the moment both birds land.")`,
      hints: [
        "Wait like Marlo on the pier: each minute, look at the water. Is the heron down? Is the kingfisher down? The first minute both are, stop. How can you tell that a minute is one of the heron's minutes?",
        "'A multiple of 7' is `minute % 7 == 0`. Inside `while True:`, move the minute on first, then look; when it's the right moment, `break` leaves the loop at once. Count the heron with its own `if`, before the one that breaks.",
        "Each round: `minute = minute + 1`, then `if minute % heron == 0:` add one to the heron count, then `if minute % heron == 0 and ...:` `break`. Both lines print after the loop.",
      ],
      solution: r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while True:
    minute = minute + 1
    if minute % heron == 0:
        herons = herons + 1
    if minute % heron == 0 and minute % kingfisher == 0:
        break
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`,
      wrong: [r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while True:
    if minute % heron == 0 and minute % kingfisher == 0:
        break
    if minute % heron == 0:
        herons = herons + 1
    minute = minute + 1
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`, r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while True:
    minute = minute + 1
    if minute % heron == 0:
        herons = herons + 1
    if minute % heron == 0 or minute % kingfisher == 0:
        break
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`, r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while True:
    minute = minute + 1
    if minute % heron == 0 and minute % kingfisher == 0:
        break
    if minute % heron == 0:
        herons = herons + 1
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`, r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while True:
    minute = minute + 1
    if minute % heron == 0:
        herons = herons + 1
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`, r`heron = 7
kingfisher = 5
minute = heron * kingfisher
herons = kingfisher
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`, r`heron = 7
kingfisher = 5
minute = 0
herons = 0
while not (minute % heron == 0 and minute % kingfisher == 0 and minute > 0):
    minute = minute + 1
    if minute % heron == 0:
        herons = herons + 1
print(f"Both birds land at minute {minute}.")
print(f"The heron came {herons} times while we waited.")`],
      done: "Marlo: Minute thirty-five. Both on the water, bold as you like. Up goes the ridge roll. ...Gran would've clapped. She clapped at herons. They never clapped back.",
    },
    {
      id: "d08-door",
      part: "Door and shutters",
      title: "Paint Between the Showers",
      topic: "continue",
      cost: { wood: 3, stone: 1 },
      intro: [
        "Marlo: Green door, blue shutters. Gran's colours. Paint needs a dry day, though. Rain on wet paint and you've got a door that cries.",
        "Marlo: Rain here comes round like clockwork. Every so many days, a shower. Those days I sit by the stove and mend nets instead.",
        "To skip one round but keep the loop going, use `continue`. It jumps straight back up to the loop's condition, skipping the rest of the loop's lines, for this round only.",
        "Think carefully about which lines a `continue` skips!",
      ],
      codex: ["break-continue", "endless-loops"],
      quiz: {
        code: r`n = 0
while n < 5:
    n = n + 1
    if n == 3:
        continue
    print(n)`,
        question: "What does this program show?",
        options: ["1\n2\n4\n5", "1\n2", "1\n2\n3\n4\n5", "1\n2\n4"],
        answer: 0,
        why: "When n is 3, continue skips the print and goes back to the top, so 3 is missing. The loop isn't over, though: 4 and 5 still print. (break would have stopped after 2.)",
      },
      task: [
        "The door needs `coats` coats of paint, at most one coat a day, starting on day 1.",
        "Every `rain_every`-th day it rains (days 3, 6, 9... when `rain_every` is 3). On a rainy day, print `Day <day>: rain. Nets instead.` and paint nothing.",
        "On a dry day, put on the next coat and print `Day <day>: coat <coat> on.`",
        "When the last coat is on, print `The door is done on day <day>.`",
      ],
      starter: r`coats = 4        # coats of paint the door needs
rain_every = 3   # it rains every 3rd day

# Paint, day by day, until every coat is on.
`,
      tests: PRE + r`def paint_want(coats, rain_every):
    want = []
    d = 0
    c = 0
    while c < coats:
        d += 1
        if d % rain_every == 0:
            want.append("Day " + str(d) + ": rain. Nets instead.")
            continue
        c += 1
        want.append("Day " + str(d) + ": coat " + str(c) + " on.")
    return want + ["The door is done on day " + str(d) + "."]
check("Day 3: coat 3 on." not in lines, "It rained on day 3, but a coat went on anyway. On a rainy day, skip the painting and go round to the next day.")
check(not lines or not lines[0].startswith("Day 0"), "Days count from 1.")
once("The door is done", "\"door is done\"")
painted = len([l for l in lines if l.endswith(" on.")])
check(painted >= 4, "The door needs 4 coats, but only " + str(painted) + " went on. A rainy day only skips that one day: keep painting until every coat is on.")
expect_lines(paint_want(4, 3))
expect_when([("coats = 4", "coats = 3"), ("rain_every = 3", "rain_every = 2")], paint_want(3, 2), "Use rain_every to find the rainy days, and coats to know when to stop.")
expect_when([("coats = 4", "coats = 6")], paint_want(6, 3), "Six coats take until day 8: the rain on day 6 holds things up again.")
expect_when([("coats = 4", "coats = 2")], paint_want(2, 3), "Two coats are done by day 2. Stop as soon as the last coat is on.")
expect_when([("rain_every = 3", "rain_every = 10")], paint_want(4, 10))
check("continue" in src, "Skip the rainy days with continue.")`,
      hints: [
        "Every day starts the same way: the day moves on, then you look at the sky. A rainy day ends early, with nothing painted. Does the day counter still move on when it rains? (It must!)",
        "`continue` skips the rest of this round and goes back up to the loop's condition. So the line that moves the day on belongs at the **top** of the round, before any `continue`, or a rainy day would last forever.",
        "Loop `while coat < coats:`. Inside: add one to the day; `if day % rain_every == 0:` print the rain line and `continue`; after that `if`, add a coat and print its line.",
      ],
      solution: r`coats = 4
rain_every = 3
day = 0
coat = 0
while coat < coats:
    day = day + 1
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
        continue
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`,
      wrong: [r`coats = 4
rain_every = 3
day = 1
coat = 0
while coat < coats:
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
        continue
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
    day = day + 1
print(f"The door is done on day {day - 1}.")`, r`coats = 4
rain_every = 3
day = 0
coat = 0
while coat < coats:
    day = day + 1
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`, r`coats = 4
rain_every = 3
day = 0
coat = 0
while coat < coats:
    day = day + 1
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
    else:
        coat = coat + 1
        print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`, r`coats = 4
rain_every = 3
day = 0
coat = 0
while coat < coats:
    day = day + 1
    if day % 3 == 0:
        print(f"Day {day}: rain. Nets instead.")
        continue
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`, r`coats = 4
rain_every = 3
day = 0
coat = 0
while day < coats:
    day = day + 1
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
        continue
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`, r`coats = 4
rain_every = 3
day = 0
coat = 0
while coat < coats:
    day = day + 1
    if day % rain_every == 0:
        print(f"Day {day}: rain. Nets instead.")
        break
    coat = coat + 1
    print(f"Day {day}: coat {coat} on.")
print(f"The door is done on day {day}.")`],
      done: "Marlo: Green door, blue shutters, and the stove's drawing. ...Smoke out the chimney. Means somebody lives here. Means me.",
    },
    {
      id: "d09-fittings",
      part: "Rail, fenders and ladder",
      title: "Waves Against the Pier",
      topic: "import random",
      cost: { wood: 4, stone: 2 },
      intro: [
        "Marlo: A rail down one side, rope fenders down the other, and a ladder at the end for anyone who falls in. ...That'll be Pip.",
        "Marlo: Before I trust a rail, I watch the waves hit the pier. No two the same. The wind decides.",
        "The rune stone can roll dice too! `import random` at the top brings in Python's box of chance. `random.randint(1, 6)` rolls a whole number from 1 to 6 (both ends included), and `random.random()` gives a decimal from 0 up to, but not including, 1.",
        "But how do you check a program that does something different every time? With a **seed**. After `random.seed(42)`, the same rolls come out, in the same order, every single run.",
      ],
      codex: ["random"],
      quiz: {
        code: r`import random
random.seed(5)
a = random.randint(1, 100)
random.seed(5)
b = random.randint(1, 100)
print(a == b)`,
        question: "What does this program show?",
        options: ["True", "False", "It changes every run", "NameError"],
        answer: 0,
        why: "Seeding with the same number starts the dice from the same place, so the next roll is the same both times. a == b is always True.",
      },
      task: [
        "Seed the dice with Marlo's `lucky` number before any roll, so the same waves come every time you run.",
        "Then roll `waves` waves, one after another. Each wave is a whole number of hand-spans high, from 1 to 6. Print `Wave <number>: <height> spans`.",
        "A wave of 5 spans or more splashes over the deck. Count the splashes, and after the last wave print `<splashes> splashed over the deck.`",
        "Last of all, a gull might land on the new rail: it does if one more decimal roll (0 up to 1) comes out below 0.5. If it does, print `A gull lands on the rail.`",
      ],
      starter: r`lucky = 7    # Marlo's lucky number
waves = 5    # waves to watch

# 1. Seed the dice with lucky
# 2. Watch the waves
# 3. Perhaps a gull
`,
      tests: PRE + r`def waves_want(lucky, waves, splash=5):
    _dock_random.seed(lucky)
    want = []
    s = 0
    w = 1
    while w <= waves:
        h = _dock_random.randint(1, 6)
        want.append("Wave " + str(w) + ": " + str(h) + " spans")
        if h >= splash:
            s += 1
        w += 1
    want.append(str(s) + " splashed over the deck.")
    if _dock_random.random() < 0.5:
        want.append("A gull lands on the rail.")
    return want
def watch(swaps, lucky, waves):
    vns, got = variant(swaps)
    want = waves_want(lucky, waves)
    if got == want:
        return
    check(got != waves_want(7, waves), "With lucky = " + str(lucky) + " you still get lucky 7's waves. Seed the dice with lucky itself, not the number 7.")
    check(got != waves_want(lucky, waves, 6), "A wave of exactly 5 spans splashes over too: 5 or more.")
    expect_when(swaps, want, "Roll in the task's order: the seed first, then one roll per wave, then the gull's roll.")
check("random" in src and "seed" in src, "Your waves change every time you run. Seed the dice with lucky before the first roll, so they come out the same.")
for l in lines:
    if l.startswith("Wave ") and l.endswith(" spans") and ": " in l:
        h = l.split(": ")[1].split(" ")[0]
        check(h in ["1", "2", "3", "4", "5", "6"], "A wave of " + h + " spans? Waves are 1 to 6 spans high, both ends included.")
once("Wave 1:", "first wave")
expect_lines(waves_want(7, 5))
watch([("waves = 5", "waves = 8")], 7, 8)
watch([("lucky = 7", "lucky = 3")], 3, 5)
watch([("lucky = 7", "lucky = 11")], 11, 5)
watch([("lucky = 7", "lucky = 5"), ("waves = 5", "waves = 0")], 5, 0)`,
      hints: [
        "Three jobs, in this order: fix the dice with the seed, then roll and print the waves in a loop (counting splashes as you go), then one last roll for the gull. The seed has to come before every roll it should fix.",
        "`random.seed(n)` fixes the rolls that follow it. `random.randint(1, 6)` rolls a whole number from 1 to 6. `random.random()` gives a decimal from 0 up to 1, so `random.random() < 0.25` comes out True about a quarter of the time.",
        "After `import random` and `random.seed(lucky)`: a counter loop `while wave <= waves:` that makes `height = random.randint(..., ...)`, prints it, and counts it `if height >= ...:`. After the loop, the splash line, then `if random.random() < 0.5:` for the gull.",
      ],
      solution: r`import random
lucky = 7
waves = 5
random.seed(lucky)
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`,
      wrong: [r`import random
lucky = 7
waves = 5
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`, r`import random
lucky = 7
waves = 5
random.seed(7)
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`, r`import random
lucky = 7
waves = 5
random.seed(lucky)
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height > 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`, r`import random
lucky = 7
waves = 5
random.seed(lucky)
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(0, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`, r`import random
lucky = 7
waves = 5
random.seed(lucky)
if random.random() < 0.5:
    print("A gull lands on the rail.")
wave = 1
splashes = 0
while wave <= waves:
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")`, r`import random
lucky = 7
waves = 5
wave = 1
splashes = 0
while wave <= waves:
    random.seed(lucky)
    height = random.randint(1, 6)
    print(f"Wave {wave}: {height} spans")
    if height >= 5:
        splashes = splashes + 1
    wave = wave + 1
print(f"{splashes} splashed over the deck.")
if random.random() < 0.5:
    print("A gull lands on the rail.")`],
      done: "Marlo: Good rail. Took a big one over the top and didn't flinch. ...Fenders on, ladder down. Pip, the ladder's for you.",
    },
    {
      id: "d10-boat",
      part: "Rowboat",
      title: "One More Cast",
      topic: "loops with two ways to stop",
      cost: { wood: 7, stone: 0 },
      intro: [
        "Marlo: The boat. Mine. Forty years old and leaks like a sieve with opinions. I've caulked her. She'll float.",
        "Marlo: First trip out. You row, I cast. We stay until something bites... or until the light goes. The light always wins in the end.",
        "A loop can have two reasons to stop. Keep going while *nothing has bitten yet* **and** *there's still light*: join the two questions with `and`, and the loop ends as soon as either one turns False.",
        "Afterwards, look at which reason stopped it, and say so.",
      ],
      codex: ["random", "while", "logic"],
      quiz: {
        code: r`tries = 0
found = False
while not found and tries < 3:
    tries = tries + 1
    if tries == 5:
        found = True
print(tries, found)`,
        question: "What does this program show?",
        options: ["3 False", "5 True", "3 True", "4 False"],
        answer: 0,
        why: "found never becomes True in time: after 3 tries, tries < 3 is False, so the and is False and the loop stops. tries never reaches 5.",
      },
      task: [
        "Marlo casts again and again. Each cast, roll a whole number from 1 to `sides`. The fish only bite when it comes up `sides`, the top number.",
        "Print `Cast <number>: nothing.` for each cast with no bite, or `Cast <number>: a bite!` for the one that bites. After a bite, stop casting.",
        "There's only light for `max_casts` casts. If nothing has bitten by then, stop anyway.",
        "At the end print `Caught one in <casts> casts.`, or, if nothing bit, `No luck in <casts> casts. Home for supper.`",
      ],
      starter: r`import random
sides = 6        # roll 1 to sides each cast; only the top number is a bite
max_casts = 10   # casts before the light goes

# Cast until a bite, or until the light goes.
# The rune checks your casts with its own seeds, so don't seed the dice here.
`,
      tests: PRE + r`def casts_want(seed, sides, mx, bite_on=None):
    if bite_on is None:
        bite_on = sides
    _dock_random.seed(seed)
    want = []
    c = 0
    bitten = False
    while not bitten and c < mx:
        c += 1
        if _dock_random.randint(1, sides) == bite_on:
            bitten = True
            want.append("Cast " + str(c) + ": a bite!")
        else:
            want.append("Cast " + str(c) + ": nothing.")
    if bitten:
        want.append("Caught one in " + str(c) + " casts.")
    else:
        want.append("No luck in " + str(c) + " casts. Home for supper.")
    return want
def look_at(got, mx):
    bit = False
    for l in got:
        check(not (bit and l.startswith("Cast ")), "Marlo keeps casting after a bite! Stop as soon as a fish bites.")
        if l.endswith("a bite!"):
            bit = True
    casts = len([l for l in got if l.startswith("Cast ")])
    check(casts <= mx, "That's " + str(casts) + " casts, but the light goes after " + str(mx) + ". Stop then, even if nothing has bitten.")
def cast(seed, swaps=[], sides=6, mx=10, advice=""):
    vns, got = variant(swaps, seed)
    want = casts_want(seed, sides, mx)
    if got == want:
        return
    look_at(got, mx)
    check(got != casts_want(seed, sides, mx, 1), "Your fish bite on a 1. They only bite on the top number of the die, sides.")
    expect_when(swaps, want, advice, seed)
check(len([l for l in lines if l.startswith("Cast ")]) > 0, "Marlo hasn't cast once! Print a line for every cast.")
look_at(lines, 10)
cast(5)
cast(10, advice="When nothing bites, the light runs out after max_casts casts.")
cast(16, advice="A bite on the very last cast still counts as a catch.")
cast(4, [("sides = 6", "sides = 1")], 1, 10, "With a 1-sided die every roll is the top number, so the very first cast bites. Roll up to sides, not a number you typed.")
cast(0, [("max_casts = 10", "max_casts = 3")], 6, 3, "Stop after max_casts casts, not a number you typed.")
cast(3, [("sides = 6", "sides = 20")], 20, 10)`,
      hints: [
        "There are two reasons to stop: a bite, or no light left. So keep going only while *both* are still fine: nothing has bitten yet, and casts are left. A True/False variable can remember whether something has bitten.",
        "A flag like `found = False` before the loop, set to `True` inside an `if`, can be part of the condition: `while not found and tries < 5:`. After the loop, `if found:` tells you which reason stopped it.",
        "`while not bitten and casts < max_casts:` then count the cast, and `if random.randint(1, sides) == ...:` set `bitten = True` and print the bite line, `else:` print the nothing line. After the loop, choose the last line with `if bitten:`.",
      ],
      solution: r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten and casts < max_casts:
    casts = casts + 1
    if random.randint(1, sides) == sides:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`,
      wrong: [r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten or casts < max_casts:
    casts = casts + 1
    if random.randint(1, sides) == sides:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`, r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten:
    casts = casts + 1
    if random.randint(1, sides) == sides:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`, r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten and casts < max_casts:
    casts = casts + 1
    if random.randint(1, sides) == sides:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if casts < max_casts:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`, r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten and casts < max_casts:
    casts = casts + 1
    if random.randint(1, sides) == 1:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`, r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten and casts < max_casts:
    casts = casts + 1
    if random.randint(1, 6) == 6:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`, r`import random
sides = 6
max_casts = 10
casts = 0
bitten = False
while not bitten and casts < 10:
    casts = casts + 1
    if random.randint(1, sides) == sides:
        bitten = True
        print(f"Cast {casts}: a bite!")
    else:
        print(f"Cast {casts}: nothing.")
if bitten:
    print(f"Caught one in {casts} casts.")
else:
    print(f"No luck in {casts} casts. Home for supper.")`],
      done: "Marlo: A bite! ...No. That's no fish. That's heavy. Very heavy, and it isn't pulling back. Hold her steady... Pip. Pip, come and look at this. It's green. And it's round. And there's writing on it.",
    },
    {
      id: "d11-gear",
      part: "Fishing gear",
      title: "Gran's Knotted Cord",
      topic: "walking through a string",
      cost: { wood: 3, stone: 1 },
      intro: [
        "Marlo: It's a bell. Down there in the mud, green with weed and older than anybody. Gran's bell. ...She said lake. She always did round things up.",
        "Marlo: Too heavy for a rod and an old man. I need the strong rope from Gran's tackle box. ...And this was in there too. A cord, tied in knots. Gran used to knot me messages when I was small. I never could read them.",
        "Then let's read it together! `len(text)` is how many characters a string has, and `text[i]` is the character at position `i`. A counter that starts at 0 and climbs while it's less than `len(text)` visits every character, one per round.",
        "Marlo: Each letter is a run of knots, then a bit of plain cord. The number of knots tells you where to find the letter in Gran's key.",
      ],
      codex: ["walking-strings", "indexing"],
      quiz: {
        code: r`word = "reel"
i = 0
count = 0
while i < len(word):
    if word[i] == "e":
        count = count + 1
    i = i + 1
print(count)`,
        question: "What does this program show?",
        options: ["2", "1", "4", "IndexError"],
        answer: 0,
        why: "i visits 0, 1, 2, 3: the letters r, e, e, l. Two of them are \"e\". When i reaches 4, i < len(word) is False, so word[4] is never asked for.",
      },
      task: [
        "Read Gran's `cord` from left to right. An `o` is a knot; a `-` is the bit of plain cord that ends each letter.",
        "Count the knots in each run. That count is the letter's position in Gran's `key`. No knots at all (two dashes in a row) means position 0, the first character of the key: a space.",
        "Build Gran's message letter by letter, and count every knot on the cord.",
        "Print `Gran's cord has <knots> knots.` and then `It says: <message>`.",
      ],
      starter: r`cord = "o-oo-ooo-oooo--oo-ooooo-"   # o is a knot, - ends a letter
key = " ringtbel"                     # 0 knots is the space, 1 knot is r, 2 knots is i...

# Walk along the cord, one character at a time.
`,
      tests: PRE + r`KEY = " ringtbel"
def cord_want(cord, key, shift=0):
    i = 0
    run = 0
    knots = 0
    msg = ""
    while i < len(cord):
        if cord[i] == "o":
            run += 1
            knots += 1
        else:
            msg += key[run + shift]
            run = 0
        i += 1
    return ["Gran's cord has " + str(knots) + " knots.", ("It says: " + msg).rstrip()]
def make_cord(word, key):
    c = ""
    i = 0
    while i < len(word):
        c += "o" * key.find(word[i]) + "-"
        i += 1
    return c
CORD = 'cord = "o-oo-ooo-oooo--oo-ooooo-"'
once("It says", "message")
check("It says: ringit" not in lines, "Your message has lost its space. Two dashes in a row are a letter with no knots at all, and 0 knots is the first character of the key: a space.")
check(lines != cord_want("o-oo-ooo-oooo--oo-ooooo-", KEY, -1), "Your letters are one place off in the key. Positions start at 0, and 0 knots is the space, so 1 knot is the letter at position 1.")
check(not lines or lines[0] != "Gran's cord has 7 knots.", "7 is how many letters there are (one dash each), not how many knots. Count every o.")
expect_lines(cord_want("o-oo-ooo-oooo--oo-ooooo-", KEY))
bell = make_cord("bell", KEY)
expect_when([(CORD, 'cord = "' + bell + '"')], cord_want(bell, KEY), "Read the letters from the cord itself, not from today's message.")
ringer = make_cord("bell ringer", KEY)
expect_when([(CORD, 'cord = "' + ringer + '"')], cord_want(ringer, KEY))
expect_when([('key = " ringtbel"', 'key = " abcdefghijklmnopqrstuvwxyz"')], cord_want("o-oo-ooo-oooo--oo-ooooo-", " abcdefghijklmnopqrstuvwxyz"), "Look each letter up in key, so a different key gives different letters.")
expect_when([(CORD, 'cord = ""')], cord_want("", KEY), "An empty cord has no knots and says nothing.")`,
      hints: [
        "Read the cord the way your finger would: one character at a time, left to right, keeping count of the knots in the run you're on. What should happen when your finger reaches a dash? And afterwards, where does the count start again?",
        "Walk with `i` from 0 while `i < len(cord)`, looking at `cord[i]`. A knot adds to the count. A dash ends a letter: use the count as a position in the key (`\"xyz\"[2]` is `\"z\"`), add that letter to a message that began as `\"\"`, then start counting again from 0.",
        "Inside the loop: `if cord[i] == \"o\":` add one to the run and to the total, `else:` `message = message + key[...]` and set the run back to 0. Either way, `i = i + 1` at the end of the round.",
      ],
      solution: r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    else:
        message = message + key[run]
        run = 0
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`,
      wrong: [r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    else:
        message = message + key[run]
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    else:
        message = message + key[run - 1]
        run = 0
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
    else:
        message = message + key[run]
        knots = knots + 1
        run = 0
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    elif run > 0:
        message = message + key[run]
        run = 0
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i <= len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    else:
        message = message + key[run]
        run = 0
    i = i + 1
print(f"Gran's cord has {knots} knots.")
print(f"It says: {message}")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
print("Gran's cord has 17 knots.")
print("It says: ring it")`, r`cord = "o-oo-ooo-oooo--oo-ooooo-"
key = " ringtbel"
i = 0
run = 0
knots = 0
message = ""
while i < len(cord):
    if cord[i] == "o":
        run = run + 1
        knots = knots + 1
    else:
        message = message + key[run]
        run = 0
        print(f"It says: {message}")
    i = i + 1
print(f"Gran's cord has {knots} knots.")`],
      done: "Marlo: \"Ring it.\" ...That's all she wanted. Ring it. ...Right. Rods by the door, nets on the rack, and Gran's rope on the bell. Tomorrow, we raise her.",
    },
    {
      id: "d12-bell",
      part: "Bell frame and bell",
      title: "Raising the Bell",
      topic: "putting it together",
      cost: { wood: 6, stone: 3 },
      intro: [
        "Marlo: Frame's up at the end of the pier. Rope over the yoke, and down to the bell in the mud. Now we pull.",
        "Marlo: Every pull brings her up a bit. Some pulls the wet rope slides through my hands and she sinks back. ...Then we pull again. That's all fishing is, really.",
        "This takes the whole dock's toolbox: a `while True` loop that `break`s when the bell is up, a `continue` for the pulls that slip, dice for the luck, counters, and a report at the end. One piece at a time, and press Run often.",
      ],
      codex: ["break-continue", "random", "loop-counters", "min-max"],
      quiz: {
        code: r`up = 0
pulls = 0
while True:
    pulls = pulls + 1
    if pulls == 2:
        continue
    up = up + 5
    if up >= 10:
        break
print(pulls, up)`,
        question: "What does this program show?",
        options: ["3 10", "2 10", "3 15", "2 5"],
        answer: 0,
        why: "Pull 1 lifts 5. Pull 2 hits continue and lifts nothing. Pull 3 lifts it to 10, and 10 >= 10, so break. 3 pulls, 10 up.",
      },
      task: [
        "The bell must rise `height` spans to reach the yoke. Keep pulling, counting the pulls from 1.",
        "Each pull, roll a whole number from 1 to 6. A 1 means the rope slips: the bell sinks back `slip` spans (but never lower than where it started, 0), you print `Pull <n>: the rope slips! Back to <spans>.`, count the slip, and go straight on to the next pull.",
        "Any other roll raises the bell by that many spans: print `Pull <n>: up to <spans>.`",
        "The moment it reaches the yoke, stop pulling and report: `The bell is up after <pulls> pulls and <slips> slips.`",
        "Use `while True` with `break` and `continue`. No seed: the stone brings its own when it checks.",
      ],
      starter: r`import random
height = 20   # spans the bell must rise to reach the yoke
slip = 3      # spans it sinks back when the rope slips

# Raise the bell! The task list has every step.
`,
      tests: PRE + r`def bell_want(seed, height, slip, floor=True, reach_eq=True, skip=True):
    _dock_random.seed(seed)
    want = []
    risen = 0
    pulls = 0
    slips = 0
    while pulls < 500:
        pulls += 1
        roll = _dock_random.randint(1, 6)
        if roll == 1:
            risen = risen - slip
            if floor:
                risen = max(0, risen)
            slips += 1
            want.append("Pull " + str(pulls) + ": the rope slips! Back to " + str(risen) + ".")
            if skip:
                continue
        risen += roll
        want.append("Pull " + str(pulls) + ": up to " + str(risen) + ".")
        if risen >= height if reach_eq else risen > height:
            break
    return want + ["The bell is up after " + str(pulls) + " pulls and " + str(slips) + " slips."]
def pull(seed, swaps=[], height=20, slip=3, advice=""):
    vns, got = variant(swaps, seed)
    want = bell_want(seed, height, slip)
    if got == want:
        return
    check(not any("Back to -" in l for l in got), "The bell can't sink below where it started: when the rope slips, it never goes lower than 0.")
    check(got != bell_want(seed, height, slip, reach_eq=False), "Reaching the yoke exactly is enough: stop the moment the bell has risen height spans or more.")
    check(got != bell_want(seed, height, slip, skip=False), "After a slip that pull is over: go straight on to the next pull, without raising the bell.")
    expect_when(swaps, want, advice, seed)
check(len(lines) > 0 and lines[-1].startswith("The bell is up after"), "Finish with the report line, once the bell is up.")
once("The bell is up", "report")
check("Back to -" not in out, "The bell can't sink below where it started: when the rope slips, it never goes lower than 0.")
pull_lines = len(set(l.split(":")[0] for l in lines if l.startswith("Pull ")))
slip_lines = len([l for l in lines if "slips!" in l])
check(lines[-1].endswith(" and " + str(slip_lines) + " slips."), "Your report's slip count doesn't match the slips you printed (" + str(slip_lines) + "). Count each slip as it happens.")
check(lines[-1].startswith("The bell is up after " + str(pull_lines) + " pulls"), "Your report's pull count doesn't match the pulls you printed (" + str(pull_lines) + "). Count every pull, the ones that slip too.")
pull(2)
pull(1)
pull(6)
pull(14)
pull(0, [("height = 20", "height = 8")], 8, 3, "Work from height, not today's number.")
pull(1, [("slip = 3", "slip = 10")], 20, 10, "Sink back by slip, not a number you typed.")
check("break" in src, "Stop pulling with break, the moment the bell reaches the yoke.")
check("continue" in src, "After a slip, go straight on to the next pull with continue.")`,
      hints: [
        "Build it in pieces and Run after each: first a loop that pulls and prints, then the slips, then the stop. Every pull is one round: count it, roll once, and then either it slips or it rises.",
        "In `while True:`, a slip ends its round early with `continue`, and reaching the yoke ends the whole loop with `break`. `max(0, x)` keeps a number from going below 0.",
        "Each round: `pulls = pulls + 1`, `roll = random.randint(1, 6)`. `if roll == 1:` set `risen = max(0, ...)`, count the slip, print, `continue`. Otherwise add the roll, print, and `if risen >= ...:` `break`. The report goes after the loop.",
      ],
      solution: r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while True:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen >= height:
        break
print(f"The bell is up after {pulls} pulls and {slips} slips.")`,
      wrong: [r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while True:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = risen - slip
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen >= height:
        break
print(f"The bell is up after {pulls} pulls and {slips} slips.")`, r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while True:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen > height:
        break
print(f"The bell is up after {pulls} pulls and {slips} slips.")`, r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while True:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen >= height:
        break
print(f"The bell is up after {pulls} pulls and {slips} slips.")`, r`import random
height = 20
slip = 3
risen = 0
pulls = 1
slips = 0
while True:
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen >= height:
        break
    pulls = pulls + 1
print(f"The bell is up after {pulls} pulls and {slips} slips.")`, r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while risen < height:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        slips = slips + 1
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
print(f"The bell is up after {pulls} pulls and {slips} slips.")`, r`import random
height = 20
slip = 3
risen = 0
pulls = 0
slips = 0
while True:
    pulls = pulls + 1
    roll = random.randint(1, 6)
    if roll == 1:
        risen = max(0, risen - slip)
        print(f"Pull {pulls}: the rope slips! Back to {risen}.")
        continue
    risen = risen + roll
    print(f"Pull {pulls}: up to {risen}.")
    if risen >= height:
        break
print(f"The bell is up after {pulls} pulls and {slips} slips.")`],
      done: "Marlo: ...There she is. Out of the mud after all this time, and hung where she belongs. Gran, you were right. ...Mostly. It was a pond.",
    },
  ],
};
