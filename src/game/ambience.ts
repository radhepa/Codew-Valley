import * as THREE from "three";
import { ATMOS, WEATHER_U } from "./atmosphere.ts";

// The small moving things that make the valley feel alive: rain, splashes and
// ripples, puddles, fireflies and pollen, leaves on the wind, birds, pond mist.
// Everything that comes in numbers is one instanced draw moved on the GPU, and
// each effect hides itself when there is nothing of it to see.

/** What every effect needs each frame (weather.ts fills it in). */
export interface AmbientFrame {
  t: number;
  dt: number;
  camera: THREE.PerspectiveCamera;
  /** Where the player is (effects gather around them). */
  focus: THREE.Vector3;
  rain: number;
  wind: number;
  /** How wet the ground is, 0..1. */
  wet: number;
  /** 0 in full day, 1 at night. */
  night: number;
  /** Overall brightness of the scene light, about 0.25 at night to 1 at noon. */
  light: number;
  /** Ambient (sky) colour, to light particles like the world around them. */
  ambient: THREE.Color;
  /** Sunlight colour times its strength right now. */
  sunLight: THREE.Color;
  /** Haze colour (for mist). */
  haze: THREE.Color;
  /** 0..1 how much mist hangs over the pond. */
  mist: number;
}

export interface Pond {
  x: number;
  z: number;
  r: number;
  /** Water surface height. */
  y: number;
}

const rand = (() => {
  let s = 9001;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();

/** A two-triangle quad: x from -0.5 to 0.5, second axis 0 to 1 (y, or z when flat). */
function quad(flat = false) {
  const g = new THREE.InstancedBufferGeometry();
  const p = flat ? [-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5] : [-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0];
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  return g;
}

function seeds(n: number, size = 4) {
  const a = new Float32Array(n * size);
  for (let i = 0; i < a.length; i++) a[i] = rand();
  return new THREE.InstancedBufferAttribute(a, size);
}

/** A shader material that fades into the scene fog like everything else. */
function fxMaterial(uniforms: Record<string, THREE.IUniform>, vertexShader: string, fragmentShader: string, opts: Partial<THREE.ShaderMaterialParameters> = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms },
    vertexShader,
    fragmentShader,
    fog: true,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    ...opts,
  });
}

/** Keep the material's fog uniforms matched to the scene fog. */
function syncFog(m: THREE.ShaderMaterial, scene: THREE.Scene) {
  const f = scene.fog as THREE.Fog | null;
  if (!f) return;
  m.uniforms.fogColor.value.copy(f.color);
  m.uniforms.fogNear.value = f.near;
  m.uniforms.fogFar.value = f.far;
}

const HASH_GLSL = /* glsl */ `
float h11(float p) { return fract(sin(p * 127.1) * 43758.5453); }
vec2 h21(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }`;

// ---- rain -------------------------------------------------------------------------

const RAIN_N = 7000;
const RAIN_BOX = new THREE.Vector3(38, 26, 38);

