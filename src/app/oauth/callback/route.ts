import { type NextRequest, NextResponse } from 'next/server';

import { saveTokens } from '@/lib/install-store';
import { OAuthError } from '@/lib/jubelio';
import { oauth } from '@/lib/jubelio-app';
import { sessionCookie } from '@/lib/session';

function redirectHome(request: NextRequest, error?: string) {
  const url = new URL('/', request.url);
  if (error) url.searchParams.set('error', error);
  const res = NextResponse.redirect(url, 303);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return redirectHome(request, 'missing_code');
  }

  try {
    const install = await saveTokens(await oauth().exchangeCode(code));
    const res = redirectHome(request);
    res.cookies.set(sessionCookie(install.merchantId));
    return res;
  } catch (err) {
    if (err instanceof OAuthError) {
      console.error('oauth code exchange failed', err.code, err.description);
      return redirectHome(request, err.code);
    }
    console.error('oauth callback failed', err);
    return redirectHome(request, 'server_error');
  }
}
