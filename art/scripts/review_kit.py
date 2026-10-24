"""Wren's daily practice (src/life/review): the slate by her field, the harvest basket a solved
question fills, and the harvested crops that drop into it. One file the game clones nodes from:
public/models/review_kit.glb. Preview: art/previews/review_kit.png.

Same look as the valley (ART.md, art/README.md): muted natural colours, soft chunky shapes,
smooth shading, ambient occlusion baked into vertex colours (COLOR_0).

Nodes (each a top-level object, origin at its bottom centre, front -Y in Blender = +Z in three.js;
the file holds them all at the origin, the game places every clone itself):
  review_slate    an A-frame easel (~1.15 m) with a framed slate board on a chalk ledge, a chalk
                  stick and a rag. Child mesh `slate_face`: one quad just in front of the slate's
                  writing area, UVs 0..1 (u left->right, v bottom->top seen from the front),
                  material `review_chalk`. It is the only mesh with UVs (TEXCOORD_0); the game puts a
                  canvas texture with the chalk writing on it (three.js: texture.flipY = false, as
                  GLTFLoader does for its own textures). Its COLOR_0 is plain white so the AO never
                  darkens the writing.
  review_basket   a round wicker harvest basket, ~0.50 m across, ~0.25 m deep, handle top ~0.50 m,
                  the handle arching left-right (along X) so the open top faces the camera.
  crop_wheat, crop_carrot, crop_potato, crop_garlic, crop_cabbage, crop_pumpkin,
  crop_strawberry, crop_chamomile, crop_mint
                  harvested crops (ids from src/life/farming/items.ts), 0.08-0.28 m, each resting
                  in a natural pose so it can be dropped into the basket.

Reuses the leaf/stem/daisy helpers and the crop colours of farming.py (imported, not copied).
Run: powershell -File art/blender.ps1 art/scripts/review_kit.py
Set REVIEW_KIT_QA=<folder> to also render close-ups there (for checking; not part of the kit).
"""
import sys, os, math, random, importlib, json, struct

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import farming as fm          # reloads common + villagers_common, then adds the farm colours
importlib.reload(fm)
import common, villagers_common as vc   # no reload after farming: that would drop the farm palette
import bpy, bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_ico, jitter
from villagers_common import lathe, sphere, S, frame, bezier
from farming import leaf, leaf_bm, stem, blob, daisy, frond, tri_leaf, tendril, BLADE, OVAL, SPEAR
from mathutils import Vector, Matrix

TAU = 2 * math.pi
NAME = "review_kit"

common.PALETTE.update({
    # the easel: sun-weathered wood
    "easel_wood": "#8C7259", "easel_grey": "#9A8E7E", "easel_wood_light": "#AE9476",
    "easel_wood_dark": "#5E4B3B", "easel_hole": "#3A2F27",
    # the slate, chalk and rag
    "slate_board": "#41484B", "review_chalk": "#3B4245", "chalk": "#EFEBE1", "chalk_dust": "#CFCBC2",
    "rag": "#B8AA90", "rag_stripe": "#7C8C96",
    # wicker
    "wicker": "#C2A46C", "wicker_light": "#D6BE8C", "wicker_dark": "#A1865A", "wicker_deep": "#7E6A4B",
    "wicker_band": "#9C7650",
    # harvest extras
    "potato_eye": "#8A6A45", "garlic_root": "#D8CBB0", "pumpkin_cut": "#BBA77C",
})
KEEP_BRIGHT = ("glow", "glass", "review_chalk")


# ------------------------------------------------------------------ small helpers

def beam(p, a, b, w, d, mat, side=(1, 0, 0), bevel=0.006, seed=None):
    """A bevelled plank from a to b: w across (along `side`), d deep. Returns its matrix
    (local Z along the plank, local X toward side, local Y = Z x X)."""
    a, b = Vector(a), Vector(b)
    z = b - a
    L = z.length
    z.normalize()
    x = Vector(side)
    x = (x - z * x.dot(z)).normalized()
    y = z.cross(x)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = (a + b) / 2
    bm = bm_box(w, d, L, bevel=bevel, segs=2)
    if seed is not None:
        jitter(bm, 0.0012, seed)
    p.add(bm, mat, m, smooth=True)
    return m


def loop_tube(pts, r, segs=6, up=(0, 0, 1)):
    """A closed tube through a loop of points (no seam). `up` must never be parallel to the loop."""
    bm = bmesh.new()
    n = len(pts)
    upv = Vector(up)
    rings = []
    for i, q in enumerate(pts):
        t = (pts[(i + 1) % n] - pts[i - 1]).normalized()
        side = t.cross(upv).normalized()
        u2 = side.cross(t).normalized()
        rr = r[i] if isinstance(r, (list, tuple)) else r
        rings.append([bm.verts.new(q + (side * math.cos(TAU * k / segs) + u2 * math.sin(TAU * k / segs)) * rr) for k in range(segs)])
    for i in range(n):
        a, b = rings[i], rings[(i + 1) % n]
        for k in range(segs):
            k2 = (k + 1) % segs
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def add_faces(part, bm2, matfn, matrix=None, smooth=True):
    """Like Part.add, but matfn(centre) picks each face's material (centre in part space).
    (A local copy of fishing_kit.add_banded: importing that kit would reload common.)"""
    matrix = matrix or Matrix()
    flip = matrix.to_3x3().determinant() < 0
    vmap = {v: part.bm.verts.new(matrix @ v.co) for v in bm2.verts}
    for f in bm2.faces:
        name = matfn(matrix @ f.calc_center_median())
        if name not in part.mats:
            part.mats.append(name)
        vs = [vmap[v] for v in f.verts]
        if flip:
            vs.reverse()
        nf = part.bm.faces.new(vs)
        nf.material_index = part.mats.index(name)
        nf.smooth = smooth
    bm2.free()
    return part


def prof_r(profile, z):
    """Radius of a (r, z) profile at height z (linear)."""
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        if z0 <= z <= z1:
            return r0 + (r1 - r0) * (z - z0) / max(z1 - z0, 1e-9)
    return profile[-1][0] if z > profile[-1][1] else profile[0][0]


def tie(p, x, cy, cz, r, wraps=3, seed=0):
    """Twine wound round a bundle lying along X: a few loops, a knot on top and two short tails."""
    rnd = random.Random(seed)
    for k in range(wraps):
        xx = x + (k - (wraps - 1) / 2) * 0.0055
        pts = [Vector((xx + 0.0008 * math.sin(3 * a), cy + r * math.cos(a), cz + r * math.sin(a))) for a in [TAU * j / 20 for j in range(20)]]
        p.add(loop_tube(pts, 0.0026, 5, up=(1, 0, 0)), "twine", smooth=True)
    kc = Vector((x, cy - 0.004, cz + r + 0.002))
    blob(p, 0.0055, kc, "twine", (1.3, 1.0, 0.8), u=10, v=6)
    for sgn in (-1, 1):
        a = kc + Vector((sgn * 0.003, -0.002, 0.0))
        b = kc + Vector((sgn * 0.016, -0.012 + rnd.uniform(-0.004, 0.004), -0.01))
        c = kc + Vector((sgn * 0.022 + rnd.uniform(-0.004, 0.004), -0.02, -0.022))
        stem(p, "twine", bezier(a, b, c, 6), 0.0022, 0.0018, 5)


