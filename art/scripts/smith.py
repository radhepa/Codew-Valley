"""Ingrid the blacksmith, in the soft Animal Crossing style of Marlo the fisher (2026-10-23).
The broadest villager: wide shoulders and a sturdy barrel body. Blond hair parted in the middle,
sculpted as broad smooth locks, and two chunky plaited braids over her shoulders, tied with leather
bands. A cream linen shirt with a laced neck and short rolled sleeves showing strong forearms;
a heavy riveted leather apron (shaped bib, piped and stitched edges, a neck strap with a brass
slide, a chest pocket with a file and a stick of soapstone, a stitched repair patch, a belt with
a forged buckle, tongs hanging from a loop, ties in a bow at the back); thick leather gauntlet
gloves; sturdy strapped boots; a soot smudge on her left cheek and a confident smile.
Prop: `hammer` (arm_r, held up a little in front): a cross-peen smithing hammer with a forged
head (polished face and peen, maker's stamp), a steel wedge in the eye, and an ash handle with
grain lines and a spiral leather grip wrap.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, importlib

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
    "linen": "#EBDFC5", "linen_shade": "#CDBB98", "linen_thread": "#F8F1E2",
    "apron": "#8F5C3A", "apron_dark": "#5E3A25", "apron_patch": "#74482D", "apron_thread": "#DDBB86",
    "glove": "#6E4A31", "glove_dark": "#4E3322",
    "trousers": "#544C52", "boot": "#5E412E", "boot_trim": "#7C5A3E", "boot_strap": "#3F2B1E",
    "hair_gold": "#E4BC68", "hair_gold_dark": "#BA8F45", "hair_band": "#6B4429",
    "soot": "#7E6B62", "soapstone": "#DCDCD3",
    "iron_forged": "#5B5E63", "steel_face": "#C3C8CE",
    "wood": "#B57A47", "wood_dark": "#7C4E2B", "wrap": "#5C3824", "wrap_light": "#86593A",
}, metal={"iron_forged": (0.5, 0.5), "steel_face": (0.85, 0.22)},
    gloss={"apron": 0.62, "apron_dark": 0.6, "glove": 0.6, "boot": 0.55})


def basis(o, X, Y, Z):
    """Matrix with origin o and the given (orthonormal) local axes."""
    return Matrix(((X.x, Y.x, Z.x, o.x), (X.y, Y.y, Z.y, o.y), (X.z, Y.z, Z.z, o.z), (0, 0, 0, 1)))


def catmull(pts, n=8):
    """Smooth Catmull-Rom curve through the points, n samples per span."""
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out


def loft(secs, segs=32, dome0=0.001, dome1=0.002):
    """Closed solid along local X from superellipse sections (x, half-width Y, half-height Z, exponent)."""
    bm = bmesh.new()
    rings = []
    for x, wy, wz, e in secs:
        ring = []
        for i in range(segs):
            t = 2 * math.pi * i / segs
            c, s = math.cos(t), math.sin(t)
            ring.append(bm.verts.new((x, wy * math.copysign(abs(c) ** (2 / e), c), wz * math.copysign(abs(s) ** (2 / e), s))))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    p0 = bm.verts.new((secs[0][0] - dome0, 0, 0))
    p1 = bm.verts.new((secs[-1][0] + dome1, 0, 0))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((rings[0][j], rings[0][i], p0))
        bm.faces.new((rings[-1][i], rings[-1][j], p1))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def rivet(p, m, r=0.0075, mat="brass"):
    """Domed rivet on a surface frame (local Z out)."""
    p.add(sphere(14, 8), mat, m @ S(r, r, r * 0.55), smooth=True)


def rounded_rect(m, hx, hy, rc, n=5, z=0.0):
    """Closed rounded-rectangle polyline in the local XY plane of m."""
    pts = []
    for cx, cy, a0 in ((hx - rc, hy - rc, 0), (-hx + rc, hy - rc, 90), (-hx + rc, -hy + rc, 180), (hx - rc, -hy + rc, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append(m @ Vector((cx + rc * math.cos(a), cy + rc * math.sin(a), z)))
    pts.append(pts[0])
    return pts


# ---------------------------------------------------------------- body (shirt and apron)

SHIRT = vc.Garment([(0.268, 0.2), (0.278, 0.225), (0.28, 0.28), (0.282, 0.36), (0.285, 0.45), (0.282, 0.54), (0.27, 0.61),
                    (0.248, 0.67), (0.214, 0.72), (0.17, 0.765), (0.122, 0.8), (0.085, 0.822), (0.045, 0.836)], ys=0.84)
G = SHIRT
AO, AI = 0.014, 0.004          # apron outer / inner surface offsets from the shirt
Z0, Z1 = 0.165, 0.73           # apron bottom and bib top
BELT_Z = 0.44


def flare(z):
    """Below the shirt hem the apron hangs a little outward."""
    return max(0.0, 0.235 - z) * 0.35


def hw(z):
    """Apron half-width in degrees round the body: a wide skirt narrowing into the bib."""
    if z <= 0.47:
        return 60.0
    if z <= 0.6:
        t = (z - 0.47) / 0.13
        t = t * t * (3 - 2 * t)
        return 60.0 + (33.0 - 60.0) * t
    return 33.0 - 3.0 * (z - 0.6) / (Z1 - 0.6)


def A(phi, z, out=0.0):
    """Point on the apron's outer surface (plus out)."""
    return G.pt(phi, z, AO + out + flare(z))


