export const onRequest = async (context: any) => {
  let GeminiErrorClass: any;
  try {
    const { env, request, waitUntil } = context as unknown as { env: any; request: Request; waitUntil: (p: Promise<any>) => void };

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }
    if (!env.DB || !env.R2 || !env.GEMINI_API_KEY) {
      return json({ success: false, error: 'Required services not configured', code: 'CONFIG_MISSING' }, 500);
    }

    const ai = await import('../../src/lib/ai');
    const { parseGeminiImageResponse, GeminiResponseError, summarizeGeminiFeedback } = ai;
    GeminiErrorClass = GeminiResponseError;

    const body = await request.json().catch(() => ({}));
    const { modelUrl, poseKey } = body || {};
    const preferAsync: boolean = !!body?.async || request.headers.get('x-async') === '1' || new URL(request.url).searchParams.get('async') === '1';
    if (!modelUrl || !poseKey) {
      return json({ success: false, error: 'Missing required fields: modelUrl, poseKey', code: 'BAD_REQUEST' }, 400);
    }

    const { sha256, generateId, r2Put, fetchImageInlineData } = await import('../../src/lib/utils');
    const { GEMINI_API_URL, API_TIMEOUT, POSE_PROMPT_TEMPLATE } = await import('../../src/lib/constants');

    const promptVersion = env.PROMPT_VERSION || 'v1';
    const cacheInput = `${promptVersion}|${modelUrl}|${poseKey}`;
    const cacheKey = await sha256(cacheInput);

    const cached = await env.DB.prepare('SELECT image_url FROM pose_cache WHERE cache_key = ?').bind(cacheKey).first();
    if (cached) {
      const site = new URL(request.url).origin;
      const full = ((cached.image_url as string).startsWith('http') ? cached.image_url : site + (cached.image_url as string));
      const meta = { cacheHit: true, source: 'cache', promptVersion, poseKey, durationMs: 0 };
      if (preferAsync) {
        const jobId = await ensureJobForCache(env, 'pose', cacheKey, { modelUrl, poseKey, promptVersion }, cached.image_url as string, meta);
        return json({ jobId, status: 'succeeded', output: { url: full, meta }, cacheHit: true, meta });
      }
      return json({ success: true, url: full, cached: true, cacheHit: true, meta });
    }

    if (preferAsync) {
      if (!env.JOBS) return json({ error: 'JOBS KV binding is not configured' }, 500);
      const existingJobId = await env.JOBS.get(`jobByCache:${cacheKey}`);
      if (existingJobId) {
        return json({ jobId: existingJobId, status: 'queued', meta: { cacheHit: false, source: 'queue', promptVersion, poseKey } });
      }

      const jobId = generateId();
      const job = {
        id: jobId,
        type: 'pose' as const,
        status: 'queued' as const,
        cacheKey,
        attempts: 0,
        input: { modelUrl, poseKey, promptVersion },
        meta: { cacheHit: false, source: 'queue', promptVersion, poseKey } as Record<string, unknown>,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await env.JOBS.put(`job:${jobId}`, JSON.stringify(job));
      await env.JOBS.put(`jobByCache:${cacheKey}`, jobId);

      waitUntil(processPoseJob(env, jobId));
      return json({ jobId, status: 'queued', meta: job.meta });
    }

    const started = Date.now();
    const modelInline = await fetchImageInlineData(modelUrl);

    const bodyReq = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: POSE_PROMPT_TEMPLATE(poseKey) },
            { inlineData: { data: modelInline.data, mimeType: modelInline.mimeType } },
          ],
        },
      ],
    };

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), API_TIMEOUT);
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify(bodyReq), signal: controller.signal,
    }).finally(() => clearTimeout(to));

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini API error:', errorText);
      return json({ success: false, error: 'AI generation failed', code: 'AI_HTTP_ERROR', details: { status: res.status } }, 502);
    }

    const jsonResp = await res.json();
    const { data, mimeType, feedback } = parseGeminiImageResponse(jsonResp);
    const durationMs = Date.now() - started;
    const summary = summarizeGeminiFeedback(feedback);
    if (summary) console.info('Gemini pose feedback:', summary);

    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const resultId = generateId();
    const resultKey = `pose/${resultId}.webp`;
    const resultUrl = await r2Put(env.R2, resultKey, bytes, mimeType);
    const site = new URL(request.url).origin;
    const full = resultUrl.startsWith('http') ? resultUrl : site + resultUrl;

    await env.DB.prepare('INSERT INTO pose_cache (cache_key, image_url, prompt_version) VALUES (?, ?, ?)')
      .bind(cacheKey, resultUrl, promptVersion)
      .run();

    const meta = { cacheHit: false, source: 'generated', promptVersion, poseKey, durationMs, feedback };
    return json({ success: true, url: full, cached: false, cacheHit: false, meta });
  } catch (error) {
    if (GeminiErrorClass && error instanceof GeminiErrorClass) {
      const status = error.code === 'AI_BLOCKED' ? 422 : 502;
      return json({ success: false, error: error.message, code: error.code, details: error.details }, status);
    }
    console.error('Pose error:', error);
    return json({ success: false, error: error instanceof Error ? error.message : 'Pose failed', code: 'INTERNAL_ERROR' }, 500);
  }
};

