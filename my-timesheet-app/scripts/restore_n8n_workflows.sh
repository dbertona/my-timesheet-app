#!/bin/bash

# Script para restaurar workflows de n8n desde la base de datos SQLite
# Ejecutar en la máquina Debian

echo "🚀 Restaurando workflows de n8n desde la base de datos..."

cd ~/n8n

# Crear directorio temporal para los workflows
mkdir -p /tmp/n8n_restore

# Extraer workflow maestro
echo "📋 Extrayendo workflow maestro..."
docker run --rm -v $(pwd)/data:/data -w /data alpine:latest sh -c 'apk add --no-cache sqlite && sqlite3 database.sqlite "SELECT id, name, nodes, connections, active FROM workflow_entity WHERE id=\"lrg9ovZSHN6Yt3Lt\";"' > /tmp/n8n_restore/workflow_maestro.txt

# Extraer todos los workflows
echo "📋 Extrayendo todos los workflows..."
docker run --rm -v $(pwd)/data:/data -w /data alpine:latest sh -c 'apk add --no-cache sqlite && sqlite3 database.sqlite "SELECT id, name, nodes, connections, active FROM workflow_entity;"' > /tmp/n8n_restore/all_workflows.txt

# Extraer credenciales
echo "🔑 Extrayendo credenciales..."
docker run --rm -v $(pwd)/data:/data -w /data alpine:latest sh -c 'apk add --no-cache sqlite && sqlite3 database.sqlite "SELECT id, name, type, data FROM credentials_entity;"' > /tmp/n8n_restore/credentials.txt

echo ""
echo "🎉 ¡Workflows extraídos exitosamente!"
echo ""
echo "📁 Archivos generados en /tmp/n8n_restore/:"
echo "   - workflow_maestro.txt (Workflow principal)"
echo "   - all_workflows.txt (Todos los workflows)"
echo "   - credentials.txt (Todas las credenciales)"
echo ""
echo "💡 Ahora puedes:"
echo "   1. Acceder a n8n en https://n8n.powersolution.es"
echo "   2. Crear workflows manualmente usando estos datos"
echo "   3. O usar la API para recrearlos automáticamente"
echo ""
echo "🔧 Para recrear automáticamente, necesito:"
echo "   - API Key válida de n8n"
echo "   - Acceso a la API de n8n"
