import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as webhookHandler } from "../../../../../functions/api/stripe/webhook";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return webhookHandler({ request, env, waitUntil });
}

