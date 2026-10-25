"""Marlo the fisher, in a soft Animal Crossing style after the user's reference sheet (2026-10-23).
No triangle budget: smooth high-resolution forms, metaball-sculpted beard, moustache, brows,
hair and boots, black oval eyes, ribbed knit beanie with a scaled pinecone and a barred feather,
an oilskin coat with a placket, wooden toggles, stitched patch pockets, elbow patches, a back
half-belt, a knitted scarf and an enamel pin.
Props: `rod` (arm_r, held out a little in front): cork grip, brass reel and ferrules, a gently
bent blank with wrapped guides, a fly on the hook keeper, the line hanging to a red-and-white
float and hook; `tackle_box` (arm_l): stitched leather case with a brass clasp.
Parts and pivots as the miller: body, head (neck), arm_l / arm_r (shoulders), leg_l / leg_r (hips).
Built with the shared kit in villagers_common.py."""
import sys, os, math, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common, villagers_common as vc
importlib.reload(common)
importlib.reload(vc)
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe
from villagers_common import frame, S, sphere, lathe, ribs, meta, stitch, polyline_at, plen, ring_pts
from mathutils import Vector, Matrix

vc.palette({
    "coat": "#B5944F", "coat_dark": "#8C7136", "coat_light": "#D8C08A",
    "knit": "#A8885A", "knit_dark": "#87693F", "beard": "#EFE9DD",
    "scarf": "#4E7D58", "scarf_dark": "#3D6346", "enamel": "#3E7E63",
    "toggle": "#9A6640", "toggle_dark": "#6A4228", "leather_patch": "#5E3E2C",
    "rubber_boot": "#4B5752", "rubber_light": "#5E6C66", "trousers": "#4A4E55",
    "rod_wood": "#8C5B35", "rod_dark": "#5B3A22", "cork": "#C9A06A", "cork_dark": "#A87E4C", "wrap_red": "#8E3A2E",
    "line": "#3C3A38", "hook": "#5A5A5E", "bobber_red": "#C8463A", "bobber_white": "#F3EEE6",
    "case": "#875838", "case_dark": "#5E3C27", "pinecone": "#7A5234", "pinecone_dark": "#583B25",
    "feather": "#B6503E", "feather_tan": "#BC824E", "feather_dark": "#7A5032", "quill": "#E9DEC6",
}, metal={"hook": (0.7, 0.35)}, gloss={"bobber_red": 0.3, "bobber_white": 0.3, "rubber_boot": 0.55})


# ---------------------------------------------------------------- body (coat)

COAT = vc.Garment([(0.236, 0.19), (0.246, 0.215), (0.245, 0.27), (0.234, 0.35), (0.218, 0.45), (0.202, 0.55), (0.188, 0.63),
                   (0.172, 0.69), (0.148, 0.74), (0.112, 0.785), (0.072, 0.815), (0.04, 0.83)], ys=0.84)


def toggle(part, c, n):
    """Wooden barrel toggle lying across the placket, with a cord loop and a stitched tab."""
    m = frame(c, n)
    part.add(sphere(20, 12), "toggle", m @ S(0.035, 0.013, 0.013), smooth=True)
    for s in (-1, 1):
        part.add(bm_tube([(s * 0.021, 0, 0.0), (s * 0.025, 0, 0.0)], 0.0118, 12), "toggle_dark", m, smooth=True)
    loop = [m @ Vector((0.034 * math.cos(t) - 0.02, 0.016 * math.sin(t), 0.004)) for t in [math.pi * (0.5 + k / 8) for k in range(9)]]
    part.add(bm_tube(loop, 0.0045, 6), "cord", smooth=True)
    part.add(sphere(14, 8), "coat_dark", m @ Matrix.Translation((-0.05, 0, -0.006)) @ S(0.016, 0.022, 0.005), smooth=True)


