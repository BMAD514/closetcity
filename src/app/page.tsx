"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/Card";
import Grid from "@/components/Grid";
import Container from "@/components/Container";

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

export default function Home() {
  const [items, setItems] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl("/api/garments"))
      .then((r) => {
        if (!r.ok) throw new Error("Closet offline");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setItems((data.items || []) as Garment[]);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Closet offline");
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="bg-white text-black">
      <section className="border-b border-black/10">
        <Container className="flex min-h-[40vh] flex-col items-center justify-center gap-6 py-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.6em]">underground artist beta</p>
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">The fitting room is the canvas.</h1>
          <p className="max-w-xl text-sm text-black/70 md:text-base">
            A guided rack of garments. A private AI fitting room. Step in, stage the image, leave with proof.
          </p>
          <Link
            href="/virtual-try-on"
            className="inline-flex items-center justify-center rounded-full border border-black px-10 py-3 font-mono text-[10px] uppercase tracking-[0.5em] transition-colors hover:bg-black hover:text-white"
          >
            enter fitting room
          </Link>
        </Container>
      </section>

      <section className="py-16">
        <Container className="space-y-10">
          {error && !loading ? (
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-red-600">{error}</p>
          ) : null}

          {loading ? (
            <Grid>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[360px] animate-pulse border border-black/10 bg-black/5" />
              ))}
            </Grid>
          ) : (
            <Grid>
              {items.map((item) => (
                <Card key={item.id} id={item.id} image={item.image_url} brand={item.brand} title={item.title} price_cents={item.price_cents} />
              ))}
            </Grid>
          )}
        </Container>
      </section>
    </main>
  );
}
