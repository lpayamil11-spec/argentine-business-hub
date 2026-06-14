import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCrmStore } from "@/store/useCrmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Vertical } from "@/lib/types";
import { useAuth } from "@/store/useAuth";

export const Route = createFileRoute("/verticals")({
  head: () => ({
    meta: [
      { title: "Verticales — Agencia CRM" },
      { name: "description", content: "Gestión de categorías de negocios." },
    ],
  }),
  component: VerticalsPage,
});

function VerticalsPage() {
  const verticalsRaw = useCrmStore((s) => s.verticals);
  const verticals = useMemo(
    () => [...verticalsRaw].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [verticalsRaw]
  );
  const leads = useCrmStore((s) => s.leads);
  const addVertical = useCrmStore((s) => s.addVertical);
  const reorder = useCrmStore((s) => s.reorderVerticals);
  const isAdmin = useAuth((s) => s.user?.role === "admin");

  const [newV, setNewV] = useState({ name: "", icon: "🏷️", color: "#b4a0ff" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const create = () => {
    if (!newV.name.trim()) return toast.error("Nombre requerido");
    addVertical({ name: newV.name.trim(), icon: newV.icon || "🏷️", color: newV.color });
    setNewV({ name: "", icon: "🏷️", color: "#b4a0ff" });
    toast.success("Vertical creada");
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = verticals.findIndex((v) => v.id === active.id);
    const newIdx = verticals.findIndex((v) => v.id === over.id);
    const next = arrayMove(verticals, oldIdx, newIdx);
    reorder(next.map((v) => v.id));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Verticales</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Categorías de negocios. Arrastrá para reordenar."
            : "Categorías de negocios (solo lectura)."}
        </p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Agregar vertical</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[1fr,80px,80px,auto] items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre</Label>
                <Input value={newV.name} onChange={(e) => setNewV((p) => ({ ...p, name: e.target.value }))} placeholder="Ej. Peluquerías" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ícono</Label>
                <Input value={newV.icon} onChange={(e) => setNewV((p) => ({ ...p, icon: e.target.value }))} maxLength={2} className="text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <Input type="color" value={newV.color} onChange={(e) => setNewV((p) => ({ ...p, color: e.target.value }))} className="h-9 p-1 cursor-pointer" />
              </div>
              <Button onClick={create}><Plus className="h-4 w-4" /> Agregar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={verticals.map((v) => v.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {verticals.map((v) => (
              <VerticalRow
                key={v.id}
                vertical={v}
                leadCount={leads.filter((l) => l.verticalId === v.id).length}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function VerticalRow({ vertical, leadCount, isAdmin }: { vertical: Vertical; leadCount: number; isAdmin: boolean }) {
  const updateVertical = useCrmStore((s) => s.updateVertical);
  const deleteVertical = useCrmStore((s) => s.deleteVertical);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: vertical.id,
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      {isAdmin && (
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <Input
        value={vertical.icon}
        onChange={(e) => updateVertical(vertical.id, { icon: e.target.value })}
        maxLength={2}
        disabled={!isAdmin}
        className="w-12 text-center text-lg"
      />
      <Input
        value={vertical.name}
        onChange={(e) => updateVertical(vertical.id, { name: e.target.value })}
        disabled={!isAdmin}
        className="flex-1"
      />
      <Input
        type="color"
        value={vertical.color}
        onChange={(e) => updateVertical(vertical.id, { color: e.target.value })}
        disabled={!isAdmin}
        className="w-14 h-9 p-1 cursor-pointer"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">{leadCount} leads</span>
      {isAdmin && (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{vertical.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {leadCount > 0
                ? `Hay ${leadCount} lead(s) en esta vertical. No se puede eliminar hasta reasignarlos o borrarlos.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {leadCount === 0 && (
              <AlertDialogAction onClick={() => { deleteVertical(vertical.id); toast.success("Vertical eliminada"); }}>
                Eliminar
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}
    </div>
  );
}