/** Thin streaks in a box that follows the camera; the drops themselves stay put in the world. */
export function createRain(scene: THREE.Scene) {
  const geo = quad();
  geo.setAttribute("seed", seeds(RAIN_N));
  geo.instanceCount = 0;
  const u = {
    center: { value: new THREE.Vector3() },
    box: { value: RAIN_BOX },
    drift: { value: new THREE.Vector3() },
    vel: { value: new THREE.Vector3(0, -9, 0) },
    tint: { value: new THREE.Color() },
    opacity: { value: 0.5 },
  };
  const mat = fxMaterial(
    u,
    /* glsl */ `
    attribute vec4 seed;
    uniform vec3 center, box, drift, vel;
    varying float vA;
    varying vec2 vUv;
    #include <fog_pars_vertex>
    void main() {
      vec3 lo = center - box * 0.5;
      vec3 p = lo + mod(seed.xyz * box + drift - lo, box);
      vec3 axis = normalize(vel);
      vec3 side = normalize(cross(axis, normalize(cameraPosition - p)));
      float len = 0.45 + seed.w * 0.45;
      vec3 wp = p + side * position.x * (0.016 + seed.w * 0.01) - axis * position.y * len;
      vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float d = -mvPosition.z;
      // none right in the lens, and they thin out with distance
      vA = smoothstep(1.2, 4.0, d) * (0.55 + seed.w * 0.45);
      vUv = vec2(position.x + 0.5, position.y);
      #include <fog_vertex>
    }`,
    /* glsl */ `
    uniform vec3 tint;
    uniform float opacity;
    varying float vA;
    varying vec2 vUv;
    #include <fog_pars_fragment>
    void main() {
      float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
      float a = across * mix(1.0, 0.15, vUv.y) * vA * opacity;
      gl_FragColor = vec4(tint, a);
      #include <fog_fragment>
    }`,
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  scene.add(mesh);
  const wind = new THREE.Vector3();
  return (f: AmbientFrame) => {
    geo.instanceCount = Math.round(RAIN_N * Math.min(1, f.rain * 1.1));
    mesh.visible = geo.instanceCount > 0;
    if (!mesh.visible) return;
    syncFog(mat, scene);
    const fall = 8 + f.rain * 3.5;
    const dir = WEATHER_U.windDir.value;
    wind.set(dir.x, 0, dir.y).multiplyScalar(0.6 + f.wind * 5);
    u.vel.value.set(wind.x, -fall, wind.z);
    u.drift.value.addScaledVector(u.vel.value, f.dt);
    // keep the offset small so the GPU's floats stay precise
    for (const k of ["x", "y", "z"] as const) u.drift.value[k] = ((u.drift.value[k] % RAIN_BOX[k]) + RAIN_BOX[k]) % RAIN_BOX[k];
    // the box sits between the camera and the player, so you see rain falling in front of you
    const c = f.camera.position;
    u.center.value.set(THREE.MathUtils.lerp(c.x, f.focus.x, 0.55), f.focus.y + RAIN_BOX.y * 0.42, THREE.MathUtils.lerp(c.z, f.focus.z, 0.55));
    u.tint.value.copy(f.ambient).multiplyScalar(0.55).add(new THREE.Color(0.32, 0.35, 0.4).multiplyScalar(f.light));
    u.opacity.value = 0.32 + f.rain * 0.22;
  };
}

// ---- splashes and ripples ---------------------------------------------------------

interface RingOptions {
  count: number;
  /** Seconds per splash (base and random extra). */
  period: [number, number];
  /** Ring size in metres (base and random extra). */
  size: [number, number];
  /** Rings per splash (1 on the ground, 2 on water). */
  rings: number;
  opacity: number;
}

/**
 * Rings that pop up at random spots, each instance hopping to a new spot every cycle.
 * Ground splashes scatter round the player (and turn into ripples on the pond);
 * pond ripples stay on the water.
 */
function createRings(scene: THREE.Scene, pond: Pond, o: RingOptions, onPond: boolean) {
  const geo = quad(true);
  geo.setAttribute("seed", seeds(o.count));
  geo.instanceCount = 0;
  const u = {
    time: { value: 0 },
    center: { value: new THREE.Vector3() },
    area: { value: 30 },
    pond: { value: new THREE.Vector4(pond.x, pond.z, pond.r, pond.y) },
    onPond: { value: onPond ? 1 : 0 },
    period: { value: new THREE.Vector2(...o.period) },
    size: { value: new THREE.Vector2(...o.size) },
    tint: { value: new THREE.Color() },
    opacity: { value: o.opacity },
  };
  const mat = fxMaterial(
    u,
    /* glsl */ `
    attribute vec4 seed;
    uniform float time, area, onPond;
    uniform vec3 center;
    uniform vec4 pond;
    uniform vec2 period, size;
    varying vec2 vUv;
    varying float vT, vWater;
    #include <fog_pars_vertex>
    ${HASH_GLSL}
    void main() {
      float per = period.x + seed.w * period.y;
      float ph = time / per + seed.z * 7.0;
      float cyc = floor(ph);
      vT = fract(ph);
      vec2 h = h21(vec2(cyc * 1.37 + seed.x * 93.1, seed.y * 71.7 - cyc * 0.61));
      vec2 xz;
      if (onPond > 0.5) {
        float r = sqrt(h.x) * pond.z * 0.9;
        xz = pond.xy + vec2(cos(h.y * 6.2832), sin(h.y * 6.2832)) * r;
      } else {
        xz = center.xz + (h - 0.5) * area;
      }
      vWater = step(length(xz - pond.xy), pond.z - 0.15);
      float y = mix(0.035, pond.w + 0.012, vWater);
      float s = (size.x + seed.w * size.y) * mix(1.0, 1.8, vWater * (1.0 - onPond));
      vec4 mvPosition = viewMatrix * vec4(xz.x + position.x * s, y, xz.y + position.z * s, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vUv = position.xz * 2.0;
      #include <fog_vertex>
    }`,
    /* glsl */ `
    uniform vec3 tint;
    uniform float opacity;
    varying vec2 vUv;
    varying float vT, vWater;
    #include <fog_pars_fragment>
    float ring(float r, float at, float w) { return smoothstep(w, 0.0, abs(r - at)); }
    void main() {
      float r = length(vUv);
      if (r > 1.0) discard;
      float t = vT;
      float a = ring(r, t * 0.92, 0.07 + t * 0.05);
      ${o.rings > 1 ? "a += ring(r, t * 0.6, 0.06) * 0.6;" : ""}
      // a bright dot where the drop lands, on hard ground
      a += (1.0 - vWater) * smoothstep(0.22, 0.0, r) * smoothstep(0.25, 0.0, t) * 1.2;
      a *= (1.0 - t) * (1.0 - t) * opacity;
      gl_FragColor = vec4(tint, a);
      #include <fog_fragment>
    }`,
    { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 },
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  scene.add(mesh);
  return { mesh, geo, mat, u };
}

export function createSplashes(scene: THREE.Scene, pond: Pond) {
  const ground = createRings(scene, pond, { count: 900, period: [0.45, 0.4], size: [0.2, 0.18], rings: 1, opacity: 0.75 }, false);
  const water = createRings(scene, pond, { count: 140, period: [1.1, 1.2], size: [0.45, 0.6], rings: 2, opacity: 0.5 }, true);
  return (f: AmbientFrame) => {
    ground.geo.instanceCount = Math.round(900 * Math.min(1, f.rain * 1.15));
    // a few lazy ripples even in fine weather (water striders, a fish)
    const near = Math.hypot(f.focus.x - pond.x, f.focus.z - pond.z) < 40;
    water.geo.instanceCount = near ? Math.round(3 + 137 * Math.min(1, f.rain * 1.2)) : 0;
    for (const r of [ground, water]) {
      r.mesh.visible = r.geo.instanceCount > 0;
      if (!r.mesh.visible) continue;
      syncFog(r.mat, scene);
      r.u.time.value = f.t;
      r.u.tint.value.copy(f.ambient).multiplyScalar(0.6).addScalar(0.25 * f.light);
    }
    ground.u.center.value.set(THREE.MathUtils.lerp(f.camera.position.x, f.focus.x, 0.7), 0, THREE.MathUtils.lerp(f.camera.position.z, f.focus.z, 0.75));
  };
}

// ---- puddles -------------------------------------------------------------------------

/** Dark, glossy puddles on the paths that fill while it rains and dry slowly after. */
export function createPuddles(scene: THREE.Scene, spots: { x: number; z: number; r: number }[]) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (const s of spots) {
    const base = pos.length / 3;
    pos.push(s.x, 0, s.z);
    col.push(1, 1, 1, 1);
    const n = 14;
    const ph = rand() * 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      // a lumpy edge so they don't read as circles, with a soft wet rim around it
      const r = s.r * (0.78 + 0.16 * Math.sin(a * 2 + ph) + 0.08 * Math.sin(a * 5 + ph * 2));
      pos.push(s.x + Math.cos(a) * r * 0.8, 0, s.z + Math.sin(a) * r * 0.56, s.x + Math.cos(a) * r * 1.25, 0, s.z + Math.sin(a) * r * 0.9);
      col.push(1, 1, 1, 1, 1, 1, 1, 0);
      const i0 = base + 1 + i * 2;
      const i1 = base + 1 + ((i + 1) % n) * 2;
      idx.push(base, i1, i0, i0, i1, i1 + 1, i0, i1 + 1, i0 + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 4));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: "#46423A", vertexColors: true, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.025;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return (f: AmbientFrame, sky: THREE.Color) => {
    mesh.visible = f.wet > 0.05;
    if (!mesh.visible) return;
    mat.opacity = Math.min(0.85, (f.wet - 0.05) * 1.3);
    // a little of the sky shows in the water
    mat.emissive.copy(sky).multiplyScalar(0.1 * f.light);
  };
}

// ---- fireflies and pollen ------------------------------------------------------------

interface MoteOptions {
  count: number;
  box: THREE.Vector3;
  /** Height above the ground of the box's bottom. */
  floor: number;
  size: number;
  color: string;
  additive: boolean;
  /** Fireflies blink; pollen just glints. */
  blink: boolean;
}

function moteCloud(scene: THREE.Scene, o: MoteOptions) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(o.count * 3), 3));
  geo.setAttribute("seed", new THREE.Float32BufferAttribute(Array.from({ length: o.count * 4 }, rand), 4));
  const u = {
    time: { value: 0 },
    center: { value: new THREE.Vector3() },
    box: { value: o.box },
    drift: { value: new THREE.Vector3() },
    size: { value: o.size },
    px: { value: 600 },
    tint: { value: new THREE.Color(o.color) },
    amount: { value: 0 },
    floor: { value: o.floor },
  };
  const mat = fxMaterial(
    u,
    /* glsl */ `
    attribute vec4 seed;
    uniform float time, size, px, amount, floor;
    uniform vec3 center, box, drift;
    varying float vA;
    #include <fog_pars_vertex>
    void main() {
      vec3 lo = center - box * 0.5;
      vec3 p = lo + mod(seed.xyz * box + drift * (0.6 + seed.w * 0.8) - lo, box);
      p.y = floor + seed.y * box.y;
      // lazy wandering
      float ph = seed.w * 40.0;
      p += vec3(sin(time * 0.31 + ph) * 1.4, sin(time * 0.53 + ph * 1.3) * 0.45, cos(time * 0.27 + ph * 0.7) * 1.4);
      vec4 mvPosition = viewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      ${o.blink ? "float on = pow(max(0.0, sin(time * (0.9 + seed.x) + ph)), 5.0);" : "float on = 0.55 + 0.45 * sin(time * (2.0 + seed.x * 3.0) + ph);"}
      // only some of them come out when the amount is low
      vA = on * smoothstep(seed.z, seed.z + 0.15, amount * 1.15);
      gl_PointSize = size * px / -mvPosition.z * (0.7 + seed.x * 0.6);
      #include <fog_vertex>
    }`,
    /* glsl */ `
    uniform vec3 tint;
    varying float vA;
    #include <fog_pars_fragment>
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = smoothstep(1.0, 0.0, d);
      a = a * a * vA;
      if (a < 0.003) discard;
      gl_FragColor = vec4(tint, a);
      #include <fog_fragment>
    }`,
    o.additive ? { blending: THREE.AdditiveBlending } : {},
  );
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.renderOrder = 3;
  scene.add(pts);
  return { pts, mat, u };
}

