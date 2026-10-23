"""The Guild Hall: a long timber hall with a gabled entrance porch, a carved door and crest,
serpent-headed barge boards, banners, a training yard with dummies and a weapon rack, and a
lookout platform, in 16 cumulative stages (stage_01 .. stage_16). See art/specs/guildhall.md.

Run headless:  powershell -NoProfile -ExecutionPolicy Bypass -File art/blender.ps1 art/scripts/guildhall.py
Set RENDER_STAGES = False to skip the 16 stage renders while iterating.

Layout: the hall is centred on the origin, long along X, its door and porch on the front (-Y).
The training yard and the lookout sit on the -X side (x from about -10 to -5).
Wall frames: local x runs along the wall, local -y points outward, the outer face is at y = 0.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, bm_uv, jitter, add_lantern
import bmesh
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", os.environ.get("GUILDHALL_STAGES", "1") != "0")
QUICK = os.environ.get("GUILDHALL_QUICK") == "1"      # build + print counts only
TAU = 2 * math.pi

# guild colours: deep blue and old gold, plus the yard and roof extras
common.PALETTE.update({
    "guild_blue": "#3F566F", "guild_blue_dark": "#2F3F52", "gold": "#C4A050", "moss": "#6E7D46",
    "sand": "#BCA987", "sand_dark": "#A38F6E", "leather": "#7A5638", "rope": "#B39C72",
})

STONES = ["stone", "stone", "stone_mid", "stone_light", "stone_warm", "stone_mid"]
WOODS = ["wood", "wood", "wood_mid", "wood_light", "wood", "wood_mid"]
SHINGLES = ["shingle"] * 5 + ["shingle_light", "shingle_dark"]
PORCH_SHINGLES = ["shingle_light", "shingle", "shingle_light", "shingle_light"]   # the porch sits in the main roof's shade

# ------------------------------------------------------------------ dimensions
HX, HY = 4.5, 2.8            # hall half length (X) and half depth (Y), outer wall line
BASE_Z = 0.5                 # plinth top
SILL_Z = 0.75                # top of the sill logs; plank walls start here
WALL_TOP = 3.25              # wall plates sit 3.25 .. 3.5
PLATE_Z = 3.5
WT = 0.1                     # plank thickness
EAVE_Y, EAVE_Z = 3.55, 3.0   # main roof top surface at the eaves
RIDGE_Z = 6.5
ROOF_X = HX + 0.55           # gable overhang
ROOF_T = 0.14                # roof deck thickness
K = (RIDGE_Z - EAVE_Z) / EAVE_Y
SLOPE = math.atan(K)
SLOPE_L = math.hypot(EAVE_Y, RIDGE_Z - EAVE_Z)
S_CUT = (EAVE_Y - HY) / math.cos(SLOPE)      # front slope stops at the wall line under the porch
PORCH_GAP = 1.8

# porch: posts at (+-PW, PY), its own gable roof running along Y back into the main roof
PW, PY = 1.55, -4.2
P_EAVE_X, P_EAVE_Z, P_RIDGE = 2.05, 3.2, 5.1
PK = (P_RIDGE - P_EAVE_Z) / P_EAVE_X
P_SLOPE = math.atan(PK)
P_SLOPE_L = math.hypot(P_EAVE_X, P_RIDGE - P_EAVE_Z)
P_Y0, P_Y1 = -4.75, -1.15

DOOR_HW, DOOR_TOP = 0.85, 3.05
ARCH_ZS, ARCH_H = 2.35, 0.63           # door leaves: straight to 2.35, elliptical arch to 2.98
WIN_Z = (1.4, 2.5)
VENT = (0.0, 0.36, 4.24, 4.96)         # round gable vent hole (u, hw, z0, z1)

WALLS = {   # name: (frame, half length, post u's, windows (u, half width))
    "front": (M((0, -HY, 0)), HX, [-4.35, -2.75, -1.15, 1.15, 2.75, 4.35], [(-1.95, 0.36), (1.95, 0.36)]),
    "back": (M((0, HY, 0), (0, 0, 180)), HX, [-4.35, -2.15, 0.0, 2.15, 4.35],
             [(-3.25, 0.36), (-1.07, 0.36), (1.07, 0.36), (3.25, 0.36)]),
    "left": (M((-HX, 0, 0), (0, 0, -90)), HY, [0.0], [(-1.35, 0.36), (1.35, 0.36)]),
    "right": (M((HX, 0, 0), (0, 0, 90)), HY, [0.0], [(-1.35, 0.36), (1.35, 0.36)]),
}

# training yard (-X side), lookout, props
YARD = (-7.6, -0.05, 2.35, 3.6)        # centre x, y, half extents
FENCE = (-10.15, -5.4, -3.9, 3.75)     # x0, x1 (open toward the hall), y0, y1
RING = (-6.75, 1.05, 1.0)
LX, LY = -8.85, 2.5
CHIM = (2.9, 1.0)


def roof_z(y):
    return RIDGE_Z - K * abs(y)


def slope_frame(side):
    """Main roof slope: local x along the hall, y up the slope from the eave, z out of the roof."""
    a = math.degrees(SLOPE)
    if side < 0:
        return M((0, -EAVE_Y, EAVE_Z), (a, 0, 0))
    return M((0, EAVE_Y, EAVE_Z), (0, 0, 180)) @ M((0, 0, 0), (a, 0, 0))


def porch_frame(side):
    """Porch roof slope (side -1 = -X half): local x along Y, y up the slope, z out of the roof."""
    yc = (P_Y0 + P_Y1) / 2
    return M((side * P_EAVE_X, yc, P_EAVE_Z), (0, 0, 90 * side)) @ M((0, 0, 0), (math.degrees(P_SLOPE), 0, 0))


def roof_regions(side):
    if side > 0:
        return [(-ROOF_X, ROOF_X, 0.0)]
    return [(-ROOF_X, -PORCH_GAP, 0.0), (-PORCH_GAP, PORCH_GAP, S_CUT), (PORCH_GAP, ROOF_X, 0.0)]


def wall_holes(name):
    holes = [(u, hw, WIN_Z[0], WIN_Z[1]) for u, hw in WALLS[name][3]]
    if name == "front":
        holes.append((0.0, DOOR_HW, SILL_Z, DOOR_TOP))
    return holes


# ------------------------------------------------------------------ helpers

def planks(p, rnd, base, u0, u1, z0, ztop, holes=(), y=0.1, wr=(0.24, 0.34), cols=WOODS):
    """Vertical boards on a wall frame from u0 to u1, top at ztop(u); boards snap to the hole edges."""
    cuts = sorted({u0, u1} | {c for hc, hw, _, _ in holes for c in (hc - hw, hc + hw) if u0 < c < u1})
    for a, b in zip(cuts, cuts[1:]):
        u = a
        while b - u > 0.01:
            w = rnd.uniform(*wr)
            if b - u - w < wr[0] * 0.6:
                w = b - u
            c = u + w / 2
            spans = [(z0, ztop(c))]
            for hc, hw, za, zb in holes:
                if hc - hw - 1e-6 <= c <= hc + hw + 1e-6:
                    new = []
                    for sa, sb in spans:
                        if zb <= sa or za >= sb:
                            new.append((sa, sb))
                            continue
                        if za > sa:
                            new.append((sa, za))
                        if zb < sb:
                            new.append((zb, sb))
                    spans = new
            for sa, sb in spans:
                if sb - sa > 0.04:
                    p.add(bm_box(w + 0.004, WT + rnd.uniform(-0.008, 0.012), sb - sa), rnd.choice(cols),
                          base @ M((c, y + rnd.choice((-0.012, 0.0, 0.01)), (sa + sb) / 2)))
            u += w


def block_run(p, rnd, a, b, out, z0, z1, depth=0.45, wr=(0.6, 1.0), cols=STONES):
    """Stone blocks from a to b (2D) with their outer face on the line; `out` is the outward normal."""
    ax, ay = a
    bx, by = b
    L = math.hypot(bx - ax, by - ay)
    dx, dy = (bx - ax) / L, (by - ay) / L
    ang = math.degrees(math.atan2(dy, dx))
    t = 0.0
    while L - t > 1e-3:
        w = rnd.uniform(*wr)
        if L - t - w < wr[0] * 0.55:
            w = L - t
        c = t + w / 2
        d = depth + rnd.uniform(-0.02, 0.04)
        off = d / 2 - rnd.uniform(0.0, 0.025)
        p.add(jitter(bm_box(w - 0.035, d, z1 - z0 - 0.03), 0.014, rnd.randint(0, 9999)), rnd.choice(cols),
              M((ax + dx * c - out[0] * off, ay + dy * c - out[1] * off, (z0 + z1) / 2), (0, 0, ang)))
        t += w


def shingles(p, rnd, F, xa, xb, s0, s1, row=0.64, wr=(0.55, 0.85), cols=SHINGLES):
    """Staggered rows of slightly lifted shingles on a slope frame."""
    n = max(1, round((s1 - s0) / row))
    rh = (s1 - s0) / n
    for k in range(n):
        sb = s0 + k * rh
        x, first = xa, True
        while xb - x > 0.04:
            w = rnd.uniform(*wr) * (0.5 if first and k % 2 else 1.0)
            first = False
            if xb - x - w < wr[0] * 0.5:
                w = xb - x
            L = rh + 0.16
            p.add(bm_box(w - 0.025, L, 0.045), rnd.choice(cols),
                  F @ M((x + w / 2, sb + L / 2 - 0.13, 0.025 + rnd.uniform(-0.006, 0.006)),
                        (-3.5 + rnd.uniform(-1.2, 1.2), 0, rnd.uniform(-1.5, 1.5))))
            x += w


def beam_between(p, a, b, size, matname):
    """Box of cross-section `size` (w, h) running from a to b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    rot = d.to_track_quat("Y", "Z").to_matrix().to_4x4()
    p.add(bm_box(size[0], d.length, size[1]), matname, Matrix.Translation((a + b) / 2) @ rot)


