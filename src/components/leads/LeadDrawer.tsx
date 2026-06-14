import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCrmStore } from "@/store/useCrmStore";
import {
  INTERACTION_LABELS,
  LEAD_STATUSES,
  STATUS_LABELS,
  type InteractionType,
  type LeadStatus,
} from "@/lib/types";
import { dateInputToISO, formatDateTime, waLink } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";
import { VerticalBadge } from "@/components/common/VerticalBadge";
import { MessageCircle, Phone, Copy, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDrawer({ leadId, onClose }: Props) {
  const lead = useCrmStore((s) => s.leads.find((l) => l.id === leadId) ?? null);
  const verticals = useCrmStore((s) => s.verticals);
  // Seleccionar el array crudo y derivar con useMemo: un selector que devuelve
  // un array nuevo en cada render (filter/sort) provoca renders infinitos en
  // zustand v5 + React 19 (error #185 "Maximum update depth exceeded").
  const allInteractions = useCrmStore((s) => s.interactions);
  const interactions = useMemo(
    () =>
      allInteractions
        .filter((i) => i.leadId === leadId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allInteractions, leadId]
  );
  const updateLead = useCrmStore((s) => s.updateLead);
  const deleteLead = useCrmStore((s) => s.deleteLead);
  const addInteraction = useCrmStore((s) => s.addInteraction);

  const vertical = useMemo(() => verticals.find((v) => v.id === lead?.verticalId), [verticals, lead?.verticalId]);

  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [newInt, setNewInt] = useState({
    type: "call" as InteractionType,
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  if (!lead) return null;

  const onField = (k: keyof typeof lead, v: any) => updateLead(lead.id, { [k]: v } as any);

  const saveInteraction = () => {
    if (!newInt.notes.trim()) {
      toast.error("Agregá una nota");
      return;
    }
    addInteraction({
      leadId: lead.id,
      type: newInt.type,
      date: dateInputToISO(newInt.date),
      notes: newInt.notes,
    });
    setNewInt({ type: "call", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowInteractionForm(false);
    toast.success("Interacción agregada");
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    toast.success("Teléfono copiado");
  };

  return (
    <Sheet open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto px-6">
        <SheetHeader className="px-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <SheetTitle className="text-2xl">{lead.businessName}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2 mt-2">
                <VerticalBadge vertical={vertical} />
                <StatusBadge status={lead.status} />
              </SheetDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este lead?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. También se borrarán sus interacciones.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteLead(lead.id);
                      toast.success("Lead eliminado");
                      onClose();
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetHeader>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button asChild size="sm" variant="secondary">
            <a href={waLink(lead.phone)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <a href={`tel:${lead.phone}`}>
              <Phone className="h-4 w-4" /> Llamar
            </a>
          </Button>
          <Button size="sm" variant="secondary" onClick={copyPhone}>
            <Copy className="h-4 w-4" /> Copiar tel.
          </Button>
        </div>

        {/* Editable fields */}
        <div className="mt-6 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estado">
              <Select value={lead.status} onValueChange={(v) => onField("status", v as LeadStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Vertical">
              <Select value={lead.verticalId} onValueChange={(v) => onField("verticalId", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {verticals.map((v) => <SelectItem key={v.id} value={v.id}>{v.icon} {v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Dueño / Contacto">
            <Input value={lead.ownerName} onChange={(e) => onField("ownerName", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono"><Input value={lead.phone} onChange={(e) => onField("phone", e.target.value)} /></Field>
            <Field label="Email"><Input value={lead.email} onChange={(e) => onField("email", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad"><Input value={lead.city} onChange={(e) => onField("city", e.target.value)} /></Field>
            <Field label="Ticket USD">
              <Input type="number" value={lead.estimatedTicketUSD} onChange={(e) => onField("estimatedTicketUSD", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="Dirección"><Input value={lead.address} onChange={(e) => onField("address", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sitio web"><Input value={lead.website ?? ""} onChange={(e) => onField("website", e.target.value)} /></Field>
            <Field label="Instagram"><Input value={lead.instagramHandle ?? ""} onChange={(e) => onField("instagramHandle", e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Próxima acción (fecha)">
              <Input type="date" value={lead.nextActionDate ? lead.nextActionDate.slice(0, 10) : ""} onChange={(e) => onField("nextActionDate", e.target.value ? dateInputToISO(e.target.value) : null)} />
            </Field>
            <Field label="Próxima acción (descripción)">
              <Input value={lead.nextActionDescription} onChange={(e) => onField("nextActionDescription", e.target.value)} />
            </Field>
          </div>
          <Field label="Notas">
            <Textarea rows={3} value={lead.notes} onChange={(e) => onField("notes", e.target.value)} />
          </Field>
        </div>

        {/* Interactions */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historial</h3>
            <Button size="sm" variant="outline" onClick={() => setShowInteractionForm((v) => !v)}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>

          {showInteractionForm && (
            <div className="mb-4 p-3 border rounded-lg space-y-2 bg-card">
              <div className="grid grid-cols-2 gap-2">
                <Select value={newInt.type} onValueChange={(v) => setNewInt((p) => ({ ...p, type: v as InteractionType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(INTERACTION_LABELS) as InteractionType[]).map((t) => (
                      <SelectItem key={t} value={t}>{INTERACTION_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={newInt.date} onChange={(e) => setNewInt((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <Textarea rows={2} placeholder="Notas..." value={newInt.notes} onChange={(e) => setNewInt((p) => ({ ...p, notes: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowInteractionForm(false)}>Cancelar</Button>
                <Button size="sm" onClick={saveInteraction}>Guardar</Button>
              </div>
            </div>
          )}

          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin interacciones todavía.</p>
          ) : (
            <ul className="space-y-3">
              {interactions.map((it) => (
                <li key={it.id} className="border-l-2 border-primary/60 pl-3 py-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{INTERACTION_LABELS[it.type]}</span>
                    <span>{formatDateTime(it.date)}</span>
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{it.notes}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
