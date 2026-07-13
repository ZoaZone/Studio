import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OTPInput from "./OTPInput";

/**
 * StepVerifyOTP — shows 6-box OTP entry, verifies via backend.
 */
export default function StepVerifyOTP({ email, purpose, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) return;
    setError("");
    setLoading(true);
    try {
      await base44.functions.invoke("sendAuthOTP", { action: "verify", email, otp, purpose });
      onVerified();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Incorrect code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    setResent(false);
    try {
      await base44.functions.invoke("sendAuthOTP", { action: "send", email, purpose });
      setResent(true);
      setOtp("");
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // Auto-submit when all 6 digits entered
  const handleOTPChange = (val) => {
    setOtp(val);
    if (val.length === 6) {
      setTimeout(() => {
        setError("");
        setLoading(true);
        base44.functions.invoke("sendAuthOTP", { action: "verify", email, otp: val, purpose })
          .then(() => onVerified())
          .catch(err => setError(err?.response?.data?.error || "Incorrect code. Please try again."))
          .finally(() => setLoading(false));
      }, 200);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-xs text-slate-400">We sent a 6-digit code to</p>
        <p className="text-sm font-semibold text-white mt-0.5">{email}</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20 text-center">{error}</div>
      )}
      {resent && (
        <div className="p-3 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-center">New code sent!</div>
      )}

      <OTPInput value={otp} onChange={handleOTPChange} disabled={loading} />

      <button onClick={handleVerify} disabled={loading || otp.length < 6}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-violet-500/25">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
      </button>

      <div className="flex items-center justify-between text-xs">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition-colors">
          ← Change email
        </button>
        <button onClick={handleResend} disabled={resending}
          className="flex items-center gap-1 text-slate-500 hover:text-violet-400 transition-colors disabled:opacity-50">
          {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Resend code
        </button>
      </div>
    </div>
  );
}