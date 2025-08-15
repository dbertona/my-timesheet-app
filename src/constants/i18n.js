// Constantes de internacionalización (i18n) para la aplicación
// Todos los textos están en español

export const I18N = {
  // =====================================================
  // MENSAJES DE TOAST (NOTIFICACIONES)
  // =====================================================
  TOAST: {
    SUCCESS: {
      SAVE_LINE: "Línea guardada correctamente",
      SAVE_ALL: "Todas las líneas guardadas correctamente",
      DELETE_LINE: "Línea eliminada correctamente",
      UPDATE_HEADER: "Encabezado actualizado correctamente"
    },
    ERROR: {
      SAVE_LINE: "Error al guardar la línea",
      SAVE_ALL: "Error al guardar las líneas",
      DELETE_LINE: "Error al eliminar la línea",
      UPDATE_HEADER: "Error al actualizar el encabezado",
      FETCH_DATA: "Error al cargar los datos",
      NETWORK: "Error de conexión. Verifica tu internet",
      VALIDATION: "Por favor, corrige los errores antes de continuar"
    },
    INFO: {
      SAVING: "Guardando...",
      LOADING: "Cargando...",
      NO_CHANGES: "No hay cambios para guardar"
    }
  },

  // =====================================================
  // PLACEHOLDERS DE INPUTS
  // =====================================================
  PLACEHOLDERS: {
    SEARCH: "Buscar...",
    PROJECT: "Seleccionar proyecto...",
    PROJECT_SEARCH: "Buscar proyecto...",
    TASK: "Seleccionar tarea...",
    TASK_SEARCH: "Buscar tarea...",
    WORK_TYPE: "Seleccionar tipo de trabajo...",
    WORK_TYPE_SEARCH: "Buscar tipo de trabajo...",
    QUANTITY: "0.00",
    DATE: "dd/mm/aaaa",
    NOTES: "Agregar notas...",
    RESOURCE: "Seleccionar recurso..."
  },

  // =====================================================
  // TOOLTIPS
  // =====================================================
  TOOLTIPS: {
    ADD_LINE: "Agregar nueva línea",
    DELETE_LINE: "Eliminar línea",
    SAVE_LINE: "Guardar línea (Ctrl+S)",
    SAVE_ALL: "Guardar todas las líneas",
    OPEN_CALENDAR: "Abrir calendario",
    CLOSE_CALENDAR: "Cerrar calendario",
    FILTER_PROJECTS: "Filtrar proyectos",
    FILTER_TASKS: "Filtrar tareas",
    FILTER_WORK_TYPES: "Filtrar tipos de trabajo",
    QUANTITY_HELP: "Usar punto o coma como separador decimal",
    DATE_HELP: "Formato: dd/mm/aaaa"
  },

  // =====================================================
  // ETIQUETAS DE CAMPOS
  // =====================================================
  LABELS: {
    PROJECT: "Proyecto",
    TASK: "Tarea",
    WORK_TYPE: "Tipo de trabajo",
    QUANTITY: "Cantidad",
    DATE: "Fecha",
    NOTES: "Notas",
    RESOURCE: "Recurso",
    PERIOD: "Período",
    REQUIRED_HOURS: "Horas requeridas",
    WORKED_HOURS: "Horas trabajadas",
    REMAINING_HOURS: "Horas restantes"
  },

  // =====================================================
  // MENSAJES DE VALIDACIÓN
  // =====================================================
  VALIDATION: {
    REQUIRED: "Este campo es obligatorio",
    INVALID_DATE: "Fecha inválida",
    INVALID_QUANTITY: "Cantidad inválida",
    INVALID_PROJECT: "Proyecto inválido",
    INVALID_TASK: "Tarea inválida",
    INVALID_WORK_TYPE: "Tipo de trabajo inválido",
    HOLIDAY_NO_HOURS: "Día festivo: no se permiten horas",
    REQUIRED_HOURS_MISSING: "Día sin horas requeridas",
    QUANTITY_TOO_HIGH: "La cantidad excede las horas del día",
    FUTURE_DATE: "No se pueden registrar horas para fechas futuras",
    PAST_DATE_LIMIT: "No se pueden registrar horas para fechas muy antiguas"
  },

  // =====================================================
  // MENSAJES DE ERROR
  // =====================================================
  ERRORS: {
    GENERAL: "Ha ocurrido un error inesperado",
    NOT_FOUND: "Recurso no encontrado",
    UNAUTHORIZED: "No tienes permisos para realizar esta acción",
    FORBIDDEN: "Acceso denegado",
    TIMEOUT: "La operación ha tardado demasiado",
    INVALID_FORMAT: "Formato de datos inválido",
    DUPLICATE: "El registro ya existe",
    CONSTRAINT_VIOLATION: "No se puede eliminar. Hay registros relacionados"
  },

  // =====================================================
  // TEXTO DE LA INTERFAZ
  // =====================================================
  UI: {
    BUTTONS: {
      SAVE: "Guardar",
      CANCEL: "Cancelar",
      DELETE: "Eliminar",
      ADD: "Agregar",
      EDIT: "Editar",
      CLOSE: "Cerrar",
      REFRESH: "Actualizar",
      SEARCH: "Buscar",
      CLEAR: "Limpiar",
      SUBMIT: "Enviar"
    },
    STATUS: {
      LOADING: "Cargando...",
      SAVING: "Guardando...",
      DELETING: "Eliminando...",
      UPDATING: "Actualizando...",
      IDLE: "Listo",
      ERROR: "Error",
      SUCCESS: "Éxito"
    },
    MESSAGES: {
      NO_DATA: "No hay datos para mostrar",
      NO_RESULTS: "No se encontraron resultados",
      LOADING_DATA: "Cargando datos...",
      SAVE_CHANGES: "¿Deseas guardar los cambios?",
      CONFIRM_DELETE: "¿Estás seguro de que deseas eliminar este elemento?",
      UNSAVED_CHANGES: "Tienes cambios sin guardar. ¿Deseas salir sin guardar?"
    }
  },

  // =====================================================
  // TEXTO DEL CALENDARIO
  // =====================================================
  CALENDAR: {
    LEGEND: {
      REQUIRED: "Requeridas",
      WORKED: "Trabajadas",
      REMAINING: "Restantes",
      HOLIDAY: "Festivo",
      WEEKEND: "Fin de semana"
    },
    MONTHS: {
      JANUARY: "Enero",
      FEBRUARY: "Febrero",
      MARCH: "Marzo",
      APRIL: "Abril",
      MAY: "Mayo",
      JUNE: "Junio",
      JULY: "Julio",
      AUGUST: "Agosto",
      SEPTEMBER: "Septiembre",
      OCTOBER: "Octubre",
      NOVEMBER: "Noviembre",
      DECEMBER: "Diciembre"
    },
    DAYS: {
      MONDAY: "Lunes",
      TUESDAY: "Martes",
      WEDNESDAY: "Miércoles",
      THURSDAY: "Jueves",
      FRIDAY: "Viernes",
      SATURDAY: "Sábado",
      SUNDAY: "Domingo"
    }
  },

  // =====================================================
  // TEXTO DE LA TABLA
  // =====================================================
  TABLE: {
    HEADERS: {
      PROJECT: "Proyecto",
      TASK: "Tarea",
      WORK_TYPE: "Tipo de trabajo",
      QUANTITY: "Cantidad",
      DATE: "Fecha",
      NOTES: "Notas"
    },
    ACTIONS: {
      EDIT: "Editar",
      DELETE: "Eliminar",
      DUPLICATE: "Duplicar"
    },
    EMPTY: {
      NO_LINES: "No hay líneas registradas",
      NO_PROJECTS: "No hay proyectos disponibles",
      NO_TASKS: "No hay tareas disponibles",
      NO_WORK_TYPES: "No hay tipos de trabajo disponibles"
    }
  },

  // =====================================================
  // TEXTO DEL DASHBOARD
  // =====================================================
  DASHBOARD: {
    CARDS: {
      TOTAL_HOURS: "Total de horas",
      REQUIRED_HOURS: "Horas requeridas",
      WORKED_HOURS: "Horas trabajadas",
      REMAINING_HOURS: "Horas restantes",
      COMPLETION: "Porcentaje de completado"
    },
    CHARTS: {
      HOURS_BY_DAY: "Horas por día",
      HOURS_BY_PROJECT: "Horas por proyecto",
      HOURS_BY_WORK_TYPE: "Horas por tipo de trabajo"
    }
  }
};

// =====================================================
// FUNCIONES UTILITARIAS
// =====================================================

// Obtener texto con fallback
export const getText = (path, fallback = '') => {
  try {
    const keys = path.split('.');
    let value = I18N;

    for (const key of keys) {
      value = value[key];
      if (value === undefined) break;
    }

    return value || fallback;
  } catch (error) {
    console.warn(`Error getting i18n text for path: ${path}`, error);
    return fallback;
  }
};

// Obtener texto con parámetros
export const getTextWithParams = (path, params = {}, fallback = '') => {
  let text = getText(path, fallback);

  Object.entries(params).forEach(([key, value]) => {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });

  return text;
};

// Exportar constantes individuales para uso directo
export const {
  TOAST,
  PLACEHOLDERS,
  TOOLTIPS,
  LABELS,
  VALIDATION,
  ERRORS,
  UI,
  CALENDAR,
  TABLE,
  DASHBOARD
} = I18N;
