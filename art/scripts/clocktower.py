"""The Clock Tower: a slim square stone tower with a big clock face on the front, a slate spire,
a bell, and Tock's lean-to tinker's workshop on the -X side, in 14 cumulative stages
(stage_01 .. stage_14). See art/specs/clocktower.md.

Run headless:  powershell -NoProfile -ExecutionPolicy Bypass -File art/blender.ps1 art/scripts/clocktower.py
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

Sides of the square tower are frames turned about Z: 0 = front (-Y), 90 = +X, 180 = back, 270 = -X.
In a side frame local x (u) runs along the wall, the wall face is at local y = -W, z is height.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, bm_uv, jitter, add_lantern
import bmesh
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", os.environ.get("CLOCKTOWER_STAGES", "1") == "1")
TAU = 2 * math.pi

# extra colours for this model (added at run time, common.py stays untouched)
common.PALETTE.update({
    "brass": "#B39250", "brass_dark": "#8C7140", "copper": "#A86A48", "dial": "#E6DDC6",
    "slate": "#66707A", "slate_dark": "#4D555E", "slate_light": "#7E8790",
})

# ------------------------------------------------------------------ dimensions
PLINTH = 2.0             # plinth half width, top at BASE_Z
BASE_Z = 0.5
SHAFT_TOP = 7.8          # top of the shaft stonework
W_C = 1.6                # clock chamber half width (8.1 .. 11.0)
CH_Z0, CH_Z1 = 8.1, 11.0
CORNICE = (11.0, 11.25, 1.76)
DEPTH = 0.42             # wall stone depth
CLOCK_Z = 9.55
DIAL_Y = -W_C - 0.08     # dial surface
CLOCK = Vector((0.0, DIAL_Y - 0.02, CLOCK_Z))   # pivot of both hands
SPIRE = [(1.98, 11.25), (1.62, 11.55), (0.07, 13.5)]
BELL_PIVOT = Vector((0.0, 0.0, 10.38))
SIDES = (0, 90, 180, 270)

# workshop lean-to on the -X side
FLOOR = 0.45
WS_XO, WS_XI, WS_Y = -4.15, -2.15, 1.75      # post lines
SLOPE = 0.49                                  # roof rise per metre toward the tower
ROOF_HI_X, ROOF_HI_Z, EAVE_X = -1.555, 4.0, -4.5
ALPHA = math.degrees(math.atan(SLOPE))
G1 = Vector((-2.62, -1.86, 2.9))              # gear_01 centre (16 teeth)
G2_TEETH, G1_TEETH = 10, 16


def W(z):
    """Shaft half width at height z (slight batter, 1.62 at the base to 1.48 at the top)."""
    return 1.62 - 0.14 * (min(max(z, BASE_Z), SHAFT_TOP) - BASE_Z) / (SHAFT_TOP - BASE_Z)


def zr(x):
    """Workshop roof surface height at x."""
    return ROOF_HI_Z - (ROOF_HI_X - x) * SLOPE


def F(side):
    return M((0, 0, 0), (0, 0, side))


def make_courses(z0, z1, n, seed):
    rnd = random.Random(seed)
    h = (z1 - z0) / n
    zs = [z0] + [z0 + h * i + rnd.uniform(-0.03, 0.03) for i in range(1, n)] + [z1]
    return list(zip(zs, zs[1:]))


LOW = make_courses(BASE_Z, 4.2, 8, 11)
MID = make_courses(4.42, SHAFT_TOP, 7, 12)
CHAMBER = make_courses(CH_Z0, CH_Z1, 7, 13)
COURSES = LOW + MID + CHAMBER

# openings (side, u, half width, z0, z1); holes snap to whole courses
DOOR = (0, 0.0, 0.55, BASE_Z, 2.55)
WINDOWS = [(0, 0.0, 0.2, 5.2, 6.3), (270, 0.35, 0.18, 5.0, 5.9), (90, 0.3, 0.2, 1.6, 2.5),
           (90, -0.25, 0.18, 5.6, 6.5), (180, 0.0, 0.2, 3.0, 3.9)]
BELFRY = [(s, 0.0, 0.42, 8.6, 10.45) for s in (90, 180, 270)]
OPENINGS = [DOOR] + WINDOWS + BELFRY


def blocks_course(op, z0, z1):
    return op[3] < z1 - 0.06 and op[4] > z0 + 0.06


def hole(op):
    zs = [(a, b) for a, b in COURSES if blocks_course(op, a, b)]
    return zs[0][0], zs[-1][1]


def subtract(lo, hi, blocked):
    free, t = [], lo
    for a, b in sorted(blocked):
        if a > t:
            free.append((t, min(a, hi)))
        t = max(t, b)
    if t < hi:
        free.append((t, hi))
    return [(a, b) for a, b in free if b - a > 0.02]


def wall_square(p, rnd, courses, wfun, depth, openings, cols, quoin="stone_light", bevel=0.0, jit=0.018,
                wrange=(0.55, 0.95), gap=0.035, core=True):
    """Square ring of stone courses; corners interleave course by course (quoins)."""
    for ci, (z0, z1) in enumerate(courses):
        w = wfun((z0 + z1) / 2)
        zc, h = (z0 + z1) / 2, z1 - z0
        for side in SIDES:
            full = (ci % 2 == 0) == (side in (0, 180))
            lo, hi = (-w, w) if full else (-w + depth, w - depth)
            blocked = [(op[1] - op[2], op[1] + op[2]) for op in openings if op[0] == side and blocks_course(op, z0, z1)]
            free = subtract(lo, hi, blocked)
            base = F(side)
            for a, b in free:
                if core:
                    p.add(bm_box(b - a, 0.2, h), "stone_dark", base @ M(((a + b) / 2, -w + 0.22, zc)))
                length, t, widths = b - a, 0.0, []
                while length - t > 1e-3:
                    bw = rnd.uniform(*wrange)
                    if length - t - bw < wrange[0] * 0.55:
                        bw = length - t
                    widths.append(bw)
                    t += bw
                u = a
                for k, bw in enumerate(widths):
                    d = depth + rnd.uniform(-0.02, 0.03)
                    corner = full and ((k == 0 and abs(a + w) < 1e-6) or (k == len(widths) - 1 and abs(b - w) < 1e-6))
                    bm = bm_box(bw - gap, d, h - gap, bevel=bevel)
                    if jit:
                        jitter(bm, jit, rnd.randint(0, 9999))
                    col = quoin if corner and quoin else rnd.choice(cols)
                    p.add(bm, col, base @ M((u + bw / 2, -w + d / 2 - rnd.uniform(0.0, 0.02), zc)))
                    u += bw


SHAFT_COLS = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid", "stone_warm"]


def arch_pts(r, zc, n, a0=0.0, a1=math.pi):
    return [(r * math.cos(a0 + (a1 - a0) * k / n), zc + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def arch(p, rnd, op, w, depth=DEPTH):
    """Round arch over an opening: spandrel fill up to the course line and a ring of voussoirs."""
    side, u, hw, z0, top = op
    zc = top - hw
    hz1 = hole(op)[1]
    base = F(side) @ M((u, 0, 0))
    for s in (-1, 1):
        pts = [(s * (hw + 0.04), zc), (s * (hw + 0.04), hz1), (0.0, hz1)] + \
              [(s * hw * math.cos(math.pi / 2 * k / 6), zc + hw * math.sin(math.pi / 2 * k / 6)) for k in range(6, -1, -1)][1:-1]
        p.add(bm_prism(pts, depth - 0.04), "stone_mid", base @ M((0, -w + depth / 2, 0)))
    n = 9
    for k in range(n):
        a0, a1 = math.pi * k / n + 0.012, math.pi * (k + 1) / n - 0.012
        ro = hw + (0.28 if k == n // 2 else 0.22)
        pts = arch_pts(hw, zc, 2, a0, a1) + list(reversed(arch_pts(ro, zc, 2, a0, a1)))
        p.add(bm_prism(pts, 0.2), "stone_light" if k == n // 2 else rnd.choice(["stone", "stone_light", "stone"]),
              base @ M((0, -w + 0.04, 0)))
    return zc


def gear_ring(r_tip, teeth, depth, tooth=0.065, r_in=None, phase=0.0):
    """Toothed ring in the XZ plane (axle along Y), with a round hole for spokes."""
    bm = bmesh.new()
    r_root = r_tip - tooth
    r_in = r_in or r_root * 0.74
    outer = []
    for k in range(teeth):
        for f, rr in ((0.0, r_root), (0.25, r_tip), (0.5, r_tip), (0.75, r_root)):
            a = phase + TAU * (k + f) / teeth
            outer.append((rr * math.cos(a), rr * math.sin(a), a))
    of = [bm.verts.new((x, -depth / 2, z)) for x, z, _ in outer]
    ob = [bm.verts.new((x, depth / 2, z)) for x, z, _ in outer]
    inf = [bm.verts.new((r_in * math.cos(a), -depth / 2, r_in * math.sin(a))) for _, _, a in outer]
    inb = [bm.verts.new((r_in * math.cos(a), depth / 2, r_in * math.sin(a))) for _, _, a in outer]
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((of[i], of[j], inf[j], inf[i]))
        bm.faces.new((ob[i], inb[i], inb[j], ob[j]))
        bm.faces.new((of[i], ob[i], ob[j], of[j]))
        bm.faces.new((inf[i], inf[j], inb[j], inb[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def gear(part, matrix, r_tip, teeth, depth=0.08, mat="brass", hub_mat="brass_dark", phase=0.0, spokes=3, tooth=0.065):
    """Ring + spokes + hub, centred on `matrix` with its axle along local Y. Small gears are solid."""
    if r_tip < 0.2:
        r_root = r_tip - tooth
        pts = [((r_root, r_tip, r_tip, r_root)[i] * math.cos(phase + TAU * (k + f) / teeth),
                (r_root, r_tip, r_tip, r_root)[i] * math.sin(phase + TAU * (k + f) / teeth))
               for k in range(teeth) for i, f in enumerate((0.0, 0.25, 0.5, 0.75))]
        part.add(bm_prism(pts, depth), mat, matrix)
        part.add(bm_cyl(r_tip * 0.3, r_tip * 0.3, depth * 1.4, 6), hub_mat, matrix @ M((0, depth * 0.7, 0), (90, 0, 0)))
        return
    part.add(gear_ring(r_tip, teeth, depth, tooth, phase=phase), mat, matrix)
    r_in = (r_tip - tooth) * 0.74
    for k in range(spokes):
        part.add(bm_box(2 * r_in + 0.02, depth * 0.7, max(0.05, r_tip * 0.13)), mat, matrix @ M((0, 0, 0), (0, 180 / spokes * k + 15, 0)))
    part.add(bm_cyl(r_tip * 0.2, r_tip * 0.2, depth * 1.4, 8), hub_mat, matrix @ M((0, depth * 0.7, 0), (90, 0, 0)))


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, stakes and string for the tower square and the workshop, the plan and a pocket watch."""
    pts = []
    cx, cy, hx, hy = -1.2, -0.3, 3.75, 2.9
    for i in range(40):
        a = TAU * i / 40
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** 4 + abs(s) ** 4) ** 0.25) * (1 + rnd.uniform(-0.03, 0.03))
        pts.append((cx + c * r * hx, cy + s * r * hy))
    p.add(bm_slab(pts, 0.03), "dirt")
    tower = [(-1.65, -1.65), (1.65, -1.65), (1.65, 1.65), (-1.65, 1.65)]
    shop = [(-4.2, -1.75), (-4.2, 1.75)]
    for k, (x, y) in enumerate(tower + shop):
        p.box((0.08, 0.08, 0.36), (x, y, 0.18), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        if k % 2 == 0:
            p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.44)))
    lines = list(zip(tower, tower[1:] + tower[:1])) + [((-1.65, -1.65), shop[0]), (shop[0], shop[1]), (shop[1], (-1.65, 1.65))]
    for (x0, y0), (x1, y1) in lines:
        length = math.hypot(x1 - x0, y1 - y0)
        p.box((length, 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, 0.29), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # the plan: a tall tower with a clock, held down by pebbles, and Tock's pocket watch on it
    px, py, pr = 2.3, -1.95, -8
    p.box((0.5, 0.66, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    p.add(bm_box(0.1, 0.36, 0.004), "tunic", base @ M((0, -0.02, 0)))
    p.add(bm_cyl(0.05, 0.05, 0.004, 10), "tunic", base @ M((0, 0.1, 0.001)))
    p.add(bm_box(0.14, 0.12, 0.004), "tunic", base @ M((0, 0.22, 0), (0, 0, 45)))
    for i, (dx, dy) in enumerate(((-0.22, -0.28), (0.2, 0.3))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    wm = M((px + 0.16, py - 0.18, 0.05))
    p.add(bm_cyl(0.075, 0.075, 0.025, 12), "brass", wm)
    p.add(bm_cyl(0.06, 0.06, 0.005, 12), "dial", wm @ M((0, 0, 0.025)))
    p.add(bm_box(0.008, 0.045, 0.004), "ink", wm @ M((0, 0.018, 0.031)))
    p.add(bm_tube([(0.0, 0.075, 0.015), (0.0, 0.11, 0.015)], 0.012, 5), "brass", wm)
    p.add(bm_tube([(0.0, 0.11, 0.012), (-0.1, 0.2, 0.01), (-0.24, 0.22, 0.01)], 0.006, 4, cap=False), "brass", wm)
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (-1.8, -2.95, 0.05), "wood_light", segs=6, rot=(0, 90, 0))
    p.box((0.24, 0.15, 0.15), (-1.25, -2.95, 0.085), "wood_mid", bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (-0.2, 2.3 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    p.box((0.03, 0.32, 0.09), (-0.2, 2.4, 0.06), "white", rot=(0, 0, 8))
    for i in range(6):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.4, 1.4)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a), 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Square stone plinth of big rounded blocks with a flagstone floor, front steps."""
    p.box((2 * PLINTH - 0.1, 2 * PLINTH - 0.1, 0.48), (0, 0, 0.24), "stone_dark")
    wall_square(p, rnd, [(0.0, 0.25), (0.25, BASE_Z)], lambda z: PLINTH, 0.5, [], ["stone", "stone", "stone_mid", "stone_light"],
                quoin="stone_light", bevel=0.035, jit=0.0, wrange=(0.9, 1.3), gap=0.03, core=False)
    for i in range(12):
        x, y = rnd.uniform(-1.2, 1.2), rnd.uniform(-1.2, 1.2)
        p.box((rnd.uniform(0.45, 0.7), rnd.uniform(0.35, 0.55), 0.03), (x, y, BASE_Z - 0.005),
              rnd.choice(["stone_light", "stone", "stone_light"]), rot=(0, 0, rnd.uniform(0, 90)))
    p.box((1.6, 0.42, 0.33), (0, -PLINTH - 0.2, 0.165), "stone", bevel=0.04)
    p.box((1.9, 0.4, 0.17), (0, -PLINTH - 0.55, 0.085), "stone_light", bevel=0.04)
    # dressed stones waiting on the plinth (inside the wall line from stage 3 on)
    for i, (x, y, z) in enumerate(((0.75, 0.9, 0), (1.05, 0.55, 0), (0.9, 0.72, 0.22))):
        p.box((0.5, 0.3, 0.22), (x, y, BASE_Z + 0.11 + z), rnd.choice(SHAFT_COLS), rot=(0, 0, 35 + rnd.uniform(-10, 10)), bevel=0.03)


def stage_03(p, rnd, extra):
    """Lower shaft to 4.2 m with the door hole, a ladder up the right side and a mortar tub."""
    wall_square(p, rnd, LOW, W, DEPTH, OPENINGS, SHAFT_COLS)
    w = W(4.1) - DEPTH + 0.05
    for i in range(6):
        p.box((2 * w, 2 * w / 6 - 0.02, 0.05), (0, -w + (i + 0.5) * 2 * w / 6, 4.12), rnd.choice(["wood", "wood_mid"]))
    # ladder against the +X side
    bot, top = Vector((2.55, 0.85, 0.0)), Vector((W(4.0) + 0.05, 0.85, 4.25))
    d = top - bot
    tilt = math.degrees(math.atan2(d.x, d.z))
    for s in (-1, 1):
        p.box((0.07, 0.06, d.length), (bot.x + d.x / 2, 0.85 + s * 0.24, d.z / 2), "wood_light", rot=(0, tilt, 0))
    for k in range(1, 12):
        q = bot + d * (k / 12)
        p.box((0.04, 0.5, 0.04), (q.x, 0.85, q.z), "wood_light")
    # mortar tub with a trowel and a little stack of dressed stones
    tx, ty = 2.45, -0.9
    p.add(bm_lathe([(0.24, 0), (0.3, 0.26), (0.3, 0.28), (0.27, 0.28), (0.21, 0.04)], 10, cap_top=False), "wood_mid",
          M((tx, ty, 0)))
    p.cyl(0.26, 0.02, (tx, ty, 0.2), "stone_light", segs=10)
    for hz in (0.06, 0.21):
        p.cyl(0.28 + hz * 0.2, 0.03, (tx, ty, hz), "iron", segs=10)
    p.box((0.16, 0.1, 0.012), (tx + 0.08, ty - 0.02, 0.235), "iron", rot=(0, -20, 30))
    p.cyl(0.018, 0.16, (tx + 0.02, ty - 0.06, 0.25), "wood_dark", segs=5, rot=(0, -60, 30))


def stage_04(p, rnd, extra):
    """String course at 4.2 m, the upper shaft to 7.8 m and a plank floor on top."""
    wall_square(p, rnd, [(4.2, 4.42)], lambda z: W(z) + 0.08, 0.34, [], ["stone_light", "stone_light", "stone"],
                quoin=None, jit=0.01, wrange=(0.6, 0.95), core=False)
    wall_square(p, rnd, MID, W, DEPTH, OPENINGS, SHAFT_COLS)
    w = W(SHAFT_TOP) - DEPTH + 0.05
    for i in range(6):
        p.box((2 * w, 2 * w / 6 - 0.02, 0.05), (0, -w + (i + 0.5) * 2 * w / 6, SHAFT_TOP - 0.03), rnd.choice(["wood", "wood_mid"]))


def stage_05(p, rnd, extra):
    """Arched green plank door with voussoirs and iron straps, threshold."""
    w = W(1.5)
    hw = DOOR[2]
    zc = arch(p, rnd, DOOR, W(2.3))
    yd = -w + 0.3
    back = [(-hw, BASE_Z), (hw, BASE_Z)] + arch_pts(hw, zc, 12)
    p.add(bm_prism(back, 0.05), "wood_dark", M((0, yd + 0.05, 0)))

    def arch_top(u):
        return zc + math.sqrt(max(hw * hw - u * u, 0.0))
    for i in range(5):
        a, b = -hw + 2 * hw * i / 5 + 0.012, -hw + 2 * hw * (i + 1) / 5 - 0.012
        pts = [(a, BASE_Z + 0.01), (b, BASE_Z + 0.01)] + [(b - (b - a) * k / 3, arch_top(b - (b - a) * k / 3)) for k in range(4)]
        p.add(bm_prism(pts, 0.07), "door", M((0, yd, 0)))
    for z in (1.0, 2.0):
        p.box((0.9, 0.03, 0.08), (-0.08, yd - 0.05, z), "iron")
        p.cyl(0.05, 0.03, (-0.5, yd - 0.04, z), "iron", segs=8, rot=(90, 0, 0))
    p.add(bm_tube([(0.3 + 0.07 * math.cos(TAU * k / 10), yd - 0.07, 1.4 + 0.07 * math.sin(TAU * k / 10)) for k in range(11)],
                  0.014, 5), "iron")
    p.cyl(0.035, 0.04, (0.3, yd - 0.04, 1.47), "iron", segs=8, rot=(90, 0, 0))
    p.box((1.25, 0.36, 0.05), (0, -w + 0.12, BASE_Z + 0.02), "stone_light", bevel=0.015)


def slit_window(p, rnd, op, flowers=False):
    side, u, hw, z0, z1 = op
    hz0, hz1 = hole(op)
    zm, h = (hz0 + hz1) / 2, hz1 - hz0
    w = W(zm)
    base = F(side) @ M((u, 0, 0))
    rf = w - 0.14
    f = 0.07

    def lb(size, loc, matname):
        p.add(bm_box(*size), matname, base @ M(loc))
    for s in (-1, 1):
        lb((f, 0.14, h), (s * (hw - f / 2), -rf, zm), "wood_light")
    for zz in (hz0 + f / 2, hz1 - f / 2):
        lb((2 * hw, 0.14, f), (0, -rf, zz), "wood_light")
    lb((2 * hw - 2 * f, 0.03, h - 2 * f), (0, -rf + 0.03, zm), "glass")
    lb((2 * hw - 2 * f, 0.06, 0.04), (0, -rf - 0.01, zm), "wood_light")
    lb((2 * hw + 0.24, 0.26, 0.08), (0, -w - 0.06, hz0 - 0.02), "stone_light")
    lb((2 * hw + 0.3, 0.16, 0.18), (0, -w - 0.02, hz1 + 0.07), "stone_light")
    if flowers:
        bw = 2 * hw + 0.36
        lb((bw, 0.22, 0.2), (0, -w - 0.16, hz0 - 0.16), "wood_mid")
        petals = ["petal_pink", "petal_white", "petal_yellow", "petal_purple"]
        for i in range(3):
            uu = -bw / 2 + 0.1 + i * (bw - 0.2) / 2
            p.add(jitter(bm_ico(0.11, 1), 0.02, i), rnd.choice(["grass", "grass_dark"]),
                  base @ M((uu, -w - 0.17, hz0 - 0.03), scale=(1.1, 0.9, 0.8)))
        for i in range(4):
            uu = -bw / 2 + 0.08 + i * (bw - 0.16) / 3
            p.add(bm_ico(0.045, 0), petals[i], base @ M((uu, -w - 0.22 + rnd.uniform(-0.04, 0.04), hz0 + rnd.uniform(0.02, 0.08))))


def stage_06(p, rnd, extra):
    """Slit windows up the shaft (frames, panes, stone sills and lintels), a flower box on the front one."""
    for i, op in enumerate(WINDOWS):
        slit_window(p, rnd, op, flowers=(i == 0))


def stage_07(p, rnd, extra):
    """Clock chamber: corbelled band, wider stone walls with three belfry arches, the round dial
    surround on the front, a cornice, and the chamber floor."""
    for side in SIDES:
        base = F(side)
        for u in (-1.0, 0.0, 1.0):
            for k, (dz, dy, wd) in enumerate(((0.0, 0.05, 0.26), (0.13, 0.14, 0.3))):
                p.add(bm_box(wd, 0.3, 0.14), "stone_light" if k else "stone", base @ M((u, -W(7.6) - dy + 0.1, 7.56 + dz)))
    wall_square(p, rnd, [(SHAFT_TOP, CH_Z0)], lambda z: W_C + 0.06, 0.4, [], ["stone_light", "stone", "stone_light"],
                quoin=None, jit=0.01, wrange=(0.6, 0.95), core=False)
    wall_square(p, rnd, CHAMBER, lambda z: W_C, 0.4, BELFRY, ["stone_warm", "stone", "stone_light", "stone_warm", "stone_mid"])
    for op in BELFRY:
        arch(p, rnd, op, W_C, 0.4)
        hz0 = hole(op)[0]
        p.add(bm_box(2 * op[2] + 0.22, 0.5, 0.09), "stone_light", F(op[0]) @ M((0, -W_C + 0.17, hz0 + 0.02)))
    wall_square(p, rnd, [CORNICE[:2]], lambda z: CORNICE[2], 0.45, [], ["stone_light", "stone_light", "stone"],
                quoin=None, jit=0.008, wrange=(0.6, 0.95), core=False)
    p.box((2 * (CORNICE[2] - 0.3), 2 * (CORNICE[2] - 0.3), 0.08), (0, 0, CORNICE[1] - 0.04), "wood_dark")
    # dial surround: a ring of 16 light stones with a dark wooden backing disc
    yf = -W_C
    p.add(bm_cyl(1.14, 1.14, 0.03, 24), "wood_dark", M((0, yf, CLOCK_Z), (90, 0, 0)))
    n = 16
    for k in range(n):
        a0, a1 = TAU * k / n + 0.01, TAU * (k + 1) / n - 0.01
        ro = 1.4 if k % 4 else 1.46
        pts = arch_pts(1.14, CLOCK_Z, 2, a0, a1) + list(reversed(arch_pts(ro, CLOCK_Z, 2, a0, a1)))
        p.add(bm_prism(pts, 0.18), "stone_light" if k % 4 == 0 else rnd.choice(["stone_light", "stone_warm"]), M((0, yf - 0.02, 0)))
    # chamber floor
    w = W_C - 0.4 + 0.05
    p.box((2 * w, 2 * w, 0.06), (0, 0, CH_Z0 - 0.03), "wood_mid")


def slope_tiles(p, rnd, h0, z0, h1, z1, rows, tw, cols, out=0.035):
    """Rows of slate tiles on the four faces of a square pyramid frustum."""
    a = math.atan2(z1 - z0, h0 - h1)
    slen = math.hypot(z1 - z0, h0 - h1)
    tilt = -(90 - math.degrees(a))
    for side in SIDES:
        base = F(side)
        for k in range(rows):
            za, zb = z0 + (z1 - z0) * k / rows, z0 + (z1 - z0) * (k + 1) / rows
            hm = h0 + (h1 - h0) * (k + 0.5) / rows
            zm = (za + zb) / 2
            L = slen / rows + 0.08
            u = -hm - (rnd.uniform(0.05, tw[0]) if k % 2 else 0.0)
            while u < hm - 0.03:
                bw = rnd.uniform(*tw)
                u0, u1 = max(u, -hm), min(u + bw, hm)
                if u1 - u0 > 0.06:
                    y = -hm - out * math.sin(a) + rnd.uniform(-0.008, 0.008)
                    z = zm + out * math.cos(a)
                    p.add(bm_box(u1 - u0 - 0.025, 0.045, L), rnd.choice(cols),
                          base @ M(((u0 + u1) / 2, y, z), (tilt + rnd.uniform(-2, 2), 0, 0)))
                u += bw


def stage_08(p, rnd, extra):
    """Steep slate spire with flared eaves, iron hip rolls and a brass ball finial."""
    cols = ["slate", "slate", "slate_light", "slate_dark", "slate"]
    p.add(bm_lathe([(h * math.sqrt(2) - 0.04, z) for h, z in SPIRE], 4), "slate_dark", M((0, 0, 0), (0, 0, 45)))
    (h0, z0), (h1, z1), (h2, z2) = SPIRE
    slope_tiles(p, rnd, h0, z0, h1, z1, 2, (0.32, 0.46), cols)
    slope_tiles(p, rnd, h1, z1, h2 + 0.1, z2 - 0.1, 7, (0.32, 0.46), cols)
    for side in SIDES:
        base = F(side)
        p.add(bm_tube([(h0 + 0.03, -h0 - 0.03, z0 + 0.02), (h1 + 0.04, -h1 - 0.04, z1 + 0.03), (0.08, -0.08, z2 - 0.05)],
                      0.045, 5), "iron", base)
        p.add(bm_box(2 * h0 + 0.06, 0.06, 0.08), "wood_dark", base @ M((0, -h0 - 0.02, z0 - 0.03)))
    p.cyl(0.12, 0.2, (0, 0, z2 - 0.08), "iron", r2=0.06, segs=8)
    p.ball(0.15, (0, 0, z2 + 0.24), "brass", uv=(10, 6))
    p.cyl(0.04, 0.3, (0, 0, z2 + 0.35), "iron", segs=6)


def stage_09(p, rnd, extra):
    """The clock: cream dial, brass bezel, hour and minute marks, a sun and a moon, and the two hands
    (objects `hand_hour` and `hand_minute`, origin on the clock centre, pointing at 12)."""
    c = CLOCK
    p.add(bm_cyl(1.03, 1.03, 0.07, 32), "dial", M((0, -W_C - 0.01, CLOCK_Z), (90, 0, 0)))
    ring = [(1.0, 0.0), (1.1, 0.0), (1.12, 0.06), (1.08, 0.12), (1.0, 0.1), (1.0, 0.0)]
    p.add(bm_lathe(ring, 32, cap_bottom=False, cap_top=False), "brass", M((0, -W_C - 0.02, CLOCK_Z), (90, 0, 0)))
    yf = DIAL_Y - 0.01
    for i in range(12):
        a = 30 * i
        big = i % 3 == 0
        r = 0.79 if big else 0.82
        x, z = r * math.sin(math.radians(a)), CLOCK_Z + r * math.cos(math.radians(a))
        p.add(bm_box(0.085 if big else 0.05, 0.02, 0.24 if big else 0.16), "iron", M((x, yf, z), (0, a, 0)))
    p.add(bm_lathe([(0.9, 0.0), (0.92, 0.0), (0.92, 0.012), (0.9, 0.012), (0.9, 0.0)], 32, cap_bottom=False, cap_top=False),
          "iron", M((0, DIAL_Y, CLOCK_Z), (90, 0, 0)))
    # sun above the centre, crescent moon below
    sz = CLOCK_Z + 0.44
    p.add(bm_cyl(0.1, 0.1, 0.012, 12), "brass", M((0, yf + 0.008, sz), (90, 0, 0)))
    for k in range(8):
        a = 45 * k
        p.add(bm_prism([(-0.03, 0.0), (0.03, 0.0), (0.0, 0.08)], 0.012), "brass",
              M((0.105 * math.sin(math.radians(a)), yf, sz + 0.105 * math.cos(math.radians(a))), (0, a, 0)))
    mz = CLOCK_Z - 0.44
    moon = arch_pts(0.12, 0, 8, math.radians(60), math.radians(300)) + \
        list(reversed([(0.045 + 0.095 * math.cos(t), 0.095 * math.sin(t)) for t in
                       [math.radians(70 + 220 * k / 8) for k in range(9)]]))
    p.add(bm_prism(moon, 0.02), "brass", M((-0.02, yf, mz)))
    # hands: built pointing up (12 o'clock); the game turns them about local Y (clockwise = +Y)
    hh = Part("hand_hour")
    pts = [(-0.05, -0.12), (0.05, -0.12), (0.045, 0.3), (0.11, 0.41), (0.0, 0.57), (-0.11, 0.41), (-0.045, 0.3)]
    hh.add(bm_prism(pts, 0.025), "iron", Matrix.Translation(c + Vector((0, -0.015, 0))))
    hh.add(bm_prism([(0.0, 0.33), (0.05, 0.41), (0.0, 0.49), (-0.05, 0.41)], 0.03), "brass",
           Matrix.Translation(c + Vector((0, -0.02, 0))))
    hh.add(bm_cyl(0.085, 0.085, 0.025, 10), "iron", Matrix.Translation(c + Vector((0, -0.0025, 0))) @ M((0, 0, 0), (90, 0, 0)))
    extra.append((hh, tuple(c)))
    hm = Part("hand_minute")
    pts = [(-0.03, -0.22), (0.03, -0.22), (0.026, 0.66), (0.07, 0.69), (0.0, 0.86), (-0.07, 0.69), (-0.026, 0.66)]
    hm.add(bm_prism(pts, 0.022), "iron", Matrix.Translation(c + Vector((0, -0.05, 0))))
    hm.add(bm_cyl(0.065, 0.065, 0.022, 10), "iron", Matrix.Translation(c + Vector((0, -0.039, -0.22))) @ M((0, 0, 0), (90, 0, 0)))
    hm.add(bm_cyl(0.075, 0.05, 0.05, 10), "brass", Matrix.Translation(c + Vector((0, -0.045, 0))) @ M((0, 0, 0), (90, 0, 0)))
    extra.append((hm, tuple(c)))


def stage_10(p, rnd, extra):
    """The bell in its timber frame (object `bell`, pivot on its axle, swings about Y),
    and a serpent weather vane on the spire (object `vane`, turns about Z)."""
    for s in (-1, 1):
        y = s * 0.95
        p.box((0.16, 0.16, BELL_PIVOT.z - CH_Z0 + 0.05), (0, y, (CH_Z0 + BELL_PIVOT.z) / 2), "wood_dark")
        p.box((0.9, 0.14, 0.14), (0, y, CH_Z0 + 0.07), "wood_dark")
        for sx in (-1, 1):
            L = math.hypot(0.35, 0.7)
            p.box((0.09, 0.09, L), (sx * 0.18, y, CH_Z0 + 0.42), "wood_mid", rot=(0, sx * math.degrees(math.atan2(0.35, 0.7)), 0))
        p.box((0.22, 0.26, 0.1), (0, y, BELL_PIVOT.z - 0.02), "iron")
    b = Part("bell")
    bp = BELL_PIVOT
    b.add(bm_box(0.24, 1.75, 0.2), "wood_dark", Matrix.Translation(bp))
    b.add(bm_cyl(0.035, 0.035, 1.95, 6), "iron", Matrix.Translation(bp + Vector((0, 0.975, 0))) @ M((0, 0, 0), (90, 0, 0)))
    prof = [(0.47, 0.0), (0.45, 0.07), (0.37, 0.2), (0.31, 0.44), (0.29, 0.64), (0.23, 0.77), (0.0, 0.81)]
    b.add(bm_lathe(prof, 14), "brass", Matrix.Translation(bp + Vector((0, 0, -0.91))), smooth=True)
    b.add(bm_lathe([(0.48, 0.0), (0.49, 0.04), (0.47, 0.08), (0.46, 0.04)], 14, cap_bottom=False, cap_top=False), "brass_dark",
          Matrix.Translation(bp + Vector((0, 0, -0.91))))
    b.add(bm_cyl(0.025, 0.025, 0.6, 5), "iron", Matrix.Translation(bp + Vector((0, 0, -0.75))))
    b.add(bm_uv(0.07, 8, 5), "iron", Matrix.Translation(bp + Vector((0, 0, -0.8))))
    extra.append((b, tuple(bp)))
    # serpent weather vane
    z2 = SPIRE[2][1]
    vz = z2 + 0.62
    p.ball(0.05, (0, 0, z2 + 0.66), "iron", subdiv=1)
    for ang in (0, 90):
        p.box((0.56, 0.022, 0.022), (0, 0, z2 + 0.7), "iron", rot=(0, 0, ang))
    for k in range(4):
        a = TAU * k / 4
        p.ball(0.032, (0.28 * math.cos(a), 0.28 * math.sin(a), z2 + 0.7), "iron", subdiv=0, smooth=False)
    v = Part("vane")
    vm = Matrix.Translation((0, 0, vz + 0.42))
    v.add(bm_cyl(0.025, 0.025, 0.5, 6), "iron", Matrix.Translation((0, 0, vz)))
    v.add(bm_box(0.95, 0.018, 0.022), "iron", vm)
    v.add(bm_prism([(0.6, 0), (0.43, 0.1), (0.46, 0), (0.43, -0.1)], 0.022), "iron", vm)
    body = []
    for k in range(13):                       # wavy serpent riding the arrow, head at the tail end
        t = k / 12
        body.append((-0.42 + 0.66 * t, 0.07 + 0.06 * math.sin(t * TAU * 1.5)))
    up = [(x, z + 0.008 + 0.024 * k / 12) for k, (x, z) in enumerate(body)]
    dn = [(x, z - 0.008 - 0.024 * k / 12) for k, (x, z) in enumerate(body)]
    v.add(bm_prism(up + list(reversed(dn)), 0.02), "brass", vm)
    hx, hz = body[-1]
    v.add(bm_cyl(0.06, 0.06, 0.025, 8), "brass", vm @ M((hx + 0.04, 0.0125, hz + 0.01), (90, 0, 0)) @ M((0, 0, 0), scale=(1.3, 1, 1)))
    extra.append((v, (0, 0, vz)))


def stage_11(p, rnd, extra):
    """Workshop frame on the -X side: stone piers, a plank floor, posts, tie beams, a wall plate on
    corbels and five rafters, and a little lumber stack."""
    for x in (-4.15, -3.15, -2.2):
        for y in (-1.6, 0.0, 1.6):
            p.add(jitter(bm_box(0.32, 0.32, 0.36), 0.015, int(x * 10 + y * 7)), rnd.choice(["stone", "stone_mid"]), M((x, y, 0.18)))
    for i in range(16):
        y = -1.9 + (i + 0.5) * 3.8 / 16
        p.box((2.32, 3.8 / 16 - 0.018, 0.07), (-3.15 + rnd.uniform(-0.03, 0.03), y, FLOOR - 0.035),
              rnd.choice(["wood", "wood_light", "wood", "wood_mid"]))
    p.box((1.0, 0.32, 0.22), (-3.15, -2.08, 0.11), "stone_light", bevel=0.03)
    for x in (WS_XO, WS_XI):
        for y in (-WS_Y, WS_Y):
            h = zr(x) - 0.17 - FLOOR
            p.add(jitter(bm_box(0.16, 0.16, h), 0.01, int(x * 13 + y)), "wood_mid", M((x, y, FLOOR + h / 2)))
    for y in (-WS_Y, WS_Y):
        p.box((WS_XI - WS_XO + 0.3, 0.14, 0.16), ((WS_XO + WS_XI) / 2, y, 2.45), "wood_dark")
        for x, s in ((WS_XO, 1), (WS_XI, -1)):
            p.box((0.08, 0.1, 0.55), (x + s * 0.22, y, 2.2), "wood_mid", rot=(0, s * 45, 0))
    p.box((0.14, 2 * WS_Y + 0.14, 0.14), (WS_XO, 0, zr(WS_XO) - 0.1), "wood_dark")
    xw = ROOF_HI_X - 0.08
    p.box((0.16, 2 * WS_Y + 0.3, 0.18), (xw, 0, ROOF_HI_Z - 0.17), "wood_dark")
    for y in (-1.3, 0.0, 1.3):
        p.box((0.22, 0.24, 0.16), (ROOF_HI_X - 0.1, y, ROOF_HI_Z - 0.34), "stone_light")
    L = (ROOF_HI_X - EAVE_X) / math.cos(math.radians(ALPHA)) + 0.05
    xm = (ROOF_HI_X + EAVE_X) / 2
    for y in (-WS_Y, -0.875, 0.0, 0.875, WS_Y):
        p.box((L, 0.1, 0.14), (xm, y, zr(xm) - 0.1), "wood_mid", rot=(0, -ALPHA, 0))
    for i in range(5):
        p.box((2.2, 0.22, 0.06), (-3.2 + rnd.uniform(-0.1, 0.1), 2.35 + (i % 3) * 0.24, 0.03 + 0.065 * (i // 3) + 0.0),
              rnd.choice(["wood_light", "wood"]), rot=(0, 0, rnd.uniform(-3, 3)))


def stage_12(p, rnd, extra):
    """Shingled lean-to roof, plank walls (back, side with a shuttered window and a flower box,
    the front gable), and an iron stove whose pipe pokes through the roof (`smoke` empty on top)."""
    L = (ROOF_HI_X - EAVE_X) / math.cos(math.radians(ALPHA))
    xm = (ROOF_HI_X + EAVE_X) / 2
    p.box((L, 2 * WS_Y + 0.4, 0.04), (xm, 0, zr(xm) - 0.01), "wood_dark", rot=(0, -ALPHA, 0))
    rows = 8
    cols = ["shingle", "shingle", "shingle_light", "shingle_dark", "shingle"]
    for k in range(rows):
        xa = EAVE_X + (ROOF_HI_X - EAVE_X) * k / rows
        xb = EAVE_X + (ROOF_HI_X - EAVE_X) * (k + 1) / rows
        xc = (xa + xb) / 2
        sl = (xb - xa) / math.cos(math.radians(ALPHA)) + 0.09
        y = -WS_Y - 0.2 - (rnd.uniform(0.05, 0.2) if k % 2 else 0.0)
        while y < WS_Y + 0.2 - 0.03:
            bw = rnd.uniform(0.3, 0.46)
            y0, y1 = max(y, -WS_Y - 0.2), min(y + bw, WS_Y + 0.2)
            if y1 - y0 > 0.06:
                p.box((sl, y1 - y0 - 0.025, 0.04), (xc, (y0 + y1) / 2, zr(xc) + 0.035 + rnd.uniform(-0.006, 0.006)),
                      rnd.choice(cols), rot=(rnd.uniform(-1.5, 1.5), -ALPHA + rnd.uniform(-1.5, 1.5), 0))
            y += bw
    p.box((0.14, 2 * WS_Y + 0.4, 0.1), (ROOF_HI_X - 0.06, 0, ROOF_HI_Z + 0.05), "stone_dark")
    # back wall (+Y)
    xs = [WS_XO - 0.08 + (ROOF_HI_X + 0.08 - WS_XO) * i / 10 for i in range(11)]
    for xa, xb in zip(xs, xs[1:]):
        xc = (xa + xb) / 2
        h = zr(xc) - 0.06 - FLOOR
        p.box((xb - xa - 0.02, 0.06, h), (xc, WS_Y + 0.05, FLOOR + h / 2), rnd.choice(["wood", "wood_light", "wood_mid"]))
    # outer wall (-X) with a window hole
    win = (-0.42, 0.42, 1.25, 2.05)
    xo = WS_XO - 0.1
    ys = [-WS_Y - 0.08 + (2 * WS_Y + 0.16) * i / 13 for i in range(14)]
    top = zr(xo) - 0.04
    for ya, yb in zip(ys, ys[1:]):
        yc = (ya + yb) / 2
        col = rnd.choice(["wood", "wood_light", "wood_mid"])
        spans = [(FLOOR, top)] if (yb < win[0] or ya > win[1]) else [(FLOOR, win[2]), (win[3], top)]
        for za, zb in spans:
            p.box((0.06, yb - ya - 0.02, zb - za), (xo, yc, (za + zb) / 2), col)
    f = 0.07
    for y in (win[0], win[1]):
        p.box((0.12, f, win[3] - win[2] + f), (xo - 0.02, y, (win[2] + win[3]) / 2), "wood_dark")
    for z in (win[2], win[3]):
        p.box((0.12, win[1] - win[0] + f, f), (xo - 0.02, 0, z), "wood_dark")
    p.box((0.03, win[1] - win[0], win[3] - win[2]), (xo + 0.02, 0, (win[2] + win[3]) / 2), "glass")
    p.box((0.05, 0.04, win[3] - win[2]), (xo - 0.02, 0, (win[2] + win[3]) / 2), "wood_dark")
    p.box((0.05, win[1] - win[0], 0.04), (xo - 0.02, 0, (win[2] + win[3]) / 2), "wood_dark")
    for s, y in ((-1, win[0]), (1, win[1])):
        p.box((0.045, 0.42, win[3] - win[2] - 0.02), (xo - 0.07, y + s * 0.22, (win[2] + win[3]) / 2), "shutter",
              rot=(0, 0, s * 10))
    p.box((0.22, win[1] - win[0] + 0.25, 0.18), (xo - 0.15, 0, win[2] - 0.12), "wood_mid")
    petals = ["petal_pink", "petal_yellow", "petal_white", "petal_pink"]
    for i in range(3):
        y = -0.3 + 0.3 * i
        p.add(jitter(bm_ico(0.11, 1), 0.02, 20 + i), rnd.choice(["grass", "grass_dark"]),
              M((xo - 0.16, y, win[2] - 0.0), scale=(0.9, 1.1, 0.8)))
    for i in range(4):
        p.add(bm_ico(0.045, 0), petals[i], M((xo - 0.24 + rnd.uniform(-0.03, 0.03), -0.33 + 0.22 * i, win[2] + rnd.uniform(0.04, 0.1))))
    # front gable infill above the tie beam
    xs = [WS_XO + (WS_XI + 0.08 - WS_XO) * i / 7 for i in range(8)]
    for xa, xb in zip(xs, xs[1:]):
        xc = (xa + xb) / 2
        za, zb = 2.53, zr(xc) - 0.05
        if zb - za > 0.05:
            p.box((xb - xa - 0.02, 0.06, zb - za), (xc, -WS_Y - 0.03, (za + zb) / 2), rnd.choice(["wood", "wood_light"]))
    # stove and stovepipe
    sx, sy = -3.75, 1.05
    p.box((0.45, 0.45, 0.5), (sx, sy, FLOOR + 0.3), "iron", bevel=0.03)
    for dx in (-0.17, 0.17):
        for dy in (-0.17, 0.17):
            p.box((0.05, 0.05, 0.06), (sx + dx, sy + dy, FLOOR + 0.03), "iron")
    p.box((0.2, 0.02, 0.14), (sx, sy - 0.23, FLOOR + 0.28), "glow")
    pipe_top = zr(sx) + 0.75
    p.cyl(0.07, pipe_top - FLOOR - 0.55, (sx, sy, FLOOR + 0.55), "iron", segs=8)
    p.cyl(0.13, 0.06, (sx, sy, zr(sx) + 0.02), "iron", segs=8)
    p.cyl(0.14, 0.1, (sx, sy, pipe_top), "iron", r2=0.03, segs=8)
    extra.append(("smoke", (sx, sy, pipe_top + 0.15)))


def stage_13(p, rnd, extra):
    """Tock's gears: two meshing brass gears on the gable (`gear_01`, `gear_02`), a drive rod up the
    tower to the clock, the workbench with a vise, a half-built clock and an oil lamp (`glow`),
    tools on a pegboard, a big gear leaning outside and a crate of cogs."""
    phi = math.radians(200)
    d = 0.63
    g2c = G1 + Vector((d * math.cos(phi), 0, d * math.sin(phi)))
    for c, r in ((G1, 0.46), (g2c, 0.3)):
        p.add(bm_cyl(0.07, 0.07, 0.05, 8), "iron", M((c.x, -WS_Y - 0.06, c.z), (90, 0, 0)))
    g1 = Part("gear_01")
    gear(g1, Matrix.Translation(G1), 0.42, G1_TEETH, phase=phi - TAU * 0.375 / G1_TEETH)
    extra.append((g1, tuple(G1)))
    g2 = Part("gear_02")
    gear(g2, Matrix.Translation(g2c), 0.3875 * G2_TEETH / G1_TEETH + 0.0325, G2_TEETH, phase=phi + math.pi - TAU * 0.875 / G2_TEETH,
         mat="copper", hub_mat="brass_dark")
    extra.append((g2, tuple(g2c)))
    # drive rod up the -X face of the tower to a little gearbox under the chamber
    ry = 0.9
    rx = -W(SHAFT_TOP) - 0.16
    p.cyl(0.035, 7.55 - ROOF_HI_Z, (rx, ry, ROOF_HI_Z), "iron", segs=6)
    for z in (4.6, 5.6, 6.6):
        wx = -W(z)
        p.box((abs(rx - wx) + 0.04, 0.06, 0.06), ((rx + wx) / 2, ry, z), "iron")
        p.cyl(0.06, 0.08, (rx, ry, z - 0.04), "iron", segs=8)
    p.box((0.26, 0.3, 0.26), (rx + 0.02, ry, 7.58), "brass_dark", bevel=0.02)
    gear(p, M((rx - 0.05, ry, 7.58), (0, 0, 90)), 0.16, 8, depth=0.04, tooth=0.04)
    # workbench along the back wall
    bx0, bx1, by, bz = -3.45, -2.25, 1.5, FLOOR + 0.9
    p.box((bx1 - bx0, 0.5, 0.07), ((bx0 + bx1) / 2, by, bz), "wood_light", bevel=0.01)
    for x in (bx0 + 0.06, bx1 - 0.06):
        for y in (by - 0.19, by + 0.19):
            p.box((0.07, 0.07, 0.86), (x, y, FLOOR + 0.43), "wood_mid")
    p.box((bx1 - bx0 - 0.1, 0.45, 0.04), ((bx0 + bx1) / 2, by, FLOOR + 0.25), "wood_mid")
    p.box((0.3, 0.2, 0.12), (bx0 + 0.2, by - 0.15, bz + 0.1), "iron", bevel=0.01)
    p.box((0.06, 0.22, 0.14), (bx0 + 0.2, by - 0.3, bz + 0.1), "iron")
    p.cyl(0.015, 0.3, (bx0 + 0.05, by - 0.32, bz + 0.1), "iron", segs=5, rot=(0, 90, 0))
    cm = M((-2.85, by - 0.05, bz + 0.035))
    p.add(bm_cyl(0.2, 0.2, 0.04, 14), "brass", cm)
    p.add(bm_cyl(0.17, 0.17, 0.006, 14), "dial", cm @ M((0, 0, 0.04)))
    gear(p, cm @ M((0.3, 0.05, 0.03), (90, 0, 0)), 0.09, 8, depth=0.03, tooth=0.03)
    gear(p, cm @ M((0.18, -0.14, 0.02), (90, 0, 40)), 0.06, 7, depth=0.025, mat="copper", tooth=0.025)
    lx, ly = bx1 - 0.15, by + 0.1
    p.cyl(0.08, 0.04, (lx, ly, bz + 0.035), "brass_dark", segs=8)
    p.add(bm_lathe([(0.04, 0.0), (0.075, 0.08), (0.07, 0.17), (0.035, 0.24)], 8), "glow", M((lx, ly, bz + 0.07)))
    p.cyl(0.045, 0.03, (lx, ly, bz + 0.31), "brass_dark", segs=8)
    # pegboard with tools and a hanging gear
    p.box((1.1, 0.03, 0.62), (-2.85, WS_Y - 0.01, bz + 0.6), "wood_dark")
    for i, x in enumerate((-3.25, -3.05, -2.85)):
        p.box((0.03, 0.03, 0.26), (x, WS_Y - 0.04, bz + 0.6), "wood_light")
        p.box((0.1 if i == 0 else 0.05, 0.04, 0.05), (x, WS_Y - 0.05, bz + 0.73), "iron")
    p.box((0.05, 0.03, 0.24), (-2.6, WS_Y - 0.04, bz + 0.58), "iron", rot=(0, 20, 0))
    gear(p, M((-2.48, WS_Y - 0.06, bz + 0.7)), 0.14, 9, depth=0.03, tooth=0.035)
    # big spare gear leaning against the outer wall, and a crate of cogs at the front
    gm = M((WS_XO - 0.33, 1.1, 0.51), (0, 18, 0)) @ M((0, 0, 0), (0, 0, 90))
    gear(p, gm, 0.52, 14, depth=0.09, mat="brass_dark", hub_mat="iron", tooth=0.08)
    cx, cy = -3.55, -2.45
    p.box((0.6, 0.45, 0.36), (cx, cy, 0.18), "wood_mid", bevel=0.02)
    for z in (0.08, 0.28):
        p.box((0.62, 0.47, 0.05), (cx, cy, z), "wood_dark")
    for i in range(3):
        gear(p, M((cx + rnd.uniform(-0.2, 0.2), cy + rnd.uniform(-0.13, 0.13), 0.38), (90 + rnd.uniform(-20, 20), 0, rnd.uniform(0, 180))),
             rnd.uniform(0.07, 0.11), rnd.choice((7, 8, 9)), depth=0.03, mat=rnd.choice(["brass", "copper", "brass_dark"]),
             tooth=0.03, spokes=2)


def barrel(p, x, y, s=1.0, rz=0.0):
    prof = [(0.0, 0.0), (0.24, 0.0), (0.29, 0.15), (0.31, 0.32), (0.29, 0.5), (0.24, 0.65), (0.0, 0.65)]
    p.add(bm_lathe([(r * s, z * s) for r, z in prof], 12), "wood", M((x, y, 0), (0, 0, rz)), smooth=True)
    for z, r in ((0.1, 0.27), (0.54, 0.27)):
        p.cyl(r * s + 0.012, 0.045 * s, (x, y, z * s), "iron", segs=12)
    p.cyl(0.22 * s, 0.01, (x, y, 0.65 * s), "wood_dark", segs=12)


def stage_14(p, rnd, extra):
    """Lanterns by the door (`glow`), Tock's hanging gear sign, barrels, a bench and flower pots."""
    za = 2.4
    for s in (-1, 1):
        x = s * 0.98
        w = W(za)
        p.box((0.14, 0.14, 0.28), (x, -w + 0.02, za), "wood_dark")
        p.add(bm_tube([(x, -w - 0.05, za), (x, -w - 0.38, za), (x, -w - 0.45, za - 0.06)], 0.028, 6), "iron")
        add_lantern(p, (x, -w - 0.45, za - 0.79), 1.3, hang=True)
    # hanging sign off the outer front post, facing -X
    px, py, zb = WS_XO, -WS_Y, 2.25
    p.add(bm_tube([(px, py - 0.06, zb), (px, py - 0.72, zb), (px, py - 0.78, zb + 0.05)], 0.025, 6), "iron")
    p.add(bm_tube([(px, py - 0.06, zb - 0.32), (px, py - 0.45, zb)], 0.018, 5), "iron")
    w, h = 0.66, 0.5
    sm = M((px, py - 0.4, zb - 0.42), (0, 0, 90))
    for u in (-0.24, 0.24):
        p.add(bm_box(0.018, 0.018, 0.14), "iron", sm @ M((u, 0, h / 2 + 0.07)))

    def rounded(wd, ht, rr, n=3):
        pts = []
        for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
            for k in range(n + 1):
                a = math.radians(a0 + 90 * k / n)
                pts.append((cxs * (wd / 2 - rr) + rr * math.cos(a), czs * (ht / 2 - rr) + rr * math.sin(a)))
        return pts
    p.add(bm_prism(rounded(w + 0.08, h + 0.08, 0.09), 0.05), "wood_dark", sm)
    p.add(bm_prism(rounded(w, h, 0.07), 0.08), "wood_light", sm)
    for s in (-1, 1):
        gear(p, sm @ M((0.0, s * 0.045, 0.0)), 0.17, 10, depth=0.015, tooth=0.04)
        p.add(bm_box(0.025, 0.012, 0.13), "ink", sm @ M((0.0, s * 0.055, 0.05)))
        p.add(bm_box(0.09, 0.012, 0.025), "ink", sm @ M((0.04, s * 0.055, 0.0)))
    # barrels by the workshop, a bench right of the door, flower pots on the plinth
    barrel(p, -4.75, -2.15)
    barrel(p, -4.95, -1.5, 0.9, 30)
    p.box((0.4, 0.4, 0.03), (-4.75, -2.15, 0.665), "wood_light", rot=(0, 0, 20))
    gear(p, M((-4.72, -2.12, 0.7), (90, 0, 15)), 0.1, 8, depth=0.03, tooth=0.03, mat="copper")
    bx, by = 1.75, -2.6
    p.box((1.2, 0.36, 0.07), (bx, by, 0.45), "wood_light", bevel=0.015)
    for dx in (-0.48, 0.48):
        p.box((0.1, 0.3, 0.42), (bx + dx, by, 0.21), "wood_mid")
    for i, (x, y) in enumerate(((-0.9, -1.82), (0.9, -1.82))):
        p.add(bm_lathe([(0.1, 0.0), (0.15, 0.22), (0.17, 0.24), (0.15, 0.25)], 10), "copper" if i else "roof", M((x, y, BASE_Z)))
        p.add(jitter(bm_ico(0.17, 1), 0.03, 60 + i), "grass_dark", M((x, y, BASE_Z + 0.33), scale=(1, 1, 0.85)))
        for k in range(4):
            a = TAU * k / 4 + i
            p.add(bm_ico(0.045, 0), "petal_pink" if i else "petal_yellow",
                  M((x + 0.12 * math.cos(a), y + 0.12 * math.sin(a), BASE_Z + 0.4 + 0.04 * (k % 2))))


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06, stage_07,
          stage_08, stage_09, stage_10, stage_11, stage_12, stage_13, stage_14]
MOVERS = ("hand_hour", "hand_minute", "gear_01", "gear_02", "bell", "vane")


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
        for xp, origin in extra:
            if isinstance(xp, str):
                common.empty(xp, model, parent=node, loc=origin)
            else:
                objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    movers = [o for o in meshes if o.name in MOVERS]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    common.setup_render((960, 1200))
    common.preview_rig(meshes, azim=-30, elev=20, lens=50, margin=0.9)   # meadow occludes the bake
    # bake each stage with only the stages that exist when it appears; moving parts never occlude
    # anything static, and are baked on their own against the finished surroundings of their stage
    for k in range(1, len(stages) + 1):
        objs_k = stages[k - 1][1]
        statics = [o for o in objs_k if o not in movers]
        moving = [o for o in objs_k if o in movers]
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k or o in movers
        if statics:
            common.bake_ao(statics)
        if moving:
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k or (o in movers and o not in moving)
            common.bake_ao(moving)
    for o in meshes:
        o.hide_render = False
    common.export("clocktower.glb")
    # numbers for the spec
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    print("BBOX", [round(v, 2) for v in lo], [round(v, 2) for v in hi])
    print("TRIS", counts, "TOTAL", sum(counts.values()))
    for o in bpy.data.objects:
        if o.parent and (o.name in MOVERS or o.name == "smoke"):
            print("NODE", o.name, "parent", o.parent.name, "pivot", [round(v, 3) for v in o.matrix_world.translation],
                  "tris", common.tris([o]))
    print("HOLES", [(op[0], op[3], op[4], [round(v, 2) for v in hole(op)]) for op in OPENINGS])
    common.preview_materials()
    hh, hm = bpy.data.objects["hand_hour"], bpy.data.objects["hand_minute"]
    hh.rotation_euler[1] = math.radians(304)     # previews show 10:08; the .glb rests at 12:00
    hm.rotation_euler[1] = math.radians(48)
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-32, elev=20, lens=50, margin=0.86, min_radius=5.2)
            common.render(os.path.join(common.OUT_PREV, "clocktower_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-34, elev=10, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "clocktower.png"))
    hh.rotation_euler[1] = 0.0
    hm.rotation_euler[1] = 0.0
    common.save_blend("clocktower")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
