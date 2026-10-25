"""Mayor Thistle, in the soft Animal Crossing style of Marlo the fisher (2026-10-23).
Round, elderly and jolly: the roundest villager, important but kindly. A double-breasted plum
coat with gold buttons (thread holes), dark plum cuffs, front edge, collar and hem trim with gold
braid, flap pockets and a back half-belt; a gold chain of office (flat plaques and links) across
the shoulders with a big medallion (beaded, engraved rim and an enamel thistle emblem); a white
shirt collar and jabot; a soft plum-dark chaperon hat (a quilted padded roll seated on the head,
a gathered crown slumping to his right and a tail hanging over his left shoulder); white side
hair, very bushy white brows and a big curled white moustache (metaballs); rosy cheeks; ankle
shoes with gold buckles.
Prop: `cane` (arm_r): a polished dark cane with a brass knob handle and collar, two growth
nodes, and a brass ferrule with an iron tip that just touches the ground, held out to his side.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import bmesh
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe
from villagers_common import frame, S, sphere, lathe, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "plum": "#7E4F78", "plum_dark": "#4E2F4A", "plum_thread": "#C29BB9",
    "hat": "#61395B", "hat_dark": "#4A2B46", "hat_crease": "#331D30",
    "gold_dark": "#A07A2C", "hair_white": "#F0EBE1", "blush_rosy": "#EE8F87",
    "enamel_cream": "#F2E8D0", "thistle": "#9B5FAA", "thistle_dark": "#73407F",
    "thistle_leaf": "#618C4F", "thistle_leaf_dark": "#46693A",
    "cane_wood": "#5C3424", "cane_dark": "#3D2217", "shoe": "#3B2A27", "shirt": "#F5F1E8",
}, metal={"gold_dark": (0.72, 0.38)}, gloss={"cane_wood": 0.28, "shoe": 0.4, "enamel_cream": 0.25, "thistle": 0.3})


# ---------------------------------------------------------------- local helpers

def basis(p, t, n):
    """Matrix at p with local Z = n, local Y = t (orthogonalised), local X = t x n."""
    n = Vector(n).normalized()
    t = (Vector(t) - n * Vector(t).dot(n)).normalized()
    x = t.cross(n)
    m = Matrix((x, t, n)).transposed().to_4x4()
    m.translation = Vector(p)
    return m


def gnorm(G, phi, z):
    """True outward normal of a Garment lathe (uses the profile slope, unlike Garment.normal)."""
    dz = 0.01
    dr = (G.rad(z + dz) - G.rad(z - dz)) / (2 * dz)
    a = math.radians(phi)
    return Vector((math.cos(a), math.sin(a) / G.ys, -dr)).normalized()


def panel(G, p, phi0, phi1, z0, z1, matname, out=0.007, segs=8, nz=16):
    """Like Garment.panel but with nz rings so long panels follow the curved coat instead of sinking in."""
    prof = [(G.rad(z0 + (z1 - z0) * k / nz) + out, z0 + (z1 - z0) * k / nz) for k in range(nz + 1)]
    p.add(bm_lathe(prof, segs, arc=(phi0, phi1)), matname, M(scale=(1, G.ys, 1)), smooth=True)


def sweep(pts, radii, refs, segs=16, closed=False, cap=True):
    """Tube along pts whose cross-section is oriented by refs (one vector per point): radii are
    r or (half-width, half-thickness), the thickness running along ref. No twist, can be closed."""
    bm = bmesh.new()
    pts = [Vector(p) for p in pts]
    n = len(pts)
    rings = []
    for i, p in enumerate(pts):
        if closed:
            t = pts[(i + 1) % n] - pts[(i - 1) % n]
        else:
            t = pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]
        t.normalize()
        o = Vector(refs[i])
        o = (o - t * o.dot(t)).normalized()
        s = t.cross(o)
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        rw, rt = (r, r) if isinstance(r, (int, float)) else r
        rings.append([bm.verts.new(p + s * (rw * math.cos(2 * math.pi * k / segs)) + o * (rt * math.sin(2 * math.pi * k / segs)))
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


# ---------------------------------------------------------------- body (coat)

COAT = vc.Garment([(0.25, 0.19), (0.266, 0.215), (0.287, 0.26), (0.318, 0.34), (0.331, 0.42), (0.327, 0.5), (0.304, 0.58),
                   (0.266, 0.65), (0.22, 0.705), (0.17, 0.75), (0.12, 0.785), (0.075, 0.815), (0.042, 0.832)], ys=0.88)


def coat_gap(v):
    """Approximate distance from a point to the coat surface (positive outside)."""
    if v.z < 0.17 or v.z > 0.84:
        return 1.0
    rho = math.sqrt(v.x ** 2 + (v.y / COAT.ys) ** 2)
    return (rho - COAT.rad(v.z)) * COAT.ys


def chain_z(phi):
    f = (1 + math.cos(math.radians(phi + 90))) / 2          # 1 at the front centre, 0 at the back
    return 0.768 - 0.13 * f ** 3


def chain(p, G):
    """Chain of office: flat gold plaques joined by small links, lying on the coat over the
    shoulders and dipping to the front, where a bail carries the medallion."""
    path = []
    for k in range(361):
        phi = -90 + k
        path.append(G.pt(phi, chain_z(phi), 0.011))
    L = plen(path)
    s, i = 0.03, 0
    while s < L - 0.03:
        c = polyline_at(path, s)
        t = polyline_at(path, s + 0.004) - polyline_at(path, s - 0.004)
        phi = -90 + 360.0 * s / L
        n = gnorm(G, phi, chain_z(phi))
        if i % 2 == 0:
            m = basis(c, t, n)
            p.add(sphere(16, 10), "gold", m @ Matrix.Translation((0, 0, 0.002)) @ S(0.0085, 0.0125, 0.0042), smooth=True)
            p.add(sphere(10, 6), "gold_dark", m @ Matrix.Translation((0, 0, 0.0055)) @ S(0.0032, 0.0032, 0.0016), smooth=True)
        else:
            m = basis(c, n, t.cross(n))            # ring plane = tangent and normal: an edge-on link
            p.add(bm_tube(ring_pts(m, 0.0075, 14), 0.0024, 6, cap=False), "gold", smooth=True)
        s += 0.0215
        i += 1
    # bail at the front: an upright ring from the chain's lowest point down to the medallion
    c = G.pt(-90, chain_z(-90) - 0.004, 0.016)
    m = basis(c, Vector((0, 0, 1)), gnorm(G, -90, chain_z(-90)))
    p.add(bm_tube(ring_pts(m @ M(rot=(0, 90, 0)), 0.012, 20), 0.0034, 8, cap=False), "gold", smooth=True)


def medallion(p, G):
    """Big medallion resting on the belly: raised beaded rim, an engraved groove, a cream enamel
    field and a thistle (purple tuft, green calyx with cross-hatching, stem and two leaves)."""
    z = 0.562
    n = gnorm(G, -90, z)
    up = Vector((0, 0, 1))
    m = basis(G.pt(-90, z, 0.004), up, n)
    p.add(lathe([(0.056, 0.0), (0.0615, 0.004), (0.063, 0.009), (0.06, 0.0145), (0.054, 0.0155), (0.0495, 0.012), (0.0465, 0.0095)],
                64, cap_bottom=True, cap_top=True), "gold", m, smooth=True)
    for k in range(30):                                            # beaded rim
        a = 2 * math.pi * k / 30
        p.add(sphere(8, 6), "gold", m @ Matrix.Translation((0.0545 * math.cos(a), 0.0545 * math.sin(a), 0.0152)) @ S(0.0032), smooth=True)
    p.add(bm_tube(ring_pts(m, 0.0462, 48, 0.0108), 0.0012, 5, cap=False), "gold_dark", smooth=True)    # engraved groove
    p.add(sphere(40, 10), "enamel_cream", m @ Matrix.Translation((0, 0, 0.0105)) @ S(0.0435, 0.0435, 0.0022), smooth=True)
    # the thistle, standing on the field (local +Y is up)
    e = m @ Matrix.Translation((0, 0.0, 0.0125))
    p.add(sphere(20, 12), "thistle_leaf", e @ Matrix.Translation((0, -0.002, 0)) @ S(0.0115, 0.0125, 0.0035), smooth=True)
    for sgn in (-1, 1):
        for off in (-0.005, 0.0, 0.005):
            a = [e @ Vector((sgn * (-0.009) + off, -0.011, 0.0032)), e @ Vector((sgn * 0.009 + off, 0.007, 0.0032))]
            a = [a[0].lerp(a[1], 0.12), a[0].lerp(a[1], 0.88)]
            p.add(bm_tube(a, 0.0008, 4), "thistle_leaf_dark", smooth=True)
    p.add(bm_tube([e @ Vector((-0.011, 0.0095, 0.002)), e @ Vector((0.011, 0.0095, 0.002))], 0.0022, 8), "gold", smooth=True)
    for k in range(9):                                             # the purple tuft fanning up
        a = math.radians(40 + 100 * k / 8)
        b = e @ Vector((0.006 * math.cos(a), 0.011 + 0.002 * math.sin(a), 0.002))
        tip = e @ Vector((0.021 * math.cos(a), 0.012 + 0.017 * math.sin(a), 0.002))
        p.add(bm_tube([b, tip], [0.0026, 0.0011], 6), "thistle" if k % 2 else "thistle_dark", smooth=True)
    p.add(bm_tube([e @ Vector((0, -0.013, 0.0015)), e @ Vector((0.001, -0.026, 0.0015)), e @ Vector((0.0, -0.036, 0.0015))], 0.0021, 6),
          "thistle_leaf", smooth=True)
    for sgn in (-1, 1):
        lm = e @ Matrix.Translation((sgn * 0.011, -0.026, 0.0012)) @ M(rot=(0, 0, sgn * 35))
        p.add(sphere(16, 8), "thistle_leaf", lm @ S(0.012, 0.0045, 0.0018), smooth=True)
        for k in (-1, 0, 1):                                       # little spines on the leaf
            q = lm @ Vector((k * 0.007, 0.0045, 0.0))
            p.add(bm_tube([q, q + (lm.to_3x3() @ Vector((0.0, 0.004, 0.0)))], [0.0012, 0.0004], 4), "thistle_leaf", smooth=True)


def flap_pocket(p, G, pc, hw, z):
    """Flap pocket: a welt line, a dark flap with stitching and a small gold button."""
    p.add(bm_tube(G.arc(pc - hw, pc + hw, z, 0.004, 10), 0.0035, 6), "plum_dark", smooth=True)
    G.panel(p, pc - hw, pc + hw, z - 0.055, z, "plum_dark", 0.007, 10)
    p.add(bm_tube(G.arc(pc - hw, pc + hw, z - 0.055, 0.009, 10), 0.0045, 6), "plum_dark", smooth=True)
    stitch(p, [G.pt(pc - hw + 2.5, z - 0.004, 0.0095)] + G.arc(pc - hw + 2.5, pc + hw - 2.5, z - 0.047, 0.0095, 12)
           + [G.pt(pc + hw - 2.5, z - 0.004, 0.0095)], "plum_thread", 0.011, 0.007, 0.0022)
    G.button(p, pc, z - 0.033, 0.012, "gold", out=0.011, holes="plum_dark")


def body():
    p = Part("body")
    G = COAT
    G.mesh(p, "plum", segs=72)
    # hem: a dark trim band, a rolled edge, a line of gold braid and stitching above it
    panel(G, p, -180, 180, 0.19, 0.24, "plum_dark", 0.004, 72, 6)
    G.hem(p, 0.198, 0.017, "plum_dark", n=72)
    G.hem(p, 0.243, 0.0045, "gold", out=0.006, n=72)
    G.stitch_ring(p, 0.262, matname="plum_thread")
    # double-breasted front: the overlapping edge in dark trim with a stitch line, gold buttons
    panel(G, p, -62, -55, 0.19, 0.745, "plum_dark", 0.006, 4, 40)
    p.add(bm_tube(G.line(-55, 0.2, 0.745, 0.008, 16), 0.0045, 6), "plum_dark", smooth=True)
    stitch(p, G.line(-66, 0.27, 0.73, 0.008, 16), "plum_thread")
    for z in (0.3, 0.385, 0.47):
        for phi in (-73, -107):
            G.button(p, phi, z, 0.0175, "gold", out=0.009, holes="plum_dark")
    for phi in (-69, -111):
        G.button(p, phi, 0.56, 0.0155, "gold", out=0.009, holes="plum_dark")
    # flap pockets on the hips
    for pc in (-140, -36):
        flap_pocket(p, G, pc, 13, 0.36)
    # back: a centre seam with a vent, a dark half-belt and two gold buttons
    p.add(bm_tube(G.line(90, 0.2, 0.7, 0.003, 14), 0.0035, 6), "plum_dark", smooth=True)
    stitch(p, G.line(84, 0.21, 0.33, 0.006, 6), "plum_thread")
    G.panel(p, 58, 122, 0.45, 0.5, "plum_dark", 0.007, 12)
    for phi in (68, 112):
        G.button(p, phi, 0.475, 0.0135, "gold", out=0.012, holes="plum_dark")
    stitch(p, G.arc(60, 120, 0.457, 0.012, 16), "plum_thread", 0.01, 0.006, 0.002)
    stitch(p, G.arc(60, 120, 0.493, 0.012, 16), "plum_thread", 0.01, 0.006, 0.002)
    # fall collar round the back and sides in dark trim, with a gold piped edge
    col = [(0.192, 0.722), (0.18, 0.75), (0.158, 0.778), (0.128, 0.803), (0.1, 0.82)]
    p.add(bm_lathe(col, 40, arc=(-60, 240)), "plum_dark", M(scale=(1, G.ys + 0.04, 1)), smooth=True)
    p.add(bm_tube([(0.193 * math.cos(math.radians(a)), (G.ys + 0.04) * 0.193 * math.sin(math.radians(a)), 0.72)
                   for a in range(-60, 241, 6)], 0.0035, 6), "gold", smooth=True)
    p.add(bm_cyl(0.064, 0.06, 0.13, 24), "skin_warm", M((0, 0, 0.73)), smooth=True)
    # white shirt collar and a three-tier jabot under the chin
    sc = [(0.098 * math.cos(2 * math.pi * k / 40), 0.09 * math.sin(2 * math.pi * k / 40), 0.8) for k in range(41)]
    p.add(bm_tube(sc, 0.022, 14, cap=False), "shirt", smooth=True)
    for i, (z, w) in enumerate(((0.782, 0.05), (0.76, 0.046), (0.738, 0.04))):
        c = G.pt(-90, z, 0.018 + 0.004 * i)
        m = basis(c, Vector((0, 0, 1)), gnorm(G, -90, z))
        p.add(sphere(28, 14), "shirt", m @ S(w, 0.024, 0.014), smooth=True)
        for k in range(5):
            x = (k - 2) / 2.0 * w * 0.78
            p.add(sphere(14, 10), "shirt", m @ Matrix.Translation((x, -0.017 + 0.005 * abs(k - 2), 0.005)) @ S(0.0135, 0.011, 0.011), smooth=True)
    p.add(sphere(16, 10), "gold", basis(G.pt(-90, 0.793, 0.04), Vector((0, 0, 1)), gnorm(G, -90, 0.79)) @ S(0.009, 0.009, 0.006), smooth=True)
    chain(p, G)
    medallion(p, G)
    return p


# ---------------------------------------------------------------- head

NECK = 0.8
HC = Vector((0, 0, 1.07))
HD = vc.Head(HC, 0.322, 0.296, 0.29)
ROLL_O = HC + Vector((0, 0.014, 0.12))
ROLL_M = Matrix.Translation(ROLL_O) @ Matrix.Rotation(math.radians(-14), 4, "X")
RR = 0.059


def ell_hit(o, d):
    """Where a ray from o (inside the head) along d leaves the head ellipsoid, and the normal there."""
    a, b, c = HD.a, HD.b, HD.c
    p = Vector(o) - HD.hc
    d = Vector(d).normalized()
    A = (d.x / a) ** 2 + (d.y / b) ** 2 + (d.z / c) ** 2
    B = 2 * (p.x * d.x / a ** 2 + p.y * d.y / b ** 2 + p.z * d.z / c ** 2)
    C = (p.x / a) ** 2 + (p.y / b) ** 2 + (p.z / c) ** 2 - 1
    t = (-B + math.sqrt(B * B - 4 * A * C)) / (2 * A)
    q = p + d * t
    return HD.hc + q, Vector((q.x / a ** 2, q.y / b ** 2, q.z / c ** 2)).normalized()


def roll_pt(t):
    """Centre line of the padded roll at angle t (radians, 0 = his left, -pi/2 = front), seated on the head."""
    v = ROLL_M.to_3x3() @ Vector((math.cos(t), math.sin(t), 0.0))
    hit, n = ell_hit(ROLL_O, v)
    return hit + n * RR * 0.5, n


def roll_r(t):
    return RR * (1 + 0.075 * math.cos(10 * t))


def chaperon(hp):
    N = 160
    ts = [2 * math.pi * k / N for k in range(N)]
    cs = [roll_pt(t) for t in ts]
    hp.add(sweep([c for c, n in cs], [roll_r(t) for t in ts], [n for c, n in cs], 28, closed=True), "hat_dark", smooth=True)
    # quilting creases round the roll between the padded lobes
    for k in range(10):
        t = (2 * k + 1) * math.pi / 10
        c, n = roll_pt(t)
        c2, _ = roll_pt(t + 0.01)
        tg = (c2 - c).normalized()
        o = (n - tg * n.dot(tg)).normalized()
        s = tg.cross(o)
        r = roll_r(t) + 0.0012
        arc = [c + s * (r * math.cos(math.radians(a))) + o * (r * math.sin(math.radians(a))) for a in range(-75, 256, 15)]
        hp.add(bm_tube(arc, 0.003, 6), "hat_crease", smooth=True)
    # the crown: gathered cloth puffing up out of the roll and slumping toward his right
    prof = [(0.262, -0.01), (0.284, 0.03), (0.3, 0.075), (0.298, 0.115), (0.275, 0.155), (0.232, 0.19), (0.165, 0.216),
            (0.09, 0.23), (0.0, 0.234)]

    def folds(a, z):
        k = math.sin(math.pi * min(max((z - 0.02) / 0.2, 0.0), 1.0))
        return 0.011 * k * math.cos(7 * a + 0.5)
    bm = lathe(prof, 112, rfun=folds, ys=0.93, cap_top=True)
    for v in bm.verts:
        w = max(0.0, (v.co.z - 0.05) / 0.185) ** 1.4
        v.co.x -= 0.07 * w
        v.co.z -= 0.035 * w * max(0.0, -v.co.x) / 0.3
    hp.add(bm, "hat", ROLL_M, smooth=True)
    return draped_tail(hp)


HAIR = []
COLLAR = vc.Garment([(0.192, 0.722), (0.18, 0.75), (0.158, 0.778), (0.128, 0.803), (0.1, 0.82)], ys=0.92)
TAIL_TH = 0.011          # half-thickness of the tail band


def tail_clear(q):
    """Distance from q to the nearest surface the tail can rest on: head, hair, left ear, neck,
    shirt collar, coat collar, coat (with room for the chain) and the left arm."""
    p = q - HC
    e = math.sqrt((p.x / HD.a) ** 2 + (p.y / HD.b) ** 2 + (p.z / HD.c) ** 2)
    g = [(e - 1.0) * 0.29, (q - HD.H(HD.a * 0.97, 0.01, -0.035)).length - 0.07]
    if HAIR:
        g.append(min((q - Vector(c)).length - v for c, v in HAIR))
    rho = math.sqrt(q.x ** 2 + (q.y / COAT.ys) ** 2)
    if 0.73 < q.z < 0.86:
        g.append(math.sqrt(q.x ** 2 + q.y ** 2) - 0.064)
    g.append(math.sqrt((math.sqrt(q.x ** 2 + q.y ** 2) - 0.094) ** 2 + (q.z - 0.8) ** 2) - 0.022)
    phi = math.degrees(math.atan2(q.y, q.x))
    if 0.715 < q.z < 0.825 and not (-120 < phi < -60):
        g.append((math.sqrt(q.x ** 2 + (q.y / COLLAR.ys) ** 2) - COLLAR.rad(q.z)) * COLLAR.ys - 0.004)
    g.append(coat_gap(q) - 0.014)
    g.append(arm_gap(q, 1))
    return min(g)


def tail_grad(q, h=0.004):
    d = Vector((tail_clear(q + Vector((h, 0, 0))) - tail_clear(q - Vector((h, 0, 0))),
                tail_clear(q + Vector((0, h, 0))) - tail_clear(q - Vector((0, h, 0))),
                tail_clear(q + Vector((0, 0, h))) - tail_clear(q - Vector((0, 0, h)))))
    return d.normalized() if d.length > 1e-9 else Vector((0, 0, 1))


def settle(base, d, th):
    """First point that clears th when marching outward along d from inside the surface near base
    (backs up first if base is already outside): the band lies on the nearest surface under it."""
    d = Vector(d).normalized()
    s = -0.02
    while tail_clear(base + d * s) >= th and s > -0.2:
        s -= 0.0015
    while tail_clear(base + d * s) < th and s < 0.25:
        s += 0.0015
    return base + d * s


def push_out(q, d, th):
    """Move q outward along d only as far as needed to clear th (never pulls it in), so the cloth
    bridges hollows instead of being sucked into them."""
    d = Vector(d).normalized()
    s = 0.0
    while tail_clear(q + d * s) < th and s < 0.25:
        s += 0.0015
    return q + d * s


def draped_tail(hp):
    """The chaperon tail as a flat, tapering cloth band: it leaves the roll at the back-left, hugs the
    back of the head and the nape, folds over and lies flat on the left shoulder, ending a little
    down the front. Every point is settled onto the surfaces under it, so it never stands off."""
    th = TAIL_TH + 0.004
    guide = []
    for phi, z in ((54, 0.08), (50, 0.01), (46, -0.06), (43, -0.12)):
        guide.append(HD.spt(phi, z, -0.04))
    guide += [(Vector(v), Vector(d).normalized()) for v, d in (
        ((0.15, 0.13, 0.86), (0.6, 0.7, 0.1)), ((0.12, 0.1, 0.79), (0.5, 0.6, 0.6)), ((0.14, 0.07, 0.765), (0.45, 0.35, 0.82)),
        ((0.17, 0.03, 0.74), (0.4, 0.15, 0.9)), ((0.215, 0.0, 0.72), (0.3, 0.0, 0.95)), ((0.24, -0.045, 0.705), (0.25, -0.35, 0.9)),
        ((0.235, -0.09, 0.685), (0.2, -0.7, 0.7)), ((0.22, -0.125, 0.66), (0.15, -0.9, 0.4)))]
    gp = [settle(c, n, th) for c, n in guide]
    gd = [n for c, n in guide]
    cum = [0.0]
    for p0, p1 in zip(gp, gp[1:]):
        cum.append(cum[-1] + (p1 - p0).length)
    L = cum[-1]

    def dir_at(sv):
        for i in range(len(cum) - 1):
            if sv <= cum[i + 1] or i == len(cum) - 2:
                f = min(max((sv - cum[i]) / max(cum[i + 1] - cum[i], 1e-9), 0.0), 1.0)
                return gd[i].lerp(gd[i + 1], f).normalized()
    # resample evenly, then smooth and re-settle (along the guide directions) so it flows like cloth
    N = 48
    pts = [polyline_at(gp, L * k / (N - 1)) for k in range(N)]
    refs = [dir_at(L * k / (N - 1)) for k in range(N)]
    for _ in range(3):
        for _ in range(4):
            pts = [pts[0]] + [pts[i - 1] * 0.25 + pts[i] * 0.5 + pts[i + 1] * 0.25 for i in range(1, N - 1)] + [pts[-1]]
        pts = [pts[0]] + [push_out(q, r, th) for q, r in zip(pts[1:], refs[1:])]
    for _ in range(3):
        pts = [pts[0]] + [pts[i - 1] * 0.25 + pts[i] * 0.5 + pts[i + 1] * 0.25 for i in range(1, N - 1)] + [pts[-1]]
    # orientation: carry the face normal along the path without flipping (parallel transport),
    # easing it toward the surface direction wherever that is well defined, plus one soft twist
    # where the band folds over the top of the shoulder
    tans = [(pts[min(i + 1, N - 1)] - pts[max(i - 1, 0)]).normalized() for i in range(N)]
    o = (refs[0] - tans[0] * refs[0].dot(tans[0])).normalized()
    out = [o]
    for i in range(1, N):
        t0, t1 = tans[i - 1], tans[i]
        o = (t0.rotation_difference(t1).to_matrix() @ o)
        g = refs[i] - t1 * refs[i].dot(t1)
        w = 0.5 * max(0.0, 1.0 - abs(refs[i].dot(t1))) ** 2
        if g.length > 1e-6:
            o = o.lerp(g.normalized() * (1 if g.dot(o) >= 0 else -1), w)
        o = (o - t1 * o.dot(t1)).normalized()
        out.append(o)
    refs = []
    for i, o in enumerate(out):
        f = i / (N - 1)
        tw = math.radians(20) * math.exp(-((f - 0.76) / 0.07) ** 2)
        refs.append(Matrix.Rotation(tw, 3, tans[i]) @ o)
    widths = []
    for i in range(N):
        f = i / (N - 1)
        w = 0.062 - 0.026 * f
        if f > 0.93:
            w *= math.sqrt(max(1 - ((f - 0.93) / 0.075) ** 2, 0.06))
        widths.append((w, TAIL_TH * (1.25 if f < 0.08 else 1.0)))
    hp.add(sweep(pts, widths, refs, 24), "hat", smooth=True)
    # dark hem stripe near the end
    k = N - 6
    hp.add(sweep(pts[k:k + 2], [(widths[k][0] + 0.0015, TAIL_TH + 0.0015), (widths[k + 1][0] + 0.0015, TAIL_TH + 0.0015)], refs[k:k + 2], 24),
           "hat_dark", smooth=True)
    return pts, widths, refs


def head():
    hp = Part("head")
    H = HD.H
    HD.skull(hp)
    HD.ears(hp)
    for s in (-1, 1):
        HD.eye(hp, s, 0.1, 0.0, 0.031, 0.043)
    for s in (-1, 1):
        HD.on_face(hp, "blush_rosy", s * 0.174, -0.034, 0.047, 0.029, 0.006, out=0.001)
    HD.nose(hp, "nose", -0.05, size=(0.058, 0.05, 0.056), out=0.026)
    HD.mouth(hp, -0.178, "smile", 0.022, "mouth")
    # very bushy brows: clumpy clouds flaring up at the outer ends
    br = []
    for s in (-1, 1):
        for x, z, v in ((0.046, 0.083, 0.021), (0.076, 0.094, 0.028), (0.11, 0.1, 0.03), (0.143, 0.097, 0.028), (0.172, 0.09, 0.024),
                        (0.196, 0.096, 0.019), (0.21, 0.108, 0.013)):
            br.append((HD.fpt(s * x, z, 0.016)[0], v))
    hp.add(meta(br, 0.006, 4.0), "hair_white", None, smooth=True)
    # big curled moustache: plump lobes sweeping out under the nose and curling up at the tips
    for s in (-1, 1):
        mo = [(0.026, -0.105, 0.03, 0.036), (0.066, -0.114, 0.03, 0.044), (0.11, -0.113, 0.027, 0.041), (0.148, -0.104, 0.023, 0.033),
              (0.178, -0.099, 0.02, 0.025), (0.201, -0.09, 0.018, 0.019), (0.213, -0.075, 0.017, 0.0145), (0.21, -0.062, 0.016, 0.012),
              (0.199, -0.057, 0.016, 0.0095), (0.19, -0.063, 0.016, 0.0075)]
        hp.add(meta([(HD.fpt(s * x, z, o)[0], v) for x, z, o, v in mo], 0.0055), "hair_white", None, smooth=True)
    # white side hair: smooth puffs behind the ears and a band round the back, under the roll
    hair = []
    for z, f, v, n in ((0.05, 0.9, 0.046, 11), (-0.02, 0.93, 0.05, 12), (-0.085, 0.92, 0.04, 13)):
        kz = math.sqrt(1 - (z / HD.c) ** 2)
        for k in range(n):
            phi = math.radians(28 + 124 * k / (n - 1))
            dz = -0.012 * (k % 2) if z < -0.05 else 0.0               # a scalloped lower edge
            hair.append((H(HD.a * f * kz * math.cos(phi), HD.b * f * kz * math.sin(phi), z + dz), v * (0.85 if k % 2 else 1.0)))
    for s in (-1, 1):
        hair += [(H(s * 0.296, -0.012, 0.072), 0.036), (H(s * 0.3, 0.04, 0.045), 0.046), (H(s * 0.315, 0.075, -0.005), 0.046),
                 (H(s * 0.305, 0.105, -0.065), 0.04), (H(s * 0.322, 0.03, 0.02), 0.032)]
    hp.add(meta(hair, 0.008, 2.0), "hair_white", None, smooth=True)
    HAIR[:] = hair
    tail, widths, refs = chaperon(hp)
    # report: the roll's lowest edge at the front, and how close the tail comes to coat and arms
    c, n = roll_pt(-math.pi / 2)
    print("MAYOR roll front centre z %.3f (rel head %.3f), lower edge ~%.3f" % (c.z, c.z - HC.z, c.z - roll_r(-math.pi / 2) - HC.z))
    gaps = [tail_clear(q) for q in tail]
    print("MAYOR tail clearance (target %.3f): min %.3f max %.3f" % (TAIL_TH + 0.002, min(gaps), max(gaps)))
    return hp


# ---------------------------------------------------------------- arms and legs

def cuff_trim(p, side, pv, d):
    """Gold braid round the dark cuff and a small gold button on its outer side."""
    L = CFG["arm_len"]
    k = CFG["sleeve_r"] / 0.072
    cm = frame(pv + d * (L * 0.555), d)
    p.add(bm_tube(ring_pts(cm, 0.0935 * k, 40, 0.052), 0.0035, 6, cap=False), "gold", smooth=True)
    out = Vector((side, -0.35, 0.0))
    out = (out - d * out.dot(d)).normalized()
    bm_ = frame(pv + d * (L * 0.555 + 0.03) + out * (0.094 * k), out)
    p.add(sphere(14, 8), "gold", bm_ @ S(0.0105, 0.0105, 0.005), smooth=True)


def leg(side, cfg):
    """vc.leg with a longer, rounder ankle shoe (toes reaching out from under the round coat) and a heel."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    hz = cfg["hip_z"]
    lr = cfg.get("leg_r", 0.062)
    top = cfg.get("boot_top", 0.15)
    p.add(bm_tube([(x, 0, hz), (x, 0, max(top - 0.03, 0.08))], [lr, lr * 1.02], 16), cfg["pants_mat"], smooth=True)
    els = [((x, 0.005, z), 0.07) for z in [0.11 + (top - 0.11) * k / 4 for k in range(5)]]
    els += [((x, -0.035, 0.078), 0.072), ((x, -0.1, 0.07), 0.066), ((x, -0.15, 0.061), 0.056), ((x, 0.04, 0.075), 0.064)]
    p.add(meta(els, 0.01), cfg["boot_mat"], None, smooth=True)
    p.add(bm_box(0.134, 0.29, 0.024, bevel=0.011, segs=3), "sole", M((x, -0.052, 0.012)), smooth=True)
    p.add(bm_box(0.118, 0.07, 0.03, bevel=0.009, segs=3), "sole", M((x, 0.055, 0.024)), smooth=True)
    buckle(p, side, x)
    return p


