"""The Observatory (building 12, the finale): a round stone observatory on a low rocky
mound, with a copper dome, a great brass telescope whose lens is the Great Rune, and a
glowing rune circle on the terrace. 16 cumulative stages (stage_01 .. stage_16).
See art/specs/observatory.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Headless:        powershell -File art/blender.ps1 art/scripts/observatory.py
Set RENDER_STAGES = False to skip the 16 stage renders while iterating.

Angles: theta = 0 is the front (-Y), positive toward +X. P(theta, r, z) is a point on the tower.
The dome is cut by a slit of constant width 2*SW in x, running from the dome's base at the
front up to T_END (t = angle around the X axis, 0 = front horizon, 90 = zenith).
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
import bmesh
from mathutils import Vector

RENDER_STAGES = globals().get("RENDER_STAGES", os.environ.get("OBS_STAGES", "1") == "1")
TAU = 2 * math.pi

# extra colours for this building (added at runtime; common.py stays untouched)
common.PALETTE.update({
    "brass": "#A8874A", "brass_dark": "#7D643A", "brass_light": "#C4A463",
    "verdigris": "#76958A", "verdigris_dark": "#5E7D72", "night": "#3B4563",
})

# ------------------------------------------------------------------ dimensions
MOUND_H = 1.0            # top of the rocky mound
TERR_Z = 1.12            # terrace slab top
TERR_R = 4.05
FLOOR_Z = 1.5            # plinth top / ground floor of the tower
WALL_TOP = 6.1
WALL = 0.44
CAP_Z = (6.1, 6.3)       # stone cap course
DOME_C = Vector((0.0, 0.0, 6.5))
RD = 2.5                 # dome radius (peak 9.0, finial to ~10)
SW = 0.62                # slit half width
T_END = math.radians(85)
EL = 38.0                # telescope elevation (deg)
PV = Vector((0.0, 0.35, 7.25))   # telescope altitude axis (pivot)
TUBE_FRONT = 4.2
DECK_Z, DECK_R = 5.55, 3.3
STAIR_STEPS, STAIR_HW = 5, 0.8


def R(z):
    """Outer tower radius at height z (2.55 at the floor, 2.43 at the wall top)."""
    return 2.55 - 0.12 * (z - FLOOR_Z) / (WALL_TOP - FLOOR_Z)


def P(theta, r, z=0.0):
    return (r * math.sin(theta), -r * math.cos(theta), z)


def frame(theta_deg, z=0.0):
    """Local frame turned to face outward at theta: x = tangent, -y = outward."""
    return M((0, 0, z), (0, 0, theta_deg))


MOUND = [(5.35, 0.0), (5.05, 0.32), (4.62, 0.7), (4.22, 0.94), (4.0, MOUND_H)]


def mound_z(r):
    if r >= MOUND[0][0]:
        return 0.0
    for (r0, z0), (r1, z1) in zip(MOUND, MOUND[1:]):
        if r1 <= r <= r0:
            return z0 + (z1 - z0) * (r0 - r) / (r0 - r1)
    return MOUND_H


def tel_dir():
    e = math.radians(EL)
    return Vector((0.0, -math.cos(e), math.sin(e)))


def tel_up():
    e = math.radians(EL)
    return Vector((0.0, math.sin(e), math.cos(e)))


def TM(s=0.0, up=0.0):
    """Matrix in the telescope frame: local z along the tube, local y = tube 'up'."""
    return M(tuple(PV + tel_dir() * s + tel_up() * up), (90 - EL, 0, 0))


# ------------------------------------------------------------------ stone courses (after mill.py)

def make_courses():
    rnd = random.Random(91)
    n = 12
    h = (WALL_TOP - FLOOR_Z) / n
    zs = [FLOOR_Z] + [FLOOR_Z + h * i + rnd.uniform(-0.03, 0.03) for i in range(1, n)] + [WALL_TOP]
    return list(zip(zs, zs[1:]))


COURSES = make_courses()
# (theta deg, half width m, z0, z1); holes snap to whole courses
DOOR = (0, 0.62, FLOOR_Z, 3.75)
WINDOWS = [(-72, 0.27, 2.3, 3.3), (72, 0.27, 2.3, 3.3), (180, 0.27, 2.3, 3.3),
           (-32, 0.25, 4.0, 4.9), (32, 0.25, 4.0, 4.9), (148, 0.25, 4.0, 4.9)]
OPENINGS = [DOOR] + WINDOWS
BUTTRESSES = (-50, 50, -128, 128)
STONES = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid", "stone_warm"]


def blocks_course(op, z0, z1):
    return op[2] < z1 - 0.06 and op[3] > z0 + 0.06


def hole(op):
    zs = [(a, b) for a, b in COURSES if blocks_course(op, a, b)]
    return zs[0][0], zs[-1][1]


def half_angle(op):
    return op[1] / R((op[2] + op[3]) / 2)


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


def wall_courses(p, rnd, zlo, zhi):
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
        for a, b in free:   # mortar core: dark joints between the blocks
            segs = max(2, int((b - a) / TAU * 24 + 0.99))
            p.add(bm_lathe([(R(z0) - 0.2, z0), (R(z1) - 0.2, z1)], segs,
                           arc=(math.degrees(a) - 90, math.degrees(b) - 90)), "stone_dark")
        course_blocks(p, rnd, r, WALL, z0, z1, free, (0.6, 0.95), STONES, jit=0.018)


def ring(r0, r1, z0, z1, segs):
    """Flat ring (rectangular cross-section) around Z."""
    return bm_lathe([(r0, z0), (r1, z0), (r1, z1), (r0, z1), (r0, z0)], segs, cap_bottom=False, cap_top=False)


def boulder(p, rnd, loc, size, cols=("stone", "stone_mid", "stone_light", "stone_warm"), sub=1):
    p.add(jitter(bm_ico(size, sub), size * 0.18, rnd.randint(0, 9999)), rnd.choice(cols),
          M(loc, (0, 0, rnd.uniform(0, 360)), (rnd.uniform(1.0, 1.4), rnd.uniform(0.85, 1.1), rnd.uniform(0.6, 0.85))))


def tuft(p, rnd, x, y, z, s=1.0):
    for k in range(3):
        a = rnd.uniform(0, 360)
        p.cyl(0.07 * s, rnd.uniform(0.18, 0.3) * s, (x + 0.05 * math.cos(math.radians(a)) * s,
              y + 0.05 * math.sin(math.radians(a)) * s, z - 0.02), rnd.choice(["grass_light", "grass", "grass_dark"]),
              r2=0.0, segs=3, rot=(rnd.uniform(-14, 14), rnd.uniform(-14, 14), a))


# ------------------------------------------------------------------ dome geometry

def dome_pt(x, t, r):
    rr = math.sqrt(max(r * r - x * x, 0.0))
    return Vector((x, -rr * math.cos(t), DOME_C.z + rr * math.sin(t)))


def in_slit(x, t):
    return abs(x) < SW and t < T_END


def pt_in_slit(pt, pad=0.0):
    rel = pt - DOME_C
    return abs(rel.x) < SW + pad and math.atan2(rel.z, -rel.y) < T_END + 0.02


def faces_to_bm(faces, centre, outward=True):
    """faces: lists of Vectors; shared corners are welded; normals face away from (or toward) centre."""
    bm = bmesh.new()
    cache = {}

    def V(v):
        k = (round(v.x, 4), round(v.y, 4), round(v.z, 4))
        if k not in cache:
            cache[k] = bm.verts.new(v)
        return cache[k]

    for f in faces:
        vs = []
        for v in f:
            bv = V(v)
            if bv not in vs:
                vs.append(bv)
        if len(vs) < 3:
            continue
        a, b, c = vs[0].co, vs[1].co, vs[2].co
        n = (b - a).cross(c - a)
        mid = sum((v.co for v in vs), Vector()) / len(vs)
        if (n.dot(mid - centre) < 0) == outward:
            vs.reverse()
        try:
            bm.faces.new(vs)
        except ValueError:
            pass
    return bm


def sphere_patch(r, xs, ts, keep, outward=True):
    faces = []
    for i in range(len(xs) - 1):
        for j in range(len(ts) - 1):
            if not keep((xs[i] + xs[i + 1]) / 2, (ts[j] + ts[j + 1]) / 2):
                continue
            faces.append([dome_pt(xs[i], ts[j], r), dome_pt(xs[i + 1], ts[j], r),
                          dome_pt(xs[i + 1], ts[j + 1], r), dome_pt(xs[i], ts[j + 1], r)])
    return faces_to_bm(faces, DOME_C, outward)


def grid_x(r, extra=(), n=18):
    xs = {round(r * math.sin(math.pi * (i / n - 0.5)), 5) for i in range(n + 1)}
    xs |= {round(x, 5) for x in extra}
    return sorted(xs)


def grid_t(extra=(), n=18):
    ts = {round(math.pi * i / n, 6) for i in range(n + 1)} | {round(t, 6) for t in extra}
    return sorted(ts)


def tube_runs(p, pts, radius, matname, keep=lambda q: True, segs=4):
    run = []
    for q in pts + [None]:
        if q is not None and keep(q):
            run.append(q)
            continue
        if len(run) >= 2:
            p.add(bm_tube([tuple(v) for v in run], radius, segs=segs), matname)
        run = []


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """The rocky mound on the hill, a cleared dirt patch on top, survey stakes and string in a
    circle, a centre peg, and the plan held down by pebbles."""
    bm = bm_lathe(MOUND, 22)
    rj = random.Random(5)
    for v in bm.verts:
        if 0.02 < v.co.z < MOUND_H - 0.02:
            k = 1 + rj.uniform(-0.05, 0.05)
            v.co.x *= k
            v.co.y *= k
            v.co.z += rj.uniform(-0.05, 0.05)
    # split the slope into grass and bare rock faces
    rock, grass, top = bmesh.new(), bmesh.new(), bmesh.new()
    for f in bm.faces:
        zc = f.calc_center_median().z
        dst = top if zc > MOUND_H - 0.01 else (rock if rj.random() < 0.22 else grass)
        vs = [dst.verts.new(v.co) for v in f.verts]
        dst.faces.new(vs)
    bm.free()
    p.add(grass, "grass_dark").add(rock, "stone_mid").add(top, "soil")
    for i in range(26):
        a = TAU * i / 26 + rnd.uniform(-0.08, 0.08)
        r = rnd.uniform(4.15, 5.15)
        x, y = r * math.sin(a), -r * math.cos(a)
        if abs(x) < 1.25 and y < -3.4:
            continue
        s = rnd.uniform(0.28, 0.55)
        boulder(p, rnd, (x, y, mound_z(r) - s * 0.25), s, sub=1 if s > 0.4 else 0)
    for i in range(14):
        a, r = rnd.uniform(0, TAU), rnd.uniform(4.4, 5.6)
        x, y = r * math.sin(a), -r * math.cos(a)
        if abs(x) < 1.0 and y < -3.4:
            continue
        tuft(p, rnd, x, y, mound_z(r), rnd.uniform(0.9, 1.4))
    # cleared patch on top
    pts = []
    for i in range(36):
        a = TAU * i / 36
        r = 3.55 * (1 + rnd.uniform(-0.04, 0.04))
        pts.append((r * math.cos(a), r * math.sin(a)))
    p.add(bm_slab(pts, 0.03), "dirt", M((0, 0, MOUND_H)))
    z = MOUND_H
    n = 8
    stakes = [P(TAU * k / n + 0.2, 2.85) for k in range(n)]
    for k, (x, y, _) in enumerate(stakes):
        p.box((0.08, 0.08, 0.36), (x, y, z + 0.18), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.09, (x, y, z + 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        if k % 2 == 0:
            p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, z + 0.44)))
    for (x0, y0, _), (x1, y1, _) in zip(stakes, stakes[1:] + stakes[:1]):
        p.box((math.hypot(x1 - x0, y1 - y0), 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, z + 0.29), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    p.box((0.09, 0.09, 0.22), (0, 0, z + 0.11), "wood_mid", bevel=0.01)
    x1, y1, _ = stakes[1]
    p.box((math.hypot(x1, y1), 0.02, 0.02), (x1 / 2, y1 / 2, z + 0.16), "white",
          rot=(0, 0, math.degrees(math.atan2(y1, x1))))
    # the plan: a dome over a circle with a star, held down by pebbles
    px, py, pr = 1.55, -3.0, -8
    p.box((0.62, 0.46, 0.012), (px, py, z + 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, z + 0.047), (0, 0, pr))
    p.add(bm_lathe([(0.12, 0), (0.135, 0), (0.135, 0.004), (0.12, 0.004), (0.12, 0)], 12,
                   cap_bottom=False, cap_top=False), "tunic", base @ M((-0.08, -0.04, 0)))
    for ang in (0, 60, 120):
        p.add(bm_box(0.14, 0.014, 0.004), "tunic", base @ M((0.16, 0.1, 0.001), (0, 0, ang)))
    p.add(bm_box(0.36, 0.012, 0.004), "tunic", base @ M((0, -0.17, 0.001)))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, z + 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (-1.7, -2.9, z + 0.05), "wood_light", segs=6, rot=(0, 90, 25))
    p.box((0.15, 0.24, 0.15), (-1.25, -3.12, z + 0.085), "wood_mid", rot=(0, 0, 25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (-2.2, -2.2 + 0.07 * i, z + 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, -30))


def stage_02(p, rnd, extra):
    """Stone stairs up the front of the mound and a flagstone terrace with a low curb."""
    p.cyl(TERR_R, TERR_Z - 0.94, (0, 0, 0.94), "stone_mid", segs=28)
    for rc, w in ((3.1, 0.42), (3.6, 0.46)):
        n = int(TAU * rc / 0.58)
        a0 = rnd.uniform(0, TAU)
        for k in range(n):
            a = a0 + TAU * k / n
            x, y, _ = P(a, rc + rnd.uniform(-0.02, 0.02))
            p.box((TAU * rc / n - 0.05, w, 0.05), (x, y, TERR_Z + 0.0), rnd.choice(["stone_light", "stone", "stone_warm"]),
                  rot=(0, 0, math.degrees(a) + rnd.uniform(-2, 2)))
    gap = math.radians(13)
    course_blocks(p, rnd, TERR_R + 0.06, 0.3, TERR_Z - 0.02, TERR_Z + 0.24, [(gap, TAU - gap)], (0.55, 0.85),
                  STONES, jit=0.03)
    rise = TERR_Z / STAIR_STEPS
    for i in range(STAIR_STEPS):
        ztop = rise * (i + 1)
        y0 = -5.6 + 0.36 * i
        y1 = -3.85
        bm = bm_box(2 * STAIR_HW + rnd.uniform(-0.05, 0.05), y1 - y0, ztop, bevel=0.03)
        jitter(bm, 0.015, i, keep_bottom=-1)
        p.add(bm, rnd.choice(["stone_light", "stone", "stone_warm"]), M((rnd.uniform(-0.03, 0.03), (y0 + y1) / 2, ztop / 2)))
    for sx in (-1, 1):   # cheek stones
        for k, (y, s) in enumerate(((-5.35, 0.36), (-4.85, 0.45), (-4.3, 0.5))):
            boulder(p, rnd, (sx * (STAIR_HW + s * 0.75), y, mound_z(-y) - s * 0.1 + 0.05), s,
                    cols=("stone_mid", "stone", "stone_dark"))


def stage_03(p, rnd, extra):
    """Round stone plinth with a flagstone floor."""
    p.cyl(2.45, FLOOR_Z - TERR_Z - 0.02, (0, 0, TERR_Z), "stone_dark", segs=16)
    zm = (TERR_Z + FLOOR_Z) / 2
    for z0, z1, r in ((TERR_Z, zm, 2.9), (zm, FLOOR_Z, 2.86)):
        course_blocks(p, rnd, r, 0.5, z0, z1, [(0.0, TAU)], (0.7, 1.05), STONES, jit=0.025, gap=0.03)
    p.cyl(2.45, 0.02, (0, 0, FLOOR_Z - 0.02), "stone_mid", segs=16)
    for i in range(10):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.0, 1.6)
        p.box((rnd.uniform(0.45, 0.7), rnd.uniform(0.35, 0.55), 0.03), (d * math.cos(a), d * math.sin(a), FLOOR_Z + 0.005),
              rnd.choice(["stone_light", "stone", "stone_light"]), rot=(0, 0, rnd.uniform(0, 90)))
    # a step up from the terrace to the door
    p.box((1.7, 0.5, FLOOR_Z - TERR_Z - 0.19), (0, -3.1, TERR_Z + (FLOOR_Z - TERR_Z - 0.19) / 2), "stone_light", bevel=0.03)
    # stones waiting for the wall
    for i, th in enumerate((-118, -104, -111)):
        p.box((0.5, 0.3, 0.22), P(math.radians(th), 2.15, FLOOR_Z + 0.11 + (0.22 if i == 2 else 0)), rnd.choice(STONES),
              rot=(0, 0, th + rnd.uniform(-10, 10)), bevel=0.03)


def stage_04(p, rnd, extra):
    """Lower tower walls up to about 3.4 m, with the door gap."""
    wall_courses(p, rnd, FLOOR_Z, 3.45)


def stage_05(p, rnd, extra):
    """Upper walls to 6.1 m, a projecting stone cap course and the upper wooden floor."""
    wall_courses(p, rnd, 3.4, WALL_TOP)
    p.add(ring(R(WALL_TOP) - WALL - 0.02, R(WALL_TOP) + 0.14, CAP_Z[0], CAP_Z[1], 32), "stone_light")
    for k in range(24):   # corbels under the cap
        a = TAU * (k + 0.5) / 24
        p.box((0.2, 0.2, 0.16), P(a, R(5.95) + 0.05, 5.98), "stone_mid", rot=(0, 0, math.degrees(a)))
    p.cyl(2.02, 0.08, (0, 0, 6.0), "wood_mid", segs=16)
    for k in range(-4, 5):
        p.box((0.03, 2 * math.sqrt(max(2.0 ** 2 - (k * 0.44) ** 2, 0.1)), 0.012), (k * 0.44, 0, 6.085), "wood_dark")


def stage_06(p, rnd, extra):
    """The arched front door: night-blue planks, iron straps, a brass star, stone voussoirs."""
    hz0, hz1 = hole(DOOR)
    hw = DOOR[1] - 0.02
    zc = hz1 - hw - 0.06
    rm = R((hz0 + hz1) / 2)
    pts = [(-hw, hz0), (hw, hz0)] + [(hw * math.cos(math.pi * i / 10), zc + hw * math.sin(math.pi * i / 10)) for i in range(11)]
    p.add(bm_prism(pts, 0.09), "night", M((0, -(rm - 0.3), 0)))
    for k in range(-3, 4):   # plank joints
        x = k * hw / 3.5
        top = zc + math.sqrt(max(hw * hw - x * x, 0)) - 0.04
        p.box((0.025, 0.02, top - hz0 - 0.04), (x, -(rm - 0.25), (hz0 + top) / 2), "ink")
    for zz in (hz0 + 0.45, zc - 0.1):
        p.box((2 * hw - 0.1, 0.03, 0.08), (0, -(rm - 0.24), zz), "iron")
        for sx in (-1, 1):
            p.cyl(0.035, 0.03, (sx * (hw - 0.12), -(rm - 0.225), zz), "iron", segs=6, rot=(90, 0, 0))
    p.add(bm_lathe([(0.07, -0.012), (0.095, -0.012), (0.095, 0.012), (0.07, 0.012), (0.07, -0.012)], 10,
                   cap_bottom=False, cap_top=False), "brass", M((0.33, -(rm - 0.21), hz0 + 1.05), (90, 0, 0)))
    star(p, (0, -(rm - 0.235), zc + 0.2), 0.13, "brass_light", depth=0.03)
    # voussoirs around the arch, deep enough to fill the hole's corners
    n = 9
    for i in range(n):
        a0, a1 = math.pi * i / n, math.pi * (i + 1) / n
        ri, ro = hw + 0.02, hw + 0.36 + (0.06 if i == n // 2 else 0)
        sec = [(ri * math.cos(a), zc + ri * math.sin(a)) for a in (a0, a1)] + \
              [(ro * math.cos(a), zc + ro * math.sin(a)) for a in (a1, a0)]
        p.add(bm_prism(sec, WALL + 0.12), "stone_light" if i != n // 2 else "stone_warm", M((0, -(rm - WALL / 2 + 0.06), 0)))
    for sx in (-1, 1):   # jamb stones and a stone filling beside the arch spring
        p.box((0.22, WALL + 0.1, zc - hz0), (sx * (hw + 0.12), -(rm - WALL / 2 + 0.05), (hz0 + zc) / 2), "stone_light", bevel=0.02)
    p.box((2 * hw + 0.3, 0.42, 0.06), (0, -(rm + 0.05), hz0 + 0.0), "stone_light")


def star(p, loc, r, matname, depth=0.03, rot=(0, 0, 0), points=5):
    pts = []
    for i in range(points * 2):
        a = math.pi / 2 + math.pi * i / points
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    p.add(bm_prism(pts, depth), matname, M(loc, rot))


def window(p, op):
    hz0, hz1 = hole(op)
    hw = op[1] - 0.01
    rm = R((hz0 + hz1) / 2)
    base = frame(op[0])
    apex = hz1 - 0.05
    zs = max(hz1 - hw * 1.5, hz0 + 0.3)
    arch = [(hw, zs), (hw * 0.72, zs + (apex - zs) * 0.58), (0, apex), (-hw * 0.72, zs + (apex - zs) * 0.58), (-hw, zs)]
    p.add(bm_prism([(-hw, hz0), (hw, hz0)] + arch, 0.04), "glass", base @ M((0, -(rm - 0.24), 0)))
    tymp = [(-hw - 0.012, zs), (-hw - 0.012, hz1 + 0.01), (hw + 0.012, hz1 + 0.01), (hw + 0.012, zs)] + arch[1:4]
    p.add(bm_prism(tymp, WALL + 0.05), "stone_light", base @ M((0, -(rm - WALL / 2), 0)))
    p.add(bm_box(0.03, 0.03, apex - hz0), "iron", base @ M((0, -(rm - 0.21), (hz0 + apex) / 2)))
    p.add(bm_box(2 * hw, 0.03, 0.03), "iron", base @ M((0, -(rm - 0.21), (hz0 + zs) / 2 + 0.05)))
    p.add(bm_box(2 * hw + 0.3, 0.34, 0.09), "stone_light", base @ M((0, -(rm + 0.02), hz0 - 0.02)))
    for sx in (-1, 1):
        p.add(bm_box(0.12, 0.12, hz1 - hz0 + 0.04), "stone_light", base @ M((sx * (hw + 0.07), -(rm + 0.02), (hz0 + hz1) / 2)))
    p.add(bm_box(2 * hw + 0.36, 0.14, 0.13), "stone_light", base @ M((0, -(rm + 0.03), hz1 + 0.07)))


def stage_07(p, rnd, extra):
    """Lancet windows with leaded glass, and four stepped buttresses."""
    for op in WINDOWS:
        window(p, op)
    for th in BUTTRESSES:
        prof = [(0, FLOOR_Z), (0.62, FLOOR_Z), (0.62, 2.45), (0.4, 2.8), (0.4, 3.4), (0.0, 3.8)]
        r0 = R(FLOOR_Z) - 0.12
        bm = bm_prism(prof, 0.44)
        jitter(bm, 0.02, int(th) + 99, keep_bottom=FLOOR_Z)
        p.add(bm, rnd.choice(["stone", "stone_warm"]), M(P(math.radians(th), r0), (0, 0, th - 90)))
        for zz in (2.0, 2.95):   # course lines on the buttress
            p.add(bm_box(0.66 if zz < 2.45 else 0.44, 0.48, 0.035), "stone_dark",
                  M(P(math.radians(th), r0 + (0.31 if zz < 2.45 else 0.2), zz), (0, 0, th - 90)))


def stage_08(p, rnd, extra):
    """A wooden stargazing gallery around the top of the tower, on brackets, with a railing."""
    r_in = R(DECK_Z) - 0.03
    n = 44
    for k in range(n):
        a = TAU * (k + 0.5) / n
        w = TAU * (r_in + DECK_R) / 2 / n - 0.035
        x, y, _ = P(a, (r_in + DECK_R) / 2)
        p.box((w, DECK_R - r_in, 0.08), (x, y, DECK_Z - 0.04), rnd.choice(["wood", "wood_light", "wood", "wood_mid"]),
              rot=(0, 0, math.degrees(a) + rnd.uniform(-1.5, 1.5)))
    p.add(ring(DECK_R - 0.06, DECK_R + 0.02, DECK_Z - 0.2, DECK_Z - 0.06, 32), "wood_dark")
    for k in range(12):
        a = math.radians(15 + 30 * k)
        p0, p1 = Vector(P(a, R(4.75) - 0.05, 4.75)), Vector(P(a, DECK_R - 0.2, DECK_Z - 0.1))
        p.add(bm_tube([tuple(p0), tuple(p1)], 0.06, segs=4), "wood_mid")
        p.add(bm_box(0.12, 0.12, 0.28), "wood_mid", M(P(a, R(DECK_Z - 0.2) + 0.04, DECK_Z - 0.22), (0, 0, 15 + 30 * k)))
    for k in range(24):
        a = TAU * k / 24
        p.box((0.08, 0.08, 0.92), P(a, DECK_R - 0.05, DECK_Z + 0.46), "wood_mid", rot=(0, 0, math.degrees(a)))
    p.add(ring(DECK_R - 0.1, DECK_R + 0.02, DECK_Z + 0.86, DECK_Z + 0.94, 32), "wood")
    p.add(ring(DECK_R - 0.08, DECK_R - 0.02, DECK_Z + 0.46, DECK_Z + 0.51, 32), "wood_mid")


def stage_09(p, rnd, extra):
    """Dome frame: a timber curb ring, curved ribs, a hoop, the slit's frame and a crown ring."""
    p.add(ring(2.15, RD + 0.13, CAP_Z[1], DOME_C.z, 36), "wood_dark")
    for k in range(18):
        a = TAU * (k + 0.5) / 18
        p.box((0.06, 0.06, 0.06), P(a, RD + 0.14, CAP_Z[1] + 0.1), "iron", rot=(0, 0, math.degrees(a)))
    rr = RD + 0.04
    for k in range(12):
        az = math.radians(15 + 30 * k)
        pts = [DOME_C + Vector((rr * math.cos(math.radians(e)) * math.sin(az), -rr * math.cos(math.radians(e)) * math.cos(az),
                                rr * math.sin(math.radians(e)))) for e in range(0, 85, 7)]
        tube_runs(p, pts, 0.075, "wood_dark", keep=lambda q: not pt_in_slit(q, 0.1))
    for e_deg in (38,):
        e = math.radians(e_deg)
        pts = [DOME_C + Vector((rr * math.cos(e) * math.sin(a), -rr * math.cos(e) * math.cos(a), rr * math.sin(e)))
               for a in [TAU * i / 48 for i in range(49)]]
        tube_runs(p, pts, 0.06, "wood_dark", keep=lambda q: not pt_in_slit(q, 0.1))
    ts = [T_END * i / 14 for i in range(15)]
    for sx in (-1, 1):
        pts = [dome_pt(sx * (SW + 0.03), t, RD - 0.01) for t in ts]
        p.add(bm_tube([tuple(v) for v in pts], 0.09, segs=4), "wood")
    pts = [dome_pt(x, T_END + 0.012, RD - 0.01) for x in [(-SW - 0.1) + (2 * SW + 0.2) * i / 6 for i in range(7)]]
    p.add(bm_tube([tuple(v) for v in pts], 0.09, segs=4), "wood")
    p.cyl(0.3, 0.14, (0, 0, DOME_C.z + RD - 0.06), "wood_dark", segs=10)


