"use client";

import { useEffect, useState } from 'react';
import Container from '@/components/Container';
import Grid from '@/components/Grid';
import Card from '@/components/Card';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://f6d07313.closetcity-tryon.pages.dev').replace(/\/$/, '');

export default function ShopPage() {
  const [items, setItems] = useState<Array<{ id: string; brand: string; title: string; price_cents?: number; image_url: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = `${API_BASE}/api/garments`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mt-10">
      <Container>
        <h1 className="h1 mb-6">Shop</h1>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <Grid>
            {items.map((g) => (
              <Card key={g.id} id={g.id} image={g.image_url} brand={g.brand} title={g.title} price_cents={g.price_cents} />
            ))}
          </Grid>
        )}
      </Container>
    </main>
  );
}


