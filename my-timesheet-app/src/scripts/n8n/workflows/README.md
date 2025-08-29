# 📋 Workflows de n8n - My Timesheet App

Este directorio contiene todos los workflows de n8n utilizados para la sincronización entre Business Central y Supabase.

## 🚀 Workflows Disponibles

### 1. **Sincronización Completa BC → Supabase**

- **Archivo:** `001_sincronizacion_completa.json`
- **ID en n8n:** `rDSrPE4U9zNGRaJi`
- **Nombre en n8n:** `001_sincronizacion_completa`
- **Estado:** Inactivo
- **Descripción:** Workflow principal que sincroniza todos los datos de Business Central a Supabase

#### **Funcionalidades:**

- **Proyectos:** Obtiene y sincroniza proyectos desde BC
- **Tareas:** Obtiene y sincroniza tareas de proyectos desde BC
- **Equipos:** Obtiene y sincroniza equipos asignados a proyectos desde BC
- **Recursos:** Obtiene y sincroniza recursos (empleados) desde BC
- **Costos:** Obtiene y sincroniza costos de recursos desde BC
- **Calendario:** Obtiene y sincroniza días de calendario desde BC

#### **Nodos del Workflow:**

1. **Trigger Manual** - Inicia la sincronización
2. **6 Nodos HTTP** - Obtienen datos de las APIs de BC
3. **6 Nodos de Transformación** - Procesan y formatean los datos
4. **6 Nodos Supabase** - Actualizan la base de datos

## 🔧 Configuración Requerida

### **Credenciales Business Central:**

- **OAuth2 API** configurado para acceder a las APIs de BC
- **URLs de API** configuradas para cada entidad

### **Credenciales Supabase:**

- **API Key** configurada para acceder a la base de datos
- **Tablas** configuradas con la estructura correcta

## 📊 Estructura de Datos

### **Tablas Supabase:**

- `job` - Proyectos
- `job_task` - Tareas de proyectos
- `job_team` - Equipos asignados a proyectos
- `resource` - Recursos/Empleados
- `resource_cost` - Costos de recursos
- `calendar_period_days` - Días de calendario

## 🚀 Uso

### **Ejecutar Sincronización:**

1. Acceder a n8n: https://n8n.powersolution.es
2. Ir al workflow "001_sincronizacion_completa"
3. Hacer clic en "Execute workflow"

### **Programar Sincronización:**

- Configurar trigger cron para ejecución automática
- Recomendado: Cada hora o según necesidades del negocio

## 📝 Notas de Desarrollo

### **Versiones:**

- **v1.0** - Workflow inicial restaurado desde la base de datos
- **v1.1** - Configuración de credenciales y pruebas

### **Próximas Mejoras:**

- [ ] Agregar campo `company_name` para soporte multi-empresa
- [ ] Implementar manejo de errores y reintentos
- [ ] Agregar logging y monitoreo
- [ ] Optimizar rendimiento para grandes volúmenes de datos

## 🔍 Troubleshooting

### **Problemas Comunes:**

1. **Error de autenticación OAuth2** - Verificar credenciales de BC
2. **Error de conexión Supabase** - Verificar API key y configuración
3. **Datos no sincronizados** - Verificar estructura de datos en BC

### **Logs:**

- Revisar logs de ejecución en n8n
- Verificar respuestas de las APIs de BC
- Monitorear actualizaciones en Supabase

## 📚 Referencias

- [Documentación n8n](https://docs.n8n.io/)
- [API Business Central](https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/)
- [API Supabase](https://supabase.com/docs/reference/javascript/introduction)
