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

## 🔥 Workflow de Warmup: 000_warmup_credentials_simple.json

**Estado:** ✅ **ACTIVO - Calentamiento de credenciales OAuth2**
**Funcionalidad:** Activa credenciales OAuth2 antes de los workflows principales
**Total de nodos:** 4
**ID en n8n:** n9ipjJzVhD2iFVzD

### 📋 Propósito del Warmup

Este workflow resuelve el problema de credenciales OAuth2 "dormidas" en n8n:

- **Problema:** Después de reinicios o inactividad, las credenciales OAuth2 fallan
- **Solución:** Llamadas HTTP simples para "despertar" las credenciales
- **Resultado:** Los workflows principales funcionan sin errores de autenticación

### 🔧 Nodos del Workflow

1. **Cron Trigger - 6:45 AM** → Ejecución automática diaria
2. **Warmup - Companies BC** → GET /companies (endpoint básico)
3. **Warmup - Proyectos Sample BC** → GET /Proyectos?$top=1 (muestra de datos)
4. **Credenciales Activadas** → Confirmación de éxito

### ⏰ Programación

- **Ejecución:** 6:45 AM (15 minutos antes del workflow principal)
- **Duración:** ~2-3 segundos
- **Frecuencia:** Diaria automática

### 💡 Ventajas de la Versión Simplificada

- **Eficiencia:** Solo 2 llamadas HTTP en lugar de 6
- **Velocidad:** Ejecución más rápida
- **Mantenimiento:** Menos nodos = menos complejidad
- **Funcionalidad:** Misma efectividad para activar credenciales

## 🔄 Workflow Bidireccional: 002_sync_supabase_to_bc.json

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

### 🔗 Webhook (Producción)

- URL de producción: `https://n8n.powersolution.es/webhook/ejecutar-sync-bc`
- Método: `POST`
- Cuerpo esperado (ejemplo): `{}`
- Importante: No usar la URL de test (`/webhook-test/...`) en entornos reales.

## 🏢 Configuración multi-empresa en Supabase (`company_name`)

Para soportar múltiples empresas y aislar datos por compañía, se agregó la columna `company_name` a las tablas de destino en Supabase y se crearon índices/únicos compuestos. Pasos básicos (ejemplo para `job`):

```sql
-- 1) Columna y backfill
ALTER TABLE public.job ADD COLUMN IF NOT EXISTS company_name text;
UPDATE public.job
SET company_name = 'Power Solution Iberia SL'
WHERE company_name IS NULL OR company_name = '';

-- 2) Restricción NOT NULL
ALTER TABLE public.job ALTER COLUMN company_name SET NOT NULL;

-- 3) Índices
CREATE INDEX IF NOT EXISTS idx_job_company_name ON public.job (company_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_job_company_name_no ON public.job (company_name, no);
```

Repetir adaptando claves únicas por tabla:

- `calendar_period_days`: `UNIQUE (company_name, calendar_code, date)`
- `job`: `UNIQUE (company_name, no)`
- `job_task`: `UNIQUE (company_name, job_no, job_task_no)`
- `job_team`: `UNIQUE (company_name, job_no, resource_no)`
- `resource`: `UNIQUE (company_name, no)`
- `resource_cost`: `UNIQUE (company_name, resource_no, starting_date)`
- `resource_timesheet_header`: `UNIQUE (company_name, id)`
- `timesheet`: `UNIQUE (company_name, id)`

Notas:

- Todos los nodos de n8n incluyen `company_name` en transformaciones y filtros.
- La empresa actual por defecto es `Power Solution Iberia SL`.
