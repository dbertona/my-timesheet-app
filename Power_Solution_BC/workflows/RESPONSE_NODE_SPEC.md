# Especificación del Nodo de Respuesta para sync_bc_to_ps_analytics

## Objetivo
El webhook debe devolver JSON detallado con:
- `status`: "ok", "partial_error", "error"
- `details`: objeto con estado de cada entidad (recursos, proyectos, etc.)
- Para cada entidad: `{status: "ok|error", synced: N, failed_ids: [...], message: "..."}`

## Formato JSON de Respuesta

```json
{
  "status": "ok",
  "timestamp": "2025-09-30T10:30:00.000Z",
  "summary": {
    "total_entities": 9,
    "success": 9,
    "failed": 0
  },
  "details": {
    "recursos": {
      "status": "ok",
      "synced": 15
    },
    "proyectos": {
      "status": "ok",
      "synced": 234
    },
    "movimientos_proyectos": {
      "status": "ok",
      "synced": 1234
    },
    "equipo_proyectos": {
      "status": "ok",
      "synced": 89
    },
    "ps_year": {
      "status": "ok",
      "synced": 3
    },
    "centros_responsabilidad": {
      "status": "ok",
      "synced": 12
    },
    "tecnologias": {
      "status": "ok",
      "synced": 8
    },
    "tipologias": {
      "status": "ok",
      "synced": 5
    },
    "configuracion_usuarios": {
      "status": "ok",
      "synced": 23
    }
  }
}
```

## Ejemplo con Errores Parciales

```json
{
  "status": "partial_error",
  "timestamp": "2025-09-30T10:30:00.000Z",
  "summary": {
    "total_entities": 9,
    "success": 7,
    "failed": 2
  },
  "details": {
    "recursos": {
      "status": "ok",
      "synced": 15
    },
    "proyectos": {
      "status": "ok",
      "synced": 234
    },
    "movimientos_proyectos": {
      "status": "error",
      "failed_ids": ["MOV-001", "MOV-045"],
      "message": "duplicate key value violates unique constraint"
    },
    "ps_year": {
      "status": "error",
      "message": "timeout connecting to database"
    },
    ...
  }
}
```

## Implementación en n8n

### Nodo: Respond to Webhook

**Tipo:** `n8n-nodes-base.respondToWebhook`

**Parámetros:**
- `respondWith`: "json"
- `responseBody`: Expresión JavaScript que construye el JSON

**Expresión JavaScript para responseBody:**

```javascript
{{
  // Construir resumen de resultados
  const entities = [
    'recursos', 
    'proyectos', 
    'movimientos_proyectos', 
    'equipo_proyectos', 
    'ps_year',
    'centros_responsabilidad',
    'tecnologias',
    'tipologias',
    'configuracion_usuarios'
  ];
  
  const details = {};
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (const entity of entities) {
    const transformNodeName = 'Transform ' + entity.charAt(0).toUpperCase() + entity.slice(1).replace(/_/g, ' ');
    
    try {
      const items = $items(transformNodeName);
      details[entity] = {
        status: 'ok',
        synced: items.length
      };
      totalSuccess++;
    } catch (error) {
      details[entity] = {
        status: 'error',
        message: error.message || 'Node not found or failed'
      };
      totalFailed++;
    }
  }
  
  const overallStatus = totalFailed === 0 ? 'ok' : (totalSuccess > 0 ? 'partial_error' : 'error');
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    summary: {
      total_entities: entities.length,
      success: totalSuccess,
      failed: totalFailed
    },
    details: details
  };
}}
```

## Configuración del Webhook

- **Path:** `sync-recursos-y-ps-years-psanalytics`
- **Response Mode:** `responseNode` (obligatorio para usar Respond to Webhook)
- **Enabled:** true

## Conexiones

Todos los nodos de transformación (Upsert) deben conectarse al nodo "Respond to Webhook":
- Transform Recursos → Upsert Recursos → Respond to Webhook
- Transform Proyectos → Upsert Proyectos → Respond to Webhook
- ...etc

## Nota para BC

El codeunit `50442 PS_Analytics SyncWorker` parseará:
- `status != "ok"` → marca `Queue.Status = Error`
- `details[entity].status = "error"` → guarda en `Last Error`
- `details[entity].failed_ids` → lista de IDs que fallaron