def stage_10(p, rnd, extra):
    """Dome skin: green copper (verdigris), double-skinned so the open slit shows its inside."""
    xs = grid_x(RD, (-SW, SW))
    ts = grid_t((T_END,))
    p.add(sphere_patch(RD, xs, ts, lambda x, t: not in_slit(x, t)), "verdigris", smooth=True)
    ri = RD - 0.08
    p.add(sphere_patch(ri, grid_x(ri, (-SW, SW), n=12), grid_t((T_END,), n=12), lambda x, t: not in_slit(x, t), outward=False), "wood_mid", smooth=True)
    # copper drip line along the bottom edge
    p.add(ring(RD - 0.02, RD + 0.05, DOME_C.z - 0.02, DOME_C.z + 0.08, 36), "verdigris_dark")


def stage_11(p, rnd, extra):
    """The slit's two copper shutters, slid open over the dome, and a brass star finial on top."""
    ts = grid_t((T_END,), n=24)
    ts = [t for t in ts if t <= T_END + 1e-6]
    for sx in (-1, 1):
        x0, x1 = SW + 0.13, SW + 0.13 + 0.7
        xs = sorted({sx * x0, sx * x1} | {sx * (x0 + (x1 - x0) * i / 3) for i in range(4)})
        keep = lambda x, t: True
        p.add(sphere_patch(RD + 0.17, xs, ts, keep), "verdigris_dark")
        p.add(sphere_patch(RD + 0.1, xs, ts, keep, outward=False), "wood_mid")
        for xe in (x0, x1):
            pts = [dome_pt(sx * xe, t, RD + 0.135) for t in ts]
            p.add(bm_tube([tuple(v) for v in pts], 0.055, segs=4), "brass_dark")
        for t in (0.05, 0.5, 0.95, T_END - 0.02):
            pts = [dome_pt(sx * (x0 + (x1 - x0) * i / 4), t, RD + 0.19) for i in range(5)]
            p.add(bm_tube([tuple(v) for v in pts], 0.035, segs=4), "brass_dark")
        p.cyl(0.07, 0.12, tuple(dome_pt(sx * (x0 + x1) / 2, 0.02, RD + 0.16) + Vector((0, -0.06, -0.06))), "iron",
              segs=8, rot=(0, 90, 0))
    zt = DOME_C.z + RD
    p.add(bm_lathe([(0.26, zt - 0.04), (0.3, zt + 0.06), (0.12, zt + 0.16), (0.07, zt + 0.5), (0.04, zt + 0.62)], 10), "brass")
    p.ball(0.09, (0, 0, zt + 0.66), "brass_light", subdiv=1)
    star(p, (0, 0, zt + 0.98), 0.27, "brass_light", depth=0.05)


