import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  User, Globe, Instagram, Twitter, Linkedin, Link2, Edit, Plus, Trash2,
  Star, Eye, EyeOff, Loader2, Share2, Copy, ExternalLink, Image, Video,
  FileText, Mail, Megaphone, LayoutGrid, Sparkles, CheckCircle2
} from "lucide-react";

const CONTENT_TYPE_ICONS = {
  image: <Image className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  copy: <FileText className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  social: <Share2 className="w-4 h-4" />,
  ad: <Megaphone className="w-4 h-4" />,
  other: <LayoutGrid className="w-4 h-4" />,
};

const CONTENT_TYPE_COLORS = {
  image: "bg-purple-100 text-purple-700",
  video: "bg-red-100 text-red-700",
  copy: "bg-blue-100 text-blue-700",
  email: "bg-green-100 text-green-700",
  social: "bg-pink-100 text-pink-700",
  ad: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
};

const SPECIALTIES = [
  "Social Media Ads", "Google Ads", "Email Marketing", "Video Production",
  "Copywriting", "SEO Content", "Brand Strategy", "Influencer Marketing",
  "E-commerce", "B2B Marketing", "Content Strategy", "Performance Marketing"
];

export default function CreatorProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading } = trpc.creatorProfile.getMyProfile.useQuery(undefined, { enabled: !!user });
  const { data: portfolio, isLoading: portfolioLoading } = trpc.creatorProfile.getMyPortfolio.useQuery(undefined, { enabled: !!user });

  const upsertProfile = trpc.creatorProfile.upsertProfile.useMutation({
    onSuccess: () => { utils.creatorProfile.getMyProfile.invalidate(); toast.success("Profile saved!"); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const addItem = trpc.creatorProfile.addPortfolioItem.useMutation({
    onSuccess: () => { utils.creatorProfile.getMyPortfolio.invalidate(); toast.success("Portfolio item added"); setAddItemOpen(false); resetItemForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItem = trpc.creatorProfile.deletePortfolioItem.useMutation({
    onSuccess: () => { utils.creatorProfile.getMyPortfolio.invalidate(); toast.success("Item removed"); },
  });
  const toggleFeatured = trpc.creatorProfile.toggleFeatured.useMutation({
    onSuccess: () => utils.creatorProfile.getMyPortfolio.invalidate(),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [tagline, setTagline] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [profileSlug, setProfileSlug] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  // Portfolio item form state
  const [itemTitle, setItemTitle] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemType, setItemType] = useState("copy");
  const [itemContentText, setItemContentText] = useState("");
  const [itemContentUrl, setItemContentUrl] = useState("");
  const [itemThumbnailUrl, setItemThumbnailUrl] = useState("");
  const [itemPlatform, setItemPlatform] = useState("");
  const [itemIsPublic, setItemIsPublic] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setTagline(profile.tagline || "");
      setWebsite(profile.website || "");
      setInstagram(profile.instagram || "");
      setTwitter(profile.twitter || "");
      setLinkedin(profile.linkedin || "");
      setTiktok(profile.tiktok || "");
      setProfileSlug(profile.profileSlug || "");
      setIsPublic(profile.isPublic || false);
      setSelectedSpecialties((profile.specialties as string[]) || []);
    } else if (user) {
      setDisplayName(user.name || "");
      setProfileSlug(user.name?.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-") || "");
    }
  }, [profile, user]);

  const resetItemForm = () => {
    setItemTitle(""); setItemDescription(""); setItemType("copy");
    setItemContentText(""); setItemContentUrl(""); setItemThumbnailUrl(""); setItemPlatform(""); setItemIsPublic(true);
  };

  const handleSaveProfile = () => {
    upsertProfile.mutate({
      displayName, bio, tagline, website, instagram, twitter, linkedin, tiktok,
      profileSlug: profileSlug || undefined,
      isPublic,
      specialties: selectedSpecialties,
    });
  };

  const handleAddItem = () => {
    if (!itemTitle.trim()) { toast.error("Title is required"); return; }
    addItem.mutate({
      title: itemTitle,
      description: itemDescription || undefined,
      contentType: itemType as any,
      contentText: itemContentText || undefined,
      contentUrl: itemContentUrl || undefined,
      thumbnailUrl: itemThumbnailUrl || undefined,
      platform: itemPlatform || undefined,
      isPublic: itemIsPublic,
    });
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const profileUrl = profile?.profileSlug ? `${window.location.origin}/creator/${profile.profileSlug}` : null;

  const featuredItems = portfolio?.filter((i: any) => i.isFeatured) || [];
  const allItems = portfolio || [];

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-600" />
            Creator Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build your public portfolio and showcase your best work to clients and collaborators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profileUrl && (
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(profileUrl); toast.success("Profile URL copied!"); }}>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
          )}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Creator Profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Display Name</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Profile URL Slug</Label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">/creator/</span>
                      <Input value={profileSlug} onChange={e => setProfileSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="your-name" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="AI Marketing Specialist · 5+ Years Experience" />
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the world about your expertise..." rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(s => (
                      <button key={s} onClick={() => toggleSpecialty(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedSpecialties.includes(s) ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 hover:border-indigo-300"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram</Label>
                    <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Twitter / X</Label>
                    <Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn</Label>
                    <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/yourname" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>TikTok</Label>
                    <Input value={tiktok} onChange={e => setTiktok(e.target.value)} placeholder="@username" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  <div>
                    <p className="text-sm font-medium">{isPublic ? "Public Profile" : "Private Profile"}</p>
                    <p className="text-xs text-muted-foreground">{isPublic ? "Anyone with the link can view your profile" : "Only you can see your profile"}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveProfile} disabled={upsertProfile.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                    {upsertProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save Profile
                  </Button>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardContent className="pt-0 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
              <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                {(profile?.displayName || user?.name || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1">
              <h2 className="text-xl font-bold">{profile?.displayName || user?.name || "Your Name"}</h2>
              {profile?.tagline && <p className="text-sm text-muted-foreground">{profile.tagline}</p>}
            </div>
            <div className="ml-auto flex items-center gap-2 pb-1">
              {profile?.isPublic ? (
                <Badge className="bg-green-100 text-green-700 border-green-200"><Eye className="w-3 h-3 mr-1" /> Public</Badge>
              ) : (
                <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" /> Private</Badge>
              )}
            </div>
          </div>

          {profile?.bio && <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>}

          {/* Specialties */}
          {(() => { const specs = Array.isArray(profile?.specialties) ? (profile.specialties as unknown as string[]) : []; return specs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {specs.map((s: string) => (
                <Badge key={s} variant="outline" className="text-xs">{String(s)}</Badge>
              ))}
            </div>
          ) : null; })()}

          {/* Social Links */}
          <div className="flex items-center gap-3 text-muted-foreground">
            {profile?.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors"><Globe className="w-4 h-4" /></a>}
            {profile?.instagram && <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>}
            {profile?.twitter && <a href={`https://twitter.com/${profile.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-sky-500 transition-colors"><Twitter className="w-4 h-4" /></a>}
            {profile?.linkedin && <a href={`https://linkedin.com/in/${profile.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 transition-colors"><Linkedin className="w-4 h-4" /></a>}
            {profileUrl && (
              <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-indigo-600 hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View Public Profile
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xl font-bold text-indigo-600">{allItems.length}</p>
              <p className="text-xs text-muted-foreground">Portfolio Items</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-purple-600">{featuredItems.length}</p>
              <p className="text-xs text-muted-foreground">Featured Works</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-pink-600">{profile?.totalViews || 0}</p>
              <p className="text-xs text-muted-foreground">Profile Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Portfolio</h2>
        <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Work
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Portfolio Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="Summer Sale Campaign Copy" />
              </div>
              <div className="space-y-1.5">
                <Label>Content Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CONTENT_TYPE_ICONS).map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={itemDescription} onChange={e => setItemDescription(e.target.value)} placeholder="Brief description of this work..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Content Text (for copy/email/social)</Label>
                <Textarea value={itemContentText} onChange={e => setItemContentText(e.target.value)} placeholder="Paste your ad copy, email, or social post here..." rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label>Content URL (for images/videos)</Label>
                <Input value={itemContentUrl} onChange={e => setItemContentUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Thumbnail URL</Label>
                <Input value={itemThumbnailUrl} onChange={e => setItemThumbnailUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Input value={itemPlatform} onChange={e => setItemPlatform(e.target.value)} placeholder="Meta Ads, Google, TikTok..." />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={itemIsPublic} onCheckedChange={setItemIsPublic} />
                <Label>Visible on public profile</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddItem} disabled={addItem.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                  {addItem.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add to Portfolio
                </Button>
                <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {portfolioLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : allItems.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">No portfolio items yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Add your best work — ad copy, creatives, campaigns, or social posts — to showcase your skills.
            </p>
            <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAddItemOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All <Badge variant="secondary" className="ml-1 text-xs">{allItems.length}</Badge></TabsTrigger>
            <TabsTrigger value="featured">Featured <Badge variant="secondary" className="ml-1 text-xs">{featuredItems.length}</Badge></TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {allItems.map((item: any) => (
                <PortfolioCard
                  key={item.id}
                  item={item}
                  onDelete={() => deleteItem.mutate({ id: item.id })}
                  onToggleFeatured={() => toggleFeatured.mutate({ id: item.id })}
                />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="featured" className="mt-4">
            {featuredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No featured items. Star an item to feature it.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {featuredItems.map((item: any) => (
                  <PortfolioCard
                    key={item.id}
                    item={item}
                    onDelete={() => deleteItem.mutate({ id: item.id })}
                    onToggleFeatured={() => toggleFeatured.mutate({ id: item.id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function PortfolioCard({ item, onDelete, onToggleFeatured }: { item: any; onDelete: () => void; onToggleFeatured: () => void }) {
  const typeColor = CONTENT_TYPE_COLORS[item.contentType as keyof typeof CONTENT_TYPE_COLORS] || CONTENT_TYPE_COLORS.other;
  const typeIcon = CONTENT_TYPE_ICONS[item.contentType as keyof typeof CONTENT_TYPE_ICONS] || CONTENT_TYPE_ICONS.other;

  return (
    <Card className={`transition-all hover:shadow-md ${item.isFeatured ? "ring-1 ring-indigo-300" : ""}`}>
      {item.thumbnailUrl && (
        <div className="h-36 overflow-hidden rounded-t-lg">
          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="py-4">
        <div className="flex items-start gap-2 mb-2">
          <Badge className={`text-xs flex items-center gap-1 ${typeColor}`}>
            {typeIcon} {item.contentType}
          </Badge>
          {item.platform && <Badge variant="outline" className="text-xs">{item.platform}</Badge>}
          {item.isFeatured && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
          {!item.isPublic && <Badge variant="secondary" className="text-xs"><EyeOff className="w-3 h-3 mr-1" />Private</Badge>}
        </div>
        <p className="font-semibold text-sm mb-1">{item.title}</p>
        {item.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>}
        {item.contentText && (
          <div className="bg-gray-50 rounded p-2 mb-2">
            <p className="text-xs text-gray-700 line-clamp-3">{item.contentText}</p>
          </div>
        )}
        <div className="flex items-center gap-1 mt-2">
          <Button variant="ghost" size="sm" onClick={onToggleFeatured} className={`text-xs h-7 ${item.isFeatured ? "text-amber-600" : "text-muted-foreground"}`}>
            <Star className="w-3 h-3 mr-1" />{item.isFeatured ? "Unfeature" : "Feature"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
