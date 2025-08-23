import React from "react";
import "../../styles/TimesheetLines.css";

export default function ProjectDescriptionCell({
  line,
  lineIndex,
  colStyle,
  align,
  jobs,
  findJob,
  editFormData, // Agregar editFormData para detectar cambios
}) {
  // Usar editFormData.job_no si está disponible, sino usar line.job_no
  const currentJobNo = editFormData?.job_no || line.job_no;

  // Priorizar job_no_description de editFormData o line, luego buscar en jobs
  let projectDescription = editFormData?.job_no_description || line.job_no_description;

  // Si no hay descripción directa, buscar el proyecto para obtener su descripción
  if (!projectDescription) {
    const project = findJob ? findJob(currentJobNo) : null;
    projectDescription = project?.description || "";
  }

  return (
    <td
      className="ts-td"
      style={{
        ...colStyle,
        textAlign: align,
        backgroundColor: "#ffffff", // Color de fondo blanco
        color: "#000000", // Color de texto negro
        cursor: "default", // Cursor normal (no pointer)
      }}
      data-col="job_no_description"
    >
      <div
        className="ts-cell-content"
        style={{
          padding: "0px 1px",
          fontSize: "10px",
          lineHeight: "1",
          whiteSpace: "normal", // Permitir saltos de línea
          wordWrap: "break-word", // Romper palabras largas
        }}
        title={projectDescription} // Tooltip con descripción completa
      >
        {projectDescription || (
          <span style={{ fontStyle: "italic", color: "#adb5bd" }}>
            Sin descripción
          </span>
        )}
      </div>
    </td>
  );
}
