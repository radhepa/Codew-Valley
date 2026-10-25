import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

// The look: soft, hazy, painterly countryside (think Legends: Arceus) rather
// than bright cartoon. Sky with drifting clouds, haze tinted to the horizon,
// layered hill silhouettes, and wind-swept grass and flower patches.

export const ATMOS = {
  zenith: new THREE.Color("#3F80C4"),
  horizon: new THREE.Color("#D3E2EE"),
  haze: new THREE.Color("#C8D7E1"),
  sunColor: new THREE.Color("#FFD7A3"),
  /** Direction the sunlight comes from (low, warm afternoon sun). */
  sunDir: new THREE.Vector3(0.62, 0.42, 0.66).normalize(),
};

/** Weather values the shaders share (weather.ts writes them every frame). */
export const WEATHER_U = {
  /** Wind phase: runs faster the stronger the wind, so nothing jumps when it changes. */
  windTime: { value: 0 },
  /** 0..1, 0.3 is the gentle default breeze. */
  wind: { value: 0.3 },
  /** Direction the wind blows toward, on the ground plane (x, z). */
  windDir: { value: new THREE.Vector2(1, 0.45).normalize() },
  /** Cloud shadows on the ground: drift offset x, z, coverage 0..1, darkness 0..1. */
  cloud: { value: new THREE.Vector4(0, 0, 0.3, 0.42) },
  /** Rainbow: anti-sun direction xyz, strength. */
  rainbow: { value: new THREE.Vector4(0, -1, 0, 0) },
};

/** Sky extras: rain clouds, lightning, cloud colour, stars. */
export const SKY = {
  overcast: { value: 0 },
  flash: { value: 0 },
  cloudTint: { value: new THREE.Color(1, 0.98, 0.95) },
  stars: { value: 0 },
};

