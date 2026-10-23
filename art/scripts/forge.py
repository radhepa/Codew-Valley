"""The Forge: Ingrid's stone smithy with an open gable front, in 15 cumulative stages
(stage_01 .. stage_15). See art/specs/forge.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Set RENDER_STAGES = False to skip the 15 stage renders while iterating.

Layout: the smithy is 6 m wide (x -3..3) and 4.6 m deep (y -2.3..2.3), ridge along Y, open to
the front (-Y) under a big timber lintel. Hearth, hood and chimney at the back, a charcoal
lean-to on the -X side, a yard with a grindstone, bench and tool rack on the +X side.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
import bmesh
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", True)
TAU = 2 * math.pi

# extra colours for this model (runtime only, common.py stays untouched)
common.PALETTE.update({
    "coal": "#34302D", "soot": "#5A544D", "water": "#5E8A8F", "leather": "#7C5739",
    "iron_light": "#6F6B66", "vane": "#6B2C35", "paper": "#E8DCC0", "tile_moss": "#857A55",
    "sack_dark": "#8C7D63",
})

# ------------------------------------------------------------------ dimensions
X1, Y1 = 3.0, 2.3            # outer half width, half depth of the smithy walls
WALL_T = 0.45
FLOOR = 0.3                  # plinth top / floor level
EAVE = 3.1                   # top of the side walls
PITCH = 0.8                  # roof rise per run
RIDGE = EAVE + X1 * PITCH    # 5.5, rafter centreline at the ridge
EAVE_X = 3.45                # side overhang
ROOF_Y0, ROOF_Y1 = -3.0, 2.75
A_DEG = math.degrees(math.atan(PITCH))
STONES = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid", "stone_warm"]

HEARTH = (-1.5, 0.3, 0.95, 1.85)          # x0, x1, y0, y1
HEARTH_C = (-0.6, 1.36)                   # firepot centre
FLUE = (-1.1, -0.1, 1.3, 2.35)            # chimney stack x0, x1, y0, y1
CHIM_TOP = 6.7
BX = -2.05                                # bellows centre line
PIVOT = Vector((BX, 0.75, 2.3))           # bellows_lever fulcrum
SIGN_PIVOT = Vector((3.55, -2.08, 2.66))


def make_courses(z0, z1, n, seed):
    rnd = random.Random(seed)
    h = (z1 - z0) / n
    zs = [z0] + [z0 + h * i + rnd.uniform(-0.03, 0.03) for i in range(1, n)] + [z1]
    return list(zip(zs, zs[1:]))


WALL_COURSES = make_courses(FLOOR, EAVE, 9, 61)
GABLE_COURSES = make_courses(EAVE, RIDGE - 0.15, 7, 62)
CHIM_COURSES = make_courses(2.95, CHIM_TOP, 12, 63)
LINTEL_Z = WALL_COURSES[7][1]             # top of the piers = underside of the lintel
WIN = (-0.15, 0.75, WALL_COURSES[4][0], WALL_COURSES[6][1])   # right wall window: y0, y1, z0, z1


def roof_z(x):
    """Rafter centreline height at x."""
    return RIDGE - PITCH * abs(x)


# ------------------------------------------------------------------ helpers

def beam(p, a, b, w, h, matname, jit=0.0, seed=0):
    """Box from point a to point b; w across (horizontal), h the other way."""
    a, b = Vector(a), Vector(b)
    d = b - a
    L = d.length
    x = d / L
    ref = Vector((0, 0, 1)) if abs(x.z) < 0.95 else Vector((0, 1, 0))
    y = ref.cross(x).normalized()
    z = x.cross(y)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = (a + b) / 2
    bm = bm_box(L, w, h)
    if jit:
        jitter(bm, jit, seed)
    p.add(bm, matname, m)


def rod(p, a, b, r, matname, segs=6):
    p.add(bm_tube([a, b], r, segs), matname)


def frustum(bot, top):
    """Closed box with a rectangular bottom (x0, x1, y0, y1, z) and top rectangle."""
    bm = bmesh.new()
    def ring(r):
        x0, x1, y0, y1, z = r
        return [bm.verts.new(c) for c in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    a, b = ring(bot), ring(top)
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def slab_z(pts, zfun, h):
    """Polygon [(x, y), ...] whose underside follows zfun(x, y), h thick."""
    bm = bmesh.new()
    bot = [bm.verts.new((x, y, zfun(x, y))) for x, y in pts]
    top = [bm.verts.new((x, y, zfun(x, y) + h)) for x, y in pts]
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def blob(cx, cy, rx, ry, n=16, wob=0.06, rnd=None):
    rnd = rnd or random.Random(1)
    return [(cx + rx * math.cos(TAU * i / n) * (1 + rnd.uniform(-wob, wob)),
             cy + ry * math.sin(TAU * i / n) * (1 + rnd.uniform(-wob, wob))) for i in range(n)]


def wall_run(p, rnd, axis, c, a0, a1, courses, T=WALL_T, holes=(), wrange=(0.42, 0.8), cols=STONES,
             core=True, span=None, gap=0.035):
    """Dry-stone courses along X (axis 'x', wall centred on y=c) or Y (axis 'y', centred on x=c).
    holes: (u0, u1, z0, z1) along the run. span(z0, z1) -> (lo, hi) narrows a course (gables)."""
    def place(u, v, z, su, sv, sz):
        return ((u, v, z), (su, sv, sz)) if axis == "x" else ((v, u, z), (sv, su, sz))
    for z0, z1 in courses:
        lo, hi = span(z0, z1) if span else (a0, a1)
        if hi - lo < 0.15:
            continue
        blocked = sorted((max(u0, lo), min(u1, hi)) for u0, u1, hz0, hz1 in holes
                         if hz0 < z1 - 0.05 and hz1 > z0 + 0.05 and u1 > lo and u0 < hi)
        free, t = [], lo
        for u0, u1 in blocked:
            if u0 > t + 1e-3:
                free.append((t, u0))
            t = max(t, u1)
        if hi > t + 1e-3:
            free.append((t, hi))
        zm, h = (z0 + z1) / 2, z1 - z0
        for f0, f1 in free:
            if core and f1 - f0 > 0.2:
                loc, size = place((f0 + f1) / 2, c, zm, f1 - f0 - 0.06, T - 0.16, h)
                p.box(size, loc, "stone_dark")
            t, first = f0, True
            while f1 - t > 1e-3:
                w = rnd.uniform(*wrange)
                if first:
                    w *= rnd.uniform(0.45, 1.0)
                    first = False
                if f1 - t - w < wrange[0] * 0.5:
                    w = f1 - t
                u = t + w / 2
                t += w
                d = T + rnd.uniform(-0.03, 0.03)
                loc, size = place(u, c + rnd.uniform(-0.012, 0.012), zm, max(w - gap, 0.05), d, h - gap)
                bm = jitter(bm_box(*size), 0.016, rnd.randint(0, 99999))
                p.add(bm, rnd.choice(cols), M(loc))


def sack(p, x, y, rz=0.0, s=1.0, mat="sack"):
    prof = [(0.0, 0.0), (0.22, 0.02), (0.27, 0.14), (0.26, 0.36), (0.18, 0.5), (0.07, 0.56), (0.09, 0.62), (0.05, 0.66)]
    bm = bm_lathe([(r * s, z * s) for r, z in prof], 8)
    jitter(bm, 0.015 * s, int(abs(x) * 100 + abs(y) * 37))
    p.add(bm, mat, M((x, y, 0), (0, 0, rz)), smooth=True)
    p.cyl(0.075 * s, 0.035 * s, (x, y, 0.55 * s), "wood_dark", segs=8)


def horseshoe(p, c, e1, e2, r=0.1, t=0.02, up=True):
    """U-shaped shoe in the plane (e1, e2) around centre c; open toward +e2 if up."""
    c, e1, e2 = Vector(c), Vector(e1), Vector(e2)
    sgn = -1 if up else 1
    pts = [c + (e1 * math.cos(a) + e2 * math.sin(a) * sgn) * r
           for a in [math.radians(-25 + 230 * k / 8) for k in range(9)]]
    p.add(bm_tube(pts, t, 4, cap=True), "iron")


def bucket(p, x, y, z=0.0, s=1.0, water=False):
    p.add(bm_lathe([(0.15 * s, 0), (0.19 * s, 0.32 * s), (0.17 * s, 0.32 * s), (0.13 * s, 0.03 * s)], 10, cap_top=False),
          "wood_mid", M((x, y, z)))
    for hz in (0.06, 0.24):
        p.cyl((0.16 + hz * 0.1) * s, 0.025 * s, (x, y, z + hz * s), "iron", segs=10)
    if water:
        p.cyl(0.165 * s, 0.01, (x, y, z + 0.26 * s), "water", segs=10)


def stack_stones(p, rnd, x, y, rz, n=4):
    spots = [(0, 0, 0), (0.05, 0.32, 0), (0.02, 0.16, 0.22), (-0.3, 0.1, 0)]
    for i, (dx, dy, z) in enumerate(spots[:n]):
        p.box((0.5, 0.3, 0.22), (x + dx, y + dy, z + 0.11), rnd.choice(STONES), rot=(0, 0, rz + rnd.uniform(-8, 8)), bevel=0.03)


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes and string for the walls and the open front,
    pebbles marking the hearth, and the plan held down with stones."""
    pts = []
    for i in range(40):
        a = TAU * i / 40
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** 5 + abs(s) ** 5) ** 0.2)
        pts.append((c * r * 3.75 * (1 + rnd.uniform(-0.02, 0.02)), -0.2 + s * r * 3.2 * (1 + rnd.uniform(-0.02, 0.02))))
    p.add(bm_slab(pts, 0.03), "dirt")
    corners = [(-3.05, -2.35), (3.05, -2.35), (3.05, 2.35), (-3.05, 2.35)]
    stakes = corners + [(-2.3, -2.35), (2.3, -2.35)]
    for k, (x, y) in enumerate(stakes):
        p.box((0.08, 0.08, 0.38), (x, y, 0.19), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, 0.38), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        if k < 4:
            p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.46)))
    for (x0, y0), (x1, y1) in zip(corners, corners[1:] + corners[:1]):
        L = math.hypot(x1 - x0, y1 - y0)
        p.box((L, 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, 0.3), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # a ring of pebbles where the hearth will stand, with a charcoal cross in the middle
    hx, hy = HEARTH_C
    for i in range(10):
        a = TAU * i / 10
        p.add(jitter(bm_ico(rnd.uniform(0.07, 0.1), 0), 0.02, i), rnd.choice(["stone_light", "stone", "stone_mid"]),
              M((hx + 0.85 * math.cos(a), hy + 0.42 * math.sin(a), 0.05), scale=(1.2, 1, 0.6)))
    for ang in (35, -35):
        p.box((0.5, 0.05, 0.01), (hx, hy, 0.035), "coal", rot=(0, 0, ang))
    # the plan: an anvil sketch, held down by pebbles
    px, py, pr = 1.9, -3.05, -7
    p.box((0.62, 0.46, 0.012), (px, py, 0.04), "paper", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    for loc, size in (((0, 0.06, 0), (0.32, 0.07)), ((0, -0.03, 0), (0.08, 0.12)), ((0, -0.11, 0), (0.22, 0.04)),
                      ((-0.2, 0.07, 0), (0.12, 0.03))):
        p.add(bm_box(size[0], size[1], 0.004), "tunic", base @ M(loc))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (-2.0, -3.25, 0.05), "wood_light", segs=6, rot=(0, 90, 20))
    p.box((0.15, 0.24, 0.15), (-1.55, -3.1, 0.085), "wood_mid", rot=(0, 0, 20), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (-2.6, -2.95 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, -10))
    p.box((0.03, 0.32, 0.09), (-2.6, -2.85, 0.06), "white", rot=(0, 0, -10))
    for i in range(7):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.6, 2.4)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a) * 0.8, 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth with a flagstone floor, a front step and stones waiting for the walls."""
    plinth = [(0.0, FLOOR)]
    cols = ["stone", "stone_mid", "stone_light", "stone"]
    for axis, c, a0, a1 in (("x", -2.15, -3.1, 3.1), ("x", 2.15, -3.1, 3.1), ("y", -2.85, -1.9, 1.9), ("y", 2.85, -1.9, 1.9)):
        wall_run(p, rnd, axis, c, a0, a1, plinth, T=0.5, wrange=(0.6, 1.0), cols=cols, core=False, gap=0.03)
    p.box((5.2, 3.8, 0.27), (0, 0, 0.135), "stone_dark")
    # flagstones
    nx, ny = 9, 8
    for i in range(nx):
        for j in range(ny):
            x0, x1 = -2.55 + 5.1 * i / nx, -2.55 + 5.1 * (i + 1) / nx
            y0, y1 = -2.35 + 4.2 * j / ny, -2.35 + 4.2 * (j + 1) / ny
            dx, dy = rnd.uniform(-0.03, 0.03), rnd.uniform(-0.03, 0.03)
            p.add(jitter(bm_box(x1 - x0 - 0.04, y1 - y0 - 0.04, 0.035), 0.008, rnd.randint(0, 9999)),
                  rnd.choice(["stone_light", "stone", "stone_warm", "stone_light"]),
                  M(((x0 + x1) / 2 + dx, (y0 + y1) / 2 + dy, FLOOR - 0.012 + rnd.uniform(0, 0.006)), (0, 0, rnd.uniform(-3, 3))))
    # front step and a few flat stones on the ground in front
    p.box((4.8, 0.38, 0.16), (0, -2.59, 0.08), "stone_light", bevel=0.03)
    for i in range(7):
        x = -2.2 + 4.4 * i / 6 + rnd.uniform(-0.15, 0.15)
        p.add(jitter(bm_box(rnd.uniform(0.45, 0.65), rnd.uniform(0.35, 0.5), 0.05), 0.012, i), rnd.choice(["stone", "stone_light"]),
              M((x, -3.05 + rnd.uniform(-0.08, 0.08), 0.02), (0, 0, rnd.uniform(-12, 12))))
    stack_stones(p, rnd, -3.75, 1.4, 30)
    stack_stones(p, rnd, 3.75, 1.7, -20, n=3)


def stage_03(p, rnd, extra):
    """Lower walls to about 1.5 m: back, both sides and the two front piers. Mortar tub, spare stones."""
    lo = WALL_COURSES[:4]
    wall_run(p, rnd, "y", -2.775, -1.85, Y1, lo)
    wall_run(p, rnd, "y", 2.775, -1.85, Y1, lo, holes=[WIN])
    wall_run(p, rnd, "x", 2.075, -2.55, 2.55, lo)
    for a0, a1 in ((-3.0, -2.3), (2.3, 3.0)):
        wall_run(p, rnd, "x", -2.075, a0, a1, lo, wrange=(0.3, 0.7))
    # mortar tub with a trowel, outside the right wall
    tx, ty = 3.6, -2.35
    p.add(bm_lathe([(0.24, 0), (0.3, 0.26), (0.3, 0.28), (0.27, 0.28), (0.21, 0.04)], 10, cap_top=False), "wood_mid", M((tx, ty, 0)))
    p.cyl(0.26, 0.02, (tx, ty, 0.2), "stone_light", segs=10)
    for hz in (0.06, 0.21):
        p.cyl(0.28 + hz * 0.2, 0.03, (tx, ty, hz), "iron", segs=10)
    p.box((0.16, 0.1, 0.012), (tx + 0.08, ty - 0.02, 0.235), "iron", rot=(0, -20, 30))
    p.cyl(0.018, 0.16, (tx + 0.02, ty - 0.06, 0.25), "wood_dark", segs=5, rot=(0, -60, 30))
    stack_stones(p, rnd, -3.7, -2.5, 15)


def stage_04(p, rnd, extra):
    """Walls up to the eaves, the stone back gable, the great timber lintel over the open front,
    and the side window with its shutters."""
    hi = WALL_COURSES[4:]
    wall_run(p, rnd, "y", -2.775, -1.85, Y1, hi)
    wall_run(p, rnd, "y", 2.775, -1.85, Y1, hi, holes=[WIN])
    wall_run(p, rnd, "x", 2.075, -2.55, 2.55, hi)
    for a0, a1 in ((-3.0, -2.3), (2.3, 3.0)):
        wall_run(p, rnd, "x", -2.075, a0, a1, WALL_COURSES[4:8], wrange=(0.3, 0.7))
    def gable(z0, z1):
        hw = X1 - (z1 - EAVE) / PITCH
        return -hw, hw
    wall_run(p, rnd, "x", 2.075, -X1, X1, GABLE_COURSES, span=gable, wrange=(0.4, 0.75))
    # lintel: one chunky adzed beam with two iron straps
    lt = EAVE + 0.06
    lz = (LINTEL_Z + lt) / 2
    p.add(jitter(bm_box(6.12, 0.5, lt - LINTEL_Z, bevel=0.03), 0.015, 7), "wood_dark", M((0, -2.07, lz)))
    for x in (-2.2, 2.2):
        p.box((0.08, 0.53, lt - LINTEL_Z + 0.03), (x, -2.07, lz), "iron")
        for dz in (-0.09, 0.09):
            p.cyl(0.03, 0.02, (x, -2.33, lz + dz), "iron_light", segs=6, rot=(90, 0, 0))
    # window in the right wall
    y0, y1, z0, z1 = WIN
    ym, zm, w, h = (y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0
    xf = X1 - 0.12
    for y in (y0 + 0.04, y1 - 0.04):
        p.box((0.22, 0.08, h), (xf, y, zm), "wood_light")
    for z in (z0 + 0.04, z1 - 0.04):
        p.box((0.22, w, 0.08), (xf, ym, z), "wood_light")
    p.box((0.02, w - 0.14, h - 0.14), (xf - 0.05, ym, zm), "glass")
    p.box((0.06, 0.05, h - 0.12), (xf + 0.02, ym, zm), "wood_light")
    p.box((0.06, w - 0.12, 0.05), (xf + 0.02, ym, zm + 0.05), "wood_light")
    p.box((0.3, w + 0.22, 0.08), (X1 + 0.06, ym, z0 - 0.03), "stone_light", bevel=0.015)
    for s, yh in ((-1, y0), (1, y1)):
        hinge = M((X1 + 0.04, yh, zm), (0, 0, -s * 8))
        p.add(bm_box(0.045, w / 2 + 0.02, h - 0.02), "shutter", hinge @ M((0, s * (w / 2 + 0.02) / 2, 0)))
        for dz in (-h * 0.3, h * 0.3):
            p.add(bm_box(0.025, w / 2 - 0.02, 0.06), "wood_dark", hinge @ M((0.03, s * (w / 2 + 0.02) / 2, dz)))


def stage_05(p, rnd, extra):
    """The hearth: a raised stone forge with a firepot of glowing coals (`glow`) and a stone hood."""
    x0, x1, y0, y1 = HEARTH
    hx, hy = HEARTH_C
    wall_run(p, rnd, "x", (y0 + y1) / 2, x0, x1, [(FLOOR, 0.68), (0.68, 1.05)], T=y1 - y0, wrange=(0.4, 0.7))
    p.add(jitter(bm_box(x1 - x0 + 0.12, y1 - y0 + 0.1, 0.1, bevel=0.02), 0.01, 5), "stone_light",
          M(((x0 + x1) / 2, (y0 + y1) / 2 - 0.03, 1.1)))
    p.add(bm_lathe([(0.44, 1.15), (0.44, 1.22), (0.34, 1.23), (0.31, 1.15)], 12), "stone_mid", M((hx, hy, 0)))
    p.cyl(0.34, 0.05, (hx, hy, 1.15), "coal", segs=12)
    for i in range(11):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.0, 0.24)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.095), 0), 0.02, 300 + i), "glow",
              M((hx + d * math.cos(a), hy + d * math.sin(a), 1.2), scale=(1.2, 1, 0.7)))
    for i in range(10):
        a = TAU * i / 10 + rnd.uniform(-0.2, 0.2)
        p.add(jitter(bm_ico(rnd.uniform(0.05, 0.08), 0), 0.02, 400 + i), "coal",
              M((hx + 0.29 * math.cos(a), hy + 0.29 * math.sin(a), 1.21), scale=(1.2, 1, 0.7)))
    # fire mouth under the firepot: glows through a grate so the fire reads from low angles
    p.box((0.42, 0.06, 0.3), (hx, y0 - 0.005, 0.62), "glow")
    for dx in (-0.12, 0.0, 0.12):
        p.box((0.03, 0.04, 0.34), (hx + dx, y0 - 0.04, 0.62), "iron")
    p.box((0.5, 0.05, 0.05), (hx, y0 - 0.04, 0.8), "iron")
    # hood: tapering stone hood with an iron lip, held by two iron stays
    p.add(frustum((-1.6, 0.4, 0.85, 1.87, 2.0), (FLUE[0], FLUE[1], FLUE[2], 1.87, 3.0)), "stone_mid")
    p.add(frustum((-1.63, 0.43, 0.82, 1.87, 1.93), (-1.63, 0.43, 0.82, 1.87, 2.03)), "iron")
    for x in (-1.5, 0.3):
        rod(p, (x, 0.9, 1.15), (x, 0.86, 1.95), 0.025, "iron", 5)
    # soot on the floor, a coal scuttle, poker and rake
    p.add(bm_slab(blob(hx, 0.55, 1.4, 0.55, rnd=rnd), 0.03), "soot", M((0, 0, FLOOR)))
    p.add(bm_lathe([(0.14, 0), (0.18, 0.28), (0.16, 0.3), (0.12, 0.02)], 9, cap_top=False), "iron", M((0.72, 0.72, FLOOR)))
    p.add(jitter(bm_ico(0.15, 1), 0.03, 9), "coal", M((0.72, 0.72, FLOOR + 0.24), scale=(1, 1, 0.5)))
    rod(p, (0.16, 0.86, FLOOR), (0.22, 0.95, 1.08), 0.016, "iron", 4)
    rod(p, (0.02, 0.86, FLOOR), (-0.02, 0.95, 1.04), 0.016, "iron", 4)
    p.box((0.16, 0.03, 0.06), (0.02, 0.86, FLOOR + 0.04), "iron")


def stage_06(p, rnd, extra):
    """Stone chimney from the hood up past the ridge, a cap stone and a clay pot. `smoke` empty on top."""
    x0, x1, y0, y1 = FLUE
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    d = 0.26
    for k, (z0, z1) in enumerate(CHIM_COURSES):
        zm, h = (z0 + z1) / 2, z1 - z0 - 0.03
        p.box((x1 - x0 - 2 * d, y1 - y0 - 2 * d, h + 0.03), (xm, ym, zm), "stone_dark")
        if k % 2 == 0:
            blocks = [((x1 - x0, d, h), (xm, y0 + d / 2)), ((x1 - x0, d, h), (xm, y1 - d / 2)),
                      ((d, y1 - y0 - 2 * d - 0.03, h), (x0 + d / 2, ym)), ((d, y1 - y0 - 2 * d - 0.03, h), (x1 - d / 2, ym))]
        else:
            blocks = [((d, y1 - y0, h), (x0 + d / 2, ym)), ((d, y1 - y0, h), (x1 - d / 2, ym)),
                      ((x1 - x0 - 2 * d - 0.03, d, h), (xm, y0 + d / 2)), ((x1 - x0 - 2 * d - 0.03, d, h), (xm, y1 - d / 2))]
        for size, (x, y) in blocks:
            p.add(jitter(bm_box(*size), 0.014, rnd.randint(0, 9999)), rnd.choice(STONES),
                  M((x + rnd.uniform(-0.01, 0.01), y + rnd.uniform(-0.01, 0.01), zm)))
    p.add(jitter(bm_box(x1 - x0 + 0.18, y1 - y0 + 0.18, 0.13, bevel=0.025), 0.01, 3), "stone_light", M((xm, ym, CHIM_TOP + 0.065)))
    p.add(bm_lathe([(0.2, 0), (0.22, 0.08), (0.17, 0.3), (0.19, 0.34), (0.15, 0.34)], 10, cap_top=False), "roof_mid",
          M((xm, ym, CHIM_TOP + 0.13)))
    p.cyl(0.15, 0.02, (xm, ym, CHIM_TOP + 0.3), "coal", segs=10)
    extra.append(("EMPTY", "smoke", (xm, ym, CHIM_TOP + 0.5)))


def stage_07(p, rnd, extra):
    """Roof frame: wall plates, ridge beam, rafters, a tie-beam truss, the plank front gable with a
    vent, and barge boards crossing over the front apex."""
    for s in (-1, 1):
        p.box((0.3, 4.62, 0.12), (s * 2.775, 0, EAVE + 0.06), "wood_dark")
    p.box((0.2, ROOF_Y1 - ROOF_Y0 + 0.1, 0.26), (0, (ROOF_Y0 + ROOF_Y1) / 2, RIDGE), "wood_dark")
    n = 9
    for i in range(n):
        y = ROOF_Y0 + 0.15 + (ROOF_Y1 - ROOF_Y0 - 0.3) * i / (n - 1)
        for s in (-1, 1):
            beam(p, (0, y, RIDGE), (s * EAVE_X, y, roof_z(EAVE_X)), 0.12, 0.16, "wood_mid", 0.008, i * 2 + s)
    # truss inside: tie beam, king post and struts
    ty = -0.1
    p.add(jitter(bm_box(5.5, 0.22, 0.22), 0.01, 4), "wood_dark", M((0, ty, EAVE + 0.11)))
    p.box((0.16, 0.16, RIDGE - EAVE - 0.3), (0, ty, (RIDGE + EAVE + 0.2) / 2), "wood_mid")
    for s in (-1, 1):
        beam(p, (0, ty, EAVE + 0.3), (s * 1.6, ty, roof_z(1.6) - 0.08), 0.12, 0.12, "wood_mid")
    # front gable: vertical boards above the lintel, cut to the roof slope
    yb = -2.14
    edges = [-2.95 + 5.9 * k / 20 for k in range(21)]
    for k, (xa, xb) in enumerate(zip(edges, edges[1:])):
        ta, tb = roof_z(xa) - 0.1, roof_z(xb) - 0.1
        pts = [(xa + 0.01, EAVE), (xb - 0.01, EAVE), (xb - 0.01, tb), (xa + 0.01, ta)]
        if xa < -0.01 and xb > 0.01:
            pts.insert(3, (0.0, RIDGE - 0.1))
        p.add(bm_prism(pts, 0.06), rnd.choice(["wood", "wood_light", "wood", "wood_mid"]), M((0, yb + rnd.uniform(-0.008, 0.008), 0)))
    vz = 4.25
    p.box((0.62, 0.05, 0.5), (0, yb - 0.04, vz), "coal")
    for dz in (-0.13, 0.0, 0.13):
        p.box((0.56, 0.04, 0.07), (0, yb - 0.08, vz + dz), "wood_dark", rot=(25, 0, 0))
    for s in (-1, 1):
        p.box((0.07, 0.07, 0.62), (s * 0.34, yb - 0.08, vz), "wood_mid")
        p.box((0.75, 0.07, 0.07), (0, yb - 0.08, vz + s * 0.29), "wood_mid")
    # barge boards: the front pair crosses above the ridge like horns
    for y, ext in ((ROOF_Y0 - 0.03, 0.42), (ROOF_Y1 + 0.03, 0.05)):
        for s in (-1, 1):
            beam(p, (-s * ext, y, roof_z(ext) + 0.12 + 2 * PITCH * ext), (s * (EAVE_X + 0.05), y, roof_z(EAVE_X + 0.05) + 0.12),
                 0.06, 0.28, "wood_dark")


def stage_08(p, rnd, extra):
    """Clay tile roof on battens, ridge caps, a few mossy tiles."""
    A = math.radians(A_DEG)
    S = EAVE_X / math.cos(A)
    row_h = 0.34
    nrows = int(math.ceil(S / row_h))
    tile_w = 0.42
    cols = ["roof_mid"] * 4 + ["roof"] * 3 + ["roof_dark"] * 2 + ["tile_moss"]
    for s in (-1, 1):
        for k in range(nrows):
            d0 = k * row_h
            ln = min(row_h + 0.1, S - d0 + 0.02)
            dc = d0 + ln / 2
            ax = EAVE_X - dc * math.cos(A)
            z = roof_z(ax) + 0.2 + 0.015
            bx = EAVE_X - (d0 + 0.08) * math.cos(A)
            p.box((0.06, ROOF_Y1 - ROOF_Y0, 0.05), (s * bx, (ROOF_Y0 + ROOF_Y1) / 2, roof_z(bx) + 0.12), "wood_dark",
                  rot=(0, s * A_DEG, 0))
            edges = [ROOF_Y0 - 0.02]
            y = ROOF_Y0 - 0.02 + (tile_w / 2 if k % 2 else tile_w)
            while y < ROOF_Y1 + 0.02 - 0.12:
                edges.append(y)
                y += tile_w
            edges.append(ROOF_Y1 + 0.02)
            for ya, yb in zip(edges, edges[1:]):
                yc = (ya + yb) / 2
                xc = s * ax
                if FLUE[0] - 0.1 < xc < FLUE[1] + 0.1 and FLUE[2] - 0.1 < yc < FLUE[3] + 0.1:
                    continue
                bm = jitter(bm_box(ln, yb - ya - 0.03, 0.055), 0.008, rnd.randint(0, 99999))
                p.add(bm, rnd.choice(cols), M((xc, yc + rnd.uniform(-0.01, 0.01), z), (0, s * (A_DEG - 3) + rnd.uniform(-1, 1), 0)))
    nseg = 12
    for i in range(nseg):
        ya = ROOF_Y0 - 0.06 + (ROOF_Y1 - ROOF_Y0 + 0.12) * i / nseg
        L = (ROOF_Y1 - ROOF_Y0 + 0.12) / nseg + 0.03
        p.cyl(0.16, L, (0, ya, RIDGE + 0.27), "roof_dark", segs=6, rot=(-90, 0, rnd.uniform(-2, 2)))


def stage_09(p, rnd, extra):
    """Leather bellows on a trestle left of the hearth, piped into the fire, and the rocking lever
    (`bellows_lever`, pivot on its post, rocks around X)."""
    half = [(0.07, 0.0), (0.16, 0.12), (0.25, 0.35), (0.31, 0.65), (0.33, 0.92), (0.3, 1.12), (0.2, 1.26), (0.0, 1.31)]
    poly = half + [(-u, v) for u, v in reversed(half) if u > 0]
    YN, ZB = 1.45, 0.86
    def H(v):
        return 0.05 + 0.32 * v / 1.31
    world = [(BX + u, YN - v) for u, v in poly]
    p.add(slab_z(world, lambda x, y: ZB - 0.045, 0.045), "wood_mid")
    p.add(slab_z(world, lambda x, y: ZB + H(YN - y), 0.045), "wood_mid")
    bm = bmesh.new()
    levels = 7
    rings = []
    for i in range(levels):
        t = i / (levels - 1)
        sc = 1.0 if i % 2 == 0 else 0.84
        rings.append([bm.verts.new((BX + u * sc, YN - v, ZB + t * H(v))) for u, v in poly])
    n = len(poly)
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    p.add(bm, "leather")
    for v in (0.35, 0.75, 1.1):           # iron studs along the top board
        for s in (-1, 1):
            u = s * 0.85 * max(w for w, vv in half if abs(vv - v) < 0.3)
            p.box((0.04, 0.04, 0.02), (BX + u, YN - v, ZB + H(v) + 0.05), "iron")
    p.add(bm_tube([(BX, YN - 0.02, ZB + 0.03), (BX, 1.62, ZB + 0.03), (-1.75, 1.62, ZB + 0.03), (-1.45, 1.62, ZB + 0.03)],
                  [0.06, 0.045, 0.045, 0.045], 6), "iron")
    # trestle
    for y in (1.2, 0.4):
        for s in (-1, 1):
            p.box((0.07, 0.07, ZB - 0.05 - FLOOR), (BX + s * 0.24, y, (ZB - 0.05 + FLOOR) / 2), "wood_dark")
        p.box((0.6, 0.08, 0.08), (BX, y, ZB - 0.08), "wood_dark")
    # post and axle for the lever
    p.add(jitter(bm_box(0.13, 0.13, PIVOT.z + 0.18 - FLOOR), 0.01, 8), "wood_mid", M((-2.45, PIVOT.y, (PIVOT.z + 0.18 + FLOOR) / 2)))
    rod(p, (-2.52, PIVOT.y, PIVOT.z), (BX + 0.07, PIVOT.y, PIVOT.z), 0.03, "iron", 6)
    p.box((0.06, 0.06, 0.06), (BX, 0.25, ZB + H(1.2) + 0.07), "iron")
    # the lever: beam, link rod down to the top board, pull chain and ring at the back end
    lv = Part("bellows_lever")
    lv.add(jitter(bm_box(0.1, 1.5, 0.12), 0.01, 11), "wood_mid", M((BX, 0.78, PIVOT.z)))
    lv.add(bm_box(0.12, 0.2, 0.16), "wood_dark", M((BX, PIVOT.y, PIVOT.z)))
    lv.add(bm_tube([(BX, 0.25, PIVOT.z - 0.06), (BX, 0.25, ZB + H(1.2) + 0.08)], 0.018, 5), "iron")
    for k in range(5):
        lv.add(bm_box(0.02, 0.05 if k % 2 else 0.02, 0.1), "iron", M((BX, 1.45, PIVOT.z - 0.12 - 0.09 * k)))
    lv.add(bm_tube([(BX, 1.45 + 0.07 * math.sin(TAU * k / 10), PIVOT.z - 0.62 + 0.07 * math.cos(TAU * k / 10)) for k in range(11)],
                   0.016, 5), "iron")
    extra.append((lv, tuple(PIVOT)))


def stage_10(p, rnd, extra):
    """Anvil on an iron-banded stump, a glowing bar on its face (`glow`), hammer, tongs and iron stock."""
    base = M((0.45, -0.35, FLOOR), (0, 0, 18))
    st = jitter(bm_cyl(0.31, 0.28, 0.52, 10), 0.02, 21, keep_bottom=0.0)
    p.add(st, "wood", base)
    p.add(bm_cyl(0.285, 0.285, 0.02, 10), "wood_light", base @ M((0, 0, 0.51)))
    for z in (0.1, 0.38):
        p.add(bm_cyl(0.315, 0.3, 0.04, 10), "iron", base @ M((0, 0, z)))
    z0 = 0.53
    p.add(bm_box(0.42, 0.3, 0.1, bevel=0.015), "iron", base @ M((0, 0, z0 + 0.05)))
    p.add(bm_cyl(0.17, 0.11, 0.18, 4), "iron", base @ M((0, 0, z0 + 0.1), (0, 0, 45), scale=(1.25, 0.8, 1)))
    p.add(bm_box(0.52, 0.22, 0.15, bevel=0.015), "iron", base @ M((0, 0, z0 + 0.355)))
    p.add(bm_box(0.5, 0.2, 0.012), "iron_light", base @ M((0, 0, z0 + 0.432)))
    p.add(bm_cyl(0.1, 0.0, 0.34, 8), "iron", base @ M((-0.25, 0, z0 + 0.37), (0, -90, 0), scale=(1, 0.9, 1)))
    p.add(bm_box(0.14, 0.15, 0.1), "iron", base @ M((0.31, 0, z0 + 0.38)))
    p.add(bm_box(0.04, 0.04, 0.01), "coal", base @ M((0.18, 0, z0 + 0.44)))
    # the hot bar being worked: glowing end on the anvil, cooler end sticking out
    bar = base @ M((-0.02, 0.03, z0 + 0.462), (0, 0, 12))
    p.add(bm_box(0.3, 0.045, 0.045), "glow", bar)
    p.add(bm_box(0.42, 0.04, 0.04), "iron", bar @ M((0.36, 0, 0)))
    # hammer resting across the face, handle out to the front
    p.add(bm_box(0.17, 0.07, 0.07, bevel=0.01), "iron", base @ M((0.14, 0.07, z0 + 0.475), (0, 0, 90)))
    p.add(bm_tube([(0.14, 0.04, z0 + 0.47), (0.14, -0.4, z0 + 0.49)], 0.022, 6), "wood_light", base)
    # tongs leaning on the stump
    for s in (-1, 1):
        p.add(bm_tube([(0.28 + 0.02 * s, -0.25, 0.0), (0.3 + 0.03 * s, -0.24, 0.45), (0.3 + 0.01 * s, -0.17, 0.62)], 0.012, 4), "iron", base)
    # iron stock on the floor by the hearth
    for i in range(5):
        p.box((0.9, 0.04, 0.04), (0.95, 0.42 + 0.05 * i, FLOOR + 0.02 + (0.04 if i in (1, 3) else 0)), "iron", rot=(0, 0, 8))


def stage_11(p, rnd, extra):
    """Stone quench trough of water beside the hearth, tongs dipped in it, a bucket by the anvil."""
    x0, x1, y0, y1 = 0.72, 2.0, 1.08, 1.8
    top, t = FLOOR + 0.6, 0.11
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    p.add(jitter(bm_box(x1 - x0, y1 - y0, 0.14), 0.01, 1), "stone", M((xm, ym, FLOOR + 0.07)))
    for loc, size in (((xm, y0 + t / 2), (x1 - x0, t)), ((xm, y1 - t / 2), (x1 - x0, t)),
                      ((x0 + t / 2, ym), (t, y1 - y0 - 2 * t)), ((x1 - t / 2, ym), (t, y1 - y0 - 2 * t))):
        p.add(jitter(bm_box(size[0], size[1], top - FLOOR - 0.14, bevel=0.02), 0.012, rnd.randint(0, 999)),
              rnd.choice(["stone_light", "stone", "stone_warm"]), M((loc[0], loc[1], (top + FLOOR + 0.14) / 2)))
    p.box((x1 - x0 - 2 * t, y1 - y0 - 2 * t, 0.02), (xm, ym, top - 0.09), "water")
    for s in (-1, 1):
        rod(p, (1.15 + 0.03 * s, 1.35, top - 0.2), (1.2 + 0.05 * s, y0 + 0.02, top + 0.35), 0.012, "iron", 4)
    bucket(p, 1.3, -0.8, FLOOR, water=True)
    p.add(bm_tube([(1.3 + 0.19 * math.cos(math.pi * k / 8), -0.8, FLOOR + 0.32 + 0.16 * math.sin(math.pi * k / 8)) for k in range(9)],
                  0.012, 4, cap=True), "iron")


def stage_12(p, rnd, extra):
    """Tool racks: hammers, tongs, a file and shoes on pegs over the trough, a shelf above,
    and horseshoes on a rack on the right wall."""
    yw = Y1 - WALL_T
    p.box((1.9, 0.06, 0.12), (1.5, yw - 0.03, 2.15), "wood_mid")
    p.box((1.9, 0.3, 0.05), (1.5, yw - 0.15, 2.65), "wood_light")
    for x in (0.7, 2.3):
        p.box((0.05, 0.25, 0.18), (x, yw - 0.13, 2.53), "wood_dark")
    yt = yw - 0.1
    for k in range(7):
        x = 0.7 + 0.267 * k
        p.cyl(0.02, 0.1, (x, yw - 0.06, 2.12), "wood_dark", segs=5, rot=(90, 0, 0))
        kind = ["hammer", "tongs", "hammer_big", "tongs", "file", "shoe", "tongs"][k]
        if kind.startswith("hammer"):
            big = kind == "hammer_big"
            p.box((0.2 if big else 0.15, 0.08 if big else 0.06, 0.08 if big else 0.06), (x, yt, 2.06), "iron")
            rod(p, (x, yt, 2.04), (x, yt, 1.62 if big else 1.72), 0.02, "wood_light", 5)
        elif kind == "tongs":
            for s in (-1, 1):
                p.add(bm_tube([(x + 0.015 * s, yt, 2.1), (x + 0.03 * s, yt, 1.7), (x + 0.012 * s, yt, 1.5)], 0.011, 4), "iron")
            p.cyl(0.02, 0.02, (x, yt + 0.01, 2.08), "iron", segs=6, rot=(90, 0, 0))
        elif kind == "file":
            p.box((0.04, 0.012, 0.34), (x, yt, 1.84), "iron_light")
            rod(p, (x, yt, 2.01), (x, yt, 2.12), 0.02, "wood", 5)
        else:
            horseshoe(p, (x, yt, 1.98), (1, 0, 0), (0, 0, 1), up=False)
    for i, (x, kind) in enumerate(((0.8, "jar"), (1.05, "jar"), (1.45, "box"), (1.85, "bars"), (2.2, "jar"))):
        z = 2.675
        if kind == "jar":
            p.add(bm_lathe([(0.07, 0), (0.09, 0.08), (0.06, 0.16), (0.05, 0.19)], 8), rnd.choice(["roof_mid", "stone_light"]),
                  M((x, yw - 0.15, z)))
        elif kind == "box":
            p.box((0.26, 0.2, 0.14), (x, yw - 0.15, z + 0.07), "wood_dark", bevel=0.01)
        else:
            for j in range(3):
                p.box((0.3, 0.035, 0.035), (x, yw - 0.1 - 0.05 * j, z + 0.02), "iron")
    # right wall rack of horseshoes
    xw = X1 - WALL_T
    p.box((0.06, 1.3, 0.12), (xw - 0.03, -1.1, 1.95), "wood_mid")
    for k in range(5):
        y = -1.6 + 0.25 * k
        p.cyl(0.02, 0.1, (xw - 0.06, y, 1.92), "wood_dark", segs=5, rot=(0, -90, 0))
        for j in range(1 if k % 2 else 2):
            horseshoe(p, (xw - 0.11 - 0.02 * j, y, 1.83 - 0.03 * j), (0, 1, 0), (0, 0, 1), r=0.085, up=False)


def stage_13(p, rnd, extra):
    """Charcoal lean-to against the left wall: posts and a shingle roof over a charcoal bin,
    stacked firewood and coal sacks."""
    p.add(bm_slab(blob(-4.1, 0.2, 1.1, 2.1, rnd=rnd), 0.025), "dirt")
    zt, zb, xo = 2.55, 1.92, -5.0
    p.box((0.1, 3.8, 0.16), (-X1 - 0.05, 0.25, zt), "wood_dark")
    for y in (-1.45, 0.25, 1.95):
        p.add(jitter(bm_box(0.14, 0.14, zb + 0.04), 0.012, int(y * 10) + 50), "wood_mid", M((-4.75, y, (zb + 0.04) / 2)))
    p.box((0.16, 3.8, 0.14), (-4.75, 0.25, zb + 0.07), "wood_dark")
    for y in (-1.55, -0.3, 0.9, 2.05):
        beam(p, (-X1 - 0.08, y, zt + 0.02), (xo, y, zb + 0.06), 0.08, 0.12, "wood_mid")
    slope = (zt - zb) / (-X1 - 0.08 - xo)       # rise per metre toward the wall
    ang = math.degrees(math.atan(slope))
    rows, rw = 7, 0.34
    for k in range(rows):
        xa = xo - 0.08 + k * rw * 0.92
        xc = xa + rw / 2
        z = zt + 0.1 + (xc + X1 + 0.08) * slope
        y, j = -1.75, 0
        while y < 2.2:
            w = rnd.uniform(0.32, 0.5) if y > -1.75 or k % 2 == 0 else 0.22
            w = min(w, 2.25 - y)
            p.add(jitter(bm_box(rw + 0.08, w - 0.03, 0.04), 0.008, rnd.randint(0, 9999)),
                  rnd.choice(["shingle", "shingle", "shingle_light", "shingle_dark"]),
                  M((xc, y + w / 2, z), (0, -ang + 3, 0)))
            y += w
            j += 1
    # charcoal bin
    bx0, bx1, by0, by1, bh = -4.55, -3.25, -1.25, 0.15, 0.6
    for loc, size in ((((bx0 + bx1) / 2, by0), (bx1 - bx0, 0.05)), (((bx0 + bx1) / 2, by1), (bx1 - bx0, 0.05)),
                      ((bx0, (by0 + by1) / 2), (0.05, by1 - by0)), ((bx1, (by0 + by1) / 2), (0.05, by1 - by0))):
        for z in (0.12, 0.31, 0.5):
            p.box((size[0], size[1], 0.17), (loc[0], loc[1], z), rnd.choice(["wood", "wood_light", "wood_mid"]))
    for x in (bx0, bx1):
        for y in (by0, by1):
            p.box((0.08, 0.08, bh + 0.05), (x, y, (bh + 0.05) / 2), "wood_dark")
    p.add(jitter(bm_ico(0.62, 2), 0.06, 13), "coal", M(((bx0 + bx1) / 2, (by0 + by1) / 2, 0.42), scale=(1.0, 1.1, 0.35)))
    for i in range(12):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.0, 0.5)
        p.add(jitter(bm_ico(rnd.uniform(0.05, 0.08), 0), 0.02, 500 + i), "coal",
              M(((bx0 + bx1) / 2 + d * math.cos(a), (by0 + by1) / 2 + d * math.sin(a) * 1.1, 0.6 - d * 0.25)))
    p.add(bm_box(0.22, 0.03, 0.26), "iron", M((-3.7, -0.4, 0.62), (0, -20, 15)))
    rod(p, (-3.66, -0.4, 0.74), (-3.42, -0.43, 1.35), 0.022, "wood_light")
    # firewood stack, ends showing
    for row, n in enumerate((5, 4, 3)):
        for i in range(n):
            x = -4.45 + 0.25 * i + 0.125 * row
            z = 0.12 + 0.21 * row
            r = 0.115 + rnd.uniform(-0.01, 0.01)
            y0 = 0.5 + rnd.uniform(-0.05, 0.05)
            p.cyl(r, 1.25, (x, y0, z), "wood", segs=7, rot=(-90, 0, rnd.uniform(0, 30)))
            for yy in (y0 - 0.005, y0 + 1.245):
                p.cyl(r - 0.02, 0.012, (x, yy, z), "wood_light", segs=7, rot=(-90, 0, 0))
    sack(p, -4.3, -1.7, 20, 0.95, "sack_dark")
    sack(p, -3.85, -1.82, -25, 0.85, "sack_dark")
    for i in range(4):
        p.add(jitter(bm_ico(0.05, 0), 0.015, 600 + i), "coal", M((-4.05 + 0.08 * i, -2.05 - 0.04 * i, 0.04)))


def tool(p, kind, y):
    """A new tool leaning on the yard rack (rail at x 4.58, z 1.05)."""
    if kind == "shovel":
        top, bot = Vector((4.62, y, 1.32)), Vector((4.3, y, 0.36))
    else:
        top, bot = Vector((4.6, y, 1.25)), Vector((4.2, y, 0.0))
    d = (top - bot).normalized()
    perp = Vector((-d.z, 0, d.x))          # in the XZ plane, pointing to -X / up
    rod(p, bot, top, 0.022, "wood_light", 6)
    if kind == "shovel":
        tip = bot - d * 0.34
        beam(p, bot + d * 0.02, tip, 0.24, 0.025, "iron_light")
        p.box((0.05, 0.14, 0.04), tuple(top + d * 0.02), "wood", rot=(0, math.degrees(math.atan2(d.x, d.z)), 0))
    elif kind == "hoe":
        beam(p, top - perp * 0.02, top + perp * 0.2 - d * 0.04, 0.16, 0.02, "iron_light")
    elif kind == "pick":
        beam(p, top - perp * 0.3 + d * 0.04, top + perp * 0.3 + d * 0.04, 0.05, 0.05, "iron_light")
    elif kind == "rake":
        beam(p, top + Vector((0, -0.15, 0)), top + Vector((0, 0.15, 0)), 0.03, 0.04, "iron_light")
        for k in range(6):
            q = top + Vector((0, -0.13 + 0.052 * k, 0))
            rod(p, q, q + perp * 0.1, 0.01, "iron_light", 3)
    elif kind == "axe":
        p.add(bm_prism([(0, -0.04), (0.18, -0.1), (0.2, 0.06), (0, 0.04)], 0.035), "iron_light",
              M(tuple(top - d * 0.06), (0, -math.degrees(math.atan2(d.z, d.x)) + 90, 0)))


def stage_14(p, rnd, extra):
    """The yard on the right: workbench with a vise under the window, a grindstone, and a rack of
    new tools for the town (shovels, hoes, a pick, a rake, an axe) with a barrel of handles."""
    p.add(bm_slab(blob(4.15, -0.4, 1.05, 2.5, rnd=rnd), 0.025), "dirt")
    # workbench
    bx0, bx1, by0, by1, bz = 3.15, 3.72, -0.95, 1.05, 0.85
    for x in (bx0 + 0.06, bx1 - 0.06):
        for y in (by0 + 0.08, by1 - 0.08):
            p.box((0.08, 0.08, bz - 0.06), (x, y, (bz - 0.06) / 2), "wood_mid")
        p.box((0.06, by1 - by0 - 0.16, 0.08), (x, (by0 + by1) / 2, 0.25), "wood_mid")
    for i in range(3):
        w = (bx1 - bx0) / 3
        p.box((w - 0.015, by1 - by0, 0.07), (bx0 + w * (i + 0.5), (by0 + by1) / 2, bz - 0.035),
              ["wood_light", "wood", "wood_light"][i], bevel=0.008)
    vy = by0 + 0.12
    p.box((0.16, 0.12, 0.16), (3.43, vy, bz + 0.08), "iron", bevel=0.01)
    p.box((0.2, 0.05, 0.05), (3.43, vy, bz + 0.18), "iron")
    rod(p, (3.43, vy - 0.06, bz + 0.05), (3.43, vy - 0.22, bz + 0.05), 0.015, "iron", 5)
    rod(p, (3.33, vy - 0.22, bz + 0.05), (3.53, vy - 0.22, bz + 0.05), 0.012, "iron", 4)
    horseshoe(p, (3.45, 0.1, bz + 0.01), (1, 0, 0), (0, 1, 0), r=0.09)
    horseshoe(p, (3.38, 0.45, bz + 0.01), (0, 1, 0), (1, 0, 0), r=0.09)
    p.box((0.22, 0.16, 0.08), (3.5, 0.82, bz + 0.04), "wood_dark")
    p.box((0.16, 0.06, 0.06), (3.32, -0.35, bz + 0.03), "iron", rot=(0, 0, 30))
    rod(p, (3.32, -0.35, bz + 0.03), (3.55, -0.12, bz + 0.03), 0.018, "wood_light", 5)
    # grindstone with a crank, over a water tub
    gx, gy, gz = 4.35, 1.6, 0.78
    p.add(bm_cyl(0.42, 0.42, 0.13, 14, bevel=0.02), "stone_light", M((gx - 0.065, gy, gz), (0, 90, 0)))
    rod(p, (gx - 0.32, gy, gz), (gx + 0.36, gy, gz), 0.03, "iron", 6)
    for s in (-1, 1):
        x = gx + s * 0.22
        for dy in (-0.38, 0.38):
            beam(p, (x, gy + dy, 0.0), (x, gy + dy * 0.1, gz - 0.05), 0.07, 0.07, "wood_mid")
        p.box((0.09, 0.16, 0.1), (x, gy, gz - 0.04), "wood_dark")
        p.box((0.06, 0.7, 0.06), (x, gy, 0.3), "wood_mid")
    rod(p, (gx + 0.36, gy, gz), (gx + 0.36, gy, gz - 0.24), 0.02, "iron", 5)
    rod(p, (gx + 0.36, gy, gz - 0.24), (gx + 0.5, gy, gz - 0.24), 0.022, "wood_light", 5)
    p.add(bm_box(0.36, 0.62, 0.3), "wood", M((gx, gy, 0.15)))
    p.box((0.3, 0.56, 0.02), (gx, gy, 0.28), "water")
    # rack of new tools for the town
    for y in (-2.3, -0.5):
        p.add(jitter(bm_box(0.1, 0.1, 1.15), 0.01, int(-y * 10)), "wood_mid", M((4.65, y, 0.575)))
    p.box((0.08, 1.9, 0.08), (4.62, -1.4, 1.05), "wood_light")
    p.box((0.08, 1.9, 0.08), (4.25, -1.4, 0.05), "wood_mid")
    for x in (4.25,):
        for y in (-2.3, -0.5):
            p.box((0.45, 0.08, 0.06), (4.45, y, 0.05), "wood_mid")
    for i, kind in enumerate(["shovel", "hoe", "pick", "rake", "axe", "shovel"]):
        tool(p, kind, -2.1 + 0.28 * i)
    # barrel of handles
    bxp, byp = 4.55, -2.8
    prof = [(0.26, 0), (0.3, 0.2), (0.31, 0.38), (0.3, 0.56), (0.26, 0.74)]
    p.add(bm_lathe(prof, 12, cap_top=False), "wood", M((bxp, byp, 0)))
    for z in (0.08, 0.37, 0.66):
        p.cyl(0.305 if z == 0.37 else 0.285, 0.04, (bxp, byp, z), "iron", segs=12)
    p.cyl(0.25, 0.02, (bxp, byp, 0.6), "wood_dark", segs=12)
    for k in range(5):
        a = TAU * k / 5 + 0.3
        rod(p, (bxp + 0.12 * math.cos(a), byp + 0.12 * math.sin(a), 0.2),
            (bxp + 0.25 * math.cos(a), byp + 0.25 * math.sin(a), 1.15 + 0.06 * (k % 2)), 0.022, "wood_light", 5)


def stage_15(p, rnd, extra):
    """Finishing touches: lanterns on the piers (`glow`), a swinging sign with an anvil (`sign`),
    a lucky horseshoe, the old Vane Company crate now full of kindling, Vane's map pinned up
    with a knife, and pots of flowers."""
    for x in (-2.65, 2.65):
        za, s = 2.3, 1.15
        p.box((0.16, 0.06, 0.26), (x, -Y1 - 0.03, za), "wood_dark")
        p.add(bm_tube([(x, -Y1 - 0.05, za), (x, -Y1 - 0.4, za), (x, -Y1 - 0.45, za - 0.06)], 0.026, 6), "iron")
        add_lantern(p, (x, -Y1 - 0.45, za - 0.06 - 0.58 * s + 0.03), s, hang=True)
    # sign bracket on the right pier and the sign itself
    sx, sy, sz = SIGN_PIVOT
    p.box((0.05, 0.16, 0.3), (X1 + 0.025, sy, sz - 0.05), "iron")
    p.add(bm_tube([(X1, sy, sz + 0.04), (sx + 0.38, sy, sz + 0.04)], 0.025, 6), "iron")
    p.add(bm_tube([(X1, sy, sz - 0.35), (X1 + 0.2, sy, sz - 0.12), (X1 + 0.38, sy, sz + 0.03)], 0.018, 5), "iron")
    p.add(bm_tube([(sx + 0.38 + 0.05 * math.cos(TAU * k / 8), sy, sz + 0.04 + 0.05 * math.sin(TAU * k / 8)) for k in range(9)],
                  0.012, 4), "iron")
    sg = Part("sign")
    w, h, zc = 0.74, 0.5, sz - 0.48
    def rounded(wd, ht, rr, n=3):
        pts = []
        for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
            for k in range(n + 1):
                a = math.radians(a0 + 90 * k / n)
                pts.append((cxs * (wd / 2 - rr) + rr * math.cos(a), czs * (ht / 2 - rr) + rr * math.sin(a)))
        return pts
    for u in (-0.26, 0.26):
        for i in range(2):
            sg.add(bm_box(0.018, 0.045 if i % 2 else 0.018, 0.1), "iron", M((sx + u, sy, sz - 0.03 - i * 0.09)))
    sg.add(bm_prism(rounded(w + 0.08, h + 0.08, 0.08), 0.05), "wood_dark", M((sx, sy, zc)))
    sg.add(bm_prism(rounded(w, h, 0.06), 0.07), "wood_light", M((sx, sy, zc)))
    anvil = [(-0.2, 0.06), (0.16, 0.06), (0.2, 0.1), (0.2, 0.0), (0.08, -0.03), (0.06, -0.1), (0.13, -0.15),
             (-0.13, -0.15), (-0.06, -0.1), (-0.08, -0.03), (-0.16, 0.0), (-0.28, 0.04)]
    sg.add(bm_prism(anvil, 0.02), "iron", M((sx, sy - 0.045, zc - 0.02)))
    sg.add(bm_box(0.04, 0.02, 0.2), "wood_dark", M((sx + 0.12, sy - 0.05, zc + 0.12), (0, -35, 0)))
    sg.add(bm_box(0.1, 0.025, 0.05), "iron", M((sx + 0.06, sy - 0.055, zc + 0.2), (0, -35, 0)))
    extra.append((sg, tuple(SIGN_PIVOT)))
    # lucky horseshoe over the lintel, open end up
    horseshoe(p, (0, -2.19, 3.42), (1, 0, 0), (0, 0, 1), r=0.12, t=0.024, up=True)
    for x in (-0.11, 0.11):
        p.box((0.03, 0.03, 0.03), (x, -2.2, 3.39), "iron_light")
    # the Vane Company crate, crest crossed out in chalk, full of kindling
    cm = M((-3.6, -2.6, 0), (0, 0, 12))
    cw, cd, ch = 0.56, 0.48, 0.44
    p.add(bm_box(cw, cd, 0.04), "wood_mid", cm @ M((0, 0, 0.02)))
    for (dx, dy, sxz) in ((0, -cd / 2, (cw, 0.04)), (0, cd / 2, (cw, 0.04)), (-cw / 2, 0, (0.04, cd)), (cw / 2, 0, (0.04, cd))):
        for z in (0.11, 0.33):
            p.add(bm_box(sxz[0], sxz[1], 0.2), rnd.choice(["wood_light", "wood"]), cm @ M((dx, dy, z)))
    p.add(bm_box(0.2, 0.012, 0.2), "vane", cm @ M((0, -cd / 2 - 0.022, 0.24), (0, 45, 0)))
    for a in (20, -20):
        p.add(bm_box(0.025, 0.01, 0.13), "ink", cm @ M((0.025 * (1 if a > 0 else -1), -cd / 2 - 0.03, 0.24), (0, a, 0)))
    for a in (40, -40):
        p.add(bm_box(0.36, 0.008, 0.03), "white", cm @ M((0, -cd / 2 - 0.036, 0.24), (0, a, 0)))
    for i in range(9):
        q = cm @ Vector((rnd.uniform(-0.18, 0.18), rnd.uniform(-0.14, 0.14), 0.2))
        rod(p, q, q + Vector((rnd.uniform(-0.12, 0.12), rnd.uniform(-0.12, 0.12), 0.45)), 0.022, rnd.choice(["wood_light", "wood"]), 4)
    p.add(bm_box(cw, 0.04, cd), "wood_light", M((-3.98, -2.42, 0.25), (0, -18, 100)))
    # Vane's plan pinned to the right wall inside: drain the pond, quarry the hills
    xw = X1 - WALL_T - 0.006
    my, mz = 1.15, 1.85
    p.box((0.012, 0.56, 0.4), (xw, my, mz), "paper", rot=(3, 0, 0))
    p.add(bm_cyl(0.1, 0.1, 0.006, 12), "water", M((xw - 0.006, my - 0.1, mz - 0.07), (0, -90, 0), scale=(1, 1.5, 1)))
    for dy, hh in ((0.09, 0.13), (0.17, 0.18), (0.24, 0.11)):
        p.add(bm_prism([(-0.07, 0), (0.07, 0), (0, hh)], 0.006), "grass_dark", M((xw - 0.008, my + dy - 0.05, mz - 0.06), (0, 0, 90)))
    for cy, cz in ((my - 0.1, mz - 0.07), (my + 0.12, mz + 0.06)):
        for a in (40, -40):
            p.box((0.006, 0.12, 0.02), (xw - 0.013, cy, cz), "cloth", rot=(a, 0, 0))
    for dy, dz in ((-0.25, 0.17), (0.25, 0.17), (0.25, -0.17)):
        p.box((0.02, 0.025, 0.025), (xw - 0.01, my + dy, mz + dz), "iron")
    p.box((0.1, 0.02, 0.03), (xw - 0.05, my - 0.25, mz - 0.17), "iron_light")
    rod(p, (xw - 0.1, my - 0.25, mz - 0.17), (xw - 0.22, my - 0.25, mz - 0.17), 0.022, "wood_dark", 5)
    # flower pots by the front
    petals = ["petal_pink", "petal_white", "petal_yellow", "petal_purple", "petal_pink"]
    for i, (x, y, s) in enumerate(((2.75, -2.98, 1.0), (2.35, -3.12, 0.8), (-2.75, -2.98, 0.9))):
        p.add(bm_lathe([(0.13 * s, 0), (0.18 * s, 0.24 * s), (0.2 * s, 0.26 * s), (0.17 * s, 0.27 * s)], 9, cap_top=False), "roof_mid",
              M((x, y, 0)))
        p.add(jitter(bm_ico(0.17 * s, 1), 0.03, 70 + i), rnd.choice(["grass", "grass_dark"]), M((x, y, 0.3 * s), scale=(1.1, 1.1, 0.8)))
        for k in range(4):
            a = TAU * k / 4 + i
            p.add(bm_ico(0.045, 0), petals[(i + k) % 5], M((x + 0.12 * s * math.cos(a), y + 0.12 * s * math.sin(a), 0.36 * s)))


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06, stage_07, stage_08,
          stage_09, stage_10, stage_11, stage_12, stage_13, stage_14, stage_15]


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
        for item in extra:
            if item[0] == "EMPTY":
                common.empty(item[1], model, parent=node, loc=item[2])
            else:
                objs.append(item[0].to_object(model, parent=node, origin=item[1]))
        stages.append((node, objs))
    m = common.bpy.data.materials.get("water")
    if m:
        m.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.15
    return stages


def report(stages):
    bpy = common.bpy
    bpy.context.view_layer.update()
    meshes = [o for _, objs in stages for o in objs]
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    print("BOUNDS x %.2f..%.2f  y %.2f..%.2f  z %.2f..%.2f" % (lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    for n, objs in stages:
        print("%s: %s tris, children %s" % (n.name, common.tris(objs), [c.name for c in n.children]))
    for name in ("smoke", "bellows_lever", "sign"):
        o = bpy.data.objects[name]
        print("SPECIAL %s at %s parent %s" % (name, tuple(round(v, 3) for v in o.matrix_world.translation), o.parent.name))
    glow = [o.name for o in meshes if "glow" in [m.name for m in o.data.materials]]
    print("GLOW in", glow)


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    report(stages)
    print("TOTAL TRIS", sum(counts.values()))
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)   # meadow occludes the bake
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("forge.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=6.0)
            common.render(os.path.join(common.OUT_PREV, "forge_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-28, elev=15, lens=40, margin=0.9)
    common.render(os.path.join(common.OUT_PREV, "forge.png"))
    common.save_blend("forge")
    print("RESULT", {"tris": counts, "total": sum(counts.values())})
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
