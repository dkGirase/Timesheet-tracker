import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { LEAVE_STATUS_LABELS } from "@/constants";
import { formatDateDDMMYYYY } from "@/utils";

const mapStatusToHuman = (status) => {
  if (!status) return "Unknown";
  return LEAVE_STATUS_LABELS[status] || status;
};

export const useTeamLeaveStore = create((set) => ({
  requests: [],
  overtimeRequests: [],
  loading: false,
  error: null,

  fetchTeamLeaves: async () => {
    try {
      set({ loading: true, error: null });

      const res = await axiosInstance.get("/leave-requests/my-team");

      const leaveList = res.data.leaveRequests || [];

      const formattedLeaves = leaveList.map((r) => ({
        ...r,
        humanStatus: mapStatusToHuman(r.status),
        appliedOn: formatDateDDMMYYYY(r.createdAt),
        type: "LEAVE",
      }));

      const overtimeList = res.data.overtimeRequests || [];

      const formattedOvertime = overtimeList.map((r) => ({
        ...r,
        humanStatus: mapStatusToHuman(r.status),
        appliedOn: formatDateDDMMYYYY(r.createdAt),
        type: "OVERTIME",
      }));

      set({
        requests: formattedLeaves,
        overtimeRequests: formattedOvertime,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error: err.response?.data?.message || "Failed to fetch requests",
      });
    }
  },
}));
