"""The player: a chibi village founder (~1.4 m) in a blue tunic, boots and a satchel."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, chibi
importlib.reload(common)
importlib.reload(chibi)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_uv

TUNIC = [(0.215, 0.33), (0.228, 0.37), (0.21, 0.48), (0.195, 0.6), (0.175, 0.7), (0.125, 0.775), (0.05, 0.805)]
YS = 0.82


def body():
    p = Part("body")
    p.add(bm_lathe(TUNIC, 14), "tunic", M(scale=(1, YS, 1)), smooth=True)
    # hem trim and collar
    p.add(bm_lathe([(0.232, 0.33), (0.236, 0.36)], 14, cap_bottom=False, cap_top=False), "wood_light", M(scale=(1, YS, 1)))
    p.add(bm_lathe([(0.24, 0.33), (0.232, 0.33)], 14, cap_bottom=False, cap_top=False), "wood_light", M(scale=(1, YS, 1)))
    p.cyl(0.062, 0.1, (0, 0, 0.75), "skin", segs=8, smooth=True)
    p.add(bm_tube([(0.085 * math.cos(2 * math.pi * k / 12), YS * 0.085 * math.sin(2 * math.pi * k / 12), 0.79)
                   for k in range(13)], 0.022, 5), "wood_light", smooth=True)
    # belt + buckle
    p.cyl(0.218, 0.06, (0, 0, 0.45), "wood_dark", segs=12, scale=(1, YS, 1))
    p.add(bm_box(0.075, 0.03, 0.065, bevel=0.01), "petal_yellow", M((0, -0.18, 0.48)))
    p.add(bm_box(0.04, 0.035, 0.03), "wood_dark", M((0, -0.185, 0.48)))
    # satchel strap: right shoulder (front) to left hip, and back again
    chibi.strap(p, TUNIC, YS, -118, 0.755, -28, 0.47, "wood_mid")
    chibi.strap(p, TUNIC, YS, 118, 0.755, 28, 0.47, "wood_mid")
    # satchel on the left hip
    p.add(bm_box(0.1, 0.22, 0.17, bevel=0.03, segs=2), "wood_light", M((0.245, -0.01, 0.42)), smooth=True)
    p.add(bm_box(0.11, 0.23, 0.085, bevel=0.025), "wood_mid", M((0.25, -0.01, 0.475), (0, -6, 0)))
    p.ball(0.018, (0.307, -0.01, 0.45), "petal_yellow", uv=(6, 4))
    return p


def hair(hp, at, R, fy):
    hp.ball(R * 1.07, at(0, 0.06, 0.06), "wood_mid", scale=(1.04, 1.0, 0.9), uv=(12, 8))
    # side locks over the ears' tops
    for s in (-1, 1):
        hp.ball(0.09, at(s * R * 0.9, 0.02, 0.05), "wood_mid", scale=(0.6, 1.1, 1.1), uv=(8, 5))
    # fringe tufts across the forehead
    for i, (dx, dz, r) in enumerate([(-0.15, 0.09, 0.095), (-0.05, 0.13, 0.1), (0.06, 0.13, 0.1), (0.16, 0.09, 0.09)]):
        hp.ball(r, at(dx, fy + 0.07, dz), "wood_mid", scale=(1.15, 0.75, 0.8), rot=(0, (dx * 120), 0), uv=(7, 4))
    # cowlick
    hp.add(bm_cyl(0.05, 0.0, 0.12, 8), "wood_mid", M(at(0.03, 0.02, R * 0.95), (-25, 15, 0)), smooth=True)


CFG = dict(
    head_r=0.28, neck_z=0.8, shoulder_x=0.2, shoulder_z=0.72, hip_x=0.095, hip_z=0.42,
    sleeve_r=0.068, sleeve_mat="tunic", cuff_mat="wood_light", arm_len=0.2, arm_splay=10,
    leg_r=0.072, pants_mat="pants", brow_mat="wood_mid",
    body_fn=body, hair_fn=hair,
)


def main():
    objs = chibi.assemble(CFG)
    r = common.finish("player", objs, azim=-25, elev=10, lens=60, margin=1.15)
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
