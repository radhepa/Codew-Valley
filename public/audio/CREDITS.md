# Audio credits

Every sound in `public/audio` comes from the sources below. Licences were checked on
each source page on 2026-10-23. The files were trimmed, loudness-matched and
re-encoded to MP3 (music 128 kbps stereo, nature and effects 96 kbps mono).
No AI-generated music or voices are used.

The CC-BY pieces are also credited in the game (sound button › Credits), as the
licence requires.

## Music

| File | Title | Author | Source | Licence | Where it plays |
|---|---|---|---|---|---|
| music/title-windswept.mp3 | Windswept | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Windswept.mp3 | CC BY 4.0 | Title screen |
| music/day-morning.mp3 | Morning | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Morning.mp3 | CC BY 4.0 | Daytime, exploring (rotates) |
| music/day-clear-air.mp3 | Clear Air | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Clear%20Air.mp3 | CC BY 4.0 | Daytime, exploring (rotates) |
| music/day-exploration.mp3 | Medieval: Exploration | RandomMind | https://opengameart.org/content/medieval-exploration | CC0 | Daytime, exploring (rotates) |
| music/day-bards-tale.mp3 | Medieval: The Bard's Tale | RandomMind | https://opengameart.org/content/medieval-the-bards-tale | CC0 | Daytime, exploring (rotates) |
| music/evening.mp3 | Evening | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Evening.mp3 | CC BY 4.0 | Dusk and night |
| music/night-midnight-tale.mp3 | Midnight Tale | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Midnight%20Tale.mp3 | CC BY 4.0 | Dusk and night |
| music/rain-on-the-shore.mp3 | On the Shore | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/On%20the%20Shore.mp3 | CC BY 4.0 | Rain |
| music/rain-healing.mp3 | Healing (first 5 minutes, faded) | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Healing.mp3 | CC BY 4.0 | Rain |
| music/focus-enchanted-journey.mp3 | Enchanted Journey | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Enchanted%20Journey.mp3 | CC BY 4.0 | Coding workbench (played quietly) |
| music/sting-finish.mp3 | Light Sting | Kevin MacLeod (incompetech.com) | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Light%20Sting.mp3 | CC BY 4.0 | A building is finished |

Kevin MacLeod's credit line, as incompetech asks for it:

> "Title" Kevin MacLeod (incompetech.com)
> Licensed under Creative Commons: By Attribution 4.0
> https://creativecommons.org/licenses/by/4.0/

The short sting for each built stage, the quick-check and Check & build sounds,
and the rune shimmer are synthesized in `src/game/audio.ts` and `src/game/music.ts`
(plucked-string harp and sine chimes), so they have no source file.

## Nature

| File | What | Author | Source | Licence |
|---|---|---|---|---|
| amb/birds.mp3 | Birds by a copse of trees (1:00 cut from "park_ambience_birds") | Thimras | https://opengameart.org/content/park-ambiences | CC0 |
| amb/pond.mp3 | Small stream with frogs, used for the pond (cut from "park_ambience_river") | Thimras | https://opengameart.org/content/park-ambiences | CC0 |
| amb/crickets.mp3 | Crickets Ambient Noise (loopable) | Wolfgang_ (Ted Kerr) | https://opengameart.org/content/crickets-ambient-noise-loopable | CC0 |
| amb/rain.mp3 | Rain (loopable), take 3 | Ylmir | https://opengameart.org/content/rain-loopable | CC0 |
| amb/wind.mp3 | wind1 (synthesized wind) | Luke.RUSTLTD | https://opengameart.org/content/wind1 | CC0 |
| amb/thunder.mp3 | Thunder cut from "Rain + Long Thunder" | WuxiaScrub | https://opengameart.org/content/rain-long-thunder | CC0 |

## Sound effects

All from Kenney (kenney.nl), CC0.

| Files | Pack | Original files |
|---|---|---|
| sfx/step-grass-0..4.mp3 | Impact Sounds (https://kenney.nl/assets/impact-sounds) | footstep_grass_000..004 |
| sfx/wood-0..2.mp3 | Impact Sounds | impactPlank_medium_000..002 |
| sfx/mine-0..3.mp3 | Impact Sounds | impactMining_000..003 |
| sfx/step-path-0..4.mp3 | RPG Audio (https://kenney.nl/assets/rpg-audio) | footstep00, 02, 04, 06, 08 |
| sfx/chop.mp3 | RPG Audio | chop |
| sfx/book-open.mp3, book-close.mp3, book-place.mp3 | RPG Audio | bookOpen, bookClose, bookPlace1 |
| sfx/page-1..3.mp3 | RPG Audio | bookFlip1..3 |
| sfx/cloth.mp3, leather.mp3 | RPG Audio | cloth1, handleSmallLeather |
| sfx/click.mp3, select.mp3, toggle.mp3, tick.mp3 | Interface Sounds (https://kenney.nl/assets/interface-sounds) | click_002, select_002, toggle_001, tick_002 |
| sfx/glass-1.mp3, glass-2.mp3 | Interface Sounds | glass_001, glass_003 |
