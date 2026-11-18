import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckCircle2, ExternalLink, Lock, RefreshCw, RotateCcw, Search, Timer, Trash2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { sfx } from "../audio/manager";
import { IconKey, IconPlug, IconSpark } from "../components/icons";
import { PageShell } from "../components/Layout";
import { Badge, Button, Card, Empty, Field, inputCls, PixLoader, SectionTitle, Segmented, Sheet, Toggle } from "../components/ui";
import { callAI, rpc } from "../lib/api";
import { compact, dateTime, timeAgo, usd } from "../lib/format";
import { CAP_LABEL, ctxLabel, PROVIDER_META, PROVIDER_ORDER, providerLabel } from "../lib/providers";
import { supabase } from "../lib/supabase";
import type { FreeModel, ModelInfo, Provider, ProviderKey, ProviderUsage } from "../lib/types";
import { PROVIDER_COLS, useStore } from "../store/useStore";
import { ProviderBadge } from "../components/ProviderBadge";

const refreshProviders = async () => {
  const { data } = await supabase.from("ai_provider_keys").select(PROVIDER_COLS);
  if (data) useStore.setState({ providers: data as ProviderKey[] });
};

const cooling = (k?: ProviderKey) => !!k?.cooldown_until && Date.parse(k.cooldown_until) > Date.now();

