/**
 * Service layer for CRM data operations.
 *
 * Currently backed by the Zustand store (persisted to localStorage).
 * Switch to remote REST API by setting VITE_USE_REMOTE_API=true.
 * All remote endpoints are relative to BASE_URL.
 */
import type { Interaction, Lead, Vertical } from "@/lib/types";
import { useCrmStore } from "@/store/useCrmStore";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3400/api";
export const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === "true";

async function remote<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const verticalsApi = {
  list: async (): Promise<Vertical[]> =>
    USE_REMOTE ? remote("/verticals") : useCrmStore.getState().verticals,
  create: async (data: Omit<Vertical, "id" | "createdAt" | "order">) =>
    USE_REMOTE
      ? remote<Vertical>("/verticals", { method: "POST", body: JSON.stringify(data) })
      : useCrmStore.getState().addVertical(data),
  update: async (id: string, patch: Partial<Vertical>) =>
    USE_REMOTE
      ? remote<Vertical>(`/verticals/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
      : useCrmStore.getState().updateVertical(id, patch),
  remove: async (id: string) =>
    USE_REMOTE
      ? remote<void>(`/verticals/${id}`, { method: "DELETE" })
      : useCrmStore.getState().deleteVertical(id),
};

export const leadsApi = {
  list: async (): Promise<Lead[]> =>
    USE_REMOTE ? remote("/leads") : useCrmStore.getState().leads,
  create: async (data: Omit<Lead, "id" | "createdAt" | "updatedAt">) =>
    USE_REMOTE
      ? remote<Lead>("/leads", { method: "POST", body: JSON.stringify(data) })
      : useCrmStore.getState().addLead(data),
  update: async (id: string, patch: Partial<Lead>) =>
    USE_REMOTE
      ? remote<Lead>(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) })
      : useCrmStore.getState().updateLead(id, patch),
  remove: async (id: string) =>
    USE_REMOTE
      ? remote<void>(`/leads/${id}`, { method: "DELETE" })
      : useCrmStore.getState().deleteLead(id),
};

export const interactionsApi = {
  list: async (leadId?: string): Promise<Interaction[]> => {
    if (USE_REMOTE) return remote(`/interactions${leadId ? `?leadId=${leadId}` : ""}`);
    const all = useCrmStore.getState().interactions;
    return leadId ? all.filter((i) => i.leadId === leadId) : all;
  },
  create: async (data: Omit<Interaction, "id">) =>
    USE_REMOTE
      ? remote<Interaction>("/interactions", { method: "POST", body: JSON.stringify(data) })
      : useCrmStore.getState().addInteraction(data),
  remove: async (id: string) =>
    USE_REMOTE
      ? remote<void>(`/interactions/${id}`, { method: "DELETE" })
      : useCrmStore.getState().deleteInteraction(id),
};
