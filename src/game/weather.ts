import * as THREE from "three";
import { ATMOS, SKY, WEATHER_U } from "./atmosphere.ts";
import { weatherState } from "./weather-state.ts";
import { createBirds, createDrift, createMotes, createPondMist, createPuddles, createRain, createSplashes, type AmbientFrame, type Pond } from "./ambience.ts";

// The valley's weather and its day. Soft showers come and go on their own (now
// and then a heavier one with distant lightning), the wind rises and falls and
// gusts, cloud shadows roll over the fields, and the light moves from morning
// through a golden evening and a short blue night. Everything here writes
// weatherState every frame for the sound to follow.

export type WeatherKind = "clear" | "drizzle" | "rain" | "storm" | "rainbow";

export interface WeatherSetup {
  scene: THREE.Scene;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ground: THREE.MeshStandardMaterial;
  /** Darkens the meadow grass as it gets wet. */
  grassWet(wet: number): void;
  pond: Pond;
  puddles: { x: number; z: number; r: number }[];
}

/** One real-time day, in seconds. */
const DAY_S = 24 * 60;

/** Real-time share of the day → time of day (0 midnight, 0.5 noon). Day gets most of it. */
const DAY_SEGMENTS: [number, number, number, number][] = [
  [0, 0.7, 0.27, 0.75], // morning to early evening: about 17 minutes
  [0.7, 0.8, 0.75, 0.84], // golden hour and sunset
  [0.8, 0.92, 0.84, 1.2], // a short blue night
  [0.92, 1, 1.2, 1.27], // dawn
];

interface Key {
  t: number;
  sun: string;
  sunI: number;
  sky: string;
  gnd: string;
  hemiI: number;
  zenith: string;
  horizon: string;
  haze: string;
  cloud: string;
}

const NIGHT: Omit<Key, "t"> = { sun: "#A9BEE8", sunI: 0.75, sky: "#7686B6", gnd: "#43503F", hemiI: 1.05, zenith: "#16213D", horizon: "#3B4A70", haze: "#4D5B7C", cloud: "#5A6480" };
// the 0.62 key is the valley's original look (see ATMOS and World.lights)
const KEYS: Key[] = [
  { t: 0, ...NIGHT },
  { t: 0.19, ...NIGHT },
  { t: 0.245, sun: "#FFB08A", sunI: 1.3, sky: "#C8B4C4", gnd: "#6E7552", hemiI: 1.1, zenith: "#55709F", horizon: "#EEC2A6", haze: "#C9B6B4", cloud: "#FFD2C0" },
  { t: 0.32, sun: "#FFE4C2", sunI: 2.6, sky: "#D2E2F0", gnd: "#879460", hemiI: 1.3, zenith: "#4786C6", horizon: "#D9E6EF", haze: "#CCDAE3", cloud: "#FFFFFF" },
  { t: 0.62, sun: "#FFD7A3", sunI: 2.9, sky: "#CFE0F0", gnd: "#86935F", hemiI: 1.35, zenith: "#3F80C4", horizon: "#D3E2EE", haze: "#C8D7E1", cloud: "#FFFFFF" },
  { t: 0.7, sun: "#FFB878", sunI: 2.8, sky: "#E2D4C8", gnd: "#8C8C5C", hemiI: 1.28, zenith: "#5379B5", horizon: "#F3D3A8", haze: "#E2CDB4", cloud: "#FFE6C8" },
  { t: 0.765, sun: "#FF9462", sunI: 1.8, sky: "#B2A2BC", gnd: "#5C5E48", hemiI: 1.15, zenith: "#3D4F86", horizon: "#E3A487", haze: "#B99C9A", cloud: "#F2A890" },
  { t: 0.81, sun: "#9DB0E0", sunI: 0.6, sky: "#7A88B4", gnd: "#47513F", hemiI: 1.05, zenith: "#1F2C50", horizon: "#56628C", haze: "#5A6688", cloud: "#6A7090" },
  { t: 0.86, ...NIGHT },
  { t: 1, ...NIGHT },
];
type ColorKey = "sun" | "sky" | "gnd" | "zenith" | "horizon" | "haze" | "cloud";
const COLOR_KEYS: ColorKey[] = ["sun", "sky", "gnd", "zenith", "horizon", "haze", "cloud"];
const KEY_COLORS = KEYS.map((k) => Object.fromEntries(COLOR_KEYS.map((c) => [c, new THREE.Color(k[c])])) as Record<ColorKey, THREE.Color>);

