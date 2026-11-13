import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

import { config } from '@/lib/config';

const COOKIE_NAME = 'app_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function sign(value: string) {
  return createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

export function sessionCookie(merchantId: string) {
  return {
    name: COOKIE_NAME,
    value: `${merchantId}.${sign(merchantId)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function getSessionMerchantId(): Promise<string | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [merchantId, signature] = raw.split('.');
  if (!merchantId || !signature) return null;

  const expected = Buffer.from(sign(merchantId));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  return merchantId;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}
