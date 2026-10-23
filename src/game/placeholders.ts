import * as THREE from "three";

// Procedural stand-ins for every model in ART.md, with the same node names and
// pivots, so the game is fully playable before (or without) the Blender files.

const mats = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, opts: { glow?: boolean; opacity?: number } = {}): THREE.MeshStandardMaterial {
  const key = color + (opts.glow ? "g" : "") + (opts.opacity ?? "");
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true });
    if (opts.glow) {
      m.name = "glow";
      m.emissive = new THREE.Color(color);
      m.emissiveIntensity = 1.8;
    }
    if (opts.opacity !== undefined) {
      m.transparent = true;
      m.opacity = opts.opacity;
      m.roughness = 0.2;
    }
    mats.set(key, m);
  }
  return m;
}

const C = {
  grass: ["#7C9A52", "#5F7F43", "#98AE66", "#4B6A3A"],
  wood: ["#A0673A", "#7A4A2A", "#C58B52", "#5A3620"],
  stone: ["#A9A39A", "#8A847C", "#C9C2B6", "#6E6962"],
  thatch: ["#D9A84E", "#B9823A", "#E3B861"],
  plaster: ["#F2E3C6", "#E6CFA4"],
  glow: "#FFC861",
  door: "#4F7A5A",
  red: "#C8553D",
  pip: "#6CC46A",
  skin: "#F2C9A0",
};

/** Deterministic pseudo-random so placeholder detail is stable between loads. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
const pick = <T,>(r: () => number, a: T[]) => a[Math.floor(r() * a.length)];

function mesh(geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, name?: string) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  if (name) o.name = name;
  return o;
}
function box(w: number, h: number, d: number, color: string | THREE.Material, x = 0, y = 0, z = 0) {
  return mesh(new THREE.BoxGeometry(w, h, d), typeof color === "string" ? mat(color) : color, x, y, z);
}
/** Box spanning two corners (min/max), handy for wall pieces. */
function span(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string | THREE.Material) {
  return box(x1 - x0, y1 - y0, z1 - z0, color, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
function cyl(rt: number, rb: number, h: number, color: string | THREE.Material, x = 0, y = 0, z = 0, seg = 8) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), typeof color === "string" ? mat(color) : color, x, y, z);
}
function ball(r: number, color: string | THREE.Material, x = 0, y = 0, z = 0, detail = 1) {
  return mesh(new THREE.IcosahedronGeometry(r, detail), typeof color === "string" ? mat(color) : color, x, y, z);
}
/** A beam from point a to point b. */
function beam(a: THREE.Vector3, b: THREE.Vector3, t: number, color: string) {
  const len = a.distanceTo(b);
  const o = box(t, t, len, color);
  o.position.copy(a).add(b).multiplyScalar(0.5);
  o.lookAt(b);
  return o;
}
function group(name: string, ...kids: THREE.Object3D[]) {
  const g = new THREE.Group();
  g.name = name;
  if (kids.length) g.add(...kids);
  return g;
}

// ---- tavern ---------------------------------------------------------------

const FX = 3.8; // half width to wall line
const FZ = 2.8; // half depth to wall line
const FLOOR = 0.5;
const TOP = 3.7;
const RIDGE = 6.6;

