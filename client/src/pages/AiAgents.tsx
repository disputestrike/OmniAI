import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Loader2, Sparkles, Lightbulb, Target, TrendingUp, PenTool,
  Megaphone, Brain, Globe, Crown, Flame, Eye, Heart, Users, Zap, ShoppingCart,
  Mic, MicOff, Volume2, VolumeX, ArrowRight, ExternalLink, Play,
  Rocket, BarChart3, Mail, Video, Image as ImageIcon, FileText, Search,
  Layout, Workflow, Calendar, Share2, Shield, Palette, Copy, Pencil, Paperclip, X,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { checkMediaSupport, getMediaErrorMessage } from "@/lib/mediaPermissions";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";

type Message = { role: "user" | "assistant"; content: string };

// Tool results from agent (matches server aiAgent.ToolResult)
type AgentToolResult =
  | { kind: "analyzeProduct"; positioning: string; valueProps: string[]; differentiators: Record<string, string>; targetAudience: string }
  | { kind: "createCampaign"; campaignId: number; name: string; goal: string }
  | { kind: "generateLandingPage"; landingPageId: number; headline: string; slug: string; previewUrl: string }
  | { kind: "generateEmailSequence"; sequenceId: string; emails: Array<{ index: number; subject: string; preview: string; body: string; sendDay: number; id: number }> }
  | { kind: "generateSocialPosts"; posts: Array<{ id: number; platform: string; content: string; title: string }> }
  | { kind: "error"; tool: string; message: string };

// Map tool paths to icons and labels for the action cards
const toolMap: Record<string, { icon: any; label: string; color: string }> = {
  "/products": { icon: ShoppingCart, label: "Product Analyzer", color: "bg-blue-500/10 text-blue-600" },
  "/content": { icon: PenTool, label: "Content Studio", color: "bg-purple-500/10 text-purple-600" },
  "/creatives": { icon: Palette, label: "Creative Engine", color: "bg-pink-500/10 text-pink-600" },
  "/video-ads": { icon: Video, label: "Video Ads", color: "bg-red-500/10 text-red-600" },
  "/video-render": { icon: Play, label: "Video Render", color: "bg-red-500/10 text-red-600" },
  "/video-studio": { icon: Video, label: "Video Studio", color: "bg-red-500/10 text-red-600" },
  "/image-editor": { icon: ImageIcon, label: "Image Editor", color: "bg-orange-500/10 text-orange-600" },
  "/brand-voice": { icon: Volume2, label: "Brand Voice", color: "bg-teal-500/10 text-teal-600" },
  "/translate": { icon: Globe, label: "Translate", color: "bg-cyan-500/10 text-cyan-600" },
  "/campaigns": { icon: Megaphone, label: "Campaigns", color: "bg-indigo-500/10 text-indigo-600" },
  "/ab-testing": { icon: BarChart3, label: "A/B Testing", color: "bg-amber-500/10 text-amber-600" },
  "/scheduler": { icon: Calendar, label: "Scheduler", color: "bg-green-500/10 text-green-600" },
  "/leads": { icon: Users, label: "Lead Manager", color: "bg-violet-500/10 text-violet-600" },
  "/deals": { icon: Target, label: "CRM Deals", color: "bg-emerald-500/10 text-emerald-600" },
  "/ad-platforms": { icon: Layout, label: "Ad Platforms", color: "bg-sky-500/10 text-sky-600" },
  "/momentum": { icon: TrendingUp, label: "Momentum", color: "bg-lime-500/10 text-lime-600" },
  "/social-publish": { icon: Share2, label: "Social Publish", color: "bg-fuchsia-500/10 text-fuchsia-600" },
  "/email-marketing": { icon: Mail, label: "Email Marketing", color: "bg-rose-500/10 text-rose-600" },
  "/intelligence": { icon: Search, label: "Website Intel", color: "bg-slate-500/10 text-slate-600" },
  "/platform-intel": { icon: Lightbulb, label: "Platform Intel", color: "bg-yellow-500/10 text-yellow-600" },
  "/seo-audits": { icon: Search, label: "SEO Audits", color: "bg-green-500/10 text-green-600" },
  "/analytics": { icon: BarChart3, label: "Analytics", color: "bg-blue-500/10 text-blue-600" },
  "/predictive": { icon: Brain, label: "Predictive AI", color: "bg-purple-500/10 text-purple-600" },
  "/competitor-spy": { icon: Eye, label: "Competitor Spy", color: "bg-red-500/10 text-red-600" },
  "/customer-intel": { icon: Users, label: "Customer Intel", color: "bg-teal-500/10 text-teal-600" },
  "/competitor-intel": { icon: Shield, label: "Competitor Intel", color: "bg-orange-500/10 text-orange-600" },
  "/landing-pages": { icon: Layout, label: "Landing Pages", color: "bg-indigo-500/10 text-indigo-600" },
  "/automations": { icon: Workflow, label: "Automations", color: "bg-cyan-500/10 text-cyan-600" },
  "/webhooks": { icon: Zap, label: "Webhooks", color: "bg-amber-500/10 text-amber-600" },
  "/collaboration": { icon: Users, label: "Collaboration", color: "bg-violet-500/10 text-violet-600" },
  "/approvals": { icon: Shield, label: "Approvals", color: "bg-emerald-500/10 text-emerald-600" },
};

