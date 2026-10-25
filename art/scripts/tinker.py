"""Tock the tinker, in the soft Animal Crossing style of Marlo the fisher (restyled 2026-10-23).
The smallest villager: everything is designed at Marlo's scale and then scaled by K = 0.85,
so he stands about 15% smaller overall. A busy little inventor with an excited open grin,
freckles and an oil smudge on his cheek; chunky sculpted dark spikes; brass goggles pushed up
on the forehead (stitched leather band, riveted cups, glass lenses with a glint, a bridge);
a pencil tucked behind his left ear. A rust shirt with a placket, bone buttons and pointed
collar, sleeves rolled to the elbow, leather wristbands; an open leather vest with V fronts,
pointed tips, edge trim, stitching and brass buttons; a tool belt with a brass buckle, two
flap pouches, a teal screwdriver and a ball-peen hammer in leather loops, an oily rag; khaki
trousers and laced work boots. A teal canvas backpack with a leather base, piping, a stitched
flap pocket with a buckle strap, a side pocket holding a rolled blueprint, a drawcord top
sprouting proper toothed gears (brass and steel, meshing) and a copper pipe with a red valve
wheel; padded straps over the shoulders with a sternum strap, a brass slider and a gear pin.
Prop: `wrench` (arm_r, held up in front): an adjustable wrench with a tapered handle, hang
hole, fuller, a head angled 15 degrees, fixed and sliding jaws with a rack and a knurled worm.
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
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "shirt": "#C2653F", "shirt_dark": "#954A2F", "shirt_light": "#D98260", "shirt_thread": "#F0C3A2",
    "bone": "#EFE5CE",
    "vest": "#80583A", "vest_dark": "#583A26", "vest_thread": "#E6CDA0",
    "belt": "#4F3525", "pouch": "#8C603D", "pouch_dark": "#62422B",
    "trousers": "#958B68", "trousers_dark": "#736B4E",
    "boot": "#764B30", "boot_dark": "#4F3221", "lace": "#E8DCC0",
    "hair": "#3B2D27", "freckle": "#C98B6E", "oil": "#8A7D74", "tongue": "#DC7B6E",
    "strap": "#5C3C29", "lens": "#A8D0D8",
    "pack": "#4F8279", "pack_dark": "#3B635C", "pack_inside": "#2C3936", "pack_base": "#6E4A32",
    "copper": "#BA7049", "valve_red": "#BE4A3C", "steel_dark": "#6C7278",
    "teal_handle": "#3E8F8B", "wood_handle": "#A86F40", "wood_handle_dark": "#77502E",
    "pencil": "#E8B83F", "pencil_wood": "#EBCB9E", "graphite": "#3A3A3C", "eraser": "#E59A93",
    "paper_blue": "#5F8DB8", "paper_light": "#DCE7F0", "rag": "#6A88AA", "rag_stripe": "#E3D6B8",
}, metal={"copper": (0.65, 0.35), "steel_dark": (0.7, 0.4)},
   gloss={"lens": 0.08, "teal_handle": 0.35, "valve_red": 0.4, "pencil": 0.45})

K = 0.85            # Tock is built at Marlo's scale, then scaled down by this


def shrink(p):
    for v in p.bm.verts:
        v.co *= K
    return p


# ---------------------------------------------------------------- helpers written for Tock

def frames(pts, nrms, closed=False):
    """(point, tangent, normal, width-dir) along a polyline with surface normals."""
    pts = [Vector(q) for q in pts]
    out = []
    N = len(pts)
    for i, p in enumerate(pts):
        if closed:
            t = pts[(i + 1) % N] - pts[i - 1]
        else:
            t = pts[min(i + 1, N - 1)] - pts[max(i - 1, 0)]
        t.normalize()
        n = Vector(nrms[i])
        n = (n - t * n.dot(t)).normalized()
        out.append((p, t, n, t.cross(n).normalized()))
    return out


def ribbon(part, pts, nrms, width, thick, mat, closed=False, segs=12, ex=0.35):
    """A flat strap (rounded-rectangle section) swept along pts, lying on the given normals."""
    bm = bmesh.new()
    rings = []
    for p, t, n, w in frames(pts, nrms, closed):
        ring = []
        for k in range(segs):
            th = 2 * math.pi * k / segs
            c, s = math.cos(th), math.sin(th)
            ring.append(bm.verts.new(p + w * (math.copysign(abs(c) ** ex, c) * width / 2) + n * (math.copysign(abs(s) ** ex, s) * thick / 2)))
        rings.append(ring)
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if not closed:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, mat, None, smooth=True)


def ribbon_edges(pts, nrms, off, lift, closed=False):
    """Two polylines along the edges of a ribbon (for stitching)."""
    fs = frames(pts, nrms, closed)
    a = [p + w * off + n * lift for p, t, n, w in fs]
    b = [p - w * off + n * lift for p, t, n, w in fs]
    if closed:
        a.append(a[0])
        b.append(b[0])
    return a, b


def grid_patch(part, fn, us, vs, want, mat):
    """Single-sided patch from fn(u, v) -> point over the grid us x vs, faces turned toward `want`."""
    bm = bmesh.new()
    V = [[bm.verts.new(fn(u, v)) for v in vs] for u in us]
    for i in range(len(us) - 1):
        for j in range(len(vs) - 1):
            f = bm.faces.new((V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]))
            f.normal_update()
            if f.normal.dot(Vector(want)) < 0:
                f.normal_flip()
    part.add(bm, mat, None, smooth=True)


def fan_patch(part, outline, centre, want, mat):
    """Filled polygon (triangle fan) from a closed outline of world points."""
    bm = bmesh.new()
    c = bm.verts.new(centre)
    vs = [bm.verts.new(q) for q in outline]
    for i in range(len(vs)):
        f = bm.faces.new((c, vs[i], vs[(i + 1) % len(vs)]))
        f.normal_update()
        if f.normal.dot(Vector(want)) < 0:
            f.normal_flip()
    part.add(bm, mat, None, smooth=True)


def rrect(w, h, r, n=5):
    """Rounded rectangle (closed list of (x, y)) of size w x h with corner radius r."""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    pts.append(pts[0])
    return pts


def gear(part, m, r, teeth, t, mat, hub="brass_dark", spokes=4):
    """A proper spur gear in the local XY plane of m (axis = local Z): trapezoid teeth on a rim,
    spokes and a hub with an axle."""
    h = min(0.022, r * 0.24)
    rr, rt = r - h * 0.5, r + h * 0.5
    ri = rr - max(0.011, r * 0.2) if spokes else r * 0.32
    prof = [(0.0, rr), (0.11, rr), (0.22, rr), (0.32, rt), (0.42, rt), (0.58, rt), (0.68, rt), (0.78, rr), (0.89, rr)]
    bm = bmesh.new()
    of, ob, inf, inb = [], [], [], []
    for k in range(teeth):
        for f, rad in prof:
            a = 2 * math.pi * (k + f) / teeth
            ca, sa = math.cos(a), math.sin(a)
            of.append(bm.verts.new((rad * ca, rad * sa, t / 2)))
            ob.append(bm.verts.new((rad * ca, rad * sa, -t / 2)))
            inf.append(bm.verts.new((ri * ca, ri * sa, t / 2)))
            inb.append(bm.verts.new((ri * ca, ri * sa, -t / 2)))
    N = len(of)
    for i in range(N):
        j = (i + 1) % N
        bm.faces.new((of[i], of[j], inf[j], inf[i]))
        bm.faces.new((ob[j], ob[i], inb[i], inb[j]))
        bm.faces.new((ob[i], ob[j], of[j], of[i]))
        bm.faces.new((inb[j], inb[i], inf[i], inf[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, mat, m, smooth=True)
    rh = r * 0.24 if spokes else ri + 0.003
    if spokes:
        for k in range(spokes):
            a = 360.0 * (k + 0.5) / spokes
            L = ri - rh + 0.01
            part.add(bm_box(L, r * 0.15, t * 0.78, bevel=min(0.003, t * 0.2), segs=2), mat,
                     m @ M(rot=(0, 0, a)) @ Matrix.Translation(((rh + ri) / 2, 0, 0)), smooth=True)
    part.add(lathe([(rh * 0.9, -t * 0.66), (rh, -t * 0.6), (rh, t * 0.6), (rh * 0.9, t * 0.66)], 32, cap_top=True, cap_bottom=True), hub, m, smooth=True)
    for sz in (1, -1):
        part.add(sphere(16, 8), "iron", m @ Matrix.Translation((0, 0, sz * t * 0.66)) @ S(rh * 0.42, rh * 0.42, rh * 0.18), smooth=True)


# ---------------------------------------------------------------- body (shirt, vest, belt, backpack)

SHIRT = vc.Garment([(0.17, 0.252), (0.2, 0.262), (0.222, 0.28), (0.234, 0.305), (0.236, 0.33), (0.232, 0.355), (0.22, 0.45), (0.205, 0.55), (0.19, 0.63),
                    (0.172, 0.69), (0.146, 0.74), (0.11, 0.785), (0.07, 0.815), (0.04, 0.83)], ys=0.84)
G = SHIRT


def surf_n(p, out=0.0):
    """Outward normal of the shirt surface (offset by out) at point p."""
    x, y, z = p
    R = G.rad(z) + out
    e = 0.004
    dR = (G.rad(z + e) - G.rad(z - e)) / (2 * e)
    return Vector((x, y / G.ys ** 2, -R * dR)).normalized()


def front_pt(x, z, out):
    R = G.rad(z) + out
    return Vector((x, -G.ys * math.sqrt(max(R * R - x * x, 0.0)), z))


# the vest: open V fronts, pointed tips at the bottom of each front
VZ0, VZ1 = 0.395, 0.795
VOUT = 0.012


def vest_g(z):
    t = max(0.0, min(1.0, (z - VZ0) / (VZ1 - VZ0)))
    return 14 + 46 * t ** 1.5


def vest_bottom(u):
    d = min(u, 1 - u) * 330.0
    return VZ0 - 0.04 * max(0.0, 1 - d / 26.0) ** 1.6


def vest_zphi(u, v):
    z0 = vest_bottom(u)
    z = z0 + (VZ1 - z0) * v
    g = vest_g(z)
    return z, -90 + g + u * (360 - 2 * g)


def vest_pt(u, v, out=VOUT):
    z, phi = vest_zphi(u, v)
    return G.pt(phi, z, out)


def vest_edge(side, dphi, v, out):
    """Point dphi degrees in from the left (side=1, his left, +x) or right front edge."""
    z, _ = vest_zphi(0.0 if side > 0 else 1.0, v)
    g = vest_g(z)
    phi = (-90 + g + dphi) if side > 0 else (270 - g - dphi)
    return G.pt(phi, z, out), phi, z


def strap_path(xsign, betas, x_of_b, zc=0.66, out=0.026):
    """Backpack strap centre line in the plane x = x_of_b(beta): rays from (0, zc) in the YZ plane
    (beta 0 = back, 90 = up, 180 = front) meet the shirt surface offset by out."""
    pts = []
    for b in betas:
        x0 = x_of_b(b)
        dy, dz = math.cos(math.radians(b)), math.sin(math.radians(b))
        lo, hi = 0.0, 0.5
        for _ in range(40):
            mid = (lo + hi) / 2
            y, z = dy * mid, zc + dz * mid
            R = G.rad(z) + out
            if (y / G.ys) ** 2 + x0 * x0 < R * R:
                lo = mid
            else:
                hi = mid
        pts.append(Vector((xsign * x0, dy * lo, zc + dz * lo)))
    return pts


# backpack (pack-local: centred at the origin, outer face +y), bent round the back, then moved
PA, PB, PC = 0.158, 0.075, 0.148
PY, PZ = 0.263, 0.55
BEND = 0.055
U_SEAM = math.asin(-0.55 ** 2)
U_TOP = math.asin(0.86 ** 2)


def se(c, e=0.5):
    return math.copysign(abs(c) ** e, c)


def pack_ring(u, nt=64, grow=0.0):
    s = abs(math.cos(u)) ** 0.5
    z = PC * se(math.sin(u))
    return [((PA * s + grow) * se(math.cos(t)), (PB * s + grow) * se(math.sin(t)), z) for t in (2 * math.pi * k / nt for k in range(nt))]


def pack_shell(u0, u1, nu, cap_bottom=False):
    bm = bmesh.new()
    rows = [[bm.verts.new(q) for q in pack_ring(u0 + (u1 - u0) * i / nu)] for i in range(nu + 1)]
    for a, b in zip(rows, rows[1:]):
        for k in range(len(a)):
            j = (k + 1) % len(a)
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if cap_bottom:
        pole = bm.verts.new((0, 0, -PC - 0.001))
        r0 = rows[0]
        for k in range(len(r0)):
            bm.faces.new((r0[(k + 1) % len(r0)], r0[k], pole))
    return bm


def pack_back(x, z, out=0.0):
    q = 1 - (abs(x) / PA) ** 4 - (abs(z) / PC) ** 4
    return Vector((x, PB * max(q, 0.0) ** 0.25 + out, z))


def pack_side(y, z, out=0.0):
    q = 1 - (abs(y) / PB) ** 4 - (abs(z) / PC) ** 4
    return Vector((PA * max(q, 0.0) ** 0.25 + out, y, z))


def pack_world(q):
    q = Vector(q)
    return Vector((q.x, q.y - BEND * (q.x / PA) ** 2 + PY, q.z + PZ))


def lin(a, b, n):
    return [a + (b - a) * k / n for k in range(n + 1)]


def pocket_on(pk, fn, us, vs, want, mat, edge, thread, hem=True):
    """Stitched patch pocket on the pack: a panel, a piped border, a hem roll and a stitch run."""
    grid_patch(pk, lambda u, v: fn(u, v, 0.006), us, vs, want, mat)
    u0, u1, v0, v1 = us[0], us[-1], vs[0], vs[-1]
    border = [fn(u, v0, 0.0075) for u in lin(u0, u1, 12)] + [fn(u1, v, 0.0075) for v in lin(v0, v1, 8)[1:]] + \
             [fn(u, v1, 0.0075) for u in lin(u1, u0, 12)[1:]] + [fn(u0, v, 0.0075) for v in lin(v1, v0, 8)[1:]]
    pk.add(bm_tube(border, 0.0042, 8, cap=False), edge, smooth=True)
    if hem:
        pk.add(bm_tube([fn(u, v1 - 0.011, 0.009) for u in lin(u0, u1, 14)], 0.0055, 8), mat, smooth=True)
    i = 0.009
    stitch(pk, [fn(u0 + i, v1 - 0.024, 0.0085)] + [fn(u0 + i, v, 0.0085) for v in lin(v1 - 0.03, v0 + i, 6)] +
           [fn(u, v0 + i, 0.0085) for u in lin(u0 + i, u1 - i, 12)] + [fn(u1 - i, v, 0.0085) for v in lin(v0 + i, v1 - 0.024, 6)],
           thread, 0.011, 0.007, 0.0022)


def backpack(p):
    pk = Part("pack")
    # shell: teal canvas above a leather base, piping on the seam, a rolled rim round the open top
    pk.add(pack_shell(-math.pi / 2 + 0.02, U_SEAM, 10, cap_bottom=True), "pack_base", None, smooth=True)
    pk.add(pack_shell(U_SEAM, U_TOP, 18), "pack", None, smooth=True)
    seam = pack_ring(U_SEAM, 64, 0.003)
    pk.add(bm_tube(seam + [seam[0]], 0.0055, 8, cap=False), "pack_dark", smooth=True)
    stitch(pk, [Vector(q) + Vector((0, 0, 0.012)) for q in pack_ring(U_SEAM + 0.07, 64, 0.002)[8:25]], "stitch_light", 0.011, 0.007, 0.0022)
    rim = pack_ring(U_TOP, 64, 0.002)
    pk.add(bm_tube(rim + [rim[0]], 0.014, 12, cap=False), "pack_dark", smooth=True)
    zin = PC * se(math.sin(U_TOP)) - 0.012
    inner = [Vector((q[0] * 0.93, q[1] * 0.9, zin)) for q in rim]
    fan_patch(pk, inner, (0, 0, zin - 0.004), (0, 0, 1), "pack_inside")
    # drawcord just under the rim, its two ends hanging on the outer face with a wooden bead
    cord = pack_ring(math.asin(0.8 ** 2), 64, 0.006)
    pk.add(bm_tube(cord[4:29], 0.0032, 6), "cord", smooth=True)
    for dx in (-0.006, 0.006):
        c0 = pack_back(0.03 + dx, 0.1, 0.007)
        pk.add(bm_tube([c0, pack_back(0.034 + dx * 1.5, 0.07, 0.01), pack_back(0.036 + dx, 0.05, 0.012)], 0.003, 6), "cord", smooth=True)
    pk.add(sphere(16, 10), "wood_handle", M(pack_back(0.036, 0.042, 0.016), scale=(0.011, 0.01, 0.013)), smooth=True)
    # big outer pocket with a flap and a buckled strap
    fb = lambda x, z, o: pack_back(x, z, o)
    pocket_on(pk, fb, lin(-0.088, 0.088, 14), lin(-0.105, 0.02, 10), (0, 1, 0), "pack", "pack_dark", "stitch_light", hem=False)
    grid_patch(pk, lambda x, z: pack_back(x, z, 0.0145), lin(-0.094, 0.094, 14), lin(-0.005, 0.068, 6), (0, 1, 0), "pack")
    fl = [pack_back(x, -0.005, 0.0155) for x in lin(-0.094, 0.094, 14)] + [pack_back(0.094, z, 0.0155) for z in lin(-0.005, 0.068, 5)[1:]] + \
         [pack_back(x, 0.068, 0.0155) for x in lin(0.094, -0.094, 14)[1:]] + [pack_back(-0.094, z, 0.0155) for z in lin(0.068, -0.005, 5)[1:]]
    pk.add(bm_tube(fl, 0.0055, 8, cap=False), "pack_dark", smooth=True)
    stitch(pk, [pack_back(-0.084, 0.06, 0.018)] + [pack_back(-0.084, z, 0.018) for z in lin(0.058, 0.004, 3)] +
           [pack_back(x, 0.004, 0.018) for x in lin(-0.084, 0.084, 12)] + [pack_back(0.084, z, 0.018) for z in lin(0.004, 0.06, 3)], "stitch_light", 0.011, 0.007, 0.0022)
    sp = [pack_back(0.0, z, 0.024) for z in lin(0.074, -0.075, 10)]
    ribbon(pk, sp, [(0, 1, 0)] * len(sp), 0.026, 0.006, "pack_base")
    for e in ribbon_edges(sp, [(0, 1, 0)] * len(sp), 0.0095, 0.0032):
        stitch(pk, e, "stitch_light", 0.009, 0.006, 0.0018)
    bc = pack_back(0.0, -0.03, 0.03)
    bmx = Matrix.Translation(bc) @ M(rot=(-90, 0, 0))
    loop = [bmx @ Vector((x, y, 0)) for x, y in rrect(0.04, 0.034, 0.007)]
    pk.add(bm_tube(loop, 0.0042, 8, cap=False), "brass", smooth=True)
    pk.add(bm_tube([bmx @ Vector((-0.02, 0, 0.001)), bmx @ Vector((0.02, 0, 0.001))], 0.0035, 8), "brass", smooth=True)
    pk.add(bm_tube([bmx @ Vector((0, 0, 0.002)), bmx @ Vector((0, -0.016, 0.005))], 0.0028, 6), "brass_dark", smooth=True)
    pk.add(sphere(10, 6), "brass_dark", M(pack_back(0.0, -0.058, 0.03), scale=(0.0045, 0.003, 0.0045)), smooth=True)
    # side pocket on his left (+x) that holds a rolled blueprint
    pocket_on(pk, lambda y, z, o: pack_side(y, z, o), lin(-0.052, 0.052, 10), lin(-0.095, 0.015, 10), (1, 0, 0), "pack", "pack_dark", "stitch_light")
    # strap anchors at the bottom corners (the straps' lower ends)
    for sx in (-1, 1):
        a = Vector((sx * 0.112, -0.05, -0.105))
        pk.add(bm_box(0.034, 0.02, 0.03, bevel=0.007, segs=2), "pack_base", M(a), smooth=True)
        pk.add(bm_tube(ring_pts(Matrix.Translation(a + Vector((0, -0.006, -0.02))) @ M(rot=(90, 0, 0)), 0.01, 14), 0.0028, 6, cap=False), "brass", smooth=True)
    # bend round his back and move into place
    for v in pk.bm.verts:
        v.co = pack_world(v.co)
    p.merge(pk)

    # contents (rigid, placed after the bend): meshing gears, a copper pipe with a valve wheel, a blueprint
    def rigid(q):
        q = Vector(q)
        return Vector((q.x, q.y - BEND * min((q.x / PA) ** 2, 1.0) + PY, q.z + PZ))

    def gm(c, axis, spin=0.0):
        return frame(rigid(c), axis) @ M(rot=(0, 0, spin))
    gear(p, gm((0.095, 0.024, 0.16), (0.3, 1, 0.12)), 0.105, 14, 0.022, "brass", "brass_dark", 5)
    gear(p, gm((-0.062, -0.03, 0.128), (-0.4, 1, 0.05), 9), 0.064, 10, 0.02, "steel", "steel_dark", 4)
    gear(p, gm((-0.004, 0.04, 0.19), (1, 0.35, 0.25), 5), 0.042, 8, 0.016, "brass", "brass_dark", 0)
    pp = [rigid(q) for q in ((-0.12, -0.012, 0.06), (-0.14, 0.0, 0.17), (-0.175, 0.018, 0.25), (-0.215, 0.04, 0.285), (-0.242, 0.058, 0.292))]
    p.add(bm_tube(pp, 0.0105, 14), "copper", smooth=True)
    for t in (0.35, 0.72):
        c = polyline_at(pp, plen(pp) * t)
        d = (polyline_at(pp, plen(pp) * t + 0.01) - polyline_at(pp, plen(pp) * t - 0.01)).normalized()
        p.add(lathe([(0.0108, -0.008), (0.0138, -0.005), (0.0138, 0.005), (0.0108, 0.008)], 18), "brass", frame(c, d), smooth=True)
    vend = pp[-1]
    vd = (pp[-1] - pp[-2]).normalized()
    p.add(lathe([(0.012, 0.0), (0.012, 0.012), (0.008, 0.016), (0.0045, 0.016), (0.0045, 0.03)], 16, cap_top=True), "brass_dark", frame(vend, vd), smooth=True)
    wm = frame(vend + vd * 0.03, vd)
    p.add(bm_tube(ring_pts(wm, 0.026, 28), 0.0048, 10, cap=False), "valve_red", smooth=True)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        p.add(bm_tube([wm @ Vector((0.005 * math.cos(a), 0.005 * math.sin(a), 0)), wm @ Vector((0.025 * math.cos(a), 0.025 * math.sin(a), 0))], 0.0032, 8), "valve_red", smooth=True)
    p.add(sphere(14, 8), "valve_red", wm @ S(0.008, 0.008, 0.007), smooth=True)
    # rolled blueprint in the side pocket, tied with a string
    bb = rigid((PA + 0.022, 0.0, -0.075))
    bd = Vector((0.18, 0.3, 1)).normalized()
    bmx = frame(bb, bd)
    p.add(lathe([(0.023, 0.0), (0.0235, 0.1), (0.023, 0.215)], 32), "paper_blue", bmx, smooth=True)
    for z, k in ((0.215, 1), (0.0, -1)):
        p.add(sphere(24, 8), "paper_light", bmx @ Matrix.Translation((0, 0, z)) @ S(0.0225, 0.0225, 0.002), smooth=True)
        for rr in (0.008, 0.015):
            p.add(bm_tube(ring_pts(bmx @ Matrix.Translation((0, 0, z + k * 0.0018)), rr, 20), 0.0012, 4, cap=False), "paper_blue", smooth=True)
    p.add(bm_tube(ring_pts(bmx @ Matrix.Translation((0, 0, 0.16)), 0.0245, 24), 0.0022, 6, cap=False), "cord", smooth=True)
    for s in (-1, 1):
        lp = [bmx @ Vector((0.024 + 0.012 * math.sin(t) * 0.8, s * 0.012 * (1 - math.cos(t)) * 0.7, 0.16 + 0.004 * math.sin(t))) for t in [math.pi * k / 8 for k in range(9)]]
        p.add(bm_tube(lp, 0.0018, 5), "cord", smooth=True)
    return pp


def pouch(p, phi, ztop, w=0.072, h=0.08, d=0.038):
    """Leather belt pouch with a rounded flap, a brass snap and a stitched front."""
    zc = ztop - h / 2
    n = G.normal(phi, zc, 0.0)
    m = frame(G.pt(phi, zc, 0.01 + d / 2), n)
    p.add(bm_box(w, h, d, bevel=0.013, segs=3), "pouch", m, smooth=True)
    stitch(p, [m @ Vector((x, y, d / 2 + 0.0012)) for x, y in rrect(w - 0.016, h - 0.02, 0.008, 3)], "vest_thread", 0.009, 0.006, 0.0018)
    fm = m @ Matrix.Translation((0, h / 2 - 0.016, d / 2 + 0.004)) @ M(rot=(8, 0, 0))
    p.add(bm_box(w + 0.006, 0.036, 0.01, bevel=0.0045, segs=2), "pouch_dark", fm, smooth=True)
    p.add(sphere(20, 10), "pouch_dark", fm @ Matrix.Translation((0, -0.018, 0.0)) @ S(0.021, 0.016, 0.0052), smooth=True)
    p.add(sphere(14, 8), "brass", fm @ Matrix.Translation((0, -0.021, 0.0055)) @ S(0.0075, 0.0075, 0.004), smooth=True)
    stitch(p, [fm @ Vector((x, -0.002, 0.0056)) for x in (-w / 2 + 0.006, -0.026, 0.026, w / 2 - 0.006)], "vest_thread", 0.009, 0.006, 0.0018)


def screwdriver(p, phi=-58):
    n = G.normal(phi, 0.4, 0.0)
    base = G.pt(phi, 0.4, 0.026)
    ax = (Vector((0, 0, 1)) + n * 0.12).normalized()
    m = frame(base, ax)
    p.add(lathe([(0.0, -0.002), (0.009, -0.002), (0.0125, 0.004), (0.0145, 0.016), (0.0152, 0.05), (0.0142, 0.066), (0.0108, 0.074), (0.004, 0.077)], 32,
                rfun=ribs(8, 0.0026), cap_top=True), "teal_handle", m, smooth=True)
    p.add(lathe([(0.0068, -0.012), (0.0085, -0.009), (0.0085, 0.0), (0.0068, 0.002)], 18), "steel", m, smooth=True)
    p.add(bm_tube([m @ Vector((0, 0, -0.01)), m @ Vector((0, 0, -0.125))], 0.0042, 12), "steel", smooth=True)
    p.add(bm_box(0.011, 0.003, 0.016, bevel=0.0012, segs=1), "steel", m @ Matrix.Translation((0, 0, -0.13)), smooth=True)
    lc = m @ Vector((0, 0, -0.035))
    p.add(bm_tube(ring_pts(frame(lc, ax), 0.0085, 16), 0.0042, 8, cap=False), "belt", smooth=True)


def hammer(p, phi=-122):
    n = G.normal(phi, 0.43, 0.0)
    hc = G.pt(phi, 0.435, 0.036)
    a = math.radians(phi)
    tang = Vector((-math.sin(a), G.ys * math.cos(a), 0)).normalized()
    down = (Vector((0, 0, -1)) + n * 0.1).normalized()
    hm = frame(hc, down)
    p.add(lathe([(0.0, -0.016), (0.008, -0.015), (0.0105, -0.008), (0.0108, 0.05), (0.0118, 0.14), (0.013, 0.165), (0.0115, 0.178), (0.0, 0.181)], 24,
                cap_top=True), "wood_handle", hm, smooth=True)
    p.add(sphere(14, 8), "wood_handle_dark", M(hc + Vector((0, 0, 0.0185)), scale=(0.0095, 0.0095, 0.0035)), smooth=True)
    p.add(bm_box(0.002, 0.014, 0.002, bevel=0.0008, segs=1), "iron", M(hc + Vector((0, 0, 0.0215)), (0, 0, phi)), smooth=True)
    p.add(lathe([(0.0, -0.046), (0.0145, -0.046), (0.0175, -0.042), (0.0178, -0.03), (0.0165, -0.008), (0.0165, 0.008), (0.012, 0.022), (0.0095, 0.03),
                 (0.0125, 0.034), (0.0145, 0.041), (0.0125, 0.049), (0.006, 0.054), (0.0, 0.055)], 28, cap_bottom=True, cap_top=True), "iron", frame(hc, tang), smooth=True)
    lc = hm @ Vector((0, 0, 0.075))
    p.add(bm_tube(ring_pts(frame(lc, down), 0.0145, 16), 0.0045, 8, cap=False), "belt", smooth=True)


def rag(p, phi=146):
    path = [G.pt(phi, 0.405, 0.016), G.pt(phi + 1, 0.37, 0.022), G.pt(phi + 2, 0.33, 0.028), G.pt(phi + 1.5, 0.29, 0.03), G.pt(phi + 3, 0.25, 0.031),
            G.pt(phi + 4, 0.215, 0.03)]
    path = [q + G.normal(phi, q.z, 0.0) * (0.007 * math.sin(k * 1.9)) for k, q in enumerate(path)]
    nr = [G.normal(phi, q.z, 0.0) for q in path]
    ribbon(p, path, nr, 0.084, 0.006, "rag")
    fb = frames(path, nr)[-1]
    for k in range(8):
        o = -0.036 + 0.072 * k / 7
        q0 = fb[0] + fb[3] * o
        p.add(bm_tube([q0, q0 + Vector((0, 0, -0.016 - 0.005 * (k % 3))) + fb[2] * 0.002], [0.0042, 0.003], 6), "rag", smooth=True)
    L = plen(path)
    for t0 in (0.66, 0.78):
        sub = [polyline_at(path, L * (t0 + 0.012 * k)) for k in range(4)]
        ribbon(p, sub, [G.normal(phi, q.z, 0.0) for q in sub], 0.0855, 0.0068, "rag_stripe")
    f = frames(path, nr)[0]
    p.add(bm_tube([f[0] - f[3] * 0.044 + f[2] * 0.004, f[0] + f[3] * 0.044 + f[2] * 0.004], 0.008, 10), "rag", smooth=True)
    for q, s in ((0.45, 0.012), (0.3, 0.008)):
        c = polyline_at(path, L * q)
        p.add(sphere(12, 6), "oil", frame(c + G.normal(phi, c.z, 0.0) * 0.0035, G.normal(phi, c.z, 0.0)) @ S(s, s * 0.8, 0.0015), smooth=True)


def body():
    p = Part("body")
    G.mesh(p, "shirt")
    # trousers (the seat under the shirt), side seams, fly stitching, hem
    p.add(lathe([(G.rad(z) + 0.003, z) for z in lin(0.252, 0.372, 14)], 64, ys=G.ys, cap_bottom=True), "trousers", None, smooth=True)
    for phi in (0, 180, 90):
        p.add(bm_tube(G.line(phi, 0.268, 0.34, 0.0045), 0.0035, 6), "trousers_dark", smooth=True)
    stitch(p, [G.pt(-80, z, 0.0048) for z in (0.335, 0.31, 0.288)] + [G.pt(-85, 0.274, 0.0048), G.pt(-90, 0.268, 0.0048)], "stitch_light", 0.011, 0.007, 0.0022)
    p.add(bm_tube(G.line(-90, 0.268, 0.34, 0.0045), 0.003, 6), "trousers_dark", smooth=True)
    # shirt placket and bone buttons, seen in the vest's V
    G.panel(p, -95, -85, 0.39, 0.79, "shirt", 0.005, 4)
    for s in (-1, 1):
        p.add(bm_tube([G.pt(-90 + s * 5, z, 0.006) for z in lin(0.39, 0.785, 8)], 0.003, 6), "shirt_dark", smooth=True)
    for z in (0.47, 0.545, 0.68):
        G.button(p, -90, z, 0.0125, "bone", 0.008, holes="shirt_dark")
    # neck and the pointed shirt collar
    p.add(bm_cyl(0.062, 0.06, 0.12, 24), "skin_warm", M((0, 0, 0.75)), smooth=True)
    col = [(0.098, 0.78), (0.1, 0.8), (0.092, 0.825), (0.08, 0.845)]
    p.add(bm_lathe(col, 40, arc=(-62, 242)), "shirt", M(scale=(1, G.ys + 0.04, 1)), smooth=True)
    for s in (1, -1):
        def cp(phi, z, o=0.02):
            return G.pt(phi if s > 0 else 180 - phi, z, o)
        outline = [cp(-62, 0.802), cp(-50, 0.79), cp(-56, 0.77), cp(-66, 0.748), cp(-74, 0.738), cp(-80, 0.745), cp(-84, 0.77), cp(-86, 0.795)]
        cen = cp(-68, 0.775, 0.021)
        fan_patch(p, outline, cen, cen - Vector((0, 0, cen.z)), "shirt")
        p.add(bm_tube(outline + [outline[0]], 0.004, 8, cap=False), "shirt_dark", smooth=True)
        stitch(p, [cp(-58, 0.79, 0.024), cp(-64, 0.757, 0.024), cp(-76, 0.75, 0.024), cp(-81, 0.775, 0.024)], "shirt_thread", 0.008, 0.005, 0.0017)
    # the vest
    NU, NV = 96, 22
    us, vs = lin(0.0, 1.0, NU), lin(0.0, 1.0, NV)
    bm = bmesh.new()
    V = [[bm.verts.new(vest_pt(u, v)) for v in vs] for u in us]
    for i in range(NU):
        for j in range(NV):
            bm.faces.new((V[i][j], V[i + 1][j], V[i + 1][j + 1], V[i][j + 1]))
    p.add(bm, "vest", None, smooth=True)
    trim_o = VOUT + 0.0015
    ub, vb = lin(0.0, 1.0, 72), lin(0.0, 1.0, 18)
    border = [vest_pt(0.0, v, trim_o) for v in vb] + [vest_pt(u, 1.0, trim_o) for u in ub[1:]] + \
             [vest_pt(1.0, v, trim_o) for v in reversed(vb[:-1])] + [vest_pt(u, 0.0, trim_o) for u in reversed(ub[:-1])]
    p.add(bm_tube(border, 0.0068, 10, cap=False), "vest_dark", smooth=True)
    for side in (1, -1):
        stitch(p, [vest_edge(side, 4.5, v, VOUT + 0.003)[0] for v in lin(0.04, 0.97, 16)], "vest_thread")
    stitch(p, [vest_pt(u, 0.06, VOUT + 0.003) for u in lin(0.02, 0.98, 90)], "vest_thread")
    p.add(bm_tube([G.pt(90, z, VOUT + 0.001) for z in lin(VZ0, VZ1 - 0.02, 8)], 0.0035, 6), "vest_dark", smooth=True)
    for z in (0.47, 0.545, 0.62):
        v = (z - VZ0) / (VZ1 - VZ0)
        q, phi, zz = vest_edge(1, 6.0, v, VOUT)
        G.button(p, phi, zz, 0.0135, "brass", VOUT + 0.004)
        q, phi, zz = vest_edge(-1, 6.5, v, VOUT + 0.002)
        a = math.radians(phi)
        tg = Vector((-math.sin(a), G.ys * math.cos(a), 0)).normalized()
        p.add(bm_tube([q - tg * 0.011, q + tg * 0.011], 0.0032, 6), "vest_dark", smooth=True)
    # tool belt: band, stitching, brass buckle with a keeper
    G.panel(p, -180, 180, 0.335, 0.39, "belt", 0.008, 64)
    G.stitch_ring(p, 0.343, 0.0105)
    G.stitch_ring(p, 0.382, 0.0105)
    bm_ = frame(G.pt(-90, 0.3625, 0.013), G.normal(-90, 0.3625, 0.0))
    p.add(bm_tube([bm_ @ Vector((x, y, 0)) for x, y in rrect(0.054, 0.05, 0.01)], 0.0055, 10, cap=False), "brass", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0.0, -0.025, 0.0)), bm_ @ Vector((0.0, 0.025, 0.0))], 0.0045, 8), "brass", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0.0, 0.0, 0.003)), bm_ @ Vector((-0.024, 0.0, 0.006))], 0.0032, 6), "brass_dark", smooth=True)
    p.add(bm_box(0.034, 0.042, 0.006, bevel=0.0025, segs=2), "belt", bm_ @ Matrix.Translation((-0.01, 0, 0.0015)), smooth=True)
    p.add(bm_box(0.012, 0.062, 0.008, bevel=0.003, segs=2), "belt", bm_ @ Matrix.Translation((0.045, 0, 0.002)), smooth=True)
    for z in (0.35, 0.375):
        p.add(sphere(10, 6), "brass", M(G.pt(-112, z, 0.012), scale=0.0042), smooth=True)
    pouch(p, -164, 0.392)
    pouch(p, 36, 0.392, 0.066, 0.074)
    screwdriver(p)
    hammer(p)
    rag(p)
    # backpack, then its straps over the shoulders with a sternum strap, a slider and a gear pin
    backpack(p)
    betas = lin(-28.0, 225.0, 46)
    xb = lambda b: 0.09 + 0.04 * min(max((b + 28) / 118.0, 0), 1) + 0.022 * min(max((b - 90) / 135.0, 0), 1)
    for xs in (1, -1):
        path = strap_path(xs, betas, xb)
        for phi, z in ((-42, 0.49), (-30, 0.475), (-16, 0.465), (-2, 0.46), (14, 0.455), (30, 0.45), (44, 0.445)):
            path.append(G.pt(phi if xs > 0 else 180 - phi, z, 0.026))
        path.append(pack_world((xs * 0.112, -0.062, -0.1)))
        nr = [surf_n(q, 0.026) for q in path]
        ribbon(p, path, nr, 0.036, 0.009, "pack_dark", segs=10)
        for e in ribbon_edges(path, nr, 0.0135, 0.0047):
            stitch(p, e[6:], "stitch_light", 0.011, 0.007, 0.0021)
        # find the chest point at z ~ 0.66 on the front for the slider / pin
        fr = [f for f in frames(path, nr) if f[0].y < 0]
        f = min(fr, key=lambda f: abs(f[0].z - 0.665))
        pc, t, n, w = f
        if xs > 0:
            loop = [pc + w * (x * 0.024) + n * (y * 0.009) for x, y in rrect(2.0, 2.0, 0.5, 4)]
            p.add(bm_tube(loop, 0.0035, 6, cap=False), "brass", smooth=True)
            p.add(bm_tube([pc - w * 0.024 + n * 0.0095, pc + w * 0.024 + n * 0.0095], 0.003, 6), "brass", smooth=True)
        else:
            gear(p, frame(pc + n * 0.008, n), 0.017, 8, 0.005, "brass", "brass_dark", 0)
    zst = 0.6
    st = [front_pt(x, zst, 0.034) for x in lin(-0.15, 0.15, 16)]
    nst = [surf_n(q, 0.034) for q in st]
    ribbon(p, st, nst, 0.018, 0.006, "pack_dark")
    cm = frame(front_pt(0, zst, 0.04), surf_n(front_pt(0, zst, 0.04), 0.04))
    p.add(bm_box(0.034, 0.024, 0.009, bevel=0.0035, segs=2), "brass", cm, smooth=True)
    p.add(bm_box(0.022, 0.014, 0.004, bevel=0.0015, segs=1), "brass_dark", cm @ Matrix.Translation((0, 0, 0.005)), smooth=True)
    return shrink(p)


# ---------------------------------------------------------------- head

NECK = 0.8
HD = vc.Head((0, 0, NECK + 0.27), 0.32, 0.295, 0.288)


def open_mouth(hp, mz=-0.128, w=0.04, h=0.036):
    top = [(w - 2 * w * k / 12, mz + 0.007 * ((w - 2 * w * k / 12) / w) ** 2) for k in range(13)]
    bot = [(-w * math.cos(math.pi * k / 16), mz - h * math.sin(math.pi * k / 16) * (1 - 0.15 * math.cos(math.pi * k / 16) ** 2)) for k in range(1, 16)]
    outline = top + bot
    fan_patch(hp, [HD.fpt(x, z, 0.003)[0] for x, z in outline], HD.fpt(0, mz - h * 0.4, 0.003)[0], (0, -1, 0), "mouth")
    tg = [(0.003 + 0.021 * math.cos(2 * math.pi * k / 20), mz - h * 0.64 + 0.0105 * math.sin(2 * math.pi * k / 20)) for k in range(20)]
    fan_patch(hp, [HD.fpt(x, z, 0.0045)[0] for x, z in tg], HD.fpt(0.003, mz - h * 0.64, 0.0048)[0], (0, -1, 0), "tongue")
    rim = [HD.fpt(x, z, 0.0035)[0] for x, z in outline]
    hp.add(bm_tube(rim + [rim[0]], 0.0032, 6, cap=False), "eye_dark", smooth=True)


def spike_list():
    """(phi or None for the crown, z, base direction, tip direction, length, base radius, mirrored)."""
    base = [
        (-90, 0.235, (0.0, -0.25, 1.0), (0.0, 0.55, 0.8), 0.2, 0.068, False),      # front, sweeping up and back
        (-60, 0.222, (0.45, -0.2, 1.0), (0.6, 0.55, 0.55), 0.18, 0.064, True),
        (None, 0.27, (0.0, 0.45, 1.0), (0.0, 0.55, 0.85), 0.2, 0.07, False),        # crown
        (22, 0.215, (0.6, 0.3, 1.0), (0.75, 0.45, 0.5), 0.16, 0.062, True),
        (-10, 0.165, (1.0, 0.05, 0.85), (0.75, 0.6, 0.3), 0.13, 0.052, True),       # over the ears
        (90, 0.15, (0.0, 1.0, 0.55), (0.0, 0.45, 0.9), 0.15, 0.062, False),         # back
        (90, -0.045, (0.0, 0.3, -1.0), (0.0, 0.75, -0.55), 0.1, 0.042, False),     # pointed tufts at the nape
        (68, -0.03, (0.25, 0.3, -1.0), (0.45, 0.7, -0.5), 0.09, 0.038, True),
    ]
    out = []
    for phi, z, d0, d1, L, r0, mir in base:
        out.append((phi, z, Vector(d0).normalized(), Vector(d1).normalized(), L, r0))
        if mir:
            out.append((180 - phi, z, Vector((-d0[0], d0[1], d0[2])).normalized(), Vector((-d1[0], d1[1], d1[2])).normalized(), L, r0))
    return out


def hair(hp):
    els = []
    for zi in range(14):
        z = -0.09 + 0.028 * zi
        for k in range(24):
            phi = -180 + 15 * k
            c = -math.sin(math.radians(phi))         # 1 at the front, -1 at the back
            zmin = 0.09 + (0.1 * c if c > 0 else 0.18 * c)
            if z < zmin:
                continue
            els.append((HD.spt(phi, z, 0.002)[0], 0.045))
    els.append((HD.H(0, 0.0, 0.265), 0.066))
    for k in range(48):                                # an even row along the hairline (no scallops)
        phi = -180 + 7.5 * k
        c = -math.sin(math.radians(phi))
        if c > 0.45:
            continue
        zmin = 0.09 + (0.1 * c if c > 0 else 0.18 * c)
        els.append((HD.spt(phi, zmin + 0.004, 0.004)[0], 0.042))
    for phi, z, d0, d1, L, r0 in spike_list():
        b = HD.H(0, 0.02, z) if phi is None else HD.spt(phi, z, 0.022)[0]
        p1 = b + d0 * (L * 0.55)
        p2 = p1 + d1 * (L * 0.5)
        for k in range(11):
            t = k / 10
            q = (1 - t) ** 2 * b + 2 * t * (1 - t) * p1 + t * t * p2
            els.append((q, r0 * (1 - t) ** 0.8 + 0.01 * t))
    hp.add(meta(els, 0.0092), "hair", None, smooth=True)


def band_z(phi):
    return 0.15 - 0.045 * math.sin(math.radians(phi))


def goggles(hp):
    # stitched leather band round the head, over the hair
    pts, nrs = [], []
    for k in range(72):
        phi = -180 + 5 * k
        q, n = HD.spt(phi, band_z(phi), 0.056)
        pts.append(q)
        nrs.append(n)
    ribbon(hp, pts, nrs, 0.034, 0.009, "strap", closed=True)
    for e in ribbon_edges(pts, nrs, 0.0115, 0.0048, closed=True):
        stitch(hp, e, "stitch_light", 0.009, 0.006, 0.0019)
    q, n = HD.spt(90, band_z(90), 0.062)
    bmx = frame(q, n)
    hp.add(bm_tube([bmx @ Vector((x, y, 0)) for x, y in rrect(0.026, 0.044, 0.006)], 0.0035, 8, cap=False), "brass", smooth=True)
    hp.add(bm_tube([bmx @ Vector((0, -0.022, 0.001)), bmx @ Vector((0, 0.022, 0.001))], 0.003, 6), "brass", smooth=True)
    # the two cups, pushed up and facing forward-up
    cms = []
    for s in (1, -1):
        p, n = HD.fpt(s * 0.09, 0.198, 0.07)
        n2 = (n + Vector((s * 0.05, -0.38, 0.0))).normalized()
        cm = frame(p, n2)
        cms.append(cm)
        hp.add(bm_tube(ring_pts(cm, 0.041, 32, 0.002), 0.011, 12, cap=False), "strap", smooth=True)
        hp.add(lathe([(0.046, -0.002), (0.051, 0.005), (0.053, 0.014), (0.0525, 0.024), (0.049, 0.032), (0.0435, 0.0365), (0.038, 0.035)], 48), "brass", cm, smooth=True)
        hp.add(sphere(40, 16), "lens", cm @ Matrix.Translation((0, 0, 0.029)) @ S(0.04, 0.04, 0.0115), smooth=True)
        hp.add(sphere(14, 8), "white", cm @ Matrix.Translation((0.012, 0.014, 0.0395)) @ M(rot=(0, 0, -35)) @ S(0.0095, 0.0055, 0.0018), smooth=True)
        hp.add(sphere(10, 6), "white", cm @ Matrix.Translation((0.021, 0.002, 0.038)) @ S(0.0035, 0.0035, 0.0012), smooth=True)
        hp.add(bm_tube(ring_pts(cm, 0.0445, 40, 0.0335), 0.0042, 8, cap=False), "brass_dark", smooth=True)
        for k in range(6):
            a = 2 * math.pi * (k + 0.5) / 6
            hp.add(sphere(10, 6), "brass_dark", cm @ Matrix.Translation((0.0535 * math.cos(a), 0.0535 * math.sin(a), 0.016)) @ S(0.0042), smooth=True)
        # brass loop where the band meets the cup
        lp = cm @ Vector((s * 0.058, 0.0, 0.01))
        hp.add(bm_tube(ring_pts(frame(lp, cm.to_3x3() @ Vector((0, 1, 0))), 0.008, 14), 0.0026, 6, cap=False), "brass", smooth=True)
    a = cms[0] @ Vector((-0.05, 0.004, 0.02))
    b = cms[1] @ Vector((0.05, 0.004, 0.02))
    mid = (a + b) / 2 + Vector((0, -0.018, 0.012))
    hp.add(bm_tube(vc.bezier(a, mid, b, 10), 0.0065, 10), "brass", smooth=True)
    hp.add(sphere(16, 10), "brass_dark", M(polyline_at(vc.bezier(a, mid, b, 10), plen(vc.bezier(a, mid, b, 10)) / 2), scale=0.0095), smooth=True)


def pencil(hp):
    c = HD.H(0.338, 0.005, 0.05)
    d = Vector((0.0, -1.0, -0.22)).normalized()
    m = frame(c - d * 0.095, d)
    hp.add(lathe([(0.0, -0.002), (0.0075, -0.001), (0.0102, 0.004), (0.0105, 0.016)], 20, cap_bottom=True), "eraser", m, smooth=True)
    hp.add(lathe([(0.0112 + 0.0009 * (k % 2), 0.015 + 0.002 * k) for k in range(9)], 20), "brass", m, smooth=True)
    hp.add(lathe([(0.0105, 0.03), (0.0105, 0.152)], 6), "pencil", m, smooth=True)
    hp.add(lathe([(0.0105, 0.152), (0.0035, 0.178)], 16), "pencil_wood", m, smooth=True)
    hp.add(lathe([(0.0036, 0.177), (0.0012, 0.188), (0.0, 0.189)], 12), "graphite", m, smooth=True)


def head():
    hp = Part("head")
    HD.face(hp, mouth=None, eye_x=0.1, eye_size=(0.032, 0.046))
    open_mouth(hp)
    ctrl = [Vector(v) for v in ((0.056, 0.086, 0.019), (0.096, 0.1, 0.023), (0.138, 0.098, 0.021), (0.168, 0.085, 0.015))]
    bp = [tuple(vc.bezier(ctrl[0], ctrl[1], ctrl[2], 8)[k]) for k in range(9)] + [tuple(ctrl[2] + (ctrl[3] - ctrl[2]) * t) for t in (0.33, 0.66, 1.0)]
    HD.brows(hp, "hair", pts=bp, res=0.006)
    for s in (-1, 1):
        for x, z in ((0.084, -0.068), (0.103, -0.06), (0.108, -0.079), (0.124, -0.068)):
            HD.on_face(hp, "freckle", s * x, z, 0.0052, 0.0052, 0.002, out=0.003, u=12, v=8)
    for (x, z, sx, sz, r) in ((-0.2, -0.096, 0.024, 0.015, 20), (-0.214, -0.108, 0.016, 0.011, -15), (-0.186, -0.088, 0.011, 0.008, 0)):   # oil smudge
        q, n = HD.fpt(x, z, 0.002)
        hp.add(sphere(20, 10), "oil", frame(q, n) @ M(rot=(0, 0, r)) @ S(sx, sz, 0.0022), smooth=True)
    hair(hp)
    goggles(hp)
    pencil(hp)
    return shrink(hp)


# ---------------------------------------------------------------- arms and legs

D = dict(   # design-scale joints (the build CFG below holds the same values times K)
    neck_z=NECK, shoulder_x=0.185, shoulder_z=0.70, hip_x=0.09, hip_z=0.36,
    arm_len=0.27, arm_splay=14, arm_pose={-1: (20, 50)},      # the wrench arm holds it up in front
    leg_r=0.07, pants_mat="trousers", boot_mat="boot", boot_top=0.15, boot_trim="boot_dark",
)


def arm(side, cfg=None):
    """Shirt sleeve rolled to the elbow, bare forearm, a leather wristband, mitten hand."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, D)
    d = vc.arm_dir(side, D)
    L = D["arm_len"]
    sr = 0.07
    p.add(sphere(28, 18), "shirt", M(pv, scale=sr * 1.04), smooth=True)
    p.add(bm_tube([pv, pv + d * (L * 0.24), pv + d * (L * 0.44)], [sr, sr * 1.0, sr * 0.97], 28, cap=False), "shirt", smooth=True)
    cm = frame(pv + d * (L * 0.43), d)
    p.add(lathe([(0.058, -0.004), (0.072, -0.001), (0.08, 0.008), (0.08, 0.018), (0.075, 0.024), (0.08, 0.03), (0.081, 0.04), (0.076, 0.049),
                 (0.064, 0.053), (0.05, 0.052)], 40), "shirt_light", cm, smooth=True)
    stitch(p, ring_pts(cm, 0.0815, 26, 0.012), "shirt_dark", 0.01, 0.007, 0.002)
    p.add(bm_tube([pv + d * (L * 0.5), pv + d * (L * 0.68), pv + d * (L * 0.9)], [0.05, 0.047, 0.045], 24, cap=False), "skin_warm", smooth=True)
    wm = frame(pv + d * (L * 0.73), d)
    p.add(lathe([(0.0465, -0.015), (0.0515, -0.012), (0.053, 0.0), (0.0515, 0.012), (0.0465, 0.015)], 32), "strap", wm, smooth=True)
    for k in range(2):
        stitch(p, ring_pts(wm, 0.0535, 22, -0.007 + 0.014 * k), "stitch_light", 0.008, 0.006, 0.0016)
    out = Vector((side, 0.25, 0.0))
    out = (out - d * out.dot(d)).normalized()
    bk = frame(pv + d * (L * 0.73) + out * 0.054, out)
    if side > 0:
        p.add(bm_tube([bk @ Vector((x, y, 0)) for x, y in rrect(0.022, 0.026, 0.005)], 0.003, 6, cap=False), "brass", smooth=True)
        p.add(bm_tube([bk @ Vector((-0.011, 0, 0.001)), bk @ Vector((0.011, 0, 0.001))], 0.0025, 6), "brass", smooth=True)
    else:
        p.add(sphere(12, 8), "brass", bk @ S(0.007, 0.007, 0.0035), smooth=True)
    vc.mitten(p, vc.hand_c(side, D), "skin_warm", side)
    return shrink(p)


