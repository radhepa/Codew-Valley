"""Shared kit for the ten villager scripts (fisher.py ... lord_vane.py), in the soft Animal
Crossing style the user chose for Marlo the fisher (2026-10-23). No triangle budget.

The style, in short: a big round head (ellipsoid, ~0.3 m radius) on a short rounded body
(a lathe garment ~0.8 m tall); black oval eyes with one small highlight, a soft button nose,
blush on the cheeks; hair, beards, brows and boots sculpted from metaballs; clothes with
real construction (hems, seams, stitching, buttons, pockets); mitten hands with a thumb.

Same part names as the miller: body (root, origin on the ground), head (pivot at the neck),
arm_l / arm_r (shoulders), leg_l / leg_r (hips). Held props are separate meshes parented to the
arm (or body) that carries them, with their origin at the grip.
Characters face -Y; their left is +X.

Kit:
  frame, S, sphere, lathe, ribs, meta, polyline_at, plen, stitch, ring_pts   geometry helpers
  Garment(profile, ys)       a lathe body with points/normals on its surface, panels, pockets
  Head(hc, a, b, c)          head ellipsoid with face placement and the standard face
  arm(side, cfg), leg(side, cfg), hand_c(side, cfg)   default limbs
  build(name, cfg)           assemble, bake, export, preview + close-up
"""
import math
import bpy
import bmesh
import common
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_uv
from mathutils import Vector, Matrix

# Shared colours for every villager (soft, warm, a little brighter than the buildings).
AC = {
    "skin_warm": "#F0C7AA", "skin_tan": "#D9A47E", "skin_deep": "#A8704C", "skin_pale": "#F6D7C0",
    "nose": "#E2937F", "nose_tan": "#C98266", "nose_deep": "#8E5638",
    "blush_soft": "#EEA294", "ear_in": "#E3A58F",
    "eye_dark": "#2E211C", "white": "#F7F3EA", "mouth": "#7A3A30",
    "stitch_light": "#E6D8B8", "stitch_dark": "#4A3326",
    "brass": "#BC9548", "brass_dark": "#8E6E33", "gold": "#D6AE4E", "steel": "#9AA0A6", "iron": "#5C5F63",
    "sole": "#2E3431", "cord": "#4A3326",
}
# More shared colour names (from the first low-poly villagers; scripts still use some of them).
EXTRA = {
    "oilskin": "#A48D4C", "oilskin_dark": "#7E6C3A", "rubber": "#3E4842", "khaki": "#857D60",
    "hair_white": "#E4DFD4", "hair_blond": "#CFAE6A", "hair_blond_dark": "#A98A4E", "hair_dark": "#2F2723",
    "leather": "#7A5338", "leather_dark": "#4E3626", "linen": "#CDBFA3",
    "patch_moss": "#6E7846", "patch_teal": "#4E7B76", "patch_ochre": "#BE8D47", "patch_rust": "#A0573C",
    "plum": "#6C4862", "plum_dark": "#4E3347", "feather": "#B6503E",
    "dress_rose": "#A8665F", "robe_blue": "#4B5874", "robe_blue_dark": "#3A4560",
    "shawl_green": "#5F7B4A", "shawl_dark": "#4A6240", "dress_earth": "#8A6B4F",
    "cape_blue": "#3F5463", "hair_steel": "#858079", "scar": "#B57767",
    "burgundy": "#6E2F37", "burgundy_dark": "#532329", "black_fine": "#27221F",
    "book_green": "#4F6B4E", "book_red": "#8A3F35", "book_blue": "#3F5370",
}
# metallic, roughness
METAL = {"brass": (0.65, 0.35), "brass_dark": (0.6, 0.45), "gold": (0.75, 0.3), "steel": (0.75, 0.3),
         "iron": (0.6, 0.45), "glass": (0.0, 0.1)}
# roughness only (glossy bits)
GLOSS = {"eye_dark": 0.3}


def palette(colours=None, metal=None, gloss=None):
    """Register colours (and metal/gloss overrides) for this model."""
    common.PALETTE.update(EXTRA)
    common.PALETTE.update(AC)
    if colours:
        common.PALETTE.update(colours)
    if metal:
        METAL.update(metal)
    if gloss:
        GLOSS.update(gloss)


