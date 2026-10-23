"""Shared helpers for the Python Village model scripts.

Every model script does:
    import common; common.reset(); ...build Parts...; common.export(...); common.preview(...)

Geometry is built with bmesh straight into a `Part` (one Blender object), so a
part can hold many primitives with several palette materials and no joins.
Works in the open Blender (via exec) and with `blender -b -P script.py`.
"""
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, Euler

ROOT = r"C:\Users\minal\python-village"
OUT_MODELS = os.path.join(ROOT, "public", "models")
OUT_BLEND = os.path.join(ROOT, "art", "blend")
OUT_PREV = os.path.join(ROOT, "art", "previews")

# ART.md palette, plus a few extras ART.md doesn't cover (marked).
PALETTE = {
    "grass": "#7FB24A", "grass_dark": "#5E9A3A", "grass_light": "#A5CC5B", "leaf_deep": "#3F7A34",
    "wood": "#A0673A", "wood_mid": "#7A4A2A", "wood_light": "#C58B52", "wood_dark": "#5A3620",
    "stone": "#A9A39A", "stone_mid": "#8A847C", "stone_light": "#C9C2B6", "stone_dark": "#6E6962",
    "thatch": "#D9A84E", "thatch_dark": "#B9823A", "roof": "#B5523B", "roof_dark": "#8E3E2E",
    "plaster": "#F2E3C6", "plaster_shade": "#E6CFA4",
    "glow": "#FFC861", "door": "#4F7A5A", "cloth": "#C8553D", "pip": "#6CC46A",
    # extras (not in ART.md)
    "dirt": "#A58260", "glass": "#A9CDD3", "iron": "#3E3936", "ink": "#2B2626",
    "white": "#FFFBF2", "skin": "#F3C6A0", "blush": "#EE9C88", "hair": "#6E4026",
    "hair_grey": "#B9AFA6", "pip_belly": "#F4E6B8", "cap": "#3A4466",
    "petal_pink": "#F08FAA", "petal_white": "#FFF4E2", "petal_yellow": "#F7D25A",
    "petal_purple": "#A88ADB", "tunic": "#5D86B5", "pants": "#6B5A4A",
}
EXTRAS = {"dirt", "glass", "iron", "ink", "white", "skin", "blush", "hair", "hair_grey",
          "pip_belly", "cap", "petal_pink", "petal_white", "petal_yellow", "petal_purple",
          "tunic", "pants"}


def srgb_to_lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_rgba(h):
    h = h.lstrip("#")
    return tuple(srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def mat(name):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get("Principled BSDF")
    col = hex_rgba(PALETTE[name])
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = 0.35 if name in ("glass", "glow") else 0.85
    b.inputs["Specular IOR Level"].default_value = 0.3
    if name == "glow":
        b.inputs["Emission Color"].default_value = col
        b.inputs["Emission Strength"].default_value = 1.0
    m.diffuse_color = col
    return m


# ---------------------------------------------------------------- scene

def reset():
    """Empty the file (this project owns the open Blender session)."""
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights,
                 bpy.data.curves, bpy.data.images):
        for d in list(coll):
            if d.users == 0 or coll is not bpy.data.images:
                try:
                    coll.remove(d)
                except Exception:
                    pass
    sc = bpy.context.scene
    for c in list(sc.collection.children):
        bpy.data.collections.remove(c)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    model = bpy.data.collections.new("MODEL")
    prev = bpy.data.collections.new("PREVIEW")
    sc.collection.children.link(model)
    sc.collection.children.link(prev)
    return model


def coll(name):
    return bpy.data.collections[name]


def M(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    """Matrix from location, rotation in degrees (XYZ) and scale."""
    if isinstance(scale, (int, float)):
        scale = (scale, scale, scale)
    r = Euler([math.radians(a) for a in rot], "XYZ").to_matrix().to_4x4()
    s = Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    return Matrix.Translation(loc) @ r @ s


# ---------------------------------------------------------------- primitives (fresh bmesh at origin)

def bm_box(sx, sy, sz, bevel=0.0, segs=1):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.verts[:] + bm.edges[:], offset=bevel, segments=segs,
                        profile=0.5, affect="EDGES", clamp_overlap=True)
    return bm


