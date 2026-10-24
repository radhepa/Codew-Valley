"""Shared kit for the fishing models (fishing_gear.py, fishing_catch.py), in the soft rounded style of
the characters and tools (villagers_common.py, tools_common.py) with the valley's muted palette.

  loft(...)          a rounded body lofted along X from elliptical rings (fish bodies)
  add_banded(...)    add a bmesh to a Part with a material chosen per face (countershading bands)
  fin(...)           a soft fin slab drawn in the X-Z plane (side view), thin along Y
  fish_eye(...)      iris, pupil and highlight on the body surface
  finish_set(...)    bake AO, export one .glb holding several named objects, save the .blend
  thumb(...)         a transparent close-up render of one object (journal art)
"""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc, tools_common as tc
importlib.reload(common)
importlib.reload(vc)
importlib.reload(tc)
import bpy, bmesh
from common import Part, M, bm_box, bm_cyl, bm_tube
from villagers_common import S, sphere, lathe, ring_pts, frame
from tools_common import pillow, smooth_outline, catmull
from mathutils import Vector, Matrix

THUMBS = os.path.join(common.ROOT, "src", "life", "fishing", "img")


def lerp_keys(keys, t):
    """Smooth piecewise value at t from [(t, v), ...] (cosine eased between keys)."""
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            u = (t - t0) / max(t1 - t0, 1e-9)
            u = 0.5 - 0.5 * math.cos(math.pi * u)
            return v0 + (v1 - v0) * u
    return keys[-1][1]


def loft(x0, x1, rh, rw, zc=lambda u: 0.0, yc=lambda u: 0.0, rings=40, segs=32, cap0=True, cap1=True, squash=None):
    """Body lofted along X from x0 (u=0, the tail end) to x1 (u=1, the nose). rh(u) / rw(u) are the
    vertical and sideways radii, zc(u) / yc(u) move the ring centre. squash(u, a) optionally scales the
    radius by angle (a = 0 on top, pi underneath) for flat bellies or keeled backs.
    Returns (bm, centre(u)) where centre gives the ring centre for placing details."""
    bm = bmesh.new()
    loops = []
    for i in range(rings + 1):
        u = i / rings
        x = x0 + (x1 - x0) * u
        h, w = max(rh(u), 1e-4), max(rw(u), 1e-4)
        ring = []
        for k in range(segs):
            a = 2 * math.pi * k / segs          # 0 = top, going round toward +Y
            s = squash(u, a) if squash else 1.0
            ring.append(bm.verts.new((x, yc(u) + math.sin(a) * w * s, zc(u) + math.cos(a) * h * s)))
        loops.append(ring)
    for i in range(rings):
        a, b = loops[i], loops[i + 1]
        for k in range(segs):
            k2 = (k + 1) % segs
            bm.faces.new((a[k], a[k2], b[k2], b[k]))
    if cap0:
        pole = bm.verts.new((x0 - 0.0005, yc(0), zc(0)))
        for k in range(segs):
            bm.faces.new((loops[0][(k + 1) % segs], loops[0][k], pole))
    if cap1:
        pole = bm.verts.new((x1 + 0.0005, yc(1), zc(1)))
        for k in range(segs):
            bm.faces.new((loops[-1][k], loops[-1][(k + 1) % segs], pole))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def add_banded(part, bm2, matfn, matrix=None, smooth=True):
    """Like Part.add, but matfn(centre, normal) picks each face's material name."""
    matrix = matrix or Matrix()
    flip = matrix.to_3x3().determinant() < 0
    vmap = {v: part.bm.verts.new(matrix @ v.co) for v in bm2.verts}
    nm = matrix.to_3x3().inverted().transposed()
    for f in bm2.faces:
        name = matfn(matrix @ f.calc_center_median(), (nm @ f.normal).normalized())
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


def fin(part, outline, thick, mat, at=(0, 0, 0), rot=(0, 0, 0), n=6, rings=6, power=0.6, edge=0.25):
    """A soft fin: outline [(x, z), ...] drawn in the side view (X forward, Z up), thin along Y.
    thick is the half thickness at the root; it thins toward the rim. Placed at `at`, turned by rot (degrees)."""
    pts = smooth_outline(outline, n)
    cu = sum(p[0] for p in pts) / len(pts)
    cv = sum(p[1] for p in pts) / len(pts)
    span = max(max(abs(p[0] - cu) for p in pts), max(abs(p[1] - cv) for p in pts), 1e-6)

    def half(u, v):
        d = math.hypot(u - cu, v - cv) / span
        return thick * max(edge, 1.0 - 0.75 * d)

    bm = pillow(pts, half, rings, power=power)
    # pillow: thickness along X, u -> Y, v -> Z. Turn it so u -> X and the thickness lies along Y.
    turn = Matrix(((0, 1, 0, 0), (-1, 0, 0, 0), (0, 0, 1, 0), (0, 0, 0, 1)))
    part.add(bm, mat, M(at, rot) @ turn, smooth=True)