const NOISE_GLSL = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}`;

/** Gradient sky dome with a soft sun glow and slowly drifting clouds. */
export function createSky(scene: THREE.Scene) {
  const uniforms = {
    zenith: { value: ATMOS.zenith },
    horizon: { value: ATMOS.horizon },
    sunDir: { value: ATMOS.sunDir },
    sunColor: { value: ATMOS.sunColor },
    time: { value: 0 },
    cloudShift: { value: new THREE.Vector2() },
    rainbow: WEATHER_U.rainbow,
    ...SKY,
  };
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 zenith, horizon, sunDir, sunColor, cloudTint;
      uniform float time, overcast, flash, stars;
      uniform vec2 cloudShift;
      uniform vec4 rainbow;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(horizon, zenith, pow(smoothstep(-0.02, 0.85, h), 0.65));
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        col += sunColor * (pow(sd, 6.0) * 0.22 + pow(sd, 64.0) * 0.35) * (1.0 - overcast * 0.85);
        // a few stars at night, hidden by cloud
        if (stars > 0.0 && d.y > 0.05) {
          vec2 sp = floor(d.xz / (d.y + 0.3) * 160.0);
          float st = step(0.9965, hash(sp)) * (0.5 + 0.5 * sin(time * 1.7 + hash(sp + 3.0) * 40.0));
          col += vec3(0.85, 0.9, 1.0) * st * stars * (1.0 - overcast);
        }
        // rainbow, in the drops left in the air after rain
        float rb = acos(clamp(dot(d, rainbow.xyz), -1.0, 1.0));
        float band = (rb - 0.705) / 0.04;
        if (rainbow.w > 0.0 && abs(band - 0.5) < 0.8) {
          vec3 spec = clamp(vec3(1.6 - abs(band - 0.95) * 2.6, 1.4 - abs(band - 0.5) * 2.6, 1.3 - abs(band - 0.05) * 2.6), 0.0, 1.0);
          col += spec * rainbow.w * 0.22 * smoothstep(-0.05, 0.1, d.y);
        }
        // clouds on a virtual plane above the valley; rain fills the sky with low grey cloud
        if (d.y > 0.0) {
          vec2 uv = d.xz / (d.y + 0.12) * 1.3 + vec2(time * 0.006, time * 0.002) + cloudShift;
          float n = fbm(uv);
          float c = smoothstep(0.52 - overcast * 0.42, 0.78 - overcast * 0.3, n) * smoothstep(0.0, 0.22 - overcast * 0.15, d.y);
          float lit = 0.85 + 0.15 * fbm(uv * 2.0 + 3.0);
          vec3 cloud = mix(vec3(0.93, 0.93, 0.95), vec3(1.0, 0.97, 0.92), sd * (1.0 - overcast)) * lit;
          // rain clouds: grey, darker underneath where they are thick
          cloud = mix(cloud, vec3(0.55, 0.58, 0.62) * (0.75 + 0.35 * lit) * (1.15 - smoothstep(0.4, 0.9, n) * 0.4), overcast);
          col = mix(col, cloud * cloudTint, c * mix(0.85, 0.97, overcast));
        }
        col += vec3(0.75, 0.8, 1.0) * flash * 0.9;
        // haze band at the horizon
        col = mix(col, horizon, smoothstep(0.12, 0.0, abs(h)) * 0.5);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(360, 32, 16), m);
  dome.frustumCulled = false;
  dome.renderOrder = -1;
  scene.add(dome);
  scene.fog = new THREE.Fog(ATMOS.haze, 34, 240);
  // the dome rides with the camera so it always stays inside the far plane
  return (t: number, camera: THREE.Camera) => {
    uniforms.time.value = t;
    // the sky's clouds drift the same way as their shadows on the ground
    uniforms.cloudShift.value.set(WEATHER_U.cloud.value.x * 0.25, WEATHER_U.cloud.value.y * 0.25);
    dome.position.copy(camera.position);
  };
}

/** Layers of rolling hills and far mountains that fade into the haze. */
export function createHills(scene: THREE.Scene) {
  const rnd = seeded(77);
  const layers = [
    { r: [62, 95], n: 22, h: [4, 9], w: [18, 34], color: "#86A06C" },
    { r: [110, 150], n: 18, h: [8, 15], w: [30, 55], color: "#9DB2A4" },
    { r: [180, 240], n: 14, h: [16, 30], w: [50, 90], color: "#B4C4D0" },
  ];
  for (const L of layers) {
    const mat = new THREE.MeshLambertMaterial({ color: L.color, flatShading: false });
    for (let i = 0; i < L.n; i++) {
      const a = (i / L.n) * Math.PI * 2 + rnd() * 0.3;
      const r = L.r[0] + rnd() * (L.r[1] - L.r[0]);
      const w = L.w[0] + rnd() * (L.w[1] - L.w[0]);
      const h = L.h[0] + rnd() * (L.h[1] - L.h[0]);
      const geo = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const hill = new THREE.Mesh(geo, mat);
      hill.position.set(Math.cos(a) * r, -1, Math.sin(a) * r);
      hill.scale.set(w, h, w * (0.6 + rnd() * 0.5));
      hill.rotation.y = rnd() * Math.PI;
      hill.receiveShadow = false;
      scene.add(hill);
    }
  }
}

/** Shared wind: bends instanced geometry by its height, with gusts rolling across the field. */
function windMaterial(base: THREE.MeshLambertMaterial, strength: number, grass = false) {
  const windStrength = { value: strength };
  base.onBeforeCompile = (shader) => {
    if (grass) grassShader(shader);
    shader.uniforms.windTime = WEATHER_U.windTime;
    shader.uniforms.wind = WEATHER_U.wind;
    shader.uniforms.windDir = WEATHER_U.windDir;
    shader.uniforms.windStrength = windStrength;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
uniform float windTime, wind, windStrength;
uniform vec2 windDir;
${NOISE_GLSL}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        // gusts roll across the field downwind; the breeze sets how far everything leans
        float gust = fbm(wp.xz * 0.045 - windDir * windTime * 0.16);
        float bend = (sin(windTime * 2.6 + wp.x * 0.35 + wp.z * 0.21) * 0.35 + gust * 1.2) * windStrength * (0.35 + wind * 2.2);
        float k = position.y * position.y;
        vec2 windOffset = windDir * bend * k;`,
      )
      // bend in world space (after the instance's own rotation) so the whole field leans one way
      .replace(
        "#include <project_vertex>",
        `vec4 mvPosition = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
        #endif
        mvPosition.xz += windOffset;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;`,
      );
    weatherShader(shader);
  };
  base.customProgramCacheKey = () => (grass ? "grass+wind+weather" : "wind+weather");
  base.userData.weather = true;
  return base;
}

