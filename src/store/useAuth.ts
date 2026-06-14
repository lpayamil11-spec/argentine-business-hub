import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/lib/types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3400/api";

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadMe: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (username, password) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.error || "Credenciales inválidas");
        }
        const { token, user } = await res.json();
        set({ token, user });
      },

      logout: () => set({ token: null, user: null }),

      // Revalida el token contra la API; si es inválido cierra sesión.
      loadMe: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await fetch(`${BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401) {
            set({ token: null, user: null });
            return;
          }
          if (res.ok) set({ user: (await res.json()).user });
        } catch {
          // Sin conexión: se mantiene la sesión actual.
        }
      },
    }),
    { name: "crm-auth" }
  )
);

// Accesores para módulos no-React (cliente API).
export const getToken = () => useAuth.getState().token;
export const clearAuth = () => useAuth.getState().logout();
