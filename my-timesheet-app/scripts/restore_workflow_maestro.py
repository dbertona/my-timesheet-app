#!/usr/bin/env python3
"""
Script para restaurar el workflow maestro en n8n usando la API
"""

import json
import requests
import sys

# Configuración de n8n
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"
N8N_BASE_URL = "https://n8n.powersolution.es"

def create_workflow():
    """Crear el workflow maestro en n8n"""

    # Datos del workflow maestro
    workflow_data = {
        "name": "Sincronización Completa BC → Supabase (TODAS) - RESTAURADO",
        "active": False,  # Inicialmente inactivo para revisar
        "nodes": [
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/Proyectos",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_proyectos",
                "name": "HTTP - Proyectos BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 160]
            },
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/ProyectosTareas",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_tareas",
                "name": "HTTP - ProyectosTareas BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 304]
            },
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/ProyectosEquipos",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_equipos",
                "name": "HTTP - ProyectosEquipos BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 464]
            },
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/Recursos",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_recursos",
                "name": "HTTP - Recursos BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 608]
            },
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/RecursosCostos",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_costos",
                "name": "HTTP - RecursosCostos BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 752]
            },
            {
                "parameters": {
                    "url": "https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)/CalendaroPeriodosDias",
                    "authentication": "genericCredentialType",
                    "genericAuthType": "oAuth2Api",
                    "options": {"timeout": 30000}
                },
                "id": "http_calendario",
                "name": "HTTP - CalendaroPeriodosDias BC",
                "type": "n8n-nodes-base.httpRequest",
                "typeVersion": 4.1,
                "position": [240, 912]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const proyectos = jsonData.value || [];
    const items = [];

    for (const p of proyectos) {
        items.push({
            json: {
                no: p.no || "",
                description: p.description || "",
                status: p.estado || "",
                responsible: p.responsible || "",
                departamento: p.departamento || ""
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_proyectos",
                "name": "Transformar Proyectos",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 160]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const tareas = jsonData.value || [];
    const items = [];

    for (const t of tareas) {
        items.push({
            json: {
                job_no: t.projectNo || t.jobNo || "",
                no: t.no || "",
                description: (t.description && t.description.trim()) ? t.description : "Sin descripción"
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_tareas",
                "name": "Transformar ProyectosTareas",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 304]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const equipos = jsonData.value || [];
    const items = [];

    for (const e of equipos) {
        items.push({
            json: {
                job_no: e.projectNo || e.jobNo || "",
                resource_no: e.resourceNo || e.resource_code || ""
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_equipos",
                "name": "Transformar ProyectosEquipos",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 464]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const recursos = jsonData.value || [];
    const items = [];

    for (const r of recursos) {
        items.push({
            json: {
                code: r.no || r.code || "",
                name: r.name || "",
                email: r.email || "",
                department_code: r.department || r.departmentCode || "",
                calendar_type: r.calendarType || r.calendar_type || "DEFAULT"
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_recursos",
                "name": "Transformar Recursos",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 608]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const costos = jsonData.value || [];
    const items = [];

    for (const c of costos) {
        items.push({
            json: {
                resource_no: c.resourceNo || c.resource_code || "",
                work_type: c.workType || c.work_type || "",
                unit_cost: parseFloat(c.unitCost || c.unit_cost || 0)
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_costos",
                "name": "Transformar RecursosCostos",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 752]
            },
            {
                "parameters": {
                    "jsCode": """const input = $input.all();
if (input.length > 0) {
    const firstItem = input[0];
    const jsonData = firstItem.json;
    const calendario = jsonData.value || [];
    const items = [];

    for (const cal of calendario) {
        items.push({
            json: {
                allocation_period: cal.allocationPeriod || cal.allocation_period || "",
                calendar_code: cal.calendarCode || cal.calendar_code || "",
                day: cal.day || "",
                holiday: cal.holiday || false,
                hours_working: parseFloat(cal.hoursWorking || cal.hours_working || 0)
            }
        });
    }
    return items;
}
return [];"""
                },
                "id": "transform_calendario",
                "name": "Transformar CalendaroPeriodosDias",
                "type": "n8n-nodes-base.code",
                "typeVersion": 2,
                "position": [464, 912]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "job",
                    "matchType": "allFilters",
                    "filters": {
                        "conditions": [
                            {"keyName": "no", "condition": "eq", "keyValue": "={{ $json.no }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "no", "fieldValue": "={{ $json.no }}"},
                            {"fieldId": "description", "fieldValue": "={{ $json.description }}"},
                            {"fieldId": "status", "fieldValue": "={{ $json.status }}"},
                            {"fieldId": "responsible", "fieldValue": "={{ $json.responsible }}"},
                            {"fieldId": "departamento", "fieldValue": "={{ $json.departamento }}"}
                        ]
                    }
                },
                "id": "supabase_proyectos",
                "name": "Update job",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 160]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "job_task",
                    "filters": {
                        "conditions": [
                            {"keyName": "job_no", "condition": "eq", "keyValue": "={{ $json.job_no }}"},
                            {"keyName": "no", "condition": "eq", "keyValue": "={{ $json.no }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "job_no", "fieldValue": "={{ $json.job_no }}"},
                            {"fieldId": "no", "fieldValue": "={{ $json.no }}"},
                            {"fieldId": "description", "fieldValue": "={{ $json.description }}"}
                        ]
                    }
                },
                "id": "supabase_tareas",
                "name": "Update job_task",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 304]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "job_team",
                    "matchType": "allFilters",
                    "filters": {
                        "conditions": [
                            {"keyName": "job_no", "condition": "eq", "keyValue": "={{ $json.job_no }}"},
                            {"keyName": "resource_no", "condition": "eq", "keyValue": "={{ $json.resource_no }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "job_no", "fieldValue": "={{ $json.job_no }}"},
                            {"fieldId": "resource_no", "fieldValue": "={{ $json.resource_no }}"}
                        ]
                    }
                },
                "id": "supabase_equipos",
                "name": "Update job_team",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 464]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "resource",
                    "matchType": "allFilters",
                    "filters": {
                        "conditions": [
                            {"keyName": "code", "condition": "eq", "keyValue": "={{ $json.code }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "code", "fieldValue": "={{ $json.code }}"},
                            {"fieldId": "name", "fieldValue": "={{ $json.name }}"},
                            {"fieldId": "email", "fieldValue": "={{ $json.email }}"},
                            {"fieldId": "department_code", "fieldValue": "={{ $json.department_code }}"},
                            {"fieldId": "calendar_type", "fieldValue": "={{ $json.calendar_type }}"}
                        ]
                    }
                },
                "id": "supabase_recursos",
                "name": "Update resource",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 608]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "resource_cost",
                    "matchType": "allFilters",
                    "filters": {
                        "conditions": [
                            {"keyName": "resource_no", "condition": "eq", "keyValue": "={{ $json.resource_no }}"},
                            {"keyName": "work_type", "condition": "eq", "keyValue": "={{ $json.work_type }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "resource_no", "fieldValue": "={{ $json.resource_no }}"},
                            {"fieldId": "work_type", "fieldValue": "={{ $json.work_type }}"},
                            {"fieldId": "unit_cost", "fieldValue": "={{ $json.unit_cost }}"}
                        ]
                    }
                },
                "id": "supabase_costos",
                "name": "Update resource_cost",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 752]
            },
            {
                "parameters": {
                    "operation": "update",
                    "tableId": "calendar_period_days",
                    "matchType": "allFilters",
                    "filters": {
                        "conditions": [
                            {"keyName": "allocation_period", "condition": "eq", "keyValue": "={{ $json.allocation_period }}"},
                            {"keyName": "calendar_code", "condition": "eq", "keyValue": "={{ $json.calendar_code }}"},
                            {"keyName": "day", "condition": "eq", "keyValue": "={{ $json.day }}"}
                        ]
                    },
                    "fieldsUi": {
                        "fieldValues": [
                            {"fieldId": "allocation_period", "fieldValue": "={{ $json.allocation_period }}"},
                            {"fieldId": "calendar_code", "fieldValue": "={{ $json.calendar_code }}"},
                            {"fieldId": "day", "fieldValue": "={{ $json.day }}"},
                            {"fieldId": "holiday", "fieldValue": "={{ $json.holiday }}"},
                            {"fieldId": "hours_working", "fieldValue": "={{ $json.hours_working }}"}
                        ]
                    }
                },
                "id": "supabase_calendario",
                "name": "Update calendar_period_days",
                "type": "n8n-nodes-base.supabase",
                "typeVersion": 1,
                "position": [688, 912]
            },
            {
                "parameters": {},
                "type": "n8n-nodes-base.manualTrigger",
                "typeVersion": 1,
                "position": [-112, 144],
                "id": "61cfa51c-c231-4b92-bc74-67d47def3bca",
                "name": "When clicking 'Execute workflow'"
            }
        ],
        "connections": {
            "HTTP - Proyectos BC": {
                "main": [[{"node": "Transformar Proyectos", "type": "main", "index": 0}]]
            },
            "HTTP - ProyectosTareas BC": {
                "main": [[{"node": "Transformar ProyectosTareas", "type": "main", "index": 0}]]
            },
            "HTTP - ProyectosEquipos BC": {
                "main": [[{"node": "Transformar ProyectosEquipos", "type": "main", "index": 0}]]
            },
            "HTTP - Recursos BC": {
                "main": [[{"node": "Transformar Recursos", "type": "main", "index": 0}]]
            },
            "HTTP - RecursosCostos BC": {
                "main": [[{"node": "Transformar RecursosCostos", "type": "main", "index": 0}]]
            },
            "HTTP - CalendaroPeriodosDias BC": {
                "main": [[{"node": "Transformar CalendaroPeriodosDias", "type": "main", "index": 0}]]
            },
            "Transformar Proyectos": {
                "main": [[{"node": "Update job", "type": "main", "index": 0}]]
            },
            "Transformar ProyectosTareas": {
                "main": [[{"node": "Update job_task", "type": "main", "index": 0}]]
            },
            "Transformar ProyectosEquipos": {
                "main": [[{"node": "Update job_team", "type": "main", "index": 0}]]
            },
            "Transformar Recursos": {
                "main": [[{"node": "Update resource", "type": "main", "index": 0}]]
            },
            "Transformar RecursosCostos": {
                "main": [[{"node": "Update resource_cost", "type": "main", "index": 0}]]
            },
            "Transformar CalendaroPeriodosDias": {
                "main": [[{"node": "Update calendar_period_days", "type": "main", "index": 0}]]
            },
            "When clicking 'Execute workflow'": {
                "main": [
                    [
                        {"node": "HTTP - Proyectos BC", "type": "main", "index": 0},
                        {"node": "HTTP - ProyectosTareas BC", "type": "main", "index": 0},
                        {"node": "HTTP - ProyectosEquipos BC", "type": "main", "index": 0},
                        {"node": "HTTP - Recursos BC", "type": "main", "index": 0},
                        {"node": "HTTP - RecursosCostos BC", "type": "main", "index": 0},
                        {"node": "HTTP - CalendaroPeriodosDias BC", "type": "main", "index": 0}
                    ]
                ]
            }
        }
    }

    # Headers para la API
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    try:
        # Crear el workflow
        response = requests.post(
            f"{N8N_BASE_URL}/rest/workflows",
            json=workflow_data,
            headers=headers,
            timeout=30
        )

        if response.status_code == 201:
            print("✅ ¡Workflow maestro creado exitosamente!")
            workflow_id = response.json().get("id")
            print(f"🆔 ID del workflow: {workflow_id}")
            return workflow_id
        else:
            print(f"❌ Error al crear workflow: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def main():
    """Función principal"""
    print("🚀 Restaurando workflow maestro en n8n...")
    print(f"🔗 URL: {N8N_BASE_URL}")
    print(f"🔑 API Key: {N8N_API_KEY[:20]}...")

    workflow_id = create_workflow()

    if workflow_id:
        print(f"\n🎉 ¡Éxito! Workflow restaurado con ID: {workflow_id}")
        print(f"🌐 Accede a: {N8N_BASE_URL}")
        print("💡 Recuerda configurar las credenciales de OAuth2 y Supabase")
    else:
        print("\n❌ No se pudo restaurar el workflow")
        sys.exit(1)

if __name__ == "__main__":
    main()
