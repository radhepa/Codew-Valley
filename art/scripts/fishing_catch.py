"""Everything the pond can give (src/life/fishing/items.ts), for the catch reveal and the fish journal.

public/models/fishing_catch.glb holds one object per item id, laid out in a row for the AO bake (the
game resets each clone's position): minnow, perch, brown_trout, carp, pike, eel, crayfish, golden_koi,
old_boot, willowmere_coin. Each origin is the middle of the catch (where hands hold it up); fish
lie along X with the head toward +X and the back up (+Z). Sizes are true-ish lengths in metres.
Journal art: src/life/fishing/img/<id>.png (transparent side views).
"""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import fishing_kit as fk
importlib.reload(fk)
from fishing_kit import common, vc, Part, M, bm_box, bm_cyl, bm_tube, S, sphere, lathe, ring_pts, frame, lerp_keys, loft, add_banded, fin, fish_eye
import bpy, bmesh
from mathutils import Vector, Matrix

vc.palette({
    "iris_gold": "#D8B866", "iris_pale": "#D9D2B4", "mouth_in": "#8C4A44", "tooth": "#F1EBDD",
    # minnow
    "mn_back": "#6F7C6E", "mn_side": "#B6C0BC", "mn_belly": "#E4E6DD", "mn_stripe": "#45524F", "mn_fin": "#A9B3AE",
    # perch
    "pc_back": "#5F6E36", "pc_side": "#A2A455", "pc_belly": "#E0DAB2", "pc_bar": "#38452A", "pc_fin": "#8A8448", "pc_red": "#C3613A",
    # brown trout
    "bt_back": "#5E4B32", "bt_side": "#AE8650", "bt_belly": "#E6D5A6", "bt_spot": "#33261C", "bt_red": "#AD4632", "bt_halo": "#E9DDC0", "bt_fin": "#8C6A42",
    # carp
    "cp_back": "#6E5428", "cp_side": "#AE8A3E", "cp_belly": "#DFC786", "cp_scale": "#8F7034", "cp_fin": "#86663A",
    # pike
    "pk_back": "#3F5634", "pk_side": "#728A4A", "pk_belly": "#E1DFC2", "pk_spot": "#C7CC8C", "pk_fin": "#7C7444", "pk_fin_red": "#9C5A3A",
    # eel
    "el_back": "#3F3F2E", "el_side": "#6A6640", "el_belly": "#BDB079", "el_fin": "#55523A",
    # crayfish
    "cr_shell": "#8C4632", "cr_dark": "#5E2D22", "cr_light": "#B8653F", "cr_claw": "#C47A45",
    # golden koi
    "koi_gold": "#D9A52C", "koi_deep": "#B87E1E", "koi_pale": "#F0D58A", "koi_fin": "#E8C25E",
    # boot
    "boot": "#5A4636", "boot_dark": "#3D2F25", "boot_sole": "#2F2924", "lace": "#BFAE8A", "weed": "#58763A", "weed_dark": "#3F5A2A",
    # coin
    "bronze": "#8C6B3A", "bronze_dark": "#5E4826", "verdigris": "#5F9C86", "verdigris_light": "#86BCA8",
}, metal={"koi_gold": (0.55, 0.3), "koi_deep": (0.5, 0.35), "bronze": (0.75, 0.35), "bronze_dark": (0.7, 0.42)},
    gloss={"mn_side": 0.35, "mn_belly": 0.4, "iris_gold": 0.3, "el_back": 0.3, "el_side": 0.3, "cr_shell": 0.45, "koi_pale": 0.35})


class Body:
    """A lofted fish body (u: 0 at the tail root, 1 at the nose) with surface lookups for details."""

    def __init__(self, x0, x1, rh, rw, zc=lambda u: 0.0):
        self.x0, self.x1, self.rh, self.rw, self.zc = x0, x1, rh, rw, zc

    def x(self, u):
        return self.x0 + (self.x1 - self.x0) * u

    def at(self, u, a, out=0.0):
        """Surface point and normal at u, angle a (degrees; 0 on top, 90 on the +Y flank, 180 under)."""
        r = math.radians(a)
        h, w = self.rh(u), self.rw(u)
        n = Vector((0.0, math.sin(r) / max(w, 1e-5), math.cos(r) / max(h, 1e-5))).normalized()
        p = Vector((self.x(u), math.sin(r) * w, self.zc(u) + math.cos(r) * h)) + n * out
        return p, n

    def add(self, part, bands, segs=36, rings=44):
        bm = loft(self.x0, self.x1, self.rh, self.rw, self.zc, rings=rings, segs=segs)
        add_banded(part, bm, lambda c, n: bands[0] if n.z > 0.42 else (bands[2] if n.z < -0.38 else bands[1]))


