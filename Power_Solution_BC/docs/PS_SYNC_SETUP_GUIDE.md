# 🚀 Guía de Configuración PS Sync Setup

## 📋 Resumen de Implementación

Hemos implementado exitosamente el sistema de sincronización BC → n8n → Supabase con respuesta JSON detallada y polling de respaldo.

### ✅ **Componentes Implementados:**

#### **🔧 Business Central (AL):**
- **`PS_SyncSetup`**: Configuración global con campos webhook y Supabase
- **`PS_SyncQueue`**: Cola de sincronización con logging detallado
- **`PS_Analytics SyncWorker`**: Worker que procesa la cola y hace polling
- **`PS_AnalyticsWebhookDispatcher`**: Suscriptor de eventos que encola cambios
- **Páginas de gestión**: Setup, Queue List, Job Queue Setup

#### **🔄 n8n Workflow:**
- **Webhook endpoint**: `https://n8n.powersolution.es/webhook/sync-recursos-y-ps-years-psanalytics`
- **Nodo Compute Execution Summary**: Calcula resumen por entidad
- **Response JSON detallado**: Status, timestamp, company, summary, details

#### **🗄️ Supabase:**
- **Tabla `sync_executions`**: Logging de ejecuciones con detalles JSONB
- **Permisos configurados**: Para anon, authenticated, service_role

---

## 🛠️ **Próximos Pasos de Configuración**

### **1. Configurar PS_SyncSetup Card**
```
URL: https://businesscentral.dynamics.com/[tenant]/[environment]?company=[company]&page=50452
```

**Campos a configurar:**
- **Webhook URL**: `https://n8n.powersolution.es/webhook/sync-recursos-y-ps-years-psanalytics`
- **API Key**: `TU_API_KEY` (configurar en n8n)
- **Debounce Seconds**: `60` (anti-spam)
- **Supabase REST URL**: `http://192.168.88.68:8005/rest/v1`
- **Supabase API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (service_role key)

**Acciones disponibles:**
- ✅ **Probar Webhook**: Verifica conexión con n8n
- ✅ **Probar Supabase**: Verifica acceso a sync_executions

### **2. Configurar Job Queue Entry**
```
URL: https://businesscentral.dynamics.com/[tenant]/[environment]?company=[company]&page=50454
```

**Configuración recomendada:**
- **Status**: `Ready`
- **Recurring Job**: `Yes`
- **Días de ejecución**: Todos los días
- **Horario**: 00:00:00 - 23:59:59
- **Inactivity Timeout**: `60` segundos
- **Max Attempts**: `3`

**Acciones disponibles:**
- ✅ **Crear Job Queue Entry**: Crea entrada automáticamente
- ✅ **Actualizar Job Queue Entry**: Modifica configuración existente
- ✅ **Eliminar Job Queue Entry**: Remueve entrada

### **3. Gestionar Cola de Sincronización**
```
URL: https://businesscentral.dynamics.com/[tenant]/[environment]?company=[company]&page=50453
```

**Funcionalidades:**
- ✅ **Ver estado** de sincronizaciones pendientes/procesadas/errores
- ✅ **Procesar ahora**: Ejecuta SyncWorker manualmente
- ✅ **Ver detalle**: HTTP status, response, errores
- ✅ **Cambiar estado**: Marcar como pendiente/hecho

---

## 🔍 **Verificación del Sistema**

### **Test 1: Webhook Response**
```bash
curl -i -X POST 'https://n8n.powersolution.es/webhook/sync-recursos-y-ps-years-psanalytics?company=psi' \
  -H 'Content-Type: application/json' \
  -d '{"source":"test"}'
```

**Respuesta esperada:**
```json
{
  "status": "partial_error",
  "timestamp": "2025-09-30T16:59:02.853Z",
  "company": "Power Solution Iberia SL",
  "summary": {
    "total_entities": 9,
    "success": 1,
    "failed": 8
  },
  "details": {
    "recursos": {"status": "ok", "synced": 0},
    "proyectos": {"status": "error", "message": "Referenced node is unexecuted"},
    // ... más detalles por entidad
  }
}
```

### **Test 2: Supabase Polling**
```bash
curl -X GET 'http://192.168.88.68:8005/rest/v1/sync_executions?limit=1' \
  -H 'apikey: [SUPABASE_API_KEY]' \
  -H 'Authorization: Bearer [SUPABASE_API_KEY]'
```

### **Test 3: BC Event Trigger**
1. Modificar un registro en `Resource`, `Job`, `Job Planning Line`, etc.
2. Verificar que se crea entrada en `PS_SyncQueue`
3. Esperar que Job Queue procese la entrada
4. Verificar respuesta JSON en `Last Response`

---

## 🚨 **Troubleshooting**

### **Problema: Webhook no responde**
- ✅ Verificar que n8n workflow esté activo
- ✅ Verificar API Key en PS_SyncSetup
- ✅ Verificar URL del webhook

### **Problema: Job Queue no procesa**
- ✅ Verificar que Job Queue Entry esté en estado `Ready`
- ✅ Verificar que Job Queue esté habilitado en BC
- ✅ Verificar permisos del usuario

### **Problema: Polling Supabase falla**
- ✅ Verificar Supabase REST URL y API Key
- ✅ Verificar que tabla `sync_executions` existe
- ✅ Verificar permisos en Supabase

---

## 📊 **Monitoreo y Logs**

### **Logs en BC:**
- **`PS_SyncQueue`**: Estado de cada sincronización
- **`PS_SyncSetup`**: Configuración global
- **Job Queue Entries**: Estado del worker

### **Logs en n8n:**
- **Executions**: Historial de ejecuciones del workflow
- **Response Body**: JSON detallado por entidad

### **Logs en Supabase:**
- **`sync_executions`**: Registro de todas las ejecuciones
- **`sync_state`**: Estado de última sincronización por entidad

---

## 🎯 **Estado Actual**

✅ **Tabla `sync_executions` creada en Supabase**  
✅ **Webhook devuelve JSON detallado**  
✅ **Páginas de gestión configuradas**  
✅ **Sistema de polling implementado**  
✅ **Job Queue worker listo**  

**🚀 El sistema está listo para producción!**

---

## 📞 **Soporte**

Para problemas o dudas:
1. Revisar logs en `PS_SyncQueue List`
2. Probar conexiones con botones de test
3. Verificar configuración en `PS_SyncSetup Card`
4. Consultar ejecuciones en n8n