def buckle(p, side, x):
    """Gold shoe buckle on the instep, on a dark tongue."""
    def top(y):
        zs = [v.co.z for v in p.bm.verts if abs(v.co.x - x) < 0.012 and abs(v.co.y - y) < 0.008]
        return max(zs) if zs else 0.13
    yb = -0.142
    z0, z1 = top(yb + 0.02), top(yb - 0.02)
    slope = Vector((0, -0.04, z1 - z0)).normalized()          # down the instep toward the toe
    n = Vector((0, slope.z, -slope.y)).normalized()           # instep normal (up and forward)
    if n.z < 0:
        n = -n
    c = Vector((x, yb, top(yb) - 0.002))
    m = basis(c, -slope, n)
    p.add(sphere(20, 10), "shoe", m @ Matrix.Translation((0, 0.004, -0.004)) @ S(0.036, 0.032, 0.008), smooth=True)
    w, h, r = 0.027, 0.02, 0.006
    loop = []
    for k in range(33):
        a = 2 * math.pi * k / 32
        loop.append(m @ Vector(((w - r) * math.copysign(abs(math.cos(a)) ** 0.35, math.cos(a)) + 0.0,
                                (h - r) * math.copysign(abs(math.sin(a)) ** 0.35, math.sin(a)), 0.006)))
    p.add(bm_tube(loop, 0.0042, 8, cap=False), "gold", smooth=True)
    p.add(bm_tube([m @ Vector((0, -h + 0.006, 0.006)), m @ Vector((0, h - 0.006, 0.006))], 0.0028, 6), "gold", smooth=True)


