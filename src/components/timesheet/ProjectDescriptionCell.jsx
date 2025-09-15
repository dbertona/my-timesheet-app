import React from "react";
import "../../styles/TimesheetLines.css";

export default function ProjectDescriptionCell({
  line,
  colStyle,
  align,
  findJob,
  editFormData, // Agregar editFormData para detectar cambios
}) {
  // Usar editFormData.job_no si está disponible, sino usar line.job_no
  const currentJobNo = editFormData?.job_no || line.job_no;

  // Priorizar job_no_description de editFormData o line, luego buscar en jobs
  let projectDescription =
    editFormData?.job_no_description || line.job_no_description;

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
      }}
      data-col="job_no_description"
      title={projectDescription}
    >
      <div className="ts-readonly" style={{ padding: "2px 4px" }}>
        {projectDescription || (
          <span style={{ fontStyle: "italic", color: "#adb5bd" }}>
            Sin descripción
          </span>
        )}
      </div>
    </td>
  );
}
