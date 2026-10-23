"""Fisher's Dock: Marlo's thatched hut on the shore, a wooden pier on piles reaching ~7 m out over
the pond (-Y), and Willowmere's old bronze bell rehung on a frame at the pier head. 12 cumulative
stages (stage_01 .. stage_12). See art/specs/dock.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Set RENDER_STAGES = False to skip the 12 stage renders while iterating.

Origin: bottom centre of the hut (ground level, z = 0), front facing -Y. The deck and the hut floor
are at z = 0.6. Water is assumed at z = -0.3 (WATER); the piles reach down to z = -1.6.
Special nodes: `bell` (pivot at its yoke axle, swings around X), `boat` (origin on the waterline,
can bob), `net_01` / `net_02` (origins on the bars they hang from, can sway), `smoke` (empty).
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
import bmesh
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", os.environ.get("DOCK_STAGES", "1") == "1")
TAU = 2 * math.pi

# dock-only colours (muted, same style as the shared palette)
common.PALETTE.update({
    "driftwood": "#948776", "reed": "#B89A5E", "reed_dark": "#8F7548", "rope": "#B39B70",
    "net": "#6F6C57", "cork": "#B08A5C", "boat": "#5B7983", "fish": "#A0ACB0", "fish_dark": "#5E6B72",
    "bronze": "#8E6C40", "bronze_dark": "#5F4B33", "verdigris": "#6E978A", "pot": "#A8664A",
})

# ------------------------------------------------------------------ dimensions
HX, HY = 2.0, 1.6                 # hut walls (outer faces at x = +-HX, y = +-HY)
PLINTH = 0.46                     # stone plinth top
FLOOR = 0.6                       # hut floor = deck top
DECK = FLOOR
WALL_TOP = 2.62                   # top of the side walls (plates sit on it)
RIDGE, EAVE_X, EAVE_Z = 4.6, 2.55, 2.45
ROOF_Y = HY + 0.45                # thatch reaches y = +-ROOF_Y
WATER = -0.3
PILE_BOT = -1.6
LAND_X = 1.55                     # landing half width (y -1.72 .. -2.98)
PIER_X = 0.9                      # pier half width
HEAD = (2.05, -8.4, -9.95)        # pier head: half width, back y, front y
ROWS = [(-2.98, (-1.45, -0.78, 0.78, 1.45)), (-4.33, (-0.78, 0.78)), (-5.69, (-0.78, 0.78)),
        (-7.04, (-0.78, 0.78)), (-8.4, (-1.9, -0.78, 0.78, 1.9)), (-9.82, (-1.9, -0.78, 0.78, 1.9))]
BOLLARD_PILES = {(-8.4, -1.9), (-8.4, 1.9)}
BELL_Y = -9.2
FRAME_TOP = DECK + 2.5
AXIS_Z = FRAME_TOP - 0.16
BOAT_X, BOAT_Y = -1.66, -5.95
RAIL_X = 0.84
RAIL_YS = [-3.15, -4.33, -5.69, -7.04, -8.3]
POND = (0.3, -10.6, 10.5, 7.9)    # preview-only pond ellipse: centre x, y, radius x, y

L_SLOPE = math.hypot(EAVE_X, RIDGE - EAVE_Z)
UX, UZ = EAVE_X / L_SLOPE, -(RIDGE - EAVE_Z) / L_SLOPE    # down the right-hand slope
NX, NZ = -UZ, UX                                          # out of the roof
SLOPE_DEG = math.degrees(math.atan2(RIDGE - EAVE_Z, EAVE_X))

# wall frames: local x = u along the wall, local y = depth inward (0 = outer face), local z = up
WALLS = {
    "front": M((0, -HY, 0)),
    "back": M((0, HY, 0), (0, 0, 180)),
    "right": M((HX, 0, 0), (0, 0, 90)),     # u = y
    "left": M((-HX, 0, 0), (0, 0, -90)),    # u = -y
}
DOOR = (0.0, 0.46, FLOOR, 2.35)           # (u centre, half width, z0, z1)
OPS = {
    "front": [DOOR, (-1.2, 0.32, 1.3, 1.95)],
    "back": [],
    "right": [(-0.1, 0.36, 1.25, 1.95)],
    "left": [(0.25, 0.3, 1.3, 1.9)],
}
WINDOWS = [("front", OPS["front"][1]), ("right", OPS["right"][0]), ("left", OPS["left"][0])]


def z_roof(x):
    """Underside of the thatch (top of the rafters) above x."""
    return RIDGE - (RIDGE - EAVE_Z) * abs(x) / EAVE_X


def rp(s, off):
    """Point on the right roof slope: s metres down from the ridge, off metres out of the roof."""
    return (UX * s + NX * off, RIDGE + UZ * s + NZ * off)


def wall_top(side, u):
    return z_roof(u) - 0.02 if side in ("front", "back") else WALL_TOP + 0.14


def loft(sections, close=True, cap=True):
    """Skin rings of 3D points; `close` joins each ring's last point back to its first."""
    bm = bmesh.new()
    rings = [[bm.verts.new(v) for v in pts] for pts in sections]
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n if close else n - 1):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def beam(p, a, b, size, matname):
    """Box from point a to point b; size = (thickness across, thickness up)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    q = d.normalized().to_track_quat("Z", "Y")
    p.add(bm_box(size[0], size[1], d.length), matname, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())


def rope(p, a, b, sag, r=0.018, n=8, matname="rope"):
    a, b = Vector(a), Vector(b)
    pts = [a + (b - a) * (k / n) - Vector((0, 0, sag * 4 * (k / n) * (1 - k / n))) for k in range(n + 1)]
    p.add(bm_tube(pts, r, 5), matname)


def coil(p, x, y, z, r=0.17, turns=2.5, rr=0.024):
    n = int(turns * 9)
    pts = [(x + (r - 0.022 * t / TAU) * math.cos(t), y + (r - 0.022 * t / TAU) * math.sin(t), z + rr + 0.012 * (t / TAU))
           for t in [turns * TAU * k / n for k in range(n + 1)]]
    p.add(bm_tube(pts, rr, 5), "rope")


def stone_run(p, rnd, a, b, z0, z1, depth, wrange, cols, jit=0.02, gap=0.03, bevel=0.0):
    """A straight run of stone blocks from a to b (outer face on the a-b line, depth to its left)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    L = d.length
    ang = math.degrees(math.atan2(d.y, d.x))
    left = Vector((-d.y, d.x)).normalized()
    t = 0.0
    while L - t > 1e-3:
        w = rnd.uniform(*wrange)
        if L - t - w < wrange[0] * 0.55:
            w = L - t
        c = a + d * ((t + w / 2) / L) + left * (depth / 2 + rnd.uniform(-0.015, 0.02))
        bm = bm_box(w - gap, depth + rnd.uniform(-0.02, 0.03), z1 - z0 - gap, bevel=bevel)
        if jit:
            jitter(bm, jit, rnd.randint(0, 9999))
        p.add(bm, rnd.choice(cols), M((c.x, c.y, (z0 + z1) / 2), (0, 0, ang)))
        t += w


# ------------------------------------------------------------------ props

def crate(p, x, y, z, rz, sx=0.6, sy=0.45, sz=0.42, fish=0, rnd=None):
    base = M((x, y, z), (0, 0, rz))
    p.add(bm_box(sx - 0.05, sy - 0.05, sz - 0.03), "wood_dark", base @ M((0, 0, (sz - 0.03) / 2)))
    for dx in (-1, 1):
        for dy in (-1, 1):
            p.add(bm_box(0.05, 0.05, sz), "wood_mid", base @ M((dx * (sx / 2 - 0.025), dy * (sy / 2 - 0.025), sz / 2)))
    for f in (0.27, 0.75):
        for s in (-1, 1):
            p.add(bm_box(sx - 0.02, 0.025, sz * 0.36), "wood" if s < 0 else "wood_light", base @ M((0, s * (sy / 2 - 0.0125), sz * f)))
            p.add(bm_box(0.025, sy - 0.06, sz * 0.36), "wood_light", base @ M((s * (sx / 2 - 0.0125), 0, sz * f)))
    for k in range(fish):
        fx = rnd.uniform(-sx / 2 + 0.17, sx / 2 - 0.17)
        fy = rnd.uniform(-sy / 2 + 0.08, sy / 2 - 0.08)
        add_fish(p, base @ M((fx, fy, sz - 0.02 + 0.025 * (k % 3)), (rnd.uniform(-6, 6), 0, rnd.uniform(-40, 40))))


