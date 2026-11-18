// Adapter provider AI. Semua panggilan terjadi di server; API key tidak pernah dikirim ke browser.
// Tiga keluarga API: Gemini (native), Anthropic Messages, OpenAI Responses, dan OpenAI-compatible Chat Completions
// (OpenRouter, NVIDIA NIM, Groq, Cerebras, Hugging Face, Mistral, DeepSeek, Together, Fireworks).

export type Provider =
  | "gemini" | "anthropic" | "openai" | "openrouter" | "nvidia" | "groq" | "cerebras" | "huggingface" | "mistral"
  | "deepseek" | "together" | "fireworks";

type Family = "gemini" | "anthropic" | "openai" | "compat";

export interface ProviderDef {
  id: Provider;
  label: string;
  family: Family;
  base: string; // base URL OpenAI-compatible (family compat)
  modelsUrl?: string;
  webSearch: boolean; // punya alat pencarian web yang dipakai engine
  jsonMode: boolean; // mendukung response_format json_object
  freeTier: string | null; // catatan tier gratis menurut dokumentasi provider (bukan jaminan)
}

export const PROVIDER_DEFS: Record<Provider, ProviderDef> = {
  gemini: { id: "gemini", label: "Google Gemini", family: "gemini", base: "https://generativelanguage.googleapis.com/v1beta", webSearch: true, jsonMode: true, freeTier: "Tier gratis dengan kuota per model; sebagian model bisa berkuota 0." },
  anthropic: { id: "anthropic", label: "Anthropic Claude", family: "anthropic", base: "https://api.anthropic.com/v1", webSearch: true, jsonMode: false, freeTier: null },
  openai: { id: "openai", label: "OpenAI", family: "openai", base: "https://api.openai.com/v1", webSearch: true, jsonMode: true, freeTier: null },
  openrouter: { id: "openrouter", label: "OpenRouter", family: "compat", base: "https://openrouter.ai/api/v1", webSearch: true, jsonMode: true, freeTier: "Model berakhiran :free gratis per token, dibatasi jumlah request per menit dan per hari." },
  nvidia: { id: "nvidia", label: "NVIDIA NIM", family: "compat", base: "https://integrate.api.nvidia.com/v1", webSearch: false, jsonMode: false, freeTier: "Kredit gratis untuk prototyping lewat NVIDIA Developer Program, dibatasi request per menit." },
  groq: { id: "groq", label: "GroqCloud", family: "compat", base: "https://api.groq.com/openai/v1", webSearch: false, jsonMode: true, freeTier: "Free plan dengan batas request & token per model." },
  cerebras: { id: "cerebras", label: "Cerebras", family: "compat", base: "https://api.cerebras.ai/v1", webSearch: false, jsonMode: true, freeTier: "Tier gratis dengan batas request & token harian; konteks bisa lebih kecil dari tier berbayar." },
  huggingface: { id: "huggingface", label: "Hugging Face", family: "compat", base: "https://router.huggingface.co/v1", webSearch: false, jsonMode: false, freeTier: "Kredit bulanan kecil untuk akun gratis; setelah habis perlu kredit berbayar." },
  mistral: { id: "mistral", label: "Mistral AI", family: "compat", base: "https://api.mistral.ai/v1", webSearch: false, jsonMode: true, freeTier: "Plan Experiment gratis untuk evaluasi, rate limit rendah, data bisa dipakai untuk pelatihan." },
  deepseek: { id: "deepseek", label: "DeepSeek", family: "compat", base: "https://api.deepseek.com", webSearch: false, jsonMode: true, freeTier: null },
  together: { id: "together", label: "Together AI", family: "compat", base: "https://api.together.xyz/v1", webSearch: false, jsonMode: true, freeTier: "Hanya model tertentu yang berlabel gratis; sisanya berbayar." },
  fireworks: { id: "fireworks", label: "Fireworks AI", family: "compat", base: "https://api.fireworks.ai/inference/v1", webSearch: false, jsonMode: true, freeTier: null },
};

export const PROVIDERS = Object.keys(PROVIDER_DEFS) as Provider[];
export const providerLabel = (p: Provider) => PROVIDER_DEFS[p]?.label ?? p;
export const isProvider = (p: unknown): p is Provider => typeof p === "string" && p in PROVIDER_DEFS;