def grounded(part):
    """Origin at the bottom centre of the part's bounds."""
    vs = [v.co for v in part.bm.verts]
    xs, ys, zs = [v.x for v in vs], [v.y for v in vs], [v.z for v in vs]
    return ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs))


# ------------------------------------------------------------------ the slate easel

LEAN = math.atan2(0.22, 1.15)         # the front legs lean back ~10.8 degrees
LEG_W, LEG_D = 0.048, 0.034
Z_SHELF = 0.52                         # top of the chalk ledge
FACE_W, FACE_H = 0.576, 0.432          # slate_face, 4:3 (a 1024 x 768 canvas fits exactly)
FACE_Z, FACE_Y = 0.26, -0.0235         # its centre in board space


def leg_y(z):
    return -0.10 + z * math.tan(LEAN)


def leg_x(z):
    return 0.34 - (0.34 - 0.07) * z / 1.13


Y_BACK = leg_y(Z_SHELF) - 0.019        # the board's back rests on the legs' front faces
BOARD = Matrix.Translation((0, Y_BACK, Z_SHELF - 0.003)) @ Matrix.Rotation(-LEAN, 4, "X")   # board space: x right, z up the board, -y out the front


def rag(p, x0, x1, rnd):
    """A cloth rag lying on the ledge and hanging over its front lip."""
    path = [(-0.055, 0.5222), (-0.069, 0.5235), (-0.083, 0.5285), (-0.094, 0.5405), (-0.1015, 0.5425),
            (-0.1065, 0.533), (-0.1085, 0.512), (-0.1085, 0.49), (-0.107, 0.468)]
    nx = 10
    bm = bmesh.new()
    grid = []
    hang = [rnd.uniform(-0.012, 0.006) for _ in range(nx + 1)]
    for i in range(nx + 1):
        u = i / nx
        x = x0 + (x1 - x0) * u
        row = []
        for j, (y, z) in enumerate(path):
            t = j / (len(path) - 1)
            wob = 0.0028 * math.sin(u * 9.0 + j * 1.3) + 0.0015 * math.sin(u * 23 + j * 2.1)
            if j < 4:
                z2 = z + abs(wob) * 0.8
                y2 = y + 0.004 * math.sin(u * 5 + 1)
            else:
                z2 = z + (hang[i] * (t - 0.5) * 2 if j == len(path) - 1 else 0.0)
                y2 = y - abs(wob)
            row.append(bm.verts.new((x + 0.004 * math.sin(t * 6 + u * 3), y2, z2)))
        grid.append(row)
    for i in range(nx):
        for j in range(len(path) - 1):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.0035)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

    def stripe(c):
        u = (c.x - x0) / (x1 - x0)
        return "rag_stripe" if 0.12 < u < 0.2 or 0.8 < u < 0.88 else "rag"
    add_faces(p, bm, stripe)


def easel():
    rnd = random.Random(7)
    p = Part("review_slate")
    woods = ["easel_wood", "easel_grey", "easel_wood_light", "easel_wood"]
    # two front legs meeting under a cap
    for i, sx in enumerate((-1, 1)):
        a = Vector((sx * 0.34, leg_y(0.005), 0.005))
        b = Vector((sx * 0.07, leg_y(1.13), 1.13))
        m = beam(p, a, b, LEG_W, LEG_D, woods[i], side=(1, 0, 0), seed=10 + i)
        L = (b - a).length
        # a little grain and the peg holes for moving the ledge
        for k, (xo, z0, z1) in enumerate(((-0.011, -0.42, 0.1), (0.009, -0.2, 0.36))):
            p.add(bm_box(0.0025, 0.002, L * (z1 - z0) / 1.0 * 0.95), "easel_wood_dark",
                  m @ M((xo, -LEG_D / 2 - 0.0006, L * (z0 + z1) / 2 * 0.95)), smooth=False)
        ydir = m.col[1].xyz.normalized()
        for z in (0.33, 0.39, 0.45):
            t = (z - a.z) / (b.z - a.z)
            q = a + (b - a) * t - ydir * (LEG_D / 2 + 0.0004)
            p.add(bm_cyl(0.0065, 0.0065, 0.0018, 10), "easel_hole", frame(q, -ydir), smooth=True)
    cap = M((0, leg_y(1.12) + 0.002, 1.12), (-math.degrees(LEAN), 0, 0))
    p.add(jitter(bm_box(0.205, 0.05, 0.06, bevel=0.012, segs=3), 0.001, 3), "easel_wood", cap, smooth=True)
    # the back leg, hinged on an iron pin behind the cap
    top = Vector((0, leg_y(1.09) + LEG_D / 2 + 0.018, 1.09))
    foot = Vector((0, 0.44, 0.005))
    beam(p, top, foot, 0.044, 0.032, "easel_grey", side=(1, 0, 0), seed=14)
    p.add(bm_cyl(0.008, 0.008, 0.09, 10), "iron", M(top + Vector((-0.045, 0.0, 0.0)), (0, 90, 0)), smooth=True)
    for sx in (-1, 1):
        p.add(bm_box(0.004, 0.05, 0.022, bevel=0.0015), "iron", M(top + Vector((sx * 0.025, -0.022, 0.012)), (-math.degrees(LEAN), 0, 0)))
    # a low brace behind the front legs, and a cord to the back leg so it can't slide away
    zb = 0.25
    yb = leg_y(zb) + LEG_D / 2 + 0.013
    beam(p, (-leg_x(zb) - 0.03, yb, zb), (leg_x(zb) + 0.03, yb, zb), 0.024, 0.04, "easel_wood", side=(0, 1, 0), seed=15)
    t = (0.4 - foot.z) / (top.z - foot.z)
    on_back = foot + (top - foot) * t
    c0 = Vector((0, yb + 0.013, zb + 0.012))
    stem(p, "rope", bezier(c0, (c0 + on_back) / 2 + Vector((0, 0, -0.05)), on_back + Vector((0, -0.017, 0)), 14), 0.0055, 0.0055, 6)
    for q in (c0, on_back + Vector((0, -0.017, 0))):
        blob(p, 0.011, q, "rope", (1.2, 1.0, 1.1), u=10, v=6)
    # the chalk ledge: a shelf on two pegs with a front lip
    p.add(jitter(bm_box(0.76, 0.085, 0.022, bevel=0.005, segs=2), 0.001, 20), "easel_wood_light", M((0, -0.06, Z_SHELF - 0.011)), smooth=True)
    p.add(jitter(bm_box(0.76, 0.012, 0.03, bevel=0.004, segs=2), 0.0008, 21), "easel_wood", M((0, -0.0965, Z_SHELF + 0.004)), smooth=True)
    for sx in (-1, 1):
        zp = Z_SHELF - 0.034
        p.add(bm_cyl(0.0095, 0.0095, 0.13, 10, bevel=0.002), "easel_wood_dark", M((sx * leg_x(zp), -0.085, zp), (-90, 0, 0)), smooth=True)
    # the board: wooden backing, slate panel, a frame round it, nails and a clamp on top
    B = BOARD
    p.add(bm_box(0.655, 0.01, 0.51, bevel=0.003), "easel_wood_dark", B @ M((0, -0.005, 0.26)), smooth=True)
    p.add(bm_box(0.62, 0.012, 0.47, bevel=0.002), "slate_board", B @ M((0, -0.016, FACE_Z)), smooth=True)
    for sx in (-1, 1):
        p.add(jitter(bm_box(0.035, 0.032, 0.52, bevel=0.006, segs=2), 0.001, 30 + sx), "easel_wood", B @ M((sx * 0.3175, -0.016, 0.26)), smooth=True)
    for k, z in enumerate((0.0175, 0.5025)):
        p.add(jitter(bm_box(0.67, 0.032, 0.035, bevel=0.006, segs=2), 0.001, 33 + k), "easel_wood_light" if k == 0 else "easel_grey",
              B @ M((0, -0.016, z)), smooth=True)
    for sx in (-1, 1):
        for z in (0.0175, 0.5025):
            p.add(bm_cyl(0.0055, 0.0045, 0.002, 8), "iron", B @ M((sx * 0.3175, -0.032, z), (90, 0, 0)), smooth=True)
    p.add(jitter(bm_box(0.13, 0.05, 0.028, bevel=0.007, segs=2), 0.001, 40), "easel_wood", B @ M((0, -0.012, 0.534)), smooth=True)
    p.add(jitter(bm_box(0.11, 0.012, 0.05, bevel=0.004, segs=2), 0.001, 41), "easel_wood", B @ M((0, -0.04, 0.52)), smooth=True)
    # Wren's tally of finished days, chalked on the frame
    for k in range(6):
        if k == 5:
            p.add(bm_box(0.05, 0.0012, 0.0035), "chalk", B @ M((0.214, -0.0326, 0.0175), (0, -28, 0)))
            continue
        p.add(bm_box(0.0035, 0.0012, 0.022), "chalk", B @ M((0.196 + 0.009 * k, -0.0326, 0.0175), (0, rnd.uniform(-6, 6), 0)))
    # chalk, a broken stub, a little dust, and the rag
    zc = Z_SHELF + 0.0066
    p.add(bm_cyl(0.0066, 0.0066, 0.078, 12, bevel=0.0015), "chalk", M((-0.2, -0.066, zc), (0, 90, 8)), smooth=True)
    p.add(jitter(bm_cyl(0.0062, 0.0062, 0.026, 12, bevel=0.0012), 0.0006, 50), "chalk", M((-0.075, -0.074, zc - 0.0004), (0, 90, -24)), smooth=True)
    for k in range(9):
        p.add(bm_cyl(rnd.uniform(0.003, 0.007), rnd.uniform(0.002, 0.005), 0.0009, 8), "chalk_dust",
              M((rnd.uniform(-0.24, -0.04), rnd.uniform(-0.09, -0.05), Z_SHELF), (0, 0, rnd.uniform(0, 90)), (1.6, 1, 1)), smooth=True)
    rag(p, 0.13, 0.235, rnd)
    return p


