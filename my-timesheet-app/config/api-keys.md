# 🔑 Claves API del Proyecto

Este archivo documenta todas las claves API y credenciales utilizadas en el proyecto.

## ⚠️ IMPORTANTE
- **NUNCA** commitees este archivo con claves reales
- **SÍEMPRE** usa placeholders en el código
- **MANTÉN** las claves reales en variables de entorno o archivos `.env` locales

---

## 🌐 Business Central (Dynamics 365)

### **OAuth2 Credentials**
- **Client ID:** `[BC_CLIENT_ID]`
- **Client Secret:** `[BC_CLIENT_SECRET]`
- **Tenant ID:** `[BC_TENANT_ID]`
- **Environment:** `Pruebas_PS`
- **Company ID:** `ca9dc1bf-54ee-ed11-884a-000d3a455d5b`

### **API Endpoints**
- **Base URL:** `https://api.businesscentral.dynamics.com/v2.0/[TENANT_ID]/[ENVIRONMENT]/api/Power_Solution/PS_API/v2.0/companies([COMPANY_ID])`
- **Proyectos:** `/Proyectos`
- **Tareas:** `/ProyectosTareas`
- **Equipos:** `/ProyectosEquipos`
- **Recursos:** `/Recursos`
- **Costos:** `/RecursosCostos`
- **Calendario:** `/CalendaroPeriodosDias`

---

## 🗄️ Supabase

### **Database Credentials**
- **Project URL:** `[SUPABASE_PROJECT_URL]`
- **API Key (anon):** `[SUPABASE_ANON_KEY]`
- **API Key (service_role):** `[SUPABASE_SERVICE_ROLE_KEY]`
- **Database Password:** `[SUPABASE_DB_PASSWORD]`

### **Tables**
- `job` - Proyectos
- `job_task` - Tareas de proyectos
- `job_team` - Equipos asignados a proyectos
- `resource` - Recursos/Empleados
- `resource_cost` - Costos de recursos
- `calendar_period_days` - Días de calendario

---

## ⚡ N8N

### **API Access**
- **URL:** `https://n8n.powersolution.es`
- **API Key:** `[N8N_API_KEY]`
- **Username:** `dbertona@powersolution.es`
- **Password:** `[N8N_PASSWORD]`

### **Workflows**
- **ID Principal:** `rDSrPE4U9zNGRaJi`
- **Nombre:** `001_sincronizacion_completa`

---

## 🔧 Variables de Entorno (.env)

```bash
# Business Central
BC_CLIENT_ID=your_client_id
BC_CLIENT_SECRET=your_client_secret
BC_TENANT_ID=your_tenant_id

# Supabase
SUPABASE_PROJECT_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# N8N
N8N_API_KEY=your_api_key
N8N_PASSWORD=your_password
```

---

## 📋 Checklist de Configuración

### **Business Central**
- [ ] OAuth2 App registrada en Azure AD
- [ ] Permisos configurados para las APIs
- [ ] Credenciales probadas

### **Supabase**
- [ ] Proyecto creado
- [ ] Tablas creadas con estructura correcta
- [ ] RLS (Row Level Security) configurado
- [ ] API keys generadas

### **N8N**
- [ ] Instancia desplegada
- [ ] API key generada
- [ ] Credenciales BC configuradas
- [ ] Credenciales Supabase configuradas
- [ ] Workflow activado

---

## 🚨 Seguridad

### **Buenas Prácticas**
1. **Rotar claves** regularmente
2. **Usar variables de entorno** en producción
3. **Limitar permisos** al mínimo necesario
4. **Monitorear uso** de las APIs
5. **Backup seguro** de credenciales

### **Archivos a NO committear**
- `.env`
- `config/api-keys.md` (con claves reales)
- Cualquier archivo con credenciales hardcodeadas

---

## 📞 Contacto

- **Responsable:** Daniel Bertona Sanchez
- **Email:** dbertona@powersolution.es
- **Proyecto:** My Timesheet App
- **Última actualización:** 29 de Agosto, 2025
