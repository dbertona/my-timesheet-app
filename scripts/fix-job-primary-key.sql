-- Script para modificar la clave primaria de la tabla job en Supabase
-- Cambiar de solo 'no' a compuesta por 'no' y 'company_name'

-- Paso 1: Eliminar la clave primaria actual
ALTER TABLE job DROP CONSTRAINT IF EXISTS job_pkey;

-- Paso 2: Añadir la nueva clave primaria compuesta
ALTER TABLE job ADD CONSTRAINT job_pkey PRIMARY KEY (no, company_name);

-- Paso 3: Verificar que la tabla tiene la estructura correcta
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job'
ORDER BY ordinal_position;

-- Paso 4: Verificar la nueva clave primaria
SELECT
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.key_column_usage
WHERE table_name = 'job'
AND constraint_name = 'job_pkey';
