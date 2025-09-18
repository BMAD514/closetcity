export const onRequest = async (context: any) => {
  try {
    const { env, params } = context as unknown as { env: any; params: { id?: string } };
    const id = params?.id as string | undefined;
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'Missing id' }), { status: 400 });
    if (!env.DB) return new Response(JSON.stringify({ ok: false, error: 'DB binding missing' }), { status: 500 });

    const garment = await env.DB.prepare(
      'SELECT id, brand, title, size, condition, price_cents, image_url, created_at FROM garments WHERE id = ?'
    ).bind(id).first();

    if (!garment) return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404 });

    const mediaRows = await env.DB.prepare(
      'SELECT id, url, type FROM listing_media WHERE listing_id = ? ORDER BY created_at ASC'
    ).bind(id).all();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (mediaRows?.results || (mediaRows as any[])) as any[];
    const flatlay: string[] = [];
    const tryon: string[] = [];
    for (const m of results) {
      const t = (m.type || '').toLowerCase();
      if (t === 'flatlay') flatlay.push(m.url);
      else if (t === 'tryon') tryon.push(m.url);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        item: {
          id: garment.id,
          brand: garment.brand,
          title: garment.title,
          size: garment.size,
          condition: garment.condition ?? null,
          price_cents: garment.price_cents ?? 0,
          image_url: garment.image_url,
        },
        media: { flatlay, tryon },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('GET /api/garments/[id] failed', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

