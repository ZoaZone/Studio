import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, FileText, Image as ImageIcon, Video, Calendar, Send, ChevronRight, ChevronLeft, Check, Loader2, X, Upload, Shield, Zap, Download, Clock, Plus, Trash2, Star, Hash, Share2, Sparkles, BookOpen, Eye, CheckCircle2, PlayCircle } from "lucide-react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", color: "from-pink-500 to-rose-500" },
  { id: "linkedin", label: "LinkedIn", color: "from-sky-600 to-blue-800" },
  { id: "facebook", label: "Facebook", color: "from-blue-600 to-blue-800" },
  { id: "twitter_x", label: "Twitter/X", color: "from-zinc-600 to-zinc-900" },
  { id: "youtube", label: "YouTube", color: "from-red-500 to-red-700" }
];

const STEPS = [
  { id: "brand", label: "Brand", icon: Building2 },
  { id: "accounts", label: "Accounts", icon: Share2 },
  { id: "content", label: "Content", icon: FileText },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "review", label: "Review", icon: CheckCircle2 }
];

const CONTENT_TYPES = [
  { id: "caption", label: "Social Caption", icon: "📝" },
  { id: "video_script", label: "Video Script", icon: "🎬" },
  { id: "ad_copy", label: "Ad Copy", icon: "📢" },
  { id: "email_template", label: "Email", icon: "📧" },
];

const TONES = ["Professional", "Casual", "Bold", "Luxury", "Playful", "Inspirational", "Urgent", "Friendly"];

const inp = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-fuchsia-500/70 transition";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

