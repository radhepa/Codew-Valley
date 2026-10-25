"""Lord Aldous Vane of the trading company, in the soft Animal Crossing style of Marlo the fisher
(restyled 2026-10-23). The story's pompous rich man: the tallest and thinnest villager (long legs,
long body, the same big round head), haughty but still cute.
A burgundy frock coat cut away at the front, with black peak lapels, long split tails at the back
edged in black, a waist seam, gold shank buttons, flap pockets and black gauntlet cuffs with lace
frills; a pleated white ruff and a three-tier jabot; charcoal breeches buttoned at the knee and tall
glossy black riding boots with strap buckles; slicked glossy black hair with a sharp parting and a
front swoop, a thin curled moustache, high arched brows, smug half-lidded eyes and an upturned nose;
a wide black hat cocked up on his left, a burgundy band with a gold buckle, a ruby brooch and a
fluffy cream plume; a gold monocle over his RIGHT eye on a fine chain.
Prop: `ledger` (arm_l): black leather-bound ledger with a rounded, banded spine, gold corners,
a strap and gold clasp, a gold crest, cream page edges and a ribbon bookmark.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_prism
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "coat": "#8C3A46", "coat_dark": "#6A2A34", "stitch_coat": "#C98A90",
    "lapel": "#2B2427", "lapel_edge": "#3B3236", "stitch_grey": "#6E6466",
    "shirt": "#F4EFE6", "lace": "#FAF6EE", "lace_shade": "#E6DDCB",
    "breeches": "#36302F", "breeches_dark": "#2A2524",
    "boot": "#1F1B1D", "boot_strap": "#302A2C",
    "hair_black": "#2C2528",
    "hat": "#2A2427", "hat_edge": "#3A3135", "band": "#7C3340", "plume": "#F3EAD6", "quill": "#E9DEC6",
    "ruby": "#A8243B", "gold_dark": "#A9822F",
    "ledger": "#2A2427", "ledger_dark": "#1D191B", "page": "#EFE6D0", "page_line": "#CBBC9C", "ribbon": "#8E2F3C",
}, metal={"gold_dark": (0.7, 0.4)},
   gloss={"boot": 0.16, "hair_black": 0.3, "ruby": 0.15, "ledger": 0.45, "lapel": 0.5, "lapel_edge": 0.5, "hat_edge": 0.6})


# ---------------------------------------------------------------- helpers (local to this script)

def shell(part, mat, P, nu, nv, t, closed_u=False, smooth=True):
    """A thick sheet from a surface P(u, v) -> point (u, v in 0..1): outer and inner skins t apart
    along the surface normal, closed by side walls. For coat skirts, lapels, frills and brims."""
    bm = bmesh.new()
    cols = nu if closed_u else nu + 1
    e = 1e-3

    def nrm(u, v):
        u0, u1 = (u - e, u + e) if closed_u else (max(u - e, 0.0), min(u + e, 1.0))
        du = P(u1, v) - P(u0, v)
        dv = P(u, min(v + e, 1.0)) - P(u, max(v - e, 0.0))
        n = du.cross(dv)
        return n.normalized() if n.length > 1e-12 else Vector((0, 0, 1))

    outer, inner = [], []
    for j in range(nv + 1):
        ro, ri = [], []
        for i in range(cols):
            u, v = i / nu, j / nv
            p, n = P(u, v), nrm(u, v)
            ro.append(bm.verts.new(p + n * (t / 2)))
            ri.append(bm.verts.new(p - n * (t / 2)))
        outer.append(ro)
        inner.append(ri)
    span = range(nu) if closed_u else range(cols - 1)
    for j in range(nv):
        for i in span:
            k = (i + 1) % cols
            bm.faces.new((outer[j][i], outer[j][k], outer[j + 1][k], outer[j + 1][i]))
            bm.faces.new((inner[j][k], inner[j][i], inner[j + 1][i], inner[j + 1][k]))
    for j in (0, nv):                                   # walls along the v = 0 and v = 1 edges
        for i in span:
            k = (i + 1) % cols
            bm.faces.new((outer[j][i], inner[j][i], inner[j][k], outer[j][k]))
    if not closed_u:                                    # walls along the u = 0 and u = 1 edges
        for i in (0, cols - 1):
            for j in range(nv):
                bm.faces.new((outer[j][i], outer[j + 1][i], inner[j + 1][i], inner[j][i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    part.add(bm, mat, smooth=smooth)


def gold_button(part, m, r=0.014, mat="gold"):
    """Domed gold shank button with a raised rim and a centre boss."""
    part.add(sphere(16, 10), mat, m @ S(r, r, r * 0.5), smooth=True)
    part.add(bm_tube(ring_pts(m, r * 0.82, 16, r * 0.18), r * 0.16, 5, cap=False), mat, smooth=True)
    part.add(sphere(8, 5), "gold_dark", m @ Matrix.Translation((0, 0, r * 0.44)) @ S(r * 0.3, r * 0.3, r * 0.14), smooth=True)


def buckle(part, m, w, h, r=0.0032, mat="gold"):
    """Rectangular buckle frame with a centre bar and a prong, lying in the local XY plane of m."""
    pts = [m @ Vector((sx * w / 2, sy * h / 2, 0)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1), (-1, -1))]
    part.add(bm_tube(pts, r, 8, cap=False), mat, smooth=True)
    part.add(bm_tube([m @ Vector((0, -h / 2, 0)), m @ Vector((0, h / 2, 0))], r * 0.8, 6), mat, smooth=True)
    part.add(bm_tube([m @ Vector((0, 0, r)), m @ Vector((w * 0.42, 0, r * 1.4))], r * 0.6, 6), "gold_dark", smooth=True)


# ---------------------------------------------------------------- body (frock coat)

# one profile for the whole coat: the fitted torso from the waist up, the flared skirts below it
COAT = vc.Garment([(0.214, 0.2), (0.205, 0.28), (0.194, 0.37), (0.184, 0.45), (0.177, 0.52), (0.175, 0.57), (0.18, 0.64),
                   (0.188, 0.72), (0.19, 0.78), (0.185, 0.84), (0.172, 0.885), (0.15, 0.925), (0.115, 0.958), (0.078, 0.984),
                   (0.05, 0.996)], ys=0.8)
WAIST = 0.535
TORSO = [(COAT.rad(z), z) for z in (0.5, 0.52)] + [(r, z) for r, z in COAT.profile if z > 0.52]
SEAT = vc.Garment([(0.06, 0.39), (0.12, 0.405), (0.15, 0.43), (0.163, 0.47), (0.166, 0.52), (0.164, 0.56)], ys=0.8)
SKIRT_OUT, SKIRT_T = 0.009, 0.012


def skirt_uv(side):
    """(u, v) -> (phi, z) of the left (side=1) or right (side=-1) coat skirt: u from the cut-away
    front edge to the back vent, v from the waist down to the hem; the tails hang lowest at the back."""
    def f(u, v):
        vv = min(max(v, 0.0), 1.0)
        phi_f = -86.0 + 58.0 * vv ** 1.5
        phi = phi_f + (87.0 - phi_f) * u
        zb = 0.31 - 0.08 * min(max(u, 0.0), 1.0) ** 1.3
        z = (WAIST + 0.012) - ((WAIST + 0.012) - zb) * v
        return (phi if side > 0 else 180.0 - phi), z
    return f


def skirt(p, side):
    f = skirt_uv(side)
    shell(p, "coat", lambda u, v: COAT.pt(*f(u, v), SKIRT_OUT), 44, 16, SKIRT_T)
    # black edging down the cut-away front, along the hem and up the vent
    edge = [COAT.pt(*f(0, k / 16), SKIRT_OUT) for k in range(2, 17)] + [COAT.pt(*f(k / 44, 1), SKIRT_OUT) for k in range(1, 45)]
    edge += [COAT.pt(*f(1, 1 - k / 16), SKIRT_OUT) for k in range(1, 15)]
    p.add(bm_tube(edge, SKIRT_T * 0.5 + 0.0035, 10), "lapel", smooth=True)
    so = SKIRT_OUT + SKIRT_T / 2 + 0.002
    stitch(p, [COAT.pt(*f(k / 44, 0.93), so) for k in range(3, 42)], "stitch_coat")
    # flap pocket on the hip with a black piped edge and a gold button
    pc = -32.0 if side > 0 else -148.0
    z0, z1 = 0.47, 0.415
    fo = so + 0.005

    def flap(u, v):
        ph = pc - 13 + 26 * u
        return COAT.pt(ph, z0 + (z1 - 0.012 * math.sin(math.pi * u) - z0) * v, fo)
    shell(p, "coat", flap, 16, 4, 0.006)
    pip = [flap(0, k / 4) for k in range(5)] + [flap(k / 16, 1) for k in range(1, 17)] + [flap(1, 1 - k / 4) for k in range(1, 5)]
    p.add(bm_tube(pip, 0.0042, 8), "lapel", smooth=True)
    gold_button(p, COAT.frame(pc, z1 + 0.004, fo + 0.006), 0.011)


def lapel_uv(side):
    """(u, v) -> (phi, z) of a peak lapel: u from the opening to the outer edge, v from the lowest
    point up to the peak, which rises toward the shoulder."""
    def f(u, v):
        phi_i = -89.0 + 15.0 * v
        phi_o = -85.0 + 48.0 * max(v, 0.0) ** 0.85
        phi = phi_i + (phi_o - phi_i) * u
        z = 0.755 + 0.19 * v + 0.022 * u * max(v, 0.0) ** 3
        return (phi if side > 0 else -180.0 - phi), z
    return f


def ruff(p, z0, ri, ro, n, amp, phase=0.0, ys=0.9):
    """Pleated ring collar: a band round the neck folded up and down n times, with a rolled edge."""
    def P(u, v):
        a = 2 * math.pi * u
        w = math.sin(n * a + phase)
        r = ri + (ro - ri) * v + 0.009 * math.cos(n * a + phase) * v ** 1.5
        z = z0 + amp * w * v ** 1.3 + 0.012 * v
        return Vector((r * math.cos(a), ys * r * math.sin(a), z))
    shell(p, "lace", P, 162, 4, 0.005, closed_u=True)
    p.add(bm_tube([P(k / 162, 1) for k in range(163)], 0.0058, 7, cap=False), "lace_shade", smooth=True)


def jabot_tier(p, zt, h, r0, r1, yc, n=13):
    """One frilled tier of the jabot: a short cone opening downward over the shirt front."""
    def P(u, v):
        a = math.radians(192 + 156 * u)
        r = r0 + (r1 - r0) * v + 0.0095 * math.sin(n * a) * v ** 1.2
        return Vector((r * math.cos(a), yc + 0.55 * r * math.sin(a), zt - h * v + 0.006 * math.cos(n * a) * v))
    shell(p, "lace", P, 40, 6, 0.004)
    p.add(bm_tube([P(k / 40, 1) for k in range(41)], 0.0038, 8), "lace_shade", smooth=True)


def body():
    p = Part("body")
    G = COAT
    p.add(lathe(TORSO, 64, ys=G.ys, cap_top=True), "coat", smooth=True)
    p.add(lathe(SEAT.profile, 48, ys=SEAT.ys, cap_bottom=True), "breeches", smooth=True)
    p.add(bm_cyl(0.056, 0.054, 0.12, 24), "skin_warm", M((0, 0, 0.93)), smooth=True)
    # waist seam with stitching, front closure with gold buttons and stitched buttonholes
    G.hem(p, WAIST, 0.0065, "coat_dark", out=0.003)
    G.stitch_ring(p, WAIST + 0.016, out=0.002, matname="stitch_coat")
    p.add(bm_tube([G.pt(-90, z, 0.004) for z in (WAIST, 0.6, 0.66, 0.72, 0.765)], 0.0038, 8), "coat_dark", smooth=True)
    for z in (0.585, 0.645, 0.705):
        gold_button(p, G.frame(-90, z, 0.009), 0.0135)
        p.add(bm_tube([G.pt(-96.5, z, 0.004), G.pt(-104, z, 0.004)], 0.0032, 6), "coat_dark", smooth=True)
    # shirt front in the lapel opening, the lapels and a black stand collar round the back
    fl, fr = lapel_uv(1), lapel_uv(-1)

    def shirt(u, v):
        vv = -0.05 + 1.2 * v
        pl, z = fl(0, vv)
        pr = fr(0, vv)[0]
        return G.pt(pr - 3 + (pl - pr + 6) * u, z, 0.005)
    shell(p, "shirt", shirt, 12, 14, 0.004)
    for side in (1, -1):
        f = lapel_uv(side)
        shell(p, "lapel", lambda u, v: G.pt(*f(u, v), 0.008), 14, 18, 0.008)
        rim = [G.pt(*f(1, k / 18), 0.008) for k in range(19)] + [G.pt(*f(1 - k / 14, 1), 0.008) for k in range(1, 15)]
        p.add(bm_tube(rim, 0.0052, 8), "lapel_edge", smooth=True)
        stitch(p, [G.pt(*f(0.82, k / 18), 0.0135) for k in range(1, 17)], "stitch_grey", 0.011, 0.007, 0.0022)
        gold_button(p, G.frame(-90 + side * 30, 0.8, 0.017), 0.009)          # a small lapel stud
    col = [(0.142, 0.925), (0.136, 0.95), (0.12, 0.975), (0.1, 0.995), (0.088, 1.004)]
    p.add(bm_lathe(col, 40, arc=(-35, 215)), "lapel", M(scale=(1, G.ys + 0.03, 1)), smooth=True)
    # the ruff (two pleated layers) and the three-tier jabot
    ruff(p, 0.966, 0.05, 0.142, 18, 0.015)
    ruff(p, 0.986, 0.05, 0.118, 18, 0.013, phase=math.pi)
    for zt, h, r0, r1 in ((0.958, 0.046, 0.016, 0.07), (0.912, 0.044, 0.015, 0.062), (0.868, 0.04, 0.014, 0.052)):
        yc = -G.rad(zt - h * 0.5) * G.ys + 0.022
        jabot_tier(p, zt, h, r0, r1, yc)
    # skirts with tails, the back: two waist buttons and a centre seam
    for side in (1, -1):
        skirt(p, side)
    for phi in (78, 102):
        gold_button(p, G.frame(phi, WAIST + 0.014, 0.012), 0.0135)
    p.add(bm_tube([G.pt(90, z, 0.003) for z in (WAIST + 0.03, 0.65, 0.78, 0.9)], 0.0036, 6), "coat_dark", smooth=True)
    return p


# ---------------------------------------------------------------- head

NECK = 1.0
HD = vc.Head((0, 0, NECK + 0.27), 0.296, 0.272, 0.268)
EYE_X, EYE_Z, EYE_W, EYE_H = 0.093, 0.0, 0.028, 0.041
LID = 0.007                    # the half-lid's lower edge, above the eye centre


def smug_eye(hp, s):
    """House eye under a skin-coloured half-lid with a fine lash line (the smug look)."""
    ex, ez = s * EYE_X, EYE_Z
    HD.on_face(hp, "eye_dark", ex, ez, EYE_W, EYE_H, 0.012, u=28, v=16)
    HD.on_face(hp, "white", ex + 0.0085, ez - 0.005, 0.0072, 0.0082, 0.004, out=0.0105)
    p, n = HD.fpt(ex, ez, 0.0)
    fm = frame(p, n) @ M(rot=(0, 0, -s * 5))
    X, Z = EYE_W * 1.3, 0.0152
    bm = sphere(36, 18)
    for v in bm.verts:
        co = Vector((v.co.x * X, v.co.y * 0.032 + 0.022, v.co.z * Z))
        co.y = max(co.y, LID)
        v.co = co
    hp.add(bm, "skin_warm", fm, smooth=True)
    lash = [fm @ Vector((X * 1.01 * math.cos(t), LID, Z * 1.04 * math.sin(t))) for t in [math.pi * (0.06 + 0.88 * k / 16) for k in range(17)]]
    hp.add(bm_tube(lash, 0.0028, 6), "eye_dark", smooth=True)
    o = lash[0] if s > 0 else lash[-1]                       # a little flick at the outer corner
    hp.add(bm_tube([o, o + fm.to_3x3() @ Vector((s * 0.008, 0.006, 0.0))], [0.0028, 0.0012], 6), "eye_dark", smooth=True)


def hairline(x, y):
    """Head-local height of the hairline at the point's angle round the head: high over the
    forehead, dipping over the temples, just above the ears, low and neat at the nape."""
    phi = math.degrees(math.atan2(y / HD.b, x / HD.a))
    d = abs(((phi + 90.0 + 180.0) % 360.0) - 180.0)          # 0 at the front, 180 at the back
    pts = ((0, 0.158), (30, 0.15), (48, 0.118), (58, 0.05), (64, 0.012), (70, 0.014), (77, 0.05), (90, 0.056), (104, 0.045),
           (125, 0.0), (150, -0.075), (180, -0.105))
    for (d0, z0), (d1, z1) in zip(pts, pts[1:]):
        if d <= d1:
            t = (d - d0) / (d1 - d0)
            t = t * t * (3 - 2 * t)
            return z0 + (z1 - z0) * t
    return pts[-1][1]


def hair(hp):
    """Slicked glossy hair: two sculpted masses either side of a sharp side parting on his left,
    a smooth swoop rolling across the forehead to his right, and short sideburns."""
    a, b, c = HD.a, HD.b, HD.c
    xp = 0.115
    big, small = [], []

    def put(P, N):
        x, y, z = P
        e = (HD.hc + P - N * 0.026, 0.036)
        if y < 0.06 and z > 0.05:
            gap = 0.034 if y < -0.1 else 0.034 * max(0.0, (0.06 - y) / 0.16)
            if abs(x - xp) < gap:
                return
            (big if x < xp else small).append(e)
        else:
            (big if x < xp or y > 0.0 else small).append(e)
    nth = 46
    for i in range(nth + 1):
        th = math.pi * i / nth
        nph = max(1, int(round(92 * math.sin(th))))
        for j in range(nph):
            ph = 2 * math.pi * (j + 0.5 * (i % 2)) / nph
            P = Vector((a * math.sin(th) * math.cos(ph), b * math.sin(th) * math.sin(ph), c * math.cos(th)))
            N = Vector((P.x / a ** 2, P.y / b ** 2, P.z / c ** 2)).normalized()
            x, y, z = P
            if z < hairline(x, y) + 0.016:
                continue
            put(P, N)
    # a dense row along the hairline itself, so the edge is one clean line instead of scallops
    for k in range(96):
        ph = 360.0 * k / 96
        q, n = HD.spt(ph, 0.0)
        z = hairline(q.x - HD.hc.x, q.y - HD.hc.y) + 0.006
        q, n = HD.spt(ph, z)
        put(q - HD.hc, n)
    # the front swoop: a raised roll from the parting across the forehead to his right temple
    for x, z, r in ((0.085, 0.172, 0.03), (0.05, 0.18, 0.034), (0.0, 0.186, 0.036), (-0.05, 0.186, 0.036),
                    (-0.1, 0.178, 0.034), (-0.145, 0.164, 0.031), (-0.185, 0.144, 0.027), (-0.215, 0.12, 0.022)):
        q, n = HD.fpt(x, z)
        big.append((q - n * 0.014, r))
    hp.add(meta(big, 0.0088), "hair_black", None, smooth=True)
    hp.add(meta(small, 0.0088), "hair_black", None, smooth=True)


def brows(hp):
    """Thin, high, arched brows; the left one raised, the right one lowered onto the monocle."""
    br = []
    for s in (-1, 1):
        lift = 0.01 if s > 0 else -0.006
        for k in range(17):
            t = k / 16
            x = 0.05 + 0.1 * t
            z = 0.096 + lift + 0.024 * math.sin(math.pi * (0.15 + 0.8 * t)) - 0.008 * t
            br.append((HD.fpt(s * x, z, 0.007)[0], 0.0082 - 0.003 * t))
    hp.add(meta(br, 0.0035), "hair_black", None, smooth=True)


def moustache(hp):
    """Thin waxed moustache sweeping out from under the nose and curling up at the tips."""
    path = [(0.004, -0.097), (0.03, -0.102), (0.058, -0.102), (0.084, -0.096), (0.104, -0.084), (0.115, -0.068),
            (0.114, -0.054), (0.105, -0.048), (0.098, -0.053), (0.1, -0.06)]
    for s in (-1, 1):
        pts = [Vector((s * x, 0, z)) for x, z in path]
        L = plen(pts)
        els, n = [], 52
        for k in range(n + 1):
            t = k / n
            q = polyline_at(pts, L * t)
            r = 0.0075 * (1 - t) + 0.0033 * t if t > 0.12 else 0.0065 + 0.009 * t
            els.append((HD.fpt(q.x, q.z, 0.01)[0], r))
        hp.add(meta(els, 0.003), "hair_black", None, smooth=True)


def monocle(hp):
    """Gold monocle over his RIGHT eye (-X): rim, inner bezel, a glint, a loop and a fine chain
    hanging down to the ruff."""
    p, n = HD.fpt(-EYE_X, EYE_Z + 0.002, 0.026)
    fm = frame(p, (n + Vector((-0.12, 0, 0))).normalized())
    R = 0.05
    hp.add(bm_tube(ring_pts(fm, R, 48), 0.0058, 12, cap=False), "gold", smooth=True)
    hp.add(bm_tube(ring_pts(fm, R - 0.0065, 48, -0.002), 0.0024, 8, cap=False), "gold_dark", smooth=True)
    glint = [fm @ Vector(((R - 0.016) * math.cos(t), (R - 0.016) * math.sin(t), 0.001)) for t in [math.radians(108 + 40 * k / 8) for k in range(9)]]
    hp.add(bm_tube(glint, [0.0016, 0.0026, 0.003, 0.003, 0.003, 0.003, 0.0028, 0.0022, 0.0012], 8), "white", smooth=True)
    hp.add(sphere(10, 6), "white", fm @ Matrix.Translation(((R - 0.016) * math.cos(math.radians(162)), (R - 0.016) * math.sin(math.radians(162)), 0.001)) @ S(0.0026), smooth=True)
    ka = math.radians(222)
    kn = fm @ Vector(((R + 0.006) * math.cos(ka), (R + 0.006) * math.sin(ka), 0))
    hp.add(sphere(14, 8), "gold", M(kn, scale=0.0062), smooth=True)
    lp = kn + Vector((-0.004, -0.002, -0.008))
    hp.add(bm_tube(ring_pts(frame(lp, Vector((0, 1, 0))), 0.0055, 14), 0.0016, 6, cap=False), "gold", smooth=True)
    # chain: alternating oval links along a sagging curve down to the ruff
    start = lp + Vector((0, 0, -0.0055))
    end = Vector((-0.072, -0.118, 1.003))
    curve = vc.bezier(start, Vector((start.x - 0.012, start.y + 0.02, end.z - 0.03)), end, 40)
    L = plen(curve)
    s, k = 0.0, 0
    clear = 9.0
    while s < L:
        c = polyline_at(curve, s)
        t = (polyline_at(curve, min(s + 0.002, L)) - polyline_at(curve, max(s - 0.002, 0))).normalized()
        side = t.cross(Vector((0, 0, 1)) if abs(t.z) < 0.95 else Vector((1, 0, 0))).normalized()
        nn = side if k % 2 == 0 else t.cross(side).normalized()
        # link plane contains the tangent: local Z = nn (perpendicular to t), long axis along t
        zax = nn
        yax = t
        xax = yax.cross(zax).normalized()
        lm = Matrix.Translation(c) @ Matrix((xax, yax, zax)).transposed().to_4x4()
        hp.add(bm_tube(ring_pts(lm, 0.0034, 10, 0.0, 0.0058), 0.0013, 4, cap=False), "gold", smooth=True)
        q = c - HD.hc
        clear = min(clear, (q.x / HD.a) ** 2 + (q.y / HD.b) ** 2 + (q.z / HD.c) ** 2)
        s += 0.0088
        k += 1
    print("VANE monocle chain links %d, closest head value %.3f (>1 is clear)" % (k, clear))


# the hat: crown, brim and plume live in this frame (tipped back and a little to his right)
HAT = Matrix.Translation(HD.hc + Vector((0, 0.03, 0.166))) @ M(rot=(-17, -5, 0))
HAT_YS = 0.92
BRIM_IN, BRIM_OUT = 0.255, 0.47


def brim_z(a, v):
    """Height of the brim at angle a (0 = his left) and radial fraction v: cocked up on his left,
    drooping a little at front and back."""
    cock = max(0.0, math.cos(a)) ** 3 * 0.2 * v ** 1.6
    droop = -0.03 * math.sin(a) ** 2 * v ** 2
    return cock + droop


def hat(hp):
    m = HAT
    crown = [(0.27, -0.03), (0.272, 0.02), (0.27, 0.08), (0.262, 0.14), (0.246, 0.185), (0.214, 0.218), (0.165, 0.236),
             (0.11, 0.24), (0.06, 0.233), (0.0, 0.226)]
    hp.add(lathe(crown, 72, ys=HAT_YS, cap_top=True), "hat", m, smooth=True)

    def B(u, v):
        a = 2 * math.pi * u
        r = BRIM_IN + (BRIM_OUT - BRIM_IN) * v
        return m @ Vector((r * math.cos(a), HAT_YS * r * math.sin(a), brim_z(a, v)))
    shell(hp, "hat", B, 104, 9, 0.014, closed_u=True)
    hp.add(bm_tube([B(k / 104, 1) for k in range(105)], 0.0095, 8, cap=False), "hat_edge", smooth=True)
    # burgundy band with a gold buckle at the front left
    band = [(0.276, 0.004), (0.279, 0.012), (0.279, 0.048), (0.276, 0.056)]
    hp.add(lathe(band, 72, ys=HAT_YS), "band", m, smooth=True)
    ba = math.radians(-62)
    bp = Vector((0.281 * math.cos(ba), HAT_YS * 0.281 * math.sin(ba), 0.03))
    bn = Vector((math.cos(ba), math.sin(ba) / HAT_YS, 0)).normalized()
    buckle(hp, m @ frame(bp, bn), 0.038, 0.05)
    # ruby brooch where the cocked brim meets the crown, holding the plume
    pa = math.radians(-24)
    pb = Vector((0.284 * math.cos(pa), HAT_YS * 0.284 * math.sin(pa), 0.075))
    pn = Vector((math.cos(pa), math.sin(pa) / HAT_YS, 0.15)).normalized()
    bm_ = m @ frame(pb + pn * 0.008, pn)
    hp.add(lathe([(0.0, -0.004), (0.026, -0.003), (0.029, 0.002), (0.024, 0.006), (0.0, 0.007)], 32, cap_top=True, cap_bottom=True), "gold", bm_, smooth=True)
    for k in range(10):
        t = 2 * math.pi * k / 10
        hp.add(sphere(10, 6), "gold", bm_ @ Matrix.Translation((0.027 * math.cos(t), 0.027 * math.sin(t), 0.004)) @ S(0.0045), smooth=True)
    hp.add(sphere(20, 12), "ruby", bm_ @ Matrix.Translation((0, 0, 0.007)) @ S(0.016, 0.016, 0.01), smooth=True)
    # fluffy cream plume: a scalloped cloud along a curve sweeping up and back over the crown
    path = [Vector(v) for v in ((0.3, -0.12, 0.09), (0.31, -0.07, 0.19), (0.27, 0.03, 0.29), (0.18, 0.15, 0.335),
                                (0.06, 0.27, 0.32), (-0.04, 0.37, 0.25), (-0.07, 0.42, 0.15), (-0.05, 0.43, 0.09))]
    rad = [0.018, 0.036, 0.05, 0.056, 0.054, 0.046, 0.034, 0.02]
    L = plen(path)
    els = []
    n = 40
    for k in range(n + 1):
        t = k / n
        q = polyline_at(path, L * t)
        i = min(int(t * (len(rad) - 1)), len(rad) - 2)
        f = t * (len(rad) - 1) - i
        r = rad[i] * (1 - f) + rad[i + 1] * f
        d = (polyline_at(path, min(L * t + 0.01, L)) - polyline_at(path, max(L * t - 0.01, 0))).normalized()
        side = d.cross(Vector((0, 0, 1))).normalized()
        up = side.cross(d).normalized()
        els.append((q, r * 0.7))
        wob = 1 if k % 2 else -1
        for sgn in (-1, 1):                               # barbs fanning out either side and drooping
            els.append((q + side * sgn * r * 0.75 - up * r * 0.25 + d * r * 0.15 * wob, r * 0.5))
            els.append((q + side * sgn * r * 1.25 - up * r * 0.6 - d * r * 0.2 * wob, r * 0.34))
    hp.add(meta([(m @ q, r) for q, r in els], 0.0088, 4.0), "plume", None, smooth=True)
    hp.add(bm_tube([m @ path[0] + (m.to_3x3() @ (path[0] - path[1])).normalized() * 0.03] + [m @ q for q in path[:3]],
                   [0.004, 0.004, 0.003, 0.002], 8), "quill", smooth=True)
    # report how the crown base sits on the head (head-ellipsoid value: 1 = on the skull)
    vals = []
    for k in range(36):
        a = 2 * math.pi * k / 36
        q = m @ Vector((0.27 * math.cos(a), HAT_YS * 0.27 * math.sin(a), -0.03)) - HD.hc
        vals.append((q.x / HD.a) ** 2 + (q.y / HD.b) ** 2 + (q.z / HD.c) ** 2)
    front = m @ Vector((0, -HAT_YS * 0.27, -0.03)) - HD.hc
    print("VANE hat base head-values min %.3f max %.3f; front base at head z %.3f" % (min(vals), max(vals), front.z))


def nose(hp):
    """Soft button nose, tipped up a little (nose in the air)."""
    p, n = HD.fpt(0, -0.05, 0.021)
    hp.add(sphere(28, 18), "nose", frame(p, (n + Vector((0, 0, 0.18))).normalized()) @ S(0.041, 0.037, 0.042), smooth=True)


def smirk(hp):
    pts = []
    for k in range(11):
        t = -1 + 2 * k / 10
        pts.append(HD.fpt(0.006 + t * 0.036, -0.138 + 0.011 * t * t + 0.006 * t, 0.003)[0])
    hp.add(bm_tube(pts, 0.0048, 8), "eye_dark", smooth=True)


def head():
    hp = Part("head")
    HD.skull(hp, "skin_warm")
    HD.ears(hp, "skin_warm")
    for s in (-1, 1):
        smug_eye(hp, s)
    HD.blush(hp, x=0.172, z=-0.055, w=0.042, h=0.026)
    nose(hp)
    smirk(hp)
    brows(hp)
    moustache(hp)
    hair(hp)
    monocle(hp)
    hat(hp)
    return hp


# ---------------------------------------------------------------- arms and legs

def arm(side, cfg):
    """Slim burgundy sleeve, a black gauntlet cuff with two gold buttons and a lace frill, a mitten."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = vc.shoulder(side, cfg)
    d = vc.arm_dir(side, cfg)
    L = cfg["arm_len"]
    sr = cfg["sleeve_r"]
    p.add(sphere(28, 18), "coat", M(pv, scale=sr * 1.05), smooth=True)
    p.add(bm_tube([pv, pv + d * (L * 0.35), pv + d * (L * 0.62)], [sr, sr * 0.97, sr * 0.95], 24, cap=False), "coat", smooth=True)
    p.add(stitch_seam(pv, d, sr, side), "coat_dark", smooth=True)
    cm = frame(pv + d * (L * 0.55), d)
    cuff = [(sr * 0.92, -0.002), (sr * 1.12, 0.006), (sr * 1.22, 0.03), (sr * 1.28, 0.064), (sr * 1.24, 0.074), (sr * 1.02, 0.078)]
    p.add(lathe(cuff, 40), "lapel", cm, smooth=True)
    stitch(p, ring_pts(cm, sr * 1.27, 28, 0.058), "stitch_grey", 0.01, 0.007, 0.002)
    # two gold buttons up the outer side of the cuff
    out = Vector((side, 0.25, 0.0))
    out = (out - d * out.dot(d)).normalized()
    for zz in (0.022, 0.048):
        c = cm @ Vector((0, 0, zz))
        rr = sr * (1.13 + 0.12 * zz / 0.064)
        gold_button(p, frame(c + out * (rr + 0.002), out), 0.0075)
    # lace frill flaring out of the cuff over the wrist
    fz = 0.074

    def F(u, v):
        a = 2 * math.pi * u
        r = sr * 0.82 + 0.03 * v + 0.0065 * math.sin(11 * a) * v
        return cm @ Vector((r * math.cos(a), r * math.sin(a), fz + 0.034 * v))
    shell(p, "lace", F, 66, 4, 0.004, closed_u=True)
    p.add(bm_tube([F(k / 66, 1) for k in range(67)], 0.0035, 8, cap=False), "lace_shade", smooth=True)
    vc.mitten(p, vc.hand_c(side, cfg), "skin_warm", side)
    return p


