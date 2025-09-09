# 🔧 Guía de Integración con N8N

Esta guía documenta cómo interactuar correctamente con n8n para evitar problemas comunes y mantener la sincronización funcionando correctamente.

## 🚀 Inicio Rápido

### **Verificar Estado del Servidor**

```bash
# Usar el script de utilidades
./scripts/n8n-utils.sh status

# O directamente con curl
curl -X GET "http://192.168.88.68:5678/healthz"
```

### **Comandos Esenciales**

```bash
# Listar workflows
./scripts/n8n-utils.sh list

# Gestionar workflows
./scripts/n8n-utils.sh get XSYOmZ8mRuaXl6sg
./scripts/n8n-utils.sh create workflow.json
./scripts/n8n-utils.sh update XSYOmZ8mRuaXl6sg workflow.json

# Limpieza y mantenimiento
./scripts/n8n-utils.sh clean
./scripts/n8n-utils.sh backup XSYOmZ8mRuaXl6sg
```

## 🛠️ Script de Utilidades

### **Ubicación**: `scripts/n8n-utils.sh`

El script incluye todas las funcionalidades necesarias para gestionar n8n:

- ✅ **Verificar estado**: `./scripts/n8n-utils.sh status`
- ✅ **Listar workflows**: `./scripts/n8n-utils.sh list`
- ✅ **Gestionar workflows**: crear, actualizar, eliminar
- ✅ **Limpieza**: eliminar workflows inactivos
- ✅ **Backup**: hacer backup de workflows
- ✅ **Validación**: validar y sanitizar JSON
- ✅ **Monitoreo**: monitorear estado de workflows

### **Ver Ayuda Completa**

```bash
./scripts/n8n-utils.sh help
```

## 📋 Índice

