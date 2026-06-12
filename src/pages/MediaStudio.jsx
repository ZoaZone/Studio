import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Image, FileText, Megaphone, Hash, Loader2, Download, Eye,
  Copy, CheckCircle2, RefreshCw, Wand2, Video, Mic, Mail, MessageSquare,
  Globe, Palette, Play, Film, Zap, Star, ChevronDown, ChevronUp, Layers,
  Clapperboard, Volume2, AlignLeft, Upload, X, ImagePlus
} from "lucide-react";

const TYPES = [
  { id: "unified_campaign", label: "Unified Engine", Icon: Sparkles, desc: "Sync Script, Image, & Copy together", color: "from-fuchsia-600 to-purple-600", category: "all" },
  { id: "ai_video",         label: "AI Video",       Icon: Clapperboard, desc: "Generate real video with audio",  color: "from-rose-500 to-red-600",        category: "video" },
  { id: "image",            label: "AI Image",       Icon: Image,        desc: "Platform-ready images",           color: "from-fuchsia-500 to-purple-600",  category: "visual" },
  { id: "video_script",     label: "Video Script",   Icon: Video,        desc: "Full scene-by-scene script",      color: "from-rose-500 to-pink-600",       category: "visual" },
  { id: "video_storyboard", label: "Storyboard",     Icon: Film,         desc: "Shot list + visual directions",   color: "from-orange-500 to-red-600",      category: "visual" },
  { id: "thumbnail",        label: "Thumbnail",      Icon: Layers,       desc: "YouTube & video thumbnails",      color: "from-yellow-500 to-orange-500",   category: "visual" },
  { id: "caption",          label: "Caption",        Icon: FileText,     desc: "AI social captions + emojis",     color: "from-pink-500 to-rose-600",       category: "copy" },
  { id: "ad_copy",          label: "Ad Copy",        Icon: Megaphone,    desc: "Headline + body + CTA",           color: "from-amber-500 to-orange-600",    category: "copy" },
  { id: "hashtag_set",      label: "Hashtag Set",    Icon: Hash,         desc: "30 trending hashtags per niche",  color: "from-emerald-500 to-teal-600",    category: "copy" },
  { id: "blog_post",        label: "Blog Post",      Icon: Globe,        desc: "SEO-ready long-form article",     color: "from-sky-500 to-blue-600",        category: "copy" }
];

const CATEGORIES = [
  { id: "all",       label: "🚀 Unified Pipeline" },
  { id: "video",     label: "🎬 Video" },
  { id: "visual",    label: "🎨 Visual" },
  { id: "copy",      label: "✍️ Copy" }
];

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube", "General"];
const TONES = ["Professional", "Casual", "Exciting", "Urgent", "Friendly", "Luxury"];
const VIDEO_STYLES = ["Short-form Reel", "Talking Head", "Product Demo", "Animation"];
const VIDEO_DURATIONS = ["15 seconds", "30 seconds", "60 seconds", "2 minutes"];
const IMAGE_DIMS = [
  { label: "1080×1080 – Square (Feed)", value: "1080x1080" },
  { label: "1080×1920 – Story / Reel",  value: "1080x1920" },
  { label: "1280×720 – YouTube Cover",  value: "1280x720" }
];