def prof(keys, k):
    return lambda u: lerp_keys(keys, u) * k


FISH_H = [(0.0, 0.09), (0.12, 0.2), (0.42, 1.0), (0.68, 0.95), (0.86, 0.68), (0.96, 0.36), (1.0, 0.06)]
FISH_W = [(0.0, 0.08), (0.12, 0.15), (0.45, 0.55), (0.7, 0.55), (0.88, 0.4), (0.97, 0.2), (1.0, 0.04)]


def spots(part, body, mat, n, u0, u1, a0, a1, r, seed, squash=0.35, both=True):
    import random
    rnd = random.Random(seed)
    for _ in range(n):
        u = rnd.uniform(u0, u1)
        a = rnd.uniform(a0, a1)
        for side in ((1, -1) if both else (1,)):
            p, nrm = body.at(u, a * side, out=-0.0005)
            rr = r * rnd.uniform(0.7, 1.25)
            part.add(sphere(10, 6), mat, frame(p, nrm) @ S(rr, rr, rr * squash), smooth=True)


def eyes(part, body, u, a, r, iris="iris_gold"):
    for side in (1, -1):
        p, n = body.at(u, a * side, out=-r * 0.15)
        n = (n + Vector((0.25, 0, 0))).normalized()
        fish_eye(part, p, n, r, iris)


def mouth(part, body, u, a, w, mat="mouth_in"):
    for side in (1, -1):
        pts = [body.at(u + d, (a + 8 * k) * side, out=0.0004)[0] for k, d in enumerate((0.0, 0.012, 0.022))]
        part.add(bm_tube(pts, w, 6), mat, smooth=True)


def gill(part, body, u, mat, w=0.0018, a0=55, a1=140):
    for side in (1, -1):
        pts = [body.at(u - 0.025 * math.sin(math.pi * k / 8), (a0 + (a1 - a0) * k / 8) * side, out=0.0004)[0] for k in range(9)]
        part.add(bm_tube(pts, w, 5), mat, smooth=True)


def side_fins(part, body, u, a, outline, thick, mat, roll=35, sweep=-30):
    """Paired fins (pectoral or pelvic): drawn in the side view, then turned out from the body."""
    for side in (1, -1):
        p, _ = body.at(u, a * side, out=-0.002)
        fin(part, outline, thick, mat, at=p, rot=(side * roll, 0, side * sweep))


def tail(part, body, outline, thick, mat):
    x = body.x0
    fin(part, outline, thick, mat, at=(x + 0.004, 0, body.zc(0)))


# ---------------------------------------------------------------- the catches

def minnow():
    L = 0.1
    p = Part("minnow")
    b = Body(-L * 0.36, L * 0.5, prof(FISH_H, 0.011), prof(FISH_W, 0.009))
    b.add(p, ("mn_back", "mn_side", "mn_belly"))
    for side in (1, -1):
        pts = [b.at(u, 92 * side, out=0.0002)[0] for u in [0.05 + 0.08 * k for k in range(11)]]
        p.add(bm_tube(pts, 0.0011, 5), "mn_stripe", smooth=True)
    eyes(p, b, 0.86, 70, 0.0042)
    mouth(p, b, 0.97, 120, 0.0006)
    tail(p, b, [(0, 0.002), (-0.014, 0.011), (-0.02, 0.012), (-0.015, 0.0), (-0.02, -0.012), (-0.014, -0.011), (0, -0.002)], 0.0012, "mn_fin")
    fin(p, [(0.004, 0.0), (-0.002, 0.008), (-0.008, 0.007), (-0.01, 0.0)], 0.0009, "mn_fin", at=(b.x(0.5), 0, 0.009))
    side_fins(p, b, 0.72, 120, [(0, 0), (-0.008, 0.003), (-0.011, -0.001), (-0.004, -0.003)], 0.0007, "mn_fin")
    return p


