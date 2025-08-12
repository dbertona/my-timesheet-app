import React from "react";

// Usamos forwardRef para pasar la ref correctamente al input
const TimesheetCell = React.forwardRef(function TimesheetCell(
  { field, value, onChange, onFocus, onKeyDown },
  ref
) {
  return (
    <input
      type="text"
      name={field}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={ref}
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
      autoComplete="off"
    />
  );
});

export default TimesheetCell;