def bm_cyl(r1, r2, h, segs=8, bevel=0.0):
    """Cylinder/cone along Z, base at z=0."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r1,
                          radius2=r2, depth=h, matrix=Matrix.Translation((0, 0, h / 2)))
    if bevel > 0:
        caps = [e for e in bm.edges if all(abs(v.co.z) < 1e-5 or abs(v.co.z - h) < 1e-5 for v in e.verts)
                and abs(e.verts[0].co.z - e.verts[1].co.z) < 1e-5]
        bmesh.ops.bevel(bm, geom=caps + list({v for e in caps for v in e.verts}), offset=bevel,
                        segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
    return bm


def bm_ico(r, subdiv=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
    return bm


def bm_uv(r, u=10, v=6):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r)
    return bm


def bm_lathe(profile, segs=10, cap_bottom=True, cap_top=True, arc=None):
    """Surface of revolution around Z from [(radius, z), ...] bottom to top.
    `arc=(a0, a1)` in degrees makes an open, outward-facing partial surface (no caps)."""
    bm = bmesh.new()
    if arc:
        a0, a1 = math.radians(arc[0]), math.radians(arc[1])
        rings = [[bm.verts.new((r * math.cos(a0 + (a1 - a0) * i / segs), r * math.sin(a0 + (a1 - a0) * i / segs), z))
                  for i in range(segs + 1)] for r, z in profile]
        for a, b in zip(rings, rings[1:]):
            for i in range(segs):
                bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
        return bm
    rings = []
    for r, z in profile:
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap_bottom and profile[0][0] > 1e-6:
        bm.faces.new(list(reversed(rings[0])))
    if cap_top and profile[-1][0] > 1e-6:
        bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def bm_prism(points, depth):
    """Polygon [(x, z), ...] in the XZ plane, extruded along Y (centred)."""
    bm = bmesh.new()
    front = [bm.verts.new((x, -depth / 2, z)) for x, z in points]
    back = [bm.verts.new((x, depth / 2, z)) for x, z in points]
    n = len(points)
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((front[i], back[i], back[j], front[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def bm_tube(points, radii, segs=8, cap=True):
    """Sweep a circle along a polyline of 3D points (radius per point)."""
    bm = bmesh.new()
    pts = [Vector(p) for p in points]
    rings = []
    prev_side = None
    for i, p in enumerate(pts):
        if i == 0:
            t = pts[1] - pts[0]
        elif i == len(pts) - 1:
            t = pts[-1] - pts[-2]
        else:
            t = (pts[i + 1] - pts[i - 1])
        t.normalize()
        ref = Vector((0, 0, 1)) if abs(t.z) < 0.9 else Vector((1, 0, 0))
        side = t.cross(ref).normalized() if prev_side is None else (prev_side - t * prev_side.dot(t)).normalized()
        prev_side = side
        up = side.cross(t).normalized()
        r = radii[i] if isinstance(radii, (list, tuple)) else radii
        ring = [bm.verts.new(p + (side * math.cos(2 * math.pi * k / segs) + up * math.sin(2 * math.pi * k / segs)) * r)
                for k in range(segs)]
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if cap:
        bm.faces.new(list(reversed(rings[0])))
        bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def bm_slab(points_xy, h):
    """Polygon [(x, y), ...] in the XY plane, extruded up from z=0 to z=h."""
    bm = bm_prism([(x, -y) for x, y in points_xy], h)
    rot = Matrix.Rotation(math.radians(90), 4, "X")
    for v in bm.verts:
        v.co = rot @ v.co + Vector((0, 0, h / 2))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def add_lantern(part, base, s=1.0, hang=False):
    """Little iron lantern with `glow` glass. `base` is the bottom centre."""
    x, y, z = base
    part.cyl(0.13 * s, 0.05 * s, (x, y, z), "iron", segs=8)
    part.box((0.17 * s, 0.17 * s, 0.26 * s), (x, y, z + 0.18 * s), "glow")
    for dx in (-1, 1):
        for dy in (-1, 1):
            part.box((0.035 * s, 0.035 * s, 0.28 * s), (x + dx * 0.095 * s, y + dy * 0.095 * s, z + 0.18 * s), "iron")
    part.cyl(0.17 * s, 0.14 * s, (x, y, z + 0.31 * s), "iron", r2=0.03 * s, segs=4, rot=(0, 0, 45))
    part.cyl(0.035 * s, 0.06 * s, (x, y, z + 0.44 * s), "iron", segs=6)
    if hang:
        part.box((0.02 * s, 0.07 * s, 0.1 * s), (x, y, z + 0.53 * s), "iron")


def jitter(bm, amt, seed=0, keep_bottom=None):
    rnd = random.Random(seed)
    seen = {}
    for v in bm.verts:
        key = (round(v.co.x, 4), round(v.co.y, 4), round(v.co.z, 4))
        if key not in seen:
            seen[key] = Vector((rnd.uniform(-amt, amt), rnd.uniform(-amt, amt), rnd.uniform(-amt, amt)))
        if keep_bottom is not None and v.co.z <= keep_bottom + 1e-4:
            continue
        v.co += seen[key]
    return bm


# ---------------------------------------------------------------- parts

class Part:
    """One output mesh object; primitives are appended with a palette material."""

    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []

    def add(self, bm2, matname, matrix=None, smooth=False):
        matrix = matrix or Matrix()
        if matname not in self.mats:
            self.mats.append(matname)
        idx = self.mats.index(matname)
        flip = matrix.to_3x3().determinant() < 0
        vmap = {v: self.bm.verts.new(matrix @ v.co) for v in bm2.verts}
        for f in bm2.faces:
            vs = [vmap[v] for v in f.verts]
            if flip:
                vs.reverse()
            nf = self.bm.faces.new(vs)
            nf.material_index = idx
            nf.smooth = smooth
        bm2.free()
        return self

    def merge(self, other, matrix=None):
        """Copy another Part's geometry (with its materials) into this one."""
        matrix = matrix or Matrix()
        remap = []
        for mn in other.mats:
            if mn not in self.mats:
                self.mats.append(mn)
            remap.append(self.mats.index(mn))
        flip = matrix.to_3x3().determinant() < 0
        vmap = {v: self.bm.verts.new(matrix @ v.co) for v in other.bm.verts}
        for f in other.bm.faces:
            vs = [vmap[v] for v in f.verts]
            if flip:
                vs.reverse()
            nf = self.bm.faces.new(vs)
            nf.material_index = remap[f.material_index]
            nf.smooth = f.smooth
        other.bm.free()
        return self

    # shorthands: loc is the centre for boxes/spheres, the base centre for cylinders
    def box(self, size, loc, matname, rot=(0, 0, 0), bevel=0.0, segs=1, smooth=False):
        return self.add(bm_box(*size, bevel=bevel, segs=segs), matname, M(loc, rot), smooth)

    def cyl(self, r1, h, loc, matname, r2=None, segs=8, rot=(0, 0, 0), bevel=0.0, scale=1, smooth=False):
        return self.add(bm_cyl(r1, r1 if r2 is None else r2, h, segs, bevel), matname, M(loc, rot, scale), smooth)

    def ball(self, r, loc, matname, scale=1, rot=(0, 0, 0), subdiv=1, smooth=True, uv=None):
        bm = bm_uv(r, *uv) if uv else bm_ico(r, subdiv)
        return self.add(bm, matname, M(loc, rot, scale), smooth)

    def to_object(self, collection, parent=None, origin=(0, 0, 0), sharp_angle=40):
        o = Vector(origin)
        for v in self.bm.verts:
            v.co -= o
        me = bpy.data.meshes.new(self.name)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for mn in self.mats:
            me.materials.append(mat(mn))
        try:
            me.set_sharp_from_angle(angle=math.radians(sharp_angle))
        except Exception:
            pass
        ob = bpy.data.objects.new(self.name, me)
        collection.objects.link(ob)
        if parent is not None:
            ob.parent = parent
            ob.location = o - parent.matrix_world.translation
        else:
            ob.location = o
        return ob