def slate_face(parent, coll):
    """The quad the game draws the question on: UVs 0..1, u left->right, v bottom->top from the front."""
    corners = [(-FACE_W / 2, FACE_Y, FACE_Z - FACE_H / 2), (FACE_W / 2, FACE_Y, FACE_Z - FACE_H / 2),
               (FACE_W / 2, FACE_Y, FACE_Z + FACE_H / 2), (-FACE_W / 2, FACE_Y, FACE_Z + FACE_H / 2)]
    uvs = [(0, 0), (1, 0), (1, 1), (0, 1)]
    centre = BOARD @ Vector((0, FACE_Y, FACE_Z))
    verts = [BOARD @ Vector(c) - centre for c in corners]
    me = bpy.data.meshes.new("slate_face")
    me.from_pydata([tuple(v) for v in verts], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name="UVMap")
    for li, loop in enumerate(me.loops):
        uv.data[li].uv = uvs[loop.vertex_index]
    me.materials.append(common.mat("review_chalk"))
    me.update()
    ob = bpy.data.objects.new("slate_face", me)
    coll.objects.link(ob)
    ob.parent = parent
    ob.location = centre - parent.location
    return ob


# ------------------------------------------------------------------ the basket

H_RIM = 0.245


def wall_r(z):
    t = z / H_RIM
    return 0.18 + 0.055 * t + 0.01 * math.sin(math.pi * t)


FLOOR_TOP = 0.0267
STAKES = 28


