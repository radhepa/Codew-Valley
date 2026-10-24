"""Bram's hearth: the outdoor cooking fire beside the Sleepy Serpent (village life: cooking).

A long oval ring of fieldstones with a log fire, an iron cauldron hanging from a fireplace crane on
a timber post (left), an iron grill over the right half for the pan, firewood stacked against the
tavern wall, and a worktable on the right with a chopping board, the pantry crocks (salt, sugar,
oil), bowls and a basket of potatoes. All on a trodden dirt patch.

Origin: the centre of the fire on the ground. Front (-Y) faces the camera; the cook stands behind
the fire (+Y), facing the front, so the pot and the grill are between them and the camera.

Nodes for the game (src/life/cooking/hearth.ts), Blender coordinates (glTF: (x, z, -y)):
  base       everything that never moves
  pot        the cauldron, origin at the crane hook (-0.36, 0, 1.2): it may sway a little
    soup     the surface inside the pot (material `soup`, recoloured per dish), origin at its centre
    pot_mouth  empty at the soup surface: steam and bubbles
  fire_pot   flames under the pot (glow_fire / glow_flame), origin on the embers: flicker / grow
  fire_pan   flames under the grill, same
  embers     glowing embers among the logs (glow_ember)
  grill      empty on top of the grill: where the pan sizzles
  smoke      empty above the fire
"""
import sys, os, math, importlib, random

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import cook_common as cc
importlib.reload(cc)
from cook_common import common, Part, M, bm_box, bm_cyl, bm_ico, bm_tube, jitter, lathe, ring_pts, bezier, frame, rock, log, flame, bowl
import bpy, bmesh
from mathutils import Vector, Matrix

POT = Vector((-0.36, 0.0, 0.0))     # pot axis on the ground
POT_HOOK = 1.2                      # top of the bail
POT_BOTTOM, POT_RIM = 0.44, 0.82
SOUP_Z = 0.745
GRILL = Vector((0.47, 0.0, 0.37))
RX, RY = 0.94, 0.58                 # fire ring radii
POST = Vector((-1.16, 0.14, 0.0))
TABLE = Vector((1.78, 0.18, 0.0))
TABLE_TOP = 0.78


def ground(p):
    # trodden dirt under it all, with a ragged edge
    bm = bm_cyl(1.0, 1.0, 0.02, 28)
    rnd = random.Random(4)
    for v in bm.verts:
        if math.hypot(v.co.x, v.co.y) > 0.5:
            k = 1 + rnd.uniform(-0.09, 0.06)
            v.co.x *= k
            v.co.y *= k
    p.add(bm, "dirt", M((0.2, 0.08, -0.012), scale=(2.45, 1.05, 1)))
    # ash spilled in front of the ring
    p.add(bm_cyl(1.0, 1.0, 0.01, 18), "ash_light", M((0.1, -0.68, 0.0), scale=(0.5, 0.18, 1)))


def fire_ring(p):
    rnd = random.Random(11)
    n = 20
    for i in range(n):
        a = 2 * math.pi * (i + rnd.uniform(-0.15, 0.15)) / n
        x, y = RX * math.cos(a), RY * math.sin(a)
        s = rnd.uniform(0.15, 0.2)
        mat = ("stone_mid", "stone", "stone_dark", "stone_mid", "stone")[i % 5]
        rock(p, (x, y, s * 0.42), (s * 1.2, s, s * 0.78), 100 + i, mat, rot=(0, 0, math.degrees(a) + 90))
    # a second course on the back half, so the fire is held in
    for i in range(8):
        a = math.pi * (0.12 + 0.76 * i / 7)
        x, y = (RX - 0.04) * math.cos(a), (RY - 0.02) * math.sin(a)
        s = rnd.uniform(0.11, 0.15)
        rock(p, (x, y, 0.27 + s * 0.3), (s * 1.25, s, s * 0.7), 140 + i, "stone" if i % 2 else "stone_mid", rot=(0, 0, math.degrees(a) + 90))
    # the bed: ash, charcoal crumbs
    p.add(bm_cyl(1.0, 1.0, 0.035, 26), "ash", M((0, 0, 0), scale=(RX - 0.08, RY - 0.08, 1)))
    for i in range(16):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.1, 0.75)
        p.add(jitter(bm_ico(1, 1), 0.25, 300 + i), "char", M((r * math.cos(a) * RX * 0.95, r * math.sin(a) * RY * 0.9, 0.04), scale=(0.035, 0.03, 0.018)))