palette()


# ---------------------------------------------------------------- geometry helpers

def frame(pos, zdir):
    """Matrix at pos whose local Z points along zdir and local Y as close to world up as possible."""
    q = Vector(zdir).normalized().to_track_quat("Z", "Y")
    return Matrix.Translation(Vector(pos)) @ q.to_matrix().to_4x4()


def S(x, y=None, z=None):
    return Matrix.Diagonal((x, x if y is None else y, x if z is None else z, 1.0))


def sphere(u=24, v=14):
    return bm_uv(1.0, u, v)


def lathe(profile, segs=32, rfun=None, ys=1.0, cap_top=False, cap_bottom=False):
    """Surface of revolution from (r, z) pairs; rfun(angle, z) adds to the radius (knit ribs,
    pleats). ys squashes it front-to-back. Caps are fans to a pole."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        ring = []
        for i in range(segs):
            a = 2 * math.pi * i / segs
            rr = r + (rfun(a, z) if rfun else 0.0)
            ring.append(bm.verts.new((rr * math.cos(a), ys * rr * math.sin(a), z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            bm.faces.new((a[i], a[j], b[j], b[i]))
    if cap_top:
        pole = bm.verts.new((0, 0, profile[-1][1] + 0.002))
        for i in range(segs):
            bm.faces.new((rings[-1][i], rings[-1][(i + 1) % segs], pole))
    if cap_bottom:
        pole = bm.verts.new((0, 0, profile[0][1] - 0.002))
        for i in range(segs):
            bm.faces.new((rings[0][(i + 1) % segs], rings[0][i], pole))
    return bm


def ribs(n, depth, fade_from=None, fade_to=None):
    """rfun for lathe(): n vertical ribs of the given depth, optionally fading out between two heights."""
    def f(a, z):
        k = 1.0
        if fade_from is not None:
            k = max(0.0, 1.0 - (z - fade_from) / (fade_to - fade_from))
        return depth * k * 0.5 * (1 + math.cos(a * n))
    return f


_mb = [0]
MB_FACTOR = {2.0: 0.575, 4.0: 0.684}     # measured: visible radius / element radius at threshold 0.6


def meta(elems, res=0.008, stiff=2.0, keep=0.4):
    """Fused clay shape from metaballs: elems = [(centre, visible radius), ...] in world space.
    Stiffness 2 melts the balls together (smooth hair masses, boots); 4 keeps them rounder and
    more separate (clumpy clouds of beard). `res` is the voxel size: smaller = finer and heavier.
    The result is decimated to `keep` of its faces (smooth shading hides it)."""
    _mb[0] += 1
    mb = bpy.data.metaballs.new("vcmb%d" % _mb[0])
    mb.resolution = mb.render_resolution = res
    mb.threshold = 0.6
    ob = bpy.data.objects.new("vcmb%dx" % _mb[0], mb)       # unique base name: its own metaball family
    bpy.context.scene.collection.objects.link(ob)
    for c, v in elems:
        e = mb.elements.new()
        e.type = "BALL"
        e.co = Vector(c)
        e.radius = v / MB_FACTOR[stiff]
        e.stiffness = stiff
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(ob)
    bpy.data.metaballs.remove(mb)
    tmp = bpy.data.objects.new("vcdec%dx" % _mb[0], me)
    bpy.context.scene.collection.objects.link(tmp)
    mod = tmp.modifiers.new("dec", "DECIMATE")
    mod.ratio = keep
    bpy.context.view_layer.update()
    me2 = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bm = bmesh.new()
    bm.from_mesh(me2)
    bpy.data.objects.remove(tmp)
    bpy.data.meshes.remove(me)
    bpy.data.meshes.remove(me2)
    return bm


def polyline_at(pts, s):
    """Point at arc length s along a polyline of Vectors."""
    for a, b in zip(pts, pts[1:]):
        L = (b - a).length
        if s <= L:
            return a + (b - a) * (s / max(L, 1e-9))
        s -= L
    return pts[-1]


def plen(pts):
    return sum((b - a).length for a, b in zip(pts, pts[1:]))


def stitch(part, pts, matname="stitch_light", dash=0.013, gap=0.008, r=0.0026):
    """Running stitch: short dashes along a polyline."""
    pts = [Vector(p) for p in pts]
    total = plen(pts)
    s = gap * 0.5
    while s + dash <= total:
        part.add(bm_tube([polyline_at(pts, s), polyline_at(pts, s + dash)], r, 4), matname)
        s += dash + gap


def ring_pts(m, r, n=24, z=0.0, ry=None):
    """Closed circle (n+1 points) of radius r in the local XY plane of matrix m."""
    ry = r if ry is None else ry
    return [m @ Vector((r * math.cos(t), ry * math.sin(t), z)) for t in [2 * math.pi * k / n for k in range(n + 1)]]


def bezier(p0, p1, p2, n=12):
    """Quadratic Bezier points from p0 to p2 pulled toward p1."""
    p0, p1, p2 = Vector(p0), Vector(p1), Vector(p2)
    return [(1 - t) ** 2 * p0 + 2 * t * (1 - t) * p1 + t * t * p2 for t in (k / n for k in range(n + 1))]


# ---------------------------------------------------------------- garments

class Garment:
    """A lathe body (coat, dress, robe, apron) from (r, z) pairs, squashed front-to-back by ys.
    phi is the angle round the body: -90 is the front centre, 90 the back, 0 the character's left."""

    def __init__(self, profile, ys=0.84):
        self.profile = profile
        self.ys = ys

    def rad(self, z):
        P = self.profile
        for (r0, z0), (r1, z1) in zip(P, P[1:]):
            if z0 <= z <= z1:
                return r0 + (r1 - r0) * (z - z0) / max(z1 - z0, 1e-9)
        return P[0][0] if z < P[0][1] else P[-1][0]

    def pt(self, phi, z, out=0.0):
        r = self.rad(z) + out
        a = math.radians(phi)
        return Vector((r * math.cos(a), self.ys * r * math.sin(a), z))

    def normal(self, phi, z, lift=0.25):
        a = math.radians(phi)
        return Vector((math.cos(a), math.sin(a) / self.ys, lift)).normalized()

    def arc(self, phi0, phi1, z, out=0.0, n=12):
        return [self.pt(phi0 + (phi1 - phi0) * k / n, z, out) for k in range(n + 1)]

    def line(self, phi, z0, z1, out=0.0, n=8):
        return [self.pt(phi, z0 + (z1 - z0) * k / n, out) for k in range(n + 1)]

    def frame(self, phi, z, out=0.0):
        """Matrix lying on the surface (local Z = outward normal)."""
        return frame(self.pt(phi, z, out), self.normal(phi, z))

    def mesh(self, part, matname, segs=48, rfun=None, cap_top=True, cap_bottom=False):
        part.add(lathe(self.profile, segs, rfun=rfun, ys=self.ys, cap_top=cap_top, cap_bottom=cap_bottom), matname, smooth=True)

    def panel(self, part, phi0, phi1, z0, z1, matname, out=0.007, segs=8):
        """A curved panel lying on the garment (pockets, plackets, belts, apron bibs)."""
        prof = [(self.rad(z0 + (z1 - z0) * k / 4) + out, z0 + (z1 - z0) * k / 4) for k in range(5)]
        part.add(bm_lathe(prof, segs, arc=(phi0, phi1)), matname, M(scale=(1, self.ys, 1)), smooth=True)

    def hem(self, part, z, r, matname, out=0.004, phi0=-180.0, phi1=180.0, n=48):
        """Rolled hem / belt / cuff: a tube round the body at height z."""
        closed = phi1 - phi0 >= 359.9
        pts = self.arc(phi0, phi1, z, out, n)
        part.add(bm_tube(pts, r, 10, cap=not closed), matname, smooth=True)

    def stitch_ring(self, part, z, out=0.003, matname="stitch_light", phi0=-180.0, phi1=180.0):
        if phi1 - phi0 >= 359.9:
            stitch(part, self.arc(-180, 0, z, out, 36), matname)
            stitch(part, self.arc(0, 180, z, out, 36), matname)
        else:
            stitch(part, self.arc(phi0, phi1, z, out, 36), matname)

    def pocket(self, part, pc, hw, z0, z1, matname, edge="stitch_dark", thread="stitch_light"):
        """Stitched patch pocket centred at angle pc, half-width hw degrees, from z0 to z1."""
        out = 0.008
        self.panel(part, pc - hw, pc + hw, z0, z1, matname, out)
        o2 = out + 0.002
        border = self.arc(pc - hw, pc + hw, z0, o2) + list(reversed(self.arc(pc - hw, pc + hw, z1, o2))) + [self.pt(pc - hw, z0, o2)]
        part.add(bm_tube(border, 0.0045, 6, cap=False), edge, smooth=True)
        part.add(bm_tube(self.arc(pc - hw, pc + hw, z1 - 0.012, out + 0.004), 0.006, 6), matname, smooth=True)
        i, o3 = 3.0, out + 0.003
        stitch(part, [self.pt(pc - hw + i, z1 - 0.026, o3)] + self.arc(pc - hw + i, pc + hw - i, z0 + 0.012, o3) + [self.pt(pc + hw - i, z1 - 0.026, o3)], thread)
        stitch(part, self.arc(pc - hw + i, pc + hw - i, z1 - 0.024, out + 0.009), thread)

    def button(self, part, phi, z, r=0.016, matname="brass", out=0.008, holes="stitch_dark"):
        """Round domed button with four thread holes."""
        m = self.frame(phi, z, out)
        part.add(sphere(16, 10), matname, m @ S(r, r, r * 0.45), smooth=True)
        if holes:
            for k in range(4):
                t = math.pi / 4 + k * math.pi / 2
                part.add(sphere(6, 4), holes, m @ Matrix.Translation((r * 0.32 * math.cos(t), r * 0.32 * math.sin(t), r * 0.38)) @ S(r * 0.14), smooth=True)


