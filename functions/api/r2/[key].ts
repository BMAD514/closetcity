export const onRequest = async (context: any) => {
  try {
    const { env, params } = context as unknown as { env: any; params: { key?: string } };
    if (!env.R2) return new Response('R2 storage not configured', { status: 500 });

    const keyParam = params?.key;
    if (!keyParam) return new Response('Key parameter required', { status: 400 });

    const decodedKey = decodeURIComponent(keyParam);
    const object = await env.R2.get(decodedKey);
    if (!object) return new Response('File not found', { status: 404 });

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
      },
    });
  } catch (error) {
    console.error('R2 proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

