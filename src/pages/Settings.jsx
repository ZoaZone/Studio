import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Settings as SettingsIcon, Share2, Key, Upload, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { toast } from "sonner";

const platforms = ["instagram", "facebook", "tiktok", "linkedin", "youtube", "twitter_x", "pinterest"];

export default function Settings() {
  const [agencyForm, setAgencyForm] = useState({ name: "", domain: "", brand_colors: "" });
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({ platform: "instagram", account_name: "", status: "connected" });
  const qc = useQueryClient();

  const { data: agencies = [] } = useQuery({ queryKey: ["agencies"], queryFn: () => base44.entities.Agency.list("-created_date", 1) });
  const { data: accounts = [] } = useQuery({ queryKey: ["social-accounts"], queryFn: () => base44.entities.SocialAccount.list("-created_date", 50) });

  useEffect(() => {
    if (agencies.length > 0) {
      setAgencyForm({ name: agencies[0].name || "", domain: agencies[0].domain || "", brand_colors: agencies[0].brand_colors || "" });
    }
  }, [agencies]);

  const saveAgency = async () => {
    if (agencies.length > 0) {
      await base44.entities.Agency.update(agencies[0].id, agencyForm);
    } else {
      await base44.entities.Agency.create({ ...agencyForm, status: "active" });
    }
    qc.invalidateQueries({ queryKey: ["agencies"] });
    toast.success("Settings saved!");
  };

  const createAccount = useMutation({
    mutationFn: (d) => base44.entities.SocialAccount.create({ ...d, connected_at: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-accounts"] }); setShowAddAccount(false); },
  });

  const deleteAccount = useMutation({
    mutationFn: (id) => base44.entities.SocialAccount.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social-accounts"] }),
  });

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your agency profile and integrations" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="profile" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">Profile</TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">Social Accounts</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <GlassCard>
            <h3 className="text-sm font-bold text-white mb-4">Agency Profile</h3>
            <div className="space-y-4">
              <div><Label className="text-white/60 text-xs">Agency Name</Label><Input value={agencyForm.name} onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
              <div><Label className="text-white/60 text-xs">Domain</Label><Input value={agencyForm.domain} onChange={(e) => setAgencyForm({ ...agencyForm, domain: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
              <div><Label className="text-white/60 text-xs">Brand Colors (hex, comma-separated)</Label><Input value={agencyForm.brand_colors} onChange={(e) => setAgencyForm({ ...agencyForm, brand_colors: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="#e040fb, #ffd700" /></div>
              <Button onClick={saveAgency} className="gradient-magenta border-0 text-white hover:opacity-90"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="social">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Connected Social Accounts</h3>
              <Button size="sm" onClick={() => setShowAddAccount(true)} className="gradient-magenta border-0 text-white hover:opacity-90 h-8 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Account
              </Button>
            </div>
            <div className="space-y-3">
              {accounts.length === 0 && <p className="text-xs text-white/30 text-center py-4">No accounts connected</p>}
              {accounts.map(a => (
                <div key={a.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-magenta" />
                    <div>
                      <p className="text-sm font-medium text-white">{a.account_name}</p>
                      <p className="text-xs text-white/30">{a.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs ${a.status === "connected" ? "text-emerald-400 border-emerald-400/20" : "text-red-400 border-red-400/20"}`}>{a.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => deleteAccount.mutate(a.id)} className="h-7 w-7 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="api">
          <GlassCard>
            <h3 className="text-sm font-bold text-white mb-4">API Integrations</h3>
            <p className="text-xs text-white/40 mb-4">Configure API keys for external services. These are managed through the platform settings.</p>
            {["Twilio (SMS)", "SendGrid (Email)", "WhatsApp BSP", "OpenAI", "ElevenLabs"].map(service => (
              <div key={service} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-white/30" />
                  <span className="text-sm text-white/60">{service}</span>
                </div>
                <Badge variant="outline" className="text-xs border-white/10 text-white/30">Configure in Dashboard</Badge>
              </div>
            ))}
          </GlassCard>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Add Social Account</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white/60 text-xs">Platform</Label>
              <Select value={accountForm.platform} onValueChange={(v) => setAccountForm({ ...accountForm, platform: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{platforms.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/60 text-xs">Account Name</Label><Input value={accountForm.account_name} onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" placeholder="@youraccount" /></div>
            <Button onClick={() => createAccount.mutate(accountForm)} disabled={!accountForm.account_name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Connect Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}