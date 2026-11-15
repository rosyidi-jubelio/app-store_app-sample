import 'server-only';

function required(name: string): string {
  const value = process.env[name];
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
  authUrl: process.env.JUBELIO_AUTH_URL ?? 'https://open-api-auth.qm-staging-k8s.jubelio.io',
  appStoreOrigin: process.env.JUBELIO_APP_STORE_ORIGIN ?? 'https://app-store.jubelio.com',
  apiUrl: process.env.JUBELIO_API_URL ?? 'https://poc-open-api.qm-staging-k8s.jubelio.io/openapi/v1',
};
