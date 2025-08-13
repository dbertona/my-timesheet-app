import React from "react";

export default function InlineError({ id, text, overlay = false, style, className }) {
  const content = (
    <span className={`ts-inline-error ${className || ""}`.trim()} id={id} role="alert" aria-live="polite" style={style}>
      <span className="ts-inline-error__dot" />
      {text}
    </span>
  );
  if (overlay) {
    return <div className="ts-error">{content}</div>;
  }
  return content;
}



