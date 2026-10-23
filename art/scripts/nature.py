"""Nature and props for Python Village (ART.md "Nature and props", each < 2k triangles).

Painterly low-poly in the soft, atmospheric direction the user asked for (Pokemon Legends:
Arceus mood): lumpy canopies, tall grass blades with dark roots and sunlit tips, mossy
rocks. Every model gets baked AO in vertex colours (COLOR_0).

Run all:   exec(open(path).read(), {"__file__": path, "RUN_MAIN": True})
Run some:  ... {"ONLY": ["tree_oak", "bush"]}
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
import bpy, bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_ico, bm_uv, bm_prism, jitter, add_lantern
from mathutils import Vector, Matrix


def blob(p, r, loc, matname, scale=(1, 1, 1), seed=0, subdiv=2, jit=0.12, rot=(0, 0, 0)):
    p.add(jitter(bm_ico(r, subdiv), r * jit, seed), matname, M(loc, rot, scale), smooth=True)


def mesh_bounds(part):
    vs = [v.co for v in part.bm.verts]
    lo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    hi = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    return lo, hi


def moss(ob, matname="grass_dark", up=0.6):
    """Faces facing up get a moss material."""
    me = ob.data
    if matname not in [m.name for m in me.materials]:
        me.materials.append(common.mat(matname))
    idx = [m.name for m in me.materials].index(matname)
    for poly in me.polygons:
        if poly.normal.z > up:
            poly.material_index = idx


def tint_all(z0, z1, low=0.7, high=1.0, names=None):
    def fn(objs):
        for o in objs:
            if o.type == "MESH" and (names is None or o.name.startswith(names)):
                common.height_tint(o, z0, z1, low, high)
    return fn


# ------------------------------------------------------------------ trees

def tree_oak(model):
    rnd = random.Random(11)
    t = Part("trunk")
    prof = [(0.46, 0.0), (0.32, 0.14), (0.25, 0.5), (0.23, 1.4), (0.21, 2.2), (0.18, 2.7)]
    t.add(jitter(bm_lathe(prof, 9), 0.025, 1, keep_bottom=0.0), "wood_mid", smooth=True)
    for i in range(4):   # root flares
        a = i * math.pi / 2 + 0.4
        t.add(bm_tube([(0.1 * math.cos(a), 0.1 * math.sin(a), 0.32), (0.45 * math.cos(a), 0.45 * math.sin(a), 0.06),
                       (0.62 * math.cos(a), 0.62 * math.sin(a), 0.0)], [0.13, 0.09, 0.04], 6), "wood_mid", smooth=True)
    for sx, sy, h in ((1, 0.2, 3.3), (-1, -0.3, 3.4), (0.2, 1, 3.1)):
        t.add(bm_tube([(0, 0, 2.1), (0.45 * sx, 0.35 * sy, 2.75), (0.85 * sx, 0.6 * sy, h)], [0.13, 0.09, 0.05], 6),
              "wood_mid", smooth=True)
    trunk = t.to_object(model, origin=(0, 0, 0), sharp_angle=70)
    # crown: one soft core plus lumps scattered over an ellipsoid shell
    C = Vector((0.0, 0.0, 4.05))
    groups = {}
    golden = math.pi * (3 - math.sqrt(5))
    lumps = 15
    for i in range(lumps):
        zf = 1 - 2 * (i + 0.5) / lumps
        zf = max(min(zf, 0.85), -0.55)
        rr = math.sqrt(1 - zf * zf)
        a = golden * i
        pos = C + Vector((2.0 * rr * math.cos(a), 1.75 * rr * math.sin(a), 1.25 * zf))
        g = 1 + (0 if pos.z > C.z + 0.6 else (1 + int((math.degrees(a) % 360) // 120)))
        groups.setdefault(g, []).append((pos, rnd.uniform(0.62, 0.9), i))
    objs = [trunk]
    core = Part("leaves")
    blob(core, 1.55, tuple(C), "grass_dark", (1.25, 1.12, 0.85), seed=19, subdiv=3, jit=0.1)
    for g in sorted(groups):
        part = core if g == 1 else Part("leaves_%d" % g)
        cols = ["grass_dark", "grass", "leaf_deep", "grass_dark"]
        for pos, r, i in groups[g]:
            blob(part, r, tuple(pos), cols[i % 4], (1.15, 1.1, 0.85), seed=30 + i, subdiv=2, jit=0.14)
        if part is not core:
            lo, hi = mesh_bounds(part)
            objs.append(part.to_object(model, parent=trunk, origin=tuple((lo + hi) / 2), sharp_angle=80))
    objs.insert(1, core.to_object(model, parent=trunk, origin=tuple(C), sharp_angle=80))
    return objs, tint_all(2.4, 5.6, 0.62, 1.0, "leaves")


def pine_tier(r, h, n=11, seed=0, droop=0.18):
    """Jagged cone skirt: alternating long/short tips that droop a little."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    ring = []
    for i in range(2 * n):
        a = math.pi * i / n
        rr = r * (1.0 if i % 2 == 0 else 0.72) * rnd.uniform(0.92, 1.06)
        z = -droop * (1.0 if i % 2 == 0 else 0.4)
        ring.append(bm.verts.new((rr * math.cos(a), rr * math.sin(a), z)))
    inner = [bm.verts.new((r * 0.35 * math.cos(math.pi * i / n), r * 0.35 * math.sin(math.pi * i / n), h * 0.12))
             for i in range(2 * n)]
    top = bm.verts.new((0, 0, h))
    bot = bm.verts.new((0, 0, h * 0.05))
    for i in range(2 * n):
        j = (i + 1) % (2 * n)
        bm.faces.new((ring[i], ring[j], top))
        bm.faces.new((ring[j], ring[i], inner[i]))
        bm.faces.new((ring[j], inner[i], inner[j]))
        bm.faces.new((inner[j], inner[i], bot))
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def tree_pine(model):
    t = Part("trunk")
    t.add(jitter(bm_lathe([(0.34, 0.0), (0.22, 0.15), (0.18, 0.6), (0.12, 3.5), (0.05, 5.6)], 8), 0.015, 2, keep_bottom=0.0),
          "wood_dark", smooth=True)
    trunk = t.to_object(model, origin=(0, 0, 0), sharp_angle=70)
    leaves = Part("leaves")
    tiers = [(1.0, 1.75, 1.6), (1.7, 1.6, 1.45), (2.45, 1.35, 1.3), (3.2, 1.1, 1.15), (3.9, 0.82, 1.0), (4.55, 0.55, 0.95)]
    for i, (z, r, h) in enumerate(tiers):
        leaves.add(pine_tier(r, h, 11 if i < 3 else 9, seed=i), "leaf_deep" if i % 2 == 0 else "grass_dark",
                   M((0, 0, z), (0, 0, i * 17)), smooth=True)
    objs = [trunk, leaves.to_object(model, parent=trunk, origin=(0, 0, 1.0), sharp_angle=55)]
    return objs, tint_all(0.8, 5.6, 0.6, 1.0, "leaves")


