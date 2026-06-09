import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Building2, Plus, Palette, Globe, Mail, Phone, Users, Mic2,
  Pencil, Trash2, CheckCircle2, Star, X, Loader2, ChevronRight,
  Briefcase, Tag, Zap
} from "lucide-react";

const INDUSTRIES = [
  "E-commerce","Fashion & Apparel","Food & Beverage","Health & Wellness",
  "Technology","Real Estate","Education","Finance","Travel & Hospitality",
  "Beauty & Cosmetics","Fitness","Entertainment","Professional Services","Other"
];

const BRAND_VOICES = [
  "Professional & Authoritative","Friendly & Conversational","Bold & Energetic",
  "Luxury & Sophisticated","Playful & Humorous","Inspirational & Motivating",
  "Empathetic & Supportive","Educational & Informative"
];

const TIER_LIMITS = { starter: 1, pro: 3, agency: 10 };

export default function BrandManager() {
  const { user, userTier = "starter" } = useOutletContext() || {};
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", tagline: "", industry: "", logo_url: "", primary_color: "#7c3aed",
    secondary_color: "#a855f7", accent_color: "#ec4899", brand_voice: "",
    target_audience: "", website: "", email: "", phone: ""
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["brands", user?.id],
    queryFn: () => base44.entities.Brand.list("-created_date", 20),
    enabled: !!user,
  });

  const maxBrands = TIER_LIMITS[userTier] || 1;
  const canAddMore = brands.length < maxBrands;

  const openNew = () => {
    setEditing(null);
    setForm({ name:"",tagline:"",industry:"",logo_url:"",primary_color:"#7c3aed",secondary_color:"#a855f7",accent_color:"#ec4899",brand_voice:"",target_audience:"",website:"",email:"",phone:"" });
    setShowForm(true);
  };

  const openEdit = (b) => {
    setEditing(b.id);
    setForm({ name:b.name||"",tagline:b.tagline||"",industry:b.industry||"",logo_url:b.logo_url||"",primary_color:b.primary_color||"#7c3aed",secondary_color:b.secondary_color||"#a855f7",accent_color:b.accent_color||"#ec4899",brand_voice:b.brand_voice||"",target_audience:b.target_audience||"",website:b.website||"",email:b.email||"",phone:b.phone||"" });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) {
        await base44.entities.Brand.update(editing, form);
      } else {
        await base44.entities.Brand.create({ ...form, owner_id: user?.id, is_active: true });
      }
      qc.invalidateQueries(["brands"]);
      setShowForm(false);
    } catch (e) { alert(e.message); }
    setSaving(false);
  };

  const deleteBrand = async (id) => {
    if (!confirm("Delete this brand? This cannot be undone.")) return;
    await base44.entities.Brand.delete(id);
    qc.invalidateQueries(["brands"]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-fuchsia-400" /> Brand Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your brands — {brands.length}/{maxBrands} used on <span className="capitalize text-fuchsia-400">{userTier}</span> plan
          </p>
        </div>
        <button
          onClick={openNew}
          disabled={!canAddMore}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {!canAddMore && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-semibold text-sm">Brand limit reached</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Your {userTier} plan supports up to {maxBrands} brand{maxBrands>1?"s":""}. Upgrade to Pro (3 brands) or Agency (10 brands) for more.
            </p>
          </div>
        </div>
      )}

      {/* Brand Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" /></div>
      ) : brands.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground font-medium">No brands yet</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Create your first brand to start publishing campaigns</p>
          <button onClick={openNew} className="mt-4 px-5 py-2 rounded-xl bg-fuchsia-600 text-white text-sm font-bold hover:bg-fuchsia-500 transition">
            + Create Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brands.map(b => (
            <div key={b.id} className="bg-card border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group">
              {/* Color bar */}
              <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${b.primary_color||"#7c3aed"}, ${b.secondary_color||"#a855f7"}, ${b.accent_color||"#ec4899"})` }} />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {b.logo_url ? (
                      <img src={b.logo_url} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black text-white" style={{ background: `linear-gradient(135deg, ${b.primary_color||"#7c3aed"}, ${b.secondary_color||"#a855f7"})` }}>
                        {(b.name||"B")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-foreground">{b.name}</h3>
                      {b.tagline && <p className="text-muted-foreground text-xs mt-0.5">{b.tagline}</p>}
                      {b.industry && <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{b.industry}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteBrand(b.id)} className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {b.website && <div className="flex items-center gap-1.5"><Globe className="w-3 h-3" /><span className="truncate">{b.website}</span></div>}
                  {b.email && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3" /><span className="truncate">{b.email}</span></div>}
                  {b.target_audience && <div className="flex items-center gap-1.5 col-span-2"><Users className="w-3 h-3" /><span className="truncate">{b.target_audience}</span></div>}
                  {b.brand_voice && <div className="flex items-center gap-1.5 col-span-2"><Mic2 className="w-3 h-3" /><span className="truncate">{b.brand_voice}</span></div>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {[b.primary_color, b.secondary_color, b.accent_color].filter(Boolean).map((c,i) => (
                      <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ background: c }} title={c} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">Brand colors</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-black text-foreground">{editing ? "Edit Brand" : "New Brand"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Brand Name *</label>
                  <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Zoa Zone" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Tagline</label>
                  <input value={form.tagline} onChange={e=>setForm({...form,tagline:e.target.value})} placeholder="Your brand tagline" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Industry</label>
                  <select value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              {/* Colors */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Brand Colors</label>
                <div className="flex gap-4">
                  {[["primary_color","Primary"],["secondary_color","Secondary"],["accent_color","Accent"]].map(([k,l])=>(
                    <div key={k} className="flex items-center gap-2">
                      <input type="color" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                      <span className="text-xs text-muted-foreground">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Voice & Audience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Brand Voice</label>
                  <select value={form.brand_voice} onChange={e=>setForm({...form,brand_voice:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500">
                    <option value="">Select tone</option>
                    {BRAND_VOICES.map(v=><option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Target Audience</label>
                  <input value={form.target_audience} onChange={e=>setForm({...form,target_audience:e.target.value})} placeholder="e.g. Women 25–45 interested in wellness" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Website</label>
                  <input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} placeholder="https://..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Brand Email</label>
                  <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="hello@brand.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+1 555 000 0000" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Logo URL</label>
                <input value={form.logo_url} onChange={e=>setForm({...form,logo_url:e.target.value})} placeholder="https://your-logo.png" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-fuchsia-500" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-muted-foreground text-sm font-semibold hover:bg-white/10 transition">Cancel</button>
              <button onClick={save} disabled={saving||!form.name} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editing ? "Save Changes" : "Create Brand"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
