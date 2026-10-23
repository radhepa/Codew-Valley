// The sound engine: one AudioContext, three volume buses (music, effects,
// nature) under a master, saved settings, sample loading and the `sfx`
// sounds the game calls. Recorded sounds live in public/audio (see
// CREDITS.md); a few soft plucks and chimes are synthesized here.

export type Bus = "music" | "sfx" | "amb";

export interface SoundSettings {
  music: number;
  sfx: number;
  amb: number;
  muted: boolean;
}

const KEY = "pyvillage.audio.v1";
const DEFAULTS: SoundSettings = { music: 0.6, sfx: 0.8, amb: 0.7, muted: false };

function loadSettings(): SoundSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SoundSettings>) };
  } catch {
    /* no storage: use defaults */
  }
  return { ...DEFAULTS };
}

export const settings = loadSettings();
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let master: GainNode;
const buses = {} as Record<Bus, GainNode>;
const unlockHooks: (() => void)[] = [];

/** What played recently, for testing (the preview can't hear). */
export const soundLog: { t: number; kind: string; name: string }[] = [];
export function logSound(kind: string, name: string) {
  soundLog.push({ t: Math.round(performance.now()) / 1000, kind, name });
  if (soundLog.length > 200) soundLog.shift();
}

/** Slider position (0..1) to gain: squared, so the low end is usable. */
const curve = (v: number) => v * v;

function applyVolumes(ramp = 0.15) {
  if (!ctx) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(settings.muted ? 0 : 1, t, ramp / 3);
  for (const b of ["music", "sfx", "amb"] as Bus[]) buses[b].gain.setTargetAtTime(curve(settings[b]), t, ramp / 3);
}

export function setSetting<K extends keyof SoundSettings>(k: K, v: SoundSettings[K]) {
  settings[k] = v;
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  applyVolumes();
  listeners.forEach((f) => f());
}

