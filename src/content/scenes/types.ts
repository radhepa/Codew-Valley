// Heart-event scenes (HEARTS.md): plain data, played by src/scenes/engine.ts.
// A scene is a list of steps run one after another. Positions are world
// metres on the ground: [x, z], or [x, y, z] for the camera and props.

/** Who can be moved in a scene: the player, Pip, or a villager by model id ("innkeeper"). */
export type Actor = string;

/** A point on the ground, or an actor to stand by / look at. */
export type Mark = [number, number] | Actor;

/** Emote bubbles, drawn as field-journal line art (src/scenes/emote.ts). */
export type Emote = "!" | "?" | "heart" | "..." | "note" | "sweat";

/** "bram.song" holds when that flag is set at all; "bram.song=sang" when it has that value. */
export type FlagSpec = string;

export type Step =
  /** Fade the screen to (out) or from (in) the scene's dark. */
  | { fade: "in" | "out"; t?: number }
  /** Letterbox bars on or off. */
  | { bars: boolean }
  /**
   * Move the camera to a shot over t seconds (eased; 0 cuts). With `follow`, pos and look
   * are offsets from that actor and the shot keeps following them.
   */
  | { cam: { pos: [number, number, number]; look: [number, number, number]; follow?: Actor }; t?: number; wait?: boolean }
  /** Put an actor on a mark at once (and turn them, radians, 0 faces the camera). */
  | { place: Actor; at: [number, number]; facing?: number }
  /** Walk to a mark. pace: "slow" | "walk" | "run" (default walk). wait: false lets the next step start. */
  | { walk: Actor; to: Mark; pace?: "slow" | "walk" | "run"; wait?: boolean; stop?: number }
  /** Turn to face a point or another actor. */
  | { face: Actor; to: Mark }
  /** A one-shot animation (wave, happy, celebrate, react, nod, laugh, wipe, give, sigh, ...). */
  | { anim: Actor; name: string; wait?: boolean | number }
  /** Sit down where they stand (on a bench or chair `seat` metres high, default 0.5), or stand up. */
  | { sit: Actor; stand?: boolean; seat?: number }
  /** A looping pose: talk, idle, cast. */
  | { loop: Actor; name: "talk" | "idle" | "cast" }
  /** An emote bubble above an actor's head for t seconds (default 1.6). */
  | { emote: Actor; kind: Emote; t?: number; wait?: boolean }
  /** Dialogue through the game's own dialogue box. "Name: text"; a line with no name is Pip's. */
  | { say: string[] }
  /** The last line asks, and each option sets the flag; its own lines follow. */
  | { choice: { ask: string[]; flag: string; options: { label: string; value: string; then: Step[] }[] } }
  /** Steps that only play when a flag holds, with an optional otherwise. */
  | { if: FlagSpec; then: Step[]; else?: Step[] }
  | { flag: string; value?: string }
  | { wait: number }
  /** Music: hush (soften the music), back (bring it back), stage / finish (a sting). */
  | { music: "hush" | "back" | "stage" | "finish" }
  /** A hummed tune from the synth (src/scenes/hum.ts); with "duet" a second voice joins. */
  | { hum: string; duet?: boolean; wait?: boolean }
  /** A sound effect: a name from the game's sfx, or "thump", "paper", "chime", "cheer", "wheels". */
  | { sound: string }
  /** Show or hide one of the scene's props, optionally moving it (over t seconds, eased). */
  | { prop: string; show?: boolean; at?: [number, number, number]; rot?: number; t?: number; wait?: boolean; on?: Actor }
  /** Dust, sparkles or steam at a point. */
  | { fx: "dust" | "sparkles" | "steam"; at: [number, number, number] }
  /**
   * A personal rune (an optional Python task). The first rune id whose building is finished
   * is offered; solved plays `solved`, closing it (or no rune ready) plays `skipped`.
   */
  | { rune: string[]; solved: Step[]; skipped: Step[] }
  /** Give the scene's keepsake now (it is given at the end anyway). */
  | { keepsake: true }
  /** A little friendship for the moment (points). */
  | { befriend: Actor; points: number };

/** A prop the scene can show: a kind from src/scenes/props.ts, where it stands, and a turn. */
export interface PropDef {
  kind: string;
  at: [number, number, number];
  rot?: number;
  /** Shown from the start (default: hidden until a prop step shows it). */
  shown?: boolean;
  scale?: number;
}

/** When a scene plays: the first time all of these hold. */
export interface Conditions {
  /** At least this many hearts with the scene's villager. */
  hearts: number;
  /** The player walks into this circle on the ground: [x, z, radius]. */
  area: [number, number, number];
  /** Time of day: "morning", "day", "evening", "night", or [from, to] as 0..1 (0.5 is noon). */
  time?: string[] | [number, number];
  weather?: "rain" | "clear";
  /** Buildings that must be finished. */
  built?: string[];
  /** Flags that must hold, and scenes that must have played first. */
  flags?: FlagSpec[];
  after?: string[];
}

/** Something to keep from a scene, shown on the Keepsakes shelf in the Friends journal. */
export interface Keepsake {
  id: string;
  name: string;
  /** One line in the villager's voice or the founder's journal. */
  note: string;
  /** Line-art drawing: ledger, song, string, flower, seat. */
  icon: string;
}

export interface Scene {
  id: string;
  title: string;
  /** The villager it belongs to (model id); hearts are counted with them. */
  who: Actor;
  when: Conditions;
  /** A time of day (0..1) the dev hook sets before playing, so the light is right. */
  devTime?: number;
  /** Where actors stand when the scene opens (behind the first fade). */
  cast: Record<Actor, [number, number, number?]>;
  props?: Record<string, PropDef>;
  steps: Step[];
  keepsake?: Keepsake;
}
