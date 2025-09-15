-- =====================================================
-- TIMESHEET DATABASE SCHEMA
-- Soporte para múltiples empresas (company_name)
-- =====================================================

-- Habilitar extensión UUID si no está disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA DE EMPRESAS
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL UNIQUE,
    company_code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE RECURSOS (RESOURCES)
-- =====================================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    resource_no VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, resource_no)
);

-- =====================================================
-- TABLA DE PROYECTOS (JOBS)
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    job_no VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    start_date DATE,
    end_date DATE,
    project_manager VARCHAR(100),
    customer_no VARCHAR(20),
    customer_name VARCHAR(100),
    global_dimension_1 VARCHAR(20),
    global_dimension_2 VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, job_no)
);

-- =====================================================
-- TABLA DE TAREAS DE PROYECTOS (JOB TASKS)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    job_no VARCHAR(20) NOT NULL REFERENCES jobs(job_no),
    job_task_no VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    job_task_type VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, job_no, job_task_no)
);

-- =====================================================
-- TABLA DE LÍNEAS DE PLANIFICACIÓN (JOB PLANNING LINES)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_planning_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    job_no VARCHAR(20) NOT NULL REFERENCES jobs(job_no),
    job_task_no VARCHAR(20) NOT NULL,
    line_no INTEGER NOT NULL,
    line_type VARCHAR(20) NOT NULL, -- Budget, Billable, etc.
    type VARCHAR(20) NOT NULL, -- Resource, Item, G/L Account, etc.
    no VARCHAR(20) NOT NULL, -- Resource No, Item No, G/L Account No
    description TEXT,
    quantity DECIMAL(15,2),
    unit_price DECIMAL(15,2),
    total_price DECIMAL(15,2),
    total_cost DECIMAL(15,2),
    planning_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, job_no, job_task_no, line_no)
);

-- =====================================================
-- TABLA DE TIMESHEETS
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    timesheet_no VARCHAR(20) NOT NULL,
    resource_no VARCHAR(20) NOT NULL REFERENCES resources(resource_no),
    status VARCHAR(20) DEFAULT 'Open', -- Open, Submitted, Approved, Rejected
    week_ending_date DATE NOT NULL,
    total_hours DECIMAL(8,2) DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, timesheet_no)
);

-- =====================================================
-- TABLA DE LÍNEAS DE TIMESHEET
-- =====================================================
CREATE TABLE IF NOT EXISTS timesheet_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(100) NOT NULL REFERENCES companies(company_name),
    timesheet_no VARCHAR(20) NOT NULL REFERENCES timesheets(timesheet_no),
    line_no INTEGER NOT NULL,
    job_no VARCHAR(20) REFERENCES jobs(job_no),
    job_task_no VARCHAR(20),
    work_type_code VARCHAR(20),
    work_type_description TEXT,
    timesheet_date DATE NOT NULL,
    hours DECIMAL(8,2) NOT NULL,
    description TEXT,
    is_billable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_name, timesheet_no, line_no)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZAR CONSULTAS
-- =====================================================

-- Índices por empresa
CREATE INDEX IF NOT EXISTS idx_resources_company_name ON resources(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_job_tasks_company_name ON job_tasks(company_name);
CREATE INDEX IF NOT EXISTS idx_job_planning_lines_company_name ON job_planning_lines(company_name);
CREATE INDEX IF NOT EXISTS idx_timesheets_company_name ON timesheets(company_name);
CREATE INDEX IF NOT EXISTS idx_timesheet_lines_company_name ON timesheet_lines(company_name);

-- Índices por campos de búsqueda comunes
CREATE INDEX IF NOT EXISTS idx_jobs_job_no ON jobs(job_no);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_resources_resource_no ON resources(resource_no);
CREATE INDEX IF NOT EXISTS idx_timesheets_resource_no ON timesheets(resource_no);
CREATE INDEX IF NOT EXISTS idx_timesheets_week_ending_date ON timesheets(week_ending_date);

-- =====================================================
-- DATOS INICIALES DE EMPRESAS
-- =====================================================
INSERT INTO companies (company_name, company_code, description) VALUES
    ('EMPRESA_1', 'EMP1', 'Primera empresa de Business Central'),
    ('EMPRESA_2', 'EMP2', 'Segunda empresa de Business Central')
ON CONFLICT (company_name) DO NOTHING;

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TIMESTAMP
-- =====================================================
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_tasks_updated_at BEFORE UPDATE ON job_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_planning_lines_updated_at BEFORE UPDATE ON job_planning_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheet_lines_updated_at BEFORE UPDATE ON timesheet_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS DE TABLAS
-- =====================================================
COMMENT ON TABLE companies IS 'Empresas de Business Central';
COMMENT ON TABLE resources IS 'Recursos/empleados de las empresas';
COMMENT ON TABLE jobs IS 'Proyectos de las empresas';
COMMENT ON TABLE job_tasks IS 'Tareas de los proyectos';
COMMENT ON TABLE job_planning_lines IS 'Líneas de planificación de proyectos';
COMMENT ON TABLE timesheets IS 'Timesheets de recursos';
COMMENT ON TABLE timesheet_lines IS 'Líneas detalladas de timesheets';
