import { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { onRequest as jobsHandler } from "../../../../../functions/api/jobs/[id]";

export const runtime = 'nodejs';

async function adaptRequest(request: NextRequest) {
  const { env, ctx } = await getCloudflareContext({ async: true });
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof ctx?.waitUntil === "function") {
      ctx.waitUntil(promise);
    }
  };

  return jobsHandler({
    request,
    env,
    waitUntil,
  });
}

export async function OPTIONS(request: NextRequest) {
  return adaptRequest(request);
}

export async function GET(request: NextRequest) {
  return adaptRequest(request);
}

export async function POST(request: NextRequest) {
  return adaptRequest(request);
}
