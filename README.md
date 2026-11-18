# KANASA STUDIO — Autonomous AI Company

Aplikasi perusahaan AI milik Kanasa Studio. Isinya kantor virtual **pixel art** dengan AI CEO **Alice** dan 7 karyawan AI di 6 departemen. Tim bekerja **24 jam di server**, jadi tetap jalan walau aplikasi di HP ditutup. Model AI dipilih oleh **router multi-provider** (12 provider) dengan fallback otomatis.

- **Landing page + aplikasi (PWA):** https://kanasastudio.github.io/kanasa-ai/ (pengunjung melihat landing page; Founder masuk lewat tombol *Masuk*)
- **APK Android (debug):** halaman [Releases → android-latest](https://github.com/KanasaStudio/kanasa-ai/releases/tag/android-latest)
- **Login:** pakai akun *owner* website Kanasa Studio (Supabase Auth yang sama).

## Arsitektur

```
HP / browser (React PWA, kantor pixel)  ──HTTPS──▶  Supabase (project KanasaStudio)
                                                 ├─ PostgreSQL: tabel ai_* + RLS khusus Founder
                                                 ├─ Realtime: status karyawan, tugas, notifikasi live
                                                 ├─ Vault: API key 12 provider AI, terenkripsi
                                                 ├─ Storage: ai-music (playlist Founder, privat), ai-audio (SFX, publik)
                                                 ├─ pg_cron (tiap menit) ──▶ Edge Function kanasa-ai
                                                 └─ Edge Function kanasa-ai
                                                      ├─ Router model: kandidat, retry, cooldown, fallback
                                                      ├─ Alice: rencana, delegasi, review, laporan
                                                      ├─ Worker: eksekusi tugas + dependensi + retry
                                                      ├─ Jadwal harian 07:00–18:00 WIB
                                                      ├─ Chat karyawan & rapat grup
                                                      └─ Web Push (VAPID)
```

| Folder | Isi |
|---|---|
| `app/` | Frontend: React 19, TypeScript, Vite, Tailwind 4, Framer Motion, Zustand, PWA, Capacitor Android |
| `app/src/office/pixel/` | Kantor pixel art (canvas): sprite karakter 16×24 dengan pose (jalan, mengetik, berpikir, rapat, tidur, bersorak…), denah, objek interaktif, siang/malam WIB |
| `app/src/office/` | Kantor 3D lama (opsional di Pengaturan), gelembung bicara berbasis data nyata |
| `app/src/audio/` | Audio Manager (bus master/SFX/suasana, preload, autoplay unlock) dan pemutar playlist musik |
| `app/src/pages/LandingPage.tsx` | Landing page publik dengan pratinjau kantor (data contoh, diberi label) |
| `supabase/migrations/` | Skema database, RLS, fungsi RPC, seed departemen/karyawan/jadwal, cron |
| `supabase/functions/kanasa-ai/` | Backend: adapter provider (`providers.ts`), router model (`router.ts`), katalog model gratis (`freemodels.ts`), impor SFX (`audio.ts`), engine, chat, push |

> Directive awal menyebut Node/Express/Prisma. Kebutuhan "online 24 jam tanpa server sendiri" lebih sederhana dan gratis dipenuhi Supabase: PostgreSQL + Edge Functions (TypeScript/Deno) + pg_cron + Realtime (pengganti SSE/WebSocket) + Vault (enkripsi key).

## Cara kerja

1. **Hubungkan API** di menu *API & Model AI*. Server menguji key dengan mengambil daftar model langsung dari provider, menyimpan key di Vault, lalu memilih model default dari daftar resmi itu (tidak ada model ID yang di-hardcode).
2. Setelah API pertama terhubung, Alice langsung memulai **siklus riset pertama**.
3. **pg_cron** mengecek tiap menit. Bila ada pekerjaan, ia memanggil edge function untuk:
   - membersihkan tugas macet (timeout → retry/gagal) dan memblokir tugas yang dependensinya gagal;
   - menjalankan slot jadwal harian yang jatuh tempo (briefing, riset, analisis tren, penugasan, istirahat, keuangan, QA, laporan eksekutif, ringkasan Founder);
   - mengklaim tugas siap (dependensi selesai, karyawan tidak dijeda/istirahat) dan menjalankannya lewat model AI.
4. **Perintah Founder** (bahasa biasa) → Alice mengembalikan rencana JSON yang divalidasi server (karyawan valid, dependensi hanya ke tugas sebelumnya sehingga tidak bisa melingkar, aksi sensitif otomatis wajib persetujuan), lalu disimpan dalam satu transaksi.
5. Hasil penting **direview Alice** dan bisa diminta revisi (maks. sesuai pengaturan).

### Provider & router model
| Tier | Provider | Endpoint |
|---|---|---|
| 1 | Google Gemini, Anthropic Claude, OpenAI, NVIDIA NIM, OpenRouter | API native (Gemini/Claude/OpenAI) atau OpenAI-compatible |
| 2 | GroqCloud, Cerebras, Hugging Face, Mistral, DeepSeek, Together AI, Fireworks AI | OpenAI-compatible |

Alur: **Tugas → Karyawan → Router → Provider → Model**. Urutan kandidat: model khusus karyawan → provider default → urutan cadangan (bisa diatur) → provider terhubung lainnya. Opsi *Hanya provider gratis* melewati provider yang ditandai berbayar.

Klasifikasi error: key salah/akses ditolak (tidak diulang, provider ditandai error), 429 kuota (jeda 60 menit), 429 rate limit (jeda sesuai `retry-after`, maks. 10 menit), pembayaran (jeda 6 jam), 5xx/timeout (coba ulang dengan backoff, lalu jeda 1 menit). Bila semua provider sedang dijeda, tugas **ditunda** (bukan gagal) dan tidak menghabiskan jatah percobaan. Setiap langkah router tercatat di riwayat percobaan tugas. Pemakaian per provider (panggilan, token, estimasi biaya) dihitung dari `ai_usage`.

### Free AI Models
Tabel `ai_free_models` diperbarui otomatis (dan lewat tombol *Perbarui*):
- **Terverifikasi gratis**: harga 0 menurut API publik OpenRouter (`/api/v1/models`, model `:free`) atau label Free dari Together.
- **Belum terverifikasi**: model dari provider yang punya tier gratis (Gemini, Groq, Cerebras, Mistral, NVIDIA, HF) tetapi status gratis per model tidak bisa dipastikan dari API.
- **Tidak tersedia**: teramati ditolak dengan kuota 0 untuk key Founder.
Model berbayar tidak pernah diberi label gratis.

### Audio
- **Efek suara**: 19 SFX dibuat dengan ElevenLabs Sound Effects (`eleven_text_to_sound_v3`), disimpan di Storage publik `ai-audio/sfx/`, dan disalin ke `public/sfx` saat build (`app/scripts/fetch-sfx.mjs`) agar ikut cache offline dan APK.
- **Musik latar**: Founder mengimpor lagu sendiri (galeri/berkas HP atau laptop) di menu *Musik*. Berkas disimpan di bucket privat `ai-music` (maks. 50 MB per lagu), urutan di tabel `ai_music_tracks`, jadi playlist sama di aplikasi dan web. Diputar berulang (ulang playlist / ulang satu lagu / acak), dengan Media Session untuk kontrol di layar kunci.
- Volume master, musik, efek suara, dan suasana kantor diatur per perangkat. Menghormati `prefers-reduced-motion` untuk animasi.

### Anti-fabrikasi
- Riset memakai pencarian web resmi tiap provider (Gemini Google Search grounding, Claude web search tool, OpenAI web_search). Daftar **sumber diambil dari metadata pencarian**, bukan dari teks model. Temuan yang domainnya tidak muncul di hasil pencarian ditandai *belum terverifikasi* dan keyakinannya diturunkan.
- Error API dicatat apa adanya; tugas gagal tidak pernah ditandai selesai.
- Keuangan: AI tidak membuat transaksi aktual. Biaya API = token × tarif yang Founder isi, dicatat sebagai **estimasi**.
- Persetujuan Founder hanya menandai draf "disetujui". Publikasi, pengiriman, pembelian, dan deploy tetap dilakukan manual karena belum ada tool eksternal yang terhubung.

### Batas keamanan
- RLS: semua tabel `ai_*` hanya bisa dibaca/diubah akun owner (`public.is_owner()`).
- API key: Vault (terenkripsi), tidak pernah dikirim ke browser, ditampilkan tersamar, tidak masuk log.
- Batas token & USD per karyawan per hari, batas global harian, maks. tugas paralel, percobaan, revisi, timeout, tugas per perintah, dan **Emergency Stop**.
- Log aktivitas *immutable* (trigger menolak UPDATE/DELETE).

## Notifikasi push
- **PWA (disarankan):** buka aplikasi di Chrome Android → *Instal aplikasi* → menu *Notifikasi* → *Aktifkan push*. Notifikasi memakai Web Push (VAPID) dan tetap masuk walau aplikasi ditutup.
- Prioritas KRITIS / TINGGI / NORMAL bisa diatur di Pengaturan. Masalah yang sama tidak dikirim berulang: jumlah kejadian dihitung, dan setelah 3× prioritasnya naik.
- **APK Capacitor:** WebView tidak mendukung Web Push. Di APK, notifikasi muncul secara realtime saat aplikasi dibuka. Push native butuh Firebase (lihat bagian berikut).

## Android (APK)
Cara instal yang disarankan adalah **dari Chrome (PWA)**. Sejak 30 September 2026, HP Android bersertifikat di Indonesia memblokir APK dari developer yang belum terverifikasi Google. APK ini belum terdaftar, jadi pasang lewat `adb install`, alur sideloading lanjutan Android, atau daftarkan diri di Android Developer Console lalu tanda tangani APK dengan keystore rilis yang didaftarkan.

Workflow `.github/workflows/android.yml` membangun APK debug setiap ada perubahan di `app/` dan mengunggahnya ke Release `android-latest`. APK ditandatangani `app/android/app/debug.keystore` yang tetap, sehingga versi baru bisa menimpa versi lama. Workflow `.github/workflows/pages.yml` membangun PWA dan menerbitkannya ke GitHub Pages.

Build manual:
```bash
cd app
npm ci
npm run build:android
npx cap sync android
cd android && ./gradlew assembleDebug        # APK: app/build/outputs/apk/debug/app-debug.apk
```
Untuk rilis bertanda tangan (Play Store): buat keystore (`keytool -genkey -v -keystore kanasa.jks -alias kanasa -keyalg RSA -keysize 2048 -validity 10000`), atur `signingConfigs` di `android/app/build.gradle`, lalu `./gradlew bundleRelease`.

Push native (opsional, belum aktif): buat project Firebase → tambahkan app Android `com.kanasastudio.ai` → simpan `google-services.json` di `app/android/app/` → pasang `@capacitor/push-notifications` → kirim token ke tabel baru → tambahkan pengirim FCM v1 di edge function memakai service account.

## Deploy ulang backend
```bash
supabase link --project-ref geroipkbzmbkigzwjdok
supabase db push                                   # migrasi di supabase/migrations
supabase functions deploy kanasa-ai --no-verify-jwt   # fungsi melakukan verifikasi sendiri (JWT Founder / kunci engine)
```
Secret yang dipakai (sudah tersimpan di Vault, bukan di repo): `kanasa_ai_engine_key`, `kanasa_ai_vapid_public`, `kanasa_ai_vapid_private`, `kanasa_ai_key_<provider>`.

## Pengembangan lokal
```bash
cd app && npm install && npm run dev
```

## Keterbatasan saat ini (jujur)
- Departemen Software menghasilkan **draf** kode dan rencana. Belum ada sandbox untuk menjalankan kode.
- Pembuatan gambar (Creative) belum dihubungkan; hasilnya berupa konsep & spesifikasi tertulis.
- Memori memakai pencarian teks penuh PostgreSQL, belum embedding/semantic search.
- Edge function punya batas waktu eksekusi; satu tugas dibatasi ~110 detik per panggilan model, lalu dicoba ulang bila timeout.
- Biaya API hanya akurat bila tarif model diisi di *API & Model AI*.
- Batas tier gratis tiap provider berubah sewaktu-waktu; aplikasi hanya menampilkan apa yang bisa diverifikasi dari API atau yang teramati langsung.
- Kantor pixel belum bisa dijelajahi dengan keyboard; semua aksinya tersedia juga lewat menu Tim, Tugas, dan Alice.