export function createMotes(scene: THREE.Scene) {
  // fireflies over the meadow at dusk: they glow (bloom catches them)
  const flies = moteCloud(scene, { count: 220, box: new THREE.Vector3(44, 2.4, 44), floor: 0.25, size: 0.22, color: "#D9F27A", additive: true, blink: true });
  // pollen and seed fluff drifting in the afternoon light
  const pollen = moteCloud(scene, { count: 160, box: new THREE.Vector3(34, 4.5, 34), floor: 0.4, size: 0.07, color: "#FFF1C4", additive: false, blink: false });
  const base = new THREE.Color("#D9F27A");
  return (f: AmbientFrame) => {
    const dir = WEATHER_U.windDir.value;
    const px = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(f.camera.fov / 2)));
    const fireflies = THREE.MathUtils.smoothstep(f.night, 0.35, 0.8) * (1 - Math.min(1, f.rain * 2.5));
    const motes = (1 - f.night) * (1 - Math.min(1, f.rain * 3)) * 0.9;
    for (const [m, amount] of [
      [flies, fireflies],
      [pollen, motes],
    ] as const) {
      m.u.amount.value = amount;
      m.pts.visible = amount > 0.01;
      if (!m.pts.visible) continue;
      syncFog(m.mat, scene);
      m.u.time.value = f.t;
      m.u.px.value = px;
      m.u.center.value.set(f.focus.x, 0, f.focus.z - 4);
      m.u.drift.value.x += dir.x * (0.15 + f.wind * 1.2) * f.dt;
      m.u.drift.value.z += dir.y * (0.15 + f.wind * 1.2) * f.dt;
    }
    flies.u.tint.value.copy(base).multiplyScalar(2.6);
    // pollen is lit by the sun
    pollen.u.tint.value.set("#FFF1C4").multiplyScalar(0.35 + f.light * 0.75);
  };
}

