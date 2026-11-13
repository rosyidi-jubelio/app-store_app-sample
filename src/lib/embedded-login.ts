import 'server-only';

import { getInstall } from '@/lib/install-store';
import { SessionTokenError } from '@/lib/jubelio';
import { newJubelioApi } from '@/lib/jubelio-app';

const seenJti = new Map<string, number>();

function rememberJti(jti: string, exp: number) {
  const now = Date.now();
  for (const [key, expiresAt] of seenJti) {
    if (expiresAt < now) seenJti.delete(key);
  }
  if (seenJti.has(jti)) return false;
  seenJti.set(jti, (exp + 60) * 1000);
  return true;
}

export type EmbeddedLoginResult =
  | { ok: true; merchantId: string; userId: string }
  | { ok: false; error: 'invalid_session_token' | 'session_token_reused' | 'not_installed'; detail?: string };

export async function loginWithSessionToken(token: string): Promise<EmbeddedLoginResult> {
  let claims;
  try {
    claims = newJubelioApi().verifySessionToken(token);
  } catch (err) {
    if (err instanceof SessionTokenError) {
      return { ok: false, error: 'invalid_session_token', detail: err.reason };
    }
    throw err;
  }

  if (!rememberJti(claims.jti, claims.exp)) {
    return { ok: false, error: 'session_token_reused' };
  }

  if (!(await getInstall(claims.merchant_id))) {
    return { ok: false, error: 'not_installed' };
  }

  return { ok: true, merchantId: claims.merchant_id, userId: claims.sub };
}
