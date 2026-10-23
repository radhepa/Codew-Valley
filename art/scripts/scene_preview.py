"""Preview-only showcase: imports the exported public/models/*.glb (so it also checks the
exports load with the right names and orientation) and lays out a little village meadow
in the atmospheric look. Renders art/previews/village_scene.png (+ _evening variant).
Nothing here is exported to the game.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
import bpy
from mathutils import Vector

MODELS = ["tavern", "tree_oak", "tree_pine", "tree_stump", "rock_large", "rock_small", "bush", "flowers",
          "grass_tuft", "fence", "log_pile", "stone_pile", "rune_stone", "signpost", "lantern_post",
          "player", "innkeeper", "pip"]


def load_library():
    lib = bpy.data.collections.new("LIB")
    bpy.context.scene.collection.children.link(lib)
    roots = {}
    for name in MODELS:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(common.OUT_MODELS, name + ".glb"))
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
            lib.objects.link(o)
        roots[name] = [o for o in new if o.parent is None]
    lib.hide_render = True
    bpy.context.view_layer.layer_collection.children["LIB"].exclude = True
    return roots


def place(roots, loc, rz=0.0, s=1.0, target=None):
    target = target or common.coll("MODEL")
    out = []

    def dup(o, parent):
        c = o.copy()            # linked duplicate: shares mesh data
        target.objects.link(c)
        c.parent = parent
        if parent is None:
            c.location = Vector(loc) + o.location
            c.rotation_euler = (o.rotation_euler.x, o.rotation_euler.y, o.rotation_euler.z + math.radians(rz))
            c.scale = (s, s, s)
        out.append(c)
        for ch in o.children:
            dup(ch, c)
    for r in roots:
        dup(r, None)
    return out


def blocked(x, y):
    if -5.6 < x < 6.2 and 1.3 < y < 10.8:          # tavern + yard
        return True
    if abs(x - 0.4) < 1.0 and -9 < y < 2:          # a trodden path to the door
        return True
    return False


def build(evening=False):
    common.reset()
    common.setup_render((1600, 900))
    common.meadow(70)
    common.hills()
    common.clouds()
    common.world_sky(sky=common.EVENING if evening else dict(horizon=common.HORIZON, mid=common.MIDSKY, zenith=common.ZENITH))
    roots = load_library()
    rnd = random.Random(2026)
    place(roots["tavern"], (0, 6, 0))
    place(roots["innkeeper"], (1.6, 2.1, 0), rz=-15)
    place(roots["player"], (-0.6, -5.2, 0), rz=200)
    place(roots["pip"], (0.5, -4.7, 0), rz=150)
    for (x, y, rz, s) in [(-13, 9, 0, 1.0), (12, 15, 40, 1.15), (-8, 21, 80, 0.95), (17, 3, 120, 1.05),
                          (-20, -4, 10, 1.1), (22, -10, 60, 0.9)]:
        place(roots["tree_oak"], (x, y, 0), rz, s)
    for (x, y, rz, s) in [(-18, 17, 0, 1.1), (-23, 7, 30, 1.25), (15, 26, 50, 1.0), (24, 17, 70, 1.2),
                          (7, 30, 10, 1.3), (-4, 32, 40, 1.15), (28, 4, 20, 1.0), (-28, 22, 0, 1.3)]:
        place(roots["tree_pine"], (x, y, 0), rz, s)
    place(roots["tree_stump"], (-9.5, 3.5, 0), 30)
    place(roots["rock_large"], (9.5, -3.0, 0), 210)
    place(roots["rock_large"], (-15, 1.5, 0), 40, 0.8)
    for (x, y) in [(6.2, -6.5), (-6.5, -8.5), (11, 6), (-3.5, 13)]:
        place(roots["rock_small"], (x, y, 0), rnd.uniform(0, 360))
    for i, x in enumerate((3.4, 5.5, 7.6, 9.7)):
        place(roots["fence"], (x, -0.4 + 0.08 * i, 0), rnd.uniform(-4, 4))
    place(roots["log_pile"], (7.6, 5.0, 0), 90)
    place(roots["stone_pile"], (-7.0, 4.5, 0), 20)
    place(roots["signpost"], (-1.9, -3.4, 0), 10)
    place(roots["lantern_post"], (1.9, -2.6, 0), 180)
    place(roots["rune_stone"], (-7.5, -6.0, 0), 25)
    for (x, y) in [(-6.5, 1.0), (6.8, 1.8), (-11.5, -2.0), (13, -5), (-4, 9.8)]:
        place(roots["bush"], (x, y, 0), rnd.uniform(0, 360), rnd.uniform(0.85, 1.2))
    # pink flower fields in a few soft patches, grass everywhere else
    patches = [(-5.0, -10.0, 3.5), (8.5, -9.0, 3.0), (-12.0, 4.0, 3.0), (11.0, 9.0, 2.5), (-2.0, 17.0, 4.0)]
    n = 0
    for cx, cy, r in patches:
        for _ in range(int(r * r * 10)):
            a, d = rnd.uniform(0, 2 * math.pi), r * math.sqrt(rnd.random())
            x, y = cx + d * math.cos(a), cy + d * math.sin(a)
            if not blocked(x, y):
                place(roots["flowers"], (x, y, 0), rnd.uniform(0, 360), rnd.uniform(1.0, 1.6))
                n += 1
    g = 0
    for _ in range(1400):
        x, y = rnd.uniform(-26, 26), rnd.uniform(-14, 30)
        if blocked(x, y) or (x + 1) ** 2 + (y + 16) ** 2 < 4:
            continue
        place(roots["grass_tuft"], (x, y, 0), rnd.uniform(0, 360), rnd.uniform(0.75, 1.4))
        g += 1
    common.preview_materials()
    # camera low in the grass, looking up the path at the tavern
    cam_d = bpy.data.cameras.new("cam")
    cam_d.lens = 32
    cam_d.clip_end = 500
    cam = bpy.data.objects.new("cam", cam_d)
    common.coll("PREVIEW").objects.link(cam)
    cam.location = (-5.5, -15.5, 2.1)
    d = Vector((0.8, 5.0, 3.0)) - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    sun_d = bpy.data.lights.new("sun", "SUN")
    sun_d.angle = math.radians(3)
    sun = bpy.data.objects.new("sun", sun_d)
    common.coll("PREVIEW").objects.link(sun)
    if evening:
        sun_d.energy, sun_d.color = 2.6, (1.0, 0.7, 0.45)
        sun.rotation_euler = (math.radians(90 - 9), 0, math.radians(-60))
    else:
        sun_d.energy, sun_d.color = 5.0, (1.0, 0.88, 0.72)
        sun.rotation_euler = (math.radians(90 - common.SUN_ELEV), 0, math.radians(40))
    return {"flowers": n, "grass": g}


def main():
    info = build()
    common.render(os.path.join(common.OUT_PREV, "village_scene.png"))
    build(evening=True)
    for m in bpy.data.materials:            # lanterns and runes light up in the evening
        if m.name.startswith("glow"):
            b = m.node_tree.nodes.get("Principled BSDF")
            b.inputs["Emission Strength"].default_value = 8.0
    bpy.context.scene.view_settings.exposure = 0.6
    common.render(os.path.join(common.OUT_PREV, "village_scene_evening.png"))
    return info


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
