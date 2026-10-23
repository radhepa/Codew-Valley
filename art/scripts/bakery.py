"""The Hearth Bakery: Hazel's timber-framed cottage with a big domed brick oven on its +X
gable, in 14 cumulative stages (stage_01 .. stage_14). See art/specs/bakery.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Headless:        powershell -File art/blender.ps1 art/scripts/bakery.py
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

Layout: the cottage (6 x 5 m) is centred on the origin, front wall at y = -2.5. The oven
dome sits against the +X gable (centre OV), its mouth facing the front (-Y).
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, bm_uv, jitter, add_lantern
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", os.environ.get("BAKERY_STAGES", "1") == "1")
TAU = 2 * math.pi

# bakery-only colours (registered in the shared palette at runtime; common.py is untouched)
common.PALETTE.update({
    "brick": "#A2604A", "brick_dark": "#7C4939", "brick_light": "#B97D60",
    "crust": "#B57638", "crust_dark": "#8B5628", "crust_light": "#D2A45F", "terracotta": "#A96447",
})

# ------------------------------------------------------------------ dimensions
HX, HY = 3.0, 2.5          # half width / depth of the cottage (outer wall line)
FLOOR = 0.36               # floor top
SILL = (0.36, 0.54)        # sill beam
PLATE = (2.76, 2.96)       # top plate
EAVE_Y, EAVE_Z = 3.0, 2.6  # roof eave line (top surface)
RIDGE_Z = 5.3
SLOPE = (RIDGE_Z - EAVE_Z) / EAVE_Y          # 0.9
ANG = math.degrees(math.atan(SLOPE))         # ~42 deg
ROOF_T = 0.1
VERGE = 3.45
OV = (4.1, -1.2)           # oven centre
OV_PLINTH = 0.85
OV_Z0 = 0.95               # dome springs from here
OV_R, OV_H = 1.3, 1.5
PL_R = OV_R + 0.15        # plinth radius
MOUTH_W, MOUTH_SPRING = 0.28, 1.2      # half width, arch spring height
PORCH = (OV[0] - 0.5, OV[0] + 0.5, OV[1] - 1.55, OV[1] - 0.7, 1.92)  # x0, x1, y0, y1, top
CHIM = (3.32, OV[1] + 0.95, 0.3, 6.05)  # centre x, y, half size, top of stonework
DOOR_X, DOOR_HW, DOOR_TOP = -1.4, 0.46, 2.45
SHOP = (0.25, 2.35, 0.95, 2.15)        # shop window hole x0, x1, z0, z1

# wall frames: local x = along the wall (u), local -y = outward, z up; outer face at local y = 0
FRAMES = {
    "front": (M((0, -HY, 0)), HX),
    "back": (M((0, HY, 0), (0, 0, 180)), HX),
    "left": (M((-HX, 0, 0), (0, 0, -90)), HY),
    "right": (M((HX, 0, 0), (0, 0, 90)), HY),
}
HOLES = {
    "front": [(DOOR_X - DOOR_HW, DOOR_X + DOOR_HW, FLOOR, DOOR_TOP), (SHOP[0], SHOP[1], SHOP[2], SHOP[3])],
    "back": [(-0.5, 0.5, 1.05, 2.05)],
    "left": [(-0.5, 0.5, 1.05, 2.05)],
    "right": [],
}
POSTS = {
    "front": [DOOR_X - DOOR_HW - 0.12, DOOR_X + DOOR_HW + 0.12, SHOP[0] - 0.12, SHOP[1] + 0.12],
    "back": [-2.0, -0.62, 0.62, 2.0],
    "left": [-0.62, 0.62],
    "right": [1.2],
}


def wb(p, side, size, loc, matname, rot=(0, 0, 0), bevel=0.0):
    p.add(bm_box(*size, bevel=bevel), matname, FRAMES[side][0] @ M(loc, rot))


def strut(p, side, a, b, matname="wood_dark", w=0.16, d=0.22, y=0.08):
    """Timber in a wall plane from local (u, z) a to b."""
    (u0, z0), (u1, z1) = a, b
    L = math.hypot(u1 - u0, z1 - z0)
    wb(p, side, (L, d, w), ((u0 + u1) / 2, y, (z0 + z1) / 2), matname,
       rot=(0, -math.degrees(math.atan2(z1 - z0, u1 - u0)), 0))


def roof_top(y):
    return RIDGE_Z - SLOPE * abs(y)


def slope_m(side, y, z, x=0.0, tilt=0.0):
    """Frame on a roof side (side -1 front, +1 back): local y runs along the slope."""
    a = ANG - tilt
    return M((x, y, z), (-side * a, 0, 0))


def rrect(wd, ht, rr, n=3):
    pts = []
    for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cxs * (wd / 2 - rr) + rr * math.cos(a), czs * (ht / 2 - rr) + rr * math.sin(a)))
    return pts


def arch_pts(r, zc, n, a0=0.0, a1=math.pi, x0=0.0):
    return [(x0 + r * math.cos(a0 + (a1 - a0) * k / n), zc + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def mouth_shape(hw, spring, x0, n=8):
    return [(x0 - hw, OV_Z0), (x0 + hw, OV_Z0)] + arch_pts(hw, spring, n, x0=x0)


def ring_patches(p, rnd, c, r, z0, z1, n, cols, bulge=0.035, gap=1.0, skip=None):
    off = rnd.uniform(0, 360 / n)
    for i in range(n):
        a0 = off + 360 * i / n + gap / 2
        a1 = off + 360 * (i + 1) / n - gap / 2
        am = math.radians((a0 + a1) / 2)
        if skip and skip(c[0] + r * math.cos(am), c[1] + r * math.sin(am)):
            continue
        dz = rnd.uniform(-0.01, 0.01)
        prof = [(r, z0 + 0.012 + dz), (r + bulge, (z0 + z1) / 2), (r, z1 - 0.012)]
        p.add(bm_lathe(prof, 2, arc=(a0, a1)), rnd.choice(cols), M((c[0], c[1], 0)))


# ------------------------------------------------------------------ small props

def sack(p, x, y, rz=0.0, s=1.0, lying=False, mat="sack"):
    prof = [(0.0, 0.0), (0.22, 0.02), (0.27, 0.14), (0.26, 0.36), (0.18, 0.5), (0.07, 0.56), (0.09, 0.62), (0.05, 0.66)]
    bm = bm_lathe([(r * s, z * s) for r, z in prof], 8)
    if lying:
        p.add(bm, mat, M((x, y, 0.21 * s), (0, 90, rz)) @ M((0, 0, -0.33 * s), scale=(1, 0.85, 1)))
        return
    jitter(bm, 0.015 * s, int(abs(x) * 100 + abs(y) * 10))
    p.add(bm, mat, M((x, y, 0), (0, 0, rz)), smooth=True)
    p.cyl(0.075 * s, 0.035 * s, (x, y, 0.55 * s), "wood_dark", segs=8)


def boule(p, m, r=0.13, mat="crust", marks=True):
    p.add(bm_uv(r, 8, 5), mat, m @ M((0, 0, 0), scale=(1, 1, 0.62)), smooth=True)
    if marks:
        for dx in (-0.35, 0.0, 0.35):
            p.add(bm_box(0.018, r * 1.1, 0.012), "crust_light", m @ M((dx * r, 0, r * 0.6), (0, 0, 20)))


def long_loaf(p, m, ln=0.42, r=0.075, mat="crust"):
    p.add(bm_uv(r, 8, 5), mat, m @ M((0, 0, 0), scale=(ln / (2 * r), 1, 0.72)), smooth=True)
    for k in range(3):
        p.add(bm_box(0.06, 0.016, 0.012), "crust_light", m @ M(((k - 1) * ln * 0.25, 0, r * 0.68), (0, 0, 30)))


def braid(p, m, ln=0.5):
    """Hazel's festival braided loaf: three twisting strands."""
    for k in range(3):
        ph = TAU * k / 3
        pts, rad = [], []
        for i in range(11):
            t = -0.5 + i / 10
            w = 4 * math.pi * t + ph
            pts.append((t * ln, 0.045 * math.sin(w), 0.055 + 0.03 * math.cos(w)))
            rad.append(0.048 * (1 - 0.55 * (2 * t) ** 2))
        p.add(bm_tube([m @ Vector(q) for q in pts], rad, 6), "crust" if k != 1 else "crust_light", smooth=True)