def add_fish(p, m, s=1.0):
    p.add(bm_ico(1.0, 1), "fish", m @ M((0, 0, 0), scale=(0.16 * s, 0.055 * s, 0.035 * s)), smooth=True)
    p.add(bm_ico(1.0, 1), "fish_dark", m @ M((0.01 * s, 0.022 * s, 0.012 * s), scale=(0.12 * s, 0.03 * s, 0.022 * s)), smooth=True)
    p.add(bm_slab([(-0.13 * s, 0), (-0.24 * s, 0.07 * s), (-0.22 * s, 0), (-0.24 * s, -0.07 * s)], 0.012), "fish_dark",
          m @ M((0, 0, -0.006)))
    p.add(bm_ico(0.014 * s, 0), "ink", m @ M((0.11 * s, -0.03 * s, 0.018 * s)))


def barrel(p, x, y, rz=0.0, s=1.0):
    prof = [(0.24, 0.0), (0.27, 0.15), (0.29, 0.36), (0.27, 0.57), (0.24, 0.72)]
    p.add(bm_lathe([(r * s, z * s) for r, z in prof], 12), "wood", M((x, y, 0), (0, 0, rz)))
    for z, r in ((0.09, 0.262), (0.63, 0.262), (0.3, 0.29)):
        p.add(bm_lathe([(r * s, (z - 0.03) * s), (r * s + 0.012, (z - 0.03) * s), (r * s + 0.012, (z + 0.03) * s),
                        (r * s, (z + 0.03) * s)], 12, cap_bottom=False, cap_top=False), "iron", M((x, y, 0)))
    p.cyl(0.225 * s, 0.02, (x, y, 0.705 * s), "wood_dark", segs=12)


def creel(p, base):
    """Lobster pot: board base, three hoops and a net cover (half cylinder along local X)."""
    ax = Matrix(((0, 0, 1, 0), (1, 0, 0, 0), (0, 1, 0, 0), (0, 0, 0, 1)))   # local z -> x, x -> y, y -> z
    p.add(bm_box(0.7, 0.45, 0.04), "wood_mid", base @ M((0, 0, 0.02)))
    p.add(bm_lathe([(0.21, -0.33), (0.21, 0.33)], 7, arc=(0, 180)), "net", base @ M((0, 0, 0.04)) @ ax)
    for x in (-0.3, 0.0, 0.3):
        pts = [(x, 0.212 * math.cos(math.pi * k / 7), 0.04 + 0.212 * math.sin(math.pi * k / 7)) for k in range(8)]
        p.add(bm_tube(pts, 0.012, 4), "wood_light", base)
    semi = [(0.205 * math.cos(math.pi * k / 7), 0.205 * math.sin(math.pi * k / 7)) for k in range(8)]
    for x in (-0.33, 0.33):
        p.add(bm_prism(semi, 0.01), "net", base @ M((x, 0, 0.04), (0, 0, 90)))


def drape(name, x0, y0, y1, z0, len_in, len_out, flare=0.3, seed=0):
    """A net hung over a bar running along Y at (x0, z0): the -X side hangs len_in, the +X side len_out.
    Cork floats ride the bottom hems. Origin on the bar's centre (the game can sway it)."""
    rnd = random.Random(seed)
    part = Part(name)
    bm = bmesh.new()
    nu, nv = 8, 6
    rows = []
    for j in range(-nv, nv + 1):
        v = abs(j) / nv
        s = 1 if j > 0 else -1
        L = len_out if j > 0 else len_in
        row = []
        for i in range(nu + 1):
            u = i / nu
            y = y0 + (y1 - y0) * u
            lift = 0.14 * (1 - math.sin(math.pi * u)) * v * v
            fold = 0.035 * math.sin(u * nu * 1.7 + j * 0.9 + seed) * v
            x = x0 + (s * (0.03 + flare * v ** 1.4) if j else 0.0) + fold + rnd.uniform(-0.01, 0.01)
            z = z0 + 0.045 * (1 - v) - v * L + lift + rnd.uniform(-0.01, 0.01)
            row.append(bm.verts.new((x, y + rnd.uniform(-0.01, 0.01), z)))
        rows.append(row)
    for a, b in zip(rows, rows[1:]):
        for i in range(nu):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    corks = [row[i].co.copy() for row in (rows[0], rows[-1]) for i in range(1, nu, 2)]
    part.add(bm, "net", smooth=True)
    for c in corks:
        part.add(bm_cyl(0.035, 0.035, 0.07, 6), "cork", M((c.x, c.y, c.z - 0.03)))
    return part, (x0, (y0 + y1) / 2, z0)


# ------------------------------------------------------------------ walls

def spans(u, ops, z0):
    for o in ops:
        if o[0] - o[1] - 1e-6 <= u <= o[0] + o[1] + 1e-6:
            out = [(z0, o[2])] if o[2] - z0 > 0.12 else []
            return out + [(o[3], None)]
    return [(z0, None)]


def boards(p, rnd, side, z0=0.5, w=0.25, t=0.07):
    """Board-and-batten wall: vertical boards (gaps at the openings), battens over the joints."""
    base = WALLS[side]
    ops = OPS[side]
    u0, u1 = (-HX + 0.11, HX - 0.11) if side in ("front", "back") else (-HY + 0.11, HY - 0.11)
    cuts = sorted({u0, u1} | {o[0] - o[1] for o in ops} | {o[0] + o[1] for o in ops})
    edges = {round(o[0] + s * o[1], 4) for o in ops for s in (-1, 1)} | {round(u0, 4), round(u1, 4)}
    cols = ["driftwood", "wood", "wood_mid", "driftwood", "wood"]
    joints = []
    for a, b in zip(cuts, cuts[1:]):
        n = max(1, round((b - a) / w))
        for i in range(n):
            ua, ub = a + (b - a) * i / n, a + (b - a) * (i + 1) / n
            if i:
                joints.append(ua)
            for zlo, zhi in spans((ua + ub) / 2, ops, z0):
                ta = wall_top(side, ua) if zhi is None else zhi
                tb = wall_top(side, ub) if zhi is None else zhi
                pts = [(ua + 0.004, zlo), (ub - 0.004, zlo), (ub - 0.004, tb), (ua + 0.004, ta)]
                p.add(bm_prism(pts, t), rnd.choice(cols), base @ M((0, t / 2 + rnd.uniform(-0.006, 0.006), 0)))
        if round(b, 4) not in edges:
            joints.append(b)
    for u in joints:
        for zlo, zhi in spans(u, ops, z0):
            hw = 0.03
            ta = wall_top(side, u - hw) if zhi is None else zhi
            tb = wall_top(side, u + hw) if zhi is None else zhi
            p.add(bm_prism([(u - hw, zlo), (u + hw, zlo), (u + hw, tb), (u - hw, ta)], 0.03), "wood_dark",
                  base @ M((0, -0.012, 0)))


