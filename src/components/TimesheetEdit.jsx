// src/components/TimesheetEdit.jsx
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, useBlocker } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseClient } from "../supabaseClient";
import useCalendarData from "../hooks/useCalendarData";
import useTimesheetLines from "../hooks/useTimesheetLines";
import useTimesheetEdit from "../hooks/useTimesheetEdit";
import { useJobs, useAllJobs } from "../hooks/useTimesheetQueries";
import TimesheetHeader from "./TimesheetHeader";
import TimesheetLines from "./TimesheetLines";
import CalendarPanel from "./timesheet/CalendarPanel";
import BcModal from "./ui/BcModal";
import ValidationErrorsModal from "./ui/ValidationErrorsModal";
import { TOAST, PLACEHOLDERS, VALIDATION, LABELS } from "../constants/i18n";
import { format } from "date-fns";
import { buildHolidaySet, computeTotalsByIso, validateAllData } from "../utils/validation";
import "../styles/BcModal.css";

// ✅ columnas existentes en la tabla 'timesheet'
const SAFE_COLUMNS = [
  "header_id",
  "job_no",
  "job_task_no",
  "description",
  "work_type",
  "quantity",
  "date",
  "department_code",
  "company",
  "creado",
  "job_no_and_description",
  "job_responsible",
  "job_responsible_approval", // siempre true
  "resource_no",              // NUEVO
  "resource_responsible",     // NUEVO
];

