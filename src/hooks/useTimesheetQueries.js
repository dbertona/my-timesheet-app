import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJobsByResource, fetchAllJobsByResource } from "../api/jobs";
import { fetchTasksByJob } from "../api/tasks";
import { supabaseClient } from "../supabaseClient";

export function useJobs(resourceNo) {
  return useQuery({
    queryKey: ["jobs", resourceNo],
    enabled: !!resourceNo,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchJobsByResource(resourceNo),
  });
}

// 🆕 NUEVO HOOK: Trae TODOS los proyectos del recurso (para validación)
export function useAllJobs(resourceNo) {
  return useQuery({
    queryKey: ["allJobs", resourceNo],
    enabled: !!resourceNo,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchAllJobsByResource(resourceNo),
  });
}

export function useWorkTypes(resourceNo) {
  return useQuery({
    queryKey: ["workTypes", resourceNo],
    enabled: !!resourceNo,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("resource_cost")
        .select("work_type")
        .eq("resource_no", resourceNo)
        .order("work_type")
        .limit(2000);
      if (error) throw error;
      const list = (data || []).map((r) => r.work_type).filter(Boolean);
      return Array.from(new Set(list));
    },
  });
}

export function useTasks(jobNo) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["tasks", jobNo],
    enabled: !!jobNo,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchTasksByJob(jobNo),
  });
  const prefetch = async (jobNoToFetch) =>
    queryClient.fetchQuery({
      queryKey: ["tasks", jobNoToFetch],
      queryFn: q.queryFn,
      staleTime: 5 * 60 * 1000,
    });
  return { ...q, prefetch };
}
