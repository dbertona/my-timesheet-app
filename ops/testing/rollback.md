# Rollback rápido en testing

1. Conectarse al servidor

```
ssh dbertona@192.168.88.68
cd /home/dbertona/timesheet
```

2. Restaurar artefacto anterior (reemplazar por el tar deseado)

```
tar -xzf my-timesheet-app-YYYYMMDD_HHMMSS.tar.gz

# Empaquetar y copiar al contenedor web
tar -czf timesheet-update.tar.gz index.html assets/ 404.html vite.svg
docker cp timesheet-update.tar.gz timesheet-web-1:/tmp/
docker exec timesheet-web-1 sh -c 'cd /usr/share/nginx/html && tar -xzf /tmp/timesheet-update.tar.gz && rm /tmp/timesheet-update.tar.gz'
rm -f timesheet-update.tar.gz
```

3. Reiniciar backend gestionado por systemd

```
sudo systemctl restart timesheet-backend
```

4. Verificación

```
curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5
```