def laces(p, side, x):
    """Brass eyelets and crossed laces on the boot front, with a little bow."""
    rows = ((0.145, -0.068), (0.123, -0.077), (0.101, -0.093))
    ey = []
    for z, y in rows:
        for s in (-1, 1):
            q = Vector((x + s * 0.022, y + 0.004 * abs(s), z))
            p.add(sphere(10, 6), "brass", M(q, scale=(0.006, 0.003, 0.006)), smooth=True)
            ey.append(q)
    for i in range(len(rows) - 1):
        a, b = ey[2 * i], ey[2 * i + 3]
        c, dd = ey[2 * i + 1], ey[2 * i + 2]
        p.add(bm_tube([a + Vector((0, -0.003, 0)), (a + b) / 2 + Vector((0, -0.006, 0)), b + Vector((0, -0.003, 0))], 0.0032, 6), "lace", smooth=True)
        p.add(bm_tube([c + Vector((0, -0.003, 0)), (c + dd) / 2 + Vector((0, -0.008, 0)), dd + Vector((0, -0.003, 0))], 0.0032, 6), "lace", smooth=True)
    top = Vector((x, -0.073, 0.152))
    for s in (-1, 1):
        p.add(sphere(12, 8), "lace", M(top + Vector((s * 0.011, 0, 0.004)), (0, s * 30, 0), (0.011, 0.004, 0.006)), smooth=True)
        p.add(bm_tube([top, top + Vector((s * 0.008, -0.004, -0.02))], 0.0028, 6), "lace", smooth=True)
    cm = Matrix.Translation((x, 0.0, 0.205))
    p.add(lathe([(0.07, -0.016), (0.083, -0.012), (0.087, 0.0), (0.083, 0.012), (0.071, 0.016)], 40), "trousers", cm, smooth=True)
    stitch(p, ring_pts(cm, 0.0875, 30, 0.0), "trousers_dark", 0.011, 0.007, 0.002)


