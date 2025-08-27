import React from "react";

export default function BcCard({ title, children, compact = false, style }) {
  return (
    <div
      className={`bc-card ${compact ? "bc-card--compact" : ""}`}
      style={style}
    >
      {title && (
        <div
          className={`bc-card__title ${compact ? "bc-card__title--small" : ""}`}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}
