#!/bin/bash

# Script para gestionar el servidor de desarrollo con PM2
# Uso: ./start-dev-server.sh [start|stop|restart|status|logs]

PROJECT_DIR="/Users/marcelodanielbertona/POWER-SOLUTION-PROJECTS/my-timesheet-app"
PM2_CMD="npx pm2"

cd "$PROJECT_DIR"

case "$1" in
    start)
        echo "🚀 Iniciando servidor de desarrollo..."
        $PM2_CMD start ecosystem.config.cjs
        echo "✅ Servidor iniciado. Accede a: http://localhost:5173"
        ;;
    stop)
        echo "🛑 Deteniendo servidor de desarrollo..."
        $PM2_CMD stop my-timesheet-app-dev
        echo "✅ Servidor detenido."
        ;;
    restart)
        echo "🔄 Reiniciando servidor de desarrollo..."
        $PM2_CMD restart my-timesheet-app-dev
        echo "✅ Servidor reiniciado."
        ;;
    status)
        echo "📊 Estado del servidor:"
        $PM2_CMD status
        ;;
    logs)
        echo "📋 Logs del servidor:"
        $PM2_CMD logs my-timesheet-app-dev --lines 50
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Comandos disponibles:"
        echo "  start   - Inicia el servidor de desarrollo"
        echo "  stop    - Detiene el servidor de desarrollo"
        echo "  restart - Reinicia el servidor de desarrollo"
        echo "  status  - Muestra el estado del servidor"
        echo "  logs    - Muestra los logs del servidor"
        exit 1
        ;;
esac
