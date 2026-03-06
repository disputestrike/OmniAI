import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Loader2, Sparkles, Lightbulb, Target, TrendingUp, PenTool,
  Megaphone, Brain, Globe, Crown, Flame, Eye, Heart, Users, Zap, ShoppingCart,
  Mic, MicOff, Upload, Paperclip, Image as ImageIcon, FileText,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = { role: "user" | "assistant"; content: string };

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

export default function AiAgents() {
  const chatMut = trpc.aiChat.send.useMutation({ onError: (e) => toast.error(e.message) });
  const voiceMut = trpc.voice.uploadAndTranscribe.useMutation({
    onError: (e) => toast.error("Voice transcription failed: " + e.message),
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || chatMut.isPending) return;
    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    try {
      const result = await chatMut.mutateAsync({
        message: text,
        history: messages.slice(-20),
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error. Please try again." }]);
    }
    inputRef.current?.focus();
  };

  // Voice recording
  const startRecording = useCallback(async () => {
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

        // Convert to base64 and send for transcription
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
      toast.error("Microphone access denied. Please allow microphone access in your browser settings.");
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Marketing Agent</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your AI strategist for dominating any market. Type, talk, or pick a strategy to get started.
        </p>
      </div>

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
          <div ref={scrollRef} className="h-[480px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">OmniMarket AI Agent</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  I'm your AI marketing strategist. Type a message, use your voice, or pick a quick action below.
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground"><Streamdown>{msg.content}</Streamdown></div>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatMut.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Strategizing...</span>
                </div>
              </div>
            )}
          </div>

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
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2">
              {/* Voice Button */}
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
                placeholder="Type or use your voice — ask about strategy, targeting, viral growth, persuasion..."
                className="flex-1 border-0 bg-muted/50 focus-visible:ring-0 rounded-xl" disabled={chatMut.isPending} />
              <Button type="submit" size="sm" className="rounded-xl h-10 px-4" disabled={!input.trim() || chatMut.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
