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
3. `src/app/oauth/callback/route.ts` memanggil `JubelioApi.getToken(code)`, yang menukar code ke `POST {JUBELIO_AUTH_URL}/oauth/token` (`application/x-www-form-urlencoded`, `grant_type=authorization_code`). Code hanya hidup 60 detik dan sekali pakai.
4. Token disimpan per `merchant_id` di `.data/installs.json`, browser diberi cookie session bertanda tangan, lalu diarahkan ke `/`.
5. Halaman utama memanggil Open API lewat SDK di bawah.

`.data/installs.json` hanya untuk contoh. App produksi sebaiknya menyimpan token di database dan mengenkripsinya.

## SDK Jubelio Open API

SDK berupa satu class `JubelioApi` di `src/lib/jubelio/api.ts` (server-only), dengan pola yang sama seperti `lib/<channel>/api.js` di channel service: constructor menerima kredensial dan token, `callAPI()` jadi pusat request, dan tiap endpoint punya method sendiri. Isinya hanya beberapa contoh endpoint.

```ts
import { JubelioApi } from '@/lib/jubelio';

const api = new JubelioApi({
  clientId,
  clientSecret,
  merchantId,
  accessToken,
  refreshToken,
});

api.onTokenRefreshed = async (tokens) => {
  await saveTokens(tokens);
};

const merchant = await api.getMerchant();
const { data: products } = await api.getProducts(1, 20);
const product = await api.getProduct(101);
const { data: categories } = await api.getCategories(1, 20, 'kaos');
const { data: orders } = await api.getOrders(1, 20);
```

| Method | Endpoint |
| ------ | -------- |
| `getToken(code)` | `POST /oauth/token`, `grant_type=authorization_code` |
| `refreshToken()` | `POST /oauth/token`, `grant_type=refresh_token` |
| `getMerchant()` | `GET /merchant` |
| `getProducts(page, pageSize, q)` | `GET /catalog/products` |
| `getProduct(productId)` | `GET /catalog/products/{product_id}` |
| `getCategories(page, pageSize, q)` | `GET /catalog/categories` |
| `getOrders(page, pageSize, q)` | `GET /orders` |
| `callAPI(method, path, query, body)` | Endpoint lain |

Perilaku `callAPI()`:

- Memasang `Authorization: Bearer` dan `x-jbl-merchant-id` di tiap request.
- Kalau API menjawab `401`, memanggil `refreshToken()` sekali lalu mengulang request dengan token baru.
- Membuka envelope Open API. Response gagal dilempar sebagai `JubelioApiError` (`status`, `code`, `requestId`, `isMissingScope`).

Hook yang bisa ditimpa, sama seperti `onTokenRefreshed` di channel service:

- `onTokenRefreshed(tokens)`: dipanggil setelah refresh berhasil. Simpan token baru di sini, karena refresh token ikut berganti.
- `onRefreshTokenExpired()`: dipanggil kalau refresh token ditolak (`invalid_grant`), misalnya app sudah di-uninstall.

`src/lib/jubelio-app.ts` berisi `newJubelioApi()` untuk tukar code dan `jubelioFor(merchantId)` yang membuat instance dari token tersimpan.

## Komponen UI

`src/components/ui` disalin dari Jubelio Dev Console (`src/shared/ui`), jadi tampilan app ini konsisten dengan Dev Console. Folder ini dikecualikan dari ESLint. Tambah komponen shadcn baru dengan:

```bash
pnpm dlx shadcn@latest add <nama-komponen>
```
