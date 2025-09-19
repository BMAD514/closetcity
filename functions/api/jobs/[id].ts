export const onRequest = async (context: any) => {
  const { env, params } = context as unknown as { env: any; params: { id?: string } };
  if (!env.JOBS) {
    return new Response(JSON.stringify({ error: 'JOBS KV binding is not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing job id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const raw = await env.JOBS.get(`job:${id}`);
  if (!raw) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(raw, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

