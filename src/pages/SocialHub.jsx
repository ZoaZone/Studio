import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Share2, Plus, Instagram, Sparkles, Calendar, Send, Image, Video, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { format } from "date-fns";

const platformColors = {
  instagram: "text-pink-400 bg-pink-400/10",
  facebook: "text-blue-400 bg-blue-400/10",
  tiktok: "text-cyan-400 bg-cyan-400/10",
  linkedin: "text-blue-500 bg-blue-500/10",
  youtube: "text-red-400 bg-red-400/10",
  twitter_x: "text-white/70 bg-white/10",
  pinterest: "text-red-500 bg-red-500/10",
};

export default function SocialHub() {
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ platform: "instagram", caption: "", media_type: "image", scheduled_at: "", status: "draft" });
  const [aiLoading, setAiLoading] = useState(false);
  const qc = useQueryClient();

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: () => base44.entities.ScheduledPost.list("-created_date", 100),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["social-accounts"],
    queryFn: () => base44.entities.SocialAccount.list("-created_date", 50),
  });

  const createPost = useMutation({
    mutationFn: (d) => base44.entities.ScheduledPost.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["posts"] }); setShowCompose(false); setForm({ platform: "instagram", caption: "", media_type: "image", scheduled_at: "", status: "draft" }); },
  });

  const deletePost = useMutation({
    mutationFn: (id) => base44.entities.ScheduledPost.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });

  const generateCaption = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a creative, engaging social media caption for ${form.platform}. Keep it under 200 characters. Use relevant emojis. Topic: ${form.caption || "general marketing"}`,
      response_json_schema: { type: "object", properties: { caption: { type: "string" } } },
    });
    setForm({ ...form, caption: res.caption });
    setAiLoading(false);
  };

  const scheduled = posts.filter(p => p.status === "scheduled");
  const posted = posts.filter(p => p.status === "posted");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Social Hub"
        subtitle="Manage social accounts and schedule posts"
        actions={
          <Button onClick={() => setShowCompose(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        }
      />

      {/* Connected Accounts */}
      <div className="flex flex-wrap gap-3 mb-8">
        {accounts.length === 0 && <p className="text-xs text-white/30">No social accounts connected yet. Add them in Settings.</p>}
        {accounts.map(a => (
          <div key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs ${platformColors[a.platform] || ""}`}>
            <div className={`w-5 h-5 rounded-full ${platformColors[a.platform]?.split(" ")[1]} flex items-center justify-center`}>
              <Share2 className="w-3 h-3" />
            </div>
            <span className="font-medium">{a.account_name}</span>
            <Badge variant="outline" className="text-[10px] border-white/10">{a.status}</Badge>
          </div>
        ))}
      </div>

      <Tabs defaultValue="scheduled" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">Scheduled ({scheduled.length})</TabsTrigger>
          <TabsTrigger value="posted" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">Posted ({posted.length})</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">All ({posts.length})</TabsTrigger>
        </TabsList>

        {["scheduled", "posted", "all"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid gap-4">
              {(tab === "all" ? posts : tab === "scheduled" ? scheduled : posted).length === 0 && (
                <GlassCard className="text-center py-12">
                  <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">No {tab} posts</p>
                </GlassCard>
              )}
              {(tab === "all" ? posts : tab === "scheduled" ? scheduled : posted).map(p => (
                <GlassCard key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${platformColors[p.platform]?.split(" ")[1] || "bg-white/10"}`}>
                      <Share2 className={`w-5 h-5 ${platformColors[p.platform]?.split(" ")[0] || "text-white/50"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.caption || "No caption"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-white/10 text-white/40">{p.platform}</Badge>
                        <Badge variant="outline" className="text-xs border-white/10 text-white/40">{p.media_type}</Badge>
                        <span className="text-xs text-white/30">{p.scheduled_at ? format(new Date(p.scheduled_at), "MMM d, h:mm a") : ""}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deletePost.mutate(p.id)} className="text-white/30 hover:text-red-400 h-8 w-8">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </GlassCard>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(platformColors).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Media Type</Label>
                <Select value={form.media_type} onValueChange={(v) => setForm({ ...form, media_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-white/60 text-xs">Caption</Label>
                <Button variant="ghost" size="sm" onClick={generateCaption} disabled={aiLoading} className="text-magenta text-xs h-6 px-2">
                  <Sparkles className="w-3 h-3 mr-1" /> {aiLoading ? "Generating..." : "AI Generate"}
                </Button>
              </div>
              <Textarea value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} className="bg-white/5 border-white/10 text-white" rows={4} placeholder="Write your caption..." />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Schedule At</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <Button onClick={() => createPost.mutate({ ...form, status: form.scheduled_at ? "scheduled" : "draft" })} disabled={!form.caption} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
              {form.scheduled_at ? "Schedule Post" : "Save as Draft"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}