export default function ApiPage() {
  const providers = useStore((s) => s.providers);
  const [connect, setConnect] = useState<Provider | null>(null);
  const [usage, setUsage] = useState<ProviderUsage[]>([]);
  useEffect(() => { rpc<ProviderUsage[]>("ai_provider_usage").then(setUsage).catch(() => undefined); }, [providers]);
  const connectedCount = providers.filter((p) => p.status === "connected").length;

  return (
    <PageShell>
      <Card className="flex items-start gap-3 p-4 text-sm">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-ok" />
        <span className="text-muted">
          API key dikirim lewat HTTPS ke server, diuji, lalu disimpan terenkripsi di <b className="text-text">Supabase Vault</b>. Key tidak pernah disimpan di browser, tidak tampil utuh, dan tidak ditulis ke log.
          Engine di server bekerja <b className="text-text">24 jam</b> walau aplikasi ditutup.
        </span>
      </Card>

      <RouterCard />

      {[1, 2].map((tier) => (
        <section key={tier}>
          <SectionTitle>{tier === 1 ? "Provider utama" : "Provider tambahan"} <span className="ml-1 text-xs font-bold text-muted">· {tier === 1 ? "Tier 1" : "Tier 2"}</span></SectionTitle>
          <div className="grid items-start gap-2.5 lg:grid-cols-2">
            {PROVIDER_ORDER.filter((p) => PROVIDER_META[p].tier === tier).map((p, i) => (
              <motion.div key={p} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 26 }}>
                <ProviderCard p={p} k={providers.find((x) => x.provider === p)} usage={usage.find((u) => u.provider === p)} onConnect={() => setConnect(p)} />
              </motion.div>
            ))}
          </div>
        </section>
      ))}

      <FreeModels connectedCount={connectedCount} onConnect={setConnect} />
      <PricesCard />
      <ConnectSheet provider={connect} onClose={() => setConnect(null)} />
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
function RouterCard() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const providers = useStore((s) => s.providers);
  if (!settings) return null;
  const connected = providers.filter((p) => p.status === "connected" && p.enabled).map((p) => p.provider);
  const order: Provider[] = [...(settings.fallback_order ?? []).filter((p) => connected.includes(p)), ...connected.filter((p) => !(settings.fallback_order ?? []).includes(p))];
  const move = (i: number, d: -1 | 1) => {
    const next = [...order];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    sfx("ui-tab");
    setSettings({ fallback_order: next });
  };
  return (
    <>
      <SectionTitle>Model router</SectionTitle>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-text"><IconSpark size={22} /></span>
          <p className="text-sm text-muted">
            Alur kerja: <b className="text-text">Tugas → Karyawan → Router → Provider → Model</b>. Router memakai model khusus karyawan bila diatur, lalu provider default, lalu urutan cadangan di bawah.
            Saat provider membalas 429, 5xx, atau timeout, router mencoba ulang sebentar lalu pindah ke provider berikutnya dan memberi provider itu jeda (cooldown). Key salah tidak diulang.
          </p>
        </div>
        <div className="mt-3 grid gap-x-6 md:grid-cols-2">
          <Toggle label="Fallback otomatis" hint="Pindah ke provider lain bila provider utama gagal sementara." checked={settings.fallback_enabled} onChange={(v) => setSettings({ fallback_enabled: v })} />
          <Toggle label="Hanya provider gratis" hint="Provider yang kamu tandai “Berbayar” tidak akan dipakai." checked={settings.block_paid} onChange={(v) => setSettings({ block_paid: v })} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Provider default">
            <select className={inputCls} value={settings.default_provider ?? ""} onChange={(e) => setSettings({ default_provider: (e.target.value || null) as Provider | null })}>
              <option value="">Belum dipilih</option>
              {connected.map((p) => <option key={p} value={p}>{providerLabel(p)}</option>)}
            </select>
          </Field>
          <div>
            <div className="mb-1 text-xs font-extrabold uppercase tracking-wide text-muted">Urutan cadangan</div>
            {order.length ? (
              <ol className="space-y-1.5">
                {order.map((p, i) => (
                  <motion.li layout key={p} className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-2.5 py-1.5 text-sm">
                    <span className="font-pixel w-4 text-center text-muted">{i + 1}</span>
                    <ProviderBadge p={p} size={24} />
                    <span className="flex-1 truncate font-bold">{providerLabel(p)}</span>
                    {p === settings.default_provider && <Badge tone="accent">Default</Badge>}
                    <button aria-label="Naikkan" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button aria-label="Turunkan" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-surface disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  </motion.li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted">Hubungkan minimal dua provider agar ada cadangan.</p>}
          </div>
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
function ProviderCard({ p, k, usage, onConnect }: { p: Provider; k?: ProviderKey; usage?: ProviderUsage; onConnect: () => void }) {
  const meta = PROVIDER_META[p];
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const toast = useStore((s) => s.toast);
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try { await fn(); if (ok) toast(ok, "ok"); await refreshProviders(); } catch (e) { toast((e as Error).message, "bad"); } finally { setBusy(null); }
  };
  const model: ModelInfo | undefined = k?.models.find((m) => m.id === k.default_model);
  const cool = cooling(k);
  const free = k?.account_info?.free_model_daily_requests;
  const remaining = k?.rate_limit?.remainingRequests;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className={`rounded-[16px] ${k?.status === "connected" && !cool && k.enabled ? "plug-pulse" : ""}`}><ProviderBadge p={p} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-black">{meta.label}</span>
            {!k ? <Badge>Belum terhubung</Badge>
              : cool ? <Badge tone="warn"><Timer className="h-3 w-3" /> Jeda s.d. {dateTime(k.cooldown_until).replace(" WIB", "")}</Badge>
              : k.status === "connected" ? <Badge tone="ok"><CheckCircle2 className="h-3 w-3" /> {k.enabled ? "Terhubung" : "Nonaktif"}</Badge>
              : <Badge tone="bad"><XCircle className="h-3 w-3" /> Error</Badge>}
            {k && <Badge tone={k.billing === "free" ? "info" : k.billing === "paid" ? "warn" : "muted"}>{k.billing === "free" ? "Gratis" : k.billing === "paid" ? "Berbayar" : "Biaya belum ditandai"}</Badge>}
            {settings?.default_provider === p && <Badge tone="accent">Default</Badge>}
            {meta.webSearch && <Badge tone="muted"><Search className="h-3 w-3" /> Web</Badge>}
          </div>
          <div className="mt-0.5 text-xs text-muted">{k ? `${k.masked} · ${k.models.length} model · dites ${timeAgo(k.last_tested_at)}` : meta.hint}</div>
          {!k && meta.free && <div className="mt-1 text-xs text-info">Tier gratis: {meta.free}</div>}
          {k?.last_error && <div className="mt-1 line-clamp-3 text-xs font-bold text-bad">{k.last_error}</div>}
          {cool && k?.cooldown_reason && <div className="mt-1 text-xs font-bold text-warn">{k.cooldown_reason}. Router memakai provider lain sampai jeda selesai.</div>}
        </div>
      </div>

      {k ? (
        <div className="mt-3 space-y-3">
          <Field label={`Model default (${k.models.length} tersedia)`}>
            <select className={inputCls} value={k.default_model ?? ""} onChange={(e) => run("model", () => callAI("provider_set_model", { provider: p, model: e.target.value }), "Model default diperbarui")}>
              {!k.default_model && <option value="">Pilih model…</option>}
              {k.models.map((m) => <option key={m.id} value={m.id}>{m.label}{m.label !== m.id ? ` (${m.id})` : ""}{m.free ? " · gratis" : ""}</option>)}
            </select>
          </Field>
          {model && (
            <div className="flex flex-wrap gap-1">
              {model.free && <Badge tone="ok">Gratis (data provider)</Badge>}
              {ctxLabel(model.context) && <Badge tone="muted">Konteks {ctxLabel(model.context)}</Badge>}
              {(model.caps ?? []).filter((c) => c !== "text").map((c) => <Badge key={c} tone="accent">{CAP_LABEL[c]}</Badge>)}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-2 p-2.5 text-center">
            <div><div className="text-sm font-black">{compact(usage?.calls_today ?? 0)}</div><div className="text-[10px] text-muted">panggilan hari ini</div></div>
            <div><div className="text-sm font-black">{compact(usage?.tokens_month ?? 0)}</div><div className="text-[10px] text-muted">token bulan ini</div></div>
            <div><div className="text-sm font-black">{usage?.usd_month ? usd(usage.usd_month) : "—"}</div><div className="text-[10px] text-muted">estimasi biaya</div></div>
          </div>
          {(remaining || free || k.last_success_at) && (
            <div className="space-y-0.5 text-xs text-muted">
              {remaining && <div>Sisa kuota request (header terakhir): <b className="text-text">{remaining}</b>{k.rate_limit?.limitRequests ? ` dari ${k.rate_limit.limitRequests}` : ""}</div>}
              {free && typeof free === "object" && <div>Request model gratis hari ini: <b className="text-text">{JSON.stringify(free).replace(/[{}"]/g, "").replace(/,/g, ", ")}</b></div>}
              {k.account_info?.limit_remaining != null && <div>Sisa batas kredit key: <b className="text-text">{String(k.account_info.limit_remaining)}</b></div>}
              {k.last_success_at && <div>Berhasil terakhir {timeAgo(k.last_success_at)}</div>}
            </div>
          )}
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Toggle label="Aktif" hint="Matikan tanpa menghapus key." checked={k.enabled} onChange={(v) => run("toggle", () => callAI("provider_toggle", { provider: p, enabled: v }))} />
            <Field label="Status biaya akun">
              <select className={inputCls} value={k.billing} onChange={(e) => run("billing", () => callAI("provider_billing", { provider: p, billing: e.target.value }), "Status biaya disimpan")}>
                <option value="free">Gratis / tier gratis</option>
                <option value="paid">Berbayar</option>
                <option value="unknown">Belum tahu</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy === "test"} onClick={() => run("test", async () => { sfx("sys-loading"); const r = await callAI("provider_test", { provider: p }); if (!r.ok) throw new Error(r.error); }, "Koneksi OK, daftar model diperbarui")}><RefreshCw className="h-4 w-4" /> Tes</Button>
            <Button size="sm" onClick={onConnect}><IconKey size={16} /> Ganti key</Button>
            {settings?.default_provider !== p && <Button size="sm" onClick={() => setSettings({ default_provider: p })}>Jadikan default</Button>}
            {cool && <Button size="sm" loading={busy === "cool"} onClick={() => run("cool", () => callAI("provider_reset_cooldown", { provider: p }), "Jeda direset")}><RotateCcw className="h-4 w-4" /> Reset jeda</Button>}
            <Button size="sm" variant="ghost" className="text-bad" loading={busy === "del"} onClick={() => { if (window.confirm?.(`Hapus API key ${meta.label}? Karyawan yang memakai provider ini kembali ke default.`) !== false) run("del", () => callAI("provider_delete", { provider: p }), "Key dihapus"); }}><Trash2 className="h-4 w-4" /> Hapus key</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button variant="primary" className="flex-1" onClick={onConnect}><IconPlug size={18} /> Hubungkan</Button>
          <a href={meta.keyUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-1 rounded-2xl border border-line px-3 text-sm font-bold text-muted hover:text-text">Buat key <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
function ConnectSheet({ provider, onClose }: { provider: Provider | null; onClose: () => void }) {
  const toast = useStore((s) => s.toast);
  const [key, setKey] = useState("");
  const [billing, setBilling] = useState<"free" | "paid" | "unknown">("unknown");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ models: ModelInfo[]; default_model: string } | null>(null);
  useEffect(() => {
    setKey(""); setResult(null);
    if (provider) setBilling(["anthropic", "openai", "deepseek", "fireworks"].includes(provider) ? "paid" : PROVIDER_META[provider].free ? "free" : "unknown");
  }, [provider]);
  const meta = provider ? PROVIDER_META[provider] : null;
  const submit = async () => {
    if (!provider) return;
    setBusy(true);
    sfx("sys-loading");
    try {
      const r = await callAI("provider_connect", { provider, apiKey: key.trim(), billing });
      setKey("");
      setResult(r);
      sfx("api-connected");
      toast(`${meta?.label} terhubung`, "ok");
      refreshProviders();
    } catch (e) { toast((e as Error).message, "bad"); } finally { setBusy(false); }
  };
  const prefixWarn = meta?.keyPrefix && key.trim().length > 6 && !key.trim().startsWith(meta.keyPrefix);
  return (
    <Sheet open={!!provider} onClose={onClose} title={meta ? <span className="flex items-center gap-2"><ProviderBadge p={meta.id} size={30} /> Hubungkan {meta.label}</span> : ""}
      footer={result ? <Button variant="primary" className="w-full" onClick={onClose}>Selesai</Button> : <Button variant="primary" className="w-full" loading={busy} disabled={key.trim().length < 16} onClick={submit}>Tes & simpan</Button>}>
      <AnimatePresence mode="wait">
        {meta && !result && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-sm text-muted">{meta.hint}</p>
            {meta.free && <p className="rounded-2xl bg-info-soft px-3 py-2 text-xs text-info">Tier gratis menurut dokumentasi: {meta.free} Batas bisa berubah; cek di dashboard provider.</p>}
            <div className="flex flex-wrap gap-3 text-sm">
              <a href={meta.keyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent-text underline">Buka halaman API key <ExternalLink className="h-3.5 w-3.5" /></a>
              <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-muted underline">Dokumentasi & batas <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
            <Field label="API key"><input className={`${inputCls} font-mono`} type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder={meta.keyPrefix ? `${meta.keyPrefix}…` : "Tempel API key di sini"} /></Field>
            {prefixWarn && <p className="text-xs font-bold text-warn">Key {meta.label} biasanya diawali “{meta.keyPrefix}”. Pastikan key yang ditempel benar.</p>}
            <Field label="Status biaya akun" hint="Dipakai untuk opsi “Hanya provider gratis”. Bisa diubah nanti.">
              <select className={inputCls} value={billing} onChange={(e) => setBilling(e.target.value as typeof billing)}>
                <option value="free">Gratis / tier gratis</option>
                <option value="paid">Berbayar</option>
                <option value="unknown">Belum tahu</option>
              </select>
            </Field>
            <p className="text-xs text-muted">Server menguji key dengan mengambil daftar model. Key yang gagal tidak disimpan.</p>
          </motion.div>
        )}
        {result && (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-black text-ok"><CheckCircle2 className="h-5 w-5" /> Terhubung — {result.models.length} model tersedia</div>
            <p>Model default dipilih otomatis dari daftar resmi provider: <b>{result.default_model}</b>. Kamu bisa menggantinya kapan saja.</p>
            <p className="text-muted">Alice akan memakai provider ini sesuai urutan router. Pantau di Kantor atau Pusat Tugas.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
function FreeModels({ connectedCount, onConnect }: { connectedCount: number; onConnect: (p: Provider) => void }) {
  const providers = useStore((s) => s.providers);
  const toast = useStore((s) => s.toast);
  const [rows, setRows] = useState<FreeModel[] | null>(null);
  const [tab, setTab] = useState<"verified" | "unverified" | "unavailable">("verified");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const { data } = await supabase.from("ai_free_models").select("*").order("provider").order("model").limit(800);
    setRows((data ?? []) as FreeModel[]);
  };
  useEffect(() => { load(); }, [connectedCount]);
  const refresh = async () => {
    setBusy(true);
    try { const r = await callAI("free_models_refresh"); toast(`Daftar diperbarui (${r.count} entri)`, "ok"); await load(); } catch (e) { toast((e as Error).message, "bad"); } finally { setBusy(false); }
  };
  const list = useMemo(() => (rows ?? []).filter((r) => r.free_status === tab && (!q || `${r.model} ${r.label} ${r.provider}`.toLowerCase().includes(q.toLowerCase()))), [rows, tab, q]);
  const counts = (s: FreeModel["free_status"]) => (rows ?? []).filter((r) => r.free_status === s).length;
  const lastCheck = (rows ?? []).reduce((a, r) => (r.verified_at > a ? r.verified_at : a), "");

  const use = async (r: FreeModel) => {
    const k = providers.find((x) => x.provider === r.provider && x.status === "connected");
    if (!k) return onConnect(r.provider);
    if (!k.models.some((m) => m.id === r.model)) return toast("Model belum ada di daftar key-mu. Tekan Tes pada kartu provider untuk memperbarui daftar.", "info");
    try { await callAI("provider_set_model", { provider: r.provider, model: r.model }); await refreshProviders(); toast(`${r.model} jadi model default ${providerLabel(r.provider)}`, "ok"); } catch (e) { toast((e as Error).message, "bad"); }
  };

  return (
    <>
      <SectionTitle action={<Button size="sm" loading={busy} onClick={refresh}><RefreshCw className="h-4 w-4" /> Perbarui</Button>}>Free AI Models</SectionTitle>
      <Card className="p-4">
        <p className="text-sm text-muted">
          <b className="text-text">Terverifikasi</b>: harga 0 menurut API provider (misalnya model OpenRouter berakhiran <code>:free</code>).
          {" "}<b className="text-text">Belum terverifikasi</b>: provider punya tier gratis, tapi status per model tidak bisa dipastikan dari API.
          {" "}<b className="text-text">Tidak tersedia</b>: teramati langsung ditolak (kuota 0) untuk key-mu.
          {lastCheck && <> Diperiksa terakhir {dateTime(lastCheck)}.</>}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Segmented value={tab} onChange={setTab} options={[
            { value: "verified", label: "Terverifikasi gratis", count: counts("verified") },
            { value: "unverified", label: "Belum terverifikasi", count: counts("unverified") },
            { value: "unavailable", label: "Tidak tersedia", count: counts("unavailable") },
          ]} />
          <input className={`${inputCls} sm:ml-auto sm:max-w-56`} placeholder="Cari model…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="mt-3">
          {rows === null ? <div className="flex justify-center py-8"><PixLoader /></div>
            : !list.length ? <Empty title="Belum ada model di kategori ini" text={tab === "verified" ? "Tekan Perbarui untuk memeriksa daftar model gratis OpenRouter." : "Hubungkan provider dengan tier gratis untuk melihat daftarnya."} />
            : (
              <div className="grid gap-2 md:grid-cols-2">
                {list.slice(0, 80).map((r) => {
                  const k = providers.find((x) => x.provider === r.provider && x.status === "connected");
                  const isDefault = k?.default_model === r.model;
                  return (
                    <div key={`${r.provider}-${r.model}`} className="lift flex flex-col gap-1.5 rounded-2xl border border-line bg-surface-2 p-3">
                      <div className="flex items-start gap-2">
                        <ProviderBadge p={r.provider} size={28} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-extrabold" title={r.model}>{r.label || r.model}</div>
                          <div className="truncate text-[11px] text-muted">{r.model} · {providerLabel(r.provider)}</div>
                        </div>
                        <Badge tone={r.free_status === "verified" ? "ok" : r.free_status === "unavailable" ? "bad" : "warn"}>
                          {r.free_status === "verified" ? "Gratis" : r.free_status === "unavailable" ? "Kuota 0" : "Belum terverifikasi"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {ctxLabel(r.context_length) && <Badge tone="muted">Konteks {ctxLabel(r.context_length)}</Badge>}
                        {r.caps.filter((c) => c !== "text").map((c) => <Badge key={c} tone="accent">{CAP_LABEL[c]}</Badge>)}
                      </div>
                      {r.limits && <div className="text-[11px] text-muted">{r.limits}</div>}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                        <span>{r.source} · {timeAgo(r.verified_at)}</span>
                        {r.free_status !== "unavailable" && (isDefault ? <Badge tone="accent">Dipakai</Badge> : <button onClick={() => use(r)} className="shrink-0 font-extrabold text-accent-text underline">{k ? "Pakai" : `Hubungkan ${providerLabel(r.provider)}`}</button>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          {list.length > 80 && <p className="mt-2 text-center text-xs text-muted">Menampilkan 80 dari {list.length}. Gunakan pencarian untuk mempersempit.</p>}
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
function PricesCard() {
  const providers = useStore((s) => s.providers);
  const toast = useStore((s) => s.toast);
  const [prices, setPrices] = useState<any[]>([]);
  const connected = providers.filter((p) => p.status === "connected").map((p) => p.provider);
  const [draft, setDraft] = useState<{ provider: Provider; model: string; input: string; output: string }>({ provider: connected[0] ?? "gemini", model: "", input: "", output: "" });
  const load = async () => { const { data } = await supabase.from("ai_model_prices").select("*").order("provider"); setPrices(data ?? []); };
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!draft.model || draft.input === "" || draft.output === "") return toast("Lengkapi model dan tarif", "bad");
    const { error } = await supabase.from("ai_model_prices").upsert({ provider: draft.provider, model: draft.model, input_per_mtok: Number(draft.input), output_per_mtok: Number(draft.output), updated_at: new Date().toISOString() });
    if (error) return toast(error.message, "bad");
    toast("Tarif disimpan", "ok");
    setDraft({ ...draft, model: "", input: "", output: "" });
    load();
  };
  const del = async (p: any) => { await supabase.from("ai_model_prices").delete().eq("provider", p.provider).eq("model", p.model); load(); };
  const models = providers.find((p) => p.provider === draft.provider)?.models ?? [];
  return (
    <>
      <SectionTitle>Tarif model (estimasi biaya)</SectionTitle>
      <Card className="p-4">
        <p className="text-sm text-muted">Isi dari halaman harga resmi provider (USD per 1 juta token). Model gratis cukup diisi 0. Tanpa tarif, token tetap dihitung dan dibatasi, tapi biaya ditandai "tanpa tarif".</p>
        <div className="mt-3 space-y-1.5">
          {prices.map((p) => (
            <div key={`${p.provider}-${p.model}`} className="flex items-center justify-between gap-2 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
              <span className="min-w-0 truncate"><b>{p.model}</b> <span className="text-muted">· {providerLabel(p.provider)}</span></span>
              <span className="flex shrink-0 items-center gap-2 text-xs">in ${Number(p.input_per_mtok)} · out ${Number(p.output_per_mtok)}<button aria-label="Hapus" onClick={() => del(p)} className="text-bad"><Trash2 className="h-4 w-4" /></button></span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <select className={inputCls} value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value as Provider, model: "" })}>
            {PROVIDER_ORDER.map((p) => <option key={p} value={p}>{providerLabel(p)}</option>)}
          </select>
          {models.length ? (
            <select className={inputCls} value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })}>
              <option value="">Pilih model…</option>
              {models.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
            </select>
          ) : <input className={inputCls} placeholder="ID model" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />}
          <input className={inputCls} type="number" step="0.01" min={0} placeholder="Input $/1M" value={draft.input} onChange={(e) => setDraft({ ...draft, input: e.target.value })} />
          <input className={inputCls} type="number" step="0.01" min={0} placeholder="Output $/1M" value={draft.output} onChange={(e) => setDraft({ ...draft, output: e.target.value })} />
        </div>
        <Button className="mt-2 w-full" onClick={save}>Simpan tarif</Button>
      </Card>
    </>
  );
}