def leg(side, cfg=None):
    dd = dict(D)
    dd["leg_fn"] = laces
    return shrink(vc.leg(side, dd))


# ---------------------------------------------------------------- prop

def wrench():
    """Adjustable wrench in arm_r: local Z along the handle, X across the jaws, Y through the thickness."""
    p = Part("wrench")
    g = vc.hand_c(-1, D)
    z = Vector((-0.24, -0.3, 0.92)).normalized()
    yv = Vector((0.3, -1.0, 0.0))
    yv = (yv - z * yv.dot(z)).normalized()
    x = yv.cross(z).normalized()
    m = Matrix(((x[0], yv[0], z[0], g[0]), (x[1], yv[1], z[1], g[1]), (x[2], yv[2], z[2], g[2]), (0, 0, 0, 1))) @ S(1.22)
    YS = 0.42
    hprof = [(0.003, -0.114), (0.012, -0.112), (0.019, -0.104), (0.0215, -0.092), (0.021, -0.06), (0.019, 0.0), (0.0175, 0.06), (0.017, 0.11),
             (0.019, 0.14), (0.025, 0.158), (0.03, 0.168)]
    p.add(lathe(hprof, 40, ys=YS, cap_bottom=True), "steel", m, smooth=True)
    for s in (-1, 1):
        th = 0.0215 * YS
        p.add(sphere(20, 8), "black_fine", m @ Matrix.Translation((0, s * (th - 0.0004), -0.093)) @ S(0.0078, 0.0016, 0.0078), smooth=True)
        p.add(bm_tube([m @ Vector((0.0098 * math.cos(t), s * th, -0.093 + 0.0098 * math.sin(t))) for t in [2 * math.pi * k / 20 for k in range(21)]],
                      0.0017, 6, cap=False), "steel_dark", smooth=True)
        p.add(sphere(20, 8), "steel_dark", m @ Matrix.Translation((0, s * (0.0172 * YS - 0.0003), 0.1)) @ S(0.0075, 0.0014, 0.034), smooth=True)
    hm = m @ Matrix.Translation((0, 0, 0.166)) @ M(rot=(0, 15, 0)) @ Matrix.Translation((0, 0, -0.166))
    p.add(bm_box(0.074, 0.024, 0.054, bevel=0.011, segs=3), "steel", hm @ Matrix.Translation((0, 0, 0.192)), smooth=True)
    p.add(bm_box(0.026, 0.024, 0.07, bevel=0.0075, segs=3), "steel", hm @ Matrix.Translation((-0.024, 0, 0.232)), smooth=True)     # fixed jaw
    p.add(bm_box(0.024, 0.021, 0.05, bevel=0.0065, segs=3), "steel", hm @ Matrix.Translation((0.025, 0, 0.234)), smooth=True)       # sliding jaw
    for k in range(4):                                                                        # its rack
        p.add(bm_tube([hm @ Vector((0.006 + 0.0075 * k, -0.0106, 0.207)), hm @ Vector((0.006 + 0.0075 * k, 0.0106, 0.207))], 0.0022, 6), "steel_dark", smooth=True)
    for s in (-1, 1):                                                                          # window for the worm
        p.add(bm_box(0.04, 0.0012, 0.03, bevel=0.0005, segs=1), "black_fine", hm @ Matrix.Translation((0.012, s * 0.0121, 0.183)), smooth=True)
        p.add(sphere(14, 8), "steel_dark", hm @ Matrix.Translation((-0.024, s * 0.0121, 0.19)) @ S(0.0058, 0.0016, 0.0058), smooth=True)
    wmx = hm @ Matrix.Translation((0.012, 0, 0.183)) @ M(rot=(0, 90, 0))
    p.add(lathe([(0.009, -0.0175), (0.0135, -0.0155), (0.0148, -0.012), (0.015, 0.0), (0.0148, 0.012), (0.0135, 0.0155), (0.009, 0.0175)], 48,
                rfun=ribs(18, 0.0024), cap_top=True, cap_bottom=True), "steel", wmx, smooth=True)
    for zz in (-0.007, 0.0, 0.007):
        p.add(bm_tube(ring_pts(wmx, 0.0164, 28, zz), 0.0011, 4, cap=False), "steel_dark", smooth=True)
    return p, g