export function tavern(): THREE.Group {
  const r = rng(7);
  const root = group("tavern");
  const stages: THREE.Group[] = [];
  const stage = (n: number) => {
    const g = group(`stage_${String(n).padStart(2, "0")}`);
    stages.push(g);
    root.add(g);
    return g;
  };

  // 1: survey stakes, strings, cleared patch
  {
    const s = stage(1);
    const patch = mesh(new THREE.CircleGeometry(1, 24), mat("#9B7653"), 0, 0.015, 0);
    patch.rotation.x = -Math.PI / 2;
    patch.scale.set(5.2, 4.2, 1);
    patch.castShadow = false;
    s.add(patch);
    const corners = [
      [-4.3, -3.3],
      [4.3, -3.3],
      [4.3, 3.3],
      [-4.3, 3.3],
    ];
    for (const [x, z] of corners) {
      s.add(box(0.14, 0.9, 0.14, C.wood[0], x, 0.45, z));
      s.add(box(0.16, 0.12, 0.02, C.red, x + 0.08, 0.8, z));
    }
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = corners[i];
      const [x1, z1] = corners[(i + 1) % 4];
      s.add(beam(new THREE.Vector3(x0, 0.6, z0), new THREE.Vector3(x1, 0.6, z1), 0.025, "#F0E6D0"));
    }
  }

  // 2: stone foundation
  {
    const s = stage(2);
    s.add(span(-FX, 0, -FZ, FX, 0.42, FZ, C.stone[3]));
    const ring = (x0: number, z0: number, x1: number, z1: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.round(len / 0.95);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const b = box(len / n - 0.06, 0.5 + r() * 0.08, 0.62, pick(r, C.stone), x0 + (x1 - x0) * t, 0.25, z0 + (z1 - z0) * t);
        b.rotation.y = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2 + (r() - 0.5) * 0.06;
        s.add(b);
      }
    };
    ring(-FX - 0.2, FZ + 0.2, FX + 0.2, FZ + 0.2);
    ring(FX + 0.2, -FZ - 0.2, -FX - 0.2, -FZ - 0.2);
    ring(-FX - 0.2, -FZ + 0.4, -FX - 0.2, FZ - 0.4);
    ring(FX + 0.2, -FZ + 0.4, FX + 0.2, FZ - 0.4);
  }

  // 3: floor planks
  {
    const s = stage(3);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const z = -FZ + (i + 0.5) * ((2 * FZ) / n);
      s.add(box(2 * FX + 0.1, 0.1, (2 * FZ) / n - 0.03, pick(r, [C.wood[0], C.wood[2], C.wood[0]]), (r() - 0.5) * 0.08, FLOOR + 0.05 + r() * 0.01, z));
    }
  }

  // 4: corner posts
  {
    const s = stage(4);
    for (const x of [-FX, FX]) for (const z of [-FZ, FZ]) s.add(box(0.5, TOP - FLOOR + 0.1, 0.5, C.wood[1], x, (FLOOR + TOP) / 2, z));
  }

  // 5: wall frame (top plates, rails, studs, braces)
  {
    const s = stage(5);
    const t = 0.32;
    const w = C.wood[1];
    s.add(box(2 * FX + 0.5, t, t, w, 0, TOP, FZ), box(2 * FX + 0.5, t, t, w, 0, TOP, -FZ));
    s.add(box(t, t, 2 * FZ, w, FX, TOP, 0), box(t, t, 2 * FZ, w, -FX, TOP, 0));
    for (const x of [-2.9, -1.7, -0.8, 0.8, 1.7, 2.9]) s.add(box(0.26, TOP - FLOOR, 0.26, w, x, (FLOOR + TOP) / 2, FZ));
    for (const x of [-1.3, 1.3]) s.add(box(0.26, TOP - FLOOR, 0.26, w, x, (FLOOR + TOP) / 2, -FZ));
    for (const sx of [-1, 1]) for (const z of [-0.65, 0.65]) s.add(box(0.26, TOP - FLOOR, 0.26, w, sx * FX, (FLOOR + TOP) / 2, z));
    s.add(box(2 * FX, 0.24, 0.24, w, 0, 2.15, -FZ));
    for (const sx of [-1, 1]) {
      s.add(beam(new THREE.Vector3(sx * FX, FLOOR + 0.3, -FZ), new THREE.Vector3(sx * 1.3, 2.1, -FZ), 0.2, w));
    }
  }

  // 6: plaster walls with timber trim; holes for the door and windows
  {
    const s = stage(6);
    const p = C.plaster[0];
    const zf = FZ;
    const d = 0.14;
    const y0 = FLOOR + 0.05;
    const y1 = TOP - 0.15;
    // front wall around the door (x -0.75..0.75, up to 2.9) and windows (1.8..2.8, 1.5..2.6)
    const front: [number, number, number, number][] = [
      [-FX, y0, -2.8, y1],
      [-2.8, y0, -1.8, 1.5],
      [-2.8, 2.6, -1.8, y1],
      [-1.8, y0, -0.75, y1],
      [-0.75, 2.9, 0.75, y1],
      [0.75, y0, 1.8, y1],
      [1.8, y0, 2.8, 1.5],
      [1.8, 2.6, 2.8, y1],
      [2.8, y0, FX, y1],
    ];
    for (const [x0, a, x1, b] of front) s.add(span(x0, a, zf - d / 2, x1, b, zf + d / 2, p));
    s.add(span(-FX, y0, -FZ - d / 2, FX, y1, -FZ + d / 2, p));
    for (const sx of [-1, 1]) {
      const x = sx * FX;
      const side: [number, number, number, number][] = [
        [-FZ, y0, -0.5, y1],
        [-0.5, y0, 0.5, 1.5],
        [-0.5, 2.6, 0.5, y1],
        [0.5, y0, FZ, y1],
      ];
      for (const [z0, a, z1, b] of side) s.add(span(x - d / 2, a, z0, x + d / 2, b, z1, p));
    }
    // timber trim on the front
    const w = C.wood[3];
    s.add(box(2 * FX, 0.14, 0.06, w, 0, 2.95, zf + 0.1));
    s.add(box(2 * FX, 0.14, 0.06, w, 0, y0 + 0.08, zf + 0.1));
    for (const sx of [-1, 1]) {
      s.add(beam(new THREE.Vector3(sx * FX, y0 + 0.1, zf + 0.1), new THREE.Vector3(sx * 2.9, 1.45, zf + 0.1), 0.12, w));
      s.add(box(0.06, 0.14, 2 * FZ, w, sx * (FX + 0.1), 2.95, 0));
    }
  }

  // 7: front door, step, hinges
  {
    const s = stage(7);
    const g = mat(C.door);
    const doorZ = FZ + 0.02;
    s.add(span(-0.65, FLOOR + 0.05, doorZ - 0.06, 0.65, 2.25, doorZ + 0.06, g));
    const arch = mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 16, 1, false, 0, Math.PI), g, 0, 2.25, doorZ);
    arch.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    s.add(arch);
    for (const x of [-0.33, 0, 0.33]) s.add(box(0.03, 1.7, 0.02, "#3E6148", x, 1.4, doorZ + 0.07));
    for (const y of [1.0, 2.0]) s.add(box(0.5, 0.08, 0.03, "#2F2A26", -0.4, y, doorZ + 0.08));
    s.add(ball(0.07, "#E2B84B", 0.45, 1.35, doorZ + 0.12, 0));
    s.add(box(1.8, 0.28, 0.8, C.stone[2], 0, 0.14, FZ + 0.65));
    s.add(box(1.4, 0.18, 0.5, C.stone[0], 0, 0.37, FZ + 0.42));
  }

  // 8: windows (frames, glass, shutters, flower boxes)
  {
    const s = stage(8);
    const glass = mat("#BFE3F0", { opacity: 0.7 });
    const frameC = C.wood[1];
    const addWindow = (cx: number, cz: number, alongX: boolean, front: boolean) => {
      const g = group("window");
      g.position.set(cx, 2.05, cz);
      if (!alongX) g.rotation.y = Math.PI / 2;
      g.add(box(1.0, 1.1, 0.04, glass));
      g.add(box(1.16, 0.1, 0.2, frameC, 0, 0.58, 0), box(1.16, 0.12, 0.26, frameC, 0, -0.58, 0.03));
      g.add(box(0.1, 1.1, 0.2, frameC, -0.53, 0, 0), box(0.1, 1.1, 0.2, frameC, 0.53, 0, 0));
      g.add(box(0.05, 1.1, 0.08, frameC), box(1.0, 0.05, 0.08, frameC));
      for (const sx of [-1, 1]) {
        const sh = box(0.5, 1.15, 0.05, C.door, sx * 0.88, 0, 0.12);
        sh.rotation.y = sx * -0.35;
        g.add(sh);
      }
      if (front) {
        g.add(box(1.2, 0.22, 0.3, C.wood[0], 0, -0.78, 0.2));
        const flowers = ["#E86A8A", "#F2C14E", "#F6F1E7", "#B07AE0"];
        for (let i = 0; i < 6; i++) g.add(ball(0.09, flowers[i % 4], -0.45 + i * 0.18, -0.6, 0.22, 0));
        for (let i = 0; i < 5; i++) g.add(ball(0.08, C.grass[1], -0.36 + i * 0.18, -0.64, 0.3, 0));
      }
      // the side walls' windows face outwards
      if (!alongX && cx < 0) g.rotation.y = -Math.PI / 2;
      s.add(g);
    };
    addWindow(-2.3, FZ + 0.03, true, true);
    addWindow(2.3, FZ + 0.03, true, true);
    addWindow(-FX - 0.03, 0, false, false);
    addWindow(FX + 0.03, 0, false, false);
  }

  // 9: thatched roof with gables and ridge
  {
    const s = stage(9);
    const eaveZ = FZ + 0.75;
    const eaveY = TOP - 0.25;
    const run = eaveZ;
    const rise = RIDGE - eaveY;
    const ang = Math.atan2(rise, run);
    const len = Math.hypot(run, rise) + 0.25;
    for (const sz of [-1, 1]) {
      for (let layer = 0; layer < 3; layer++) {
        const thick = 0.24;
        const slab = box(2 * FX + 1.3 - layer * 0.12, thick, len - layer * 1.3, C.thatch[layer % 3]);
        // layers get shorter toward the ridge; place each centre along the slope
        const along = (len - layer * 1.3) / 2 + layer * 1.3;
        const t = along / len;
        slab.position.set(0, eaveY + rise * (1 - t) + 0.14 + layer * 0.07, sz * (eaveZ * t));
        slab.rotation.x = sz * ang;
        s.add(slab);
      }
    }
    const shape = new THREE.Shape();
    shape.moveTo(-FZ, 0);
    shape.lineTo(FZ, 0);
    shape.lineTo(0, RIDGE - TOP - 0.1);
    shape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false });
    for (const sx of [-1, 1]) {
      const gable = mesh(gableGeo, mat(C.plaster[1]), sx * FX - 0.07, TOP - 0.1, 0);
      gable.rotation.y = Math.PI / 2;
      gable.position.x = sx * FX + (sx > 0 ? -0.07 : -0.07);
      s.add(gable);
      s.add(box(0.06, 0.12, 2 * FZ, C.wood[3], sx * (FX + 0.12), TOP + 0.6, 0));
    }
    const ridge = cyl(0.26, 0.26, 2 * FX + 1.4, C.thatch[1], 0, RIDGE + 0.2, 0, 7);
    ridge.rotation.z = Math.PI / 2;
    s.add(ridge);
  }

  // 10: stone chimney
  {
    const s = stage(10);
    const cx = 2.4;
    const cz = -1.3;
    for (let y = FLOOR; y < 7.4; y += 0.42) {
      s.add(box(0.95 + (r() - 0.5) * 0.06, 0.4, 0.95 + (r() - 0.5) * 0.06, pick(r, C.stone), cx + (r() - 0.5) * 0.04, y + 0.2, cz));
    }
    s.add(box(1.2, 0.18, 1.2, C.stone[3], cx, 7.55, cz));
    s.add(box(0.55, 0.3, 0.55, "#4A4540", cx, 7.75, cz));
  }

  // 11: lanterns by the door and a wall lantern
  {
    const s = stage(11);
    const glow = mat(C.glow, { glow: true });
    for (const x of [-1.25, 1.25]) {
      s.add(cyl(0.07, 0.09, 1.8, C.wood[3], x, 0.9, FZ + 0.85, 6));
      s.add(box(0.36, 0.06, 0.36, "#2F2A26", x, 1.82, FZ + 0.85));
      s.add(box(0.26, 0.34, 0.26, glow, x, 2.02, FZ + 0.85));
      s.add(mesh(new THREE.ConeGeometry(0.26, 0.22, 4), mat("#2F2A26"), x, 2.3, FZ + 0.85));
      const light = new THREE.PointLight(C.glow, 0, 7, 1.6);
      light.name = "lantern_light";
      light.position.set(x, 2.05, FZ + 1.1);
      s.add(light);
    }
    s.add(box(0.06, 0.06, 0.55, "#2F2A26", 1.05, 3.1, FZ + 0.3));
    s.add(box(0.2, 0.26, 0.2, glow, 1.05, 2.92, FZ + 0.52));
  }

  // 12: hanging sign, barrels, bench, crate, plants
  {
    const s = stage(12);
    const bx = -1.6;
    s.add(box(0.08, 0.08, 1.0, C.wood[3], bx, 3.25, FZ + 0.5));
    const sign = group("sign");
    sign.position.set(bx, 2.75, FZ + 0.9);
    sign.add(box(0.03, 0.4, 0.03, "#2F2A26", 0, 0.3, -0.3), box(0.03, 0.4, 0.03, "#2F2A26", 0, 0.3, 0.3));
    sign.add(box(0.1, 0.62, 0.95, C.wood[2]));
    const snakeM = mat(C.pip);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 1.6 - 0.4;
      sign.add(ball(0.07 - i * 0.004, snakeM, 0.07, Math.sin(a) * 0.12 - 0.05, -0.25 + i * 0.075, 0));
    }
    sign.add(ball(0.09, snakeM, 0.08, 0.06, 0.3, 0));
    sign.add(box(0.02, 0.025, 0.07, "#2F2A26", 0.16, 0.08, 0.3));
    s.add(sign);
    for (const [x, z] of [
      [-3.35, FZ + 0.75],
      [-2.75, FZ + 1.05],
    ]) {
      s.add(cyl(0.32, 0.27, 0.8, C.wood[0], x, 0.4, z, 10));
      s.add(cyl(0.335, 0.335, 0.06, "#4A4540", x, 0.18, z, 10), cyl(0.335, 0.335, 0.06, "#4A4540", x, 0.62, z, 10));
    }
    s.add(box(1.4, 0.1, 0.4, C.wood[2], 2.8, 0.5, FZ + 0.85));
    s.add(box(0.1, 0.45, 0.35, C.wood[1], 2.25, 0.25, FZ + 0.85), box(0.1, 0.45, 0.35, C.wood[1], 3.35, 0.25, FZ + 0.85));
    s.add(box(0.6, 0.6, 0.6, C.wood[2], -3.3, 0.3, FZ + 1.6));
    for (const [x, z] of [
      [-0.95, FZ + 0.85],
      [0.95, FZ + 0.85],
    ]) {
      s.add(cyl(0.18, 0.13, 0.3, "#B5523B", x, 0.15, z, 8));
      s.add(ball(0.24, C.grass[0], x, 0.42, z, 0));
    }
  }

  for (const g of stages) g.traverse((o) => ((o as THREE.Mesh).isMesh ? ((o.castShadow = true), (o.receiveShadow = true)) : 0));
  return root;
}

