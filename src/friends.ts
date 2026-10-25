import type { Person, Question, Saying } from "./content/types.ts";
import { personById } from "./content/people/index.ts";
import { BUILDINGS } from "./content/index.ts";
import { weatherState } from "./game/weather-state.ts";
import { store, type Bond } from "./state.ts";

// Friendship works like Stardew's: 100 points a heart, ten hearts at most.
// Points come from talking once a day, answering villagers' questions in a
// way that suits them, and building their homes. Nothing ever decays.
export const PER_HEART = 100;
export const MAX_HEARTS = 10;
export const GAIN = {
  /** First chat of the day. */
  talk: 20,
  /** Each part of their building you add. */
  part: 15,
  /** Finishing their building. */
  finished: 100,
  /** Each challenge solved, for Pip. */
  pipPart: 10,
};

export const today = () => new Date().toLocaleDateString("en-CA");

export function bond(id: string): Bond {
  return (store.data.friends[id] ??= { points: 0, met: false, talkedOn: "", asked: [], milestones: 0, heard: 0 });
}

export const hearts = (id: string) => Math.min(MAX_HEARTS, Math.floor(bond(id).points / PER_HEART));

/** 0 stranger (0–1 hearts), 1 friendly (2–4), 2 close (5–7), 3 dear (8–10). */
export const tier = (h: number) => (h >= 8 ? 3 : h >= 5 ? 2 : h >= 2 ? 1 : 0);

export const talkedToday = (id: string) => bond(id).talkedOn === today();

export function meet(id: string) {
  const b = bond(id);
  if (b.met) return;
  b.met = true;
  store.changed();
}

export interface Gain {
  person: Person;
  before: number;
  after: number;
  /** Milestone lines unlocked by this gain, in their voice. */
  milestones: string[];
}

/** Add (or take) friendship points. */
export function befriend(id: string, points: number): Gain | null {
  const person = personById.get(id);
  if (!person || !points) return null;
  const b = bond(id);
  const before = hearts(id);
  b.points = Math.max(0, Math.min(MAX_HEARTS * PER_HEART, b.points + points));
  const after = hearts(id);
  const milestones: string[] = [];
  while (b.milestones < 5 && after >= (b.milestones + 1) * 2) milestones.push(person.milestones[b.milestones++]);
  store.changed();
  return { person, before, after, milestones };
}

export interface Chat {
  /** What they say, in their voice. */
  lines: string[];
  /** A question to ask after the lines, if one is due. */
  question?: Question;
  firstToday: boolean;
}

/**
 * What a villager says when you talk to them. `extra` are their building's
 * chapter lines, mixed in while they fit. The first chat each day earns
 * points and may bring one of their questions.
 */
export function chat(p: Person, extra: string[] = []): Chat {
  const b = bond(p.id);
  const firstToday = !talkedToday(p.id);
  const h = hearts(p.id);
  const pool = candidates(p, extra, h);
  // unheard lines first; when they run out, the pool starts over
  const seen = (b.seen ??= []);
  let fresh = pool.filter((c) => !seen.includes(c.key));
  if (!fresh.length) {
    b.seen = seen.filter((k) => !pool.some((c) => c.key === k));
    fresh = pool;
  }
  // lines that fit the moment win more often than plain ones
  const fitting = fresh.filter((c) => c.fits);
  const from = fitting.length && Math.random() < 0.6 ? fitting : fresh;
  const pick = from[Math.floor(Math.random() * from.length)];
  b.seen!.push(pick.key);
  b.heard++;
  let question: Question | undefined;
  if (firstToday) {
    b.talkedOn = today();
    question = p.questions.find((q) => q.minHearts <= h && !b.asked.includes(q.id));
  }
  store.changed();
  return { lines: pick.lines, question, firstToday };
}

type Moment = NonNullable<Saying["when"]>;

/** The weather and time of day right now, as the moments a Saying can ask for. */
function moments(): Set<Moment> {
  const t = weatherState.timeOfDay;
  const now = new Set<Moment>([weatherState.rain > 0.4 ? "rain" : "clear"]);
  now.add(t >= 0.2 && t < 0.42 ? "morning" : t < 0.72 && t >= 0.42 ? "day" : t >= 0.72 && t < 0.88 ? "evening" : "night");
  return now;
}

const isFinished = (id: string) => {
  const b = BUILDINGS.find((x) => x.id === id);
  return !!b && b.challenges.length > 0 && b.challenges.every((c) => store.isDone(c.id));
};

interface Candidate {
  key: string;
  lines: string[];
  /** Tied to this moment (weather, time, story), so it's preferred while it fits. */
  fits: boolean;
}

/** Everything they could say right now. */
function candidates(p: Person, extra: string[], h: number): Candidate[] {
  const now = moments();
  const out: Candidate[] = p.talk[tier(h)].map((text) => ({ key: text.slice(0, 48), lines: [text], fits: false }));
  if (now.has("rain")) out.push(...p.rain.map((text) => ({ key: text.slice(0, 48), lines: [text], fits: true })));
  if (now.has("evening") || now.has("night")) out.push(...p.evening.map((text) => ({ key: text.slice(0, 48), lines: [text], fits: true })));
  out.push(...extra.map((text) => ({ key: text.slice(0, 48), lines: [text], fits: true })));
  for (const s of p.sayings ?? []) {
    if (h < (s.min ?? 0) || h > (s.max ?? MAX_HEARTS)) continue;
    if (s.when && !now.has(s.when)) continue;
    if (s.after && !isFinished(s.after)) continue;
    if (s.before && isFinished(s.before)) continue;
    if (s.flag && !store.flagged(s.flag)) continue;
    const lines = typeof s.say === "string" ? [s.say] : s.say;
    out.push({ key: lines[0].slice(0, 48), lines, fits: !!(s.when || s.after || (s.flag && s.flag[0] !== "!")) });
  }
  return out;
}

/** Record an answer (each question is asked once) and return the points it earns. */
export function answer(p: Person, q: Question, choice: number): Gain | null {
  const b = bond(p.id);
  if (!b.asked.includes(q.id)) b.asked.push(q.id);
  return befriend(p.id, q.choices[choice].points);
}