def window(p, side, op):
    base = WALLS[side]
    uc, hw, z0, z1 = op
    zm, h = (z0 + z1) / 2, z1 - z0
    f = 0.07

    def lb(size, loc, matname):
        p.add(bm_box(*size), matname, base @ M(loc))
    for s in (-1, 1):
        lb((f, 0.16, h), (uc + s * (hw - f / 2), 0.05, zm), "wood_light")
    for zz in (z0 + f / 2, z1 - f / 2):
        lb((2 * hw, 0.16, f), (uc, 0.05, zz), "wood_light")
    lb((2 * hw - 2 * f, 0.02, h - 2 * f), (uc, 0.08, zm), "glass")
    lb((0.045, 0.05, h - 2 * f), (uc, 0.06, zm), "wood_light")
    lb((2 * hw - 2 * f, 0.05, 0.045), (uc, 0.06, zm), "wood_light")
    lb((2 * hw + 0.2, 0.16, 0.07), (uc, -0.03, z0 - 0.035), "wood_mid")
    lb((2 * hw + 0.14, 0.07, 0.09), (uc, -0.02, z1 + 0.045), "wood_mid")


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared patch, stakes and string for the hut, a float line staked out across the water to a
    marker buoy where the pier will end, and the plan held down by pebbles."""
    pts = []
    for i in range(36):
        a = TAU * i / 36
        c, s = math.cos(a), math.sin(a)
        r = (1.0 / ((abs(c) ** 4 + abs(s) ** 4) ** 0.25)) * (1 + rnd.uniform(-0.03, 0.03))
        pts.append((-0.25 + c * r * 4.05, 0.15 + s * r * 2.75))
    p.add(bm_slab(pts, 0.03), "dirt")
    corners = [(-2.0, -1.6), (2.0, -1.6), (2.0, 1.6), (-2.0, 1.6)]   # inside the plinth from stage 2 on
    for x, y in corners:
        p.box((0.08, 0.08, 0.36), (x, y, 0.18), "wood_light", bevel=0.01)
        p.cyl(0.057, 0.08, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
    for (x0, y0), (x1, y1) in zip(corners, corners[1:] + corners[:1]):
        p.box((math.hypot(x1 - x0, y1 - y0), 0.022, 0.022), ((x0 + x1) / 2, (y0 + y1) / 2, 0.29), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # shore stake and the float line out to the buoy
    p.box((0.08, 0.08, 0.42), (0, -2.66, 0.21), "wood_light", bevel=0.01)
    p.cyl(0.057, 0.08, (0, -2.66, 0.42), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
    p.add(bm_tube([(0, -2.7, 0.32), (0, -3.15, WATER + 0.02), (0, -10.25, WATER + 0.02)], 0.012, 4), "white")
    y = -3.5
    while y > -10.1:
        p.add(bm_cyl(0.045, 0.045, 0.08, 6), "cork", M((0, y + 0.04, WATER + 0.02), (90, 0, 0)))
        y -= 0.75
    bx, by = 0.0, -10.45
    p.add(bm_lathe([(0.05, -0.12), (0.2, -0.06), (0.22, 0.04), (0.16, 0.12), (0.05, 0.15)], 10), "cloth", M((bx, by, WATER)))
    p.add(bm_lathe([(0.222, 0.0), (0.205, 0.07)], 10, cap_bottom=False, cap_top=False), "white", M((bx, by, WATER)))
    p.cyl(0.025, 1.15, (bx, by, WATER + 0.1), "wood_light", segs=6)
    p.add(bm_prism([(0, 0), (0.32, -0.08), (0, -0.17)], 0.012), "cloth", M((bx + 0.02, by, WATER + 1.22)))
    # the plan: hut and pier sketched in ink, held down by pebbles
    px, py, pr = -2.75, -1.95, -8
    p.box((0.62, 0.46, 0.012), (px, py, 0.04), "white", rot=(0, 0, pr))
    base = M((px, py, 0.047), (0, 0, pr))
    p.add(bm_box(0.2, 0.14, 0.004), "tunic", base @ M((0, 0.12, 0)))
    p.add(bm_box(0.06, 0.26, 0.004), "tunic", base @ M((0, -0.08, 0)))
    p.add(bm_box(0.16, 0.05, 0.004), "tunic", base @ M((0, -0.2, 0)))
    for i, (dx, dy) in enumerate(((-0.27, -0.18), (0.25, 0.19), (0.26, -0.2))):
        p.add(jitter(bm_ico(0.05, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.065)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (-3.25, -2.3, 0.05), "wood_light", segs=6, rot=(0, 90, 20))
    p.box((0.15, 0.24, 0.15), (-2.82, -2.14, 0.085), "wood_mid", rot=(0, 0, 20), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (-3.55, -1.75 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 80))
    p.box((0.32, 0.03, 0.09), (-3.55, -1.65, 0.06), "white", rot=(0, 0, 80))
    for i in range(7):
        a, d = rnd.uniform(0, TAU), rnd.uniform(0.5, 2.6)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a), 0.3 + d * math.sin(a) * 0.7, 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd, extra):
    """Stone plinth for the hut, a dry-stone quay along the waterline with steps down to the water."""
    cols = ["stone", "stone", "stone_mid", "stone_light", "stone_warm"]
    p.box((2 * HX - 0.5, 2 * HY - 0.5, 0.42), (0, 0, 0.21), "stone_dark")
    X, Y = HX + 0.1, HY + 0.1
    for z0, z1 in ((0.0, 0.23), (0.23, PLINTH)):
        stone_run(p, rnd, (-X, -Y), (X, -Y), z0, z1, 0.38, (0.5, 0.8), cols, jit=0.015)
        stone_run(p, rnd, (X, Y), (-X, Y), z0, z1, 0.38, (0.5, 0.8), cols, jit=0.015)
        stone_run(p, rnd, (X, -Y + 0.38), (X, Y - 0.38), z0, z1, 0.38, (0.5, 0.8), cols, jit=0.015)
        stone_run(p, rnd, (-X, Y - 0.38), (-X, -Y + 0.38), z0, z1, 0.38, (0.5, 0.8), cols, jit=0.015)
    # quay: three courses of rough stones, face on y = -2.85, top just above the ground
    for z0, z1 in ((-0.9, -0.56), (-0.56, -0.24), (-0.24, 0.07)):
        stone_run(p, rnd, (-2.9, -2.85), (2.9, -2.85), z0, z1, 0.42, (0.45, 0.75), cols, jit=0.03)
    for i in range(9):
        p.box((rnd.uniform(0.45, 0.65), 0.3, 0.05), (-2.6 + 0.62 * i + rnd.uniform(-0.05, 0.05), -2.66, 0.08),
              rnd.choice(["stone_light", "stone", "stone_warm"]), rot=(0, 0, rnd.uniform(-5, 5)), bevel=0.012)
    # steps down to the water, left of the landing (where the boat will tie up)
    for k, (y, top) in enumerate(((-3.05, -0.08), (-3.33, -0.27), (-3.61, -0.46))):
        bm = jitter(bm_box(0.72, 0.3, top + 1.05, bevel=0.02), 0.012, 60 + k)
        p.add(bm, rnd.choice(cols), M((-2.3, y, (top - 1.05) / 2), (0, 0, rnd.uniform(-4, 4))))
    # leftover stones by the back corner
    for i, (dx, dy, z) in enumerate(((0, 0, 0), (0.42, 0.12, 0), (0.2, 0.05, 0.2))):
        p.box((0.45, 0.3, 0.2), (2.75 + dx, 2.0 + dy, z + 0.1), cols[i], rot=(0, 0, 15 + 20 * i), bevel=0.03)


def pile(p, rnd, x, y, top, r=0.13):
    bm = jitter(bm_cyl(r, r * 0.9, top - PILE_BOT, 8), 0.01, rnd.randint(0, 9999), keep_bottom=0.0)
    p.add(bm, rnd.choice(["wood_dark", "wood_mid", "wood_dark"]),
          M((x, y, PILE_BOT), (rnd.uniform(-1.5, 1.5), rnd.uniform(-1.5, 1.5), rnd.uniform(0, 45))))


def stage_03(p, rnd, extra):
    """Piles driven into the pond bed with cap beams and cross braces, short posts on the bank, a log pile."""
    cap_z = DECK - 0.3
    for y, xs in ROWS:
        for x in xs:
            if (y, x) in BOLLARD_PILES:
                pile(p, rnd, x, y, DECK + 0.42, 0.15)
                p.cyl(0.135, 0.09, (x, y, DECK + 0.42), "wood_dark", r2=0.06, segs=8)
            else:
                pile(p, rnd, x, y, DECK - 0.38)
        p.box((xs[-1] - xs[0] + 0.3, 0.2, 0.16), (0, y, cap_z), "wood_mid", bevel=0.015)
        pairs = list(zip(xs, xs[1:]))
        for k, (xa, xb) in enumerate(pairs):
            if len(xs) == 4 and k == 1 and y > -8:
                continue
            za, zb = (-0.75, DECK - 0.42) if k % 2 == 0 else (DECK - 0.42, -0.75)
            beam(p, (xa, y - 0.15, za), (xb, y - 0.15, zb), (0.05, 0.15), "wood")
    # back of the landing: a ledger on short posts standing on flat stones
    for x in (-1.45, -0.78, 0.78, 1.45):
        p.box((0.32, 0.32, 0.08), (x, -1.84, 0.02), "stone_mid", rot=(0, 0, rnd.uniform(0, 40)), bevel=0.02)
        p.box((0.16, 0.16, DECK - 0.38 - 0.06), (x, -1.84, 0.06 + (DECK - 0.44) / 2), "wood_dark")
    p.box((3.2, 0.2, 0.16), (0, -1.84, cap_z), "wood_mid", bevel=0.015)
    # spare piles stacked behind the hut, with the maul
    for i, (dx, z) in enumerate(((0, 0), (0.27, 0), (0.54, 0), (0.135, 0.23), (0.405, 0.23))):
        p.add(jitter(bm_cyl(0.13, 0.13, 2.0, 8), 0.01, 70 + i), rnd.choice(["wood_mid", "wood_dark", "wood"]),
              M((-2.2, 2.3 + dx, 0.13 + z), (0, 90, rnd.uniform(-3, 3))))
    for i in range(3):
        p.cyl(0.11, 0.02, (-2.21 + 2.02 * (i % 2), 2.3 + 0.27 * i, 0.13), "wood_light", segs=8, rot=(0, 90, 0))
    p.cyl(0.03, 0.85, (-0.5, 2.0, 0.0), "wood_light", segs=6, rot=(-28, 0, 0))
    p.box((0.32, 0.18, 0.18), (-0.5, 2.0, 0.05), "wood_dark", bevel=0.02)


def stage_04(p, rnd, extra):
    """Stringers along the piles, deck planks across the landing, the pier and the pier head."""
    hw, yb, yf = HEAD
    z = DECK - 0.145
    for x in (-0.78, 0.0, 0.78):
        p.box((0.12, abs(yf - 0.05) - 1.72, 0.15), (x, (-1.72 + yf - 0.05) / 2, z), "wood_dark")
    for x in (-1.45, 1.45):
        p.box((0.12, 1.3, 0.15), (x, -2.39, z), "wood_dark")
    for x in (-1.9, -1.35, 1.35, 1.9):
        p.box((0.12, abs(yf - yb) + 0.05, 0.15), (x, (yb + yf) / 2, z), "wood_dark")
    y = -1.72
    cols = ["driftwood", "wood_light", "wood", "driftwood", "wood_mid", "wood_light"]
    while y > yf + 0.05:
        w = rnd.uniform(0.2, 0.25)
        yc = y - w / 2
        half = LAND_X if yc > -2.98 else (hw if yc < yb else PIER_X)
        x0, x1 = -half + rnd.uniform(-0.03, 0.03), half + rnd.uniform(-0.03, 0.03)
        p.box((x1 - x0, w - 0.025, 0.07), ((x0 + x1) / 2, yc, DECK - 0.035 + rnd.uniform(-0.006, 0.006)),
              rnd.choice(cols), rot=(rnd.uniform(-0.6, 0.6), 0, rnd.uniform(-0.6, 0.6)))
        y -= w
    # nail heads would be lost at this size; a darker edge board along each side reads as the fascia
    for s in (-1, 1):
        p.box((0.04, 5.42, 0.12), (s * (PIER_X + 0.02), -5.69, DECK - 0.1), "wood_dark")
    # spare planks behind the hut
    for i in range(5):
        p.box((2.0, 0.24, 0.05), (1.45 + rnd.uniform(-0.04, 0.04), 2.5 + rnd.uniform(-0.03, 0.03), 0.03 + 0.05 * i),
              rnd.choice(cols), rot=(0, 0, rnd.uniform(-4, 4)))
    p.box((0.1, 0.3, 0.12), (0.7, 2.5, 0.06), "wood_dark")
    p.box((0.1, 0.3, 0.12), (2.2, 2.5, 0.06), "wood_dark")


def stage_05(p, rnd, extra):
    """Hut frame: sills and floor, corner posts, door and window framing, plates, rafters and ridge, a ladder."""
    for s in (-1, 1):
        p.box((2 * HX, 0.2, 0.16), (0, s * (HY - 0.1), PLINTH + 0.08), "wood_mid")
        p.box((0.2, 2 * HY - 0.4, 0.16), (s * (HX - 0.1), 0, PLINTH + 0.08), "wood_mid")
    n = 15
    for i in range(n):
        x = -HX + 0.2 + (2 * HX - 0.4) * (i + 0.5) / n
        p.box(((2 * HX - 0.4) / n - 0.012, 2 * HY - 0.4, 0.12), (x, 0, FLOOR - 0.06), rnd.choice(["wood", "wood_light", "driftwood"]))
    h = WALL_TOP + 0.14 - PLINTH
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((0.22, 0.22, h), (sx * HX, sy * HY, PLINTH + h / 2), "wood_dark", bevel=0.015)
    for side, base in WALLS.items():
        ulen = 2 * HX if side in ("front", "back") else 2 * HY
        p.add(bm_box(ulen - 0.2, 0.14, 0.14), "wood_mid", base @ M((0, 0.14, WALL_TOP + 0.07)))
        for uc, hw, z0, z1 in OPS[side]:
            for s in (-1, 1):
                p.add(bm_box(0.1, 0.12, WALL_TOP - FLOOR), "wood_mid", base @ M((uc + s * (hw + 0.05), 0.14, (FLOOR + WALL_TOP) / 2)))
            p.add(bm_box(2 * hw + 0.2, 0.12, 0.12), "wood_mid", base @ M((uc, 0.14, z1 + 0.06)))
            if z0 > FLOOR + 0.1:
                p.add(bm_box(2 * hw + 0.2, 0.12, 0.1), "wood_mid", base @ M((uc, 0.14, z0 - 0.05)))
        if side in ("front", "back"):
            for u in (-1.0, 1.0):
                p.add(bm_box(0.1, 0.12, z_roof(u) - WALL_TOP - 0.2), "wood_mid",
                      base @ M((u, 0.14, (WALL_TOP + 0.14 + z_roof(u) - 0.06) / 2)))
            p.add(bm_box(0.12, 0.12, RIDGE - WALL_TOP - 0.3), "wood_mid", base @ M((0, 0.14, (WALL_TOP + RIDGE) / 2 - 0.08)))
    p.box((0.14, 2 * ROOF_Y - 0.1, 0.18), (0, 0, RIDGE - 0.14), "wood_dark")
    xe = EAVE_X + 0.1
    for y in (-1.9, -0.95, 0.0, 0.95, 1.9):
        for s in (-1, 1):
            beam(p, (s * xe, y, z_roof(xe) - 0.09), (0, y, RIDGE - 0.09), (0.1, 0.14), "wood_mid")
        if abs(y) < 1.5:
            p.box((2.0, 0.08, 0.12), (0, y + 0.09, 3.62), "wood_mid")
    for s in (-1, 1):
        for sd in (0.75, 1.65, 2.55, 3.3):
            x, z = rp(sd, 0.03)
            p.box((0.07, 2 * ROOF_Y - 0.05, 0.05), (s * x, 0, z), "wood_light", rot=(0, s * SLOPE_DEG, 0))
    # ladder leaning on the left wall plate
    a, b = Vector((-2.92, 0.85, 0.0)), Vector((-2.13, 0.85, 2.7))
    for s in (-1, 1):
        off = Vector((0, s * 0.21, 0))
        beam(p, a + off, b + off, (0.06, 0.08), "wood_light")
    for k in range(1, 9):
        q = a + (b - a) * (k / 9.2)
        p.box((0.05, 0.44, 0.04), tuple(q), "wood_light")


def stage_06(p, rnd, extra):
    """Board-and-batten walls with the gables filled in, window frames with glass, the door casing."""
    for side in WALLS:
        boards(p, rnd, side)
    for side, op in WINDOWS:
        window(p, side, op)
    base = WALLS["front"]
    uc, hw, z0, z1 = DOOR
    for s in (-1, 1):
        p.add(bm_box(0.07, 0.16, z1 - z0), "wood_light", base @ M((uc + s * (hw - 0.035), 0.05, (z0 + z1) / 2)))
    p.add(bm_box(2 * hw + 0.16, 0.18, 0.1), "wood_light", base @ M((uc, 0.04, z1 + 0.02)))
    p.add(bm_box(2 * hw, 0.2, 0.04), "wood_mid", base @ M((uc, 0.06, FLOOR + 0.02)))


COURSES = [(-0.2, 0.95, 0.3), (0.62, 1.85, 0.2), (1.52, 2.72, 0.1), (2.4, 3.6, 0.0)]   # (s top, s lip, lift)


def stage_07(p, rnd, extra):
    """Thick reed thatch in four overlapping courses, a bound ridge roll and crossed ridge poles."""
    T = 0.3
    ys = [-ROOF_Y + 2 * ROOF_Y * k / 8 for k in range(9)]
    for sgn in (1, -1):
        for sa, sb, b in COURSES:
            secs = []
            for j, y in enumerate(ys):
                th = (1 + rnd.uniform(-0.08, 0.08)) * (0.82 if j in (0, 8) else 1.0)
                ds = rnd.uniform(-0.05, 0.04)
                pts = [rp(sa, b), rp(sa + 0.4, b + T * 0.65 * th), rp(sb - 0.3 + ds, b + T * th),
                       rp(sb - 0.07 + ds, b + T * th * 0.85), rp(sb + 0.03 + ds, b + T * th * 0.48),
                       rp(sb - 0.02 + ds, b + 0.05), rp(sb - 0.22 + ds, b - 0.01)]
                secs.append([(sgn * x, y, z) for x, z in pts])
            p.add(loft(secs), "reed", smooth=True)
    p.add(bm_cyl(0.36, 0.36, 2 * ROOF_Y + 0.16, 12), "reed_dark", M((0, -ROOF_Y - 0.08, RIDGE + 0.4), (-90, 0, 0)), smooth=True)
    for k in range(7):
        y = -ROOF_Y + 0.25 + (2 * ROOF_Y - 0.5) * k / 6
        p.add(bm_cyl(0.375, 0.375, 0.06, 12), "rope", M((0, y - 0.03, RIDGE + 0.4), (-90, 0, 0)))
    for y in (-ROOF_Y + 0.12, ROOF_Y - 0.12):
        for s in (-1, 1):
            p.add(bm_tube([(s * 1.0, y, 4.5), (s * -0.62, y, 5.97)], 0.05, 6), "wood_dark")
        p.ball(0.08, (0, y, 5.42), "rope", subdiv=1, smooth=False)
    # spare reed bundles leaning on the back wall
    for i, x in enumerate((-0.05, 0.24)):
        p.cyl(0.12, 1.35, (x, HY + 0.42, 0.0), rnd.choice(["reed", "reed_dark"]), segs=8, rot=(14, rnd.uniform(-5, 5), 0))
        p.cyl(0.125, 0.06, (x, HY + 0.42 - 0.12, 0.55), "rope", segs=8, rot=(14, 0, 0))


def stage_08(p, rnd, extra):
    """Plank door with iron strap hinges, shutters, a stovepipe through the thatch (`smoke`), a bench, a bucket."""
    base = WALLS["front"]
    uc, hw, z0, z1 = DOOR
    dw, dz1 = 2 * (hw - 0.07), z1 - 0.01
    for i in range(4):
        u = uc - dw / 2 + dw * (i + 0.5) / 4
        p.add(bm_box(dw / 4 - 0.012, 0.06, dz1 - z0 - 0.04), "door", base @ M((u, 0.07, (z0 + 0.04 + dz1) / 2)))
    for z in (z0 + 0.35, dz1 - 0.35):
        p.add(bm_box(dw * 0.8, 0.02, 0.07), "iron", base @ M((uc - dw * 0.1, 0.035, z)))
        p.add(bm_cyl(0.04, 0.04, 0.05, 8), "iron", base @ M((uc - dw / 2 + 0.02, 0.03, z), (90, 0, 0)))
    p.add(bm_box(dw - 0.04, 0.02, 0.06), "wood_dark", base @ M((uc, 0.035, (z0 + dz1) / 2)))
    ring = [(uc + 0.26 + 0.06 * math.cos(TAU * k / 10), 0.01, 1.45 + 0.06 * math.sin(TAU * k / 10)) for k in range(11)]
    p.add(bm_tube(ring, 0.012, 4), "iron", base)
    # shutters swung open against the wall
    for side, (u, hw2, wz0, wz1) in WINDOWS:
        b = WALLS[side]
        h = wz1 - wz0
        for s in (-1, 1):
            c = u + s * (hw2 + (hw2 - 0.02) / 2 + 0.01)
            p.add(bm_box(hw2 - 0.02, 0.04, h), "shutter", b @ M((c, -0.04, (wz0 + wz1) / 2)))
            for zz in (-h * 0.3, h * 0.3):
                p.add(bm_box(hw2 - 0.06, 0.025, 0.06), "wood_dark", b @ M((c, -0.07, (wz0 + wz1) / 2 + zz)))
    # stovepipe through the right slope
    sx, sy = 1.0, 0.8
    p.cyl(0.1, 1.3, (sx, sy, 3.8), "iron", segs=8)
    p.cyl(0.19, 0.08, (sx, sy, 4.36), "iron", r2=0.13, segs=8)
    p.cyl(0.24, 0.16, (sx, sy, 5.12), "iron", r2=0.02, segs=8)
    for k in range(3):
        a = TAU * k / 3
        p.box((0.02, 0.02, 0.1), (sx + 0.08 * math.cos(a), sy + 0.08 * math.sin(a), 5.08), "iron")
    extra.append(("empty", "smoke", (sx, sy, 5.4)))
    # bench under the front window, a pot of thrift on it, a bucket by the door
    bx, by = -1.2, -1.98
    p.box((1.05, 0.32, 0.07), (bx, by, DECK + 0.42), "wood_light", bevel=0.015)
    for s in (-1, 1):
        p.add(jitter(bm_cyl(0.1, 0.09, 0.39, 7), 0.01, 80 + s), "wood_mid", M((bx + s * 0.36, by, DECK)))
    p.add(bm_lathe([(0.07, 0), (0.1, 0.14), (0.11, 0.15), (0.1, 0.16)], 8), "pot", M((bx + 0.32, by, DECK + 0.455)))
    p.add(jitter(bm_ico(0.1, 1), 0.015, 3), "grass_dark", M((bx + 0.32, by, DECK + 0.64), scale=(1, 1, 0.8)))
    for k in range(5):
        a = TAU * k / 5
        p.ball(0.028, (bx + 0.32 + 0.06 * math.cos(a), by + 0.06 * math.sin(a), DECK + 0.7), "petal_pink", subdiv=0, smooth=False)
    kx, ky = 0.8, -1.95
    p.add(bm_lathe([(0.13, 0), (0.16, 0.3)], 10, cap_top=False), "wood", M((kx, ky, DECK)))
    p.cyl(0.14, 0.02, (kx, ky, DECK + 0.22), "glass", segs=10)
    for z in (0.05, 0.24):
        p.add(bm_lathe([(0.135 + z * 0.1, z), (0.147 + z * 0.1, z), (0.147 + z * 0.1, z + 0.035), (0.135 + z * 0.1, z + 0.035)],
                       10, cap_bottom=False, cap_top=False), "iron", M((kx, ky, DECK)))
    p.add(bm_tube([(kx - 0.16, ky, DECK + 0.28)] + [(kx - 0.16 * math.cos(math.pi * k / 6), ky, DECK + 0.28 + 0.14 * math.sin(math.pi * k / 6))
                                                       for k in range(1, 7)], 0.01, 4), "iron")


def stage_09(p, rnd, extra):
    """Pier fittings: a rail along the right side, bollards and rope fenders on the left, a ladder at the head."""
    for y in RAIL_YS:
        p.box((0.1, 0.1, 0.98), (RAIL_X, y, DECK + 0.49), "wood_mid", bevel=0.01)
        p.cyl(0.075, 0.06, (RAIL_X, y, DECK + 0.98), "wood_mid", r2=0.0, segs=4, rot=(0, 0, 45))
    p.box((0.09, RAIL_YS[0] - RAIL_YS[-1] + 0.12, 0.07), (RAIL_X, (RAIL_YS[0] + RAIL_YS[-1]) / 2, DECK + 0.93), "wood_light")
    for ya, yb in zip(RAIL_YS, RAIL_YS[1:]):
        rope(p, (RAIL_X, ya, DECK + 0.52), (RAIL_X, yb, DECK + 0.52), 0.1)
    for y in (-4.75, -7.3):
        p.add(jitter(bm_cyl(0.12, 0.12, 0.42, 9), 0.008, int(-y * 10)), "wood_dark", M((-0.7, y, DECK)))
        p.cyl(0.145, 0.06, (-0.7, y, DECK + 0.4), "wood_dark", r2=0.12, segs=9)
        p.cyl(0.128, 0.05, (-0.7, y, DECK + 0.08), "iron", segs=9)
    for k in range(3):
        p.add(bm_lathe([(0.12, 0.0), (0.155, 0.02), (0.12, 0.045)], 9, cap_bottom=False, cap_top=False), "rope",
              M((-0.7, -4.75, DECK + 0.16 + 0.045 * k)))
    for y in (-5.25, -6.75):
        rope(p, (-0.86, y, DECK + 0.02), (-0.98, y, DECK - 0.15), 0.0, 0.012, 2)
        p.add(bm_cyl(0.09, 0.09, 0.45, 8, bevel=0.03), "rope", M((-0.99, y, DECK - 0.62)))
        for z in (0.1, 0.22, 0.34):
            p.cyl(0.094, 0.025, (-0.99, y, DECK - 0.62 + z), "wood_dark", segs=8)
    # ladder down into the water at the front of the pier head
    lx, ly = -1.25, HEAD[2] - 0.05
    for s in (-1, 1):
        p.box((0.07, 0.07, DECK + 0.55 + 1.15), (lx + s * 0.22, ly, (DECK + 0.55 - 1.15) / 2), "wood_mid")
    z = -0.95
    while z < DECK - 0.1:
        p.box((0.44, 0.05, 0.045), (lx, ly - 0.01, z), "wood_light")
        z += 0.27
    coil(p, 1.25, -8.85, DECK)


def stage_10(p, rnd, extra):
    """Marlo's rowboat, tied up along the left of the pier: `boat`, origin on the waterline (it can bob)."""
    b = Part("boat")
    bx, by, wz = BOAT_X, BOAT_Y, WATER
    U = [(-1.0, 1.0), (-0.98, 0.62), (-0.86, 0.3), (-0.6, 0.08), (-0.3, 0.01), (0.0, 0.0), (0.3, 0.01), (0.6, 0.08),
         (0.86, 0.3), (0.98, 0.62), (1.0, 1.0)]

    def prof(t):
        w = 0.45 + 0.13 * math.sin(math.pi / 2 * t / 0.42) if t <= 0.42 else 0.58 * max(1 - ((t - 0.42) / 0.58) ** 2, 0.0) ** 0.5
        w = max(w, 0.025)
        sheer = 0.3 + 0.17 * t ** 2.5
        keel = -0.17 + 0.05 * max(0.0, 1 - t / 0.2) + (0.24 * ((t - 0.72) / 0.28) ** 2 if t > 0.72 else 0.0)
        return w, sheer, keel

    def ypos(t):
        return by - 1.47 + 2.97 * t           # stern (t = 0) out toward the water, bow toward the shore

    ts = [k / 14 for k in range(15)]
    outer, inner = [], []
    for t in ts:
        w, sh, kl = prof(t)
        y = ypos(t)
        outer.append([(bx + fx * w, y, wz + kl + fz * (sh - kl)) for fx, fz in U])
        wi, ki = max(w - 0.045, 0.012), kl + 0.045
        inner.append([(bx + fx * wi, y, wz + min(ki + fz * (sh - ki), sh)) for fx, fz in U])
    b.add(loft(outer, close=False, cap=False), "boat", smooth=True)
    b.add(loft(inner, close=False, cap=False), "wood_mid", smooth=True)
    w, sh, kl = prof(0.0)
    b.add(bm_prism([(fx * w, kl + fz * (sh - kl)) for fx, fz in U], 0.06), "boat", M((bx, ypos(0.0) + 0.03, wz)))
    for s in (-1, 1):
        b.add(bm_tube([(bx + s * prof(t)[0], ypos(t), wz + prof(t)[1]) for t in ts], 0.032, 5), "wood_dark")
    w1, sh1, kl1 = prof(0.97)
    beam(b, (bx, ypos(0.95), wz + kl1), (bx, ypos(1.0) + 0.05, wz + prof(1.0)[1] + 0.06), (0.06, 0.08), "wood_dark")
    for t in (0.1, 0.32, 0.62):
        w, sh, kl = prof(t)
        b.box((2 * (w - 0.04), 0.2, 0.04), (bx, ypos(t), wz + sh - 0.13), "wood_light")
    w, sh, kl = prof(0.45)
    b.box((0.5, 2.0, 0.025), (bx, ypos(0.45), wz + kl + 0.07), "wood")
    for s in (-1, 1):
        b.box((0.04, 0.05, 0.08), (bx + s * (w + 0.01), ypos(0.45), wz + sh + 0.05), "iron")
    for o, (t0, t1) in ((0.13, (0.06, 0.86)), (-0.12, (0.1, 0.9))):
        a = Vector((bx + o, ypos(t0), wz + 0.24))
        c = Vector((bx + o * 0.5, ypos(t1), wz + 0.33))
        b.add(bm_tube([a, c], 0.024, 6), "wood_light")
        d = (c - a).normalized()
        blade = a - d * 0.22
        b.add(bm_box(0.13, 0.5, 0.02), "wood_light", M(tuple(blade), (0, 0, math.degrees(math.atan2(-d.x, d.y)))))
    b.add(jitter(bm_ico(0.17, 1), 0.04, 5), "net", M((bx + 0.12, ypos(0.2), wz + 0.0), scale=(1.4, 1.1, 0.5)), smooth=True)
    ring = [(bx + 0.05 * math.cos(TAU * k / 8), ypos(1.0) + 0.02, wz + 0.42 + 0.05 * math.sin(TAU * k / 8)) for k in range(9)]
    b.add(bm_tube(ring, 0.01, 4), "iron")
    extra.append((b, (bx, by, wz)))
    # mooring lines to the bollards (static)
    rope(p, (bx + 0.02, ypos(1.0), wz + 0.42), (-0.62, -4.75, DECK + 0.3), 0.2)
    rope(p, (bx, ypos(0.0) + 0.04, wz + 0.3), (-0.62, -7.3, DECK + 0.3), 0.15)


