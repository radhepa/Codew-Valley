"""The Town Hall: stone ground floor, jettied timber upper floor, a big tiled roof with a
front gable and balcony, and a corner tower with a belfry, spire and flag. 14 cumulative
stages (stage_01 .. stage_14). See art/specs/townhall.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

Walls are built as "runs": a straight wall in its own frame W where local x runs along the
wall (u), local -y points outward and z is up. Openings are (u, width, sill, spring, kind);
arched ones get a voussoir ring.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
import bmesh
from mathutils import Vector

RENDER_STAGES = globals().get("RENDER_STAGES", True)
TAU = 2 * math.pi

# town colours and the slate spire (added to the shared palette at run time, this script only)
common.PALETTE.update({
    "banner": "#8A3D3A", "gold": "#C4A050", "parchment": "#E9DDBF",
    "slate": "#69707A", "slate_dark": "#535862", "slate_light": "#828891",
})

# ------------------------------------------------------------------ dimensions
Z0 = 0.5                  # plinth top / ground floor
Z1 = 3.6                  # top of the stone ground floor
ZF = 3.85                 # upper floor level (top of the jetty beam)
Z2 = 6.45                 # top plate / eaves line
T, TU = 0.5, 0.25         # stone and timber wall depth
HX, HY = 5.4, 3.4         # stone ground floor, outer half extents
JX, JY = 5.5, 3.7         # jettied upper floor, outer half extents
PITCH = 44
TP, CP, SP = math.tan(math.radians(PITCH)), math.cos(math.radians(PITCH)), math.sin(math.radians(PITCH))
RZ = Z2 + JY * TP         # ridge, about 10.0
YE = 4.25                 # eave line (y)
ZE = RZ - YE * TP
XG = 6.0                  # gable verge (x)
CG_W, CG_P = 1.8, 55      # front cross gable half width and pitch
CGZ = Z2 + CG_W * math.tan(math.radians(CG_P))
TX0, TX1, TY0, TY1 = 4.7, 7.5, -3.6, -0.8     # tower outer faces (front-right corner)
TCX, TCY = (TX0 + TX1) / 2, (TY0 + TY1) / 2
TZ = 7.4                  # top of the tower stonework
BZ0, BZ1 = TZ + 0.15, 9.6  # belfry floor and top
SPIRE = 12.05
FLAG_TOP = 13.45
SMOKE = (-2.4, 1.9, 11.45)
STONE_COLS = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone"]
TILE_COLS = ["roof", "roof", "roof_mid", "roof", "roof_dark", "roof_mid"]
GAP = 0.035


def run_frame(normal, c):
    return {"-Y": (M((0, c, 0)), 1), "+X": (M((c, 0, 0), (0, 0, 90)), 1),
            "+Y": (M((0, c, 0), (0, 0, 180)), -1), "-X": (M((c, 0, 0), (0, 0, -90)), -1)}[normal]


class Run:
    """A straight wall: outward normal, centre-line coordinate c, world range a..b along it."""

    def __init__(self, normal, c, a, b, ops=(), depth=T):
        self.W, s = run_frame(normal, c)
        self.u0, self.u1 = sorted((s * a, s * b))
        self.ops = [(s * o[0],) + tuple(o[1:]) for o in ops]
        self.depth = depth


def win(c):
    return (c, 0.9, 1.45, 2.65, "win")


DOOR = (0.0, 1.6, Z0, 2.45, "door")
GROUND = [
    Run("-Y", -HY + T / 2, -HX, TX0, [win(-3.95), win(-2.3), DOOR, win(2.3), win(3.75)]),
    Run("+X", TX0 - T / 2, -HY + T, TY1 + T),            # notch walls, later inside the tower
    Run("-Y", TY1 + T / 2, TX0, HX),
    Run("+X", HX - T / 2, TY1 + T, HY - T, [win(1.4)]),
    Run("+Y", HY - T / 2, -HX, HX, [win(-2.6), win(2.6)]),
    Run("-X", -HX + T / 2, -(HY - T), HY - T, [win(-1.4), win(1.4)]),
]


def uw(c, w=1.0):
    return (c, w, 4.55, 5.85)


FRENCH = (0.0, 1.3, ZF, 5.95)
UPPER = [
    Run("-Y", -JY + TU / 2, -JX, TX0, [uw(-3.85, 0.95), FRENCH, uw(3.6, 0.95)], TU),
    Run("+X", TX0 - TU / 2, -JY + TU, TY1 + TU, [], TU),
    Run("-Y", TY1 + TU / 2, TX0, JX, [], TU),
    Run("+X", JX - TU / 2, TY1 + TU, JY - TU, [uw(1.5, 0.9)], TU),
    Run("+Y", JY - TU / 2, -JX, JX, [uw(-3.0, 0.9), uw(0.0, 0.9), uw(3.0, 0.9)], TU),
    Run("-X", -JX + TU / 2, -(JY - TU), JY - TU, [uw(-1.5, 0.9), uw(1.5, 0.9)], TU),
]
TOWER = [
    Run("-Y", TY0 + 0.225, TX0, TX1, [(TCX, 0.9, Z0, Z0 + 1.45, "tdoor"), (TCX, 0.32, 4.3, 5.0, "slit")], 0.45),
    Run("+X", TX1 - 0.225, TY0 + 0.45, TY1, [(TCY, 0.32, 2.0, 2.6, "slit"), (TCY, 0.32, 4.8, 5.45, "slit")], 0.45),
    Run("+Y", TY1 - 0.225, TX0, TX1 - 0.45, [(TCX - 0.1, 0.32, 4.6, 5.3, "slit")], 0.45),
    Run("-X", TX0 + 0.225, TY0 + 0.45, TY1 - 0.45, [], 0.45),
]
PLINTH = [
    Run("-Y", -3.65 + 0.225, -5.65, 4.55, depth=0.45),
    Run("-Y", -3.75 + 0.225, 4.55, 7.65, depth=0.45),
    Run("+X", 7.65 - 0.225, -3.3, -0.65, depth=0.45),
    Run("+Y", -0.65 - 0.225, 5.65, 7.2, depth=0.45),
    Run("+X", 5.65 - 0.225, -1.1, 3.2, depth=0.45),
    Run("+Y", 3.65 - 0.225, -5.65, 5.65, depth=0.45),
    Run("-X", -5.65 + 0.225, -3.2, 3.2, depth=0.45),
]


def course_levels(z0, z1, n, seed, var=0.12):
    rnd = random.Random(seed)
    hs = [1 + rnd.uniform(-var, var) for _ in range(n)]
    zs = [z0]
    for h in hs:
        zs.append(zs[-1] + (z1 - z0) * h / sum(hs))
    return zs


ZS_GROUND = course_levels(Z0, Z1, 6, 5)
ZS_TOWER = course_levels(Z0, TZ, 11, 6)
ZS_PLINTH = [0.0, 0.26, Z0]


# ------------------------------------------------------------------ helpers

def subtract(a, b, cuts):
    out = [(a, b)]
    for c0, c1 in cuts:
        nxt = []
        for x0, x1 in out:
            if c1 <= x0 or c0 >= x1:
                nxt.append((x0, x1))
                continue
            if c0 > x0:
                nxt.append((x0, c0))
            if c1 < x1:
                nxt.append((c1, x1))
        out = nxt
    return [(x0, x1) for x0, x1 in out if x1 - x0 > 0.02]


def ring_of(kind):
    return {"door": 0.24, "win": 0.2, "tdoor": 0.18, "slit": 0.1}[kind]


def stone_run(p, rnd, run, zs, cols=STONE_COLS, sills=True, bw=(0.55, 1.15)):
    """Coursed stone blocks over a dark mortar core, skipping openings; arches get a
    spandrel fill and a voussoir ring with a keystone."""
    W, d = run.W, run.depth
    wide = [[] for _ in run.ops]
    for k in range(len(zs) - 1):
        c0, c1 = zs[k], zs[k + 1]
        h = c1 - c0
        cuts = []
        for i, (uc, w, sill, spring, kind) in enumerate(run.ops):
            r, R = w / 2, w / 2 + ring_of(kind)
            if c1 > spring + 1e-4 and c0 < spring + R - 1e-4:
                cuts.append((uc - R, uc + R))
                wide[i].append((c0, c1))
            elif c1 > sill + 1e-4 and c0 < spring:
                cuts.append((uc - r, uc + r))
        for a, b in subtract(run.u0, run.u1, cuts):
            x = a
            while x < b - 1e-3:
                wb = rnd.uniform(*bw)
                if b - (x + wb) < 0.32:
                    wb = b - x
                pro = rnd.uniform(0.0, 0.035)
                p.add(jitter(bm_box(max(wb - GAP, 0.05), d + pro, h - GAP), 0.012, rnd.randint(0, 99999)),
                      rnd.choice(cols), W @ M((x + wb / 2, -pro / 2, c0 + h / 2)))
                x += wb
    holed_panel(p, W, run.u0, run.u1, zs[0], zs[-1], d - 0.1,
                [(uc, w, sill, spring + w / 2) for uc, w, sill, spring, _ in run.ops], "stone_dark")   # mortar core
    for i, (uc, w, sill, spring, kind) in enumerate(run.ops):
        r, ring = w / 2, ring_of(kind)
        R = r + ring
        if wide[i]:
            zb = min(c0 for c0, _ in wide[i])
            zt = max(c1 for _, c1 in wide[i])
            if zb < sill - 1e-4:
                p.add(bm_box(2 * R, d - 0.02, sill - zb), "stone_mid", W @ M((uc, 0, (zb + sill) / 2)))
                zb = sill
            pts = [(-R, zb)]
            pts += [(-r, zb), (-r, spring)] if spring - zb > 1e-3 else [(-r, spring)]
            na = 10 if kind == "door" else 8
            pts += [(r * math.cos(math.pi - math.pi * j / na), spring + r * math.sin(math.pi - math.pi * j / na))
                    for j in range(1, na)]
            pts += [(r, spring), (r, zb)] if spring - zb > 1e-3 else [(r, spring)]
            pts += [(R, zb), (R, zt), (-R, zt)]
            p.add(bm_prism([(uc + x, z) for x, z in pts], d - 0.02), "stone_mid", W)
        mid = r + ring / 2
        nv = max(5, int(round(math.pi * mid / 0.3))) | 1
        for j in range(nv):
            t = math.pi * (j + 0.5) / nv
            key = j == nv // 2
            size = (math.pi * mid / nv * 0.9, d + (0.1 if key else 0.06), ring * (1.25 if key else 1.0))
            p.add(jitter(bm_box(*size), 0.008, rnd.randint(0, 99999)),
                  "stone_light" if key else rnd.choice(["stone_light", "stone_warm", "stone"]),
                  W @ M((uc + mid * math.cos(t), -0.02, spring + mid * math.sin(t)), (0, 90 - math.degrees(t), 0)))
        if sills and kind in ("win", "slit"):
            p.add(bm_box(w + (0.24 if kind == "win" else 0.12), d + 0.1, 0.1), "stone_light",
                  W @ M((uc, -0.05, sill - 0.05)))


def holed_panel(p, W, u0, u1, z0, z1, d, holes, matname, ly=0.0):
    """A flat panel with rectangular holes (uc, w, zb, zt), split into boxes."""
    cuts = {u0, u1}
    for uc, w, zb, zt in holes:
        cuts |= {max(u0, uc - w / 2), min(u1, uc + w / 2)}
    cuts = sorted(cuts)
    for a, b in zip(cuts, cuts[1:]):
        if b - a < 1e-3:
            continue
        m = (a + b) / 2
        spans = [(z0, z1)]
        for uc, w, zb, zt in holes:
            if uc - w / 2 <= m <= uc + w / 2:
                spans = [s for s0, s1 in spans for s in ((s0, min(s1, zb)), (max(s0, zt), s1)) if s[1] - s[0] > 1e-3]
        for s0, s1 in spans:
            p.add(bm_box(b - a, d, s1 - s0), matname, W @ M((m, ly, (s0 + s1) / 2)))


def brace(p, W, a, b, matname="wood_dark", w=0.15, d=0.24, ly=0.0):
    du, dz = b[0] - a[0], b[1] - a[1]
    p.add(bm_box(math.hypot(du, dz), d, w), matname,
          W @ M(((a[0] + b[0]) / 2, ly, (a[1] + b[1]) / 2), (0, -math.degrees(math.atan2(dz, du)), 0)))


def strut(p, a, b, s, matname):
    """Box from world point a to b (b - a in the YZ plane)."""
    a, b = Vector(a), Vector(b)
    v = b - a
    p.box((s, v.length, s), tuple((a + b) / 2), matname, rot=(math.degrees(math.atan2(v.z, v.y)), 0, 0))


def timber_frame(p, run, z0, z1, t=0.2, col="wood_dark", seed=0):
    """Half-timbering: posts at the ends and beside openings, rails, chevron braces, top plate."""
    W, d = run.W, run.depth + 0.02
    xs = [run.u0 + t / 2, run.u1 - t / 2]
    for uc, w, zb, zt in run.ops:
        xs += [uc - w / 2 - t / 2, uc + w / 2 + t / 2]
    xs = sorted(xs)

    def ops_in(a, b):
        return [o for o in run.ops if a < o[0] < b]

    full = []
    for a, b in zip(xs, xs[1:]):
        full.append(a)
        if not ops_in(a, b) and b - a > 1.35:
            k = math.ceil((b - a) / 1.25)
            full += [a + (b - a) * j / k for j in range(1, k)]
    full.append(xs[-1])
    posts = []
    for x in full:
        if not posts or x - posts[-1] > 0.25:
            posts.append(x)
    for x in posts:
        p.add(bm_box(t, d, z1 - z0), col, W @ M((x, 0, (z0 + z1) / 2)))
    p.add(bm_box(run.u1 - run.u0, d + 0.02, 0.18), col, W @ M(((run.u0 + run.u1) / 2, 0, z1 + 0.09)))
    zm = z0 + 0.45 * (z1 - z0)
    flip = seed % 2
    for a, b in zip(posts, posts[1:]):
        ia, ib = a + t / 2, b - t / 2
        if ib - ia < 0.15:
            continue
        ops = ops_in(a, b)
        if ops:
            uc, w, zb, zt = ops[0]
            if zb > z0 + 0.1:
                p.add(bm_box(ib - ia, d - 0.01, 0.16), col, W @ M(((ia + ib) / 2, 0, zb - 0.08)))
            if zt < z1 - 0.1:
                p.add(bm_box(ib - ia, d - 0.01, 0.16), col, W @ M(((ia + ib) / 2, 0, zt + 0.08)))
            continue
        p.add(bm_box(ib - ia, d - 0.01, 0.16), col, W @ M(((ia + ib) / 2, 0, zm)))
        if ib - ia > 0.45:
            l, r = (ia, ib) if flip else (ib, ia)
            brace(p, W, (l, z0 + 0.05), (r, zm), col, d=d - 0.02)
            brace(p, W, (l, z1 - 0.05), (r, zm), col, d=d - 0.02)
        flip = 1 - flip


def arch_window(p, run, op):
    """Glazing for an arched opening: glass, mullion, transom and a lead bar."""
    W = run.W
    uc, w, sill, spring, kind = op
    r = w / 2
    p.add(bm_box(w - 0.02, 0.04, spring - sill), "glass", W @ M((uc, 0.06, (sill + spring) / 2)))
    p.add(bm_prism([(uc + (r - 0.01) * math.cos(math.pi * j / 8), spring + (r - 0.01) * math.sin(math.pi * j / 8))
                    for j in range(9)], 0.04), "glass", W @ M((0, 0.06, 0)))
    p.add(bm_box(0.07, 0.09, spring + r - sill - 0.04), "wood_dark", W @ M((uc, 0.03, (sill + spring + r) / 2 - 0.02)))
    p.add(bm_box(w, 0.09, 0.07), "wood_dark", W @ M((uc, 0.03, spring)))
    p.add(bm_box(w, 0.05, 0.03), "iron", W @ M((uc, 0.03, (sill + spring) / 2)))
    p.add(bm_box(w, 0.1, 0.06), "wood_dark", W @ M((uc, 0.03, sill + 0.03)))


def arch_door(p, W, uc, w, sill, spring, ly, planks, straps):
    r = w / 2

    def top(u):
        return spring + math.sqrt(max(r * r - u * u, 0.0))

    p.add(bm_prism([(uc - r, sill), (uc + r, sill)] + [(uc + r * math.cos(math.pi * j / 12), spring + r * math.sin(math.pi * j / 12))
                                                     for j in range(13)], 0.05), "wood_dark", W @ M((0, ly + 0.05, 0)))
    for i in range(planks):
        a, b = -r + 2 * r * i / planks + 0.012, -r + 2 * r * (i + 1) / planks - 0.012
        pts = [(uc + a, sill + 0.01), (uc + b, sill + 0.01)] + \
              [(uc + b - (b - a) * k / 3, top(b - (b - a) * k / 3) - 0.01) for k in range(4)]
        p.add(bm_prism(pts, 0.07), "door", W @ M((0, ly, 0)))
    for z in straps:
        for s in (-1, 1):
            p.add(bm_box(r * 0.8, 0.03, 0.08), "iron", W @ M((uc + s * r * 0.52, ly - 0.05, z)))


def rect_window(p, run, op, shutters=False, flowers=False, rnd=None):
    W, d = run.W, run.depth
    uc, w, zb, zt = op
    fy, f, zm, h = -d / 2 + 0.06, 0.07, (zb + zt) / 2, zt - zb
    for zz in (zb + f / 2, zt - f / 2):
        p.add(bm_box(w, 0.1, f), "wood_light", W @ M((uc, fy, zz)))
    for s in (-1, 1):
        p.add(bm_box(f, 0.1, h), "wood_light", W @ M((uc + s * (w / 2 - f / 2), fy, zm)))
    p.add(bm_box(w - 2 * f, 0.03, h - 2 * f), "glass", W @ M((uc, fy + 0.02, zm)))
    p.add(bm_box(0.05, 0.08, h - 2 * f), "wood_light", W @ M((uc, fy - 0.005, zm)))
    p.add(bm_box(w - 2 * f, 0.08, 0.05), "wood_light", W @ M((uc, fy - 0.005, zb + h * 0.62)))
    p.add(bm_box(w + 0.14, 0.16, 0.07), "wood_dark", W @ M((uc, -d / 2 - 0.03, zb - 0.03)))
    if shutters:
        sw = w / 2 + 0.02
        for s in (-1, 1):
            x = uc + s * (w / 2 + sw / 2 + 0.05)
            p.add(bm_box(sw, 0.045, h + 0.04), "shutter", W @ M((x, -d / 2 - 0.05, zm), (0, 0, -s * 6)))
            for zz in (zb + 0.25, zt - 0.25):
                p.add(bm_box(sw * 0.85, 0.03, 0.07), "wood_dark", W @ M((x, -d / 2 - 0.085, zz), (0, 0, -s * 6)))
    if flowers:
        bw = w + 0.18
        p.add(bm_box(bw, 0.26, 0.22), "wood_mid", W @ M((uc, -d / 2 - 0.15, zb - 0.17)))
        petals = ["petal_pink", "petal_white", "petal_yellow", "petal_pink", "petal_purple"]
        for i in range(4):
            u = uc - bw / 2 + 0.12 + i * (bw - 0.24) / 3
            p.add(jitter(bm_ico(0.12, 1), 0.02, i), rnd.choice(["grass", "grass_dark"]),
                  W @ M((u, -d / 2 - 0.16, zb - 0.03), scale=(1.1, 0.9, 0.8)))
        for i in range(5):
            u = uc - bw / 2 + 0.1 + i * (bw - 0.2) / 4
            p.add(bm_ico(0.055, 0), petals[i], W @ M((u, -d / 2 - 0.22 + rnd.uniform(-0.05, 0.05), zb + rnd.uniform(0.02, 0.09))))


def barrel(p, x, y, rz=0.0):
    p.add(bm_lathe([(0.25, 0), (0.29, 0.18), (0.3, 0.35), (0.29, 0.52), (0.25, 0.7)], 10), "wood", M((x, y, 0), (0, 0, rz)))
    for z in (0.1, 0.55):
        p.add(bm_lathe([(0.29, z), (0.295, z + 0.06)], 10, arc=(0, 360)), "iron", M((x, y, 0.0)))
    p.cyl(0.24, 0.02, (x, y, 0.7), "wood_mid", segs=10)


def stake(p, x, y, flag=False):
    p.box((0.08, 0.08, 0.36), (x, y, 0.18), "wood_light")
    p.cyl(0.057, 0.09, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
    if flag:
        p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.44)))


def string(p, a, b, z=0.29):
    (x0, y0), (x1, y1) = a, b
    p.box((math.hypot(x1 - x0, y1 - y0), 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, z), "white",
          rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))


# ------------------------------------------------------------------ stages

HALL_POLY = [(-HX, -HY), (TX0, -HY), (TX0, TY1), (HX, TY1), (HX, HY), (-HX, HY)]
TOWER_POLY = [(TX0, TY0), (TX1, TY0), (TX1, TY1), (TX0, TY1)]


def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes and string for the hall and the tower, the plan."""
    cx, cy, ax, ay = 0.95, -0.95, 7.3, 5.15
    pts = []
    for i in range(48):
        a = TAU * i / 48
        c, s = math.cos(a), math.sin(a)
        k = 1 + rnd.uniform(-0.025, 0.025)
        pts.append((cx + ax * k * math.copysign(abs(c) ** 0.45, c), cy + ay * k * math.copysign(abs(s) ** 0.45, s)))
    p.add(bm_slab(pts, 0.03), "dirt")
    seen = set()
    for loop in (HALL_POLY, TOWER_POLY):
        for i, (x, y) in enumerate(loop):
            if (x, y) not in seen:
                stake(p, x, y, flag=(i % 2 == 0))
                seen.add((x, y))
        for a, b in zip(loop, loop[1:] + loop[:1]):
            string(p, a, b)
    # door peg and the tower's centre peg
    stake(p, 0.0, -5.55, flag=True)
    p.box((0.09, 0.09, 0.22), (TCX, TCY, 0.11), "wood_mid", bevel=0.01)
    # the plan sheet with a little hall-and-tower sketch, held down by pebbles
    px, py, pr = -2.3, -5.05, 7
    p.box((0.7, 0.5, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    for (sx, sy, sz) in ((0.42, 0.012, 0.004), (0.012, 0.22, 0.004)):
        for o in ((-0.06, -0.1, 0), (-0.06, 0.1, 0)) if sx > 0.1 else ((-0.27, 0, 0), (0.15, 0, 0)):
            p.add(bm_box(sx, sy, sz), "tunic", base @ M(o))
    p.add(bm_box(0.12, 0.12, 0.004), "tunic", base @ M((0.22, -0.06, 0.001)))
    p.add(bm_prism([(-0.08, 0), (0.08, 0), (0, 0.14)], 0.004), "tunic", base @ M((0.22, 0.05, 0.0), (90, 0, 0)))
    for i, (dx, dy) in enumerate(((-0.3, -0.2), (0.29, 0.21))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (2.35, -5.0, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.15, 0.24, 0.15), (2.8, -5.22, 0.085), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (3.3, -4.45 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    p.box((0.03, 0.32, 0.09), (3.3, -4.35, 0.06), "white", rot=(0, 0, 8))
    for i in range(7):
        x, y = rnd.uniform(-4.5, 4.0), rnd.uniform(-2.8, 2.8)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light", M((x, y, 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth for the hall and the tower, flagstone floor, the first tower stones waiting."""
    p.box((10.9, 6.9, Z0 - 0.03), (0, 0, (Z0 - 0.03) / 2), "stone_dark")
    p.box((2.7, 2.7, Z0 - 0.03), (TCX, TCY, (Z0 - 0.03) / 2), "stone_dark")
    for run in PLINTH:
        stone_run(p, rnd, run, ZS_PLINTH, cols=["stone_mid", "stone", "stone_mid", "stone_dark"], bw=(1.0, 1.7))
    p.box((2.75, 2.75, 0.03), (TCX, TCY, Z0 - 0.015), "stone_mid")
    nx, ny = 8, 5
    for i in range(nx):
        for j in range(ny):
            x0, x1 = -5.25 + 10.5 * i / nx, -5.25 + 10.5 * (i + 1) / nx
            y0, y1 = -3.25 + 6.5 * j / ny, -3.25 + 6.5 * (j + 1) / ny
            if x0 > TX0 - 0.6 and y1 < TY1 + 0.3:
                continue
            p.box((x1 - x0 - 0.05, y1 - y0 - 0.05, 0.035), ((x0 + x1) / 2, (y0 + y1) / 2, Z0 - 0.015),
                  rnd.choice(["stone_light", "stone", "stone_light", "stone_warm"]), rot=(0, 0, rnd.uniform(-1.5, 1.5)))
    for i, (x, y, z, rz) in enumerate(((5.6, -3.0, 0, 5), (6.35, -3.05, 0, -8), (5.95, -2.95, 1, 2),
                                         (7.0, -1.4, 0, 80), (7.0, -2.15, 0, 95))):
        p.box((0.75, 0.42, 0.3), (x, y, Z0 + 0.15 + z * 0.3), rnd.choice(STONE_COLS), rot=(0, 0, rz), bevel=0.03)


def stage_03(p, rnd, extra):
    """Ground floor in coursed stone, with an arched doorway and arched windows."""
    for run in GROUND:
        stone_run(p, rnd, run, ZS_GROUND)


def stage_04(p, rnd, extra):
    """Wide front steps between stone cheek walls with lantern pedestals."""
    for y0, y1, zt in ((-4.15, -3.6, 0.375), (-4.65, -4.15, 0.25), (-5.15, -4.65, 0.125)):
        x = -2.4
        while x < 2.4 - 1e-3:
            w = rnd.uniform(0.9, 1.5)
            if 2.4 - (x + w) < 0.5:
                w = 2.4 - x
            p.add(jitter(bm_box(w - 0.03, y1 - y0 + 0.03, zt, bevel=0.02), 0.008, rnd.randint(0, 9999)),
                  rnd.choice(["stone_light", "stone", "stone_warm"]), M((x + w / 2, (y0 + y1) / 2 - 0.015, zt / 2)))
            x += w
    for s in (-1, 1):
        cx = s * 2.625
        p.add(bm_prism([(-3.6, 0), (-4.6, 0), (-4.6, 0.62), (-3.6, 0.85)], 0.45), "stone", M((cx, 0, 0), (0, 0, 90)))
        ang = math.degrees(math.atan2(0.23, 1.0))
        p.box((0.52, 1.04, 0.08), (cx, -4.1, 0.775), "stone_light", rot=(ang, 0, 0))
        p.add(jitter(bm_box(0.52, 0.52, 0.95, bevel=0.03), 0.01, 7 + s), "stone", M((cx, -4.875, 0.475)))
        p.box((0.66, 0.66, 0.1), (cx, -4.875, 1.0), "stone_light", bevel=0.02)


def stage_05(p, rnd, extra):
    """The great double door in green planks with iron straps, and glazed arched windows."""
    front = GROUND[0]
    uc, w, sill, spring, _ = DOOR
    arch_door(p, front.W, uc, w, sill, spring, 0.06, 8, (1.0, 2.0))
    p.add(bm_box(0.04, 0.04, spring + w / 2 - sill - 0.05), "wood_dark", front.W @ M((0, -0.0, (sill + spring + w / 2) / 2)))
    for s in (-1, 1):
        p.add(bm_tube([(s * 0.16 + 0.07 * math.cos(TAU * k / 10), -0.03, 1.55 + 0.07 * math.sin(TAU * k / 10)) for k in range(11)],
                      0.014, 5), "iron", front.W)
        p.add(bm_cyl(0.035, 0.035, 0.04, 8), "iron", front.W @ M((s * 0.16, 0.02, 1.62), (90, 0, 0)))
    p.box((1.7, 0.3, 0.05), (0, -HY + 0.1, Z0 + 0.02), "stone_light", bevel=0.015)
    for run in GROUND:
        for op in run.ops:
            if op[4] == "win":
                arch_window(p, run, op)


def stage_06(p, rnd, extra):
    """Upper floor deck on the stone, jetty beam with joist ends, timber wall frame."""
    p.box((TX0 + JX, 2 * JY, ZF - Z1), ((TX0 - JX) / 2, 0, (Z1 + ZF) / 2), "wood_mid")
    p.box((JX - TX0, JY - TY1, ZF - Z1), ((JX + TX0) / 2, (JY + TY1) / 2, (Z1 + ZF) / 2), "wood_mid")
    for s in (-1, 1):
        x1 = TX0 if s < 0 else JX
        p.box((x1 + JX + 0.04, 0.12, 0.27), ((x1 - JX) / 2, s * (JY + 0.02), (Z1 + ZF) / 2), "wood_dark")
        x = -5.25
        while x < x1 - 0.2:
            p.box((0.15, 0.48, 0.17), (x, s * (HY + 0.18), Z1 - 0.085), "wood_dark")
            x += 0.55
    for i, run in enumerate(UPPER):
        timber_frame(p, run, ZF, Z2 - 0.18, seed=i)


def stage_07(p, rnd, extra):
    """Plaster infill between the timbers."""
    for run in UPPER:
        holed_panel(p, run.W, run.u0, run.u1, ZF, Z2 - 0.18, run.depth - 0.07, run.ops, "plaster")


def stage_08(p, rnd, extra):
    """Shuttered upper windows with flower boxes, the French door and the mayor's balcony."""
    for i, run in enumerate(UPPER):
        for op in run.ops:
            if op is FRENCH or (i == 0 and abs(op[0]) < 0.01):
                continue
            rect_window(p, run, op, shutters=(i == 0), flowers=(i == 0), rnd=rnd)
    # French door: two glazed leaves
    W, d = UPPER[0].W, UPPER[0].depth
    uc, w, zb, zt = FRENCH
    fy = -d / 2 + 0.07
    for s in (-1, 1):
        p.add(bm_box(0.07, 0.1, zt - zb), "wood_light", W @ M((s * (w / 2 - 0.035), fy, (zb + zt) / 2)))
        cx = s * w / 4
        p.add(bm_box(w / 2 - 0.08, 0.05, zt - zb - 0.07), "door", W @ M((cx, fy + 0.03, (zb + zt) / 2)))
        p.add(bm_box(w / 2 - 0.2, 0.02, zt - zb - 0.95), "glass", W @ M((cx, fy - 0.005, zb + 0.72 + (zt - zb - 0.95) / 2)))
        for zz in (zb + 1.3, zb + 1.75):
            p.add(bm_box(w / 2 - 0.2, 0.03, 0.035), "wood_light", W @ M((cx, fy - 0.015, zz)))
    p.add(bm_box(w, 0.1, 0.07), "wood_light", W @ M((0, fy, zt - 0.035)))
    # balcony on two brackets
    y1 = -4.55
    p.box((2.6, 0.85, 0.14), (0, (-JY + y1) / 2, ZF - 0.07), "wood_mid", bevel=0.01)
    p.box((2.66, 0.12, 0.2), (0, y1 + 0.04, ZF - 0.1), "wood_dark")
    for sx in (-1.15, 1.15):
        strut(p, (sx, -HY - 0.02, 2.9), (sx, -4.35, ZF - 0.16), 0.14, "wood_dark")
        p.box((0.14, 0.95, 0.14), (sx, -3.9, ZF - 0.2), "wood_dark")
    zr = ZF + 0.92
    for sx, sy in ((-1.25, -4.48), (1.25, -4.48), (-1.25, -3.78), (1.25, -3.78)):
        p.box((0.1, 0.1, 1.0), (sx, sy, ZF + 0.5), "wood_dark")
    p.box((2.6, 0.11, 0.07), (0, -4.48, zr), "wood_dark")
    p.box((2.5, 0.07, 0.06), (0, -4.48, ZF + 0.12), "wood_dark")
    for s in (-1, 1):
        p.box((0.11, 0.74, 0.07), (s * 1.25, -4.13, zr), "wood_dark")
        p.box((0.07, 0.7, 0.06), (s * 1.25, -4.13, ZF + 0.12), "wood_dark")
        for y in (-3.98, -4.23):
            p.box((0.05, 0.05, 0.75), (s * 1.25, y, ZF + 0.5), "wood_light")
    for i in range(9):
        p.box((0.05, 0.05, 0.75), (-1.0 + 0.25 * i, -4.48, ZF + 0.5), "wood_light")


def roof_courses(p, rnd):
    L = YE / CP
    n = 12
    for side in (-1, 1):
        for i in range(n):
            s = 0.24 + i * (L - 0.38) / (n - 1)
            yc = side * (YE - s * CP)
            zc = ZE + s * SP + 0.07
            x1 = TX0 + 0.05 if (side < 0 and yc < TY1 + 0.15) else XG
            x = -XG
            while x < x1 - 1e-3:
                w = rnd.uniform(1.3, 2.3)
                if x1 - (x + w) < 0.7:
                    w = x1 - x
                p.add(jitter(bm_box(w - 0.015, 0.6, 0.09), 0.012, rnd.randint(0, 99999)), rnd.choice(TILE_COLS),
                      M((x + w / 2, yc, zc), (-side * (PITCH - 4) + rnd.uniform(-1, 1), 0, rnd.uniform(-0.6, 0.6))))
                x += w


def cross_roof(p, rnd):
    tp = math.tan(math.radians(CG_P))
    cp, sp = math.cos(math.radians(CG_P)), math.sin(math.radians(CG_P))
    wc = CG_W + 0.35
    lc = wc / cp
    zeave = CGZ - wc * tp
    n = 8
    for side in (-1, 1):
        for i in range(n):
            s = 0.2 + i * (lc - 0.32) / (n - 1)
            xc = side * (wc - s * cp)
            zc = zeave + s * sp + 0.07
            y0, y1 = -4.05, -(JY - (zc - Z2) / TP) + 0.3
            if y1 - y0 < 0.5:
                continue
            k = 2 if y1 - y0 > 1.6 else 1
            for j in range(k):
                ya, yb = y0 + (y1 - y0) * j / k, y0 + (y1 - y0) * (j + 1) / k
                p.add(jitter(bm_box(0.5, yb - ya - 0.015, 0.09), 0.01, rnd.randint(0, 99999)), rnd.choice(TILE_COLS),
                      M((xc, (ya + yb) / 2, zc), (0, side * (CG_P - 4), 0)))
        p.box((lc + 0.1, 0.07, 0.26), (side * wc / 2, -4.09, (zeave + CGZ) / 2 + 0.05), "wood_dark", rot=(0, side * CG_P, 0))
    p.cyl(0.13, 3.15, (0, -0.95, CGZ + 0.08), "roof_dark", segs=6, rot=(90, 0, 0))
    # front gable wall with timbers
    W = M((0, -JY + 0.1, 0))
    p.add(bm_prism([(-CG_W, Z2), (CG_W, Z2), (0, CGZ)], 0.2), "plaster", W)
    for s in (-1, 1):
        brace(p, W, (s * 0.9, Z2), (s * 0.9, CGZ - 0.9 * tp - 0.05), w=0.16, d=0.08, ly=-0.1)
        brace(p, W, (s * 1.7, Z2 + 0.1), (0, CGZ - 0.1), w=0.15, d=0.08, ly=-0.1)
    hw = (CGZ - 8.1) / tp
    brace(p, W, (-hw, 8.1), (hw, 8.1), w=0.15, d=0.08, ly=-0.1)
    brace(p, W, (0, 8.1), (0, CGZ - 0.15), w=0.15, d=0.08, ly=-0.1)


def gable_end(p, W, poly, posts, collar, window):
    p.add(bm_prism(poly, 0.22), "plaster", W)
    zc, c0, c1 = collar
    brace(p, W, (c0, zc), (c1, zc), w=0.16, d=0.08, ly=-0.12)
    brace(p, W, (0, zc), (0, RZ - 0.25), w=0.16, d=0.08, ly=-0.12)
    for u in posts:
        brace(p, W, (u, Z2), (u, Z2 + (JY - abs(u)) * TP - 0.08), w=0.16, d=0.08, ly=-0.12)
    u, ww, zb, zt = window
    p.add(bm_box(ww, 0.04, zt - zb), "glass", W @ M((u, -0.08, (zb + zt) / 2)))
    for zz in (zb, zt):
        p.add(bm_box(ww + 0.12, 0.1, 0.08), "wood_dark", W @ M((u, -0.12, zz)))
    for s in (-1, 1):
        p.add(bm_box(0.08, 0.1, zt - zb), "wood_dark", W @ M((u + s * ww / 2, -0.12, (zb + zt) / 2)))
    p.add(bm_box(0.05, 0.08, zt - zb), "wood_light", W @ M((u, -0.12, (zb + zt) / 2)))


def stage_09(p, rnd, extra):
    """The big tiled roof with a front cross gable, half-timbered gable ends and verge boards."""
    roof_courses(p, rnd)
    cross_roof(p, rnd)
    p.cyl(0.15, 2 * XG + 0.1, (-XG - 0.05, 0, RZ + 0.08), "roof_dark", segs=6, rot=(0, 90, 0))
    L = YE / CP
    zmid = (ZE + RZ) / 2 + 0.05
    for side in (-1, 1):
        p.box((0.07, L + 0.05, 0.28), (-XG - 0.02, side * YE / 2, zmid), "wood_dark", rot=(-side * PITCH, 0, 0))
    p.box((0.07, L + 0.05, 0.28), (XG + 0.02, YE / 2, zmid), "wood_dark", rot=(-PITCH, 0, 0))
    lf = (-TY1) / CP
    p.box((0.07, lf + 0.05, 0.28), (XG + 0.02, TY1 / 2, RZ + TY1 / 2 * TP + 0.05), "wood_dark", rot=(PITCH, 0, 0))
    hw = JY - 1.6 / TP
    gable_end(p, run_frame("-X", -JX + 0.11)[0], [(-JY, Z2), (JY, Z2), (0, RZ)],
              (-1.3, 1.3), (Z2 + 1.6, -hw, hw), (0.0, 0.7, Z2 + 0.35, Z2 + 1.3))
    gable_end(p, run_frame("+X", JX - 0.11)[0], [(TY1, Z2), (JY, Z2), (0, RZ), (TY1, RZ + TY1 * TP)],
              (1.6,), (Z2 + 1.6, TY1, hw), (0.45, 0.6, Z2 + 0.35, Z2 + 1.3))
    # plain walls closing the attic over the tower notch (behind the tower later)
    p.add(bm_prism([(-JY, Z2), (TY1, Z2), (TY1, RZ + TY1 * TP)], 0.2), "plaster", run_frame("+X", TX0 - 0.1)[0])
    p.add(bm_prism([(TX0, Z2), (JX, Z2), (JX, RZ + TY1 * TP + 0.05), (TX0, RZ + TY1 * TP + 0.05)], 0.2), "plaster",
          run_frame("-Y", TY1 + 0.1)[0])


def dormer(p, rnd, x):
    yf = -2.55
    zr = Z2 + (JY + yf) * TP
    zb, zt = zr - 0.25, zr + 1.05
    p.box((1.2, 0.16, zt - zb), (x, yf, (zb + zt) / 2), "plaster")
    for s in (-1, 1):
        p.box((0.12, 1.7, zt - zb), (x + s * 0.56, yf + 0.85, (zb + zt) / 2), "plaster")
        p.box((0.14, 0.2, zt - zb + 0.05), (x + s * 0.55, yf - 0.03, (zb + zt) / 2), "wood_dark")
    p.box((1.3, 0.2, 0.14), (x, yf - 0.03, zt - 0.05), "wood_dark")
    wz0, wz1 = zr + 0.15, zt - 0.17
    p.box((0.62, 0.04, wz1 - wz0), (x, yf - 0.07, (wz0 + wz1) / 2), "glass")
    for zz in (wz0, wz1):
        p.box((0.74, 0.1, 0.07), (x, yf - 0.1, zz), "wood_light")
    for s in (-1, 0, 1):
        p.box((0.06 if s else 0.04, 0.1, wz1 - wz0), (x + s * 0.34, yf - 0.1, (wz0 + wz1) / 2), "wood_light")
    p.add(bm_prism([(x - 0.6, zt), (x + 0.6, zt), (x, zt + 0.5)], 0.16), "plaster", M((0, yf, 0)))
    a = math.degrees(math.atan2(0.6, 0.75))
    for s in (-1, 1):
        p.add(jitter(bm_box(1.06, 2.0, 0.09), 0.01, rnd.randint(0, 9999)), "roof_mid",
              M((x + s * 0.37, yf + 0.75, zt + 0.25), (0, s * a, 0)))
    p.cyl(0.09, 2.05, (x, yf - 0.27, zt + 0.55), "roof_dark", segs=6, rot=(-90, 0, 0))


def stage_10(p, rnd, extra):
    """Two dormer windows on the front slope and a tall stone chimney (smoke point)."""
    for x in (-3.4, 3.4):
        dormer(p, rnd, x)
    cx, cy, _ = SMOKE
    z = 7.9
    k = 0
    while z < 10.85:
        h = 0.42
        for s in (-1, 1):
            p.add(jitter(bm_box(0.46, 0.72, h - 0.03), 0.012, k * 2 + s), rnd.choice(STONE_COLS),
                  M((cx + s * 0.23 + (0.04 if k % 2 else -0.04), cy, z + h / 2)))
        p.box((0.86, 0.66, h), (cx, cy, z + h / 2), "stone_dark")
        z += h
        k += 1
    p.box((1.08, 0.88, 0.14), (cx, cy, z + 0.07), "stone_light", bevel=0.02)
    for dx in (-0.2, 0.2):
        p.cyl(0.13, 0.32, (cx + dx, cy, z + 0.14), "roof", r2=0.1, segs=8)
        p.cyl(0.075, 0.02, (cx + dx, cy, z + 0.455), "ink", segs=8)
    extra.append(("empty", "smoke", (cx - 0.2, cy, z + 0.7)))


def stage_11(p, rnd, extra):
    """The corner tower in coursed stone: little arched door, arrow slits, string course,
    corbelled cornice."""
    for run in TOWER:
        stone_run(p, rnd, run, ZS_TOWER, bw=(0.65, 1.25))
    s = TX1 - TX0
    p.box((s + 0.14, s + 0.14, 0.17), (TCX, TCY, 3.63), "stone_light")
    p.box((s + 0.26, s + 0.26, 0.25), (TCX, TCY, TZ + 0.025), "stone_light", bevel=0.02)
    for side in range(4):
        F = M((TCX, TCY, 0), (0, 0, 90 * side))
        for j in range(7):
            u = -s / 2 + 0.2 + j * (s - 0.4) / 6
            p.add(bm_box(0.16, 0.2, 0.24), rnd.choice(["stone_light", "stone"]), F @ M((u, -s / 2 - 0.05, TZ - 0.21)))
    W = TOWER[0].W
    uc, w, sill, spring, _ = TOWER[0].ops[0]
    arch_door(p, W, uc, w, sill, spring, 0.04, 4, (1.0, 1.65))
    p.box((1.2, 0.45, 0.25), (TCX, TY0 - 0.35, 0.125), "stone", bevel=0.03)
    p.cyl(0.035, 0.04, (uc + 0.25, TY0 + 0.23, 1.3), "iron", segs=8, rot=(90, 0, 0))


def stage_12(p, rnd, extra):
    """Open timber belfry with a railing and knee braces, under a flared slate spire."""
    h = 1.25
    zb0, zb1 = BZ0, BZ1
    for side in range(4):
        F = M((TCX, TCY, 0), (0, 0, 90 * side))
        for u in (-h, 0.0):
            p.add(bm_box(0.24, 0.24, zb1 - zb0), "wood_dark", F @ M((u, -h, (zb0 + zb1) / 2)))
        p.add(bm_box(2 * h + 0.24, 0.26, 0.16), "wood_dark", F @ M((0, -h, zb0 + 0.08)))
        p.add(bm_box(2 * h + 0.28, 0.3, 0.22), "wood_dark", F @ M((0, -h, zb1 - 0.11)))
        p.add(bm_box(2 * h, 0.12, 0.08), "wood_mid", F @ M((0, -h, zb0 + 0.8)))
        for u0 in (-h, 0.0):
            for k in (1, 2, 3):
                p.add(bm_box(0.06, 0.06, 0.62), "wood_light", F @ M((u0 + k * h / 4, -h, zb0 + 0.47)))
            a, b = u0 + 0.12, u0 + h - 0.12
            brace(p, F, (a, zb1 - 0.7), (a + 0.4, zb1 - 0.2), w=0.12, d=0.14, ly=-h)
            brace(p, F, (b, zb1 - 0.7), (b - 0.4, zb1 - 0.2), w=0.12, d=0.14, ly=-h)
    rot = M((TCX, TCY, 0), (0, 0, 45))
    k2 = math.sqrt(2)
    p.add(bm_lathe([((h + 0.42) * k2, zb1 - 0.05), ((h + 0.12) * k2, zb1 + 0.25), (0.07, SPIRE)], 4), "slate", rot)

    def r_at(z):
        return (h + 0.12) * k2 + (0.07 - (h + 0.12) * k2) * (z - zb1 - 0.25) / (SPIRE - zb1 - 0.25)

    for z in (zb1 + 0.7, zb1 + 1.25, zb1 + 1.8):
        p.add(bm_lathe([(r_at(z) + 0.03, z), (r_at(z + 0.1) + 0.03, z + 0.1)], 4, arc=(0, 360)),
              "slate_dark", rot)
    p.add(bm_lathe([((h + 0.44) * k2, zb1 - 0.08), ((h + 0.44) * k2, zb1 - 0.02)], 4, arc=(0, 360)),
          "slate_dark", rot)
    p.ball(0.1, (TCX, TCY, SPIRE + 0.02), "gold", subdiv=1)


def banner(x, y, ztop, name):
    b = Part(name)
    b.add(bm_prism([(x - 0.28, ztop), (x + 0.28, ztop), (x + 0.28, ztop - 1.95), (x, ztop - 1.72), (x - 0.28, ztop - 1.95)], 0.03),
          "banner", M((0, y, 0)))
    for s in (-1, 1):
        b.box((0.04, 0.042, 1.55), (x + s * 0.21, y, ztop - 0.95), "gold")
    b.box((0.46, 0.042, 0.05), (x, y, ztop - 0.12), "gold")
    b.cyl(0.15, 0.046, (x, y + 0.023, ztop - 0.75), "gold", segs=12, rot=(90, 0, 0))
    b.cyl(0.085, 0.05, (x, y + 0.025, ztop - 0.75), "banner", segs=10, rot=(90, 0, 0))
    b.box((0.03, 0.054, 0.12), (x, y, ztop - 0.75), "gold")
    return b


def flag_part():
    f = Part("flag")
    length, height, nx = 1.15, 0.72, 7
    x0, y0, zt0 = TCX + 0.04, TCY, FLAG_TOP

    def wave(u):
        return 0.11 * math.sin(u * math.pi * 1.6) * u

    bm = bmesh.new()
    for side in (-1, 1):
        cols = []
        for i in range(nx + 1):
            u = i / nx
            x, y = x0 + length * u, y0 + wave(u) + side * 0.008
            zt = zt0 - 0.06 * u * u
            cols.append((bm.verts.new((x, y, zt)), bm.verts.new((x, y, zt - height + 0.05 * u))))
        for (at, ab), (bt, bb) in zip(cols, cols[1:]):
            face = [ab, bb, bt, at]
            bm.faces.new(face if side < 0 else list(reversed(face)))
    f.add(bm, "banner")
    u = 0.45
    f.cyl(0.13, 0.04, (x0 + length * u, y0 + wave(u) + 0.02, zt0 - height / 2 - 0.01), "gold", segs=10, rot=(90, 0, 0))
    f.box((0.035, 0.05, 0.62), (x0 + 0.03, y0, zt0 - height / 2), "gold")
    return f


def stage_13(p, rnd, extra):
    """Civic colours: the flag on the spire (`flag`), two banners (`banner_l`, `banner_r`)
    and the town crest on the front gable."""
    p.cyl(0.035, FLAG_TOP + 0.1 - SPIRE, (TCX, TCY, SPIRE), "wood_dark", segs=6)
    p.ball(0.06, (TCX, TCY, FLAG_TOP + 0.12), "gold", subdiv=1)
    extra.append((flag_part(), (TCX, TCY, FLAG_TOP)))
    yb, zt = -JY - 0.17, 6.02
    for x, name in ((-2.25, "banner_l"), (2.25, "banner_r")):
        p.cyl(0.03, 0.72, (x - 0.36, yb, zt + 0.03), "wood_dark", segs=6, rot=(0, 90, 0))
        for s in (-1, 1):
            p.ball(0.045, (x + s * 0.38, yb, zt + 0.03), "gold", subdiv=1)
            p.box((0.04, 0.2, 0.04), (x + s * 0.25, yb + 0.09, zt + 0.03), "iron")
        extra.append((banner(x, yb, zt, name), (x, yb, zt + 0.03)))
    # crest: gold-rimmed shield with a coiled serpent rune
    shield = [(-0.36, 0.42), (0.36, 0.42), (0.36, -0.05), (0.2, -0.32), (0, -0.44), (-0.2, -0.32), (-0.36, -0.05)]
    zc, yc = 7.35, -JY - 0.03
    p.add(bm_prism([(x, zc + z) for x, z in shield], 0.06), "gold", M((0, yc, 0)))
    p.add(bm_prism([(x * 0.8, zc + z * 0.8) for x, z in shield], 0.08), "banner", M((0, yc - 0.01, 0)))
    pts = [(0.12 * math.cos(a), yc - 0.06, zc + 0.06 + 0.12 * math.sin(a) - 0.05 * a / TAU) for a in
           [TAU * 0.1 + TAU * 1.1 * k / 12 for k in range(13)]]
    p.add(bm_tube(pts, 0.025, 5), "gold")
    p.ball(0.04, pts[-1], "gold", subdiv=0)
    p.box((0.9, 0.1, 0.08), (0, yc - 0.02, zc + 0.5), "wood_dark")


def notice_board(p, rnd):
    B = M((-4.75, -5.2, 0), (0, 0, -12))

    def a(bm, m, loc, rot=(0, 0, 0)):
        p.add(bm, m, B @ M(loc, rot))

    for sx in (-0.85, 0.85):
        a(jitter(bm_box(0.14, 0.14, 2.4), 0.01, 3), "wood_mid", (sx, 0, 1.2))
    a(bm_box(1.62, 0.07, 1.1), "wood_light", (0, 0, 1.5))
    for z in (0.92, 2.08):
        a(bm_box(1.84, 0.11, 0.1), "wood_dark", (0, 0, z))
    for s in (-1, 1):
        a(bm_box(2.15, 0.6, 0.06), "shingle", (0, s * 0.24, 2.5), rot=(-s * 28, 0, 0))
    a(bm_box(2.2, 0.1, 0.1), "shingle_dark", (0, 0, 2.66))
    notes = [(-0.55, 1.72, 0.32, 0.4, 4, "parchment"), (-0.1, 1.78, 0.3, 0.34, -3, "white"),
             (0.42, 1.7, 0.38, 0.44, 6, "parchment"), (-0.5, 1.22, 0.36, 0.3, -5, "white"),
             (0.04, 1.25, 0.28, 0.38, 2, "canvas"), (0.5, 1.2, 0.3, 0.3, -7, "white")]
    for i, (x, z, w, h, r, col) in enumerate(notes):
        N = B @ M((x, -0.042, z), (0, r, 0))
        p.add(bm_box(w, 0.012, h), col, N)
        p.add(bm_box(0.035, 0.02, 0.035), "cloth" if i % 2 else "iron", N @ M((0, -0.01, h / 2 - 0.05)))
        if i == 2:
            p.add(bm_box(w - 0.04, 0.016, 0.07), "banner", N @ M((0, -0.004, h / 2 - 0.12)))
        for k in range(3 if h > 0.33 else 2):
            p.add(bm_box(w * (0.7 - 0.12 * (k % 2)), 0.016, 0.014), "ink", N @ M((0, -0.003, h / 2 - 0.2 - 0.07 * k)))
    a(bm_box(0.6, 0.4, 0.34), "wood", (0.35, -0.35, 0.17), rot=(0, 0, 10))
    for k in range(3):
        a(bm_cyl(0.055, 0.055, 0.5, 8), "parchment", (0.1, -0.45 + 0.11 * k, 0.4), rot=(0, 90, 10))


def records_cart(p, rnd):
    C = M((3.75, -4.95, 0), (0, 0, 16))

    def a(bm, m, loc, rot=(0, 0, 0)):
        p.add(bm, m, C @ M(loc, rot))

    for sx in (-0.62, 0.54):
        a(bm_cyl(0.32, 0.32, 0.08, 10), "wood_mid", (sx, 0.05, 0.32), rot=(0, 90, 0))
        a(bm_cyl(0.07, 0.07, 0.1, 6), "iron", (sx - 0.01, 0.05, 0.32), rot=(0, 90, 0))
    a(bm_cyl(0.04, 0.04, 1.3, 6), "wood_dark", (-0.65, 0.05, 0.32), rot=(0, 90, 0))
    a(bm_box(1.0, 0.8, 0.08), "wood", (0, 0, 0.5))
    for s in (-1, 1):
        a(bm_box(1.0, 0.05, 0.22), "wood_mid", (0, s * 0.38, 0.65))
        a(bm_box(0.06, 1.0, 0.06), "wood_dark", (s * 0.36, 0.85, 0.45), rot=(-8, 0, 0))
    a(bm_box(0.05, 0.8, 0.22), "wood_mid", (-0.48, 0, 0.65))
    a(bm_box(0.08, 0.08, 0.42), "wood_dark", (0, -0.36, 0.25))
    a(bm_box(0.5, 0.55, 0.3), "wood_light", (-0.2, 0.02, 0.69))
    for k in range(4):
        a(bm_cyl(0.06, 0.06, 0.6, 8), "parchment", (-0.2, -0.18 + 0.12 * k, 0.86 + 0.04 * (k % 2)), rot=(0, 90, 4))
        a(bm_cyl(0.065, 0.065, 0.04, 8), "cloth" if k % 2 else "gold", (-0.02, -0.18 + 0.12 * k, 0.86 + 0.04 * (k % 2)), rot=(0, 90, 4))
    cols = ["banner", "tunic", "mustard", "wood_dark", "cap"]
    for k in range(5):
        a(bm_box(0.3, 0.22, 0.065), cols[k], (0.3, 0.05, 0.575 + 0.068 * k), rot=(0, 0, rnd.uniform(-12, 12)))
    a(bm_box(0.3, 0.22, 0.05), "parchment", (0.28, -0.25, 0.57), rot=(0, 0, 20))


def stage_14(p, rnd, extra):
    """Open for business: lanterns on the pedestals, the quest notice board, a cart of town
    records, barrels by the tower, a bench and potted bay trees on the top step."""
    for s in (-1, 1):
        add_lantern(p, (s * 2.625, -4.875, 1.05), 1.15)
    notice_board(p, rnd)
    records_cart(p, rnd)
    barrel(p, 7.25, -4.25, 10)
    barrel(p, 6.95, -4.85, 40)
    p.box((0.55, 0.5, 0.45), (7.3, -4.95, 0.225), "wood_light", rot=(0, 0, 18), bevel=0.02)
    # bench under the left windows
    bx, by = -3.35, -4.05
    p.box((1.15, 0.38, 0.07), (bx, by, 0.45), "wood", bevel=0.01)
    for dx in (-0.48, 0.48):
        for dy in (-0.13, 0.13):
            p.box((0.07, 0.07, 0.45), (bx + dx, by + dy, 0.21), "wood_dark")
        p.box((0.07, 0.07, 0.5), (bx + dx, by + 0.16, 0.7), "wood_dark")
    p.box((1.15, 0.06, 0.2), (bx, by + 0.17, 0.82), "wood", bevel=0.01)
    for s in (-1, 1):
        x, y = s * 1.95, -3.92
        p.add(bm_lathe([(0.16, 0), (0.22, 0.32), (0.25, 0.36), (0.25, 0.42)], 10), "roof", M((x, y, 0.375)))
        p.cyl(0.035, 0.45, (x, y, 0.75), "wood_dark", segs=5)
        p.add(jitter(bm_ico(0.34, 1), 0.04, 30 + s), "grass_dark", M((x, y, 1.3), scale=(1, 1, 1.15)), smooth=True)
        p.add(jitter(bm_ico(0.2, 1), 0.03, 40 + s), "grass", M((x + 0.12, y - 0.12, 1.45)), smooth=True)


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06, stage_07,
          stage_08, stage_09, stage_10, stage_11, stage_12, stage_13, stage_14]


def build():
    model = common.reset()
    stages = []
    for i, fn in enumerate(STAGES, 1):
        name = "stage_%02d" % i
        node = common.empty(name, model)
        part = Part(name + "_mesh")
        extra = []
        fn(part, random.Random(3000 + i), extra)
        objs = []
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for xp, origin in [e for e in extra if e[0] != "empty"]:
            objs.append(xp.to_object(model, parent=node, origin=origin))
        for _, ename, loc in [e for e in extra if e[0] == "empty"]:
            common.empty(ename, model, parent=node, loc=loc)
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    bpy.context.view_layer.update()
    lo = [min((o.matrix_world @ Vector(c))[k] for o in meshes for c in o.bound_box) for k in range(3)]
    hi = [max((o.matrix_world @ Vector(c))[k] for o in meshes for c in o.bound_box) for k in range(3)]
    print("TRIS", counts, "TOTAL", sum(counts.values()))
    print("BBOX", [round(v, 2) for v in lo], [round(v, 2) for v in hi])
    for name in ("flag", "banner_l", "banner_r", "smoke"):
        o = bpy.data.objects[name]
        print("NODE", name, o.parent.name, [round(v, 3) for v in o.matrix_world.translation])
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)   # meadow occludes the bake
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("townhall.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=9.0)
            common.render(os.path.join(common.OUT_PREV, "townhall_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-32, elev=13, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "townhall.png"))
    common.save_blend("townhall")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