export interface ChatMsg { role: "user" | "assistant"; content: string }
export interface LLMRequest {
  provider: Provider;
  model: string;
  apiKey: string;
  system: string;
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  webSearch?: boolean;
  json?: boolean;
  timeoutMs?: number;
}
export interface Source { url: string; title?: string; published?: string | null }
export interface RateInfo { limitRequests?: string; remainingRequests?: string; remainingTokens?: string; resetRequests?: string; retryAfter?: string }
export interface LLMResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  sources: Source[];
  searches: number;
  webSearchUsed: boolean;
  rate?: RateInfo;
}
export type Cap = "text" | "json" | "tools" | "vision" | "reasoning" | "code" | "long_context" | "web_search";
export interface ModelInfo { id: string; label: string; context?: number | null; caps?: Cap[]; free?: boolean | null }

export type ErrorKind = "auth" | "payment" | "rate" | "quota" | "server" | "not_found" | "bad_request" | "other";

export class ProviderError extends Error {
  constructor(public provider: Provider, public status: number, message: string, public retryAfterSec: number | null = null) {
    super(message);
  }
  get kind(): ErrorKind { return classify(this); }
}

// Klasifikasi error agar router tahu harus coba ulang, pindah provider, atau berhenti.
export function classify(e: ProviderError): ErrorKind {
  const m = e.message.toLowerCase();
  if (e.status === 401 || e.status === 403) return "auth";
  if (e.status === 402 || /insufficient (credit|balance|funds)|payment required|add (pre-paid )?credits/.test(m)) return "payment";
  if (e.status === 429) return /per day|daily|limit: 0|quota|resource_exhausted|exceeded your current/.test(m) ? "quota" : "rate";
  if (e.status === 0 || e.status >= 500) return "server";
  if (e.status === 404) return "not_found";
  if (e.status === 400 || e.status === 422) return /model.*(not found|does not exist|not available|unsupported)|no endpoints found/.test(m) ? "not_found" : "bad_request";
  return "other";
}

function rateFrom(h: Headers): RateInfo | undefined {
  const r: RateInfo = {
    limitRequests: h.get("x-ratelimit-limit-requests") ?? h.get("x-ratelimit-limit") ?? undefined,
    remainingRequests: h.get("x-ratelimit-remaining-requests") ?? h.get("x-ratelimit-remaining") ?? undefined,
    remainingTokens: h.get("x-ratelimit-remaining-tokens") ?? undefined,
    resetRequests: h.get("x-ratelimit-reset-requests") ?? h.get("x-ratelimit-reset") ?? undefined,
    retryAfter: h.get("retry-after") ?? undefined,
  };
  return Object.values(r).some(Boolean) ? r : undefined;
}

async function fetchJson(url: string, init: RequestInit, provider: Provider, timeoutMs = 110_000): Promise<{ body: any; rate?: RateInfo }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: ctrl.signal });
  } catch (e) {
    const msg = (e as Error).name === "AbortError" ? `Timeout setelah ${Math.round(timeoutMs / 1000)} detik` : `Koneksi gagal: ${(e as Error).message}`;
    throw new ProviderError(provider, 0, `${providerLabel(provider)}: ${msg}`);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }
  if (!res.ok) {
    const detail = body?.error?.message || body?.error?.type || (typeof body?.error === "string" ? body.error : null) || body?.message || body?.detail || text.slice(0, 300) || res.statusText;
    const ra = Number(res.headers.get("retry-after"));
    throw new ProviderError(provider, res.status, `${providerLabel(provider)} ${res.status}: ${String(detail).slice(0, 900)}`, Number.isFinite(ra) && ra > 0 ? ra : null);
  }
  return { body, rate: rateFrom(res.headers) };
}

export function maskKey(key: string) {
  const k = key.trim();
  if (k.length <= 10) return "••••";
  return `${k.slice(0, 4)}••••••${k.slice(-4)}`;
}

function authHeaders(p: Provider, key: string): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (p === "openrouter") { h["HTTP-Referer"] = "https://kanasastudio.github.io/kanasa-ai/"; h["X-Title"] = "KANASA STUDIO AI Company"; }
  return h;
}

