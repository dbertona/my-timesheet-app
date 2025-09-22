// src/components/TimesheetEdit.jsx
import { useMsal } from "@azure/msal-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { toast } from "react-hot-toast";
import { useBlocker, useLocation, useNavigate } from "react-router-dom";
import { getServerDate } from "../api/date";
import { TOAST, VALIDATION } from "../constants/i18n";
import useCalendarData from "../hooks/useCalendarData";
import useTimesheetEdit from "../hooks/useTimesheetEdit";
import useTimesheetLines from "../hooks/useTimesheetLines";
import { useAllJobs } from "../hooks/useTimesheetQueries";
import { supabaseClient } from "../supabaseClient";
import {
    buildHolidaySet,
    computeTotalsByIso,
    validateAllData,
} from "../utils/validation";
import TimesheetHeader from "./TimesheetHeader";
import TimesheetLines from "./TimesheetLines";
import CalendarPanel from "./timesheet/CalendarPanel";
import ApprovalModal from "./ui/ApprovalModal";
import BackToDashboard from "./ui/BackToDashboard";
import BcModal from "./ui/BcModal";
import ValidationErrorsModal from "./ui/ValidationErrorsModal";
/* eslint-disable react-hooks/exhaustive-deps */
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
  "company_name", // Campo requerido por la tabla timesheet
  "creado",
  "job_no_and_description",
  "job_responsible",
  "job_responsible_approval", // siempre true
  "resource_no", // NUEVO
  "resource_responsible", // NUEVO
  "isFactorialLine", // 🆕 Marca para líneas de Factorial (no editables)
];