def logs(p):
    # under the pot: three logs leaning together
    for ang, ln in ((15, 0.62), (140, 0.58), (255, 0.56)):
        a = math.radians(ang)
        d = Vector((math.cos(a), math.sin(a), 0))
        c = POT + Vector((0, 0, 0.0))
        log(p, c + d * 0.34 + Vector((0, 0, 0.06)), c - d * 0.08 + Vector((0, 0, 0.16)), 0.052, charred=True)
    # under the grill: two logs side by side
    for dy in (-0.09, 0.1):
        log(p, (GRILL.x - 0.28, dy, 0.06), (GRILL.x + 0.3, dy * 0.7, 0.075), 0.05, charred=True)


def embers(p):
    rnd = random.Random(21)
    for i in range(26):
        if i < 15:
            c = POT + Vector((rnd.uniform(-0.22, 0.22), rnd.uniform(-0.2, 0.2), 0))
        else:
            c = GRILL + Vector((rnd.uniform(-0.25, 0.25), rnd.uniform(-0.18, 0.18), 0))
        c.z = rnd.uniform(0.04, 0.1)
        p.add(jitter(bm_ico(1, 1), 0.3, 500 + i), "glow_ember", M(c, scale=(rnd.uniform(0.025, 0.045), rnd.uniform(0.02, 0.035), 0.018)))


def flames(p, centre, big):
    rnd = random.Random(31 if big else 37)
    k = 1.0 if big else 0.75
    spots = [(0, 0, 0.3), (0.12, 0.05, 0.22), (-0.12, -0.04, 0.24), (0.05, -0.12, 0.18), (-0.06, 0.12, 0.19), (0.17, -0.08, 0.15), (-0.17, 0.06, 0.14)]
    for dx, dy, h in spots:
        b = Vector((centre.x + dx * k * 1.15, centre.y + dy * k, 0.07))
        lean = (rnd.uniform(-0.03, 0.03), rnd.uniform(-0.02, 0.02))
        flame(p, b, h * k * 1.25, h * 0.36 * k, "glow_fire", lean)
        flame(p, b + Vector((0, 0, 0.01)), h * k * 0.8, h * 0.22 * k, "glow_flame", lean)