def tree_stump(model):
    p = Part("tree_stump")
    p.add(jitter(bm_lathe([(0.5, 0.0), (0.38, 0.1), (0.33, 0.28), (0.32, 0.5)], 10, cap_top=False), 0.02, 3, keep_bottom=0.0),
          "wood_mid", smooth=True)
    p.cyl(0.3, 0.02, (0, 0, 0.49), "wood_light", segs=10)
    p.cyl(0.18, 0.012, (0, 0, 0.505), "wood", segs=10)
    p.cyl(0.07, 0.008, (0, 0, 0.513), "wood_light", segs=8)
    for i in range(4):
        a = i * math.pi / 2 + 0.7
        p.add(bm_tube([(0.15 * math.cos(a), 0.15 * math.sin(a), 0.25), (0.48 * math.cos(a), 0.48 * math.sin(a), 0.05),
                       (0.66 * math.cos(a), 0.66 * math.sin(a), 0.0)], [0.1, 0.07, 0.03], 6), "wood_mid", smooth=True)
    blob(p, 0.16, (-0.24, -0.22, 0.42), "grass_dark", (1.3, 1.0, 0.45), seed=5, subdiv=1)
    blob(p, 0.12, (0.28, 0.12, 0.08), "grass_dark", (1.4, 1.0, 0.5), seed=6, subdiv=1)
    for x, y, s in ((0.36, -0.28, 1.0), (0.45, -0.18, 0.7)):   # two little mushrooms
        p.cyl(0.025 * s, 0.09 * s, (x, y, 0.0), "white", segs=6)
        p.add(bm_lathe([(0.07 * s, 0.0), (0.06 * s, 0.03 * s), (0.0, 0.055 * s)], 8, cap_top=False), "cloth",
              M((x, y, 0.085 * s)), smooth=True)
    return [p.to_object(model, sharp_angle=70)], None


