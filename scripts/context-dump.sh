#!/usr/bin/env bash
set -euo pipefail

echo "# Context dump"

echo "\n## Git"
git rev-parse --abbrev-ref HEAD 2>/dev/null | xargs -I{} echo "Rama actual: {}"
git status -sb 2>/dev/null || true

echo "\n## Remoto"
git remote -v 2>/dev/null | sed 's/^/  /'

echo "\n## PR (si gh está disponible)"
if command -v gh >/dev/null 2>&1; then
  gh pr status || true
else
  echo "  gh CLI no disponible"
fi

echo "\n## package.json"
if [ -f package.json ]; then
  node -e 'const p=require("./package.json"); console.log("Nombre:",p.name); console.log("Versión:",p.version); console.log("Scripts:",Object.keys(p.scripts||{}).join(", "))' || true
fi

echo "\n## Variables requeridas (.env.example)"
if [ -f .env.example ]; then
  echo "(Encontrado .env.example en la raíz)"
  grep -E '^[A-Z0-9_]+=|^#' .env.example | sed 's/^/  /'
elif [ -f docs/.env.example ]; then
  echo "(Encontrado docs/.env.example)"
  grep -E '^[A-Z0-9_]+=|^#' docs/.env.example | sed 's/^/  /'
else
  echo "  No se encontró .env.example"
fi

echo "\n## Puerto y dev server"
echo "  Puerto esperado: 5173"
echo "  start-dev: ./start-dev.sh"

echo "\n## Workflows CI"
if [ -f .github/workflows/ci.yml ]; then
  echo "  .github/workflows/ci.yml presente"
else
  echo "  CI no encontrado"
fi

echo "\n## Reglas UI y traducciones"
echo "  Botones .ts-btn (Segoe UI, borde 3px)"
echo "  XLIFF: generar y sincronizar tras cambios de textos"

echo "\n## Fin"


