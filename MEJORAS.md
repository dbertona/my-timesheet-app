# Plan de mejoras y estado

Marca de verificación [x] = aplicado, [ ] = pendiente, [~] = parcial.

## Implementado

- [x] Reordenar columnas (Fecha antes que Cantidad) y consistencia de cabeceras/filas
- [x] Alineación adaptativa calendario ↔ tabla (padding derecho dinámico)
- [x] Autosave por línea (blur/Enter/Tab), UI tipo BC; eliminar botón “Guardar todos”
- [x] Enter navega como Tab entre campos
- [x] Toasts (react-hot-toast) en lugar de alert nativo
- [x] React Query: líneas, proyectos, tareas, tipos de trabajo; prefetch de tareas
- [x] React Query Devtools en modo desarrollo
- [x] DecimalInput: 2 decimales, acepta coma y punto
- [x] DateInput: semana empieza en lunes; filtro de festivos correcto
- [x] Tarjeta de resumen (Requeridas/Imputadas/Faltan) junto al calendario
- [x] Virtualización de listas en Project/Task; loader en dropdowns
- [x] Cierre de combos al perder el foco
- [x] Mensajes de error inline (píldora compacta)
- [x] Corrección de orden de Hooks en combos (estabilidad)
- [x] Refactor calendario: `useCalendarData` + `CalendarPanel`
- [x] Code‑splitting: lazy de `react-datepicker` + `manualChunks` en Vite
- [x] Base de textos en español en nuevas piezas (parcial)

## Pendiente (prioridad sugerida)

- [ ] React Query tuning: `staleTime`/`gcTime` por recurso; invalidaciones finas; `select` para modelar datos
- [ ] Autosave avanzado: guardar solo campos cambiados; dedupe/batching; retry/backoff; indicador “Guardando…” por línea/celda
- [ ] Dropdown UX: debounce (≈100ms) del filtro; cerrar con Escape; resaltar ítem activo; Home/End y PageUp/Down; atributos ARIA
- [ ] Tabla: memo de filas/celdas para reducir renders; windowing de la tabla si hay muchas líneas
- [ ] i18n completa: auditar toasts/placeholders/tooltips y centralizar textos ES
- [ ] Validación: extraer reglas diarias a hook dedicado con tests (`useDailyValidation`)
- [ ] ErrorBoundary alrededor de celdas/combos para aislar fallos
- [ ] Rendimiento: lazy adicional en componentes pesados; reducir footprint de `react-icons`
- [ ] Datos/Supabase: revisar índices; `select` de columnas mínimas; paginación en listas grandes
- [ ] Calidad: hooks pre‑commit (ESLint/Prettier); tests unitarios a `utils` y hooks clave
- [ ] Observabilidad: integrar Sentry (solo producción)
- [ ] Virtualización en “Tipo trabajo” si la lista crece

## Cómo usar este archivo

- Actualiza los ítems al completar tareas (cambia [ ] → [x]).
- Puedes añadir notas bajo cada punto si hay decisiones o follow‑ups.
- Si cambian prioridades, reordena la sección “Pendiente”.
