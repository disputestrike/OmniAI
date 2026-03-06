import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  Shield, Users, CreditCard, BarChart3, Crown, UserCog, Loader2,
  TrendingUp, AlertTriangle, ChevronDown, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminPanel() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: adminStats, isLoading: statsLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    retry: false,
  });
  const { data: allUsers, isLoading: usersLoading } = trpc.admin.users.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    retry: false,
  });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); utils.admin.stats.invalidate(); toast.success("User role updated"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePlan = trpc.admin.updateUserPlan.useMutation({
    onSuccess: () => { utils.admin.users.invalidate(); utils.admin.stats.invalidate(); toast.success("User plan updated"); },
    onError: (e) => toast.error(e.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You need admin privileges to access this panel. Contact your account administrator to request access.
        </p>
      </div>
    );
  }

  const filteredUsers = (allUsers || []).filter((u: any) => {
    const matchesSearch = !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesPlan = planFilter === "all" || u.subscriptionPlan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    starter: "bg-blue-100 text-blue-700",
    professional: "bg-purple-100 text-purple-700",
    business: "bg-amber-100 text-amber-700",
    enterprise: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, roles, subscriptions, and platform analytics
          </p>
        </div>
        <Badge className="bg-red-100 text-red-700 text-xs">
          <Crown className="h-3 w-3 mr-1" /> Admin Access
        </Badge>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{adminStats?.totalUsers ?? 0}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <UserCog className="h-5 w-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold">{adminStats?.totalTeamMembers ?? 0}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold">{adminStats?.activeSubscriptions ?? 0}</p>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-1">
                {(adminStats?.planBreakdown || []).map((pb: any) => (
                  <div key={pb.plan} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{pb.plan || "free"}</span>
                    <Badge variant="outline" className="text-xs">{pb.count}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Plan Breakdown</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">User Management</CardTitle>
            <Badge variant="outline">{filteredUsers.length} users</Badge>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found matching your filters.</div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filteredUsers.map((u: any) => (
                <div key={u.id} className="grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(u.name || u.email || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || "—"}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}>
                      {u.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                      {u.role}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge className={planColors[u.subscriptionPlan || "free"] || planColors.free}>
                      {u.subscriptionPlan || "free"}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    {/* Role Change */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={u.id === user?.id}>
                          <UserCog className="h-3 w-3 mr-1" /> Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Change Role for {u.name || u.email}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-muted-foreground">Current role: <Badge>{u.role}</Badge></p>
                          <div className="flex gap-3">
                            <DialogClose asChild>
                              <Button
                                variant={u.role === "admin" ? "outline" : "default"}
                                className="flex-1"
                                onClick={() => updateRole.mutate({ userId: u.id, role: "admin" })}
                                disabled={u.role === "admin"}
                              >
                                <Shield className="h-4 w-4 mr-2" /> Make Admin
                              </Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button
                                variant={u.role === "user" ? "outline" : "default"}
                                className="flex-1"
                                onClick={() => updateRole.mutate({ userId: u.id, role: "user" })}
                                disabled={u.role === "user"}
                              >
                                <Users className="h-4 w-4 mr-2" /> Make User
                              </Button>
                            </DialogClose>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {/* Plan Change */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <CreditCard className="h-3 w-3 mr-1" /> Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Change Plan for {u.name || u.email}</DialogTitle></DialogHeader>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-muted-foreground">Current plan: <Badge className={planColors[u.subscriptionPlan || "free"]}>{u.subscriptionPlan || "free"}</Badge></p>
                          <div className="grid grid-cols-2 gap-2">
                            {["free", "starter", "professional", "business", "enterprise"].map(plan => (
                              <DialogClose key={plan} asChild>
                                <Button
                                  variant={(u.subscriptionPlan || "free") === plan ? "outline" : "default"}
                                  size="sm"
                                  className="capitalize"
                                  onClick={() => updatePlan.mutate({ userId: u.id, plan: plan as any })}
                                  disabled={(u.subscriptionPlan || "free") === plan}
                                >
                                  {plan}
                                </Button>
                              </DialogClose>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