// ---- nature ---------------------------------------------------------------

export function treeOak(seed = 1): THREE.Group {
  const r = rng(seed * 31 + 3);
  const g = group("tree_oak");
  g.add(cyl(0.28, 0.42, 2.2, C.wood[1], 0, 1.1, 0, 7));
  const n = 3 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r();
    const rad = 1.1 + r() * 0.5;
    const leaf = ball(rad, pick(r, [C.grass[0], C.grass[1], C.grass[0]]), Math.cos(a) * 0.7, 2.9 + r() * 0.8, Math.sin(a) * 0.7, 1);
    leaf.name = `leaves_${i}`;
    g.add(leaf);
  }
  const top = ball(1.25, C.grass[2], 0, 3.9, 0, 1);
  top.name = "leaves_top";
  g.add(top);
  return g;
}

export function treePine(seed = 1): THREE.Group {
  const r = rng(seed * 17 + 5);
  const g = group("tree_pine");
  g.add(cyl(0.2, 0.3, 1.4, C.wood[3], 0, 0.7, 0, 6));
  const col = pick(r, [C.grass[3], "#4E8A3C"]);
  for (let i = 0; i < 3; i++) {
    const c = mesh(new THREE.ConeGeometry(1.5 - i * 0.38, 1.9, 7), mat(col), 0, 1.6 + i * 1.05, 0);
    c.name = `leaves_${i}`;
    c.rotation.y = r() * Math.PI;
    g.add(c);
  }
  return g;
}

