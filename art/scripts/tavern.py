"""The Sleepy Serpent tavern, built in 12 cumulative stages (stage_01 .. stage_12).

Run in Blender:  exec(open(r"...\\art\\scripts\\tavern.py").read(), {"__file__": path})
or headless:     blender -b -P tavern.py
Set RENDER_STAGES = False to skip the 12 stage renders while iterating.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_box, bm_cyl, bm_prism, bm_slab, bm_tube, bm_lathe, bm_ico, jitter, add_lantern
from mathutils import Matrix, Vector

RENDER_STAGES = globals().get("RENDER_STAGES", True)

# ------------------------------------------------------------------ dimensions
FL = 0.6                 # floor top
WX, WY = 3.82, 2.82      # wall centre lines (posts sit on the corners)
PH = 0.23                # half post size
SPAN = {"front": WX - PH, "back": WX - PH, "left": WY - PH, "right": WY - PH}
SILL = (FL, FL + 0.24)
GIRT = (3.12, 3.38)
PLATE = (5.22, 5.48)
ZONES = [(SILL[1], GIRT[0]), (GIRT[1], PLATE[0])]
RIDGE_Z = 8.0            # roof underside at the ridge
EAVE_OVH = 0.55
GABLE_OVH = 0.47

DOOR = (-0.7, 0.7, FL, 3.0)
OPENINGS = {
    "front": [DOOR, (-2.75, -1.65, 1.5, 2.6), (1.65, 2.75, 1.5, 2.6),
              (-2.75, -1.65, 3.75, 4.8), (-0.5, 0.5, 3.75, 4.8), (1.65, 2.75, 3.75, 4.8)],
    "back": [(-2.6, -1.5, 1.5, 2.6), (1.5, 2.6, 1.5, 2.6), (-2.6, -1.5, 3.75, 4.8), (1.5, 2.6, 3.75, 4.8)],
    "left": [(0.9, 1.9, 1.5, 2.6), (0.9, 1.9, 3.75, 4.8)],
    "right": [(-0.55, 0.55, 1.5, 2.6), (-0.55, 0.55, 3.75, 4.8)],
}
CHIMNEY_U = (-1.65, -0.35)   # on the left wall (u = -y), toward the back


def side_matrix(side):
    """Local (u, w, z): u = viewer's right when facing the wall from outside, w = outward."""
    if side == "front":
        U, N, P = (1, 0, 0), (0, -1, 0), (0, -WY, 0)
    elif side == "back":
        U, N, P = (-1, 0, 0), (0, 1, 0), (0, WY, 0)
    elif side == "left":
        U, N, P = (0, -1, 0), (-1, 0, 0), (-WX, 0, 0)
    else:
        U, N, P = (0, 1, 0), (1, 0, 0), (WX, 0, 0)
    m = Matrix(((U[0], N[0], 0, P[0]), (U[1], N[1], 0, P[1]), (U[2], N[2], 1, P[2]), (0, 0, 0, 1)))
    return m


def wadd(part, side, bm, matname, local=None):
    part.add(bm, matname, side_matrix(side) @ (local or Matrix()))


def wbox(part, side, u0, u1, z0, z1, depth, off, matname, bevel=0.0):
    wadd(part, side, bm_box(u1 - u0, depth, z1 - z0, bevel=bevel), matname,
         M(((u0 + u1) / 2, off, (z0 + z1) / 2)))


def brace(part, side, u0, z0, u1, z1, w=0.16, depth=0.2, off=0.04, matname="wood_dark"):
    du, dz = u1 - u0, z1 - z0
    length = math.hypot(du, dz)
    ang = math.degrees(math.atan2(dz, du))
    wadd(part, side, bm_box(length + w * 0.6, depth, w), matname,
         M(((u0 + u1) / 2, off, (z0 + z1) / 2), (0, -ang, 0)))


# ------------------------------------------------------------------ stages

