#!/bin/bash

# Script final para probar el webhook 003_notify_approval_request
N8N_URL="http://192.168.88.68:5678"

echo "🧪 Probando webhook 003_notify_approval_request..."

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
echo "🚀 Enviando petición al webhook..."

# Probar webhook con la URL correcta
response=$(curl -s -X POST "$N8N_URL/webhook/notify-approval-request" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nHTTP Status: %{http_code}\n")

echo "📤 Respuesta del servidor:"
echo "$response"

echo ""
echo "✅ Prueba completada!"
echo "📧 Revisa tu email en dbertona@powersolution.es"
echo "📧 El email debe venir de noreply@powersolution.es"
echo "📧 Asunto: 'Solicitud de Aprobación - Timesheet #test-123'"

