"""Shared kit for the player's tools (axe.py, pickaxe.py), in the soft Animal Crossing style of
the characters (2026-10-23): chunky rounded shapes, a gently curved ash handle with a spiral
leather grip, soft brushed steel and a few brass details.

Tool format (for src/game/anim.ts): one object named after the tool, origin at the centre of
the fist grip. The handle runs up +Z, the working edge (blade, pick point) faces -Y (the front),
so in three.js the handle runs up +Y and the edge faces +Z. The game parents the tool to the
player's `arm_r` and shows it only while chopping or mining.
"""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bmesh
from common import Part, M, bm_box, bm_tube
from villagers_common import S, sphere, lathe, ring_pts, frame
from mathutils import Vector, Matrix

vc.palette({
    "ash": "#C99A62", "ash_dark": "#9C7044", "ash_end": "#E2C08E",
    "grip": "#6A4129", "grip_light": "#8E5E3D",
    "steel_soft": "#AEB7BE", "steel_dark": "#7D868E", "steel_bright": "#DCE2E6",
    "tool_brass": "#C9A050", "sprout": "#79B85A", "sprout_dark": "#4F8A3E", "twine": "#D9C49A",
}, metal={"steel_soft": (0.7, 0.32), "steel_dark": (0.6, 0.42), "steel_bright": (0.85, 0.2), "tool_brass": (0.7, 0.32)})


def catmull(pts, n=8):
    """Smooth Catmull-Rom curve through the points, n samples per span."""
    P = [Vector(p) for p in pts]
    P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2])
    return out


def lerp_keys(keys, t):
    """Piecewise-linear value at t from [(t, v), ...]."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            return v0 + (v1 - v0) * (t - t0) / (t1 - t0)
    return keys[-1][1]


def handle_path(top, bow=0.012, n=24):
    """Points up the handle centre line from the butt (z=-0.075) to `top`, with a gentle bow toward +Y."""
    pts = []
    for k in range(n + 1):
        z = -0.075 + (top + 0.075) * k / n
        u = (z + 0.075) / (top + 0.075)
        pts.append(Vector((0.0, bow * math.sin(math.pi * u), z)))
    return pts


def handle(p, top, radii, bow=0.012):
    """Ash handle with a rounded butt knob, grain lines and the spiral leather grip.
    radii: [(z, r), ...] keys for the handle radius."""
    path = handle_path(top, bow)
    rs = [lerp_keys(radii, q.z) for q in path]
    p.add(bm_tube(path, rs, 28, cap=True), "ash", smooth=True)
    # soft butt knob and a domed top
    p.add(sphere(28, 16), "ash", M(path[0] + Vector((0, 0, 0.004)), scale=(rs[0] * 1.32, rs[0] * 1.32, rs[0] * 0.95)), smooth=True)
    p.add(sphere(24, 12), "ash_end", M(path[-1], scale=(rs[-1] * 0.98, rs[-1] * 0.98, rs[-1] * 0.5)), smooth=True)
    # grain lines up the bare part of the handle
    for a0, z0, z1 in ((20, 0.15, top - 0.12), (140, 0.18, top - 0.08), (250, 0.14, top - 0.14), (320, 0.2, top - 0.1)):
        pts = []
        for k in range(17):
            z = z0 + (z1 - z0) * k / 16
            u = (z + 0.075) / (top + 0.075)
            a = math.radians(a0 + 7 * math.sin(k * 0.8))
            r = lerp_keys(radii, z) + 0.0004
            pts.append(Vector((r * math.cos(a), bow * math.sin(math.pi * u) + r * math.sin(a), z)))
        p.add(bm_tube(pts, 0.0012, 5), "ash_dark", smooth=True)
    # spiral leather grip from just above the knob to past the fist, cord lashings at both ends
    zw0, zw1, pitch = -0.05, 0.1, 0.0108
    n = int((zw1 - zw0) / pitch * 20)
    hel = []
    for k in range(n + 1):
        z = zw0 + (zw1 - zw0) * k / n
        u = (z + 0.075) / (top + 0.075)
        a = 2 * math.pi * (z - zw0) / pitch
        r = lerp_keys(radii, z) + 0.0036
        hel.append(Vector((r * math.cos(a), bow * math.sin(math.pi * u) + r * math.sin(a), z)))
    p.add(bm_tube(hel, 0.0052, 8), "grip", smooth=True)
    for zc in (zw0 - 0.005, zw1 + 0.005):
        u = (zc + 0.075) / (top + 0.075)
        c = Matrix.Translation((0, bow * math.sin(math.pi * u), zc))
        for dz in (-0.0038, 0.0038):
            p.add(bm_tube(ring_pts(c @ Matrix.Translation((0, 0, dz)), lerp_keys(radii, zc) + 0.0048, 24), 0.0024, 6, cap=False), "grip_light", smooth=True)
    return path


def sprout_charm(p, z, bow=0.012, top=0.5):
    """A little twine loop under the grip with a two-leaf sprout charm, like the player's badge."""
    u = (z + 0.075) / (top + 0.075)
    c = Vector((0, bow * math.sin(math.pi * u), z))
    p.add(bm_tube(ring_pts(Matrix.Translation(c), 0.024, 20), 0.0022, 6, cap=False), "twine", smooth=True)
    knot = c + Vector((0.0, 0.026, 0.0))
    p.add(sphere(12, 8), "twine", M(knot, scale=0.0048), smooth=True)
    hang = [knot, knot + Vector((0.004, 0.012, -0.02)), knot + Vector((0.002, 0.016, -0.045))]
    p.add(bm_tube(hang, 0.0018, 5), "twine", smooth=True)
    stem0 = hang[-1]
    stem1 = stem0 + Vector((0.0, 0.004, -0.024))
    p.add(bm_tube([stem0, stem1], [0.0032, 0.0026], 8), "sprout_dark", smooth=True)
    for side in (1, -1):
        leaf = pillow([(0.0, 0.0), (0.009, 0.006), (0.019, 0.006), (0.027, 0.0), (0.019, -0.006), (0.009, -0.006)],
                      lambda a, b: 0.0035, 6)
        m = Matrix.Translation(stem0 + Vector((0, 0.002, -0.004))) @ Matrix.Rotation(math.radians(side * 35 + (0 if side > 0 else 180)), 4, "Y")
        p.add(leaf, "sprout", m @ Matrix.Rotation(math.radians(90), 4, "Z"), smooth=True)


