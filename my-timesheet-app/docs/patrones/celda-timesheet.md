## Patrón de celdas de Timesheet

### Objetivo

Establecer un contrato único para todas las celdas de la grilla (editable y Factorial) garantizando consistencia visual, navegación por teclado, y reutilización.

### Estructura DOM

```
td.ts-td.ts-cell (style: textAlign según columna)
  div.ts-cell
    div.ts-cell
      input.ts-input[.pr-icon][.ts-input-factorial]
      <Icon /> (chevron / calendar)
  [error]
```

### Reglas

- Editable vs Factorial: mismo componente; usar `disabled={true}` + `.ts-input-factorial`. Nunca `div` con estilos inline.
- Alineación: `td` controla `text-align`; el input hereda con `textAlign: inherit !important`.
- Icono: si existe, añadir `pr-icon` al input para padding derecho.
- Teclado: delegar navegación a `useTimesheetEdit` usando `TIMESHEET_FIELDS`.
- Fechas: normalizar entrada (día, dd/MM), respetar rango del período y bloquear festivos.

### Clases clave

- `.ts-input`, `.ts-input.pr-icon`, `.ts-input-factorial`
- `.ts-icon.ts-icon--chevron | --calendar`
- `.ts-error` y `.ts-inline-error`

### Ejemplo mínimo

```jsx
<td className="ts-td ts-cell" style={{ textAlign: align }}>
  <div className="ts-cell">
    <div className="ts-cell">
      <input className="ts-input pr-icon" />
      <FiChevronDown className="ts-icon ts-icon--chevron" />
    </div>
  </div>
</td>
```