def stage_01(p, rnd):
    # cleared dirt patch: a soft rounded rectangle, a bit wider in front for the step
    pts = []
    for i in range(36):
        a = 2 * math.pi * i / 36
        c, s = math.cos(a), math.sin(a)
        n = 4.0
        rx, ry = 5.3, (4.6 if s < 0 else 3.9)
        r = 1.0 / ((abs(c) ** n + abs(s) ** n) ** (1 / n))
        r *= 1 + rnd.uniform(-0.035, 0.035)
        pts.append((c * r * rx, s * r * ry))
    p.add(bm_slab(pts, 0.03), "dirt")
    # survey stakes in the corners (hidden inside the stone ring from stage 2 on)
    corners = [(-3.95, -2.95), (3.95, -2.95), (3.95, 2.95), (-3.95, 2.95)]
    for x, y in corners:
        p.box((0.09, 0.09, 0.36), (x, y, 0.18), "wood_light", bevel=0.01)
        p.cyl(0.064, 0.1, (x, y, 0.36), "wood_light", r2=0.0, segs=4, rot=(0, 0, 45))
        p.add(bm_prism([(0, 0), (0.26, -0.07), (0, -0.15)], 0.015), "cloth", M((x + 0.045, y, 0.47)))
    for (x0, y0), (x1, y1) in zip(corners, corners[1:] + corners[:1]):
        length = math.hypot(x1 - x0, y1 - y0)
        ang = math.degrees(math.atan2(y1 - y0, x1 - x0))
        p.box((length, 0.026, 0.026), ((x0 + x1) / 2, (y0 + y1) / 2, 0.3), "white", rot=(0, 0, ang))
    # the plan, weighed down with two pebbles, and its rolled-up twin
    p.box((0.7, 0.5, 0.012), (-2.3, -1.5, 0.04), "white", rot=(0, 0, 8))
    for i, (dx, dy) in enumerate(((-0.3, -0.2), (0.28, 0.2))):
        p.add(jitter(bm_ico(0.06, 0), 0.015, 40 + i), "stone_mid", M((-2.3 + dx, -1.5 + dy, 0.07)))
    for k in range(3):
        p.box((0.45 - 0.1 * k, 0.012, 0.004), (-2.33, -1.62 + 0.11 * k, 0.047), "tunic", rot=(0, 0, 8))
    p.cyl(0.06, 0.6, (-1.5, -1.95, 0.07), "white", segs=8, rot=(0, 90, 20))
    p.cyl(0.065, 0.06, (-1.25, -1.86, 0.07), "cloth", segs=8, rot=(0, 90, 20))
    # mallet and a bundle of spare stakes
    p.cyl(0.03, 0.55, (2.0, -1.8, 0.05), "wood_light", segs=6, rot=(0, 90, -25))
    p.box((0.16, 0.26, 0.16), (2.5, -2.05, 0.09), "wood_mid", rot=(0, 0, -25), bevel=0.02)
    for i in range(4):
        p.box((0.6, 0.06, 0.06), (2.4, -1.15 + 0.07 * i, 0.04 + 0.02 * (i % 2)), "wood_light", rot=(0, 0, 5))
    p.box((0.03, 0.34, 0.1), (2.4, -1.05, 0.06), "white", rot=(0, 0, 5))
    # a few pebbles inside the plot
    for i in range(7):
        x, y = rnd.uniform(-3.4, 3.4), rnd.uniform(-2.4, 2.4)
        p.add(jitter(bm_ico(rnd.uniform(0.06, 0.12), 0), 0.02, i), "stone_light", M((x, y, 0.04), scale=(1.2, 1, 0.6)))


def stage_02(p, rnd):
    """Stone foundation ring: two staggered courses of chunky blocks around a core."""
    FX, FY, T, H = 4.2, 3.2, 0.56, 0.5
    cols = ["stone", "stone", "stone_mid", "stone_light"]
    # core so no gaps show between blocks
    p.box((2 * FX - 0.1, T - 0.1, H - 0.02), (0, -FY + T / 2, H / 2 - 0.01), "stone_dark")
    p.box((2 * FX - 0.1, T - 0.1, H - 0.02), (0, FY - T / 2, H / 2 - 0.01), "stone_dark")
    p.box((T - 0.1, 2 * FY - 0.1, H - 0.02), (-FX + T / 2, 0, H / 2 - 0.01), "stone_dark")
    p.box((T - 0.1, 2 * FY - 0.1, H - 0.02), (FX - T / 2, 0, H / 2 - 0.01), "stone_dark")
    runs = [  # (axis, fixed, start, end)
        ("x", -FY + T / 2, -FX, FX), ("x", FY - T / 2, -FX, FX),
        ("y", -FX + T / 2, -FY + T, FY - T), ("y", FX - T / 2, -FY + T, FY - T)]
    for course in range(2):
        z = 0.125 + course * 0.25
        for axis, fixed, a, b in runs:
            t = a
            first = True
            while t < b - 0.05:
                ln = rnd.uniform(0.55, 0.95) * (0.5 if (first and course == 1) else 1)
                first = False
                ln = min(ln, b - t)
                if b - (t + ln) < 0.3:
                    ln = b - t
                c = t + ln / 2
                g = 0.03
                sz = (ln - g, T + rnd.uniform(-0.02, 0.04), 0.25 - g)
                inset = rnd.uniform(-0.015, 0.015)
                if axis == "x":
                    p.box(sz, (c, fixed + inset, z), rnd.choice(cols), bevel=0.05)
                else:
                    p.box((sz[1], sz[0], sz[2]), (fixed + inset, c, z), rnd.choice(cols), bevel=0.05)
                t += ln
    # leftover stones waiting inside the ring (covered by the floor at stage 3)
    for i, (x, y) in enumerate([(-1.2, 0.6), (-0.7, 0.9), (-0.95, 0.3), (1.6, -0.8)]):
        p.box((0.5, 0.32, 0.22), (x, y, 0.11 + (0.2 if i == 2 else 0)), rnd.choice(cols), rot=(0, 0, rnd.uniform(-30, 30)), bevel=0.04)


