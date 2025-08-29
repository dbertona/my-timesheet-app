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
