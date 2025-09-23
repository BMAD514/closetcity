import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

export async function GET(req: NextRequest, context: any) {
  const segments = context?.params?.path || [];
  if (!segments.length) {
    return NextResponse.json({ error: "missing asset" }, { status: 400 });
  }

  const assetPath = `/inventory/${segments.join("/")}`;
  const { env } = await getCloudflareContext({ async: true });
  const method = req.method === "HEAD" ? "HEAD" : "GET";
  const assetRequest = new Request(new URL(assetPath, req.url), { method });
  const assetResponse = await env.ASSETS?.fetch(assetRequest);

  if (!assetResponse || assetResponse.status === 404) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const headers = new Headers(assetResponse.headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new NextResponse(assetResponse.body, { status: assetResponse.status, headers });
}


export async function HEAD(req: NextRequest, context: any) {
  return GET(req, context);
}
