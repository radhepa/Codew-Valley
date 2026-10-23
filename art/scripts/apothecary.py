"""Apothecary and herb garden (building 8, Mirela): a crooked timber-and-stone cottage with a
glass lean-to greenhouse on its +X gable and raised herb beds on the -X side, in 14 cumulative
stages (stage_01 .. stage_14). See art/specs/apothecary.md.

Run headless:  powershell -File art/blender.ps1 art/scripts/apothecary.py
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

Layout: cottage 5 x 4 m centred on the origin, ridge along X, door on the front (-Y) eave side.
Greenhouse x 2.5 .. 5.3, garden x -6.4 .. -3.15. The whole cottage is sheared and sagged by
crook() after each stage is built, so every stage leans the same way.
Wall frames: local x = along the wall ("a"), local -y = outward, z = height.
"""
import sys, os, math, random, importlib, json

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
import bmesh
from mathutils import Vector

RENDER_STAGES = globals().get("RENDER_STAGES", True)
TAU = 2 * math.pi

common.PALETTE.update({
    "slate": "#6F7478", "slate_dark": "#585C61", "slate_light": "#8A8D8C",
    "moss": "#6E7C45", "moss_light": "#8D9956",
    "terracotta": "#AE6B4C", "terracotta_dark": "#8A523F",
    "sage_paint": "#7D8E6D", "potion": "#5F8F66", "greenhouse_glass": "#C4DAD6",
    "lavender": "#8D7BB3", "sage_leaf": "#8E9D7C", "mint_leaf": "#6CA058", "rosemary_leaf": "#4E6C46",
    "marigold": "#DC8F3A", "dried_herb": "#8A8B59", "dried_gold": "#B39B5B", "dried_lavender": "#8C80A2",
})

# ------------------------------------------------------------------ dimensions
W, D = 2.5, 2.0              # outer wall faces at x = +-W, y = +-D
BASE_Z = 0.35                # plinth top / floor
STONE_Z = 1.1                # top of the rubble wall
SILL_T = 0.16                # timber sill on the stone
EAVE = 2.9                   # top of the wall plate
SLOPE = 1.25                 # roof pitch (rise / run), ~51 degrees
ZR_WALL = EAVE + 0.40        # tile top above the wall face
RIDGE = ZR_WALL + SLOPE * D  # 5.8
A_ROOF = math.atan(SLOPE)
COS_A = math.cos(A_ROOF)
OVER_EAVE, OVER_VERGE = 0.5, 0.35
LS = (D + OVER_EAVE) / COS_A  # slope length, eave to ridge
UNDER = 0.24 / COS_A          # tile top to rafter bottom, vertically

GX0, GX1, GY = W, 5.3, 1.6   # greenhouse: x from the gable to the outer wall, y +-GY
G_SILL, GZ0, GZ1 = 0.5, 3.1, 2.1
G_DOOR = (3.35, 4.15)
CY = 0.35                    # chimney centre (y) on the -X gable
CH_IN = -W - 0.04

DOOR = (-0.3, 0.47, BASE_Z, 2.3)          # (a centre, half width, z0, z1)
WALLS = {
    "front": (M((0, -D, 0)), W, [DOOR, (-1.7, 0.33, 1.32, 2.2), (1.35, 0.44, 1.25, 2.25)]),
    "back": (M((0, D, 0), (0, 0, 180)), W, [(-0.7, 0.4, 1.32, 2.2), (1.6, 0.3, 1.4, 2.1)]),
    "left": (M((-W, 0, 0), (0, 0, -90)), D, [(1.2, 0.32, 1.35, 2.1)]),
    "right": (M((W, 0, 0), (0, 0, 90)), D, [(0.0, 0.4, 1.32, 2.2)]),
}
STONES = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid", "stone_warm"]

BEDS = [(-6.0, -4.1, -3.7, -2.6), (-6.0, -4.1, -2.0, -0.9), (-6.0, -4.1, -0.3, 0.8)]
BED_H = 0.38
SPIRAL = (-5.0, 2.55)
HERB_X = (-5.72, -5.28, -4.84, -4.4)


def zr(y):
    return RIDGE - SLOPE * abs(y)


def z_under(y):
    return zr(y) - UNDER


def zt(x):
    """Greenhouse roof line (top of the frame) at x."""
    return GZ0 - (GZ0 - GZ1) * (x - GX0) / (GX1 - GX0)


def slope_frame(s):
    """Frame on a roof slope (s=-1 front, +1 back): origin at the eave edge, local y up the slope,
    local z out of the tiles, so the tile top is the local z = 0 plane."""
    return M((0, s * (D + OVER_EAVE), zr(D + OVER_EAVE)), (math.degrees(A_ROOF), 0, 0 if s < 0 else 180))


def crook(co):
    """The crooked lean: shear toward +X with height, a slight twist, and a sagging ridge.
    Fades out across the greenhouse so its outer wall stays plumb."""
    x, y, z = co
    w = 1.0 if x <= W + 0.05 else max(0.0, 1.0 - (x - W - 0.05) / 1.25)
    if w <= 0.0:
        return Vector(co)
    t = max(z - 0.45, 0.0)
    dx = 0.022 * t + 0.0055 * t * t
    dy = 0.02 * t * max(-1.0, min(1.0, x / W))
    f = min(max((z - EAVE + 0.3) / (RIDGE - EAVE + 0.3), 0.0), 1.0)
    dz = -0.16 * f * math.cos(min(abs(x) / (W + 0.4), 1.0) * math.pi / 2) ** 2
    return Vector((x + w * dx, y + w * dy, z + w * dz))


# ------------------------------------------------------------------ helpers

def holes(ops):
    return [(c - hw, c + hw, z0, z1) for c, hw, z0, z1 in ops]


def wall_rects(a0, a1, z0, z1, hs):
    """Rectangles (a_lo, a_hi, z_lo, z_hi) covering [a0,a1] x [z0,z1] minus the holes."""
    cuts = sorted({a0, a1} | {h[i] for h in hs for i in (0, 1) if a0 < h[i] < a1})
    out = []
    for lo, hi in zip(cuts, cuts[1:]):
        mid = (lo + hi) / 2
        zs = sorted((max(h[2], z0), min(h[3], z1)) for h in hs if h[0] < mid < h[1] and h[2] < z1 and h[3] > z0)
        z = z0
        for hz0, hz1 in zs:
            if hz0 > z + 1e-4:
                out.append((lo, hi, z, hz0))
            z = max(z, hz1)
        if z1 > z + 1e-4:
            out.append((lo, hi, z, z1))
    return out


def free_spans(a0, a1, z0, z1, hs):
    bl = sorted((max(h[0], a0), min(h[1], a1)) for h in hs
                if h[2] < z1 - 0.05 and h[3] > z0 + 0.05 and h[1] > a0 and h[0] < a1)
    out, t = [], a0
    for lo, hi in bl:
        if lo > t + 1e-3:
            out.append((t, lo))
        t = max(t, hi)
    if a1 > t + 1e-3:
        out.append((t, a1))
    return out


def wbox(p, F, a0, a1, z0, z1, d0, d1, matname, jit=0.0, seed=0):
    bm = bm_box(a1 - a0, d1 - d0, z1 - z0)
    if jit:
        jitter(bm, jit, seed)
    p.add(bm, matname, F @ M(((a0 + a1) / 2, (d0 + d1) / 2, (z0 + z1) / 2)))


def timber(p, F, pa, pb, t, matname, d0=-0.035, d1=0.18):
    da, dz = pb[0] - pa[0], pb[1] - pa[1]
    p.add(bm_box(math.hypot(da, dz), d1 - d0, t), matname,
          F @ M(((pa[0] + pb[0]) / 2, (d0 + d1) / 2, (pa[1] + pb[1]) / 2), (0, -math.degrees(math.atan2(dz, da)), 0)))


def stone_wall(p, rnd, F, a0, a1, z0, z1, hs, depth=0.32, face=-0.04, course=0.25, wr=(0.38, 0.72), core=True):
    """Rough coursed stone blocks over [a0,a1] x [z0,z1], outer face at local y = face."""
    n = max(1, round((z1 - z0) / course))
    zs = [z0] + [z0 + (z1 - z0) * i / n + rnd.uniform(-0.02, 0.02) for i in range(1, n)] + [z1]
    if core:
        for lo, hi, za, zb in wall_rects(a0, a1, z0, z1, hs):
            wbox(p, F, lo + 0.02, hi - 0.02, za, zb - 0.02, face + 0.07, face + depth - 0.05, "stone_dark")
    for zl, zh in zip(zs, zs[1:]):
        for lo, hi in free_spans(a0, a1, zl, zh, hs):
            t = lo
            while hi - t > 0.02:
                w = rnd.uniform(*wr)
                if hi - t - w < wr[0] * 0.6:
                    w = hi - t
                d = depth + rnd.uniform(-0.03, 0.02)
                f = face + rnd.uniform(-0.012, 0.015)
                wbox(p, F, t + 0.016, t + w - 0.016, zl + 0.016, zh - 0.016, f, f + d, rnd.choice(STONES),
                     jit=0.016, seed=rnd.randint(0, 99999))
                t += w


