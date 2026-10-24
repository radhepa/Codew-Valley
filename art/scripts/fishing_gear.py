"""Fishing gear (src/life/fishing), soft rounded style with the valley's muted palette.

public/models/fishing_rod.glb  Gran's old split-cane rod, the hand tool "fishing_rod" (anim.ts registerTool).
    `fishing_rod`      butt, cork grip with Gran's cloth repair and a lucky red wool knot, a walnut
                       centrepin reel with brass rims, the lower cane section and its guides.
                       Origin at the fist grip; the rod runs up +Z, the reel and guides hang on -Y.
    `fishing_rod_tip`  the upper cane section, origin (pivot) on the ferrule. The game bends the rod
                       by turning it about its local X axis (+ bends the tip toward -Y, the line side).
                       It kinks a touch to the left (+X): "casts a bit to the left. So did she."
    `fishing_rod_end`  empty at the tip-top ring, where the game ties the line.
public/models/fishing_bits.glb  `float` (origin on the waterline), `ripple` (unit ring, radius 1),
    `splash` (a crown of droplets, radius about 0.14) and `drop` (one droplet).
"""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import fishing_kit as fk
importlib.reload(fk)
from fishing_kit import common, vc, Part, M, bm_box, bm_cyl, bm_tube, S, sphere, lathe, ring_pts, frame, lerp_keys
import bpy, bmesh
from mathutils import Vector, Matrix

vc.palette({
    "cane": "#C99A5A", "cane_node": "#9C7240", "cane_dark": "#7E5A33",
    "cork": "#C8A577", "cork_dark": "#A7845A", "walnut": "#6B4630", "walnut_dark": "#4B3122",
    "silk_green": "#4E7A5E", "wool_red": "#B4483A", "cloth_teal": "#5E8C8A", "cloth_teal_dark": "#456B69",
    "line": "#E4E0CF", "nickel": "#B9BCB6",
    "float_red": "#C8473A", "float_cream": "#EFE6D2", "quill": "#E8DCC0",
    "foam": "#F2F6F4", "foam_blue": "#CFE3E6",
}, metal={"nickel": (0.8, 0.28)}, gloss={"float_red": 0.3, "float_cream": 0.35, "walnut": 0.45, "cane": 0.45, "foam": 0.2, "foam_blue": 0.2})

ROD_L = 1.25
JOINT = 0.68
R0, R1 = 0.0145, 0.0048     # cane radius at the reel seat and at the tip


def rad(z):
    t = (z - 0.26) / (ROD_L - 0.26)
    return R0 + (R1 - R0) * max(0.0, min(1.0, t)) ** 0.9


def axis(z):
    """Point on the rod's centre line: straight to the joint, then the gentle left kink (+X)."""
    t = max(0.0, (z - JOINT) / (ROD_L - JOINT))
    return Vector((0.028 * t * t, 0.0, z))


def fr(z):
    return frame(axis(z), axis(z + 0.005) - axis(z - 0.005))


def cane(p, z0, z1):
    """Hexagonal split cane between z0 and z1, with darker nodes every so often."""
    zs = [z0 + (z1 - z0) * k / 24 for k in range(25)]
    p.add(bm_tube([axis(z) for z in zs], [rad(z) for z in zs], 6), "cane", smooth=False)
    z = z0 + 0.09
    while z < z1 - 0.05:
        r = rad(z) * 1.08
        p.add(lathe([(r * 0.96, -0.004), (r, 0.0), (r * 0.96, 0.004)], 6), "cane_node", fr(z), smooth=False)
        z += 0.19


def guide(p, z, rings):
    """A snake guide on the -Y side bound with green silk."""
    f = fr(z)
    r = rad(z)
    p.add(lathe([(r + 0.0013, -0.012), (r + 0.0016, 0.0), (r + 0.0013, 0.012)], 12), "silk_green", f, smooth=True)
    c = f @ Vector((0, -(r + 0.009), 0))
    p.add(bm_tube([f @ Vector((0, -r, -0.007)), f @ Vector((0, -(r + 0.006), -0.002)), c], 0.0012, 5), "nickel", smooth=True)
    p.add(bm_tube(ring_pts(frame(c, f.to_3x3() @ Vector((0, 0, 1))), 0.0042, 12), 0.0012, 4, cap=False), "nickel", smooth=True)
    rings.append(c)


