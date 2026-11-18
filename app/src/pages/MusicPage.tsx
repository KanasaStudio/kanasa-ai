import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Pause, Pencil, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sfx, SFX_LIST, useAudio } from "../audio/manager";
import { fmtTime, useMusic } from "../audio/music";
import { IconMusic, IconSound } from "../components/icons";
import { PageShell } from "../components/Layout";
import { Badge, Button, Card, Empty, inputCls, SectionTitle, Toggle } from "../components/ui";
import { useStore } from "../store/useStore";

export default function MusicPage() {
  return (
    <PageShell>
      <Player />
      <Playlist />
      <AudioSettings />
      <SfxList />
    </PageShell>
  );
}

function Player() {
  const m = useMusic();
  const cur = m.tracks.find((t) => t.id === m.currentId) ?? m.tracks[0];
  const pct = m.duration ? (m.time / m.duration) * 100 : 0;
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative bg-[linear-gradient(135deg,#7E2938,#A83245_55%,#D88A98)] p-5 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:8px_8px]" />
        <div className="relative flex items-center gap-4">
          <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-[22px] bg-black/25 shadow-[inset_0_-4px_0_rgb(0_0_0/0.25)] ${m.playing ? "" : "opacity-90"}`}>
            {m.playing ? <span className="eq" aria-hidden><i /><i /><i /><i /></span> : <IconMusic size={36} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-pixel text-[11px] uppercase tracking-[0.08em] text-white/75">Musik latar kantor</div>
            <div className="font-pixel truncate text-xl">{cur ? cur.title : "Belum ada lagu"}</div>
            <div className="text-xs text-white/75">{m.tracks.length ? `${m.tracks.length} lagu · ${m.repeat === "one" ? "ulang satu lagu" : "playlist berulang"}${m.shuffle ? " · acak" : ""}` : "Impor lagu dari galeri atau berkas HP/laptop"}</div>
          </div>
        </div>
        <div className="relative mt-4">
          <input
            type="range" min={0} max={m.duration || 0} step={0.5} value={m.time} disabled={!m.duration}
            onChange={(e) => m.seek(Number(e.target.value))}
            aria-label="Posisi lagu"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
            style={{ background: `linear-gradient(90deg, #fff ${pct}%, rgb(255 255 255 / 0.25) ${pct}%)` }}
          />
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-white/75"><span>{fmtTime(m.time)}</span><span>{fmtTime(m.duration)}</span></div>
        </div>
        <div className="relative mt-2 flex items-center justify-center gap-3">
          <button aria-label="Acak" aria-pressed={m.shuffle} onClick={() => m.setShuffle(!m.shuffle)} className={`grid h-10 w-10 place-items-center rounded-full ${m.shuffle ? "bg-white text-[#7E2938]" : "text-white/80 hover:bg-white/15"}`}><Shuffle className="h-4 w-4" /></button>
          <button aria-label="Sebelumnya" onClick={() => m.prev()} disabled={!m.tracks.length} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40"><SkipBack className="h-5 w-5" /></button>
          <motion.button whileTap={{ scale: 0.92 }} aria-label={m.playing ? "Jeda" : "Putar"} onClick={() => m.toggle()} disabled={!m.tracks.length} className="grid h-14 w-14 place-items-center rounded-full bg-white text-[#7E2938] shadow-lg disabled:opacity-50">
            {m.loading ? <span className="pix-loader scale-75" /> : m.playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
          </motion.button>
          <button aria-label="Berikutnya" onClick={() => m.next()} disabled={!m.tracks.length} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40"><SkipForward className="h-5 w-5" /></button>
          <button aria-label={m.repeat === "one" ? "Ulang satu lagu" : "Ulang playlist"} onClick={() => m.setRepeat(m.repeat === "all" ? "one" : "all")} className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white">{m.repeat === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}</button>
        </div>
        {m.error && <div className="relative mt-2 rounded-xl bg-black/25 px-3 py-2 text-xs">{m.error}</div>}
      </div>
    </Card>
  );
}

function Playlist() {
  const m = useMusic();
  const toast = useStore((s) => s.toast);
  const input = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState(false);

  const onFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    try {
      const n = await m.importFiles(files);
      if (n) { sfx("ui-confirm"); toast(`${n} lagu ditambahkan ke playlist`, "ok"); }
    } catch (e) { toast((e as Error).message, "bad"); }
    if (input.current) input.current.value = "";
  };

  return (
    <>
      <SectionTitle action={<Button size="sm" variant="primary" onClick={() => input.current?.click()}><Upload className="h-4 w-4" /> Impor lagu</Button>}>Playlist</SectionTitle>
      <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.wav,.flac,.opus,.webm" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <Card
        className={`p-2 transition-colors ${drag ? "ring-2 ring-accent" : ""}`}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
        >
          <AnimatePresence initial={false}>
            {m.uploading.map((u) => (
              <motion.div key={u.name} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="px-2 py-1.5">
                <div className="flex items-center justify-between text-xs"><span className="truncate font-bold">{u.name}</span><span className="text-muted">{u.pct < 100 ? "Mengunggah…" : "Selesai"}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(6, u.pct)}%` }} /></div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!m.loaded ? <div className="flex justify-center py-8"><span className="pix-loader" /></div>
            : !m.tracks.length && !m.uploading.length ? (
              <Empty icon={<IconMusic size={26} />} title="Playlist masih kosong" text="Impor lagu dari galeri/berkas HP atau laptop. Lagu disimpan di penyimpanan privat Supabase milikmu, jadi playlist yang sama muncul di aplikasi dan web, lalu diputar berulang." action={<Button variant="primary" onClick={() => input.current?.click()}><Upload className="h-4 w-4" /> Pilih lagu</Button>} />
            ) : (
              <motion.ol layout className="divide-y divide-line">
                {m.tracks.map((t, i) => {
                  const active = t.id === m.currentId;
                  return (
                    <motion.li layout key={t.id} className={`flex items-center gap-2 rounded-2xl px-2 py-2 ${active ? "bg-accent-soft" : ""}`}>
                      <button onClick={() => (active ? m.toggle() : m.play(t.id))} aria-label={active && m.playing ? "Jeda" : `Putar ${t.title}`} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-text"}`}>
                        {active && m.playing ? <span className="eq eq-sm" aria-hidden><i /><i /><i /></span> : <Play className="ml-0.5 h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        {editing === t.id ? (
                          <form className="flex gap-1" onSubmit={async (e) => { e.preventDefault(); await m.rename(t.id, title.trim() || t.title); setEditing(null); }}>
                            <input autoFocus className={`${inputCls} h-9 py-1`} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Judul lagu" />
                            <button type="submit" aria-label="Simpan judul" className="grid h-9 w-9 place-items-center rounded-xl text-ok"><Check className="h-4 w-4" /></button>
                            <button type="button" aria-label="Batal" onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-xl text-muted"><X className="h-4 w-4" /></button>
                          </form>
                        ) : (
                          <>
                            <div className={`truncate text-sm font-extrabold ${active ? "text-accent-text" : ""}`}>{t.title}</div>
                            <div className="text-[11px] text-muted">{t.duration_sec ? fmtTime(t.duration_sec) : "—"}{t.size_bytes ? ` · ${(t.size_bytes / 1048576).toFixed(1)} MB` : ""}</div>
                          </>
                        )}
                      </div>
                      {editing !== t.id && (
                        <div className="flex shrink-0 items-center">
                          <button aria-label="Naikkan" disabled={i === 0} onClick={() => m.move(t.id, -1)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                          <button aria-label="Turunkan" disabled={i === m.tracks.length - 1} onClick={() => m.move(t.id, 1)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                          <button aria-label="Ganti judul" onClick={() => { setEditing(t.id); setTitle(t.title); }} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2"><Pencil className="h-4 w-4" /></button>
                          <button aria-label={`Hapus ${t.title}`} onClick={() => { if (window.confirm?.(`Hapus “${t.title}” dari playlist? Berkas lagunya juga dihapus dari penyimpanan.`) !== false) m.remove(t.id).then(() => toast("Lagu dihapus", "ok")); }} className="grid h-8 w-8 place-items-center rounded-lg text-bad hover:bg-bad-soft"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </motion.ol>
            )}
          {m.tracks.length > 0 && <p className="px-2 pb-1 pt-2 text-[11px] text-muted">Tarik & lepas berkas audio ke sini di laptop. Format yang didukung tergantung browser (MP3, M4A/AAC, OGG, WAV umumnya aman). Maks 50 MB per lagu.</p>}
        </div>
      </Card>
    </>
  );
}

function Slider({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className={`block ${disabled ? "opacity-50" : ""}`}>
      <span className="flex justify-between text-sm font-bold"><span>{label}</span><span className="tabular-nums text-muted">{Math.round(value * 100)}%</span></span>
      <input type="range" min={0} max={1} step={0.05} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--accent)]" />
    </label>
  );
}

function AudioSettings() {
  const a = useAudio();
  const off = !a.enabled || a.muted;
  return (
    <>
      <SectionTitle>Suara & volume</SectionTitle>
      <Card className="p-4">
        <div className="grid gap-x-6 md:grid-cols-2">
          <Toggle label="Suara aktif" hint="Matikan semua suara aplikasi." checked={a.enabled} onChange={(v) => a.set({ enabled: v })} />
          <Toggle label="Bisukan sementara" hint="Sama dengan tombol speaker di atas." checked={a.muted} onChange={(v) => a.set({ muted: v })} />
          <Toggle label="Suara saat hover" hint="Bunyi halus saat kursor melewati tombol (laptop)." checked={a.hover} onChange={(v) => a.set({ hover: v })} />
          <Toggle label="Putar musik otomatis" hint="Mulai playlist saat kamu pertama kali menyentuh layar." checked={a.autoplayMusic} onChange={(v) => a.set({ autoplayMusic: v })} />
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Slider label="Master" value={a.master} disabled={off} onChange={(v) => a.set({ master: v })} />
          <Slider label="Musik" value={a.music} disabled={off} onChange={(v) => a.set({ music: v })} />
          <Slider label="Efek suara" value={a.sfx} disabled={off} onChange={(v) => { a.set({ sfx: v }); sfx("ui-click"); }} />
          <Slider label="Suasana kantor" value={a.ambience} disabled={off} onChange={(v) => a.set({ ambience: v })} />
        </div>
        <p className="mt-3 text-xs text-muted">Pengaturan suara disimpan di perangkat ini. Browser baru mengizinkan suara setelah sentuhan/klik pertama.</p>
      </Card>
    </>
  );
}

function SfxList() {
  const [open, setOpen] = useState(false);
  const unlocked = useAudio((s) => s.unlocked);
  useEffect(() => undefined, [unlocked]);
  return (
    <>
      <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>{open ? "Tutup" : "Lihat"}</Button>}>Efek suara</SectionTitle>
      <Card className="p-4">
        <div className="flex items-start gap-3 text-sm text-muted">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-text"><IconSound size={22} /></span>
          <span>{SFX_LIST.length} efek suara dibuat dengan ElevenLabs Sound Effects untuk klik, menu, notifikasi, aktivitas kantor, dan status API. Ketuk untuk mendengar.</span>
        </div>
        {open && (
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {SFX_LIST.map((s) => (
              <button key={s.id} onClick={() => sfx(s.id, { volume: 1 })} className="lift flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-2.5 py-2 text-left text-xs font-bold">
                <IconSound size={16} /> <span className="min-w-0 flex-1 truncate">{s.label}</span> <Badge tone="muted">{s.group}</Badge>
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
