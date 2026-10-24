import { audioCtx, bus, chime, play, pluck, sample, whenUnlocked } from "../../game/audio.ts";

// Kitchen sounds. Recorded ones are Kenney's CC0 packs (CREDITS.md in this folder); the
// bubbling pot, the sizzling pan, the fire's crackle, the oven's breath and the millstone's
// rumble are made here from filtered noise and sine blips, so they can follow the cooking
// (more bubbles as the pot boils, more sizzle as the pan heats).

const DIR = "sfx/cooking/";
const FILES = {
  knife: ["knife-0", "knife-1"],
  pot: ["pot-0", "pot-1", "pot-2"],
  plate: ["plate-0", "plate-1", "plate-2"],
  basket: ["basket"],
  draw: ["draw-knife"],
};
const path = (k: keyof typeof FILES) => DIR + FILES[k][Math.floor(Math.random() * FILES[k].length)] + ".mp3";
whenUnlocked(() => void Promise.all(Object.values(FILES).flat().map((f) => sample(DIR + f + ".mp3"))));

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** A short burst of filtered noise. */
function burst(when: number, dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = "bandpass", b: "sfx" | "amb" = "sfx") {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime + when;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.01, dur * 0.2));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(bus(b));
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

/** One bubble: a sine that rises quickly as it pops. */
function bubble(when: number, vol: number, base = 220) {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime + when;
  const f0 = base * (0.8 + Math.random() * 0.9);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f0 * (2.2 + Math.random()), t + 0.07);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 1800;
  o.connect(f).connect(g).connect(bus("sfx"));
  o.start(t);
  o.stop(t + 0.12);
}

/** A sound that keeps going while something cooks; level 0..1 sets how busy it is. */
class Loop {
  level = 0;
  private timer = 0;
  constructor(private tick: (level: number) => void, private every = 60) {}
  start(level = 0.5) {
    this.level = level;
    if (!this.timer) this.timer = window.setInterval(() => this.level > 0.01 && this.tick(this.level), this.every);
  }
  stop() {
    clearInterval(this.timer);
    this.timer = 0;
    this.level = 0;
  }
}

/** The pot: a gentle blub-blub that turns into a rolling boil. */
const potLoop = new Loop((l) => {
  const n = Math.random() < l * 0.9 ? 1 + Math.floor(Math.random() * (1 + l * 2)) : 0;
  for (let i = 0; i < n; i++) bubble(Math.random() * 0.06, 0.05 + 0.07 * l, 160 + 140 * Math.random());
  if (Math.random() < l * 0.25) burst(0, 0.25, 500, 0.7, 0.02 * l, "lowpass");
});
/** The pan: hiss and spit. */
const panLoop = new Loop((l) => {
  burst(0, 0.12, 5200 + Math.random() * 2500, 0.8, 0.035 * l, "bandpass");
  if (Math.random() < 0.35 * l) burst(Math.random() * 0.05, 0.02, 3000 + Math.random() * 3000, 3, 0.09 * l);
}, 70);
/** The oven: a low, warm breath. */
const ovenLoop = new Loop((l) => {
  burst(0, 0.3, 260, 0.6, 0.05 * l, "lowpass");
  if (Math.random() < 0.15 * l) burst(0, 0.015, 2400, 4, 0.06 * l);
}, 200);
/** The millstone: a slow stony rumble. */
const millLoop = new Loop((l) => burst(0, 0.35, 120 + Math.random() * 60, 1.2, 0.12 * l, "lowpass"), 180);

export const cookSfx = {
  pot: potLoop,
  pan: panLoop,
  oven: ovenLoop,
  mill: millLoop,
  /** The fire's crackle, now and then; vol by distance (0..1). */
  crackle(vol: number) {
    if (vol < 0.02) return;
    burst(0, 0.012 + Math.random() * 0.02, 1500 + Math.random() * 2500, 2.5, 0.12 * vol, "bandpass", "amb");
    if (Math.random() < 0.3) burst(0.03, 0.01, 3000, 3, 0.07 * vol, "bandpass", "amb");
  },
  chop() {
    play(path("knife"), { vol: 0.55, spread: 0.08 });
    play(path("knife"), { vol: 0.25, rate: 0.7, delay: 0.02, lowpass: 900 });
  },
  /** Something dropped into the pot. */
  plop() {
    bubble(0, 0.16, 110);
    bubble(0.04, 0.1, 180);
    burst(0.02, 0.18, 900, 1.2, 0.06, "lowpass");
  },
  /** Into a hot pan. */
  sizzleHit() {
    burst(0, 0.5, 6000, 0.6, 0.12, "highpass");
    burst(0.05, 0.3, 4200, 1, 0.08);
  },
  clink() {
    play(path("pot"), { vol: 0.35, spread: 0.1 });
  },
  stir() {
    play(path("pot"), { vol: 0.12, rate: 1.4, spread: 0.15, lowpass: 2500 });
    burst(0, 0.2, 700, 1, 0.025, "lowpass");
  },
  flip() {
    burst(0, 0.18, 1200, 0.8, 0.05, "bandpass");
    play(path("pot"), { vol: 0.18, rate: 0.8, delay: 0.32 });
    burst(0.34, 0.35, 6000, 0.6, 0.1, "highpass");
  },
  knead() {
    burst(0, 0.12, 300, 0.8, 0.12, "lowpass");
    burst(0.03, 0.08, 900, 1, 0.04);
  },
  peel() {
    burst(0, 0.35, 1600, 0.5, 0.05, "bandpass");
    play(path("plate"), { vol: 0.2, rate: 0.7, delay: 0.25, lowpass: 1500 });
  },
  whoosh() {
    burst(0, 0.6, 400, 0.5, 0.09, "lowpass");
  },
  /** A sip from the spoon, and a happy "mm". */
  taste() {
    burst(0, 0.18, 2500, 2, 0.04);
    burst(0.12, 0.1, 1900, 2, 0.03);
    pluck(587.33, 0.35, 0.12);
  },
  plate() {
    play(path("plate"), { vol: 0.5, spread: 0.06 });
  },
  draw() {
    play(path("draw"), { vol: 0.25 });
  },
  basket() {
    play(path("basket"), { vol: 0.4 });
    pluck(587.33, 0.05, 0.12);
    pluck(880, 0.16, 0.1);
  },
  /** The dish comes out: a bright little arpeggio and a shimmer. */
  reveal(perfect: boolean) {
    const notes = perfect ? [587.33, 739.99, 880, 1174.66, 1479.98] : [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => pluck(f, i * 0.09, 0.2));
    chime(perfect ? 1760 : 1174.66, notes.length * 0.09, 1.8, 0.05);
  },
  /** A new recipe for the book. */
  learn() {
    [440, 554.37, 659.25, 880].forEach((f, i) => pluck(f, i * 0.11, 0.16));
    chime(1318.5, 0.5, 1.6, 0.04);
  },
  /** A gentle "not quite": two soft low notes, never a buzzer. */
  hmm() {
    pluck(392, 0, 0.12);
    pluck(329.63, 0.16, 0.12);
  },
  /** One of the minigame's sweet-spot ticks. */
  tick(i = 0) {
    pluck(880 * Math.pow(2, (i % 5) / 12 * 2), 0, 0.07);
  },
  stopAll() {
    potLoop.stop();
    panLoop.stop();
    ovenLoop.stop();
    millLoop.stop();
  },
};