def rod_base():
    p = Part("fishing_rod")
    m = Matrix()
    # walnut butt cap and the cork grip, a little swollen under the fist
    p.add(lathe([(0.004, -0.122), (0.017, -0.12), (0.024, -0.112), (0.025, -0.1), (0.022, -0.09)], 24, cap_bottom=True), "walnut", m, smooth=True)
    grip = [(0.021, -0.09), (0.024, -0.075), (0.0262, -0.03), (0.0258, 0.04), (0.0235, 0.1), (0.0195, 0.15), (0.017, 0.165)]
    p.add(lathe(grip, 28), "cork", m, smooth=True)
    for z in (-0.06, -0.01, 0.07, 0.125):
        r = lerp_keys([(g[1], g[0]) for g in grip], z) + 0.0004
        p.add(lathe([(r, -0.0025), (r, 0.0025)], 28), "cork_dark", Matrix.Translation((0, 0, z)), smooth=True)
    # Gran's repair: a faded teal cloth bound round the top of the grip, its ends knotted
    p.add(lathe([(0.0262, 0.098), (0.0272, 0.104), (0.0268, 0.13), (0.0236, 0.136)], 28), "cloth_teal", m, smooth=True)
    for zc in (0.101, 0.132):
        p.add(bm_tube(ring_pts(Matrix.Translation((0, 0, zc)), 0.0263 if zc < 0.12 else 0.0245, 28), 0.0012, 5, cap=False), "cloth_teal_dark", smooth=True)
    knot = Vector((0.026, -0.006, 0.118))
    p.add(sphere(12, 8), "cloth_teal_dark", Matrix.Translation(knot) @ S(0.006, 0.005, 0.006), smooth=True)
    for d in ((0.012, -0.004, -0.026), (0.009, 0.005, -0.03)):
        p.add(bm_tube([knot, knot + Vector(d) * 0.5 + Vector((0.003, 0, 0)), knot + Vector(d)], [0.0034, 0.0026, 0.0018], 6), "cloth_teal", smooth=True)
    # brass winding check and the walnut reel seat with two brass bands
    p.add(lathe([(0.017, 0.164), (0.019, 0.168), (0.019, 0.176), (0.016, 0.18)], 24), "brass", m, smooth=True)
    p.add(lathe([(0.0165, 0.18), (0.0168, 0.2), (0.0165, 0.262)], 24), "walnut", m, smooth=True)
    for z in (0.186, 0.256):
        p.add(lathe([(0.0175, z - 0.005), (0.0182, z), (0.0175, z + 0.005)], 24), "brass", m, smooth=True)
    # the centrepin reel under the seat: a brass foot, a walnut drum with brass rims, line, two knobs
    p.add(bm_box(0.012, 0.016, 0.06, bevel=0.004, segs=2), "brass", M((0, -0.024, 0.221)), smooth=True)
    rm = Matrix.Translation((0, -0.058, 0.221)) @ M(rot=(0, 90, 0))     # reel axis along X
    p.add(lathe([(0.0005, -0.016), (0.038, -0.016), (0.041, -0.012), (0.041, -0.008), (0.032, -0.006)], 40, cap_bottom=True), "walnut", rm, smooth=True)
    p.add(lathe([(0.032, 0.006), (0.041, 0.008), (0.041, 0.012), (0.038, 0.016), (0.0005, 0.016)], 40, cap_top=True), "walnut", rm, smooth=True)
    for zz in (-0.0145, 0.0145):
        p.add(bm_tube(ring_pts(rm @ Matrix.Translation((0, 0, zz)), 0.0405, 40), 0.0022, 6, cap=False), "brass", smooth=True)
    p.add(lathe([(0.026, -0.007), (0.0305, 0.0), (0.026, 0.007)], 40), "line", rm, smooth=True)
    p.add(bm_cyl(0.009, 0.009, 0.006, 16), "brass", rm @ Matrix.Translation((0, 0, 0.016)), smooth=True)
    for a in (0, 180):
        k = rm @ Vector((0.027 * math.cos(math.radians(a)), 0.027 * math.sin(math.radians(a)), 0.016))
        p.add(bm_cyl(0.0025, 0.0025, 0.01, 8), "brass_dark", Matrix.Translation(k) @ M(rot=(0, 90, 0)), smooth=True)
        p.add(sphere(14, 10), "walnut_dark", Matrix.Translation(k + Vector((0.013, 0, 0))) @ S(0.007, 0.0075, 0.0075), smooth=True)
    # a lucky knot of red wool tied just above the seat
    kz = 0.285
    p.add(bm_tube(ring_pts(fr(kz), rad(kz) + 0.002, 16), 0.0019, 6, cap=False), "wool_red", smooth=True)
    k0 = fr(kz) @ Vector((rad(kz) + 0.004, 0, 0))
    p.add(sphere(10, 8), "wool_red", Matrix.Translation(k0) @ S(0.0045), smooth=True)
    p.add(bm_tube([k0, k0 + Vector((0.006, -0.002, -0.018)), k0 + Vector((0.004, 0.001, -0.034))], [0.0022, 0.0018, 0.0012], 5), "wool_red", smooth=True)
    # the lower cane, its guides, and the female ferrule
    cane(p, 0.26, JOINT)
    rings = []
    for z in (0.43, 0.6):
        guide(p, z, rings)
    p.add(lathe([(rad(JOINT) + 0.0003, -0.03), (rad(JOINT) + 0.0022, -0.026), (rad(JOINT) + 0.0022, 0.0), (rad(JOINT) + 0.0008, 0.003)], 16), "nickel", fr(JOINT), smooth=True)
    # line off the reel and through the lower guides
    start = rm @ Vector((0.0, 0.0303, 0.0))
    p.add(bm_tube([start] + rings + [rings[-1] + (rings[-1] - rings[0]).normalized() * 0.06], 0.0011, 4, cap=False), "line", smooth=True)
    return p, rings