def perch():
    L = 0.25
    p = Part("perch")
    b = Body(-L * 0.38, L * 0.5, prof([(0, 0.1), (0.12, 0.24), (0.45, 1.0), (0.7, 0.96), (0.88, 0.62), (0.97, 0.3), (1.0, 0.06)], 0.042),
             prof(FISH_W, 0.026), zc=lambda u: 0.004 * math.sin(math.pi * u))
    b.add(p, ("pc_back", "pc_side", "pc_belly"))
    for k in range(6):                                   # the dark bars down the flanks
        u = 0.2 + 0.11 * k
        for side in (1, -1):
            pts = [b.at(u - 0.012 * math.sin(math.radians(a)), a * side, out=-0.0004)[0] for a in range(10, 120, 10)]
            p.add(bm_tube(pts, [0.0062 - 0.004 * (j / 10) for j in range(11)], 6), "pc_bar", smooth=True)
    eyes(p, b, 0.85, 62, 0.0105)
    mouth(p, b, 0.975, 112, 0.0014)
    gill(p, b, 0.78, "pc_back", 0.0019)
    tail(p, b, [(0, 0.006), (-0.03, 0.03), (-0.048, 0.034), (-0.04, 0.0), (-0.048, -0.034), (-0.03, -0.03), (0, -0.006)], 0.0026, "pc_fin")
    # spiny first dorsal (scalloped) with its dark spot, then the soft second dorsal
    spiny = [(0.03, 0.0)] + [(0.03 - 0.008 * k, (0.026 if k % 2 == 0 else 0.019) - 0.0011 * k) for k in range(1, 9)] + [(-0.04, 0.0)]
    fin(p, spiny, 0.0022, "pc_fin", at=(b.x(0.62), 0, 0.038), n=3)
    fin(p, [(0.006, 0.0), (0.0, 0.009), (-0.006, 0.006), (-0.004, 0.0)], 0.0026, "pc_bar", at=(b.x(0.5), 0, 0.054))
    fin(p, [(0.018, 0.0), (0.006, 0.022), (-0.018, 0.018), (-0.026, 0.0)], 0.002, "pc_fin", at=(b.x(0.3), 0, 0.032))
    fin(p, [(0.012, 0.0), (0.0, -0.018), (-0.016, -0.014), (-0.02, 0.0)], 0.0022, "pc_red", at=(b.x(0.33), 0, -0.033))
    side_fins(p, b, 0.66, 150, [(0, 0), (-0.014, -0.012), (-0.022, -0.01), (-0.01, 0.0)], 0.0018, "pc_red", roll=20, sweep=-15)
    side_fins(p, b, 0.74, 110, [(0, 0), (-0.02, 0.008), (-0.026, 0.0), (-0.01, -0.006)], 0.0016, "pc_fin")
    return p


def brown_trout():
    L = 0.36
    p = Part("brown_trout")
    b = Body(-L * 0.4, L * 0.5, prof([(0, 0.08), (0.12, 0.2), (0.45, 0.92), (0.66, 0.96), (0.86, 0.72), (0.96, 0.4), (1.0, 0.08)], 0.043),
             prof(FISH_W, 0.032))
    b.add(p, ("bt_back", "bt_side", "bt_belly"))
    spots(p, b, "bt_spot", 34, 0.15, 0.9, 10, 95, 0.0036, 3)
    import random
    rnd = random.Random(7)
    for _ in range(12):                                   # red spots with pale halos along the lateral line
        u, a = rnd.uniform(0.2, 0.78), rnd.uniform(78, 108)
        for side in (1, -1):
            pp, nn = b.at(u, a * side, out=-0.0004)
            p.add(sphere(12, 8), "bt_halo", frame(pp, nn) @ S(0.0058, 0.0058, 0.002), smooth=True)
            pp, nn = b.at(u, a * side, out=0.0006)
            p.add(sphere(12, 8), "bt_red", frame(pp, nn) @ S(0.0034, 0.0034, 0.0016), smooth=True)
    eyes(p, b, 0.875, 68, 0.0108)
    mouth(p, b, 0.975, 110, 0.0018)
    gill(p, b, 0.8, "bt_back", 0.002)
    tail(p, b, [(0, 0.008), (-0.04, 0.036), (-0.056, 0.04), (-0.052, 0.0), (-0.056, -0.04), (-0.04, -0.036), (0, -0.008)], 0.003, "bt_fin")
    fin(p, [(0.022, 0.0), (0.008, 0.03), (-0.016, 0.028), (-0.026, 0.0)], 0.0024, "bt_fin", at=(b.x(0.56), 0, 0.04))
    fin(p, [(0.006, 0.0), (0.0, 0.01), (-0.008, 0.008), (-0.008, 0.0)], 0.0022, "bt_fin", at=(b.x(0.2), 0, 0.022))   # adipose
    fin(p, [(0.012, 0.0), (0.002, -0.02), (-0.016, -0.016), (-0.02, 0.0)], 0.0022, "bt_fin", at=(b.x(0.3), 0, -0.03))
    side_fins(p, b, 0.5, 160, [(0, 0), (-0.016, -0.012), (-0.024, -0.008), (-0.01, 0.0)], 0.002, "bt_fin", roll=20, sweep=-15)
    side_fins(p, b, 0.76, 115, [(0, 0), (-0.024, 0.008), (-0.03, -0.001), (-0.012, -0.006)], 0.0018, "bt_fin")
    return p


