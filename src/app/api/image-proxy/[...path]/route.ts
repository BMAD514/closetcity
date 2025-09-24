import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Env } from "../../../../lib/types";

type RouteContext =
  | { params?: { path?: string[] } }
  | { params: Promise<{ path: string[] }> };

export const runtime = "nodejs";

async function resolveSegments(context?: RouteContext): Promise<string[]> {
  if (!context) return [];
  const rawParams = (context as any)?.params;
  if (!rawParams) return [];
  const resolved = typeof rawParams.then === "function" ? await rawParams : rawParams;
  const path = resolved?.path;
  return Array.isArray(path) ? path : [];
}

async function serveAsset(req: NextRequest, segments: string[]) {
  if (!segments.length) {
    return NextResponse.json({ error: "missing asset" }, { status: 400 });
  }

  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as unknown as Env;

  // 1) Try static asset bundle first (OpenNext ASSETS)
  const tryAsset = async (path: string) => {
    const assetUrl = new URL(path, req.url);
    const assetRequest = new Request(assetUrl.toString(), req);
    const res = await (env as any).ASSETS?.fetch(assetRequest);
    if (res && res.status !== 404) {
      const headers = new Headers(res.headers);
      headers.set("x-inventory-proxy", "hit-assets");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new NextResponse(res.body, { status: res.status, headers });
    }
    return null;
  };

  // Try without /assets prefix (most Pages setups)
  let served = await tryAsset(`/inventory/${segments.join("/")}`);
  if (!served) {
    // Try with /assets prefix (some OpenNext setups)
    served = await tryAsset(`/assets/inventory/${segments.join("/")}`);
  }
  if (served) return served;

  // 2) Fallback to R2 object at inventory/<file>
  try {
    const r2Key = `inventory/${segments.join("/")}`;
    const object = await typedEnv.R2?.get(r2Key);
    if (object) {
      const contentType = object.httpMetadata?.contentType || 'image/webp';
      const headers = new Headers({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': object.etag,
        'x-inventory-proxy': 'hit-r2',
      });
      return new NextResponse(object.body, { status: 200, headers });
    }
  } catch (e) {
    // Continue to 404 below
  }

  const res = new NextResponse("Not Found", { status: 404 });
  res.headers.set("x-inventory-proxy", "miss");
  return res;
}

export async function GET(req: NextRequest, context?: RouteContext) {
  const segments = await resolveSegments(context);
  return serveAsset(req, segments);
}

export async function HEAD(req: NextRequest, context?: RouteContext) {
  const segments = await resolveSegments(context);
  return serveAsset(req, segments);
}
