import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as r2Handler } from "../../../../../functions/api/r2/[key]";

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return r2Handler({
    request,
    env,
    waitUntil,
  });
}
