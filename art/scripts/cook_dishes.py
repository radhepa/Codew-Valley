"""Every dish the founder can cook, for the reveal when it comes out of the pot, pan or oven
(src/life/cooking): one top-level object per dish, named by its item id, origin at the centre of
its base, front -Y. Sized like real food (a bowl is ~24 cm across); the game scales them up a
little when the player holds one out. Exports public/models/cook_dishes.glb and a preview of all
of them on the meadow."""
import sys, os, math, importlib, random

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import cook_common as cc
importlib.reload(cc)
from cook_common import common, Part, M, bm_box, bm_cyl, bm_ico, bm_tube, jitter, lathe, ring_pts, bezier, frame, bowl, plate
import tools_common as tc
from tools_common import pillow, smooth_outline
cc.apply()
import bpy, bmesh
from mathutils import Vector, Matrix

R = random.Random


def blob(p, c, s, mat, seed, rot=(0, 0, 0), amt=0.18):
    p.add(jitter(bm_ico(1, 2), amt, seed), mat, M(c, rot, s), smooth=True)


def cube(p, c, s, mat, seed, rnd):
    p.add(jitter(bm_box(1, 1, 1, bevel=0.15, segs=1), 0.08, seed), mat, M(c, (rnd.uniform(0, 30), rnd.uniform(0, 30), rnd.uniform(0, 90)), s), smooth=False)


def scatter(p, c, r, n, seed, make):
    rnd = R(seed)
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        d = r * math.sqrt(rnd.uniform(0.05, 1))
        make(p, Vector((c.x + d * math.cos(a), c.y + d * math.sin(a), c.z)), i, rnd)


def flecks(p, c, r, n, seed, mat="herb"):
    scatter(p, c, r, n, seed, lambda p, q, i, rnd: p.add(bm_box(0.012, 0.007, 0.002), mat, M(q + Vector((0, 0, 0.001)), (0, 0, rnd.uniform(0, 180)))))


def leaf(p, at, size, mat="herb", ang=0, tilt=12):
    out = smooth_outline([(0, 0), (0.35, 0.25), (1, 0), (0.35, -0.25)], 4)
    bm = pillow([(u * size, v * size) for u, v in out], lambda u, v: size * 0.06, 4, power=0.5)
    rot = Matrix.Rotation(math.radians(90), 4, "Y")
    p.add(bm, mat, Matrix.Translation(at) @ Matrix.Rotation(math.radians(ang), 4, "Z") @ Matrix.Rotation(math.radians(-tilt), 4, "Y") @ rot @ Matrix.Rotation(math.radians(90), 4, "X"), smooth=True)


def swirl(p, c, r, mat="cream", turns=1.6):
    pts = [c + Vector((r * (k / 30) * math.cos(turns * 2 * math.pi * k / 30), r * (k / 30) * math.sin(turns * 2 * math.pi * k / 30), 0.003)) for k in range(31)]
    p.add(bm_tube(pts, [0.004 + 0.006 * math.sin(math.pi * k / 30) for k in range(31)], 6), mat, smooth=True)


def spoon_in(p, c, ang=30):
    a = Vector((c.x + 0.02, c.y + 0.02, c.z + 0.01))
    b = a + Vector((0.13 * math.cos(math.radians(ang)), 0.04, 0.12))
    p.add(bm_tube([a, b], 0.008, 8), "wood_light", smooth=True)
    p.add(cc.sphere(12, 8), "wood_light", M(a, scale=(0.026, 0.02, 0.008)), smooth=True)


def garlic_clove(p, c, s, rnd):
    p.add(lathe([(0.0001, -0.6), (0.6, -0.4), (0.7, 0.0), (0.45, 0.5), (0.0001, 1.0)], 10), "garlic", M(c, (rnd.uniform(60, 100), 0, rnd.uniform(0, 180)), s), smooth=True)


