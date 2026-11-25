#!/usr/bin/env python3
"""Cerebro automático. Modos: prompt | stop | start. Lee JSON de stdin (hooks de Claude Code)."""
import json, sys, os, datetime
ROOT = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
BRAIN = os.path.join(ROOT, "brain")
LOG = os.path.join(BRAIN, "log", datetime.date.today().isoformat() + ".md")
MAX_USER, MAX_ASSIST, MAX_INJECT = 1500, 1200, 3500

def append(text):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(text + "\n")

def clip(s, n):
    s = " ".join(s.split())
    return s if len(s) <= n else s[:n] + "…"

def last_assistant_text(path):
    last = ""
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                try: d = json.loads(line)
                except Exception: continue
                if d.get("type") != "assistant": continue
                c = (d.get("message") or {}).get("content")
                if isinstance(c, list):
                    t = "".join(b.get("text", "") for b in c if isinstance(b, dict) and b.get("type") == "text")
                elif isinstance(c, str): t = c
                else: t = ""
                if t.strip(): last = t
    except Exception: pass
    return last

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try: data = json.load(sys.stdin)
    except Exception: data = {}
    now = datetime.datetime.now().strftime("%H:%M")
    if mode == "prompt":
        p = data.get("prompt", "")
        if p.strip(): append(f"\n## {now} USUARIO\n{clip(p, MAX_USER)}")
    elif mode == "stop":
        if data.get("stop_hook_active"): return
        t = last_assistant_text(data.get("transcript_path", ""))
        if t: append(f"## {now} CLAUDE\n{clip(t, MAX_ASSIST)}")
    elif mode == "start":
        out = []
        try: out.append(open(os.path.join(BRAIN, "INDEX.md"), encoding="utf-8").read())
        except Exception: pass
        logs = sorted(f for f in os.listdir(os.path.join(BRAIN, "log"))) if os.path.isdir(os.path.join(BRAIN, "log")) else []
        if logs:
            txt = open(os.path.join(BRAIN, "log", logs[-1]), encoding="utf-8").read()
            out.append(f"# Memoria reciente ({logs[-1]}), últimas entradas\n" + txt[-MAX_INJECT:])
        print("\n\n".join(out))

main()