def apron_shell(p):
    """The apron as a solid leather slab following the shirt, with a shaped outline."""
    nz, nu = 44, 40
    zs = [Z0 + (Z1 - Z0) * k / nz for k in range(nz + 1)]
    bm = bmesh.new()

    def P(i, z, o):
        return G.pt(-90 + (-1 + 2 * i / nu) * hw(z), z, o + flare(z))
    outer = [[bm.verts.new(P(i, z, AO)) for i in range(nu + 1)] for z in zs]
    inner = [[bm.verts.new(P(i, z, AI)) for i in range(nu + 1)] for z in zs]
    for k in range(nz):
        for i in range(nu):
            bm.faces.new((outer[k][i], outer[k][i + 1], outer[k + 1][i + 1], outer[k + 1][i]))
            bm.faces.new((inner[k][i], inner[k + 1][i], inner[k + 1][i + 1], inner[k][i + 1]))
    loop = [(0, i) for i in range(nu + 1)] + [(k, nu) for k in range(1, nz + 1)] + \
           [(nz, i) for i in range(nu - 1, -1, -1)] + [(k, 0) for k in range(nz - 1, 0, -1)]
    for (k0, i0), (k1, i1) in zip(loop, loop[1:] + loop[:1]):
        bm.faces.new((outer[k0][i0], outer[k1][i1], inner[k1][i1], inner[k0][i0]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    p.add(bm, "apron", None, smooth=True)
    # piped edge all round and a running stitch just inside it
    zs2 = [Z0 + (Z1 - Z0) * k / 60 for k in range(61)]
    edge = [A(-90 - hw(z), z, -0.004) for z in zs2] + [A(-90 + u * hw(Z1), Z1, -0.004) for u in [-1 + 2 * k / 24 for k in range(1, 24)]] + \
           [A(-90 + hw(z), z, -0.004) for z in reversed(zs2)] + [A(-90 + u * hw(Z0), Z0, -0.004) for u in [1 - 2 * k / 30 for k in range(1, 31)]]
    p.add(bm_tube(edge, 0.0062, 10, cap=False), "apron_dark", smooth=True)
    zs3 = [Z0 + 0.02 + (Z1 - Z0 - 0.04) * k / 50 for k in range(51)]
    sl = [A(-90 - hw(z) + 4.5, z, 0.0015) for z in zs3]
    sr = [A(-90 + hw(z) - 4.5, z, 0.0015) for z in zs3]
    top = [A(-90 + u * (hw(Z1 - 0.02) - 4.5), Z1 - 0.02, 0.0015) for u in [-1 + 2 * k / 20 for k in range(21)]]
    bot = [A(-90 + u * (hw(Z0 + 0.02) - 4.5), Z0 + 0.02, 0.0015) for u in [-1 + 2 * k / 30 for k in range(31)]]
    stitch(p, sl, "apron_thread")
    stitch(p, sr, "apron_thread")
    stitch(p, top, "apron_thread")
    stitch(p, bot, "apron_thread")


def apron_pocket(p, pc, hwd, z0, z1):
    """Stitched leather patch pocket on the apron with a rivet at each top corner."""
    out = AO + 0.006
    G.panel(p, pc - hwd, pc + hwd, z0, z1, "apron", out, 10)
    o2 = out + 0.002
    border = G.arc(pc - hwd, pc + hwd, z0, o2) + list(reversed(G.arc(pc - hwd, pc + hwd, z1, o2))) + [G.pt(pc - hwd, z0, o2)]
    p.add(bm_tube(border, 0.0048, 8, cap=False), "apron_dark", smooth=True)
    i, o3 = 2.6, out + 0.0025
    stitch(p, [G.pt(pc - hwd + i, z1 - 0.012, o3)] + G.arc(pc - hwd + i, pc + hwd - i, z0 + 0.011, o3) + [G.pt(pc + hwd - i, z1 - 0.012, o3)], "apron_thread")
    for ph in (pc - hwd + 1.8, pc + hwd - 1.8):
        rivet(p, G.frame(ph, z1 - 0.008, out + 0.004), 0.0062)


def file_and_chalk(p, pc, z0):
    """A flat file (wooden handle, brass ferrule, cut teeth) and a stick of soapstone in the pocket."""
    ph = pc + 2.5
    b0, b1 = G.pt(ph, z0 + 0.02, AO + 0.0025), G.pt(ph, 0.705, AO + 0.0025)
    up = (b1 - b0).normalized()
    nrm = G.normal(ph, 0.66)
    nrm = (nrm - up * nrm.dot(up)).normalized()
    X = up.cross(nrm).normalized()
    up = (up + nrm * 0.12).normalized()             # leaning out a touch from the chest
    nrm = X.cross(up).normalized()
    fm = basis(b0, X, nrm, up)
    L = (b1 - b0).length
    p.add(bm_box(0.017, 0.0032, L, bevel=0.0012, segs=1), "iron_forged", fm @ Matrix.Translation((0, 0, L / 2)), smooth=True)
    for k in range(7):                             # teeth: fine diagonal cuts on the visible part
        z = L - 0.008 - k * 0.0055
        p.add(bm_tube([fm @ Vector((-0.0078, -0.0018, z)), fm @ Vector((0.0078, -0.0018, z + 0.004))], 0.0007, 4), "eye_dark", smooth=True)
    p.add(bm_tube([fm @ Vector((0, 0, L)), fm @ Vector((0, 0, L + 0.018))], [0.0045, 0.0022], 8), "iron_forged", smooth=True)   # tang
    hm = fm @ Matrix.Translation((0, 0, L + 0.006))
    p.add(lathe([(0.0085, 0.0), (0.0092, 0.004), (0.0092, 0.01), (0.0085, 0.012)], 20, cap_bottom=True), "brass", hm, smooth=True)
    p.add(lathe([(0.0088, 0.011), (0.0108, 0.02), (0.0112, 0.04), (0.0102, 0.056), (0.0075, 0.064), (0.003, 0.0665)], 20, cap_top=True), "wood", hm, smooth=True)
    sm = basis(G.pt(pc - 4.5, z0 + 0.02, AO + 0.004), X, nrm, up)
    p.add(bm_cyl(0.0055, 0.0055, 0.1, 12), "soapstone", sm, smooth=True)
    p.add(sphere(12, 8), "soapstone", sm @ Matrix.Translation((0, 0, 0.1)) @ S(0.0055, 0.0055, 0.003), smooth=True)


def tongs(p):
    """Forged tongs hanging from a leather loop on the belt, over the apron skirt on her left."""
    c0 = -57.0

    def T(phi, z, o=0.0):
        return A(phi, z, 0.032 + o)
    pathA = catmull([T(c0 + 4.6, 0.478), T(c0 + 3.2, 0.4), T(c0 + 1.3, 0.31), T(c0, 0.245), T(c0 - 2.6, 0.218), T(c0 - 3.3, 0.195), T(c0 - 1.4, 0.178)], 6)
    pathB = catmull([T(c0 - 4.6, 0.478), T(c0 - 3.2, 0.4), T(c0 - 1.3, 0.31), T(c0, 0.245, 0.007), T(c0 + 2.6, 0.218, 0.007), T(c0 + 3.3, 0.195, 0.007), T(c0 + 1.4, 0.178, 0.007)], 6)
    for path in (pathA, pathB):
        n = len(path)
        rad = [0.0058 if i < n * 0.5 else 0.0058 + 0.0022 * (i - n * 0.5) / (n * 0.5) for i in range(n)]
        p.add(bm_tube(path, rad, 10), "iron_forged", smooth=True)
        p.add(sphere(14, 10), "iron_forged", M(path[0], scale=0.0085), smooth=True)
    pv = T(c0, 0.245, 0.0045)
    rivet(p, frame(pv + G.normal(c0, 0.245) * 0.006, G.normal(c0, 0.245)), 0.0095, "iron_forged")
    # hanger loop round both reins, stitched to the belt
    lm = frame(T(c0, 0.43, -0.004), G.normal(c0, 0.43, 0.0))
    loop = [lm @ Vector((0.029 * math.cos(t), 0.0, 0.016 * math.sin(t))) for t in [2 * math.pi * k / 24 for k in range(25)]]
    p.add(bm_tube(loop, 0.0052, 8, cap=False), "apron_dark", smooth=True)


def belt(p):
    """Leather waist belt over the apron, a forged buckle with a prong, a keeper and the tail."""
    R = G.rad(BELT_Z)
    h0, h1 = BELT_Z - 0.025, BELT_Z + 0.025
    prof = [(R + 0.002, h0 + 0.002), (R + 0.011, h0), (R + 0.0145, BELT_Z), (R + 0.011, h1), (R + 0.002, h1 - 0.002), (R + 0.002, h0 + 0.002)]
    half = hw(BELT_Z)

    def bump(a, z):
        d = abs(((math.degrees(a) - 270 + 180) % 360) - 180)
        t = min(max((half + 8 - d) / 8, 0.0), 1.0)
        return (AO + 0.002) * t * t * (3 - 2 * t)
    p.add(lathe(prof, 128, rfun=bump, ys=G.ys), "apron_dark", smooth=True)
    bo = AO + 0.002 + 0.0145                        # outer face of the belt at the front
    stitch(p, G.arc(-90 - half + 6, -90 + half - 6, h1 - 0.007, bo - 0.002, 30), "apron_thread")
    stitch(p, G.arc(-90 - half + 6, -90 + half - 6, h0 + 0.007, bo - 0.002, 30), "apron_thread")
    # tail running to her left, through a keeper, with a rounded tip
    G.panel(p, -90, -70, h0 + 0.006, h1 - 0.006, "apron_dark", bo + 0.0035, 10)
    tip = G.frame(-70, BELT_Z, bo + 0.0035)
    p.add(sphere(20, 10), "apron_dark", tip @ S(0.019, 0.019, 0.003), smooth=True)
    kp = rounded_rect(G.frame(-78, BELT_Z, bo + 0.002), 0.007, 0.03, 0.005, 3)
    p.add(bm_tube(kp, 0.0042, 6, cap=False), "apron_dark", smooth=True)
    # forged buckle: rounded frame, centre bar and prong
    bm_ = G.frame(-90, BELT_Z, bo + 0.006)
    p.add(bm_tube(rounded_rect(bm_, 0.036, 0.035, 0.012, 5), 0.0062, 10, cap=False), "iron_forged", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0, -0.034, 0)), bm_ @ Vector((0, 0.034, 0))], 0.0055, 10), "iron_forged", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0.0, 0, 0.003)), bm_ @ Vector((-0.03, 0, 0.004)), bm_ @ Vector((-0.037, 0, 0.0))], 0.0035, 8), "steel_face", smooth=True)
    # ties knotted in a bow at the back
    km = G.frame(90, BELT_Z, 0.018)
    p.add(sphere(18, 12), "apron_dark", km @ S(0.022, 0.018, 0.014), smooth=True)
    for s in (-1, 1):
        lp =[km @ Vector((s * 0.01, 0.0, 0.004))] + [km @ Vector((s * (0.012 + 0.03 * (1 - math.cos(t))), 0.02 * math.sin(t), 0.008)) for t in [2 * math.pi * k / 16 for k in range(17)]]
        p.add(bm_tube(lp, 0.0068, 8, cap=False), "apron_dark", smooth=True)
        tail = [G.pt(90 + s * 3, BELT_Z - 0.01, 0.024), G.pt(90 + s * 7, BELT_Z - 0.07, 0.016), G.pt(90 + s * 9, BELT_Z - 0.13, 0.012)]
        p.add(bm_tube(catmull(tail, 6), 0.0068, 8), "apron_dark", smooth=True)


