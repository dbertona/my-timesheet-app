#!/usr/bin/env bash
set -euo pipefail

BASE_URL="https://testingapp.powersolution.es/my-timesheet-app/"

echo "== Smoke: GET base =="
curl -sS -I "$BASE_URL" | sed -n '1,20p'

echo "== Smoke: GET asset js =="
ASSET=$(curl -sS "$BASE_URL" | sed -n '1,200p' | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -n1)
if [[ -z "$ASSET" ]]; then echo "No se encontró asset principal"; exit 1; fi
curl -sS -I "${BASE_URL%/}/$ASSET" | sed -n '1,20p'

echo "== Smoke: rutas profundas =="
for p in aprobacion editar-parte lines/rejected; do
  curl -sS -I "${BASE_URL%/}/$p" | sed -n '1,1p'
done

echo "== OK =="

