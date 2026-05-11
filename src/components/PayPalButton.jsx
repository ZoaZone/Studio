import { useState } from "react";
import { base44 } from "@/api/base44Client";

const PAYPAL_FUNCTION_URL = "https://aeva-91fddc64.base44.app/functions/paypalCheckout";

/**
 * PayPalButton — drop-in PayPal payment button for Indian business payments
 * Props:
 *   amount       — number (e.g. 999)
 *   currency     — "INR" | "USD" | etc. (default: "INR")
 *   description  — string (e.g. "AEVOICE Mini Plan")
 *   planName     — string (e.g. "Aeva Mini")
 *   sourceApp    — string (e.g. "hellobiz", "cream", "aevathon", "matrimony")
 *   onSuccess    — callback(orderId, captureId)
 *   onCancel     — callback()
 */
export default function PayPalButton({
  amount,
  currency = "INR",
  description = "Payment",
  planName = "",
  sourceApp = "unknown",
  customerEmail = "",
  onSuccess,
  onCancel,
  className = "",
  label = "Pay with PayPal",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create order on backend
      const res = await fetch(PAYPAL_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_order",
          amount,
          currency,
          description,
          plan_name: planName,
          source_app: sourceApp,
          customer_email: customerEmail,
          return_url: `${window.location.origin}/PaymentSuccess`,
          cancel_url: `${window.location.origin}/PaymentCancel`,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.approve_url) {
        throw new Error(data.error?.message || data.error || "Failed to create PayPal order");
      }
      // 2. Redirect to PayPal approval page
      window.location.href = data.approve_url;
    } catch (err) {
      setError(err.message || "PayPal error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-3 bg-[#FFC439] hover:bg-[#f0b429] text-[#003087] font-bold px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <svg className="animate-spin w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#003087">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
          </svg>
        )}
        {loading ? "Redirecting to PayPal..." : label}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center max-w-xs">{error}</p>
      )}
      <p className="text-gray-400 text-xs flex items-center gap-1">
        <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
        Secured by PayPal · India payments accepted
      </p>
    </div>
  );
}