def carp_like(name, L, bands, fin_mat, scale_mat=None, long_fins=False):
    p = Part(name)
    b = Body(-L * 0.36, L * 0.5, prof([(0, 0.1), (0.12, 0.24), (0.42, 1.0), (0.66, 0.98), (0.86, 0.7), (0.97, 0.36), (1.0, 0.1)], L * 0.15),
             prof(FISH_W, L * 0.095), zc=lambda u: L * 0.012 * math.sin(math.pi * u))
    b.add(p, bands)
    if scale_mat:                                         # big soft scales in staggered rows
        for row, a in enumerate(range(28, 150, 17)):
            n = 11
            for k in range(n):
                u = 0.14 + 0.66 * (k + 0.5 * (row % 2)) / n
                for side in (1, -1):
                    pp, nn = b.at(u, a * side, out=-0.0006)
                    s = L * 0.02 * (1.0 - 0.3 * abs(a - 90) / 60)
                    p.add(sphere(10, 4), scale_mat, frame(pp, nn) @ S(s, s * 0.85, s * 0.14), smooth=True)
    eyes(p, b, 0.85, 78, L * 0.026, "iris_gold")
    mouth(p, b, 0.985, 122, L * 0.005)
    for side in (1, -1):                                  # barbels
        pp, _ = b.at(0.96, 140 * side, out=0.0)
        p.add(bm_tube([pp, pp + Vector((0.01 * L / 0.5, side * 0.012 * L / 0.5, -0.02 * L / 0.5)), pp + Vector((0.006, side * 0.022, -0.034)) * (L / 0.5)], [L * 0.005, L * 0.003, L * 0.0016], 6), fin_mat, smooth=True)
    gill(p, b, 0.8, bands[0], L * 0.005)
    k = L / 0.5
    if long_fins:
        tail(p, b, [(0, 0.012 * k), (-0.06 * k, 0.07 * k), (-0.12 * k, 0.09 * k), (-0.1 * k, 0.02 * k), (-0.085 * k, 0.0), (-0.1 * k, -0.02 * k), (-0.12 * k, -0.09 * k), (-0.06 * k, -0.07 * k), (0, -0.012 * k)], 0.003 * k, fin_mat)
        fin(p, [(0.08 * k, 0.0), (0.04 * k, 0.05 * k), (-0.06 * k, 0.07 * k), (-0.1 * k, 0.03 * k), (-0.09 * k, 0.0)], 0.0028 * k, fin_mat, at=(b.x(0.5), 0, 0.07 * k))
        side_fins(p, b, 0.74, 125, [(0, 0), (-0.06 * k, 0.01 * k), (-0.09 * k, -0.02 * k), (-0.03 * k, -0.02 * k)], 0.0024 * k, fin_mat)
    else:
        tail(p, b, [(0, 0.012 * k), (-0.06 * k, 0.06 * k), (-0.085 * k, 0.07 * k), (-0.07 * k, 0.0), (-0.085 * k, -0.07 * k), (-0.06 * k, -0.06 * k), (0, -0.012 * k)], 0.004 * k, fin_mat)
        fin(p, [(0.08 * k, 0.0), (0.06 * k, 0.04 * k), (-0.05 * k, 0.03 * k), (-0.07 * k, 0.0)], 0.003 * k, fin_mat, at=(b.x(0.5), 0, 0.07 * k))
        side_fins(p, b, 0.74, 125, [(0, 0), (-0.035 * k, 0.012 * k), (-0.05 * k, -0.004 * k), (-0.018 * k, -0.012 * k)], 0.0024 * k, fin_mat)
    fin(p, [(0.02 * k, 0.0), (0.004 * k, -0.035 * k), (-0.022 * k, -0.03 * k), (-0.03 * k, 0.0)], 0.0028 * k, fin_mat, at=(b.x(0.28), 0, -0.06 * k))
    side_fins(p, b, 0.5, 165, [(0, 0), (-0.03 * k, -0.022 * k), (-0.042 * k, -0.014 * k), (-0.016 * k, 0.0)], 0.0024 * k, fin_mat, roll=20, sweep=-15)
    return p