export function stump(): THREE.Group {
  const g = group("tree_stump");
  g.add(cyl(0.38, 0.46, 0.45, C.wood[1], 0, 0.22, 0, 8));
  g.add(cyl(0.33, 0.33, 0.02, C.wood[2], 0, 0.455, 0, 8));
  return g;
}

function rockMesh(radius: number, seed: number, color: string) {
  const r = rng(seed);
  const geo = new THREE.DodecahedronGeometry(radius, 0);
  const pos = geo.getAttribute("position");
  // jitter shared vertices identically so the rock stays closed
  const seen = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
    let k = seen.get(key);
    if (k === undefined) {
      k = 0.82 + r() * 0.3;
      seen.set(key, k);
    }
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.72, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return mesh(geo, mat(color));
}

export function rockLarge(seed = 1): THREE.Group {
  const g = group("rock_large");
  const m = rockMesh(0.95, seed * 13 + 1, C.stone[0]);
  m.position.y = 0.5;
  const m2 = rockMesh(0.5, seed * 7 + 2, C.stone[1]);
  m2.position.set(0.7, 0.25, 0.3);
  g.add(m, m2);
  return g;
}

export function rockSmall(seed = 1): THREE.Group {
  const g = group("rock_small");
  const m = rockMesh(0.45, seed * 5 + 9, C.stone[2]);
  m.position.y = 0.22;
  g.add(m);
  return g;
}

