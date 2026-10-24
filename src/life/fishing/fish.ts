// Who bites where and when: the pond's rules, as plain data (no DOM, no three.js), so they're
// easy to read and tune. A bite is drawn from the weights of everything biting at that spot,
// at that time of day, in that weather. Ids match items.ts.

export type FishSpot = "pier" | "shore";
export type TimeBand = "dawn" | "day" | "dusk" | "night";

export interface FishInfo {
  id: string;
  /** Caught size range in centimetres (a coin is its width). */
  size: [number, number];
  /** How hard it fights the reel, 0 (a boot: dead weight) to 1 (a pike). */
  fight: number;
  /** How rare it is, for the reveal: 0 common, 1 uncommon, 2 rare. */
  rarity: 0 | 1 | 2;
  /** Chance weight by spot and time; rain multiplies it. 0 = never. */
  weight: Record<FishSpot, Partial<Record<TimeBand, number>>>;
  rain?: number;
  /** Only bites when it isn't raining (the koi likes the sun on the water). */
  dryOnly?: boolean;
  /** What the journal says before it's caught: Marlo's tip. */
  hint: string;
}

const ALL = (w: number): Partial<Record<TimeBand, number>> => ({ dawn: w, day: w, dusk: w, night: w });

export const FISH: FishInfo[] = [
  {
    id: "minnow", size: [4, 9], fight: 0.08, rarity: 0,
    weight: { pier: { dawn: 16, day: 16, dusk: 14, night: 8 }, shore: { dawn: 26, day: 28, dusk: 22, night: 10 } },
    hint: "Marlo: Little silver ones. They'll bite at anything, any time. ...Everyone's first.",
  },
  {
    id: "perch", size: [14, 32], fight: 0.3, rarity: 0,
    weight: { pier: { dawn: 9, day: 22, dusk: 10 }, shore: { dawn: 8, day: 18, dusk: 8 } },
    hint: "Marlo: Stripy fellows. They like a bright day and a bit of company.",
  },
  {
    id: "brown_trout", size: [22, 48], fight: 0.5, rarity: 1,
    weight: { pier: { dawn: 24, day: 6, dusk: 5 }, shore: { dawn: 18, day: 4, dusk: 4 } },
    rain: 2.6,
    hint: "Marlo: Trout want the cool of the morning. Or rain. They're fond of rain.",
  },
  {
    id: "carp", size: [30, 72], fight: 0.62, rarity: 1,
    weight: { pier: {}, shore: { day: 12, dusk: 16 } },
    hint: "Marlo: Old carp nose about in the shallows. From the shore, warm afternoons into evening.",
  },
  {
    id: "pike", size: [50, 105], fight: 0.92, rarity: 2,
    weight: { pier: { dawn: 4.5, day: 1.2, dusk: 6 }, shore: {} },
    rain: 1.6,
    hint: "Marlo: Something long and cross lives in the deep water off the pier head. Dusk, if you're brave.",
  },
  {
    id: "eel", size: [40, 90], fight: 0.7, rarity: 1,
    weight: { pier: { night: 20, dusk: 3 }, shore: { night: 16, dusk: 2 } },
    rain: 1.8,
    hint: "Marlo: Eels come out when the lanterns do. Hold on tight.",
  },
  {
    id: "crayfish", size: [7, 14], fight: 0.22, rarity: 0,
    weight: { pier: {}, shore: { dawn: 3, day: 2, dusk: 6, night: 18 } },
    rain: 4,
    hint: "Marlo: Crayfish creep along the shore after dark. And in the rain. Mind your fingers.",
  },
  {
    id: "golden_koi", size: [35, 60], fight: 0.78, rarity: 2,
    weight: { pier: { dawn: 0.8, day: 1.6, dusk: 0.8 }, shore: { dawn: 0.6, day: 1.2, dusk: 0.6 } },
    dryOnly: true,
    hint: "Marlo: Gran swore she saw a fish made of gold in her lake. Sunny days, she said. ...Daft story.",
  },
  {
    id: "old_boot", size: [24, 30], fight: 0, rarity: 0,
    weight: { pier: ALL(4.5), shore: ALL(4) },
    hint: "Marlo: Not everything that bites is a fish. Something down there's lost its footwear.",
  },
  {
    id: "willowmere_coin", size: [3, 4], fight: 0, rarity: 2,
    weight: { pier: { dawn: 2.2, day: 2.2, dusk: 3, night: 3.4 }, shore: ALL(0.7) },
    hint: "Marlo: There was a town under this water once, Gran said. Fish off the pier long enough and it might pay you back.",
  },
];

export const fishInfo = (id: string) => FISH.find((f) => f.id === id);

/** Morning from 4:48 to 7:40, day to 5:17 pm, evening to 8:10 pm, then night (clock.timeOfDay: 0.5 is noon). */
export function timeBand(tod: number): TimeBand {
  if (tod >= 0.2 && tod < 0.32) return "dawn";
  if (tod >= 0.32 && tod < 0.72) return "day";
  if (tod >= 0.72 && tod < 0.84) return "dusk";
  return "night";
}

export const BAND_NAME: Record<TimeBand, string> = { dawn: "Morning", day: "Daytime", dusk: "Evening", night: "Night" };
export const SPOT_NAME: Record<FishSpot, string> = { pier: "Pier head", shore: "Shore" };

/** Everything that can bite here right now, with its chance weight. */
export function biting(spot: FishSpot, tod: number, raining: boolean): { id: string; w: number }[] {
  const band = timeBand(tod);
  const out: { id: string; w: number }[] = [];
  for (const f of FISH) {
    if (f.dryOnly && raining) continue;
    let w = f.weight[spot][band] ?? 0;
    // rain wakes some fish up at any hour they'd normally sleep through
    if (raining && f.rain && w === 0 && band !== "night" && (f.weight[spot].dawn ?? 0) > 0) w = (f.weight[spot].dawn ?? 0) * 0.35;
    if (raining && f.rain) w *= f.rain;
    if (w > 0) out.push({ id: f.id, w });
  }
  return out;
}

/** Draw what bites. rnd() is in [0, 1). */
export function pickCatch(spot: FishSpot, tod: number, raining: boolean, rnd: () => number = Math.random): string {
  const list = biting(spot, tod, raining);
  const total = list.reduce((a, b) => a + b.w, 0);
  let r = rnd() * total;
  for (const b of list) {
    r -= b.w;
    if (r <= 0) return b.id;
  }
  return list[list.length - 1]?.id ?? "minnow";
}

/** A size in cm (one decimal), leaning toward the middle; big ones are rarer. */
export function rollSize(id: string, rnd: () => number = Math.random): number {
  const f = fishInfo(id);
  if (!f) return 10;
  const [a, b] = f.size;
  const t = (rnd() + rnd() + rnd() * rnd()) / 2.25;
  return Math.round((a + (b - a) * Math.min(1, t)) * 10) / 10;
}

/** Where and when a fish bites, for the journal. */
export function habits(id: string): { spots: FishSpot[]; bands: TimeBand[]; rain: "better" | "never" | null } {
  const f = fishInfo(id)!;
  const spots = (["pier", "shore"] as FishSpot[]).filter((s) => Object.values(f.weight[s]).some((w) => (w ?? 0) > 0));
  const bands = (["dawn", "day", "dusk", "night"] as TimeBand[]).filter((b) => spots.some((s) => (f.weight[s][b] ?? 0) > 0));
  return { spots, bands, rain: f.dryOnly ? "never" : f.rain ? "better" : null };
}