def stage_03(p, rnd):
    """Floor planks running left-right, resting on the foundation."""
    rows = 19
    y0, y1 = -3.06, 3.06
    w = (y1 - y0) / rows
    for r in range(rows):
        y = y0 + w * (r + 0.5)
        x = -4.06
        cuts = sorted(rnd.uniform(-2.8, 2.8) for _ in range(rnd.choice([1, 2])))
        for x_end in cuts + [4.06]:
            if x_end - x < 0.6:
                continue
            col = rnd.choice(["wood", "wood", "wood", "wood_light", "wood_light", "wood_mid"])
            p.box((x_end - x - 0.025, w - 0.025, 0.1), ((x + x_end) / 2, y, 0.55 + rnd.uniform(-0.006, 0.006)), col, bevel=0.018)
            x = x_end


def stage_04(p, rnd):
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box((2 * PH, 2 * PH, PLATE[1] - FL), (sx * WX, sy * WY, (FL + PLATE[1]) / 2), "wood_dark", bevel=0.04)
            # little stone pad under each post
            p.box((0.62, 0.62, 0.06), (sx * WX, sy * WY, FL + 0.03), "stone_light", bevel=0.02)


def stage_05(p, rnd):
    """Wall frame: sills, girts, wall plates, door posts, knee braces, joists."""
    for side, span in SPAN.items():
        sills = [(-span, -0.9), (0.9, span)] if side == "front" else [(-span, span)]
        for u0, u1 in sills:
            wbox(p, side, u0, u1, *SILL, 0.32, 0.0, "wood_dark", 0.03)
        wbox(p, side, -span, span, *GIRT, 0.32, 0.0, "wood_dark", 0.03)
        wbox(p, side, -span, span, *PLATE, 0.32, 0.0, "wood_dark", 0.03)
        # knee braces by the corner posts
        for zb, zt in ZONES:
            for s in (-1, 1):
                brace(p, side, s * (span - 0.02), zt - 0.68, s * (span - 0.62), zt - 0.02)
    # door posts and lintel
    for s in (-1, 1):
        wbox(p, "front", s * 0.7, s * 0.9, FL, GIRT[0], 0.3, 0.02, "wood_dark", 0.02)
    wbox(p, "front", -0.9, 0.9, DOOR[3], GIRT[0], 0.3, 0.02, "wood_dark", 0.02)
    # upper floor joists, ends poking out of the front and back walls
    for x in [-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0]:
        p.box((0.18, 2 * WY + 0.5, 0.2), (x, 0, 3.25), "wood_mid", bevel=0.025)
    n = 9
    for i in range(n):
        y = -WY + PH + (2 * (WY - PH)) * (i + 0.5) / n
        p.box((2 * (WX - PH) - 0.02, 2 * (WY - PH) / n - 0.03, 0.06), (0, y, 3.38), rnd.choice(["wood", "wood_light"]))


def openings_plaster(p, side):
    span = SPAN[side]
    ops = OPENINGS[side]
    for zb, zt in ZONES:
        xs = {-span, span}
        for u0, u1, z0, z1 in ops:
            if z1 > zb and z0 < zt:
                xs |= {u0, u1}
        xs = sorted(x for x in xs if -span <= x <= span)
        for a, b in zip(xs, xs[1:]):
            mid = (a + b) / 2
            holes = sorted((max(z0, zb), min(z1, zt)) for u0, u1, z0, z1 in ops
                           if u0 < mid < u1 and z1 > zb and z0 < zt)
            z = zb
            for h0, h1 in holes + [(zt, zt)]:
                if h0 - z > 0.01:
                    wbox(p, side, a, b, z, h0, 0.16, -0.04, "plaster")
                z = max(z, h1)


def stage_06(p, rnd):
    """Plaster panels with half-timber framing; door and window holes left open."""
    for side, span in SPAN.items():
        openings_plaster(p, side)
        ops = OPENINGS[side]
        for u0, u1, z0, z1 in ops:
            if (u0, u1, z0, z1) == DOOR:
                continue
            zb, zt = ZONES[0] if z1 < GIRT[0] else ZONES[1]
            for uu in (u0 - 0.11, u1):
                wbox(p, side, uu, uu + 0.11, zb, zt, 0.2, 0.04, "wood_dark")
            wbox(p, side, u0, u1, z0 - 0.1, z0, 0.2, 0.04, "wood_dark")
            wbox(p, side, u0, u1, z1, z1 + 0.1, 0.2, 0.04, "wood_dark")
        # braces / studs in the blank bays
        for zb, zt in ZONES:
            edges = [(-span + 0.62, -span + 0.62)]  # knee brace area kept clear
            for u0, u1, z0, z1 in ops:
                if z1 > zb and z0 < zt:
                    edges.append((u0 - 0.11, u1 + 0.11) if (u0, u1, z0, z1) != DOOR else (-0.9, 0.9))
            edges.append((span - 0.62, span - 0.62))
            if side == "left":
                edges.append(CHIMNEY_U)
            edges.sort()
            for (_, a), (b, _) in zip(edges, edges[1:]):
                width = b - a
                if width < 1.0:
                    continue
                if width > 2.2:
                    m = (a + b) / 2
                    wbox(p, side, m - 0.06, m + 0.06, zb, zt, 0.2, 0.04, "wood_dark")
                    brace(p, side, a + 0.08, zb + 0.08, m - 0.08, zt - 0.08)
                    brace(p, side, b - 0.08, zb + 0.08, m + 0.08, zt - 0.08)
                else:
                    if a < 0:
                        brace(p, side, a + 0.08, zb + 0.08, b - 0.08, zt - 0.08)
                    else:
                        brace(p, side, b - 0.08, zb + 0.08, a + 0.08, zt - 0.08)