/**
 * Grass blades: lit from straight above on both faces (three.js would flip the up normal on
 * back faces and leave half the field dark), and a sheen that rolls across the field with the gusts.
 */
function grassShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>
varying float vSheen;`)
    .replace("vec2 windOffset = windDir * bend * k;", `vec2 windOffset = windDir * bend * k;
        vSheen = max(0.0, gust - 0.42) * position.y * (0.5 + wind * 1.6);`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>
varying float vSheen;`)
    .replace("#include <color_fragment>", `#include <color_fragment>
  diffuseColor.rgb *= (1.0 + vSheen * 0.9) * (gl_FrontFacing ? 1.0 : 0.84);`)
    .replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>
  normal = normalize(vNormal);`);
}

/** Cloud shadows drifting over the ground and a rainbow in the air: added to every lit material's shader. */
const WEATHER_FRAG = /* glsl */ `
uniform vec4 cloud;
uniform vec4 rainbow;
float wxHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wxNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(wxHash(i), wxHash(i + vec2(1, 0)), u.x), mix(wxHash(i + vec2(0, 1)), wxHash(i + vec2(1, 1)), u.x), u.y);
}
float cloudShade(vec3 wp) {
  vec2 p = wp.xz * 0.016 + cloud.xy;
  float n = wxNoise(p) * 0.6 + wxNoise(p * 2.3 + 5.1) * 0.28 + wxNoise(p * 5.1 + 9.7) * 0.12;
  float c = smoothstep(1.0 - cloud.z - 0.16, 1.0 - cloud.z + 0.2, n);
  return 1.0 - c * cloud.w;
}`;

function weatherShader(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.uniforms.cloud = WEATHER_U.cloud;
  shader.uniforms.rainbow = WEATHER_U.rainbow;
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>
${WEATHER_FRAG}`)
    .replace(
      "#include <lights_fragment_end>",
      `#include <lights_fragment_end>
      vec3 wxWorld = transpose(mat3(viewMatrix)) * (-vViewPosition) + cameraPosition;
      float wxShade = cloudShade(wxWorld);
      reflectedLight.directDiffuse *= wxShade;
      reflectedLight.directSpecular *= wxShade;`,
    )
    .replace(
      "#include <fog_fragment>",
      `if (rainbow.w > 0.0) {
        // brighter the more lit drops lie along the view ray
        vec3 wxRay = wxWorld - cameraPosition;
        float wxDist = length(wxRay);
        float wxBand = (acos(clamp(dot(wxRay / wxDist, rainbow.xyz), -1.0, 1.0)) - 0.705) / 0.04;
        vec3 wxSpec = clamp(vec3(1.6 - abs(wxBand - 0.95) * 2.6, 1.4 - abs(wxBand - 0.5) * 2.6, 1.3 - abs(wxBand - 0.05) * 2.6), 0.0, 1.0);
        gl_FragColor.rgb += wxSpec * rainbow.w * 0.07 * (1.0 - exp(-wxDist / 45.0));
      }
      #include <fog_fragment>`,
    );
}

/** Give a lit material cloud shadows and the rainbow (once). */
export function addWeather(m: THREE.Material) {
  if (m.userData.weather || !((m as THREE.MeshStandardMaterial).isMeshStandardMaterial || (m as THREE.MeshLambertMaterial).isMeshLambertMaterial)) return;
  m.userData.weather = true;
  const prev = m.onBeforeCompile;
  const prevKey = m.customProgramCacheKey();
  m.onBeforeCompile = (shader, renderer) => {
    prev.call(m, shader, renderer);
    weatherShader(shader);
  };
  m.customProgramCacheKey = () => prevKey + "+weather";
  m.needsUpdate = true;
}

