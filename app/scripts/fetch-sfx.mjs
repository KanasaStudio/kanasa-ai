// Menyalin efek suara (dibuat dengan ElevenLabs, disimpan di Supabase Storage publik "ai-audio")
// ke public/sfx agar ikut di-cache service worker dan dibundel ke APK. Gagal unduh tidak menggagalkan build:
// aplikasi tetap memuat suara langsung dari Supabase saat berjalan.
import { mkdir, readFile, writeFile } from "node:fs/promises";

const BASE = "https://geroipkbzmbkigzwjdok.supabase.co/storage/v1/object/public/ai-audio/sfx";
const src = await readFile(new URL("../src/audio/manager.ts", import.meta.url), "utf8");
const names = [...src.matchAll(/\{ id: "([a-z0-9-]+)", label:/g)].map((m) => m[1]);
const dir = new URL("../public/sfx/", import.meta.url);
await mkdir(dir, { recursive: true });
let ok = 0;
for (const n of names) {
  try {
    const r = await fetch(`${BASE}/${n}.mp3`);
    if (!r.ok) throw new Error(String(r.status));
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 500) throw new Error("berkas terlalu kecil");
    await writeFile(new URL(`${n}.mp3`, dir), buf);
    ok++;
  } catch (e) {
    console.warn(`SFX ${n} gagal diunduh: ${e.message}`);
  }
}
console.log(`SFX: ${ok}/${names.length} berkas disalin ke public/sfx`);
