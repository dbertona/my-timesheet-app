# Integración Supabase, PostgreSQL y Metabase (LAN 192.168.88.68)

Este documento describe cómo están desplegados y cómo conectar nuestros servicios: Supabase (Timesheet), PS-Analytics (PostgreSQL + PostgREST) y Metabase. Incluye puertos, endpoints, y procedimientos operativos (cambio de contraseñas y conexión desde Metabase).

## Servicios y Puertos

- Timesheet Supabase (REST/Auth/Storage/Realtime via Nginx HA):
  - Proxy HTTPS: `https://testingapp.powersolution.es/supabase` → host `192.168.88.68:8000`
  - REST directo LAN: `http://192.168.88.68:8000/rest/v1/`
  - Studio (Timesheet): `http://192.168.88.68:3003/`
- Timesheet App Backend (Node):
  - API: `http://192.168.88.68:3001/api/`
- PS-Analytics:
  - PostgreSQL: host `192.168.88.68`, puerto `5435`, database `postgres`, usuario `postgres`
  - PostgREST: No disponible actualmente (sin tablas creadas)
- Metabase:
  - UI: `http://192.168.88.68:3000/`
- Supabase Studio Analytics:
  - UI: `http://192.168.88.68:3003/`

Notas:
- En el host hay otros servicios escuchando 5432 (Metabase DB interna) y 5433 (Timesheet PG). PS-Analytics expone su PostgreSQL en 5435.

## Credenciales y variables relevantes

- PS-Analytics PostgreSQL
  - Usuario: `postgres`
  - Contraseña: `e3u2zDnt4mGMJFWA`
  - DB: `postgres`
  - Esquema por defecto: `public`
- Timesheet Supabase (frontend)
  - `VITE_SUPABASE_URL=https://testingapp.powersolution.es/supabase`
  - `VITE_SUPABASE_ANON_KEY=...` (en `.env.testing`)

## Procedimientos operativos

### Cambiar contraseña de PostgreSQL (PS-Analytics)

1. Conectarse al host e invocar dentro del contenedor con rol superusuario:
```bash
ssh root@192.168.88.68 "docker exec ps-analytics-db psql -U supabase_admin -c \"ALTER USER postgres PASSWORD '<NUEVA_CONTRASEÑA>';\""
```
2. Verificar acceso:
```bash
psql -h 192.168.88.68 -p 5435 -U postgres -d postgres -c "SELECT current_user;"
```

### Conectar Metabase a PS-Analytics PostgreSQL

- Tipo: PostgreSQL
- Servidor: `192.168.88.68`
- Puerto: `5435`
- Base de datos: `postgres`
- Usuario: `postgres`
- Contraseña: `e3u2zDnt4mGMJFWA`
- SSL: desactivado
- Schemas: `public` (o los que se creen después)

Connection string (opcional):
```
jdbc:postgresql://192.168.88.68:5435/postgres
```

### Endpoints de verificación rápida

- PostgREST (Timesheet):
```bash
curl -s "http://192.168.88.68:8000/rest/v1/timesheet?limit=1"
```
- Supabase Studio (Timesheet):
```bash
curl -s "http://192.168.88.68:3002/" | head -5
```
- Supabase Studio Analytics:
```bash
curl -s "http://192.168.88.68:3003/" | head -5
```
- Backend Timesheet:
```bash
curl -s "http://192.168.88.68:3001/api/server-date"
```
- Metabase UI:
```bash
curl -s "http://192.168.88.68:3000/" | head -5
```

## Consideraciones de red y puertos

- 5432: ocupado por `metabase-postgres` (DB interna de Metabase)
- 5433: `timesheet-postgres` (Supabase Timesheet)
- 5435: `ps-analytics-db` (PostgreSQL expuesto para Metabase)
- 3001: Backend Node (Timesheet)
- 3002: Supabase Studio (Timesheet)
- 3003: Supabase Studio Analytics

## Troubleshooting

- Error de contraseña en Metabase: confirmar que se usa puerto 5435 y la contraseña actual.
- Si `ps-analytics-db` no expone puerto: recrear contenedor con `-p 5435:5432` o mapear en compose.
- Si 5435 ocupado: usar `ss -tlnp | grep :543` y elegir un puerto libre (5436, 5437, ...).