const SUNRISE = 0.24;
const SUNSET = 0.785;
/** Highest the sun climbs (sine of its elevation): a low, painterly sun all day. */
const SUN_HIGH = 0.515;
const MOON_DIR = new THREE.Vector3(-0.35, 0.8, 0.45).normalize();

const rnd = Math.random;
const approach = (v: number, target: number, step: number) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));
const smooth = THREE.MathUtils.smoothstep;

/** Pull a colour toward a cool grey of the same brightness (rain light). */
function overcast(c: THREE.Color, amount: number, dark: number) {
  const l = (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) * dark;
  return c.lerp(new THREE.Color(l * 0.94, l * 0.98, l * 1.05), amount);
}

export class Weather {
  /** Holds the clock still (for screenshots and testing). */
  hold = false;
  /** How dark it is: 0 in full day, 1 at night. */
  night = 0;
  /** 0..1, for lanterns: dusk, night and rain light them up. */
  lamps = 0;

  private s: WeatherSetup;
  private cycle = (0.58 - 0.27) / 0.48 * 0.7; // start mid-afternoon
  private tod = 0.58;
  private t = 0;
  // showers
  private phase: "clear" | "gather" | "rain" | "clearing" = "clear";
  private phaseLeft = 150 + rnd() * 120;
  private peak = 0.5;
  private rain = 0;
  private ov = 0;
  private wet = 0;
  /** Heaviest rain of the current shower (a rainbow needs a real shower first). */
  private rained = 0;
  private hurry = 1;
  private cover = 0.28;
  private coverTarget = 0.28;
  private coverLeft = 60;
  // after the rain
  private rainbow = 0;
  private rainbowT = -1;
  private glow = 0;
  // thunder: flashes are [start, length, brightness] from the strike
  private thunderLeft = 20;
  private strike: { t: number; flashes: [number, number, number][] } | null = null;
  // wind
  private windBase = 0.3;
  private windTarget = 0.3;
  private windLeft = 30;
  private gust = { t: 0, dur: 0, amp: 0 };
  private gustLeft = 8;
  private windAngle = 0.42;

  private frame: AmbientFrame;
  private fx: ((f: AmbientFrame) => void)[];
  private puddles: (f: AmbientFrame, sky: THREE.Color) => void;
  private birds: (f: AmbientFrame, force?: boolean) => void;
  private flyNow = false;
  private groundColor: THREE.Color;
  private tmp = new THREE.Color();

  constructor(setup: WeatherSetup, camera: THREE.PerspectiveCamera) {
    this.s = setup;
    const { scene, pond } = setup;
    this.fx = [createRain(scene), createSplashes(scene, pond), createMotes(scene), createDrift(scene), createPondMist(scene, pond)];
    this.puddles = createPuddles(scene, setup.puddles);
    this.birds = createBirds(scene);
    this.groundColor = setup.ground.color.clone();
    this.frame = {
      t: 0,
      dt: 0,
      camera,
      focus: new THREE.Vector3(),
      rain: 0,
      wind: 0.3,
      wet: 0,
      night: 0,
      light: 1,
      ambient: new THREE.Color(),
      sunLight: new THREE.Color(),
      haze: new THREE.Color(),
      mist: 0,
    };
  }

  /** Change the weather (dev hook): it eases in quickly, or jumps there with now. */
  force(kind: WeatherKind, now = false) {
    this.hurry = 6;
    if (kind === "clear") {
      this.phase = "clearing";
    } else if (kind === "rainbow") {
      this.rain = this.ov = 0;
      this.wet = Math.max(this.wet, 0.8);
      this.afterRain(true);
      this.phase = "clear";
      this.phaseLeft = 300;
    } else {
      this.peak = kind === "drizzle" ? 0.3 : kind === "rain" ? 0.55 : 1;
      this.phase = "rain";
      this.phaseLeft = 150 + rnd() * 60;
      if (kind === "storm") this.thunderLeft = 4;
    }
    if (now) {
      const raining = this.phase === "rain";
      this.ov = raining ? 0.55 + this.peak * 0.45 : 0;
      this.rain = raining ? this.peak : 0;
      if (raining) this.wet = 0.9;
      this.rained = this.rain;
    }
  }

