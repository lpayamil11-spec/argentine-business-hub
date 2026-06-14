import { useDraggable } from "@dnd-kit/core";
import type { Lead } from "@/lib/types";
import { VerticalBadge } from "@/components/common/VerticalBadge";
import { useCrmStore } from "@/store/useCrmStore";
import { formatUSD, formatDate, isOverdue, isToday } from "@/lib/format";
import { CalendarClock, Phone, User } from "lucide-react";

interface Props {
  lead: Lead;
  onClick: () => void;
}

export function LeadCard({ lead, onClick }: Props) {
  const vertical = useCrmStore((s) => s.verticals.find((v) => v.id === lead.verticalId));
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  const overdue = isOverdue(lead.nextActionDate);
  const today = isToday(lead.nextActionDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="group cursor-grab active:cursor-grabbing rounded-lg border bg-card p-3 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-sm leading-tight flex-1">{lead.businessName}</h4>
        {vertical && <VerticalBadge vertical={vertical} />}
      </div>

      {lead.ownerName && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
          <User className="h-3 w-3" /> {lead.ownerName}
        </p>
      )}
      {lead.phone && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Phone className="h-3 w-3" /> {lead.phone}
        </p>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <span className="text-sm font-semibold text-primary">{formatUSD(lead.estimatedTicketUSD)}</span>
        {lead.nextActionDate && (
          <span
            className={`flex items-center gap-1 text-xs ${
              overdue ? "text-red-400" : today ? "text-yellow-400" : "text-muted-foreground"
            }`}
          >
            <CalendarClock className="h-3 w-3" />
            {formatDate(lead.nextActionDate)}
          </span>
        )}
      </div>
    </div>
  );
}
