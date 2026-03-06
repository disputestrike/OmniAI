import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UsersRound, MessageSquare, Video, ClipboardList, UserPlus, Bell, Share2 } from "lucide-react";
import { toast } from "sonner";

const features = [
  {
    title: "Team Workspace",
    description: "Invite team members, assign roles (admin, editor, viewer), and collaborate on campaigns in real-time.",
    icon: UsersRound,
    color: "text-violet-600",
    bg: "bg-violet-50",
    status: "coming_soon",
  },
  {
    title: "Team Chat",
    description: "Built-in messaging for campaign discussions, feedback, and approvals — no need for external tools.",
    icon: MessageSquare,
    color: "text-blue-600",
    bg: "bg-blue-50",
    status: "coming_soon",
  },
  {
    title: "Video Meetings",
    description: "Schedule and join video calls with your team directly from the platform for campaign reviews.",
    icon: Video,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    status: "coming_soon",
  },
  {
    title: "Task Assignment",
    description: "Create tasks, assign to team members, set deadlines, and track progress across all campaigns.",
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50",
    status: "coming_soon",
  },
  {
    title: "Notifications & Reminders",
    description: "Get notified about campaign milestones, scheduled posts, lead activity, and team updates.",
    icon: Bell,
    color: "text-rose-600",
    bg: "bg-rose-50",
    status: "coming_soon",
  },
  {
    title: "Share & Approve",
    description: "Share campaign drafts for approval, collect feedback, and maintain version history.",
    icon: Share2,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    status: "coming_soon",
  },
];

export default function Collaboration() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collaboration</h1>
          <p className="text-muted-foreground text-sm mt-1">Work together with your team — chat, video calls, task management, approvals, and notifications.</p>
        </div>
        <Button className="rounded-xl" onClick={() => toast.info("Team invites coming soon!")}>
          <UserPlus className="h-4 w-4 mr-2" />Invite Team
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(feature => (
          <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl ${feature.bg} flex items-center justify-center shrink-0`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">Coming Soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-primary/5">
        <CardContent className="p-6 text-center">
          <UsersRound className="h-10 w-10 mx-auto text-primary/60 mb-3" />
          <h3 className="font-semibold">Collaboration features are being built</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Team workspace, chat, video meetings, task management, and approval workflows are coming soon. 
            For now, you can use all AI-powered marketing tools as a solo user.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
