import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { onRequest as poseHandler } from '../../../../functions/api/pose';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const context = getRequestContext() as any;
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(promise);
    } else if (context.ctx && typeof context.ctx.waitUntil === 'function') {
      context.ctx.waitUntil(promise);
    }
  };

  return poseHandler({
    request,
    env: context.env,
    waitUntil,
  });
}
