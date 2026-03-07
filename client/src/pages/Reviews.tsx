import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, MessageSquare, Plus, Loader2, ThumbsUp, ExternalLink } from "lucide-react";

const sourceTypes = [
  { value: "google", label: "Google" },
  { value: "facebook", label: "Facebook" },
  { value: "yelp", label: "Yelp" },
  { value: "manual", label: "Manual entry" },
] as const;

export default function Reviews() {
  const [showAddSource, setShowAddSource] = useState(false);
  const [sourceType, setSourceType] = useState<"google" | "facebook" | "yelp" | "manual">("manual");
  const [sourceName, setSourceName] = useState("");
  const [showAddReview, setShowAddReview] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const utils = trpc.useUtils();
  const { data: sources } = trpc.reviews.listSources.useQuery();
  const { data: reviews } = trpc.reviews.listReviews.useQuery(selectedSourceId != null ? { sourceId: selectedSourceId } : undefined);
  const addSourceMut = trpc.reviews.addSource.useMutation({
    onSuccess: () => { toast.success("Source added"); setShowAddSource(false); setSourceName(""); utils.reviews.listSources.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const addReviewMut = trpc.reviews.addReview.useMutation({
    onSuccess: () => {
      toast.success("Review added");
      setShowAddReview(false);
      setAuthorName("");
      setRating(5);
      setReviewText("");
      setSelectedSourceId(null);
      utils.reviews.listReviews.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const replyMut = trpc.reviews.replyToReview.useMutation({
    onSuccess: () => { toast.success("Reply saved"); setReplyingToId(null); setReplyText(""); utils.reviews.listReviews.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews & Reputation</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and respond to reviews from Google, Facebook, Yelp, or add them manually.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
            <DialogTrigger asChild><Button variant="outline" className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Add source</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add review source</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Type</Label>
                  <Select value={sourceType} onValueChange={(v: "google" | "facebook" | "yelp" | "manual") => setSourceType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{sourceTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Name (optional)</Label><Input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="e.g. Main location" /></div>
                <Button className="w-full" disabled={addSourceMut.isPending} onClick={() => addSourceMut.mutate({ sourceType, name: sourceName.trim() || undefined })}>
                  {addSourceMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showAddReview} onOpenChange={setShowAddReview}>
            <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" />Add review</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add review manually</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Source</Label>
                  <Select value={selectedSourceId?.toString() ?? ""} onValueChange={v => setSelectedSourceId(v ? parseInt(v, 10) : null)}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>{(sources ?? []).map((s: { id: number; name: string | null; sourceType: string }) => <SelectItem key={s.id} value={s.id.toString()}>{s.name || s.sourceType}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Author</Label><Input value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Reviewer name" /></div>
                <div><Label>Rating (1-5)</Label><Select value={rating.toString()} onValueChange={v => setRating(parseInt(v, 10))}><SelectTrigger className="w-24"><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n} ★</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Review text</Label><Textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Review content" rows={3} /></div>
                <Button className="w-full" disabled={!selectedSourceId || addReviewMut.isPending} onClick={() => selectedSourceId && addReviewMut.mutate({ sourceId: selectedSourceId, authorName: authorName.trim() || undefined, rating, text: reviewText.trim() || undefined, reviewedAt: new Date().toISOString() })}>
                  {addReviewMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Sources</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!sources?.length ? <p className="text-sm text-muted-foreground">No sources yet. Add Google, Facebook, Yelp, or manual.</p> : sources.map((s: { id: number; name: string | null; sourceType: string; status: string }) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => setSelectedSourceId(s.id)}>
                <span className="font-medium text-sm">{s.name || s.sourceType}</span>
                <Badge variant="secondary" className="text-xs">{s.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-4">
          {selectedSourceId != null && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-base">Reviews</CardTitle></CardHeader>
              <CardContent>
                {!reviews?.length ? <p className="text-sm text-muted-foreground">No reviews for this source. Add one manually or connect the platform API.</p> : (
                  <div className="space-y-4">
                    {(reviews as { id: number; authorName: string | null; rating: number; text: string | null; reply: string | null; reviewedAt: string }[]).map(r => (
                      <div key={r.id} className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{r.authorName || "Anonymous"}</span>
                          <div className="flex text-amber-500">{[1,2,3,4,5].map(i => <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-current" : ""}`} />)}</div>
                        </div>
                        {r.text && <p className="text-sm text-muted-foreground mb-2">{r.text}</p>}
                        {r.reply && <div className="pl-3 border-l-2 border-primary/30"><p className="text-sm text-muted-foreground">Reply: {r.reply}</p></div>}
                        {replyingToId === r.id ? (
                          <div className="mt-2"><Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Your reply" rows={2} className="mb-2" /><Button size="sm" onClick={() => replyMut.mutate({ id: r.id, reply: replyText })}>Save reply</Button></div>
                        ) : (
                          <Button size="sm" variant="ghost" className="mt-1" onClick={() => { setReplyingToId(r.id); setReplyText(r.reply || ""); }}><MessageSquare className="h-3.5 w-3.5 mr-1" />Reply</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
