import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderOpen, Plus, Search, Image, Video, FileText, Download, Trash2, Copy, Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/ui/PageHeader";
import GlassCard from "@/components/ui/GlassCard";

const typeIcons = { image: Image, video: Video, audio: FileText, document: FileText, font: FileText, logo: Image };

export default function MediaLibrary() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(null);
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["media-library"],
    queryFn: () => base44.entities.MediaLibraryItem.list("-created_date", 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaLibraryItem.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media-library"] }),
  });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split(".").pop().toLowerCase();
    const fileType = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ? "image" : ["mp4", "mov", "webm"].includes(ext) ? "video" : "document";
    await base44.entities.MediaLibraryItem.create({
      title: file.name,
      file_url,
      file_type: fileType,
      file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
    });
    qc.invalidateQueries({ queryKey: ["media-library"] });
    setUploading(false);
    setShowUpload(false);
  };

  const copyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = items.filter(i => {
    const matchSearch = !search || i.title?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || i.file_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader title="Media Library" subtitle={`${items.length} assets`} actions={
        <Button onClick={() => setShowUpload(true)} className="gradient-magenta border-0 text-white hover:opacity-90">
          <Upload className="w-4 h-4 mr-2" /> Upload
        </Button>
      } />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.length === 0 && (
          <GlassCard className="col-span-full text-center py-12">
            <FolderOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No assets found</p>
          </GlassCard>
        )}
        {filtered.map(item => {
          const TypeIcon = typeIcons[item.file_type] || FileText;
          return (
            <GlassCard key={item.id} className="p-0 overflow-hidden">
              {item.file_type === "image" && item.file_url ? (
                <div className="h-40 bg-white/5 flex items-center justify-center overflow-hidden">
                  <img src={item.file_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-40 bg-white/5 flex items-center justify-center">
                  <TypeIcon className="w-10 h-10 text-white/10" />
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-white/10 text-white/40">{item.file_type}</Badge>
                  {item.ai_generated && <Badge className="bg-magenta/10 text-magenta border-magenta/20 text-xs">AI</Badge>}
                  {item.file_size_mb && <span className="text-xs text-white/30">{item.file_size_mb}MB</span>}
                </div>
                <div className="flex gap-1 mt-3">
                  {item.file_url && (
                    <Button variant="ghost" size="icon" onClick={() => copyUrl(item.file_url, item.id)} className="h-7 w-7 text-white/30 hover:text-white">
                      {copied === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-white"><Download className="w-3.5 h-3.5" /></Button>
                    </a>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} className="h-7 w-7 text-white/30 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="bg-[#161616] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle>Upload Asset</DialogTitle></DialogHeader>
          <div className="mt-4">
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-magenta/30 transition-colors">
              <Upload className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">{uploading ? "Uploading..." : "Click to upload a file"}</p>
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}