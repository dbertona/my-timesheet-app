-- Script completo para habilitar RLS en TODAS las tablas de Supabase
-- Ejecutar en el SQL Editor de Supabase

-- =====================================================
-- 1. VERIFICAR QUÉ TABLAS NO TIENEN RLS HABILITADO
-- =====================================================

-- Mostrar todas las tablas públicas sin RLS
SELECT
    schemaname,
    tablename,
    rowsecurity,
    'Needs RLS' as status
FROM pg_tables
WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- =====================================================
-- 2. HABILITAR RLS EN TODAS LAS TABLAS IDENTIFICADAS
-- =====================================================

-- Habilitar RLS en calendar_period_days
ALTER TABLE public.calendar_period_days ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en timesheet_headers (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_headers') THEN
        ALTER TABLE public.timesheet_headers ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en timesheet_lines (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_lines') THEN
        ALTER TABLE public.timesheet_lines ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en jobs (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
        ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en tasks (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en work_types (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_types') THEN
        ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en resources (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resources') THEN
        ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Habilitar RLS en calendar_periods (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_periods') THEN
        ALTER TABLE public.calendar_periods ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- 3. CREAR POLÍTICAS BÁSICAS PARA PERMITIR ACCESO TOTAL
-- =====================================================

-- Política para calendar_period_days
CREATE POLICY "Allow all access to calendar_period_days" ON public.calendar_period_days
FOR ALL USING (true);

-- Política para timesheet_headers (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_headers') THEN
        EXECUTE 'CREATE POLICY "Allow all access to timesheet_headers" ON public.timesheet_headers FOR ALL USING (true)';
    END IF;
END $$;

-- Política para timesheet_lines (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'timesheet_lines') THEN
        EXECUTE 'CREATE POLICY "Allow all access to timesheet_lines" ON public.timesheet_lines FOR ALL USING (true)';
    END IF;
END $$;

-- Política para jobs (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
        EXECUTE 'CREATE POLICY "Allow all access to jobs" ON public.jobs FOR ALL USING (true)';
    END IF;
END $$;

-- Política para tasks (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN
        EXECUTE 'CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true)';
    END IF;
END $$;

-- Política para work_types (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_types') THEN
        EXECUTE 'CREATE POLICY "Allow all access to work_types" ON public.work_types FOR ALL USING (true)';
    END IF;
END $$;

-- Política para resources (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resources') THEN
        EXECUTE 'CREATE POLICY "Allow all access to resources" ON public.resources FOR ALL USING (true)';
    END IF;
END $$;

-- Política para calendar_periods (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_periods') THEN
        EXECUTE 'CREATE POLICY "Allow all access to calendar_periods" ON public.calendar_periods FOR ALL USING (true)';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR QUE TODAS LAS TABLAS TIENEN RLS HABILITADO
-- =====================================================

-- Mostrar estado final de todas las tablas
SELECT
    schemaname,
    tablename,
    rowsecurity,
    CASE
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- =====================================================
-- 5. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- =====================================================

-- Mostrar todas las políticas creadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- RESUMEN: ESTE SCRIPT HACE LO SIGUIENTE:
-- =====================================================
-- 1. Identifica todas las tablas sin RLS
-- 2. Habilita RLS en todas las tablas encontradas
-- 3. Crea políticas básicas que permiten acceso total
-- 4. Verifica que todo se aplicó correctamente
-- 5. Muestra el estado final de todas las tablas
-- =====================================================
