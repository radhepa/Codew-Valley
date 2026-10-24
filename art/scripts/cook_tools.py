"""The cook's hand tools for the player: a wooden spoon (stirring, tasting), a kitchen knife
(chopping over the pot), a cast-iron skillet (frying) and a baker's peel (Hazel's oven).

Tool format (tools_common.py / src/game/anim.ts registerTool): one object per file, origin at the
centre of the fist grip, the handle running up +Z. The working side faces -Y: the knife's edge,
and the underside of the spoon bowl, the skillet and the peel (held out in front, -Y is down, so
the skillet's cooking side and the peel's top face +Y).
Exports public/models/cook_spoon.glb, cook_knife.glb, cook_pan.glb, cook_peel.glb and one preview."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import cook_common as cc
importlib.reload(cc)
from cook_common import common, vc, Part, M, bm_box, bm_cyl, bm_tube, jitter, lathe, ring_pts, frame
import tools_common as tc
from tools_common import pillow, smooth_outline
cc.apply()
import bpy, bmesh
from mathutils import Vector, Matrix


def spoon():
    p = Part("cook_spoon")
    # a long beech spoon: slightly flattened handle widening into a deep oval bowl
    path = [Vector((0, 0.004 * math.sin(math.pi * k / 20), -0.08 + 0.48 * k / 20)) for k in range(21)]
    rs = [0.015 + 0.004 * (k / 20) ** 2 for k in range(21)]
    bm = bm_tube(path, rs, 14)
    for v in bm.verts:
        v.co.y *= 0.72
    p.add(bm, "wood_light", smooth=True)
    p.add(cc.sphere(16, 10), "wood_light", M(path[0], scale=(0.016, 0.012, 0.012)), smooth=True)
    # the bowl: an oval dish, hollow toward +Y
    c = Vector((0, 0.0, 0.47))
    outline = smooth_outline([(-0.045, -0.06), (0.0, -0.075), (0.045, -0.06), (0.05, 0.0), (0.04, 0.045), (0.0, 0.07), (-0.04, 0.045), (-0.05, 0.0)], 4)
    bm = pillow([(u, v) for u, v in outline], lambda u, v: 0.016, 6, power=0.6)
    # pillow is thick along X with the outline in YZ: turn it so it's thick along Y, and dish it
    rot = Matrix.Rotation(math.radians(90), 4, "Z")
    for v in bm.verts:
        v.co = rot @ v.co
        r2 = (v.co.x / 0.05) ** 2 + (v.co.z / 0.075) ** 2
        v.co.y += 0.022 * (1 - min(1, r2))     # dished toward +Y
    p.add(bm, "wood_light", Matrix.Translation(c), smooth=True)
    p.add(cc.sphere(18, 10), "board_dark", M(c + Vector((0, 0.012, 0)), scale=(0.036, 0.004, 0.055)), smooth=True)
    # a dark band where it's been in a hundred stews
    p.add(bm_tube(ring_pts(frame((0, 0, 0.39), (0, 0, 1)), 0.0195, 16), 0.0035, 5, cap=False), "board_dark", smooth=True)
    return p


def knife():
    p = Part("cook_knife")
    # walnut handle with brass rivets
    bm = bm_box(0.03, 0.04, 0.15, bevel=0.012, segs=3)
    p.add(bm, "wood_mid", M((0, 0, 0.0)), smooth=True)
    for z in (-0.04, 0.03):
        for s in (-1, 1):
            p.add(cc.sphere(10, 6), "brass", M((s * 0.016, 0, z), scale=0.005), smooth=True)
    p.add(bm_box(0.034, 0.05, 0.016, bevel=0.005), "brass", M((0, -0.002, 0.082)), smooth=True)
    # blade: a broad cook's blade, edge toward -Y, spine at +Y, tip curving to the edge
    outline = [(0.016, 0.09), (0.018, 0.2), (0.016, 0.28), (0.006, 0.33), (-0.012, 0.35), (-0.03, 0.33), (-0.04, 0.26), (-0.042, 0.15), (-0.036, 0.09)]
    sm = smooth_outline(outline, 4)

    def half(u, v):
        t = min(1.0, max(0.0, (u + 0.042) / 0.058))
        return 0.0012 + 0.0042 * t
    p.add(pillow(sm, half, 6, power=0.7), "steel", smooth=True)
    edge = [Vector((0, u * 1.0 - 0.0005, v)) for u, v in sm if u < -0.025]
    edge.sort(key=lambda q: q.z)
    p.add(bm_tube(edge, 0.0012, 4), "steel_bright" if "steel_bright" in common.PALETTE else "steel", smooth=True)
    return p


def pan():
    p = Part("cook_pan")
    # handle: wooden grip on an iron shank
    p.add(bm_tube([(0, 0, -0.075), (0, 0, 0.08)], [0.017, 0.019], 12), "wood_mid", smooth=True)
    p.add(cc.sphere(12, 8), "wood_mid", M((0, 0, -0.075), scale=0.017), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation((0, 0, 0.083)), 0.02, 14), 0.004, 4, cap=False), "iron", smooth=True)
    p.add(bm_tube([(0, 0, 0.08), (0, 0.005, 0.2), (0, 0.025, 0.25)], [0.011, 0.011, 0.014], 8), "iron_pot", smooth=True)
    # the skillet: open toward +Y, rim round its edge, a pouring lip
    c = Vector((0, 0.0, 0.39))
    r = 0.14
    prof = [(0.0001, -0.0), (r * 0.9, 0.0), (r, 0.012), (r * 1.06, 0.045), (r * 1.08, 0.05), (r * 1.02, 0.05), (r * 0.96, 0.012), (r * 0.86, 0.008), (0.0001, 0.008)]
    m = Matrix.Translation(c + Vector((0, -0.01, 0))) @ Matrix.Rotation(math.radians(-90), 4, "X")
    p.add(lathe(prof, 30), "iron_pot", m, smooth=True)
    # a little oil sheen in the middle
    p.add(bm_cyl(r * 0.7, r * 0.7, 0.002, 24), "oil", m @ Matrix.Translation((0, 0, 0.009)))
    return p


def peel():
    p = Part("cook_peel")
    # long ash handle
    p.add(bm_tube([(0, 0, -0.1), (0, 0, 0.48)], [0.016, 0.014], 12), "ash" if "ash" in common.PALETTE else "wood_light", smooth=True)
    p.add(cc.sphere(12, 8), "wood_light", M((0, 0, -0.1), scale=0.018), smooth=True)
    # the blade: a thin board, wide and rounded at the far end, thin along Y
    out = smooth_outline([(-0.035, 0.46), (0.035, 0.46), (0.12, 0.54), (0.13, 0.7), (0.1, 0.78), (0.0, 0.8), (-0.1, 0.78), (-0.13, 0.7), (-0.12, 0.54)], 4)
    bm = pillow([(u, v) for u, v in out], lambda u, v: 0.008, 4, power=0.4)
    rot = Matrix.Rotation(math.radians(90), 4, "Z")
    for v in bm.verts:
        v.co = rot @ v.co
    p.add(bm, "wood_light", smooth=True)
    p.add(bm_tube([(-0.09, 0.0085, 0.62), (0.09, 0.0085, 0.62)], 0.002, 4), "board_dark", smooth=True)
    # a dusting of flour on top
    for i, (x, z, s) in enumerate(((-0.03, 0.66, 0.03), (0.04, 0.71, 0.025), (0.0, 0.6, 0.02))):
        p.add(cc.sphere(10, 6), "flour", M((x, 0.008, z), scale=(s, 0.002, s * 0.8)), smooth=True)
    return p


def main():
    vc.palette({"steel_bright": "#DCE2E6", "ash": "#C99A62"})
    results = {}
    built = []
    for fn in (spoon, knife, pan, peel):
        common.reset()
        part = fn()
        name = part.name
        coll = common.coll("MODEL")
        ob = part.to_object(coll, sharp_angle=80)
        tris = cc.bake_export(name, [ob])
        results[name] = tris
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(common.OUT_BLEND, name + ".blend"), copy=True, compress=True)
        built.append(name)
    # one preview: all four from their .glb files, side by side
    common.reset()
    objs = []
    for i, name in enumerate(built):
        bpy.ops.import_scene.gltf(filepath=os.path.join(common.OUT_MODELS, name + ".glb"))
        for o in bpy.context.selected_objects:
            o.location = Vector((-0.45 + 0.3 * i, 0, 0.5))
            o.rotation_euler = (0, 0, 0)
            bpy.context.view_layer.update()
            objs.append(o)
    common.setup_render((1200, 800))
    common.preview_rig(objs, azim=-30, elev=12, lens=60, margin=1.1)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, "cook_tools.png"))
    print("TOOLS", results)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    main()
