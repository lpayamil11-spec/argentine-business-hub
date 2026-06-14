import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Interaction, Lead, LeadStatus, Vertical } from "@/lib/types";
import { seedInteractions, seedLeads, seedVerticals } from "@/lib/seed";
import { uid } from "@/lib/format";
import { apiFetch as api } from "@/lib/apiClient";
import { getToken } from "@/store/useAuth";

/**
 * Fuente de datos del CRM.
 *
 * Por defecto (modo local) trabaja contra estado en memoria persistido en
 * localStorage, sembrado con datos demo. Si se define VITE_USE_REMOTE_API=true,
 * el store hidrata desde la API REST y persiste cada mutación contra el backend
 * (ver VITE_API_BASE_URL). Las mutaciones siguen siendo optimistas: actualizan
 * el estado local al instante y sincronizan con el server en segundo plano,
 * reconciliando el id temporal con el id real que devuelve Mongo.
 */
const USE_REMOTE = import.meta.env.VITE_USE_REMOTE_API === "true";

// El cliente `api` (apiFetch) adjunta el Bearer token y maneja el 401 (cierra
// sesión + redirige a /login).

/** Dispara una llamada remota en segundo plano sin bloquear la UI. */
function sync(promise: Promise<unknown>, label: string) {
  promise.catch((e) => console.error(`[crm] ${label} falló:`, e));
}

interface CrmState {
  verticals: Vertical[];
  leads: Lead[];
  interactions: Interaction[];

  /** true cuando ya se cargaron los datos desde la API (solo modo remoto). */
  hydrated: boolean;
  /** Carga inicial desde la API. No-op en modo local o si ya hidrató. */
  hydrate: () => Promise<void>;

  // Verticals
  addVertical: (data: Omit<Vertical, "id" | "createdAt" | "order">) => Vertical;
  updateVertical: (id: string, patch: Partial<Vertical>) => void;
  deleteVertical: (id: string) => void;
  reorderVerticals: (ids: string[]) => void;

