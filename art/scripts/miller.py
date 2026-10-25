"""Wren the miller, in the soft Animal Crossing style of Marlo the fisher (2026-10-23).
Wiry and cheerful: a mustard tunic with rolled-up sleeves and a stitched hem, a woven burlap
apron (bib, crossed straps, wooden buttons, a stitched kangaroo pocket, two darned patches, a
frayed hem, soft flour smudges and a floury handprint, a waist tie bowed at the back), a red
polka-dot bandana knotted at the neck, freckles, a happy smile, copper hair with a swept fringe
and a short braid, and the silhouette: a wide coiled-straw hat with a green ribbon band, a bow
and two ears of wheat tucked in. No held prop.
Parts and pivots as the miller always had: body, head (neck), arm_l / arm_r (shoulders),
leg_l / leg_r (hips). Built with the shared kit in villagers_common.py."""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe
from villagers_common import frame, S, sphere, lathe, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "mustard": "#D4A646", "mustard_dark": "#A97F2E", "mustard_light": "#EFD592",
    "burlap": "#CDB58C", "burlap_dark": "#A68A62", "strap": "#8E6A43", "burlap_light": "#E6D6B4", "flour": "#EFE8D9",
    "bandana": "#C5493B", "bandana_dark": "#9B362B", "bandana_dot": "#F4E8D2",
    "straw": "#E3C67C", "straw_dark": "#B7954F", "ribbon": "#5E8B66", "ribbon_dark": "#46694D",
    "hair_copper": "#B3663B", "hair_copper_dark": "#8C4B2A", "freckle": "#B7714F", "flour_skin": "#F6DAC4",
    "trousers": "#6D5A46", "boot": "#7E5538", "boot_dark": "#5B3B27",
    "button_wood": "#B98A57", "wheat": "#D7AE55", "wheat_light": "#E8C877", "wheat_dark": "#B08A40",
}, gloss={"bandana": 0.55})