def rod_tip(prev_ring):
    p = Part("fishing_rod_tip")
    cane(p, JOINT, ROD_L)
    rings = [prev_ring]
    for z in (0.8, 0.96, 1.1):
        guide(p, z, rings)
    p.add(lathe([(rad(JOINT) + 0.0016, 0.0), (rad(JOINT) + 0.0018, 0.022), (rad(JOINT) + 0.0004, 0.026)], 16), "nickel", fr(JOINT + 0.003), smooth=True)
    tf = fr(ROD_L)
    p.add(lathe([(R1 + 0.0006, -0.012), (R1 + 0.0012, 0.0), (R1 + 0.0006, 0.004)], 12), "silk_green", tf, smooth=True)
    top = tf @ Vector((0, -0.004, 0.006))
    p.add(bm_tube(ring_pts(frame(top, tf.to_3x3() @ Vector((1, 0, 0))), 0.005, 12), 0.0014, 4, cap=False), "nickel", smooth=True)
    p.add(bm_tube(rings[1:] + [top], 0.0011, 4, cap=False), "line", smooth=True)
    return p, top


def float_part():
    p = Part("float")
    # a cork float: cream below the waterline, a red cap, a quill antenna with a red tip
    lo = [(0.0006, -0.06), (0.009, -0.056), (0.017, -0.04), (0.022, -0.018), (0.0225, 0.0)]
    hi = [(0.0225, 0.0), (0.021, 0.012), (0.016, 0.026), (0.008, 0.035), (0.0035, 0.038)]
    p.add(lathe(lo, 32, cap_bottom=True), "float_cream", Matrix(), smooth=True)
    p.add(lathe(hi, 32), "float_red", Matrix(), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation((0, 0, 0.001)), 0.0228, 32), 0.0016, 6, cap=False), "float_cream", smooth=True)
    p.add(lathe([(0.0034, 0.036), (0.0028, 0.06), (0.0026, 0.075)], 12), "quill", Matrix(), smooth=True)
    p.add(lathe([(0.0028, 0.075), (0.0031, 0.08), (0.002, 0.089), (0.0004, 0.091)], 12, cap_top=True), "float_red", Matrix(), smooth=True)
    # the eye the line ties to, under the float
    p.add(bm_tube(ring_pts(M((0, 0, -0.064), (90, 0, 0)), 0.004, 12), 0.0011, 4, cap=False), "nickel", smooth=True)
    return p