def empty(name, collection, parent=None, loc=(0, 0, 0)):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.5
    collection.objects.link(e)
    if parent:
        e.parent = parent
    e.location = loc
    return e


def tris(objs):
    n = 0
    for o in objs:
        if o.type == "MESH":
            n += sum(len(p.vertices) - 2 for p in o.data.polygons)
    return n


# ---------------------------------------------------------------- export / save

def export(filename, objs=None):
    os.makedirs(OUT_MODELS, exist_ok=True)
    objs = objs if objs is not None else list(coll("MODEL").all_objects)
    for o in bpy.data.objects:
        try:
            o.select_set(False)
        except Exception:
            pass
    for o in objs:
        o.hide_set(False)
        o.hide_render = False
        o.select_set(True)
    path = os.path.join(OUT_MODELS, filename)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True,
                              export_yup=True, export_apply=True, export_animations=False,
                              export_cameras=False, export_lights=False, export_extras=False,
                              export_texcoords=False, export_materials="EXPORT")
    return path


def save_blend(name):
    os.makedirs(OUT_BLEND, exist_ok=True)
    path = os.path.join(OUT_BLEND, name + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True, compress=True)
    return path


# ---------------------------------------------------------------- preview rig

def setup_render(res=(1280, 960)):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.eevee.taa_render_samples = 48
    try:
        sc.eevee.use_shadows = True
        sc.eevee.use_raytracing = True
        sc.eevee.use_fast_gi = True
    except Exception:
        pass
    sc.view_settings.view_transform = "Standard"   # closest to the sRGB output Three.js shows
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    w = sc.world or bpy.data.worlds.new("World")
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    bg = w.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = hex_rgba("#BFD9E8")
    bg.inputs["Strength"].default_value = 1.1