def stage_12(p, rnd, extra):
    """The great brass telescope on its pier and fork, reaching out of the slit (lens socket empty)."""
    top = 6.08
    p.cyl(0.36, 6.72 - top, (PV.x, PV.y, top), "stone_light", segs=10, bevel=0.03)
    p.cyl(0.48, 0.1, (PV.x, PV.y, 6.72), "brass_dark", segs=14)
    for sx in (-1, 1):
        p.add(bm_box(0.1, 0.26, PV.z - 6.82 + 0.12, bevel=0.02), "brass", M((sx * 0.5, PV.y, (6.82 + PV.z + 0.12) / 2)))
    p.cyl(0.07, 1.16, (-0.58, PV.y, PV.z), "brass_dark", segs=8, rot=(0, 90, 0))
    t = Part("telescope")
    t.add(bm_lathe([(0.2, -1.3), (0.29, -1.2), (0.3, 0.0), (0.33, 1.8), (0.36, 3.55)], 16), "brass", TM())
    for s, w in ((-1.15, 0.12), (-0.3, 0.1), (0.3, 0.1), (1.8, 0.12), (3.1, 0.1)):
        r = 0.3 + 0.06 * max(s, 0) / 3.55 + 0.035
        t.add(bm_cyl(r, r, w, 16), "brass_dark", TM(s))
    t.add(bm_lathe([(0.355, 3.5), (0.43, 3.6), (0.43, TUBE_FRONT), (0.375, TUBE_FRONT), (0.375, 3.92)], 16,
                   cap_bottom=False, cap_top=False), "brass_light", TM())
    t.add(bm_cyl(0.378, 0.378, 0.02, 16), "ink", TM(3.9))
    t.add(bm_cyl(0.44, 0.44, 0.05, 16), "brass_dark", TM(TUBE_FRONT - 0.04))
    # finder scope, eyepiece and trunnion bosses
    t.add(bm_cyl(0.075, 0.09, 1.5, 8), "brass", TM(1.1, 0.5))
    for s in (1.35, 2.35):
        t.add(bm_box(0.05, 0.2, 0.05), "brass_dark", TM(s, 0.38))
    t.add(bm_cyl(0.06, 0.06, 0.3, 8), "brass_dark", TM(-0.8) @ M((0.25, 0, 0), (0, 90, 0)))
    t.add(bm_cyl(0.075, 0.075, 0.08, 8), "ink", TM(-0.8) @ M((0.55, 0, 0), (0, 90, 0)))
    t.add(bm_cyl(0.13, 0.13, 0.12, 10), "brass_dark", M(tuple(PV + Vector((0.32, 0, 0))), (0, 90, 0)))
    t.add(bm_cyl(0.13, 0.13, 0.12, 10), "brass_dark", M(tuple(PV + Vector((-0.44, 0, 0))), (0, 90, 0)))
    extra.append((t, tuple(PV)))


