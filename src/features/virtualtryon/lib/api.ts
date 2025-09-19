const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'https://f6d07313.closetcity-tryon.pages.dev').replace(/\/$/, '');

async function pollJob(jobId: string, signal?: AbortSignal): Promise<any> {
  const start = Date.now();
  let delay = 600; // ms
  while (true) {
    const r = await fetch(`${API_BASE}/api/jobs/${jobId}`, { cache: 'no-store', signal }).catch((e) => {
      if (signal?.aborted) throw e;
      return null as any;
    });
    if (r && r.ok) {
      const j = await r.json().catch(() => ({}));
      if (j?.status === 'succeeded' && j?.output?.url) return j;
      if (j?.status === 'failed') throw new Error(j?.error || 'job failed');
    }
    if (Date.now() - start > 120000) throw new Error('job timeout');
    await new Promise((res) => setTimeout(res, delay));
    delay = Math.min(3000, Math.round(delay * 1.5));
  }
}

export async function uploadFile(file: File, kind: 'model' | 'garment') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  const r = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.url) throw new Error(j?.error || 'upload failed');
  return j as { url: string };
}

export async function tryOn(params: {
  modelUrl: string;
  garmentUrl: string;
  poseKey: string;
  layerSig?: string;
}) {
  const r = await fetch(`${API_BASE}/api/tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, async: true }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || 'tryon failed');
  if (j?.url) return j as { url: string; cacheHit?: boolean };
  if (j?.jobId) {
    const done = await pollJob(j.jobId);
    return { url: done.output?.url as string, cacheHit: !!done.cached };
  }
  throw new Error('unexpected tryon response');
}

export async function pose(params: { outfitUrl?: string; modelUrl?: string; poseKey: string }) {
  const input = params.outfitUrl || params.modelUrl;
  if (!input) throw new Error('missing input image');
  const r = await fetch(`${API_BASE}/api/pose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelUrl: input, poseKey: params.poseKey, async: true }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || 'pose failed');
  if (j?.url) return j as { url: string; cacheHit?: boolean };
  if (j?.jobId) {
    const done = await pollJob(j.jobId);
    return { url: done.output?.url as string, cacheHit: !!done.cached };
  }
  throw new Error('unexpected pose response');
}

/** Optional: fetch live wardrobe from your shop API */
type Garment = { id: string; brand: string; title: string; image_url: string };

export async function fetchWardrobe(limit = 24) {
  try {
    const r = await fetch(`${API_BASE}/api/garments?limit=${limit}`, { cache: 'no-store' });
    if (!r.ok) return [] as { id: string; name: string; url: string }[];
    const j = await r.json().catch(() => ({}));
    const items = (j.items ?? []) as Garment[];
    return items.map((g) => ({
      id: g.id,
      name: `${g.brand} — ${g.title}`,
      url: g.image_url,
    }));
  } catch {
    return [] as { id: string; name: string; url: string }[];
  }
}

