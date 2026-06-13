import { useState, useRef, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Building2, Sparkles, Loader2, ChevronRight, ChevronLeft, Check, X, Upload } from "lucide-react";

const STEPS = [
  { id: "brand", label: "Brand" },
  { id: "accounts", label: "Accounts" },
  { id: "content", label: "Content" },
  { id: "media", label: "Media" },
  { id: "schedule", label: "Schedule" }
];

export default function CampaignStudio() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState({
    brand_id: "", campaign_name: "", content_type: "caption", ai_output: "", ai_prompt: "",
    tone: "Professional", platforms: ["instagram"], media_urls: []
  });

  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: () => base44.entities.Brand.list() });
  const selectedBrand = brands.find(b => b.id === campaign.brand_id);

  const generateContent = async () => {
    if (!campaign.ai_prompt.trim()) { alert("Enter a topic!"); return; }
    setGenerating(true);
    try {
      const res = await fetch("/api/functions/generateMediaContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: campaign.content_type,
          platform: campaign.platforms[0],
          tone: campaign.tone,
          prompt: campaign.ai_prompt,
        })
      }).then(r => r.json());
      setCampaign(p => ({ ...p, ai_output: res?.content || JSON.stringify(res) }));
    } catch (e) { alert("Failed"); }
    setGenerating(false);
  };

  const runAutoPipeline = async () => {
    setGenerating(true);
    await generateContent();
    setGenerating(false);
    alert("Pipeline complete!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-6">
      <h1 className="text-2xl font-black flex items-center gap-2">
        <Sparkles className="text-fuchsia-400" /> Campaign Studio
      </h1>

      <div className="bg-card border rounded-2xl p-6 min-h-[400px]">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Select Brand</h2>
            <div className="grid grid-cols-2 gap-3">
              {brands.map(b => (
                <button key={b.id} onClick={() => setCampaign(p => ({ ...p, brand_id: b.id }))}
                  className={`p-4 border rounded-xl ${campaign.brand_id === b.id ? "border-fuchsia-500 bg-fuchsia-500/10" : ""}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Content Generation</h2>
            <textarea value={campaign.ai_prompt} onChange={e => setCampaign(p => ({ ...p, ai_prompt: e.target.value }))}
              className="w-full p-3 border rounded-xl" placeholder="Describe your topic..." />
            <div className="flex gap-2">
              <button onClick={generateContent} className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-bold">
                {generating ? <Loader2 className="animate-spin" /> : "Generate"}
              </button>
              <button onClick={runAutoPipeline} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold">
                Run Auto Pipeline
              </button>
            </div>
            {campaign.ai_output && <pre className="p-4 bg-muted rounded-xl text-sm">{campaign.ai_output}</pre>}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} className="px-4 py-2 bg-secondary rounded-xl">Back</button>
        <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} className="px-4 py-2 bg-fuchsia-600 text-white rounded-xl">Next</button>
      </div>
    </div>
  );
}