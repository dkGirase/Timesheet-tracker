import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";

export const useLogoutRequestStore = create((set) => ({
  missingLogouts: [],
  loading: false,
  error: null,

  adminLogoutRequests: [],
  adminLoading: false,

  managerLogoutRequests: [],
  managerLoading: false,

  fetchManagerLogoutRequests: async () => {
    set({ managerLoading: true });
    try {
      const res = await axiosInstance.get("/manager/logout-requests/team");

      set({
        managerLogoutRequests: res.data.data.filter(
          (r) => r.status === "PENDING",
        ),
        managerLoading: false,
      });
    } catch {
      set({ managerLoading: false });
    }
  },

  approveOrRejectManagerLogoutRequest: async (id, action) => {
    await axiosInstance.patch(`/manager/logout-requests/${id}/action`, {
      action,
    });

    set((state) => ({
      managerLogoutRequests: state.managerLogoutRequests.filter(
        (r) => r.id !== id,
      ),
    }));
  },

  approveOrRejectLogoutRequest: async (id, action) => {
    await axiosInstance.patch(`/admin/logout-requests/${id}/action`, {
      action,
    });

    // 🔥 remove from pending list after action
    set((state) => ({
      adminLogoutRequests: state.adminLogoutRequests.filter((r) => r.id !== id),
    }));
  },

  fetchAdminLogoutRequests: async () => {
    set({ adminLoading: true });
    try {
      const res = await axiosInstance.get("/admin/logout-requests");

      // 🔥 keep only PENDING
      const pendingOnly = res.data.data.filter((r) => r.status === "PENDING");

      set({
        adminLogoutRequests: pendingOnly,
        adminLoading: false,
      });
    } catch (err) {
      set({ adminLoading: false });
    }
  },

  fetchMissingLogouts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/logout-requests/missing");

      set({
        missingLogouts: res.data.data,
        loading: false,
      });
    } catch (err) {
      set({
        loading: false,
        error:
          err?.response?.data?.message || "Failed to fetch missing logouts",
      });
    }
  },

  submitLogoutRequest: async (payload) => {
    // 🔥 You already have backend create method
    return axiosInstance.post("/logout-requests", payload);
  },
}));
