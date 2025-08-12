import { useEffect, useState } from "react";
import { supabaseClient } from "../supabaseClient";

export function useOpenProjectsByResource(resourceNo) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    if (!resourceNo) { setProjects([]); return; }
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabaseClient
        .from("job")
        .select(`
          no,
          description,
          status,
          job_team!inner(resource_no)
        `)
        .eq("status", "Open")
        .eq("job_team.resource_no", resourceNo)
        .order("description", { ascending: true });

      if (!cancelled) {
        if (error) setError(error);
        else setProjects((data || []).map(j => ({
          value: j.no,
          label: j.description || j.no
        })));
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [resourceNo]);

  return { projects, loading, error };
}
