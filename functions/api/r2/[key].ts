export const onRequest = async (context: any) => {
  try {
    const { env, params, request } = context as unknown as { env: any; params: { key?: string }; request: Request };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }

    if (!env.R2) return new Response('R2 storage not configured', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });

    const keyParam = params?.key;
    if (!keyParam) return new Response('Key parameter required', { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });

    const decodedKey = decodeURIComponent(keyParam);
    const object = await env.R2.get(decodedKey);
    if (!object) return new Response('File not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('R2 proxy error:', error);
    return new Response('Internal server error', { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
};

