"""Empareja jugadores de Transfermarkt con filas del CSV de FC 26 (fecha de nacimiento + apellido)."""
import re, unicodedata
from collections import defaultdict
from names import norm

def toks(s):
    return {t for t in norm(s).split() if len(t) >= 2}

class FCIndex:
    def __init__(self, rows):
        self.by_dob = defaultdict(list)
        self.by_name = defaultdict(list)
        self.by_club = defaultdict(list)
        for r in rows:
            r['_t'] = toks(r['long_name']) | toks(r['short_name'])
            self.by_dob[r['dob']].append(r)
            self.by_club[norm(r['club_name'])].append(r)
            self.by_name[norm(r['long_name'])].append(r)
            self.by_name[norm(r['short_name'])].append(r)
        self.used = set()

    def find(self, name, dob, hints=(), age=None):
        t = toks(name)
        best, bs = None, 0
        cands = self.by_dob.get(dob, [])
        for r in cands:
            inter = t & r['_t']
            if not inter: continue
            s = len(inter) / max(1, len(t)) + (0.5 if any(len(x) >= 4 for x in inter) else 0)
            if r['player_id'] in self.used: s -= 0.3
            if s > bs: best, bs = r, s
        if best and bs >= 0.5:
            self.used.add(best['player_id']); return best
        # misma persona con fecha de nacimiento distinta en las fuentes (±1 año)
        y = int(dob[:4]) if dob else 0
        for r in self.by_name.get(norm(name), []):
            ry = int(r['dob'][:4]) if r['dob'] else 0
            if abs(ry - y) <= 1 and r['player_id'] not in self.used:
                self.used.add(r['player_id']); return r
        # misma fecha de nacimiento y el club (actual o de procedencia) coincide: acepta aunque el nombre difiera (apodos)
        for r in cands:
            if r['player_id'] not in self.used and norm(r['club_name']) in hints:
                self.used.add(r['player_id']); return r
        # mismo club y apellido parecido, con ±1 año de diferencia
        best, bs = None, 0
        for h in hints:
            for r in self.by_club.get(h, []):
                if r['player_id'] in self.used: continue
                ry = int(r['dob'][:4]) if r['dob'] else 0
                inter = {x for x in (t & r['_t']) if len(x) >= 4}
                if inter and abs(ry - y) <= 1 and len(inter) > bs: best, bs = r, len(inter)
        if best:
            self.used.add(best['player_id']); return best
        return None
