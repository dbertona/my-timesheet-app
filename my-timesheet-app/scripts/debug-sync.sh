#!/bin/bash
# Script para debuggear la sincronización paso a paso

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

# Función para verificar estado de Supabase
check_supabase_state() {
    local company="$1"

    log "Verificando estado actual de Supabase para $company..."

    # Verificar si hay datos en job
    local job_count
    job_count=$(curl -s -X GET "https://qfpswxjunoepznrpsltt.supabase.co/rest/v1/job?company_name=eq.$company&select=count" \
        -H "apikey: $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Authorization: Bearer $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Content-Type: application/json" | jq -r '.count // 0')

    log "Registros en tabla 'job' para $company: $job_count"

    # Verificar si hay datos en job_team
    local job_team_count
    job_team_count=$(curl -s -X GET "https://qfpswxjunoepznrpsltt.supabase.co/rest/v1/job_team?company_name=eq.$company&select=count" \
        -H "apikey: $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Authorization: Bearer $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Content-Type: application/json" | jq -r '.count // 0')

    log "Registros en tabla 'job_team' para $company: $job_team_count"

    if [ "${job_count:-0}" -eq 0 ] && [ "${job_team_count:-0}" -gt 0 ]; then
        log_warning "Hay registros en job_team pero no en job - esto causará el error de clave foránea"
        return 1
    fi

    return 0
}

# Función para limpiar datos problemáticos
clean_problematic_data() {
    local company="$1"

    log "Limpiando datos problemáticos en Supabase para $company..."

    # Eliminar registros de job_team que no tienen job correspondiente
    local delete_response
    delete_response=$(curl -s -X DELETE "https://qfpswxjunoepznrpsltt.supabase.co/rest/v1/job_team?company_name=eq.$company&job_no=not.in.(select no from job where company_name=eq.$company)" \
        -H "apikey: $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Authorization: Bearer $(cat config/api-keys.md | grep 'SUPABASE_ANON_KEY' | cut -d'"' -f2)" \
        -H "Content-Type: application/json")

    log "Respuesta de limpieza: $delete_response"
    log_success "Datos problemáticos eliminados"
}

# Función principal
main() {
    local company="$1"
    local clean="$2"

    if [ -z "$company" ]; then
        echo "Uso: $0 <psi|pslab> [--clean]"
        echo "  --clean: Limpiar datos problemáticos antes de sincronizar"
        exit 1
    fi

    log "🔍 Debuggeando sincronización para $company..."

    # Verificar estado actual
    if ! check_supabase_state "$company"; then
        if [ "$clean" = "--clean" ]; then
            log "Limpiando datos problemáticos..."
            clean_problematic_data "$company"
        else
            log_error "Hay datos problemáticos. Usa --clean para limpiarlos"
            exit 1
        fi
    fi

    log "🚀 Ejecutando sincronización..."

    # Ejecutar sincronización
    local response
    response=$(curl -s -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$company" \
        -H "Content-Type: application/json" \
        -d '{}')

    if [ $? -eq 0 ]; then
        log_success "Sincronización completada"
        if [ -n "$response" ]; then
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
        fi
    else
        log_error "Error en la sincronización"
        exit 1
    fi

    # Verificar estado final
    log "Verificando estado final..."
    check_supabase_state "$company"
}

# Ejecutar función principal
main "$@"
