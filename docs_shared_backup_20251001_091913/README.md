# Power Solution - Documentación Técnica

Este repositorio contiene la documentación técnica compartida entre todos los proyectos de Power Solution.

## Estructura

- `infrastructure/` - Documentación de infraestructura (Supabase, PostgreSQL, Metabase, Docker, etc.)
- `business-central/` - Documentación específica de Business Central
- `n8n/` - Documentación de workflows de n8n
- `deployment/` - Guías de despliegue y CI/CD

## Contenido

### Infrastructure
- `integracion-supabase-postgres-metabase.md` - Configuración completa de Supabase, PostgreSQL y Metabase

### N8N
- `n8n-integration-guide.md` - Guía completa de integración con n8n
- `n8n-microsoft365-config.md` - Configuración de Microsoft 365 para n8n

### Deployment
- `DEPLOY_TESTING.md` - Guía de despliegue en Testing

### Business Central
- `CI_TRIGGER.md` - Información de CI/CD

## Uso

Este repositorio se incluye como submódulo Git en los proyectos que necesiten acceso a la documentación:

```bash
git submodule add https://github.com/dbertona/power-solution-docs.git docs/shared
```

## Actualización

Para actualizar la documentación en un proyecto:

```bash
cd docs/shared
git pull origin main
cd ../..
git add docs/shared
git commit -m "Update shared documentation"
```

## Contribución

1. Edita los archivos directamente en este repositorio
2. Haz commit y push de los cambios
3. Actualiza el submódulo en los proyectos que lo usen

## Mantenimiento

- **Archivos obsoletos**: Se eliminan automáticamente
- **Archivos específicos**: Se mantienen en cada proyecto individual
- **Archivos compartidos**: Se centralizan aquí para evitar duplicación
