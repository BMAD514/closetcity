// Stripe webhook handler for checkout.session.completed
// Requires STRIPE_WEBHOOK_SECRET binding

export const onRequest = async (context: any) => {
  const { env, request } = context as unknown as { env: any; request: Request };
  if (!env.DB || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'Missing DB or STRIPE_WEBHOOK_SECRET' }, 500);
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) return json({ error: 'Missing signature' }, 400);

  const payload = await request.text();
  const { timestamp, signatures } = parseStripeSignature(sig);
  if (!timestamp || signatures.length === 0) return json({ error: 'Bad signature header' }, 400);

  const expected = await computeStripeSignature(env.STRIPE_WEBHOOK_SECRET, `${timestamp}.${payload}`);
  const valid = signatures.some((s) => timingSafeEqualHex(s, expected));
  if (!valid) return json({ error: 'Invalid signature' }, 400);

  const event = JSON.parse(payload);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        const amount_total = session.amount_total || 0;
        const email = session.customer_details?.email || session.customer_email || null;
        if (orderId) {
          await context.env.DB.prepare('UPDATE orders SET status = ?, user_email = COALESCE(?, user_email), total_cents = ? WHERE id = ?')
            .bind('paid', email, amount_total, orderId)
            .run();
          await sendReceiptIfConfigured(context.env, orderId, email);
        }
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await context.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?')
            .bind('canceled', orderId)
            .run();
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const orderId = pi.metadata?.order_id;
        if (orderId) {
          await context.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?')
            .bind('failed', orderId)
            .run();
        }
        break;
      }
      default:
        // no-op
        break;
    }
    return json({ received: true });
  } catch (e) {
    console.error('Webhook handling error:', e);
    return json({ error: 'Webhook handler error' }, 500);
  }
};

function parseStripeSignature(header: string): { timestamp: string | null; signatures: string[] } {
  const parts = header.split(',').map((s) => s.trim());
  let timestamp: string | null = null;
  const signatures: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') signatures.push(v);
  }
  return { timestamp, signatures };
}

async function computeStripeSignature(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

async function sendReceiptIfConfigured(env: any, orderId: string, email: string | null) {
  try {
    if (!email) return;
    // Optional: use Resend if API key present
    if (env.RESEND_API_KEY && env.RECEIPT_FROM_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.RECEIPT_FROM_EMAIL, to: email, subject: `Your Closet.city order ${orderId}`, html: `<p>Thank you for your purchase! Order ${orderId} is confirmed.</p>` })
      });
    }
  } catch (e) {
    console.warn('Receipt email send skipped/error:', e);
  }
}

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