def crayfish(p, c, ang, s=1.0):
    m = Matrix.Translation(c) @ Matrix.Rotation(math.radians(ang), 4, "Z") @ Matrix.Diagonal((s, s, s, 1))
    spine = [Vector((x, 0, 0.012 * math.sin(math.pi * (x + 0.05) / 0.12))) for x in [-0.05 + 0.012 * k for k in range(11)]]
    p.add(bm_tube([m @ q for q in spine], [0.016, 0.018, 0.019, 0.018, 0.016, 0.014, 0.012, 0.011, 0.01, 0.009, 0.006], 10), "crayfish", smooth=True)
    for k in range(5):
        q = m @ Vector((0.0 + 0.014 * k, 0, 0.026))
        p.add(bm_box(0.004, 0.036, 0.004), "crayfish_dark", Matrix.Translation(q) @ m.to_3x3().to_4x4())
    p.add(pillow([(-0.01, 0), (0, 0.02), (0.015, 0), (0, -0.02)], lambda u, v: 0.004, 3), "crayfish", m @ M((0.075, 0, 0.004), (0, 90, 0)), smooth=True)
    for sd in (-1, 1):
        arm = [m @ Vector((-0.05, sd * 0.012, 0.004)), m @ Vector((-0.075, sd * 0.03, 0.008)), m @ Vector((-0.095, sd * 0.03, 0.01))]
        p.add(bm_tube(arm, 0.0045, 6), "crayfish", smooth=True)
        p.add(cc.sphere(12, 8), "crayfish", M(arm[-1] + (m.to_3x3() @ Vector((-0.014, 0, 0))), scale=(0.02 * s, 0.01 * s, 0.008 * s)), smooth=True)
        p.add(bm_tube([m @ Vector((-0.055, sd * 0.005, 0.01)), m @ Vector((-0.12, sd * 0.05, 0.03))], 0.0012, 4), "crayfish_dark", smooth=True)
        p.add(cc.sphere(8, 6), "ink", M(m @ Vector((-0.058, sd * 0.008, 0.016)), scale=0.003), smooth=True)


def fish_shape(p, c, length, mat_body, mat_belly, ang=0, flat=0.55):
    m = Matrix.Translation(c) @ Matrix.Rotation(math.radians(ang), 4, "Z")
    n = 16
    pts = [m @ Vector((-length / 2 + length * k / n, 0, 0)) for k in range(n + 1)]
    rs = [length * 0.16 * math.sin(math.pi * min(1, (k / n) * 1.05)) ** 0.7 + 0.002 for k in range(n + 1)]
    bm = bm_tube(pts, rs, 14)
    for v in bm.verts:
        loc = m.inverted() @ v.co
        loc.z *= flat
        v.co = m @ loc
    p.add(bm, mat_body, smooth=True)
    tail = smooth_outline([(0, 0), (-0.6, 0.55), (-0.45, 0), (-0.6, -0.55)], 3)
    p.add(pillow([(u * length * 0.28, v * length * 0.28) for u, v in tail], lambda u, v: 0.003, 3), mat_body,
          m @ Matrix.Translation((-length / 2 + 0.01, 0, 0)) @ Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "Y"), smooth=True)
    p.add(cc.sphere(10, 6), "ink", M(m @ Vector((length * 0.36, length * 0.05, length * 0.05)), scale=length * 0.025), smooth=True)
    return m


# ---------------------------------------------------------------- the dishes

def bram_stew(p):
    s = bowl(p, (0, 0, 0), 0.12, 0.085, fill=0.8, fill_mat="stew")
    rnd = R(1)
    scatter(p, s, 0.08, 6, 1, lambda p, q, i, r: cube(p, q, (0.022, 0.02, 0.016), "potato_in", 10 + i, r))
    scatter(p, s, 0.08, 5, 2, lambda p, q, i, r: p.add(bm_cyl(0.015, 0.015, 0.008, 10), "carrot", M(q, (r.uniform(-20, 20), r.uniform(-20, 20), 0))))
    scatter(p, s, 0.07, 3, 3, lambda p, q, i, r: garlic_clove(p, q + Vector((0, 0, 0.004)), 0.011, r))
    flecks(p, s, 0.09, 14, 4)
    spoon_in(p, s)


