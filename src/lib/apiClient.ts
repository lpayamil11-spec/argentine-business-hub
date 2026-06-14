import { getToken, clearAuth } from "@/store/useAuth";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3400/api";

/**
 * Fetch autenticado contra la API REST. Adjunta el Bearer token y, ante un 401,
 * cierra la sesión y redirige al login.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("No autenticado");
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `API ${res.status} ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}
