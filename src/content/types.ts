// Content shapes. Everything here is plain data so the Node content tests
// (scripts/test-content.mjs) can import it and verify every example, quiz and
// challenge against real Python.

/**
 * One block of a Codex page. Text supports `inline code` and **bold**.
 * A `code` block with `out` must print exactly that; with `err` it must raise
 * that exception type. Both are checked by the content tests.
 */
export type CodexBlock =
  | { h: string }
  | { p: string }
  | { tip: string }
  | { code: string; out?: string; err?: string };

export interface CodexPage {
  id: string;
  title: string;
  /** One-line summary shown in the Codex index and search. */
  summary: string;
  blocks: CodexBlock[];
}

export interface Quiz {
  /** Program whose behaviour the learner predicts. */
  code: string;
  question: string;
  options: string[];
  /** Index of the right option. Its text must equal the program's output, "(nothing)" for none, or the error type when it raises. */
  answer: number;
  why: string;
}

export interface Cost {
  wood: number;
  stone: number;
}

export interface Challenge {
  id: string;
  /** The building part this challenge adds, e.g. "Foundation stones". */
  part: string;
  title: string;
  /** The Python idea this challenge practises, shown on the rune stone and workbench (e.g. "while loops"). */
  topic: string;
  cost: Cost;
  /** Story lines before the challenge (Pip, or "Name: …" for a villager). */
  intro: string[];
  /** Codex pages; the first is the lesson shown in the Learn tab. */
  codex: string[];
  quiz: Quiz;
  /** The task as a short checklist. */
  task: string[];
  starter: string;
  /**
   * Files waiting in the program's folder before it runs (name → contents),
   * for challenges that read files. Shown read-only in the workbench, and put
   * back fresh for every run and every rerun the checks make.
   */
  files?: Record<string, string>;
  /** Python checks run after the learner's program (see python/helper.ts _pg_grade). */
  tests: string;
  hints: [string, string, string];
  /** A reference answer; must pass the checks. */
  solution: string;
  /** Plausible mistakes; each must fail the checks. */
  wrong: string[];
  /** Line once the part is built (Pip, or "Name: …"). */
  done: string;
}

/**
 * A villager. Story lines anywhere in the content are spoken by Pip unless
 * they start with the villager's name and a colon, e.g. "Wren: Morning!".
 */
export interface Villager {
  name: string;
  /** Model file in public/models (ART.md), also used for the portrait. */
  model: string;
  /** "start": arrives when the chapter begins; "end": when the building is finished. */
  arrives: "start" | "end";
}

/** A one-time question a villager asks; how you answer moves your friendship. */
export interface Question {
  id: string;
  /** Asked only once you have at least this many hearts with them. */
  minHearts: number;
  ask: string;
  choices: { label: string; reply: string; points: number }[];
}

/**
 * Who a villager is: personality, how they talk at each friendship tier, and
 * the questions they ask. Lines are in their own voice (no "Name:" prefix).
 */
export interface Person {
  /** Model id, also the key in the save (e.g. "innkeeper"). */
  id: string;
  name: string;
  /** "Innkeeper of the Sleepy Serpent" */
  title: string;
  /** Building they move in with; none for Pip. */
  home?: string;
  /** Three or four short traits for the Friends journal. */
  traits: string[];
  /** How they talk, for writers. Not shown in the game. */
  voice: string;
  /** Revealed in the journal at 2 hearts (and the base for gifts later). */
  likes: string[];
  /** Revealed at 4 hearts. */
  dislikes: string[];
  /** Their personal want, revealed at 6 hearts; heart events grow from it. */
  want: string;
  /** Everyday lines by friendship tier: 0–1 hearts, 2–4, 5–7, 8–10. */
  talk: [string[], string[], string[], string[]];
  /** Lines for rainy weather and for evening, mixed in when they fit. */
  rain: string[];
  evening: string[];
  questions: Question[];
  /** Said once on reaching 2, 4, 6, 8 and 10 hearts (until heart events exist). */
  milestones: [string, string, string, string, string];
}

export interface Building {
  id: string;
  name: string;
  blurb: string;
  /** Who moves in with this building (none yet for some). */
  villager?: Villager;
  /** Lines when the chapter begins (after the previous building is finished). */
  opening: string[];
  /** Lines when the last part is built. */
  finale: string[];
  /** What the villager says when you talk to them during the chapter. */
  chatDuring: string[];
  /** What the villager says once their building is finished. */
  chatAfter: string[];
  /** Ysolde's Chronicle page, shown once the building is finished (STORY.md). */
  chronicle?: Chronicle;
  challenges: Challenge[];
}

/** A page of Ysolde's Chronicle: one per building, numbered by building order. */
export interface Chronicle {
  title: string;
  /** Paragraphs in Ysolde's own voice. Supports **bold** and *italics*. */
  text: string[];
}
