import { createFileRoute, Link } from "@tanstack/react-router";
import { useCrmStore } from "@/store/useCrmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSD, formatDate, isOverdue, isToday } from "@/lib/format";
import { INTERACTION_LABELS } from "@/lib/types";
import { VerticalBadge } from "@/components/common/VerticalBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { TrendingUp, Users, Target, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Agencia CRM" },
      { name: "description", content: "Resumen del pipeline de ventas y seguimientos pendientes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const leads = useCrmStore((s) => s.leads);
  const verticals = useCrmStore((s) => s.verticals);
  const interactions = useCrmStore((s) => s.interactions);

  const open = leads.filter((l) => l.status !== "cerrado" && l.status !== "perdido");
  const pipelineValue = open.reduce((s, l) => s + (l.estimatedTicketUSD || 0), 0);
  const closed = leads.filter((l) => l.status === "cerrado").length;
  const lost = leads.filter((l) => l.status === "perdido").length;
  const conversion = closed + lost > 0 ? (closed / (closed + lost)) * 100 : 0;

  const followUps = open
    .filter((l) => isOverdue(l.nextActionDate) || isToday(l.nextActionDate))
    .sort((a, b) => (a.nextActionDate || "").localeCompare(b.nextActionDate || ""));

  const recentInteractions = [...interactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  const chartData = verticals.map((v) => ({
    name: v.name,
    leads: leads.filter((l) => l.verticalId === v.id).length,
    color: v.color,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumen de tu pipeline de ventas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Total leads" value={leads.length.toString()} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Valor del pipeline" value={formatUSD(pipelineValue)} />
        <Kpi icon={<Target className="h-4 w-4" />} label="Conversión" value={`${conversion.toFixed(0)}%`} />
        <Kpi icon={<AlertCircle className="h-4 w-4" />} label="Seguimientos hoy" value={followUps.length.toString()} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Seguimientos para hoy
              <Link to="/pipeline" className="text-xs text-primary hover:underline font-normal">
                Ver pipeline →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin seguimientos pendientes. 🎉</p>
            ) : (
              <ul className="divide-y">
                {followUps.map((l) => {
                  const v = verticals.find((x) => x.id === l.verticalId);
                  const overdue = isOverdue(l.nextActionDate);
                  return (
                    <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium truncate">{l.businessName}</span>
                          <VerticalBadge vertical={v} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{l.nextActionDescription || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs ${overdue ? "text-red-400" : "text-yellow-400"}`}>
                          {overdue ? "Vencido" : "Hoy"} · {formatDate(l.nextActionDate)}
                        </p>
                        <StatusBadge status={l.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads por vertical</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="leads" radius={[6, 6, 0, 0]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Actividad reciente</CardTitle></CardHeader>
        <CardContent>
          {recentInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin actividad.</p>
          ) : (
            <ul className="space-y-3">
              {recentInteractions.map((it) => {
                const lead = leads.find((l) => l.id === it.leadId);
                return (
                  <li key={it.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-medium">{INTERACTION_LABELS[it.type]}</span>
                        {lead && <span className="text-muted-foreground"> · {lead.businessName}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{it.notes}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(it.date)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
          <span>{label}</span>
          <span className={accent ? "text-yellow-400" : "text-primary"}>{icon}</span>
        </div>
        <p className={`text-2xl font-bold mt-2 ${accent ? "text-yellow-400" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
