#!/bin/bash

# Script para extraer esquema completo de Supabase Cloud
CLOUD_HOST="db.qfpswxjunoepznrpsltt.supabase.co"
CLOUD_USER="postgres"
CLOUD_DB="postgres"
CLOUD_PASS="e3u2zDnt4mGMJFWA"

echo "=== EXTRAYENDO FUNCIONES DE LA NUBE ==="
PGPASSWORD=$CLOUD_PASS psql -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB -p 5432 -c "
SELECT
    'CREATE OR REPLACE FUNCTION ' || routine_name || '(' ||
    COALESCE(
        (SELECT string_agg(parameter_name || ' ' || data_type, ', ')
         FROM information_schema.parameters
         WHERE specific_name = r.specific_name
         AND parameter_mode = 'IN'
         ORDER BY ordinal_position),
        ''
    ) || ') RETURNS ' || data_type || ' AS \$\$' || chr(10) ||
    'SELECT ' || routine_definition || chr(10) ||
    '\$\$ LANGUAGE ' || external_language || ';' as ddl
FROM information_schema.routines r
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;
" > /tmp/cloud_functions_ddl.sql

echo "=== EXTRAYENDO TRIGGERS DE LA NUBE ==="
PGPASSWORD=$CLOUD_PASS psql -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB -p 5432 -c "
SELECT
    'CREATE TRIGGER ' || trigger_name || chr(10) ||
    '    ' || action_timing || ' ' || event_manipulation || ' ON ' || event_object_table || chr(10) ||
    '    FOR EACH ' || action_orientation || ' ' || action_statement || ';' as ddl
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
" > /tmp/cloud_triggers_ddl.sql

echo "=== EXTRAYENDO POLÍTICAS RLS DE LA NUBE ==="
PGPASSWORD=$CLOUD_PASS psql -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB -p 5432 -c "
SELECT
    'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || chr(10) ||
    '    FOR ' || permissive || ' ' || cmd || chr(10) ||
    '    USING (' || qual || ')' ||
    CASE WHEN with_check IS NOT NULL THEN chr(10) || '    WITH CHECK (' || with_check || ')' ELSE '' END || ';' as ddl
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" > /tmp/cloud_policies_ddl.sql

echo "=== EXTRAYENDO ENUMS DE LA NUBE ==="
PGPASSWORD=$CLOUD_PASS psql -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB -p 5432 -c "
SELECT
    'CREATE TYPE ' || t.typname || ' AS ENUM (' ||
    string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder) || ');' as ddl
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
GROUP BY t.typname
ORDER BY t.typname;
" > /tmp/cloud_enums_ddl.sql

echo "=== EXTRAYENDO DEFAULTS DE COLUMNAS DE LA NUBE ==="
PGPASSWORD=$CLOUD_PASS psql -h $CLOUD_HOST -U $CLOUD_USER -d $CLOUD_DB -p 5432 -c "
SELECT
    'ALTER TABLE ' || table_schema || '.' || table_name ||
    ' ALTER COLUMN ' || column_name ||
    ' SET DEFAULT ' || column_default || ';' as ddl
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_default IS NOT NULL
AND column_default != 'nextval('''
ORDER BY table_name, column_name;
" > /tmp/cloud_defaults_ddl.sql

echo "=== ARCHIVOS GENERADOS ==="
ls -la /tmp/cloud_*_ddl.sql

echo "=== APLICANDO A LOCAL ==="
echo "Aplicando funciones..."
docker exec timesheet-postgres psql -U postgres -d postgres -f /tmp/cloud_functions_ddl.sql

echo "Aplicando triggers..."
docker exec timesheet-postgres psql -U postgres -d postgres -f /tmp/cloud_triggers_ddl.sql

echo "Aplicando políticas RLS..."
docker exec timesheet-postgres psql -U postgres -d postgres -f /tmp/cloud_policies_ddl.sql

echo "Aplicando enums..."
docker exec timesheet-postgres psql -U postgres -d postgres -f /tmp/cloud_enums_ddl.sql

echo "Aplicando defaults..."
docker exec timesheet-postgres psql -U postgres -d postgres -f /tmp/cloud_defaults_ddl.sql

echo "=== RECARGANDO POSTGREST ==="
docker exec timesheet-postgres psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"

echo "=== COMPLETADO ==="



