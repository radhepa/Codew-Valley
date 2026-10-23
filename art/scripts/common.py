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

# ART.md palette, softened toward natural tones after the user's 2026-10-23 direction
# ("atmospheric and aesthetic like Pokemon Legends: Arceus, not really cartoonish").
# Same names as ART.md; ART_MD_HEX keeps the original values for reference.
PALETTE = {
    "grass": "#8BAE4C", "grass_dark": "#5F8A3E", "grass_light": "#B8CB68", "leaf_deep": "#3E6838",
    "wood": "#8E6442", "wood_mid": "#6C4B31", "wood_light": "#B08B60", "wood_dark": "#4B3527",
    "stone": "#A39D93", "stone_mid": "#868077", "stone_light": "#BEB7A9", "stone_dark": "#6A655E",
    "thatch": "#C9A35A", "thatch_dark": "#A07C3E", "roof": "#9C5440", "roof_dark": "#743F31",
    "plaster": "#E8DCC3", "plaster_shade": "#D6C4A2",
    "glow": "#FFC861", "door": "#4A6B56", "cloth": "#B0533F", "pip": "#68B865",
    # extras (not in ART.md)
    "roof_mid": "#88493A", "dirt": "#9A7E60", "glass": "#9DB9BE", "iron": "#3E3936", "ink": "#2B2626",
    "white": "#F4EEE2", "skin": "#EBC3A3", "blush": "#DE9886", "hair": "#5E3A26",
    "hair_grey": "#ADA49B", "pip_belly": "#EEE2B8", "cap": "#3A4262",
    "petal_pink": "#D98AAA", "petal_white": "#F3EEE4", "petal_yellow": "#E9C65C",
    "petal_purple": "#9D8AC9", "tunic": "#465479", "pants": "#5F5446", "scarf": "#B88A3E",
}
ART_MD_HEX = {
    "grass": "#7FB24A", "grass_dark": "#5E9A3A", "grass_light": "#A5CC5B", "leaf_deep": "#3F7A34",
    "wood": "#A0673A", "wood_mid": "#7A4A2A", "wood_light": "#C58B52", "wood_dark": "#5A3620",
    "stone": "#A9A39A", "stone_mid": "#8A847C", "stone_light": "#C9C2B6", "stone_dark": "#6E6962",
    "thatch": "#D9A84E", "thatch_dark": "#B9823A", "roof": "#B5523B", "roof_dark": "#8E3E2E",
    "plaster": "#F2E3C6", "plaster_shade": "#E6CFA4",
    "glow": "#FFC861", "door": "#4F7A5A", "cloth": "#C8553D", "pip": "#6CC46A",
}


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
                              export_texcoords=False, export_materials="EXPORT",
                              export_vertex_color="ACTIVE")
    return path


def save_blend(name):
    os.makedirs(OUT_BLEND, exist_ok=True)
    path = os.path.join(OUT_BLEND, name + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=path, copy=True, compress=True)
    return path


# ---------------------------------------------------------------- baked ambient occlusion

def bake_ao(objs, samples=40, distance=1.0, floor=0.5, keep=("glow", "glass")):
    """Bake soft AO into a 'Col' corner colour attribute on each mesh (exported as COLOR_0).
    Only render-visible objects occlude, so hide what shouldn't count first."""
    sc = bpy.context.scene
    engine = sc.render.engine
    sc.render.engine = "CYCLES"
    sc.cycles.samples = samples
    try:
        sc.cycles.device = "CPU"
    except Exception:
        pass
    sc.world.light_settings.distance = distance
    meshes = [o for o in objs if o.type == "MESH"]
    for o in meshes:
        me = o.data
        for ca in list(me.color_attributes):
            me.color_attributes.remove(ca)
        ca = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
        me.color_attributes.active_color = ca
        try:
            me.color_attributes.render_color_index = 0
        except Exception:
            pass
    for o in bpy.data.objects:
        try:
            o.select_set(False)
        except Exception:
            pass
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    sc.render.bake.target = "VERTEX_COLORS"
    sc.render.bake.use_clear = True
    bpy.ops.object.bake(type="AO")
    for o in meshes:
        me = o.data
        ca = me.color_attributes["Col"]
        keep_idx = {i for i, m in enumerate(me.materials) if m and m.name in keep}
        corner_mat = [0] * len(me.loops)
        for p in me.polygons:
            for li in p.loop_indices:
                corner_mat[li] = p.material_index
        for li, d in enumerate(ca.data):
            v = 1.0 if corner_mat[li] in keep_idx else floor + (1 - floor) * d.color[0]
            d.color = (v, v, v, 1.0)
    sc.render.engine = engine


