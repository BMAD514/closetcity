"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type OrderItem = {
  title?: string;
  brand?: string;
  quantity?: number;
};

type OrderPayload = {
  id: string;
  status: string;
  total_cents: number;
  items?: OrderItem[] | null;
};

function formatPrice(cents?: number) {
  const value = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

function CancelInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    setState("loading");
    fetch(`/api/orders/${orderId}`, { cache: "no-store" })
      .then((res) => res.json().catch(() => ({})))
      .then((json) => {
        if (!active) return;
        if (json?.ok && json?.order) {
          setOrder(json.order as OrderPayload);
          setState("idle");
        } else {
          setState("error");
        }
      })
      .catch(() => active && setState("error"));
    return () => {
      active = false;
    };
  }, [orderId]);

  const note = useMemo(() => {
    if (!order) return null;
    switch (order.status) {
      case 'paid':
        return 'This order already cleared — reach out if you need to adjust delivery.';
      case 'pending':
        return "No charge yet. We'll keep the pieces on hold for a little while.";
      case 'canceled':
        return "We released the reservation. Feel free to style it again when you're ready.";
      default:
        return 'The checkout was left open. Pick up where you left off anytime.';
    }
  }, [order]);

  return (
    <main className="mt-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div>
          <h1 className="h1 mb-2">Checkout paused. Nothing charged.</h1>
          <p className="text-sm text-neutral-600">
            {state === "loading" && "Double-checking the rack..."}
            {state === "error" && "We couldn&apos;t confirm that reservation, but you can restart anytime."}
            {state === "idle" && note}
          </p>
          {orderId && (
            <p className="mt-2 text-xs text-neutral-500">
              Order reference <span className="font-mono tracking-tight">{orderId}</span>
            </p>
          )}
        </div>

        {order && (
          <div className="mx-auto max-w-md rounded border border-neutral-200 bg-white/60 px-4 py-5 text-left">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Value held</span>
              <span className="text-base font-medium">{formatPrice(order.total_cents)}</span>
            </div>
            {Array.isArray(order.items) && order.items?.length ? (
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                {order.items.map((item, idx) => (
                  <li key={`${item.title ?? idx}-${idx}`} className="flex justify-between">
                    <span>
                      {item.brand && <span className="font-semibold">{item.brand}</span>} {item.title}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      x{item.quantity ?? 1}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
          >
            Return to the rack
          </Link>
          <Link
            href="/virtual-try-on"
            className="inline-flex items-center border border-neutral-300 px-6 py-3 text-sm uppercase tracking-wide hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Keep styling
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense fallback={<main className="mt-10"><div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">Checking your reservation...</div></main>}>
      <CancelInner />
    </Suspense>
  );
}



