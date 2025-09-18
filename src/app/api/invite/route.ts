import { NextRequest, NextResponse } from 'next/server';
import { Env } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const env = process.env as unknown as Env;
  const expected = (env.INVITE_CODE || '').trim();
  if (!expected) {
    return NextResponse.json({ success: false, error: 'Invite not configured' }, { status: 500 });
  }

  const { code } = await req.json().catch(() => ({ code: '' }));
  if ((code || '').trim() !== expected) {
    return NextResponse.json({ success: false, error: 'Invalid invite code' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  // Set a secure cookie for access
  res.cookies.set('invite', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

