## Contribución

### Flujo de trabajo

1. Acordar el patrón/alcance (pedir confirmación si impacta UI/arquitectura).
2. Crear rama feature/ o docs/.
3. Implementar en pasos pequeños: 1–2 celdas por PR cuando aplique.
4. Validación: `npm run lint`, `npm run build`, `npm run preview`.
5. Abrir PR con el checklist completo y notas.
6. Revisar, ajustar y mergear.

### Patrones

- Usar el patrón de celdas definido en `docs/patrones/celda-timesheet.md`.
- Evitar estilos inline salvo necesidad puntual.
- Delegar navegación a `useTimesheetEdit`.
- Fechas: helpers en `utils/dateHelpers` y reglas de festivos unificadas.
