import { supabaseClient } from "../supabaseClient";

export async function fetchCalendarDays(allocationPeriod, calendarCode) {
  if (!allocationPeriod || !calendarCode) return [];
  const { data, error } = await supabaseClient
    .from("calendar_period_days")
    .select("day,hours_working,holiday,calendar_code,allocation_period")
    .eq("allocation_period", allocationPeriod)
    .eq("calendar_code", calendarCode);
  if (error) throw error;
  return data || [];
}
