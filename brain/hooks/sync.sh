#!/bin/bash
# Sube brain/log a main (sin tocar la rama de trabajo) y a la rama actual. Best-effort, nunca falla el hook.
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
G="git -c user.name=brain-bot -c user.email=brain-bot@users.noreply.github.com"
[ -z "$(git status --porcelain brain/log)" ] && exit 0
# 1) commit en la rama actual y push
git add brain/log && $G commit -qm "brain: log de sesión" -- brain/log 2>/dev/null
BR=$(git rev-parse --abbrev-ref HEAD)
[ "$BR" != "HEAD" ] && [ "$BR" != "main" ] && git push -q origin "$BR" 2>/dev/null
# 2) copiar los logs a main mediante un worktree temporal
WT=$(mktemp -d)
for i in 1 2 3; do
  git fetch -q origin main 2>/dev/null || break
  git worktree add -q --detach "$WT/w" origin/main 2>/dev/null || break
  mkdir -p "$WT/w/brain/log" && cp brain/log/*.md "$WT/w/brain/log/" 2>/dev/null
  ( cd "$WT/w" && git add brain/log && { git diff --cached --quiet || $G commit -qm "brain: log de sesión"; } && git push -q origin HEAD:main 2>/dev/null ) && OK=1
  git worktree remove --force "$WT/w" 2>/dev/null
  [ "$OK" = 1 ] && break
done
rm -rf "$WT"; git worktree prune
exit 0
