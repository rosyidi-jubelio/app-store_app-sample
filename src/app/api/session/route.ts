import { type NextRequest, NextResponse } from 'next/server';

import { loginWithSessionToken } from '@/lib/embedded-login';
import { sessionCookie } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.session_token === 'string' ? body.session_token : null;
  if (!token) {
    return NextResponse.json({ error: 'missing_session_token' }, { status: 400 });
  }

  const result = await loginWithSessionToken(token);
  if (!result.ok) {
    console.error('embedded login failed', result.error, result.detail ?? '');
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const res = NextResponse.json({ merchant_id: result.merchantId });
  res.headers.set('Cache-Control', 'no-store');
  res.cookies.set(sessionCookie(result.merchantId, result.userId));
  return res;
}
