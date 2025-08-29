# Workflows n8n - Sincronización Business Central → Supabase

## 🎯 Workflow Oficial: 001_sincronizacion_completa.json

**Estado:** ✅ **ACTIVO Y FUNCIONANDO** en n8n  
**Última actualización:** 29/08/2025  
**Total de nodos:** 49  
**ID en n8n:** 3fpaX4J2wc5DH054  

### 📋 Entidades Sincronizadas (6 total)

1. **📅 Calendario** (`calendar_period_days`) - ✅ Completo
2. **🏗️ Proyectos** (`job`) - ✅ Completo  
3. **📋 Tareas** (`job_task`) - ✅ Completo
4. **👥 Equipos** (`job_team`) - ✅ Completo
5. **👨‍💼 Recursos** (`resource`) - ✅ Completo
6. **💰 Costos** (`resource_cost`) - ✅ Completo

### 🔧 Características Implementadas

- ✅ **Sincronización incremental** con `lastModifiedDateTime` desde BC
- ✅ **Tabla sync_state** para tracking de última sincronización por entidad
- ✅ **Batching de 300 registros** para evitar timeouts
- ✅ **Campo company_name** en todas las transformaciones
- ✅ **matchType=allFilters** en todas las actualizaciones de sync_state
- ✅ **Conexiones en paralelo** para actualizar sync_state independientemente

### 📊 Estructura del Workflow

```
Manual Trigger
├── Get sync_state (jobs) → HTTP Proyectos → Transform → Batch → Update job
├── Get sync_state (tasks) → HTTP ProyectosTareas → Transform → Batch → Update job_task  
├── Get sync_state (calendar) → HTTP CalendaroPeriodosDias → Transform → Batch → Update calendar_period_days
├── Get sync_state (team) → HTTP ProyectosEquipos → Transform → Batch → Update job_team
├── Get sync_state (resource) → HTTP Recursos → Transform → Batch → Update resource
└── Get sync_state (cost) → HTTP RecursosCostos → Transform → Batch → Update resource_cost
```

### 🚀 Estado de Implementación

- **Workflow 001:** ✅ **OFICIAL Y FUNCIONANDO** (49 nodos)
- **APIs BC:** ✅ CalendaroPeriodosDias, ⏳ Resto pendientes de publicar

### 📝 Próximos Pasos

1. **Publicar cambios AL en Business Central** para exponer `lastModifiedDateTime` en:
   - PS_Proyectos_Tareas (Tareas)
   - PS_Proyectos_Equipo (Equipos)
   - PS_Recursos (Recursos)
   - PS_RecursosCostos (Costos)

2. **Probar sincronización incremental** con datos reales

3. **Configurar ejecución automática** con cron

---

**Nota:** Este es el único workflow activo. Los archivos de desarrollo han sido eliminados para mantener el proyecto limpio.

## 🔄 Workflow Bidireccional: 003_sync_supabase_to_bc.json

**Estado:** 🔄 **NUEVO - Sincronización Supabase → BC**  
**Funcionalidad:** Replica el script Python sync_supabase_to_bc.py  
**Total de nodos:** 20  

### 📋 Funcionalidad del Workflow

Este workflow sincroniza timesheets desde Supabase hacia Business Central:

1. **🔐 Autenticación OAuth2** con Business Central
2. **📥 Lectura de cabeceras** desde Supabase (`synced_to_bc=false`)
3. **📤 Inserción de cabeceras** en BC via API
4. **📥 Lectura de líneas** de timesheet desde Supabase
5. **📤 Inserción de líneas** en BC via API
6. **✅ Marcado como sincronizado** en Supabase

### 🔧 Nodos del Workflow

- **Manual Trigger** → Inicio del proceso
- **HTTP - Get BC Token** → OAuth2 authentication
- **Extract BC Token** → Extrae token de respuesta
- **Get Headers** → Lee cabeceras desde Supabase
- **Prepare Headers** → Prepara datos para BC
- **HTTP - Post Header to BC** → Inserta cabecera en BC
- **Extract Document No** → Extrae número de documento
- **Get Lines for Header** → Lee líneas del header
- **Prepare Lines** → Prepara líneas para BC
- **HTTP - Post Line to BC** → Inserta línea en BC
- **Check Line Result** → Verifica resultado
- **Mark Line as Synced** → Marca línea como sincronizada
- **Mark Header as Synced** → Marca cabecera como sincronizada
- **Sincronización Completada** → Confirmación final

### 📊 Flujo de Datos

```
Supabase → Business Central
├── resource_timesheet_header (synced_to_bc=false)
│   ├── Insertar en BC: ResourceTimesheetHeaders
│   └── Marcar como synced_to_bc=true
└── timesheet (header_id + synced_to_bc=false)
    ├── Insertar en BC: insertlines API
    └── Marcar como synced_to_bc=true
```

### 🎯 Casos de Uso

- **Sincronización manual** de timesheets pendientes
- **Integración bidireccional** completa del sistema
- **Reemplazo del script Python** con workflow n8n
- **Monitoreo visual** del proceso de sincronización

---

**Nota:** Este workflow complementa el 001_sincronizacion_completa.json para tener sincronización bidireccional completa.