def carp():
    return carp_like("carp", 0.5, ("cp_back", "cp_side", "cp_belly"), "cp_fin", "cp_scale")


def golden_koi():
    p = carp_like("golden_koi", 0.44, ("koi_deep", "koi_gold", "koi_pale"), "koi_fin", "koi_gold", long_fins=True)
    return p


def pike():
    L = 0.75
    p = Part("pike")
    # long and round, the head flattening into a duck-bill snout
    b = Body(-L * 0.42, L * 0.5, prof([(0, 0.12), (0.1, 0.3), (0.35, 0.9), (0.62, 1.0), (0.8, 0.8), (0.9, 0.42), (1.0, 0.1)], 0.05),
             prof([(0, 0.1), (0.1, 0.28), (0.4, 0.8), (0.7, 0.85), (0.86, 0.85), (0.95, 0.6), (1.0, 0.2)], 0.042),
             zc=lambda u: -0.012 * max(0.0, (u - 0.78) / 0.22) ** 2)
    b.add(p, ("pk_back", "pk_side", "pk_belly"), segs=40, rings=56)
    spots(p, b, "pk_spot", 60, 0.08, 0.78, 50, 120, 0.0075, 11, squash=0.25)
    eyes(p, b, 0.86, 38, 0.013)
    # a grumpy brow over each eye
    for side in (1, -1):
        pts = [b.at(0.86 + d, (30 - 18 * abs(d) / 0.03) * side, out=0.004)[0] for d in (-0.03, -0.01, 0.01, 0.03)]
        p.add(bm_tube(pts, [0.003, 0.0045, 0.0045, 0.003], 6), "pk_back", smooth=True)
    # the long jaw line with a row of small teeth
    for side in (1, -1):
        jaw = [b.at(u, 112 * side, out=0.0005)[0] for u in (0.8, 0.86, 0.92, 0.97, 0.995)]
        p.add(bm_tube(jaw, 0.0026, 6), "mouth_in", smooth=True)
        for u in (0.85, 0.885, 0.92, 0.95, 0.975):
            tp, tn = b.at(u, 116 * side, out=0.0)
            p.add(lathe([(0.0022, 0.0), (0.0012, 0.003), (0.0003, 0.0055)], 8, cap_top=True, cap_bottom=True), "tooth", frame(tp, Vector((0, 0, -1)) + tn * 0.3), smooth=True)
    gill(p, b, 0.76, "pk_back", 0.0028, 45, 140)
    tail(p, b, [(0, 0.012), (-0.06, 0.05), (-0.09, 0.058), (-0.075, 0.0), (-0.09, -0.058), (-0.06, -0.05), (0, -0.012)], 0.004, "pk_fin_red")
    fin(p, [(0.03, 0.0), (0.012, 0.045), (-0.03, 0.04), (-0.05, 0.0)], 0.003, "pk_fin", at=(b.x(0.17), 0, 0.03))     # dorsal far back
    fin(p, [(0.03, 0.0), (0.01, -0.04), (-0.03, -0.035), (-0.045, 0.0)], 0.003, "pk_fin", at=(b.x(0.17), 0, -0.03))  # anal opposite
    side_fins(p, b, 0.45, 160, [(0, 0), (-0.03, -0.02), (-0.044, -0.012), (-0.016, 0.0)], 0.0026, "pk_fin_red", roll=20, sweep=-15)
    side_fins(p, b, 0.76, 125, [(0, 0), (-0.045, 0.01), (-0.055, -0.004), (-0.022, -0.012)], 0.0024, "pk_fin_red")
    return p