// ---------------------------------------------------------------------------
// Registri kemampuan model: gabungan data dari provider + heuristik nama yang konservatif.
// ---------------------------------------------------------------------------
export function inferCaps(p: Provider, id: string, extra: { context?: number | null; vision?: boolean; tools?: boolean; json?: boolean } = {}): Cap[] {
  const caps = new Set<Cap>(["text"]);
  const n = id.toLowerCase();
  if (extra.json ?? (PROVIDER_DEFS[p].jsonMode || p === "anthropic")) caps.add("json");
  if (extra.tools) caps.add("tools");
  if (extra.vision ?? /(vision|[-_/]vl[-_]|-vl$|pixtral|llava|gemma-3|llama-4|gpt-4o|gpt-4\.1|gpt-5|claude|gemini)/.test(n)) caps.add("vision");
  if (/(r1|reason|thinking|qwq|magistral|gpt-oss|deepseek-v4|^o\d|\/o\d|-pro\b|opus)/.test(n)) caps.add("reasoning");
  if (/(code|coder|codestral|devstral|starcoder|codex)/.test(n)) caps.add("code");
  if ((extra.context ?? 0) >= 128_000) caps.add("long_context");
  if (PROVIDER_DEFS[p].webSearch && p !== "openrouter") caps.add("web_search");
  return [...caps];
}

const NON_CHAT = /(embed|rerank|whisper|tts|transcri|speech|audio|guard|safety|moderation|reward|image-gen|dall-e|flux|stable-diffusion|sdxl|clip|ocr|parakeet|nv-embed|deplot|kosmos|playai|orpheus|realtime|vision-only|aqa)/i;

