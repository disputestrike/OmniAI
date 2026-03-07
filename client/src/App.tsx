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
import AdminPanel from "./pages/AdminPanel";
import SocialPublish from "./pages/SocialPublish";
import VideoRender from "./pages/VideoRender";
import ImageEditor from "./pages/ImageEditor";
import CompetitorSpy from "./pages/CompetitorSpy";
import Webhooks from "./pages/Webhooks";
import Translate from "./pages/Translate";
import BrandVoice from "./pages/BrandVoice";
import EmailMarketing from "./pages/EmailMarketing";
import LandingPageBuilder from "./pages/LandingPageBuilder";
import Automations from "./pages/Automations";
import VideoStudio from "./pages/VideoStudio";
import CompetitorIntel from "./pages/CompetitorIntel";
import CustomerIntel from "./pages/CustomerIntel";
import AiAvatars from "./pages/AiAvatars";
import MemeGenerator from "./pages/MemeGenerator";
import ContentRepurposer from "./pages/ContentRepurposer";
import ContentIngest from "./pages/ContentIngest";
import ContentLibrary from "./pages/ContentLibrary";
import ContentTemplates from "./pages/ContentTemplates";
import ContentScorer from "./pages/ContentScorer";
import BulkImport from "./pages/BulkImport";
import BrandKit from "./pages/BrandKit";
import MusicStudio from "./pages/MusicStudio";
import VoiceoverStudio from "./pages/VoiceoverStudio";
import AdPerformanceAnalyzer from "./pages/AdPerformanceAnalyzer";
import OnePushPublisher from "./pages/OnePushPublisher";
import ContentCalendar from "./pages/ContentCalendar";
import PerformanceTracking from "./pages/PerformanceTracking";
import SocialPlanner from "./pages/SocialPlanner";
import CompetitorMonitor from "./pages/CompetitorMonitor";
import Projects from "./pages/Projects";
import CreatorProfile from "./pages/CreatorProfile";
import AboutUs from "./pages/AboutUs";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";

function DashboardRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/content" component={ContentStudio} />
        <Route path="/content-repurposer" component={ContentRepurposer} />
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
        <Route path="/admin" component={AdminPanel} />
        <Route path="/social-publish" component={SocialPublish} />
        <Route path="/video-render" component={VideoRender} />
        <Route path="/image-editor" component={ImageEditor} />
        <Route path="/competitor-spy" component={CompetitorSpy} />
        <Route path="/webhooks" component={Webhooks} />
        <Route path="/translate" component={Translate} />
        <Route path="/brand-voice" component={BrandVoice} />
        <Route path="/email-marketing" component={EmailMarketing} />
        <Route path="/landing-pages" component={LandingPageBuilder} />
        <Route path="/automations" component={Automations} />
        <Route path="/video-studio" component={VideoStudio} />
        <Route path="/competitor-intel" component={CompetitorIntel} />
        <Route path="/customer-intel" component={CustomerIntel} />
        <Route path="/ai-avatars" component={AiAvatars} />
        <Route path="/meme-generator" component={MemeGenerator} />
        <Route path="/content-ingest" component={ContentIngest} />
        <Route path="/content-library" component={ContentLibrary} />
        <Route path="/content-templates" component={ContentTemplates} />
        <Route path="/content-scorer" component={ContentScorer} />
        <Route path="/bulk-import" component={BulkImport} />
        <Route path="/brand-kit" component={BrandKit} />
        <Route path="/music-studio" component={MusicStudio} />
        <Route path="/voiceover-studio" component={VoiceoverStudio} />
        <Route path="/ad-performance" component={AdPerformanceAnalyzer} />
        <Route path="/one-push-publisher" component={OnePushPublisher} />
        <Route path="/content-calendar" component={ContentCalendar} />
        <Route path="/performance" component={PerformanceTracking} />
        <Route path="/social-planner" component={SocialPlanner} />
        <Route path="/competitor-monitor" component={CompetitorMonitor} />
        <Route path="/projects" component={Projects} />
        <Route path="/creator-profile" component={CreatorProfile} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public pages */}
      <Route path="/" component={Landing} />
      <Route path="/about" component={AboutUs} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/contact" component={Contact} />
      {/* All dashboard routes */}
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/products" component={DashboardRouter} />
      <Route path="/content" component={DashboardRouter} />
      <Route path="/content-repurposer" component={DashboardRouter} />
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
      <Route path="/admin" component={DashboardRouter} />
      <Route path="/social-publish" component={DashboardRouter} />
      <Route path="/video-render" component={DashboardRouter} />
      <Route path="/image-editor" component={DashboardRouter} />
      <Route path="/competitor-spy" component={DashboardRouter} />
      <Route path="/webhooks" component={DashboardRouter} />
      <Route path="/translate" component={DashboardRouter} />
      <Route path="/brand-voice" component={DashboardRouter} />
      <Route path="/email-marketing" component={DashboardRouter} />
      <Route path="/landing-pages" component={DashboardRouter} />
      <Route path="/automations" component={DashboardRouter} />
      <Route path="/video-studio" component={DashboardRouter} />
      <Route path="/competitor-intel" component={DashboardRouter} />
      <Route path="/customer-intel" component={DashboardRouter} />
      <Route path="/ai-avatars" component={DashboardRouter} />
      <Route path="/meme-generator" component={DashboardRouter} />
      <Route path="/content-ingest" component={DashboardRouter} />
      <Route path="/content-library" component={DashboardRouter} />
      <Route path="/content-templates" component={DashboardRouter} />
      <Route path="/content-scorer" component={DashboardRouter} />
      <Route path="/bulk-import" component={DashboardRouter} />
      <Route path="/brand-kit" component={DashboardRouter} />
      <Route path="/music-studio" component={DashboardRouter} />
      <Route path="/voiceover-studio" component={DashboardRouter} />
      <Route path="/ad-performance" component={DashboardRouter} />
      <Route path="/one-push-publisher" component={DashboardRouter} />
      <Route path="/content-calendar" component={DashboardRouter} />
      <Route path="/performance" component={DashboardRouter} />
      <Route path="/social-planner" component={DashboardRouter} />
      <Route path="/competitor-monitor" component={DashboardRouter} />
      <Route path="/projects" component={DashboardRouter} />
      <Route path="/creator-profile" component={DashboardRouter} />
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
