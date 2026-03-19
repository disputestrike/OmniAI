import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Star, Mic, Upload, Sparkles } from "lucide-react";

export default function BrandVoice() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sampleText, setSampleText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<number | null>(null);

  const { data: voices, isLoading, refetch } = trpc.brandVoice.list.useQuery();
  const createMutation = trpc.brandVoice.create.useMutation({
    onSuccess: () => {
      toast.success("Brand voice created — AI is analyzing your voice...");
      setShowCreate(false);
      setName(""); setDescription(""); setSampleText("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.brandVoice.delete.useMutation({
    onSuccess: () => { toast.success("Brand voice deleted"); refetch(); },
  });
  const updateMutation = trpc.brandVoice.update.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
  });

  const selectedData = voices?.find(v => v.id === selectedVoice);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brand Voice</h1>
          <p className="text-zinc-500">Train AI to write in your brand's unique voice and tone</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Create Voice Profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Brand Voice Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Brand Name *</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="text-sm font-medium">Brand Description</label>
                <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. B2B SaaS for marketing teams" />
              </div>
              <div>
                <label className="text-sm font-medium">Sample Text (paste existing content)</label>
                <Textarea value={sampleText} onChange={e => setSampleText(e.target.value)} placeholder="Paste a blog post, email, or ad copy that represents your brand voice..." rows={6} />
                <p className="text-xs text-zinc-500 mt-1">The more text you provide, the better the AI can learn your voice</p>
              </div>
              <Button onClick={() => createMutation.mutate({ name, description, sampleText })} disabled={!name || createMutation.isPending} className="w-full">
                {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4 mr-2" /> Create & Analyze Voice</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>
      ) : !voices?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mic className="w-12 h-12 text-zinc-500 mb-4" />
            <h3 className="text-lg font-semibold">No Brand Voices Yet</h3>
            <p className="text-zinc-500 text-center max-w-md mt-2">Create your first brand voice profile to ensure all AI-generated content matches your brand's unique tone and style.</p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" /> Create Your First Voice</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Your Voices</h3>
            {voices.map(voice => (
              <Card key={voice.id} className={`cursor-pointer transition-all hover:shadow-md ${selectedVoice === voice.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedVoice(voice.id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{voice.name}</span>
                        {voice.isDefault && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">{voice.description || "No description"}</p>
                    </div>
                    <Badge variant={voice.status === "ready" ? "default" : voice.status === "processing" ? "secondary" : "destructive"}>
                      {voice.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedData.name}</CardTitle>
                      <CardDescription>{selectedData.description || "Brand voice profile"}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!selectedData.isDefault && (
                        <Button variant="outline" size="sm" onClick={() => updateMutation.mutate({ id: selectedData.id, isDefault: true })}>
                          <Star className="w-4 h-4 mr-1" /> Set Default
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => { deleteMutation.mutate({ id: selectedData.id }); setSelectedVoice(null); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedData.status === "processing" ? (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                      <p className="text-zinc-500">AI is analyzing your brand voice...</p>
                      <p className="text-xs text-zinc-500 mt-1">This usually takes 10-30 seconds</p>
                    </div>
                  ) : selectedData.voiceProfile ? (
                    <div className="space-y-6 animate-fade-up">
                      {(() => {
                        const vp = selectedData.voiceProfile as any;
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-zinc-900/40">
                                <p className="text-xs font-medium text-zinc-500 uppercase">Tone</p>
                                <p className="font-medium mt-1">{vp.tone}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-zinc-900/40">
                                <p className="text-xs font-medium text-zinc-500 uppercase">Style</p>
                                <p className="font-medium mt-1">{vp.style}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-zinc-900/40">
                                <p className="text-xs font-medium text-zinc-500 uppercase">Formality</p>
                                <p className="font-medium mt-1 capitalize">{vp.formality}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-zinc-900/40">
                                <p className="text-xs font-medium text-zinc-500 uppercase">Personality</p>
                                <p className="font-medium mt-1">{vp.personality}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-2">Characteristic Vocabulary</p>
                              <div className="flex flex-wrap gap-2">
                                {(vp.vocabulary || []).map((w: string, i: number) => <Badge key={i} variant="secondary">{w}</Badge>)}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-2">Words to Avoid</p>
                              <div className="flex flex-wrap gap-2">
                                {(vp.avoidWords || []).map((w: string, i: number) => <Badge key={i} variant="destructive">{w}</Badge>)}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-2">Sample Phrases in This Voice</p>
                              <div className="space-y-2">
                                {(vp.samplePhrases || []).map((p: string, i: number) => (
                                  <div key={i} className="p-2 rounded bg-zinc-900/50 text-sm italic">"{p}"</div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-zinc-500 text-center py-8">Voice profile not available. Try recreating this voice.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Mic className="w-8 h-8 text-zinc-500 mb-3" />
                  <p className="text-zinc-500">Select a voice profile to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
