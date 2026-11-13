import 'server-only';

import { config } from '@/lib/config';
import { getInstall, saveTokens } from '@/lib/install-store';
import { createJubelioClient, createOAuthClient } from '@/lib/jubelio';

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export function oauth() {
  return createOAuthClient({
    authUrl: config.authUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
}

const refreshing = new Map<string, Promise<string>>();

function refresh(merchantId: string, refreshToken: string) {
  let pending = refreshing.get(merchantId);
  if (!pending) {
    pending = oauth()
      .refreshAccessToken(refreshToken)
      .then(saveTokens)
      .then((install) => install.accessToken)
      .finally(() => refreshing.delete(merchantId));
    refreshing.set(merchantId, pending);
  }
  return pending;
}

export function jubelioFor(merchantId: string) {
  return createJubelioClient({
    baseUrl: config.apiUrl,
    merchantId,
    async getAccessToken({ forceRefresh }) {
      const install = await getInstall(merchantId);
      if (!install) {
        throw new Error(`no install stored for merchant ${merchantId}`);
      }
      const fresh = install.accessTokenExpiresAt - REFRESH_MARGIN_MS > Date.now();
      if (fresh && !forceRefresh) {
        return install.accessToken;
      }
      if (!install.refreshToken) {
        throw new Error('access token expired and no refresh token is stored');
      }
      return refresh(merchantId, install.refreshToken);
    },
  });
}