# ------------------------------------------------------------------ rocks & plants

def rock(p, r, loc, scale, seed, subdiv=2, mat="stone", jit=0.2, rot=(0, 0, 0)):
    bm = jitter(bm_ico(r, subdiv), r * jit, seed)
    p.add(bm, mat, M(loc, rot, scale), smooth=False)


def rock_large(model):
    p = Part("rock_large")
    rock(p, 0.9, (0, 0, 0.45), (1.55, 1.15, 1.0), 31, subdiv=3, jit=0.14, rot=(0, 0, 20))
    rock(p, 0.45, (0.95, -0.55, 0.15), (1.2, 1.0, 0.8), 32, subdiv=2, mat="stone_mid", rot=(0, 0, 40))
    ob = p.to_object(model, sharp_angle=35)
    # sit on the ground: shift so the lowest point above z=0 is ~0
    moss(ob, "grass_dark", 0.72)
    return [ob], None


def rock_small(model):
    p = Part("rock_small")
    rock(p, 0.22, (0, 0, 0.12), (1.3, 1.0, 0.85), 41, subdiv=1)
    rock(p, 0.13, (0.26, -0.12, 0.06), (1.2, 1.0, 0.8), 42, subdiv=1, mat="stone_mid")
    rock(p, 0.09, (-0.22, -0.16, 0.04), (1.1, 1.0, 0.8), 43, subdiv=1, mat="stone_light")
    ob = p.to_object(model, sharp_angle=35)
    moss(ob, "grass_dark", 0.85)
    return [ob], None


def bush(model):
    p = Part("leaves")
    for i, (x, y, z, r, m) in enumerate([(0, 0, 0.42, 0.5, "grass_dark"), (0.42, 0.1, 0.32, 0.38, "grass"),
                                          (-0.4, -0.05, 0.33, 0.4, "grass_dark"), (0.05, -0.35, 0.3, 0.34, "grass"),
                                          (-0.1, 0.32, 0.36, 0.36, "leaf_deep")]):
        blob(p, r, (x, y, z), m, (1.1, 1.0, 0.85), seed=50 + i, subdiv=3 if i == 0 else 2, jit=0.14)
    rnd = random.Random(9)
    for i in range(9):   # a sprinkle of tiny white blossoms
        a = rnd.uniform(0, 2 * math.pi)
        rr = rnd.uniform(0.3, 0.55)
        z = rnd.uniform(0.35, 0.75)
        p.ball(0.035, (rr * math.cos(a), rr * math.sin(a) * 0.9, z), "petal_white", subdiv=0, smooth=False)
    ob = p.to_object(model, origin=(0, 0, 0), sharp_angle=80)
    return [ob], tint_all(0.0, 0.9, 0.62, 1.0)


def flowers(model):
    """A small patch (~0.5 m) of soft pink and white blooms over a few leaf blades."""
    rnd = random.Random(61)
    p = Part("flowers")
    cols = ["petal_pink"] * 6 + ["petal_white", "petal_white", "petal_purple"]
    for i in range(10):   # leaf blades
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.0, 0.18)
        b0 = Vector((r * math.cos(a), r * math.sin(a), 0))
        out = Vector((math.cos(a), math.sin(a), 0)) * 0.12
        h = rnd.uniform(0.1, 0.2)
        p.add(bm_tube([tuple(b0), tuple(b0 + out * 0.4 + Vector((0, 0, h * 0.6))), tuple(b0 + out + Vector((0, 0, h)))],
                      [0.018, 0.014, 0.002], 3, cap=False), "grass_dark", M(scale=(1, 1, 1)))
    star = []
    for k in range(10):
        rr = 0.045 if k % 2 == 0 else 0.022
        aa = math.pi * k / 5
        star.append((rr * math.cos(aa), rr * math.sin(aa)))
    for i in range(16):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.0, 0.22) ** 0.85
        x, y = r * math.cos(a), r * math.sin(a)
        h = rnd.uniform(0.1, 0.3)
        top = Vector((x * 1.25, y * 1.25, h))
        p.add(bm_tube([(x, y, 0), tuple(Vector((x, y, h * 0.55)) + (top - Vector((x, y, h))) * 0.3), tuple(top)],
                      0.006, 3, cap=False), "grass_dark")
        s_ = rnd.uniform(0.75, 1.15)
        p.add(common.bm_slab(star, 0.012), rnd.choice(cols),
              M(tuple(top), (rnd.uniform(-15, 15), rnd.uniform(-15, 15), rnd.uniform(0, 72)), s_))
        p.add(bm_uv(0.012 * s_, 5, 3), "petal_yellow", M(tuple(top + Vector((0, 0, 0.012)))), smooth=True)
    return [p.to_object(model, sharp_angle=80)], tint_all(0.0, 0.3, 0.75, 1.0)


