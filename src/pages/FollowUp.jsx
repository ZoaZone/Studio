import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MailCheck, Plus, Trash2, Play, Pause, Clock, Mail, Phone, MessageSquare, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

const channelIcons = { email: Mail, sms: Phone, whatsapp: MessageSquare };
const triggers = ["new_lead", "form_submit", "link_click", "no_reply", "stage_change", "manual"];

export default function FollowUp() {
  const [showCreate, setShowCreate] = useState(false);
  const [showStep, setShowStep] = useState(false);
  const [selectedSeq, setSelectedSeq] = useState(null);
  const [seqForm, setSeqForm] = useState({ name: "", trigger: "new_lead", status: "draft" });
  const [stepForm, setStepForm] = useState({ delay_hours: 1, channel: "email", message_template: "" });
  const qc = useQueryClient();

  const { data: sequences = [] } = useQuery({
    queryKey: ["sequences"],
    queryFn: () => base44.entities.FollowUpSequence.list("-created_date", 50),
  });

  const { data: steps = [] } = useQuery({
    queryKey: ["follow-up-steps", selectedSeq?.id],
    queryFn: () => selectedSeq ? base44.entities.FollowUpStep.filter({ sequence_id: selectedSeq.id }, "step_order") : Promise.resolve([]),
    enabled: !!selectedSeq,
  });

  const createSeq = useMutation({
    mutationFn: (d) => base44.entities.FollowUpSequence.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sequences"] }); setShowCreate(false); },
  });

  const createStep = useMutation({
    mutationFn: (d) => base44.entities.FollowUpStep.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["follow-up-steps"] }); setShowStep(false); },
  });

  const deleteSeq = useMutation({
    mutationFn: (id) => base44.entities.FollowUpSequence.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sequences"] }); setSelectedSeq(null); },
  });

  const deleteStep = useMutation({
    mutationFn: (id) => base44.entities.FollowUpStep.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["follow-up-steps"] }),
  });

  const toggleStatus = async (seq) => {
    const newStatus = seq.status === "active" ? "paused" : "active";
    await base44.entities.FollowUpSequence.update(seq.id, { status: newStatus });
    qc.invalidateQueries({ queryKey: ["sequences"] });
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Follow Up" subtitle="Automated follow-up sequences" actions={
        <Button onClick={() => setShowCreate(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> New Sequence
        </Button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Sequences</h3>
          <div className="space-y-3">
            {sequences.length === 0 && <p className="text-xs text-white/30">No sequences yet</p>}
            {sequences.map(s => (
              <GlassCard key={s.id} onClick={() => setSelectedSeq(s)} className={selectedSeq?.id === s.id ? "border-magenta/30" : ""}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${s.status === "active" ? "text-emerald-400 border-emerald-400/20" : "text-white/40 border-white/10"}`}>{s.status}</Badge>
                      <span className="text-xs text-white/30">{s.trigger}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleStatus(s); }} className="h-7 w-7 text-white/30 hover:text-white">
                      {s.status === "active" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteSeq.mutate(s.id); }} className="h-7 w-7 text-white/30 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedSeq ? (
            <GlassCard className="text-center py-16">
              <MailCheck className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Select a sequence to view steps</p>
            </GlassCard>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">{selectedSeq.name} — Steps</h3>
                <Button size="sm" onClick={() => { setStepForm({ delay_hours: 1, channel: "email", message_template: "", step_order: steps.length }); setShowStep(true); }} className="gradient-magenta border-0 text-white hover:opacity-90 h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-3">
                {steps.length === 0 && <p className="text-xs text-white/30 text-center py-8">No steps. Add your first step.</p>}
                {steps.map((s, i) => {
                  const ChIcon = channelIcons[s.channel] || Mail;
                  return (
                    <React.Fragment key={s.id}>
                      <GlassCard className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-magenta/10 flex items-center justify-center">
                            <ChIcon className="w-4 h-4 text-magenta" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{s.channel} — Step {i + 1}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-white/30" />
                              <span className="text-xs text-white/40">Wait {s.delay_hours}h</span>
                            </div>
                            {s.message_template && <p className="text-xs text-white/30 mt-1 truncate max-w-[300px]">{s.message_template}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteStep.mutate(s.id)} className="h-7 w-7 text-white/30 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </GlassCard>
                      {i < steps.length - 1 && <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-white/20" /></div>}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>New Sequence</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Name</Label><Input value={seqForm.name} onChange={(e) => setSeqForm({ ...seqForm, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div>
              <Label className="text-white/60 text-xs">Trigger</Label>
              <Select value={seqForm.trigger} onValueChange={(v) => setSeqForm({ ...seqForm, trigger: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{triggers.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={() => createSeq.mutate(seqForm)} disabled={!seqForm.name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Create Sequence</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStep} onOpenChange={setShowStep}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Add Step</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/60 text-xs">Channel</Label>
                <Select value={stepForm.channel} onValueChange={(v) => setStepForm({ ...stepForm, channel: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Delay (hours)</Label>
                <Input type="number" value={stepForm.delay_hours} onChange={(e) => setStepForm({ ...stepForm, delay_hours: Number(e.target.value) })} className="bg-white/5 border-white/10 text-white mt-1" />
              </div>
            </div>
            <div><Label className="text-white/60 text-xs">Message Template</Label><Textarea value={stepForm.message_template} onChange={(e) => setStepForm({ ...stepForm, message_template: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} /></div>
            <Button onClick={() => createStep.mutate({ ...stepForm, sequence_id: selectedSeq.id })} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Add Step</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}