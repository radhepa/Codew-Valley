import type { Cost } from "./content/types.ts";

export const GAME_TITLE = "Runes & Serpents";
const SAVE_KEY = "pyvillage.save.v1";

export interface SaveData {
  wood: number;
  stone: number;
  /** Ids of solved challenges, in the order they were solved. */
  done: string[];
  /** The learner's latest code for each challenge. */
  drafts: Record<string, string>;
  /** How many hints have been revealed per challenge. */
  hints: Record<string, number>;
  /** Quiz answered correctly, per challenge. */
  quiz: Record<string, boolean>;
  introSeen: boolean;
  /** Buildings whose chapter opening has been shown. */
  opened: string[];
  /** Friendship with each villager, by person id (see friends.ts). */
  friends: Record<string, Bond>;
  /** The bag: how many of each item (src/life/items.ts) the founder carries. */
  items: Record<string, number>;
  /** Each village-life system's own save, by system id (src/life/save.ts). */
  life: Record<string, unknown>;
  /** Heart-event scenes already played (src/scenes), and the choices made in them. */
  scenes: string[];
  flags: Record<string, string>;
  /** Keepsakes from heart events, by id, for the Friends journal's shelf. */
  keepsakes: string[];
}

export interface Bond {
  points: number;
  met: boolean;
  /** Local date (yyyy-mm-dd) of the last chat; the first chat each day earns points. */
  talkedOn: string;
  /** Question ids already asked. */
  asked: string[];
  /** Milestone lines already said (one each at 2, 4, 6, 8 and 10 hearts). */
  milestones: number;
  /** How many lines they've said, to cycle through them. */
  heard: number;
  /** Lines said since their pool last ran dry, so nothing repeats too soon (friends.ts). */
  seen?: string[];
  /** Local date of the last gift (one gift a day). */
  giftedOn?: string;
  /** Item ids given so far, for the journal. */
  gifts?: string[];
}

const fresh = (): SaveData => ({ wood: 0, stone: 0, done: [], drafts: {}, hints: {}, quiz: {}, introSeen: false, opened: [], friends: {}, items: {}, life: {}, scenes: [], flags: {}, keepsakes: [] });

function load(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* private window or corrupt save: start fresh */
  }
  return fresh();
}

type Listener = () => void;

/** The whole save, plus a change signal the HUD and world listen to. */
class Store {
  data: SaveData = load();
  private listeners = new Set<Listener>();
  private timer = 0;

  get hasSave() {
    return this.data.introSeen;
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  changed() {
    for (const fn of this.listeners) fn();
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.save(), 250);
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      /* storage full or blocked: progress lives for this session only */
    }
  }

  reset() {
    this.data = fresh();
    this.save();
    this.changed();
  }

  add(kind: "wood" | "stone", n: number) {
    this.data[kind] += n;
    this.changed();
  }

  canAfford(cost: Cost) {
    return this.data.wood >= cost.wood && this.data.stone >= cost.stone;
  }

  /** "bram.song" holds when the flag is set, "bram.song=sang" when it has that value, "!bram.song" while it isn't set. */
  flagged(spec: string): boolean {
    if (spec.startsWith("!")) return !this.flagged(spec.slice(1));
    const [k, v] = spec.split("=");
    const got = this.data.flags[k];
    return v === undefined ? got !== undefined : got === v;
  }

  isDone(id: string) {
    return this.data.done.includes(id);
  }

  complete(id: string, cost: Cost) {
    if (this.isDone(id)) return;
    this.data.wood -= cost.wood;
    this.data.stone -= cost.stone;
    this.data.done.push(id);
    this.changed();
  }
}

export const store = new Store();
