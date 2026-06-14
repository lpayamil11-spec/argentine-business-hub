import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type LeadStatus } from "@/lib/types";

const STATUS_STYLES: Record<LeadStatus, string> = {
  prospecto: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  contactado: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  demo: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  propuesta: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  cerrado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  perdido: "bg-red-500/15 text-red-300 border-red-500/30",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={`${STATUS_STYLES[status]} font-medium`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export const STATUS_COLUMN_ACCENT: Record<LeadStatus, string> = {
  prospecto: "border-t-zinc-500",
  contactado: "border-t-blue-500",
  demo: "border-t-yellow-500",
  propuesta: "border-t-orange-500",
  cerrado: "border-t-emerald-500",
  perdido: "border-t-red-500",
};
