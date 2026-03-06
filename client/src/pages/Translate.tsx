import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Languages, Copy, ArrowRight, Sparkles } from "lucide-react";

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" },
  { code: "de", name: "German" }, { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" }, { code: "ru", name: "Russian" }, { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese (Simplified)" }, { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" }, { code: "tr", name: "Turkish" }, { code: "pl", name: "Polish" },
  { code: "sv", name: "Swedish" }, { code: "da", name: "Danish" }, { code: "fi", name: "Finnish" },
  { code: "no", name: "Norwegian" }, { code: "th", name: "Thai" }, { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" }, { code: "ms", name: "Malay" }, { code: "he", name: "Hebrew" },
];

export default function Translate() {
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("es");
  const [result, setResult] = useState<string | null>(null);
  const [adaptForMarketing, setAdaptForMarketing] = useState(true);

  const translateMut = trpc.multiLanguage.translate.useMutation({
    onSuccess: (data: any) => { setResult(data.translated); toast.success("Translation complete"); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkTranslateMut = trpc.multiLanguage.translate.useMutation({
    onSuccess: (data: any) => {
      setResult(data.translated || '');
      toast.success('Translation complete');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Multi-Language Translation</h1>
        <p className="text-muted-foreground">Translate and adapt marketing content for global audiences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Source Content</CardTitle>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea value={sourceText} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)} placeholder="Enter your marketing content to translate..." rows={8} />
            <p className="text-xs text-muted-foreground mt-2">{sourceText.length} characters</p>

            <div className="flex items-center gap-3 mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={adaptForMarketing} onChange={(e) => setAdaptForMarketing(e.target.checked)} className="rounded" />
                Adapt for local marketing (not just literal translation)
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <div className="flex-1">
                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(l => l.code !== sourceLang).map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => translateMut.mutate({ text: sourceText, targetLanguage: LANGUAGES.find(l => l.code === targetLang)?.name || targetLang, sourceLanguage: LANGUAGES.find(l => l.code === sourceLang)?.name })} disabled={!sourceText || translateMut.isPending}>
                {translateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-1" /> Translate</>}
              </Button>
            </div>

            <div className="mt-3">
              <Button variant="outline" className="w-full" onClick={() => {
                // Translate to first non-source language from top 5
                const topLangs = LANGUAGES.filter(l => l.code !== sourceLang).slice(0, 1);
                bulkTranslateMut.mutate({ text: sourceText, targetLanguage: topLangs[0]?.name || 'Spanish', sourceLanguage: LANGUAGES.find(l => l.code === sourceLang)?.name });
              }} disabled={!sourceText || bulkTranslateMut.isPending}>
                {bulkTranslateMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Translating...</> : <><Languages className="w-4 h-4 mr-2" /> Translate to Top 5 Languages</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Translation</CardTitle>
              {result && (
                <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success("Copied"); }}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {(translateMut.isPending || bulkTranslateMut.isPending) ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground text-sm">Translating and adapting content...</p>
              </div>
            ) : result ? (
              <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-lg min-h-[200px]">{result}</div>
            ) : (
              <div className="flex flex-col items-center py-12">
                <Languages className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">Translated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