def arch_top(u, r=0.7, zc=2.3):
    return zc + math.sqrt(max(r * r - u * u, 0.0))


def stage_07(p, rnd):
    """Rounded green door, arch spandrels, stone steps, iron hinges."""
    u0, u1, zb, zt = DOOR
    r, zc = 0.7, zt - 0.7
    # spandrels (plaster) above the arch
    for s in (-1, 1):
        pts = [(s * r, zc), (s * r, zt), (0.0, zt)] + [(s * r * k / 8, arch_top(s * r * k / 8)) for k in range(1, 8)]
        wadd(p, "front", bm_prism(pts, 0.16), "plaster", M((0, -0.04, 0)))
    # arch trim
    arc = [(r * math.cos(math.pi * k / 10), 0.1, zc + r * math.sin(math.pi * k / 10)) for k in range(11)]
    wadd(p, "front", bm_tube(arc, 0.07, 6, cap=True), "wood_dark")
    # backing + four planks with tiny gaps
    back = [(u0, zb), (u1, zb)] + [(r * math.cos(math.pi * k / 12), zc + r * math.sin(math.pi * k / 12)) for k in range(13)]
    wadd(p, "front", bm_prism(back, 0.06), "wood_dark", M((0, -0.06, 0)))
    n = 4
    w = (u1 - u0) / n
    for i in range(n):
        a, b = u0 + i * w + 0.012, u0 + (i + 1) * w - 0.012
        top = [(b, arch_top(b))] + [(b - (b - a) * k / 4, arch_top(b - (b - a) * k / 4)) for k in range(1, 4)] + [(a, arch_top(a))]
        pts = [(a, zb + 0.01), (b, zb + 0.01)] + top
        wadd(p, "front", bm_prism(pts, 0.08), "door", M((0, 0.0, 0)))
    # hinges and ring handle
    for z in (1.15, 2.35):
        wbox(p, "front", -0.66, 0.15, z - 0.04, z + 0.04, 0.03, 0.055, "iron")
        wadd(p, "front", bm_cyl(0.06, 0.06, 0.03, 8), "iron", M((0.15, 0.04, z), (90, 0, 0)))
    wadd(p, "front", bm_tube([(0.42 + 0.07 * math.cos(2 * math.pi * k / 10), 0.07,
                               1.75 + 0.07 * math.sin(2 * math.pi * k / 10)) for k in range(11)], 0.014, 5), "iron")
    wadd(p, "front", bm_cyl(0.035, 0.035, 0.04, 8), "iron", M((0.42, 0.05, 1.83), (90, 0, 0)))
    # little round peek window
    wadd(p, "front", bm_cyl(0.14, 0.14, 0.05, 12), "wood_dark", M((0, 0.07, 2.45), (90, 0, 0)))
    wadd(p, "front", bm_cyl(0.1, 0.1, 0.05, 12), "glass", M((0, 0.08, 2.45), (90, 0, 0)))
    wbox(p, "front", -0.1, 0.1, 2.43, 2.47, 0.02, 0.105, "wood_dark")
    wbox(p, "front", -0.02, 0.02, 2.35, 2.55, 0.02, 0.105, "wood_dark")
    # stone steps
    p.box((1.9, 0.42, 0.6), (0, -3.41, 0.3), "stone", bevel=0.05)
    p.box((2.2, 0.45, 0.3), (0, -3.82, 0.15), "stone_light", bevel=0.05)
    p.box((1.55, 0.36, 0.04), (0, -3.38, 0.62), "stone_light", bevel=0.015)


