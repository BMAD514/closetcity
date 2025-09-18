"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function InviteInner() {
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get("next") || "/";

  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Invalid code");
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="h1 mb-6">Private Preview</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Access code</label>
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full border border-black px-3 py-2 text-sm"
            placeholder="Enter invite code"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors"
        >
          {loading ? "Verifying…" : "Enter"}
        </button>
        {error && <div className="text-sm text-red-600">{error}</div>}
      </form>
      <p className="mt-6 text-xs text-neutral-500">This preview is invite-only. Contact the team for access.</p>
    </>
  );
}

export default function InvitePage() {
  return (
    <main className="mt-10">
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-sm text-neutral-500">Loading…</div>}>
          <InviteInner />
        </Suspense>
      </div>
    </main>
  );
}