  /** Jump to a time of day (0 midnight, 0.5 noon). */
  setTime(tod: number) {
    tod = ((tod % 1) + 1) % 1;
    const t = tod < DAY_SEGMENTS[0][2] ? tod + 1 : tod;
    for (const [c0, c1, t0, t1] of DAY_SEGMENTS) if (t >= t0 && t <= t1) this.cycle = c0 + ((t - t0) / (t1 - t0)) * (c1 - c0);
  }

  /** Send a flock of birds over (dev hook). */
  birdsNow() {
    this.flyNow = true;
  }

  get windTime() {
    return WEATHER_U.windTime.value;
  }

  update(dt: number, focus: THREE.Vector3) {
    this.t += dt;
    if (!this.hold) this.cycle = (this.cycle + dt / DAY_S) % 1;
    for (const [c0, c1, t0, t1] of DAY_SEGMENTS) if (this.cycle >= c0 && this.cycle < c1) this.tod = (t0 + ((this.cycle - c0) / (c1 - c0)) * (t1 - t0)) % 1;
    this.showers(dt);
    this.updateWind(dt);
    const flash = this.thunder(dt);
    this.light(flash);

    weatherState.rain = this.rain;
    weatherState.wind = WEATHER_U.wind.value;
    weatherState.thunder = flash;
    weatherState.timeOfDay = this.tod;

    const f = this.frame;
    f.t = this.t;
    f.dt = dt;
    f.focus.copy(focus);
    f.rain = this.rain;
    f.wind = WEATHER_U.wind.value;
    f.wet = this.wet;
    f.night = this.night;
    for (const fx of this.fx) fx(f);
    this.puddles(f, ATMOS.horizon);
    this.birds(f, this.flyNow);
    this.flyNow = false;
  }

  // ---- showers -----------------------------------------------------------------

  private showers(dt: number) {
    this.phaseLeft -= dt;
    let ovTarget = 0;
    let rainTarget = 0;
    switch (this.phase) {
      case "clear":
        if (this.phaseLeft <= 0) {
          this.phase = "gather";
          this.phaseLeft = 35;
          // mostly soft showers; about one in three is a proper downpour
          this.peak = rnd() < 0.68 ? 0.28 + rnd() * 0.27 : 0.65 + rnd() * 0.35;
        }
        break;
      case "gather":
        ovTarget = 0.55 + this.peak * 0.45;
        if (this.phaseLeft <= 0) {
          this.phase = "rain";
          this.phaseLeft = 90 + rnd() * 150;
        }
        break;
      case "rain":
        ovTarget = 0.55 + this.peak * 0.45;
        rainTarget = this.peak;
        if (this.phaseLeft <= 0) this.phase = "clearing";
        break;
      case "clearing":
        if (this.rain < 0.02 && this.ov < 0.35) {
          this.phase = "clear";
          this.phaseLeft = 240 + rnd() * 330;
          if (this.rained > 0.2) this.afterRain(rnd() < 0.75 && this.rained >= 0.3);
          this.rained = 0;
          this.hurry = 1;
        }
        break;
    }
    const k = dt * this.hurry;
    this.ov = approach(this.ov, ovTarget, k / 35);
    // it only rains under cloud
    this.rain = approach(this.rain, this.ov > 0.5 ? rainTarget : 0, k / (rainTarget > this.rain ? 25 : 18));
    if (this.hurry > 1 && this.phase === "rain" && Math.abs(this.rain - rainTarget) < 0.01) this.hurry = 1;
    this.rained = Math.max(this.rained, this.rain);
    // the ground soaks up quickly and dries slowly
    this.wet = this.rain > 0.05 ? Math.min(1, this.wet + dt * (0.02 + this.rain * 0.05)) : Math.max(0, this.wet - dt / 150);
    // fair-weather clouds come and go
    if ((this.coverLeft -= dt) <= 0) {
      this.coverLeft = 40 + rnd() * 60;
      this.coverTarget = 0.06 + rnd() * 0.4;
    }
    this.cover = approach(this.cover, this.coverTarget, dt / 120);
    // the rainbow holds a while, then fades; the clearing glow fades with it
    if (this.rainbowT >= 0) {
      this.rainbowT += dt;
      this.rainbow = smooth(this.rainbowT, 0, 10) * (1 - smooth(this.rainbowT, 45, 70));
      if (this.rainbowT > 70) this.rainbowT = -1;
    } else this.rainbow = 0;
    this.glow = Math.max(0, this.glow - dt / 60);
  }

