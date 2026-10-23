# Heart events roadmap

The plan for Phase 2's heart events. **Nothing here is written, staged or
animated yet.** The friendship system that leads to them is already in the
game:
- `src/friends.ts` holds the points, hearts, daily chats and questions.
- `src/content/people/` holds each villager's personality and dialogue.
- The Friends journal opens with **F**.

## How friendship works today

- 100 points per heart, up to 10 hearts. Points never decay.
- **The first chat each day** gives +20.
- **Questions:** each villager has three one-time questions, unlocked at
  0, about 3, and about 6 hearts. They ask at most one per day. The answer
  that suits them is worth up to +50, and no answer is ever "wrong" or cruel.
- **Building their home:** +15 per part, and +100 when the building is
  finished. Pip gains +10 for every challenge you solve.
- **Milestones:** reaching 2, 4, 6, 8 and 10 hearts plays a short milestone
  line. Those lines mark the exact spots where the heart events below will
  slot in.
- **The journal** shows likes at 2 hearts, dislikes at 4, and the villager's
  wish at 6 (their personal want from `STORY.md`).

Pacing: daily chats plus questions and building take a villager to about
5 hearts by the end of their own chapter. Going higher takes the later
systems below (gifts, festivals and the heart events themselves).

## What a heart event is

A short scene of 1–3 minutes that plays the first time all of its
conditions are true:
- you have at least N hearts with the villager
- you walk into the right place
- sometimes also a time of day, the weather, a finished building or a story
  flag

It should:
- show a side of the villager their everyday lines only hint at
- move their **personal want** one step forward (2 → 10 hearts is that want's
  whole arc)
- end with one **choice** that colours later lines (stored as a flag, never
  punishing)
- at 6 and 10 hearts, include a **personal rune**: a small optional Python
  task solved inside the scene, using only what the learner has already been
  taught. It's practice in disguise and never blocks the scene. Skipping it
  plays a gentler ending.
- leave a **keepsake** in the Founder's Journal (and later a gift, recipe or
  decoration)

**Friendship, not romance.** This is a learning game for every age, so
the 10-heart event seals a lifelong friendship (a shared tradition, a name
carved somewhere, a place at their table) rather than a marriage.

## The events

Hearts: 2 · 4 · 6 · 8 · 10. Each event also needs that villager's building
finished, unless it says otherwise.

### Pip (the story's heart; events stay inside the rune stone's circle until Act III)

1. **2 · The Humming.** At dusk Pip hums an old tune without noticing. Ask
   about it, and Pip can't remember where it's from.
2. **4 · Warm Stone.** It rains, and Pip won't leave the stone even to shelter.
   You hold a cloak over them. Choice: stay and talk, or bring Bram's soup.
3. **6 · The Bell Song.** (Needs the dock.) The bell rings and Pip mouths
   words in the Old Tongue. *Personal rune:* rebuild the tune as a list of
   notes and print it. Pip goes very quiet.
4. **8 · The Edge of the Circle.** Pip tries to follow you one step past the
   stone and flickers. A gentle scare that foreshadows the Observatory.
5. **10 · After.** (Plays after the finale.) Pip's first walk through the
   whole town, at your side, naming every building you built together.

### Bram: the lost caravan crew

1. **2 · The Ledger.** Bram's old caravan log falls from a shelf, full of
   recipes, routes and six names.
2. **4 · Gorran's Song.** Evening at the tavern: Bram teaches you the song the
   crew sang all night. Choice: sing along, or ask about them.
3. **6 · Letters to Nowhere.** Bram has written a letter a year to the crew and
   never sent one. *Personal rune:* sort the letters by year with a loop and
   count them. You decide together to send the newest with Sable's traders.
4. **8 · A Reply.** (Needs the market.) A trader brings a reply from old
   Tamsin. The crew settled two valleys over. Bram cries into the stew.
5. **10 · The Long Table.** The crew visits. Bram sets one long table across
   the tavern and saves you the seat at the head.

*Pair event, Bram & Hazel* (both at 6 hearts, bakery finished): a burnt loaf,
a slammed door, an apology at the oven. It plays from either villager's 8.

### Wren: the family mill

1. **2 · Weather Notes.** Wren shows you her grandmother's weather journal.
2. **4 · The Blue Key.** A storm night. Wren admits she still carries the key
   to the old mill's blue door.
3. **6 · The Debt.** (Needs the market.) Wren learns the Vane Company still
   owns her family's mill. *Personal rune:* add up the old debt from the
   ledger lines with a loop, and find the error that made it far too big.
4. **8 · Both.** (Needs the town hall.) A choice to buy back the old mill
   or let it go. Either way Wren says the line she learned from you:
   "Why not both?"
5. **10 · The Blue Door.** Wren paints the Whistling Mill's door blue and
   hangs the old key above it. The third sail is named after you.

### Marlo: grandmother's stories (dock)

1. **2 · Fish Tales.** Marlo shows you Gran's old float, carved with a mark
   that looks like a rune.
2. **4 · The Bell's Name.** He knows the bell's old name from a lullaby.
3. **6 · Grandmother's Map.** *Personal rune:* read a list of depth soundings
   and find the deepest spot of the pond.
4. **8 · What's Down There.** A dawn row to the pond's centre. Something old
   glints below (a seed for a later Chronicle side page).
5. **10 · The Lullaby.** Marlo sings it at the bell, the first time in sixty
   years.

### Sable: the rival trader (market; Sable is they/them)

1. **2 · The Pitch.** Sable tries to sell you your own rune stone, then laughs.
2. **4 · Fennick Gale.** Sable's old rival from the Lantern Road fairs sets
   up across the valley road, and Sable's bravado cracks.
