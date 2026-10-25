import { audioCtx, bus, chime, pluck, sfx } from "../game/audio.ts";

// Hummed tunes and small sounds for scenes, all from the synth (no recorded or generated voices).
// A hum is two soft oscillators through a low filter, with a slow attack and a little vibrato,
// like someone humming with their mouth closed.

/** [midi note, beats]; 0 is a rest. */
type Tune = { bpm: number; notes: [number, number][] };

const TUNES: Record<string, Tune> = {
  // Gorran's song: an old road waltz in D, the crew's "all night" song
  gorran: {
    bpm: 132,
    notes: [
      [62, 1], [66, 1], [69, 1], [71, 2], [69, 1], [66, 2], [64, 1], [62, 3],
      [64, 1], [66, 1], [67, 1], [69, 2], [66, 1], [64, 3], [0, 1], [62, 1], [64, 1],
      [66, 1], [69, 1], [74, 1], [71, 2], [69, 1], [66, 2], [69, 1], [67, 1], [66, 1], [64, 1], [62, 4],
    ],
  },
  // the last line again, slower, Bram alone
  gorran_end: { bpm: 96, notes: [[66, 1], [69, 1], [67, 1], [66, 1], [64, 1], [62, 4]] },
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Length of a tune in seconds. */
export function tuneLength(name: string) {
  const t = TUNES[name];
  return t ? (t.notes.reduce((s, [, b]) => s + b, 0) * 60) / t.bpm : 0;
}

function voice(c: AudioContext, out: AudioNode, f: number, t: number, dur: number, vol: number, bright: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + Math.min(0.12, dur * 0.3));
  g.gain.setValueAtTime(vol * 0.85, t + dur * 0.75);
  g.gain.linearRampToValueAtTime(0, t + dur + 0.08);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 650 + bright * 900;
  lp.Q.value = 0.7;
  const vib = c.createOscillator();
  vib.frequency.value = 4.8;
  const vibGain = c.createGain();
  vibGain.gain.setValueAtTime(0, t);
  vibGain.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.5, dur));
  vib.connect(vibGain);
  for (const [type, mult, v] of [["triangle", 1, 1], ["sine", 2, 0.18], ["sine", 0.5, 0.3]] as const) {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    vibGain.connect(o.frequency);
    const og = c.createGain();
    og.gain.value = v;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + dur + 0.15);
  }
  vib.start(t);
  vib.stop(t + dur + 0.15);
  lp.connect(g).connect(out);
}

/**
 * Hum a tune. voices: 1 Bram alone (low), 2 the founder joins an octave up from the second
 * phrase, 3 a whole table: melody, a third above and a low drone. Resolves when it ends.
 */
export function hum(name: string, voices = 1): Promise<void> {
  const tune = TUNES[name];
  const c = audioCtx();
  const len = tuneLength(name);
  if (!tune || !c) return new Promise((r) => setTimeout(r, len * 1000));
  const out = bus("sfx");
  const beat = 60 / tune.bpm;
  let t = c.currentTime + 0.15;
  let at = 0;
  for (const [m, b] of tune.notes) {
    const dur = b * beat;
    if (m) {
      voice(c, out, hz(m - 12), t, dur * 0.96, 0.16, 0.2);
      if (voices >= 2 && at >= 12) voice(c, out, hz(m), t + 0.03, dur * 0.94, 0.07, 0.5);
      if (voices >= 3) {
        voice(c, out, hz(m), t + 0.02, dur * 0.95, 0.06, 0.45);
        voice(c, out, hz(m + (m % 12 === 2 || m % 12 === 7 ? 4 : 3)), t + 0.04, dur * 0.92, 0.045, 0.6);
      }
    }
    t += dur;
    at += b;
  }
  if (voices >= 3) voice(c, out, hz(38), c.currentTime + 0.15, len, 0.05, 0);
  return new Promise((r) => setTimeout(r, (len + 0.3) * 1000));
}

/** Small scene sounds from the synth; anything else is tried as a name from the game's sfx. */
export function sceneSound(name: string) {
  const c = audioCtx();
  if (name === "chime") return chime(880, 0, 1.8, 0.06);
  if (name === "cheer") {
    [62, 66, 69, 74, 78].forEach((m, i) => pluck(hz(m), i * 0.07, 0.22));
    return;
  }
  if (!c) return;
  const t = c.currentTime;
  if (name === "thump" || name === "paper" || name === "wheels") {
    const dur = name === "wheels" ? 2.6 : name === "paper" ? 0.35 : 0.25;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (name === "wheels" ? 0.5 + 0.5 * Math.sin(i / 900) : 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = name === "paper" ? "highpass" : "lowpass";
    f.frequency.value = name === "paper" ? 2200 : name === "wheels" ? 260 : 380;
    const g = c.createGain();
    const vol = name === "thump" ? 0.9 : name === "paper" ? 0.12 : 0.25;
    g.gain.setValueAtTime(name === "wheels" ? 0 : vol, t);
    if (name === "wheels") g.gain.linearRampToValueAtTime(vol, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(bus("sfx"));
    src.start(t);
    if (name === "thump") {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(50, t + 0.2);
      const og = c.createGain();
      og.gain.setValueAtTime(0.5, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(og).connect(bus("sfx"));
      o.start(t);
      o.stop(t + 0.3);
    }
    return;
  }
  const f = (sfx as unknown as Record<string, (() => void) | undefined>)[name];
  if (typeof f === "function") f.call(sfx);
}
