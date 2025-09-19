#!/usr/bin/env bash
set -euo pipefail

HOST=""; USER="dbertona"; REMOTE_DIR="/home/dbertona/timesheet"
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

SUDO="sudo"
if [ "$USER" = "root" ]; then
  SUDO=""
fi

echo "→ Construyendo frontend"
npm ci
if [ -f ".env.testing" ]; then
  echo "🧩 Cargando variables desde .env.testing"
  export $(grep -v '^#' .env.testing | xargs)
fi
export VITE_BASE_PATH=${VITE_BASE_PATH:-/my-timesheet-app/}
npm run build

TS=$(date +%Y%m%d_%H%M%S)
PKG="my-timesheet-app-$TS.tar.gz"
echo "→ Empaquetando: $PKG"
tar -czf "$PKG" -C dist .

echo "→ Creando directorio en remoto $REMOTE_DIR"
ssh "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

echo "→ Subiendo artefactos"
scp "$PKG" server.js package.json package-lock.json "$USER@$HOST:$REMOTE_DIR/"

echo "→ Actualizando estáticos y dependencias del backend"
ssh "$USER@$HOST" "REMOTE_DIR='$REMOTE_DIR' PKG='$PKG' SUDO='$SUDO' bash -s" <<'EOF'
set -e
cd "$REMOTE_DIR"

echo "→ Instalando dependencias del backend"
npm install --omit=dev

echo "→ Desempaquetando frontend"
tar -xzf "$PKG"
# Empaquetar actualización y copiar al contenedor con privilegios
	# Se requiere sudo porque el usuario del servicio es dbertona
	# y docker puede necesitar privilegios
	tar -czf timesheet-update.tar.gz index.html vite.svg assets/
	$SUDO docker cp timesheet-update.tar.gz timesheet-web-1:/tmp/
	$SUDO docker exec -u 0 timesheet-web-1 sh -lc '
	  set -e
	  BASE_PATH="/usr/share/nginx/html/my-timesheet-app"
	  mkdir -p "$BASE_PATH"
	  rm -rf "$BASE_PATH"/* || true
	  tar -xzf /tmp/timesheet-update.tar.gz -C "$BASE_PATH"
	  rm -f /tmp/timesheet-update.tar.gz
	'
	rm -f timesheet-update.tar.gz "$PKG"

	echo "→ Reiniciando servicios"
	$SUDO systemctl restart timesheet-backend || true
	sleep 2
	curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5 || true
EOF

echo "→ Despliegue completado"