GLYPHS = [
    [((0, -1), (0, 1)), ((0, 0.3), (0.6, 0.9)), ((0, -0.2), (0.6, 0.4))],
    [((0, -1), (0, 1)), ((0, 1), (0.6, 0.2)), ((0.6, 0.2), (0, -0.2))],
    [((-0.5, -1), (0.5, 1)), ((0.5, -1), (-0.5, 1))],
    [((0, -1), (0, 1)), ((-0.5, 0.5), (0.5, -0.5))],
    [((-0.4, -1), (-0.4, 1)), ((0.4, -1), (0.4, 1)), ((-0.4, 0.3), (0.4, -0.3))],
    [((0, -1), (0, 1)), ((0, 0.5), (0.5, 1)), ((0, 0.5), (-0.5, 1))],
]


def glyph(p, base, g, s, matname):
    for (ax, az), (bx, bz) in g:
        L = math.hypot(bx - ax, bz - az) * s
        p.add(bm_box(0.024, 0.02, L + 0.02), matname,
              base @ M(((ax + bx) / 2 * s, 0, (az + bz) / 2 * s), (0, math.degrees(math.atan2(bx - ax, bz - az)), 0)))


def serpent(p, A, d, s=1.0, matname="wood_light"):
    """Carved serpent head ending a crossed barge board: the neck leaves apex A along the board
    direction d, rears up, and the head looks outward."""
    A, d = Vector(A), Vector(d).normalized()
    up = Vector((0, 0, 1))
    dh = Vector((d.x, d.y, 0)).normalized()
    pts = [A - d * 0.25 * s, A + d * 0.28 * s, A + dh * 0.32 * s + up * 0.45 * s, A + dh * 0.38 * s + up * 0.64 * s]
    p.add(bm_tube(pts, [0.085 * s, 0.09 * s, 0.085 * s, 0.075 * s], 6), matname)
    th = math.degrees(math.atan2(-dh.x, dh.y))
    H = M(A + dh * 0.52 * s + up * 0.72 * s, (0, 0, th))
    p.add(bm_ico(0.12 * s, 1), matname, H @ M((0, 0, 0), scale=(0.85, 1.5, 0.78)))
    p.add(bm_box(0.15 * s, 0.17 * s, 0.085 * s), matname, H @ M((0, 0.2 * s, -0.025 * s)))
    p.add(bm_box(0.12 * s, 0.15 * s, 0.04 * s), "wood_dark", H @ M((0, 0.16 * s, -0.1 * s), (-14, 0, 0)))
    for e in (-1, 1):
        p.add(bm_ico(0.028 * s, 0), "gold", H @ M((e * 0.085 * s, 0.07 * s, 0.05 * s)))
    fin = [(-0.24 * s, 0.05 * s), (0.08 * s, 0.07 * s), (-0.3 * s, 0.2 * s)]
    p.add(bm_prism(fin, 0.03 * s), "wood_dark", H @ M((0, 0, 0), (0, 0, 90)))


