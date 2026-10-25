"""The player: a young village founder (~1.4 m), restyled in the soft Animal Crossing style of
Marlo the fisher (2026-10-23). The hero, so the friendliest and most readable model in the set,
and neutral enough that anyone can see themselves in them.
A blue belted tunic with a cream shirt collar, a rolled hem with a cream zig-zag embroidery band,
side, back and yoke seams in cream thread, an embroidered sprout patch on the left chest and a
lighter-blue patch on the left elbow; a leather belt with a brass buckle, keeper and punched tip;
warm taupe trousers and sturdy little laced boots with turned-down cuffs and a tiny bow.
A leather satchel on the left hip: piped body, a stitched wrap-over flap with rounded corners,
a buckled tongue, brass D-rings and a stitched strap over the right shoulder across the body.
Chestnut metaball hair: a rounded cap with a side parting, side-swept fringe locks, side locks in
front of the ears, flicked nape locks and a cowlick. Black oval eyes, a small smile.
No held prop. Parts and pivots as the other villagers: body (root, on the ground), head (neck),
arm_l / arm_r (shoulders), leg_l / leg_r (hips); the satchel and belt belong to body.
Built with the shared kit in villagers_common.py (own leg() for the laced boots)."""
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
from mathutils.bvhtree import BVHTree

vc.palette({
    "tunic": "#4E70A9", "tunic_dark": "#3A5486", "thread": "#EFE5CC", "collar": "#F2EAD8",
    "patch_cream": "#F0E6CF", "patch_blue": "#7D9BCB", "leaf": "#79A65A", "leaf_dark": "#4F7D3B",
    "belt": "#6B4630", "belt_dark": "#3F291C", "belt_thread": "#C9A57A",
    "satchel": "#C28C56", "flap": "#A9733F", "strap": "#9E6A3D", "satchel_dark": "#6E4529",
    "trousers": "#5F5246", "boot": "#8A5A37", "boot_cuff": "#B3855A", "boot_sole": "#3A2E28", "lace": "#EADFC6",
    "hair": "#7A4A2E",
})


# ---------------------------------------------------------------- helpers (not in the kit)

def smooth01(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def crom(keys, n):
    """n+1 samples of a Catmull-Rom spline through tuples `keys` (any length, all the same)."""
    pts = [keys[0]] + list(keys) + [keys[-1]]
    segs = len(keys) - 1
    out = []
    for i in range(n + 1):
        u = i / n * segs
        k = min(int(u), segs - 1)
        t = u - k
        p0, p1, p2, p3 = pts[k], pts[k + 1], pts[k + 2], pts[k + 3]
        out.append(tuple(0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3)
                         for a, b, c, d in zip(p0, p1, p2, p3)))
    return out


def gnorm(G, phi, z):
    """True surface normal of a Garment at (phi, z), from the profile slope."""
    h = 0.004
    dr = (G.rad(z + h) - G.rad(z - h)) / (2 * h)
    a = math.radians(phi)
    r = G.rad(z)
    dphi = Vector((-r * math.sin(a), G.ys * r * math.cos(a), 0.0))
    dz = Vector((dr * math.cos(a), G.ys * dr * math.sin(a), 1.0))
    n = dphi.cross(dz).normalized()
    if n.dot(Vector((math.cos(a), math.sin(a), 0.0))) < 0:
        n = -n
    return n


def gp(G, phi, z, out=0.0):
    """Point on a Garment pushed out along its true normal."""
    return G.pt(phi, z) + gnorm(G, phi, z) * out


def band(part, mat, pts, nrms, widths, th, segs=16, sq=0.35):
    """Flat leather band (strap, flap, belt tip) along world points `pts`, its thickness along `nrms`,
    with a rounded-rectangle section. Returns the (across, normal) frame at every point."""
    bm = bmesh.new()
    n = len(pts)
    if not isinstance(widths, (list, tuple)):
        widths = [widths] * n
    rings, frames = [], []
    for i in range(n):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        nn = nrms[i] - t * nrms[i].dot(t)
        nn.normalize()
        ac = nn.cross(t).normalized()
        frames.append((ac, nn))
        hw = widths[i] / 2
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs
            ca, sa = math.cos(a), math.sin(a)
            x = hw * math.copysign(abs(ca) ** sq, ca)
            y = th / 2 * math.copysign(abs(sa) ** sq, sa)
            ring.append(bm.verts.new(pts[i] + ac * x + nn * y))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((a[k], a[j], b[j], b[k]))
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, mat, None, smooth=True)
    return frames


