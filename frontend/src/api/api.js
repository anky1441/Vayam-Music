import axios from "axios";

const TOKEN_KEY = "vayam-token";

// Token helpers: the only place that touches browser storage.
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => Boolean(getToken());

// Turns an axios error into a message that is safe to show to the user.
export const getApiErrorMessage = (error, fallback) => {
  if (!error.response) {
    return "Unable to connect to the server. Please try again.";
  }
  return (
    error.response.data?.message || error.response.data?.error || fallback
  );
};

const api = axios.create({
  baseURL: `${
    import.meta.env.VITE_API_BASE_URL || "https://vayam-music-1.onrender.com"
  }/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token expires or is invalid, log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRequest) {
      clearToken();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;