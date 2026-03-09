/**
 * Programmatic Ads (DSP) — Spec v4.
 * Ad wallet balance, fund CTA, campaigns list. One-stop programmatic buying.
 */
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, PlusCircle, Target, TrendingUp, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function ProgrammaticAds() {
  const { data: status, isLoading } = trpc.dsp.status.useQuery();
  const fundCheckout = trpc.dsp.fundCheckout.useMutation();
  const [amount, setAmount] = useState(50); // USD default
  const [funding, setFunding] = useState(false);

  const handleFund = async () => {
    const cents = Math.round(amount * 100);
    if (cents < 100) return;
    setFunding(true);
    try {
      const { url } = await fundCheckout.mutateAsync({ amountCents: cents });
      if (url) window.location.href = url;
    } finally {
      setFunding(false);
    }
  };

  const balanceDollars = status ? (status.balanceCents / 100).toFixed(2) : "0.00";
  const spentDollars = status ? (status.totalSpentCents / 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Programmatic Ads</h1>
        <p className="text-muted-foreground mt-1">
          One-stop programmatic ad buying. Fund your ad wallet, launch campaigns, and track performance — all in one place.
        </p>
      </div>

      {/* Success message after fund redirect */}
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("fund") === "success" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          <TrendingUp className="h-4 w-4" />
          Ad wallet funded successfully. Balance updated shortly.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-bold">${balanceDollars}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available for programmatic campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-bold">${spentDollars}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Lifetime campaign spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <span className="text-2xl font-bold">{status?.campaigns?.length ?? 0}</span>
            )}
            <p className="text-xs text-muted-foreground mt-1">DSP campaigns</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fund Ad Wallet</CardTitle>
          <CardDescription>
            Add funds to your ad wallet to run programmatic campaigns. Minimum $1. Funds are used to buy inventory via our DSP partner; platform markup applies per your plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (USD)</label>
            <input
              type="number"
              min={1}
              max={10000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            />
          </div>
          <Button onClick={handleFund} disabled={funding}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {funding ? "Redirecting…" : "Add funds"}
          </Button>
          {status && !status.enabled && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Programmatic campaign execution (DSP) can be enabled by support. You can still fund your ad wallet and use it when campaigns are enabled.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Your programmatic ad campaigns. Create and manage from here.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : !status?.campaigns?.length ? (
            <p className="text-sm text-muted-foreground">No campaigns yet. Fund your wallet and create your first campaign.</p>
          ) : (
            <ul className="space-y-2">
              {status.campaigns.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.impressions ?? 0} impr. · {c.clicks ?? 0} clicks · ${((c.spentCents ?? 0) / 100).toFixed(2)} spent
                      {c.aiQualityScore != null ? ` · AI score: ${c.aiQualityScore}` : ""}
                    </p>
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status ?? "draft"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
