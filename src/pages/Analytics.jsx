import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, Users, Megaphone, Share2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";

const COLORS = ["#e040fb", "#ffd700", "#60a5fa", "#34d399", "#f472b6", "#a78bfa"];

export default function Analytics() {
  const { data: campaigns = [] } = useQuery({ queryKey: ["campaigns"], queryFn: () => base44.entities.MarketingCampaign.list("-created_date", 100) });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: () => base44.entities.MarketingContact.list("-created_date", 200) });
  const { data: posts = [] } = useQuery({ queryKey: ["posts"], queryFn: () => base44.entities.ScheduledPost.list("-created_date", 100) });
  const { data: funnels = [] } = useQuery({ queryKey: ["funnels"], queryFn: () => base44.entities.Funnel.list("-created_date", 50) });

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
  const totalOpens = campaigns.reduce((s, c) => s + (c.open_count || 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.click_count || 0), 0);
  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : 0;
  const ctr = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : 0;

  // Campaign performance by type
  const campaignByType = ["email", "sms", "whatsapp", "social"].map(t => {
    const cs = campaigns.filter(c => c.type === t);
    return { name: t, sent: cs.reduce((s, c) => s + (c.sent_count || 0), 0), opens: cs.reduce((s, c) => s + (c.open_count || 0), 0), clicks: cs.reduce((s, c) => s + (c.click_count || 0), 0) };
  });

  // Lead source breakdown
  const sources = ["website", "social", "ad", "referral", "manual"];
  const leadBySource = sources.map(s => ({ name: s, value: contacts.filter(c => c.source === s).length })).filter(d => d.value > 0);

  // Funnel conversion rates
  const funnelData = funnels.map(f => ({ name: f.name?.slice(0, 15) || "Unnamed", rate: f.conversion_rate || 0 }));

  // Social engagement
  const engagementData = posts.filter(p => p.status === "posted").slice(0, 10).map(p => ({
    name: p.platform?.slice(0, 4) || "",
    likes: p.engagement_likes || 0,
    comments: p.engagement_comments || 0,
    shares: p.engagement_shares || 0,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Analytics" subtitle="Campaign performance and marketing insights" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Sent" value={totalSent} icon={Megaphone} color="magenta" />
        <StatCard label="Open Rate" value={`${openRate}%`} icon={TrendingUp} color="gold" />
        <StatCard label="Click Rate" value={`${ctr}%`} icon={BarChart3} color="blue" />
        <StatCard label="Total Contacts" value={contacts.length} icon={Users} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Campaign Performance by Channel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={campaignByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
              <Bar dataKey="sent" fill="#e040fb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="opens" fill="#ffd700" radius={[4, 4, 0, 0]} />
              <Bar dataKey="clicks" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Lead Source */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Lead Source Breakdown</h3>
          {leadBySource.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-white/30 text-sm">No lead data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={leadBySource} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {leadBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Funnel Conversion */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Funnel Conversion Rates</h3>
          {funnelData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-white/30 text-sm">No funnel data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                <Bar dataKey="rate" fill="#e040fb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassCard>

        {/* Social Engagement */}
        <GlassCard>
          <h3 className="text-sm font-bold text-white mb-4">Social Post Engagement</h3>
          {engagementData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-white/30 text-sm">No post engagement data</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }} />
                <Line type="monotone" dataKey="likes" stroke="#e040fb" strokeWidth={2} />
                <Line type="monotone" dataKey="comments" stroke="#ffd700" strokeWidth={2} />
                <Line type="monotone" dataKey="shares" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </GlassCard>
      </div>
    </div>
  );
}