export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

// Convierte el valor de un <input type="date"> ("YYYY-MM-DD") a ISO interpretándolo
// en hora LOCAL. Evita el corrimiento de un día: new Date("2026-06-12") parsea como
// medianoche UTC y al mostrarse en AR (UTC-3) retrocede al día anterior.
export const dateInputToISO = (value: string): string => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toISOString();
};

export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const isOverdue = (iso: string | null | undefined) => {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

export const isToday = (iso: string | null | undefined) => {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const waLink = (phone: string) => {
  const clean = (phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}`;
};
