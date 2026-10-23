"""The player's pickaxe, in the soft Animal Crossing style of the characters (2026-10-23).
Same ash handle and spiral leather grip as the axe (tools_common.py), a little longer, with a
plump curved steel head: a rounded pick point in front and a flat chisel behind, both with bright
ground tips, a bulging eye with brass collars, a maker's ring stamp on the cheeks and the
twine sprout charm under the grip.

Format (tools_common.py): one object `pickaxe`, origin at the fist grip, handle up +Z, pick point
toward -Y. Shown in the player's `arm_r` only while mining (src/game/anim.ts)."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import tools_common as tc
importlib.reload(tc)
import bmesh
from tools_common import Part, M, bm_box, bm_tube, sphere, ring_pts, handle, sprout_charm, lerp_keys
from mathutils import Vector, Matrix

TOP = 0.505
HZ = 0.462
BOW = 0.012
RADII = [(-0.075, 0.021), (-0.04, 0.0188), (0.1, 0.0186), (0.3, 0.0172), (0.43, 0.0194), (TOP, 0.0194)]


def bend(y):
    """The head arcs down toward both ends."""
    return -1.15 * y * y


def bent_loft(secs, segs=36, domes=(0.002, 0.002)):
    """Closed solid along Y from superellipse sections (y, half-width X, half-height Z, exponent),
    bent down by bend(y)."""
    bm = bmesh.new()
    rings = []
    for y, wx, wz, e in secs:
        ring = []
        # tilt each section to follow the bend so the ends point along the curve
        slope = -2.3 * y
        nz = 1.0 / math.sqrt(1 + slope * slope)
        for i in range(segs):
            t = 2 * math.pi * i / segs
            c, s = math.cos(t), math.sin(t)
            x = wx * math.copysign(abs(c) ** (2 / e), c)
            z = wz * math.copysign(abs(s) ** (2 / e), s)
            ring.append(bm.verts.new((x, y - z * slope * nz, bend(y) + z * nz)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    y0, y1 = secs[0][0] - domes[0], secs[-1][0] + domes[1]
    p0 = bm.verts.new((0, y0, bend(y0)))
    p1 = bm.verts.new((0, y1, bend(y1)))
    for i in range(segs):
        j = (i + 1) % segs
        bm.faces.new((rings[0][j], rings[0][i], p0))
        bm.faces.new((rings[-1][i], rings[-1][j], p1))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def head(p):
    c = Matrix.Translation((0, 0, HZ))
    body = [(-0.18, 0.0085, 0.0095, 2.2), (-0.15, 0.0115, 0.0135, 2.4), (-0.11, 0.0155, 0.0185, 2.6), (-0.07, 0.019, 0.023, 2.9),
            (-0.045, 0.022, 0.027, 3.2), (-0.032, 0.025, 0.031, 3.6), (-0.026, 0.027, 0.034, 4.0),
            (0.026, 0.027, 0.034, 4.0), (0.032, 0.025, 0.031, 3.6), (0.05, 0.0215, 0.0255, 3.2), (0.08, 0.02, 0.022, 3.0),
            (0.11, 0.0205, 0.0175, 3.0), (0.13, 0.0215, 0.0125, 3.2)]
    p.add(bent_loft(body, 40, (0.0, 0.0)), "steel_soft", c, smooth=True)
    # bright ground tips: a round pick point in front, a flat chisel behind
    pick = [(-0.186, 0.0082, 0.0092, 2.2), (-0.2, 0.006, 0.0066, 2.1), (-0.212, 0.0036, 0.004, 2.0), (-0.218, 0.0016, 0.0018, 2.0)]
    p.add(bent_loft(pick, 28, (0.0, 0.0012)), "steel_bright", c, smooth=True)
    chis = [(0.126, 0.0218, 0.0128, 3.2), (0.14, 0.0224, 0.0095, 3.4), (0.152, 0.0222, 0.006, 3.4), (0.158, 0.0205, 0.0032, 3.0)]
    p.add(bent_loft(chis, 28, (0.0, 0.0012)), "steel_bright", c, smooth=True)
    # bulging eye round the handle with brass collars above and below
    p.add(sphere(32, 18), "steel_dark", c @ M((0, 0.001, 0.0), scale=(0.031, 0.034, 0.04)), smooth=True)
    for dz in (-0.043, 0.036):
        z = HZ + dz
        u = (z + 0.075) / (TOP + 0.075)
        m = Matrix.Translation((0, BOW * math.sin(math.pi * u), z))
        p.add(bm_tube(ring_pts(m, lerp_keys(RADII, z) + 0.0045, 28), 0.0047, 8, cap=False), "tool_brass", smooth=True)
    # end grain and a steel wedge on top
    top = Vector((0, 0.002, HZ + 0.043))
    p.add(sphere(24, 8), "ash_end", M(top, scale=(0.0175, 0.0175, 0.003)), smooth=True)
    p.add(bm_box(0.004, 0.028, 0.004, bevel=0.0014, segs=1), "steel_bright", M(top + Vector((0, 0, 0.0018))), smooth=True)
    # maker's ring stamp with three ticks on both cheeks, and a rivet each side of the eye
    for sgn in (1, -1):
        st = c @ Matrix.Translation((sgn * 0.0305, -0.002, 0.0)) @ Matrix.Rotation(math.radians(90), 4, "Y")
        p.add(bm_tube(ring_pts(st, 0.012, 24), 0.0017, 6, cap=False), "tool_brass", smooth=True)
        for a in (90, 210, 330):
            q = st @ Vector((0.006 * math.cos(math.radians(a)), 0.006 * math.sin(math.radians(a)), 0.0))
            p.add(sphere(10, 6), "tool_brass", M(q, scale=0.0024), smooth=True)
        for y in (-0.052, 0.054):
            p.add(sphere(14, 8), "tool_brass", M((sgn * 0.0205, y, HZ + bend(y) + 0.004), scale=(0.0035, 0.005, 0.005)), smooth=True)


def main():
    p = Part("pickaxe")
    handle(p, TOP, RADII, BOW)
    head(p)
    sprout_charm(p, -0.062, BOW, TOP)
    return tc.finish("pickaxe", p)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
