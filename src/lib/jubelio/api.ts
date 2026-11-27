import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

import { JubelioApiError, OAuthError, SessionTokenError } from '@/lib/jubelio/errors';
import type {
  Account,
  AccountCategory,
  AccountSummary,
  Asset,
  AssetDepreciation,
  AssetSummary,
  AttributeMapping,
  AttributeOption,
  Bill,
  BillSummary,
  CashBankTransaction,
  CashBankTransactionSummary,
  Category,
  CategoryMappingItem,
  CategorySummary,
  ChannelCategoryDetail,
  ContactDetail,
  ContactSummary,
  CustomerPayment,
  CustomerPaymentSummary,
  Invoice,
  InvoiceCogs,
  InvoiceSummary,
  Journal,
  JournalInput,
  JournalSummary,
  LocationDetail,
  Location,
  MerchantProfile,
  OfflinePrice,
  OnlinePrice,
  Order,
  Page,
  PriceAdjustment,
  PriceAdjustmentItem,
  PriceSyncFailure,
  Product,
  ProductSummary,
  PromotionPrice,
  PurchaseOrder,
  PurchaseOrderSummary,
  PurchaseReturn,
  PurchaseReturnSummary,
  Region,
  RegionLevel,
  SalesOrder,
  SalesOrderEscrow,
  SalesOrderSummary,
  SalesReturn,
  SalesReturnSummary,
  SessionTokenClaims,
  SupplierPayment,
  SupplierPaymentSummary,
  Tax,
  TokenSet,
  VariationMapping,
  VariationOption,
} from '@/lib/jubelio/types';

