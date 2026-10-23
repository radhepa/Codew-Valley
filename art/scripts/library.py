"""The Scribe's Library: a two-storey stone and timber library with tall arched windows, a
little book turret, a reading bench outside and Ysolde's sealed vault (a carved stone hatch
whose runes glow), in 14 cumulative stages (stage_01 .. stage_14). See art/specs/library.md.

Run headless:  powershell -File art/blender.ps1 art/scripts/library.py
LIB_RENDER=all (default) | final | none | "3,6,final" picks which previews get rendered.

Walls are built in a per-side frame F(side): local x runs along the wall, local -y points
outward (the outer face is at local y = 0), z is up. Angles on the turret: theta = 0 is the
front (-Y), positive toward +X, as in mill.py.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
from mathutils import Matrix, Vector

MODE = os.environ.get("LIB_RENDER", "all").split(",")
TAU = 2 * math.pi
deg = math.degrees

common.PALETTE.update({
    "slate": "#5E6E7A", "slate_dark": "#4A5762", "slate_light": "#74838D",
    "parchment": "#E7D9B6", "book_red": "#8C4538", "book_blue": "#475A7A", "book_green": "#566F52",
    "book_ochre": "#A9803F", "stone_old": "#8E9184", "moss": "#748C4A",
})

# ------------------------------------------------------------------ dimensions
X0, X1, Y0, Y1 = -3.5, 3.5, -2.8, 2.8     # outer faces of the stone ground floor
PL = 0.4                                  # plinth top / floor
WALL = 0.5                                # stone depth
GF = 3.6                                  # top of the stone ground floor
Z_UP = 3.7                                # top of the upper floor deck
UF = 6.2                                  # eaves
J = 0.22                                  # jetty: upper floor overhang front and back
UW = 0.3                                  # timber-framed wall depth
RIDGE = 9.0
EAVE_Y = 3.55                             # roof reach front and back
SLOPE = (RIDGE - UF) / (-Y0 + J)
ALPHA = math.atan(SLOPE)
LS = EAVE_Y / math.cos(ALPHA)
COURSE = 0.4
TC = Vector((3.75, -3.05, 0.0))           # book turret centre (front-right corner)
TR0, TR1, TTOP, TROOM = 1.3, 1.2, 6.4, 7.7
DZ, DR, DYC, DLEN = 7.0, 8.3, -2.045, 2.85  # front wall-dormer: wall top, ridge, ridge centre y, length
DLS = 1.6 / math.cos(math.radians(45))
VC = Vector((-4.5, -4.0, 0.0))            # Ysolde's vault hatch
HINGE = (VC.x, VC.y + 0.6, 0.03)

STONES = ["stone", "stone", "stone_mid", "stone_light", "stone_warm"]
SLATES = ["slate", "slate", "slate_dark", "slate_light"]
BOOKS = ["book_red", "book_blue", "book_green", "book_ochre", "cap"]
SIDES = ("front", "back", "left", "right")

# openings (u centre, width, sill, top/spring, arched)
DOOR = (0.0, 1.3, PL, 2.0, True)
GROUND = {
    "front": [DOOR, (-1.85, 0.9, 1.2, 2.66, True), (1.85, 0.9, 1.2, 2.66, True)],
    "back": [(-1.6, 0.9, 1.2, 2.66, True), (1.6, 0.9, 1.2, 2.66, True)],
    "left": [(-1.1, 0.9, 1.2, 2.66, True), (1.1, 0.9, 1.2, 2.66, True)],
    "right": [(0.7, 0.9, 1.2, 2.66, True)],
}
GU = {"front": (-3.5, 3.5), "back": (-3.5, 3.5), "left": (-2.3, 2.3), "right": (-2.3, 2.3)}
UPPER = {   # sections (u0, u1, top, openings)
    "front": [(-3.5, -1.3, UF, [(-2.4, 0.8, 4.3, 5.5, False)]),
              (-1.3, 1.3, DZ, [(0.0, 1.1, 4.2, 5.9, True)]),
              (1.3, 3.5, UF, [(1.9, 0.7, 4.3, 5.5, False)])],
    "back": [(-3.5, 3.5, UF, [(-1.6, 0.8, 4.3, 5.5, False), (1.6, 0.8, 4.3, 5.5, False)])],
    "left": [(-2.72, 2.72, UF, [(0.0, 0.8, 4.3, 5.5, False)])],
    "right": [(-2.72, 2.72, UF, [(0.6, 0.8, 4.3, 5.5, False)])],
}
UOFF = {"front": J, "back": J, "left": 0.0, "right": 0.0}
TWIN = [(8, 1.5, 2.5, 0.42, 5), (112, 1.9, 2.9, 0.42, 5), (62, 3.9, 4.9, 0.42, 6)]  # turret windows + stage


def F(side, off=0.0):
    """Frame of a wall's outer face: local x along the wall, local -y outward."""
    if side == "front":
        return M((0, Y0 - off, 0))
    if side == "back":
        return M((0, Y1 + off, 0), (0, 0, 180))
    if side == "left":
        return M((X0 - off, 0, 0), (0, 0, -90))
    return M((X1 + off, 0, 0), (0, 0, 90))


def P(theta, r, z=0.0):
    return Vector((TC.x + r * math.sin(theta), TC.y - r * math.cos(theta), z))


def turret_r(z):
    return TR0 + (TR1 - TR0) * (z - PL) / (TTOP - PL)


def roof_z(y):
    return RIDGE - SLOPE * abs(y)


def in_main(q):
    if q.z < GF + 0.1:
        return X0 + 0.05 < q.x < X1 - 0.08 and Y0 + 0.08 < q.y < Y1 - 0.05
    return X0 < q.x < X1 - 0.08 and abs(q.y) < 3.0 and q.z < roof_z(q.y) - 0.15


def in_turret(q, shrink=0.15):
    r = (turret_r(q.z) if q.z > PL else 1.45) - shrink
    return (q.x - TC.x) ** 2 + (q.y - TC.y) ** 2 < r * r


def lbox(p, frame, size, loc, matname, rot=(0, 0, 0), bevel=0.0):
    p.add(bm_box(*size, bevel=bevel), matname, frame @ M(loc, rot))


def beam(p, frame, a, b, w=0.16, d=0.36, y=0.14, col="wood_dark"):
    """Timber in a wall plane from (u, z) a to b; w = face width, d = depth."""
    (u0, z0), (u1, z1) = a, b
    L = math.hypot(u1 - u0, z1 - z0)
    p.add(bm_box(L, d, w), col, frame @ M(((u0 + u1) / 2, y, (z0 + z1) / 2), (0, -deg(math.atan2(z1 - z0, u1 - u0)), 0)))


def wbeam(p, a, b, w, d, col="wood_dark"):
    """World-space timber from point a to b."""
    a, b = Vector(a), Vector(b)
    v = b - a
    rot = v.to_track_quat("X", "Z").to_matrix().to_4x4()
    p.add(bm_box(v.length, w, d), col, Matrix.Translation((a + b) / 2) @ rot)


def arch_shape(uc, w, z0, top, n=8):
    r = w / 2
    return [(uc - r, z0), (uc + r, z0)] + [(uc + r * math.cos(math.pi * k / n), top + r * math.sin(math.pi * k / n))
                                          for k in range(n + 1)]


# ------------------------------------------------------------------ masonry

