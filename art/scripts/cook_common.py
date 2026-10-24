"""Shared kit for the cooking models (cook_hearth.py, cook_dishes.py, cook_tools.py): the kitchen
palette, a few shape helpers and the bake/export/preview pipeline for a prop.

Same look as the rest of the valley (ART.md, art/README.md): muted natural colours, chunky soft
shapes, ambient occlusion baked into vertex colours. Materials whose names start with `glow` are
made emissive by the game (src/game/models.ts)."""
import sys, os, math, importlib, random

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
import bpy, bmesh
from common import Part, M, bm_box, bm_cyl, bm_ico, bm_tube, bm_lathe, jitter
from villagers_common import sphere, lathe, ring_pts, bezier, frame, S
from mathutils import Vector, Matrix

KITCHEN = {
    # fire and hearth
    "ash": "#5F5853", "ash_light": "#857C72", "char": "#2E2926", "bark": "#5A4131", "bark_light": "#74563F",
    "log_end": "#C8A677", "iron_pot": "#3A383B", "iron_warm": "#4A403A", "rust": "#7A4E36",
    "glow_fire": "#FF9440", "glow_flame": "#FFD36A", "glow_ember": "#FF6526",
    # the soup in the pot (the game recolours it per dish)
    "soup": "#B86E3A",
    # crockery and the pantry
    "glaze": "#EDE3CF", "glaze_shade": "#D9CCB2", "glaze_blue": "#587A96", "glaze_green": "#6F8B66",
    "crock": "#C2AE8E", "crock_dark": "#9C8768", "cork": "#B68C5C", "bottle": "#86A274", "oil": "#D9B54A",
    "salt": "#F2EEE6", "sugar": "#F7F2E8", "board": "#C9A06A", "board_dark": "#A07C4E", "twine": "#C9B48A",
    "rope": "#A88F68", "sackcloth": "#CDB991", "water": "#7FA1AC",
    # food
    "carrot": "#D6762F", "carrot_top": "#6E9246", "potato": "#BC9866", "potato_in": "#E9D7A4",
    "garlic": "#EFE8D8", "garlic_pink": "#D8B4AE", "garlic_skin": "#E2D5BE", "herb": "#6E9145", "herb_dark": "#4E7236",
    "cabbage": "#8DB061", "cabbage_light": "#B9CF87", "pumpkin": "#D8822F", "pumpkin_dark": "#B7652A",
    "strawberry": "#C93B3A", "strawberry_glaze": "#E05A4E", "seed": "#F0D98A", "leafy": "#5E8E43",
    "cream": "#F3EBD9", "stew": "#8E4A2C", "stew_light": "#A65E36", "soup_carrot": "#D9792F",
    "soup_pumpkin": "#E3962F", "chowder": "#E9DCC0", "broth_red": "#B5543A", "crayfish": "#C2492F",
    "crayfish_dark": "#8E3424", "tea": "#C9A13E", "tea_dark": "#A7832C", "chamomile": "#F4F0E4",
    "chamomile_eye": "#E8B93A", "mint": "#5FA477", "mint_light": "#BFE3C6", "tin": "#9CA6AE", "tin_dark": "#6F7A82",
    "trout": "#9C7A52", "trout_belly": "#E3CFA6", "trout_spot": "#5B4433", "grill_mark": "#4A2E20",
    "crust": "#C88A44", "crust_dark": "#A0652E", "crust_light": "#E2B66C", "crumb": "#F1DFB6", "butter": "#F2D879",
    "pastry": "#D9A458", "pie_dish": "#B9643F", "fish_flake": "#F1E6D2", "potato_cake": "#D4A04A", "potato_cake_dark": "#A9742F",
}
METALS = dict({"iron_pot": (0.55, 0.5), "iron_warm": (0.5, 0.55), "tin": (0.7, 0.35), "tin_dark": (0.6, 0.45)})
GLOSSES = dict({"glaze": 0.35, "glaze_blue": 0.35, "glaze_green": 0.35, "glaze_shade": 0.4, "strawberry_glaze": 0.25,
                  "soup": 0.3, "stew": 0.35, "soup_carrot": 0.35, "soup_pumpkin": 0.35, "chowder": 0.4, "broth_red": 0.3,
                  "tea": 0.15, "bottle": 0.2, "oil": 0.2, "water": 0.15, "butter": 0.4, "mint": 0.25, "mint_light": 0.25})


def apply():
    """Register the kitchen colours (again: tools_common reloads common, which resets the palette)."""
    vc.palette(KITCHEN, metal=METALS, gloss=GLOSSES)


apply()

GLOWS = ("glow", "glow_fire", "glow_flame", "glow_ember")


def rock(p, loc, size, seed, mat="stone", rot=(0, 0, 0), flat=0.7, rough=0.16):
    """A chunky fieldstone: a jittered icosphere, flattened."""
    sx, sy, sz = size if isinstance(size, (tuple, list)) else (size, size, size * flat)
    p.add(jitter(bm_ico(1.0, 2), rough, seed), mat, M(loc, rot, (sx, sy, sz)), smooth=False)


