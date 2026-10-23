// Small synthesized sound effects (no audio files to license).
let ctx: AudioContext | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol: number, freq: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = 1.2;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export const sfx = {
  chop() {
    noise(0, 0.12, 0.5, 700);
    tone(160, 0, 0.12, "triangle", 0.25, -60);
  },
  clink() {
    noise(0, 0.06, 0.3, 3000);
    tone(1250, 0, 0.18, "sine", 0.12);
    tone(1870, 0.01, 0.14, "sine", 0.06);
  },
  pickup() {
    tone(660, 0, 0.08, "sine", 0.12);
    tone(990, 0.06, 0.1, "sine", 0.1);
  },
  click() {
    tone(520, 0, 0.05, "triangle", 0.08);
  },
  error() {
    tone(220, 0, 0.18, "triangle", 0.12, -40);
  },
  success() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, "triangle", 0.13));
  },
  build() {
    noise(0, 0.25, 0.35, 250);
    [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.15 + i * 0.08, 0.4, "triangle", 0.11));
  },
  blip() {
    tone(880 + Math.random() * 120, 0, 0.04, "square", 0.025);
  },
  toggleMute() {
    muted = !muted;
    return muted;
  },
  get muted() {
    return muted;
  },
};
