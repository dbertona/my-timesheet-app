#!/usr/bin/env bash
set -euo pipefail

HOST=""; USER=""; REMOTE_DIR="/home/dbertona/timesheet"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2;;
    --user) USER="$2"; shift 2;;
    --remote-dir) REMOTE_DIR="$2"; shift 2;;
    *) echo "Parámetro desconocido: $1"; exit 1;;
  esac
done

if [[ -z "$HOST" || -z "$USER" ]]; then
  echo "Uso: $0 --host <IP/DNS> --user <usuario> [--remote-dir /ruta]"; exit 1
fi

echo "→ Construyendo frontend"
npm ci
if [ -f ".env.testing" ]; then
  echo "🧩 Cargando variables desde .env.testing"
  export $(grep -v '^#' .env.testing | xargs)
fi
npm run build

PKG_FILE="timesheet_bundle_$(date +%F_%H%M%S).tar.gz"
echo "→ Empaquetando bundle: $PKG_FILE"
tar -czf "$PKG_FILE" \
  dist/ \
  server.js \
  package.json \
  package-lock.json \
  ops/testing/server/systemd/timesheet-backend.service \
  ops/testing/server/env/timesheet-backend.env.example || {
  echo "Error empaquetando"; exit 1; }

echo "→ Creando directorio en remoto $REMOTE_DIR"
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

echo "→ Subiendo bundle"
scp -o PreferredAuthentications=password -o PubkeyAuthentication=no "$PKG_FILE" "$USER@$HOST:$REMOTE_DIR/"

REMOTE_SCRIPT="set -e; cd '$REMOTE_DIR'; \
  echo '→ Desempaquetando'; tar -xzf '$PKG_FILE'; rm -f '$PKG_FILE'; \
  echo '→ Instalando dependencias (prod)'; npm ci --omit=dev; \
  echo '→ Instalando systemd'; sudo install -m 0644 -o root -g root -D ops/testing/server/systemd/timesheet-backend.service /etc/systemd/system/timesheet-backend.service; \
  sudo systemctl daemon-reload; \
  echo '→ Reiniciando servicio'; sudo systemctl restart timesheet-backend; \
  sleep 1; systemctl status timesheet-backend --no-pager | sed -n '1,12p'"

if [[ -n "${SUDO_PASSWORD:-}" ]]; then
  echo "→ Ejecutando script remoto con sudo no interactivo"
  ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no "$USER@$HOST" "export SUDO_PASSWORD='$SUDO_PASSWORD'; echo \"\$SUDO_PASSWORD\" | sudo -S bash -lc \"$REMOTE_SCRIPT\""
else
  echo "→ Ejecutando script remoto (sudo solicitará contraseña)"
  ssh -tt -o PreferredAuthentications=password -o PubkeyAuthentication=no "$USER@$HOST" "bash -lc '$REMOTE_SCRIPT'"
fi

echo "→ Despliegue completado"

#!/usr/bin/env bash
set -euo pipefail

# Despliegue rápido a testing

if ! command -v ssh >/dev/null; then
  echo "ssh no disponible" >&2; exit 1
fi

SERVER="dbertona@192.168.88.68"
REMOTE_DIR="/home/dbertona/timesheet"

echo "== Build local =="
if [ -f ".env.testing" ]; then
  echo "🧩 Cargando variables desde .env.testing"
  export $(grep -v '^#' .env.testing | xargs)
fi
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


