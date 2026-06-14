import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FileText, Megaphone, Hash, MessageSquare, Wand2, Loader2, Copy, Save, CheckCircle2, Film, ArrowRight, Sparkles } from "lucide-react";
import { generateText, splitScriptIntoScenes } from "@/utils/aiClient";
import { loadProject, saveProject, emptyProject } from "@/utils/mediaProject";

const OUTPUTS = [
  { id: "video_script", label: "Video Script", Icon: FileText, type: "video_script" },
  { id: "ad_copy", label: "Ad Copy", Icon: Megaphone, type: "ad_copy" },
  { id: "caption", label: "Social Caption", Icon: MessageSquare, type: "caption" },
  { id: "hashtag_set", label: "Hashtags", Icon: Hash, type: "hashtag_set" },
];
const TONES = ["Professional", "Bold & Edgy", "Luxury", "Playful", "Urgent", "Educational", "Inspirational"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Twitter/X"];

export default function ScriptWriter() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [project, setProject] = useState(() => loadProject() || emptyProject());
  const [topic, setTopic] = useState(project.vision || "");
  const [tone, setTone] = useState(project.tone || "Professional");
  const [platform, setPlatform] = useState(project.platform || "Instagram");
  const [active, setActive] = useState("video_script");
  const [outputs, setOutputs] = useState({});
  const [loading, setLoading] = useState(null);
  const [copied, setCopied] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { if (project.script) setOutputs((o) => ({ ...o, video_script: project.script })); }, []); // eslint-disable-line

  const generate = async (out) => {
    if (!topic.trim()) { setError("Enter a topic or brief first."); return; }
    setError("");
    setLoading(out.id);
    try {
      const promptMap = {
        video_script: `Write a ${platform} video script (4 scenes, label each "SCENE n:" with 1-2 short narration lines, end with a CTA) about: ${topic}. Tone: ${tone}.`,
        ad_copy: `Write high-converting ${platform} ad copy for: ${topic}. Tone: ${tone}. Format as HEADLINE / BODY / CTA.`,
        caption: `Write an engaging ${platform} caption with a hook, 2-3 sentences, a CTA and 5 emojis for: ${topic}. Tone: ${tone}.`,
        hashtag_set: `List 20 high-reach, relevant ${platform} hashtags (space separated, each starting with #) for: ${topic}.`,
      };
      const text = await generateText({ type: out.type, prompt: promptMap[out.id], platform, tone });
      setOutputs((o) => ({ ...o, [out.id]: text }));

      // If it's a script, sync scenes into the shared project for the Video Editor
      if (out.id === "video_script") {
        const existing = project.scenes || [];
        const scenes = splitScriptIntoScenes(text, 4).map((s, i) => ({ ...s, imageUrl: existing[i]?.imageUrl || "" }));
        const next = saveProject({ ...project, vision: topic, tone, platform, script: text, scenes });
        setProject(next);
      }
    } catch (e) {
      setError("Generation failed: " + (e?.message || "unknown error"));
    }
    setLoading(null);
  };

  const copy = async (id) => {
    await navigator.clipboard.writeText(outputs[id] || "");
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const saveAsset = async (out) => {
    if (!outputs[out.id]) return;
    try {
      await base44.entities.ContentAsset.create({
        type: out.type,
        title: `${out.label} · ${topic.slice(0, 40)}`,
        content: outputs[out.id],
        platform,
        ai_generated: true,
      });
      qc.invalidateQueries(["media_library"]);
      setSavedId(out.id);
      setTimeout(() => setSavedId(null), 1500);
    } catch (e) { setError("Save failed: " + e.message); }
  };

  const activeOut = OUTPUTS.find((o) => o.id === active);
  const hasScript = !!outputs.video_script;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><FileText className="w-6 h-6 text-fuchsia-400" /> Script Writer</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate scripts, ad copy, captions and hashtags — then send a script straight to the Video Editor.</p>
        </div>
        {hasScript && (
          <button onClick={() => navigate("/video-editor")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 shadow-lg shadow-fuchsia-500/20">
            <Film className="w-4 h-4" /> To Video Editor <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Config */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Brief</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Topic / Brief *</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={5}
              placeholder="e.g. Launching a new line of organic skincare for busy professionals…"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {OUTPUTS.map((out) => (
              <button key={out.id} onClick={() => { setActive(out.id); generate(out); }} disabled={loading === out.id || !topic.trim()}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-medium hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 disabled:opacity-60 transition-all">
                {loading === out.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <out.Icon className="w-3.5 h-3.5 text-fuchsia-400" />}
                {out.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">{activeOut && <activeOut.Icon className="w-4 h-4 text-fuchsia-400" />}{activeOut?.label}</h3>
            {outputs[active] && (
              <div className="flex gap-2">
                <button onClick={() => copy(active)} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 ${copied === active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                  {copied === active ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied === active ? "Copied" : "Copy"}
                </button>
                <button onClick={() => saveAsset(activeOut)} className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 ${savedId === active ? "bg-emerald-500/10 text-emerald-400" : "bg-fuchsia-500/10 text-fuchsia-400"}`}>
                  {savedId === active ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}{savedId === active ? "Saved" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Output tab switcher */}
          <div className="flex gap-1 flex-wrap">
            {OUTPUTS.filter((o) => outputs[o.id]).map((o) => (
              <button key={o.id} onClick={() => setActive(o.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${active === o.id ? "bg-fuchsia-500/15 text-fuchsia-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {o.label}
              </button>
            ))}
          </div>

          {loading === active ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-fuchsia-400 mb-2" /><p className="text-sm">Generating…</p>
            </div>
          ) : outputs[active] ? (
            <textarea value={outputs[active]} onChange={(e) => setOutputs((o) => ({ ...o, [active]: e.target.value }))}
              className="w-full h-64 bg-muted/20 rounded-xl p-3 text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-sm">Pick an output type to generate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
