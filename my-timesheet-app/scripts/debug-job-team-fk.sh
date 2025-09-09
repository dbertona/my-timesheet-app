#!/bin/bash

# Script para diagnosticar el error de FK en job_team
# Verifica qué proyectos están en BC vs Supabase

COMPANY="psi"
SUPABASE_URL="https://qfpswxjunoepznrpsltt.supabase.co/rest/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"

echo "🔍 Diagnóstico de FK job_team_job_fk para $COMPANY"
echo "=================================================="

# 1. Contar proyectos en Supabase
echo "📊 Proyectos en Supabase:"
job_response=$(curl -s -X GET "$SUPABASE_URL/job?company_name=eq.$COMPANY&select=count" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json")
job_count=$(echo "$job_response" | jq -r '.[0].count // 0')

echo "   Total jobs: $job_count"

# 2. Contar equipos en Supabase
echo "📊 Equipos en Supabase:"
team_response=$(curl -s -X GET "$SUPABASE_URL/job_team?company_name=eq.$COMPANY&select=count" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json")
team_count=$(echo "$team_response" | jq -r '.[0].count // 0')

echo "   Total job_team: $team_count"

# 3. Obtener algunos proyectos de Supabase
echo "📋 Primeros 5 proyectos en Supabase:"
curl -s -X GET "$SUPABASE_URL/job?company_name=eq.$COMPANY&select=no,description&limit=5" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" | jq -r '.[] | "   \(.no): \(.description)"'

# 4. Obtener algunos equipos de Supabase
echo "📋 Primeros 5 equipos en Supabase:"
curl -s -X GET "$SUPABASE_URL/job_team?company_name=eq.$COMPANY&select=job_no,resource_no&limit=5" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" | jq -r '.[] | "   \(.job_no) -> \(.resource_no)"'

# 5. Verificar equipos huérfanos (job_no que no existe en job)
echo "🚨 Verificando equipos huérfanos:"
orphan_teams=$(curl -s -X GET "$SUPABASE_URL/job_team?company_name=eq.$COMPANY&select=job_no" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" | jq -r '.[].job_no' | sort -u)

job_nos=$(curl -s -X GET "$SUPABASE_URL/job?company_name=eq.$COMPANY&select=no" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "Content-Type: application/json" | jq -r '.[].no' | sort -u)

echo "   Equipos con job_no que NO existe en job:"
for team_job in $orphan_teams; do
    if ! echo "$job_nos" | grep -q "^$team_job$"; then
        echo "   ❌ $team_job"
    fi
done

echo "✅ Diagnóstico completado"
