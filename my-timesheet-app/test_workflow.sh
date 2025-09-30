#!/bin/bash

# Script para probar el workflow 003_notify_approval_request
N8N_URL="http://192.168.88.68:5678"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
WORKFLOW_ID="PDULMvttkJXEIhOY"

echo "🧪 Probando workflow 003_notify_approval_request..."

# Datos de prueba
TEST_DATA='{
  "header_id": "test-12345-67890",
  "requester_email": "dbertona@powersolution.es",
  "approver_codes": ["APPROVER1", "APPROVER2"],
  "recipients": ["dbertona@powersolution.es"],
  "env": "testing"
}'

echo "📧 Datos de prueba:"
echo "$TEST_DATA" | jq .

echo ""
echo "🚀 Ejecutando workflow..."

# Ejecutar workflow usando la API de n8n
response=$(curl -s -X POST "$N8N_URL/api/v1/workflows/$WORKFLOW_ID/execute" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📤 Respuesta del servidor:"
echo "$response" | jq . 2>/dev/null || echo "$response"

echo ""
echo "✅ Prueba completada. Revisa tu email en dbertona@powersolution.es"