def body():
    p = Part("body")
    G = COAT
    G.mesh(p, "coat")
    # rolled hem with a line of stitching above it
    G.hem(p, 0.205, 0.018, "coat_dark")
    G.stitch_ring(p, 0.245, matname="coat_light")
    # front placket (right panel over the left), its edge and stitching
    G.panel(p, -98, -84, 0.2, 0.79, "coat", 0.006, 3)
    p.add(bm_tube([G.pt(-98, z, 0.007) for z in (0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.79)], 0.0045, 6), "coat_dark", smooth=True)
    stitch(p, [G.pt(-86, z, 0.008) for z in (0.23, 0.4, 0.55, 0.7, 0.77)], "coat_light")
    # four wooden toggles down the placket
    for z in (0.34, 0.45, 0.56, 0.665):
        toggle(p, G.pt(-91, z, 0.02), G.normal(-91, z))
    # stitched patch pockets
    for pc in (-136, -44):
        G.pocket(p, pc, 15, 0.25, 0.37, "coat", edge="coat_dark", thread="coat_light")
    # back half-belt with two buttons, and a centre vent seam
    G.panel(p, 62, 118, 0.47, 0.52, "coat_dark", 0.007, 8)
    for phi in (72, 108):
        p.add(sphere(14, 8), "toggle", G.frame(phi, 0.495, 0.012) @ S(0.014, 0.014, 0.007), smooth=True)
    p.add(bm_tube([G.pt(90, z, 0.003) for z in (0.205, 0.3, 0.4, 0.47)], 0.004, 6), "coat_dark", smooth=True)
    # collar: a soft fall collar round the back and sides with a dark edge
    col = [(0.165, 0.735), (0.158, 0.765), (0.14, 0.795), (0.112, 0.82), (0.09, 0.835)]
    p.add(bm_lathe(col, 32, arc=(-55, 235)), "coat", M(scale=(1, G.ys + 0.04, 1)), smooth=True)
    p.add(bm_tube([(0.166 * math.cos(math.radians(a)), (G.ys + 0.04) * 0.166 * math.sin(math.radians(a)), 0.733)
                   for a in range(-55, 236, 10)], 0.006, 6), "coat_dark", smooth=True)
    p.add(bm_cyl(0.062, 0.06, 0.12, 20), "skin_warm", M((0, 0, 0.75)), smooth=True)
    # knitted scarf: a rolled loop, a knot on the left and a tail with stripes and fringe
    sc = [(0.098 * math.cos(2 * math.pi * k / 32), 0.088 * math.sin(2 * math.pi * k / 32), 0.79 - 0.012 * math.sin(2 * math.pi * k / 32))
          for k in range(33)]
    p.add(bm_tube(sc, 0.03, 12, cap=False), "scarf", smooth=True)
    p.add(sphere(18, 12), "scarf", M((0.075, -0.1, 0.775), scale=(0.04, 0.032, 0.036)), smooth=True)
    tail = [Vector((0.09, -0.115, 0.765)), Vector((0.115, -0.15, 0.7)), Vector((0.13, -0.17, 0.62)), Vector((0.135, -0.175, 0.56))]
    p.add(bm_tube(tail, [0.024, 0.028, 0.03, 0.03], 12), "scarf", M(), smooth=True)
    for t in (0.75, 0.85):
        c = polyline_at(tail, plen(tail) * t)
        p.add(bm_tube([c + Vector((0, 0, 0.008)), c - Vector((0, 0, 0.008))], 0.0315, 12), "scarf_dark", smooth=True)
    for k in range(5):
        x = 0.135 + (k - 2) * 0.011
        p.add(bm_cyl(0.005, 0.004, 0.035, 6), "scarf", M((x, -0.175 + abs(k - 2) * 0.004, 0.56), (180, 0, 0)), smooth=True)
    # enamel fish-hook pin on the left collar
    pm = G.frame(-58, 0.705, 0.01)
    p.add(bm_tube(ring_pts(pm, 0.021, 20, 0.004), 0.004, 6, cap=False), "brass", smooth=True)
    p.add(sphere(20, 10), "enamel", pm @ Matrix.Translation((0, 0, 0.003)) @ S(0.019, 0.019, 0.005), smooth=True)
    hook = [pm @ Vector(v) for v in ((0.0, 0.012, 0.009), (0.0, -0.004, 0.009), (-0.004, -0.01, 0.009), (-0.009, -0.006, 0.009), (-0.008, -0.001, 0.009))]
    p.add(bm_tube(hook, 0.0016, 4), "white", smooth=True)
    return p


