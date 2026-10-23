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
      uniform vec3 zenith, horizon, sunDir, sunColor;
      uniform float time;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = clamp(d.y, -0.2, 1.0);
        vec3 col = mix(horizon, zenith, pow(smoothstep(-0.02, 0.85, h), 0.65));
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        col += sunColor * (pow(sd, 6.0) * 0.22 + pow(sd, 64.0) * 0.35);
        // clouds on a virtual plane above the valley
        if (d.y > 0.0) {
          vec2 uv = d.xz / (d.y + 0.12) * 1.3 + vec2(time * 0.006, time * 0.002);
          float n = fbm(uv);
          float c = smoothstep(0.52, 0.78, n) * smoothstep(0.0, 0.22, d.y);
          float lit = 0.85 + 0.15 * fbm(uv * 2.0 + 3.0);
          vec3 cloud = mix(vec3(0.93, 0.93, 0.95), vec3(1.0, 0.97, 0.92), sd) * lit;
          col = mix(col, cloud, c * 0.85);
        }
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
function windMaterial(base: THREE.MeshLambertMaterial, strength: number, uniforms: { time: { value: number } }) {
  base.onBeforeCompile = (shader) => {
    shader.uniforms.time = uniforms.time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float time;\n${NOISE_GLSL}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float gust = fbm(wp.xz * 0.045 + vec2(time * 0.12, time * 0.05));
        float bend = (sin(time * 1.7 + wp.x * 0.35 + wp.z * 0.21) * 0.35 + gust * 1.2) * ${strength.toFixed(3)};
        float k = position.y * position.y;
        vec2 windOffset = vec2(bend, bend * 0.45) * k;`,
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
  };
  return base;
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
  const uniforms = { time: { value: 0 } };

  // grass blade: a tapered, slightly curved strip, dark at the root and sunlit at the tip
  const blade = new THREE.PlaneGeometry(0.17, 0.8, 1, 4);
  const pos = blade.getAttribute("position");
  const colors: number[] = [];
  const root = new THREE.Color("#6E8C48");
  const tip = new THREE.Color("#D2DA93");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) + 0.4;
    const t = Math.min(1, Math.max(0, y / 0.8)); // rounding can dip below 0, and pow(-x) is NaN
    pos.setX(i, pos.getX(i) * (1 - t * 0.85));
    pos.setY(i, y);
    pos.setZ(i, t * t * 0.12);
    c.copy(root).lerp(tip, Math.pow(t, 0.8));
    colors.push(c.r, c.g, c.b);
  }
  blade.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  // every blade lit like the ground beneath it: soft, no dark backsides
  const normals = blade.getAttribute("normal");
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 1, 0);

  const grassMat = windMaterial(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.28, uniforms);
  // about the same density whatever the valley size (42k blades fit a radius of 30)
  const COUNT = Math.round(42000 * ((o.radius + 6) / 36) ** 2);
  const grass = new THREE.InstancedMesh(blade, grassMat, COUNT);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const tint = new THREE.Color();
  const tints = ["#FFFFFF", "#F2F5E6", "#E6EFD2", "#FFF4DC"];
  let n = 0;
  for (let tries = 0; n < COUNT && tries < COUNT * 4; tries++) {
    // clumps: denser in noisy patches, sparse elsewhere
    const x = (rnd() - 0.5) * 2 * (o.radius + 6);
    const z = (rnd() - 0.5) * 2 * (o.radius + 6);
    const r = Math.hypot(x, z);
    if (r > o.radius + 6 || !o.clear(x, z, -0.7)) continue;
    const density = 0.5 + 0.5 * Math.sin(x * 0.23 + Math.sin(z * 0.19) * 2.2) * Math.cos(z * 0.17 - x * 0.05);
    if (rnd() > 0.5 + density * 0.5) continue;
    e.set((rnd() - 0.5) * 0.35, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.35);
    q.setFromEuler(e);
    const s = 0.55 + rnd() * 0.75 * (0.6 + density * 0.6);
    m.compose(new THREE.Vector3(x, o.height(x, z) - 0.02, z), q, new THREE.Vector3(1, s, 1));
    grass.setMatrixAt(n, m);
    grass.setColorAt(n, tint.set(tints[Math.floor(rnd() * tints.length)]));
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
  const headMat = windMaterial(new THREE.MeshLambertMaterial({ color: "#FFFFFF" }), 0.12, uniforms);
  const stemMat = windMaterial(new THREE.MeshLambertMaterial({ color: "#5F7D45" }), 0.12, uniforms);
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
  return (t: number) => (uniforms.time.value = t);
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