def basket():
    rnd = random.Random(11)
    p = Part("review_basket")
    # solid woven base, a foot ring, and a flat spiral of cane on top of it
    p.add(bm_cyl(0.182, 0.182, 0.018, 48), "wicker_deep", M((0, 0, 0.0)), smooth=True)
    p.add(loop_tube([Vector((0.177 * math.cos(a), 0.177 * math.sin(a), 0.011)) for a in [TAU * k / 96 for k in range(96)]], 0.011, 8),
          "wicker_dark", smooth=True)
    sp = []
    th = 0.0
    while True:
        r = 0.008 + 0.0135 * th / TAU
        if r > 0.176:
            break
        sp.append(Vector((r * math.cos(th), r * math.sin(th), 0.0205 + 0.0006 * math.sin(th * 7))))
        th += TAU / max(14, int(TAU * r / 0.006))
    p.add(bm_tube(sp, 0.0062, 6), "wicker", smooth=True)
    for k in range(8):   # the base spokes showing through the spiral
        a = TAU * k / 8 + 0.2
        p.add(bm_tube([Vector((0.02 * math.cos(a), 0.02 * math.sin(a), 0.022)), Vector((0.17 * math.cos(a), 0.17 * math.sin(a), 0.022))], 0.0045, 5),
              "wicker_dark", smooth=True)
    # a dark liner behind the weave (reads as the shadow in its gaps)
    zs = [0.016 + (0.24 - 0.016) * k / 10 for k in range(11)]
    p.add(lathe([(wall_r(z) - 0.008, z) for z in zs], 56), "wicker_deep", smooth=True)
    # upright stakes
    for k in range(STAKES):
        a = TAU * k / STAKES
        pts = [Vector((wall_r(z) * math.cos(a), wall_r(z) * math.sin(a), z)) for z in [0.012 + 0.236 * j / 7 for j in range(8)]]
        p.add(bm_tube(pts, 0.0048, 5), "wicker_dark", smooth=True)
    # weavers going in front of one stake and behind the next, rows alternating
    rows = 13
    mats = ["wicker", "wicker_light", "wicker", "wicker_dark", "wicker_light", "wicker", "wicker_band", "wicker_band",
            "wicker", "wicker_light", "wicker_dark", "wicker", "wicker_light"]
    for j in range(rows):
        z = 0.028 + j * 0.0165
        n = STAKES * 4
        pts = []
        for i in range(n):
            a = TAU * i / n
            rr = wall_r(z) + 0.0065 * math.cos(a * STAKES / 2 + math.pi * (j % 2))
            pts.append(Vector((rr * math.cos(a), rr * math.sin(a), z + 0.0007 * math.sin(a * 3 + j))))
        p.add(loop_tube(pts, 0.0085, 6), mats[j], smooth=True)
    # the rim: three strands braided round the top
    rim_r = wall_r(H_RIM)
    for s in range(3):
        n = 330
        pts = []
        for i in range(n):
            a = TAU * i / n
            ph = 33 * a + TAU * s / 3
            rr = rim_r + 0.0072 * math.cos(ph)
            pts.append(Vector((rr * math.cos(a), rr * math.sin(a), H_RIM + 0.0072 * math.sin(ph))))
        p.add(loop_tube(pts, 0.0068, 6), ("wicker_light", "wicker", "wicker_dark")[s], smooth=True)
    # the handle: a thick cane arching over along X, bound with a spiral wrap, lashed to the rim
    hx = rim_r + 0.012
    path = [Vector((wall_r(z) + 0.012, 0, z)) for z in [0.13 + (H_RIM - 0.13) * k / 5 for k in range(5)]]
    for k in range(41):
        s = math.pi * k / 40
        path.append(Vector((hx * math.cos(s), 0, H_RIM + (0.488 - H_RIM) * math.sin(s))))
    path += [Vector((-q.x, 0, q.z)) for q in reversed(path[:5])]
    p.add(bm_tube(path, 0.012, 10), "wicker_dark", smooth=True)
    acc = [0.0]
    for a, b in zip(path, path[1:]):
        acc.append(acc[-1] + (b - a).length)
    wrap = []
    total = acc[-1]
    steps = int(total / 0.0025)
    for i in range(steps + 1):
        d = total * i / steps
        k = max(0, min(len(path) - 2, next((j for j in range(len(acc) - 1) if acc[j + 1] >= d), len(acc) - 2)))
        u = (d - acc[k]) / max(acc[k + 1] - acc[k], 1e-9)
        q = path[k].lerp(path[k + 1], u)
        t = (path[k + 1] - path[k]).normalized()
        nrm = Vector((0, 1, 0)).cross(t).normalized()
        w = TAU * d / 0.028
        wrap.append(q + (nrm * math.cos(w) + Vector((0, 1, 0)) * math.sin(w)) * 0.0128)
    p.add(bm_tube(wrap, 0.0042, 5), "wicker_light", smooth=True)
    for sx in (-1, 1):
        for yo in (-0.021, -0.007, 0.007, 0.021):
            c = Vector((sx * (rim_r + 0.004), yo, H_RIM - 0.004))
            pts = [c + Vector((0.026 * math.cos(a), 0, 0.02 * math.sin(a))) for a in [TAU * k / 16 for k in range(16)]]
            p.add(loop_tube(pts, 0.0034, 5, up=(0, 1, 0)), "wicker_light", smooth=True)
    return p


# ------------------------------------------------------------------ harvested crops

def crop_wheat():
    rnd = random.Random(21)
    p = Part("crop_wheat")
    zc = 0.03
    n = 18
    x_cut, x_tie, x_end = -0.11, -0.03, 0.062
    for i in range(n):
        rr = 0.017 * math.sqrt((i + 0.5) / n)
        a = i * 2.39996
        dy, dz = rr * math.cos(a), rr * math.sin(a)
        fan = rnd.uniform(1.6, 2.6)
        pts = []
        for k in range(7):
            x = x_cut + (x_end - x_cut) * k / 6
            f = 1.0 + (fan - 1) * max(0.0, (x - x_tie) / (x_end - x_tie)) ** 1.5 + 0.5 * max(0.0, (x_tie - x) / (x_tie - x_cut)) ** 2
            pts.append(Vector((x, dy * f, zc + dz * f)))
        stem(p, "wheat_stalk", pts, 0.0032, 0.0028, 5)
        d = (pts[-1] - pts[-2]).normalized()
        d = (d + Vector((0, dy * 6, dz * 6))).normalized()
        e0 = pts[-1]
        fr = frame(e0, d)
        ear_len = rnd.uniform(0.056, 0.066)
        p.add(lathe([(0.003, 0.0), (0.0075, 0.008), (0.0095, ear_len * 0.45), (0.0078, ear_len * 0.82), (0.0015, ear_len)], 8,
                    rfun=lambda a, z: 0.0022 * abs(math.sin(z * 150 + a * 2)), cap_top=True, cap_bottom=True),
              "wheat_ear" if i % 3 else "wheat_ear_dark", fr, smooth=True)
        for j in range(4):
            z = ear_len * (0.35 + 0.17 * j)
            for sgn in (1, -1):
                a0 = fr @ Vector((sgn * 0.008, 0, z))
                a1 = fr @ Vector((sgn * 0.016, 0, z + 0.032))
                stem(p, "wheat_ear_dark", [a0, a1], 0.0012, 0.0006, 3)
    # two dry leaves trailing from the bundle
    leaf(p, "wheat_stalk", Vector((-0.06, 0.012, zc + 0.012)), 30, 8, 0.09, 0.012, droop=0.4, fold=0.2, n=5, prof=BLADE)
    leaf(p, "wheat_ear_dark", Vector((-0.05, -0.014, zc + 0.008)), -40, 4, 0.08, 0.011, droop=0.5, fold=0.2, n=5, prof=BLADE)
    tie(p, x_tie, 0.0, zc, 0.0205, 3, seed=2)
    return p