def round_widths(pts, w, rc=None, ends=(False, True), minw=0.25):
    """Widths along a band that round its end(s) off with corner radius rc."""
    rc = w / 2 if rc is None else rc
    L = [0.0]
    for a, b in zip(pts, pts[1:]):
        L.append(L[-1] + (b - a).length)
    tot = L[-1]
    out = []
    for s in L:
        hw = w / 2
        for flag, rem in ((ends[0], s), (ends[1], tot - s)):
            if flag and rem < rc:
                d = rc - rem
                hw = min(hw, w / 2 - (rc - math.sqrt(max(rc * rc - d * d, 0.0))))
        out.append(max(2 * hw, w * minw))
    return out


def rrect(m, hx, hy, r, z=0.0, n=6):
    """Closed rounded rectangle in the local XY plane of m."""
    pts = []
    for cx, cy, a0 in ((hx - r, hy - r, 0), (-(hx - r), hy - r, 90), (-(hx - r), -(hy - r), 180), (hx - r, -(hy - r), 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append(m @ Vector((cx + r * math.cos(a), cy + r * math.sin(a), z)))
    pts.append(pts[0])
    return pts


def sgrid(part, mat, G, f, ns, nt):
    """Quad surface lying on a Garment: f(s, t) -> (phi, z, out) for s, t in [0, 1]."""
    bm = bmesh.new()
    rows = [[bm.verts.new(gp(G, *f(i / ns, j / nt))) for j in range(nt + 1)] for i in range(ns + 1)]
    i0, j0 = ns // 2, nt // 2
    phi, z, _ = f(i0 / ns, j0 / nt)
    nrm = (rows[i0 + 1][j0].co - rows[i0][j0].co).cross(rows[i0][j0 + 1].co - rows[i0][j0].co)
    flip = nrm.dot(gnorm(G, phi, z)) < 0
    for i in range(ns):
        for j in range(nt):
            q = [rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]]
            bm.faces.new(list(reversed(q)) if flip else q)
    part.add(bm, mat, None, smooth=True)


# ---------------------------------------------------------------- body (tunic, belt, satchel)

TUNIC = vc.Garment([(0.244, 0.295), (0.252, 0.315), (0.25, 0.35), (0.239, 0.40), (0.224, 0.45), (0.215, 0.49), (0.208, 0.55),
                    (0.196, 0.62), (0.18, 0.675), (0.158, 0.72), (0.127, 0.76), (0.094, 0.79), (0.064, 0.808), (0.04, 0.816)], ys=0.84)
BELT_Z = (0.432, 0.47)
SAT_PHI, SAT_Z = -22.0, 0.29
SAT_W, SAT_H, SAT_D = 0.18, 0.142, 0.06
CHECKS = {}


def collar(p):
    """Cream shirt collar: two halves meeting at the back, with points either side of the front."""
    G = TUNIC
    for sd in (1, -1):
        def f(s, t, sd=sd):
            ss = smooth01(0.55, 1.0, s)
            phi_in = 90 - sd * 174 * s
            phi_out = phi_in + sd * 14 * ss
            zo = 0.735 + 0.022 * math.sin(math.pi * s) - 0.032 * smooth01(0.6, 1.0, s)
            return phi_in + (phi_out - phi_in) * t, 0.802 + (zo - 0.802) * t, 0.006 + 0.006 * math.sin(math.pi * t)
        ns, nt = 56, 6
        sgrid(p, "collar", G, f, ns, nt)
        edge = [gp(G, *f(i / ns, 1.0)) for i in range(ns + 1)] + [gp(G, *f(1.0, 1 - j / nt)) for j in range(1, nt + 1)]
        p.add(bm_tube(edge, 0.0055, 10, cap=True), "collar", smooth=True)
        st = []
        for i in range(2, ns - 1):
            ph, z, o = f(i / ns, 0.8)
            st.append(gp(G, ph, z, o + 0.0016))
        stitch(p, st, "tunic_dark", 0.011, 0.007, 0.0021)


def belt(p):
    """Leather belt with rolled edges, stitching, a brass buckle, a keeper and a punched tip."""
    G = TUNIC
    z0, z1 = BELT_Z
    zm = (z0 + z1) / 2
    G.panel(p, -180, 180, z0, z1, "belt", 0.006, 128)
    for z in (z0, z1):
        G.hem(p, z, 0.0042, "belt", out=0.0035, n=96)
    for z in (z0 + 0.0065, z1 - 0.0065):
        G.stitch_ring(p, z, 0.0085, "belt_thread")
    # tip running from under the buckle to his right, through a keeper
    tip = [gp(G, -84 - 42 * k / 60, zm, 0.0125) for k in range(61)]
    band(p, "belt", tip, [gnorm(G, -84 - 42 * k / 60, zm) for k in range(61)], round_widths(tip, 0.03), 0.005)
    for ph in (-113, -118):
        p.add(sphere(12, 8), "belt_dark", frame(gp(G, ph, zm, 0.0151), gnorm(G, ph, zm)) @ S(0.0036, 0.0036, 0.0012), smooth=True)
    kp = [gp(G, -104, z, o) for z, o in ((z0 - 0.004, 0.006), (z0 + 0.002, 0.016), (zm, 0.0175), (z1 - 0.002, 0.016), (z1 + 0.004, 0.006))]
    band(p, "belt_dark", kp, [gnorm(G, -104, zm)] * len(kp), 0.012, 0.004)
    # buckle: rounded frame, a bar on the left and a prong lying over the tip
    fr = frame(gp(G, -90, zm, 0.0), gnorm(G, -90, zm))
    p.add(bm_tube(rrect(fr, 0.025, 0.027, 0.01, 0.0165), 0.0043, 10, cap=False), "brass", smooth=True)
    p.add(bm_tube([fr @ Vector((0.009, -0.026, 0.0165)), fr @ Vector((0.009, 0.026, 0.0165))], 0.0033, 8), "brass", smooth=True)
    p.add(bm_tube([fr @ Vector((0.009, 0, 0.0185)), fr @ Vector((-0.008, 0, 0.0205)), fr @ Vector((-0.026, 0, 0.0195))], 0.0026, 8), "brass_dark", smooth=True)


def emblem(p):
    """Embroidered sprout patch on the left chest: cream disc, blue stitched border, two leaves."""
    G = TUNIC
    ph, z = -50, 0.6
    m = frame(gp(G, ph, z, 0.002), gnorm(G, ph, z))
    p.add(lathe([(0.0315, 0.0), (0.033, 0.002), (0.0315, 0.0042)], 40, cap_top=True, cap_bottom=True), "patch_cream", m, smooth=True)
    stitch(p, ring_pts(m, 0.0262, 40, 0.0044), "tunic_dark", 0.0068, 0.0042, 0.0018)
    p.add(bm_tube([m @ Vector((0.0, -0.018, 0.0052)), m @ Vector((0.0015, -0.006, 0.0056)), m @ Vector((0.0, 0.004, 0.0058))], 0.0024, 8),
          "leaf_dark", smooth=True)
    for s in (-1, 1):
        lm = m @ Matrix.Translation((s * 0.0096, 0.0105, 0.0055)) @ M(rot=(0, 0, -s * 50))
        p.add(sphere(24, 14), "leaf", lm @ S(0.0062, 0.0128, 0.0026), smooth=True)
        p.add(bm_tube([lm @ Vector((0, -0.0095, 0.0024)), lm @ Vector((0, 0.009, 0.0024))], 0.0009, 5), "leaf_dark", smooth=True)


def sat_frame():
    """Satchel frame: local Z out from the hip, Y up, -X toward the front."""
    G = TUNIC
    a = math.radians(SAT_PHI)
    n = Vector((math.cos(a), math.sin(a) / G.ys, 0.0)).normalized()
    pos = G.pt(SAT_PHI, 0.30) + n * (0.021 + SAT_D / 2)
    pos.z = SAT_Z
    return frame(pos, n)


def satchel(p):
    m = sat_frame()
    m3 = m.to_3x3()

    def L(x, y, z):
        return m @ Vector((x, y, z))

    hw, hh, hd = SAT_W / 2, SAT_H / 2, SAT_D / 2
    p.add(bm_box(SAT_W, SAT_H, SAT_D, bevel=0.022, segs=6), "satchel", m, smooth=True)
    for zz in (hd - 0.0064, -(hd - 0.0064)):                                    # piping on the front and back seams
        p.add(bm_tube(rrect(m, hw - 0.0064, hh - 0.0064, 0.016, zz, 6), 0.0042, 8, cap=False), "satchel_dark", smooth=True)
    # flap: wraps from the back over the top and down the front, rounded bottom corners
    th = 0.008
    R = 0.022 + th / 2
    yc, zc = hh - 0.022, hd - 0.022
    path = []
    for k in range(9):
        a = math.radians(150 - 60 * k / 8)
        path.append((yc + R * math.sin(a), -zc + R * math.cos(a), math.sin(a), math.cos(a)))
    for k in range(1, 4):
        path.append((yc + R, -zc + 2 * zc * k / 4, 1.0, 0.0))
    for k in range(13):
        a = math.radians(90 - 90 * k / 12)
        path.append((yc + R * math.sin(a), zc + R * math.cos(a), math.sin(a), math.cos(a)))
    y_end = -0.012
    for k in range(1, 41):
        path.append((yc + (y_end - yc) * k / 40, hd + th / 2, 0.0, 1.0))
    pts = [L(0, y, z) for y, z, _, _ in path]
    nrm = [(m3 @ Vector((0, ny, nz))).normalized() for _, _, ny, nz in path]
    fw = round_widths(pts, SAT_W + 0.01, rc=0.04)
    band(p, "flap", pts, nrm, fw, th, segs=24, sq=0.25)
    # flap stitching: down one side, round the corners, across and back up
    nfront = 41
    left, right = [], []
    tot = plen(pts)
    acc = 0.0
    for i in range(len(pts)):
        if i:
            acc += (pts[i] - pts[i - 1]).length
        if i >= len(pts) - nfront and tot - acc > 0.009:
            y = path[i][0]
            x = fw[i] / 2 - 0.009
            left.append(L(-x, y, hd + th + 0.0004))
            right.append(L(x, y, hd + th + 0.0004))
    stitch(p, left + list(reversed(right)), "thread", 0.01, 0.006, 0.0022)
    # buckled tongue
    zf, zb = hd + th + 0.0028, hd + 0.0028
    tp = [L(0, 0.03 - 0.042 * k / 21, zf) for k in range(22)]
    tp += [L(0, -0.0165, (zf + zb) / 2)] + [L(0, -0.021 - 0.023 * k / 14, zb) for k in range(15)]
    band(p, "satchel_dark", tp, [m3 @ Vector((0, 0, 1))] * len(tp), round_widths(tp, 0.024), 0.005)
    for s in (-1, 1):
        p.add(sphere(12, 8), "brass", m @ Matrix.Translation((s * 0.0065, 0.025, zf + 0.0026)) @ S(0.0034, 0.0034, 0.0018), smooth=True)
    for y in (-0.005, 0.005):
        p.add(sphere(10, 6), "belt_dark", m @ Matrix.Translation((0, y, zf + 0.0024)) @ S(0.0028, 0.0028, 0.0009), smooth=True)
    bfr = m @ Matrix.Translation((0, -0.031, zb + 0.0042))
    p.add(bm_tube(rrect(bfr, 0.017, 0.012, 0.005), 0.0027, 8, cap=False), "brass", smooth=True)
    p.add(bm_tube([bfr @ Vector((-0.017, -0.002, 0)), bfr @ Vector((0.017, -0.002, 0))], 0.0022, 6), "brass", smooth=True)
    p.add(bm_tube([bfr @ Vector((0, -0.002, 0.001)), bfr @ Vector((0, 0.012, 0.0012))], 0.0019, 6), "brass_dark", smooth=True)
    # D-rings on stitched side tabs
    for sx in (-1, 1):
        x = sx * (hw + 0.002)
        tab = [L(x, y, 0) for y in (hh - 0.036, hh - 0.02, hh - 0.004, hh + 0.004)]
        band(p, "satchel_dark", tab, [m3 @ Vector((sx, 0, 0))] * 4, 0.022, 0.004)
        p.add(sphere(12, 8), "brass", frame(L(x + sx * 0.0025, hh - 0.022, 0), m3 @ Vector((sx, 0, 0))) @ S(0.0036, 0.0036, 0.002), smooth=True)
        xr = sx * (hw + 0.0045)
        y0 = hh + 0.002
        ring = [L(xr, y0, -0.014), L(xr, y0, 0.014)] + [L(xr, y0 + 0.017 * math.sin(a), 0.014 * math.cos(a))
                                                         for a in [math.pi * k / 12 for k in range(1, 13)]]
        ring.append(ring[0])
        p.add(bm_tube(ring, 0.0028, 8, cap=False), "brass", smooth=True)
    # numeric checks: satchel inner face vs the tunic hem, and its top vs the left hand
    G = TUNIC
    worst = 9.0
    for i in range(9):
        for j in range(7):
            q = L(-hw + 0.022 + (SAT_W - 0.044) * i / 8, -hh + 0.022 + (SAT_H - 0.044) * j / 6, -hd)
            allow = 0.02 if q.z < 0.32 else 0.0
            worst = min(worst, math.sqrt(q.x ** 2 + (q.y / G.ys) ** 2) - G.rad(q.z) - allow)
    hand = vc.hand_c(1, CFG)
    tops = [L(-hw + SAT_W * i / 10, hh + 0.012, z) for i in range(11) for z in (-hd, 0, hd)] + [L(sx * (hw + 0.0045), hh + 0.019, 0) for sx in (-1, 1)]
    CHECKS["satchel_vs_tunic"] = round(worst, 4)
    CHECKS["satchel_vs_hand"] = round(min((q - hand).length for q in tops) - 0.066, 4)


def strap(p):
    """Satchel strap: front D-ring, across the chest, over the right shoulder, down the back to the rear D-ring."""
    G = TUNIC
    keys = [(-45, 0.42, 0.018), (-55, 0.455, 0.022), (-70, 0.50, 0.016), (-88, 0.565, 0.015), (-104, 0.635, 0.015), (-120, 0.70, 0.017),
            (-138, 0.745, 0.022), (-160, 0.775, 0.026), (-180, 0.792, 0.026), (-200, 0.775, 0.026), (-222, 0.745, 0.022),
            (-242, 0.69, 0.016), (-262, 0.61, 0.015), (-282, 0.53, 0.016), (-300, 0.47, 0.022), (-315, 0.42, 0.018)]
    samp = crom(keys, 12 * (len(keys) - 1))
    pts = [gp(G, ph, z, o) for ph, z, o in samp]
    nrms = [gnorm(G, ph, z) for ph, z, o in samp]
    m = sat_frame()
    m3 = m.to_3x3()
    hw, hh = SAT_W / 2, SAT_H / 2

    def end(sx):
        return m @ Vector((sx * (hw + 0.009), hh + 0.013, 0.0)), (m3 @ Vector((sx, 0, 0))).normalized()

    def bridge(a, na, b, nb, k=7):
        return [a.lerp(b, i / k) for i in range(1, k)], [na.lerp(nb, i / k).normalized() for i in range(1, k)]

    (ef, nf), (eb, nb) = end(-1), end(1)
    bf, bnf = bridge(ef, nf, pts[0], nrms[0])
    bb, bnb = bridge(pts[-1], nrms[-1], eb, nb)
    P = [ef] + bf + pts + bb + [eb]
    N = [nf] + bnf + nrms + bnb + [nb]
    w, th = 0.036, 0.007
    frs = band(p, "strap", P, N, w, th)
    for s in (-1, 1):
        stitch(p, [P[i] + ac * s * (w / 2 - 0.0055) + nn * (th / 2 + 0.0005) for i, (ac, nn) in enumerate(frs)][2:-2], "thread", 0.011, 0.007, 0.0021)
    for q, n in ((ef, nf), (eb, nb)):                       # rivet where the strap folds round the ring
        p.add(sphere(12, 8), "brass", frame(q + n * 0.004, n) @ S(0.0042, 0.0042, 0.0022), smooth=True)


def body():
    p = Part("body")
    G = TUNIC
    G.mesh(p, "tunic", segs=72)
    G.hem(p, 0.302, 0.015, "tunic_dark", n=72)
    # cream zig-zag embroidery above the hem
    N = 44
    zz = [G.pt(-180 + 360 * k / (2 * N), 0.322 + (0.013 if k % 2 else 0.0), 0.004) for k in range(2 * N + 1)]
    p.add(bm_tube(zz, 0.0029, 6, cap=False), "thread", smooth=True)
    # seams: sides, centre back (broken by the belt) and a yoke across the shoulders
    stitch(p, G.line(180, 0.345, 0.425, 0.003, 4), "thread")
    for phi in (0, 180):
        stitch(p, G.line(phi, 0.478, 0.64, 0.003, 8), "thread")
    stitch(p, G.line(90, 0.345, 0.425, 0.003, 4), "thread")
    stitch(p, G.line(90, 0.478, 0.66, 0.003, 8), "thread")
    stitch(p, G.arc(28, 152, 0.662, 0.003, 24), "thread")
    p.add(bm_cyl(0.058, 0.056, 0.13, 32), "skin_warm", M((0, 0, 0.745)), smooth=True)
    collar(p)
    belt(p)
    emblem(p)
    satchel(p)
    strap(p)
    print("CHECKS", CHECKS)
    return p


# ---------------------------------------------------------------- head

NECK = 0.78
HD = vc.Head((0, 0, 1.05), 0.31, 0.285, 0.28)


def hpt(az, el, out=0.0):
    """Point on the head ellipsoid at azimuth az (-90 = front, 0 = his left) and elevation el, pushed out."""
    A, E = math.radians(az), math.radians(el)
    d = Vector((math.cos(E) * math.cos(A), math.cos(E) * math.sin(A), math.sin(E)))
    n = Vector((d.x / HD.a, d.y / HD.b, d.z / HD.c)).normalized()
    return HD.hc + Vector((HD.a * d.x, HD.b * d.y, HD.c * d.z)) + n * out


def hnorm(az, el):
    A, E = math.radians(az), math.radians(el)
    d = Vector((math.cos(E) * math.cos(A), math.cos(E) * math.sin(A), math.sin(E)))
    return Vector((d.x / HD.a, d.y / HD.b, d.z / HD.c)).normalized()


def lock(keys, n=72):
    """One broad sculpted lock: keys (az, el, out, thickness radius, half-width) along the head.
    Five balls side by side across the lock make it flat and wide, tapering to a point."""
    s = crom(keys, n)
    cs = [hpt(az, el, o) for az, el, o, r, w in s]
    els = []
    for i, (az, el, o, r, w) in enumerate(s):
        t = (cs[min(i + 1, n)] - cs[max(i - 1, 0)]).normalized()
        ac = hnorm(az, el).cross(t).normalized()
        for f in (-1.0, -0.5, 0.0, 0.5, 1.0):
            els.append((cs[i] + ac * w * f, max(r * (1 - 0.2 * abs(f)), 0.004)))
    return els


def mirror(keys):
    return [(180 - k[0],) + tuple(k[1:]) for k in keys]


def hair(hp):
    def emin(az):
        f = -math.sin(math.radians(az))
        return 8 + 32 * f ** 1.4 if f > 0 else 8 + 33 * f

    # the cap: a full, smooth fused shell over the skull down to the hairline
    cap = []
    N = 520
    for i in range(N):
        el = math.degrees(math.asin(1 - 2 * (i + 0.5) / N))
        az = (i * 137.50776) % 360 - 180
        if el >= emin(az) + 3:
            k = smooth01(emin(az), emin(az) + 30, el)        # thinner toward the hairline, so the nape tapers
            cap.append((hpt(az, el, -0.016 + 0.01 * k), 0.032 + 0.012 * k))
    for k in range(60):
        az = -180 + 6 * k
        if math.sin(math.radians(az)) < 0.3:                  # a defined rim at the front and sides only
            cap.append((hpt(az, emin(az), 0.0), 0.036))
    hp.add(meta(cap, 0.0095), "hair", None, smooth=True)
    # broad locks, each its own shape so the grooves between them stay crisp
    locks = [
        # fringe right of the side parting: two chunks swept to his right
        [(-52, 66, 0.026, 0.016, 0.018), (-66, 52, 0.04, 0.03, 0.034), (-80, 38, 0.032, 0.026, 0.028), (-88, 28, 0.02, 0.016, 0.012),
         (-91, 23, 0.012, 0.006, 0.0)],
        [(-62, 80, 0.026, 0.016, 0.02), (-98, 62, 0.04, 0.03, 0.036), (-118, 44, 0.032, 0.026, 0.03), (-128, 32, 0.02, 0.016, 0.012),
         (-131, 26, 0.012, 0.006, 0.0)],
        # his right side: a long lock down in front of the ear
        [(-118, 74, 0.026, 0.016, 0.018), (-150, 56, 0.04, 0.03, 0.032), (-162, 34, 0.034, 0.026, 0.028), (-165, 12, 0.026, 0.02, 0.018),
         (-166, -2, 0.016, 0.011, 0.006), (-166, -7, 0.01, 0.005, 0.0)],
        # left of the parting: a short chunk swept to his left, and the left side lock
        [(-46, 72, 0.026, 0.016, 0.018), (-40, 57, 0.04, 0.03, 0.03), (-36, 43, 0.032, 0.026, 0.026), (-34, 32, 0.02, 0.016, 0.012),
         (-33, 26, 0.012, 0.006, 0.0)],
        [(-30, 76, 0.026, 0.016, 0.018), (-21, 56, 0.04, 0.03, 0.03), (-18, 34, 0.034, 0.026, 0.028), (-17, 12, 0.026, 0.02, 0.018),
         (-16, -2, 0.016, 0.011, 0.006), (-16, -7, 0.01, 0.005, 0.0)],
    ]
    # short pointed tufts at the nape and behind the ears
    for az, tip in ((30, -10), (54, -27), (78, -34), (102, -34), (126, -27), (150, -10)):
        sg = 1 if az < 90 else -1
        locks.append([(az, 64, 0.016, 0.01, 0.014), (az, 38, 0.024, 0.021, 0.034), (az - sg * 2, 8, 0.028, 0.023, 0.037),
                      (az - sg * 4, (8 + tip) / 2, 0.029, 0.02, 0.028), (az - sg * 5, tip + 6, 0.032, 0.012, 0.011), (az - sg * 6, tip, 0.036, 0.005, 0.0)])
    for k in locks:
        hp.add(meta(lock(k), 0.007), "hair", None, smooth=True)
    # cowlick curling forward off the crown
    b = hpt(70, 80, 0.045)
    ck = [tuple(b + Vector(v[:3])) + (v[3],) for v in ((0, 0, 0, 0.028), (0, 0, 0.045, 0.022), (0, -0.015, 0.085, 0.016),
                                                       (0, -0.045, 0.105, 0.011), (0, -0.07, 0.1, 0.006))]
    hp.add(meta([(Vector(c[:3]), c[3]) for c in crom(ck, 24)], 0.006), "hair", None, smooth=True)


def head():
    hp = Part("head")
    # the standard face, but with the button nose at 75% of the kit size and a touch higher (younger, fresher)
    HD.skull(hp)
    HD.ears(hp)
    for s in (-1, 1):
        HD.eye(hp, s, 0.1, 0.0, 0.032, 0.045)
    HD.blush(hp)
    HD.nose(hp, "nose", z=-0.042, size=(0.0375, 0.033, 0.0375), out=0.0165)
    HD.mouth(hp, -0.128, "smile")
    brow = crom(((0.066, 0.077, 0.014), (0.098, 0.087, 0.0165), (0.132, 0.084, 0.015), (0.156, 0.073, 0.0105)), 12)
    HD.brows(hp, "hair", pts=brow, res=0.005)
    hair(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

def elbow_patch(p, side, pv, d):
    """A lighter-blue mend on the back of the left elbow, stitched round in cream."""
    if side < 0:
        return
    n0 = Vector((side * 0.6, 0.8, 0.0))
    n = (n0 - d * n0.dot(d)).normalized()
    em = frame(pv + d * 0.12 + n * 0.07, n)
    p.add(sphere(24, 14), "patch_blue", em @ S(0.031, 0.039, 0.007), smooth=True)
    stitch(p, ring_pts(em, 0.024, 28, 0.0066, ry=0.031), "thread", 0.008, 0.005, 0.002)


def leg(side, cfg):
    """Trouser leg and a sturdy little laced boot with a turned-down cuff (own version of vc.leg)."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    hz, lr, top = cfg["hip_z"], cfg["leg_r"], cfg["boot_top"]
    p.add(bm_tube([(x, 0, hz), (x, 0, top - 0.005)], [lr, lr * 1.03], 24), "trousers", smooth=True)
    els = [((x, 0.006, z), 0.066) for z in (0.1, 0.125, 0.15, 0.17, top - 0.005)]
    els += [((x, -0.028, 0.078), 0.068), ((x, -0.082, 0.068), 0.064), ((x, -0.122, 0.06), 0.054), ((x, 0.042, 0.074), 0.062)]
    bm = meta(els, 0.008)
    bvh = BVHTree.FromBMesh(bm)

    def front(dx, z):
        loc, nrm, _, _ = bvh.ray_cast(Vector((x + dx, -0.5, z)), Vector((0, 1, 0)))
        return Vector(loc), Vector(nrm).normalized()

    rows = [[front(s * 0.017, z) for s in (-1, 1)] for z in (0.108, 0.13, 0.152)]
    top_c, top_n = front(0.0, 0.17)
    p.add(bm, "boot", None, smooth=True)
    p.add(bm_box(0.126, 0.252, 0.026, bevel=0.012, segs=3), "boot_sole", M((x, -0.032, 0.013)), smooth=True)
    # eyelets and criss-cross laces up the instep, a tiny bow at the top
    for row in rows:
        for q, n in row:
            p.add(sphere(14, 8), "brass", frame(q + n * 0.001, n) @ S(0.0062, 0.0062, 0.0028), smooth=True)
            p.add(sphere(8, 6), "boot_sole", frame(q + n * 0.0036, n) @ S(0.0026, 0.0026, 0.0012), smooth=True)
    for i in range(2):
        for a, b in ((rows[i][0], rows[i + 1][1]), (rows[i][1], rows[i + 1][0])):
            nm = (a[1] + b[1]).normalized()
            p.add(bm_tube(vc.bezier(a[0] + a[1] * 0.003, (a[0] + b[0]) / 2 + nm * 0.007, b[0] + b[1] * 0.003, 6), 0.0026, 6), "lace", smooth=True)
    kc = (rows[2][0][0] + rows[2][1][0]) / 2 + top_n * 0.007
    kf = frame(kc, top_n)
    p.add(sphere(12, 8), "lace", kf @ S(0.0045), smooth=True)
    for s in (-1, 1):
        loop = [kf @ Vector((s * 0.0085 * (1 - math.cos(t)), 0.0065 * math.sin(t), 0.0015)) for t in [2 * math.pi * k / 14 for k in range(15)]]
        p.add(bm_tube(loop, 0.0023, 6, cap=False), "lace", smooth=True)
        p.add(bm_tube([kf @ Vector((0, 0, 0.002)), kf @ Vector((s * 0.006, -0.012, 0.004)), kf @ Vector((s * 0.008, -0.02, 0.003))], [0.0024, 0.0022, 0.0018], 6),
              "lace", smooth=True)
    # turned-down cuff with a stitched line
    cuff = [(0.066, top - 0.03), (0.077, top - 0.026), (0.082, top - 0.008), (0.083, top + 0.016), (0.079, top + 0.03), (0.07, top + 0.036),
            (0.06, top + 0.034)]
    p.add(lathe(cuff, 48), "boot_cuff", Matrix.Translation((x, 0.006, 0)), smooth=True)
    stitch(p, ring_pts(Matrix.Translation((x, 0.006, top - 0.012)), 0.0828, 40), "stitch_dark", 0.01, 0.006, 0.0021)
    return p


CFG = dict(
    neck_z=NECK, shoulder_x=0.18, shoulder_z=0.69, hip_x=0.09, hip_z=0.36,
    arm_len=0.25, arm_splay=9, sleeve_r=0.07, sleeve_mat="tunic", cuff_mat="tunic_dark", stitch_mat="thread", arm_fn=elbow_patch,
    leg_r=0.06, boot_top=0.19, leg=leg,
)
CFG.update(body=body, head=head, closeup_z=0.97,
           shots=[("back", (0, 0, 0.75), 160, 8, 2.4), ("satchel", (0.26, -0.11, 0.33), -72, 8, 0.9), ("hair", (0, 0, 1.1), 125, 12, 1.4)])


def main():
    return vc.build("player", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
