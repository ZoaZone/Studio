import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PenTool, Plus, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

const formats = ["banner", "story", "reel", "carousel", "video_ad", "search_ad"];
const platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "google"];

export default function AdCreator() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ headline: "", body_copy: "", cta: "", platform: "instagram", format: "banner", status: "draft" });
  const [aiLoading, setAiLoading] = useState(false);
  const qc = useQueryClient();

  const { data: ads = [] } = useQuery({
    queryKey: ["ad-creatives"],
    queryFn: () => base44.entities.AdCreative.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.AdCreative.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ad-creatives"] }); setShowCreate(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdCreative.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ad-creatives"] }),
  });

  const generateAd = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate ad creative for ${form.platform} (${form.format} format). Product/topic: ${form.headline || "general product"}. Return headline, body copy, and CTA text.`,
      response_json_schema: {
        type: "object",
        properties: { headline: { type: "string" }, body_copy: { type: "string" }, cta: { type: "string" } },
      },
    });
    setForm({ ...form, headline: res.headline, body_copy: res.body_copy, cta: res.cta });
    setAiLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Ad Creator" subtitle="Build platform-ready ad creatives with AI" actions={
        <Button onClick={() => setShowCreate(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Create Ad
        </Button>
      } />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ads.length === 0 && (
          <GlassCard className="col-span-full text-center py-12">
            <PenTool className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No ad creatives yet</p>
          </GlassCard>
        )}
        {ads.map(ad => (
          <GlassCard key={ad.id}>
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="text-xs border-white/10 text-white/50">{ad.platform} • {ad.format}</Badge>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ad.id)} className="text-white/30 hover:text-red-400 h-7 w-7">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{ad.headline}</h3>
            <p className="text-xs text-white/40 mb-3 line-clamp-3">{ad.body_copy}</p>
            {ad.cta && <Badge className="bg-magenta/10 text-magenta border-magenta/20 text-xs">{ad.cta}</Badge>}
          </GlassCard>
        ))}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>Create Ad Creative</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Format</Label>
                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{formats.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Headline</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Your ad headline..." />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Body Copy</Label>
              <Textarea value={form.body_copy} onChange={(e) => setForm({ ...form, body_copy: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
            </div>
            <div>
              <Label className="text-white/60 text-xs">CTA</Label>
              <Input value={form.cta} onChange={(e) => setForm({ ...form, cta: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="Shop Now, Learn More..." />
            </div>
            <Button variant="outline" onClick={generateAd} disabled={aiLoading} className="w-full border-magenta/30 text-magenta hover:bg-magenta/10 bg-transparent">
              {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {aiLoading ? "Generating..." : "AI Generate Copy"}
            </Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.headline} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
              Save Ad Creative
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}