function TimesheetEdit({ headerId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { instance, accounts } = useMsal();

  const [header, setHeader] = useState(null);
  const isReadOnly = Boolean(header?.synced_to_bc === true || String(header?.synced_to_bc) === 'true' || String(header?.synced_to_bc) === 't');
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [calendarHolidays, setCalendarHolidays] = useState([]);
  const [showCalendarNotFoundModal, setShowCalendarNotFoundModal] =
    useState(false);
  const [calendarNotFoundData, setCalendarNotFoundData] = useState({});
  const [rightPad, setRightPad] = useState(234);
  const headerBarRef = useRef(null);
  const headerSectionRef = useRef(null);
  const tableContainerRef = useRef(null);
  const footerRef = useRef(null); // Ref para el pie de página

  // LÓGICA DE CÁLCULO DE ALTURA PRECISA BASADA EN MEDICIÓN
  useLayoutEffect(() => {
    const calculateAndSetHeight = () => {
      const tableContainer = tableContainerRef.current;

      if (tableContainer) {
        const viewportHeight = window.innerHeight;
        const tableTopPosition = tableContainer.getBoundingClientRect().top;
        const bottomMargin = 16; // margen de seguridad

        const availableHeight = Math.max(120, Math.floor(viewportHeight - tableTopPosition - bottomMargin));

        // Solo establecer max-height, no height fijo
        tableContainer.style.height = 'auto';
        tableContainer.style.maxHeight = `${availableHeight}px`;
        tableContainer.style.overflowY = 'auto';
        tableContainer.style.overflowX = 'hidden';
      }
    };

    // Ejecutar al montar y al cambiar el tamaño de la ventana
    requestAnimationFrame(() => {
      calculateAndSetHeight();
      setTimeout(calculateAndSetHeight, 50);
      setTimeout(calculateAndSetHeight, 120);
    });
    window.addEventListener('resize', calculateAndSetHeight);

    // Ejecutar con un pequeño retraso cuando los datos cambien
    const timeoutId = setTimeout(calculateAndSetHeight, 80);

    return () => {
      window.removeEventListener('resize', calculateAndSetHeight);
      clearTimeout(timeoutId);
    };
  }, [lines]); // Recalcular si las líneas cambian

  // Efecto para añadir/quitar la clase 'no-scroll' del body
  useEffect(() => {
    document.body.classList.add('no-scroll');
    // Función de limpieza para quitar la clase cuando el componente se desmonte
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, []); // El array vacío asegura que se ejecute solo al montar/desmontar

  const [editableHeader, setEditableHeader] = useState(null); // 🆕 Cabecera editable para nuevos partes
  const [periodChangeTrigger, setPeriodChangeTrigger] = useState(0); // 🆕 Trigger para forzar re-renderizado cuando cambie el período
  const [selectedLines, setSelectedLines] = useState([]); // 🆕 Líneas seleccionadas para acciones múltiples
  const [deletedLineIds, setDeletedLineIds] = useState([]); // 🆕 IDs de líneas eliminadas pendientes de borrar en BD

  // 🆕 Fecha del servidor para unificar comportamiento con el dashboard
  const [serverDate, setServerDate] = useState(null);

  // 🆕 Estados para funcionalidad de aprobación
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [availableDaysForApproval, setAvailableDaysForApproval] = useState([]);

  // 🆕 Función helper para ordenar líneas: por fecha, con temporales al final
  const sortLines = useCallback((lines) => {
    return [...lines].sort((a, b) => {
      // Líneas temporales (tmp-) siempre al final
      const aIsTmp = String(a.id || "").startsWith("tmp-");
      const bIsTmp = String(b.id || "").startsWith("tmp-");

      if (aIsTmp && !bIsTmp) return 1; // a va después de b
      if (!aIsTmp && bIsTmp) return -1; // a va antes de b
      if (aIsTmp && bIsTmp) return 0; // mantener orden original entre tmp

      // Para líneas normales, ordenar por fecha
      // Las fechas vacías van al final (después de las fechas válidas)
      const dateA =
        a.date && a.date.trim() !== ""
          ? new Date(a.date)
          : new Date("9999-12-31");
      const dateB =
        b.date && b.date.trim() !== ""
          ? new Date(b.date)
          : new Date("9999-12-31");
      return dateA - dateB;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const d = await getServerDate();
        if (mounted) setServerDate(d);
      } catch {
        if (mounted) setServerDate(new Date());
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // IDs de cabecera resueltos antes de usar hooks que dependen de ello
  // debugInfo eliminado por no uso
  const [resolvedHeaderId, setResolvedHeaderId] = useState(null);
  const effectiveHeaderId = useMemo(
    () => resolvedHeaderId ?? header?.id ?? headerId ?? null,
    [resolvedHeaderId, header?.id, headerId]
  );

  // === Calendario (estado + helpers) ahora en hook dedicado

  // Para edición: usar siempre el header existente, no editableHeader
  const headerForCalendar = header || editableHeader;

  const {
    calRange,
    firstOffset,
    calendarDays,
    dailyRequired,
    calendarHolidays: calHolidaysFromHook,
    requiredSum,
    imputedSum,
    missingSum,
  } = useCalendarData(headerForCalendar, resolvedHeaderId, editFormData);

  // 🆕 Obtener jobs para validación de estado (TODOS los proyectos del recurso)
  const jobsQuery = useAllJobs((header || editableHeader)?.resource_no);
  const jobs = useMemo(() => jobsQuery.data || [], [jobsQuery.data]);
  const [hasDailyErrors, setHasDailyErrors] = useState(false);
  // Estado de validación de proyecto no usado actualmente
  const [_hasProjectValidationErrors, _setHasProjectValidationErrors] =
    useState(false);

  // 🆕 Función para verificar si hay errores de validación de proyecto
  const checkProjectValidationErrors = useCallback(() => {
    if (!jobs.length || !Object.keys(editFormData).length) return false;

    for (const [__unused, row] of Object.entries(editFormData)) {
      if (row.job_no && row.quantity && parseFloat(row.quantity) > 0) {
        const project = jobs.find((j) => j.no === row.job_no);
        if (
          project &&
          (project.status === "Completed" || project.status === "Lost")
        ) {
          return true;
        }
      }
    }
    return false;
  }, [jobs, editFormData]);

  // 🆕 Función para detectar días completos disponibles para aprobación
  const getAvailableDaysForApproval = useCallback(() => {
    if (!calendarDays || !lines) {
      return [];
    }

    const availableDays = [];
    const EPS = 0.01;

    calendarDays.forEach((day) => {
      // Solo días completos (verde en el calendario)
      if (day.status === "completo") {
        // Verificar que no estén ya en estado Pending
        const dayLines = lines.filter((line) => {
          // Usar toIsoFromInput para convertir DD/MM/YYYY a YYYY-MM-DD
          const lineDate = line.date ? toIsoFromInput(line.date) : null;
          return lineDate === day.iso;
        });

        // Si hay líneas del día y ninguna está en estado Pending
        const hasPendingLines = dayLines.some(
          (line) => line.status === "Pending"
        );

        // 🆕 Excluir días que solo tienen líneas de Factorial (ya aprobadas)
        const hasNonFactorialLines = dayLines.some(
          (line) => !line.isFactorialLine
        );

        if (dayLines.length > 0 && !hasPendingLines && hasNonFactorialLines) {
          availableDays.push({
            date: day.iso,
            requiredHours: day.need,
            imputedHours: day.got,
            dayNumber: day.d,
          });
        }
      }
    });

    return availableDays;
  }, [calendarDays, lines]);

  // 🆕 useEffect para actualizar días disponibles para aprobación
  useEffect(() => {
    const availableDays = getAvailableDaysForApproval();
    setAvailableDaysForApproval(availableDays);
  }, [getAvailableDaysForApproval]);

  // 🆕 useEffect para actualizar el estado de errores de validación de proyecto
  useEffect(() => {
    const hasErrors = checkProjectValidationErrors();
    _setHasProjectValidationErrors(hasErrors);
  }, [checkProjectValidationErrors]);

  const serverSnapshotRef = useRef({}); // Último estado confirmado por servidor por línea
  const [savingByLine, setSavingByLine] = useState({}); // { [id]: boolean }
  const createdInitialLineRef = useRef(false); // Para crear 1 sola línea en /nuevo-parte

  // Estado para el modal de confirmación de navegación
  const [navigationModal, setNavigationModal] = useState({
    show: false,
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  // 🆕 Estado para el modal de errores de validación
  const [validationModal, setValidationModal] = useState({
    show: false,
    validation: null,
  });

  // 🆕 Estado para el modal de confirmación de eliminación
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    show: false,
    lineIds: [],
    onConfirm: null,
  });

  // Bandera para evitar múltiples modales
  const [_isNavigating, _setIsNavigating] = useState(false);

  // Helpers no usados eliminados (parseAllocationPeriod, daysInMonth, isoOf)
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
        return format(
          new Date(Number(y), Number(m) - 1, Number(d)),
          "dd/MM/yyyy"
        );
      } catch {
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

  // formatTimeAgo eliminado por no uso

  // Pequeño componente para mostrar totales del mes dentro del panel del calendario
  const TotalsForMonth = ({ dailyRequired, editFormData }) => {
    const required = Object.values(dailyRequired || {}).reduce(
      (acc, v) => acc + (Number(v) || 0),
      0
    );
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

  // 🆕 Resetear estilo del botón cuando cambie isSaving
  useEffect(() => {
    if (!isSaving) {
      // Resetear el estilo del botón cuando termine de guardar
      const saveButton = document.querySelector(
        'button[onclick*="saveAllChanges"]'
      );
      if (saveButton) {
        saveButton.style.backgroundColor = "#ffffff";
      }
    }
  }, [isSaving]);

  // Función para marcar que hay cambios
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // 🆕 Función para manejar cambios en la selección de líneas
  const handleLineSelectionChange = useCallback((newSelection) => {
    setSelectedLines(newSelection);
  }, []);

  // 🆕 Función para importar vacaciones desde Factorial
  const handleImportFactorial = useCallback(async () => {
    try {
      // 🆕 Buscar el proyecto de vacaciones del recurso
      let vacationProject = null;

      // Obtener el department_code del recurso actual
      // Priorizar editableHeader sobre header para obtener el departamento correcto
      const currentResource = editableHeader || header;
      const resourceDepartment = currentResource?.department_code || "1-01"; // Fallback a '1-01'

      try {
        // Buscar en la tabla job por departamento y nombre -VAC

        const { data: jobData, error: jobError } = await supabaseClient
          .from("job")
          .select("no, description, departamento, status")
          .eq("departamento", resourceDepartment)
          .ilike("no", "%-VAC%")
          .eq("status", "Open")
          .limit(1);

        if (jobData && jobData.length > 0 && !jobError) {
          vacationProject = jobData[0]; // Tomar el primer elemento del array
        } else {
          // Intentar buscar proyecto genérico de vacaciones
          const { data: genericJob, error: genericError } = await supabaseClient
            .from("job")
            .select("no, description, departamento, status")
            .ilike("no", "%-VAC%")
            .eq("status", "Open")
            .limit(1);

          if (genericJob && genericJob.length > 0 && !genericError) {
            vacationProject = genericJob[0]; // Tomar el primer elemento del array
          }
        }
      } catch (error) {
        console.error("❌ Error buscando proyecto de vacaciones:", error);
      }

      // Email fijo para pruebas
      let userEmail = "";
      try {
        const acct = instance.getActiveAccount() || accounts[0];
        userEmail = acct?.username || acct?.email || "";
      } catch {
        userEmail = "";
      }
      if (!userEmail) {
        toast.error(
          "No se pudo obtener el email del usuario para importar Factorial"
        );
        return;
      }

      // Declarar variables de fechas
      let startDate, endDate;

      // Usar directamente las fechas del calendario ya cargado
      if (!calendarDays || calendarDays.length === 0) {
        // Si no hay calendario, intentar usar el header existente
        if (header && header.allocation_period) {
          startDate = getFirstDayOfPeriod(header.allocation_period);
          endDate = getLastDayOfPeriod(header.allocation_period);
        } else {
          toast.error("No hay calendario disponible ni header con período");
          return;
        }
      } else {
        startDate = calendarDays[0].iso; // Primer día del calendario
        endDate = calendarDays[calendarDays.length - 1].iso; // Último día del calendario
      }

      // 🆕 Función para obtener vacaciones reales desde Factorial vía tu servidor
      const getFactorialVacations = async (userEmail, startDate, endDate) => {
        try {
          const response = await fetch("/api/factorial/vacations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail, startDate, endDate }),
          });

          if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          return response.json();
        } catch (error) {
          console.error("Error obteniendo vacaciones de Factorial:", error);
          throw error;
        }
      };

      // Obtener vacaciones reales desde Factorial
      let vacations = [];
      try {
        vacations = await getFactorialVacations(userEmail, startDate, endDate);
      } catch (error) {
        // Manejo específico si backend no puede resolver empresa
        const msg = String(error?.message || "");
        if (msg.includes("company_not_resolved") || msg.includes("424")) {
          toast.error(
            "No se pudo resolver la empresa del recurso en testing (faltan credenciales)."
          );
        } else {
          console.error("❌ Error obteniendo vacaciones:", error);
        }
        vacations = [];
      }

      if (!vacations || vacations.length === 0) {
        toast("No se encontraron vacaciones para este período", { icon: "ℹ️" });
        return;
      }

      // 🆕 VALIDACIÓN PREVIA: Verificar si ya hay líneas de ausencias en el período
      const _existingAbsencesInPeriod = lines.filter(
        (line) =>
          ["VACACIONES", "BAJAS", "PERMISOS"].includes(line.work_type) &&
          line.date >= toDisplayDate(startDate) &&
          line.date <= toDisplayDate(endDate)
      );

      // 🆕 MAPEO INTELIGENTE: Convertir tipo de Factorial a tarea del sistema
      const getTaskFromFactorialType = (tipo) => {
        const taskMapping = {
          Vacaciones: "VACACIONES",
          Enfermedad: "BAJAS",
          "Asuntos personales (1,5 días por año trabajado)": "PERMISOS",
          "Día de cumpleaños": "PERMISOS",
          "Maternidad / Paternidad": "BAJAS",
          Otro: "PERMISOS",
          "Permiso de mudanza": "PERMISOS",
          "Permiso por accidente, enfermedad grave u hospitalización de un familiar (PAS)":
            "PERMISOS",
          "Permiso por matrimonio": "PERMISOS",
        };

        const task = taskMapping[tipo] || "PERMISOS"; // Default a PERMISOS si no hay mapeo
        return task;
      };

      // Crear líneas de timesheet para cada día de vacaciones
      const newLines = [];
      for (const vacation of vacations) {
        const start = new Date(vacation.desde);
        const end = new Date(vacation.hasta);

        // Iterar por cada día de vacaciones
        for (
          let date = new Date(start);
          date <= end;
          date.setDate(date.getDate() + 1)
        ) {
          const dateStr = date.toISOString().split("T")[0];

          // Verificar que la fecha esté dentro del período del timesheet
          if (dateStr >= startDate && dateStr <= endDate) {
            // Verificar si es día festivo
            const isHoliday = calendarHolidays.some(
              (holiday) => holiday.day === dateStr
            );
            if (isHoliday) {
              continue; // Saltar este día
            }

            // 🆕 VALIDACIÓN: Verificar si ya existe una línea de ausencias para esta fecha
            const existingAbsenceLine = lines.find(
              (line) =>
                line.date === toDisplayDate(dateStr) &&
                ["VACACIONES", "BAJAS", "PERMISOS"].includes(line.work_type)
            );

            if (existingAbsenceLine) {
              continue; // Saltar este día
            }

            // 🆕 VALIDACIÓN: Verificar si ya existe en Supabase (líneas del servidor)
            const existingServerLine = linesHook.data?.find(
              (line) =>
                line.date === dateStr &&
                ["VACACIONES", "BAJAS", "PERMISOS"].includes(line.work_type)
            );

            if (existingServerLine) {
              continue; // Saltar este día
            }

            // Buscar el día en el calendario para obtener las horas máximas permitidas
            const calendarDay = calendarDays?.find(
              (day) => day.iso === dateStr
            );

            if (calendarDay) {
              // Calcular las horas disponibles para ese día usando el calendario
              const maxHours = dailyRequired[dateStr] || 8; // Horas requeridas específicas para este día
              const currentHours = parseFloat(calendarDay.hours || 0); // Horas ya registradas
              const availableHours = Math.max(0, maxHours - currentHours);

              if (availableHours > 0) {
                const taskType = getTaskFromFactorialType(vacation.tipo);

                // 🆕 DETECTAR MEDIO DÍA: imputar la mitad de las horas máximas del día, sin exceder lo disponible
                const isHalfDay = vacation.half_day !== null && vacation.half_day !== undefined;
                const halfOfMax = Math.max(0, Number(maxHours) / 2);
                const hoursToAssign = isHalfDay ? Math.min(availableHours, halfOfMax) : availableHours;

                const newLine = {
                  id: `tmp-${crypto.randomUUID()}`,
                  header_id: effectiveHeaderId,
                  job_no: vacationProject?.no || "", // Asignar el proyecto de vacaciones encontrado
                  job_no_description: vacationProject?.description || "", // Asignar la descripción del proyecto
                  job_task_no: taskType, // 🆕 Usar la tarea mapeada en lugar de 'GASTO' fijo
                  description: `${taskType} - ${vacation.tipo}${isHalfDay ? ' (Medio día)' : ''}`,
                  work_type: taskType, // Usar la tarea mapeada en lugar de 'VACACIONES' fijo
                  date: toDisplayDate(dateStr),
                  quantity: hoursToAssign.toFixed(2), // 4 horas si es medio día, sino horas disponibles
                  department_code: resourceDepartment, // Usar el departamento del recurso actual
                  isFactorialLine: true, // 🆕 Marcar como línea de Factorial (no editable)
                  status: "Approved", // 🆕 Marcar como aprobado automáticamente
                };

                newLines.push(newLine);
              } else {
                // No hay horas disponibles para este día
              }
            } else {
              // Si no hay calendario disponible, usar 8 horas por defecto (o la mitad si es medio día)
              const isHalfDay = vacation.half_day !== null && vacation.half_day !== undefined;
              const defaultHoursFull = 8.0;
              const defaultHours = isHalfDay ? defaultHoursFull / 2 : defaultHoursFull;
              const taskType = getTaskFromFactorialType(vacation.tipo);

              const newLine = {
                id: `tmp-${crypto.randomUUID()}`,
                header_id: effectiveHeaderId,
                job_no: vacationProject?.no || "", // Asignar el proyecto de vacaciones encontrado
                job_no_description: vacationProject?.description || "", // Asignar la descripción del proyecto
                job_task_no: taskType, // 🆕 Usar la tarea mapeada en lugar de 'GASTO' fijo
                description: `${taskType} - ${vacation.tipo}${isHalfDay ? ' (Medio día)' : ''}`,
                work_type: taskType, // Usar la tarea mapeada en lugar de 'VACACIONES' fijo
                date: toDisplayDate(dateStr),
                quantity: defaultHours.toFixed(2), // 4 horas si es medio día, 8 si es día completo
                department_code: resourceDepartment, // Usar el departamento del recurso actual
                isFactorialLine: true, // 🆕 Marcar como línea de Factorial (no editable)
                status: "Approved", // 🆕 Marcar como aprobado automáticamente
              };

              newLines.push(newLine);
            }
          }
        }
      }

      if (newLines.length > 0) {
        // Agregar las nuevas líneas al estado
        setLines((prev) => [...prev, ...newLines]);

        // Agregar al editFormData
        setEditFormData((prev) => {
          const newData = { ...prev };
          newLines.forEach((line) => {
            newData[line.id] = line;
          });
          return newData;
        });

        // Marcar como cambiado
        markAsChanged();

        // 🆕 Resumen de la importación
        const totalDaysInVacations = vacations.reduce((total, vac) => {
          const start = new Date(vac.desde);
          const end = new Date(vac.hasta);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          return total + days;
        }, 0);

        const skippedDays = totalDaysInVacations - newLines.length;

        if (skippedDays > 0) {
          toast.success(
            `Se importaron ${newLines.length} días de ausencias (${skippedDays} días omitidos por duplicados/festivos)`
          );
        } else {
          toast.success(`Se importaron ${newLines.length} días de ausencias`);
        }
      } else {
        toast("No se pudieron crear líneas de vacaciones para este período", {
          icon: "ℹ️",
        });
      }
    } catch (error) {
      console.error("❌ Error importando vacaciones:", error);
      toast.error(`Error al importar vacaciones: ${error.message}`);
    }
  }, [
    effectiveHeaderId,
    markAsChanged,
    calendarDays,
    dailyRequired,
    header,
    calendarHolidays,
    instance,
    accounts,
  ]);

  // 🆕 Función para duplicar líneas seleccionadas
  const handleDuplicateLines = useCallback(
    (lineIds) => {
      if (!lineIds.length) return;

      const newLines = [];
      lineIds.forEach((lineId) => {
        const originalLine = lines.find((line) => line.id === lineId);
        if (originalLine) {
          // 🆕 Lógica inteligente para la fecha usando el calendario existente
          let newDate = originalLine.date || "";

          // Si la línea original tiene fecha, verificar el estado del día usando el calendario
          if (newDate && newDate !== "") {
            try {
              // ✅ Usar la función existente toIsoFromInput para convertir fechas
              const processedDate = toIsoFromInput(newDate);
              if (!processedDate) {
                console.warn("⚠️ Fecha inválida en línea:", newDate);
                newDate = ""; // Resetear a fecha vacía si es inválida
              } else {
                const originalDate = new Date(processedDate);
                const dayKey = originalDate.toISOString().split("T")[0];

                // Buscar el día en el calendario para obtener su estado real
                const calendarDay = calendarDays.find(
                  (day) => day.iso === dayKey
                );

                if (calendarDay) {
                  // Si el día está completo, buscar el siguiente día disponible
                  if (calendarDay.status === "completo") {
                    // Buscar el siguiente día con estado "parcial" o "cero"
                    const currentIndex = calendarDays.findIndex(
                      (day) => day.iso === dayKey
                    );
                    let nextAvailableDay = null;

                    // Buscar hacia adelante en el calendario
                    for (
                      let i = currentIndex + 1;
                      i < calendarDays.length;
                      i++
                    ) {
                      const day = calendarDays[i];
                      if (day.status === "parcial" || day.status === "cero") {
                        nextAvailableDay = day.iso;
                        break;
                      }
                    }

                    // Si no hay día siguiente disponible, buscar hacia atrás
                    if (!nextAvailableDay) {
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        const day = calendarDays[i];
                        if (day.status === "parcial" || day.status === "cero") {
                          nextAvailableDay = day.iso;
                          break;
                        }
                      }
                    }

                    // Usar el día disponible encontrado, o mantener el original si no hay ninguno
                    if (nextAvailableDay) {
                      newDate = nextAvailableDay;
                    }
                  }
                }
              }
            } catch (error) {
              console.error("❌ Error procesando fecha:", error);
              console.warn("⚠️ Fecha problemática:", newDate);
              newDate = ""; // Resetear a fecha vacía en caso de error
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
        // 🆕 Insertar todas las líneas duplicadas debajo de la última línea seleccionada
        setLines((prev) => {
          const newLinesArray = [...prev];

          // Encontrar la posición de la última línea seleccionada
          const lastSelectedIndex = Math.max(
            ...lineIds.map((lineId) =>
              newLinesArray.findIndex((line) => line.id === lineId)
            )
          );

          if (lastSelectedIndex !== -1) {
            // Insertar todas las líneas duplicadas después de la última línea seleccionada
            newLinesArray.splice(lastSelectedIndex + 1, 0, ...newLines);
          }

          return newLinesArray;
        });

        // Limpiar selección después de duplicar
        setSelectedLines([]);
        markAsChanged();
      }
    },
    [lines, markAsChanged, calendarDays]
  );

  // Función para obtener el primer día del mes del período
  const getFirstDayOfPeriod = (allocationPeriod) => {
    if (!allocationPeriod) return new Date().toISOString().split("T")[0];

    // Parsear período M25-M08 (año-mes)
    const match = allocationPeriod.match(/M(\d{2})-M(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1]); // 25 -> 2025
      const month = parseInt(match[2]) - 1; // M08 -> 7 (agosto, 0-indexed)
      const firstDay = new Date(year, month, 1);
      return firstDay.toISOString().split("T")[0];
    }

    return new Date().toISOString().split("T")[0];
  };

  // Función para obtener el último día del mes del período
  const getLastDayOfPeriod = (allocationPeriod) => {
    if (!allocationPeriod) return new Date().toISOString().split("T")[0];

    // Parsear período M25-M08 (año-mes)
    const match = allocationPeriod.match(/M(\d{2})-M(\d{2})/);
    if (match) {
      const year = 2000 + parseInt(match[1]); // 25 -> 2025
      const month = parseInt(match[2]) - 1; // M08 -> 7 (agosto, 0-indexed)
      const lastDay = new Date(year, month + 1, 0); // Día 0 del mes siguiente = último día del mes actual
      return lastDay.toISOString().split("T")[0];
    }

    return new Date().toISOString().split("T")[0];
  };

  // ✅ Función para manejar cambios en las líneas desde TimesheetLines
  const handleLinesChange = useCallback(
    (lineId, changes) => {
      // Actualizar solo el editFormData para la línea específica
      setEditFormData((prev) => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          ...changes,
        },
      }));

      // Marcar que hay cambios no guardados
      markAsChanged();
    },
    [markAsChanged]
  );

  // ✅ MUTATION: Actualizar línea individual
  const updateLineMutation = useMutation({
    mutationFn: async ({ lineId, changes, silent: _silent = false }) => {
      // Convertir fecha a formato ISO si está presente
      const processedChanges = { ...changes };
      if (processedChanges.date) {
        processedChanges.date = toIsoFromInput(processedChanges.date);
      }

      const { data, error } = await supabaseClient
        .from("timesheet")
        .update(processedChanges)
        .eq("id", lineId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // ✅ Éxito: Actualizar cache local
      setLines((prev) =>
        prev.map((l) =>
          l.id === variables.lineId ? { ...l, ...variables.changes } : l
        )
      );

      // ✅ Mostrar toast de éxito solo si no es silencioso
      if (!variables.silent) {
        toast.success(TOAST.SUCCESS.SAVE_LINE);
      }

      // ✅ Limpiar indicador de guardado
      setSavingByLine((prev) => ({ ...prev, [variables.lineId]: false }));
    },
    onError: (error, variables) => {
      console.error("Error updating line:", error);

      // ✅ Mostrar toast de error solo si no es silencioso
      if (!variables.silent) {
        toast.error(TOAST.ERROR.SAVE_LINE);
      }

      // ✅ Limpiar indicador de guardado
      setSavingByLine((prev) => ({ ...prev, [variables.lineId]: false }));
    },
  });

  // ✅ MUTATION: Eliminar línea
  const deleteLineMutation = useMutation({
    mutationFn: async (lineId) => {
      const { error } = await supabaseClient
        .from("timesheet")
        .delete()
        .eq("id", lineId);

      if (error) throw error;
      return lineId;
    },
    onSuccess: (lineId) => {
      // ✅ Éxito: Actualizar estado local
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      setEditFormData((prev) => {
        const updated = { ...prev };
        delete updated[lineId];
        return updated;
      });
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[lineId];
        return updated;
      });

      // ✅ Mostrar toast de éxito
      toast.success(TOAST.SUCCESS.DELETE_LINE);
    },
    onError: (error, _lineId) => {
      console.error("Error deleting line:", error);

      // ✅ Mostrar toast de error
      toast.error(TOAST.ERROR.DELETE_LINE);
    },
  });

  // 🆕 Función para eliminar líneas seleccionadas
  const handleDeleteLines = useCallback(
    (lineIds) => {
      if (!lineIds.length) return;

      // ✅ Mostrar modal de confirmación en lugar de window.confirm
      setDeleteConfirmModal({
        show: true,
        lineIds: lineIds,
        onConfirm: () => {
          // ✅ ELIMINACIÓN SOLO LOCAL: NO se elimina de la BD hasta guardar
          const updatedLines = lines.filter(
            (line) => !lineIds.includes(line.id)
          );
          setLines(updatedLines);

          // ✅ Agregar IDs a la lista de líneas a eliminar de la BD
          setDeletedLineIds((prev) => [
            ...prev,
            ...lineIds.filter((id) => !id.startsWith("tmp-")),
          ]);

          // Limpiar selección después de eliminar
          setSelectedLines([]);

          // ✅ Marcar que hay cambios pendientes para habilitar el botón "Guardar Cambios"
          markAsChanged();

          // Cerrar el modal
          setDeleteConfirmModal({ show: false, lineIds: [], onConfirm: null });
        },
      });
    },
    [lines, markAsChanged]
  );

  // ✅ MUTATION: Insertar línea nueva
  const insertLineMutation = useMutation({
    mutationFn: async (lineData) => {
      const { data, error } = await supabaseClient
        .from("timesheet")
        .insert(lineData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newLine) => {
      // ✅ Éxito: Actualizar estado local
      setLines((prev) => [...prev, newLine]);
      setEditFormData((prev) => ({
        ...prev,
        [newLine.id]: newLine,
      }));

      // ✅ Mostrar toast de éxito
      toast.success("Línea duplicada correctamente");
    },
    onError: (error) => {
      console.error("Error inserting line:", error);

      // ✅ Mostrar toast de error
      toast.error("Error al duplicar la línea");
    },
  });

  // 🆕 Obtener queryClient para invalidar cache
  const queryClient = useQueryClient();

  // 🆕 Función para abrir el modal de aprobación
  const handleOpenApprovalModal = useCallback(() => {
    setShowApprovalModal(true);
  }, []);

  // 🆕 Función para confirmar el envío de aprobación
  const handleConfirmApproval = useCallback(
    async (selectedDays) => {
      try {
        // Obtener todas las líneas que corresponden a los días seleccionados
        const linesToUpdate = [];

        selectedDays.forEach((dayIso) => {
          const dayLines = lines.filter((line) => {
            // Usar toIsoFromInput para convertir DD/MM/YYYY a YYYY-MM-DD
            const lineDate = line.date ? toIsoFromInput(line.date) : null;
            return lineDate === dayIso;
          });

          dayLines.forEach((line) => {
            // 🆕 Excluir líneas de Factorial (ya están aprobadas)
            if (line.status !== "Pending" && !line.isFactorialLine) {
              linesToUpdate.push({
                id: line.id,
                status: "Pending",
              });
            }
          });
        });

        if (linesToUpdate.length === 0) {
          toast.error("No hay líneas para enviar a aprobación");
          return;
        }

        // Actualizar el estado de las líneas en la base de datos
        const updatePromises = linesToUpdate.map(({ id, status }) =>
          supabaseClient.from("timesheet").update({ status }).eq("id", id)
        );

        await Promise.all(updatePromises);

        // Actualizar el estado local
        setLines((prev) =>
          prev.map((line) => {
            const update = linesToUpdate.find((u) => u.id === line.id);
            return update ? { ...line, status: update.status } : line;
          })
        );

        // Actualizar editFormData si es necesario
        setEditFormData((prev) => {
          const newData = { ...prev };
          linesToUpdate.forEach(({ id, status }) => {
            if (newData[id]) {
              newData[id] = { ...newData[id], status };
            }
          });
          return newData;
        });

        toast.success(
          `${linesToUpdate.length} líneas enviadas para aprobación`
        );

        // Invalidar queries para refrescar datos
        queryClient.invalidateQueries({
          queryKey: ["lines", effectiveHeaderId],
        });
      } catch (error) {
        console.error("Error enviando líneas para aprobación:", error);
        toast.error("Error al enviar líneas para aprobación");
      }
    },
    [lines, queryClient, effectiveHeaderId]
  );

  // 🆕 Función para verificar datos de calendario y mostrar modal si no existen
  const checkCalendarData = useCallback(
    async (allocationPeriod, calendarType) => {
      if (!allocationPeriod || !calendarType) return;

      try {
        const { data: existingCalendarDays, error: calendarQueryError } =
          await supabaseClient
            .from("calendar_period_days")
            .select("allocation_period, calendar_code, day")
            .eq("allocation_period", allocationPeriod)
            .eq("calendar_code", calendarType)
            .limit(1);

        if (calendarQueryError) {
          console.error(
            "Error consultando calendar_period_days:",
            calendarQueryError
          );
          return;
        }

        if (!existingCalendarDays || existingCalendarDays.length === 0) {
          // Mostrar modal en lugar de lanzar excepción
          setCalendarNotFoundData({
            allocationPeriod,
            calendarType,
          });
          setShowCalendarNotFoundModal(true);
        }
      } catch (error) {
        console.error("Error verificando datos de calendario:", error);
      }
    },
    []
  );

  // 🆕 Función para guardar toda la tabla CON VALIDACIÓN
  const saveAllChanges = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    // 🆕 PASO 1: Validar todos los datos antes de guardar

    const validation = await validateAllData(
      editFormData,
      dailyRequired,
      calendarHolidays,
      jobs
    );

    // 🆕 PASO 2: Solo bloquear guardado si hay errores críticos (no campos requeridos)
    if (validation.totalErrors > 0) {
      setValidationModal({
        show: true,
        validation,
      });
      return;
    }

    // 🆕 PASO 3: Si solo hay advertencias (campos requeridos), continuar con el guardado
    // Las líneas con campos requeridos incompletos se filtrarán automáticamente

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
          const { data: resourceData, error: resourceError } =
            await supabaseClient
              .from("resource")
              .select(
                "code, name, department_code, calendar_type, company_name"
              )
              .eq("email", userEmail)
              .single();

          if (resourceError || !resourceData) {
            throw new Error(
              `No se pudo obtener información del recurso: ${resourceError?.message || "Datos no encontrados"}`
            );
          }

          // Construir allocation_period
          const params = new URLSearchParams(location.search);
          let ap = params.get("allocation_period");
          if (!ap) {
            const base = serverDate || new Date();
            const yy = String(base.getFullYear()).slice(-2);
            // 🆕 CORREGIR: getMonth() devuelve 0-11, donde 0=enero, 7=agosto
            const mm = String(base.getMonth() + 1).padStart(2, "0");
            ap = `M${yy}-M${mm}`;
          }

          headerData = {
            resource_no: resourceData.code, // Usar code del recurso
            resource_name: resourceData.name,
            department_code: resourceData.department_code,
            calendar_type: resourceData.calendar_type,
            company_name:
              resourceData.company_name || "Power Solution Iberia SL",
            allocation_period: ap,
            posting_date: (serverDate || new Date())
              .toISOString()
              .split("T")[0],
            posting_description: `Parte de trabajo ${ap}`,
            calendar_period_days: "", // Se llenará cuando se seleccione la fecha
          };
        }

        // PASO 1: Elegir día del período: preferir el día del servidor; fallback al primer día del período
        const desiredIso = (serverDate || new Date())
          .toISOString()
          .split("T")[0];

        console.log("🔍 DEBUG - Creando nuevo parte:");
        console.log("  - serverDate:", serverDate?.toISOString());
        console.log("  - desiredIso:", desiredIso);
        console.log(
          "  - headerData.allocation_period:",
          headerData.allocation_period
        );
        console.log("  - headerData.calendar_type:", headerData.calendar_type);
        // console.log("  - ap (parámetro):", ap);

        // 1.a) Intentar encontrar registro para el día exacto del servidor
        const { data: dayRecord, error: dayError } = await supabaseClient
          .from("calendar_period_days")
          .select("allocation_period, calendar_code, day")
          .eq("allocation_period", headerData.allocation_period)
          .eq("calendar_code", headerData.calendar_type)
          .eq("day", desiredIso)
          .maybeSingle();

        if (dayError) {
          throw new Error(
            `Error consultando calendar_period_days (día exacto): ${dayError.message}`
          );
        }

        console.log("  - dayRecord encontrado:", dayRecord);
        let existingRecord = dayRecord || null;

        // 1.b) Si no existe ese día exacto, intentar con el primer día del período
        if (!existingRecord) {
          const firstDayIso = getFirstDayOfPeriod(headerData.allocation_period);
          const { data: firstRecord, error: firstError } = await supabaseClient
            .from("calendar_period_days")
            .select("allocation_period, calendar_code, day")
            .eq("allocation_period", headerData.allocation_period)
            .eq("calendar_code", headerData.calendar_type)
            .eq("day", firstDayIso)
            .maybeSingle();
          if (firstError) {
            throw new Error(
              `Error consultando calendar_period_days (primer día): ${firstError.message}`
            );
          }
          existingRecord = firstRecord || null;
          console.log("  - firstRecord encontrado:", firstRecord);
        }

        // 1.c) Último fallback: cualquier día del período, ordenado por fecha ascendente
        if (!existingRecord) {
          const { data: anyRecordList, error: anyError } = await supabaseClient
            .from("calendar_period_days")
            .select("allocation_period, calendar_code, day")
            .eq("allocation_period", headerData.allocation_period)
            .eq("calendar_code", headerData.calendar_type)
            .order("day", { ascending: true })
            .limit(1);
          if (anyError) {
            throw new Error(
              `Error consultando calendar_period_days (fallback): ${anyError.message}`
            );
          }
          if (anyRecordList && anyRecordList.length > 0) {
            existingRecord = anyRecordList[0];
          }
        }

        if (!existingRecord) {
          // Si no hay registros en calendar_period_days, usar la fecha del servidor directamente
          console.log(
            "⚠️  No se encontraron registros en calendar_period_days, usando fecha del servidor"
          );
          existingRecord = {
            allocation_period: headerData.allocation_period,
            calendar_code: headerData.calendar_type,
            day: desiredIso,
          };
        }

        console.log("✅ existingRecord final:", existingRecord);

        // PASO 2: Crear header con valores exactos que existen en calendar_period_days
        const now = (serverDate || new Date()).toISOString();
        const newHeader = {
          id: crypto.randomUUID(), // Generar ID único manualmente
          resource_no: headerData.resource_no,
          posting_date:
            headerData.posting_date ||
            (serverDate || new Date()).toISOString().split("T")[0],
          description: headerData.resource_name, // Nombre del recurso
          posting_description:
            headerData.posting_description ||
            `Parte de trabajo ${headerData.allocation_period}`,
          from_date: existingRecord.day, // ✅ Usar día exacto que existe en calendar_period_days
          to_date: existingRecord.day, // ✅ Usar día exacto que existe en calendar_period_days
          allocation_period: headerData.allocation_period, // ✅ Usar período del servidor (M25-M08)
          resource_calendar: existingRecord.calendar_code, // ✅ Usar calendario exacto que existe
          user_email: userEmail,
          created_at: now,
          updated_at: now,
          company_name: headerData.company_name || "Power Solution Iberia SL", // Campo requerido
          synced_to_bc: false, // Campo opcional
          department_code: headerData.department_code || "20", // Campo opcional con default
        };

        console.log("🚀 newHeader creado:", {
          allocation_period: newHeader.allocation_period,
          posting_date: newHeader.posting_date,
          from_date: newHeader.from_date,
          to_date: newHeader.to_date,
          resource_calendar: newHeader.resource_calendar,
        });

        // 🆕 Regla explícita: si NO hay partes previos del recurso, usar SIEMPRE la fecha/período del servidor
        try {
          const { count, error: countErr } = await supabaseClient
            .from("resource_timesheet_header")
            .select("id", { count: "exact", head: true })
            .eq("resource_no", headerData.resource_no);
          if (!countErr && (count === 0 || count == null)) {
            const serverIso = (serverDate || new Date())
              .toISOString()
              .split("T")[0];
            const yy = String((serverDate || new Date()).getFullYear()).slice(
              -2
            );
            const mm = String(
              (serverDate || new Date()).getMonth() + 1
            ).padStart(2, "0");
            const serverAp = `M${yy}-M${mm}`;
            newHeader.posting_date = serverIso;
            newHeader.from_date = serverIso;
            newHeader.to_date = serverIso;
            newHeader.allocation_period = serverAp;
            console.log(
              "🛡️ Sin partes previos: forzando período del servidor",
              serverAp,
              serverIso
            );
          }
        } catch {
          console.warn(
            "No se pudo verificar partes previos, se continúa con valores actuales"
          );
        }

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

      // 🆕 FILTRAR: Solo procesar líneas que tengan TODOS los campos requeridos
      const validLinesToProcess = linesToProcess.filter((lineId) => {
        const lineData = editFormData[lineId];

        // Verificar que la línea tenga todos los campos requeridos
        const hasRequiredFields =
          lineData &&
          lineData.date &&
          lineData.date.trim() !== "" && // Fecha obligatoria
          lineData.job_no &&
          lineData.job_no.trim() !== "" && // Proyecto obligatorio
          lineData.job_task_no &&
          lineData.job_task_no.trim() !== "" && // Tarea obligatoria
          lineData.quantity &&
          parseFloat(lineData.quantity) > 0; // Horas > 0 obligatorias

        return hasRequiredFields;
      });

      console.log(
        `📝 Procesando ${validLinesToProcess.length} de ${linesToProcess.length} líneas (filtradas por campos requeridos completos)`
      );

      for (const lineId of validLinesToProcess) {
        const lineData = editFormData[lineId];

        if (lineId.startsWith("tmp-")) {
          // 🆕 Línea nueva - insertar (incluyendo duplicadas con cantidad 0)
          if (
            lineData.job_no &&
            lineData.job_no.trim() !== "" &&
            lineData.date &&
            lineData.date.trim() !== "" &&
            lineData.job_task_no &&
            lineData.job_task_no.trim() !== "" &&
            lineData.quantity &&
            parseFloat(lineData.quantity) > 0
          ) {
            // Verificar TODOS los campos requeridos
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
            setLines((prev) =>
              prev.map((l) => (l.id === lineId ? createdLine : l))
            );
            setEditFormData((prev) => {
              const newData = { ...prev };
              delete newData[lineId];
              newData[createdLine.id] = {
                ...createdLine,
                date: toDisplayDate(createdLine.date),
              };
              return newData;
            });
          }
        } else {
          // Línea existente - actualizar si hay cambios
          const originalLine = lines.find((l) => l.id === lineId);
          if (
            lineData &&
            originalLine &&
            lineData.date &&
            lineData.date.trim() !== "" &&
            lineData.job_no &&
            lineData.job_no.trim() !== "" &&
            lineData.job_task_no &&
            lineData.job_task_no.trim() !== "" &&
            lineData.quantity &&
            parseFloat(lineData.quantity) > 0
          ) {
            const changedFields = {};
            Object.keys(lineData).forEach((key) => {
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
                silent: true,
              });
            }
          }
        }
      }

      // ✅ PASO 4.3: Eliminar líneas que fueron marcadas para eliminación
      if (deletedLineIds.length > 0) {
        for (const lineId of deletedLineIds) {
          await deleteLineMutation.mutateAsync(lineId);
        }
        // Limpiar la lista de líneas eliminadas después de procesarlas
        setDeletedLineIds([]);
      }

      setHasUnsavedChanges(false);

      // 🆕 Informar sobre líneas filtradas por campos requeridos incompletos
      const filteredLines = linesToProcess.length - validLinesToProcess.length;
      if (filteredLines > 0) {
        toast.success(
          `${TOAST.SUCCESS.SAVE_ALL} (${filteredLines} líneas con campos requeridos incompletos omitidas)`
        );
      } else {
        toast.success(TOAST.SUCCESS.SAVE_ALL);
      }

      // 🆕 CRÍTICO: Invalidar el cache de React Query para que se recarguen las líneas
      if (currentHeaderId) {
        try {
          await queryClient.invalidateQueries({
            queryKey: ["lines", currentHeaderId],
          });
          console.log("🔄 Cache invalidado para header:", currentHeaderId);
        } catch (error) {
          console.error("❌ Error invalidando cache:", error);
        }
      }
    } catch (error) {
      console.error("Error saving all changes:", error);
      toast.error(`Error al guardar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [
    hasUnsavedChanges,
    editFormData,
    lines,
    updateLineMutation,
    deleteLineMutation,
    deletedLineIds,
    setDeletedLineIds,
    dailyRequired,
    calendarHolidays,
    effectiveHeaderId,
    location.search,
    editableHeader,
    instance,
    accounts,
    queryClient,
  ]);

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
        const base = serverDate || new Date();
        const yy = String(base.getFullYear()).slice(-2); // "25"
        // 🆕 CORREGIR: getMonth() devuelve 0-11, donde 0=enero, 7=agosto
        const mm = String(base.getMonth() + 1).padStart(2, "0"); // "08"
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
        // Determinar el recurso actual por email (MSAL)
        let currentResourceNo = null;
        try {
          let userEmail = "";
          try {
            const acct = instance.getActiveAccount() || accounts[0];
            userEmail = acct?.username || acct?.email || "";
          } catch {
            /* ignore */
          }
          if (userEmail) {
            const { data: r } = await supabaseClient
              .from("resource")
              .select("code")
              .eq("email", userEmail)
              .maybeSingle();
            currentResourceNo = r?.code || null;
          }
        } catch {
          /* ignore */
        }

        const query = supabaseClient
          .from("resource_timesheet_header")
          .select("*")
          .eq("allocation_period", ap)
          .order("id", { ascending: false })
          .limit(1);

        if (currentResourceNo) {
          query.eq("resource_no", currentResourceNo);
        }

        const { data: h, error: headerErr } = await query.maybeSingle();
        if (headerErr) {
          console.error(
            "Error cargando cabecera por allocation_period:",
            headerErr
          );
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

      // 🆕 Si no se encontró header y no estamos en /nuevo-parte,
      // pero venimos de la tarjeta de horas pendientes, comportarse como nuevo parte
      const isEffectivelyNewParte =
        isNewParte || (!headerData && !headerIdResolved);

      // 2) Las líneas ahora se cargan vía React Query (ver linesQuery)
      if (!headerIdResolved) {
        // Si no encontramos cabecera, sólo limpiar líneas si NO estamos en nuevo parte efectivo
        if (!isEffectivelyNewParte) {
          setLines([]);
        }
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
  // Eliminado: no crear línea al abrir; se creará al navegar al final

  // 🆕 Inicializar fecha sugerida para nuevo parte
  useEffect(() => {
    if (
      !effectiveHeaderId &&
      editableHeader?.resource_no &&
      !editableHeader.posting_date
    ) {
      getSuggestedPartDate(editableHeader.resource_no).then((suggestedDate) => {
        setEditableHeader((prev) => ({
          ...prev,
          posting_date: suggestedDate,
        }));
      });
    }
  }, [
    effectiveHeaderId,
    editableHeader?.resource_no,
    editableHeader?.posting_date,
  ]);

  // 🆕 Fallback robusto: en /nuevo-parte o sin header garantizar período = mes actual si falta
  useEffect(() => {
    const isNewParte = location.pathname === "/nuevo-parte";
    const isEffectivelyNewParte = isNewParte || (!header && !effectiveHeaderId);

    if (!isEffectivelyNewParte) return;
    const hasAp = !!(editableHeader && editableHeader.allocation_period);
    if (hasAp) return;
    if (!serverDate) return; // Esperar a serverDate para evitar caer en la fecha local
    const base = serverDate;
    const yy = String(base.getFullYear()).slice(-2);
    const mm = String(base.getMonth() + 1).padStart(2, "0");
    const ap = `M${yy}-M${mm}`;
    setEditableHeader((prev) => ({
      ...(prev || {}),
      allocation_period: ap,
      posting_date:
        (prev && prev.posting_date) || base.toISOString().split("T")[0],
      posting_description: `Parte de trabajo ${ap}`,
    }));
  }, [
    location.pathname,
    editableHeader?.allocation_period,
    header,
    effectiveHeaderId,
    serverDate,
  ]);

  // 🆕 Incrementar trigger cuando cambie el período
  useEffect(() => {
    if (editableHeader?.allocation_period) {
      setPeriodChangeTrigger((prev) => prev + 1);
    }
  }, [editableHeader?.allocation_period]);

  // 🆕 Inicializar calendar_type del recurso en editableHeader
  useEffect(() => {
    const isNewParte = location.pathname === "/nuevo-parte";
    const isEffectivelyNewParte = isNewParte || (!header && !effectiveHeaderId);

    if (!isEffectivelyNewParte) return;
    if (editableHeader?.calendar_type) return; // Ya tiene calendar_type

    const getResourceCalendarType = async () => {
      try {
        let userEmail = "";
        try {
          const acct = instance.getActiveAccount() || accounts[0];
          userEmail = acct?.username || acct?.email || "";
        } catch {
          userEmail = "";
        }

        if (userEmail) {
          const { data: resourceData } = await supabaseClient
            .from("resource")
            .select("calendar_type")
            .eq("email", userEmail)
            .maybeSingle();

          if (resourceData?.calendar_type) {
            setEditableHeader((prev) => ({
              ...(prev || {}),
              calendar_type: resourceData.calendar_type,
            }));
          }
        }
      } catch (error) {
        console.error("Error obteniendo calendar_type del recurso:", error);
      }
    };

    getResourceCalendarType();
  }, [
    location.pathname,
    editableHeader?.calendar_type,
    instance,
    accounts,
    header,
    effectiveHeaderId,
  ]);

  // 🆕 Verificar datos de calendario cuando se inicialice editableHeader
  useEffect(() => {
    const isNewParte = location.pathname === "/nuevo-parte";
    if (!isNewParte) return;

    if (editableHeader?.allocation_period && editableHeader?.calendar_type) {
      checkCalendarData(
        editableHeader.allocation_period,
        editableHeader.calendar_type
      );
    }
  }, [
    editableHeader?.allocation_period,
    editableHeader?.calendar_type,
    location.pathname,
    checkCalendarData,
  ]);

  // Cuando llegan las líneas, actualizar estado local y edición inicial con dos decimales
  useEffect(() => {
    // 🆕 Solo procesar líneas si hay header y datos del hook
    if (!effectiveHeaderId || !linesHook.data) return;

    // NO resetear hasUnsavedChanges si ya hay cambios pendientes
    const shouldPreserveChanges = hasUnsavedChanges;

    const sorted = sortLines(linesHook.data || []);
    const linesFormatted = sorted.map((line) => ({
      ...line,
      date: toDisplayDate(line.date),
    }));
    // Filtrar filas totalmente vacías provenientes del backend (sin datos y cantidad 0)
    const filtered = linesFormatted.filter((l) => {
      const hasData = Boolean(
        l.job_no || l.job_task_no || l.description || l.work_type || l.date
      );
      const qty = Number(l.quantity) || 0;
      return hasData || qty !== 0; // mantener solo si tiene datos o cantidad distinta de 0
    });

    // 🆕 Conservar líneas temporales locales (tmp-) cuando actualizamos desde servidor
    const localTmp = (Array.isArray(lines) ? lines : []).filter((l) =>
      String(l.id || "").startsWith("tmp-")
    );
    const merged = [...localTmp, ...filtered];
    const sortedMerged = sortLines(merged);
    setLines(sortedMerged);

    // Inicializar/actualizar editFormData solo con las líneas del servidor y respetar tmp existentes
    setEditFormData((prev) => {
      const next = { ...prev };
      filtered.forEach((line) => {
        next[line.id] = {
          ...line,
          quantity: toTwoDecimalsString(line.quantity),
        };
      });
      return next;
    });

    // Snapshot base para detectar cambios por campo (comparación en espacio DB) - solo servidor
    const snap = {};
    filtered.forEach((line) => {
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
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    // Solo bloquear si hay cambios sin guardar y la ubicación cambia
    return (
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );
  });

  // Mostrar modal cuando se bloquea la navegación
  useEffect(() => {
    if (blocker.state === "blocked") {
      setNavigationModal({
        show: true,
        message:
          "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?",
        onConfirm: () => {
          setNavigationModal({
            show: false,
            message: "",
            onConfirm: null,
            onCancel: null,
          });
          // Permitir la navegación bloqueada
          blocker.proceed();
        },
        onCancel: () => {
          setNavigationModal({
            show: false,
            message: "",
            onConfirm: null,
            onCancel: null,
          });
          // Cancelar la navegación bloqueada
          blocker.reset();
        },
      });
    }
  }, [blocker.state, blocker.proceed, blocker.reset]);

  // Control para beforeunload (cerrar pestaña, ventana, recargar)
  // useBlocker NO puede manejar estos eventos del navegador
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // calendarHolidays seguirá disponible en este componente para validaciones
  useEffect(() => {
    if (Array.isArray(calHolidaysFromHook))
      setCalendarHolidays(calHolidaysFromHook);
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
          nextErrors[id] = {
            ...(nextErrors[id] || {}),
            date: VALIDATION.HOLIDAY_NO_HOURS,
          };
        } else {
          nextErrors[id] = {
            ...(nextErrors[id] || {}),
            date: VALIDATION.HOLIDAY_NO_HOURS,
          };
        }
        continue; // no más validaciones sobre festivos
      }

      // Nota: permitimos imputar aunque required <= 0 (sin error ni autocorrección)

      // Exceso sobre tope diario: marcar todas las líneas de ese día
      const totalForDay = Number(totals[iso] || 0);
      const EPS = 0.01;
      if (totalForDay > required + EPS) {
        nextErrors[id] = {
          ...(nextErrors[id] || {}),
          quantity: `Excede tope diario (${totalForDay.toFixed(2)} / ${required.toFixed(2)})`,
        };
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
            .select("code, department_code, calendar_type, company_name")
            .eq("email", userEmail)
            .single();

          if (resourceData) {
            return {
              user_email: userEmail,
              department_code: resourceData.department_code,
              calendar_type: resourceData.calendar_type,
              company_name:
                resourceData.company_name || "Power Solution Iberia SL",
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

    setLines((prev) => sortLines([...prev, newLine]));
    setEditFormData((prev) => ({
      ...prev,
      [newId]: { ...newLine },
    }));

    // Establecer por defecto la fecha del servidor si cae dentro del rango permitido
    if (serverDate) {
      const iso = serverDate.toISOString().split("T")[0];
      const headerForValidation = header || editableHeader;
      const rangeValidation = validateDateRange(iso, headerForValidation);
      if (rangeValidation.isValid) {
        const display = toDisplayDate(iso);
        setEditFormData((prev) => ({
          ...prev,
          [newId]: {
            ...prev[newId],
            date: prev[newId]?.date ? prev[newId].date : display,
          },
        }));
        setLines((prev) =>
          sortLines(
            prev.map((l) =>
              l.id === newId
                ? { ...l, date: l.date && l.date !== "" ? l.date : display }
                : l
            )
          )
        );
      }
    }

    // Obtener información del recurso en background y actualizar si es necesario
    getResourceInfo().then((resourceInfo) => {
      if (resourceInfo) {
        setEditFormData((prev) => ({
          ...prev,
          [newId]: {
            ...prev[newId],
            department_code: resourceInfo.department_code,
            company: resourceInfo.company_name,
            resource_no: resourceInfo.code,
            resource_responsible: resourceInfo.code,
          },
        }));
      }
    });

    // Hacer foco en el primer campo de la línea recién creada
    setTimeout(() => {
      const firstField = inputRefs.current?.[newId]?.job_no;
      if (firstField) {
        firstField.focus();
        firstField.select?.();
      }
    }, 100);

    return newId;
  };

  // Crear UNA línea vacía funcional al entrar en inserción ("/nuevo-parte" o sin header)
  useEffect(() => {
    const isNewParte = location.pathname === "/nuevo-parte";
    const isEffectivelyNewParte = isNewParte || (!header && !effectiveHeaderId);

    if (!isEffectivelyNewParte) return;
    if (createdInitialLineRef.current) return;
    if (Array.isArray(lines) && lines.length > 0) return;
    const id = addEmptyLine();
    if (id) createdInitialLineRef.current = true;
  }, [location.pathname, lines, header, effectiveHeaderId]);

  // Crear UNA línea vacía funcional en edición si el parte no tiene líneas
  useEffect(() => {
    const isEditing = location.pathname !== "/nuevo-parte";
    if (!isEditing) return;
    if (!effectiveHeaderId) return; // sólo cuando ya tenemos header resuelto
    if (createdInitialLineRef.current) return;
    if (!Array.isArray(lines) || lines.length > 0) return;
    const id = addEmptyLine();
    if (id) createdInitialLineRef.current = true;
  }, [location.pathname, effectiveHeaderId, lines]);

  // Garantizar SIEMPRE una línea vacía funcional al final
  useEffect(() => {
    // Evitar duplicar con el caso de nuevo parte sin líneas (se crea en el efecto anterior)
    const isNewParte = location.pathname === "/nuevo-parte";
    if (isNewParte && (!Array.isArray(lines) || lines.length === 0)) return;

    // 🆕 Evitar loop infinito: no ejecutar si ya se está creando una línea
    if (createdInitialLineRef.current) return;

    const hasEmptyTmp =
      Array.isArray(lines) &&
      lines.some((l) => {
        const isTmp = String(l.id || "").startsWith("tmp-");
        const qty = Number(l.quantity) || 0;
        const noData = !(
          l.job_no ||
          l.job_task_no ||
          l.description ||
          l.work_type ||
          l.date
        );
        return isTmp && noData && qty === 0;
      });

    if (Array.isArray(lines) && lines.length > 0 && !hasEmptyTmp) {
      const id = addEmptyLine();
      if (id) createdInitialLineRef.current = true;
    }
  }, [lines, location.pathname]);

  // -- Buscar responsables de job
  const _fetchJobResponsibles = async (jobNos) => {
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
        department_code: r.departamento ?? "", // ✅ Usar departamento del proyecto
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
        // Obtener compañía del recurso actual
        const currentResource = header || editableHeader;
        const resourceCompany =
          currentResource?.company_name ||
          currentResource?.company ||
          "Power Solution Iberia SL";
        out.company = resourceCompany;
      } else if (key === "company_name") {
        // Obtener compañía del recurso actual para company_name
        const currentResource = header || editableHeader;
        const resourceCompany =
          currentResource?.company_name ||
          currentResource?.company ||
          "Power Solution Iberia SL";
        out.company_name = resourceCompany;
      } else if (key === "creado") {
        out.creado = row.creado ?? new Date().toISOString();
      } else if (key === "job_no_and_description") {
        const j = row.job_no || "";
        const d = row.description || "";
        out.job_no_and_description = j && d ? `${j} - ${d}` : `${j}${d}`;
      } else if (key === "job_responsible") {
        const jobNo = row.job_no || "";
        const resolved = jobResponsibleMap?.[jobNo];
        out.job_responsible =
          resolved?.responsible ?? row.job_responsible ?? "";
      } else if (key === "job_responsible_approval") {
        out.job_responsible_approval = true; // forzar TRUE
      } else if (key === "resource_no") {
        out.resource_no = row.resource_no ?? header?.resource_no ?? "";
      } else if (key === "resource_responsible") {
        out.resource_responsible =
          row.resource_responsible ?? header?.resource_no ?? "";
      } else if (key === "department_code") {
        // ✅ Obtener departamento del proyecto, no del recurso
        const jobNo = row.job_no || "";
        const jobInfo = jobResponsibleMap?.[jobNo];

        if (jobInfo && typeof jobInfo === "object" && jobInfo.department_code) {
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
    handleDateInputChange: _handleDateChangeFromHook,
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
    markAsChanged,
  });

  // -- Router de cambios por campo: deriva quantity/date a sus handlers y el resto al handler original
  const handleInputChange = useCallback(
    async (lineId, event) => {
      const { name, value } = event.target;

      // ✅ Si se cambia el proyecto, obtener automáticamente el departamento
      if (name === "job_no" && value) {
        try {
          // Obtener información del proyecto (responsable y departamento)
          const jobInfo = await fetchJobInfo([value]);

          // ✅ Establecer responsable del proyecto y departamento del recurso
          setEditFormData((prev) => {
            const newData = {
              ...prev[lineId],
              [name]: value,
              department_code:
                jobInfo[value]?.department_code ||
                editableHeader?.department_code ||
                "20", // ✅ Departamento del proyecto, recurso o default
              job_responsible: jobInfo[value]?.responsible || "", // ✅ Responsable del proyecto (solo el código)
            };

            return {
              ...prev,
              [lineId]: newData,
            };
          });
        } catch (error) {
          console.error(`Error obteniendo info del proyecto:`, error);
          // En caso de error, usar valor normal
          setEditFormData((prev) => ({
            ...prev,
            [lineId]: {
              ...prev[lineId],
              [name]: value,
            },
          }));
        }
      } else {
        // Para otros campos, comportamiento normal
        setEditFormData((prev) => ({
          ...prev,
          [lineId]: {
            ...prev[lineId],
            [name]: value,
          },
        }));
      }

      // Marcar que hay cambios no guardados
      markAsChanged();

      // Limpiar errores del campo
      setErrors((prev) => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          [name]: null,
        },
      }));
    },
    [markAsChanged, fetchJobInfo]
  );

  // -- Función unificada para validar rango de fechas
  const validateDateRange = (date, headerData) => {
    if (!headerData) return { isValid: true, error: null };

    const selectedDate = new Date(date);

    // ✅ Para inserción: calcular fechas del período si no están definidas
    let fromDate = headerData.from_date
      ? new Date(headerData.from_date + "T00:00:00")
      : null;
    let toDate = headerData.to_date
      ? new Date(headerData.to_date + "T23:59:59")
      : null;

    // Si no hay fechas pero sí hay período, calcularlas
    if ((!fromDate || !toDate) && headerData.allocation_period) {
      const firstDay = getFirstDayOfPeriod(headerData.allocation_period);
      const lastDay = getLastDayOfPeriod(headerData.allocation_period);
      fromDate = new Date(firstDay + "T00:00:00");
      toDate = new Date(lastDay + "T23:59:59");
    }

    // Si no hay rango definido, permitir cualquier fecha
    if (!fromDate || !toDate) return { isValid: true, error: null };

    // Validar que la fecha esté dentro del rango
    if (selectedDate < fromDate || selectedDate > toDate) {
      return {
        isValid: false,
        error: `La fecha debe estar entre ${fromDate.toLocaleDateString()} y ${toDate.toLocaleDateString()}`,
      };
    }

    return { isValid: true, error: null };
  };

  // -- Obtener fecha sugerida para nuevo parte (último día del mes siguiente al último)
  const getSuggestedPartDate = async (resourceNo) => {
    if (!resourceNo)
      return (serverDate || new Date()).toISOString().split("T")[0];

    try {
      // Obtener el último timesheet del recurso
      const { data: lastHeader, error } = await supabaseClient
        .from("resource_timesheet_header")
        .select("to_date")
        .eq("resource_no", resourceNo)
        .order("to_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !lastHeader?.to_date) {
        // Si no hay timesheets previos, usar fecha del servidor
        return (serverDate || new Date()).toISOString().split("T")[0];
      }

      // ✅ Regla: si el último parte es del mismo mes que el del servidor, proponer mes siguiente
      const lastDate = new Date(lastHeader.to_date);
      const baseServer = serverDate || new Date();
      const sameMonth =
        lastDate.getFullYear() === baseServer.getFullYear() &&
        lastDate.getMonth() === baseServer.getMonth();

      if (sameMonth) {
        // Último día del mes siguiente
        const startNext = new Date(
          lastDate.getFullYear(),
          lastDate.getMonth() + 1,
          1
        );
        const endNext = new Date(
          startNext.getFullYear(),
          startNext.getMonth() + 1,
          0
        );
        return endNext.toISOString().split("T")[0];
      }

      // Si el último parte NO es del mes del servidor, usar la fecha del servidor
      return baseServer.toISOString().split("T")[0];
    } catch {
      // En error, usar fecha del servidor
      return (serverDate || new Date()).toISOString().split("T")[0];
    }
  };

  // -- Custom handleDateChange
  const handleDateChangeLocal = (id, value) => {
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
  const _handleQuantityChange = (id, value) => {
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
  const _saveAllEdits = async () => {
    if (hasDailyErrors) {
      toast.error("Corrige los errores diarios antes de guardar");
      return;
    }
    let errorOccurred = false;
    const ids = Object.keys(editFormData);
    const toInsertIds = ids.filter((id) => String(id).startsWith("tmp-"));
    const toUpdateIds = ids.filter((id) => !String(id).startsWith("tmp-"));

    const allRowsToSave = [...toInsertIds, ...toUpdateIds].map(
      (id) => editFormData[id] || {}
    );
    const jobNosNeeded = allRowsToSave
      .filter((r) => r.job_no) // ✅ Obtener info de TODOS los proyectos para departamento
      .map((r) => r.job_no);

    const jobResponsibleMap = await fetchJobInfo(jobNosNeeded);

    // INSERT
    if (toInsertIds.length > 0) {
      const rowsToInsert = toInsertIds.map((id) =>
        prepareRowForDb(editFormData[id], jobResponsibleMap)
      );
      const { error: insertErr } = await supabaseClient
        .from("timesheet")
        .insert(rowsToInsert);
      if (insertErr) {
        console.error("Error insertando nuevas líneas:", insertErr);
        errorOccurred = true;
      }
    }

    // UPDATE
    for (const id of toUpdateIds) {
      const row = prepareRowForDb(editFormData[id], jobResponsibleMap);
      const { error } = await supabaseClient
        .from("timesheet")
        .update(row)
        .eq("id", id);
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

    // Invalidate para que React Query recargue líneas
    try {
      await queryClient.invalidateQueries({
        queryKey: ["lines", effectiveHeaderId],
      });
    } catch {
      /* ignore */
    }
  };

  const isLoadingView = loading && effectiveHeaderId;

  useEffect(() => {
    // Autocompletar allocation_period en la URL para /nuevo-parte si falta
    if (location.pathname === "/nuevo-parte") {
      const params = new URLSearchParams(location.search);
      const ap = params.get("allocation_period");
      if (!ap) {
        if (!serverDate) return; // Esperar a serverDate para evitar usar la fecha local
        const now = serverDate;
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const newAp = `M${yy}-M${mm}`;
        params.set("allocation_period", newAp);
        navigate(`${location.pathname}?${params.toString()}`, {
          replace: true,
        });
      }
    }
  }, [location.pathname, location.search, navigate, serverDate]);

  if (isLoadingView) {
    return <div>Cargando datos...</div>;
  }

  return (
    <div className="timesheet-edit-page" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div className="timesheet-container ts-page">
        {/* Header de navegación (componente unificado) */}
        <div
          ref={headerBarRef}
          className="ts-header-bar"
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}
        >
          <BackToDashboard compact={true} />
          <h1
            className="ts-page-title"
            style={{
              color: "#007E87",
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              lineHeight: 1,
              position: "relative",
              top: -1,
            }}
          >
            {header ? "Editar Parte de Horas" : "Nuevo Parte de Horas"}
          </h1>
        </div>

        {/* Sección del header y calendario - altura fija */}
        <div ref={headerSectionRef} className="timesheet-header-section" style={{ flex: "0 0 auto" }}>
          {/* Header, resumen y calendario en la misma fila, alineados a la derecha */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            {/* Header a la izquierda */}
          <div style={{ flex: 1, pointerEvents: isReadOnly ? 'none' : 'auto', opacity: isReadOnly ? 0.9 : 1 }}>
              <TimesheetHeader
                header={header}
                onHeaderChange={setEditableHeader}
                serverDate={serverDate}
              />
            </div>

            {/* Panel derecho con resumen y calendario - fijo a la derecha */}
            <div style={{ marginLeft: 24, flexShrink: 0 }}>
              {/* 🆕 Chip con fecha del servidor, igual al dashboard */}
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  backgroundColor: "#f5f5f5",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  marginBottom: 8,
                  textAlign: "right",
                }}
              >
                {serverDate
                  ? serverDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Cargando..."}
              </div>

              <CalendarPanel
                calRange={calRange}
                firstOffset={firstOffset}
                calendarDays={calendarDays}
                requiredSum={requiredSum}
                imputedSum={imputedSum}
                missingSum={missingSum}
                rightPadState={[rightPad, setRightPad]}
                onDayClick={(iso) => {
                  try {
                    const display = toDisplayDate(iso);

                    const focusFirstAvailable = (lineId) => {
                      const order = [
                        "job_no",
                        "date",
                        "quantity",
                        "work_type",
                        "description",
                      ];
                      setTimeout(() => {
                        for (const key of order) {
                          const el = inputRefs.current?.[lineId]?.[key];
                          if (el && !el.disabled) {
                            el.focus();
                            el.select?.();
                            return;
                          }
                        }
                      }, 0);
                    };

                    // Si ya existe esa fecha
                    const idx = lines.findIndex(
                      (l) => toIsoFromInput(l.date) === iso
                    );
                    if (idx !== -1) {
                      const id = lines[idx].id;
                      focusFirstAvailable(id);
                      return;
                    }

                    // Reutilizar una tmp- vacía si existe
                    const emptyTmp = (lines || []).find((l) => {
                      const isTmp = String(l.id || "").startsWith("tmp-");
                      const qty = Number(l.quantity) || 0;
                      const noData = !(
                        l.job_no ||
                        l.job_task_no ||
                        l.description ||
                        l.work_type ||
                        l.date
                      );
                      return isTmp && noData && qty === 0;
                    });

                    if (emptyTmp) {
                      const id = emptyTmp.id;
                      setEditFormData((prev) => ({
                        ...prev,
                        [id]: { ...(prev[id] || {}), date: display },
                      }));
                      setLines((prev) =>
                        sortLines(
                          prev.map((l) =>
                            l.id === id ? { ...l, date: display } : l
                          )
                        )
                      );
                      focusFirstAvailable(id);
                      return;
                    }

                    // Crear nueva si no hay tmp vacía
                    const newId = addEmptyLine();
                    setEditFormData((prev) => ({
                      ...prev,
                      [newId]: { ...(prev[newId] || {}), date: display },
                    }));
                    setLines((prev) =>
                      sortLines(
                        prev.map((l) =>
                          l.id === newId ? { ...l, date: display } : l
                        )
                      )
                    );
                    focusFirstAvailable(newId);
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sección de líneas - ocupa todo el espacio restante */}
        <div className="timesheet-lines-section">
          {/* Controles de líneas */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: "12px",
            }}
          >
            {/* 🆕 Botones de acción para líneas seleccionadas */}
            <div style={{ display: "flex", gap: "8px" }}>
              {/* 🆕 Botón Importar Factorial */}
              <button
                onClick={handleImportFactorial}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(_e) => {
                  _e.target.style.backgroundColor = "#D9F0F2";
                  _e.target.style.borderColor = "transparent";
                }}
                onMouseLeave={(_e) => {
                  _e.target.style.backgroundColor = "#ffffff";
                  _e.target.style.borderColor = "transparent";
                }}
              >
                📅 Importar Factorial
              </button>

              <button
                onClick={() => {
                  if (handleDuplicateLines && selectedLines.length > 0) {
                    handleDuplicateLines(selectedLines);
                  }
                }}
                disabled={selectedLines.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  color: selectedLines.length > 0 ? "#000" : "#9ca3af",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedLines.length > 0 ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(_e) => {
                  if (selectedLines.length > 0) {
                    _e.target.style.backgroundColor = "#D9F0F2";
                    _e.target.style.borderColor = "transparent";
                  }
                }}
                onMouseLeave={(_e) => {
                  if (selectedLines.length > 0) {
                    _e.target.style.backgroundColor = "#ffffff";
                    _e.target.style.borderColor = "transparent";
                  }
                }}
              >
                📋 Duplicar
              </button>

              <button
                onClick={() => {
                  if (handleDeleteLines && selectedLines.length > 0) {
                    handleDeleteLines(selectedLines);
                  }
                }}
                disabled={selectedLines.length === 0}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#ffffff",
                  color: selectedLines.length > 0 ? "#000" : "#9ca3af",
                  border: "none",
                  borderRadius: "4px",
                  cursor: selectedLines.length > 0 ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(_e) => {
                  if (selectedLines.length > 0) {
                    _e.target.style.backgroundColor = "#D9F0F2";
                    _e.target.style.borderColor = "transparent";
                  }
                }}
                onMouseLeave={(_e) => {
                  if (selectedLines.length > 0) {
                    _e.target.style.backgroundColor = "#ffffff";
                    _e.target.style.borderColor = "transparent";
                  }
                }}
              >
                🗑️ Eliminar
              </button>

              {/* 🆕 Botón Guardar Cambios con estilo BC */}
              <button
                onClick={saveAllChanges}
                disabled={!hasUnsavedChanges || isSaving}
                style={{
                  padding: "8px 16px",
                  backgroundColor: isSaving ? "#D9F0F2" : "#ffffff",
                  color: hasUnsavedChanges ? "#000" : "#9ca3af",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    hasUnsavedChanges && !isSaving ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
                  transition: "all 0.2s ease",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(_e) => {
                  if (hasUnsavedChanges && !isSaving) {
                    _e.target.style.backgroundColor = "#D9F0F2";
                  }
                }}
                onMouseLeave={(_e) => {
                  if (hasUnsavedChanges && !isSaving) {
                    _e.target.style.backgroundColor = "#ffffff";
                  }
                }}
              >
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7L17 3Z"
                        stroke="#007E87"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 3V7H21"
                        stroke="#007E87"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 13H17"
                        stroke="#007E87"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7 17H13"
                        stroke="#007E87"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Guardar
                  </>
                )}
              </button>
            </div>

            {/* 🆕 Botón de Solicitar Aprobación - alineado a la derecha */}
            <button
              onClick={handleOpenApprovalModal}
              disabled={availableDaysForApproval.length === 0}
              className="ts-btn ts-btn--primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 19L19 12L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 12H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Solicitar Aprobación ({availableDaysForApproval.length})
            </button>
          </div>

          {/* Contenedor de la tabla - ocupa todo el espacio disponible */}
          <div ref={tableContainerRef} className="timesheet-table-container" style={{ width: "100%" }}>
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
              handleDateInputChange={handleDateChangeLocal}
              handleDateInputBlur={handleDateInputBlur}
              handleInputFocus={handleInputFocus}
              handleKeyDown={handleKeyDown}
              header={header}
              editableHeader={editableHeader}
              periodChangeTrigger={periodChangeTrigger} // 🆕 Pasar trigger para forzar re-renderizado
              serverDate={serverDate}
              calendarHolidays={calendarHolidays}
              scheduleAutosave={() => {}} // Eliminado
              saveLineNow={() => {}} // Eliminado
              savingByLine={savingByLine}
              onLinesChange={handleLinesChange}
              setLines={setLines}
              effectiveHeaderId={effectiveHeaderId}
              sortLines={sortLines} // 🆕 Passed sortLines function
              deleteLineMutation={deleteLineMutation}
              insertLineMutation={insertLineMutation}
              markAsChanged={markAsChanged}
              // 🆕 Nuevas props para selección de líneas
              onLineSelectionChange={handleLineSelectionChange}
              selectedLines={selectedLines}
              onDuplicateLines={handleDuplicateLines}
              onDeleteLines={handleDeleteLines}
              addEmptyLine={addEmptyLine} // 🆕 Pasar función para agregar línea vacía
              showResponsible={true}
              readOnly={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* Acciones de pie de página */}
      <div className="actions-footer" ref={footerRef}>
        <div className="footer-actions-container">
          {/* CONTENIDO DEL BOTÓN ELIMINADO */}
        </div>
      </div>

      {/* Modal de confirmación de navegación */}
      <BcModal
        isOpen={navigationModal.show}
        onClose={() =>
          setNavigationModal({
            show: false,
            message: "",
            onConfirm: null,
            onCancel: null,
          })
        }
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
            const firstErrorField = Object.keys(
              validationModal.validation?.errors[lineId] || {}
            )[0];
            if (
              firstErrorField &&
              inputRefs.current?.[lineId]?.[firstErrorField]
            ) {
              inputRefs.current[lineId][firstErrorField].focus();
              inputRefs.current[lineId][firstErrorField].select();
            }
          }, 100);
        }}
        onContinueAnyway={() => {
          // Cerrar modal y continuar con el guardado (solo advertencias)
          setValidationModal({ show: false, validation: null });
          // Continuar con guardado estándar
          saveAllChanges();
        }}
      />

      {/* 🆕 Modal de confirmación de eliminación */}
      <BcModal
        isOpen={deleteConfirmModal.show}
        onClose={() =>
          setDeleteConfirmModal({ show: false, lineIds: [], onConfirm: null })
        }
        title="Confirmar eliminación"
        confirmText="Sí, eliminar"
        onConfirm={deleteConfirmModal.onConfirm}
        onCancel={() =>
          setDeleteConfirmModal({ show: false, lineIds: [], onConfirm: null })
        }
        confirmButtonType="danger"
      >
        <p>
          ¿Estás seguro de que quieres eliminar{" "}
          {deleteConfirmModal.lineIds.length} línea
          {deleteConfirmModal.lineIds.length !== 1 ? "s" : ""}?
        </p>
        <p className="text-muted">Esta acción no se puede deshacer.</p>
      </BcModal>

      {/* Modal para datos de calendario no encontrados */}
      <BcModal
        isOpen={showCalendarNotFoundModal}
        onClose={() => {
          setShowCalendarNotFoundModal(false);
          // Redirigir usando React Router respetando basename
          navigate("/");
        }}
        title="Datos de Calendario No Encontrados"
        confirmText="Entendido"
        oneButton={true}
        showActions={true}
      >
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            No se encontraron registros en <strong>calendar_period_days</strong>{" "}
            para los siguientes parámetros:
          </p>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm">
              <div className="mb-1">
                <span className="font-medium">Período:</span>
                <span className="ml-2 text-blue-600">
                  {calendarNotFoundData.allocationPeriod || "No especificado"}
                </span>
              </div>
              <div>
                <span className="font-medium">Tipo de Calendario:</span>
                <span className="ml-2 text-blue-600">
                  {calendarNotFoundData.calendarType || "No especificado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">Esto puede ocurrir si:</p>
          <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
            <li>
              El período seleccionado no tiene datos de calendario configurados
            </li>
            <li>
              El tipo de calendario del recurso no coincide con los datos
              disponibles
            </li>
            <li>
              Los datos de calendario no se han sincronizado desde Business
              Central
            </li>
          </ul>
        </div>
      </BcModal>

      {/* 🆕 Modal de aprobación */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={handleConfirmApproval}
        availableDays={availableDaysForApproval}
        title="Enviar para Aprobación"
      />
    </div>
  );
}

export default TimesheetEdit;
