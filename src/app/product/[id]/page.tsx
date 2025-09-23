"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { getProductMeta } from "@/lib/productMeta";

const RAW_API_BASE = (typeof window !== "undefined" && window.location?.origin) || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

function apiUrl(path: string) {
  return API_BASE ? API_BASE + path : path;
}

function formatPrice(cents?: number) {
  const n = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n / 100);
}

type Item = {
  id: string;
  brand: string;
  title: string;
  size?: string;
  condition?: string | null;
  price_cents?: number;
  image_url: string;
};

type Media = { flatlay: string[]; tryon: string[] };

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
      const r = await fetch(apiUrl("/api/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId: String(id), quantity: 1 }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok || !j?.url) throw new Error(j?.error || "Checkout failed");
      window.location.href = j.url as string;
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBuying(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    const url = apiUrl(`/api/garments/${id}`);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
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
    const flat = media.flatlay?.length ? media.flatlay : item?.image_url ? [item.image_url] : [];
    const tr = media.tryon || [];
    const best = (tr[0] || flat[0] || item?.image_url || "") as string;
    return { imagesFlat: flat, imagesTryon: tr, bestImageUrl: best };
  }, [media, item]);

  const jsonLd = useMemo(
    () =>
      item && id
        ? {
            "@context": "https://schema.org",
            "@type": "Product",
            name: item.title,
            brand: { "@type": "Brand", name: item.brand },
            image: [...imagesFlat, ...imagesTryon],
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: (item.price_cents ?? 0) / 100,
              availability: "https://schema.org/InStock",
              url: `https://closet.city/product/${id}`,
            },
          }
        : null,
    [item, imagesFlat, imagesTryon, id]
  );

  if (loading) {
    return (
      <main className="bg-white">
        <Container className="py-16">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-black/50">Calibrating the garment...</p>
        </Container>
      </main>
    );
  }

  if (notFound || !item) {
    return (
      <main className="bg-white">
        <Container className="py-16">
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-black/50">This piece has exited the rotation.</p>
        </Container>
      </main>
    );
  }

  return (
    <main className="bg-white text-black">
      <Container className="py-20">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-12">
            <section className="space-y-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.6em] text-black/60">flat views</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {imagesFlat.map((src, index) => (
                  <div key={index} className="overflow-hidden border border-black/10 bg-black/5">
                    <img src={src} alt={`${item.title} flat ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </section>

            {imagesTryon.length > 0 && (
              <section className="space-y-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.6em] text-black/60">ai fittings</p>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {imagesTryon.map((src, index) => (
                    <div key={index} className="overflow-hidden border border-black/10 bg-black/5">
                      <img src={src} alt={`${item.title} try-on ${index + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-8">
            <div className="space-y-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.6em] text-black/60">{item.brand}</span>
              <h1 className="font-serif text-3xl leading-tight md:text-4xl">{item.title}</h1>
              {meta && (
                <div className="space-y-2 text-sm text-black/70">
                  <div className="font-mono text-[10px] uppercase tracking-[0.4em]">Curator&apos;s Note</div>
                  <p>{meta.tagline}</p>
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-black/70">
              {item.size && <div>Size: {item.size}</div>}
              {item.condition && <div>Condition: {item.condition}</div>}
            </div>

            <div className="space-y-2">
              <div className="font-mono text-xs uppercase tracking-[0.4em] text-black/60">valuation</div>
              <div className="text-lg font-semibold">{formatPrice(item.price_cents)}</div>
            </div>

            <div className="flex flex-col gap-3">
              {bestImageUrl && (
                <Link
                  href={`/virtual-try-on?garmentUrl=${encodeURIComponent(bestImageUrl)}`}
                  className="inline-flex items-center justify-center rounded-full border border-black px-10 py-3 font-mono text-[10px] uppercase tracking-[0.5em] transition-colors hover:bg-black hover:text-white"
                >
                  stage the fit
                </Link>
              )}
              <button
                onClick={handleBuy}
                disabled={buying}
                className="inline-flex items-center justify-center rounded-full border border-black px-10 py-3 font-mono text-[10px] uppercase tracking-[0.5em] transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {buying ? "processing" : "request transfer"}
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
