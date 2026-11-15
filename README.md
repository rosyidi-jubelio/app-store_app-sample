# Jubelio 3rd Party App Sample

Contoh app pihak ketiga untuk dipublish ke Jubelio App Store.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4
- shadcn (style `base-nova`, Base UI)
- Design system Jubelio Dev Console: token warna di `src/app/globals.css`, font Nunito Sans dan Inter, komponen di `src/components/ui`

## Menjalankan

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

Isi `.env.local`:

| Variabel | Isi |
| -------- | --- |
| `JUBELIO_CLIENT_ID` | `client_id` app dari Dev Console |
| `JUBELIO_CLIENT_SECRET` | `client_secret` app dari Dev Console |
| `JUBELIO_APP_STORE_ORIGIN` | Origin App Store yang meng-embed app (default `https://app-store.jubelio.com`) |
| `JUBELIO_AUTH_URL` | Base URL `open-api-auth` (default staging) |
| `JUBELIO_API_URL` | Base URL Open API gateway (default staging) |
| `SESSION_SECRET` | String acak untuk menandatangani cookie session |
| `DATABASE_URL` | Connection string Postgres. Untuk Supabase pakai connection string Session pooler |

## OAuth install flow

App tidak memulai OAuth sendiri (tidak ada `/oauth/authorize`). Alurnya:

1. Merchant klik Install di Jubelio App Store dan menyetujui scope.
2. Jubelio mengarahkan browser ke redirect URI app dengan `?code=...`. Default-nya `/oauth/callback` di origin `launch_url`, jadi set `launch_url` app di Dev Console ke `https://<host app>/launch`.
3. `src/app/oauth/callback/route.ts` memanggil `JubelioApi.getToken(code)`, yang menukar code ke `POST {JUBELIO_AUTH_URL}/oauth/token` (`application/x-www-form-urlencoded`, `grant_type=authorization_code`). Code hanya hidup 60 detik dan sekali pakai.
4. Token disimpan per `merchant_id` di tabel `installs`, lalu browser diarahkan ke `/?installed=1`. Callback tidak membuat session, karena belum diketahui user mana yang akan membuka app.

## Session token (embedded app)

App berjalan di dalam iframe App Store, jadi cookie login Jubelio tidak sampai ke app. App mengenali siapa yang membukanya lewat session token: JWT HS256 yang ditandatangani dengan `client_secret`, berlaku 2 menit, berisi `iss`, `aud`, `sub` (user), `merchant_id`, `jti`, `iat`, dan `exp`. Session token hanya untuk login ke backend app. Panggilan ke Open API tetap memakai access token hasil install.

1. Saat merchant membuka app, App Store me-render iframe di launch URL dengan `?session_token=...`.
2. `src/app/launch/route.ts` memverifikasi token lewat `JubelioApi.verifySessionToken()`:
   - Signature HS256 dengan `client_secret`.
   - `iss` = `https://jubelio.com` dan `aud` = `client_id`.
   - `exp` dan `iat` dengan toleransi 10 detik.
   - `jti` yang sudah pernah dipakai ditolak.
   - Install untuk `merchant_id` itu harus ada.
3. Kalau valid, app membuat session sendiri (cookie bertanda tangan berisi `merchant_id` dan `sub`, berlaku 1 jam), lalu redirect ke `/` supaya token hilang dari URL. Kalau token datang ke `/`, halaman meneruskannya ke `/launch`.
4. Kalau session hilang saat app masih terbuka (misalnya setelah reload), `src/app/session-recovery.tsx` mengirim `postMessage` `jubelio.session_token.request` ke parent dengan target origin App Store, hanya menerima balasan dari origin itu (timeout 5 detik), lalu menukar token ke `POST /api/session`.

Cookie session memakai `SameSite=None; Secure; Partitioned`, karena cookie `Lax` tidak terkirim dari dalam iframe lintas situs. Header `Content-Security-Policy: frame-ancestors` hanya mengizinkan app di-embed oleh `JUBELIO_APP_STORE_ORIGIN`.

`jti` yang sudah dipakai dicatat di tabel `used_session_tokens`, jadi penolakan token yang dipakai ulang tetap berlaku walaupun app jalan di beberapa instance.

## Database

Schema ada di `db/schema.sql`: Postgres biasa, tanpa fitur khusus Supabase. App terhubung lewat driver `postgres` dengan `DATABASE_URL`, jadi pindah dari Supabase ke Postgres sendiri cukup dengan mengganti `DATABASE_URL` lalu menjalankan `pnpm db:migrate`.

| Tabel | Isi |
| ----- | --- |
| `installs` | Satu baris per merchant: access token, refresh token, waktu kedaluwarsa access token, scopes |
| `used_session_tokens` | `jti` session token yang sudah dipakai, dengan `expires_at`. Baris yang kedaluwarsa dihapus otomatis saat login berikutnya |

Kedua tabel memakai row level security tanpa policy, jadi tidak bisa dibaca lewat API publik Supabase. App mengaksesnya langsung lewat koneksi Postgres.

`pnpm db:migrate` aman dijalankan berulang (`create table if not exists`). App produksi sebaiknya menyimpan token di database dan mengenkripsinya.

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
| `verifySessionToken(token)` | Verifikasi session token di sisi app, tanpa memanggil Jubelio |
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
