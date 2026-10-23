"""Pip, the little serpent mentor: pip_head + seg_01 (neck) .. seg_08 (tail tip).

Each part is its own top-level object with its origin at its own centre, so the
game can bob/sway them in code. Coiled upright he is about 0.62 m tall.
"""
import sys, os, math, random, importlib

HERE = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else r"C:\Users\minal\python-village\art\scripts"
sys.path.insert(0, HERE)
import common
importlib.reload(common)
from common import Part, M, bm_tube, bm_cyl, bm_box
from mathutils import Vector

S = 0.92  # overall scale


def catmull(points, per=8):
    pts = [Vector(p) for p in points]
    pts = [pts[0] * 2 - pts[1]] + pts + [pts[-1] * 2 - pts[-2]]
    out = []
    for i in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
        for k in range(per):
            t = k / per
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-2])
    return out


def radius_at(f):
    """Body thickness along the body, f = 0 at the neck, 1 at the tail tip."""
    if f < 0.3:
        return 0.074 + (0.094 - 0.074) * (f / 0.3)
    return 0.094 * (1 - (f - 0.3) / 0.7) ** 0.8 + 0.016


def body_path():
    ctrl = [(0, 0.0, 0.43), (0, 0.006, 0.34), (0, 0.022, 0.25), (0.0, 0.05, 0.165), (-0.05, 0.12, 0.11)]
    cx, cy, R = 0.0, 0.03, 0.19
    for a in (125, 95, 62, 30, 0, -30, -62, -92, -118):
        ctrl.append((cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a)), 0.0))
    ctrl += [(-0.15, -0.105, 0.0), (-0.2, -0.05, 0.05), (-0.215, 0.01, 0.115)]
    dense = catmull(ctrl, 16)
    L = [0.0]
    for a, b in zip(dense, dense[1:]):
        L.append(L[-1] + (b - a).length)
    total = L[-1]
    # resample evenly by arc length (about every 3.6 cm)
    n = max(8, int(total / 0.036))
    pts, fs, j = [], [], 0
    for k in range(n + 1):
        target = total * k / n
        while j < len(L) - 2 and L[j + 1] < target:
            j += 1
        t = (target - L[j]) / max(L[j + 1] - L[j], 1e-9)
        pts.append(dense[j].lerp(dense[j + 1], t))
        fs.append(target / total)
    # rest the coil on the ground (z >= radius)
    for p, f in zip(pts, fs):
        r = radius_at(f)
        if p.z < r:
            p.z = r
    return pts, fs


def segment_mesh(pts, fs, f0, f1, name, rnd):
    """Tube over the body between f0..f1, with domed ends that overlap the neighbours."""
    def point_at(f):
        for j in range(len(fs) - 1):
            if fs[j] <= f <= fs[j + 1]:
                t = (f - fs[j]) / max(fs[j + 1] - fs[j], 1e-9)
                return pts[j].lerp(pts[j + 1], t)
        return pts[-1].copy()
    sel = [(point_at(f0), f0)] + [(p, f) for p, f in zip(pts, fs) if f0 + 0.01 < f < f1 - 0.01] + [(point_at(f1), f1)]
    path = [p for p, _ in sel]
    rad = [radius_at(f) for _, f in sel]
    t0 = (path[1] - path[0]).normalized()
    t1 = (path[-1] - path[-2]).normalized()
    # domes
    dome = [(0.5, 0.8), (0.88, 0.36)]
    head = [(path[0] - t0 * rad[0] * d, rad[0] * k) for d, k in reversed(dome)]
    tail = [(path[-1] + t1 * rad[-1] * d, rad[-1] * k) for d, k in dome]
    if f1 >= 0.999:
        tail = [(path[-1] + t1 * rad[-1] * 0.5, rad[-1] * 0.8), (path[-1] + t1 * rad[-1] * 0.95, rad[-1] * 0.35)]
    full = [p for p, _ in head] + path + [p for p, _ in tail]
    radii = [r for _, r in head] + rad + [r for _, r in tail]
    part = Part(name)
    part.add(bm_tube(full, radii, 7), "pip", smooth=True)
    return part, path, rad


