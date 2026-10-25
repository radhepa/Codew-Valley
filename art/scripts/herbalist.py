"""Mirela the herbalist, in the soft Animal Crossing style of Marlo the fisher (2026-10-23).
Serene and gentle: long dark hair sculpted in smooth metaball locks with a centre parting, two
strands falling in front of the shoulders and four locks down her back; a crown of small
five-petal flowers and leaves on a twisted vine; calm half-lidded eyes with a lash flick and a
soft smile. A green garter-knit shawl (a capelet over the shoulders with a point down the back,
a light stripe, rolled edges, fringe, knotted at the front with two fringed tails) over a linen
peasant blouse (drawstring neckline with a rose bow, a little placket, embroidered flowers);
a long gathered earthy skirt to the ankles with an embroidered vine band, a waistband, a
stitched pocket with a lavender sprig, a twisted twine belt with a leather drawstring pouch;
small leather shoes peeking out under the hem.
Prop: `basket` (arm_l, held out to the side): a woven wicker basket with real stakes and
over-under weavers, a wrapped rim and wrapped handle, full of leaves, mint, sage, lavender and
chamomile.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe
from villagers_common import frame, S, sphere, lathe, meta, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

vc.palette({
    "hair_mirela": "#47322A",
    "linen": "#EBE1CC", "linen_shade": "#D6C8AB", "linen_thread": "#BBA987",
    "shawl": "#6F9056", "shawl_dark": "#557341", "shawl_light": "#A3BC80",
    "skirt": "#9C7756", "skirt_dark": "#775A41", "skirt_band": "#84593F", "skirt_thread": "#E2CDA6",
    "embroid_green": "#86AA62", "ribbon": "#C77F70",
    "twine": "#CDB58C", "twine_dark": "#A88F67",
    "pouch": "#8E6040", "pouch_dark": "#694529", "button_wood": "#9A6A44",
    "shoe": "#6A4733", "stocking": "#8C6E58",
    "wicker": "#CBA565", "wicker_dark": "#9A7840", "wicker_light": "#DDC183", "wicker_in": "#7E6136",
    "herb": "#6E9B4D", "herb_dark": "#4C7A3A", "herb_deep": "#3E6331", "herb_sage": "#9DB287", "herb_stem": "#5E7E3E",
    "lavender": "#9F88CB", "lavender_dark": "#7C67AA",
    "bloom_pink": "#EEA8BC", "bloom_white": "#F8F2E6", "bloom_yellow": "#F0CC62", "bloom_blue": "#A3B9E3",
    "bloom_centre": "#E7AE45", "leaf": "#609048", "leaf_dark": "#4A743A", "vine": "#6E7040",
}, gloss={"hair_mirela": 0.6})


# ---------------------------------------------------------------- small helpers

def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def stitch(part, pts, matname="stitch_light", dash=0.013, gap=0.008, r=0.0026):
    """Running stitch like vc.stitch, but with open-ended dashes (the caps are too small to see)."""
    pts = [Vector(p) for p in pts]
    total = plen(pts)
    s = gap * 0.5
    while s + dash <= total:
        part.add(bm_tube([polyline_at(pts, s), polyline_at(pts, s + dash)], r, 4, cap=False), matname)
        s += dash + gap


def basis(c, xa, ya, za):
    return Matrix(((xa.x, ya.x, za.x, c.x), (xa.y, ya.y, za.y, c.y), (xa.z, ya.z, za.z, c.z), (0, 0, 0, 1)))


def leaf_frame(c, n, t):
    """Matrix at c with local Z along n (the leaf's face) and local Y along t (its length)."""
    n = Vector(n).normalized()
    t = Vector(t)
    t = (t - n * t.dot(n)).normalized()
    return basis(Vector(c), t.cross(n), t, n)


def leaf_bm(L=0.03, W=0.014, T=0.004, curl=0.12, fold=0.22, n=6, m=8):
    """A pointed leaf: base at the origin, along +Y, face up +Z, a folded midrib and an upturned tip."""
    bm = bmesh.new()
    rings = []
    for i in range(1, m):
        u = i / m
        w = W * 0.5 * math.sin(math.pi * u) ** 0.75 * (1.12 - 0.28 * u)
        t = T * 0.5 * math.sin(math.pi * u) ** 0.6
        zc = curl * L * u * u
        ring = []
        for k in range(n):
            a = 2 * math.pi * k / n
            x = w * math.cos(a)
            ring.append(bm.verts.new((x, L * u, t * math.sin(a) + fold * abs(x) + zc)))
        rings.append(ring)
    p0, p1 = bm.verts.new((0, 0, 0)), bm.verts.new((0, L, curl * L))
    for a, b in zip(rings, rings[1:]):
        for k in range(n):
            j = (k + 1) % n
            bm.faces.new((a[k], a[j], b[j], b[k]))
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((rings[0][j], rings[0][k], p0))
        bm.faces.new((rings[-1][k], rings[-1][j], p1))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def twist(part, path, r_strand, r_off, turns_per_m, mat, segs=5, mat2=None):
    """Two strands twisted round a centre path (cord, vine)."""
    path = [Vector(p) for p in path]
    L = plen(path)
    n = max(int(L * turns_per_m * 6), 12)
    pts = [polyline_at(path, L * k / n) for k in range(n + 1)]
    for sgn, mm in ((0.0, mat), (math.pi, mat2 or mat)):
        out = []
        prev = None
        for k, c in enumerate(pts):
            t = (pts[min(k + 1, n)] - pts[max(k - 1, 0)]).normalized()
            ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
            side = t.cross(ref).normalized() if prev is None else (prev - t * prev.dot(t)).normalized()
            prev = side
            up = side.cross(t)
            th = 2 * math.pi * turns_per_m * L * k / n + sgn
            out.append(c + (side * math.cos(th) + up * math.sin(th)) * r_off)
        part.add(bm_tube(out, r_strand, segs, cap=False), mm, smooth=True)


def helix_wrap(part, path, r_core, r_wire, turns, mat, per_turn=7):
    """A wire wrapped round a tube along path (basket rim / handle bindings)."""
    path = [Vector(p) for p in path]
    L = plen(path)
    n = int(turns * per_turn)
    out = []
    prev = None
    for k in range(n + 1):
        s = L * k / n
        c = polyline_at(path, s)
        t = (polyline_at(path, min(s + 0.002, L)) - polyline_at(path, max(s - 0.002, 0))).normalized()
        ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        side = t.cross(ref).normalized() if prev is None else (prev - t * prev.dot(t)).normalized()
        prev = side
        up = side.cross(t)
        th = 2 * math.pi * turns * k / n
        out.append(c + (side * math.cos(th) + up * math.sin(th)) * (r_core + r_wire * 0.45))
    part.add(bm_tube(out, r_wire, 5, cap=False), mat, smooth=True)


def flower(part, c, n, up, size, petal, centre="bloom_centre", petals=5, spin=0.3):
    """Five round cupped petals round a domed centre, facing n."""
    n = Vector(n).normalized()
    t0 = Vector(up)
    t0 = (t0 - n * t0.dot(n)).normalized()
    b = t0.cross(n)
    for k in range(petals):
        a = 2 * math.pi * k / petals + spin
        d = t0 * math.cos(a) + b * math.sin(a)
        m = leaf_frame(Vector(c) + d * 0.0145 * size + n * 0.0015 * size, n + d * 0.35, d)
        part.add(sphere(10, 5), petal, m @ S(0.0105 * size, 0.0135 * size, 0.0038 * size), smooth=True)
    part.add(sphere(10, 6), centre, leaf_frame(Vector(c) + n * 0.004 * size, n, t0) @ S(0.0075 * size, 0.0075 * size, 0.0055 * size), smooth=True)


def bvh_hit(trees, origin, direction):
    best = None
    for tr in trees:
        loc, nrm, idx, dist = tr.ray_cast(origin, direction)
        if loc is not None and (best is None or dist < best[2]):
            best = (loc, nrm, dist)
    return best


# ---------------------------------------------------------------- garments

SKIRT = vc.Garment([(0.25, 0.1), (0.249, 0.13), (0.24, 0.2), (0.224, 0.29), (0.205, 0.38), (0.188, 0.45), (0.18, 0.49),
                    (0.178, 0.515)], ys=0.84)
BLOUSE = vc.Garment([(0.165, 0.44), (0.17, 0.5), (0.168, 0.56), (0.162, 0.62), (0.15, 0.67), (0.13, 0.72), (0.1, 0.765),
                     (0.074, 0.795), (0.056, 0.815)], ys=0.84)
SHAWL = vc.Garment([(0.262, 0.40), (0.262, 0.47), (0.258, 0.53), (0.256, 0.58), (0.25, 0.63), (0.24, 0.67), (0.22, 0.71),
                    (0.19, 0.75), (0.15, 0.775), (0.115, 0.79), (0.09, 0.80)], ys=0.68)
SH_OUT = 0.006


def fold(a, z):
    """Soft gathers in the skirt, strongest at the hem, gone at the waist (a in radians)."""
    k = clamp((0.46 - z) / (0.46 - 0.1)) ** 1.2
    return 0.0075 * k * math.cos(14 * a + 0.35)


def SP(phi, z, out=0.0):
    return SKIRT.pt(phi, z, out + fold(math.radians(phi), z))


def SN(phi, z):
    tp = SP(phi + 0.4, z) - SP(phi - 0.4, z)
    tz = SP(phi, z + 0.003) - SP(phi, z - 0.003)
    return tp.cross(tz).normalized()


def skirt_ring(z, out, n=160):
    return [SP(-180 + 360 * k / n, z, out) for k in range(n + 1)]


def zb(phi):
    """Bottom edge of the shawl: knot height at the front, over the arms at the sides, a point down the back."""
    p = (phi + 90) % 360 - 90
    if p <= 0:
        t = (p + 90) / 90
        return 0.6 - 0.044 * (3 * t * t - 2 * t * t * t)
    if p <= 90:
        return 0.556 - 0.126 * p / 90
    if p <= 180:
        return 0.43 + 0.126 * (p - 90) / 90
    t = (p - 180) / 90
    return 0.556 + 0.044 * (3 * t * t - 2 * t * t * t)


def zt(phi):
    """Top edge: round the neck, dipping in a V at the front down to the knot."""
    p = (phi + 90) % 360 - 90
    d = min(p + 90, 270 - p)
    if d >= 48:
        return 0.80
    return 0.6 + 0.20 * (d / 48) ** 0.8


def shell(part, G, phi0, phi1, lo, hi, t0, t1, mat, out, nphi=200, nz=8, rows=10, rib=0.0035):
    """A surface lying on garment G between the curves lo(phi) and hi(phi) (fractions t0..t1),
    with garter-knit ridges running parallel to the bottom edge."""
    bm = bmesh.new()
    cols = []
    for i in range(nphi + 1):
        phi = phi0 + (phi1 - phi0) * i / nphi
        a, b = lo(phi), hi(phi)
        col = []
        for j in range(nz + 1):
            t = t0 + (t1 - t0) * j / nz
            o = out + rib * 0.5 * (1 + math.cos(2 * math.pi * t * rows))
            col.append(bm.verts.new(G.pt(phi, a + (b - a) * t, o)))
        cols.append(col)
    for i in range(nphi):
        for j in range(nz):
            bm.faces.new((cols[i][j], cols[i + 1][j], cols[i + 1][j + 1], cols[i][j + 1]))
    part.add(bm, mat, None, smooth=True)


def tassel(part, top, down, side, n=3, length=0.04, mat="shawl", knot="shawl_dark", r=0.0042):
    """A little knotted tassel of n strands hanging from top."""
    part.add(sphere(6, 4), knot, M(top, scale=0.0058), smooth=True)
    for k in range(n):
        dx = (k - (n - 1) / 2) * 0.0042
        a = top + side * dx * 0.5
        b = top + down * length + side * dx * 1.4
        part.add(bm_tube([a, b], [r, r * 0.8], 5), mat, smooth=True)


# ---------------------------------------------------------------- body

def skirt(p):
    G = SKIRT
    G.mesh(p, "skirt", segs=112, rfun=fold, cap_top=True)
    # rolled hem, then an embroidered band between two pipings, and a running stitch above
    p.add(bm_tube(skirt_ring(0.103, 0.003, 112), 0.0135, 7, cap=False), "skirt_dark", smooth=True)
    band = [(G.rad(z), z) for z in (0.125, 0.138, 0.151, 0.164, 0.178)]
    p.add(lathe(band, 112, rfun=lambda a, z: fold(a, z) + 0.0035, ys=G.ys), "skirt_band", smooth=True)
    for z in (0.125, 0.178):
        p.add(bm_tube(skirt_ring(z, 0.0035, 112), 0.0042, 5, cap=False), "skirt_dark", smooth=True)
    for h in (-1, 1):
        stitch(p, [SP(phi, 0.19, 0.002) for phi in [90 * h - 90 + 180 * k / 40 for k in range(41)]], "skirt_thread")
    # the vine: a wavy green stitch with a leaf on every crest and a knot flower in every trough
    zc, amp, waves = 0.1515, 0.0095, 18
    for h in range(4):
        stitch(p, [SP(phi, zc + amp * math.sin(math.radians(phi) * waves), 0.0058) for phi in
                   [-180 + 90 * h + 90 * k / 30 for k in range(31)]], "embroid_green", 0.008, 0.004, 0.0021)
    for j in range(2 * waves):
        phi = (90 + 180 * j) / waves - 180
        top = j % 2 == 0
        if top:
            c = SP(phi, zc + amp + 0.001, 0.0056)
            m = leaf_frame(c, SN(phi, zc + amp), Vector((0, 0, 1)) + (SP(phi + 3, zc) - SP(phi, zc)).normalized() * 0.5)
            p.add(leaf_bm(0.016, 0.0085, 0.0022, 0.0, 0.1, 8, 8), "embroid_green", m, smooth=True)
        else:
            col = "bloom_pink" if j % 4 == 1 else "bloom_yellow"
            for k in range(3):
                a = 2 * math.pi * k / 3 + 0.5
                c = SP(phi + 1.4 * math.cos(a), zc - amp - 0.003 + 0.0035 * math.sin(a), 0.0062)
                p.add(sphere(6, 4), col, M(c, scale=0.0034), smooth=True)
    # waistband with stitching
    wb = [(G.rad(z) + 0.006, z) for z in (0.468, 0.48, 0.495, 0.508, 0.515)]
    p.add(lathe(wb, 96, ys=G.ys), "skirt_dark", smooth=True)
    p.add(bm_tube(G.arc(-180, 180, 0.515, 0.006, 72), 0.0045, 6, cap=False), "skirt_dark", smooth=True)
    for z in (0.475, 0.508):
        G.stitch_ring(p, z, out=0.0085, matname="skirt_thread")
    # stitched patch pocket, front left, with a lavender sprig tucked in
    G.pocket(p, -62, 14, 0.24, 0.345, "skirt", edge="skirt_dark", thread="skirt_thread")
    for k, (dp, h, lean) in enumerate(((-5, 0.075, -4), (0, 0.09, 1), (5, 0.07, 6))):
        a = G.pt(-62 + dp, 0.32, 0.011)
        b = G.pt(-62 + dp + lean, 0.32 + h, 0.022 + 0.004 * k)
        p.add(bm_tube([a, (a + b) / 2, b], 0.0022, 6), "herb_sage", smooth=True)
        d = (b - a).normalized()
        for i in range(9):
            c = b - d * (0.004 * i) + Vector((math.cos(i * 2.4), math.sin(i * 2.4), 0)) * 0.0035
            p.add(sphere(8, 4), "lavender" if i % 2 else "lavender_dark", M(c, scale=(0.004, 0.004, 0.0055)), smooth=True)
    return p


def belt_and_pouch(p):
    G = SKIRT
    # twisted twine belt just under the waistband, tied at her front right
    path = [G.pt(-180 + 360 * k / 120, 0.462, 0.014) for k in range(121)]
    twist(p, path, 0.0042, 0.0042, 26, "twine", mat2="twine_dark")
    tie = -112
    K = G.pt(tie, 0.462, 0.02)
    p.add(sphere(16, 10), "twine", M(K, scale=(0.012, 0.011, 0.012)), smooth=True)
    for dp, zend in ((-4, 0.372), (3, 0.392)):
        end = [G.pt(tie + dp * f, 0.462 - (0.462 - zend) * f, 0.016 + 0.003 * f) for f in (0.0, 0.3, 0.6, 1.0)]
        twist(p, end, 0.0035, 0.0034, 60, "twine", mat2="twine_dark")
        n = G.normal(tie + dp, zend, 0.0)
        tassel(p, end[-1], Vector((0, 0, -1)), Vector((-n.y, n.x, 0)).normalized(), 3, 0.028, "twine", "twine_dark", 0.0032)
    # leather drawstring pouch hanging on a cord loop at her right hip
    ph = -140
    a = math.radians(ph)
    n = Vector((math.cos(a), math.sin(a) / G.ys, 0)).normalized()
    side = Vector((-n.y, n.x, 0))
    base = G.pt(ph, 0.385, 0.0)
    top = Vector((base.x, base.y, 0.442)) + n * (0.044 * 0.72 + 0.006)
    pm = basis(top, side, n * 0.72, Vector((0, 0, 1)))       # local Z up, local Y squashed along the body normal
    bag = [(0.0, -0.106), (0.022, -0.103), (0.036, -0.092), (0.043, -0.072), (0.044, -0.052), (0.039, -0.032), (0.028, -0.018),
           (0.019, -0.011)]
    p.add(lathe(bag, 40, cap_bottom=False), "pouch", pm, smooth=True)
    frill = [(0.019, -0.011), (0.025, -0.004), (0.029, 0.006), (0.028, 0.013), (0.023, 0.016)]
    p.add(lathe(frill, 40, rfun=lambda aa, z: 0.0025 * math.cos(9 * aa) * clamp((z + 0.006) / 0.02)), "pouch", pm, smooth=True)
    p.add(bm_tube(ring_pts(pm @ Matrix.Translation((0, 0, -0.012)), 0.0195, 24), 0.0042, 6, cap=False), "twine", smooth=True)
    # stitched side seams and an embroidered leaf on the front
    for sx in (-1, 1):
        stitch(p, [pm @ Vector((sx * 0.044 * math.sin(math.pi * k / 10) * 1.0, 0, -0.018 - 0.085 * k / 10)) for k in range(11)],
               "linen_thread", 0.008, 0.005, 0.0018)
    fm = pm @ Matrix.Translation((0, 0.0445, -0.06))
    p.add(leaf_bm(0.03, 0.015, 0.0025, 0.0, 0.08, 8, 10), "embroid_green", basis((fm @ Vector((0, 0, 0))) + n * 0.002 - Vector((0, 0, 0.015)),
          side, Vector((0, 0, 1)), n), smooth=True)
    # drawstring ends with wooden beads
    for sx in (-1, 1):
        s0 = pm @ Vector((sx * 0.006, 0.02, -0.012))
        s1 = pm @ Vector((sx * 0.012, 0.03, -0.04 - 0.008 * (sx > 0)))
        p.add(bm_tube([s0, (s0 + s1) / 2 + n * 0.002, s1], 0.0022, 6), "twine", smooth=True)
        p.add(sphere(12, 8), "button_wood", M(s1, scale=0.0058), smooth=True)
    # cord loop from the belt down to the pouch neck
    b0, b1 = G.pt(ph + 4, 0.462, 0.016), G.pt(ph - 4, 0.462, 0.016)
    neck = pm @ Vector((0, 0, -0.012))
    p.add(bm_tube([b0, (b0 + neck) / 2 + n * 0.006, neck + side * 0.01], 0.0032, 6), "twine_dark", smooth=True)
    p.add(bm_tube([b1, (b1 + neck) / 2 + n * 0.006, neck - side * 0.01], 0.0032, 6), "twine_dark", smooth=True)
    return top


def blouse(p):
    G = BLOUSE

    def gathers(a, z):
        return 0.0035 * clamp((z - 0.72) / 0.075) * 0.5 * (1 + math.cos(30 * a))

    G.mesh(p, "linen", segs=96, rfun=gathers)
    # drawstring neckline with a rose ribbon bow
    p.add(bm_tube(G.arc(-180, 180, 0.796, 0.004, 64), 0.0055, 8, cap=False), "linen_shade", smooth=True)
    B = G.pt(-90, 0.791, 0.012)
    for sx in (-1, 1):
        lc = B + Vector((sx * 0.014, -0.002, 0.004))
        loop = [lc + Vector((0.012 * math.cos(t) * 1.0, -0.003 * math.sin(t), 0.0072 * math.sin(t))) for t in
                [2 * math.pi * k / 20 for k in range(21)]]
        p.add(bm_tube(loop, 0.0034, 6, cap=False), "ribbon", M(), smooth=True)
        e0 = B + Vector((sx * 0.003, -0.003, -0.004))
        e1 = B + Vector((sx * 0.014, -0.008, -0.045 - 0.006 * (sx > 0)))
        p.add(bm_tube([e0, (e0 + e1) / 2 + Vector((sx * 0.003, -0.002, 0)), e1], [0.0032, 0.003, 0.0028], 6), "ribbon", smooth=True)
        p.add(sphere(10, 6), "button_wood", M(e1, scale=0.0045), smooth=True)
    p.add(sphere(14, 8), "ribbon", M(B + Vector((0, -0.004, 0.002)), scale=(0.0065, 0.0055, 0.006)), smooth=True)
    # little placket with two wooden buttons
    G.panel(p, -95, -85, 0.63, 0.772, "linen", 0.004, 3)
    p.add(bm_tube([G.pt(-95, z, 0.0045) for z in (0.63, 0.67, 0.71, 0.74, 0.772)], 0.0028, 6), "linen_shade", smooth=True)
    for z in (0.742, 0.697):
        G.button(p, -90, z, 0.0095, "button_wood", 0.006)
    # embroidered flowers on the yoke either side of the placket
    for ph in (-104, -76):
        c0 = G.frame(ph, 0.748, 0.004)
        for k in range(5):
            t = 2 * math.pi * k / 5 + 0.3
            p.add(sphere(10, 6), "bloom_pink", c0 @ Matrix.Translation((0.0062 * math.cos(t), 0.0062 * math.sin(t), 0.0)) @ S(0.0034, 0.0034, 0.0022), smooth=True)
        p.add(sphere(10, 6), "bloom_yellow", c0 @ Matrix.Translation((0, 0, 0.0008)) @ S(0.003, 0.003, 0.002), smooth=True)
        for sx in (-1, 1):
            stitch(p, [c0 @ Vector((sx * 0.008, -0.009, 0.0)), c0 @ Vector((sx * 0.016, -0.014, 0.0))], "embroid_green", 0.007, 0.002, 0.0019)


def shawl(p):
    G = SHAWL
    ph0, ph1 = -87.0, 267.0
    # the garter-knit body of the shawl: plain, a light stripe near the edge, plain again
    for t0, t1, mat, nz in ((0.0, 0.085, "shawl", 4), (0.085, 0.15, "shawl_light", 3), (0.15, 1.0, "shawl", 26)):
        shell(p, G, ph0, ph1, zb, zt, t0, t1, mat, SH_OUT, nphi=120, nz=nz)
    # rolled edges along the bottom and round the neck and V
    phis = [ph0 + (ph1 - ph0) * k / 132 for k in range(133)]
    p.add(bm_tube([G.pt(ph, zb(ph), SH_OUT + 0.002) for ph in phis], 0.0085, 7), "shawl_dark", smooth=True)
    p.add(bm_tube([G.pt(ph, zt(ph), SH_OUT + 0.001) for ph in phis], 0.0075, 6), "shawl_dark", smooth=True)
    # fringe along the two edges of the back point
    k = 0
    ph = 6.0
    while ph <= 174.0:
        e = G.pt(ph, zb(ph), SH_OUT + 0.004)
        n = G.normal(ph, zb(ph), 0.0)
        side = Vector((-n.y, n.x, 0)).normalized()
        tassel(p, e - Vector((0, 0, 0.004)), (Vector((0, 0, -1)) + n * 0.12).normalized(), side, 2, 0.036 + 0.006 * (k % 2))
        ph += 3.6
        k += 1
    # the knot at the front and two fringed tails
    K = G.pt(-90, 0.598, SH_OUT + 0.02)
    p.add(sphere(24, 16), "shawl", M(K, scale=(0.036, 0.025, 0.03)), smooth=True)
    for sx in (-1, 1):
        p.add(sphere(20, 12), "shawl", M(K + Vector((sx * 0.03, 0.006, 0.012)), (0, sx * 30, 0), (0.022, 0.018, 0.016)), smooth=True)
    stitch(p, [K + Vector((0.03 * math.cos(t), -0.026 * abs(math.sin(t)) - 0.001, 0.026 * math.sin(t))) for t in
               [math.pi * (0.15 + 0.7 * k / 10) for k in range(11)]], "shawl_dark", 0.008, 0.004, 0.0025)
    for sx, drop, spread in ((1, 0.1, 0.042), (-1, 0.118, 0.03)):
        pts = [K + Vector((sx * 0.012, 0.004, -0.02)), K + Vector((sx * spread * 0.7, 0.009, -0.06)), K + Vector((sx * spread, 0.013, -drop))]
        mid = sum(pts, Vector()) / 3
        flat = Matrix.Translation(mid) @ S(1, 0.38, 1) @ Matrix.Translation(-mid)
        p.add(bm_tube(pts, [0.019, 0.022, 0.023], 16), "shawl", flat, smooth=True)
        end = pts[-1]
        dn = (pts[-1] - pts[-2]).normalized()
        p.add(bm_tube([end - dn * 0.012, end - dn * 0.004], 0.0236, 16), "shawl_light", flat, smooth=True)
        for j in range(5):
            x = (j - 2) * 0.0085
            tassel(p, end + Vector((x, -0.004, -0.003)), Vector((0, 0, -1)), Vector((1, 0, 0)), 2, 0.03, "shawl", "shawl_dark", 0.0038)


def body():
    p = Part("body")
    skirt(p)
    belt_and_pouch(p)
    blouse(p)
    p.add(bm_cyl(0.055, 0.052, 0.1, 24), "skin_warm", M((0, 0, 0.74)), smooth=True)
    shawl(p)
    return p


# ---------------------------------------------------------------- head

NECK = 0.8
HC = Vector((0, 0, 1.07))
HD = vc.Head(HC, 0.30, 0.278, 0.27)
EYE_X, EYE_Z, EW, EH = 0.094, -0.004, 0.029, 0.041


def lid_edge(x, X):
    """Height (above the eye centre) of the half-lid's lower edge: gently curved, lowest in the middle,
    covering the top third of the eye."""
    return 0.0125 + 0.0095 * (x / X) ** 2


def eye(hp, s):
    """House eye under a clean skin-coloured half-lid, flush with the eye, with a fine lash line
    along its curved lower edge and a flick at the outer corner (after lord_vane.smug_eye)."""
    ex, ez = s * EYE_X, EYE_Z
    HD.on_face(hp, "eye_dark", ex, ez, EW, EH, 0.012, u=28, v=16)
    HD.on_face(hp, "white", ex + 0.0085, ez - 0.006, 0.0068, 0.0076, 0.004, out=0.0105)
    p, n = HD.fpt(ex, ez, 0.0)
    fm = frame(p, n) @ M(rot=(0, 0, -s * 4))           # outer corners a touch lower: calm
    X, Z, YC, YR = EW * 1.3, 0.0152, 0.022, 0.032
    bm = sphere(40, 20)
    for v in bm.verts:
        co = Vector((v.co.x * X, v.co.y * YR + YC, v.co.z * Z))
        co.y = max(co.y, lid_edge(co.x, X))
        v.co = co
    hp.add(bm, "skin_warm", fm, smooth=True)

    def lid_pt(x, lift=0.0):
        y = lid_edge(x, X)
        z = Z * math.sqrt(max(1 - ((y - YC) / YR) ** 2 - (x / X) ** 2, 0.0))
        return fm @ Vector((x, y, z + lift))

    xs = [X * (-0.93 + 1.86 * k / 18) for k in range(19)]
    lash = [lid_pt(x, 0.0012) for x in xs]
    hp.add(bm_tube(lash, [0.0022 + 0.0012 * math.sin(math.pi * k / 18) for k in range(19)], 6), "eye_dark", smooth=True)
    o = lash[-1] if s > 0 else lash[0]
    hp.add(bm_tube([o, o + fm.to_3x3() @ Vector((s * 0.009, 0.005, -0.001))], [0.0026, 0.0011], 6), "eye_dark", smooth=True)


def covered(x, yl, z):
    """Is this point of the skull under hair? Everything but the face: a centre-parted hairline
    that curves down to the temples, and side curtains over the cheeks' outer edges."""
    ax = abs(x)
    if yl > -0.03:
        return z > -0.27
    if z > 0.195 - 3.2 * ax * ax:
        return True
    return ax > 0.245 and z > -0.215


def body_back_y(x, z, gap):
    """How far back (+y) hair must hang at (x, z) to clear the shawl (and the head)."""
    R = SHAWL.rad(z) + SH_OUT + 0.006
    y = SHAWL.ys * math.sqrt(R * R - x * x) + gap if abs(x) < R else 0.0
    return y


def head_y(x, z, out=0.0):
    t = 1 - (x / HD.a) ** 2 - ((z - HC.z) / HD.c) ** 2
    return HD.b * math.sqrt(t) + out if t > 0 else None


def fall_y(x, z, r):
    """y of a hair ball of radius r hanging down her back at (x, z): almost straight down from the
    back of the head, never closer to the shawl than its radius."""
    hy = head_y(x, 0.98, 0.042) or 0.16
    return max(hy - 0.12 * (0.98 - z), body_back_y(x, z, r + 0.006))


def skull_hair():
    """Hair balls on the skull, split into the two front locks and the back of the cap."""
    front = {-1: [], 1: []}
    back = []
    for ie in range(28):
        el = math.radians(-70 + 158 * ie / 27)
        z = HD.c * math.sin(el)
        k = math.cos(el)
        n = max(4, int(round(2 * math.pi * HD.a * k / 0.027)))
        for i in range(n):
            phi = -180 + 360 * (i + 0.5 * (ie % 2)) / n
            pt, nrm = HD.spt(phi, z)
            x, yl = pt.x, pt.y - HC.y
            if not covered(x, yl, z):
                continue
            if yl < 0.04 - 0.2 * (z + 0.05):
                for s in (-1, 1):
                    if s * x >= (0.009 if z > 0.02 else 0.004):
                        front[s].append((pt + nrm * 0.007, 0.04))
            else:
                back.append((x, (pt + nrm * 0.003, 0.04)))
    return front, back


# five locks down the back, from the crown to rounded tips: (x from, x to, tip height)
BANDS = ((-9.0, -0.16, 0.52), (-0.16, -0.05, 0.48), (-0.05, 0.05, 0.46), (0.05, 0.16, 0.48), (0.16, 9.0, 0.52))


def hair_back(skull_back):
    groups = [[] for _ in BANDS]

    def band(x):
        for i, (x0, x1, tip) in enumerate(BANDS):
            if x0 <= x < x1:
                return i
        return len(BANDS) - 1

    for x, el in skull_back:
        groups[band(x)].append(el)
    for iz in range(28):
        z = 0.98 - 0.02 * iz
        w = 0.25 - 0.06 * clamp((0.98 - z) / 0.3)
        nx = int(2 * w / 0.029) + 1
        for ix in range(nx):
            x = -w + 2 * w * (ix + 0.5) / nx
            i = band(x)
            x0, x1, tip = BANDS[i]
            if z < tip - 1e-6:
                continue
            u = clamp((tip + 0.11 - z) / 0.11)            # 0 above the taper, 1 at the tip
            bc = (max(x0, -w) + min(x1, w)) / 2
            xx = bc + (x - bc) * (1 - 0.62 * u)
            r = 0.045 * (1 - 0.42 * u ** 1.5)
            y = fall_y(xx, z, r)
            groups[i].append((Vector((xx, y, z)), r))
            if 0.8 <= z <= 0.95:
                groups[i].append((Vector((xx, y - 0.04, z)), 0.045))
    return groups


def catmull(pts, n_per=8):
    """Smooth Catmull-Rom curve through pts."""
    P = [pts[0] * 2 - pts[1]] + list(pts) + [pts[-1] * 2 - pts[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n_per):
            t = k / n_per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    return out


def front_strand(s):
    """A flat ribbon lock (oval section about 2.5:1 with a soft valley down the middle) from inside
    the side curtain, over the shoulder and down in front of it in one gentle S, ending in a soft
    rounded point. Built as a swept mesh rather than metaballs so it stays flat."""
    ctrl = [Vector((s * 0.226, -0.02, 0.96)), Vector((s * 0.236, -0.06, 0.89)), Vector((s * 0.228, -0.094, 0.832)),
            Vector((s * 0.212, -0.11, 0.78))]
    for z, x in ((0.73, 0.198), (0.68, 0.187), (0.63, 0.18), (0.59, 0.176), (0.555, 0.173)):
        R = SHAWL.rad(z) + SH_OUT + 0.006
        y = min(-(SHAWL.ys * math.sqrt(max(R * R - x * x, 0.0)) + 0.02), -0.112)
        ctrl.append(Vector((s * x, y, z)))
    path = catmull(ctrl, 8)
    acc = [0.0]
    for a_, b_ in zip(path, path[1:]):
        acc.append(acc[-1] + (b_ - a_).length)
    L = acc[-1]
    NR = 20
    bm = bmesh.new()
    rings = []
    for i, c in enumerate(path):
        u = acc[i] / L
        T = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]).normalized()
        N = Vector((c.x, c.y / (SHAWL.ys * SHAWL.ys), 0)).normalized() + Vector((0, -0.55, 0))
        N = (N - T * N.dot(T)).normalized()
        Wd = T.cross(N).normalized()
        # one gentle S below the shoulder, sideways across the chest
        v = clamp((u - 0.3) / 0.7)
        c = c + Wd * (0.011 * math.sin(2 * math.pi * v) * s)
        w = 0.1 * (1 - 0.28 * u)
        if u > 0.8:
            w *= math.sqrt(max(1 - ((u - 0.8) / 0.2) ** 2, 0.0))
        w = max(w, 0.0015)
        t = w / 2.5
        ring = []
        for k in range(NR):
            th = 2 * math.pi * k / NR
            x = 0.5 * w * math.cos(th)
            y = 0.5 * t * math.sin(th)
            if y > 0:                                   # a soft valley down the middle of the outer face
                y -= 0.3 * t * 0.5 * math.sin(th) * math.exp(-(x / (0.22 * w)) ** 2)
            ring.append(bm.verts.new(c + Wd * x + N * (y + 0.5 * t)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(NR):
            j = (k + 1) % NR
            bm.faces.new((r0[k], r0[j], r1[j], r1[k]))
    top = bm.verts.new(path[0])
    tip = bm.verts.new(path[-1] + (path[-1] - path[-2]).normalized() * 0.004)
    for k in range(NR):
        j = (k + 1) % NR
        bm.faces.new((rings[0][j], rings[0][k], top))
        bm.faces.new((rings[-1][k], rings[-1][j], tip))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def crown(hp, trees):
    """A twisted vine with leaves round the hair, little flowers across the front."""
    o = Vector((0, 0, 0.12))

    def at(th, lift=0.0):
        d = Vector((math.cos(th), math.sin(th), -0.32 * math.sin(th))).normalized()
        hit = bvh_hit(trees, HC + o + d * 0.7, -d)
        loc, nrm = hit[0], hit[1]
        return loc + nrm * lift, nrm, d

    ring = []
    for k in range(97):
        th = 2 * math.pi * k / 96
        loc, nrm, d = at(th, 0.004)
        ring.append(loc)
    twist(hp, ring, 0.0062, 0.0048, 20, "vine", mat2="leaf_dark")
    rnd = random.Random(7)
    # leaves in pairs all the way round, angled along the vine
    for k in range(24):
        th = 2 * math.pi * (k + 0.5) / 24
        loc, nrm, d = at(th, 0.006)
        tang = (at(th + 0.02)[0] - at(th - 0.02)[0]).normalized()
        for sgn in (-1, 1):
            dirv = (tang * (1 if k % 2 else -1) + Vector((0, 0, 1)) * 0.35 * sgn + nrm * 0.25).normalized()
            m = leaf_frame(loc, nrm + dirv * 0.2, dirv)
            hp.add(leaf_bm(0.034 + 0.006 * rnd.random(), 0.016, 0.0042, 0.18, 0.25), "leaf" if (k + sgn) % 3 else "leaf_dark", m, smooth=True)
    # flowers across the front, a larger pink bloom on her left
    cols = ["bloom_white", "bloom_pink", "bloom_yellow", "bloom_blue", "bloom_pink", "bloom_white", "bloom_yellow", "bloom_pink", "bloom_white"]
    for k in range(9):
        th = math.radians(-90 + (k - 4) * 21)
        size = 1.0 + 0.18 * ((k + 1) % 2)
        if k == 6:
            size = 1.45
        loc, nrm, d = at(th, 0.012)
        flower(hp, loc, nrm * 0.35 + d * 0.65 + Vector((0, 0, 0.25)), Vector((0, 0, 1)), size, cols[k], spin=rnd.random())
    # small buds between the flowers and two flowers at the back
    for k in range(8):
        th = math.radians(-90 + (k - 3.5) * 21)
        loc, nrm, d = at(th, 0.01)
        hp.add(sphere(8, 6), "bloom_white" if k % 2 else "bloom_pink", M(loc + Vector((0, 0, 0.012)), scale=(0.0068, 0.0068, 0.0078)), smooth=True)
    for th in (math.radians(70), math.radians(110)):
        loc, nrm, d = at(th, 0.01)
        flower(hp, loc, nrm, Vector((0, 0, 1)), 0.9, "bloom_yellow" if th < 1.6 else "bloom_white", spin=rnd.random())


def head():
    hp = Part("head")
    HD.skull(hp, "skin_warm")
    for s in (-1, 1):
        eye(hp, s)
    HD.blush(hp, x=0.158, z=-0.05, w=0.042, h=0.026)
    HD.nose(hp, "nose", -0.05, (0.04, 0.035, 0.04), 0.018)
    HD.mouth(hp, -0.128, "smile", 0.021)
    # thin gentle arched brows
    for s in (-1, 1):
        bx = [0.056 + 0.09 * k / 12 for k in range(13)]
        pts = [HD.fpt(s * x, 0.087 + 0.011 * math.sin(math.pi * (x - 0.05) / 0.1), 0.008)[0] for x in bx]
        hp.add(bm_tube(pts, [0.0048 + 0.0032 * math.sin(math.pi * (0.25 + 0.75 * k / 12)) for k in range(13)], 10), "hair_mirela", smooth=True)
    # hair: two front locks parted in the middle, the back in five locks from the crown to rounded
    # tips, two strands in front of the shoulders
    front, skull_back = skull_hair()
    bms = [meta(front[s], 0.011, keep=0.26) for s in (-1, 1)]
    bms += [meta(g, 0.012, keep=0.26) for g in hair_back(skull_back)]
    trees = [BVHTree.FromBMesh(b) for b in bms]
    for s in (-1, 1):
        bms.append(front_strand(s))
    crown(hp, trees)
    for b in bms:
        hp.add(b, "hair_mirela", None, smooth=True)
    return hp


# ---------------------------------------------------------------- legs (small shoes peeking out under the hem)

def leg(side, cfg):
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    p.add(bm_tube([(x, 0, cfg["hip_z"]), (x, -0.015, 0.2), (x, -0.03, 0.09)], [0.05, 0.045, 0.04], 16), "stocking", smooth=True)
    els = [((x, -0.02, 0.07), 0.046), ((x, -0.065, 0.06), 0.047), ((x, -0.11, 0.052), 0.045), ((x, -0.155, 0.046), 0.042),
           ((x, -0.195, 0.041), 0.037), ((x, 0.012, 0.062), 0.044)]
    p.add(meta(els, 0.01), "shoe", None, smooth=True)
    p.add(lathe([(0.0, 0.0), (0.046, 0.0), (0.0505, 0.005), (0.0505, 0.012), (0.046, 0.017), (0.0, 0.017)], 48, ys=2.95),
          "sole", M((x, -0.09, 0.0)), smooth=True)
    return p


CFG = dict(
    neck_z=NECK, shoulder_x=0.165, shoulder_z=0.665, hip_x=0.075, hip_z=0.36,
    arm_len=0.26, arm_splay=18, arm_pose={1: (30, 30)},       # the basket arm is held out to the side
    sleeve_r=0.06, sleeve_mat="linen", cuff_mat="linen_shade", stitch_mat="embroid_green",
    leg=leg,
)


# ---------------------------------------------------------------- the basket

BK_H = 0.1
BK_EY = 1.35


def bk_r(z):
    return 0.07 + 0.021 * (max(z, 0.0) / BK_H) ** 0.85


def basket():
    p = Part("basket")
    g = vc.hand_c(1, CFG)
    bc = g + Vector((0.024, 0.0, -0.255))

    def W(a, z, o=0.0):
        r = bk_r(z) + o
        return bc + Vector((r * math.cos(a), BK_EY * r * math.sin(a), z))

    T = Matrix.Translation(bc)
    # dark inner wall and floor so nothing shows through the weave
    p.add(lathe([(bk_r(z) - 0.004, z) for z in (0.0, 0.03, 0.06, BK_H)], 64, ys=BK_EY, cap_bottom=True), "wicker_in", T, smooth=True)
    # base: a flat oval with a coiled foot ring
    p.add(lathe([(0.0, -0.002), (bk_r(0) - 0.004, -0.002), (bk_r(0) + 0.002, 0.004)], 64, ys=BK_EY), "wicker_dark", T, smooth=True)
    p.add(bm_tube([W(math.pi + 2 * math.pi * k / 64, 0.002, 0.002) for k in range(65)], 0.0065, 6, cap=False), "wicker_dark", smooth=True)
    # stakes
    NS = 24
    for k in range(NS):
        a = 2 * math.pi * k / NS
        p.add(bm_tube([W(a, 0.0, 0.0), W(a, BK_H, 0.0)], 0.0042, 6), "wicker_dark", smooth=True)
    # weavers going over and under the stakes, alternate rows offset
    for j in range(9):
        z = 0.011 + 0.0106 * j
        pts = [W(math.pi + 2 * math.pi * k / 96, z, 0.0052 * math.cos(NS / 2 * (math.pi + 2 * math.pi * k / 96) + j * math.pi)) for k in range(97)]
        p.add(bm_tube(pts, 0.0057, 5, cap=False), "wicker_light" if (j // 2) % 2 else "wicker", smooth=True)
    # rim: a thick round rod wrapped with a binding
    rim = [W(math.pi + 2 * math.pi * k / 96, BK_H + 0.004, 0.002) for k in range(97)]
    p.add(bm_tube(rim, 0.0115, 10, cap=False), "wicker", smooth=True)
    helix_wrap(p, rim, 0.0115, 0.0033, 42, "wicker_dark", 6)
    # handle: a bent rod through the fist, wrapped, bound to the rim with a cross lashing
    e1, e2 = W(-math.pi / 2, BK_H - 0.025, 0.0), W(math.pi / 2, BK_H - 0.025, 0.0)
    hpts = vc.bezier(e1, 2 * g - (e1 + e2) / 2, e2, 28)
    p.add(bm_tube(hpts, 0.0098, 12), "wicker", M(), smooth=True)
    helix_wrap(p, hpts[3:-3], 0.0098, 0.0032, 26, "wicker_dark")
    for e, sgn in ((e1, -1), (e2, 1)):
        c = W(sgn * math.pi / 2, BK_H + 0.004, 0.002)
        for dx in (-1, 1):
            p.add(bm_tube([c + Vector((dx * 0.016, 0, -0.014)), c + Vector((0, sgn * 0.004, 0.0)), c + Vector((-dx * 0.016, 0, 0.016))],
                          0.0032, 6), "wicker_dark", smooth=True)
    # contents: a leafy mound, leaves scattered on it, mint and sage sprigs, lavender, chamomile, a pink bloom
    rnd = random.Random(11)
    mound = []
    for k in range(26):
        u, v = rnd.uniform(-1, 1), rnd.uniform(-1, 1)
        if u * u + v * v > 1:
            continue
        mound.append((bc + Vector((0.068 * u, BK_EY * 0.068 * v, BK_H - 0.006 + 0.016 * (1 - u * u - v * v))), 0.026 + 0.006 * rnd.random()))
    mound += [(bc + Vector((0.0, 0.0, BK_H + 0.006)), 0.032), (bc + Vector((0.0, 0.06, BK_H - 0.004)), 0.03), (bc + Vector((0.0, -0.06, BK_H - 0.004)), 0.03)]
    mb = meta(mound, 0.01, 4.0)
    tree = BVHTree.FromBMesh(mb)
    p.add(mb, "herb_deep", None, smooth=True)

    def on_mound(x, y):
        hit = tree.ray_cast(bc + Vector((x, y, 0.4)), Vector((0, 0, -1)))
        return (hit[0], hit[1]) if hit[0] is not None else (bc + Vector((x, y, BK_H)), Vector((0, 0, 1)))

    # a rosette of big leaves in three rings: drooping over the rim, tilted, upright in the middle
    for ring_r, n_l, tilt, L, W_, off in ((0.066, 16, 0.14, 0.052, 0.027, 0.0), (0.05, 13, 0.45, 0.05, 0.026, 0.25), (0.032, 9, 0.85, 0.046, 0.024, 0.5), (0.012, 5, 1.6, 0.04, 0.022, 0.8)):
        for k in range(n_l):
            a = 2 * math.pi * k / n_l + off
            if ring_r > 0.06 and abs(math.sin(a)) > 0.93:
                continue                                   # keep clear of the handle at the rim
            loc, nrm = on_mound(ring_r * math.cos(a), BK_EY * ring_r * math.sin(a))
            outv = Vector((math.cos(a), BK_EY * math.sin(a), 0)).normalized()
            dirv = (outv + Vector((0, 0, tilt + 0.08 * rnd.uniform(-1, 1)))).normalized()
            nn = (Vector((0, 0, 1)) - dirv * dirv.z).normalized()
            sz = 0.9 + 0.2 * rnd.random()
            p.add(leaf_bm(L * sz, W_ * sz, 0.0045, 0.2, 0.28), ("herb", "herb_dark", "herb", "herb_sage")[(k + int(ring_r * 100)) % 4],
                  leaf_frame(loc - Vector((0, 0, 0.008)), nn, dirv), smooth=True)

    def sprig(base, d, length, leaf_mat, n_pairs=3, size=1.0):
        d = d.normalized()
        tip = base + d * length
        p.add(bm_tube([base, base + d * length * 0.5 + Vector((0, 0, 0.004)), tip], [0.0034, 0.003, 0.0024], 8), "herb_stem", smooth=True)
        side = d.cross(Vector((0, 0, 1)))
        if side.length < 1e-3:
            side = Vector((1, 0, 0))
        side.normalize()
        for i in range(n_pairs):
            f = 0.35 + 0.6 * i / max(n_pairs, 1)
            c = base + d * length * f
            sd = side if i % 2 == 0 else d.cross(side).normalized()
            sc = size * (1.0 - 0.18 * i)
            for sg in (-1, 1):
                dirv = (sd * sg + d * 0.7).normalized()
                p.add(leaf_bm(0.026 * sc, 0.014 * sc, 0.0036 * sc, 0.12, 0.25), leaf_mat, leaf_frame(c, d - dirv * d.dot(dirv), dirv), smooth=True)
        p.add(leaf_bm(0.02 * size, 0.011 * size, 0.003, 0.1, 0.3), leaf_mat, leaf_frame(tip - d * 0.004, d.cross(side), d), smooth=True)

    # mint on the outer side, sage-green sprigs at the ends
    for (x, y, dx, dy, L) in ((0.04, -0.07, 0.6, -0.5, 0.085), (0.055, 0.0, 0.85, 0.05, 0.095), (0.04, 0.07, 0.6, 0.55, 0.08)):
        base, _ = on_mound(x, y)
        sprig(base - Vector((0, 0, 0.01)), Vector((dx, dy, 1.0)), L, "herb")
    for (x, y, dx, dy, L) in ((-0.03, -0.1, -0.15, -0.8, 0.07), (-0.035, 0.1, -0.1, 0.85, 0.075)):
        base, _ = on_mound(x, y)
        sprig(base - Vector((0, 0, 0.01)), Vector((dx, dy, 1.0)), L, "herb_deep", 2, 1.1)
    # lavender spikes at the back end
    for (x, y, dx, dy, L) in ((-0.02, 0.06, -0.25, 0.45, 0.15), (0.0, 0.075, 0.05, 0.6, 0.14), (0.02, 0.055, 0.35, 0.4, 0.135)):
        base, _ = on_mound(x, y)
        d = Vector((dx, dy, 1.0)).normalized()
        tip = base + d * L
        p.add(bm_tube([base - Vector((0, 0, 0.01)), base + d * L * 0.5, tip], [0.0026, 0.0024, 0.002], 6), "herb_sage", smooth=True)
        side = d.cross(Vector((0, 0, 1))).normalized()
        up2 = side.cross(d)
        for i in range(16):
            f = 0.62 + 0.38 * i / 15
            c = base + d * L * f + (side * math.cos(i * 2.2) + up2 * math.sin(i * 2.2)) * 0.0042 * (1 - 0.5 * i / 15)
            p.add(sphere(6, 4), "lavender" if i % 3 else "lavender_dark", frame(c, d) @ S(0.0048, 0.0048, 0.0068), smooth=True)
    # chamomile and a pink bloom at the front end
    for (x, y, dx, dy, L, col, sz, pet) in ((0.0, -0.075, 0.1, -0.55, 0.06, "bloom_white", 0.75, 9), (0.03, -0.045, 0.45, -0.25, 0.07, "bloom_white", 0.7, 9),
                                             (-0.025, -0.05, -0.3, -0.35, 0.065, "bloom_pink", 1.0, 5)):
        base, _ = on_mound(x, y)
        d = Vector((dx, dy, 1.0)).normalized()
        tip = base + d * L
        p.add(bm_tube([base - Vector((0, 0, 0.01)), base + d * L * 0.5, tip], 0.0024, 6), "herb_stem", smooth=True)
        flower(p, tip, d + Vector((0, 0, 0.6)), Vector((0, 0, 1)), sz, col, "bloom_centre" if col == "bloom_pink" else "bloom_yellow", pet)
    return p, g


CFG.update(body=body, head=head, props=[("basket", "arm_l", basket)],
           closeup_z=0.98, shots=[("basket", (0.3, -0.12, 0.33), -60, 12, 1.1), ("back", (0, 0, 0.75), 160, 8, 2.4)])


# ---------------------------------------------------------------- checks

def report_clearances():
    """Print the closest approach of the basket to the skirt, and of the herbs to the fist."""
    g = vc.hand_c(1, CFG)
    bc = g + Vector((0.024, 0.0, -0.255))
    worst = 9.0
    for k in range(72):
        a = 2 * math.pi * k / 72
        for z in (0.0, 0.05, BK_H + 0.004):
            r = bk_r(z) + 0.012
            q = bc + Vector((r * math.cos(a), BK_EY * r * math.sin(a), z))
            rr = math.sqrt(q.x ** 2 + (q.y / SKIRT.ys) ** 2)
            worst = min(worst, rr - (SKIRT.rad(q.z) + 0.008))
    print("CLEAR basket-skirt %.3f  hand %s  basket centre %s" % (worst, tuple(round(v, 3) for v in g), tuple(round(v, 3) for v in bc)))
    rh = vc.hand_c(-1, CFG)
    print("CLEAR right hand %s skirt radius there %.3f" % (tuple(round(v, 3) for v in rh), SKIRT.rad(rh.z)))


def main():
    report_clearances()
    return vc.build("herbalist", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
