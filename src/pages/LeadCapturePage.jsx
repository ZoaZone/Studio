import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { UserPlus, Plus, Search, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { format } from "date-fns";

export default function LeadCapturePage() {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", source: "manual", captured_at: new Date().toISOString() });
  const qc = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.LeadCapture.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.LeadCapture.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); setShowAdd(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadCapture.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.full_name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase());
    const matchSource = sourceFilter === "all" || l.source === sourceFilter;
    return matchSearch && matchSource;
  });

  const exportCSV = () => {
    const csv = ["Name,Email,Phone,Source,Date"].concat(
      filtered.map(l => `"${l.full_name || ""}","${l.email || ""}","${l.phone || ""}","${l.source || ""}","${l.captured_at || l.created_date || ""}"`)
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Lead Capture" subtitle={`${leads.length} leads captured`} actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="border-white/10 text-white/70 hover:text-white bg-transparent hover:bg-white/5">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> Add Lead
          </Button>
        </div>
      } />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="social">Social</SelectItem>
            <SelectItem value="ad">Ad</SelectItem>
            <SelectItem value="qr_code">QR Code</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">Name</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4">Email</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden md:table-cell">Phone</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden md:table-cell">Source</th>
              <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-4 hidden lg:table-cell">Date</th>
              <th className="text-right p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="border-b border-white/3 hover:bg-white/3">
                <td className="p-4 font-medium text-white">{l.full_name}</td>
                <td className="p-4 text-white/50">{l.email || "—"}</td>
                <td className="p-4 text-white/50 hidden md:table-cell">{l.phone || "—"}</td>
                <td className="p-4 hidden md:table-cell"><Badge variant="outline" className="text-xs border-white/10 text-white/40">{l.source}</Badge></td>
                <td className="p-4 text-white/40 text-xs hidden lg:table-cell">{l.captured_at ? format(new Date(l.captured_at), "MMM d, yyyy") : "—"}</td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(l.id)} className="h-7 w-7 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-white/30">No leads found</td></tr>}
          </tbody>
        </table>
      </GlassCard>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Add Lead</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
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
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.full_name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Capture Lead</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}