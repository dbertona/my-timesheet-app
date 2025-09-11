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
