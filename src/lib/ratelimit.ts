// Simple in-memory token bucket (best-effort; not durable across isolates)
// Limit: 10 requests per day per IP (fallback to User-Agent if IP unavailable)
// For production, replace with Durable Object / KV-backed counters.

const BUCKET_LIMIT = 10;

// globalThis ensures a single map per isolate
declare global {
  // eslint-disable-next-line no-var
  var __rlStore__: Map<string, { count: number; day: string }> | undefined;
}

const store: Map<string, { count: number; day: string }> = globalThis.__rlStore__ || new Map();
(globalThis.__rlStore__ as Map<string, { count: number; day: string }>) = store;

function getKey(ip: string | null, ua: string | null) {
  const id = (ip || ua || 'unknown').split(',')[0]?.trim(); // take first when multiple
  const now = new Date();
  const day = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return { key: `${day}:${id}`, day };
}

function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(1, Math.floor((+next - +now) / 1000));
}

export function checkRateLimitMemory(req: Request, limit: number = BUCKET_LIMIT) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
  const ua = req.headers.get('user-agent');
  const { key, day } = getKey(ip, ua);
  const current = store.get(key);
  if (!current || current.day !== day) {
    store.set(key, { count: 1, day });
    return { exceeded: false, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { exceeded: true, remaining: 0, retryAfterSeconds: secondsUntilMidnightUTC() };
  }
  current.count += 1;
  store.set(key, current);
  return { exceeded: false, remaining: limit - current.count, retryAfterSeconds: 0 };
}

// Cloudflare KV-backed rate limit (recommended for production)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRateLimitKV(kv: any, req: Request, limit: number = BUCKET_LIMIT) {
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for');
  const ua = req.headers.get('user-agent');
  const { key } = getKey(ip, ua);
  const ttl = secondsUntilMidnightUTC();
  const val = await kv.get(key);
  const count = val ? parseInt(val as string, 10) : 0;
  if (count >= limit) {
    return { exceeded: true, remaining: 0, retryAfterSeconds: ttl };
  }
  await kv.put(key, String(count + 1), { expirationTtl: ttl });
  return { exceeded: false, remaining: limit - (count + 1), retryAfterSeconds: 0 };
}

// Wrapper: prefer KV if available, else fall back to memory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRateLimitEdge(kv: any | undefined, req: Request, limit: number = BUCKET_LIMIT) {
  if (kv) return checkRateLimitKV(kv, req, limit);
  return checkRateLimitMemory(req, limit);
}

// Backward-compatible alias (memory)
export const checkRateLimit = checkRateLimitMemory;

