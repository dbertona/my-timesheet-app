#!/bin/bash

# Script para probar el webhook directamente
N8N_URL="http://192.168.88.68:5678"
WEBHOOK_ID="notify-approval-request-webhook"

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
echo "🚀 Probando webhook de producción..."

# Probar webhook de producción
response1=$(curl -s -X POST "$N8N_URL/webhook/$WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📤 Respuesta webhook producción:"
echo "$response1" | jq . 2>/dev/null || echo "$response1"

echo ""
echo "🚀 Probando webhook de test..."

# Probar webhook de test
response2=$(curl -s -X POST "$N8N_URL/webhook-test/$WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "📤 Respuesta webhook test:"
echo "$response2" | jq . 2>/dev/null || echo "$response2"

echo ""
echo "✅ Prueba completada. Revisa tu email en dbertona@powersolution.es"

