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

SDK ada di `src/lib/jubelio` (server-only). Tipe semua endpoint di-generate dari `openapi/jubelio-open-api.yaml`, salinan kontrak publik Open API.

```ts
import { collectAll, paginate, unwrap, type JubelioSchemas } from '@/lib/jubelio';
import { jubelioFor } from '@/lib/jubelio-app';

const jubelio = jubelioFor(merchantId);

const merchant = await unwrap(jubelio.GET('/merchant'));

const page = await unwrap(
  jubelio.GET('/catalog/products', {
    params: {
      query: {
        page: 1,
        page_size: 20,
      },
    },
  }),
);

const product = await unwrap(
  jubelio.GET('/catalog/products/{product_id}', {
    params: {
      path: {
        product_id: 101,
      },
    },
  }),
);

const allProducts = await collectAll(
  paginate((page, page_size) =>
    unwrap(
      jubelio.GET('/catalog/products', {
        params: {
          query: {
            page,
            page_size,
          },
        },
      }),
    ),
  ),
);
```

Yang diurus SDK:

- `Authorization: Bearer` dan `x-jbl-merchant-id` dipasang di tiap request. Header merchant sengaja dibuang dari tipe, jadi tidak perlu diisi manual.
- Access token (6 jam) di-refresh 5 menit sebelum habis. Kalau API tetap menjawab `401`, SDK refresh paksa lalu mengulang request sekali.
- `unwrap()` mengembalikan envelope `{ data, meta }` saat sukses, dan melempar `JubelioApiError` (`status`, `code`, `requestId`) saat gagal.
- `paginate()` membaca halaman berikutnya sampai halaman yang kembali lebih sedikit dari `page_size`, sesuai aturan paging Open API.

| File | Isi |
| ---- | --- |
| `src/lib/jubelio/client.ts` | `createJubelioClient()`, client `openapi-fetch` dengan middleware auth |
| `src/lib/jubelio/oauth.ts` | `createOAuthClient()`: tukar code dan refresh token |
| `src/lib/jubelio/errors.ts` | `JubelioApiError`, `unwrap()` |
| `src/lib/jubelio/paginate.ts` | `paginate()`, `collectAll()` |
| `src/lib/jubelio/schema.ts` | Tipe hasil generate, jangan diedit |
| `src/lib/jubelio-app.ts` | Penghubung SDK dengan config dan penyimpanan token app ini |

Kalau kontrak Open API berubah, salin ulang `openapi.yaml` ke `openapi/jubelio-open-api.yaml` lalu jalankan:

```bash
pnpm sdk:generate
```

## Komponen UI

`src/components/ui` disalin dari Jubelio Dev Console (`src/shared/ui`), jadi tampilan app ini konsisten dengan Dev Console. Folder ini dikecualikan dari ESLint. Tambah komponen shadcn baru dengan:

```bash
pnpm dlx shadcn@latest add <nama-komponen>
```
