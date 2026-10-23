"""Wren the miller: wiry and cheerful, mustard tunic with rolled sleeves, flour-dusted burlap apron,
red neck scarf, freckles and a wide straw hat (the silhouette). Same part names and pivots
as the player."""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, chibi
importlib.reload(common)
importlib.reload(chibi)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_uv

TUNIC = [(0.19, 0.31), (0.202, 0.35), (0.188, 0.48), (0.173, 0.6), (0.157, 0.7), (0.112, 0.78), (0.05, 0.81)]
YS = 0.8


def body():
    p = Part("body")
    p.add(bm_lathe(TUNIC, 14), "mustard", M(scale=(1, YS, 1)), smooth=True)
    # apron: skirt and bib hugging the front, with a cord belt
    skirt = [(0.215, 0.22)] + [(r + 0.014, z) for r, z in TUNIC[:4]]
    p.add(bm_lathe(skirt, 8, arc=(-150, -30)), "sack", M(scale=(1, YS, 1)), smooth=True)
    bib = [(0.19, 0.6), (0.172, 0.7), (0.13, 0.765)]
    p.add(bm_lathe(bib, 4, arc=(-120, -60)), "sack", M(scale=(1, YS, 1)), smooth=True)
    p.add(bm_tube([(0.205 * math.cos(math.radians(a)), YS * 0.205 * math.sin(math.radians(a)), 0.5)
                   for a in range(-160, 181, 30)], 0.012, 4), "wood_mid", smooth=True)
    for s in (-1, 1):
        p.add(bm_tube([(s * 0.06, -0.115, 0.76), (s * 0.06, -0.06, 0.8), (s * 0.05, 0.02, 0.81)], 0.01, 4), "sack")
    p.add(bm_box(0.1, 0.025, 0.08, bevel=0.01), "wheat_dark", M((-0.07, -0.183, 0.4)))      # pocket
    # flour dust: soft pale smudges on the apron, and a floury handprint
    rnd = random.Random(4)
    for i in range(4):
        a = rnd.uniform(-130, -50)
        z = rnd.uniform(0.28, 0.58)
        r = chibi.surface_pt(skirt, YS, a, z, 0.006)
        rr = rnd.uniform(0.03, 0.05)
        p.add(bm_cyl(rr, rr * 0.8, 0.006, 8), "flour", M(r, (90, 0, a + 90), (1.3, 1.0, 1.0)))
    # neck + red scarf knotted at the front, tails hanging
    p.cyl(0.058, 0.1, (0, 0, 0.76), "skin", segs=8, smooth=True)
    p.add(bm_tube([(0.082 * math.cos(2 * math.pi * k / 12), YS * 0.09 * math.sin(2 * math.pi * k / 12), 0.8)
                   for k in range(13)], 0.032, 5), "cloth", smooth=True)
    p.ball(0.04, (0.025, -0.09, 0.79), "cloth", scale=(1.1, 0.8, 0.9), uv=(8, 5))
    for dx, ang in ((0.02, -10), (0.06, 18)):
        p.add(bm_box(0.05, 0.02, 0.13), "cloth", M((dx, -0.1, 0.72), (8, ang, 0)))
    return p


def hair(hp, at, R, fy):
    # copper hair peeking out under the hat: back, sides and a fringe
    hp.ball(R * 1.02, at(0, 0.07, 0.02), "hair_copper", scale=(1.04, 0.95, 0.92), uv=(8, 5))
    for s in (-1, 1):
        hp.ball(0.085, at(s * R * 0.92, 0.03, 0.02), "hair_copper", scale=(0.55, 1.05, 1.2), uv=(8, 5))
    for dx, dz, r in ((-0.15, 0.05, 0.07), (-0.05, 0.075, 0.075), (0.06, 0.07, 0.07), (0.15, 0.045, 0.065)):
        hp.ball(r, at(dx, fy + 0.06, dz), "hair_copper", scale=(1.1, 0.6, 0.7), rot=(0, dx * 120, 0), uv=(6, 4))
    # freckles across the cheeks and nose
    for s in (-1, 1):
        for dx, dz in ((0.1, -0.075), (0.135, -0.06), (0.12, -0.095)):
            hp.ball(0.012, at(s * dx, fy + 0.03 + abs(dx) * 0.25, dz), "freckle", scale=(1, 0.5, 1), uv=(4, 3))
    # wide straw hat, tipped back a little
    hm = M(at(0, 0.02, R * 0.58), (8, 0, 0))
    brim = [(0.2, -0.01), (0.46, -0.04), (0.5, -0.06), (0.47, -0.07), (0.2, -0.035), (0.2, -0.01)]
    hp.add(bm_lathe(brim, 16, cap_bottom=False, cap_top=False), "straw", hm, smooth=True)
    hp.add(bm_lathe([(0.27, -0.03), (0.272, 0.08), (0.25, 0.16), (0.17, 0.2), (0.0, 0.21)], 12), "straw", hm, smooth=True)
    hp.add(bm_lathe([(0.276, -0.02), (0.277, 0.045)], 12, cap_bottom=False, cap_top=False), "door", hm)
    # a wheat ear tucked into the band
    for i, (a, tilt) in enumerate(((-60, 20), (-50, 34))):
        pos = (0.28 * math.cos(math.radians(a)), 0.28 * math.sin(math.radians(a)), 0.06)
        hp.add(bm_cyl(0.025, 0.0, 0.16, 4), "wheat", hm @ M(pos, (tilt, -25, 0)))


CFG = dict(
    head_r=0.27, neck_z=0.81, shoulder_x=0.185, shoulder_z=0.72, hip_x=0.09, hip_z=0.4,
    sleeve_r=0.064, sleeve_mat="mustard", cuff_mat="wheat_dark", forearm_mat="skin",
    arm_len=0.11, forearm_len=0.13, arm_splay=9, hand_r=0.058,
    leg_r=0.066, pants_mat="wood_mid", boot_w=0.15, brow_mat="hair_copper", brow_w=0.03,
    nose_r=0.028, eye_x=0.09, head_uv=(12, 8), arm_segs=6, sleeve_uv=(8, 5), hand_uv=(8, 5),
    body_fn=body, hair_fn=hair,
)


def main():
    objs = chibi.assemble(CFG)
    r = common.finish("miller", objs, azim=-25, elev=10, lens=60, margin=1.15)
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
