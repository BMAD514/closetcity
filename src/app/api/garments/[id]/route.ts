import { NextRequest, NextResponse } from 'next/server';
import type { Env } from '../../../../lib/types';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const env = getRequestContext().env as unknown as Env;
    if (!env.DB) {
      return NextResponse.json({ ok: false, error: 'DB binding missing' }, { status: 500 });
    }

    const garment = await env.DB.prepare(
      'SELECT id, brand, title, size, condition, price_cents, image_url, created_at FROM garments WHERE id = ?'
    ).bind(id).first();

    if (!garment) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    const mediaRows = await env.DB.prepare(
      'SELECT id, url, type FROM listing_media WHERE listing_id = ? ORDER BY created_at ASC'
    ).bind(id).all();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = (mediaRows?.results || mediaRows) as any[];
    const flatlay: string[] = [];
    const tryon: string[] = [];
    for (const m of results) {
      if ((m.type || '').toLowerCase() === 'flatlay') flatlay.push(m.url);
      else if ((m.type || '').toLowerCase() === 'tryon') tryon.push(m.url);
    }

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error('GET /api/garments/[id] failed', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

