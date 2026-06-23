import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import AdminLeaveRequestsCard from "@/components/admin-dashboard/AdminLeaveRequestsCard";
import AdminTeamSummaryCard from "@/components/admin-dashboard/AdminTeamSummaryCard";
import IncompleteLogsCard from "@/components/admin-dashboard/IncompleteLogsCard";

export default function AdminDashboard() {
  const { fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="px-4 my-10 grid grid-cols-2 gap-6 auto-rows-min">
      <AdminLeaveRequestsCard />
      <AdminTeamSummaryCard />
      <IncompleteLogsCard />
    </div>
  );
}
