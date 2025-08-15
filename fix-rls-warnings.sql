-- Script para quitar avisos de RLS en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- 1. Habilitar RLS en la tabla calendar_period_days
ALTER TABLE public.calendar_period_days ENABLE ROW LEVEL SECURITY;

-- 2. Crear política que permita acceso total (para quitar el aviso)
CREATE POLICY "Allow all access to calendar_period_days" ON public.calendar_period_days
FOR ALL USING (true);

-- 3. Verificar si hay otras tablas sin RLS habilitado
-- (Ejecutar esto para ver qué otras tablas pueden tener el mismo problema)
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%';

-- 4. Si encuentras más tablas, puedes aplicar el mismo patrón:
-- ALTER TABLE public.nombre_tabla ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all access to nombre_tabla" ON public.nombre_tabla FOR ALL USING (true);

-- 5. Para verificar que RLS está habilitado:
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'calendar_period_days';
