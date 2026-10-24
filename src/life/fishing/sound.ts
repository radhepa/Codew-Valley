import { audioCtx, bus, chime, logSound, play, pluck, sample, whenUnlocked } from "../../game/audio.ts";

// Fishing's sounds: recorded splashes and bubbles (public/audio/sfx/fishing, CC0, see CREDITS.md),
// the shared Kenney tick for the reel's ratchet, and a few synthesized ones (the swish of a
// cast, the catch fanfare on the game's harp).

const take = (name: string, n: number) => Array.from({ length: n }, (_, i) => `sfx/fishing/${name}-${i}.mp3`);
const FILES = { plop: take("plop", 3), bite: take("bite", 2), splash: take("splash", 3), bubble: take("bubble", 2) };
whenUnlocked(() => Object.values(FILES).flat().forEach((f) => void sample(f)));

const pickOne = (list: string[]) => list[Math.floor(Math.random() * list.length)];

/** A swish of filtered noise sweeping down: the line flying out. */
function swish(vol = 0.22) {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime;
  const dur = 0.42;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 2.2;
  f.frequency.setValueAtTime(2600, t);
  f.frequency.exponentialRampToValueAtTime(700, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.07);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(bus("sfx"));
  src.start(t);
  logSound("synth", "swish");
}

export const fishSfx = {
  cast() {
    swish();
    play("cloth", { vol: 0.35, rate: 1.3 });
  },
  /** The float lands on the water. */
  plop(vol = 0.55) {
    play(pickOne(FILES.plop), { vol, spread: 0.08 });
  },
  nibble() {
    play(pickOne(FILES.bubble), { vol: 0.35, rate: 1.25, spread: 0.1 });
  },
  bite() {
    play(pickOne(FILES.bite), { vol: 0.8 });
    play(pickOne(FILES.bubble), { vol: 0.4, delay: 0.08 });
    pluck(587.33, 0.02, 0.18);
    pluck(880, 0.1, 0.16);
  },
  hook() {
    play("leather", { vol: 0.5, rate: 1.2 });
    play(pickOne(FILES.splash), { vol: 0.5, rate: 1.15 });
  },
  /** One click of the reel's ratchet. */
  click(rate = 1) {
    play("tick", { vol: 0.18, rate: 1.5 * rate, spread: 0.06 });
  },
  thrash() {
    play(pickOne(FILES.splash), { vol: 0.45, rate: 1.1, spread: 0.12 });
  },
  /** The line goes slack after too much pull. */
  slack() {
    play("cloth", { vol: 0.4, rate: 0.8 });
    play(pickOne(FILES.splash), { vol: 0.5, rate: 0.9 });
  },
  landed() {
    play(pickOne(FILES.splash), { vol: 0.8 });
  },
  /** The catch reveal: a little rising harp phrase, warmer and longer for rare ones. */
  fanfare(rarity: number, junk: boolean) {
    if (junk) {
      pluck(293.66, 0.05, 0.22);
      pluck(277.18, 0.3, 0.2);
      pluck(220, 0.55, 0.22);
      return;
    }
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((n, i) => pluck(n, 0.06 + i * 0.09, 0.22));
    if (rarity >= 1) pluck(1479.98, 0.48, 0.18);
    if (rarity >= 2) {
      chime(1174.66, 0.55, 2.2, 0.07);
      chime(1760, 0.75, 2.0, 0.05);
    }
  },
  /** It got away. */
  away() {
    play(pickOne(FILES.bubble), { vol: 0.4, rate: 0.85 });
    pluck(392, 0.05, 0.14);
    pluck(329.63, 0.22, 0.14);
  },
  reelIn() {
    for (let i = 0; i < 6; i++) play("tick", { vol: 0.14, rate: 1.7, delay: i * 0.06 });
  },
};
