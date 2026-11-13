import { type NextRequest, NextResponse } from 'next/server';

import { saveTokens } from '@/lib/install-store';
import { OAuthError } from '@/lib/jubelio';
import { newJubelioApi } from '@/lib/jubelio-app';

function redirectHome(request: NextRequest, param: 'installed' | 'error', value: string) {
  const url = new URL('/', request.url);
  url.searchParams.set(param, value);
  const res = NextResponse.redirect(url, 303);
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('Referrer-Policy', 'no-referrer');
  return res;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return redirectHome(request, 'error', 'missing_code');
  }

  try {
    await saveTokens(await newJubelioApi().getToken(code));
    return redirectHome(request, 'installed', '1');
  } catch (err) {
    if (err instanceof OAuthError) {
      console.error('oauth code exchange failed', err.code, err.description);
      return redirectHome(request, 'error', err.code);
    }
    console.error('oauth callback failed', err);
    return redirectHome(request, 'error', 'server_error');
  }
}
