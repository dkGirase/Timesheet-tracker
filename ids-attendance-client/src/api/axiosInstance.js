import axios from "axios";
import { getDeviceOperatingSystem, getWebClientPlatform } from "@/utils";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // needed for refresh token in cookie
});

// Request interceptor to add Authorization and x-client-type headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["x-client-type"] = getWebClientPlatform();
    config.headers["x-client-device"] = getDeviceOperatingSystem();

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 and auto refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;

        localStorage.setItem("token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed", refreshError);
        localStorage.removeItem("token");
        window.location.href = "/"; // redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
