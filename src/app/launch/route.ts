import { type NextRequest, NextResponse } from 'next/server';

import { loginWithSessionToken } from '@/lib/embedded-login';
import { sessionCookie } from '@/lib/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('session_token');
  const home = new URL('/', request.url);

  if (!token) {
    home.searchParams.set('error', 'missing_session_token');
    return NextResponse.redirect(home, 303);
  }

  const result = await loginWithSessionToken(token);
  if (!result.ok) {
    console.error('embedded login failed', result.error, result.detail ?? '');
    home.searchParams.set('error', result.error);
  }

  const res = NextResponse.redirect(home, 303);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  if (result.ok) {
    res.cookies.set(sessionCookie(result.merchantId, result.userId));
  }
  return res;
}
