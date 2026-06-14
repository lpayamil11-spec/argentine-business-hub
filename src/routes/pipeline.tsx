import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KanbanBoard } from "@/components/pipeline/KanbanBoard";
import { VerticalFilterTabs } from "@/components/pipeline/VerticalFilterTabs";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Agencia CRM" },
      { name: "description", content: "Tablero Kanban de prospectos por estado." },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const [vertical, setVertical] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Arrastrá las tarjetas para cambiar de estado</p>
      </div>
      <VerticalFilterTabs value={vertical} onChange={setVertical} />
      {mounted && <KanbanBoard filterVerticalId={vertical} />}
    </div>
  );
}
