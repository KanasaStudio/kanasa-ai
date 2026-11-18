// Model router: Tugas → Karyawan → Router → Adapter provider → Model → Hasil.
// - Urutan kandidat: model khusus karyawan → provider default → urutan fallback Founder → provider terhubung lain.
// - 429/5xx/timeout: coba ulang singkat dengan backoff, lalu pindah provider dan beri cooldown.
// - 401/403/402/404: tidak diulang; provider ditandai dan router pindah ke kandidat berikutnya.
// - Tidak ada percobaan tanpa batas: maksimal MAX_CANDIDATES provider × MAX_TRIES_PER_PROVIDER percobaan.
import {
  callLLM, ChatMsg, classify, ErrorKind, LLMResult, Provider, PROVIDER_DEFS, ProviderError, providerLabel,
} from "./providers.ts";

export interface Candidate { provider: Provider; model: string; apiKey: string; webSearch: boolean; reason: string }
export interface RouteStep { provider: Provider; model: string; ok: boolean; kind?: ErrorKind; error?: string; ms: number }
export interface RouteResult { result: LLMResult; provider: Provider; model: string; steps: RouteStep[] }

export class DeferError extends Error {
  constructor(message: string, public until: Date, public steps: RouteStep[] = []) { super(message); }
}
export class RouteError extends Error {
  constructor(message: string, public steps: RouteStep[], public kind: "no_provider" | "failed") { super(message); }
}

const MAX_CANDIDATES = 4;
const MAX_TRIES_PER_PROVIDER = 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Deps {
  db: any;
  vaultGet: (name: string) => Promise<string | null>;
  keyName: (p: Provider) => string;
}

// Susun kandidat sesuai preferensi karyawan, pengaturan perusahaan, dan kemampuan model.
export async function buildCandidates(deps: Deps, emp: Record<string, any>, settings: Record<string, any>, needWeb: boolean) {
  const { data: keys } = await deps.db.from("ai_provider_keys").select("*").eq("status", "connected").eq("enabled", true);
  const rows: any[] = keys ?? [];
  const now = Date.now();
  const byProvider = new Map<string, any>(rows.map((k) => [k.provider, k]));
  const cooling: { provider: string; until: number; reason: string }[] = [];
  const blockedPaid: string[] = [];

  const order: string[] = [];
  const push = (p?: string | null) => { if (p && !order.includes(p)) order.push(p); };
  push(emp.provider);
  push(settings.default_provider);
  if (settings.fallback_enabled !== false) {
    for (const p of settings.fallback_order ?? []) push(p);
    for (const k of rows) push(k.provider);
  }

  const out: Candidate[] = [];
  for (const p of order) {
    const k = byProvider.get(p);
    if (!k) continue;
    if (settings.block_paid && k.billing === "paid") { blockedPaid.push(p); continue; }
    if (k.cooldown_until && Date.parse(k.cooldown_until) > now) { cooling.push({ provider: p, until: Date.parse(k.cooldown_until), reason: k.cooldown_reason ?? "" }); continue; }
    const model = emp.provider === p && emp.model ? emp.model : k.default_model;
    if (!model) continue;
    // Validasi kemampuan: model harus tercatat di registri provider.
    const info = (k.models as any[] ?? []).find((m) => m.id === model);
    if ((k.models as any[] ?? []).length && !info) continue;
    const apiKey = await deps.vaultGet(deps.keyName(p as Provider));
    if (!apiKey) continue;
    const def = PROVIDER_DEFS[p as Provider];
    out.push({ provider: p as Provider, model, apiKey, webSearch: needWeb && def.webSearch, reason: emp.provider === p ? "model karyawan" : p === settings.default_provider ? "default" : "fallback" });
  }
  // Tugas riset: dahulukan provider yang punya pencarian web, tanpa membuang yang lain.
  if (needWeb) out.sort((a, b) => Number(b.webSearch) - Number(a.webSearch));
  return { candidates: out.slice(0, MAX_CANDIDATES), cooling, blockedPaid, connected: rows.length };
}

function cooldownFor(e: ProviderError, kind: ErrorKind): { ms: number; reason: string } | null {
  switch (kind) {
    case "quota": return { ms: 60 * 60_000, reason: "Kuota provider habis (429)" };
    case "rate": return { ms: Math.min(10 * 60_000, Math.max(60_000, (e.retryAfterSec ?? 60) * 1000)), reason: "Rate limit (429)" };
    case "payment": return { ms: 6 * 3600_000, reason: "Kredit/saldo provider habis (402)" };
    case "server": return { ms: 60_000, reason: "Provider sedang bermasalah (5xx/timeout)" };
    default: return null;
  }
}

