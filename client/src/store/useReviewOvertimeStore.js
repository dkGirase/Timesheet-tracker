import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { useDashboardStore } from "@/store/useDashboardStore";
import { OVERTIME_STATUS } from "@/constants";

export const useReviewOvertimeStore = create((set) => ({
  overtimeDetails: null,
  loading: false,

  fetchOvertimeDetails: async (id) => {
    set({ loading: true });
    try {
      const { data } = await axiosInstance.get(`/overtime-requests/${id}`);
      set({ overtimeDetails: data.data || null });
    } finally {
      set({ loading: false });
    }
  },

  approveOvertime: async (id) => {
    set({ loading: true });
    try {
      await axiosInstance.post(`/manager/overtime-approvals/${id}/approve`);

      set((state) => ({
        overtimeDetails: {
          ...state.overtimeDetails,
          status: OVERTIME_STATUS.APPROVED,
        },
      }));

      useDashboardStore.setState((state) => ({
        overtimeRequests: state.overtimeRequests.map((r) =>
          r.id === id ? { ...r, status: OVERTIME_STATUS.APPROVED } : r,
        ),
      }));
    } finally {
      set({ loading: false });
    }
  },
  rejectOvertime: async (id, remarks) => {
    set({ loading: true });
    try {
      await axiosInstance.post(`/manager/overtime-approvals/${id}/reject`, {
        remarks,
      });

      set((state) => ({
        overtimeDetails: {
          ...state.overtimeDetails,
          status: OVERTIME_STATUS.REJECTED,
        },
      }));

      useDashboardStore.setState((state) => ({
        overtimeRequests: state.overtimeRequests.map((r) =>
          r.id === id ? { ...r, status: OVERTIME_STATUS.REJECTED } : r,
        ),
      }));
    } finally {
      set({ loading: false });
    }
  },

  clearOvertimeDetails: () => set({ overtimeDetails: null }),
}));
