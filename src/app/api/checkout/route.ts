import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as checkoutHandler } from "../../../../functions/api/checkout";

export const runtime = 'nodejs';

async function adaptRequest(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return checkoutHandler({ request, env, waitUntil });
}

export async function OPTIONS(request: NextRequest) {
  return adaptRequest(request);
}

export async function POST(request: NextRequest) {
  return adaptRequest(request);
}