def blocked(op, zb, zt):
    uc, w, sill, top, arched = op
    if zt <= sill + 1e-4:
        return None
    r = w / 2
    if zb < top - 1e-4:
        hw = r
    elif arched and zb - top < r:
        hw = math.sqrt(r * r - (zb - top) ** 2)
    else:
        return None
    return (uc - hw, uc + hw)


def free(u0, u1, gaps):
    out, cur = [], u0
    for a, b in sorted(gaps):
        if a > cur:
            out.append((cur, min(a, u1)))
        cur = max(cur, b)
    if cur < u1:
        out.append((cur, u1))
    return [(a, b) for a, b in out if b - a > 0.05]


def course_row(p, rnd, frame, u0, u1, zb, zt, ops=(), depth=WALL, lmin=0.6, lmax=1.1, gap=0.035,
               cols=STONES, bevel=0.0, skip=None):
    h = zt - zb
    gaps = [g for g in (blocked(o, zb, zt) for o in ops) if g]
    for a, b in free(u0, u1, gaps):
        u, first = a, True
        while u < b - 1e-4:
            L = rnd.uniform(lmin, lmax) * (rnd.uniform(0.45, 1.0) if first else 1.0)
            if u + L > b - lmin * 0.6:
                L = b - u
            first = False
            out = rnd.uniform(0.0, 0.03)
            m = frame @ M((u + L / 2, depth / 2 - out, zb + h / 2))
            if not (skip and skip(m.translation)):
                p.add(bm_box(L - gap, depth, h - gap, bevel=bevel), rnd.choice(cols), m)
            u += L


def ring_course(p, rnd, r_out, depth, zb, zt, n, offset, cols=STONES, gap=0.035, bevel=0.0, skip=None):
    h = zt - zb
    L = 2 * r_out * math.tan(math.pi / n)
    for k in range(n):
        th = TAU * (k + offset) / n
        loc = P(th, r_out - depth / 2 + rnd.uniform(0.0, 0.025), zb + h / 2)
        if skip and skip(loc):
            continue
        p.add(bm_box(L * rnd.uniform(0.94, 1.0) - gap, depth, h - gap, bevel=bevel), rnd.choice(cols),
              M(loc, (0, 0, deg(th))))


def core_polys(ops, u0, u1, z0, z1):
    """The solid wall between openings as (u, z) polygons (an arched opening must spring at or above z0)."""
    polys, cur = [], u0
    for uc, w, sill, top, arched in sorted(ops):
        a, b, r = uc - w / 2, uc + w / 2, w / 2
        if a - cur > 1e-4:
            polys.append([(cur, z0), (a, z0), (a, z1), (cur, z1)])
        if sill > z0 + 1e-4:
            polys.append([(a, z0), (b, z0), (b, min(sill, z1)), (a, min(sill, z1))])
        if arched and z1 > top:
            pts = [(a, top)] + [(uc + r * math.cos(math.pi * k / 10), top + r * math.sin(math.pi * k / 10))
                                for k in range(9, 0, -1)]
            polys.append(pts + [(b, top), (b, z1), (a, z1)])
        elif not arched and top < z1:
            polys.append([(a, max(top, z0)), (b, max(top, z0)), (b, z1), (a, z1)])
        cur = b
    if u1 - cur > 1e-4:
        polys.append([(cur, z0), (u1, z0), (u1, z1), (cur, z1)])
    return polys


def voussoirs(p, frame, op, t, n, depth, yc, col="stone_light", key=0.05, gap=0.02):
    uc, w, sill, top, arched = op
    r = w / 2
    for k in range(n):
        a0, a1 = math.pi * k / n + gap, math.pi * (k + 1) / n - gap
        kk = key if k == n // 2 else 0.0
        ro = r + t + kk
        pts = [(uc + r * math.cos(a0), top + r * math.sin(a0)), (uc + ro * math.cos(a0), top + ro * math.sin(a0)),
               (uc + ro * math.cos(a1), top + ro * math.sin(a1)), (uc + r * math.cos(a1), top + r * math.sin(a1))]
        p.add(bm_prism(pts, depth + 2 * kk), col, frame @ M((0, yc, 0)))


def jambs(p, frame, op, depth, yc, col="stone_light"):
    uc, w, sill, top, arched = op
    for s in (-1, 1):
        z, k = sill, 0
        while z < top - 0.05:
            h = min(0.52 if k % 2 == 0 else 0.44, top - z)
            jw = 0.28 if (k + (s > 0)) % 2 == 0 else 0.2
            lbox(p, frame, (jw, depth, h - 0.03), (uc + s * (w / 2 + jw / 2), yc, z + h / 2), col)
            z, k = z + h, k + 1


def stone_walls(p, rnd, z0, z1):
    for side, ops in GROUND.items():
        f = F(side)
        u0, u1 = GU[side]
        for poly in core_polys(ops, u0, u1, z0, z1):
            p.add(bm_prism(poly, WALL - 0.1), "stone_dark", f @ M((0, WALL / 2, 0)))
        z = z0
        while z < z1 - 1e-4:
            course_row(p, rnd, f, u0, u1, z, z + COURSE, ops, skip=in_turret)
            z += COURSE


def turret_courses(p, rnd, z0, z1):
    p.add(bm_lathe([(turret_r(z0) - 0.22, z0), (turret_r(z1) - 0.22, z1)], 14), "stone_dark", M((TC.x, TC.y, 0)))
    z = z0
    while z < z1 - 1e-4:
        k = int(round((z - PL) / COURSE))
        ring_course(p, rnd, turret_r(z + COURSE / 2), 0.4, z, z + COURSE, 12, 0.5 * (k % 2), skip=in_main)
        z += COURSE


def turret_window(p, th_deg, sill, top, w):
    th = math.radians(th_deg)
    r = turret_r((sill + top) / 2)
    f = M(P(th, r), (0, 0, th_deg))
    p.add(bm_prism(arch_shape(0, w, sill, top, 6), 0.04), "glass", f @ M((0, -0.06, 0)))
    op = (0.0, w, sill, top, True)
    jambs(p, f, op, 0.16, -0.06)
    voussoirs(p, f, op, 0.17, 5, 0.16, -0.06)
    lbox(p, f, (w + 0.3, 0.22, 0.08), (0, -0.1, sill - 0.04), "stone_light")
    lbox(p, f, (0.035, 0.04, top + w / 2 - sill - 0.03), (0, -0.09, (sill + top + w / 2) / 2), "iron")
    lbox(p, f, (w, 0.04, 0.03), (0, -0.09, top), "iron")


# ------------------------------------------------------------------ windows, books, flowers

