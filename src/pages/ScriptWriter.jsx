import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Sparkles, Wand2, Loader2, Copy, Check, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";

const scriptTypes = ["video_script", "ad_script", "email_sequence", "cold_outreach", "follow_up", "pitch"];
const tones = ["professional", "casual", "energetic", "empathetic", "authoritative", "playful"];

export default function ScriptWriter() {
  const [type, setType] = useState("video_script");
  const [platform, setPlatform] = useState("youtube");
  const [tone, setTone] = useState("professional");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(30);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const qc = useQueryClient();

  const { data: scripts = [] } = useQuery({
    queryKey: ["scripts"],
    queryFn: () => base44.entities.ScriptTemplate.list("-created_date", 50),
  });

  const saveMutation = useMutation({
    mutationFn: (d) => base44.entities.ScriptTemplate.create(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scripts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ScriptTemplate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scripts"] }),
  });

  const generate = async () => {
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a ${type.replace(/_/g, " ")} for ${platform}. Topic: ${topic}. Tone: ${tone}. Duration: ~${duration} seconds. Include scene directions if video. Be specific and actionable.`,
    });
    setResult(res);
    setLoading(false);
  };

  const saveScript = () => {
    saveMutation.mutate({ type, platform, title: topic.slice(0, 60), content: result, tone, duration_seconds: duration, ai_generated: true });
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Script Writer" subtitle="Generate scripts for video, ads, emails, outreach" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Generator */}
        <div className="lg:col-span-3 space-y-4">
          <GlassCard>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-magenta" /> Script Generator
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/60 text-xs">Script Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{scriptTypes.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{tones.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/60 text-xs">Platform</Label>
                  <Input value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Duration (seconds)</Label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="bg-white/5 border-white/10 text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Topic / Brief</Label>
                <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Describe what the script should cover..." className="bg-white/5 border-white/10 text-white mt-1" rows={3} />
              </div>
              <Button onClick={generate} disabled={!topic || loading} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Script</>}
              </Button>
            </div>
          </GlassCard>

          {result && (
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Result</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-xs h-7">
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={saveScript} className="text-xs h-7 text-magenta">Save</Button>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-sm text-white/70 leading-relaxed">{result}</div>
            </GlassCard>
          )}
        </div>

        {/* Saved Scripts */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-sm font-bold text-white mb-4">Saved Scripts</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {scripts.length === 0 && <p className="text-xs text-white/30 text-center py-4">No saved scripts</p>}
              {scripts.map(s => (
                <div key={s.id} className="p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-white truncate">{s.title}</p>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(s.id)} className="h-6 w-6 text-white/30 hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{s.type?.replace(/_/g, " ")}</Badge>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-white/40">{s.tone}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}