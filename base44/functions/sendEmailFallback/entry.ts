import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * sendEmailFallback — Sends transactional emails.
 * Primary: Base44 Core.SendEmail
 * Fallback: SendGrid (SENDGRID_API_KEY)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, subject, body, from_name } = await req.json();
    if (!to || !subject || !body) {
      return Response.json({ error: 'to, subject, and body are required' }, { status: 400 });
    }

    // Try Base44 SendEmail first
    try {
      await base44.integrations.Core.SendEmail({ to, subject, body, from_name });
      return Response.json({ success: true, provider: 'base44' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    } catch (base44Error) {
      // Fall back to SendGrid
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
      if (!sendgridKey) throw base44Error;

      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'noreply@agentmarketer.ai', name: from_name || 'AEVOICE' },
          subject,
          content: [{ type: 'text/plain', value: body }],
        }),
      });

      if (!sgRes.ok) {
        const errText = await sgRes.text();
        throw new Error(`SendGrid fallback failed: ${errText}`);
      }

      return Response.json({ success: true, provider: 'sendgrid' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});