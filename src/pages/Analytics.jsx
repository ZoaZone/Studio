import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, TrendingUp, Users, Megaphone, Share2, GitBranch, Zap } from "lucide-react";

export default function Analytics() {
  const {data:campaigns=[]}=useQuery({queryKey:["campaigns_a"],queryFn:()=>base44.entities.MarketingCampaign.list(null,200)});
  const {data:contacts=[]}=useQuery({queryKey:["contacts_a"],queryFn:()=>base44.entities.MarketingContact.list(null,500)});
  const {data:leads=[]}=useQuery({queryKey:["leads_a"],queryFn:()=>base44.entities.LeadCapture.list(null,500)});
  const {data:posts=[]}=useQuery({queryKey:["posts_a"],queryFn:()=>base44.entities.ScheduledPost.list(null,200)});
  const {data:funnels=[]}=useQuery({queryKey:["funnels_a"],queryFn:()=>base44.entities.Funnel.list(null,50)});
  const {data:assets=[]}=useQuery({queryKey:["assets_a"],queryFn:()=>base44.entities.ContentAsset.list(null,200)});

  const totalSent=campaigns.reduce((s,c)=>s+(c.sent_count||0),0);
  const totalOpens=campaigns.reduce((s,c)=>s+(c.open_count||0),0);
  const totalClicks=campaigns.reduce((s,c)=>s+(c.click_count||0),0);
  const openRate=totalSent>0?((totalOpens/totalSent)*100).toFixed(1):0;
  const ctr=totalSent>0?((totalClicks/totalSent)*100).toFixed(1):0;
  const byChannel=campaigns.reduce((acc,c)=>{acc[c.type]=(acc[c.type]||0)+1;return acc;},{});
  const byLeadSource=leads.reduce((acc,l)=>{acc[l.source]=(acc[l.source]||0)+1;return acc;},{});
  const byPlatform=posts.reduce((acc,p)=>{acc[p.platform]=(acc[p.platform]||0)+1;return acc;},{});
  const postedCount=posts.filter(p=>p.status==="posted").length;
  const aiCount=assets.filter(a=>a.ai_generated).length;

  const Stat=({Icon,label,value,sub,color="text-fuchsia-400 bg-fuchsia-500/10"})=>(
    <div className="bg-card border border-border rounded-2xl p-5">
      <Icon className={`w-5 h-5 ${color.split(" ")[0]} mb-3`}/>
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-sm text-foreground/70 font-medium">{label}</div>
      {sub&&<div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );

  const Bar=({label,value,total,color="bg-gradient-to-r from-fuchsia-500 to-purple-600"})=>(
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground capitalize w-28 truncate">{label.replace(/_/g," ")}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5"><div className={`${color} h-1.5 rounded-full`} style={{width:`${Math.min(total>0?(value/total)*100:0,100)}%`}}/></div>
      <span className="text-xs font-semibold text-foreground w-6 text-right">{value}</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2"><BarChart3 className="w-6 h-6 text-fuchsia-400"/>Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Performance across campaigns, social, funnels and leads</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat Icon={Users} label="Total Contacts" value={contacts.length} sub={`${contacts.filter(c=>c.opted_in_email).length} email opt-in`}/>
        <Stat Icon={Megaphone} label="Campaigns" value={campaigns.length} sub={`${campaigns.filter(c=>c.status==="running").length} active`} color="text-purple-400 bg-purple-500/10"/>
        <Stat Icon={Zap} label="Messages Sent" value={totalSent.toLocaleString()} color="text-pink-400 bg-pink-500/10"/>
        <Stat Icon={TrendingUp} label="Total Leads" value={leads.length} sub={`${leads.filter(l=>l.funnel_id).length} in funnels`} color="text-amber-400 bg-amber-500/10"/>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Campaign Performance</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[{l:"Open Rate",v:`${openRate}%`,c:"text-emerald-400"},{l:"Click-Through",v:`${ctr}%`,c:"text-blue-400"},{l:"Total Opens",v:totalOpens.toLocaleString(),c:"text-fuchsia-400"},{l:"Total Clicks",v:totalClicks.toLocaleString(),c:"text-amber-400"}].map(s=>(
              <div key={s.l} className="p-3 bg-muted/20 rounded-xl">
                <div className={`text-xl font-black ${s.c}`}>{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By Channel</p>
          <div className="space-y-2">
            {Object.entries(byChannel).map(([ch,cnt])=><Bar key={ch} label={ch} value={cnt} total={campaigns.length}/>)}
            {Object.keys(byChannel).length===0&&<p className="text-muted-foreground text-xs">No campaigns yet</p>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Lead Sources</h3>
          <div className="space-y-2 mb-5">
            {Object.entries(byLeadSource).sort((a,b)=>b[1]-a[1]).map(([src,cnt])=><Bar key={src} label={src} value={cnt} total={leads.length} color="bg-gradient-to-r from-amber-500 to-orange-600"/>)}
            {leads.length===0&&<p className="text-muted-foreground text-xs">No leads yet</p>}
          </div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Social Media</p>
          <div className="grid grid-cols-3 gap-2">
            {[{l:"Total Posts",v:posts.length},{l:"Posted",v:postedCount},{l:"AI Assets",v:aiCount}].map(s=>(
              <div key={s.l} className="text-center p-2 bg-muted/20 rounded-xl">
                <div className="text-lg font-black text-foreground">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Funnels</h3>
        {funnels.length===0?<p className="text-muted-foreground text-sm">No funnels yet</p>:(
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {funnels.map(f=>(
              <div key={f.id} className="p-4 border border-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <span className="text-xs text-emerald-400 font-semibold">{f.conversion_rate||0}%</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">{f.total_leads||0} leads → {f.converted_leads||0} converted</div>
                <div className="bg-muted rounded-full h-1.5"><div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-1.5 rounded-full" style={{width:`${Math.min(f.conversion_rate||0,100)}%`}}/></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
