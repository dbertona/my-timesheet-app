#!/bin/bash

set -euo pipefail

echo "🚀 Iniciando servidor de desarrollo React..."

PORT=5173
PID_FILE="/tmp/vite-dev.pid"
LOG_FILE="/tmp/vite-dev.log"

# ¿Ya está escuchando el puerto?
if lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t >/dev/null ; then
  echo "✅ Servidor ya está ejecutándose en puerto ${PORT}"
  echo "🌐 Abre http://localhost:${PORT} en tu navegador"
  exit 0
fi

echo "📦 Instalando dependencias si es necesario..."
npm install

echo "🔥 Iniciando servidor Vite en segundo plano..."
nohup npm run dev -- --port ${PORT} --strictPort > "${LOG_FILE}" 2>&1 &
VITE_PID=$!
echo ${VITE_PID} > "${PID_FILE}"
disown ${VITE_PID} || true

sleep 2

if lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t >/dev/null ; then
  echo "✅ Servidor iniciado exitosamente! PID: ${VITE_PID}"
  echo "🌐 Abre http://localhost:${PORT} en tu navegador"
  echo "📝 Log: ${LOG_FILE}"
  echo "🛑 Para detener: pkill -f 'vite' (o kill $(cat ${PID_FILE}))"
else
  echo "❌ Error al iniciar el servidor. Revisa el log: ${LOG_FILE}"
  exit 1
fi