// ---- leaves and petals on the wind -------------------------------------------------------

const DRIFT_N = 400;
const DRIFT_BOX = new THREE.Vector3(46, 9, 46);

/** Leaves, petals and seed fluff carried along in gusts, tumbling as they go. */
export function createDrift(scene: THREE.Scene) {
  const geo = quad();
  geo.setAttribute("seed", seeds(DRIFT_N));
  const palette = ["#8EA35A", "#A9B565", "#C9A55A", "#F0B8CB", "#F4D4DE", "#F3EFE4"].map((c) => new THREE.Color(c));
  const col = new Float32Array(DRIFT_N * 3);
  for (let i = 0; i < DRIFT_N; i++) palette[Math.floor(rand() * palette.length)].toArray(col, i * 3);
  geo.setAttribute("tint", new THREE.InstancedBufferAttribute(col, 3));
  geo.instanceCount = DRIFT_N;
  const u = {
    time: { value: 0 },
    center: { value: new THREE.Vector3() },
    box: { value: DRIFT_BOX },
    drift: { value: new THREE.Vector3() },
    amount: { value: 0 },
    sunDir: { value: ATMOS.sunDir },
    sunCol: { value: new THREE.Color() },
    ambCol: { value: new THREE.Color() },
  };
  const mat = fxMaterial(
    u,
    /* glsl */ `
    attribute vec4 seed;
    attribute vec3 tint;
    uniform float time, amount;
    uniform vec3 center, box, drift;
    varying vec2 vUv;
    varying vec3 vN, vTint;
    varying float vA;
    #include <fog_pars_vertex>
    mat3 spin(vec3 ax, float a) {
      float s = sin(a), c = cos(a), oc = 1.0 - c;
      return mat3(oc * ax.x * ax.x + c, oc * ax.x * ax.y + ax.z * s, oc * ax.z * ax.x - ax.y * s,
                  oc * ax.x * ax.y - ax.z * s, oc * ax.y * ax.y + c, oc * ax.y * ax.z + ax.x * s,
                  oc * ax.z * ax.x + ax.y * s, oc * ax.y * ax.z - ax.x * s, oc * ax.z * ax.z + c);
    }
    void main() {
      float sp = 0.7 + seed.w * 0.6;
      vec3 lo = center - box * 0.5;
      vec3 p = lo + mod(seed.xyz * box + drift * sp - lo, box);
      float ph = seed.w * 50.0;
      p += vec3(sin(time * 1.3 + ph), sin(time * 2.1 + ph) * 0.5, cos(time * 1.1 + ph)) * 0.35;
      vec3 ax = normalize(vec3(seed.x - 0.5, seed.y - 0.5 + 0.3, seed.z - 0.5) + 0.001);
      mat3 r = spin(ax, time * (2.0 + seed.w * 3.0) + ph);
      // only some fly when it's calm; they shrink away near the ground and the top of the box
      float hy = (p.y - lo.y) / box.y;
      float s = (0.19 + seed.z * 0.1) * smoothstep(seed.x, seed.x + 0.1, amount * 1.1) * smoothstep(0.0, 0.08, hy) * smoothstep(1.0, 0.85, hy);
      vec3 local = vec3(position.x, position.y - 0.5, 0.0) * vec3(s, s * 1.5, s);
      vec4 mvPosition = viewMatrix * vec4(p + r * local, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vN = r * vec3(0.0, 0.0, 1.0);
      vUv = vec2(position.x * 2.0, position.y * 2.0 - 1.0);
      vTint = tint;
      vA = step(0.0001, s);
      #include <fog_vertex>
    }`,
    /* glsl */ `
    uniform vec3 sunDir, sunCol, ambCol;
    varying vec2 vUv;
    varying vec3 vN, vTint;
    varying float vA;
    #include <fog_pars_fragment>
    void main() {
      // a leaf/petal outline: pointed at both ends
      float w = 1.0 - vUv.y * vUv.y;
      if (abs(vUv.x) > w * 0.9 || vA < 0.5) discard;
      vec3 c = vTint * (ambCol + sunCol * (0.35 + 0.65 * abs(dot(normalize(vN), sunDir))));
      gl_FragColor = vec4(c, 1.0);
      #include <fog_fragment>
    }`,
    { side: THREE.DoubleSide, transparent: false, depthWrite: true },
  );
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  scene.add(mesh);
  let fall = 0;
  return (f: AmbientFrame) => {
    // only a few drift on a calm day; gusts send whole flurries
    const amount = THREE.MathUtils.clamp((f.wind - 0.25) * 1.5, 0.04, 1) * (1 - f.rain * 0.6);
    u.amount.value = amount;
    mesh.visible = amount > 0.02;
    if (!mesh.visible) return;
    syncFog(mat, scene);
    const dir = WEATHER_U.windDir.value;
    const speed = 0.8 + f.wind * 7;
    fall += f.dt * 0.55;
    u.drift.value.set(u.drift.value.x + dir.x * speed * f.dt, -fall, u.drift.value.z + dir.y * speed * f.dt);
    u.time.value = f.t;
    u.center.value.set(f.focus.x, f.focus.y + DRIFT_BOX.y * 0.5 - 0.3, f.focus.z - 3);
    u.sunCol.value.copy(f.sunLight).multiplyScalar(0.35);
    u.ambCol.value.copy(f.ambient).multiplyScalar(0.55);
  };
}