def carrot_soup(p):
    s = bowl(p, (0, 0, 0), 0.12, 0.085, fill=0.8, fill_mat="soup_carrot")
    swirl(p, s, 0.05)
    leaf(p, s + Vector((0.03, -0.02, 0.004)), 0.03, ang=40)
    leaf(p, s + Vector((0.03, -0.02, 0.004)), 0.026, ang=100)
    flecks(p, s, 0.08, 8, 5, "herb_dark")


def pumpkin_soup(p):
    s = bowl(p, (0, 0, 0), 0.12, 0.085, fill=0.8, fill_mat="soup_pumpkin", band="glaze_green")
    swirl(p, s, 0.045, turns=1.2)
    scatter(p, s, 0.07, 9, 6, lambda p, q, i, r: p.add(cc.sphere(8, 6), "seed", M(q + Vector((0, 0, 0.003)), (0, 0, r.uniform(0, 180)), (0.009, 0.005, 0.0025)), smooth=True))


def fish_chowder(p):
    s = bowl(p, (0, 0, 0), 0.12, 0.085, fill=0.8, fill_mat="chowder", band="glaze_blue")
    scatter(p, s, 0.08, 5, 7, lambda p, q, i, r: cube(p, q, (0.02, 0.018, 0.014), "potato_in", 30 + i, r))
    scatter(p, s, 0.07, 5, 8, lambda p, q, i, r: blob(p, q + Vector((0, 0, 0.003)), (0.016, 0.012, 0.008), "fish_flake", 40 + i))
    flecks(p, s, 0.09, 12, 9)


def crayfish_boil(p):
    s = bowl(p, (0, 0, 0), 0.125, 0.085, fill=0.78, fill_mat="broth_red", band="glaze_green")
    crayfish(p, s + Vector((-0.02, 0.02, 0.008)), 25, 0.85)
    crayfish(p, s + Vector((0.025, -0.03, 0.008)), 200, 0.8)
    rnd = R(10)
    scatter(p, s, 0.06, 3, 11, lambda p, q, i, r: garlic_clove(p, q + Vector((0, 0, 0.004)), 0.011, r))
    flecks(p, s, 0.09, 10, 12, "herb_dark")


def herb_tea(p):
    plate(p, (0, 0, 0), 0.1, band="glaze_green")
    c = Vector((0, 0, 0.012))
    prof = [(0.03, 0), (0.036, 0.004), (0.05, 0.03), (0.056, 0.06), (0.058, 0.075), (0.054, 0.076), (0.051, 0.06), (0.044, 0.03), (0.0001, 0.012)]
    p.add(lathe(prof, 28), "glaze", Matrix.Translation(c), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation(c + Vector((0, 0, 0.062))), 0.0565, 28), 0.0025, 5, cap=False), "glaze_green", smooth=True)
    p.add(bm_cyl(0.051, 0.051, 0.002, 28), "tea", M(c + Vector((0, 0, 0.064))), smooth=True)
    hd = [c + Vector((0.054 + 0.018 * math.sin(t), 0, 0.04 + 0.02 * math.cos(t))) for t in [math.pi * k / 12 for k in range(13)]]
    p.add(bm_tube(hd, 0.005, 6), "glaze", smooth=True)
    f = c + Vector((-0.012, 0.008, 0.067))
    for k in range(10):
        a = 2 * math.pi * k / 10
        p.add(cc.sphere(8, 6), "chamomile", M(f + Vector((0.011 * math.cos(a), 0.011 * math.sin(a), 0)), (0, 0, math.degrees(a)), (0.008, 0.003, 0.0015)), smooth=True)
    p.add(cc.sphere(10, 6), "chamomile_eye", M(f + Vector((0, 0, 0.002)), scale=(0.006, 0.006, 0.004)), smooth=True)


