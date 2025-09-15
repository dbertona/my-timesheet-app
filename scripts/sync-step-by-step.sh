#!/bin/bash
# Script para sincronización paso a paso con el webhook existente

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

# Función para ejecutar webhook y esperar
execute_webhook() {
    local company="$1"
    local step="$2"

    log "🚀 Ejecutando webhook para $company (paso: $step)..."

    local response
    response=$(curl -s -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$company" \
        -H "Content-Type: application/json" \
        -d "{\"step\": \"$step\"}")

    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_success "Webhook ejecutado correctamente"
        if [ -n "$response" ]; then
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
        fi
    else
        log_error "Error ejecutando webhook (código: $exit_code)"
        return 1
    fi

    # Esperar un momento para que se complete
    sleep 10
}

# Función para sincronización ordenada
sync_ordered() {
    local company="$1"

    log "🔧 Iniciando sincronización ordenada para $company..."

    # Paso 1: Jobs y Resources (en paralelo)
    log "📋 Paso 1: Sincronizando jobs y resources..."
    execute_webhook "$company" "jobs_resources"

    # Esperar a que se completen
    log "⏳ Esperando a que se completen jobs y resources..."
    sleep 20

    # Paso 2: Job_team (después de jobs y resources)
    log "👥 Paso 2: Sincronizando job_team..."
    execute_webhook "$company" "job_team"

    # Esperar a que se complete
    log "⏳ Esperando a que se complete job_team..."
    sleep 15

    # Paso 3: Resto de entidades
    log "🔄 Paso 3: Sincronizando resto de entidades..."
    execute_webhook "$company" "rest"

    log_success "Sincronización ordenada completada"
}

# Función para sincronización completa (como antes)
sync_complete() {
    local company="$1"

    log "🚀 Ejecutando sincronización completa para $company..."

    local response
    response=$(curl -s -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$company" \
        -H "Content-Type: application/json" \
        -d '{}')

    if [ $? -eq 0 ]; then
        log_success "Sincronización completa ejecutada"
        if [ -n "$response" ]; then
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
        fi
    else
        log_error "Error en sincronización completa"
        return 1
    fi
}

# Función principal
main() {
    local company="$1"
    local mode="$2"

    if [ -z "$company" ]; then
        echo "Uso: $0 <psi|pslab> [ordered|complete]"
        echo "  ordered  - Sincronización paso a paso (recomendado)"
        echo "  complete - Sincronización completa (puede fallar)"
        exit 1
    fi

    # Verificar estado del servidor
    if ! ./scripts/n8n-utils.sh status > /dev/null 2>&1; then
        log_error "Servidor n8n no disponible"
        exit 1
    fi

    case "${mode:-ordered}" in
        "ordered")
            sync_ordered "$company"
            ;;
        "complete")
            sync_complete "$company"
            ;;
        *)
            log_error "Modo no válido: $mode"
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"
