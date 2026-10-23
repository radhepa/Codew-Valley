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
  cost: Cost;
  /** Story lines before the challenge (Pip, or "Name: …" for a villager). */
  intro: string[];
  /** Codex pages; the first is the lesson shown in the Learn tab. */
  codex: string[];
  quiz: Quiz;
  /** The task as a short checklist. */
  task: string[];
  starter: string;
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
  challenges: Challenge[];
}
