// The music director: picks a track for the moment (title, day, evening,
// rain, the workbench), crossfades between them, and leaves long quiet gaps
// between pieces so the valley's own sounds get a turn.
import { audioCtx, bus, logSound, pluck, chime, sample, whenUnlocked } from "./audio.ts";

export type Scene = "title" | "day" | "evening" | "rain" | "focus";

interface Track {
  file: string;
  title: string;
  scenes: Scene[];
  /** Extra gain for this track (files are loudness matched already). */
  vol?: number;
}

/** Every piece and where it plays. Credits are in public/audio/CREDITS.md. */
export const TRACKS: Track[] = [
  { file: "music/title-windswept.mp3", title: "Windswept", scenes: ["title"] },
  { file: "music/day-morning.mp3", title: "Morning", scenes: ["day"] },
  { file: "music/day-exploration.mp3", title: "Medieval: Exploration", scenes: ["day"] },
  { file: "music/day-bards-tale.mp3", title: "Medieval: The Bard's Tale", scenes: ["day"] },
  { file: "music/day-clear-air.mp3", title: "Clear Air", scenes: ["day"] },
  { file: "music/evening.mp3", title: "Evening", scenes: ["evening"] },
  { file: "music/night-midnight-tale.mp3", title: "Midnight Tale", scenes: ["evening"] },
  { file: "music/rain-on-the-shore.mp3", title: "On the Shore", scenes: ["rain"] },
  { file: "music/rain-healing.mp3", title: "Healing", scenes: ["rain"] },
  { file: "music/focus-enchanted-journey.mp3", title: "Enchanted Journey", scenes: ["focus"], vol: 0.7 },
];

const KM = "Kevin MacLeod (incompetech.com)";
const CC_BY = "Licensed under Creative Commons: By Attribution 4.0 (creativecommons.org/licenses/by/4.0/)";
const CC0 = "CC0 (public domain), via OpenGameArt.org";

/** Credits shown in the sound panel (CC-BY pieces must be credited in the game). */
export const CREDITS = [
  { title: "Windswept", by: KM, licence: CC_BY },
  { title: "Morning", by: KM, licence: CC_BY },
  { title: "Clear Air", by: KM, licence: CC_BY },
  { title: "Evening", by: KM, licence: CC_BY },
  { title: "Midnight Tale", by: KM, licence: CC_BY },
  { title: "On the Shore", by: KM, licence: CC_BY },
  { title: "Healing", by: KM, licence: CC_BY },
  { title: "Enchanted Journey", by: KM, licence: CC_BY },
  { title: "Light Sting", by: KM, licence: CC_BY },
  { title: "Medieval: Exploration", by: "RandomMind", licence: CC0 },
  { title: "Medieval: The Bard's Tale", by: "RandomMind", licence: CC0 },
];

/** Seconds of silence after a piece ends, per scene. */
const GAP: Record<Scene, [number, number]> = {
  title: [6, 10],
  day: [35, 80],
  evening: [40, 90],
  rain: [30, 70],
  focus: [20, 40],
};
const FADE = 3.5;

interface Playing {
  track: Track;
  el: HTMLAudioElement;
  gain: GainNode;
}

class Music {
  scene: Scene = "title";
  private current: Playing | null = null;
  private fading: Playing[] = [];
  /** When (performance.now ms) the next piece may start. */
  private nextAt = 0;
  private last = new Map<Scene, string>();
  private duck: GainNode | null = null;

  constructor() {
    whenUnlocked(() => {
      const c = audioCtx()!;
      this.duck = c.createGain();
      this.duck.connect(bus("music"));
      // the title theme starts on the first click; the game's first piece after a short breath
      this.nextAt = performance.now() + (this.scene === "title" ? 300 : 2500);
      void sample("music/sting-finish.mp3");
      setInterval(() => this.tick(), 500);
    });
  }

  /** Move to a scene. The current piece fades out if it doesn't belong. */
  setScene(s: Scene) {
    if (s === this.scene) return;
    const from = this.scene;
    this.scene = s;
    logSound("music-scene", s);
    if (this.current && !this.current.track.scenes.includes(s)) {
      this.fadeOut(this.current, s === "focus" || from === "focus" ? 2 : FADE);
      this.current = null;
      // a short breath before the new mood (longer coming back from the workbench)
      const wait = s === "focus" ? 1500 : from === "focus" ? 12000 + Math.random() * 10000 : from === "title" ? 2500 : 5000;
      this.nextAt = performance.now() + wait;
    } else if (!this.current && from === "title") this.nextAt = Math.min(this.nextAt, performance.now() + 2500);
    else if (!this.current && s === "focus") this.nextAt = performance.now() + 1500;
  }

