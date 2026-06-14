import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Film, Sliders, Download, Sparkles, Loader2, Play, Mic, Save, CheckCircle2, ImageOff } from "lucide-react";
import { assembleVideo, VIDEO_RATIOS } from "@/utils/videoAssembler";
import { generateVoiceover, uploadFile } from "@/utils/aiClient";
import { loadProject, saveProject } from "@/utils/mediaProject";

const SUBTITLE_PRESETS = [
  { id: "bottom", label: "Dynamic Bottom (Bold)" },
  { id: "center", label: "Centered Headline" },
  { id: "none", label: "No Captions" },
];
const ACCENTS = ["#e040fb", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function VideoEditor() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [project, setProject] = useState(() => loadProject());
  const [ratio, setRatio] = useState(project?.ratio || "9:16");
  const [sceneSeconds, setSceneSeconds] = useState(3);
  const [subtitleStyle, setSubtitleStyle] = useState("bottom");
  const [accent, setAccent] = useState("#e040fb");
  const [withVoiceover, setWithVoiceover] = useState(true);

  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(project?.videoUrl || "");
  const [videoBlob, setVideoBlob] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => () => { videoUrl && videoUrl.startsWith("blob:") && URL.revokeObjectURL(videoUrl); }, []); // eslint-disable-line

  if (!project || !project.scenes?.length) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <ImageOff className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No project to edit</h2>
        <p className="text-muted-foreground text-sm mb-6">Create a script and scene visuals in Media Studio first, then come back to assemble your video.</p>
        <button onClick={() => navigate("/media-studio")} className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90">
          Go to Media Studio
        </button>
      </div>
    );
  }

  const usableScenes = project.scenes.filter((s) => s.imageUrl);

  const render = async () => {
    if (!usableScenes.length) { setError("No scene visuals available. Generate some in Media Studio."); return; }
    setError("");
    setRendering(true);
    setProgress(0);
    try {
      let audio = null;
      if (withVoiceover) {
        const narration = usableScenes.map((s) => s.text).join(". ");
        audio = await generateVoiceover(narration); // null is fine — renders silently
      }
      const { url, blob } = await assembleVideo({
        scenes: usableScenes,
        ratio,
        sceneSeconds,
        accent,
        subtitleStyle,
        logoUrl: "",
        audio,
        onProgress: setProgress,
      });
      setVideoUrl(url);
      setVideoBlob(blob);
      saveProject({ ...project, ratio, videoUrl: url });
    } catch (e) {
      setError(e?.message || "Render failed.");
    }
    setRendering(false);
  };

  const saveToLibrary = async () => {
    if (!videoBlob) return;
    setSaving(true);
    try {
      const file = new File([videoBlob], `${(project.title || "video").replace(/\s+/g, "_")}.webm`, { type: "video/webm" });
      let fileUrl = videoUrl;
      try { fileUrl = await uploadFile(file); } catch (_e) { /* fall back to local url */ }
      await base44.entities.ContentAsset.create({
        type: "video",
        title: project.title || "AI Video",
        file_url: fileUrl,
        platform: project.platform,
        ai_generated: true,
      });
      qc.invalidateQueries(["media_library"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError("Save failed: " + e.message); }
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Film className="w-6 h-6 text-fuchsia-400" /> Video Editor</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{project.title || "Untitled project"} · {usableScenes.length} scene{usableScenes.length !== 1 ? "s" : ""} ready</p>
        </div>
        {videoUrl && videoBlob && (
          <div className="flex gap-2">
            <a href={videoUrl} download={`${(project.title || "video").replace(/\s+/g, "_")}.webm`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/20">
              <Download className="w-4 h-4" /> Download
            </a>
            <button onClick={saveToLibrary} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved" : "Save to Library"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="lg:col-span-2 bg-neutral-950 rounded-2xl p-4 flex items-center justify-center min-h-[360px] border border-border">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="max-h-[60vh] w-auto rounded-lg bg-black" />
          ) : rendering ? (
            <div className="text-center w-full max-w-sm">
              <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-semibold mb-3">Rendering video… {Math.round(progress * 100)}%</p>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="text-center text-white/50">
              <Play className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Configure settings, then render your video.</p>
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border pb-2">
            <Sliders className="w-4 h-4 text-fuchsia-400" /> Render Settings
          </h3>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_RATIOS.map((r) => (
                <button key={r} onClick={() => setRatio(r)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${ratio === r ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Seconds per Scene · {sceneSeconds}s</label>
            <input type="range" min={2} max={6} step={1} value={sceneSeconds} onChange={(e) => setSceneSeconds(+e.target.value)} className="w-full accent-fuchsia-500" />
            <p className="text-[11px] text-muted-foreground mt-1">Total length ≈ {usableScenes.length * sceneSeconds}s</p>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Caption Style</label>
            <select value={subtitleStyle} onChange={(e) => setSubtitleStyle(e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
              {SUBTITLE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Accent Color</label>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button key={c} onClick={() => setAccent(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${accent === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={withVoiceover} onChange={(e) => setWithVoiceover(e.target.checked)} className="accent-fuchsia-500" />
            <Mic className="w-4 h-4 text-fuchsia-400" /> AI Voiceover narration
          </label>

          <button onClick={render} disabled={rendering || !usableScenes.length}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20">
            {rendering ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering…</> : <><Sparkles className="w-4 h-4" /> {videoUrl ? "Re-render Video" : "Render Video"}</>}
          </button>
        </div>
      </div>

      {/* Scene strip */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Timeline ({usableScenes.length} scenes)</h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {usableScenes.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <div className="aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <img src={s.imageUrl} alt={`Scene ${i + 1}`} className="w-full h-full object-cover" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