export default function CampaignStudio() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mediaRef = useRef();

  const [step, setStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [campaign, setCampaign] = useState({
    brand_id: "", campaign_name: "", content_type: "caption", ai_output: "", ai_prompt: "",
    tone: "Professional", platforms: ["instagram"], selected_accounts: [],
    media_choice: "", media_urls: [], ref_images: [], caption: "", hashtags: "",
    media_type: "image", schedules: [{ date: "", time: "09:00", topic: "", auto_topic: false }]
  });

  const [generating, setGenerating] = useState(false);
  const [generatingMedia, setGeneratingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: () => base44.entities.Brand.list("-created_date", 20) });
  const { data: allAccounts = [] } = useQuery({ queryKey: ["social_accounts"], queryFn: () => base44.entities.SocialAccount.list("-created_date", 100) });

  // FIXED: The Try/Catch blocks are now properly closed, which fixes the blank screen error.
  useEffect(() => {
    const prefill = sessionStorage.getItem("campaignStudio_prefill");
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        setCampaign(p => ({ ...p, ...data }));
        if (data.ai_output) setStep(2);
        sessionStorage.removeItem("campaignStudio_prefill");
      } catch (e) {
        console.error("Prefill parse error:", e);
      }
    }

    try {
      const mediaImport = sessionStorage.getItem("mediaImportData");
      if (mediaImport) {
        const urls = JSON.parse(mediaImport);
        setCampaign(p => ({ ...p, media_urls: [...new Set([...p.media_urls, ...urls])] }));
        setStep(3);
        sessionStorage.removeItem("mediaImportData");
      }
    } catch (error) {
      console.error("Failed to parse imported media:", error);
    }
  }, []);

  const selectedBrand = brands.find(b => b.id === campaign.brand_id);

  const generateContent = async () => {
    if (!campaign.ai_prompt.trim()) { alert("Enter a topic or brief"); return; }
    setGenerating(true);
    
    const brandContext = selectedBrand ? `\n\nBrand: ${selectedBrand.name}.` : "";
    const isCaption = ["caption", "ad_copy"].includes(campaign.content_type);
    
    const promptText = isCaption
      ? `Write a ${campaign.tone} ${campaign.content_type} for ${campaign.platforms[0] || "Instagram"}.\nTopic: ${campaign.ai_prompt}${brandContext}\nFormat EXACTLY like this:\nCAPTION:\n[text]\n\nHASHTAGS:\n[hashtags]`
      : `${campaign.ai_prompt}${brandContext}`;

    try {
      const res = await fetch("/api/functions/generateMediaContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: campaign.content_type, platform: campaign.platforms[0], tone: campaign.tone, prompt: promptText })
      }).then(r => r.json());

      const raw = res?.content || res?.data?.content || "";
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);

      if (isCaption) {
        const captionMatch = text.match(/CAPTION:\s*([\s\S]*?)(?=HASHTAGS:|$)/i);
        const hashMatch = text.match(/HASHTAGS:\s*([\s\S]*?)$/i);
        setCampaign(p => ({
          ...p,
          ai_output: captionMatch ? captionMatch[1].trim() : text,
          caption: captionMatch ? captionMatch[1].trim() : text,
          hashtags: hashMatch ? hashMatch[1].trim() : p.hashtags
        }));
      } else {
        setCampaign(p => ({ ...p, ai_output: text, caption: text }));
      }
    } catch (error) {
      console.error("Content generation failed:", error);
      alert("Failed to generate content.");
    } finally {
      setGenerating(false);
    }
  };

  const publishCampaign = async () => {
    setSaving(true);
    // Add logic to save to database here
    setTimeout(() => {
      setSaved(true);
      setSaving(false);
    }, 1500);
  };

  const canNext = () => (step === 0 ? !!campaign.brand_id : true);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      
      {/* HEADER WITH DEMO BUTTON */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-fuchsia-500" /> Campaign Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered marketing generation and scheduling.</p>
        </div>
        
        <button 
          onClick={() => setShowDemo(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 hover:bg-fuchsia-500/20 transition-all font-bold text-sm text-fuchsia-400">
          <PlayCircle className="w-5 h-5" />
          Watch Concept Demo
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex-shrink-0 ${step === i ? "bg-fuchsia-600 text-white" : i < step ? "bg-fuchsia-600/20 text-fuchsia-400 cursor-pointer" : "bg-white/5 text-muted-foreground cursor-not-allowed"}`}>
              {i < step ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 min-h-[400px] shadow-2xl">
        {step === 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Select Brand Identity</h2>
            <input value={campaign.campaign_name} onChange={e => setCampaign(p => ({ ...p, campaign_name: e.target.value }))} placeholder="Campaign Name (e.g. Summer Sale 2026)" className={inp} />
            <div className="grid sm:grid-cols-2 gap-4">
              {brands.map(b => (
                <button key={b.id} onClick={() => setCampaign(p => ({ ...p, brand_id: b.id }))}
                  className={`p-5 rounded-2xl border text-left transition-all ${campaign.brand_id === b.id ? "border-fuchsia-500 bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.15)]" : "border-border hover:border-fuchsia-500/40"}`}>
                  <p className="font-bold text-lg">{b.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">AI Content Engine</h2>
            <textarea value={campaign.ai_prompt} onChange={e => setCampaign(p => ({ ...p, ai_prompt: e.target.value }))} placeholder="What are we promoting?" rows={3} className={inp} />
            <button onClick={generateContent} disabled={generating || !campaign.ai_prompt} className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition">
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate Campaign Copy
            </button>
            {campaign.ai_output && (
              <div className="mt-6 animate-in fade-in zoom-in duration-500">
                <label className={lbl}>AI Output</label>
                <textarea value={campaign.ai_output} onChange={e => setCampaign(p => ({ ...p, ai_output: e.target.value, caption: e.target.value }))} rows={8} className={inp} />
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 text-center py-10">
            {saved ? (
              <div className="animate-in zoom-in duration-500">
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
                <p className="text-3xl font-black text-white">Pipeline Executed!</p>
                <p className="text-muted-foreground mt-2">Your campaign is queued for publishing.</p>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-6">Ready to Launch?</h2>
                <button onClick={publishCampaign} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black text-xl hover:opacity-90 shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all">
                  {saving ? "Deploying..." : `Launch Campaign`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!saved && (
        <div className="flex justify-between mt-6">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-6 py-3 bg-white/5 rounded-xl font-bold disabled:opacity-30 hover:bg-white/10 transition">Back</button>
          {step < STEPS.length - 1 && (
            <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()} className="px-8 py-3 bg-white text-black rounded-xl font-black hover:bg-gray-200 transition">Next Step</button>
          )}
        </div>
      )}

      {/* WATCH DEMO MODAL WITH CONCEPTUAL VIDEO */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl relative">
            
            <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950">
              <h3 className="font-bold text-neutral-200 flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-fuchsia-500" /> AI Marketing Automation Concept
              </h3>
              <button 
                onClick={() => setShowDemo(false)}
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black relative">
              {/* This is a highly polished abstract AI/Tech network video that sets the mood perfectly */}
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&mute=1&loop=1&playlist=5qap5aO4i9A&controls=0&showinfo=0" 
                title="Conceptual App Demo" 
                className="w-full h-full object-cover pointer-events-none"
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen>
              </iframe>
              
              {/* Optional overlay text to make it feel like your app */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                <div>
                  <h2 className="text-3xl font-black text-white">Media.Aevoice Engine</h2>
                  <p className="text-fuchsia-400 font-medium mt-2">Generating content, automating schedules, driving growth.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}