# ---------------------------------------------------------------- head

NECK = 0.8
HD = vc.Head((0, 0, 1.07), 0.315, 0.29, 0.285)


def pinecone(hp, m):
    """Pinecone of overlapping scales on its own axis (local Z up), placed by matrix m."""
    hp.add(sphere(16, 10), "pinecone_dark", m @ Matrix.Translation((0, 0, 0.034)) @ S(0.02, 0.02, 0.036), smooth=True)
    for k in range(7):
        z = 0.01 + k * 0.0095
        rk = 0.009 + 0.019 * math.sin(math.pi * (k + 0.8) / 7.6)
        n = 7 if k < 6 else 5
        for i in range(n):
            a = 2 * math.pi * (i + 0.5 * (k % 2)) / n
            pos = Vector((rk * math.cos(a), rk * math.sin(a), z))
            nrm = Vector((math.cos(a) * 0.55, math.sin(a) * 0.55, 0.85))
            hp.add(sphere(10, 6), "pinecone" if (i + k) % 3 else "pinecone_dark", m @ frame(pos, nrm) @ S(0.0125, 0.011, 0.0045), smooth=True)
    hp.add(bm_cyl(0.004, 0.003, 0.016, 6), "pinecone_dark", m @ M((0, 0, 0.0), (180, 0, 0)), smooth=True)


def feather(hp, m):
    """Barred feather: a flattened vane along a curve in the local YZ plane, quill on top."""
    q = [Vector(v) for v in ((0, 0, 0), (0, 0.008, 0.05), (0, 0.026, 0.11), (0, 0.06, 0.17), (0, 0.105, 0.215), (0, 0.155, 0.24))]
    flat = S(0.2, 1, 1)
    hp.add(bm_tube(q, [0.005, 0.03, 0.041, 0.041, 0.03, 0.005], 14), "feather_tan", m @ flat, smooth=True)
    for sx in (-1, 1):
        hp.add(bm_tube([v + Vector((sx * 0.0075, 0, 0)) for v in q], [0.003, 0.0028, 0.0026, 0.0022, 0.0018, 0.001], 6), "quill", m, smooth=True)
        for i in (1, 2, 3, 4):
            d = (q[i + 1] - q[i - 1]).normalized()
            perp = Vector((0, -d.z, d.y))
            w = (0.027, 0.038, 0.038, 0.028)[i - 1]
            hp.add(bm_tube([q[i] - perp * w, q[i] + perp * w], 0.0055, 6), "feather_dark", m @ Matrix.Translation((sx * 0.002, 0, 0)) @ flat, smooth=True)
    hp.add(bm_tube([q[0], q[0] - Vector((0, 0.002, 0.025))], 0.0026, 6), "quill", m, smooth=True)


