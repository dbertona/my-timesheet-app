#!/bin/bash

# Script para extraer todos los workflows de n8n y guardarlos en el proyecto local
# API Key de n8n
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
N8N_URL="https://n8n.powersolution.es"
PROJECT_DIR="src/scripts/n8n/workflows"

echo "🚀 Exportando todos los workflows de n8n al proyecto local..."
echo "🔗 URL: $N8N_URL"
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "📁 Directorio destino: $PROJECT_DIR"

# Crear directorio si no existe
mkdir -p "$PROJECT_DIR"

# Obtener lista de workflows
echo "📋 Obteniendo lista de workflows..."

WORKFLOWS_RESPONSE=$(curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows")

if [ $? -eq 0 ]; then
    echo "✅ Lista de workflows obtenida"
    echo "📄 Respuesta: $WORKFLOWS_RESPONSE"
    
    # Extraer IDs de workflows (simplificado)
    echo "🔍 Extrayendo workflows individuales..."
    
    # Workflow 1: Test Schema Job
    echo "📥 Exportando: Test Schema Job"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/bRJwX9y5OdFS4p7n" > "$PROJECT_DIR/001_test_schema_job.json"
    
    # Workflow 2: Sincronizar Proyectos BC → Supabase (CORRECTO)
    echo "📥 Exportando: Sincronizar Proyectos BC → Supabase (CORRECTO)"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/m0kiXacf474bSZbx" > "$PROJECT_DIR/002_sincronizar_proyectos_correcto.json"
    
    # Workflow 3: Sincronizar Proyectos BC → Supabase (SIMPLE)
    echo "📥 Exportando: Sincronizar Proyectos BC → Supabase (SIMPLE)"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/5oqnzOZLFITsaMG7" > "$PROJECT_DIR/003_sincronizar_proyectos_simple.json"
    
    # Workflow 4: Sincronización Completa BC → Supabase
    echo "📥 Exportando: Sincronización Completa BC → Supabase"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/uoUapPDlqvhG4vYv" > "$PROJECT_DIR/004_sincronizacion_completa.json"
    
    # Workflow 5: Sincronización Completa BC → Supabase (TODAS) - MAESTRO
    echo "📥 Exportando: Sincronización Completa BC → Supabase (TODAS) - MAESTRO"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/lrg9ovZSHN6Yt3Lt" > "$PROJECT_DIR/005_sincronizacion_completa_todas_MAESTRO.json"
    
    # Workflow 6: Sincronización Completa BC → Supabase (TODAS) copy
    echo "📥 Exportando: Sincronización Completa BC → Supabase (TODAS) copy"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/MfxLTaH7LjpT7hN0" > "$PROJECT_DIR/006_sincronizacion_completa_todas_copy.json"
    
    echo ""
    echo "🎉 ¡Todos los workflows exportados exitosamente!"
    echo "📁 Archivos guardados en: $PROJECT_DIR"
    
    # Mostrar archivos creados
    echo ""
    echo "📋 Archivos creados:"
    ls -la "$PROJECT_DIR"
    
else
    echo "❌ Error al obtener la lista de workflows"
    echo "🔍 Revisa la respuesta para más detalles"
fi