def neck_strap(p):
    """Leather strap from the bib corners round the back of the neck, a brass slide on her left side."""
    ph = [(-90 - (hw(Z1) - 4), Z1 - 0.018), (-90 - (hw(Z1) - 2), Z1 + 0.012), (-130, 0.758), (-142, 0.772), (-165, 0.778), (-200, 0.778), (-235, 0.776),
          (90, 0.776), (55, 0.776), (20, 0.778), (-15, 0.778), (-38, 0.772), (-50, 0.758), (-90 + (hw(Z1) - 2), Z1 + 0.012), (-90 + (hw(Z1) - 4), Z1 - 0.018)]
    pts = [G.pt(a, z, AO + 0.006) for a, z in ph]
    p.add(bm_tube(catmull(pts, 6), 0.0095, 10), "apron_dark", smooth=True)
    for s in (-1, 1):
        rivet(p, G.frame(-90 + s * (hw(Z1) - 4), Z1 - 0.016, AO + 0.016), 0.0072)
    sm = G.frame(-90 + (hw(Z1) - 1), Z1 + 0.026, AO + 0.012)
    p.add(bm_tube(rounded_rect(sm, 0.016, 0.009, 0.004, 3), 0.0032, 6, cap=False), "brass", smooth=True)


def patch(p, pc, hwd, z0, z1):
    """Stitched repair patch on the skirt."""
    out = AO + 0.003
    G.panel(p, pc - hwd, pc + hwd, z0, z1, "apron_patch", out, 10)
    o2 = out + 0.0015
    i = 1.8
    edge = [G.pt(pc - hwd + i, z0 + 0.008, o2)] + G.arc(pc - hwd + i, pc + hwd - i, z0 + 0.008, o2, 10) + \
           [G.pt(pc + hwd - i, z, o2) for z in (z0 + 0.03, z1 - 0.03)] + list(reversed(G.arc(pc - hwd + i, pc + hwd - i, z1 - 0.008, o2, 10))) + \
           [G.pt(pc - hwd + i, z, o2) for z in (z1 - 0.03, z0 + 0.008)]
    stitch(p, edge, "apron_thread", 0.011, 0.007)


