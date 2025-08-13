import React, { useEffect, useState, useRef } from "react";
import { supabaseClient } from "../supabaseClient";
import ReactDatePicker from "react-datepicker";
import { parse, isBefore, isAfter, format } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

// Helpers
function formatDate(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function parseDate(str) {
  if (!str) return null;
  const [dd, mm, yyyy] = str.split("/");
  if (!dd || !mm || !yyyy) return null;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
}

function TimesheetEdit({ headerId }) {
  const [header, setHeader] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editFormData, setEditFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [calendarHolidays, setCalendarHolidays] = useState([]);
  const [calendarOpenFor, setCalendarOpenFor] = useState(null);

  const inputRefs = useRef({});
  const selectionRef = useRef({ lineId: null, field: null, start: 0, end: 0 });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: headerData } = await supabaseClient
        .from("resource_timesheet_header")
        .select("*")
        .eq("id", headerId)
        .single();
      setHeader(headerData);

      const { data: linesData } = await supabaseClient
        .from("timesheet")
        .select("*")
        .eq("header_id", headerId);

      if (linesData) {
        linesData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const linesFormatted = linesData.map((line) => ({
          ...line,
          date: line.date ? format(new Date(line.date), "dd/MM/yyyy") : "",
        }));
        setLines(linesFormatted);

        const initialEditData = {};
        linesFormatted.forEach((line) => {
          initialEditData[line.id] = { ...line };
        });
        setEditFormData(initialEditData);

        const refsInit = {};
        linesFormatted.forEach((line) => {
          refsInit[line.id] = {};
        });
        inputRefs.current = refsInit;
      }
      setLoading(false);
    }
    fetchData();
  }, [headerId]);

  useEffect(() => {
    async function fetchHolidays() {
      if (!header) return;
      const { data } = await supabaseClient
        .from("calendar_period_days")
        .select("*")
        .eq("allocation_period", header?.allocation_period)
        .eq("calendar_code", header?.resource_calendar)
        .eq("holiday", true);
      setCalendarHolidays(data || []);
    }
    fetchHolidays();
  }, [header]);

  const isHoliday = (date) => {
    if (!calendarHolidays || calendarHolidays.length === 0) return false;
    const dayISO = format(date, "yyyy-MM-dd");
    return calendarHolidays.some((h) => h.day === dayISO && h.holiday === true);
  };

  const fields = [
    "job_no",
    "job_task_no",
    "description",
    "work_type",
    "date",
    "quantity",
    "department_code",
  ];

  // --- Edición de Inputs ---
  const handleInputChange = (lineId, e) => {
    const { name, value } = e.target;
    if (name === "date" && header) {
      validateAndSetDate(lineId, value);
      return;
    }
    selectionRef.current = {
      lineId,
      field: name,
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [name]: value,
      },
    }));
  };

  // Cambia el valor de fecha desde el calendario (o manual)
  const handleDateInputChange = (lineId, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        date: value,
      },
    }));
  };
  const handleDateInputBlur = (lineId, value) => {
    validateAndSetDate(lineId, value);
  };
  const validateAndSetDate = (lineId, value) => {
    if (!header) return;
    const fromDate = parse(header.from_date, "yyyy-MM-dd", new Date());
    const toDate = parse(header.to_date, "yyyy-MM-dd", new Date());
    const newDate = parseDate(value);

    if (!newDate || isNaN(newDate.getTime())) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], date: `Fecha inválida` },
      }));
      return;
    }
    if (isBefore(newDate, fromDate) || isAfter(newDate, toDate)) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          date: `La fecha debe estar entre ${formatDate(fromDate)} y ${formatDate(toDate)}`,
        },
      }));
      return;
    }
    if (isHoliday(newDate)) {
      setErrors((prev) => ({
        ...prev,
        [lineId]: {
          ...prev[lineId],
          date: `La fecha es un día festivo`,
        },
      }));
      return;
    }
    setErrors((prev) => {
      if (prev[lineId]) {
        const newLineErrors = { ...prev[lineId] };
        delete newLineErrors.date;
        return { ...prev, [lineId]: newLineErrors };
      }
      return prev;
    });
    setEditFormData((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        date: value,
      },
    }));
  };

  // Navegación y selección
  const handleInputFocus = (lineId, field, e) => {
    const sel = selectionRef.current;
    if (sel.lineId === lineId && sel.field === field) {
      setTimeout(() => {
        e.target.setSelectionRange(sel.start, sel.end);
      }, 0);
    } else {
      e.target.select();
    }
  };
  const handleKeyDown = (e, lineIndex, fieldIndex) => {
    const key = e.key;
    if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) return;
    e.preventDefault();
    let nextLineIndex = lineIndex;
    let nextFieldIndex = fieldIndex;
    if (key === "ArrowUp") {
      nextLineIndex = lineIndex > 0 ? lineIndex - 1 : lines.length - 1;
    } else if (key === "ArrowDown") {
      nextLineIndex = lineIndex < lines.length - 1 ? lineIndex + 1 : 0;
    } else if (key === "ArrowLeft") {
      nextFieldIndex = fieldIndex > 0 ? fieldIndex - 1 : fields.length - 1;
      if (nextFieldIndex === fields.length - 1) {
        nextLineIndex = lineIndex > 0 ? lineIndex - 1 : lines.length - 1;
      }
    } else if (key === "ArrowRight" || key === "Tab") {
      nextFieldIndex = fieldIndex < fields.length - 1 ? fieldIndex + 1 : 0;
      if (nextFieldIndex === 0) {
        nextLineIndex = lineIndex < lines.length - 1 ? lineIndex + 1 : 0;
      }
    }
    const nextLineId = lines[nextLineIndex].id;
    const nextField = fields[nextFieldIndex];
    const nextInput = inputRefs.current?.[nextLineId]?.[nextField];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
      selectionRef.current = {
        lineId: nextLineId,
        field: nextField,
        start: 0,
        end: nextInput.value.length,
      };
    }
  };

  // Guardar líneas
  const saveAllEdits = async () => {
    let errorOccurred = false;
    for (const lineId in editFormData) {
      const updateData = { ...editFormData[lineId] };
      delete updateData.id;
      if (updateData.date) {
        const [dd, mm, yyyy] = updateData.date.split("/");
        updateData.date = `${yyyy}-${mm}-${dd}`;
      }
      const { error } = await supabaseClient
        .from("timesheet")
        .update(updateData)
        .eq("id", lineId);
      if (error) {
        console.error(`Error actualizando línea ${lineId}:`, error);
        errorOccurred = true;
      }
    }
    if (errorOccurred) {
      alert("Hubo errores al guardar. Revisa la consola.");
    } else {
      alert("Todas las líneas se han guardado correctamente.");
      const { data: linesData } = await supabaseClient
        .from("timesheet")
        .select("*")
        .eq("header_id", headerId);
      if (linesData) {
        linesData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const linesFormatted = linesData.map((line) => ({
          ...line,
          date: line.date ? format(new Date(line.date), "dd/MM/yyyy") : "",
        }));
        setLines(linesFormatted);
        const initialEditData = {};
        linesFormatted.forEach((line) => {
          initialEditData[line.id] = { ...line };
        });
        setEditFormData(initialEditData);
      }
    }
  };

  if (!headerId) return <div>Seleccione una cabecera para editar.</div>;
  if (loading) return <div>Cargando datos...</div>;

  return (
    <div>
      {header && (
        <table style={{
          width: "100%",
          marginBottom: "20px",
          borderCollapse: "separate",
          borderSpacing: "0 10px",
        }}>
          <tbody>
            <tr>
              <td style={{ width: "25%", fontWeight: "bold", paddingRight: "10px" }}>Nº</td>
              <td style={{ width: "25%" }}>{header.id}</td>
              <td style={{ width: "25%", fontWeight: "bold", paddingRight: "10px" }}>Fecha registro</td>
              <td style={{ width: "25%" }}>{new Date(header.created_at).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Nº recurso</td>
              <td>{header.resource_no}</td>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Fecha parte</td>
              <td>{header.posting_date}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Descripción</td>
              <td>{header.posting_description}</td>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Texto registro</td>
              <td>{header.posting_description}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Código departamento</td>
              <td>{header.department_code}</td>
              <td style={{ fontWeight: "bold", paddingRight: "10px" }}>Enviado a BC</td>
              <td>{header.synced_to_bc ? "✅" : "❌"}</td>
            </tr>
          </tbody>
        </table>
      )}

      <h3>Líneas</h3>
      <button onClick={saveAllEdits} style={{ marginBottom: "10px" }}>
        Guardar todos
      </button>
      {lines.length === 0 ? (
        <p>No hay líneas para esta cabecera.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Nº proyecto</th>
              <th>Nº tarea</th>
              <th>Descripción</th>
              <th>Tipo trabajo</th>
              <th>Fecha día trabajo</th>
              <th>Cantidad</th>
              <th>Departamento</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, lineIndex) => (
              <tr key={line.id}>
                {fields.map((field, fieldIndex) => (
                  <td key={field} style={{ padding: "0", position: "relative" }}>
                    {field === "date" ? (
                      <div style={{ width: "100%", position: "relative", display: "flex", alignItems: "center" }}>
                        <input
                          type="text"
                          name="date"
                          value={editFormData[line.id]?.date || ""}
                          onChange={(e) => handleDateInputChange(line.id, e.target.value)}
                          onBlur={(e) => handleDateInputBlur(line.id, e.target.value)}
                          onFocus={(e) => handleInputFocus(line.id, "date", e)}
                          onKeyDown={(e) => handleKeyDown(e, lineIndex, fieldIndex)}
                          ref={(el) => {
                            if (!inputRefs.current[line.id]) inputRefs.current[line.id] = {};
                            inputRefs.current[line.id]["date"] = el;
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            padding: "4px 26px 4px 6px",
                            boxSizing: "border-box",
                            fontSize: "inherit",
                            fontFamily: "inherit",
                            backgroundColor: "transparent",
                            cursor: "text",
                            outline: "2px solid #4A90E2",
                          }}
                          autoComplete="off"
                          id={`input-date-${line.id}`}
                        />
                        <FiCalendar
                          onClick={() => setCalendarOpenFor(line.id)}
                          style={{
                            position: "absolute",
                            right: 6,
                            top: "50%",
                            transform: "translateY(-50%)",
                            cursor: "pointer",
                            color: "#4A90E2",
                            fontSize: 18,
                          }}
                          tabIndex={-1}
                          aria-label="Abrir calendario"
                        />
                        {calendarOpenFor === line.id && (
                          <div style={{
                            position: "absolute", left: 0, top: 32, zIndex: 1000,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.13)"
                          }}>
                            <ReactDatePicker
                              selected={parseDate(editFormData[line.id]?.date)}
                              onChange={(date) => {
                                const formatted = formatDate(date);
                                handleDateInputChange(line.id, formatted);
                                handleDateInputBlur(line.id, formatted);
                                setCalendarOpenFor(null);
                              }}
                              onClickOutside={() => setCalendarOpenFor(null)}
                              dateFormat="dd/MM/yyyy"
                              minDate={header ? new Date(header.from_date) : null}
                              maxDate={header ? new Date(header.to_date) : null}
                              filterDate={(date) => {
                                if (
                                  calendarHolidays.some(
                                    (h) => format(h.day, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
                                  )
                                ) {
                                  return false;
                                }
                                return true;
                              }}
                              inline
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={editFormData[line.id]?.[field] || ""}
                        onChange={(e) => handleInputChange(line.id, e)}
                        onFocus={(e) => handleInputFocus(line.id, field, e)}
                        onKeyDown={(e) => handleKeyDown(e, lineIndex, fieldIndex)}
                        ref={(el) => {
                          if (!inputRefs.current[line.id]) inputRefs.current[line.id] = {};
                          inputRefs.current[line.id][field] = el;
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          padding: "4px 6px",
                          boxSizing: "border-box",
                          outline: "2px solid #4A90E2",
                          fontSize: "inherit",
                          fontFamily: "inherit",
                          backgroundColor: "transparent",
                          textAlign: "left",
                          cursor: "text",
                        }}
                      />
                    )}
                    {field === "date" && errors[line.id]?.date && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          color: "red",
                          fontSize: "0.8em",
                          backgroundColor: "#ffe6e6",
                          padding: "2px 4px",
                          borderRadius: "3px",
                          zIndex: 1,
                        }}
                      >
                        {errors[line.id].date}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TimesheetEdit;
