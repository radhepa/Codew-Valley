"""Bram the innkeeper (the tavernkeeper, the first villager), in the soft Animal Crossing style
of Marlo the fisher (2026-10-23). Round and cheerful: a big round belly that pushes forward, a
green vest with a piped V-neck, brass buttons, a welt watch pocket with a gold chain and a little
brass key fob, a satin back with a buckled cinch strap; a white half apron tied at the waist with
a bow at the back, hemmed and stitched, with a split front pocket and a pencil; a red-striped bar
towel slung over his left shoulder; rolled cream shirt sleeves over bare forearms; brown trousers
with turn-ups and laced shoes. Balding, with a horseshoe of chunky reddish-brown locks (palette
`hair`, shared with his sister Hazel the baker), bushy brows, a big sculpted handlebar moustache
and a warm open smile.
Prop: `mug` (arm_r, origin at the grip): a coopered wooden tankard of alternating staves on a
dark core, two pewter hoops with rivets, a rounded rim and dark inside, a flattened handle with a
pewter thumb rest and straps, and a striped polishing cloth draped over the rim. In the game
arm_r swings forward (rotation.x = sin(t*3)*0.3 - 0.6), so the mug is pre-tilted 25 degrees
forward to stand roughly upright mid-swing; the script checks it never enters the belly.
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
    "vest": "#4F7F5C", "vest_dark": "#3A6146", "vest_light": "#A4C69F",
    "vest_back": "#CDB88C", "vest_back_dark": "#A68F60",
    "shirt": "#F2E8D2", "shirt_shade": "#DCCCAC",
    "apron": "#F8F5EE", "apron_shade": "#E6DECF", "apron_thread": "#CFC2AA",
    "towel": "#F5F0E6", "towel_stripe": "#C25A43",
    "trousers": "#6C6052", "trousers_dark": "#564B3F",
    "shoe": "#5C3A27", "lace": "#EADFC4",
    "tongue": "#D97B70",
    "mug_wood": "#A8743F", "mug_wood_l": "#BC8A50", "mug_dark": "#6A4426", "mug_in": "#4E321E", "pewter": "#A9AEB2",
    "pencil": "#E2B54C", "pencil_wood": "#E8CC9C", "eraser": "#E59C93",
}, metal={"pewter": (0.7, 0.35)}, gloss={"mug_wood": 0.55, "mug_wood_l": 0.55})


# ---------------------------------------------------------------- helpers

def chaikin(pts, n=2):
    pts = [Vector(p) for p in pts]
    for _ in range(n):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out += [a * 0.75 + b * 0.25, a * 0.25 + b * 0.75]
        out.append(pts[-1])
        pts = out
    return pts


def sheet(part, f, nu, nv, mat, inside=None, back=False, smooth=True):
    """Grid surface f(u, v) -> point, u, v in 0..1. Oriented to face away from `inside` (a point or
    a function of the face centre), or toward it when back=True."""
    bm = bmesh.new()
    V = [[bm.verts.new(f(i / nu, j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    faces = []
    for j in range(nv):
        for i in range(nu):
            faces.append(bm.faces.new((V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i])))
    if inside is not None:
        f0 = faces[(nv // 2) * nu + nu // 2]
        f0.normal_update()
        c = f0.calc_center_median()
        ip = Vector(inside(c) if callable(inside) else inside)
        if (f0.normal.dot(c - ip) < 0) != back:
            for fc in faces:
                fc.normal_flip()
    part.add(bm, mat, None, smooth)


# ---------------------------------------------------------------- body (belly, vest, apron, towel)

BUMP, BZ, BW = 0.065, 0.43, 0.13        # the belly: extra radius at the front, its height and spread


class Belly(vc.Garment):
    """Garment with a round belly pushing out at the front (phi -90)."""

    def bump(self, phi, z):
        f = max(0.0, -math.sin(math.radians(phi)))
        return BUMP * f ** 1.5 * math.exp(-((z - BZ) / BW) ** 2)

    def rr(self, phi, z):
        return self.rad(z) + self.bump(phi, z)

    def pt(self, phi, z, out=0.0):
        r = self.rr(phi, z) + out
        a = math.radians(phi)
        return Vector((r * math.cos(a), self.ys * r * math.sin(a), z))

    def normal(self, phi, z, lift=None):
        tp = self.pt(phi + 0.5, z) - self.pt(phi - 0.5, z)
        tz = self.pt(phi, z + 0.004) - self.pt(phi, z - 0.004)
        return tp.cross(tz).normalized()

    def mesh(self, part, matname, segs=72, rfun=None, cap_top=True, cap_bottom=False):
        part.add(lathe(self.profile, segs, rfun=lambda a, z: self.bump(math.degrees(a), z), ys=self.ys, cap_top=cap_top),
                 matname, smooth=True)

    def panel(self, part, phi0, phi1, z0, z1, matname, out=0.007, segs=8):
        sheet(part, lambda u, v: self.pt(phi0 + (phi1 - phi0) * u, z0 + (z1 - z0) * v, out), max(segs, 2), 6, matname,
              inside=lambda c: (0, 0, c.z))


BODY = Belly([(0.215, 0.27), (0.243, 0.295), (0.262, 0.335), (0.27, 0.385), (0.27, 0.43), (0.265, 0.48), (0.252, 0.535),
              (0.232, 0.59), (0.208, 0.64), (0.181, 0.685), (0.152, 0.725), (0.122, 0.765), (0.094, 0.8), (0.07, 0.826),
              (0.05, 0.846), (0.032, 0.86)], ys=0.88)
SLEEVE_R = 0.078
SHOULDER = (0.2, 0.715)       # shoulder x, z
COLLAR_R = 0.105


def inside_body(p, pad=0.0):
    """Is p inside the body garment (or the shirt collar)?"""
    z = p.z
    if BODY.profile[0][1] <= z <= BODY.profile[-1][1]:
        phi = math.degrees(math.atan2(p.y / BODY.ys, p.x))
        if math.hypot(p.x, p.y / BODY.ys) < BODY.rr(phi, z) + pad:
            return True
    return 0.81 <= z <= 0.88 and math.hypot(p.x, p.y) < COLLAR_R + pad


# --- apron: hangs from the waistband over the belly, then falls nearly straight

AP_TOP, AP_BOT, AP_OUT = 0.535, 0.17, 0.014


def apron_r(phi, z, out=AP_OUT):
    r = BODY.rr(phi, z)
    if z < BZ:
        r = max(r, BODY.rr(phi, BZ) - 0.1 * (BZ - z))
    return r + out


def apron_pt(phi, z, out=AP_OUT):
    r = apron_r(phi, z, out)
    a = math.radians(phi)
    return Vector((r * math.cos(a), BODY.ys * r * math.sin(a), z))


def apron_edges(z):
    k = (AP_TOP - z) / (AP_TOP - AP_BOT)
    return -150.0 - 5 * k, -30.0 + 5 * k


def apron(p):
    def f(u, v, out):
        z = AP_BOT + (AP_TOP - AP_BOT) * v
        a0, a1 = apron_edges(z)
        return apron_pt(a0 + (a1 - a0) * u, z, out)
    axis = lambda c: (0, 0, c.z)
    sheet(p, lambda u, v: f(u, v, AP_OUT), 48, 28, "apron", inside=axis)
    sheet(p, lambda u, v: f(u, v, AP_OUT - 0.004), 48, 28, "apron_shade", inside=axis, back=True)
    # rolled hems: bottom and both sides, and a stitch line above the bottom hem
    bot = [f(k / 48, 0.0, AP_OUT - 0.001) for k in range(49)]
    p.add(bm_tube(bot, 0.0075, 10), "apron", smooth=True)
    for u in (0.0, 1.0):
        p.add(bm_tube([f(u, k / 16, AP_OUT - 0.001) for k in range(17)], 0.0065, 10), "apron", smooth=True)
    stitch(p, [f(0.02 + 0.96 * k / 40, 0.07, AP_OUT + 0.002) for k in range(41)], "apron_thread")
    for u in (0.03, 0.97):
        stitch(p, [f(u, 0.08 + 0.85 * k / 12, AP_OUT + 0.002) for k in range(13)], "apron_thread")
    # the split front pocket with a stitched divider and a pencil in the left-hand slot (his right)
    pz0, pz1, pa0, pa1 = 0.275, 0.385, -124.0, -56.0
    sheet(p, lambda u, v: apron_pt(pa0 + (pa1 - pa0) * u, pz0 + (pz1 - pz0) * v, AP_OUT + 0.007), 24, 8, "apron", inside=axis)
    sheet(p, lambda u, v: apron_pt(pa0 + (pa1 - pa0) * u, pz0 + (pz1 - pz0) * v, AP_OUT + 0.0035), 24, 8, "apron_shade",
          inside=axis, back=True)
    p.add(bm_tube([apron_pt(pa0 + (pa1 - pa0) * k / 24, pz1, AP_OUT + 0.006) for k in range(25)], 0.0055, 8), "apron", smooth=True)
    edge = ([apron_pt(pa0, pz1, AP_OUT + 0.006)] + [apron_pt(pa0, pz0 + (pz1 - pz0) * k / 6, AP_OUT + 0.006) for k in range(6, -1, -1)]
            + [apron_pt(pa0 + (pa1 - pa0) * k / 24, pz0, AP_OUT + 0.006) for k in range(25)]
            + [apron_pt(pa1, pz0 + (pz1 - pz0) * k / 6, AP_OUT + 0.006) for k in range(7)])
    p.add(bm_tube(edge, 0.004, 6, cap=False), "apron_shade", smooth=True)
    o = AP_OUT + 0.0095
    stitch(p, [apron_pt(pa0 + 3, pz1 - 0.02, o)] + [apron_pt(pa0 + 3, pz0 + 0.01, o)]
           + [apron_pt(pa0 + 3 + (pa1 - pa0 - 6) * k / 24, pz0 + 0.01, o) for k in range(25)] + [apron_pt(pa1 - 3, pz1 - 0.02, o)],
           "apron_thread")
    stitch(p, [apron_pt(pa0 + 2 + (pa1 - pa0 - 4) * k / 24, pz1 - 0.014, o + 0.001) for k in range(25)], "apron_thread")
    stitch(p, [apron_pt(-90, pz1 - 0.01, o), apron_pt(-90, pz0 + 0.01, o)], "apron_thread")
    # pencil: yellow hexagonal body, bare wood and graphite at the bottom (hidden), ferrule and eraser on top
    pb = apron_pt(-104, 0.33, AP_OUT + 0.0055)
    pt_ = pb + Vector((0.012, -0.004, 0.12))
    p.add(bm_tube([pb, pt_], 0.0072, 6), "pencil", smooth=False)
    dirp = (pt_ - pb).normalized()
    p.add(bm_tube([pt_, pt_ + dirp * 0.012], 0.0076, 16), "pewter", smooth=True)
    p.add(bm_tube([pt_ + dirp * 0.012, pt_ + dirp * 0.024], 0.0072, 16), "eraser", smooth=True)
    p.add(sphere(16, 8), "eraser", M(pt_ + dirp * 0.024, scale=0.0072), smooth=True)
    # waistband round the whole body, and the bow tied at the back (a little to his right)
    sheet(p, lambda u, v: BODY.pt(-180 + 360 * u, 0.525 + 0.032 * v, 0.017), 96, 3, "apron", inside=lambda c: (0, 0, c.z))
    for z in (0.525, 0.557):
        p.add(bm_tube(BODY.arc(-180, 180, z, 0.017, 96), 0.0035, 6, cap=False), "apron", smooth=True)
    bow(p, 108)


def bow(p, phi):
    K = BODY.pt(phi, 0.541, 0.03)
    n = BODY.normal(phi, 0.541)
    t = Vector((-n.y, n.x, 0)).normalized()          # along the surface, horizontal
    up = Vector((0, 0, 1))
    m = Matrix((t, n, up)).transposed()               # local x = t, y = outward, z = up
    mm = Matrix.Translation(K) @ m.to_4x4()
    flat = S(1, 0.5, 1)
    for s in (-1, 1):
        loop = [Vector((s * 0.07 * (1 - math.cos(a)) / 2, -0.012 * ((1 - math.cos(a)) / 2) ** 2, 0.03 * math.sin(a) + 0.012 * (1 - math.cos(a)) / 2))
                for a in [2 * math.pi * k / 28 for k in range(29)]]
        p.add(bm_tube(loop, 0.0105, 12, cap=False), "apron", mm @ flat, smooth=True)
        tail = [Vector((s * 0.008, 0.0, -0.008)), Vector((s * 0.024, -0.004, -0.06)), Vector((s * 0.036, -0.008, -0.11))]
        tp = chaikin(tail, 2)
        p.add(bm_tube(tp, [0.011 + 0.003 * k / (len(tp) - 1) for k in range(len(tp))], 12), "apron", mm @ flat, smooth=True)
    p.add(sphere(20, 12), "apron", mm @ S(0.02, 0.013, 0.019), smooth=True)
    p.add(bm_tube([Vector((0, 0.011, 0.016)), Vector((0, 0.013, -0.016))], 0.002, 4), "apron_thread", mm, smooth=True)


# --- towel slung over the left shoulder: a folded cloth ~2 cm thick riding on the shoulder ball,
# a short front flap to mid-chest (stripes and fringe on it) and a longer back flap

TX0, TX1 = 0.112, 0.288        # across the shoulder (x)
TZF, TZB = 0.625, 0.565        # bottoms of the front and back flaps
TC_Z = 0.70                    # ray centre height for the fold over the top
TOWEL_T = 0.021                # thickness
ARM_L_CAP = None               # (a, b, radius): upper sleeve of arm_l as a capsule


def on_shoulder(p):
    """Inside the body, the collar or the left shoulder and upper sleeve?"""
    if inside_body(p):
        return True
    a, b, r = ARM_L_CAP
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length < r


def surf(c, d, hi=0.6):
    """Distance from c (inside) along d to the surface of the body + shoulder."""
    lo = 0.0
    for _ in range(34):
        mid = (lo + hi) / 2
        if on_shoulder(c + d * mid):
            lo = mid
        else:
            hi = mid
    return lo


def towel_path(x, out, n=60):
    """Centre line of the cloth at x, lifted `out` off the surface: front flap bottom, up, over the
    rounded fold on top of the shoulder, down the back flap. Resampled to n+1 even points."""
    C = Vector((x, 0.0, TC_Z))
    arc = []
    for k in range(25):
        th = math.radians(8 + 164 * k / 24)
        d = Vector((0.0, -math.cos(th), math.sin(th)))
        arc.append(C + d * (surf(C, d) + out))
    front, back = [], []
    for k in range(1, 9):                       # flaps fall straight down, pushed out where the body swells
        for side, start, zb, lst in ((-1, arc[0], TZF, front), (1, arc[-1], TZB, back)):
            z = start.z + (zb - start.z) * k / 8
            c = Vector((x, 0.0, z))
            y = start.y
            if on_shoulder(c):
                y = side * max(abs(start.y), surf(c, Vector((0, side, 0))) + out)
            lst.append(Vector((x, y, z)))
    pts = list(reversed(front)) + arc + back
    pts = chaikin(pts, 1)
    L = plen(pts)
    return [polyline_at(pts, L * k / n) for k in range(n + 1)]


def towel(p):
    global ARM_L_CAP
    pv = vc.shoulder(1, CFG)
    ARM_L_CAP = (pv, pv + vc.arm_dir(1, CFG) * 0.13, SLEEVE_R * 1.04)
    NU, NV = 14, 60
    cols = {}

    def f(u, v, out):
        """u across, v along (0 = front flap bottom); the outer face puffs up in the middle."""
        x = TX0 + (TX1 - TX0) * u
        key = (round(u, 5), round(out, 5))
        if key not in cols:
            cols[key] = towel_path(x, out, NV)
        pts = cols[key]
        return polyline_at(pts, plen(pts) * v)

    def outer(u, v, extra=0.0):
        puff = 0.004 * math.sin(math.pi * u) ** 0.5
        return f(u, v, TOWEL_T + extra) + (f(u, v, TOWEL_T + 0.004 + extra) - f(u, v, TOWEL_T + extra)) * (puff / 0.004)

    inside = lambda c: (c.x, 0, TC_Z)
    sheet(p, lambda u, v: outer(u, v), NU, NV, "towel", inside=inside)
    sheet(p, lambda u, v: f(u, v, 0.002), NU, NV, "towel", inside=inside, back=True)
    # rounded edges: the cloth's thickness closed by soft tubes along both sides and both ends
    r = TOWEL_T / 2 + 0.0015
    for u in (0.0, 1.0):
        p.add(bm_tube([f(u, k / NV, TOWEL_T / 2 + 0.001) for k in range(NV + 1)], r, 12), "towel", smooth=True)
    for v in (0.0, 1.0):
        p.add(bm_tube([f(k / NU, v, TOWEL_T / 2 + 0.001) for k in range(NU + 1)], r, 12), "towel", smooth=True)
    # woven red stripes across both flaps near the ends (front: clearly visible below the fold)
    for v0, v1 in ((0.07, 0.11), (0.135, 0.155), (0.88, 0.9), (0.92, 0.95)):
        sheet(p, lambda u, v: outer(0.015 + 0.97 * u, v0 + (v1 - v0) * v, 0.0018), NU, 3, "towel_stripe", inside=inside)
        for u in (0.0, 1.0):
            p.add(bm_tube([f(u, v0 + (v1 - v0) * k / 3, TOWEL_T / 2 + 0.001) for k in range(4)], r + 0.0012, 12), "towel_stripe", smooth=True)
    # a stitched hem line above each end
    for v in (0.03, 0.97):
        stitch(p, [outer(0.04 + 0.92 * k / 14, v, 0.0012) for k in range(15)], "apron_thread", 0.011, 0.007, 0.002)
    # fringe hanging from both ends
    for v in (0.0, 1.0):
        for k in range(11):
            q = f((k + 0.5) / 11, v, TOWEL_T / 2)
            p.add(bm_tube([q, q + Vector((0.002 * (k % 2 - 0.5), 0.0, -0.034 - 0.006 * (k % 3)))], [0.0052, 0.004], 8), "towel", smooth=True)


# --- vest

def vee(z):
    """Half-width (degrees) of the V-neck opening at height z."""
    return 1.0 + 40.0 * max(0.0, (z - 0.7) / 0.155) ** 0.75


def watch_chain(p):
    """Welt pocket on his right chest with a pocket watch peeking out, a chain to the middle button
    and a little brass key on a fob ring."""
    G = BODY
    G.panel(p, -139, -113, 0.624, 0.643, "vest_dark", 0.005, 10)
    stitch(p, G.arc(-138, -114, 0.621, 0.006, 12), "vest_light", 0.008, 0.005, 0.002)
    # watch crown and bow above the welt
    wm = G.frame(-126, 0.65, 0.008)
    p.add(sphere(20, 12), "gold", wm @ S(0.024, 0.016, 0.009), smooth=True)
    p.add(bm_cyl(0.0045, 0.0045, 0.01, 12), "gold", wm @ Matrix.Translation((0, 0.012, 0.004)) @ M(rot=(-90, 0, 0)), smooth=True)
    bow_c = wm @ Vector((0, 0.03, 0.005))
    p.add(bm_tube(ring_pts(wm @ Matrix.Translation((0, 0.03, 0.005)), 0.008, 16), 0.0018, 6, cap=False), "gold", smooth=True)
    # chain: links alternately flat and on edge, sagging along the vest to the middle button
    path = [G.pt(-126 + 36 * t, 0.68 * (1 - t) + 0.637 * t - 0.045 * math.sin(math.pi * t), 0.011) for t in [k / 30 for k in range(31)]]
    path[0] = bow_c
    L = plen(path)
    n = int(L / 0.0075)
    for k in range(1, n):
        c = polyline_at(path, L * k / n)
        tg = (polyline_at(path, L * k / n + 0.002) - polyline_at(path, L * k / n - 0.002)).normalized()
        nrm = (c - Vector((0, 0, c.z))).normalized()
        side = tg.cross(nrm).normalized() if k % 2 else nrm
        m = Matrix((tg, side, tg.cross(side))).transposed().to_4x4()
        m.translation = c
        p.add(bm_tube([m @ Vector((0.0048 * math.cos(a), 0.0028 * math.sin(a), 0)) for a in [2 * math.pi * j / 10 for j in range(11)]],
                      0.0014, 5, cap=False), "gold", smooth=True)
    # key fob from the lowest link
    low = min(path, key=lambda q: q.z)
    kn = (low - Vector((0, 0, low.z))).normalized()
    km = frame(low + kn * 0.004 + Vector((0, 0, -0.012)), kn)
    p.add(bm_tube(ring_pts(km, 0.006, 14), 0.0016, 6, cap=False), "brass", smooth=True)
    kb = km @ Matrix.Translation((0, -0.022, 0.001))
    p.add(bm_tube(ring_pts(kb, 0.0075, 18), 0.0024, 6, cap=False), "brass", smooth=True)
    p.add(bm_tube([kb @ Vector((0, -0.0075, 0)), kb @ Vector((0, -0.043, 0))], 0.0026, 8), "brass", smooth=True)
    for yy, w in ((-0.036, 0.008), (-0.042, 0.006)):
        p.add(bm_box(w, 0.004, 0.004, bevel=0.0012, segs=1), "brass", kb @ Matrix.Translation((w / 2 + 0.001, yy, 0)), smooth=True)


def body():
    p = Part("body")
    G = BODY
    G.mesh(p, "vest")
    # vest hem and stitching
    G.hem(p, 0.278, 0.013, "vest_dark", 0.002)
    G.stitch_ring(p, 0.305, 0.003, "vest_light")
    # V-neck: shirt showing through, piped edges, collar, neck
    sheet(p, lambda u, v: G.pt(-90 - vee(0.69 + 0.17 * v) + 2 * vee(0.69 + 0.17 * v) * u, 0.69 + 0.17 * v, 0.003), 16, 14, "shirt",
          inside=lambda c: (0, 0, c.z))
    for s in (-1, 1):
        p.add(bm_tube([G.pt(-90 + s * vee(z), z, 0.004) for z in [0.69 + 0.16 * k / 16 for k in range(17)]], 0.0062, 8), "vest_dark", smooth=True)
    p.add(bm_cyl(0.062, 0.058, 0.13, 32), "skin_warm", M((0, 0, 0.77)), smooth=True)
    col = [(0.098, 0.806), (COLLAR_R, 0.815), (0.104, 0.84), (0.09, 0.862), (0.071, 0.874)]
    p.add(lathe(col, 48), "shirt", smooth=True)
    p.add(bm_tube([(0.0985 * math.cos(2 * math.pi * k / 48), 0.0985 * math.sin(2 * math.pi * k / 48), 0.807) for k in range(49)], 0.004, 6, cap=False),
          "shirt_shade", smooth=True)
    for s in (-1, 1):                     # rounded collar points lying on the shirt front
        c = G.pt(-90 + s * 17, 0.79, 0.012)
        p.add(sphere(20, 12), "shirt", frame(c, G.normal(-90 + s * 17, 0.79)) @ M(rot=(0, 0, s * 30)) @ S(0.03, 0.02, 0.008), smooth=True)
    # front closure: edge piping, stitching, brass buttons
    p.add(bm_tube([G.pt(-86, z, 0.004) for z in [0.28 + 0.41 * k / 20 for k in range(21)]], 0.005, 8), "vest_dark", smooth=True)
    stitch(p, [G.pt(-80, z, 0.004) for z in [0.56 + 0.13 * k / 8 for k in range(9)]], "vest_light", 0.01, 0.006, 0.0022)
    for z in (0.585, 0.637, 0.689):
        G.button(p, -90, z, 0.0155, "brass", 0.006)
    # armhole piping where the sleeves come out
    for side in (1, -1):
        ring = []
        for k in range(41):
            ps = 2 * math.pi * k / 40
            y, z = 0.094 * math.cos(ps), SHOULDER[1] + 0.094 * math.sin(ps)
            r = G.rad(z)
            x = math.sqrt(max(r * r - (y / G.ys) ** 2, 1e-6))
            phi = math.degrees(math.atan2(y / G.ys, side * x))
            ring.append(G.pt(phi, z, 0.004))
        p.add(bm_tube(ring, 0.0065, 8, cap=False), "vest_dark", smooth=True)
    # satin back panel with piped seams and a buckled cinch strap
    G.panel(p, 52, 128, 0.29, 0.775, "vest_back", 0.003, 28)
    for phi in (52, 128):
        p.add(bm_tube(G.line(phi, 0.29, 0.775, 0.004, 16), 0.0048, 8), "vest_dark", smooth=True)
    p.add(bm_tube(G.arc(52, 128, 0.775, 0.004, 28), 0.0048, 8), "vest_dark", smooth=True)
    for a0, a1 in ((76, 87.5), (92.5, 104)):
        G.panel(p, a0, a1, 0.61, 0.632, "vest_back_dark", 0.006, 6)
        stitch(p, G.arc(a0 + 1, a1 - 1, 0.621, 0.0075, 6), "vest_back", 0.006, 0.004, 0.0016)
    bm_ = G.frame(90, 0.621, 0.009)
    p.add(bm_tube([bm_ @ Vector((0.012 * math.copysign(abs(math.cos(a)) ** 0.5, math.cos(a)),
                                 0.016 * math.copysign(abs(math.sin(a)) ** 0.5, math.sin(a)), 0)) for a in [2 * math.pi * k / 32 for k in range(33)]],
                  0.0022, 6, cap=False), "brass", smooth=True)
    p.add(bm_tube([bm_ @ Vector((0, -0.016, 0.001)), bm_ @ Vector((0, 0.012, 0.003))], 0.0016, 5), "brass", smooth=True)
    watch_chain(p)
    apron(p)
    towel(p)
    return p


# ---------------------------------------------------------------- head

NECK = 0.85
HD = vc.Head((0, 0, NECK + 0.27), 0.32, 0.295, 0.288)


def smile(hp, z0=-0.168, w=0.044, dep=0.036):
    """A warm open smile: a D-shaped mouth on the face with a tongue and a soft upper lip line."""
    def f(u, v, out):
        x = u * w
        z = z0 + 0.009 * u * u - v * dep * math.sqrt(max(1 - u * u, 0.0)) ** 0.8
        return HD.fpt(x, z, out)[0]
    sheet(hp, lambda a, b: f(-1 + 2 * a, b, 0.0025), 24, 8, "mouth", inside=HD.hc)
    sheet(hp, lambda a, b: f(-0.62 + 1.24 * a, 0.5 + 0.44 * b, 0.0038), 16, 5, "tongue", inside=HD.hc)
    hp.add(bm_tube([f(-1.04 + 2.08 * k / 20, -0.02, 0.004) for k in range(21)], 0.0036, 8), "mouth", smooth=True)


def lock(hp, chain, res=0.008, stiff=2.0):
    """One defined lock of hair from (phi, z, visible radius, sink) points on the head."""
    els = []
    for phi, z, r, sink in chain:
        els.append((HD.spt(phi, z, -r * sink)[0], r))
    hp.add(meta(els, res, stiff), "hair", None, smooth=True)


def hair(hp):
    """A thick horseshoe of hair round the back: a smooth band whose lower edge breaks into big
    rounded locks. Alternate locks are separate masses, so each parting shows as a soft crease."""
    band = [(HD.spt(phi, z, -r * 0.5)[0], r) for phi in range(12, 169, 8) for z, r in ((0.04, 0.052), (-0.03, 0.056))]
    locks = ([], [])
    phis = (22, 44, 67, 90, 113, 136, 158)
    for k, phi in enumerate(phis):
        lean = (phi - 90) / 68 * 3.0
        deep = 0.14 if k % 2 else 0.0          # the alternate locks sit deeper: their edges read as partings
        for z, r, sink in ((0.03, 0.052, 0.46), (-0.02, 0.056, 0.44), (-0.056, 0.056, 0.42), (-0.082, 0.046, 0.36)):
            locks[k % 2].append((HD.spt(phi + lean * (0.05 - z) / 0.15, z, -r * (sink + deep))[0], r))
    hp.add(meta(band + locks[0], 0.008), "hair", None, smooth=True)
    hp.add(meta(locks[1], 0.008), "hair", None, smooth=True)
    # over each ear in a swoop, then down into a sideburn
    for s in (1, -1):
        mp = (lambda ph: ph) if s > 0 else (lambda ph: 180 - ph)
        lock(hp, [(mp(28), -0.015, 0.064, 0.4), (mp(25), 0.04, 0.064, 0.4), (mp(15), 0.08, 0.056, 0.4), (mp(3), 0.094, 0.05, 0.4),
                  (mp(-8), 0.088, 0.046, 0.4)])
        lock(hp, [(mp(-15), 0.066, 0.043, 0.4), (mp(-20), 0.028, 0.042, 0.4), (mp(-21), -0.014, 0.04, 0.4), (mp(-20.5), -0.056, 0.034, 0.36)])
    # one cheeky curl left on top
    c0 = HD.H(0.012, -0.03, HD.c - 0.008)
    curl = [c0 + Vector((0.0, -0.024 * math.sin(t) * (1 - t / 9), 0.028 * (1 - math.cos(t)) * (1 - t / 9) + 0.004 * t))
            for t in [k * 0.3 for k in range(17)]]
    hp.add(bm_tube(curl, [0.0105 - 0.005 * k / 16 for k in range(17)], 14), "hair", smooth=True)


def moustache(hp):
    """Big handlebar moustache: two plump lobes under the nose sweeping out and curling up."""
    for s in (-1, 1):
        pts = [(0.022, -0.106, 0.036), (0.058, -0.114, 0.043), (0.1, -0.112, 0.039), (0.137, -0.1, 0.032),
               (0.165, -0.08, 0.025), (0.182, -0.057, 0.019), (0.184, -0.037, 0.0145), (0.172, -0.026, 0.011)]
        hp.add(meta([(HD.fpt(s * x, z, r * 0.5)[0], r) for x, z, r in pts], 0.0055), "hair", None, smooth=True)


def head():
    hp = Part("head")
    HD.skull(hp)
    HD.ears(hp)
    for s in (-1, 1):
        HD.eye(hp, s, 0.1, 0.004, 0.03, 0.042)
    HD.blush(hp, x=0.2, z=-0.03, w=0.042, h=0.026)
    HD.nose(hp, "nose", -0.05, size=(0.058, 0.05, 0.056), out=0.024)
    smile(hp)
    HD.brows(hp, "hair", pts=((0.046, 0.094, 0.022), (0.066, 0.106, 0.026), (0.089, 0.114, 0.029), (0.113, 0.116, 0.029),
                              (0.137, 0.111, 0.027), (0.157, 0.101, 0.024), (0.173, 0.088, 0.019)), res=0.006)
    hair(hp)
    moustache(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

def arm(side, cfg):
    """Rolled cream shirt sleeve to the elbow, bare forearm, mitten hand."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    L = cfg["arm_len"]
    sr = SLEEVE_R
    p.add(sphere(32, 20), "shirt", M(pv, scale=sr), smooth=True)
    p.add(bm_tube([pv, pv + d * (L * 0.12), pv + d * (L * 0.25), pv + d * (L * 0.48)], [sr * 0.86, sr * 0.99, sr * 1.03, sr * 1.07], 32, cap=False),
          "shirt", smooth=True)
    # rolled-up cuff: two fat rolls with a crease between
    cm = frame(pv + d * (L * 0.52), d)
    roll = [(0.05, -0.036), (0.074, -0.035), (0.087, -0.029), (0.093, -0.017), (0.089, -0.004), (0.094, 0.008), (0.092, 0.022),
            (0.081, 0.032), (0.06, 0.035), (0.05, 0.034)]
    p.add(lathe(roll, 48), "shirt", cm, smooth=True)
    p.add(bm_tube(ring_pts(cm, 0.0885, 40, -0.004), 0.0028, 6, cap=False), "shirt_shade", smooth=True)
    stitch(p, ring_pts(cm, 0.0935, 40, 0.011), "shirt_shade", 0.01, 0.006, 0.0018)
    p.add(bm_tube([pv + d * (L * 0.5), pv + d * (L * 0.7), pv + d * (L * 0.88)], [0.05, 0.049, 0.047], 28), "skin_warm", smooth=True)
    vc.mitten(p, vc.hand_c(side, cfg), "skin_warm", side, 1.06)
    return p