def stitch_seam(pv, d, sr, side):
    """Outer sleeve seam as a fine piped line (returned as a bmesh)."""
    out = Vector((side, 0.35, 0.0))
    out = (out - d * out.dot(d)).normalized()
    return bm_tube([pv + d * t + out * (sr * (1.0 - 0.05 * t / 0.2) + 0.0015) for t in (0.04, 0.08, 0.12, 0.16, 0.19)], 0.0024, 6)


def leg(side, cfg):
    """Slim leg: charcoal breeches with a buttoned knee band, a tall glossy riding boot with a
    flared top, a strap and gold buckle, a pointed toe, a stacked heel."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    hz = cfg["hip_z"]
    p.add(bm_tube([(x, 0, hz + 0.02), (x, 0, 0.44), (x, 0, 0.38), (x, 0, 0.3)], [0.062, 0.06, 0.054, 0.05], 24), "breeches", smooth=True)
    p.add(bm_tube([(x + 0.0555 * math.cos(t), 0.0555 * math.sin(t), 0.392) for t in [2 * math.pi * k / 32 for k in range(33)]], 0.0075, 10, cap=False),
          "breeches_dark", smooth=True)
    gold_button(p, frame((x + side * 0.064, -0.004, 0.392), (side, -0.1, 0)), 0.0085)
    # the boot
    top = 0.335
    els = [((x, 0.004, z), 0.056) for z in [0.12 + (top - 0.04 - 0.12) * k / 5 for k in range(6)]]
    els += [((x, -0.02, 0.075), 0.058), ((x, -0.068, 0.06), 0.052), ((x, -0.108, 0.05), 0.043), ((x, -0.14, 0.044), 0.033),
            ((x, 0.032, 0.07), 0.054)]
    p.add(meta(els, 0.0075, keep=0.55), "boot", None, smooth=True)
    p.add(lathe([(0.052, top - 0.05), (0.06, top - 0.015), (0.0655, top + 0.012), (0.066, top + 0.02), (0.06, top + 0.022),
                 (0.054, top + 0.005)], 40), "boot", M((x, 0.004, 0)), smooth=True)
    sz = 0.255
    p.add(bm_tube([(x + 0.0592 * math.cos(t), 0.004 + 0.0592 * math.sin(t), sz) for t in [2 * math.pi * k / 40 for k in range(41)]], 0.0055, 8, cap=False),
          "boot_strap", smooth=True)
    buckle(p, frame((x + side * 0.064, 0.004, sz), (side, 0, 0)), 0.02, 0.026, 0.0024)
    p.add(bm_box(0.104, 0.222, 0.016, bevel=0.007, segs=3), "sole", M((x, -0.045, 0.008)), smooth=True)
    p.add(bm_box(0.084, 0.068, 0.034, bevel=0.008, segs=3), "sole", M((x, 0.036, 0.017)), smooth=True)
    return p


CFG = dict(
    neck_z=NECK, shoulder_x=0.168, shoulder_z=0.885, hip_x=0.076, hip_z=0.48,
    arm_len=0.32, arm_splay=12, arm_pose={1: (15, 12)},     # the ledger arm holds it a little out and forward
    sleeve_r=0.06, arm=arm, leg=leg,
)


# ---------------------------------------------------------------- prop

def ledger():
    """Black leather-bound ledger held by its top edge: covers, a rounded banded spine, cream page
    block with page lines, gold corner caps, a strap and gold clasp, a gold crest and a ribbon."""
    p = Part("ledger")
    g = vc.hand_c(1, CFG)
    W, D, Hh = 0.056, 0.19, 0.26                  # thickness (x), spine-to-fore-edge (y), height (z)
    m = Matrix.Translation(g + Vector((0.006, -0.004, -0.095))) @ M(rot=(0, 0, -18))
    tc = 0.0085
    for sx in (-1, 1):                            # boards (+X is the front cover, facing out)
        p.add(bm_box(tc, D, Hh, bevel=0.0035, segs=2), "ledger", m @ Matrix.Translation((sx * (W / 2 - tc / 2), 0, 0)), smooth=True)
    p.add(bm_box(W - 2 * tc + 0.002, D - 0.012, Hh - 0.012, bevel=0.002, segs=1), "page", m @ Matrix.Translation((0, -0.004, 0)), smooth=True)
    fy = -(D - 0.012) / 2 - 0.004                 # fore-edge plane of the page block
    for k in range(5):                            # page lines on the fore-edge, head and tail
        xx = -0.014 + 0.007 * k
        p.add(bm_tube([m @ Vector((xx, fy - 0.0004, -Hh / 2 + 0.01)), m @ Vector((xx, fy - 0.0004, Hh / 2 - 0.01))], 0.0009, 4), "page_line")
        for zz in (-1, 1):
            p.add(bm_tube([m @ Vector((xx, fy + 0.006, zz * (Hh / 2 - 0.0058))), m @ Vector((xx, D / 2 - 0.02, zz * (Hh / 2 - 0.0058)))], 0.0009, 4), "page_line")
    # rounded spine with raised bands and gold tooling lines
    sm = m @ Matrix.Translation((0, D / 2 - 0.006, 0))
    p.add(bm_cyl(W / 2 + 0.001, W / 2 + 0.001, Hh, 32), "ledger", sm @ Matrix.Translation((0, 0, -Hh / 2)) @ S(1, 0.55, 1), smooth=True)
    for zz in (-0.075, -0.025, 0.025, 0.075):
        ring = [sm @ Vector((W / 2 * 1.04 * math.cos(t), 0.55 * W / 2 * 1.04 * math.sin(t), zz)) for t in [math.pi * k / 16 for k in range(17)]]
        p.add(bm_tube(ring, 0.0042, 8), "ledger_dark", smooth=True)
        for dz in (-0.009, 0.009):
            ring = [sm @ Vector((W / 2 * 1.02 * math.cos(t), 0.55 * W / 2 * 1.02 * math.sin(t), zz + dz)) for t in [math.pi * k / 16 for k in range(17)]]
            p.add(bm_tube(ring, 0.0011, 4), "gold", smooth=True)
    # gold corner caps on the fore-edge corners of both boards, each with a rivet
    for sx in (-1, 1):
        xc = sx * (W / 2 - tc / 2)
        for sz in (-1, 1):
            tri = bm_prism([(0, 0), (0.042, 0), (0, 0.042)], tc + 0.004)        # in local XZ, extruded along Y
            cm = m @ Matrix.Translation((xc, -D / 2 - 0.0015, sz * (Hh / 2 + 0.0015))) @ M(rot=(0, 0, 90)) @ M(scale=(1, 1, -sz))
            p.add(tri, "gold", cm)
            p.add(sphere(10, 6), "gold_dark", m @ Matrix.Translation((sx * (W / 2 + 0.0015), -D / 2 + 0.012, sz * (Hh / 2 - 0.012))) @ S(0.004, 0.004, 0.004), smooth=True)
    # tooled gold frame and a crest (a coin with a raised ring) on the front cover
    fx = W / 2 + 0.0009
    fr = [m @ Vector((fx, y, z)) for y, z in ((-0.075, -0.108), (0.07, -0.108), (0.07, 0.108), (-0.075, 0.108), (-0.075, -0.108))]
    p.add(bm_tube(fr, 0.0016, 6, cap=False), "gold", smooth=True)
    cc = m @ Matrix.Translation((fx, -0.003, 0.02)) @ M(rot=(0, 90, 0))
    p.add(bm_cyl(0.026, 0.026, 0.003, 32), "gold", cc, smooth=True)
    p.add(bm_tube(ring_pts(cc, 0.02, 32, 0.0035), 0.0018, 6, cap=False), "gold_dark", smooth=True)
    p.add(sphere(16, 10), "gold", cc @ Matrix.Translation((0, 0, 0.003)) @ S(0.009, 0.009, 0.004), smooth=True)
    # strap from the back board round the fore-edge to a gold clasp on the front cover
    zc = -0.04
    p.add(bm_box(0.004, 0.05, 0.026, bevel=0.0015, segs=2), "ledger_dark", m @ Matrix.Translation((-W / 2 - 0.002, -D / 2 + 0.022, zc)), smooth=True)
    p.add(bm_box(W + 0.008, 0.005, 0.026, bevel=0.002, segs=2), "ledger_dark", m @ Matrix.Translation((0, -D / 2 - 0.0035, zc)), smooth=True)
    p.add(bm_box(0.004, 0.045, 0.026, bevel=0.0015, segs=2), "ledger_dark", m @ Matrix.Translation((W / 2 + 0.002, -D / 2 + 0.02, zc)), smooth=True)
    p.add(bm_box(0.005, 0.03, 0.034, bevel=0.0025, segs=2), "gold", m @ Matrix.Translation((W / 2 + 0.005, -D / 2 + 0.046, zc)), smooth=True)
    p.add(sphere(12, 8), "gold_dark", m @ Matrix.Translation((W / 2 + 0.008, -D / 2 + 0.046, zc)) @ S(0.004, 0.006, 0.006), smooth=True)
    for y in (-D / 2 + 0.01, -D / 2 + 0.034):
        p.add(sphere(8, 6), "gold", m @ Matrix.Translation((-W / 2 - 0.0045, y, zc)) @ S(0.003), smooth=True)
    # ribbon bookmark hanging from the tail near the spine, with a notched end
    rb = m @ Matrix.Translation((0.004, D / 2 - 0.04, -Hh / 2))
    p.add(bm_box(0.0016, 0.012, 0.05), "ribbon", rb @ Matrix.Translation((0, 0, -0.02)) @ M(rot=(6, 0, 0)), smooth=True)
    for sy in (-1, 1):
        p.add(bm_box(0.0016, 0.0068, 0.012), "ribbon", rb @ Matrix.Translation((0, sy * 0.0032, -0.048)) @ M(rot=(sy * 18, 0, 0)), smooth=True)
    # clearance from the coat (positive = outside the coat surface)
    worst = 9.0
    for v in p.bm.verts:
        q = v.co
        if 0.2 < q.z < 1.0:
            rr = math.sqrt(q.x ** 2 + (q.y / COAT.ys) ** 2)
            worst = min(worst, rr - (COAT.rad(q.z) + SKIRT_OUT + SKIRT_T))
    print("VANE ledger closest to coat %.3f m" % worst)
    return p, g


CFG.update(body=body, head=head, props=[("ledger", "arm_l", ledger)], closeup_z=1.24,
           shots=[("back", (0, 0, 0.8), 160, 8, 3.4), ("left", (0, 0, 1.28), -62, 6, 1.7), ("ledger", (0.25, -0.05, 0.5), -60, 6, 1.4)])


def main():
    return vc.build("lord_vane", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
