# 🔑 Claves API del Proyecto

Este archivo documenta todas las claves API y credenciales utilizadas en el proyecto.

## ⚠️ IMPORTANTE

- **NUNCA** commitees este archivo con claves reales
- **SÍEMPRE** usa placeholders en el código
- **MANTÉN** las claves reales en variables de entorno o archivos `.env` locales

---

## 🌐 Business Central (Dynamics 365)

### **OAuth2 Credentials**

- **Client ID:** `64898aa0-1f14-46ab-8283-74161f5e3cb2`
- **Client Secret:** `amzn1.oa2-cs.v1.af8a9f7e8726fdcb46593c8fa0db80f850c6e8a195bb482e4ec9856b384379b6`
- **Tenant ID:** `a18dc497-a8b8-4740-b723-65362ab7a3fb`
- **Environment:** `Pruebas_PS`
- **Company ID:** `ca9dc1bf-54ee-ed11-884a-000d3a455d5b`

### **API Endpoints**

- **Base URL:** `https://api.businesscentral.dynamics.com/v2.0/a18dc497-a8b8-4740-b723-65362ab7a3fb/Pruebas_PS/api/Power_Solution/PS_API/v2.0/companies(ca9dc1bf-54ee-ed11-884a-000d3a455d5b)`
- **Proyectos:** `/Proyectos`
- **Tareas:** `/ProyectosTareas`
- **Equipos:** `/ProyectosEquipos`
- **Recursos:** `/Recursos`
- **Costos:** `/RecursosCostos`
- **Calendario:** `/CalendaroPeriodosDias`
- **Resource Timesheet Headers:** `/ResourceTimesheetHeaders` (Power Solution API - puede no estar disponible)

---

## 🗄️ Supabase

### **Database Credentials**

- **Project URL:** `https://qfpswxjunoepznrpsltt.supabase.co`
- **API Key (anon):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4`
- **API Key (service_role):** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ`
- **Database Password:** `[SUPABASE_DB_PASSWORD]` - Configurar en Supabase

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
- **API Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiODAyYjRjYy04ZjVjLTQ2MDgtOWFlYy1lNDRhYmZmOGJmNWQiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2NDU2NDMwfQ.PWw4-5Yr7FuL_RH6gibc4JHDOThHkkL67j_9UA3Vs70`
- **Username:** `dbertona@powersolution.es`
- **Password:** `n8n_admin_2024`

### **Workflows**

- **Id Principal:** `rDSrPE4U9zNGRaJi`
- **Nombre:** `001_sincronizacion_completa`

---

## 🔧 Variables de Entorno (.env)

```bash
# Business Central
BC_CLIENT_ID=64898aa0-1f14-46ab-8283-74161f5e3cb2
BC_CLIENT_SECRET=amzn1.oa2-cs.v1.af8a9f7e8726fdcb46593c8fa0db80f850c6e8a195bb482e4ec9856b384379b6
BC_TENANT_ID=a18dc497-a8b8-4740-b723-65362ab7a3fb

# Supabase
SUPABASE_PROJECT_URL=https://qfpswxjunoepznrpsltt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NzEwNzksImV4cCI6MjA2OTQ0NzA3OX0.d78PxMnKsipdse_ozBSwTrEMs354rIvayh4lXE1LMW4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHN3eGp1bm9lcHpucnBzbHR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg3MTA3OSwiZXhwIjoyMDY5NDQ3MDc5fQ.PxpfuFsfvpeEPHCEiWhRn0SD1WxngTAEppJ-65QTTOQ

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

- **Responsable:** Daniel Bertona Sánchez
- **Email:** dbertona@powersolution.es
- **Proyecto:** My Timesheet App
- **Última actualización:** 29 de agosto, 2025