3. **6 · Fair Prices.** *Personal rune:* use a dict to compare two price lists
   and find which goods Fennick really undercuts.
4. **8 · A Truce.** Sable and Fennick's old partnership, and why it broke.
5. **10 · Partners.** A new shared stall with a sign you design.

### Hazel: Bram (bakery)

1. **2 · Starter.** Hazel's sourdough starter is older than the feud. It's
   named after their mother.
2. **4 · Two Recipes.** Her bread and Bram's stew use the same secret spice.
3. **6 · The Letter.** She has an unsent letter too (pairs with Bram's 6).
4. **8 · The Pair Event** (see Bram).
5. **10 · Family Supper.** Bram, Hazel and you around one table, arguing
   happily about salt.

### Ingrid: her old crew (forge)

1. **2 · The Mark.** Ingrid's maker's mark is one of four, one for each of
   her old forge crew (Dagny, Hollis and young Pell).
2. **4 · Why She Left.** The order from the Company that she refused.
3. **6 · Quality Control.** *Personal rune:* find the faulty blades in a batch
   list using conditions.
4. **8 · Old Hands.** Two of her crew turn up asking for work. Choice: vouch
   for them.
5. **10 · Five Marks.** Ingrid forges you a tool with all four marks, plus
   a fifth: yours.

### Odo: the unfinished book (library)

1. **2 · Ink Everywhere.** Odo has lost his own manuscript inside the library.
2. **4 · Chapter Nine.** He can't finish it because he doesn't know the ending.
3. **6 · The Index.** *Personal rune:* build an index (a dict of word → pages)
   for his chapter list.
4. **8 · The Reader.** Odo reads you a chapter. It's about you.
5. **10 · The Last Page.** He asks you to write the final line of *A Gentle
   History of Forgotten Alphabets*, 31 years in the making.

### Mirela: her garden (apothecary)

1. **2 · Plant Talk.** You catch her apologising to a weed.
2. **4 · The Grey Leaf.** One bed won't grow, and the Hush is near.
3. **6 · Watering Schedule.** *Personal rune:* a loop and conditions that
   decide which beds to water.
4. **8 · Mother's Seeds.** A sealed packet from her mother, planted together.
5. **10 · First Bloom.** A flower nobody has seen in 300 years, named for you.

### Mayor Thistle: re-election (town hall)

1. **2 · The Campaign.** He canvasses you, the only undecided voter.
2. **4 · Speech Practice.** He practises his speech on a goat.
3. **6 · The Count.** *Personal rune:* count the votes from a list (8 voters,
   9 ballots: find the duplicate).
4. **8 · Opponent.** Pip announces a run for mayor. Thistle panics.
5. **10 · Landslide.** Re-elected 8–1 (Pip voted for Pip). He makes you Deputy
   of Paperwork.

### Tock: an apprentice (clock tower)

1. **2 · Not Broken Yet.** Tock "fixes" your axe. It's better.
2. **4 · Spare Gears.** Tock admits there's nobody to leave the workshop to.
3. **6 · The Escapement.** *Personal rune:* simulate the clock's ticks with a
   loop and find where it drifts.
4. **8 · A Volunteer.** A village child keeps sneaking in. Choice: encourage
   Tock to take them on.
5. **10 · Two Names.** The clock's maker's plate gets a second name, and a
   third: yours.

### Captain Rook: one last adventure (guild hall)

1. **2 · The Scar.** The real story is less heroic and much funnier.
2. **4 · Old Maps.** Rook's unfinished map has a blank corner: the north hill.
3. **6 · Route Planning.** *Personal rune:* choose the safest path from a list
   of trails with conditions.
4. **8 · The Road Up.** (Act III.) You and Rook scout the north hill road
   together.
5. **10 · The Last Entry.** Rook finishes the map, signs it with your name
   beside Rook's own, and hangs up the old sword for good.

### Lord Vane: his grandfather (arrives with the market; events open after Act II)

1. **2 · Paperwork.** Vane, alone at the market, files forms for fun. He's
   lonely.
2. **4 · The Portrait.** A small painting of his grandfather, a Willowmere
   speaker who left.
3. **6 · The Mill Ledger.** (Pairs with Wren's 6.) Vane finds the Company's
   mistake in Wren's family debt and is ashamed. *Personal rune:* write the
   corrected ledger.
4. **8 · An Apology.** Vane apologises to Wren. Choice: stand beside him, or
   let them talk alone.
5. **10 · Speaking It.** Vane asks you to teach him his first line of Python.
   He prints his grandfather's name.

## What needs building first

In order. Each step is small enough for its own session.

1. **Villager routines.** Villagers walk between home, the market and the
   tavern by time of day, so events can find them. Needs the animation set
   (idle, walk, talk, wave, react) and the weather session's time of day.
2. **Scene engine.** Data-driven scene scripts in `src/content/scenes/`:
   - actors walk to marks and play animations
   - camera shots
   - emote bubbles (! ? ♥ …)
   - dialogue (reusing `say()`), choices that set flags
   - fades
   - conditions: hearts, place, time, weather, building finished, flags
   Plus a dev hook to play any scene.
3. **Personal runes.** A slim workbench mode for small in-scene challenges,
   reusing the challenge format (`task`, `starter`, `tests`, `hints`,
   `solution`, `wrong`) so `npm test` checks them too.
4. **Keepsakes.** The Founder's Journal gets a keepsake shelf, filled by
   events.
5. **Gifts** (with Phase 4's foraging and cooking): `likes` and `dislikes`
   in each profile become loved, liked and disliked items. One gift a day,
   double on birthdays.
6. **Write the events** a few villagers at a time, Act I villagers first.
   Each batch is reviewed against `STORY.md`'s writing rules and play-tested.