def stage_13(p, rnd, extra):
    """The rune circle: a dark stone band round the terrace inlaid with glowing runes, and four
    standing stones with a rune each."""
    p.add(ring(3.25, 3.6, TERR_Z, TERR_Z + 0.055, 36), "stone_dark")
    g = Part("rune_circle")
    zt = TERR_Z + 0.055
    g.add(ring(3.285, 3.305, zt, zt + 0.012, 36), "glow")
    g.add(ring(3.545, 3.565, zt, zt + 0.012, 36), "glow")
    pats = [[(0, 0, .22, 90), (0.03, 0.04, .13, 35)],
            [(-.05, 0, .2, 90), (.05, 0, .2, 90), (0, 0, .12, 0)],
            [(0, 0, .22, 90), (.04, .05, .12, 45), (.04, -.05, .12, -45)],
            [(0, 0, .2, 60), (0, 0, .2, -60)],
            [(0, -.02, .2, 90), (0, .08, .13, 0), (0, -.08, .13, 0)],
            [(-.04, 0, .2, 75), (.04, 0, .2, 105), (0, .07, .08, 0)]]
    n = 30
    for k in range(n):
        a = TAU * (k + 0.5) / n
        if abs(math.degrees((a + math.pi) % TAU - math.pi)) < 12:
            continue
        base = M(P(a, 3.425, zt + 0.006), (0, 0, math.degrees(a)))
        for (cu, cv, ln, ang) in pats[rnd.randrange(len(pats))]:
            g.add(bm_box(ln, 0.032, 0.014), "glow", base @ M((cu, cv, 0), (0, 0, ang)))
    for th in (-45, 45, -135, 135):
        a = math.radians(th)
        bm = bm_box(0.42, 0.3, 1.05, bevel=0.06)
        for v in bm.verts:
            if v.co.z > 0:
                v.co.x *= 0.8
                v.co.y *= 0.85
        jitter(bm, 0.025, th + 400)
        rs = M(P(a, 3.74, TERR_Z + 0.5), (rnd.uniform(-3, 3), rnd.uniform(-3, 3), th))
        p.add(bm, rnd.choice(["stone_mid", "stone"]), rs)
        sub = rs @ M((0, -0.155, 0.08))
        for (cu, cv, ln, ang) in pats[(th // 45) % len(pats)]:
            g.add(bm_box(ln * 1.3, 0.02, 0.04), "glow", sub @ M((cu * 1.3, 0, cv * 1.3), (0, -ang, 0)))
    extra.append((g, (0, 0, zt)))


def stage_14(p, rnd, extra):
    """Lanterns: posts at the top of the stairs, two by the door, and a starry signpost at the foot."""
    for sx in (-1, 1):
        x, y = sx * 1.08, -3.92
        p.box((0.14, 0.14, 1.45), (x, y, TERR_Z + 0.22 + 0.72), "wood_mid", bevel=0.02)
        p.box((0.36, 0.08, 0.08), (x - sx * 0.13, y, TERR_Z + 1.62), "wood_mid")
        add_lantern(p, (x - sx * 0.26, y, TERR_Z + 1.04), s=1.0, hang=True)
        p.box((0.02, 0.02, 0.06), (x - sx * 0.26, y, TERR_Z + 1.6), "iron")
        th = math.radians(sx * 19)
        z = 2.75
        rwall = R(z)
        x0, y0, _ = P(th, rwall + 0.02)
        p.box((0.16, 0.06, 0.26), (x0, y0, z), "iron", rot=(0, 0, sx * 19))
        x1, y1, _ = P(th, rwall + 0.24)
        p.box((0.04, 0.36, 0.04), ((x0 + x1) / 2, (y0 + y1) / 2, z + 0.1), "iron", rot=(0, 0, sx * 19))
        add_lantern(p, (x1, y1, z - 0.42), s=0.9, hang=True)
    # signpost at the foot of the stairs, a painted star on night blue
    sx, sy = 1.55, -5.75
    p.box((0.12, 0.12, 1.3), (sx, sy, 0.65), "wood_mid", bevel=0.02)
    p.box((0.8, 0.07, 0.42), (sx - 0.18, sy - 0.08, 1.05), "night", bevel=0.02)
    p.box((0.84, 0.05, 0.05), (sx - 0.18, sy - 0.1, 1.28), "wood_dark")
    star(p, (sx - 0.18, sy - 0.12, 1.05), 0.14, "petal_yellow", depth=0.02)
    for i in range(4):
        p.ball(0.022, (sx - 0.5 + 0.22 * i * (1 if i % 2 else 0.8), sy - 0.12, 1.16 - 0.17 * (i % 2)), "white", subdiv=0)


def stage_15(p, rnd, extra):
    """Lived-in: a brass orrery, a bench with a blanket and books, a little tripod telescope,
    a crate of lenses, potted herbs by the door and ivy climbing the back wall."""
    z = TERR_Z + 0.05
    # orrery on a stone pedestal
    ox, oy, _ = P(math.radians(-78), 3.45)
    p.add(bm_lathe([(0.24, z), (0.2, z + 0.12), (0.13, z + 0.2), (0.11, z + 0.62), (0.2, z + 0.7), (0.22, z + 0.76)], 8), "stone_light", M((ox, oy, 0)))
    oz = z + 1.08
    p.cyl(0.025, 0.32, (ox, oy, z + 0.76), "brass_dark", segs=6)
    p.ball(0.11, (ox, oy, oz), "brass_light", subdiv=1)
    for i, (r, col, tilt) in enumerate(((0.2, "verdigris", 8), (0.3, "cloth", -6), (0.4, "shutter", 12))):
        p.add(ring(r - 0.01, r + 0.01, -0.008, 0.008, 18), "brass", M((ox, oy, oz), (tilt, 0, i * 40)))
        a = i * 2.1 + 0.5
        p.ball(0.035 + 0.012 * i, (ox + r * math.cos(a), oy + r * math.sin(a), oz + math.sin(math.radians(tilt)) * r * math.sin(a)), col, subdiv=1)
    # bench with a blanket and books, against the wall on the right
    th = 68
    bx, by, _ = P(math.radians(th), 3.25)
    bf = M((bx, by, z), (0, 0, th))
    for dx in (-0.55, 0.55):
        p.add(bm_box(0.1, 0.34, 0.42, bevel=0.015), "wood_mid", bf @ M((dx, 0, 0.21)))
    p.add(bm_box(1.4, 0.42, 0.07, bevel=0.015), "wood", bf @ M((0, 0, 0.45)))
    p.add(bm_box(0.5, 0.44, 0.03), "cloth", bf @ M((-0.3, 0, 0.495)))
    p.add(bm_box(0.06, 0.46, 0.2), "cloth", bf @ M((-0.56, 0, 0.4)))
    for i, col in enumerate(("night", "roof", "shutter")):
        p.add(bm_box(0.26, 0.19, 0.055), col, bf @ M((0.35, 0.02, 0.51 + 0.055 * i), (0, 0, i * 9 - 8)))
    p.add(bm_box(0.25, 0.18, 0.04), "white", bf @ M((0.35, 0.03, 0.51 + 0.055 * 3 - 0.005), (0, 0, 4)))
    # a small tripod telescope looking out over the valley
    tx, ty, _ = P(math.radians(-116), 3.4)
    for k in range(3):
        a = math.radians(120 * k + 20)
        p.add(bm_tube([(tx + 0.35 * math.cos(a), ty + 0.35 * math.sin(a), z), (tx, ty, z + 0.95)], 0.025, segs=4), "wood_mid")
    p.cyl(0.06, 0.75, (tx - 0.25, ty + 0.1, z + 0.85), "brass", r2=0.08, segs=8, rot=(0, 65, 160))
    # crate of lenses and a stack of rolled star charts by the door
    cx, cy, _ = P(math.radians(-31), 3.3)
    p.box((0.5, 0.42, 0.36), (cx, cy, z + 0.18), "wood_light", rot=(0, 0, -20), bevel=0.02)
    p.box((0.46, 0.38, 0.04), (cx, cy, z + 0.35), "straw", rot=(0, 0, -20))
    for i in range(4):
        p.cyl(0.07, 0.02, (cx - 0.12 + 0.08 * i, cy + 0.04 * (i % 2), z + 0.37), "glass", segs=10, rot=(70, 0, -20 + 15 * i))
    for i in range(3):
        p.cyl(0.05, 0.6, (cx + 0.4, cy + 0.25 + 0.1 * i, z + 0.05 + 0.08 * (i == 2)), "canvas", segs=8, rot=(0, 90, -40))
    # potted herbs either side of the door step
    for sx in (-1, 1):
        x, y, _ = P(math.radians(sx * 21), 3.02)
        p.add(bm_lathe([(0.13, z), (0.17, z + 0.25), (0.19, z + 0.27)], 8), "roof_mid", M((x, y, 0)))
        p.cyl(0.16, 0.02, (x, y, z + 0.23), "soil", segs=8)
        for k in range(5):
            a = TAU * k / 5 + rnd.uniform(0, 0.4)
            p.ball(0.1, (x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), z + 0.36 + 0.04 * (k % 2)), rnd.choice(["grass", "grass_dark", "leaf_deep"]), subdiv=0, smooth=False)
        p.ball(0.11, (x, y, z + 0.45), "grass_light", subdiv=0, smooth=False)
    # ivy on the back-left of the tower
    for k in range(34):
        a = math.radians(rnd.uniform(-150, -95))
        zz = FLOOR_Z + rnd.uniform(0, 2.8) * (1 - 0.35 * rnd.random())
        r = R(zz) + 0.04
        x, y, _ = P(a, r)
        p.ball(rnd.uniform(0.13, 0.22), (x, y, zz), rnd.choice(["leaf_deep", "grass_dark", "grass_dark", "grass"]),
               scale=(1.0, 0.55, 0.85), rot=(0, 0, math.degrees(a)), subdiv=0, smooth=False)


def stage_16(p, rnd, extra):
    """The Great Rune: the lens itself, set in the telescope in brass claws, with a ring of runes
    around the dew cap."""
    for k in range(6):
        a = 60 * k + 30
        p.add(bm_box(0.07, 0.06, 0.14), "brass_light", TM(TUBE_FRONT + 0.02) @ M((0.41 * math.cos(math.radians(a)), 0.41 * math.sin(math.radians(a)), 0), (0, 0, a)))
    g = Part("great_rune")
    g.add(bm_lathe([(0.0, 3.93), (0.372, 3.96), (0.372, 4.0), (0.3, 4.08), (0.16, 4.12), (0.0, 4.135)], 16), "glow", TM(), smooth=True)
    for k in range(12):   # rune ring around the dew cap
        a = TAU * k / 12
        base = TM(3.85) @ M((0.438 * math.cos(a), 0.438 * math.sin(a), 0), (0, 0, math.degrees(a) + 90))
        g.add(bm_box(0.012, 0.025, 0.16 if k % 3 else 0.2), "glow", base)
        g.add(bm_box(0.08, 0.025, 0.012), "glow", base @ M((0, 0, 0.04 * ((k % 2) * 2 - 1)), (0, 25 * ((k % 3) - 1), 0)))
    extra.append((g, tuple(PV + tel_dir() * 4.05)))


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06, stage_07, stage_08,
          stage_09, stage_10, stage_11, stage_12, stage_13, stage_14, stage_15, stage_16]


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
            objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def report(stages, counts):
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    bpy.context.view_layer.update()
    low = sorted((min((o.matrix_world @ v.co).z for v in o.data.vertices), o.name) for o in meshes)[:3]
    print("LOWEST", [(round(z, 2), n) for z, n in low])
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [min(p[i] for p in pts) for i in range(3)]
    hi = [max(p[i] for p in pts) for i in range(3)]
    print("STAGE TRIS", counts, "TOTAL", sum(counts.values()))
    print("BBOX lo", [round(v, 2) for v in lo], "hi", [round(v, 2) for v in hi])
    for n in ("telescope", "great_rune", "rune_circle"):
        o = bpy.data.objects[n]
        print("NODE", n, "parent", o.parent.name, "origin", [round(v, 3) for v in o.matrix_world.translation],
              "mats", [m.name for m in o.data.materials], "tris", common.tris([o]))
    s = -1
    for i in range(400):   # where the tube leaves the dome
        q = PV + tel_dir() * (i * 0.01)
        if (q - DOME_C).length > RD:
            s = i * 0.01
            break
    print("TUBE exits dome at s=%.2f, front end" % s, [round(v, 2) for v in PV + tel_dir() * TUBE_FRONT])
    print("glow users", sorted({o.name for o in meshes if any(m and m.name == "glow" for m in o.data.materials)}))


def main():
    stages = build()
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    report(stages, counts)
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=20, lens=50, margin=0.86)   # meadow occludes the bake
    for k in range(1, len(stages) + 1):   # bake each stage with only the stages that exist when it appears
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("observatory.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=20, lens=50, margin=0.84, min_radius=7.2)
            common.render(os.path.join(common.OUT_PREV, "observatory_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-34, elev=12, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "observatory.png"))
    common.save_blend("observatory")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
