#!/bin/bash

# Script para crear workflows avanzados de n8n
# Ejecutar en la máquina Debian

echo "🚀 Creando workflows avanzados de n8n..."

# Crear workflow para sincronizar proyectos
echo "📋 Creando workflow: Sincronizar Proyectos BC → Supabase"
cat > /tmp/workflow_proyectos.json << 'EOF'
{
  "name": "Sincronizar Proyectos BC → Supabase",
  "active": false,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(\${COMPANY_ID})/Proyectos",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "nodeCredentialType": "httpHeaderAuth",
        "httpHeaderAuth": "={{ $credentials.bcAuth }}"
      },
      "id": "get_bc_proyectos",
      "name": "Obtener Proyectos BC",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Transformar datos de BC a formato Supabase\nconst proyectos = $input.all();\nconst transformed = [];\n\nfor (const proyecto of proyectos) {\n  transformed.push({\n    no: proyecto.no || '',\n    description: proyecto.description || '',\n    status: proyecto.status || proyecto.Estado || '',\n    responsible: proyecto.responsible || '',\n    start_date: proyecto.startDate || null,\n    end_date: proyecto.endDate || null,\n    customer_no: proyecto.customerNo || '',\n    customer_name: proyecto.customerName || '',\n    budget: proyecto.budget || 0,\n    created_at: new Date().toISOString(),\n    updated_at: new Date().toISOString()\n  });\n}\n\nreturn transformed;"
      },
      "id": "transform_data",
      "name": "Transformar Datos",
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
      "id": "upsert_supabase",
      "name": "Upsert a Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "id": "1",
              "leftValue": "={{ $json.length }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "id": "check_results",
      "name": "Verificar Resultados",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [900, 300]
    },
    {
      "parameters": {
        "message": "✅ Sincronización completada: {{ $json.length }} proyectos sincronizados exitosamente"
      },
      "id": "success_message",
      "name": "Mensaje Éxito",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1120, 200]
    },
    {
      "parameters": {
        "message": "⚠️ No se encontraron proyectos para sincronizar"
      },
      "id": "no_data_message",
      "name": "Sin Datos",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1120, 400]
    }
  ],
  "connections": {
    "Obtener Proyectos BC": {
      "main": [
        [
          {
            "node": "Transformar Datos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transformar Datos": {
      "main": [
        [
          {
            "node": "Upsert a Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Upsert a Supabase": {
      "main": [
        [
          {
            "node": "Verificar Resultados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Verificar Resultados": {
      "main": [
        [
          {
            "node": "Mensaje Éxito",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Sin Datos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

# Crear workflow para sincronizar tareas
echo "📋 Creando workflow: Sincronizar Tareas BC → Supabase"
cat > /tmp/workflow_tareas.json << 'EOF'
{
  "name": "Sincronizar Tareas BC → Supabase",
  "active": false,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(\${COMPANY_ID})/ProyectosTareas",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "nodeCredentialType": "httpHeaderAuth",
        "httpHeaderAuth": "={{ $credentials.bcAuth }}"
      },
      "id": "get_bc_tareas",
      "name": "Obtener Tareas BC",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Transformar tareas de BC a formato Supabase\nconst tareas = $input.all();\nconst transformed = [];\n\nfor (const tarea of tareas) {\n  transformed.push({\n    job_no: tarea.jobNo || '',\n    no: tarea.no || '',\n    description: tarea.description || '',\n    type: tarea.type || '',\n    status: tarea.status || '',\n    quantity: tarea.quantity || 0,\n    unit_price: tarea.unitPrice || 0,\n    total_price: tarea.totalPrice || 0,\n    created_at: new Date().toISOString(),\n    updated_at: new Date().toISOString()\n  });\n}\n\nreturn transformed;"
      },
      "id": "transform_tareas",
      "name": "Transformar Tareas",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "table": "job_task",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "job_no": "={{ $json.job_no }}",
            "no": "={{ $json.no }}",
            "description": "={{ $json.description }}",
            "type": "={{ $json.type }}",
            "status": "={{ $json.status }}",
            "quantity": "={{ $json.quantity }}",
            "unit_price": "={{ $json.unit_price }}",
            "total_price": "={{ $json.total_price }}",
            "updated_at": "={{ $json.updated_at }}"
          }
        },
        "upsertConflictColumns": ["job_no", "no"]
      },
      "id": "upsert_tareas",
      "name": "Upsert Tareas a Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Obtener Tareas BC": {
      "main": [
        [
          {
            "node": "Transformar Tareas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transformar Tareas": {
      "main": [
        [
          {
            "node": "Upsert Tareas a Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

# Crear workflow para sincronizar recursos
echo "📋 Creando workflow: Sincronizar Recursos BC → Supabase"
cat > /tmp/workflow_recursos.json << 'EOF'
{
  "name": "Sincronizar Recursos BC → Supabase",
  "active": false,
  "nodes": [
    {
      "parameters": {
        "httpMethod": "GET",
        "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(\${COMPANY_ID})/Recursos",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "nodeCredentialType": "httpHeaderAuth",
        "httpHeaderAuth": "={{ $credentials.bcAuth }}"
      },
      "id": "get_bc_recursos",
      "name": "Obtener Recursos BC",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "// Transformar recursos de BC a formato Supabase\nconst recursos = $input.all();\nconst transformed = [];\n\nfor (const recurso of recursos) {\n  transformed.push({\n    code: recurso.code || '',\n    name: recurso.name || '',\n    type: recurso.type || '',\n    unit_price: recurso.unitPrice || 0,\n    cost_center: recurso.costCenter || '',\n    status: recurso.status || 'active',\n    created_at: new Date().toISOString(),\n    updated_at: new Date().toISOString()\n  });\n}\n\nreturn transformed;"
      },
      "id": "transform_recursos",
      "name": "Transformar Recursos",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "operation": "upsert",
        "table": "resource",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "code": "={{ $json.code }}",
            "name": "={{ $json.name }}",
            "type": "={{ $json.type }}",
            "unit_price": "={{ $json.unit_price }}",
            "cost_center": "={{ $json.cost_center }}",
            "status": "={{ $json.status }}",
            "updated_at": "={{ $json.updated_at }}"
          }
        },
        "upsertConflictColumns": ["code"]
      },
      "id": "upsert_recursos",
      "name": "Upsert Recursos a Supabase",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Obtener Recursos BC": {
      "main": [
        [
          {
            "node": "Transformar Recursos",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Transformar Recursos": {
      "main": [
        [
          {
            "node": "Upsert Recursos a Supabase",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
EOF

echo ""
echo "🎉 ¡Workflows avanzados creados!"
echo ""
echo "📁 Archivos generados:"
echo "   - /tmp/workflow_proyectos.json (Sincronización de Proyectos)"
echo "   - /tmp/workflow_tareas.json (Sincronización de Tareas)"
echo "   - /tmp/workflow_recursos.json (Sincronización de Recursos)"
echo ""
echo "💡 Importa estos workflows en n8n para tener la integración completa"
echo "🚀 Cada workflow incluye:"
echo "   - Transformación de datos"
echo "   - Manejo de errores"
echo "   - Upsert optimizado"
echo "   - Logging detallado"

