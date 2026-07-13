import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const APP_URL = 'https://digitalstudios.app';

// Canonical prices for every self-serve plan — cents, USD. This is the
// single source of truth Pricing.jsx displays and recordCommission's PRICES
// map mirrors for affiliate commission math; keep all three in sync.
// Yearly = monthly × 12 × 0.8 (20% off), rounded to the nearest dollar.
// Lane-2 Enterprise ($1,499+/mo) is deliberately absent — negotiated/custom
// pricing, "Contact Sales" only, never a self-serve Stripe Checkout plan.
const PLANS: Record<string, { name: string; price_monthly: number; price_yearly: number; tier: string }> = {
  // Lane 1 — Business (pooled Base44 credits + fallback LLMs)
  creator: { name: 'Creator', price_monthly: 1900,  price_yearly: 18200,  tier: 'creator' },
  starter: { name: 'Starter', price_monthly: 4900,  price_yearly: 47000,  tier: 'starter' },
  growth:  { name: 'Growth',  price_monthly: 14900, price_yearly: 143000, tier: 'growth' },
  agency:  { name: 'Agency',  price_monthly: 39900, price_yearly: 383000, tier: 'agency' },
  // Lane 2 — Movie Maker Pro (weighted render-credits via the external worker)
  indie:         { name: 'Indie',         price_monthly: 9900,  price_yearly: 95000,  tier: 'indie' },
  studio:        { name: 'Studio',        price_monthly: 39900, price_yearly: 383000, tier: 'studio' },
  dubbing_house: { name: 'Dubbing House', price_monthly: 49900, price_yearly: 479000, tier: 'dubbing_house' },
  // BYOK — platform-access fee only; the user's own provider keys do the rest
  byok: { name: 'BYOK', price_monthly: 4900, price_yearly: 47000, tier: 'byok' },
};

async function stripeRequest(endpoint: string, body: Record<string, unknown> | URLSearchParams) {
  const res = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body instanceof URLSearchParams ? body : new URLSearchParams(body as Record<string, string>),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Real Stripe Checkout has no webhook receiver in this codebase — the
    // browser is the only thing that reliably learns a session completed,
    // via the success_url redirect. Billing.jsx calls this action with the
    // session_id it's redirected back with; we verify with Stripe directly
    // (never trust the redirect alone) and flip the pre-created Subscription
    // from "pending" to "active". Affiliate commissions only ever fire off
    // an active Subscription (see recordCommission), so this is also the
    // gate that makes the Stripe side of the affiliate program correct.
    if (body?.action === 'confirm') {
      const sessionId = body?.session_id;
      if (!sessionId) return Response.json({ error: 'session_id is required.' }, { status: 400 });
      if (!STRIPE_KEY) return Response.json({ error: 'Stripe is not configured.' }, { status: 500 });

      const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${STRIPE_KEY}` },
      });
      const session = await sessionRes.json();
      if (!sessionRes.ok) return Response.json({ error: session?.error?.message || 'Could not verify session.' }, { status: 400 });
      if (session.payment_status !== 'paid' && session.status !== 'complete') {
        return Response.json({ success: true, confirmed: false });
      }
      if (session.metadata?.user_email && session.metadata.user_email !== user.email) {
        return Response.json({ error: 'Session does not belong to this user.' }, { status: 403 });
      }

      const pending = await base44.entities.Subscription.filter({ owner_email: user.email, status: 'pending' }, '-created_date', 1);
      const sub = pending[0];
      if (!sub) {
        // Already confirmed by an earlier call, or nothing pending — either
        // way there's nothing left to do.
        return Response.json({ success: true, confirmed: false });
      }

      await base44.entities.Subscription.update(sub.id, {
        status: 'active',
        stripe_customer_id: session.customer || sub.stripe_customer_id || '',
        stripe_subscription_id: session.subscription || sub.stripe_subscription_id || '',
      });

      return Response.json({ success: true, confirmed: true, subscription_id: sub.id });
    }

    const { plan, billing = 'monthly', client_id } = body;
    const selectedPlan = PLANS[plan];
    if (!selectedPlan) return Response.json({ error: 'Invalid plan' }, { status: 400 });

    if (!STRIPE_KEY) {
      // No Stripe key — create subscription record directly (demo/PayPal mode)
      const sub = await base44.entities.Subscription.create({
        owner_email: user.email,
        client_id: client_id || '',
        plan_name: selectedPlan.name,
        plan_tier: selectedPlan.tier,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      return Response.json({ success: true, subscription_id: sub.id, message: `Subscribed to ${selectedPlan.name}`, demo: true });
    }

    const amount = billing === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly;

    // Create Stripe checkout session
    const params = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': `digitalstudios.app ${selectedPlan.name}`,
      'line_items[0][price_data][recurring][interval]': billing === 'yearly' ? 'year' : 'month',
      'line_items[0][price_data][unit_amount]': String(amount),
      'line_items[0][quantity]': '1',
      mode: 'subscription',
      customer_email: user.email,
      success_url: `${APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${APP_URL}/pricing`,
      'metadata[plan]': plan,
      'metadata[user_email]': user.email,
      'metadata[billing]': billing,
      // Stripe Tax — every price on the pricing page is shown "+ applicable
      // taxes"; this is what actually calculates and applies it. Requires
      // Stripe Tax to be activated on the Stripe Dashboard (Settings > Tax)
      // with an origin address configured — a manual, one-time step outside
      // this codebase. Without that activation, Stripe rejects the request.
      'automatic_tax[enabled]': 'true',
      billing_address_collection: 'required',
    });

    const session = await stripeRequest('checkout/sessions', params);

    if (!session.url) return Response.json({ error: session.error?.message || 'Stripe session creation failed' }, { status: 500 });

    // Pre-create subscription record (will be confirmed by webhook or on success page)
    await base44.entities.Subscription.create({
      owner_email: user.email,
      client_id: client_id || '',
      plan_name: selectedPlan.name,
      plan_tier: selectedPlan.tier,
      stripe_customer_id: session.customer || '',
      stripe_subscription_id: session.subscription || '',
      status: 'pending',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return Response.json({ success: true, checkout_url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});