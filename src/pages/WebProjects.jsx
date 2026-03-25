import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Globe, MonitorSmartphone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

const webStatuses = ["brief", "design", "development", "review", "launched"];
const appStatuses = ["brief", "wireframe", "design", "development", "testing", "launched"];
const statusColors = {
  brief: "text-white/40 border-white/10", design: "text-blue-400 border-blue-400/20", wireframe: "text-purple-400 border-purple-400/20",
  development: "text-yellow-400 border-yellow-400/20", review: "text-orange-400 border-orange-400/20",
  testing: "text-cyan-400 border-cyan-400/20", launched: "text-emerald-400 border-emerald-400/20",
};

export default function WebProjects() {
  const [showCreateWeb, setShowCreateWeb] = useState(false);
  const [showCreateApp, setShowCreateApp] = useState(false);
  const [webForm, setWebForm] = useState({ project_name: "", domain: "", status: "brief", brief: "", style_direction: "" });
  const [appForm, setAppForm] = useState({ project_name: "", platform: "web", status: "brief", brief: "" });
  const qc = useQueryClient();

  const { data: webProjects = [] } = useQuery({ queryKey: ["web-projects"], queryFn: () => base44.entities.WebsiteProject.list("-created_date", 50) });
  const { data: appProjects = [] } = useQuery({ queryKey: ["app-projects"], queryFn: () => base44.entities.AppProject.list("-created_date", 50) });

  const createWeb = useMutation({ mutationFn: (d) => base44.entities.WebsiteProject.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["web-projects"] }); setShowCreateWeb(false); } });
  const createApp = useMutation({ mutationFn: (d) => base44.entities.AppProject.create(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["app-projects"] }); setShowCreateApp(false); } });
  const deleteWeb = useMutation({ mutationFn: (id) => base44.entities.WebsiteProject.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["web-projects"] }) });
  const deleteApp = useMutation({ mutationFn: (id) => base44.entities.AppProject.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["app-projects"] }) });

  const updateWebStatus = async (id, status) => {
    await base44.entities.WebsiteProject.update(id, { status, ...(status === "launched" ? { launched_at: new Date().toISOString() } : {}) });
    qc.invalidateQueries({ queryKey: ["web-projects"] });
  };
  const updateAppStatus = async (id, status) => {
    await base44.entities.AppProject.update(id, { status });
    qc.invalidateQueries({ queryKey: ["app-projects"] });
  };

  const ProjectCard = ({ project, statuses, onDelete, onStatusChange, type }) => (
    <GlassCard>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-white">{project.project_name}</p>
          <p className="text-xs text-white/30 mt-0.5">{type === "web" ? project.domain : project.platform}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(project.id)} className="h-7 w-7 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
      {/* Status Pipeline */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {statuses.map((s, i) => (
          <button
            key={s}
            onClick={() => onStatusChange(project.id, s)}
            className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-all ${
              project.status === s ? "bg-magenta/20 text-magenta font-medium" : "bg-white/5 text-white/30 hover:text-white/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      {project.brief && <p className="text-xs text-white/40 line-clamp-2">{project.brief}</p>}
    </GlassCard>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Web & App Projects" subtitle="Manage website and app build projects" />

      <Tabs defaultValue="websites" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="websites" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">
            <Globe className="w-4 h-4 mr-2" /> Websites ({webProjects.length})
          </TabsTrigger>
          <TabsTrigger value="apps" className="data-[state=active]:bg-magenta/20 data-[state=active]:text-magenta">
            <MonitorSmartphone className="w-4 h-4 mr-2" /> Apps ({appProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="websites">
          <div className="mb-4">
            <Button onClick={() => setShowCreateWeb(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> New Website Project
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webProjects.map(p => <ProjectCard key={p.id} project={p} statuses={webStatuses} onDelete={(id) => deleteWeb.mutate(id)} onStatusChange={updateWebStatus} type="web" />)}
          </div>
        </TabsContent>

        <TabsContent value="apps">
          <div className="mb-4">
            <Button onClick={() => setShowCreateApp(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> New App Project
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appProjects.map(p => <ProjectCard key={p.id} project={p} statuses={appStatuses} onDelete={(id) => deleteApp.mutate(id)} onStatusChange={updateAppStatus} type="app" />)}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Web Project */}
      <Dialog open={showCreateWeb} onOpenChange={setShowCreateWeb}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>New Website Project</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Project Name *</Label><Input value={webForm.project_name} onChange={(e) => setWebForm({ ...webForm, project_name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Domain</Label><Input value={webForm.domain} onChange={(e) => setWebForm({ ...webForm, domain: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div><Label className="text-white/60 text-xs">Brief</Label><Textarea value={webForm.brief} onChange={(e) => setWebForm({ ...webForm, brief: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} /></div>
            <Button onClick={() => createWeb.mutate(webForm)} disabled={!webForm.project_name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create App Project */}
      <Dialog open={showCreateApp} onOpenChange={setShowCreateApp}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle>New App Project</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <div><Label className="text-white/60 text-xs">Project Name *</Label><Input value={appForm.project_name} onChange={(e) => setAppForm({ ...appForm, project_name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" /></div>
            <div>
              <Label className="text-white/60 text-xs">Platform</Label>
              <Select value={appForm.platform} onValueChange={(v) => setAppForm({ ...appForm, platform: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="cross_platform">Cross-Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-white/60 text-xs">Brief</Label><Textarea value={appForm.brief} onChange={(e) => setAppForm({ ...appForm, brief: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1" rows={3} /></div>
            <Button onClick={() => createApp.mutate(appForm)} disabled={!appForm.project_name} className="w-full gradient-magenta border-0 text-white hover:opacity-90">Create Project</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}