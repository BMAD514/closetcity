"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  return (
    <main className="mt-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="h1 mb-2">Thank you!</h1>
        <p className="text-sm text-neutral-600">Your payment was successful.</p>
        {orderId && (
          <p className="mt-2 text-xs text-neutral-500">Order ID: <span className="font-mono">{orderId}</span></p>
        )}
        <div className="mt-6 space-x-3">
          <Link href="/shop" className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">Continue shopping</Link>
          <Link href="/dashboard" className="inline-flex items-center border border-neutral-300 px-6 py-3 text-sm uppercase tracking-wide hover:bg-neutral-900 hover:text-white transition-colors">Try on more</Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="mt-10"><div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">Loading…</div></main>}>
      <SuccessInner />
    </Suspense>
  );
}

