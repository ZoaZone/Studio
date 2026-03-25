import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Image, FileText, Hash, Palette, Mail, MessageSquare, Wand2, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from "sonner";

const contentTypes = [
  { value: "caption", label: "Social Caption", icon: MessageSquare },
  { value: "ad_copy", label: "Ad Copy", icon: FileText },
  { value: "email_template", label: "Email Template", icon: Mail },
  { value: "hashtag_set", label: "Hashtag Set", icon: Hash },
  { value: "script", label: "Video Script", icon: FileText },
  { value: "sms_template", label: "SMS Template", icon: MessageSquare },
];

const platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter_x", "email", "sms"];

export default function MediaStudio() {
  const [type, setType] = useState("caption");
  const [platform, setPlatform] = useState("instagram");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");
  const qc = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentAsset.create(data),
    onSuccess: () => { toast.success("Saved to library!"); qc.invalidateQueries({ queryKey: ["content-assets"] }); },
  });

  const generate = async () => {
    if (!prompt) return;
    setLoading(true);
    setResult("");
    const prompts = {
      caption: `Create an engaging ${platform} caption. Topic: ${prompt}. Include relevant emojis. Make it attention-grabbing.`,
      ad_copy: `Write compelling ad copy for ${platform}. Product/Service: ${prompt}. Include headline, body, and CTA.`,
      email_template: `Write a marketing email template. Topic: ${prompt}. Include subject line and body.`,
      hashtag_set: `Generate 20 relevant hashtags for ${platform} about: ${prompt}. Return as a list separated by spaces.`,
      script: `Write a 30-60 second video script for ${platform}. Topic: ${prompt}. Include scene directions and dialogue.`,
      sms_template: `Write a concise SMS marketing message (under 160 chars). Topic: ${prompt}. Include a CTA.`,
    };

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: prompts[type] || prompts.caption,
    });
    setResult(res);
    setTitle(`${type} - ${prompt.slice(0, 30)}`);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToLibrary = () => {
    saveMutation.mutate({
      type,
      title: title || `${type} - ${new Date().toLocaleDateString()}`,
      content: result,
      platform,
      ai_generated: true,
      prompt_used: prompt,
      status: "ready",
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader title="Media Studio" subtitle="Generate AI-powered marketing content" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-magenta" /> Content Generator
          </h3>

          <div className="space-y-4">
            <div>
              <Label className="text-white/60 text-xs">Content Type</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {contentTypes.map((ct) => (
                  <button
                    key={ct.value}
                    onClick={() => setType(ct.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                      type === ct.value
                        ? "border-magenta/30 bg-magenta/10 text-magenta"
                        : "border-white/5 bg-white/3 text-white/50 hover:border-white/10"
                    }`}
                  >
                    <ct.icon className="w-3.5 h-3.5" />
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-white/60 text-xs">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/60 text-xs">Describe what you need</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Promote our new fitness app launch with a summer vibe..."
                className="bg-white/5 border-white/10 text-white mt-1"
                rows={4}
              />
            </div>

            <Button onClick={generate} disabled={!prompt || loading} className="w-full gradient-magenta border-0 text-white hover:opacity-90">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Content</>}
            </Button>
          </div>
        </GlassCard>

        {/* Result */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Generated Content</h3>
            {result && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-white/50 hover:text-white h-7 px-2 text-xs">
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="ghost" size="sm" onClick={saveToLibrary} className="text-magenta h-7 px-2 text-xs">
                  Save to Library
                </Button>
              </div>
            )}
          </div>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-magenta animate-spin" />
              <p className="text-xs text-white/30 mt-3">Crafting your content...</p>
            </div>
          )}
          {!loading && !result && (
            <div className="flex flex-col items-center justify-center py-16">
              <Sparkles className="w-10 h-10 text-white/10 mb-3" />
              <p className="text-xs text-white/30">Your generated content will appear here</p>
            </div>
          )}
          {!loading && result && (
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">{result}</div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}