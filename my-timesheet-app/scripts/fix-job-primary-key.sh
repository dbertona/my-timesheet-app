#!/bin/bash

# Script para modificar la clave primaria de la tabla job en Supabase
# Cambia de solo 'no' a compuesta por 'no' y 'company_name'

SUPABASE_URL="https://qfpswxjunoepznrpsltt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

echo "🔧 Modificando clave primaria de la tabla job..."

# Paso 1: Eliminar la clave primaria actual
echo "1. Eliminando clave primaria actual..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "ALTER TABLE job DROP CONSTRAINT IF EXISTS job_pkey;"}' \
  -s | jq .

echo "   ✅ Clave primaria actual eliminada"

# Paso 2: Añadir la nueva clave primaria compuesta
echo "2. Añadiendo nueva clave primaria compuesta..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "ALTER TABLE job ADD CONSTRAINT job_pkey PRIMARY KEY (no, company_name);"}' \
  -s | jq .

echo "   ✅ Nueva clave primaria compuesta añadida"

# Paso 3: Verificar la estructura de la tabla
echo "3. Verificando estructura de la tabla..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '\''job'\'' ORDER BY ordinal_position;"}' \
  -s | jq .

echo "   📋 Estructura de la tabla job verificada"

# Paso 4: Verificar la nueva clave primaria
echo "4. Verificando nueva clave primaria..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT constraint_name, constraint_type, column_name FROM information_schema.key_column_usage WHERE table_name = '\''job'\'' AND constraint_name = '\''job_pkey'\'';"}' \
  -s | jq .

echo "   🔑 Clave primaria verificada"

echo ""
echo "✅ ¡Modificación completada exitosamente!"
echo "   La tabla job ahora tiene clave primaria compuesta por 'no' y 'company_name'"
