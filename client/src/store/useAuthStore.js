import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "@/api/axiosInstance";

export const useAuthStore = create(
  persist(
    (set) => ({
      loading: false,
      error: null,
      user: null,
      isWorking: false,

      setIsWorking: (status) => set({ isWorking: status }),

      signup: async (formData) => {
        set({ loading: true, error: null });
        try {
          const res = await axiosInstance.post("/auth/signup", formData);
          if (res.data.accessToken)
            localStorage.setItem("token", res.data.accessToken);
          set({
            loading: false,
            user: {
              userId: res.data.userId,
              email: res.data.email,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              role: res.data.role,
              employeeCode: res.data.employeeCode,
            },
          });
          return res.data;
        } catch (err) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Signup failed",
          });
          throw new Error(err?.response?.data?.message || "Signup failed");
        }
      },

      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          const res = await axiosInstance.post("/auth/login", credentials);
          localStorage.setItem("token", res.data.accessToken);

          // Optional: fetch current attendance status on login
          const attendanceRes = await axiosInstance.get("/attendance/status");
          const workingStatus = attendanceRes.data?.isWorking || false;

          set({
            loading: false,
            user: {
              userId: res.data.userId,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              email: res.data.email,
              employeeCode: res.data.employeeCode,
              role: res.data.role,
              gender: res.data.gender,
              dateOfBirth: res.data.dateOfBirth,
              dateOfJoining: res.data.dateOfJoining,
              managerName: res.data.managerName || null,
            },

            isWorking: workingStatus, // persist working state
          });

          return res.data;
        } catch (err) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Login failed",
          });
          throw new Error(err?.response?.data?.message || "Login failed");
        }
      },

      updateProfile: async (payload) => {
        set({ loading: true, error: null });

        try {
          await axiosInstance.put("/users/profile", payload);

          // 🔁 Re-fetch profile from backend
          const res = await axiosInstance.get("/users/profile");

          const updatedUser = {
            ...res.data.data,
            dateOfBirth: res.data.data.dateOfBirth
              ? new Date(res.data.data.dateOfBirth)
              : null,
            dateOfJoining: res.data.data.dateOfJoining
              ? new Date(res.data.data.dateOfJoining)
              : null,
          };

          set({
            loading: false,
            user: updatedUser,
          });

          return updatedUser;
        } catch (err) {
          set({
            loading: false,
            error: "Update failed",
          });
          throw err;
        }
      },

      resetPassword: async ({ oldPassword, newPassword }) => {
        set({ loading: true, error: null });

        try {
          const res = await axiosInstance.post("/users/reset-password", {
            oldPassword,
            newPassword,
          });

          set({ loading: false });
          return res.data;
        } catch (err) {
          set({
            loading: false,
            error: err?.response?.data?.message || "Failed to reset password",
          });

          throw err;
        }
      },

      fetchUserProfile: async () => {
        set({ loading: true, error: null });

        try {
          const res = await axiosInstance.get("/users/profile");

          const user = {
            ...res.data.data,
            dateOfBirth: res.data.data.dateOfBirth
              ? new Date(res.data.data.dateOfBirth)
              : null,
            dateOfJoining: res.data.data.dateOfJoining
              ? new Date(res.data.data.dateOfJoining)
              : null,
          };

          set({
            loading: false,
            user,
          });

          return user;
        } catch (err) {
          set({
            loading: false,
            error: "Failed to load profile",
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await axiosInstance.post("/auth/logout");
        } catch (err) {
          console.error("Logout API failed", err);
        } finally {
          set({ user: null, isWorking: false });
        }
      },
    }),
    {
      name: "auth-store",
      getStorage: () => localStorage,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isWorking: state.isWorking, // persist working state
      }),
    },
  ),
);