export function bush(seed = 1): THREE.Group {
  const r = rng(seed * 3 + 11);
  const g = group("bush");
  for (let i = 0; i < 3; i++) g.add(ball(0.45 + r() * 0.2, pick(r, C.grass), (r() - 0.5) * 0.7, 0.35, (r() - 0.5) * 0.7, 1));
  if (r() > 0.5) for (let i = 0; i < 4; i++) g.add(ball(0.06, "#D9435A", (r() - 0.5) * 0.8, 0.5 + r() * 0.3, (r() - 0.5) * 0.8 + 0.2, 0));
  return g;
}

export function flowers(seed = 1): THREE.Group {
  const r = rng(seed * 19 + 7);
  const g = group("flowers");
  const cols = ["#E86A8A", "#F2C14E", "#F6F1E7", "#B07AE0", "#6FA8DC"];
  const c = pick(r, cols);
  for (let i = 0; i < 5; i++) {
    const x = (r() - 0.5) * 0.6;
    const z = (r() - 0.5) * 0.6;
    const h = 0.18 + r() * 0.15;
    g.add(cyl(0.012, 0.012, h, C.grass[1], x, h / 2, z, 3));
    g.add(ball(0.06, c, x, h, z, 0));
  }
  return g;
}

export function grassTuft(seed = 1): THREE.Group {
  const r = rng(seed * 23 + 1);
  const g = group("grass_tuft");
  for (let i = 0; i < 4; i++) {
    const blade = mesh(new THREE.ConeGeometry(0.05, 0.35 + r() * 0.2, 3), mat(pick(r, [C.grass[0], C.grass[2]])), (r() - 0.5) * 0.25, 0.18, (r() - 0.5) * 0.25);
    blade.rotation.set((r() - 0.5) * 0.5, 0, (r() - 0.5) * 0.5);
    blade.castShadow = false;
    g.add(blade);
  }
  return g;
}

export function fence(): THREE.Group {
  const g = group("fence");
  for (const x of [-1, 0, 1]) g.add(box(0.12, 0.9, 0.12, C.wood[1], x * 0.95, 0.45, 0));
  g.add(box(2.1, 0.1, 0.06, C.wood[0], 0, 0.65, 0), box(2.1, 0.1, 0.06, C.wood[0], 0, 0.35, 0));
  return g;
}

export function logPile(): THREE.Group {
  const g = group("log_pile");
  const rows = [3, 2, 1];
  rows.forEach((n, row) => {
    for (let i = 0; i < n; i++) {
      const l = cyl(0.2, 0.2, 1.3, C.wood[i % 2 ? 0 : 2], (i - (n - 1) / 2) * 0.42, 0.2 + row * 0.36, 0, 8);
      l.rotation.x = Math.PI / 2;
      g.add(l);
    }
  });
  return g;
}

export function stonePile(): THREE.Group {
  const g = group("stone_pile");
  const r = rng(99);
  for (let i = 0; i < 6; i++) {
    const m = rockMesh(0.28, i * 7 + 3, pick(r, C.stone));
    m.position.set((r() - 0.5) * 0.8, 0.15 + (i > 3 ? 0.25 : 0), (r() - 0.5) * 0.6);
    g.add(m);
  }
  return g;
}

export function runeStone(): THREE.Group {
  const g = group("rune_stone");
  const m = rockMesh(0.6, 42, C.stone[1]);
  m.scale.set(0.8, 2.3, 0.55);
  m.position.y = 0.75;
  g.add(m);
  const glow = mat("#7FE0C8", { glow: true });
  const marks: [number, number, number, number][] = [
    [0, 1.1, 0.04, 0.32],
    [-0.12, 0.85, 0.2, 0.04],
    [0.1, 0.65, 0.04, 0.22],
    [-0.08, 0.45, 0.16, 0.04],
  ];
  for (const [x, y, w, h] of marks) g.add(box(w, h, 0.04, glow, x, y, 0.36));
  g.add(cyl(0.8, 0.9, 0.12, C.stone[3], 0, 0.06, 0, 8));
  return g;
}

export function signpost(): THREE.Group {
  const g = group("signpost");
  g.add(cyl(0.07, 0.08, 1.6, C.wood[1], 0, 0.8, 0, 6));
  g.add(box(0.9, 0.32, 0.06, C.wood[2], 0.25, 1.35, 0));
  return g;
}

export function lanternPost(): THREE.Group {
  const g = group("lantern_post");
  g.add(cyl(0.07, 0.09, 2.1, C.wood[3], 0, 1.05, 0, 6));
  g.add(box(0.25, 0.3, 0.25, mat(C.glow, { glow: true }), 0, 2.2, 0));
  g.add(mesh(new THREE.ConeGeometry(0.24, 0.2, 4), mat("#2F2A26"), 0, 2.45, 0));
  return g;
}

// ---- mill -----------------------------------------------------------------

