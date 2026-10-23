"""Bram the innkeeper: round and cheerful, green vest, white apron, towel on the shoulder,
rolled cream sleeves and a big moustache. Same part names and pivots as the player."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, chibi
importlib.reload(common)
importlib.reload(chibi)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_uv

TORSO = [(0.27, 0.3), (0.315, 0.36), (0.338, 0.48), (0.322, 0.6), (0.272, 0.7), (0.2, 0.8), (0.07, 0.865)]
YS = 0.9


def body():
    p = Part("body")
    p.add(bm_lathe(TORSO, 14), "door", M(scale=(1, YS, 1)), smooth=True)
    # apron: skirt over the belly and a bib, hugging the front
    skirt = [(r + 0.014, z) for r, z in TORSO[:4]]
    skirt = [(0.29, 0.24)] + skirt
    p.add(bm_lathe(skirt, 8, arc=(-155, -25)), "white", M(scale=(1, YS, 1)), smooth=True)
    bib = [(0.336, 0.6), (0.29, 0.7), (0.23, 0.775)]
    p.add(bm_lathe(bib, 4, arc=(-118, -62)), "white", M(scale=(1, YS, 1)), smooth=True)
    p.add(bm_tube([(0.35 * math.cos(math.radians(a)), YS * 0.35 * math.sin(math.radians(a)), 0.585)
                   for a in range(-160, 181, 20)], 0.014, 4), "white", smooth=True)
    for s in (-1, 1):   # neck strap
        p.add(bm_tube([(s * 0.09, -0.2, 0.77), (s * 0.08, -0.12, 0.84), (s * 0.06, 0.0, 0.87)], 0.012, 4), "white")
    p.add(bm_box(0.12, 0.03, 0.09, bevel=0.01), "plaster_shade", M((0.09, -0.318, 0.47), (0, 0, 0)))   # pocket
    # shirt collar + neck
    p.cyl(0.07, 0.1, (0, 0, 0.82), "skin", segs=8, smooth=True)
    p.add(bm_tube([(0.095 * math.cos(2 * math.pi * k / 12), YS * 0.095 * math.sin(2 * math.pi * k / 12), 0.86)
                   for k in range(13)], 0.026, 5), "plaster", smooth=True)
    # towel over the left shoulder (red-striped)
    p.add(bm_box(0.13, 0.03, 0.3, bevel=0.012), "white", M((0.2, -0.17, 0.66), (12, 0, 10)))
    p.add(bm_box(0.13, 0.03, 0.26, bevel=0.012), "white", M((0.2, 0.17, 0.68), (-12, 0, -10)))
    p.add(bm_box(0.15, 0.2, 0.04, bevel=0.012), "white", M((0.2, 0.0, 0.8)))
    for z in (0.58, 0.62):
        p.add(bm_box(0.135, 0.035, 0.018), "cloth", M((0.205 - (0.8 - z) * 0.17, -0.188, z), (12, 0, 10)))
    return p


def hair(hp, at, R, fy):
    # bald on top, a ring of auburn hair round the back and sides
    ring = [at(R * 0.98 * math.cos(math.radians(a)), R * 0.92 * math.sin(math.radians(a)), -0.02 + 0.03 * math.sin(math.radians(a)))
            for a in range(-30, 211, 20)]
    hp.add(bm_tube(ring, 0.075, 6), "hair", smooth=True)
    # big curly moustache
    for s in (-1, 1):
        hp.ball(0.06, at(s * 0.055, fy + 0.02, -0.105), "hair", scale=(1.25, 0.7, 0.6), rot=(0, s * -12, 0), uv=(8, 6))
        hp.ball(0.03, at(s * 0.125, fy + 0.04, -0.085), "hair", scale=(1.0, 0.8, 0.9), uv=(6, 4))


CFG = dict(
    head_r=0.27, neck_z=0.86, shoulder_x=0.275, shoulder_z=0.76, hip_x=0.12, hip_z=0.36,
    sleeve_r=0.08, sleeve_mat="plaster", cuff_mat="plaster_shade", forearm_mat="skin",
    arm_len=0.14, forearm_len=0.1, arm_splay=14, hand_r=0.068,
    leg_r=0.088, pants_mat="pants", boot_w=0.18, brow_mat="hair", brow_w=0.045, brow_dz=0.07,
    nose_r=0.045, nose_mat="blush", happy_eyes=True, mouth=False, eye_x=0.09,
    body_fn=body, hair_fn=hair,
)


def main():
    objs = chibi.assemble(CFG)
    r = common.finish("innkeeper", objs, azim=-25, elev=10, lens=60, margin=1.15)
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