# ---------------------------------------------------------------- head and face

class Head:
    """Head ellipsoid centred at hc with semi-axes a (width), b (depth), c (height).
    Face features sit on the front surface at head-local (x, z) and follow its normal."""

    def __init__(self, hc, a=0.315, b=0.29, c=0.285):
        self.hc = Vector(hc)
        self.a, self.b, self.c = a, b, c

    def H(self, x, y, z):
        return self.hc + Vector((x, y, z))

    def fpt(self, x, z, out=0.0):
        """Point (world) and normal on the front of the head at head-local x, z."""
        a, b, c = self.a, self.b, self.c
        t = max(1 - (x / a) ** 2 - (z / c) ** 2, 0.0)
        y = -b * math.sqrt(t)
        n = Vector((x / a ** 2, y / b ** 2, z / c ** 2)).normalized()
        return self.hc + Vector((x, y, z)) + n * out, n

    def spt(self, phi, z, out=0.0):
        """Point and normal on the head at angle phi round the vertical axis (-90 = front) and local z."""
        a, b, c = self.a, self.b, self.c
        k = math.sqrt(max(1 - (z / c) ** 2, 0.0))
        ph = math.radians(phi)
        x, y = a * k * math.cos(ph), b * k * math.sin(ph)
        n = Vector((x / a ** 2, y / b ** 2, z / c ** 2)).normalized()
        return self.hc + Vector((x, y, z)) + n * out, n

    def on_face(self, part, matname, x, z, sx, sy, sz, out=0.0, u=24, v=12, tilt=None):
        p, n = self.fpt(x, z, out)
        if tilt is not None:
            n = (n + Vector(tilt)).normalized()
        part.add(sphere(u, v), matname, frame(p, n) @ S(sx, sy, sz), smooth=True)
        return frame(p, n)

    def skull(self, part, skin="skin_warm"):
        part.add(sphere(48, 32), skin, Matrix.Translation(self.hc) @ S(self.a, self.b, self.c), smooth=True)

    def ears(self, part, skin="skin_warm", inner="ear_in", z=-0.035, size=1.0):
        for s in (-1, 1):
            c = self.H(s * self.a * 0.97, 0.01, z)
            part.add(sphere(20, 14), skin, M(c, (0, 0, s * -12), (0.034 * size, 0.055 * size, 0.07 * size)), smooth=True)
            part.add(sphere(16, 10), inner, M(c + Vector((s * 0.022 * size, -0.004, 0.0)), (0, 0, s * -12), (0.01 * size, 0.034 * size, 0.046 * size)), smooth=True)

    def eye(self, part, s, x=0.098, z=0.0, w=0.03, h=0.042, look=(0.0, 0.0)):
        """The house eye: a glossy black oval with one small white highlight (upper right)."""
        ex, ez = s * x + look[0], z + look[1]
        self.on_face(part, "eye_dark", ex, ez, w, h, 0.012, out=0.0, u=28, v=16)
        self.on_face(part, "white", ex + 0.009, ez + 0.016, 0.008, 0.009, 0.004, out=0.01)

    def closed_eye(self, part, s, x=0.098, z=-0.005, w=0.034, smile=True):
        """A happy closed eye: a thin dark arc (^ shape when smile=True)."""
        pts = []
        for k in range(9):
            t = -1 + 2 * k / 8
            dz = (0.012 * (1 - t * t)) if smile else (-0.012 * (1 - t * t))
            pts.append(self.fpt(s * x + t * w, z + dz, 0.003)[0])
        part.add(bm_tube(pts, 0.0055, 6), "eye_dark", smooth=True)

    def blush(self, part, x=0.178, z=-0.052, w=0.046, h=0.028, mat="blush_soft"):
        for s in (-1, 1):
            self.on_face(part, mat, s * x, z, w, h, 0.006, out=0.001)

    def nose(self, part, mat="nose", z=-0.052, size=(0.05, 0.044, 0.05), out=0.022):
        """Soft rounded button nose, pointing a little down."""
        p, n = self.fpt(0, z, out)
        part.add(sphere(28, 18), mat, frame(p, (n + Vector((0, 0, -0.35))).normalized()) @ S(*size), smooth=True)

    def mouth(self, part, z=-0.14, kind="dot", w=0.026, mat="eye_dark"):
        """kind: 'dot' (small oval), 'smile' (a curved line), 'open' (a little open smile with a tongue)."""
        if kind == "dot":
            self.on_face(part, mat, 0, z, w, w * 0.7, 0.012)
        elif kind == "smile":
            pts = [self.fpt(t * w * 1.6, z + 0.018 * (t * t), 0.003)[0] for t in [-1 + 2 * k / 10 for k in range(11)]]
            part.add(bm_tube(pts, 0.005, 6), mat, smooth=True)
        elif kind == "open":
            m = self.on_face(part, "mouth", 0, z, w * 1.2, w * 0.8, 0.008, out=0.0)
            part.add(sphere(14, 8), "nose", m @ Matrix.Translation((0, -w * 0.3, 0.004)) @ S(w * 0.7, w * 0.4, 0.004), smooth=True)

    def brows(self, part, mat, pts=((0.055, 0.088, 0.022), (0.095, 0.1, 0.026), (0.135, 0.096, 0.024), (0.165, 0.082, 0.017)),
              res=0.007, out=0.012):
        """Soft brows from metaballs: pts are (x, z, visible radius) for the left brow, mirrored."""
        br = []
        for s in (-1, 1):
            for x, z, v in pts:
                br.append((self.fpt(s * x, z, out)[0], v))
        part.add(meta(br, res), mat, None, smooth=True)

    def face(self, part, skin="skin_warm", nose="nose", mouth="dot", blush=True, ears=True, eye_x=0.098, eye_z=0.0,
             eye_size=(0.03, 0.042), nose_z=-0.052, mouth_z=-0.14):
        """The standard face: skull, ears, eyes, blush, nose and mouth."""
        self.skull(part, skin)
        if ears:
            self.ears(part, skin)
        for s in (-1, 1):
            self.eye(part, s, eye_x, eye_z, *eye_size)
        if blush:
            self.blush(part)
        self.nose(part, nose, nose_z)
        if mouth:
            self.mouth(part, mouth_z, mouth)


