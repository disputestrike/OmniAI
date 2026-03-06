import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
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

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={Home} />
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
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
