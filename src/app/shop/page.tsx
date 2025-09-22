"use client";

import { useEffect, useMemo, useState } from 'react';
import Container from '@/components/Container';
import Grid from '@/components/Grid';
import Card from '@/components/Card';
import { getProductMeta } from '@/lib/productMeta';

const RAW_API_BASE = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || '';
const API_BASE = RAW_API_BASE.replace(/\/$/, '');

function apiUrl(path: string) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

type Garment = {
  id: string;
  brand: string;
  title: string;
  price_cents?: number;
  image_url: string;
};

export default function ShopPage() {
  const [items, setItems] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl('/api/garments'))
      .then((r) => {
        if (!r.ok) throw new Error('Unable to load the closet.');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems((data.items || []) as Garment[]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'The closet is offline for a moment.');
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enriched = useMemo(
    () => items.map((item) => ({ ...item, meta: getProductMeta(item) })),
    [items]
  );

  return (
    <main className="bg-white">
      <Container className="py-12">
        <div className="mb-10 space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Closet.city archive</p>
          <h1 className="text-3xl font-serif tracking-tight text-stone-900 md:text-4xl">All pieces in rotation</h1>
          <p className="max-w-2xl text-sm text-stone-600 md:text-base">
            Every item below is available for virtual try-on and purchase. Drop in, stage your fit, and take home the pieces that actually look like they belong to you.
          </p>
        </div>

        {error && !loading ? (
          <p className="mb-8 rounded-2xl bg-stone-100 px-6 py-4 text-sm text-stone-600">{error}</p>
        ) : null}

        {loading ? (
          <Grid>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[360px] animate-pulse rounded-2xl bg-stone-100" />
            ))}
          </Grid>
        ) : enriched.length ? (
          <Grid>
            {enriched.map((item) => (
              <Card key={item.id} id={item.id} image={item.image_url} brand={item.brand} title={item.title} price_cents={item.price_cents} />
            ))}
          </Grid>
        ) : (
          <div className="rounded-2xl bg-stone-100 px-6 py-16 text-center text-sm text-stone-500">
            The wardrobe is out on loan. Check back after the next drop.
          </div>
        )}
      </Container>
    </main>
  );
}
