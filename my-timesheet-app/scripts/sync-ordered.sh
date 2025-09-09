#!/bin/bash
# Script para ejecutar sincronización en orden correcto

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

# Función para esperar a que termine un proceso
wait_for_completion() {
    local max_wait=300 # 5 minutos
    local wait_time=0

    while [ $wait_time -lt $max_wait ]; do
        if curl -s -X GET "https://n8n.powersolution.es/api/v1/executions" \
            -H "X-N8N-API-KEY: $(cat config/api-keys.md | grep 'N8N_API_KEY' | cut -d'"' -f2)" \
            -H "Content-Type: application/json" | jq -r '.data[0].finished' | grep -q "true"; then
            log_success "Proceso completado"
            return 0
        fi

        sleep 5
        wait_time=$((wait_time + 5))
        log "Esperando... (${wait_time}s/${max_wait}s)"
    done

    log_warning "Timeout esperando completación"
    return 1
}

# Función para ejecutar webhook con retry
execute_webhook_with_retry() {
    local company="$1"
    local step_name="$2"
    local max_retries=3
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        log "🚀 Ejecutando $step_name para $company (intento $((retry_count + 1))/$max_retries)..."

        local response
        response=$(curl -s -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$company" \
            -H "Content-Type: application/json" \
            -d '{}' \
            --max-time 120)

        local exit_code=$?

        if [ $exit_code -eq 0 ]; then
            log_success "$step_name completado exitosamente"
            if [ -n "$response" ]; then
                echo "$response" | jq '.' 2>/dev/null || echo "$response"
            fi
            return 0
        else
            log_warning "Error en $step_name (código: $exit_code), reintentando..."
            retry_count=$((retry_count + 1))
            sleep 10
        fi
    done

    log_error "Falló $step_name después de $max_retries intentos"
    return 1
}

# Función para ejecutar sincronización paso a paso
sync_ordered() {
    local company="$1"

    log "🚀 Iniciando sincronización ordenada para $company..."
    log "⚠️  NOTA: Este script ejecuta el webhook completo en cada paso"
    log "⚠️  El orden correcto se logra con delays entre ejecuciones"

    # Paso 1: Primera ejecución (jobs y resources se procesan primero)
    log "📋 Paso 1: Primera sincronización (jobs + resources)..."
    if ! execute_webhook_with_retry "$company" "Primera sincronización"; then
        return 1
    fi

    # Esperar a que se completen jobs y resources
    log "⏳ Esperando a que se completen jobs y resources..."
    sleep 30

    # Paso 2: Segunda ejecución (job_team se procesa después)
    log "👥 Paso 2: Segunda sincronización (job_team + resto)..."
    if ! execute_webhook_with_retry "$company" "Segunda sincronización"; then
        return 1
    fi

    # Esperar a que se complete job_team
    log "⏳ Esperando a que se complete job_team..."
    sleep 20

    # Paso 3: Tercera ejecución (verificación final)
    log "🔄 Paso 3: Sincronización final (verificación)..."
    if ! execute_webhook_with_retry "$company" "Sincronización final"; then
        log_warning "Sincronización final falló, pero puede estar completa"
    fi

    log_success "Sincronización ordenada completada"
}

# Función principal
main() {
    local company="$1"

    if [ -z "$company" ]; then
        echo "Uso: $0 <psi|pslab>"
        exit 1
    fi

    log "🔧 Sincronización Ordenada para $company"

    # Verificar estado del servidor
    if ! ./scripts/n8n-utils.sh status > /dev/null 2>&1; then
        log_error "Servidor n8n no disponible"
        exit 1
    fi

    # Ejecutar sincronización ordenada
    if sync_ordered "$company"; then
        log_success "Sincronización completada exitosamente"
    else
        log_error "Error en la sincronización"
        exit 1
    fi
}

# Ejecutar función principal
main "$@"
