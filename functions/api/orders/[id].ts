export const onRequest = async (context: any) => {
  const { env, params, request } = context as unknown as { env: any; params: { id?: string }; request: Request };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(),
    });
  }

  if (!env.DB) {
    return json({ ok: false, error: 'D1 binding not configured' }, 500);
  }

  const orderId = params?.id;
  if (!orderId) {
    return json({ ok: false, error: 'Missing order id' }, 400);
  }

  try {
    const row = await env.DB.prepare(
      'SELECT id, status, user_email, items_json, total_cents, stripe_session_id, created_at FROM orders WHERE id = ?'
    ).bind(orderId).first();

    if (!row) {
      return json({ ok: false, error: 'Order not found' }, 404);
    }

    let items: unknown = null;
    try {
      items = row.items_json ? JSON.parse(row.items_json as string) : null;
    } catch {
      items = null;
    }

    const order = {
      id: row.id as string,
      status: row.status as string,
      email: row.user_email || null,
      total_cents: row.total_cents as number,
      stripe_session_id: row.stripe_session_id || null,
      created_at: row.created_at as number | null,
      items,
    };

    return json({ ok: true, order });
  } catch (error) {
    console.error('Order lookup error:', error);
    return json({ ok: false, error: 'Failed to load order' }, 500);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  } as Record<string, string>;
}

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: corsHeaders(),
  });
}

