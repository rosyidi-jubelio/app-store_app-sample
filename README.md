# Jubelio App Sample

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
5. Halaman utama memanggil `GET /merchant` dengan `Authorization: Bearer` dan `x-jbl-merchant-id`. Access token (6 jam) di-refresh otomatis lewat `grant_type=refresh_token` kalau hampir habis.

`.data/installs.json` hanya untuk contoh. App produksi sebaiknya menyimpan token di database dan mengenkripsinya.

## Komponen UI

`src/components/ui` disalin dari Jubelio Dev Console (`src/shared/ui`), jadi tampilan app ini konsisten dengan Dev Console. Folder ini dikecualikan dari ESLint. Tambah komponen shadcn baru dengan:

```bash
pnpm dlx shadcn@latest add <nama-komponen>
```
