import 'server-only';

import { config } from '@/lib/config';
import { getInstall, type Install, saveTokens } from '@/lib/install-store';
import { refreshAccessToken } from '@/lib/jubelio/oauth';

export type MerchantProfile = {
  merchant_id: string;
  company_name: string;
  subscription: {
    status: 'trial' | 'active' | 'over_due' | 'cancelled' | 'expired';
    plan?: { plan_id: number; name: string };
    trial_ends_at: string | null;
    current_period_ends_at: string | null;
  } | null;
};

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

async function validAccessToken(install: Install): Promise<string> {
  if (install.accessTokenExpiresAt - REFRESH_MARGIN_MS > Date.now()) {
    return install.accessToken;
  }
  if (!install.refreshToken) {
    throw new Error('access token expired and no refresh token is stored');
  }
  const refreshed = await saveTokens(await refreshAccessToken(install.refreshToken));
  return refreshed.accessToken;
}

export async function jubelioFetch<T>(merchantId: string, pathname: string): Promise<T> {
  const install = await getInstall(merchantId);
  if (!install) {
    throw new Error(`no install stored for merchant ${merchantId}`);
  }

  const res = await fetch(`${config.apiUrl}${pathname}`, {
    headers: {
      Authorization: `Bearer ${await validAccessToken(install)}`,
      'x-jbl-merchant-id': merchantId,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.error?.message ?? payload?.error ?? `HTTP ${res.status}`;
    throw new Error(`${pathname} failed: ${message}`);
  }
  return payload.data as T;
}

export function getMerchant(merchantId: string) {
  return jubelioFetch<MerchantProfile>(merchantId, '/merchant');
}
