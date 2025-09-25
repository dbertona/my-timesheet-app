#!/bin/bash

# Script para desplegar Supabase local en la VM
# Uso: ./deploy-to-vm.sh

set -e

VM_HOST="192.168.88.68"
VM_USER="root"
VM_PATH="/opt/timesheet-supabase"

echo "🚀 Desplegando Supabase local en la VM..."

# Crear directorio en la VM
echo "📁 Creando directorio en la VM..."
ssh ${VM_USER}@${VM_HOST} "mkdir -p ${VM_PATH}"

# Copiar archivos a la VM
echo "📤 Copiando archivos a la VM..."
scp docker-compose.yml ${VM_USER}@${VM_HOST}:${VM_PATH}/
scp kong.yml ${VM_USER}@${VM_HOST}:${VM_PATH}/
scp -r init-scripts ${VM_USER}@${VM_HOST}:${VM_PATH}/
scp migrate-data.sh ${VM_USER}@${VM_HOST}:${VM_PATH}/

# Hacer ejecutable el script de migración
ssh ${VM_USER}@${VM_HOST} "chmod +x ${VM_PATH}/migrate-data.sh"

# Parar contenedores existentes si los hay
echo "🛑 Parando contenedores existentes..."
ssh ${VM_USER}@${VM_HOST} "cd ${VM_PATH} && docker compose down || true"

# Iniciar Supabase local
echo "🐳 Iniciando Supabase local..."
ssh ${VM_USER}@${VM_HOST} "cd ${VM_PATH} && docker compose up -d"

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."
ssh ${VM_USER}@${VM_HOST} "cd ${VM_PATH} && docker compose ps"

# Verificar conectividad
echo "🌐 Verificando conectividad..."
if curl -s "http://${VM_HOST}:8000/rest/v1/" > /dev/null; then
    echo "✅ Supabase local está funcionando en http://${VM_HOST}:8000"
else
    echo "❌ Error: No se puede conectar a Supabase local"
    exit 1
fi

echo "🎉 Despliegue completado!"
echo "📊 Servicios disponibles:"
echo "   - API: http://${VM_HOST}:8000"
echo "   - Studio: http://${VM_HOST}:3000"
echo "   - Auth: http://${VM_HOST}:8000/auth/v1"
echo "   - Storage: http://${VM_HOST}:8000/storage/v1"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Ejecutar migración de datos: ssh ${VM_USER}@${VM_HOST} 'cd ${VM_PATH} && ./migrate-data.sh'"
echo "   2. Actualizar variables de entorno en la app"
echo "   3. Probar funcionalidad completa"



