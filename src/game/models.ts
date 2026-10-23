import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLACEHOLDERS } from "./placeholders.ts";

// Loads public/models/<name>.glb when it exists (see ART.md), otherwise the
// procedural placeholder with the same node names.

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Object3D | null>>();

async function fetchGlb(name: string): Promise<THREE.Object3D | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/${name}.glb`, { cache: "no-cache" });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // The dev server answers unknown paths with index.html; only real glTF
    // binaries start with the "glTF" magic.
    if (buf.byteLength < 4 || new TextDecoder().decode(new Uint8Array(buf, 0, 4)) !== "glTF") return null;
    const gltf = await loader.parseAsync(buf, "");
    const scene = gltf.scene;
    scene.name = name;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) {
          const std = mt as THREE.MeshStandardMaterial;
          if (std.name?.toLowerCase().startsWith("glow") && std.emissive) {
            std.emissive.copy(std.color);
            std.emissiveIntensity = Math.max(std.emissiveIntensity, 1.8);
          }
        }
      }
    });
    return scene;
  } catch (err) {
    console.warn(`model ${name}: could not load, using placeholder`, err);
    return null;
  }
}

/** True once the real model for `name` has been found. */
export const realModels = new Set<string>();

export async function preload(names: string[]) {
  await Promise.all(
    names.map((n) => {
      if (!cache.has(n)) cache.set(n, fetchGlb(n).then((o) => (o && realModels.add(n), o)));
      return cache.get(n);
    }),
  );
}

/**
 * A fresh instance of a model. Call preload() first; seed varies the
 * placeholder's shape and colours so repeated trees and rocks differ.
 */
export async function model(name: string, seed = 1): Promise<THREE.Object3D> {
  await preload([name]);
  const real = await cache.get(name)!;
  if (real) return real.clone(true);
  const make = PLACEHOLDERS[name];
  if (!make) throw new Error(`no model or placeholder for ${name}`);
  return make(seed);
}