  // Leads
  addLead: (data: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLead: (id: string, status: LeadStatus) => void;

  // Interactions
  addInteraction: (data: Omit<Interaction, "id">) => Interaction;
  deleteInteraction: (id: string) => void;

  // Import / Export
  exportData: () => { verticals: Vertical[]; leads: Lead[]; interactions: Interaction[] };
  importData: (
    payload: { verticals?: Vertical[]; leads?: any[]; interactions?: Interaction[] },
    mode: "merge" | "replace"
  ) => { addedLeads: number; addedVerticals: number };

  resetToSeed: () => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      verticals: seedVerticals,
      leads: seedLeads,
      interactions: seedInteractions,

      hydrated: false,
      hydrate: async () => {
        if (!USE_REMOTE || get().hydrated || !getToken()) return;
        try {
          const [verticals, leads, interactions] = await Promise.all([
            api<Vertical[]>("/verticals"),
            api<Lead[]>("/leads"),
            api<Interaction[]>("/interactions"),
          ]);
          set({ verticals, leads, interactions, hydrated: true });
        } catch (e) {
          console.error("[crm] hydrate falló, se mantienen los datos locales:", e);
        }
      },

      addVertical: (data) => {
        const tempId = uid();
        const v: Vertical = {
          id: tempId,
          createdAt: new Date().toISOString(),
          order: get().verticals.length,
          ...data,
        };
        set((s) => ({ verticals: [...s.verticals, v] }));
        if (USE_REMOTE) {
          sync(
            api<Vertical>("/verticals", {
              method: "POST",
              body: JSON.stringify({ name: v.name, icon: v.icon, color: v.color }),
            }).then((saved) =>
              set((s) => ({
                verticals: s.verticals.map((x) => (x.id === tempId ? saved : x)),
              }))
            ),
            "addVertical"
          );
        }
        return v;
      },
      updateVertical: (id, patch) => {
        set((s) => ({ verticals: s.verticals.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
        if (USE_REMOTE)
          sync(api(`/verticals/${id}`, { method: "PATCH", body: JSON.stringify(patch) }), "updateVertical");
      },
      deleteVertical: (id) => {
        set((s) => ({ verticals: s.verticals.filter((v) => v.id !== id) }));
        if (USE_REMOTE) sync(api(`/verticals/${id}`, { method: "DELETE" }), "deleteVertical");
      },
      reorderVerticals: (ids) => {
        set((s) => ({
          verticals: ids
            .map((id, i) => {
              const v = s.verticals.find((x) => x.id === id);
              return v ? { ...v, order: i } : null;
            })
            .filter(Boolean) as Vertical[],
        }));
        if (USE_REMOTE)
          ids.forEach((id, i) =>
            sync(api(`/verticals/${id}`, { method: "PATCH", body: JSON.stringify({ order: i }) }), "reorderVerticals")
          );
      },

      addLead: (data) => {
        const now = new Date().toISOString();
        const tempId = uid();
        const lead: Lead = { id: tempId, createdAt: now, updatedAt: now, ...data };
        set((s) => ({ leads: [lead, ...s.leads] }));
        if (USE_REMOTE) {
          sync(
            api<Lead>("/leads", { method: "POST", body: JSON.stringify(data) }).then((saved) =>
              set((s) => ({
                leads: s.leads.map((l) => (l.id === tempId ? saved : l)),
                // remapea interacciones creadas contra el id temporal
                interactions: s.interactions.map((i) =>
                  i.leadId === tempId ? { ...i, leadId: saved.id } : i
                ),
              }))
            ),
            "addLead"
          );
        }
        return lead;
      },
      updateLead: (id, patch) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l
          ),
        }));
        if (USE_REMOTE)
          sync(api(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(patch) }), "updateLead");
      },
      deleteLead: (id) => {
        set((s) => ({
          leads: s.leads.filter((l) => l.id !== id),
          interactions: s.interactions.filter((i) => i.leadId !== id),
        }));
        // El backend hace cascada de interacciones al borrar el lead.
        if (USE_REMOTE) sync(api(`/leads/${id}`, { method: "DELETE" }), "deleteLead");
      },
      moveLead: (id, status) => {
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l
          ),
        }));
        if (USE_REMOTE)
          sync(api(`/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }), "moveLead");
      },

      addInteraction: (data) => {
        const tempId = uid();
        const it: Interaction = { id: tempId, ...data };
        set((s) => ({ interactions: [it, ...s.interactions] }));
        if (USE_REMOTE) {
          sync(
            api<Interaction>("/interactions", { method: "POST", body: JSON.stringify(data) }).then((saved) =>
              set((s) => ({
                interactions: s.interactions.map((x) => (x.id === tempId ? saved : x)),
              }))
            ),
            "addInteraction"
          );
        }
        return it;
      },
      deleteInteraction: (id) => {
        set((s) => ({ interactions: s.interactions.filter((i) => i.id !== id) }));
        if (USE_REMOTE) sync(api(`/interactions/${id}`, { method: "DELETE" }), "deleteInteraction");
      },

      exportData: () => {
        const { verticals, leads, interactions } = get();
        return { verticals, leads, interactions };
      },

      importData: (payload, mode) => {
        const state = get();
        let verticals = mode === "replace" ? [] : [...state.verticals];
        let leads = mode === "replace" ? [] : [...state.leads];
        let interactions = mode === "replace" ? [] : [...state.interactions];

        let addedVerticals = 0;
        let addedLeads = 0;

        // Import verticals (full objects)
        if (Array.isArray(payload.verticals)) {
          for (const v of payload.verticals) {
            if (!verticals.find((x) => x.id === v.id || x.name.toLowerCase() === v.name?.toLowerCase())) {
              verticals.push({
                id: v.id || uid(),
                name: v.name,
                icon: v.icon || "🏷️",
                color: v.color || "#b4a0ff",
                order: v.order ?? verticals.length,
                createdAt: v.createdAt || new Date().toISOString(),
              });
              addedVerticals++;
            }
          }
        }

        // Helper to find/create vertical by name
        const ensureVertical = (name: string): string => {
          const found = verticals.find((v) => v.name.toLowerCase() === name.toLowerCase());
          if (found) return found.id;
          const v: Vertical = {
            id: uid(),
            name,
            icon: "🏷️",
            color: "#b4a0ff",
            order: verticals.length,
            createdAt: new Date().toISOString(),
          };
          verticals.push(v);
          addedVerticals++;
          return v.id;
        };

        // Import leads — accept both full shape and Claude Code shape (vertical by name)
        if (Array.isArray(payload.leads)) {
          for (const raw of payload.leads) {
            const verticalId = raw.verticalId
              ? raw.verticalId
              : raw.vertical
              ? ensureVertical(raw.vertical)
              : verticals[0]?.id;
            if (!verticalId) continue;
            // dedupe by businessName+phone in merge mode
            const dup =
              mode === "merge" &&
              leads.find(
                (l) =>
                  l.businessName.toLowerCase() === (raw.businessName || "").toLowerCase() &&
                  l.phone === raw.phone
              );
            if (dup) continue;
            const now = new Date().toISOString();
            leads.push({
              id: raw.id || uid(),
              verticalId,
              businessName: raw.businessName || "Sin nombre",
              ownerName: raw.ownerName || "",
              phone: raw.phone || "",
              email: raw.email || "",
              address: raw.address || "",
              city: raw.city || "",
              website: raw.website || "",
              instagramHandle: raw.instagramHandle || "",
              estimatedTicketUSD: Number(raw.estimatedTicketUSD) || 0,
              status: raw.status || "prospecto",
              notes: raw.notes || "",
              nextActionDate: raw.nextActionDate || null,
              nextActionDescription: raw.nextActionDescription || "",
              createdAt: raw.createdAt || now,
              updatedAt: raw.updatedAt || now,
            });
            addedLeads++;
          }
        }

        if (Array.isArray(payload.interactions)) {
          for (const it of payload.interactions) {
            if (!interactions.find((x) => x.id === it.id)) {
              interactions.push({
                id: it.id || uid(),
                leadId: it.leadId,
                date: it.date,
                type: it.type,
                notes: it.notes || "",
              });
            }
          }
        }

        set({ verticals, leads, interactions });
        // NOTA: la importación masiva todavía no sincroniza con la API en modo
        // remoto (los ids son locales). Pendiente: persistir el alta masiva.
        return { addedLeads, addedVerticals };
      },

      resetToSeed: () => {
        if (USE_REMOTE) {
          // En remoto no re-sembramos: refrescamos desde el server.
          set({ hydrated: false });
          void get().hydrate();
          return;
        }
        set({ verticals: seedVerticals, leads: seedLeads, interactions: seedInteractions });
      },
    }),
    {
      name: "crm-v1",
      // No persistir `hydrated` ni las funciones: así en modo remoto siempre
      // se vuelve a hidratar desde la API al recargar.
      partialize: (s) => ({
        verticals: s.verticals,
        leads: s.leads,
        interactions: s.interactions,
      }),
    }
  )
);
