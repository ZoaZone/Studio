import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * sendEmailFallback — Sends transactional emails to ANY external address.
 * Primary:  Resend (RESEND_API_KEY)
 * Fallback: SendGrid (SENDGRID_API_KEY)
 *
 * Used for: beta invites, approval emails, admin notifications.
 * Base44 Core.SendEmail is NOT used here — it blocks external recipients.
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

    const fromName = from_name || 'AEVOICE';
    const fromEmail = 'noreply@aevoice.ai';
    const htmlContent = html || `<pre style="font-family:sans-serif;white-space:pre-wrap">${body}</pre>`;

    // ── PRIMARY: Resend ──────────────────────────────────────────────────────
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          text: body,
          html: htmlContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return Response.json(
          { success: true, provider: 'resend', id: data.id, to },
          { headers: { 'Access-Control-Allow-Origin': '*' } }
        );
      }

      const errText = await res.text();
      console.error(`Resend failed (${res.status}): ${errText} — falling back to SendGrid`);
    } else {
      console.warn('RESEND_API_KEY not set — skipping to SendGrid fallback');
    }

    // ── FALLBACK: SendGrid ───────────────────────────────────────────────────
    const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridKey) {
      return Response.json(
        { error: 'No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY.' },
        { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const sgPayload: any = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [
        { type: 'text/plain', value: body },
        { type: 'text/html', value: htmlContent },
      ],
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sgPayload),
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
