export const onRequest: PagesFunction = async (context) => {
  try {
    const { env, request } = context as unknown as { env: any; request: Request };
    if (!env.DB) {
      return new Response(JSON.stringify({ ok: false, error: 'DB binding missing' }), { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '48', 10) || 48, 1), 200);

    const stmt = env.DB.prepare(
      'SELECT id, brand, title, price_cents, image_url FROM garments ORDER BY created_at DESC LIMIT ?'
    ).bind(limit);

    const rows = await stmt.all();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (rows?.results || (rows as any[]))?.map((r: any) => ({
      id: r.id,
      brand: r.brand,
      title: r.title,
      price_cents: r.price_cents ?? 0,
      image_url: r.image_url,
    }));

    return new Response(JSON.stringify({ ok: true, items }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET /api/garments failed', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