def eel():
    p = Part("eel")
    L = 0.66
    n = 60
    path = [Vector((L * (0.5 - k / n), 0.012 * math.sin(k / n * math.pi * 2.2), 0.035 * math.sin(k / n * math.pi * 2.2) * (k / n))) for k in range(n + 1)]
    def r_at(t):
        return 0.022 * lerp_keys([(0, 0.55), (0.08, 0.9), (0.25, 1.0), (0.6, 0.85), (0.9, 0.35), (1.0, 0.12)], t)
    radii = [r_at(k / n) for k in range(n + 1)]
    bm = bm_tube(path, radii, 24, cap=True)
    add_banded(p, bm, lambda c, nn: "el_back" if nn.z > 0.35 else ("el_belly" if nn.z < -0.35 else "el_side"))
    # a soft ribbon fin along the back and belly, running into the tail
    for sgn, t0 in ((1, 0.32), (-1, 0.5)):
        pts, rr = [], []
        for k in range(int(t0 * n), n + 1):
            t = k / n
            h = 0.009 * min(1.0, (t - t0) / 0.1)
            pts.append(path[k] + Vector((0, 0, sgn * (radii[k] + h * 0.5))))
            rr.append(h * 0.6 + 0.001)
        bm2 = bm_tube(pts, rr, 8)
        p.add(bm2, "el_fin", M(scale=(1, 0.22, 1)) if False else Matrix(), smooth=True)
    head = path[0]
    hp = path[0] + (path[0] - path[1]).normalized() * 0.004
    for side in (1, -1):
        e = hp + Vector((-0.012, side * 0.0115, 0.006))
        fish_eye(p, e, Vector((0.3, side, 0.4)).normalized(), 0.0042, "iris_pale")
        p.add(bm_tube([hp + Vector((0.004, side * 0.006, -0.004)), hp + Vector((-0.008, side * 0.009, -0.006))], 0.0011, 5), "mouth_in", smooth=True)
        fin(p, [(0, 0), (-0.012, 0.008), (-0.018, 0.0), (-0.01, -0.006)], 0.0012, "el_fin", at=path[5] + Vector((0, side * 0.014, -0.002)), rot=(side * 40, 0, side * -40))
    return p


def crayfish():
    p = Part("crayfish")
    # carapace, tail plates and tail fan along X (head toward +X)
    cara = Body(-0.005, 0.045, prof([(0, 0.85), (0.4, 1.0), (0.8, 0.85), (1.0, 0.2)], 0.012), prof([(0, 0.9), (0.4, 1.0), (0.85, 0.75), (1.0, 0.2)], 0.0125))
    cara.add(p, ("cr_shell", "cr_shell", "cr_light"), segs=28, rings=20)
    p.add(bm_tube([Vector((0.0, 0.0, 0.012)), Vector((0.04, 0.0, 0.0115))], 0.0012, 5), "cr_dark", smooth=True)  # the back seam
    for k in range(5):
        x = -0.008 - 0.0085 * k
        s = 1.0 - 0.1 * k
        p.add(sphere(20, 10), "cr_shell" if k % 2 == 0 else "cr_light", M((x, 0, 0.002 - 0.0015 * k)) @ S(0.0058, 0.011 * s, 0.0085 * s), smooth=True)
        p.add(bm_tube(ring_pts(M((x + 0.004, 0, 0.002 - 0.0015 * k), (0, 90, 0)), 0.0086 * s, 20, ry=0.0108 * s), 0.0008, 4, cap=False), "cr_dark", smooth=True)
    for a in (-38, -14, 0, 14, 38):                       # the tail fan
        fin(p, [(0, 0.0), (-0.012, 0.004), (-0.016, 0.0), (-0.012, -0.004)], 0.0012, "cr_light", at=(-0.05, 0, -0.004), rot=(90, 0, a))
    # eyes on short stalks, long antennae and little feelers
    for side in (1, -1):
        st = Vector((0.046, side * 0.005, 0.006))
        p.add(bm_tube([st, st + Vector((0.004, side * 0.004, 0.004))], 0.0016, 6), "cr_shell", smooth=True)
        p.add(sphere(12, 8), "eye_dark", Matrix.Translation(st + Vector((0.0045, side * 0.0045, 0.0045))) @ S(0.0025), smooth=True)
        ant = [Vector((0.047, side * 0.004, 0.0)), Vector((0.07, side * 0.016, 0.006)), Vector((0.095, side * 0.04, 0.004)), Vector((0.11, side * 0.07, -0.006))]
        p.add(bm_tube(fk.catmull(ant, 4), [0.0012] * 4 + [0.001] * 4 + [0.0006] * 5, 5), "cr_dark", smooth=True)
        # the big claws on jointed arms
        sh = Vector((0.036, side * 0.011, -0.004))
        el = sh + Vector((0.012, side * 0.016, -0.002))
        wr = el + Vector((0.018, side * 0.006, 0.002))
        p.add(bm_tube([sh, el, wr], [0.0026, 0.0028, 0.0032], 8), "cr_shell", smooth=True)
        cm = frame(wr + Vector((0.012, side * 0.003, 0.0)), Vector((1, side * 0.2, 0)))
        p.add(sphere(20, 12), "cr_shell", cm @ S(0.007, 0.0055, 0.012), smooth=True)
        p.add(sphere(16, 10), "cr_claw", cm @ Matrix.Translation((side * 0.0028, 0, 0.016)) @ S(0.0032, 0.0028, 0.008), smooth=True)
        p.add(sphere(16, 10), "cr_claw", cm @ Matrix.Translation((-side * 0.0028, 0, 0.015)) @ S(0.0026, 0.0024, 0.0075), smooth=True)
        for k in range(4):                                # walking legs
            x = 0.03 - 0.008 * k
            l0 = Vector((x, side * 0.01, -0.006))
            p.add(bm_tube([l0, l0 + Vector((0.002, side * 0.009, -0.002)), l0 + Vector((0.004, side * 0.013, -0.01))], [0.0014, 0.0012, 0.0008], 5), "cr_dark", smooth=True)
    return p


