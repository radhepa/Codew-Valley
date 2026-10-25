"""Sable the merchant, a fast-talking, likeable peddler, in the soft Animal Crossing style of
Marlo the fisher (restyled 2026-10-23). No triangle budget.
A tall, puffy plum newsboy cap tipped back and to one side (stitched gores, a covered button, a
stiff stitched peak, a dark band with a gold coin brooch) with a long barred red feather swept
up and back; dark hair slicked back under it with sideburns and a pointed goatee; one brow
cocked, the other eye half-lidded, and a lopsided open grin with a gold tooth.
A moss-green patchwork coat covered in pockets (teal, ochre, rust and plum patch pockets with
pointed flaps, buttons and stitching, cloth patches sewn on with running stitch), teal lapels
and a fall collar over a linen shirt, a pencil and a rolled receipt poking out of open pockets,
an ochre rolled hem and cuffs, elbow patches, and a rust sash knotted at the hip with fringed tails.
Prop: `purse` (arm_l): a fat leather coin purse hanging from the fist by its drawstring, pleated
neck, brass eyelets, stitched seams, a coin medallion, gold coins peeking out of the open mouth,
and the cord ends dangling from the fist with wooden beads and tassels.
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
from villagers_common import frame, S, sphere, lathe, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "coat": "#77874F", "coat_dark": "#5A6A3B", "coat_thread": "#DCD6AA",
    "teal": "#4F8C84", "teal_dark": "#3B6D67", "ochre": "#CC9849", "ochre_dark": "#A07435",
    "rust": "#B5623F", "rust_dark": "#8A4630", "plum": "#7C4E72", "plum_dark": "#583651", "plum_thread": "#CFAAC4",
    "shirt": "#EEE5CF", "shirt_dark": "#CDBFA0",
    "hair": "#3A2A24", "tongue": "#D46F5E",
    "trousers": "#5E4E48", "boot": "#704A32", "boot_dark": "#4E3423",
    "feather_red": "#D0413A", "feather_bar": "#A2302B", "quill": "#EFE3CB",
    "leather": "#8C5B37", "leather_dark": "#5E3C26", "leather_light": "#AD784B", "purse_inside": "#3A271C",
    "drawstring": "#CDA368", "wood": "#9A6640", "wood_dark": "#6A4228",
    "pencil": "#E5B542", "pencil_wood": "#E9CB9C", "eraser": "#E39A92", "graphite": "#3A3A3D",
    "paper": "#F2EAD6", "string_red": "#A8423A",
}, metal={"gold": (0.8, 0.28)}, gloss={"gold": 0.28})


# ---------------------------------------------------------------- shared helpers (not in the kit)

def kfun(u, v, flat):
    """Pillow height factor: 1 inside, falling to 0 at the edges of the unit square."""
    return (1 - abs(2 * u - 1) ** flat) * (1 - abs(2 * v - 1) ** flat)


def pillow(part, mat, pos, out_dir, nu=12, nv=12, h0=-0.002, h1=0.008, flat=10):
    """A soft cushion lying on a surface: pos(u, v, out) -> world point for u, v in [0, 1].
    The rim sinks to h0 (into the surface below, so no gap shows) and the middle rises to h1."""
    bm = bmesh.new()
    rows = [[bm.verts.new(pos(i / nu, j / nv, h0 + (h1 - h0) * kfun(i / nu, j / nv, flat))) for j in range(nv + 1)] for i in range(nu + 1)]
    for i in range(nu):
        for j in range(nv):
            bm.faces.new((rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]))
    bm.normal_update()
    bm.faces.ensure_lookup_table()
    f = bm.faces[len(bm.faces) // 2]
    if f.normal.dot(out_dir(f.calc_center_median())) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    part.add(bm, mat, smooth=True)


def sweep(pts, ups, rw, rh, segs=12, cap=True, closed=False):
    """Sweep an ellipse along a polyline: rw is the half-width along (tangent x up), rh along up.
    Gives flat straps, ribbons, feather vanes and puffy sashes. ups: one vector or one per point."""
    bm = bmesh.new()
    pts = [Vector(q) for q in pts]
    n = len(pts)
    rings = []
    for i, q in enumerate(pts):
        t = (pts[(i + 1) % n] - pts[(i - 1) % n]) if closed else (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)])
        t.normalize()
        u = Vector(ups[i]) if isinstance(ups, list) else Vector(ups)
        u = (u - t * u.dot(t)).normalized()
        sd = t.cross(u)
        w = rw[i] if isinstance(rw, (list, tuple)) else rw
        h = rh[i] if isinstance(rh, (list, tuple)) else rh
        rings.append([bm.verts.new(q + sd * (w * math.cos(2 * math.pi * k / segs)) + u * (h * math.sin(2 * math.pi * k / segs)))
                      for k in range(segs)])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if cap and not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def coin(part, m, r=0.019, t=0.0045, mat="gold"):
    """Gold coin on matrix m (local Z = coin axis): milled edge, raised rim ring and a centre boss."""
    part.add(bm_lathe([(r * 0.96, -t / 2), (r, -t / 2 + 0.0011), (r, t / 2 - 0.0011), (r * 0.96, t / 2)], 32), mat, m, smooth=True)
    for zz in (-1, 1):
        part.add(bm_tube(ring_pts(m, r * 0.8, 28, zz * t / 2), 0.001, 5, cap=False), mat, smooth=True)
        part.add(sphere(16, 8), mat, m @ Matrix.Translation((0, 0, zz * t / 2)) @ S(r * 0.36, r * 0.36, 0.0013), smooth=True)


# ---------------------------------------------------------------- body (patchwork coat)

G = vc.Garment([(0.244, 0.175), (0.252, 0.2), (0.248, 0.26), (0.236, 0.34), (0.22, 0.43), (0.206, 0.52), (0.192, 0.6),
                (0.178, 0.66), (0.16, 0.71), (0.134, 0.75), (0.1, 0.787), (0.066, 0.815), (0.04, 0.83)], ys=0.84)
SASH_Z = 0.465


def gout(c):
    return Vector((c.x, c.y, 0.0))


def gpos(f):
    return lambda u, v, o: G.pt(*f(u, v), o)


def gmap(pc, zc, w, h, tilt=0.0):
    """(u, v) in [0, 1] -> (phi, z) for a w x h metre rectangle centred at (pc, zc), rotated by tilt degrees."""
    a = math.radians(tilt)
    k = math.sqrt(math.sin(math.radians(pc)) ** 2 + (G.ys * math.cos(math.radians(pc))) ** 2)

    def f(u, v):
        lu, lv = (u - 0.5) * w, (v - 0.5) * h
        su, sv = lu * math.cos(a) - lv * math.sin(a), lu * math.sin(a) + lv * math.cos(a)
        z = zc + sv
        return pc + math.degrees(su / (G.rad(z) * k)), z
    return f


def border(f, h0, h1, flat, i0=0.1, i1=0.9, v0=None, v1=None, n=6, closed=True):
    """Points of an inset rectangle on a pillow (for running stitches)."""
    v0 = i0 if v0 is None else v0
    v1 = i1 if v1 is None else v1
    corners = [(i0, v1), (i0, v0), (i1, v0), (i1, v1)] + ([(i0, v1)] if closed else [])
    pts = []
    for (ua, va), (ub, vb) in zip(corners, corners[1:]):
        for k in range(n):
            u, v = ua + (ub - ua) * k / n, va + (vb - va) * k / n
            pts.append(G.pt(*f(u, v), h0 + (h1 - h0) * kfun(u, v, flat) + 0.0012))
    u, v = corners[-1]
    pts.append(G.pt(*f(u, v), h0 + (h1 - h0) * kfun(u, v, flat) + 0.0012))
    return pts


def cloth_patch(p, pc, zc, w, h, tilt, mat, thread="stitch_light"):
    """A square of other cloth sewn on with a running stitch."""
    f = gmap(pc, zc, w, h, tilt)
    pillow(p, mat, gpos(f), gout, 12, 12, -0.002, 0.0065, 10)
    stitch(p, border(f, -0.002, 0.0065, 10, 0.11, 0.89), thread, 0.011, 0.007, 0.0024)


def pocket(p, pc, hw, z0, z1, body, flap=None, btn="brass", thread="stitch_light", flap_h=0.042):
    """Patch pocket (hw = half width in metres) with an optional pointed flap and button."""
    h = z1 - z0
    f = gmap(pc, (z0 + z1) / 2, 2 * hw, h)
    H0, H1 = -0.002, 0.009
    pillow(p, body, gpos(f), gout, 12, 12, H0, H1, 10)
    top = 0.7 if flap else 0.86
    stitch(p, border(f, H0, H1, 10, 0.1, 0.9, 0.1, top, closed=False), thread, 0.011, 0.007, 0.0024)
    if not flap:
        p.add(bm_tube([G.pt(*f(u / 12, 0.93), H1 + 0.001) for u in range(1, 12)], 0.0055, 8), body, smooth=True)
        return f
    fhr = flap_h / h

    def ff(u, v):
        pu = -0.02 + 1.04 * u
        lo = 1.0 - fhr * (0.7 + 0.3 * (1 - abs(2 * pu - 1)))
        return f(pu, lo + (1.0 - lo) * v)
    F0, F1 = 0.003, 0.0165
    pillow(p, flap, gpos(ff), gout, 14, 8, F0, F1, 8)
    pts = [G.pt(*ff(0.08 + 0.84 * k / 14, 0.32 if abs(k - 7) > 3 else 0.32 + 0.0), F0 + (F1 - F0) * kfun(0.08 + 0.84 * k / 14, 0.32, 8) + 0.0012)
           for k in range(15)]
    stitch(p, pts, thread, 0.011, 0.007, 0.0024)
    phi, z = ff(0.5, 0.2)
    G.button(p, phi, z, 0.0115, btn, F0 + (F1 - F0) * kfun(0.5, 0.2, 8) + 0.002)
    return f


def lapel_w(z):
    t = max(0.0, min(1.0, (z - 0.535) / 0.27))
    return 2.0 + 20.0 * t, 4.0 + 14.0 * t


def front(p):
    """Linen shirt in the V, teal lapels, the shirt collar points and a teal fall collar."""
    def shirt(u, v):
        z = 0.535 + v * (0.81 - 0.535)
        return -90 + (2 * u - 1) * lapel_w(z)[0] * 1.25, z
    pillow(p, "shirt", gpos(shirt), gout, 10, 12, -0.002, 0.004, 6)
    p.add(bm_tube([G.pt(-90, 0.55 + 0.25 * k / 8, 0.0045) for k in range(9)], 0.0022, 6), "shirt_dark", smooth=True)
    for z in (0.6, 0.675):
        G.button(p, -90, z, 0.0075, "white", 0.0055)
    for s in (-1, 1):
        def lap(u, v, s=s):
            z = 0.53 + v * (0.802 - 0.53)
            inner, lw = lapel_w(z)
            return -90 + s * (inner + u * lw), z
        pillow(p, "teal", gpos(lap), gout, 8, 16, -0.002, 0.011, 6)
        p.add(bm_tube([G.pt(*lap(0.0, k / 16), 0.006) for k in range(17)], 0.0042, 8), "teal_dark", smooth=True)
        stitch(p, [G.pt(*lap(0.7, 0.06 + 0.88 * k / 12), 0.0105) for k in range(13)], "stitch_light", 0.011, 0.007, 0.0022)

        def col(u, v, s=s):
            return -90 + s * (1.5 + 15.0 * u), 0.812 - (1 - v) * (0.024 + 0.036 * u ** 1.3)
        pillow(p, "shirt", gpos(col), gout, 10, 6, 0.003, 0.015, 6)
    # fall collar round the back of the neck, joining the lapels
    cp = [(0.153, 0.733), (0.147, 0.762), (0.131, 0.79), (0.106, 0.814), (0.085, 0.83)]
    p.add(bm_lathe(cp, 40, arc=(-50, 230)), "teal", M(scale=(1, G.ys + 0.04, 1)), smooth=True)
    p.add(bm_tube([(0.154 * math.cos(math.radians(a)), (G.ys + 0.04) * 0.154 * math.sin(math.radians(a)), 0.732)
                   for a in range(-50, 231, 10)], 0.0055, 8), "teal_dark", smooth=True)
    p.add(bm_cyl(0.06, 0.058, 0.13, 24), "skin_tan", M((0, 0, 0.74)), smooth=True)
    p.add(bm_tube([(0.066 * math.cos(2 * math.pi * k / 32), 0.95 * 0.066 * math.sin(2 * math.pi * k / 32), 0.81) for k in range(33)],
                  0.01, 10, cap=False), "shirt", smooth=True)


def pencil(p):
    a, b = G.pt(-53, 0.635, 0.006), G.pt(-49, 0.725, 0.022)
    d = (b - a).normalized()
    p.add(bm_tube([a, b], 0.0068, 6), "pencil", smooth=False)
    p.add(bm_tube([b - d * 0.002, b + d * 0.011], 0.0074, 12), "brass", smooth=True)
    p.add(bm_tube([b + d * 0.011, b + d * 0.022], 0.0068, 12), "eraser", smooth=True)
    p.add(sphere(12, 8), "eraser", M(b + d * 0.022, scale=0.0068), smooth=True)
    # a folded receipt beside it
    m = frame(G.pt(-62, 0.672, 0.007), G.normal(-62, 0.672)) @ M(rot=(0, 0, 8))
    p.add(bm_box(0.034, 0.05, 0.0035, bevel=0.0012, segs=2), "paper", m @ Matrix.Translation((0, 0.012, 0)), smooth=True)
    for k in range(3):
        p.add(bm_box(0.022, 0.0016, 0.001), "graphite", m @ Matrix.Translation((-0.002, 0.02 + 0.008 * k, 0.0022)))


def receipt_roll(p, f):
    """A rolled receipt tied with red string, standing in an open pocket."""
    a = G.pt(*f(0.42, 0.55), 0.004)
    b = G.pt(*f(0.32, 1.25), 0.016)
    d = (b - a).normalized()
    p.add(bm_tube([a, b], 0.0105, 16), "paper", smooth=True)
    p.add(sphere(16, 8), "paper", frame(b, d) @ S(0.0105, 0.0105, 0.002), smooth=True)
    p.add(bm_tube(ring_pts(frame(b, d), 0.0048, 14, 0.0018), 0.0011, 4, cap=False), "shirt_dark", smooth=True)
    c = a + (b - a) * 0.72
    p.add(bm_tube(ring_pts(frame(c, d), 0.0112, 18), 0.0018, 6, cap=False), "string_red", smooth=True)


def sash(p):
    ring = G.arc(-180, 180, SASH_Z, 0.006, 96)[:-1]
    p.add(sweep(ring, Vector((0, 0, 1)), 0.012, 0.036, 16, closed=True), "rust", smooth=True)
    for dz in (-0.014, 0.012):
        p.add(sweep(G.arc(-180, 180, SASH_Z + dz, 0.0165, 96)[:-1], Vector((0, 0, 1)), 0.0016, 0.0024, 8, closed=True), "rust_dark", smooth=True)
    # knot on the right hip with two loops, and two fringed tails
    kp = -140
    km = G.frame(kp, SASH_Z, 0.028)
    p.add(sphere(24, 16), "rust", km @ S(0.034, 0.038, 0.026), smooth=True)
    for s in (-1, 1):
        p.add(sphere(20, 12), "rust", km @ Matrix.Translation((s * 0.036, 0.004, -0.006)) @ M(rot=(0, 0, s * 20)) @ S(0.03, 0.02, 0.016), smooth=True)
    p.add(bm_tube([km @ Vector((-0.012, 0.03, 0.02)), km @ Vector((0, 0.0, 0.028)), km @ Vector((0.012, -0.03, 0.02))], 0.0035, 8), "rust_dark", smooth=True)
    for phi1, L, w in ((-136, 0.17, 0.026), (-149, 0.14, 0.023)):
        zs = [SASH_Z - 0.02 - L * k / 10 for k in range(11)]
        phis = [kp + (phi1 - kp) * (k / 10) for k in range(11)]
        pts = [G.pt(ph, z, 0.014 + 0.006 * k / 10) for k, (ph, z) in enumerate(zip(phis, zs))]
        ups = [G.normal(ph, z, 0.0) for ph, z in zip(phis, zs)]
        p.add(sweep(pts, ups, [w * (0.75 + 0.25 * k / 10) for k in range(11)], 0.0055, 12), "rust", smooth=True)
        # an ochre stripe near the end and a fringe
        k0 = 8
        p.add(sweep(pts[k0 - 1:k0 + 1], ups[k0 - 1:k0 + 1], w * 0.97 + 0.0005, 0.0062, 12), "ochre", smooth=True)
        end = pts[-1]
        tdir = (pts[-1] - pts[-2]).normalized()
        side = tdir.cross(ups[-1]).normalized()
        for j in range(7):
            q = end + side * (w * (j / 3 - 1) * 0.9)
            p.add(bm_tube([q - tdir * 0.002, q + tdir * 0.03], [0.0032, 0.002], 6), "rust_dark", smooth=True)


def body():
    p = Part("body")
    G.mesh(p, "coat", 64)
    # ochre rolled hem and a line of stitching above it
    G.hem(p, 0.19, 0.017, "ochre", n=64)
    G.stitch_ring(p, 0.226, matname="coat_thread")
    # wrap-front closure from the V down to the hem, with two buttons below the sash
    p.add(bm_tube([G.pt(-95, z, 0.003) for z in (0.19, 0.27, 0.35, 0.43, 0.53)], 0.004, 6), "coat_dark", smooth=True)
    stitch(p, [G.pt(-99, z, 0.003) for z in (0.215, 0.32, 0.42, 0.52)], "coat_thread")
    for z in (0.3, 0.385):
        G.button(p, -91, z, 0.015, "wood", 0.006)
    # back seam
    p.add(bm_tube([G.pt(90, z, 0.003) for z in (0.19, 0.3, 0.43)], 0.004, 6), "coat_dark", smooth=True)
    front(p)
    # pockets everywhere
    pocket(p, -57, 0.04, 0.585, 0.668, "teal")                                         # chest left, open: pencil
    pencil(p)
    pocket(p, -123, 0.04, 0.585, 0.668, "ochre", "rust", "wood")                       # chest right
    pocket(p, -62, 0.052, 0.232, 0.362, "rust", "teal")                                # lower left
    pocket(p, -118, 0.052, 0.232, 0.362, "teal", "ochre")                              # lower right
    rf = pocket(p, -20, 0.042, 0.25, 0.35, "ochre")                                    # side left, open: receipt
    receipt_roll(p, rf)
    pocket(p, -168, 0.042, 0.25, 0.35, "rust", "teal", "wood")                         # side right
    pocket(p, -150, 0.03, 0.53, 0.595, "plum", "ochre", "brass", flap_h=0.03)           # small ticket pocket
    pocket(p, 110, 0.05, 0.25, 0.35, "ochre", "rust", "wood")                          # back pockets
    pocket(p, 68, 0.045, 0.255, 0.345, "teal", "plum")
    # cloth patches
    cloth_patch(p, -90, 0.244, 0.072, 0.066, 7, "ochre")
    cloth_patch(p, 34, 0.56, 0.085, 0.09, -9, "teal")
    cloth_patch(p, 150, 0.29, 0.09, 0.08, 8, "rust")
    cloth_patch(p, 122, 0.6, 0.08, 0.07, 12, "plum")
    cloth_patch(p, 28, 0.305, 0.075, 0.085, -6, "rust")
    cloth_patch(p, -160, 0.62, 0.06, 0.06, -10, "ochre")
    sash(p)
    return p


# ---------------------------------------------------------------- head

NECK = 0.8
HD = vc.Head((0, 0, 1.065), 0.305, 0.282, 0.276)


LID = 0.013                    # the half-lid's lower edge, above the eye centre (covers the top third)


def eye(hp, s, lid=False):
    """House eye; with lid=True a clean skin half-lid over its top third and a fine lash line
    along the lid's lower edge (the knowing squint), as Lord Vane's smug eyes."""
    x, z, W, Hh = s * 0.098, 0.0, 0.03, 0.042
    HD.on_face(hp, "eye_dark", x, z, W, Hh, 0.012, out=0.0, u=28, v=16)
    HD.on_face(hp, "white", x + 0.009, z + (-0.004 if lid else 0.016), 0.008, 0.009, 0.004, out=0.01)
    if not lid:
        return
    p, n = HD.fpt(x, z, 0.0)
    fm = frame(p, n) @ M(rot=(0, 0, s * 4))
    X, Z = W * 1.32, 0.0152
    bm = sphere(36, 18)
    for v in bm.verts:
        co = Vector((v.co.x * X, v.co.y * 0.034 + 0.026, v.co.z * Z))
        co.y = max(co.y, LID)
        v.co = co
    hp.add(bm, "skin_tan", fm, smooth=True)
    lash = [fm @ Vector((X * 1.01 * math.cos(t), LID, Z * 1.04 * math.sin(t))) for t in [math.pi * (0.06 + 0.88 * k / 16) for k in range(17)]]
    hp.add(bm_tube(lash, 0.0028, 6), "eye_dark", smooth=True)
    o = lash[0] if s > 0 else lash[-1]                       # a little flick at the outer corner
    hp.add(bm_tube([o, o + fm.to_3x3() @ Vector((s * 0.008, 0.006, 0.0))], [0.0028, 0.0012], 6), "eye_dark", smooth=True)


# lopsided open grin: mouth-local u in [-1, 1] across, v in metres up; tilted up on his left
MC, MW, MT = (0.016, -0.138), 0.062, math.radians(8)


def mxz(u, v):
    x, z = u * MW, v
    return MC[0] + x * math.cos(MT) - z * math.sin(MT), MC[1] + x * math.sin(MT) + z * math.cos(MT)


def m_top(u):
    return 0.003 + 0.011 * u * u + 0.0025 * u


def m_bot(u):
    return m_top(u) - 0.034 * max(1 - u * u, 0.0) ** 0.65 * (1 + 0.12 * u)


def region(u0, u1, lo, hi):
    def fn(a, b):
        u = u0 + (u1 - u0) * a
        l, h = lo(u), hi(u)
        return mxz(u, l + (h - l) * b)
    return fn


def face_pillow(hp, mat, fn, nu, nv, h0, h1, flat=4):
    pillow(hp, mat, lambda u, v, o: HD.fpt(*fn(u, v), o)[0], lambda c: c - HD.hc, nu, nv, h0, h1, flat)


def grin(hp):
    face_pillow(hp, "mouth", region(-1, 1, m_bot, m_top), 28, 8, -0.003, 0.0012, 4)
    face_pillow(hp, "tongue", region(-0.5, 0.55, lambda u: m_bot(u) + 0.0012,
                                     lambda u: m_bot(u) + 0.0012 + max(0.014 * (1 - ((u - 0.025) / 0.525) ** 2), 0.0006)), 14, 5, -0.0015, 0.0022, 4)
    face_pillow(hp, "white", region(-0.78, 0.82, lambda u: m_top(u) - 0.0095, lambda u: m_top(u) - 0.0004), 22, 4, -0.001, 0.0027, 6)
    face_pillow(hp, "gold", region(0.3, 0.5, lambda u: m_top(u) - 0.0122, lambda u: m_top(u) - 0.0002), 6, 4, -0.0005, 0.0037, 4)


def brows(hp):
    for s, pts in ((1, ((0.06, 0.098, 0.017), (0.088, 0.111, 0.019), (0.118, 0.116, 0.018), (0.147, 0.109, 0.015), (0.169, 0.095, 0.0105))),
                   (-1, ((0.06, 0.083, 0.017), (0.088, 0.086, 0.018), (0.118, 0.087, 0.017), (0.147, 0.082, 0.014), (0.168, 0.074, 0.0095)))):
        els = []
        for (x0, z0, v0), (x1, z1, v1) in zip(pts, pts[1:]):
            for k in range(4):
                t = k / 4
                els.append((HD.fpt(s * (x0 + (x1 - x0) * t), z0 + (z1 - z0) * t, 0.01)[0], (v0 + (v1 - v0) * t) * 0.92))
        els.append((HD.fpt(s * pts[-1][0], pts[-1][1], 0.01)[0], pts[-1][2] * 0.92))
        hp.add(meta(els, 0.005), "hair", None, smooth=True)


def ffront(phi):
    """Degrees away from the front centre (0 front, 90 side, 180 back)."""
    return abs(((phi + 90 + 180) % 360) - 180)


def hair_lower(f):
    if f < 40:
        return 0.135 + 0.0004 * f
    if f < 62:
        return 0.151 + (0.05 - 0.151) * (f - 40) / 22
    if f < 104:
        return 0.046
    if f < 125:
        return 0.046 + (-0.12 - 0.046) * (f - 104) / 21
    return -0.12


def hair(hp):
    """Dark hair slicked straight back under the cap: a smooth shell with combed ridges,
    a little duck-tail at the nape and pointed sideburns."""
    els = []
    for i in range(36):
        phi = -180 + 10 * i
        f = ffront(phi)
        for j in range(17):
            z = -0.12 + 0.023 * j
            if z >= hair_lower(f) - 1e-6:
                els.append((HD.spt(phi, z, -0.016)[0], 0.032))
    els.append((HD.H(0, 0, HD.c - 0.03), 0.04))
    # a dense row along the hairline so its edge is one clean curve
    for i in range(90):
        phi = -180 + 4 * i
        f = ffront(phi)
        els.append((HD.spt(phi, hair_lower(f) + 0.004, -0.015)[0], 0.029))
    for s in (-1, 1):
        for k in range(3):
            f0 = 8 + 14 * k
            z0 = 0.152 + 0.004 * k
            z1 = -0.05 - 0.02 * k
            for q in range(18):
                t = q / 17
                f = f0 + (165 - f0) * t
                els.append((HD.spt(-90 + s * f, z0 + (z1 - z0) * t ** 1.3, -0.008)[0], 0.02))
        for f, z, v in ((59, 0.05, 0.03), (66, 0.05, 0.031), (73, 0.05, 0.03), (62.5, 0.022, 0.027), (69.5, 0.022, 0.027),
                        (65.5, -0.004, 0.023), (65, -0.022, 0.017)):          # a short wedge-shaped sideburn
            els.append((HD.spt(-90 + s * f, z, -0.012)[0], v))
    for k in range(6):
        f = 125 + 11 * k
        for s in (-1, 1):
            els.append((HD.spt(-90 + s * f, -0.115, -0.002)[0], 0.028))
    hb = meta(els, 0.008, 2.0)
    prot = sorted(math.sqrt(((v.co.x - HD.hc.x) / HD.a) ** 2 + ((v.co.y - HD.hc.y) / HD.b) ** 2 + ((v.co.z - HD.hc.z) / HD.c) ** 2) for v in hb.verts)
    print("MERCHANT hair ratio p50 %.3f p95 %.3f max %.3f" % (prot[len(prot) // 2], prot[int(len(prot) * 0.95)], prot[-1]))
    hp.add(hb, "hair", None, smooth=True)
    # pointed goatee
    gt = [(HD.fpt(0, -0.195, -0.006)[0], 0.02), (HD.fpt(0, -0.222, -0.004)[0], 0.026), (HD.fpt(0, -0.245, -0.002)[0], 0.026),
          (HD.H(0, -0.138, -0.262), 0.021), (HD.H(0, -0.148, -0.282), 0.015), (HD.H(0, -0.154, -0.298), 0.009),
          (HD.H(0, -0.157, -0.31), 0.0045)]
    for s in (-1, 1):
        gt += [(HD.fpt(s * 0.018, -0.215, -0.006)[0], 0.02), (HD.fpt(s * 0.016, -0.24, -0.004)[0], 0.02)]
    hp.add(meta(gt, 0.006), "hair", None, smooth=True)


# ---------------------------------------------------------------- the cap

CAP_O = HD.hc + Vector((0.0, 0.005, 0.085))
CAP_R = Matrix.Rotation(math.radians(-5), 3, "Y") @ Matrix.Rotation(math.radians(-16), 3, "X")
INFL = 0.032            # hair thickness the cap has to clear
BAND_H = 0.068
CAP_TOP = 0.42
SLOUCH = Vector((-0.02, 0.085))
FEATHER_LEAN = 0.6
FEATHER_BACK = (0.45, 1.0, 0.0)


def fit(phi, h, infl=INFL):
    """Distance from the cap axis (at height h) to the head + hair along angle phi (radians)."""
    P0 = CAP_O + CAP_R @ Vector((0, 0, h)) - HD.hc
    D = CAP_R @ Vector((math.cos(phi), math.sin(phi), 0))
    A, B, C = HD.a + infl, HD.b + infl, HD.c + infl
    qa = (D.x / A) ** 2 + (D.y / B) ** 2 + (D.z / C) ** 2
    qb = 2 * (P0.x * D.x / A ** 2 + P0.y * D.y / B ** 2 + P0.z * D.z / C ** 2)
    qc = (P0.x / A) ** 2 + (P0.y / B) ** 2 + (P0.z / C) ** 2 - 1
    disc = qb * qb - 4 * qa * qc
    if disc < 0:
        return 0.0
    return max((-qb + math.sqrt(disc)) / (2 * qa), 0.0)


def cpt(phi, h, r, slouch=True):
    s = max(h - BAND_H, 0.0) / (CAP_TOP - BAND_H) if slouch else 0.0
    return CAP_O + CAP_R @ Vector((r * math.cos(phi) + SLOUCH.x * s * s, r * math.sin(phi) + SLOUCH.y * s * s, h))


def cap_surface(part, mat, rows, segs=128, pole=None):
    """rows: [(h, rfn(phi))] bottom to top; pole: height of a closing top vertex."""
    bm = bmesh.new()
    rings = [[bm.verts.new(cpt(2 * math.pi * i / segs, h, rf(2 * math.pi * i / segs))) for i in range(segs)] for h, rf in rows]
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if pole is not None:
        pv = bm.verts.new(cpt(0, pole, 0.0))
        for i in range(segs):
            bm.faces.new((rings[-1][i], rings[-1][(i + 1) % segs], pv))
    part.add(bm, mat, smooth=True)


def dome(h):
    """Crown radius: full above the band, tapering as it rises, then a rounded top."""
    Rm, h0, hr = 0.35, 0.12, 0.62
    if h <= h0:
        return Rm
    t = (h - h0) / (CAP_TOP - h0)
    r = Rm * (1 - 0.3 * t ** 1.3)
    if t > hr:
        r *= math.sqrt(max(0.0, 1 - ((t - hr) / (1 - hr)) ** 2))
    return r


def crown_r(phi, h):
    base = fit(phi, BAND_H) + 0.008
    s = min(max((h - 0.06) / 0.07, 0.0), 1.0)
    s = s * s * (3 - 2 * s)
    r = base * (1 - s) + dome(h) * s
    r *= 1 + 0.04 * s * (abs(math.sin(4 * (phi + 0.2))) ** 0.5 - 0.6)
    return max(r, fit(phi, h) + 0.008)


def catmull(pts, n=6):
    """Smooth Catmull-Rom curve through pts (n samples per span)."""
    P = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    return out


def feather(m, scale=1.0, mat="feather_red", bar="feather_bar"):
    """Long plume on matrix m, returned as its own Part. The quill rises up local Z and sweeps
    back along local Y to a soft curled tip; the broad vane spans local X (its flat faces look
    along -Y/+Y at the base), asymmetric like a real feather (narrow inner side, -X).
    A pale quill ridge runs down the middle and soft darker bars cross both faces."""
    fp = Part("feather")
    key = [Vector(v) * scale for v in ((0, 0, 0), (0, -0.004, 0.07), (0, 0.0, 0.15), (0, 0.028, 0.23), (0, 0.075, 0.3), (0, 0.14, 0.355),
                                       (0, 0.215, 0.388), (0, 0.29, 0.396), (0, 0.35, 0.38), (0, 0.388, 0.35), (0, 0.398, 0.318), (0, 0.384, 0.298))]
    q = catmull(key, 6)
    n = len(q)
    T = [k / (n - 1) for k in range(n)]
    w = [scale * (0.004 + 0.052 * math.sin(math.pi * min(t / 0.34, 1.0) * 0.5) * (1 - max(t - 0.34, 0.0) / 0.66) ** 0.7) for t in T]
    w[-1] = 0.003 * scale
    th = [scale * (0.0055 - 0.003 * t) for t in T]
    X = Vector((1, 0, 0))
    OFF = 0.3                                              # vane centre shifted outward: 1.3 w outer, 0.7 w inner
    vc_pts = [q[k] + X * (OFF * w[k]) for k in range(n)]
    fp.add(sweep(vc_pts, X, th, w, 16), mat, m, smooth=True)
    # pale quill ridge standing proud of both faces, and the bare calamus at the base
    fp.add(bm_tube(q, [th[k] + scale * (0.0024 - 0.0016 * T[k]) for k in range(n)], 10), "quill", m, smooth=True)
    fp.add(bm_tube([q[0] + Vector((0, 0.0, 0.012)) * scale, q[0] - Vector((0, 0.0, 0.035)) * scale], 0.0058 * scale, 10), "quill", m, smooth=True)
    # soft bars on both faces, angled toward the tip
    for t0 in (0.2, 0.31, 0.42, 0.53, 0.64, 0.75):
        i = int(t0 * (n - 1))
        d = (q[i + 1] - q[i - 1]).normalized()
        nrm = d.cross(X).normalized()
        for s2 in (-1, 1):
            reach = (1 + OFF) if s2 > 0 else (1 - OFF)
            for sx in (-1, 1):
                pts = []
                for k in range(8):
                    f = 0.12 + 0.84 * k / 7
                    xo = s2 * reach * w[i] * f
                    u = (xo - OFF * w[i]) / w[i]
                    tt = th[i] * math.sqrt(max(1 - u * u, 0.0)) + 0.0004 * scale
                    pts.append(q[i] + d * (0.03 * scale * f) + X * xo + nrm * (sx * tt))
                fp.add(sweep(pts, nrm, 0.0048 * scale, 0.0006 * scale, 8), bar, m, smooth=True)
    return fp


def cap(hp):
    band_rows = [(0.016, lambda ph: fit(ph, 0.016) - 0.012), (0.001, lambda ph: fit(ph, 0.001) + 0.001),
                 (-0.002, lambda ph: fit(ph, -0.002) + 0.007), (0.003, lambda ph: fit(ph, 0.003) + 0.0115),
                 (0.013, lambda ph: fit(ph, 0.013) + 0.0138), (0.035, lambda ph: fit(ph, 0.035) + 0.0142),
                 (0.057, lambda ph: fit(ph, 0.057) + 0.0138), (0.067, lambda ph: fit(ph, 0.067) + 0.0118),
                 (0.071, lambda ph: fit(ph, 0.071) + 0.004)]
    cap_surface(hp, "plum_dark", band_rows)
    hs = [0.056, 0.064] + [0.072 + (CAP_TOP - 0.084) * k / 30 for k in range(31)]
    cap_surface(hp, "plum", [(h, (lambda ph, h=h: crown_r(ph, h))) for h in hs], pole=CAP_TOP)
    # band stitching and gore seams
    for h in (0.017, 0.051):
        for a0 in (0, math.pi):
            stitch(hp, [cpt(a0 + math.pi * k / 40, h, fit(a0 + math.pi * k / 40, h) + 0.0152) for k in range(41)], "plum_thread", 0.012, 0.007, 0.0022)
    for k in range(8):
        ph = -0.2 + k * math.pi / 4
        stitch(hp, [cpt(ph, h, crown_r(ph, h) + 0.0016) for h in [0.1 + 0.25 * j / 16 for j in range(17)]], "plum_thread", 0.012, 0.007, 0.0022)
    # covered button on top
    hp.add(sphere(24, 12), "plum_dark", frame(cpt(0, CAP_TOP, 0.0), CAP_R @ Vector((0, 0, 1))) @ S(0.03, 0.03, 0.016), smooth=True)
    # stiff peak at the front: top and underside sheets, a piped rim, two rows of stitching
    a0, a1 = math.radians(-145), math.radians(-35)
    nphi, nt = 44, 8

    def ext(ph):
        x = (math.degrees(ph) + 90) / 55.0
        return 0.1 * max(math.cos(x * math.pi / 2), 0.0) ** 0.55 + 0.004

    def bpt(ph, t, dz=0.0):
        return cpt(ph, 0.006 - 0.04 * t ** 1.3 + dz, fit(ph, 0.006) + 0.006 + ext(ph) * t, slouch=False)

    up = CAP_R @ Vector((0, 0, 1))
    for dz, mat, sgn in ((0.0, "plum", 1), (-0.009, "plum_dark", -1)):
        bm = bmesh.new()
        g = [[bm.verts.new(bpt(a0 + (a1 - a0) * i / nphi, j / nt, dz)) for j in range(nt + 1)] for i in range(nphi + 1)]
        for i in range(nphi):
            for j in range(nt):
                bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
        bm.normal_update()
        bm.faces.ensure_lookup_table()
        if bm.faces[len(bm.faces) // 2].normal.dot(up) * sgn < 0:
            bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
        hp.add(bm, mat, smooth=True)
    hp.add(bm_tube([bpt(a0 + (a1 - a0) * i / nphi, 1.0, -0.0045) for i in range(nphi + 1)], 0.0056, 10), "plum_dark", smooth=True)
    for t in (0.42, 0.78):
        stitch(hp, [bpt(a0 + (a1 - a0) * (0.1 + 0.8 * i / 30), t, 0.0016) for i in range(31)], "plum_thread", 0.011, 0.007, 0.002)
    # long red feather tucked in the band on his left front, swept up and back, a gold coin brooch over its quill
    fph = math.radians(-28)
    base = cpt(fph, 0.03, fit(fph, 0.03) + 0.004, slouch=False)
    # the vane's flat side faces the front three-quarter view (his right-front): the plume sweeps
    # back and a little out to his left, leaning out from the crown
    outw = CAP_R @ Vector((math.cos(fph), math.sin(fph), 0))
    Zf = (Vector((0, 0, 1)) + outw * FEATHER_LEAN).normalized()
    Yf = Vector(FEATHER_BACK)
    Yf = (Yf - Zf * Yf.dot(Zf)).normalized()
    Xf = Yf.cross(Zf)
    rot = Matrix((Xf, Yf, Zf)).transposed().to_4x4()
    fp = feather(Matrix.Translation(base) @ rot, 1.32)
    inside = 0
    for v in fp.bm.verts:
        lc = CAP_R.inverted() @ (v.co - CAP_O)
        if 0.06 < lc.z < CAP_TOP:
            sl = max(lc.z - BAND_H, 0.0) / (CAP_TOP - BAND_H)
            x, y = lc.x - SLOUCH.x * sl * sl, lc.y - SLOUCH.y * sl * sl
            if math.hypot(x, y) < crown_r(math.atan2(y, x), lc.z) - 0.001:
                inside += 1
    print("MERCHANT feather verts inside the crown: %d of %d" % (inside, len(fp.bm.verts)))
    hp.merge(fp)
    nrm = CAP_R @ Vector((math.cos(fph), math.sin(fph), 0))
    bpos = cpt(fph, 0.032, fit(fph, 0.032) + 0.019, slouch=False)
    bmx = frame(bpos, nrm)
    coin(hp, bmx, 0.022, 0.006)
    hp.add(sphere(20, 12), "teal", bmx @ Matrix.Translation((0, 0, 0.0035)) @ S(0.0085, 0.0085, 0.0045), smooth=True)


def head():
    hp = Part("head")
    HD.skull(hp, "skin_tan")
    HD.ears(hp, "skin_tan")
    eye(hp, 1)
    eye(hp, -1, lid=True)
    HD.blush(hp)
    HD.nose(hp, "nose_tan")
    grin(hp)
    brows(hp)
    hair(hp)
    cap(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

def elbow_patch(p, side, pv, d):
    """Square cloth patch with a running stitch on the outer back of each sleeve."""
    n0 = Vector((side * 0.85, 0.5, 0.0))
    n = (n0 - d * n0.dot(d)).normalized()
    em = frame(pv + d * 0.12 + n * 0.071, n) @ M(rot=(0, 0, side * 8))
    p.add(bm_box(0.07, 0.08, 0.012, bevel=0.0045, segs=3), "rust" if side > 0 else "teal", em, smooth=True)
    pts = [em @ Vector((x, y, 0.0062)) for x, y in ((-0.026, 0.031), (-0.026, -0.031), (0.026, -0.031), (0.026, 0.031), (-0.026, 0.031))]
    pts = [polyline_at(pts, plen(pts) * k / 40) for k in range(41)]
    stitch(p, pts, "stitch_light", 0.01, 0.006, 0.0021)


CFG = dict(
    neck_z=NECK, shoulder_x=0.182, shoulder_z=0.695, hip_x=0.09, hip_z=0.36,
    arm_len=0.27, arm_pose={1: (30, 34), -1: (12, 6)},     # the purse hand held out a little to the side and front
    sleeve_r=0.07, sleeve_mat="coat", cuff_mat="ochre", stitch_mat="coat_thread", arm_fn=elbow_patch, hand_mat="skin_tan",
    leg_r=0.06, pants_mat="trousers", boot_mat="boot", boot_top=0.21, boot_trim="boot_dark",
)


# ---------------------------------------------------------------- prop: the coin purse

def purse():
    p = Part("purse")
    g = vc.hand_c(1, CFG)
    PS = 1.22
    c = g + Vector((0.004, -0.008, -0.255))
    PM = Matrix.Translation(c) @ M(rot=(0, 0, 22)) @ S(PS)

    def L(x, y, z):
        return PM @ Vector((x, y, z))

    YS = 0.92
    prof = [(0.012, -0.0795), (0.028, -0.077), (0.05, -0.069), (0.068, -0.052), (0.079, -0.027), (0.082, 0.0), (0.078, 0.024),
            (0.067, 0.046), (0.051, 0.064), (0.037, 0.077), (0.031, 0.087), (0.033, 0.095), (0.041, 0.103), (0.051, 0.11), (0.057, 0.114)]
    PG = vc.Garment(prof)

    def pleat_k(z):
        if z < 0.02:
            return 0.0
        if z < 0.062:
            return (z - 0.02) / 0.042
        if z < 0.092:
            return 0.35
        return 1.0

    def rf(a, z):
        return 0.0055 * pleat_k(z) * (0.5 + 0.5 * math.cos(12 * a)) + 0.003 * math.sin(3 * a + 0.6) * max(0.0, 1 - abs(z) / 0.05)

    p.add(lathe(prof, 72, rfun=rf, ys=YS, cap_bottom=True), "leather", PM, smooth=True)
    inner = [(r - 0.0035, z) for r, z in prof[10:]]
    ib = lathe(inner, 72, rfun=rf, ys=YS)
    bmesh.ops.reverse_faces(ib, faces=ib.faces[:])
    p.add(ib, "purse_inside", PM, smooth=True)
    rim = [L((0.0553 + rf(a, 0.114)) * math.cos(a), YS * (0.0553 + rf(a, 0.114)) * math.sin(a), 0.114)
           for a in [2 * math.pi * k / 72 for k in range(73)]]
    p.add(bm_tube(rim, 0.0036, 8, cap=False), "leather", smooth=True)
    p.add(sphere(24, 8), "purse_inside", PM @ Matrix.Translation((0, 0, 0.09)) @ S(0.031, 0.031 * YS, 0.004), smooth=True)
    # leather neck band with brass eyelets, and the drawstring threaded round it
    band = [(PG.rad(z) + 0.0062 + 0.0055 * pleat_k(z), z) for z in (0.07, 0.074, 0.081, 0.088, 0.092)]
    band[0] = (band[0][0] - 0.004, band[0][1])
    band[-1] = (band[-1][0] - 0.004, band[-1][1])
    p.add(lathe(band, 48, ys=YS), "leather_dark", PM, smooth=True)
    br = band[2][0]
    for k in range(8):
        a = 2 * math.pi * (k + 0.5) / 8
        e = L(br * math.cos(a), YS * br * math.sin(a), 0.081)
        en = (PM.to_3x3() @ Vector((math.cos(a), math.sin(a) / YS, 0))).normalized()
        p.add(bm_tube(ring_pts(frame(e, en), 0.0052, 12, 0.001), 0.0017, 6, cap=False), "brass", smooth=True)
    cr = br + 0.0035
    p.add(bm_tube([L(cr * math.cos(a), YS * cr * math.sin(a), 0.0815) for a in [2 * math.pi * k / 48 for k in range(49)]], 0.0034, 8, cap=False),
          "drawstring", smooth=True)
    # two cord strands up into the fist
    for a in (math.radians(-62), math.radians(-118)):
        s0 = L(cr * math.cos(a), YS * cr * math.sin(a), 0.0815)
        p.add(bm_tube(vc.bezier(s0, s0 + Vector((0, 0, 0.09)), g + Vector((0, 0, -0.012)), 10), 0.0038, 8), "drawstring", smooth=True)
    # cord ends dangling out of the fist with wooden beads and tassels
    for off, drop in (((0.04, -0.03, -0.02), 0.052), ((0.045, -0.006, -0.025), 0.038)):
        a = g + Vector(off)
        b = g + Vector((off[0] + 0.03, off[1] - 0.006, -drop))
        cord = vc.bezier(a, a + Vector((0.024, -0.003, -0.004)), b, 8)
        p.add(bm_tube(cord, 0.0034, 8), "drawstring", smooth=True)
        p.add(sphere(16, 12), "wood", M(b + Vector((0, 0, -0.006)), scale=(0.0105, 0.0105, 0.0115)), smooth=True)
        for j in range(6):
            t = 2 * math.pi * j / 6
            q = b + Vector((0.004 * math.cos(t), 0.004 * math.sin(t), -0.016))
            p.add(bm_tube([q, q + Vector((0.0015 * math.cos(t), 0.0015 * math.sin(t), -0.024))], [0.0018, 0.0012], 5), "drawstring", smooth=True)
    # stitched side seams, a stitched base ring, and a stitched leather roundel with a brass coin medallion on the front
    for a0 in (0.0, math.pi):
        pts = []
        for k in range(11):
            z = -0.062 + 0.098 * k / 10
            r = PG.rad(z) + rf(a0, z) + 0.0015
            pts.append(L(r * math.cos(a0), YS * r * math.sin(a0), z))
        stitch(p, pts, "stitch_light", 0.01, 0.006, 0.0022)
        p.add(bm_tube([L((PG.rad(z) + rf(a0, z)) * math.cos(a0), YS * (PG.rad(z) + rf(a0, z)) * math.sin(a0), z) for z in
                       [-0.07 + 0.11 * k / 10 for k in range(11)]], 0.0028, 6), "leather_dark", smooth=True)
    z = -0.063
    rr = PG.rad(z) + 0.0015
    stitch(p, [L(rr * math.cos(a), YS * rr * math.sin(a), z) for a in [2 * math.pi * k / 48 for k in range(49)]], "stitch_light", 0.01, 0.006, 0.0022)
    af = math.radians(-90)
    rp = PG.rad(0.0) + rf(af, 0.0)
    fm = frame(L(rp * math.cos(af), YS * rp * math.sin(af), -0.004), PM.to_3x3() @ Vector((0, -1, 0)))
    p.add(sphere(32, 12), "leather_light", fm @ S(0.03, 0.03, 0.006), smooth=True)
    stitch(p, ring_pts(fm, 0.025, 36, 0.0045), "stitch_dark", 0.009, 0.005, 0.0019)
    coin(p, fm @ Matrix.Translation((0, 0, 0.007)), 0.0165, 0.005, "brass")
    # gold coins peeking out of the open mouth
    for pos, rot in (((0.013, -0.012, 0.114), (62, 0, 18)), ((-0.017, 0.004, 0.112), (55, 12, -35)),
                     ((0.002, 0.017, 0.109), (72, 0, 80)), ((-0.004, -0.008, 0.121), (16, -10, 0))):
        coin(p, PM @ M(pos, rot))
    # how close does it come to the coat? (positive = clear)
    gap = min(math.sqrt(v.co.x ** 2 + (v.co.y / G.ys) ** 2) - G.rad(v.co.z) for v in p.bm.verts)
    print("MERCHANT purse clearance from coat (radial, m): %.4f   grip %s" % (gap, tuple(round(x, 3) for x in g)))
    return p, g


CFG.update(body=body, head=head, props=[("purse", "arm_l", purse)], closeup_z=1.04,
           shots=[("purse", tuple(vc.hand_c(1, CFG) + Vector((0, 0, -0.15))), -40, 10, 0.95),
                  ("back", (0, 0, 0.78), 165, 8, 2.8), ("side", (0, 0, 1.0), -85, 4, 2.4)])


def main():
    return vc.build("merchant", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
