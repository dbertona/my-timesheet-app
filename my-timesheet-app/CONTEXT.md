## Contexto del proyecto (arranque rápido y referencia)

### 1) Arranque local
- Requisitos: Node 18+ (LTS), npm 9+, `gh` opcional (CLI GitHub).
- Variables: copia `.env.example` a `.env` y completa las claves Vite.
- Puerto: Vite debe correr en 5173 con `--strictPort` fijo.

Comandos:
```bash
npm ci
./start-dev.sh
```

Smoke manual:
- Abrir `http://localhost:5173`
- Comprobar Dashboard carga y tarjetas visibles.

### 2) Variables de entorno (Vite)
Definir siempre con prefijo `VITE_`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_ENV` (dev/test/prod)
- `VITE_DEV_PORT` (5173 por convención)

Flags útiles de desarrollo:
- `HUSKY_SKIP=1` para saltar hooks en operaciones puntuales.

Ejemplo `.env` (copiar/pegar en la raíz como `.env`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.DUMMY.DUMMY
VITE_APP_ENV=dev
VITE_DEV_PORT=5173
```

### 3) Scripts y flujo operativo
- `./start-dev.sh`: libera el puerto 5173 (solo `node`/`vite` LISTEN) y arranca Vite con `--port 5173 --strictPort`.
- `scripts/pr-flow.sh`:
  - `open "título" "cuerpo"` abre PR desde la rama actual a `reset/main`.
  - `status` muestra checks.
  - `rerun-ci` relanza CI del PR abierto.
  - `merge` hace merge seguro (no fuerza si checks rojos).
  - `cleanup` limpia ramas tras el merge.
- `scripts/cleanup-branches.sh`: elimina ramas locales mergeadas y remotas seleccionadas; usa `git fetch -p`.
- `scripts/context-dump.sh`: imprime resumen de repo/entorno para soporte.

Requisito de equipo: Se deben usar los comandos de `scripts/pr-flow.sh` para abrir, consultar estado, relanzar CI y fusionar PRs hacia `reset/main`. Evitar usar directamente `git push` a `reset/main` o abrir/fusionar PRs fuera de este flujo.

Convenciones Git/PR:
- Trabajar en rama feature/fix/chore; abrir PR hacia `reset/main`.
- CI se ejecuta en `pull_request` (lint con `--max-warnings=0`, tests).
- No se puede pushear directo a `reset/main` (protegida).
- Tras merge, limpiar ramas locales/remotas (excepto `autosave`, `stable/*` y soporte activo).

Política de PR (unidad funcional):
- Abrir PR por unidad funcional coherente (no por cada microcambio). Objetivo: ≤ ~300 líneas netas, 1–3 archivos relacionados.
- Usar commits atómicos dentro del PR y realizar squash merge.
- Cambios de solo documentación pueden agruparse; el CI puede ignorarlos (ver filtro de paths en CI).

### 4) Lint y tests
- Lint: `npm run lint -- --max-warnings=0`.
- Tests: `npm test` (Vitest + Testing Library). Mocks críticos:
  - `ResizeObserver` (JSDOM) mockeado en tests.
  - MSAL/Supabase: mocks en tests de componentes.
  - Navegación teclado: usar `inputRefs` y espías `focus` en integración.

### 5) UI/Estilos y traducciones
- Botones estilo Business Central con clases `.ts-btn` y variantes (`--primary`, `--secondary`, `--danger`). Fuente Segoe UI; borde 3px.
- Consistencia de UI (sin estilos inline si existe componente equivalente).
- Traducciones: generar/sincronizar XLIFF ante cualquier cambio de textos visibles. Mantener términos:
  - "Horas pendientes de aprobar"
  - "Horas Rechazadas"

<!-- LISTS_GUIDELINES:START -->
### 5.1) Normas de Listas (resumen)
- Contenedor propio `.ts-responsive`; sin scroll global (scroll solo interno).
- Cabeceras centradas y sticky.
- Redimensionar con clamp al contenedor (sin desbordes horizontales).
- Min/Max por columna; columnas fijas: fecha, creado, estado (En BC), acciones.
- Auto-fit por doble clic; botón “Reset layout”.
- Persistencia por usuario (localStorage con clave por email).
- Fechas, iconos, switches y botones centrados (usar `.ts-cell-center`).
- Tabla: `table-layout: fixed; border-collapse: separate; border-spacing: 0`.
- Overflow-x oculto; truncado con elipsis cuando aplique.
- Fuente Segoe UI; botones `.ts-btn` estilo BC (tamaños sobrios).

