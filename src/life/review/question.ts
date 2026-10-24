import { build, type Made, type Template } from "./build.ts";
import { makeRng } from "./rng.ts";
import { TEMPLATES } from "./templates/index.ts";

// A question: one template built with one seed. Plain data (the content tests import it).

export interface Question {
  /** The template's id and the seed: together they rebuild the same question. */
  template: string;
  seed: number;
  topics: Template["topics"];
  difficulty: 1 | 2 | 3;
  /** More than one building's Python. */
  mixed: boolean;
  made: Made;
}

export const templateById = new Map(TEMPLATES.map((t) => [t.id, t]));

/** Build template t with this seed. The same seed always gives the same question. */
export function makeQuestion(t: Template, seed: number): Question {
  return { template: t.id, seed, topics: t.topics, difficulty: t.difficulty, mixed: t.topics.length > 1, made: build(t.make(makeRng(seed))) };
}

export { TEMPLATES };
