"""Pip, the little serpent mentor who teaches the player Python, restyled in the soft Animal
Crossing style of Marlo the fisher (2026-10-23). The cutest thing in the game: a plump, smooth
Pip-green snake coiled on the ground with his neck upright, a cream belly band with soft scute
grooves running from his chin down the throat and along the underside of the coil, a row of
darker green spots down his back, and a big round baby-animal head with the house black oval
eyes (bigger than the villagers'), blush, two tiny nostrils and a tiny smile. No fangs.
Accessory: a little navy mortarboard (stitched skull cap, rounded board, button, cord and a
gold fringed tassel), part of pip_head.

Node format (the game depends on it, see ART.md "pip.glb"): pip_head and seg_01 (neck) ..
seg_08 (tail tip), all top-level, each with its origin at its own centre (the head at the
head centre, each segment on the body axis at the middle of its length). The game bobs the
head (position.y +-0.03, rotation.z +-0.12) and pulses each segment's scale by +-4% round its
origin, so every segment runs on past its ends in a full-radius collar and a rounded dome hidden
inside its neighbours, and the neck runs well up inside the head. About 0.62 m tall coiled
upright (the game scales him by 1.6). Built with helpers from villagers_common.py; his own
main assembles the parts and calls common.finish (vc.build only assembles chibis)."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bpy
import bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube
from villagers_common import frame, S, sphere, lathe, stitch, ring_pts, polyline_at, plen
from mathutils import Vector, Matrix

vc.palette({
    "pip": "#6CC46A", "pip_dark": "#4E9E55", "belly": "#F3E8C2",
    "blush_pip": "#F2959A", "board": "#3D4C82", "board_dark": "#2D3963", "board_thread": "#8E9BCB",
    "tassel": "#EDBD4E", "tassel_dark": "#C99632",
}, gloss={"eye_dark": 0.25, "pip": 0.6, "pip_dark": 0.6, "belly": 0.65})

SEGS = 40                 # vertices round the body
BAND = 46.0               # belly band half-width in degrees (faces whose middle is inside it)
BOUNDS = [0.0, 0.1, 0.2, 0.31, 0.44, 0.57, 0.7, 0.84, 1.0]   # segment ends (fraction of length)
COLLAR = 0.008            # full-radius run past each segment end before its dome starts


# ---------------------------------------------------------------- the body path

def catmull(points, per=8):
    pts = [Vector(p) for p in points]
    pts = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(per):
            t = k / per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-2])
    return out


def radius_at(f):
    """Body thickness, f = 0 at the neck, 1 at the tail tip: a slim neck swelling into a plump coil."""
    if f < 0.32:
        u = f / 0.32
        return 0.059 + 0.028 * (u * u * (3 - 2 * u))
    u = (f - 0.32) / 0.68
    return 0.012 + 0.075 * (1 - u) ** 0.95


def body_path():
    """The old coil, kept: the neck stands upright in the middle, drops behind into a loop round
    his left side to the front, and the tail tip curls up at his front right."""
    # the neck leaves the vertical in a wide quarter-circle (radius ~0.17) so the inside of the
    # bend never creases
    ctrl = [(0, 0.0, 0.43), (0, 0.003, 0.35), (0, 0.02, 0.26), (-0.004, 0.043, 0.175), (-0.02, 0.105, 0.115)]
    cx, cy, R = 0.0, 0.028, 0.178
    for a in (110, 85, 58, 30, 0, -30, -62, -92, -118):
        ctrl.append((cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a)), 0.0))
    ctrl += [(-0.14, -0.1, 0.0), (-0.186, -0.046, 0.045), (-0.2, 0.01, 0.105)]
    def lengths(ps):
        L = [0.0]
        for a, b in zip(ps, ps[1:]):
            L.append(L[-1] + (b - a).length)
        return L

    # lift the ground control points to the body radius there, so the spline settles onto the
    # ground smoothly instead of being clipped flat (which creased the neck's bend)
    per = 30
    for _ in range(2):
        dense = catmull(ctrl, per)
        L = lengths(dense)
        ctrl = [(x, y, max(z, radius_at(L[i * per] / L[-1]))) for i, (x, y, z) in enumerate(ctrl)]
    dense = catmull(ctrl, per)
    L = lengths(dense)
    for p, l in zip(dense, L):                     # rest the coil on the ground
        p.z = max(p.z, radius_at(l / L[-1]))
    L = lengths(dense)
    total = L[-1]
    n = int(total / 0.0035)
    pts, j = [], 0
    for k in range(n + 1):
        target = total * k / n
        while j < len(L) - 2 and L[j + 1] < target:
            j += 1
        t = (target - L[j]) / max(L[j + 1] - L[j], 1e-9)
        pts.append(dense[j].lerp(dense[j + 1], t))
    ss = [total * k / n for k in range(n + 1)]
    for p, s in zip(pts, ss):
        p.z = max(p.z, radius_at(s / total))
    return pts, ss


class Body:
    """The swept body: points, tangents and a belly direction at every sample, so all eight
    segments share one surface (same rings, same belly band columns, same grooves)."""

    def __init__(self):
        self.P, self.s = body_path()
        self.total = self.s[-1]
        self.step = self.s[1] - self.s[0]
        self.period = self.step * 6               # scute groove spacing on the belly
        n = len(self.P)
        T = []
        for i in range(n):
            a, b = self.P[max(i - 1, 0)], self.P[min(i + 1, n - 1)]
            T.append((b - a).normalized())
        self.T = T
        # belly: the front while the body stands upright, the ground once it lies down
        B = []
        for t in T:
            v = abs(t.z)
            pref = Vector((0.0, -v, -(1 - v)))
            b = pref - t * pref.dot(t)
            if B and (b.length < 1e-3 or b.dot(B[-1]) < 0):
                b = B[-1] - t * B[-1].dot(t)
            B.append(b.normalized())
        for _ in range(6):                        # relax so it never twists suddenly
            B2 = []
            for i in range(n):
                b = B[max(i - 2, 0)] + B[max(i - 1, 0)] + B[i] * 2 + B[min(i + 1, n - 1)] + B[min(i + 2, n - 1)]
                b = b - T[i] * b.dot(T[i])
                B2.append(b.normalized())
            B = B2
        self.B = B

    def r(self, s):
        return radius_at(min(max(s / self.total, 0.0), 1.0))

    def at(self, s):
        """(point, tangent, belly) at arc length s, extrapolated straight beyond the ends."""
        if s <= 0:
            return self.P[0] + self.T[0] * s, self.T[0], self.B[0]
        if s >= self.total:
            return self.P[-1] + self.T[-1] * (s - self.total), self.T[-1], self.B[-1]
        i = min(int(s / self.step), len(self.P) - 2)
        f = (s - self.s[i]) / self.step
        p = self.P[i].lerp(self.P[i + 1], f)
        t = self.T[i].lerp(self.T[i + 1], f).normalized()
        b = self.B[i].lerp(self.B[i + 1], f)
        b = (b - t * b.dot(t)).normalized()
        return p, t, b

    def surf(self, s, theta, out=0.0):
        """Point and outward normal on the body surface at arc length s, angle theta from the belly."""
        p, t, b = self.at(s)
        side = t.cross(b)
        d = b * math.cos(theta) + side * math.sin(theta)
        return p + d * (self.r(s) + out), d, t

    def groove(self, s, theta):
        """Soft scute grooves across the belly band, fading out at the band edges."""
        a = abs(math.degrees(theta))
        if a >= BAND:
            return 0.0
        w = math.cos(math.radians(a) / math.radians(BAND) * math.pi / 2) ** 2
        g = max(0.0, math.cos(2 * math.pi * s / self.period)) ** 12
        return 0.03 * self.r(s) * w * g


BODY = None
SEAMS = {}
HIDDEN = {}
VISIBLE = {}


def tube_segment(part, s0, s1, tip=False):
    """One body segment: rings from s0 to s1 on the shared surface, a full-radius collar past each
    end and a rounded dome that hides inside the neighbour (the tail tip gets a real round end)."""
    Bd = BODY
    rings = []                                     # (s, None on the surface, True) or as below
    r0, r1 = Bd.r(s0), Bd.r(s1)
    dome = (78, 64, 50, 36, 22, 10)
    # hidden collar and dome rings: (s, shrink factor of the local surface radius, grooved)
    for th in dome:
        rings.append((s0 - COLLAR - 0.85 * r0 * math.sin(math.radians(th)), 0.995 * math.cos(math.radians(th)), True))
    rings.append((s0 - COLLAR, 0.995, True))
    rings.append((s0, None, True))
    i0 = int(s0 / Bd.step) + 1
    for i in range(i0, len(Bd.s)):
        s = Bd.s[i]
        if s >= s1 - Bd.step * 0.3:
            break
        if s > s0 + Bd.step * 0.3:
            rings.append((s, None, True))
    rings.append((s1, None, True))
    end = len(rings) - 1
    if tip:
        for th in reversed(dome):
            rings.append((s1 + r1 * 0.95 * math.sin(math.radians(th)), r1 * math.cos(math.radians(th)), None))
        pole_s = s1 + r1 * 0.95
    else:
        rings.append((s1 + COLLAR, 0.995, True))
        for th in reversed(dome):
            rings.append((s1 + COLLAR + 0.85 * r1 * math.sin(math.radians(th)), 0.995 * math.cos(math.radians(th)), True))
        pole_s = s1 + COLLAR + 0.85 * r1
    start_s = s0 - COLLAR - 0.85 * r0

    def idx(name):
        if name not in part.mats:
            part.mats.append(name)
        return part.mats.index(name)

    m_green, m_belly = idx("pip"), idx("belly")
    bm = part.bm
    base = len(bm.verts)
    nd = len(dome) + 1
    # boundary rings sit on the neighbour's boundary ring, so their baked AO gets a dark line:
    # remember them (and the ring just inside) to copy the AO across after the bake
    SEAMS.setdefault(part.name, []).extend([(base + nd * SEGS, base + (nd + 1) * SEGS)] +
                                           ([] if tip else [(base + end * SEGS, base + (end - 1) * SEGS)]))
    HIDDEN.setdefault(part.name, []).append((base, base + nd * SEGS))
    if not tip:
        HIDDEN[part.name].append((base + (end + 1) * SEGS, base + len(rings) * SEGS))
    VISIBLE[part.name] = (len(bm.faces) + nd * SEGS, len(bm.faces) + end * SEGS)    # its outer skin's quads
    vr = []
    for s, rad, grooved in rings:
        p, t, b = Bd.at(s)
        side = t.cross(b)
        ring = []
        for k in range(SEGS):
            th = 2 * math.pi * k / SEGS
            if th > math.pi:
                th -= 2 * math.pi
            d = b * math.cos(th) + side * math.sin(th)
            if grooved is None:                   # the tail tip's own round end
                rr = rad
            else:                                 # on the surface, or shrunk inside the neighbour
                rr = (Bd.r(s) - Bd.groove(s, th)) * (1.0 if rad is None else rad)
            ring.append(bm.verts.new(p + d * rr))
        vr.append(ring)

    def band(k):
        mid = 2 * math.pi * (k + 0.5) / SEGS
        if mid > math.pi:
            mid -= 2 * math.pi
        return m_belly if abs(math.degrees(mid)) < BAND else m_green

    faces = []
    for a, c in zip(vr, vr[1:]):
        for k in range(SEGS):
            j = (k + 1) % SEGS
            f = bm.faces.new((a[k], a[j], c[j], c[k]))
            f.material_index = band(k)
            f.smooth = True
            faces.append(f)
    # poles closing both ends
    v0 = bm.verts.new(Bd.at(start_s)[0])
    v1 = bm.verts.new(Bd.at(pole_s)[0])
    for k in range(SEGS):
        j = (k + 1) % SEGS
        f = bm.faces.new((vr[0][j], vr[0][k], v0))
        f.material_index, f.smooth = band(k), True
        faces.append(f)
        f = bm.faces.new((vr[-1][k], vr[-1][j], v1))
        f.material_index, f.smooth = band(k), True
        faces.append(f)
    bmesh.ops.recalc_face_normals(bm, faces=faces)


def surf_matrix(p, n, t):
    """Matrix at p with local Z = n (outward) and local X along t (the body direction)."""
    z = n.normalized()
    x = (t - z * t.dot(z)).normalized()
    y = z.cross(x)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = p
    return m


def spots(part, s0, s1):
    """Darker green spots down the back: a long oval on the spine alternating with a pair of
    small ones on the shoulders of the back, kept clear of the segment ends."""
    Bd = BODY
    # space them by length measured along the spine on the surface, so they stay evenly apart
    # on the squeezed inside of the neck's bend
    U = [0.0]
    q0 = Bd.surf(Bd.s[0], math.pi)[0]
    for sv in Bd.s[1:]:
        q = Bd.surf(sv, math.pi)[0]
        U.append(U[-1] + (q - q0).length)
        q0 = q

    def u_of(sv):
        i = min(int(sv / Bd.step), len(U) - 2)
        return U[i] + (U[i + 1] - U[i]) * (sv - Bd.s[i]) / Bd.step

    def s_of(u):
        for i in range(len(U) - 1):
            if U[i + 1] >= u:
                return Bd.s[i] + Bd.step * (u - U[i]) / max(U[i + 1] - U[i], 1e-9)
        return Bd.total

    per = 0.052
    ua, ub = u_of(s0), u_of(s1)
    k = 0
    u = 0.035
    while u < U[-1] - 0.05:
        s = s_of(u)
        r = Bd.r(s)
        m = 0.012
        if ua + m < u < ub - m and s / Bd.total < 0.93:
            if k % 2 == 0:
                p, n, t = Bd.surf(s, math.pi, -0.0012)
                part.add(sphere(24, 12), "pip_dark", surf_matrix(p, n, t) @ S(0.34 * r, 0.22 * r, 0.0032), smooth=True)
            else:
                for sg in (-1, 1):
                    p, n, t = Bd.surf(s, sg * math.radians(128), -0.0012)
                    part.add(sphere(20, 10), "pip_dark", surf_matrix(p, n, t) @ S(0.17 * r, 0.115 * r, 0.003), smooth=True)
        u += per / 2
        k += 1


def segments(model):
    objs = []
    for i in range(8):
        name = "seg_%02d" % (i + 1)
        s0, s1 = BOUNDS[i] * BODY.total, BOUNDS[i + 1] * BODY.total
        part = Part(name)
        tube_segment(part, s0, s1, tip=(i == 7))
        spots(part, s0, s1)
        origin = BODY.at((s0 + s1) / 2)[0]
        objs.append(part.to_object(model, origin=tuple(origin), sharp_angle=80))
    return objs


# ---------------------------------------------------------------- head

HD = vc.Head((0.0, -0.012, 0.452), 0.156, 0.138, 0.128)


def eye(hp, s, x=0.066, z=-0.004, w=0.026, h=0.035):
    """The house eye at baby-animal size: a glossy black oval with one white highlight (upper right)."""
    ex = s * x
    HD.on_face(hp, "eye_dark", ex, z, w, h, 0.009, out=0.0, u=32, v=18)
    HD.on_face(hp, "white", ex + 0.3 * w, z + 0.42 * h, 0.27 * w, 0.3 * w, 0.003, out=0.0068, u=16, v=8)


def mortarboard(hp):
    """A little navy mortarboard tipped back and to his left: a snug, puffy skull cap with a darker
    piped hem along the line where it meets the head and a ring of stitching, a rounded square
    board with a stitched edge, a button, and a cord running to the front left corner where a gold
    tassel (wrapped knot, fringe of strands) hangs."""
    cm = Matrix.Translation(HD.hc + Vector((0.004, 0.014, HD.c - 0.026))) @ M(rot=(-9, 7, 0))
    # skull cap
    band = [(0.084, -0.042), (0.089, -0.022), (0.092, 0.0), (0.092, 0.017), (0.088, 0.028), (0.08, 0.034)]
    hp.add(lathe(band, 64, ys=0.9, cap_top=True), "board", cm, smooth=True)

    def inside(q):
        d = q - HD.hc
        return (d.x / HD.a) ** 2 + (d.y / HD.b) ** 2 + (d.z / HD.c) ** 2 - 1.0

    hem = []
    for k in range(65):
        a = 2 * math.pi * k / 64
        lo, hi = -0.04, 0.03
        for _ in range(30):                       # find where the cap meets the head at this angle
            mid = (lo + hi) / 2
            if inside(cm @ Vector((0.092 * math.cos(a), 0.9 * 0.092 * math.sin(a), mid))) < 0:
                lo = mid
            else:
                hi = mid
        hem.append(cm @ Vector((0.093 * math.cos(a), 0.9 * 0.093 * math.sin(a), lo + 0.001)))
    hp.add(bm_tube(hem, 0.0042, 10, cap=False), "board_dark", smooth=True)
    st = [cm @ Vector((0.0932 * math.cos(a), 0.9 * 0.0932 * math.sin(a), 0.017)) for a in [2 * math.pi * k / 72 for k in range(73)]]
    stitch(hp, st, "board_thread", 0.009, 0.006, 0.0018)
    # the board
    bmx = cm @ M((0, 0, 0.041), (0, 0, 22))
    hp.add(bm_box(0.2, 0.2, 0.014, bevel=0.0065, segs=4), "board", bmx, smooth=True)
    e = 0.086
    sq = [bmx @ Vector((x, y, 0.0072)) for x, y in ((-e, -e), (e, -e), (e, e), (-e, e), (-e, -e))]
    stitch(hp, sq, "board_thread", 0.009, 0.006, 0.0016)
    hp.add(sphere(20, 10), "board_dark", bmx @ Matrix.Translation((0, 0, 0.007)) @ S(0.013, 0.013, 0.0065), smooth=True)
    hp.add(sphere(16, 8), "tassel", bmx @ Matrix.Translation((0, 0, 0.0115)) @ S(0.007, 0.007, 0.0035), smooth=True)
    # cord over the board to the corner and down
    corner_dir = Matrix.Rotation(math.radians(-45), 4, "Z")      # the board's front-left corner
    cord = []
    for x, z in ((0.0, 0.0125), (0.04, 0.009), (0.08, 0.0085), (0.126, 0.0085), (0.1375, 0.003), (0.1415, -0.012), (0.1415, -0.034)):
        cord.append(bmx @ (corner_dir @ Vector((x, 0.0, z))))
    hp.add(bm_tube(cord, 0.0028, 8), "tassel", smooth=True)
    # tassel hanging from the cord end, swinging a little out from his head where it rests on it
    top = cord[-1]
    out = Vector(((top - HD.hc).x, (top - HD.hc).y, 0.0)).normalized()
    sh = Matrix.Identity(4)
    sh[0][2], sh[1][2] = -0.3 * out.x, -0.3 * out.y          # lower points lean outward
    tm = Matrix.Translation(top) @ sh

    def T(v):
        return tm @ Vector(v)

    hp.add(sphere(18, 12), "tassel_dark", tm @ Matrix.Translation((0, 0, -0.006)) @ S(0.0085, 0.0085, 0.0095), smooth=True)
    hp.add(lathe([(0.0062, -0.014), (0.0075, -0.013), (0.0075, -0.006), (0.0062, -0.005)], 20), "tassel_dark", tm, smooth=True)
    fr = [(0.0058, -0.014), (0.0075, -0.022), (0.0092, -0.032), (0.01, -0.04), (0.0086, -0.043), (0.0, -0.044)]
    hp.add(lathe(fr, 24), "tassel", tm, smooth=True)
    check = [T((0, 0, -0.044))]
    for k in range(12):
        a = 2 * math.pi * k / 12
        c, s = math.cos(a), math.sin(a)
        strand = [T((c * 0.0062, s * 0.0062, -0.014)), T((c * 0.0086, s * 0.0086, -0.028)), T((c * 0.0102, s * 0.0102, -0.043))]
        hp.add(bm_tube(strand, [0.0019, 0.0021, 0.0019], 6), "tassel", smooth=True)
        check += [T((c * 0.0122, s * 0.0122, -0.043)), T((c * 0.0108, s * 0.0108, -0.028))]
    return check


def chin(hp):
    """Cream chin and throat lying on the skull (a softly domed patch, not a jaw), carrying the
    belly band up from the neck to just under the smile."""
    bm = bmesh.new()
    zb, z0, half = -0.97 * HD.c, -0.066, 80.0
    cols, rows = 48, 12
    grid = []
    for i in range(cols + 1):
        u = -1 + 2 * i / cols
        top = zb + (z0 - zb) * math.sqrt(max(1 - u * u, 0.0))
        col = []
        for j in range(rows + 1):
            v = j / rows
            z = zb + (top - zb) * v
            out = 0.0012 + 0.0045 * math.sin(math.pi * min(v * 1.15, 1.0)) * (1 - u * u)
            col.append(bm.verts.new(HD.spt(-90 + half * u, z, out)[0]))
        grid.append(col)
    for i in range(cols):
        for j in range(rows):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    bm.normal_update()
    if sum((f.calc_center_median() - HD.hc).dot(f.normal) for f in bm.faces) < 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces[:])
    hp.add(bm, "belly", None, smooth=True)


def head():
    hp = Part("pip_head")
    H = HD.H
    HD.skull(hp, "pip")
    chin(hp)
    for s in (-1, 1):
        eye(hp, s)
    HD.blush(hp, x=0.104, z=-0.04, w=0.025, h=0.015, mat="blush_pip")
    for s in (-1, 1):                                              # two tiny nostrils
        HD.on_face(hp, "eye_dark", s * 0.017, -0.03, 0.0048, 0.0036, 0.003, out=0.0, u=12, v=8)
    # tiny smile
    w, z = 0.017, -0.055
    sm = [HD.fpt(t * w, z + 0.0085 * (t * t), 0.0015)[0] for t in [-1 + 2 * k / 12 for k in range(13)]]
    hp.add(bm_tube(sm, [0.0024] + [0.0033] * 11 + [0.0024], 8), "eye_dark", smooth=True)
    # three darker spots on the back of the head, matching the body's pattern
    for phi, zz, sx, sy in ((90, 0.0, 0.021, 0.015), (64, 0.034, 0.013, 0.01), (116, 0.034, 0.013, 0.01)):
        p, n = HD.spt(phi, zz, -0.0012)
        hp.add(sphere(20, 10), "pip_dark", frame(p, n) @ S(sx, sy, 0.003), smooth=True)
    tass = mortarboard(hp)
    # the tassel must not touch the head
    v = min((((q - HD.hc).x / HD.a) ** 2 + ((q - HD.hc).y / HD.b) ** 2 + ((q - HD.hc).z / HD.c) ** 2) for q in tass)
    print("PIP tassel: lowest head-ellipsoid value %.3f (must be > 1)" % v)
    return hp


# ---------------------------------------------------------------- main

def check_hidden(objs):
    """Every hidden collar/dome vertex must lie inside the neighbouring segment."""
    from mathutils.bvhtree import BVHTree
    bpy.context.view_layer.update()
    segs = [o for o in objs if o.name.startswith("seg_")]
    trees = {}
    for o in segs:
        me = o.data
        mw = o.matrix_world
        f0, f1 = VISIBLE[o.name]
        trees[o.name] = BVHTree.FromPolygons([mw @ v.co for v in me.vertices],
                                             [tuple(me.polygons[i].vertices) for i in range(f0, f1)])
    for i, o in enumerate(segs):
        worst = (-1.0, None)
        mw = o.matrix_world
        for j, (a, b) in zip((i - 1, i + 1), HIDDEN[o.name]):    # start dome -> previous, end dome -> next
            if not 0 <= j < len(segs):
                continue
            t = trees[segs[j].name]
            if True:
                for vi in range(a, b):
                    q = mw @ o.data.vertices[vi].co
                    loc, nrm, _, dist = t.find_nearest(q)
                    if loc is not None and dist < 0.02:
                        sd = (q - loc).dot(nrm)
                        if sd > worst[0]:
                            worst = (sd, tuple(round(c, 3) for c in q))
        print("PIP hidden check %s: worst protrusion %.5f m at %s" % (o.name, worst[0], worst[1]))


def fix_seams(objs):
    """After the AO bake: give each segment's boundary ring the AO of the ring just inside it
    (the coincident neighbour darkens it into a visible line otherwise)."""
    for o in objs:
        if o.name not in SEAMS:
            continue
        me = o.data
        ca = me.color_attributes["Col"]
        val, cnt = {}, {}
        for li, lp in enumerate(me.loops):
            val[lp.vertex_index] = val.get(lp.vertex_index, 0.0) + ca.data[li].color[0]
            cnt[lp.vertex_index] = cnt.get(lp.vertex_index, 0) + 1
        src = {}
        for b0, n0 in SEAMS[o.name]:
            for k in range(SEGS):
                src[b0 + k] = val[n0 + k] / cnt[n0 + k]
        for li, lp in enumerate(me.loops):
            v = src.get(lp.vertex_index)
            if v is not None:
                ca.data[li].color = (v, v, v, 1.0)


def main():
    global BODY
    model = common.reset()
    BODY = Body()
    print("PIP body length %.3f m, %d rings" % (BODY.total, len(BODY.P)))
    objs = [head().to_object(model, origin=tuple(HD.hc), sharp_angle=80)]
    objs += segments(model)
    check_hidden(objs)
    vc.tune_materials()
    r = common.finish("pip", objs, tint=fix_seams, azim=-28, elev=12, lens=60, margin=1.25, sun_azim=30)
    vc.shot(os.path.join(common.OUT_PREV, "pip_closeup.png"), (0, -0.02, 0.43), -16, 5, 1.05)
    vc.shot(os.path.join(common.OUT_PREV, "pip_back.png"), (0, 0.02, 0.2), 150, 28, 1.9)
    # worst case of the game's idle animation (after export/save): head up 3 cm and tilted,
    # neighbouring segments pulsed in opposite directions; must show no gaps
    objs[0].location.z += 0.03
    objs[0].rotation_euler.y = 0.12
    for k, o in enumerate(objs[1:]):
        o.scale = (1.04,) * 3 if k % 2 == 0 else (0.96,) * 3
    vc.shot(os.path.join(common.OUT_PREV, "pip_pose.png"), (0, 0, 0.25), -28, 14, 1.9)
    objs[0].location.z -= 0.03
    objs[0].rotation_euler.y = 0.0
    for o in objs[1:]:
        o.scale = (1.0, 1.0, 1.0)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    r["size_xyz"] = tuple(round(max(getattr(q, a) for q in pts) - min(getattr(q, a) for q in pts), 3) for a in "xyz")
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    r["origins"] = {o.name: tuple(round(c, 3) for c in o.location) for o in objs}
    r["parents"] = {o.name: (o.parent.name if o.parent else None) for o in objs}
    print("VILLAGER pip", r)
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
