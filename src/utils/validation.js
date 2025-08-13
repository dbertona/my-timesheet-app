import { toIsoFromInput } from "./dateHelpers";

export function buildHolidaySet(calendarHolidays = []) {
  const set = new Set();
  for (const h of calendarHolidays) {
    const iso = (h?.day ? String(h.day) : "").slice(0, 10);
    if (iso && h?.holiday === true) set.add(iso);
  }
  return set;
}

export function computeTotalsByIso(editFormData = {}) {
  const totals = {};
  for (const row of Object.values(editFormData)) {
    const iso = toIsoFromInput(row?.date);
    if (!iso) continue;
    totals[iso] = (totals[iso] || 0) + (Number(row?.quantity) || 0);
  }
  return totals;
}

export function isHolidayIso(iso, holidaySet) {
  return holidaySet?.has?.(iso) || false;
}



