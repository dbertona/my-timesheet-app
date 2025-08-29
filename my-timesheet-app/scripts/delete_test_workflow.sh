#!/bin/bash

# Script para eliminar el workflow de prueba de n8n
# API Key de n8n
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
N8N_URL="https://n8n.powersolution.es"
TEST_WORKFLOW_ID="x1PZZchobxVIpg6t"

echo "🗑️ Eliminando workflow de prueba de n8n..."
echo "🔗 URL: $N8N_URL"
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "🆔 ID del workflow: $TEST_WORKFLOW_ID"

# Confirmar eliminación
echo "⚠️ ¿Estás seguro de que quieres eliminar el workflow de prueba?"
echo "📋 Nombre: Test Workflow"
echo "🆔 ID: $TEST_WORKFLOW_ID"
echo ""
read -p "Escribe 'SI' para confirmar: " CONFIRM

if [ "$CONFIRM" = "SI" ]; then
    echo "🗑️ Eliminando workflow..."
    
    # Eliminar el workflow
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X DELETE \
        -H "X-N8N-API-KEY: $API_KEY" \
        "$N8N_URL/api/v1/workflows/$TEST_WORKFLOW_ID")
    
    # Separar respuesta y código HTTP
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo "📊 Código de respuesta: $HTTP_CODE"
    echo "📄 Respuesta: $RESPONSE_BODY"
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
        echo "✅ ¡Workflow de prueba eliminado exitosamente!"
        echo "🗑️ Workflow ID: $TEST_WORKFLOW_ID eliminado"
    else
        echo "❌ Error al eliminar workflow"
        echo "🔍 Revisa la respuesta para más detalles"
    fi
    
else
    echo "❌ Eliminación cancelada"
fi
