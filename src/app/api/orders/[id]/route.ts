import { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { onRequest as orderDetailHandler } from '../../../../../functions/api/orders/[id]';

export const runtime = 'edge';

const adaptRequest = (request: NextRequest) => {
  const context = getRequestContext() as any;
  const waitUntil = (promise: Promise<unknown>) => {
    if (typeof context.waitUntil === 'function') {
      context.waitUntil(promise);
    } else if (context.ctx && typeof context.ctx.waitUntil === 'function') {
      context.ctx.waitUntil(promise);
    }
  };

  return orderDetailHandler({
    request,
    env: context.env,
    waitUntil,
  });
};

export function OPTIONS(request: NextRequest) {
  return adaptRequest(request);
}

export async function GET(request: NextRequest) {
  return adaptRequest(request);
}
