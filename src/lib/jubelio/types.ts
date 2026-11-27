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

// Response types for the remaining GET endpoints in openapi.yaml. They list the
// main fields of each schema; nested arrays are left loosely typed.

type Rows = Record<string, unknown>[];

export type Category = {
  category_id: number;
  category_name: string;
  parent_id: number;
  has_children: boolean;
};

export type ChannelCategoryRef = {
  channel_id: number;
  channel_category_id: string;
  channel_category_name: string | null;
  channel_full_category_name: string | null;
};

export type CategoryMappingItem = {
  category_id: number;
  category_name: string;
  full_name: string;
  mappings: ChannelCategoryRef[];
};

export type AttributeMapping = {
  attribute_id: number;
  attribute_name: string;
  channel_attribute_name: string | null;
};

export type AttributeOption = {
  channel_attribute_name: string;
  display_name: string;
};

export type VariationMapping = {
  variation_id: number;
  variation_name: string;
  channel_variation_name: string | null;
};

export type VariationOption = {
  channel_variation_id: string;
  channel_variation_name: string;
};

export type ChannelCategory = {
  channel_category_id: string;
  category_name: string;
  parent_id: string;
};

export type ChannelCategoryDetail = {
  category: ChannelCategory | null;
  ancestors: ChannelCategory[];
  children: { channel_category_id: string; category_name: string; has_children: boolean }[];
};

export type OnlinePrice = {
  sku_id: number;
  sku_code: string;
  sku_name: string;
  product_id: number;
  default_price: number | null;
  last_modified: string | null;
  store_prices: Rows;
};

export type OfflinePrice = {
  sku_id: number;
  sku_code: string;
  sku_name: string;
  product_id: number;
  default_price: number | null;
  location_prices: Rows;
};

export type PromotionPrice = {
  promotion_id: number;
  promotion_name: string;
  promotion_type: 'channel' | 'pos_discount' | 'pos_min_qty' | 'pos_buy_x_get_y' | 'pos_free_item_min_trans';
  sku_id: number;
  sku_code: string;
  sell_price: number | null;
  promotion_price: number | null;
  channels: Rows;
};

export type PriceSyncFailure = {
  log_id: number;
  failed_at: string;
  product_id: number;
  product_name: string;
  sku_code: string | null;
  channel_id: number;
  store_name: string | null;
  price: number | null;
  error_message: string | null;
};

export type PriceAdjustment = {
  adjustment_id: number;
  adjustment_no: string;
  type: 'online' | 'offline';
  note: string | null;
  created_by: string | null;
  created_at: string | null;
  item_count: number | null;
  synced_count: number | null;
};

export type PriceAdjustmentItem = {
  sku_id: number;
  sku_code: string;
  sku_name: string;
  error_count: number;
  prices: Rows;
};

export type Location = {
  location_id: number;
  location_name: string;
  location_code: string | null;
  address: string;
  city: string;
  province: string;
  is_active: boolean;
  is_warehouse: boolean;
};

export type LocationDetail = Location & {
  phone: string;
  email: string;
  contact_name: string | null;
  bins: Rows;
};

export type PaymentStatus = 'paid' | 'unpaid' | 'overdue';

export type InvoiceSummary = {
  invoice_id: number;
  invoice_no: string;
  contact_id: number;
  customer_name: string;
  transaction_date: string;
  due_date: string;
  grand_total: number;
  due: number;
  status: PaymentStatus;
};

export type Invoice = InvoiceSummary & {
  location_id: number | null;
  channel_id: number | null;
  store_id: number | null;
  is_tax_included: boolean;
  sub_total: number;
  total_tax: number;
  paid_amount: number;
  lines: Rows;
};

export type InvoiceCogs = {
  invoice_id: number;
  invoice_no: string;
  total_cogs: number;
  lines: Rows;
};

export type SalesReturnSummary = {
  sales_return_id: number;
  return_no: string;
  contact_id: number;
  customer_name: string;
  invoice_no: string | null;
  transaction_date: string;
  grand_total: number;
  due: number;
  status: PaymentStatus;
};

export type SalesReturn = SalesReturnSummary & {
  invoice_id: number | null;
  location_id: number | null;
  is_tax_included: boolean;
  is_settled: boolean;
  lines: Rows;
};

export type BillSummary = {
  bill_id: number;
  bill_no: string;
  contact_id: number;
  supplier_name: string;
  purchaseorder_no: string | null;
  transaction_date: string;
  due_date: string;
  grand_total: number;
  due: number;
  status: PaymentStatus;
};

export type Bill = BillSummary & {
  purchaseorder_id: number | null;
  payment_term: number | null;
  location_id: number | null;
  is_tax_included: boolean;
  paid_amount: number;
  lines: Rows;
};