def grid(part, mat, fn, nu, nv, flip=False):
    """Open surface from fn(u, v) -> Vector over a (nu+1) x (nv+1) grid. With u running
    counter-clockwise round the body and v upward the faces point outward (flip reverses)."""
    bm = bmesh.new()
    rows = [[bm.verts.new(fn(i / nu, j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    for a, b in zip(rows, rows[1:]):
        for i in range(nu):
            q = (a[i], a[i + 1], b[i + 1], b[i])
            bm.faces.new(tuple(reversed(q)) if flip else q)
    part.add(bm, mat, None, smooth=True)


# ---------------------------------------------------------------- body (tunic, apron, bandana)

TUNIC = vc.Garment([(0.194, 0.31), (0.204, 0.33), (0.203, 0.38), (0.192, 0.45), (0.181, 0.52), (0.174, 0.59), (0.164, 0.65),
                    (0.148, 0.70), (0.125, 0.75), (0.094, 0.795), (0.062, 0.822), (0.04, 0.834)], ys=0.82)


def _apron_off(z):
    return 0.009 + max(0.0, 0.48 - z) * 0.09          # hangs a little proud of the tunic below the waist


APRON = vc.Garment([(TUNIC.rad(z) + _apron_off(z), z) for z in [0.24 + 0.48 * k / 48 for k in range(49)]], ys=0.82)
WEAVE = 0.018       # burlap thread pitch


def weave_bump(phi, z, d=0.0019):
    su = APRON.rad(z) * math.radians(phi) / WEAVE
    return d * (0.5 + 0.5 * math.sin(2 * math.pi * su) * math.sin(2 * math.pi * z / WEAVE))


def woven(part, phi0, phi1, z0, z1, nu, nv):
    """Burlap panel lying on the apron profile with a plain-weave relief."""
    def fn(u, v):
        phi = phi0 + (phi1 - phi0) * u
        z = z0 + (z1 - z0) * v
        return APRON.pt(phi, z, weave_bump(phi, z))
    grid(part, "burlap", fn, nu, nv)


def on(G, phi, z, dx=0.0, dz=0.0, out=0.0):
    """Frame on garment G offset dx metres sideways and dz up from (phi, z)."""
    return G.frame(phi + math.degrees(dx / G.rad(z)), z + dz, out)


def smudge(part, G, phi, z, size, seed, out=0.0045):
    """Soft flour smudge: overlapping flat blots and a few specks of dust round it."""
    rnd = random.Random(seed)
    for k in range(4):
        s = size * rnd.uniform(0.5, 0.8)
        m = on(G, phi, z, rnd.uniform(-0.45, 0.45) * size, rnd.uniform(-0.3, 0.3) * size, out + 0.0003 * k)
        part.add(sphere(16, 6), "flour", m @ M(rot=(0, 0, rnd.uniform(0, 180))) @ S(s, s * rnd.uniform(0.5, 0.7), 0.0011), smooth=True)
    for k in range(7):
        a = rnd.uniform(0, 2 * math.pi)
        rr = size * rnd.uniform(0.75, 1.25)
        m = on(G, phi, z, rr * math.cos(a), rr * math.sin(a) * 0.8, out)
        part.add(sphere(8, 4), "flour", m @ S(rnd.uniform(0.003, 0.0055), rnd.uniform(0.003, 0.005), 0.0014), smooth=True)


def handprint(part, G, phi, z, out=0.0045):
    """A floury handprint: palm, four fingers and a thumb, each on its own frame of the surface."""
    part.add(sphere(18, 10), "flour", on(G, phi, z, 0, 0, out) @ S(0.02, 0.023, 0.0016), smooth=True)
    for a, ln in ((-24, 0.016), (-8, 0.019), (8, 0.019), (24, 0.016)):
        ar = math.radians(a)
        c = 0.024 + ln * 0.75
        part.add(sphere(14, 8), "flour", on(G, phi, z, math.sin(ar) * c, math.cos(ar) * c, out) @ M(rot=(0, 0, -a)) @ S(0.0062, ln, 0.0015), smooth=True)
    part.add(sphere(14, 8), "flour", on(G, phi, z, 0.025, -0.004, out) @ M(rot=(0, 0, -62)) @ S(0.0065, 0.014, 0.0015), smooth=True)


def cross_stitches(part, G, phi0, phi1, z0, z1, out, mat, step=0.016, k=0.0042):
    """Little X stitches all round a rectangular patch."""
    r = G.rad((z0 + z1) / 2)
    w = math.radians(phi1 - phi0) * r
    h = z1 - z0
    pts = []
    n = max(2, int(w / step))
    for i in range(n + 1):
        pts += [(i / n * w, 0.0), (i / n * w, h)]
    n = max(2, int(h / step))
    for i in range(1, n):
        pts += [(0.0, i / n * h), (w, i / n * h)]
    for x, y in pts:
        ph = phi0 + math.degrees(x / r)
        m = G.frame(ph, z0 + y, out)
        for sx in (-1, 1):
            part.add(bm_tube([m @ Vector((-k, -k * sx, 0)), m @ Vector((k, k * sx, 0))], 0.0021, 5), mat, smooth=True)


def strap_path(side, out):
    ctrl = [(-68, 0.70), (-58, 0.735), (-40, 0.764), (-12, 0.784), (20, 0.782), (50, 0.744), (75, 0.67), (96, 0.585), (110, 0.505)]
    pts = []
    for (p0, z0), (p1, z1) in zip(ctrl, ctrl[1:]):
        for k in range(5):
            t = k / 5
            pts.append((p0 + (p1 - p0) * t, z0 + (z1 - z0) * t))
    pts.append(ctrl[-1])
    if side < 0:
        pts = [(-180 - p, z) for p, z in pts]
    return [TUNIC.pt(p, z, out) for p, z in pts]


def body():
    p = Part("body")
    G, A = TUNIC, APRON
    G.mesh(p, "mustard")
    # tunic: rolled hem, stitching, side seams, a back yoke seam and a darned patch on the back
    G.hem(p, 0.318, 0.013, "mustard_dark")
    G.stitch_ring(p, 0.345, matname="mustard_light")
    for phi in (0, 180):
        stitch(p, G.line(phi, 0.36, 0.66, 0.003), "mustard_light")
    stitch(p, G.arc(25, 155, 0.655, 0.003, 24), "mustard_light")
    p.add(bm_tube(G.arc(25, 155, 0.665, 0.002, 32), 0.0035, 6), "mustard_dark", smooth=True)
    G.panel(p, 118, 138, 0.41, 0.48, "patch_teal", 0.005, 8)
    cross_stitches(p, G, 118, 138, 0.41, 0.48, 0.0075, "stitch_light")
    p.add(bm_cyl(0.055, 0.052, 0.11, 24), "skin_warm", M((0, 0, 0.78)), smooth=True)

    # burlap apron: woven skirt and bib, bound edges, a frayed hem
    woven(p, -152, -28, 0.25, 0.505, 96, 56)
    woven(p, -116, -64, 0.495, 0.70, 36, 52)
    for phi in (-152, -28):
        p.add(bm_tube(A.line(phi, 0.25, 0.5, 0.002, 12), 0.0048, 8), "burlap_dark", smooth=True)
    for phi in (-116, -64):
        p.add(bm_tube(A.line(phi, 0.5, 0.70, 0.002, 10), 0.0048, 8), "burlap_dark", smooth=True)
    p.add(bm_tube(A.arc(-116, -64, 0.70, 0.002, 20), 0.0052, 8), "burlap_dark", smooth=True)
    A.stitch_ring(p, 0.272, 0.0035, "burlap_light", -150, -30)
    stitch(p, A.arc(-113, -67, 0.684, 0.0035, 16), "burlap_light")
    rnd = random.Random(11)
    phi = -151.0
    while phi < -29:
        a = A.pt(phi, 0.252, 0.0012)
        b = A.pt(phi + rnd.uniform(-0.8, 0.8), 0.252 - rnd.uniform(0.011, 0.018), 0.003)
        p.add(bm_tube([a, b], [0.0024, 0.0016], 5), "burlap", smooth=True)
        phi += 1.6
    # waist tie all round, bowed at the back
    A.hem(p, 0.5, 0.011, "strap", out=0.004)
    bc = A.pt(90, 0.5, 0.016)
    for s in (-1, 1):
        loop = [bc + Vector((s * 0.045 * (1 - math.cos(t)) * 0.9, 0.012 * math.sin(t) ** 2, 0.024 * math.sin(t))) for t in [2 * math.pi * k / 20 for k in range(21)]]
        p.add(bm_tube(loop, 0.0085, 10, cap=False), "strap", smooth=True)
        tail = [bc + Vector((s * 0.008, 0.004, 0)), bc + Vector((s * 0.022, 0.006, -0.05)), bc + Vector((s * 0.03, 0.002, -0.095))]
        p.add(bm_tube(tail, [0.009, 0.0085, 0.007], 10), "strap", smooth=True)
    p.add(sphere(18, 12), "strap", M(bc + Vector((0, 0.005, 0)), scale=(0.017, 0.012, 0.015)), smooth=True)
    # crossed straps over the shoulders, buttoned to the bib with wooden buttons
    for s, out in ((1, 0.0095), (-1, 0.0125)):
        p.add(bm_tube(strap_path(s, out), 0.0075, 10), "strap", smooth=True)
    for phi in (-110, -70):
        A.button(p, phi, 0.688, r=0.013, matname="button_wood", out=0.012)
    # stitched kangaroo pocket with a centre seam, and two darned patches
    A.pocket(p, -90, 24, 0.31, 0.41, "burlap", edge="burlap_dark", thread="burlap_light")
    stitch(p, A.line(-90, 0.322, 0.39, 0.0115, 6), "burlap_light")
    A.panel(p, -143, -124, 0.3, 0.37, "patch_moss", 0.005, 8)
    cross_stitches(p, A, -143, -124, 0.3, 0.37, 0.0075, "burlap_light")
    A.panel(p, -82, -68, 0.555, 0.615, "patch_ochre", 0.005, 6)
    stitch(p, A.arc(-81, -69, 0.562, 0.0072, 8) + A.line(-69, 0.562, 0.608, 0.0072, 4)
           + list(reversed(A.arc(-81, -69, 0.608, 0.0072, 8))) + list(reversed(A.line(-81, 0.562, 0.608, 0.0072, 4))), "stitch_dark")
    # flour: soft smudges and a floury handprint
    smudge(p, A, -104, 0.455, 0.032, 1)
    smudge(p, A, -60, 0.29, 0.036, 2)
    smudge(p, A, -104, 0.63, 0.022, 3)
    smudge(p, A, -142, 0.43, 0.025, 4)
    handprint(p, A, -47, 0.405)

    # red bandana: a rolled band round the neck, a polka-dot flap on the chest, a knot with two tails
    band = [(0.079 * math.cos(2 * math.pi * k / 40), 0.073 * math.sin(2 * math.pi * k / 40), 0.815 - 0.01 * math.sin(2 * math.pi * k / 40)) for k in range(41)]
    p.add(bm_tube(band, 0.024, 14, cap=False), "bandana", smooth=True)
    zt, zb, hw = 0.81, 0.668, 52.0

    def flap(u, v):
        vv = 0.05 + 0.95 * v
        z = zb + (zt - zb) * vv
        phi = -90 + hw * vv * (2 * u - 1)
        out = 0.018 + 0.016 * vv + 0.003 * math.sin(3 * math.pi * u) * vv
        return G.pt(phi, z, out)
    grid(p, "bandana", flap, 24, 22)
    for u in (0, 1):
        p.add(bm_tube([flap(u, v / 12) for v in range(13)], 0.0042, 8), "bandana_dark", smooth=True)
    for u, v in ((0.5, 0.25), (0.3, 0.55), (0.7, 0.55), (0.5, 0.75), (0.15, 0.85), (0.85, 0.85), (0.35, 0.92), (0.65, 0.92), (0.5, 0.45)):
        c = flap(u, v)
        nrm = (flap(min(u + 0.05, 1), v) - flap(max(u - 0.05, 0), v)).cross(flap(u, min(v + 0.05, 1)) - flap(u, max(v - 0.05, 0))).normalized()
        p.add(sphere(14, 8), "bandana_dot", frame(c + nrm * 0.0012, nrm) @ S(0.0068, 0.0068, 0.0016), smooth=True)
    kc = Vector((0.074, -0.075, 0.808))
    p.add(sphere(22, 14), "bandana", M(kc, (0, 0, 40), (0.03, 0.025, 0.027)), smooth=True)
    p.add(bm_tube([kc + Vector((-0.018, -0.018, 0.0)), kc + Vector((0.018, -0.016, -0.004))], 0.0045, 6), "bandana_dark", smooth=True)
    # two flat, pointed tails fanning out of the knot
    leaf = [(0.0, -0.002), (0.011, 0.006), (0.017, 0.02), (0.016, 0.034), (0.01, 0.048), (0.0, 0.062)]
    for dirn, roll in ((Vector((0.75, -0.25, -0.45)), 0.0), (Vector((0.35, -0.45, -0.8)), 0.0)):
        tm = frame(kc + dirn.normalized() * 0.012, dirn) @ S(0.34, 1.0, 1.0)
        p.add(lathe(leaf, 24, cap_top=True, cap_bottom=True), "bandana", tm, smooth=True)
    return p


# ---------------------------------------------------------------- head

NECK = 0.825
HD = vc.Head((0, 0, 1.09), 0.30, 0.276, 0.27)
HAT = Matrix.Translation(HD.hc + Vector((0, 0.035, 0.138))) @ M(rot=(-22, 0, 0)) @ S(1, 0.95, 1)     # tipped well back, AC style


def chaikin(pts, it=3):
    for _ in range(it):
        new = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            new += [a * 0.75 + b * 0.25, a * 0.25 + b * 0.75]
        new.append(pts[-1])
        pts = new
    return pts


HAT_CTRL = [(0.0, 0.205), (0.09, 0.203), (0.16, 0.195), (0.215, 0.178), (0.252, 0.152), (0.274, 0.115), (0.284, 0.075), (0.29, 0.035),
            (0.294, 0.006), (0.302, 0.0), (0.34, -0.004), (0.40, -0.012), (0.45, -0.022), (0.49, -0.034), (0.512, -0.044), (0.522, -0.052),
            (0.514, -0.061), (0.49, -0.057), (0.45, -0.047), (0.40, -0.037), (0.34, -0.029), (0.296, -0.023), (0.286, -0.022)]


def hat_profile():
    """Smoothed hat cross-section resampled by arc length: dense on the visible outside, sparse underneath."""
    pts = chaikin([Vector(p) for p in HAT_CTRL], 4)
    cum = [0.0]
    for a, b in zip(pts, pts[1:]):
        cum.append(cum[-1] + (b - a).length)
    total = cum[-1]
    ie = max(range(len(pts)), key=lambda i: pts[i].x)
    s_edge = cum[ie]

    def at(s):
        for i in range(len(pts) - 1):
            if cum[i + 1] >= s:
                t = (s - cum[i]) / max(cum[i + 1] - cum[i], 1e-9)
                return pts[i] + (pts[i + 1] - pts[i]) * t, (pts[i + 1] - pts[i]).normalized()
        return pts[-1], (pts[-1] - pts[-2]).normalized()
    out, s = [], 0.006
    while s < total:
        c, t = at(s)
        out.append((c.x, c.y, -t.y, t.x, s))          # r, z, outward normal (nr, nz), arc length
        s += 0.0078 if s < s_edge + 0.02 else 0.016
    c, t = at(total)
    out.append((c.x, c.y, -t.y, t.x, total))
    return out, s_edge


COIL = 0.029


def straw_bump(s, th, s_edge):
    """Coiled straw: a plump flat-topped ridge per coil (rings on the brim, bands up the crown) with
    narrow grooves between, and a faint stitch rhythm along each coil."""
    k = math.floor(s / COIL)
    f = s / COIL - k
    ridge = math.sin(math.pi * f) ** 0.55
    if s < s_edge - 0.012:
        taper = min(1.0, (s_edge - 0.012 - s) / 0.02)
        return ridge * (0.0042 + 0.0007 * math.cos(40 * th + math.pi * k)) * taper
    if s > s_edge + 0.012:
        return ridge * 0.0016 * min(1.0, (s - s_edge - 0.012) / 0.02)
    return 0.0


def straw_hat(hp):
    prof, s_edge = hat_profile()
    segs = 128
    bm = bmesh.new()
    rings = []
    for r, z, nr, nz, s in prof:
        ring = []
        for i in range(segs):
            th = 2 * math.pi * i / segs
            b = straw_bump(s, th, s_edge)
            rr, zz = r + nr * b, z + nz * b
            ring.append(bm.verts.new((rr * math.cos(th), rr * math.sin(th), zz)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], b[i], b[j], a[j]))
    pole = bm.verts.new((0, 0, prof[0][1] + 0.0005))
    for i in range(segs):
        bm.faces.new((pole, rings[0][i], rings[0][(i + 1) % segs]))
    hp.add(bm, "straw", HAT, smooth=True)
    # bound edge
    re, ze = max(((r, z) for r, z, _, _, _ in prof), key=lambda q: q[0])
    hp.add(bm_tube([Vector((re * math.cos(t), re * math.sin(t), ze)) for t in [2 * math.pi * k / 96 for k in range(97)]], 0.0068, 10, cap=False),
           "straw_dark", HAT, smooth=True)
    # green ribbon band with piped edges and a bow on her left
    band = [(0.3005, 0.002), (0.3045, 0.007), (0.3025, 0.026), (0.3005, 0.045), (0.2965, 0.05)]
    hp.add(lathe(band, 160), "ribbon", HAT, smooth=True)
    for r, z in ((0.304, 0.0055), (0.2995, 0.046)):
        hp.add(bm_tube([Vector((r * math.cos(t), r * math.sin(t), z)) for t in [2 * math.pi * k / 96 for k in range(97)]], 0.0022, 6, cap=False),
               "ribbon_dark", HAT, smooth=True)
    phi = math.radians(-12)
    rad, tan = Vector((math.cos(phi), math.sin(phi), 0)), Vector((-math.sin(phi), math.cos(phi), 0))
    kn = rad * 0.31 + Vector((0, 0, 0.026))
    hp.add(sphere(18, 12), "ribbon", HAT @ frame(kn, rad) @ S(0.014, 0.017, 0.009), smooth=True)
    for s in (-1, 1):
        loop = [kn + tan * (s * 0.042 * (1 - math.cos(t)) * 0.55) + rad * (0.008 * math.sin(t) ** 2) + Vector((0, 0, 0.017 * math.sin(t) + s * 0.004 * (1 - math.cos(t))))
                for t in [2 * math.pi * k / 20 for k in range(21)]]
        hp.add(bm_tube(loop, 0.0055, 10, cap=False), "ribbon", HAT, smooth=True)
    # two ears of wheat tucked behind the band at the front left
    for ph, lean, length, seed in ((-46, (0.32, 0.25), 0.19, 1), (-36, (0.18, 0.42), 0.165, 2)):
        a = math.radians(ph)
        rd, tg = Vector((math.cos(a), math.sin(a), 0)), Vector((-math.sin(a), math.cos(a), 0))
        base = rd * 0.297 + Vector((0, 0, 0.012))
        d = (Vector((0, 0, 1)) + rd * lean[0] + tg * lean[1]).normalized()
        wheat(hp, base, d, length, seed)


def wheat(hp, base, d, length, seed):
    rnd = random.Random(seed)
    tip = base + d * length
    stem = vc.bezier(base, base + d * length * 0.5 + Vector((0, 0, 0.004)), base + d * (length - 0.06), 8)
    hp.add(bm_tube(stem, 0.0032, 8), "wheat_dark", HAT, smooth=True)
    side = d.cross(Vector((0, 0, 1)))
    side = side.normalized() if side.length > 1e-6 else Vector((1, 0, 0))
    for k in range(9):
        t = (length - 0.065) + k * 0.0075
        c = base + d * t
        for sgn in (-1, 1):
            g = (d + side * sgn * 0.55).normalized()
            gc = c + side * sgn * 0.0045 + d * (0.0037 if sgn > 0 else 0.0)
            sc = 1.0 - 0.06 * k
            hp.add(sphere(10, 6), "wheat" if (k + (sgn > 0)) % 2 else "wheat_light", HAT @ frame(gc, g) @ S(0.0058 * sc, 0.0058 * sc, 0.0115 * sc), smooth=True)
            aw = (g + d * 1.4).normalized()
            hp.add(bm_tube([gc + g * 0.009, gc + g * 0.009 + aw * rnd.uniform(0.026, 0.036)], [0.0013, 0.0006], 4), "wheat_light", HAT, smooth=True)
    hp.add(sphere(12, 8), "wheat_light", HAT @ frame(tip - d * 0.002, d) @ S(0.005, 0.005, 0.01), smooth=True)


def hair_raw():
    """Copper bob under the hat: a fringe band with chunky locks swept from a parting on her left,
    a rounded lock down each side curving in under the jaw, and a smooth shell round the back."""
    F, SP = HD.fpt, HD.spt
    els = []
    # a solid cap over the whole scalp, from the hairline up under the crown (thin, so it clears the hat)
    inv = HAT.inverted()
    z = 0.03
    while z < HD.c * 0.985:
        ring = HD.a * math.sqrt(max(1 - (z / HD.c) ** 2, 0.0))
        n = max(6, int(2 * math.pi * ring * 0.93 / 0.026))
        for k in range(n):
            phi = -180 + 360 * k / n
            hairline = 0.03 + 0.09 * max(0.0, -math.sin(math.radians(phi))) ** 2
            if z < hairline:
                continue
            c = SP(phi, z, -0.012)[0]
            if (inv @ c).z > 0.06:          # deep inside the crown: never seen
                continue
            els.append((c, 0.034))
        z += 0.022
    # fringe: six broad overlapping locks laid over the cap, starting right at the hat
    for xt, zt, sw in ((-0.21, 0.07, -0.05), (-0.145, 0.084, -0.06), (-0.075, 0.092, -0.065), (-0.005, 0.096, -0.065),
                       (0.085, 0.094, 0.055), (0.165, 0.08, 0.05)):
        for k in range(11):
            t = k / 10
            x = xt - sw * (1 - t) ** 1.3
            z = 0.228 - 0.6 * xt * xt + (zt - 0.228 + 0.6 * xt * xt) * t
            v = 0.031 - 0.016 * t ** 1.5
            els.append((F(x, z, 0.01 + v * 0.3)[0], v))
            w = 0.04 * (1 - t) ** 0.8          # a broad tongue of hair, narrowing to its tip
            if w > 0.007:
                for sx in (-1, 1):
                    els.append((F(x + sx * w, z + 0.004, 0.01 + v * 0.25)[0], v * 0.82))
    # the shell: rows round the sides and back, the upper row kept under the hat's base plane
    for z0, ph0, ph1, v, out, n in ((0.11, -40, 220, 0.044, -0.004, 34), (0.055, -32, 212, 0.044, -0.005, 32),
                                    (0.0, 0, 180, 0.045, -0.006, 24), (-0.05, 6, 174, 0.043, -0.006, 22),
                                    (-0.095, 10, 170, 0.04, -0.006, 20), (-0.14, 14, 166, 0.038, -0.006, 18),
                                    (-0.18, 28, 152, 0.034, -0.004, 16)):
        for k in range(n + 1):
            phi = ph0 + (ph1 - ph0) * k / n
            els.append((SP(phi, z0, out)[0], v))
    for k in range(9):
        phi = 45 + 90 * k / 8
        els.append((SP(phi, -0.215, -0.002)[0], 0.028))
    # one rounded lock down each side, over the ear, curving in under the jaw to a defined tip (mirrored)
    lock = [(-18, 0.1, 0.046), (-12, 0.045, 0.048), (-8, -0.01, 0.048), (-7, -0.06, 0.046), (-9, -0.105, 0.043), (-15, -0.145, 0.038),
            (-24, -0.175, 0.032), (-34, -0.195, 0.026), (-43, -0.208, 0.02), (-51, -0.215, 0.015), (-57, -0.218, 0.011)]
    pts = []
    for (p0, z0, v0), (p1, z1, v1) in zip(lock, lock[1:]):
        for k in range(3):
            t = k / 3
            pts.append((p0 + (p1 - p0) * t, z0 + (z1 - z0) * t, v0 + (v1 - v0) * t))
    pts.append(lock[-1])
    for s in (-1, 1):
        for phi, z, v in pts:
            els.append((SP(phi if s > 0 else -180 - phi, z, 0.036 - v)[0], v))
    return els


def _crown_r(z):
    crown = [(zz, r) for r, zz in reversed(HAT_CTRL[:10])]
    for (z0, r0), (z1, r1) in zip(crown, crown[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return crown[0][1] if z < crown[0][0] else 0.0


def _pokes(c, v):
    """True if a hair ball would show outside the crown above the brim's base plane."""
    q = HAT.inverted() @ Vector(c)
    top = q.z + v * 0.5
    rr = math.hypot(q.x, q.y) + v * 0.85
    if top > 0.0 and rr > _crown_r(top) - 0.004:
        return True                                   # through the crown
    return top > -0.032 and rr > 0.282               # up through the brim just outside the crown


def hair_elems():
    return [(c, v) for c, v in hair_raw() if not _pokes(c, v)]


def head():
    hp = Part("head")
    H = HD.H
    HD.skull(hp)
    HD.ears(hp, size=0.96)
    for s in (-1, 1):
        HD.eye(hp, s, 0.093, 0.0, 0.029, 0.041)
        lash = [HD.fpt(s * (0.093 + dx), dz, 0.004)[0] for dx, dz in ((0.021, 0.028), (0.03, 0.035), (0.037, 0.04))]
        hp.add(bm_tube(lash, [0.004, 0.0032, 0.0018], 6), "eye_dark", smooth=True)
    HD.blush(hp, x=0.168, z=-0.05, w=0.044, h=0.027)
    HD.nose(hp, z=-0.048, size=(0.046, 0.041, 0.046))
    HD.mouth(hp, z=-0.128, kind="smile", w=0.025)
    HD.brows(hp, "hair_copper", pts=((0.056, 0.064, 0.015), (0.087, 0.074, 0.018), (0.118, 0.072, 0.016), (0.142, 0.063, 0.011)))
    # freckles across both cheeks
    for s in (-1, 1):
        for x, z, r in ((0.064, -0.058, 0.0062), (0.082, -0.074, 0.0055), (0.099, -0.057, 0.0068), (0.114, -0.073, 0.0058), (0.123, -0.054, 0.005)):
            HD.on_face(hp, "freckle", s * x, z, r, r * 0.9, 0.0018, out=0.003, u=12, v=6)
    # a soft, flat dusting of flour on her right cheek, only a little lighter than her skin
    for dx, dz, w, h, o in ((0.0, 0.0, 0.026, 0.016, 0.0006), (0.014, 0.007, 0.016, 0.011, 0.0009), (-0.012, -0.006, 0.014, 0.009, 0.0009)):
        HD.on_face(hp, "flour_skin", -0.198 + dx, -0.1 + dz, w, h, 0.0004, out=o, u=24, v=8)
    # copper hair: fringe, side locks, back
    hb = meta(hair_elems(), 0.0088)
    hp.add(hb, "hair_copper", None, smooth=True)
    # a short plait down the back, tied with green ribbon, a soft tuft at the end
    for k in range(8):
        s = 1 if k % 2 else -1
        sc = 1.0 - 0.04 * k
        y, z = 0.262 - 0.0105 * k, -0.135 - 0.03 * k
        hp.add(sphere(18, 10), "hair_copper", M(H(s * 0.009 * sc, y, z), (0, s * 32, 0), (0.024 * sc, 0.025 * sc, 0.034 * sc)), smooth=True)
    ty, tz = 0.182, -0.372
    hp.add(lathe([(0.0155, -0.008), (0.0178, -0.004), (0.0178, 0.004), (0.0155, 0.008)], 24, cap_top=True, cap_bottom=True), "ribbon", Matrix.Translation(H(0, ty, tz)), smooth=True)
    for s in (-1, 1):
        hp.add(sphere(14, 8), "ribbon", M(H(s * 0.02, ty + 0.012, tz), (0, s * 20, 0), (0.015, 0.006, 0.01)), smooth=True)
    hp.add(meta([(H(0, ty, tz - 0.018), 0.016), (H(0.008, ty + 0.002, tz - 0.038), 0.012), (H(-0.009, ty, tz - 0.04), 0.011), (H(0, ty + 0.004, tz - 0.05), 0.009)], 0.005),
           "hair_copper", None, smooth=True)
    straw_hat(hp)
    return hp


def hair_hat_check():
    """Hair poking outside the crown above the brim's base plane is visible clipping: report it."""
    raw = hair_raw()
    print("HAIRCHECK dropped", len(raw) - len(hair_elems()), "of", len(raw), "hair balls that would poke through the crown")
    inv = HAT.inverted()
    bad = 0
    for i in range(48):
        for j in range(1, 24):
            th, ph = 2 * math.pi * i / 48, math.pi * j / 24
            p = HD.hc + Vector((HD.a * math.sin(ph) * math.cos(th), HD.b * math.sin(ph) * math.sin(th), HD.c * math.cos(ph)))
            q = inv @ p
            if q.z > 0.0 and math.hypot(q.x, q.y) > _crown_r(q.z) - 0.003:
                bad += 1
    print("HATCHECK skull points poking through the crown:", bad)


# ---------------------------------------------------------------- arms (rolled sleeves) and legs

def arm(side, cfg):
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    sr = cfg["sleeve_r"]
    p.add(sphere(28, 18), "mustard", M(pv, scale=sr * 1.04), smooth=True)
    p.add(bm_tube([pv, pv + d * 0.06, pv + d * 0.11], [sr, sr * 1.02, sr * 1.04], 24, cap=False), "mustard", smooth=True)
    # the sleeve rolled up twice above the elbow, stitched
    cm = frame(pv + d * 0.1, d)
    roll = [(sr * 0.98, -0.008), (sr * 1.14, -0.004), (sr * 1.23, 0.006), (sr * 1.22, 0.017), (sr * 1.12, 0.022), (sr * 1.19, 0.028),
            (sr * 1.2, 0.038), (sr * 1.1, 0.047), (0.05, 0.052), (0.044, 0.054)]
    p.add(lathe(roll, 36), "mustard", cm, smooth=True)
    p.add(bm_tube(ring_pts(cm, sr * 1.125, 36, 0.022), 0.0028, 6, cap=False), "mustard_dark", smooth=True)
    stitch(p, ring_pts(cm, sr * 1.235, 30, 0.011), "mustard_light", 0.011, 0.007, 0.0022)
    # bare forearm and a mitten hand
    p.add(bm_tube([pv + d * 0.14, pv + d * 0.19, pv + d * 0.235], [0.0435, 0.042, 0.04], 20), "skin_warm", smooth=True)
    n0 = Vector((side * 0.8, -0.6, 0.0))
    n = (n0 - d * n0.dot(d)).normalized()
    b = d.cross(n).normalized()
    if side > 0:          # flour dust on her left forearm
        for t, a, r in ((0.17, -0.6, 0.011), (0.19, -0.9, 0.008), (0.205, -0.5, 0.006)):
            q = (n * math.cos(a) + b * math.sin(a)).normalized()
            p.add(sphere(14, 6), "flour", frame(pv + d * t + q * 0.043, q) @ S(r, r * 0.7, 0.0015), smooth=True)
    vc.mitten(p, vc.hand_c(side, cfg), "skin_warm", side, size=0.95)
    return p


CFG = dict(
    neck_z=NECK, shoulder_x=0.17, shoulder_z=0.705, hip_x=0.085, hip_z=0.39,
    arm_len=0.27, arm_splay=12, sleeve_r=0.064, arm=arm,
    leg_r=0.056, pants_mat="trousers", boot_mat="boot", boot_top=0.21, boot_trim="boot_dark",
    body=body, head=head, closeup_z=1.04,
    shots=[("back", (0, 0, 0.85), 160, 10, 2.6), ("hat", (0, 0, 1.15), -30, 38, 1.6), ("above", (0, 0, 1.08), -15, 25, 1.6)],
)


def main():
    hair_hat_check()
    return vc.build("miller", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