export async function route(deps: Deps, emp: Record<string, any>, settings: Record<string, any>, args: {
  system: string; messages: ChatMsg[]; webSearch?: boolean; json?: boolean; maxTokens?: number; temperature?: number; timeoutMs?: number;
  maxCandidates?: number;
}): Promise<RouteResult> {
  const { candidates, cooling, blockedPaid, connected } = await buildCandidates(deps, emp, settings, !!args.webSearch);
  const list = candidates.slice(0, args.maxCandidates ?? MAX_CANDIDATES);
  if (!list.length) {
    if (cooling.length) {
      const soonest = Math.min(...cooling.map((c) => c.until));
      throw new DeferError(`Semua provider sedang dibatasi (${cooling.map((c) => `${providerLabel(c.provider as Provider)}: ${c.reason}`).join("; ")}). Dicoba lagi otomatis.`, new Date(soonest));
    }
    if (blockedPaid.length) throw new RouteError(`Provider berbayar diblokir pengaturan "Hanya provider gratis" (${blockedPaid.join(", ")}).`, [], "no_provider");
    if (!connected) throw new RouteError("Belum ada API provider yang terhubung. Hubungkan di menu API & Integrasi.", [], "no_provider");
    throw new RouteError("Provider terhubung tetapi model default belum dipilih. Pilih model di menu API & Integrasi.", [], "no_provider");
  }

  const steps: RouteStep[] = [];
  let lastErr: ProviderError | Error | null = null;
  for (const c of list) {
    for (let attempt = 0; attempt < MAX_TRIES_PER_PROVIDER; attempt++) {
      const t0 = Date.now();
      try {
        const result = await callLLM({
          provider: c.provider, model: c.model, apiKey: c.apiKey, system: args.system, messages: args.messages,
          temperature: args.temperature, maxTokens: args.maxTokens, webSearch: c.webSearch, json: args.json, timeoutMs: args.timeoutMs,
        });
        steps.push({ provider: c.provider, model: c.model, ok: true, ms: Date.now() - t0 });
        await deps.db.from("ai_provider_keys").update({
          last_success_at: new Date().toISOString(), rate_limit: result.rate ?? null, cooldown_until: null, cooldown_reason: null,
        }).eq("provider", c.provider);
        return { result, provider: c.provider, model: c.model, steps };
      } catch (e) {
        lastErr = e as Error;
        if (!(e instanceof ProviderError)) {
          steps.push({ provider: c.provider, model: c.model, ok: false, kind: "other", error: (e as Error).message.slice(0, 300), ms: Date.now() - t0 });
          break;
        }
        const kind = classify(e);
        steps.push({ provider: c.provider, model: c.model, ok: false, kind, error: e.message.slice(0, 300), ms: Date.now() - t0 });
        // Coba ulang singkat hanya untuk gangguan sementara.
        const transient = kind === "server" || (kind === "rate" && (e.retryAfterSec ?? 3) <= 5);
        if (transient && attempt + 1 < MAX_TRIES_PER_PROVIDER) {
          await sleep(Math.min(5000, (e.retryAfterSec ? e.retryAfterSec * 1000 : 1200 * 2 ** attempt)));
          continue;
        }
        const patch: Record<string, unknown> = { last_error: e.message.slice(0, 500) };
        const cd = cooldownFor(e, kind);
        if (cd) { patch.cooldown_until = new Date(Date.now() + cd.ms).toISOString(); patch.cooldown_reason = cd.reason; }
        if (kind === "auth") patch.status = "error";
        await deps.db.from("ai_provider_keys").update(patch).eq("provider", c.provider);
        if (kind === "quota" && c.provider === "gemini" && /limit: 0/i.test(e.message)) {
          // Teramati langsung: model ini tidak punya kuota gratis untuk key Founder.
          await deps.db.from("ai_free_models").upsert({
            provider: c.provider, model: c.model, label: c.model, free_status: "unavailable", caps: [],
            limits: "Google mengembalikan kuota 0 untuk model ini pada key yang terhubung.", source: "Teramati dari respons 429 Gemini",
            verified_at: new Date().toISOString(),
          });
        }
        break;
      }
    }
  }

  const summary = steps.filter((s) => !s.ok).map((s) => `${providerLabel(s.provider)} (${s.model}): ${s.error}`).join(" | ");
  const allLimited = steps.length > 0 && steps.every((s) => s.ok || s.kind === "rate" || s.kind === "quota" || s.kind === "server");
  if (allLimited) {
    const { data } = await deps.db.from("ai_provider_keys").select("cooldown_until").in("provider", list.map((c) => c.provider));
    const times = (data ?? []).map((r: any) => Date.parse(r.cooldown_until ?? "")).filter((n: number) => Number.isFinite(n));
    const until = new Date(times.length ? Math.min(...times) : Date.now() + 5 * 60_000);
    throw new DeferError(`Semua provider sedang dibatasi. ${summary}`, until, steps);
  }
  throw new RouteError(list.length > 1 ? `Semua provider gagal: ${summary}` : (lastErr?.message ?? summary), steps, "failed");
}