def window(p, side, op, rnd, shutters=False, flowers=False):
    u0, u1, z0, z1 = op
    w, h = u1 - u0, z1 - z0
    f = 0.08
    for uu in (u0, u1 - f):
        wbox(p, side, uu, uu + f, z0, z1, 0.24, 0.0, "wood_light")
    for zz in (z0, z1 - f):
        wbox(p, side, u0, u1, zz, zz + f, 0.24, 0.0, "wood_light")
    wbox(p, side, u0 + f, u1 - f, z0 + f, z1 - f, 0.03, -0.02, "glass")
    um, zm = (u0 + u1) / 2, (z0 + z1) / 2
    wbox(p, side, um - 0.03, um + 0.03, z0 + f, z1 - f, 0.1, 0.0, "wood_light")
    wbox(p, side, u0 + f, u1 - f, zm - 0.03, zm + 0.03, 0.1, 0.0, "wood_light")
    # sill
    wbox(p, side, u0 - 0.1, u1 + 0.1, z0 - 0.09, z0 + 0.01, 0.42, 0.1, "wood_light", 0.02)
    if shutters:
        sw = w / 2 + 0.02
        for s, edge in ((-1, u0 - 0.11), (1, u1 + 0.11)):
            cu = edge + s * sw / 2
            open_ang = 18
            # hinge at the inner edge, swung a little open (outward)
            loc = M((edge, 0.2, zm), (0, 0, -s * open_ang)) @ M((s * sw / 2, 0, 0))
            wadd(p, side, bm_box(sw, 0.05, h + 0.04), "door", loc)
            for zz in (zm - h * 0.3, zm + h * 0.3):
                wadd(p, side, bm_box(sw * 0.9, 0.03, 0.07), "wood_dark",
                     M((edge, 0.2, zz), (0, 0, -s * open_ang)) @ M((s * sw / 2, -0.035, 0)))
            wadd(p, side, bm_box(sw * 0.75, 0.03, 0.06), "wood_dark",
                 M((edge, 0.2, zm), (0, 0, -s * open_ang)) @ M((s * sw / 2, -0.035, 0), (0, 40 * s, 0)))
    if flowers:
        bw = w + 0.3
        wbox(p, side, um - bw / 2, um + bw / 2, z0 - 0.42, z0 - 0.12, 0.3, 0.25, "wood_mid", 0.02)
        wbox(p, side, um - bw / 2 - 0.02, um + bw / 2 + 0.02, z0 - 0.15, z0 - 0.1, 0.34, 0.25, "wood_dark", 0.01)
        petals = ["petal_pink", "petal_white", "petal_yellow", "cloth", "petal_purple"]
        k = 0
        for i in range(6):
            uu = um - bw / 2 + 0.12 + i * (bw - 0.24) / 5
            wadd(p, side, jitter(bm_ico(0.13, 1), 0.02, i), rnd.choice(["grass", "grass_dark"]),
                 M((uu, 0.25 + rnd.uniform(-0.04, 0.04), z0 - 0.08), scale=(1.1, 0.9, 0.8)))
        for i in range(7):
            uu = um - bw / 2 + 0.1 + i * (bw - 0.2) / 6
            wadd(p, side, bm_ico(0.055, 0), petals[k % len(petals)],
                 M((uu, 0.3 + rnd.uniform(-0.08, 0.06), z0 + rnd.uniform(0.0, 0.08))))
            k += 1


def stage_08(p, rnd):
    for side, ops in OPENINGS.items():
        for op in ops:
            if op == DOOR:
                continue
            front = side == "front"
            window(p, side, op, rnd, shutters=front and op[0] != -0.5, flowers=front and (op[2] < 3 or op[0] == -0.5))