HORIZON = (0.70, 0.77, 0.88, 1.0)   # linear; preview sky horizon = fog colour
MIDSKY = (0.46, 0.62, 0.88, 1.0)
ZENITH = (0.22, 0.42, 0.80, 1.0)
SKY = {"horizon": HORIZON, "mid": MIDSKY, "zenith": ZENITH}
EVENING = {"horizon": (0.95, 0.62, 0.45, 1.0), "mid": (0.52, 0.42, 0.6, 1.0), "zenith": (0.12, 0.16, 0.36, 1.0)}


def add_fog(m, near=22.0, far=150.0):
    """Blend a material toward the horizon colour with camera distance (preview-only haze)."""
    nt = m.node_tree
    out = next((n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"), None)
    if out is None or not out.inputs["Surface"].is_linked or nt.nodes.get("fog_mix") or m.name.startswith("preview_cloud"):
        return
    src = out.inputs["Surface"].links[0].from_socket
    cam = nt.nodes.new("ShaderNodeCameraData")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.interpolation_type = "SMOOTHSTEP"
    mr.inputs["From Min"].default_value = near
    mr.inputs["From Max"].default_value = far
    mr.inputs["To Max"].default_value = 0.85
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = SKY["horizon"]
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.name = "fog_mix"
    nt.links.new(cam.outputs["View Distance"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], mix.inputs["Fac"])
    nt.links.new(src, mix.inputs[1])
    nt.links.new(em.outputs["Emission"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])


def preview_materials():
    """For preview renders only (after export): multiply the baked 'Col' attribute into the
    base colour, and add distance haze."""
    for m in bpy.data.materials:
        if not m.node_tree:
            continue
        nt = m.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        if bsdf is not None and not m.name.startswith("preview") and not bsdf.inputs["Base Color"].is_linked:
            attr = nt.nodes.new("ShaderNodeVertexColor")
            attr.layer_name = "Col"
            mix = nt.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            mix.inputs[6].default_value = bsdf.inputs["Base Color"].default_value
            nt.links.new(attr.outputs["Color"], mix.inputs[7])
            nt.links.new(mix.outputs[2], bsdf.inputs["Base Color"])
        add_fog(m)


# ---------------------------------------------------------------- preview rig (atmospheric)

SUN_ELEV = 34


def setup_render(res=(1280, 960)):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.eevee.taa_render_samples = 48
    for k, v in (("use_shadows", True), ("use_raytracing", True), ("use_fast_gi", True),
                 ("volumetric_end", 150.0), ("volumetric_tile_size", "4")):
        try:
            setattr(sc.eevee, k, v)
        except Exception:
            pass
    sc.view_settings.view_transform = "AgX"
    try:
        sc.view_settings.look = "AgX - Punchy"
    except Exception:
        pass
    sc.view_settings.exposure = 0.2


def world_sky(sun_azim=0, haze=None, sky=None):
    sc = bpy.context.scene
    w = sc.world or bpy.data.worlds.new("World")
    sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.02
    mr.inputs["From Max"].default_value = 0.45
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    sky = sky or SKY
    SKY.update(sky) if sky is not SKY else None
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, sky["horizon"]
    el[1].position, el[1].color = 1.0, sky["zenith"]
    mid = el.new(0.18)
    mid.color = sky["mid"]
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.3
    nt.links.new(bg.outputs["Background"], out.inputs["Surface"])


def hills(seed=5):
    """Preview-only distant hills that fade into the haze."""
    rnd = random.Random(seed)
    p = Part("preview_hills")
    for i in range(44):
        a = 2 * math.pi * i / 44 + rnd.uniform(-0.05, 0.05)
        d = rnd.uniform(80, 120)
        r = rnd.uniform(14, 28)
        p.add(jitter(bm_ico(1.0, 2), 0.08, i), rnd.choice(["grass_dark", "leaf_deep", "grass", "grass_dark"]),
              M((d * math.cos(a), d * math.sin(a), -r * 0.55), (0, 0, rnd.uniform(0, 90)),
                (r * 1.7, r, r * rnd.uniform(0.6, 1.0))), smooth=True)
    ob = p.to_object(coll("PREVIEW"))
    ca = ob.data.color_attributes.new("Col", "BYTE_COLOR", "POINT")
    for v, d in zip(ob.data.vertices, ca.data):
        k = 0.75 + 0.25 * min(max(v.co.z / 12.0, 0.0), 1.0)
        d.color = (k, k, k, 1.0)
    return ob


def meadow(radius, seed=3, fine=False):
    """Preview-only ground: a big meadow with painterly colour patches (vertex colours)."""
    rnd = random.Random(seed)
    bm = bmesh.new()
    step = 0.45 if fine else 1.0
    n = int(radius * 2 / step)
    bmesh.ops.create_grid(bm, x_segments=n, y_segments=n, size=radius)
    me = bpy.data.meshes.new("preview_ground")
    bm.to_mesh(me)
    bm.free()
    ca = me.color_attributes.new("Col", "BYTE_COLOR", "POINT")
    scale = 0.3 if fine else 1.0
    cols = [hex_rgba(PALETTE[k]) for k in ("grass_light", "grass_dark", "grass_light", "leaf_deep")]
    blobs = [(rnd.uniform(-radius, radius), rnd.uniform(-radius, radius), rnd.uniform(2, 7) * scale, rnd.choice(cols),
              rnd.uniform(0.3, 0.6)) for _ in range(int(radius * 2.5))]
    base = hex_rgba(PALETTE["grass"])
    for v, d in zip(me.vertices, ca.data):
        x, y = v.co.x, v.co.y
        c = list(base[:3])
        for bx, by, br, bc, strength in blobs:
            dd = math.hypot(x - bx, y - by) / br
            if dd < 1:
                f = (1 - dd) ** 2 * strength
                c = [c[i] * (1 - f) + bc[i] * f for i in range(3)]
        d.color = (c[0], c[1], c[2], 1)
    m = bpy.data.materials.get("preview_ground") or bpy.data.materials.new("preview_ground")
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if not bsdf.inputs["Base Color"].is_linked:
        attr = nt.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "Col"
        nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.95
    bsdf.inputs["Specular IOR Level"].default_value = 0.1
    me.materials.append(m)
    ob = bpy.data.objects.new("preview_ground", me)
    coll("PREVIEW").objects.link(ob)
    return ob


def clouds(seed=8, n=9):
    """Preview-only soft cloud banks far away (unfogged, softly self-lit)."""
    rnd = random.Random(seed)
    m = bpy.data.materials.get("preview_cloud") or bpy.data.materials.new("preview_cloud")
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (1.0, 0.98, 0.95, 1)
    b.inputs["Roughness"].default_value = 1.0
    b.inputs["Emission Color"].default_value = (0.85, 0.88, 0.95, 1)
    b.inputs["Emission Strength"].default_value = 0.55
    p = Part("preview_clouds")
    for i in range(n):
        a = math.radians(rnd.uniform(20, 160))
        d = rnd.uniform(220, 300)
        cx, cy, cz = d * math.cos(a), d * math.sin(a), rnd.uniform(45, 85)
        w = rnd.uniform(25, 45)
        for k in range(rnd.randint(4, 7)):
            r = w * rnd.uniform(0.25, 0.42)
            p.add(bm_ico(r, 3), "white", M((cx + rnd.uniform(-w, w) * 0.7, cy + rnd.uniform(-6, 6), cz + rnd.uniform(-2, 6)),
                                            scale=(1.4, 1.0, 0.6)), smooth=True)
    ob = p.to_object(coll("PREVIEW"))
    ob.data.materials[0] = m
    return ob


def preview_rig(targets, ground_r=None, azim=-32, elev=24, lens=50, margin=1.08, ground=True,
                ground_mat="grass", look_z_bias=0.0, sun_azim=35, min_radius=0.0, haze=0.004):
    """Camera + warm sun + sky + meadow framed on `targets`. Returns the camera."""
    pc = coll("PREVIEW")
    for o in list(pc.objects):
        if o.name not in ("preview_ground", "preview_hills", "preview_clouds"):
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
    if ground and "preview_ground" not in pc.objects:
        meadow(70) if radius > 1.5 else meadow(40, fine=True)
        hills()
        clouds()
    world_sky(sun_azim)
    cam_d = bpy.data.cameras.new("preview_cam")
    cam_d.lens = lens
    cam = bpy.data.objects.new("preview_cam", cam_d)
    pc.objects.link(cam)
    fov = 2 * math.atan(cam_d.sensor_width / 2 / lens)
    sc = bpy.context.scene
    aspect = sc.render.resolution_y / sc.render.resolution_x
    fov_min = 2 * math.atan(math.tan(fov / 2) * min(1.0, aspect))
    dist = radius * margin / math.sin(fov_min / 2)
    a, e = math.radians(azim), math.radians(elev)
    direction = Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))
    cam.location = centre + direction * dist
    cam.rotation_euler = (-direction).to_track_quat("-Z", "Y").to_euler()
    cam_d.clip_start = 0.05
    cam_d.clip_end = 500
    sc.camera = cam
    sun_d = bpy.data.lights.new("preview_sun", "SUN")
    sun_d.energy = 5.0
    sun_d.color = (1.0, 0.88, 0.72)
    sun_d.angle = math.radians(3)
    sun = bpy.data.objects.new("preview_sun", sun_d)
    sun.rotation_euler = (math.radians(90 - SUN_ELEV), 0, math.radians(sun_azim))
    pc.objects.link(sun)
    return cam


def render(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def height_tint(ob, z0, z1, low=0.72, high=1.0):
    """Multiply the baked 'Col' by a bottom-to-top gradient (darker underside, sunlit top)."""
    me = ob.data
    ca = me.color_attributes.get("Col")
    mw = ob.matrix_world
    for li, d in enumerate(ca.data):
        z = (mw @ me.vertices[me.loops[li].vertex_index].co).z
        t = min(max((z - z0) / max(z1 - z0, 1e-6), 0.0), 1.0)
        k = low + (high - low) * t
        c = d.color
        d.color = (c[0] * k, c[1] * k, c[2] * k, 1.0)


def finish(name, objs, tint=None, res=(1000, 1000), **rig):
    """Standard pipeline for a single model: bake AO, export .glb, render preview, save .blend.
    `tint(objs)` runs after the bake (for gradients). Returns triangle counts."""
    bpy.context.view_layer.update()     # children need fresh world matrices for framing
    setup_render(res)
    preview_rig(objs, **rig)
    bake_ao(objs)
    if tint:
        tint(objs)
    export(name + ".glb", objs)
    preview_materials()
    render(os.path.join(OUT_PREV, name + ".png"))
    save_blend(name)
    return {"tris": tris(objs)}
