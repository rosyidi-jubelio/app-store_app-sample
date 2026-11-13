import 'server-only';

import { config } from '@/lib/config';
import { getInstall, saveTokens } from '@/lib/install-store';
import { JubelioApi } from '@/lib/jubelio';

export function newJubelioApi() {
  return new JubelioApi({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authUrl: config.authUrl,
    apiUrl: config.apiUrl,
  });
}

export async function jubelioFor(merchantId: string) {
  const install = await getInstall(merchantId);
  if (!install) {
    throw new Error(`no install stored for merchant ${merchantId}`);
  }

  const api = new JubelioApi({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    authUrl: config.authUrl,
    apiUrl: config.apiUrl,
    merchantId,
    accessToken: install.accessToken,
    refreshToken: install.refreshToken,
  });
  api.onTokenRefreshed = async (tokens) => {
    await saveTokens(tokens);
  };
  return api;
}
