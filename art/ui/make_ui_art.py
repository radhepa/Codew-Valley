"""UI art for the pixel look: nine-slice frames (4x, and 3x for buttons) and pixel icons (3x and 2x).
Run: python art/ui/make_ui_art.py src/ui/px"""
import math, os, sys
import numpy as np
from PIL import Image, ImageDraw

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def C(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)] + [255], np.uint8)


class Img:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.a = np.zeros((h, w, 4), np.uint8)

    def set(s, x, y, c):
        x, y = int(x), int(y)
        if c is not None and 0 <= x < s.w and 0 <= y < s.h:
            s.a[y, x] = C(c)

    def save(s, name, scale=1):
        im = Image.fromarray(s.a, 'RGBA')
        if scale > 1:
            im = im.resize((s.w * scale, s.h * scale), Image.NEAREST)
        im.save(os.path.join(OUT, name), optimize=True)


def layer(img):
    return Img(img.w, img.h)


def compose(dst, L, outline=None):
    m = L.a[:, :, 3] > 0
    if outline:
        d = m.copy()
        d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        dst.a[d & ~m] = C(outline)
    dst.a[m] = L.a[m]


def bayer(x, y):
    return B4[int(y) % 4][int(x) % 4]


def shade3(x, y, cx, cy, R, hl, mid, sh, lo=-0.35, hi=0.4):
    d = ((x - cx) * -0.6 + (y - cy) * -0.8) / max(R, 1) + (bayer(x, y) - 0.5) * 0.3
    return hl if d > hi else sh if d < lo else mid


def disk(L, cx, cy, r, fn, ry=None):
    ry = ry or r
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - r - 1), int(cx + r + 2)):
            if ((x - cx) / r) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                L.set(x, y, fn(x, y))


def rect(L, x0, y0, x1, y1, fn):
    for y in range(int(y0), int(y1)):
        for x in range(int(x0), int(x1)):
            L.set(x, y, fn(x, y) if callable(fn) else fn)


def poly(L, pts, fn):
    m = Image.new('1', (L.w, L.h), 0)
    ImageDraw.Draw(m).polygon([(int(a), int(b)) for a, b in pts], fill=1)
    for y, x in np.argwhere(np.array(m)):
        L.set(x, y, fn(x, y) if callable(fn) else fn)


# ---------------- nine-slice frames (saved 4x) ----------------

def frame(name, rings, fill, corner=8, cut=2, scale=4, size=None):
    S = size or corner * 3
    F = Img(S, S)
    for y in range(S):
        for x in range(S):
            cx, cy = min(x, S - 1 - x), min(y, S - 1 - y)
            k = min(cx, cy, cx + cy - cut)
            if k < 0:
                continue
            if k < len(rings):
                c = rings[k]
                if isinstance(c, tuple):
                    lightside = (cy == min(cx, cy) and y < S / 2) or (cx == min(cx, cy) and x < S / 2 and cy != min(cx, cy))
                    c = c[0] if lightside else c[1]
            else:
                c = fill
            F.set(x, y, c)
    F.save(name, scale)
    F.save(name.replace('.png', '_3x.png'), 3)


OUTL = '#3b2014'
frame('f_paper.png', [OUTL, ('#e39a4f', '#a65a26'), ('#c27434', '#8a4a1f'), '#5e2e14', ('#fff1d0', '#e7c48a')], '#f9dda6', corner=8)
frame('f_plate.png', [OUTL, ('#e39a4f', '#a65a26'), '#5e2e14', ('#fff1d0', '#e7c48a')], '#f9dda6', corner=6, size=18)
frame('f_wood.png', [OUTL, ('#e8a560', '#7a3f18'), ('#c9783a', '#94511f')], '#b0652e', corner=5, size=15)
frame('f_gold.png', [OUTL, ('#fff3a8', '#b8741a'), ('#ffd75a', '#d4901f')], '#f2b53c', corner=5, size=15)
frame('f_card.png', [OUTL, ('#fff6dc', '#cf9e60'), '#f3d49a'], '#fbe6b8', corner=5, size=15)
frame('f_card_on.png', [OUTL, '#ffd23f', '#ffd23f', ('#fff6dc', '#cf9e60')], '#fff2cc', corner=6, size=18)
frame('f_teal.png', [OUTL, ('#9ff0dc', '#1f6b64'), ('#62cdb4', '#2a8a7a')], '#3aa892', corner=5, size=15)
frame('f_mint.png', ['#163f3b', ('#ffffff', '#5fb8a4'), '#a6e6d4'], '#cdf3e6', corner=5, size=15)
frame('f_rust.png', ['#4a1408', ('#ffd6c0', '#b0532e'), '#f0b090'], '#fbd8c4', corner=5, size=15)
frame('f_slate.png', ['#1b100a', ('#6a4a30', '#2a1a10'), '#4a3220'], '#3a2618', corner=5, size=15)
frame('f_key.png', [OUTL, ('#8a5a3a', '#2a170a')], '#5a3820', corner=4, size=12, cut=1)


# ---------------- icons (saved 3x) ----------------

def icon(name, n, draw, out=OUTL, scale=3):
    I = Img(n, n)
    L = layer(I)
    draw(L)
    compose(I, L, out)
    I.save(name, scale)
    I.save(name.replace('.png', '_2x.png'), 2)


def heart_draw(full):
    rows = ["..ooo.ooo..", ".oRRRoRRRo.", "oRWRRRRRRDo", "oRWRRRRRRDo", "oRRRRRRRDDo", ".oRRRRRRDo.", "..oRRRRDo..", "...oRRDo...", "....oDo....", ".....o....."]
    pal = {'o': OUTL, 'R': '#e8544a' if full else '#8a5a4a', 'W': '#ffd0c8' if full else '#a87a68', 'D': '#b8322e' if full else '#6e4436'}
    def d(L):
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch in pal:
                    L.set(x + 1, y + 1, pal[ch])
    return d


