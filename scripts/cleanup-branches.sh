#!/usr/bin/env bash
set -euo pipefail

# Limpieza segura de ramas locales/ remotas tras merge
# Uso:
#   ./scripts/cleanup-branches.sh                # limpia locales mergeadas y prune
#   ./scripts/cleanup-branches.sh --remote BR    # intenta borrar rama remota BR
#   HUSKY_SKIP=1 ./scripts/cleanup-branches.sh   # desactiva hooks si algún alias los invoca

PROTECTED_REGEX='^(main|reset/main|master|develop|stable/|autosave)$'

echo "🔄 Fetch + prune…"
git fetch -p

current=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current" != "reset/main" ]]; then
  echo "↪️  Cambiando a reset/main…"
  git checkout reset/main >/dev/null 2>&1 || true
fi

echo "🔎 Ramas locales mergeadas que se pueden borrar (excluyendo protegidas):"
merged=$(git branch --merged | sed 's/^..//' | grep -vE "$PROTECTED_REGEX" || true)
echo "$merged"

if [[ -n "$merged" ]]; then
  while read -r br; do
    [[ -z "$br" ]] && continue
    echo "🗑️  Borrando local: $br"
    git branch -d "$br" || git branch -D "$br" || true
  done <<< "$merged"
else
  echo "(no hay ramas locales mergeadas para borrar)"
fi

# Borrado remoto opcional
if [[ ${1-} == "--remote" && -n ${2-} ]]; then
  target="$2"
  echo "🌐 Intentando borrar remota: $target"
  if HUSKY=0 git push origin --delete "$target"; then
    echo "✅ Remota borrada: $target"
  else
    echo "⚠️  git push --delete falló, usando gh api…"
    gh api -X DELETE repos/:owner/:repo/git/refs/heads/"$target" || echo "⚠️  No existe ref remota $target"
  fi
fi

echo "🧹 Prune final…"
git fetch -p

echo "✅ Limpieza completada. Ramas locales actuales:"
git branch -vv