def crane(p):
    # timber post on a few stones
    p.add(bm_box(0.15, 0.15, 1.82, bevel=0.025, segs=2), "wood", M(POST + Vector((0, 0, 0.91))))
    p.add(bm_box(0.19, 0.19, 0.05, bevel=0.015), "wood_mid", M(POST + Vector((0, 0, 1.845))))
    for i, (dx, dy) in enumerate(((-0.12, -0.1), (0.12, -0.11), (0.1, 0.12), (-0.13, 0.1))):
        rock(p, POST + Vector((dx, dy, 0.05)), (0.1, 0.09, 0.07), 60 + i, "stone_mid")
    # iron straps round the post
    for z in (1.05, 1.5):
        p.add(bm_box(0.17, 0.17, 0.035, bevel=0.006), "iron", M(POST + Vector((0, 0, z))))
    # the crane arm: out to the pot, a diagonal brace and a little curl
    x0, x1, zt = POST.x + 0.08, POT.x, 1.48
    p.add(bm_tube([(x0, POST.y * 0.5, zt), (x1 + 0.02, 0.0, zt)], 0.018, 8), "iron", smooth=True)
    p.add(bm_tube([(x0, POST.y * 0.6, 1.07), (x0 + 0.42, 0.03, zt - 0.01)], 0.014, 8), "iron", smooth=True)
    curl = [(x1 + 0.02 + 0.05 * math.cos(t), 0.0, zt + 0.05 + 0.05 * math.sin(t)) for t in [-math.pi / 2 + k * 0.5 for k in range(12)]]
    p.add(bm_tube(curl, 0.011, 6), "iron", smooth=True)
    curl2 = [(x0 + 0.2 + 0.045 * math.cos(t), 0.04, zt - 0.06 + 0.045 * math.sin(t)) for t in [math.pi / 2 + k * 0.5 for k in range(11)]]
    p.add(bm_tube(curl2, 0.009, 6), "iron", smooth=True)
    # S hook and chain down to the bail
    z = zt - 0.02
    for i in range(4):
        zc = z - 0.04 - i * 0.065
        rot = (0, 0, 90 if i % 2 else 0)
        ring = [Vector((0.022 * math.cos(t), 0, 0.036 * math.sin(t))) for t in [2 * math.pi * k / 12 for k in range(13)]]
        m = M((x1, 0, zc), rot)
        p.add(bm_tube([m @ q for q in ring], 0.007, 5, cap=False), "iron", smooth=True)
    # hanging from the arm: a garland of garlic and a bunch of herbs drying
    gx = POST.x + 0.3
    p.add(bm_tube([(gx, 0.03, zt), (gx + 0.01, 0.03, zt - 0.38)], 0.006, 4), "twine", smooth=True)
    rnd = random.Random(5)
    for i in range(5):
        c = Vector((gx + rnd.uniform(-0.03, 0.03), 0.03 + rnd.uniform(-0.03, 0.03), zt - 0.12 - i * 0.07))
        p.add(lathe([(0.0001, -0.045), (0.035, -0.03), (0.045, -0.005), (0.035, 0.02), (0.012, 0.04), (0.0001, 0.055)], 10,
                    rfun=lambda a, z: 0.004 * math.cos(a * 6)), "garlic", M(c, (rnd.uniform(-15, 15), rnd.uniform(-15, 15), 0)), smooth=True)
    hx = POST.x + 0.55
    p.add(bm_tube([(hx, 0.0, zt), (hx, 0.0, zt - 0.14)], 0.005, 4), "twine", smooth=True)
    for i in range(9):
        a = 2 * math.pi * i / 9
        tip = Vector((hx + 0.05 * math.cos(a), 0.05 * math.sin(a), zt - 0.4))
        p.add(bm_tube([(hx, 0, zt - 0.14), tip], [0.005, 0.003], 4), "herb_dark", smooth=True)
        p.add(jitter(bm_ico(1, 1), 0.2, 700 + i), "herb" if i % 2 else "herb_dark", M(tip + Vector((0, 0, 0.05)), scale=(0.03, 0.03, 0.06)))
    p.add(bm_cyl(0.022, 0.022, 0.03, 8), "twine", M((hx, 0, zt - 0.165)))


def pot(p):
    c = POT
    prof = [(0.0001, POT_BOTTOM), (0.12, POT_BOTTOM + 0.005), (0.22, POT_BOTTOM + 0.04), (0.29, POT_BOTTOM + 0.12),
            (0.31, POT_BOTTOM + 0.22), (0.295, POT_BOTTOM + 0.31), (0.278, POT_RIM - 0.03), (0.29, POT_RIM),
            (0.284, POT_RIM + 0.022), (0.262, POT_RIM + 0.018), (0.255, POT_RIM - 0.01), (0.266, SOUP_Z - 0.06), (0.24, SOUP_Z - 0.14)]
    p.add(lathe([(r, z) for r, z in prof], 32), "iron_pot", Matrix.Translation(c), smooth=True)
    # three stubby feet (a pot that can also stand in the embers)
    for i in range(3):
        a = 2 * math.pi * i / 3 + 0.5
        f = c + Vector((0.17 * math.cos(a), 0.17 * math.sin(a), POT_BOTTOM + 0.01))
        p.add(bm_cyl(0.03, 0.022, 0.06, 8), "iron_pot", M(f - Vector((0, 0, 0.055))))
    # a raised band round the belly, and the lugs with the bail handle
    p.add(bm_tube(ring_pts(Matrix.Translation(c + Vector((0, 0, POT_BOTTOM + 0.2))), 0.312, 32), 0.012, 6, cap=False), "iron_warm", smooth=True)
    for s in (-1, 1):
        lug = c + Vector((s * 0.3, 0, POT_RIM - 0.03))
        p.add(bm_box(0.05, 0.04, 0.07, bevel=0.012, segs=2), "iron_pot", M(lug), smooth=True)
    bail = [c + Vector((0.315 * math.cos(t), 0, POT_RIM - 0.02 + (POT_HOOK - POT_RIM + 0.02) * math.sin(t))) for t in [math.pi * k / 20 for k in range(21)]]
    p.add(bm_tube(bail, 0.011, 7), "iron", smooth=True)
    # drips of soup down the outside, and a little rust
    rnd = random.Random(9)
    for i in range(3):
        a = rnd.uniform(-2.2, -0.9)
        top = c + Vector((0.29 * math.cos(a), 0.29 * math.sin(a), POT_RIM - 0.01))
        p.add(bm_tube([top, top + Vector((0.012 * math.cos(a), 0.012 * math.sin(a), -0.05 - 0.03 * i))], [0.008, 0.005], 5), "soup", smooth=True)