def basket(p, x, y, z=0.0, r=0.22, h=0.18, rz=0.0):
    p.add(bm_lathe([(r * 0.8, 0), (r, h * 0.7), (r * 1.04, h)], 10, cap_top=False), "straw_dark", M((x, y, z), (0, 0, rz)))
    p.add(bm_lathe([(r * 1.04, h), (r * 1.1, h + 0.025), (r * 0.98, h + 0.03)], 10, cap_bottom=False, cap_top=False),
          "straw", M((x, y, z)))
    p.cyl(r * 0.95, 0.01, (x, y, z + h * 0.6), "wood_dark", segs=10)


def logs_pile(p, rnd, x0, y, nx=4, rows=3, ln=0.62):
    for row in range(rows):
        n = nx - row
        for i in range(n):
            x = x0 + (i + row * 0.5) * 0.21
            z = 0.1 + row * 0.18
            r = rnd.uniform(0.085, 0.1)
            m = M((x, y - ln / 2 + rnd.uniform(-0.04, 0.04), z), (-90, 0, rnd.uniform(0, 45)))
            p.add(bm_cyl(r, r, ln, 7), "wood", m)
            p.add(bm_cyl(r * 0.8, r * 0.8, 0.012, 7), "wood_light", m @ M((0, 0, -0.006)))


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, stakes and string around the cottage, a scratched oven circle, the plan."""
    pts = []
    for cx, cy, w, h in ((1.1, -0.25, 10.0, 7.4),):
        for x, y in rrect(w, h, 1.6, 5):
            pts.append((cx + x * (1 + rnd.uniform(-0.02, 0.02)), cy + y * (1 + rnd.uniform(-0.02, 0.02))))
    p.add(bm_slab(pts, 0.03), "dirt")
    p.cyl(PL_R + 0.1, 0.012, (OV[0], OV[1], 0.03), "soil", segs=16)
    corners = [(-3.15, -2.65), (3.15, -2.65), (3.15, 2.65), (-3.15, 2.65)]
    for k, (x, y) in enumerate(corners):
        p.box((0.08, 0.08, 0.38), (x, y, 0.19), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, 0.38), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.46)))
    for (x0, y0), (x1, y1) in zip(corners, corners[1:] + corners[:1]):
        L = math.hypot(x1 - x0, y1 - y0)
        p.box((L, 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, 0.3), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # oven: centre peg and the measuring string out to a stake on the circle
    p.box((0.09, 0.09, 0.24), (OV[0], OV[1], 0.12), "wood_mid", bevel=0.01)
    sx, sy = OV[0] + 1.55 * math.cos(-0.9), OV[1] + 1.55 * math.sin(-0.9)
    p.box((0.08, 0.08, 0.32), (sx, sy, 0.16), "wood_light", bevel=0.01)
    p.box((1.55, 0.02, 0.02), ((OV[0] + sx) / 2, (OV[1] + sy) / 2, 0.18), "white", rot=(0, 0, math.degrees(-0.9)))
    # the plan: cottage and dome sketch held down by pebbles
    px, py, pr = -1.2, -3.35, -5
    p.box((0.62, 0.46, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    for loc, size in (((-0.08, 0.1, 0), (0.3, 0.012, 0.004)), ((-0.08, -0.1, 0), (0.3, 0.012, 0.004)),
                      ((-0.23, 0, 0), (0.012, 0.2, 0.004)), ((0.07, 0, 0), (0.012, 0.2, 0.004))):
        p.add(bm_box(*size), "ink", base @ M(loc))
    p.add(bm_lathe([(0.09, 0), (0.1, 0.004)], 10), "ink", base @ M((0.17, 0.02, 0)))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and spare stakes
    p.cyl(0.028, 0.5, (-2.6, -3.5, 0.05), "wood_light", segs=6, rot=(0, 90, 20))
    p.box((0.15, 0.24, 0.15), (-2.15, -3.33, 0.085), "wood_mid", rot=(0, 0, 20), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (2.2, -3.45 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, -6))
    for i in range(6):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.5, 2.6)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a), 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth (two courses of dressed blocks) with a plank floor."""
    cols = ["stone", "stone", "stone_mid", "stone_light"]
    p.box((6.1, 5.1, 0.33), (0, 0, 0.165), "stone_dark")
    ex, ey, d = 3.1, 2.6, 0.3
    for z0, z1 in ((0.0, 0.17), (0.17, 0.35)):
        for side in range(4):
            horiz = side in (0, 2)
            L = 2 * ex if horiz else 2 * (ey - d)
            u = -L / 2
            first = True
            while u < L / 2 - 0.05:
                w = min(rnd.uniform(0.5, 0.9), L / 2 - u) if not first else rnd.uniform(0.3, 0.8)
                first = False
                c = u + w / 2
                out = rnd.uniform(0.0, 0.03)
                h = z1 - z0 - 0.02
                size = (w - 0.03, d, h) if horiz else (d, w - 0.03, h)
                if side == 0:
                    loc = (c, -ey + d / 2 - out, (z0 + z1) / 2)
                elif side == 2:
                    loc = (c, ey - d / 2 + out, (z0 + z1) / 2)
                elif side == 1:
                    loc = (ex - d / 2 + out, c, (z0 + z1) / 2)
                else:
                    loc = (-ex + d / 2 - out, c, (z0 + z1) / 2)
                p.add(jitter(bm_box(*size, bevel=0.03), 0.01, rnd.randint(0, 999)), rnd.choice(cols), M(loc))
                u += w
    for i in range(12):
        y = -2.36 + i * 0.43
        p.box((5.9, 0.41, 0.04), (0, y, 0.34), "wood" if i % 2 else "wood_light")
    # a few stones and a bucket of mortar waiting
    p.cyl(0.2, 0.3, (-3.55, 1.6, 0), "wood_mid", r2=0.22, segs=10)
    p.cyl(0.19, 0.02, (-3.55, 1.6, 0.27), "stone_light", segs=10)
    for i, (x, y) in enumerate(((-3.6, 2.15), (-3.35, 2.35), (-3.62, 2.42))):
        p.add(jitter(bm_box(0.5, 0.3, 0.2, bevel=0.03), 0.015, 70 + i), rnd.choice(cols), M((x, y, 0.1 + 0.2 * (i == 2)), (0, 0, rnd.uniform(-20, 20))))


