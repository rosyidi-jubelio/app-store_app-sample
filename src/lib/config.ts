import 'server-only';

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export const config = {
  get clientId() {
    return required('JUBELIO_CLIENT_ID');
  },
  get clientSecret() {
    return required('JUBELIO_CLIENT_SECRET');
  },
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  get sessionSecret() {
    return required('SESSION_SECRET');
  },
  authUrl: optional('JUBELIO_AUTH_URL', 'https://open-api-auth.qm-staging-k8s.jubelio.io'),
  appStoreOrigins: optional('JUBELIO_APP_STORE_ORIGIN', 'https://app-store.jubelio.com')
    .split(/[\s,]+/)
    .filter(Boolean),
  apiUrl: optional('JUBELIO_API_URL', 'https://poc-open-api.qm-staging-k8s.jubelio.io/openapi/v1'),
  // Local development only: open the app as this merchant without an App Store session token.
  get devMerchantId() {
    return process.env.NODE_ENV === 'production' ? '' : optional('DEV_MERCHANT_ID', '').toUpperCase();
  },
};
