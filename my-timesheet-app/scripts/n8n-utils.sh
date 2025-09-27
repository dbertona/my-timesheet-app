#!/bin/bash

# 🔧 N8N Utilities Script
# Script para interactuar fácilmente con n8n

# Configuración
N8N_URL="http://192.168.88.68:5678"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
HEADERS="-H X-N8N-API-KEY:$N8N_API_KEY -H Content-Type:application/json"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🔧 N8N Utilities Script${NC}"
    echo ""
    echo "Uso: $0 [COMANDO] [OPCIONES]"
    echo ""
    echo "Comandos disponibles:"
    echo "  status              - Verificar estado del servidor n8n"
    echo "  list                - Listar todos los workflows"
    echo "  list-active         - Listar solo workflows activos"
    echo "  list-inactive       - Listar solo workflows inactivos"
    echo "  get <id>            - Obtener workflow específico"
    echo "  create <file>       - Crear workflow desde archivo JSON"
    echo "  update <id> <file>  - Actualizar workflow desde archivo JSON"
    echo "  delete <id>         - Eliminar workflow"
    echo "  clean               - Eliminar todos los workflows inactivos"
    echo "  backup <id>         - Hacer backup de un workflow"
    echo "  validate <file>     - Validar archivo JSON"
    echo "  sanitize <file>     - Sanitizar archivo JSON para n8n"
    echo "  monitor             - Monitorear estado de workflows"
    echo "  help                - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 status"
    echo "  $0 list"
    echo "  $0 get XSYOmZ8mRuaXl6sg"
    echo "  $0 create workflow.json"
    echo "  $0 clean"
}

# Función para verificar estado del servidor
check_status() {
    echo -e "${BLUE}🔍 Verificando estado del servidor n8n...${NC}"
    response=$(curl -s -X GET "$N8N_URL/healthz")
    if [[ "$response" == '{"status":"ok"}' ]]; then
        echo -e "${GREEN}✅ Servidor n8n funcionando correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Servidor n8n no responde correctamente${NC}"
        echo "Respuesta: $response"
        return 1
    fi
}

# Función para listar workflows
list_workflows() {
    local filter="$1"
    echo -e "${BLUE}📋 Listando workflows...${NC}"

    if ! check_status; then
        return 1
    fi

    response=$(curl -s -X GET "$N8N_URL/api/v1/workflows" $HEADERS)

    # Verificar si la respuesta es válida
    if ! echo "$response" | jq -e '.data' > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: Respuesta inválida del servidor${NC}"
        echo "Respuesta: $response"
        return 1
    fi

    if [[ "$filter" == "active" ]]; then
        echo "$response" | jq -r '.data[] | select(.active == true) | "\(.name) (\(.id)): ✅ Activo"'
    elif [[ "$filter" == "inactive" ]]; then
        echo "$response" | jq -r '.data[] | select(.active == false) | "\(.name) (\(.id)): ❌ Inactivo"'
    else
        echo "$response" | jq -r '.data[] | "\(.name) (\(.id)): \(if .active then "✅ Activo" else "❌ Inactivo" end)"'
    fi
}

