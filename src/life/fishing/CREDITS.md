# Fishing: sound credits

New sound files for fishing, all CC0, in `public/audio/sfx/fishing/`. Ready to merge into
`public/audio/CREDITS.md`. Licence checked on the source page on 2026-10-24. The files were
loudness-matched (EBU R128, -18 LUFS), given a short fade-out and re-encoded to MP3 (96 kbps mono).

| Files | What | Author | Source | Licence | Original files |
|---|---|---|---|---|---|
| sfx/fishing/plop-0..2.mp3 | The float landing on the water | rubberduck | https://opengameart.org/content/40-cc0-water-splash-slime-sfx | CC0 | splash_09, splash_10, splash_14 |
| sfx/fishing/bite-0..1.mp3 | The float pulled under | rubberduck | same pack | CC0 | splash_06, splash_15 |
| sfx/fishing/splash-0..2.mp3 | A fish thrashing, and landing the catch | rubberduck | same pack | CC0 | splash_04, splash_08, splash_02 |
| sfx/fishing/bubble-0..1.mp3 | Nibbles and the one that got away | rubberduck | same pack | CC0 | bubble_01, bubble_03 |

Also used, already in the game and credited there: Kenney's `tick` (the reel's ratchet),
`cloth` and `leather` (the cast and the strike). The cast's swish and the catch fanfare are
synthesized in `src/life/fishing/sound.ts` (filtered noise and the game's plucked harp), so they
have no source file.