def arch_window(p, frame, op, gy, n=6):
    uc, w, sill, top, arched = op
    r, fw, fy = w / 2, 0.07, gy - 0.05
    p.add(bm_prism(arch_shape(uc, w, sill, top, n), 0.04), "glass", frame @ M((0, gy, 0)))
    for s in (-1, 1):
        lbox(p, frame, (fw, 0.08, top - sill), (uc + s * (r - fw / 2), fy, (sill + top) / 2), "wood_dark")
    lbox(p, frame, (w, 0.08, fw), (uc, fy, sill + fw / 2), "wood_dark")
    ring = [(uc + r * math.cos(math.pi * k / n), top + r * math.sin(math.pi * k / n)) for k in range(n + 1)]
    ring += [(uc + (r - fw) * math.cos(math.pi * k / n), top + (r - fw) * math.sin(math.pi * k / n)) for k in range(n, -1, -1)]
    p.add(bm_prism(ring, 0.08), "wood_dark", frame @ M((0, fy, 0)))
    lbox(p, frame, (0.05, 0.06, top + r - 0.04 - sill), (uc, fy, (sill + top + r - 0.04) / 2), "wood_dark")
    z = sill + 0.34
    while z < top + r - 0.12:
        hw = r - fw if z <= top else math.sqrt(max(0.0, r * r - (z - top) ** 2)) - fw * 0.8
        if hw > 0.05:
            lbox(p, frame, (2 * hw, 0.03, 0.025), (uc, fy + 0.015, z), "iron")
        z += 0.34


def rect_window(p, frame, op, gy, shutters=False):
    uc, w, sill, top, _ = op
    h = top - sill
    fy = gy - 0.04
    lbox(p, frame, (w, 0.03, h), (uc, gy, sill + h / 2), "glass")
    for s in (-1, 1):
        lbox(p, frame, (0.06, 0.08, h), (uc + s * (w / 2 - 0.03), fy, sill + h / 2), "wood_mid")
        lbox(p, frame, (w, 0.08, 0.06), (uc, fy, sill + h / 2 + s * (h / 2 - 0.03)), "wood_mid")
    lbox(p, frame, (0.045, 0.06, h), (uc, fy, sill + h / 2), "wood_mid")
    lbox(p, frame, (w, 0.06, 0.045), (uc, fy, sill + h * 0.62), "wood_mid")
    lbox(p, frame, (w + 0.16, 0.16, 0.06), (uc, -0.04, sill - 0.03), "wood_mid")
    if shutters:
        sw = w / 2
        for s in (-1, 1):
            u = uc + s * (w / 2 + sw / 2 + 0.05)
            lbox(p, frame, (sw, 0.05, h + 0.04), (u, -0.08, sill + h / 2), "shutter")
            for zz in (sill + 0.16, top - 0.16):
                lbox(p, frame, (sw - 0.06, 0.02, 0.06), (u, -0.115, zz), "wood_dark")
            beam(p, frame, (u - s * (sw / 2 - 0.05), sill + 0.18), (u + s * (sw / 2 - 0.05), top - 0.18), 0.05, 0.02, -0.115)


def book(p, loc, size, rot, col):
    m = M(loc, rot)
    L, W, T = size
    p.add(bm_box(L, W, T), col, m)
    p.add(bm_box(L - 0.025, W - 0.012, T - 0.016), "parchment", m @ M((0, 0.008, 0)))


def open_book(p, loc, rz, col="book_red"):
    m = M(loc, (0, 0, rz))
    p.add(bm_box(0.4, 0.28, 0.015), col, m @ M((0, 0, 0.0075)))
    for s in (-1, 1):
        p.add(bm_box(0.18, 0.26, 0.03), "parchment", m @ M((s * 0.095, 0, 0.03), (0, -s * 6, 0)))
        for i in range(4):
            p.add(bm_box(0.12, 0.012, 0.004), "ink", m @ M((s * 0.1, -0.08 + i * 0.05, 0.047), (0, -s * 6, 0)))


def flower_box(p, rnd, frame, u, z, w):
    lbox(p, frame, (w, 0.24, 0.18), (u, -0.15, z), "wood_mid", bevel=0.015)
    for s in (-1, 1):
        lbox(p, frame, (0.04, 0.16, 0.04), (u + s * (w / 2 - 0.12), -0.08, z - 0.11), "iron")
    for i in range(5):
        x = u - w / 2 + 0.1 + (w - 0.2) * i / 4
        p.add(jitter(bm_ico(0.09, 0), 0.02, i), rnd.choice(["grass_dark", "leaf_deep"]), frame @ M((x, -0.16, z + 0.11), scale=(1.25, 1, 0.8)), smooth=True)
        p.add(bm_ico(0.045, 0), rnd.choice(["petal_pink", "petal_white", "petal_yellow", "petal_purple"]),
              frame @ M((x + rnd.uniform(-0.04, 0.04), -0.2, z + 0.19)), smooth=True)


GLYPHS = [
    [((0, -1), (0, 1)), ((0, 0.3), (0.8, 0.9)), ((0, -0.2), (0.8, 0.4))],
    [((-0.6, -1), (-0.6, 0.8)), ((-0.6, 0.8), (0.6, 0.3)), ((0.6, 0.3), (0.6, -1))],
    [((-0.5, -1), (-0.5, 1)), ((-0.5, 0.5), (0.4, 0)), ((0.4, 0), (-0.5, -0.5))],
    [((-0.7, -1), (0.7, 1)), ((-0.7, 1), (0.7, -1))],
    [((0, -1), (0, 1)), ((0, 0.2), (-0.7, 0.9)), ((0, 0.2), (0.7, 0.9))],
    [((-0.5, 1), (0.4, 0.3)), ((0.4, 0.3), (-0.4, -0.3)), ((-0.4, -0.3), (0.5, -1))],
    [((0, -1), (0, 1)), ((0, 1), (-0.6, 0.4)), ((0, 1), (0.6, 0.4))],
    [((0, 1), (0.6, 0)), ((0.6, 0), (0, -1)), ((0, -1), (-0.6, 0)), ((-0.6, 0), (0, 1))],
]


# ------------------------------------------------------------------ stages

def stake(p, x, y, flag=False):
    p.box((0.08, 0.08, 0.36), (x, y, 0.18), "wood_light", bevel=0.01)
    p.cyl(0.057, 0.09, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
    if flag:
        p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.44)))


def string(p, a, b, z=0.29):
    (x0, y0), (x1, y1) = a, b
    p.box((math.hypot(x1 - x0, y1 - y0), 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, z), "white",
          rot=(0, 0, deg(math.atan2(y1 - y0, x1 - x0))))


