// The living valley: nature beds (birds by day, crickets at dusk, the pond,
// rain and wind from weatherState), distant thunder, footsteps, and the
// music scene, all updated every frame from the world.
import type * as THREE from "three";
import { audioCtx, bus, logSound, sample, sfx, whenUnlocked } from "./audio.ts";
import { music, type Scene } from "./music.ts";
import { weatherState } from "./weather-state.ts";
import type { World } from "./world.ts";

/** The pond's centre and radius (matches world.ts). */
const POND = { x: 13, z: 9, r: 4.2 };
/** Seconds between footfalls at walking speed (the walk cycle's half period). */
const STEP_S = Math.PI / 11;

/**
 * One looping bed. Recordings rarely loop cleanly, so each pass overlaps
 * the next with a crossfade instead of relying on a seamless file.
 */
class Bed {
  private gain: GainNode;
  private buf: AudioBuffer | null = null;
  private nextStart = 0;
  level = 0;

  constructor(
    file: string,
    private fade = 2.5,
    private wobble = 0.03,
  ) {
    const c = audioCtx()!;
    this.gain = c.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(bus("amb"));
    void sample(file).then((b) => (this.buf = b));
  }

  /** Call every frame with the wanted level (0..1, already scaled). */
  update(target: number, smooth = 0.8) {
    const c = audioCtx();
    if (!c) return;
    if (Math.abs(target - this.level) > 0.002) {
      this.level = target;
      this.gain.gain.setTargetAtTime(target, c.currentTime, smooth);
    }
    // keep passes scheduled a little ahead, only while audible (saves voices)
    if (this.buf && this.level > 0.001 && c.currentTime > this.nextStart - 1) {
      const t = Math.max(c.currentTime + 0.05, this.nextStart);
      const src = c.createBufferSource();
      src.buffer = this.buf;
      const rate = 1 + (Math.random() * 2 - 1) * this.wobble;
      src.playbackRate.value = rate;
      const dur = this.buf.duration / rate;
      const offset = this.nextStart === 0 ? Math.random() * dur * 0.3 : 0;
      const g = c.createGain();
      const f = Math.min(this.fade, dur / 3);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(1, t + f);
      g.gain.setValueAtTime(1, t + dur - offset - f);
      g.gain.linearRampToValueAtTime(0, t + dur - offset);
      src.connect(g).connect(this.gain);
      src.start(t, offset * rate);
      src.stop(t + dur - offset + 0.05);
      this.nextStart = t + dur - offset - f;
    }
  }
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 1 in daylight, 0 at night, easing through dawn and dusk. */
function daylight(tod: number) {
  return smoothstep(0.2, 0.3, tod) * (1 - smoothstep(0.7, 0.8, tod));
}

class Soundscape {
  private world: World | null = null;
  private beds: Record<"birds" | "crickets" | "pond" | "rain" | "wind", Bed> | null = null;
  private last = 0;
  private prevPos: { x: number; z: number } | null = null;
  private stepTimer = 0;
  private prevThunder = 0;
  private lastRumble = -Infinity;
  private ground: THREE.Mesh | null = null;
  private sceneAt = 0;
  private pendingScene: Scene | null = null;
  /** For testing: the levels and surface last frame. */
  readonly state = { day: 1, surface: "grass" as "grass" | "path", moving: false, beds: {} as Record<string, number>, scene: "title" as Scene };

