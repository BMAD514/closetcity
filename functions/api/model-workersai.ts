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
  AI: any;
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
    if (!env.DB || !env.R2 || !env.AI) {
      return json({ success: false, error: 'Required services not configured', code: 'CONFIG_MISSING' }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl: string | undefined = body?.imageUrl;

    if (!imageUrl) {
      return json({ success: false, error: 'Image URL is required' }, 400);
    }

    console.log('🤖 Using Cloudflare Workers AI for model generation');
    console.log('📸 Processing image:', imageUrl);

    // Fetch the image from R2
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return json({ success: false, error: 'Failed to fetch image' }, 400);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageArray = new Uint8Array(imageBuffer);

    // Use Workers AI img2img for creating a clean studio model
    const prompt = `Professional studio portrait, clean white background, fashion model pose, high quality photography, studio lighting, suitable for virtual try-on, realistic, detailed`;

    console.log('🎨 Generating studio model with Workers AI img2img...');

    // Use img2img to transform the uploaded photo into a clean studio model
    const aiResponse = await env.AI.run('@cf/runwayml/stable-diffusion-v1-5-img2img', {
      prompt: prompt,
      image: imageArray,
      strength: 0.7, // How much to transform the original image (0.0 = no change, 1.0 = completely new)
      num_inference_steps: 20,
    });

    if (!aiResponse) {
      return json({ success: false, error: 'AI generation failed' }, 500);
    }

    // Convert the AI response to a buffer
    const generatedImageBuffer = aiResponse;
    
    // Generate a unique filename
    const modelId = crypto.randomUUID();
    const filename = `model/${modelId}.png`;

    // Upload to R2
    await env.R2.put(filename, generatedImageBuffer, {
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

    console.log('✅ Workers AI model generation complete:', modelImageUrl);

    return json({
      success: true,
      modelImageUrl,
      modelId,
      message: 'Studio model created successfully with Workers AI'
    });

  } catch (error) {
    console.error('❌ Workers AI model generation error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}