def stage_03(p, rnd, extra):
    """The oven base: a round fieldstone plinth with a hearth slab, bricks stacked ready."""
    cols = ["stone", "stone_mid", "stone_light", "stone_warm"]
    p.cyl(PL_R, OV_PLINTH, (OV[0], OV[1], 0), "stone_dark", segs=16)
    inside = lambda x, y: x < HX - 0.05
    for z0, z1, n in ((0.0, 0.3, 15), (0.3, 0.58, 17), (0.58, OV_PLINTH, 16)):
        ring_patches(p, rnd, OV, PL_R + 0.01, z0, z1, n, cols, bulge=0.045, gap=1.6, skip=inside)
    p.cyl(PL_R + 0.12, 0.1, (OV[0], OV[1], OV_PLINTH), "stone_light", segs=18)
    # stacked bricks and a trowel on a board
    bx, by = 5.4, 1.55
    for layer in range(3):
        for i in range(4):
            if layer == 2 and i == 3:
                continue
            rz = 90 * (layer % 2)
            off = (i - 1.5) * 0.13
            loc = (bx + (off if rz == 0 else 0), by + (off if rz else 0), 0.045 + layer * 0.085)
            p.box((0.12, 0.25, 0.08) if rz == 0 else (0.25, 0.12, 0.08), loc, rnd.choice(["brick", "brick_dark", "brick_light"]))
    tx, ty = 5.6, 0.45
    p.box((0.4, 0.3, 0.03), (tx, ty, 0.015), "wood_light", rot=(0, 0, 15))
    p.add(bm_prism([(0, 0), (0.16, 0.05), (0.16, -0.05)], 0.008), "iron", M((tx - 0.05, ty, 0.035), (90, 0, 15)))
    p.cyl(0.015, 0.12, (tx + 0.11, ty + 0.04, 0.035), "wood_dark", segs=5, rot=(0, 90, 15))


def stage_04(p, rnd, extra):
    """Timber frame: corner and door/window posts, sill beams, top plates, gable posts,
    rafters and the ridge beam, with a ladder and spare planks at the back."""
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.28, 0.28, PLATE[1] - FLOOR), (sx * HX, sy * HY, (FLOOR + PLATE[1]) / 2), "wood_dark", bevel=0.02)
    for side, (fr, half) in FRAMES.items():
        for u in POSTS[side]:
            wb(p, side, (0.24, 0.26, PLATE[0] - SILL[1]), (u, 0.08, (SILL[1] + PLATE[0]) / 2), "wood_dark")
        span = half + 0.15 if side in ("front", "back") else half - 0.29
        wb(p, side, (2 * span, 0.26, PLATE[1] - PLATE[0]), (0, 0.08, sum(PLATE) / 2), "wood_mid", bevel=0.015)
        # sill beam, with a gap for the door
        gaps = [h for h in HOLES[side] if h[2] <= FLOOR + 1e-3]
        lim = half if side in ("front", "back") else half - 0.29
        segs, u = [], -lim
        for h in gaps:
            segs.append((u, h[0]))
            u = h[1]
        segs.append((u, lim))
        for a, b in segs:
            wb(p, side, (b - a, 0.26, SILL[1] - SILL[0]), ((a + b) / 2, 0.08, sum(SILL) / 2), "wood_mid")
    # gables: queen posts and raking rafters (in the wall plane)
    for side in ("left", "right"):
        for u in (-0.45, 0.45):
            ztop = 5.045 - SLOPE * abs(u) - 0.1
            wb(p, side, (0.2, 0.24, ztop - PLATE[1]), (u, 0.08, (ztop + PLATE[1]) / 2), "wood_dark")
        for s in (-1, 1):
            strut(p, side, (s * 2.85, 5.045 - SLOPE * 2.85), (0.0, 5.045), "wood_mid", w=0.18, d=0.16)
    # ridge beam and roof rafters (hidden once the roof is on)
    p.box((2 * HX + 0.3, 0.2, 0.2), (0, 0, 5.04), "wood_mid", bevel=0.015)
    L = 2.85 / math.cos(math.radians(ANG))
    for x in (-1.5, 0.0, 1.5):
        for s in (-1, 1):
            p.add(bm_box(0.14, L, 0.18), "wood_mid", slope_m(s, s * 1.425, 5.045 - SLOPE * 1.425, x))
    # ladder against the back wall and a stack of planks
    lx = -2.1
    foot, top = Vector((0, HY + 0.8, 0.0)), Vector((0, HY + 0.17, 2.95))
    dv = top - foot
    lang = math.degrees(math.atan2(-dv.y, dv.z))
    for s in (-1, 1):
        p.add(bm_box(0.07, 0.07, dv.length), "wood_light", M((lx + s * 0.22, (foot.y + top.y) / 2, (foot.z + top.z) / 2), (lang, 0, 0)))
    for k in range(8):
        f = (k + 0.7) / 8.5
        q = foot + dv * f
        p.box((0.44, 0.05, 0.05), (lx, q.y, q.z), "wood_light")
    for i in range(5):
        p.box((1.8, 0.24, 0.05), (-0.9 + rnd.uniform(-0.05, 0.05), HY + 0.85 + (i % 2) * 0.03, 0.04 + 0.05 * i), "wood_light" if i % 2 else "wood",
              rot=(0, 0, rnd.uniform(-3, 3)))
    for x in (-1.6, -0.2):
        p.box((0.12, 0.6, 0.06), (x, HY + 0.85, 0.01), "wood_dark")


def fill_panels(p, side, half, z0, z1, holes, matname="plaster"):
    u = -half
    for h in sorted(holes):
        if h[0] - u > 0.01:
            wb(p, side, (h[0] - u, 0.18, z1 - z0), ((u + h[0]) / 2, 0.09, (z0 + z1) / 2), matname)
        if h[2] - z0 > 0.01:
            wb(p, side, (h[1] - h[0], 0.18, h[2] - z0), ((h[0] + h[1]) / 2, 0.09, (z0 + h[2]) / 2), matname)
        if z1 - h[3] > 0.01:
            wb(p, side, (h[1] - h[0], 0.18, z1 - h[3]), ((h[0] + h[1]) / 2, 0.09, (h[3] + z1) / 2), matname)
        u = h[1]
    if half - u > 0.01:
        wb(p, side, (half - u, 0.18, z1 - z0), ((u + half) / 2, 0.09, (z0 + z1) / 2), matname)


