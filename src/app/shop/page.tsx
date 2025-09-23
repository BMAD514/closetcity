"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import Grid from "@/components/Grid";
import Card from "@/components/Card";

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

export default function ShopPage() {
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
      <Container className="py-20">
        <div className="mb-12 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.6em] text-black/60">the rack</p>
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">Twelve pieces. No algorithm. No archive dive.</h1>
          <p className="max-w-2xl text-sm text-black/70 md:text-base">
            Each garment is staged for immediate AI fitting. Choose a piece, project it onto your silhouette, decide if it deserves your rotation.
          </p>
        </div>

        {error && !loading ? (
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-red-600">{error}</p>
        ) : null}

        {loading ? (
          <Grid>
            {Array.from({ length: 9 }).map((_, index) => (
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
    </main>
  );
}
