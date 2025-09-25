#!/bin/bash

# Script de migración de datos de Supabase Cloud a Supabase Local
# Uso: ./migrate-data.sh

set -e

# Configuración
CLOUD_URL="https://qfpswxjunoepznrpsltt.supabase.co"
CLOUD_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4"
CLOUD_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

LOCAL_URL="http://192.168.88.68:3002"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4"
LOCAL_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

# Función para hacer backup de datos
backup_data() {
    local table=$1
    local filename="backup_${table}_$(date +%Y%m%d_%H%M%S).json"

    echo "📦 Haciendo backup de $table..."
    curl -s -X GET "${CLOUD_URL}/rest/v1/${table}?select=*" \
        -H "apikey: ${CLOUD_SERVICE_KEY}" \
        -H "Authorization: Bearer ${CLOUD_SERVICE_KEY}" \
        -o "backups/${filename}"

    echo "✅ Backup guardado en backups/${filename}"
}

# Función para migrar datos
migrate_table() {
    local table=$1
    local backup_file=$2

    echo "🔄 Migrando $table..."

    # Insertar datos en Supabase local usando el archivo directamente
    curl -s -X POST "${LOCAL_URL}/rest/v1/${table}" \
        -H "apikey: ${LOCAL_SERVICE_KEY}" \
        -H "Authorization: Bearer ${LOCAL_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: resolution=merge-duplicates" \
        -d @"backups/${backup_file}" > /dev/null

    echo "✅ $table migrada correctamente"
}

# Crear directorio de backups
mkdir -p backups

echo "🚀 Iniciando migración de datos..."

# Lista de tablas a migrar (en orden de dependencias)
TABLES=(
    "resource"
    "job"
    "job_task"
    "job_team"
    "resource_cost"
    "calendar_period_days"
    "resource_timesheet_header"
    "timesheet"
    "sync_state"
)

# Paso 1: Hacer backup de todas las tablas
echo "📦 Paso 1: Creando backups..."
for table in "${TABLES[@]}"; do
    backup_data "$table"
done

# Paso 2: Verificar que Supabase local esté funcionando
echo "🔍 Paso 2: Verificando Supabase local..."
if ! curl -s "${LOCAL_URL}/rest/v1/" > /dev/null; then
    echo "❌ Error: Supabase local no está funcionando en ${LOCAL_URL}"
    echo "   Asegúrate de ejecutar: docker compose up -d"
    exit 1
fi
echo "✅ Supabase local está funcionando"

# Paso 3: Limpiar datos existentes en local (opcional)
echo "🧹 Paso 3: Limpiando datos existentes en local..."
for table in "${TABLES[@]}"; do
    echo "   Limpiando $table..."
    curl -s -X DELETE "${LOCAL_URL}/rest/v1/${table}" \
        -H "apikey: ${LOCAL_SERVICE_KEY}" \
        -H "Authorization: Bearer ${LOCAL_SERVICE_KEY}" > /dev/null
done

# Paso 4: Migrar datos
echo "🔄 Paso 4: Migrando datos..."
for table in "${TABLES[@]}"; do
    # Encontrar el archivo de backup más reciente para esta tabla
    backup_file=$(ls -t backups/backup_${table}_*.json 2>/dev/null | head -1)
    if [ -n "$backup_file" ]; then
        migrate_table "$table" "$(basename "$backup_file")"
    else
        echo "⚠️  No se encontró backup para $table"
    fi
done

echo "🎉 Migración completada!"
echo "📊 Resumen:"
echo "   - Backups guardados en: ./backups/"
echo "   - Supabase local: ${LOCAL_URL}"
echo "   - Studio: http://localhost:3000"
echo ""
echo "🔧 Próximos pasos:"
echo "   1. Verificar datos en Studio: http://localhost:3000"
echo "   2. Actualizar variables de entorno en la app"
echo "   3. Probar funcionalidad completa"
