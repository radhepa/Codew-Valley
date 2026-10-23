import * as THREE from "three";
import { model } from "../game/models.ts";

// Character portraits are rendered from the same 3D models as the world, so
// they always match (and update when the Blender models land).
const cache = new Map<string, Promise<string>>();

const FRAMING: Record<string, { y: number; dist: number; h: number }> = {
  pip: { y: 0.45, dist: 1.5, h: 0.42 },
  innkeeper: { y: 1.25, dist: 1.7, h: 1.3 },
  player: { y: 1.2, dist: 1.6, h: 1.25 },
};

export function portrait(name: string): Promise<string> {
  let p = cache.get(name);
  if (!p) {
    p = render(name).catch(() => "");
    cache.set(name, p);
  }
  return p;
}

async function render(name: string): Promise<string> {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#ffffff", "#c9a26b", 1.6));
  const key = new THREE.DirectionalLight("#fff1d6", 2.4);
  key.position.set(1.5, 2, 3);
  scene.add(key);
  const obj = await model(name);
  scene.add(obj);
  const f = FRAMING[name] ?? { y: 1, dist: 2, h: 1 };
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  cam.position.set(0.35, f.y + 0.1, f.dist);
  cam.lookAt(0, f.h, 0);
  renderer.render(scene, cam);
  const url = canvas.toDataURL("image/png");
  renderer.dispose();
  renderer.forceContextLoss();
  return url;
}
