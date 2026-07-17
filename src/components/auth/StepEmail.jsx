import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * StepEmail — collects email, sends OTP, and detects if user exists.
 */
export default function StepEmail({ onNext, purpose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await base44.functions.invoke("sendAuthOTP", { action: "send", email: normalizedEmail, purpose });
      onNext(normalizedEmail);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20">{error}</div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-300 block mb-1.5">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email" value={email} required autoFocus
            onChange={e => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500 placeholder-slate-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <button type="submit" disabled={loading || !email}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/25">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" />Continue</>}
      </button>
    </form>
  );
}