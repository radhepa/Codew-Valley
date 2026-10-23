# Roadmap

## Phases

1. **The game itself.** All 12 buildings with their challenges, villagers,
   art, and the full story from `STORY.md`: Chronicle pages, ranks, act
   endings, Pip's secret, the epilogue. Finished = a learner can go from first
   `print` to writing whole programs and see the story end.
2. **Heart events and relationships.** Friendship hearts with every
   villager, gifts and daily chats, and heart scenes built on each
   villager's personal want (`STORY.md`, writing rules). Some heart events
   are small optional Python puzzles (help Odo sort his books, fix Tock's
   gadget). **Started:** hearts, daily chats, questions, personalities and
   the Friends journal are in; the heart events themselves are planned in
   `HEARTS.md`.
3. **Atmosphere and animation.** Day/night (the Clock Tower story beat
   turns it on), weather, villagers walking daily routines, idle and emote
   animations, ambient sound and music, more life in the valley.
4. **Village life.** Cooking (tavern + bakery), fishing (dock), farming
   (mill fields), foraging (apothecary). Each uses the Python of the building
   that hosts it, e.g. recipes as functions, fishing as loops.
5. **Seasons and festivals.** A calendar with four seasons, a festival in
   each (planting, midsummer bell night, harvest fair, winter star night),
   seasonal crops, fish and villager outfits.
6. **The Rune Workshop (endgame).** Code that runs the village: schedule
   villagers, automate the mill, sort the market, plan the harvest. Daily
   practice runes, review of old concepts, achievements, a free sandbox.
7. **Polish and release.** Settings and accessibility, save export, tablet
   support, playtesting with real beginners, performance, publishing on the
   web (and itch.io).

## The 12 buildings (about 170 challenges)

The valley grows clockwise around the rune stone. Each building teaches one
block of Python, from first `print` to writing whole programs.

| # | Building | Villager | Python | Later system |
|---|---|---|---|---|
| 1 | The Sleepy Serpent (tavern) | Bram, innkeeper | print, strings, variables, maths, f-strings, types, string methods, slicing, booleans | cooking (kitchen) |
| 2 | The Whistling Mill (windmill + wheat field) | Wren, miller | comparisons, if / elif / else, and / or / not, `in`, nested ifs, truthiness, min / max / round | farming, flour |
| 3 | Fisher's Dock (on the pond) | Marlo, fisher | while loops, counters, break / continue, `import random` | fishing |
| 4 | Market Square (stalls) | Sable, merchant | lists: indexing, append / remove / sort, len, `in`, slicing lists | shop, selling |
| 5 | The Hearth Bakery | Hazel, baker | for loops, range, accumulators, enumerate, zip, nested loops | cooking recipes |
| 6 | The Forge | Ingrid, blacksmith | functions: def, parameters, return, defaults, scope | tool upgrades |
| 7 | The Scribe's Library | Odo, librarian | dictionaries, nested data, `.get`, `.items`, counting | journal, collections |
| 8 | Apothecary and herb garden | Mirela, herbalist | split / join, tuples, sets, try / except | potions, foraging |
| 9 | Town Hall and notice board | Mayor Thistle | files (`open`, `with`), reading and writing records, CSV | quests board |
| 10 | The Clock Tower | Tock, tinkerer | modules (`math`, `random`, `datetime`), list comprehensions | day/night clock |
| 11 | The Guild Hall | Captain Rook | classes: `__init__`, methods, attributes, inheritance | guilds, festivals |
| 12 | The Observatory on the hill | Pip (the secret) | capstone: searching, sorting, recursion, generators, a program that runs the village | automation |

After the twelfth building the learner writes code that *runs* the village:
scripts that schedule villagers, sort the market, plan the harvest.

The story that ties them together (acts, Chronicle pages, Lord Vane, the
Hush, Pip's secret, rewards) is in `STORY.md`.

## Building 2: The Whistling Mill

Wren the miller wanders into the valley once the tavern opens: Bram's stew
needs bread and there's no flour. Wren stays at the mill plot as the story
partner for the chapter. The mill is 14 stages (see ART.md), and the sails
start turning once they're built. Conditionals fit the miller's life: the
mill decides what to do from the wind, the weather and the grain.