def body():
    p = Part("body")
    G.mesh(p, "linen")
    # shirt: rolled hem, stitching, side seams and a back yoke
    G.hem(p, 0.212, 0.016, "linen_shade")
    G.stitch_ring(p, 0.245, matname="linen_shade")
    for phi in (2, 178):
        stitch(p, G.line(phi, 0.23, 0.6, 0.003), "linen_shade")
    G.panel(p, 22, 158, 0.655, 0.663, "linen_shade", 0.002, 24)
    stitch(p, G.arc(24, 156, 0.645, 0.003, 30), "linen_shade")
    # neck, collar band and the laced V at the front
    p.add(bm_cyl(0.064, 0.06, 0.12, 24), "skin_warm", M((0, 0, 0.75)), smooth=True)
    col = [(0.13, 0.797), (0.128, 0.81), (0.114, 0.826), (0.094, 0.838)]
    p.add(bm_lathe(col, 40, arc=(-66, 246)), "linen", M(scale=(1, G.ys + 0.02, 1)), smooth=True)
    p.add(bm_tube([(0.131 * math.cos(math.radians(a)), (G.ys + 0.02) * 0.131 * math.sin(math.radians(a)), 0.797) for a in range(-66, 247, 8)], 0.0045, 6), "linen_shade", smooth=True)
    for s in (-1, 1):
        p.add(bm_tube([G.pt(-90 + s * 6.5, 0.8, 0.003), G.pt(-90 + s * 3, 0.77, 0.003), G.pt(-90, 0.742, 0.003)], 0.004, 6), "linen_shade", smooth=True)
    lace = [G.pt(-94.5, 0.756, 0.006), G.pt(-86, 0.778, 0.008), G.pt(-95.5, 0.792, 0.008), G.pt(-90, 0.799, 0.009)]
    lace2 = [G.pt(-85.5, 0.756, 0.006), G.pt(-94, 0.778, 0.008), G.pt(-84.5, 0.792, 0.008), G.pt(-90, 0.799, 0.009)]
    for lc in (lace, lace2):
        p.add(bm_tube(catmull(lc, 5), 0.0028, 6), "apron_dark", smooth=True)
    # the apron and everything on it
    apron_shell(p)
    neck_strap(p)
    apron_pocket(p, -71, 10, 0.57, 0.655)
    file_and_chalk(p, -71, 0.57)
    patch(p, -122, 8, 0.245, 0.325)
    belt(p)
    tongs(p)
    return p


