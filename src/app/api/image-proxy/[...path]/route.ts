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

  const assetPath = `/assets/inventory/${segments.join("/")}`;
  const { env } = await getCloudflareContext({ async: true });
  const assetUrl = new URL(assetPath, req.url);
  const assetRequest = new Request(assetUrl.toString(), req);
  const assetResponse = await env.ASSETS?.fetch(assetRequest);

  if (!assetResponse || assetResponse.status === 404) {
    const res = new NextResponse("Not Found", { status: 404 });
    res.headers.set("x-inventory-proxy", "miss");
    return res;
  }

  const headers = new Headers(assetResponse.headers);
  headers.set("x-inventory-proxy", "hit");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new NextResponse(assetResponse.body, { status: assetResponse.status, headers });
}

export async function GET(req: NextRequest, context?: RouteContext) {
  const segments = await resolveSegments(context);
  return serveAsset(req, segments);
}

export async function HEAD(req: NextRequest, context?: RouteContext) {
  const segments = await resolveSegments(context);
  return serveAsset(req, segments);
}
