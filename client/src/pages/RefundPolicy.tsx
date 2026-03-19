import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function RefundPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Refund Policy</CardTitle>
            <p className="text-sm text-zinc-500">Last updated: March 2025</p>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6 text-zinc-500">
            <p>
              OTOBI AI offers a <strong className="text-foreground">7-day money-back guarantee</strong> on all paid subscriptions.
              If you are not satisfied within the first 7 days of your paid subscription (after your free trial ends), contact us at{" "}
              <a href="mailto:support@otobi.ai" className="text-primary font-medium hover:underline">support@otobi.ai</a> for a full refund.
            </p>
            <p>
              After 7 days, subscriptions are non-refundable but you may cancel at any time and retain access until the end of your current billing period.
            </p>
            <p>
              Credit pack purchases are non-refundable once credits have been used. Unused credits in a cancelled account are non-refundable.
            </p>
            <p className="pt-4 border-t">
              <a href="/contact" className="text-primary font-medium hover:underline">Contact support</a> for any refund requests or questions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
