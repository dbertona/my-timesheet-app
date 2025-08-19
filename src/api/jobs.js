import { supabaseClient } from "../supabaseClient";

export async function fetchJobsByResource(resourceNo) {
  if (!resourceNo) return [];
  const { data, error } = await supabaseClient
    .from("job")
    .select("no, description, status, job_team!inner(resource_no)")
    .eq("status", "Open")
    .eq("job_team.resource_no", resourceNo)
    .order("no")
    .limit(1000);
  if (error) throw error;
  return (data || []).map((j) => ({
    no: j.no,
    description: j.description,
    status: j.status
  }));
}

// 🆕 NUEVA FUNCIÓN: Trae TODOS los proyectos del recurso (para validación)
export async function fetchAllJobsByResource(resourceNo) {
  if (!resourceNo) return [];
  const { data, error } = await supabaseClient
    .from("job")
    .select("no, description, status, job_team!inner(resource_no)")
    .eq("job_team.resource_no", resourceNo)
    .order("no")
    .limit(1000);
  if (error) throw error;
  return (data || []).map((j) => ({
    no: j.no,
    description: j.description,
    status: j.status
  }));
}

// Función para obtener el status de un proyecto específico (para avisos)
export async function fetchJobStatus(jobNo) {
  if (!jobNo) return null;
  const { data, error } = await supabaseClient
    .from("job")
    .select("status")
    .eq("no", jobNo)
    .single();
  if (error) return null;
  return data?.status;
}