def log(p, a, b, r, bark="bark", end="log_end", segs=9, charred=False):
    """A round log from a to b with end grain caps (charred ends if it's in the fire)."""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    p.add(bm_tube([a, b], r, segs, cap=False), bark, smooth=True)
    for q, s in ((a, -1), (b, 1)):
        m = frame(q, d * s)
        p.add(bm_cyl(r * 0.98, r * 0.98, 0.006, segs), "char" if charred else end, m)
        if not charred:
            p.add(bm_tube(ring_pts(m @ Matrix.Translation((0, 0, 0.004)), r * 0.55, segs), 0.004, 4), "bark_light", smooth=True)


def flame(p, base, h, w, mat, lean=(0, 0)):
    """A soft teardrop flame standing on base, h tall and w wide, leaning by (dx, dy) at the tip."""
    prof = [(0.0001, 0), (0.55, 0.08), (0.95, 0.24), (0.9, 0.42), (0.62, 0.62), (0.32, 0.82), (0.0001, 1.0)]
    bm = lathe([(r * w, z * h) for r, z in prof], 10)
    for v in bm.verts:
        k = (v.co.z / h) ** 2
        v.co.x += lean[0] * k
        v.co.y += lean[1] * k
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    p.add(bm, mat, Matrix.Translation(base), smooth=True)


def bowl(p, c, r, h, mat="glaze", inner="glaze_shade", band="glaze_blue", fill=None, fill_mat=None, segs=28):
    """A soft glazed bowl with its base at c: outside up, round lip, inside down to the fill level.
    fill (0..1) puts a flat surface of fill_mat that high inside; returns that surface's centre."""
    cx, cy, cz = c
    prof = [(r * 0.42, 0.0), (r * 0.5, 0.0), (r * 0.52, h * 0.06), (r * 0.78, h * 0.25), (r * 0.95, h * 0.62),
            (r * 1.0, h * 0.93), (r * 0.985, h * 1.01), (r * 0.94, h * 0.98), (r * 0.9, h * 0.8), (r * 0.72, h * 0.42), (r * 0.4, h * 0.18), (0.0001, h * 0.16)]
    p.add(lathe(prof, segs), mat, Matrix.Translation(c), smooth=True)
    if band:
        p.add(bm_tube(ring_pts(Matrix.Translation((cx, cy, cz + h * 0.8)), r * 0.985, segs), 0.006 * r / 0.12, 5, cap=False), band, smooth=True)
    p.add(bm_cyl(r * 0.47, r * 0.47, 0.004, segs), inner, Matrix.Translation((cx, cy, cz - 0.002)))
    if fill is not None:
        z = cz + h * fill
        # radius of the inside wall at that height
        rr = r * (0.72 + (0.9 - 0.72) * min(1, max(0, (fill - 0.42) / (0.8 - 0.42))))
        p.add(bm_cyl(rr, rr, 0.006, segs), fill_mat, Matrix.Translation((cx, cy, z - 0.006)), smooth=True)
        return Vector((cx, cy, z))
    return None


def plate(p, c, r, mat="glaze", band="glaze_blue", segs=32):
    """A shallow plate with its base at c; returns the centre of its top."""
    cx, cy, cz = c
    prof = [(r * 0.5, 0.0), (r * 0.56, 0.0), (r * 0.6, r * 0.04), (r * 0.62, r * 0.05), (r * 0.98, r * 0.12),
            (r * 1.0, r * 0.145), (r * 0.96, r * 0.15), (r * 0.62, r * 0.075), (0.0001, r * 0.07)]
    p.add(lathe(prof, segs), mat, Matrix.Translation(c), smooth=True)
    if band:
        p.add(bm_tube(ring_pts(Matrix.Translation((cx, cy, cz + r * 0.125)), r * 0.86, segs), 0.0045 * r / 0.16, 5, cap=False), band, smooth=True)
    return Vector((cx, cy, cz + r * 0.075))


def bake_export(name, objs, keep=GLOWS):
    """Bake AO into every mesh, then export public/models/<name>.glb (glow materials stay bright)."""
    meshes = [o for o in objs if o.type == "MESH"]
    vc.tune_materials()
    bpy.context.view_layer.update()
    common.setup_render((1000, 1000))
    common.bake_ao(meshes, keep=keep)
    for m in bpy.data.materials:
        if m.name.startswith("glow") and m.node_tree:
            b = m.node_tree.nodes.get("Principled BSDF")
            b.inputs["Emission Color"].default_value = b.inputs["Base Color"].default_value
            b.inputs["Emission Strength"].default_value = 2.0
    common.export(name + ".glb", objs)
    return common.tris(meshes)


def preview(name, objs, suffix="", **rig):
    """Render art/previews/<name><suffix>.png over the meadow."""
    common.preview_rig([o for o in objs if o.type == "MESH"], **rig)
    if not getattr(preview, "done", False):
        common.preview_materials()
        preview.done = True
    return common.render(os.path.join(common.OUT_PREV, name + suffix + ".png"))
