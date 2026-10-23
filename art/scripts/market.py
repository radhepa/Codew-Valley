"""Market Square: a cobbled square with five striped stalls around a stone well, in 14
cumulative stages (stage_01 .. stage_14). See art/specs/market.md.

Run in Blender:  exec(compile(open(path).read(), path, "exec"), {"__file__": path, "RUN_MAIN": True})
Set RENDER_STAGES = False to skip the 14 stage renders while iterating.

The origin is the centre of the square at ground level, under the well. The front (open
side, where you walk in) faces -Y. Stalls are built in their own frame `T`: local -Y is the
stall front, local X runs along the counter.
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
FAST = bool(os.environ.get("MARKET_FAST"))      # geometry check only: no bake, export or renders
TAU = 2 * math.pi

# market goods (added at run time; common.py is shared and stays untouched)
common.PALETTE.update({
    "plum": "#6B4A5E", "water": "#4D666B", "apple": "#A6493B", "carrot": "#C27A3E", "pumpkin": "#C08A3F",
    "bread": "#B7844B", "bread_dark": "#8F6439", "fish": "#8E9CA1", "clay": "#A66A4A", "clay_dark": "#83533A",
    "brass": "#B39448", "parchment": "#E6D9B8", "wax": "#963C33", "teal": "#58807B", "rose": "#B47D78",
})

# ------------------------------------------------------------------ dimensions
COB = 0.1                       # top of the cobbles: everything on the square stands here
HX, HY = 6.6, 5.6               # paved area half extents (inside the kerb)
FH, BH = COB + 2.0, COB + 2.4   # stall front / back post tops
RIDGE = 2.98                    # well roof ridge
RIDGE_ENDS = [(-1.27, 0.0, RIDGE + 0.06), (1.27, 0.0, RIDGE + 0.06)]
POLES = {"bl": (-6.45, 5.45), "br": (6.45, 5.45), "fl": (-6.45, -5.45), "fr": (6.45, -5.45)}
POLE_TOP = 4.45

STALLS = [   # (centre, rotation of the frame, width, depth, stripe materials)
    dict(c=(-4.3, 4.4), rot=0, W=2.6, D=1.5, stripe=("cloth", "canvas")),       # 1 produce
    dict(c=(0.0, 4.5), rot=0, W=3.3, D=1.6, stripe=("plum", "mustard")),        # 2 Sable's trading stall
    dict(c=(4.3, 4.4), rot=0, W=2.6, D=1.5, stripe=("shutter", "canvas")),      # 3 cloth and pottery
    dict(c=(-5.5, 0.2), rot=90, W=2.6, D=1.5, stripe=("door", "canvas")),       # 4 fish
    dict(c=(5.5, 0.2), rot=-90, W=2.6, D=1.5, stripe=("mustard", "canvas")),    # 5 bread and flour
]


def frame(st):
    return M((st["c"][0], st["c"][1], 0), (0, 0, st["rot"]))


# ------------------------------------------------------------------ small helpers (frame-aware)

def B(p, T, size, loc, m, rot=(0, 0, 0), bevel=0.0):
    p.add(bm_box(*size, bevel=bevel), m, T @ M(loc, rot))


def C(p, T, r1, h, loc, m, r2=None, segs=8, rot=(0, 0, 0), scale=1):
    p.add(bm_cyl(r1, r1 if r2 is None else r2, h, segs), m, T @ M(loc, rot, scale))


def ball(p, T, r, loc, m, scale=1, sub=0, rot=(0, 0, 0), jit=0.0, seed=0):
    bm = bm_ico(r, sub)
    if jit:
        jitter(bm, jit, seed)
    p.add(bm, m, T @ M(loc, rot, scale), smooth=sub > 0)


def beam(p, a, b, w, m, h=None, T=None):
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((1, 0, 0)).rotation_difference(d)
    mtx = Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4()
    p.add(bm_box(d.length, w, h or w), m, (T or Matrix()) @ mtx)


def sag_pts(a, b, sag, n):
    a, b = Vector(a), Vector(b)
    return [a + (b - a) * (i / n) - Vector((0, 0, sag * 4 * (i / n) * (1 - i / n))) for i in range(n + 1)]


def rrect(hx, hy, r, n=4, jit=0.0, rnd=None):
    pts = []
    for cx, cy, a0 in ((hx - r, -(hy - r), -90), (hx - r, hy - r, 0), (-(hx - r), hy - r, 90), (-(hx - r), -(hy - r), 180)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n)
            rr = r + (rnd.uniform(-jit, jit) if jit else 0)
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def in_rrect(x, y, hx, hy, r):
    qx, qy = abs(x) - (hx - r), abs(y) - (hy - r)
    if qx <= 0 or qy <= 0:
        return abs(x) <= hx and abs(y) <= hy
    return math.hypot(qx, qy) <= r


def in_plot(x, y):
    """Inside a stall's footprint (left as packed gravel: the stall plots)."""
    for st in STALLS:
        q = frame(st).inverted() @ Vector((x, y, 0))
        if abs(q.x) < st["W"] / 2 - 0.2 and abs(q.y) < st["D"] / 2 - 0.1:
            return True
    return False


