"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutCancelPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  return (
    <main className="mt-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="h1 mb-2">Checkout canceled</h1>
        <p className="text-sm text-neutral-600">No charge was made.</p>
        {orderId && (
          <p className="mt-2 text-xs text-neutral-500">Order ID: <span className="font-mono">{orderId}</span></p>
        )}
        <div className="mt-6 space-x-3">
          <Link href="/product" className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">Back to product</Link>
          <Link href="/shop" className="inline-flex items-center border border-neutral-300 px-6 py-3 text-sm uppercase tracking-wide hover:bg-neutral-900 hover:text-white transition-colors">Browse more</Link>
        </div>
      </div>
    </main>
  );
}

