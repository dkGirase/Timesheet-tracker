import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

export const useDashboardStore = create((set, get) => ({
  loading: false,
  error: null,

  users: [],
  teams: [],
  selectedTeam: null,

  leaveRequests: [],
  overtimeRequests: [],
  leaveLoading: false,
  reassignTeams: [],
  reassignLoading: false,

  fetchReassignTeams: async () => {
    try {
      const res = await axiosInstance.get("/admin/teams/team-names");
      set({ reassignTeams: res.data.data || [] });
    } catch (err) {
      toast.error("Failed to load teams");
    }
  },

  reassignTeamMembers: async (oldTeamId, payload) => {
    try {
      set({ reassignLoading: true });

      await axiosInstance.post(
        `/admin/teams/${oldTeamId}/reassign-members`,
        payload,
      );

      toast.success("Team restructured successfully");

      // Optional refresh
      get().fetchTeams?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Failed to reassign team members",
      );
    } finally {
      set({ reassignLoading: false });
    }
  },

  fetchAdminLeaveRequests: async () => {
    set({ leaveLoading: true });
    try {
      const res = await axiosInstance.get("/admin/requests");

      set({
        leaveRequests: res.data.leaveRequests || [],
        overtimeRequests: res.data.overtimeRequests || [],
        leaveLoading: false,
      });
    } catch (err) {
      set({ leaveLoading: false });
      toast.error("Failed to load requests");
      throw err;
    }
  },

  // ======================
  // FETCH USERS + TEAMS
  // ======================
  fetchDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const [usersRes, teamsRes] = await Promise.all([
        axiosInstance.get("/admin/users"),
        axiosInstance.get("/admin/teams"),
      ]);

      set((state) => {
        const updatedTeams = teamsRes.data.data;

        // 🔥 re-sync selected team
        const updatedSelectedTeam = state.selectedTeam
          ? updatedTeams.find((t) => t.id === state.selectedTeam.id) || null
          : null;

        return {
          users: usersRes.data.users,
          teams: updatedTeams,
          selectedTeam: updatedSelectedTeam,
          loading: false,
        };
      });
    } catch (err) {
      set({ error: "Failed to load dashboard data", loading: false });
      throw err;
    }
  },

  createTeam: async ({ name, description, managerId, memberIds, weekends }) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.post("/admin/teams/create", {
        name,
        description,
        managerId,
        memberIds,
        weekends,
      });

      // 1. Show success immediately
      toast.success("Team created successfully!");

      // 2. Try to refresh, but don't let a refresh error break the 'Create' flow
      try {
        await set.getState().fetchDashboardData();
      } catch (refreshErr) {
        console.error(
          "Dashboard refresh failed, but team was created",
          refreshErr,
        );
      }
    } catch (err) {
      // Only show error toast if the POST request actually failed
      const errorMsg = err?.response?.data?.error || "Failed to create team";
      toast.error(errorMsg);
      throw err; // Re-throw so the Dialog knows not to close
    } finally {
      set({ loading: false });
    }
  },

  // ======================
  // TEAM SELECTION
  // ======================
  setSelectedTeam: (team) => set({ selectedTeam: team }),
  clearSelectedTeam: () => set({ selectedTeam: null }),

  toggleUserActivation: async (userId, currentStatus) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/activation`, {
        isActive: !currentStatus,
      });
      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId ? { ...u, isActive: !currentStatus } : u,
        ),
      }));
      toast.success(
        `${currentStatus ? "Deactivated" : "Activated"} successfully`,
      );
    } catch {
      toast.error("Failed to change user status");
    }
  },
  removeTeamMember: async (teamId, memberId) => {
    // 🔥 Snapshot for rollback safety
    const prevTeams = get().teams;
    const prevSelectedTeam = get().selectedTeam;

    try {
      // 🔥 1. OPTIMISTIC UI UPDATE
      set((state) => ({
        teams: state.teams.map((team) =>
          team.id === teamId
            ? {
              ...team,
              teamMembers: team.teamMembers.filter(
                (m) => m.userId !== memberId,
              ),
            }
            : team,
        ),
        selectedTeam:
          state.selectedTeam?.id === teamId
            ? {
              ...state.selectedTeam,
              teamMembers: state.selectedTeam.teamMembers.filter(
                (m) => m.userId !== memberId,
              ),
            }
            : state.selectedTeam,
      }));

      // 🔥 2. API CALL
      await axiosInstance.delete(`/admin/teams/${teamId}/members`, {
        data: { memberIds: [memberId] },
      });

      toast.success("Member removed from team");

      // 🔄 3. BACKGROUND SAFE REFRESH (optional but kept)
      try {
        await get().fetchDashboardData();
      } catch (refreshErr) {
        console.warn("Member removed, but refresh failed", refreshErr);
      }
    } catch (err) {
      // 🔁 ROLLBACK if API fails
      set({
        teams: prevTeams,
        selectedTeam: prevSelectedTeam,
      });

      toast.error(err?.response?.data?.error || "Failed to remove team member");
      throw err;
    }
  },

  updateTeamManager: async (teamId, managerId) => {
    // 🔒 Snapshot for rollback
    const prevTeams = get().teams;
    const prevSelectedTeam = get().selectedTeam;

    try {
      // 🔥 1. OPTIMISTIC UI UPDATE
      set((state) => {
        const newManager =
          managerId === null
            ? null
            : state.users.find((u) => u.id === managerId) || null;

        return {
          teams: state.teams.map((team) =>
            team.id === teamId
              ? {
                ...team,
                manager: newManager,
              }
              : team,
          ),
          selectedTeam:
            state.selectedTeam?.id === teamId
              ? {
                ...state.selectedTeam,
                manager: newManager,
              }
              : state.selectedTeam,
        };
      });

      // 🔥 2. API CALL
      await axiosInstance.patch(`/admin/teams/${teamId}/manager`, {
        managerId, // can be null
      });

      toast.success(
        managerId ? "Manager updated successfully" : "Manager removed",
      );

      // 🔄 3. SAFE BACKGROUND REFRESH (kept, non-blocking)
      try {
        await get().fetchDashboardData();
      } catch (refreshErr) {
        console.warn("Manager updated, but refresh failed", refreshErr);
      }
    } catch (err) {
      // 🔁 ROLLBACK on failure
      set({
        teams: prevTeams,
        selectedTeam: prevSelectedTeam,
      });

      toast.error(err?.response?.data?.error || "Failed to update manager");
      throw err;
    }
  },

  updateTeamWeekends: async (teamId, weekends) => {
    set({ loading: true });
    const previousTeams = get().teams;
    const previousSelected = get().selectedTeam;

    try {
      set((state) => {
        if (!state.selectedTeam || state.selectedTeam.id !== teamId)
          return state;

        const updatedWeekends = weekends.map((w) => ({
          day: w.day,
          startDate: w.startDate,
          endDate: null,
        }));

        const newSelectedTeam = {
          ...state.selectedTeam,
          teamWeekends: updatedWeekends,
        };

        return {
          selectedTeam: newSelectedTeam,
          teams: state.teams.map((t) =>
            t.id === teamId ? newSelectedTeam : t,
          ),
        };
      });

      await axiosInstance.patch(`/admin/teams/${teamId}/weekends`, {
        weekends,
      });
      toast.success("Team weekends updated");

      await get().fetchDashboardData();
    } catch (err) {
      set({ teams: previousTeams, selectedTeam: previousSelected });
      toast.error(
        err?.response?.data?.error || "Failed to update team weekends",
      );
    } finally {
      set({ loading: false });
    }
  },

  updateLeaveRequestStatus: (leaveId, status) =>
    set((state) => ({
      leaveRequests: state.leaveRequests.map((r) =>
        r.id === leaveId ? { ...r, status } : r,
      ),
    })),
    
  updateOvertimeRequestStatus: (id, status) =>
    set((state) => ({
      overtimeRequests: state.overtimeRequests.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    })),


  updateTeamDescription: async (teamId, description) => {
    const prevTeams = get().teams;
    const prevSelected = get().selectedTeam;

    try {
      // Optimistic update
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId ? { ...t, description } : t,
        ),
        selectedTeam:
          state.selectedTeam?.id === teamId
            ? { ...state.selectedTeam, description }
            : state.selectedTeam,
      }));

      await axiosInstance.patch(`/admin/teams/${teamId}/description`, {
        description,
      });

      toast.success("Description updated");
    } catch (err) {
      set({ teams: prevTeams, selectedTeam: prevSelected });
      toast.error(err?.response?.data?.error || "Failed to update description");
      throw err;
    }
  },

  deactivateTeam: async (teamId, shutdownRemark) => {
    try {
      await axiosInstance.patch(`/admin/teams/${teamId}/deactivate`, {
        shutdownRemark,
      });

      toast.success("Team deactivated successfully");

      await get().fetchDashboardData();
      set({ selectedTeam: null });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to deactivate team");
      throw err;
    }
  },

  updateUserRole: (userId, newRole) =>
    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u,
      ),
    })),
}));
