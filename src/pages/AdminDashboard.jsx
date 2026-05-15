import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Users, Megaphone, BarChart3, DollarSign, Loader2, Search } from "lucide-react";

export default function AdminDashboard() {
  const {user}=useOutletContext()||{};
  const [tab,setTab]=useState("overview");
  const [search,setSearch]=useState("");

  const {data:subs=[]}=useQuery({queryKey:["admin_subs"],queryFn:()=>base44.entities.Subscription.filter({},"-created_date",200)});
  const {data:campaigns=[]}=useQuery({queryKey:["admin_campaigns"],queryFn:()=>base44.entities.MarketingCampaign.filter({},"-created_date",200)});
  const {data:leads=[]}=useQuery({queryKey:["admin_leads"],queryFn:()=>base44.entities.LeadCapture.filter({},"-captured_at",500)});
  const {data:contacts=[]}=useQuery({queryKey:["admin_contacts"],queryFn:()=>base44.entities.MarketingContact.filter({},"-created_date",500)});
  const {data:assets=[]}=useQuery({queryKey:["admin_assets"],queryFn:()=>base44.entities.ContentAsset.filter({},"-created_date",200)});

  if(user?.role!=="admin") return(
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center"><ShieldCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3"/><p className="text-lg font-semibold text-foreground">Admin Access Required</p></div>
    </div>
  );

  const PRICES={Starter:49,Growth:149,Agency:399};
  const activeSubs=subs.filter(s=>s.status==="active");
  const mrr=activeSubs.reduce((s,sub)=>s+(PRICES[sub.plan_name]||0),0);
  const totalSent=campaigns.reduce((s,c)=>s+(c.sent_count||0),0);
  const aiCount=assets.filter(a=>a.ai_generated).length;

  const filteredSubs=subs.filter(s=>!search||(s.owner_email||"").toLowerCase().includes(search.toLowerCase()));

  const Stat=({Icon,label,value,color="text-fuchsia-400 bg-fuchsia-500/10"})=>(
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}><Icon className={`w-4 h-4 ${color.split(" ")[0]}`}/></div>
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );

  return(
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-7 h-7 text-fuchsia-400"/>
        <div><h1 className="text-2xl font-black text-foreground">Admin Dashboard</h1><p className="text-muted-foreground text-sm">MARKETER platform overview</p></div>
      </div>

      <div className="flex gap-2 border-b border-border pb-1">
        {[{v:"overview",l:"Overview"},{v:"subscribers",l:"Subscribers"},{v:"activity",l:"Activity"}].map(t=>(
          <button key={t.v} onClick={()=>setTab(t.v)} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all ${tab===t.v?"text-fuchsia-400 border-b-2 border-fuchsia-500":"text-muted-foreground hover:text-foreground"}`}>{t.l}</button>
        ))}
      </div>

      {tab==="overview"&&(
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat Icon={Users} label="Active Subscribers" value={activeSubs.length}/>
            <Stat Icon={DollarSign} label="Platform MRR" value={`$${mrr.toLocaleString()}`} color="text-emerald-400 bg-emerald-500/10"/>
            <Stat Icon={Megaphone} label="Messages Sent" value={totalSent.toLocaleString()} color="text-purple-400 bg-purple-500/10"/>
            <Stat Icon={BarChart3} label="AI Generations" value={aiCount} color="text-amber-400 bg-amber-500/10"/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat Icon={Users} label="Total Contacts" value={contacts.length} color="text-blue-400 bg-blue-500/10"/>
            <Stat Icon={Users} label="Total Leads" value={leads.length} color="text-pink-400 bg-pink-500/10"/>
            <Stat Icon={Megaphone} label="Total Campaigns" value={campaigns.length} color="text-orange-400 bg-orange-500/10"/>
            <Stat Icon={DollarSign} label="All Subscriptions" value={subs.length} color="text-cyan-400 bg-cyan-500/10"/>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Plan Breakdown</h3>
            <div className="grid grid-cols-3 gap-3">
              {["Starter","Growth","Agency"].map(plan=>{
                const cnt=activeSubs.filter(s=>s.plan_name===plan).length;
                return(<div key={plan} className="text-center p-4 border border-border rounded-xl">
                  <div className="text-2xl font-black text-foreground">{cnt}</div>
                  <div className="text-xs text-muted-foreground">{plan}</div>
                  <div className="text-xs text-emerald-400 mt-0.5">${(cnt*(PRICES[plan]||0)).toLocaleString()}/mo</div>
                </div>);
              })}
            </div>
          </div>
        </div>
      )}

      {tab==="subscribers"&&(
        <div className="space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subscribers…" className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none"/></div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/20 border-b border-border">{["Email","Plan","Status","Joined"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-border">
                {filteredSubs.slice(0,50).map(s=>(
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 text-sm text-foreground">{s.owner_email}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-fuchsia-500/10 text-fuchsia-400 px-2 py-0.5 rounded-full font-medium">{s.plan_name||"Free"}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${s.status==="active"?"bg-emerald-500/10 text-emerald-400":"bg-muted text-muted-foreground"}`}>{s.status}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{s.created_date?new Date(s.created_date).toLocaleDateString():""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSubs.length===0&&<div className="text-center py-8 text-muted-foreground text-sm">No subscribers found</div>}
          </div>
        </div>
      )}

      {tab==="activity"&&(
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {campaigns.slice(0,20).map(c=>(
            <div key={c.id} className="flex items-center gap-3 px-5 py-3">
              <Megaphone className="w-4 h-4 text-fuchsia-400 flex-shrink-0"/>
              <div className="flex-1"><p className="text-sm font-medium text-foreground">{c.name}</p><p className="text-xs text-muted-foreground">{c.type} · {c.sent_count||0} sent</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status==="running"?"bg-emerald-500/10 text-emerald-400":"bg-muted text-muted-foreground"}`}>{c.status}</span>
            </div>
          ))}
          {campaigns.length===0&&<div className="text-center py-8 text-muted-foreground text-sm">No activity yet</div>}
        </div>
      )}
    </div>
  );
}