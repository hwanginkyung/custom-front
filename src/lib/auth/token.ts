const AUTH_TOKEN_CHANGED_EVENT = "auth-token-changed";

function notifyTokenChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
  }
}

export const setAccessToken = (token: string) => {
  localStorage.setItem("accessToken", token);
  notifyTokenChanged();
};

export const getAccessToken = () => {
  return localStorage.getItem("accessToken");
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem("refreshToken", token);
  notifyTokenChanged();
};

export const getRefreshToken = () => {
  return localStorage.getItem("refreshToken");
};

export const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  notifyTokenChanged();
};
