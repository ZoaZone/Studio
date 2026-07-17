// Tiers that entitle a user to bring their own Replicate/ElevenLabs/LLM key
// for Lane-2 jobs: the dedicated BYOK add-on, or any Lane-2 (Movie Maker
// Pro) subscription tier. Lane 1 (Business) tiers never touch a paid
// external provider, so they don't need this. Mirrors the Deno-side copy of
// this same list duplicated in submitVideo/submitMusic/submitDubAudio/
// submitDubVideo's entry.ts (function deployments can't share a frontend
// module, so those stay in sync by comment discipline).
export const BYOK_ENTITLED_TIERS = ["byok", "indie", "studio", "dubbing_house", "enterprise"];

// Same "real, active subscription" test as Billing.jsx's isPaidPlan, plus
// the BYOK-specific tier check.
export function isByokEntitled(subscription) {
  return !!subscription
    && ["active", "trialing"].includes(subscription.status)
    && BYOK_ENTITLED_TIERS.includes(subscription.plan_tier);
}

// Real (Lane 2) motion video for the AI Walkthrough is a paid feature.
// Higher tiers get true generated video; free / low tiers fall back to
// the standard Lane 1 still-image (Ken Burns) walkthrough. Same "real,
// active subscription" test as Billing.jsx's isPaidPlan (any non-free
// tier with an active or trialing subscription).
export function isRealVideoEntitled(subscription) {
  return !!subscription
  && ["active", "trialing"].includes(subscription.status)
  && subscription.plan_tier
  && subscription.plan_tier !== "free";
}