// smooth value noise for the meadow's colour patches (the CPU twin of vnoise/fbm above)
function hash2(x: number, z: number) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise2(x: number, z: number) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}
/** 0..1 noise with three octaves. */
export function fbm2(x: number, z: number) {
  return vnoise2(x, z) * 0.57 + vnoise2(x * 2.03 + 17.1, z * 2.03 + 17.1) * 0.29 + vnoise2(x * 4.1 + 3.7, z * 4.1 + 3.7) * 0.14;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const TIP = { lush: new THREE.Color("#A6C460"), gold: new THREE.Color("#C2C068"), deep: new THREE.Color("#7DA54E"), mint: new THREE.Color("#98C27A") };
/** How much darker a blade is at the root than at its tip (linear, per channel). */
export const GRASS_ROOT = new THREE.Color("#4A6A30");
const ROOT_K = new THREE.Vector3(GRASS_ROOT.r / TIP.lush.r, GRASS_ROOT.g / TIP.lush.g, GRASS_ROOT.b / TIP.lush.b);

/**
 * The meadow's sunlit tip colour at (x, z): broad lush, golden, deep and minty patches with
 * smaller mottling, so the field reads painted rather than flat. The ground shares it.
 */
export function meadowTip(x: number, z: number, out: THREE.Color) {
  const a = fbm2(x * 0.045, z * 0.045);
  const b = fbm2(x * 0.11 + 31, z * 0.11 - 7);
  out.copy(TIP.lush);
  out.lerp(TIP.gold, smooth(0.52, 0.74, a) * 0.6);
  out.lerp(TIP.deep, smooth(0.42, 0.24, a) * 0.85);
  out.lerp(TIP.mint, smooth(0.6, 0.78, b) * 0.45);
  return out.multiplyScalar(0.93 + fbm2(x * 0.35, z * 0.35) * 0.14);
}
/** The colour at the roots of the meadow at (x, z): what the ground under the grass shows. */
export function meadowRoot(x: number, z: number, out: THREE.Color) {
  meadowTip(x, z, out);
  return out.setRGB(out.r * ROOT_K.x, out.g * ROOT_K.y, out.b * ROOT_K.z);
}

export interface MeadowOptions {
  radius: number;
  height(x: number, z: number): number;
  /** False where grass shouldn't grow (paths, buildings, water, rocks). */
  clear(x: number, z: number, pad?: number): boolean;
}

/** Wind-swept tall grass and soft pink flower patches, all instanced. */
export function createMeadow(scene: THREE.Scene, o: MeadowOptions) {
  const rnd = seeded(4242);

  // grass blade: a tapered, slightly curved strip, dark at the root and sunlit at the tip
  const blade = new THREE.PlaneGeometry(0.17, 0.8, 1, 4);
  const pos = blade.getAttribute("position");
  const colors: number[] = [];
  // a brightness ramp from the dark root to the tip; each blade's colour (meadowTip) tints it
  const root = new THREE.Color().setRGB(ROOT_K.x, ROOT_K.y, ROOT_K.z);
  const tip = new THREE.Color(1, 1, 1);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.4;
    const t = Math.min(1, Math.max(0, y / 0.8)); // rounding can dip below 0, and pow(-x) is NaN
    pos.setX(i, pos.getX(i) * (1 - t * 0.85));
    pos.setY(i, y);
    pos.setZ(i, t * t * 0.12);
    c.copy(root).lerp(tip, Math.pow(t, 0.85));
    colors.push(c.r, c.g, c.b);
  }
  blade.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  // every blade lit like the ground beneath it: soft, no dark backsides
  const normals = blade.getAttribute("normal");
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 1, 0);

  const grassMat = windMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.28, true);
  // about the same density whatever the valley size (42k blades fit a radius of 30)
  const COUNT = Math.round(42000 * ((o.radius + 6) / 36) ** 2);
  const grass = new THREE.InstancedMesh(blade, grassMat, COUNT);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const tint = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < COUNT && tries < COUNT * 4; tries++) {
    // clumps: denser in noisy patches, sparse elsewhere
    const x = (rnd() - 0.5) * 2 * (o.radius + 6);
    const z = (rnd() - 0.5) * 2 * (o.radius + 6);
    const r = Math.hypot(x, z);
    if (r > o.radius + 6 || !o.clear(x, z, -0.7)) continue;
    // short, thinning grass toward paths, plots and the valley rim instead of a hard edge
    const edge = (o.clear(x, z, 0) ? 0.55 : 0) + (o.clear(x, z, 0.9) ? 0.45 : 0);
    const rim = 1 - smooth(o.radius + 2, o.radius + 6, r) * 0.7;
    const density = 0.5 + 0.5 * Math.sin(x * 0.23 + Math.sin(z * 0.19) * 2.2) * Math.cos(z * 0.17 - x * 0.05);
    if (rnd() > (0.5 + density * 0.5) * (0.45 + edge * 0.55)) continue;
    e.set((rnd() - 0.5) * 0.35, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.35);
    q.setFromEuler(e);
    const s = (0.55 + rnd() * 0.75 * (0.6 + density * 0.6)) * (0.4 + edge * 0.6) * rim;
    m.compose(new THREE.Vector3(x, o.height(x, z) - 0.02, z), q, new THREE.Vector3(0.9 + rnd() * 0.3, s, 1));
    grass.setMatrixAt(n, m);
    grass.setColorAt(n, meadowTip(x, z, tint).multiplyScalar(0.84 + rnd() * 0.24));
    n++;
  }
  grass.count = n;
  grass.receiveShadow = true;
  grass.frustumCulled = false;
  scene.add(grass);

  // flower patches: soft pinks with a few whites and pale yellows
  const head = new THREE.IcosahedronGeometry(0.075, 0);
  head.translate(0, 0.42, 0);
  const stem = new THREE.CylinderGeometry(0.008, 0.01, 0.42, 3);
  stem.translate(0, 0.21, 0);
  const headMat = windMaterial(new THREE.MeshLambertMaterial({ color: "#FFFFFF" }), 0.12);
  const stemMat = windMaterial(new THREE.MeshLambertMaterial({ color: "#5F7D45" }), 0.12);
  const FLOWERS = Math.round(3200 * (o.radius / 30) ** 2);
  const heads = new THREE.InstancedMesh(head, headMat, FLOWERS);
  const stems = new THREE.InstancedMesh(stem, stemMat, FLOWERS);
  const palette = ["#E9A6BF", "#F2BDD0", "#D98AAB", "#F7DDE6", "#F4F1EA", "#EED98F"];
  let f = 0;
  for (let p = 0; p < Math.round(40 * (o.radius / 30) ** 2) && f < FLOWERS; p++) {
    const a = rnd() * Math.PI * 2;
    const pr = 5 + rnd() * (o.radius - 4);
    const cx = Math.cos(a) * pr;
    const cz = Math.sin(a) * pr;
    const size = 1.5 + rnd() * 3;
    const main = Math.floor(rnd() * 3);
    const count = 40 + Math.floor(rnd() * 70);
    for (let i = 0; i < count && f < FLOWERS; i++) {
      const ang = rnd() * Math.PI * 2;
      const d = Math.sqrt(rnd()) * size;
      const x = cx + Math.cos(ang) * d;
      const z = cz + Math.sin(ang) * d * 0.7;
      if (Math.hypot(x, z) > o.radius + 2 || !o.clear(x, z, -0.8)) continue;
      const s = 0.7 + rnd() * 0.6;
      m.compose(new THREE.Vector3(x, o.height(x, z) - 0.02, z), q.setFromEuler(e.set((rnd() - 0.5) * 0.3, rnd() * 6, (rnd() - 0.5) * 0.3)), new THREE.Vector3(s, s, s));
      heads.setMatrixAt(f, m);
      stems.setMatrixAt(f, m);
      heads.setColorAt(f, tint.set(rnd() < 0.8 ? palette[main] : palette[3 + Math.floor(rnd() * 3)]));
      f++;
    }
  }
  heads.count = stems.count = f;
  for (const im of [heads, stems]) {
    im.frustumCulled = false;
    im.receiveShadow = true;
    scene.add(im);
  }
  // rain darkens the grass a little
  const dry = grassMat.color.clone();
  return (wet: number) => grassMat.color.copy(dry).multiplyScalar(1 - wet * 0.22);
}

/** Render with gentle bloom: only bright emissive things (lanterns, runes) glow. */
export function createComposer(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.32, 0.55, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return composer;
}

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}
