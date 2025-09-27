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
# Evitar que builds de testing arrastren puertos locales de desarrollo
unset VITE_DEV_PORT || true
export VITE_BASE_PATH=${VITE_BASE_PATH:-/my-timesheet-app/}
npm run build

# Crear contenido del fichero .env para el remoto
echo "→ Preparando configuración de entorno para el servidor remoto"
ENV_CONTENT=""
while IFS= read -r line || [[ -n "$line" ]]; do
    # Ignorar comentarios y líneas vacías
    if [[ "$line" =~ ^\s*# ]] || [[ -z "$line" ]]; then
        continue
    fi
    # Añadir cada línea válida al contenido del .env
    ENV_CONTENT="${ENV_CONTENT}${line}"$'\n'
done < .env.testing


TS=$(date +%Y%m%d_%H%M%S)
PKG="my-timesheet-app-$TS.tar.gz"
echo "→ Empaquetando: $PKG"
tar -czf "$PKG" -C dist .

echo "→ Creando directorio en remoto $REMOTE_DIR"
ssh "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

echo "→ Subiendo artefactos y configurando entorno remoto"
# Transferir el contenido de .env al servidor remoto de forma segura
echo "$ENV_CONTENT" | ssh "$USER@$HOST" "cat > '$REMOTE_DIR/.env'"

scp "$PKG" server.js package.json package-lock.json docker-compose.yml "$USER@$HOST:$REMOTE_DIR/"

echo "→ Actualizando estáticos y dependencias del backend"
ssh "$USER@$HOST" "REMOTE_DIR='$REMOTE_DIR' PKG='$PKG' SUDO='$SUDO' bash -s" <<'EOF'
set -e
cd "$REMOTE_DIR"

echo "→ Instalando dependencias del backend"
npm install --omit=dev --ignore-scripts

echo "→ Desempaquetando frontend"
tar -xzf "$PKG"

# Publicar estáticos según entorno disponible (contenedor o nginx nativo)
if $SUDO docker ps --format '{{.Names}}' | grep -q '^timesheet-web-1$'; then
  echo "→ Detectado contenedor timesheet-web-1: publicando estáticos dentro del contenedor"
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
else
  echo "→ Contenedor timesheet-web-1 NO encontrado: publicando en nginx nativo del host"
  BASE_PATH="$REMOTE_DIR/dist/my-timesheet-app"
  mkdir -p "$BASE_PATH"
  rm -rf "$BASE_PATH"/* || true
  cp -r index.html vite.svg assets "$BASE_PATH"/
  rm -f "$PKG"
  # Recargar nginx si existe
  if $SUDO systemctl is-active --quiet nginx; then
    echo "→ Recargando nginx"
    $SUDO systemctl reload nginx || true
  fi
fi

	echo "→ Reiniciando servicios"
	$SUDO systemctl restart timesheet-backend || true
	sleep 2
	curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5 || true
EOF

echo "→ Despliegue completado"
