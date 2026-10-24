import { store } from "../../state.ts";
import { BUILDINGS } from "../../content/index.ts";
import { lifeSave } from "../save.ts";
import { clock } from "../clock.ts";
import type { BuildingId, Template } from "./build.ts";
import { TEMPLATES } from "./templates/index.ts";
import type { Rng } from "./rng.ts";

// What the founder remembers: one entry per learned building's Python, Leitner style. A topic
// sits in a box from 0 (shaky) to 5 (solid); the box sets how many valley days it stays fresh
// before it is due again. Answers move it up or down a box. Nothing here is ever shown as a
// score: the Sharpness page draws it as plants that wilt.

/** Days a topic stays fresh in each box. */
export const INTERVAL = [1, 2, 4, 7, 12, 20];

export interface TopicMemory {
  box: number;
  /** Valley day it was last practised (or learned). */
  last: number;
  seen: number;
  solved: number;
}

export interface Daily {
  day: number;
  template: string;
  seed: number;
  done: boolean;
  /** Basket size and crops, rolled with the question (hints shrink it when it's handed over). */
  basket: string[];
}

export interface ReviewSave {
  /** Per save, so two players' days differ. */
  salt: number;
  topics: Partial<Record<BuildingId, TopicMemory>>;
  daily: Daily | null;
  /** Templates asked lately, newest last, so the same one doesn't come round too soon. */
  recent: string[];
  /** Extra practice runs today (the counter seeds the next one). */
  extra: { day: number; n: number };
  /** Daily questions answered, all time (never a streak). */
  answered: number;
}

export const reviewSave = () =>
  lifeSave<ReviewSave>("review", () => ({
    salt: Math.floor(Math.random() * 2 ** 31),
    topics: {},
    daily: null,
    recent: [],
    extra: { day: 0, n: 0 },
    answered: 0,
  }));

export const ORDER = BUILDINGS.map((b) => b.id as BuildingId);

/** Buildings whose Python the founder has learned: the finished ones. */
export function learned(): BuildingId[] {
  return BUILDINGS.filter((b) => b.challenges.length > 0 && b.challenges.every((c) => store.isDone(c.id))).map((b) => b.id as BuildingId);
}

/** Give every newly learned topic its memory: fresh from the course, in box 1. */
export function syncLearned() {
  const s = reviewSave();
  let changed = false;
  for (const id of learned())
    if (!s.topics[id]) {
      s.topics[id] = { box: 1, last: clock.day, seen: 0, solved: 0 };
      changed = true;
    }
  if (changed) store.changed();
}

/** 0 just practised, 1 due, 2 and up wilting. */
export function staleness(m: TopicMemory, day = clock.day) {
  return Math.max(0, day - m.last) / INTERVAL[Math.min(m.box, INTERVAL.length - 1)];
}

export interface Answer {
  solved: boolean;
  /** Hints opened. */
  hints: number;
  /** Checks that didn't pass. */
  fails: number;
}

/** Fold an answer into the memory of each topic it practised. */
export function remember(topics: readonly BuildingId[], a: Answer) {
  if (!a.solved && a.fails === 0) return; // opened and closed: nothing practised
  const s = reviewSave();
  for (const id of topics) {
    const m = (s.topics[id] ??= { box: 1, last: clock.day, seen: 0, solved: 0 });
    m.seen++;
    m.last = clock.day;
    if (a.solved) {
      m.solved++;
      if (a.hints === 0 && a.fails <= 2) m.box = Math.min(5, m.box + 1);
      else if (a.hints >= 2 || a.fails >= 6) m.box = Math.max(0, m.box - 1);
    } else m.box = Math.max(0, m.box - 1);
  }
  store.changed();
}

/** Topics the course leaves to fade (SYLLABUS review): leaned on a little more. */
const GAPS: Partial<Record<BuildingId, number>> = { dock: 0.7, library: 0.7, townhall: 0.7, forge: 0.4 };

function need(id: BuildingId, day: number, stretch: boolean) {
  const m = reviewSave().topics[id];
  if (!m) return 1;
  let n = 0.4 + Math.min(3, staleness(m, day)) + (5 - m.box) * 0.25 + (GAPS[id] ?? 0);
  // functions fade while the town hall and clock tower are being built
  if (id === "forge" && stretch) n += 0.8;
  return n;
}

export interface PickOptions {
  rng: Rng;
  /** Building ids to favour (a fishing minigame might lean on "dock"). */
  lean?: readonly string[];
  difficulty?: 1 | 2 | 3;
  /** true: only mixed questions; false: only single-topic ones; unset: by progress. */
  mixed?: boolean;
  /** Template ids to avoid if anything else fits. */
  avoid?: readonly string[];
}

/** Choose a template the founder can do, preferring what is due or weak. */
export function pickTemplate(o: PickOptions): Template | null {
  const known = learned();
  const eligible = TEMPLATES.filter((t) => t.topics.every((id) => known.includes(id)));
  if (!eligible.length) return null;
  const day = clock.day;
  const courseDone = known.length === ORDER.length;
  const building = ORDER.find((id) => !known.includes(id));
  const stretch = building === "townhall" || building === "clocktower";

  // early mostly single-topic; about a third mixed after five buildings; mostly mixed after the course
  const share = courseDone ? 0.75 : known.length >= 5 ? 0.33 : 0.12;
  const wantMixed = o.mixed ?? o.rng() < share;
  let pool = eligible.filter((t) => t.topics.length > 1 === wantMixed);
  if (!pool.length) pool = eligible;

  const weights = pool.map((t) => {
    const needs = t.topics.map((id) => need(id, day, stretch));
    let w = Math.max(...needs) * 0.6 + (needs.reduce((a, b) => a + b, 0) / needs.length) * 0.4;
    // difficulty: what the topics' boxes can bear, or what was asked for
    const boxes = t.topics.map((id) => reviewSave().topics[id]?.box ?? 1);
    const box = boxes.reduce((a, b) => a + b, 0) / boxes.length;
    const target = o.difficulty ?? (courseDone ? (box >= 3 ? 3 : 2) : box < 1.5 ? 1 : box < 3.5 ? 2 : 3);
    w /= 1 + Math.abs(t.difficulty - target) * 1.2;
    if (o.lean?.some((id) => t.topics.includes(id as BuildingId))) w *= 3;
    if (o.avoid?.includes(t.id)) w *= 0.12;
    return w;
  });
  let roll = o.rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((roll -= weights[i]) <= 0) return pool[i];
  return pool[pool.length - 1];
}
