export const onRequest = async (context: any) => {
  const { env, params, request } = context as unknown as { env: any; params: { id?: string }; request: Request };

  // CORS preflight support
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });
  }
  if (!env.JOBS) {
    return new Response(JSON.stringify({ error: 'JOBS KV binding is not configured' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With' } });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing job id' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With' } });
  }
  const raw = await env.JOBS.get(`job:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With' } });
  }
  try {
    const job = JSON.parse(raw);
    const origin = new URL(request.url).origin;
    if (job?.output?.url && typeof job.output.url === 'string' && job.output.url.startsWith('/')) {
      job.output.url = origin + job.output.url;
    }
    return new Response(JSON.stringify(job), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With' } });
  } catch {
    // If parsing fails, just return the raw string
    return new Response(raw, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With' } });
  }
}