def crop_carrot():
    rnd = random.Random(22)
    p = Part("crop_carrot")
    prof = [(0.0012, 0.0), (0.006, 0.02), (0.0115, 0.05), (0.0175, 0.09), (0.0225, 0.123), (0.0235, 0.139), (0.019, 0.15), (0.009, 0.155), (0.003, 0.156)]
    bm = lathe(prof, 18, rfun=lambda a, z: 0.0008 * math.sin(a * 3 + z * 40), cap_top=True, cap_bottom=True)
    for v in bm.verts:
        t = 1 - v.co.z / 0.156
        v.co.y += 0.014 * t ** 2
    zc = 0.0235
    rootm = M((-0.12, 0, zc), (0, 90, 0))
    p.add(bm, "carrot", rootm, smooth=True)
    # the dark rings round the root
    for k in range(9):
        z = 0.025 + 0.012 * k + rnd.uniform(-0.004, 0.004)
        r = prof_r(prof, z) * 0.99
        a0 = rnd.uniform(0, TAU)
        span = rnd.uniform(0.9, 1.8)
        pts = [rootm @ Vector((r * math.cos(a0 + span * j / 6), r * math.sin(a0 + span * j / 6) + 0.014 * (1 - z / 0.156) ** 2, z)) for j in range(7)]
        stem(p, "carrot_dark", pts, 0.0016, 0.0012, 4)
    # a few root hairs near the tip
    for k in range(3):
        z = 0.03 + 0.02 * k
        q = rootm @ Vector((0, prof_r(prof, z) + 0.014 * (1 - z / 0.156) ** 2, z))
        stem(p, "carrot_dark", [q, q + Vector((rnd.uniform(-0.006, 0.006), 0.012, -0.004))], 0.0008, 0.0005, 3)
    # the leafy top: cut stalks and feathery fronds lying back from the shoulder
    sh = Vector((-0.12 + 0.153, 0, zc + 0.002))
    blob(p, 0.012, sh + Vector((0.004, 0, 0)), "stem", (0.6, 1, 1), u=12, v=8)
    for k, (yaw, pitch, L) in enumerate(((-24, 16, 0.088), (-8, 24, 0.092), (8, 18, 0.095), (22, 12, 0.085), (0, 32, 0.075))):
        frond(p, rnd, sh + Vector((0.005, 0.003 * (k - 2), 0.002 * k)), yaw, pitch, L, pairs=3, leaflet=0.036, droop=0.45)
    return p


def crop_potato():
    rnd = random.Random(23)
    p = Part("crop_potato")
    sc = Vector((0.052, 0.038, 0.031))

    def shape(n):
        k = 1 + 0.06 * math.sin(2.7 * n.x + 1.0) * math.cos(3.1 * n.y) + 0.04 * math.sin(4.0 * n.z + 2.0 * n.x) + 0.03 * math.cos(5 * n.y + n.z)
        return Vector((n.x * k * sc.x, n.y * k * sc.y, n.z * k * sc.z))
    bm = sphere(28, 16)
    for v in bm.verts:
        v.co = shape(v.co.normalized())
    p.add(bm, "potato", Matrix.Translation((0, 0, 0)), smooth=True)
    for k in range(7):   # eyes: little dark dimples
        n = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.2, 1))).normalized()
        q = shape(n)
        nrm = Vector((n.x / sc.x, n.y / sc.y, n.z / sc.z)).normalized()
        p.add(sphere(10, 6), "potato_eye", frame(q - nrm * 0.0008, nrm) @ S(0.0045, 0.0032, 0.0012), smooth=True)
    for k in range(5):   # a little field soil still on it
        n = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-0.6, 0.6))).normalized()
        q = shape(n)
        nrm = Vector((n.x / sc.x, n.y / sc.y, n.z / sc.z)).normalized()
        p.add(jitter(sphere(10, 6), 0.15, k), "farm_soil", frame(q - nrm * 0.0012, nrm) @ S(rnd.uniform(0.006, 0.011), rnd.uniform(0.004, 0.008), 0.0018), smooth=True)
    return p


def crop_garlic():
    rnd = random.Random(24)
    p = Part("crop_garlic")
    prof = [(0.004, 0.0), (0.024, 0.006), (0.038, 0.022), (0.041, 0.038), (0.034, 0.056), (0.018, 0.074), (0.009, 0.086), (0.0075, 0.094)]
    rf = lambda a, z: -0.0042 * abs(math.sin(a * 4)) * math.sin(math.pi * min(1, z / 0.08))
    p.add(lathe(prof, 32, rfun=rf, cap_bottom=True), "garlic", M((0, 0, 0.006)), smooth=True)
    for k in range(8):   # faint purple streaks down the cloves
        if k % 2:
            continue
        a = TAU * k / 8 + 0.05
        pts = []
        for z in [0.016 + 0.012 * j for j in range(6)]:
            r = prof_r(prof, z) + 0.0004
            pts.append(Vector((r * math.cos(a), r * math.sin(a), z + 0.006)))
        stem(p, "garlic_purple", pts, 0.0016, 0.0009, 4)
    # a papery flake curling off the side
    leaf(p, "garlic_dry", Vector((0.03, -0.022, 0.03)), -40, 70, 0.035, 0.022, droop=1.2, fold=0.5, n=4, prof=OVAL)
    # trimmed dry stem with a cut end
    stem(p, "garlic_dry", [Vector((0, 0, 0.096)), Vector((0.002, 0, 0.11)), Vector((0.004, 0.001, 0.124))], 0.0075, 0.0065, 8)
    p.add(bm_cyl(0.0064, 0.0064, 0.0012, 8), "pumpkin_cut", M((0.004, 0.001, 0.124), (0, 9, 0)), smooth=True)
    # basal plate and the trimmed roots
    p.add(bm_cyl(0.012, 0.009, 0.006, 12), "garlic_dry", M((0, 0, 0.0015)), smooth=True)
    for k in range(16):
        a = TAU * k / 16 + rnd.uniform(-0.15, 0.15)
        L = rnd.uniform(0.012, 0.022)
        b = Vector((0.007 * math.cos(a), 0.007 * math.sin(a), 0.004))
        e = Vector(((0.007 + L) * math.cos(a + rnd.uniform(-0.3, 0.3)), (0.007 + L) * math.sin(a + rnd.uniform(-0.3, 0.3)), 0.0012))
        stem(p, "garlic_root", bezier(b, (b + e) / 2 + Vector((0, 0, -0.001)), e, 4), 0.0011, 0.0008, 4)
    return p


def crop_cabbage():
    rnd = random.Random(25)
    p = Part("crop_cabbage")
    hr = 0.072
    c = Vector((0, 0, 0))
    blob(p, hr, c + Vector((0, 0, hr * 0.92)), "cabbage_light", (1, 1, 0.94), u=24, v=14)
    p.add(bm_cyl(0.014, 0.012, 0.012, 10), "cabbage_vein", M((0, 0, 0.0)), smooth=True)
    # wrapper leaves cupped round the head
    for k in range(5):
        a = 360 * k / 5 + rnd.uniform(-10, 10)
        leaf(p, rnd.choice(["cabbage", "cabbage_light"]), c + Vector((0, 0, 0.012)), a, 64, hr * 1.85, hr * 1.7, droop=1.75, fold=0.6, n=7, prof=OVAL)
        leaf(p, "cabbage_vein", c + Vector((0, 0, 0.0135)), a, 64, hr * 1.4, 0.008, droop=1.5, fold=0.0, n=5, prof=BLADE)
    # a few loose outer leaves opening out
    for k in range(4):
        a = 360 * k / 4 + 36 + rnd.uniform(-12, 12)
        leaf(p, rnd.choice(["cabbage", "cabbage_dark"]), c + Vector((0, 0, 0.01)), a, 42, 0.105, 0.09, droop=1.15, fold=0.5, n=7, prof=OVAL, lift=-0.1)
        leaf(p, "cabbage_vein", c + Vector((0, 0, 0.0115)), a, 40, 0.08, 0.007, droop=1.0, fold=0.0, n=5, prof=BLADE)
    return p


