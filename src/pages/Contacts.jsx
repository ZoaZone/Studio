import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Filter, Mail, Phone, Tag, MoreHorizontal, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", whatsapp: "", source: "manual", funnel_stage: "", notes: "", opted_in_email: false, opted_in_sms: false, opted_in_whatsapp: false });

  const qc = useQueryClient();
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.MarketingContact.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingContact.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts"] }); setShowAdd(false); setForm({ full_name: "", email: "", phone: "", whatsapp: "", source: "manual", funnel_stage: "", notes: "", opted_in_email: false, opted_in_sms: false, opted_in_whatsapp: false }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MarketingContact.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });

  const filtered = contacts.filter((c) => {
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || c.funnel_stage === stageFilter;
    const matchSource = sourceFilter === "all" || c.source === sourceFilter;
    return matchSearch && matchStage && matchSource;
  });

  const stages = [...new Set(contacts.map(c => c.funnel_stage).filter(Boolean))];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} contacts in your CRM`}
        actions={
          <Button onClick={() => setShowAdd(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Add Contact
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="ad">Ad</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">Name</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">Email</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden md:table-cell">Phone</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden lg:table-cell">Source</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden lg:table-cell">Stage</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden lg:table-cell">Score</th>
              <th className="text-right text-xs font-medium text-white/40 uppercase tracking-wider p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                <td className="p-4 font-medium text-white">{c.full_name}</td>
                <td className="p-4 text-white/50">{c.email || "—"}</td>
                <td className="p-4 text-white/50 hidden md:table-cell">{c.phone || "—"}</td>
                <td className="p-4 hidden lg:table-cell">
                  {c.source && <Badge variant="outline" className="border-white/10 text-white/50 text-xs">{c.source}</Badge>}
                </td>
                <td className="p-4 hidden lg:table-cell">
                  {c.funnel_stage && <Badge className="bg-magenta/10 text-magenta border-magenta/20 text-xs">{c.funnel_stage}</Badge>}
                </td>
                <td className="p-4 hidden lg:table-cell text-white/50">{c.lead_score || 0}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="text-white/30 hover:text-red-400 h-8 w-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-white/30 text-sm">No contacts found</td>
              </tr>
            )}
          </tbody>
        </table>
      </GlassCard>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/60 text-xs">Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Source</Label>
              <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={2} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.opted_in_email} onCheckedChange={(v) => setForm({ ...form, opted_in_email: v })} />
                <Label className="text-xs text-white/50">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.opted_in_sms} onCheckedChange={(v) => setForm({ ...form, opted_in_sms: v })} />
                <Label className="text-xs text-white/50">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.opted_in_whatsapp} onCheckedChange={(v) => setForm({ ...form, opted_in_whatsapp: v })} />
                <Label className="text-xs text-white/50">WhatsApp</Label>
              </div>
            </div>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.full_name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
              Add Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}