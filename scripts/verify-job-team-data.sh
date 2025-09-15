#!/bin/bash
# Script para verificar datos de job_team antes de sincronización

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

# Función para verificar datos de job_team
verify_job_team_data() {
    local company="$1"

    log "Verificando datos de job_team para $company..."

    # Obtener datos de ProyectosEquipos desde Business Central
    local company_id=""
    case $company in
        psi)
            company_id="ca9dc1bf-54ee-ed11-884a-000d3a455d5b"
            ;;
        pslab)
            company_id="656f8f0e-2bf4-ed11-8848-000d3a4baf18"
            ;;
        *)
            log_error "Empresa no válida: $company"
            exit 1
            ;;
    esac

    log "Obteniendo datos de ProyectosEquipos desde Business Central..."

    # Hacer request a Business Central para obtener ProyectosEquipos
    local equipos_response
    equipos_response=$(curl -s -X GET "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies($company_id)/ProyectosEquipos" \
        -H "Authorization: Bearer $(cat config/api-keys.md | grep 'N8N_API_KEY' | cut -d'"' -f2)" \
        -H "Content-Type: application/json" 2>/dev/null || echo '{"value":[]}')

    if [ $? -ne 0 ]; then
        log_error "Error al obtener datos de ProyectosEquipos"
        return 1
    fi

    # Extraer job_no de ProyectosEquipos
    local job_nos_equipos
    job_nos_equipos=$(echo "$equipos_response" | jq -r '.value[] | .job_no // empty' | sort -u)

    log "Obteniendo datos de Proyectos desde Business Central..."

    # Hacer request a Business Central para obtener Proyectos
    local proyectos_response
    proyectos_response=$(curl -s -X GET "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies($company_id)/Proyectos" \
        -H "Authorization: Bearer $(cat config/api-keys.md | grep 'N8N_API_KEY' | cut -d'"' -f2)" \
        -H "Content-Type: application/json" 2>/dev/null || echo '{"value":[]}')

    if [ $? -ne 0 ]; then
        log_error "Error al obtener datos de Proyectos"
        return 1
    fi

    # Extraer job_no de Proyectos
    local job_nos_proyectos
    job_nos_proyectos=$(echo "$proyectos_response" | jq -r '.value[] | .no // empty' | sort -u)

    # Verificar job_nos que están en equipos pero no en proyectos
    local job_nos_invalidos
    job_nos_invalidos=$(comm -23 <(echo "$job_nos_equipos") <(echo "$job_nos_proyectos"))

    if [ -n "$job_nos_invalidos" ]; then
        log_warning "Encontrados job_nos en ProyectosEquipos que no existen en Proyectos:"
        echo "$job_nos_invalidos" | while read job_no; do
            if [ -n "$job_no" ]; then
                log_warning "  - $job_no"
            fi
        done

        log "Estos job_nos causarán el error de clave foránea job_team_job_fk"
        return 1
    else
        log_success "Todos los job_nos en ProyectosEquipos existen en Proyectos"
        return 0
    fi
}

# Función principal
main() {
    local company="$1"

    if [ -z "$company" ]; then
        echo "Uso: $0 <psi|pslab>"
        exit 1
    fi

    log "Verificando datos de job_team para $company..."

    if verify_job_team_data "$company"; then
        log_success "Datos de job_team son válidos para $company"
        exit 0
    else
        log_error "Datos de job_team tienen problemas para $company"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"
