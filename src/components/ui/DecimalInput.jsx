import React, { useState, useEffect, useRef } from 'react';
import { PLACEHOLDERS } from '../../constants/i18n';

export const DecimalInput = ({
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  inputRef,
  className = '',
  disabled = false,
  placeholder = PLACEHOLDERS.QUANTITY,
  min = 0,
  step = 0.01,
  decimals = 2,
  ...rest
}) => {
  const handleChange = (e) => {
    const input = e.target.value || "";
    const re = new RegExp(`^\\d*(?:[\\.,]\\d{0,${decimals}})?$`);
    if (!re.test(input)) return;
    const normalized = input.replace(/,/g, ".");
    onChange?.({ target: { name, value: normalized } });
  };

  const handleBlur = (e) => {
    const v = (e.target.value || "").trim();
    const num = Math.max(min, Number(v) || 0);
    const fixed = num.toFixed(decimals);
    onBlur?.({ target: { name, value: fixed } });
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      name={name}
      value={value ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      ref={inputRef}
      step={step}
      min={min}
      pattern={`[0-9]*[.,]?[0-9]{0,${decimals}}`}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="off"
      {...rest}
    />
  );
};