/** The Whistling Mill: tower at the origin, field on the -X side (ART.md). */
export function mill(): THREE.Group {
  const r = rng(11);
  const root = group("mill");
  const stage = (n: number) => {
    const g = group(`stage_${String(n).padStart(2, "0")}`);
    root.add(g);
    return g;
  };
  const onTower = (a: number, rad: number, y: number, o: THREE.Object3D) => {
    o.position.set(Math.sin(a) * rad, y, Math.cos(a) * rad);
    o.rotation.y = a;
    return o;
  };

  // 1: stakes in a circle, a string ring, a cleared patch
  {
    const s = stage(1);
    const patch = mesh(new THREE.CircleGeometry(3.2, 24), mat("#9B7653"), 0, 0.015, 0);
    patch.rotation.x = -Math.PI / 2;
    patch.castShadow = false;
    s.add(patch);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = new THREE.Vector3(Math.sin(a) * 2.6, 0.55, Math.cos(a) * 2.6);
      pts.push(p);
      s.add(box(0.12, 0.8, 0.12, C.wood[0], p.x, 0.4, p.z));
    }
    for (let i = 0; i < 8; i++) s.add(beam(pts[i], pts[(i + 1) % 8], 0.025, "#F0E6D0"));
  }
  // 2: round stone plinth
  {
    const s = stage(2);
    s.add(cyl(2.45, 2.6, 0.4, C.stone[3], 0, 0.2, 0, 18));
    for (let i = 0; i < 16; i++) s.add(onTower((i / 16) * Math.PI * 2, 2.5, 0.22, box(0.8, 0.36, 0.3, pick(r, C.stone))));
  }
  // 3: lower tower
  {
    const s = stage(3);
    s.add(cyl(2.05, 2.25, 3, C.stone[0], 0, 1.9, 0, 18));
    for (let i = 0; i < 10; i++) s.add(onTower(r() * 6.3, 2.12, 0.8 + r() * 2.4, box(0.5, 0.26, 0.12, pick(r, C.stone))));
  }
  // 4: upper tower, timber band
  {
    const s = stage(4);
    s.add(cyl(1.72, 2.05, 3.1, C.stone[2], 0, 4.95, 0, 18));
    for (let i = 0; i < 8; i++) s.add(onTower(r() * 6.3, 1.9, 3.8 + r() * 2.2, box(0.45, 0.24, 0.12, pick(r, C.stone))));
    s.add(cyl(1.82, 1.82, 0.22, C.wood[1], 0, 6.5, 0, 18));
  }
  // 5: door and steps
  {
    const s = stage(5);
    s.add(box(1.0, 1.55, 0.24, C.door, 0, 1.18, 2.2));
    const top = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.24, 12, 1, false, -Math.PI / 2, Math.PI), mat(C.door), 0, 1.95, 2.2);
    top.rotation.x = Math.PI / 2;
    s.add(top, box(1.2, 0.08, 0.3, C.wood[3], 0, 0.43, 2.32), ball(0.05, "#D9B65A", 0.32, 1.15, 2.34, 0));
    s.add(box(1.4, 0.2, 0.6, C.stone[1], 0, 0.1, 2.75), box(1.2, 0.2, 0.4, C.stone[0], 0, 0.3, 2.55));
  }
  // 6: shuttered windows
  {
    const s = stage(6);
    for (const [a, rad, y] of [[0.0, 1.98, 4.3], [1.2, 2.12, 2.4], [-1.4, 1.86, 5.3]] as [number, number, number][]) {
      const w = group("window");
      w.add(box(0.5, 0.62, 0.12, "#3A3530"), box(0.6, 0.08, 0.16, C.wood[1], 0, -0.35, 0.02));
      for (const sx of [-1, 1]) {
        const sh = box(0.26, 0.6, 0.05, C.door, sx * 0.4, 0, 0.06);
        sh.rotation.y = sx * 0.5;
        w.add(sh);
      }
      s.add(onTower(a, rad, y, w));
    }
  }
  // 7: gallery ring with a railing
  {
    const s = stage(7);
    s.add(cyl(2.9, 2.9, 0.12, C.wood[2], 0, 3.5, 0, 20));
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      s.add(box(0.08, 0.6, 0.08, C.wood[1], Math.sin(a) * 2.8, 3.85, Math.cos(a) * 2.8));
      if (i % 4 === 0) s.add(beam(new THREE.Vector3(Math.sin(a) * 2.1, 2.7, Math.cos(a) * 2.1), new THREE.Vector3(Math.sin(a) * 2.8, 3.45, Math.cos(a) * 2.8), 0.1, C.wood[3]));
    }
    const rail = mesh(new THREE.TorusGeometry(2.8, 0.05, 4, 24), mat(C.wood[0]), 0, 4.15, 0);
    rail.rotation.x = Math.PI / 2;
    s.add(rail);
  }
  // 8: rounded shingle cap
  {
    const s = stage(8);
    const cap = mesh(new THREE.SphereGeometry(1.95, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.wood[1]), 0, 6.6, 0);
    cap.scale.y = 1.15;
    s.add(cap, cyl(2.0, 2.0, 0.18, C.wood[3], 0, 6.62, 0, 18));
  }
  // 9: windshaft and hub
  {
    const s = stage(9);
    const shaft = cyl(0.14, 0.16, 1.5, C.wood[3], 0, 7, 2.35, 8);
    shaft.rotation.x = Math.PI / 2;
    s.add(shaft, ball(0.26, C.wood[1], 0, 7, 3.05, 1));
  }
  // 10: four lattice sails, spun by the game around the hub
  {
    const s = stage(10);
    const sails = group("sails");
    sails.position.set(0, 7, 3.15);
    for (let i = 0; i < 4; i++) {
      const arm = group("sail");
      arm.rotation.z = (i / 4) * Math.PI * 2 + 0.3;
      arm.add(box(0.16, 4.4, 0.1, C.wood[3], 0, 2.25, 0));
      arm.add(box(0.95, 3.3, 0.03, "#EFE6D2", 0.56, 2.7, 0.02));
      for (let k = 0; k < 5; k++) arm.add(box(1.0, 0.05, 0.06, C.wood[1], 0.55, 1.05 + k * 0.82, 0.05));
      sails.add(arm);
    }
    s.add(sails);
  }
  // 11: tilled field rows on the -X side
  const rows = [-7.9, -7.0, -6.1, -5.2, -4.3, -3.4];
  {
    const s = stage(11);
    s.add(span(-8.5, 0, -3.6, -2.8, 0.05, 3.6, "#6B4E33"));
    for (const x of rows) s.add(box(0.45, 0.14, 6.8, "#7A5A3C", x, 0.08, 0));
  }
  // 12: wheat
  {
    const s = stage(12);
    const stalk = mat("#C9A64E");
    const head = mat("#E8C766");
    for (const x of rows)
      for (let z = -3.2; z <= 3.2; z += 0.55) {
        const w = group(`wheat_${s.children.length}`);
        w.position.set(x + (r() - 0.5) * 0.12, 0.12, z);
        const h = 0.6 + r() * 0.25;
        w.add(mesh(new THREE.CylinderGeometry(0.035, 0.05, h, 4), stalk, 0, h / 2, 0));
        w.add(mesh(new THREE.ConeGeometry(0.08, 0.26, 5), head, 0, h + 0.08, 0));
        s.add(w);
      }
  }
  // 13: fence with a gate, flour sacks, a little cart
  {
    const s = stage(13);
    const post = (x: number, z: number) => s.add(box(0.12, 0.8, 0.12, C.wood[1], x, 0.4, z));
    const rail = (x0: number, z0: number, x1: number, z1: number) => {
      s.add(beam(new THREE.Vector3(x0, 0.55, z0), new THREE.Vector3(x1, 0.55, z1), 0.07, C.wood[0]));
      s.add(beam(new THREE.Vector3(x0, 0.3, z0), new THREE.Vector3(x1, 0.3, z1), 0.07, C.wood[0]));
    };
    const X0 = -8.7, X1 = -2.6, Z0 = -3.8, Z1 = 3.8;
    for (const [x0, z0, x1, z1] of [[X0, Z0, X1, Z0], [X0, Z0, X0, Z1], [X1, Z0, X1, Z1], [X0, Z1, -6.2, Z1], [-5.0, Z1, X1, Z1]] as number[][]) {
      rail(x0, z0, x1, z1);
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.5));
      for (let i = 0; i <= n; i++) post(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n);
    }
    const gate = box(1.1, 0.5, 0.06, C.wood[2], -5.6, 0.45, Z1 + 0.3);
    gate.rotation.y = 0.6;
    s.add(gate);
    for (const [x, z, sc] of [[1.5, 2.6, 1], [1.95, 2.3, 0.85], [1.7, 2.9, 0.8]]) {
      const sack = ball(0.32 * sc, "#E9DFC8", x, 0.28 * sc, z, 1);
      sack.scale.y = 1.2;
      s.add(sack, ball(0.08 * sc, "#B9A27A", x, 0.62 * sc, z, 0));
    }
    const cart = group("cart");
    cart.position.set(3.2, 0, 1.4);
    cart.rotation.y = -0.4;
    cart.add(box(1.2, 0.4, 0.8, C.wood[0], 0, 0.6, 0), box(0.08, 0.08, 1.2, C.wood[3], 0.9, 0.5, 0));
    for (const sz of [-1, 1]) {
      const wheel = cyl(0.32, 0.32, 0.08, C.wood[3], 0, 0.32, sz * 0.45, 10);
      wheel.rotation.x = Math.PI / 2;
      cart.add(wheel);
    }
    cart.add(ball(0.22, "#E9DFC8", -0.2, 0.95, 0, 1), ball(0.2, "#E9DFC8", 0.25, 0.92, 0.1, 1));
    s.add(cart);
  }
  // 14: lanterns, weather vane, sign
  {
    const s = stage(14);
    for (const sx of [-1, 1]) {
      s.add(box(0.06, 0.4, 0.06, "#2F2A26", sx * 0.85, 2.15, 2.25));
      s.add(box(0.2, 0.26, 0.2, mat(C.glow, { glow: true }), sx * 0.85, 1.85, 2.3));
    }
    s.add(cyl(0.03, 0.03, 1.0, "#2F2A26", 0, 9.3, 0, 5));
    const arrow = box(0.9, 0.05, 0.05, "#2F2A26", 0, 9.55, 0);
    arrow.rotation.y = 0.7;
    s.add(arrow, mesh(new THREE.ConeGeometry(0.09, 0.2, 4), mat("#2F2A26"), 0, 9.85, 0));
    s.add(box(0.06, 0.06, 0.7, "#2F2A26", 1.3, 2.7, 2.35), box(0.7, 0.5, 0.06, C.wood[2], 1.3, 2.3, 2.7));
    s.add(mesh(new THREE.ConeGeometry(0.12, 0.36, 5), mat("#E8C766"), 1.3, 2.3, 2.75));
  }
  return root;
}

