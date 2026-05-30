const rawBackendUrl =
  process.env.REACT_APP_BACKEND_URL ||
  ((typeof window !== "undefined") &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "");

export const BACKEND_URL = rawBackendUrl.replace(/\/$/, "");

export const apiUrl = (path = "") => {
  if (!path) {
    return BACKEND_URL;
  }

  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
};