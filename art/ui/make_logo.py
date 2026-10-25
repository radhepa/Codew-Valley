"""The Codew Valley logo: the pixel wordmark (gold CODEW with a sprout on the O, VALLEY on a wooden ribbon)
and the game's badge (a gold C with its sprout on a wooden tile), plus the favicon, app icons and README art.
Run: python art/ui/make_logo.py"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
B4 = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
OUTL = '#2e170c'


def C(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)] + [int(h[6:8], 16) if len(h) == 8 else 255], np.uint8)


def glyphs(src):
    out = {}
    for block in src.strip().split('\n\n'):
        lines = block.strip().split('\n')
        out[lines[0].strip()] = [l.strip() for l in lines[1:]]
    return out


# 13 rows, 3px strokes
BIG = glyphs("""
C
..#########
.##########
###########
####.......
###........
###........
###........
###........
###........
####.......
###########
.##########
..#########

O
..#######..
.#########.
###########
####...####
###.....###
###.....###
###.....###
###.....###
###.....###
####...####
###########
.#########.
..#######..

D
#########..
##########.
###########
###....####
###.....###
###.....###
###.....###
###.....###
###.....###
###....####
###########
##########.
#########..

E
##########
##########
##########
###.......
###.......
########..
########..
########..
###.......
###.......
##########
##########
##########

W
###.........###
###.........###
###.........###
###.........###
###...###...###
###...###...###
###...###...###
###...###...###
###...###...###
####.#####.####
###############
.######.######.
..####...####..
""")

# 9 rows, 2px strokes
SMALL = glyphs("""
V
##....##
##....##
##....##
##....##
##....##
.##..##.
.##..##.
..####..
...##...

A
..####..
.######.
##....##
##....##
########
########
##....##
##....##
##....##

L
##.....
##.....
##.....
##.....
##.....
##.....
##.....
#######
#######

E
#######
#######
##.....
##.....
######.
##.....
##.....
#######
#######

