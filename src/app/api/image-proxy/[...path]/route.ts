import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

  // 1) Try static asset bundle first (OpenNext ASSETS)
  const assetPath = `/assets/inventory/${segments.join("/")}`;
  const assetUrl = new URL(assetPath, req.url);
  const assetRequest = new Request(assetUrl.toString(), req);
  const assetResponse = await env.ASSETS?.fetch(assetRequest);
  if (assetResponse && assetResponse.status !== 404) {
    const headers = new Headers(assetResponse.headers);
    headers.set("x-inventory-proxy", "hit-assets");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new NextResponse(assetResponse.body, { status: assetResponse.status, headers });
  }

  // 2) Fallback to R2 object at inventory/<file>
  try {
    const r2Key = `inventory/${segments.join("/")}`;
    // @ts-ignore env.R2 is provided at runtime
    const object = await env.R2?.get(r2Key);
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
