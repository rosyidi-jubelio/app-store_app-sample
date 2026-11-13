import 'server-only';

import createClient, { type Middleware } from 'openapi-fetch';

import type { paths } from '@/lib/jubelio/schema';

export type AccessTokenProvider = (options: { forceRefresh: boolean }) => Promise<string>;

export type JubelioClientOptions = {
  baseUrl: string;
  merchantId: string;
  getAccessToken: AccessTokenProvider;
  fetch?: typeof fetch;
};

export function createJubelioClient(options: JubelioClientOptions) {
  const doFetch = options.fetch ?? fetch;
  const pending = new WeakMap<Request, Request>();

  const auth: Middleware = {
    async onRequest({ request }) {
      pending.set(request, request.clone());
      request.headers.set('Authorization', `Bearer ${await options.getAccessToken({ forceRefresh: false })}`);
      request.headers.set('x-jbl-merchant-id', options.merchantId);
      request.headers.set('Accept', 'application/json');
      return request;
    },
    async onResponse({ request, response }) {
      const original = pending.get(request);
      pending.delete(request);
      if (response.status !== 401 || !original) {
        return response;
      }
      original.headers.set('Authorization', `Bearer ${await options.getAccessToken({ forceRefresh: true })}`);
      original.headers.set('x-jbl-merchant-id', options.merchantId);
      original.headers.set('Accept', 'application/json');
      return doFetch(original);
    },
  };

  const client = createClient<paths>({
    baseUrl: options.baseUrl.replace(/\/$/, ''),
    fetch: doFetch,
    cache: 'no-store',
  });
  client.use(auth);
  return client;
}

export type JubelioClient = ReturnType<typeof createJubelioClient>;
