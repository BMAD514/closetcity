// Helper function to create JSON responses
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

interface Env {
  DB: any;
  R2: any;
  CLOUDFLARE_API_TOKEN: string;
  JOBS?: any;
  PROMPT_VERSION?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }

    // Check if required services are available
    if (!env.DB || !env.R2 || !env.CLOUDFLARE_API_TOKEN) {
      return json({ success: false, error: 'Required services not configured', code: 'CONFIG_MISSING' }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;

    if (!imageUrl) {
      return json({ success: false, error: 'Image URL is required' }, 400);
    }

    console.log('🤖 Using Cloudflare Workers AI API for model generation');
    console.log('📸 Processing image:', imageUrl);

    // Fetch the image from R2
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return json({ success: false, error: 'Failed to fetch image' }, 400);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    // Use Workers AI API directly for img2img
    const prompt = `Professional studio portrait, clean white background, fashion model pose, high quality photography, studio lighting, suitable for virtual try-on, realistic, detailed`;

    console.log('🎨 Generating studio model with Workers AI API...');

    // Cloudflare Account ID
    const accountId = 'b25240d49b7133162450bc235ba623e4';

    const aiResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/runwayml/stable-diffusion-v1-5-img2img`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        image: Array.from(new Uint8Array(imageBuffer)),
        strength: 0.7,
        num_inference_steps: 20,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Workers AI API error:', errorText);
      return json({ success: false, error: 'AI generation failed', details: errorText }, 500);
    }

    const aiResult = await aiResponse.arrayBuffer();
    
    // Generate a unique filename
    const modelId = crypto.randomUUID();
    const filename = `model/${modelId}.png`;

    // Upload to R2
    await env.R2.put(filename, aiResult, {
      httpMetadata: {
        contentType: 'image/png',
      },
    });

    // Store in database
    const insertResult = await env.DB.prepare(`
      INSERT INTO tryon_cache (id, user_image_url, model_image_url, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(modelId, imageUrl, `https://closet.city/api/r2/${filename}`).run();

    if (!insertResult.success) {
      console.error('Failed to store in database:', insertResult.error);
      return json({ success: false, error: 'Database error' }, 500);
    }

    const modelImageUrl = `https://closet.city/api/r2/${filename}`;

    console.log('✅ Workers AI API model generation complete:', modelImageUrl);

    return json({
      success: true,
      modelImageUrl,
      modelId,
      message: 'Studio model created successfully with Workers AI API'
    });

  } catch (error) {
    console.error('❌ Workers AI API model generation error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}
