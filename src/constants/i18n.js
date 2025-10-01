// src/constants/i18n.js
// Constantes de internacionalización para la aplicación

export const TOAST = {
  SUCCESS: {
    SAVE_LINE: "Línea guardada correctamente",
    DELETE_LINE: "Línea eliminada correctamente",
    SAVE_ALL: "Guardado correctamente",
  },
  ERROR: {
    SAVE_LINE: "Error al guardar la línea",
    DELETE_LINE: "Error al eliminar la línea",
    SAVE_ALL: "Error al guardar",
  },
};

export const PLACEHOLDERS = {
  SEARCH: "Buscar...",
  DATE: "dd/MM/yyyy",
  QUANTITY: "0.00",
  DESCRIPTION: "Descripción de la tarea",
};

export const VALIDATION = {
  HOLIDAY_NO_HOURS: "No se pueden imputar horas en días festivos",
  REQUIRED_FIELD: "Campo obligatorio",
  INVALID_DATE: "Fecha inválida",
  INVALID_QUANTITY: "Cantidad inválida",
};

export const LABELS = {
  SAVE: "Guardar",
  DELETE: "Eliminar",
  CANCEL: "Cancelar",
  EDIT: "Editar",
  ADD: "Agregar",
  CLOSE: "Cerrar",
  // 🆕 Constantes para el calendario
  REQUIRED_HOURS: "Horas requeridas",
  WORKED_HOURS: "Horas trabajadas",
  REMAINING_HOURS: "Horas restantes",
};

// 🆕 Constantes para el calendario
export const CALENDAR = {
  DAYS_OF_WEEK: ["L", "M", "X", "J", "V", "S", "D"],
  MONTHS: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  STATUS: {
    NO_HOURS: "sin-horas",
    ZERO: "cero",
    PARTIAL: "parcial",
    COMPLETE: "completo",
  },
};
