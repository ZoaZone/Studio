import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Share2, Plus, Calendar, Instagram, Linkedin, Youtube, Clock, CheckCircle2, XCircle, Loader2, X, Image, AlignLeft } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-pink-500 to-rose-600" },
  { id: "facebook",  label: "Facebook",  color: "from-blue-500 to-blue-700" },
  { id: "tiktok",    label: "TikTok",    color: "from-gray-800 to-gray-900 border-white/20" },
  { id: "linkedin",  label: "LinkedIn",  color: "from-blue-600 to-blue-800" },
  { id: "youtube",   label: "YouTube",   color: "from-red-500 to-red-700" },
  { id: "twitter_x", label: "Twitter/X", color: "from-gray-700 to-gray-900" },
];

const STATUS_COLORS = {
  scheduled: "bg-amber-500/10 text-amber-400",
  posted:    "bg-emerald-500/10 text-emerald-400",
  draft:     "bg-muted text-muted-foreground",
  failed:    "bg-red-500/10 text-red-400",
};

export default function SocialHub() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const [showCompose, setShowCompose] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [form, setForm] = useState({ platform: "instagram", caption: "", media_url: "", media_type: "image", scheduled_at: "" });
  const [saving, setSaving] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["social_accounts"],
    queryFn: () => base44.entities.SocialAccount.list("-created_date", 20),
  });
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["scheduled_posts"],
    queryFn: () => base44.entities.ScheduledPost.list("-scheduled_at", 100),
  });

  const filtered = posts.filter(p => platformFilter === "all" || p.platform === platformFilter);

  const savePost = async () => {
    if (!form.caption) { alert("Caption required"); return; }
    setSaving(true);
    try {
      await base44.entities.ScheduledPost.create({
        ...form, status: form.scheduled_at ? "scheduled" : "draft",
      });
      qc.invalidateQueries(["scheduled_posts"]);
      setForm({ platform: "instagram", caption: "", media_url: "", media_type: "image", scheduled_at: "" });
      setShowCompose(false);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const connectedPlatforms = accounts.map(a => a.platform);
  const scheduledCount = posts.filter(p => p.status === "scheduled").length;
  const postedCount = posts.filter(p => p.status === "posted").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Share2 className="w-6 h-6 text-fuchsia-400" /> Social Hub</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Schedule and manage posts across all social platforms</p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-fuchsia-500/20">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Posts", value: posts.length },
          { label: "Scheduled", value: scheduledCount },
          { label: "Posted", value: postedCount },
          { label: "Connected Accounts", value: accounts.length },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <div className="text-2xl font-black text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Connected platforms */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Connected Platforms</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {PLATFORMS.map(p => {
            const isConnected = connectedPlatforms.includes(p.id);
            return (
              <div key={p.id} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isConnected ? "border-fuchsia-500/30 bg-fuchsia-500/5" : "border-border bg-muted/20"}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                  <span className="text-xs font-black text-white">{p.label[0]}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{p.label}</span>
                <span className={`text-[10px] ${isConnected ? "text-emerald-400" : "text-muted-foreground"}`}>{isConnected ? "Connected" : "Add in Settings"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...PLATFORMS.map(p => p.id)].map(f => (
          <button key={f} onClick={() => setPlatformFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${platformFilter === f ? "bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {f === "all" ? "All Platforms" : f.replace("_", "/")}
          </button>
        ))}
      </div>

      {/* Posts list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Calendar className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-foreground font-medium">No posts yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Compose and schedule your first social post</p>
            <button onClick={() => setShowCompose(true)} className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-xl text-sm font-semibold">
              Create Post
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(p => {
              const platform = PLATFORMS.find(pl => pl.id === p.platform);
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${platform?.color || "from-gray-500 to-gray-700"} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-black text-white">{(p.platform || "?")[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{p.caption || "No caption"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span className="capitalize">{p.platform?.replace("_", "/")}</span>
                      {p.media_type && <span>· {p.media_type}</span>}
                      {p.scheduled_at && <span>· <Clock className="w-3 h-3 inline" /> {new Date(p.scheduled_at).toLocaleString()}</span>}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[p.status] || "bg-muted text-muted-foreground"}`}>
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-lg">Compose Post</h3>
              <button onClick={() => setShowCompose(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Platform</label>
                  <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Media Type</label>
                  <select value={form.media_type} onChange={e => setForm(p => ({ ...p, media_type: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="reel">Reel</option>
                    <option value="story">Story</option>
                    <option value="carousel">Carousel</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Caption *</label>
                <textarea value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} rows={4} placeholder="Write your caption… or use Media Studio to generate one" className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Media URL</label>
                <input value={form.media_url} onChange={e => setForm(p => ({ ...p, media_url: e.target.value }))} placeholder="https://… or from Media Library" className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Schedule Date/Time</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCompose(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={savePost} disabled={saving || !form.caption} className="flex-1 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : form.scheduled_at ? "Schedule Post" : "Save as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