def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes and string for the hall and the turret, the plan."""
    pts = []
    for i in range(44):
        a = TAU * i / 44
        c, s = math.cos(a), math.sin(a)
        k = (abs(c) ** 4 + abs(s) ** 4) ** -0.25 * (1 + rnd.uniform(-0.03, 0.03))
        pts.append((0.0 + 5.45 * c * k, -0.7 + 4.35 * s * k))
    p.add(bm_slab(pts, 0.03), "dirt")
    corners = [(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)]
    for i, (x, y) in enumerate(corners):
        stake(p, x, y, flag=i % 2 == 0)
    for a, b in zip(corners, corners[1:] + corners[:1]):
        string(p, a, b)
    ring = [P(math.radians(th), 1.3) for th in (-80, 0, 60, 120, 170)]
    for i, q in enumerate(ring):
        stake(p, q.x, q.y, flag=i == 2)
    for a, b in zip(ring, ring[1:]):
        string(p, (a.x, a.y), (b.x, b.y), 0.27)
    p.box((0.09, 0.09, 0.22), (TC.x, TC.y, 0.11), "wood_mid", bevel=0.01)
    string(p, (TC.x, TC.y), (ring[1].x, ring[1].y), 0.16)
    # the plan: a hall with a round turret, held down by pebbles
    px, py, pr = -1.0, -4.2, 8
    p.box((0.62, 0.46, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    for dx, dy, sx, sy in ((0, 0.1, 0.34, 0.012), (0, -0.1, 0.34, 0.012), (-0.17, 0, 0.012, 0.2), (0.17, 0, 0.012, 0.2)):
        p.add(bm_box(sx, sy, 0.004), "tunic", base @ M((dx - 0.05, dy, 0)))
    p.add(bm_cyl(0.075, 0.075, 0.004, 10), "tunic", base @ M((0.17, -0.1, 0)))
    p.add(bm_cyl(0.062, 0.062, 0.005, 10), "white", base @ M((0.17, -0.1, 0.001)))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (1.9, -4.35, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.15, 0.24, 0.15), (2.35, -4.58, 0.085), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (1.95, -3.95 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    for i in range(6):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.5, 2.4)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a), 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth for the hall and the round turret, a flagstone floor and the front steps."""
    cols = ["stone_mid", "stone", "stone_mid", "stone_dark", "stone"]
    p.box((7.2, 5.8, 0.38), (0, 0, 0.19), "stone_dark")
    p.cyl(1.42, 0.38, (TC.x, TC.y, 0), "stone_dark", segs=14)
    pu = {"front": 3.65, "back": 3.65, "left": 2.5, "right": 2.5}
    for side in SIDES:
        for zb in (0.0, 0.2):
            course_row(p, rnd, F(side, 0.15), -pu[side], pu[side], zb, zb + 0.2, depth=0.45, lmin=0.8, lmax=1.4,
                       cols=cols, skip=lambda q: in_turret(q, 0.05))
    for k, zb in enumerate((0.0, 0.2)):
        ring_course(p, rnd, 1.52, 0.4, zb, zb + 0.2, 10, 0.5 * k, cols=cols,
                    skip=lambda q: q.x < X1 + 0.1 and q.y > Y0 - 0.1)
    p.box((6.9, 5.5, 0.03), (0, 0, 0.395), "stone_mid")
    p.cyl(1.32, 0.03, (TC.x, TC.y, 0.38), "stone_mid", segs=14)
    for i in range(8):
        p.box((rnd.uniform(0.5, 0.8), rnd.uniform(0.4, 0.6), 0.03), (rnd.uniform(-2.9, 2.9), rnd.uniform(-2.2, 2.2), 0.42),
              rnd.choice(["stone_light", "stone", "stone_light"]), rot=(0, 0, rnd.uniform(-8, 8)))
    p.box((2.1, 0.62, 0.2), (0, -3.26, 0.1), "stone", bevel=0.03)
    p.box((1.8, 0.34, 0.2), (0, -3.12, 0.3), "stone_light", bevel=0.03)
    # stones waiting where the left wall will go
    for i, (y, z) in enumerate(((0.5, 0.52), (1.15, 0.52), (0.8, 0.74))):
        p.box((0.32, 0.55, 0.22), (-3.25, y, z), rnd.choice(STONES), rot=(0, 0, rnd.uniform(-6, 6)), bevel=0.03)


def stage_03(p, rnd, extra):
    """Ysolde's sealed vault turns up in the dig: a carved stone hatch whose runes still glow."""
    cx, cy = VC.x, VC.y
    p.box((1.5, 1.5, 0.03), (cx, cy, 0.03), "soil_dark")
    for k in range(4):
        p.add(bm_box(1.44, 0.3, 0.2, bevel=0.03), "stone_old", M((cx, cy, 0), (0, 0, 90 * k)) @ M((-0.15, -0.72, 0.1)))
        a = math.radians(90 * k + 45)
        p.add(jitter(bm_box(0.2, 0.2, 0.06, bevel=0.02), 0.01, k), "stone_light", M((cx + 0.87 * math.cos(a) * 1.414 * 0.83, cy + 0.87 * math.sin(a) * 1.414 * 0.83, 0.22), (0, 0, 45)))
    hatch, runes = Part("vault_hatch"), Part("vault_runes")
    hatch.add(bm_cyl(0.6, 0.6, 0.13, 18, bevel=0.025), "stone_old", M((cx, cy, 0.03)))
    hatch.add(bm_cyl(0.42, 0.4, 0.035, 18), "stone_old", M((cx, cy, 0.16)))
    for k in range(16):
        a = TAU * k / 16
        cell = M((cx + 0.515 * math.cos(a), cy + 0.515 * math.sin(a), 0.163), (0, 0, deg(a) + 90))
        for (x0, y0), (x1, y1) in GLYPHS[(k * 3 + rnd.randrange(2)) % len(GLYPHS)]:
            x0, y0, x1, y1 = x0 * 0.03, y0 * 0.04, x1 * 0.03, y1 * 0.04
            L = math.hypot(x1 - x0, y1 - y0)
            runes.add(bm_box(L + 0.014, 0.014, 0.012), "glow",
                      cell @ M(((x0 + x1) / 2, (y0 + y1) / 2, 0), (0, 0, deg(math.atan2(y1 - y0, x1 - x0)))))
    # central sigil: a coiled serpent inside a ring
    circ = [(cx + 0.34 * math.cos(TAU * i / 24), cy + 0.34 * math.sin(TAU * i / 24), 0.197) for i in range(25)]
    runes.add(bm_tube(circ, 0.011, 4), "glow")
    spiral = []
    for i in range(30):
        t = i / 29
        a, r = 2.1 * TAU * t, 0.25 - 0.2 * t
        spiral.append((cx + r * math.cos(a), cy + r * math.sin(a), 0.199))
    runes.add(bm_tube(spiral, 0.015, 4), "glow")
    runes.add(bm_ico(0.032, 1), "glow", M((cx + 0.25, cy, 0.2)))
    extra.append((hatch, HINGE))
    extra.append((runes, HINGE))
    # moss on the kerb, dug earth, tools and a marker flag
    for i in range(6):
        a = rnd.uniform(0, TAU)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.1), 0), 0.015, i), "moss", M((cx + 0.75 * math.cos(a), cy + 0.75 * math.sin(a), 0.2), scale=(1.3, 1, 0.4)), smooth=True)
    heaps = [(cx - 0.6, cy + 1.05, 0.4)]
    for i, (x, y, r) in enumerate(heaps):
        dome = bm_lathe([(r * 1.2, 0.0), (r * 0.95, 0.1), (r * 0.55, 0.2), (0.0, 0.24)], 9, cap_bottom=False)
        p.add(jitter(dome, 0.04, 70 + i, keep_bottom=0.0), "soil", M((x, y, 0.0), (0, 0, 20 * i), (1.25, 1.0, 1.0)), smooth=True)
    x, y, _ = heaps[0]
    p.add(bm_tube([(x + 0.05, y, 0.15), (x + 0.32, y - 0.2, 1.05)], 0.025, 6), "wood_light")
    p.box((0.2, 0.03, 0.26), (x + 0.02, y + 0.01, 0.12), "iron", rot=(0, 15, -35))
    p.cyl(0.024, 0.75, (cx + 0.7, cy - 1.0, 0.03), "wood_light", segs=6, rot=(0, 90, 60))
    p.box((0.5, 0.06, 0.06), (cx + 0.9, cy - 0.65, 0.05), "iron", rot=(0, 0, -30))
    for i in range(3):
        p.box((0.55, 0.45, 0.07), (cx + 1.25, cy + 0.15, 0.035 + 0.07 * i), rnd.choice(["stone", "stone_light"]),
              rot=(0, 0, rnd.uniform(-12, 12)), bevel=0.02)
    p.cyl(0.018, 0.75, (cx - 0.9, cy - 0.8, 0), "wood_light", segs=5)
    p.add(bm_prism([(0, 0), (0.22, -0.05), (0, -0.12)], 0.015), "cloth", M((cx - 0.88, cy - 0.8, 0.74)))