def soup(p):
    c = POT + Vector((0, 0, SOUP_Z))
    p.add(bm_cyl(0.262, 0.262, 0.012, 32), "soup", M(c - Vector((0, 0, 0.012))), smooth=True)
    # a few chunks breaking the surface
    rnd = random.Random(12)
    for i in range(7):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(0.04, 0.19)
        mat = ("potato_in", "carrot", "herb", "potato_in", "carrot", "garlic", "potato_in")[i]
        p.add(jitter(bm_box(1, 1, 1), 0.12, 800 + i), mat, M(c + Vector((r * math.cos(a), r * math.sin(a), 0.002)), (rnd.uniform(0, 40), rnd.uniform(0, 40), rnd.uniform(0, 90)), (0.045, 0.04, 0.025)))


def grill(p):
    g = GRILL
    w, d = 0.56, 0.42
    corners = [(g.x - w / 2, g.y - d / 2), (g.x + w / 2, g.y - d / 2), (g.x + w / 2, g.y + d / 2), (g.x - w / 2, g.y + d / 2)]
    loop = [Vector((x, y, g.z)) for x, y in corners + corners[:1]]
    p.add(bm_tube(loop, 0.013, 6, cap=False), "iron", smooth=True)
    for i in range(1, 7):
        x = g.x - w / 2 + w * i / 7
        p.add(bm_tube([(x, g.y - d / 2, g.z), (x, g.y + d / 2, g.z)], 0.008, 5), "iron", smooth=True)
    for x, y in corners:
        p.add(bm_tube([(x, y, g.z), (x + (0.03 if x > g.x else -0.03), y + (0.03 if y > g.y else -0.03), 0.0)], 0.011, 5), "iron", smooth=True)


def woodpile(p):
    # firewood stacked against the tavern wall, on two sleepers
    x0 = POST.x - 0.52
    for dy in (-0.22, 0.24):
        log(p, (x0 - 0.3, dy, 0.035), (x0 + 0.3, dy, 0.035), 0.035, bark="bark_light")
    rnd = random.Random(3)
    rows = [5, 4, 3]
    for ri, n in enumerate(rows):
        for i in range(n):
            x = x0 - 0.27 + (0.54 / 4) * (i + ri * 0.5)
            z = 0.12 + ri * 0.11
            r = 0.058 + rnd.uniform(-0.006, 0.006)
            log(p, (x, -0.32 + rnd.uniform(-0.02, 0.02), z), (x, 0.32 + rnd.uniform(-0.02, 0.02), z), r, bark="bark" if (i + ri) % 2 else "bark_light")
    # a few sticks of kindling leaning on the pile
    for i in range(4):
        x = x0 + 0.33 + 0.03 * i
        p.add(bm_tube([(x, -0.15 + 0.08 * i, 0.0), (x - 0.12, -0.12 + 0.08 * i, 0.42)], 0.012, 5), "bark_light", smooth=True)


