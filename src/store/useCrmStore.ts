import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Interaction, Lead, LeadStatus, Vertical } from "@/lib/types";
import { seedInteractions, seedLeads, seedVerticals } from "@/lib/seed";
import { uid } from "@/lib/format";

interface CrmState {
  verticals: Vertical[];
  leads: Lead[];
  interactions: Interaction[];

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

      addVertical: (data) => {
        const v: Vertical = {
          id: uid(),
          createdAt: new Date().toISOString(),
          order: get().verticals.length,
          ...data,
        };
        set((s) => ({ verticals: [...s.verticals, v] }));
        return v;
      },
      updateVertical: (id, patch) =>
        set((s) => ({ verticals: s.verticals.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),
      deleteVertical: (id) =>
        set((s) => ({ verticals: s.verticals.filter((v) => v.id !== id) })),
      reorderVerticals: (ids) =>
        set((s) => ({
          verticals: ids
            .map((id, i) => {
              const v = s.verticals.find((x) => x.id === id);
              return v ? { ...v, order: i } : null;
            })
            .filter(Boolean) as Vertical[],
        })),

      addLead: (data) => {
        const now = new Date().toISOString();
        const lead: Lead = { id: uid(), createdAt: now, updatedAt: now, ...data };
        set((s) => ({ leads: [lead, ...s.leads] }));
        return lead;
      },
      updateLead: (id, patch) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: new Date().toISOString() } : l
          ),
        })),
      deleteLead: (id) =>
        set((s) => ({
          leads: s.leads.filter((l) => l.id !== id),
          interactions: s.interactions.filter((i) => i.leadId !== id),
        })),
      moveLead: (id, status) =>
        set((s) => ({
          leads: s.leads.map((l) =>
            l.id === id ? { ...l, status, updatedAt: new Date().toISOString() } : l
          ),
        })),

      addInteraction: (data) => {
        const it: Interaction = { id: uid(), ...data };
        set((s) => ({ interactions: [it, ...s.interactions] }));
        return it;
      },
      deleteInteraction: (id) =>
        set((s) => ({ interactions: s.interactions.filter((i) => i.id !== id) })),

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
        return { addedLeads, addedVerticals };
      },

      resetToSeed: () =>
        set({ verticals: seedVerticals, leads: seedLeads, interactions: seedInteractions }),
    }),
    { name: "crm-v1" }
  )
);
