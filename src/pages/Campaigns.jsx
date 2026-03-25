import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone, Plus, Mail, MessageSquare, Phone, Send, Eye, MousePointer, MoreHorizontal, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";

const typeIcons = { email: Mail, sms: Phone, whatsapp: MessageSquare, social: Send, multi_channel: Megaphone };
const statusColors = {
  draft: "bg-white/10 text-white/50",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-400/20",
  running: "bg-emerald-500/10 text-emerald-400 border-emerald-400/20",
  completed: "bg-magenta/10 text-magenta border-magenta/20",
  paused: "bg-yellow-500/10 text-yellow-400 border-yellow-400/20",
};

export default function Campaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "email", subject: "", body: "", status: "draft" });
  const qc = useQueryClient();

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => base44.entities.MarketingCampaign.list("-created_date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.MarketingCampaign.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["campaigns"] }); setShowCreate(false); setForm({ name: "", type: "email", subject: "", body: "", status: "draft" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingCampaign.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  });

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpens = campaigns.reduce((s, c) => s + (c.open_count || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.click_count || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage bulk marketing campaigns"
        actions={
          <Button onClick={() => setShowCreate(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Sent" value={totalSent} icon={Send} color="magenta" />
        <StatCard label="Total Opens" value={totalOpens} icon={Eye} color="gold" />
        <StatCard label="Total Clicks" value={totalClicks} icon={MousePointer} color="blue" />
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 && (
          <GlassCard className="text-center py-12">
            <Megaphone className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No campaigns yet. Create your first one!</p>
          </GlassCard>
        )}
        {campaigns.map((c) => {
          const TypeIcon = typeIcons[c.type] || Megaphone;
          return (
            <GlassCard key={c.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-magenta/10 flex items-center justify-center flex-shrink-0">
                  <TypeIcon className="w-5 h-5 text-magenta" />
                </div>
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs ${statusColors[c.status] || ""}`}>{c.status}</Badge>
                    <span className="text-xs text-white/30">{c.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{c.sent_count || 0}</p>
                  <p className="text-xs text-white/30">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{c.open_count || 0}</p>
                  <p className="text-xs text-white/30">Opens</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{c.click_count || 0}</p>
                  <p className="text-xs text-white/30">Clicks</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="text-white/30 hover:text-red-400 h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/60 text-xs">Campaign Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="multi_channel">Multi-Channel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Message Body</Label>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={4} />
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
              Create Campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}