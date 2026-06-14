import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/useAuth";
import { apiFetch } from "@/lib/apiClient";
import { ROLE_LABELS, type Role, type User } from "@/lib/types";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuarios — Agencia CRM" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const navigate = useNavigate();
  const me = useAuth((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", name: "", password: "", role: "vendedor" as Role });

  // Guard de cliente: la página es solo para admin (la API igual lo exige).
  useEffect(() => {
    if (me && me.role !== "admin") navigate({ to: "/" });
  }, [me, navigate]);

  const load = async () => {
    try {
      setUsers(await apiFetch<User[]>("/users"));
    } catch (e: any) {
      toast.error(e?.message || "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    if (!form.username.trim() || !form.password) return toast.error("Usuario y contraseña requeridos");
    try {
      await apiFetch("/users", { method: "POST", body: JSON.stringify(form) });
      toast.success("Usuario creado");
      setForm({ username: "", name: "", password: "", role: "vendedor" });
      void load();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo crear");
    }
  };

  const patch = async (id: string, body: Partial<User> & { password?: string }) => {
    try {
      await apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success("Usuario actualizado");
      void load();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo actualizar");
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      toast.success("Usuario eliminado");
      void load();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo eliminar");
    }
  };

  const resetPassword = async (u: User) => {
    const pwd = window.prompt(`Nueva contraseña para "${u.username}":`);
    if (pwd) void patch(u.id, { password: pwd });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Gestión de accesos al CRM (solo administradores).</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Nuevo usuario</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr,1fr,1fr,140px,auto] items-end">
            <div className="space-y-1.5">
              <Label className="text-xs">Usuario</Label>
              <Input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} placeholder="ej. ana" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Ana Pérez" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contraseña</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={create}><Plus className="h-4 w-4" /> Crear</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay usuarios.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex-1 min-w-[140px]">
                <p className="font-medium text-sm">{u.name || u.username}</p>
                <p className="text-xs text-muted-foreground">@{u.username}{!u.active && " · inactivo"}</p>
              </div>
              <Select value={u.role} onValueChange={(v) => patch(u.id, { role: v as Role })}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">{ROLE_LABELS.vendedor}</SelectItem>
                  <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => patch(u.id, { active: !u.active })}>
                {u.active ? "Desactivar" : "Activar"}
              </Button>
              <Button variant="ghost" size="icon" title="Resetear contraseña" onClick={() => resetPassword(u)}>
                <KeyRound className="h-4 w-4" />
              </Button>
              {u.id !== me?.id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar a "{u.username}"?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(u.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