def stage_09(p, rnd):
    """Big red tiled gable roof (ridge left-right), gable walls, barge boards."""
    y_wall = WY + 0.16
    slope = (RIDGE_Z - PLATE[1]) / y_wall
    th = math.atan(slope)
    eave_y = y_wall + EAVE_OVH
    eave_z = PLATE[1] - EAVE_OVH * slope
    L = math.hypot(eave_y, RIDGE_Z - eave_z)
    xh = WX + PH + GABLE_OVH
    tile_cols = ["roof"] * 6 + ["cloth"] * 2 + ["roof_dark"] * 2
    for s in (-1, 1):   # -1 front slope, +1 back slope
        rot = (math.degrees(th) * -s, 0, 0)
        d = Vector((0, -s * math.cos(th), math.sin(th)))
        n = Vector((0, s * math.sin(th), math.cos(th)))
        E = Vector((0, s * eave_y, eave_z))
        c = E + d * (L / 2) + n * 0.07
        p.add(bm_box(2 * xh, L + 0.06, 0.14), "roof_dark", M(c, rot))
        # tile rows, eave to ridge, staggered
        pitch, tw = 0.42, 0.56
        rows = int((L - 0.35) / pitch) + 1
        for r in range(rows):
            off = 0 if r % 2 == 0 else tw / 2
            x = -xh - off
            while x < xh - 0.01:
                a, b = max(x, -xh), min(x + tw, xh)
                if b - a > 0.12:
                    pos = E + d * (0.05 + r * pitch + 0.25) + n * (0.17 + rnd.uniform(-0.01, 0.01))
                    pos.x = (a + b) / 2
                    tilt = 8 + rnd.uniform(-2, 2)
                    rr = (math.degrees(th) * -s + tilt * s, rnd.uniform(-2, 2), rnd.uniform(-1.5, 1.5))
                    p.add(bm_box(b - a - 0.035, 0.5, 0.07), rnd.choice(tile_cols), M(pos, rr))
                x += tw
        # eave board
        p.add(bm_box(2 * xh + 0.04, 0.12, 0.26), "wood_dark", M(E + n * 0.06 + d * 0.02, rot))
    # ridge caps
    x = -xh - 0.05
    while x < xh:
        p.cyl(0.19, 0.48, (x + 0.02, 0, RIDGE_Z + 0.2), "roof_dark", segs=6, rot=(0, 90, 0))
        x += 0.5
    for sx in (-1, 1):
        # barge boards along the gable slopes
        for s in (-1, 1):
            d = Vector((0, -s * math.cos(th), math.sin(th)))
            n = Vector((0, s * math.sin(th), math.cos(th)))
            E = Vector((sx * (xh + 0.04), s * eave_y, eave_z))
            p.add(bm_box(0.1, L + 0.1, 0.32, bevel=0.02), "wood_dark",
                  M(E + d * (L / 2) + n * 0.08, (math.degrees(th) * -s, 0, 0)))
        # finial
        p.add(bm_box(0.12, 0.12, 0.5, bevel=0.02), "wood_dark", M((sx * (xh + 0.04), 0, RIDGE_Z + 0.4)))
        p.ball(0.09, (sx * (xh + 0.04), 0, RIDGE_Z + 0.7), "wood_dark", subdiv=1, smooth=False)
    # gable walls: plaster triangles with a king post, collar and a round attic window
    for side in ("left", "right"):
        pts = [(-y_wall + 0.02, PLATE[1]), (y_wall - 0.02, PLATE[1]), (0, RIDGE_Z - 0.02)]
        wadd(p, side, bm_prism(pts, 0.16), "plaster", M((0, -0.04, 0)))
        z_c = 6.95
        half = (RIDGE_Z - z_c) / slope
        wbox(p, side, -half, half, z_c - 0.08, z_c + 0.08, 0.2, 0.04, "wood_dark", 0.02)
        wbox(p, side, -0.08, 0.08, z_c + 0.08, RIDGE_Z - 0.1, 0.2, 0.04, "wood_dark", 0.02)
        for sgn in (-1, 1):
            brace(p, side, sgn * 1.9, PLATE[1] + 0.05, sgn * 0.5, z_c - 0.08)
        if True:  # round attic window on both gables
            wadd(p, side, bm_cyl(0.34, 0.34, 0.24, 14), "wood_light", M((0, -0.06, 6.15), (-90, 0, 0)))
            wadd(p, side, bm_cyl(0.25, 0.25, 0.22, 14), "glass", M((0, -0.07, 6.15), (-90, 0, 0)))
            wbox(p, side, -0.25, 0.25, 6.12, 6.18, 0.04, 0.15, "wood_light")
            wbox(p, side, -0.03, 0.03, 5.9, 6.4, 0.04, 0.15, "wood_light")


def stage_10(p, rnd):
    """Stone chimney on the left gable, from the ground up through the eaves."""
    cx = -(WX + PH + 0.42)
    cy = -(CHIMNEY_U[0] + CHIMNEY_U[1]) / 2
    cols = ["stone", "stone_mid", "stone_light", "stone", "stone_dark"]
    z, top, k = 0.0, 9.0, 0
    while z < top - 0.05:
        h = min(rnd.uniform(0.38, 0.5), top - z)
        if top - z - h < 0.25:
            h = top - z
        if z < 2.2:
            wx, wy = 0.95, 1.25
        elif z < 2.9:
            f = (z - 2.2) / 0.7
            wx, wy = 0.95 - 0.2 * f, 1.25 - 0.35 * f
        else:
            wx, wy = 0.75, 0.9
        cxx = cx + (0.95 - wx) / 2           # keep the inner face against the wall
        m = -wy / 2 + wy * (rnd.uniform(0.3, 0.45) if k % 2 else rnd.uniform(0.55, 0.7))
        for a, b in ((-wy / 2, m), (m, wy / 2)):
            p.box((wx + rnd.uniform(0.0, 0.06), b - a - 0.03, h - 0.03),
                  (cxx + rnd.uniform(-0.02, 0.02), cy + (a + b) / 2, z + h / 2), rnd.choice(cols), bevel=0.045)
        p.box((wx - 0.12, wy - 0.12, h), (cxx, cy, z + h / 2), "stone_dark")
        z += h
        k += 1
    p.box((0.95, 1.1, 0.16), (cx + 0.1, cy, top + 0.08), "stone_light", bevel=0.04)
    for dy in (-0.2, 0.22):
        p.add(bm_lathe([(0.13, 0), (0.12, 0.2), (0.15, 0.24), (0.15, 0.3), (0.1, 0.3)], 10, cap_top=True),
              "roof", M((cx + 0.1, cy + dy, top + 0.16)))


