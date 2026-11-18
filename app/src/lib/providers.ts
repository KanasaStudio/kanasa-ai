import type { Cap, Provider } from "./types";

// Metadata tampilan provider. Catatan tier gratis diringkas dari dokumentasi masing-masing provider
// (diperiksa November 2026) dan bisa berubah; status per model tampil di bagian Free AI Models.
export interface ProviderMeta {
  id: Provider; label: string; tier: 1 | 2; color: string; mono: string; keyUrl: string; docsUrl: string;
  hint: string; free: string | null; webSearch: boolean; keyPrefix?: string;
}

export const PROVIDER_META: Record<Provider, ProviderMeta> = {
  gemini: { id: "gemini", label: "Google Gemini", tier: 1, color: "#4f7fe0", mono: "G", keyUrl: "https://aistudio.google.com/apikey", docsUrl: "https://ai.google.dev/gemini-api/docs/rate-limits", hint: "Riset memakai Grounding with Google Search.", free: "Tier gratis dengan kuota per model; sebagian model bisa berkuota 0.", webSearch: true, keyPrefix: "AIza" },
  anthropic: { id: "anthropic", label: "Anthropic Claude", tier: 1, color: "#c96f4f", mono: "A", keyUrl: "https://console.anthropic.com/settings/keys", docsUrl: "https://docs.claude.com/en/api/overview", hint: "Riset memakai tool web search Claude.", free: null, webSearch: true, keyPrefix: "sk-ant-" },
  openai: { id: "openai", label: "OpenAI", tier: 1, color: "#2f9f84", mono: "O", keyUrl: "https://platform.openai.com/api-keys", docsUrl: "https://platform.openai.com/docs", hint: "Riset memakai tool web_search Responses API.", free: null, webSearch: true, keyPrefix: "sk-" },
  nvidia: { id: "nvidia", label: "NVIDIA NIM", tier: 1, color: "#6f9e2e", mono: "N", keyUrl: "https://build.nvidia.com/settings/api-keys", docsUrl: "https://docs.api.nvidia.com/", hint: "Endpoint OpenAI-compatible integrate.api.nvidia.com, katalog model open.", free: "Kredit gratis untuk prototyping (NVIDIA Developer Program), dibatasi request per menit.", webSearch: false, keyPrefix: "nvapi-" },
  openrouter: { id: "openrouter", label: "OpenRouter", tier: 1, color: "#7a5cd6", mono: "R", keyUrl: "https://openrouter.ai/keys", docsUrl: "https://openrouter.ai/docs/api/reference/limits", hint: "Satu key untuk ratusan model; model berakhiran :free gratis per token.", free: "Model :free gratis per token, dibatasi request per menit & per hari (lebih tinggi jika pernah membeli kredit).", webSearch: true, keyPrefix: "sk-or-" },
  groq: { id: "groq", label: "GroqCloud", tier: 2, color: "#e2583e", mono: "Gq", keyUrl: "https://console.groq.com/keys", docsUrl: "https://console.groq.com/docs/rate-limits", hint: "Inferensi sangat cepat untuk model open (Llama, Qwen, GPT-OSS).", free: "Free plan dengan batas request & token per model.", webSearch: false, keyPrefix: "gsk_" },
  cerebras: { id: "cerebras", label: "Cerebras", tier: 2, color: "#d46a2e", mono: "Cb", keyUrl: "https://cloud.cerebras.ai/", docsUrl: "https://inference-docs.cerebras.ai/", hint: "Inferensi wafer-scale, OpenAI-compatible.", free: "Tier gratis dengan batas harian; konteks bisa lebih kecil dari tier berbayar.", webSearch: false, keyPrefix: "csk-" },
  huggingface: { id: "huggingface", label: "Hugging Face", tier: 2, color: "#d9a634", mono: "HF", keyUrl: "https://huggingface.co/settings/tokens", docsUrl: "https://huggingface.co/docs/inference-providers", hint: "Router ke banyak inference provider dengan satu token.", free: "Kredit bulanan kecil untuk akun gratis.", webSearch: false, keyPrefix: "hf_" },
  mistral: { id: "mistral", label: "Mistral AI", tier: 2, color: "#e07b39", mono: "M", keyUrl: "https://console.mistral.ai/api-keys", docsUrl: "https://docs.mistral.ai/", hint: "Model Mistral, Codestral, Pixtral.", free: "Plan Experiment gratis untuk evaluasi; rate limit rendah, data bisa dipakai pelatihan.", webSearch: false },
  deepseek: { id: "deepseek", label: "DeepSeek", tier: 2, color: "#4d6bd8", mono: "DS", keyUrl: "https://platform.deepseek.com/api_keys", docsUrl: "https://api-docs.deepseek.com/", hint: "Model DeepSeek langsung dari platform resmi (berbayar per token).", free: null, webSearch: false, keyPrefix: "sk-" },
  together: { id: "together", label: "Together AI", tier: 2, color: "#3d7bd6", mono: "T", keyUrl: "https://api.together.ai/settings/api-keys", docsUrl: "https://docs.together.ai/", hint: "Ratusan model open, sebagian berlabel Free.", free: "Hanya model tertentu berlabel Free; lainnya berbayar.", webSearch: false },
  fireworks: { id: "fireworks", label: "Fireworks AI", tier: 2, color: "#b8452f", mono: "F", keyUrl: "https://app.fireworks.ai/settings/users/api-keys", docsUrl: "https://docs.fireworks.ai/", hint: "Serving cepat untuk model open (berbayar per token).", free: null, webSearch: false, keyPrefix: "fw_" },
};

export const PROVIDER_ORDER: Provider[] = ["gemini", "anthropic", "openai", "nvidia", "openrouter", "groq", "cerebras", "huggingface", "mistral", "deepseek", "together", "fireworks"];
export const providerLabel = (p: Provider | null | undefined) => (p ? PROVIDER_META[p]?.label ?? p : "-");

export const CAP_LABEL: Record<Cap, string> = {
  text: "Teks", json: "JSON", tools: "Tools", vision: "Visi", reasoning: "Penalaran", code: "Kode", long_context: "Konteks panjang", web_search: "Web",
};

export const ctxLabel = (n?: number | null) => (!n ? null : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M` : `${Math.round(n / 1000)}K`);