def stage_04(p, rnd, extra):
    """Ground-floor stone walls up to 2 m (door and window gaps), the lower turret, spare stones."""
    stone_walls(p, rnd, PL, 2.0)
    turret_courses(p, rnd, PL, 2.0)
    x, y = -4.25, 1.7
    for i in range(6):
        p.add(jitter(bm_box(0.45, 0.3, 0.22, bevel=0.025), 0.02, 90 + i), rnd.choice(STONES),
              M((x + (i % 3) * 0.42 - 0.4 + 0.1 * (i // 3), y + 0.05 * (i % 2), 0.12 + 0.23 * (i // 3)), (0, 0, 90 + rnd.uniform(-8, 8))))
    p.cyl(0.3, 0.26, (-4.3, 0.55, 0.03), "wood_mid", r2=0.34, segs=10)
    p.cyl(0.31, 0.03, (-4.3, 0.55, 0.26), "plaster_shade", segs=10)
    p.box((0.1, 0.16, 0.015), (-4.2, 0.6, 0.31), "iron", rot=(0, 20, 30))
    p.cyl(0.015, 0.14, (-4.2, 0.66, 0.31), "wood_light", segs=5, rot=(-60, 0, 30))


def stage_05(p, rnd, extra):
    """Walls up to 3.6 m with stone arches over the tall windows and door, quoins, the turret to match."""
    stone_walls(p, rnd, 2.0, GF)
    turret_courses(p, rnd, 2.0, GF)
    for side, ops in GROUND.items():
        f = F(side)
        for op in ops:
            door = op is DOOR
            voussoirs(p, f, op, 0.35 if door else 0.3, 9 if door else 7, WALL + 0.06, WALL / 2)
            jambs(p, f, op, WALL + 0.04, WALL / 2)
    for sx, sy in ((-1, -1), (-1, 1), (1, 1)):
        for i in range(8):
            z = PL + i * COURSE + COURSE / 2
            lx, ly = (0.62, 0.38) if i % 2 == 0 else (0.38, 0.62)
            p.box((lx, ly, COURSE - 0.035), (sx * (3.53 - lx / 2), sy * (2.83 - ly / 2), z), "stone_light")
    for x in (X0 - 0.03, X1 + 0.03):
        p.box((0.16, 5.9, 0.14), (x, 0, 3.51), "stone_light", bevel=0.02)
    for th, sill, top, w, st in TWIN:
        if st == 5:
            turret_window(p, th, sill, top, w)


def stage_06(p, rnd, extra):
    """The book turret rises to 6.4 m and gets a corbelled stone crown."""
    turret_courses(p, rnd, GF, TTOP)
    p.cyl(TR1 + 0.16, 0.16, (TC.x, TC.y, TTOP - 0.16), "stone_light", segs=14)
    for k in range(13):
        th = TAU * (k + 0.25) / 13
        q = P(th, TR1 + 0.04, TTOP - 0.3)
        if not in_main(q):
            p.add(bm_box(0.18, 0.24, 0.2, bevel=0.02), "stone_light", M(q, (0, 0, deg(th))))
    for th, sill, top, w, st in TWIN:
        if st == 6:
            turret_window(p, th, sill, top, w)


def stage_07(p, rnd, extra):
    """Upper floor: the deck, jetty joists, and the oak frame of the timber storey and front dormer."""
    p.box((7.0, 6.04, 0.1), (0, 0, 3.65), "wood_mid")
    for sy in (-1, 1):
        x = -3.3
        while x < 3.35:
            if not (sy < 0 and x > 2.3):
                p.box((0.14, 0.26, 0.13), (x, sy * 2.92, 3.53), "wood_dark")
            x += 0.44
        for sx in (-1, 1):
            if not (sx > 0 and sy < 0):
                wbeam(p, (sx * 3.36, sy * 2.82, 2.95), (sx * 3.36, sy * 2.98, 3.5), 0.12, 0.14)
    for side, secs in UPPER.items():
        f = F(side, UOFF[side])
        for u0, u1, zt, ops in secs:
            zb = Z_UP
            beam(p, f, (u0, zb + 0.09), (u1, zb + 0.09), 0.18, 0.4, 0.12)
            beam(p, f, (u0, zt - 0.09), (u1, zt - 0.09), 0.18, 0.4, 0.12)
            posts = {round(u0 + 0.08, 3), round(u1 - 0.08, 3)}
            for uc, w, sill, top, arched in ops:
                posts |= {round(uc - w / 2 - 0.08, 3), round(uc + w / 2 + 0.08, 3)}
            posts = sorted(posts)
            out = [posts[0]]
            for a, b in zip(posts, posts[1:]):
                if b - a > 1.7 and not any(a < o[0] < b for o in ops):
                    out.append((a + b) / 2)
                out.append(b)
            for u in out:
                beam(p, f, (u, zb + 0.18), (u, zt - 0.18), 0.16, 0.36)
            for i, (a, b) in enumerate(zip(out, out[1:])):
                op = next((o for o in ops if a < o[0] < b), None)
                if op:
                    uc, w, sill, top, arched = op
                    head = top + (w / 2 if arched else 0) + 0.08
                    beam(p, f, (a, sill - 0.08), (b, sill - 0.08), 0.14, 0.34)
                    beam(p, f, (a, head), (b, head), 0.14, 0.34)
                    beam(p, f, (a, zb + 0.18), (uc, sill - 0.15), 0.12, 0.32)
                    beam(p, f, (b, zb + 0.18), (uc, sill - 0.15), 0.12, 0.32)
                elif b - a > 0.35:
                    zm = (zb + UF) / 2
                    beam(p, f, (a, zm), (b, zm), 0.14, 0.34)
                    if b - a > 0.45:
                        lo, hi = (a, b) if i % 2 == 0 else (b, a)
                        beam(p, f, (lo, zb + 0.18), (hi, zm - 0.07), 0.12, 0.32)
                        beam(p, f, (hi, zm + 0.07), (lo, zt - 0.18), 0.12, 0.32)
    # spare beams stacked by the right wall
    for i in range(5):
        p.box((0.16, 2.0, 0.16), (4.05 + (i % 3) * 0.18 + 0.09 * (i // 3), 1.6, 0.1 + 0.17 * (i // 3)), "wood_light", rot=(0, 0, rnd.uniform(-2, 2)))


def stage_08(p, rnd, extra):
    """Plaster infill between the timbers, the gable ends with round windows, the dormer gable."""
    for side, secs in UPPER.items():
        f = F(side, UOFF[side])
        for u0, u1, zt, ops in secs:
            for poly in core_polys(ops, u0, u1, Z_UP, zt):
                p.add(bm_prism(poly, UW), "plaster", f @ M((0, UW / 2, 0)))
    for side in ("left", "right"):
        f = F(side)
        p.add(bm_prism([(-3.02, UF), (3.02, UF), (0, RIDGE - 0.08)], UW), "plaster_shade", f @ M((0, UW / 2, 0)))
        wz = 7.4
        beam(p, f, (-3.0, UF + 0.08), (3.0, UF + 0.08), 0.16, 0.36)
        for s in (-1, 1):
            beam(p, f, (s * 2.9, UF + 0.12), (0, RIDGE - 0.2), 0.16, 0.36)
            beam(p, f, (s * 1.6, UF + 0.16), (s * 0.3, wz - 0.32), 0.12, 0.32)
        beam(p, f, (0, UF + 0.16), (0, wz - 0.4), 0.14, 0.34)
        beam(p, f, (0, wz + 0.4), (0, RIDGE - 0.35), 0.14, 0.34)
        p.add(bm_cyl(0.42, 0.42, 0.1, 14), "wood_dark", f @ M((0, 0.05, wz), (90, 0, 0)))
        p.add(bm_cyl(0.32, 0.32, 0.02, 14), "glass", f @ M((0, -0.05, wz), (90, 0, 0)))
        for a in (0, 90):
            lbox(p, f, (0.64, 0.03, 0.035), (0, -0.075, wz), "iron", rot=(0, a, 0))
    f = F("front", J)
    p.add(bm_prism([(-1.3, DZ), (1.3, DZ), (0, DR - 0.06)], UW), "plaster_shade", f @ M((0, UW / 2, 0)))
    beam(p, f, (-1.3, DZ + 0.08), (1.3, DZ + 0.08), 0.16, 0.36)
    beam(p, f, (0, DZ + 0.16), (0, DR - 0.25), 0.14, 0.34)
    for s in (-1, 1):
        beam(p, f, (s * 1.2, DZ + 0.12), (0, DR - 0.12), 0.14, 0.34)
        p.box((0.3, 1.12, 1.0), (s * 1.15, -2.46, 6.5), "plaster")


def stage_09(p, rnd, extra):
    """Glazing: tall arched leaded windows below, framed and shuttered windows above."""
    for side, ops in GROUND.items():
        f = F(side)
        for op in ops:
            if op is DOOR:
                continue
            arch_window(p, f, op, 0.3)
            uc, w, sill, top, _ = op
            lbox(p, f, (w + 0.24, 0.26, 0.1), (uc, -0.08, sill - 0.05), "stone_light")
    for side, secs in UPPER.items():
        f = F(side, UOFF[side])
        for u0, u1, zt, ops in secs:
            for op in ops:
                if op[4]:
                    arch_window(p, f, op, 0.18)
                    lbox(p, f, (op[1] + 0.2, 0.18, 0.07), (op[0], -0.04, op[2] - 0.035), "wood_mid")
                else:
                    rect_window(p, f, op, 0.18, shutters=not (side == "front" and op[0] > 0))


def stage_10(p, rnd, extra):
    """The arched double door with iron straps and ring pulls, under a carved open-book plaque."""
    f = F("front")
    uc, w, sill, top, _ = DOOR
    r = w / 2
    for s in (-1, 1):
        pts = [(0, sill), (s * (r - 0.01), sill), (s * (r - 0.01), top)]
        pts += [(s * (r - 0.01) * math.cos(math.pi / 2 * k / 6), top + (r - 0.01) * math.sin(math.pi / 2 * k / 6)) for k in range(1, 7)]
        p.add(bm_prism(pts, 0.08), "wood_mid", f @ M((s * 0.008, 0.3, 0)))
        for u in (0.16, 0.33, 0.5):
            hgt = top + math.sqrt(max(0.0, r * r - u * u)) - sill - 0.03
            lbox(p, f, (0.018, 0.02, hgt), (s * u, 0.255, sill + hgt / 2), "wood_dark")
        for z in (0.85, 1.8):
            lbox(p, f, (r - 0.08, 0.025, 0.08), (s * (r / 2 + 0.01), 0.25, z), "iron")
            lbox(p, f, (0.05, 0.03, 0.05), (s * 0.1, 0.24, z), "iron")
        ring = [(s * 0.13 + 0.07 * math.sin(TAU * i / 10), 0.235, 1.25 - 0.07 * math.cos(TAU * i / 10)) for i in range(11)]
        p.add(bm_tube(ring, 0.012, 4), "iron", f)
        lbox(p, f, (0.05, 0.03, 0.05), (s * 0.13, 0.245, 1.32), "iron")
    lbox(p, f, (w + 0.1, 0.5, 0.05), (0, 0.25, sill + 0.025), "stone_light")
    lbox(p, f, (1.0, 0.12, 0.38), (0, -0.04, 3.27), "stone_mid", bevel=0.02)
    for s in (-1, 1):
        lbox(p, f, (0.3, 0.05, 0.22), (s * 0.16, -0.12, 3.27), "stone_light", rot=(0, s * 10, 0))
    lbox(p, f, (0.04, 0.06, 0.24), (0, -0.12, 3.25), "stone_light")


def roof_plane(p, rnd, frame, x0, x1, alpha, ls, tmax, n, under="slate_dark"):
    """Courses of chunky slates on one slope: ridge along local x at the frame origin, falling toward -y."""
    ca, sa = math.cos(alpha), math.sin(alpha)

    def at(t, off):
        return Vector(((x0 + x1) / 2, -t * ca - off * sa, -t * sa + off * ca))

    tm = min(tmax, ls)
    p.add(bm_box(x1 - x0, tm, 0.12), under, frame @ M(at(tm / 2, 0.06), (deg(alpha), 0, 0)))
    step = ls / n
    for i in range(n):
        tc = (i + 0.5) * step + 0.05
        if tc - step / 2 > tm:
            break
        c = at(tc, 0.17)
        x = x0
        while x < x1 - 1e-3:
            seg = rnd.uniform(0.8, 1.6)
            if x + seg > x1 - 0.45:
                seg = x1 - x
            p.add(jitter(bm_box(seg - 0.03, step + 0.14, 0.08), 0.012, rnd.randrange(9999)), rnd.choice(SLATES),
                  frame @ M((x + seg / 2, c.y, c.z), (deg(alpha) - 6, 0, 0)))
            x += seg


def stage_11(p, rnd, extra):
    """The steep slate roof with the front dormer, bargeboards, ridge tiles and the chimney."""
    front, back = M((0, 0, RIDGE)), M((0, 0, RIDGE), (0, 0, 180))
    tmid = 1.0 / math.cos(ALPHA)
    for x0, x1, tm in ((-3.9, -1.3, LS), (-1.3, 1.3, tmid), (1.3, 3.9, LS)):
        roof_plane(p, rnd, front, x0, x1, ALPHA, LS, tm, 8)
    roof_plane(p, rnd, back, -3.9, 3.9, ALPHA, LS, LS, 8)
    ca, sa = math.cos(ALPHA), math.sin(ALPHA)
    for fr in (front, back):
        for x in (-3.93, 3.93):
            p.add(bm_box(0.08, LS + 0.1, 0.3), "wood_dark", fr @ M((x, -LS / 2 * ca - 0.07 * sa, -LS / 2 * sa + 0.07 * ca), (deg(ALPHA), 0, 0)))
    p.cyl(0.17, 7.96, (-3.98, 0, RIDGE + 0.2), "slate_dark", segs=6, rot=(0, 90, 0))
    for x in (-3.98, 3.98):
        p.cyl(0.07, 0.45, (x, 0, RIDGE + 0.2), "wood_dark", segs=6)
        p.ball(0.08, (x, 0, RIDGE + 0.68), "wood_dark", subdiv=1)
    a = math.radians(45)
    for sg in (1, -1):
        fr = M((0, DYC, DR), (0, 0, 90 * sg))
        roof_plane(p, rnd, fr, -DLEN / 2, DLEN / 2, a, DLS, DLS, 4)
        p.add(bm_box(0.08, DLS + 0.1, 0.26), "wood_dark",
              fr @ M((-sg * (DLEN / 2 + 0.03), -DLS / 2 * math.cos(a) - 0.07 * math.sin(a), -DLS / 2 * math.sin(a) + 0.07 * math.cos(a)), (45, 0, 0)))
    p.cyl(0.13, 2.95, (0, -0.58, DR + 0.17), "slate_dark", segs=6, rot=(90, 0, 0))
    p.cyl(0.06, 0.4, (0, -3.5, DR + 0.15), "wood_dark", segs=6)
    p.ball(0.07, (0, -3.5, DR + 0.6), "wood_dark", subdiv=1)
    # chimney on the back slope
    cx, cy = -2.2, 1.55
    p.box((0.74, 0.64, 3.0), (cx, cy, 8.0), "stone_dark")
    z = 6.6
    while z < 9.45:
        p.add(jitter(bm_box(0.82, 0.72, 0.35), 0.015, int(z * 10)), rnd.choice(STONES), M((cx, cy, z + 0.19)))
        z += 0.38
    p.box((1.0, 0.9, 0.12), (cx, cy, 9.62), "stone_light", bevel=0.02)
    p.cyl(0.16, 0.3, (cx, cy, 9.68), "roof", r2=0.13, segs=8)
    extra.append(("empty", "smoke", (cx, cy, 10.05)))


def stage_12(p, rnd, extra):
    """The turret's book room: a timber drum with little windows and a tall slate cone with a pennant."""
    zb, zt = TTOP, TROOM
    p.cyl(1.36, 0.12, (TC.x, TC.y, zb), "wood_dark", segs=14)
    p.cyl(1.27, zt - zb, (TC.x, TC.y, zb), "plaster", segs=14)
    p.cyl(1.37, 0.14, (TC.x, TC.y, zt - 0.14), "wood_dark", segs=14)
    for k in range(8):
        th = TAU * (k + 0.5) / 8
        q = P(th, 1.28, (zb + zt) / 2)
        if not in_main(q):
            p.add(bm_box(0.14, 0.12, zt - zb - 0.2), "wood_dark", M(q, (0, 0, deg(th))))
    for th_deg in (0, 45, 90, 135):
        th = math.radians(th_deg)
        f = M(P(th, 1.3), (0, 0, th_deg))
        op = (0.0, 0.36, zb + 0.3, zb + 0.82, True)
        p.add(bm_prism(arch_shape(0, 0.36, op[2], op[3], 6), 0.03), "glass", f @ M((0, -0.01, 0)))
        ring = [(0.21 * math.cos(math.pi * k / 6), op[3] + 0.21 * math.sin(math.pi * k / 6)) for k in range(7)]
        ring += [(0.17 * math.cos(math.pi * k / 6), op[3] + 0.17 * math.sin(math.pi * k / 6)) for k in range(6, -1, -1)]
        p.add(bm_prism(ring, 0.06), "wood_mid", f @ M((0, -0.03, 0)))
        for s in (-1, 1):
            lbox(p, f, (0.05, 0.06, op[3] - op[2]), (s * 0.19, -0.03, (op[2] + op[3]) / 2), "wood_mid")
        lbox(p, f, (0.5, 0.14, 0.05), (0, -0.05, op[2] - 0.02), "wood_mid")
        lbox(p, f, (0.03, 0.03, op[3] + 0.18 - op[2]), (0, -0.045, (op[2] + op[3] + 0.18) / 2), "wood_dark")
    prof = [(1.8, 7.58), (1.47, 7.95), (1.16, 8.36), (0.87, 8.78), (0.59, 9.2), (0.32, 9.6), (0.0, 9.98)]
    for i, ((r0, z0), (r1, z1)) in enumerate(zip(prof, prof[1:])):
        bm = bm_lathe([(r0 + 0.05, z0 - 0.07), (r1, z1 + 0.05)], 16, cap_bottom=i == 0, cap_top=False)
        p.add(jitter(bm, 0.012, 300 + i), SLATES[i % 3], M((TC.x, TC.y, 0)))
    p.cyl(0.03, 0.55, (TC.x, TC.y, 9.9), "iron", segs=6)
    p.ball(0.06, (TC.x, TC.y, 10.17), "iron", subdiv=1)
    p.add(bm_prism([(0, 0), (0.34, -0.07), (0, -0.16)], 0.015), "cloth", M((TC.x + 0.02, TC.y, 10.43)))


def stage_13(p, rnd, extra):
    """Reading bench with books, a crate of books, flower boxes, potted plants and ivy on the turret."""
    bx, by = -2.15, -3.42
    p.box((1.55, 0.42, 0.08), (bx, by, 0.46), "wood_light", bevel=0.015)
    for s in (-1, 1):
        p.box((0.09, 0.36, 0.42), (bx + s * 0.6, by, 0.21), "wood_mid", bevel=0.01)
    p.box((1.2, 0.06, 0.08), (bx, by, 0.15), "wood_mid")
    open_book(p, (bx - 0.42, by, 0.5), 8)
    p.box((0.42, 0.34, 0.07), (bx + 0.05, by, 0.535), "mustard", bevel=0.03)
    for i in range(3):
        book(p, (bx + 0.52, by + 0.02, 0.52 + 0.045 * i), (0.3 - 0.03 * i, 0.22, 0.045), (0, 0, rnd.uniform(-12, 12)), BOOKS[i])
    p.cyl(0.04, 0.07, (bx + 0.25, by + 0.12, 0.5), "ink", segs=8)
    p.add(bm_tube([(bx + 0.25, by + 0.12, 0.55), (bx + 0.3, by + 0.16, 0.78)], [0.006, 0.02], 4), "white")
    # crate of books by the steps
    cx, cy = 1.6, -3.45
    p.box((0.7, 0.45, 0.04), (cx, cy, 0.02), "wood_mid")
    for s in (-1, 1):
        p.box((0.7, 0.04, 0.34), (cx, cy + s * 0.205, 0.19), "wood_mid", bevel=0.01)
        p.box((0.04, 0.37, 0.34), (cx + s * 0.33, cy, 0.19), "wood_light", bevel=0.01)
    x = cx - 0.27
    for i in range(8):
        t, h = rnd.uniform(0.05, 0.08), rnd.uniform(0.26, 0.34)
        book(p, (x + t / 2, cy, 0.04 + h / 2), (t, 0.26, h), (0, rnd.uniform(-8, 8), 90), BOOKS[i % 5])
        x += t + 0.005
    # potted plants on the step, flower boxes under the front windows
    for s in (-1, 1):
        x, y = s * 0.86, -3.43
        p.cyl(0.13, 0.26, (x, y, 0.2), "roof", r2=0.16, segs=10)
        p.cyl(0.13, 0.03, (x, y, 0.44), "soil", segs=10)
        p.ball(0.2, (x, y, 0.62), "grass_dark", scale=(1, 1, 1.15), subdiv=1)
        for k in range(3):
            a = TAU * k / 3 + s
            p.ball(0.04, (x + 0.15 * math.cos(a), y + 0.15 * math.sin(a), 0.7), "petal_white", subdiv=0)
    f = F("front")
    for u in (-1.85, 1.85):
        flower_box(p, rnd, f, u, 0.98, 1.0)
    # ivy: two meandering vines with leaf clusters on the turret's front-left face
    for v, (th0, z_top) in enumerate(((-42, 3.9), (-18, 2.6))):
        th, z, path = th0, 0.45, []
        while z < z_top:
            path.append((th, z))
            th += rnd.uniform(-7, 7)
            z += rnd.uniform(0.2, 0.3)
        stem = [P(math.radians(t), turret_r(zz) + 0.03, zz) for t, zz in path]
        p.add(bm_tube(stem, 0.018, 3), "wood_mid")
        for j, (t, zz) in enumerate(path):
            for _ in range(2 if j % 2 else 1):
                tt = t + rnd.uniform(-9, 9)
                q = P(math.radians(tt), turret_r(zz) + 0.06, zz + rnd.uniform(-0.1, 0.1))
                p.add(jitter(bm_ico(rnd.uniform(0.09, 0.15), 0), 0.02, rnd.randrange(999)), rnd.choice(["grass_dark", "leaf_deep", "grass"]),
                      M(q, (rnd.uniform(-30, 30), 0, tt), (1.3, 0.45, 1.0)), smooth=True)


def stage_14(p, rnd, extra):
    """Lanterns by the door, the hanging sign (open book and quill), and a rope and lantern round the vault."""
    f = F("front")
    for s in (-1, 1):
        u = s * 1.07
        lbox(p, f, (0.13, 0.08, 0.24), (u, -0.04, 2.25), "wood_dark")
        p.add(bm_tube([(u, -2.84, 2.25), (u, -3.12, 2.25), (u, -3.2, 2.17)], 0.025, 6), "iron")
        add_lantern(p, (u, -3.2, 2.17 - 0.69), 1.2, hang=True)
    # hanging sign on an iron bracket off the front-left corner
    sx = -3.15
    p.box((0.12, 0.06, 0.5), (sx, Y0 - 0.06, 2.95), "iron")
    p.add(bm_tube([(sx, Y0 - 0.06, 3.15), (sx, -3.98, 3.15)], 0.025, 6), "iron")
    p.add(bm_tube([(sx, Y0 - 0.06, 2.75), (sx, -3.5, 3.15)], 0.02, 6), "iron")
    for y in (-3.3, -3.8):
        for i in range(2):
            p.box((0.018, 0.045 if i % 2 else 0.018, 0.07), (sx, y, 3.1 - i * 0.065), "iron")
    S = M((sx, -3.55, 2.75), (0, 0, -90))
    w, h, rr = 0.8, 0.55, 0.08
    pts = []
    for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for k in range(4):
            a = math.radians(a0 + 30 * k)
            pts.append((cxs * (w / 2 - rr) + rr * math.cos(a), czs * (h / 2 - rr) + rr * math.sin(a)))
    p.add(bm_prism(pts, 0.06), "wood_dark", S @ M(scale=(1.12, 1, 1.14)))
    p.add(bm_prism(pts, 0.09), "wood_light", S)
    for side in (-1, 1):
        art = S @ M((0, side * 0.065, 0), (0, 0, 0 if side < 0 else 180))
        for s in (-1, 1):
            p.add(bm_box(0.22, 0.02, 0.26), "parchment", art @ M((s * 0.115, 0, -0.02), (0, s * 12, 0)))
            p.add(bm_box(0.24, 0.015, 0.28), "book_red", art @ M((s * 0.12, 0.012, -0.03), (0, s * 12, 0)))
            for i in range(3):
                p.add(bm_box(0.13, 0.012, 0.01), "ink", art @ M((s * 0.11, -0.012, 0.04 - i * 0.05 + s * 0.012 * (1 - i)), (0, s * 12, 0)))
        p.add(bm_tube([(0.02, -0.02, 0.02), (0.18, -0.03, 0.24)], [0.008, 0.035], 4), "white", art)
    # round the vault: stone posts with a rope, and a lantern post at the front corner
    cx, cy = VC.x, VC.y
    cs = [(cx - 0.95, cy - 0.95), (cx + 0.95, cy - 0.95), (cx + 0.95, cy + 0.95), (cx - 0.95, cy + 0.95)]
    for i, (x, y) in enumerate(cs):
        if i == 3:
            p.box((0.13, 0.13, 1.55), (x, y, 0.775), "wood_mid", bevel=0.015)
            p.box((0.42, 0.07, 0.07), (x + 0.19, y, 1.48), "wood_mid")
            p.box((0.03, 0.03, 0.08), (x + 0.36, y, 1.41), "iron")
            add_lantern(p, (x + 0.36, y, 1.37 - 0.58), 1.0, hang=True)
        else:
            p.cyl(0.09, 0.5, (x, y, 0), "stone_mid", r2=0.075, segs=6)
            p.ball(0.085, (x, y, 0.52), "stone_light", subdiv=1)
    for (xa, ya), (xb, yb) in zip(cs, cs[1:] + cs[:1]):
        pts = [(xa + (xb - xa) * t / 6, ya + (yb - ya) * t / 6, 0.45 - 0.12 * math.sin(math.pi * t / 6)) for t in range(7)]
        p.add(bm_tube(pts, 0.018, 4), "straw_dark")


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
        fn(part, random.Random(4000 + i), extra)
        objs = []
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for item in extra:
            if isinstance(item[0], str):
                common.empty(item[1], model, parent=node, loc=item[2])
            else:
                objs.append(item[0].to_object(model, parent=node, origin=item[1]))
        stages.append((node, objs))
    return stages


def want(k):
    return "all" in MODE or str(k) in MODE


def main():
    stages = build()
    bpy = common.bpy
    bpy.context.view_layer.update()
    hatch, runes = bpy.data.objects["vault_hatch"], bpy.data.objects["vault_runes"]
    runes.parent = hatch
    runes.location = (0, 0, 0)
    bpy.context.view_layer.update()
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)   # meadow occludes the bake
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("library.glb")
    common.preview_materials()
    for k in range(1, len(stages) + 1):
        if not want(k):
            continue
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
        common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=7.0)
        common.render(os.path.join(common.OUT_PREV, "library_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    if "all" in MODE or "final" in MODE:
        common.preview_rig(meshes, azim=-34, elev=12, lens=40, margin=0.92)
        common.render(os.path.join(common.OUT_PREV, "library.png"))
    common.save_blend("library")
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(q[i] for q in pts) for i in range(3)]
    hi = [max(q[i] for q in pts) for i in range(3)]
    print("TRIS", counts, "TOTAL", sum(counts.values()))
    print("BBOX lo", [round(v, 2) for v in lo], "hi", [round(v, 2) for v in hi])
    print("NODES", sorted(o.name for o in bpy.data.objects if o.parent is None and o.name.startswith("stage")))
    print("SPECIAL", [(o.name, o.parent.name, tuple(round(v, 3) for v in o.matrix_world.translation))
                      for o in bpy.data.objects if o.name in ("vault_hatch", "vault_runes", "smoke")])
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
