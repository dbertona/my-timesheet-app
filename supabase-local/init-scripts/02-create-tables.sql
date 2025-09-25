-- Crear tablas del sistema de timesheet

-- Tabla de recursos (empleados)
CREATE TABLE IF NOT EXISTS resource (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department_code VARCHAR(50),
    calendar_type VARCHAR(50),
    company_name VARCHAR(255)
);

-- Tabla de trabajos/proyectos
CREATE TABLE IF NOT EXISTS job (
    no VARCHAR(100) PRIMARY KEY,
    description TEXT,
    status VARCHAR(50),
    responsible VARCHAR(50),
    departamento VARCHAR(50),
    company_name VARCHAR(255)
);

-- Tabla de tareas de trabajos
CREATE TABLE IF NOT EXISTS job_task (
    job_no VARCHAR(100) REFERENCES job(no),
    task_no VARCHAR(50),
    description TEXT,
    company_name VARCHAR(255),
    PRIMARY KEY (job_no, task_no)
);

-- Tabla de equipos de trabajo
CREATE TABLE IF NOT EXISTS job_team (
    job_no VARCHAR(100) REFERENCES job(no),
    resource_no VARCHAR(50),
    company_name VARCHAR(255),
    PRIMARY KEY (job_no, resource_no)
);

-- Tabla de costos de recursos
CREATE TABLE IF NOT EXISTS resource_cost (
    resource_no VARCHAR(50),
    cost_center VARCHAR(50),
    cost_per_hour DECIMAL(10,2),
    company_name VARCHAR(255),
    PRIMARY KEY (resource_no, cost_center)
);

-- Tabla de cabeceras de partes de trabajo
CREATE TABLE IF NOT EXISTS resource_timesheet_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_no VARCHAR(50),
    posting_date DATE,
    description TEXT,
    posting_description TEXT,
    from_date DATE,
    to_date DATE,
    allocation_period VARCHAR(50),
    resource_calendar VARCHAR(50),
    user_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    Company VARCHAR(255),
    synced_to_bc BOOLEAN DEFAULT FALSE,
    department_code VARCHAR(50),
    company_name VARCHAR(255),
    bc_document_no VARCHAR(50)
);

-- Tabla de líneas de partes de trabajo
CREATE TABLE IF NOT EXISTS timesheet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255),
    creado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE,
    description TEXT,
    job_no VARCHAR(100),
    job_no_and_description TEXT,
    job_responsible VARCHAR(50),
    job_responsible_approval BOOLEAN,
    job_task_no VARCHAR(50),
    modificado TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    quantity DECIMAL(10,2),
    rejection_cause TEXT,
    resource_name VARCHAR(255),
    resource_no VARCHAR(50),
    resource_responsible VARCHAR(50),
    status VARCHAR(50),
    work_type VARCHAR(50),
    header_id UUID REFERENCES resource_timesheet_header(id),
    synced_to_bc BOOLEAN DEFAULT FALSE,
    department_code VARCHAR(50),
    isFactorialLine BOOLEAN,
    company_name VARCHAR(255),
    factorial_leave_id VARCHAR(50),
    factorial_employee_id VARCHAR(50)
);

-- Tabla de días del calendario
CREATE TABLE IF NOT EXISTS calendar_period_days (
    date DATE PRIMARY KEY,
    is_working_day BOOLEAN DEFAULT TRUE,
    calendar_type VARCHAR(50),
    company_name VARCHAR(255)
);

-- Tabla de estado de sincronización
CREATE TABLE IF NOT EXISTS sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100),
    last_sync TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50),
    error_message TEXT,
    company_name VARCHAR(255)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_resource_code ON resource(code);
CREATE INDEX IF NOT EXISTS idx_resource_email ON resource(email);
CREATE INDEX IF NOT EXISTS idx_job_no ON job(no);
CREATE INDEX IF NOT EXISTS idx_timesheet_header_id ON timesheet(header_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_resource_no ON timesheet(resource_no);
CREATE INDEX IF NOT EXISTS idx_timesheet_date ON timesheet(date);
CREATE INDEX IF NOT EXISTS idx_timesheet_status ON timesheet(status);
CREATE INDEX IF NOT EXISTS idx_resource_timesheet_header_resource_no ON resource_timesheet_header(resource_no);
CREATE INDEX IF NOT EXISTS idx_resource_timesheet_header_posting_date ON resource_timesheet_header(posting_date);

-- Habilitar RLS en todas las tablas
ALTER TABLE resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE job ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_timesheet_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_period_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir todo por ahora)
CREATE POLICY "Enable all operations for all users" ON resource FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON job FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON job_task FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON job_team FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON resource_cost FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON resource_timesheet_header FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON timesheet FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON calendar_period_days FOR ALL USING (true);
CREATE POLICY "Enable all operations for all users" ON sync_state FOR ALL USING (true);



