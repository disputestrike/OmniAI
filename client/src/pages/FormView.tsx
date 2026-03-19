import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";

export default function FormView() {
  const [, params] = useRoute("/form/:slug");
  const slug = params?.slug ?? "";
  const { data: form, isLoading, error } = trpc.forms.getPublicBySlug.useQuery({ slug }, { enabled: !!slug });
  const submitMut = trpc.forms.submit.useMutation({
    onSuccess: (result) => {
      setSubmitted(true);
      if (result.redirectUrl) window.location.href = result.redirectUrl;
    },
    onError: (e) => setSubmitError(e.message),
  });

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!slug) return <div className="min-h-screen flex items-center justify-center p-4"><p className="text-zinc-500">Missing form slug.</p></div>;
  if (isLoading) return <div className="min-h-screen flex items-center justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>;
  if (error || !form) return <div className="min-h-screen flex items-center justify-center p-4"><p className="text-zinc-500">Form not found or inactive.</p></div>;

  const fields = (form.fields ?? []) as { id: number; fieldType: string; label: string; placeholder?: string; required?: boolean; options?: string[] }[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const data: Record<string, string> = {};
    fields.forEach(f => {
      const v = values[f.id.toString()];
      if (f.required && v === undefined) return;
      data[f.label] = v ?? "";
    });
    submitMut.mutate({ formId: form.formId, data });
  };

  if (submitted && !form.redirectUrl)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900/50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <p className="text-lg font-medium">Thank you. Your response has been recorded.</p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-900/50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description ? <p className="text-sm text-zinc-500">{form.description}</p> : null}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.sort((a, b) => (a as any).orderIndex - (b as any).orderIndex).map(f => (
              <div key={f.id}>
                <Label>{f.label}{f.required ? " *" : ""}</Label>
                {f.fieldType === "textarea" ? (
                  <textarea className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={f.placeholder} required={f.required} rows={3} value={values[f.id.toString()] ?? ""} onChange={e => setValues(v => ({ ...v, [f.id.toString()]: e.target.value }))} />
                ) : f.fieldType === "select" ? (
                  <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required={f.required} value={values[f.id.toString()] ?? ""} onChange={e => setValues(v => ({ ...v, [f.id.toString()]: e.target.value }))}>
                    <option value="">Select...</option>
                    {(f.options ?? []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                ) : f.fieldType === "checkbox" ? (
                  <div className="mt-2"><input type="checkbox" checked={(values[f.id.toString()] ?? "") === "on"} onChange={e => setValues(v => ({ ...v, [f.id.toString()]: e.target.checked ? "on" : "" }))} /></div>
                ) : (
                  <Input className="mt-1" type={f.fieldType === "email" ? "email" : f.fieldType === "number" ? "number" : "text"} placeholder={f.placeholder} required={f.required} value={values[f.id.toString()] ?? ""} onChange={e => setValues(v => ({ ...v, [f.id.toString()]: e.target.value }))} />
                )}
              </div>
            ))}
            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={submitMut.isPending}>
              {submitMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}{form.submitButtonText ?? "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
