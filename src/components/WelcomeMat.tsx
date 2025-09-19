"use client";

import React from "react";
import Link from "next/link";
import BeforeAfterSlider from "./BeforeAfterSlider";


const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');

export default function WelcomeMat() {
  const [originalUrl, setOriginalUrl] = React.useState<string | null>(null);
  const [modelUrl, setModelUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleUploadFile(file: File) {
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "model");
      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.error || "Upload failed");
      return json.url as string;
    } catch (e) {
      throw e;
    }
  }

  async function handleGenerateModel(userImageUrl: string) {
    const res = await fetch(`${API_BASE}/api/model`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userImageUrl, async: true }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Model generation failed");
    if (json?.url) return json.url as string;
    if (json?.jobId) {
      let delay = 600;
      const start = Date.now();
      while (true) {
        const s = await fetch(`${API_BASE}/api/jobs/${json.jobId}`, { cache: "no-store" });
        if (s.ok) {
          const sj = await s.json();
          if (sj?.status === "succeeded" && sj?.output?.url) return sj.output.url as string;
          if (sj?.status === "failed") throw new Error(sj?.error || "Model job failed");
        }
        if (Date.now() - start > 120000) throw new Error("Timed out");
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(3000, Math.round(delay * 1.5));
      }
    }
    throw new Error("Unexpected response");
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setModelUrl(null);
    try {
      const uploadedUrl = await handleUploadFile(file);
      setOriginalUrl(uploadedUrl);
      const generatedUrl = await handleGenerateModel(uploadedUrl);
      setModelUrl(generatedUrl);
      try { localStorage.setItem("closet.modelUrl", generatedUrl); } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setOriginalUrl(null);
    setModelUrl(null);
    setError(null);
  }

  return (
    <section className="mt-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="h1 mb-3">Create Your Model for Any Look</h2>
            <p className="text-sm text-neutral-600 mb-6">
              Upload a full-body photo. We’ll generate a clean studio model of you.
            </p>

            {!modelUrl && (
              <label className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors cursor-pointer">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
                Upload Photo
              </label>
            )}
            {loading && (
              <div className="mt-4 text-sm text-neutral-500">Generating your model…</div>
            )}
            {error && (
              <div className="mt-4 text-sm text-red-600">{error}</div>
            )}

            {modelUrl && (
              <div className="mt-6 flex items-center gap-4">
                <button onClick={onReset} className="underline underline-offset-4 hover:opacity-80 text-sm">
                  Use Different Photo
                </button>
                <Link href="/dashboard" className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors">
                  Proceed to Styling
                </Link>
              </div>
            )}

            <p className="mt-6 text-xs text-neutral-500">
              Tip: Full-body, single subject, neutral pose works best. Background is replaced with a light studio backdrop.
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              By uploading, you agree to responsible use of AI and our content guidelines.
            </p>
          </div>

          <div className="md:pl-8">
            {originalUrl && modelUrl ? (
              <BeforeAfterSlider beforeUrl={originalUrl} afterUrl={modelUrl} alt="Model reveal" />
            ) : (
              <div className="border border-neutral-200 aspect-[4/5] w-full max-w-xl mx-auto grid place-items-center text-neutral-400 text-sm">
                Before / After preview will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