// ---- characters -----------------------------------------------------------

interface Outfit {
  tunic: string;
  pants: string;
  hair: string;
  round?: boolean;
  apron?: boolean;
  moustache?: boolean;
}

function character(name: string, o: Outfit): THREE.Group {
  const root = group(name);
  const hip = 0.42;
  const body = group("body");
  body.position.y = hip;
  root.add(body);
  const w = o.round ? 0.62 : 0.5;
  const torso = mesh(new THREE.CapsuleGeometry(w / 2, 0.28, 4, 10), mat(o.tunic), 0, 0.3, 0);
  torso.scale.set(1, 1, o.round ? 0.9 : 0.75);
  body.add(torso);
  if (o.apron) body.add(box(w * 0.75, 0.42, 0.04, "#F6F1E7", 0, 0.22, w * 0.42));
  body.add(box(w * 0.98, 0.07, w * 0.8, "#5A3620", 0, 0.12, 0));
  // head pivot at the neck
  const head = group("head");
  head.position.y = 0.62;
  head.add(ball(0.34, C.skin, 0, 0.3, 0, 2));
  const hair = mesh(new THREE.SphereGeometry(0.36, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(o.hair), 0, 0.33, -0.02);
  head.add(hair);
  for (const sx of [-1, 1]) {
    head.add(ball(0.045, "#2B2320", sx * 0.12, 0.3, 0.31, 1));
    head.add(ball(0.05, "#F4A3A3", sx * 0.21, 0.2, 0.26, 0));
  }
  if (o.moustache) head.add(box(0.26, 0.06, 0.06, o.hair, 0, 0.17, 0.32));
  body.add(head);
  for (const sx of [-1, 1]) {
    const arm = group(sx < 0 ? "arm_l" : "arm_r");
    arm.position.set(sx * (w / 2 + 0.06), 0.5, 0);
    arm.add(mesh(new THREE.CapsuleGeometry(0.08, 0.22, 3, 6), mat(o.tunic), 0, -0.17, 0));
    arm.add(ball(0.085, C.skin, 0, -0.36, 0, 1));
    body.add(arm);
    const leg = group(sx < 0 ? "leg_l" : "leg_r");
    leg.position.set(sx * 0.12, 0, 0);
    leg.add(mesh(new THREE.CapsuleGeometry(0.09, 0.16, 3, 6), mat(o.pants), 0, -0.16, 0));
    leg.add(box(0.17, 0.1, 0.24, "#4A3426", 0, -0.37, 0.03));
    body.add(leg);
  }
  return root;
}

export function player(): THREE.Group {
  const p = character("player", { tunic: "#4A78B5", pants: "#6B5240", hair: "#7A4A2A" });
  const body = p.getObjectByName("body")!;
  body.add(box(0.2, 0.2, 0.08, C.wood[0], 0.2, 0.15, -0.25));
  return p;
}

export function innkeeper(): THREE.Group {
  return character("innkeeper", { tunic: "#B5523B", pants: "#5A3620", hair: "#5A3620", round: true, apron: true, moustache: true });
}

/** Wren the miller: straw hat, red scarf, flour-dusted apron. */
export function miller(): THREE.Group {
  const g = character("miller", { tunic: "#C9A13B", pants: "#6B5240", hair: "#B5603A", apron: true });
  const head = g.getObjectByName("head")!;
  head.add(cyl(0.56, 0.58, 0.04, "#E3C46E", 0, 0.56, 0, 16), cyl(0.25, 0.3, 0.22, "#E3C46E", 0, 0.68, 0, 12), cyl(0.305, 0.305, 0.05, C.red, 0, 0.6, 0, 12));
  const scarf = mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 12), mat(C.red), 0, 0.6, 0);
  scarf.rotation.x = Math.PI / 2;
  g.getObjectByName("body")!.add(scarf);
  return g;
}

