"""Captain Rook, retired adventurer, in the soft Animal Crossing style of Marlo the fisher (2026-10-23).
A calm old warrior, kind but tough: weathered tan skin, grey hair swept back in sculpted locks into a
ponytail tied with a leather band; a short full beard on the jaw and chin in a lighter grey, with short
sideburns that leave the temples and ears clear, and a moustache (metaballs); a raised pink scar running
diagonally from above his right brow, past the outer side of the eye, onto the cheek, with stitch ticks
(the eye stays a clean oval).
Outfit: a stitched leather jerkin over a linen shirt (laced V-neck, linen sleeves and a shirt tail
under the hem), three strap-and-buckle closures, a wide belt with a brass buckle, a hip pouch and an
old brass guild badge; a short slate-blue shoulder cape with a rolled collar, stitched hem and a
brass rosette clasp with a chain; one steel pauldron on his LEFT shoulder (part of arm_l): a domed
cap and three lames with brass rivets, leather straps and an arm strap with a buckle; leather
bracers and sturdy buckled boots.
Prop: `sword` (parented to body, origin at the grip), sheathed at his left hip and hung from the belt
by two leather frog straps: leather scabbard with a stitched seam, brass throat, band and chape, a
steel crossguard with knobbed quillons, a leather-wrapped grip with brass ferrules and a wheel pommel.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_slab
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "jerkin": "#8F5F3D", "jerkin_dark": "#65412A", "jerkin_patch": "#A87A52", "thread": "#E4CC9E",
    "belt": "#4F3525", "belt_dark": "#3A271B",
    "linen": "#E3D7BD", "linen_dark": "#C7B898",
    "cape": "#5D7A8E", "cape_dark": "#475F70", "cape_thread": "#B4C6CF", "enamel": "#466E86",
    "hair_grey": "#A19C94", "hair_grey_dark": "#8E8981", "beard_grey": "#C6C1B8",
    "scar_pink": "#B8665B", "scar_tick": "#8F4A41",
    "bracer": "#6E4A31", "strap": "#5A3B27",
    "trousers": "#5B5248", "boot": "#6B4731", "boot_cuff": "#87603F",
    "steel_edge": "#7F868D",
    "grip_core": "#4A3123", "grip_wrap": "#7B5236", "scabbard": "#5C3C29", "scabbard_dark": "#432B1D",
}, metal={"steel_edge": (0.75, 0.38)}, gloss={})


# ---------------------------------------------------------------- helpers (not in the kit)

def shell(outer, inner, closed=False):
    """Closed thin shell from two matching grids of points (rows x cols): the outer and inner
    surfaces joined along every border, so it has real thickness and correct normals.
    closed=True wraps the columns round (no side borders)."""
    bm = bmesh.new()
    O = [[bm.verts.new(p) for p in row] for row in outer]
    I = [[bm.verts.new(p) for p in row] for row in inner]
    nr, nc = len(O), len(O[0])
    cols = range(nc) if closed else range(nc - 1)
    for i in range(nr - 1):
        for j in cols:
            k = (j + 1) % nc
            bm.faces.new((O[i][j], O[i][k], O[i + 1][k], O[i + 1][j]))
            bm.faces.new((I[i][j], I[i + 1][j], I[i + 1][k], I[i][k]))
    for j in cols:                                  # top and bottom borders
        k = (j + 1) % nc
        bm.faces.new((O[0][k], O[0][j], I[0][j], I[0][k]))
        bm.faces.new((O[-1][j], O[-1][k], I[-1][k], I[-1][j]))
    if not closed:                                  # side borders
        for i in range(nr - 1):
            bm.faces.new((O[i][0], O[i + 1][0], I[i + 1][0], I[i][0]))
            bm.faces.new((O[i + 1][-1], O[i][-1], I[i][-1], I[i + 1][-1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def ribbon(pts, nrm, w, t=0.004):
    """Flat strap of width w and thickness t along pts, its face turned to the normals nrm."""
    pts = [Vector(p) for p in pts]
    outer, inner = [], []
    for i, p in enumerate(pts):
        tg = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        n = Vector(nrm[i] if isinstance(nrm, (list, tuple)) and not isinstance(nrm[0], float) else nrm).normalized()
        n = (n - tg * n.dot(tg)).normalized()
        s = tg.cross(n).normalized()
        outer.append([p - s * w / 2 + n * t / 2, p + s * w / 2 + n * t / 2])
        inner.append([p - s * w / 2 - n * t / 2, p + s * w / 2 - n * t / 2])
    return shell(outer, inner)


def basis(o, x, y, z):
    return Matrix(((x.x, y.x, z.x, o.x), (x.y, y.y, z.y, o.y), (x.z, y.z, z.z, o.z), (0, 0, 0, 1)))


def rrect(m, w, h, rc, n=6, z=0.0):
    """Closed rounded rectangle (w x h, corner radius rc) in the local XY plane of m."""
    pts = []
    for cx, cy, a0 in ((w / 2 - rc, h / 2 - rc, 0), (-w / 2 + rc, h / 2 - rc, 90), (-w / 2 + rc, -h / 2 + rc, 180), (w / 2 - rc, -h / 2 + rc, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append(m @ Vector((cx + rc * math.cos(a), cy + rc * math.sin(a), z)))
    return pts + [pts[0]]


def buckle(p, m, w, h, r=0.0045, mat="brass", tongue=True):
    """Brass buckle: a rounded frame, a centre bar and a tongue, in the local XY plane of m (Z out)."""
    p.add(bm_tube(rrect(m, w, h, min(w, h) * 0.28, 5, r), r, 8, cap=False), mat, smooth=True)
    p.add(bm_tube([m @ Vector((-w * 0.12, -h / 2 + r, r)), m @ Vector((-w * 0.12, h / 2 - r, r))], r * 0.8, 8), mat, smooth=True)
    if tongue:
        p.add(bm_tube([m @ Vector((-w * 0.12, 0, r * 1.6)), m @ Vector((w / 2 + r * 0.6, 0, r * 2.0))], r * 0.6, 6), "brass_dark", smooth=True)


# ---------------------------------------------------------------- body (jerkin, shirt, belt, cape)

JERKIN = vc.Garment([(0.232, 0.205), (0.242, 0.226), (0.24, 0.27), (0.231, 0.34), (0.226, 0.4), (0.222, 0.46), (0.214, 0.55),
                     (0.2, 0.63), (0.181, 0.69), (0.154, 0.74), (0.118, 0.785), (0.078, 0.815), (0.045, 0.83)], ys=0.84)
BELT_Z = (0.352, 0.402)

CAPE_YS = 0.72
CAPE = vc.Garment([(0.298, 0.44), (0.308, 0.52), (0.314, 0.6), (0.31, 0.65), (0.3, 0.69), (0.288, 0.72), (0.268, 0.75),
                   (0.24, 0.775), (0.2, 0.795), (0.15, 0.812), (0.11, 0.825)], ys=CAPE_YS)
CAPE_TOP = 0.825
CAPE_T = 0.011
ZB = [(-60, 0.748), (-20, 0.742), (10, 0.735), (35, 0.69), (60, 0.54), (90, 0.455), (120, 0.47), (150, 0.53), (180, 0.585),
      (212, 0.655), (240, 0.712)]


def cape_bottom(phi):
    for (a0, z0), (a1, z1) in zip(ZB, ZB[1:]):
        if a0 <= phi <= a1:
            t = (phi - a0) / (a1 - a0)
            t = 0.5 - 0.5 * math.cos(math.pi * t)
            return z0 + (z1 - z0) * t
    return ZB[-1][1]


def cape_pt(phi, z, out=0.0):
    t = max(0.0, (CAPE_TOP - z) / (CAPE_TOP - 0.44))
    r = CAPE.rad(z) + out + 0.007 * t ** 1.4 * math.sin(math.radians(phi) * 6 + 0.6)
    a = math.radians(phi)
    return Vector((r * math.cos(a), CAPE_YS * r * math.sin(a), z))


def vpanel(G, p, mat, rows, out=0.005, n=8):
    """Panel lying on a garment, given as rows (z, phi0, phi1) from bottom to top (V-necks, wedges)."""
    grid = [[G.pt(a0 + (a1 - a0) * k / n, z, out) for k in range(n + 1)] for z, a0, a1 in rows]
    inner = [[G.pt(a0 + (a1 - a0) * k / n, z, out - 0.004) for k in range(n + 1)] for z, a0, a1 in rows]
    p.add(shell(grid, inner), mat, smooth=True)


def cape(p):
    cols = [-60 + 2.5 * j for j in range(121)]
    nr = 18
    outer, inner = [], []
    for i in range(nr + 1):
        t = i / nr
        ro, ri = [], []
        for phi in cols:
            z = CAPE_TOP + (cape_bottom(phi) - CAPE_TOP) * t
            ro.append(cape_pt(phi, z))
            ri.append(cape_pt(phi, z, -CAPE_T))
        outer.append(ro)
        inner.append(ri)
    worst = 1.0
    for s in (-1, 1):
        pv = vc.shoulder(s, CFG)
        dd = vc.arm_dir(s, CFG)
        for row in inner:
            for q in row:
                t = max(0.0, min((q - pv).dot(dd), 0.19))
                worst = min(worst, (q - (pv + dd * t)).length - (0.075 if t < 0.02 else 0.079))
    print("CLEARANCE cape-arms %.4f" % worst)
    p.add(shell(outer, inner), "cape", smooth=True)
    mid =lambda phi, z: cape_pt(phi, z, -CAPE_T / 2)
    # rolled hem, front edge trims and a rolled collar along the top
    p.add(bm_tube([mid(phi, cape_bottom(phi)) for phi in cols], 0.0105, 10, cap=True), "cape_dark", smooth=True)
    for phi in (cols[0], cols[-1]):
        zb = cape_bottom(phi)
        p.add(bm_tube([mid(phi, CAPE_TOP + (zb - CAPE_TOP) * k / 10) for k in range(11)], 0.0085, 10), "cape_dark", smooth=True)
    p.add(bm_tube([mid(phi, CAPE_TOP) + Vector((0, 0, 0.004)) for phi in cols], 0.015, 12), "cape_dark", smooth=True)
    # running stitch above the hem
    st = [cape_pt(phi, cape_bottom(phi) + 0.026, 0.0025) for phi in cols[2:-2]]
    for k in range(0, len(st) - 1, 30):
        stitch(p, st[k:k + 31], "cape_thread")
    # brass rosette clasp at the collar with a little chain across the chest
    zc = 0.752
    ends = []
    for phi in (cols[0] + 1.5, cols[-1] - 1.5):
        c = cape_pt(phi, zc, 0.006)
        n = Vector((math.cos(math.radians(phi)) * 0.35, -1.0, 0.15)).normalized()
        m = frame(c, n)
        p.add(lathe([(0.0, 0.0), (0.021, 0.0), (0.024, 0.004), (0.022, 0.008), (0.016, 0.011), (0.009, 0.013), (0.0, 0.0135)], 32,
                    cap_bottom=True), "brass", m, smooth=True)
        for k in range(8):
            a = 2 * math.pi * k / 8
            p.add(sphere(10, 6), "brass_dark", m @ Matrix.Translation((0.0175 * math.cos(a), 0.0175 * math.sin(a), 0.006)) @ S(0.0042), smooth=True)
        p.add(sphere(14, 8), "enamel", m @ Matrix.Translation((0, 0, 0.012)) @ S(0.0075, 0.0075, 0.004), smooth=True)
        ends.append(m @ Vector((0, 0, 0.004)))
    a, b = ends
    chain = vc.bezier(a, (a + b) / 2 + Vector((0, -0.012, -0.03)), b, 9)
    for k in range(1, 9):
        q0, q1 = chain[k - 1], chain[k]
        c = (q0 + q1) / 2
        d = (q1 - q0).normalized()
        side = d.cross(Vector((0, -1, 0))).normalized() if k % 2 else Vector((0, -1, 0))
        m = basis(c, d, side, d.cross(side).normalized())
        p.add(bm_tube(ring_pts(m, 0.0115, 14, 0.0, 0.0062), 0.0022, 6, cap=False), "brass", smooth=True)


def body():
    p = Part("body")
    G = JERKIN
    G.mesh(p, "jerkin")
    # linen shirt tail peeking under the jerkin hem
    p.add(lathe([(0.226, 0.178), (0.233, 0.186), (0.235, 0.205), (0.232, 0.215)], 64, ys=G.ys), "linen", smooth=True)
    p.add(bm_tube([Vector((0.229 * math.cos(a), G.ys * 0.229 * math.sin(a), 0.18)) for a in [2 * math.pi * k / 64 for k in range(65)]],
                  0.006, 8, cap=False), "linen_dark", smooth=True)
    # rolled hem with stitching above it
    G.hem(p, 0.222, 0.016, "jerkin_dark")
    G.stitch_ring(p, 0.252, matname="thread")
    # side and back seams with stitching either side
    for phi in (0, 180, 90):
        p.add(bm_tube(G.line(phi, 0.235, 0.66 if phi != 90 else 0.72, 0.002), 0.004, 6), "jerkin_dark", smooth=True)
        for dp in (-4.5, 4.5):
            stitch(p, G.line(phi + dp, 0.27, 0.64, 0.004), "thread")
    # front: centre seam, stitching, and the laced linen V-neck
    p.add(bm_tube(G.line(-90, 0.232, 0.676, 0.004), 0.0048, 6), "jerkin_dark", smooth=True)
    for dp in (-4.5, 4.5):
        stitch(p, G.line(-90 + dp, 0.26, 0.66, 0.006), "thread")
    vrows = [(0.674 + 0.012 * k, -90 - 2.4 * k ** 1.15, -90 + 2.4 * k ** 1.15) for k in range(12)]
    vpanel(G, p, "linen", vrows, 0.004)
    for s in (-1, 1):
        edge = [G.pt(-90 + s * (2.4 * k ** 1.15 + 1.0), 0.674 + 0.012 * k, 0.008) for k in range(12)]
        p.add(bm_tube(edge, 0.0075, 10), "jerkin_dark", smooth=True)
        stitch(p, [G.pt(-90 + s * (2.4 * k ** 1.15 + 6.0), 0.684 + 0.012 * k, 0.006) for k in range(1, 11)], "thread")
    # criss-cross lace over the V with a little bow
    lz = (0.7, 0.728, 0.756)
    eye = lambda s, z: G.pt(-90 + s * (2.4 * ((z - 0.674) / 0.012) ** 1.15 - 1.5), z, 0.01)
    for k in range(len(lz) - 1):
        for s in (-1, 1):
            p.add(bm_tube([eye(s, lz[k]), eye(-s, lz[k + 1])], 0.0026, 6), "cord", smooth=True)
    for s in (-1, 1):
        for z in lz:
            p.add(sphere(10, 6), "brass", G.frame(-90 + s * (2.4 * ((z - 0.674) / 0.012) ** 1.15 - 1.5), z, 0.009) @ S(0.0045, 0.0045, 0.002), smooth=True)
    bow = G.pt(-90, 0.766, 0.013)
    for s in (-1, 1):
        p.add(sphere(14, 8), "cord", M(bow + Vector((s * 0.011, -0.003, 0.001)), (0, s * 20, 0), (0.011, 0.004, 0.006)), smooth=True)
        p.add(bm_tube([bow, bow + Vector((s * 0.006, -0.004, -0.02)), bow + Vector((s * 0.01, -0.006, -0.034))], 0.0022, 6), "cord", smooth=True)
    p.add(sphere(10, 6), "cord", M(bow, scale=0.0045), smooth=True)
    # linen shirt collar (a soft stand collar) and the neck
    p.add(lathe([(0.071, 0.79), (0.079, 0.8), (0.082, 0.82), (0.079, 0.838), (0.072, 0.842)], 40, ys=0.95), "linen", smooth=True)
    p.add(bm_cyl(0.06, 0.058, 0.12, 24), "skin_tan", M((0, 0, 0.74)), smooth=True)
    # three strap-and-buckle closures across the front
    for z in (0.475, 0.56, 0.645):
        G.panel(p, -106, -79, z - 0.0125, z + 0.0125, "strap", 0.007, 10)
        stitch(p, G.arc(-104, -80, z + 0.006, 0.0105, 10), "thread", 0.009, 0.006, 0.0018)
        stitch(p, G.arc(-104, -80, z - 0.006, 0.0105, 10), "thread", 0.009, 0.006, 0.0018)
        m = G.frame(-81, z, 0.012)
        buckle(p, m, 0.03, 0.036, 0.0036)
        p.add(sphere(12, 8), "brass", G.frame(-104, z, 0.012) @ S(0.0055, 0.0055, 0.003), smooth=True)
    # wide belt with stitched edges, a big brass buckle, a keeper and a pierced tongue end
    z0, z1 = BELT_Z
    G.panel(p, -180, 180, z0, z1, "belt", 0.007, 64)
    for z in (z0, z1):
        G.hem(p, z, 0.0042, "belt_dark", out=0.009)
    for z in (z0 + 0.008, z1 - 0.008):
        G.stitch_ring(p, z, out=0.011, matname="thread")
    zc = (z0 + z1) / 2
    G.panel(p, -88, -62, z0 + 0.007, z1 - 0.007, "belt", 0.013, 10)          # tongue end over the belt
    p.add(sphere(16, 10), "belt", G.frame(-62, zc, 0.009) @ S(0.012, 0.018, 0.006), smooth=True)
    for phi in (-79, -73, -67):
        p.add(sphere(8, 6), "belt_dark", G.frame(phi, zc, 0.017) @ S(0.0035, 0.0035, 0.002), smooth=True)
    G.panel(p, -77, -73, z0 - 0.004, z1 + 0.004, "belt_dark", 0.018, 3)      # keeper
    m = G.frame(-90, zc, 0.02)
    p.add(bm_tube(rrect(m, 0.066, 0.064, 0.016, 6), 0.0068, 10, cap=False), "brass", smooth=True)
    p.add(bm_tube([m @ Vector((-0.012, -0.03, 0.003)), m @ Vector((-0.012, 0.03, 0.003))], 0.0055, 10), "brass", smooth=True)
    p.add(bm_tube([m @ Vector((-0.012, 0, 0.007)), m @ Vector((0.03, 0, 0.009))], 0.0042, 8), "brass_dark", smooth=True)
    # leather hip pouch on his right with a flap and a brass stud
    pm = G.frame(-152, 0.315, 0.03)
    p.add(bm_box(0.078, 0.07, 0.034, bevel=0.013, segs=3), "jerkin_dark", pm, smooth=True)
    p.add(bm_box(0.084, 0.04, 0.016, bevel=0.007, segs=3), "strap", pm @ Matrix.Translation((0, 0.02, 0.015)) @ M(rot=(-8, 0, 0)), smooth=True)
    p.add(sphere(12, 8), "brass", pm @ Matrix.Translation((0, 0.004, 0.025)) @ S(0.007, 0.007, 0.004), smooth=True)
    stitch(p, [pm @ Vector((x, -0.03, 0.018)) for x in (-0.03, 0.03)], "thread")
    p.add(ribbon([pm @ Vector((0, 0.03, -0.004)), G.pt(-152, z0 + 0.012, 0.012)], [G.normal(-152, 0.36)] * 2, 0.022), "strap", smooth=True)
    # stitched leather patch on the skirt (an old repair)
    G.panel(p, -136, -116, 0.262, 0.322, "jerkin_patch", 0.006, 8)
    border = G.arc(-134, -118, 0.268, 0.009, 8) + G.line(-118, 0.268, 0.316, 0.009, 4) + list(reversed(G.arc(-134, -118, 0.316, 0.009, 8))) \
        + list(reversed(G.line(-134, 0.268, 0.316, 0.009, 4)))
    stitch(p, border, "thread", 0.01, 0.006, 0.002)
    # old brass guild badge: a little shield with an enamel field and a star
    bmx = G.frame(-63, 0.6, 0.007)
    sh = [(-0.021, 0.022), (0.021, 0.022), (0.021, 0.002), (0.013, -0.015), (0.0, -0.025), (-0.013, -0.015), (-0.021, 0.002)]
    p.add(bm_slab(sh, 0.005), "brass", bmx)
    p.add(bm_slab([(x * 0.74, y * 0.74 + 0.001) for x, y in sh], 0.0035), "enamel", bmx @ Matrix.Translation((0, 0, 0.004)))
    p.add(sphere(12, 8), "gold", bmx @ Matrix.Translation((0, 0.002, 0.0075)) @ S(0.0055, 0.0055, 0.002), smooth=True)
    cape(p)
    return p


# ---------------------------------------------------------------- head

NECK = 0.82
HD = vc.Head((0, 0, 1.09), 0.305, 0.282, 0.276)
def sdir(az, el):
    """Direction from azimuth (degrees from the front toward his left) and elevation."""
    az, el = math.radians(az), math.radians(el)
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


TIE = sdir(180, -27)          # low ponytail at the nape


def hsurf(u, out=0.0):
    """Point on the head ellipsoid in the direction (sphere space) u, pushed out along the normal."""
    u = Vector(u).normalized()
    a, b, c = HD.a, HD.b, HD.c
    p = Vector((a * u.x, b * u.y, c * u.z))
    n = Vector((u.x / a, u.y / b, u.z / c)).normalized()
    return HD.hc + p + n * out


def hairline(az):
    az = abs(az)
    if az < 50:
        return 37.0
    if az < 95:
        return 37.0 - 15.0 * (az - 50) / 45
    if az < 135:
        return 22.0 - 44.0 * (az - 95) / 40
    return -22.0 - 14.0 * (az - 135) / 45


def dense(pts, radii, step=0.35):
    """Metaball elements along a polyline, spaced at `step` x the local radius (smooth, no beads)."""
    pts = [Vector(p) for p in pts]
    L = plen(pts)
    out, s = [], 0.0
    while s <= L + 1e-9:
        f = s / max(L, 1e-9)
        k = min(int(f * (len(radii) - 1)), len(radii) - 2)
        u = f * (len(radii) - 1) - k
        r = radii[k] + (radii[k + 1] - radii[k]) * u
        out.append((polyline_at(pts, s), r))
        s += max(step * r, 0.003)
    return out


def hair(hp):
    els = []
    # smooth base shell behind the hairline (an even Fibonacci spread of directions)
    N = 1500
    ear = [Vector((s, 0.03, -0.13)).normalized() for s in (-1, 1)]
    for i in range(N):
        z = 1 - 2 * (i + 0.5) / N
        rr = math.sqrt(1 - z * z)
        t = i * math.pi * (3 - math.sqrt(5))
        u = Vector((rr * math.cos(t), rr * math.sin(t), z))
        az = math.degrees(math.atan2(u.x, -u.y))
        el = math.degrees(math.asin(z))
        if el < hairline(az) or any(u.angle(e) < math.radians(24) for e in ear):
            continue
        els.append((hsurf(u, -0.012), 0.031))
    # a clean rolled hairline at the front and temples
    front = [hsurf(sdir(az, hairline(az) + 1.0), 0.0) for az in range(-88, 89, 4)]
    els += dense(front, [0.026, 0.03, 0.03, 0.026])
    # swept-back locks: smooth ridges from the hairline to the tie at the nape
    locks = [(az, 38.0, (math.sin(math.radians(az)) * 0.5, 0.55, 1.0)) for az in (-34, -11, 11, 34)]
    for s in (-1, 1):
        locks += [(s * 58, 34.5, (s * 0.85, 0.75, 0.55)), (s * 82, 26.0, (s * 1.0, 0.95, 0.05)), (s * 118, 2.0, (s * 0.55, 1.0, -0.3))]
    for az, el, ctrl in locks:
        sx = (1 if az > 0 else -1) if az else 0
        end = (TIE + Vector((0.07 * sx, 0, 0))).normalized()
        dirs = vc.bezier(sdir(az, el), Vector(ctrl).normalized(), end, 40)
        pts = [hsurf(u, 0.004 + 0.009 * math.sin(math.pi * k / 40)) for k, u in enumerate(dirs)]
        els += dense(pts, [0.027, 0.029, 0.028, 0.024])
    els.append((hsurf(TIE, 0.012), 0.04))
    hp.add(meta(els, 0.008, keep=0.33), "hair_grey", None, smooth=True)
    # the ponytail: three fused locks, pinched at the tie, hanging down and curling out a little
    s1 = hsurf(TIE, 0.03)
    spine = [hsurf(TIE, -0.01), s1, s1 + Vector((0, 0.018, -0.05)), s1 + Vector((0, 0.016, -0.115)), s1 + Vector((0, 0.004, -0.17)),
             s1 + Vector((0, 0.018, -0.215))]
    L = plen(spine)
    ft = 0.052 / L                       # where the tie sits along the spine
    prof = lambda f: 0.024 if f < ft + 0.03 else (0.024 + 0.013 * min((f - ft - 0.03) / 0.16, 1.0)) if f < ft + 0.19 else         0.037 - 0.029 * ((f - ft - 0.19) / (1 - ft - 0.19)) ** 1.25
    for lx, ly, ph in ((-0.5, -0.15, 0.0), (0.5, -0.15, 2.0), (0.0, 0.45, 4.0), (0.0, -0.35, 1.0)):
        pts, rad = [], []
        for k in range(41):
            f = k / 40
            r = prof(f)
            q = polyline_at(spine, L * f)
            pts.append(q + Vector((lx * r + 0.004 * math.sin(f * 7 + ph), ly * r, 0)))
            rad.append(r * 0.8)
        hp.add(meta(dense(pts, rad, 0.3), 0.0055), "hair_grey", None, smooth=True)
    # leather tie: two wraps and a small knot with loose ends
    d = (spine[2] - spine[1]).normalized()
    for f in (ft - 0.012, ft + 0.03):
        c = polyline_at(spine, L * f)
        hp.add(bm_tube(ring_pts(frame(c, d), 0.0375, 32), 0.0068, 8, cap=False), "strap", smooth=True)
    kc = polyline_at(spine, L * (ft + 0.01)) + Vector((0, 0.04, 0.002))
    hp.add(sphere(16, 10), "strap", M(kc, scale=(0.011, 0.0085, 0.0095)), smooth=True)
    for s in (-1, 1):
        hp.add(bm_tube([kc, kc + Vector((s * 0.012, 0.007, -0.018)), kc + Vector((s * 0.015, 0.006, -0.036))], [0.0042, 0.0036, 0.003], 8), "strap", smooth=True)


def beard(hp):
    """Short full beard on the lower jaw and chin, thin along the cheeks, with short sideburns that stop
    at ear-middle height (clear skin and the ear between them and the hair)."""
    H = HD.H
    els = []
    for s in (-1, 1):
        jaw = [H(s * 0.293, -0.066, -0.035), H(s * 0.285, -0.07, -0.07), H(s * 0.262, -0.085, -0.12), H(s * 0.225, -0.1, -0.165),
               H(s * 0.18, -0.13, -0.2), H(s * 0.12, -0.16, -0.226), H(s * 0.06, -0.178, -0.243), H(0, -0.183, -0.25)]
        els += dense(jaw, [0.012, 0.015, 0.019, 0.025, 0.034, 0.04, 0.045, 0.046], 0.3)
        els += [(H(s * 0.13, -0.09, -0.22), 0.045),                                   # fill under the jaw
                (H(s * 0.062, -0.18, -0.285), 0.036), (H(s * 0.036, -0.166, -0.31), 0.029)]   # square chin corners
    els += [(H(0, -0.11, -0.24), 0.055), (H(0, -0.184, -0.29), 0.036), (H(0, -0.168, -0.312), 0.029)]
    hp.add(meta(els, 0.0062), "beard_grey", None, smooth=True)
    for s in (-1, 1):
        mo = vc.bezier(H(s * 0.012, -0.259, -0.108), H(s * 0.075, -0.262, -0.112), H(s * 0.12, -0.212, -0.17), 16)
        hp.add(meta(dense(mo, [0.022, 0.027, 0.026, 0.02, 0.012], 0.3), 0.005), "beard_grey", None, smooth=True)


def brows(hp):
    left = [(0.048, 0.084), (0.08, 0.098), (0.115, 0.102), (0.148, 0.095), (0.171, 0.082)]
    # his right brow is split where the scar crosses it (x ~ 0.113)
    for s, rng in ((1, (0.0, 1.0)), (-1, (0.0, 0.26)), (-1, (0.8, 1.0))):
        curve = [HD.fpt(s * x, z, 0.012)[0] for x, z in left]
        L = plen(curve)
        sub = []
        for i in range(21):
            f = rng[0] + (rng[1] - rng[0]) * i / 20
            sub.append(polyline_at(curve, L * f))
        rad = [0.018 + 0.006 * math.sin(math.pi * (rng[0] + (rng[1] - rng[0]) * i / 4)) for i in range(5)]
        hp.add(meta(dense(sub, rad, 0.3), 0.005), "beard_grey", None, smooth=True)


def scar(hp):
    """One raised scar line on his right side: from above the brow, diagonally past the outer side of
    the eye (it never crosses the eye) and down onto the cheek, with three stitch ticks across it."""
    seg = []
    for k in range(17):
        t = k / 16
        z = 0.172 - 0.29 * t
        x = -0.094 - 0.278 * (0.172 - z) - 0.006 * math.sin(math.pi * t)
        seg.append((x, z))
    pts = [HD.fpt(x, z, 0.006)[0] for x, z in seg]
    n = len(pts)
    hp.add(bm_tube(pts, [0.0025, 0.0045] + [0.0062] * (n - 4) + [0.0045, 0.0025], 10), "scar_pink", smooth=True)
    for t in (0.3, 0.62, 0.8):
        i = int(t * (n - 1))
        p, nrm = HD.fpt(*seg[i], 0.011)
        tg = (pts[i + 1] - pts[i - 1]).normalized()
        side = tg.cross(nrm).normalized()
        hp.add(bm_tube([p - side * 0.011, p + side * 0.011], 0.0021, 6), "scar_tick", smooth=True)


def head():
    hp = Part("head")
    HD.face(hp, skin="skin_tan", nose="nose_tan", mouth=None)
    HD.mouth(hp, z=-0.163, kind="smile", w=0.017)
    brows(hp)
    scar(hp)
    hair(hp)
    beard(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

PV_L = Vector((0.19, 0.0, 0.70))
P_TILT = math.radians(30)
P_A = Vector((math.sin(P_TILT), 0, math.cos(P_TILT)))
P_X = Vector((math.cos(P_TILT), 0, -math.sin(P_TILT)))
P_Y = Vector((0, 1, 0))
P_C = PV_L + Vector((0.016, 0, 0.006))


def pdir(th, ps):
    th, ps = math.radians(th), math.radians(ps)
    return P_A * math.cos(th) + (P_X * math.cos(ps) + P_Y * math.sin(ps)) * math.sin(th)


def lame(p, th0, th1, R0, R1, ps=100, t=0.006):
    nth, nps = 6, 40
    rows_o, rows_i = [], []
    for i in range(nth + 1):
        th = th0 + (th1 - th0) * i / nth
        R = R0 + (R1 - R0) * i / nth
        rows_o.append([P_C + pdir(th, -ps + 2 * ps * j / nps) * R for j in range(nps + 1)])
        rows_i.append([P_C + pdir(th, -ps + 2 * ps * j / nps) * (R - t) for j in range(nps + 1)])
    p.add(shell(rows_o, rows_i), "steel", smooth=True)
    p.add(bm_tube([P_C + pdir(th1, -ps + 2 * ps * j / nps) * (R1 - t / 2) for j in range(nps + 1)], t * 0.85, 8), "steel_edge", smooth=True)
    for psr in (-55, 0, 55):
        q = P_C + pdir(th0 + 7, psr) * (R0 + 0.0008)
        p.add(sphere(10, 6), "brass", frame(q, pdir(th0 + 7, psr)) @ S(0.0075, 0.0075, 0.004), smooth=True)


def pauldron(p, pv, d):
    # domed cap
    capm = basis(P_C, P_X, P_Y, P_A)
    R = 0.108
    prof = [(R * math.sin(math.radians(th)), R * math.cos(math.radians(th))) for th in range(52, 2, -5)]
    p.add(lathe(prof, 56, cap_top=True), "steel", capm, smooth=True)
    p.add(lathe([(r - 0.006, z - 0.0008) for r, z in prof], 56, cap_top=True), "steel_edge", capm, smooth=True)
    p.add(bm_tube(ring_pts(capm, R * math.sin(math.radians(52)) - 0.001, 56, R * math.cos(math.radians(52))), 0.006, 8, cap=False), "steel_edge", smooth=True)
    for k in range(8):
        q = P_C + pdir(42, 22.5 + 45 * k) * (R + 0.0005)
        p.add(sphere(10, 6), "brass", frame(q, pdir(42, 22.5 + 45 * k)) @ S(0.0075, 0.0075, 0.004), smooth=True)
    # three lames below, each overlapping the one above
    lame(p, 46, 70, 0.114, 0.117)
    lame(p, 64, 86, 0.12, 0.123, 96)
    lame(p, 80, 101, 0.126, 0.129, 90)
    # leather straps down the front and back, riveted to each lame
    for psr in (-62, 62):
        pts, nrm = [], []
        for th in range(36, 103, 4):
            Rr = 0.111 if th < 46 else 0.119 if th < 66 else 0.125 if th < 82 else 0.131
            pts.append(P_C + pdir(th, psr) * (Rr + 0.004))
            nrm.append(pdir(th, psr))
        p.add(ribbon(pts, nrm, 0.02, 0.0045), "strap", smooth=True)
        for th, Rr in ((58, 0.119), (75, 0.125), (92, 0.131)):
            q = P_C + pdir(th, psr) * (Rr + 0.0075)
            p.add(sphere(10, 6), "brass", frame(q, pdir(th, psr)) @ S(0.005, 0.005, 0.003), smooth=True)
    # arm strap round the upper sleeve with a small buckle on the outside
    c = pv + d * 0.13
    r = 0.072 * 1.01 + 0.005
    am = frame(c, d)
    p.add(bm_tube(ring_pts(am, r, 40), 0.0075, 8, cap=False), "strap", smooth=True)
    out = Vector((1, 0, 0))
    out = (out - d * out.dot(d)).normalized()
    bm_ = basis(c + out * (r + 0.006), d.cross(out).normalized(), -d, out)
    buckle(p, bm_, 0.02, 0.024, 0.0028)


def arm_extras(p, side, pv, d):
    if side > 0:
        pauldron(p, pv, d)


def boot_strap(p, side, x):
    c = Vector((x, 0.0, 0.165))
    p.add(bm_tube([c + Vector((0.077 * math.cos(a), 0.005 + 0.079 * math.sin(a), 0.0)) for a in [2 * math.pi * k / 40 for k in range(41)]],
                  0.0085, 8, cap=False), "strap", smooth=True)
    m = basis(c + Vector((side * 0.086, 0.0, 0.0)), Vector((0, -side, 0)), Vector((0, 0, 1)), Vector((side, 0, 0)))
    buckle(p, m, 0.024, 0.026, 0.0032)
    stitch(p, [Vector((x - side * 0.0, -0.068, z)) for z in (0.11, 0.15, 0.2, 0.25)], "thread", 0.011, 0.007, 0.0022)


CFG = dict(
    neck_z=NECK, shoulder_x=0.19, shoulder_z=0.70, hip_x=0.092, hip_z=0.36,
    arm_len=0.27, sleeve_r=0.072, sleeve_mat="linen", cuff_mat="bracer", stitch_mat="thread", hand_mat="skin_tan", arm_fn=arm_extras,
    leg_r=0.064, pants_mat="trousers", boot_mat="boot", boot_top=0.27, boot_trim="boot_cuff", leg_fn=boot_strap,
)


# ---------------------------------------------------------------- prop: the sword

def inside_report(name, pts):
    """How deep the prop goes into the jerkin, the cape and the legs (negative = clearance)."""
    worst_j, worst_l = -1.0, -1.0
    for q in pts:
        if 0.2 < q.z < 0.83:
            reff = math.hypot(q.x, q.y / JERKIN.ys)
            worst_j = max(worst_j, JERKIN.rad(q.z) - reff)
        if q.z < 0.33:
            for s in (-1, 1):
                worst_l = max(worst_l, 0.078 - math.hypot(q.x - s * 0.092, q.y))
    print("CLEARANCE", name, "jerkin %.4f" % worst_j, "legs %.4f" % worst_l)


def sword():
    p = Part("sword")
    phi = -36.0
    G = JERKIN
    throat = G.pt(phi, 0.383, 0.052)
    d = Vector((0.3, 0.6, -0.74)).normalized()             # down the scabbard, toward the tip
    Z = -d
    n = G.normal(phi, 0.38, 0.0)
    n = (n - Z * n.dot(Z)).normalized()
    X = n.cross(Z).normalized()
    Y = Z.cross(X).normalized()
    m = basis(throat, X, Y, Z)
    flat = S(1, 0.56, 1)
    # leather scabbard, brass chape, band and throat
    sc = [(0.004, -0.36), (0.012, -0.355), (0.017, -0.344), (0.019, -0.33), (0.0195, -0.29), (0.021, -0.2), (0.0225, -0.1), (0.024, -0.02), (0.0242, 0.0)]
    p.add(lathe(sc, 32, cap_top=True), "scabbard", m @ flat, smooth=True)
    p.add(lathe([(0.0, -0.373), (0.006, -0.372), (0.013, -0.366), (0.0185, -0.354), (0.021, -0.338), (0.0215, -0.31), (0.0222, -0.298), (0.0205, -0.294)], 32),
          "brass", m @ flat, smooth=True)
    p.add(sphere(14, 10), "brass", m @ Matrix.Translation((0, 0, -0.372)) @ S(0.0075, 0.0055, 0.0075), smooth=True)
    for z, h in ((-0.165, 0.013), (-0.024, 0.03)):
        r = 0.0225 if z < -0.1 else 0.0242
        p.add(lathe([(r + 0.0008, z - h / 2 - 0.002), (r + 0.003, z - h / 2), (r + 0.0026, z), (r + 0.003, z + h / 2), (r + 0.0008, z + h / 2 + 0.002)], 32),
              "brass", m @ flat, smooth=True)
    p.add(lathe([(0.0, 0.003), (0.027, 0.003), (0.0275, 0.008), (0.0, 0.008)], 32), "brass_dark", m @ flat, smooth=True)
    # stitched seam down the outer face near the back edge
    t = math.radians(140)
    seam = []
    for z in [-0.285 + 0.25 * k / 10 for k in range(11)]:
        r = vc.Garment(sc).rad(z) * 1.04
        seam.append(m @ Vector((r * math.cos(t), 0.56 * r * math.sin(t) + 0.0012, z)))
    stitch(p, seam, "thread", 0.011, 0.007, 0.0019)
    p.add(bm_tube([m @ Vector((0.0, 0.56 * 0.0215 + 0.0005, z)) for z in (-0.28, -0.2, -0.12, -0.05)], 0.0016, 5), "scabbard_dark", smooth=True)
    # crossguard: steel quillons curving toward the blade, knobbed ends, a centre block
    q = [(-0.066, 0, 0.004), (-0.046, 0, 0.014), (-0.02, 0, 0.018), (0.0, 0, 0.018), (0.02, 0, 0.018), (0.046, 0, 0.014), (0.066, 0, 0.004)]
    p.add(bm_tube([m @ Vector(v) for v in q], [0.0075, 0.009, 0.0105, 0.011, 0.0105, 0.009, 0.0075], 14), "steel", smooth=True)
    for sx in (-1, 1):
        p.add(sphere(16, 10), "steel", m @ Matrix.Translation((sx * 0.068, 0, 0.002)) @ S(0.0115), smooth=True)
    p.add(sphere(20, 12), "steel", m @ Matrix.Translation((0, 0, 0.018)) @ S(0.02, 0.0135, 0.016), smooth=True)
    # wrapped grip with brass ferrules
    g0, g1 = 0.03, 0.118
    p.add(bm_cyl(0.0122, 0.0118, g1 - g0, 20), "grip_core", m @ Matrix.Translation((0, 0, g0)), smooth=True)
    hel = [m @ Vector((0.0126 * math.cos(a), 0.0126 * math.sin(a), g0 + 0.004 + (g1 - g0 - 0.008) * a / (2 * math.pi * 6))) for a in [2 * math.pi * 6 * k / 120 for k in range(121)]]
    p.add(bm_tube(hel, 0.0042, 8), "grip_wrap", smooth=True)
    for z in (g0, g1):
        p.add(lathe([(0.0135, z - 0.005), (0.0158, z - 0.003), (0.0158, z + 0.003), (0.0135, z + 0.005)], 24), "brass", m, smooth=True)
    # wheel pommel with bosses and a peen
    pom = [(0.006, 0.122), (0.014, 0.125), (0.02, 0.132), (0.022, 0.142), (0.02, 0.152), (0.013, 0.159), (0.005, 0.161)]
    p.add(lathe(pom, 32, cap_top=True, cap_bottom=True), "brass", m @ S(1, 0.62, 1), smooth=True)
    for sy in (-1, 1):
        p.add(sphere(16, 10), "brass_dark", m @ Matrix.Translation((0, sy * 0.0125, 0.142)) @ S(0.0095, 0.004, 0.0095), smooth=True)
    p.add(sphere(12, 8), "brass_dark", m @ Matrix.Translation((0, 0, 0.162)) @ S(0.006, 0.006, 0.004), smooth=True)
    # leather frog: two straps from the belt to the throat and the band
    belt_mid = (BELT_Z[0] + BELT_Z[1]) / 2
    for zl, bphi, bz in ((-0.02, -40.0, belt_mid + 0.004), (-0.165, -12.0, belt_mid - 0.006)):
        a = m @ Vector((0, -0.56 * 0.024 - 0.003, zl))
        b = G.pt(bphi, bz, 0.013)
        ctrl = (a + b) / 2 + G.normal(bphi, bz, 0.0) * 0.012
        pts = vc.bezier(a, ctrl, b, 8)
        p.add(ribbon(pts, [G.normal(bphi, bz, 0.0)] * len(pts), 0.019, 0.0045), "strap", smooth=True)
        p.add(sphere(10, 6), "brass", M(b + G.normal(bphi, bz, 0.0) * 0.004, scale=0.0055), smooth=True)
    inside_report("sword", [v.co.copy() for v in p.bm.verts])
    grip = m @ Vector((0, 0, (g0 + g1) / 2))
    return p, grip


CFG.update(body=body, head=head, props=[("sword", "body", sword)],
           closeup_z=1.0, shots=[("sword", (0.25, -0.06, 0.45), -72, 8, 1.25), ("back", (0, 0.05, 0.72), 160, 10, 2.5),
                                 ("left", (0.1, 0, 0.75), -100, 6, 1.6)])


def main():
    return vc.build("captain", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