# ---------------------------------------------------------------- limbs

def arm_dir(side, cfg):
    """Direction from shoulder to hand. cfg arm_splay (degrees out from the body, 10) and an
    optional per-arm cfg arm_pose {side: (splay, forward)} to reach forward (holding things out)."""
    splay, fwd = cfg.get("arm_pose", {}).get(side, (cfg.get("arm_splay", 10), 0.0))
    s, f = math.radians(splay), math.radians(fwd)
    return Vector((math.sin(s) * side, -math.sin(f) * math.cos(s), -math.cos(f) * math.cos(s))).normalized()


def shoulder(side, cfg):
    return Vector((side * cfg["shoulder_x"], 0.0, cfg["shoulder_z"]))


def hand_c(side, cfg):
    """Hand centre of arm_l (side=+1) or arm_r (side=-1): the grip point for held props."""
    return shoulder(side, cfg) + arm_dir(side, cfg) * cfg.get("arm_len", 0.27)


def mitten(p, c, mat="skin_warm", side=1, size=1.0, thumb=True):
    """Round mitten hand with a thumb pointing forward and in."""
    p.add(sphere(28, 18), mat, M(c, scale=(0.06 * size, 0.062 * size, 0.066 * size)), smooth=True)
    if thumb:
        p.add(sphere(16, 10), mat, M(Vector(c) + Vector((-side * 0.022, -0.046, 0.012)) * size, scale=0.026 * size), smooth=True)


