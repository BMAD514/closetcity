import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as garmentDetailHandler } from "../../../../../functions/api/garments/[id]";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return garmentDetailHandler({
    request,
    env,
    waitUntil,
  });
}
