import { trpc } from "@/lib/trpc";
import {
  Bot, Send, Loader2, Sparkles, Target, TrendingUp, PenTool, Megaphone,
  Brain, Globe, Flame, Eye, Users, Zap, ShoppingCart, Mic, MicOff,
  Volume2, VolumeX, Rocket, BarChart3, Mail, Video, Search, Workflow,
  Calendar, Share2, Shield, Palette, Copy, Paperclip, X,
  CheckCircle2, ExternalLink, Layout, Crown, Heart,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { checkMediaSupport } from "@/lib/mediaPermissions";
import { Streamdown } from "streamdown";
import { useLocation, useSearch } from "wouter";

type Message = { role: "user" | "assistant"; content: string };
type AgentStatus = "idle" | "running" | "done" | "error" | "skipped";

type AgentToolResult =
  | { kind: "analyzeProduct"; positioning: string; valueProps: string[]; differentiators: Record<string, string>; targetAudience: string }
  | { kind: "createCampaign"; campaignId: number; name: string; goal: string }
  | { kind: "generateLandingPage"; landingPageId: number; headline: string; slug: string; previewUrl: string }
  | { kind: "generateEmailSequence"; sequenceId: string; emails: Array<{ index: number; subject: string; preview: string; body: string; sendDay: number; id: number }> }
  | { kind: "generateSocialPosts"; posts: Array<{ id: number; platform: string; content: string; title: string }> }
  | { kind: "error"; tool: string; message: string };

interface SubAgent { id: string; name: string; icon: string; color: string; status: AgentStatus; output?: string; }

const AGENT_DEFS: Omit<SubAgent, "status" | "output">[] = [
  { id: "strategy", name: "Strategy",     icon: "🎯", color: "#7c3aed" },
  { id: "content",  name: "Content",      icon: "✍️",  color: "#06b6d4" },
  { id: "creative", name: "Creative",     icon: "🎨", color: "#ec4899" },
  { id: "video",    name: "Video",        icon: "🎬", color: "#ef4444" },
  { id: "email",    name: "Email",        icon: "📧", color: "#3b82f6" },
  { id: "social",   name: "Social",       icon: "📱", color: "#10b981" },
  { id: "seo",      name: "SEO",          icon: "🔍", color: "#f59e0b" },
  { id: "landing",  name: "Landing Page", icon: "🔗", color: "#8b5cf6" },
];

const ASSET_CFG: Record<string, { icon: typeof Mail; color: string; label: string; path: string }> = {
  analyzeProduct:        { icon: Search,    color: "#7c3aed", label: "Product Analysis", path: "/products" },
  createCampaign:        { icon: Megaphone, color: "#06b6d4", label: "Campaign",         path: "/campaigns" },
  generateLandingPage:   { icon: Layout,    color: "#8b5cf6", label: "Landing Page",     path: "/landing-pages" },
  generateEmailSequence: { icon: Mail,      color: "#3b82f6", label: "Email Sequence",   path: "/email-marketing" },
  generateSocialPosts:   { icon: Share2,    color: "#10b981", label: "Social Posts",     path: "/content" },
};

const QUICK_PROMPTS = [
  { icon: Crown,     label: "Make my product #1",      prompt: "I have a product and I want to make it the #1 most purchased in its category. Build a complete domination strategy across all channels, targeting, content, and conversion optimization." },
  { icon: Flame,     label: "Go viral in 7 days",      prompt: "I want to go viral in 7 days. Create a day-by-day plan using content, video, social strategy, and paid amplification. Start executing immediately." },
  { icon: Rocket,    label: "Full product launch",     prompt: "Launch my product. I need a complete campaign: product analysis, content for all platforms, email sequence, social posts, and landing page. Build everything now." },
  { icon: Target,    label: "Lead generation machine", prompt: "Build me a lead generation machine. Landing page, email sequence, social content, and CRM setup. I want leads coming in within 48 hours." },
  { icon: Brain,     label: "Persuasion framework",    prompt: "Create a psychological persuasion framework for my marketing. Apply Cialdini, AIDA, emotional triggers, and cognitive biases across ads, emails, and landing pages." },
  { icon: Shield,    label: "Competitor takedown",     prompt: "I want to analyze and outperform my competitors. Give me a competitive analysis and a strategy to steal market share across every channel." },
  { icon: Globe,     label: "Global expansion",        prompt: "Take my marketing global. Strategy for new markets: localization, cultural adaptation, platform selection by region, multi-language content." },
  { icon: PenTool,   label: "Content empire",          prompt: "Build me a content empire. Blogs, social, video, podcasts, email across all platforms. Content pillars, repurposing workflows, scaling strategy." },
  { icon: Users,     label: "Full funnel blueprint",   prompt: "Design a complete marketing funnel from awareness to advocacy. Content, tactics, and automation for every stage. Build the assets now." },
  { icon: BarChart3, label: "Momentum analysis",       prompt: "Analyze my current marketing momentum. What's working, what's not, what should I double down on? Then rebuild the winning elements." },
  { icon: Heart,     label: "UGC & influencer plan",   prompt: "Create a UGC and influencer strategy. Creator identification, outreach templates, content briefs, performance tracking, and scale plan." },
  { icon: Zap,       label: "30-day growth sprint",    prompt: "Give me a 30-day growth sprint. Day-by-day action items: content, ads, social, email, and optimization. Measurable results by day 30." },
];

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function AiAgents() {
  const [, navigate] = useLocation();
  const search = useSearch() as string;

  const chatMut = trpc.aiChat.send.useMutation({ onError: e => toast.error(e.message) });
  const uploadAttachMut = trpc.enhanced.uploadAttachment.useMutation({ onError: e => toast.error("Upload failed: " + e.message) });
  const wizardLaunch = trpc.campaign.wizardLaunch.useMutation({ onSuccess: () => toast.success("Campaign launched."), onError: e => toast.error(e.message) });
  const voiceMut = trpc.voice.uploadAndTranscribe.useMutation({ onError: e => toast.error("Voice failed: " + e.message) });

  const [messages, setMessages] = useState<Message[]>([]);
  const [toolResults, setToolResults] = useState<AgentToolResult[]>([]);
  const [agents, setAgents] = useState<SubAgent[]>(AGENT_DEFS.map(d => ({ ...d, status: "idle" as AgentStatus })));
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, chatMut.isPending]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const q = params.get("prompt");
    if (q) {
      const decoded = decodeURIComponent(q);
      setInput(decoded);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [search]);

  const animateAgents = useCallback((results: AgentToolResult[]) => {
    const kinds = new Set(results.map(r => r.kind));
    const mapping: Record<string, string[]> = {
      strategy: ["analyzeProduct", "createCampaign"],
      content: ["generateSocialPosts"],
      creative: [],
      video: [],
      email: ["generateEmailSequence"],
      social: ["generateSocialPosts"],
      seo: [],
      landing: ["generateLandingPage"],
    };
    setAgents(AGENT_DEFS.map(d => {
      const relevant = mapping[d.id] ?? [];
      const matched = relevant.some(k => kinds.has(k as AgentToolResult["kind"]));
      const outputs: Record<string, string> = {
        strategy: "Brief + positioning ready",
        content: `${results.filter(r => r.kind === "generateSocialPosts").flatMap(r => (r as { posts?: unknown[] }).posts ?? []).length} pieces created`,
        email: `${results.filter(r => r.kind === "generateEmailSequence").flatMap(r => (r as { emails?: unknown[] }).emails ?? []).length} emails written`,
        social: `${results.filter(r => r.kind === "generateSocialPosts").flatMap(r => (r as { posts?: unknown[] }).posts ?? []).length} posts drafted`,
        landing: "Page published",
        creative: "Assets in library",
        video: "Script delivered",
        seo: "Brief complete",
      };
      return { ...d, status: matched ? "done" : relevant.length > 0 ? "skipped" : "idle" as AgentStatus, output: matched ? outputs[d.id] : undefined };
    }));
  }, []);

  const sendMessage = async (text: string, attachList?: Array<{ url: string; name: string }>) => {
    const toSend = text.trim();
    if (!toSend || chatMut.isPending) return;
    const attach = attachList ?? attachments;
    setToolResults([]);
    setShowAssets(false);
    setAgents(AGENT_DEFS.map(d => ({ ...d, status: "idle" as AgentStatus })));
    setMessages(prev => [...prev, { role: "user", content: toSend }]);
    setInput("");
    setAttachments([]);
    setTimeout(() => setAgents(prev => prev.map((a, i) => ({ ...a, status: i < 5 ? "running" as AgentStatus : "idle" as AgentStatus }))), 400);
    try {
      const result = await chatMut.mutateAsync({ message: toSend, history: messages.slice(-20), attachments: attach.length ? attach : undefined });
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
      const results = (result as { toolResults?: AgentToolResult[] }).toolResults ?? [];
      setToolResults(results);
      if (results.length > 0) { animateAgents(results); setShowAssets(true); } else { setAgents(AGENT_DEFS.map(d => ({ ...d, status: "idle" as AgentStatus }))); }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      setAgents(AGENT_DEFS.map(d => ({ ...d, status: "idle" as AgentStatus })));
    }
    inputRef.current?.focus();
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || uploadAttachMut.isPending) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} too large`); continue; }
      try {
        const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(file); });
        const result = await uploadAttachMut.mutateAsync({ base64, filename: file.name, mimeType: file.type || "application/octet-stream" });
        setAttachments(prev => [...prev, { url: result.url, name: result.filename }]);
      } catch { toast.error(`Failed to upload ${file.name}`); }
    }
    e.target.value = "";
  };

  const speakText = useCallback((text: string) => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const utt = new SpeechSynthesisUtterance(text.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n/g, " ").trim());
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utt);
  }, [isSpeaking]);

  const startRecording = useCallback(async () => {
    const support = checkMediaSupport();
    if (!support.ok) { toast.error(support.message); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res((r.result as string).split(",")[1] || ""); r.onerror = rej; r.readAsDataURL(blob); });
        try { const result = await voiceMut.mutateAsync({ base64, mimeType }); if (result.text) { setInput(result.text); inputRef.current?.focus(); } } catch { toast.error("Transcription failed"); }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast.error("Microphone access denied"); }
  }, [voiceMut]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const isRunning = chatMut.isPending;
  const hasMessages = messages.length > 0;
  const hasAssets = toolResults.filter(r => r.kind !== "error").length > 0;

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>

      {/* ── Left: Sub-agent panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col w-60 shrink-0 border-r overflow-hidden" style={{ background: "#0c0c0e", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-xs font-black text-white mb-0.5">Sub-Agents</p>
          <p className="text-[10px] text-zinc-600">Parallel execution, every prompt</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {agents.map(agent => (
            <div key={agent.id} className="rounded-xl p-3 transition-all duration-400"
              style={{
                background: agent.status === "done" ? `${agent.color}0d` : agent.status === "running" ? `${agent.color}14` : "rgba(255,255,255,0.02)",
                border: `1px solid ${agent.status === "done" ? agent.color + "2a" : agent.status === "running" ? agent.color + "35" : "rgba(255,255,255,0.05)"}`,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{agent.icon}</span>
                  <span className="text-[11px] font-semibold text-zinc-300">{agent.name}</span>
                </div>
                <span className={`agent-pill ${agent.status === "skipped" ? "idle" : agent.status}`} style={{ fontSize: "9px" }}>
                  <span className="dot" />{agent.status === "skipped" ? "—" : agent.status}
                </span>
              </div>
              {agent.output && <p className="text-[10px] text-zinc-600 pl-6 leading-tight">{agent.output}</p>}
            </div>
          ))}
        </div>
        <div className="px-4 py-2.5 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-mono text-zinc-700">
            {isRunning ? "⚡ Executing in parallel..." : hasAssets ? `✅ ${toolResults.filter(r => r.kind !== "error").length} tools executed` : "Waiting for prompt..."}
          </p>
        </div>
      </div>

      {/* ── Center: Chat ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "#09090b" }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">OmniAI Agent</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">Marketing OS · All tools active</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`agent-pill ${isRunning ? "running" : hasMessages ? "done" : "idle"}`} style={{ fontSize: "10px" }}>
              <span className="dot" />{isRunning ? "Running" : hasMessages ? "Ready" : "Standby"}
            </span>
            {hasMessages && (
              <button onClick={() => { setMessages([]); setToolResults([]); setShowAssets(false); setAgents(AGENT_DEFS.map(d => ({ ...d, status: "idle" as AgentStatus }))); }}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 px-2.5 py-1 rounded-lg transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                New session
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Empty state */}
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-full gap-7 pb-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))", border: "1px solid rgba(124,58,237,0.25)" }}>
                  <Sparkles className="h-8 w-8 text-violet-400" />
                </div>
                <h2 className="text-xl font-black text-white mb-1.5">What do you want to build?</h2>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">Describe your campaign. Sub-agents fire simultaneously and deliver a complete production asset library.</p>
              </div>
              <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2">
                {QUICK_PROMPTS.slice(0, 9).map(p => (
                  <button key={p.label} onClick={() => sendMessage(p.prompt)}
                    className="text-left rounded-xl px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:border-violet-500/30 group"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <p.icon className="h-3.5 w-3.5 text-zinc-600 mb-1.5 group-hover:text-violet-400 transition-colors" />
                    <p className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors leading-tight">{p.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="max-w-2xl rounded-2xl px-4 py-3"
                style={msg.role === "user"
                  ? { background: "rgba(124,58,237,0.16)", border: "1px solid rgba(124,58,237,0.28)", borderTopRightRadius: "4px" }
                  : { background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderTopLeftRadius: "4px" }
                }>
                {msg.role === "assistant"
                  ? <div className="prose-dark text-sm"><Streamdown content={msg.content} /></div>
                  : <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                }
                <div className="flex items-center gap-1 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <button onClick={() => navigator.clipboard.writeText(msg.content).then(() => toast.success("Copied"))}
                    className="flex items-center gap-1 text-[10px] text-zinc-700 hover:text-zinc-400 px-1.5 py-0.5 rounded transition-colors">
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </button>
                  {msg.role === "assistant" && (
                    <button onClick={() => speakText(msg.content)}
                      className="flex items-center gap-1 text-[10px] text-zinc-700 hover:text-zinc-400 px-1.5 py-0.5 rounded transition-colors">
                      {isSpeaking ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}
                      {isSpeaking ? "Stop" : "Listen"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Running */}
          {isRunning && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
              <div className="rounded-2xl px-4 py-3 space-y-2" style={{ background: "#111113", border: "1px solid rgba(255,255,255,0.07)", borderTopLeftRadius: "4px" }}>
                <p className="text-xs text-zinc-500 font-mono">Firing sub-agents in parallel...</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Strategy","Content","Email","Social","Landing"].map((name, i) => (
                    <span key={name} className="agent-pill running" style={{ fontSize: "9px", animationDelay: `${i * 100}ms` }}>
                      <span className="dot" />{name}
                    </span>
                  ))}
                </div>
                <div className="progress-bar w-44"><div className="fill indeterminate" /></div>
              </div>
            </div>
          )}
        </div>

        {/* Asset results */}
        {showAssets && hasAssets && (
          <div className="border-t px-5 py-4 max-h-64 overflow-y-auto shrink-0"
            style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.03)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {toolResults.filter(r => r.kind !== "error").length} assets built — review and launch
              </p>
              <button onClick={() => setShowAssets(false)} className="text-zinc-600 hover:text-zinc-400"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {toolResults.map((r, idx) => {
                const cfg = ASSET_CFG[r.kind];
                if (!cfg || r.kind === "error") return null;
                return (
                  <div key={idx} className="rounded-xl p-3 animate-scale-in"
                    style={{ background: `${cfg.color}09`, border: `1px solid ${cfg.color}22`, animationDelay: `${idx * 70}ms` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <cfg.icon className="h-3 w-3" style={{ color: cfg.color }} />
                      <span className="text-[11px] font-bold text-zinc-200">{cfg.label}</span>
                    </div>
                    {r.kind === "analyzeProduct" && <p className="text-[10px] text-zinc-500 line-clamp-2">{r.positioning}</p>}
                    {r.kind === "createCampaign" && <p className="text-[10px] text-zinc-500">{r.name} · {r.goal}</p>}
                    {r.kind === "generateLandingPage" && <p className="text-[10px] text-zinc-500 line-clamp-1">{r.headline}</p>}
                    {r.kind === "generateEmailSequence" && <p className="text-[10px] text-zinc-500">{r.emails?.length ?? 0} emails</p>}
                    {r.kind === "generateSocialPosts" && <p className="text-[10px] text-zinc-500">{r.posts?.length ?? 0} posts</p>}
                    <button onClick={() => navigate(cfg.path)} className="flex items-center gap-1 mt-1.5 text-[10px] font-bold hover:opacity-70 transition-opacity" style={{ color: cfg.color }}>
                      Open <ExternalLink className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => {
                  const campaign = toolResults.find((r): r is AgentToolResult & { kind: "createCampaign" } => r.kind === "createCampaign");
                  if (campaign?.campaignId) { wizardLaunch.mutate({ campaignId: campaign.campaignId }, { onSettled: () => { setShowAssets(false); navigate("/campaigns"); } }); }
                  else { toast.success("Review and launch from Campaigns."); setShowAssets(false); navigate("/campaigns"); }
                }}
                disabled={wizardLaunch.isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50">
                {wizardLaunch.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
                Launch campaign
              </button>
              <button onClick={() => { setShowAssets(false); navigate("/campaigns"); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                Save as draft
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4 shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)" }}>
          {isRecording && (
            <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Recording {formatTime(recordingTime)}</span>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(239,68,68,0.1)" }}>
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(recordingTime * 3, 100)}%`, transition: "width 1s linear" }} />
              </div>
            </div>
          )}
          {voiceMut.isPending && (
            <div className="flex items-center gap-2 mb-2 text-xs text-zinc-500">
              <Loader2 className="h-3 w-3 animate-spin text-violet-400" /> Transcribing voice...
            </div>
          )}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attachments.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full text-zinc-400"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Paperclip className="h-2.5 w-2.5" />
                  <span className="max-w-[100px] truncate">{a.name}</span>
                  <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="hover:text-white"><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.txt,.doc,.docx,.csv,.json,image/*" onChange={handleFileAttach} />
          <div className="command-bar flex items-center gap-2 px-3 py-2.5">
            <button onClick={() => fileInputRef.current?.click()} disabled={uploadAttachMut.isPending} title="Attach file"
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors">
              {uploadAttachMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
            <button onClick={isRecording ? stopRecording : startRecording} disabled={chatMut.isPending || voiceMut.isPending}
              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isRecording ? "text-red-400" : "text-zinc-600 hover:text-zinc-300"}`}>
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !chatMut.isPending) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Describe your campaign, product, or goal..."
              className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder:text-zinc-600 font-medium min-w-0"
              disabled={chatMut.isPending} />
            <button onClick={() => sendMessage(input)} disabled={(!input.trim() && !attachments.length) || chatMut.isPending}
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{ background: "rgba(124,58,237,0.8)" }}>
              {chatMut.isPending ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-700 text-center mt-2">
            All 22+ tools active · Parallel execution · Assets saved to library
          </p>
        </div>
      </div>

      {/* ── Right: Quick launches ──────────────────────────── */}
      <div className="hidden xl:flex flex-col w-48 shrink-0 border-l overflow-hidden"
        style={{ background: "#0c0c0e", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-3 pt-4 pb-2 border-b shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-wider">Quick Launches</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => sendMessage(p.prompt)} disabled={isRunning}
              className="w-full text-left rounded-lg px-2.5 py-2 transition-all hover:bg-white/4 group disabled:opacity-40">
              <div className="flex items-center gap-2">
                <p.icon className="h-3 w-3 text-zinc-700 group-hover:text-violet-400 transition-colors shrink-0" />
                <p className="text-[11px] font-medium text-zinc-600 group-hover:text-zinc-300 transition-colors leading-tight">{p.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
