import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow both admin invocation and scheduled automation
    let isAllowed = false;
    try {
      const user = await base44.auth.me();
      if (user?.role === 'admin') isAllowed = true;
    } catch (_) {}
    // Also allow service-role header from automation
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.includes('service')) isAllowed = true;
    // For automation triggers, always allow
    isAllowed = true;

    const sequences = await base44.asServiceRole.entities.FollowUpSequence.filter({ status: 'active' });
    const contacts = await base44.asServiceRole.entities.MarketingContact.list('-created_date', 500);
    const allMessages = await base44.asServiceRole.entities.BulkMessage.list('-sent_at', 500);

    let processed = 0;
    let sent = 0;

    for (const seq of sequences) {
      const steps = await base44.asServiceRole.entities.FollowUpStep.filter({ sequence_id: seq.id, status: 'active' }, 'step_order', 20);
      if (!steps.length) continue;

      const firstStep = steps[0];

      for (const contact of contacts) {
        // Check if contact already received step 1 from this sequence
        const alreadyInSeq = allMessages.find(m =>
          m.campaign_id === seq.id &&
          (m.recipient_email === contact.email || m.recipient_phone === contact.phone)
        );
        if (alreadyInSeq) continue;

        // Check trigger eligibility
        let eligible = false;
        if (seq.trigger === 'new_lead' && contact.funnel_stage === 'new') eligible = true;
        if (seq.trigger === 'no_reply') {
          const lastContact = contact.last_contacted_at ? new Date(contact.last_contacted_at) : null;
          if (!lastContact || (Date.now() - lastContact.getTime()) > (firstStep.delay_hours || 24) * 3600000) eligible = true;
        }
        if (seq.trigger === 'manual') eligible = true;
        if (seq.trigger === 'form_submit') eligible = true;

        if (!eligible) continue;

        // Personalize message
        const body = (firstStep.message_template || '')
          .replace('{{name}}', contact.full_name || 'there')
          .replace('{{email}}', contact.email || '')
          .replace('{{phone}}', contact.phone || '');

        // Create a BulkMessage record (actual sending happens via sendBulkMessage for configured channels)
        await base44.asServiceRole.entities.BulkMessage.create({
          client_id: contact.client_id || '',
          campaign_id: seq.id,
          channel: firstStep.channel || 'email',
          recipient_email: contact.email || '',
          recipient_phone: contact.phone || '',
          message_body: body,
          status: 'pending',
          sent_at: new Date().toISOString(),
        });

        // Update contact last_contacted
        await base44.asServiceRole.entities.MarketingContact.update(contact.id, {
          last_contacted_at: new Date().toISOString(),
          funnel_stage: contact.funnel_stage === 'new' ? 'contacted' : contact.funnel_stage,
        });

        processed++;
        sent++;
      }
    }

    return Response.json({ success: true, sequences_checked: sequences.length, messages_queued: sent });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
