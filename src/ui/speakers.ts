import { BUILDINGS } from "../content/index.ts";

/** A line of dialogue and who says it. */
export interface Line {
  who: string;
  text: string;
}

const MODELS = new Map<string, string>([["Pip", "pip"], ...BUILDINGS.flatMap((b) => (b.villager ? [[b.villager.name, b.villager.model] as [string, string]] : []))]);

/** "Wren: Morning!" is Wren's line; anything else is Pip's. */
export function toLine(s: string): Line {
  const m = /^([A-Z][a-z]+): ([\s\S]*)$/.exec(s);
  if (m && MODELS.has(m[1])) return { who: m[1], text: m[2] };
  return { who: "Pip", text: s };
}

export const toLines = (a: string[]) => a.map(toLine);

/** The model (and portrait) for a speaker. */
export const modelOf = (who: string) => MODELS.get(who) ?? "pip";

export const nameTag = (who: string) => who;
