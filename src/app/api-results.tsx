import type { JubelioApi } from '@/lib/jubelio';
import { JubelioApiError } from '@/lib/jubelio/errors';

type Result<T> = { data: T; error: null } | { data: null; error: string };

async function load<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { data: await fn(), error: null };
  } catch (err) {
    if (err instanceof JubelioApiError) {
      return {
        data: null,
        error: `${err.message}${err.requestId ? `\nrequest_id: ${err.requestId}` : ''}`,
      };
    }
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function skipped(reason: string): Result<never> {
  return { data: null, error: `dilewati: ${reason}` };
}

export async function ApiResults({ jubelio }: { jubelio: JubelioApi }) {
  // ── Merchant Info ──
  const merchant = await load(() => jubelio.getMerchant());

  // ── Catalog: Categories ──
  const categories = await load(() => jubelio.getCategories(1, 5));
  const categoryId = categories.data?.data[0]?.category_id;
  const category = categoryId ? await load(() => jubelio.getCategory(categoryId)) : skipped('belum ada kategori');
  const categoryChildren = categoryId
    ? await load(() => jubelio.getCategoryChildren(categoryId))
    : skipped('belum ada kategori');
  const categoryAncestors = categoryId
    ? await load(() => jubelio.getCategoryAncestors(categoryId))
    : skipped('belum ada kategori');
  const rootCategories = await load(() => jubelio.getCategoryChildren(0));

  // ── Catalog: Category Mappings ──
  const categoryMappings = await load(() => jubelio.getCategoryMappings(1, 5));
  const mapped = categoryMappings.data?.data.find((item) => item.mappings.length > 0);
  const mappedCategoryId = mapped?.category_id;
  const mappedChannelId = mapped?.mappings[0]?.channel_id;
  const hasMapping = mappedCategoryId != null && mappedChannelId != null;
  const attributeMappings = hasMapping
    ? await load(() => jubelio.getAttributeMappings(mappedCategoryId, mappedChannelId, 1, 5))
    : skipped('belum ada kategori yang di-mapping');
  const attributeOptions = hasMapping
    ? await load(() => jubelio.getAttributeOptions(mappedCategoryId, mappedChannelId))
    : skipped('belum ada kategori yang di-mapping');
  const variationMappings = hasMapping
    ? await load(() => jubelio.getVariationMappings(mappedCategoryId, mappedChannelId, 1, 5))
    : skipped('belum ada kategori yang di-mapping');
  const variationOptions = hasMapping
    ? await load(() => jubelio.getVariationOptions(mappedCategoryId, mappedChannelId))
    : skipped('belum ada kategori yang di-mapping');

  // ── Catalog: Channel Categories (Shopee = 64) ──
  const channelRoot = await load(() => jubelio.getChannelCategory(64, '0'));
  const channelCategoryId = channelRoot.data?.children[0]?.channel_category_id;
  const channelCategory = channelCategoryId
    ? await load(() => jubelio.getChannelCategory(64, channelCategoryId))
    : skipped('tidak ada kategori root Shopee');

  // ── Catalog: Products ──
  const products = await load(() => jubelio.getProducts(1, 5));
  const productId = products.data?.data[0]?.product_id;
  const product = productId ? await load(() => jubelio.getProduct(productId)) : skipped('belum ada produk');

  // ── Catalog: Prices ──
  const onlinePrices = await load(() => jubelio.getOnlinePrices(1, 5));
  const offlinePrices = await load(() => jubelio.getOfflinePrices(1, 5));
  const promotionPrices = await load(() => jubelio.getPromotionPrices(1, 5));
  const priceSyncFailures = await load(() => jubelio.getPriceSyncFailures(1, 5));
  const priceAdjustments = await load(() => jubelio.getPriceAdjustments(1, 5));
  const adjustmentId = priceAdjustments.data?.data[0]?.adjustment_id;
  const priceAdjustment = adjustmentId
    ? await load(() => jubelio.getPriceAdjustment(adjustmentId))
    : skipped('belum ada price adjustment');
  const priceAdjustmentItems = adjustmentId
    ? await load(() => jubelio.getPriceAdjustmentItems(adjustmentId, 1, 5))
    : skipped('belum ada price adjustment');

  // ── WMS ──
  const locations = await load(() => jubelio.getLocations(1, 5));
  const locationId = locations.data?.data[0]?.location_id;
  const location = locationId ? await load(() => jubelio.getLocation(locationId)) : skipped('belum ada lokasi');

  // ── Finance ──
  const invoices = await load(() => jubelio.getInvoices(1, 5));
  const invoiceId = invoices.data?.data[0]?.invoice_id;
  const invoice = invoiceId ? await load(() => jubelio.getInvoice(invoiceId)) : skipped('belum ada invoice');
  const invoiceCogs = invoiceId ? await load(() => jubelio.getInvoiceCogs(invoiceId)) : skipped('belum ada invoice');

  const salesReturns = await load(() => jubelio.getSalesReturns(1, 5));
  const salesReturnId = salesReturns.data?.data[0]?.sales_return_id;
  const salesReturn = salesReturnId
    ? await load(() => jubelio.getSalesReturn(salesReturnId))
    : skipped('belum ada sales return');

  const bills = await load(() => jubelio.getBills(1, 5));
  const billId = bills.data?.data[0]?.bill_id;
  const bill = billId ? await load(() => jubelio.getBill(billId)) : skipped('belum ada bill');

  const purchaseReturns = await load(() => jubelio.getPurchaseReturns(1, 5));
  const purchaseReturnId = purchaseReturns.data?.data[0]?.purchase_return_id;
  const purchaseReturn = purchaseReturnId
    ? await load(() => jubelio.getPurchaseReturn(purchaseReturnId))
    : skipped('belum ada purchase return');

  const customerPayments = await load(() => jubelio.getCustomerPayments(1, 5));
  const customerPaymentId = customerPayments.data?.data[0]?.payment_id;
  const customerPayment = customerPaymentId
    ? await load(() => jubelio.getCustomerPayment(customerPaymentId))
    : skipped('belum ada customer payment');

  const supplierPayments = await load(() => jubelio.getSupplierPayments(1, 5));
  const supplierPaymentId = supplierPayments.data?.data[0]?.payment_id;
  const supplierPayment = supplierPaymentId
    ? await load(() => jubelio.getSupplierPayment(supplierPaymentId))
    : skipped('belum ada supplier payment');

  const cashBankTransactions = await load(() => jubelio.getCashBankTransactions(1, 5));
  const cashBankTransactionId = cashBankTransactions.data?.data[0]?.transaction_id;
  const cashBankTransaction = cashBankTransactionId
    ? await load(() => jubelio.getCashBankTransaction(cashBankTransactionId))
    : skipped('belum ada transaksi kas & bank');

  const supplierContacts = await load(() => jubelio.getSupplierContacts(1, 5));
  const supplierContactId = supplierContacts.data?.data[0]?.contact_id;
  const supplierContact = supplierContactId
    ? await load(() => jubelio.getSupplierContact(supplierContactId))
    : skipped('belum ada supplier');

  const customerContacts = await load(() => jubelio.getCustomerContacts(1, 5));
  const customerContactId = customerContacts.data?.data[0]?.contact_id;
  const customerContact = customerContactId
    ? await load(() => jubelio.getCustomerContact(customerContactId))
    : skipped('belum ada customer');

  const salesOrders = await load(() => jubelio.getSalesOrders(1, 5));
  const salesOrderId = salesOrders.data?.data[0]?.salesorder_id;
  const salesOrder = salesOrderId
    ? await load(() => jubelio.getSalesOrder(salesOrderId))
    : skipped('belum ada sales order');
  const salesOrderEscrow = salesOrderId
    ? await load(() => jubelio.getSalesOrderEscrow(salesOrderId))
    : skipped('belum ada sales order');

  const purchaseOrders = await load(() => jubelio.getPurchaseOrders(1, 5));
  const purchaseOrderId = purchaseOrders.data?.data[0]?.purchaseorder_id;
  const purchaseOrder = purchaseOrderId
    ? await load(() => jubelio.getPurchaseOrder(purchaseOrderId))
    : skipped('belum ada purchase order');

  const assets = await load(() => jubelio.getAssets(1, 5));
  const assetId = assets.data?.data[0]?.asset_id;
  const asset = assetId ? await load(() => jubelio.getAsset(assetId)) : skipped('belum ada aset');
  const assetDepreciations = assetId
    ? await load(() => jubelio.getAssetDepreciations(assetId, 1, 5))
    : skipped('belum ada aset');

  const accounts = await load(() => jubelio.getAccounts(1, 5));
  const accountId = accounts.data?.data[0]?.account_id;
  const account = accountId ? await load(() => jubelio.getAccount(accountId)) : skipped('belum ada akun');
  const accountCategories = await load(() => jubelio.getAccountCategories(1, 5));

  const taxes = await load(() => jubelio.getTaxes(1, 5));

  const journals = await load(() => jubelio.getJournals(1, 5));
  const journalId = journals.data?.data[0]?.journal_id;
  const journal = journalId ? await load(() => jubelio.getJournal(journalId)) : skipped('belum ada jurnal');

  // ── Reference ──
  const provinces = await load(() => jubelio.getRegions('province'));
  const provinceId = provinces.data?.[0]?.id;
  const cities = provinceId ? await load(() => jubelio.getRegions('city', provinceId)) : skipped('tidak ada provinsi');

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold">Semua hasil API (GET)</h3>

      <Group title="Merchant Info">
        <ResultBlock
          title="GET /merchant"
          result={merchant}
        />
      </Group>

      <Group title="Categories">
        <ResultBlock
          title="GET /catalog/categories"
          result={categories}
        />
        <ResultBlock
          title={`GET /catalog/categories/${categoryId ?? '{category_id}'}`}
          result={category}
        />
        <ResultBlock
          title={`GET /catalog/categories/${categoryId ?? '{category_id}'}/children`}
          result={categoryChildren}
        />
        <ResultBlock
          title={`GET /catalog/categories/${categoryId ?? '{category_id}'}/ancestors`}
          result={categoryAncestors}
        />
        <ResultBlock
          title="GET /catalog/categories/0/children"
          result={rootCategories}
        />
      </Group>

      <Group title="Category Mappings">
        <ResultBlock
          title="GET /catalog/categories/mappings"
          result={categoryMappings}
        />
        <ResultBlock
          title={`GET /catalog/categories/${mappedCategoryId ?? '{category_id}'}/mappings/${mappedChannelId ?? '{channel_id}'}/attributes`}
          result={attributeMappings}
        />
        <ResultBlock
          title={`GET /catalog/categories/${mappedCategoryId ?? '{category_id}'}/mappings/${mappedChannelId ?? '{channel_id}'}/attribute-options`}
          result={attributeOptions}
        />
        <ResultBlock
          title={`GET /catalog/categories/${mappedCategoryId ?? '{category_id}'}/mappings/${mappedChannelId ?? '{channel_id}'}/variations`}
          result={variationMappings}
        />
        <ResultBlock
          title={`GET /catalog/categories/${mappedCategoryId ?? '{category_id}'}/mappings/${mappedChannelId ?? '{channel_id}'}/variation-options`}
          result={variationOptions}
        />
      </Group>

      <Group title="Channel Categories">
        <ResultBlock
          title="GET /catalog/categories/channel-categories/64/0"
          result={channelRoot}
        />
        <ResultBlock
          title={`GET /catalog/categories/channel-categories/64/${channelCategoryId ?? '{channel_category_id}'}`}
          result={channelCategory}
        />
      </Group>

      <Group title="Products">
        <ResultBlock
          title="GET /catalog/products"
          result={products}
        />
        <ResultBlock
          title={`GET /catalog/products/${productId ?? '{product_id}'}`}
          result={product}
        />
      </Group>

      <Group title="Prices">
        <ResultBlock
          title="GET /catalog/prices/online"
          result={onlinePrices}
        />
        <ResultBlock
          title="GET /catalog/prices/offline"
          result={offlinePrices}
        />
        <ResultBlock
          title="GET /catalog/prices/on-promotion"
          result={promotionPrices}
        />
        <ResultBlock
          title="GET /catalog/prices/sync-failures"
          result={priceSyncFailures}
        />
        <ResultBlock
          title="GET /catalog/prices/adjustments"
          result={priceAdjustments}
        />
        <ResultBlock
          title={`GET /catalog/prices/adjustments/${adjustmentId ?? '{adjustment_id}'}`}
          result={priceAdjustment}
        />
        <ResultBlock
          title={`GET /catalog/prices/adjustments/${adjustmentId ?? '{adjustment_id}'}/items`}
          result={priceAdjustmentItems}
        />
      </Group>

      <Group title="WMS">
        <ResultBlock
          title="GET /locations"
          result={locations}
        />
        <ResultBlock
          title={`GET /locations/${locationId ?? '{id}'}`}
          result={location}
        />
      </Group>

      <Group title="Finance">
        <ResultBlock
          title="GET /finance/invoices"
          result={invoices}
        />
        <ResultBlock
          title={`GET /finance/invoices/${invoiceId ?? '{id}'}`}
          result={invoice}
        />
        <ResultBlock
          title={`GET /finance/invoices/${invoiceId ?? '{id}'}/cogs`}
          result={invoiceCogs}
        />
        <ResultBlock
          title="GET /finance/sales-returns"
          result={salesReturns}
        />
        <ResultBlock
          title={`GET /finance/sales-returns/${salesReturnId ?? '{id}'}`}
          result={salesReturn}
        />
        <ResultBlock
          title="GET /finance/bills"
          result={bills}
        />
        <ResultBlock
          title={`GET /finance/bills/${billId ?? '{id}'}`}
          result={bill}
        />
        <ResultBlock
          title="GET /finance/purchase-returns"
          result={purchaseReturns}
        />
        <ResultBlock
          title={`GET /finance/purchase-returns/${purchaseReturnId ?? '{id}'}`}
          result={purchaseReturn}
        />
        <ResultBlock
          title="GET /finance/customer-payments"
          result={customerPayments}
        />
        <ResultBlock
          title={`GET /finance/customer-payments/${customerPaymentId ?? '{id}'}`}
          result={customerPayment}
        />
        <ResultBlock
          title="GET /finance/supplier-payments"
          result={supplierPayments}
        />
        <ResultBlock
          title={`GET /finance/supplier-payments/${supplierPaymentId ?? '{id}'}`}
          result={supplierPayment}
        />
        <ResultBlock
          title="GET /finance/cash-bank-transactions"
          result={cashBankTransactions}
        />
        <ResultBlock
          title={`GET /finance/cash-bank-transactions/${cashBankTransactionId ?? '{id}'}`}
          result={cashBankTransaction}
        />
        <ResultBlock
          title="GET /finance/supplier-contacts"
          result={supplierContacts}
        />
        <ResultBlock
          title={`GET /finance/supplier-contacts/${supplierContactId ?? '{id}'}`}
          result={supplierContact}
        />
        <ResultBlock
          title="GET /finance/customer-contacts"
          result={customerContacts}
        />
        <ResultBlock
          title={`GET /finance/customer-contacts/${customerContactId ?? '{id}'}`}
          result={customerContact}
        />
        <ResultBlock
          title="GET /finance/sales-orders"
          result={salesOrders}
        />
        <ResultBlock
          title={`GET /finance/sales-orders/${salesOrderId ?? '{id}'}`}
          result={salesOrder}
        />
        <ResultBlock
          title={`GET /finance/sales-orders/${salesOrderId ?? '{id}'}/escrow`}
          result={salesOrderEscrow}
        />
        <ResultBlock
          title="GET /finance/purchase-orders"
          result={purchaseOrders}
        />
        <ResultBlock
          title={`GET /finance/purchase-orders/${purchaseOrderId ?? '{id}'}`}
          result={purchaseOrder}
        />
        <ResultBlock
          title="GET /finance/assets"
          result={assets}
        />
        <ResultBlock
          title={`GET /finance/assets/${assetId ?? '{id}'}`}
          result={asset}
        />
        <ResultBlock
          title={`GET /finance/assets/${assetId ?? '{id}'}/depreciations`}
          result={assetDepreciations}
        />
        <ResultBlock
          title="GET /finance/accounts"
          result={accounts}
        />
        <ResultBlock
          title="GET /finance/accounts/categories"
          result={accountCategories}
        />
        <ResultBlock
          title={`GET /finance/accounts/${accountId ?? '{id}'}`}
          result={account}
        />
        <ResultBlock
          title="GET /finance/taxes"
          result={taxes}
        />
        <ResultBlock
          title="GET /finance/journals"
          result={journals}
        />
        <ResultBlock
          title={`GET /finance/journals/${journalId ?? '{id}'}`}
          result={journal}
        />
      </Group>

      <Group title="Reference">
        <ResultBlock
          title="GET /regions?level=province"
          result={provinces}
        />
        <ResultBlock
          title={`GET /regions?level=city&parent_id=${provinceId ?? '{province_id}'}`}
          result={cities}
        />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-muted-foreground text-xs font-semibold uppercase">{title}</h4>
      {children}
    </div>
  );
}

function ResultBlock({ title, result }: { title: string; result: Result<unknown> }) {
  const ok = result.error === null;
  return (
    <details className="rounded-md border">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2">
        <code className="truncate text-xs">{title}</code>
        <span className={`shrink-0 text-xs ${ok ? 'text-green-700' : 'text-destructive'}`}>{ok ? 'OK' : 'Gagal'}</span>
      </summary>
      <pre className="max-h-96 overflow-auto border-t bg-muted p-3 text-xs">
        {ok ? JSON.stringify(result.data, null, 2) : result.error}
      </pre>
    </details>
  );
}