def stake(p, x, y, flag=False, h=0.36):
    p.box((0.08, 0.08, h), (x, y, h / 2), "wood_light")
    p.cyl(0.057, 0.09, (x, y, h), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
    if flag:
        p.add(bm_prism([(0, 0), (0.24, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.04, y, h + 0.08)))


def string_line(p, a, b, z=0.29):
    (x0, y0), (x1, y1) = a, b
    p.box((math.hypot(x1 - x0, y1 - y0), 0.024, 0.024), ((x0 + x1) / 2, (y0 + y1) / 2, z), "white",
          rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))


def superellipse(rnd, cx, cy, ax, ay, n=36, e=4, wob=0.02):
    pts = []
    for i in range(n):
        a = TAU * i / n
        c, s = math.cos(a), math.sin(a)
        r = 1.0 / ((abs(c) ** e + abs(s) ** e) ** (1 / e))
        pts.append((cx + c * r * ax * (1 + rnd.uniform(-wob, wob)), cy + s * r * ay * (1 + rnd.uniform(-wob, wob))))
    return pts


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch, survey stakes and string for the hall and porch, yard corner flags, the plan."""
    p.add(bm_slab(superellipse(rnd, 0.0, -0.85, 5.6, 4.5, 44), 0.03), "dirt")
    hall = [(-HX, -HY), (0, -HY), (HX, -HY), (HX, 0), (HX, HY), (0, HY), (-HX, HY), (-HX, 0)]
    for i, (x, y) in enumerate(hall):
        stake(p, x * 0.99, y * 0.98, flag=(i % 2 == 0))
    porch = [(-1.75, -HY * 0.98), (-1.75, -4.45), (1.75, -4.45), (1.75, -HY * 0.98)]
    for x, y in porch[1:3]:
        stake(p, x, y)
    corners = [hall[0], hall[2], hall[4], hall[6]]
    for a, b in zip(corners, corners[1:] + corners[:1]):
        string_line(p, a, b)
    for a, b in zip(porch, porch[1:]):
        string_line(p, a, b)
    # the yard is pegged out too, with taller flagged pegs
    for x, y in ((FENCE[1], FENCE[2]), (FENCE[0], FENCE[2]), (FENCE[0], FENCE[3]), (FENCE[1], FENCE[3])):
        stake(p, x, y, flag=True, h=0.5)
    # the plan: a long hall with a porch, held down by pebbles
    px, py, pr = 3.6, -4.65, -8
    p.box((0.66, 0.46, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    for (w, d, x, y) in ((0.46, 0.012, 0, 0.1), (0.46, 0.012, 0, -0.06), (0.012, 0.16, -0.23, 0.02),
                         (0.012, 0.16, 0.23, 0.02), (0.012, 0.07, -0.06, -0.1), (0.012, 0.07, 0.06, -0.1),
                         (0.12, 0.012, 0, -0.135)):
        p.add(bm_box(w, d, 0.004), "tunic", base @ M((x, y, 0)))
    for i, (dx, dy) in enumerate(((-0.3, -0.19), (0.29, 0.2))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.07)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (-2.6, -4.3, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.15, 0.24, 0.15), (-2.15, -4.53, 0.085), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (-3.3, -4.85 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    p.box((0.03, 0.32, 0.09), (-3.3, -4.75, 0.06), "white", rot=(0, 0, 8))
    for i in range(7):
        x, y = rnd.uniform(-4.5, 4.5), rnd.uniform(-3.5, 2.5)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light", M((x, y, 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Two courses of stone plinth for the hall and the porch platform, flagstones, and front steps."""
    X0, Y0, PX0, PY0 = HX + 0.25, HY + 0.25, 1.85, -4.55
    p.box((2 * X0 - 0.3, 2 * Y0 - 0.3, 0.46), (0, 0, 0.23), "stone_dark")
    p.box((2 * PX0 - 0.3, -Y0 - PY0, 0.46), (0, (PY0 - Y0) / 2 + 0.15, 0.23), "stone_dark")
    for z0, z1, i in ((0.0, 0.26, 0.0), (0.26, 0.5, 0.03)):
        runs = [((X0 - i, Y0 - i), (-X0 + i, Y0 - i), (0, 1)),
                ((-X0 + i, Y0 - i), (-X0 + i, -Y0 + i), (-1, 0)),
                ((X0 - i, -Y0 + i), (X0 - i, Y0 - i), (1, 0)),
                ((-X0 + i, -Y0 + i), (-PX0 + i, -Y0 + i), (0, -1)),
                ((PX0 - i, -Y0 + i), (X0 - i, -Y0 + i), (0, -1)),
                ((-PX0 + i, -Y0), (-PX0 + i, PY0 + i), (-1, 0)),
                ((-PX0 + i, PY0 + i), (PX0 - i, PY0 + i), (0, -1)),
                ((PX0 - i, PY0 + i), (PX0 - i, -Y0), (1, 0))]
        for a, b, out in runs:
            block_run(p, rnd, a, b, out, z0, z1)
    p.box((2 * X0 - 0.12, 2 * Y0 - 0.12, 0.03), (0, 0, 0.485), "stone_mid")
    p.box((2 * PX0 - 0.12, -Y0 - PY0 - 0.06, 0.03), (0, (PY0 - Y0) / 2, 0.485), "stone_mid")
    # porch flagstones
    for i in range(4):
        for j in range(3):
            x = -1.8 + 0.9 * (i + 0.5) + rnd.uniform(-0.04, 0.04)
            y = PY0 + 0.04 + 0.55 * (j + 0.5) + rnd.uniform(-0.03, 0.03)
            p.box((0.84 + rnd.uniform(-0.06, 0.0), 0.5, 0.03), (x, y, 0.512), rnd.choice(["stone_light", "stone", "stone_light"]),
                  rot=(0, 0, rnd.uniform(-2, 2)))
    # steps up to the porch
    p.box((2.5, 0.38, 0.34), (0, PY0 - 0.17, 0.17), "stone", bevel=0.04)
    p.box((2.8, 0.38, 0.17), (0, PY0 - 0.53, 0.085), "stone_light", bevel=0.04)
    # spare blocks waiting by the right corner
    for i, (dx, dy, z, r) in enumerate(((0, 0, 0, 10), (0.05, 0.34, 0, -6), (0.02, 0.17, 0.22, 4))):
        p.box((0.52, 0.3, 0.22), (5.25 + dx, -3.45 + dy, z + 0.11), STONES[i], rot=(0, 0, r + 70), bevel=0.03)


def stage_03(p, rnd, extra):
    """Sill logs on the plinth and the plank floor, with a pile of timber and a sawhorse inside."""
    for y in (-HY + 0.15, HY - 0.15):
        p.box((2 * HX, 0.3, 0.25), (0, y, 0.625), "wood_dark", bevel=0.04)
    for x in (-HX + 0.15, HX - 0.15):
        p.box((0.3, 2 * HY - 0.6, 0.25), (x, 0, 0.625), "wood_dark", bevel=0.04)
    n = 17
    for i in range(n):
        y = -HY + 0.3 + (2 * HY - 0.6) * (i + 0.5) / n
        p.box((2 * HX - 0.62, (2 * HY - 0.6) / n - 0.012, 0.05), (rnd.uniform(-0.02, 0.02), y, 0.525), rnd.choice(WOODS))
    # timber for the frame, stacked inside (hidden once the walls are up)
    for i in range(6):
        p.box((3.4, 0.24, 0.24), (-1.6 + rnd.uniform(-0.1, 0.1), 0.6 + 0.26 * (i % 3), 0.67 + 0.24 * (i // 3)), "wood_mid",
              rot=(0, 0, rnd.uniform(-2, 2)))
    sx, sy = 1.8, 0.4
    p.box((1.1, 0.12, 0.1), (sx, sy, 1.15), "wood_light")
    for s in (-1, 1):
        for t in (-1, 1):
            p.box((0.07, 0.07, 0.68), (sx + s * 0.42, sy + t * 0.17, 0.85), "wood_mid", rot=(t * 14, 0, 0))
    p.box((0.9, 0.2, 0.08), (sx - 0.1, sy, 1.24), "wood", rot=(0, 0, 6))
    p.box((0.55, 0.012, 0.13), (sx + 0.25, sy - 0.12, 1.33), "iron", rot=(0, 8, 0))


def stage_04(p, rnd, extra):
    """Thick timber posts around the hall."""
    for name, (base, L, posts, wins) in WALLS.items():
        for u in posts:
            p.add(bm_box(0.3, 0.3, WALL_TOP - BASE_Z, bevel=0.03), rnd.choice(["wood_dark", "wood_mid", "wood_dark"]),
                  base @ M((u, 0.15, (BASE_Z + WALL_TOP) / 2)))


def stage_05(p, rnd, extra):
    """Wall plates, tie beams, rails and knee braces (the braces end up hidden behind the planks)."""
    for name, (base, L, posts, wins) in WALLS.items():
        p.add(bm_box(2 * L - (0 if name in ("front", "back") else 0.6), 0.32, PLATE_Z - WALL_TOP, bevel=0.025),
              "wood_dark", base @ M((0, 0.16, (WALL_TOP + PLATE_Z) / 2)))
        for a, b in zip(posts, posts[1:]):
            p.add(bm_box(b - a - 0.3, 0.1, 0.12), "wood_mid", base @ M(((a + b) / 2, 0.24, 1.32)))
        for u in posts:
            for s in (-1, 1):
                if abs(u + s * 0.4) > L - 0.15:
                    continue
                p.add(bm_box(0.1, 0.1, 0.72), "wood_mid", base @ M((u + s * 0.3, 0.24, 2.98), (0, s * 45, 0)))
    for x in (-2.75, 0.0, 2.75):
        p.box((0.26, 2 * HY - 0.4, 0.24), (x, 0, PLATE_Z + 0.12), "wood_dark")


def stage_06(p, rnd, extra):
    """Plank walls, boards snapped around the door and window openings."""
    for name, (base, L, posts, wins) in WALLS.items():
        planks(p, rnd, base, -L + 0.3, L - 0.3, SILL_Z, lambda u: WALL_TOP, wall_holes(name))


def stage_07(p, rnd, extra):
    """Plank gable ends with a round vent hole, rafters, battens and the ridge beam."""
    top = lambda u: roof_z(u) - ROOF_T - 0.05
    for name in ("left", "right"):
        planks(p, rnd, WALLS[name][0], -HY + 0.15, HY - 0.15, PLATE_Z - 0.05, top, [VENT])
    xs = [-ROOF_X + 0.06 + (2 * ROOF_X - 0.12) * i / 10 for i in range(11)]
    for side in (-1, 1):
        F = slope_frame(side)
        for x in xs:
            s0 = S_CUT if side < 0 and abs(x) < PORCH_GAP else -0.05
            p.add(bm_box(0.12, SLOPE_L - s0, 0.16), "wood_mid", F @ M((x, (s0 + SLOPE_L) / 2, -ROOF_T - 0.08)))
        for s in (0.35, 1.25, 2.15, 3.05, 3.95, 4.75):
            for xa, xb, s0 in roof_regions(side):
                if s >= s0:
                    p.add(bm_box(xb - xa, 0.07, 0.045), "wood_light", F @ M(((xa + xb) / 2, s, -ROOF_T + 0.02)))
    p.box((2 * ROOF_X, 0.18, 0.26), (0, 0, RIDGE_Z - ROOF_T - 0.24), "wood_dark")
    # a ladder up to the plates on the back wall
    bot, tp = Vector((3.4, HY + 1.05, 0.0)), Vector((3.4, HY + 0.12, PLATE_Z + 0.35))
    for s in (-1, 1):
        beam_between(p, bot + Vector((s * 0.24, 0, 0)), tp + Vector((s * 0.24, 0, 0)), (0.07, 0.06), "wood_light")
    for k in range(1, 11):
        q = bot + (tp - bot) * (k / 11)
        p.box((0.5, 0.04, 0.04), tuple(q), "wood_light")


def stage_08(p, rnd, extra):
    """Shingle roof with a ridge log, moss, and crossed barge boards ending in carved serpent heads."""
    for side in (-1, 1):
        F = slope_frame(side)
        for xa, xb, s0 in roof_regions(side):
            p.add(bm_box(xb - xa, SLOPE_L - s0, ROOF_T), "shingle_dark", F @ M(((xa + xb) / 2, (s0 + SLOPE_L) / 2, -ROOF_T / 2)))
            shingles(p, rnd, F, xa, xb, s0, SLOPE_L - 0.06)
        for xs in (-1, 1):
            p.add(bm_box(0.09, SLOPE_L + 0.2, 0.3), "wood_mid", F @ M((xs * (ROOF_X - 0.045), SLOPE_L / 2 - 0.08, 0.0)))
    p.cyl(0.16, 2 * ROOF_X + 0.12, (-ROOF_X - 0.06, 0, RIDGE_Z + 0.02), "wood_dark", segs=8, rot=(0, 90, 0))
    for xs in (-1, 1):
        A = (xs * (ROOF_X - 0.045), 0, RIDGE_Z)
        for side in (-1, 1):
            serpent(p, A, (0, -side * math.cos(SLOPE), math.sin(SLOPE)), s=1.3)
    # moss creeping over the back and the shaded front corners
    for side, n in ((1, 7), (-1, 3)):
        F = slope_frame(side)
        for i in range(n):
            x, s = rnd.uniform(-ROOF_X + 0.4, ROOF_X - 0.4), rnd.uniform(0.1, 2.2)
            if side < 0 and abs(x) < PORCH_GAP + 0.3:
                x = math.copysign(rnd.uniform(3.0, 4.5), x)
            p.add(jitter(bm_ico(rnd.uniform(0.18, 0.3), 0), 0.04, 70 + i), "moss",
                  F @ M((x, s, 0.04), scale=(1.6, 1.0, 0.28)), smooth=True)


def stage_09(p, rnd, extra):
    """Entrance porch: carved posts, beams and a gabled roof that tucks into the main roof."""
    for x in (-PW, PW):
        p.box((0.42, 0.42, 0.12), (x, PY, 0.58), "stone_light", bevel=0.03)
        p.box((0.26, 0.26, 3.1 - 0.64), (x, PY, 0.64 + (3.1 - 0.64) / 2), "wood_dark", bevel=0.04)
        for z in (0.82, 2.72):
            p.box((0.32, 0.32, 0.08), (x, PY, z), "wood_mid", bevel=0.015)
        for k in range(4):            # carved twist between the collars
            z = 1.15 + 0.38 * k
            p.box((0.3, 0.3, 0.05), (x, PY, z), "wood_mid", rot=(0, 0, 45))
        p.add(bm_prism([(-0.36, 0), (0.36, 0), (0.26, -0.14), (-0.26, -0.14)], 0.22), "wood_mid", M((x, PY, 3.1)))
    p.box((2 * PW + 0.55, 0.28, 0.25), (0, PY, 3.225), "wood_dark", bevel=0.025)
    for x in (-PW, PW):
        p.box((0.24, abs(PY + HY) + 0.1, 0.25), (x, (PY - HY) / 2 + 0.05, 3.225), "wood_dark", bevel=0.02)
    # gable infill above the lintel
    gb = M((0, PY - 0.2, 0))
    planks(p, rnd, gb, -1.72, 1.72, 3.3, lambda u: P_RIDGE - PK * abs(u) - ROOF_T - 0.05)
    # rafters and ridge beam under the porch roof
    L = P_Y1 - P_Y0
    for side in (-1, 1):
        F = porch_frame(side)
        for i in range(5):
            p.add(bm_box(0.1, P_SLOPE_L, 0.13), "wood_mid", F @ M((-L / 2 + 0.15 + (L - 0.3) * i / 4, P_SLOPE_L / 2, -ROOF_T - 0.065)))
        p.add(bm_box(L, P_SLOPE_L, ROOF_T), "shingle_dark", F @ M((0, P_SLOPE_L / 2, -ROOF_T / 2)))
        shingles(p, rnd, F, -L / 2, L / 2, 0.0, P_SLOPE_L - 0.05, cols=PORCH_SHINGLES)
        lx = -side * (L / 2 - 0.045)
        p.add(bm_box(0.09, P_SLOPE_L + 0.18, 0.26), "wood_mid", F @ M((lx, P_SLOPE_L / 2 - 0.07, 0.0)))
    p.cyl(0.13, L + 0.05, (0, P_Y0 - 0.05, P_RIDGE + 0.02), "wood_dark", segs=8, rot=(-90, 0, 0))
    A = (0, P_Y0 + 0.045, P_RIDGE)
    for side in (-1, 1):
        serpent(p, A, (-side * math.cos(P_SLOPE), 0, math.sin(P_SLOPE)), s=0.9)


def arch_top(u):
    return ARCH_ZS + ARCH_H * math.sqrt(max(1 - (u / DOOR_HW) ** 2, 0.0))


def ellipse_pt(rx, rz, t):
    return (rx * math.cos(t), ARCH_ZS + rz * math.sin(t))


def stage_10(p, rnd, extra):
    """Carved double door with a rune lintel, and the guild crest on the porch gable."""
    hw, yd = DOOR_HW, -HY + 0.12
    back = [(-hw, SILL_Z), (hw, SILL_Z)] + [ellipse_pt(hw, ARCH_H, math.pi * k / 12) for k in range(13)]
    p.add(bm_prism(back, 0.05), "wood_dark", M((0, yd + 0.05, 0)))
    for i in range(6):
        a, b = -hw + 2 * hw * i / 6 + 0.012, -hw + 2 * hw * (i + 1) / 6 - 0.012
        pts = [(a, SILL_Z + 0.01), (b, SILL_Z + 0.01)] + [(b - (b - a) * k / 3, arch_top(b - (b - a) * k / 3)) for k in range(4)]
        p.add(bm_prism(pts, 0.07), rnd.choice(["wood", "wood_mid", "wood"]), M((0, yd, 0)))
    p.box((0.05, 0.08, arch_top(0) - SILL_Z), (0, yd - 0.01, (arch_top(0) + SILL_Z) / 2), "wood_dark")
    for s in (-1, 1):
        for z in (1.2, 2.15):
            p.box((0.7, 0.03, 0.07), (s * 0.44, yd - 0.05, z), "iron")
        ring = [(s * 0.15 + 0.07 * math.cos(TAU * k / 8), yd - 0.08, 1.48 + 0.07 * math.sin(TAU * k / 8)) for k in range(9)]
        p.add(bm_tube(ring, 0.014, 4), "iron")
        p.cyl(0.04, 0.04, (s * 0.15, yd - 0.04, 1.55), "iron", segs=8, rot=(90, 0, 0))
    # spandrels, arch moulding, jambs and the carved rune lintel
    for s in (-1, 1):
        pts = [(0, DOOR_TOP), (s * hw, DOOR_TOP), (s * hw, ARCH_ZS)] + \
              [ellipse_pt(s * hw, ARCH_H, math.pi / 2 * k / 6) for k in range(1, 6)] + [(0, ARCH_ZS + ARCH_H)]
        p.add(bm_prism(pts, 0.1), "wood_mid", M((0, -HY + 0.1, 0)))
    n = 9
    for k in range(n):
        t0, t1 = math.pi * k / n + 0.01, math.pi * (k + 1) / n - 0.01
        inner = [ellipse_pt(hw, ARCH_H, t0 + (t1 - t0) * j / 2) for j in range(3)]
        outer = [ellipse_pt(hw + 0.12, ARCH_H + 0.12, t1 - (t1 - t0) * j / 2) for j in range(3)]
        p.add(bm_prism(inner + outer, 0.12), "wood_light", M((0, -HY + 0.0, 0)))
    for s in (-1, 1):
        p.box((0.17, 0.16, ARCH_ZS - SILL_Z + 0.02), (s * (hw + 0.07), -HY + 0.02, (ARCH_ZS + SILL_Z) / 2), "wood_light")
        for k in range(5):
            z = 1.0 + 0.3 * k
            p.box((0.075, 0.03, 0.075), (s * (hw + 0.07), -HY - 0.07, z), "wood_dark", rot=(0, 45, 0))
    p.box((2.2, 0.1, 0.26), (0, -HY - 0.01, 3.15), "wood_light", bevel=0.015)
    for i in range(7):
        g = GLYPHS[(i * 5 + 2) % len(GLYPHS)]
        glyph(p, M((-0.84 + 0.28 * i, -HY - 0.065, 3.15)), g, 0.075, "wood_dark")
    p.box((1.9, 0.44, 0.13), (0, -HY - 0.22, 0.565), "stone_light", bevel=0.02)
    # crest: crossed spears behind a heater shield, a sword with a coiled serpent
    C = M((0, PY - 0.26, 3.92))
    for s in (-1, 1):
        a, b = Vector((-s * 0.48, 0.03, -0.5)), Vector((s * 0.46, 0.03, 0.46))
        p.add(bm_tube([C @ a, C @ b], 0.025, 6), "wood_mid")
        d = (b - a).normalized()
        tip = M(tuple(C @ b), (0, math.degrees(math.atan2(d.x, d.z)), 0))
        p.add(bm_cyl(0.05, 0.0, 0.16, 4), "iron", tip)
    shield = [(-0.4, 0.42), (0.4, 0.42), (0.4, 0.0), (0.33, -0.25), (0.18, -0.43), (0.0, -0.53),
              (-0.18, -0.43), (-0.33, -0.25), (-0.4, 0.0)]
    p.add(bm_prism([(x * 1.12, z * 1.1 - 0.005) for x, z in shield], 0.05), "gold", C @ M((0, 0.01, 0)))
    p.add(bm_prism(shield, 0.06), "guild_blue", C @ M((0, -0.02, 0)))
    p.add(bm_box(0.07, 0.02, 0.6), "stone_light", C @ M((0, -0.06, -0.03)))
    p.add(bm_cyl(0.035, 0.0, 0.09, 4), "stone_light", C @ M((0, -0.06, -0.42), (180, 0, 45)))
    p.add(bm_box(0.26, 0.03, 0.05), "gold", C @ M((0, -0.07, 0.28)))
    p.add(bm_box(0.04, 0.03, 0.1), "leather", C @ M((0, -0.07, 0.34)))
    p.ball(0.035, tuple(C @ Vector((0, -0.07, 0.41))), "gold", subdiv=0, smooth=False)
    coil = [C @ Vector((0.11 * math.sin(2.6 * math.pi * t), -0.075 - 0.03 * math.cos(2.6 * math.pi * t), -0.36 + 0.56 * t))
            for t in [k / 11 for k in range(12)]]
    p.add(bm_tube(coil, [0.018 + 0.012 * min(k, 11 - k) / 5.5 for k in range(12)], 4), "gold")
    p.ball(0.04, tuple(coil[-1] + Vector((0.03, -0.01, 0.02))), "gold", scale=(1.3, 1, 0.8), subdiv=1)


def window(p, rnd, base, u, hw, flowers=False):
    z0, z1 = WIN_Z
    zm, h = (z0 + z1) / 2, z1 - z0
    f = 0.07

    def lb(size, loc, matname, rot=(0, 0, 0)):
        p.add(bm_box(*size), matname, base @ M(loc, rot))
    for s in (-1, 1):
        lb((f, 0.18, h + 0.02), (u + s * (hw - f / 2), 0.06, zm), "wood_light")
    for zz in (z0 + f / 2, z1 - f / 2):
        lb((2 * hw, 0.18, f), (u, 0.06, zz), "wood_light")
    lb((2 * hw - 2 * f, 0.03, h - 2 * f), (u, 0.12, zm), "glass")
    lb((0.045, 0.06, h - 2 * f), (u, 0.1, zm), "wood_light")
    lb((2 * hw - 2 * f, 0.06, 0.045), (u, 0.1, zm), "wood_light")
    lb((2 * hw + 0.2, 0.22, 0.07), (u, -0.04, z0 - 0.035), "wood_mid")
    lb((2 * hw + 0.28, 0.26, 0.06), (u, -0.06, z1 + 0.06), "wood_dark", rot=(-12, 0, 0))
    for s in (-1, 1):
        hinge = base @ M((u + s * hw, -0.06, zm), (0, 0, -s * 10))
        p.add(bm_box(hw, 0.04, h - 0.04), "shutter", hinge @ M((s * hw / 2, 0, 0)))
        for zz in ((-h * 0.3, h * 0.3) if flowers else ()):
            p.add(bm_box(hw - 0.03, 0.025, 0.06), "wood_dark", hinge @ M((s * hw / 2, -0.03, zz)))
    if flowers:
        bw = 2 * hw + 0.25
        lb((bw, 0.24, 0.2), (u, -0.16, z0 - 0.17), "wood_mid")
        petals = ["petal_pink", "petal_white", "petal_yellow", "petal_purple", "petal_white"]
        for i in range(4):
            uu = u - bw / 2 + 0.1 + i * (bw - 0.2) / 3
            p.add(jitter(bm_ico(0.12, 1), 0.02, i), rnd.choice(["grass", "grass_dark"]),
                  base @ M((uu, -0.17, z0 - 0.03), scale=(1.1, 0.9, 0.8)))
        for i in range(5):
            uu = u - bw / 2 + 0.08 + i * (bw - 0.16) / 4
            p.add(bm_ico(0.05, 0), petals[i], base @ M((uu, -0.22 + rnd.uniform(-0.05, 0.05), z0 + rnd.uniform(0.0, 0.07))))


def stage_11(p, rnd, extra):
    """Windows with blue-grey shutters, flower boxes on the front, and round gable vents."""
    for name, (base, L, posts, wins) in WALLS.items():
        for u, hw in wins:
            window(p, rnd, base, u, hw, flowers=(name == "front"))
    zc = (VENT[2] + VENT[3]) / 2
    for name in ("left", "right"):
        base = WALLS[name][0]
        p.add(bm_cyl(0.42, 0.42, 0.12, 8), "wood_light", base @ M((0, 0.13, zc), (90, 0, 0)) @ M((0, 0, 0), (0, 0, 22.5)))
        p.add(bm_cyl(0.3, 0.3, 0.02, 8), "glass", base @ M((0, 0.005, zc), (90, 0, 0)) @ M((0, 0, 0), (0, 0, 22.5)))
        for r in (0, 90):
            p.add(bm_box(0.62, 0.035, 0.045), "wood_light", base @ M((0, -0.025, zc), (0, r, 0)))


def stage_12(p, rnd, extra):
    """Stone chimney through the back slope (smoke empty on the pot), a woodpile and a chopping block."""
    cx, cy = CHIM
    p.box((0.8, 0.8, 3.0), (cx, cy, 4.6 + 1.5), "stone_dark")
    z = 4.9
    k = 0
    while z < 7.4:
        h = 0.3 + rnd.uniform(-0.03, 0.03)
        for side in range(4):
            ang = 90 * side
            base = M((cx, cy, 0), (0, 0, ang))
            off = 0.2 if (k + side) % 2 else -0.2
            for j, w in enumerate((0.52, 0.42) if off > 0 else (0.42, 0.52)):
                x = -0.47 + w / 2 + (0 if j == 0 else (0.52 if off > 0 else 0.42))
                bm = jitter(bm_box(w - 0.03, 0.22, h - 0.03), 0.012, rnd.randint(0, 9999))
                p.add(bm, rnd.choice(STONES), base @ M((x, -0.4, z + h / 2)))
        z += h
        k += 1
    p.box((1.12, 1.12, 0.14), (cx, cy, z + 0.07), "stone_light", bevel=0.03)
    for dx, dy, r in ((-0.2, 0.0, 0.12), (0.2, 0.06, 0.1)):
        p.cyl(r, 0.32, (cx + dx, cy + dy, z + 0.14), "roof", r2=r * 0.85, segs=8)
        p.cyl(r * 1.15, 0.05, (cx + dx, cy + dy, z + 0.42), "roof_dark", segs=8)
    extra.append(("EMPTY", "smoke", (cx - 0.2, cy, z + 0.55)))
    # flashing collar where the stack meets the slope
    p.add(bm_box(1.06, 1.0, 0.14), "shingle_dark", M((cx, cy, roof_z(cy) + 0.04), (-math.degrees(SLOPE), 0, 0)))
    # woodpile against the +X gable, logs end-on
    x0 = HX + 0.32
    for layer, (n, z) in enumerate(((14, 0.11), (13, 0.31), (11, 0.51))):
        for i in range(n):
            y = -2.25 + 0.2 * (i + 0.5 * layer) + rnd.uniform(-0.02, 0.02)
            r = 0.1 + rnd.uniform(-0.015, 0.012)
            p.cyl(r, 0.58 + rnd.uniform(-0.04, 0.04), (x0, y, z), rnd.choice(["wood", "wood_mid", "wood_light"]), segs=5,
                  rot=(0, 90, rnd.uniform(0, 60)))
    for y in (-2.38, 0.6):
        p.box((0.1, 0.1, 0.95), (x0 + 0.28, y, 0.47), "wood_dark")
    bx, by = 6.0, -2.6
    p.cyl(0.26, 0.42, (bx, by, 0), "wood", segs=10)
    p.cyl(0.24, 0.02, (bx, by, 0.42), "wood_light", segs=10)
    p.cyl(0.022, 0.6, (bx + 0.05, by - 0.02, 0.43), "wood_light", segs=6, rot=(0, 62, 20))
    p.box((0.05, 0.16, 0.12), (bx + 0.02, by, 0.47), "iron", rot=(0, 0, 20))


def banner(name, w, h, top):
    """Hanging guild banner, origin at its top centre (the pivot)."""
    b = Part(name)
    T = M(top)
    b.add(bm_prism([(-w / 2, 0), (w / 2, 0), (w / 2, -h), (0, -h + 0.26), (-w / 2, -h)], 0.025), "guild_blue", T)
    b.add(bm_box(w + 0.03, 0.04, 0.09), "gold", T @ M((0, 0, -0.06)))
    for s in (-1, 1):
        b.add(bm_box(0.04, 0.035, h - 0.38), "gold", T @ M((s * (w / 2 - 0.06), 0, -0.12 - (h - 0.38) / 2)))
    zc = -h * 0.42
    sc = [(0.11 * math.sin(TAU * t), 0.0, zc + 0.24 - 0.48 * t) for t in [k / 7 for k in range(8)]]
    b.add(bm_tube(sc, 0.03, 4), "gold", T)
    b.add(bm_ico(0.045, 0), "gold", T @ M(sc[0]) @ M((0.03, 0, 0.02), scale=(1.3, 0.9, 0.8)))
    return b


def stage_13(p, rnd, extra):
    """Guild banners (banner_01..04: two on the front wall, two on poles by the steps) and porch lanterns."""
    idx = 0
    for x in (-3.55, 3.55):
        for s in (-1, 1):
            p.box((0.035, 0.3, 0.035), (x + s * 0.3, -HY - 0.13, 3.14), "iron")
        p.cyl(0.02, 0.76, (x - 0.38, -HY - 0.27, 3.12), "iron", segs=6, rot=(0, 90, 0))
        idx += 1
        b = banner("banner_%02d" % idx, 0.55, 1.45, (x, -HY - 0.27, 3.1))
        extra.append((b, (x, -HY - 0.27, 3.1)))
    for x in (-2.65, 2.65):
        y = -5.0
        p.cyl(0.24, 0.24, (x, y, 0), "stone", segs=8, bevel=0.03)
        p.cyl(0.06, 4.55, (x, y + 0.05, 0.24), "wood_dark", segs=8)
        p.ball(0.09, (x, y + 0.05, 4.85), "gold", subdiv=1)
        p.box((0.8, 0.05, 0.05), (x, y + 0.0, 4.42), "wood_dark")
        for s in (-1, 1):
            p.ball(0.04, (x + s * 0.42, y, 4.42), "gold", subdiv=0, smooth=False)
        idx += 1
        b = banner("banner_%02d" % idx, 0.62, 1.95, (x, y - 0.05, 4.4))
        extra.append((b, (x, y - 0.05, 4.4)))
    for x in (-PW, PW):
        y0, z = PY - 0.13, 2.55
        p.add(bm_tube([(x, y0 + 0.02, z), (x, y0 - 0.3, z), (x, y0 - 0.38, z - 0.06)], 0.026, 6), "iron")
        p.add(bm_box(0.15, 0.04, 0.22), "iron", M((x, y0 - 0.01, z - 0.04)))
        add_lantern(p, (x, y0 - 0.38, z - 0.76), 1.2, hang=True)


def stage_14(p, rnd, extra):
    """Training yard: packed sand, a split-rail fence open toward the hall, and a sparring ring."""
    cx, cy, ax, ay = YARD
    p.add(bm_slab(superellipse(rnd, cx, cy, ax, ay, 40, 6, 0.012), 0.04), "sand")
    for i in range(6):
        x, y = rnd.uniform(cx - ax + 0.6, cx + ax - 0.6), rnd.uniform(cy - ay + 0.6, cy + ay - 0.6)
        pts = superellipse(rnd, x, y, rnd.uniform(0.3, 0.6), rnd.uniform(0.25, 0.45), 12, 2, 0.12)
        p.add(bm_slab(pts, 0.015), "sand_dark", M((0, 0, 0.035)))
    rx, ry, rr = RING
    for i in range(16):
        a = TAU * i / 16 + rnd.uniform(-0.05, 0.05)
        p.add(jitter(bm_ico(rnd.uniform(0.09, 0.13), 1), 0.025, 90 + i), rnd.choice(["stone_light", "stone"]),
              M((rx + rr * math.cos(a), ry + rr * math.sin(a), 0.06), scale=(1.2, 1.0, 0.65)))
    x0, x1, y0, y1 = FENCE
    sides = [((x1, y0), (x0, y0)), ((x0, y0), (x0, y1)), ((x0, y1), (x1, y1))]
    posts = []
    for (ax_, ay_), (bx, by) in sides:
        L = math.hypot(bx - ax_, by - ay_)
        n = max(1, round(L / 1.5))
        pts = [(ax_ + (bx - ax_) * k / n, ay_ + (by - ay_) * k / n) for k in range(n + 1)]
        for x, y in pts:
            if (x, y) not in posts:
                posts.append((x, y))
                p.add(jitter(bm_box(0.12, 0.12, 0.95), 0.012, int(x * 37 + y * 11)), "wood_mid",
                      M((x, y, 0.475), (rnd.uniform(-3, 3), rnd.uniform(-3, 3), rnd.uniform(0, 30))))
                p.cyl(0.08, 0.1, (x, y, 0.95), "wood_mid", r2=0.0, segs=4, rot=(0, 0, 45))
        for (qa, qb) in zip(pts, pts[1:]):
            L2 = math.hypot(qb[0] - qa[0], qb[1] - qa[1])
            ang = math.degrees(math.atan2(qb[1] - qa[1], qb[0] - qa[0]))
            for z in (0.4, 0.75):
                p.box((L2 + 0.12, 0.07, 0.1), ((qa[0] + qb[0]) / 2, (qa[1] + qb[1]) / 2, z + rnd.uniform(-0.03, 0.03)),
                      rnd.choice(["wood_light", "wood", "wood_light"]), rot=(rnd.uniform(-3, 3), 0, ang + rnd.uniform(-1.5, 1.5)))


def dummy(p, rnd, x, y, rot, variant):
    D = M((x, y, 0), (0, 0, rot))

    def a(bm, m, loc, r=(0, 0, 0), sc=1, smooth=False):
        p.add(bm, m, D @ M(loc, r, sc), smooth)
    for r in (0, 90):
        a(bm_box(0.85, 0.12, 0.1), "wood_mid", (0, 0, 0.05), (0, 0, r))
    a(bm_box(0.11, 0.11, 1.62), "wood_mid", (0, 0, 0.81))
    body = bm_lathe([(0.15, 0.7), (0.24, 0.8), (0.27, 0.98), (0.26, 1.18), (0.2, 1.32), (0.09, 1.38)], 8)
    a(jitter(body, 0.022, rnd.randint(0, 999)), "straw", (0, 0, 0))
    for z in (0.92, 1.2):
        a(bm_cyl(0.275, 0.275, 0.04, 8), "rope", (0, 0, z))
    a(bm_box(0.98, 0.08, 0.08), "wood_mid", (0, 0, 1.25))
    for s in (-1, 1):
        a(jitter(bm_cyl(0.1, 0.07, 0.3, 6), 0.015, 3 + s), "straw", (s * 0.34, 0, 1.25), (0, s * 90, 0))
        a(bm_cyl(0.105, 0.105, 0.03, 6), "rope", (s * 0.28, 0, 1.25), (0, s * 90, 0))
    a(bm_uv(0.17, 7, 5), "sack", (0, 0, 1.55), sc=(1, 0.95, 1.05), smooth=True)
    a(bm_cyl(0.1, 0.1, 0.012, 10), "cloth", (0, -0.255, 1.04), (90, 0, 0))
    a(bm_cyl(0.05, 0.05, 0.014, 8), "white", (0, -0.262, 1.04), (90, 0, 0))
    if variant == 0:     # dented pot helmet
        a(bm_lathe([(0.2, 0.0), (0.19, 0.1), (0.14, 0.18), (0.06, 0.22), (0.0, 0.23)], 10), "iron", (0, 0, 1.6), (6, 0, 0))
        a(bm_cyl(0.23, 0.23, 0.03, 10), "iron", (0, 0, 1.59), (6, 0, 0))
    elif variant == 1:   # old guild shield strapped to one arm
        a(bm_cyl(0.26, 0.26, 0.05, 12), "guild_blue", (0.4, -0.08, 1.1), (90, 0, 0))
        a(bm_cyl(0.07, 0.04, 0.07, 8), "iron", (0.4, -0.13, 1.1), (90, 0, 0))
        a(bm_cyl(0.275, 0.275, 0.03, 12), "iron", (0.4, -0.05, 1.1), (90, 0, 0))
    else:                # straw hat and a practice arrow in the chest
        a(bm_cyl(0.28, 0.28, 0.03, 12), "straw", (0, 0, 1.68), (-8, 0, 0))
        a(bm_cyl(0.13, 0.1, 0.12, 10), "straw", (0, 0, 1.69), (-8, 0, 0))
        a(bm_cyl(0.012, 0.012, 0.5, 4), "wood_light", (0.06, -0.24, 1.0), (75, 0, 10))
        a(bm_cyl(0.035, 0.035, 0.1, 3), "white", (0.13, -0.66, 1.12), (75, 0, 10))


def stage_15(p, rnd, extra):
    """Training gear: straw dummies, an archery target, and a weapon rack, bench and staff barrel on
    the yard side of the hall."""
    for i, (x, y, r) in enumerate(((-6.4, -2.45, 10), (-7.9, -2.75, -15), (-9.2, -1.75, 25))):
        dummy(p, rnd, x, y, r, i)
    # archery target on a tripod, leaning back
    T = M((-9.4, -0.35, 0), (0, 0, 30))
    for a, b in (((-0.42, -0.2, 0.0), (-0.28, 0.02, 1.35)), ((0.42, -0.2, 0.0), (0.28, 0.02, 1.35)), ((0, 0.72, 0.0), (0, 0.08, 1.4))):
        p.add(bm_tube([T @ Vector(a), T @ Vector(b)], 0.04, 5), "wood_mid")
    B = T @ M((0, 0.0, 1.05), (-12, 0, 0))
    p.add(bm_cyl(0.5, 0.5, 0.22, 10), "straw", B @ M((0, 0.11, 0), (90, 0, 0)))
    for i, (r, m) in enumerate(((0.45, "white"), (0.34, "guild_blue"), (0.22, "white"), (0.1, "cloth"))):
        p.add(bm_cyl(r, r, 0.012, 10), m, B @ M((0, -0.11 - 0.004 * i, 0), (90, 0, 0)))
    for ux, uz, tx, tz in ((0.06, 0.08, 4, -6), (-0.18, -0.12, -8, 5), (0.24, 0.2, 10, 3)):
        q0 = B @ Vector((ux, -0.13, uz))
        dirv = (B.to_3x3() @ Vector((math.radians(tx), -1, math.radians(tz)))).normalized()
        p.add(bm_tube([q0 - dirv * 0.05, q0 + dirv * 0.5], 0.012, 4), "wood_light")
        p.add(bm_tube([q0 + dirv * 0.4, q0 + dirv * 0.52], [0.012, 0.035], 3), "white")
    # weapon rack against the -X gable (rack frame: local x = -world y, local -y = outward)
    R = M((-HX, 0, 0), (0, 0, -90))

    def r(bm, m, loc, rot=(0, 0, 0), sc=1, smooth=False):
        p.add(bm, m, R @ M(loc, rot, sc), smooth)
    for u in (-0.72, 0.72):
        r(bm_box(0.1, 0.1, 1.75), "wood_mid", (u, -0.5, 0.875))
        r(bm_box(0.1, 0.5, 0.08), "wood_mid", (u, -0.5, 0.04))
        r(bm_box(0.08, 0.5, 0.08), "wood_mid", (u, -0.27, 1.7))
    r(bm_box(1.6, 0.08, 0.1), "wood_dark", (0, -0.5, 1.58))
    r(bm_box(1.6, 0.14, 0.06), "wood_dark", (0, -0.5, 0.78))
    r(bm_box(1.6, 0.3, 0.06), "wood_dark", (0, -0.5, 0.12))
    for u in (-0.52, -0.34, -0.16):     # wooden practice swords
        r(bm_box(0.07, 0.02, 0.8), "wood_light", (u, -0.5, 0.55))
        r(bm_box(0.2, 0.05, 0.04), "wood_dark", (u, -0.5, 0.97))
        r(bm_cyl(0.022, 0.022, 0.2, 6), "leather", (u, -0.5, 0.99))
        r(bm_ico(0.035, 1), "wood_dark", (u, -0.5, 1.22))
    for u in (0.08, 0.26):               # spears leaning back to the top bar
        base = R @ M((u, -0.52, 0.15), (-4, 0, 0))
        p.add(bm_cyl(0.025, 0.025, 2.15, 6), "wood", base)
        p.add(bm_lathe([(0.0, 0.0), (0.045, 0.06), (0.03, 0.18), (0.0, 0.26)], 4), "iron", base @ M((0, 0, 2.13)))
    r(bm_cyl(0.03, 0.03, 1.9, 6), "wood_light", (0.48, -0.5, 0.15), (-3, 0, 0))
    bow = [(0.17 * math.sin(math.pi * t), -0.04, 1.95 + 1.0 * t) for t in [k / 8 for k in range(9)]]
    p.add(bm_tube([R @ Vector(q) for q in bow], 0.02, 5), "wood_mid")
    r(bm_box(0.008, 0.008, 1.0), "white", (0, -0.04, 2.45))
    r(bm_cyl(0.02, 0.02, 0.1, 5), "wood_dark", (0.0, 0.05, 2.45), (90, 0, 0))
    for u, m in ((-0.45, "guild_blue"), (0.48, "wood")):
        S = R @ M((u, -0.82, 0.37), (72, 0, 0))
        p.add(bm_cyl(0.34, 0.34, 0.05, 10), m, S)
        p.add(bm_cyl(0.08, 0.05, 0.08, 8), "iron", S @ M((0, 0, 0.05)))
    # bench with a helmet and a folded cloak, and a bucket
    r(bm_box(1.25, 0.34, 0.07), "wood_light", (1.85, -0.58, 0.46))
    for du in (-0.48, 0.48):
        r(bm_box(0.08, 0.3, 0.43), "wood_mid", (1.85 + du, -0.58, 0.215))
    r(bm_lathe([(0.17, 0.0), (0.16, 0.09), (0.12, 0.16), (0.05, 0.2), (0.0, 0.205)], 10), "iron", (1.58, -0.6, 0.495))
    r(bm_box(0.38, 0.28, 0.08), "guild_blue", (2.12, -0.58, 0.535), (0, 0, 8))
    r(bm_lathe([(0.15, 0.0), (0.19, 0.34), (0.17, 0.34), (0.13, 0.02)], 10, cap_top=False), "wood_mid", (2.8, -0.65, 0))
    r(bm_cyl(0.165, 0.165, 0.03, 10), "glass", (2.8, -0.65, 0.27))
    r(bm_cyl(0.185, 0.185, 0.03, 10), "iron", (2.8, -0.65, 0.26))
    # barrel of practice staves
    bu, bv = -1.95, -0.6
    r(bm_lathe([(0.25, 0.0), (0.3, 0.2), (0.31, 0.4), (0.3, 0.6), (0.25, 0.8)], 10, cap_top=False), "wood", (bu, bv, 0))
    r(bm_cyl(0.24, 0.24, 0.02, 10), "wood_dark", (bu, bv, 0.65))
    for z in (0.12, 0.68):
        r(bm_cyl(0.285, 0.285, 0.04, 10), "iron", (bu, bv, z))
    for k in range(5):
        a = TAU * k / 5
        r(bm_cyl(0.025, 0.025, 1.35, 5), rnd.choice(["wood_light", "wood"]),
          (bu + 0.1 * math.cos(a), bv + 0.1 * math.sin(a), 0.05), (8 * math.sin(a), 8 * math.cos(a), 0))


def stage_16(p, rnd, extra):
    """Lookout platform over the yard (ladder, braced posts, deck, railing, little roof, `flag`,
    spyglass and horn), and the guild notice board with Rook's map of the road up the north hill."""
    xs, ys = (LX - 0.85, LX + 0.85), (LY - 0.85, LY + 0.85)
    for x in xs:
        for y in ys:
            p.add(jitter(bm_box(0.38, 0.38, 0.15), 0.02, int(x * 10 + y)), "stone", M((x, y, 0.075)))
            p.box((0.2, 0.2, 5.9), (x, y, 0.15 + 2.95), "wood_mid")
    for z in (2.05, 3.9):
        for y in ys:
            p.box((1.9, 0.14, 0.14), (LX, y, z), "wood_dark")
        for x in xs:
            p.box((0.14, 1.9, 0.14), (x, LY, z), "wood_dark")
    for z0, z1 in ((0.35, 2.0), (2.1, 3.85)):
        dz = z1 - z0
        for y, out in ((ys[0], -1), (ys[1], 1)):
            phi = math.degrees(math.atan2(1.7, dz))
            for sg in (1, -1):
                p.box((0.07, 0.06, math.hypot(1.7, dz)), (LX, y + out * 0.13, (z0 + z1) / 2), "wood", rot=(0, sg * phi, 0))
        for x, out in ((xs[0], -1), (xs[1], 1)):
            phi = math.degrees(math.atan2(1.7, dz))
            for sg in (1, -1):
                p.box((0.06, 0.07, math.hypot(1.7, dz)), (x + out * 0.13, LY, (z0 + z1) / 2), "wood", rot=(sg * phi, 0, 0))
    for i in range(8):
        y = LY - 1.08 + 2.16 * (i + 0.5) / 8
        p.box((2.3, 2.16 / 8 - 0.015, 0.07), (LX + rnd.uniform(-0.02, 0.02), y, 3.995), rnd.choice(WOODS))
    for z in (4.5, 4.95):
        for y in (ys[1],):
            p.box((1.9, 0.07, 0.08), (LX, y, z), "wood_light")
        for x in xs:
            p.box((0.07, 1.9, 0.08), (x, LY, z), "wood_light")
        for s in (-1, 1):
            p.box((0.62, 0.07, 0.08), (LX + s * 0.63, ys[0], z), "wood_light")
    for base in (M((LX, ys[1] + 0.11, 0), (0, 0, 180)), M((xs[0] - 0.11, LY, 0), (0, 0, -90)), M((xs[1] + 0.11, LY, 0), (0, 0, 90))):
        planks(p, rnd, base, -0.95, 0.95, 4.03, lambda u: 4.62, y=0.06)
    p.box((2.3, 2.3, 0.1), (LX, LY, 6.0), "wood_dark")
    for (r1, r2, z0, h, m) in ((1.62, 1.18, 6.05, 0.42, "shingle"), (1.25, 0.72, 6.42, 0.42, "shingle_light"),
                               (0.78, 0.0, 6.8, 0.55, "shingle_dark")):
        p.cyl(r1, h, (LX, LY, z0), m, r2=r2, segs=4, rot=(0, 0, 45))
    p.cyl(0.03, 1.0, (LX, LY, 7.2), "wood_dark", segs=6)
    p.ball(0.05, (LX, LY, 8.22), "gold", subdiv=1)
    f = Part("flag")
    ft = (LX + 0.03, LY, 8.12)
    f.add(bm_prism([(0, 0), (0.78, -0.15), (0, -0.32)], 0.02), "guild_blue", M(ft))
    f.add(bm_prism([(0, -0.1), (0.4, -0.16), (0, -0.22)], 0.03), "gold", M(ft))
    extra.append((f, ft))
    # ladder up the front
    bot, tp = Vector((LX, ys[0] - 1.05, 0.0)), Vector((LX, ys[0] - 0.08, 4.9))
    for s in (-1, 1):
        beam_between(p, bot + Vector((s * 0.26, 0, 0)), tp + Vector((s * 0.26, 0, 0)), (0.08, 0.07), "wood_light")
    for k in range(1, 17):
        q = bot + (tp - bot) * (k / 17)
        p.box((0.52, 0.045, 0.045), tuple(q), "wood_light")
    # spyglass on the back rail, pointed at the north hill; a horn on a front post; a lantern
    sg = M((LX + 0.3, ys[1] - 0.02, 4.99), (-72, 0, 0))
    p.add(bm_cyl(0.05, 0.045, 0.32, 8), "gold", sg)
    p.add(bm_cyl(0.035, 0.03, 0.22, 8), "gold", sg @ M((0, 0, 0.3)))
    p.add(bm_cyl(0.055, 0.055, 0.03, 8), "iron", sg @ M((0, 0, -0.01)))
    p.box((0.05, 0.05, 0.12), (LX + 0.3, ys[1] - 0.02, 5.0), "wood_dark")
    hp = [(xs[0] - 0.14, ys[0] - 0.1, 4.75), (xs[0] - 0.2, ys[0] - 0.25, 4.6), (xs[0] - 0.16, ys[0] - 0.42, 4.5), (xs[0] - 0.08, ys[0] - 0.55, 4.55)]
    p.add(bm_tube(hp, [0.025, 0.04, 0.055, 0.075], 7), "stone_light")
    p.add(bm_cyl(0.045, 0.045, 0.03, 7), "gold", M(hp[1], (60, 0, 0)))
    p.box((0.03, 0.03, 0.35), (xs[0] - 0.12, ys[0] - 0.1, 4.9), "leather")
    p.box((0.03, 0.03, 0.52), (LX - 0.5, ys[0] - 0.02, 5.73), "iron")
    add_lantern(p, (LX - 0.5, ys[0] - 0.02, 4.95), 1.0, hang=True)
    # notice board by the yard, turned toward the path
    N = M((-5.05, -4.6, 0), (0, 0, -18))

    def n(bm, m, loc, rot=(0, 0, 0), sc=1):
        p.add(bm, m, N @ M(loc, rot, sc))
    for s in (-1, 1):
        n(bm_box(0.12, 0.12, 2.15), "wood_mid", (s * 0.7, 0, 1.075))
    n(bm_box(1.3, 0.07, 0.9), "wood", (0, 0, 1.45))
    for z in (0.98, 1.92):
        n(bm_box(1.42, 0.1, 0.07), "wood_dark", (0, -0.01, z))
    for s in (-1, 1):
        n(bm_box(1.75, 0.34, 0.04), "shingle_dark", (0, s * 0.14, 2.2), (-s * 30, 0, 0))
    sheets = [(-0.42, 1.62, 0.28, 0.36, 4, "white"), (-0.4, 1.2, 0.3, 0.24, -6, "petal_white"),
              (0.47, 1.66, 0.22, 0.3, -5, "white"), (0.46, 1.2, 0.26, 0.24, 7, "white")]
    for x, z, w, h, rot, m in sheets:
        n(bm_box(w, 0.01, h), m, (x, -0.04, z), (0, rot, 0))
        for k in range(2):
            n(bm_box(w * 0.7, 0.006, 0.014), "ink", (x, -0.046, z + h * 0.28 - k * h * 0.2), (0, rot, 0))
        n(bm_ico(0.022, 0), "cloth", (x, -0.05, z + h / 2 - 0.03))
    mx, mz = 0.03, 1.45
    n(bm_box(0.46, 0.01, 0.4), "sack", (mx, -0.04, mz), (0, 2, 0))
    n(bm_prism([(-0.17, -0.13), (0.17, -0.13), (0.03, 0.1)], 0.006), "grass_dark", (mx, -0.047, mz))
    for k, (dx, dz) in enumerate(((-0.16, -0.17), (-0.09, -0.12), (-0.04, -0.06), (0.0, 0.0), (0.02, 0.06))):
        n(bm_box(0.022, 0.006, 0.022), "cloth", (mx + dx, -0.052, mz + dz))
    for k, dx in enumerate((-0.04, 0.03, 0.1)):
        n(bm_ico(0.035, 1), "stone_dark", (mx + dx, -0.05, mz + 0.15 + 0.012 * (k % 2)), sc=(1.3, 0.3, 0.8))
    n(bm_box(0.05, 0.006, 0.04), "roof", (mx - 0.18, -0.05, mz - 0.16))
    for dx in (-0.2, 0.2):
        n(bm_ico(0.02, 0), "gold", (mx + dx, -0.052, mz + 0.17))


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
        fn(part, random.Random(3100 + i), extra)
        objs = []
        if len(part.bm.faces):
            objs.append(part.to_object(model, parent=node))
        else:
            part.bm.free()
        for item in extra:
            if item[0] == "EMPTY":
                common.empty(item[1], model, parent=node, loc=item[2])
            else:
                xp, origin = item
                objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    bpy.context.view_layer.update()
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [round(min(q[i] for q in pts), 2) for i in range(3)]
    hi = [round(max(q[i] for q in pts), 2) for i in range(3)]
    print("GUILDHALL tris", counts, "total", sum(counts.values()))
    print("GUILDHALL bbox", lo, hi)
    print("GUILDHALL nodes", sorted(o.name for o in common.coll("MODEL").all_objects if not o.name.startswith("stage_")))
    if QUICK:
        return counts
    common.setup_render()
    common.preview_rig(meshes, azim=-30, elev=22, lens=50, margin=0.86)
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("guildhall.glb")
    common.preview_materials()
    only = globals().get("ONLY_STAGES")
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            if only and k not in only:
                continue
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-30, elev=22, lens=50, margin=0.84, min_radius=8.5)
            common.render(os.path.join(common.OUT_PREV, "guildhall_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-34, elev=12, lens=40, margin=0.92)
    common.render(os.path.join(common.OUT_PREV, "guildhall.png"))
    common.save_blend("guildhall")
    print("GUILDHALL done")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
