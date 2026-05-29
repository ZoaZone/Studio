import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: CORS });

    const { prompt, platform, dimensions, client_id, reference_image_urls } = await req.json();
    if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400, headers: CORS });

    const refInstruction = reference_image_urls?.length
      ? ' IMPORTANT: Replicate the exact person(s), face(s), outfit, and visual style from the provided reference images as faithfully as possible. Maintain their likeness while adapting composition to match the marketing context.'
      : '';
    const enhancedPrompt = `${prompt}${refInstruction}${platform ? ` Optimized for ${platform}.` : ''}${dimensions ? ` Aspect ratio: ${dimensions}.` : ''} High quality, professional, sharp, commercial photography style.`;

    const result = await base44.integrations.Core.GenerateImage({
      prompt: enhancedPrompt,
      existing_image_urls: reference_image_urls?.length ? reference_image_urls : undefined,
    });
    const url = result?.url || result?.file_url;
    if (!url) throw new Error('No image URL returned');

    let item;
    try {
      item = await base44.entities.MediaLibraryItem.create({ client_id: client_id || '', title: prompt.slice(0, 60), file_url: url, file_type: 'image', dimensions: dimensions || '', ai_generated: true });
    } catch (_) {}

    return Response.json({ success: true, file_url: url, url, item_id: item?.id }, { headers: CORS });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS });
  }
});