Y
##....##
##....##
.##..##.
.##..##.
..####..
...##...
...##...
...##...
...##...
""")


def word(text, font, gap):
    rows = len(next(iter(font.values())))
    w = sum(len(font[ch][0]) for ch in text) + gap * (len(text) - 1)
    m = np.zeros((rows, w), bool)
    x, starts = 0, []
    for ch in text:
        g = font[ch]
        starts.append(x)
        for y, row in enumerate(g):
            for i, c in enumerate(row):
                if c == '#':
                    m[y, x + i] = True
        x += len(g[0]) + gap
    return m, starts


def grow(m, n=1, diag=True):
    for _ in range(n):
        d = m.copy()
        d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
        if diag:
            d[1:, 1:] |= m[:-1, :-1]; d[1:, :-1] |= m[:-1, 1:]; d[:-1, 1:] |= m[1:, :-1]; d[:-1, :-1] |= m[1:, 1:]
        m = d
    return m


def shift(m, dx, dy):
    o = np.zeros_like(m)
    h, w = m.shape
    o[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = m[max(-dy, 0):h - max(dy, 0), max(-dx, 0):w - max(dx, 0)]
    return o


class Canvas:
    def __init__(s, w, h):
        s.a = np.zeros((h, w, 4), np.uint8)

    def paint(s, mask, col):
        if callable(col):
            for y, x in np.argwhere(mask):
                s.a[y, x] = C(col(x, y))
        else:
            s.a[mask] = C(col)

    def px(s, x, y, col):
        if 0 <= y < s.a.shape[0] and 0 <= x < s.a.shape[1]:
            s.a[y, x] = C(col)

    def image(s, scale=1):
        im = Image.fromarray(s.a, 'RGBA')
        return im.resize((im.width * scale, im.height * scale), Image.NEAREST) if scale > 1 else im


def place(mask, W, H, ox, oy):
    o = np.zeros((H, W), bool)
    h, w = mask.shape
    o[oy:oy + h, ox:ox + w] = mask
    return o


def dither(bands, t, x, y):
    """bands: colours top to bottom; t in [0,1]; ordered dither at the band seams."""
    f = t * (len(bands) - 1)
    i = int(f)
    if i >= len(bands) - 1:
        return bands[-1]
    return bands[i + 1] if (f - i) > 0.25 + bayer(x, y) * 0.5 else bands[i]


def bayer(x, y):
    return B4[y % 4][x % 4]


GOLD = ['#ffe680', '#ffd23f', '#f6b22e']
DEPTH = ['#d07a22', '#a8561c', '#7a3a14']
LEAF = {'h': '#c6f08a', 'm': '#6cc44a', 's': '#3a8a32', 't': '#4f9a34'}
SPROUT = [
    "........hhh.",
    ".hh....hhmmm",
    "hhmm..hhmmms",
    "hmmmm.hmmmss",
    ".mmmsstmmss.",
    "..sss.tss...",
    "......t.....",
    "......t.....",
    "......t.....",
]


def gold_face(cv, face, top, rows):
    """Gold fill in three dithered bands, with a bright rim along the top and left edges."""
    up = shift(face, 0, 1)
    left = shift(face, 1, 0)

    def col(x, y):
        if not up[y, x]:
            return '#fffbe8'
        if not left[y, x]:
            return '#fff0a8'
        return dither(GOLD, (y - top) / (rows - 1), x, y)
    cv.paint(face, col)


def extrude(cv, face, n):
    """Solid depth under the letters, n pixels deep, darker the further down."""
    depth = np.zeros_like(face)
    for d in range(n, 0, -1):
        band = shift(face, 0, d) & ~face
        cv.paint(band, DEPTH[min(d - 1, len(DEPTH) - 1)] if d < n else DEPTH[-1])
        depth |= band
    return depth


def sprout(cv, x, y):
    """The seedling: its stem foot sits at (x, y)."""
    h = len(SPROUT)
    m = np.zeros(cv.a.shape[:2], bool)
    cells = []
    for r, row in enumerate(SPROUT):
        for i, k in enumerate(row):
            if k != '.':
                px, py = x - 6 + i, y - h + 1 + r
                m[py, px] = True
                cells.append((px, py, LEAF[k]))
    cv.paint(grow(m, 1, diag=False) & ~m & (cv.a[:, :, 3] < 255), OUTL)
    for px, py, c in cells:
        cv.px(px, py, c)


def sparkle(cv, x, y):
    """A four-point rune glint centred on (x, y)."""
    m = np.zeros(cv.a.shape[:2], bool)
    arms = [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)]
    for dx, dy in arms:
        m[y + dy, x + dx] = True
    cv.paint(grow(m, 1, diag=False) & ~m & (cv.a[:, :, 3] < 255), '#123c38')
    for dx, dy in arms:
        cv.px(x + dx, y + dy, '#ffffff' if (dx, dy) == (0, 0) else '#8ff0d4' if abs(dx) + abs(dy) == 1 else '#3fd0b4')


def wordmark():
    top_m, top_x = word('CODEW', BIG, 2)
    bot_m, _ = word('VALLEY', SMALL, 2)
    TW = top_m.shape[1]
    W, H = TW + 12, 50
    cv = Canvas(W, H)
    ox, oy = 6, 11
    face = place(top_m, W, H, ox, oy)
    body = face.copy()
    for d in range(1, 4):
        body |= shift(face, 0, d)
    shadow = shift(grow(body, 1), 1, 2)
    cv.paint(shadow & ~grow(body, 1), '#2e170c66')
    cv.paint(grow(body, 1) & ~body, OUTL)
    extrude(cv, face, 3)
    gold_face(cv, face, oy, 13)
    # sprout on the O
    o_mid = ox + top_x[1] + 5
    sprout(cv, o_mid, oy - 1)
    sparkle(cv, ox + TW + 1, oy - 2)
    sparkle(cv, ox + top_x[2] + 9, oy - 4)

    # the ribbon: a plank with notched tails tucked behind, VALLEY in cream
    rib_y = oy + 13 + 3 + 3
    rib_h = 15
    rx0, rx1 = ox + 2, ox + TW - 2
    plank = np.zeros((H, W), bool)
    plank[rib_y:rib_y + rib_h, rx0:rx1] = True
    for (cx, cy) in [(rx0, rib_y), (rx1 - 1, rib_y), (rx0, rib_y + rib_h - 1), (rx1 - 1, rib_y + rib_h - 1)]:
        plank[cy, cx] = False
    tails = np.zeros((H, W), bool)
    for side in (-1, 1):
        x0 = rx0 - 5 if side < 0 else rx1 - 1
        for yy in range(rib_y + 3, rib_y + rib_h + 3):
            for xx in range(x0, x0 + 6):
                notch = abs(yy - (rib_y + 3 + (rib_h) / 2)) < (3 - abs(xx - (x0 if side < 0 else x0 + 5)))
                if not notch:
                    tails[yy, xx] = True
    tails &= ~plank
    rib = plank | tails
    cv.paint(grow(rib, 1) & ~rib & (cv.a[:, :, 3] < 255), OUTL)
    cv.paint(tails, lambda x, y: '#6a3212' if (x + y) % 5 else '#5a2a10')
    grain = lambda x, y: '#e8a560' if y == rib_y else '#7a3f18' if y == rib_y + rib_h - 1 else \
        ('#a85c26' if ((x * 7 + (y - rib_y) * 13) % 23 == 0 or (y - rib_y) % 5 == 4 and (x // 9) % 3 == 0) else '#c27434')
    cv.paint(plank, grain)
    lm = place(bot_m, W, H, (W - bot_m.shape[1]) // 2, rib_y + 3)
    cv.paint(shift(lm, 0, 1) & ~lm & plank, '#5e2e14')
    cv.paint(lm, lambda x, y: '#fffbe8' if y == rib_y + 3 else '#ffeec4' if y < rib_y + 8 else '#f3d49a')
    return crop(cv)


def crop(cv):
    a = cv.a
    ys, xs = np.nonzero(a[:, :, 3])
    cv.a = a[max(ys.min() - 1, 0):ys.max() + 2, max(xs.min() - 1, 0):xs.max() + 2].copy()
    return cv


def badge(n=32):
    """The game's mark: a gold C with its sprout on a teal-and-wood tile."""
    cv = Canvas(n, n)
    pic = np.zeros((n, n), bool)
    for y in range(n):
        for x in range(n):
            cx, cy = min(x, n - 1 - x), min(y, n - 1 - y)
            k = min(cx, cy, cx + cy - 3)
            if k == 0:
                cv.px(x, y, OUTL)
            elif k in (1, 2):
                light = y < n - 1 - x
                cv.px(x, y, ('#e8a560' if k == 1 else '#c9783a') if light else ('#7a3f18' if k == 1 else '#94511f'))
            elif k > 2:
                pic[y, x] = True
    wood = pic
    sky = ['#bfe8ff', '#9ad8f6', '#7cc4ec']
    cv.paint(wood, lambda x, y: dither(sky, min(1, (y - 3) / (n * 0.55)), x, y))
    # a hill
    hill = np.zeros((n, n), bool)
    for x in range(n):
        h = int(n * 0.66 + 3 * np.cos((x - n * 0.7) / n * 4))
        hill[h:, x] = True
    hill &= wood
    cv.paint(hill, lambda x, y: '#9ad85a' if not hill[y - 1, x] else dither(['#6cc44a', '#4fa83a', '#3a8a32'], min(1, (y - n * 0.6) / (n * 0.3)), x, y))
    # the C, 13 rows tall, centred a little low
    g = BIG['C']
    m = np.zeros((13, len(g[0])), bool)
    for y, row in enumerate(g):
        for i, c in enumerate(row):
            m[y, i] = c == '#'
    ox, oy = (n - m.shape[1]) // 2, n - 13 - 7
    face = place(m, n, n, ox, oy)
    body = face | shift(face, 0, 1) | shift(face, 0, 2)
    cv.paint(grow(body, 1) & ~body, OUTL)
    extrude(cv, face, 2)
    gold_face(cv, face, oy, 13)
    sprout(cv, ox + 6, oy - 1)
    return cv