def stage_05(p, rnd, extra):
    """Plaster walls between the timbers, braces, lintels and sill rails, plaster gables."""
    for side, (fr, half) in FRAMES.items():
        fill_panels(p, side, half - 0.13, SILL[1], PLATE[0], [(a, b, max(c, SILL[1]), d) for a, b, c, d in HOLES[side]])
        for a, b, z0, z1 in HOLES[side]:
            wb(p, side, (b - a + 0.3, 0.24, 0.15), ((a + b) / 2, 0.08, z1 + 0.075), "wood_mid")
            if z0 > FLOOR + 0.01:
                wb(p, side, (b - a + 0.3, 0.24, 0.13), ((a + b) / 2, 0.08, z0 - 0.065), "wood_mid")
    # braces in the plain bays
    for side, a, b in (("front", (-2.86, SILL[1]), (-2.1, PLATE[0])), ("back", (-2.86, SILL[1]), (-2.12, PLATE[0])),
                       ("back", (2.86, SILL[1]), (2.12, PLATE[0])), ("back", (-0.74, SILL[1]), (-1.88, PLATE[0])),
                       ("left", (-2.36, SILL[1]), (-0.74, PLATE[0])), ("left", (2.36, SILL[1]), (0.74, PLATE[0])),
                       ("right", (2.36, SILL[1]), (1.32, PLATE[0]))):
        strut(p, side, a, b)
    for side in ("left", "right"):
        p.add(bm_prism([(-2.45, PLATE[1]), (2.45, PLATE[1]), (0.0, 5.06)], 0.18), "plaster", FRAMES[side][0] @ M((0, 0.09, 0)))
        for s in (-1, 1):
            strut(p, side, (s * 0.55, PLATE[1] + 0.05), (s * 1.7, 5.045 - SLOPE * 1.7 - 0.08), "wood_dark", w=0.14)
        wb(p, side, (0.9, 0.24, 0.13), (0, 0.08, 3.4), "wood_dark")