def worktable(p):
    t, h = TABLE, TABLE_TOP
    w, d = 0.95, 0.56
    for i in range(3):
        y = t.y - d / 2 + d * (i + 0.5) / 3
        p.add(bm_box(w, d / 3 - 0.012, 0.05, bevel=0.012, segs=2), ("wood_light", "wood", "wood_light")[i], M((t.x, y, h - 0.025)))
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.add(bm_box(0.075, 0.075, h - 0.05, bevel=0.012), "wood_mid", M((t.x + sx * (w / 2 - 0.07), t.y + sy * (d / 2 - 0.06), (h - 0.05) / 2)))
        p.add(bm_box(0.05, d - 0.1, 0.05, bevel=0.01), "wood_mid", M((t.x + sx * (w / 2 - 0.07), t.y, 0.18)))
    p.add(bm_box(w - 0.12, 0.05, 0.05, bevel=0.01), "wood_mid", M((t.x, t.y, 0.18)))
    top = h
    # chopping board with carrot coins and a whole carrot
    bc = Vector((t.x - 0.2, t.y - 0.06, top))
    p.add(bm_box(0.4, 0.27, 0.035, bevel=0.012, segs=2), "board", M(bc + Vector((0, 0, 0.0175))))
    p.add(bm_cyl(0.025, 0.025, 0.036, 10), "board_dark", M(bc + Vector((-0.17, 0, 0.001))))
    rnd = random.Random(8)
    for i in range(6):
        p.add(bm_cyl(0.022, 0.022, 0.012, 10), "carrot", M(bc + Vector((0.05 + rnd.uniform(-0.05, 0.08), rnd.uniform(-0.07, 0.05), 0.036)), (rnd.uniform(-8, 8), rnd.uniform(-8, 8), 0)))
    cr = [bc + Vector((-0.12, 0.07, 0.06)), bc + Vector((0.06, 0.09, 0.055))]
    p.add(bm_tube(cr, [0.024, 0.006], 10), "carrot", smooth=True)
    for k in range(3):
        p.add(bm_tube([cr[0], cr[0] + Vector((-0.06, 0.02 * (k - 1), 0.03))], 0.006, 4), "carrot_top", smooth=True)
    # the pantry: salt crock, sugar jar, oil bottle
    sc = Vector((t.x + 0.22, t.y + 0.15, top))
    p.add(lathe([(0.06, 0), (0.075, 0.03), (0.08, 0.09), (0.07, 0.13), (0.062, 0.14), (0.0001, 0.14)], 20), "crock", Matrix.Translation(sc), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation(sc + Vector((0, 0, 0.1))), 0.077, 20), 0.006, 4, cap=False), "glaze_blue", smooth=True)
    p.add(bm_cyl(0.066, 0.062, 0.025, 16), "wood_light", M(sc + Vector((0, 0, 0.14))))
    p.add(bm_cyl(0.014, 0.014, 0.025, 8), "wood_mid", M(sc + Vector((0, 0, 0.165))))
    sg = Vector((t.x + 0.02, t.y + 0.2, top))
    p.add(lathe([(0.05, 0), (0.06, 0.02), (0.062, 0.1), (0.05, 0.12), (0.0001, 0.12)], 20), "glaze", Matrix.Translation(sg), smooth=True)
    p.add(lathe([(0.055, 0), (0.058, 0.015), (0.03, 0.03), (0.012, 0.04), (0.0001, 0.045)], 20), "glaze_blue", Matrix.Translation(sg + Vector((0, 0, 0.115))), smooth=True)
    ob = Vector((t.x + 0.38, t.y - 0.08, top))
    p.add(lathe([(0.0001, 0), (0.05, 0), (0.055, 0.015), (0.055, 0.11), (0.03, 0.15), (0.018, 0.2), (0.018, 0.22), (0.0001, 0.22)], 16), "bottle", Matrix.Translation(ob), smooth=True)
    p.add(bm_cyl(0.05, 0.05, 0.07, 16), "oil", M(ob + Vector((0, 0, 0.012))))
    p.add(bm_cyl(0.02, 0.018, 0.035, 8), "cork", M(ob + Vector((0, 0, 0.21))))
    # two bowls stacked, ready
    bowl(p, (t.x + 0.18, t.y - 0.16, top), 0.085, 0.06)
    bowl(p, (t.x + 0.18, t.y - 0.16, top + 0.03), 0.09, 0.06)
    # a crock of wooden spoons
    jc = Vector((t.x - 0.36, t.y + 0.17, top))
    p.add(lathe([(0.0001, 0), (0.045, 0), (0.05, 0.02), (0.048, 0.12), (0.042, 0.13), (0.038, 0.12), (0.035, 0.02), (0.0001, 0.02)], 16), "crock_dark", Matrix.Translation(jc), smooth=True)
    for k, (dx, dy, tilt) in enumerate(((0.01, 0.0, 10), (-0.015, 0.01, -14), (0.0, -0.015, 4))):
        a = jc + Vector((dx, dy, 0.03))
        b = a + Vector((math.sin(math.radians(tilt)) * 0.24, 0.02 * (k - 1), 0.24))
        p.add(bm_tube([a, b], 0.008, 6), "wood_light", smooth=True)
        p.add(jitter(bm_ico(1, 1), 0.05, 900 + k), "wood_light", M(b + Vector((0, 0, 0.025)), scale=(0.022, 0.012, 0.035)))
    # under the table: a basket of potatoes and a sack
    bk = Vector((t.x + 0.12, t.y + 0.04, 0))
    p.add(lathe([(0.15, 0), (0.18, 0.04), (0.2, 0.17), (0.205, 0.19), (0.19, 0.19), (0.175, 0.04), (0.0001, 0.03)], 20,
                rfun=lambda a, z: 0.006 * math.cos(a * 14)), "straw", Matrix.Translation(bk), smooth=True)
    for i in range(7):
        a = 2 * math.pi * i / 7
        p.add(jitter(bm_ico(1, 1), 0.15, 950 + i), "potato", M(bk + Vector((0.09 * math.cos(a), 0.09 * math.sin(a), 0.18 + 0.02 * (i % 2))), scale=(0.055, 0.045, 0.04)))
    p.add(jitter(bm_ico(1, 1), 0.15, 958), "potato", M(bk + Vector((0, 0, 0.21)), scale=(0.055, 0.045, 0.04)))
    sk = Vector((t.x - 0.28, t.y + 0.12, 0))
    p.add(jitter(lathe([(0.0001, 0), (0.15, 0.01), (0.17, 0.12), (0.14, 0.26), (0.08, 0.3), (0.05, 0.34), (0.0001, 0.35)], 14), 0.012, 4),
          "sackcloth", Matrix.Translation(sk), smooth=True)
    p.add(bm_tube(ring_pts(Matrix.Translation(sk + Vector((0, 0, 0.3))), 0.065, 12), 0.01, 4, cap=False), "twine", smooth=True)
    # a water bucket by the front leg
    wb = Vector((t.x + 0.6, t.y - 0.22, 0))
    p.add(lathe([(0.0001, 0), (0.13, 0), (0.15, 0.25), (0.14, 0.255), (0.12, 0.02), (0.0001, 0.02)], 18), "wood", Matrix.Translation(wb), smooth=True)
    for z in (0.05, 0.2):
        p.add(bm_tube(ring_pts(Matrix.Translation(wb + Vector((0, 0, z))), 0.13 + 0.08 * z, 18), 0.008, 4, cap=False), "iron", smooth=True)
    p.add(bm_cyl(0.135, 0.135, 0.005, 18), "water", M(wb + Vector((0, 0, 0.2))))


