import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants";

import UsersCard from "@/components/admin-dashboard/UsersCard";
import TeamsCard from "@/components/admin-dashboard/TeamsCard";
import TeamMembersCard from "@/pages/TeamMembersCard";

export default function AdminPeoples() {
  const { fetchDashboardData } = useDashboardStore();
  const { user } = useAuthStore();

  useEffect(() => {
    // Fetch dashboard data only for Admins
    if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user?.role]);

  return (
    <div className="grid grid-cols-2 gap-6 mt-10 ml-4 mr-4 auto-rows-min">
      {/* ADMIN / SUPER ADMIN */}
      {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) && (
        <>
          <UsersCard />
          <TeamsCard />
        </>
      )}

      {/* MANAGER */}
      {user?.role === ROLES.MANAGER && <TeamMembersCard />}
    </div>
  );
}
