import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Search, Globe, Loader2, FileText, Tag, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

export default function WebsiteScanner() {
  const [url, setUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const qc = useQueryClient();

  const { data: scans = [] } = useQuery({
    queryKey: ["scans"],
    queryFn: () => base44.entities.WebsiteScan.list("-created_date", 50),
  });

  const scanWebsite = async () => {
    if (!url) return;
    setScanning(true);

    const scan = await base44.entities.WebsiteScan.create({
      website_url: url,
      scan_status: "scanning",
      scan_at: new Date().toISOString(),
    });

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this website URL: ${url}. Provide a comprehensive analysis including: business summary, services offered, main keywords, tone of voice, and potential competitors. Be specific and detailed.`,
      response_json_schema: {
        type: "object",
        properties: {
          business_summary: { type: "string" },
          services_found: { type: "array", items: { type: "string" } },
          keywords_found: { type: "array", items: { type: "string" } },
          tone: { type: "string" },
          competitors: { type: "array", items: { type: "string" } },
        },
      },
      add_context_from_internet: true,
    });

    await base44.entities.WebsiteScan.update(scan.id, {
      scan_status: "completed",
      business_summary: res.business_summary,
      services_found: res.services_found || [],
      keywords_found: res.keywords_found || [],
      tone: res.tone,
      competitors: res.competitors || [],
      pages_scanned: 1,
    });

    qc.invalidateQueries({ queryKey: ["scans"] });
    setScanning(false);
    setUrl("");
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader title="Website Scanner" subtitle="Scan any website to extract business insights" />

      {/* Scanner */}
      <GlassCard className="mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Enter website URL (e.g., example.com)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
              onKeyDown={(e) => e.key === "Enter" && scanWebsite()}
            />
          </div>
          <Button onClick={scanWebsite} disabled={!url || scanning} className="gradient-magenta border-0 text-white hover:opacity-90">
            {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : <><Search className="w-4 h-4 mr-2" /> Scan Website</>}
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan List */}
        <div>
          <h3 className="text-sm font-bold text-white mb-4">Previous Scans</h3>
          <div className="space-y-3">
            {scans.length === 0 && <p className="text-xs text-white/30">No scans yet</p>}
            {scans.map(s => (
              <GlassCard
                key={s.id}
                onClick={() => setSelectedScan(s)}
                className={`cursor-pointer ${selectedScan?.id === s.id ? "border-magenta/30" : ""}`}
              >
                <p className="text-sm font-medium text-white truncate">{s.website_url}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={`text-xs ${s.scan_status === "completed" ? "text-emerald-400 border-emerald-400/20" : "text-yellow-400 border-yellow-400/20"}`}>
                    {s.scan_status}
                  </Badge>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Scan Details */}
        <div className="lg:col-span-2">
          {!selectedScan ? (
            <GlassCard className="text-center py-16">
              <Search className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-white/30 text-sm">Select a scan to view details</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <GlassCard>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-magenta" />
                  <h3 className="text-sm font-bold text-white">Business Summary</h3>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{selectedScan.business_summary || "No summary available"}</p>
              </GlassCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-gold" />
                    <h3 className="text-sm font-bold text-white">Services</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedScan.services_found || []).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-white/10 text-white/50">{s}</Badge>
                    ))}
                    {(!selectedScan.services_found || selectedScan.services_found.length === 0) && <p className="text-xs text-white/30">None found</p>}
                  </div>
                </GlassCard>

                <GlassCard>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Keywords</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedScan.keywords_found || []).map((k, i) => (
                      <Badge key={i} className="bg-magenta/10 text-magenta border-magenta/20 text-xs">{k}</Badge>
                    ))}
                    {(!selectedScan.keywords_found || selectedScan.keywords_found.length === 0) && <p className="text-xs text-white/30">None found</p>}
                  </div>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GlassCard>
                  <h3 className="text-sm font-bold text-white mb-2">Tone</h3>
                  <p className="text-sm text-white/60">{selectedScan.tone || "—"}</p>
                </GlassCard>
                <GlassCard>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">Competitors</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedScan.competitors || []).map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-white/10 text-white/50">{c}</Badge>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}