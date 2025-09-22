"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/Container';
import { getProductMeta } from '@/lib/productMeta';

function formatPrice(cents?: number) {
  const n = typeof cents === 'number' ? cents : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

const RAW_API_BASE = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || '';
const API_BASE = RAW_API_BASE.replace(/\/$/, '');

function apiUrl(path: string) {
  return API_BASE ? API_BASE + path : path;
}

type Item = { id: string; brand: string; title: string; size?: string; condition?: string | null; price_cents?: number; image_url: string };
type Media = { flatlay: string[]; tryon: string[] };

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${filled ? 'text-stone-900' : 'text-stone-300'}`} aria-hidden>
      <path d="M12 17.3 6.8 20l1-5.9L3.7 9.6l5.9-.9L12 3l2.4 5.7 5.9.9-4.1 4.5 1 5.9z" fill="currentColor" />
    </svg>
  );
}

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [media, setMedia] = useState<Media>({ flatlay: [], tryon: [] });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const meta = useMemo(() => (item ? getProductMeta(item) : null), [item]);

  async function handleBuy() {
    if (!id) return;
    setBuying(true);
    setBuyError(null);
    try {
      const r = await fetch(apiUrl('/api/checkout'), {
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
    const url = apiUrl(`/api/garments/${id}`);
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
    item && id
      ? {
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
        }
      : null
  ), [item, imagesFlat, imagesTryon, id]);

  if (loading) {
    return (
      <main className="bg-white">
        <Container className="py-12">
          <p className="text-sm text-stone-500">Steaming the garment for you...</p>
        </Container>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="bg-white">
        <Container className="py-12">
          <p className="text-sm text-stone-500">This piece slipped out of rotation.</p>
        </Container>
      </main>
    );
  }

  const reviewLabel = meta ? `${meta.rating.toFixed(1)} average  /  ${meta.reviewCount} community reviews` : null;

  return (
    <main className="bg-white">
      <Container className="py-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-12">
            <section className="space-y-4">
              <h2 className="text-sm uppercase tracking-[0.35em] text-stone-500">Closet proof</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {imagesFlat.map((src: string, i: number) => (
                  <div key={i} className="overflow-hidden rounded-2xl bg-stone-100">
                    <img src={src} alt={`${item.title} flat ${i + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>

            {imagesTryon.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm uppercase tracking-[0.35em] text-stone-500">In motion</h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {imagesTryon.map((src: string, i: number) => (
                    <div key={i} className="min-w-[220px] overflow-hidden rounded-2xl bg-stone-100">
                      <img src={src} alt={`${item.title} try-on ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-stone-500">
                <span>{item.brand}</span>
                {meta && (
                  <span className="rounded-full bg-stone-200 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-stone-600">
                    {meta.category}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-serif leading-tight text-stone-900 md:text-4xl">{item.title}</h1>
              {meta && <p className="text-sm text-stone-600">{meta.tagline}</p>}
              {reviewLabel && (
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} filled={meta.rating >= index + 0.7} />
                    ))}
                  </div>
                  <span>{reviewLabel}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-stone-600">
              {item.size && <div>Size: {item.size}</div>}
              {item.condition && <div>Condition: {item.condition}</div>}
            </div>

            <div>
              <div className="text-lg font-semibold text-stone-900">{formatPrice(item.price_cents)}</div>
              <p className="text-xs uppercase tracking-[0.35em] text-stone-500">Includes insured handoff</p>
            </div>

            <div className="flex flex-col gap-3">
              {bestImageUrl && (
                <Link
                  href={`/virtual-try-on?garmentUrl=${encodeURIComponent(bestImageUrl)}`}
                  className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition-all duration-200 hover:bg-stone-700"
                >
                  Try it on me
                </Link>
              )}
              <button
                onClick={handleBuy}
                disabled={buying}
                className="inline-flex items-center justify-center rounded-full border border-stone-900 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-900 transition-all duration-200 hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buying ? 'Redirecting...' : 'Take it home'}
              </button>
              {buyError && <p className="text-xs text-red-600">{buyError}</p>}
            </div>
          </aside>
        </div>
      </Container>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
    </main>
  );
}
