// src/styles/TimesheetStyles.js

// 🎨 Estilos base para inputs
export const baseInputStyle = {
  width: "100%",
  height: "100%",
  border: "1px solid #ccc",
  padding: "4px 6px",
  boxSizing: "border-box",
  outline: "none",
  boxShadow: "none",
  fontSize: "inherit",
  fontFamily: "inherit",
  backgroundColor: "transparent",
  cursor: "text",
};

// Alineaciones de celdas
export const textCellStyle = { textAlign: "left" };
export const numericCellStyle = { textAlign: "right" };

// Encabezados centrados
export const headerCellStyle = {
  textAlign: "center",
  fontWeight: "bold",
  backgroundColor: "#f7f7f7",
  padding: "8px 6px",
};

// Tabla base
export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

// Borde estándar para celdas
export const cellBorderStyle = {
  border: "1px solid #ddd",
};

// Separador para redimensionar columnas
export const resizerStyle = {
  position: "absolute",
  right: 0,
  top: 0,
  width: 6,
  height: "100%",
  cursor: "col-resize",
  userSelect: "none",
  touchAction: "none",
};
