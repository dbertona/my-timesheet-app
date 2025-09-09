#!/bin/bash
# Script para ejecutar sincronización automática de empresas

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo "🔧 Script de Sincronización de Empresas"
    echo ""
    echo "Uso: $0 <empresa> [opciones]"
    echo ""
    echo "Empresas disponibles:"
    echo "  psi     - Power Solution Iberia SL"
    echo "  pslab   - PS LAB CONSULTING SL"
    echo ""
    echo "Opciones:"
    echo "  -h, --help     Mostrar esta ayuda"
    echo "  -v, --verbose  Mostrar output detallado"
    echo "  -d, --dry-run  Simular ejecución sin ejecutar realmente"
    echo ""
    echo "Ejemplos:"
    echo "  $0 psi                    # Sincronizar PSI"
    echo "  $0 pslab --verbose        # Sincronizar PSLAB con output detallado"
    echo "  $0 psi --dry-run          # Simular sincronización de PSI"
}

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

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl no está instalado"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq no está instalado"
        exit 1
    fi
    
    if [ ! -f "./scripts/n8n-utils.sh" ]; then
        log_error "Script n8n-utils.sh no encontrado"
        exit 1
    fi
    
    log_success "Dependencias verificadas"
}

# Función para verificar estado del servidor n8n
check_n8n_status() {
    log "Verificando estado del servidor n8n..."
    
    if ! ./scripts/n8n-utils.sh status > /dev/null 2>&1; then
        log_error "Servidor n8n no está disponible"
        exit 1
    fi
    
    log_success "Servidor n8n funcionando correctamente"
}

# Función para verificar que el workflow esté activo
check_workflow_status() {
    log "Verificando estado del workflow de sincronización..."
    
    if ! ./scripts/n8n-utils.sh list | grep -q "001_sincronizacion_completa_smart.*✅ Activo"; then
        log_error "Workflow de sincronización no está activo"
        log "Workflows disponibles:"
        ./scripts/n8n-utils.sh list
        exit 1
    fi
    
    log_success "Workflow de sincronización está activo"
}

# Función para ejecutar sincronización
execute_sync() {
    local company="$1"
    local verbose="$2"
    local dry_run="$3"
    
    local webhook_url="https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$company"
    
    if [ "$dry_run" = "true" ]; then
        log_warning "Modo dry-run: Simulando ejecución"
        log "URL del webhook: $webhook_url"
        log "Comando que se ejecutaría:"
        echo "curl -X POST \"$webhook_url\" -H \"Content-Type: application/json\" -d '{}'"
        return 0
    fi
    
    log "Ejecutando sincronización para $company..."
    
    if [ "$verbose" = "true" ]; then
        log "URL del webhook: $webhook_url"
        log "Enviando request..."
    fi
    
    local response
    response=$(curl -s -X POST "$webhook_url" \
        -H "Content-Type: application/json" \
        -d '{}' 2>&1)
    
    local curl_exit_code=$?
    
    if [ $curl_exit_code -ne 0 ]; then
        log_error "Error en la conexión con el webhook"
        log_error "Código de salida de curl: $curl_exit_code"
        log_error "Respuesta: $response"
        exit 1
    fi
    
    if [ "$verbose" = "true" ]; then
        log "Respuesta recibida:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    fi
    
    # Verificar si la respuesta indica éxito
    if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
        log_success "Sincronización completada exitosamente"
        if [ "$verbose" = "true" ]; then
            echo "$response" | jq '.'
        else
            echo "$response" | jq -r '.message // "Sincronización completada"'
        fi
    else
        log_error "Error en la sincronización"
        log_error "Respuesta: $response"
        exit 1
    fi
}

# Función principal
main() {
    local company=""
    local verbose="false"
    local dry_run="false"
    
    # Parsear argumentos
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose="true"
                shift
                ;;
            -d|--dry-run)
                dry_run="true"
                shift
                ;;
            psi|pslab)
                company="$1"
                shift
                ;;
            *)
                log_error "Argumento desconocido: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Verificar que se haya especificado una empresa
    if [ -z "$company" ]; then
        log_error "Debe especificar una empresa"
        show_help
        exit 1
    fi
    
    # Mostrar información de la empresa
    case $company in
        psi)
            log "Empresa: Power Solution Iberia SL (PSI)"
            ;;
        pslab)
            log "Empresa: PS LAB CONSULTING SL (PSLAB)"
            ;;
    esac
    
    # Ejecutar verificaciones y sincronización
    check_dependencies
    check_n8n_status
    check_workflow_status
    execute_sync "$company" "$verbose" "$dry_run"
    
    log_success "Proceso completado"
}

# Ejecutar función principal
main "$@"