const AUTH_URL = 'https://open-api-auth.qm-staging-k8s.jubelio.io';
const API_URL = 'https://poc-open-api.qm-staging-k8s.jubelio.io/openapi/v1';
const TIMEOUT_MS = 15_000;
const MERCHANT_ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{12}$/i;
const SESSION_TOKEN_ISSUER = 'https://jubelio.com';
const SESSION_TOKEN_LEEWAY_SECONDS = 10;

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

  async callAPI<T>(
    method: string,
    path: string,
    query: Query = {},
    body: unknown = null,
    retry = 0,
  ): Promise<Envelope<T>> {
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

  verifySessionToken(token: string): SessionTokenClaims {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new SessionTokenError('malformed');
    }
    const [headerPart, payloadPart, signaturePart] = parts;

    let header: { alg?: string };
    let claims: SessionTokenClaims;
    try {
      header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8'));
      claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
    } catch {
      throw new SessionTokenError('malformed');
    }
    if (header.alg !== 'HS256') {
      throw new SessionTokenError('unexpected alg');
    }

    const expected = createHmac('sha256', this.clientSecret).update(`${headerPart}.${payloadPart}`).digest();
    const actual = Buffer.from(signaturePart, 'base64url');
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new SessionTokenError('bad signature');
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== 'number' || claims.exp + SESSION_TOKEN_LEEWAY_SECONDS < now) {
      throw new SessionTokenError('expired');
    }
    if (typeof claims.iat === 'number' && claims.iat - SESSION_TOKEN_LEEWAY_SECONDS > now) {
      throw new SessionTokenError('issued in the future');
    }
    if (claims.iss !== SESSION_TOKEN_ISSUER) {
      throw new SessionTokenError('wrong issuer');
    }
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audience.includes(this.clientId)) {
      throw new SessionTokenError('issued for another app');
    }
    if (!claims.sub || !claims.jti || !MERCHANT_ID_PATTERN.test(claims.merchant_id ?? '')) {
      throw new SessionTokenError('missing sub, jti or merchant_id');
    }

    claims.merchant_id = claims.merchant_id.toUpperCase();
    return claims;
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

  async getList<T>(path: string, page = 1, pageSize = 20, query: Query = {}): Promise<Page<T>> {
    const res = await this.callAPI<T[]>('GET', path, {
      page,
      page_size: pageSize,
      ...query,
    });
    return {
      data: res.data,
      meta: res.meta as Page<T>['meta'],
    };
  }

  async getOne<T>(path: string, query: Query = {}): Promise<T> {
    const res = await this.callAPI<T>('GET', path, query);
    return res.data;
  }

  // ── Merchant Info ──

  async getMerchant() {
    const res = await this.callAPI<MerchantProfile>('GET', '/merchant');
    return res.data;
  }

  // ── Catalog: Categories ──

  getCategories(page = 1, pageSize = 20, q?: string) {
    return this.getList<CategorySummary>('/catalog/categories', page, pageSize, { q });
  }

  getCategory(categoryId: number) {
    return this.getOne<Category>(`/catalog/categories/${categoryId}`);
  }

  /** `categoryId` 0 returns the root categories. */
  getCategoryChildren(categoryId: number) {
    return this.getOne<Category[]>(`/catalog/categories/${categoryId}/children`);
  }

  getCategoryAncestors(categoryId: number) {
    return this.getOne<Category[]>(`/catalog/categories/${categoryId}/ancestors`);
  }

  // ── Catalog: Category Mappings ──

  getCategoryMappings(page = 1, pageSize = 20, q?: string) {
    return this.getList<CategoryMappingItem>('/catalog/categories/mappings', page, pageSize, { q });
  }

  getAttributeMappings(categoryId: number, channelId: number, page = 1, pageSize = 20) {
    return this.getList<AttributeMapping>(
      `/catalog/categories/${categoryId}/mappings/${channelId}/attributes`,
      page,
      pageSize,
    );
  }

  getAttributeOptions(categoryId: number, channelId: number) {
    return this.getOne<AttributeOption[]>(`/catalog/categories/${categoryId}/mappings/${channelId}/attribute-options`);
  }

  getVariationMappings(categoryId: number, channelId: number, page = 1, pageSize = 20) {
    return this.getList<VariationMapping>(
      `/catalog/categories/${categoryId}/mappings/${channelId}/variations`,
      page,
      pageSize,
    );
  }

  getVariationOptions(categoryId: number, channelId: number) {
    return this.getOne<VariationOption[]>(`/catalog/categories/${categoryId}/mappings/${channelId}/variation-options`);
  }

  // ── Catalog: Channel Categories ──

  /** `channelCategoryId` "0" returns the channel's root categories in `children`. */
  getChannelCategory(channelId: number, channelCategoryId: string) {
    return this.getOne<ChannelCategoryDetail>(
      `/catalog/categories/channel-categories/${channelId}/${encodeURIComponent(channelCategoryId)}`,
    );
  }

  // ── Catalog: Products ──

  getProducts(page = 1, pageSize = 20, q?: string) {
    return this.getList<ProductSummary>('/catalog/products', page, pageSize, {
      q,
    });
  }

  getProduct(productId: number) {
    return this.getOne<Product>(`/catalog/products/${productId}`);
  }

  // ── Catalog: Prices ──

  getOnlinePrices(page = 1, pageSize = 20, q?: string) {
    return this.getList<OnlinePrice>('/catalog/prices/online', page, pageSize, {
      q,
    });
  }

  getOfflinePrices(page = 1, pageSize = 20, q?: string) {
    return this.getList<OfflinePrice>('/catalog/prices/offline', page, pageSize, { q });
  }

  getPromotionPrices(page = 1, pageSize = 20, q?: string) {
    return this.getList<PromotionPrice>('/catalog/prices/on-promotion', page, pageSize, { q });
  }

  getPriceSyncFailures(page = 1, pageSize = 20, q?: string) {
    return this.getList<PriceSyncFailure>('/catalog/prices/sync-failures', page, pageSize, { q });
  }

  getPriceAdjustments(page = 1, pageSize = 20, type: 'online' | 'offline' = 'online') {
    return this.getList<PriceAdjustment>('/catalog/prices/adjustments', page, pageSize, { type });
  }

  getPriceAdjustment(adjustmentId: number) {
    return this.getOne<PriceAdjustment>(`/catalog/prices/adjustments/${adjustmentId}`);
  }

  getPriceAdjustmentItems(adjustmentId: number, page = 1, pageSize = 20) {
    return this.getList<PriceAdjustmentItem>(`/catalog/prices/adjustments/${adjustmentId}/items`, page, pageSize);
  }

  // ── WMS ──

  getLocations(page = 1, pageSize = 20, q?: string) {
    return this.getList<Location>('/locations', page, pageSize, { q });
  }

  getLocation(locationId: number) {
    return this.getOne<LocationDetail>(`/locations/${locationId}`);
  }

  // ── Finance ──

  getInvoices(page = 1, pageSize = 20) {
    return this.getList<InvoiceSummary>('/finance/invoices', page, pageSize);
  }

  getInvoice(invoiceId: number) {
    return this.getOne<Invoice>(`/finance/invoices/${invoiceId}`);
  }

  getInvoiceCogs(invoiceId: number) {
    return this.getOne<InvoiceCogs>(`/finance/invoices/${invoiceId}/cogs`);
  }

  getSalesReturns(page = 1, pageSize = 20) {
    return this.getList<SalesReturnSummary>('/finance/sales-returns', page, pageSize);
  }

  getSalesReturn(salesReturnId: number) {
    return this.getOne<SalesReturn>(`/finance/sales-returns/${salesReturnId}`);
  }

  getBills(page = 1, pageSize = 20) {
    return this.getList<BillSummary>('/finance/bills', page, pageSize);
  }

  getBill(billId: number) {
    return this.getOne<Bill>(`/finance/bills/${billId}`);
  }

  getPurchaseReturns(page = 1, pageSize = 20) {
    return this.getList<PurchaseReturnSummary>('/finance/purchase-returns', page, pageSize);
  }

  getPurchaseReturn(purchaseReturnId: number) {
    return this.getOne<PurchaseReturn>(`/finance/purchase-returns/${purchaseReturnId}`);
  }

  getCustomerPayments(page = 1, pageSize = 20) {
    return this.getList<CustomerPaymentSummary>('/finance/customer-payments', page, pageSize);
  }

  getCustomerPayment(paymentId: number) {
    return this.getOne<CustomerPayment>(`/finance/customer-payments/${paymentId}`);
  }

  getSupplierPayments(page = 1, pageSize = 20) {
    return this.getList<SupplierPaymentSummary>('/finance/supplier-payments', page, pageSize);
  }

  getSupplierPayment(paymentId: number) {
    return this.getOne<SupplierPayment>(`/finance/supplier-payments/${paymentId}`);
  }

  getCashBankTransactions(page = 1, pageSize = 20) {
    return this.getList<CashBankTransactionSummary>('/finance/cash-bank-transactions', page, pageSize);
  }

  getCashBankTransaction(transactionId: number) {
    return this.getOne<CashBankTransaction>(`/finance/cash-bank-transactions/${transactionId}`);
  }

  getSupplierContacts(page = 1, pageSize = 20) {
    return this.getList<ContactSummary>('/finance/supplier-contacts', page, pageSize);
  }

  getSupplierContact(contactId: number) {
    return this.getOne<ContactDetail>(`/finance/supplier-contacts/${contactId}`);
  }

  getCustomerContacts(page = 1, pageSize = 20) {
    return this.getList<ContactSummary>('/finance/customer-contacts', page, pageSize);
  }

  getCustomerContact(contactId: number) {
    return this.getOne<ContactDetail>(`/finance/customer-contacts/${contactId}`);
  }

  getSalesOrders(page = 1, pageSize = 20) {
    return this.getList<SalesOrderSummary>('/finance/sales-orders', page, pageSize);
  }

  getSalesOrder(salesOrderId: number) {
    return this.getOne<SalesOrder>(`/finance/sales-orders/${salesOrderId}`);
  }

  getSalesOrderEscrow(salesOrderId: number) {
    return this.getOne<SalesOrderEscrow>(`/finance/sales-orders/${salesOrderId}/escrow`);
  }

  getPurchaseOrders(page = 1, pageSize = 20) {
    return this.getList<PurchaseOrderSummary>('/finance/purchase-orders', page, pageSize);
  }

  getPurchaseOrder(purchaseOrderId: number) {
    return this.getOne<PurchaseOrder>(`/finance/purchase-orders/${purchaseOrderId}`);
  }

  getAssets(page = 1, pageSize = 20) {
    return this.getList<AssetSummary>('/finance/assets', page, pageSize);
  }

  getAsset(assetId: number) {
    return this.getOne<Asset>(`/finance/assets/${assetId}`);
  }

  getAssetDepreciations(assetId: number, page = 1, pageSize = 20) {
    return this.getList<AssetDepreciation>(`/finance/assets/${assetId}/depreciations`, page, pageSize);
  }

  getAccounts(page = 1, pageSize = 20, q?: string) {
    return this.getList<AccountSummary>('/finance/accounts', page, pageSize, {
      q,
    });
  }

  getAccountCategories(page = 1, pageSize = 20, q?: string) {
    return this.getList<AccountCategory>('/finance/accounts/categories', page, pageSize, { q });
  }

  getAccount(accountId: number) {
    return this.getOne<Account>(`/finance/accounts/${accountId}`);
  }

  getTaxes(page = 1, pageSize = 20, q?: string) {
    return this.getList<Tax>('/finance/taxes', page, pageSize, { q });
  }

  getJournals(page = 1, pageSize = 20) {
    return this.getList<JournalSummary>('/finance/journals', page, pageSize);
  }

  getJournal(journalId: number) {
    return this.getOne<Journal>(`/finance/journals/${journalId}`);
  }

  /** Needs `finance.journal.create`. Total debit must equal total credit. Returns the journal as stored. */
  async createJournal(input: JournalInput) {
    const res = await this.callAPI<Journal>('POST', '/finance/journals', {}, input);
    return res.data;
  }

  // ── Reference ──

  /** `parentId` is required for every level except `province`. */
  getRegions(level: RegionLevel, parentId?: string) {
    return this.getOne<Region[]>('/regions', { level, parent_id: parentId });
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
