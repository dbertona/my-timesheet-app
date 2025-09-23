### Piloto Context7 para `my-timesheet-app`

Objetivo: reducir ≥20% el tiempo de localizar código/estilos/rutas y alcanzar ≥85% de precisión en respuestas contextuales, con acceso SOLO LECTURA al repo.

#### 1) Preparar credenciales (GitHub PAT Fine‑grained)
- Crea un token Fine‑grained en GitHub.
- Repository access: “Only select repositories” → selecciona `my-timesheet-app`.
- Permissions (solo):
  - Repository contents: Read‑only
  - Metadata: Read‑only
- Copia el token (PAT) — úsalo solo en Context7. No lo pegues en otros sitios.

#### 2) Configurar Context7 (MCP) [context7.com]
- Accede a `https://context7.com/` y crea un “proyecto/servidor” llamado `my-timesheet-app`.
- Añade conector GitHub y pega el PAT anterior.
- Limita la fuente al repositorio `my-timesheet-app`.
- Exclusiones recomendadas (para precisión y seguridad):
  - `node_modules/`, `dist/`, `.history/`, `backup*/`, `*.tar.gz`, `*.zip`
- Guarda la URL del servidor MCP y el token de Context7 (lo necesitarás en Cursor).

#### 3) Añadir Context7 a Cursor (MCP Server)
- En Cursor: Command Palette → “Manage MCP Servers” → “Add”.
- Nombre: `Context7 (my-timesheet-app)`.
- URL del servidor MCP y token de Context7.
- Test de conexión. Guarda.

#### 4) Prueba rápida de valor
Ejecuta estas preguntas en Cursor (una por una) y registra tiempos y aciertos (usa `docs/context7/METRICS.csv`):
1) ¿Dónde se bloquea la edición de líneas Rejected y cómo se omiten en navegación?
2) ¿Dónde se abre el modal de reabrir y cómo se muestra el “Motivo del rechazo”?
3) ¿Dónde se define `TIMESHEET_FIELDS` y el índice de `work_type`?
4) ¿Qué componente ajusta altura/scroll de la tabla de líneas al entrar desde `/mis-partes`?
5) ¿Dónde se computa `isReadOnly` y cómo se propaga a `TimesheetLines`?
6) ¿Qué rutas sirven `/mis-partes`, `/edit/:id`, `/lines/rejected`?
7) ¿Dónde están los estilos de botones `.ts-btn` y variantes?
8) ¿Dónde se evita crear línea vacía en modo read‑only?
9) ¿Qué columnas/filas se consideran no editables durante navegación y por qué?
10) ¿Dónde se importan estilos de `BcModal` y quién los carga?

#### 5) Buenas prácticas
- Formula preguntas “como a un colega” (¿Dónde…?, ¿Cómo…?, ¿Qué ocurre cuando…?).
- Cita componentes/rutas para acotar contexto (ej.: `TimesheetLines.jsx`, `router.jsx`).
- Repregunta con más detalle si la respuesta es parcial.

#### 6) Seguridad y reversión
- No integres fuentes con PII en el piloto.
- Tokens de solo lectura, con rotación y revocación planificada.
- Para desactivar: elimina el servidor MCP en Cursor y revoca el PAT en GitHub.

Referencia: Context7 (MCP Server gestionado por Upstash): `https://context7.com/`


