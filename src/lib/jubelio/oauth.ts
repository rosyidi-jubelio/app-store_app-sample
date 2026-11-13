import 'server-only';

import { config } from '@/lib/config';

export type TokenSet = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  merchant_id: string;
  scopes: string[];
};

export class OAuthError extends Error {
  constructor(
    readonly code: string,
    readonly description: string,
    readonly status: number,
  ) {
    super(`${code}: ${description}`);
  }
}

const MERCHANT_ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{12}$/i;

async function requestToken(params: Record<string, string>): Promise<TokenSet> {
  const body = new URLSearchParams({
    ...params,
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const res = await fetch(`${config.authUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new OAuthError(
      payload?.error ?? 'server_error',
      payload?.error_description ?? `token endpoint returned ${res.status}`,
      res.status,
    );
  }

  const set = payload as TokenSet;
  if (!set?.access_token || !MERCHANT_ID_PATTERN.test(set.merchant_id ?? '')) {
    throw new OAuthError('server_error', 'token response is missing access_token or merchant_id', 502);
  }
  set.merchant_id = set.merchant_id.toUpperCase();
  return set;
}

export function exchangeCode(code: string) {
  return requestToken({
    grant_type: 'authorization_code',
    code,
  });
}

export function refreshAccessToken(refreshToken: string) {
  return requestToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
}
