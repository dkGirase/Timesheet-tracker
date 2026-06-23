import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";

export const useHolidayStore = create((set, get) => ({
  holidays: [],
  loading: false,
  error: null,

  // Fetch holidays (optional year filter)
  fetchHolidays: async (year) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.get("/admin/holidays", {
        params: year ? { year } : {},
      });

      set({ holidays: res.data, loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err?.response?.data?.error || "Failed to fetch holidays",
      });
    }
  },

  // Create single holiday
  createHoliday: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post("/admin/holidays", payload);

      // Optimistic update (append new holiday)
      set((state) => ({
        holidays: [...state.holidays, res.data],
        loading: false,
      }));

      return res.data;
    } catch (err) {
      set({
        loading: false,
        error: err?.response?.data?.error || "Failed to create holiday",
      });
      throw err;
    }
  },

  // Bulk create holidays
  bulkCreateHolidays: async (holidays) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosInstance.post("/admin/holidays/bulk", {
        holidays,
      });

      // Re-fetch to stay in sync
      await get().fetchHolidays();
      set({ loading: false });

      return res.data;
    } catch (err) {
      set({
        loading: false,
        error: err?.response?.data?.error || "Bulk create failed",
      });
      throw err;
    }
  },

  // Delete holiday
  deleteHoliday: async (id) => {
    set({ loading: true, error: null });
    try {
      await axiosInstance.delete(`/admin/holidays/${id}`);

      set((state) => ({
        holidays: state.holidays.filter((h) => h.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({
        loading: false,
        error: err?.response?.data?.error || "Delete failed",
      });
      throw err;
    }
  },

  // ADD this method inside the store
updateHoliday: async (id, payload) => {
  set({ loading: true, error: null });
  try {
    const res = await axiosInstance.put(`/admin/holidays/${id}`, payload);

    set((state) => ({
      holidays: state.holidays.map((h) =>
        h.id === id ? res.data : h
      ),
      loading: false,
    }));

    return res.data;
  } catch (err) {
    set({
      loading: false,
      error: err?.response?.data?.error || "Update failed",
    });
    throw err;
  }
},

}));
