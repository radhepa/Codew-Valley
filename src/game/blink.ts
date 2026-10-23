import * as THREE from "three";

// Blinking. The house eyes are glossy dark ovals (material eye_dark) with a small white highlight,
// modelled into the head mesh, so a blink squashes each oval flat at runtime: the eye closes to a
// soft dark line and the highlight shrinks away. Eyes under a skin half-lid (Mirela, Lord Vane,
// Marlo's squinting eye) close up into their lash line instead, like the lid coming down.
// The same squash gives two expressions: shut (a yawn, a stretch) and happy (^ ^).

interface Part {
  idx: number[];
  min: THREE.Vector3;
  max: THREE.Vector3;
  c: THREE.Vector3;
}

interface Eye {
  idx: number[];
  cx: number;
  halfW: number;
  /** The height the eye closes onto. */
  pivot: number;
  lidded: boolean;
  /** The highlight's vertices and centre. */
  hi: number[];
  hc: THREE.Vector3;
}

/** Connected pieces of a mesh (vertices welded by position, so UV seams don't split a piece). */
function pieces(g: THREE.BufferGeometry): Part[] {
  const pos = g.attributes.position;
  const n = pos.count;
  const up = Int32Array.from({ length: n }, (_, i) => i);
  const find = (i: number) => {
    while (up[i] !== i) i = up[i] = up[up[i]];
    return i;
  };
  const join = (a: number, b: number) => {
    a = find(a);
    b = find(b);
    if (a !== b) up[a] = b;
  };
  const at = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const k = `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
    const j = at.get(k);
    if (j === undefined) at.set(k, i);
    else join(i, j);
  }
  const ix = g.index;
  if (ix) for (let t = 0; t < ix.count; t += 3) join(ix.getX(t), ix.getX(t + 1)), join(ix.getX(t), ix.getX(t + 2));
  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    const list = groups.get(r);
    if (list) list.push(i);
    else groups.set(r, [i]);
  }
  const v = new THREE.Vector3();
  return [...groups.values()].map((idx) => {
    const box = new THREE.Box3();
    for (const i of idx) box.expandByPoint(v.fromBufferAttribute(pos, i));
    return { idx, min: box.min, max: box.max, c: box.getCenter(new THREE.Vector3()) };
  });
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class Blinker {
  private eyes: Eye[];
  private dark: THREE.BufferAttribute;
  private white: THREE.BufferAttribute | null;
  private darkBase: Float32Array;
  private whiteBase: Float32Array | null;
  private t = -1;
  private next = 0.5 + Math.random() * 3;
  private since = 9;
  private twice = false;
  private shown = 0;

  /** Find the eyes in a head; null if it has none the blink understands. */
  static on(head: THREE.Object3D | undefined | null) {
    if (!head) return null;
    let dark: THREE.Mesh | null = null;
    let white: THREE.Mesh | null = null;
    head.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const name = (m.material as THREE.Material).name;
      if (name === "eye_dark") dark = m;
      else if (name === "white") white = m;
    });
    if (!dark) return null;
    const b = new Blinker(dark, white);
    return b.eyes.length ? b : null;
  }

  private constructor(dark: THREE.Mesh, white: THREE.Mesh | null) {
    // own copies: clones of a model share geometry, and each character blinks on its own
    dark.geometry = dark.geometry.clone();
    if (white) white.geometry = white.geometry.clone();
    this.dark = dark.geometry.attributes.position as THREE.BufferAttribute;
    this.white = white ? (white.geometry.attributes.position as THREE.BufferAttribute) : null;
    this.darkBase = Float32Array.from({ length: this.dark.count * 3 }, (_, i) => this.dark.getComponent(Math.floor(i / 3), i % 3));
    this.whiteBase = this.white ? Float32Array.from({ length: this.white.count * 3 }, (_, i) => this.white!.getComponent(Math.floor(i / 3), i % 3)) : null;
    this.eyes = this.findEyes(pieces(dark.geometry), white ? pieces(white.geometry) : []);
  }

  private findEyes(dark: Part[], white: Part[]): Eye[] {
    // the eyes: the tallest mirrored pair of upright ovals (the mouth is wider than tall)
    const size = (p: Part) => p.max.clone().sub(p.min);
    const ovals = dark.filter((p) => {
      const s = size(p);
      return s.y > s.x * 1.1 && s.y > 0.03 && s.z < s.y;
    });
    ovals.sort((a, b) => size(b).y - size(a).y);
    let pair: [Part, Part] | null = null;
    for (const a of ovals) {
      const b = ovals.find((o) => o !== a && o.c.x * a.c.x < 0 && Math.abs(o.c.x + a.c.x) < 0.02 && Math.abs(o.c.y - a.c.y) < 0.01);
      if (b) {
        pair = [a, b];
        break;
      }
    }
    if (!pair) return [];
    return pair.map((p) => {
      const s = size(p);
      // a lash line along a half-lid: a thin dark piece across the top of the eye
      const lash = dark.find((q) => {
        if (q === p) return false;
        const z = size(q);
        return z.x > s.x * 0.6 && z.y < s.y * 0.5 && Math.abs(q.c.x - p.c.x) < s.x * 0.5 && q.c.y > p.c.y && q.min.y < p.max.y;
      });
      // its highlight: a small white piece on the eye (not a glint out on a lens)
      const hi = white.filter((q) => {
        const z = size(q);
        return z.x < s.x * 0.6 && q.c.x > p.min.x && q.c.x < p.max.x && q.c.y > p.min.y && q.c.y < p.max.y && q.c.z < p.max.z + 0.008;
      });
      return {
        idx: p.idx,
        cx: p.c.x,
        halfW: s.x / 2,
        pivot: lash ? lash.min.y + 0.0015 : p.c.y - s.y * 0.1,
        lidded: !!lash,
        hi: hi.flatMap((q) => q.idx),
        hc: hi.length ? hi.reduce((c, q) => c.add(q.c), new THREE.Vector3()).divideScalar(hi.length) : p.c.clone(),
      };
    });
  }

  /** Blink now (unless one just happened); force blinks even then. */
  blink(force = false) {
    if (!force && (this.t >= 0 || this.since < 0.8)) return;
    this.t = 0;
  }

  /** shut: eyes closed (0-1); happy: closed into ^ ^ (0-1). */
  update(dt: number, shut = 0, happy = 0) {
    this.since += dt;
    this.next -= dt;
    if (this.next <= 0 && this.t < 0) {
      this.t = 0;
      // now and then a quick double blink
      this.twice = !this.twice && Math.random() < 0.2;
      this.next = this.twice ? 0.3 : 2 + Math.random() * 4.5;
    }
    let b = 0;
    if (this.t >= 0) {
      this.t += dt;
      // close fast, a beat shut, open a little slower
      const t = this.t;
      b = t < 0.06 ? (t / 0.06) ** 2 : t < 0.1 ? 1 : 1 - smooth(0.1, 0.21, t);
      if (t >= 0.21) {
        this.t = -1;
        this.since = 0;
        b = 0;
      }
    }
    b = Math.max(b, shut, happy);
    // the happy arc fades in with the expression, not with ordinary blinks
    const arc = happy > 0 ? happy / Math.max(b, 1e-3) : 0;
    if (b === 0 && this.shown === 0) return;
    this.shown = b;
    this.pose(b, arc);
  }

  private pose(b: number, arc: number) {
    const D = this.dark;
    const base = this.darkBase;
    for (const e of this.eyes) {
      // squash to a line about 1/9 of the eye's height (lidded eyes hide right under the lash)
      const k = 1 - b * (e.lidded ? 0.97 : 0.89);
      // a relaxed closed eye curves down a little at the middle; a happy one bows up (^)
      const bow = e.lidded ? 0 : b * (THREE.MathUtils.lerp(-0.004, 0.016, arc));
      for (const i of e.idx) {
        const x = base[i * 3];
        const u = (x - e.cx) / e.halfW;
        const y = e.pivot + (base[i * 3 + 1] - e.pivot) * k + bow * Math.max(0, 1 - u * u);
        D.setY(i, y);
      }
      if (this.white && this.whiteBase) {
        const W = this.white;
        const wb = this.whiteBase;
        const s = 1 - smooth(0, 0.55, b);
        const cy = e.pivot + (e.hc.y - e.pivot) * k;
        for (const i of e.hi) {
          W.setXYZ(i, e.hc.x + (wb[i * 3] - e.hc.x) * s, cy + (wb[i * 3 + 1] - e.hc.y) * s, e.hc.z + (wb[i * 3 + 2] - e.hc.z) * s);
        }
        W.needsUpdate = true;
      }
    }
    D.needsUpdate = true;
  }

  /** Dev: what was found. */
  describe() {
    return this.eyes.map((e) => ({ x: +e.cx.toFixed(3), w: +(e.halfW * 2).toFixed(3), pivot: +e.pivot.toFixed(3), lidded: e.lidded, verts: e.idx.length, highlight: e.hi.length }));
  }
}