def grass_tuft(model):
    """Tall soft blades: dark roots, sunlit yellow-green tips, normals pointing up for soft light."""
    rnd = random.Random(71)
    bm = bmesh.new()
    n = 46
    for i in range(n):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.0, 0.2) ** 0.8
        base = Vector((r * math.cos(a), r * math.sin(a), 0))
        h = rnd.uniform(0.32, 0.8) * (1.0 - 0.6 * r)
        out = Vector((math.cos(a), math.sin(a), 0)) * rnd.uniform(0.08, 0.28)
        yaw = a + math.pi / 2 + rnd.uniform(-0.6, 0.6)
        side = Vector((math.cos(yaw), math.sin(yaw), 0))
        w = rnd.uniform(0.018, 0.03)
        segs = 3
        verts = []
        for k in range(segs + 1):
            t = k / segs
            c = base + out * (t ** 1.8) + Vector((0, 0, h * t))
            ww = w * (1 - t) ** 0.8 if k < segs else 0.0
            if k < segs:
                verts.append((bm.verts.new(c - side * ww), bm.verts.new(c + side * ww)))
            else:
                verts.append((bm.verts.new(c),))
        for k in range(segs - 1):
            l0, r0 = verts[k]
            l1, r1 = verts[k + 1]
            bm.faces.new((l0, r0, r1, l1))
        l0, r0 = verts[segs - 1]
        bm.faces.new((l0, r0, verts[segs][0]))
    p = Part("grass_tuft")
    p.add(bm, "grass_light", smooth=True)
    ob = p.to_object(model, sharp_angle=180)
    me = ob.data
    try:
        me.normals_split_custom_set_from_vertices([(0.0, 0.0, 1.0)] * len(me.vertices))
    except Exception:
        pass

    def tint(objs):
        o = objs[0]
        ca = o.data.color_attributes["Col"]
        for li, d in enumerate(ca.data):
            z = o.data.vertices[o.data.loops[li].vertex_index].co.z
            t = min(z / 0.7, 1.0)
            d.color = (0.5 + 0.45 * t, 0.6 + 0.4 * t, 0.42 + 0.4 * t, 1.0)
    return [ob], tint


# ------------------------------------------------------------------ props

def fence(model):
    rnd = random.Random(81)
    p = Part("fence")
    for x in (-0.95, 0.95):
        tilt = rnd.uniform(-3, 3)
        p.add(bm_box(0.15, 0.15, 1.1, bevel=0.02), "wood", M((x, 0, 0.55), (tilt, rnd.uniform(-2, 2), rnd.uniform(-8, 8))))
        p.add(bm_cyl(0.105, 0.0, 0.12, 4), "wood", M((x, 0, 1.1), (tilt, 0, 45)))
    for z, sag in ((0.42, 0.0), (0.82, 0.02)):
        for k, (y_off, col) in enumerate(((0.0, "wood_light"),)):
            p.add(bm_cyl(0.065, 0.06, 2.2, 6), "wood_light", M((-1.1, -0.11, z), (rnd.uniform(-1.5, 1.5), 90, 0), (1, 0.75, 1)))
            p.add(bm_cyl(0.045, 0.045, 0.01, 6), "wood", M((1.1, -0.11, z), (0, 90, 0), (1, 0.75, 1)))
    blob(p, 0.12, (-0.95, -0.05, 0.03), "grass_dark", (1.4, 1.2, 0.5), seed=3, subdiv=1)
    blob(p, 0.1, (0.95, 0.06, 0.03), "grass_dark", (1.4, 1.2, 0.5), seed=4, subdiv=1)
    return [p.to_object(model, sharp_angle=40)], None