def fish_eye(part, c, normal, r, iris="iris_gold", pupil="eye_dark", look=(0.0, 0.0)):
    """A fish eye at c facing `normal`: a gold iris dome, a dark pupil and one small highlight."""
    f = frame(Vector(c), Vector(normal))
    part.add(sphere(24, 14), iris, f @ S(r, r, r * 0.42), smooth=True)
    pc = f @ Vector((look[0] * r * 0.25, look[1] * r * 0.25, r * 0.3))
    part.add(sphere(20, 12), pupil, frame(pc, Vector(normal)) @ S(r * 0.62, r * 0.62, r * 0.24), smooth=True)
    hc = f @ Vector((r * 0.22, r * 0.24, r * 0.5))
    part.add(sphere(12, 8), "white", Matrix.Translation(hc) @ S(r * 0.17), smooth=True)


def finish_set(name, objs, empties=(), samples=40):
    """Bake AO into every mesh, export public/models/<name>.glb with the objects (and empties) and
    save art/blend/<name>.blend. Returns triangle counts per object."""
    bpy.context.view_layer.update()
    common.setup_render((900, 900))
    vc.tune_materials()
    meshes = [o for o in objs if o.type == "MESH"]
    common.bake_ao(meshes, samples=samples, distance=0.3, floor=0.55)
    common.export(name + ".glb", list(objs) + list(empties))
    common.save_blend(name)
    return {o.name: common.tris([o]) for o in meshes}


def thumb(ob, path, res=(400, 260), azim=-90, elev=12, lens=85, margin=1.06, others=()):
    """Render ob alone on a transparent background (soft studio light), for the fish journal."""
    sc = bpy.context.scene
    hidden = []
    for o in bpy.data.objects:
        if o is not ob and o.type in ("MESH", "EMPTY") and not o.hide_render and o not in others and o.parent is not ob:
            o.hide_render = True
            hidden.append(o)
    common.setup_render(res)
    sc.render.film_transparent = True
    sc.view_settings.exposure = 0.35
    # frame the object's bounds
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    for ch in ob.children:
        pts += [ch.matrix_world @ Vector(c) for c in ch.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = (lo + hi) / 2
    a, e = math.radians(azim), math.radians(elev)
    d = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam_d = bpy.data.cameras.get("thumb_cam") or bpy.data.cameras.new("thumb_cam")
    cam_d.lens = lens
    cam = bpy.data.objects.get("thumb_cam") or bpy.data.objects.new("thumb_cam", cam_d)
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    # fit: project the bounds onto the camera plane
    rot = (-d).to_track_quat("-Z", "Y")
    right = rot @ Vector((1, 0, 0))
    up = rot @ Vector((0, 1, 0))
    corners = [Vector((x, y, z)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for z in (lo.z, hi.z)]
    w = max(abs((c - centre).dot(right)) for c in corners)
    h = max(abs((c - centre).dot(up)) for c in corners)
    fov = 2 * math.atan(cam_d.sensor_width / 2 / lens)
    aspect = res[1] / res[0]
    half_w = math.tan(fov / 2)
    half_h = half_w * aspect
    dist = max(w / half_w, h / half_h) * margin + max(hi - lo) * 0.5
    cam.location = centre + d * dist
    cam.rotation_euler = rot.to_euler()
    cam_d.clip_start = 0.01
    cam_d.clip_end = 100
    sc.camera = cam
    # light: a warm key from the upper front-left, a cool fill, and a soft sky
    for n in ("thumb_key", "thumb_fill"):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    key_d = bpy.data.lights.new("thumb_key", "SUN")
    key_d.energy = 4.2
    key_d.color = (1.0, 0.9, 0.76)
    key_d.angle = math.radians(12)
    key = bpy.data.objects.new("thumb_key", key_d)
    key.rotation_euler = (math.radians(40), math.radians(-25), math.radians(azim + 40))
    sc.collection.objects.link(key)
    fill_d = bpy.data.lights.new("thumb_fill", "SUN")
    fill_d.energy = 1.4
    fill_d.color = (0.75, 0.85, 1.0)
    fill = bpy.data.objects.new("thumb_fill", fill_d)
    fill.rotation_euler = (math.radians(110), 0, math.radians(azim - 150))
    sc.collection.objects.link(fill)
    common.world_sky(0)
    sc.world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
    common.render(path)
    for o in hidden:
        o.hide_render = False
    for n in ("thumb_key", "thumb_fill"):
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)
    sc.render.film_transparent = False
    return path
