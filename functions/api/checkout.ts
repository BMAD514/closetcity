export const onRequest = async (context: any) => {
  try {
    const { env, request } = context as unknown as { env: any; request: Request };
    if (!env.DB || !env.STRIPE_SECRET_KEY) {
      return json({ ok: false, error: 'Missing DB or Stripe secret key' }, 500);
    }

    const body = await request.json().catch(() => ({}));
    const garmentId: string | undefined = body?.garmentId;
    const quantity: number = Math.max(1, Math.min(parseInt(String(body?.quantity || '1'), 10) || 1, 10));
    const customer_email: string | undefined = body?.email;

    if (!garmentId) return json({ ok: false, error: 'Missing garmentId' }, 400);

    const garment = await env.DB.prepare(
      'SELECT id, brand, title, price_cents FROM garments WHERE id = ?'
    ).bind(garmentId).first();
    if (!garment) return json({ ok: false, error: 'Garment not found' }, 404);

    const unit_amount = (garment.price_cents as number) || 0;
    const amount = unit_amount * quantity;

    // Create pending order in D1
    const orderId = crypto.randomUUID();
    const items = [{ type: 'garment', garment_id: garment.id, title: garment.title, brand: garment.brand, unit_amount, quantity }];
    await env.DB.prepare('INSERT INTO orders (id, status, user_email, items_json, total_cents) VALUES (?, ?, ?, ?, ?)')
      .bind(orderId, 'pending', customer_email || null, JSON.stringify(items), amount)
      .run();

    // Build success/cancel URLs
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const siteFallback = env.SITE_URL || origin;
    const success_url = `${siteFallback}/checkout/success?orderId=${orderId}`;
    const cancel_url = `${siteFallback}/checkout/cancel?orderId=${orderId}`;

    // Create Stripe Checkout Session via REST API
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', success_url);
    form.set('cancel_url', cancel_url);
    form.set('metadata[order_id]', orderId);
    form.set('metadata[garment_id]', garment.id as string);
    if (customer_email) form.set('customer_email', customer_email);
    // Price data (one-off)
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][product_data][name]', `${garment.brand} – ${garment.title}`);
    form.set('line_items[0][price_data][unit_amount]', String(unit_amount));
    form.set('line_items[0][quantity]', String(quantity));

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!stripeRes.ok) {
      const errTxt = await stripeRes.text();
      console.error('Stripe session error:', errTxt);
      return json({ ok: false, error: 'Stripe session creation failed' }, 500);
    }

    const session = await stripeRes.json();

    // Save session id onto order
    await env.DB.prepare('UPDATE orders SET stripe_session_id = ? WHERE id = ?')
      .bind(session.id, orderId)
      .run();

    return json({ ok: true, url: session.url, orderId });
  } catch (e) {
    console.error('Checkout error:', e);
    return json({ ok: false, error: e instanceof Error ? e.message : 'Checkout failed' }, 500);
  }
};

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

