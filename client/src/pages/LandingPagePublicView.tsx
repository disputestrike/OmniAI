import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle } from "lucide-react";

type ComponentBlock = { type: string; props?: Record<string, unknown>; order?: number };

export default function LandingPagePublicView() {
  const [, params] = useRoute("/lp/:slug");
  const slug = params?.slug ?? "";
  const [page, setPage] = useState<{ id: number; title: string; components: ComponentBlock[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError("Missing slug");
      return;
    }
    fetch(`/api/landing/page/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Page not found" : "Failed to load");
        return r.json();
      })
      .then((data) => {
        setPage({ id: data.id, title: data.title, components: Array.isArray(data.components) ? data.components : [] });
        setError(null);
      })
      .catch((e) => {
        setError(e.message || "Page not found");
        setPage(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (!slug) return <div className="min-h-screen flex items-center justify-center p-6"><p className="text-muted-foreground">Invalid page URL.</p></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (error || !page) return <div className="min-h-screen flex items-center justify-center p-6"><p className="text-muted-foreground">{error || "Page not found"}.</p></div>;

  const components = [...page.components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleFormSubmit = (e: React.FormEvent, formComp: ComponentBlock) => {
    e.preventDefault();
    setFormError(null);
    const fields = (formComp.props?.fields as { name: string; type?: string; label: string; required?: boolean }[]) ?? [];
    const data: Record<string, string> = { ...formValues };
    fetch("/api/landing/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ landingPageId: page.id, data }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body.redirectUrl) {
          window.location.href = body.redirectUrl;
          return;
        }
        setFormSubmitted(true);
        setFormSuccessMessage((formComp.props?.successMessage as string) || "Thank you. We'll be in touch.");
      })
      .catch(() => setFormError("Submission failed. Please try again."));
  };

  return (
    <div className="min-h-screen bg-background">
      {components.map((comp, idx) => {
        const p = comp.props ?? {};
        if (comp.type === "hero") {
          return (
            <section key={idx} className="py-16 px-4 text-center border-b" style={{ background: (p.backgroundImage as string) ? `url(${p.backgroundImage}) center/cover` : undefined }}>
              <h1 className="text-4xl font-bold tracking-tight">{String(p.headline ?? "Welcome")}</h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{String(p.subheadline ?? "")}</p>
              {(p.ctaText as string) && (
                <a href={(p.ctaLink as string) || "#"} className="inline-block mt-6">
                  <Button>{(p.ctaText as string)}</Button>
                </a>
              )}
            </section>
          );
        }
        if (comp.type === "features") {
          const features = (p.features as { icon?: string; title: string; description: string }[]) ?? [];
          return (
            <section key={idx} className="py-12 px-4 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-8">{String(p.title ?? "Why Choose Us")}</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                {features.map((f, i) => (
                  <div key={i} className="text-center">
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (comp.type === "form") {
          const fields = (p.fields as { name: string; type?: string; label: string; required?: boolean }[]) ?? [];
          if (formSubmitted) {
            return (
              <section key={idx} className="py-12 px-4 max-w-md mx-auto text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <p className="mt-4 text-lg">{formSuccessMessage}</p>
              </section>
            );
          }
          return (
            <section key={idx} className="py-12 px-4 max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">{String(p.title ?? "Get In Touch")}</h2>
              <form onSubmit={(e) => handleFormSubmit(e, comp)} className="space-y-4">
                {fields.map((f, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium mb-1">{f.label}{f.required ? " *" : ""}</label>
                    <Input
                      type={(f.type as string) === "email" ? "email" : (f.type as string) === "tel" ? "tel" : "text"}
                      required={f.required}
                      value={formValues[f.name] ?? ""}
                      onChange={(e) => setFormValues((v) => ({ ...v, [f.name]: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                ))}
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button type="submit" className="w-full">{(p.submitText as string) || "Submit"}</Button>
              </form>
            </section>
          );
        }
        if (comp.type === "footer") {
          return (
            <footer key={idx} className="py-8 px-4 border-t text-center text-sm text-muted-foreground">
              {String(p.text ?? "© All rights reserved.")}
            </footer>
          );
        }
        if (comp.type === "cta") {
          return (
            <section key={idx} className="py-12 px-4 text-center border-t">
              <h2 className="text-2xl font-semibold">{String(p.headline ?? "")}</h2>
              <a href={(p.ctaLink as string) || "#"} className="inline-block mt-4">
                <Button>{(p.ctaText as string) || "Get Started"}</Button>
              </a>
            </section>
          );
        }
        if (comp.type === "testimonials") {
          const items = (p.items as { quote: string; author: string }[]) ?? [];
          return (
            <section key={idx} className="py-12 px-4 max-w-4xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-8">{String(p.title ?? "Testimonials")}</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {items.map((t, i) => (
                  <blockquote key={i} className="border-l-4 pl-4 italic text-muted-foreground">
                    "{t.quote}" — {t.author}
                  </blockquote>
                ))}
              </div>
            </section>
          );
        }
        return null;
      })}
    </div>
  );
}
