import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, ArrowRight, Check, Zap, MessageSquare, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

export default function Billing() {
  const { data: subscriptions = [] } = useQuery({ queryKey: ["subscriptions"], queryFn: () => base44.entities.Subscription.list("-created_date", 1) });
  const { data: messages = [] } = useQuery({ queryKey: ["all-messages"], queryFn: () => base44.entities.BulkMessage.list("-created_date", 500) });
  const { data: posts = [] } = useQuery({ queryKey: ["all-posts"], queryFn: () => base44.entities.ScheduledPost.list("-created_date", 500) });
  const { data: assets = [] } = useQuery({ queryKey: ["all-assets"], queryFn: () => base44.entities.ContentAsset.list("-created_date", 500) });

  const sub = subscriptions[0];
  const planName = sub?.plan_name || "Free";
  const planTier = sub?.plan_tier || "starter";

  const limits = {
    starter: { messages: 1000, posts: 50, ai: 500 },
    growth: { messages: 10000, posts: 200, ai: 2500 },
    agency: { messages: 50000, posts: 1000, ai: 10000 },
  };

  const current = limits[planTier] || limits.starter;
  const aiCount = assets.filter(a => a.ai_generated).length;

  const usageItems = [
    { label: "Messages Sent", current: messages.length, limit: current.messages, icon: MessageSquare, color: "magenta" },
    { label: "Posts Scheduled", current: posts.length, limit: current.posts, icon: Share2, color: "gold" },
    { label: "AI Generations", current: aiCount, limit: current.ai, icon: Sparkles, color: "blue" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Billing" subtitle="Manage your subscription and usage" />

      {/* Current Plan */}
      <GlassCard className="mb-8 neon-magenta">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-magenta" />
              <p className="text-xs text-white/40 uppercase tracking-wider">Current Plan</p>
            </div>
            <h2 className="text-2xl font-black text-white">{planName}</h2>
            <p className="text-sm text-white/40 mt-1">
              {sub?.status === "active" ? "Active" : "No active subscription"}
            </p>
          </div>
          <Link to="/pricing">
            <Button className="gradient-magenta border-0 text-white hover:opacity-90">
              Upgrade Plan <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </GlassCard>

      {/* Usage */}
      <h3 className="text-sm font-bold text-white mb-4">Usage This Month</h3>
      <div className="grid gap-4 mb-8">
        {usageItems.map(item => {
          const pct = Math.min((item.current / item.limit) * 100, 100);
          return (
            <GlassCard key={item.label}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-magenta" />
                  <span className="text-sm font-medium text-white">{item.label}</span>
                </div>
                <span className="text-sm text-white/50">
                  {item.current} / {item.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={pct} className="h-2 bg-white/5" />
            </GlassCard>
          );
        })}
      </div>

      {/* Quick Plan Comparison */}
      <GlassCard>
        <h3 className="text-sm font-bold text-white mb-4">Plan Comparison</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { name: "Starter", price: "$49/mo", active: planTier === "starter" },
            { name: "Growth", price: "$149/mo", active: planTier === "growth" },
            { name: "Agency", price: "$399/mo", active: planTier === "agency" },
          ].map(p => (
            <div key={p.name} className={`p-4 rounded-xl border ${p.active ? "border-magenta/30 bg-magenta/5" : "border-white/5 bg-white/3"}`}>
              <p className="text-sm font-bold text-white">{p.name}</p>
              <p className="text-lg font-black text-white mt-1">{p.price}</p>
              {p.active && <Badge className="mt-2 bg-magenta/20 text-magenta border-magenta/30 text-xs">Current</Badge>}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}