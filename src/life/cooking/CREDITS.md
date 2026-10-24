# Cooking: sound credits

Files in `public/audio/sfx/cooking/`, ready to merge into `public/audio/CREDITS.md`.
Converted from OGG to MP3 (mono, 96 kbps) and loudness-matched (-18 LUFS) on 2026-10-24.

| File | What | Author | Source | Licence |
|---|---|---|---|---|
| sfx/cooking/knife-0.mp3, knife-1.mp3 | Chopping over the pot (`knifeSlice`, `knifeSlice2`) | Kenney (kenney.nl) | RPG Audio, https://kenney.nl/assets/rpg-audio | CC0 |
| sfx/cooking/pot-0.mp3 … pot-2.mp3 | Spoon against the pot, pan clinks (`metalPot1`–`3`) | Kenney (kenney.nl) | RPG Audio, https://kenney.nl/assets/rpg-audio | CC0 |
| sfx/cooking/draw-knife.mp3 | Picking up the knife (`drawKnife2`) | Kenney (kenney.nl) | RPG Audio, https://kenney.nl/assets/rpg-audio | CC0 |
| sfx/cooking/basket.mp3 | A villager's basket of ingredients (`cloth2`) | Kenney (kenney.nl) | RPG Audio, https://kenney.nl/assets/rpg-audio | CC0 |
| sfx/cooking/plate-0.mp3 … plate-2.mp3 | The dish set down at the reveal (`impactPlate_light_000`–`002`) | Kenney (kenney.nl) | Impact Sounds, https://kenney.nl/assets/impact-sounds | CC0 |

Made in code (`src/life/cooking/sound.ts`, no source file): the bubbling pot, the sizzling
pan, the fire's crackle, the oven's breath, the millstone's rumble, the plop into the pot,
and the reveal and new-recipe arpeggios (the plucked harp from `src/game/audio.ts`).
No voices, no AI-made sound or music.
