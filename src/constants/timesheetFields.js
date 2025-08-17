// src/constants/timesheetFields.js

// Orden de columnas (debe coincidir con tu tabla/render)
const TIMESHEET_FIELDS = [
  "job_no",
  "job_no_description", // Nueva columna: descripción del proyecto
  "job_task_no",
  "description",
  "work_type",
  "date",
  "quantity",
  "department_code",
];

// Etiquetas para el <thead>
export const TIMESHEET_LABELS = {
  job_no: "Nº proyecto",
  job_no_description: "Descripción proyecto", // Nueva etiqueta
  job_task_no: "Nº tarea",
  description: "Descripción",
  work_type: "Tipo trabajo",
  quantity: "Cantidad",
  date: "Fecha día trabajo",
  department_code: "Departamento",
};

// Alineación por columna (para inputs y celdas)
export const TIMESHEET_ALIGN = {
  job_no: "left",
  job_no_description: "left", // Nueva alineación
  job_task_no: "left",
  description: "left",
  work_type: "left",
  quantity: "right",
  date: "right",
  department_code: "right", // nos pediste este a la derecha
};

// Límites de auto-ajuste por doble clic
export const COL_MIN_WIDTH = {
  job_no: 140,
  job_no_description: 200, // Nuevo ancho mínimo
  job_task_no: 130,
  description: 260,
  work_type: 120,
  date: 120,
  quantity: 90,
  department_code: 140,
};

export const COL_MAX_WIDTH = {
  job_no: 240,
  job_no_description: 400, // Nuevo ancho máximo
  job_task_no: 240,
  description: 420,
  work_type: 220,
  date: 160,
  quantity: 140,
  department_code: 200,
};

// Ancho por defecto usado por el hook de resize
export const DEFAULT_COL_WIDTH = 80;

export default TIMESHEET_FIELDS;