def wrench_prop():
    p, g = wrench()
    return shrink(p), g * K


# ---------------------------------------------------------------- assemble (scaled joints)

CFG = dict(
    neck_z=NECK * K, shoulder_x=D["shoulder_x"] * K, shoulder_z=D["shoulder_z"] * K, hip_x=D["hip_x"] * K, hip_z=D["hip_z"] * K,
    body=body, head=head, arm=arm, leg=leg, props=[("wrench", "arm_r", wrench_prop)],
    closeup_z=HD.hc.z * K - 0.07,
    shots=[("back", (0, 0.12, 0.6), 155, 10, 2.0), ("wrench", (-0.27, -0.2, 0.6), -30, 8, 1.0), ("side", (0, 0.05, 0.62), 80, 8, 2.1), ("hairback", (0, 0.05, 0.98), 150, 18, 1.4)],
)


def checks():
    """Numbers for the report: wrench clearance from the body, pack contents vs the head."""
    import bpy
    G2 = SHIRT
    w = bpy.data.objects.get("wrench")
    if w:
        worst = 9.0
        for v in w.data.vertices:
            q = (w.matrix_world @ v.co) / K
            R = G2.rad(q.z) + 0.04
            worst = min(worst, math.sqrt(q.x ** 2 + (q.y / G2.ys) ** 2) - R)
        print("CHECK wrench clearance outside vest+straps (design m):", round(worst, 4))
    b = bpy.data.objects.get("body")
    h = bpy.data.objects.get("head")
    if b and h:
        from mathutils.kdtree import KDTree
        hv = [h.matrix_world @ v.co for v in h.data.vertices]
        kd = KDTree(len(hv))
        for i, q in enumerate(hv):
            kd.insert(q, i)
        kd.balance()
        best = min((kd.find(b.matrix_world @ v.co)[2] for v in b.data.vertices if (b.matrix_world @ v.co).y > 0.15 * K), default=9)
        print("CHECK closest pack/back vertex to any head vertex (m):", round(best, 4))
        from collections import Counter
        for ob in (b, h):
            cnt = Counter()
            for f in ob.data.polygons:
                cnt[ob.data.materials[f.material_index].name] += len(f.vertices) - 2
            print("TRIS", ob.name, cnt.most_common(8))
        hc = h.matrix_world @ Vector((0, 0, (HD.hc.z - NECK) * K))
        mm = 0.07 * K
        a, bb, c = HD.a * K + mm, HD.b * K + mm, HD.c * K + mm
        worst = 9.0
        for v in b.data.vertices:
            q = b.matrix_world @ v.co
            if q.y < 0.15 * K or q.z < 0.62 * K:
                continue
            d = q - hc
            worst = min(worst, math.sqrt((d.x / a) ** 2 + (d.y / bb) ** 2 + (d.z / c) ** 2))
        print("CHECK pack contents vs head+hair ellipsoid (>1 is clear):", round(worst, 3))


def main():
    r = vc.build("tinker", CFG)
    checks()
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
