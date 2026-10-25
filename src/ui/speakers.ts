import { PEOPLE } from "../content/people/index.ts";

/** A line of dialogue and who says it. */
export interface Line {
  who: string;
  text: string;
}

// Every villager with a profile can speak in story lines, including those without a
// building of their own (Lord Vane).
const MODELS = new Map<string, string>(PEOPLE.map((p) => [p.name, p.id]));

/** "Wren: Morning!" is Wren's line; anything else is Pip's. */
export function toLine(s: string): Line {
  const m = /^([A-Z][a-z]+): ([\s\S]*)$/.exec(s);
  if (m && MODELS.has(m[1])) return { who: m[1], text: m[2] };
  return { who: "Pip", text: s };
}

export const toLines = (a: string[]) => a.map(toLine);

/** The model (and portrait) for a speaker; a named speaker with no model (Bram's old crew, heard off-screen) is a "voice". */
export const modelOf = (who: string) => MODELS.get(who) ?? (who && who !== "Pip" ? "voice" : "pip");

export const nameTag = (who: string) => who;
