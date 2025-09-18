"use client";

import React from 'react';

export default function StartScreen({ onUpload, loading }: { onUpload: (file: File) => void; loading: boolean }) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onUpload(f);
  };
  return (
    <section className="p-8">
      <h2 className="h1 mb-3">Create Your Model</h2>
      <p className="text-sm text-neutral-600 mb-6">Upload a full-body photo. We&apos;ll convert it to a neutral studio model to start styling.</p>
      <label className="inline-flex items-center border border-black px-6 py-3 text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors cursor-pointer">
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChange} />
        {loading ? 'Uploading…' : 'Upload Photo'}
      </label>
    </section>
  );
}