def arm(side, cfg):
    """Default arm: a soft sleeve, a turned-back stitched cuff and a mitten hand.
    cfg: shoulder_x, shoulder_z, arm_len (0.27), arm_splay (10), sleeve_r (0.072), sleeve_mat,
    cuff_mat, stitch_mat, hand_mat, cuff (True), arm_fn(p, side, pv, d) for extras."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = shoulder(side, cfg)
    d = arm_dir(side, cfg)
    L = cfg.get("arm_len", 0.27)
    sr = cfg.get("sleeve_r", 0.072)
    sm = cfg["sleeve_mat"]
    p.add(sphere(28, 18), sm, M(pv, scale=sr * 1.04), smooth=True)
    p.add(bm_tube([pv, pv + d * (L * 0.37), pv + d * (L * 0.7)], [sr, sr * 1.01, sr * 1.1], 24, cap=False), sm, smooth=True)
    if cfg.get("cuff", True):
        cm = frame(pv + d * (L * 0.555), d)
        k = sr / 0.072
        p.add(lathe([(0.074 * k, -0.002), (0.087 * k, 0.004), (0.093 * k, 0.02), (0.093 * k, 0.046), (0.087 * k, 0.062), (0.07 * k, 0.066)], 32),
              cfg.get("cuff_mat", sm), cm, smooth=True)
        if cfg.get("stitch_mat"):
            stitch(p, ring_pts(cm, 0.0945 * k, 24, 0.033), cfg["stitch_mat"], 0.011, 0.007, 0.0022)
    else:
        p.add(sphere(20, 12), sm, M(pv + d * (L * 0.7), scale=sr * 1.1), smooth=True)
    mitten(p, hand_c(side, cfg), cfg.get("hand_mat", "skin_warm"), side)
    if cfg.get("arm_fn"):
        cfg["arm_fn"](p, side, pv, d)
    return p


def leg(side, cfg):
    """Default leg: trouser leg and a sculpted boot (or shoe).
    cfg: hip_x, hip_z, leg_r (0.062), pants_mat, boot_mat, boot_top (0.29: top of the boot shaft;
    low values give an ankle shoe), boot_trim (mat for the rolled top, or None), sole_mat, leg_fn(p, side, x)."""
    p = Part("leg_l" if side > 0 else "leg_r")
    x = side * cfg["hip_x"]
    hz = cfg["hip_z"]
    lr = cfg.get("leg_r", 0.062)
    top = cfg.get("boot_top", 0.29)
    bm = cfg.get("boot_mat", "sole")
    p.add(bm_tube([(x, 0, hz), (x, 0, max(top - 0.03, 0.08))], [lr, lr * 1.02], 16), cfg["pants_mat"], smooth=True)
    els = [((x, 0.005, z), 0.07) for z in [0.11 + (top - 0.11) * k / 4 for k in range(5)] if z >= 0.1]
    els += [((x, -0.03, 0.078), 0.07), ((x, -0.088, 0.068), 0.064), ((x, -0.128, 0.06), 0.052), ((x, 0.04, 0.075), 0.064)]
    p.add(meta(els, 0.011), bm, None, smooth=True)
    p.add(bm_box(0.128, 0.25, 0.024, bevel=0.011, segs=3), cfg.get("sole_mat", "sole"), M((x, -0.036, 0.012)), smooth=True)
    if cfg.get("boot_trim", bm):
        rim = [(x + 0.074 * math.cos(2 * math.pi * k / 32), 0.005 + 0.074 * math.sin(2 * math.pi * k / 32), top + 0.028) for k in range(33)]
        p.add(bm_tube(rim, 0.017, 10, cap=False), cfg.get("boot_trim", bm), smooth=True)
    if cfg.get("leg_fn"):
        cfg["leg_fn"](p, side, x)
    return p


# ---------------------------------------------------------------- build

def tune_materials():
    for name, (metal, rough) in METAL.items():
        m = bpy.data.materials.get(name)
        if m and m.node_tree:
            b = m.node_tree.nodes.get("Principled BSDF")
            b.inputs["Metallic"].default_value = metal
            b.inputs["Roughness"].default_value = rough
    for name, rough in GLOSS.items():
        m = bpy.data.materials.get(name)
        if m and m.node_tree:
            m.node_tree.nodes.get("Principled BSDF").inputs["Roughness"].default_value = rough


def shot(path, target, az=-18, el=6, dist=1.75, lens=60):
    """Extra preview from the scene camera: az degrees round from the front (negative = his left, +X;
    positive = his right), el degrees up, dist metres from target."""
    cam = bpy.context.scene.camera
    target = Vector(target)
    az, el = math.radians(az), math.radians(el)
    cam.location = target + Vector((-math.sin(az) * dist * math.cos(el), -math.cos(az) * dist * math.cos(el), math.sin(el) * dist))
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
    cam.data.lens = lens
    common.render(path)


def build(name, cfg):
    """Assemble and finish a villager. cfg needs: body() and head() -> Part, neck_z, shoulder_x/z,
    hip_x/z (and what arm/leg read); optional arm(side, cfg) / leg(side, cfg) overrides,
    props [(name, holder, fn() -> (Part, grip))], closeup_z (default head centre - 0.1),
    shots [(suffix, target, az, el, dist)] for extra previews, rig (preview camera options)."""
    import os
    model = common.reset()
    body_ob = cfg["body"]().to_object(model, origin=(0, 0, 0), sharp_angle=80)
    objs = [body_ob, cfg["head"]().to_object(model, parent=body_ob, origin=(0, 0, cfg["neck_z"]), sharp_angle=80)]
    arm_fn, leg_fn = cfg.get("arm", arm), cfg.get("leg", leg)
    for side in (1, -1):
        objs.append(arm_fn(side, cfg).to_object(model, parent=body_ob, origin=tuple(shoulder(side, cfg)), sharp_angle=80))
    for side in (1, -1):
        objs.append(leg_fn(side, cfg).to_object(model, parent=body_ob, origin=(side * cfg["hip_x"], 0.0, cfg["hip_z"]), sharp_angle=80))
    bpy.context.view_layer.update()
    byname = {o.name: o for o in objs}
    for pname, holder, fn in cfg.get("props", ()):
        part, grip = fn()
        part.name = pname
        objs.append(part.to_object(model, parent=byname[holder], origin=tuple(grip), sharp_angle=80))
    tune_materials()
    rig = dict(azim=-25, elev=10, lens=60, margin=1.15)
    rig.update(cfg.get("rig", {}))
    r = common.finish(name, objs, **rig)
    shot(os.path.join(common.OUT_PREV, name + "_closeup.png"), (0, 0, cfg.get("closeup_z", cfg["neck_z"] + 0.18)))
    for suffix, target, az, el, dist in cfg.get("shots", ()):
        shot(os.path.join(common.OUT_PREV, "%s_%s.png" % (name, suffix)), target, az, el, dist)
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    r["size_xyz"] = tuple(round(max(getattr(q, a) for q in pts) - min(getattr(q, a) for q in pts), 2) for a in "xyz")
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    r["parents"] = {o.name: (o.parent.name if o.parent else None) for o in objs}
    print("VILLAGER", name, r)
    return r