def stage_06(p, rnd, extra):
    """The great domed brick oven on the plinth, with an arched brick mouth facing the front."""
    c = OV
    prof = [(OV_R * math.cos(math.radians(a)), OV_Z0 + OV_H * math.sin(math.radians(a))) for a in (0, 18, 36, 52, 66, 78, 90)]
    p.add(bm_lathe(prof, 16), "brick_dark", M((c[0], c[1], 0)), smooth=True)
    cols = ["brick", "brick", "brick_light", "brick_dark", "brick"]
    edges = [0, 10, 20, 30, 40, 50, 60, 70, 80]
    inside = lambda x, y: x < HX - 0.02
    for k in range(len(edges) - 1):
        f0, f1 = math.radians(edges[k]), math.radians(edges[k + 1])
        fm = (f0 + f1) / 2
        r0, r1, rm = OV_R * math.cos(f0), OV_R * math.cos(f1), OV_R * math.cos(fm)
        n = max(6, int(TAU * rm / 0.4))
        off = rnd.uniform(0, 360 / n)
        for i in range(n):
            a0, a1 = off + 360 * i / n + 0.9, off + 360 * (i + 1) / n - 0.9
            am = math.radians((a0 + a1) / 2)
            if inside(c[0] + rm * math.cos(am), c[1] + rm * math.sin(am)):
                continue
            o = 0.03
            pr = [(r0 + o * math.cos(f0) - 0.005, OV_Z0 + OV_H * math.sin(f0) + 0.012),
                  (rm + (o + 0.015) * math.cos(fm), OV_Z0 + OV_H * math.sin(fm) + 0.015 * math.sin(fm)),
                  (r1 + o * math.cos(f1) - 0.005, OV_Z0 + OV_H * math.sin(f1) - 0.008)]
            p.add(bm_lathe(pr, 2, arc=(a0, a1)), rnd.choice(cols), M((c[0], c[1], 0)))
    # mouth porch: brick cheeks, voussoir arch, spandrels and a hood
    x0, x1, y0, y1, top = PORCH
    xm, yc, dp = (x0 + x1) / 2, (y0 + y1) / 2, y1 - y0
    for xa, xb in ((x0, xm - MOUTH_W), (xm + MOUTH_W, x1)):
        p.box((xb - xa, dp, MOUTH_SPRING - OV_Z0), ((xa + xb) / 2, yc, (OV_Z0 + MOUTH_SPRING) / 2), "brick")
        for zz in (1.02, 1.12):
            p.box((xb - xa + 0.01, dp + 0.01, 0.012), ((xa + xb) / 2, yc, zz), "brick_dark")
    n = 7
    ro = MOUTH_W + 0.21
    for k in range(n):
        a0, a1 = math.pi * k / n + 0.015, math.pi * (k + 1) / n - 0.015
        rk = ro + (0.05 if k == n // 2 else 0.0)
        pts = arch_pts(MOUTH_W, MOUTH_SPRING, 2, a0, a1, xm) + list(reversed(arch_pts(rk, MOUTH_SPRING, 2, a0, a1, xm)))
        p.add(bm_prism(pts, dp + (0.04 if k == n // 2 else 0)), "stone_light" if k == n // 2 else rnd.choice(["brick", "brick_light"]),
              M((0, yc - (0.02 if k == n // 2 else 0), 0)))
    for s in (-1, 1):
        pts = [(xm + s * (x1 - xm), MOUTH_SPRING), (xm + s * (x1 - xm), top), (xm, top)] + \
              [(xm + s * ro * math.cos(math.pi / 2 * k / 6), MOUTH_SPRING + ro * math.sin(math.pi / 2 * k / 6)) for k in range(6, -1, -1)][1:-1]
        p.add(bm_prism(pts, dp - 0.02), "brick_dark", M((0, yc + 0.01, 0)))
    p.box((x1 - x0 + 0.12, 0.2, 0.08), (xm, y0 + 0.04, top + 0.04), "stone_light", bevel=0.02)
    p.box((x1 - x0 + 0.04, 0.3, 0.08), (xm, y0 - 0.1, OV_Z0 - 0.04), "stone_light", bevel=0.015)
    # soot-dark inside of the mouth
    p.add(bm_prism(mouth_shape(MOUTH_W, MOUTH_SPRING, xm), 0.02), "ink", M((0, y1 - 0.05, 0)))
    p.box((2 * MOUTH_W, dp - 0.06, 0.01), (xm, yc + 0.02, OV_Z0 + 0.005), "ink")
    for s in (-1, 1):
        p.add(bm_prism([(xm + s * 0.06, MOUTH_SPRING + MOUTH_W + 0.03), (xm + s * 0.18, MOUTH_SPRING + MOUTH_W + 0.3),
                        (xm, MOUTH_SPRING + MOUTH_W + 0.36)], 0.01), "ink", M((0, y0 - 0.006, 0)))


def stage_07(p, rnd, extra):
    """Arched green plank door with spandrels, iron straps, a threshold and stone steps."""
    hw, top, x0 = DOOR_HW, DOOR_TOP, DOOR_X
    zc = top - hw
    yf = -HY
    for s in (-1, 1):
        pts = [(x0 + s * hw, zc), (x0 + s * hw, top), (x0, top)] + \
              [(x0 + s * hw * math.cos(math.pi / 2 * k / 6), zc + hw * math.sin(math.pi / 2 * k / 6)) for k in range(6, -1, -1)][1:-1]
        p.add(bm_prism(pts, 0.2), "wood_dark", M((0, yf + 0.1, 0)))
    for k in range(9):
        a0, a1 = math.pi * k / 9 + 0.01, math.pi * (k + 1) / 9 - 0.01
        pts = arch_pts(hw, zc, 2, a0, a1, x0) + list(reversed(arch_pts(hw + 0.07, zc, 2, a0, a1, x0)))
        p.add(bm_prism(pts, 0.05), "wood_light", M((0, yf - 0.02, 0)))
    yd = yf + 0.12
    p.add(bm_prism([(x0 - hw, FLOOR), (x0 + hw, FLOOR)] + arch_pts(hw, zc, 12, x0=x0), 0.04), "wood_dark", M((0, yd + 0.05, 0)))
    arch_top = lambda u: zc + math.sqrt(max(hw * hw - (u - x0) ** 2, 0.0))
    for i in range(4):
        a, b = x0 - hw + 2 * hw * i / 4 + 0.012, x0 - hw + 2 * hw * (i + 1) / 4 - 0.012
        pts = [(a, FLOOR + 0.01), (b, FLOOR + 0.01)] + [(b - (b - a) * k / 3, arch_top(b - (b - a) * k / 3)) for k in range(4)]
        p.add(bm_prism(pts, 0.07), "door", M((0, yd, 0)))
    for z in (0.75, 1.75):
        p.box((0.82, 0.03, 0.08), (x0 - 0.04, yd - 0.05, z), "iron")
        p.cyl(0.05, 0.03, (x0 - 0.42, yd - 0.04, z), "iron", segs=8, rot=(90, 0, 0))
    p.add(bm_tube([(x0 + 0.27 + 0.06 * math.cos(TAU * k / 10), yd - 0.07, 1.25 + 0.06 * math.sin(TAU * k / 10)) for k in range(11)],
                  0.013, 5), "iron")
    p.cyl(0.035, 0.04, (x0 + 0.27, yd - 0.04, 1.31), "iron", segs=8, rot=(90, 0, 0))
    p.box((2 * hw + 0.1, 0.3, 0.05), (x0, yf + 0.02, FLOOR + 0.005), "stone_light", bevel=0.015)
    p.box((1.3, 0.42, 0.3), (x0, yf - 0.33, 0.15), "stone", bevel=0.04)
    p.box((1.55, 0.36, 0.15), (x0, yf - 0.7, 0.075), "stone_light", bevel=0.04)


def side_window(p, side, rnd, u=0.0, z0=1.05, z1=2.05, hw=0.5):
    zm, h = (z0 + z1) / 2, z1 - z0
    f = 0.07
    for s in (-1, 1):
        wb(p, side, (f, 0.18, h), (u + s * (hw - f / 2), 0.09, zm), "wood_light")
    for zz in (z0 + f / 2, z1 - f / 2):
        wb(p, side, (2 * hw, 0.18, f), (u, 0.09, zz), "wood_light")
    wb(p, side, (2 * hw - 2 * f, 0.03, h - 2 * f), (u, 0.11, zm), "glass")
    wb(p, side, (0.05, 0.07, h - 2 * f), (u, 0.08, zm), "wood_light")
    wb(p, side, (2 * hw - 2 * f, 0.07, 0.05), (u, 0.08, zm), "wood_light")
    wb(p, side, (2 * hw + 0.24, 0.2, 0.06), (u, -0.06, z0 - 0.02), "stone_light", bevel=0.01)
    for s in (-1, 1):
        hinge = FRAMES[side][0] @ M((u + s * (hw + 0.26), -0.08, zm), (0, 0, s * 6))
        p.add(bm_box(hw - 0.02, 0.045, h - 0.02), "shutter", hinge @ M((s * (hw - 0.02) / 2, 0, 0)))
        for zz in (-h * 0.3, h * 0.3):
            p.add(bm_box(hw - 0.06, 0.025, 0.06), "wood_dark", hinge @ M((s * (hw - 0.02) / 2, -0.03, zz)))
        p.add(bm_box(0.04, 0.02, h * 0.62), "wood_dark", hinge @ M((s * (hw - 0.02) / 2, -0.03, 0), (0, s * 35, 0)))


def stage_08(p, rnd, extra):
    """Shuttered side windows, a little loft window, and the open shop window with shelves
    and a drop-down counter hung on chains."""
    side_window(p, "left", rnd)
    side_window(p, "back", rnd)
    # loft window on the left gable (glass sits on the plaster)
    for s in (-1, 1):
        wb(p, "left", (0.07, 0.08, 0.56), (s * 0.27, -0.03, 3.82), "wood_light")
    for zz in (3.57, 4.07):
        wb(p, "left", (0.6, 0.08, 0.07), (0, -0.03, zz), "wood_light")
    wb(p, "left", (0.48, 0.02, 0.44), (0, -0.01, 3.82), "glass")
    wb(p, "left", (0.04, 0.05, 0.44), (0, -0.03, 3.82), "wood_light")
    # shop window
    x0, x1, z0, z1 = SHOP
    xm, w = (x0 + x1) / 2, x1 - x0
    yb = -HY + 0.55
    p.box((w, 0.04, z1 - z0), (xm, yb, (z0 + z1) / 2), "plaster_shade")
    for x in (x0 + 0.02, x1 - 0.02):
        p.box((0.04, 0.36, z1 - z0), (x, yb - 0.18, (z0 + z1) / 2), "wood_mid")
    p.box((w, 0.36, 0.04), (xm, yb - 0.18, z1 - 0.02), "wood_mid")
    p.box((w, 0.62, 0.05), (xm, -HY + 0.25, z0 + 0.0), "wood_light")
    for zz in (1.38, 1.76):
        p.box((w - 0.06, 0.32, 0.035), (xm, yb - 0.17, zz), "wood_light")
        for x in (x0 + 0.3, x1 - 0.3):
            p.add(bm_prism([(0, 0), (0, -0.14), (-0.14, 0)], 0.03), "wood_dark", M((x, yb - 0.03, zz - 0.018), (0, 0, 90)))
    # drop-down counter (the lower shutter), chains and knee brackets
    yc0, yc1, zc = -HY - 0.03, -HY - 0.6, z0 - 0.03
    p.box((w + 0.1, yc0 - yc1, 0.06), (xm, (yc0 + yc1) / 2, zc), "wood_light", bevel=0.01)
    p.box((w + 0.1, 0.04, 0.09), (xm, yc1 + 0.02, zc - 0.01), "wood_dark")
    for i in range(1, 5):
        p.box((0.02, yc0 - yc1 - 0.04, 0.005), (x0 - 0.05 + i * (w + 0.1) / 5, (yc0 + yc1) / 2, zc + 0.031), "wood_mid")
    for x in (x0 + 0.08, x1 - 0.08):
        p.add(bm_tube([(x, -HY - 0.08, z1 - 0.05), (x, yc1 + 0.05, zc + 0.04)], 0.012, 4), "iron")
        a, b = Vector((x, -HY - 0.05, 0.5)), Vector((x, yc1 + 0.12, zc - 0.04))
        d = b - a
        p.add(bm_box(0.07, 0.07, d.length), "wood_dark", M((a + b) / 2, (math.degrees(math.atan2(-d.y, d.z)), 0, 0)))
        p.box((0.08, 0.06, 0.12), (x, -HY - 0.04, 0.5), "wood_dark")


def stage_09(p, rnd, extra):
    """Red clay tile roof with deep eaves, ridge tiles and bargeboards."""
    L = math.hypot(EAVE_Y, RIDGE_Z - EAVE_Z) + 0.05
    a = math.radians(ANG)
    cols = ["roof", "roof", "roof_mid", "roof_dark", "roof", "roof_mid"]
    for s in (-1, 1):
        n = Vector((0, s * math.sin(a), math.cos(a)))
        up = Vector((0, -s * math.cos(a), math.sin(a)))
        eave = Vector((0, s * EAVE_Y, EAVE_Z))
        mid = eave + up * (L / 2) - n * (ROOF_T / 2)
        p.add(bm_box(2 * VERGE, L, ROOF_T), "roof_dark", slope_m(s, mid.y, mid.z))
        rows, step, tl = 12, 0.355, 0.44
        ncol = 17
        tw = 2 * VERGE / ncol
        for j in range(rows):
            sj = -0.08 + j * step + tl / 2
            for i in range(ncol):
                x = -VERGE + tw * (i + 0.5)
                c = eave + up * sj + n * 0.045
                m = slope_m(s, c.y, c.z, x, tilt=5) @ M((0, 0, 0), (0, rnd.uniform(-2, 2), rnd.uniform(-1.5, 1.5)))
                p.add(bm_box(tw - 0.03, tl, 0.05), rnd.choice(cols), m)
        for sx in (-1, 1):
            c = eave + up * (L / 2) + n * 0.02
            p.add(bm_box(0.07, L + 0.05, 0.24), "wood_mid", slope_m(s, c.y, c.z - 0.06, sx * (VERGE + 0.035)))
    for k in range(7):
        p.add(bm_cyl(0.16, 0.16, 0.99, 8), "roof_dark", M((-3.5 + k * 1.0, 0, RIDGE_Z - 0.04), (0, 90, 0)))
        p.add(bm_cyl(0.18, 0.18, 0.06, 8), "roof_mid", M((-3.53 + k * 1.0, 0, RIDGE_Z - 0.04), (0, 90, 0)))


def stage_10(p, rnd, extra):
    """Stone chimney stack rising from the back of the oven, brick-topped, with a pot.
    The `smoke` empty sits at the top of the pot."""
    cx, cy, hs, ztop = CHIM
    cols = ["stone", "stone_mid", "stone_light", "stone_warm"]
    z, k = 0.0, 0
    p.box((2 * hs - 0.06, 2 * hs - 0.06, ztop), (cx, cy, ztop / 2), "stone_dark")
    while z < ztop - 0.4:
        h = 0.3 if z < 5.0 else 0.25
        h = min(h, ztop - 0.35 - z)
        for i in (-1, 1):
            if k % 2:
                size, loc = (hs - 0.015, 2 * hs, h - 0.025), (cx + i * hs / 2, cy, z + h / 2)
            else:
                size, loc = (2 * hs, hs - 0.015, h - 0.025), (cx, cy + i * hs / 2, z + h / 2)
            p.add(jitter(bm_box(*size), 0.012, rnd.randint(0, 9999)), rnd.choice(cols), M(loc))
        z += h
        k += 1
    for j in range(3):
        zz = z + j * 0.11
        for i in range(4):
            u = -hs + hs / 4 + i * hs / 2
            for sgn in (-1, 1):
                p.box((hs / 2 - 0.02, 0.1, 0.09), (cx + u, cy + sgn * (hs - 0.04), zz + 0.045), rnd.choice(["brick", "brick_dark", "brick_light"]))
                p.box((0.1, hs / 2 - 0.02, 0.085), (cx + sgn * (hs - 0.04), cy + u, zz + 0.045), rnd.choice(["brick", "brick_dark", "brick_light"]))
    zc = z + 0.33
    p.box((2 * hs + 0.14, 2 * hs + 0.14, 0.1), (cx, cy, zc + 0.05), "stone_light", bevel=0.02)
    p.cyl(0.14, 0.32, (cx, cy, zc + 0.1), "terracotta", r2=0.11, segs=10)
    p.cyl(0.13, 0.05, (cx, cy, zc + 0.42), "terracotta", segs=10)
    p.cyl(0.09, 0.005, (cx, cy, zc + 0.47), "ink", segs=10)
    # brick flue collar where the stack meets the dome
    p.box((0.7, 0.5, 0.35), (cx + 0.18, cy - 0.15, 2.0), "brick_dark", rot=(0, 0, -35), bevel=0.03)
    extra.append(("smoke", (cx, cy, zc + 0.5)))


def stage_11(p, rnd, extra):
    """First fire: the oven mouth glows (object `oven_glow`, material `glow`), with the iron
    oven door leaning beside it, a baker's peel and a stack of firewood."""
    xm = (PORCH[0] + PORCH[1]) / 2
    g = Part("oven_glow")
    g.add(bm_prism(mouth_shape(MOUTH_W - 0.02, MOUTH_SPRING, xm), 0.02), "glow", M((0, PORCH[3] - 0.08, 0)))
    for i in range(7):
        g.add(jitter(bm_ico(rnd.uniform(0.05, 0.08), 0), 0.015, i), "glow",
              M((xm + rnd.uniform(-0.18, 0.18), PORCH[3] - 0.2 + rnd.uniform(-0.1, 0.1), OV_Z0 + 0.03), scale=(1.2, 1, 0.6)))
    for i, (dx, rz) in enumerate(((-0.08, 20), (0.08, -25))):
        g.add(bm_cyl(0.04, 0.04, 0.34, 6), "wood_dark", M((xm + dx, PORCH[3] - 0.1, OV_Z0 + 0.06), (90, 0, rz)))
    extra.append((g, (xm, PORCH[3] - 0.2, OV_Z0)))
    # iron oven door leaning on the plinth left of the mouth
    dm = M((PORCH[1] + 0.2, PORCH[2] + 0.05, 0.0), (-20, 0, 20))
    p.add(bm_prism([(-0.27, 0), (0.27, 0)] + arch_pts(0.27, 0.32, 8), 0.04), "iron", dm)
    p.add(bm_box(0.16, 0.03, 0.035), "wood_dark", dm @ M((0, -0.04, 0.36)))
    # baker's peel leaning on the plinth
    pm = M((2.55, -2.9, 0.0), (-10.5, 0, 8))
    p.add(bm_cyl(0.025, 0.025, 1.6, 6), "wood_light", pm @ M((0, 0, 0.35)))
    p.add(bm_prism(rrect(0.34, 0.38, 0.12), 0.02), "wood_light", pm @ M((0, 0, 0.19)))
    logs_pile(p, rnd, 4.45, 0.75)
    p.add(bm_cyl(0.09, 0.09, 0.5, 7), "wood", M((5.3, -2.75, 0.09), (0, 90, 25)))


def stage_12(p, rnd, extra):
    """Bread in the shop window: loaves on the shelves and counter, a striped `awning` above."""
    x0, x1, z0, z1 = SHOP
    yb = -HY + 0.55
    for zz in (1.4, 1.78):
        x = x0 + 0.2
        while x < x1 - 0.2:
            if rnd.random() < 0.55:
                boule(p, M((x, yb - 0.17, zz + 0.04), (0, 0, rnd.uniform(0, 90))), r=rnd.uniform(0.1, 0.12),
                      mat=rnd.choice(["crust", "crust", "crust_dark"]))
                x += 0.27
            else:
                long_loaf(p, M((x + 0.05, yb - 0.17, zz + 0.05), (0, 0, rnd.uniform(-10, 10))), ln=0.36)
                x += 0.3
    # counter: baskets of buns, long loaves, round loaves on a cloth
    zc = z0 + 0.0
    basket(p, x0 + 0.3, -HY - 0.33, zc, r=0.2, h=0.14)
    for i in range(6):
        a = TAU * i / 6
        boule(p, M((x0 + 0.3 + 0.1 * math.cos(a), -HY - 0.33 + 0.1 * math.sin(a), zc + 0.15)), r=0.07, marks=False)
    xm = (x0 + x1) / 2
    p.box((0.6, 0.42, 0.01), (xm, -HY - 0.32, zc + 0.035), "canvas", rot=(0, 0, 4))
    for k in range(3):
        long_loaf(p, M((xm - 0.03 + 0.03 * k, -HY - 0.2 - 0.12 * k, zc + 0.08), (0, 0, 8 - 6 * k)), ln=0.46)
    for k, (dx, dy) in enumerate(((0.55, -0.22), (0.78, -0.4), (0.62, -0.46))):
        boule(p, M((xm + dx, -HY + dy, zc + 0.08), (0, 0, 30 * k)), r=0.12, mat="crust" if k != 1 else "crust_dark")
    # standing basket of baguettes by the window
    bkx, bky = 0.02, -HY - 0.3
    basket(p, bkx, bky, 0.0, r=0.17, h=0.42)
    for k in range(5):
        a = TAU * k / 5
        p.add(bm_uv(0.045, 6, 4), "crust", M((bkx + 0.07 * math.cos(a), bky + 0.07 * math.sin(a), 0.55),
                                              (rnd.uniform(-10, 10), rnd.uniform(-10, 10), 0), (1, 1, 6.5)), smooth=True)
    # striped cloth awning, pivot on the wall along its top edge
    aw = Part("awning")
    ay, az, fy, fz = -HY - 0.02, 2.46, -HY - 0.68, 2.06
    L = math.hypot(fy - ay, fz - az)
    tilt = math.degrees(math.atan2(az - fz, ay - fy))
    ax0, ax1 = x0 - 0.12, x1 + 0.12
    n = 7
    sw = (ax1 - ax0) / n
    for i in range(n):
        mname = "cloth" if i % 2 == 0 else "canvas"
        xc = ax0 + sw * (i + 0.5)
        aw.add(bm_box(sw + 0.002, L, 0.025), mname, M((xc, (ay + fy) / 2, (az + fz) / 2 - 0.02), (tilt, 0, 0)))
        aw.add(bm_prism([(-sw / 2, 0)] + [(-sw / 2 * math.cos(math.pi * k / 4), -0.13 * math.sin(math.pi * k / 4)) for k in range(1, 4)]
                        + [(sw / 2, 0)], 0.02), mname, M((xc, fy - 0.01, fz - 0.025)))
    aw.add(bm_box(ax1 - ax0 + 0.08, 0.08, 0.08), "wood_dark", M(((ax0 + ax1) / 2, ay - 0.02, az + 0.02)))
    for x in (ax0 + 0.05, ax1 - 0.05):
        aw.add(bm_tube([(x, ay, az + 0.3), (x, fy + 0.02, fz + 0.01)], 0.012, 4), "iron")
        aw.add(bm_box(0.05, 0.04, 0.06), "iron", M((x, ay - 0.01, az + 0.3)))
    extra.append((aw, ((ax0 + ax1) / 2, ay, az)))


def flower_box(p, m, w, rnd):
    p.add(bm_box(w, 0.24, 0.2), "wood_mid", m)
    p.add(bm_box(w + 0.04, 0.27, 0.04), "wood_dark", m @ M((0, 0, 0.1)))
    petals = ["petal_pink", "petal_white", "petal_yellow", "petal_pink", "petal_purple"]
    k = int(w / 0.26)
    for i in range(k):
        u = -w / 2 + 0.13 + i * (w - 0.26) / max(k - 1, 1)
        p.add(jitter(bm_ico(0.13, 1), 0.025, i + rnd.randint(0, 99)), rnd.choice(["grass", "grass_dark", "leaf_deep"]),
              m @ M((u, -0.02, 0.15), scale=(1.1, 0.9, 0.85)), smooth=True)
    for i in range(k + 2):
        u = -w / 2 + 0.08 + i * (w - 0.16) / (k + 1)
        p.add(bm_ico(0.05, 0), rnd.choice(petals), m @ M((u, -0.1 + rnd.uniform(-0.05, 0.04), 0.2 + rnd.uniform(0, 0.08))))


def stage_13(p, rnd, extra):
    """Flower boxes under the windows, a bench, a potted plant and the hanging loaf sign."""
    flower_box(p, FRAMES["left"][0] @ M((0, -0.14, 0.88)), 1.2, rnd)
    flower_box(p, FRAMES["back"][0] @ M((0, -0.14, 0.88)), 1.2, rnd)
    # bench along the left wall
    bx = -HX - 0.42
    p.box((0.4, 1.5, 0.08), (bx, 0, 0.46), "wood_light", bevel=0.015)
    for y in (-0.6, 0.6):
        p.box((0.34, 0.09, 0.42), (bx, y, 0.21), "wood_mid")
    p.box((0.06, 1.25, 0.06), (bx + 0.05, 0, 0.18), "wood_dark")
    # potted plant right of the door
    px, py = DOOR_X + 0.88, -HY - 0.3
    p.add(bm_lathe([(0.13, 0), (0.17, 0.26), (0.19, 0.3)], 10, cap_top=False), "terracotta", M((px, py, 0)))
    p.cyl(0.16, 0.02, (px, py, 0.25), "soil", segs=10)
    for i in range(4):
        p.add(jitter(bm_ico(0.14, 1), 0.03, i), rnd.choice(["grass_dark", "leaf_deep", "grass"]),
              M((px + rnd.uniform(-0.08, 0.08), py + rnd.uniform(-0.08, 0.08), 0.38 + 0.08 * i), scale=(1, 1, 0.9)), smooth=True)
    for i in range(3):
        p.add(bm_ico(0.045, 0), "petal_white", M((px + rnd.uniform(-0.12, 0.12), py - 0.1, 0.45 + 0.08 * i)))
    # hanging sign on an iron bracket, perpendicular to the wall
    sx, zb = -0.35, 2.4
    p.box((0.08, 0.06, 0.24), (sx, -HY - 0.03, zb - 0.05), "iron")
    p.add(bm_box(0.03, 0.85, 0.04), "iron", M((sx, -HY - 0.45, zb)))
    p.add(bm_tube([(sx, -HY - 0.02, zb - 0.17), (sx, -HY - 0.5, zb - 0.01)], 0.015, 4), "iron")
    p.add(bm_tube([(sx, -HY - 0.86 + 0.04 * math.cos(TAU * k / 8), zb + 0.04 * math.sin(TAU * k / 8)) for k in range(9)], 0.01, 4), "iron")
    sw, sh, zc, yc = 0.64, 0.42, 2.06, -HY - 0.5
    for dy in (-0.2, 0.2):
        for i in range(2):
            p.box((0.015, 0.02 if i else 0.04, 0.07), (sx, yc + dy, zb - 0.06 - i * 0.07), "iron")
    base = M((sx, yc, zc), (0, 0, 90))
    p.add(bm_prism(rrect(sw + 0.08, sh + 0.08, 0.09), 0.05), "wood_dark", base)
    p.add(bm_prism(rrect(sw, sh, 0.07), 0.07), "wood_light", base)
    for s in (-1, 1):
        boule(p, base @ M((0, s * 0.045, -0.03), (-90 * s, 0, 0)) @ M((0, 0, 0), scale=(1.5, 1, 0.55)), r=0.13)
        p.add(bm_box(0.36, 0.01, 0.025), "wheat_dark", base @ M((0, s * 0.04, 0.14)))


def stage_14(p, rnd, extra):
    """Lived in: flour sacks, a barrel and crate, door lanterns (`glow`), a wheat wreath on the
    door, and Hazel's braided festival loaf cooling on the bench."""
    for x, y, rz, s in ((2.98, -3.05, 10, 1.0), (3.3, -3.02, -25, 0.92)):
        sack(p, x, y, rz, s)
    sack(p, 3.2, -3.6, 75, 0.85, lying=True)
    p.add(bm_cyl(0.32, 0.36, 0.006, 12), "flour", M((3.15, -3.35, 0.0), scale=(1.3, 1, 1)))
    sack(p, 4.85, 1.7, 30, 0.9)
    # barrel and crate left of the door
    bx, by = -2.58, -2.95
    p.add(bm_lathe([(0.26, 0), (0.31, 0.2), (0.33, 0.42), (0.31, 0.64), (0.26, 0.84)], 12), "wood", M((bx, by, 0)))
    for z in (0.12, 0.68):
        p.cyl(0.322, 0.05, (bx, by, z), "iron", r2=0.315, segs=12)
    p.cyl(0.25, 0.02, (bx, by, 0.84), "wood_dark", segs=12)
    boule(p, M((bx + 0.05, by - 0.03, 0.9)), r=0.11)
    p.box((0.46, 0.46, 0.38), (-3.25, -3.0, 0.19), "wood_light", rot=(0, 0, 12), bevel=0.02)
    for dz in (-0.12, 0.12):
        p.box((0.48, 0.48, 0.05), (-3.25, -3.0, 0.19 + dz), "wood_mid", rot=(0, 0, 12))
    # lanterns: left of the door and on the left wall above the bench
    for a, b in ((Vector((-2.22, -HY, 2.3)), Vector((-2.22, -HY - 0.4, 2.3))),
                 (Vector((-HX, -1.6, 2.3)), Vector((-HX - 0.4, -1.6, 2.3)))):
        d = (b - a).normalized()
        p.add(bm_box(0.16 if abs(d.x) < 0.5 else 0.06, 0.06 if abs(d.x) < 0.5 else 0.16, 0.28), "wood_dark", M(a + d * 0.02))
        p.add(bm_tube([a + d * 0.03, b, b + Vector((0, 0, -0.06)) + d * 0.05], 0.022, 6), "iron")
        tip = b + d * 0.05
        add_lantern(p, (tip.x, tip.y, 2.3 - 0.06 - 0.62), 1.15, hang=True)
    # wheat wreath with a red bow on the door
    wx, wz, wy = DOOR_X, 1.78, -HY + 0.03
    p.add(bm_tube([(wx + 0.16 * math.cos(TAU * k / 12), wy, wz + 0.16 * math.sin(TAU * k / 12)) for k in range(13)], 0.04, 6, cap=False), "wheat")
    for k in range(12):
        a = TAU * (k + 0.5) / 12
        p.add(bm_lathe([(0.0, 0.0), (0.022, 0.04), (0.0, 0.1)], 5), "wheat_light",
              M((wx + 0.17 * math.cos(a), wy - 0.03, wz + 0.17 * math.sin(a)), (0, 90 - math.degrees(a), 0), (1, 0.6, 1)))
    for s in (-1, 1):
        p.add(bm_prism([(0, 0), (s * 0.09, 0.05), (s * 0.09, -0.05)], 0.03), "cloth", M((wx, wy - 0.05, wz - 0.17)))
    # Hazel's festival braid on a cooling rack, and a basket of loaves, on the bench
    bx, rz = -HX - 0.42, 0.5
    p.box((0.34, 0.5, 0.012), (bx, 0.35, 0.53), "iron")
    for k in range(4):
        p.box((0.02, 0.02, 0.03), (bx + (0.15 if k % 2 else -0.15), 0.35 + (0.22 if k > 1 else -0.22), 0.51), "iron")
    braid(p, M((bx, 0.35, 0.53), (0, 0, 90)), ln=0.44)
    basket(p, bx, -0.35, 0.5, r=0.16, h=0.12)
    for k in range(3):
        boule(p, M((bx + 0.06 * math.cos(TAU * k / 3), -0.35 + 0.06 * math.sin(TAU * k / 3), 0.64)), r=0.08, marks=False)
    p.add(bm_box(0.28, 0.3, 0.015), "canvas", M((bx + 0.05, 0.0, 0.505), (0, 0, 8)))


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
        fn(part, random.Random(5000 + i), extra)
        objs = []
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for xp, origin in extra:
            if isinstance(xp, str):
                common.empty(xp, model, parent=node, loc=origin).empty_display_size = 0.3
            else:
                objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [round(min(p[i] for p in pts), 2) for i in range(3)]
    hi = [round(max(p[i] for p in pts), 2) for i in range(3)]
    print("BAKERY tris", counts, "total", sum(counts.values()))
    print("BAKERY bounds", lo, hi)
    for o in bpy.data.objects:
        if o.name in ("awning", "oven_glow", "smoke"):
            print("BAKERY node", o.name, "parent", o.parent.name, "world", [round(v, 3) for v in o.matrix_world.translation])
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("bakery.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=6.0)
            common.render(os.path.join(common.OUT_PREV, "bakery_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-34, elev=12, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "bakery.png"))
    common.save_blend("bakery")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
