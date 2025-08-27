import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTimesheetLines } from "../api/timesheet";

export default function useTimesheetLines(headerId) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["lines", headerId],
    enabled: !!headerId,
    staleTime: 60 * 1000,
    queryFn: () => fetchTimesheetLines(headerId),
  });

  const invalidate = async () => {
    if (!headerId) return;
    await queryClient.invalidateQueries({ queryKey: ["lines", headerId] });
  };

  return { ...query, invalidate };
}
