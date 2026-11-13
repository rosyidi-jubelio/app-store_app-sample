# Jubelio 3rd Party App Sample

Contoh app pihak ketiga untuk dipublish ke Jubelio App Store.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4
- shadcn (style `base-nova`, Base UI)
- Design system Jubelio Dev Console: token warna di `src/app/globals.css`, font Nunito Sans dan Inter, komponen di `src/components/ui`

## Menjalankan

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Isi `.env.local`:

| Variabel | Isi |
| -------- | --- |
| `JUBELIO_CLIENT_ID` | `client_id` app dari Dev Console |
| `JUBELIO_CLIENT_SECRET` | `client_secret` app dari Dev Console |
| `JUBELIO_AUTH_URL` | Base URL `open-api-auth` (default staging) |
| `JUBELIO_API_URL` | Base URL Open API gateway (default staging) |
| `SESSION_SECRET` | String acak untuk menandatangani cookie session |

## OAuth install flow

App tidak memulai OAuth sendiri (tidak ada `/oauth/authorize`). Alurnya:

1. Merchant klik Install di Jubelio App Store dan menyetujui scope.
2. Jubelio mengarahkan browser ke redirect URI app dengan `?code=...`. Default-nya `/oauth/callback` di origin `launch_url`, jadi set `launch_url` app di Dev Console ke origin app ini.
3. `src/app/oauth/callback/route.ts` menukar code ke `POST {JUBELIO_AUTH_URL}/oauth/token` (`application/x-www-form-urlencoded`, `grant_type=authorization_code`). Code hanya hidup 60 detik dan sekali pakai.
4. Token disimpan per `merchant_id` di `.data/installs.json`, browser diberi cookie session bertanda tangan, lalu diarahkan ke `/`.
5. Halaman utama memanggil Open API lewat SDK di bawah.

`.data/installs.json` hanya untuk contoh. App produksi sebaiknya menyimpan token di database dan mengenkripsinya.

## SDK Jubelio Open API

SDK kecil yang ditulis manual di `src/lib/jubelio` (server-only). Isinya hanya beberapa contoh endpoint. Untuk endpoint lain, tambah method baru dengan pola yang sama atau panggil `request()` langsung.

```ts
import { collectAll, JubelioApiError, paginate } from '@/lib/jubelio';
import { jubelioFor } from '@/lib/jubelio-app';

const jubelio = jubelioFor(merchantId);

const merchant = await jubelio.merchant.get();

const { data: products } = await jubelio.products.list({
  page: 1,
  page_size: 20,
});

const product = await jubelio.products.get(101);

const categories = await jubelio.categories.list({
  q: 'kaos',
});

const allOrders = await collectAll(
  paginate((page, page_size) =>
    jubelio.orders.list({
      page,
      page_size,
    }),
  ),
);

const regions = await jubelio.request('GET', '/regions');
```

| Method | Endpoint | Scope |
| ------ | -------- | ----- |
| `merchant.get()` | `GET /merchant` | - |
| `products.list(params)` | `GET /catalog/products` | `product.read` |
| `products.get(id)` | `GET /catalog/products/{product_id}` | `product.read` |
| `categories.list(params)` | `GET /catalog/categories` | `category.read` |
| `orders.list(params)` | `GET /orders` | - |
| `request(method, path, { query, body })` | Endpoint apa pun | Sesuai endpoint |

Yang diurus SDK:

- `Authorization: Bearer` dan `x-jbl-merchant-id` dipasang di tiap request.
- Access token (6 jam) di-refresh 5 menit sebelum habis. Kalau API tetap menjawab `401`, SDK refresh paksa lalu mengulang request sekali.
- Response sukses dibuka dari envelope Open API. Response gagal dilempar sebagai `JubelioApiError` (`status`, `code`, `requestId`, `isMissingScope`).
- `paginate()` membaca halaman berikutnya sampai halaman yang kembali lebih sedikit dari `page_size`.

| File | Isi |
| ---- | --- |
| `src/lib/jubelio/client.ts` | `createJubelioClient()` dan method per endpoint |
| `src/lib/jubelio/types.ts` | Tipe response yang dipakai |
| `src/lib/jubelio/oauth.ts` | `createOAuthClient()`: tukar code dan refresh token |
| `src/lib/jubelio/errors.ts` | `JubelioApiError` |
| `src/lib/jubelio/paginate.ts` | `paginate()`, `collectAll()` |
| `src/lib/jubelio-app.ts` | Penghubung SDK dengan config dan penyimpanan token app ini |

## Komponen UI

`src/components/ui` disalin dari Jubelio Dev Console (`src/shared/ui`), jadi tampilan app ini konsisten dengan Dev Console. Folder ini dikecualikan dari ESLint. Tambah komponen shadcn baru dengan:

```bash
pnpm dlx shadcn@latest add <nama-komponen>
```
