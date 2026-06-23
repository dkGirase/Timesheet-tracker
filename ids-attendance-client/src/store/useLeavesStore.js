import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { LEAVE_STATUS_LABELS } from "@/constants";

const mapStatusToHuman = (status) => {
  if (!status) return "Unknown";
  return LEAVE_STATUS_LABELS[status] || status;
};

export const useLeaveStore = create((set, get) => ({
  requests: [],
  loading: false,
  error: null,
  teamWeekends: [],
  holidays: [],
  leaveBalanceRange: null,
  leaveBalanceLoading: false,

  fetchLeaveBalanceByRange: async (fromDate, toDate) => {
    if (!fromDate || !toDate) return;

    set({ leaveBalanceLoading: true });

    try {
      const res = await axiosInstance.get(
        "/leave-requests/leave-balance/range",
        {
          params: { fromDate, toDate },
        },
      );

      set({
        leaveBalanceRange: res.data,
        leaveBalanceLoading: false,
      });

      return res.data;
    } catch (err) {
      set({ leaveBalanceLoading: false });
      throw err;
    }
  },

  // ✅ FETCH LEAVE REQUESTS
  fetchMyRequests: async ({ page = 1, limit = 20, status } = {}) => {
    set({ loading: true, error: null });

    try {
      const params = { page, limit };
      if (status) params.status = status;

      const res = await axiosInstance.get("/leave-requests", { params });

      const data = (res.data?.data || []).map((r) => ({
        ...r,
        humanStatus: mapStatusToHuman(r.status),
      }));

      set({ requests: data, loading: false });
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to fetch";
      set({ loading: false, error: message });
      throw err;
    }
  },

  fetchLeaveRequestsForUser: async function (
    userId,
    { page = 1, limit = 20, status } = {},
  ) {
    set({ loading: true, error: null });

    try {
      const params = { page, limit };
      if (status) params.status = status;
      const res = await axiosInstance.get(`/leave-requests/user/${userId}`, {
        params,
      });

      const data = (res.data?.data || []).map((r) => ({
        ...r,
        humanStatus: mapStatusToHuman(r.status),
      }));

      set({ requests: data, loading: false });
      return data;
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to fetch";
      set({ loading: false, error: message });
      console.error("Failed to fetch user's leave requests", err);
      throw err;
    }
  },

  // ✅ CREATE LEAVE REQUEST
  createLeaveRequest: async (body) => {
    set({ loading: true, error: null });

    try {
      const res = await axiosInstance.post("/leave-requests", body);

      const newRequest = res.data?.data;
      newRequest.humanStatus = mapStatusToHuman(newRequest.status);

      set((state) => ({
        requests: [newRequest, ...state.requests],
        loading: false,
      }));

      return newRequest;
    } catch (err) {
      const message =
        err?.response?.data?.message || err.message || "Failed to create";
      set({ loading: false, error: message });
      throw err;
    }
  },

  fetchMyTeamWeekends: async () => {
    const res = await axiosInstance.get("/leave-requests/my-weekends");
    set({ teamWeekends: res.data.weekends });
  },

  fetchHolidays: async () => {
    try {
      const res = await axiosInstance.get("/users/holidays");
      set({ holidays: res.data?.data || [] });
    } catch (err) {
      console.error("Failed to fetch holidays", err);
    }
  },
}));
