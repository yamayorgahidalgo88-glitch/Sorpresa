"""Shared helpers to build tap-to-toggle layers on top of a room picture.

A layer is a small transparent webp (only the pixels that change) placed on top
of casa/<room>.webp. Everything else in the original picture stays untouched.
"""
import json, os
import numpy as np, cv2
from PIL import Image

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'


class Room:
    def __init__(self, room):
        self.room = room
        self.base = np.array(Image.open(R + f'casa/{room}.webp').convert('RGB')).astype(np.float32)
        alt = R + f'casa/{room}-alt.webp'
        self.alt = np.array(Image.open(alt).convert('RGB')).astype(np.float32) if os.path.exists(alt) else None
        self.H, self.W = self.base.shape[:2]
        self.out = R + f'casa/{room}/'
        os.makedirs(self.out, exist_ok=True)
        self.layers = {}

    # ---------- masks ----------
    def poly(self, pts):
        m = np.zeros((self.H, self.W), np.uint8)
        cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
        return m > 0

    def rect(self, x0, y0, x1, y1):
        m = np.zeros((self.H, self.W), bool)
        m[y0:y1, x0:x1] = True
        return m

    def ellipse(self, cx, cy, rx, ry):
        m = np.zeros((self.H, self.W), np.uint8)
        cv2.ellipse(m, (int(cx), int(cy)), (int(rx), int(ry)), 0, 0, 360, 255, -1)
        return m > 0

    @staticmethod
    def grow(m, k):
        return cv2.dilate(m.astype(np.uint8), np.ones((k, k), np.uint8)) > 0

    @staticmethod
    def shrink(m, k):
        return cv2.erode(m.astype(np.uint8), np.ones((k, k), np.uint8)) > 0

    @staticmethod
    def clean(m, close=5, open_=3):
        m = m.astype(np.uint8)
        if close: m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((close, close), np.uint8))
        if open_: m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((open_, open_), np.uint8))
        return m > 0

    # ---------- colour ----------
    def match(self, src, ref_mask, src_mask=None, strength=1.0):
        """Colour-transfer src so that src[src_mask] has the Lab statistics of base[ref_mask]."""
        if src_mask is None: src_mask = ref_mask
        s = cv2.cvtColor(np.clip(src, 0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
        b = cv2.cvtColor(np.clip(self.base, 0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
        o = s.copy()
        for c in range(3):
            ms, ss = s[..., c][src_mask].mean(), s[..., c][src_mask].std() + 1e-3
            mb, sb = b[..., c][ref_mask].mean(), b[..., c][ref_mask].std() + 1e-3
            o[..., c] = (s[..., c] - ms) * (sb / ss) + mb
        o = s + (o - s) * strength
        return cv2.cvtColor(np.clip(o, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)

    def pixelize(self, img, k=3, mix=0.55):
        small = cv2.resize(img, (self.W // k, self.H // k), interpolation=cv2.INTER_AREA)
        big = cv2.resize(small, (self.W, self.H), interpolation=cv2.INTER_NEAREST)
        return big * mix + img * (1 - mix)

    # ---------- geometry ----------
    def remap(self, img, fx, fy):
        """out(x,y) = img(fx(x,y), fy(x,y))"""
        yy, xx = np.mgrid[0:self.H, 0:self.W].astype(np.float32)
        return cv2.remap(img, fx(xx, yy).astype(np.float32), fy(xx, yy).astype(np.float32),
                         cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    def affine(self, img, sx=1, sy=1, cx=0, cy=0, dx=0, dy=0, interp=cv2.INTER_LINEAR):
        """scale around (cx,cy) then translate"""
        M = np.float32([[sx, 0, cx - sx * cx + dx], [0, sy, cy - sy * cy + dy]])
        return cv2.warpAffine(img, M, (self.W, self.H), flags=interp, borderMode=cv2.BORDER_REFLECT)

    def warp_mask(self, m, sx=1, sy=1, cx=0, cy=0, dx=0, dy=0):
        M = np.float32([[sx, 0, cx - sx * cx + dx], [0, sy, cy - sy * cy + dy]])
        return cv2.warpAffine(m.astype(np.float32), M, (self.W, self.H), flags=cv2.INTER_NEAREST,
                              borderMode=cv2.BORDER_CONSTANT, borderValue=0) > 0.5

    def quadwarp(self, img, srcq, dstq):
        M = cv2.getPerspectiveTransform(np.float32(srcq), np.float32(dstq))
        return cv2.warpPerspective(img, M, (self.W, self.H), flags=cv2.INTER_NEAREST, borderMode=cv2.BORDER_REPLICATE)

    # ---------- filling holes ----------
    def harmonic(self, img, mask, known, iters=None):
        """Exact Laplace fill of `mask`; only `known` pixels act as boundary (others are ignored)."""
        import scipy.sparse as sp, scipy.sparse.linalg as spl
        ys, xs = np.where(mask)
        if not len(ys): return img
        idx = -np.ones((self.H, self.W), np.int64); idx[ys, xs] = np.arange(len(ys))
        n = len(ys); rows, cols, vals = [], [], []
        rhs = np.zeros((n, 3))
        deg = np.zeros(n)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            y2, x2 = ys + dy, xs + dx
            ok = (y2 >= 0) & (y2 < self.H) & (x2 >= 0) & (x2 < self.W)
            y2c, x2c = np.clip(y2, 0, self.H - 1), np.clip(x2, 0, self.W - 1)
            inm = ok & mask[y2c, x2c]
            kn = ok & ~mask[y2c, x2c] & known[y2c, x2c]
            deg += inm | kn
            i = np.arange(n)
            rows += list(i[inm]); cols += list(idx[y2c[inm], x2c[inm]]); vals += [-1.0] * int(inm.sum())
            rhs[kn] += img[y2c[kn], x2c[kn]]
        deg = np.maximum(deg, 1)
        Amat = sp.csr_matrix((vals + list(deg), (rows + list(range(n)), cols + list(range(n)))), shape=(n, n))
        out = img.copy()
        # pixels with no known pixel reachable stay singular -> tiny regularisation towards mean
        mean = img[known & ~mask].mean(0) if (known & ~mask).any() else img[mask].mean(0)
        Amat = Amat + sp.identity(n) * 1e-4
        rhs = rhs + 1e-4 * mean
        sol = spl.spsolve(Amat.tocsc(), rhs)
        out[ys, xs] = sol
        return out

    def clean_from(self, wall, k=5, margin=5):
        """pixels that are plain wall (thin grout lines count as wall, objects don't)"""
        obj = cv2.morphologyEx((~wall).astype(np.uint8), cv2.MORPH_OPEN, np.ones((k, k), np.uint8))
        return ~(cv2.dilate(obj, np.ones((margin * 2 + 1, margin * 2 + 1), np.uint8)) > 0)

    def clone_fill(self, img, mask, clean, period, known=None, tries=4):
        """Fill `mask` with texture copied from clean areas shifted by whole tiles
        (so grout lines line up), then remove the seam with a Laplace-filled offset."""
        px, py = period
        offs = sorted({(i * px, j * py) for i in range(-tries, tries + 1) for j in range(-tries, tries + 1)} - {(0, 0)},
                      key=lambda o: abs(o[0]) + abs(o[1]))
        src = np.zeros_like(img); got = np.zeros((self.H, self.W), bool)
        ys, xs = np.where(mask)
        for dx, dy in offs:
            todo = ~got[ys, xs]
            if not todo.any(): break
            sy, sx = ys[todo] + dy, xs[todo] + dx
            ok = (sy >= 0) & (sy < self.H) & (sx >= 0) & (sx < self.W)
            sy2, sx2 = np.clip(sy, 0, self.H - 1), np.clip(sx, 0, self.W - 1)
            ok &= clean[sy2, sx2] & ~mask[sy2, sx2]
            ty, tx = ys[todo][ok], xs[todo][ok]
            src[ty, tx] = img[sy2[ok], sx2[ok]]; got[ty, tx] = True
        out = img.copy()
        miss = mask & ~got
        if known is None: known = clean
        # low-frequency correction: make the copied texture meet the surroundings smoothly
        diff = np.zeros_like(img)
        ring = self.grow(mask, 3) & ~mask & known
        diff[ring] = img[ring] - self._shift_src(img, mask, ring, offs, clean)
        d = self.harmonic(diff, mask, ring)
        out[mask & got] = src[mask & got] + d[mask & got]
        if miss.any():
            out = self.harmonic(out, miss, known | (mask & got))
        return out

    def _shift_src(self, img, mask, ring, offs, clean):
        # what the texture source would have given on the ring (same rule as inside)
        ys, xs = np.where(ring); val = img[ys, xs].copy(); got = np.zeros(len(ys), bool)
        for dx, dy in offs:
            sy, sx = ys + dy, xs + dx
            ok = ~got & (sy >= 0) & (sy < self.H) & (sx >= 0) & (sx < self.W)
            sy2, sx2 = np.clip(sy, 0, self.H - 1), np.clip(sx, 0, self.W - 1)
            ok &= clean[sy2, sx2] & ~mask[sy2, sx2]
            val[ok] = img[sy2[ok], sx2[ok]]; got |= ok
            if got.all(): break
        return val

    def seamless(self, src, mask, known=None, ring=2):
        """Paste src into mask; the colour difference along the border is spread smoothly
        inside (Poisson-like), so the patch meets the original picture without a seam."""
        if known is None: known = np.ones(mask.shape, bool)
        rg = self.grow(mask, 1 + 2 * ring) & ~mask & known
        diff = np.zeros_like(src); diff[rg] = self.base[rg] - src[rg]
        d = self.harmonic(diff, mask, rg)
        out = self.base.copy(); out[mask] = src[mask] + d[mask]
        return out

    def grout(self, img, mask, hlines=(), vlines=(), color=None, width=2, darken=0.82):
        """Draw tile grout lines across a filled area (horizontal y's and vertical x's)."""
        out = img.copy()
        for y in hlines:
            for k in range(width):
                row = mask[y + k]
                out[y + k][row] = (color if color is not None else out[y + k][row] * darken)
        for x in vlines:
            for k in range(width):
                col = mask[:, x + k]
                out[:, x + k][col] = (color if color is not None else out[:, x + k][col] * darken)
        return out

    @staticmethod
    def noise(shape, sigma=2.0, k=3, seed=1):
        H, W = shape
        rng = np.random.default_rng(seed)
        return rng.normal(0, sigma, (H // k + 1, W // k + 1)).repeat(k, 0).repeat(k, 1)[:H, :W]

    # ---------- doors ----------
    def door_panel(self, out, q, hinge, openness=0.42, dark=0.72, lift=7, drop=9):
        TL, TR, BR, BL = [np.float32(p) for p in q]
        w = TR[0] - TL[0]
        if hinge == 'l':
            dst = [TL + np.float32([-openness * w, -lift]), TL, BL, BL + np.float32([-openness * w, drop])]
        else:
            dst = [TR, TR + np.float32([openness * w, -lift]), BR + np.float32([openness * w, drop]), BR]
        panel = self.quadwarp(self.base, q, dst) * dark
        pm = self.poly([tuple(map(int, map(round, p))) for p in dst])
        out[pm] = panel[pm]
        edge = pm & ~self.shrink(pm, 3)
        out[edge] = (30, 12, 2)
        return pm

    # ---------- output ----------
    def save(self, name, rgb, alpha, hits, group=None, label=None, feather=1.5):
        a = alpha.astype(np.float32)
        if feather: a = cv2.GaussianBlur(a, (0, 0), feather)
        ys, xs = np.where(a > 0.01)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)])[y0:y1, x0:x1].astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(self.out + name + '.webp', 'WEBP', quality=90, method=6)
        self.layers[name] = {'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0),
                             'hits': [list(map(int, h)) for h in hits], 'group': group or name,
                             'label': label or name.replace('_', ' ')}

    def preview(self, path):
        pv = self.base.copy()
        for n, l in self.layers.items():
            im = np.array(Image.open(self.out + n + '.webp')).astype(np.float32)
            x, y, w, h = l['x'], l['y'], l['w'], l['h']
            al = im[..., 3:] / 255
            pv[y:y + h, x:x + w] = pv[y:y + h, x:x + w] * (1 - al) + im[..., :3] * al
        Image.fromarray(pv.astype(np.uint8)).save(path)

    def write(self):
        json.dump(self.layers, open(self.out + 'capas.json', 'w'), indent=1)
        # inline into casa.html (CAPAS.<room>)
        p = R + 'casa.html'
        html = open(p).read()
        tag_a, tag_b = f'/*CAPAS:{self.room}*/', f'/*FIN:{self.room}*/'
        blob = tag_a + json.dumps(self.layers, separators=(',', ':'), ensure_ascii=False) + tag_b
        if tag_a in html:
            a = html.index(tag_a); b = html.index(tag_b) + len(tag_b)
            html = html[:a] + blob + html[b:]
        else:
            anchor = 'const CAPAS={'
            html = html.replace(anchor, anchor + f'\n  {self.room}:' + blob + ',')
        open(p, 'w').write(html)