def stage_11(p, rnd):
    """Two lanterns by the door, and the iron/timber bracket for the hanging sign."""
    for s in (-1, 1):
        x = s * 1.12
        y = -WY - 0.12
        p.box((0.12, 0.14, 0.26), (x, y - 0.03, 2.42), "wood_dark", bevel=0.02)
        p.add(bm_tube([(x, y - 0.05, 2.42), (x, y - 0.36, 2.42), (x, y - 0.44, 2.36)], 0.03, 6), "iron")
        add_lantern(p, (x, y - 0.44, 1.62), 1.4, hang=True)
    # sign bracket off the front-left corner post
    px, py = -WX - PH, -WY
    z = 3.55
    p.box((1.55, 0.14, 0.16), (px - 0.75, py - 0.05, z), "wood_dark", bevel=0.025)
    p.add(bm_tube([(px - 0.02, py - 0.05, z - 0.85), (px - 0.55, py - 0.05, z - 0.25), (px - 0.95, py - 0.05, z - 0.08)],
                  0.035, 6), "iron")
    p.add(bm_tube([(px - 1.5 + 0.12 * math.cos(a / 6 * math.pi), py - 0.05, z + 0.17 + 0.1 * math.sin(a / 6 * math.pi))
                   for a in range(0, 12)], 0.025, 5, cap=True), "iron")
    for hx in (px - 0.38, px - 1.28):
        p.box((0.05, 0.05, 0.08), (hx, py - 0.05, z - 0.12), "iron")


def stage_12(p, rnd):
    """Hanging sleepy-snake sign, barrels, bench, crate and potted plants."""
    px, py = -WX - PH, -WY - 0.05
    sx, sz = px - 0.83, 2.7           # sign centre
    w, h = 1.4, 0.95
    # chains
    for hx in (px - 0.38, px - 1.28):
        for i in range(3):
            p.box((0.02, 0.05 if i % 2 else 0.02, 0.1), (hx, py, 3.38 - i * 0.09), "iron")
    def rounded(wd, ht, r, n=4):
        pts = []
        for cxs, czs, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
            for k in range(n + 1):
                a = math.radians(a0 + 90 * k / n)
                pts.append((cxs * (wd / 2 - r) + r * math.cos(a), czs * (ht / 2 - r) + r * math.sin(a)))
        return pts
    p.add(bm_prism(rounded(w + 0.12, h + 0.12, 0.14), 0.07), "wood_dark", M((sx, py, sz)))
    p.add(bm_prism(rounded(w, h, 0.1), 0.1), "wood_light", M((sx, py, sz)))
    # the sleepy serpent, drawn in sign-local space (front face at y=0) then scaled onto the board
    art = Part("sign_art")
    path, radii = [], []
    turns, N = 1.55, 22
    for i in range(N + 1):
        t = i / N
        a = -math.pi / 2 + t * turns * 2 * math.pi
        r = 0.05 + 0.2 * t
        path.append((-0.12 + r * math.cos(a), -0.01, -0.06 + r * math.sin(a) * 0.82))
        radii.append(0.022 + 0.04 * t)
    path += [(0.16, -0.01, 0.08), (0.26, -0.01, 0.12)]
    radii += [0.064, 0.066]
    bm = bm_tube(path, radii, 7)
    for v in bm.verts:
        v.co.y = -0.01 + (v.co.y + 0.01) * 0.55
    art.add(bm, "pip", smooth=True)
    hx, hz = 0.33, 0.13
    art.ball(0.11, (hx, -0.02, hz), "pip", scale=(1.25, 0.6, 0.95), subdiv=2)
    for ex in (hx - 0.03, hx + 0.07):     # closed sleepy eyes
        arc = [(ex + 0.025 * math.cos(math.pi + math.pi * k / 4), -0.085,
                hz + 0.02 + 0.018 * math.sin(math.pi + math.pi * k / 4)) for k in range(5)]
        art.add(bm_tube(arc, 0.009, 4), "ink")
    art.ball(0.022, (hx + 0.12, -0.07, hz - 0.035), "blush", scale=(1.3, 0.5, 1), subdiv=1)
    art.add(bm_cyl(0.085, 0.08, 0.2, 8), "cloth", M((hx - 0.02, -0.03, hz + 0.08), (0, -35, 0)))   # night cap
    art.ball(0.03, (hx - 0.135, -0.03, hz + 0.24), "white", subdiv=1)
    art.add(bm_cyl(0.09, 0.09, 0.035, 10), "white", M((hx - 0.02, -0.03, hz + 0.07), (0, -35, 0)))
    def zee(cx, cz, s):
        pts = [(-1, 1), (1, 1), (1, 0.6), (-0.35, -0.6), (1, -0.6), (1, -1), (-1, -1), (-1, -0.6), (0.35, 0.6), (-1, 0.6)]
        art.add(bm_prism([(x * s, y * s) for x, y in pts], 0.03), "white", M((cx, -0.02, cz)))
    zee(-0.4, 0.25, 0.06)
    zee(-0.26, 0.14, 0.04)
    p.merge(art, M((sx + 0.02, py - 0.055, sz - 0.02), scale=1.3))
    # barrels in the front-left corner, under the sign
    def barrel(x, y, z=0.0, s=1.0, rz=0):
        prof = [(0.28, 0), (0.33, 0.18), (0.355, 0.4), (0.33, 0.62), (0.28, 0.8)]
        p.add(bm_lathe([(r * s, zz * s) for r, zz in prof], 12), "wood", M((x, y, z), (0, 0, rz)))
        p.cyl(0.25 * s, 0.03 * s, (x, y, z + 0.79 * s), "wood_mid", segs=12)
        for hz, hr in ((0.13, 0.322), (0.67, 0.322)):
            p.cyl(hr * s, 0.06 * s, (x, y, z + (hz - 0.03) * s), "iron", segs=12)
    barrel(-3.55, -3.75)
    barrel(-2.95, -3.65, s=0.85, rz=10)
    barrel(-3.3, -3.65, z=0.8, s=0.7)
    # crate by the right corner, with a little sack on it
    def crate(x, y, z, s, rz):
        base = M((x, y, z + s / 2), (0, 0, rz))
        p.add(bm_box(s, s, s, bevel=0.02), "wood_light", base)
        for a in (-1, 1):
            for b in (-1, 1):
                p.add(bm_box(0.07, 0.07, s + 0.01), "wood_mid", base @ M((a * (s / 2 - 0.03), b * (s / 2 - 0.03), 0)))
        for fs in (-1, 1):
            for ang in (45, -45):
                p.add(bm_box(s * 1.2, 0.03, 0.07), "wood_mid", base @ M((0, fs * s / 2, 0), (0, ang, 0)))
    crate(3.55, -3.65, 0, 0.62, 8)
    crate(3.45, -3.0 - 0.6, 0.62, 0.42, -12)
    # bench under the right window
    bx, by = 2.45, -3.6
    p.box((1.4, 0.42, 0.09), (bx, by, 0.46), "wood", bevel=0.02)
    for lx in (-0.52, 0.52):
        p.box((0.1, 0.36, 0.42), (bx + lx, by, 0.21), "wood_mid", bevel=0.015)
    p.box((1.1, 0.06, 0.08), (bx, by, 0.18), "wood_mid")
    # potted plants flanking the steps
    for s in (-1, 1):
        x, y = s * 1.38, -3.6
        p.add(bm_lathe([(0.16, 0), (0.22, 0.32), (0.25, 0.34), (0.25, 0.4), (0.2, 0.4)], 10), "roof", M((x, y, 0)))
        p.cyl(0.2, 0.02, (x, y, 0.36), "wood_dark", segs=10)
        for i in range(4):
            a = i * 2.1 + s
            p.add(jitter(bm_ico(0.17, 1), 0.03, i + 10 * s), "grass" if i % 2 else "grass_dark",
                  M((x + 0.1 * math.cos(a), y + 0.1 * math.sin(a), 0.5 + 0.08 * (i % 2)), scale=(1, 1, 0.9)))
        for i in range(4):
            a = i * 1.6 + 0.4
            p.ball(0.05, (x + 0.17 * math.cos(a), y + 0.17 * math.sin(a) - 0.04, 0.62 + 0.04 * (i % 2)),
                   ["petal_pink", "petal_white", "petal_yellow", "cloth"][i], subdiv=0, smooth=False)