  private afterRain(rainbow: boolean) {
    this.glow = 1;
    if (rainbow) this.rainbowT = 0;
  }

  // ---- wind ----------------------------------------------------------------------

  private updateWind(dt: number) {
    if ((this.windLeft -= dt) <= 0) {
      this.windLeft = 25 + rnd() * 40;
      this.windTarget = 0.12 + rnd() * 0.5;
    }
    this.windBase = approach(this.windBase, this.windTarget + this.rain * 0.22, dt * 0.012);
    // gusts: a few seconds of stronger wind every so often, more often on windy days
    const g = this.gust;
    if (g.t < g.dur) g.t += dt;
    else if ((this.gustLeft -= dt) <= 0) {
      this.gustLeft = 5 + rnd() * 14 * (1.2 - this.windBase);
      Object.assign(g, { t: 0, dur: 3 + rnd() * 4, amp: (0.12 + rnd() * 0.28) * (0.5 + this.windBase) });
    }
    const gust = g.t < g.dur ? g.amp * Math.sin((Math.PI * g.t) / g.dur) ** 2 : 0;
    const wind = THREE.MathUtils.clamp(this.windBase + gust, 0, 1);
    WEATHER_U.wind.value = wind;
    WEATHER_U.windTime.value += dt * (0.55 + wind * 1.5);
    // the wind slowly backs and veers around a prevailing westerly
    this.windAngle = 0.42 + Math.sin(this.t * 0.013) * 0.5 + Math.sin(this.t * 0.031 + 1) * 0.2;
    WEATHER_U.windDir.value.set(Math.cos(this.windAngle), Math.sin(this.windAngle));
    const c = WEATHER_U.cloud.value;
    const sp = (0.025 + wind * 0.04) * dt;
    c.x -= WEATHER_U.windDir.value.x * sp;
    c.y -= WEATHER_U.windDir.value.y * sp;
  }

  // ---- thunder -------------------------------------------------------------------

  /** A distant lightning flash now and then in heavy rain; returns its brightness this frame. */
  private thunder(dt: number) {
    if (this.rain > 0.6 && !this.strike && (this.thunderLeft -= dt) <= 0) {
      this.thunderLeft = (12 + rnd() * 25) / this.rain;
      const flashes: [number, number, number][] = [[0, 0.07, 0.7 + rnd() * 0.3]];
      for (let i = 0, at = 0.1; i < 1 + Math.floor(rnd() * 3); i++, at += 0.08 + rnd() * 0.15) flashes.push([at, 0.05 + rnd() * 0.08, 0.35 + rnd() * 0.6]);
      this.strike = { t: 0, flashes };
    }
    if (!this.strike) return 0;
    const s = this.strike;
    s.t += dt;
    let v = 0;
    for (const [at, len, b] of s.flashes) if (s.t >= at && s.t < at + len + 0.15) v = Math.max(v, b * (s.t < at + len ? 1 : 1 - (s.t - at - len) / 0.15));
    const end = Math.max(...s.flashes.map(([at, len]) => at + len + 0.15));
    if (s.t >= end) {
      this.strike = null;
      return 0;
    }
    // stays above zero for the whole strike, so the sound hears one strike, not several
    return Math.max(0.02, v);
  }

  // ---- light -----------------------------------------------------------------------

