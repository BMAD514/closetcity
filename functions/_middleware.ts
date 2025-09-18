export async function onRequest(context: any) {
  const { request } = context;
  const origin = request.headers.get('Origin') || '*';

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
      },
    });
  }

  const response = await context.next();
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  newHeaders.append('Vary', 'Origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

