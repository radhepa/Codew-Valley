"""The player's axe, in the soft Animal Crossing style of the characters (2026-10-23).
A chunky woodsman's axe sized for the player's mitten hands: a gently bowed ash handle with grain
lines and a spiral leather grip, a soft rounded steel head (a plump bearded blade that thins to
a bright ground edge, a rounded poll), a wooden wedge and steel pin in the eye, a brass collar
and rivets, and a little twine sprout charm under the grip like the sprout badge on the tunic.

Format (tools_common.py): one object `axe`, origin at the fist grip, handle up +Z, blade edge
toward -Y. Shown in the player's `arm_r` only while chopping (src/game/anim.ts)."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import tools_common as tc
importlib.reload(tc)
from tools_common import Part, M, bm_box, bm_tube, sphere, ring_pts, pillow, smooth_outline, handle, sprout_charm, lerp_keys
from mathutils import Vector, Matrix

TOP = 0.475         # top of the handle
HZ = 0.43           # head centre
BOW = 0.012
RADII = [(-0.075, 0.021), (-0.04, 0.0188), (0.1, 0.0186), (0.3, 0.017), (0.4, 0.0192), (TOP, 0.0192)]
K = 1.15            # blade size

# blade outline (u = y toward the front is negative, v = z above the head centre)
BLADE = smooth_outline([(u * K, v * K) for u, v in [
    (-0.012, 0.035), (-0.06, 0.033), (-0.1, 0.045), (-0.136, 0.064),
    (-0.153, 0.047), (-0.163, 0.016), (-0.165, -0.016), (-0.159, -0.047), (-0.145, -0.073), (-0.127, -0.09),
    (-0.104, -0.076), (-0.074, -0.05), (-0.044, -0.038), (-0.012, -0.036)]], 5)
EDGE_U = -0.13 * K


def half(u, v):
    t = min(1.0, max(0.0, (u + 0.166 * K) / (0.154 * K)))
    return 0.0042 + 0.0205 * t ** 1.3


def head(p):
    c = Vector((0.0, 0.0, HZ))
    # the eye: a rounded block round the handle
    p.add(bm_box(0.052, 0.072, 0.094, bevel=0.017, segs=4), "steel_dark", M(c + Vector((0, 0.004, 0))), smooth=True)
    # plump bearded blade
    p.add(pillow(BLADE, half, 10, power=0.5), "steel_soft", Matrix.Translation(c), smooth=True)
    # bright ground edge: a band just inside the edge on both faces
    edge = [(u, v) for u, v in BLADE if u < EDGE_U]
    edge.sort(key=lambda q: q[1])
    cu = sum(q[0] for q in BLADE) / len(BLADE)
    cv = sum(q[1] for q in BLADE) / len(BLADE)
    for sgn in (1, -1):
        for sh, mat_, r in ((0.84, "steel_bright", 0.0019), (0.93, "steel_bright", 0.0026)):
            pts = []
            for u, v in edge:
                uu, vv = cu + (u - cu) * sh, cv + (v - cv) * sh
                a = math.acos(sh)
                pts.append(c + Vector((sgn * (half(uu, vv) * math.sin(a) ** 0.5 + 0.0004), uu, vv)))
            p.add(bm_tube(pts, r, 6), mat_, smooth=True)
    # rounded poll behind the eye
    p.add(sphere(28, 16), "steel_dark", M(c + Vector((0, 0.036, 0)), scale=(0.025, 0.026, 0.04)), smooth=True)
    # end grain and a steel wedge on top of the eye
    top = c + Vector((0, 0.002, 0.047))
    p.add(sphere(24, 8), "ash_end", M(top, scale=(0.0165, 0.024, 0.0035)), smooth=True)
    p.add(bm_box(0.004, 0.034, 0.004, bevel=0.0014, segs=1), "steel_bright", M(top + Vector((0, 0, 0.002))), smooth=True)
    # brass rivets on both cheeks and a brass collar under the head
    for sgn in (1, -1):
        for dv in (0.024, -0.024):
            p.add(sphere(14, 8), "tool_brass", M(c + Vector((sgn * 0.026, -0.008, dv)), scale=(0.004, 0.0062, 0.0062)), smooth=True)
    u = (HZ - 0.058 + 0.075) / (TOP + 0.075)
    cz = Matrix.Translation((0, BOW * math.sin(math.pi * u), HZ - 0.058))
    p.add(bm_tube(ring_pts(cz, lerp_keys(RADII, HZ - 0.058) + 0.004, 28), 0.0042, 8, cap=False), "tool_brass", smooth=True)


def main():
    p = Part("axe")
    handle(p, TOP, RADII, BOW)
    head(p)
    sprout_charm(p, -0.062, BOW, TOP)
    return tc.finish("axe", p)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
