import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Image, FileText, Video, Trash2, Download, Copy, CheckCircle2, Search, Loader2, Sparkles } from "lucide-react";

const TYPE_ICONS={image:<Image className="w-4 h-4"/>,video:<Video className="w-4 h-4"/>,script:<FileText className="w-4 h-4"/>,ad_copy:<FileText className="w-4 h-4"/>,email_template:<FileText className="w-4 h-4"/>,caption:<FileText className="w-4 h-4"/>,hashtag_set:<FileText className="w-4 h-4"/>};
const TYPE_COLORS={image:"bg-purple-500/10 text-purple-400",video:"bg-red-500/10 text-red-400",script:"bg-blue-500/10 text-blue-400",ad_copy:"bg-amber-500/10 text-amber-400",email_template:"bg-emerald-500/10 text-emerald-400",caption:"bg-pink-500/10 text-pink-400",hashtag_set:"bg-fuchsia-500/10 text-fuchsia-400"};

export default function MediaLibrary() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);
  const [view, setView] = useState("grid");

  const {data:assets=[],isLoading}=useQuery({queryKey:["media_library"],queryFn:()=>base44.entities.ContentAsset.list("-created_date",200)});

  const filtered = assets.filter(a=>{
    const q = search.toLowerCase();
    return (!q||(a.title||"").toLowerCase().includes(q)||(a.platform||"").toLowerCase().includes(q)) && (typeFilter==="all"||a.type===typeFilter);
  });

  const types = [...new Set(assets.map(a=>a.type).filter(Boolean))];

  const copy = async (a) => {
    await navigator.clipboard.writeText(a.content||a.file_url||"");
    setCopiedId(a.id); setTimeout(()=>setCopiedId(null),2000);
  };

  const del = async (id) => {
    if (!confirm("Delete?")) return;
    await base44.entities.ContentAsset.delete(id);
    qc.invalidateQueries(["media_library"]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><Image className="w-6 h-6 text-fuchsia-400"/>Media Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{assets.length} assets saved</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setView("grid")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view==="grid"?"bg-fuchsia-500/10 text-fuchsia-400":"bg-muted text-muted-foreground"}`}>Grid</button>
          <button onClick={()=>setView("list")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${view==="list"?"bg-fuchsia-500/10 text-fuchsia-400":"bg-muted text-muted-foreground"}`}>List</button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assets…" className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none">
          <option value="all">All Types</option>
          {types.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
        </select>
      </div>

      {isLoading?<div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground"/></div>
      :filtered.length===0?(
        <div className="flex flex-col items-center py-16 text-center bg-card border border-border rounded-2xl">
          <Sparkles className="w-10 h-10 text-muted-foreground/20 mb-3"/>
          <p className="text-foreground font-medium">{assets.length===0?"No assets yet":"No assets match filters"}</p>
          <p className="text-xs text-muted-foreground mt-1">Use Media Studio or Script Writer to generate and save content</p>
        </div>
      ):view==="grid"?(
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(a=>(
            <div key={a.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-fuchsia-500/30 transition-all">
              {a.file_url&&a.type==="image"?(
                <div className="aspect-square bg-muted overflow-hidden"><img src={a.file_url} alt={a.title} className="w-full h-full object-cover"/></div>
              ):(
                <div className={`aspect-square flex items-center justify-center ${TYPE_COLORS[a.type]||"bg-muted text-muted-foreground"}`}>
                  <div className="text-center p-4">{TYPE_ICONS[a.type]||<FileText className="w-8 h-8 mx-auto"/>}<p className="text-xs font-medium mt-2">{a.type?.replace(/_/g," ")}</p></div>
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground truncate">{a.title||"Untitled"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.platform||"General"} {a.ai_generated?"· AI":""}</p>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={()=>copy(a)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium ${copiedId===a.id?"bg-emerald-500/10 text-emerald-400":"bg-muted text-muted-foreground hover:text-foreground"}`}>{copiedId===a.id?"✓ Copied":"Copy"}</button>
                  {a.file_url&&<a href={a.file_url} download className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground text-center">Save</a>}
                  <button onClick={()=>del(a.id)} className="px-2 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map(a=>(
              <div key={a.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20">
                <div className={`w-8 h-8 rounded-lg ${TYPE_COLORS[a.type]||"bg-muted"} flex items-center justify-center flex-shrink-0`}>{TYPE_ICONS[a.type]||<FileText className="w-4 h-4"/>}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.title||"Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{a.type?.replace(/_/g," ")} · {a.platform||"General"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>copy(a)} className={`p-1.5 rounded-lg ${copiedId===a.id?"text-emerald-400":"text-muted-foreground hover:text-foreground"}`}><Copy className="w-3.5 h-3.5"/></button>
                  {a.file_url&&<a href={a.file_url} download className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"><Download className="w-3.5 h-3.5"/></a>}
                  <button onClick={()=>del(a.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
