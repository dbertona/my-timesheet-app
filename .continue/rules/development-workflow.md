---
description: Reglas de desarrollo para el proyecto my-timesheet-app
---

# Reglas de Desarrollo - my-timesheet-app

## Flujo de Git y Commits

### Workflow de Ramas
- **SIEMPRE** crear una rama nueva para cada tarea: `git checkout -b feature/nombre-tarea` o `fix/descripcion`
- **NUNCA** trabajar directamente en `main`
- Mostrar el diff de cambios antes de hacer commit
- Esperar aprobación explícita del usuario con "APROBAR CAMBIOS"
- Una vez aprobado, hacer commit y merge a `main`
- Si no se aprueba, revertir cambios

### Mensajes de Commit
- Usar formato: `feat:`, `fix:`, `chore:`, `docs:`
- Incluir sufijo de versión beta: `-beta.X`
- Ejemplos:
  - `feat: add factorial webhook integration -beta.5`
  - `fix: resolve header_id assignment issue -beta.3`
  - `chore: update dependencies -beta.2`

### Gestión de Versiones
- **SIEMPRE** incrementar versión en `package.json` antes de subir a Testing
- Formato: `0.1.1-6-beta.X`
- Hacer commit del cambio de versión antes del deploy

## Análisis y Desarrollo

### Enfoque Crítico
- Realizar análisis crítico con riesgos, alternativas y próximos pasos
- Identificar supuestos y lagunas de información
- Proponer únicamente mejoras importantes con impacto real
- Evitar sugerencias menores o iteraciones infinitas
- Si el usuario indica criterio explícito, obedecer sin objeciones adicionales

### Reutilización de Código
- **SIEMPRE** reutilizar funcionalidad existente antes de crear nueva
- Aplicar principio DRY (Don't Repeat Yourself)
- Buscar componentes o funciones existentes antes de crear nuevas

### Estilo de UI Consistente
- Usar un concepto de estilo único en toda la aplicación
- Aprovechar componentes que heredan de elementos intermedios
- Evitar mezclar divs con estilos inline con celdas basadas en componentes
- Mantener consistencia visual en toda la interfaz

## Validación y Testing

### Verificación Previa
- **NUNCA** declarar algo "listo" sin verificar primero:
  - Consola del navegador (errores JavaScript/React)
  - Pestaña Problems del editor (errores de linting/compilación)
  - Ejecutar pruebas de humo mínimas

### Análisis de Errores
- Siempre analizar la pestaña Problems después de cambios o builds
- Detectar errores de linting o compilación antes de continuar
- Corregir errores inmediatamente cuando se detecten
- Revisar consola de desarrollo para errores de JavaScript, React, etc.

## Integración con Supabase

### Configuración
- Usar variables de entorno para credenciales sensibles
- Mantener conexiones seguras entre n8n y Supabase
- Implementar retry logic para operaciones fallidas
- Validar datos antes de enviar a Supabase

### Gestión de Datos
- Diseñar sistemas que soporten múltiples empresas dinámicamente
- Usar parámetros de empresa para filtrar datos correctamente
- Mantener consistencia en el manejo de datos entre empresas
- Validar permisos de empresa antes de procesar datos

## Integración con n8n

### Workflows
- Crear workflows modulares y reutilizables
- Usar nombres descriptivos para workflows y nodos
- Documentar funcionalidad de cada workflow
- Mantener versiones de workflows para facilitar rollbacks
- Implementar logging detallado en workflows críticos

### Gestión de Errores
- Implementar manejo robusto de errores en workflows
- Capturar y reportar errores específicos sin detener procesos
- Proporcionar información detallada sobre errores para depuración
- Manejar violaciones de claves foráneas y duplicados elegantemente

## Traducciones

### Proceso de Traducción
- **SIEMPRE** generar y actualizar traducciones (XLIFF) para textos de UI nuevos
- Ejecutar Generate XLIFF después de cambios en textos de interfaz
- Ejecutar Synchronize Translation Units para mantener consistencia
- Traducir al español todos los textos nuevos

### Textos de Interfaz
- Todos los textos visibles al usuario deben estar traducidos
- Usar constantes de traducción en lugar de texto hardcodeado
- Mantener consistencia en la terminología utilizada

## Calendario y UI

### Calendario
- El calendario debe empezar las semanas en lunes, no en sábado
- Mantener un tamaño más pequeño y sobrio para elementos de UI

### Botones
- Los botones deben ser rectangulares y usar la fuente Segoe UI
- Aplicar bordes ligeramente redondeados (3px) como Business Central
- Usar clases `.ts-btn` y sus variantes consistentemente

## Comunicación

### Seguimiento de Progreso
- **SIEMPRE** mostrar el avance en tiempo real en el chat
- Proporcionar seguimientos paso a paso durante las tareas
- Explicar claramente qué se está haciendo en cada momento
- Indicar progreso porcentual cuando sea posible
- Alertar sobre posibles demoras o problemas encontrados
- Notificar oportunamente cuando las tareas estén listas

### Transparencia
- Mostrar en tiempo real los comandos y salida en terminal
- Proporcionar contexto sobre las decisiones tomadas
- Explicar el razonamiento detrás de las acciones realizadas
- Mantener un registro claro de los cambios efectuados
- **NUNCA** dejar al usuario esperando sin información del progreso

## Deployment

### Testing Environment
- Usar script `ops/testing/deploy.sh` para desplegar a Testing
- Leer variables de entorno desde `.env.testing`
- Transferir credenciales de forma segura al servidor remoto
- Verificar que el servicio esté activo después del deploy

### Verificación Post-Deploy
- Confirmar que el backend responde correctamente
- Verificar logs del servicio con `journalctl -u timesheet-backend.service -f`
- Realizar pruebas de humo para validar funcionalidad

## Estándares de Código

### TypeScript/JavaScript
- Usar `allowJs: true` en tsconfig.json para archivos .jsx
- Mantener configuración consistente de ESLint
- Seguir convenciones de naming del proyecto

### Estructura de Archivos
- Mantener organización clara de componentes
- Separar lógica de negocio de presentación
- Usar hooks personalizados para lógica reutilizable

## Monitoreo y Logging

### Logging Estructurado
- Implementar logging detallado en operaciones críticas
- Incluir contexto relevante en los logs
- Usar niveles de log apropiados (info, warn, error)

### Métricas de Rendimiento
- Monitorear tiempo de respuesta de APIs
- Rastrear errores y excepciones
- Mantener métricas de uso de recursos

## Seguridad

### Credenciales
- Nunca hardcodear credenciales en el código
- Usar variables de entorno para datos sensibles
- Mantener archivos .env fuera del control de versiones

### Validación de Entrada
- Validar todos los inputs del usuario
- Sanitizar datos antes de procesar
- Implementar rate limiting donde sea apropiado
