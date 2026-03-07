import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [copied, setCopied] = useState(false);

  const generate = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      setShareUrl(data.shareUrl);
      setShareToken(data.shareToken);
    },
    onError: (e) => toast.error(e.message),
  });

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const handleGenerate = () => {
    generate.mutate({ reportType, title: title.trim() || undefined });
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) { setShareUrl(null); setShareToken(null); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="rounded-lg">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Export / Share report
          </Button>
        )}
      </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Share report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Report title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q1 Performance" /></div>
            {!shareUrl ? (
              <Button className="w-full rounded-xl" disabled={generate.isPending} onClick={handleGenerate}>
                {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Generate shareable link
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Anyone with this link can view the report (expires in 30 days).</p>
                <div className="flex gap-2">
                  <Input readOnly value={shareUrl} className="font-mono text-sm flex-1" />
                  <Button size="icon" variant="outline" onClick={handleCopy}>{copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
    </Dialog>
  );
}
