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

// Line art for a voice with no model (heard off-screen): a lantern, in the workshop's wood brown.
const svg = (body: string) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="#8a5a32" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`);
const VOICE = svg(`<path d="M26 18h12M28 18v-4h8v4M24 22h16l-2 22H26z"/><path d="M24 44h16v4H24z"/><path d="M32 27c-3 4-3 8 0 11 3-3 3-7 0-11z" fill="#c49352" fill-opacity=".45"/><path d="M18 30c-2 3-2 7 0 10M46 30c2 3 2 7 0 10"/>`);
/** Dev: `?noportrait` draws an initial instead of rendering (a second WebGL context crashes headless screenshot runs). */
const STAND_IN = typeof location !== "undefined" && new URLSearchParams(location.search).has("noportrait");

export function portrait(name: string): Promise<string> {
  if (name === "voice") return Promise.resolve(VOICE);
  if (STAND_IN) return Promise.resolve(svg(`<circle cx="32" cy="32" r="20"/><text x="32" y="40" text-anchor="middle" font-family="serif" font-size="22" fill="#8a5a32" stroke="none">${name.slice(0, 1).toUpperCase()}</text>`));
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