def old_boot():
    p = Part("old_boot")
    # a soggy leather boot lying on its side: sole and heel, the foot, a slumped shaft, open laces, pondweed
    p.add(bm_box(0.24, 0.085, 0.016, bevel=0.007, segs=2), "boot_sole", M((0.005, 0, -0.06)), smooth=True)
    p.add(bm_box(0.06, 0.08, 0.03, bevel=0.008, segs=2), "boot_sole", M((-0.085, 0, -0.072)), smooth=True)
    foot = Body(-0.1, 0.12, prof([(0, 0.95), (0.4, 0.9), (0.75, 0.62), (0.95, 0.42), (1.0, 0.1)], 0.045), prof([(0, 0.95), (0.5, 0.95), (0.9, 0.8), (1.0, 0.2)], 0.04),
                zc=lambda u: -0.025 + 0.012 * u)
    foot.add(p, ("boot", "boot", "boot_dark"), segs=28, rings=24)
    p.add(lathe([(0.048, 0.0), (0.05, 0.06), (0.052, 0.12), (0.056, 0.15), (0.05, 0.152)], 28), "boot", M((-0.07, 0, -0.02), (0, -12, 0), (1, 0.85, 1)), smooth=True)
    p.add(bm_tube(ring_pts(M((-0.07, 0, -0.02)) @ M(rot=(0, -12, 0)) @ Matrix.Translation((0, 0, 0.15)), 0.054, 28, ry=0.046), 0.005, 6, cap=False), "boot_dark", smooth=True)
    p.add(lathe([(0.04, 0.0), (0.0004, 0.004)], 24, cap_top=True), "boot_dark", M((-0.07, 0, -0.02)) @ M(rot=(0, -12, 0)) @ Matrix.Translation((0, 0, 0.145)) @ S(1, 0.85, 1), smooth=True)
    # the toe has a hole worn through
    p.add(sphere(14, 8), "boot_sole", M((0.112, 0.012, -0.012)) @ S(0.012, 0.01, 0.008), smooth=True)
    # eyelets and laces, one end trailing
    for k in range(4):
        for side in (1, -1):
            e = Vector((-0.035 + 0.025 * k, side * 0.022, 0.024 - 0.004 * k))
            p.add(bm_tube(ring_pts(frame(e, Vector((0, side * 0.3, 1))), 0.0035, 10), 0.001, 4, cap=False), "brass", smooth=True)
        p.add(bm_tube([Vector((-0.035 + 0.025 * k, -0.022, 0.026 - 0.004 * k)), Vector((-0.03 + 0.025 * k, 0.0, 0.03 - 0.004 * k)), Vector((-0.035 + 0.025 * k, 0.022, 0.026 - 0.004 * k))], 0.0016, 5), "lace", smooth=True)
    p.add(bm_tube(fk.catmull([Vector((-0.04, 0.022, 0.03)), Vector((-0.06, 0.05, 0.02)), Vector((-0.05, 0.08, -0.02)), Vector((-0.02, 0.09, -0.05))], 4), 0.0017, 5), "lace", smooth=True)
    # pondweed draped over the shaft
    for k, (y, ln) in enumerate(((-0.02, 0.1), (0.01, 0.13), (0.03, 0.08))):
        pts = [Vector((-0.09 + 0.01 * k, y, 0.11 - 0.02 * k)) + Vector((0.01 * math.sin(t * 3), 0.025 * t, -ln * t)) for t in (0, 0.25, 0.5, 0.75, 1.0)]
        p.add(bm_tube(fk.catmull(pts, 3), [0.004, 0.0036, 0.003, 0.0026, 0.0022, 0.002, 0.0018, 0.0016, 0.0014, 0.0012, 0.0011, 0.001, 0.0009], 6), "weed" if k != 1 else "weed_dark", M(scale=(1, 0.5, 1)), smooth=True)
    return p