Fuente: `docs/ui/lists-guidelines.mdc`
<!-- LISTS_GUIDELINES:END -->

### 6) Componentes y rutas relevantes
- `src/components/HomeDashboard.jsx`: tarjetas de dashboard (pendientes de aprobar y rechazadas). Las tarjetas muestran "Horas • Líneas • Partes".
- `src/components/TimesheetLines.jsx`: edición de líneas; columnas `resource_no` y `resource_name` solo en aprobación (prop `showResourceColumns`).
- `src/components/ApprovalPage.jsx`: pasa `showResourceColumns={true}` a `TimesheetLines`.
- `src/constants/timesheetFields.js`: etiquetas: `resource_no` → "Recurso", `resource_name` → "Nombre".

### 7) Consultas de datos (Supabase)
- Filtros clave:
  - Pendientes de aprobar: estado Pending, `synced_to_bc` false o null.
  - Rechazadas: estado Rejected, `synced_to_bc` false o null. Excluir factoriales (`isFactorialLine` verdadera) si corresponde.

### 8) Troubleshooting rápido
- Navegador no conecta (ERR_CONNECTION_REFUSED): verificar que `./start-dev.sh` inició Vite en 5173 y no hay procesos zombie (`lsof -i :5173`).
- `git push` cuelga: salir de watch de Vitest; usar `HUSKY=0 git push` o `--no-verify` (solo de forma puntual).
- CI rojo por lint: eliminar `eslint-disable` innecesarios; corregir warnings hasta 0.
- Tests de texto fallan: usar selectores robustos (regex/callback) cuando el texto se fragmenta.

### 9) Paquete de estado (context-dump)
Ejecutar `scripts/context-dump.sh` para imprimir:
- rama actual, sync con remoto, PR asociado (si `gh` está disponible).
- Versión `package.json`, scripts clave.
- variables requeridas por `.env.example`.

### 10) Buenas prácticas
- Commits pequeños y descriptivos; versión en `package.json` con sufijo `-beta.X` antes de subir a Testing.
- Reutilizar componentes/funciones existentes (DRY). Semanas empiezan en lunes en controles de calendario.

### 11) Despliegue robusto a Testing (subruta)
- Base path por entorno:
  - `VITE_BASE_PATH=/my-timesheet-app/` en testing; `/` en local/prod.
  - Vite usa `VITE_BASE_PATH` como `base`;
  - Router usa `VITE_BASE_PATH` como `basename`;
  - MSAL calcula `redirectUri` y `postLogoutRedirectUri` como `${origin}${VITE_BASE_PATH}` (o se sobreescriben con `VITE_MSAL_*`).
- Nginx sirve SOLO desde `/usr/share/nginx/html/my-timesheet-app/` con fallback SPA a `index.html` y cache immutable para `assets/*`.
- Nginx frontal (Home Assistant) — PROXY /api:
  - El balanceador/proxy de dominio reside en Home Assistant. Debe enrutar todas las llamadas a `/api/*` al backend Node (3001) del servidor de testing.
  - Si usas Nginx Proxy Manager (Add-on): Proxy Host → testingapp.powersolution.es → Custom Location:
    - Location: `/api/*`, Forward Host/IP: `192.168.88.68`, Port: `3001`, Scheme: `http` (Enable websockets).
    - (Opcional) Custom config:
      ```nginx
      proxy_connect_timeout 5s;
      proxy_send_timeout 15s;
      proxy_read_timeout 15s;
      ```
  - Config Nginx equivalente:
    ```nginx
    location /api/ {
      proxy_pass http://192.168.88.68:3001;
      proxy_http_version 1.1;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    ```
  - Importante: este proxy se configura en Home Assistant (no dentro del contenedor web de la app).
- Variables recomendadas en `.env.testing`:
```env
VITE_BASE_PATH=/my-timesheet-app/
VITE_MSAL_REDIRECT_URI=https://testingapp.powersolution.es/my-timesheet-app/
VITE_MSAL_POSTLOGOUT=https://testingapp.powersolution.es/my-timesheet-app/
```
- Despliegue:
```bash
ops/testing/deploy.sh --host 192.168.88.68 --user dbertona
```
  - Limpia y copia build en `/usr/share/nginx/html/my-timesheet-app/`.
  - Reinicia backend y hace verificación inicial.
- Smoke tests manuales/automáticos:
```bash
ops/testing/smoke.sh
# Valida: 200 en base, 200 en asset principal, 200 en rutas profundas
```
- Azure AD: mantener registradas las URIs de redirección con subruta para testing.


