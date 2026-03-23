import axios from "axios";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { mapToAppError } from "../error/mapToAppError";
import { getAccessToken, setAccessToken, clearTokens } from "../auth/token";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

function refreshEndpoint(): string {
  return API_BASE_URL ? `${API_BASE_URL}/api/auth/refresh` : "/api/auth/refresh";
}

let refreshInFlight: Promise<string> | null = null;
let lastRefreshFailureAt = 0;
const REFRESH_COOLDOWN_MS = 3_000;

async function requestAccessTokenRefresh(): Promise<string> {
  const now = Date.now();
  if (lastRefreshFailureAt && now - lastRefreshFailureAt < REFRESH_COOLDOWN_MS) {
    return Promise.reject(new Error("Token refresh cooling down"));
  }

  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(refreshEndpoint(), {}, { withCredentials: true, timeout: 10_000 })
      .then((response) => {
        lastRefreshFailureAt = 0;
        return response.data.accessToken as string;
      })
      .catch((err) => {
        lastRefreshFailureAt = Date.now();
        throw err;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export const api = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers?.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  <T>(res: AxiosResponse<T>) => {
    return res.data as T;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    const url = originalRequest?.url ?? "";
    const isAuthEndpoint =
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/signup");

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await requestAccessTokenRefresh();

        setAccessToken(newAccessToken);
        if (originalRequest.headers?.set) {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        } else {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${newAccessToken}`,
          } as any;
        }

        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      throw mapToAppError(error.response.data, error.response.status);
    }
    throw mapToAppError(null);
  },
);
