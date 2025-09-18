const API = process.env.NEXT_PUBLIC_API_BASE ?? '';

export async function uploadFile(file: File, kind: 'model' | 'garment') {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  const r = await fetch(`${API}/api/upload`, { method: 'POST', body: fd });
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
  const r = await fetch(`${API}/api/tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.url) throw new Error(j?.error || 'tryon failed');
  return j as { url: string; cacheHit?: boolean };
}

export async function pose(params: { outfitUrl: string; poseKey: string }) {
  const r = await fetch(`${API}/api/pose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.url) throw new Error(j?.error || 'pose failed');
  return j as { url: string; cacheHit?: boolean };
}

/** Optional: fetch live wardrobe from your shop API */
type Garment = { id: string; brand: string; title: string; image_url: string };

export async function fetchWardrobe(limit = 24) {
  try {
    const r = await fetch(`${API}/api/garments?limit=${limit}`, { cache: 'no-store' });
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

