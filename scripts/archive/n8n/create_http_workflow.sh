#!/bin/bash

# Script para crear workflows usando HTTP Request (evita problemas de permisos)
# Ejecutar en la máquina Debian

echo "🚀 Creando workflows alternativos usando HTTP Request..."

# Crear workflow para sincronizar proyectos usando HTTP Request
echo "📋 Creando workflow HTTP: Sincronizar Proyectos BC → Supabase"
cat > /tmp/workflow_http_proyectos.json << 'EOF'
{
  "name": "HTTP - Sincronizar Proyectos BC → Supabase",
  "active": false,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(\${COMPANY_ID})/Proyectos",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "nodeCredentialType": "httpHeaderAuth",
        "httpHeaderAuth": "={{ $credentials.bcOAuth }}",
        "options": {
          "timeout": 30000,
          "retry": {
            "enabled": true,
            "maxTries": 3
          }
        }
      },
      "id": "http_get_proyectos",
      "name": "HTTP - Obtener Proyectos BC",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Transformar datos de BC a formato Supabase\nconst proyectos = $input.all();\nconst transformed = [];\n\nfor (const proyecto of proyectos) {\n  transformed.push({\n    no: proyecto.no || '',\n    description: proyecto.description || '',\n    status: proyecto.status || proyecto.Estado || '',\n    responsible: proyecto.responsible || '',\n    start_date: proyecto.startDate || null,\n    end_date: proyecto.endDate || null,\n    customer_no: proyecto.customerNo || '',\n    customer_name: proyecto.customerName || '',\n    budget: proyecto.budget || 0,\n    created_at: new Date().toISOString(),\n    updated_at: new Date().toISOString()\n  });\n}\n\nreturn transformed;"
      },
      "id": "transform_proyectos",
      "name": "Transformar Proyectos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "table": "job",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "no": "={{ $json.no }}",
            "description": "={{ $json.description }}",
            "status": "={{ $json.status }}",
            "responsible": "={{ $json.responsible }}",
            "start_date": "={{ $json.start_date }}",
            "end_date": "={{ $json.end_date }}",
            "customer_no": "={{ $json.customer_no }}",
            "customer_name": "={{ $json.customer_name }}",
            "budget": "={{ $json.budget }}",
            "updated_at": "={{ $json.updated_at }}"
          }
        },
        "upsertConflictColumns": ["no"]
      },
      "id": "supabase_upsert",
      "name": "Upsert a Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "HTTP - Obtener Proyectos BC": {
      "main": [
        [
          {
            "node": "Transformar Proyectos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transformar Proyectos": {
      "main": [
        [
          {
            "node": "Upsert a Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

# Crear credencial OAuth2 genérica para BC
echo "🔗 Creando credencial OAuth2 genérica para BC..."
cat > /tmp/bc_oauth_cred.json << 'EOF'
{
  "name": "BC OAuth2 Generic",
  "type": "oAuth2",
  "data": {
    "grantType": "authorizationCode",
    "authorizationUrl": "https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb/oauth2/v2.0/authorize",
    "tokenUrl": "https://login.microsoftonline.com/a18dc497-a8b8-4740-b723-65362ab7a3fb/oauth2/v2.0/token",
    "scope": "https://api.businesscentral.dynamics.com/.default",
    "clientId": "64898aa0-1f14-46ab-8283-74161f5e3cb2"
  }
}
EOF

echo ""
echo "🎉 ¡Workflow alternativo creado!"
echo ""
echo "📁 Archivos generados:"
echo "   - /tmp/workflow_http_proyectos.json (Workflow HTTP para Proyectos)"
echo "   - /tmp/bc_oauth_cred.json (Credencial OAuth2 genérica)"
echo ""
echo "💡 Este enfoque evita problemas de permisos de aplicación"
echo "🚀 Usa HTTP Request directo con autenticación OAuth2"
echo ""
echo "🔧 Para usar:"
echo "   1. Importa la credencial OAuth2 genérica"
echo "   2. Importa el workflow HTTP"
echo "   3. Configura la autenticación OAuth2"

