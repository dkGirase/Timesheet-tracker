import { create } from "zustand";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

export const useOvertimeStore = create((set) => ({
  overtimeRequests: [],
  loading: false,

  createOvertimeRequest: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await axiosInstance.post("/overtime-requests", payload);

      toast.success(data.message || "Overtime request submitted");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to apply overtime");
      return false;
    } finally {
      set({ loading: false });
    }
  },


  fetchMyOvertimeRequests: async (page = 1, limit = 10) => {
    set({ loading: true });
    try {
      const { data } = await axiosInstance.get("/overtime-requests", {
        params: { page, limit },
      });

      set({ overtimeRequests: data.data });
      return data;
    } catch (err) {
      toast.error("Failed to load overtime requests");
    } finally {
      set({ loading: false });
    }
  },
}));