// ---- birds --------------------------------------------------------------------------------

/** Now and then a small flock crosses the valley, wings flapping then gliding. */
export function createBirds(scene: THREE.Scene) {
  const mat = new THREE.MeshLambertMaterial({ color: "#5E544C", side: THREE.DoubleSide });
  const bodyGeo = new THREE.SphereGeometry(0.07, 6, 4).scale(1, 0.8, 2.4);
  const wingGeo = new THREE.BufferGeometry();
  // one wing: a swept-back triangle off the body's side
  wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.1, 0.42, 0, -0.08, 0, 0, -0.1, 0.42, 0, -0.08, 0.3, 0, -0.16, 0, 0, -0.1], 3));
  wingGeo.computeVertexNormals();
  const flock = new THREE.Group();
  const birds: { obj: THREE.Group; wl: THREE.Mesh; wr: THREE.Mesh; off: THREE.Vector3; ph: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, mat);
    const wl = new THREE.Mesh(wingGeo, mat);
    const wr = new THREE.Mesh(wingGeo, mat);
    wr.scale.x = -1;
    for (const m of [body, wl, wr]) {
      m.castShadow = true;
      b.add(m);
    }
    const row = Math.ceil(i / 2);
    const side = i === 0 ? 0 : i % 2 ? 1 : -1;
    // a loose V
    const off = new THREE.Vector3(side * row * 0.9 + (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.5, -row * 0.8 + (rand() - 0.5) * 0.3);
    b.scale.setScalar(0.85 + rand() * 0.3);
    flock.add(b);
    birds.push({ obj: b, wl, wr, off, ph: rand() * 6 });
  }
  flock.visible = false;
  scene.add(flock);
  const from = new THREE.Vector3();
  const to = new THREE.Vector3();
  let t = 0;
  let dur = 0;
  let wait = 25 + rand() * 30;
  const fly = (f: AmbientFrame) => {
    // the camera looks steeply down, so they skim the rooftops just beyond the player
    const a = (rand() - 0.5) * 0.7 + (rand() < 0.5 ? 0 : Math.PI);
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const mid = f.focus.clone().add(new THREE.Vector3((rand() - 0.5) * 12, 0, -3 + rand() * 7));
    from.copy(mid).addScaledVector(dir, -45);
    to.copy(mid).addScaledVector(dir, 45);
    from.y = to.y = 3.8 + rand() * 0.8;
    to.y += (rand() - 0.5) * 0.8;
    dur = 90 / (6.5 + rand() * 2);
    t = 0;
    flock.visible = true;
    flock.lookAt(to.x, flock.position.y, to.z);
  };
  return (f: AmbientFrame, force = false) => {
    if (!flock.visible || force) {
      wait -= f.dt;
      // birds keep to fine daylight
      if (force || (wait <= 0 && f.rain < 0.15 && f.night < 0.5)) {
        fly(f);
        wait = 35 + rand() * 50;
      }
      return;
    }
    t += f.dt;
    const k = t / dur;
    if (k >= 1) {
      flock.visible = false;
      return;
    }
    flock.position.lerpVectors(from, to, k);
    flock.position.y += Math.sin(k * Math.PI * 2) * 0.6;
    flock.lookAt(to.x, flock.position.y, to.z);
    for (const b of birds) {
      b.obj.position.copy(b.off);
      b.obj.position.y += Math.sin(f.t * 1.3 + b.ph) * 0.15;
      // bursts of flapping, then a glide with wings held slightly up
      const flapping = Math.sin(f.t * 0.9 + b.ph) > -0.2;
      const w = flapping ? Math.sin(f.t * 13 + b.ph) * 0.65 : 0.12;
      b.wl.rotation.z = w;
      b.wr.rotation.z = -w;
    }
  };
}

