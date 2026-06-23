import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";

export const useTeamStore = create((set, get) => ({
  team: null,
  users: [],
  loading: false,
  dialogOpen: false,

  setTeam: (team) => set({ team }),

  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),

  fetchUsers: async () => {
    const res = await axiosInstance.get("/manager/users");
    set({ users: res.data.users || [] });
  },

  addMember: async (teamId, userId) => {
    await axiosInstance.post(`/manager/teams/${teamId}/members`, {
      memberIds: [userId],
    });

    const updated = await axiosInstance.get("/manager/teams/my-team");
    set({ team: updated.data.data[0] });
  },

  removeMember: async (teamId, userId) => {
    await axiosInstance.delete(`/manager/teams/${teamId}/members`, {
      data: { memberIds: [userId] },
    });

    const updated = await axiosInstance.get("/manager/teams/my-team");
    set({ team: updated.data.data[0] });
  },
}));
