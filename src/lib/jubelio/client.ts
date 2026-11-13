import 'server-only';

import { JubelioApiError } from '@/lib/jubelio/errors';
import type {
  CategorySummary,
  ListParams,
  MerchantProfile,
  Order,
  Page,
  Product,
  ProductSummary,
} from '@/lib/jubelio/types';

export type AccessTokenProvider = (options: { forceRefresh: boolean }) => Promise<string>;

export type JubelioClientOptions = {
  baseUrl: string;
  merchantId: string;
  getAccessToken: AccessTokenProvider;
  fetch?: typeof fetch;
};

type RequestOptions = {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
};

type Envelope<T> = {
  data: T;
  meta: unknown;
  error: { code: string; message: string } | null;
  request_id: string;
};

export function createJubelioClient(options: JubelioClientOptions) {
  const doFetch = options.fetch ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, '');

  async function send(method: string, path: string, init: RequestOptions, forceRefresh: boolean) {
    const url = new URL(baseUrl + path);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${await options.getAccessToken({ forceRefresh })}`,
      'x-jbl-merchant-id': options.merchantId,
      Accept: 'application/json',
    };
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';

    return doFetch(url, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  }

  async function request<T>(method: string, path: string, init: RequestOptions = {}): Promise<Envelope<T>> {
    let res = await send(method, path, init, false);
    if (res.status === 401) {
      res = await send(method, path, init, true);
    }

    const payload = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !payload || payload.error) {
      throw new JubelioApiError(
        res.status,
        payload?.error?.code ?? 'unknown_error',
        payload?.error?.message ?? res.statusText,
        payload?.request_id ?? res.headers.get('x-request-id'),
      );
    }
    return payload;
  }

  async function list<T>(path: string, params: ListParams = {}): Promise<Page<T>> {
    const { data, meta } = await request<T[]>('GET', path, { query: params });
    return { data, meta: meta as Page<T>['meta'] };
  }

  return {
    request,

    merchant: {
      async get() {
        return (await request<MerchantProfile>('GET', '/merchant')).data;
      },
    },

    products: {
      list(params?: ListParams) {
        return list<ProductSummary>('/catalog/products', params);
      },
      async get(productId: number) {
        return (await request<Product>('GET', `/catalog/products/${productId}`)).data;
      },
    },

    categories: {
      list(params?: ListParams) {
        return list<CategorySummary>('/catalog/categories', params);
      },
    },

    orders: {
      list(params?: ListParams) {
        return list<Order>('/orders', params);
      },
    },
  };
}

export type JubelioClient = ReturnType<typeof createJubelioClient>;