def ripple_part():
    p = Part("ripple")
    # a soft rounded ring, radius 1 (the game scales and fades it)
    p.add(bm_tube(ring_pts(Matrix(), 0.94, 64), 0.045, 6, cap=False), "foam", M(scale=(1, 1, 0.18)), smooth=True)
    return p


def splash_part():
    p = Part("splash")
    n = 11
    for i in range(n):
        a = 2 * math.pi * (i + 0.3 * math.sin(i * 2.1)) / n
        h = 0.17 + 0.08 * (0.5 + 0.5 * math.sin(i * 1.7))
        base = Vector((math.cos(a) * 0.06, math.sin(a) * 0.06, 0.0))
        out = Vector((math.cos(a), math.sin(a), 0.0))
        pts = [base, base + out * 0.03 + Vector((0, 0, h * 0.5)), base + out * 0.07 + Vector((0, 0, h))]
        p.add(bm_tube(pts, [0.016, 0.011, 0.005], 8), "foam" if i % 3 else "foam_blue", smooth=True)
        p.add(sphere(10, 8), "foam", Matrix.Translation(pts[-1] + out * 0.012 + Vector((0, 0, 0.018))) @ S(0.012, 0.012, 0.016), smooth=True)
    p.add(lathe([(0.11, 0.0), (0.085, 0.022), (0.05, 0.03), (0.0005, 0.012)], 32, cap_top=True), "foam_blue", Matrix(), smooth=True)
    p.add(bm_tube(ring_pts(Matrix(), 0.11, 40), 0.013, 6, cap=False), "foam", M(scale=(1, 1, 0.7)), smooth=True)
    return p


def drop_part():
    p = Part("drop")
    p.add(lathe([(0.0004, -0.5), (0.36, -0.42), (0.5, -0.15), (0.38, 0.2), (0.15, 0.48), (0.0004, 0.62)], 12, cap_bottom=True, cap_top=True), "foam", M(scale=0.02), smooth=True)
    return p


def main():
    coll = common.reset()
    vc.tune_materials()
    base, rings = rod_base()
    rod = base.to_object(coll, origin=(0, 0, 0), sharp_angle=50)
    tip_p, top = rod_tip(rings[-1])
    tip = tip_p.to_object(coll, parent=rod, origin=tuple(axis(JOINT)), sharp_angle=50)
    end = common.empty("fishing_rod_end", coll, parent=tip, loc=top - axis(JOINT))
    bpy.context.view_layer.update()
    res = {"rod": fk.finish_set("fishing_rod", [rod, tip], [end])}
    common.preview_rig([rod, tip], azim=-62, elev=16, lens=60, margin=1.12)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, "fishing_rod.png"))

    coll = common.reset()
    vc.tune_materials()
    objs = []
    for i, (fn, x) in enumerate(((float_part, 0.0), (ripple_part, 0.8), (splash_part, 2.2), (drop_part, 2.8))):
        ob = fn().to_object(coll, origin=(0, 0, 0), sharp_angle=60)
        ob.location.x = x
        objs.append(ob)
    bpy.context.view_layer.update()
    res["bits"] = fk.finish_set("fishing_bits", objs)
    for o in objs:
        o.location.z += 0.1
    bpy.context.view_layer.update()
    common.preview_rig(objs, azim=-20, elev=24, lens=50, margin=1.1)
    common.preview_materials()
    common.render(os.path.join(common.OUT_PREV, "fishing_bits.png"))
    print("FISHING_GEAR", res)
    return res


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