def pillow(outline, half, rings=8, centre=None, power=0.55):
    """A soft inflated slab: outline [(u, v), ...] in the local UV plane (u -> Y, v -> Z), thickness
    along X, half(u, v) = half thickness there. The rim is thin and rounded, the middle full."""
    bm = bmesh.new()
    n = len(outline)
    if centre is None:
        centre = (sum(q[0] for q in outline) / n, sum(q[1] for q in outline) / n)
    cu, cv = centre
    sides = []
    rim = [bm.verts.new((0.0, u, v)) for u, v in outline]
    for sgn in (1, -1):
        prev = rim
        for k in range(1, rings):
            a = (k / rings) * math.pi / 2
            sh = math.cos(a)
            ring = []
            for u, v in outline:
                uu, vv = cu + (u - cu) * sh, cv + (v - cv) * sh
                ring.append(bm.verts.new((sgn * half(uu, vv) * math.sin(a) ** power, uu, vv)))
            for i in range(n):
                j = (i + 1) % n
                f = (prev[i], prev[j], ring[j], ring[i])
                bm.faces.new(f if sgn > 0 else tuple(reversed(f)))
            prev = ring
        pole = bm.verts.new((sgn * half(cu, cv), cu, cv))
        for i in range(n):
            j = (i + 1) % n
            f = (prev[i], prev[j], pole)
            bm.faces.new(f if sgn > 0 else tuple(reversed(f)))
        sides.append(prev)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def smooth_outline(pts, n=6):
    """Closed Catmull-Rom loop through 2D points."""
    P = [Vector((u, v, 0)) for u, v in pts]
    out = catmull(P + [P[0]], n)[:-1]
    return [(q.x, q.y) for q in out]


def finish(name, p, grip=(0, 0, 0)):
    """Make the object, bake, export public/models/<name>.glb and render the preview."""
    coll = common.reset()
    vc.tune_materials()
    ob = p.to_object(coll, origin=grip, sharp_angle=80)
    import bpy
    bpy.context.view_layer.update()
    common.setup_render((1000, 1000))
    common.bake_ao([ob])
    common.export(name + ".glb", [ob])          # exported with the grip at the origin
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    size = tuple(round(max(getattr(q, a) for q in pts) - min(getattr(q, a) for q in pts), 3) for a in "xyz")
    ob.location.z = -min(q.z for q in pts) + 0.01   # stood on the grass for the preview only
    bpy.context.view_layer.update()
    common.preview_rig([ob], azim=-58, elev=14, lens=70, margin=1.2)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, name + ".png"))
    common.preview_rig([ob], azim=150, elev=22, lens=70, margin=1.15)
    common.render(os.path.join(common.OUT_PREV, name + "_side.png"))
    common.save_blend(name)
    r = {"tris": common.tris([ob]), "size_xyz": size}
    print("TOOL", name, r)
    return r