def mint_humbug(p):
    c = Vector((0, 0, 0))
    p.add(lathe([(0.0001, 0), (0.07, 0), (0.075, 0.004), (0.075, 0.035), (0.071, 0.036), (0.07, 0.006), (0.0001, 0.006)], 28), "tin", Matrix.Translation(c), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation((0, 0, 0.033)), 0.074, 28), 0.0025, 4, cap=False), "tin_dark", smooth=True)
    spots = [(-0.03, -0.02, 0.02, 20), (0.025, -0.025, 0.02, -30), (0.0, 0.03, 0.02, 70), (0.032, 0.02, 0.02, 10), (-0.035, 0.025, 0.02, -60), (0.0, -0.002, 0.04, 40)]
    for x, y, z, a in spots:
        m = M((x, y, z), (0, 0, a))
        p.add(cc.sphere(16, 10), "mint_light", m @ Matrix.Diagonal((0.022, 0.016, 0.011, 1)), smooth=True)
        for k in (-1, 0, 1):
            pts = [m @ Vector((k * 0.009 + 0.004 * math.sin(t), 0.016 * math.cos(t) * 0.98, 0.011 * math.sin(t) * 0.98 + 0.0004)) for t in [math.pi * j / 10 for j in range(11)]]
            p.add(bm_tube(pts, 0.0018, 4), "mint", smooth=True)


def grilled_trout(p):
    top = plate(p, (0, 0, 0), 0.16)
    m = fish_shape(p, top + Vector((0.0, 0.0, 0.016)), 0.22, "trout", "trout_belly", ang=-12)
    for k in range(4):
        x = -0.05 + 0.03 * k
        p.add(bm_box(0.006, 0.05, 0.004), "grill_mark", m @ M((x, 0, 0.018), (0, 0, 35)))
    rnd = R(14)
    for i in range(5):
        p.add(bm_cyl(0.008, 0.008, 0.003, 8), "garlic", M(top + Vector((rnd.uniform(-0.1, 0.1), rnd.uniform(-0.09, -0.05), 0.002))))
    for k in range(3):
        leaf(p, top + Vector((0.08, 0.05, 0.004)), 0.032, ang=60 * k)


def potato_cakes(p):
    top = plate(p, (0, 0, 0), 0.15, band="glaze_green")
    for i, (x, y, z, rx) in enumerate(((-0.04, -0.015, 0.0, 6), (0.045, -0.01, 0.0, -6), (0.0, 0.035, 0.016, 10))):
        c = top + Vector((x, y, z))
        bm = jitter(bm_cyl(0.048, 0.046, 0.022, 18, bevel=0.007), 0.0025, 50 + i)
        p.add(bm, "potato_cake", M(c, (rx, 0, 0)), smooth=True)
        p.add(bm_tube(ring_pts(M(c + Vector((0, 0, 0.004)), (rx, 0, 0)), 0.047, 18), 0.004, 5, cap=False), "potato_cake_dark", smooth=True)
    leaf(p, top + Vector((0.0, 0.035, 0.04)), 0.028, ang=20)
    flecks(p, top, 0.09, 8, 15, "herb_dark")


def cabbage_rolls(p):
    top = plate(p, (0, 0, 0), 0.15)
    for i, y in enumerate((-0.05, 0.0, 0.05)):
        c = top + Vector((0, y, 0.022))
        p.add(bm_tube([c + Vector((-0.045, 0, 0)), c + Vector((0.045, 0, 0))], 0.022, 14), "cabbage", smooth=True)
        for sx in (-1, 1):
            p.add(cc.sphere(12, 8), "cabbage_light", M(c + Vector((sx * 0.045, 0, 0)), scale=(0.008, 0.021, 0.021)), smooth=True)
        for k in range(3):
            x = -0.03 + 0.03 * k
            p.add(bm_tube(ring_pts(frame(c + Vector((x, 0, 0)), (1, 0, 0)), 0.0222, 14), 0.0018, 4, cap=False), "cabbage_light", smooth=True)
        p.add(bm_tube(ring_pts(frame(c, (1, 0, 0)), 0.0235, 14), 0.0025, 4, cap=False), "herb_dark", smooth=True)


