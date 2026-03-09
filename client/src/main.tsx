import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginPageUrl } from "./const";
import { dispatchLimitExceeded, dispatchFeatureLock } from "./components/LimitExceededModal";
import { initGA4 } from "./lib/analytics";
import { initCrisp } from "./lib/crisp";
import "./index.css";

if (typeof window !== "undefined") {
  initGA4();
  initCrisp();
}
if (typeof window !== "undefined") {
  const dsn = (import.meta as unknown as { env: { VITE_SENTRY_DSN?: string } }).env?.VITE_SENTRY_DSN;
  if (dsn) {
    import("@sentry/react").then((Sentry) => {
      Sentry.init({
        dsn,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.1,
      });
    }).catch(() => {});
  }
}

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginPageUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") {
      const msg = String(error.message ?? "");
      const cause = error.data?.cause as { reason?: string; upgrade_to?: string; upgradeTo?: string; canTopup?: boolean; creditsNeeded?: number; feature?: string } | undefined;
      if (cause?.reason === "limit_exceeded" || msg.includes("limit") || msg.includes("Monthly limit")) {
        dispatchLimitExceeded({ upgradeTo: cause?.upgrade_to ?? cause?.upgradeTo, canTopup: cause?.canTopup, creditsNeeded: cause?.creditsNeeded });
      } else if (cause?.reason === "feature_not_on_plan" || msg.includes("Programmatic Ads") || msg.includes("available on")) {
        dispatchFeatureLock({ upgradeTo: cause?.upgrade_to ?? cause?.upgradeTo, feature: cause?.feature });
      }
    }
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