def preview_rig(targets, ground_r=None, azim=-32, elev=24, lens=50, margin=1.08, ground=True,
                ground_mat="grass", look_z_bias=0.0, sun_azim=35, min_radius=0.0):
    """Camera + sun + grass disc framed on `targets`. Returns the camera."""
    pc = coll("PREVIEW")
    for o in list(pc.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    pts = []
    for o in targets:
        if o.type == "MESH":
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = (lo + hi) / 2
    centre.z += look_z_bias
    radius = max((hi - lo).length / 2, min_radius)
    if ground:
        gr = ground_r or radius * 2.2
        p = Part("preview_ground")
        p.add(bm_cyl(gr, gr, 0.05, 48), ground_mat, M((0, 0, -0.05)))
        p.to_object(pc)
    cam_d = bpy.data.cameras.new("preview_cam")
    cam_d.lens = lens
    cam = bpy.data.objects.new("preview_cam", cam_d)
    pc.objects.link(cam)
    sensor = cam_d.sensor_width
    fov = 2 * math.atan(sensor / 2 / lens)
    sc = bpy.context.scene
    aspect = sc.render.resolution_y / sc.render.resolution_x
    fov_min = 2 * math.atan(math.tan(fov / 2) * min(1.0, aspect))
    dist = radius * margin / math.sin(fov_min / 2)
    a, e = math.radians(azim), math.radians(elev)
    direction = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam.location = centre + direction * dist
    cam.rotation_euler = (-direction).to_track_quat("-Z", "Y").to_euler()
    cam_d.clip_end = dist * 4
    sc.camera = cam
    sun_d = bpy.data.lights.new("preview_sun", "SUN")
    sun_d.energy = 3.2
    sun_d.color = (1.0, 0.94, 0.84)
    sun_d.angle = math.radians(4)
    sun = bpy.data.objects.new("preview_sun", sun_d)
    sun.rotation_euler = (math.radians(48), 0, math.radians(sun_azim))
    pc.objects.link(sun)
    return cam


def render(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path