STAGES = [stage_01, stage_02, stage_03, stage_04, stage_05, stage_06,
          stage_07, stage_08, stage_09, stage_10, stage_11, stage_12]


def build():
    model = common.reset()
    stage_objs = []
    for i, fn in enumerate(STAGES, 1):
        name = "stage_%02d" % i
        node = common.empty(name, model)
        part = Part(name + "_mesh")
        fn(part, random.Random(1000 + i))
        ob = part.to_object(model, parent=node)
        stage_objs.append((node, ob))
    return stage_objs


def main():
    import bpy
    stage_objs = build()
    meshes = [ob for _, ob in stage_objs]
    counts = {n.name: common.tris([o]) for n, o in stage_objs}
    common.export("tavern.glb")
    common.setup_render()
    out = {}
    if RENDER_STAGES:
        for k in range(1, 13):
            for i, (n, o) in enumerate(stage_objs, 1):
                o.hide_render = i > k
            common.preview_rig(meshes[:k], ground_r=11, azim=-30, elev=24, lens=50, margin=0.86, min_radius=6.4)
            out[k] = common.render(os.path.join(common.OUT_PREV, "tavern_stage_%02d.png" % k))
    for n, o in stage_objs:
        o.hide_render = False
    common.preview_rig(meshes, ground_r=11, azim=-30, elev=22, lens=50, margin=0.86)
    common.render(os.path.join(common.OUT_PREV, "tavern.png"))
    common.save_blend("tavern")
    return {"tris": counts, "total": sum(counts.values())}


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
