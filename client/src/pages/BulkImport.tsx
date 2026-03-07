import { useState, useRef } from "react";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload, FileText, Download, RefreshCw, CheckCircle2, AlertCircle,
  Sparkles, Table, Play, Copy, ChevronRight, BarChart3
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "short_ad", label: "Short Ad (90 chars)" },
  { value: "social_caption", label: "Social Caption" },
  { value: "email_subject", label: "Email Subject Line" },
  { value: "product_description", label: "Product Description" },
  { value: "video_script", label: "Video Script" },
  { value: "blog_intro", label: "Blog Intro" },
];

const PLATFORMS = ["instagram", "tiktok", "facebook", "twitter", "linkedin", "youtube", "email", "general"];
const TONES = ["professional", "casual", "humorous", "urgent", "inspirational", "educational"];

const SAMPLE_CSV = `product_name,description,target_audience,price,key_benefit
"EcoBottle Pro","Stainless steel water bottle","fitness enthusiasts","$29.99","Keeps drinks cold 24 hours"
"SleepMask Ultra","Silk sleep mask with ear plugs","busy professionals","$19.99","Blocks 100% light"
"FocusFlow App","Productivity timer app","remote workers","$9.99/mo","2x productivity in 30 days"
"GreenPowder Mix","Organic greens supplement","health-conscious adults","$49.99","30 superfoods in one scoop"`;

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuotes = !inQuotes;
      } else if (line[i] === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseRow(line);
    return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] || "" }), {} as Record<string, string>);
  });
  return { headers, rows };
}

