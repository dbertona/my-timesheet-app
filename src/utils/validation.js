import { toIsoFromInput } from "./dateHelpers";

export function buildHolidaySet(calendarHolidays = []) {
  const set = new Set();
  for (const h of calendarHolidays) {
    const iso = (h?.day ? String(h.day) : "").slice(0, 10);
    if (iso && h?.holiday === true) set.add(iso);
  }
  return set;
}

export function computeTotalsByIso(editFormData = {}) {
  const totals = {};
  for (const row of Object.values(editFormData)) {
    const iso = toIsoFromInput(row?.date);
    if (!iso) continue;
    totals[iso] = (totals[iso] || 0) + (Number(row?.quantity) || 0);
  }
  return totals;
}

export function isHolidayIso(iso, holidaySet) {
  return holidaySet?.has?.(iso) || false;
}

// 🆕 NUEVA FUNCIÓN: Validación completa antes de guardar
export function validateAllData(editFormData = {}, dailyRequired = {}, calendarHolidays = []) {
  const errors = {};
  const totals = computeTotalsByIso(editFormData);
  const holidaySet = buildHolidaySet(calendarHolidays);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Validar cada línea
  for (const [lineId, row] of Object.entries(editFormData)) {
    const lineErrors = {};
    
    // 1. Validar fecha
    if (!row.date) {
      lineErrors.date = "Fecha es requerida";
      totalErrors++;
    } else {
      const iso = toIsoFromInput(row.date);
      if (!iso) {
        lineErrors.date = "Formato de fecha inválido";
        totalErrors++;
      } else if (holidaySet.has(iso)) {
        // 2. Validar que no haya horas en festivos
        const qty = Number(row.quantity) || 0;
        if (qty > 0) {
          lineErrors.date = "No se pueden imputar horas en días festivos";
          totalErrors++;
        }
      }
    }
    
    // 3. Validar proyecto
    if (!row.job_no) {
      lineErrors.job_no = "Proyecto es requerido";
      totalErrors++;
    }
    
    // 4. Validar tarea
    if (!row.job_task_no) {
      lineErrors.job_task_no = "Tarea es requerida";
      totalErrors++;
    }
    
    // 5. Validar cantidad
    const qty = Number(row.quantity) || 0;
    if (qty < 0) {
      lineErrors.quantity = "La cantidad no puede ser negativa";
      totalErrors++;
    }
    
    // 6. Validar exceso de horas diarias
    if (row.date) {
      const iso = toIsoFromInput(row.date);
      if (iso && dailyRequired[iso] !== undefined) {
        const required = Number(dailyRequired[iso]) || 0;
        const totalForDay = Number(totals[iso]) || 0;
        const EPS = 0.01;
        
        if (totalForDay > required + EPS) {
          lineErrors.quantity = `Excede tope diario (${totalForDay.toFixed(2)} / ${required.toFixed(2)})`;
          totalWarnings++;
        }
      }
    }
    
    // Solo agregar línea si tiene errores
    if (Object.keys(lineErrors).length > 0) {
      errors[lineId] = lineErrors;
    }
  }
  
  // Crear resumen de errores
  const summary = generateValidationSummary(errors, totalErrors, totalWarnings);
  
  return {
    isValid: totalErrors === 0,
    hasWarnings: totalWarnings > 0,
    errors,
    totalErrors,
    totalWarnings,
    summary
  };
}

// 🆕 FUNCIÓN AUXILIAR: Generar resumen de validación
function generateValidationSummary(errors, totalErrors, totalWarnings) {
  if (totalErrors === 0 && totalWarnings === 0) {
    return "✅ Todos los datos son válidos";
  }
  
  let summary = "";
  
  if (totalErrors > 0) {
    summary += `❌ ${totalErrors} error${totalErrors > 1 ? 'es' : ''} crítico${totalErrors > 1 ? 's' : ''} que impiden guardar\n`;
  }
  
  if (totalWarnings > 0) {
    summary += `⚠️ ${totalWarnings} advertencia${totalWarnings > 1 ? 's' : ''} que deberías revisar\n`;
  }
  
  // Agregar detalles por tipo de error
  const errorTypes = {};
  Object.values(errors).forEach(lineErrors => {
    Object.values(lineErrors).forEach(errorMsg => {
      errorTypes[errorMsg] = (errorTypes[errorMsg] || 0) + 1;
    });
  });
  
  if (Object.keys(errorTypes).length > 0) {
    summary += "\n📋 Resumen de problemas:\n";
    Object.entries(errorTypes).forEach(([error, count]) => {
      summary += `• ${error}: ${count} línea${count > 1 ? 's' : ''}\n`;
    });
  }
  
  return summary.trim();
}



