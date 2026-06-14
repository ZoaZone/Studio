import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Wand2, Loader2, Image as ImageIcon, FileText, Film, ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { generateText, generateImage } from "@/utils/aiClient";
import { splitScriptIntoScenes } from "@/utils/aiClient";
import { loadProject, saveProject, emptyProject } from "@/utils/mediaProject";

const TONES = ["Professional", "Bold & Edgy", "Luxury", "Playful", "Urgent", "Educational", "Inspirational"];
const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn"];
const RATIOS = ["9:16", "16:9", "1:1", "4:5"];

export default function MediaStudio() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [project, setProject] = useState(() => loadProject() || emptyProject());
  const [scriptLoading, setScriptLoading] = useState(false);
  const [imgLoadingIdx, setImgLoadingIdx] = useState(null);
  const [allImgLoading, setAllImgLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { saveProject(project); }, [project]);

  const update = (patch) => setProject((p) => ({ ...p, ...patch }));

  const generateScript = async () => {
    if (!project.vision.trim()) { setError("Describe your creative vision first."); return; }
    setError("");
    setScriptLoading(true);
    try {
      const prompt = `Write a punchy ${project.platform} video script for a ${project.ratio} format video.
Brand vision: ${project.vision}
Tone: ${project.tone}.
Break it into 4 short scenes. For each, label it "SCENE n:" followed by 1-2 sentences of on-screen narration/caption text. Keep each scene under 20 words. End with a strong call to action.`;
      const text = await generateText({ type: "video_script", prompt, platform: project.platform, tone: project.tone });
      const scenes = splitScriptIntoScenes(text, 4).map((s) => ({ ...s, imageUrl: "" }));
      update({ script: text, scenes });
    } catch (e) {
      setError("Script generation failed: " + (e?.message || "unknown error"));
    }
    setScriptLoading(false);
  };

  const genSceneImage = async (idx) => {
    setImgLoadingIdx(idx);
    try {
      const scene = project.scenes[idx];
      const url = await generateImage({
        prompt: `Professional ${project.tone.toLowerCase()} marketing visual for ${project.platform}: ${scene.imagePrompt || scene.text}. Cinematic, high detail, no text overlay.`,
        platform: project.platform,
      });
      if (url) {
        const scenes = project.scenes.slice();
        scenes[idx] = { ...scenes[idx], imageUrl: url };
        update({ scenes });
      } else {
        setError("Image generation returned no result for scene " + (idx + 1));
      }
    } catch (e) {
      setError("Image generation failed: " + (e?.message || "unknown error"));
    }
    setImgLoadingIdx(null);
  };

  const genAllImages = async () => {
    setAllImgLoading(true);
    setError("");
    const scenes = project.scenes.slice();
    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].imageUrl) continue;
      try {
        const url = await generateImage({
          prompt: `Professional ${project.tone.toLowerCase()} marketing visual for ${project.platform}: ${scenes[i].imagePrompt || scenes[i].text}. Cinematic, high detail, no text overlay.`,
          platform: project.platform,
        });
        if (url) { scenes[i] = { ...scenes[i], imageUrl: url }; update({ scenes: scenes.slice() }); }
      } catch (_e) { /* keep going */ }
    }
    setAllImgLoading(false);
  };

  const saveToLibrary = async () => {
    try {
      await base44.entities.ContentAsset.create({
        type: "script",
        title: project.title || `${project.platform} script`,
        content: project.script,
        platform: project.platform,
        ai_generated: true,
      });
      qc.invalidateQueries(["media_library"]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError("Save failed: " + e.message); }
  };

  const sceneCount = project.scenes.length;
  const readyImages = project.scenes.filter((s) => s.imageUrl).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-fuchsia-400" /> Media Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Turn a brand vision into an AI script, scene visuals, and a ready-to-render video.</p>
        </div>
        {project.script && (
          <button onClick={saveToLibrary} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted/20">
            {saved ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved" : "Save Script"}
          </button>
        )}
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Brief */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Project Title</label>
            <input value={project.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. Summer Launch Reel"
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Platform</label>
            <select value={project.platform} onChange={(e) => update({ platform: e.target.value })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
            <select value={project.ratio} onChange={(e) => update({ ratio: e.target.value })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
              {RATIOS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Tone</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => update({ tone: t })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${project.tone === t ? "bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Creative Vision</label>
          <textarea value={project.vision} onChange={(e) => update({ vision: e.target.value })} rows={4}
            placeholder="Describe your product, audience, and the feeling you want to create…"
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>
        <button onClick={generateScript} disabled={scriptLoading || !project.vision.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20">
          {scriptLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Writing script…</> : <><Wand2 className="w-4 h-4" /> Generate Script & Scenes</>}
        </button>
      </div>

      {/* Scenes */}
      {sceneCount > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><FileText className="w-4 h-4 text-fuchsia-400" /> Scenes ({readyImages}/{sceneCount} visuals)</h3>
            <button onClick={genAllImages} disabled={allImgLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 text-xs font-medium hover:bg-fuchsia-500/20 disabled:opacity-60">
              {allImgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              Generate All Visuals
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {project.scenes.map((scene, idx) => (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-background">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <button onClick={() => genSceneImage(idx)} disabled={imgLoadingIdx === idx}
                      className="flex flex-col items-center gap-2 text-muted-foreground hover:text-fuchsia-400 transition-colors">
                      {imgLoadingIdx === idx ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                      <span className="text-xs font-medium">{imgLoadingIdx === idx ? "Generating…" : "Generate Visual"}</span>
                    </button>
                  )}
                  <span className="absolute top-2 left-2 text-[10px] font-black bg-black/60 text-white px-2 py-0.5 rounded-full">SCENE {idx + 1}</span>
                </div>
                <div className="p-3">
                  <textarea value={scene.text}
                    onChange={(e) => { const scenes = project.scenes.slice(); scenes[idx] = { ...scenes[idx], text: e.target.value }; update({ scenes }); }}
                    rows={2} className="w-full text-xs bg-transparent border border-border rounded-md px-2 py-1.5 text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                  {scene.imageUrl && (
                    <button onClick={() => genSceneImage(idx)} disabled={imgLoadingIdx === idx}
                      className="mt-2 text-[11px] text-fuchsia-400 hover:underline">Regenerate visual</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => navigate("/script-writer")}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted/20 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" /> Refine in Script Writer
            </button>
            <button onClick={() => navigate("/video-editor")} disabled={readyImages === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-500/20">
              <Film className="w-4 h-4" /> Assemble Video <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
