import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const APP_URL = 'https://media.aevoice.ai';

function generateToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function buildHtml(inviteUrl, inviteCode, note, firstName) {
  const greeting = firstName ? ('Hi ' + firstName + ',') : 'Hello,';
  const noteBlock = note
    ? '<div style="background:#1a1030;border-left:3px solid #a855f7;border-radius:8px;padding:14px 16px;margin-bottom:20px;"><p style="color:#ccc;font-size:14px;margin:0;font-style:italic;">"' + note + '"</p><p style="color:#666;font-size:12px;margin:6px 0 0;">— The AEVOICE Team</p></div>'
    : '';

  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>' +
    '<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">' +
    '<tr><td align="center">' +
    '<table width="560" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:20px;border:1px solid #1f1f2e;overflow:hidden;max-width:560px;width:100%;">' +

    // Header
    '<tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);padding:32px 40px;text-align:center;">' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.6);text-transform:uppercase;margin-bottom:8px;">AEVOICE</div>' +
    '<div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">media.aevoice.ai</div>' +
    '<div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:4px;">AI Marketing & Media Creation Platform</div>' +
    '</td></tr>' +

    // Body
    '<tr><td style="padding:36px 40px;">' +
    '<p style="color:#aaa;font-size:15px;margin:0 0 6px;">' + greeting + '</p>' +
    '<h1 style="color:#fff;font-size:22px;font-weight:800;margin:0 0 16px;line-height:1.3;">' +
    'You\'ve been approved for<br/><span style="color:#a855f7;">AEVOICE Beta Access</span></h1>' +
    '<p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;">You\'ve been personally selected for exclusive early access — enjoy full <strong style="color:#ccc;">Agency-tier access, free for 1 year</strong>. Click below to set your password and get started.</p>' +
    noteBlock +

    // Feature list
    '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">' +
    '<tr><td style="padding:5px 0;color:#bbb;font-size:13px;">✅&nbsp; Full Agency-tier — all features unlocked</td></tr>' +
    '<tr><td style="padding:5px 0;color:#bbb;font-size:13px;">✅&nbsp; AI Media Studio — images, videos, copy</td></tr>' +
    '<tr><td style="padding:5px 0;color:#bbb;font-size:13px;">✅&nbsp; Email, SMS, WhatsApp & Social campaigns</td></tr>' +
    '<tr><td style="padding:5px 0;color:#bbb;font-size:13px;">✅&nbsp; Priority beta support</td></tr>' +
    '</table>' +

    // CTA Button
    '<div style="text-align:center;margin-bottom:28px;">' +
    '<a href="' + inviteUrl + '" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;letter-spacing:0.2px;">Claim My Free Access →</a>' +
    '</div>' +

    // Invite Code Box
    '<div style="background:#0d0d14;border:1px solid #2a1f3e;border-radius:12px;padding:18px 20px;margin-bottom:20px;text-align:center;">' +
    '<p style="color:#666;font-size:11px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1.5px;">Your Invite Code</p>' +
    '<p style="color:#e0aaff;font-size:26px;font-weight:900;letter-spacing:6px;margin:0 0 8px;font-family:Courier New,monospace;">' + inviteCode + '</p>' +
    '<p style="color:#555;font-size:11px;margin:0;">Enter this code if prompted during sign-up</p>' +
    '</div>' +

    // Link fallback
    '<div style="background:#0a0a0a;border:1px solid #1a1a2a;border-radius:8px;padding:12px 14px;margin-bottom:18px;">' +
    '<p style="color:#555;font-size:10px;margin:0 0 5px;text-transform:uppercase;letter-spacing:1px;">Or copy this link</p>' +
    '<p style="color:#7c3aed;font-size:11px;margin:0;word-break:break-all;">' + inviteUrl + '</p>' +
    '</div>' +

    '<p style="color:#555;font-size:12px;margin:0;">⏰ This invite expires in <strong style="color:#888;">30 days</strong>. If you have questions, reply to this email.</p>' +
    '</td></tr>' +

    // Footer
    '<tr><td style="background:#0d0d14;padding:18px 40px;border-top:1px solid #1f1f2e;text-align:center;">' +
    '<p style="color:#333;font-size:11px;margin:0;">© 2026 AEVOICE · <a href="' + APP_URL + '" style="color:#444;text-decoration:none;">media.aevoice.ai</a> · <a href="mailto:hello@aevoice.ai" style="color:#444;text-decoration:none;">hello@aevoice.ai</a></p>' +
    '</td></tr>' +

    '</table></td></tr></table></body></html>';
}

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
    const body = await req.json().catch(() => ({}));
    const { email, note = '', source = 'manual_invite', full_name = '' } = body;

    if (!email) {
      return Response.json({ error: 'email is required' }, {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // 1. Generate token + 6-char invite code
    const token = generateToken();
    const inviteCode = token.slice(0, 6).toUpperCase();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const inviteUrl = APP_URL + '/invite/' + token;

    // 2. Upsert BetaRequest record
    const existing = await base44.asServiceRole.entities.BetaRequest.filter({ email });
    let invite;
    if (existing && existing.length > 0) {
      await base44.asServiceRole.entities.BetaRequest.update(existing[0].id, {
        invite_token: token,
        invite_expires_at: expiresAt,
        status: 'approved',
        invite_sent: true,
        note: note || existing[0].note || '',
      });
      invite = { ...existing[0], invite_token: token, invite_expires_at: expiresAt };
    } else {
      invite = await base44.asServiceRole.entities.BetaRequest.create({
        email,
        full_name: full_name || '',
        status: 'approved',
        note,
        invite_token: token,
        invite_expires_at: expiresAt,
        invite_sent: true,
      });
    }

    // 3. Also invite via Base44 (so they can set a password through Base44 auth)
    try {
      await base44.asServiceRole.users?.inviteUser?.(email, 'user');
    } catch (e) {
      console.warn('Base44 inviteUser skipped:', e.message);
    }

    // 4. Build email content
    const firstName = full_name ? full_name.split(' ')[0] : '';
    const htmlBody = buildHtml(inviteUrl, inviteCode, note, firstName);
    const plainText = [
      'Hi' + (firstName ? ' ' + firstName : '') + ',',
      '',
      "You've been approved for AEVOICE Beta Access!",
      '',
      'Claim your free Agency-tier access here:',
      inviteUrl,
      '',
      'Your Invite Code: ' + inviteCode,
      '(Enter this code if prompted during sign-up)',
      '',
      'This invite expires in 30 days.',
      '',
      '— The AEVOICE Team',
      'media.aevoice.ai',
    ].join('\n');

    const subject = "🎉 You're in — Claim your free AEVOICE Beta access";
    let provider = 'none';

    // PRIMARY: Base44 built-in
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body: plainText, from_name: 'AEVOICE' });
      provider = 'base44';
    } catch (e) {
      console.warn('Base44 SendEmail failed, trying Resend:', e.message);
    }

    // SECONDARY: Resend
    if (provider === 'none') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey) {
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@media.aevoice.ai';
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'AEVOICE <' + fromEmail + '>',
            to: [email],
            subject,
            text: plainText,
            html: htmlBody,
          }),
        });
        if (res.ok) {
          provider = 'resend';
        } else {
          console.error('Resend failed:', await res.text());
        }
      }
    }

    // TERTIARY: SendGrid
    if (provider === 'none') {
      const sgKey = Deno.env.get('SENDGRID_API_KEY');
      if (sgKey) {
        const sgFrom = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@aevoice.ai';
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + sgKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: sgFrom, name: 'AEVOICE' },
            subject,
            content: [{ type: 'text/plain', value: plainText }, { type: 'text/html', value: htmlBody }],
          }),
        });
        if (sgRes.ok) {
          provider = 'sendgrid';
        } else {
          throw new Error('SendGrid failed: ' + await sgRes.text());
        }
      } else {
        throw new Error('No email provider available.');
      }
    }

    return Response.json(
      { success: true, email, invite_id: invite.id, invite_url: inviteUrl, invite_code: inviteCode, provider },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (error) {
    console.error('sendBetaInvite error:', error);
    return Response.json(
      { error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});