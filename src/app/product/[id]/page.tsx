"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Container from '@/components/Container';
import Link from 'next/link';

function formatPrice(cents?: number) {
  const n = typeof cents === 'number' ? cents : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://f6d07313.closetcity-tryon.pages.dev').replace(/\/$/, '');

type Item = { id: string; brand: string; title: string; size?: string; condition?: string | null; price_cents?: number; image_url: string };

type Media = { flatlay: string[]; tryon: string[] };

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [media, setMedia] = useState<Media>({ flatlay: [], tryon: [] });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  async function handleBuy() {
    if (!id) return;
    setBuying(true);
    setBuyError(null);
    try {
      const r = await fetch(`${API_BASE}/api/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ garmentId: String(id), quantity: 1 }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j?.url) throw new Error(j?.error || 'Checkout init failed');
      window.location.href = j.url as string;
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setBuying(false);
    }
  }


  useEffect(() => {
    if (!id) return;
    const url = `${API_BASE}/api/garments/${id}`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        setItem(data.item as Item);
        setMedia(data.media as Media);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const { imagesFlat, imagesTryon, bestImageUrl } = useMemo(() => {
    const flat = media.flatlay?.length ? media.flatlay : (item?.image_url ? [item.image_url] : []);
    const tr = media.tryon || [];
    const best = (tr[0] || flat[0] || item?.image_url || '') as string;
    return { imagesFlat: flat, imagesTryon: tr, bestImageUrl: best };
  }, [media, item]);

  const jsonLd = useMemo(() => (
    item && id ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.title,
      brand: { '@type': 'Brand', name: item.brand },
      image: [...imagesFlat, ...imagesTryon],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: (item.price_cents ?? 0) / 100,
        availability: 'https://schema.org/InStock',
        url: `https://closet.city/product/${id}`,
      },
    } : null
  ), [item, imagesFlat, imagesTryon, id]);

  if (loading) {
    return (
      <main className="mt-10">
        <Container>
          <p className="text-sm text-neutral-500">Loading			</p>
        </Container>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="mt-10">
        <Container>
          <p className="text-sm text-neutral-500">Not found.</p>
        </Container>
      </main>
    );
  }

  return (
    <main className="mt-10">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <section>
              <h2 className="h3 mb-3">Flat-lay</h2>
              <div className="grid grid-cols-2 gap-3">
                {imagesFlat.map((src: string, i: number) => (
                  <div key={i} className="bg-neutral-100">
                    <img src={src} alt={`${item.title} flat ${i+1}`} className="w-full h-auto object-cover" />
                  </div>
                ))}
              </div>
            </section>

            {imagesTryon.length > 0 && (
              <section>
                <h2 className="h3 mb-3">Try-on</h2>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imagesTryon.map((src: string, i: number) => (
                    <div key={i} className="min-w-[220px] bg-neutral-100">
                      <img src={src} alt={`${item.title} try-on ${i+1}`} className="w-full h-auto object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-neutral-500">{item.brand}</div>
              <h1 className="h1 mt-1">{item.title}</h1>
            </div>
            <div className="text-sm text-neutral-700 space-y-1">
              {item.size && <div>Size: {item.size}</div>}
              {item.condition && <div>Condition: {item.condition}</div>}
            </div>
            <div className="text-lg">{formatPrice(item.price_cents)}</div>
            {bestImageUrl && (
              <Link href={`/virtual-try-on?garmentUrl=${encodeURIComponent(bestImageUrl)}`} className="inline-flex items-center justify-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">
                Try this on
              </Link>
            )}
            <button onClick={handleBuy} disabled={buying} className="mt-3 inline-flex items-center justify-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {buying ? 'Redirecting…' : 'Buy'}
            </button>
            {buyError && <p className="text-xs text-red-600">{buyError}</p>}
          </aside>
        </div>
      </Container>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </main>
  );
}

