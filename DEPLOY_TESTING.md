# Guía de Despliegue en Testing

## Información del Servidor

- **URL:** https://testingapp.powersolution.es/my-timesheet-app/
- **IP:** 192.168.88.68
- **Usuario:** dbertona
- **Directorio local:** /home/dbertona/timesheet/
- **Contenedor Docker:** timesheet-web-1
- **Directorio del contenedor:** /usr/share/nginx/html/

## Proceso de Despliegue (robusto con subruta)

### 1. Preparación (Desarrollo)

```bash
# Verificar que el servidor de desarrollo funciona
npm run dev
# Verificar en: http://localhost:5173/
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

### 4. Variables de entorno (Testing)

Crear/editar `.env.testing` en la raíz (puedes usar `testing-config/env.testing.example` como plantilla):

```env
VITE_BASE_PATH=/my-timesheet-app/
VITE_MSAL_REDIRECT_URI=https://testingapp.powersolution.es/my-timesheet-app/
VITE_MSAL_POSTLOGOUT=https://testingapp.powersolution.es/my-timesheet-app/
```

### 5. Build de Producción

```bash
# Generar build de producción
npm run build
```

**Nota:** La aplicación ahora incluye un servidor Node.js para la API de fecha del servidor. El servidor debe ejecutarse en el puerto 3001 para que la funcionalidad de fecha del servidor funcione correctamente.

### 6. Empaquetado

```bash
# Crear archivo comprimido con los archivos de producción
tar -czf my-timesheet-app-v0.1.4.tar.gz -C dist .
```

### 7. Transferencia al Servidor

```bash
# Subir archivo al servidor
scp my-timesheet-app-v0.1.4.tar.gz dbertona@192.168.88.68:/home/dbertona/timesheet/
```

### 8. Despliegue en el Servidor (subruta fija)

```bash
# Conectar al servidor
ssh dbertona@192.168.88.68

# Navegar al directorio
cd /home/dbertona/timesheet/

# Extraer archivos (sobrescribir existentes)
tar -xzf my-timesheet-app-v0.1.4.tar.gz

# Copiar build a la subruta del contenedor (sin duplicar en raíz)
BASE_PATH="/usr/share/nginx/html/my-timesheet-app"
rm -rf "$BASE_PATH"/* || true
mkdir -p "$BASE_PATH"
cp -f index.html vite.svg "$BASE_PATH"/
mkdir -p "$BASE_PATH/assets" && cp -r assets/* "$BASE_PATH/assets/"

# Limpiar archivos temporales
rm my-timesheet-app-v0.1.4.tar.gz

# Salir del servidor
exit
```

### 8. Limpieza Local

```bash
# Eliminar archivo temporal local
rm my-timesheet-app-v0.1.4.tar.gz
```

### 9. Verificación (smoke)

- **URL de testing:** https://testingapp.powersolution.es/my-timesheet-app/
- **Assets:** 200 y `Content-Type: application/javascript` para `assets/index-*.js`
- **Rutas profundas:** `.../aprobacion`, `.../editar-parte`, `.../lines/rejected` responden 200 tras refresco duro
- **MSAL:** `redirect_uri` contiene `/my-timesheet-app/`

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
ops/testing/smoke.sh
```

## Notas Importantes

1. **`VITE_BASE_PATH` debe ser /my-timesheet-app/** en testing. En local/prod usar `/`.
2. **MSAL**: `VITE_MSAL_REDIRECT_URI` y `VITE_MSAL_POSTLOGOUT` deben incluir la subruta.
3. **Nginx** sirve desde `/usr/share/nginx/html/my-timesheet-app` con fallback a `index.html`.
4. **Incrementar la versión** en `package.json` antes de desplegar.
5. **Refresco duro** tras deploy (Ctrl+F5) y ejecutar el smoke.

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

### Sí hay errores de permisos

```bash
# Verificar permisos en el servidor
ssh dbertona@192.168.88.68 "ls -la /home/dbertona/timesheet/"
```

### Si el contenedor no responde

```bash
# Reiniciar el contenedor
ssh dbertona@192.168.88.68 "docker restart timesheet-web-1"
```