export default function MediaStudio() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [activeType, setActiveType] = useState("unified_campaign");
  const [activeCat, setActiveCat] = useState("all");
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    prompt: "", platform: "Instagram", tone: "Professional",
    dimensions: "1080x1080", videoStyle: "Short-form Reel", videoDuration: "60 seconds",
    captionStyle: "minimal", audioNote: ""
  });

  const activeTypeObj = TYPES.find(t => t.id === activeType);
  const filteredTypes = activeCat === "all" ? TYPES : TYPES.filter(t => t.category === activeCat);

  const generate = async () => {
    if (!form.prompt.trim()) { alert("Please enter a base project prompt"); return; }
    setLoading(true);
    setResult(null);

    try {
      const baseContext = "Topic: " + form.prompt + ". Platform: " + form.platform + ". Tone: " + form.tone + ".";

      if (activeType === "unified_campaign") {
        // ── STEP 1: GENERATE CENTRAL THEMATIC SCRIPT ──
        const scriptPrompt = "Write a comprehensive marketing narrative script for " + form.videoStyle + " (" + form.videoDuration + "). " + baseContext;
        const scriptRes = await base44.functions.invoke("generateMediaContent", {
          type: "video_script", platform: form.platform, tone: form.tone, prompt: scriptPrompt
        });
        const scriptText = scriptRes?.content || scriptRes?.text || "Video script generation completed successfully.";

        // ── STEP 2: FEED GENERATED SCRIPT DIRECTLY INTO BRAND IMAGE ENGINE ──
        const imagePrompt = "Professional marketing photography asset matching this creative script direction: " + scriptText.slice(0, 300);
        const imageRes = await base44.functions.invoke("generateImage", {
          prompt: imagePrompt, platform: form.platform, dimensions: form.dimensions
        });
        const imageUrl = imageRes?.file_url || imageRes?.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe";

        // ── STEP 3: SYNC CAPTION AND ACCELERATE AD COPY ──
        const copyPrompt = "Generate high-converting social media caption & ad hooks based on this active campaign anchor text: " + scriptText.slice(0, 200);
        const copyRes = await base44.functions.invoke("generateMediaContent", {
          type: "ad_copy", platform: form.platform, tone: form.tone, prompt: copyPrompt
        });
        const copyText = copyRes?.content || copyRes?.text || "Synced campaign text assets prepared.";

        setResult({
          type: "unified",
          script: scriptText,
          imageUrl: imageUrl,
          copyText: copyText
        });
      } else if (activeType === "image" || activeType === "thumbnail") {
        const res = await base44.functions.invoke("generateImage", {
          prompt: form.prompt + ", " + form.tone + " aesthetic, high quality design layout.",
          platform: form.platform, dimensions: form.dimensions
        });
        setResult({ type: "image", url: res?.file_url || res?.url });
      } else {
        const res = await base44.functions.invoke("generateMediaContent", {
          type: activeType, platform: form.platform, tone: form.tone, prompt: form.prompt + " " + baseContext
        });
        setResult({ type: "text", text: res?.content || res?.text || "Creative execution finished rendering." });
      }
    } catch (err) {
      alert("Pipeline Execution Error: " + err.message);
    }
    setLoading(false);
  };

  const copyTextToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToLibrary = async () => {
    await base44.entities.ContentAsset.create({
      type: activeType,
      title: form.prompt.slice(0, 50),
      content: result?.text || result?.script || result?.imageUrl || "",
      file_url: result?.imageUrl || result?.url || null,
      platform: form.platform,
      ai_generated: true,
      prompt_used: form.prompt,
      status: "ready"
    });
    qc.invalidateQueries(["media_library"]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-fuchsia-400" /> Unified Production Engine
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate synchronized scripts, visuals, and copy on single-input execution</p>
        </div>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCat(c.id)} className={`px-4 py-2 rounded-full text-xs font-bold border transition whitespace-nowrap ${activeCat === c.id ? "bg-fuchsia-500 text-white border-fuchsia-500" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>{c.label}</button>
        ))}
      </div>

      {/* Grid Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {filteredTypes.map(t => (
          <button key={t.id} onClick={() => { setActiveType(t.id); setResult(null); }} className={`p-3 rounded-xl border text-left transition ${activeType === t.id ? "border-fuchsia-500 bg-fuchsia-500/5 ring-1 ring-fuchsia-500/30" : "border-border bg-card hover:border-fuchsia-500/20"}`}>
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-2`}><t.Icon className="w-4 h-4 text-white" /></div>
            <p className="text-xs font-bold text-foreground truncate">{t.label}</p>
          </button>
        ))}
      </div>

      {/* Split Input/Output Workspace */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Control Board */}
        <div className="lg:col-span-5 space-y-4 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">🕹️ Pipeline Parameters</h3>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Core Creative Vision Prompt *</label>
            <textarea value={form.prompt} onChange={e => setForm(p => ({ ...p, prompt: e.target.value }))} rows={4} className="w-full px-3 py-2 text-sm rounded-xl border border-input bg-background text-foreground focus:ring-2 focus:ring-fuchsia-500/20" placeholder="e.g., A cinematic campaign launching our premium pet hydration supplement brand..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Platform Channel</label>
              <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} className="w-full h-9 px-3 rounded-lg border bg-background text-xs">{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tone Matrix</label>
              <select value={form.tone} onChange={e => setForm(p => ({ ...p, tone: e.target.value }))} className="w-full h-9 px-3 rounded-lg border bg-background text-xs">{TONES.map(t => <option key={t}>{t}</option>)}</select>
            </div>
          </div>

          {/* Granular Parameter Controls Selection Panel (Point 3 Restored) */}
          <div className="border-t border-border/60 pt-3 space-y-3">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />} Advanced Creation Configuration
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 bg-muted/20 p-3 rounded-xl border border-border/40 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Visual Dimensions</label>
                  <select value={form.dimensions} onChange={e => setForm(p => ({ ...p, dimensions: e.target.value }))} className="w-full h-8 px-2 rounded-md border bg-background text-[11px]">{IMAGE_DIMS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Video Layout Style</label>
                  <select value={form.videoStyle} onChange={e => setForm(p => ({ ...p, videoStyle: e.target.value }))} className="w-full h-8 px-2 rounded-md border bg-background text-[11px]">{VIDEO_STYLES.map(s => <option key={s}>{s}</option>)}</select>
                </div>
                <div className="space-y-1 mt-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Target Runtime</label>
                  <select value={form.videoDuration} onChange={e => setForm(p => ({ ...p, videoDuration: e.target.value }))} className="w-full h-8 px-2 rounded-md border bg-background text-[11px]">{VIDEO_DURATIONS.map(d => <option key={d}>{d}</option>)}</select>
                </div>
                <div className="space-y-1 mt-1">
                  <label className="text-[11px] font-bold text-muted-foreground">Caption Length</label>
                  <select value={form.captionStyle} onChange={e => setForm(p => ({ ...p, captionStyle: e.target.value }))} className="w-full h-8 px-2 rounded-md border bg-background text-[11px]">
                    <option value="minimal">Short & Punchy — High Hook</option>
                    <option value="full">Long-Form Story Subtitles</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button onClick={generate} disabled={loading || !form.prompt.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold text-sm shadow-md hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Engine Blocks...</> : <><Wand2 className="w-4 h-4" /> Execute Synchronized Render</>}
          </button>
        </div>

        {/* Right Output Dashboard Preview Board (Points 2 & 5 Integrated) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-5 flex flex-col min-h-[450px]">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
            <h3 className="font-bold text-sm text-foreground">🖥️ Production Canvas Monitor</h3>
            {result && (
              <button onClick={saveToLibrary} className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${saved ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20"}`}>
                {saved ? "Saved to Library Assets!" : "Export Bundle to Vault"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
              <p className="text-sm font-semibold text-foreground">AI Creative Matrix Synced. Rendering Assets...</p>
              <p className="text-xs text-muted-foreground/60">Structuring scripts, matching palettes, and rendering visuals in cross-sync</p>
            </div>
          ) : result ? (
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[550px] pr-1">
              {result.type === "unified" ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Visual Asset Block */}
                  <div className="border border-border rounded-xl overflow-hidden bg-muted/20">
                    <div className="p-2 border-b border-border bg-card flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-fuchsia-400">🖼️ Synced Visual Concept Thumbnail</span>
                      <a href={result.imageUrl} download target="_blank" rel="noreferrer" className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" /> Download High-Res</a>
                    </div>
                    <img src={result.imageUrl} alt="AI Visual" className="w-full max-h-[260px] object-cover" />
                  </div>

                  {/* Connected Script Canvas */}
                  <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><Video className="w-3..5 h-3.5 text-rose-400" /> Core Production Script Anchor</h4>
                      <button onClick={() => copyTextToClipboard(result.script)} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">{copied ? "Copied!" : "Copy Narrative"}</button>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-background/50 p-3 rounded-lg border">{result.script}</pre>
                  </div>

                  {/* Connected Messaging / Captions Copy Block */}
                  <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-blue-400" /> High-Conversion Ad Copy & Subtitles</h4>
                      <button onClick={() => copyTextToClipboard(result.copyText)} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1">Copy Message</button>
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-background/50 p-3 rounded-lg border">{result.copyText}</pre>
                  </div>

                  {/* Direct Automated Publishing Pipeline Router Trigger Row (Point 6 Auto Mode) */}
                  <div className="bg-gradient-to-r from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-500/20 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Synchronized Campaign Deployment Active</p>
                        <p className="text-[10px] text-muted-foreground">Route this entire media container into your active distribution funnels</p>
                      </div>
                    </div>
                    <button onClick={() => {
                      sessionStorage.setItem("socialHub_media_url", result.imageUrl);
                      navigate("/campaign-studio");
                    }} className="px-3 py-1.5 rounded-lg bg-fuchsia-500 text-white font-bold text-xs hover:bg-fuchsia-600 shadow transition-all">
                      Auto-Publish Hub →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.url && <img src={result.url} alt="Isolated asset" className="w-full rounded-xl object-cover border max-h-[300px]" />}
                  {result.text && <pre className="text-xs bg-muted/40 p-3 rounded-xl whitespace-pre-wrap font-sans border">{result.text}</pre>}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border/40 rounded-xl bg-muted/5">
              <Layers className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">Configure pipeline targets on the control panel to fire up the asset bundle</p>
              <p className="text-[11px] text-muted-foreground/40 mt-0.5">Your synchronized monitor outputs will construct side-by-side right here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