def crop_pumpkin():
    rnd = random.Random(26)
    p = Part("crop_pumpkin")
    R = 0.13
    prof = [(0.006, 0.0), (R * 0.55, 0.008), (R * 0.95, R * 0.35), (R, R * 0.7), (R * 0.86, R * 1.12), (R * 0.42, R * 1.34), (R * 0.12, R * 1.3), (0.006, R * 1.27)]
    ribs = 10
    rf = lambda a, z: -0.016 * (1 - abs(math.cos(a * ribs / 2))) ** 1.6 * math.sin(math.pi * min(1, z / (R * 1.34)))
    bm = lathe(prof, 70, rfun=rf, cap_top=True, cap_bottom=True)

    def groove(cn):
        a = math.atan2(cn.y, cn.x)
        return "pumpkin_dark" if (1 - abs(math.cos(a * ribs / 2))) > 0.86 else "pumpkin"
    add_faces(p, bm, groove)
    top = Vector((0, 0, R * 1.27))
    p.add(lathe([(0.026, 0.0), (0.021, 0.008), (0.016, 0.018)], 14, rfun=lambda a, z: 0.003 * abs(math.sin(a * 3))), "pumpkin_stem", M(top - Vector((0, 0, 0.004))), smooth=True)
    sp = [top + Vector((0, 0, 0.01)), top + Vector((0.004, 0.0, 0.03)), top + Vector((0.015, 0.004, 0.045)), top + Vector((0.03, 0.008, 0.052))]
    stem(p, "pumpkin_stem", sp, 0.0135, 0.011, 8)
    d = (sp[-1] - sp[-2]).normalized()
    p.add(bm_cyl(0.0108, 0.0108, 0.0015, 10), "pumpkin_cut", frame(sp[-1], d), smooth=True)
    tendril(p, top + Vector((-0.012, 0.01, 0.006)), 0.032)
    return p


def crop_strawberry():
    rnd = random.Random(27)
    p = Part("crop_strawberry")
    s = 0.023
    prof = [(0.0012, -s * 1.7), (s * 0.5, -s * 1.32), (s * 0.88, -s * 0.66), (s, -s * 0.05), (s * 0.78, s * 0.3), (0.003, s * 0.4)]
    tri_leaf(p, "strawberry_leaf", Vector((0.0, 0.006, 0.002)), 90, 4, 0.045, 0.036, droop=0.25)
    hub = Vector((0.0, 0.012, 0.03))
    for i, phi in enumerate((-90, 35, 160)):
        d = Vector((math.cos(math.radians(phi)), math.sin(math.radians(phi)), -0.28)).normalized()
        pos = Vector((0, 0.0, 0)) + Vector((d.x, d.y, 0)) * 0.036
        pos.z = s * 0.92
        fr = frame(pos, -d)
        p.add(lathe(prof, 16, cap_top=True, cap_bottom=True), "berry" if i != 1 else "berry_dark", fr @ M((0, 0, 0), (0, 0, rnd.uniform(0, 90))), smooth=True)
        for j in range(18):   # seeds in staggered rings
            ring = j // 6
            z = -s * (1.2 - 0.38 * ring)
            a = TAU * (j % 6) / 6 + ring * 0.5
            r = prof_r(prof, z) * 0.985
            q = fr @ Vector((r * math.cos(a), r * math.sin(a), z))
            nrm = (fr.to_3x3() @ Vector((math.cos(a), math.sin(a), 0.3))).normalized()
            p.add(sphere(6, 4), "berry_seed", frame(q, nrm) @ S(0.0021, 0.0015, 0.0012), smooth=True)
        for j in range(6):   # the green calyx
            p.add(leaf_bm(s * 0.95, s * 0.5, -22, droop=0.3, fold=0.25, n=3, prof=SPEAR), "strawberry_leaf",
                  fr @ M((0, 0, s * 0.36), (0, 0, 60 * j + rnd.uniform(-8, 8))), smooth=True)
        q0 = fr @ Vector((0, 0, s * 0.4))
        stem(p, "stem", bezier(q0, q0 + (fr.to_3x3() @ Vector((0, 0, 0.014))), hub, 6), 0.0022, 0.0018, 5)
    blob(p, 0.004, hub, "stem", u=8, v=6)
    return p


def crop_chamomile():
    rnd = random.Random(28)
    p = Part("crop_chamomile")
    zc = 0.02
    x_cut, x_tie = -0.11, -0.05
    heads = [(0.085, -0.05, 0.03), (0.1, -0.022, 0.05), (0.108, 0.008, 0.035), (0.098, 0.036, 0.055), (0.08, 0.058, 0.032),
             (0.07, -0.03, 0.065), (0.075, 0.018, 0.075), (0.06, 0.042, 0.07), (0.055, -0.008, 0.05)]
    for i, (hx, hy, hz) in enumerate(heads):
        oy, oz = rnd.uniform(-0.008, 0.008), rnd.uniform(-0.006, 0.006)
        a = Vector((x_cut + rnd.uniform(-0.006, 0.004), oy * 1.4, zc + oz * 1.4))
        b = Vector((x_tie, oy, zc + oz))
        h = Vector((hx, hy, hz))
        pts = [a, b] + bezier(b, b + Vector((0.06, oy, 0.004)), h, 6)[1:]
        stem(p, "chamomile_leaf", pts, 0.0024, 0.002, 5)
        for j in (3, 5):
            q = pts[j]
            dd = pts[j + 1] - pts[j]
            yaw = math.degrees(math.atan2(dd.y, dd.x)) + rnd.choice((-1, 1)) * 55
            leaf(p, "chamomile_leaf", q, yaw, 18, 0.032, 0.009, droop=0.6, fold=0.2, n=4, prof=BLADE)
        up = Vector((0.75, hy * 4, 0.7)).normalized()
        if i in (4, 8):
            blob(p, 0.008, h + up * 0.004, "cabbage_light", (1, 1, 0.8), u=10, v=6)
        else:
            daisy(p, h + up * 0.003, 0.019, 13, up)
    tie(p, x_tie, 0.0, zc, 0.0125, 3, seed=5)
    return p


