import { useMemo, useState } from "react";
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { useCrmStore } from "@/store/useCrmStore";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/lib/types";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadDrawer } from "@/components/leads/LeadDrawer";
import { STATUS_COLUMN_ACCENT } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/format";

interface Props {
  filterVerticalId: string | null;
}

export function KanbanBoard({ filterVerticalId }: Props) {
  const leads = useCrmStore((s) => s.leads);
  const moveLead = useCrmStore((s) => s.moveLead);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(
    () => (filterVerticalId ? leads.filter((l) => l.verticalId === filterVerticalId) : leads),
    [leads, filterVerticalId]
  );

  const byStatus = useMemo(() => {
    const map: Record<LeadStatus, typeof leads> = {
      prospecto: [], contactado: [], demo: [], propuesta: [], cerrado: [], perdido: [],
    };
    for (const l of filtered) map[l.status].push(l);
    return map;
  }, [filtered]);

  const onDragEnd = (e: DragEndEvent) => {
    const overId = e.over?.id;
    const activeId = e.active.id as string;
    if (!overId) return;
    const newStatus = String(overId) as LeadStatus;
    if (!LEAD_STATUSES.includes(newStatus)) return;
    const lead = leads.find((l) => l.id === activeId);
    if (lead && lead.status !== newStatus) moveLead(activeId, newStatus);
  };

  return (
    <>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
          {LEAD_STATUSES.map((status) => (
            <Column key={status} status={status} leads={byStatus[status]} onOpen={setOpenLeadId} />
          ))}
        </div>
      </DndContext>
      <LeadDrawer leadId={openLeadId} onClose={() => setOpenLeadId(null)} />
    </>
  );
}

function Column({
  status,
  leads,
  onOpen,
}: {
  status: LeadStatus;
  leads: any[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const total = leads.reduce((s, l) => s + (l.estimatedTicketUSD || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-[280px] flex-shrink-0 snap-start rounded-xl border-t-2 ${STATUS_COLUMN_ACCENT[status]} bg-card/40 transition-colors ${isOver ? "bg-primary/5" : ""}`}
    >
      <div className="p-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{leads.length}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{formatUSD(total)}</p>
      </div>
      <div className="flex flex-col gap-2 p-2 min-h-[120px] flex-1">
        {leads.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">Vacío</p>
        ) : (
          leads.map((l) => <LeadCard key={l.id} lead={l} onClick={() => onOpen(l.id)} />)
        )}
      </div>
    </div>
  );
}
