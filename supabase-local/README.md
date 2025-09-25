# Supabase Local para My Timesheet App

Este directorio contiene la configuración para ejecutar Supabase localmente usando Docker, permitiendo migrar la base de datos desde Supabase Cloud a un entorno local controlado.

## 🏗️ Arquitectura

- **PostgreSQL**: Base de datos principal
- **Supabase Studio**: Dashboard web para administración
- **Kong**: API Gateway
- **Auth**: Servicio de autenticación
- **REST API**: API REST (PostgREST)
- **Realtime**: WebSockets para actualizaciones en tiempo real
- **Storage**: Almacenamiento de archivos
- **Functions**: Edge Functions

## 🚀 Despliegue

### 1. Desplegar en la VM

```bash
# Ejecutar el script de despliegue
./deploy-to-vm.sh
```

Este script:
- Copia todos los archivos necesarios a la VM
- Inicia los contenedores de Docker
- Verifica que los servicios estén funcionando

### 2. Migrar datos

```bash
# Conectar a la VM y ejecutar migración
ssh root@192.168.88.68
cd /opt/timesheet-supabase
./migrate-data.sh
```

Este script:
- Hace backup de todos los datos de Supabase Cloud
- Limpia la base de datos local
- Migra todos los datos a Supabase local

## 🔧 Configuración

### Variables de entorno

Copia `env.local.example` a `.env.local` en el directorio raíz del proyecto:

```bash
cp supabase-local/env.local.example .env.local
```

### URLs de acceso

- **API**: http://192.168.88.68:8000
- **Studio**: http://192.168.88.68:3000
- **Auth**: http://192.168.88.68:8000/auth/v1
- **Storage**: http://192.168.88.68:8000/storage/v1

## 📊 Estructura de la base de datos

### Tablas principales

- `resource`: Empleados/recursos
- `job`: Proyectos/trabajos
- `job_task`: Tareas de proyectos
- `job_team`: Equipos de trabajo
- `resource_cost`: Costos de recursos
- `resource_timesheet_header`: Cabeceras de partes de trabajo
- `timesheet`: Líneas de partes de trabajo
- `calendar_period_days`: Días del calendario
- `sync_state`: Estado de sincronización

### Características

- **RLS habilitado**: Row Level Security en todas las tablas
- **Índices optimizados**: Para mejorar rendimiento
- **Políticas básicas**: Acceso completo para desarrollo
- **UUIDs**: Para claves primarias donde corresponde

## 🔄 Migración

### Backup automático

El script de migración crea backups automáticos en `backups/` con timestamp:
- `backup_resource_20250124_143022.json`
- `backup_job_20250124_143022.json`
- etc.

### Orden de migración

Los datos se migran en el orden correcto de dependencias:
1. `resource` (sin dependencias)
2. `job` (sin dependencias)
3. `job_task` (depende de `job`)
4. `job_team` (depende de `job` y `resource`)
5. `resource_cost` (depende de `resource`)
6. `calendar_period_days` (sin dependencias)
7. `resource_timesheet_header` (depende de `resource`)
8. `timesheet` (depende de `resource_timesheet_header`)
9. `sync_state` (sin dependencias)

## 🧪 Pruebas

### Verificar servicios

```bash
# Verificar que la API funciona
curl http://192.168.88.68:8000/rest/v1/

# Verificar que Studio funciona
curl http://192.168.88.68:3000
```

### Verificar datos

1. Abrir Studio: http://192.168.88.68:3000
2. Navegar a "Table Editor"
3. Verificar que todas las tablas tienen datos

## 🛠️ Mantenimiento

### Logs

```bash
# Ver logs de todos los servicios
ssh root@192.168.88.68 "cd /opt/timesheet-supabase && docker compose logs"

# Ver logs de un servicio específico
ssh root@192.168.88.68 "cd /opt/timesheet-supabase && docker compose logs postgres"
```

### Reiniciar servicios

```bash
ssh root@192.168.88.68 "cd /opt/timesheet-supabase && docker compose restart"
```

### Parar servicios

```bash
ssh root@192.168.88.68 "cd /opt/timesheet-supabase && docker compose down"
```

## 🔒 Seguridad

### Claves JWT

Las claves JWT están configuradas para desarrollo local. En producción:
1. Generar claves JWT seguras
2. Actualizar en `docker-compose.yml`
3. Actualizar en `kong.yml`
4. Regenerar tokens de API

### Políticas RLS

Las políticas actuales permiten acceso completo. En producción:
1. Revisar y ajustar políticas RLS
2. Implementar autenticación por empresa
3. Restringir acceso según roles

## 📝 Notas

- Los datos se almacenan en volúmenes Docker persistentes
- La configuración está optimizada para desarrollo
- Se puede escalar horizontalmente según necesidades
- Compatible con Supabase Cloud para migración bidireccional



