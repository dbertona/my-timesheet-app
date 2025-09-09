#!/bin/bash

# Script para modificar la clave primaria de la tabla job en Supabase
# Cambia de solo 'no' a compuesta por 'no' y 'company_name'

SUPABASE_URL="https://qfpswxjunoepznrpsltt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

echo "🔧 Modificando clave primaria de la tabla job..."

# Paso 1: Verificar restricciones existentes
echo "1. Verificando restricciones existentes..."
curl -X GET "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT conname AS constraint_name, contype AS constraint_type FROM pg_constraint WHERE conrelid = '\''public.job'\''::regclass;"}' \
  -s | jq .

# Paso 2: Verificar claves foráneas dependientes
echo "2. Verificando claves foráneas dependientes..."
curl -X GET "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT conname AS constraint_name FROM pg_constraint WHERE confrelid = '\''public.job'\''::regclass;"}' \
  -s | jq .

echo ""
echo "⚠️  IMPORTANTE: Este script solo puede verificar las restricciones."
echo "   Para modificar la clave primaria, debes usar el SQL Editor de Supabase:"
echo "   https://supabase.com/dashboard/project/qfpswxjunoepznrpsltt/sql"
echo ""
echo "📋 Comandos SQL a ejecutar en el SQL Editor:"
echo ""
echo "-- Paso 1: Eliminar la clave foránea que depende de la clave primaria"
echo "ALTER TABLE job_task DROP CONSTRAINT IF EXISTS job_task_job_no_fkey;"
echo ""
echo "-- Paso 2: Eliminar la clave primaria actual"
echo "ALTER TABLE job DROP CONSTRAINT IF EXISTS job_pkey;"
echo ""
echo "-- Paso 3: Añadir la nueva clave primaria compuesta"
echo "ALTER TABLE job ADD CONSTRAINT job_pkey PRIMARY KEY (no, company_name);"
echo ""
echo "-- Paso 4: Recrear la clave foránea con la nueva estructura"
echo "ALTER TABLE job_task ADD CONSTRAINT job_task_job_no_fkey FOREIGN KEY (job_no, company_name) REFERENCES job(no, company_name);"
echo ""
echo "-- Paso 5: Verificar la nueva estructura"
echo "SELECT conname AS constraint_name, contype AS constraint_type FROM pg_constraint WHERE conrelid = 'public.job'::regclass;"