def log_pile(model):
    rnd = random.Random(91)
    p = Part("log_pile")
    r = 0.17
    rows = [(-2 * r - 0.01, r, 0), (0, r, 0), (2 * r + 0.01, r, 0),
            (-r, r * 2.72, 0), (r, r * 2.72, 0), (0, r * 4.44, 0)]
    for i, (x, z, _) in enumerate(rows):
        L = 1.4 + rnd.uniform(-0.12, 0.12)
        off = rnd.uniform(-0.06, 0.06)
        rr = r * rnd.uniform(0.92, 1.05)
        m = M((off - L / 2, x, z), (rnd.uniform(-4, 4), 90, 0))
        p.add(bm_cyl(rr, rr, L, 8), "wood_mid", m, smooth=False)
        for end in (0.0, L):
            p.add(bm_cyl(rr * 0.86, rr * 0.86, 0.012, 8), "wood_light", m @ M((0, 0, end - 0.006)))
            p.add(bm_cyl(rr * 0.4, rr * 0.4, 0.016, 8), "wood", m @ M((0, 0, end - 0.008)))
    for x in (-3.2 * r, 3.2 * r):
        p.add(bm_box(0.12, 0.1, 0.18, bevel=0.02), "wood_dark", M((0.45, x, 0.09)))
        p.add(bm_box(0.12, 0.1, 0.18, bevel=0.02), "wood_dark", M((-0.45, x, 0.09)))
    return [p.to_object(model, sharp_angle=50)], None


def stone_pile(model):
    rnd = random.Random(101)
    p = Part("stone_pile")
    spots = [(-0.3, 0.0, 0.1, 0.24), (0.05, -0.1, 0.1, 0.26), (0.36, 0.05, 0.1, 0.22), (-0.1, 0.25, 0.09, 0.2),
             (0.2, 0.28, 0.08, 0.18), (-0.12, -0.02, 0.3, 0.22), (0.22, 0.05, 0.28, 0.2), (0.04, 0.12, 0.46, 0.18)]
    for i, (x, y, z, r) in enumerate(spots):
        rock(p, r, (x, y, z), (1.35, 1.1, 0.75), 110 + i, subdiv=1,
             mat=rnd.choice(["stone", "stone", "stone_light", "stone_mid"]), jit=0.18, rot=(0, 0, rnd.uniform(0, 180)))
    ob = p.to_object(model, sharp_angle=35)
    return [ob], None


def rune_stone(model):
    p = Part("rune_stone")
    bm = bm_box(0.62, 0.36, 1.12, bevel=0.09, segs=2)
    for v in bm.verts:   # taper toward the top, lean slightly
        t = (v.co.z + 0.56) / 1.12
        v.co.x *= 1.0 - 0.22 * t
        v.co.y *= 1.0 - 0.15 * t
        v.co.x += 0.04 * t
    jitter(bm, 0.018, 7)
    p.add(bm, "stone_mid", M((0, 0, 0.53)), smooth=False)
    # carved runes on the front (-Y): little glowing strokes
    fy = -0.185
    glyphs = [
        [((0.0, 0.88), (0.0, 0.70)), ((-0.07, 0.84), (0.07, 0.76))],
        [((-0.07, 0.60), (0.07, 0.60)), ((0.0, 0.62), (-0.06, 0.48)), ((0.0, 0.62), (0.06, 0.48))],
        [((-0.05, 0.40), (0.05, 0.28)), ((0.05, 0.40), (-0.05, 0.28)), ((0.0, 0.42), (0.0, 0.26))],
    ]
    for g in glyphs:
        for (x0, z0), (x1, z1) in g:
            L = math.hypot(x1 - x0, z1 - z0)
            ang = math.degrees(math.atan2(z1 - z0, x1 - x0))
            p.add(bm_box(L + 0.025, 0.03, 0.025), "glow", M(((x0 + x1) / 2 + 0.02, fy, (z0 + z1) / 2), (0, -ang, 0)))
    for i, (x, y) in enumerate(((-0.32, -0.15), (0.3, -0.12), (0.05, 0.22), (-0.2, 0.2))):
        blob(p, 0.14, (x, y, 0.02), "grass_dark", (1.5, 1.1, 0.5), seed=120 + i, subdiv=1)
    rock(p, 0.06, (0.18, -0.32, 0.03), (1.2, 1, 0.8), 130, subdiv=1, mat="stone_light")
    rock(p, 0.045, (0.27, -0.27, 0.02), (1.2, 1, 0.8), 131, subdiv=1, mat="stone")
    ob = p.to_object(model, sharp_angle=40)
    moss(ob, "grass_dark", 0.8)
    return [ob], None


