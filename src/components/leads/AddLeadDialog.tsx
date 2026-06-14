import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useCrmStore } from "@/store/useCrmStore";
import { LEAD_STATUSES, STATUS_LABELS, type LeadStatus } from "@/lib/types";
import { dateInputToISO } from "@/lib/format";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
  defaultStatus?: LeadStatus;
}

export function AddLeadDialog({ trigger, defaultStatus = "prospecto" }: Props) {
  const [open, setOpen] = useState(false);
  const verticals = useCrmStore((s) => s.verticals);
  const addLead = useCrmStore((s) => s.addLead);

  const [form, setForm] = useState({
    businessName: "",
    verticalId: verticals[0]?.id ?? "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    website: "",
    instagramHandle: "",
    estimatedTicketUSD: "1000",
    status: defaultStatus,
    notes: "",
    nextActionDate: "",
    nextActionDescription: "",
  });

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.businessName.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    if (!form.verticalId) {
      toast.error("Seleccioná una vertical");
      return;
    }
    addLead({
      businessName: form.businessName.trim(),
      verticalId: form.verticalId,
      ownerName: form.ownerName,
      phone: form.phone,
      email: form.email,
      address: form.address,
      city: form.city,
      website: form.website,
      instagramHandle: form.instagramHandle,
      estimatedTicketUSD: Number(form.estimatedTicketUSD) || 0,
      status: form.status as LeadStatus,
      notes: form.notes,
      nextActionDate: form.nextActionDate ? dateInputToISO(form.nextActionDate) : null,
      nextActionDescription: form.nextActionDescription,
    });
    toast.success("Lead agregado");
    setOpen(false);
    setForm({
      businessName: "",
      verticalId: verticals[0]?.id ?? "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      website: "",
      instagramHandle: "",
      estimatedTicketUSD: "1000",
      status: defaultStatus,
      notes: "",
      nextActionDate: "",
      nextActionDescription: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" /> Nuevo Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
          <DialogDescription>Agregá un prospecto al pipeline</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Negocio *</Label>
            <Input value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder="Ej. Lavandería Express" />
          </div>

          <div className="space-y-1.5">
            <Label>Vertical *</Label>
            <Select value={form.verticalId} onValueChange={(v) => update("verticalId", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {verticals.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.icon} {v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Dueño / Contacto</Label>
            <Input value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+54 9 11 ..." />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label>Dirección</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Sitio web</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input value={form.instagramHandle} onChange={(e) => update("instagramHandle", e.target.value)} placeholder="@..." />
          </div>

          <div className="space-y-1.5">
            <Label>Ticket estimado (USD)</Label>
            <Input type="number" value={form.estimatedTicketUSD} onChange={(e) => update("estimatedTicketUSD", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Próxima acción (fecha)</Label>
            <Input type="date" value={form.nextActionDate} onChange={(e) => update("nextActionDate", e.target.value)} />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label>Próxima acción (descripción)</Label>
            <Input value={form.nextActionDescription} onChange={(e) => update("nextActionDescription", e.target.value)} />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label>Notas</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit}>Crear lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
