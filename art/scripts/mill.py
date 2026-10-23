"""The Whistling Mill: a round stone tower windmill with a wheat field, in 14 cumulative
stages (stage_01 .. stage_14). See ART.md "mill.glb".

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

Angles: theta = 0 is the front (-Y), positive toward +X. P(theta, r, z) is a point on the tower.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, bm_uv, jitter, add_lantern
import bmesh
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", True)
TAU = 2 * math.pi

# ------------------------------------------------------------------ dimensions
BASE_Z = 0.45            # plinth top / ground floor
TOP_Z = 6.3              # top of the stonework
BAND = (6.3, 6.5)        # timber curb
WALL = 0.44              # stone depth
DECK_T, DECK_B, DECK_R = 3.58, 3.51, 2.78
RAIL_R = 2.7
CAP_Z0, CAP_Z1, CAP_R = 6.55, 9.05, 1.93
HUB = Vector((0.0, -3.05, 7.0))
SAIL_LEN = 4.5
STRUTS = [22.5 + 45 * k for k in range(8)]


def R(z):
    """Outer tower radius at height z (tapers from 2.25 to 1.63)."""
    return 2.25 - 0.62 * (z - BASE_Z) / (6.5 - BASE_Z)


def P(theta, r, z=0.0):
    return (r * math.sin(theta), -r * math.cos(theta), z)


def radial(theta_deg):
    """Frame turned to face outward at theta: local x = tangent, local -y = outward."""
    return M((0, 0, 0), (0, 0, theta_deg))


def make_courses():
    rnd = random.Random(77)
    out = []
    for z0, z1, n in ((BASE_Z, 3.0, 7), (3.0, TOP_Z, 9)):
        h = (z1 - z0) / n
        zs = [z0] + [z0 + h * i + rnd.uniform(-0.03, 0.03) for i in range(1, n)] + [z1]
        out += list(zip(zs, zs[1:]))
    return out


COURSES = make_courses()
# (theta deg, half width m, z0, z1); holes snap to whole courses
DOOR = (0, 0.6, BASE_Z, 2.45)
WINDOWS = [(-58, 0.3, 1.4, 2.0), (135, 0.3, 2.1, 2.6), (18, 0.27, 4.7, 5.3)]
OPENINGS = [DOOR] + WINDOWS
FIELD = (-8.5, -2.95, -3.85, 3.85)          # fence line: x0, x1, y0, y1
ROW_X0, ROW_X1, ROWS = -8.15, -3.25, 6
ROW_Y = 3.45


def blocks_course(op, z0, z1):
    return op[2] < z1 - 0.06 and op[3] > z0 + 0.06


def hole(op):
    zs = [(a, b) for a, b in COURSES if blocks_course(op, a, b)]
    return zs[0][0], zs[-1][1]


def half_angle(op):
    return op[1] / R((op[2] + op[3]) / 2)


def row_x(i):
    pitch = (ROW_X1 - ROW_X0) / ROWS
    return ROW_X0 + pitch * (i + 0.5)


def free_intervals(blocked, start):
    """Parts of the circle [start, start + TAU) not covered by `blocked` angle intervals."""
    bl = []
    for a, b in blocked:
        a2 = (a - start) % TAU
        bl.append((a2, a2 + b - a))
        if a2 + b - a > TAU:
            bl.append((a2 - TAU, a2 + b - a - TAU))
    bl.sort()
    free, t = [], 0.0
    for a, b in bl:
        if a > t:
            free.append((t, a))
        t = max(t, b)
    if t < TAU:
        free.append((t, TAU))
    return [(start + a, start + b) for a, b in free]


def loft(sections, cap=True):
    """Skin cross-sections [(y, [(x, z), ...]), ...] running along Y."""
    bm = bmesh.new()
    rings = [[bm.verts.new((x, y, z)) for x, z in pts] for y, pts in sections]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n - 1):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    if cap:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def course_blocks(p, rnd, r_out, depth, z0, z1, free, wrange, cols, bevel=0.0, jit=0.0, gap=0.035):
    """Stone blocks around (parts of) a ring, outer face at r_out."""
    for a, b in free:
        length = (b - a) * r_out
        widths, t = [], 0.0
        while length - t > 1e-3:
            w = rnd.uniform(*wrange)
            if length - t - w < wrange[0] * 0.55:
                w = length - t
            widths.append(w)
            t += w
        ang = a
        for w in widths:
            span = w / r_out
            c = ang + span / 2
            chord = 2 * r_out * math.sin(span / 2) - gap
            d = depth + rnd.uniform(-0.02, 0.04)
            rf = r_out * math.cos(span / 2) + rnd.uniform(-0.012, 0.02)
            bm = bm_box(chord, d, z1 - z0 - gap, bevel=bevel)
            if jit:
                jitter(bm, jit, rnd.randint(0, 9999))
            p.add(bm, rnd.choice(cols), M(P(c, rf - d / 2, (z0 + z1) / 2), (0, 0, math.degrees(c))))
            ang += span


def wall_courses(p, rnd, zlo, zhi, wrange):
    cols = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid", "stone_warm"]
    for z0, z1 in COURSES:
        if z0 < zlo - 1e-6 or z1 > zhi + 1e-6:
            continue
        r = R((z0 + z1) / 2)
        blocked = []
        for op in OPENINGS:
            if blocks_course(op, z0, z1):
                c, ha = math.radians(op[0]), half_angle(op)
                blocked.append((c - ha, c + ha))
        start = blocked[0][1] if blocked else rnd.uniform(0, TAU)
        free = free_intervals(blocked, start)
        # mortar core in the middle of the wall: shows as dark joints between the blocks
        for a, b in free:
            segs = max(2, int((b - a) / TAU * 22 + 0.99))
            p.add(bm_lathe([(R(z0) - 0.2, z0), (R(z1) - 0.2, z1)], segs,
                           arc=(math.degrees(a) - 90, math.degrees(b) - 90)), "stone_dark")
        course_blocks(p, rnd, r, WALL, z0, z1, free, wrange, cols, jit=0.018)


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes in a circle with string, a centre peg and the plan."""
    pts = []
    for i in range(40):
        a = TAU * i / 40
        c, s = math.cos(a), math.sin(a)
        r = 3.35 * (1 + rnd.uniform(-0.035, 0.035))
        if s < 0:
            r *= 1 + 0.2 * s * s
        pts.append((c * r, s * r))
    p.add(bm_slab(pts, 0.03), "dirt")
    n = 8
    stakes = [P(TAU * k / n + 0.2, 2.45) for k in range(n)]
    for k, (x, y, _) in enumerate(stakes):
        p.box((0.08, 0.08, 0.36), (x, y, 0.18), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        if k % 2 == 0:
            p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, 0.44)))
    for (x0, y0, _), (x1, y1, _) in zip(stakes, stakes[1:] + stakes[:1]):
        length = math.hypot(x1 - x0, y1 - y0)
        p.box((length, 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, 0.29), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # centre peg with the measuring string out to one stake (how you lay out a circle)
    p.box((0.09, 0.09, 0.22), (0, 0, 0.11), "wood_mid", bevel=0.01)
    x1, y1, _ = stakes[1]
    p.box((math.hypot(x1, y1), 0.02, 0.02), (x1 / 2, y1 / 2, 0.16), "white",
          rot=(0, 0, math.degrees(math.atan2(y1, x1))), )
    # the plan: a little windmill sketch, held down by pebbles
    px, py, pr = -2.0, -3.72, 6
    p.box((0.62, 0.46, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    p.add(bm_box(0.08, 0.2, 0.004), "tunic", base @ M((0, -0.08, 0)))
    for ang in (45, -45):
        p.add(bm_box(0.3, 0.012, 0.004), "tunic", base @ M((0, 0.06, 0.001), (0, 0, ang)))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (2.05, -3.45, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.15, 0.24, 0.15), (2.5, -3.68, 0.085), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (2.35, -3.0 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    p.box((0.03, 0.32, 0.09), (2.35, -2.9, 0.06), "white", rot=(0, 0, 8))
    for i in range(6):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.5, 2.0)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), d * math.sin(a), 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Round stone plinth with a flagstone floor."""
    cols = ["stone", "stone", "stone_mid", "stone_light"]
    p.cyl(2.5, 0.43, (0, 0, 0), "stone_dark", segs=16)
    for z0, z1, r in ((0.0, 0.23, 2.62), (0.23, 0.45, 2.58)):
        course_blocks(p, rnd, r, 0.5, z0, z1, [(a0, a0 + TAU) for a0 in [rnd.uniform(0, TAU)]], (0.75, 1.1), cols, bevel=0.04, gap=0.03)
    p.cyl(2.2, 0.02, (0, 0, 0.43), "stone_mid", segs=16)
    for i in range(9):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.0, 1.35)
        p.box((rnd.uniform(0.45, 0.7), rnd.uniform(0.35, 0.55), 0.03),
              (d * math.cos(a), d * math.sin(a), 0.455), rnd.choice(["stone_light", "stone", "stone_light"]),
              rot=(0, 0, rnd.uniform(0, 90)))
    # stones waiting where the wall will go (inside the wall from stage 3 on)
    for i, th in enumerate((-115, -100, -108)):
        p.box((0.5, 0.3, 0.22), P(math.radians(th), 2.0, 0.56 + (0.22 if i == 2 else 0)), rnd.choice(cols),
              rot=(0, 0, th + rnd.uniform(-10, 10)), bevel=0.03)


def stage_03(p, rnd, extra):
    """Lower tower to 3 m, with a ladder, a mortar tub and spare stones."""
    wall_courses(p, rnd, BASE_Z, 3.0, (0.55, 0.85))
    # ladder against the right side
    th = math.radians(90)
    bot, top = Vector(P(th, 2.95, 0.0)), Vector(P(th, 2.06, 3.05))
    d = top - bot
    L = d.length
    tilt = math.degrees(math.atan2(d.x, d.z))
    for s in (-1, 1):
        p.box((0.07, 0.06, L), (bot.x + d.x / 2, s * 0.24, d.z / 2), "wood_light", rot=(0, tilt, 0))
    for k in range(1, 9):
        q = bot + d * (k / 9)
        p.box((0.04, 0.5, 0.04), (q.x, 0, q.z), "wood_light")
    # mortar tub with a trowel, and a little stack of dressed stones
    tx, ty = -2.15, -3.12
    p.add(bm_lathe([(0.24, 0), (0.3, 0.26), (0.3, 0.28), (0.27, 0.28), (0.21, 0.04)], 10, cap_top=False), "wood_mid",
          M((tx, ty, 0)))
    p.cyl(0.26, 0.02, (tx, ty, 0.2), "stone_light", segs=10)
    for hz in (0.06, 0.21):
        p.cyl(0.28 + hz * 0.2, 0.03, (tx, ty, hz), "iron", segs=10)
    p.box((0.16, 0.1, 0.012), (tx + 0.08, ty - 0.02, 0.235), "iron", rot=(0, -20, 30))
    p.cyl(0.018, 0.16, (tx + 0.02, ty - 0.06, 0.25), "wood_dark", segs=5, rot=(0, -60, 30))
    cols = ["stone", "stone_mid", "stone_light"]
    sx, sy = -2.35, -2.35
    for i, (dx, dy, z, r) in enumerate(((0, 0, 0, 10), (0.05, 0.32, 0, -6), (0.02, 0.16, 0.22, 4))):
        p.box((0.52, 0.3, 0.22), (sx + dx, sy + dy, z + 0.11), cols[i], rot=(0, 0, r + 40), bevel=0.03)


def stage_04(p, rnd, extra):
    """Upper tower tapering to 6.3 m, a timber curb band on top and the floor under the cap."""
    wall_courses(p, rnd, 3.0, TOP_Z, (0.5, 0.82))
    r0, r1 = R(BAND[0]), R(BAND[1])
    p.add(bm_lathe([(r0 - 0.42, BAND[0]), (r0 + 0.08, BAND[0]), (r1 + 0.08, BAND[1]), (r1 - 0.42, BAND[1]),
                    (r0 - 0.42, BAND[0])], 24, cap_bottom=False, cap_top=False), "wood_dark")
    p.cyl(r1 - 0.38, 0.06, (0, 0, BAND[1] - 0.08), "wood_mid", segs=16)
    for i in range(5):
        p.box((2 * (r1 - 0.45), 0.02, 0.012), (0, -1.0 + 0.5 * i, BAND[1] - 0.02), "wood_dark")
    for k in range(12):        # beam ends poking out of the curb
        th = TAU * (k + 0.5) / 12
        p.box((0.16, 0.2, 0.14), P(th, r0 + 0.12, (BAND[0] + BAND[1]) / 2), "wood_mid",
              rot=(0, 0, math.degrees(th)), bevel=0.015)


def arch_pts(r, zc, n, a0=0.0, a1=math.pi):
    return [(r * math.cos(a0 + (a1 - a0) * k / n), zc + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def stage_05(p, rnd, extra):
    """Arched green plank door with voussoirs, iron straps and stone steps."""
    hw, top = DOOR[1], DOOR[3]
    zc = top - hw
    hz1 = hole(DOOR)[1]
    yf = -R((zc + hz1) / 2) + 0.01          # wall face around the arch
    # spandrel fill behind the arch stones
    for s in (-1, 1):
        pts = [(s * (hw + 0.04), zc), (s * (hw + 0.04), hz1), (0.0, hz1)] + \
              [(s * hw * math.cos(math.pi / 2 * k / 6), zc + hw * math.sin(math.pi / 2 * k / 6)) for k in range(6, -1, -1)][1:-1]
        p.add(bm_prism(pts, 0.36), "stone_mid", M((0, yf + 0.18, 0)))
    # voussoirs
    n = 9
    for k in range(n):
        a0, a1 = math.pi * k / n + 0.012, math.pi * (k + 1) / n - 0.012
        ro = hw + (0.3 if k == n // 2 else 0.24)
        pts = arch_pts(hw, zc, 2, a0, a1) + list(reversed(arch_pts(ro, zc, 2, a0, a1)))
        p.add(bm_prism(pts, 0.2), "stone_light" if k == n // 2 else rnd.choice(["stone", "stone_light", "stone"]),
              M((0, yf - 0.03, 0)))
    # door leaf: backing and five planks
    yd = -R(1.2) + 0.32
    back = [(-hw, BASE_Z), (hw, BASE_Z)] + arch_pts(hw, zc, 12)
    p.add(bm_prism(back, 0.05), "wood_dark", M((0, yd + 0.05, 0)))
    def arch_top(u):
        return zc + math.sqrt(max(hw * hw - u * u, 0.0))
    for i in range(5):
        a, b = -hw + 2 * hw * i / 5 + 0.012, -hw + 2 * hw * (i + 1) / 5 - 0.012
        pts = [(a, BASE_Z + 0.01), (b, BASE_Z + 0.01)] + [(b - (b - a) * k / 3, arch_top(b - (b - a) * k / 3)) for k in range(4)]
        p.add(bm_prism(pts, 0.07), "door", M((0, yd, 0)))
    for z in (0.95, 1.95):
        p.box((1.0, 0.03, 0.08), (-0.08, yd - 0.05, z), "iron")
        p.cyl(0.05, 0.03, (-0.56, yd - 0.04, z), "iron", segs=8, rot=(90, 0, 0))
    p.add(bm_tube([(0.3 + 0.07 * math.cos(TAU * k / 10), yd - 0.07, 1.4 + 0.07 * math.sin(TAU * k / 10)) for k in range(11)],
                  0.014, 5), "iron")
    p.cyl(0.035, 0.04, (0.3, yd - 0.04, 1.47), "iron", segs=8, rot=(90, 0, 0))
    # threshold and steps
    p.box((1.3, 0.4, 0.05), (0, -R(BASE_Z) + 0.12, BASE_Z + 0.02), "stone_light", bevel=0.015)
    p.box((1.55, 0.42, 0.3), (0, -2.74, 0.15), "stone", bevel=0.04)
    p.box((1.8, 0.4, 0.15), (0, -3.08, 0.075), "stone_light", bevel=0.04)


def window(p, op, rnd, flowers=False):
    th, hw = op[0], op[1]
    hz0, hz1 = hole(op)
    zm, h = (hz0 + hz1) / 2, hz1 - hz0
    base = radial(th)
    ro = R(zm)
    ha = half_angle(op)
    rf = ro - 0.15
    uw = rf * math.sin(ha) + 0.03
    f = 0.075
    def lb(size, loc, matname, rot=(0, 0, 0)):
        p.add(bm_box(*size), matname, base @ M(loc, rot))
    for s in (-1, 1):
        lb((f, 0.16, h), (s * (uw - f / 2), -rf, zm), "wood_light")
    for zz in (hz0 + f / 2, hz1 - f / 2):
        lb((2 * uw, 0.16, f), (0, -rf, zz), "wood_light")
    lb((2 * uw - 2 * f, 0.03, h - 2 * f), (0, -rf + 0.03, zm), "glass")
    lb((0.05, 0.08, h - 2 * f), (0, -rf - 0.01, zm), "wood_light")
    lb((2 * uw - 2 * f, 0.08, 0.05), (0, -rf - 0.01, zm), "wood_light")
    lb((2 * uw + 0.22, 0.3, 0.08), (0, -ro - 0.04, hz0 - 0.03), "stone_light")
    # shutters swung open against the wall
    rc = ro * math.cos(ha) + 0.03
    for s in (-1, 1):
        hinge = base @ M((s * ro * math.sin(ha), -rc, zm), (0, 0, s * 8))
        p.add(bm_box(hw + 0.02, 0.045, h - 0.02), "shutter", hinge @ M((s * (hw + 0.02) / 2, 0, 0)))
        for zz in (-h * 0.3, h * 0.3):
            p.add(bm_box(hw - 0.02, 0.025, 0.06), "wood_dark", hinge @ M((s * (hw + 0.02) / 2, -0.03, zz)))
    if flowers:
        bw = 2 * uw + 0.2
        lb((bw, 0.24, 0.22), (0, -ro - 0.14, hz0 - 0.2), "wood_mid")
        petals = ["petal_pink", "petal_white", "petal_yellow", "petal_pink", "petal_purple"]
        for i in range(4):
            u = -bw / 2 + 0.1 + i * (bw - 0.2) / 3
            p.add(jitter(bm_ico(0.12, 1), 0.02, i), rnd.choice(["grass", "grass_dark"]),
                  base @ M((u, -ro - 0.15, hz0 - 0.06), scale=(1.1, 0.9, 0.8)))
        for i in range(5):
            u = -bw / 2 + 0.08 + i * (bw - 0.16) / 4
            p.add(bm_ico(0.05, 0), petals[i], base @ M((u, -ro - 0.2 + rnd.uniform(-0.05, 0.05), hz0 + rnd.uniform(0.0, 0.07))))


def stage_06(p, rnd, extra):
    for i, op in enumerate(WINDOWS):
        window(p, op, rnd, flowers=(i == 0))


def stage_07(p, rnd, extra):
    """Wooden gallery ring at 3.5 m: brackets, joists, radial planks and a railing."""
    n = 44
    ri = R(DECK_T) - 0.04
    for i in range(n):
        a0, a1 = TAU * i / n + 0.0045, TAU * (i + 1) / n - 0.0045
        ro = DECK_R + rnd.uniform(-0.03, 0.03)
        pts = [P(a0, ri)[:2], P(a0, ro)[:2], P(a1, ro)[:2], P(a1, ri)[:2]]
        p.add(bm_slab(pts, DECK_T - DECK_B), rnd.choice(["wood", "wood", "wood_light", "wood_mid"]), M((0, 0, DECK_B)))
    for th in STRUTS:
        base = radial(th)
        r0 = R(DECK_B) - 0.12
        p.add(bm_box(0.12, DECK_R + 0.1 - r0, 0.14), "wood_dark", base @ M((0, -(r0 + DECK_R + 0.1) / 2, DECK_B - 0.07)))
        z1, r1, z2, r2 = 2.86, R(2.86) - 0.05, DECK_B - 0.1, 2.45
        L = math.hypot(r2 - r1, z2 - z1)
        a = math.degrees(math.atan2(z2 - z1, r2 - r1))
        p.add(bm_box(0.1, L + 0.06, 0.1), "wood_dark", base @ M((0, -(r1 + r2) / 2, (z1 + z2) / 2), (-a, 0, 0)))
    for k in range(16):
        th = TAU * (k + 0.5) / 16
        p.box((0.09, 0.09, 0.95), P(th, RAIL_R, DECK_T + 0.45), "wood_mid", rot=(0, 0, math.degrees(th)))
    for z, r in ((DECK_T + 0.88, 0.04), (DECK_T + 0.45, 0.03)):
        ring = [P(TAU * k / 32, RAIL_R, z) for k in range(33)]
        p.add(bm_tube(ring, r, 4, cap=False), "wood_light" if r > 0.035 else "wood")


def cap_r(u):
    return CAP_R * max(1 - u ** 2.2, 0.0) ** 0.5


def cap_z(u):
    return CAP_Z0 + (CAP_Z1 - CAP_Z0) * u


def stage_08(p, rnd, extra):
    """Rounded cap clad in weathered wooden shingles, with a knob on top."""
    us = [0.97 * k / 9 for k in range(10)]
    p.add(bm_lathe([(cap_r(u) - 0.03, cap_z(u)) for u in us], 16, cap_bottom=False), "shingle_dark")
    p.add(bm_lathe([(R(BAND[1]) - 0.1, BAND[1]), (CAP_R + 0.06, CAP_Z0 - 0.02)], 24, cap_bottom=False, cap_top=False),
          "wood_dark")
    edges = [0.0, 0.12, 0.24, 0.35, 0.46, 0.56, 0.66, 0.75, 0.83, 0.9]
    cols = ["shingle"] * 5 + ["shingle_light"] * 3 + ["shingle_dark"]
    for k in range(len(edges) - 1):
        ua, ub = edges[k], edges[k + 1] + 0.035
        rb, zb = cap_r(ua) + 0.07, cap_z(ua) - 0.05
        rt, zt = cap_r(ub) + 0.005, cap_z(ub)
        n = max(10, int(TAU * cap_r(ua) / 0.42))
        off = (0.5 if k % 2 else 0.0) * 360 / n + rnd.uniform(0, 5)
        for i in range(n):
            a0 = off + 360 * i / n + 0.6
            a1 = off + 360 * (i + 1) / n - 0.6
            dz = rnd.uniform(-0.025, 0.02)
            p.add(bm_lathe([(rb, zb + dz), (rt, zt)], 2, arc=(a0, a1)), rnd.choice(cols))
    u = edges[-1]
    p.add(bm_lathe([(cap_r(u) + 0.06, cap_z(u) - 0.05), (0.5, 8.95), (0.24, CAP_Z1 + 0.02), (0.12, CAP_Z1 + 0.06)], 12),
          "shingle_dark")
    p.cyl(0.07, 0.14, (0, 0, CAP_Z1 + 0.04), "wood_dark", segs=8)
    p.ball(0.13, (0, 0, CAP_Z1 + 0.27), "wood_dark", uv=(10, 6))


def stage_09(p, rnd, extra):
    """Hood over the windshaft, the shaft and its iron poll end, and the tailpole at the back."""
    hood = [(-0.42, 6.62), (0.42, 6.62), (0.42, 7.38), (0.0, 7.7), (-0.42, 7.38)]
    p.add(bm_prism(hood, 1.1), "wood", M((0, -1.75, 0)))
    for s in (-1, 1):
        L = math.hypot(0.5, 0.36)
        a = math.degrees(math.atan2(0.36, 0.5))
        p.box((L + 0.06, 1.22, 0.06), (s * 0.24, -1.78, 7.56), "shingle_dark", rot=(0, s * a, 0))
        p.box((L + 0.05, 0.06, 0.12), (s * 0.24, -2.36, 7.52), "wood_dark", rot=(0, s * a, 0))
    for x in (-0.3, -0.1, 0.1, 0.3):
        p.box((0.012, 0.02, 0.62), (x, -2.31, 6.95), "wood_dark")
    p.cyl(0.21, 0.72, (0, -2.27, HUB.z), "wood_dark", segs=8, rot=(90, 0, 0))
    p.cyl(0.27, 0.06, (0, -2.29, HUB.z), "iron", segs=10, rot=(90, 0, 0))
    p.cyl(0.3, 0.3, (0, -2.69, HUB.z), "iron", segs=12, rot=(90, 0, 0), bevel=0.03)
    p.cyl(0.33, 0.06, (0, -2.84, HUB.z), "iron", segs=12, rot=(90, 0, 0))
    # tailpole with two braces, down to the gallery at the back
    a, b = Vector((0, 1.62, 6.8)), Vector((0, RAIL_R - 0.08, DECK_T + 0.95))
    p.add(bm_tube([a, b], 0.075, 6), "wood_dark")
    mid = a + (b - a) * 0.45
    for s in (-1, 1):
        p.add(bm_tube([(s * 0.85, 1.4, 6.62), mid], 0.045, 5), "wood_mid")
    p.box((0.3, 0.08, 0.08), (0, RAIL_R - 0.06, DECK_T + 0.92), "iron")


def arm_matrix(phi):
    s, c = math.sin(phi), math.cos(phi)
    rot = Matrix(((s, 0, c), (0, 1, 0), (-c, 0, s))).to_4x4()
    return Matrix.Translation(HUB) @ rot


def cloth(x0, x1, z0, z1, y, bulge, nx=3, nz=6):
    bm = bmesh.new()
    vs = [[bm.verts.new((x0 + (x1 - x0) * i / nx, y + bulge * math.sin(math.pi * i / nx) * math.sin(math.pi * j / nz),
                         z0 + (z1 - z0) * j / nz)) for i in range(nx + 1)] for j in range(nz + 1)]
    for j in range(nz):
        for i in range(nx):
            bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    return bm


def stage_10(p, rnd, extra):
    """Four lattice sails with canvas, one object named `sails` with its origin on the hub."""
    s = Part("sails")
    for k in range(4):
        m = arm_matrix(math.radians(45 + 90 * k))
        s.add(bm_box(0.15, 0.14, SAIL_LEN - 0.1), "wood_dark", m @ M((0, -0.07, 0.1 + (SAIL_LEN - 0.1) / 2)))
        s.add(bm_box(0.2, 0.03, 3.5), "wood_light", m @ M((-0.2, -0.12, 0.95 + 1.75)))
        nb = 11
        for i in range(nb):
            z = 0.95 + (SAIL_LEN - 0.05 - 0.95) * i / (nb - 1)
            s.add(bm_box(1.38, 0.05, 0.05), "wood_light", m @ M((0.39, -0.17, z)))
        for x, w in ((1.08, 0.07), (0.56, 0.05)):
            s.add(bm_box(w, 0.06, SAIL_LEN - 0.9), "wood_light", m @ M((x, -0.17, 0.95 + (SAIL_LEN - 0.95) / 2 - 0.02)))
        s.add(cloth(0.11, 1.05, 1.05, SAIL_LEN - 0.2, -0.11, 0.06), "canvas", m)
    s.add(bm_box(0.36, 0.26, 0.36), "wood_dark", Matrix.Translation(HUB) @ M((0, -0.07, 0), (0, 45, 0)))
    s.add(bm_cyl(0.11, 0.09, 0.12, 8), "iron", Matrix.Translation(HUB) @ M((0, -0.19, 0), (90, 0, 0)))
    extra.append((s, tuple(HUB)))


def stage_11(p, rnd, extra):
    """Tilled field on the -X side: dark soil with six ridged rows, a hoe and a seed bag."""
    x0, x1, y0, y1 = FIELD[0] + 0.12, FIELD[1] - 0.12, FIELD[2] + 0.12, FIELD[3] - 0.12
    pts = []
    for i in range(32):
        a = TAU * i / 32
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** 6 + abs(s) ** 6) ** (1 / 6))
        pts.append(((x0 + x1) / 2 + c * r * (x1 - x0) / 2 * (1 + rnd.uniform(-0.01, 0.01)),
                    s * r * (y1 - y0) / 2 * (1 + rnd.uniform(-0.01, 0.01))))
    p.add(bm_slab(pts, 0.045), "soil_dark")
    for i in range(ROWS):
        x = row_x(i)
        secs = []
        for k in range(9):
            y = -ROW_Y + 2 * ROW_Y * k / 8
            e = 0.35 if k in (0, 8) else 1.0
            h = (0.17 + rnd.uniform(-0.02, 0.02)) * e
            dx = rnd.uniform(-0.03, 0.03)
            secs.append((y, [(dx - 0.32, 0.03), (dx - 0.2, 0.03 + h * 0.75), (dx, 0.03 + h), (dx + 0.2, 0.03 + h * 0.72),
                             (dx + 0.32, 0.03)]))
        p.add(loft(secs), "soil", M((x, 0, 0)))
    for i in range(12):
        x = rnd.uniform(ROW_X0, ROW_X1)
        y = rnd.uniform(-ROW_Y, ROW_Y)
        p.add(jitter(bm_ico(rnd.uniform(0.04, 0.07), 0), 0.015, i), "soil", M((x, y, 0.07), scale=(1.2, 1, 0.7)))
    # hoe across the front furrows, seed bag by the corner
    p.cyl(0.025, 1.5, (-6.2, -3.62, 0.08), "wood_light", segs=6, rot=(0, 90, 8))
    p.box((0.05, 0.22, 0.14), (-4.72, -3.43, 0.09), "iron", rot=(0, 0, 8))
    p.add(bm_lathe([(0.16, 0), (0.2, 0.12), (0.19, 0.3), (0.1, 0.4), (0.05, 0.42), (0.07, 0.48)], 9), "sack",
          M((-3.25, -4.1, 0)))
    p.cyl(0.07, 0.03, (-3.25, -4.1, 0.4), "cloth", segs=8)
    for i in range(5):
        a = TAU * i / 5
        p.ball(0.025, (-2.95 + 0.07 * math.cos(a), -4.25 + 0.07 * math.sin(a), 0.03), "wheat_light", subdiv=0, smooth=False)


def stage_12(p, rnd, extra):
    """Golden wheat in the rows: 4 short meshes per row named wheat_NN (the game sways them), a scarecrow,
    and the old rune-carved millstone found while tilling (story), leaning by the door."""
    chunks = 4
    idx = 0
    for i in range(ROWS):
        x = row_x(i)
        for j in range(chunks):
            idx += 1
            w = Part("wheat_%02d" % idx)
            ya = -ROW_Y + 0.1 + (2 * ROW_Y - 0.2) * j / chunks - (0.03 if j else 0)
            yb = -ROW_Y + 0.1 + (2 * ROW_Y - 0.2) * (j + 1) / chunks + (0.03 if j < chunks - 1 else 0)
            secs = []
            for k in range(6):
                y = ya + (yb - ya) * k / 5
                end = (j == 0 and k == 0) or (j == chunks - 1 and k == 5)
                h = rnd.uniform(0.6, 0.72) * (0.8 if end else 1.0)
                wd = 0.28 * (0.8 if end else 1.0)
                secs.append((y, [(-wd * 0.7, 0.1), (-wd, 0.4), (-wd * 0.45, h), (wd * 0.45, h - 0.03), (wd, 0.4),
                                 (wd * 0.7, 0.1)]))
            w.add(loft(secs), "wheat_dark", M((x, 0, 0)))
            for k in range(40):     # ears: slim three-sided cones poking out of the top
                hx = x + rnd.uniform(-0.27, 0.27)
                hy = rnd.uniform(ya + 0.03, yb - 0.03)
                hz = rnd.uniform(0.5, 0.72) - abs(hx - x) * 0.4
                w.add(bm_cyl(0.058, 0.0, rnd.uniform(0.18, 0.26), 3), rnd.choice(["wheat_light", "wheat", "wheat", "wheat_light"]),
                      M((hx, hy, hz), (rnd.uniform(-20, 20), (hx - x) * 60 + rnd.uniform(-12, 12), rnd.uniform(0, 120))))
            extra.append((w, (x, (ya + yb) / 2, 0.1)))
    # the old millstone Wren's hoe found, set by the door with its runes facing out
    ms = M((-1.32, -2.74, 0.43), (-8, 0, 12))
    p.add(bm_cyl(0.42, 0.42, 0.2, 16, bevel=0.03), "stone_light", ms @ M((0, 0.1, 0), (90, 0, 0)))
    p.add(bm_cyl(0.085, 0.085, 0.22, 8), "stone_dark", ms @ M((0, 0.11, 0), (90, 0, 0)))
    for k in range(8):                       # spiral-cut furrows, glowing like the rune stone
        a = TAU * k / 8
        for j, (r0, r1) in enumerate(((0.13, 0.25), (0.25, 0.36))):
            a0, a1 = a + 0.25 * j, a + 0.25 * (j + 1)
            x0, z0, x1, z1 = r0 * math.cos(a0), r0 * math.sin(a0), r1 * math.cos(a1), r1 * math.sin(a1)
            L = math.hypot(x1 - x0, z1 - z0)
            p.add(bm_box(L, 0.012, 0.022), "glow" if j == 0 or k % 2 == 0 else "stone_dark",
                  ms @ M(((x0 + x1) / 2, -0.104, (z0 + z1) / 2), (0, -math.degrees(math.atan2(z1 - z0, x1 - x0)), 0)))
    # scarecrow in a furrow, wearing a straw hat
    sx, sy = (row_x(1) + row_x(2)) / 2, 0.9
    p.box((0.07, 0.07, 1.75), (sx, sy, 0.87), "wood_mid")
    p.box((1.1, 0.06, 0.06), (sx, sy, 1.36), "wood_mid")
    p.add(jitter(bm_box(0.42, 0.24, 0.52, bevel=0.04), 0.02, 3), "cloth", M((sx, sy, 1.22)))
    p.box((0.12, 0.25, 0.12), (sx + 0.08, sy - 0.12, 1.15), "mustard", rot=(0, 15, 0))
    for s in (-1, 1):
        p.add(jitter(bm_box(0.34, 0.17, 0.17), 0.015, 5 + s), "cloth", M((sx + s * 0.36, sy, 1.36)))
        for k in range(3):
            p.cyl(0.03, 0.17, (sx + s * 0.52, sy + (k - 1) * 0.04, 1.36 + (k - 1) * 0.03), "straw", r2=0.0, segs=4,
                  rot=(0, s * (95 + 12 * (k - 1)), 0))
    for k in range(3):
        p.cyl(0.03, 0.16, (sx + (k - 1) * 0.08, sy, 0.98), "straw", r2=0.0, segs=4, rot=(180 + (k - 1) * 10, (k - 1) * 15, 0))
    p.ball(0.17, (sx, sy, 1.66), "sack", scale=(1, 0.95, 1.05), uv=(10, 6))
    for ex in (-0.06, 0.06):                  # stitched X eyes
        for a in (45, -45):
            p.box((0.06, 0.02, 0.014), (sx + ex, sy - 0.165, 1.69), "ink", rot=(0, a, 0))
    p.box((0.1, 0.02, 0.015), (sx, sy - 0.165, 1.6), "ink")
    p.cyl(0.33, 0.03, (sx, sy, 1.76), "straw", segs=12, rot=(6, 0, 0))
    p.cyl(0.15, 0.17, (sx, sy, 1.77), "straw", r2=0.13, segs=10, rot=(6, 0, 0))
    p.cyl(0.155, 0.04, (sx, sy, 1.79), "cloth", segs=10, rot=(6, 0, 0))


def sack(p, x, y, rz=0.0, s=1.0, lying=False, mat="sack"):
    prof = [(0.0, 0.0), (0.22, 0.02), (0.27, 0.14), (0.26, 0.36), (0.18, 0.5), (0.07, 0.56), (0.09, 0.62), (0.05, 0.66)]
    bm = bm_lathe([(r * s, z * s) for r, z in prof], 8)
    if lying:
        p.add(bm, mat, M((x, y, 0.21 * s), (0, 90, rz), scale=(1.0, 1.0, 1.0)) @ M((0, 0, -0.33 * s), scale=(1, 0.85, 1)))
        return
    jitter(bm, 0.015 * s, int(x * 100))
    p.add(bm, mat, M((x, y, 0), (0, 0, rz)), smooth=True)
    p.cyl(0.075 * s, 0.035 * s, (x, y, 0.55 * s), "wood_dark", segs=8)


def wheel(p, base, r=0.36):
    p.add(bm_cyl(r, r, 0.07, 14), "wood", base @ M((-0.035, 0, 0), (0, 90, 0)))
    p.add(bm_cyl(r + 0.02, r + 0.02, 0.05, 14), "iron", base @ M((-0.025, 0, 0), (0, 90, 0)))
    p.add(bm_cyl(0.08, 0.08, 0.14, 8), "wood_dark", base @ M((-0.07, 0, 0), (0, 90, 0)))
    for a in (0, 60, 120):
        p.add(bm_box(0.02, 0.05, 2 * r - 0.06), "wood_dark", base @ M((0.04, 0, 0), (a, 0, 0)))


def stage_13(p, rnd, extra):
    """Low split-rail fence with a gate, flour sacks and a small hand cart by the door."""
    x0, x1, y0, y1 = FIELD
    gate = (-5.15, -4.1)
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    posts = []
    for (ax, ay), (bx, by) in zip(corners, corners[1:] + corners[:1]):
        L = math.hypot(bx - ax, by - ay)
        n = max(1, round(L / 1.4))
        pts = [(ax + (bx - ax) * k / n, ay + (by - ay) * k / n) for k in range(n)]
        if ay == y0 and by == y0:                     # front side: posts at the gate
            pts = [q for q in pts if not (gate[0] - 0.5 < q[0] < gate[1] + 0.5)] + [(gate[0], y0), (gate[1], y0)]
            pts.sort(key=lambda q: q[0])
        posts.append(pts)
    allp = [q for side in posts for q in side]
    for x, y in allp:
        p.add(jitter(bm_box(0.11, 0.11, 0.82), 0.012, int(x * 37 + y * 11)), "wood_mid",
              M((x, y, 0.41), (rnd.uniform(-3, 3), rnd.uniform(-3, 3), rnd.uniform(0, 30))))
        p.cyl(0.075, 0.1, (x, y, 0.82), "wood_mid", r2=0.0, segs=4, rot=(0, 0, 45))
    ring = []
    for side in posts:
        ring += side
    ring.append(ring[0])
    for (ax, ay), (bx, by) in zip(ring, ring[1:]):
        if ay == y0 and by == y0 and abs(ax - gate[0]) < 1e-6 and abs(bx - gate[1]) < 1e-6:
            continue
        L = math.hypot(bx - ax, by - ay)
        ang = math.degrees(math.atan2(by - ay, bx - ax))
        for z in (0.34, 0.64):
            p.box((L + 0.12, 0.06, 0.09), ((ax + bx) / 2, (ay + by) / 2, z + rnd.uniform(-0.03, 0.03)),
                  rnd.choice(["wood_light", "wood", "wood_light"]), rot=(rnd.uniform(-4, 4), 0, ang + rnd.uniform(-1.5, 1.5)))
    # gate: hinged on the left post, swung a little open (inward)
    gw = gate[1] - gate[0] - 0.14
    gm = M((gate[0] + 0.07, y0, 0), (0, 0, 28))
    for z in (0.22, 0.46, 0.7):
        p.add(bm_box(gw, 0.05, 0.08), "wood_light", gm @ M((gw / 2, 0, z)))
    for u in (0.04, gw - 0.04):
        p.add(bm_box(0.07, 0.06, 0.66), "wood", gm @ M((u, 0, 0.46)))
    p.add(bm_box(math.hypot(gw, 0.48), 0.04, 0.07), "wood", gm @ M((gw / 2, -0.03, 0.46), (0, -math.degrees(math.atan2(0.48, gw)), 0)))
    # flour sacks right of the steps, with a dusting of flour
    pts = [(1.55 + 0.42 * math.cos(TAU * i / 14) * (1 + rnd.uniform(-0.15, 0.15)),
            -2.85 + 0.3 * math.sin(TAU * i / 14) * (1 + rnd.uniform(-0.15, 0.15))) for i in range(14)]
    p.add(bm_slab(pts, 0.035), "flour")
    sack(p, 1.3, -2.75, 20)
    sack(p, 1.72, -2.58, -15, 1.08)
    sack(p, 1.6, -3.05, 50, 0.9)
    sack(p, 1.98, -3.08, -30, 0.95, lying=True)
    # little hand cart, resting on its legs, with two sacks aboard
    cm = M((2.95, -1.75, 0), (0, 0, 58))
    wheel(p, cm @ M((0.43, 0.15, 0.36)))
    wheel(p, cm @ M((-0.43, 0.15, 0.36)) @ M((0, 0, 0), (0, 0, 180)))
    p.add(bm_box(0.94, 0.06, 0.06), "iron", cm @ M((0, 0.15, 0.36)))
    p.add(bm_box(0.78, 1.1, 0.06), "wood", cm @ M((0, -0.05, 0.56)))
    for s in (-1, 1):
        p.add(bm_box(0.05, 1.1, 0.22), "wood_light", cm @ M((s * 0.39, -0.05, 0.68)))
        p.add(bm_box(0.06, 0.95, 0.06), "wood_mid", cm @ M((s * 0.3, -1.0, 0.56)))
        p.add(bm_box(0.06, 0.06, 0.5), "wood_mid", cm @ M((s * 0.3, -0.5, 0.28)))
    for s in (-1, 1):
        p.add(bm_box(0.78, 0.05, 0.2), "wood_light", cm @ M((0, -0.05 + s * 0.53, 0.68)))
    for k, (dx, dy) in enumerate(((0.12, 0.15), (-0.12, -0.25))):
        bm = bm_lathe([(0.0, 0.0), (0.22, 0.02), (0.26, 0.14), (0.25, 0.34), (0.17, 0.48), (0.07, 0.54), (0.09, 0.6), (0.05, 0.63)], 10)
        p.add(bm, "sack", cm @ M((dx, dy, 0.82), (90, 0, 15 + 30 * k)) @ M((0, 0, -0.3), scale=(1, 0.8, 1)), smooth=True)


def stage_14(p, rnd, extra):
    """Lanterns by the door, a weather vane on the cap, and a hanging sign with a wheat sheaf."""
    za = 2.38
    for s in (-1, 1):
        th = math.radians(s * 21)
        r = R(za)
        p.add(bm_box(0.14, 0.16, 0.28), "wood_dark", radial(s * 21) @ M((0, -r + 0.02, za)))
        p.add(bm_tube([P(th, r + 0.05, za), P(th, r + 0.38, za), P(th, r + 0.45, za - 0.06)], 0.028, 6), "iron")
        x, y, _ = P(th, r + 0.45)
        add_lantern(p, (x, y, za - 0.79), 1.3, hang=True)
    # weather vane
    z0 = CAP_Z1 + 0.3
    p.cyl(0.028, 0.9, (0, 0, z0), "iron", segs=6)
    p.ball(0.06, (0, 0, z0 + 0.22), "iron", subdiv=1)
    for ang in (0, 90):
        p.box((0.62, 0.025, 0.025), (0, 0, z0 + 0.36), "iron", rot=(0, 0, ang))
    for k in range(4):
        a = TAU * k / 4
        p.ball(0.035, (0.31 * math.cos(a), 0.31 * math.sin(a), z0 + 0.36), "iron", subdiv=0, smooth=False)
    vm = M((0, 0, z0 + 0.72), (0, 0, 32))
    p.add(bm_box(0.95, 0.02, 0.028), "iron", vm)
    p.add(bm_prism([(0.62, 0), (0.44, 0.11), (0.47, 0), (0.44, -0.11)], 0.025), "iron", vm)
    p.add(bm_prism([(-0.3, 0), (-0.52, 0.2), (-0.62, 0.2), (-0.5, 0), (-0.62, -0.08), (-0.52, -0.08)], 0.022), "iron", vm)
    # hanging sign under the gallery, left of the door
    th = -45
    base = radial(th)
    r, zc, w, h = 2.48, 2.8, 0.82, 0.56
    for u in (-0.3, 0.3):
        p.add(bm_box(0.06, 0.06, 0.03), "iron", base @ M((u, -r, DECK_B - 0.015)))
        for i in range(4):
            p.add(bm_box(0.018, 0.045 if i % 2 else 0.018, 0.1), "iron", base @ M((u, -r, DECK_B - 0.08 - i * 0.09)))
    def rounded(wd, ht, rr, n=3):
        pts = []
        for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
            for k in range(n + 1):
                a = math.radians(a0 + 90 * k / n)
                pts.append((cxs * (wd / 2 - rr) + rr * math.cos(a), czs * (ht / 2 - rr) + rr * math.sin(a)))
        return pts
    p.add(bm_prism(rounded(w + 0.1, h + 0.1, 0.1), 0.06), "wood_dark", base @ M((0, -r, zc)))
    p.add(bm_prism(rounded(w, h, 0.07), 0.09), "wood_light", base @ M((0, -r, zc)))
    art = Part("sign_art")
    for k in range(9):          # stalks fanning out from a tied waist
        f = (k - 4) / 4
        top = (f * 0.16, 0.13 - abs(f) * 0.03)
        bot = (f * 0.1, -0.2)
        for (ax, az), (bx, bz) in (((bot[0], bot[1]), (f * 0.03, -0.03)), ((f * 0.03, -0.03), top)):
            L = math.hypot(bx - ax, bz - az)
            art.add(bm_box(0.014, 0.012, L), "wheat_dark", M(((ax + bx) / 2, -0.01, (az + bz) / 2), (0, math.degrees(math.atan2(bx - ax, bz - az)), 0)))
        art.add(bm_lathe([(0.0, 0.0), (0.028, 0.05), (0.0, 0.13)], 5), "wheat",
                M((top[0], -0.015, top[1] - 0.01), (0, math.degrees(f * 0.55), 0), scale=(1, 0.5, 1)))
    art.add(bm_box(0.11, 0.02, 0.035), "cloth", M((0, -0.02, -0.04)))
    p.merge(art, base @ M((0, -r - 0.045, zc + 0.02), scale=1.25))


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
        fn(part, random.Random(2000 + i), extra)
        objs = []
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for xp, origin in extra:
            objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    sails = bpy.data.objects["sails"]
    wheat = [o for o in meshes if o.name.startswith("wheat")]
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)   # meadow occludes the bake
    # bake each stage with only the stages that exist when it appears; sails turn, so they only self-occlude
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k or (o is sails and k != 10) or (k == 10 and o is not sails)
        common.bake_ao(stages[k - 1][1])
    for o in wheat:
        common.height_tint(o, 0.05, 1.0, 0.55, 1.0)
    for o in meshes:
        o.hide_render = False
    common.export("mill.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=6.4)
            common.render(os.path.join(common.OUT_PREV, "mill_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-34, elev=12, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "mill.png"))
    common.save_blend("mill")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
