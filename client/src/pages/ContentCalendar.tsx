import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3, List, Clock, Eye } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  tiktok: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  youtube: "bg-red-500/20 text-red-400 border-red-500/30",
  twitter: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  facebook: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  linkedin: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  pinterest: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  threads: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export default function ContentCalendar() {
  const { user } = useAuth();
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const scheduledQ = trpc.library.calendar.useQuery(
    { month: currentDate.getMonth() + 1, year: currentDate.getFullYear() },
    { enabled: !!user }
  );

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir * 7);
    setCurrentDate(d);
  };

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (view === "month") {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const days: { date: Date; isCurrentMonth: boolean }[] = [];

      // Previous month padding
      const prevMonthDays = new Date(year, month, 0).getDate();
      for (let i = firstDay - 1; i >= 0; i--) {
        days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
      }
      // Current month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
      }
      // Next month padding
      const remaining = 42 - days.length;
      for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
      return days;
    } else {
      // Week view
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const days: { date: Date; isCurrentMonth: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        days.push({ date: d, isCurrentMonth: d.getMonth() === month });
      }
      return days;
    }
  }, [currentDate, view]);

  // Map posts to dates
  const postsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (scheduledQ.data) {
      for (const post of scheduledQ.data) {
        const dateKey = new Date(post.scheduledAt).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(post);
      }
    }
    return map;
  }, [scheduledQ.data]);

  const today = new Date().toDateString();

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-zinc-500 mt-1">Visual overview of all scheduled posts across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>
            <Grid3X3 className="w-4 h-4 mr-1" /> Month
          </Button>
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>
            <List className="w-4 h-4 mr-1" /> Week
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          {view === "month"
            ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            : `Week of ${calendarDays[0]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${calendarDays[6]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
          }
        </h2>
        <Button variant="outline" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-zinc-900/40">
          {DAYS.map(d => (
            <div key={d} className="p-2 text-center text-xs font-medium text-zinc-500 border-b">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className={`grid grid-cols-7 ${view === "week" ? "min-h-[400px]" : ""}`}>
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const dateKey = date.toDateString();
            const posts = postsByDate[dateKey] || [];
            const isToday = dateKey === today;
            const isSelected = dateKey === selectedDay;

            return (
              <div
                key={idx}
                className={`border-b border-r p-1 cursor-pointer transition-colors ${view === "week" ? "min-h-[350px]" : "min-h-[100px]"} ${
                  !isCurrentMonth ? "bg-zinc-900/20 opacity-50" : ""
                } ${isToday ? "bg-primary/5" : ""} ${isSelected ? "ring-2 ring-primary ring-inset" : ""} hover:bg-zinc-900/50`}
                onClick={() => setSelectedDay(dateKey)}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" : "text-zinc-500"}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {posts.slice(0, view === "week" ? 10 : 3).map((post: any, i: number) => (
                    <div
                      key={i}
                      className={`text-[10px] px-1 py-0.5 rounded truncate border ${platformColors[post.platform] || "bg-zinc-800 text-zinc-500"}`}
                      title={`${post.platform} — ${post.caption || "Scheduled post"}`}
                    >
                      <span className="font-medium">{post.platform?.slice(0, 3).toUpperCase()}</span>
                      {view === "week" && <span className="ml-1 opacity-70">{new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                      {view === "week" && <span className="ml-1">{post.caption?.slice(0, 30) || "Post"}</span>}
                    </div>
                  ))}
                  {posts.length > (view === "week" ? 10 : 3) && (
                    <div className="text-[10px] text-zinc-500 text-center">+{posts.length - (view === "week" ? 10 : 3)} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && postsByDate[selectedDay] && (
        <Card>
          <CardContent className="py-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              <Badge variant="secondary">{postsByDate[selectedDay].length} posts</Badge>
            </h3>
            <div className="space-y-2">
              {postsByDate[selectedDay].map((post: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-900/40">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${platformColors[post.platform] || ""}`}>
                    {post.platform}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{post.caption || "Scheduled post"}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <Badge variant="outline" className="text-xs">{post.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{scheduledQ.data?.length || 0}</div>
            <div className="text-xs text-zinc-500">Total Scheduled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{scheduledQ.data?.filter((p: any) => p.status === "scheduled").length || 0}</div>
            <div className="text-xs text-zinc-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{scheduledQ.data?.filter((p: any) => p.status === "published").length || 0}</div>
            <div className="text-xs text-zinc-500">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <div className="text-2xl font-bold">{new Set(scheduledQ.data?.map((p: any) => p.platform)).size || 0}</div>
            <div className="text-xs text-zinc-500">Platforms</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
