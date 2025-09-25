#!/bin/bash

# Script para iniciar la app con Supabase local
# Uso: ./start-local.sh

set -e

echo "🚀 Iniciando My Timesheet App con Supabase local..."

# Cargar variables de entorno
if [ -f .env.local ]; then
    echo "📝 Cargando variables de entorno desde .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ Error: No se encontró .env.local"
    echo "   Ejecuta: ./supabase-local/update-app-config.sh"
    exit 1
fi

# Verificar que Supabase local esté funcionando
echo "🔍 Verificando Supabase local..."
if ! curl -s "http://192.168.88.68:8000/rest/v1/" > /dev/null; then
    echo "❌ Error: Supabase local no está funcionando"
    echo "   Ejecuta: ./supabase-local/deploy-to-vm.sh"
    exit 1
fi

echo "✅ Supabase local está funcionando"

# Iniciar la aplicación
echo "🎯 Iniciando aplicación..."
npm run dev:full
