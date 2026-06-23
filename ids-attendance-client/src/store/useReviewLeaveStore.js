import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { useDashboardStore } from "@/store/useDashboardStore";
import { LEAVE_STATUS } from "@/constants";


export const useReviewLeaveStore = create((set) => ({
  loading: false,
  error: null,
  leaveDetails: null,

  setLeaveDetails: (leave) =>
    set({
      leaveDetails: leave,
      leaveClashes: [], // reset clashes when switching leave
    }),


  fetchLeaveDetails: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get(`/leave-requests/${id}`);
      set({ leaveDetails: res.data, loading: false });
      return res.data;
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to load leave";
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ✅ APPROVE Leave
  approveLeave: async (id) => {
    set({ loading: true });
    try {
      await axiosInstance.post(`/manager/leave-approvals/${id}/approve`);

      // Update dialog state
      set((state) => ({
        leaveDetails: {
          ...state.leaveDetails,
          status: LEAVE_STATUS.APPROVED,
        },
      }));

      // Update dashboard list
      useDashboardStore.setState((state) => ({
        leaveRequests: state.leaveRequests.map((r) =>
          r.id === id ? { ...r, status: LEAVE_STATUS.APPROVED } : r
        ),
      }));
    } finally {
      set({ loading: false });
    }
  },
  // ✅ REJECT Leave
  rejectLeave: async (id, remarks) => {
    set({ loading: true });
    try {
      await axiosInstance.post(`/manager/leave-approvals/${id}/reject`, { remarks });

      // Update dialog state
      set((state) => ({
        leaveDetails: {
          ...state.leaveDetails,
          status: LEAVE_STATUS.REJECTED,
        },
      }));

      // Update dashboard list
      useDashboardStore.setState((state) => ({
        leaveRequests: state.leaveRequests.map((r) =>
          r.id === id ? { ...r, status: LEAVE_STATUS.REJECTED } : r
        ),
      }));
    } finally {
      set({ loading: false });
    }
  },
  fetchLeaveClashes: async (teamId, startDate, endDate) => {
    // NEW
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(`/manager/leave-request-clashes`, {
        teamId,
        startDate,
        endDate,
      });
      set({ leaveClashes: res.data.clashes, loading: false });
      return res.data.clashes;
    } catch (err) {
      set({ error: "Failed to fetch leave clashes", loading: false });
      throw err;
    }
  },

  clearLeaveDetails: () => set({ leaveDetails: null }),
}));
