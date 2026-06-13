import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Download, Upload, X, Film, Eye, RefreshCw, Wand2, Volume2, AlignLeft, ImagePlus, Play, Clapperboard, Layers, Star, Image, CheckCircle2, Copy, ChevronDown, ChevronUp } from "lucide-react";

// (Keep your TYPES, CATEGORIES, PLATFORMS, TONES, VIDEO_STYLES, VIDEO_DURATIONS, AI_VIDEO_FORMATS, AI_VIDEO_DURATIONS, IMAGE_DIMS, and buildPrompt functions exactly as you provided them in your snippet above.)

export default function MediaStudio() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const [activeType, setActiveType] = useState("image");
  const [activeCat, setActiveCat] = useState("all");
  const [form, setForm] = useState({
    prompt: "", platform: "Instagram", tone: "Professional",
    dimensions: "1080x1080", videoStyle: "Short-form Reel", videoDuration: "60 seconds",
    videoAspect: "9:16", videoSeconds: 6, audioNote: "", captionStyle: "minimal"
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ... (Keep handleFileUpload, removeUploadedFile, sanitizeVideoPrompt, generate, copy, and save functions exactly as defined in your snippet)

  const activeTypeObj = TYPES.find(t => t.id === activeType);
  const isVisual = activeType === "image" || activeType === "thumbnail";
  const isVideoType = activeType === "video_script" || activeType === "video_storyboard";
  const isAiVideo = activeType === "ai_video";
  const filteredTypes = activeCat === "all" ? TYPES : TYPES.filter(t => t.category === activeCat);
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header and Type Grid (Keep your existing Header/Category/Type Grid markup) */}
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Panel (Keep your existing Input Panel markup) */}

        {/* Output Panel - FINAL FIXED VERSION */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Output</h3>
            {result && (
              <div className="flex items-center gap-2">
                <button onClick={generate} className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-fuchsia-500/10 text-fuchsia-400">
                  {saved ? "Saved!" : "Save"}
                </button>
              </div>
            )}
          </div>

          {!result && !loading && <div className="text-center py-20 text-muted-foreground">Configure and Generate...</div>}
          
          {loading && <div className="text-center py-20 animate-pulse">AI is generating...</div>}

          {result && !loading && (
            <div className="flex-1 space-y-4">
              {result.type === "video" && result.url ? (
                <div className="space-y-4">
                  <video src={result.url} controls className="w-full rounded-xl bg-black" />
                  {result.clipUrls?.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {result.clipUrls.map((url, i) => (
                        <div key={i} className="rounded-lg border border-border overflow-hidden">
                          <video src={url} controls className="w-full" />
                          <div className="flex justify-between p-2">
                            <span className="text-xs">Clip {i + 1}</span>
                            <a href={url} download className="text-xs text-fuchsia-400">Download</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : result.type === "image" && result.url ? (
                <img src={result.url} className="w-full rounded-xl" />
              ) : (
                <pre className="text-xs p-4 bg-muted rounded-xl whitespace-pre-wrap">{result.text}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}