def main():
    model = common.reset()
    base = Part("base")
    ground(base)
    fire_ring(base)
    logs(base)
    crane(base)
    grill(base)
    woodpile(base)
    worktable(base)
    o_base = base.to_object(model)
    pt = Part("pot")
    pot(pt)
    o_pot = pt.to_object(model, origin=(POT.x, POT.y, POT_HOOK))
    bpy.context.view_layer.update()     # the soup is placed relative to the pot's fresh matrix
    sp = Part("soup")
    soup(sp)
    o_soup = sp.to_object(model, parent=o_pot, origin=(POT.x, POT.y, SOUP_Z))
    fp = Part("fire_pot")
    flames(fp, POT, True)
    o_fp = fp.to_object(model, origin=(POT.x, POT.y, 0.07))
    fg = Part("fire_pan")
    flames(fg, GRILL, False)
    o_fg = fg.to_object(model, origin=(GRILL.x, GRILL.y, 0.07))
    em = Part("embers")
    embers(em)
    o_em = em.to_object(model, origin=(0, 0, 0.05))
    common.empty("pot_mouth", model, parent=o_pot, loc=(0, 0, SOUP_Z - POT_HOOK))
    common.empty("grill", model, loc=(GRILL.x, GRILL.y, GRILL.z + 0.02))
    common.empty("smoke", model, loc=(0.0, 0.0, 1.0))
    objs = [o_base, o_pot, o_soup, o_fp, o_fg, o_em]
    tris = {o.name: common.tris([o]) for o in objs}
    total = cc.bake_export("cook_hearth", list(common.coll("MODEL").all_objects))
    cc.preview("cook_hearth", objs, azim=-8, elev=36, lens=55, margin=0.95, min_radius=1.6)
    cc.preview("cook_hearth", objs, suffix="_side", azim=-60, elev=18, lens=55, margin=0.9, min_radius=1.6)
    common.save_blend("cook_hearth")
    lo = [min((o.matrix_world @ Vector(c))[i] for o in objs for c in o.bound_box) for i in range(3)]
    hi = [max((o.matrix_world @ Vector(c))[i] for o in objs for c in o.bound_box) for i in range(3)]
    print("HEARTH tris", total, tris, "bounds", [round(v, 2) for v in lo], [round(v, 2) for v in hi])


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    main()
