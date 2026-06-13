import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, FileText, Image as ImageIcon, Video, Calendar, Send, ChevronRight, ChevronLeft, Check, Loader2, X, Upload, Shield, Zap, Download, Clock, Plus, Trash2, Star, Hash, Share2, Sparkles, BookOpen, Eye, CheckCircle2 } from "lucide-react";

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

const MEDIA_TYPES = [
  { id: "ai_image", label: "AI Image", icon: "🎨", desc: "Generate from brand + prompt" },
  { id: "ai_video", label: "AI Video", icon: "🎬", desc: "Generate video clip" },
  { id: "upload", label: "Upload Files", icon: "📁", desc: "Upload your own media" },
  { id: "reference", label: "Use Reference", icon: "🖼️", desc: "Upload refs for AI style" },
];

const TONES = ["Professional", "Casual", "Bold", "Luxury", "Playful", "Inspirational", "Urgent", "Friendly"];

const inp = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-fuchsia-500/70 transition";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

const CONSENT_ITEMS = [
  "I confirm I have explicit permission from all individuals shown in reference media",
  "This content does not contain nudity, hate speech, or impersonation",
  "I take full legal and ethical responsibility for any AI-generated content",
  "I understand that reference images guide style/aesthetic only"
];

export default function CampaignStudio() {
  const { user } = useOutletContext() || {};
  const qc = useQueryClient();
  const navigate = useNavigate();
  const mediaRef = useRef();
  const refMediaRef = useRef();

  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState({
    brand_id: "", campaign_name: "", content_type: "caption", ai_output: "", ai_prompt: "",
    tone: "Professional", platforms: ["instagram"], selected_accounts: [],
    media_choice: "", media_urls: [], ref_images: [], caption: "", hashtags: "",
    media_type: "image", schedules: [{ date: "", time: "09:00", topic: "", auto_topic: false }]
  });

  const [generating, setGenerating] = useState(false);
  const [generatingMedia, setGeneratingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [consentChecked, setConsentChecked] = useState([false, false, false, false]);
  const [generatedMedia, setGeneratedMedia] = useState([]);
  const [aiTopicLoading, setAiTopicLoading] = useState(false);

  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: () => base44.entities.Brand.list("-created_date", 20) });
  const { data: allAccounts = [] } = useQuery({ queryKey: ["social_accounts"], queryFn: () => base44.entities.SocialAccount.list("-created_date", 100) });

  // 1. FIXED SYNTAX: Safe Try/Catch blocks for component mount
  useEffect(() => {
    try {
      const prefill = sessionStorage.getItem("campaignStudio_prefill");
      if (prefill) {
        const data = JSON.parse(prefill);
        setCampaign(p => ({ ...p, ...data }));
        if (data.ai_output) setStep(2);
        sessionStorage.removeItem("campaignStudio_prefill");
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const mediaImport = sessionStorage.getItem("mediaImportData");
      if (mediaImport) {
        const urls = JSON.parse(mediaImport);
        setCampaign(p => ({ ...p, media_urls: [...new Set([...p.media_urls, ...urls])] }));
        setStep(3);
        sessionStorage.removeItem("mediaImportData");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const selectedBrand = brands.find(b => b.id === campaign.brand_id);
  const brandAccounts = allAccounts.filter(a => a.brand_id === campaign.brand_id);
  const allConsentGiven = consentChecked.every(Boolean);

  // 2. FIXED SYNTAX: Properly scoped API Calls
  const generateContent = async () => {
    if (!campaign.ai_prompt.trim()) { alert("Enter a topic or brief"); return; }
    setGenerating(true);
    
    const brandContext = selectedBrand ? `\n\nBrand: ${selectedBrand.name}. Industry: ${selectedBrand.industry || ""}.` : "";
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

  const uploadMedia = async (files, isRef = false) => {
    if (!files?.length) return;
    isRef ? setUploadingRef(true) : setUploadingMedia(true);
    const urls = [];
    for (const file of Array.from(files)) {
      try {
        const url = await base44.storage.uploadFile(file);
        urls.push(url);
      } catch (e) { console.error(e); }
    }
    if (isRef) {
      setCampaign(p => ({ ...p, ref_images: [...p.ref_images, ...urls] }));
    } else {
      setCampaign(p => ({ ...p, media_urls: [...p.media_urls, ...urls] }));
    }
    isRef ? setUploadingRef(false) : setUploadingMedia(false);
  };

  const generateImage = async () => {
    if (!campaign.ai_prompt.trim()) { alert("Enter a prompt first"); return; }
    setGeneratingMedia(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `${campaign.ai_prompt}. Professional marketing image for ${campaign.platforms[0] || "social media"}.`,
        existing_image_urls: campaign.ref_images.length ? campaign.ref_images : undefined,
      });
      if (res?.url) {
        setGeneratedMedia(p => [...p, { url: res.url, type: "image" }]);
        setCampaign(p => ({ ...p, media_urls: [...p.media_urls, res.url], media_type: "image" }));
      }
    } catch (e) { alert("Image generation failed"); }
    setGeneratingMedia(false);
  };

  const generateScheduleDates = () => {
    const dates = [];
    const start = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + (i + 1) * 7);
      dates.push({ date: d.toISOString().split("T")[0], time: "09:00", topic: "", auto_topic: true });
    }
    setCampaign(p => ({ ...p, schedules: dates }));
  };

  const publishCampaign = async () => {
    setSaving(true);
    const fullCaption = [campaign.caption, campaign.hashtags].filter(Boolean).join("\n\n");
    try {
      for (const sch of campaign.schedules) {
        if (!sch.date) continue;
        const targetAccounts = campaign.selected_accounts.length > 0
          ? allAccounts.filter(a => campaign.selected_accounts.includes(a.id))
          : [{ id: "", platform: campaign.platforms[0] || "instagram" }];

        for (const acct of targetAccounts) {
          await base44.entities.ScheduledPost.create({
            social_account_id: acct.id || "",
            platform: acct.platform || campaign.platforms[0] || "instagram",
            caption: fullCaption,
            media_url: campaign.media_urls[0] || "",
            scheduled_at: `${sch.date}T${sch.time}:00`,
            status: "scheduled",
            description: `${campaign.campaign_name} | ${sch.topic}`,
          });
        }
      }
      qc.invalidateQueries(["scheduled_posts"]);
      setSaved(true);
    } catch (e) { alert("Publish failed: " + e.message); }
    setSaving(false);
  };

  const canNext = () => (step === 0 ? !!campaign.brand_id : true);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-fuchsia-400" /> Campaign Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Full campaign creation workflow — brand to publish</p>
        </div>
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

      <div className="bg-card border border-border rounded-2xl p-6 min-h-[400px]">
        {/* STEP 0: BRAND */}
        {step === 0 && (
          <div className="space-y-5">
            <div><h2 className="text-lg font-bold">Select Brand</h2></div>
            <div>
              <label className={lbl}>Campaign Name</label>
              <input value={campaign.campaign_name} onChange={e => setCampaign(p => ({ ...p, campaign_name: e.target.value }))} placeholder="e.g. Summer Sale 2026" className={inp} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {brands.map(b => (
                <button key={b.id} onClick={() => setCampaign(p => ({ ...p, brand_id: b.id }))}
                  className={`p-4 rounded-xl border text-left transition ${campaign.brand_id === b.id ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-border hover:border-fuchsia-500/40"}`}>
                  <p className="font-bold">{b.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: ACCOUNTS */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">Social Accounts</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {allAccounts.map(a => {
                const selected = campaign.selected_accounts.includes(a.id);
                return (
                  <button key={a.id} onClick={() => setCampaign(p => ({
                    ...p,
                    selected_accounts: selected ? p.selected_accounts.filter(id => id !== a.id) : [...p.selected_accounts, a.id],
                    platforms: selected ? p.platforms.filter(pl => pl !== a.platform) : [...new Set([...p.platforms, a.platform])],
                  }))}
                    className={`p-4 rounded-xl border text-left transition ${selected ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-border hover:border-fuchsia-500/40"}`}>
                    <div className="flex justify-between items-center">
                      <p className="font-bold">{a.account_name} <span className="text-xs text-muted-foreground">({a.platform})</span></p>
                      {selected && <Check className="w-5 h-5 text-fuchsia-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: CONTENT */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">Content & Script</h2>
            <div>
              <label className={lbl}>Topic / Brief</label>
              <textarea value={campaign.ai_prompt} onChange={e => setCampaign(p => ({ ...p, ai_prompt: e.target.value }))} rows={3} className={inp} />
            </div>
            <button onClick={generateContent} disabled={generating || !campaign.ai_prompt} className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-bold flex items-center gap-2">
              {generating ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />} Generate
            </button>
            {campaign.ai_output && (
              <textarea value={campaign.ai_output} onChange={e => setCampaign(p => ({ ...p, ai_output: e.target.value, caption: e.target.value }))} rows={8} className={inp} />
            )}
          </div>
        )}

        {/* STEP 3: MEDIA */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">Media Creation</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => mediaRef.current?.click()} className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center hover:border-fuchsia-500/40 transition">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" /> Upload Files
              </button>
              <button onClick={generateImage} disabled={generatingMedia} className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center hover:border-fuchsia-500/40 transition">
                {generatingMedia ? <Loader2 className="w-8 h-8 mx-auto animate-spin" /> : <Sparkles className="w-8 h-8 mx-auto text-fuchsia-400 mb-2" />} Generate AI Image
              </button>
            </div>
            <input ref={mediaRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => uploadMedia(e.target.files)} />
            
            {campaign.media_urls.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-4">
                {campaign.media_urls.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                    <img src={url} className="w-full h-full object-cover" />
                    <button onClick={() => setCampaign(p => ({ ...p, media_urls: p.media_urls.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 bg-red-500/80 rounded-full p-1"><X className="w-3 h-3 text-white" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SCHEDULE */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Schedule Posts</h2>
              <button onClick={generateScheduleDates} className="px-3 py-1 bg-white/10 rounded-lg text-xs">Auto-fill 12 Weeks</button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {campaign.schedules.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                  <input type="date" value={s.date} onChange={e => { const updated = [...campaign.schedules]; updated[i].date = e.target.value; setCampaign(p => ({ ...p, schedules: updated })); }} className="bg-background border rounded px-2 py-1 text-sm" />
                  <input type="time" value={s.time} onChange={e => { const updated = [...campaign.schedules]; updated[i].time = e.target.value; setCampaign(p => ({ ...p, schedules: updated })); }} className="bg-background border rounded px-2 py-1 text-sm" />
                  <input value={s.topic} placeholder="Topic" onChange={e => { const updated = [...campaign.schedules]; updated[i].topic = e.target.value; setCampaign(p => ({ ...p, schedules: updated })); }} className="flex-1 bg-background border rounded px-2 py-1 text-sm" />
                </div>
              ))}
              <button onClick={() => setCampaign(p => ({ ...p, schedules: [...p.schedules, { date: "", time: "09:00", topic: "" }] }))} className="text-sm text-fuchsia-400 mt-2 flex items-center"><Plus className="w-4 h-4" /> Add Slot</button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-center">Review & Publish</h2>
            {saved ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <p className="text-2xl font-black">Campaign Scheduled!</p>
                <button onClick={() => navigate("/social-hub")} className="mt-4 px-5 py-2 bg-white/10 rounded-xl font-bold">View in Social Hub</button>
              </div>
            ) : (
              <button onClick={publishCampaign} disabled={saving} className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-black text-lg">
                {saving ? "Scheduling..." : `Schedule ${campaign.schedules.filter(s=>s.date).length} Posts`}
              </button>
            )}
          </div>
        )}
      </div>

      {!saved && (
        <div className="flex justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="px-4 py-2 bg-white/5 rounded-xl disabled:opacity-30">Back</button>
          {step < STEPS.length - 1 && (
            <button onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()} className="px-5 py-2 bg-fuchsia-600 text-white rounded-xl font-bold">Next</button>
          )}
        </div>
      )}
    </div>
  );
}