import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Languages, Copy, ArrowRight } from "lucide-react";

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

const TOP_5_LANGS = ["Spanish", "French", "Arabic", "Portuguese", "Chinese (Simplified)"];

type BulkResult = { language: string; translated: string };

export default function Translate() {
  const [sourceText, setSourceText] = useState("");
  const [sourceLang, setSourceLang] = useState<string>("en");
  const [targetLang, setTargetLang] = useState<string>("es");
  const [singleResult, setSingleResult] = useState<string | null>(null);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
  const [adaptForMarketing, setAdaptForMarketing] = useState(true);

  const translateMut = trpc.multiLanguage.translate.useMutation({
    onSuccess: (data: any) => {
      setSingleResult(data.translated);
      setBulkResults(null);
      toast.success("Translation complete");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkTranslateMut = trpc.multiLanguage.translateBulk.useMutation({
    onSuccess: (data: any) => {
      setBulkResults(data.results);
      setSingleResult(null);
      toast.success(`Translated to ${TOP_5_LANGS.length} languages`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isLoading = translateMut.isPending || bulkTranslateMut.isPending;
  const sourceLangName = LANGUAGES.find(l => l.code === sourceLang)?.name;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Multi-Language Translation</h1>
        <p className="text-zinc-500">Translate and adapt marketing content for global audiences</p>
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
            <Textarea
              value={sourceText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSourceText(e.target.value)}
              placeholder="Enter your marketing content to translate..."
              rows={8}
            />
            <p className="text-xs text-zinc-500 mt-2">{sourceText.length} characters</p>

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
              <Button
                onClick={() => translateMut.mutate({ text: sourceText, targetLanguage: LANGUAGES.find(l => l.code === targetLang)?.name || targetLang, sourceLanguage: sourceLangName })}
                disabled={!sourceText || isLoading}
              >
                {translateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4 mr-1" /> Translate</>}
              </Button>
            </div>

            <div className="mt-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => bulkTranslateMut.mutate({ text: sourceText, sourceLanguage: sourceLangName })}
                disabled={!sourceText || isLoading}
              >
                {bulkTranslateMut.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Translating to 5 languages...</>
                  : <><Languages className="w-4 h-4 mr-2" /> Translate to Top 5 Languages</>}
              </Button>
              <p className="text-xs text-zinc-500 mt-1 text-center">{TOP_5_LANGS.join(" · ")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Result panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {bulkResults ? "Top 5 Language Translations" : "Translation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-zinc-500 text-sm">
                  {bulkTranslateMut.isPending ? "Translating to 5 languages in parallel..." : "Translating and adapting content..."}
                </p>
              </div>
            ) : bulkResults ? (
              <Tabs defaultValue={bulkResults[0]?.language}>
                <TabsList className="w-full flex-wrap h-auto gap-1 mb-4">
                  {bulkResults.map(r => (
                    <TabsTrigger key={r.language} value={r.language} className="text-xs">
                      {r.language}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {bulkResults.map(r => (
                  <TabsContent key={r.language} value={r.language}>
                    <div className="relative">
                      <div className="whitespace-pre-wrap text-sm bg-zinc-900/50 p-4 rounded-lg min-h-[200px] pr-10">
                        {r.translated}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => { navigator.clipboard.writeText(r.translated); toast.success(`${r.language} translation copied`); }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : singleResult ? (
              <div className="relative">
                <div className="whitespace-pre-wrap text-sm bg-zinc-900/50 p-4 rounded-lg min-h-[200px] pr-10">
                  {singleResult}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={() => { navigator.clipboard.writeText(singleResult); toast.success("Copied"); }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-12">
                <Languages className="w-10 h-10 text-zinc-500 mb-3" />
                <p className="text-zinc-500 text-sm">Translated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
