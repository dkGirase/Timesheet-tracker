import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";

export const useManualAttendanceStore = create((set) => ({
  loading: false,
  error: null,

  overrideAttendance: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post(
        "manager/manual-attendance/override",
        payload
      );

      set({ loading: false });
      return res.data;
    } catch (err) {
      set({
        loading: false,
        error:
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to override attendance",
      });
      throw err;
    }
  },
}));
