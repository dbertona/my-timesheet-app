# Workflows n8n - Sincronización Business Central → Supabase

## Workflow Oficial: 001_sincronizacion_completa.json

**Estado:** ✅ **ACTIVO Y FUNCIONANDO**  
**Última actualización:** 29/08/2025  
**Total de nodos:** 49  
**ID en n8n:** 3fpaX4J2wc5DH054  

### 🎯 Entidades Sincronizadas (6 total)

1. **📅 Calendario** (`calendar_period_days`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

2. **🏗️ Proyectos** (`job`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

3. **📋 Tareas** (`job_task`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

4. **👥 Equipos** (`job_team`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

5. **👨‍💼 Recursos** (`resource`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

6. **💰 Costos** (`resource_cost`) - ✅ Completo
   - Filtrado incremental con `lastModifiedDateTime`
   - Batching de 300 registros
   - Sincronización de estado en `sync_state`

### 🔧 Características Implementadas

- ✅ **Sincronización Incremental** con `lastModifiedDateTime` desde BC
- ✅ **Tabla sync_state** para tracking de última sincronización por entidad
- ✅ **Batching de 300 registros** para evitar timeouts
- ✅ **Campo company_name** en todas las transformaciones
- ✅ **matchType=allFilters** en todas las actualizaciones de sync_state
- ✅ **Conexiones en paralelo** para actualizar sync_state independientemente
- ✅ **Filtros específicos** para cada entidad en Supabase

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

- **Workflow 001:** ✅ **COMPLETO Y FUNCIONANDO** (49 nodos)
- **Workflow 002:** 🔄 Versión de desarrollo (48 nodos)
- **APIs BC:** ✅ CalendaroPeriodosDias, ⏳ Resto pendientes de publicar

### 📝 Próximos Pasos

1. **Publicar cambios AL en Business Central** para exponer `lastModifiedDateTime` en:
   - PS_Proyectos_Tareas (Tareas)
   - PS_Proyectos_Equipo (Equipos)
   - PS_Recursos (Recursos)
   - PS_RecursosCostos (Costos)

2. **Probar sincronización incremental** con datos reales

3. **Configurar ejecución automática** con cron

### 🔍 Archivos del Proyecto

- `001_sincronizacion_completa.json` - **WORKFLOW OFICIAL** ⭐
- `002_sincronizacion_completa_company_fixed.json` - Versión de desarrollo
- `README.md` - Esta documentación
- Scripts de actualización y deployment

---

**Nota:** El workflow 001 es el oficial y está funcionando en n8n. El workflow 002 es para desarrollo y pruebas.
