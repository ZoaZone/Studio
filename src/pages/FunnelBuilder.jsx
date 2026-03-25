import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { GitBranch, Plus, Trash2, ArrowDown, Mail, MessageSquare, Phone, Clock, Tag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

const actionIcons = { email: Mail, sms: Phone, whatsapp: MessageSquare, wait: Clock, tag: Tag, move_stage: ArrowRight };

export default function FunnelBuilder() {
  const [showCreate, setShowCreate] = useState(false);
  const [showStage, setShowStage] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState(null);
  const [funnelForm, setFunnelForm] = useState({ name: "", description: "", status: "draft" });
  const [stageForm, setStageForm] = useState({ name: "", action_type: "email", stage_order: 0 });
  const qc = useQueryClient();

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels"],
    queryFn: () => base44.entities.Funnel.list("-created_date", 50),
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["funnel-stages", selectedFunnel?.id],
    queryFn: () => selectedFunnel ? base44.entities.FunnelStage.filter({ funnel_id: selectedFunnel.id }, "stage_order") : Promise.resolve([]),
    enabled: !!selectedFunnel,
  });

  const createFunnel = useMutation({
    mutationFn: (d) => base44.entities.Funnel.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnels"] }); setShowCreate(false); },
  });

  const createStage = useMutation({
    mutationFn: (d) => base44.entities.FunnelStage.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnel-stages"] }); setShowStage(false); },
  });

  const deleteFunnel = useMutation({
    mutationFn: (id) => base44.entities.Funnel.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["funnels"] }); setSelectedFunnel(null); },
  });

  const deleteStage = useMutation({
    mutationFn: (id) => base44.entities.FunnelStage.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["funnel-stages"] }),
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Funnel Builder" subtitle="Create visual funnels with automated actions" actions={
        <Button onClick={() => setShowCreate(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> New Funnel
        </Button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel List */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Funnels</h3>
          <div className="space-y-3">
            {funnels.length === 0 && <p className="text-xs text-white/30">No funnels yet</p>}
            {funnels.map(f => (
              <GlassCard key={f.id} onClick={() => setSelectedFunnel(f)} className={selectedFunnel?.id === f.id ? "border-magenta/30" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{f.name}</p>
                    <Badge variant="outline" className="text-xs border-white/10 text-white/40 mt-1">{f.status}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteFunnel.mutate(f.id); }} className="h-7 w-7 text-white/30 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-white/40">
                  <span>{f.total_leads || 0} leads</span>
                  <span>{f.conversion_rate || 0}% conv.</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Stages Visual */}
        <div className="lg:col-span-2">
          {!selectedFunnel ? (
            <GlassCard className="text-center py-16">
              <GitBranch className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Select a funnel to view stages</p>
            </GlassCard>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{selectedFunnel.name} — Stages</h3>
                <Button size="sm" onClick={() => { setStageForm({ name: "", action_type: "email", stage_order: stages.length }); setShowStage(true); }} className="gradient-magenta border-0 text-white hover:opacity-90 h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Stage
                </Button>
              </div>
              <div className="space-y-3">
                {stages.length === 0 && <p className="text-xs text-white/30 text-center py-8">No stages. Add your first stage.</p>}
                {stages.map((s, i) => {
                  const ActionIcon = actionIcons[s.action_type] || Mail;
                  return (
                    <React.Fragment key={s.id}>
                      <GlassCard className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-magenta/10 flex items-center justify-center text-sm font-bold text-magenta">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{s.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <ActionIcon className="w-3 h-3 text-white/40" />
                              <span className="text-xs text-white/40">{s.action_type}</span>
                              <span className="text-xs text-white/30">• {s.entry_count || 0} entered</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteStage.mutate(s.id)} className="h-7 w-7 text-white/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </GlassCard>
                      {i < stages.length - 1 && (
                        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-white/20" /></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Funnel Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>New Funnel</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Name</Label><Input value={funnelForm.name} onChange={(e) => setFunnelForm({ ...funnelForm, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Description</Label><Textarea value={funnelForm.description} onChange={(e) => setFunnelForm({ ...funnelForm, description: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={2} /></div>
            <Button onClick={() => createFunnel.mutate(funnelForm)} disabled={!funnelForm.name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Create Funnel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stage Dialog */}
      <Dialog open={showStage} onOpenChange={setShowStage}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Add Stage</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Stage Name</Label><Input value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div>
              <Label className="text-white/60 text-xs">Action Type</Label>
              <Select value={stageForm.action_type} onValueChange={(v) => setStageForm({ ...stageForm, action_type: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(actionIcons).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => createStage.mutate({ ...stageForm, funnel_id: selectedFunnel.id, client_id: selectedFunnel.client_id })} disabled={!stageForm.name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Add Stage</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}