function TimesheetEdit({ headerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();

  const [header, setHeader] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [calendarHolidays, setCalendarHolidays] = useState([]);
  const [rightPad, setRightPad] = useState(234);
  const [editableHeader, setEditableHeader] = useState(null); // 🆕 Cabecera editable para nuevos partes
  const [periodChangeTrigger, setPeriodChangeTrigger] = useState(0); // 🆕 Trigger para forzar re-renderizado cuando cambie el período
  const [selectedLines, setSelectedLines] = useState([]); // 🆕 Líneas seleccionadas para acciones múltiples

  // IDs de cabecera resueltos antes de usar hooks que dependen de ello
  const [debugInfo, setDebugInfo] = useState({ ap: null, headerIdProp: headerId ?? null, headerIdResolved: null });
  const [resolvedHeaderId, setResolvedHeaderId] = useState(null);
  const effectiveHeaderId = useMemo(
    () => resolvedHeaderId ?? header?.id ?? headerId ?? null,
    [resolvedHeaderId, header?.id, headerId]
  );

  // === Calendario (estado + helpers) ahora en hook dedicado
  const {
    calRange,
    firstOffset,
    calendarDays,
    dailyRequired,
    calendarHolidays: calHolidaysFromHook,
    requiredSum,
    imputedSum,
    missingSum,
  } = useCalendarData(header || editableHeader, resolvedHeaderId, editFormData);

  // 🆕 Obtener jobs para validación de estado (TODOS los proyectos del recurso)
  const jobsQuery = useAllJobs((header || editableHeader)?.resource_no);
  const jobs = jobsQuery.data || [];
  const [hasDailyErrors, setHasDailyErrors] = useState(false);
  // 🆕 Estado para errores de validación de proyecto (Completed/Lost)
  const [hasProjectValidationErrors, setHasProjectValidationErrors] = useState(false);

  // 🆕 Función para verificar si hay errores de validación de proyecto
  const checkProjectValidationErrors = useCallback(() => {
    if (!jobs.length || !Object.keys(editFormData).length) return false;

    for (const [lineId, row] of Object.entries(editFormData)) {
      if (row.job_no && row.quantity && parseFloat(row.quantity) > 0) {
        const project = jobs.find(j => j.no === row.job_no);
        if (project && (project.status === 'Completed' || project.status === 'Lost')) {
          return true;
        }
      }
    }
    return false;
  }, [jobs, editFormData]);



  // 🆕 useEffect para actualizar el estado de errores de validación de proyecto
  useEffect(() => {
    const hasErrors = checkProjectValidationErrors();
    setHasProjectValidationErrors(hasErrors);
  }, [checkProjectValidationErrors]);

  const serverSnapshotRef = useRef({}); // Último estado confirmado por servidor por línea
  const [savingByLine, setSavingByLine] = useState({}); // { [id]: boolean }

  // Estado para el modal de confirmación de navegación
  const [navigationModal, setNavigationModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
    onCancel: null
  });

  // 🆕 Estado para el modal de errores de validación
  const [validationModal, setValidationModal] = useState({
    show: false,
    validation: null
  });

  // Bandera para evitar múltiples modales
  const [isNavigating, setIsNavigating] = useState(false);

  function parseAllocationPeriod(ap) {
    const m = /^M(\d{2})-M(\d{2})$/.exec(ap || "");
    if (!m) return null;
    const yy = parseInt(m[1], 10);
    const year = 2000 + yy;
    const month = parseInt(m[2], 10); // 1..12
    return { year, month };
  }
  function daysInMonth(year, month) { // month: 1..12
    return new Date(year, month, 0).getDate();
  }
  function isoOf(y, m, d) {
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  }
  function toIsoFromInput(value) {
    if (!value) return null;
    if (typeof value === "string" && value.includes("/")) {
      const [dd, mm, yyyy] = value.split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
    // fallback: assume ISO or Date string
    return String(value).slice(0, 10);
  }
  function toDisplayDate(value) {
    if (!value) return "";
    const s = String(value);
    // Already in dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // Try ISO YYYY-MM-DD or take first 10 chars
    const iso = s.slice(0, 10);
    const [y, m, d] = iso.split("-");
    if (y && m && d) {
      try {
        return format(new Date(Number(y), Number(m) - 1, Number(d)), "dd/MM/yyyy");
      } catch (_) {
        return "";
      }
    }
    return "";
  }

  const toTwoDecimalsString = (value) => {
    if (value === null || value === undefined || value === "") return "0.00";
    const num = Number(value);
    if (!isFinite(num)) return "0.00";
    return Math.max(0, num).toFixed(2);
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    if (secs < 5) return "Guardado ahora";
    if (secs < 60) return `Guardado hace ${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `Guardado hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `Guardado hace ${hrs}h`;
  };

  // Pequeño componente para mostrar totales del mes dentro del panel del calendario
  const TotalsForMonth = ({ dailyRequired, editFormData }) => {
    const required = Object.values(dailyRequired || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
    let imputed = 0;
    for (const row of Object.values(editFormData || {})) {
      imputed += Number(row?.quantity) || 0;
    }
    const missing = Math.max(0, required - imputed);
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Requeridas</span>
          <strong>{required.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Imputadas</span>
          <strong>{imputed.toFixed(2)}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Faltan</span>
          <strong>{missing.toFixed(2)}</strong>
        </div>
      </div>
    );
  };



  const prevLinesSigRef = useRef("");

  // Estado para controlar cambios no guardados
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug: monitorear cambios en hasUnsavedChanges
  useEffect(() => {
    // Logs eliminados para limpiar consola
  }, [hasUnsavedChanges]);

  // Función para marcar que hay cambios
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // 🆕 Función para manejar cambios en la selección de líneas
  const handleLineSelectionChange = useCallback((newSelection) => {
    setSelectedLines(newSelection);
  }, []);

  // 🆕 Función para duplicar líneas seleccionadas
  const handleDuplicateLines = useCallback((lineIds) => {
    if (!lineIds.length) return;

    const newLines = [];
    lineIds.forEach(lineId => {
      const originalLine = lines.find(line => line.id === lineId);
      if (originalLine) {
        // 🆕 Lógica inteligente para la fecha
        let newDate = originalLine.date || "";
        
        // Si la línea original tiene fecha, verificar si ese día ya está completo
        if (newDate) {
          const originalDate = new Date(newDate);
          const dayKey = originalDate.toISOString().split('T')[0];
          
          // Calcular el total de horas para ese día
          const dayTotal = lines.reduce((total, line) => {
            if (line.date === dayKey && line.quantity) {
              return total + parseFloat(line.quantity || 0);
            }
            return total;
          }, 0);
          
          // Si el día ya está completo (8 horas), usar el día siguiente
          if (dayTotal >= 8) {
            const nextDate = new Date(originalDate);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // Verificar que el día siguiente esté dentro del período válido
            const effectiveHeader = header || editableHeader;
            if (effectiveHeader?.allocation_period) {
              const period = effectiveHeader.allocation_period;
              const match = period.match(/M(\d{2})-M(\d{2})/);
              if (match) {
                const year = 2000 + parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const fromDate = new Date(year, month, 1);
                const toDate = new Date(year, month + 1, 0);
                
                // Si el día siguiente está fuera del período, usar el día original
                if (nextDate >= fromDate && nextDate <= toDate) {
                  newDate = nextDate.toISOString().split('T')[0];
                }
              }
            }
          }
        }

        const duplicatedLine = {
          ...originalLine,
          id: `tmp-${Date.now()}-${Math.random()}`,
          quantity: 0, // Resetear cantidad para nueva línea
          date: newDate, // 🆕 Usar fecha inteligente calculada
        };
        newLines.push(duplicatedLine);
      }
    });

    if (newLines.length) {
      setLines(prev => [...prev, ...newLines]);
      // Limpiar selección después de duplicar
      setSelectedLines([]);
      markAsChanged();
    }
  }, [lines, markAsChanged, header, editableHeader]);

  // 🆕 Función para borrar líneas seleccionadas
  const handleDeleteLines = useCallback((lineIds) => {
    if (!lineIds.length) return;

    // Confirmar antes de borrar
    if (window.confirm(`¿Estás seguro de que quieres borrar ${lineIds.length} línea${lineIds.length !== 1 ? 's' : ''}?`)) {
      setLines(prev => prev.filter(line => !lineIds.includes(line.id)));
      // Limpiar selección después de borrar
      setSelectedLines([]);
      markAsChanged();
    }
  }, [markAsChanged]);

  // Función para obtener el primer día del mes del período
  const getFirstDayOfPeriod = (allocationPeriod) => {
    if (!allocationPeriod) return new Date().toISOString().split('T')[0];
    
    // Parsear período M25-M08 (año-mes)
    const match = allocationPeriod.match(/M(\d{2})-M(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1]); // 25 -> 2025
      const month = parseInt(match[2]) - 1; // M08 -> 7 (agosto, 0-indexed)
      const firstDay = new Date(year, month, 1);
      return firstDay.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  // Función para obtener el último día del mes del período
  const getLastDayOfPeriod = (allocationPeriod) => {
    if (!allocationPeriod) return new Date().toISOString().split('T')[0];
    
    // Parsear período M25-M08 (año-mes)
    const match = allocationPeriod.match(/M(\d{2})-M(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1]); // 25 -> 2025
      const month = parseInt(match[2]); // M08 -> 8 (agosto, 1-indexed para next month)
      const lastDay = new Date(year, month, 0); // Día 0 del mes siguiente = último día del mes actual
      return lastDay.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  };

  // ✅ Función para manejar cambios en las líneas desde TimesheetLines
  const handleLinesChange = useCallback((lineId, changes) => {
    // Actualizar solo el editFormData para la línea específica
    setEditFormData(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        ...changes
      }
    }));

    // Marcar que hay cambios no guardados
    markAsChanged();
  }, [markAsChanged]);

  // ✅ MUTATION: Actualizar línea individual
  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, changes, silent = false }) => {
      // Convertir fecha a formato ISO si está presente
      const processedChanges = { ...changes };
      if (processedChanges.date) {
        processedChanges.date = toIsoFromInput(processedChanges.date);
      }

      const { data, error } = await supabaseClient
        .from('timesheet')
        .update(processedChanges)
        .eq('id', lineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // ✅ Éxito: Actualizar cache local
      setLines(prev => prev.map(l => l.id === variables.lineId ? { ...l, ...variables.changes } : l));

      // ✅ Mostrar toast de éxito solo si no es silencioso
      if (!variables.silent) {
        toast.success(TOAST.SUCCESS.SAVE_LINE);
      }

      // ✅ Limpiar indicador de guardado
      setSavingByLine(prev => ({ ...prev, [variables.lineId]: false }));
    },
    onError: (error, variables) => {
      console.error('Error updating line:', error);

      // ✅ Mostrar toast de error solo si no es silencioso
      if (!variables.silent) {
        toast.error(TOAST.ERROR.SAVE_LINE);
      }

      // ✅ Limpiar indicador de guardado
      setSavingByLine(prev => ({ ...prev, [variables.lineId]: false }));
    }
  });

  // ✅ MUTATION: Eliminar línea
  const deleteLineMutation = useMutation({
    mutationFn: async (lineId) => {
      const { error } = await supabaseClient
        .from('timesheet')
        .delete()
        .eq('id', lineId);

      if (error) throw error;
      return lineId;
    },
    onSuccess: (lineId) => {
      // ✅ Éxito: Actualizar estado local
      setLines(prev => prev.filter(l => l.id !== lineId));
      setEditFormData(prev => {
        const updated = { ...prev };
        delete updated[lineId];
        return updated;
      });
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[lineId];
        return updated;
      });

      // ✅ Mostrar toast de éxito
      toast.success(TOAST.SUCCESS.DELETE_LINE);
    },
    onError: (error, lineId) => {
      console.error('Error deleting line:', error);

      // ✅ Mostrar toast de error
      toast.error(TOAST.ERROR.DELETE_LINE);
    }
  });

  // ✅ MUTATION: Insertar línea nueva
  const insertLineMutation = useMutation({
    mutationFn: async (lineData) => {
      const { data, error } = await supabaseClient
        .from('timesheet')
        .insert(lineData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newLine) => {
      // ✅ Éxito: Actualizar estado local
      setLines(prev => [...prev, newLine]);
      setEditFormData(prev => ({
        ...prev,
        [newLine.id]: newLine
      }));

      // ✅ Mostrar toast de éxito
      toast.success("Línea duplicada correctamente");
    },
    onError: (error) => {
      console.error('Error inserting line:', error);

      // ✅ Mostrar toast de error
      toast.error("Error al duplicar la línea");
    }
  });

  // 🆕 Función para guardar toda la tabla CON VALIDACIÓN
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    // 🆕 PASO 1: Validar todos los datos antes de guardar

    const validation = await validateAllData(editFormData, dailyRequired, calendarHolidays, jobs);

    // 🆕 PASO 2: Si hay errores críticos, mostrar modal y bloquear guardado
    if (!validation.isValid) {
      setValidationModal({
        show: true,
        validation
      });
      return;
    }

    // 🆕 PASO 3: Si solo hay advertencias, preguntar al usuario
    if (validation.hasWarnings) {
      setValidationModal({
        show: true,
        validation
      });
      return;
    }

    // ✅ PASO 4: Si todo es válido, proceder con el guardado
    setIsSaving(true);
    try {
      // 🆕 PASO 4.1: Si no hay header, crear uno nuevo
      let currentHeaderId = effectiveHeaderId;
      if (!currentHeaderId) {
  

        // 🆕 Obtener email del usuario usando useMsal
        let userEmail = "";
        try {
          const acct = instance.getActiveAccount() || accounts[0];
          userEmail = acct?.username || acct?.email || "";
        } catch {
          userEmail = "";
        }

        if (!userEmail) {
          throw new Error("No se pudo obtener el email del usuario");
        }

        // 🆕 Usar información de la cabecera editable si está disponible
        let headerData = editableHeader;
        if (!headerData) {
          // Fallback: obtener información del recurso de la tabla resource
          const { data: resourceData, error: resourceError } = await supabaseClient
            .from("resource")
            .select("code, name, department_code, calendar_type")
            .eq("email", userEmail)
            .single();

          if (resourceError || !resourceData) {
            throw new Error(`No se pudo obtener información del recurso: ${resourceError?.message || 'Datos no encontrados'}`);
          }

          // Construir allocation_period
          const params = new URLSearchParams(location.search);
          let ap = params.get("allocation_period");
          if (!ap) {
            const now = new Date();
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            ap = `M${yy}-M${mm}`;
          }

          headerData = {
            resource_no: resourceData.code, // Usar code del recurso
            resource_name: resourceData.name,
            department_code: resourceData.department_code,
            calendar_type: resourceData.calendar_type,
            allocation_period: ap,
            posting_date: new Date().toISOString().split('T')[0],
            posting_description: `Parte de trabajo ${ap}`,
            calendar_period_days: "" // Se llenará cuando se seleccione la fecha
          };
        }

        // PASO 1: Verificar qué valores exactos existen en calendar_period_days
        const { data: existingCalendarDays, error: calendarQueryError } = await supabaseClient
          .from("calendar_period_days")
          .select("allocation_period, calendar_code, day")
          .eq("allocation_period", headerData.allocation_period)
          .eq("calendar_code", headerData.calendar_type)
          .limit(1);
        
        if (calendarQueryError) {
          throw new Error(`Error consultando calendar_period_days: ${calendarQueryError.message}`);
        }
        
        if (!existingCalendarDays || existingCalendarDays.length === 0) {
          throw new Error(`No existen registros en calendar_period_days para período ${headerData.allocation_period} y calendario ${headerData.calendar_type}`);
        }
        
        // Usar los valores exactos que existen en la base de datos
        const existingRecord = existingCalendarDays[0];

        // PASO 2: Crear header con valores exactos que existen en calendar_period_days
        const now = new Date().toISOString();
        const newHeader = {
          id: crypto.randomUUID(), // Generar ID único manualmente
          resource_no: headerData.resource_no,
          posting_date: headerData.posting_date || new Date().toISOString().split('T')[0],
          description: headerData.resource_name, // Nombre del recurso
          posting_description: headerData.posting_description || `Parte de trabajo ${headerData.allocation_period}`,
          from_date: existingRecord.day, // ✅ Usar día exacto que existe en calendar_period_days
          to_date: existingRecord.day, // ✅ Usar día exacto que existe en calendar_period_days
          allocation_period: existingRecord.allocation_period, // ✅ Usar período exacto que existe
          resource_calendar: existingRecord.calendar_code, // ✅ Usar calendario exacto que existe
          user_email: userEmail,
          created_at: now,
          updated_at: now,
          "Company": headerData.company || null, // Campo opcional con comillas
          synced_to_bc: false, // Campo opcional
          department_code: headerData.department_code || '20' // Campo opcional con default
        };

        const { data: createdHeader, error: headerError } = await supabaseClient
          .from("resource_timesheet_header")
          .insert(newHeader)
          .select()
          .single();

        if (headerError) {
          throw new Error(`Error creando header: ${headerError.message}`);
        }

        currentHeaderId = createdHeader.id;
        setHeader(createdHeader);
        setResolvedHeaderId(currentHeaderId);


        toast.success("Nuevo parte de trabajo creado");
      }

      // PASO 4.2: Guardar líneas existentes o crear nuevas
      const linesToProcess = Object.keys(editFormData);

      for (const lineId of linesToProcess) {
        const lineData = editFormData[lineId];

        if (lineId.startsWith('tmp-')) {
          // 🆕 Línea nueva - insertar
          if (lineData.job_no && lineData.quantity && parseFloat(lineData.quantity) > 0) {
            // ✅ Obtener información del proyecto (responsable y departamento)
            const jobInfo = await fetchJobInfo([lineData.job_no]);
            
            // ✅ REUTILIZAR: Usar prepareRowForDb como las líneas existentes
            const newLineData = prepareRowForDb(lineData, jobInfo);
            
            // ✅ Asegurar que header_id sea el correcto para la nueva línea
            newLineData.header_id = currentHeaderId;

            const { data: createdLine, error: lineError } = await supabaseClient
              .from("timesheet")
              .insert(newLineData)
              .select()
              .single();

            if (lineError) {
              throw new Error(`Error creando línea: ${lineError.message}`);
            }

            // Actualizar el ID temporal por el real
            setLines(prev => prev.map(l => l.id === lineId ? createdLine : l));
            setEditFormData(prev => {
              const newData = { ...prev };
              delete newData[lineId];
              newData[createdLine.id] = { ...createdLine, date: toDisplayDate(createdLine.date) };
              return newData;
            });
          }
        } else {
          // Línea existente - actualizar si hay cambios
          const originalLine = lines.find(l => l.id === lineId);
          if (lineData && originalLine) {
            const changedFields = {};
            Object.keys(lineData).forEach(key => {
              if (lineData[key] !== originalLine[key]) {
                if (key === "date" && lineData[key]) {
                  changedFields[key] = toIsoFromInput(lineData[key]);
                } else {
                  changedFields[key] = lineData[key];
                }
              }
            });

            if (Object.keys(changedFields).length > 0) {
              await updateLineMutation.mutateAsync({
                lineId,
                changes: changedFields,
                silent: true
              });
            }
          }
        }
      }

      setHasUnsavedChanges(false);
      toast.success(TOAST.SUCCESS.SAVE_ALL);
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [hasUnsavedChanges, editFormData, lines, updateLineMutation, dailyRequired, calendarHolidays, effectiveHeaderId, location.search, editableHeader, instance, accounts]);

  // 🆕 Función para ejecutar guardado sin validación (cuando solo hay advertencias)
  const executeSaveWithoutValidation = useCallback(async () => {
    try {
      // Obtener todas las líneas con cambios
      const linesToSave = Object.keys(editFormData).filter(lineId => {
        const line = editFormData[lineId];
        const originalLine = lines.find(l => l.id === lineId);
        return line && originalLine && JSON.stringify(line) !== JSON.stringify(originalLine);
      });

      // Guardar cada línea
      for (const lineId of linesToSave) {
        const lineData = editFormData[lineId];
        const originalLine = lines.find(l => l.id === lineId);

        if (lineData && originalLine) {
          const changedFields = {};
          Object.keys(lineData).forEach(key => {
            if (lineData[key] !== originalLine[key]) {
              // Convertir fecha a formato ISO antes de enviar a la base de datos
              if (key === "date" && lineData[key]) {
                changedFields[key] = toIsoFromInput(lineData[key]);
              } else {
                changedFields[key] = lineData[key];
              }
            }
          });

          if (Object.keys(changedFields).length > 0) {
            await updateLineMutation.mutateAsync({
              lineId,
              changes: changedFields,
              silent: true  // Modo silencioso para guardado masivo
            });
          }
        }
      }

      setHasUnsavedChanges(false);
      toast.success(TOAST.SUCCESS.SAVE_ALL);
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast.error(TOAST.ERROR.SAVE_ALL);
    } finally {
      setIsSaving(false);
    }
  }, [editFormData, lines, updateLineMutation]);

  // NOTA: handleNavigateBack eliminado porque useBlocker maneja toda la navegación
  // incluyendo navegación desde botones de la interfaz

  // -- Carga inicial (por headerId o por allocation_period del mes actual)
  // Right pad se actualiza desde CalendarPanel a través de estado compartido

  useEffect(() => {
    // useEffect 1 - Carga inicial ejecutándose

    // NO resetear hasUnsavedChanges si ya hay cambios pendientes
    const shouldPreserveChanges = hasUnsavedChanges;

    async function fetchData() {
      setLoading(true);

      // 0) Construir allocation_period desde query o por defecto (mes actual)
      const params = new URLSearchParams(location.search);
      let ap = params.get("allocation_period");
      if (!ap) {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2); // "25"
        const mm = String(now.getMonth() + 1).padStart(2, "0"); // "08"
        ap = `M${yy}-M${mm}`; // p.ej. M25-M08
      }

      // 🆕 PASO 0.5: Verificar si estamos en modo "nuevo parte"
      const isNewParte = location.pathname === "/nuevo-parte";

      // 1) Resolver header a cargar
      let headerData = null;
      let headerIdResolved = headerId || null;

      if (headerIdResolved) {
        // Si tenemos headerId específico, cargarlo
        const { data: h, error: headerErr } = await supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("id", headerIdResolved)
          .single();
        if (headerErr) {
          console.error("Error cargando cabecera:", headerErr);
          toast.error("Error cargando cabecera");
        }
        headerData = h || null;
      } else if (!isNewParte) {
        // 🆕 Solo buscar por allocation_period si NO estamos en modo "nuevo parte"
        const { data: h, error: headerErr } = await supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("allocation_period", ap)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (headerErr) {
          console.error("Error cargando cabecera por allocation_period:", headerErr);
          toast.error("No se encontró cabecera para el período");
        }
        headerData = h || null;
        headerIdResolved = headerData?.id || null;
      } else {
        // 🆕 Modo "nuevo parte" - no buscar header existente
  
        headerData = null;
        headerIdResolved = null;
      }

      setHeader(headerData);
      setResolvedHeaderId(headerIdResolved);
      setDebugInfo({ ap, headerIdProp: headerId ?? null, headerIdResolved, isNewParte });

      // 2) Las líneas ahora se cargan vía React Query (ver linesQuery)
      if (!headerIdResolved) {
        // Si no encontramos cabecera, limpiamos líneas
        setLines([]);
      }

      setLoading(false);
    }

    fetchData();

    // Restaurar hasUnsavedChanges si había cambios pendientes
    if (shouldPreserveChanges) {
      // useEffect 1 - Preservando hasUnsavedChanges como true
      setHasUnsavedChanges(true);
    }
  }, [headerId, location.search, location.pathname]);

  // React Query: cargar líneas por header_id, con cache y estados
  const effectiveKey = effectiveHeaderId;
  const queryClient = useQueryClient();
  const linesHook = useTimesheetLines(effectiveKey);
  useEffect(() => {
    if (linesHook.error) toast.error("Error cargando líneas");
  }, [linesHook.error]);

  // 🆕 Cuando no hay header (nuevo parte), marcar como no cargando
  useEffect(() => {
    if (!effectiveHeaderId && !loading) {
      setLoading(false);
    }
  }, [effectiveHeaderId, loading]);

  // 🆕 Crear línea vacía cuando la información del recurso esté disponible
  useEffect(() => {
    

    if (!effectiveHeaderId && editableHeader && lines.length === 0) {
      
      addEmptyLine();
    }
  }, [effectiveHeaderId, editableHeader, lines.length]);

  // 🆕 Inicializar fecha sugerida para nuevo parte
  useEffect(() => {
    if (!effectiveHeaderId && editableHeader?.resource_no && !editableHeader.posting_date) {
      getSuggestedPartDate(editableHeader.resource_no).then(suggestedDate => {
        setEditableHeader(prev => ({
          ...prev,
          posting_date: suggestedDate
        }));
      });
    }
  }, [effectiveHeaderId, editableHeader?.resource_no, editableHeader?.posting_date]);

  // 🆕 Incrementar trigger cuando cambie el período
  useEffect(() => {
    if (editableHeader?.allocation_period) {
      setPeriodChangeTrigger(prev => prev + 1);
    }
  }, [editableHeader?.allocation_period]);

  // Cuando llegan las líneas, actualizar estado local y edición inicial con dos decimales
  useEffect(() => {
    // 🆕 Solo procesar líneas si hay header y datos del hook
    if (!effectiveHeaderId || !linesHook.data) return;

    // NO resetear hasUnsavedChanges si ya hay cambios pendientes
    const shouldPreserveChanges = hasUnsavedChanges;

    const sorted = (linesHook.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
    const linesFormatted = sorted.map((line) => ({ ...line, date: toDisplayDate(line.date) }));
    setLines(linesFormatted);
    const initialEditData = {};
    linesFormatted.forEach((line) => {
      initialEditData[line.id] = { ...line, quantity: toTwoDecimalsString(line.quantity) };
    });
    setEditFormData(initialEditData);

    // Snapshot base para detectar cambios por campo (comparación en espacio DB)
    const snap = {};
    linesFormatted.forEach((line) => {
      snap[line.id] = { ...line, quantity: toTwoDecimalsString(line.quantity) };
    });
    serverSnapshotRef.current = snap;

    // Restaurar hasUnsavedChanges si había cambios pendientes
    if (shouldPreserveChanges) {
      // useEffect 3 - Preservando hasUnsavedChanges como true
      setHasUnsavedChanges(true);
    }
  }, [linesHook.data]);

  // SOLUCIÓN DEFINITIVA: Usar useBlocker de React Router
  // Esto reemplaza todo el sistema manual de navegación

  // Bloquear navegación si hay cambios sin guardar
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Solo bloquear si hay cambios sin guardar y la ubicación cambia
      return hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname;
    }
  );

  // Mostrar modal cuando se bloquea la navegación
  useEffect(() => {
    if (blocker.state === "blocked") {
      setNavigationModal({
        show: true,
        message: 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?',
        onConfirm: () => {
          setNavigationModal({ show: false, message: "", onConfirm: null, onCancel: null });
          // Permitir la navegación bloqueada
          blocker.proceed();
        },
        onCancel: () => {
          setNavigationModal({ show: false, message: "", onConfirm: null, onCancel: null });
          // Cancelar la navegación bloqueada
          blocker.reset();
        }
      });
    }
  }, [blocker.state, blocker.proceed, blocker.reset]);

  // Control para beforeunload (cerrar pestaña, ventana, recargar)
  // useBlocker NO puede manejar estos eventos del navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // calendarHolidays seguirá disponible en este componente para validaciones
  useEffect(() => {
    if (Array.isArray(calHolidaysFromHook)) setCalendarHolidays(calHolidaysFromHook);
  }, [calHolidaysFromHook]);

  // === Validación en vivo: tope diario y festivos (no permitir imputar)
  useEffect(() => {
    // Necesitamos rangos y requeridas cargadas
    if (!calRange?.year || !calRange?.month) return;
    const hasReq = dailyRequired && Object.keys(dailyRequired).length > 0;
    if (!hasReq) return; // evitar poner cantidades a 0 antes de tener requeridas

    const holidaySet = buildHolidaySet(calendarHolidays);

    // 2) Requeridas por día
    const req = dailyRequired || {};

    // 3) Totales por día desde el formulario
    const totals = computeTotalsByIso(editFormData);

    // 4) Construir mapa de errores por línea y normalizar cantidades inválidas en festivo
    const nextErrors = {};
    let changedSomething = false;
    const nextEdit = { ...editFormData };

    for (const [id, row] of Object.entries(editFormData || {})) {
      const iso = toIsoFromInput(row?.date);
      if (!iso) continue;
      const required = Number(req[iso] || 0);
      const isHoliday = holidaySet.has(iso);
      const qNum = Number(row?.quantity) || 0;

      if (isHoliday) {
        // Festivo: no permitir imputar
        if (qNum > 0) {
          // autocorregimos a 0
          nextEdit[id] = { ...row, quantity: 0 };
          changedSomething = true;
          nextErrors[id] = { ...(nextErrors[id] || {}), date: VALIDATION.HOLIDAY_NO_HOURS };
        } else {
          nextErrors[id] = { ...(nextErrors[id] || {}), date: VALIDATION.HOLIDAY_NO_HOURS };
        }
        continue; // no más validaciones sobre festivos
      }

      // Nota: permitimos imputar aunque required <= 0 (sin error ni autocorrección)

      // Exceso sobre tope diario: marcar todas las líneas de ese día
      const totalForDay = Number(totals[iso] || 0);
      const EPS = 0.01;
      if (totalForDay > required + EPS) {
        nextErrors[id] = { ...(nextErrors[id] || {}), quantity: `Excede tope diario (${totalForDay.toFixed(2)} / ${required.toFixed(2)})` };
      }
    }

    if (changedSomething) {
      setEditFormData(nextEdit);
    }

    setErrors(nextErrors);
    setHasDailyErrors(Object.keys(nextErrors).length > 0);
  }, [editFormData, dailyRequired, calendarHolidays, calRange]);

  // -- Sincronizar estado de edición desde `lines` solo cuando cambian de verdad
  useEffect(() => {
    const safe = Array.isArray(lines) ? lines : [];
    // Firma basada SOLO en los IDs de las líneas para detectar altas/bajas, no cambios de contenido
    const idsSig = JSON.stringify(safe.map((l) => String(l.id)).sort());
    if (prevLinesSigRef.current === idsSig) return;
    prevLinesSigRef.current = idsSig;

    setEditFormData((prev) => {
      const next = { ...prev };

      // Conjunto de IDs actuales en `lines`
      const currentIds = new Set(safe.map((l) => String(l.id)));

      // 1) Agregar líneas nuevas que aún no estén en `editFormData` (NO sobrescribe las existentes)
      for (const l of safe) {
        const id = String(l.id);
        if (!(id in next)) {
          next[id] = {
            ...l,
            date: toDisplayDate(l.date),
            quantity: toTwoDecimalsString(l.quantity),
          };
        }
      }

      // 2) (Opcional) Eliminar de `editFormData` las líneas que ya no existen en `lines`
      for (const id of Object.keys(next)) {
        if (!currentIds.has(String(id))) {
          delete next[id];
        }
      }

      return next;
    });
  }, [lines]);

  // Festivos ahora los aporta el hook

  // -- Crear nueva línea local
  const addEmptyLine = () => {
    const newId = `tmp-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Obtener información del usuario actual para la nueva línea
    const getResourceInfo = async () => {
      try {
        // 🆕 Usar useMsal para obtener el email del usuario
        let userEmail = "";
        try {
          const acct = instance.getActiveAccount() || accounts[0];
          userEmail = acct?.username || acct?.email || "";
        } catch {
          userEmail = "";
        }

        if (userEmail) {
          // Consultar la tabla resource usando el campo email
          const { data: resourceData } = await supabaseClient
            .from("resource")
            .select("code, department_code, calendar_type")
            .eq("email", userEmail)
            .single();
          
          if (resourceData) {
            return {
              user_email: userEmail,
              department_code: resourceData.department_code,
              calendar_type: resourceData.calendar_type
            };
          }
        }
      } catch (error) {
        console.error("Error obteniendo información del recurso:", error);
      }
      return null;
    };

    // Crear línea con información disponible
    const newLine = {
      id: newId,
      header_id: effectiveHeaderId || null, // Puede ser null para nuevos partes
      job_no: "",
      job_task_no: "",
      description: "",
      work_type: "",
      quantity: "0.00",
      date: "",
      department_code: header?.department_code || "",
      company: header?.company || "",
      creado: nowIso,
      job_no_and_description: "",
      job_responsible: "",
      job_responsible_approval: true, // siempre TRUE
      resource_no: header?.resource_no || "",
      resource_responsible: header?.resource_no || "", // fallback razonable
    };

    setLines((prev) => [...prev, newLine]);
    setEditFormData((prev) => ({
      ...prev,
      [newId]: { ...newLine },
    }));

    // Obtener información del recurso en background y actualizar si es necesario
    getResourceInfo().then(resourceInfo => {
      if (resourceInfo) {
        setEditFormData(prev => ({
          ...prev,
          [newId]: {
            ...prev[newId],
            department_code: resourceInfo.department_code,
            company: resourceInfo.company,
            resource_no: resourceInfo.code,
            resource_responsible: resourceInfo.code
          }
        }));
      }
    });

    return newId;
  };

  // -- Buscar responsables de job
  const fetchJobResponsibles = async (jobNos) => {
    if (!jobNos || jobNos.length === 0) return {};
    const unique = Array.from(new Set(jobNos.filter(Boolean)));
    if (unique.length === 0) return {};
    const { data, error } = await supabaseClient
      .from("job")
      .select("no,responsible")
      .in("no", unique);
    if (error) {
      console.error("Error buscando responsables de job:", error);
      return {};
    }
    const map = {};
    for (const r of data) {
      map[r.no] = r.responsible ?? "";
    }
    return map;
  };

  // -- Buscar información del proyecto (responsable y departamento)
  const fetchJobInfo = async (jobNos) => {
    if (!jobNos || jobNos.length === 0) return {};
    const unique = Array.from(new Set(jobNos.filter(Boolean)));
    if (unique.length === 0) return {};
    
    // ✅ Obtener columnas que existen en la tabla job (departamento, no department_code)
    const { data, error } = await supabaseClient
      .from("job")
      .select("no,responsible,departamento")
      .in("no", unique);
      
    if (error) {
      console.error("Error buscando información del job:", error);
      return {};
    }
    
    const map = {};
    for (const r of data) {
      map[r.no] = {
        responsible: r.responsible ?? "",
        department_code: r.departamento ?? "" // ✅ Usar departamento del proyecto
      };
    }
    
    return map;
  };

  // -- Preparar datos para DB
  const prepareRowForDb = (row, jobResponsibleMap) => {
    const out = {};
    for (const key of SAFE_COLUMNS) {
      if (key === "date") {
        if (row.date) {
          const [dd, mm, yyyy] = row.date.split("/");
          out.date = `${yyyy}-${mm}-${dd}`;
        } else {
          out.date = null;
        }
      } else if (key === "header_id") {
        out.header_id = effectiveHeaderId;
      } else if (key === "company") {
        out.company = header?.company ?? row.company ?? "";
      } else if (key === "creado") {
        out.creado = row.creado ?? new Date().toISOString();
      } else if (key === "job_no_and_description") {
        const j = row.job_no || "";
        const d = row.description || "";
        out.job_no_and_description = (j && d) ? `${j} - ${d}` : `${j}${d}`;
      } else if (key === "job_responsible") {
        const jobNo = row.job_no || "";
        const resolved = jobResponsibleMap?.[jobNo];
        out.job_responsible = resolved ?? row.job_responsible ?? "";
      } else if (key === "job_responsible_approval") {
        out.job_responsible_approval = true; // forzar TRUE
      } else if (key === "resource_no") {
        out.resource_no = row.resource_no ?? header?.resource_no ?? "";
      } else if (key === "resource_responsible") {
        out.resource_responsible = row.resource_responsible ?? header?.resource_no ?? "";
      } else if (key === "department_code") {
        // ✅ Obtener departamento del proyecto, no del recurso
        const jobNo = row.job_no || "";
        const jobInfo = jobResponsibleMap?.[jobNo];
        
        if (jobInfo && typeof jobInfo === 'object' && jobInfo.department_code) {
          out.department_code = jobInfo.department_code;
        } else {
          out.department_code = row.department_code ?? "";
        }
      } else if (key === "quantity") {
        out.quantity = Number(row.quantity) || 0;
      } else {
        out[key] = row[key] ?? null;
      }
    }
    return out;
  };

  // -- Festivos: obtener lista de fechas ISO (YYYY-MM-DD) de los festivos
  const festivos = useMemo(
    () => (calendarHolidays || []).map((h) => (h.day || "").slice(0, 10)),
    [calendarHolidays]
  );

  // -- Hook de edición (modificado para interceptar cambios de fecha/cantidad)
  const {
    inputRefs,
    setSafeRef,
    hasRefs,
    calendarOpenFor,
    setCalendarOpenFor,
    handleDateInputChange,
    handleDateInputBlur,
    handleInputFocus,
    handleKeyDown,
  } = useTimesheetEdit({
    header,
    lines,
    editFormData,
    setEditFormData,
    setErrors,
    calendarHolidays,
    addEmptyLine,
  });

  // -- Router de cambios por campo: deriva quantity/date a sus handlers y el resto al handler original
  const handleInputChange = useCallback(async (lineId, event) => {
    const { name, value } = event.target;
    
                // ✅ Si se cambia el proyecto, obtener automáticamente el departamento
        if (name === "job_no" && value) {
          try {
            // Obtener información del proyecto (responsable y departamento)
            const jobInfo = await fetchJobInfo([value]);
            
            // ✅ Establecer responsable del proyecto y departamento del recurso
            setEditFormData(prev => {
              const newData = {
                ...prev[lineId],
                [name]: value,
                department_code: jobInfo[value]?.department_code || editableHeader?.department_code || "20", // ✅ Departamento del proyecto, recurso o default
                job_responsible: jobInfo[value]?.responsible || "" // ✅ Responsable del proyecto
              };
              
              return {
                ...prev,
                [lineId]: newData
              };
            });
          } catch (error) {
            console.error(`Error obteniendo info del proyecto:`, error);
            // En caso de error, usar valor normal
            setEditFormData(prev => ({
              ...prev,
              [lineId]: {
                ...prev[lineId],
                [name]: value
              }
            }));
          }
        } else {
          // Para otros campos, comportamiento normal
          setEditFormData(prev => ({
            ...prev,
            [lineId]: {
              ...prev[lineId],
              [name]: value
            }
          }));
        }

    // Marcar que hay cambios no guardados
    markAsChanged();

    // Limpiar errores del campo
    setErrors(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [name]: null
      }
    }));
  }, [markAsChanged, fetchJobInfo]);

  // -- Función unificada para validar rango de fechas
  const validateDateRange = (date, headerData) => {
    if (!headerData) return { isValid: true, error: null };
    
    const selectedDate = new Date(date);
    
    // ✅ Para inserción: calcular fechas del período si no están definidas
    let fromDate = headerData.from_date ? new Date(headerData.from_date) : null;
    let toDate = headerData.to_date ? new Date(headerData.to_date) : null;
    
    // Si no hay fechas pero sí hay período, calcularlas
    if ((!fromDate || !toDate) && headerData.allocation_period) {
      fromDate = new Date(getFirstDayOfPeriod(headerData.allocation_period));
      toDate = new Date(getLastDayOfPeriod(headerData.allocation_period));
    }
    
    // Si no hay rango definido, permitir cualquier fecha
    if (!fromDate || !toDate) return { isValid: true, error: null };
    
    // Validar que la fecha esté dentro del rango
    if (selectedDate < fromDate || selectedDate > toDate) {
      return {
        isValid: false,
        error: `La fecha debe estar entre ${fromDate.toLocaleDateString()} y ${toDate.toLocaleDateString()}`
      };
    }
    
    return { isValid: true, error: null };
  };

  // -- Obtener fecha sugerida para nuevo parte (último día del mes siguiente al último)
  const getSuggestedPartDate = async (resourceNo) => {
    if (!resourceNo) return new Date().toISOString().split('T')[0];
    
    try {
      // Obtener el último timesheet del recurso
      const { data: lastHeader, error } = await supabaseClient
        .from("resource_timesheet_header")
        .select("to_date")
        .eq("resource_no", resourceNo)
        .order("to_date", { ascending: false })
        .limit(1)
        .single();
      
      if (error || !lastHeader?.to_date) {
        // Si no hay timesheets previos, usar fecha actual
        return new Date().toISOString().split('T')[0];
      }
      
      // ✅ Obtener el ÚLTIMO día del mes siguiente al último timesheet
      const lastDate = new Date(lastHeader.to_date);
      const nextMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 1);
      const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
      
      return lastDayOfNextMonth.toISOString().split('T')[0];
    } catch (error) {
      console.error("Error obteniendo fecha sugerida:", error);
      return new Date().toISOString().split('T')[0];
    }
  };

  // -- Custom handleDateChange
  const handleDateChange = (id, value) => {
    // value puede ser "dd/MM/yyyy" o similar
    const iso = toIsoFromInput(value);
    
    // ✅ Validar rango de fechas (funciona tanto para edición como inserción)
    const headerForValidation = header || editableHeader;
    const rangeValidation = validateDateRange(iso, headerForValidation);
    
    if (!rangeValidation.isValid) {
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          date: value,
          quantity: 0,
          isOutOfRange: true,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), date: rangeValidation.error },
      }));
      markAsChanged();
      return;
    }
    
    if (festivos.includes(iso)) {
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          date: value,
          quantity: 0,
          isHoliday: true,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), date: VALIDATION.HOLIDAY_NO_HOURS },
      }));
      markAsChanged();
      return;
    }
    
    // Si no es festivo ni está fuera de rango, limpiar flags y error
    setEditFormData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        date: value,
        isHoliday: false,
        isOutOfRange: false,
      },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      const e = { ...(next[id] || {}) };
      delete e.date;
      if (Object.keys(e).length === 0) delete next[id];
      else next[id] = e;
      return next;
    });
    markAsChanged();
  };

  // -- Custom handleQuantityChange
  const handleQuantityChange = (id, value) => {
    const row = editFormData[id] || {};
    const iso = toIsoFromInput(row?.date);
    // Si la fila es festivo (por isHoliday o porque la fecha está en festivos)
    if (row?.isHoliday || festivos.includes(iso)) {
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: 0,
        },
      }));
      setErrors((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || {}), date: VALIDATION.HOLIDAY_NO_HOURS },
      }));
      markAsChanged();
      return;
    }
    // Si no es festivo, actualizar cantidad normalmente
      setEditFormData((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          quantity: value,
        },
      }));
    markAsChanged();
  };

  // -- Guardar cambios
  const saveAllEdits = async () => {
    if (hasDailyErrors) {
      toast.error("Corrige los errores diarios antes de guardar");
      return;
    }
    let errorOccurred = false;
    const ids = Object.keys(editFormData);
    const toInsertIds = ids.filter((id) => String(id).startsWith("tmp-"));
    const toUpdateIds = ids.filter((id) => !String(id).startsWith("tmp-"));

    const allRowsToSave = [...toInsertIds, ...toUpdateIds].map((id) => editFormData[id] || {});
    const jobNosNeeded = allRowsToSave
      .filter((r) => r.job_no) // ✅ Obtener info de TODOS los proyectos para departamento
      .map((r) => r.job_no);

    const jobResponsibleMap = await fetchJobInfo(jobNosNeeded);

    // INSERT
    if (toInsertIds.length > 0) {
      const rowsToInsert = toInsertIds.map((id) => prepareRowForDb(editFormData[id], jobResponsibleMap));
      const { error: insertErr } = await supabaseClient.from("timesheet").insert(rowsToInsert);
      if (insertErr) {
        console.error("Error insertando nuevas líneas:", insertErr);
        errorOccurred = true;
      }
    }

    // UPDATE
    for (const id of toUpdateIds) {
      const row = prepareRowForDb(editFormData[id], jobResponsibleMap);
      const { error } = await supabaseClient.from("timesheet").update(row).eq("id", id);
      if (error) {
        console.error(`Error actualizando línea ${id}:`, error);
        errorOccurred = true;
      }
    }

    if (errorOccurred) {
      toast.error("Hubo errores al guardar");
      return;
    }

    toast.success("Guardado correctamente");
    setLastSavedAt(new Date());

    // Invalidate para que React Query recargue líneas
    try {
      await queryClient.invalidateQueries({ queryKey: ["lines", effectiveHeaderId] });
    } catch {}
  };

  if (loading && effectiveHeaderId) return <div>Cargando datos...</div>;

  return (
    <div className="ts-responsive">
      <div className="timesheet-container">
        {/* Header de navegación */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          {/* Botón circular solo con el icono */}
          <button
            type="button"
            aria-label="Lista Parte Trabajo"
            onClick={() => navigate("/")}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#D8EEF1"; // hover suave
              e.currentTarget.style.borderColor = "#007E87";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#EAF7F9";
              e.currentTarget.style.borderColor = "rgba(0,126,135,0.35)";
            }}
            style={{
              width: 36,
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              border: "1px solid rgba(0,126,135,0.35)",
              background: "#EAF7F9",
              padding: 0,
              cursor: "pointer",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 6L9 12L15 18" stroke="#007E87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {/* Etiqueta clickable con el mismo color del botón Editar, modificado a color negro */}
          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Ir a lista de parte de trabajo"
            style={{
              background: "transparent",
              border: "none",
              color: "#000",
              fontWeight: 700,
              fontSize: "22px",
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
          >
            {header ? "Editar Parte de Trabajo" : "Nuevo Parte de Trabajo"}
          </button>
        </div>

        {/* Sección del header y calendario - altura fija */}
        <div className="timesheet-header-section">
          {/* Header, resumen y calendario en la misma fila, alineados a la derecha */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {/* Header a la izquierda */}
            <div style={{ flex: 1 }}>
              <TimesheetHeader
                header={header}
                onHeaderChange={setEditableHeader}
              />
            </div>

            {/* Panel derecho con resumen y calendario - fijo a la derecha */}
            <div style={{ marginLeft: 24, flexShrink: 0 }}>
              <CalendarPanel
                calRange={calRange}
                firstOffset={firstOffset}
                calendarDays={calendarDays}
                requiredSum={requiredSum}
                imputedSum={imputedSum}
                missingSum={missingSum}
                rightPadState={[rightPad, setRightPad]}
              />
            </div>
          </div>
        </div>

        {/* Sección de líneas - ocupa todo el espacio restante */}
        <div className="timesheet-lines-section">
          {/* Controles de líneas */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
            <button
              onClick={saveAllChanges}
              disabled={!hasUnsavedChanges || isSaving}
              style={{
                padding: "8px 16px",
                backgroundColor: hasUnsavedChanges ? "#007bff" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: hasUnsavedChanges && !isSaving ? "pointer" : "not-allowed",
                fontSize: "14px",
                fontWeight: "500"
              }}
            >
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {/* Contenedor de la tabla - ocupa todo el espacio disponible */}
          <div className="timesheet-table-container" style={{ width: "100%" }}>
            <TimesheetLines
              lines={lines}
              editFormData={editFormData}
              errors={errors}
              inputRefs={inputRefs}
              hasRefs={hasRefs}
              setSafeRef={setSafeRef}
              calendarOpenFor={calendarOpenFor}
              setCalendarOpenFor={setCalendarOpenFor}
              handleInputChange={handleInputChange}
              handleDateInputChange={handleDateChange}
              handleDateInputBlur={handleDateInputBlur}
              handleInputFocus={handleInputFocus}
              handleKeyDown={handleKeyDown}
              header={header}
              editableHeader={editableHeader}
              periodChangeTrigger={periodChangeTrigger} // 🆕 Pasar trigger para forzar re-renderizado
              calendarHolidays={calendarHolidays}
              scheduleAutosave={() => {}} // Eliminado
              saveLineNow={() => {}} // Eliminado
              savingByLine={savingByLine}
              onLinesChange={handleLinesChange}
              deleteLineMutation={deleteLineMutation}
              insertLineMutation={insertLineMutation}
              markAsChanged={markAsChanged}
              // 🆕 Nuevas props para selección de líneas
              onLineSelectionChange={handleLineSelectionChange}
              selectedLines={selectedLines}
              onDuplicateLines={handleDuplicateLines}
              onDeleteLines={handleDeleteLines}
            />
          </div>
        </div>
      </div>

      {/* Modal de confirmación de navegación */}
      <BcModal
        isOpen={navigationModal.show}
        onClose={() => setNavigationModal({ show: false, message: "", onConfirm: null, onCancel: null })}
        title="Confirmar navegación"
        confirmText="Sí, salir"
        cancelText="No, cancelar"
        onConfirm={navigationModal.onConfirm}
        onCancel={navigationModal.onCancel}
        confirmButtonType="danger"
      >
        <p>{navigationModal.message}</p>
      </BcModal>

      {/* 🆕 Modal de errores de validación */}
      <ValidationErrorsModal
        isOpen={validationModal.show}
        onClose={() => setValidationModal({ show: false, validation: null })}
        validation={validationModal.validation}
        onGoToError={(lineId) => {
          // Cerrar modal y enfocar la línea con error
          setValidationModal({ show: false, validation: null });

          // Encontrar y enfocar la línea con error
          setTimeout(() => {
            const firstErrorField = Object.keys(validationModal.validation?.errors[lineId] || {})[0];
            if (firstErrorField && inputRefs.current?.[lineId]?.[firstErrorField]) {
              inputRefs.current[lineId][firstErrorField].focus();
              inputRefs.current[lineId][firstErrorField].select();
            }
          }, 100);
        }}
        onContinueAnyway={() => {
          // Cerrar modal y continuar con el guardado (solo advertencias)
          setValidationModal({ show: false, validation: null });

          // Ejecutar guardado sin validación (ya sabemos que solo hay advertencias)
          setIsSaving(true);
          executeSaveWithoutValidation();
        }}
      />
    </div>
  );
}

export default TimesheetEdit;