// ---------------------------------------------------------------------------
// Daftar model langsung dari provider (tidak ada model ID yang di-hardcode)
// ---------------------------------------------------------------------------
export async function listModels(provider: Provider, apiKey: string): Promise<ModelInfo[]> {
  const def = PROVIDER_DEFS[provider];
  if (provider === "gemini") {
    const out: ModelInfo[] = [];
    let pageToken = "";
    for (let i = 0; i < 5; i++) {
      const url = `${def.base}/models?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`;
      const { body } = await fetchJson(url, { headers: { "x-goog-api-key": apiKey } }, provider, 20_000);
      for (const m of body?.models ?? []) {
        const id = String(m.name || "").replace(/^models\//, "");
        const methods: string[] = m.supportedGenerationMethods ?? [];
        if (!id.includes("gemini") || !methods.includes("generateContent")) continue;
        if (/(embedding|image|tts|live|audio|vision-only|aqa|robotics|computer-use|transcribe|banana)/i.test(id)) continue;
        const context = Number(m.inputTokenLimit) || null;
        out.push({ id, label: m.displayName || id, context, caps: inferCaps(provider, id, { context, vision: true, tools: true }) });
      }
      pageToken = body?.nextPageToken || "";
      if (!pageToken) break;
    }
    return out;
  }
  if (provider === "anthropic") {
    const { body } = await fetchJson(`${def.base}/models?limit=100`, {
      headers: { "x-api-key": apiKey, "anthropic-version": ANTHROPIC_VERSION },
    }, provider, 20_000);
    return (body?.data ?? []).map((m: any) => ({ id: m.id, label: m.display_name || m.id, context: null, caps: inferCaps(provider, m.id, { vision: true, tools: true }) }));
  }
  if (provider === "openai") {
    const { body } = await fetchJson(`${def.base}/models`, { headers: authHeaders(provider, apiKey) }, provider, 20_000);
    return (body?.data ?? [])
      .map((m: any) => String(m.id))
      .filter((id: string) => /^(gpt-|o\d|chatgpt-)/.test(id))
      .filter((id: string) => !/(audio|realtime|transcribe|tts|image|embedding|search|moderation|instruct|dall-e|whisper|codex|deep-research)/i.test(id))
      .sort()
      .map((id: string) => ({ id, label: id, context: null, caps: inferCaps(provider, id, { tools: true }) }));
  }

  // OpenAI-compatible
  const { body } = await fetchJson(def.modelsUrl ?? `${def.base}/models`, { headers: authHeaders(provider, apiKey) }, provider, 25_000);
  const rows: any[] = Array.isArray(body) ? body : (body?.data ?? []);
  return normalizeCompatModels(provider, rows);
}

export function normalizeCompatModels(provider: Provider, rows: any[]): ModelInfo[] {
  const seen = new Set<string>();
  const out: ModelInfo[] = [];
  for (const m of rows) {
    const id = String(m?.id ?? "");
    if (!id || seen.has(id)) continue;
    if (NON_CHAT.test(id)) continue;
    let context: number | null = Number(m.context_length ?? m.context_window ?? m.max_context_length ?? m.top_provider?.context_length) || null;
    let vision: boolean | undefined;
    let tools: boolean | undefined;
    let json: boolean | undefined;
    let free: boolean | null = null;
    let label = String(m.name ?? m.display_name ?? id);
    if (provider === "openrouter") {
      const outMods: string[] = m.architecture?.output_modalities ?? ["text"];
      if (!outMods.includes("text")) continue;
      const inMods: string[] = m.architecture?.input_modalities ?? [];
      vision = inMods.includes("image");
      const sp: string[] = m.supported_parameters ?? [];
      tools = sp.includes("tools");
      json = sp.includes("response_format") || sp.includes("structured_outputs");
      free = id.endsWith(":free") || (String(m.pricing?.prompt) === "0" && String(m.pricing?.completion) === "0");
    } else if (provider === "together") {
      if (m.type && m.type !== "chat") continue;
      label = m.display_name ?? id;
      const pin = Number(m.pricing?.input), pout = Number(m.pricing?.output);
      free = /-free$/i.test(id) || (m.pricing && pin === 0 && pout === 0) ? true : null;
    } else if (provider === "mistral") {
      if (m.capabilities && m.capabilities.completion_chat === false) continue;
      if (m.deprecation) continue;
      vision = m.capabilities?.vision ?? undefined;
      tools = m.capabilities?.function_calling ?? undefined;
      (m.aliases ?? []).forEach((a: string) => seen.add(a));
    } else if (provider === "groq") {
      if (m.active === false) continue;
    } else if (provider === "huggingface") {
      const provs: any[] = m.providers ?? [];
      const live = provs.filter((p) => p.status !== "error" && p.status !== "staging");
      if (provs.length && !live.length) continue;
      context = context ?? (Math.max(0, ...live.map((p) => Number(p.context_length) || 0)) || null);
      tools = live.some((p) => p.supports_tools);
      json = live.some((p) => p.supports_structured_output);
    } else if (provider === "fireworks") {
      if (m.supports_chat === false) continue;
      label = id.replace(/^accounts\/fireworks\/models\//, "");
    }
    seen.add(id);
    out.push({ id, label, context, free, caps: inferCaps(provider, id, { context, vision, tools, json }) });
  }
  return out.sort((a, b) => Number(b.free === true) - Number(a.free === true) || a.id.localeCompare(b.id)).slice(0, 400);
}

// Saran model default dari daftar resmi provider: pilih varian cepat/hemat bila ada.
export function suggestDefaultModel(provider: Provider, models: ModelInfo[]): string | null {
  if (!models.length) return null;
  const ids = models.map((m) => m.id);
  const pick = (re: RegExp, exclude?: RegExp) =>
    ids.filter((id) => re.test(id) && !(exclude && exclude.test(id))).sort().reverse()[0];
  switch (provider) {
    case "gemini": return pick(/flash/i, /(lite|preview|exp|thinking|omni)/i) || pick(/flash/i) || ids[0];
    case "anthropic": return pick(/haiku/i) || pick(/sonnet/i) || ids[0];
    case "openai": return pick(/mini/i, /(nano|preview)/i) || pick(/^gpt-/) || ids[0];
    case "openrouter": return models.find((m) => m.free && m.caps?.includes("json") && (m.context ?? 0) >= 32_000)?.id || models.find((m) => m.free)?.id || ids[0];
    case "groq": return pick(/llama.*70b/i) || pick(/qwen/i) || pick(/llama/i) || ids[0];
    case "cerebras": return pick(/llama.*70b|gpt-oss-120b/i) || pick(/llama/i) || ids[0];
    case "nvidia": return pick(/llama-3\.3-70b-instruct/i) || pick(/nemotron/i) || pick(/llama/i) || ids[0];
    case "mistral": return pick(/mistral-small-latest/i) || pick(/small/i) || ids[0];
    case "deepseek": return pick(/flash|chat/i) || ids[0];
    case "together": return models.find((m) => m.free)?.id || pick(/llama.*70b.*turbo/i) || ids[0];
    case "huggingface": return pick(/llama-3\.3-70b|qwen.*instruct/i) || ids[0];
    case "fireworks": return pick(/llama.*70b|qwen/i) || ids[0];
  }
  return ids[0];
}

// Informasi akun yang bisa diambil tanpa biaya (saat ini OpenRouter).
export async function accountInfo(provider: Provider, apiKey: string): Promise<Record<string, unknown> | null> {
  if (provider !== "openrouter") return null;
  try {
    const { body } = await fetchJson("https://openrouter.ai/api/v1/key", { headers: authHeaders(provider, apiKey) }, provider, 15_000);
    const d = body?.data ?? {};
    return {
      label: d.label ?? null, usage: d.usage ?? null, limit: d.limit ?? null, limit_remaining: d.limit_remaining ?? null,
      is_free_tier: d.is_free_tier ?? null, free_model_daily_requests: d.free_model_daily_requests ?? null, checked_at: new Date().toISOString(),
    };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// Panggilan model
// ---------------------------------------------------------------------------
const ANTHROPIC_VERSION = "2023-06-01";

export async function callLLM(req: LLMRequest): Promise<LLMResult> {
  try {
    return await callOnce(req);
  } catch (e) {
    if (!(e instanceof ProviderError) || e.status !== 400) throw e;
    // Beberapa model menolak parameter temperature atau response_format: ulangi sekali tanpa parameter itu.
    if (/temperature/i.test(e.message) && req.temperature !== undefined) return await callOnce({ ...req, temperature: undefined });
    if (/response_format|json_object|json mode|structured/i.test(e.message) && req.json) return await callOnce({ ...req, json: false });
    throw e;
  }
}

async function callOnce(req: LLMRequest): Promise<LLMResult> {
  const timeout = req.timeoutMs ?? 110_000;
  const def = PROVIDER_DEFS[req.provider];

  if (def.family === "gemini") {
    const body: any = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: req.maxTokens ?? 4096 },
    };
    if (req.temperature !== undefined) body.generationConfig.temperature = req.temperature;
    if (req.webSearch) body.tools = [{ google_search: {} }];
    else if (req.json) body.generationConfig.responseMimeType = "application/json";
    const { body: data, rate } = await fetchJson(
      `${def.base}/models/${encodeURIComponent(req.model)}:generateContent`,
      { method: "POST", headers: { "x-goog-api-key": req.apiKey, "Content-Type": "application/json" }, body: JSON.stringify(body) },
      "gemini", timeout,
    );
    const cand = data?.candidates?.[0];
    if (!cand) {
      const block = data?.promptFeedback?.blockReason;
      throw new ProviderError("gemini", 200, block ? `Diblokir oleh filter Gemini: ${block}` : "Gemini tidak mengembalikan jawaban");
    }
    const text = (cand.content?.parts ?? []).filter((p: any) => typeof p.text === "string" && !p.thought).map((p: any) => p.text).join("");
    const gm = cand.groundingMetadata ?? {};
    const sources: Source[] = (gm.groundingChunks ?? []).map((c: any) => c.web).filter((w: any) => w?.uri).map((w: any) => ({ url: w.uri, title: w.title }));
    const u = data?.usageMetadata ?? {};
    if (!text && cand.finishReason && cand.finishReason !== "STOP") throw new ProviderError("gemini", 200, `Gemini berhenti: ${cand.finishReason}`);
    return {
      text, rate, webSearchUsed: !!req.webSearch,
      inputTokens: (u.promptTokenCount ?? 0) + (u.toolUsePromptTokenCount ?? 0),
      outputTokens: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
      sources: dedupeSources(sources), searches: (gm.webSearchQueries ?? []).length,
    };
  }

  if (def.family === "anthropic") {
    const body: any = {
      model: req.model, max_tokens: req.maxTokens ?? 4096, system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (req.temperature !== undefined) body.temperature = Math.min(1, req.temperature);
    if (req.webSearch) body.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }];
    const { body: data, rate } = await fetchJson(`${def.base}/messages`, {
      method: "POST",
      headers: { "x-api-key": req.apiKey, "anthropic-version": ANTHROPIC_VERSION, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, "anthropic", timeout);
    const blocks: any[] = data?.content ?? [];
    const sources: Source[] = [];
    let lastToolIdx = -1;
    blocks.forEach((b, i) => {
      if (b.type === "web_search_tool_result") {
        lastToolIdx = i;
        if (Array.isArray(b.content)) for (const r of b.content) if (r.url) sources.push({ url: r.url, title: r.title, published: r.page_age ?? null });
      }
    });
    const textBlocks = blocks.map((b, i) => ({ b, i })).filter(({ b, i }) => b.type === "text" && i > lastToolIdx);
    const text = (textBlocks.length ? textBlocks : blocks.map((b, i) => ({ b, i })).filter(({ b }) => b.type === "text")).map(({ b }) => b.text).join("");
    const u = data?.usage ?? {};
    return {
      text, rate, webSearchUsed: !!req.webSearch,
      inputTokens: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0),
      outputTokens: u.output_tokens ?? 0, sources: dedupeSources(sources), searches: u.server_tool_use?.web_search_requests ?? 0,
    };
  }

  if (def.family === "openai") {
    const body: any = {
      model: req.model, instructions: req.system,
      input: req.messages.map((m) => ({ role: m.role, content: m.content })), max_output_tokens: req.maxTokens ?? 4096,
    };
    if (req.temperature !== undefined) body.temperature = req.temperature;
    if (req.webSearch) { body.tools = [{ type: "web_search" }]; body.include = ["web_search_call.action.sources"]; }
    const { body: data, rate } = await fetchJson(`${def.base}/responses`, {
      method: "POST", headers: { ...authHeaders("openai", req.apiKey), "Content-Type": "application/json" }, body: JSON.stringify(body),
    }, "openai", timeout);
    let text = "";
    const sources: Source[] = [];
    let searches = 0;
    for (const item of data?.output ?? []) {
      if (item.type === "web_search_call") {
        searches++;
        for (const s of item.action?.sources ?? []) if (s.url) sources.push({ url: s.url, title: s.title });
      }
      if (item.type === "message") {
        for (const c of item.content ?? []) {
          if (c.type === "output_text") {
            text += c.text;
            for (const a of c.annotations ?? []) if (a.type === "url_citation" && a.url) sources.push({ url: a.url, title: a.title });
          }
        }
      }
    }
    if (!text && data?.status === "incomplete") throw new ProviderError("openai", 200, `Respons tidak lengkap: ${data?.incomplete_details?.reason ?? "unknown"}`);
    const u = data?.usage ?? {};
    return { text, rate, webSearchUsed: !!req.webSearch, inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0, sources: dedupeSources(sources), searches };
  }

  // OpenAI-compatible Chat Completions
  const body: any = {
    model: req.model,
    messages: [{ role: "system", content: req.system }, ...req.messages.map((m) => ({ role: m.role, content: m.content }))],
    max_tokens: req.maxTokens ?? 4096,
  };
  if (req.temperature !== undefined) body.temperature = req.temperature;
  const useWeb = !!req.webSearch && req.provider === "openrouter";
  if (useWeb) body.plugins = [{ id: "web", max_results: 5 }];
  if (req.json && def.jsonMode && !useWeb) body.response_format = { type: "json_object" };
  const { body: data, rate } = await fetchJson(`${def.base}/chat/completions`, {
    method: "POST", headers: { ...authHeaders(req.provider, req.apiKey), "Content-Type": "application/json" }, body: JSON.stringify(body),
  }, req.provider, timeout);
  if (data?.error) throw new ProviderError(req.provider, Number(data.error.code) || 500, `${def.label}: ${data.error.message ?? "error"}`);
  const choice = data?.choices?.[0];
  const msg = choice?.message ?? {};
  let text: string = typeof msg.content === "string" ? msg.content : Array.isArray(msg.content) ? msg.content.map((c: any) => c.text ?? "").join("") : "";
  text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  if (!text) {
    const reason = choice?.finish_reason ?? "unknown";
    throw new ProviderError(req.provider, reason === "length" ? 400 : 502, `${def.label}: jawaban kosong (finish_reason ${reason})`);
  }
  const sources: Source[] = [];
  for (const a of msg.annotations ?? []) {
    const c = a.url_citation ?? a;
    if (c?.url) sources.push({ url: c.url, title: c.title });
  }
  const u = data?.usage ?? {};
  return {
    text, rate, webSearchUsed: useWeb,
    inputTokens: u.prompt_tokens ?? u.input_tokens ?? 0, outputTokens: u.completion_tokens ?? u.output_tokens ?? 0,
    sources: dedupeSources(sources), searches: useWeb ? 1 : 0,
  };
}

function dedupeSources(list: Source[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const s of list) {
    const key = s.url.split("#")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url: s.url, title: s.title?.slice(0, 200), published: s.published ?? null });
  }
  return out.slice(0, 25);
}

// Ambil objek JSON dari teks model (toleran terhadap ```json fence dan teks tambahan).
export function extractJson<T = any>(text: string): T | null {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [fenced?.[1], text];
  for (const c of candidates) {
    if (!c) continue;
    const start = c.indexOf("{");
    const end = c.lastIndexOf("}");
    if (start < 0 || end <= start) continue;
    try { return JSON.parse(c.slice(start, end + 1)); } catch { /* lanjut */ }
  }
  return null;
}