def leg(side, cfg):
    """Trouser leg and a low laced shoe (the kit's boot is too round at the ankle for a shoe)."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    lr = cfg["leg_r"]
    p.add(bm_tube([(x, 0, cfg["hip_z"]), (x, 0, 0.25), (x, 0, 0.17)], [lr, lr * 1.04, lr * 1.12], 32), "trousers", smooth=True)
    els = [((x, 0.03, 0.06), 0.054), ((x, -0.01, 0.068), 0.058), ((x, -0.058, 0.06), 0.055), ((x, -0.098, 0.052), 0.047),
           ((x, 0.0, 0.102), 0.054), ((x, -0.03, 0.09), 0.05)]
    p.add(meta(els, 0.008), "shoe", None, smooth=True)
    p.add(bm_box(0.122, 0.232, 0.022, bevel=0.01, segs=3), "sole", M((x, -0.032, 0.011)), smooth=True)
    p.add(bm_box(0.11, 0.07, 0.012, bevel=0.005, segs=2), "sole", M((x, 0.045, 0.022)), smooth=True)      # heel
    rim = [(x + 0.057 * math.cos(a), -0.032 + 0.112 * math.sin(a), 0.0235) for a in [2 * math.pi * k / 40 for k in range(41)]]
    stitch(p, rim, "stitch_light", 0.01, 0.007, 0.0018)
    shoe(p, side, x)
    return p


def shoe(p, side, x):
    """Turned-up trouser cuff and a lace bow on the shoe."""
    p.add(lathe([(0.072, 0.142), (0.084, 0.146), (0.088, 0.16), (0.087, 0.18), (0.08, 0.186), (0.074, 0.19)], 40), "trousers_dark", M((x, 0, 0)), smooth=True)
    stitch(p, [(x + 0.0885 * math.cos(a), 0.0885 * math.sin(a), 0.168) for a in [2 * math.pi * k / 40 for k in range(41)]], "stitch_light", 0.01, 0.006, 0.0018)
    k = Vector((x, -0.074, 0.118))
    p.add(sphere(12, 8), "lace", M(k, scale=(0.009, 0.007, 0.007)), smooth=True)
    for s in (-1, 1):
        loop = [k + Vector((s * 0.022 * (1 - math.cos(a)) / 2, -0.003 * math.sin(a), 0.009 * math.sin(a) + 0.004 * (1 - math.cos(a)) / 2))
                for a in [2 * math.pi * j / 16 for j in range(17)]]
        p.add(bm_tube(loop, 0.0032, 6, cap=False), "lace", smooth=True)
        p.add(bm_tube([k, k + Vector((s * 0.008, -0.006, -0.018))], 0.003, 6), "lace", smooth=True)


CFG = dict(
    neck_z=NECK, shoulder_x=SHOULDER[0], shoulder_z=SHOULDER[1], hip_x=0.105, hip_z=0.34,
    arm_len=0.27, arm_pose={1: (32, 0), -1: (32, 0)},       # arms rest out on the belly
    leg_r=0.07,
)


# ---------------------------------------------------------------- prop: the tankard he polishes

TILT = 25.0         # degrees the mug leans forward at rest (upright mid-swing in the game)
YAW = -18.0         # turned a little outward, away from the belly


def mug():
    p = Part("mug")
    g = vc.hand_c(-1, CFG)
    R0, R1, Hh = 0.066, 0.06, 0.162

    def R(z):
        return R0 + (R1 - R0) * z / Hh

    grip = Vector((0, R(0.085) + 0.07, 0.085))
    W = (Matrix.Translation(g) @ Matrix.Rotation(math.radians(YAW), 4, "Z") @ Matrix.Rotation(math.radians(TILT), 4, "X")
         @ Matrix.Translation(-grip))
    # dark core, then coopered staves in two tones with hairline gaps
    p.add(lathe([(R(z) - 0.0022, z) for z in (0.006, 0.08, 0.156)], 56), "mug_dark", W, smooth=True)
    n = 14
    for k in range(n):
        a0, a1 = 360.0 * k / n + 0.8, 360.0 * (k + 1) / n - 0.8
        prof = [(R(z) + 0.0024 * math.sin(math.pi * z / Hh), z) for z in [0.006 + 0.15 * j / 10 for j in range(11)]]
        p.add(bm_lathe(prof, 6, arc=(a0, a1)), "mug_wood" if k % 2 else "mug_wood_l", W, smooth=True)
    # foot ring with a bottom
    p.add(lathe([(R0 - 0.003, 0.0), (R0 + 0.002, 0.0015), (R0 + 0.0042, 0.0065), (R0 + 0.0028, 0.012), (R0 - 0.001, 0.014)], 56, cap_bottom=True),
          "mug_dark", W, smooth=True)
    # pewter hoops with rivets
    for z0, z1 in ((0.026, 0.044), (0.116, 0.134)):
        rz = R((z0 + z1) / 2) + 0.0024 * math.sin(math.pi * (z0 + z1) / 2 / Hh)
        p.add(lathe([(rz + 0.0005, z0 - 0.001), (rz + 0.0034, z0 + 0.002), (rz + 0.0036, (z0 + z1) / 2), (rz + 0.0034, z1 - 0.002), (rz + 0.0005, z1 + 0.001)], 64),
              "pewter", W, smooth=True)
        for j in range(6):
            a = 2 * math.pi * (j + 0.5) / 6
            c = Vector(((rz + 0.0036) * math.cos(a), (rz + 0.0036) * math.sin(a), (z0 + z1) / 2))
            p.add(sphere(10, 6), "pewter", W @ frame(c, (math.cos(a), math.sin(a), 0)) @ S(0.0034, 0.0034, 0.002), smooth=True)
    # rounded rim, then the dark inside down to the floor
    rim = [(R1 + 0.0026, 0.153), (R1 + 0.003, 0.158), (R1 + 0.0005, 0.1635), (R1 - 0.0045, 0.1655), (R1 - 0.009, 0.1625), (R1 - 0.0105, 0.157)]
    p.add(lathe(rim, 64), "mug_wood_l", W, smooth=True)
    inner = [(R1 - 0.0105, 0.157), (R(0.12) - 0.0105, 0.12), (R(0.04) - 0.0105, 0.034), (R(0.03) - 0.016, 0.028), (0.01, 0.027), (0.002, 0.027)]
    p.add(lathe(inner, 64, cap_top=True), "mug_in", W, smooth=True)
    # handle: a flattened C with a pewter thumb rest and straps where it meets the body
    rr = R(0.085)
    hpts = chaikin([(0, R(0.136) - 0.006, 0.136), (0, rr + 0.03, 0.143), (0, rr + 0.062, 0.128), (0, rr + 0.072, 0.1),
                    (0, rr + 0.072, 0.066), (0, rr + 0.06, 0.042), (0, rr + 0.03, 0.03), (0, R(0.03) - 0.006, 0.03)], 3)
    p.add(bm_tube(hpts, 0.0118, 16), "mug_wood", W @ S(0.72, 1, 1), smooth=True)
    p.add(sphere(20, 12), "pewter", W @ M((0, rr + 0.034, 0.153), (14, 0, 0), (0.0125, 0.017, 0.0055)), smooth=True)
    p.add(bm_tube([Vector((0, rr + 0.034, 0.148)), Vector((0, rr + 0.03, 0.141))], 0.003, 8), "pewter", W, smooth=True)
    for z, ry in ((0.136, R(0.136)), (0.03, R(0.03))):
        p.add(sphere(20, 12), "pewter", W @ M((0, ry + 0.012, z), scale=(0.0115, 0.009, 0.0135)), smooth=True)
        p.add(sphere(10, 6), "pewter", W @ M((0.0085, ry + 0.012, z), scale=0.0028), smooth=True)
        p.add(sphere(10, 6), "pewter", W @ M((-0.0085, ry + 0.012, z), scale=0.0028), smooth=True)
    # polishing cloth tucked in the mouth of the mug and draped over the front rim, with folds
    ctrl = [Vector(v) for v in ((R1 - 0.03, 0.105, 0), (R1 - 0.02, 0.15, 0), (R1 - 0.008, 0.17, 0), (R1 + 0.006, 0.172, 0), (R1 + 0.011, 0.16, 0))]

    def cloth_pt(u, v, off=0.0):
        uu = -1 + 2 * u
        ang = math.radians(-90 + 46 * uu)
        zend = 0.055 + 0.016 * math.cos(2.4 * math.pi * uu) + 0.01 * uu
        pts = ctrl + [Vector((R(z) + 0.0115, z, 0)) for z in [0.15 - (0.15 - zend) * k / 6 for k in range(1, 7)]]
        q = polyline_at(pts, plen(pts) * v)
        below = max(0.0, (0.155 - q.y) / 0.1)
        fold = 0.0065 * below * (0.5 + 0.5 * math.cos(3.0 * math.pi * uu)) + 0.003 * below * below
        r = q.x + fold + off
        return W @ Vector((r * math.cos(ang), r * math.sin(ang), q.y))

    axis = lambda c: W @ Vector((0, 0, (W.inverted() @ c).z))
    sheet(p, lambda u, v: cloth_pt(u, v), 26, 30, "towel", inside=axis)
    sheet(p, lambda u, v: cloth_pt(u, v, -0.0028), 26, 30, "towel", inside=axis, back=True)
    p.add(bm_tube([cloth_pt(k / 26, 1.0, -0.0014) for k in range(27)], 0.0026, 6), "towel", smooth=True)
    for u in (0.0, 1.0):
        p.add(bm_tube([cloth_pt(u, k / 30, -0.0014) for k in range(31)], 0.0022, 6), "towel", smooth=True)
    for v0, v1 in ((0.8, 0.83), (0.865, 0.88)):
        sheet(p, lambda u, v: cloth_pt(u, v0 + (v1 - v0) * v, 0.0008), 26, 2, "towel_stripe", inside=axis)
    check_swing(p, g)
    return p, g


def check_swing(p, g):
    """Smallest clearance (m) between the mug or the hand and the belly/apron, at rest and over the
    game's swing of arm_r round the shoulder (rotation.x from -0.9 to -0.3 rad)."""
    pv = vc.shoulder(-1, CFG)
    hand = [g + Vector((0.064 * math.cos(a) * math.cos(b), 0.066 * math.sin(a) * math.cos(b), 0.07 * math.sin(b)))
            for a in [2 * math.pi * i / 16 for i in range(16)] for b in [math.pi * (j / 6 - 0.5) for j in range(7)]]
    pts = [v.co.copy() for v in p.bm.verts] + hand
    out = []
    for ang in (0.0, -0.3, -0.45, -0.6, -0.75, -0.9):
        Rm = Matrix.Translation(pv) @ Matrix.Rotation(ang, 4, "X") @ Matrix.Translation(-pv)
        worst = 9.0
        for q0 in pts:
            q = Rm @ q0
            if not (BODY.profile[0][1] - 0.1 <= q.z <= BODY.profile[-1][1]):
                continue
            phi = math.degrees(math.atan2(q.y / BODY.ys, q.x))
            rq = math.hypot(q.x, q.y / BODY.ys)
            zc = max(q.z, BODY.profile[0][1])
            m = rq - BODY.rr(phi, zc)
            a0, a1 = apron_edges(min(max(q.z, AP_BOT), AP_TOP))
            if AP_BOT <= q.z <= AP_TOP and a0 - 3 <= phi <= a1 + 3:
                m = min(m, rq - apron_r(phi, q.z, AP_OUT + 0.01))
            worst = min(worst, m)
        out.append("%.2f:%+.3f" % (ang, worst))
    print("CLEAR mug+hand vs belly/apron (rotation.x: margin)", " ".join(out))


CFG.update(arm=arm, leg=leg, body=body, head=head, props=[("mug", "arm_r", mug)], closeup_z=1.03,
           shots=[("back", (0, 0, 0.72), 160, 8, 2.6), ("mug", (-0.36, -0.12, 0.5), -48, 6, 0.85),
                  ("side", (0, 0, 0.72), -72, 6, 2.6)])


def main():
    return vc.build("innkeeper", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
