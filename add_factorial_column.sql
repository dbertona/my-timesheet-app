-- Script para agregar la columna isFactorialLine a la tabla timesheet
-- Esta columna marcará las líneas importadas desde Factorial como no editables

-- Agregar la columna isFactorialLine
ALTER TABLE timesheet 
ADD COLUMN "isFactorialLine" BOOLEAN DEFAULT FALSE;

-- Crear un índice para mejorar el rendimiento de consultas
CREATE INDEX idx_timesheet_is_factorial_line ON timesheet("isFactorialLine");

-- Comentario de la columna
COMMENT ON COLUMN timesheet."isFactorialLine" IS 'Marca si la línea fue importada desde Factorial (no editable)';

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'timesheet' AND column_name = 'isFactorialLine';
