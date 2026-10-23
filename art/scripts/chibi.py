"""Shared chibi-villager builder for player.py and innkeeper.py.

Parts (ART.md): body, head, arm_l, arm_r, leg_l, leg_r. `body` is the root with
its origin on the ground; every other part is parented to it with its origin at
its joint (head at the neck, arms at the shoulders, legs at the hips).
Characters face -Y; their left is +X.
"""
import math
import common
from common import Part, M, bm_box, bm_cyl, bm_tube, bm_lathe, bm_uv
from mathutils import Vector


def surface_pt(profile, yscale, phi_deg, z, out=0.0):
    """Point on a lathe profile surface (radius interpolated at height z)."""
    for (r0, z0), (r1, z1) in zip(profile, profile[1:]):
        if z0 <= z <= z1:
            r = r0 + (r1 - r0) * (z - z0) / max(z1 - z0, 1e-9)
            break
    else:
        r = profile[-1][0]
    r += out
    a = math.radians(phi_deg)
    return (r * math.cos(a), yscale * r * math.sin(a), z)


def strap(part, profile, yscale, phi0, z0, phi1, z1, matname, w=0.018, out=0.012, n=6):
    pts = [surface_pt(profile, yscale, phi0 + (phi1 - phi0) * k / n, z0 + (z1 - z0) * k / n, out) for k in range(n + 1)]
    part.add(bm_tube(pts, w, 4), matname, M(scale=(1, 1, 1)))


def head(c, cfg):
    """Head part, origin at the neck. `c` is the head centre."""
    hp = Part("head")
    cx, cy, cz = c
    R = cfg["head_r"]
    def at(dx, dy, dz):
        return (cx + dx, cy + dy, cz + dz)
    hp.ball(R, at(0, 0, 0), "skin", scale=(1.06, 0.98, 0.95), uv=(16, 12))
    fy = -R * 0.98      # front of the face
    # ears
    for s in (-1, 1):
        hp.ball(0.05, at(s * R * 1.04, 0.01, -0.01), "skin", scale=(0.5, 0.8, 1.0), uv=(8, 5))
    # eyes: tall ink ovals with a sparkle
    ex, ez = cfg.get("eye_x", 0.095), cfg.get("eye_z", -0.02)
    for s in (-1, 1):
        if cfg.get("happy_eyes"):
            arc = [at(s * ex + 0.028 * math.cos(math.pi * k / 4), fy + 0.012, ez - 0.01 + 0.022 * math.sin(math.pi * k / 4)) for k in range(5)]
            hp.add(bm_tube(arc, 0.011, 4), "ink")
        else:
            hp.ball(0.04, at(s * ex, fy + 0.022, ez), "ink", scale=(0.8, 0.45, 1.25), uv=(8, 6))
            hp.ball(0.013, at(s * ex + 0.013, fy + 0.0, ez + 0.022), "white", uv=(6, 4))
        hp.ball(0.035, at(s * (ex + 0.07), fy + 0.05, ez - 0.07), "blush", scale=(1.2, 0.4, 0.7), uv=(8, 4))
        # brows
        bz = ez + cfg.get("brow_dz", 0.085)
        bw = cfg.get("brow_w", 0.03)
        brow = [at(s * ex - 0.035, fy + 0.03, bz - 0.005), at(s * ex, fy + 0.018, bz + 0.008), at(s * ex + 0.035, fy + 0.03, bz)]
        hp.add(bm_tube(brow, bw * 0.4, 4), cfg["brow_mat"])
    # nose and mouth
    nr = cfg.get("nose_r", 0.03)
    hp.ball(nr, at(0, fy - nr * 0.2, ez - 0.06), cfg.get("nose_mat", "skin"), uv=(8, 6))
    if cfg.get("mouth", True):
        mz = ez - 0.115
        mouth = [at(0.028 * math.cos(math.pi + math.pi * k / 4), fy + 0.032 + 0.004 * math.sin(math.pi * k / 4),
                    mz + 0.014 * math.sin(math.pi + math.pi * k / 4)) for k in range(5)]
        hp.add(bm_tube(mouth, 0.007, 4), "ink")
    cfg["hair_fn"](hp, at, R, fy)
    return hp


def arm(side, pivot, cfg):
    """arm_l (side=+1, +X) or arm_r (side=-1). Hangs slightly outwards."""
    p = Part("arm_l" if side > 0 else "arm_r")
    pv = Vector(pivot)
    d = Vector((math.sin(math.radians(cfg.get("arm_splay", 10))) * side, 0.0, -1.0)).normalized()
    L = cfg.get("arm_len", 0.24)
    p.ball(cfg["sleeve_r"] * 1.06, tuple(pv), cfg["sleeve_mat"], uv=(10, 6))
    p.add(bm_tube([pv, pv + d * L], [cfg["sleeve_r"], cfg["sleeve_r"] * 0.88], 8), cfg["sleeve_mat"], smooth=True)
    if cfg.get("forearm_mat"):
        p.add(bm_tube([pv + d * (L - 0.01), pv + d * (L + cfg.get("forearm_len", 0.08))],
                      [cfg["sleeve_r"] * 0.68, cfg["sleeve_r"] * 0.62], 8), cfg["forearm_mat"], smooth=True)
        L += cfg.get("forearm_len", 0.08)
    p.add(bm_tube([pv + d * (L - 0.025), pv + d * (L + 0.005)], cfg["sleeve_r"] * 0.96, 8), cfg["cuff_mat"])
    p.ball(cfg.get("hand_r", 0.062), tuple(pv + d * (L + 0.05)), "skin", scale=(0.9, 1.0, 1.0), uv=(10, 7))
    return p


def leg(side, pivot, cfg):
    p = Part("leg_l" if side > 0 else "leg_r")
    x, y, z = pivot
    r = cfg["leg_r"]
    p.cyl(r, z - 0.12, (x, y, 0.12), cfg["pants_mat"], r2=r * 1.05, segs=8, smooth=True)
    bw = cfg.get("boot_w", 0.16)
    p.add(bm_box(bw, 0.23, 0.15, bevel=0.05, segs=2), "wood_dark", M((x, y - 0.03, 0.075)), smooth=True)
    p.cyl(r * 1.18, 0.05, (x, y, 0.13), cfg.get("boot_cuff", "wood_mid"), segs=8)
    return p


def assemble(cfg):
    model = common.reset()
    body = cfg["body_fn"]()
    body_ob = body.to_object(model, origin=(0, 0, 0), sharp_angle=60)
    hz = cfg["neck_z"]
    h = head((0, 0, hz + cfg["head_r"] * 0.95), cfg)
    objs = [body_ob, h.to_object(model, parent=body_ob, origin=(0, 0, hz), sharp_angle=60)]
    sx, sz = cfg["shoulder_x"], cfg["shoulder_z"]
    for side in (1, -1):
        a = arm(side, (side * sx, 0.0, sz), cfg)
        objs.append(a.to_object(model, parent=body_ob, origin=(side * sx, 0.0, sz), sharp_angle=60))
    hx, hzp = cfg["hip_x"], cfg["hip_z"]
    for side in (1, -1):
        l = leg(side, (side * hx, 0.0, hzp), cfg)
        objs.append(l.to_object(model, parent=body_ob, origin=(side * hx, 0.0, hzp), sharp_angle=60))
    return objs
