export const onRequest = async (context: any) => {
  try {
    const { env, params, request } = context as unknown as { 
      env: any; 
      params: { path?: string }; 
      request: Request 
    };

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

    // Parse path from URL since [[path]] might not work as expected
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/\/api\/image-proxy\/(.+)$/);
    const pathParam = pathMatch ? pathMatch[1] : '';
    const pathSegments = pathParam ? pathParam.split('/').filter(Boolean) : [];

    if (!pathSegments.length) {
      return new Response('Missing asset path', {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 1) Try static asset bundle first (OpenNext ASSETS)
    const tryAsset = async (path: string) => {
      try {
        const assetUrl = new URL(path, request.url);
        const assetRequest = new Request(assetUrl.toString(), request);
        const res = await env.ASSETS?.fetch(assetRequest);
        if (res && res.status !== 404) {
          const headers = new Headers(res.headers);
          headers.set("x-inventory-proxy", "hit-assets");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");
          headers.set('Access-Control-Allow-Origin', '*');
          return new Response(res.body, { status: res.status, headers });
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    // Try without /assets prefix (most Pages setups)
    let served = await tryAsset(`/inventory/${pathSegments.join("/")}`);
    if (!served) {
      // Try with /assets prefix (some OpenNext setups)
      served = await tryAsset(`/assets/inventory/${pathSegments.join("/")}`);
    }
    if (served) return served;

    // 2) Fallback to R2 object at inventory/<file>
    if (!env.R2) {
      return new Response('R2 storage not configured', { 
        status: 500, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      });
    }

    try {
      const r2Key = `inventory/${pathSegments.join("/")}`;
      const object = await env.R2.get(r2Key);
      if (object) {
        const contentType = object.httpMetadata?.contentType || 'image/webp';
        const headers = new Headers({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': object.etag,
          'x-inventory-proxy': 'hit-r2',
          'Access-Control-Allow-Origin': '*',
        });
        return new Response(object.body, { status: 200, headers });
      }
    } catch (e) {
      console.error('R2 proxy error:', e);
    }

    const res = new Response("Not Found", { 
      status: 404,
      headers: {
        'x-inventory-proxy': 'miss',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      }
    });
    return res;

  } catch (error) {
    console.error('Image proxy error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { 'Access-Control-Allow-Origin': '*' } 
    });
  }
};