  attach(world: World) {
    this.world = world;
    whenUnlocked(() => {
      this.beds = {
        birds: new Bed("amb/birds.mp3", 3),
        crickets: new Bed("amb/crickets.mp3", 1.5, 0.05),
        pond: new Bed("amb/pond.mp3", 3),
        rain: new Bed("amb/rain.mp3", 3, 0.01),
        wind: new Bed("amb/wind.mp3", 4, 0.06),
      };
      void sample("amb/thunder.mp3");
    });
    const loop = (t: number) => {
      const dt = Math.min(0.1, (t - (this.last || t)) / 1000);
      this.last = t;
      this.update(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private player(): THREE.Object3D | undefined {
    return (this.world as unknown as { player?: THREE.Object3D }).player;
  }

  /** "path" when the ground under (x, z) is painted as dirt path. */
  private surfaceAt(x: number, z: number): "grass" | "path" {
    this.ground ??= (this.world?.scene.getObjectByName("ground") as THREE.Mesh) ?? null;
    const col = this.ground?.geometry.getAttribute("color");
    const pos = this.ground?.geometry.getAttribute("position");
    if (!col || !pos) return "grass";
    // the ground is a square plane: find the nearest vertex
    const { width: size, widthSegments: seg } = (this.ground!.geometry as THREE.PlaneGeometry).parameters;
    const ix = Math.round(((x + size / 2) / size) * seg);
    const iz = Math.round(((z + size / 2) / size) * seg);
    const i = iz * (seg + 1) + ix;
    if (i < 0 || i >= col.count) return "grass";
    // dirt is warm (red above green); grass is green
    return col.getX(i) > col.getY(i) ? "path" : "grass";
  }

  private pickScene(): Scene {
    const ui = document.getElementById("ui");
    if (ui?.classList.contains("titling")) return "title";
    if (document.querySelector(".bench")) return "focus";
    if (weatherState.rain > 0.45) return "rain";
    if (daylight(weatherState.timeOfDay) < 0.5) return "evening";
    return "day";
  }

  private update(dt: number) {
    // music scene, held steady for a moment so brief changes don't thrash it
    const s = this.pickScene();
    const now = performance.now();
    if (s !== this.pendingScene) {
      this.pendingScene = s;
      this.sceneAt = now;
    }
    const hold = this.state.scene === "title" ? 0 : s === "focus" ? 300 : this.state.scene === "focus" ? 1500 : 4000;
    if (s !== this.state.scene && now - this.sceneAt > hold) {
      this.state.scene = s;
      music.setScene(s);
    }

    const c = audioCtx();
    const world = this.world;
    if (!c || !world || !this.beds) return;
    const w = weatherState;
    const day = daylight(w.timeOfDay);
    const rain = Math.min(1, Math.max(0, w.rain));
    const wind = Math.min(1, Math.max(0, w.wind));
    // inside a sheet (workbench, Codex) the valley steps back a little
    const away = s === "title" ? 0.55 : world.paused ? 0.5 : 1;
    const p = this.player();
    let pondNear = 0;
    if (p) {
      const d = Math.hypot(p.position.x - POND.x, p.position.z - POND.z) - POND.r;
      pondNear = 1 - smoothstep(0.5, 16, d);
    }
    const levels = {
      birds: day * (1 - rain * 0.85) * 0.55,
      crickets: (1 - day) * (1 - rain * 0.7) * 0.5,
      pond: (0.04 + pondNear * pondNear * 0.55) * (1 - rain * 0.4),
      rain: Math.pow(rain, 0.7) * 0.85,
      wind: (0.05 + wind * wind * 0.6 + rain * 0.1) * 0.9,
    };
    for (const [k, v] of Object.entries(levels)) {
      this.beds[k as keyof typeof levels].update(v * away);
      this.state.beds[k] = Math.round(v * away * 100) / 100;
    }
    this.state.day = Math.round(day * 100) / 100;

    // thunder: a distant rumble a moment after each flash
    // (one strike flickers several times: one rumble per strike)
    if (w.thunder > 0 && this.prevThunder <= 0 && now - this.lastRumble > 4000) {
      this.lastRumble = now;
      this.rumble(w.thunder);
    }
    this.prevThunder = w.thunder;

    // footsteps from how far the player moved this frame
    if (p) {
      const moved = this.prevPos ? Math.hypot(p.position.x - this.prevPos.x, p.position.z - this.prevPos.z) : 0;
      this.prevPos = { x: p.position.x, z: p.position.z };
      const moving = !world.paused && dt > 0 && moved / dt > 1.5;
      this.state.moving = moving;
      if (moving) {
        this.stepTimer -= dt;
        if (this.stepTimer <= 0) {
          this.stepTimer += STEP_S;
          const surf = this.surfaceAt(p.position.x, p.position.z);
          this.state.surface = surf;
          sfx.step(surf, rain > 0.3 ? 1.15 : 1);
        }
      } else this.stepTimer = 0.05;
    }
  }

  private rumble(strength: number) {
    const c = audioCtx();
    if (!c) return;
    void sample("amb/thunder.mp3").then((b) => {
      if (!b) return;
      const src = c.createBufferSource();
      src.buffer = b;
      src.playbackRate.value = 0.8 + Math.random() * 0.25;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 500 + Math.min(1, strength) * 900;
      const g = c.createGain();
      g.gain.value = 0.45 + Math.min(1, strength) * 0.45;
      src.connect(f).connect(g).connect(bus("amb"));
      // sound travels slower than light: a far storm rumbles a few seconds later
      src.start(c.currentTime + 0.8 + Math.random() * 2.2);
      logSound("amb", "thunder");
    });
  }
}

export const soundscape = new Soundscape();
