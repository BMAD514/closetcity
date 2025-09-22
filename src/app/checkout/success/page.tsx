"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type OrderItem = {
  type?: string;
  garment_id?: string;
  title?: string;
  brand?: string;
  quantity?: number;
  unit_amount?: number;
};

type OrderPayload = {
  id: string;
  status: string;
  email: string | null;
  total_cents: number;
  items?: OrderItem[] | null;
};

function formatPrice(cents?: number) {
  const value = typeof cents === "number" ? cents : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value / 100);
}

function SuccessInner() {
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

  const capsule = useMemo(() => {
    if (!order) return null;
    const items = Array.isArray(order.items) ? order.items : [];
    return {
      total: formatPrice(order.total_cents),
      primary: items[0]?.title ? `${items[0].brand ?? ""} ${items[0].title ?? ""}`.trim() : null,
      count: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    };
  }, [order]);

  return (
    <main className="mt-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div>
          <h1 className="h1 mb-2">Order confirmed. We saved your hanger.</h1>
          <p className="text-sm text-neutral-600">
            {state === "loading" && "Confirming with the studio..."}
            {state === "error" && "We booked the order, but couldn&apos;t surface the details just now."}
            {state === "idle" && order && capsule
              ? `Your ${capsule.primary ?? "look"} is reserved — ${capsule.count} item${capsule.count === 1 ? "" : "s"} en route to your closet.`
              : null}
          </p>
          {orderId && (
            <p className="mt-2 text-xs text-neutral-500">
              Order reference <span className="font-mono tracking-tight">{orderId}</span>
            </p>
          )}
        </div>

        {order && capsule && (
          <div className="mx-auto max-w-md rounded border border-neutral-200 bg-white/60 px-4 py-5 text-left">
            <div className="flex items-baseline justify-between">
              <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Total</span>
              <span className="text-base font-medium">{capsule.total}</span>
            </div>
            {Array.isArray(order.items) && order.items?.length ? (
              <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                {order.items.map((item, idx) => (
                  <li key={`${item.garment_id ?? idx}-${item.title ?? idx}`} className="flex justify-between">
                    <span>
                      {item.brand && <span className="font-semibold">{item.brand}</span>} {item.title}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      ×{item.quantity ?? 1}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 text-xs text-neutral-500">
              {order.email
                ? `Receipt emailed to ${order.email}.`
                : "We'll send a note once the courier is confirmed."}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
          >
            Keep browsing
          </Link>
          <Link
            href="/virtual-try-on"
            className="inline-flex items-center border border-neutral-300 px-6 py-3 text-sm uppercase tracking-wide hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Style another look
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="mt-10"><div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">Confirming your order...</div></main>}>
      <SuccessInner />
    </Suspense>
  );
}