def egg_omelette(p):
    top = plate(p, (0, 0, 0), 0.15, band="glaze_blue")
    # a soft folded half-moon
    out = smooth_outline([(-0.1, 0.0), (-0.07, 0.06), (0.0, 0.08), (0.07, 0.06), (0.1, 0.0)], 4)
    bm = pillow([(u, v) for u, v in out] + [(0.05, -0.005), (-0.05, -0.005)], lambda u, v: 0.016, 5, power=0.6)
    p.add(bm, "butter", M(top + Vector((0, -0.03, 0.016)), (90, 0, 0)) @ Matrix.Rotation(math.radians(90), 4, "Z"), smooth=True)
    flecks(p, top + Vector((0, 0.005, 0.03)), 0.06, 12, 16)
    scatter(p, top + Vector((0, 0.0, 0.035)), 0.05, 3, 17, lambda p, q, i, r: p.add(bm_cyl(0.008, 0.008, 0.003, 8), "garlic", M(q)))


def bread_loaf(p):
    p.add(bm_box(0.24, 0.18, 0.018, bevel=0.008, segs=2), "board", M((0, 0, 0.009)))
    c = Vector((0, 0, 0.018))
    prof = [(0.0001, 0), (0.085, 0), (0.095, 0.015), (0.098, 0.035), (0.088, 0.065), (0.06, 0.088), (0.0001, 0.097)]
    p.add(lathe(prof, 30, ys=0.85), "crust", Matrix.Translation(c), smooth=True)
    for k in (-1, 0, 1):
        pts = [c + Vector((k * 0.028 + 0.01 * t, -0.055 + 0.11 * t, 0.088 - 0.03 * abs(t - 0.5) * 2 + 0.003)) for t in [j / 10 for j in range(11)]]
        p.add(bm_tube(pts, 0.004, 5), "crust_light", smooth=True)
    scatter(p, c + Vector((0, 0, 0.09)), 0.04, 7, 18, lambda p, q, i, r: p.add(cc.sphere(8, 6), "flour", M(q, scale=(0.008, 0.008, 0.002)), smooth=True))


def garlic_bread(p):
    p.add(bm_box(0.28, 0.16, 0.018, bevel=0.008, segs=2), "board", M((0, 0, 0.009)))
    n = 24
    pts = [Vector((-0.11 + 0.22 * k / n, 0.01 * math.sin(k / n * math.pi * 2), 0.04)) for k in range(n + 1)]
    rs = [0.032 * math.sin(math.pi * (0.08 + 0.84 * k / n)) ** 0.5 for k in range(n + 1)]
    bm = bm_tube(pts, rs, 14)
    for v in bm.verts:
        v.co.z = 0.018 + max(0, v.co.z - 0.018) * 0.8
    p.add(bm, "crust", smooth=True)
    # the twist: two ridges spiralling along
    for ph in (0, math.pi):
        sp = [Vector((x, 0.01 * math.sin((x + 0.11) / 0.22 * math.pi * 2) + 0.027 * math.cos(ph + 18 * (x + 0.11)) * 0.8, 0.04 + 0.022 * math.sin(ph + 18 * (x + 0.11)))) for x in [-0.09 + 0.18 * k / 30 for k in range(31)]]
        p.add(bm_tube(sp, 0.007, 6), "crust_light", smooth=True)
    flecks(p, Vector((0, 0, 0.068)), 0.06, 14, 19)
    garlic_clove(p, Vector((0.1, -0.05, 0.03)), 0.014, R(2))


