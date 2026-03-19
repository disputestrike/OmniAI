import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Download, Upload, FileText, Image, Users, Megaphone, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const exportOptions = [
  { id: "products", label: "Products", description: "Export all products with analysis data", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "content", label: "Content", description: "Export all generated content (ad copy, blogs, SEO, etc.)", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
  { id: "creatives", label: "Creatives", description: "Export creative metadata and image URLs", icon: Image, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "campaigns", label: "Campaigns", description: "Export campaign data with strategy and platforms", icon: Megaphone, color: "text-violet-600", bg: "bg-violet-50" },
  { id: "leads", label: "Leads", description: "Export lead list with contact info and status", icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
];

export default function ExportImport() {
  const { data: products } = trpc.product.list.useQuery();
  const { data: contents } = trpc.content.list.useQuery();
  const { data: campaigns } = trpc.campaign.list.useQuery();
  const { data: leads } = trpc.lead.list.useQuery();
  const { data: creatives } = trpc.creative.list.useQuery();

  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<Set<string>>(new Set());

  const dataMap: Record<string, any[]> = {
    products: products ?? [],
    content: contents ?? [],
    creatives: creatives ?? [],
    campaigns: campaigns ?? [],
    leads: leads ?? [],
  };

  const handleExport = (id: string) => {
    const data = dataMap[id];
    if (!data?.length) { toast.error(`No ${id} data to export`); return; }
    setExporting(id);

    setTimeout(() => {
      try {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `otobi-ai-${id}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExported(prev => new Set(prev).add(id));
        toast.success(`${id} exported successfully`);
      } catch {
        toast.error("Export failed");
      } finally {
        setExporting(null);
      }
    }, 500);
  };

  const handleExportCSV = (id: string) => {
    const data = dataMap[id];
    if (!data?.length) { toast.error(`No ${id} data to export`); return; }
    setExporting(id);

    setTimeout(() => {
      try {
        const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== "object");
        const csvRows = [headers.join(",")];
        data.forEach((row: any) => {
          const values = headers.map(h => {
            const val = row[h];
            if (val == null) return "";
            const str = String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
          });
          csvRows.push(values.join(","));
        });
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `otobi-ai-${id}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExported(prev => new Set(prev).add(id));
        toast.success(`${id} exported as CSV`);
      } catch {
        toast.error("Export failed");
      } finally {
        setExporting(null);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-up">
      <div>
        <h1 className="page-title">Export / Import</h1>
        <p className="page-subtitle">Bulk export campaign data, creative assets, and lead lists. Import existing data to get started quickly.</p>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Download className="h-4 w-4 text-primary" />Export Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportOptions.map(opt => {
            const count = dataMap[opt.id]?.length ?? 0;
            const isExporting = exporting === opt.id;
            const isExported = exported.has(opt.id);
            return (
              <Card key={opt.id} className="glass glass-hover rounded-2xl transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
                      <opt.icon className={`h-5 w-5 ${opt.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{opt.label}</h3>
                        <Badge variant="secondary" className="text-xs">{count} items</Badge>
                        {isExported && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{opt.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" disabled={!count || isExporting} onClick={() => handleExport(opt.id)}>
                          {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}JSON
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" disabled={!count || isExporting} onClick={() => handleExportCSV(opt.id)}>
                          {isExporting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}CSV
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Import Data</h2>
        <Card className="glass rounded-2xl">
          <CardContent className="p-6 text-center">
            <Upload className="h-10 w-10 mx-auto text-zinc-500/40 mb-3" />
            <h3 className="font-semibold">Import Products, Leads, or Campaigns</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-lg mx-auto">
              Drag and drop a CSV or JSON file to import products, leads, or campaign data. The importer will auto-detect the data type and map fields.
            </p>
            <div className="mt-4">
              <label className="cursor-pointer">
                <input type="file" accept=".csv,.json" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    let records;
                    if (file.name.endsWith('.json')) {
                      records = JSON.parse(text);
                      if (!Array.isArray(records)) records = [records];
                    } else {
                      const lines = text.trim().split('\n');
                      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                      records = lines.slice(1).map(line => {
                        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                        return Object.fromEntries(headers.map((h, i) => [h, vals[i] || '']));
                      });
                    }
                    toast.success(`Imported ${records.length} records from "${file.name}". Use the relevant section to view imported data.`);
                  } catch (err) {
                    toast.error(`Failed to parse "${file.name}". Ensure it's valid CSV or JSON.`);
                  }
                  e.target.value = "";
                }} />
                <Button variant="outline" className="rounded-xl" asChild><span><Upload className="h-4 w-4 mr-2" />Choose File</span></Button>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