def stage_11(p, rnd, extra):
    """Fishing gear: nets drying on a rack and over the rail (`net_01`, `net_02` sway), rods, crates of
    fish, barrels, lobster pots, floats on the wall and a coil of rope."""
    rx, rz = -3.5, 2.05
    for y in (-0.9, 1.1):
        p.add(jitter(bm_box(0.12, 0.12, rz + 0.1), 0.01, int(y * 10)), "driftwood", M((rx, y, (rz + 0.1) / 2)))
        for s in (-1, 1):
            beam(p, (rx, y, 0.75), (rx + s * 0.42, y, 0.02), (0.06, 0.08), "wood_mid")
    p.add(bm_tube([(rx, -1.15, rz), (rx, 1.35, rz)], 0.04, 6), "wood_light")
    net, origin = drape("net_01", rx, -0.75, 0.95, rz + 0.04, 1.55, 1.4, flare=0.32, seed=1)
    extra.append((net, origin))
    net2, origin2 = drape("net_02", RAIL_X, -5.82, -6.92, DECK + 0.97, 0.45, 0.85, flare=0.12, seed=4)
    extra.append((net2, origin2))
    # rods leaning by the door
    for k in range(3):
        a = Vector((1.18 + 0.15 * k, -2.0 + 0.03 * k, DECK))
        c = Vector((1.1 + 0.17 * k, -1.7, DECK + 2.15 - 0.12 * k))
        p.add(bm_tube([a, a + (c - a) * 0.3, c], [0.022, 0.016, 0.008], 5), "wood_dark")
        q = a + (c - a) * 0.13
        p.add(bm_cyl(0.045, 0.045, 0.04, 8), "iron", M(tuple(q + Vector((0.05, -0.02, 0))), (0, 90, 0)))
        p.add(bm_tube([a + Vector((0, 0, 0.02)), a + (c - a) * 0.08], 0.026, 5), "cork")
    # rod holder at the pier head, line out to a float
    hx, hy = 1.97, -9.0
    p.box((0.1, 0.1, 0.5), (hx, hy, DECK + 0.25), "wood_mid")
    a, c = Vector((hx + 0.05, hy, DECK + 0.4)), Vector((3.55, hy - 0.25, DECK + 1.75))
    p.add(bm_tube([a, a + (c - a) * 0.4, c], [0.022, 0.015, 0.008], 5), "wood_dark")
    p.add(bm_tube([c, (c.x + 0.04, c.y, (c.z + WATER) / 2), (c.x + 0.06, c.y, WATER + 0.08)], 0.004, 3), "white")
    p.ball(0.05, (c.x + 0.06, c.y, WATER + 0.04), "cloth", subdiv=1)
    p.ball(0.032, (c.x + 0.06, c.y, WATER + 0.1), "white", subdiv=1)
    p.box((0.06, 0.06, 0.12), (hx + 0.06, hy, DECK + 0.42), "iron", rot=(0, 40, 0))
    # crates on the bank right of the landing, one full of the morning's catch
    crate(p, 2.55, -2.1, 0.0, 8)
    crate(p, 3.22, -1.95, 0.0, -12)
    crate(p, 2.62, -2.08, 0.42, 20, 0.55, 0.4, 0.36)
    crate(p, 2.85, -1.2, 0.0, 85, 0.6, 0.45, 0.4, fish=6, rnd=rnd)
    barrel(p, 2.62, 0.55, 10)
    barrel(p, 2.7, 1.25, 50, 0.9)
    # lobster pots stacked on the pier head
    creel(p, M((-1.35, -8.8, DECK), (0, 0, 6)))
    creel(p, M((-1.33, -8.82, DECK + 0.26), (0, 0, -8)))
    # floats hung on the right wall
    p.box((0.08, 0.04, 0.04), (HX + 0.06, -1.1, 2.08), "wood_dark")
    p.add(bm_tube([(HX + 0.1, -1.1, 2.08), (HX + 0.14, -1.1, 1.05)], 0.012, 4), "rope")
    for k, (z, m) in enumerate(((1.84, "cloth"), (1.58, "white"), (1.32, "cork"), (1.1, "cloth"))):
        p.ball(0.1 if k != 2 else 0.08, (HX + 0.15, -1.1 + 0.02 * (k % 2), z), m, subdiv=1)
    coil(p, -0.85, -2.6, DECK, 0.19)
    coil(p, -0.85, -2.6, DECK + 0.05, 0.14, 1.5)