def strawberry_tart(p):
    c = Vector((0, 0, 0))
    prof = [(0.0001, 0), (0.1, 0), (0.108, 0.01), (0.112, 0.035), (0.108, 0.04), (0.098, 0.036), (0.0001, 0.032)]
    p.add(lathe(prof, 48, rfun=lambda a, z: 0.004 * abs(math.cos(a * 12)) if z > 0.008 else 0.0), "pastry", Matrix.Translation(c), smooth=True)
    p.add(bm_cyl(0.099, 0.099, 0.003, 40), "cream", M((0, 0, 0.031)), smooth=True)
    rnd = R(20)
    spots = [(0, 0)] + [(0.045 * math.cos(2 * math.pi * k / 6), 0.045 * math.sin(2 * math.pi * k / 6)) for k in range(6)] + \
            [(0.08 * math.cos(2 * math.pi * k / 10 + 0.3), 0.08 * math.sin(2 * math.pi * k / 10 + 0.3)) for k in range(10)]
    for i, (x, y) in enumerate(spots):
        b = Vector((x, y, 0.033))
        prof = [(0.0001, 0), (0.014, 0.002), (0.017, 0.012), (0.012, 0.024), (0.0001, 0.032)]
        p.add(lathe(prof, 12), "strawberry_glaze" if i % 3 else "strawberry", M(b, (rnd.uniform(-12, 12), rnd.uniform(-12, 12), 0)), smooth=True)
        if i % 2 == 0:
            p.add(cc.sphere(6, 4), "seed", M(b + Vector((0.012, 0, 0.014)), scale=0.002), smooth=True)
    leaf(p, Vector((0, 0, 0.068)), 0.026, "mint", ang=30)
    leaf(p, Vector((0, 0, 0.068)), 0.022, "mint", ang=150)


def fish_pie(p):
    c = Vector((0, 0, 0))
    prof = [(0.0001, 0), (0.085, 0), (0.1, 0.01), (0.11, 0.05), (0.122, 0.055), (0.12, 0.06), (0.105, 0.056), (0.0001, 0.05)]
    p.add(lathe(prof, 36), "pie_dish", Matrix.Translation(c), smooth=True)
    crust = [(0.0001, 0.085), (0.05, 0.082), (0.09, 0.072), (0.112, 0.062), (0.118, 0.058), (0.1, 0.054)]
    p.add(lathe(crust, 40, rfun=lambda a, z: 0.005 * abs(math.sin(a * 14)) if z < 0.065 else 0.0), "crust", Matrix.Translation(c), smooth=True)
    # the pastry fish on top, and steam slits
    fish = smooth_outline([(0.05, 0.0), (0.02, 0.022), (-0.025, 0.018), (-0.04, 0.0), (-0.025, -0.018), (0.02, -0.022)], 4)
    bm = pillow(fish, lambda u, v: 0.004, 3, power=0.6)
    p.add(bm, "crust_light", M((0.0, 0.0, 0.088)) @ Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "Y") @ Matrix.Rotation(math.radians(90), 4, "Z"), smooth=True)
    tail = smooth_outline([(0, 0), (-0.022, 0.02), (-0.016, 0), (-0.022, -0.02)], 3)
    p.add(pillow(tail, lambda u, v: 0.003, 3), "crust_light", M((-0.04, 0.0, 0.088)) @ Matrix.Rotation(math.radians(90), 4, "Z") @ Matrix.Rotation(math.radians(90), 4, "Y") @ Matrix.Rotation(math.radians(90), 4, "Z"), smooth=True)
    p.add(cc.sphere(8, 6), "ink", M((0.032, 0.006, 0.093), scale=0.003), smooth=True)
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.4
        p.add(bm_box(0.022, 0.004, 0.004), "crust_dark", M((0.07 * math.cos(a), 0.07 * math.sin(a), 0.07), (0, 0, math.degrees(a) + 90)))


