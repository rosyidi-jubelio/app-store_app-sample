import 'server-only';

import { JubelioApiError, OAuthError } from '@/lib/jubelio/errors';
import type {
  CategorySummary,
  MerchantProfile,
  Order,
  Page,
  Product,
  ProductSummary,
  TokenSet,
} from '@/lib/jubelio/types';

const AUTH_URL = 'https://open-api-auth.qm-staging-k8s.jubelio.io';
const API_URL = 'https://poc-open-api.qm-staging-k8s.jubelio.io/openapi/v1';
const TIMEOUT_MS = 15_000;
const MERCHANT_ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{12}$/i;

type Query = Record<string, string | number | undefined>;

type Envelope<T> = {
  data: T;
  meta: unknown;
  error: { code: string; message: string } | null;
  request_id: string;
};

export type JubelioApiOptions = {
  clientId: string;
  clientSecret: string;
  merchantId?: string;
  accessToken?: string;
  refreshToken?: string | null;
  authUrl?: string;
  apiUrl?: string;
  logger?: Pick<Console, 'info' | 'error'>;
};

class JubelioApi {
  clientId: string;
  clientSecret: string;
  merchantId: string | null;
  accessToken: string | null;
  refreshTokenValue: string | null;
  authUrl: string;
  apiUrl: string;
  logger: Pick<Console, 'info' | 'error'>;

  constructor(options: JubelioApiOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.merchantId = options.merchantId ?? null;
    this.accessToken = options.accessToken ?? null;
    this.refreshTokenValue = options.refreshToken ?? null;
    this.authUrl = (options.authUrl ?? AUTH_URL).replace(/\/$/, '');
    this.apiUrl = (options.apiUrl ?? API_URL).replace(/\/$/, '');
    this.logger = options.logger ?? console;
  }

  onTokenRefreshed: (tokens: TokenSet) => Promise<void> = async () => {};

  onRefreshTokenExpired: () => Promise<void> = async () => {};

  async callAuth(params: Record<string, string>): Promise<TokenSet> {
    const res = await fetch(`${this.authUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        ...params,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new OAuthError(
        payload?.error ?? 'server_error',
        payload?.error_description ?? `token endpoint returned ${res.status}`,
        res.status,
      );
    }

    const tokens = payload as TokenSet;
    if (!tokens?.access_token || !MERCHANT_ID_PATTERN.test(tokens.merchant_id ?? '')) {
      throw new OAuthError('server_error', 'token response is missing access_token or merchant_id', 502);
    }
    tokens.merchant_id = tokens.merchant_id.toUpperCase();

    this.merchantId = tokens.merchant_id;
    this.accessToken = tokens.access_token;
    this.refreshTokenValue = tokens.refresh_token ?? this.refreshTokenValue;
    return tokens;
  }

  async callAPI<T>(method: string, path: string, query: Query = {}, body: unknown = null, retry = 0): Promise<Envelope<T>> {
    if (!this.accessToken || !this.merchantId) {
      throw new Error('JubelioApi needs accessToken and merchantId before calling the API');
    }

    const url = new URL(`${this.apiUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'x-jbl-merchant-id': this.merchantId,
      Accept: 'application/json',
    };
    if (body !== null) headers['Content-Type'] = 'application/json';

    const res = await fetch(url, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 401 && retry === 0 && this.refreshTokenValue) {
      await this.refreshToken();
      return this.callAPI<T>(method, path, query, body, retry + 1);
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

  getToken(code: string) {
    return this.callAuth({
      grant_type: 'authorization_code',
      code,
    });
  }

  async refreshToken() {
    if (!this.refreshTokenValue) {
      throw new Error('no refresh token to refresh with');
    }
    try {
      const tokens = await this.callAuth({
        grant_type: 'refresh_token',
        refresh_token: this.refreshTokenValue,
      });
      await this.onTokenRefreshed(tokens);
      return tokens;
    } catch (error) {
      if (error instanceof OAuthError && error.code === 'invalid_grant') {
        await this.onRefreshTokenExpired();
      }
      throw error;
    }
  }

  async getMerchant() {
    const res = await this.callAPI<MerchantProfile>('GET', '/merchant');
    return res.data;
  }

  async getProducts(page = 1, pageSize = 20, q?: string): Promise<Page<ProductSummary>> {
    const res = await this.callAPI<ProductSummary[]>('GET', '/catalog/products', {
      page,
      page_size: pageSize,
      q,
    });
    return {
      data: res.data,
      meta: res.meta as Page<ProductSummary>['meta'],
    };
  }

  async getProduct(productId: number) {
    const res = await this.callAPI<Product>('GET', `/catalog/products/${productId}`);
    return res.data;
  }

  async getCategories(page = 1, pageSize = 20, q?: string): Promise<Page<CategorySummary>> {
    const res = await this.callAPI<CategorySummary[]>('GET', '/catalog/categories', {
      page,
      page_size: pageSize,
      q,
    });
    return {
      data: res.data,
      meta: res.meta as Page<CategorySummary>['meta'],
    };
  }

  async getOrders(page = 1, pageSize = 20, q?: string): Promise<Page<Order>> {
    const res = await this.callAPI<Order[]>('GET', '/orders', {
      page,
      page_size: pageSize,
      q,
    });
    return {
      data: res.data,
      meta: res.meta as Page<Order>['meta'],
    };
  }
}

export default JubelioApi;
