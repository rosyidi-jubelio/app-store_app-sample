import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

import { config } from '@/lib/config';

export type AppSession = {
  merchantId: string;
  userId: string;
  expiresAt: number;
};

const COOKIE_NAME = 'app_session';
const SESSION_TTL_SECONDS = 60 * 60;

function sign(value: string) {
  return createHmac('sha256', config.sessionSecret).update(value).digest('base64url');
}

export function sessionCookie(merchantId: string, userId: string) {
  const session: AppSession = {
    merchantId,
    userId,
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return {
    name: COOKIE_NAME,
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    partitioned: true,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getSession(): Promise<AppSession | null> {
  await connection();
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AppSession;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}