# Función para obtener workflow específico
get_workflow() {
    local workflow_id="$1"

    if [[ -z "$workflow_id" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un ID de workflow${NC}"
        return 1
    fi

    echo -e "${BLUE}🔍 Obteniendo workflow $workflow_id...${NC}"

    if ! check_status; then
        return 1
    fi

    response=$(curl -s -X GET "$N8N_URL/api/v1/workflows/$workflow_id" $HEADERS)

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        echo "$response" | jq '.'
    else
        echo -e "${RED}❌ Error: Workflow no encontrado o error en la respuesta${NC}"
        echo "Respuesta: $response"
        return 1
    fi
}

# Función para crear workflow
create_workflow() {
    local file="$1"

    if [[ -z "$file" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un archivo JSON${NC}"
        return 1
    fi

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Error: Archivo $file no encontrado${NC}"
        return 1
    fi

    echo -e "${BLUE}📝 Creando workflow desde $file...${NC}"

    if ! check_status; then
        return 1
    fi

    # Validar JSON
    if ! jq . "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: Archivo JSON inválido${NC}"
        return 1
    fi

    response=$(curl -s -X POST "$N8N_URL/api/v1/workflows" $HEADERS -d @"$file")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_id=$(echo "$response" | jq -r '.id')
        workflow_name=$(echo "$response" | jq -r '.name')
        echo -e "${GREEN}✅ Workflow '$workflow_name' creado con ID: $workflow_id${NC}"
    else
        echo -e "${RED}❌ Error al crear workflow${NC}"
        echo "Respuesta: $response"
        return 1
    fi
}

# Función para actualizar workflow
update_workflow() {
    local workflow_id="$1"
    local file="$2"

    if [[ -z "$workflow_id" || -z "$file" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar ID de workflow y archivo JSON${NC}"
        return 1
    fi

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Error: Archivo $file no encontrado${NC}"
        return 1
    fi

    echo -e "${BLUE}📝 Actualizando workflow $workflow_id desde $file...${NC}"

    if ! check_status; then
        return 1
    fi

    # Validar JSON
    if ! jq . "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ Error: Archivo JSON inválido${NC}"
        return 1
    fi

    response=$(curl -s -X PUT "$N8N_URL/api/v1/workflows/$workflow_id" $HEADERS -d @"$file")

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_name=$(echo "$response" | jq -r '.name')
        echo -e "${GREEN}✅ Workflow '$workflow_name' actualizado correctamente${NC}"
    else
        echo -e "${RED}❌ Error al actualizar workflow${NC}"
        echo "Respuesta: $response"
        return 1
    fi
}

# Función para eliminar workflow
delete_workflow() {
    local workflow_id="$1"

    if [[ -z "$workflow_id" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un ID de workflow${NC}"
        return 1
    fi

    echo -e "${YELLOW}⚠️  Eliminando workflow $workflow_id...${NC}"

    if ! check_status; then
        return 1
    fi

    response=$(curl -s -X DELETE "$N8N_URL/api/v1/workflows/$workflow_id" $HEADERS)

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_name=$(echo "$response" | jq -r '.name')
        echo -e "${GREEN}✅ Workflow '$workflow_name' eliminado correctamente${NC}"
    else
        echo -e "${RED}❌ Error al eliminar workflow${NC}"
        echo "Respuesta: $response"
        return 1
    fi
}

# Función para limpiar workflows inactivos
clean_inactive() {
    echo -e "${YELLOW}🧹 Limpiando workflows inactivos...${NC}"

    if ! check_status; then
        return 1
    fi

    # Obtener workflows inactivos
    inactive_ids=$(curl -s -X GET "$N8N_URL/api/v1/workflows" $HEADERS | jq -r '.data[] | select(.active == false) | .id')

    if [[ -z "$inactive_ids" ]]; then
        echo -e "${GREEN}✅ No hay workflows inactivos para eliminar${NC}"
        return 0
    fi

    echo "Workflows inactivos encontrados:"
    echo "$inactive_ids"
    echo ""

    read -p "¿Continuar con la eliminación? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${YELLOW}❌ Operación cancelada${NC}"
        return 0
    fi

    # Eliminar cada workflow inactivo
    echo "$inactive_ids" | while read -r id; do
        if [[ -n "$id" ]]; then
            echo "Eliminando workflow $id..."
            delete_workflow "$id"
        fi
    done

    echo -e "${GREEN}✅ Limpieza completada${NC}"
}

# Función para hacer backup
backup_workflow() {
    local workflow_id="$1"
    local backup_dir="./backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    if [[ -z "$workflow_id" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un ID de workflow${NC}"
        return 1
    fi

    echo -e "${BLUE}💾 Haciendo backup del workflow $workflow_id...${NC}"

    if ! check_status; then
        return 1
    fi

    # Crear directorio de backups si no existe
    mkdir -p "$backup_dir"

    # Obtener workflow
    response=$(curl -s -X GET "$N8N_URL/api/v1/workflows/$workflow_id" $HEADERS)

    if echo "$response" | jq -e '.id' > /dev/null 2>&1; then
        workflow_name=$(echo "$response" | jq -r '.name')
        backup_file="$backup_dir/backup_${workflow_name}_${timestamp}.json"
        echo "$response" | jq . > "$backup_file"
        echo -e "${GREEN}✅ Backup guardado en: $backup_file${NC}"
    else
        echo -e "${RED}❌ Error: No se pudo obtener el workflow${NC}"
        return 1
    fi
}

# Función para validar JSON
validate_json() {
    local file="$1"

    if [[ -z "$file" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un archivo JSON${NC}"
        return 1
    fi

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Error: Archivo $file no encontrado${NC}"
        return 1
    fi

    echo -e "${BLUE}🔍 Validando archivo JSON: $file${NC}"

    if jq . "$file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Archivo JSON válido${NC}"
        return 0
    else
        echo -e "${RED}❌ Archivo JSON inválido${NC}"
        jq . "$file" 2>&1 | head -5
        return 1
    fi
}

# Función para sanitizar JSON
sanitize_json() {
    local file="$1"
    local sanitized_file="${file%.json}_sanitized.json"

    if [[ -z "$file" ]]; then
        echo -e "${RED}❌ Error: Debes proporcionar un archivo JSON${NC}"
        return 1
    fi

    if [[ ! -f "$file" ]]; then
        echo -e "${RED}❌ Error: Archivo $file no encontrado${NC}"
        return 1
    fi

    echo -e "${BLUE}🧹 Sanitizando archivo JSON: $file${NC}"

    # Extraer solo campos necesarios para n8n
    jq '{
        name: .name,
        nodes: .nodes,
        connections: .connections,
        settings: .settings
    }' "$file" > "$sanitized_file"

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Archivo sanitizado guardado en: $sanitized_file${NC}"
    else
        echo -e "${RED}❌ Error al sanitizar archivo${NC}"
        return 1
    fi
}

# Función para monitorear workflows
monitor_workflows() {
    echo -e "${BLUE}📊 Monitoreando workflows...${NC}"

    if ! check_status; then
        return 1
    fi

    echo ""
    echo "=== Estado de Workflows N8N ==="
    list_workflows
    echo ""
    echo "=== Detalles de Workflows Activos ==="
    curl -s -X GET "$N8N_URL/api/v1/workflows" $HEADERS | \
    jq -r '.data[] | select(.active == true) | "\(.name): \(.triggerCount) ejecuciones"'
}

# Función principal
main() {
    case "$1" in
        "status")
            check_status
            ;;
        "list")
            list_workflows
            ;;
        "list-active")
            list_workflows "active"
            ;;
        "list-inactive")
            list_workflows "inactive"
            ;;
        "get")
            get_workflow "$2"
            ;;
        "create")
            create_workflow "$2"
            ;;
        "update")
            update_workflow "$2" "$3"
            ;;
        "delete")
            delete_workflow "$2"
            ;;
        "clean")
            clean_inactive
            ;;
        "backup")
            backup_workflow "$2"
            ;;
        "validate")
            validate_json "$2"
            ;;
        "sanitize")
            sanitize_json "$2"
            ;;
        "monitor")
            monitor_workflows
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando no reconocido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"
