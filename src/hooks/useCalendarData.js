import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "../supabaseClient";
import { fetchCalendarDays } from "../api/calendar";
import { buildHolidaySet, computeTotalsByIso } from "../utils/validation";

function parseAllocationPeriod(ap) {
  const m = /^M(\d{2})-M(\d{2})$/.exec(ap || "");
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  const year = 2000 + yy;
  const month = parseInt(m[2], 10); // 1..12
  return { year, month };
}

function daysInMonth(year, month) { // month: 1..12
  return new Date(year, month, 0).getDate();
}

function isoOf(y, m, d) {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export default function useCalendarData(header, resolvedHeaderId, editFormData) {
  const [calendarDays, setCalendarDays] = useState([]); // [{ d, iso, need, got, status }]
  const [dailyRequired, setDailyRequired] = useState({}); // { 'YYYY-MM-DD': hours }
  const [calRange, setCalRange] = useState({ year: null, month: null }); // month: 1-12
  const [firstOffset, setFirstOffset] = useState(0); // lunes=0..domingo=6
  const [calendarHolidays, setCalendarHolidays] = useState([]);

  // Cargar festivos (solo holiday === true)
  useEffect(() => {
    async function fetchHolidays() {
      if (!header) return;
      const calendarCode = header?.resource_calendar ?? header?.calendar_code ?? header?.calendar_type ?? null;
      if (!calendarCode) return;
      try {
        const data = await fetchCalendarDays(header?.allocation_period, calendarCode);
        setCalendarHolidays((data || []).filter((d) => d.holiday === true));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error cargando festivos:", error);
      }
    }
    fetchHolidays();
  }, [header]);

  // Construir datos del calendario (requeridas e imputadas persistidas)
  useEffect(() => {
    async function buildCalendar() {
      if (!header) return;
      const apInfo = parseAllocationPeriod(header.allocation_period);
      if (!apInfo) return;
      const { year, month } = apInfo;
      setCalRange({ year, month });

      const first = new Date(year, month - 1, 1);
      const js = first.getDay(); // 0=Dom .. 6=Sáb
      const offset = (js + 6) % 7; // Lunes=0 .. Domingo=6
      setFirstOffset(offset);

      const calendarCode = header?.resource_calendar ?? header?.calendar_code ?? header?.calendar_type ?? null;
      if (!calendarCode) {
        setCalendarDays([]);
        return;
      }

      const fromIso = isoOf(year, month, 1);
      const toIso = isoOf(year, month, daysInMonth(year, month));

      // 1) Horas requeridas por día del calendario laboral
      const calRows = await fetchCalendarDays(header.allocation_period, calendarCode);
      const req = {};
      (calRows || []).forEach((r) => {
        const iso = (r.day || "").slice(0, 10);
        req[iso] = Number(r.hours_working) || 0;
      });
      setDailyRequired(req);

      // 2) Horas imputadas persistidas por día (solo si hay header_id)
      let imp = {};
      if (resolvedHeaderId || header?.id) {
        const { data: tRows, error: tErr } = await supabaseClient
          .from("timesheet")
          .select("date,quantity")
          .eq("header_id", resolvedHeaderId || header.id)
          .gte("date", fromIso)
          .lte("date", toIso);
        if (tErr) {
          // eslint-disable-next-line no-console
          console.error("Error cargando imputaciones:", tErr);
        } else {
          (tRows || []).forEach((r) => {
            const iso = (r.date || "").slice(0, 10);
            const q = Number(r.quantity) || 0;
            imp[iso] = (imp[iso] || 0) + q;
          });
        }
      }

      // 3) Aplicar estados por día con festivos
      const EPS = 0.01;
      const holidaySet = new Set();
      (calRows || []).forEach((day) => {
        const iso = (day.day || "").slice(0, 10);
        if (day.holiday === true) holidaySet.add(iso);
      });

      const arr = [];
      const totalDays = daysInMonth(year, month);
      for (let d = 1; d <= totalDays; d++) {
        const iso = isoOf(year, month, d);
        const requiredHours = req[iso] ?? 0;
        const got = imp[iso] ?? 0;

        let status = "neutral";
        if (holidaySet.has(iso)) {
          status = "sin-horas"; // festivo
        } else if (requiredHours > 0) {
          if (got >= (requiredHours - EPS)) status = "completo";
          else if (got > 0)                status = "parcial";
          else                              status = "cero";
        }

        arr.push({ d, iso, need: requiredHours, got, status });
      }
      setCalendarDays(arr);
    }

    buildCalendar();
  }, [header, resolvedHeaderId]);

  // Actualización en vivo con editFormData
  useEffect(() => {
    if (!calRange?.year || !calRange?.month) return;

    const EPS = 0.01;
    const holidaySet = buildHolidaySet(calendarHolidays);
    const liveImp = computeTotalsByIso(editFormData);

    const arr = [];
    const totalDays = daysInMonth(calRange.year, calRange.month);
    for (let d = 1; d <= totalDays; d++) {
      const iso = isoOf(calRange.year, calRange.month, d);
      const need = dailyRequired?.[iso] ?? 0;
      const got = liveImp?.[iso] ?? 0;

      let status = "neutral";
      if (holidaySet.has(iso)) {
        status = "sin-horas";
      } else if (need > 0) {
        if (got >= (need - EPS)) status = "completo";
        else if (got > 0)        status = "parcial";
        else                      status = "cero";
      }

      arr.push({ d, iso, need, got, status });
    }

    setCalendarDays(arr);
  }, [editFormData, dailyRequired, calRange, calendarHolidays]);

  const requiredSum = useMemo(() => Object.values(dailyRequired || {}).reduce((a, b) => a + (Number(b) || 0), 0), [dailyRequired]);
  const imputedSum = useMemo(() => Object.values(editFormData || {}).reduce((a, r) => a + (Number(r?.quantity) || 0), 0), [editFormData]);
  const missingSum = useMemo(() => Math.max(0, requiredSum - imputedSum), [requiredSum, imputedSum]);

  return {
    calRange,
    firstOffset,
    calendarDays,
    dailyRequired,
    calendarHolidays,
    requiredSum,
    imputedSum,
    missingSum,
  };
}


