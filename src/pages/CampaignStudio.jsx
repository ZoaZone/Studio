import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, FileText, Image, Video, Calendar, Send, ChevronRight, ChevronLeft, Check, Loader2, X, Upload, Shield, Sparkles, BookOpen, Eye, Download, Hash, Zap, Share2 } from "lucide-react";

const STEPS = [
  { id: "linkedin", label: "LinkedIn", color: "from-sky-600 to-blue-800" },
  { id: "youtube", label: "YouTube", color: "from-red-500 to-red-700" },
  { id: "twitter_x", label: "Twitter/X", color: "from-zinc-600 to-zinc-900" },
  { id: "whatsapp", label: "WhatsApp", color: "from-green-500 to-emerald-600" },
  { id: "email", label: "Email", color: "from-violet-500 to-purple-600" },
];

const CONTENT_TYPES = [
  { id: "caption", label: "Social Caption", icon: "📝" },
  { id: "video_script", label: "Video Script", icon: "🎬" },
  { id: "ad_copy", label: "Ad Copy", icon: "📢" },
  { id: "email_template", label: "Email", icon: "📧" },
  { id: "blog_post", label: "Blog Post", icon: "📰" },
  { id: "whatsapp", label: "WhatsApp Message", icon: "💬" },
  { id: "hashtag_set", label: "Hashtag Set", icon: "#️⃣" },
  { id: "press_release", label: "Press Release", icon: "📣" },
];

const MEDIA_TYPES = [
  { id: "ai_image", label: "AI Image", icon: "🎨", desc: "Generate from brand + prompt" },
  { id: "ai_video", label: "AI Video", icon: "🎬", desc: "Generate video clip" },
  { id: "upload", label: "Upload Files", icon: "📁", desc: "Upload your own media" },
];

const TONES = ["Professional", "Casual", "Bold", "Luxury", "Playful", "Inspirational", "Urgent", "Friendly"];

const inp = "w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-fuchsia-500/70 transition";
const lbl = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

const CONSENT_ITEMS = [
  "I confirm I have explicit permission from all individuals shown in reference media to use their likeness",
  "This content does not contain nudity, hate speech, or impersonation of any person or brand",
  "I take full legal and ethical responsibility for any AI-generated content using this reference material",
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
    media_choice: "", media_urls: [], ref_images: [], ref_consent: false,
    caption: "", hashtags: "", media_type: "image", schedules: [{ date: "", time: "09:00", topic: "", auto_topic: false }],
  });
  const [generating, setGenerating] = useState(false);
  const [generatingMedia, setGeneratingMedia] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [saved, setSaved] = useState(false);
  const [consentChecked, setConsentChecked] = useState([false, false, false]);
  const [generatedMedia, setGeneratedMedia] = useState([]);
  const [aiTopicLoading, setAiTopicLoading] = useState(false);

  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: () => base44.entities.Brand.list("-created_date", 20) });
  const { data: allAccounts = [] } = useQuery({ queryKey: ["social_accounts"], queryFn: () => base44.entities.SocialAccount.list("-created_date", 100) });

  useEffect(() => {
    const prefill = sessionStorage.getItem("campaignStudio_prefill");
    if (prefill) {
      try {
        const data = JSON.parse(prefill);
        setCampaign(p => ({ ...p, ...data }));
        if (data.ai_output) setStep(2);
        sessionStorage.removeItem("campaignStudio_prefill");
      } catch (_) {}
    }
  }, []);

  const selectedBrand = brands.find(b => b.id === campaign.brand_id);
  const brandAccounts = allAccounts.filter(a => a.brand_id === campaign.brand_id);
  const allConsentGiven = consentChecked.every(Boolean);
  const generateContent = async () => {
    if (!campaign.ai_prompt.trim()) { alert("Enter a topic or brief"); return; }
    setGenerating(true);
    const brand = selectedBrand;
    const brandContext = brand ? `\n\nBrand: ${brand.name}.` : "";
    
    try {
      const res = await fetch("/api/functions/generateMediaContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: campaign.content_type,
          platform: campaign.platforms[0] || "Instagram",
          tone: campaign.tone,
          prompt: `${campaign.ai_prompt}${brandContext}`,
        })
      }).then(r => r.json());

      const raw = res?.content || res?.data?.content || "";
      setCampaign(p => ({ ...p, ai_output: typeof raw === "string" ? raw : JSON.stringify(raw) }));
    } catch (e) { console.error(e); alert("Generation failed"); }
    setGenerating(false);
  };

  const runAutoPipeline = async () => {
    setGenerating(true);
    try {
      await generateContent();
      alert("Pipeline complete!");
    } catch (e) { alert("Pipeline Error: " + e.message); }
    setGenerating(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-fuchsia-400" /> Campaign Studio
        </h1>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 min-h-[400px]">
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">Select Brand</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {brands.map(b => (
                <button key={b.id} onClick={() => setCampaign(p => ({ ...p, brand_id: b.id }))}
                  className={`p-4 rounded-xl border ${campaign.brand_id === b.id ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-border"}`}>
                  <p className="font-bold">{b.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-foreground">Content & Script</h2>
            <textarea value={campaign.ai_prompt} onChange={e => setCampaign(p => ({ ...p, ai_prompt: e.target.value }))}
              placeholder="Describe your content..." className={inp} />
            <button onClick={generateContent} className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-bold">
              {generating ? "Generating..." : "Generate Content"}
            </button>
            {campaign.ai_output && (
              <textarea value={campaign.ai_output} readOnly className={inp} rows={8} />
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 bg-white/5 rounded-xl">Back</button>
        <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl">Next</button>
      </div>
    </div>
  );
}