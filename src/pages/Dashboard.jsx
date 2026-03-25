import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Users, Megaphone, Share2, GitBranch, MessageSquare,
  Clock, TrendingUp, Sparkles
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.MarketingContact.list("-created_date", 50),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => base44.entities.MarketingCampaign.list("-created_date", 10),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: () => base44.entities.ScheduledPost.list("-created_date", 10),
  });

  const { data: funnels = [] } = useQuery({
    queryKey: ["funnels"],
    queryFn: () => base44.entities.Funnel.list("-created_date", 10),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages-today"],
    queryFn: () => base44.entities.BulkMessage.list("-created_date", 50),
  });

  const activeCampaigns = campaigns.filter((c) => c.status === "running").length;
  const pendingPosts = posts.filter((p) => p.status === "scheduled").length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
  const activeFunnels = funnels.filter((f) => f.status === "active").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's your marketing overview"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Contacts" value={contacts.length} icon={Users} color="magenta" trend={12} />
        <StatCard label="Active Campaigns" value={activeCampaigns} icon={Megaphone} color="gold" />
        <StatCard label="Scheduled Posts" value={pendingPosts} icon={Clock} color="blue" />
        <StatCard label="Active Funnels" value={activeFunnels} icon={GitBranch} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Campaigns</h3>
            <Megaphone className="w-4 h-4 text-magenta" />
          </div>
          <div className="space-y-3">
            {campaigns.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">No campaigns yet</p>
            )}
            {campaigns.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{c.name}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {c.type} • {c.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{c.sent_count || 0}</p>
                  <p className="text-xs text-white/30">sent</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Upcoming Posts */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Upcoming Posts</h3>
            <Share2 className="w-4 h-4 text-gold" />
          </div>
          <div className="space-y-3">
            {posts.length === 0 && (
              <p className="text-xs text-white/30 py-4 text-center">No scheduled posts</p>
            )}
            {posts.filter(p => p.status === "scheduled").slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[200px]">{p.caption}</p>
                  <p className="text-xs text-white/30 mt-0.5">{p.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40">
                    {p.scheduled_at ? format(new Date(p.scheduled_at), "MMM d, h:mm a") : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Messages Sent */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Recent Messages</h3>
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{messages.filter(m => m.channel === "email").length}</p>
              <p className="text-xs text-white/30 mt-1">Email</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{messages.filter(m => m.channel === "sms").length}</p>
              <p className="text-xs text-white/30 mt-1">SMS</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{messages.filter(m => m.channel === "whatsapp").length}</p>
              <p className="text-xs text-white/30 mt-1">WhatsApp</p>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Campaign", icon: Megaphone, href: "/campaigns" },
              { label: "Create Post", icon: Share2, href: "/social-hub" },
              { label: "AI Content", icon: Sparkles, href: "/media-studio" },
              { label: "Scan Website", icon: TrendingUp, href: "/website-scanner" },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-magenta/20 transition-all"
              >
                <a.icon className="w-4 h-4 text-magenta" />
                <span className="text-xs font-medium text-white/70">{a.label}</span>
              </a>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}