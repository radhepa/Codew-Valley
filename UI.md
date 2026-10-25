# UI: the pixel valley look

The interface should feel like a cozy indie game (Stardew Valley, Animal Crossing),
never like a web app. **The world and the characters stay 3D; only the UI is pixel
art:** parchment in chunky pixel wooden frames, hard pixel shadows, square corners,
a pixel font and pixel icons. Everything lives in `src/style.css` as tokens and a few
shared classes; systems add their own CSS in their folders and build on these.

## Pixel art

The frames and icons are PNGs in `src/ui/px/`, drawn by `art/ui/make_ui_art.py`
(run `python art/ui/make_ui_art.py src/ui/px`). They are pre-scaled with
nearest-neighbour, so keep them at their size or a whole multiple:

- **Frames** are nine-slices used with `border-image`: `f_paper` (4x, 32px border),
  `f_plate` (4x, 24px), and 3x copies (`*_3x`, 15px) for buttons. Kinds: wood, gold,
  teal, card (parchment), mint (right), rust (wrong), slate, key.
- **Icons** use `<i class="px px-wood">` (26px) or `<i class="px x3 px-bag">` (39px):
  wood, stone, coin, heart (`.full`), bag, book, friends, sound, mute, rune, play,
  next, sun. Hearts in lists use `.hearts.mini` (13px).

Portraits are **not** pixel art: `src/ui/portrait.ts` renders them from the 3D
models, and the dialogue box shows them in a sunk parchment window.

## Surfaces

| Class | Use | Look |
|---|---|---|
| `.plate` | anything floating over the world: HUD, dialogue, toasts, prompts, cooking and fishing panels | `f_plate` frame (24px border, so padding can be small), hard drop shadow (`--px-drop`) |
| `.sheet` | reading windows: rune stone, workbench, Codex, friends, bag | `f_paper` frame (32px border), deeper hard shadow; paragraphs and lists inside use the book face (`--read`) |
| `.bench-right.dark` | the code side of the workbench | dark walnut slate (`--code-bg`), light text |

**Inside a `.plate`, the light-text tokens are re-mapped:** `--cream`, `--cream-2` and
`--cream-3` become `--ink`, `--ink-2` and `--ink-3`. `--gold` and `--rune` deepen
so they read on parchment. A system that styles text with `var(--cream)` therefore
reads correctly in a plate with no extra work. Never hard-code white text in a plate.

## Tokens

- **Parchment:** `--paper` #f9dda6, `--paper-2`, `--paper-3`, `--rule` (dividers).
- **Ink (body text):** `--ink` #3b2014, `--ink-2`, `--ink-3`. Contrast on paper is
  about 11:1, 6:1 and 5:1. Use `--ink-3` only for small labels and hints.
- **Wood:** `--wood`, `--wood-light`, `--wood-dark`, `--bronze`, `--bronze-light`.
- **Frames:** `--px-paper`, `--px-plate`, `--px-wood`, `--px-gold`, `--px-teal`,
  `--px-card`, `--px-mint`, `--px-rust`; `--px-drop` is the hard shadow filter.
- **Selected states:** `--sel` (flat wood) with `--sel-ink` text.
- **Accents:** `--gold`, `--rune` (teal, the magic), `--ember`, `--moss`.
- **Shape:** `--r`, `--r-lg` and `--r-sm` are 0. Pixel art has square corners.
- **Depth:** `--panel-shadow` and `--lift` are an ink outline plus a hard ledge.
  Never a blur.

## Buttons

`.btn` is a pixel wooden plaque (a 3x nine-slice). It hops up 3px on hover and
presses down 3px on click, moving in steps. Kinds only swap the frame
(`--b-frame`), the text colour (`--b-ink`) and its shadow (`--b-shade`):

- default: wood, the main action
- `.gold`: rewards and "go"
- `.rune`: Check, Run, magic (teal)
- `.line`: parchment, the secondary action
- `.quiet`: text-only, no frame
- `.small`: size modifier

`.icon-btn` is a square parchment tile for the HUD, holding a pixel icon. The
title screen uses `.sign`: big square wooden (or `.gold`) plaques with a 3x icon.

## Type

- Pixelify Sans for the game's voice: titles, the HUD, dialogue, buttons. The logo
  is pixel lettering with a hard 6px outline built from `text-shadow`.
- Figtree (`--read`) for long reading inside sheets, JetBrains Mono for code.
- Eyebrows (`.eyebrow`, `.label`) in `--ink-3`.

## Dialogue

`.dialog` has two plates side by side: `.talk` (the speaker's title and hearts, the
text, and the buttons) and `.speaker` (the 3D portrait with a wooden `.who` name
plate under it). The HUD's corner buttons hide while it is open.

## Motion

Motion moves in steps, never smooth easing: things drop or pop in with `steps()`,
the logo bobs in two frames, the Next arrow nudges, and square petals fall on the
title. Everything respects `prefers-reduced-motion`.

## Don't

- Gradients, soft blurred shadows or rounded pill shapes on UI chrome.
- Scaling a pixel image by anything but a whole multiple.
- Pixel-art characters or scenery: the world and the people are 3D.
- Emoji in the UI (use the pixel icons, or the line icons in `src/ui/icons.ts`).
- Landing-page layouts. Game screens are centred, framed and tactile.
