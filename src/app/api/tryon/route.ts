import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as tryonHandler } from "../../../../functions/api/tryon";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return tryonHandler({
    request,
    env,
    waitUntil,
  });
}
