#!/bin/bash

# Script para renombrar el workflow en n8n
# API Key de n8n
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
N8N_URL="https://n8n.powersolution.es"
WORKFLOW_ID="rDSrPE4U9zNGRaJi"

echo "🔄 Renombrando workflow en n8n..."
echo "🔗 URL: $N8N_URL"
echo "🔑 API Key: ${API_KEY:0:20}..."
echo "🆔 ID del workflow: $WORKFLOW_ID"

# Obtener el workflow actual
echo "📥 Obteniendo workflow actual..."

CURRENT_WORKFLOW=$(curl -s -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ $? -eq 0 ]; then
    echo "✅ Workflow obtenido correctamente"
    
    # Crear nuevo nombre
    NEW_NAME="Sincronización Completa BC → Supabase"
    
    # Actualizar el nombre del workflow
    echo "✏️ Actualizando nombre a: $NEW_NAME"
    
    # Crear JSON para la actualización
    UPDATE_JSON="{\"name\":\"$NEW_NAME\"}"
    
    # Actualizar el workflow
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "X-N8N-API-KEY: $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$UPDATE_JSON" \
        "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")
    
    # Separar respuesta y código HTTP
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo "📊 Código de respuesta: $HTTP_CODE"
    echo "📄 Respuesta: $RESPONSE_BODY"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ ¡Workflow renombrado exitosamente!"
        echo "🆕 Nuevo nombre: $NEW_NAME"
    else
        echo "❌ Error al renombrar workflow"
        echo "🔍 Revisa la respuesta para más detalles"
    fi
    
else
    echo "❌ Error al obtener el workflow"
fi
