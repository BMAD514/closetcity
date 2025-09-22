"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Container from "@/components/Container";
import Card from "@/components/Card";
import { getProductMeta } from "@/lib/productMeta";

const RAW_API_BASE = (typeof window !== "undefined" && window.location?.origin) || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/$/, "");

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

type EnrichedGarment = Garment & { meta: ReturnType<typeof getProductMeta> };

const heroTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] } as const;

export default function Home() {
  const [items, setItems] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortOrder, setSortOrder] = useState<"featured" | "price-asc" | "price-desc" | "rating-desc">("featured");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl("/api/garments"))
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load closet");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setItems((data.items || []) as Garment[]);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "We could not reach the closet.");
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const enriched = useMemo<EnrichedGarment[]>(
    () => items.map((item) => ({ ...item, meta: getProductMeta(item) })),
    [items]
  );

  const categories = useMemo(() => {
    const unique = new Set(enriched.map((item) => item.meta.category));
    return ["All", ...Array.from(unique)];
  }, [enriched]);

  const displayedItems = useMemo(() => {
    const filtered = activeCategory === "All" ? enriched : enriched.filter((item) => item.meta.category === activeCategory);
    const list = [...filtered];
    switch (sortOrder) {
      case "price-asc":
        return list.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
      case "price-desc":
        return list.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
      case "rating-desc":
        return list.sort((a, b) => b.meta.rating - a.meta.rating);
      case "featured":
      default:
        return list;
    }
  }, [enriched, activeCategory, sortOrder]);

  return (
    <main className="bg-stone-50">
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-100 via-transparent to-transparent" />
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={heroTransition}
            className="flex flex-col items-center gap-6 py-16 text-center md:py-24"
          >
            <p className="text-[11px] uppercase tracking-[0.4em] text-stone-500">Season 01 / The Archive</p>
            <h1 className="max-w-4xl text-4xl font-serif leading-tight text-stone-900 md:text-6xl">
              You are the mannequin.
            </h1>
            <p className="max-w-2xl text-base text-stone-600 md:text-lg">
              Upload a photo of yourself, tap any piece, and let our wardrobe AI render the fit in seconds. Zero awkward fitting rooms, all of the thrill of discovery.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/virtual-try-on"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white transition-all duration-200 hover:bg-stone-700"
              >
                Start a try-on
              </Link>
              <Link
                href="/shop"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 px-8 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-700 transition-all duration-200 hover:border-stone-500 hover:text-stone-900"
              >
                Browse the closet
              </Link>
            </div>
            <div className="mt-4 text-xs uppercase tracking-[0.35em] text-stone-500">
              Photoreal lookbooks in under 10 seconds / No studio, no stylist required
            </div>
          </motion.div>
        </Container>
      </section>

      <section className="border-t border-stone-200/80 bg-white">
        <Container>
          <div className="flex flex-col gap-10 py-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      activeCategory === category
                        ? 'bg-stone-900 text-white shadow-sm'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <span className="hidden uppercase tracking-[0.35em] md:inline">Sort</span>
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}
                    className="appearance-none rounded-full border border-stone-200 bg-white px-4 py-2 pr-10 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400"
                  >
                    <option value="featured">Featured</option>
                    <option value="rating-desc">Highest rated</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400">v</span>
                </div>
              </div>
            </div>

            {error && !loading ? (
              <p className="rounded-2xl bg-stone-100 px-6 py-4 text-sm text-stone-600">{error}</p>
            ) : null}

            {loading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-[360px] animate-pulse rounded-2xl bg-stone-100" />
                ))}
              </div>
            ) : displayedItems.length > 0 ? (
              <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedItems.map((item) => (
                  <Card key={item.id} id={item.id} image={item.image_url} brand={item.brand} title={item.title} price_cents={item.price_cents} />
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl bg-stone-100 px-6 py-16 text-center text-sm text-stone-500">
                Pieces are out on loan right now. Check back after the next drop.
              </div>
            )}
          </div>
        </Container>
      </section>
    </main>
  );
}