1. [Configuración de Acceso](#configuración-de-acceso)
2. [Comandos Básicos](#comandos-básicos)
3. [Gestión de Workflows](#gestión-de-workflows)
4. [Ejecución de Webhooks](#ejecución-de-webhooks)
5. [Troubleshooting](#troubleshooting)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🔑 Configuración de Acceso

### **Credenciales N8N**

```bash
# Servidor N8N
N8N_URL="http://192.168.88.68:5678"
N8N_API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70"

# Headers para requests
HEADERS="-H 'X-N8N-API-KEY: $N8N_API_KEY' -H 'Content-Type: application/json'"
```

### **Verificar Estado del Servidor**

```bash
# Verificar que n8n esté funcionando
curl -X GET "http://192.168.88.68:5678/healthz"
# Respuesta esperada: {"status":"ok"}
```

---

## 🛠️ Comandos Básicos

### **1. Listar Workflows**

```bash
# Obtener todos los workflows
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | jq '.data[] | {id: .id, name: .name, active: .active}'
```

### **2. Obtener Workflow Específico**

```bash
# Obtener workflow por ID
curl -X GET "http://192.168.88.68:5678/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json"
```

### **3. Crear/Actualizar Workflow**

```bash
# Crear nuevo workflow
curl -X POST "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow.json

# Actualizar workflow existente
curl -X PUT "http://192.168.88.68:5678/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @workflow.json
```

### **4. Eliminar Workflow**

```bash
# Eliminar workflow por ID
curl -X DELETE "http://192.168.88.68:5678/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json"
```

---

## 📊 Gestión de Workflows

### **Workflows Activos Actuales**

| ID                 | Nombre                              | Estado    | Descripción                                  |
| ------------------ | ----------------------------------- | --------- | -------------------------------------------- |
| `XSYOmZ8mRuaXl6sg` | `001_sincronizacion_completa_smart` | ✅ Activo | Sincronización BC → Supabase (multi-empresa) |
| `DAZUg4e3Yuv160sa` | `002_sync_supabase_to_bc`           | ✅ Activo | Sincronización Supabase → BC                 |
| `n9ipjJzVhD2iFVzD` | `000_warmup_credentials`            | ✅ Activo | Warmup de credenciales OAuth2                |

---

## 🚀 Ejecución de Webhooks

### **Webhook de Sincronización BC → Supabase**

#### **URL del Webhook:**

```
https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase
```

#### **Parámetros Disponibles:**

| Parámetro       | Valor                    | Empresa                                | Company ID |
| --------------- | ------------------------ | -------------------------------------- | ---------- |
| `company=psi`   | Power Solution Iberia SL | `ca9dc1bf-54ee-ed11-884a-000d3a455d5b` |
| `company=pslab` | PS LAB CONSULTING SL     | `656f8f0e-2bf4-ed11-8848-000d3a4baf18` |

#### **Comandos de Ejecución:**

```bash
# Ejecutar para PSI (Power Solution Iberia)
curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=psi" \
  -H "Content-Type: application/json" \
  -d '{}'

# Ejecutar para PSLAB (PS LAB CONSULTING)
curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=pslab" \
  -H "Content-Type: application/json" \
  -d '{}'

# Usando el script de utilidades
./scripts/n8n-utils.sh webhook "ejecutar-sync-bc-to-supabase?company=psi"
```

#### **Respuesta Exitosa:**

```json
{
  "success": true,
  "message": "Sincronización completada",
  "company": "Power Solution Iberia SL",
  "entities_synced": [
    "job",
    "job_task",
    "resource",
    "resource_cost",
    "calendar_period_days",
    "job_team"
  ],
  "timestamp": "2025-01-09T08:30:00Z"
}
```

#### **Verificar Estado del Workflow:**

```bash
# Verificar que esté activo
./scripts/n8n-utils.sh list

# Ver logs de ejecución
./scripts/n8n-utils.sh logs "001_sincronizacion_completa_smart"
```

### **Webhook de Sincronización Supabase → BC**

#### **URL del Webhook:**

```
https://n8n.powersolution.es/webhook/sync-supabase-to-bc
```

#### **Comando de Ejecución:**

```bash
curl -X POST "https://n8n.powersolution.es/webhook/sync-supabase-to-bc" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Monitoreo de Ejecuciones**

```bash
# Verificar estado del servidor
./scripts/n8n-utils.sh status

# Listar workflows activos
./scripts/n8n-utils.sh list

# Ver logs de un workflow específico
./scripts/n8n-utils.sh logs "WORKFLOW_ID"
```

### **Ejemplos Prácticos de Ejecución**

#### **Ejemplo 1: Sincronizar datos de PSI**

```bash
# Ejecutar sincronización completa para Power Solution Iberia
curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=psi" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

#### **Ejemplo 2: Sincronizar datos de PSLAB**

```bash
# Ejecutar sincronización completa para PS LAB CONSULTING
curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=pslab" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
```

#### **Ejemplo 3: Verificar estado antes de ejecutar**

```bash
# Verificar que el workflow esté activo
./scripts/n8n-utils.sh list | grep "001_sincronizacion_completa_smart"

# Ejecutar solo si está activo
if ./scripts/n8n-utils.sh list | grep -q "001_sincronizacion_completa_smart.*✅ Activo"; then
  echo "✅ Workflow activo, ejecutando sincronización..."
  curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=psi" \
    -H "Content-Type: application/json" \
    -d '{}'
else
  echo "❌ Workflow no está activo, no se puede ejecutar"
fi
```

#### **Ejemplo 4: Ejecutar con monitoreo**

```bash
# Ejecutar y monitorear en tiempo real
echo "🚀 Iniciando sincronización para PSI..."
curl -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=psi" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'

echo "📊 Verificando estado del workflow..."
./scripts/n8n-utils.sh list | grep "001_sincronizacion_completa_smart"
```

### **Script de Ejecución Automática**

```bash
#!/bin/bash
# Script para ejecutar sincronización automática

COMPANY="$1"
if [ -z "$COMPANY" ]; then
  echo "Uso: $0 <psi|pslab>"
  exit 1
fi

echo "🔍 Verificando estado del servidor n8n..."
if ! ./scripts/n8n-utils.sh status > /dev/null 2>&1; then
  echo "❌ Servidor n8n no está disponible"
  exit 1
fi

echo "✅ Servidor n8n funcionando"
echo "🚀 Ejecutando sincronización para $COMPANY..."

RESPONSE=$(curl -s -X POST "https://n8n.powersolution.es/webhook/ejecutar-sync-bc-to-supabase?company=$COMPANY" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Sincronización completada exitosamente"
  echo "$RESPONSE" | jq '.'
else
  echo "❌ Error en la sincronización"
  echo "$RESPONSE"
  exit 1
fi
```

### **Comandos de Gestión**

```bash
# Listar solo workflows activos
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | jq '.data[] | select(.active == true) | {id: .id, name: .name}'

# Listar solo workflows inactivos
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | jq '.data[] | select(.active == false) | {id: .id, name: .name}'

# Eliminar todos los workflows inactivos
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | \
jq -r '.data[] | select(.active == false) | .id' | \
while read id; do
  echo "Eliminando workflow $id..."
  curl -X DELETE "http://192.168.88.68:5678/api/v1/workflows/$id" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json"
done
```

---

## 🔧 Troubleshooting

### **Problemas Comunes**

#### **1. Error 401 - Unauthorized**

```bash
# Verificar API key
echo "API Key: $N8N_API_KEY"

# Verificar que la key esté correcta
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | jq '.data | length'
```

#### **2. Error 500 - Internal Server Error**

```bash
# Verificar estado del servidor
curl -X GET "http://192.168.88.68:5678/healthz"

# Reiniciar n8n (si tienes acceso SSH)
ssh dbertona@192.168.88.68
sudo docker-compose -f /path/to/n8n/docker-compose.yml restart
```

#### **3. Error 404 - Workflow Not Found**

```bash
# Verificar que el workflow existe
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | jq '.data[] | select(.id == "WORKFLOW_ID")'
```

#### **4. Error de Sintaxis en JSON**

```bash
# Validar JSON antes de enviar
jq . workflow.json > /dev/null && echo "JSON válido" || echo "JSON inválido"

# Sanitizar JSON para n8n
jq '{name, nodes, connections, settings}' workflow.json > workflow_sanitized.json
```

### **Comandos de Diagnóstico**

```bash
# Verificar conectividad
ping -c 3 192.168.88.68

# Verificar puerto
telnet 192.168.88.68 5678

# Ver logs de n8n (si tienes acceso SSH)
ssh dbertona@192.168.88.68
sudo docker logs n8n_container_name
```

---

## 📝 Mejores Prácticas

### **1. Antes de Modificar Workflows**

```bash
# 1. Hacer backup del workflow actual
curl -X GET "http://192.168.88.68:5678/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" > backup_workflow_$(date +%Y%m%d_%H%M%S).json

# 2. Validar JSON
jq . nuevo_workflow.json > /dev/null

# 3. Probar en workflow de prueba primero
```

### **2. Estructura de JSON para N8N**

```json
{
  "name": "nombre_del_workflow",
  "nodes": [...],
  "connections": {...},
  "settings": {
    "executionOrder": "v1"
  }
}
```

### **3. Sanitización de JSON**

```bash
# Script para sanitizar workflow JSON
#!/bin/bash
WORKFLOW_FILE="$1"
SANITIZED_FILE="${WORKFLOW_FILE%.json}_sanitized.json"

# Extraer solo campos necesarios
jq '{
  name: .name,
  nodes: .nodes,
  connections: .connections,
  settings: .settings
}' "$WORKFLOW_FILE" > "$SANITIZED_FILE"

echo "Workflow sanitizado guardado en: $SANITIZED_FILE"
```

### **4. Monitoreo de Workflows**

```bash
# Script para monitorear estado de workflows
#!/bin/bash
echo "=== Estado de Workflows N8N ==="
curl -s -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | \
jq -r '.data[] | "\(.name) (\(.id)): \(if .active then "✅ Activo" else "❌ Inactivo" end)"'
```

---

## 🚨 Comandos de Emergencia

### **Reiniciar N8N**

```bash
# Si tienes acceso SSH
ssh dbertona@192.168.88.68
sudo docker-compose -f /path/to/n8n/docker-compose.yml restart

# Verificar que esté funcionando
curl -X GET "http://192.168.88.68:5678/healthz"
```

### **Restaurar Workflow desde Backup**

```bash
# Restaurar desde backup
curl -X PUT "http://192.168.88.68:5678/api/v1/workflows/WORKFLOW_ID" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @backup_workflow.json
```

### **Limpiar Workflows Inactivos**

```bash
# Eliminar todos los workflows inactivos
curl -X GET "http://192.168.88.68:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" | \
jq -r '.data[] | select(.active == false) | .id' | \
xargs -I {} curl -X DELETE "http://192.168.88.68:5678/api/v1/workflows/{}" \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json"
```

---

## 📚 Referencias

- **N8N API Documentation**: https://docs.n8n.io/api/
- **N8N Webhook Documentation**: https://docs.n8n.io/integrations/builtin/cli-nodes/n8n-nodes-base.webhook/
- **jq Documentation**: https://stedolan.github.io/jq/

---

## 🔄 Actualizaciones

- **Última actualización**: 9 de Enero, 2025
- **Versión N8N**: 1.x
- **Workflows activos**: 3
- **Estado del servidor**: ✅ Funcionando

---

_Esta guía debe mantenerse actualizada con cualquier cambio en la configuración de n8n o en los workflows._
