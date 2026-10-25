"""Odo the librarian, in the soft Animal Crossing style of Marlo the fisher (restyled 2026-10-23).
The thinnest villager: an absent-minded scholar with a bald-ish crown, wild grey-brown tufts of
hair sculpted as clumpy locks at the sides and back, one curling cowlick, one brow raised higher
than the other, round brass spectacles resting on his nose (thin rims, glints, temples hooked over
the ears) and a goose quill tucked behind his right ear with an inky nib.
A long indigo robe: rolled stitched hem, darker front placket with brass buttons, a stand collar,
a folded hood at the back, a twisted two-strand rope belt with a knot and frayed tassels, ink
blots with drips and splatters, a hip pocket with a rolled scroll, a mended patch at the back,
wide bell sleeves with darker rolled cuffs and a lining, and ink-dipped mitten fingertips.
Prop: `books` (arm_l, held out in front): a messy stack of a gold-cornered tome, a green book,
a reversed blue book and a strapped notebook, with rounded spines, raised bands, title labels,
page edges, bookmark ribbons and a loose written page.
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
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "robe": "#5D5EA2", "robe_dark": "#46467F", "robe_light": "#AAA8D8", "robe_lining": "#363663",
    "trim": "#403F76", "cuff": "#3E3D72", "patch": "#7489B4",
    "ink": "#1C2036", "ink_smudge": "#59607E",
    "rope": "#CDAE6E", "rope_light": "#E2CA92", "rope_dark": "#A68A50",
    "hair": "#AA9A88", "hair_dark": "#857A6F",
    "quill": "#EFE6D2", "vane": "#F4EFE4", "vane_tip": "#C9C2B5",
    "shoe": "#7A4B36", "shoe_dark": "#5A3626", "trousers": "#4A4652",
    "pages": "#F2E8CF", "page_line": "#CDBE9C", "paper": "#F6EFDF",
    "tome": "#A44B3E", "tome_dark": "#7A3329", "green_bk": "#5A7F5C", "green_dark": "#3F5E42",
    "blue_bk": "#4D6898", "blue_dark": "#374D74", "note": "#9A6A44", "note_dark": "#6E4A2E",
    "ribbon_gold": "#E0B54E", "ribbon_red": "#C24A3C", "ribbon_green": "#4C8A62", "wax": "#B03A33",
}, gloss={"ink": 0.3, "ink_smudge": 0.6, "wax": 0.35})

YS = 0.8
ROBE = vc.Garment([(0.2, 0.105), (0.206, 0.125), (0.199, 0.17), (0.185, 0.27), (0.172, 0.37), (0.163, 0.46), (0.158, 0.54),
                   (0.154, 0.62), (0.145, 0.68), (0.127, 0.735), (0.1, 0.785), (0.068, 0.82), (0.04, 0.836)], ys=YS)
BELT_Z = 0.465


# ---------------------------------------------------------------- helpers

def strip(part, pts, wdir, w, t, matname):
    """A thin flat ribbon swept along pts; wdir is its width direction (one Vector or one per point)."""
    pts = [Vector(p) for p in pts]
    bm = bmesh.new()
    rings = []
    for i, P in enumerate(pts):
        T = (pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]).normalized()
        wd = Vector(wdir[i] if isinstance(wdir, list) else wdir)
        wd = (wd - T * wd.dot(T)).normalized()
        n = T.cross(wd).normalized()
        rings.append([bm.verts.new(P + wd * (sw * w / 2) + n * (sn * t / 2)) for sw, sn in ((1, 1), (-1, 1), (-1, -1), (1, -1))])
    for a, b in zip(rings, rings[1:]):
        for k in range(4):
            j = (k + 1) % 4
            bm.faces.new((a[k], a[j], b[j], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, matname, None, smooth=True)


def decal(part, G, phi, z, rfun, matname, out=0.0026, dome=0.0022, nr=5, nt=40):
    """A soft blob lying exactly on the garment surface (ink stains): rfun(theta) is the outline radius."""
    bm = bmesh.new()
    r0 = G.rad(z)
    a = math.radians(phi)
    speed = r0 * math.sqrt(math.sin(a) ** 2 + (G.ys * math.cos(a)) ** 2)

    def vert(rho, th):
        R = rfun(th) * rho
        du, dz = R * math.cos(th), R * math.sin(th)
        return bm.verts.new(G.pt(phi + math.degrees(du / speed), z + dz, out + dome * (1 - rho * rho)))

    c = vert(0.0, 0.0)
    rings = [[vert(k / nr, 2 * math.pi * i / nt) for i in range(nt)] for k in range(1, nr + 1)]
    for i in range(nt):
        bm.faces.new((c, rings[0][i], rings[0][(i + 1) % nt]))
    for A, B in zip(rings, rings[1:]):
        for i in range(nt):
            j = (i + 1) % nt
            bm.faces.new((A[i], B[i], B[j], A[j]))
    part.add(bm, matname, None, smooth=True)


def blot(part, G, phi, z, size, seed, drip=True):
    """Ink blot with a wobbly outline, a few splatter dots and a drip running down."""
    rnd = random.Random(seed)
    p1, p2, p3 = (rnd.uniform(0, 6.28) for _ in range(3))
    decal(part, G, phi, z, lambda t: size * (1 + 0.2 * math.sin(3 * t + p1) + 0.1 * math.sin(5 * t + p2) + 0.06 * math.sin(7 * t + p3)), "ink")
    r0 = G.rad(z)
    for k in range(4):
        th = rnd.uniform(0, 2 * math.pi)
        dist = size * rnd.uniform(1.45, 1.95)
        sr = size * rnd.uniform(0.12, 0.24)
        decal(part, G, phi + math.degrees(dist * math.cos(th) / r0), z + dist * math.sin(th), lambda t, sr=sr: sr, "ink", dome=0.0012, nr=2, nt=16)
    if drip:
        dphi = rnd.uniform(-4, 4)
        L = size * rnd.uniform(1.6, 2.2)
        rr = size * 0.2
        pts = [G.pt(phi + dphi * (k / 8) ** 2, z - size * 0.6 - L * k / 8, rr * 0.25) for k in range(9)]
        part.add(bm_tube(pts, [rr * (1 - 0.3 * k / 8) for k in range(9)], 10), "ink", smooth=True)
        decal(part, G, phi + dphi, z - size * 0.6 - L - rr * 0.6, lambda t: rr * 1.5 * (1 + 0.15 * math.sin(t * 2)), "ink", dome=0.003, nr=3, nt=20)


def rope(part, pts, outfn, r=0.0062, off=0.0049, pitch=0.03, mats=("rope", "rope_light"), closed=False):
    """Two-strand twisted rope along a centre line; outfn(P) gives the outward side (for the twist frame)."""
    pts = [Vector(p) for p in pts]
    L = plen(pts)
    if closed:
        pitch = L / round(L / pitch)
    n = max(int(L / (pitch / 10)), 4)
    P = [polyline_at(pts, L * k / n) for k in range(n + 1)]
    for s, mat in enumerate(mats):
        Q = []
        for k, c in enumerate(P):
            T = (P[min(k + 1, n)] - P[max(k - 1, 0)]).normalized()
            u = outfn(c)
            u = (u - T * u.dot(T)).normalized()
            v = T.cross(u)
            th = 2 * math.pi * (L * k / n) / pitch + s * math.pi
            Q.append(c + (u * math.cos(th) + v * math.sin(th)) * off)
        part.add(bm_tube(Q, r, 8, cap=not closed), mat, smooth=True)


def robe_out(P):
    return Vector((P.x, P.y / (YS * YS), 0.0)).normalized()


# ---------------------------------------------------------------- body (robe)

def body():
    p = Part("body")
    G = ROBE
    G.mesh(p, "robe")
    # rolled hem with a line of stitching above it
    G.hem(p, 0.112, 0.016, "robe_dark")
    G.stitch_ring(p, 0.15, matname="robe_light")
    # darker front placket from collar to hem, edged and stitched, brass buttons on the chest
    G.panel(p, -98, -82, 0.11, 0.8, "trim", 0.006, 4)
    for phi in (-98, -82):
        p.add(bm_tube([G.pt(phi, z, 0.007) for z in (0.112, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8)], 0.0038, 6), "robe_dark", smooth=True)
    for phi in (-95.5, -84.5):
        stitch(p, [G.pt(phi, z, 0.0075) for z in (0.13, 0.3, 0.45, 0.6, 0.79)], "robe_light", 0.011, 0.007, 0.0022)
    for z in (0.545, 0.605, 0.665, 0.725):
        G.button(p, -90, z, 0.0125, "brass", out=0.009)
    # stand collar (open at the front) and the neck
    p.add(bm_lathe([(0.064, 0.8), (0.071, 0.825), (0.072, 0.85), (0.069, 0.858)], 48, arc=(-62, 242)), "trim", M(scale=(1, 0.93, 1)), smooth=True)
    p.add(bm_tube([(0.0705 * math.cos(math.radians(a)), 0.93 * 0.0705 * math.sin(math.radians(a)), 0.858) for a in range(-62, 243, 8)], 0.004, 6), "robe_dark", smooth=True)
    p.add(bm_cyl(0.054, 0.052, 0.12, 24), "skin_warm", M((0, 0, 0.76)), smooth=True)
    # folded hood lying over the back of the shoulders, with a rolled edge and a little point
    hood = [(0.071, 0.842), (0.1, 0.838), (0.13, 0.822), (0.153, 0.79), (0.163, 0.752), (0.161, 0.718), (0.151, 0.694)]
    p.add(bm_lathe(hood, 40, arc=(22, 158)), "robe", M(scale=(1, 0.86, 1)), smooth=True)
    edge = [Vector((0.071 * math.cos(math.radians(22)), 0.86 * 0.071 * math.sin(math.radians(22)), 0.842))]
    edge = [Vector((r * math.cos(math.radians(22)), 0.86 * r * math.sin(math.radians(22)), z)) for r, z in hood]
    edge += [Vector((0.151 * math.cos(math.radians(a)), 0.86 * 0.151 * math.sin(math.radians(a)), 0.694)) for a in range(26, 157, 6)]
    edge += [Vector((r * math.cos(math.radians(158)), 0.86 * r * math.sin(math.radians(158)), z)) for r, z in reversed(hood)]
    p.add(bm_tube(edge, 0.0105, 10), "robe_dark", smooth=True)
    tip = [Vector((0, 0.127, 0.705)), Vector((0, 0.134, 0.675)), Vector((0, 0.136, 0.648)), Vector((0, 0.133, 0.628))]
    flat_y = Matrix.Translation((0, 0.13, 0)) @ S(1, 0.42, 1) @ Matrix.Translation((0, -0.13, 0))
    p.add(bm_tube(tip, [0.036, 0.033, 0.024, 0.009], 24), "robe", flat_y, smooth=True)
    # twisted rope belt, a knot on his left front and two hanging ends with whipping and frayed tassels
    belt = [G.pt(-180 + 360 * k / 120, BELT_Z, 0.011) for k in range(121)]
    rope(p, belt, robe_out, closed=True)
    kphi = -60
    kp = G.pt(kphi, BELT_Z - 0.004, 0.02)
    kn = G.normal(kphi, BELT_Z, 0.0)
    kf = frame(kp, kn)
    p.add(sphere(24, 16), "rope", kf @ S(0.024, 0.02, 0.017), smooth=True)
    for al in (48, 132):
        av = Vector((math.cos(math.radians(al)), math.sin(math.radians(al)), 0))
        loop = [kf @ (av * (0.0245 * math.cos(t)) + Vector((0, 0, 0.0185 * math.sin(t)))) for t in [2 * math.pi * k / 24 for k in range(25)]]
        p.add(bm_tube(loop, 0.0068, 8, cap=False), "rope_light" if al < 90 else "rope_dark", smooth=True)
    for ph0, ph1, zend, sway in ((-64, -70, 0.27, 2.5), (-56, -51, 0.31, -2.0)):
        zs = [BELT_Z - 0.02 - (BELT_Z - 0.02 - zend) * k / 10 for k in range(11)]
        pts = [G.pt(ph0 + (ph1 - ph0) * k / 10 + sway * math.sin(math.pi * k / 10), z, 0.012) for k, z in enumerate(zs)]
        rope(p, pts, robe_out, r=0.0056, off=0.0044, pitch=0.027)
        e = pts[-1]
        ef = frame(e, pts[-1] - pts[-2])
        p.add(lathe([(0.0098, -0.016), (0.0106, -0.012), (0.0106, 0.0), (0.0098, 0.004)], 16), "rope_dark", ef, smooth=True)
        for k in range(8):
            t = 2 * math.pi * k / 8
            rad = Vector((math.cos(t), math.sin(t), 0)) * 0.0055
            spread = Vector((math.cos(t), math.sin(t), 0)) * 0.011
            fr = [ef @ (rad + Vector((0, 0, 0.004))), ef @ (rad * 1.2 + spread * 0.4 + Vector((0, 0, 0.022))), ef @ (rad + spread + Vector((0, 0, 0.042 + 0.006 * math.sin(3 * t))))]
            p.add(bm_tube(fr, [0.0028, 0.0024, 0.0012], 6), "rope_light", smooth=True)
    # hip pocket on his right with a rolled scroll tied with a ribbon and a wax seal
    G.pocket(p, -128, 14, 0.24, 0.36, "robe", edge="robe_dark", thread="robe_light")
    sb, st = G.pt(-124, 0.29, 0.028), G.pt(-121, 0.43, 0.03)
    ax = (st - sb).normalized()
    sf = frame(sb, ax)
    sl = (st - sb).length
    p.add(lathe([(0.016, 0.0), (0.0172, 0.004), (0.0172, sl - 0.004), (0.016, sl)], 32, cap_top=True), "paper", sf, smooth=True)
    p.add(bm_tube([sf @ Vector((0.006 * math.cos(t) * (1 - t / 13), 0.006 * math.sin(t) * (1 - t / 13), sl + 0.0012)) for t in [k * 0.4 for k in range(30)]],
                  0.0011, 4), "page_line", smooth=True)
    p.add(lathe([(0.0178, sl - 0.045), (0.0182, sl - 0.04), (0.0182, sl - 0.03), (0.0178, sl - 0.025)], 32), "ribbon_red", sf, smooth=True)
    p.add(sphere(16, 10), "wax", sf @ Matrix.Translation((0.0, -0.0185, sl - 0.035)) @ S(0.009, 0.004, 0.009), smooth=True)
    # ink blots, splatters and drips (he wipes his pen on himself)
    blot(p, G, -108, 0.645, 0.022, 3)
    blot(p, G, -36, 0.6, 0.026, 7)
    blot(p, G, -118, 0.19, 0.02, 11, drip=False)
    blot(p, G, -78, 0.26, 0.015, 19)
    # a mended patch low on the back with cross stitches round it
    G.panel(p, 108, 132, 0.19, 0.29, "patch", 0.006, 8)
    o = 0.0085
    border = G.arc(108, 132, 0.19, o) + list(reversed(G.arc(108, 132, 0.29, o))) + [G.pt(108, 0.19, o)]
    p.add(bm_tube(border, 0.0035, 6, cap=False), "robe_dark", smooth=True)
    pts = [(phi, 0.198) for phi in range(111, 131, 4)] + [(phi, 0.282) for phi in range(111, 131, 4)] + [(110.5, z) for z in (0.22, 0.25)] + [(129.5, z) for z in (0.22, 0.25)]
    for phi, z in pts:
        for s in (-1, 1):
            p.add(bm_tube([G.pt(phi - 1.3, z - s * 0.0055, o + 0.0015), G.pt(phi + 1.3, z + s * 0.0055, o + 0.0015)], 0.0016, 4), "robe_light", smooth=True)
    return p


# ---------------------------------------------------------------- head

NECK = 0.84
HD = vc.Head((0, 0, NECK + 0.27), 0.29, 0.268, 0.262)


def sph(s, a):
    """Head angle for side s: a = 0 at the side, 90 at the back, negative toward the face."""
    return a if s > 0 else 180 - a


def lock(root, dirv, length, r0, curl=(0, 0, 0), n=6, taper=0.74):
    """One tapered clump of hair as metaball elements, bending by curl toward the tip."""
    dirv, curl = Vector(dirv).normalized(), Vector(curl)
    return [(root + dirv * (length * k / (n - 1)) + curl * (k / (n - 1)) ** 2, r0 * (1 - taper * k / (n - 1))) for k in range(n)]


def spectacles(hp):
    """Round brass spectacles resting on the nose: thin rims, hinges, temples over the ears, glints."""
    H = HD.H
    R = 0.055
    inner = {}
    for s in (-1, 1):
        nl = Vector((s * 0.2, -1.0, 0.04)).normalized()
        c = H(s * 0.099, -0.304, -0.006)
        F = frame(c, nl)
        hp.add(bm_tube(ring_pts(F, R, 48), 0.0052, 10, cap=False), "brass", smooth=True)
        hinge = F @ Vector((s * R, 0, 0))
        inner[s] = F @ Vector((-s * R, 0, 0))
        hp.add(sphere(16, 10), "brass", M(hinge + Vector((s * 0.004, 0.003, 0)), scale=(0.0085, 0.009, 0.0075)), smooth=True)
        # glint: a short soft arc on the glass, up on the side away from the eye highlight
        g0, g1 = (128, 158) if s > 0 else (128, 158)
        hp.add(bm_tube([F @ Vector((R * 0.7 * math.cos(math.radians(t)), R * 0.7 * math.sin(math.radians(t)), 0.0)) for t in range(g0, g1 + 1, 5)],
                       0.0026, 6), "white", smooth=True)
        temple = [hinge + Vector((s * 0.006, 0.004, 0)), H(s * 0.178, -0.236, 0.004), HD.spt(sph(s, -38), 0.012, 0.012)[0],
                  HD.spt(sph(s, -18), 0.022, 0.013)[0], HD.spt(sph(s, -6), 0.034, 0.016)[0], H(s * (HD.a + 0.014), 0.012, 0.05),
                  H(s * (HD.a + 0.012), 0.045, 0.034), H(s * (HD.a - 0.004), 0.064, 0.0)]
        hp.add(bm_tube(vc.bezier(temple[0], temple[1], temple[2], 4)[:-1] + temple[2:], 0.0042, 8), "brass", smooth=True)
    hp.add(bm_tube(vc.bezier(inner[-1], H(0, -0.322, 0.03), inner[1], 12), 0.0046, 8), "brass", smooth=True)


def quill(hp):
    """A goose quill resting on his right ear: inky nib in front, vane rising up and back."""
    H = HD.H
    q = [H(-0.296, -0.082, 0.014), H(-0.305, -0.03, 0.04), H(-0.312, 0.018, 0.074), H(-0.32, 0.058, 0.122),
         H(-0.327, 0.096, 0.178), H(-0.333, 0.128, 0.228), H(-0.337, 0.15, 0.262)]
    nib = q[0] + (q[0] - q[1]).normalized() * 0.024
    hp.add(bm_tube([nib, q[0] + (q[0] - q[1]).normalized() * 0.006], [0.0006, 0.0042], 10), "ink", smooth=True)
    hp.add(bm_tube(q[:3], [0.0044, 0.0042, 0.0038], 10), "quill", smooth=True)
    c = Vector((q[3].x, 0, 0))
    flat = Matrix.Translation(c) @ S(0.2, 1, 1) @ Matrix.Translation(-c)
    hp.add(bm_tube(q[2:], [0.004, 0.022, 0.03, 0.027, 0.017, 0.003], 16), "vane", flat, smooth=True)
    for sx in (-1, 1):
        hp.add(bm_tube([v + Vector((sx * 0.0068, 0, 0)) for v in q[2:]], [0.0028, 0.0026, 0.0023, 0.002, 0.0015, 0.0008], 6), "quill", smooth=True)
    # two splits in the vane
    for i, w in ((3, 0.028), (4, 0.024)):
        d = (q[i + 1] - q[i - 1]).normalized()
        perp = Vector((0, -d.z, d.y))
        for sx in (-1, 1):
            hp.add(bm_tube([q[i] + perp * 0.006 + Vector((sx * 0.0062, 0, 0)), q[i] + perp * w + d * 0.012 + Vector((sx * 0.0062, 0, 0))], 0.0012, 4), "vane_tip", smooth=True)


def head():
    hp = Part("head")
    H = HD.H
    HD.face(hp, skin="skin_warm", nose="nose", mouth="smile", blush=False, eye_x=0.099, eye_z=-0.004,
            eye_size=(0.028, 0.04), nose_z=-0.05, mouth_z=-0.128)
    HD.blush(hp, x=0.163, z=-0.062, w=0.04, h=0.025)
    # brows: bushy, his left one raised higher (perpetually puzzled)
    br = []
    for s, dz in ((1, 0.016), (-1, 0.0)):
        for x, z, v in ((0.056, 0.09, 0.019), (0.09, 0.104 + dz * 0.4, 0.024), (0.126, 0.104 + dz * 0.6, 0.023), (0.158, 0.09 + dz, 0.017)):
            br.append((HD.fpt(s * x, z + dz, 0.012)[0], v))
    hp.add(meta(br, 0.006), "hair", None, smooth=True)
    # hair: smooth chunky locks sweeping back from the temples and flaring out wildly at the sides,
    # a band round the back of the skull with a scalloped nape; the crown is bald
    els = []
    for s in (-1, 1):
        for a0, a1, z0, z1, out1, r0, rm, rt, curl in ((-8, 26, 0.11, 0.145, 0.085, 0.03, 0.048, 0.03, 0.025),
                                                       (-2, 32, 0.055, 0.065, 0.11, 0.036, 0.06, 0.032, 0.03),
                                                       (18, 44, -0.005, -0.04, 0.095, 0.036, 0.056, 0.03, 0.045),
                                                       (36, 66, 0.095, 0.1, 0.045, 0.038, 0.05, 0.032, 0.008),
                                                       (50, 74, -0.06, -0.085, 0.065, 0.04, 0.05, 0.03, 0.035)):
            for k in range(11):
                t = k / 10
                r = r0 + (rm - r0) * (t / 0.45) if t < 0.45 else rm + (rt - rm) * ((t - 0.45) / 0.55) ** 1.4
                z = z0 + (z1 - z0) * t + curl * t ** 3
                els.append((HD.spt(sph(s, a0 + (a1 - a0) * t), z, -0.012 + (out1 + 0.012) * t * t)[0], r))
        for a in range(28, 91, 5):
            for z in (0.075, 0.035, -0.005, -0.045, -0.085):
                if z > 0.0 or a >= 38:
                    els.append((HD.spt(sph(s, a), z, -0.01)[0], 0.046))
    for ph in (52, 71, 90, 109, 128):
        for k in range(6):
            t = k / 5
            els.append((HD.spt(ph, -0.09 - 0.05 * t, -0.008 + 0.022 * t * t)[0], 0.044 - 0.012 * t))
    hp.add(meta(els, 0.0065), "hair", None, smooth=True)
    # one cowlick curling up and forward from the crown
    cw = [((0.004, 0.05, 0.246), 0.026), ((0.008, 0.04, 0.276), 0.022), ((0.012, 0.022, 0.302), 0.019), ((0.013, -0.002, 0.316), 0.0165),
          ((0.012, -0.026, 0.314), 0.0145), ((0.009, -0.042, 0.3), 0.0125), ((0.007, -0.044, 0.284), 0.011)]
    hp.add(meta([(H(*c), r) for c, r in cw], 0.005), "hair", None, smooth=True)
    spectacles(hp)
    quill(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

SLEEVE_T = [0.0, 0.12, 0.3, 0.45, 0.56, 0.64, 0.7]
SLEEVE_R = [0.056, 0.057, 0.06, 0.066, 0.076, 0.086, 0.093]
CUFF_R = 0.101


def bell_arm(side, cfg):
    """Thin sleeve flaring into a wide bell with a dark lining and a rolled cuff; a mitten with ink-dipped tips."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    L = cfg["arm_len"]
    pts = [pv + d * (L * t) for t in SLEEVE_T]
    p.add(sphere(32, 20), "robe", M(pv, scale=0.058), smooth=True)
    p.add(bm_tube(pts, SLEEVE_R, 40, cap=False), "robe", smooth=True)
    p.add(bm_tube(pts[3:], [r - 0.0045 for r in SLEEVE_R[3:]], 40, cap=False), "robe_lining", smooth=True)
    cm = frame(pv + d * (L * 0.7), d)
    p.add(lathe([(0.088, -0.036), (0.0955, -0.034), (0.0995, -0.025), (CUFF_R, -0.008), (0.099, 0.003), (0.094, 0.0075), (0.088, 0.0065),
                 (0.0855, 0.0), (0.0855, -0.036)], 48), "cuff", cm, smooth=True)
    stitch(p, ring_pts(cm, 0.1003, 40, -0.027), "robe_light", 0.011, 0.007, 0.0021)
    # wrist and mitten; ink on the fingertips and the thumb
    hc = vc.hand_c(side, cfg)
    p.add(bm_tube([pv + d * (L * 0.55), hc - d * 0.03], 0.03, 16), "skin_warm", smooth=True)
    dipped(p, hc, (d * 0.5 + Vector((0, 0, -1))).normalized(), 0.061, 0.066, 0.042)
    th = hc + Vector((-side * 0.022, -0.046, 0.012))
    dipped(p, th, (th - hc).normalized(), 0.026, 0.028, 0.016)
    return p


