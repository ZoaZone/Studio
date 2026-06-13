import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Wand2, Palette, ChevronRight, CheckCircle2 } from "lucide-react";

export default function CampaignStudio() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState({ brand_id: "", ai_prompt: "", ai_output: "" });
  const { data: brands = [] } = useQuery({ queryKey: ["brands"], queryFn: () => base44.entities.Brand.list() });

  const generateContent = async () => {
    if (!campaign.ai_prompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/functions/generateMediaContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: campaign.ai_prompt })
      }).then(r => r.json());
      setCampaign(p => ({ ...p, ai_output: res?.content || "No content generated." }));
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      {/* Modern Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-purple-600 flex items-center gap-3">
          <Sparkles className="text-fuchsia-500" /> Campaign Studio
        </h1>
        <p className="text-neutral-400 mt-2 text-lg">Your AI-powered marketing command center.</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">
        {/* Left Panel - Control */}
        <div className="col-span-12 md:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Palette className="text-fuchsia-500" /> Select Brand</h3>
            <div className="space-y-3">
              {brands.map(b => (
                <button key={b.id} onClick={() => setCampaign(p => ({ ...p, brand_id: b.id }))}
                  className={`w-full p-4 rounded-2xl border transition-all ${campaign.brand_id === b.id ? "border-fuchsia-500 bg-fuchsia-500/10" : "border-neutral-800 hover:border-neutral-600 bg-neutral-950"}`}>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Generator */}
        <div className="col-span-12 md:col-span-7">
          <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl min-h-[400px] flex flex-col">
            <textarea 
              value={campaign.ai_prompt} 
              onChange={e => setCampaign(p => ({ ...p, ai_prompt: e.target.value }))}
              placeholder="What should we create today?"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white placeholder:text-neutral-600 focus:border-fuchsia-500 transition outline-none mb-4"
              rows={4}
            />
            <button onClick={generateContent} disabled={generating}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:opacity-90 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all">
              {generating ? <Loader2 className="animate-spin" /> : <><Wand2 /> Execute Pipeline</>}
            </button>
            
            {campaign.ai_output && (
              <div className="mt-8 bg-neutral-950 p-6 rounded-2xl border border-neutral-800 animate-in fade-in duration-700">
                <h4 className="text-fuchsia-400 font-bold mb-2 flex items-center gap-2"><CheckCircle2 /> AI Response</h4>
                <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">{campaign.ai_output}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}