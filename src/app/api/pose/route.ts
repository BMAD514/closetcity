import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as poseHandler } from "../../../../functions/api/pose";

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return poseHandler({
    request,
    env,
    waitUntil,
  });
}