def head():
    hp = Part("head")
    H = HD.H
    HD.face(hp)
    HD.brows(hp, "beard")
    # white hair round the back and over the ears, under the beanie
    hair = []
    for k in range(15):
        phi = math.radians(-22 + 224 * k / 14)
        hair.append((H(HD.a * 0.93 * math.cos(phi), HD.b * 0.93 * math.sin(phi), 0.05 + 0.01 * math.sin(3 * phi)), 0.043))
    for k in range(7):
        phi = math.radians(35 + 110 * k / 6)
        hair.append((H(HD.a * 0.84 * math.cos(phi), HD.b * 0.9 * math.sin(phi), -0.04), 0.052))
    hp.add(meta(hair, 0.011, 4.0), "beard", None, smooth=True)
    # the beard: a fused, scalloped cloud from sideburn to sideburn, hanging to a soft point
    bd = [(H(0, -0.15, -0.23), 0.095), (H(0, -0.265, -0.195), 0.068), (H(0, -0.236, -0.39), 0.046)]
    for s in (-1, 1):
        bd += [(H(s * 0.12, -0.13, -0.19), 0.085),                                                     # solid fill behind
               (H(s * 0.283, -0.035, 0.0), 0.044), (H(s * 0.268, -0.1, -0.068), 0.058),                # sideburn to jaw
               (H(s * 0.222, -0.17, -0.13), 0.068), (H(s * 0.15, -0.226, -0.168), 0.07), (H(s * 0.075, -0.256, -0.19), 0.068),
               (H(s * 0.19, -0.2, -0.22), 0.06), (H(s * 0.115, -0.238, -0.25), 0.064), (H(s * 0.04, -0.258, -0.262), 0.062),
               (H(s * 0.13, -0.218, -0.31), 0.052), (H(s * 0.058, -0.243, -0.322), 0.056), (H(s * 0.025, -0.238, -0.37), 0.044)]
    hp.add(meta(bd, 0.009, 4.0), "beard", None, smooth=True)
    # moustache: two plump lobes sweeping out and curling up at the tips (its own shape over the beard)
    for s in (-1, 1):
        mo = [(H(s * 0.036, -0.292, -0.1), 0.035), (H(s * 0.075, -0.285, -0.106), 0.041), (H(s * 0.117, -0.263, -0.098), 0.036),
              (H(s * 0.151, -0.237, -0.08), 0.027), (H(s * 0.171, -0.215, -0.058), 0.019)]
        hp.add(meta(mo, 0.006), "beard", None, smooth=True)
    # ribbed knit beanie: a rolled cuff and a soft slouchy dome, tipped back
    hm = Matrix.Translation(HD.hc + Vector((0, 0.012, 0.078))) @ M(rot=(-10, 0, 0))
    cuff = [(0.288, -0.03), (0.297, -0.045), (0.312, -0.042), (0.322, -0.028), (0.328, 0.0), (0.328, 0.032), (0.323, 0.06),
            (0.313, 0.08), (0.3, 0.09)]
    hp.add(lathe(cuff, 160, rfun=ribs(40, 0.0065), ys=0.93), "knit", hm, smooth=True)
    dome = []
    for k in range(16):
        th = math.radians(88 * k / 15)
        dome.append((0.302 * math.cos(th) ** 0.72, 0.07 + 0.248 * math.sin(th)))
    hp.add(lathe(dome, 144, rfun=ribs(36, 0.0042, 0.07, 0.3), ys=0.93, cap_top=True), "knit", hm, smooth=True)
    # pinecone and feather tucked into the cuff on the left front
    phi = -38.0
    a = math.radians(phi)
    base = Vector((0.336 * math.cos(a), 0.93 * 0.336 * math.sin(a), 0.002))
    feather(hp, hm @ Matrix.Translation(base + Vector((-0.004, 0.01, 0.03))) @ M(rot=(0, 0, -78)) @ M(rot=(-5, 16, 0)))
    pinecone(hp, hm @ Matrix.Translation(base) @ M(rot=(0, 0, phi)) @ M(rot=(0, 18, 0)))
    return hp


# ---------------------------------------------------------------- arms and legs

def elbow_patch(p, side, pv, d):
    """Leather elbow patch with a stitched edge, on the outer back of the sleeve."""
    n0 = Vector((side * 0.85, 0.5, 0.0))
    n = (n0 - d * n0.dot(d)).normalized()
    em = frame(pv + d * 0.115 + n * 0.072, n)
    p.add(sphere(24, 14), "leather_patch", em @ S(0.04, 0.054, 0.008), smooth=True)
    for k in range(14):
        t = 2 * math.pi * k / 14
        p.add(sphere(6, 4), "coat_light", em @ Matrix.Translation((0.031 * math.cos(t), 0.044 * math.sin(t), 0.007)) @ S(0.0035), smooth=True)


def pull_tab(p, side, x):
    p.add(bm_tube([(x - 0.014, 0.08, 0.31), (x, 0.098, 0.33), (x + 0.014, 0.08, 0.31)], 0.006, 6), "rubber_light", smooth=True)


