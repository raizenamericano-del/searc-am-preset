# AM Pencari Preset

> All-in-one TikTok Preset Finder, Extractor & QR Toolkit — cari, deteksi, simpan, dan bagikan tautan preset **Alight Motion, XML / Project Pack, CapCut, dan VN** dari video TikTok.

![Next.js](https://img.shields.io/badge/Next.js-16.4-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Tests](https://img.shields.io/badge/tests-163%20passed-brightgreen)

---

## 1. Ringkasan Proyek

AM Pencari Preset adalah aplikasi web full-stack (Next.js App Router) yang:

1. Menerima **tautan video TikTok**, **kata kunci**, atau **username kreator**.
2. Mengambil metadata dari provider **TikWM** melalui backend (adapter terisolasi).
3. Memindai **caption, komentar, dan bio** (hanya yang benar-benar dikembalikan provider) untuk menemukan link preset.
4. Mengurai shortlink (bit.ly, s.id, tinyurl.com, t.co) secara aman dengan **perlindungan SSRF**.
5. Menyediakan aksi: buka preset (smart deep-link), salin, bookmark lokal, dan **QR generator / scanner** (100% di browser).

Semua data pengguna (bookmark & riwayat) disimpan **lokal di browser** — tidak ada akun / sinkronisasi.

## 2. Fitur Utama & Status Implementasi

| Fitur | Status |
|---|---|
| Mode **Tautan Video** (URL penuh, `vt.`/`vm.tiktok.com`, `tiktok.com/t/`) | ✅ Implemented & tested (live terhadap TikWM) |
| Detail video: player, statistik, caption, Buka di TikTok, Bagikan | ✅ Implemented & tested |
| Unduh video / video HD / audio (stream, tidak disimpan di server) | ✅ Implemented & tested — ketersediaan tergantung respons provider |
| Ekstraksi dari **caption** | ✅ Implemented & tested |
| Ekstraksi dari **komentar** (`/api/comment/list`, 50 komentar teratas) | ✅ Implemented & tested (live) |
| Ekstraksi dari **bio kreator** (`/api/user/info`) | ⚠️ Implemented — **Blocked by external service** (Cloudflare challenge dari IP server uji) |
| Mode **Kata Kunci** (`/api/feed/search`) | ⚠️ Implemented — **Blocked by external service** dari IP uji; bisa berfungsi dari IP lain atau via `SEARCH_FALLBACK_BASE_URL` |
| Mode **Username Kreator** (`/api/user/posts`) | ⚠️ Implemented — **Blocked by external service** dari IP uji (sama seperti di atas) |
| Komentar tersemat (pinned) | ❌ Unsupported by current provider (TikWM tidak menandai pinned comment) |
| Shortlink resolver anti-SSRF | ✅ Implemented & tested (unit + live bit.ly) |
| Cache LRU + TTL, rate limit | ✅ Implemented & tested |
| Grid/List, filter, sortir, Load More, empty & error state | ✅ Implemented (load more aktif bila provider mengembalikan cursor) |
| Ekstrak dari teks tempelan (caption/komentar manual) | ✅ Implemented & tested |
| Bookmark (cari, filter kategori, hapus, hapus semua + konfirmasi) | ✅ Implemented & tested |
| Riwayat 8 pencarian terakhir | ✅ Implemented & tested |
| QR Scanner (upload / galeri / drag & drop, jsQR) | ✅ Implemented & tested (round-trip QR) |
| QR Generator + unduh PNG 1024px | ✅ Implemented & tested |
| PWA manifest + ikon | ✅ Implemented (instalasi butuh HTTPS — tersedia otomatis di Railway) |
| Link komunitas & donasi | ⚙️ Implemented but requires external configuration (env `NEXT_PUBLIC_*`) |
| Login Google | ⚙️ Tidak diaktifkan (tombol menampilkan status jujur; lihat `lib/auth/google.ts`) |

## 3. Screenshot

> Placeholder — tambahkan screenshot Anda ke `docs/screenshots/` lalu perbarui tautan di bawah.

| Mobile | Desktop |
|---|---|
| `docs/screenshots/mobile-home.png` | `docs/screenshots/desktop-detail.png` |

## 4. Stack Teknologi

- **Next.js 16.4** (App Router, Turbopack) · **React 19** · **TypeScript strict** (`noUncheckedIndexedAccess`)
- **Tailwind CSS 3.4** dengan design tokens (`tailwind.config.ts` + CSS variables di `app/globals.css`)
- **Framer Motion** (menghormati `prefers-reduced-motion`) · **Lucide React**
- **Zod** (validasi API & localStorage) · **lru-cache** (cache TTL & rate limiter)
- **qrcode.react** (generator) · **jsQR** (scanner)
- **Vitest** (163 unit/integration test, tanpa internet)
- ESLint 9 flat config (`eslint-config-next` core-web-vitals + typescript)

## 5. Prasyarat

- Node.js **≥ 20.9** (diuji dengan Node 20.20)
- npm 10+

## 6. Menjalankan Secara Lokal

```bash
npm ci                 # instal sesuai package-lock.json
cp .env.example .env.local   # opsional — semua variabel punya default
npm run dev            # http://localhost:3000
```

Mode produksi lokal:

```bash
npm run build
npm start              # = next start -H 0.0.0.0 -p ${PORT:-3000}
```

> Windows (cmd/PowerShell) tidak mengenal `${PORT:-3000}`; gunakan `npx next start -p 3000` atau jalankan via WSL / Git Bash.

## 7. Environment Variables

Lihat `.env.example` untuk daftar lengkap. Ringkasan:

| Variabel | Scope | Default | Keterangan |
|---|---|---|---|
| `TIKWM_BASE_URL` | server | `https://www.tikwm.com` | Base URL provider (wajib https) |
| `SEARCH_FALLBACK_BASE_URL` | server | – | Mirror/proxy kompatibel TikWM untuk search & creator |
| `PROVIDER_TIMEOUT_MS` | server | `10000` | Timeout request provider (2–20 dtk) |
| `PROVIDER_MIN_INTERVAL_MS` | server | `1100` | Jeda minimum antar request (TikWM gratis ≈ 1 req/dtk) |
| `CACHE_TTL_MINUTES` | server | `12` | TTL cache (1–60 menit) |
| `RATE_LIMIT_PER_MINUTE` | server | `30` | Batas request per klien per menit |
| `TRUSTED_IP_HEADER` | server | – | Header IP tepercaya. Railway: `x-real-ip`. Kosong = tidak memercayai header forwarding |
| `SHORTLINK_TIMEOUT_MS` | server | `4000` | Timeout resolver (dibatasi 1–5 dtk) |
| `EXPOSE_CACHE_HEADER` | server | `true` | Header debug `X-Cache: HIT/MISS` |
| `FRAME_ANCESTORS` | **build** | `'self'` | CSP `frame-ancestors` (dihitung saat `next build`) |
| `NEXT_PUBLIC_SITE_URL` | **build** | – | URL publik untuk Open Graph |
| `NEXT_PUBLIC_WHATSAPP_URL` / `TELEGRAM_URL` / `SAWERIA_URL` / `TRAKTEER_URL` | **build** | – | Link komunitas/donasi (host divalidasi) |

⚠️ Tidak ada secret yang dibutuhkan. **Jangan** pernah menaruh secret di variabel `NEXT_PUBLIC_*` — nilainya dikirim ke browser. Variabel bertanda **build** di-inline saat build, jadi perubahan memerlukan redeploy.

## 8. Endpoint API

Semua endpoint: runtime Node.js, `Cache-Control: no-store`, respons error berbentuk `{ "error": { "code", "message", "hint?" } }` tanpa stack trace.

| Method | Path | Body / Query | Keterangan |
|---|---|---|---|
| `GET` | `/api/health` | – | Status app, versi, keterjangkauan provider, status fitur yang **teramati** (bukan diasumsikan) |
| `POST` | `/api/search` | `{ "mode": "keyword" \| "creator", "query": string, "cursor"?: string }` | Daftar video ter-normalisasi + `cursor`/`hasMore` |
| `POST` | `/api/video` | `{ "input": "<url TikTok atau ID>" }` | Metadata video |
| `POST` | `/api/extract` | `{ "videoId": "<id>" }` **atau** `{ "text": "<maks 5000 char>" }` | Laporan ekstraksi: link + status tiap sumber |
| `GET` | `/api/download` | `?id=<videoId>&type=video\|hd\|audio` | Stream media dari CDN allowlist (klien tidak pernah mengirim URL) |

Kode status: `400` input salah / JSON rusak · `413` body > 8 KB · `415` content-type salah · `429` rate limit (dengan `Retry-After`) · `404` video tidak ditemukan · `501` tidak didukung · `502` error provider · `503` provider memblokir / membatasi · `504` provider timeout.

Contoh:

```bash
curl -X POST http://localhost:3000/api/video \
  -H 'content-type: application/json' \
  -d '{"input":"https://www.tiktok.com/@tiktok/video/7106594312292453675"}'
```

## 9. Integrasi TikWM

Seluruh integrasi berada di **`lib/api/tikwm.ts`** (adapter) dan dipanggil lewat kontrak `VideoProvider` di `lib/api/types.ts`:

| Fungsi kontrak | Endpoint TikWM |
|---|---|
| `resolveVideoUrl()` | lokal (parser + resolver redirect aman untuk `vt.`/`vm.tiktok.com`) |
| `getVideoDetails()` | `POST /api/` (`url`, `hd=1`) |
| `getComments()` | `GET /api/comment/list` |
| `searchVideos()` | `POST /api/feed/search` |
| `getCreatorVideos()` | `POST /api/user/posts` |
| `getCreatorBio()` | `GET /api/user/info` |
| `ping()` | `GET /api/` (respons JSON ringan untuk health) |

Perlindungan di adapter: throttle ±1 req/dtk (antrian terbatas), timeout, batas ukuran respons 3 MB, deteksi halaman HTML/Cloudflare → error `blocked`, parsing toleran (field hilang → `null`, bukan `0`), dan filter host media (hanya `*.tiktokcdn*.com`, `*.ibyteimg.com`, `tikwm.com`).

## 10. Keterbatasan Provider (diverifikasi 15 Okt 2026)

- `POST /api/` (detail) dan `GET /api/comment/list` **berfungsi** dari server uji.
- `/api/feed/search`, `/api/user/posts`, `/api/user/info` mengembalikan **Cloudflare "Just a moment…" (HTTP 403)** dari IP server uji. Aplikasi mendeteksinya dan menampilkan `PROVIDER_BLOCKED` + saran — **tidak** pernah menampilkan hasil palsu. Dari IP Railway hasilnya bisa berbeda; status aktual terlihat di `/api/health → features`.
- TikWM gratis membatasi ±1 request/detik; aplikasi sudah men-throttle, namun beban tinggi akan menghasilkan `503 PROVIDER_RATE_LIMITED`.
- Hanya 50 komentar teratas yang dipindai; pinned comment tidak dapat dikenali.
- URL media TikTok bertanda tangan & cepat kedaluwarsa — muat ulang detail bila unduhan gagal.
- Cache & rate limit berada **di memori**: hilang saat restart dan **tidak dibagi antar-replica** Railway. Untuk banyak replica, ganti dengan Redis (cukup implementasikan ulang `lib/cache/ttl-cache.ts` & `lib/security/rate-limit.ts`).

## 11. Testing

```bash
npm test          # vitest run — 163 test, tidak butuh internet
npm run test:watch
```

Cakupan: regex extractor tiap kategori, URL valid/invalid, resolver redirect (rantai aman, SSRF ke IP privat/metadata cloud/`file:`/`javascript:`, batas redirect, timeout, fallback HEAD→GET, blok DNS), cache (hit, expiry, eviction, error tidak di-cache, dedupe in-flight), rate limiter, schema Zod, adapter TikWM dengan mock (timeout, JSON rusak, HTML challenge, 429/5xx, list kosong), localStorage rusak/versi berbeda/kuota penuh, duplikasi bookmark, riwayat maks 8, QR round-trip & QR tidak terbaca, serta route API (400/413/415/429/404/502/503/504, tanpa kebocoran pesan internal).

## 12. Lint, Type Check & Build

```bash
npm run lint        # eslint .
npm run typecheck   # tsc --noEmit
npm run build       # next build
npm run check       # semuanya berurutan: typecheck → lint → test → build
```

## 13. Push ke GitHub

```bash
git init
git add .
git commit -m "feat: AM Pencari Preset v1.0.0"
git branch -M main
git remote add origin https://github.com/<username>/am-pencari-preset.git
git push -u origin main
```

`.gitignore` sudah mengecualikan `node_modules`, `.next`, `.env*` (kecuali `.env.example`), log, dan artefak build.

## 14. Deploy ke Railway

1. Buka [railway.com](https://railway.com) → **New Project → Deploy from GitHub repo** → pilih repo ini.
2. Railway membaca `railway.json` dan membangun dengan **Dockerfile** (multi-stage, `node:20-alpine`, user non-root, output standalone, port dari `PORT`).
3. Di tab **Variables**, set minimal:
   - `TRUSTED_IP_HEADER=x-real-ip`
   - `NEXT_PUBLIC_SITE_URL=https://<domain-anda>.up.railway.app`
   - (opsional) link komunitas/donasi `NEXT_PUBLIC_*`
   Railway meneruskan variabel layanan sebagai build args, sehingga variabel build-time (`NEXT_PUBLIC_*`, `FRAME_ANCESTORS`) ikut terpakai.
4. **Settings → Networking → Generate Domain**.
5. Health check otomatis ke `/api/health` (lihat `railway.json`).

Alternatif tanpa Docker: hapus `railway.json`/`Dockerfile`, Railway (Railpack) akan menjalankan `npm run build` lalu `npm start` (port `${PORT}`).

## 15. Memeriksa Log Deployment

- Dashboard: **Project → Service → Deployments → View Logs** (tab Build Logs & Deploy Logs).
- CLI:
  ```bash
  npm i -g @railway/cli
  railway login
  railway link
  railway logs
  ```
- Aplikasi hanya mencatat jenis error (mis. `[search] provider error: blocked`), tanpa data sensitif.

## 16. Mengganti Provider API

1. Buat adapter baru, mis. `lib/api/my-provider.ts`, yang mengimplementasikan `VideoProvider` (`lib/api/types.ts`) dan mengembalikan tipe ter-normalisasi dari `types/index.ts`.
2. Lempar `ProviderError` (`lib/api/errors.ts`) dengan `kind` yang sesuai (`blocked`, `timeout`, `not_found`, `unsupported`, …) — route otomatis memetakan ke status HTTP.
3. Daftarkan di `getProvider()` pada `lib/api/index.ts`. Set `capabilities` dengan jujur — fitur bernilai `false` otomatis dilaporkan "tidak didukung".
4. Bila host media berbeda, tambahkan ke `lib/utils/media-hosts.ts` **dan** `MEDIA_HOSTS` di `next.config.ts` (CSP).

Tidak ada route atau komponen UI yang perlu diubah.

## 17. Link Komunitas & Donasi

Set di environment (build-time):

```env
NEXT_PUBLIC_WHATSAPP_URL=https://chat.whatsapp.com/XXXX
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/namagrup
NEXT_PUBLIC_SAWERIA_URL=https://saweria.co/namaanda
NEXT_PUBLIC_TRAKTEER_URL=https://trakteer.id/namaanda
```

Hanya host resmi yang diterima (`chat.whatsapp.com`/`wa.me`, `t.me`, `saweria.co`, `trakteer.id`). Bila kosong atau tidak valid, footer menampilkan placeholder "belum dikonfigurasi" — tidak ada link palsu.

## 18. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Pencarian kata kunci/kreator: "Fitur diblokir provider" | TikWM memblokir endpoint tersebut untuk IP server (Cloudflare). Gunakan mode Tautan Video, deploy di region/IP lain, atau set `SEARCH_FALLBACK_BASE_URL`. |
| `503 PROVIDER_RATE_LIMITED` | Batas ±1 req/dtk TikWM. Tunggu beberapa detik; cache akan mengurangi request berulang. |
| Thumbnail tidak muncul | URL CDN kedaluwarsa atau host tidak ada di allowlist — komponen otomatis menampilkan fallback. |
| Unduhan gagal "tautan sudah kedaluwarsa" | Buka ulang detail video untuk mendapatkan URL media baru. |
| Status header "Service Unavailable" | `/api/health` tidak dapat dihubungi — cek log server. "Degraded" berarti provider tidak terjangkau. |
| Link preset tidak membuka aplikasi | Perilaku deep link berbeda per OS/browser. Di browser internal TikTok/Instagram, gunakan "Buka di browser" / tombol Chrome pada panduan. |
| Iframe/embedding diblokir | Set `FRAME_ANCESTORS` **sebelum build** (mis. `'self' https://domain-induk.com`). |
| Rate limit terasa dibagi semua pengguna | `TRUSTED_IP_HEADER` belum diset; di Railway isi `x-real-ip`. |
| Bookmark hilang | Data tersimpan per browser/perangkat; mode privat atau membersihkan data situs akan menghapusnya. |

## Struktur Proyek

```
app/                 # App Router: page, layout, manifest, API routes
  api/{health,search,video,extract,download}/route.ts
components/
  layout/            # header, hero, footer, mobile nav, status indicator, modals host
  search/            # panel multimode, hasil grid/list, loading stages, ekstrak teks
  video/             # kartu, detail, statistik, unduhan media
  preset/            # kartu preset, panel ekstraksi, panduan deep link
  qr/                # scanner & generator
  bookmark/          # drawer Tersimpan + Riwayat
  ui/                # button, badge, modal/bottom sheet, toast, skeleton, states, safe image
  providers/         # context UI global
hooks/               # useSearch, useExtraction, useHealth, useBookmarks, useHistory, …
lib/
  api/               # kontrak provider, adapter TikWM, http client, throttle, registry
  cache/             # LRU + TTL
  extractor/         # pola link, ekstraksi, resolver shortlink
  security/          # deteksi IP privat, validasi URL, redirect anti-SSRF, rate limit, client IP
  services/          # logika bisnis (search, video, ekstraksi, media store)
  storage/           # localStorage tervalidasi (bookmark, riwayat)
  validation/        # schema Zod
  client/ qr/ utils/ config/ auth/ server/
tests/               # Vitest
public/icons/        # logo & ikon PWA (scripts/generate-icons.mjs)
```

## Keamanan (ringkas)

- Resolver hanya mengirim request ke host shortlink yang di-allowlist, memvalidasi **setiap** hop, memblokir IP privat/loopback/link-local/metadata cloud (termasuk IPv4-mapped IPv6, NAT64, 6to4), menolak kredensial/port non-standar, **DNS pinning** (socket hanya terhubung ke IP yang telah divalidasi), maks 4 redirect, timeout ≤ 5 dtk, tanpa membaca body, tanpa cookie.
- Klien tidak pernah mengirim URL untuk di-fetch server selain shortlink teks yang divalidasi; unduhan memakai ID video.
- Caption dirender sebagai teks (tanpa `dangerouslySetInnerHTML`).
- Security headers: CSP ketat, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, HSTS, `X-Powered-By` dimatikan.
- Body request dibatasi 8 KB, JSON rusak ditangani, error tidak membocorkan detail internal.

## Lisensi & Disclaimer

Tidak berafiliasi dengan TikTok, Alight Motion, CapCut, atau VN. Aplikasi tidak meng-host file preset. Hormati hak cipta kreator dan ketentuan layanan setiap platform.