def crop_mint():
    rnd = random.Random(29)
    p = Part("crop_mint")
    zc = 0.018
    x_cut, x_tie = -0.1, -0.06
    tips = [(0.1, -0.04, 0.03), (0.115, -0.012, 0.045), (0.11, 0.018, 0.04), (0.095, 0.045, 0.03), (0.08, 0.004, 0.06)]
    for i, (tx, ty, tz) in enumerate(tips):
        oy, oz = rnd.uniform(-0.006, 0.006), rnd.uniform(-0.005, 0.005)
        a = Vector((x_cut + rnd.uniform(-0.006, 0.004), oy * 1.4, zc + oz))
        b = Vector((x_tie, oy, zc + oz))
        t = Vector((tx, ty, tz))
        pts = [a, b] + bezier(b, b + Vector((0.07, oy, 0.006)), t, 6)[1:]
        stem(p, "mint_dark", pts, 0.0028, 0.002, 5)
        for j, k in enumerate((3, 4, 5, 6)):
            q = pts[k]
            dd = (pts[min(k + 1, len(pts) - 1)] - pts[k - 1])
            hy = math.degrees(math.atan2(dd.y, dd.x))
            sz = 1.0 - 0.17 * j
            for sgn in (1, -1):
                mat = "mint" if (j + i) % 3 else "mint_dark"
                leaf(p, mat, q, hy + sgn * rnd.uniform(62, 86), rnd.uniform(14, 30), 0.046 * sz + 0.008, 0.032 * sz + 0.006,
                     droop=0.45, fold=0.38, n=5, prof=OVAL, twist=sgn * 10)
        hy = math.degrees(math.atan2(pts[-1].y - pts[-2].y, pts[-1].x - pts[-2].x))
        for sgn in (1, -1):
            leaf(p, "mint", pts[-1], hy + sgn * 22, 26, 0.022, 0.014, droop=0.2, fold=0.45, n=4, prof=OVAL)
    tie(p, x_tie, 0.0, zc, 0.011, 3, seed=6)
    return p


CROPS = [crop_wheat, crop_carrot, crop_potato, crop_garlic, crop_cabbage, crop_pumpkin, crop_strawberry, crop_chamomile, crop_mint]


# ------------------------------------------------------------------ export, checks and previews

def export(objs):
    """common.export, but with texture coordinates on (only slate_face has a UV map)."""
    for o in bpy.data.objects:
        try:
            o.select_set(False)
        except Exception:
            pass
    for o in objs:
        o.hide_set(False)
        o.hide_render = False
        o.select_set(True)
    path = os.path.join(common.OUT_MODELS, NAME + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_yup=True, export_apply=True, export_animations=False,
                              export_cameras=False, export_lights=False, export_extras=False,
                              export_texcoords=True, export_materials="EXPORT",
                              export_vertex_color="ACTIVE")
    return path


def inspect_glb(path):
    """Read back the .glb: top-level nodes, children, translations, which meshes carry UVs."""
    with open(path, "rb") as f:
        data = f.read()
    ln = struct.unpack_from("<I", data, 12)[0]
    g = json.loads(data[20:20 + ln])
    nodes = g["nodes"]
    roots = g["scenes"][g.get("scene", 0)]["nodes"]
    out = {}
    for i in roots:
        n = nodes[i]
        kids = [nodes[c]["name"] for c in n.get("children", [])]
        out[n["name"]] = {"t": n.get("translation", [0, 0, 0]), "children": kids}
    uvs = {}
    for n in nodes:
        if "mesh" in n:
            prims = g["meshes"][n["mesh"]]["primitives"]
            uvs[n["name"]] = [("TEXCOORD_0" in pr["attributes"], "COLOR_0" in pr["attributes"],
                               g["materials"][pr["material"]]["name"] if "material" in pr else None) for pr in prims]
    face = next(n for n in nodes if n["name"] == "slate_face")
    return out, {k: v for k, v in uvs.items() if any(a for a, _, _ in v) or k == "slate_face"}, face, \
        all(all(c for _, c, _ in v) for v in uvs.values())