// ---- mist over the pond ----------------------------------------------------------------------

/** Soft layers of mist that hang over the water at dawn, at dusk and after rain. */
export function createPondMist(scene: THREE.Scene, pond: Pond) {
  const u = {
    time: { value: 0 },
    tint: { value: new THREE.Color() },
    amount: { value: 0 },
    shift: { value: new THREE.Vector2() },
  };
  const mat = fxMaterial(
    u,
    /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    #include <fog_pars_vertex>
    void main() {
      vUv = uv;
      vec4 w = modelMatrix * vec4(position, 1.0);
      vWorld = w.xyz;
      vec4 mvPosition = viewMatrix * w;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`,
    /* glsl */ `
    uniform vec3 tint;
    uniform float amount, time;
    uniform vec2 shift;
    varying vec2 vUv;
    varying vec3 vWorld;
    #include <fog_pars_fragment>
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    void main() {
      vec2 p = vWorld.xz * 0.45 + shift;
      float n = vnoise(p) * 0.55 + vnoise(p * 2.1 + vec2(time * 0.05, 3.0)) * 0.3 + vnoise(p * 4.3 - time * 0.03) * 0.15;
      float edge = smoothstep(1.0, 0.45, length(vUv - 0.5) * 2.0);
      float a = smoothstep(0.42, 0.85, n) * edge * amount;
      gl_FragColor = vec4(tint, a * 0.32);
      #include <fog_fragment>
    }`,
  );
  const layers: THREE.Mesh[] = [];
  for (const [y, s] of [
    [0.2, 3.1],
    [0.55, 3.6],
  ]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pond.r * s, pond.r * s).rotateX(-Math.PI / 2), mat);
    m.position.set(pond.x, pond.y + y, pond.z);
    m.renderOrder = 4;
    scene.add(m);
    layers.push(m);
  }
  return (f: AmbientFrame) => {
    u.amount.value = f.mist;
    const on = f.mist > 0.02;
    for (const l of layers) l.visible = on;
    if (!on) return;
    syncFog(mat, scene);
    u.time.value = f.t;
    const dir = WEATHER_U.windDir.value;
    u.shift.value.x -= dir.x * (0.05 + f.wind * 0.25) * f.dt;
    u.shift.value.y -= dir.y * (0.05 + f.wind * 0.25) * f.dt;
    u.tint.value.copy(f.haze).lerp(f.ambient, 0.3).multiplyScalar(0.9 + f.light * 0.2);
  };
}
