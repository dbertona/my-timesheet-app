## Descripción

Resumen del cambio y motivación.

## Checklist de calidad

- [ ] Reutiliza el patrón de celda estándar (sin inline styles innecesarios)
- [ ] Editable y Factorial usan el mismo componente (`disabled + ts-input-factorial`)
- [ ] Navegación por teclado delegada a `useTimesheetEdit` (`TIMESHEET_FIELDS`)
- [ ] Alineación consistente (`td` con textAlign; input hereda)
- [ ] Iconos con `pr-icon` y posicionamiento correcto
- [ ] Fechas: normalización (día, dd/MM), rango del período y bloqueo de festivos
- [ ] Errores renderizados con clases `ts-error`/`ts-inline-error`
- [ ] `npm run lint` y `npm run build` pasan
- [ ] Probado en `npm run preview`

## Notas de implementación

Detalles, riesgos y decisiones tomadas.
