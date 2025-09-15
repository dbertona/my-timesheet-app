#!/bin/bash

# Script para probar el workflow 002_sync_supabase_to_bc_multi
# Soporte multi-empresa con parámetro ?company=

# Configuración
N8N_BASE_URL="https://n8n.powersolution.es"
N8N_API_KEY="n8n_api_5f4a76193498dfc211473f5de0a4e75faf68e0d1feb31e98054dc9c9b3f6aa8c"

# Función para ejecutar webhook con retry
execute_webhook_with_retry() {
    local company="$1"
    local max_attempts=3
    local attempt=1

    echo "🔄 Ejecutando sincronización para compañía: $company (intento $attempt/$max_attempts)"

    while [ $attempt -le $max_attempts ]; do
        echo "   📡 Enviando request a webhook..."

        response=$(curl -s -w "\n%{http_code}" -X POST \
            "$N8N_BASE_URL/webhook/sync-supabase-to-bc?company=$company" \
            -H "Content-Type: application/json" \
            -d '{}' 2>/dev/null)

        http_code=$(echo "$response" | tail -n1)
        response_body=$(echo "$response" | head -n -1)

        echo "   📊 HTTP Status: $http_code"

        if [ "$http_code" = "200" ]; then
            echo "   ✅ Sincronización exitosa para $company"
            echo "   📄 Respuesta: $response_body"
            return 0
        else
            echo "   ❌ Error en intento $attempt: HTTP $http_code"
            echo "   📄 Respuesta: $response_body"

            if [ $attempt -lt $max_attempts ]; then
                echo "   ⏳ Esperando 5 segundos antes del siguiente intento..."
                sleep 5
            fi
        fi

        attempt=$((attempt + 1))
    done

    echo "   💥 Falló después de $max_attempts intentos para $company"
    return 1
}

# Función para verificar estado del workflow
check_workflow_status() {
    echo "🔍 Verificando estado del workflow 002..."

    response=$(curl -s -X GET \
        "$N8N_BASE_URL/api/v1/workflows" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" 2>/dev/null)

    if [ $? -eq 0 ]; then
        echo "   ✅ Conexión a n8n exitosa"

        # Buscar workflow 002
        workflow_002=$(echo "$response" | jq -r '.data[] | select(.name | contains("002")) | {id, name, active}' 2>/dev/null)

        if [ -n "$workflow_002" ]; then
            echo "   📋 Workflow 002 encontrado:"
            echo "$workflow_002" | jq '.'
        else
            echo "   ⚠️  Workflow 002 no encontrado"
        fi
    else
        echo "   ❌ Error conectando a n8n"
        return 1
    fi
}

# Función principal
main() {
    echo "🚀 Iniciando pruebas del workflow 002 multi-empresa"
    echo "=================================================="

    # Verificar estado del workflow
    check_workflow_status
    echo ""

    # Probar con diferentes compañías
    companies=("psi" "pslab")

    for company in "${companies[@]}"; do
        echo "🏢 Probando con compañía: $company"
        echo "----------------------------------------"

        execute_webhook_with_retry "$company"

        if [ $? -eq 0 ]; then
            echo "   ✅ $company: Sincronización completada"
        else
            echo "   ❌ $company: Sincronización falló"
        fi

        echo ""
        sleep 2
    done

    echo "🏁 Pruebas completadas"
    echo "====================="
}

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    echo "❌ Error: curl no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq no está instalado"
    exit 1
fi

# Ejecutar función principal
main "$@"