export type PurchaseReturnSummary = {
  purchase_return_id: number;
  return_no: string;
  contact_id: number;
  supplier_name: string;
  bill_no: string | null;
  transaction_date: string;
  grand_total: number;
  due: number;
  status: PaymentStatus;
};

export type PurchaseReturn = PurchaseReturnSummary & {
  bill_id: number | null;
  location_id: number | null;
  is_tax_included: boolean;
  lines: Rows;
};

export type CustomerPaymentSummary = {
  payment_id: number;
  payment_no: string;
  transaction_date: string;
  contact_id: number;
  customer_name: string;
  account_name: string;
  amount: number;
  settlement_no: string | null;
};

export type CustomerPayment = CustomerPaymentSummary & {
  account_id: number;
  is_cheque: boolean;
  lines: Rows;
};

export type SupplierPaymentSummary = {
  payment_id: number;
  payment_no: string;
  transaction_date: string;
  contact_id: number;
  supplier_name: string;
  account_name: string;
  amount: number;
};

export type SupplierPayment = SupplierPaymentSummary & {
  account_id: number;
  is_cheque: boolean;
  lines: Rows;
};

export type CashBankTransactionSummary = {
  transaction_id: number;
  transaction_no: string;
  type: 'receive' | 'payment';
  transaction_date: string;
  contact_name: string;
  account_name: string;
  amount: number;
};

export type CashBankTransaction = CashBankTransactionSummary & {
  contact_id: number;
  account_id: number;
  note: string | null;
  lines: Rows;
};

export type ContactSummary = {
  contact_id: number;
  contact_name: string;
  type: string;
  primary_contact: string | null;
  email: string | null;
  phone: string | null;
  payment_term: number | null;
};

export type ContactDetail = ContactSummary & {
  is_company: boolean;
  is_pkp: boolean;
  billing_address: Record<string, unknown>;
  shipping_address: Record<string, unknown>;
  created_at: string;
};

export type SalesOrderSummary = {
  salesorder_id: number;
  salesorder_no: string;
  transaction_date: string;
  customer_name: string;
  channel_name: string;
  store_name: string | null;
  grand_total: number;
  is_paid: boolean;
  is_canceled: boolean;
  wms_status: string | null;
};

export type SalesOrder = SalesOrderSummary & {
  contact_id: number;
  location_id: number;
  invoice_id: number | null;
  shipping: Record<string, unknown>;
  lines: Rows;
};

export type SalesOrderEscrow = {
  salesorder_id: number;
  salesorder_no: string;
  source: number;
  source_name: string;
  escrow_amount: number;
  escrow_list: unknown;
};

export type PurchaseOrderSummary = {
  purchaseorder_id: number;
  purchaseorder_no: string;
  transaction_date: string;
  contact_id: number;
  supplier_name: string;
  grand_total: number;
  status: 'active' | 'closed';
  bill_numbers: string[];
};

export type PurchaseOrder = PurchaseOrderSummary & {
  location_id: number;
  payment_term: number | null;
  is_tax_included: boolean;
  lines: Rows;
};

export type AssetSummary = {
  asset_id: number;
  asset_code: string;
  asset_name: string;
  category_name: string;
  status: 'active' | 'inactive';
};

export type Asset = AssetSummary & {
  buy_date: string;
  use_date: string;
  acquisition_cost: number;
  is_depreciated: boolean;
  accumulated_depreciation: number;
  book_value: number;
};

export type AssetDepreciation = {
  transaction_date: string;
  journal_id: number | null;
  journal_no: string | null;
  amount: number | null;
};

export type AccountSummary = {
  account_id: number;
  account_code: string;
  account_name: string;
  category_name: string;
  is_system_account: boolean;
};

export type Account = AccountSummary & {
  category_id: number;
  type: 'cash' | 'bank' | null;
  is_active: boolean;
};

export type AccountCategory = {
  category_id: number;
  category_name: string;
  normal_balance: 'debit' | 'credit';
};

export type Tax = {
  tax_id: number;
  tax_name: string;
  rate: number;
};

export type JournalSummary = {
  journal_id: number;
  journal_no: string;
  journal_type: 'manual' | 'auto';
  transaction_type: string;
  transaction_date: string;
  source_doc_no: string | null;
  total_debit: number;
  total_credit: number;
};

export type Journal = {
  journal_id: number;
  journal_no: string;
  journal_type: 'manual' | 'auto';
  transaction_date: string;
  notes: string | null;
  lines: Rows;
};

export type RegionLevel = 'province' | 'city' | 'district' | 'subdistrict';

export type Region = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type JournalInput = {
  /** ISO date-time. */
  transaction_date: string;
  notes?: string | null;
  /** At least two lines. Each line has an amount in exactly one of `debit` and `credit`. */
  lines: { account_id: number; description?: string | null; debit?: number; credit?: number }[];
};
