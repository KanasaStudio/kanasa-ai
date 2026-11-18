// Katalog "Free AI Models": hanya label gratis yang bisa diverifikasi dari data provider yang ditandai "verified".
import { db } from "./db.ts";
import { normalizeCompatModels, Provider, PROVIDER_DEFS, providerLabel } from "./providers.ts";

const UNVERIFIED_FREE_TIER: Provider[] = ["gemini", "groq", "cerebras", "mistral", "nvidia", "huggingface"];

export async function refreshFreeModels() {
  const runStart = new Date();
  const now = runStart.toISOString();
  const rows: any[] = [];
  const refreshed = new Set<string>();
  const notes: string[] = [];

  // 1. OpenRouter: daftar model publik, harga input & output = 0 (atau ID berakhiran :free).
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const models = normalizeCompatModels("openrouter", body?.data ?? []).filter((m) => m.free === true);
    for (const m of models) {
      rows.push({
        provider: "openrouter", model: m.id, label: m.label, context_length: m.context ?? null, caps: m.caps ?? [],
        free_status: "verified", source: "OpenRouter GET /api/v1/models (harga input & output = 0)",
        limits: "Gratis per token. Dibatasi jumlah request per menit dan per hari untuk semua model :free; cek sisa kuota di kartu OpenRouter.",
        verified_at: now,
      });
    }
    refreshed.add("openrouter");
    notes.push(`OpenRouter: ${models.length} model gratis`);
  } catch (e) {
    notes.push(`OpenRouter gagal diperiksa: ${(e as Error).message}`);
  }

  // 2. Provider yang sudah terhubung.
  const { data: keys } = await db.from("ai_provider_keys").select("provider,models,status").eq("status", "connected");
  for (const k of keys ?? []) {
    const p = k.provider as Provider;
    if (p === "openrouter") continue;
    const models: any[] = k.models ?? [];
    if (p === "together") {
      for (const m of models.filter((x) => x.free === true)) {
        rows.push({ provider: p, model: m.id, label: m.label, context_length: m.context ?? null, caps: m.caps ?? [], free_status: "verified",
          source: "Together GET /v1/models (harga 0 atau label Free)", limits: "Endpoint gratis bisa dibatasi atau dicabut sewaktu-waktu oleh Together.", verified_at: now });
      }
      refreshed.add(p);
    } else if (UNVERIFIED_FREE_TIER.includes(p)) {
      for (const m of models.slice(0, 120)) {
        rows.push({ provider: p, model: m.id, label: m.label, context_length: m.context ?? null, caps: m.caps ?? [], free_status: "unverified",
          source: `Daftar model dari API ${providerLabel(p)}; tier gratis menurut dokumentasi penyedia`,
          limits: PROVIDER_DEFS[p].freeTier ?? "Belum diketahui", verified_at: now });
      }
      refreshed.add(p);
    }
  }

  // Jangan menimpa model yang teramati tidak punya kuota gratis (status "unavailable").
  const { data: observed } = await db.from("ai_free_models").select("provider,model").eq("free_status", "unavailable");
  const keep = new Set((observed ?? []).map((r: any) => `${r.provider}|${r.model}`));
  const fresh = rows.filter((r) => !keep.has(`${r.provider}|${r.model}`));
  for (let i = 0; i < fresh.length; i += 200) {
    const { error } = await db.from("ai_free_models").upsert(fresh.slice(i, i + 200));
    if (error) throw error;
  }
  if (refreshed.size) {
    await db.from("ai_free_models").delete().in("provider", [...refreshed]).lt("verified_at", now).neq("free_status", "unavailable");
  }
  // Provider yang sudah diputus: hapus entri tak terverifikasi miliknya.
  const connected = new Set((keys ?? []).map((k: any) => k.provider));
  const stale = UNVERIFIED_FREE_TIER.concat(["together"]).filter((p) => !connected.has(p));
  if (stale.length) await db.from("ai_free_models").delete().in("provider", stale).neq("free_status", "unavailable");
  return { count: fresh.length, notes };
}

export async function freeModelsAgeHours(): Promise<number> {
  const { data } = await db.from("ai_free_models").select("verified_at").eq("provider", "openrouter").order("verified_at", { ascending: false }).limit(1).maybeSingle();
  return data ? (Date.now() - Date.parse(data.verified_at)) / 3600_000 : Infinity;
}
