import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCrmStore } from "@/store/useCrmStore";
import { Download, Upload, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/import-export")({
  head: () => ({
    meta: [
      { title: "Importar / Exportar — Agencia CRM" },
      { name: "description", content: "Backup y carga masiva de leads en formato JSON." },
    ],
  }),
  component: ImportExport,
});

function ImportExport() {
  const exportData = useCrmStore((s) => s.exportData);
  const importData = useCrmStore((s) => s.importData);
  const resetToSeed = useCrmStore((s) => s.resetToSeed);

  const [jsonInput, setJsonInput] = useState("");
  const [mode, setMode] = useState<"merge" | "replace">("merge");

  const doExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado");
  };

  const doImport = () => {
    if (!jsonInput.trim()) return toast.error("Pegá un JSON o subí un archivo");
    try {
      const parsed = JSON.parse(jsonInput);
      const result = importData(parsed, mode);
      toast.success(`Importado: ${result.addedLeads} leads, ${result.addedVerticals} verticales nuevas`);
      setJsonInput("");
    } catch (e) {
      toast.error("JSON inválido");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setJsonInput(text);
    toast.info("Archivo cargado — revisá y presioná Importar");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Importar / Exportar</h1>
        <p className="text-sm text-muted-foreground">Backup completo o carga masiva desde scraping.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar</CardTitle>
          <CardDescription>Descarga un JSON con verticales, leads e interacciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={doExport}><Download className="h-4 w-4" /> Descargar JSON</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar</CardTitle>
          <CardDescription>
            Acepta el backup completo o la forma simplificada de Claude Code (leads con vertical por nombre).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Archivo JSON</Label>
            <input
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-secondary-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label>O pegar JSON</Label>
            <Textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "leads": [ { "businessName": "...", "vertical": "Cafeterías", "phone": "..." } ] }'
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Modo</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="merge" /> Merge (agregar a lo existente)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="replace" /> Reemplazar todo
              </label>
            </RadioGroup>
          </div>

          <Button onClick={doImport}><Upload className="h-4 w-4" /> Importar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resetear a datos de ejemplo</CardTitle>
          <CardDescription>Vuelve a los 3 verticales y 5 leads iniciales (borra todo lo demás).</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline"><RotateCcw className="h-4 w-4" /> Resetear</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Resetear todos los datos?</AlertDialogTitle>
                <AlertDialogDescription>Se borrará todo y se cargarán los datos de ejemplo.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetToSeed(); toast.success("Datos reseteados"); }}>
                  Resetear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