def chalk_image():
    """Preview only: a fake chalk question so the render shows the slate in use (and proves the UVs:
    the sun doodle must come out top-left, the tick box bottom-right)."""
    import numpy as np
    W, H = 1024, 768
    rnd = np.random.default_rng(4)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)      # row 0 = bottom of the image (Blender)
    ink = np.zeros((H, W), np.float32)

    def stroke(x0, y0, x1, y1, w):
        dx, dy = x1 - x0, y1 - y0
        L2 = dx * dx + dy * dy + 1e-6
        t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / L2, 0, 1)
        d = np.hypot(xx - (x0 + t * dx), yy - (y0 + t * dy))
        np.maximum(ink, np.clip((w - d) / 2.0, 0, 1), out=ink)

    # sun doodle, top-left
    cx, cy = 90, H - 92
    for k in range(48):
        a0, a1 = TAU * k / 48, TAU * (k + 1) / 48
        stroke(cx + 30 * math.cos(a0), cy + 30 * math.sin(a0), cx + 30 * math.cos(a1), cy + 30 * math.sin(a1), 5)
    for k in range(8):
        a = TAU * k / 8
        stroke(cx + 42 * math.cos(a), cy + 42 * math.sin(a), cx + 58 * math.cos(a), cy + 58 * math.sin(a), 5)
    # "code" lines: word-shaped dashes, indented like Python
    y = H - 210
    for line, indent in enumerate((0, 1, 1, 2, 1)):
        x = 90 + indent * 70
        for wd in range(int(rnd.integers(2, 5))):
            ln = float(rnd.integers(50, 170))
            for k in range(int(ln // 14)):
                xa = x + k * 14
                hgt = float(rnd.integers(14, 30))
                stroke(xa, y - 14, xa + 8, y - 14 + hgt, 4.5)
            x += ln + 34
            if x > W - 220:
                break
        y -= 92
    stroke(84, 150, W - 300, 150, 5)          # an underline, then the tick box bottom-right
    bx, by = W - 200, 70
    for a, b in (((bx, by), (bx + 90, by)), ((bx + 90, by), (bx + 90, by + 90)), ((bx + 90, by + 90), (bx, by + 90)), ((bx, by + 90), (bx, by))):
        stroke(a[0], a[1], b[0], b[1], 5)
    stroke(bx + 18, by + 46, bx + 40, by + 20, 7)
    stroke(bx + 40, by + 20, bx + 82, by + 78, 7)
    ink *= np.clip(0.75 + 0.35 * rnd.random((H, W), np.float32), 0, 1)
    base = np.array([0x3B, 0x42, 0x45], np.float32) / 255
    chalk = np.array([0.93, 0.92, 0.89], np.float32)
    rgb = base[None, None, :] * (1 - ink[..., None]) + chalk[None, None, :] * ink[..., None]
    rgb += (rnd.random((H, W, 1), np.float32) - 0.5) * 0.02
    img = bpy.data.images.new("chalk_preview", W, H, alpha=False)
    px = np.concatenate([np.clip(rgb, 0, 1), np.ones((H, W, 1), np.float32)], axis=2)
    img.pixels.foreach_set(px.ravel())
    img.pack()
    return img


def chalk_preview_material():
    m = bpy.data.materials["review_chalk"]
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = chalk_image()
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95


def main():
    model = common.reset()
    stage = bpy.data.collections.new("REVIEW_PREVIEW")
    bpy.context.scene.collection.children.link(stage)
    objs = {}
    p = easel()
    objs["review_slate"] = p.to_object(model, origin=(0, 0, 0), sharp_angle=50)
    face = slate_face(objs["review_slate"], model)
    objs["review_basket"] = basket().to_object(model, origin=(0, 0, 0), sharp_angle=60)
    for fn in CROPS:
        part = fn()
        objs[part.name] = part.to_object(model, origin=grounded(part), sharp_angle=70)
    vc.tune_materials()
    # bake apart from each other on an occluding floor, then export everything at the origin
    lay = {"review_slate": (0, 0), "review_basket": (1.1, 0)}
    for i, fn in enumerate(CROPS):
        lay[fn.__name__] = (1.9 + (i % 5) * 0.45, -0.45 * (i // 5))
    for n, (x, y) in lay.items():
        objs[n].location = (x, y, 0)
    floor = bpy.data.objects.new("bake_floor", bpy.data.meshes.new("bake_floor"))
    gbm = bmesh.new()
    bmesh.ops.create_grid(gbm, x_segments=1, y_segments=1, size=8)
    gbm.to_mesh(floor.data)
    gbm.free()
    stage.objects.link(floor)
    floor.location = (2, 0, -0.0015)
    bpy.context.view_layer.update()
    common.setup_render((1600, 1150))
    big = [objs["review_slate"], face, objs["review_basket"]]
    small = [objs[fn.__name__] for fn in CROPS]
    common.bake_ao(big, samples=48, distance=0.22, floor=0.5, keep=KEEP_BRIGHT)
    common.bake_ao(small, samples=48, distance=0.07, floor=0.55, keep=KEEP_BRIGHT)
    bpy.data.objects.remove(floor, do_unlink=True)
    tris = {n: common.tris([o]) for n, o in objs.items()}
    tris["slate_face"] = common.tris([face])
    for o in objs.values():
        o.location = (0, 0, 0)
    bpy.context.view_layer.update()
    path = export(list(objs.values()) + [face])
    size = os.path.getsize(path)
    roots, uv_meshes, face_node, all_ao = inspect_glb(path)
    # slate_face numbers (Blender space and three.js space)
    c = face.matrix_world.translation
    me = face.data
    wv = [face.matrix_world @ v.co for v in me.vertices]
    nrm = (face.matrix_world.to_3x3() @ me.polygons[0].normal).normalized()
    uv_by_corner = {tuple(round(x, 3) for x in (face.matrix_world @ me.vertices[l.vertex_index].co)): tuple(me.uv_layers[0].data[i].uv)
                    for i, l in enumerate(me.loops)}
    bpy.context.view_layer.update()

    def three(v):
        return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
    print("REVIEW_TRIS", tris, "total", sum(tris.values()))
    print("REVIEW_GLB", path, size, "bytes")
    print("REVIEW_ROOTS", roots)
    print("REVIEW_UV_MESHES", uv_meshes, "all meshes have COLOR_0:", all_ao)
    print("REVIEW_FACE blender centre", [round(x, 4) for x in c], "three", three(c), "normal blender", [round(x, 4) for x in nrm], "three", three(nrm),
          "size", FACE_W, FACE_H, "lean deg", round(math.degrees(LEAN), 2))
    print("REVIEW_FACE corners/uv", uv_by_corner)
    print("REVIEW_FACE glb node", face_node)
    print("REVIEW_BASKET floor_top", FLOOR_TOP, "inner r at floor", round(wall_r(FLOOR_TOP) - 0.0145, 4), "inner r at rim", round(wall_r(H_RIM) - 0.0145, 4))
    for n, o in objs.items():
        pts = [o.matrix_world @ Vector(b) for b in o.bound_box]
        dims = [round(max(q[i] for q in pts) - min(q[i] for q in pts), 3) for i in range(3)]
        print("REVIEW_DIMS", n, dims, "minz", round(min(q.z for q in pts), 4))

    # ---------------- preview: the slate by the field, the basket half full, the harvest on the grass
    chalk_preview_material()
    common.preview_materials()

    def place(name, loc, rot=0.0):
        ob = objs[name].copy()
        stage.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = (0, 0, math.radians(rot))
        return ob
    bx, by = 0.6, -0.42
    objs["review_basket"].location = (bx, by, 0)
    objs["review_basket"].rotation_euler = (0, 0, math.radians(-14))
    shown = [objs["review_slate"], face, objs["review_basket"]]
    inside = [("crop_cabbage", (-0.06, 0.06, FLOOR_TOP), 20), ("crop_potato", (0.09, -0.05, FLOOR_TOP), 40),
              ("crop_strawberry", (-0.07, -0.09, FLOOR_TOP), -30), ("crop_garlic", (0.1, 0.07, FLOOR_TOP), 0),
              ("crop_carrot", (0.01, -0.02, 0.075), 28)]
    for n, (x, y, z), r in inside:
        shown.append(place(n, (bx + x, by + y, z), r))
    loose = [("crop_pumpkin", (1.02, -0.3), 20), ("crop_wheat", (-0.55, -0.62), -18), ("crop_chamomile", (-0.2, -0.72), 12),
             ("crop_mint", (0.12, -0.82), -8), ("crop_carrot", (0.98, -0.72), 150), ("crop_potato", (0.82, -0.86), 0),
             ("crop_cabbage", (-0.62, -0.25), 0), ("crop_garlic", (0.45, -0.9), 0), ("crop_strawberry", (1.18, -0.6), 0)]
    for o in [objs[n] for n in lay if n.startswith("crop_")]:
        o.hide_render = True
    for n, (x, y), r in loose:
        shown.append(place(n, (x, y, 0), r))
    for o in shown:
        o.hide_render = False
    bpy.context.view_layer.update()
    common.preview_rig([o for o in shown if o.type == "MESH"], azim=-16, elev=24, lens=50, margin=0.86)
    common.render(os.path.join(common.OUT_PREV, NAME + ".png"))
    qa = os.environ.get("REVIEW_KIT_QA")
    if qa:
        os.makedirs(qa, exist_ok=True)
        common.preview_rig([objs["review_slate"], face], azim=0, elev=6, lens=60, margin=1.02)
        common.render(os.path.join(qa, "qa_slate_front.png"))
        common.preview_rig([objs["review_slate"]], azim=-62, elev=10, lens=50, margin=1.05)
        common.render(os.path.join(qa, "qa_slate_side.png"))
        common.preview_rig([objs["review_basket"]], azim=-16, elev=42, lens=60, margin=1.02)
        common.render(os.path.join(qa, "qa_basket.png"))
        row = []
        for o in shown[3:]:
            o.hide_render = True
        objs["review_slate"].hide_render = True
        face.hide_render = True
        objs["review_basket"].hide_render = True
        x = 0.0
        for fn in CROPS:
            o = place(fn.__name__, (x, 3.0, 0), 0)
            o.hide_render = False
            row.append(o)
            x += 0.32
        bpy.context.view_layer.update()
        common.preview_rig(row, azim=-10, elev=30, lens=60, margin=1.0)
        common.render(os.path.join(qa, "qa_crops.png"))
        for o in row:
            bpy.data.objects.remove(o, do_unlink=True)
        for o in shown:
            o.hide_render = False
    common.save_blend(NAME)
    return tris


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