def blob(p, rnd, matname, x, y, z, r, sq=0.75, j=0.25):
    p.add(jitter(bm_ico(r, 0), r * j, rnd.randint(0, 99999)), matname,
          M((x, y, z + r * sq * 0.8), (0, 0, rnd.uniform(0, 72)), (1, 1, sq)))


def slab_stone(p, rnd, x, y, r, z=0.0, matname=None, h=0.05):
    p.add(jitter(bm_cyl(r, r * 0.95, h, 7), 0.02, rnd.randint(0, 9999), keep_bottom=0.0),
          matname or rnd.choice(["stone_light", "stone", "stone_light"]),
          M((x, y, z), (0, 0, rnd.uniform(0, 50)), (rnd.uniform(1.0, 1.25), rnd.uniform(0.8, 1.0), 1)))


def frustum(x0b, x1b, y0b, y1b, x0t, x1t, y0t, y1t, z0, z1):
    bm = bmesh.new()
    b = [bm.verts.new(v) for v in ((x0b, y0b, z0), (x1b, y0b, z0), (x1b, y1b, z0), (x0b, y1b, z0))]
    t = [bm.verts.new(v) for v in ((x0t, y0t, z1), (x1t, y0t, z1), (x1t, y1t, z1), (x0t, y1t, z1))]
    bm.faces.new(list(reversed(b)))
    bm.faces.new(t)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((b[i], b[j], t[j], t[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def rounded(wd, ht, rr, n=3):
    pts = []
    for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cxs * (wd / 2 - rr) + rr * math.cos(a), czs * (ht / 2 - rr) + rr * math.sin(a)))
    return pts


def pot(p, x, y, z, s=1.0, matname="terracotta"):
    prof = [(0.07, 0.0), (0.1, 0.15), (0.12, 0.155), (0.12, 0.19), (0.1, 0.19)]
    p.add(bm_lathe([(r * s, h * s) for r, h in prof], 8, cap_top=False), matname, M((x, y, z)))
    p.cyl(0.097 * s, 0.01, (x, y, z + 0.165 * s), "soil_dark", segs=8)


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes and string around the cottage, Mirela's plan and seedlings."""
    pts = []
    for i in range(40):
        a = TAU * i / 40
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** 4 + abs(s) ** 4) ** 0.25)
        pts.append((c * r * 3.45 * (1 + rnd.uniform(-0.03, 0.03)), s * r * 3.0 * (1 + rnd.uniform(-0.03, 0.03))))
    p.add(bm_slab(pts, 0.03), "dirt")
    xs, ys = W + 0.3, D + 0.3
    stakes = [(-xs, -ys), (0, -ys), (xs, -ys), (xs, ys), (0, ys), (-xs, ys)]
    for k, (x, y) in enumerate(stakes):
        p.box((0.08, 0.08, 0.38), (x, y, 0.19), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, 0.38), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        if k % 2 == 0:
            p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.47)))
    for (x0, y0), (x1, y1) in zip(stakes, stakes[1:] + stakes[:1]):
        p.box((math.hypot(x1 - x0, y1 - y0), 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, 0.3), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # the plan: a crooked little cottage sketch held down by pebbles
    px, py, pr = -1.5, -3.45, -8
    base = M((px, py, 0.04), (0, 0, pr))
    p.add(bm_box(0.64, 0.46, 0.012), "white", base)
    for loc, size, ang in (((0, -0.06, 0.007), (0.3, 0.012, 0.004), 0), ((-0.15, 0.0, 0.007), (0.012, 0.13, 0.004), 0),
                           ((0.15, 0.0, 0.007), (0.012, 0.13, 0.004), 0), ((-0.08, 0.1, 0.007), (0.2, 0.012, 0.004), -35),
                           ((0.08, 0.1, 0.007), (0.2, 0.012, 0.004), 35), ((0.22, 0.02, 0.007), (0.012, 0.18, 0.004), 0)):
        p.add(bm_box(*size), "tunic", base @ M(loc, (0, 0, ang)))
    for i, (dx, dy) in enumerate(((-0.28, -0.19), (0.26, 0.2))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # seedling tray and a trowel: the garden comes first for an herbalist
    tm = M((1.6, -3.35, 0.03), (0, 0, 12))
    p.add(bm_box(0.62, 0.36, 0.1), "wood_mid", tm @ M((0, 0, 0.05)))
    p.add(bm_box(0.56, 0.3, 0.02), "soil_dark", tm @ M((0, 0, 0.095)))
    for i in range(3):
        for j in range(2):
            p.add(jitter(bm_ico(0.05, 0), 0.015, 10 * i + j), rnd.choice(["grass", "mint_leaf"]),
                  tm @ M((-0.18 + 0.18 * i, -0.07 + 0.14 * j, 0.13), scale=(1, 1, 1.3)))
    p.cyl(0.02, 0.22, (2.05, -3.15, 0.04), "wood_dark", segs=5, rot=(0, 90, 30))
    p.add(bm_prism([(-0.06, 0), (0.06, 0), (0.0, -0.15)], 0.012), "iron", M((2.26, -3.03, 0.045), (90, 0, 120)))
    for i in range(6):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.6, 2.2)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a), 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth with a flagstone floor, and the first stones for the walls."""
    p.box((2 * W + 0.12, 2 * D + 0.12, BASE_Z - 0.02), (0, 0, BASE_Z / 2 - 0.01), "stone_dark")
    for wall, (F, half, ops) in WALLS.items():
        long = wall in ("front", "back")
        ext = half + 0.13 if long else half + 0.13 - 0.36
        stone_wall(p, rnd, F, -ext, ext, 0.0, BASE_Z, [], depth=0.38, face=-0.13, course=0.35, wr=(0.55, 0.9), core=False)
    p.box((2 * W - 0.4, 2 * D - 0.4, 0.02), (0, 0, BASE_Z - 0.005), "stone_mid")
    for i in range(14):
        p.box((rnd.uniform(0.45, 0.7), rnd.uniform(0.35, 0.55), 0.03),
              (rnd.uniform(-W + 0.6, W - 0.6), rnd.uniform(-D + 0.55, D - 0.55), BASE_Z + 0.01),
              rnd.choice(["stone_light", "stone", "stone_light"]), rot=(0, 0, rnd.uniform(-8, 8)))
    for i, (x, y) in enumerate(((-1.6, D - 0.25), (-1.1, D - 0.25), (-1.35, D - 0.25))):
        p.box((0.48, 0.3, 0.24), (x, y, BASE_Z + 0.12 + (0.24 if i == 2 else 0)), rnd.choice(STONES),
              rot=(0, 0, rnd.uniform(-10, 10)), bevel=0.03)


def stage_03(p, rnd, extra):
    """Rubble stone lower walls to 1.1 m, with the door gap, and a pile of spare stones."""
    for wall, (F, half, ops) in WALLS.items():
        long = wall in ("front", "back")
        ext = half + 0.04 if long else half - 0.3
        stone_wall(p, rnd, F, -ext, ext, BASE_Z, STONE_Z, holes(ops))
    for i, (dx, dy, z) in enumerate(((0, 0, 0), (0.42, 0.1, 0), (0.2, 0.05, 0.22), (-0.1, 0.4, 0))):
        p.box((0.46, 0.3, 0.22), (-3.0 + dx, 2.65 + dy, z + 0.11), rnd.choice(STONES),
              rot=(0, 0, rnd.uniform(-20, 20)), bevel=0.03)
    p.add(bm_lathe([(0.22, 0), (0.28, 0.24), (0.25, 0.24), (0.19, 0.03)], 10, cap_top=False), "wood_mid", M((-2.3, 3.0, 0)))
    p.cyl(0.24, 0.02, (-2.3, 3.0, 0.18), "stone_light", segs=10)


def frame_wall(p, rnd, wall):
    F, half, ops = WALLS[wall]
    e = half - 0.075
    zb, ztop = STONE_Z + SILL_T, EAVE - 0.2
    d0, d1 = -0.035, 0.18
    studs = {}
    for c, hw, z0, z1 in ops:
        for a in (c - hw - 0.07, c + hw + 0.07):
            studs[round(a, 3)] = BASE_Z if z0 < STONE_Z else zb
    pos = sorted([-e, e] + list(studs))
    full, panels = [pos[0]], []
    for a, b in zip(pos, pos[1:]):
        op = next((o for o in ops if abs((a + b) / 2 - o[0]) < o[1]), None)
        n = 0 if op else int((b - a) / 1.05)
        pts = [a + (b - a) * k / (n + 1) for k in range(n + 2)]
        for u, v in zip(pts, pts[1:]):
            panels.append((u, v, op))
        full += pts[1:]
    for a in full[1:-1]:
        wbox(p, F, a - 0.07, a + 0.07, studs.get(round(a, 3), zb), ztop, d0, d1, "wood_mid",
             jit=0.006, seed=rnd.randint(0, 9999))
    for c, hw, z0, z1 in ops:
        if z0 > STONE_Z:
            wbox(p, F, c - hw, c + hw, z0 - 0.12, z0, d0, d1, "wood_mid")
        wbox(p, F, c - hw, c + hw, z1, z1 + 0.13, d0, d1, "wood_mid")
    for a, b, op in panels:
        if op:
            continue
        wbox(p, F, a + 0.07, b - 0.07, 1.86, 1.98, d0 + 0.01, d1, "wood_mid")
        if abs(a + e) < 1e-6:
            timber(p, F, (a + 0.12, zb + 0.05), (b - 0.07, ztop - 0.05), 0.11, "wood_dark", 0.0, 0.17)
        elif abs(b - e) < 1e-6:
            timber(p, F, (b - 0.12, zb + 0.05), (a + 0.07, ztop - 0.05), 0.11, "wood_dark", 0.0, 0.17)


def stage_04(p, rnd, extra):
    """Timber frame: sill, corner posts, studs, braces, wall plate, gable trusses, rafters, ridge beam."""
    for wall, (F, half, ops) in WALLS.items():
        ext = half + 0.035 if wall in ("front", "back") else half - 0.2
        for lo, hi, za, zb in wall_rects(-ext, ext, STONE_Z, STONE_Z + SILL_T, holes(ops)):
            wbox(p, F, lo, hi, za, zb, -0.035, 0.2, "wood_dark")
        wbox(p, F, -ext, ext, EAVE - 0.2, EAVE, -0.035, 0.2, "wood_dark")
        frame_wall(p, rnd, wall)
    z0 = STONE_Z + SILL_T
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.22, 0.22, EAVE - 0.2 - z0), (sx * (W - 0.075), sy * (D - 0.075), (z0 + EAVE - 0.2) / 2), "wood_dark")
    peak = z_under(0) - 0.02
    for wall in ("left", "right"):
        F = WALLS[wall][0]
        for s in (-1, 1):
            timber(p, F, (s * D, z_under(D) - 0.1), (0.0, peak - 0.1), 0.17, "wood_dark")
        wbox(p, F, -0.08, 0.08, EAVE, peak - 0.12, -0.035, 0.18, "wood_mid")
        ac = D * (1 - (4.1 - EAVE) / (peak - EAVE)) - 0.1
        wbox(p, F, -ac, ac, 4.04, 4.16, -0.035, 0.18, "wood_mid")
    for s in (-1, 1):
        S = slope_frame(s)
        for x in (-2.0, -1.0, 0.0, 1.0, 2.0):
            p.add(bm_box(0.11, LS - 0.04, 0.12), "wood_mid", S @ M((x, (LS + 0.04) / 2, -0.18)))
    for i in range(6):
        p.box((2 * (W + 0.3) / 6 + 0.01, 0.14, 0.2), (-(W + 0.3) + 2 * (W + 0.3) * (i + 0.5) / 6, 0, RIDGE - 0.12 / COS_A - 0.1), "wood_dark")
    # wheelbarrow of soil, parked for the garden to come
    bm = M((2.55, -3.85, 0), (0, 0, 28))
    p.add(frustum(-0.34, 0.34, -0.42, 0.3, -0.42, 0.42, -0.55, 0.42, 0.32, 0.6), "wood", bm)
    p.add(bm_box(0.62, 0.8, 0.04), "soil", bm @ M((0, -0.05, 0.57)))
    p.add(bm_cyl(0.18, 0.18, 0.06, 10), "wood_dark", bm @ M((0.03, -0.62, 0.18), (0, 90, 0)))
    for s in (-1, 1):
        p.add(bm_box(0.05, 1.45, 0.05), "wood_mid", bm @ M((s * 0.24, 0.05, 0.34), (-8, 0, 0)))
        p.add(bm_box(0.05, 0.05, 0.3), "wood_mid", bm @ M((s * 0.24, 0.3, 0.15)))


def stage_05(p, rnd, extra):
    """Plaster infill between the timbers, gables included."""
    for wall, (F, half, ops) in WALLS.items():
        ext = half - 0.03 if wall in ("front", "back") else half - 0.2
        for lo, hi, za, zb in wall_rects(-ext, ext, STONE_Z + 0.05, EAVE - 0.1, holes(ops)):
            wbox(p, F, lo, hi, za, zb, 0.0, 0.17, rnd.choice(["plaster", "plaster", "plaster", "plaster_shade"]))
    for wall in ("left", "right"):
        F = WALLS[wall][0]
        pts = [(-D, EAVE - 0.1), (D, EAVE - 0.1), (D, z_under(D) - 0.01), (0, z_under(0) - 0.03), (-D, z_under(D) - 0.01)]
        p.add(bm_prism(pts, 0.17), "plaster", F @ M((0, 0.085, 0)))
    # plaster tub and float left by the front corner
    p.add(bm_lathe([(0.2, 0), (0.25, 0.22), (0.23, 0.22), (0.18, 0.03)], 10, cap_top=False), "wood_mid", M((2.85, -2.55, 0)))
    p.cyl(0.22, 0.02, (2.85, -2.55, 0.17), "plaster", segs=10)
    p.box((0.2, 0.1, 0.015), (2.88, -2.5, 0.235), "wood_light", rot=(0, -15, 25))


def stage_06(p, rnd, extra):
    """Steep mossy slate roof with stepped courses, bargeboards, verge rafters and a ridge cap."""
    xw = W + OVER_VERGE
    nr = 12
    rl = LS / nr
    for s in (-1, 1):
        S = slope_frame(s)
        for i in range(10):          # in segments, so the deck sags with the tiles in crook()
            p.add(bm_box(2 * xw / 10 + 0.01, LS, 0.07), "wood_dark", S @ M((-xw + 2 * xw * (i + 0.5) / 10, LS / 2, -0.085)))
        for x in (-(W + 0.29), W + 0.29):
            p.add(bm_box(0.11, LS - 0.04, 0.12), "wood_mid", S @ M((x, (LS + 0.04) / 2, -0.18)))
        for k in range(nr):
            u = k / nr
            x = -xw - rnd.uniform(0, 0.4)
            mossp = (0.06 + 0.32 * (1 - u) ** 2) if s > 0 else (0.03 + 0.12 * (1 - u) ** 2)
            L = rl * 1.5 if k < nr - 1 else rl * 1.05
            while x < xw - 0.05:
                w = rnd.uniform(0.46, 0.6)
                x0, x1 = max(x, -xw), min(x + w, xw)
                if x1 - x0 > 0.08:
                    col = rnd.choice(["moss", "moss_light"]) if rnd.random() < mossp else \
                        rnd.choice(["slate", "slate", "slate_dark", "slate_light"])
                    p.add(bm_box(x1 - x0 - 0.025, L, 0.035), col,
                          S @ M(((x0 + x1) / 2, k * rl + L / 2, -0.028 + rnd.uniform(0, 0.008)),
                                (-7 + rnd.uniform(-1.2, 1.2), 0, rnd.uniform(-2, 2))))
                x += w
        for i in range(6 if s > 0 else 3):
            p.add(jitter(bm_ico(rnd.uniform(0.12, 0.2), 0), 0.04, rnd.randint(0, 999)), rnd.choice(["moss", "moss_light"]),
                  S @ M((rnd.uniform(-xw + 0.3, xw - 0.3), rnd.uniform(0.15, LS * 0.45), 0.03),
                        (0, 0, rnd.uniform(0, 90)), (1.6, 1.1, 0.4)))
        for x in (-xw - 0.03, xw + 0.03):
            p.add(bm_box(0.06, LS + 0.04, 0.24), "wood_dark", S @ M((x, LS / 2, -0.07)))
    cap = [(-0.21, -0.29), (0.0, -0.03), (0.21, -0.29), (0.21, -0.21), (0.0, 0.06), (-0.21, -0.21)]
    n = 13
    for i in range(n):
        seg = (2 * xw + 0.1) / n
        xc = -xw - 0.05 + seg * (i + 0.5)
        p.add(bm_prism(cap, seg - 0.02), rnd.choice(["slate_dark", "slate_dark", "slate", "moss"]),
              M((xc, 0, RIDGE + rnd.uniform(-0.01, 0.01)), (0, rnd.uniform(-2, 2), 90)))


def stage_07(p, rnd, extra):
    """Arched green plank door with iron straps and a ring, stone steps and a mat."""
    F = WALLS["front"][0]
    c, hw, z0, z1 = DOOR
    zc = z1 - hw
    wbox(p, F, c - hw, c + hw, z0, z1, 0.1, 0.16, "wood_dark")

    def arch_top(u):
        return zc + math.sqrt(max(hw * hw - u * u, 0.0))
    for i in range(5):
        a, b = -hw + 2 * hw * i / 5 + 0.012, -hw + 2 * hw * (i + 1) / 5 - 0.012
        pts = [(a, z0 + 0.01), (b, z0 + 0.01)] + [(b - (b - a) * k / 3, arch_top(b - (b - a) * k / 3)) for k in range(4)]
        p.add(bm_prism(pts, 0.06), "door", F @ M((c, 0.07, 0)))
    for z in (0.85, 1.7):
        wbox(p, F, c - hw + 0.04, c + hw - 0.12, z, z + 0.07, 0.015, 0.045, "iron")
        p.add(bm_cyl(0.05, 0.05, 0.03, 8), "iron", F @ M((c - hw + 0.06, 0.04, z + 0.035), (90, 0, 0)))
    ring = [(c + 0.27 + 0.065 * math.sin(TAU * k / 10), 0.015, 1.15 - 0.065 * math.cos(TAU * k / 10)) for k in range(11)]
    p.add(bm_tube(ring, 0.013, 5), "iron", F)
    p.add(bm_cyl(0.035, 0.035, 0.03, 8), "iron", F @ M((c + 0.27, 0.04, 1.22), (90, 0, 0)))
    p.box((1.25, 0.45, 0.2), (c, -D - 0.33, 0.1), "stone_light", bevel=0.03)
    p.box((1.45, 0.38, 0.1), (c + 0.05, -D - 0.72, 0.05), "stone", bevel=0.025, rot=(0, 0, 2))
    p.box((0.72, 0.3, 0.02), (c, -D - 0.33, 0.21), "cloth", rot=(0, 0, 3))
    p.box((0.62, 0.22, 0.021), (c, -D - 0.33, 0.212), "mustard", rot=(0, 0, 3))


def lattice(p, F, c, hw, z0, z1, depth, sp=0.26):
    h = z1 - z0
    zm = (z0 + z1) / 2
    for m in (1, -1):
        k = -int((hw + h / 2) / sp) - 1
        while k * sp < hw + h / 2 + sp:
            b = k * sp
            if m == 1:
                lo, hi = max(-hw, -h / 2 - b), min(hw, h / 2 - b)
            else:
                lo, hi = max(-hw, b - h / 2), min(hw, b + h / 2)
            if hi - lo > 0.03:
                um = (lo + hi) / 2
                p.add(bm_box((hi - lo) * math.sqrt(2), 0.02, 0.016), "iron",
                      F @ M((c + um, depth, zm + m * um + b), (0, -45 * m, 0)))
            k += 1


def window(p, rnd, F, op, shutters=True, box=False):
    c, hw, z0, z1 = op
    h, zm, f = z1 - z0, (z0 + z1) / 2, 0.075

    def lb(size, loc, matname, rot=(0, 0, 0)):
        p.add(bm_box(*size), matname, F @ M(loc, rot))
    for s in (-1, 1):
        lb((f, 0.2, h + 2 * f), (c + s * (hw + f / 2 - 0.01), 0.02, zm), "wood_light")
    lb((2 * hw + 2 * f, 0.2, f), (c, 0.02, z1 + f / 2 - 0.01), "wood_light")
    lb((2 * hw + 0.26, 0.3, 0.07), (c, -0.04, z0 - 0.03), "stone_light")
    lb((2 * hw, 0.03, h), (c, 0.09, zm), "glass")
    lattice(p, F, c, hw, z0, z1, 0.068)
    if shutters:
        for s in (-1, 1):
            hinge = F @ M((c + s * (hw + f), -0.08, zm), (0, 0, -s * 10))
            p.add(bm_box(hw + 0.02, 0.04, h + 0.04), "sage_paint", hinge @ M((s * (hw + 0.02) / 2, 0, 0)))
            for zz in (-h * 0.32, h * 0.32):
                p.add(bm_box(hw - 0.04, 0.025, 0.06), "wood_dark", hinge @ M((s * (hw + 0.02) / 2, -0.03, zz)))
    if box:
        bw = 2 * hw + 0.2
        lb((bw, 0.24, 0.2), (c, -0.22, z0 - 0.2), "wood_mid")
        petals = ["petal_pink", "petal_white", "petal_yellow", "petal_purple", "petal_pink"]
        for i in range(4):
            u = -bw / 2 + 0.11 + i * (bw - 0.22) / 3
            p.add(jitter(bm_ico(0.12, 0), 0.025, rnd.randint(0, 999)), rnd.choice(["grass", "grass_dark"]),
                  F @ M((c + u, -0.22, z0 - 0.06), scale=(1.1, 0.9, 0.8)))
        for i in range(5):
            u = -bw / 2 + 0.08 + i * (bw - 0.16) / 4
            p.add(bm_ico(0.05, 0), petals[i], F @ M((c + u, -0.26 + rnd.uniform(-0.05, 0.05), z0 + rnd.uniform(0.0, 0.06))))


def round_window(p, F, a, z, r):
    p.add(bm_cyl(r + 0.08, r + 0.08, 0.1, 10), "wood_light", F @ M((a, 0.04, z), (90, 0, 0)))
    p.add(bm_cyl(r, r, 0.12, 10), "glass", F @ M((a, 0.05, z), (90, 0, 0)))
    for ang in (0, 90):
        p.add(bm_box(2 * r, 0.03, 0.035), "wood_light", F @ M((a, -0.075, z), (0, ang, 0)))


def stage_08(p, rnd, extra):
    """Leaded diamond-pane windows with sage shutters, flower boxes in front, round attic windows."""
    for wall, (F, half, ops) in WALLS.items():
        for op in ops:
            if op is DOOR:
                continue
            window(p, rnd, F, op, shutters=(wall != "right"), box=(wall == "front"))
    round_window(p, WALLS["left"][0], 0.95, 3.55, 0.25)
    round_window(p, WALLS["right"][0], 0.8, 3.65, 0.26)


def chimney_block(p, rnd, x_out, y0, y1, z0, z1, course):
    stone_wall(p, rnd, M((0, y0, 0)), x_out, CH_IN, z0, z1, [], depth=0.2, face=0.0, course=course, wr=(0.26, 0.48), core=False)
    stone_wall(p, rnd, M((0, y1, 0), (0, 0, 180)), -CH_IN, -x_out, z0, z1, [], depth=0.2, face=0.0, course=course,
               wr=(0.26, 0.48), core=False)
    stone_wall(p, rnd, M((x_out, 0, 0), (0, 0, -90)), -(y1 - 0.2), -(y0 + 0.2), z0, z1, [], depth=0.2, face=0.0,
               course=course, wr=(0.26, 0.48), core=False)
    p.box((CH_IN - x_out - 0.1, y1 - y0 - 0.1, z1 - z0), ((x_out + CH_IN) / 2, (y0 + y1) / 2, (z0 + z1) / 2), "stone_dark")


def stage_09(p, rnd, extra):
    """Stone chimney up the -X gable with a crooked cap and two pots (a `smoke` empty on the tall
    one), and a little woodpile against it."""
    xb, xs = CH_IN - 0.74, CH_IN - 0.6
    chimney_block(p, rnd, xb, CY - 0.6, CY + 0.6, 0.0, 2.0, 0.33)
    p.add(frustum(xb, CH_IN, CY - 0.6, CY + 0.6, xs, CH_IN, CY - 0.4, CY + 0.4, 2.0, 2.45), "stone_light")
    chimney_block(p, rnd, xs, CY - 0.4, CY + 0.4, 2.45, 6.45, 0.31)
    K = M(((xs + CH_IN) / 2, CY, 6.45), (0, -3, 2))
    p.add(bm_box(0.76, 0.96, 0.12), "stone_light", K @ M((0, 0, 0.06)))
    pots = (((0.0, -0.18), 0.44, 0.115, (4, 0, 0)), ((0.02, 0.2), 0.3, 0.1, (-6, 3, 0)))
    for (dx, dy), h, r, rot in pots:
        pm = K @ M((dx, dy, 0.12), rot)
        p.add(bm_cyl(r, r * 0.85, h, 8), "terracotta", pm)
        p.add(bm_cyl(r * 0.95, r * 1.05, 0.06, 8), "terracotta_dark", pm @ M((0, 0, h - 0.06)))
    top = K @ M((0.0, -0.18, 0.12), (4, 0, 0)) @ Vector((0, 0, 0.44 + 0.05))
    extra.append(("smoke", tuple(top)))
    # woodpile against the chimney's front face
    for i, (dy, dz) in enumerate(((0, 0), (0.17, 0), (0.34, 0), (0.085, 0.15), (0.255, 0.15), (0.17, 0.29))):
        p.add(bm_cyl(0.08, 0.08, 0.62, 7), rnd.choice(["wood", "wood_mid", "wood_light"]),
              M((xb + 0.32, CY - 0.75 - dy * 0.6 - 0.12, 0.08 + dz), (0, 90, rnd.uniform(-6, 6))) @ M((0, 0, -0.31)))


def g_post(p, x, y, z0, z1, s=0.1):
    p.box((s, s, z1 - z0), (x, y, (z0 + z1) / 2), "wood_light")


def stage_10(p, rnd, extra):
    """Greenhouse base and frame on the +X gable: stone sill walls, a flagstone floor, posts, rafters
    and the door frame."""
    walls = [(M((0, -GY, 0)), GX0, GX1, [(G_DOOR[0], G_DOOR[1], 0.0, 2.0)]),
             (M((0, GY, 0), (0, 0, 180)), -GX1, -GX0, []),
             (M((GX1, 0, 0), (0, 0, 90)), -GY + 0.26, GY - 0.26, [])]
    for F, a0, a1, hs in walls:
        stone_wall(p, rnd, F, a0, a1, 0.0, G_SILL, hs, depth=0.26, face=0.0, course=0.25, wr=(0.3, 0.55), core=False)
        for lo, hi in free_spans(a0, a1, G_SILL, G_SILL + 0.08, hs):
            wbox(p, F, lo, hi, G_SILL, G_SILL + 0.08, 0.04, 0.22, "wood_light")
    p.box((GX1 - GX0 - 0.3, 2 * GY - 0.5, 0.05), ((GX0 + GX1) / 2 - 0.1, 0, 0.025), "stone_mid")
    for i in range(7):
        p.box((rnd.uniform(0.4, 0.6), rnd.uniform(0.35, 0.5), 0.03),
              (rnd.uniform(GX0 + 0.5, GX1 - 0.6), rnd.uniform(-GY + 0.55, GY - 0.55), 0.055),
              rnd.choice(["stone_light", "stone"]), rot=(0, 0, rnd.uniform(-8, 8)))
    xp = GX1 - 0.13
    zb = G_SILL + 0.08
    for y in (-GY + 0.13, -0.8, 0.0, 0.8, GY - 0.13):
        g_post(p, xp, y, zb, GZ1)
    for y in (-GY + 0.13, GY - 0.13):
        g_post(p, GX0 + 0.08, y, zb, GZ0)
    for x in (4.75,):
        g_post(p, x, -GY + 0.13, zb, zt(x))
    for x in (3.45, 4.4):
        g_post(p, x, GY - 0.13, zb, zt(x))
    for x in (G_DOOR[0] - 0.05, G_DOOR[1] + 0.05):
        g_post(p, x, -GY + 0.13, 0.0, zt(x))
    p.box((G_DOOR[1] - G_DOOR[0], 0.1, 0.08), ((G_DOOR[0] + G_DOOR[1]) / 2, -GY + 0.13, 2.04), "wood_light")
    p.box((0.1, 2 * GY, 0.1), (xp, 0, GZ1 + 0.05), "wood_light")
    p.box((0.12, 2 * GY, 0.12), (GX0 + 0.06, 0, GZ0), "wood_mid")
    ang = math.degrees(math.atan2(GZ0 - GZ1, GX1 - GX0))
    L = math.hypot(GX1 - GX0 + 0.2, GZ0 - GZ1 + 0.2 * (GZ0 - GZ1) / (GX1 - GX0))
    for y in (-GY + 0.13, -0.8, 0.0, 0.8, GY - 0.13):
        p.add(bm_box(L, 0.09, 0.1), "wood_light", M(((GX0 + GX1 + 0.2) / 2, y, (GZ0 + zt(GX1 + 0.2)) / 2 + 0.06), (0, ang, 0)))
    p.box((1.0, 0.45, 0.06), (G_DOOR[0] + 0.4, -GY - 0.35, 0.03), "stone_light", rot=(0, 0, 4))


def stage_11(p, rnd, extra):
    """Glazing (one transparent object, `greenhouse_glass`), glazing bars, the glass door, and the
    plants inside: potting bench with seedlings, seed trays, a potted lemon tree."""
    g = Part("greenhouse_glass")
    ang = math.degrees(math.atan2(GZ0 - GZ1, GX1 - GX0))
    L = math.hypot(GX1 - GX0 + 0.12, (GZ0 - GZ1) * (1 + 0.12 / (GX1 - GX0)))
    ys = [-GY + 0.13, -0.8, 0.0, 0.8, GY - 0.13]
    for ya, yb in zip(ys, ys[1:]):
        g.add(bm_box(L, yb - ya - 0.1, 0.015), "greenhouse_glass",
              M(((GX0 + GX1 + 0.12) / 2, (ya + yb) / 2, (GZ0 + zt(GX1 + 0.12)) / 2 + 0.12), (0, ang, 0)))
        g.add(bm_box(0.015, yb - ya - 0.1, GZ1 - G_SILL - 0.14), "greenhouse_glass",
              M((GX1 - 0.13, (ya + yb) / 2, (G_SILL + 0.08 + GZ1) / 2)))
        p.box((0.06, yb - ya - 0.08, 0.05), (GX1 - 0.1, (ya + yb) / 2, 1.35), "wood_light")
    bays = [(-GY + 0.13, [(GX0 + 0.12, G_DOOR[0] - 0.1), (G_DOOR[1] + 0.1, 4.7), (4.8, GX1 - 0.18)]),
            (GY - 0.13, [(GX0 + 0.12, 3.4), (3.5, 4.35), (4.45, GX1 - 0.18)])]
    for y, spans in bays:
        for xa, xb in spans:
            pts = [(xa + 0.03, G_SILL + 0.1), (xb - 0.03, G_SILL + 0.1), (xb - 0.03, zt(xb) - 0.06), (xa + 0.03, zt(xa) - 0.06)]
            g.add(bm_prism(pts, 0.015), "greenhouse_glass", M((0, y, 0)))
            p.box((xb - xa, 0.06, 0.05), ((xa + xb) / 2, y, 1.35), "wood_light")
        xa, xb = G_DOOR[0], G_DOOR[1]
        if y < 0:
            g.add(bm_prism([(xa, 2.09), (xb, 2.09), (xb, zt(xb) - 0.06), (xa, zt(xa) - 0.06)], 0.015),
                  "greenhouse_glass", M((0, y, 0)))
    # the door: a wooden frame with glass above a solid lower panel
    y = -GY + 0.13
    xa, xb = G_DOOR[0] + 0.02, G_DOOR[1] - 0.02
    for x in (xa + 0.04, xb - 0.04):
        p.box((0.08, 0.06, 1.95), (x, y, 1.0), "wood_light")
    for z in (0.08, 0.95, 1.94):
        p.box((xb - xa, 0.06, 0.08), ((xa + xb) / 2, y, z), "wood_light")
    p.box((xb - xa - 0.1, 0.04, 0.82), ((xa + xb) / 2, y, 0.5), "sage_paint")
    g.add(bm_box(xb - xa - 0.12, 0.015, 0.94), "greenhouse_glass", M(((xa + xb) / 2, y, 1.44)))
    p.cyl(0.03, 0.04, (xb - 0.12, y - 0.04, 1.0), "iron", segs=6, rot=(90, 0, 0))
    extra.append((g, (0, 0, 0)))
    # potting bench along the back wall
    by, bx0, bx1 = GY - 0.45, GX0 + 0.3, GX1 - 0.35
    p.box((bx1 - bx0, 0.46, 0.05), ((bx0 + bx1) / 2, by, 0.8), "wood")
    p.box((bx1 - bx0, 0.42, 0.04), ((bx0 + bx1) / 2, by, 0.3), "wood_mid")
    for x in (bx0 + 0.05, bx1 - 0.05):
        for dy in (-0.18, 0.18):
            p.box((0.06, 0.06, 0.78), (x, by + dy, 0.39), "wood_mid")
    for i in range(6):
        x = bx0 + 0.2 + i * (bx1 - bx0 - 0.4) / 5
        pot(p, x, by + rnd.uniform(-0.06, 0.06), 0.825, rnd.uniform(0.85, 1.1), rnd.choice(["terracotta", "terracotta_dark"]))
        for k in range(2):
            blob(p, rnd, rnd.choice(["grass", "mint_leaf", "grass_light"]), x + rnd.uniform(-0.04, 0.04),
                 by + rnd.uniform(-0.04, 0.04), 1.0 + 0.05 * k, rnd.uniform(0.06, 0.09), 0.9)
    for x in (bx0 + 0.45, bx1 - 0.45):
        p.box((0.5, 0.32, 0.07), (x, by, 0.355), "wood_light")
        for k in range(4):
            blob(p, rnd, "grass", x - 0.18 + 0.12 * k, by, 0.38, 0.045, 1.1)
    # potted lemon tree in the front corner
    tx, ty = GX1 - 0.55, -GY + 0.6
    p.add(bm_lathe([(0.18, 0), (0.24, 0.4), (0.27, 0.42), (0.27, 0.46), (0.23, 0.46)], 10, cap_top=False), "terracotta", M((tx, ty, 0.05)))
    p.cyl(0.23, 0.02, (tx, ty, 0.43), "soil_dark", segs=10)
    p.add(bm_tube([(tx, ty, 0.45), (tx + 0.04, ty, 0.95), (tx - 0.02, ty + 0.03, 1.25)], [0.05, 0.04, 0.03], 6), "wood_mid")
    for dx, dy, dz, r in ((0, 0, 1.45, 0.3), (0.2, -0.1, 1.3, 0.22), (-0.18, 0.1, 1.32, 0.22)):
        p.add(jitter(bm_ico(r, 1), r * 0.15, rnd.randint(0, 999)), "leaf_deep", M((tx + dx, ty + dy, dz), scale=(1, 1, 0.85)))
    for i in range(6):
        a = TAU * i / 6 + 0.3
        p.ball(0.045, (tx + 0.27 * math.cos(a), ty + 0.27 * math.sin(a), 1.25 + 0.15 * (i % 3)), "petal_yellow", subdiv=0, smooth=False)
    # watering can on the floor
    p.add(bm_cyl(0.11, 0.11, 0.22, 8), "iron", M((GX0 + 0.5, -GY + 0.5, 0.05)))
    p.add(bm_tube([(GX0 + 0.58, -GY + 0.5, 0.12), (GX0 + 0.8, -GY + 0.5, 0.32)], [0.025, 0.018], 5), "iron")


def bed(p, rnd, x0, x1, y0, y1, h=BED_H):
    t = 0.07
    for k in range(2):
        za, zb = h * k / 2 + 0.005, h * (k + 1) / 2 - 0.005
        col = ["wood", "wood_light"][k] if rnd.random() < 0.7 else "wood_mid"
        for y in (y0 + t / 2, y1 - t / 2):
            p.box((x1 - x0, t, zb - za), ((x0 + x1) / 2, y, (za + zb) / 2), col)
        for x in (x0 + t / 2, x1 - t / 2):
            p.box((t, y1 - y0 - 2 * t, zb - za), (x, (y0 + y1) / 2, (za + zb) / 2), col)
    for x in (x0 + 0.05, x1 - 0.05):
        for y in (y0 + 0.05, y1 - 0.05):
            p.box((0.1, 0.1, h + 0.06), (x, y, (h + 0.06) / 2), "wood_dark")
    p.box((x1 - x0 - 2 * t, y1 - y0 - 2 * t, 0.04), ((x0 + x1) / 2, (y0 + y1) / 2, h - 0.06), "soil_dark")
    for i in range(4):
        p.add(jitter(bm_ico(0.05, 0), 0.015, rnd.randint(0, 999)), "soil",
              M((rnd.uniform(x0 + 0.15, x1 - 0.15), rnd.uniform(y0 + 0.12, y1 - 0.12), h - 0.04), scale=(1.3, 1, 0.5)))


def mound_z(r):
    return 0.2 + (1.0 - min(max(r, 0.15), 1.0)) / 0.85 * 0.58


def stage_12(p, rnd, extra):
    """The herb garden: a dug plot with three raised beds and a stone herb spiral, a wattle fence,
    stepping stones to both doors, and a watering can."""
    pts = []
    for i in range(36):
        a = TAU * i / 36
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** 6 + abs(s) ** 6) ** (1 / 6))
        pts.append((-4.7 + c * r * 1.6 * (1 + rnd.uniform(-0.015, 0.015)), -0.2 + s * r * 4.05 * (1 + rnd.uniform(-0.01, 0.01))))
    p.add(bm_slab(pts, 0.035), "dirt")
    for b in BEDS:
        bed(p, rnd, *b)
    # herb spiral: stones along a rising spiral around a soil mound
    sx, sy = SPIRAL
    p.add(bm_lathe([(1.0, 0.0), (1.0, 0.2), (0.6, mound_z(0.6)), (0.3, mound_z(0.3)), (0.12, mound_z(0.12) + 0.02)], 12), "soil_dark",
          M((sx, sy, 0)))
    t, s_acc, last = 0.0, 0.0, None
    while t <= 1.0:
        th = 0.4 + t * 2.4 * math.pi
        r = 1.03 - 0.8 * t
        q = (sx + r * math.cos(th), sy + r * math.sin(th))
        if last is None or math.hypot(q[0] - last[0], q[1] - last[1]) > 0.26:
            last = q
            top = 0.2 + 0.6 * t
            nz = max(1, round(top / 0.17))
            for k in range(nz):
                z0 = top * k / nz
                p.add(jitter(bm_box(0.23, 0.17, top / nz - 0.01), 0.02, rnd.randint(0, 9999)), rnd.choice(STONES),
                      M((q[0], q[1], z0 + top / nz / 2), (0, 0, math.degrees(th) + 90 + rnd.uniform(-8, 8))))
        t += 0.004
    # wattle fence along the garden's outer edge
    fx, fy0, fy1 = -6.4, -4.05, 3.8
    n = 20
    for i in range(n + 1):
        y = fy0 + (fy1 - fy0) * i / n
        p.add(jitter(bm_box(0.06, 0.06, 0.8), 0.01, i), "wood_mid", M((fx + rnd.uniform(-0.01, 0.01), y, 0.4), (rnd.uniform(-3, 3), rnd.uniform(-3, 3), 0)))
    for j, z in enumerate((0.25, 0.43, 0.61)):
        pts3 = [(fx + 0.045 * (1 if (i + j) % 2 else -1), fy0 + (fy1 - fy0) * i / n, z + rnd.uniform(-0.015, 0.015)) for i in range(n + 1)]
        p.add(bm_tube(pts3, 0.03, 4), rnd.choice(["wood_light", "straw_dark"]))
    # stepping stones: front path, to the garden, and round to the greenhouse door
    for k in range(4):
        slab_stone(p, rnd, DOOR[0] + rnd.uniform(-0.06, 0.06), -D - 1.15 - 0.55 * k, 0.24)
    for k in range(4):
        slab_stone(p, rnd, -1.0 - 0.6 * k, -3.45 + rnd.uniform(-0.06, 0.06), 0.22)
    for k in range(5):
        u = k / 4
        slab_stone(p, rnd, 0.35 + 3.0 * u, -3.35 + 1.0 * u * u, 0.22)
    # watering can by the path
    wx, wy = -3.45, 0.2
    p.add(bm_lathe([(0.12, 0), (0.13, 0.2), (0.11, 0.24), (0.0, 0.25)], 9), "iron", M((wx, wy, 0)))
    p.add(bm_tube([(wx + 0.1, wy, 0.06), (wx + 0.3, wy, 0.26), (wx + 0.33, wy, 0.3)], [0.025, 0.018, 0.035], 5), "iron")
    p.add(bm_tube([(wx - 0.11, wy, 0.18), (wx - 0.06, wy, 0.33), (wx + 0.06, wy, 0.33)], 0.014, 4, cap=False), "iron")


# ---- herbs: each clump built in world space around its base (x, y, z)

def h_lavender(p, rnd, x, y, z):
    for i in range(3):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.02, 0.07)
        blob(p, rnd, "sage_leaf", x + d * math.cos(a), y + d * math.sin(a), z, rnd.uniform(0.11, 0.14), 0.7)
    for i in range(7):
        a, d = TAU * i / 7 + rnd.uniform(-0.2, 0.2), rnd.uniform(0.03, 0.11)
        h = rnd.uniform(0.3, 0.42)
        base = M((x + d * math.cos(a), y + d * math.sin(a), z + 0.08), (0, d * 130, math.degrees(a)))
        p.add(bm_box(0.014, 0.014, h), "sage_leaf", base @ M((0, 0, h / 2)))
        p.add(bm_cyl(0.03, 0.012, 0.13, 4), "lavender", base @ M((0, 0, h - 0.02)))


def h_sage(p, rnd, x, y, z):
    for i in range(5):
        a, d = TAU * i / 5 + rnd.uniform(-0.3, 0.3), rnd.uniform(0.04, 0.13)
        blob(p, rnd, rnd.choice(["sage_leaf", "sage_leaf", "grass_light"]), x + d * math.cos(a), y + d * math.sin(a),
             z, rnd.uniform(0.08, 0.11), 0.75)
    blob(p, rnd, "sage_leaf", x, y, z + 0.08, 0.1, 0.8)
    for i in range(2):
        a = rnd.uniform(0, TAU)
        base = M((x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), z + 0.15), (0, 15, math.degrees(a)))
        p.add(bm_box(0.012, 0.012, 0.24), "sage_leaf", base @ M((0, 0, 0.12)))
        p.add(bm_cyl(0.028, 0.01, 0.1, 4), "petal_purple", base @ M((0, 0, 0.2)))


def h_rosemary(p, rnd, x, y, z):
    blob(p, rnd, "rosemary_leaf", x, y, z, 0.12, 0.6)
    for i in range(8):
        a, d = TAU * i / 8 + rnd.uniform(-0.3, 0.3), rnd.uniform(0.02, 0.08)
        h = rnd.uniform(0.36, 0.5)
        p.add(bm_cyl(0.045, 0.008, h, 5), rnd.choice(["rosemary_leaf", "rosemary_leaf", "grass_dark"]),
              M((x + d * math.cos(a), y + d * math.sin(a), z + 0.03), (0, d * 160 + 4, math.degrees(a))))


def h_chamomile(p, rnd, x, y, z):
    for i in range(2):
        blob(p, rnd, "grass_light", x + rnd.uniform(-0.05, 0.05), y + rnd.uniform(-0.05, 0.05), z, 0.1, 0.6)
    for i in range(5):
        a, d = TAU * i / 5 + rnd.uniform(-0.3, 0.3), rnd.uniform(0.03, 0.13)
        h = rnd.uniform(0.17, 0.27)
        base = M((x + d * math.cos(a), y + d * math.sin(a), z + 0.04), (0, d * 90, math.degrees(a)))
        p.add(bm_box(0.01, 0.01, h), "grass", base @ M((0, 0, h / 2)))
        p.add(bm_cyl(0.04, 0.04, 0.012, 6), "petal_white", base @ M((0, 0, h)))
        p.add(bm_box(0.03, 0.03, 0.02), "petal_yellow", base @ M((0, 0, h + 0.015)))


def h_marigold(p, rnd, x, y, z):
    for i in range(3):
        a = TAU * i / 3 + rnd.uniform(-0.3, 0.3)
        blob(p, rnd, "grass", x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), z, rnd.uniform(0.09, 0.12), 0.7)
    for i in range(5):
        a, d = TAU * i / 5 + rnd.uniform(-0.3, 0.3), rnd.uniform(0.04, 0.12)
        base = M((x + d * math.cos(a), y + d * math.sin(a), z + rnd.uniform(0.17, 0.24)), (0, d * 120, math.degrees(a)))
        p.add(bm_cyl(0.055, 0.05, 0.02, 7), "marigold", base)
        p.add(bm_box(0.03, 0.03, 0.03), "mustard", base @ M((0, 0, 0.02)))


def h_mint(p, rnd, x, y, z):
    for i in range(5):
        a, d = TAU * i / 5 + rnd.uniform(-0.3, 0.3), rnd.uniform(0.05, 0.14)
        blob(p, rnd, "mint_leaf", x + d * math.cos(a), y + d * math.sin(a), z, rnd.uniform(0.08, 0.11), 0.8)
    for i in range(3):
        a = rnd.uniform(0, TAU)
        blob(p, rnd, "grass_light", x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), z + 0.1, 0.06, 0.9)


def h_foxglove(p, rnd, x, y, z):
    for i in range(3):
        a = TAU * i / 3
        blob(p, rnd, "grass_dark", x + 0.07 * math.cos(a), y + 0.07 * math.sin(a), z, 0.1, 0.5)
    for i in range(2):
        a = rnd.uniform(0, TAU)
        h = rnd.uniform(0.6, 0.75)
        base = M((x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), z + 0.05), (0, 6, math.degrees(a)))
        p.add(bm_box(0.02, 0.02, h), "grass_dark", base @ M((0, 0, h / 2)))
        for k in range(5):
            zz = h * (0.48 + 0.1 * k)
            b2 = base @ M((0, 0, zz), (0, 0, k * 70))
            p.add(bm_cyl(0.022, 0.04 - 0.003 * k, 0.065, 5), "petal_pink", b2 @ M((0.035, 0, 0), (180 - 30, 0, 0)))


HERBS = {"lavender": h_lavender, "sage": h_sage, "rosemary": h_rosemary, "chamomile": h_chamomile,
         "marigold": h_marigold, "mint": h_mint, "foxglove": h_foxglove}
BED_PLANTING = [["lavender", "lavender", "rosemary", "sage"],
                ["chamomile", "marigold", "mint", "marigold"],
                ["foxglove", "sage", "mint", "foxglove"]]
SPIRAL_PLANTING = [(0.85, 205, "mint"), (0.72, 330, "chamomile"), (0.55, 85, "sage"), (0.36, 195, "lavender"), (0.06, 0, "rosemary")]


def stage_13(p, rnd, extra):
    """Herbs growing in the beds and the spiral: each clump is its own mesh `herb_NN`, origin at its
    base on the soil (the game sways them)."""
    idx = 0
    spots = []
    for b, row in zip(BEDS, BED_PLANTING):
        yc = (b[2] + b[3]) / 2
        for x, kind in zip(HERB_X, row):
            spots.append((kind, x + rnd.uniform(-0.04, 0.04), yc + rnd.uniform(-0.08, 0.08), BED_H - 0.04))
    for r, a, kind in SPIRAL_PLANTING:
        th = math.radians(a)
        spots.append((kind, SPIRAL[0] + r * math.cos(th), SPIRAL[1] + r * math.sin(th), mound_z(r) - 0.02))
    for kind, x, y, z in spots:
        idx += 1
        h = Part("herb_%02d" % idx)
        HERBS[kind](h, random.Random(500 + idx), x, y, z)
        extra.append((h, (x, y, z)))
    # a sprig of mint escaping between the beds, as mint does
    for x, y in ((-3.9, -2.3), (-4.0, -0.6)):
        blob(p, rnd, "mint_leaf", x, y, 0.03, 0.08, 0.7)


def bundle(p, rnd, x, y, ztop, matname, s=1.0):
    p.box((0.008, 0.008, 0.08), (x, y, ztop - 0.04), "straw_dark")
    p.add(bm_cyl(0.025 * s, 0.09 * s, 0.3 * s, 6), matname, M((x, y, ztop - 0.08), (180, rnd.uniform(-6, 6), rnd.uniform(0, 60))))
    p.cyl(0.03 * s, 0.03, (x, y, ztop - 0.12 * s), "cloth", segs=6)
    for k in range(2):
        a = rnd.uniform(0, TAU)
        p.add(jitter(bm_ico(0.045 * s, 0), 0.01, rnd.randint(0, 999)), matname,
              M((x + 0.05 * math.cos(a) * s, y + 0.05 * math.sin(a) * s, ztop - 0.3 * s), scale=(1, 1, 1.4)))


def bottle(p, x, y, z, kind=0, s=1.0, rot=0.0):
    profs = [[(0.0, 0.0), (0.05, 0.0), (0.07, 0.05), (0.065, 0.1), (0.03, 0.13), (0.017, 0.15), (0.017, 0.19)],
             [(0.0, 0.0), (0.04, 0.0), (0.045, 0.02), (0.045, 0.15), (0.02, 0.18), (0.015, 0.22)],
             [(0.0, 0.0), (0.06, 0.0), (0.06, 0.07), (0.022, 0.1), (0.016, 0.14)]]
    prof = profs[kind]
    p.add(bm_lathe([(r * s, h * s) for r, h in prof], (8, 6, 4)[kind]), "glow", M((x, y, z), (0, 0, rot)))
    p.cyl(0.02 * s, 0.035 * s, (x, y, z + prof[-1][1] * s - 0.005), "wood_light", segs=5)


def stage_14(p, rnd, extra):
    """Lived in: drying herbs on poles under the front eave, softly glowing potion bottles (`glow`)
    on a display table and the sills, Mirela's big tonic flask, a lantern by the door, a bench, a
    cauldron under the gable window, and a hanging sign at the garden gate."""
    # drying poles hung from the rafter tails
    yp = -D - 0.3
    for x0, x1, n, z in ((0.62, 2.38, 6, 2.32), (-2.36, -1.12, 3, 2.32)):
        p.add(bm_tube([(x0, yp, z), (x1, yp, z)], 0.024, 6), "wood_light")
        for xr in (-2.0, -1.0, 1.0, 2.0):
            if x0 < xr < x1:
                p.box((0.012, 0.012, z_under(D + 0.3) - z + 0.05), (xr, yp, (z + z_under(D + 0.3)) / 2), "straw_dark")
        for k in range(n):
            x = x0 + 0.12 + (x1 - x0 - 0.24) * k / max(n - 1, 1)
            bundle(p, rnd, x, yp, z - 0.02, rnd.choice(["dried_herb", "dried_gold", "dried_lavender", "dried_herb"]),
                   rnd.uniform(0.85, 1.1))
    bundle(p, rnd, DOOR[0], -D - 0.1, DOOR[3] + 0.32, "dried_lavender", 0.8)
    # lantern on an iron arm beside the door
    lx = DOOR[0] + DOOR[1] + 0.07
    p.add(bm_box(0.12, 0.05, 0.22), "wood_dark", M((lx, -D - 0.06, 2.12)))
    p.add(bm_tube([(lx, -D - 0.08, 2.15), (lx, -D - 0.38, 2.15), (lx, -D - 0.44, 2.1)], 0.022, 6), "iron")
    add_lantern(p, (lx, -D - 0.44, 1.55), 1.05, hang=True)
    # potion display table in front of the shop window
    tx, ty = WALLS["front"][2][2][0], -D - 0.52
    p.box((1.05, 0.42, 0.05), (tx, ty, 0.78), "wood")
    for dx in (-0.45, 0.45):
        for dy in (-0.15, 0.15):
            p.box((0.06, 0.06, 0.76), (tx + dx, ty + dy, 0.38), "wood_mid")
    p.box((1.12, 0.26, 0.012), (tx, ty, 0.81), "cloth")
    p.box((0.9, 0.04, 0.05), (tx, ty, 0.2), "wood_mid")
    for i, (dx, dy, kind, s) in enumerate(((-0.42, 0.05, 0, 0.9), (-0.3, -0.07, 1, 1.0), (-0.17, 0.08, 2, 0.9),
                                           (0.17, 0.07, 1, 0.85), (0.29, -0.06, 0, 1.0), (0.42, 0.06, 2, 0.8))):
        bottle(p, tx + dx, ty + dy, 0.805, kind, s, rot=30 * i)
    # Mirela's tonic: the big flask in the middle, with a paper tag
    bottle(p, tx, ty, 0.805, 0, 2.0)
    p.box((0.07, 0.005, 0.09), (tx + 0.11, ty - 0.13, 0.98), "white", rot=(0, 0, 10))
    p.add(bm_tube([(tx + 0.03, ty - 0.03, 1.13), (tx + 0.1, ty - 0.12, 1.02)], 0.004, 3), "straw_dark")
    for i, (c, hw, z0, z1) in enumerate(WALLS["front"][2][1:2]):
        for k, dx in enumerate((-0.18, 0.0, 0.17)):
            bottle(p, c + dx, -D - 0.1, z0 + 0.005, k % 3, 0.7, rot=40 * k)
    # bench under the left window with a herb basket and a mortar and pestle
    bx, by = WALLS["front"][2][1][0], -D - 0.32
    p.box((1.15, 0.32, 0.06), (bx, by, 0.45), "wood")
    for dx in (-0.45, 0.45):
        p.box((0.08, 0.26, 0.42), (bx + dx, by, 0.21), "wood_mid")
    p.add(bm_lathe([(0.12, 0), (0.17, 0.12), (0.18, 0.13)], 8, cap_top=False), "straw", M((bx - 0.25, by, 0.48)))
    p.cyl(0.16, 0.01, (bx - 0.25, by, 0.58), "straw_dark", segs=8)
    for k in range(3):
        blob(p, rnd, rnd.choice(["sage_leaf", "mint_leaf", "lavender"]), bx - 0.25 + rnd.uniform(-0.06, 0.06),
             by + rnd.uniform(-0.06, 0.06), 0.56, 0.07, 0.8)
    p.add(bm_tube([(bx - 0.4, by, 0.6), (bx - 0.25, by, 0.78), (bx - 0.1, by, 0.6)], 0.012, 4, cap=False), "straw_dark")
    p.add(bm_lathe([(0.05, 0), (0.08, 0.04), (0.09, 0.1), (0.07, 0.1), (0.05, 0.05)], 8, cap_top=False), "stone_light", M((bx + 0.2, by, 0.48)))
    p.add(bm_cyl(0.016, 0.022, 0.18, 5), "wood_light", M((bx + 0.22, by, 0.53), (0, 25, 0)))
    # cauldron on stubby legs under the gable window
    cx, cy = -W - 0.45, -1.3
    p.add(bm_lathe([(0.0, 0.12), (0.18, 0.14), (0.27, 0.3), (0.26, 0.48), (0.23, 0.52), (0.25, 0.54)], 10, cap_top=False), "iron",
          M((cx, cy, 0)))
    p.cyl(0.235, 0.02, (cx, cy, 0.48), "potion", segs=10)
    for k in range(3):
        a = TAU * k / 3
        p.add(bm_cyl(0.035, 0.025, 0.2, 5), "iron", M((cx + 0.17 * math.cos(a), cy + 0.17 * math.sin(a), 0.0)))
    p.add(bm_tube([(cx + 0.05, cy, 0.42), (cx + 0.18, cy + 0.05, 0.75)], 0.015, 4), "wood_light")
    for k in range(3):
        a = TAU * k / 3 + 0.5
        p.add(bm_cyl(0.05, 0.05, 0.38, 6), "wood_dark", M((cx + 0.3 * math.cos(a), cy + 0.3 * math.sin(a), 0.05), (90, 0, math.degrees(a) + 90)) @ M((0, 0, -0.19)))
    # hanging sign at the garden gate: a mortar and pestle and a leaf
    sx, sy = -3.15, -4.15
    p.box((0.12, 0.12, 2.1), (sx, sy, 1.05), "wood_mid")
    p.cyl(0.09, 0.1, (sx, sy, 2.1), "wood_mid", r2=0.0, segs=4, rot=(0, 0, 45))
    p.box((0.85, 0.08, 0.08), (sx + 0.4, sy, 1.95), "wood_mid")
    p.add(bm_tube([(sx + 0.06, sy, 1.62), (sx + 0.42, sy, 1.94)], 0.02, 4), "wood_mid")
    for dx in (0.3, 0.7):
        p.box((0.015, 0.015, 0.16), (sx + dx, sy, 1.83), "iron")
    sm = M((sx + 0.5, sy, 1.53))
    p.add(bm_prism(rounded(0.66, 0.48, 0.08), 0.05), "wood_dark", sm)
    p.add(bm_prism(rounded(0.58, 0.4, 0.06), 0.07), "wood_light", sm)
    bowl = [(-0.13, 0.02), (0.13, 0.02), (0.1, -0.08), (0.05, -0.12), (-0.05, -0.12), (-0.1, -0.08)]
    p.add(bm_prism(bowl, 0.02), "stone_mid", sm @ M((-0.05, -0.04, 0)))
    p.add(bm_box(0.035, 0.02, 0.22), "wood_dark", sm @ M((0.0, -0.045, 0.06), (0, 30, 0)))
    leaf = [(0.0, -0.1), (0.06, -0.02), (0.05, 0.06), (0.0, 0.12), (-0.05, 0.06), (-0.06, -0.02)]
    p.add(bm_prism(leaf, 0.02), "grass_dark", sm @ M((0.17, -0.04, 0.0), (0, -25, 0)))


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06, stage_07,
          stage_08, stage_09, stage_10, stage_11, stage_12, stage_13, stage_14]


def build():
    model = common.reset()
    stages, marks = [], {}
    for i, fn in enumerate(STAGES, 1):
        name = "stage_%02d" % i
        node = common.empty(name, model)
        part = Part(name + "_mesh")
        extra = []
        fn(part, random.Random(3000 + i), extra)
        objs = []
        for v in part.bm.verts:
            v.co = crook(v.co)
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for xp, origin in extra:
            loc = crook(origin)
            if isinstance(xp, str):
                marks[xp] = common.empty(xp, model, parent=node, loc=loc)
                continue
            for v in xp.bm.verts:
                v.co = crook(v.co)
            objs.append(xp.to_object(model, parent=node, origin=tuple(loc)))
        stages.append((node, objs))
    common.bpy.context.view_layer.update()
    return stages, marks


def flat_col(ob):
    me = ob.data
    for ca in list(me.color_attributes):
        me.color_attributes.remove(ca)
    ca = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    me.color_attributes.active_color = ca
    for d in ca.data:
        d.color = (1.0, 1.0, 1.0, 1.0)


def glass_material():
    m = common.bpy.data.materials.get("greenhouse_glass")
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Alpha"].default_value = 0.3
    b.inputs["Roughness"].default_value = 0.12
    for attr, val in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
        try:
            setattr(m, attr, val)
        except Exception:
            pass


def main():
    stages, marks = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    glass = bpy.data.objects["greenhouse_glass"]
    herbs = [o for o in meshes if o.name.startswith("herb")]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)   # the meadow occludes the bake too
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k or o is glass
        common.bake_ao([o for o in stages[k - 1][1] if o is not glass])
    flat_col(glass)
    for o in herbs:
        z0 = o.matrix_world.translation.z
        common.height_tint(o, z0, z0 + 0.5, 0.6, 1.0)
    for o in meshes:
        o.hide_render = False
    glass_material()
    common.export("apothecary.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-28, elev=24, lens=50, margin=0.84, min_radius=6.5)
            common.render(os.path.join(common.OUT_PREV, "apothecary_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-26, elev=16, lens=45, margin=0.9)
    common.render(os.path.join(common.OUT_PREV, "apothecary.png"))
    common.save_blend("apothecary")
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [round(min(p[i] for p in pts), 2) for i in range(3)]
    hi = [round(max(p[i] for p in pts), 2) for i in range(3)]
    res = {"tris": counts, "total": sum(counts.values()), "bbox": [lo, hi],
           "herbs": len(herbs), "glass_tris": common.tris([glass]),
           "smoke": [round(v, 3) for v in marks["smoke"].matrix_world.translation],
           "glow_objs": sorted(o.name for o in meshes if "glow" in [m.name for m in o.data.materials]),
           "nodes": sorted(o.name for o in common.coll("MODEL").all_objects if not o.name.startswith("herb_"))}
    print("APOTHECARY_RESULT " + json.dumps(res))
    return res


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