def svg(cv):
    """Pixel art as crisp SVG rects (one per horizontal run)."""
    a = cv.a
    h, w = a.shape[:2]
    rects = []
    for y in range(h):
        x = 0
        while x < w:
            if a[y, x, 3] == 0:
                x += 1
                continue
            c = tuple(a[y, x])
            x1 = x
            while x1 < w and tuple(a[y, x1]) == c:
                x1 += 1
            rects.append(f'<rect x="{x}" y="{y}" width="{x1 - x}" height="1" fill="#{c[0]:02x}{c[1]:02x}{c[2]:02x}"/>')
            x = x1
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" shape-rendering="crispEdges">' + ''.join(rects) + '</svg>'


if __name__ == '__main__':
    j = lambda *p: os.path.normpath(os.path.join(ROOT, *p))
    os.makedirs(j('art', 'logo'), exist_ok=True)
    wm = wordmark()
    wm.image().save(j('src', 'ui', 'px', 'logo.png'), optimize=True)
    wm.image(8).save(j('art', 'logo', 'codew-valley-logo.png'), optimize=True)
    b = badge()
    b.image(16).save(j('art', 'logo', 'codew-valley-icon.png'), optimize=True)
    for size, name in [(1, 'favicon-32.png'), (6, 'icon-192.png'), (16, 'icon-512.png')]:
        b.image(size).save(j('public', name), optimize=True)
    b.image(6).resize((180, 180), Image.NEAREST).save(j('public', 'apple-touch-icon.png'), optimize=True)
    open(j('public', 'favicon.svg'), 'w').write(svg(b))
    print('wordmark', wm.a.shape[1], 'x', wm.a.shape[0], '| badge', b.a.shape[1])
