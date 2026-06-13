import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateMediaContent — AI content generation for all media types
 * Supports: caption, ad_copy, email_template, sms_template, hashtag_set,
 *           video_script, video_storyboard, thumbnail, blog_post, whatsapp,
 *           brand_voice, brand_bio, press_release, script
 */
Deno.serve(async (req) => {
  // CORS
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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, platform, tone, prompt, client_id, website_scan_id } = await req.json();
    if (!type || !prompt) {
      return Response.json({ error: 'type and prompt are required' }, { status: 400 });
    }

    // Optional website scan context
    let context = '';
    if (website_scan_id) {
      try {
        const scans = await base44.entities.WebsiteScan.filter({ id: website_scan_id });
        if (scans.length > 0) {
          const scan = scans[0];
          context = `\n\nBusiness context:\n- Summary: ${scan.business_summary}\n- Services: ${(scan.services_found || []).join(', ')}\n- Keywords: ${(scan.keywords_found || []).join(', ')}\n- Tone: ${scan.tone}`;
        }
      } catch (_) { /* ignore */ }
    }

    const t = tone || 'Professional';
    const p = platform || 'Social Media';

    // The frontend already sends a fully-built prompt for most types.
    // We use it directly — just fall back to internal prompts for legacy calls.
    const isRichPrompt = prompt.length > 80; // frontend sends detailed prompts

    const legacyPrompts = {
  video_script: `Write a professional video script for ${p}. Topic: ${prompt}. Tone: ${t}.
  IMPORTANT:
  1. Correct spelling is mandatory.
  2. Format: [Timecode] [Scene Description] [On-Screen Text Overlay].
  3. Brand Style: ${t}.`,

  video_storyboard: `Create a storyboard for a ${p} video about: ${prompt}.
  IMPORTANT:
  1. BRANDING: Every shot MUST include: "PLACE LOGO IN BOTTOM RIGHT".
  2. TEXT: Verify spelling. DO NOT guess text.
  3. Format: SHOT N, VISUAL, AUDIO, TEXT OVERLAY (verified spelling), LOGO PLACEMENT.`,
  // ... keep the rest of your existing entries
};

    // Use the incoming prompt if it's already detailed (frontend-built), else use legacy
    const finalPrompt = isRichPrompt ? prompt : (legacyPrompts[type] || legacyPrompts.caption);

    // Try Base44 LLM first, fall back to OpenAI
    let result; // <--- This is the only one you need
    try {
      // Define the guardrail and apply it to the prompt
      const spellingGuardrail = "\n\nCRITICAL: Double-check all spellings. If you are unsure of the spelling of a word, do not include it. Provide content in a clear, professional brand voice.";
      const finalPromptWithGuardrail = finalPrompt + spellingGuardrail;
      
      result = await base44.integrations.Core.InvokeLLM({ prompt: finalPromptWithGuardrail });
    } catch (llmError) {
      // ...
      // ... your existing OpenAI fallback code ...
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiKey) throw llmError;
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: finalPrompt }],
        }),
      });
      if (!openaiRes.ok) throw new Error(`OpenAI fallback failed: ${await openaiRes.text()}`);
      const openaiData = await openaiRes.json();
      result = openaiData.choices[0].message.content;
    }

    // Persist to ContentAsset
    let asset;
    try {
      asset = await base44.entities.ContentAsset.create({
        client_id: client_id || '',
        type,
        title: `${type} - ${String(prompt).slice(0, 50)}`,
        content: result,
        platform: p,
        ai_generated: true,
        prompt_used: String(prompt).slice(0, 500),
        status: 'ready',
      });
    } catch (_) { /* non-fatal */ }

    return Response.json(
      { success: true, asset_id: asset?.id, content: result, text: result },
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
});