  get playing(): string | null {
    return this.current ? this.current.track.title : null;
  }

  private tick() {
    const now = performance.now();
    if (this.current?.el.ended) {
      this.release(this.current);
      this.current = null;
      const [a, b] = GAP[this.scene];
      this.nextAt = now + (a + Math.random() * (b - a)) * 1000;
      logSound("music", "gap");
    }
    if (!this.current && now >= this.nextAt) this.start();
  }

  private start() {
    const c = audioCtx();
    if (!c || !this.duck) return;
    const options = TRACKS.filter((t) => t.scenes.includes(this.scene));
    if (!options.length) return;
    const fresh = options.filter((t) => t.file !== this.last.get(this.scene));
    const track = (fresh.length ? fresh : options)[Math.floor(Math.random() * (fresh.length || options.length))];
    this.last.set(this.scene, track.file);
    const el = new Audio(`${import.meta.env.BASE_URL}audio/${track.file}`);
    el.preload = "auto";
    const src = c.createMediaElementSource(el);
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(track.vol ?? 1, c.currentTime + 2.5);
    src.connect(gain).connect(this.duck);
    const p: Playing = { track, el, gain };
    this.current = p;
    el.addEventListener("error", () => {
      console.warn("[audio] music failed to load", track.file);
      if (this.current === p) this.current = null;
      this.nextAt = performance.now() + 30000;
    });
    void el.play().catch(() => {
      if (this.current === p) this.current = null;
      this.nextAt = performance.now() + 2000;
    });
    logSound("music", track.title);
  }

  private fadeOut(p: Playing, dur: number) {
    const c = audioCtx();
    if (!c) return;
    p.gain.gain.cancelScheduledValues(c.currentTime);
    p.gain.gain.setValueAtTime(p.gain.gain.value, c.currentTime);
    p.gain.gain.linearRampToValueAtTime(0, c.currentTime + dur);
    this.fading.push(p);
    setTimeout(() => this.release(p), dur * 1000 + 200);
    logSound("music-fade", p.track.title);
  }

  private release(p: Playing) {
    p.el.pause();
    p.el.removeAttribute("src");
    p.el.load();
    p.gain.disconnect();
    this.fading = this.fading.filter((x) => x !== p);
  }

  /** Lower the music for a moment (stings, big events). */
  private dip(to: number, hold: number) {
    const c = audioCtx();
    if (!c || !this.duck) return;
    const g = this.duck.gain;
    const t = c.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(to, t + 0.4);
    g.setValueAtTime(to, t + hold);
    g.linearRampToValueAtTime(1, t + hold + 2.5);
  }

  /**
   * A stage was built ("stage"), or a whole building ("finish").
   * Plays about a second after the build sound so the hammer and the music don't collide.
   */
  sting(kind: "stage" | "finish") {
    const c = audioCtx();
    if (!c) return;
    logSound("sting", kind);
    if (kind === "stage") {
      this.dip(0.3, 3.5);
      // a warm rising harp phrase over a soft open fifth
      const notes = [293.66, 369.99, 440, 587.33, 739.99, 880];
      notes.forEach((f, i) => pluck(f, 1.9 + i * 0.11, 0.2, "music"));
      pluck(146.83, 1.9, 0.18, "music");
      pluck(220, 1.95, 0.14, "music");
      chime(1174.66, 2.55, 2.6, 0.035, "music");
      return;
    }
    this.dip(0.12, 15);
    void sample("music/sting-finish.mp3").then((b) => {
      if (!b) return;
      const src = c.createBufferSource();
      src.buffer = b;
      const g = c.createGain();
      g.gain.value = 0.9;
      src.connect(g).connect(bus("music"));
      src.start(c.currentTime + 1.6);
    });
    [146.83, 220, 293.66, 369.99, 440, 587.33].forEach((f, i) => pluck(f, 1.2 + i * 0.06, 0.16, "music"));
  }
}

export const music = new Music();
