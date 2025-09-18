import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/', '/shop', '/dashboard', '/product/:path*', '/virtual-try-on'],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // Allow the invite page and API routes to pass through
  if (pathname.startsWith('/api') || pathname.startsWith('/invite')) {
    return NextResponse.next();
  }

  // Invite/passcode gate
  const expected = (typeof process !== 'undefined' && (process as any).env?.INVITE_CODE ? (process as any).env.INVITE_CODE : '').trim();
  if (!expected) {
    // If no invite code configured, allow access
    return NextResponse.next();
  }

  const cookie = req.cookies.get('invite')?.value || '';
  if (cookie === expected) {
    return NextResponse.next();
  }

  // Redirect to /invite with ?next=...
  const next = encodeURIComponent(url.pathname + url.search);
  url.pathname = '/invite';
  url.search = `?next=${next}`;
  return NextResponse.redirect(url);
}