export function pip(): THREE.Group {
  const g = group("pip");
  const m = mat(C.pip);
  const belly = mat("#C8E89A");
  for (let i = 0; i < 8; i++) {
    // coil from the neck (seg_01) spiralling down to the tail tip (seg_08)
    const t = i / 7;
    const a = t * Math.PI * 2.4;
    const rad = 0.08 + t * 0.2;
    const seg = ball(0.13 - t * 0.06, m, Math.cos(a) * rad, 0.38 - t * 0.3, Math.sin(a) * rad - 0.05, 1);
    seg.name = `seg_${String(i + 1).padStart(2, "0")}`;
    g.add(seg);
  }
  const head = group("pip_head");
  head.position.set(0, 0.52, 0.06);
  head.add(ball(0.17, m, 0, 0, 0, 2));
  head.add(ball(0.11, belly, 0, -0.06, 0.08, 1));
  for (const sx of [-1, 1]) {
    head.add(ball(0.065, "#FFFFFF", sx * 0.075, 0.05, 0.13, 1));
    head.add(ball(0.035, "#1E1A18", sx * 0.078, 0.05, 0.18, 1));
    head.add(ball(0.012, "#FFFFFF", sx * 0.07, 0.07, 0.205, 0));
  }
  const scarf = mesh(new THREE.TorusGeometry(0.13, 0.04, 6, 12), mat(C.red), 0, -0.14, 0);
  scarf.rotation.x = Math.PI / 2;
  head.add(scarf);
  const cap = cyl(0.12, 0.13, 0.05, "#2F3B5C", 0, 0.16, 0, 4);
  cap.rotation.y = Math.PI / 4;
  head.add(cap, ball(0.03, C.red, 0.08, 0.2, 0.08, 0));
  g.add(head);
  return g;
}

export const PLACEHOLDERS: Record<string, (seed?: number) => THREE.Object3D> = {
  tavern,
  mill,
  tree_oak: treeOak,
  tree_pine: treePine,
  tree_stump: stump,
  rock_large: rockLarge,
  rock_small: rockSmall,
  bush,
  flowers,
  grass_tuft: grassTuft,
  fence,
  log_pile: logPile,
  stone_pile: stonePile,
  rune_stone: runeStone,
  signpost,
  lantern_post: lanternPost,
  player,
  innkeeper,
  miller,
  pip,
};