# ---------------------------------------------------------------- head

NECK = 0.835
HD = vc.Head((0, 0, NECK + 0.27), 0.32, 0.295, 0.288)

HAIRLINE = [(-90, 0.2), (-78, 0.185), (-62, 0.15), (-45, 0.1), (-28, 0.05), (-12, 0.022), (0, 0.02), (12, 0.0), (22, -0.15), (35, -0.215), (55, -0.235),
            (75, -0.24), (90, -0.248)]


def hairline(phi):
    for (p0, z0), (p1, z1) in zip(HAIRLINE, HAIRLINE[1:]):
        if p0 <= phi <= p1:
            return z0 + (z1 - z0) * (phi - p0) / (p1 - p0)
    return HAIRLINE[-1][1]


def hair_locks(s):
    """One side of the parted hair as three broad smooth locks sweeping from the centre parting
    back toward the braid root. Each lock is its own fused mass, raised along its middle, so a
    soft valley forms where it meets its neighbour (and at the parting)."""
    def b1(z):
        return -56 + 48 * min(max((0.27 - z) / 0.39, 0.0), 1.0)

    def b2(z):
        return -6 + 46 * min(max((0.27 - z) / 0.39, 0.0), 1.0)
    out = []
    for li in range(3):
        els = []
        phi = -89.0
        while phi <= 89.0:
            v0 = 0.038 + 0.005 * max(0.0, math.cos(math.radians(phi)))
            z = hairline(phi) + v0 * 0.75
            pm = phi if s > 0 else 180 - phi
            while z < 0.284:
                lo = -89.0 if li == 0 else (b1(z) if li == 1 else b2(z))
                hi = b1(z) if li == 0 else (b2(z) if li == 1 else 89.0)
                if lo - 2.5 <= phi <= hi + 2.5:
                    bump = math.sin(math.pi * min(max((phi - lo) / (hi - lo), 0.0), 1.0))
                    els.append((HD.spt(pm, z, 0.003 + 0.009 * bump)[0], v0 + 0.005 * bump))
                z += 0.024
            phi += 4.0
        out.append(meta(els, 0.0095, 2.0))
    return out


CAPS = []        # (a, b, r) capsules the braids must stay clear of (filled once CFG exists)


def push(q, margin):
    """Move a point out of the shirt+apron and out of the shoulder/arm capsules."""
    q = Vector(q)
    for _ in range(3):
        if q.z < 0.84:
            R = G.rad(q.z) + AO + 0.004
            rho = math.hypot(q.x, q.y / G.ys)
            need = R + margin / G.ys
            if rho < need:
                k = need / rho
                q.x *= k
                q.y *= k
        for a, b, r in CAPS:
            ab = b - a
            t = 0.0 if ab.length < 1e-9 else min(max((q - a).dot(ab) / ab.length_squared, 0.0), 1.0)
            cp = a + ab * t
            dv = q - cp
            if dv.length < r + margin:
                q = cp + dv.normalized() * (r + margin)
    return q


def braid_path(s):
    ctrl = [HD.H(s * 0.2, 0.175, -0.17), HD.H(s * 0.268, 0.08, -0.275), Vector((s * 0.245, -0.105, 0.735)),
            Vector((s * 0.195, -0.215, 0.63)), Vector((s * 0.152, -0.25, 0.555))]
    path = catmull(ctrl, 12)
    for _ in range(3):
        path = [push(q, 0.05) for q in path]
        path = [path[0]] + [(path[i - 1] + path[i] * 2 + path[i + 1]) / 4 for i in range(1, len(path) - 1)] + [path[-1]]
    return [push(q, 0.05) for q in path]


