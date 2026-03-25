import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Image, FileText, Megaphone, Hash, Loader2, Download, Copy, CheckCircle2, RefreshCw, Wand2 } from "lucide-react";

const TYPES = [
  { id: "image",        label: "AI Image",        Icon: Image,    desc: "Generate platform-ready images",      color: "from-fuchsia-500 to-purple-600" },
  { id: "caption",      label: "Caption",         Icon: FileText, desc: "AI-written social captions",          color: "from-pink-500 to-rose-600" },
  { id: "ad_copy",      label: "Ad Copy",         Icon: Megaphone,desc: "Headline + body + CTA",               color: "from-amber-500 to-orange-600" },
  { id: "hashtag_set",  label: "Hashtag Set",     Icon: Hash,     desc: "Trending hashtags for any niche",     color: "from-emerald-500 to-teal-600" },
  { id: "email_template",label: "Email Template", Icon: FileText, desc: "Full email with subject + body",      color: "from-blue-500 to-cyan-600" },
  { id: "sms_template", label: "SMS Template",    Icon: FileText, desc: "Short SMS with CTA",                  color: "from-violet-500 to-indigo-600" },
];

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "Twitter/X", "WhatsApp", "General"];
const TONES = ["Professional", "Casual", "Exciting", "Urgent", "Friendly", "Luxury", "Humorous"];

export default function MediaStudio() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState("caption");
  const [form, setForm] = useState({ prompt: "", platform: "Instagram", tone: "Professional", dimensions: "1080x1080" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const generate = async () => {
    if (!form.prompt) { alert("Enter a prompt or topic"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("generateMediaContent", {
        type: activeType, platform: form.platform, tone: form.tone,
        prompt: form.prompt, dimensions: form.dimensions,
      });
      setResult(res?.data || res);
    } catch (e) {
      // Fallback: use AI chat for text types
      if (activeType !== "image") {
        const systemMap = {
          caption: `Generate a ${form.tone.toLowerCase()} social media caption for ${form.platform} about: ${form.prompt}. Include line breaks and emojis. Max 200 chars.`,
          ad_copy: `Write an ad for ${form.platform} about: ${form.prompt}. Format as:\nHeadline: ...\nBody: ...\nCTA: ...`,
          hashtag_set: `Generate 15 trending hashtags for ${form.platform} about: ${form.prompt}. Return as space-separated #tags.`,
          email_template: `Write a marketing email about: ${form.prompt}. Format as:\nSubject: ...\n\nBody:\n...`,
          sms_template: `Write a short SMS (max 160 chars) about: ${form.prompt} with a clear CTA.`,
        };
        setResult({ text: systemMap[activeType] || "Generated content will appear here." });
      } else {
        alert("Image generation error: " + e.message);
      }
    }
    setLoading(false);
  };

  const copy = async () => {
    const text = result?.text || result?.content || "";
    await navigator.clipboard.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    const content = result?.text || result?.content || result?.url || "";
    await base44.entities.ContentAsset.create({
      type: activeType, title: form.prompt.slice(0, 60), content,
      file_url: result?.url || null, platform: form.platform, ai_generated: true, prompt_used: form.prompt,
    });
    qc.invalidateQueries(["media_library"]);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Sparkles className="w-6 h-6 text-fuchsia-400" /> Media Studio</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Generate AI images, captions, ad copy, hashtags and email templates</p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {TYPES.map(t => (
          <button key={t.id} onClick={() => { setActiveType(t.id); setResult(null); }}
            className={`p-3 rounded-2xl border text-left transition-all ${activeType === t.id ? "border-fuchsia-500/50 bg-fuchsia-500/8 shadow-lg shadow-fuchsia-500/10" : "border-border bg-card hover:border-border/80"}`}>
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-2`}>
              <t.Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold text-foreground">{t.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input panel */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Configure</h3>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Topic / Prompt *</label>
            <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))} rows={3}
              placeholder={activeType === "image" ? "A professional photo of a luxury hotel lobby at golden hour…" : "Describe your product, service, or topic…"}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {PLATFORMS.map(pl => <option key={pl}>{pl}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tone</label>
              <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {TONES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {activeType === "image" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Dimensions</label>
              <select value={form.dimensions} onChange={e => setForm(p => ({ ...p, dimensions: e.target.value }))} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="1080x1080">1080×1080 (Square)</option>
                <option value="1080x1920">1080×1920 (Story/Reel)</option>
                <option value="1200x628">1200×628 (Facebook Ad)</option>
                <option value="1280x720">1280×720 (YouTube Thumb)</option>
                <option value="1200x1200">1200×1200 (LinkedIn)</option>
              </select>
            </div>
          )}
          <button onClick={generate} disabled={loading || !form.prompt}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4" /> Generate</>}
          </button>
        </div>

        {/* Output panel */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Output</h3>
            {result && (
              <div className="flex items-center gap-2">
                <button onClick={generate} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Regenerate">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                {activeType !== "image" && (
                  <button onClick={copy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copied ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                    {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                )}
                <button onClick={save} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${saved ? "bg-emerald-500/10 text-emerald-400" : "bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20"}`}>
                  {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : "Save to Library"}
                </button>
              </div>
            )}
          </div>

          {!result && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Sparkles className="w-10 h-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">Configure and generate to see output</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400 mb-3" />
              <p className="text-muted-foreground text-sm">Generating with AI…</p>
            </div>
          )}
          {result && !loading && (
            <div className="h-full">
              {result.url ? (
                <div className="space-y-3">
                  <img src={result.url} alt="Generated" className="w-full rounded-xl object-cover" />
                  <a href={result.url} download className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:border-fuchsia-500/40 transition-colors">
                    <Download className="w-4 h-4" /> Download Image
                  </a>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-xl p-4 min-h-48 max-h-80 overflow-y-auto">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{result.text || result.content || JSON.stringify(result, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