// Parse next steps from AI response and extract tool links
function parseNextSteps(content: string): Array<{ text: string; path?: string; toolLabel?: string }> {
  const steps: Array<{ text: string; path?: string; toolLabel?: string }> = [];
  // Look for the "Next Steps" section
  const nextStepsMatch = content.match(/##\s*🎯\s*Your Next Steps([\s\S]*?)(?=##|$)/i)
    || content.match(/##\s*Next Steps([\s\S]*?)(?=##|$)/i)
    || content.match(/\*\*Next Steps\*\*([\s\S]*?)(?=\*\*|##|$)/i);

  if (!nextStepsMatch) return steps;

  const section = nextStepsMatch[1];
  const lines = section.split("\n").filter(l => l.trim().match(/^\d+[\.\)]/));

  for (const line of lines) {
    const text = line.replace(/^\d+[\.\)]\s*/, "").trim();
    // Find tool path references like (/products) or (/content)
    const pathMatch = text.match(/\(\/([a-z-]+)\)/);
    if (pathMatch) {
      const path = `/${pathMatch[1]}`;
      const tool = toolMap[path];
      steps.push({ text: text.replace(/\(\/[a-z-]+\)/g, "").trim(), path, toolLabel: tool?.label || path });
    } else {
      steps.push({ text });
    }
  }
  return steps;
}

const agentModes = [
  { id: "strategist", label: "Campaign Strategist", icon: Target, desc: "Full campaign strategy, targeting, and channel planning" },
  { id: "psychologist", label: "Persuasion Expert", icon: Brain, desc: "Psychological triggers, Cialdini, AIDA, emotional mapping" },
  { id: "viral", label: "Viral Engineer", icon: Flame, desc: "Make content, people, or products go viral" },
  { id: "seo", label: "SEO & Growth", icon: TrendingUp, desc: "SEO strategy, keyword research, organic growth" },
  { id: "creative", label: "Creative Director", icon: Sparkles, desc: "Ad concepts, visual direction, brand identity" },
  { id: "global", label: "Global Marketer", icon: Globe, desc: "Multi-language, multi-region, cultural adaptation" },
];

const quickPrompts = [
  { label: "Make my product #1", icon: Crown, prompt: "I have a product and I want to make it the #1 most purchased in its category. Give me a complete step-by-step domination strategy covering all channels, targeting, content, and conversion optimization." },
  { label: "Make someone viral", icon: Flame, prompt: "I want to make a person go viral on social media. Give me a comprehensive viral growth strategy covering content types, posting schedule, platform-specific tactics, collaboration strategies, and amplification techniques." },
  { label: "Spread a concept", icon: Eye, prompt: "I want to plant an idea in people's consciousness so it becomes inescapable. Give me a multi-channel saturation strategy covering messaging frameworks, emotional triggers, repetition patterns, and cultural penetration tactics." },
  { label: "Micro-targeting plan", icon: Target, prompt: "Create a comprehensive micro-targeting strategy. Cover demographic segmentation, psychographic profiling, behavioral targeting, lookalike audiences, and platform-specific targeting capabilities across all major ad platforms." },
  { label: "Psychological persuasion", icon: Brain, prompt: "Give me a masterclass on psychological persuasion in marketing. Cover Cialdini's 6 principles, AIDA framework, PAS formula, Monroe's Motivated Sequence, emotional triggers, cognitive biases, and how to apply each in ads, emails, and landing pages." },
  { label: "Competitor destroyer", icon: ShoppingCart, prompt: "I want to analyze and outperform my competitors. Give me a framework for competitive analysis, positioning strategy, differentiation tactics, and a plan to steal market share across all channels." },
  { label: "Content empire", icon: PenTool, prompt: "Help me build a content empire. I want a strategy that covers blogs, social media, video, podcasts, email, and paid content across all platforms. Include content pillars, repurposing workflows, and scaling strategies." },
  { label: "Lead generation machine", icon: Users, prompt: "Build me a lead generation machine. Cover lead magnets, landing pages, email sequences, retargeting, lead scoring, nurturing workflows, and conversion optimization across all channels." },
  { label: "Global expansion", icon: Globe, prompt: "I want to take my marketing global. Give me a strategy for expanding into new markets covering localization, cultural adaptation, platform selection by region, and multi-language content creation." },
  { label: "Zero to viral in 30 days", icon: Zap, prompt: "Give me a 30-day plan to go from zero to viral. Day-by-day action items covering content creation, platform optimization, engagement tactics, collaboration outreach, and amplification strategies." },
  { label: "UGC & influencer strategy", icon: Heart, prompt: "Create a comprehensive UGC and influencer marketing strategy. Cover creator identification, outreach templates, content briefs, compensation models, performance tracking, and scaling the program." },
  { label: "Full funnel blueprint", icon: Megaphone, prompt: "Design a complete marketing funnel from awareness to advocacy. Cover each stage: awareness, interest, consideration, intent, evaluation, purchase, retention, and advocacy with specific tactics and content for each." },
];

// Workflow templates - complete guided journeys
const workflows = [
  {
    label: "Product Launch",
    icon: Rocket,
    color: "bg-gradient-to-r from-blue-500 to-purple-500",
    prompt: "I'm launching a new product. Walk me through the COMPLETE launch workflow step by step: product analysis, competitor research, content creation (all 22 types), creative assets, video production, campaign setup, A/B testing, scheduling, publishing, and post-launch analytics. Start by asking me about my product.",
  },
  {
    label: "Go Viral in 7 Days",
    icon: Flame,
    color: "bg-gradient-to-r from-orange-500 to-red-500",
    prompt: "I want to go viral in 7 days. Walk me through a day-by-day workflow using ALL the OTOBI AI tools: Day 1 - Brand Voice setup + Content creation, Day 2 - Creative assets + Video production, Day 3 - A/B test variations, Day 4 - Schedule + Publish, Day 5-7 - Monitor momentum + Optimize. Start by asking what I want to make viral.",
  },
  {
    label: "Competitor Takedown",
    icon: Shield,
    color: "bg-gradient-to-r from-red-500 to-pink-500",
    prompt: "I want to analyze my competitors and create a strategy to beat them. Walk me through the complete competitive intelligence workflow: Competitor Spy analysis, Competitor Intel deep dive, SEO audit comparison, content gap analysis, then guide me to create counter-content and ads that outperform them. Start by asking who my competitors are.",
  },
  {
    label: "Content Machine",
    icon: PenTool,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    prompt: "Help me set up a content machine that produces content for ALL platforms automatically. Walk me through: Brand Voice training, Content Studio setup for all 22 content types, Creative Engine for visuals, Video Studio for personal videos, Scheduler for auto-publishing, and Automations for workflows. Start by asking about my brand.",
  },
];

export default function AiAgents() {
  const [, navigate] = useLocation();
  const chatMut = trpc.aiChat.send.useMutation({ onError: (e) => toast.error(e.message) });
  const uploadAttachMut = trpc.enhanced.uploadAttachment.useMutation({ onError: (e) => toast.error("Upload failed: " + e.message) });
  const wizardLaunch = trpc.campaign.wizardLaunch.useMutation({
    onSuccess: () => toast.success("Campaign launched."),
    onError: (e) => toast.error(e.message),
  });
  const voiceMut = trpc.voice.uploadAndTranscribe.useMutation({
    onError: (e) => toast.error("Voice transcription failed: " + e.message),
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastToolResults, setLastToolResults] = useState<AgentToolResult[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string, attachList?: Array<{ url: string; name: string }>) => {
    const toSend = (text || "").trim();
    if (!toSend || chatMut.isPending) return;
    const attach = attachList ?? attachments;
    setLastToolResults([]);
    const userMsg: Message = { role: "user", content: toSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachments([]);

    try {
      const result = await chatMut.mutateAsync({
        message: toSend,
        history: messages.slice(-20),
        attachments: attach.length ? attach : undefined,
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
      setLastToolResults((result as { toolResults?: AgentToolResult[] }).toolResults ?? []);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error. Please try again." }]);
      setLastToolResults([]);
    }
    inputRef.current?.focus();
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || uploadAttachMut.isPending) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) { toast.error(`${file.name} is too large (max 10MB)`); continue; }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(",")[1] || "");
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        const res = await uploadAttachMut.mutateAsync({
          base64,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
        });
        setAttachments(prev => [...prev, { url: res.url, name: res.filename }]);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    e.target.value = "";
  };

  // Text-to-speech readback
  const speakText = useCallback((text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\(\/[a-z-]+\)/g, "")
      .replace(/---/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  // Voice recording
  const startRecording = useCallback(async () => {
    const support = checkMediaSupport();
    if (!support.ok) {
      toast.error(support.message);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size > 16 * 1024 * 1024) {
          toast.error("Recording too large (max 16MB). Try a shorter message.");
          return;
        }

        toast.info("Transcribing your voice...");
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const result = await voiceMut.mutateAsync({
              audioBase64: base64,
              mimeType: mimeType.split(";")[0],
            });
            if (result.text) {
              setInput(result.text);
              toast.success("Voice transcribed! Press send or edit the text.");
            }
          } catch {
            toast.error("Could not transcribe audio. Please try typing instead.");
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
      toast.info("Recording... Click the mic button again to stop.");
    } catch (err) {
      toast.error(getMediaErrorMessage(err));
    }
  }, [voiceMut]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Navigate to a tool page
  const goToTool = (path: string) => {
    navigate(path);
  };

  // Render action cards for next steps extracted from AI response
  const renderNextStepCards = (content: string) => {
    const steps = parseNextSteps(content);
    if (steps.length === 0) return null;

    return (
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Rocket className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Quick Actions</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {steps.map((step, idx) => {
            const tool = step.path ? toolMap[step.path] : null;
            const ToolIcon = tool?.icon || ArrowRight;
            return (
              <button
                key={idx}
                onClick={() => step.path ? goToTool(step.path) : undefined}
                className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                  step.path
                    ? "bg-primary/5 hover:bg-primary/10 cursor-pointer border border-primary/20 hover:border-primary/40"
                    : "bg-muted/50 cursor-default"
                }`}
              >
                <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${tool?.color || "bg-muted text-muted-foreground"}`}>
                  <ToolIcon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  {step.toolLabel && (
                    <span className="font-semibold text-primary block text-[10px] uppercase tracking-wider">{step.toolLabel}</span>
                  )}
                  <span className="text-muted-foreground line-clamp-2">{step.text.slice(0, 80)}{step.text.length > 80 ? "..." : ""}</span>
                </div>
                {step.path && <ExternalLink className="h-3 w-3 text-primary/50 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Marketing Agent</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your AI strategist and trusted advisor. I'll walk you step-by-step from discovery to execution.
        </p>
      </div>

      {/* Guided Workflow Buttons */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {workflows.map(wf => (
            <button
              key={wf.label}
              onClick={() => sendMessage(wf.prompt)}
              className="relative overflow-hidden rounded-xl p-4 text-left group transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className={`absolute inset-0 ${wf.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <wf.icon className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-bold">{wf.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Complete guided workflow</p>
            </button>
          ))}
        </div>
      )}

      {/* Agent Modes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {agentModes.map(mode => (
          <button key={mode.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all text-left group"
            onClick={() => sendMessage(`Act as a ${mode.label}. ${mode.desc}. What's the first thing I should tell you about my project?`)}>
            <mode.icon className="h-4 w-4 text-primary mb-1.5" />
            <p className="text-xs font-medium group-hover:text-primary transition-colors">{mode.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{mode.desc}</p>
          </button>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div ref={scrollRef} className="h-[520px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">OTOBI AI Agent</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  I'm your trusted marketing advisor. I'll walk you step-by-step from idea to execution, connecting you to the right tools at every stage. Pick a workflow above or ask me anything.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-6 w-full max-w-3xl">
                  {quickPrompts.map(qp => (
                    <button key={qp.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-all text-left text-xs group" onClick={() => sendMessage(qp.prompt)}>
                      <qp.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="group-hover:text-primary transition-colors font-medium">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "assistant" ? (
                      <>
                        <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{msg.content}</Streamdown></div>
                        {/* Copy, Edit, Share, Read aloud */}
                        <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-border/30">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied to clipboard"); }}>
                            <Copy className="h-3 w-3 mr-1" />Copy
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary" onClick={() => setInput(msg.content)}>
                            <Pencil className="h-3 w-3 mr-1" />Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary" onClick={async () => {
                            const shareText = `From OTOBI AI:\n\n${msg.content}`;
                            if (typeof navigator !== "undefined" && navigator.share) {
                              try { await navigator.share({ title: "OTOBI AI", text: shareText }); toast.success("Shared"); } catch (e) { if ((e as Error).name !== "AbortError") { navigator.clipboard.writeText(shareText); toast.success("Copied to clipboard"); } }
                            } else { navigator.clipboard.writeText(shareText); toast.success("Copied to clipboard"); }
                          }}>
                            <Share2 className="h-3 w-3 mr-1" />Share
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary" onClick={() => speakText(msg.content)}>
                            {isSpeaking ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                            {isSpeaking ? "Stop" : "Read aloud"}
                          </Button>
                        </div>
                        {renderNextStepCards(msg.content)}
                      </>
                    ) : (
                      <>
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-primary-foreground/20">
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-primary-foreground/80 hover:text-primary-foreground" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied to clipboard"); }}>
                            <Copy className="h-3 w-3 mr-1" />Copy
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-primary-foreground/80 hover:text-primary-foreground" onClick={() => { setInput(msg.content); setMessages(prev => prev.slice(0, i)); }}>
                            <Pencil className="h-3 w-3 mr-1" />Edit
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatMut.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Building your launch assets...</span>
                </div>
              </div>
            )}
          </div>

          {/* Review UI: above input so users see what was built */}
          {!chatMut.isPending && lastToolResults.length > 0 && (
            <div className="border-t border-primary/20 bg-primary/5 p-3 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> I built these — review and approve
              </p>
              <div className="space-y-3">
                {lastToolResults.map((r, idx) => {
                  if (r.kind === "error") return <div key={idx} className="text-xs text-destructive">{(r as AgentToolResult & { kind: "error" }).tool}: {(r as AgentToolResult & { kind: "error" }).message}</div>;
                  if (r.kind === "analyzeProduct") {
                    const a = r as AgentToolResult & { kind: "analyzeProduct" };
                    return (
                      <Card key={idx} className="p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Product positioning</p>
                        <p className="text-sm font-medium">{a.positioning}</p>
                        {a.valueProps?.length > 0 && <ul className="text-xs mt-1 list-disc pl-4">{a.valueProps.map((v, i) => <li key={i}>{v}</li>)}</ul>}
                        <p className="text-xs mt-2 text-muted-foreground">{a.targetAudience}</p>
                      </Card>
                    );
                  }
                  if (r.kind === "createCampaign") {
                    const c = r as AgentToolResult & { kind: "createCampaign" };
                    return (
                      <Card key={idx} className="p-3">
                        <p className="text-xs font-medium text-muted-foreground">Campaign</p>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Goal: {c.goal} · ID: {c.campaignId}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/campaigns")}>View in Campaigns</Button>
                      </Card>
                    );
                  }
                  if (r.kind === "generateEmailSequence") {
                    const e = r as AgentToolResult & { kind: "generateEmailSequence" };
                    return (
                      <Card key={idx} className="p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Email sequence ({e.emails?.length ?? 0} emails)</p>
                        <ul className="space-y-1 text-xs">
                          {e.emails?.map((em, i) => <li key={i} className="flex justify-between"><span>Email {em.index}</span><span className="font-medium truncate max-w-[200px]">{em.subject}</span></li>)}
                        </ul>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/email-marketing")}>Edit in Email Marketing</Button>
                      </Card>
                    );
                  }
                  if (r.kind === "generateSocialPosts") {
                    const s = r as AgentToolResult & { kind: "generateSocialPosts" };
                    return (
                      <Card key={idx} className="p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Social posts ({s.posts?.length ?? 0})</p>
                        <ul className="space-y-1 text-xs">
                          {s.posts?.map((p, i) => <li key={i}><span className="font-medium">{p.platform}</span>: {p.title || p.content?.slice(0, 50)}…</li>)}
                        </ul>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate("/content")}>Edit in Content Studio</Button>
                      </Card>
                    );
                  }
                  if (r.kind === "generateLandingPage") {
                    const lp = r as AgentToolResult & { kind: "generateLandingPage" };
                    return (
                      <Card key={idx} className="p-3 border-primary/30 bg-primary/5">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Landing page created</p>
                        <p className="text-sm font-semibold">{lp.headline}</p>
                        <p className="text-xs text-muted-foreground mt-1">/{lp.slug}</p>
                        <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => navigate("/landing-pages")}>Edit page</Button>
                          <Button variant="outline" size="sm" onClick={() => window.open(lp.previewUrl, "_blank")}>Preview</Button>
                        </div>
                      </Card>
                    );
                  }
                  return null;
                })}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => { toast.success("Saved as draft. You can launch from Campaigns or Email Marketing."); setLastToolResults([]); navigate("/campaigns"); }}>Save as draft</Button>
                  <Button
                    disabled={wizardLaunch.isPending}
                    onClick={() => {
                      const campaignResult = lastToolResults.find((r): r is AgentToolResult & { kind: "createCampaign" } => r.kind === "createCampaign");
                      if (campaignResult?.campaignId) {
                        wizardLaunch.mutate({ campaignId: campaignResult.campaignId }, { onSettled: () => { setLastToolResults([]); navigate("/campaigns"); } });
                      } else {
                        toast.success("Review and launch from Campaigns when ready.");
                        setLastToolResults([]);
                        navigate("/campaigns");
                      }
                    }}
                  >
                    {wizardLaunch.isPending ? "Launching…" : "Launch everything"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Bar with Voice */}
          <div className="border-t p-3">
            {isRecording && (
              <div className="flex items-center gap-3 mb-2 px-2">
                <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-600 font-medium">Recording {formatTime(recordingTime)}</span>
                <div className="flex-1 h-1 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: `${Math.min(recordingTime * 2, 100)}%` }} />
                </div>
              </div>
            )}
            {voiceMut.isPending && (
              <div className="flex items-center gap-2 mb-2 px-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Transcribing your voice...</span>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((a, i) => (
                  <Badge key={i} variant="secondary" className="pr-1 gap-1">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[120px] truncate">{a.name}</span>
                    <button type="button" className="rounded-full hover:bg-muted p-0.5" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.txt,.doc,.docx,.csv,.json,image/*" onChange={handleFileAttach} />
              <Button type="button" size="sm" variant="outline" className="rounded-xl h-10 w-10 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={chatMut.isPending || uploadAttachMut.isPending} title="Attach file">
                {uploadAttachMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isRecording ? "destructive" : "outline"}
                className={`rounded-xl h-10 w-10 shrink-0 ${isRecording ? "animate-pulse" : ""}`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={chatMut.isPending || voiceMut.isPending}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type, attach a file, or use voice..."
                className="flex-1 border-0 bg-muted/50 focus-visible:ring-0 rounded-xl" disabled={chatMut.isPending} />
              <Button type="submit" size="sm" className="rounded-xl h-10 px-4" disabled={(!input.trim() && !attachments.length) || chatMut.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
