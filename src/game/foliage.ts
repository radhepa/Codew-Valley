import * as THREE from "three";
import { WEATHER_U } from "./atmosphere.ts";

// Trees and bushes: fuller, softer canopies. Each leaf clump is shaded as one soft ball
// (its normals bent toward the clump's centre), sunlight glows through the leaves at the
// edges, the leaves flutter in the wind, and every tree gets its own shade of green.

function leafShader(shader: THREE.WebGLProgramParametersWithUniforms, tint: { value: number }) {
  shader.uniforms.windTime = WEATHER_U.windTime;
  shader.uniforms.wind = WEATHER_U.wind;
  shader.uniforms.treeTint = tint;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", `#include <common>
uniform float windTime, wind;`)
    .replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vec3 lfWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      // leaves flutter a little, more in a stronger wind
      float lfAmp = 0.03 * (0.5 + wind * 2.5) / max(0.5, length(modelMatrix[0].xyz));
      transformed += vec3(sin(windTime * 3.1 + lfWorld.x * 1.9 + lfWorld.y * 2.3), sin(windTime * 2.2 + lfWorld.y * 3.1) * 0.5, sin(windTime * 2.6 + lfWorld.z * 1.7 + lfWorld.y * 1.9)) * lfAmp;`,
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>
uniform float treeTint;`)
    .replace(
      "#include <color_fragment>",
      `#include <color_fragment>
      // some trees a touch more golden, some a deeper blue-green
      diffuseColor.rgb *= mix(vec3(0.88, 0.97, 0.9), vec3(1.1, 1.05, 0.84), treeTint);`,
    )
    .replace(
      "#include <lights_fragment_end>",
      `#if NUM_DIR_LIGHTS > 0
      {
        // sunlight through the leaves: a soft glow on the canopy's edges, strongest against the sun
        vec3 lfView = normalize(vViewPosition);
        float lfRim = pow(1.0 - saturate(dot(normal, lfView)), 2.5);
        float lfBack = 0.3 + 0.7 * saturate(dot(-lfView, directionalLights[0].direction));
        reflectedLight.directDiffuse += diffuseColor.rgb * directionalLights[0].color * lfRim * lfBack * 0.4;
      }
      #endif
      #include <lights_fragment_end>`,
    );
}

/** Bend a leaf clump's normals toward its centre so the clump shades as one soft, full shape. */
function softenClump(meshes: THREE.Mesh[], amount: number) {
  const box = new THREE.Box3();
  for (const m of meshes) {
    m.geometry.computeBoundingBox();
    box.union(m.geometry.boundingBox!);
  }
  const c = box.getCenter(new THREE.Vector3());
  const half = box.getSize(new THREE.Vector3()).multiplyScalar(0.5).max(new THREE.Vector3(0.01, 0.01, 0.01));
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const s = new THREE.Vector3();
  for (const m of meshes) {
    const g = m.geometry;
    if (g.userData.softened) continue;
    g.userData.softened = true;
    const pos = g.getAttribute("position");
    const nor = g.getAttribute("normal");
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i);
      s.copy(p).sub(c).divide(half);
      // lift the clump's centre a little so its underside reads darker, its top sunlit
      s.y += 0.25;
      s.normalize();
      n.fromBufferAttribute(nor, i).lerp(s, amount).normalize();
      nor.setXYZ(i, n.x, n.y, n.z);
    }
    nor.needsUpdate = true;
  }
}

/**
 * Give a tree or bush (any "leaves*" parts) the soft canopy look; tint 0..1 picks its shade of
 * green. Shared geometry is only changed once. Call it after the materials are cloned (addFade).
 */
export function foliage(root: THREE.Object3D, amount = 0.6, tint = 0.5) {
  const treeTint = { value: tint };
  root.traverse((o) => {
    if (!/^leaves/i.test(o.name)) return;
    const meshes: THREE.Mesh[] = [];
    o.traverse((c) => (c as THREE.Mesh).isMesh && meshes.push(c as THREE.Mesh));
    softenClump(meshes, amount);
    for (const m of meshes)
      for (const mt of [m.material].flat()) {
        if (mt.userData.foliage) continue;
        mt.userData.foliage = true;
        (mt as THREE.MeshStandardMaterial).flatShading = false;
        const prev = mt.onBeforeCompile;
        const prevKey = mt.customProgramCacheKey();
        mt.onBeforeCompile = (shader, renderer) => {
          prev.call(mt, shader, renderer);
          leafShader(shader, treeTint);
        };
        mt.customProgramCacheKey = () => prevKey + "+leaves";
        mt.needsUpdate = true;
      }
  });
}
