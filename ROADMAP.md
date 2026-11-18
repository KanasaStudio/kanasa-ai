# Progres overhaul "AI Employee Company" (18 November 2026)

Status jujur per fase. "Selesai" berarti sudah diimplementasikan dan diuji sejauh yang bisa diuji dari lingkungan pengembangan; catatan uji ada di tiap baris.

| Fase | Status | Catatan |
|---|---|---|
| 1. Audit | Selesai | Kode frontend, edge function, skema, dan alur provider diperiksa sebelum perubahan. |
| 2. Multi-provider AI | Selesai | 12 provider (Tier 1 & 2), adapter native + OpenAI-compatible, cek koneksi lewat daftar model, key di Vault. Diuji dengan mock unit test router; koneksi nyata tiap provider butuh key Founder. |
| 3. Router model | Selesai | Kandidat, retry + backoff, timeout, cooldown per jenis error, tunda tugas saat semua provider dijeda, catatan langkah router, statistik pemakaian per provider. |
| 4. Free AI Models | Selesai | Katalog OpenRouter publik terisi (terverifikasi), provider lain "Belum terverifikasi", kuota 0 teramati = "Tidak tersedia". |
| 5. CEO Alice | Selesai | ID, nama, thread chat, teks UI, prompt server, dan data lama dimigrasikan dari AURELIA-01. |
| 6. Karyawan lebih hidup | Selesai | Kepribadian per karyawan (dipakai di chat & hasil kerja, bisa diedit), animasi & posisi kantor mengikuti status nyata, gelembung bicara dari data nyata. |
| 7. Kantor pixel art interaktif | Selesai | Renderer canvas, sprite 13 pose, objek interaktif (meja, papan tugas, whiteboard, ruang rapat, pantry, rak server, meja CEO), siang/malam WIB, zoom & geser. Kantor 3D lama tetap ada sebagai opsi. |
| 8. Redesain UI/UX | Selesai | Palet crimson (#A83245, #7E2938, #171518, #242126, #302A30, #D88A98, #F4EDF0, #B7ABB1), Pixelify Sans + Nunito, ikon duotone kustom, sidebar yang bisa dilebarkan, transisi halaman, menghormati reduced motion. |
| 9. Audio | Selesai | 19 SFX ElevenLabs (±1.000 kredit), Audio Manager dengan 4 volume, playlist musik dari lagu Founder yang tersimpan di Supabase Storage dan diputar berulang. |
| 10. Landing page | Selesai | Pratinjau kantor interaktif (data contoh berlabel), tim, cara kerja, provider, contoh Pusat Tugas, fitur, keamanan. Dicek di 390px, 820px, 1366px, mode gelap & terang, navigasi keyboard. |
| 11. Keamanan & performa | Selesai | Key hanya di Vault, tidak ada key di frontend/log, RLS Founder untuk tabel & bucket baru, halaman dimuat lazy, kantor 15 fps dan berhenti saat tab tersembunyi. |
| 12. Pengujian | Sebagian | Typecheck + build produksi lulus; tampilan diuji dengan screenshot (data tiruan untuk halaman yang butuh login). Uji end-to-end dengan akun Founder dan key nyata dilakukan setelah deploy. |

## Berikutnya (belum dikerjakan)
- Alur "Lupa kata sandi" di layar login (butuh Redirect URL di pengaturan Auth Supabase).
- Navigasi keyboard di dalam kanvas kantor.
- Push native untuk APK (Firebase).
