#!/usr/bin/env python3
"""Genera brain/CODIGO.md: mapa del repo (archivos, tamaño, definiciones principales). Uso: mapa.py <raiz>"""
import os, re, sys
root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
SKIP = {".git", "node_modules", "log", ".claude"}
PAT = {
 ".js": r"^\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\(|function|\w+\s*=>))",
 ".ts": r"^\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|class\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\(|function|\w+\s*=>))",
 ".py": r"^(?:def|class)\s+(\w+)",
 ".sh": r"^(\w+)\s*\(\)\s*\{",
}
MAXNAMES, MAXBYTES = 10, 60000
rows = []
for d, dirs, files in os.walk(root):
    dirs[:] = sorted(x for x in dirs if x not in SKIP and not (d == root and x == "brain" and False))
    for f in sorted(files):
        p = os.path.join(d, f); rel = os.path.relpath(p, root)
        if rel in ("brain/CODIGO.md",) or rel.startswith("brain/log"): continue
        try: size = os.path.getsize(p)
        except OSError: continue
        ext = os.path.splitext(f)[1].lower(); names = []
        if ext in PAT and size < 400000:
            try:
                rx = re.compile(PAT[ext])
                for line in open(p, encoding="utf-8", errors="ignore"):
                    m = rx.match(line)
                    if m:
                        n = next((g for g in m.groups() if g), None)
                        if n and n not in names: names.append(n)
                        if len(names) >= MAXNAMES: break
            except Exception: pass
        rows.append((rel, size, names))
out = ["# Mapa del código (generado automáticamente, no editar)",
       "Archivos del repo con tamaño y definiciones principales. Úsalo para saber QUÉ existe y DÓNDE antes de abrir nada.", ""]
cur = None
for rel, size, names in rows:
    dn = os.path.dirname(rel) or "."
    if dn != cur: out.append(f"\n## {dn}/"); cur = dn
    kb = f"{size/1024:.0f}KB" if size >= 1024 else f"{size}B"
    out.append(f"- `{os.path.basename(rel)}` ({kb})" + (": " + ", ".join(names) if names else ""))
txt = "\n".join(out) + "\n"
if len(txt.encode()) > MAXBYTES: txt = txt.encode()[:MAXBYTES].decode("utf-8", "ignore") + "\n…(truncado)\n"
os.makedirs(os.path.join(root, "brain"), exist_ok=True)
open(os.path.join(root, "brain", "CODIGO.md"), "w", encoding="utf-8").write(txt)
