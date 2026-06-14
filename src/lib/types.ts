export type LeadStatus =
  | "prospecto"
  | "contactado"
  | "demo"
  | "propuesta"
  | "cerrado"
  | "perdido";

export const LEAD_STATUSES: LeadStatus[] = [
  "prospecto",
  "contactado",
  "demo",
  "propuesta",
  "cerrado",
  "perdido",
];

export const STATUS_LABELS: Record<LeadStatus, string> = {
  prospecto: "Prospecto",
  contactado: "Contactado",
  demo: "Demo",
  propuesta: "Propuesta",
  cerrado: "Cerrado",
  perdido: "Perdido",
};

export type InteractionType = "call" | "whatsapp" | "visit" | "email" | "demo";

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: "Llamada",
  whatsapp: "WhatsApp",
  visit: "Visita",
  email: "Email",
  demo: "Demo",
};

export interface Vertical {
  id: string;
  name: string;
  icon: string;
  color: string;
  order?: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  verticalId: string;
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  website?: string;
  instagramHandle?: string;
  estimatedTicketUSD: number;
  status: LeadStatus;
  notes: string;
  nextActionDate: string | null;
  nextActionDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  leadId: string;
  date: string;
  type: InteractionType;
  notes: string;
}
