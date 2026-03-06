import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ContentStudio from "./pages/ContentStudio";
import Creatives from "./pages/Creatives";
import VideoAds from "./pages/VideoAds";
import Campaigns from "./pages/Campaigns";
import AbTesting from "./pages/AbTesting";
import Scheduler from "./pages/Scheduler";
import Leads from "./pages/Leads";
import Analytics from "./pages/Analytics";
import AiAgents from "./pages/AiAgents";
import Collaboration from "./pages/Collaboration";
import ExportImport from "./pages/ExportImport";
import Pricing from "./pages/Pricing";
import Intelligence from "./pages/Intelligence";
import Deals from "./pages/Deals";
import AdPlatforms from "./pages/AdPlatforms";
import SeoAudits from "./pages/SeoAudits";
import Predictive from "./pages/Predictive";
import Approvals from "./pages/Approvals";
import Team from "./pages/Team";
import PlatformIntel from "./pages/PlatformIntel";
import Momentum from "./pages/Momentum";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/content" component={ContentStudio} />
        <Route path="/creatives" component={Creatives} />
        <Route path="/video-ads" component={VideoAds} />
        <Route path="/campaigns" component={Campaigns} />
        <Route path="/ab-testing" component={AbTesting} />
        <Route path="/scheduler" component={Scheduler} />
        <Route path="/leads" component={Leads} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/ai-agents" component={AiAgents} />
        <Route path="/collaboration" component={Collaboration} />
        <Route path="/export-import" component={ExportImport} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/intelligence" component={Intelligence} />
        <Route path="/deals" component={Deals} />
        <Route path="/ad-platforms" component={AdPlatforms} />
        <Route path="/seo-audits" component={SeoAudits} />
        <Route path="/predictive" component={Predictive} />
        <Route path="/approvals" component={Approvals} />
        <Route path="/team" component={Team} />
        <Route path="/platform-intel" component={PlatformIntel} />
        <Route path="/momentum" component={Momentum} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public landing page */}
      <Route path="/" component={Landing} />
      {/* All dashboard routes */}
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/products" component={DashboardRouter} />
      <Route path="/content" component={DashboardRouter} />
      <Route path="/creatives" component={DashboardRouter} />
      <Route path="/video-ads" component={DashboardRouter} />
      <Route path="/campaigns" component={DashboardRouter} />
      <Route path="/ab-testing" component={DashboardRouter} />
      <Route path="/scheduler" component={DashboardRouter} />
      <Route path="/leads" component={DashboardRouter} />
      <Route path="/analytics" component={DashboardRouter} />
      <Route path="/ai-agents" component={DashboardRouter} />
      <Route path="/collaboration" component={DashboardRouter} />
      <Route path="/export-import" component={DashboardRouter} />
      <Route path="/pricing" component={DashboardRouter} />
      <Route path="/intelligence" component={DashboardRouter} />
      <Route path="/deals" component={DashboardRouter} />
      <Route path="/ad-platforms" component={DashboardRouter} />
      <Route path="/seo-audits" component={DashboardRouter} />
      <Route path="/predictive" component={DashboardRouter} />
      <Route path="/approvals" component={DashboardRouter} />
      <Route path="/team" component={DashboardRouter} />
      <Route path="/platform-intel" component={DashboardRouter} />
      <Route path="/momentum" component={DashboardRouter} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
