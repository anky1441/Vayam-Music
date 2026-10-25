import axios from "axios";

// Token helpers for database authentication
export const getToken = () =>
  localStorage.getItem("vayam-token") || localStorage.getItem("token") || "";

export const setToken = (token) => {
  if (token) {
    localStorage.setItem("vayam-token", token);
    localStorage.setItem("token", token);
  }
};

export const clearToken = () => {
  localStorage.removeItem("vayam-token");
  localStorage.removeItem("token");
};

export const isAuthenticated = () => Boolean(getToken());

// Safe error message extractor from backend responses
export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  if (!error.response) {
    return error.message?.includes("Network Error")
      ? "Unable to connect to the server. Please check your internet or try again."
      : error.message || fallback;
  }
  return (
    error.response.data?.message ||
    error.response.data?.error ||
    error.response.data?.detail ||
    fallback
  );
};

// Normalize base URL so it never has trailing slashes or doubled /api
const rawBase =
  import.meta.env.VITE_API_BASE_URL || "https://vayam-music-1.onrender.com";
const cleanBase = rawBase.replace(/\/+$/, "");
const baseURL = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Request interceptor: attaches user token to every database request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: logs out if token expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
      clearToken();
      const currentPath = window.location.pathname;
      if (
        currentPath !== "/login" &&
        currentPath !== "/" &&
        currentPath !== "/register"
      ) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;