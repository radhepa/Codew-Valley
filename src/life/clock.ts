import { store } from "../state.ts";
import { weatherState } from "../game/weather-state.ts";
import { lifeSave } from "./save.ts";

// The village calendar: a day counter that ticks at dawn of the valley's day cycle
// (weather.ts: one day is 24 real minutes). Crops grow by it; anything else that needs
// "once a day" can listen too. The count is saved, so it survives a reload (the time of
// day itself starts fresh each session).

const DAWN = 0.25; // 6 am
const listeners = new Set<(day: number) => void>();
let last = -1;

const clockSave = () => lifeSave("clock", () => ({ day: 1 }));

export const clock = {
  /** Days since the village began, starting at 1. */
  get day() {
    return clockSave().day;
  },
  /** 0 at midnight, 0.5 at noon. */
  get timeOfDay() {
    return weatherState.timeOfDay;
  },
  get raining() {
    return weatherState.rain > 0.4;
  },
  /** Run fn at every dawn with the new day number; returns a function that stops it. */
  onDawn(fn: (day: number) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Called every frame by the life installer. */
  tick() {
    const t = weatherState.timeOfDay;
    if (last >= 0 && last < DAWN && t >= DAWN) clock.advance();
    last = t;
  },
  /** Start the next day now (dawn, or the dev hook). */
  advance() {
    const c = clockSave();
    c.day++;
    store.changed();
    for (const fn of listeners) fn(c.day);
  },
};
