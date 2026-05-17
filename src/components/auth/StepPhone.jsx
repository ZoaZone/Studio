import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Smartphone } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+60", label: "🇲🇾 +60" },
  { code: "+27", label: "🇿🇦 +27" },
];

/**
 * StepPhone — phone number entry step.
 * Sends OTP via email fallback using phone as identifier.
 * (SMS gateway can be wired later; for now we use phone as the email key.)
 */
export default function StepPhone({ purpose, onNext }) {
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Please enter a valid mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const fullPhone = `${countryCode}${digits}`;
      // Use phone as email-like identifier — OTP sent via email if email on record,
      // or stored for verification. Pass phone as email field to reuse OTP backend.
      await base44.functions.invoke("sendAuthOTP", {
        action: "send",
        email: `${digits}@phone.aevoice.ai`, // synthetic key for phone-based OTP
        purpose,
      });
      onNext(`${digits}@phone.aevoice.ai`);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">Mobile Number</label>
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={e => setCountryCode(e.target.value)}
            className="h-10 px-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/50 shrink-0"
          >
            {COUNTRY_CODES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^\d\s\-]/g, ""))}
              placeholder="98765 43210"
              autoComplete="tel"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <p className="text-[11px] text-slate-500">
        We'll send a verification code to confirm your number.
      </p>

      <button
        type="submit"
        disabled={loading || !phone.trim()}
        className="w-full h-10 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</> : "Send Verification Code"}
      </button>
    </form>
  );
}