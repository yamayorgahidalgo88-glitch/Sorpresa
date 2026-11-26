#!/bin/bash
# Al cerrar sesión: commit en la rama actual + sincroniza a main brain/ y entregables/ con fusión a 3 vías.
# Best-effort: nunca falla el hook.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
G="git -c user.name=brain-bot -c user.email=brain-bot@users.noreply.github.com"
P="brain entregables"
[ -z "$(git status --porcelain -- $P)" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main 2>/dev/null)" ] && exit 0
git add -- $P 2>/dev/null; git diff --cached --quiet || $G commit -qm "brain: sesión" -- $P 2>/dev/null
BR=$(git rev-parse --abbrev-ref HEAD)
[ "$BR" != "HEAD" ] && [ "$BR" != "main" ] && git push -q origin "$BR" 2>/dev/null
SID=$(git rev-parse --short HEAD)
TEXT='\.(md|txt|sh|py|json|js|html|css)$'
for i in 1 2 3; do
  OK=0; WT=$(mktemp -d)
  git fetch -q origin main 2>/dev/null || { rm -rf "$WT"; break; }
  git worktree add -q --detach "$WT/w" origin/main 2>/dev/null || { rm -rf "$WT"; break; }
  MB=$(git merge-base HEAD origin/main 2>/dev/null)
  if [ -n "$MB" ]; then
    git diff --name-only --diff-filter=AM "$MB" HEAD -- $P | while read -r f; do
      D="$WT/w/$f"; mkdir -p "$(dirname "$D")"
      if [ ! -e "$D" ]; then git show "HEAD:$f" > "$D"; continue; fi
      git show "HEAD:$f" > "$WT/ours"; git show "$MB:$f" > "$WT/base" 2>/dev/null || : > "$WT/base"
      cmp -s "$D" "$WT/ours" && continue
      if cmp -s "$D" "$WT/base"; then cp "$WT/ours" "$D"; continue; fi   # main no cambió: gana la sesión
      if echo "$f" | grep -Eq "$TEXT"; then
        cp "$D" "$WT/cur"
        if git merge-file -p "$WT/cur" "$WT/base" "$WT/ours" > "$WT/merged" 2>/dev/null; then cp "$WT/merged" "$D"
        else mkdir -p "$WT/w/brain/sesiones"; cp "$WT/ours" "$WT/w/brain/sesiones/conflicto-$SID-$(basename "$f")"; fi
      else  # binario cambiado en ambos lados: conservar los dos
        cp "$WT/ours" "$(dirname "$D")/$SID-$(basename "$f")"
      fi
    done
    ( cd "$WT/w" && git add -A -- $P && { git diff --cached --quiet || $G commit -qm "brain: sesión $SID"; } && git push -q origin HEAD:main 2>/dev/null ) && OK=1
  fi
  git worktree remove --force "$WT/w" 2>/dev/null; rm -rf "$WT"
  [ "$OK" = 1 ] && break
done
git worktree prune
exit 0