CFG = dict(
    neck_z=NECK, shoulder_x=0.185, shoulder_z=0.70, hip_x=0.09, hip_z=0.36,
    arm_len=0.27, arm_pose={-1: (16, 22)},          # the rod arm reaches a little out and forward
    sleeve_r=0.072, sleeve_mat="coat", cuff_mat="coat_dark", stitch_mat="coat_light", arm_fn=elbow_patch,
    leg_r=0.062, pants_mat="trousers", boot_mat="rubber_boot", boot_top=0.29, boot_trim="rubber_light", leg_fn=pull_tab,
)


# ---------------------------------------------------------------- props

ROD_L = 1.2         # grip butt at -0.085, blank from 0.21 to ROD_L (local Z along the rod)
DROOP = 0.075       # the tip bends down this much under the float's weight


def rod():
    p = Part("rod")
    g = vc.hand_c(-1, CFG)
    dr = Vector((-0.36, -0.5, 0.79)).normalized()
    m = frame(g, dr)          # local Z along the rod; local -Y is "under" the rod

    def at(z, off=(0.0, 0.0)):
        """World point on the (bent) rod axis at local z, offset (x, y) across it."""
        t = max(z - 0.21, 0.0) / (ROD_L - 0.21)
        return m @ Vector((off[0], off[1] - DROOP * t * t, z))

    def fr(z):
        """Frame on the rod axis at z, local Z along the bent rod."""
        return frame(at(z), at(z + 0.01) - at(z - 0.01))

    # butt knob just under the fist, cork grip with darker rings, brass winding check
    p.add(lathe([(0.008, -0.088), (0.02, -0.086), (0.028, -0.078), (0.03, -0.068), (0.027, -0.058), (0.024, -0.054)], 24, cap_bottom=True),
          "rod_dark", m, smooth=True)
    grip = [(0.024, -0.055), (0.027, -0.045), (0.0285, 0.0), (0.028, 0.06), (0.026, 0.12), (0.023, 0.17), (0.019, 0.2), (0.0175, 0.21)]
    p.add(lathe(grip, 28), "cork", m, smooth=True)
    for z in (-0.03, 0.065, 0.15):
        r = vc.Garment(grip).rad(z) + 0.0006
        p.add(lathe([(r, z - 0.003), (r, z + 0.003)], 28), "cork_dark", m, smooth=True)
    p.add(lathe([(0.0175, 0.2), (0.021, 0.204), (0.021, 0.218), (0.0172, 0.222)], 24), "brass", m, smooth=True)
    # the blank: one smooth tapered tube along the bent axis
    zs = [0.21 + (ROD_L - 0.21) * k / 30 for k in range(31)]
    p.add(bm_tube([at(z) for z in zs], [0.0165 - 0.0105 * (z - 0.21) / (ROD_L - 0.21) for z in zs], 16), "rod_wood", M(), smooth=True)

    def rad(z):
        return 0.0165 - 0.0105 * (z - 0.21) / (ROD_L - 0.21)

    for z in (0.56, 0.9):                                                          # brass ferrules
        r = rad(z)
        p.add(lathe([(r, -0.012), (r + 0.0028, -0.008), (r + 0.0028, 0.008), (r, 0.012)], 18), "brass", fr(z), smooth=True)
    p.add(bm_tube(ring_pts(fr(ROD_L), 0.0062, 14), 0.0016, 5, cap=False), "brass", smooth=True)    # tip-top ring
    # guides: red thread wraps, a short stem and a ring hugging the underside
    guides = (0.38, 0.66, 0.92, 1.1)
    rings = []
    for z in guides:
        r = rad(z)
        f = fr(z)
        p.add(lathe([(r + 0.0012, -0.011), (r + 0.0012, 0.011)], 14), "wrap_red", f, smooth=True)
        c = f @ Vector((0, -(r + 0.0085), 0))
        p.add(bm_tube([f @ Vector((0, -r, 0)), f @ Vector((0, -(r + 0.0045), 0))], 0.0014, 5), "brass", smooth=True)
        p.add(bm_tube(ring_pts(frame(c, f.to_3x3() @ Vector((0, 0, 1))), 0.004, 12), 0.0012, 4, cap=False), "brass", smooth=True)
        rings.append(c)
    # reel ahead of the fist, under the grip: a foot, two round plates, a spool of line, a crank on the outer side
    p.add(bm_box(0.01, 0.022, 0.05, bevel=0.003, segs=2), "brass", m @ Matrix.Translation((0, -0.034, 0.12)), smooth=True)
    sx = 1.0 if (m.to_3x3() @ Vector((1, 0, 0))).x < 0 else -1.0        # the side facing away from his body
    rc = m @ Vector((0, -0.074, 0.12))
    rm = m @ Matrix.Translation((0, -0.074, 0.12)) @ M(rot=(0, 90, 0))   # reel axis along local X
    for zz in (-0.015, 0.015):
        p.add(lathe([(0.036, zz - 0.003), (0.038, zz), (0.036, zz + 0.003)], 32, cap_top=True, cap_bottom=True), "brass", rm, smooth=True)
    p.add(lathe([(0.026, -0.013), (0.0275, 0.0), (0.026, 0.013)], 32), "line", rm, smooth=True)
    p.add(bm_cyl(0.008, 0.008, 0.012, 12), "brass_dark", rm @ Matrix.Translation((0, 0, sx * 0.018 - (0.012 if sx < 0 else 0))), smooth=True)
    p.add(bm_box(0.05, 0.009, 0.006, bevel=0.0028, segs=2), "brass", rm @ Matrix.Translation((0.016, 0, sx * 0.026)), smooth=True)
    p.add(sphere(14, 10), "rod_dark", rm @ Matrix.Translation((0.038, 0, sx * 0.036)) @ S(0.0085, 0.0085, 0.012), smooth=True)
    # a little fly parked on the hook keeper above the grip
    kf = fr(0.26)
    keep = kf @ Vector((0, -(rad(0.26) + 0.007), 0))
    p.add(bm_tube(ring_pts(frame(keep, kf.to_3x3() @ Vector((1, 0, 0))), 0.005, 10), 0.0012, 4, cap=False), "brass", smooth=True)
    fm = frame(keep + kf.to_3x3() @ Vector((0, -0.012, 0.004)), kf.to_3x3() @ Vector((0, 0, 1)))
    p.add(sphere(12, 8), "feather", fm @ Matrix.Translation((0, 0, 0.006)) @ S(0.0055, 0.0055, 0.012), smooth=True)
    p.add(sphere(12, 8), "feather_tan", fm @ Matrix.Translation((0, 0, 0.019)) @ S(0.009, 0.009, 0.006), smooth=True)
    p.add(bm_tube([fm @ Vector((0, 0.003, 0.01)), fm @ Vector((0, 0.011, -0.004))], [0.0042, 0.0012], 6), "quill", smooth=True)
    p.add(bm_tube([fm @ Vector((0, 0, -0.005)), fm @ Vector((0, -0.002, -0.012)), keep], 0.0011, 4), "hook", smooth=True)
    # line: off the spool, through the guides, out of the tip and straight down to the float
    tip = at(ROD_L)
    start = rc + (rings[0] - rc).normalized() * 0.027
    p.add(bm_tube([start] + rings + [tip + (tip - at(ROD_L - 0.02)).normalized() * 0.004], 0.0014, 4, cap=False), "line", smooth=True)
    bob = tip + Vector((0, 0, -0.52))
    p.add(bm_tube([tip, bob + Vector((0, 0, 0.074))], 0.0014, 4, cap=False), "line", smooth=True)
    # float: white lower half, red upper half, a dark band, a white stem; a sinker, leader and hook below
    bmx = Matrix.Translation(bob)
    R = 0.042
    lo = [(R * math.sin(math.pi * k / 16), -R * math.cos(math.pi * k / 16)) for k in range(1, 9)]
    hi = [(R * math.cos(math.pi * k / 16), R * math.sin(math.pi * k / 16)) for k in range(0, 8)]
    p.add(lathe(lo, 40, cap_bottom=True), "bobber_white", bmx, smooth=True)
    p.add(lathe(hi, 40, cap_top=True), "bobber_red", bmx, smooth=True)
    p.add(bm_tube(ring_pts(bmx, R + 0.0004, 40), 0.003, 6, cap=False), "eye_dark", smooth=True)
    p.add(lathe([(0.006, R - 0.002), (0.0045, R + 0.015), (0.0035, R + 0.03), (0.0045, R + 0.032)], 12, cap_top=True), "bobber_white", bmx, smooth=True)
    p.add(bm_tube([bob - Vector((0, 0, R)), bob - Vector((0, 0, R + 0.09))], 0.0013, 4), "line", smooth=True)
    p.add(sphere(12, 8), "iron", M(bob - Vector((0, 0, R + 0.035)), scale=0.0065), smooth=True)
    hk = [bob + Vector(v) for v in ((0, 0, -R - 0.09), (0, 0, -R - 0.118), (0.007, 0, -R - 0.13), (0.016, 0, -R - 0.121), (0.015, 0, -R - 0.108))]
    p.add(bm_tube(hk, 0.0018, 5), "hook", smooth=True)
    return p, g


