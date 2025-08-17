import { supabaseClient } from "../supabaseClient";

export async function fetchJobsByResource(resourceNo) {
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