  private light(flash: number) {
    const { sun, hemi, scene } = this.s;
    const tod = this.tod;
    let i = 0;
    while (KEYS[i + 1].t < tod) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const k = smooth(tod, a.t, b.t);
    const col = (c: ColorKey, out: THREE.Color) => out.copy(KEY_COLORS[i][c]).lerp(KEY_COLORS[i + 1][c], k);
    const ov = this.ov;

    // where the light comes from: the sun by day, a high moon by night
    const u = (tod - SUNRISE) / (SUNSET - SUNRISE);
    const sinE = u > 0 && u < 1 ? SUN_HIGH * Math.sin(Math.PI * u) : -0.1;
    const sunUp = smooth(sinE, 0, 0.07);
    const moonUp = tod > 0.5 ? smooth(tod, 0.795, 0.83) : 1 - smooth(tod, 0.215, 0.24);
    if (sinE > 0) {
      const th = THREE.MathUtils.degToRad(46.8 + (0.697 - u) * 180);
      const cosE = Math.sqrt(1 - sinE * sinE);
      ATMOS.sunDir.set(cosE * Math.cos(th), sinE, cosE * Math.sin(th));
    } else ATMOS.sunDir.copy(MOON_DIR);
    this.night = 1 - THREE.MathUtils.clamp(smooth(tod, 0.2, 0.3) - smooth(tod, 0.745, 0.83), 0, 1);

    // sunlight, softened by cloud; warm and a touch brighter right after rain
    col("sun", sun.color).lerp(this.tmp.set("#FFC890"), this.glow * 0.35 * sunUp);
    sun.intensity = THREE.MathUtils.lerp(a.sunI, b.sunI, k) * Math.max(sunUp, moonUp) * (1 - ov * 0.85) * (1 + this.glow * 0.25);
    ATMOS.sunColor.copy(sun.color);
    // sky light: greyer under rain clouds, a cold flash of lightning
    overcast(col("sky", hemi.color), ov * 0.7, 0.92);
    col("gnd", hemi.groundColor);
    hemi.intensity = THREE.MathUtils.lerp(a.hemiI, b.hemiI, k) * (1 - ov * 0.2 - this.rain * 0.08) + flash * 2.4;
    overcast(col("zenith", ATMOS.zenith), ov * 0.85, 0.95);
    overcast(col("horizon", ATMOS.horizon), ov * 0.8, 0.86);
    overcast(col("haze", ATMOS.haze), ov * 0.85, 0.84);
    overcast(col("cloud", SKY.cloudTint.value), ov * 0.5, 0.9);
    SKY.overcast.value = ov;
    SKY.flash.value = flash;
    SKY.stars.value = smooth(this.night, 0.6, 1);

    // haze closes in while it rains
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(ATMOS.haze);
    fog.near = THREE.MathUtils.lerp(34, 13, this.rain) * (1 - ov * 0.2);
    fog.far = THREE.MathUtils.lerp(240, 100, this.rain) * (1 - ov * 0.15) * (1 - this.night * 0.2);

    // cloud shadows over the fields (fainter by moonlight, gone under full cloud)
    const c = WEATHER_U.cloud.value;
    c.z = Math.min(1, this.cover + ov * 0.6);
    c.w = 0.42 * (1 - ov * 0.75) * (sinE > 0 ? 1 : 0.5);
    // the rainbow faces away from the sun
    const rb = WEATHER_U.rainbow.value;
    rb.set(-ATMOS.sunDir.x, -ATMOS.sunDir.y, -ATMOS.sunDir.z, this.rainbow * sunUp * (1 - ov));

    // wet ground: darker and glossy
    this.s.ground.color.copy(this.groundColor).multiplyScalar(1 - this.wet * 0.25);
    this.s.ground.roughness = 1 - this.wet * 0.45;
    this.s.grassWet(this.wet);

    this.lamps = THREE.MathUtils.clamp(smooth(this.night, 0.15, 0.7) + ov * 0.45, 0, 1);

    const f = this.frame;
    f.light = THREE.MathUtils.clamp((sun.intensity / 2.9) * 0.55 + (hemi.intensity / 1.35) * 0.45, 0.2, 1.3);
    f.ambient.copy(hemi.color).multiplyScalar(hemi.intensity * 0.55);
    f.sunLight.copy(sun.color).multiplyScalar(sun.intensity);
    f.haze.copy(ATMOS.haze);
    // pond mist: at dawn, at dusk and after rain; wind thins it
    const dawn = smooth(tod, 0.18, 0.25) * (1 - smooth(tod, 0.3, 0.4));
    const dusk = smooth(tod, 0.74, 0.8) * 0.6;
    f.mist = Math.min(1, 0.08 + Math.max(dawn * 0.9, dusk * 0.7, this.night * 0.45, this.wet * 0.45, this.glow * 0.35)) * (1 - f.wind * 0.45);
  }
}