function json(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  });
}

async function ensureJobForCache(env: any, type: string, cacheKey: string, input: any, url: string, meta: Record<string, unknown>) {
  const { generateId } = await import('../../src/lib/utils');
  const existingJobId = await env.JOBS?.get(`jobByCache:${cacheKey}`);
  if (existingJobId) return existingJobId;
  const jobId = generateId();
  const job = { id: jobId, type, status: 'succeeded', cacheKey, input, output: { url, meta }, attempts: 0, cached: true, meta, createdAt: Date.now(), updatedAt: Date.now() };
  await env.JOBS?.put(`job:${jobId}`, JSON.stringify(job));
  await env.JOBS?.put(`jobByCache:${cacheKey}`, jobId);
  return jobId;
}

async function processPoseJob(env: any, jobId: string) {
  const ai = await import('../../src/lib/ai');
  const { parseGeminiImageResponse, summarizeGeminiFeedback } = ai;
  try {
    const raw = await env.JOBS.get(`job:${jobId}`);
    if (!raw) return;
    const job = JSON.parse(raw);
    if (job.status !== 'queued') return;
    job.status = 'processing'; job.attempts++; job.updatedAt = Date.now();
    await env.JOBS.put(`job:${jobId}`, JSON.stringify(job));

    const { fetchImageInlineData, generateId, r2Put } = await import('../../src/lib/utils');
    const { POSE_PROMPT_TEMPLATE, GEMINI_API_URL, API_TIMEOUT } = await import('../../src/lib/constants');

    const modelInline = await fetchImageInlineData(job.input.modelUrl);
    const bodyReq = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: POSE_PROMPT_TEMPLATE(job.input.poseKey) },
            { inlineData: { data: modelInline.data, mimeType: modelInline.mimeType } },
          ],
        },
      ],
    };

    const controller = new AbortController();
    const started = Date.now();
    const to = setTimeout(() => controller.abort(), API_TIMEOUT);
    const res = await fetch(GEMINI_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body: JSON.stringify(bodyReq), signal: controller.signal }).finally(() => clearTimeout(to));
    if (!res.ok) throw new Error(`Gemini API failed: ${await res.text()}`);

    const jsonResp = await res.json();
    const { data, mimeType, feedback } = parseGeminiImageResponse(jsonResp);
    const summary = summarizeGeminiFeedback(feedback);
    if (summary) console.info('Gemini pose feedback:', summary);

    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const resultId = generateId();
    const resultKey = `pose/${resultId}.webp`;
    const resultUrl = await r2Put(env.R2, resultKey, bytes, mimeType);

    await env.DB.prepare('INSERT INTO pose_cache (cache_key, image_url, prompt_version) VALUES (?, ?, ?)')
      .bind(job.cacheKey, resultUrl, job.input.promptVersion)
      .run();

    const meta = { cacheHit: false, source: 'generated', promptVersion: job.input.promptVersion, poseKey: job.input.poseKey, durationMs: Date.now() - started, feedback };
    job.status = 'succeeded'; job.output = { url: resultUrl, meta }; job.meta = meta; job.cached = false; job.updatedAt = Date.now();
    await env.JOBS.put(`job:${jobId}`, JSON.stringify(job));
  } catch (e: any) {
    const raw = await env.JOBS.get(`job:${jobId}`);
    if (!raw) return;
    const job = JSON.parse(raw);
    job.status = 'failed'; job.error = e?.message || 'Job failed'; job.updatedAt = Date.now();
    await env.JOBS.put(`job:${jobId}`, JSON.stringify(job));
  }
}