def cobble(p, x, y, w, d, h, rz, m, rnd, z0=0.04, inset=0.035):
    """Truncated pyramid (no bottom): 10 triangles."""
    bm = bmesh.new()
    lo = [bm.verts.new((sx * w / 2, sy * d / 2, z0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    hi = [bm.verts.new((sx * (w / 2 - inset), sy * (d / 2 - inset), z0 + h + rnd.uniform(-0.012, 0.012)))
          for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    bm.faces.new(hi)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    p.add(bm, m, M((x, y, 0), (0, 0, rz)))


def crate(p, T, x, y, z, w, d, h, rz=0.0, m="wood_light", m2="wood_mid"):
    """Open slatted crate; returns its frame (base centre)."""
    F = T @ M((x, y, z), (0, 0, rz))
    B(p, F, (w, d, 0.03), (0, 0, 0.015), m2)
    for k, (z0, hh) in enumerate(((0.02, h * 0.42), (h * 0.52, h * 0.48))):
        for sy in (-1, 1):
            B(p, F, (w, 0.03, hh), (0, sy * (d / 2 - 0.015), z0 + hh / 2), m if k else m2)
        for sx in (-1, 1):
            B(p, F, (0.03, d - 0.06, hh), (sx * (w / 2 - 0.015), 0, z0 + hh / 2), m if k else m2)
    return F


def heap(p, F, w, d, z, n, r, mats, rnd, scale=1, sub=0, mound=0.05):
    for i in range(n):
        u, v = rnd.uniform(-1, 1), rnd.uniform(-1, 1)
        zz = z + mound * (1 - max(abs(u), abs(v))) + rnd.uniform(0, r * 0.4)
        ball(p, F, r * rnd.uniform(0.85, 1.1), (u * (w / 2 - r), v * (d / 2 - r), zz), rnd.choice(mats),
             scale=scale, sub=sub, rot=(0, 0, rnd.uniform(0, 90)))


def basket(p, T, x, y, z, r, h, rz=0.0, fill=None, rnd=None, n=7, fr=0.07):
    F = T @ M((x, y, z), (0, 0, rz))
    C(p, F, r * 0.78, h, (0, 0, 0), "straw_dark", r2=r, segs=10)
    C(p, F, r + 0.02, 0.04, (0, 0, h - 0.03), "straw", segs=10)
    if fill:
        heap(p, F, r * 1.3, r * 1.3, h - 0.05, n, fr, fill, rnd, mound=0.03)
    return F


def sack(p, T, x, y, z, rz=0.0, s=1.0, lying=False, open_top=False):
    F = T @ M((x, y, z), (0 if not lying else 90, 0, rz), s)
    bm = jitter(bm_box(0.4, 0.3, 0.46, bevel=0.08), 0.015, int(x * 100 + y * 10) % 97)
    p.add(bm, "sack", F @ M((0, 0, 0.23)))
    if open_top:
        C(p, F, 0.15, 0.05, (0, 0, 0.42), "flour", segs=8, scale=(1.2, 1, 1))
    else:
        C(p, F, 0.06, 0.1, (0, 0, 0.44), "sack", r2=0.04, segs=5)
        ball(p, F, 0.07, (0, 0, 0.56), "sack", scale=(1, 1, 0.7))


def barrel(p, T, x, y, z=COB, h=0.82, r=0.3, lid=True, m="wood"):
    F = T @ M((x, y, z))
    prof = [(r * 0.84, 0), (r * 0.97, h * 0.25), (r, h * 0.5), (r * 0.97, h * 0.75), (r * 0.84, h)]
    p.add(bm_lathe(prof, 9), m, F)
    for zz, rr in ((0.12, 0.9), (0.88, 0.9)):
        C(p, F, r * rr + 0.016, 0.06, (0, 0, zz * h - 0.03), "iron", segs=9)
    if lid:
        C(p, F, r * 0.8, 0.02, (0, 0, h - 0.005), "wood_mid", segs=9)
    return F


def pot(p, T, x, y, z, s=1.0, m="clay"):
    prof = [(0.07, 0), (0.14, 0.11), (0.1, 0.22), (0.06, 0.26), (0.075, 0.3)]
    p.add(bm_lathe([(a * s, b * s) for a, b in prof], 8, cap_top=False), m, T @ M((x, y, z)))


def fish(p, T, loc, rz=0.0, s=1.0, rot=None):
    F = T @ M(loc, rot or (0, 0, rz), s)
    p.add(bm_ico(1.0, 0), "fish", F @ M((0, 0, 0), (0, 0, 0), (0.15, 0.06, 0.035)))
    p.add(bm_prism([(-0.13, 0), (-0.22, 0.05), (-0.22, -0.05)], 0.015), "stone_mid", F @ M((0, 0, 0), (90, 0, 0)))


def gable_roof(p, x0, x1, ridge_z, eave_y, eave_z, rows, mats, rnd, thick=0.06):
    """Shingled gable with the ridge along X at y=0."""
    ang = math.atan2(ridge_z - eave_z, eave_y)
    L = math.hypot(eave_y, ridge_z - eave_z)
    for side in (-1, 1):
        rot = (math.degrees(ang) * side, 0, 0)
        for k in range(rows):
            u0 = L * k / rows
            seg = L / rows + 0.08
            uc = u0 + seg / 2 - 0.04
            y = side * uc * math.cos(ang)
            z = ridge_z - uc * math.sin(ang) + 0.03 * (rows - k)
            n = max(2, int((x1 - x0) / 0.42))
            for i in range(n):
                xa = x0 + (x1 - x0) * i / n
                xb = x0 + (x1 - x0) * (i + 1) / n
                p.box((xb - xa - 0.02, seg, thick), ((xa + xb) / 2 + (0.1 if k % 2 else 0) * 0, y, z),
                      rnd.choice(mats), rot=(rot[0] + rnd.uniform(-2, 2), 0, rnd.uniform(-1.5, 1.5)))
    p.box((x1 - x0 + 0.1, 0.16, 0.12), ((x0 + x1) / 2, 0, ridge_z + 0.04), "wood_dark")


def striped_sheet(p, T, W, prof, mats, nst, th=0.025):
    """A thin striped cloth: prof is [(y, z), ...] along the slope; stripes run along it."""
    for i in range(nst):
        x0, x1 = -W / 2 + W * i / nst, -W / 2 + W * (i + 1) / nst
        bm = bmesh.new()
        top = [(bm.verts.new((x0, y, z)), bm.verts.new((x1, y, z))) for y, z in prof]
        bot = [(bm.verts.new((x0, y, z - th)), bm.verts.new((x1, y, z - th))) for y, z in prof]
        for k in range(len(prof) - 1):
            bm.faces.new((top[k][0], top[k][1], top[k + 1][1], top[k + 1][0]))
            bm.faces.new((bot[k][0], bot[k + 1][0], bot[k + 1][1], bot[k][1]))
            bm.faces.new((top[k][0], top[k + 1][0], bot[k + 1][0], bot[k][0]))
            bm.faces.new((top[k][1], bot[k][1], bot[k + 1][1], top[k + 1][1]))
        bm.faces.new((top[0][0], bot[0][0], bot[0][1], top[0][1]))
        bm.faces.new((top[-1][0], top[-1][1], bot[-1][1], bot[-1][0]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        p.add(bm, mats[i % 2], T)


def bunting(name, a, b, sag, rnd, cols, spacing=0.46):
    """One string of pennants from anchor a to b; its own object (origin at a)."""
    s = Part(name)
    n = max(4, int((Vector(b) - Vector(a)).length / 0.8))
    pts = sag_pts(a, b, sag, n)
    s.add(bm_tube([tuple(q) for q in pts], 0.013, segs=3, cap=False), "wood_dark")
    L = sum((pts[i + 1] - pts[i]).length for i in range(n))
    nf = int(L / spacing)
    dx, dy = b[0] - a[0], b[1] - a[1]
    rz = math.degrees(math.atan2(dy, dx))
    for i in range(1, nf):
        t = i / nf
        q = Vector(a) + (Vector(b) - Vector(a)) * t - Vector((0, 0, sag * 4 * t * (1 - t)))
        s.add(bm_prism([(-0.11, 0), (0.11, 0), (0, -0.24)], 0.012), cols[i % len(cols)],
              M((q.x, q.y, q.z - 0.005), (rnd.uniform(-4, 4), 0, rz)))
    return s, tuple(a)


def lantern_bracket(p, T, x, y, z, out):
    """Iron arm from a post at (x, y, z) reaching `out` (local x/y offset), with a hanging lantern."""
    ox, oy = out
    beam(p, (x, y, z), (x + ox, y + oy, z), 0.035, "iron", T=T)
    beam(p, (x, y, z - 0.25), (x + ox * 0.55, y + oy * 0.55, z - 0.02), 0.025, "iron", T=T)
    w = T @ Vector((x + ox * 0.9, y + oy * 0.9, z - 0.62))
    B(p, T, (0.02, 0.02, 0.1), (x + ox * 0.9, y + oy * 0.9, z - 0.06), "iron")
    add_lantern(p, tuple(w), s=0.95, hang=True)


# ------------------------------------------------------------------ stages

def stage_01(p, rnd, extra):
    """Cleared dirt patch with a dirt apron at the entrance, low pegs and string along the line of
    the future kerb, flagged corner stakes, a ring of pebbles round the old well shaft, and the plan."""
    p.add(bm_slab(rrect(7.25, 6.25, 1.3, n=5, jit=0.12, rnd=rnd), 0.03), "dirt")
    p.add(bm_slab(rrect(1.8, 0.65, 0.45, n=3, jit=0.08, rnd=rnd), 0.022), "dirt", M((0, -6.35, 0)))
    # string at kerb height along the kerb line (the kerb stones swallow pegs and string later)
    pegs = rrect(HX + 0.22, HY + 0.22, 1.05, n=2)
    for x, y in pegs:
        p.box((0.06, 0.06, 0.15), (x, y, 0.075), "wood_light")
    for (x0, y0), (x1, y1) in zip(pegs, pegs[1:] + pegs[:1]):
        L = math.hypot(x1 - x0, y1 - y0)
        p.box((L, 0.022, 0.022), ((x0 + x1) / 2, (y0 + y1) / 2, 0.11), "white",
              rot=(0, 0, math.degrees(math.atan2(y1 - y0, x1 - x0))))
    # tall flagged stakes where the bunting poles will stand (the poles hide them)
    for x, y in POLES.values():
        p.box((0.07, 0.07, 0.5), (x, y, 0.25), "wood_light")
        p.cyl(0.05, 0.08, (x, y, 0.5), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        p.add(bm_prism([(0, 0), (0.26, -0.06), (0, -0.13)], 0.015), "cloth", M((x + 0.035, y, 0.56)))
    # the old well: a ring of pebbles round a dark hollow, with a peg in the middle
    p.cyl(0.62, 0.012, (0, 0, 0.03), "soil_dark", segs=14)
    for i in range(14):
        a = TAU * i / 14 + rnd.uniform(-0.08, 0.08)
        p.add(jitter(bm_ico(rnd.uniform(0.08, 0.11), 0), 0.02, i), rnd.choice(["stone", "stone_light", "stone_mid"]),
              M((0.78 * math.cos(a), 0.78 * math.sin(a), 0.03), scale=(1.2, 1, 0.5)))
    p.box((0.08, 0.08, 0.28), (0.0, 0.0, 0.14), "wood_mid", bevel=0.01)
    # the plan on the entrance apron: square, ring and five little stalls, held down by pebbles
    px, py, pr = -0.95, -6.45, -5
    p.box((0.7, 0.5, 0.012), (px, py, 0.03), "white", rot=(0, 0, pr))
    base = M((px, py, 0.037), (0, 0, pr))
    for dx, dy, w, d in ((0, 0.19, 0.5, 0.012), (0, -0.19, 0.5, 0.012), (0.25, 0, 0.012, 0.38), (-0.25, 0, 0.012, 0.38)):
        p.add(bm_box(w, d, 0.004), "tunic", base @ M((dx, dy, 0)))
    p.add(bm_cyl(0.05, 0.05, 0.004, 8), "tunic", base)
    for dx, dy in ((-0.15, 0.13), (0, 0.13), (0.15, 0.13), (-0.19, 0), (0.19, 0)):
        p.add(bm_box(0.08, 0.04, 0.004), "cloth", base @ M((dx, dy, 0.001)))
    for i, (dx, dy) in enumerate(((-0.3, -0.2), (0.29, 0.22))):
        p.add(jitter(bm_ico(0.055, 0), 0.015, 40 + i), "stone_mid", M((px + dx, py + dy, 0.06)))
    # mallet and a bundle of spare stakes
    p.cyl(0.028, 0.5, (0.55, -6.2, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.15, 0.24, 0.15), (1.0, -6.43, 0.085), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.55, 0.06, 0.06), (1.0, -6.75 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 8))
    p.box((0.03, 0.32, 0.09), (1.0, -6.65, 0.06), "white", rot=(0, 0, 8))
    for i in range(8):                       # loose pebbles (sink into the gravel later)
        a, d = rnd.uniform(0, TAU), rnd.uniform(1.6, 5.0)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.11), 0), 0.02, i), "stone_light",
              M((d * math.cos(a) * 1.15, d * math.sin(a), 0.0), scale=(1.2, 1, 0.5)))


def kerb_ring(p, rnd, hx, hy, r, w, h, length):
    pts = rrect(hx, hy, r, n=6)
    segs = list(zip(pts, pts[1:] + pts[:1]))
    lens = [math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in segs]
    total = sum(lens)
    n = int(total / length)
    cols = ["stone", "stone_mid", "stone_light", "stone", "stone_warm"]
    for k in range(n):
        s = (k + 0.5) * total / n
        for (a, b), L in zip(segs, lens):
            if s <= L:
                break
            s -= L
        t = s / L
        x, y = a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t
        rz = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
        bm = jitter(bm_box(total / n - 0.04, w, h), 0.015, k)
        p.add(bm, rnd.choice(cols), M((x, y, h / 2 - 0.01), (0, 0, rz + rnd.uniform(-2, 2))))


def stage_02(p, rnd, extra):
    """A raked gravel bed and a stone kerb all around the square; a crate of cobbles waiting."""
    p.add(bm_slab(rrect(HX + 0.05, HY + 0.05, 0.85, n=5), 0.045), "stone_warm")
    kerb_ring(p, rnd, HX + 0.22, HY + 0.22, 1.05, 0.32, 0.17, 0.7)
    for i in range(7):                       # rake lines in the gravel
        p.box((rnd.uniform(1.6, 2.6), 0.03, 0.01), (rnd.uniform(-4, 4), rnd.uniform(-4.5, 4.5), 0.05), "stone_mid",
              rot=(0, 0, rnd.uniform(-6, 6)))
    F = crate(p, Matrix(), 5.5, -4.6, 0.045, 0.62, 0.48, 0.32, rz=12)
    heap(p, F, 0.6, 0.46, 0.22, 9, 0.11, ["stone", "stone_light", "stone_mid"], rnd, scale=(1.2, 1, 0.7))
    for i in range(3):
        p.add(jitter(bm_box(0.24, 0.18, 0.1), 0.02, i), "stone", M((5.0 - 0.25 * i, -4.25 + 0.1 * i, 0.1), (0, 0, 20 * i)))


def stage_03(p, rnd, extra):
    """Cobbles: staggered rows across the square, two rings of wedge stones round the centre,
    and the old shaft opening uncovered in the middle."""
    p.add(bm_slab(rrect(HX, HY, 0.8, n=5), 0.065), "stone_mid")
    cols = ["stone", "stone", "stone_light", "stone_mid", "stone_warm", "stone_light"]
    y = -HY + 0.25
    row = 0
    while y < HY - 0.2:
        d = 0.52
        x = -HX + (0.0 if row % 2 else 0.36)
        while x < HX:
            w = rnd.uniform(0.62, 0.82)
            cx, cy = x + w / 2, y + rnd.uniform(-0.02, 0.02)
            if in_rrect(cx, cy, HX - 0.28, HY - 0.25, 0.6) and math.hypot(cx, cy) > 1.62 and not in_plot(cx, cy):
                cobble(p, cx, cy, w - 0.06, d - 0.06, 0.055, rnd.uniform(-3, 3), rnd.choice(cols), rnd)
            x += w
        y += d
        row += 1
    for r0, r1, n in ((0.98, 1.27, 14), (1.29, 1.6, 18)):
        for i in range(n):
            a = TAU * (i + 0.5 * (n == 18)) / n
            rm = (r0 + r1) / 2
            arc = TAU * rm / n
            cobble(p, rm * math.cos(a), rm * math.sin(a), r1 - r0 - 0.04, arc - 0.05, 0.06,
                   math.degrees(a), rnd.choice(cols), rnd)
    p.cyl(0.97, 0.03, (0, 0, 0.065), "stone_light", segs=16)
    p.cyl(0.62, 0.012, (0, 0, 0.094), "ink", segs=14)


WELL_RIN, WELL_ROUT, RIM_Z = 0.62, 0.98, 0.66


def stage_04(p, rnd, extra):
    """The well rebuilt: three courses of stone round the old shaft, a capped rim, water,
    and the old keystone with a carved rune facing the front."""
    cols = ["stone", "stone_mid", "stone_light", "stone_warm"]
    nb = 12
    zc = [0.095, 0.29, 0.47]
    for c in range(3):
        z0, z1 = zc[c], (zc[c + 1] if c < 2 else RIM_Z)
        for i in range(nb):
            a = TAU * (i + 0.5 * (c % 2)) / nb - math.pi / 2
            rm = (WELL_RIN + WELL_ROUT) / 2
            arc = TAU * rm / nb
            key = c == 1 and i == 0
            bm = bm_box(arc * 0.97 + 0.04, WELL_ROUT - WELL_RIN, z1 - z0 - 0.025, bevel=0.025 if key else 0.0)
            if not key:
                jitter(bm, 0.012, c * 20 + i)
            p.add(bm, "stone_light" if key else rnd.choice(cols),
                  M((rm * math.cos(a), rm * math.sin(a), (z0 + z1) / 2), (0, 0, math.degrees(a) + 90)))
    prof = [(WELL_RIN - 0.02, RIM_Z), (WELL_ROUT + 0.05, RIM_Z), (WELL_ROUT + 0.07, RIM_Z + 0.06),
            (WELL_ROUT + 0.03, RIM_Z + 0.11), (WELL_RIN, RIM_Z + 0.11), (WELL_RIN - 0.03, RIM_Z + 0.05),
            (WELL_RIN - 0.02, RIM_Z)]
    p.add(bm_lathe(prof, 16, cap_bottom=False, cap_top=False), "stone_light")
    p.cyl(WELL_RIN + 0.02, 0.02, (0, 0, 0.32), "water", segs=14)
    # the keystone rune (front, -Y): a branching mark like the one on Pip's stone
    ky = -(WELL_ROUT + 0.005)
    zm = (zc[1] + zc[2]) / 2
    p.box((0.03, 0.03, 0.12), (0, ky, zm), "glow")
    for s in (-1, 1):
        p.box((0.025, 0.03, 0.08), (s * 0.03, ky, zm + 0.045), "glow", rot=(0, s * 40, 0))
    p.box((0.08, 0.03, 0.022), (0, ky, zm - 0.045), "glow")
    # a bucket waiting on the rim and a coil of rope
    F = M((0.55, -0.62, RIM_Z + 0.11), (0, 0, 30))
    C(p, F, 0.13, 0.22, (0, 0, 0), "wood_mid", r2=0.16, segs=8)
    for zz in (0.04, 0.17):
        C(p, F, 0.14 + zz * 0.13, 0.03, (0, 0, zz), "iron", segs=8)
    C(p, F, 0.15, 0.012, (0, 0, 0.17), "water", segs=8)
    for k in range(3):
        p.cyl(0.17 - 0.01 * k, 0.035, (-0.95, -0.95, COB + 0.035 * k), "straw_dark", segs=10)


WIND_Z = 1.58


def stage_05(p, rnd, extra):
    """Well roof: two posts on the rim, a windlass with a crank, a shingled gable roof, and
    the bucket hanging on its rope (`bucket`, pivot at the windlass)."""
    for s in (-1, 1):
        x = s * 0.86
        p.box((0.15, 0.15, 2.36 - RIM_Z), (x, 0, (RIM_Z + 2.36) / 2), "wood", bevel=0.02)
        for sy in (-1, 1):
            beam(p, (x, sy * 0.06, 1.95), (x, sy * 0.55, 2.3), 0.07, "wood_mid")
        p.box((0.24, 0.24, 0.08), (x, 0, RIM_Z + 0.15), "wood_dark")
    p.box((2.0, 0.14, 0.14), (0, 0, 2.38), "wood_mid")
    p.cyl(0.085, 1.62, (-0.81, 0, WIND_Z), "wood_light", segs=8, rot=(0, 90, 0))
    p.cyl(0.11, 0.3, (-0.15, 0, WIND_Z), "straw_dark", segs=8, rot=(0, 90, 0))   # rope wound on the drum
    p.box((0.06, 0.06, 0.34), (0.96, 0, WIND_Z - 0.14), "iron")
    p.cyl(0.03, 0.22, (0.96, 0, WIND_Z - 0.3), "wood_dark", segs=6, rot=(0, 90, 0))
    gable_roof(p, -1.2, 1.2, RIDGE, 0.98, 2.25, 3, ["shingle", "shingle_dark", "shingle_light", "shingle"], rnd)
    for s in (-1, 1):
        p.add(bm_prism([(-0.95, 2.28), (0.95, 2.28), (0, RIDGE - 0.02)], 0.06), "wood_mid", M((s * 1.05, 0, 0), (0, 0, 90)))
        p.cyl(0.06, 0.12, (s * 1.27, 0, RIDGE), "wood_dark", segs=6)
        p.ball(0.07, (s * 1.27, 0, RIDGE + 0.14), "wood_dark", subdiv=1)
    # hanging bucket: rope from the drum down, its own object for a gentle swing
    b = Part("bucket")
    top = (0.0, 0.0, WIND_Z - 0.09)
    b.box((0.022, 0.022, 0.62), (0, 0, WIND_Z - 0.09 - 0.31), "straw_dark")
    zb = WIND_Z - 0.09 - 0.62 - 0.24
    b.cyl(0.13, 0.24, (0, 0, zb), "wood_mid", r2=0.16, segs=8)
    for zz in (0.04, 0.18):
        b.cyl(0.14 + zz * 0.13, 0.03, (0, 0, zb + zz), "iron", segs=8)
    b.add(bm_tube([(-0.16, 0, zb + 0.22), (-0.1, 0, zb + 0.34), (0, 0, zb + 0.38), (0.1, 0, zb + 0.34), (0.16, 0, zb + 0.22)],
                  0.012, segs=4), "iron")
    extra.append((b, top))


def stall_frame(p, st, rnd):
    T = frame(st)
    W, D = st["W"], st["D"]
    px, py = W / 2 - 0.08, D / 2 - 0.08
    for sx in (-1, 1):
        B(p, T, (0.13, 0.13, FH - COB + 0.05), (sx * px, -py, (COB + FH) / 2), "wood")
        B(p, T, (0.13, 0.13, BH - COB + 0.05), (sx * px, py, (COB + BH) / 2), "wood")
        beam(p, (sx * px, -py, FH - 0.04), (sx * px, py, BH - 0.04), 0.1, "wood_mid", T=T)
        B(p, T, (0.22, 0.22, 0.06), (sx * px, -py, COB + 0.03), "stone_dark")
        B(p, T, (0.22, 0.22, 0.06), (sx * px, py, COB + 0.03), "stone_dark")
    B(p, T, (W + 0.06, 0.12, 0.12), (0, -py, FH - 0.03), "wood_mid")
    B(p, T, (W + 0.06, 0.12, 0.12), (0, py, BH - 0.03), "wood_mid")
    # counter: plank front, side boards, overhanging top
    n = int(W / 0.3)
    for i in range(n):
        x = -(W - 0.26) / 2 + (W - 0.26) * (i + 0.5) / n
        B(p, T, ((W - 0.26) / n - 0.012, 0.06, 0.82), (x, -D / 2 + 0.2, COB + 0.43), rnd.choice(["wood", "wood_light", "wood"]))
    for sx in (-1, 1):
        B(p, T, (0.06, 0.6, 0.82), (sx * (W / 2 - 0.16), -D / 2 + 0.47, COB + 0.43), "wood_mid")
    B(p, T, (W - 0.08, 0.68, 0.07), (0, -D / 2 + 0.46, COB + 0.875), "wood_light")
    # back shelf on brackets and a low rail
    B(p, T, (W - 0.3, 0.34, 0.05), (0, D / 2 - 0.22, COB + 1.28), "wood_light")
    for sx in (-1, 1):
        beam(p, (sx * (W / 2 - 0.35), D / 2 - 0.1, COB + 1.05), (sx * (W / 2 - 0.35), D / 2 - 0.36, COB + 1.25), 0.05, "wood_mid", T=T)
        B(p, T, (0.06, 0.06, 1.25), (sx * (W / 2 - 0.35), D / 2 - 0.1, COB + 0.62), "wood_mid")
    B(p, T, (W - 0.1, 0.06, 0.08), (0, D / 2 - 0.1, COB + 0.7), "wood_mid")


def stage_06(p, rnd, extra):
    """Five bare stall frames: posts, roof beams, plank counters and back shelves; a sawhorse
    and a stack of spare planks out front."""
    for st in STALLS:
        stall_frame(p, st, rnd)
    T = M((2.6, -3.7, 0), (0, 0, 15))
    B(p, T, (1.0, 0.1, 0.1), (0, 0, COB + 0.62), "wood_light")
    for sx in (-1, 1):
        for sy in (-1, 1):
            beam(p, (sx * 0.38, 0, COB + 0.6), (sx * 0.45, sy * 0.25, COB), 0.06, "wood_mid", T=T)
    B(p, T, (1.6, 0.22, 0.04), (0.2, 0, COB + 0.69), "wood", rot=(0, 0, 4))
    for i in range(5):
        B(p, T, (1.9, 0.22, 0.05), (0.1, 0.65 + 0.012 * i, COB + 0.03 + 0.05 * i), rnd.choice(["wood", "wood_light"]),
          rot=(0, 0, rnd.uniform(-3, 3)))


def stage_07(p, rnd, extra):
    """Striped cloth roofs on every stall; the front flaps with their scalloped valances are
    separate meshes `awning_01..05` (pivot on the front beam, they sway)."""
    for idx, st in enumerate(STALLS, 1):
        T = frame(st)
        W, D = st["W"], st["D"]
        nst = max(6, int(round(W / 0.42)))
        if nst % 2:
            nst += 1
        y0, y1 = D / 2 + 0.08, -D / 2 + 0.02
        prof = [(y0 + (y1 - y0) * t, BH + 0.08 + (FH - BH) * t - 0.06 * math.sin(math.pi * t)) for t in (0, 0.5, 1)]
        striped_sheet(p, T, W + 0.14, prof, st["stripe"], nst)
        # the swaying front flap: from the front beam out and down, then a scalloped valance
        hinge = Vector((0, -D / 2 + 0.02, FH + 0.08))
        a = Part("awning_%02d" % idx)
        fl = [(hinge.y - 0.62 * t, hinge.z - 0.3 * t - 0.03 * math.sin(math.pi * t)) for t in (0, 0.5, 1)]
        striped_sheet(a, T, W + 0.14, fl, st["stripe"], nst)
        ty, tz = fl[-1]
        Wv = W + 0.14
        for i in range(nst):
            x0, x1 = -Wv / 2 + Wv * i / nst, -Wv / 2 + Wv * (i + 1) / nst
            a.add(bm_prism([(x0, 0), (x1, 0), (x1, -0.16), ((x0 + x1) / 2, -0.25), (x0, -0.16)], 0.022),
                  st["stripe"][i % 2], T @ M((0, ty + 0.005, tz - 0.01)))
        a.add(bm_box(Wv + 0.02, 0.05, 0.035), "wood_dark", T @ M((0, ty, tz - 0.01)))
        extra.append((a, tuple(T @ hinge)))


def counter_z(st):
    return COB + 0.91


def stage_08(p, rnd, extra):
    """The village's own goods: the produce stall (apples, cabbages, carrots, pumpkins, a basket of
    potatoes, onions hanging) and the bread and flour stall (loaves, buns, Wren's flour sacks, a sheaf)."""
    st = STALLS[0]
    T, W, D, cz = frame(st), st["W"], st["D"], counter_z(st)
    cy = -D / 2 + 0.44
    for x, fill, r, mats, sub, sc in ((-0.8, 8, 0.07, ["apple", "apple", "cloth"], 0, 1),
                                       (0.0, 6, 0.11, ["grass_light", "grass"], 0, (1, 1, 0.85)),
                                       (0.8, 10, 0.055, ["carrot", "carrot", "pumpkin"], 0, (1.6, 0.7, 0.7))):
        F = crate(p, T, x, cy, cz, 0.62, 0.46, 0.17, rz=rnd.uniform(-5, 5))
        heap(p, F, 0.6, 0.44, 0.12, fill, r, mats, rnd, scale=sc, sub=sub)
    for x, y, s in ((-0.7, -D / 2 - 0.25, 1.0), (-0.3, -D / 2 - 0.3, 0.8), (0.9, -D / 2 - 0.28, 0.9)):
        ball(p, T, 0.2 * s, (x, y, COB + 0.14 * s), "pumpkin", scale=(1.15, 1.15, 0.75), jit=0.02, seed=int(x * 10))
        C(p, T, 0.025, 0.08, (x, y, COB + 0.27 * s), "grass_dark", segs=5)
    basket(p, T, -W / 2 - 0.32, -D / 2 + 0.25, COB, 0.24, 0.3, fill=["dirt", "bread_dark", "dirt"], rnd=rnd, n=8, fr=0.07)
    basket(p, T, -W / 2 - 0.3, -D / 2 + 0.8, COB, 0.2, 0.26, fill=["apple", "cloth"], rnd=rnd, n=6, fr=0.06)
    for i in range(4):                       # onion strings hanging from the back beam
        x = -W / 2 + 0.45 + i * (W - 0.9) / 3
        B(p, T, (0.015, 0.015, 0.5), (x, D / 2 - 0.08, BH - 0.3), "straw_dark")
        for k in range(3):
            ball(p, T, 0.055, (x + rnd.uniform(-0.03, 0.03), D / 2 - 0.1, BH - 0.25 - 0.12 * k), "petal_yellow", scale=(1, 1, 1.1))
    for i in range(3):
        basket(p, T, -0.75 + 0.75 * i, D / 2 - 0.22, COB + 1.305, 0.14, 0.12, fill=[["apple"], ["carrot"], ["grass_light"]][i],
               rnd=rnd, n=3, fr=0.06)

    st = STALLS[4]
    T, W, D, cz = frame(st), st["W"], st["D"], counter_z(st)
    for i in range(5):                       # loaves on a board
        x = -0.95 + 0.22 * i
        ball(p, T, 0.12, (x - 0.02, cy + rnd.uniform(-0.06, 0.06), cz + 0.08), "bread", scale=(0.75, 1.5, 0.6))
    B(p, T, (1.15, 0.45, 0.03), (-0.55, cy, cz + 0.015), "wood_mid")
    F = basket(p, T, 0.35, cy, cz, 0.22, 0.13, fill=["bread", "bread_dark"], rnd=rnd, n=8, fr=0.07)
    sack(p, T, 0.95, cy - 0.02, cz, rz=10, s=0.75, open_top=True)
    for i, (x, y, z, rz) in enumerate(((W / 2 + 0.3, -0.2, COB, 10), (W / 2 + 0.32, 0.25, COB, -15), (W / 2 + 0.3, 0.02, COB + 0.42, 80))):
        sack(p, T, x, y, z, rz=rz)
    for k in range(4):                       # loaves on the back shelf
        ball(p, T, 0.1, (-0.8 + 0.5 * k, D / 2 - 0.22, COB + 1.36), "bread_dark" if k % 2 else "bread", scale=(1.5, 0.8, 0.6))
    sh = T @ M((-W / 2 - 0.25, -D / 2 + 0.2, COB), (8, 0, 0))   # a wheat sheaf leaning on the post
    for k in range(7):
        a = TAU * k / 7
        p.add(bm_cyl(0.018, 0.018, 0.9, 4), "straw_dark", sh @ M((0.05 * math.cos(a), 0.05 * math.sin(a), 0), (math.cos(a) * 6, math.sin(a) * 6, 0)))
        p.add(bm_cyl(0.04, 0.0, 0.22, 4), "wheat_light", sh @ M((0.09 * math.cos(a), 0.09 * math.sin(a), 0.85), (math.cos(a) * 18, math.sin(a) * 18, 0)))
    p.add(bm_cyl(0.075, 0.075, 0.05, 8), "cloth", sh @ M((0, 0, 0.45)))


def stage_09(p, rnd, extra):
    """Marlo's fish stall (fish on beds of ice, a few hung from the beam, a barrel, a coiled net)
    and the cloth and pottery stall (folded cloth, bolts, jugs on the shelf, big pots, a rolled rug)."""
    st = STALLS[3]
    T, W, D, cz = frame(st), st["W"], st["D"], counter_z(st)
    cy = -D / 2 + 0.44
    for x in (-0.6, 0.45):
        F = crate(p, T, x, cy, cz, 0.85, 0.5, 0.14, m="wood", m2="wood_mid")
        B(p, F, (0.79, 0.44, 0.06), (0, 0, 0.08), "white")
        for k in range(5):
            fish(p, F, (-0.3 + 0.15 * k, rnd.uniform(-0.06, 0.06), 0.13), rz=90 + rnd.uniform(-12, 12), s=0.95)
    for i in range(3):
        x = -0.75 + 0.6 * i
        B(p, T, (0.012, 0.012, 0.3), (x, -D / 2 + 0.07, FH - 0.2), "straw_dark")
        fish(p, T, (x, -D / 2 + 0.07, FH - 0.5), rot=(0, 90, 90), s=1.2)
    barrel(p, T, W / 2 + 0.32, -D / 2 + 0.3, h=0.7, r=0.26)
    for k in range(5):                       # coiled net with floats
        C(p, T, 0.3 - 0.03 * k, 0.035, (W / 2 + 0.3, D / 2 - 0.15, COB + 0.035 * k), "stone_mid" if k % 2 else "sack", segs=10)
    for k in range(3):
        ball(p, T, 0.06, (W / 2 + 0.1 + 0.2 * k, D / 2 - 0.42, COB + 0.06), "cloth")
    ball(p, T, 0.08, (-0.9, D / 2 - 0.22, COB + 1.38), "fish", scale=(1.8, 0.6, 0.6))

    st = STALLS[2]
    T, W, D, cz = frame(st), st["W"], st["D"], counter_z(st)
    cols = ["cloth", "teal", "mustard", "rose", "canvas", "plum", "shutter"]
    for i, x in enumerate((-0.85, -0.42, 0.0)):
        for k in range(3 - i % 2):
            B(p, T, (0.36, 0.3, 0.07), (x, cy + rnd.uniform(-0.03, 0.03), cz + 0.035 + 0.07 * k), cols[(i * 3 + k) % 7],
              rot=(0, 0, rnd.uniform(-6, 6)))
    for k, x in enumerate((0.42, 0.7)):      # bolts lying on the counter
        C(p, T, 0.08, 0.5, (x, cy - 0.25, cz + 0.08), cols[k + 3], segs=8, rot=(-90, 0, 0))
    C(p, T, 0.085, 0.75, (0.98, cy, cz), "teal", segs=8)
    for k in range(5):                       # jugs and bowls on the back shelf
        x = -1.0 + 0.5 * k
        pot(p, T, x, D / 2 - 0.22, COB + 1.305, s=0.9 + 0.2 * (k % 2), m="clay" if k % 2 else "clay_dark")
    for x, s, m in ((-0.65, 1.9, "clay"), (-0.25, 1.5, "clay_dark")):
        pot(p, T, x, -D / 2 - 0.28, COB, s=s, m=m)
    rug = T @ M((W / 2 + 0.15, -D / 2 + 0.3, COB), (0, -14, 0))
    p.add(bm_cyl(0.11, 0.11, 1.3, 8), "rose", rug)
    for zz in (0.25, 1.0):
        p.add(bm_cyl(0.115, 0.115, 0.06, 8), "mustard", rug @ M((0, 0, zz)))


def stage_10(p, rnd, extra):
    """Sable's trading stall, the grandest: a brass balance, an open chest of coins, bottles and
    trinkets, rugs over the rail, an iron-banded chest, and Sable's hanging coin sign."""
    st = STALLS[1]
    T, W, D, cz = frame(st), st["W"], st["D"], counter_z(st)
    cy = -D / 2 + 0.44
    # balance scale
    C(p, T, 0.1, 0.04, (-0.9, cy, cz), "brass", segs=8)
    C(p, T, 0.02, 0.42, (-0.9, cy, cz + 0.04), "brass", segs=6)
    B(p, T, (0.5, 0.025, 0.025), (-0.9, cy, cz + 0.45), "brass", rot=(0, 6, 0))
    for sx in (-1, 1):
        x = -0.9 + sx * 0.24
        zt = cz + 0.45 - sx * 0.025
        B(p, T, (0.008, 0.008, 0.24), (x, cy, zt - 0.12), "iron")
        C(p, T, 0.08, 0.025, (x, cy, zt - 0.25), "brass", r2=0.1, segs=8)
    ball(p, T, 0.04, (-0.66, cy, cz + 0.24), "apple")
    # open chest of coins
    F = T @ M((-0.2, cy, cz), (0, 0, -6))
    B(p, F, (0.5, 0.34, 0.2), (0, 0, 0.1), "wood_mid", bevel=0.015)
    for x in (-0.18, 0.18):
        B(p, F, (0.04, 0.35, 0.21), (x, 0, 0.1), "iron")
    B(p, F, (0.46, 0.3, 0.02), (0, 0, 0.19), "brass")
    for k in range(9):
        C(p, F, 0.03, 0.012, (rnd.uniform(-0.18, 0.18), rnd.uniform(-0.1, 0.1), 0.2 + 0.012 * (k % 3)), "brass", segs=6)
    B(p, F, (0.5, 0.04, 0.3), (0, 0.18, 0.33), "wood_mid", rot=(-14, 0, 0))
    for k in range(3):                       # stacks of coins and little boxes
        for j in range(2 + k):
            C(p, T, 0.032, 0.012, (0.25 + 0.1 * k, cy - 0.15, cz + 0.012 * j), "brass", segs=6)
    for k, (x, m) in enumerate(((0.55, "plum"), (0.85, "teal"), (1.15, "wax"))):
        B(p, T, (0.2, 0.16, 0.12), (x, cy + 0.08, cz + 0.06), m, bevel=0.02, rot=(0, 0, 10 * k))
        B(p, T, (0.21, 0.17, 0.02), (x, cy + 0.08, cz + 0.125), "brass", rot=(0, 0, 10 * k))
    for k in range(7):                       # bottles on the shelf
        x = -1.25 + 0.4 * k
        m = ["glass", "teal", "plum", "glass", "door", "glass", "wax"][k]
        C(p, T, 0.06, 0.18, (x, D / 2 - 0.22, COB + 1.305), m, segs=6)
        C(p, T, 0.022, 0.08, (x, D / 2 - 0.22, COB + 1.485), m, segs=6)
        C(p, T, 0.026, 0.03, (x, D / 2 - 0.22, COB + 1.56), "wood_mid", segs=6)
    for k, (x, a, b) in enumerate(((-0.8, "cloth", "mustard"), (0.1, "teal", "canvas"), (0.9, "plum", "rose"))):
        for j in range(5):                   # rugs folded over the back rail
            B(p, T, (0.13, 0.03, 0.75), (x - 0.26 + 0.13 * j, D / 2 - 0.06, COB + 0.42), a if j % 2 else b)
        B(p, T, (0.65, 0.06, 0.05), (x, D / 2 - 0.1, COB + 0.75), a)
    # big chest and rolled rugs on the ground
    F = T @ M((-W / 2 - 0.45, -D / 2 + 0.35, COB), (0, 0, 12))
    B(p, F, (0.72, 0.46, 0.4), (0, 0, 0.2), "wood_dark", bevel=0.02)
    C(p, F, 0.23, 0.72, (-0.36, 0, 0.4), "wood_mid", segs=8, rot=(0, 90, 0), scale=(1, 1, 1))
    for x in (-0.25, 0.25):
        B(p, F, (0.05, 0.48, 0.42), (x, 0, 0.21), "iron")
    B(p, F, (0.1, 0.03, 0.12), (0, -0.24, 0.38), "brass")
    for k, m in enumerate(("cloth", "teal")):
        R = T @ M((W / 2 + 0.2 + 0.1 * k, D / 2 - 0.25 - 0.28 * k, COB), (0, -10 - 4 * k, 0))
        p.add(bm_cyl(0.1, 0.1, 1.5 - 0.2 * k, 8), m, R)
        p.add(bm_cyl(0.105, 0.105, 0.05, 8), "mustard", R @ M((0, 0, 0.3)))
    # Sable's sign: a board with a brass coin hung from an arm on the right front post
    x0 = W / 2 - 0.08
    beam(p, (x0, -D / 2 + 0.08, FH - 0.3), (x0 + 0.62, -D / 2 + 0.08, FH - 0.3), 0.05, "iron", T=T)
    for dx in (0.2, 0.5):
        B(p, T, (0.01, 0.01, 0.14), (x0 + dx, -D / 2 + 0.08, FH - 0.38), "iron")
    B(p, T, (0.46, 0.05, 0.36), (x0 + 0.35, -D / 2 + 0.08, FH - 0.62), "wood_mid", bevel=0.02)
    C(p, T, 0.12, 0.03, (x0 + 0.35, -D / 2 + 0.04, FH - 0.62), "brass", segs=10, rot=(90, 0, 0))
    C(p, T, 0.06, 0.035, (x0 + 0.35, -D / 2 + 0.035, FH - 0.62), "wood_dark", segs=4, rot=(90, 45, 0))


NOTICE = M((-4.6, -4.25, 0), (0, 0, -12))


def stage_11(p, rnd, extra):
    """The notice post near the entrance: a stout post on a stone, a board with a little roof,
    and the first notices: market days, a lost goat, a sketch of Pip."""
    T = NOTICE
    B(p, T, (0.42, 0.42, 0.22), (0, 0, COB + 0.1), "stone_mid", bevel=0.03)
    B(p, T, (0.17, 0.17, 2.3), (0, 0, COB + 1.25), "wood", bevel=0.02)
    B(p, T, (1.15, 0.08, 0.8), (0, -0.12, COB + 1.55), "wood_mid", bevel=0.015)
    B(p, T, (1.25, 0.1, 0.07), (0, -0.12, COB + 1.12), "wood_dark")
    B(p, T, (1.25, 0.1, 0.07), (0, -0.12, COB + 1.98), "wood_dark")
    for s in (-1, 1):
        B(p, T, (1.4, 0.36, 0.05), (0, -0.12 + s * 0.15, COB + 2.12), "shingle_dark", rot=(s * 28, 0, 0))
    B(p, T, (1.45, 0.07, 0.07), (0, -0.12, COB + 2.21), "wood_dark")
    for k, (x, z, w, h, m, r) in enumerate(((-0.36, 1.72, 0.3, 0.36, "parchment", -4), (0.38, 1.76, 0.26, 0.3, "white", 5),
                                            (-0.38, 1.3, 0.28, 0.22, "sack", 3), (0.36, 1.32, 0.3, 0.24, "parchment", -3))):
        B(p, T, (w, 0.01, h), (x, -0.165, COB + z), m, rot=(0, r, 0))
        B(p, T, (0.025, 0.012, 0.025), (x, -0.172, COB + z + h / 2 - 0.04), "iron")
    for k in range(4):                       # lines of writing
        B(p, T, (0.2, 0.004, 0.012), (-0.36, -0.172, COB + 1.82 - 0.06 * k), "ink", rot=(0, -4, 0))
    ball(p, T, 0.06, (0.38, -0.172, COB + 1.78), "pip", scale=(1, 0.1, 0.8))       # Pip, drawn by a child
    B(p, T, (0.12, 0.004, 0.03), (0.38, -0.172, COB + 1.68), "pip", rot=(0, 20, 0))
    B(p, T, (0.1, 0.004, 0.08), (-0.38, -0.172, COB + 1.31), "stone_dark")         # the lost goat
    for k in range(3):
        B(p, T, (0.22, 0.004, 0.012), (0.36, -0.172, COB + 1.38 - 0.05 * k), "ink")
    C(p, T, 0.12, 0.28, (0.35, -0.35, COB), "wood_mid", r2=0.14, segs=8)          # paste pot and brush
    C(p, T, 0.015, 0.3, (0.38, -0.35, COB + 0.2), "wood_light", segs=4, rot=(0, 20, 0))


def stage_12(p, rnd, extra):
    """Bunting: four tall poles at the corners and five strings of pennants, from the back poles
    across the square and down to the well roof (`bunting_01..05`)."""
    for k, (x, y) in POLES.items():
        p.add(jitter(bm_box(0.36, 0.36, 0.25), 0.02, int(x + y)), "stone_mid", M((x, y, 0.12)))
        p.cyl(0.08, POLE_TOP + 0.15, (x, y, 0.2), "wood", r2=0.06, segs=8)
        p.ball(0.09, (x, y, POLE_TOP + 0.4), "brass", subdiv=0, smooth=False)
        p.add(bm_prism([(0, 0), (0.42, -0.08), (0, -0.2)], 0.012), "cloth", M((x + 0.05, y, POLE_TOP + 0.3)))
    cols = ["cloth", "canvas", "mustard", "shutter", "door", "plum", "rose"]
    top = {k: (x, y, POLE_TOP) for k, (x, y) in POLES.items()}
    strings = [(top["bl"], top["br"], 0.6), (top["bl"], RIDGE_ENDS[0], 0.35), (top["br"], RIDGE_ENDS[1], 0.35),
               (top["fl"], RIDGE_ENDS[0], 0.35), (top["fr"], RIDGE_ENDS[1], 0.35)]
    for i, (a, b, sag) in enumerate(strings, 1):
        rnd.shuffle(cols)
        extra.append(bunting("bunting_%02d" % i, a, b, sag, rnd, list(cols)))


def bench(p, T):
    B(p, T, (1.3, 0.34, 0.07), (0, 0, COB + 0.45), "wood_light", bevel=0.015)
    for sx in (-1, 1):
        B(p, T, (0.08, 0.3, 0.42), (sx * 0.5, 0, COB + 0.21), "wood_mid")
    B(p, T, (1.0, 0.05, 0.06), (0, 0, COB + 0.15), "wood_mid")


def stage_13(p, rnd, extra):
    """Lived in: benches by the well, a handcart of sacks, barrels and stacked crates between the
    stalls, a broom and a water trough."""
    for s in (-1, 1):
        bench(p, M((s * 1.95, -1.95, 0), (0, 0, s * 45)))
    T = M((4.6, -3.2, 0), (0, 0, 28))       # handcart
    B(p, T, (1.3, 0.8, 0.06), (0, 0, COB + 0.55), "wood")
    for sy in (-1, 1):
        B(p, T, (1.3, 0.04, 0.24), (0, sy * 0.39, COB + 0.69), "wood_light")
        p.add(bm_cyl(0.33, 0.33, 0.07, 10), "wood_mid", T @ M((0.15, sy * 0.47, COB + 0.33), (90, 0, 0)))
        p.add(bm_cyl(0.07, 0.07, 0.1, 6), "iron", T @ M((0.15, sy * 0.49, COB + 0.33), (90, 0, 0)))
        beam(p, (-0.6, sy * 0.3, COB + 0.6), (-1.35, sy * 0.25, COB + 0.15), 0.06, "wood_mid", T=T)
    B(p, T, (0.06, 0.06, 0.45), (0.55, 0, COB + 0.3), "wood_mid")
    for k, (x, y) in enumerate(((-0.25, -0.15), (0.25, 0.12))):
        sack(p, T, x, y, COB + 0.58, rz=20 * k, s=0.8)
    crate(p, T, 0.32, -0.18, COB + 0.58, 0.4, 0.34, 0.26)
    for x, y in ((-2.25, 5.0), (2.25, 5.15), (-6.0, -1.65), (6.0, 1.75)):
        barrel(p, Matrix(), x, y)
    for k, (x, y, z, rz) in enumerate(((2.3, 4.35, COB, 8), (2.3, 4.35, COB + 0.36, -10), (-6.0, 2.6, COB, 30))):
        F = crate(p, Matrix(), x, y, z, 0.55, 0.45, 0.36, rz=rz)
        if k == 1:
            heap(p, F, 0.53, 0.43, 0.3, 8, 0.07, ["apple", "petal_yellow"], rnd)
    for k in range(2):
        sack(p, Matrix(), 6.0 - 0.1 * k, -1.95 - 0.35 * k, COB, rz=40 * k)
    F = M((-5.9, -3.3, 0), (0, 0, 90))      # water trough by the fish stall
    B(p, F, (1.0, 0.45, 0.4), (0, 0, COB + 0.2), "wood_mid", bevel=0.02)
    B(p, F, (0.9, 0.35, 0.02), (0, 0, COB + 0.34), "water")
    beam(p, (-5.95, -2.4, COB + 0.05), (-5.75, -2.5, COB + 1.3), 0.035, "wood_light")   # broom
    p.add(bm_cyl(0.06, 0.12, 0.3, 6), "straw", M((-5.97, -2.39, COB)))


def stage_14(p, rnd, extra):
    """Opening day: lanterns on every stall and on the front poles (glass in `glow`), flower
    planters at the entrance, and Lord Vane's writ nailed to the notice post with a red seal."""
    for st in STALLS:
        T, W, D = frame(st), st["W"], st["D"]
        lantern_bracket(p, T, -(W / 2 - 0.08) - 0.07, -(D / 2 - 0.08), FH - 0.18, (-0.42, -0.05))
    for k in ("fl", "fr"):
        x, y = POLES[k]
        s = 1 if x < 0 else -1
        lantern_bracket(p, Matrix(), x + s * 0.07, y, 2.55, (s * 0.5, 0.0))
    for s in (-1, 1):                        # half-barrel planters at the entrance
        x, y = s * 2.0, -5.2
        F = M((x, y, COB), (0, 0, s * 8))  # plank planter box
        B(p, F, (0.72, 0.72, 0.4), (0, 0, 0.2), "wood_mid")
        for sx in (-1, 1):
            for sy in (-1, 1):
                B(p, F, (0.08, 0.08, 0.44), (sx * 0.35, sy * 0.35, 0.22), "wood_dark")
        B(p, F, (0.64, 0.64, 0.02), (0, 0, 0.405), "soil")
        for k in range(6):
            a, d = TAU * k / 6 + rnd.uniform(-0.2, 0.2), rnd.uniform(0.08, 0.2)
            ball(p, F, 0.09, (d * math.cos(a), d * math.sin(a), 0.42), "grass_dark", scale=(1, 1, 0.8), jit=0.02, seed=k)
        for k in range(7):
            a, d = rnd.uniform(0, TAU), rnd.uniform(0.0, 0.24)
            ball(p, F, 0.05, (d * math.cos(a), d * math.sin(a), 0.5 + rnd.uniform(0, 0.08)),
                 rnd.choice(["petal_pink", "petal_white", "petal_yellow", "petal_pink"]))
    # Lord Vane's writ: the largest sheet, over the others, sealed in red wax with a black ribbon
    T = NOTICE
    B(p, T, (0.36, 0.012, 0.5), (0.02, -0.18, COB + 1.55), "parchment", rot=(0, 2, 0))
    for k in range(6):
        B(p, T, (0.26, 0.004, 0.012), (0.02, -0.188, COB + 1.72 - 0.05 * k), "ink", rot=(0, 2, 0))
    B(p, T, (0.18, 0.004, 0.03), (0.02, -0.188, COB + 1.76), "plum")
    C(p, T, 0.05, 0.02, (0.04, -0.186, COB + 1.36), "wax", segs=8, rot=(90, 0, 0))
    for s in (-1, 1):
        B(p, T, (0.025, 0.006, 0.16), (0.04 + s * 0.025, -0.19, COB + 1.27), "ink", rot=(0, s * 12, 0))
    for x, z in ((-0.13, 1.78), (0.17, 1.78)):
        B(p, T, (0.025, 0.012, 0.025), (x, -0.19, COB + z), "iron")


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
        for xp, origin in extra:
            objs.append(xp.to_object(model, parent=node, origin=origin))
        stages.append((node, objs))
    return stages


def main():
    stages = build()
    bpy = common.bpy
    meshes = [o for _, objs in stages for o in objs]
    counts = {n.name: common.tris(objs) for n, objs in stages}
    if FAST:
        bpy.context.view_layer.update()
        return summary(meshes, counts)
    common.setup_render()
    common.preview_rig(meshes, azim=-28, elev=30, lens=50, margin=0.86)   # meadow occludes the bake
    for k in range(1, len(stages) + 1):     # bake each stage with only the stages that exist when it appears
        for i, (n, objs) in enumerate(stages, 1):
            for o in objs:
                o.hide_render = i > k
        common.bake_ao(stages[k - 1][1])
    for o in meshes:
        o.hide_render = False
    common.export("market.glb")
    common.preview_materials()
    if RENDER_STAGES:
        for k in range(1, len(stages) + 1):
            for i, (n, objs) in enumerate(stages, 1):
                for o in objs:
                    o.hide_render = i > k
            vis = [o for i, (n, objs) in enumerate(stages, 1) if i <= k for o in objs]
            common.preview_rig(vis, azim=-28, elev=30, lens=50, margin=0.8, min_radius=9.4)
            common.render(os.path.join(common.OUT_PREV, "market_stage_%02d.png" % k))
    for o in meshes:
        o.hide_render = False
    common.preview_rig(meshes, azim=-30, elev=20, lens=40, margin=0.82)
    common.render(os.path.join(common.OUT_PREV, "market.png"))
    common.save_blend("market")
    bpy.context.view_layer.update()
    return summary(meshes, counts)


def summary(meshes, counts):
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = [round(min(q[i] for q in pts), 2) for i in range(3)]
    hi = [round(max(q[i] for q in pts), 2) for i in range(3)]
    special = {o.name: [round(v, 3) for v in o.matrix_world.translation] for o in meshes
               if o.name.startswith(("awning", "bunting", "bucket"))}
    glow = sorted({o.parent.name for o in meshes if any(m and m.name == "glow" for m in o.data.materials)})
    return {"tris": counts, "total": sum(counts.values()), "bbox": (lo, hi), "special": special, "glow_in": glow}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
    print("RESULT", RESULT)
