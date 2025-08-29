#!/bin/bash

# Script para exportar los workflows que existen actualmente en n8n
# API Key de n8n
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
N8N_URL="https://n8n.powersolution.es"
PROJECT_DIR="src/scripts/n8n/workflows"

echo "🚀 Exportando workflows actuales de n8n al proyecto local..."
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
    
    # Extraer IDs de workflows de la respuesta
    echo "🔍 Extrayendo workflows individuales..."
    
    # Obtener el primer workflow (el maestro que creamos)
    echo "📥 Exportando: Sincronización Completa BC → Supabase (TODAS) - RESTAURADO"
    FIRST_WORKFLOW=$(curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$FIRST_WORKFLOW" ]; then
        echo "🆔 ID del workflow: $FIRST_WORKFLOW"
        curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/$FIRST_WORKFLOW" > "$PROJECT_DIR/001_sincronizacion_completa_todas_RESTAURADO.json"
        
        # Verificar que se exportó correctamente
        if [ -s "$PROJECT_DIR/001_sincronizacion_completa_todas_RESTAURADO.json" ]; then
            echo "✅ Workflow exportado correctamente"
        else
            echo "❌ Error al exportar el workflow"
        fi
    else
        echo "❌ No se pudo obtener el ID del workflow"
    fi
    
    # También exportar el workflow de prueba
    echo "📥 Exportando: Test Workflow"
    TEST_WORKFLOW_ID="x1PZZchobxVIpg6t"
    curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/$TEST_WORKFLOW_ID" > "$PROJECT_DIR/002_test_workflow.json"
    
    echo ""
    echo "🎉 ¡Workflows exportados exitosamente!"
    echo "📁 Archivos guardados en: $PROJECT_DIR"
    
    # Mostrar archivos creados
    echo ""
    echo "📋 Archivos creados:"
    ls -la "$PROJECT_DIR"
    
    # Mostrar tamaño de archivos
    echo ""
    echo "📊 Tamaño de archivos:"
    du -h "$PROJECT_DIR"/*
    
else
    echo "❌ Error al obtener la lista de workflows"
    echo "🔍 Revisa la respuesta para más detalles"
fi
