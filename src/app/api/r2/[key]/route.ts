import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { onRequest as r2Handler } from '../../../../../functions/api/r2/[key]';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const context = getRequestContext() as any;
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(promise);
    } else if (context.ctx && typeof context.ctx.waitUntil === 'function') {
      context.ctx.waitUntil(promise);
    }
  };

  return r2Handler({
    request,
    env: context.env,
    waitUntil,
  });
}
