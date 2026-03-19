import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export type ReportType = "dashboard" | "analytics" | "ad_performance" | "campaign";

interface ReportExportProps {
  reportType: ReportType;
  defaultTitle?: string;
  trigger?: React.ReactNode;
}

export function ReportExport({ reportType, defaultTitle, trigger }: ReportExportProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? `${reportType.replace("_", " ")} Report`);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = trpc.reports.generate.useMutation({
    onSuccess: d => { setShareUrl(d.shareUrl); },
    onError: e => toast.error(e.message),
  });

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setShareUrl(null); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <FileText className="h-3.5 w-3.5" /> Export report
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-white text-sm">Share report</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Report title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q1 Performance"
              className="w-full h-9 px-3 rounded-lg text-sm input-dark" />
          </div>
          {!shareUrl ? (
            <button onClick={() => generate.mutate({ reportType, title: title.trim() || undefined })}
              disabled={generate.isPending}
              className="w-full h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: "rgba(124,58,237,0.7)" }}>
              {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate shareable link
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500">Anyone with this link can view the report (expires in 30 days).</p>
              <div className="flex gap-2">
                <input readOnly value={shareUrl} className="flex-1 h-9 px-3 rounded-lg text-xs font-mono input-dark" />
                <button onClick={handleCopy}
                  className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: copied ? "#10b981" : "#71717a" }}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