function BulkImportInner() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [contentType, setContentType] = useState("short_ad");
  const [platform, setPlatform] = useState("instagram");
  const [tone, setTone] = useState("professional");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<"upload" | "configure" | "results">("upload");

  const parseMutation = trpc.advanced.parseBulkCSV.useMutation({
    onSuccess: (data: { headers: string[]; rows: Record<string, string>[]; count: number; preview: Record<string, string>[] }) => {
      setParsed({ headers: data.headers, rows: data.rows });
      setActiveStep("configure");
      toast.success(`Parsed ${data.count} rows with ${data.headers.length} columns`);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  const generateMutation = trpc.advanced.generateBulkContent.useMutation({
    onSuccess: (data) => {
      setResults(data.results);
      setActiveStep("results");
      const success = data.results.filter((r: any) => r.success).length;
      toast.success(`Generated content for ${success}/${data.results.length} rows`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      parseMutation.mutate({ csvContent: text });
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFileUpload(file);
    } else {
      toast.error("Please upload a CSV file");
    }
  };

  const useSample = () => {
    setCsvText(SAMPLE_CSV);
    parseMutation.mutate({ csvContent: SAMPLE_CSV });
  };

  const downloadResults = () => {
    if (!results.length) return;
    const headers = ["row_number", "status", "generated_content", "error"];
    const rows = results.map(r => [
      r.rowNumber,
      r.success ? "success" : "error",
      r.success ? `"${(r.content || "").replace(/"/g, '""')}"` : "",
      r.success ? "" : r.error,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk_content_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded results CSV");
  };

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  return (
    <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Table className="h-6 w-6 text-primary" />
            Bulk Content Import
          </h1>
          <p className="text-muted-foreground mt-1">Upload a CSV of products or ideas and auto-generate all content in one batch</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {[
            { id: "upload", label: "1. Upload CSV" },
            { id: "configure", label: "2. Configure" },
            { id: "results", label: "3. Results" },
          ].map((step, i) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : results.length > 0 && step.id === "results"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : parsed && step.id === "configure"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step.label}
              </div>
              {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {activeStep === "upload" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  {parseMutation.isPending ? (
                    <div className="space-y-3">
                      <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto" />
                      <p className="text-sm font-medium">Parsing CSV...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                      <div>
                        <p className="font-medium">Drop your CSV file here</p>
                        <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Supports .csv files up to 100 rows</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <Button variant="outline" onClick={useSample} className="w-full gap-2" disabled={parseMutation.isPending}>
              <FileText className="h-4 w-4" />
              Use Sample CSV (4 products)
            </Button>

            {/* CSV Format Guide */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  CSV Format Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">Include any columns — the AI will use all available data. Recommended columns:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["product_name", "description", "target_audience", "price", "key_benefit", "brand_name", "tone", "platform"].map(col => (
                    <div key={col} className="flex items-center gap-1.5 text-xs">
                      <Badge variant="outline" className="text-xs font-mono">{col}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Configure */}
        {activeStep === "configure" && parsed && (
          <div className="space-y-4">
            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    CSV Parsed — {parsed.rows.length} rows, {parsed.headers.length} columns
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveStep("upload")} className="h-7 text-xs">
                    Change File
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        {parsed.headers.map(h => (
                          <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          {parsed.headers.map(h => (
                            <td key={h} className="py-1.5 px-2 truncate max-w-[120px]">{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">+{parsed.rows.length - 3} more rows</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Generation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Content Type</label>
                    <Select value={contentType} onValueChange={setContentType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Additional Instructions (optional)</label>
                  <input
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    placeholder="e.g. Always mention free shipping, use emojis, include price..."
                    value={additionalInstructions}
                    onChange={e => setAdditionalInstructions(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm text-muted-foreground">
                    Will generate <strong>{parsed.rows.length}</strong> pieces of {contentType.replace(/_/g, " ")} content for {platform}
                  </div>
                  <Button
                    onClick={() => generateMutation.mutate({
                      rows: parsed.rows,
                      contentType,
                      platform,
                      tone,
                      additionalInstructions: additionalInstructions || undefined,
                    })}
                    disabled={generateMutation.isPending}
                    className="gap-2"
                  >
                    {generateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {generateMutation.isPending ? `Generating ${parsed.rows.length} items...` : "Generate All Content"}
                  </Button>
                </div>

                {generateMutation.isPending && (
                  <div className="space-y-1.5">
                    <Progress value={undefined} className="h-1.5 animate-pulse" />
                    <p className="text-xs text-muted-foreground text-center">Processing {parsed.rows.length} rows with AI...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Results */}
        {activeStep === "results" && results.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
                  <p className="text-xs text-muted-foreground">Generated</p>
                </CardContent>
              </Card>
              <Card className={failCount > 0 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : ""}>
                <CardContent className="pt-4 text-center">
                  <p className={`text-2xl font-bold ${failCount > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>{failCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold text-primary">{Math.round(successCount / results.length * 100)}%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={downloadResults} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
              <Button variant="outline" onClick={() => { setActiveStep("upload"); setResults([]); setParsed(null); }} className="gap-2">
                <Upload className="h-4 w-4" />
                Import Another
              </Button>
            </div>

            {/* Results List */}
            <div className="space-y-3">
              {results.map((result, i) => (
                <Card key={i} className={result.success ? "" : "border-red-200 dark:border-red-800"}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {result.success
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <AlertCircle className="h-4 w-4 text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Row {result.rowNumber}</span>
                          {result.success && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs gap-1 -mr-1"
                              onClick={() => { navigator.clipboard.writeText(result.content || ""); toast.success("Copied!"); }}
                            >
                              <Copy className="h-3 w-3" /> Copy
                            </Button>
                          )}
                        </div>
                        {result.success ? (
                          <p className="text-sm leading-relaxed">{result.content}</p>
                        ) : (
                          <p className="text-xs text-red-500">{result.error}</p>
                        )}
                        {result.savedContentId && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Saved to Content Library (ID: {result.savedContentId})
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

export default function BulkImport() {
  return (
    <UpgradePrompt
      requiredPlan="business"
      featureName="Bulk CSV Import"
      description="Upload a spreadsheet of products and auto-generate ad copy, images, and schedules for all rows at once. Upgrade to Business to unlock."
      fullPage
    >
      <BulkImportInner />
    </UpgradePrompt>
  );
}
