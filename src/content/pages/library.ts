import type { CodexPage } from "../types.ts";

// Codex pages for The Scribe's Library (building 7): dictionaries.
// Page ids must be unique across the whole Codex (content tests check).
const r = String.raw;

export const LIBRARY_PAGES: CodexPage[] = [
  {
    id: "dictionaries",
    title: "Dictionaries",
    summary: "Values filed under keys: making a dictionary and looking things up.",
    blocks: [
      { p: "A list keeps things by **position**: the first, the second, the third. A **dictionary** keeps each value under a name of its own, called its **key**, so you can find it again by that name." },
      { code: r`ages = {"Fern": 7, "Rook": 70}
print(ages["Rook"])`, out: "70" },
      { p: "Write a dictionary with curly brackets `{ }`. Inside go `key: value` pairs, with commas between them. Keys are usually strings; values can be anything at all: numbers, strings, lists, even other dictionaries." },
      { code: r`colours = {"sky": "blue", "grass": "green"}
print(colours)
print(len(colours))`, out: "{'sky': 'blue', 'grass': 'green'}\n2" },
      { p: "`len()` of a dictionary is how many entries (key and value pairs) it holds." },
      { h: "Looking a value up" },
      { p: "Put the key in square brackets after the dictionary's name and you get its value back. You can use it anywhere you'd use a variable: in sums, comparisons, f-strings." },
      { code: r`pantry = {"eggs": 6, "jam": 2}
total = pantry["eggs"] + pantry["jam"]
print(f"{total} things in the pantry")`, out: "8 things in the pantry" },
      { tip: "Keys are exact: `\"Eggs\"` and `\"eggs\"` are two different keys. Looking up a key that isn't there stops your program with a KeyError (the Looking up safely page shows how to avoid it)." },
      { code: r`pantry = {"eggs": 6}
print(pantry["milk"])`, err: "KeyError" },
      { h: "One value per key" },
      { p: "Each key appears only once in a dictionary. If you write the same key twice, the last value wins." },
      { code: r`hats = {"Pip": "none", "Pip": "tiny"}
print(hats)`, out: "{'Pip': 'tiny'}" },
    ],
  },
  {
    id: "dict-changes",
    title: "Changing a dictionary",
    summary: "Adding, changing and removing entries, and changing a dictionary inside a function.",
    blocks: [
      { p: "Dictionaries can change. Storing a value under a key **replaces** its value if the key is already there, and **adds** a new entry if it isn't." },
      { code: r`basket = {"pears": 2}
basket["pears"] = 5
basket["plums"] = 3
print(basket)`, out: "{'pears': 5, 'plums': 3}" },
      { p: "`+=` and `-=` work on an entry that's already there, just like on a variable." },
      { code: r`scores = {"Wren": 4}
scores["Wren"] += 3
print(scores["Wren"])`, out: "7" },
      { tip: "`+=` on a key that isn't there yet is a KeyError: there's no old value to add to. Give the entry a starting value first." },
      { code: r`scores = {}
scores["Bram"] += 1`, err: "KeyError" },
      { h: "Removing entries" },
      { p: "`del d[key]` removes an entry. `d.pop(key)` removes it **and** gives you back the value it held." },
      { code: r`coats = {"red": "Hazel", "green": "Marlo", "grey": "Odo"}
del coats["grey"]
who = coats.pop("red")
print(who)
print(coats)
print(len(coats))`, out: "Hazel\n{'green': 'Marlo'}\n1" },
      { p: "Both stop with a KeyError when the key isn't there. `pop` can take a second value, a **default**, to give back instead; then a missing key removes nothing and nothing goes wrong." },
      { code: r`coats = {"green": "Marlo"}
print(coats.pop("blue", "nobody"))
print(coats)`, out: "nobody\n{'green': 'Marlo'}" },
      { h: "Changing a dictionary inside a function" },
      { p: "A function that is given a dictionary can change it, and the change is still there after the function has finished. The function doesn't get a copy; it gets the very same dictionary under a new name." },
      { code: r`def feed(pets, name):
    pets[name] = "fed"

zoo = {"owl": "hungry", "cat": "hungry"}
feed(zoo, "owl")
print(zoo)`, out: "{'owl': 'fed', 'cat': 'hungry'}" },
    ],
  },
  {
    id: "dict-safe",
    title: "Looking up safely",
    summary: "in on a dictionary, KeyError, and .get with a default.",
    blocks: [
      { p: "Looking up a key that isn't in a dictionary stops your program with a **KeyError**. The message names the key it couldn't find." },
      { code: r`inks = {"black": 3}
print(inks["blue"])`, err: "KeyError" },
      { h: "Ask first with in" },
      { p: "`key in d` is True when `key` is one of the dictionary's **keys**. It never looks at the values. `not in` asks the opposite." },
      { code: r`moons = {"harvest": "orange"}
print("harvest" in moons)
print("orange" in moons)
print("blood" not in moons)`, out: "True\nFalse\nTrue" },
      { p: "So you can check before you look:" },
      { code: r`inks = {"black": 3, "red": 1}
colour = "blue"
if colour in inks:
    print(inks[colour], "pots of", colour)
else:
    print("No", colour, "ink at all")`, out: "No blue ink at all" },
      { h: ".get" },
      { p: "`d.get(key)` gives the value if the key is there, and `None` if it isn't. `d.get(key, default)` gives the default instead of None. No error, and no `if` needed." },
      { code: r`inks = {"black": 3}
print(inks.get("black", 0))
print(inks.get("blue", 0))
print(inks.get("blue"))`, out: "3\n0\nNone" },
      { tip: "`.get` only reads. It never adds the key to the dictionary, so the default isn't stored anywhere unless you store it yourself." },
      { p: "The default can be any value you like: 0, an empty string, an empty list, or even the key itself." },
      { code: r`nicknames = {"Bartholomew": "Bram"}
for name in ["Bartholomew", "Wren"]:
    print(nicknames.get(name, name))`, out: "Bram\nWren" },
    ],
  },
  {
    id: "dict-loops",
    title: "Looping over a dictionary",
    summary: "for over the keys, .items(), .values(), and sum/max on the values.",
    blocks: [
      { p: "A `for` loop over a dictionary visits its **keys**, one per round, in the order they were added." },
      { code: r`stalls = {"apples": 4, "cheese": 9}
for name in stalls:
    print(name, stalls[name])`, out: "apples 4\ncheese 9" },
      { h: ".items(): keys and values together" },
      { p: "`.items()` hands you each key **and** its value. Name them both after `for`, the way you did with `enumerate` and `zip`." },
      { code: r`stalls = {"apples": 4, "cheese": 9}
for name, price in stalls.items():
    print(f"{name} cost {price} coins")`, out: "apples cost 4 coins\ncheese cost 9 coins" },
      { h: ".values() and .keys()" },
      { p: "`.values()` gives just the values. `sum`, `max`, `min` and `len` all work on it, like on a list. (`.keys()` gives just the keys, the same ones a plain loop visits.)" },
      { code: r`rain = {"Mon": 3, "Tue": 7, "Wed": 2}
print(sum(rain.values()))
print(max(rain.values()))
for day in rain.keys():
    print(day)`, out: "12\n7\nMon\nTue\nWed" },
      { tip: "`max(d)` on its own compares the **keys**, not the values. For text that means the one latest in the alphabet:" },
      { code: r`rain = {"Mon": 3, "Tue": 7, "Wed": 2}
print(max(rain))`, out: "Wed" },
      { p: "To find **which** key has the biggest value, walk through `.items()` keeping track of the best so far, just as you found the best by hand with a `for` loop at the bakery." },
      { tip: "Don't add or remove keys while you're looping over the same dictionary: Python stops with a RuntimeError. Changing the values is fine." },
      { code: r`stock = {"nails": 5}
for item in stock:
    stock["rope"] = 1`, err: "RuntimeError" },
    ],
  },
  {
    id: "counting",
    title: "Counting and grouping",
    summary: "Tallies in a dictionary, and grouping things into lists.",
    blocks: [
      { p: "To count how many times each thing turns up, make each thing a **key** and its count the **value**. The first time you meet something it isn't a key yet, so its count has to start." },
      { code: r`votes = {}
for pick in ["oak", "elm", "oak", "oak"]:
    if pick in votes:
        votes[pick] += 1
    else:
        votes[pick] = 1
print(votes)`, out: "{'oak': 3, 'elm': 1}" },
      { p: "With `.get` and a default of 0 the `if` disappears: \"what it was, or 0, plus one\"." },
      { code: r`days = {"sun": 2}
days["sun"] = days.get("sun", 0) + 1
days["snow"] = days.get("snow", 0) + 1
print(days)`, out: "{'sun': 3, 'snow': 1}" },
      { tip: "A tally made inside a function should start with its own empty dictionary inside that function. Make it outside and every call keeps adding to the same old counts." },
      { h: "Grouping into lists" },
      { p: "The same idea works with lists instead of numbers: each key gets a list, made empty the first time, and then each new thing is appended to it." },
      { code: r`birds = ["owl", "wren", "owl"]
days = [1, 2, 4]
sightings = {}
for bird, day in zip(birds, days):
    if bird not in sightings:
        sightings[bird] = []
    sightings[bird].append(day)
print(sightings)`, out: "{'owl': [1, 4], 'wren': [2]}" },
    ],
  },
  {
    id: "nested-data",
    title: "Data inside data",
    summary: "Dictionaries of lists, lists of dictionaries, and reaching inside to change things.",
    blocks: [
      { p: "A dictionary's values can be lists, a list can hold dictionaries, and a dictionary can hold dictionaries. You reach inside **one step at a time**, left to right." },
      { h: "A dictionary of lists" },
      { code: r`rooms = {"kitchen": ["pot", "ladle"], "loft": []}
rooms["loft"].append("trunk")
print(rooms["kitchen"][1], len(rooms["loft"]))
print("pot" in rooms["kitchen"])`, out: "ladle 1\nTrue" },
      { p: "`rooms[\"kitchen\"]` is a whole list, so everything you know about lists works on it: indexes, `append`, `in`, `len`." },
      { h: "A list of dictionaries" },
      { p: "A list of dictionaries is a set of **records**: each dictionary describes one thing, with the same keys." },
      { code: r`pets = [
    {"name": "Biscuit", "kind": "dog", "age": 3},
    {"name": "Moth", "kind": "cat", "age": 11},
]
print(pets[1]["name"])
for pet in pets:
    if pet["age"] > 5:
        print(pet["name"], "is a wise old", pet["kind"])`, out: "Moth\nMoth is a wise old cat" },
      { p: "A new record is just a new dictionary appended to the list: `pets.append({\"name\": \"Dot\", \"kind\": \"hen\", \"age\": 1})`." },
      { h: "Dictionaries inside dictionaries" },
      { code: r`farm = {"barn": {"cows": 4, "names": ["Daisy", "Clover"]}, "field": {"cows": 2, "names": []}}
print(farm["barn"]["names"][1])
farm["field"]["cows"] -= 1
for place, info in farm.items():
    print(place, info["cows"])`, out: "Clover\nbarn 4\nfield 1" },
      { h: "Another name, the same data" },
      { p: "Giving an inner list or dictionary a name of its own doesn't copy it. Both names lead to the very same thing, so a change through one shows through the other." },
      { code: r`cupboard = {"jars": ["jam"]}
shelf = cupboard["jars"]
shelf.append("honey")
print(cupboard)`, out: "{'jars': ['jam', 'honey']}" },
      { tip: "Read a long path left to right: `farm[\"barn\"][\"names\"][0]` is the farm's barn, then its names, then the first one. If any step is missing, that step is where the KeyError or IndexError comes from." },
    ],
  },
  {
    id: "sorting-dicts",
    title: "Sorting dictionaries",
    summary: "sorted() on the keys, by value with key=, by length, and reverse.",
    blocks: [
      { p: "`sorted(d)` gives back a **new list** of the dictionary's keys in order: A to Z for text, smallest first for numbers. The dictionary itself doesn't change." },
      { code: r`ages = {"Rook": 70, "Fern": 7, "Tock": 41}
print(sorted(ages))`, out: "['Fern', 'Rook', 'Tock']" },
      { h: "Sorting by something else: key=" },
      { p: "`key=` takes a **function**. sorted calls it on every item and sorts by the answers. `ages.get` is a function that answers \"what's this key's value?\", so this sorts the names by age:" },
      { code: r`ages = {"Rook": 70, "Fern": 7, "Tock": 41}
print(sorted(ages, key=ages.get))`, out: "['Fern', 'Tock', 'Rook']" },
      { p: "`len` is a function too, so `key=len` sorts by length. Items with the same answer keep the order they already had (here `owl` stays before `ink`)." },
      { code: r`words = ["owl", "a", "lantern", "ink"]
print(sorted(words, key=len))`, out: "['a', 'owl', 'ink', 'lantern']" },
      { h: "Upside down, and just the first few" },
      { p: "`reverse=True` turns the order upside down, and items with the same answer still keep their order. A slice of the sorted list keeps just the front of it." },
      { code: r`ages = {"Rook": 70, "Fern": 7, "Tock": 41}
print(sorted(ages, reverse=True))
print(sorted(ages, key=ages.get)[:2])`, out: "['Tock', 'Rook', 'Fern']\n['Fern', 'Tock']" },
      { h: "Your own key function" },
      { p: "Any function that takes one item and gives back something to sort by will do." },
      { code: r`def last_letter(word):
    return word[-1]

print(sorted(["moss", "fern", "ivy"], key=last_letter))`, out: "['fern', 'moss', 'ivy']" },
      { tip: "Hand over the function's **name**, without brackets. `key=len()` calls len straight away, with nothing to measure, and stops with a TypeError." },
      { code: r`words = ["owl", "a"]
print(sorted(words, key=len()))`, err: "TypeError" },
    ],
  },
];
