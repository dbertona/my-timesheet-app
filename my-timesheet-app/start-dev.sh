#!/bin/bash

# Script para iniciar automáticamente el servidor de desarrollo
echo "🚀 Iniciando servidor de desarrollo React..."

# Verificar si ya hay un proceso ejecutándose en el puerto 5173
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Servidor ya está ejecutándose en puerto 5173"
    echo "🌐 Abre http://localhost:5173 en tu navegador"
else
    echo "📦 Instalando dependencias si es necesario..."
    npm install
    
    echo "🔥 Iniciando servidor Vite..."
    npm run dev &
    
    # Esperar un momento para que el servidor se inicie
    sleep 3
    
    # Verificar si el servidor está funcionando
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ Servidor iniciado exitosamente!"
        echo "🌐 Abre http://localhost:5173 en tu navegador"
        echo "📱 El servidor se ejecuta en segundo plano"
        echo "🛑 Para detener: pkill -f 'vite'"
    else
        echo "❌ Error al iniciar el servidor"
        exit 1
    fi
fi