def signpost(model):
    p = Part("signpost")
    p.add(bm_box(0.13, 0.13, 1.75, bevel=0.02), "wood", M((0, 0, 0.875), (0, 1.5, 0)))
    p.add(bm_cyl(0.095, 0.0, 0.1, 4), "wood", M((0.02, 0, 1.75), (0, 1.5, 45)))
    for z, ang, ln in ((1.45, 12, 0.85), (1.12, 168, 0.75)):
        pts = [(0.0, -0.11), (ln - 0.14, -0.11), (ln, 0.0), (ln - 0.14, 0.11), (0.0, 0.11)]
        m = M((0, 0, z), (0, 0, ang)) @ M((0.05, 0, 0))
        p.add(bm_prism(pts, 0.045), "wood_light", m)
        for k in (-0.035, 0.035):
            p.add(bm_box(ln * 0.55, 0.05, 0.016), "wood_dark", m @ M((0.1 + ln * 0.27, 0, k)))
    for i, (x, y) in enumerate(((-0.12, -0.1), (0.13, -0.06), (0.02, 0.14))):
        rock(p, 0.09, (x, y, 0.04), (1.3, 1, 0.7), 140 + i, subdiv=1)
    blob(p, 0.12, (-0.12, 0.1, 0.02), "grass_dark", (1.5, 1.2, 0.5), seed=150, subdiv=1)
    return [p.to_object(model, sharp_angle=40)], None


def lantern_post(model):
    p = Part("lantern_post")
    p.add(bm_box(0.42, 0.42, 0.3, bevel=0.05), "stone", M((0, 0, 0.15)))
    p.add(bm_box(0.17, 0.17, 2.2, bevel=0.025), "wood_dark", M((0, 0, 1.4)))
    p.add(bm_cyl(0.13, 0.0, 0.1, 4), "wood_dark", M((0, 0, 2.5), (0, 0, 45)))
    p.add(bm_box(0.75, 0.1, 0.1, bevel=0.015), "wood_dark", M((0.32, 0, 2.3)))
    p.add(bm_tube([(0.05, 0, 2.05), (0.2, 0, 2.2), (0.32, 0, 2.25)], 0.02, 5), "iron")
    p.box((0.03, 0.03, 0.12), (0.6, 0, 2.2), "iron")
    add_lantern(p, (0.6, 0, 1.6), 1.25, hang=True)
    return [p.to_object(model, sharp_angle=40)], None


MODELS = {
    "tree_oak": (tree_oak, dict(azim=-30, elev=10, lens=45, margin=1.05)),
    "tree_pine": (tree_pine, dict(azim=-30, elev=10, lens=45, margin=1.05)),
    "tree_stump": (tree_stump, dict(azim=-30, elev=20, lens=50, margin=1.25)),
    "rock_large": (rock_large, dict(azim=-30, elev=14, lens=50, margin=1.2)),
    "rock_small": (rock_small, dict(azim=-30, elev=20, lens=50, margin=1.3)),
    "bush": (bush, dict(azim=-30, elev=16, lens=50, margin=1.2)),
    "flowers": (flowers, dict(azim=-30, elev=20, lens=50, margin=1.3)),
    "grass_tuft": (grass_tuft, dict(azim=-30, elev=14, lens=50, margin=1.25)),
    "fence": (fence, dict(azim=-25, elev=14, lens=50, margin=1.15)),
    "log_pile": (log_pile, dict(azim=-30, elev=18, lens=50, margin=1.2)),
    "stone_pile": (stone_pile, dict(azim=-30, elev=18, lens=50, margin=1.25)),
    "rune_stone": (rune_stone, dict(azim=-20, elev=12, lens=50, margin=1.2)),
    "signpost": (signpost, dict(azim=-30, elev=12, lens=50, margin=1.15)),
    "lantern_post": (lantern_post, dict(azim=-30, elev=12, lens=50, margin=1.1)),
}


def main(only=None):
    out = {}
    for name, (fn, rig) in MODELS.items():
        if only and name not in only:
            continue
        model = common.reset()
        objs, tint = fn(model)
        bpy.context.view_layer.update()
        out[name] = common.finish(name, objs, tint=tint, **rig)["tris"]
    return out


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main(globals().get("ONLY"))
