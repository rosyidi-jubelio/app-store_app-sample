import Image from 'next/image';
import { Suspense } from 'react';

import { redirect } from 'next/navigation';

import { SessionRecovery } from '@/app/session-recovery';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { config } from '@/lib/config';
import { getInstall } from '@/lib/install-store';
import type { MerchantProfile, ProductSummary } from '@/lib/jubelio';
import { jubelioFor } from '@/lib/jubelio-app';
import { getSession } from '@/lib/session';

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Jubelio tidak mengirim authorization code ke callback.',
  invalid_grant:
    'Authorization code sudah kedaluwarsa (60 detik), sudah dipakai, atau subscription tidak aktif. Buka app lagi dari Jubelio.',
  invalid_client: 'JUBELIO_CLIENT_ID atau JUBELIO_CLIENT_SECRET tidak cocok.',
  invalid_request: 'Request ke token endpoint tidak lengkap.',
  server_error: 'Token endpoint Jubelio tidak bisa dihubungi.',
  missing_session_token: 'Launch URL dibuka tanpa session_token.',
  invalid_session_token: 'Session token tidak valid atau sudah kedaluwarsa (2 menit). Buka app lagi dari Jubelio.',
  session_token_reused: 'Session token ini sudah pernah dipakai. Buka app lagi dari Jubelio.',
  not_installed: 'App belum selesai terpasang untuk merchant ini: authorization code belum pernah ditukar.',
};

export default function Home({ searchParams }: PageProps<'/'>) {
  return (
    <div className="flex flex-1 flex-col bg-[var(--app-surface)]">
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <Image
          src="/logo.svg"
          alt="Sample App"
          width={168}
          height={36}
          priority
        />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Jubelio 3rd Party App Sample</h1>
          <p className="text-muted-foreground text-sm">
            Contoh app pihak ketiga yang terhubung ke Jubelio App Store.
          </p>
        </div>

        <Suspense fallback={<Panel>Memuat status koneksi...</Panel>}>
          <Connection searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-6 text-sm">{children}</section>
  );
}

async function Connection({ searchParams }: Pick<PageProps<'/'>, 'searchParams'>) {
  const params = await searchParams;
  if (typeof params.session_token === 'string') {
    redirect(`/launch?session_token=${encodeURIComponent(params.session_token)}`);
  }
  const errorCode = typeof params.error === 'string' ? params.error : null;
  const justInstalled = params.installed === '1';

  const session = await getSession();
  const install = session ? await getInstall(session.merchantId) : null;

  if (!session || !install) {
    return (
      <Panel>
        {errorCode && (
          <div className="rounded-md border border-[var(--toast-destructive-border)] bg-[var(--toast-destructive-bg)] p-3 text-destructive">
            <p className="font-semibold">Gagal ({errorCode})</p>
            <p>{ERROR_MESSAGES[errorCode] ?? 'Terjadi kesalahan saat menghubungkan ke Jubelio.'}</p>
          </div>
        )}
        {justInstalled && (
          <div className="rounded-md border border-[var(--toast-success-border)] bg-[var(--toast-success-bg)] p-3">
            <p className="font-semibold">Install berhasil</p>
            <p>Token sudah tersimpan. Buka app dari Jubelio App Store untuk mulai memakainya.</p>
          </div>
        )}
        <h2 className="text-lg font-semibold">Belum ada session</h2>
        {errorCode || justInstalled ? (
          <p>Buka app ini dari Jubelio App Store.</p>
        ) : (
          <SessionRecovery appStoreOrigins={config.appStoreOrigins} />
        )}
      </Panel>
    );
  }

  const merchantId = session.merchantId;
  const jubelio = await jubelioFor(merchantId);

  let merchant: MerchantProfile | null = null;
  let merchantError: string | null = null;
  try {
    merchant = await jubelio.getMerchant();
  } catch (err) {
    merchantError = err instanceof Error ? err.message : 'gagal memuat profil merchant';
  }

  let products: ProductSummary[] | null = null;
  let productsError: string | null = null;
  if (install.scopes.includes('product.read')) {
    try {
      const page = await jubelio.getProducts(1, 5);
      products = page.data;
    } catch (err) {
      productsError = err instanceof Error ? err.message : 'gagal memuat produk';
    }
  }

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Terhubung ke Jubelio</h2>
        <Badge
          title={merchant?.subscription?.status ?? 'free'}
          color="#166534"
          showDot
        />
      </div>

      <dl className="grid grid-cols-[160px_1fr] gap-y-2">
        <dt className="text-muted-foreground">Merchant ID</dt>
        <dd className="font-mono">{install.merchantId}</dd>
        <dt className="text-muted-foreground">User (sub)</dt>
        <dd className="font-mono">{session.userId}</dd>
        <dt className="text-muted-foreground">Nama perusahaan</dt>
        <dd>{merchant?.company_name ?? '-'}</dd>
        <dt className="text-muted-foreground">Plan</dt>
        <dd>{merchant?.subscription?.plan?.name ?? '-'}</dd>
        <dt className="text-muted-foreground">Access token berlaku s.d.</dt>
        <dd>{new Date(install.accessTokenExpiresAt).toLocaleString('id-ID')}</dd>
        <dt className="text-muted-foreground">Scopes</dt>
        <dd className="flex flex-wrap gap-1">
          {install.scopes.length === 0
            ? '-'
            : install.scopes.map((scope) => (
                <code
                  key={scope}
                  className="rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  {scope}
                </code>
              ))}
        </dd>
      </dl>

      {merchantError && <p className="text-destructive">GET /merchant gagal: {merchantError}</p>}

      {(products || productsError) && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">Produk terbaru (GET /catalog/products)</h3>
            {productsError && <p className="text-destructive">{productsError}</p>}
            {products?.length === 0 && <p className="text-muted-foreground">Belum ada produk.</p>}
            {products && products.length > 0 && (
              <ul className="divide-y rounded-md border">
                {products.map((product) => (
                  <li
                    key={product.product_id}
                    className="flex justify-between px-3 py-2"
                  >
                    <span>{product.product_name}</span>
                    <span className="text-muted-foreground">
                      {product.sell_price != null ? `Rp${product.sell_price.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Panel>
  );
}
