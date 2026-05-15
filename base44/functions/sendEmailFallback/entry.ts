import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * sendEmailFallback — Sends transactional emails to ANY address via SendGrid.
 * Base44's Core.SendEmail only works for registered app users, so this function
 * is the correct path for all external/beta invite emails.
 *
 * Requires env secret: SENDGRID_API_KEY
 * From address: noreply@aevoice.ai (must be verified in SendGrid)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Auth check — only logged-in admins can trigger invite emails
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, {
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { to, subject, body, html, from_name } = await req.json();
    if (!to || !subject || !body) {
      return Response.json({ error: 'to, subject, and body are required' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridKey) {
      return Response.json(
        { error: 'SENDGRID_API_KEY is not configured. Add it in Settings → API Keys.' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@aevoice.ai';

    const payload: any = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: from_name || 'AEVOICE' },
      subject,
      content: [
        { type: 'text/plain', value: body },
      ],
    };

    // Optional HTML version
    if (html) {
      payload.content.push({ type: 'text/html', value: html });
    }

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text();
      throw new Error(`SendGrid error ${sgRes.status}: ${errText}`);
    }

    return Response.json(
      { success: true, provider: 'sendgrid', to },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('sendEmailFallback error:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