def dipped(p, c, axis, r, h, z_ink, n=16):
    """A rounded mitten lobe along axis whose tip (past z_ink) has been dipped in ink."""
    f = frame(c, axis)
    zs = [-h + 2 * h * k / (2 * n) for k in range(1, 2 * n)]
    sk = [(r * math.sqrt(max(1 - (z / h) ** 2, 0.0)), z) for z in zs if z <= z_ink] + [(r * math.sqrt(1 - (z_ink / h) ** 2), z_ink)]
    ik = [(r * math.sqrt(1 - (z_ink / h) ** 2), z_ink)] + [(r * math.sqrt(max(1 - (z / h) ** 2, 0.0)), z) for z in zs if z > z_ink]
    p.add(lathe(sk, 32, cap_bottom=True), "skin_warm", f, smooth=True)
    p.add(lathe(ik, 32, cap_top=True), "ink", f, smooth=True)


CFG = dict(
    neck_z=NECK, shoulder_x=0.152, shoulder_z=0.69, hip_x=0.075, hip_z=0.36,
    arm_len=0.27, arm_pose={1: (12, 62), -1: (13, 0)},       # the book arm reaches forward
    arm=bell_arm, sleeve_mat="robe",
    leg_r=0.05, pants_mat="trousers", boot_mat="shoe", boot_top=0.15, boot_trim="shoe_dark",
)


