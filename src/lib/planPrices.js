// Canonical monthly USD prices, keyed by Subscription.plan_tier. Mirrors
// base44/functions/stripeCheckoutCREAM/entry.ts's PLANS map (the source of
// truth) and base44/functions/recordCommission/entry.ts's PRICES map — Deno
// functions can't import frontend modules (separate deployment boundaries),
// so those two stay in sync with this file by comment discipline. Any
// frontend code that needs a plan's price (e.g. admin MRR) should import
// this instead of hardcoding its own copy.
export const PLAN_PRICES = {
  creator: 19, starter: 49, growth: 149, agency: 399,
  indie: 99, studio: 399, dubbing_house: 499, enterprise: 1499,
  byok: 49,
};

export const PLAN_NAMES = {
  creator: "Creator", starter: "Starter", growth: "Growth", agency: "Agency",
  indie: "Indie", studio: "Studio", dubbing_house: "Dubbing House", enterprise: "Enterprise",
  byok: "BYOK",
};
