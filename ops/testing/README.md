Testing: despliegue y recuperación sin esfuerzo

Resumen
- Backend Node (Express) servido por `systemd` en `192.168.88.68` puerto 3001
- Frontend (dist) servido por Nginx del contenedor `timesheet-web-1` y proxy de Home Assistant
- Multi-empresa Factorial: variables `FACTORIAL_API_KEY` (A) y `FACTORIAL_API_KEY_B` (B)

Requisitos en el servidor (Debian/Ubuntu)
- Node.js 18.x
- systemd, curl, tar, unzip
- Usuario `dbertona` con `sudo`

Variables necesarias (systemd env file)
- `FACTORIAL_API_BASE` (ej.: https://api.factorialhr.com/api/2025-07-01)
- `FACTORIAL_API_KEY` (Empresa A)
- `FACTORIAL_API_KEY_B` (Empresa B)
- `SUPABASE_PROJECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY` o `SUPABASE_ANON_KEY`
- `PORT` (por defecto 3001)

Archivos incluidos
- `server/systemd/timesheet-backend.service`: Unidad systemd
- `server/env/timesheet-backend.env.example`: Plantilla de entorno
- `deploy.sh`: Compila, empaqueta y despliega al servidor (backend + dist)

Uso rápido
1) En tu máquina local, desde la raíz del repo:
```
bash ops/testing/deploy.sh \
  --host 192.168.88.68 \
  --user dbertona \
  --remote-dir /home/dbertona/timesheet
```
Opcional: exporta `SUDO_PASSWORD` para que el script pueda instalar/recargar systemd sin pedir password:
```
export SUDO_PASSWORD='TU_PASSWORD_SUDO'
```

Qué hace `deploy.sh`
- `npm ci` y `npm run build`
- Empaqueta `dist/`, `server.js`, `package.json`, `package-lock.json`
- Copia al servidor y extrae en `/home/dbertona/timesheet`
- Ejecuta `npm ci --omit=dev` en el servidor
- Instala/actualiza `timesheet-backend.service` y reinicia el servicio

Recuperación rápida (si el servidor quedó vacío)
```
ssh dbertona@192.168.88.68 'mkdir -p /home/dbertona/timesheet'
bash ops/testing/deploy.sh --host 192.168.88.68 --user dbertona --remote-dir /home/dbertona/timesheet
```

Verificación
```
curl -sS https://testingapp.powersolution.es/api/server-date
curl -sS -X POST 'https://testingapp.powersolution.es/api/factorial/vacations' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"dbertona@powersolution.es","startDate":"2025-09-01","endDate":"2025-09-30"}'
```

Notas
- El proxy principal lo gestiona Home Assistant; no modificamos su configuración desde este repo.
- Si necesitas servir `dist/` localmente, puedes montar un Nginx simple o usar `npx serve dist`.

# Operaciones - Entorno de Testing

Este directorio contiene la configuración versionada (Infrastructure-as-Code) para desplegar y operar el entorno de testing.

## Estructura

```
ops/testing/
├── README.md
├── deploy.sh                    # Script end-to-end de despliegue a testing
├── rollback.md                  # Pasos de rollback rápido
├── nginx/
│   └── default.conf             # Plantilla de Nginx dentro del contenedor web
└── server/
    ├── env/
    │   └── timesheet-backend.env.example  # Variables de entorno (sin secretos)
    └── systemd/
        └── timesheet-backend.service      # Unit de systemd (plantilla)
```

## Variables requeridas

Rellenar en el servidor `/etc/default/timesheet-backend` (no versionado) a partir de `server/env/timesheet-backend.env.example`:

```
FACTORIAL_API_BASE=https://api.factorialhr.com/api/2025-07-01
FACTORIAL_API_KEY=<TU_API_KEY>
PORT=3001
```

## Despliegue (host de testing)

1. Generar build local y empaquetar (desde tu máquina):

```
npm run build
TS=$(date +%Y%m%d_%H%M%S)
tar -czf my-timesheet-app-$TS.tar.gz -C dist .
scp my-timesheet-app-$TS.tar.gz server.js dbertona@192.168.88.68:/home/dbertona/timesheet/
```

2. Actualizar estáticos en contenedor Nginx y reiniciar backend (en servidor):

```
cd /home/dbertona/timesheet
tar -xzf my-timesheet-app-*.tar.gz
tar -czf timesheet-update.tar.gz index.html assets/ 404.html vite.svg
docker cp timesheet-update.tar.gz timesheet-web-1:/tmp/
docker exec timesheet-web-1 sh -c 'cd /usr/share/nginx/html && tar -xzf /tmp/timesheet-update.tar.gz && rm /tmp/timesheet-update.tar.gz'
rm -f timesheet-update.tar.gz my-timesheet-app-*.tar.gz

# Reinicio backend gestionado por systemd
sudo systemctl restart timesheet-backend
```

3. Verificación rápida:

```
curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5
curl -i -sS -X POST 'https://testingapp.powersolution.es/api/factorial/vacations' \
  -H 'Content-Type: application/json' \
  --data '{"userEmail":"dbertona@powersolution.es","startDate":"2025-09-01","endDate":"2025-09-30"}'
```

## Nginx (contenedor web)

La plantilla `nginx/default.conf` sirve los estáticos en `/my-timesheet-app/` con soporte SPA (fallback a `index.html`). Copiarla al contenedor en `/etc/nginx/conf.d/default.conf` cuando se requiera restauración.

## Proxy en Home Assistant

Documentado en `nginx/home-assistant-proxy.md` (ubicación y cabeceras recomendadas). No incluir credenciales ni secretos aquí.

## Versionado y tags

- Usar tags semánticos para testing: `testing/vX.Y.Z`.
- Mantener un breve changelog de operaciones en este README o en commits.