def stage_12(p, rnd, extra):
    """Willowmere's old bronze bell on a timber frame at the pier head (`bell`, pivot on its axle, swings
    around X), lanterns at the head's front corners (`glow`), and a carved fish sign at the landing."""
    by = BELL_Y
    for s in (-1, 1):
        x = s * 0.78
        p.box((0.2, 0.2, FRAME_TOP - DECK), (x, by, (DECK + FRAME_TOP) / 2), "wood_mid", bevel=0.015)
        for t in (-1, 1):
            beam(p, (x, by + t * 0.08, DECK + 0.75), (x, by + t * 0.62, DECK + 0.03), (0.09, 0.09), "wood_dark")
            p.box((0.14, 0.14, 0.04), (x, by + t * 0.62, DECK + 0.02), "wood_dark")
        p.box((0.05, 0.22, 0.18), (x - s * 0.125, by, AXIS_Z), "iron")
        p.cyl(0.13, 0.04, (x, by, DECK), "iron", segs=8)
    p.box((2.0, 0.26, 0.22), (0, by, FRAME_TOP + 0.11), "wood", bevel=0.02)
    for t in (-1, 1):
        p.box((2.25, 0.46, 0.05), (0, by + t * 0.2, FRAME_TOP + 0.33), "shingle_dark", rot=(-t * 28, 0, 0))
    p.box((2.3, 0.08, 0.08), (0, by, FRAME_TOP + 0.45), "wood_dark")
    # the bell, built around its axle (AXIS_Z), crown just below the headstock
    bell = Part("bell")
    mouth = AXIS_Z - 0.82
    bm = M((0, by, mouth))
    prof = [(0.003, 0.6), (0.14, 0.58), (0.19, 0.5), (0.21, 0.36), (0.235, 0.2), (0.28, 0.08), (0.33, 0.015), (0.35, -0.01),
            (0.375, 0.03), (0.345, 0.1), (0.29, 0.22), (0.262, 0.36), (0.25, 0.5), (0.23, 0.6), (0.19, 0.68), (0.1, 0.715),
            (0.003, 0.72)]
    bell.add(bm_lathe(prof, 16, cap_bottom=False, cap_top=False), "bronze", bm, smooth=True)

    def r_out(z):
        pts = prof[8:]
        for (r0, z0), (r1, z1) in zip(pts, pts[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
        return pts[-1][0]
    for z in (0.12, 0.27, 0.56):
        r = r_out(z)
        bell.add(bm_lathe([(r - 0.01, z - 0.014), (r + 0.012, z - 0.014), (r + 0.012, z + 0.014), (r - 0.01, z + 0.014)], 16,
                          cap_bottom=False, cap_top=False), "bronze_dark", bm)
    for k in range(9):               # the rune band: same glow as Pip's stone and the millstone
        a = TAU * k / 9 + 0.17
        r = r_out(0.41) + 0.004
        tilt = (0, 25, -25, 0, 40)[k % 5]
        bell.add(bm_box(0.022, 0.012, 0.075), "glow", bm @ M((r * math.sin(a), -r * math.cos(a), 0.41), (0, 0, math.degrees(a))) @ M((0, 0, 0), (0, tilt, 0)))
        if k % 3 == 0:
            bell.add(bm_box(0.05, 0.012, 0.016), "glow", bm @ M((r * math.sin(a + 0.09), -r * math.cos(a + 0.09), 0.37), (0, 0, math.degrees(a))))
    for k in range(7):               # verdigris from a long time under the lake
        z0 = rnd.uniform(0.04, 0.5)
        z1 = z0 + rnd.uniform(0.07, 0.16)
        a0 = rnd.uniform(0, 360)
        bell.add(bm_lathe([(r_out(z0) + 0.006, z0), (r_out(z1) + 0.006, z1)], 3, arc=(a0, a0 + rnd.uniform(25, 60))), "verdigris", bm)
    bell.add(bm_box(1.2, 0.2, 0.2, bevel=0.02), "wood_dark", M((0, by, AXIS_Z)))
    for s in (-1, 1):
        bell.add(bm_cyl(0.04, 0.04, 0.14, 8), "iron", M((s * 0.6, by, AXIS_Z), (0, s * 90, 0)))
        bell.add(bm_box(0.05, 0.24, 0.32), "iron", M((s * 0.14, by, AXIS_Z - 0.05)))
    bell.add(bm_cyl(0.11, 0.13, 0.08, 10), "bronze_dark", M((0, by, AXIS_Z - 0.18)))
    bell.add(bm_cyl(0.02, 0.02, 0.72, 6), "iron", M((0, by, mouth - 0.06)))
    bell.add(bm_ico(0.065, 1), "iron", M((0, by, mouth - 0.04)), smooth=True)
    bell.add(bm_tube([(0, by, mouth - 0.09), (0.01, by - 0.02, mouth - 0.35), (0.0, by - 0.03, DECK + 0.85)], 0.016, 5), "rope")
    bell.add(bm_ico(0.035, 1), "rope", M((0.0, by - 0.03, DECK + 0.84)))
    extra.append((bell, (0, by, AXIS_Z)))
    # lanterns on posts at the head's front corners
    for s in (-1, 1):
        x, y = s * 1.85, -9.78
        p.box((0.14, 0.14, 1.85), (x, y, DECK + 0.925), "wood_mid", bevel=0.01)
        p.cyl(0.1, 0.08, (x, y, DECK + 1.85), "wood_dark", r2=0.0, segs=4, rot=(0, 0, 45))
        p.box((0.06, 0.44, 0.06), (x, y - 0.2, DECK + 1.75), "iron")
        beam(p, (x, y - 0.06, DECK + 1.45), (x, y - 0.3, DECK + 1.73), (0.03, 0.03), "iron")
        add_lantern(p, (x, y - 0.36, DECK + 1.72 - 0.58 * 1.1), 1.1, hang=True)
    # carved fish sign on a post at the landing's front corner
    sx, sy = 1.42, -2.85
    p.box((0.14, 0.14, 2.2), (sx, sy, DECK + 1.1), "wood_mid", bevel=0.01)
    p.box((0.85, 0.08, 0.08), (sx + 0.4, sy, DECK + 2.05), "wood_dark")
    beam(p, (sx, sy, DECK + 1.7), (sx + 0.38, sy, DECK + 2.03), (0.05, 0.05), "wood_dark")
    fx, fz = sx + 0.55, DECK + 1.55
    body = [(-0.06 + 0.3 * math.cos(math.radians(a)), 0.16 * math.sin(math.radians(a))) for a in range(20, 341, 20)]
    shape = body + [(0.42, -0.16), (0.34, 0.0), (0.42, 0.16)]
    p.add(bm_prism([(x * 1.12, z * 1.12) for x, z in shape], 0.035), "wood_dark", M((fx, sy + 0.025, fz)))
    p.add(bm_prism(shape, 0.05), "wood_light", M((fx, sy, fz)))
    p.add(bm_cyl(0.025, 0.025, 0.02, 8), "ink", M((fx - 0.25, sy - 0.03, fz + 0.04), (90, 0, 0)))
    for u in (-0.08, 0.04, 0.16):
        p.add(bm_box(0.02, 0.01, 0.16), "wood_mid", M((fx + u, sy - 0.028, fz), (0, 12, 0)))
    for u in (-0.18, 0.2):
        for i in range(3):
            p.box((0.016, 0.04 if i % 2 else 0.016, 0.1), (fx + u, sy, DECK + 1.98 - i * 0.09), "iron")


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06,
          stage_07, stage_08, stage_09, stage_10, stage_11, stage_12]


def build():
    model = common.reset()
    stages = []
    for i, fn in enumerate(STAGES, 1):
        name = "stage_%02d" % i
        node = common.empty(name, model)
        part = Part(name + "_mesh")
        extra = []
        fn(part, random.Random(3000 + i), extra)
        objs = [part.to_object(model, parent=node)]
        for item in extra:
            if item[0] == "empty":
                objs.append(common.empty(item[1], model, parent=node, loc=item[2]))
            else:
                objs.append(item[0].to_object(model, parent=node, origin=item[1]))
        stages.append((node, objs))
    return stages


# ------------------------------------------------------------------ preview-only pond

def smoothstep(a, b, x):
    t = min(max((x - a) / (b - a), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def preview_ground():
    """Meadow with a pond dug in front of the dock (preview only, never exported)."""
    g = common.meadow(45, seed=3, fine=True)
    ca = g.data.color_attributes["Col"]
    bank, bed = common.hex_rgba("#A59478"), common.hex_rgba("#5D6852")
    cx, cy, ax, ay = POND
    for v, d in zip(g.data.vertices, ca.data):
        e = math.hypot((v.co.x - cx) / ax, (v.co.y - cy) / ay)
        v.co.z = -1.5 * smoothstep(1.06, 0.8, e)
        f1, f2 = smoothstep(1.13, 1.0, e), smoothstep(0.98, 0.85, e)
        c = [d.color[i] * (1 - f1) + bank[i] * f1 for i in range(3)]
        c = [c[i] * (1 - f2) + bed[i] * f2 for i in range(3)]
        d.color = (c[0], c[1], c[2], 1.0)
    common.hills()
    common.clouds()


def water():
    bpy = common.bpy
    if "preview_water" in bpy.data.objects:
        return
    me = bpy.data.meshes.get("preview_water")
    if me is None:
        bm = bmesh.new()
        bmesh.ops.create_circle(bm, cap_ends=True, segments=48, radius=1.0)
        for v in bm.verts:
            v.co = Vector((POND[0] + v.co.x * (POND[2] + 0.6), POND[1] + v.co.y * (POND[3] + 0.6), WATER))
        me = bpy.data.meshes.new("preview_water")
        bm.to_mesh(me)
        bm.free()
        m = bpy.data.materials.new("preview_water")
        try:
            m.use_nodes = True
        except Exception:
            pass
        b = m.node_tree.nodes.get("Principled BSDF")
        b.inputs["Base Color"].default_value = common.hex_rgba("#3F6E7C")
        b.inputs["Roughness"].default_value = 0.12
        b.inputs["Alpha"].default_value = 0.86
        me.materials.append(m)
    common.coll("PREVIEW").objects.link(bpy.data.objects.new("preview_water", me))


def rig(targets, **kw):
    cam = common.preview_rig(targets, **kw)
    water()
    return cam


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs if o.type == "MESH"]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    common.setup_render()
    preview_ground()
    rig(meshes, azim=-30, elev=24, lens=50, margin=0.86)        # ground and water occlude the bake
    for k in range(1, len(stages) + 1):
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("dock.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs if o.type == "MESH"]
            rig(vis, azim=-30, elev=24, lens=50, margin=0.84, min_radius=7.5)
            common.render(os.path.join(common.OUT_PREV, "dock_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    rig(meshes, azim=-36, elev=18, lens=40, margin=0.72)
    common.render(os.path.join(common.OUT_PREV, "dock.png"))
    common.save_blend("dock")
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [round(min(q[i] for q in pts), 2) for i in range(3)]
    hi = [round(max(q[i] for q in pts), 2) for i in range(3)]
    special = {n: [round(c, 3) for c in bpy.data.objects[n].matrix_world.translation] for n in ("bell", "boat", "net_01", "net_02", "smoke")}
    result = {"tris": counts, "total": sum(counts.values()), "bbox_min": lo, "bbox_max": hi, "special": special,
              "glow_tris": sum(sum(len(p.vertices) - 2 for p in o.data.polygons if o.data.materials[p.material_index].name == "glow")
                               for o in meshes)}
    print("DOCK_RESULT", result)
    return result


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