def shortbread(p):
    top = plate(p, (0, 0, 0), 0.14, band="glaze_blue")
    for i in range(6):
        a = 2 * math.pi * i / 6
        c = top + Vector((0.055 * math.cos(a), 0.055 * math.sin(a), 0.002 + 0.004 * (i % 2)))
        # petticoat wedges: a fat triangle with a crimped edge and fork pricks
        bm = jitter(bm_cyl(0.05, 0.05, 0.016, 3, bevel=0.006), 0.002, 60 + i)
        p.add(bm, "crust_light", M(c, (0, 0, math.degrees(a) + 180)), smooth=True)
        for k in range(2):
            p.add(cc.sphere(6, 4), "crust", M(c + Vector((0.012 * math.cos(a + 0.5 * k), 0.012 * math.sin(a + 0.5 * k), 0.016)), scale=0.003), smooth=True)
    scatter(p, top + Vector((0, 0, 0.024)), 0.07, 14, 21, lambda p, q, i, r: p.add(cc.sphere(6, 4), "sugar", M(q, scale=0.003), smooth=True))


def honey_cake(p):
    top = plate(p, (0, 0, 0), 0.15)
    c = top + Vector((0, 0, 0.0))
    prof = [(0.0001, 0), (0.085, 0), (0.088, 0.01), (0.088, 0.055), (0.084, 0.062), (0.0001, 0.064)]
    p.add(lathe(prof, 36), "crust_light", Matrix.Translation(c), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation(c + Vector((0, 0, 0.03))), 0.088, 36), 0.004, 5, cap=False), "cream", smooth=True)
    # honey glaze pooling on top, dripping down the sides
    p.add(bm_cyl(0.083, 0.083, 0.004, 36), "oil", M(c + Vector((0, 0, 0.063))), smooth=True)
    rnd = R(23)
    for k in range(9):
        a = 2 * math.pi * k / 9 + rnd.uniform(-0.2, 0.2)
        ln = rnd.uniform(0.012, 0.035)
        q = c + Vector((0.087 * math.cos(a), 0.087 * math.sin(a), 0.064))
        p.add(bm_tube([q, q + Vector((0.002 * math.cos(a), 0.002 * math.sin(a), -ln))], [0.007, 0.004], 6), "oil", smooth=True)
    # a little honeycomb nugget on top
    for k in range(3):
        a = 2 * math.pi * k / 3
        p.add(bm_cyl(0.011, 0.011, 0.012, 6), "oil", M(c + Vector((0.012 * math.cos(a), 0.012 * math.sin(a), 0.066))))


DISHES = [bram_stew, carrot_soup, pumpkin_soup, fish_chowder, crayfish_boil, herb_tea, mint_humbug, grilled_trout,
          potato_cakes, cabbage_rolls, egg_omelette, bread_loaf, garlic_bread, strawberry_tart, fish_pie, shortbread, honey_cake]


def main():
    model = common.reset()
    obs = []
    tris = {}
    for fn in DISHES:
        p = Part(fn.__name__)
        fn(p)
        ob = p.to_object(model, sharp_angle=60)
        obs.append(ob)
        tris[ob.name] = common.tris([ob])
    # bake apart from each other, in a grid, then export them all at the origin
    cols = 6
    for i, ob in enumerate(obs):
        ob.location = Vector(((i % cols - (cols - 1) / 2) * 0.34, (i // cols) * 0.34, 0))
    bpy.context.view_layer.update()
    keep = obs[:]
    common.setup_render((1400, 900))
    common.bake_ao(keep, distance=0.15, floor=0.55)
    common.preview_rig(keep, azim=-8, elev=38, lens=60, margin=1.0)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, "cook_dishes.png"))
    for ob in obs:
        ob.location = Vector((0, 0, 0))
    bpy.context.view_layer.update()
    cc.vc.tune_materials()
    common.export("cook_dishes.glb", obs)
    common.save_blend("cook_dishes")
    print("DISHES tris", sum(tris.values()), tris)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    main()
