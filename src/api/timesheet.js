import { supabaseClient } from "../supabaseClient";
import { toIsoFromInput } from "../utils/dateHelpers";

// Columnas seguras para escritura/lectura en tabla timesheet
const SAFE_COLUMNS = [
  "header_id",
  "job_no",
  "job_task_no",
  "description",
  "work_type",
  "quantity",
  "date",
  "department_code",
  "company",
  "creado",
  "job_no_and_description",
  "job_responsible",
  "job_responsible_approval",
  "resource_no",
  "resource_responsible",
  "isFactorialLine", // 🆕 Marca para líneas de Factorial (no editables)
];

export function prepareRowForDb(row, { header, jobResponsibleMap } = {}) {
  const out = {};
  for (const key of SAFE_COLUMNS) {
    if (key === "date") {
      const iso = toIsoFromInput(row.date);
      out.date = iso;
    } else if (key === "header_id") {
      out.header_id = header?.id ?? row.header_id ?? null;
    } else if (key === "company") {
      out.company = header?.company ?? row.company ?? "";
    } else if (key === "creado") {
      out.creado = row.creado ?? new Date().toISOString();
    } else if (key === "job_no_and_description") {
      const j = row.job_no || "";
      const d = row.description || "";
      out.job_no_and_description = j && d ? `${j} - ${d}` : `${j}${d}`;
    } else if (key === "job_responsible") {
      const jobNo = row.job_no || "";
      const resolved = jobResponsibleMap?.[jobNo];
      out.job_responsible = resolved ?? row.job_responsible ?? "";
    } else if (key === "job_responsible_approval") {
      out.job_responsible_approval = true;
    } else if (key === "resource_no") {
      out.resource_no = row.resource_no ?? header?.resource_no ?? "";
    } else if (key === "resource_responsible") {
      out.resource_responsible =
        row.resource_responsible ?? header?.resource_no ?? "";
    } else if (key === "quantity") {
      out.quantity = Number(row.quantity) || 0;
    } else {
      out[key] = row[key] ?? null;
    }
  }
  return out;
}

export async function fetchTimesheetLines(headerId) {
  const { data, error } = await supabaseClient
    .from("timesheet")
    .select("*")
    .eq("header_id", headerId);
  if (error) throw error;
  return data || [];
}

export async function updateTimesheetLine(id, row) {
  const { error } = await supabaseClient
    .from("timesheet")
    .update(row)
    .eq("id", id);
  if (error) throw error;
}

export async function insertTimesheetLines(rows) {
  const { error } = await supabaseClient.from("timesheet").insert(rows);
  if (error) throw error;
}