def braid(hp, s):
    """A chunky three-strand plait: slanted lobes alternating left and right over a darker core,
    a leather band and a soft tuft at the end."""
    path = braid_path(s)
    L = plen(path)
    end = L - 0.035

    def tan(sk):
        return (polyline_at(path, min(sk + 0.006, L)) - polyline_at(path, max(sk - 0.006, 0))).normalized()
    hp.add(bm_tube([polyline_at(path, end * k / 30) for k in range(31)], [0.025 - 0.005 * k / 30 for k in range(31)], 16), "hair_gold_dark", M(), smooth=True)
    sk, k = 0.018, 0
    while sk < end - 0.008:
        c = polyline_at(path, sk)
        t = tan(sk)
        no = Vector((c.x, c.y, 0.0))
        no = (no - t * no.dot(t)).normalized()
        side = t.cross(no).normalized()
        sg = 1 if k % 2 == 0 else -1
        f = 1.0 - 0.22 * sk / end
        u = (t * math.cos(math.radians(36)) + side * math.sin(math.radians(36)) * sg).normalized()
        X = no.cross(u).normalized()
        Y = u.cross(X)
        hp.add(sphere(20, 12), "hair_gold", basis(c - side * 0.0135 * sg * f, X, Y, u) @ S(0.028 * f, 0.031 * f, 0.043 * f), smooth=True)
        sk += 0.036 * (0.85 + 0.15 * f)
        k += 1
    # leather band with a cross-wrapped cord
    c = polyline_at(path, end + 0.006)
    t = tan(end)
    bm_ = frame(c, t)
    p_band = [(0.0175, -0.013), (0.0215, -0.011), (0.0225, 0.0), (0.0215, 0.011), (0.0175, 0.013)]
    hp.add(lathe(p_band, 28, cap_top=True, cap_bottom=True), "hair_band", bm_ @ S(1.2, 1.2, 1.15), smooth=True)
    for zz in (-0.0055, 0.0055):
        hp.add(bm_tube(ring_pts(bm_, 0.0272, 24, zz * 1.15), 0.0018, 6, cap=False), "wrap_light", smooth=True)
    # the tuft: a short fan of hair below the band
    tuft = [(c + t * 0.016, 0.023), (c + t * 0.034, 0.03), (c + t * 0.055, 0.031), (c + t * 0.074, 0.022), (c + t * 0.088, 0.01)]
    hp.add(meta(tuft, 0.005, 2.0), "hair_gold", None, smooth=True)
    for a in (0, 120, 240):
        ar = math.radians(a)
        X = bm_.to_3x3() @ Vector((math.cos(ar), math.sin(ar), 0))
        hp.add(bm_tube([c + t * 0.034 + X * 0.029, c + t * 0.064 + X * 0.024, c + t * 0.08 + X * 0.012], 0.0017, 4), "hair_gold_dark", smooth=True)
    return path


def head():
    hp = Part("head")
    H = HD.H
    HD.face(hp, mouth=None, eye_size=(0.031, 0.043))
    HD.mouth(hp, -0.138, "smile", w=0.03)
    HD.brows(hp, "hair_gold_dark", pts=((0.056, 0.09, 0.024), (0.096, 0.103, 0.028), (0.136, 0.099, 0.026), (0.166, 0.084, 0.019)))
    # soot smudge on her left cheek, below the blush: two soft flat overlapping ovals
    for x, z, w, h, o, rot in ((0.2, -0.102, 0.044, 0.025, 0.0022, 10), (0.233, -0.088, 0.027, 0.018, 0.0026, 18)):
        sp, sn = HD.fpt(x, z, o)
        hp.add(sphere(32, 14), "soot", frame(sp, sn) @ Matrix.Rotation(math.radians(rot), 4, "Z") @ S(w, h, 0.0022), smooth=True)
    # parted hair: three broad sculpted locks per side from the centre parting, and the braids
    for s in (-1, 1):
        for bm_ in hair_locks(s):
            hp.add(bm_, "hair_gold", None, smooth=True)
        braid(hp, s)
    return hp


# ---------------------------------------------------------------- arms and legs

