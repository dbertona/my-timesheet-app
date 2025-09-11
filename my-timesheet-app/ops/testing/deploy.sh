#!/usr/bin/env bash
set -euo pipefail

# Despliegue rápido a testing

if ! command -v ssh >/dev/null; then
  echo "ssh no disponible" >&2; exit 1
fi

SERVER="dbertona@192.168.88.68"
REMOTE_DIR="/home/dbertona/timesheet"

echo "== Build local =="
npm run build
TS=$(date +%Y%m%d_%H%M%S)
PKG="my-timesheet-app-$TS.tar.gz"
tar -czf "$PKG" -C dist .

echo "== Copiar artefacto y server.js =="
scp "$PKG" server.js "$SERVER:$REMOTE_DIR/"

echo "== Actualizar estáticos en contenedor y reiniciar backend =="
ssh "$SERVER" bash -s <<EOF
set -e
cd "$REMOTE_DIR"
tar -xzf $PKG
tar -czf timesheet-update.tar.gz index.html assets/ 404.html vite.svg
docker cp timesheet-update.tar.gz timesheet-web-1:/tmp/
docker exec timesheet-web-1 sh -c 'cd /usr/share/nginx/html && tar -xzf /tmp/timesheet-update.tar.gz && rm /tmp/timesheet-update.tar.gz'
rm -f timesheet-update.tar.gz "$PKG"

sudo systemctl restart timesheet-backend || true
sleep 2
curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5 || true
EOF

echo "== OK =="