CFG = dict(
    neck_z=NECK, shoulder_x=0.235, shoulder_z=0.68, hip_x=0.12, hip_z=0.36,
    arm_len=0.27, arm_pose={1: (38, 4), -1: (38, 12)},       # round belly: arms held out from it; cane arm a little forward
    sleeve_r=0.076, sleeve_mat="plum", cuff_mat="plum_dark", stitch_mat="plum_thread", arm_fn=cuff_trim,
    leg_r=0.07, pants_mat="plum_dark", boot_mat="shoe", boot_top=0.15, boot_trim=None, leg=leg,
)


def arm_gap(q, side):
    """Distance from q to an arm's sleeve capsule and hand (positive outside)."""
    pv = vc.shoulder(side, CFG)
    d = vc.arm_dir(side, CFG)
    L = CFG["arm_len"]
    t = max(0.0, min(L * 0.7, (q - pv).dot(d)))
    g1 = (q - (pv + d * t)).length - CFG["sleeve_r"] * 1.1
    g2 = (q - vc.hand_c(side, CFG)).length - 0.066
    g3 = (q - (pv + d * (L * 0.555))).length - 0.094 * CFG["sleeve_r"] / 0.072
    return min(g1, g2, g3)


# ---------------------------------------------------------------- prop

def cane():
    p = Part("cane")
    g = vc.hand_c(-1, CFG)
    tip = Vector((g.x - 0.05, g.y - 0.085, 0.0))
    u = (g - tip).normalized()
    Lg = (g - tip).length
    m = frame(tip, u)                      # local Z up the cane from the ground point
    # iron tip and brass ferrule
    p.add(lathe([(0.006, 0.0015), (0.0105, 0.003), (0.0125, 0.008), (0.0125, 0.017), (0.0118, 0.019)], 24, cap_bottom=True), "iron", m, smooth=True)
    p.add(lathe([(0.0122, 0.018), (0.0145, 0.021), (0.0145, 0.072), (0.0138, 0.076), (0.0128, 0.08)], 24), "brass", m, smooth=True)
    p.add(lathe([(0.0144, 0.064), (0.0158, 0.067), (0.0144, 0.07)], 24), "brass_dark", m, smooth=True)
    # the polished shaft, a touch thicker toward the handle, with two growth nodes
    top = Lg - 0.11
    shaft = [(0.0128 + 0.0026 * k / 10, 0.078 + (top - 0.078) * k / 10) for k in range(11)]
    p.add(lathe(shaft, 24), "cane_wood", m, smooth=True)
    for zn in (0.24, 0.39):
        r = 0.0128 + 0.0026 * (zn - 0.078) / (top - 0.078)
        p.add(lathe([(r, zn - 0.007), (r + 0.0018, zn - 0.002), (r + 0.0022, zn), (r + 0.0018, zn + 0.002), (r, zn + 0.007)], 24),
              "cane_dark", m, smooth=True)
    # the knob handle under his palm (its dome hidden in the mitten), an engraved band, a brass collar below
    zk = Lg - 0.099
    knob = [(0.0165, 0.0), (0.021, 0.005), (0.028, 0.015), (0.032, 0.027), (0.032, 0.036), (0.029, 0.047), (0.022, 0.056), (0.012, 0.062),
            (0.004, 0.064)]
    p.add(lathe([(r, zk + z) for r, z in knob], 40, cap_top=True), "brass", m, smooth=True)
    p.add(bm_tube(ring_pts(m @ Matrix.Translation((0, 0, zk + 0.0315)), 0.0322, 40), 0.0016, 6, cap=False), "brass_dark", smooth=True)
    zc = zk - 0.019
    p.add(lathe([(0.0158, zc - 0.006), (0.0185, zc - 0.003), (0.0185, zc + 0.003), (0.0172, zc + 0.007), (0.0185, zc + 0.011),
                 (0.0185, zc + 0.016), (0.0165, zc + 0.019)], 28), "brass", m, smooth=True)
    # clearance from the coat and the left arm
    gap = min(coat_gap(v.co) for v in p.bm.verts)
    low = min(v.co.z for v in p.bm.verts)
    print("MAYOR cane: length %.3f, min coat gap %.3f, lowest z %.4f, tilt %.1f deg" % (Lg, gap, low, math.degrees(math.acos(u.z))))
    return p, g


CFG.update(body=body, head=head, props=[("cane", "arm_r", cane)], closeup_z=1.02,
           shots=[("chest", (0, -0.1, 0.64), -15, 4, 1.05), ("cane", (-0.4, -0.08, 0.42), 60, 6, 1.5),
                  ("back", (0, 0, 0.8), 160, 8, 2.6), ("backhead", (0.1, 0.12, 0.92), -140, 5, 1.1), ("left", (0.12, 0, 1.0), -80, 5, 1.8), ("feet", (0, -0.1, 0.12), 0, 25, 1.1)])


def main():
    return vc.build("mayor", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
