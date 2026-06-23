import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";

export const useWorkingStatusStore = create((set) => ({
  statuses: {},
  loading: false,

  fetchStatusesForTeam: async (members) => {
    if (!members.length) return;

    set({ loading: true });

    try {
      const userIds = members.map((m) => m.id).join(",");

      const { data } = await axiosInstance.get("/attendance/status", {
        params: { userIds },
      });

      set({ statuses: data });
    } catch {
      set({
        statuses: Object.fromEntries(members.map((m) => [m.id, "NOT_STARTED"])),
      });
    } finally {
      set({ loading: false });
    }
  },
}));
