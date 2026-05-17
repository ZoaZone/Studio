import { useState } from "react";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * StepSetPassword — used for signup (set new password) and password reset.
 */
export default function StepSetPassword({ onSubmit, loading, label = "Set password", requireName = false }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (requireName && !name.trim()) { setError("Please enter your full name."); return; }
    setError("");
    onSubmit({ password, name });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>
      )}

      {requireName && (
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5">Full Name</label>
          <input type="text" value={name} required autoFocus
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500 transition-colors"
            placeholder="Your full name" />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-300 block mb-1.5">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type={show ? "text" : "password"} value={password} required
            onChange={e => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500 transition-colors"
            placeholder="Min. 8 characters" />
          <button type="button" onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-300 block mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type={show ? "text" : "password"} value={confirm} required
            onChange={e => setConfirm(e.target.value)}
            className="w-full pl-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500 transition-colors"
            placeholder="Re-enter password" />
        </div>
      </div>

      {/* Password strength indicator */}
      {password.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[8, 12, 16].map(len => (
              <div key={len} className={`h-1 flex-1 rounded-full transition-all ${password.length >= len ? "bg-violet-500" : "bg-slate-700"}`} />
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {password.length < 8 ? "Too short" : password.length < 12 ? "Good" : password.length < 16 ? "Strong" : "Very strong"}
          </p>
        </div>
      )}

      <button type="submit" disabled={loading || !password || !confirm}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/25">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
      </button>
    </form>
  );
}