# ---------------------------------------------------------------- prop: the book stack

def book(p, m, w, d, T, cover, band, label=None, corners=False, strap=False):
    """One book in its own frame m: x along the spine, spine at local -y, z from 0 (bottom) to T."""
    ct, ov = 0.0055, 0.004
    for zc in (ct / 2, T - ct / 2):
        p.add(bm_box(w + 2 * ov, d + ov, ct, bevel=0.0018, segs=2), cover, m @ Matrix.Translation((0, ov / 2, zc)), smooth=True)
    y0, y1 = -d / 2 + 0.006, d / 2 - 0.0015
    p.add(bm_box(w - 0.002, y1 - y0, T - 2 * ct + 0.001, bevel=0.0012, segs=2), "pages", m @ Matrix.Translation((0, (y0 + y1) / 2, T / 2)), smooth=True)
    ph = T - 2 * ct
    for k in (1, 2):
        z = ct + ph * k / 3
        p.add(bm_tube([m @ Vector((-w / 2 + 0.008, y1 + 0.0002, z)), m @ Vector((w / 2 - 0.008, y1 + 0.0002, z))], 0.0007, 4), "page_line", smooth=True)
        for sx in (-1, 1):
            p.add(bm_tube([m @ Vector((sx * (w / 2 - 0.0008), y0 + 0.008, z)), m @ Vector((sx * (w / 2 - 0.0008), y1 - 0.004, z))], 0.0007, 4), "page_line", smooth=True)
    # rounded spine with raised bands and a title label
    sm = m @ Matrix.Translation((0, -d / 2, T / 2)) @ S(1, 0.5, 1)
    p.add(bm_tube([(-w / 2 - ov, 0, 0), (w / 2 + ov, 0, 0)], T / 2, 24), cover, sm, smooth=True)
    for x in (-0.32 * w, -0.11 * w, 0.11 * w, 0.32 * w):
        arc = [Vector((x, 0.5 * (T / 2 + 0.0022) * math.cos(t), (T / 2 + 0.0022) * math.sin(t))) for t in [math.pi / 2 + math.pi * k / 14 for k in range(15)]]
        p.add(bm_tube([m @ Matrix.Translation((0, -d / 2, T / 2)) @ a for a in arc], 0.0026, 6), band, smooth=True)
    if label:
        p.add(bm_box(0.038, 0.004, T * 0.52, bevel=0.0012, segs=2), label, m @ Matrix.Translation((0, -d / 2 - T / 4 - 0.0008, T / 2)), smooth=True)
        for dz in (-T * 0.18, T * 0.18):
            p.add(bm_tube([m @ Vector((-0.014, -d / 2 - T / 4 - 0.003, T / 2 + dz)), m @ Vector((0.014, -d / 2 - T / 4 - 0.003, T / 2 + dz))], 0.0009, 4), "gold", smooth=True)
    if corners:
        for sx in (-1, 1):
            for zc in (ct / 2, T - ct / 2):
                c = Vector((sx * (w / 2 + ov - 0.011), d / 2 + ov / 2 - 0.011, zc))
                p.add(sphere(16, 10), "brass", m @ Matrix.Translation(c) @ M(rot=(0, 0, 45)) @ S(0.017, 0.017, ct * 0.75), smooth=True)
    if strap:
        x = w * 0.28
        rr = [(-d / 2 - T * 0.25, 0.0), (d / 2 + ov + 0.001, -0.0012), (d / 2 + ov + 0.001, T + 0.0012), (-d / 2 - T * 0.25, T + 0.0012)]
        sp = [m @ Vector((x, -d / 2 + 0.001, -0.0012)), m @ Vector((x, d / 2 + ov + 0.0016, -0.0012)), m @ Vector((x, d / 2 + ov + 0.0026, T / 2)),
              m @ Vector((x, d / 2 + ov + 0.0016, T + 0.0012)), m @ Vector((x, -d / 2 + 0.001, T + 0.0012))]
        p.add(bm_tube(sp, 0.0026, 6), "note_dark", smooth=True)


