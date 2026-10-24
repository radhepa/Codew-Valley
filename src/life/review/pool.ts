import { store } from "../../state.ts";
import { codexById, PAGES_BY_BUILDING } from "../../content/codex.ts";
import type { Practice } from "../../ui/workbench.ts";
import type { LifeApp, LifeRune } from "../context.ts";
import { lifeSave } from "../save.ts";
import type { BuildingId } from "./build.ts";
import { makeQuestion, templateById, type Question } from "./question.ts";
import { makeRng } from "./rng.ts";
import { pickTemplate, remember, reviewSave, syncLearned, type Answer } from "./memory.ts";

// The question pool: the one door other systems use (README.md). Fishing and cooking can draw
// a question here for a minigame; Wren's daily question goes through the same door.

export type { Question, Answer };

export interface DrawOptions {
  /** Building ids to favour, e.g. ["dock"] by the pond. */
  lean?: string[];
  difficulty?: 1 | 2 | 3;
  /** true only mixed, false only single-topic, unset by the founder's progress. */
  mixed?: boolean;
  /** A seeded rng (makeRng(seedOf(...)) from ./rng.ts) makes the draw repeatable. */
  rng?: () => number;
}

/** A question the founder can do now, favouring what's due or weak; null until the mill is finished. */
export function drawQuestion(o: DrawOptions = {}): Question | null {
  syncLearned();
  const rng = makeRng(Math.floor((o.rng ?? Math.random)() * 2 ** 32));
  const t = pickTemplate({ rng, lean: o.lean, difficulty: o.difficulty, mixed: o.mixed, avoid: reviewSave().recent });
  return t ? makeQuestion(t, rng.int(1, 2 ** 31 - 1)) : null;
}

/** Rebuild a saved question from its template id and seed. */
export function questionById(template: string, seed: number): Question | null {
  const t = templateById.get(template);
  return t ? makeQuestion(t, seed) : null;
}

/** Fold an answer into the founder's memory (openQuestion does this for you). */
export function recordAnswer(q: Question, a: Answer) {
  remember(q.topics, a);
  const s = reviewSave();
  s.recent = [...s.recent.filter((id) => id !== q.template), q.template].slice(-8);
  store.changed();
}

/** Short names for each building's Python, for cards and the Sharpness page. */
export const TOPIC_NAME: Record<BuildingId, string> = {
  tavern: "Words and numbers",
  mill: "Choices",
  dock: "While loops",
  market: "Lists",
  bakery: "For loops",
  forge: "Functions",
  library: "Dictionaries",
  apothecary: "Text, tuples and sets",
  townhall: "Files and CSV",
  clocktower: "Modules and comprehensions",
  guildhall: "Classes",
  observatory: "Searching, sorting, recursion",
};

const FIRST_PAGE: Partial<Record<BuildingId, string>> = { tavern: "fstrings", mill: "if" };
function lessonPages(q: Question) {
  const asked = (q.made.codex ?? []).filter((id) => codexById.has(id));
  const own = q.topics.map((id) => FIRST_PAGE[id] ?? PAGES_BY_BUILDING[id]?.[0]?.id).filter((id): id is string => !!id && codexById.has(id));
  return [...new Set([...asked, ...own])];
}

export interface OpenOptions {
  /** Workbench id (keeps the draft and hints for this question); default from template and seed. */
  id?: string;
  /** Eyebrow in the workbench header, e.g. "Wren's question". */
  eyebrow?: string;
  /** The button once it's solved. */
  action?: string;
  /** Story-tab lines ("Wren: …", or Pip's). */
  intro?: string[];
}

/** The question as a village rune the workbench can open. */
export function toRune(q: Question, o: OpenOptions & { onCheck?(passed: boolean): void; onClose?(): void } = {}) {
  const m = q.made;
  const practice: Practice = {
    eyebrow: o.eyebrow ?? "Practice",
    action: o.action ?? "Done",
    onCheck: (p) => o.onCheck?.(p),
    onClose: () => o.onClose?.(),
  };
  const rune: LifeRune & { practice: Practice } = {
    id: o.id ?? `review-${q.template}-${q.seed}`,
    part: q.mixed ? "Mixed practice" : TOPIC_NAME[q.topics[0]],
    title: m.title,
    topic: m.topic,
    cost: { wood: 0, stone: 0 },
    intro: o.intro ?? m.intro ?? [],
    codex: lessonPages(q),
    // practice questions have no quick check; the workbench hides the tab
    quiz: { code: "", question: "", options: [], answer: 0, why: "" },
    task: m.task,
    starter: m.starter,
    files: m.files,
    tests: m.tests,
    hints: m.hints,
    solution: m.solution,
    wrong: m.wrong,
    done: "",
    requires: q.topics[q.topics.length - 1],
    reward: "",
    practice,
  };
  return rune;
}

/** Drafts and hint counts of practice questions that are no longer open anywhere. */
function tidy(keep: string[]) {
  const d = store.data;
  for (const k of Object.keys(d.drafts)) if (k.startsWith("review-") && !keep.includes(k)) delete d.drafts[k];
  for (const k of Object.keys(d.hints)) if (k.startsWith("review-") && !keep.includes(k)) delete d.hints[k];
  const runes = lifeSave("runes", () => ({ solved: [] as string[] }));
  runes.solved = runes.solved.filter((id) => !id.startsWith("review-"));
}

export interface Result extends Answer {
  /** The workbench id it was opened under. */
  id: string;
}

/**
 * Open a question in the workbench. done() runs when the player solves it (after they press the
 * solved button) or closes it unsolved; the answer is already in the memory by then.
 */
export function openQuestion(app: LifeApp, q: Question, done: (r: Result) => void, o: OpenOptions = {}) {
  let fails = 0;
  let finished = false;
  const id = o.id ?? `review-${q.template}-${q.seed}`;
  const daily = reviewSave().daily;
  tidy([id, ...(daily ? [`review-day-${daily.day}`] : [])]);
  const end = (solved: boolean) => {
    if (finished) return;
    finished = true;
    const r: Result = { id, solved, hints: store.data.hints[id] ?? 0, fails };
    recordAnswer(q, r);
    tidy(daily && id === `review-day-${daily.day}` && !solved ? [id] : []);
    done(r);
  };
  const rune = toRune(q, { ...o, id, onCheck: (p) => !p && fails++, onClose: () => setTimeout(() => end(false), 0) });
  app.openRune(rune, () => end(true));
}
