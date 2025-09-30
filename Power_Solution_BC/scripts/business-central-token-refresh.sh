#!/bin/bash
# Script para renovación automática del token de Business Central en n8n

API_URL="http://192.168.88.68:5678/api/v1"
API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Verificar si n8n está disponible
check_n8n_availability() {
    log "Verificando disponibilidad de n8n..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

    if [ "$response" -eq 200 ]; then
        log "n8n está disponible"
        return 0
    else
        error "n8n no está disponible (HTTP $response)"
        return 1
    fi
}

# Ejecutar workflow de renovación
execute_refresh_workflow() {
    log "Ejecutando workflow de renovación de token..."

    response=$(curl -s -X POST "$API_URL/workflows/business-central-token-refresh/run" \
        -H "X-N8N-API-KEY: $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{}')

    if echo "$response" | grep -q '"success":true'; then
        log "✅ Token renovado exitosamente"
        return 0
    else
        error "❌ Error renovando token: $response"
        return 1
    fi
}

# Verificar estado de la credencial
check_credential_status() {
    log "Verificando estado de la credencial de Business Central..."

    # Esta función requeriría acceso a la API de credenciales de n8n
    # que actualmente no está disponible públicamente
    warn "La verificación de estado de credenciales no está implementada"
    return 0
}

# Función principal
main() {
    log "Iniciando proceso de renovación de token de Business Central"

    # Verificar disponibilidad
    if ! check_n8n_availability; then
        error "No se puede continuar, n8n no está disponible"
        exit 1
    fi

    # Verificar estado (si está disponible)
    check_credential_status

    # Ejecutar renovación
    if execute_refresh_workflow; then
        log "Proceso completado exitosamente"
        exit 0
    else
        error "Proceso falló"
        exit 1
    fi
}

# Manejar señales
trap 'error "Script interrumpido por el usuario"; exit 1' INT TERM

# Ejecutar función principal
main "$@"
