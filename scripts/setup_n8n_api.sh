#!/bin/bash

# Script para configurar n8n usando la API real
# Ejecutar en la máquina Debian

echo "🚀 Configurando n8n usando la API..."

# Variables de configuración
N8N_URL="http://localhost:5678"
SUPABASE_URL="https://qfpswxjunoepznrpsltt.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0IiwicjZSI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ"
BC_TENANT_ID="a18dc497-a8b8-4740-b723-65362ab7a3fb"
BC_CLIENT_ID="64898aa0-1f14-46ab-8283-74161f5e3cb2"

# Función para esperar a que n8n esté listo
wait_for_n8n() {
    echo "⏳ Esperando a que n8n esté listo..."
    until curl -s "$N8N_URL" > /dev/null; do
        echo "   Esperando..."
        sleep 5
    done
    echo "✅ n8n está listo!"
}

# Función para crear credencial de Supabase
create_supabase_credential() {
    echo "🔗 Creando credencial de Supabase..."

    # Crear archivo temporal con la credencial
    cat > /tmp/supabase_cred.json << EOF
{
  "name": "Supabase Timesheet",
  "type": "supabaseApi",
  "data": {
    "url": "$SUPABASE_URL",
    "serviceRoleKey": "$SUPABASE_KEY"
  }
}
EOF

    echo "   Credencial Supabase creada en /tmp/supabase_cred.json"
}

# Función para crear credencial de Business Central
create_bc_credential() {
    echo "🔗 Creando credencial de Business Central..."

    # Crear archivo temporal con la credencial
    cat > /tmp/bc_cred.json << EOF
{
  "name": "BC Power Solution",
  "type": "microsoftDynamics365BusinessCentralOAuth2Api",
  "data": {
    "tenantId": "$BC_TENANT_ID",
    "clientId": "$BC_CLIENT_ID"
  }
}
EOF

    echo "   Credencial BC creada en /tmp/bc_cred.json"
}

# Función para crear workflow de sincronización
create_sync_workflow() {
    echo "🔄 Creando workflow de sincronización BC → Supabase..."

    # Crear archivo temporal con el workflow
    cat > /tmp/bc_supabase_sync.json << EOF
{
  "name": "BC to Supabase Sync",
  "active": false,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.businesscentral.dynamics.com/v2.0/\${BC_TENANT_ID}/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(\${COMPANY_ID})/Proyectos"
      },
      "id": "bc_projects",
      "name": "Get BC Projects",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "table": "job",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "no": "={{ \$json.no }}",
            "description": "={{ \$json.description }}",
            "status": "={{ \$json.status }}"
          }
        }
      },
      "id": "supabase_upsert",
      "name": "Upsert to Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 300]
    }
  ],
  "connections": {
    "Get BC Projects": {
      "main": [
        [
          {
            "node": "Upsert to Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

    echo "   Workflow creado en /tmp/bc_supabase_sync.json"
}

# Función principal
main() {
    wait_for_n8n
    create_supabase_credential
    create_bc_credential
    create_sync_workflow

    echo ""
    echo "🎉 ¡Configuración completada!"
    echo ""
    echo "📁 Archivos creados:"
    echo "   - /tmp/supabase_cred.json (Credencial Supabase)"
    echo "   - /tmp/bc_cred.json (Credencial Business Central)"
    echo "   - /tmp/bc_supabase_sync.json (Workflow de sincronización)"
    echo ""
    echo "📱 Accede a n8n en: http://192.168.88.68:5678"
    echo "👤 Email: dbertona@powersolution.es"
    echo ""
    echo "💡 Importa estos archivos en n8n para completar la configuración"
}

# Ejecutar función principal
main

