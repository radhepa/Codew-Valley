"""Hazel the baker, Bram the innkeeper's younger sister, restyled in the soft Animal Crossing set
after Marlo the fisher (2026-10-23). No triangle budget.
She has her brother's reddish-brown hair (the shared `hair` colour) in a cinnamon-roll bun with a
rose scrunchie, a side-parted fringe and face-framing locks, all sculpted from metaballs, under a
puffy mushroom-shaped pleated white toque (her silhouette); freckles across the nose, round blushing cheeks,
a happy smile and a soft dusting of flour on one cheek. A dusty-rose dress with puffed, rolled-up sleeves,
a Peter Pan collar and a lace petticoat peeking under the hem; a cream apron with a gathered skirt,
scalloped lace edge, piped edges and rose stitching, a bib with an embroidered wheat sprig, straps
that cross at the back, a waistband tied in a bow, a patch pocket with a wooden spoon, and soft
flour smudges (a floury handprint on her hip). White ribbed ankle socks and Mary Jane shoes.
Prop: `rolling_pin` (arm_r, held out in front by one handle): a turned maple barrel with grooves,
grain lines and darker collars, turned handles with knobs, dusted with flour.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix
import bmesh

vc.palette({
    "dress": "#C98A86", "dress_dark": "#A86A67", "dress_light": "#EDC6BE",
    "apron": "#F1E9DB", "apron_shade": "#DCCFBC", "apron_thread": "#D39C97", "petticoat": "#F7F1E6",
    "toque": "#FBF8F1", "toque_shade": "#E3DCCD",
    "flour": "#FFFDF8", "flour_skin": "#F3D3BD", "freckle_dot": "#B8775B",
    "sock": "#F6F1E7", "shoe": "#7E4B3A", "shoe_dark": "#55332A", "button": "#F2E4CC",
    "pin_wood": "#DDB27C", "pin_dark": "#A97A4E", "pin_grain": "#C69860",
    "spoon": "#C8935E", "spoon_dark": "#A07045",
    "wheat": "#C9A04A", "wheat_dark": "#A8883F",
}, gloss={"shoe": 0.55})


def band(part, pts, nrms, w, t, mat, closed=False):
    """Flat ribbon (straps, ties, waistband): a w x t rectangle swept along pts, its face along nrms."""
    pts = [Vector(p) for p in pts]
    n = len(pts)
    bm = bmesh.new()
    rings = []
    for i, p in enumerate(pts):
        if closed:
            T = pts[(i + 1) % n] - pts[i - 1]
        else:
            T = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        T.normalize()
        N = Vector(nrms[i])
        N = (N - T * N.dot(T)).normalized()
        Sd = T.cross(N)
        rings.append([bm.verts.new(p + Sd * (sx * w / 2) + N * (sy * t / 2)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    pairs = list(zip(rings, rings[1:]))
    if closed:
        pairs.append((rings[-1], rings[0]))
    for a, b in pairs:
        for k in range(4):
            j = (k + 1) % 4
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, mat, smooth=True)


def gnormal(G, phi, z):
    """True surface normal of a lathe garment (accounts for the slope of the profile)."""
    dr = (G.rad(z + 0.01) - G.rad(z - 0.01)) / 0.02
    a = math.radians(phi)
    return Vector((math.cos(a), math.sin(a) / G.ys, -dr)).normalized()


def flour(part, m, size=1.0, seed=1, n=4, dots=3, th=0.0026):
    """A soft dusting of flour: a few overlapping flattened puffs on the frame m (local Z out)."""
    rnd = random.Random(seed)
    for k in range(n):
        ox, oy = rnd.uniform(-0.011, 0.011) * size, rnd.uniform(-0.008, 0.008) * size
        r = rnd.uniform(0.013, 0.02) * size
        part.add(sphere(14, 7), "flour", m @ Matrix.Translation((ox, oy, 0.0)) @ S(r * 1.25, r, th), smooth=True)
    for k in range(dots):
        a = rnd.uniform(0, 2 * math.pi)
        d = rnd.uniform(0.024, 0.034) * size
        part.add(sphere(8, 5), "flour", m @ Matrix.Translation((d * math.cos(a), d * math.sin(a), 0.0)) @ S(0.0035 * size, 0.0035 * size, 0.0025), smooth=True)


# ---------------------------------------------------------------- body (dress and apron)

DRESS = vc.Garment([(0.262, 0.205), (0.272, 0.22), (0.27, 0.25), (0.256, 0.31), (0.234, 0.38), (0.208, 0.45), (0.19, 0.51),
                    (0.182, 0.56), (0.177, 0.61), (0.168, 0.66), (0.15, 0.71), (0.122, 0.75), (0.088, 0.78), (0.05, 0.797)], ys=0.84)
APRON = vc.Garment([(DRESS.rad(z) + 0.013, z) for z in [0.2 + 0.02 * k for k in range(28)]], ys=0.84)
AP0, AP1 = -152.0, -28.0          # apron skirt spans these angles (front)
WAIST = 0.505


def gathers(a, z):
    """Soft gathers in the dress skirt below the waist, deepening toward the hem."""
    k = min(max((WAIST - z) / 0.25, 0.0), 1.0)
    return 0.007 * k * 0.5 * (1 + math.cos(22 * a))


def apron_r(phi, z):
    """Radius of the gathered apron skirt."""
    return APRON.rad(z) + 0.0045 * 0.5 * (1 + math.cos(math.radians(phi) * 30))


def apron_pt(phi, z, out=0.0):
    a = math.radians(phi)
    r = apron_r(phi, z) + out
    return Vector((r * math.cos(a), APRON.ys * r * math.sin(a), z))


def apron_skirt(p):
    z0, z1, nphi, nz = 0.215, WAIST, 64, 12
    bm = bmesh.new()
    rows = []
    for j in range(nz + 1):
        z = z0 + (z1 - z0) * j / nz
        rows.append([bm.verts.new(apron_pt(AP0 + (AP1 - AP0) * i / nphi, z)) for i in range(nphi + 1)])
    for a, b in zip(rows, rows[1:]):
        for i in range(nphi):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    p.add(bm, "apron", smooth=True)
    # piping round the skirt, rose running stitch inside it, and a scalloped lace edge
    bot = [apron_pt(AP0 + (AP1 - AP0) * i / 96, z0, 0.001) for i in range(97)]
    p.add(bm_tube(bot, 0.0055, 10), "apron_shade", smooth=True)
    for phi in (AP0, AP1):
        p.add(bm_tube([apron_pt(phi, z0 + (z1 - z0) * k / 10, 0.001) for k in range(11)], 0.0048, 10), "apron_shade", smooth=True)
    stitch(p, [apron_pt(AP0 + 3, z1 - 0.02, 0.003)] + [apron_pt(AP0 + 3 + (AP1 - AP0 - 6) * i / 60, z0 + 0.022, 0.003) for i in range(61)]
           + [apron_pt(AP1 - 3, z1 - 0.02, 0.003)], "apron_thread")
    for i in range(43):
        phi = AP0 + 1.5 + (AP1 - AP0 - 3) * i / 42
        c = apron_pt(phi, z0 - 0.008, 0.0)
        n = gnormal(APRON, phi, z0)
        m = frame(c, n)
        p.add(sphere(12, 6), "apron", m @ S(0.0125, 0.011, 0.0045), smooth=True)


def wheat(p, m):
    """Embroidered wheat sprig: a curved stem with grains either side and a little tie (frame m, local Y up)."""
    stem = [m @ Vector((0.003 * math.sin(t * 2.2), -0.04 + 0.08 * t, 0.002)) for t in [k / 10 for k in range(11)]]
    p.add(bm_tube(stem, 0.0024, 6), "wheat_dark", smooth=True)
    for k in range(5):
        y = -0.008 + k * 0.011
        for s in (-1, 1):
            g = m @ Matrix.Translation((s * 0.008, y, 0.003)) @ M(rot=(0, 0, -s * 32)) @ S(0.0052, 0.0095, 0.0032)
            p.add(sphere(12, 8), "wheat", g, smooth=True)
    p.add(sphere(12, 8), "wheat", m @ Matrix.Translation((0.001, 0.047, 0.003)) @ S(0.005, 0.009, 0.0032), smooth=True)
    for s in (-1, 1):
        leaf = [m @ Vector((s * 0.004 * t + s * 0.014 * t * t, -0.022 - 0.012 * t, 0.002)) for t in [k / 6 for k in range(7)]]
        p.add(bm_tube(leaf, [0.0016, 0.0026, 0.003, 0.003, 0.0026, 0.002, 0.001], 6), "wheat_dark", smooth=True)
    p.add(sphere(12, 8), "apron_thread", m @ Matrix.Translation((0, -0.02, 0.004)) @ S(0.009, 0.0045, 0.003), smooth=True)


def bib(p):
    z0, z1, ph0, ph1 = WAIST, 0.695, -121.0, -59.0
    APRON.panel(p, ph0, ph1, z0, z1, "apron", 0.0, 20)
    p.add(bm_tube(APRON.arc(ph0, ph1, z1, 0.001, 24), 0.0052, 10), "apron_shade", smooth=True)
    for phi in (ph0, ph1):
        p.add(bm_tube(APRON.line(phi, z0, z1, 0.001), 0.0048, 10), "apron_shade", smooth=True)
    stitch(p, [APRON.pt(ph0 + 4, z0 + 0.01, 0.002)] + APRON.line(ph0 + 4, z0 + 0.01, z1 - 0.016, 0.002)[1:]
           + APRON.arc(ph0 + 4, ph1 - 4, z1 - 0.016, 0.002, 20)[1:] + list(reversed(APRON.line(ph1 - 4, z0 + 0.01, z1 - 0.016, 0.002)))[1:],
           "apron_thread")
    wheat(p, APRON.frame(-90, 0.6, 0.002))


def straps(p):
    """Apron straps from the bib corners over the shoulders, crossing at the back to the waistband."""
    path = [(-61, 0.69), (-45, 0.735), (-25, 0.77), (0, 0.782), (25, 0.77), (50, 0.72), (70, 0.66), (90, 0.6), (108, 0.548), (122, WAIST + 0.01)]
    for side, out in ((1, 0.003), (-1, 0.0085)):
        keys = [(phi if side > 0 else 180 - phi, z) for phi, z in path]
        pts, nrm = [], []
        for (pa, za), (pb, zb) in zip(keys, keys[1:]):
            for k in range(4):
                t = k / 4
                phi, z = pa + (pb - pa) * t, za + (zb - za) * t
                pts.append(APRON.pt(phi, z, out))
                nrm.append(gnormal(APRON, phi, z))
        pts.append(APRON.pt(keys[-1][0], keys[-1][1], out))
        nrm.append(gnormal(APRON, *keys[-1]))
        band(p, pts, nrm, 0.03, 0.006, "apron")
        for e in (-1, 1):             # stitch lines along both edges
            side_pts = []
            for i, q in enumerate(pts):
                T = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
                n = (nrm[i] - T * nrm[i].dot(T)).normalized()
                side_pts.append(q + T.cross(n) * (e * 0.0105) + n * 0.0034)
            stitch(p, side_pts, "apron_thread", 0.011, 0.007, 0.0019)


def waistband_and_bow(p):
    pts = APRON.arc(-180, 180, WAIST, 0.006, 96)[:-1]
    band(p, pts, [gnormal(APRON, -180 + 360 * k / 96, WAIST) for k in range(96)], 0.04, 0.008, "apron", closed=True)
    stitch(p, APRON.arc(AP0, AP1, WAIST + 0.014, 0.0105, 40), "apron_thread", 0.011, 0.007, 0.0019)
    stitch(p, APRON.arc(AP0, AP1, WAIST - 0.014, 0.0105, 40), "apron_thread", 0.011, 0.007, 0.0019)
    # bow at the back: two puffy loops, a knot and two tails with notched ends
    kc = APRON.pt(90, WAIST, 0.018)
    for s in (-1, 1):
        lc = kc + Vector((s * 0.052, 0.012, 0.012))
        p.add(sphere(28, 16), "apron", M(lc, (0, -s * 16, 0), (0.054, 0.021, 0.031)), smooth=True)
        p.add(sphere(16, 10), "apron_shade", M(lc + Vector((-s * 0.012, 0.016, 0.0)), (0, -s * 16, 0), (0.026, 0.008, 0.013)), smooth=True)
        tail, nrm = [], []
        for k in range(7):
            t = k / 6
            z = WAIST - 0.012 - 0.14 * t
            x = s * (0.012 + 0.045 * t)
            r = APRON.rad(z) + 0.012 + 0.006 * (1 - t)
            dl = math.degrees(math.asin(max(-0.99, min(0.99, x / r))))
            phi = 90 - dl
            tail.append(Vector((r * math.cos(math.radians(phi)), APRON.ys * r * math.sin(math.radians(phi)), z)))
            nrm.append(gnormal(APRON, phi, z))
        band(p, tail, nrm, 0.032, 0.006, "apron")
        end = tail[-1]
        for e in (-1, 1):           # the notch: two little points at the tail end
            p.add(sphere(10, 6), "apron", M(end + Vector((e * 0.011, 0.0, -0.006)), scale=(0.007, 0.004, 0.008)), smooth=True)
    p.add(sphere(24, 14), "apron", M(kc + Vector((0, 0.02, 0.0)), scale=(0.022, 0.016, 0.026)), smooth=True)
    stitch(p, [kc + Vector((-0.012, 0.035, 0.018)), kc + Vector((0.012, 0.035, 0.018))], "apron_thread", 0.008, 0.006, 0.0016)


def spoon(p):
    """Wooden spoon tucked in the apron pocket, bowl up."""
    phi = -63
    pts = [APRON.pt(phi, 0.29, 0.004), APRON.pt(phi, 0.36, 0.0095), APRON.pt(phi + 1.5, 0.405, 0.022)]
    p.add(bm_tube(pts, [0.0065, 0.0068, 0.0075], 12), "spoon", smooth=True)
    n = gnormal(APRON, phi + 2, 0.42)
    bc = pts[-1] + Vector((0, 0, 0.034)) + n * 0.01
    m = frame(bc, n)
    p.add(sphere(24, 14), "spoon", m @ S(0.025, 0.035, 0.011), smooth=True)
    p.add(sphere(20, 12), "spoon_dark", m @ Matrix.Translation((0, 0.002, 0.007)) @ S(0.018, 0.026, 0.004), smooth=True)


def handprint(p, phi, z):
    """A floury handprint: palm, four fingers and a thumb."""
    m = DRESS.frame(phi, z, 0.012)
    p.add(sphere(20, 10), "flour", m @ S(0.026, 0.03, 0.004), smooth=True)
    for k, (fx, fy, fl) in enumerate(((-0.018, 0.04, 0.017), (-0.006, 0.046, 0.019), (0.007, 0.045, 0.018), (0.018, 0.038, 0.015))):
        p.add(sphere(12, 8), "flour", m @ Matrix.Translation((fx, fy, 0.001)) @ M(rot=(0, 0, -fx * 300)) @ S(0.0068, fl, 0.0035), smooth=True)
    p.add(sphere(12, 8), "flour", m @ Matrix.Translation((0.03, 0.006, 0.001)) @ M(rot=(0, 0, -50)) @ S(0.0075, 0.016, 0.0035), smooth=True)
    flour(p, m @ Matrix.Translation((-0.01, -0.03, 0.0)), 0.7, 11, 2)


def collar(p):
    """Peter Pan collar in apron cream with rose piping."""
    G = DRESS
    prof = [(G.rad(0.742) + 0.017, 0.742), (G.rad(0.765) + 0.016, 0.766), (G.rad(0.785) + 0.012, 0.788), (0.064, 0.805)]
    p.add(bm_lathe(prof, 48, cap_bottom=False, cap_top=False), "apron", M(scale=(1, G.ys, 1)), smooth=True)
    edge = [Vector((prof[0][0] * math.cos(math.radians(a)), G.ys * prof[0][0] * math.sin(math.radians(a)), 0.742)) for a in range(-180, 181, 6)]
    p.add(bm_tube(edge, 0.004, 8), "apron_thread", smooth=True)
    for s in (-1, 1):
        phi = -90 + s * 23
        m = frame(G.pt(phi, 0.758, 0.019), gnormal(G, phi, 0.758))
        p.add(sphere(28, 14), "apron", m @ S(0.05, 0.036, 0.009), smooth=True)
        p.add(bm_tube(ring_pts(m @ Matrix.Translation((0, 0, 0.002)), 0.05, 32, 0.0, 0.036), 0.0038, 8, cap=False), "apron_thread", smooth=True)


def body():
    p = Part("body")
    G = DRESS
    G.mesh(p, "dress", 64, rfun=gathers)
    # lace petticoat peeking under the hem, the rolled hem and a stitch line above it
    p.add(lathe([(0.25, 0.188), (0.258, 0.193), (0.264, 0.205), (0.262, 0.215)], 96,
                rfun=lambda a, z: 0.005 * 0.5 * (1 + math.cos(48 * a)) * (1 if z < 0.2 else 0.3), ys=G.ys), "petticoat", smooth=True)
    G.hem(p, 0.212, 0.016, "dress_dark", out=0.004, n=72)
    G.stitch_ring(p, 0.245, out=0.009, matname="dress_light")
    # side seams and two buttons up the back of the bodice
    for phi in (0, 180):
        p.add(bm_tube(G.line(phi, 0.23, 0.6, 0.006 if phi else 0.006, 12), 0.0035, 6), "dress_dark", smooth=True)
    for z in (0.655, 0.71):
        G.button(p, 90, z, 0.012, "button", out=0.006)
    # neck
    p.add(bm_cyl(0.058, 0.056, 0.11, 24), "skin_warm", M((0, 0, 0.72)), smooth=True)
    collar(p)
    # apron: gathered skirt, bib with embroidery, straps, waistband and bow, pocket with a spoon
    apron_skirt(p)
    bib(p)
    straps(p)
    waistband_and_bow(p)
    APRON.pocket(p, -64, 15, 0.27, 0.37, "apron", edge="apron_shade", thread="apron_thread")
    spoon(p)
    # flour: smudges on the apron and a floury handprint on her hip
    for phi, z, sz, sd in ((-112, 0.31, 1.0, 3), (-84, 0.245, 0.8, 5), (-100, 0.44, 0.75, 7), (-72, 0.655, 0.6, 9), (-138, 0.4, 0.7, 13)):
        r = apron_r(phi, z) + 0.006 if z < WAIST else APRON.rad(z) + 0.004
        a = math.radians(phi)
        c = Vector((r * math.cos(a), APRON.ys * r * math.sin(a), z))
        flour(p, frame(c, gnormal(APRON, phi, z)), sz, sd)
    handprint(p, HANDPRINT_PHI, 0.31)
    return p


HANDPRINT_PHI = -15


# ---------------------------------------------------------------- head

NECK = 0.78
HD = vc.Head((0, 0, NECK + 0.27), 0.318, 0.293, 0.286)
HAIR_T = 0.04          # how far the hair stands off the skull where the cap sits on it
TILT = -8.0            # the toque tips back a little
CZ = 0.152             # band height above the head centre


def fit_band():
    """Fit the toque band to the hair-covered head: returns (dy, rx, ry) for a band whose bottom
    ring (local z=0 in the tilted hat frame) touches the head + hair all round."""
    A, B, C = HD.a + HAIR_T, HD.b + HAIR_T, HD.c + HAIR_T
    R = M(rot=(TILT, 0, 0)).to_3x3()

    def hit(phi, dy):
        o = Vector((0, 0, CZ)) + R @ Vector((0, dy, 0))
        u = R @ Vector((math.cos(phi), math.sin(phi), 0))
        al = (u.x / A) ** 2 + (u.y / B) ** 2 + (u.z / C) ** 2
        be = 2 * (o.x * u.x / A ** 2 + o.y * u.y / B ** 2 + o.z * u.z / C ** 2)
        ga = (o.x / A) ** 2 + (o.y / B) ** 2 + (o.z / C) ** 2 - 1
        return (-be + math.sqrt(be * be - 4 * al * ga)) / (2 * al)

    dy = 0.0
    for _ in range(20):
        tf, tb = hit(-math.pi / 2, dy), hit(math.pi / 2, dy)
        dy += (tb - tf) / 2
    return dy, hit(0.0, dy), (hit(-math.pi / 2, dy) + hit(math.pi / 2, dy)) / 2


def toque(hp):
    """Puffy pleated baker's toque (an AC chef hat) on a plain stitched band, tipped back a little."""
    dy, rx, ry = fit_band()
    ys = ry / rx
    hm = Matrix.Translation(HD.hc + Vector((0, 0, CZ))) @ M(rot=(TILT, 0, 0)) @ Matrix.Translation((0, dy, 0))
    rb = rx + 0.004
    bandp = [(rb - 0.004, -0.004), (rb + 0.002, -0.001), (rb + 0.006, 0.008), (rb + 0.007, 0.03), (rb + 0.007, 0.058), (rb + 0.004, 0.068),
             (rb - 0.004, 0.073)]
    hp.add(lathe(bandp, 112, ys=ys), "toque", hm, smooth=True)
    for z in (0.012, 0.06):
        pts = [hm @ Vector(((rb + 0.0085) * math.cos(2 * math.pi * k / 72), ys * (rb + 0.0085) * math.sin(2 * math.pi * k / 72), z)) for k in range(73)]
        stitch(hp, pts[:37], "toque_shade", 0.012, 0.008, 0.0022)
        stitch(hp, pts[36:], "toque_shade", 0.012, 0.008, 0.0022)
    # a soft mushroom of a crown: flares out over the band, billows wide and domes over the top
    puff = [(rb - 0.02, 0.062), (rb - 0.006, 0.07), (rb + 0.026, 0.084), (rb + 0.052, 0.108), (rb + 0.066, 0.142), (rb + 0.07, 0.18),
            (rb + 0.064, 0.218), (rb + 0.046, 0.252), (rb + 0.014, 0.28), (rb - 0.04, 0.303), (0.2, 0.318), (0.13, 0.327),
            (0.065, 0.331), (0.02, 0.332)]
    rmax = rb + 0.07

    def prad(z):
        for (r0, z0), (r1, z1) in zip(puff, puff[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / max(z1 - z0, 1e-9)
        return puff[-1][0]

    def pleat(a, z):
        # 12 plump rounded puffs that carry on over the dome as soft lumps toward the centre
        k = min(max((z - 0.066) / 0.03, 0.0), 1.0) * (prad(z) / rmax) ** 1.2
        return 0.03 * k * (0.5 * (1 + math.cos(12 * a))) ** 0.8

    hp.add(lathe(puff, 144, rfun=pleat, ys=ys, cap_top=True), "toque", hm, smooth=True)
    return hm


def chain(keys, fn, per=3):
    """Metaball elements along key points (p, r), interpolated `per` times per segment."""
    out = []
    for (pa, ra), (pb, rb) in zip(keys, keys[1:]):
        for k in range(per):
            t = k / per
            out.append((fn(pa, pb, t), ra + (rb - ra) * t))
    out.append((fn(keys[-1][0], keys[-1][0], 0.0), keys[-1][1]))
    return out


def hair(hp):
    H = HD.H
    # the main mass: round the back and sides and up under the cap (front left open for the fringe)
    el = []
    zs = [-0.22 + 0.035 * k for k in range(15)]
    for z in zs:
        if z >= 0.17:
            phis = range(-180, 180, 11)
        elif z >= -0.06:
            phis = range(-22, 203, 11)
        elif z >= -0.13:
            phis = range(4, 177, 11)
        else:
            phis = range(30, 151, 11)
        for phi in phis:
            el.append((HD.spt(phi, z, -0.022)[0], 0.052))
    el.append((H(0, 0, HD.c - 0.03), 0.06))
    hp.add(meta(el, 0.0105), "hair", None, smooth=True)

    def on_front(pa, pb, t):
        x = pa[0] + (pb[0] - pa[0]) * t
        z = pa[1] + (pb[1] - pa[1]) * t
        return HD.fpt(x, z, 0.004)[0]

    # side-parted fringe: two locks sweeping to her right, one to her left, a clear parting between
    locks = (
        [((0.07, 0.25), 0.03), ((0.02, 0.22), 0.034), ((-0.04, 0.19), 0.038), ((-0.1, 0.165), 0.036), ((-0.15, 0.146), 0.03),
         ((-0.19, 0.132), 0.022), ((-0.215, 0.122), 0.012)],
        [((0.06, 0.25), 0.03), ((0.0, 0.215), 0.034), ((-0.05, 0.18), 0.034), ((-0.085, 0.152), 0.028), ((-0.11, 0.134), 0.018),
         ((-0.125, 0.124), 0.01)],
        [((0.075, 0.245), 0.03), ((0.05, 0.205), 0.034), ((0.015, 0.172), 0.034), ((-0.015, 0.147), 0.028), ((-0.035, 0.128), 0.018),
         ((-0.045, 0.118), 0.01)],
        [((0.1, 0.245), 0.03), ((0.13, 0.205), 0.032), ((0.165, 0.17), 0.03), ((0.195, 0.143), 0.024), ((0.215, 0.122), 0.016),
         ((0.226, 0.108), 0.009)],
    )
    for lk in locks:
        hp.add(meta(chain(lk, on_front), 0.0065), "hair", None, smooth=True)

    # face-framing side locks in front of the ears, curling in at the tips
    for s in (1, -1):
        def on_side(pa, pb, t, s=s):
            phi = pa[0] + (pb[0] - pa[0]) * t
            z = pa[1] + (pb[1] - pa[1]) * t
            ph = phi if s > 0 else 180 - phi
            return HD.spt(ph, z, 0.0)[0]
        keys = [((-26, 0.17), 0.034), ((-27, 0.1), 0.037), ((-28, 0.03), 0.037), ((-30, -0.04), 0.034), ((-33, -0.1), 0.027),
                ((-38, -0.135), 0.017), ((-44, -0.15), 0.009)]
        hp.add(meta(chain(keys, on_side), 0.0065), "hair", None, smooth=True)

    # locks drawn back from under the cap into the bun, and two little curls at the nape
    for phi0, side in ((52, 1), (72, 1), (108, -1), (128, -1)):
        def on_back(pa, pb, t):
            phi = pa[0] + (pb[0] - pa[0]) * t
            z = pa[1] + (pb[1] - pa[1]) * t
            return HD.spt(phi, z, 0.026)[0]
        keys = [((phi0, 0.12), 0.016), ((phi0 + side * 6, 0.04), 0.021), ((phi0 + side * 12, -0.03), 0.02), ((90 - side * 12, -0.075), 0.013)]
        hp.add(meta(chain(keys, on_back, 4), 0.0065), "hair", None, smooth=True)
    for s in (-1, 1):
        nk = [((90 + s * 26, -0.2), 0.022), ((90 + s * 30, -0.235), 0.019), ((90 + s * 27, -0.258), 0.013), ((90 + s * 21, -0.262), 0.008)]
        hp.add(meta(chain(nk, lambda pa, pb, t: HD.spt(pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, 0.012)[0], 4), 0.006),
               "hair", None, smooth=True)
    # cinnamon-roll bun at the back under the cap, with a rose scrunchie round its base
    bc = H(0, HD.b + 0.03, -0.1)
    bun = [(bc, 0.08)]
    for k in range(28):
        t = k / 27
        a = t * 2.6 * math.pi
        rr = 0.064 * (1 - 0.85 * t)
        bun.append((bc + Vector((rr * math.cos(a), 0.044 + 0.018 * t, rr * math.sin(a))), 0.028 - 0.007 * t))
    hp.add(meta(bun, 0.007), "hair", None, smooth=True)
    sc = H(0, HD.b + 0.012, -0.1)
    ring = [sc + Vector((0.076 * math.cos(t), 0.003 * math.sin(14 * t), 0.076 * math.sin(t))) for t in [2 * math.pi * k / 96 for k in range(97)]]
    hp.add(bm_tube(ring, [0.016 + 0.0035 * math.cos(14 * 2 * math.pi * k / 96) for k in range(97)], 14, cap=False), "dress", smooth=True)


def cheek_dust(hp, cx, cz, rx, rz, n=12, rings=5):
    """Flat flour patch that follows the face surface: an irregular soft-edged disc, 1 mm proud."""
    bm = bmesh.new()
    centre = bm.verts.new(HD.fpt(cx, cz, 0.0011)[0])
    prev = None
    first = None
    rows = []
    for j in range(1, rings + 1):
        f = j / rings
        row = []
        for i in range(n * 2):
            t = math.pi * i / n
            wob = 1 + 0.16 * math.sin(3 * t + 0.7) + 0.08 * math.sin(5 * t)
            row.append(bm.verts.new(HD.fpt(cx + rx * f * wob * math.cos(t), cz + rz * f * wob * math.sin(t), 0.0011)[0]))
        rows.append(row)
    m = n * 2
    for i in range(m):
        bm.faces.new((centre, rows[0][i], rows[0][(i + 1) % m]))
    for a, b in zip(rows, rows[1:]):
        for i in range(m):
            bm.faces.new((a[i], b[i], b[(i + 1) % m], a[(i + 1) % m]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for fc in bm.faces:                       # make sure it faces out of the head
        if fc.normal.dot(fc.calc_center_median() - HD.hc) < 0:
            fc.normal_flip()
    hp.add(bm, "flour_skin", smooth=True)


def head():
    hp = Part("head")
    HD.face(hp, mouth="smile", blush=False, ears=False, eye_x=0.1, eye_size=(0.031, 0.045), mouth_z=-0.132)
    HD.blush(hp, x=0.18, z=-0.058, w=0.052, h=0.032)
    for s in (-1, 1):            # soft arched brows: a smooth tapered chain of metaballs
        bk = [((0.066, 0.076), 0.009), ((0.084, 0.085), 0.0125), ((0.104, 0.089), 0.0135), ((0.126, 0.086), 0.012), ((0.146, 0.076), 0.008)]
        hp.add(meta(chain(bk, lambda pa, pb, t, s=s: HD.fpt(s * (pa[0] + (pb[0] - pa[0]) * t), pa[1] + (pb[1] - pa[1]) * t, 0.01)[0], 4),
                    0.0045), "hair", None, smooth=True)
    # freckles across the nose and cheeks
    for s in (-1, 1):
        for x, z in ((0.07, -0.036), (0.088, -0.056), (0.106, -0.034), (0.122, -0.054), (0.046, -0.022)):
            HD.on_face(hp, "freckle_dot", s * x, z, 0.0062, 0.0058, 0.002, out=0.0012, u=12, v=8)
    # a soft dusting of flour on her right cheek (a flat decal hugging the face)
    cheek_dust(hp, -0.165, -0.108, 0.032, 0.017)
    hair(hp)
    toque(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

def arm(side, cfg):
    """Puffed short sleeve rolled up above the elbow, bare forearm, mitten hand."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    sr = cfg["sleeve_r"]
    p.add(sphere(36, 22), "dress", M(pv, scale=sr * 1.08), smooth=True)
    p.add(bm_tube([pv, pv + d * 0.055, pv + d * 0.11], [sr * 1.05, sr * 1.06, sr * 0.97], 36, cap=False), "dress", smooth=True)
    # two fat rolls of turned-back fabric with a stitch line, the inside showing lighter
    for k, (t, rr, tr) in enumerate(((0.108, sr * 0.96, 0.019), (0.132, sr * 0.9, 0.017))):
        cm = frame(pv + d * t, d)
        p.add(bm_tube(ring_pts(cm, rr, 48), tr, 16, cap=False), "dress" if k == 0 else "dress_light", smooth=True)
    stitch(p, ring_pts(frame(pv + d * 0.108, d), sr * 0.96 + 0.019, 32, 0.0), "dress_light", 0.011, 0.007, 0.0022)
    # forearm and mitten
    hc = vc.hand_c(side, cfg)
    a0, a1 = pv + d * 0.125, hc - d * 0.03
    p.add(bm_tube([a0, (a0 + a1) / 2, a1], [0.041, 0.04, 0.043], 24), "skin_warm", smooth=True)
    vc.mitten(p, hc, "skin_warm", side)
    return p


def leg(side, cfg):
    """Bare leg, a white ribbed ankle sock with a folded cuff and a Mary Jane shoe with a buttoned strap."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    p.add(bm_tube([(x, 0, cfg["hip_z"]), (x, 0, 0.11)], [0.05, 0.048], 24), "skin_warm", smooth=True)
    sm = Matrix.Translation((x, 0.0, 0.0))
    p.add(lathe([(0.051, 0.09), (0.052, 0.12), (0.051, 0.15)], 64, rfun=ribs(18, 0.0028)), "sock", sm, smooth=True)
    p.add(lathe([(0.049, 0.145), (0.056, 0.148), (0.061, 0.157), (0.062, 0.17), (0.058, 0.179), (0.05, 0.181)], 64, rfun=ribs(18, 0.003)),
          "sock", sm, smooth=True)
    els = [((x, 0.0, 0.088), 0.06), ((x, -0.03, 0.07), 0.064), ((x, -0.078, 0.062), 0.058), ((x, -0.112, 0.055), 0.047), ((x, 0.035, 0.07), 0.058)]
    p.add(meta(els, 0.008), "shoe", None, smooth=True)
    p.add(bm_box(0.124, 0.232, 0.022, bevel=0.01, segs=3), "shoe_dark", M((x, -0.033, 0.011)), smooth=True)
    # strap over the instep with a button on the outside
    R, zc, yc = 0.071, 0.066, -0.045
    ts = [0.3 + (math.pi - 0.6) * k / 16 for k in range(17)]
    pts = [Vector((x + R * math.cos(t), yc, zc + R * math.sin(t))) for t in ts]
    band(p, pts, [Vector((math.cos(t), 0, math.sin(t))) for t in ts], 0.022, 0.006, "shoe_dark")
    tb = ts[0] if side > 0 else ts[-1]
    bp = Vector((x + (R + 0.004) * math.cos(tb), yc, zc + (R + 0.004) * math.sin(tb)))
    p.add(sphere(16, 10), "button", frame(bp, Vector((math.cos(tb), 0, math.sin(tb)))) @ S(0.0105, 0.0105, 0.005), smooth=True)
    return p


CFG = dict(
    neck_z=NECK, shoulder_x=0.175, shoulder_z=0.68, hip_x=0.085, hip_z=0.35,
    arm_len=0.27, arm_splay=17, arm_pose={-1: (31, 28)},       # the pin arm reaches out in front
    sleeve_r=0.074, arm=arm, leg=leg,
)


# ---------------------------------------------------------------- prop

PIN_DIR = Vector((-0.7, -0.6, 0.38)).normalized()
HANDLE = [(0.0, 0.0), (0.012, 0.002), (0.02, 0.008), (0.0225, 0.016), (0.0195, 0.025), (0.0155, 0.033), (0.0162, 0.06), (0.0172, 0.09),
          (0.016, 0.11), (0.013, 0.118)]


def rolling_pin():
    p = Part("rolling_pin")
    g = vc.hand_c(-1, CFG)
    m = frame(g, PIN_DIR)            # local Z along the pin; local +Y is up
    # handles: the near one through the fist (knob behind it), the far one past the barrel
    p.add(bm_lathe(HANDLE, 32), "pin_wood", m @ Matrix.Translation((0, 0, -0.062)), smooth=True)
    p.add(bm_lathe(HANDLE, 32), "pin_wood", m @ Matrix.Translation((0, 0, 0.476)) @ M(rot=(180, 0, 0)), smooth=True)
    for z0, flip in ((0.05, False), (0.358, True)):
        col = [(0.0165, 0.0), (0.023, 0.002), (0.0245, 0.0055), (0.0235, 0.009), (0.02, 0.011)]
        mm = m @ Matrix.Translation((0, 0, z0 + (0.011 if flip else 0.0))) @ (M(rot=(180, 0, 0)) if flip else Matrix())
        p.add(bm_lathe(col, 32), "pin_dark", mm, smooth=True)
    # the barrel: a turned cylinder with a slight crown and rounded shoulders
    bp = [(0.026, 0.06), (0.034, 0.0615), (0.039, 0.066), (0.0415, 0.073), (0.0425, 0.088), (0.043, 0.208), (0.0425, 0.328), (0.0415, 0.343),
          (0.039, 0.35), (0.034, 0.3545), (0.026, 0.356)]
    p.add(lathe(bp, 64, cap_top=True, cap_bottom=True), "pin_wood", m, smooth=True)
    for z in (0.086, 0.33):
        p.add(lathe([(0.0432, z - 0.0022), (0.0436, z), (0.0432, z + 0.0022)], 64), "pin_dark", m, smooth=True)
    for a0 in (35, 150, 250):            # a few long grain lines
        pts = []
        for k in range(17):
            z = 0.1 + 0.21 * k / 16
            a = math.radians(a0 + 5 * math.sin(k * 0.7 + a0))
            pts.append(m @ Vector((0.0431 * math.cos(a), 0.0431 * math.sin(a), z)))
        p.add(bm_tube(pts, 0.0011, 5), "pin_grain", smooth=True)
    # flour dusted along the top of the barrel and a little on the far handle
    rnd = random.Random(4)
    for k in range(5):
        z = 0.11 + 0.05 * k + rnd.uniform(-0.01, 0.01)
        a = math.radians(90 + rnd.uniform(-35, 35))
        n = Vector((math.cos(a), math.sin(a), 0))
        pos = m @ (n * 0.0435 + Vector((0, 0, z)))
        nw = m.to_3x3() @ n
        flour(p, frame(pos, nw) @ M(rot=(0, 0, 90)), 0.9, 20 + k, 3, 2, 0.0016)
    a = math.radians(80)
    flour(p, frame(m @ Vector((0.017 * math.cos(a), 0.017 * math.sin(a), 0.43)), m.to_3x3() @ Vector((math.cos(a), math.sin(a), 0))), 0.35, 40, 2)
    # clearance check against the dress / apron
    worst = 9.0
    for k in range(60):
        z = -0.062 + 0.538 * k / 59
        rr = 0.043 if 0.06 < z < 0.356 else 0.023
        c = m @ Vector((0, 0, z))
        rm = math.sqrt(c.x ** 2 + (c.y / DRESS.ys) ** 2)
        gap = (rm - APRON.rad(c.z) - 0.012) * DRESS.ys - rr
        worst = min(worst, gap)
    print("PIN clearance to garment: %.3f m (grip %s)" % (worst, tuple(round(v, 3) for v in g)))
    return p, g


CFG.update(body=body, head=head, props=[("rolling_pin", "arm_r", rolling_pin)], closeup_z=1.12,
           shots=[("back", (0, 0, 0.85), 160, 8, 2.8), ("pin", (-0.3, -0.3, 0.55), -55, 10, 1.6), ("side", (0, 0, 0.85), 90, 4, 2.8)])


def main():
    return vc.build("baker", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
