# Guía de Despliegue en Testing

## Información del Servidor

- **URL:** https://testingapp.powersolution.es/my-timesheet-app/
- **IP:** 192.168.88.68
- **Usuario:** dbertona
- **Directorio local:** /home/dbertona/timesheet/
- **Contenedor Docker:** timesheet-web-1
- **Directorio del contenedor:** /usr/share/nginx/html/

## Proceso de Despliegue

### 1. Preparación (Desarrollo)

```bash
# Verificar que el servidor de desarrollo funciona
npm run dev
# Verificar en: http://localhost:5173/my-timesheet-app/
```

### 2. Incrementar Versión

```bash
# Editar package.json y cambiar la versión
# Ejemplo: de "0.1.3" a "0.1.4"
```

### 3. Commit y Push

```bash
# Hacer commit de todos los cambios
git add .
git commit -m "feat: actualización para testing v0.1.4"
git push origin feat/n8n-smart-delta-upsert
```

### 4. Build de Producción

```bash
# Generar build de producción
npm run build
```

**Nota:** La aplicación ahora incluye un servidor Node.js para la API de fecha del servidor. El servidor debe ejecutarse en el puerto 3001 para que la funcionalidad de fecha del servidor funcione correctamente.

### 5. Empaquetado

```bash
# Crear archivo comprimido con los archivos de producción
tar -czf my-timesheet-app-v0.1.4.tar.gz -C dist .
```

### 6. Transferencia al Servidor

```bash
# Subir archivo al servidor
scp my-timesheet-app-v0.1.4.tar.gz dbertona@192.168.88.68:/home/dbertona/timesheet/
```

### 7. Despliegue en el Servidor

```bash
# Conectar al servidor
ssh dbertona@192.168.88.68

# Navegar al directorio
cd /home/dbertona/timesheet/

# Extraer archivos (sobrescribir existentes)
tar -xzf my-timesheet-app-v0.1.4.tar.gz

# Crear archivo para el contenedor
tar -czf timesheet-update.tar.gz index.html assets/ 404.html vite.svg

# Copiar al contenedor
docker cp timesheet-update.tar.gz timesheet-web-1:/tmp/

# Extraer en el contenedor
docker exec timesheet-web-1 sh -c 'cd /usr/share/nginx/html && tar -xzf /tmp/timesheet-update.tar.gz && rm /tmp/timesheet-update.tar.gz'

# Limpiar archivos temporales
rm timesheet-update.tar.gz my-timesheet-app-v0.1.4.tar.gz

# Salir del servidor
exit
```

### 8. Limpieza Local

```bash
# Eliminar archivo temporal local
rm my-timesheet-app-v0.1.4.tar.gz
```

### 9. Verificación

- **URL de testing:** https://testingapp.powersolution.es/my-timesheet-app/
- **Verificar versión:** Debe aparecer la nueva versión en el dashboard
- **Refrescar navegador:** Ctrl+F5 o Cmd+Shift+R para limpiar caché

## Comandos de Verificación

### Verificar archivos en el servidor

```bash
ssh dbertona@192.168.88.68 "cd /home/dbertona/timesheet && ls -la index.html"
```

### Verificar archivos en el contenedor

```bash
ssh dbertona@192.168.88.68 "docker exec timesheet-web-1 ls -la /usr/share/nginx/html/"
```

### Verificar estado del contenedor

```bash
ssh dbertona@192.168.88.68 "docker ps | grep timesheet"
```

### Verificar respuesta HTTP

```bash
curl -sS https://testingapp.powersolution.es/my-timesheet-app/ | head -n 5
```

## Notas Importantes

1. **Siempre incrementar la versión** antes de desplegar
2. **Verificar en desarrollo** antes de desplegar a testing
3. **El contenedor Docker** es la fuente de verdad para Nginx
4. **Limpiar caché del navegador** después del despliegue
5. **No desplegar sin autorización explícita** del usuario

## Estructura de Archivos

### Local (desarrollo)

```
my-timesheet-app/
├── dist/                    # Build de producción
├── package.json            # Versión de la app
└── vite.config.js          # Configuración de Vite
```

### Servidor (testing)

```
/home/dbertona/timesheet/   # Archivos locales del servidor
└── timesheet-web-1:/usr/share/nginx/html/  # Archivos del contenedor Nginx
```

## Troubleshooting

### Si la versión no se actualiza

1. Verificar que el contenedor tiene los archivos correctos
2. Limpiar caché del navegador
3. Verificar que Nginx está sirviendo desde el contenedor

### Si hay errores de permisos

```bash
# Verificar permisos en el servidor
ssh dbertona@192.168.88.68 "ls -la /home/dbertona/timesheet/"
```

### Si el contenedor no responde

```bash
# Reiniciar el contenedor
ssh dbertona@192.168.88.68 "docker restart timesheet-web-1"
```
