export type TokenSet = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  merchant_id: string;
  scopes: string[];
};

export type SessionTokenClaims = {
  iss: string;
  aud: string | string[];
  sub: string;
  merchant_id: string;
  jti: string;
  iat: number;
  exp: number;
};

export type PageMeta = {
  page: number;
  page_size: number;
};

export type Page<T> = {
  data: T[];
  meta: PageMeta;
};

export type SubscriptionStatus = 'trial' | 'active' | 'over_due' | 'cancelled' | 'expired';

export type MerchantProfile = {
  merchant_id: string;
  company_name: string;
  subscription: {
    status: SubscriptionStatus;
    plan: {
      plan_id: number;
      name: string;
    };
    billing_cycle: 'monthly' | 'yearly' | null;
    trial_ends_at: string | null;
    current_period_ends_at: string | null;
    grace_period_ends_at: string | null;
  } | null;
};

export type ProductSkuSummary = {
  sku_id: number;
  sku_code: string;
  sku_name: string;
  barcode: string | null;
  sell_price: number | null;
};

export type ProductSummary = {
  product_id: number;
  product_name: string;
  category_id: number | null;
  sell_price: number | null;
  thumbnail: string | null;
  is_consignment: boolean;
  last_modified: string | null;
  product_skus: ProductSkuSummary[];
};

export type Product = {
  product_id: number;
  product_name: string;
  description: string | null;
  category_id: number | null;
  brand_id: number | null;
  brand_name: string | null;
  sell_price: number | null;
  is_active: boolean;
  has_variation: boolean;
  has_bundle: boolean;
  last_modified: string | null;
};

export type CategorySummary = {
  category_id: number;
  category_name: string;
  full_name: string;
  has_children: boolean;
};

export type Order = {
  order_id: number;
  order_no: string;
  status: string;
  customer_name: string;
  grand_total: number;
  courier: string | null;
  transaction_date: string;
  created_at: string;
};
