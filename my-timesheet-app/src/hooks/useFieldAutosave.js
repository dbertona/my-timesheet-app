import { useEffect, useRef } from "react";

/**
 * Hook de autoguardado reutilizable por campo (por línea) con debounce.
 * - Detecta cambios en editFormData[field] por id (excepto ids temporales).
 * - Hace UPDATE parcial: UPDATE timesheet SET [field]=... WHERE id=...
 * - Sincroniza localmente lines e initialEditData (optimista).
 *
 * @param {object} params
 * @param {string} params.field            Campo a autoguardar (p.ej. "quantity")
 * @param {number} params.debounceMs       Milisegundos de debounce (def: 700)
 * @param {object} params.editFormData     Estado de edición { [id]: row }
 * @param {object} params.latestEditRef    Ref con el editFormData más reciente
 * @param {Function} params.setLines       setState para lines
 * @param {Function} params.setInitialEditData setState para snapshot inicial
 * @param {object} params.supabaseClient   Cliente supabase
 * @param {Function} [params.isTmpId]      fn para detectar ids temporales
 * @param {Function} [params.selectValue]  fn para leer el valor del campo desde la fila
 * @param {Function} [params.toDbValue]    fn para convertir el valor a formato BD
 */
export default function useFieldAutosave({
  field,
  debounceMs = 700,
  editFormData,
  latestEditRef,
  setLines,
  setInitialEditData,
  supabaseClient,
  isTmpId = (id) => String(id).startsWith("tmp-"),
  selectValue = (row) => (row ? row[field] : undefined),
  toDbValue = (v) => v,
}) {
  const timersRef = useRef(new Map()); // lineId -> timeoutId
  const prevRef = useRef({});          // { [id]: lastValue }

  const schedule = (lineId) => {
    const timers = timersRef.current;
    const prev = timers.get(lineId);
    if (prev) clearTimeout(prev);

    const t = setTimeout(async () => {
      timers.delete(lineId);
      try {
        if (isTmpId(lineId)) return; // no guardar filas temporales

        const raw = selectValue(latestEditRef.current?.[lineId] || {});
        const dbVal = toDbValue(raw);
        const update = { [field]: dbVal };

        const { error } = await supabaseClient
          .from("timesheet")
          .update(update)
          .eq("id", lineId);

        if (error) {
          console.error(`Error autoguardando ${field} (línea ${lineId}):`, error);
          return;
        }

        // Sync optimista local
        setLines((prev) =>
          prev.map((l) => (l.id === lineId ? { ...l, [field]: raw } : l))
        );
        setInitialEditData((prev) =>
          prev && prev[lineId]
            ? { ...prev, [lineId]: { ...prev[lineId], [field]: raw } }
            : prev
        );
      } catch (e) {
        console.error(`Excepción en autoguardado de ${field} (${lineId}):`, e);
      }
    }, debounceMs);

    timers.set(lineId, t);
  };

  // Detectar cambios del campo y programar guardado
  useEffect(() => {
    const ids = Object.keys(editFormData || {});
    for (const id of ids) {
      if (isTmpId(id)) continue;
      const current = selectValue(editFormData[id]);
      const prev = prevRef.current[id];
      if (current !== prev) {
        prevRef.current[id] = current;
        schedule(id);
      }
    }
  }, [editFormData]); // eslint-disable-line react-hooks/exhaustive-deps

  return { schedule };
}