def smith_arm(side, cfg):
    """Short rolled linen sleeve, a strong bare forearm and a thick leather gauntlet glove."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    L = cfg["arm_len"]
    sr = cfg["sleeve_r"]
    p.add(sphere(32, 20), "linen", M(pv, scale=sr * 1.04), smooth=True)
    p.add(bm_tube([pv, pv + d * (L * 0.12), pv + d * (L * 0.22)], [sr, sr * 1.02, sr * 1.06], 28, cap=False), "linen", smooth=True)
    # rolled sleeve: two fat turns with a stitched fold between them
    cm = frame(pv + d * (L * 0.22), d)
    roll = [(0.072, -0.03), (0.088, -0.026), (0.097, -0.017), (0.099, -0.008), (0.095, -0.001), (0.098, 0.006), (0.1, 0.015), (0.096, 0.024),
            (0.084, 0.03), (0.06, 0.032)]
    p.add(lathe(roll, 40), "linen", cm, smooth=True)
    stitch(p, ring_pts(cm, 0.0965, 30, -0.001), "linen_shade", 0.011, 0.007, 0.0022)
    # forearm: thick below the elbow, tapering to the wrist
    p.add(bm_tube([pv + d * (L * 0.22), pv + d * (L * 0.34), pv + d * (L * 0.5), pv + d * (L * 0.68)], [0.061, 0.064, 0.058, 0.05], 28, cap=False), "skin_warm", smooth=True)
    # gauntlet: flared cuff with a thick rolled lip, a side seam, a wrist strap with rivets
    gm = frame(pv + d * (L * 0.585), d)
    gp = [(0.05, 0.006), (0.064, -0.002), (0.078, 0.001), (0.083, 0.008), (0.08, 0.016), (0.073, 0.03), (0.066, 0.046), (0.061, 0.062), (0.059, 0.08)]
    p.add(lathe(gp, 40), "glove", gm, smooth=True)
    p.add(bm_tube(ring_pts(gm, 0.08, 40, 0.007), 0.0065, 10, cap=False), "glove_dark", smooth=True)
    wl = gm.inverted().to_3x3() @ Vector((side, 0.25, 0.0))
    th = math.atan2(wl.y, wl.x)
    seam = [gm @ Vector((vc.Garment(gp).rad(z) * math.cos(th), vc.Garment(gp).rad(z) * math.sin(th), z)) for z in (0.02, 0.035, 0.05, 0.065, 0.078)]
    stitch(p, seam, "apron_thread", 0.009, 0.006, 0.0022)
    sm = gm @ Matrix.Translation((0, 0, 0.058))
    p.add(lathe([(0.0605, -0.009), (0.065, -0.007), (0.066, 0.0), (0.065, 0.007), (0.0605, 0.009)], 40), "glove_dark", sm, smooth=True)
    for dt in (-0.35, 0.35):
        rp = sm @ Vector((0.066 * math.cos(th + dt), 0.066 * math.sin(th + dt), 0.0))
        rivet(p, frame(rp, rp - sm.translation), 0.0055, "brass")
    # thick leather mitten with a darker knuckle pad
    hc = vc.hand_c(side, cfg)
    vc.mitten(p, hc, "glove", side, size=1.12)
    kn = Vector((side * 0.55, 0.45, 0.25)).normalized()
    p.add(sphere(20, 12), "glove_dark", frame(hc + kn * 0.06, kn) @ S(0.042, 0.03, 0.012), smooth=True)
    return p


def boot_strap(p, side, x):
    """A buckled strap round each boot."""
    z = 0.135
    rim = [(x + 0.077 * math.cos(2 * math.pi * k / 40), 0.004 + 0.077 * math.sin(2 * math.pi * k / 40), z) for k in range(41)]
    p.add(bm_tube(rim, 0.0085, 10, cap=False), "boot_strap", smooth=True)
    bm_ = frame((x + side * 0.086, 0.004, z), (side, 0, 0))
    p.add(bm_tube(rounded_rect(bm_, 0.012, 0.014, 0.004, 3), 0.003, 6, cap=False), "iron_forged", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0, -0.012, 0.002)), bm_ @ Vector((0, 0.012, 0.002))], 0.0022, 6), "steel_face", smooth=True)


CFG = dict(
    neck_z=NECK, shoulder_x=0.232, shoulder_z=0.68, hip_x=0.11, hip_z=0.36,
    arm_len=0.32, arm_splay=16, arm_pose={-1: (22, 28)},        # the hammer arm reaches a little forward
    sleeve_r=0.085, arm=smith_arm,
    leg_r=0.068, pants_mat="trousers", boot_mat="boot", boot_top=0.21, boot_trim="boot_trim", leg_fn=boot_strap,
)
for _s in (1, -1):
    _a = vc.shoulder(_s, CFG)
    CAPS.append((_a, _a + vc.arm_dir(_s, CFG) * 0.2, 0.092))


# ---------------------------------------------------------------- prop

HZ = 0.31          # hammer head centre along the handle from the grip


def hammer():
    p = Part("hammer")
    g = vc.hand_c(-1, CFG)
    d = Vector((-0.2, -0.42, 0.885)).normalized()
    fwd = Vector((0, -1, 0))
    X = (fwd - d * d.dot(fwd)).normalized()
    Y = d.cross(X).normalized()
    m = basis(g, X, Y, d) @ S(1.2)     # local Z along the handle, X toward the face, Y along the peen edge
    # ash handle: a butt swell under the fist, slim neck, thickening into the eye (oval section)
    hp_ = [(0.006, -0.08), (0.017, -0.078), (0.0225, -0.071), (0.0232, -0.062), (0.021, -0.052), (0.0182, -0.04), (0.0178, 0.0), (0.0172, 0.07),
           (0.0158, 0.15), (0.015, 0.21), (0.0158, 0.25), (0.0172, 0.272), (0.0172, 0.33), (0.008, 0.336)]
    oval = m @ S(1.12, 0.9, 1.0)
    p.add(lathe(hp_, 32, cap_bottom=True, cap_top=True), "wood", oval, smooth=True)
    hr = vc.Garment(hp_)
    # grain lines up the handle
    for a0, z0, z1 in ((30, 0.13, 0.27), (160, 0.12, 0.25), (255, 0.14, 0.27), (95, 0.15, 0.24)):
        pts = []
        for k in range(13):
            z = z0 + (z1 - z0) * k / 12
            a = math.radians(a0 + 6 * math.sin(k * 0.9))
            r = hr.rad(z) + 0.0002
            pts.append(oval @ Vector((r * math.cos(a), r * math.sin(a), z)))
        p.add(bm_tube(pts, 0.0011, 5), "wood_dark", smooth=True)
    # spiral leather grip wrap with cord lashings at both ends
    zw0, zw1, pitch = -0.045, 0.125, 0.0155
    n = int((zw1 - zw0) / pitch * 18)
    hel = []
    for k in range(n + 1):
        z = zw0 + (zw1 - zw0) * k / n
        a = 2 * math.pi * (z - zw0) / pitch
        r = hr.rad(z) + 0.0032
        hel.append(oval @ Vector((r * math.cos(a), r * math.sin(a), z)))
    p.add(bm_tube(hel, 0.0047, 8), "wrap", smooth=True)
    p.add(lathe([(hr.rad(zw0) + 0.001, zw0 - 0.004), (hr.rad(zw1) + 0.002, zw1)], 28), "wrap", oval, smooth=True)
    for zc in (zw0 - 0.004, zw1 + 0.004):
        for dz in (-0.0035, 0.0035):
            p.add(bm_tube(ring_pts(oval @ Matrix.Translation((0, 0, zc + dz)), hr.rad(zc) + 0.0045, 20), 0.0022, 6, cap=False), "wrap_light", smooth=True)
    # forged head: polished slightly domed face, waisted neck, square cheeks round the eye, cross peen
    hm = m @ Matrix.Translation((0, 0, HZ))
    secs = [(-0.1, 0.021, 0.0035, 2.5), (-0.097, 0.0235, 0.007, 3.0), (-0.088, 0.0245, 0.0105, 3.5), (-0.07, 0.025, 0.016, 4.0),
            (-0.05, 0.0255, 0.022, 4.0), (-0.032, 0.026, 0.028, 4.0), (-0.018, 0.0275, 0.032, 4.5), (0.0, 0.028, 0.033, 4.5),
            (0.018, 0.0275, 0.032, 4.5), (0.032, 0.0262, 0.028, 3.5), (0.044, 0.0236, 0.0236, 2.2), (0.056, 0.0245, 0.0245, 2.0),
            (0.08, 0.0275, 0.0275, 2.0), (0.09, 0.0285, 0.0285, 2.0), (0.096, 0.0276, 0.0276, 2.0), (0.1, 0.0236, 0.0236, 2.0)]
    p.add(loft(secs, 40, 0.0005, 0.0015), "iron_forged", hm, smooth=True)
    p.add(sphere(32, 12), "steel_face", hm @ Matrix.Translation((0.1006, 0, 0)) @ S(0.0026, 0.0238, 0.0238), smooth=True)
    p.add(bm_tube(ring_pts(hm @ Matrix.Translation((0.0935, 0, 0)) @ M(rot=(0, 90, 0)), 0.0283, 40), 0.0026, 8, cap=False), "steel_face", smooth=True)
    p.add(bm_tube([hm @ Vector((-0.1, -0.0205, 0)), hm @ Vector((-0.1015, 0, 0)), hm @ Vector((-0.1, 0.0205, 0))], 0.0034, 8), "steel_face", smooth=True)
    # the eye on top: oval of end grain, a steel wedge along it and a round cross-pin
    p.add(sphere(24, 8), "wood", hm @ Matrix.Translation((0, 0, 0.0328)) @ S(0.0175, 0.0118, 0.0022), smooth=True)
    p.add(bm_box(0.03, 0.0034, 0.0036, bevel=0.0012, segs=1), "steel_face", hm @ Matrix.Translation((0, 0, 0.0345)), smooth=True)
    p.add(sphere(14, 8), "steel_face", hm @ Matrix.Translation((0.0, 0, 0.0352)) @ S(0.0042, 0.0042, 0.0018), smooth=True)
    # the handle shoulder flaring into the bottom of the eye
    p.add(lathe([(0.0172, -0.05), (0.0192, -0.036), (0.0205, -0.031)], 28), "wood", oval @ Matrix.Translation((0, 0, HZ)), smooth=True)
    # maker's stamp on the cheek facing out: a ring and a tiny anvil mark
    st = hm @ Matrix.Translation((0.0, -0.0283, 0.002)) @ M(rot=(90, 0, 0))
    p.add(bm_tube(ring_pts(st, 0.009, 20), 0.0011, 5, cap=False), "steel_face", smooth=True)
    p.add(bm_box(0.009, 0.0035, 0.0012), "steel_face", st @ Matrix.Translation((0, 0.0015, 0)), smooth=True)
    p.add(bm_box(0.004, 0.004, 0.0012), "steel_face", st @ Matrix.Translation((0, -0.0025, 0)), smooth=True)
    clearance(p, "hammer")
    return p, g


def clearance(p, name):
    """Print how close a prop comes to the shirt surface and the head (negative = inside)."""
    gmin, hmin = 9.0, 9.0
    for v in p.bm.verts:
        q = v.co
        if 0.2 < q.z < 0.836:
            gmin = min(gmin, G.ys * (math.hypot(q.x, q.y / G.ys) - G.rad(q.z)))
        e = ((q.x / HD.a) ** 2 + (q.y / HD.b) ** 2 + ((q.z - HD.hc.z) / HD.c) ** 2) ** 0.5
        hmin = min(hmin, (e - 1.0) * HD.b)
    print("CLEARANCE", name, "shirt %.3f" % gmin, "head %.3f" % hmin)


CFG.update(body=body, head=head, props=[("hammer", "arm_r", hammer)], closeup_z=1.0,
           shots=[("hammer", (-0.3, -0.24, 0.66), -55, 6, 1.25), ("back", (0, 0, 0.72), 160, 8, 2.6)])


def main():
    return vc.build("smith", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
