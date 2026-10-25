import * as THREE from "three";

// Props for heart-event scenes: small procedural meshes in the valley's palette (flat-shaded,
// warm wood, paper and brass). No characters: the old caravan crew are never shown, only
// what they leave around them (mugs, a wagon, lanterns, a table full of light).

const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, o: { emissive?: string; glow?: number; rough?: number; map?: THREE.Texture } = {}) {
  const key = `${color}|${o.emissive ?? ""}|${o.glow ?? 0}|${o.rough ?? 0.8}|${o.map?.uuid ?? ""}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.8, flatShading: true, map: o.map ?? null });
    if (o.emissive) {
      m.emissive.set(o.emissive);
      m.emissiveIntensity = o.glow ?? 1.5;
    }
    mats.set(key, m);
  }
  return m;
}

const WOOD = "#8f5f3c";
const WOOD_DARK = "#5f3d27";
const WOOD_LIGHT = "#b98a5a";
const PAPER = "#efe3c4";
const LEATHER = "#7a3e2b";
const BRASS = "#c39a4e";
const CLOTH = "#e6dcc2";
const CERAMIC = "#b98a5c";
const STRING = "#b8463a";

function box(w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true;
  b.receiveShadow = true;
  return b;
}
function cyl(rt: number, rb: number, h: number, m: THREE.Material, seg = 10) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  c.castShadow = true;
  c.receiveShadow = true;
  return c;
}
const group = (...kids: THREE.Object3D[]) => {
  const g = new THREE.Group();
  g.add(...kids);
  return g;
};

/** A page of handwriting on paper, drawn on a canvas (lines are the text, one per row). */
function page(lines: string[], o: { w?: number; h?: number; title?: string; ink?: string } = {}) {
  const W = 512;
  const H = Math.round(W * ((o.h ?? 1.3) / (o.w ?? 1)));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, W, H);
  // foxing and rule lines
  g.globalAlpha = 0.18;
  for (let i = 0; i < 9; i++) {
    g.fillStyle = "#b08a52";
    g.beginPath();
    g.arc((i * 137) % W, (i * 271) % H, 10 + (i % 4) * 9, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 0.35;
  g.strokeStyle = "#9fb3c4";
  for (let y = 90; y < H - 20; y += 44) {
    g.beginPath();
    g.moveTo(30, y);
    g.lineTo(W - 30, y);
    g.stroke();
  }
  g.globalAlpha = 1;
  g.fillStyle = o.ink ?? "#3a2a1c";
  let y = 64;
  if (o.title) {
    g.font = "italic 600 42px 'Fraunces Variable', Georgia, serif";
    g.fillText(o.title, 36, y);
    y += 30;
  }
  g.font = "italic 30px 'Fraunces Variable', Georgia, serif";
  for (const l of lines) {
    y += 44;
    g.fillText(l, 40, y);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const LEDGER_LEFT = ["Stew for Forty, Feeding Six", "— onions, a great many", "— wild garlic, two fists", "— smoked salt, a pinch", "Saltgrass Flats: 9 days.", "Lantern Road: 14, if dry."];
const LEDGER_RIGHT = ["Old Tamsin  (wagon)", "Gorran  (song, all night)", "Pim  &  Posy  (twins)", "Wick  (map, mostly)", "Bram  (cook)", "", "   six of us, and the road."];

// ---- props by kind -------------------------------------------------------------

const KINDS: Record<string, () => THREE.Object3D> = {
  crate() {
    const m = mat(WOOD_LIGHT);
    const g = group(box(0.62, 0.05, 0.42, m, 0, 0.025, 0));
    for (const s of [-1, 1]) {
      g.add(box(0.62, 0.09, 0.03, m, 0, 0.1, s * 0.2), box(0.62, 0.09, 0.03, m, 0, 0.24, s * 0.2));
      g.add(box(0.03, 0.09, 0.42, m, s * 0.3, 0.1, 0), box(0.03, 0.09, 0.42, m, s * 0.3, 0.24, 0));
      g.add(box(0.04, 0.32, 0.04, mat(WOOD), s * 0.29, 0.16, 0.19), box(0.04, 0.32, 0.04, mat(WOOD), s * 0.29, 0.16, -0.19));
    }
    // odds and ends poking out: a rolled cloth, a pan handle
    const roll = cyl(0.06, 0.06, 0.5, mat(CLOTH));
    roll.rotation.z = Math.PI / 2 - 0.2;
    roll.position.set(0, 0.3, 0.05);
    g.add(roll, box(0.04, 0.03, 0.3, mat("#444"), 0.15, 0.32, -0.08));
    return g;
  },
  ledger() {
    const g = group(box(0.3, 0.06, 0.4, mat(LEATHER), 0, 0.03, 0), box(0.28, 0.045, 0.38, mat(PAPER), 0.012, 0.03, 0));
    g.add(box(0.03, 0.065, 0.4, mat("#5a2c1e"), -0.15, 0.033, 0));
    // a ribbon
    g.add(box(0.02, 0.005, 0.12, mat(STRING), 0.05, 0.004, 0.24));
    return g;
  },
  ledger_open() {
    const g = new THREE.Group();
    const cover = box(0.66, 0.02, 0.44, mat(LEATHER), 0, 0.01, 0);
    g.add(cover);
    for (const [side, lines, title] of [[-1, LEDGER_LEFT, "Road Kitchen"], [1, LEDGER_RIGHT, "The Crew"]] as const) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ map: page([...lines], { title, w: 0.3, h: 0.4 }), roughness: 0.9 }));
      p.rotation.x = -Math.PI / 2;
      p.rotation.y = side * 0.08;
      p.position.set(side * 0.16, 0.035 + 0.005, 0);
      p.receiveShadow = true;
      g.add(p, box(0.3, 0.02, 0.4, mat(PAPER), side * 0.16, 0.024, 0));
    }
    return g;
  },
  bench() {
    const m = mat(WOOD);
    const g = group(box(1.8, 0.07, 0.36, m, 0, 0.46, 0));
    for (const s of [-1, 1]) g.add(box(0.07, 0.44, 0.3, mat(WOOD_DARK), s * 0.75, 0.22, 0));
    return g;
  },
  /** A carved chair for the head of the table; its back is toward -z (turn it to face the table). */
  chair() {
    const m = mat(WOOD_DARK);
    const g = group(box(0.5, 0.06, 0.46, mat(WOOD), 0, 0.48, 0), box(0.5, 0.62, 0.06, m, 0, 0.8, -0.21));
    for (const [x, z] of [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]]) g.add(box(0.05, 0.47, 0.05, m, x, 0.235, z));
    // a little serpent carved on the top rail
    const top = box(0.56, 0.08, 0.08, mat(WOOD_LIGHT), 0, 1.12, -0.21);
    g.add(top);
    return g;
  },
  barrel() {
    const g = group(cyl(0.3, 0.27, 0.8, mat(WOOD), 12));
    g.children[0].position.y = 0.4;
    for (const y of [0.15, 0.65]) {
      const hoop = cyl(0.31, 0.31, 0.05, mat("#4b4b4b"), 12);
      hoop.position.y = y;
      g.add(hoop);
    }
    return g;
  },
  mug() {
    const g = group(cyl(0.06, 0.055, 0.13, mat(CERAMIC, { rough: 0.5 })));
    g.children[0].position.y = 0.065;
    const top = cyl(0.052, 0.052, 0.01, mat("#c98d3c", { rough: 0.3 }));
    top.position.y = 0.12;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 10, Math.PI), mat(CERAMIC));
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.065, 0.065, 0);
    g.add(top, handle);
    return g;
  },
  bowl() {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(CERAMIC));
    b.rotation.x = Math.PI;
    b.position.y = 0.1;
    const stew = cyl(0.1, 0.1, 0.01, mat("#9a5a2c", { rough: 0.4 }));
    stew.position.y = 0.09;
    return group(b, stew);
  },
  lantern() {
    const glow = mat("#ffd58a", { emissive: "#ffb347", glow: 2.6 });
    const frame = mat("#3a3530");
    const g = group(cyl(0.09, 0.11, 0.03, frame, 8), cyl(0.07, 0.07, 0.2, glow, 8), cyl(0.06, 0.1, 0.06, frame, 8));
    g.children[0].position.y = 0.015;
    g.children[1].position.y = 0.13;
    g.children[2].position.y = 0.26;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 10), frame);
    ring.position.y = 0.32;
    g.add(ring);
    return g;
  },
  /** A lantern that lights the ground around it (one real light: use sparingly). */
  lamp() {
    const g = KINDS.lantern();
    const l = new THREE.PointLight("#ffb866", 1.6, 5, 1.8);
    l.position.y = 0.4;
    g.add(l);
    return g;
  },
  letter() {
    const g = group(box(0.22, 0.008, 0.14, mat(PAPER), 0, 0.004, 0));
    // the flap
    const flap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.07, 3), mat("#e3d3ae"));
    flap.rotation.set(Math.PI / 2, 0, Math.PI);
    flap.scale.set(1, 1, 0.05);
    flap.position.set(0, 0.01, -0.03);
    g.add(flap);
    return g;
  },
  letters() {
    const g = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const l = KINDS.letter();
      l.position.set(Math.sin(i * 2.3) * 0.012, i * 0.01, Math.cos(i * 1.7) * 0.01);
      l.rotation.y = Math.sin(i * 3.1) * 0.12;
      g.add(l);
    }
    // tied with red string, both ways
    g.add(box(0.235, 0.1, 0.008, mat(STRING), 0, 0.045, 0), box(0.008, 0.1, 0.155, mat(STRING), 0, 0.045, 0));
    return g;
  },
  reply() {
    const g = group(box(0.24, 0.008, 0.32, mat("#f4ead2"), 0, 0.004, 0));
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.32),
      new THREE.MeshStandardMaterial({ map: page(["Bram, you great onion.", "We had you buried, and", "you were cooking all along.", "Two valleys over, at", "Thimble Ford. Come home", "to supper, or we'll come", "to yours.     — Tamsin"], { title: "Dear Bram,", w: 0.24, h: 0.32 }), roughness: 0.9 }),
    );
    p.rotation.x = -Math.PI / 2;
    p.position.y = 0.009;
    g.add(p);
    // a pressed thimbleflower in the fold
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6), mat("#9b7bc4"));
    f.rotation.x = -Math.PI / 2;
    f.position.set(0.08, 0.011, 0.12);
    return group(g, f);
  },
  table() {
    const m = mat(WOOD);
    const g = group(box(1.2, 0.07, 0.7, m, 0, 0.74, 0));
    for (const [x, z] of [[-0.52, -0.28], [0.52, -0.28], [-0.52, 0.28], [0.52, 0.28]]) g.add(box(0.07, 0.72, 0.07, mat(WOOD_DARK), x, 0.36, z));
    return g;
  },
  /** One long table with benches either side, mugs, bowls and candles all along it (8 places a side). */
  long_table() {
    const L = 7.4;
    const g = new THREE.Group();
    g.add(box(L, 0.08, 0.95, mat(WOOD), 0, 0.76, 0), box(L - 0.2, 0.02, 0.5, mat(CLOTH), 0, 0.81, 0));
    for (let x = -L / 2 + 0.4; x <= L / 2 - 0.3; x += 1.65) g.add(box(0.1, 0.74, 0.8, mat(WOOD_DARK), x, 0.37, 0));
    for (const s of [-1, 1]) {
      g.add(box(L, 0.07, 0.34, mat(WOOD_LIGHT), 0, 0.45, s * 0.78));
      for (let x = -L / 2 + 0.4; x <= L / 2 - 0.3; x += 1.65) g.add(box(0.07, 0.42, 0.28, mat(WOOD_DARK), x, 0.21, s * 0.78));
    }
    for (let i = 0; i < 8; i++) {
      const x = -L / 2 + 0.55 + i * ((L - 1.1) / 7);
      for (const s of [-1, 1]) {
        const mug = KINDS.mug();
        mug.position.set(x + 0.18, 0.82, s * 0.3);
        const bowl = KINDS.bowl();
        bowl.position.set(x - 0.08, 0.82, s * 0.3);
        g.add(mug, bowl);
      }
      if (i % 2 === 0) {
        const candle = group(cyl(0.025, 0.025, 0.14, mat("#f2e6c8")), cyl(0.012, 0.004, 0.04, mat("#ffd58a", { emissive: "#ffb347", glow: 3 })));
        candle.children[0].position.y = 0.07;
        candle.children[1].position.y = 0.16;
        candle.position.set(x + 0.4, 0.82, 0);
        g.add(candle);
      }
    }
    // bread and a big pot at the middle
    const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat("#c48a4a"));
    loaf.scale.set(1.4, 0.7, 1);
    loaf.position.set(-0.7, 0.88, 0);
    const pot = cyl(0.2, 0.17, 0.24, mat("#3f3a36", { rough: 0.5 }), 12);
    pot.position.set(0.5, 0.94, 0);
    g.add(loaf, pot);
    return g;
  },
  /** A caravan wagon with a canvas hood and two lanterns swinging from the front bow (no animals). */
  wagon() {
    const g = new THREE.Group();
    const body = group(box(1.5, 0.35, 2.6, mat(WOOD), 0, 0.85, 0), box(1.56, 0.06, 2.66, mat(WOOD_DARK), 0, 0.68, 0));
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 2.4, 12, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: CLOTH, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
    hood.rotation.x = Math.PI / 2;
    hood.rotation.y = Math.PI / 2;
    hood.position.y = 1.05;
    hood.castShadow = true;
    g.add(body, hood);
    for (const [x, z] of [[-0.8, -0.85], [0.8, -0.85], [-0.8, 0.85], [0.8, 0.85]]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 6, 14), mat(WOOD_DARK));
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(x, 0.45, z);
      wheel.name = "wheel";
      const hub = cyl(0.08, 0.08, 0.12, mat(BRASS), 8);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Group();
        s.rotation.z = (k * Math.PI) / 4;
        s.add(box(0.03, 0.8, 0.03, mat(WOOD)));
        wheel.add(s);
      }
      g.add(wheel);
    }
    // the shafts out front, the crew pulled it themselves on the last hill
    for (const s of [-1, 1]) {
      const shaft = box(0.06, 0.06, 1.6, mat(WOOD_DARK), s * 0.5, 0.62, 2.0);
      shaft.rotation.x = 0.12;
      g.add(shaft);
    }
    for (const s of [-1, 1]) {
      const l = KINDS.lantern();
      l.position.set(s * 0.62, 1.42, 1.25);
      l.name = "swing";
      g.add(l);
    }
    // bundles in the back
    g.add(box(0.5, 0.3, 0.4, mat("#9c7a52"), -0.3, 1.18, -0.9), box(0.4, 0.25, 0.35, mat("#7d8a5a"), 0.35, 1.15, -0.7));
    return g;
  },
};

export const PROP_KINDS = Object.keys(KINDS);

/** A new prop of this kind, ready to place (unknown kinds give an empty group). */
export function makeProp(kind: string): THREE.Object3D {
  const make = KINDS[kind];
  const o = make ? make() : new THREE.Group();
  o.name = `scene_${kind}`;
  return o;
}
