import type { GenerationMeta } from '../types';

const RAW_API_BASE = (typeof window !== 'undefined' && window.location?.origin) || process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || '';
const API_BASE = RAW_API_BASE.replace(/\/$/, '');

function apiUrl(path: string) {
  return API_BASE ? `${API_BASE}${path}` : path;
}

interface JobResult {
  jobId?: string;
  status: string;
  output?: { url?: string; meta?: GenerationMeta };
  meta?: GenerationMeta;
  cached?: boolean;
  cacheHit?: boolean;
  error?: string;
}

function mergeMeta(base?: GenerationMeta, incoming?: Partial<GenerationMeta> | null): GenerationMeta | undefined {
  if (!base && !incoming) return undefined;
  return { ...base, ...incoming };
}

function normalizeMeta(payload: JobResult): GenerationMeta | undefined {
  const direct = payload.meta;
  const outputMeta = payload.output?.meta;
  const fallback: Partial<GenerationMeta> = {
    cacheHit: payload.cacheHit ?? payload.cached,
  };
  const merged = mergeMeta(mergeMeta(undefined, direct), outputMeta);
  return mergeMeta(merged, fallback);
}

async function pollJob(jobId: string, signal?: AbortSignal): Promise<JobResult> {
  const start = Date.now();
  let delay = 600;
  while (true) {
    const r = await fetch(apiUrl(`/api/jobs/${jobId}`), { cache: 'no-store', signal }).catch((e) => {
      if (signal?.aborted) throw e;
      return null as any;
    });
    if (r && r.ok) {
      const j = (await r.json().catch(() => ({}))) as JobResult;
      if (j?.status === 'succeeded' && j?.output?.url) {
        const meta = normalizeMeta(j) || {};
        if (meta.durationMs == null && !meta.cacheHit) {
          meta.durationMs = Date.now() - start;
        }
        j.meta = meta;
        if (j.output) j.output.meta = meta;
        return j;
      }
      if (j?.status === 'failed') {
        throw new Error(j?.error || 'job failed');
      }
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
  const r = await fetch(apiUrl('/api/upload'), { method: 'POST', body: fd });
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
  const r = await fetch(apiUrl('/api/tryon'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, async: true }),
  });
  const j = (await r.json().catch(() => ({}))) as (JobResult & { url?: string });
  if (!r.ok) throw new Error(j?.error || 'tryon failed');
  if (j?.url) {
    const meta = normalizeMeta(j);
    return { url: j.url as string, cacheHit: !!meta?.cacheHit, meta };
  }
  if (j?.jobId) {
    const done = await pollJob(j.jobId);
    if (!done.output?.url) throw new Error('tryon job missing url');
    const meta = done.output.meta ?? normalizeMeta(done);
    return { url: done.output.url, cacheHit: !!meta?.cacheHit, meta };
  }
  throw new Error('unexpected tryon response');
}

export async function pose(params: { outfitUrl?: string; modelUrl?: string; poseKey: string }) {
  const input = params.outfitUrl || params.modelUrl;
  if (!input) throw new Error('missing input image');
  const r = await fetch(apiUrl('/api/pose'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelUrl: input, poseKey: params.poseKey, async: true }),
  });
  const j = (await r.json().catch(() => ({}))) as (JobResult & { url?: string });
  if (!r.ok) throw new Error(j?.error || 'pose failed');
  if (j?.url) {
    const meta = normalizeMeta(j);
    return { url: j.url as string, cacheHit: !!meta?.cacheHit, meta };
  }
  if (j?.jobId) {
    const done = await pollJob(j.jobId);
    if (!done.output?.url) throw new Error('pose job missing url');
    const meta = done.output.meta ?? normalizeMeta(done);
    return { url: done.output.url, cacheHit: !!meta?.cacheHit, meta };
  }
  throw new Error('unexpected pose response');
}

/** Optional: fetch live wardrobe from your shop API */
type Garment = { id: string; brand: string; title: string; image_url: string };

export async function fetchWardrobe(limit = 24) {
  try {
    const r = await fetch(apiUrl(`/api/garments?limit=${limit}`), { cache: 'no-store' });
    if (!r.ok) return [] as { id: string; name: string; url: string }[];
    const j = await r.json().catch(() => ({}));
    const items = (j.items ?? []) as Garment[];
    return items.map((g) => ({
      id: g.id,
      name: `${g.brand} - ${g.title}`,
      url: g.image_url,
    }));
  } catch {
    return [] as { id: string; name: string; url: string }[];
  }
}

