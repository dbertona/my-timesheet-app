#!/bin/bash

set -euo pipefail

echo "🚀 Actualizando workflow de n8n para incluir company_name (vía API)"

# Configuración
N8N_URL="${N8N_URL:-https://n8n.powersolution.es}"
API_KEY="${N8N_API_KEY:-}"
WORKFLOW_ID="${N8N_WORKFLOW_ID:-rDSrPE4U9zNGRaJi}"
COMPANY_NAME="${COMPANY_NAME:-${1:-Power Solution Iberia SL}}"

if [ -z "$API_KEY" ]; then
  echo "❌ Falta N8N_API_KEY en el entorno"
  exit 1
fi

TMP_DIR="$(mktemp -d)"
LOCAL_DIR="src/scripts/n8n/workflows"
mkdir -p "$LOCAL_DIR"

RAW_JSON="$TMP_DIR/workflow_raw.json"
MOD_JSON="$TMP_DIR/workflow_mod.json"
BACKUP_JSON="$LOCAL_DIR/001_sincronizacion_completa.$(date +%Y%m%d-%H%M%S).backup.json"

echo "🔗 URL: $N8N_URL"
echo "🆔 Workflow ID: $WORKFLOW_ID"
echo "🏷️ COMPANY_NAME: $COMPANY_NAME"

echo "📥 Descargando workflow actual..."
curl -sS -H "X-N8N-API-KEY: $API_KEY" "$N8N_URL/api/v1/workflows/$WORKFLOW_ID" -o "$RAW_JSON"

echo "🔍 Validando JSON..."
jq empty "$RAW_JSON" >/dev/null

cp "$RAW_JSON" "$BACKUP_JSON"
echo "💾 Backup guardado: $BACKUP_JSON"

echo "🔧 Inyectando company_name en nodos de transformación y Supabase (si falta)..."
jq --arg company_name "$COMPANY_NAME" '
  def add_company(nodeId; anchor):
    (.nodes[] | select(.id==nodeId) | .parameters.jsCode) |=
      (if (.|tostring|contains("company_name")) then . else gsub(anchor; anchor + ", \"company_name\": \"" + $company_name + "\"") end);

  def add_company_supabase(nodeId):
    (.nodes[] | select(.id==nodeId) | .parameters.fieldsUi.fieldValues) |=
      (if ((map(select(.fieldId=="company_name")) | length) > 0) then . else . + [{"fieldId":"company_name","fieldValue":"={{ $json.company_name }}"}] end);

  add_company("transform_proyectos"; "\"departamento\": p.departamento || \"\"") |
  add_company("transform_tareas"; "\"description\": (t.description && t.description.trim()) ? t.description : \"Sin descripción\"") |
  add_company("transform_equipos"; "\"resource_no\": e.resourceNo || e.resource_code || \"\"") |
  add_company("transform_recursos"; "\"calendar_type\": r.calendarType || r.calendar_type || \"DEFAULT\"") |
  add_company("transform_costos"; "\"unit_cost\": parseFloat(c.unitCost || c.unit_cost || 0)") |
  add_company("transform_calendario"; "\"hours_working\": parseFloat(cal.hoursWorking || cal.hours_working || 0)") |
  add_company_supabase("supabase_proyectos") |
  add_company_supabase("supabase_tareas") |
  add_company_supabase("supabase_equipos") |
  add_company_supabase("supabase_recursos") |
  add_company_supabase("supabase_costos") |
  add_company_supabase("supabase_calendario")
' "$RAW_JSON" > "$MOD_JSON"

echo "🧪 Verificando que el JSON modificado es válido..."
jq empty "$MOD_JSON" >/dev/null

echo "📤 Subiendo cambios al workflow por API..."
HTTP_CODE=$(curl -sS -o "$TMP_DIR/resp.json" -w "%{http_code}" -X PATCH \
  -H "X-N8N-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary "@$MOD_JSON" \
  "$N8N_URL/api/v1/workflows/$WORKFLOW_ID")

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Error al actualizar el workflow (HTTP $HTTP_CODE)"
  cat "$TMP_DIR/resp.json" || true
  exit 1
fi

echo "✅ Workflow actualizado correctamente (HTTP $HTTP_CODE)"
echo "📎 Resumen de cambios (muestras):"
grep -n "company_name" "$MOD_JSON" | head -10 || true

echo "🧹 Limpiando temporales..."
rm -rf "$TMP_DIR"

echo "🎉 Listo"