icon('i_heart.png', 13, heart_draw(True), out=None)
icon('i_heart_empty.png', 13, heart_draw(False), out=None)
icon('i_coin.png', 13, lambda L: (disk(L, 6, 6, 5.2, lambda x, y: '#fff2a0' if (x - 6) + (y - 6) < -4 else '#c8801c' if (x - 6) + (y - 6) > 3.5 or math.hypot(x - 6, y - 6) > 4.6 else '#f2c040'),
                                  rect(L, 6, 3, 7, 10, '#c8801c')))
icon('i_wood.png', 13, lambda L: (rect(L, 1, 4, 10, 10, lambda x, y: '#c88a4a' if y == 4 else '#7a4422' if y == 9 else '#9a5a2a'),
                                  disk(L, 10, 7, 2.2, lambda x, y: '#e8b878' if math.hypot(x - 10, y - 7) < 1.3 else '#b8783a', ry=3.2),
                                  L.set(10, 7, '#9a5a2a'), L.set(5, 6, '#7a4422'), L.set(6, 6, '#7a4422')))
icon('i_stone.png', 13, lambda L: (disk(L, 6, 7, 5.5, lambda x, y: shade3(x, y, 5, 5, 5, '#d0d4dc', '#a4a9b4', '#7a7e8c'), ry=4.2),
                                   L.set(7, 6, '#6a6e7c'), L.set(8, 7, '#6a6e7c'), L.set(8, 8, '#6a6e7c')))
icon('i_bag.png', 13, lambda L: (disk(L, 6, 8, 5, lambda x, y: shade3(x, y, 5, 7, 5, '#e8c48a', '#c99a5c', '#9a6a3a'), ry=4),
                                 rect(L, 4, 2, 9, 4, '#c99a5c'), rect(L, 3, 4, 10, 5, '#7a4a2a'), L.set(6, 8, '#9a6a3a'), L.set(6, 9, '#9a6a3a')))
icon('i_book.png', 13, lambda L: (rect(L, 2, 1, 11, 12, '#2f8f86'), rect(L, 2, 1, 4, 12, '#1f6b64'), rect(L, 10, 2, 11, 11, '#f6ecd4'),
                                  [L.set(7 + d, 4 + d, '#ffd23f') for d in range(4)], [L.set(10 - d, 4 + d, '#ffd23f') for d in range(4)]))
icon('i_friends.png', 13, lambda L: (disk(L, 4.5, 5, 2.6, lambda x, y: '#f6c99c'), disk(L, 8.5, 5, 2.6, lambda x, y: '#e3a878'),
                                     rect(L, 1, 9, 8, 12, '#6f9a4f'), rect(L, 6, 9, 12, 12, '#3f6fa0'),
                                     L.set(4, 2, '#b8582e'), L.set(5, 2, '#b8582e'), L.set(8, 2, '#4a2c16'), L.set(9, 2, '#4a2c16')))


def gear(L):
    for a in range(8):
        t = a * math.pi / 4
        rect(L, 6 + round(math.cos(t) * 4.6) - .5, 6 + round(math.sin(t) * 4.6) - .5, 6 + round(math.cos(t) * 4.6) + 1.5, 6 + round(math.sin(t) * 4.6) + 1.5, '#a4a9b4')
    disk(L, 6.5, 6.5, 4, lambda x, y: shade3(x, y, 6, 6, 4, '#d0d4dc', '#a4a9b4', '#7a7e8c'))
    disk(L, 6.5, 6.5, 1.6, lambda x, y: '#4a4e5a')


icon('i_gear.png', 14, gear)
icon('i_sun.png', 15, lambda L: ([L.set(7 + round(math.cos(a * math.pi / 4) * 6), 7 + round(math.sin(a * math.pi / 4) * 6), '#f2a33a') for a in range(8)],
                                 disk(L, 7, 7, 4, lambda x, y: '#fff2a0' if (x - 7) + (y - 7) < -2 else '#ffd23f')), out='#9a5a12')
icon('i_rune.png', 13, lambda L: (rect(L, 2, 1, 11, 12, lambda x, y: '#a4a9b4' if x < 6 else '#868b98'),
                                  [L.set(4 + d, 3 + d, '#3fd0b4') for d in range(6)], [L.set(9 - d, 3 + d, '#3fd0b4') for d in range(6)]), out='#2a2a3a')
icon('i_play.png', 11, lambda L: [rect(L, 2 + i, 1 + i // 2, 3 + i, 10 - i // 2, '#3b2014') for i in range(0, 8)], out=None)
icon('i_next.png', 9, lambda L: [rect(L, 2 + i, 1 + i, 3 + i, 8 - i, '#fff1d6') for i in range(0, 4)], out=OUTL)

def speaker(L, waves):
    rect(L, 1, 5, 4, 9, '#c99a5c')
    poly(L, [(4, 5), (8, 1), (8, 12), (4, 8)], lambda x, y: '#e8c48a' if y < 6 else '#c99a5c')
    if waves:
        for y in range(4, 10):
            L.set(10, y, '#3b2014')
        for y in range(2, 12):
            L.set(12, y, '#3b2014')
    else:
        for d in range(5):
            L.set(9 + d, 4 + d, '#c8322e'); L.set(13 - d, 4 + d, '#c8322e')


icon('i_sound.png', 14, lambda L: speaker(L, True))
icon('i_mute.png', 15, lambda L: speaker(L, False))
print('ok', len(os.listdir(OUT)), 'files')
