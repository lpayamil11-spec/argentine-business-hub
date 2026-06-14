export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

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