export function onSettings(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** The context once the player has interacted with the page, else null. */
export function audioCtx(): AudioContext | null {
  if (ctx && ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function bus(b: Bus): GainNode {
  return buses[b];
}

/** Run once audio is allowed (immediately if it already is). */
export function whenUnlocked(f: () => void) {
  if (ctx) f();
  else unlockHooks.push(f);
}

// Browsers only allow sound after a user gesture: create the context on the first one.
function unlock() {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.connect(comp).connect(ctx.destination);
  for (const b of ["music", "sfx", "amb"] as Bus[]) {
    buses[b] = ctx.createGain();
    buses[b].connect(master);
  }
  master.gain.value = 0;
  applyVolumes(0.6);
  logSound("engine", "unlocked");
  void preloadAll();
  unlockHooks.splice(0).forEach((f) => f());
}
for (const ev of ["pointerdown", "keydown", "touchstart"]) window.addEventListener(ev, unlock, { capture: true });

// ---- samples ------------------------------------------------------------------

const BASE = `${import.meta.env.BASE_URL}audio/`;
const buffers = new Map<string, AudioBuffer | null>();
const loading = new Map<string, Promise<AudioBuffer | null>>();

/** Decode a file from public/audio (cached). */
export function sample(path: string): Promise<AudioBuffer | null> {
  const have = buffers.get(path);
  if (have !== undefined) return Promise.resolve(have);
  let p = loading.get(path);
  if (!p) {
    p = fetch(BASE + path)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status} ${path}`))))
      .then((a) => ctx!.decodeAudioData(a))
      .catch((e) => {
        console.warn("[audio] could not load", path, e);
        return null;
      })
      .then((b) => {
        buffers.set(path, b);
        return b;
      });
    loading.set(path, p);
  }
  return p;
}

const range = (name: string, n: number) => Array.from({ length: n }, (_, i) => `sfx/${name}-${i}.mp3`);
const SFX_FILES = {
  grass: range("step-grass", 5),
  path: range("step-path", 5),
  chop: ["sfx/chop.mp3"],
  wood: range("wood", 3),
  mine: range("mine", 4),
  page: ["sfx/page-1.mp3", "sfx/page-2.mp3", "sfx/page-3.mp3"],
  bookOpen: ["sfx/book-open.mp3"],
  bookClose: ["sfx/book-close.mp3"],
  place: ["sfx/book-place.mp3"],
  cloth: ["sfx/cloth.mp3"],
  leather: ["sfx/leather.mp3"],
  click: ["sfx/click.mp3"],
  select: ["sfx/select.mp3"],
  toggle: ["sfx/toggle.mp3"],
  tick: ["sfx/tick.mp3"],
  glass: ["sfx/glass-1.mp3", "sfx/glass-2.mp3"],
};
type SfxName = keyof typeof SFX_FILES;

function preloadAll() {
  return Promise.all(Object.values(SFX_FILES).flat().map(sample));
}

interface PlayOpts {
  vol?: number;
  /** Playback rate (pitch); a random ±spread is added. */
  rate?: number;
  spread?: number;
  delay?: number;
  bus?: Bus;
  /** Low-pass cutoff in Hz. */
  lowpass?: number;
}

/** Play a recorded sound (a random take when there are several). */
export function play(name: SfxName | string, o: PlayOpts = {}) {
  const c = audioCtx();
  if (!c) return;
  const list = (SFX_FILES as Record<string, string[]>)[name] ?? [name];
  const path = list[Math.floor(Math.random() * list.length)];
  const buf = buffers.get(path);
  if (!buf) {
    if (buf === undefined) void sample(path);
    return;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = (o.rate ?? 1) * (1 + (Math.random() * 2 - 1) * (o.spread ?? 0.04));
  const g = c.createGain();
  g.gain.value = o.vol ?? 1;
  let node: AudioNode = src;
  if (o.lowpass) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.lowpass;
    node = node.connect(f);
  }
  node.connect(g).connect(buses[o.bus ?? "sfx"]);
  src.start(c.currentTime + (o.delay ?? 0));
  logSound("sfx", name);
}

// ---- synthesized voices ---------------------------------------------------------

const plucks = new Map<number, AudioBuffer>();

/** A soft plucked string (Karplus-Strong), harp-like. Cached per pitch. */
function pluckBuffer(c: AudioContext, freq: number): AudioBuffer {
  const key = Math.round(freq * 10);
  const have = plucks.get(key);
  if (have) return have;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 2.6);
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(period);
  // a soft, rounded excitation (filtered noise) gives a harp more than a guitar
  let prev = 0;
  for (let i = 0; i < period; i++) {
    prev = prev * 0.55 + (Math.random() * 2 - 1) * 0.45;
    ring[i] = prev;
  }
  const decay = 0.996 - Math.min(0.006, freq / 400000);
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const next = (idx + 1) % period;
    const v = (ring[idx] + ring[next]) * 0.5 * decay;
    d[i] = ring[idx];
    ring[idx] = v;
    idx = next;
  }
  // gentle attack so it doesn't click, and normalise
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
  for (let i = 0; i < len; i++) d[i] = (d[i] / (peak || 1)) * Math.min(1, i / (sr * 0.003));
  plucks.set(key, buf);
  return buf;
}

/** One harp note. `when` is seconds from now. */
export function pluck(freq: number, when = 0, vol = 0.3, b: Bus = "sfx") {
  const c = audioCtx();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(c, freq);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = Math.min(9000, freq * 7);
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(buses[b]);
  src.start(c.currentTime + when);
}

/** A soft sine chime with a slow shimmer (the rune stone's voice). */
export function chime(freq: number, when = 0, dur = 1.6, vol = 0.08, b: Bus = "sfx") {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime + when;
  for (const [mult, v] of [
    [1, 1],
    [2.01, 0.35],
    [3.98, 0.12],
  ]) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * mult, t);
    const lfo = c.createOscillator();
    lfo.frequency.value = 5 + Math.random() * 2;
    const lfoGain = c.createGain();
    lfoGain.gain.value = freq * mult * 0.004;
    lfo.connect(lfoGain).connect(o.frequency);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * v, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(buses[b]);
    o.start(t);
    lfo.start(t);
    o.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05);
  }
}

/** A breathy rising shimmer (filtered noise swept upward). */
function shimmer(when: number, dur: number, vol: number) {
  const c = audioCtx();
  if (!c) return;
  const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 9;
  f.frequency.setValueAtTime(1800, t);
  f.frequency.exponentialRampToValueAtTime(7500, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.4);
  g.gain.linearRampToValueAtTime(0, t + dur);
  src.connect(f).connect(g).connect(buses.sfx);
  src.start(t);
}

// note frequencies used by the plucks (D major pentatonic, airy and folk-like)
const N = { A3: 220, D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440, B4: 493.88, D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880, D6: 1174.66 };

// ---- the sounds the game calls ----------------------------------------------------

export const sfx = {
  /** An axe biting into a trunk. */
  chop() {
    play("chop", { vol: 0.75, spread: 0.08 });
    play("wood", { vol: 0.35, rate: 0.8, spread: 0.08, delay: 0.01 });
  },
  /** A pick on stone. */
  clink() {
    play("mine", { vol: 0.7, spread: 0.06 });
  },
  /** A resource lands in the pack. */
  pickup() {
    play("leather", { vol: 0.45, spread: 0.1 });
    pluck(N.A5, 0.02, 0.12);
    pluck(N.D6, 0.09, 0.09);
  },
  /** A plain button press. */
  click() {
    play("click", { vol: 0.5, spread: 0.05 });
  },
  /** A switch or toggle. */
  toggle() {
    play("toggle", { vol: 0.45 });
  },
  /** Kept for old call sites: a soft "not quite". */
  error() {
    sfx.fail();
  },
  /** Kept for old call sites: a warm "yes". */
  success() {
    sfx.pass();
  },
  /** A building stage rises: hammer knocks, then the rune shimmer. */
  build() {
    play("wood", { vol: 0.6, rate: 1, delay: 0.05 });
    play("wood", { vol: 0.55, rate: 1.06, delay: 0.42 });
    play("wood", { vol: 0.65, rate: 0.95, delay: 0.8 });
    shimmer(1.0, 1.4, 0.16);
    chime(N.D5, 1.3, 2.4, 0.06);
    chime(N.A5, 1.55, 2.2, 0.045);
    play("glass", { vol: 0.35, delay: 1.35 });
    logSound("sfx", "build");
  },
  /** One subtle tick while dialogue text types. */
  blip() {
    play("tick", { vol: 0.12, rate: 1.15, spread: 0.12 });
  },
  /** Footstep on grass or on the dirt paths. */
  step(surface: "grass" | "path", vol = 1) {
    if (surface === "grass") play("grass", { vol: 0.32 * vol, spread: 0.1, lowpass: 3800 });
    else play("path", { vol: 0.3 * vol, spread: 0.08, lowpass: 3200 });
  },
  /** A paper sheet (rune stone, workbench) slides open. */
  open() {
    play("page", { vol: 0.5, spread: 0.06 });
  },
  close() {
    play("place", { vol: 0.35, spread: 0.06 });
  },
  bookOpen() {
    play("bookOpen", { vol: 0.55 });
  },
  bookClose() {
    play("bookClose", { vol: 0.5 });
  },
  /** Switching tab or page. */
  tab() {
    play("page", { vol: 0.32, rate: 1.1, spread: 0.08 });
  },
  /** A dialogue box appears. */
  dialog() {
    play("cloth", { vol: 0.25, spread: 0.08 });
  },
  /** A toast note. */
  notice() {
    chime(N.A5, 0, 1.2, 0.035);
    chime(N.E5, 0.08, 1.2, 0.03);
  },
  /** Run pressed: a light rune hum. */
  run() {
    play("select", { vol: 0.4 });
    chime(N.D5, 0.02, 0.6, 0.03);
  },
  /** The program finished running. */
  ran() {
    play("tick", { vol: 0.25, rate: 0.8 });
  },
  /** Check passed: the rune stone glows. */
  pass() {
    [N.D4, N.Fs4, N.A4, N.D5, N.E5, N.A5].forEach((f, i) => pluck(f, i * 0.07, 0.24));
    chime(N.D6, 0.42, 2.2, 0.04);
    shimmer(0.25, 1.2, 0.08);
    logSound("sfx", "pass");
  },
  /** Check failed: a gentle low "hmm", never harsh. */
  fail() {
    pluck(N.B4 / 2, 0, 0.2);
    pluck(N.A3, 0.16, 0.2);
    logSound("sfx", "fail");
  },
  /** Quick-check answer right. */
  right() {
    pluck(N.A4, 0, 0.22);
    pluck(N.D5, 0.08, 0.22);
    pluck(N.Fs5, 0.16, 0.18);
    play("glass", { vol: 0.25, delay: 0.16 });
    logSound("sfx", "right");
  },
  /** Quick-check answer wrong. */
  wrong() {
    pluck(N.E4, 0, 0.18);
    pluck(N.D4 * 0.944, 0.12, 0.18);
    logSound("sfx", "wrong");
  },
  /** Flip mute; returns the new state. */
  toggleMute() {
    setSetting("muted", !settings.muted);
    return settings.muted;
  },
  get muted() {
    return settings.muted;
  },
};
