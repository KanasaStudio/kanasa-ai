// Impor aset SFX hasil ElevenLabs ke Storage publik "ai-audio" agar bisa dimuat aplikasi.
// Hanya menerima URL dari CDN ElevenLabs dan nama file sederhana.
import { db } from "./db.ts";

const ALLOWED_HOSTS = ["elevenlabsusercontent.com"];
const NAME_RE = /^[a-z0-9][a-z0-9_.-]{0,59}$/;
const MAX_BYTES = 5 * 1024 * 1024;

export async function importAudio(items: { name: string; url: string }[]) {
  const results: { name: string; ok: boolean; bytes?: number; error?: string }[] = [];
  for (const it of items.slice(0, 40)) {
    try {
      if (!NAME_RE.test(it.name ?? "")) throw new Error("Nama file tidak valid");
      const u = new URL(it.url);
      if (u.protocol !== "https:" || !ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) throw new Error("Host tidak diizinkan");
      const res = await fetch(u, { signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = new Uint8Array(await res.arrayBuffer());
      if (!buf.length || buf.length > MAX_BYTES) throw new Error(`Ukuran tidak valid (${buf.length} byte)`);
      const { error } = await db.storage.from("ai-audio").upload(`sfx/${it.name}.mp3`, buf, { contentType: "audio/mpeg", upsert: true, cacheControl: "604800" });
      if (error) throw error;
      results.push({ name: it.name, ok: true, bytes: buf.length });
    } catch (e) {
      results.push({ name: it.name, ok: false, error: (e as Error).message });
    }
  }
  return results;
}