def willowmere_coin():
    p = Part("willowmere_coin")
    R, T = 0.026, 0.0045
    m = M(rot=(90, 0, 0))                                 # the coin stands on edge, faces along Y
    p.add(lathe([(0.0005, -T), (R * 0.93, -T), (R, -T * 0.6), (R, T * 0.6), (R * 0.93, T), (0.0005, T)], 48, cap_bottom=True, cap_top=True), "bronze", m, smooth=True)
    for s in (1, -1):
        p.add(bm_tube(ring_pts(m @ Matrix.Translation((0, 0, s * T)), R * 0.86, 48), 0.0012, 5, cap=False), "bronze_dark", smooth=True)
    # front: the rune (a stem with two arms raised, like the mark on the icon)
    f = m @ Matrix.Translation((0, 0, T + 0.0004))
    def stroke(a, b, mat="bronze_dark", w=0.0016):
        p.add(bm_tube([f @ Vector(a), f @ Vector(b)], w, 6), mat, smooth=True)
    stroke((0, -0.012, 0), (0, 0.013, 0))
    stroke((0, 0.0, 0), (-0.008, 0.008, 0))
    stroke((0, 0.0, 0), (0.008, 0.008, 0))
    for a in range(0, 360, 30):                           # dots round the rim
        q = f @ Vector((0.0175 * math.cos(math.radians(a)), 0.0175 * math.sin(math.radians(a)), 0))
        p.add(sphere(8, 6), "bronze_dark", Matrix.Translation(q) @ S(0.0011), smooth=True)
    # back: a willow over water
    bk = m @ Matrix.Translation((0, 0, -T - 0.0004)) @ M(rot=(0, 180, 0))
    p.add(bm_tube([bk @ Vector((0, -0.01, 0)), bk @ Vector((0.001, 0.0, 0)), bk @ Vector((0, 0.006, 0))], 0.0018, 6), "bronze_dark", smooth=True)
    for k in range(7):
        a = math.radians(-70 + 140 * k / 6)
        top = Vector((0.0, 0.006, 0))
        pts = [top, top + Vector((0.009 * math.sin(a), 0.006, 0)), top + Vector((0.014 * math.sin(a), -0.002, 0)), top + Vector((0.016 * math.sin(a), -0.01, 0))]
        p.add(bm_tube([bk @ q for q in pts], 0.0009, 4), "bronze_dark", smooth=True)
    p.add(bm_tube([bk @ Vector((-0.015, -0.013, 0)), bk @ Vector((0.015, -0.013, 0))], 0.0009, 4), "bronze_dark", smooth=True)
    # verdigris crusts on both faces and the edge
    import random
    rnd = random.Random(5)
    for _ in range(16):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.004, R * 0.95)
        s = rnd.choice((1, -1))
        q = m @ Vector((r * math.cos(a), r * math.sin(a), s * (T + 0.0002)))
        k = rnd.uniform(0.0022, 0.0042)
        p.add(sphere(10, 6), rnd.choice(("verdigris", "verdigris_light")), Matrix.Translation(q) @ S(k, k * 0.18, k), smooth=True)
    return p


CATCHES = [minnow, perch, brown_trout, carp, pike, eel, crayfish, golden_koi, old_boot, willowmere_coin]


def main():
    coll = common.reset()
    vc.tune_materials()
    objs = []
    x = 0.0
    for fn in CATCHES:
        part = fn()
        ob = part.to_object(coll, origin=(0, 0, 0), sharp_angle=70)
        bpy.context.view_layer.update()
        xs = [(ob.matrix_world @ Vector(c)).x for c in ob.bound_box]
        w = max(xs) - min(xs)
        ob.location.x = x + w / 2
        x += w + 0.12
        objs.append(ob)
    bpy.context.view_layer.update()
    res = fk.finish_set("fishing_catch", objs)
    # journal art: each catch alone on a transparent background
    os.makedirs(fk.THUMBS, exist_ok=True)
    for ob in objs:
        fk.thumb(ob, os.path.join(fk.THUMBS, ob.name + ".png"), azim=-14 if ob.name != "willowmere_coin" else -18, elev=16)
    # a contact sheet: everything in a row on the meadow
    for o in objs:
        o.location.z = 0.08
    bpy.context.view_layer.update()
    common.setup_render((1600, 600))
    common.preview_rig(objs, azim=-8, elev=18, lens=60, margin=1.04)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, "fishing_catch.png"))
    print("FISHING_CATCH", res, "total", sum(res.values()))
    return res


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
