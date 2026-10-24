# UI: the cozy workshop look

The interface should feel like a cozy indie game (Stardew Valley, Animal Crossing,
Bear and Breakfast), never like a web app. Warm parchment, wood and bronze, brown
ink, soft rounded shapes, buttons you want to press. Everything lives in
`src/style.css` as tokens and a few shared classes; systems add their own CSS in
their folders and build on these.

## Surfaces

| Class | Use | Look |
|---|---|---|
| `.plate` | anything floating over the world: HUD, dialogue, toasts, prompts, cooking and fishing panels | parchment gradient, 3px wood-grain frame (`--frame` as a `border-box` background so the radius holds), bronze bead inside, `--r` 20px, `--panel-shadow` |
| `.sheet` | reading windows: rune stone, workbench, Codex, friends, bag | grainy parchment, 5px wood frame, `--r-lg` 24px, `--lift` |
| `.bench-right.dark` | the code side of the workbench | dark walnut slate (`--code-bg`), light text |

**Inside a `.plate`, the light-text tokens are re-mapped:** `--cream`, `--cream-2` and
`--cream-3` become `--ink`, `--ink-2` and `--ink-3`. `--gold` and `--rune` deepen
so they read on parchment. A system that styles text with `var(--cream)` therefore
reads correctly in a plate with no extra work. Never hard-code white text in a plate.

## Tokens

- **Parchment:** `--paper`, `--paper-2`, `--paper-3`, `--rule` (dividers).
- **Ink (body text):** `--ink` #3b2716, `--ink-2`, `--ink-3`. Contrast on paper is
  11:1, 6:1 and 4.6:1. Use `--ink-3` only for small labels and hints.
- **Wood and bronze:** `--wood`, `--wood-light`, `--wood-dark`, `--bronze`,
  `--bronze-light`, `--frame` (the frame gradient).
- **Selected states:** `--sel` (a wood gradient) with `--sel-ink` text, for
  selected tabs, rows and steps. Never a flat dark fill.
- **Accents:** `--gold`, `--rune` (teal, the magic), `--ember`, `--moss`.
- **Shape:** `--r` 20px, `--r-lg` 24px, `--r-sm` 12px for inner cards.
- **Depth:** `--panel-shadow` and `--lift`. Each is a bronze bead, a top highlight,
  a hard wooden ledge (`0 2px 0`), then two soft drop shadows.

## Buttons

`.btn` is a raised pill: a gradient, a lip underneath (`0 3px 0 var(--b-lip)`),
lifting 2px on hover and pressing 2px in on click, with a springy transition.
Kinds only set colour variables (`--b-top`, `--b-bot`, `--b-lip`, `--b-ink`,
`--b-ring`):

- default: wood, the main action
- `.gold`: rewards and "go"
- `.rune`: Check, Run, magic
- `.line`: parchment with a wood ring, the secondary action
- `.quiet`: text-only, no lift
- `.small`: size modifier

`.icon-btn.plate` is a round parchment coin for the HUD. The title screen uses
`.sign`: big wooden signboards with planks, grain and an icon.

## Type

- Fraunces (with `SOFT` and `WONK` axes) for titles. The logo is SVG text with
  a thick brown outline and a dark drop, `paint-order: stroke`.
- Figtree for UI text, JetBrains Mono for code.
- Small caps eyebrows (`.eyebrow`, `.label`) in `--ink-3` or deep gold.
- Speaker names sit on a wooden tab (`.dialog .who`).

## Motion

Things pop in with a little overshoot (`popIn`, `sheetIn`), the logo bobs, and
petals drift on the title. Everything respects `prefers-reduced-motion`.

## Don't

- Flat grey or black boxes, stark white text, thin 1px borders as the only frame.
- Emoji in the UI (use the line icons in `src/ui/icons.ts`).
- Landing-page layouts: left-aligned hero text, tagline paragraphs, rows of tiny
  hints. Game screens are centred, framed and tactile.