def tackle_box():
    p = Part("tackle_box")
    g = vc.hand_c(1, CFG)
    c = g + Vector((0.045, 0.0, -0.175))
    w, dpt, h = 0.12, 0.27, 0.16
    p.add(bm_box(w, dpt, h, bevel=0.022, segs=4), "case", M(c), smooth=True)
    # lid: a slightly wider top section with a seam, a strap and a brass clasp on the outer side
    p.add(bm_box(w + 0.006, dpt + 0.006, 0.045, bevel=0.02, segs=4), "case", M(c + Vector((0, 0, h / 2 - 0.022))), smooth=True)
    p.add(bm_tube([c + Vector((sx * (w / 2 + 0.004), sy * (dpt / 2 + 0.004), h / 2 - 0.046)) for sx, sy in
                   ((1, -1), (1, 1), (-1, 1), (-1, -1), (1, -1))], 0.004, 6, cap=False), "case_dark", smooth=True)
    p.add(bm_box(0.008, 0.06, 0.075, bevel=0.003, segs=2), "case_dark", M(c + Vector((w / 2 + 0.006, 0, h / 2 - 0.04))), smooth=True)
    p.add(bm_box(0.008, 0.034, 0.034, bevel=0.004, segs=2), "brass", M(c + Vector((w / 2 + 0.011, 0, h / 2 - 0.07))), smooth=True)
    p.add(sphere(10, 6), "brass_dark", M(c + Vector((w / 2 + 0.016, 0, h / 2 - 0.07)), scale=0.006), smooth=True)
    # stitching round both long sides
    for sx in (1, -1):
        x = sx * (w / 2 + 0.001)
        stitch(p, [c + Vector((x, -dpt / 2 + 0.03, h / 2 - 0.06)), c + Vector((x, -dpt / 2 + 0.03, -h / 2 + 0.025)),
                   c + Vector((x, dpt / 2 - 0.03, -h / 2 + 0.025)), c + Vector((x, dpt / 2 - 0.03, h / 2 - 0.06))], "coat_light")
    # brass corner caps on the bottom corners
    for sx in (1, -1):
        for sy in (1, -1):
            p.add(sphere(12, 8), "brass", M(c + Vector((sx * (w / 2 - 0.012), sy * (dpt / 2 - 0.012), -h / 2 + 0.012)), scale=0.017), smooth=True)
    # leather handle arching up through the fist, on brass rings
    e1, e2 = c + Vector((0, -0.075, h / 2 + 0.012)), c + Vector((0, 0.075, h / 2 + 0.012))
    p.add(bm_tube(vc.bezier(e1, 2 * g - (e1 + e2) / 2, e2), 0.012, 10), "case_dark", M(), smooth=True)
    for e in (e1, e2):
        p.add(bm_tube([e + Vector((0, 0.012 * math.cos(t), 0.012 * math.sin(t) - 0.004)) for t in [2 * math.pi * k / 12 for k in range(13)]],
                      0.003, 6, cap=False), "brass", smooth=True)
    return p, g


CFG.update(body=body, head=head, props=[("rod", "arm_r", rod), ("tackle_box", "arm_l", tackle_box)],
           closeup_z=0.98, shots=[("rod", (-0.45, -0.35, 0.72), -55, 8, 2.2)])


def main():
    return vc.build("fisher", CFG)


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
