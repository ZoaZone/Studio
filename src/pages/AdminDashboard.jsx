import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Shield, Users, DollarSign, MessageSquare, Sparkles, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#e040fb", "#ffd700", "#60a5fa", "#34d399"];

export default function AdminDashboard() {
  const { data: clients = [] } = useQuery({ queryKey: ["admin-clients"], queryFn: () => base44.entities.Client.list("-created_date", 200) });
  const { data: subscriptions = [] } = useQuery({ queryKey: ["admin-subs"], queryFn: () => base44.entities.Subscription.list("-created_date", 200) });
  const { data: messages = [] } = useQuery({ queryKey: ["admin-messages"], queryFn: () => base44.entities.BulkMessage.list("-created_date", 500) });
  const { data: assets = [] } = useQuery({ queryKey: ["admin-assets"], queryFn: () => base44.entities.ContentAsset.list("-created_date", 500) });

  const activeSubs = subscriptions.filter(s => s.status === "active");
  const mrrEstimate = activeSubs.reduce((sum, s) => {
    const prices = { starter: 49, growth: 149, agency: 399 };
    return sum + (prices[s.plan_tier] || 0);
  }, 0);

  const aiGenerations = assets.filter(a => a.ai_generated).length;

  // Plan breakdown
  const planBreakdown = ["starter", "growth", "agency"].map(tier => ({
    name: tier, value: activeSubs.filter(s => s.plan_tier === tier).length,
  })).filter(d => d.value > 0);

  // Client status
  const clientStatuses = ["active", "onboarding", "inactive", "churned"].map(s => ({
    name: s, count: clients.filter(c => c.status === s).length,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview — admin access only"
        actions={<Badge className="bg-red-500/20 text-red-400 border-red-400/20"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Clients" value={clients.length} icon={Users} color="magenta" />
        <StatCard label="Est. MRR" value={`$${mrrEstimate.toLocaleString()}`} icon={DollarSign} color="gold" />
        <StatCard label="Messages Sent" value={messages.length} icon={MessageSquare} color="blue" />
        <StatCard label="AI Generations" value={aiGenerations} icon={Sparkles} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Plan Breakdown</h3>
          {planBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-white/30 text-sm">No active subscriptions</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={planBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {planBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Client Status */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Client Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientStatuses}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
              <Bar dataKey="count" fill="#e040fb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Recent Clients */}
        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">All Clients</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-3">Business</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-3">Email</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-3">Industry</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-3">Plan</th>
                  <th className="text-left text-xs font-medium text-white/40 uppercase tracking-wider p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-white/30">No clients</td></tr>}
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-white/3 hover:bg-white/3">
                    <td className="p-3 font-medium text-white">{c.business_name}</td>
                    <td className="p-3 text-white/50">{c.contact_email || "—"}</td>
                    <td className="p-3 text-white/50">{c.industry || "—"}</td>
                    <td className="p-3"><Badge variant="outline" className="text-xs border-white/10 text-white/40">{c.plan_tier}</Badge></td>
                    <td className="p-3"><Badge variant="outline" className={`text-xs ${c.status === "active" ? "text-emerald-400 border-emerald-400/20" : "text-white/40 border-white/10"}`}>{c.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}