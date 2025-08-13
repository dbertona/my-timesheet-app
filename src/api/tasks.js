import { supabaseClient } from "../supabaseClient";

export async function fetchTasksByJob(jobNo) {
  if (!jobNo) return [];
  const { data, error } = await supabaseClient
    .from("job_task")
    .select("job_no, no, description")
    .eq("job_no", jobNo)
    .order("no")
    .limit(1000);
  if (error) throw error;
  return data || [];
}