BOOKS = [  # w, d, T, cover, band, label, corners, strap, reversed, rz, (ox, oy)
    (0.21, 0.155, 0.05, "tome", "gold", "tome_dark", True, False, False, 0.0, (0.0, 0.0)),
    (0.18, 0.14, 0.036, "green_bk", "green_dark", "gold", False, False, False, 9.0, (0.01, 0.006)),
    (0.196, 0.146, 0.042, "blue_bk", "gold", "blue_dark", False, False, True, -11.0, (-0.012, -0.004)),
    (0.14, 0.1, 0.028, "note", "note_dark", None, False, True, False, 15.0, (0.014, 0.012)),
]


def books():
    p = Part("books")
    g = vc.hand_c(1, CFG)
    B = g + Vector((-0.04, -0.075, 0.056))
    Ms = Matrix.Translation(B) @ M(rot=(6, 0, -8))
    z = 0.0
    frames = []
    for w, d, T, cover, band, label, corners, strap, rev, rz, (ox, oy) in BOOKS:
        m = Ms @ Matrix.Translation((ox, oy, z)) @ M(rot=(0, 0, rz + (180 if rev else 0)))
        book(p, m, w, d, T, cover, band, label, corners, strap)
        frames.append((m, w, d, T, rev))
        z += T + 0.0006
    # bookmark ribbons hanging out of the outer end of the tome, and one out of the blue book draping over the tome
    m, w, d, T, rev = frames[0]
    for y, col, drop in ((-0.02, "ribbon_gold", 0.1), (0.025, "ribbon_red", 0.075)):
        e = m @ Vector((w / 2 + 0.004, y, T * 0.55))
        pts = [m @ Vector((w / 2 - 0.02, y, T * 0.55)), e, e + Vector((0.009, 0, -0.012)), e + Vector((0.013, -0.002, -0.04)),
               e + Vector((0.013, -0.004, -drop * 0.7)), e + Vector((0.011, -0.002, -drop))]
        strip(p, pts, Ms.to_3x3() @ Vector((0, 1, 0)), 0.009, 0.0012, col)
    m3, w3, d3, T3, _ = frames[2]
    e = m3 @ Vector((w3 / 2 + 0.004, 0.02, T3 * 0.5))        # reversed: local +x is the inner end
    top1 = Ms @ Vector((0, 0, frames[0][3] + frames[1][3]))
    pts = [m3 @ Vector((w3 / 2 - 0.02, 0.02, T3 * 0.5)), e, e + Vector((-0.01, 0, -0.008)), Vector((e.x - 0.018, e.y, top1.z - 0.04)),
           Vector((e.x - 0.022, e.y, top1.z - 0.084)), Vector((e.x - 0.024, e.y + 0.003, top1.z - 0.115))]
    strip(p, pts, m3.to_3x3() @ Vector((0, 1, 0)), 0.009, 0.0012, "ribbon_green")
    # a loose written page sticking out between the green and blue books
    m2, w2, d2, T2, _ = frames[1]
    zt = T2 + 0.0003
    path = [m2 @ Vector((w2 / 2 - 0.05, 0.004, zt)), m2 @ Vector((w2 / 2, 0.004, zt)), m2 @ Vector((w2 / 2 + 0.03, -0.002, zt - 0.002)),
            m2 @ Vector((w2 / 2 + 0.055, -0.006, zt - 0.009)), m2 @ Vector((w2 / 2 + 0.072, -0.008, zt - 0.02))]
    wd = m2.to_3x3() @ Vector((0, 1, 0)).normalized()
    strip(p, path, wd, 0.092, 0.0014, "paper")
    for k, v in enumerate((-0.028, -0.01, 0.008, 0.026)):
        line = []
        for j in range(9):
            s = plen(path[:2]) + 0.006 + (0.055 - (0.012 if k == 3 else 0)) * j / 8
            c = polyline_at(path, s)
            c2 = polyline_at(path, s + 0.002)
            T_ = (c2 - c).normalized()
            n = T_.cross(wd).normalized()
            if n.z < 0:
                n = -n
            line.append(c + wd * (v + 0.0025 * math.sin(j * 1.9 + k)) + n * 0.0011)
        p.add(bm_tube(line, 0.0011, 4), "ink", smooth=True)
    # numeric clearance checks: robe, the bell sleeve of arm_l, and the mitten under the stack
    G = ROBE
    pv, dv, L = vc.shoulder(1, CFG), vc.arm_dir(1, CFG), CFG["arm_len"]
    robe_c, sleeve_c, mitt, worst = 9.0, 9.0, 9.0, None
    samples = []
    for f in p.bm.faces:                      # sample every face densely (big book faces have few vertices)
        vs = [v.co for v in f.verts]
        c = sum(vs, Vector()) / len(vs)
        for a, b in zip(vs, vs[1:] + vs[:1]):
            for i in range(5):
                for j in range(5 - i):
                    samples.append((c + (a - c) * (i / 4) + (b - c) * (j / 4), p.mats[f.material_index]))
    for q, mn in samples:
        if 0.1 < q.z < 0.84:
            robe_c = min(robe_c, math.sqrt(q.x ** 2 + (q.y / G.ys) ** 2) - G.rad(q.z))
        t = (q - pv).dot(dv) / L
        if 0.0 <= t <= 0.73:
            r = CUFF_R
            for t0, t1, r0_, r1_ in zip(SLEEVE_T, SLEEVE_T[1:], SLEEVE_R, SLEEVE_R[1:]):
                if t0 <= t <= t1 and t <= 0.64:
                    r = r0_ + (r1_ - r0_) * (t - t0) / (t1 - t0)
            dd = (q - pv - dv * (L * t)).length - r
            if dd < sleeve_c:
                sleeve_c, worst = dd, (mn, tuple(round(x, 3) for x in q))
        mitt = min(mitt, ((q.x - g.x) / 0.06) ** 2 + ((q.y - g.y) / 0.062) ** 2 + ((q.z - g.z) / 0.066) ** 2)
    print("CLEARANCE books: robe %.4f  sleeve %.4f (%s)  mitten(ellipsoid value, 1 = touching) %.3f" % (robe_c, sleeve_c, worst, mitt))
    return p, g


CFG.update(body=body, head=head, props=[("books", "arm_l", books)], closeup_z=1.02,
           shots=[("books", (0.17, -0.25, 0.66), 28, 12, 1.25), ("back", (0, 0, 0.75), 160, 8, 2.6)])


def main():
    return vc.build("librarian", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