def build():
    model = common.reset()
    rnd = random.Random(7)
    pts, fs = body_path()
    # segment boundaries: a little shorter near the neck so the head bobs nicely
    bounds = [0.0, 0.1, 0.2, 0.31, 0.44, 0.57, 0.7, 0.84, 1.0]
    objs = []
    for i in range(8):
        name = "seg_%02d" % (i + 1)
        part, path, rad = segment_mesh(pts, fs, bounds[i], bounds[i + 1], name, rnd)
        mid = path[len(path) // 2]
        if i < 2:
            # creamy belly stripe on the front of the upright part
            bp = [Vector((p.x, p.y - r * 0.36, p.z)) for p, r in zip(path, rad)]
            br = [r * 0.74 for r in rad]
            t0b, t1b = (bp[1] - bp[0]).normalized(), (bp[-1] - bp[-2]).normalized()
            bp = [bp[0] - t0b * br[0] * 0.5] + bp + [bp[-1] + t1b * br[-1] * 0.5]
            br = [br[0] * 0.75] + br + [br[-1] * 0.75]
            part.add(bm_tube(bp, br, 6), "pip_belly", smooth=True)
        if i == 0:
            # red scarf: a ring round the neck and a little tail hanging at the front
            z = 0.385
            ring = [(0.09 * math.cos(2 * math.pi * k / 12), 0.006 + 0.09 * math.sin(2 * math.pi * k / 12),
                     z + 0.012 * math.sin(4 * math.pi * k / 12)) for k in range(13)]
            part.add(bm_tube(ring, 0.03, 5), "cloth", smooth=True)
            part.add(bm_box(0.065, 0.022, 0.15, bevel=0.008), "cloth", M((0.05, -0.09, z - 0.085), (14, 0, 12)))
            part.add(bm_box(0.06, 0.022, 0.12, bevel=0.008), "cloth", M((0.085, -0.078, z - 0.065), (10, 0, 34)))
        # origin at the segment's own centre (bounding-box centre)
        bm = part.bm
        lo = Vector((min(v.co.x for v in bm.verts), min(v.co.y for v in bm.verts), min(v.co.z for v in bm.verts)))
        hi = Vector((max(v.co.x for v in bm.verts), max(v.co.y for v in bm.verts), max(v.co.z for v in bm.verts)))
        objs.append(part.to_object(model, origin=tuple((lo + hi) / 2), sharp_angle=70))
    # head
    H = Vector((0.0, -0.02, 0.535))
    hp = Part("pip_head")
    def at(dx, dy, dz):
        return tuple(H + Vector((dx, dy, dz)))
    hp.ball(0.14, at(0, 0, 0), "pip", scale=(1.14, 1.0, 0.92), uv=(14, 8))
    hp.ball(0.1, at(0, -0.075, -0.045), "pip", scale=(1.12, 0.92, 0.7), uv=(10, 6))
    hp.ball(0.075, at(0, -0.09, -0.07), "pip_belly", scale=(1.15, 0.8, 0.45), uv=(8, 5))
    for s in (-1, 1):
        hp.ball(0.047, at(s * 0.062, -0.112, 0.02), "white", scale=(1.0, 0.62, 1.18), uv=(10, 6))
        hp.ball(0.031, at(s * 0.062, -0.137, 0.014), "ink", scale=(1.0, 0.5, 1.22), uv=(8, 6))
        hp.ball(0.011, at(s * 0.062 + 0.012, -0.152, 0.034), "white", uv=(6, 4))
        hp.ball(0.006, at(s * 0.062 - 0.012, -0.152, 0.0), "white", uv=(6, 4))
        hp.ball(0.022, at(s * 0.108, -0.1, -0.04), "blush", scale=(1.3, 0.5, 0.85), uv=(8, 4))
        hp.ball(0.007, at(s * 0.022, -0.165, -0.035), "ink", uv=(6, 3))
    smile = [at(0.032 * math.cos(math.pi + math.pi * k / 6), -0.158 + 0.004 * math.sin(math.pi * k / 6),
                -0.072 + 0.018 * math.sin(math.pi + math.pi * k / 6)) for k in range(7)]
    hp.add(bm_tube(smile, 0.006, 4), "ink")
    # tiny scholar's cap: skull cap, mortarboard, button and a golden tassel
    cap = M(at(0.01, 0.0, 0.112), (6, -10, 0))
    hp.add(bm_cyl(0.08, 0.075, 0.05, 10), "cap", cap)
    hp.add(bm_box(0.2, 0.2, 0.022, bevel=0.004), "cap", cap @ M((0, 0, 0.06), (0, 0, 20)))
    hp.add(common.bm_uv(0.013, 6, 4), "petal_yellow", cap @ M((0, 0, 0.075)))
    hp.add(bm_tube([(0, 0, 0.075), (0.06, -0.05, 0.073), (0.085, -0.07, 0.07), (0.088, -0.072, 0.02)], 0.004, 4),
           "petal_yellow", cap)
    hp.add(bm_cyl(0.004, 0.013, 0.04, 6), "petal_yellow", cap @ M((0.088, -0.072, -0.015)))
    objs.append(hp.to_object(model, origin=tuple(H), sharp_angle=70))
    for o in objs:
        o.scale = (1, 1, 1)
    # apply the overall scale into the meshes and origins
    for o in objs:
        o.data.transform(M(scale=S))
        o.location = o.location * S
    return objs


def main():
    objs = build()
    r = common.finish("pip", objs, azim=-28, elev=12, lens=60, margin=1.25, sun_azim=30)
    r["parts"] = {o.name: common.tris([o]) for o in objs}
    return r


if __name__ == "__main__" or globals().get("RUN_MAIN"):
    RESULT = main()
