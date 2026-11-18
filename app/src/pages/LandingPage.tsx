import { motion } from "framer-motion";
import { ArrowRight, Check, Download, ExternalLink, Lock, MousePointerClick, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo-white.png";
import { Avatar } from "../components/Avatar";
import {
  IconBell, IconChat, IconFinance, IconMemory, IconMoon, IconMusic, IconOffice, IconPlug, IconSpark, IconSun, IconTasks, IconTeam,
} from "../components/icons";
import { ProviderBadge } from "../components/ProviderBadge";
import { DEMO_DEPARTMENTS, DEMO_ROSTER, DEMO_TASKS, demoEmployees } from "../landing/demo";
import { STATUS_LABEL } from "../lib/format";
import { PROVIDER_META, PROVIDER_ORDER } from "../lib/providers";
import { useTheme } from "../lib/theme";
import { buildContext } from "../office/bubbles";
import PixelOffice from "../office/pixel/PixelOffice";

const LOGIN = "#/masuk";
const NAV = [
  { href: "#kantor", label: "Kantor" },
  { href: "#tim", label: "Tim" },
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#provider", label: "Provider AI" },
  { href: "#fitur", label: "Fitur" },
];

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
};

// Tautan anchor di dalam SPA berbasis hash: gulir manual agar tidak mengubah rute.
const jump = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith("#") || href.startsWith("#/")) return;
  e.preventDefault();
  const el = document.getElementById(href.slice(1));
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.focus({ preventScroll: true });
};

export default function LandingPage() {
  const { dark, toggle } = useTheme();
  useEffect(() => { document.title = "KANASA STUDIO · Autonomous AI Company"; }, []);
  return (
    <div className="min-h-[100dvh] bg-bg text-text">
      <a href="#konten" onClick={(e) => jump(e, "#konten")} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-3 focus:py-2 focus:font-bold focus:text-white">Lewati ke konten</a>
      <Header dark={dark} onTheme={toggle} />
      <main id="konten" tabIndex={-1} className="outline-none">
        <Hero dark={dark} />
        <Facts />
        <Team />
        <HowItWorks />
        <Providers />
        <DashboardPreview />
        <Features />
        <Security />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
function Header({ dark, onTheme }: { dark: boolean; onTheme: () => void }) {
  return (
    <header className="pt-safe sticky top-0 z-40 border-b border-line/70 bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }} className="flex items-center gap-2.5 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#7E2938]"><img src={logo} alt="" className="h-7 w-7" /></span>
          <span className="leading-none">
            <span className="font-pixel block text-[15px]">KANASA STUDIO</span>
            <span className="block text-[11px] font-bold text-muted">Autonomous AI Company</span>
          </span>
        </a>
        <nav aria-label="Navigasi halaman" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={(e) => jump(e, n.href)} className="rounded-xl px-3 py-2 text-sm font-bold text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent">{n.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onTheme} aria-label={dark ? "Gunakan mode terang" : "Gunakan mode gelap"} className="grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text focus-visible:outline-2 focus-visible:outline-accent">
            {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
          <a href={LOGIN} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-extrabold text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.2)] transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            Masuk
          </a>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
function Hero({ dark }: { dark: boolean }) {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:pb-20 lg:pt-16">
        <motion.div className="grid gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div>
          <div className="eyebrow">Tim AI · kantor virtual · 24 jam</div>
          <h1 className="font-pixel mt-3 text-[38px] leading-[1.05] sm:text-5xl lg:text-[58px]">
            Kantor kecil berisi tim AI yang terus bekerja.
          </h1>
          </div>
          <div>
          <p className="max-w-[34rem] text-[17px] leading-relaxed text-muted">
            Beri objektif ke <b className="text-text">Alice</b>, AI CEO. Ia memecahnya menjadi tugas, menugaskan tujuh karyawan AI di enam departemen,
            memilih model dari dua belas provider AI, lalu melaporkan hasilnya ke Founder.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={LOGIN} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-accent px-5 font-extrabold text-white shadow-[inset_0_-4px_0_rgb(0_0_0/0.2)] transition hover:-translate-y-px hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Masuk sebagai Founder <ArrowRight className="h-5 w-5" />
            </a>
            <a href="#cara-kerja" onClick={(e) => jump(e, "#cara-kerja")} className="inline-flex h-12 items-center rounded-2xl border border-line bg-surface px-5 font-extrabold transition hover:-translate-y-px hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              Lihat cara kerjanya
            </a>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Akses khusus akun Founder KANASA STUDIO.</p>
          </div>
        </motion.div>
        <motion.div id="kantor" tabIndex={-1} className="mt-10 scroll-mt-24 outline-none lg:mt-14" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.1 }}>
          <OfficePreview dark={dark} />
        </motion.div>
      </div>
    </section>
  );
}

const SPOT_HINT: Record<string, string> = {
  meeting: "Ruang rapat: di aplikasi, ketuk untuk memulai rapat dengan Alice dan tim yang relevan.",
  board: "Papan tugas: di aplikasi, membuka Pusat Tugas berisi tugas sungguhan.",
  whiteboard: "Whiteboard: di aplikasi, menampilkan objektif dan rencana Alice.",
  break: "Pantry: di aplikasi, kamu bisa mentraktir camilan karyawan yang lelah.",
  server: "Rak server: di aplikasi, membuka status provider AI dan router model.",
};

function OfficePreview({ dark }: { dark: boolean }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>("alice");
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    const t = window.setInterval(() => { if (document.visibilityState === "visible") setStep((s) => s + 1); }, 9000);
    return () => window.clearInterval(t);
  }, []);
  const employees = useMemo(() => demoEmployees(step), [step]);
  const ctx = useMemo(() => buildContext(employees, DEMO_TASKS, 0, 3), [employees]);
  const emp = employees.find((e) => e.id === selected);
  const roster = DEMO_ROSTER.find((r) => r.id === selected);
  const pick = (id: string) => { setSelected(id); setHint(null); };
  const spot = (k: string) => () => { setHint(SPOT_HINT[k]); setSelected(null); };

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden><i className="h-2.5 w-2.5 rounded-[3px] bg-[#A83245]" /><i className="h-2.5 w-2.5 rounded-[3px] bg-[#D88A98]" /><i className="h-2.5 w-2.5 rounded-[3px] bg-[#B7ABB1]" /></span>
        <span className="font-pixel ml-1 truncate text-xs text-muted">kantor · pratinjau</span>
        <span className="ml-auto rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-extrabold text-warn">Data contoh</span>
      </div>
      <div className="relative h-[330px] sm:h-[440px] lg:h-[580px]" style={{ background: dark ? "#171518" : "#f4ecee" }}>
        <PixelOffice
          embedded
          employees={employees}
          departments={DEMO_DEPARTMENTS}
          tasks={DEMO_TASKS}
          ctx={ctx}
          dark={dark}
          selectedId={selected}
          fx={{ kind: null, at: 0 }}
          onEmployee={pick}
          onCeo={() => pick("alice")}
          onTask={(_t, id) => pick(id)}
          onMeeting={spot("meeting")}
          onBoard={spot("board")}
          onWhiteboard={spot("whiteboard")}
          onBreak={spot("break")}
          onServer={spot("server")}
        />
      </div>
      <div className="flex min-h-[84px] items-center gap-3 border-t border-line px-4 py-3" aria-live="polite">
        {emp && roster ? (
          <>
            <Avatar appearance={emp.appearance} status={emp.status} size={48} ceo={emp.is_ceo} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-extrabold">{emp.name}</span>
                <span className="text-xs font-bold text-accent-text">{STATUS_LABEL[emp.status]}</span>
              </div>
              <div className="truncate text-xs text-muted">{emp.role_title}</div>
              <div className="mt-0.5 line-clamp-1 text-xs">{roster.blurb}</div>
            </div>
          </>
        ) : (
          <p className="flex items-start gap-2 text-sm text-muted"><MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" /> {hint ?? "Ketuk karyawan atau objek di kantor."}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function Facts() {
  const items = [
    { n: "1 + 7", l: "AI CEO dan karyawan AI" },
    { n: "6", l: "departemen dengan memori sendiri" },
    { n: "12", l: "provider AI yang bisa dihubungkan" },
    { n: "24 jam", l: "engine berjalan di server" },
  ];
  return (
    <section aria-label="Ringkasan" className="border-y border-line bg-surface">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4">
        {items.map((it, i) => (
          <div key={it.l} className={`py-6 ${i % 2 ? "pl-5" : "pr-5"} ${i > 1 ? "border-t border-line lg:border-t-0" : ""} lg:px-6 ${i ? "lg:border-l lg:border-line" : "lg:pl-0"}`}>
            <dt className="sr-only">{it.l}</dt>
            <dd className="font-pixel text-3xl text-accent-text">{it.n}</dd>
            <dd className="mt-1 text-sm font-bold text-muted">{it.l}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SectionHead({ id, eyebrow, title, text }: { id: string; eyebrow: string; title: string; text?: string }) {
  return (
    <motion.div {...reveal} className="max-w-2xl">
      <div className="eyebrow">{eyebrow}</div>
      <h2 id={`${id}-judul`} className="font-pixel mt-2 text-3xl leading-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-[16px] leading-relaxed text-muted">{text}</p>}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
function Team() {
  const dept = (id: string | null) => DEMO_DEPARTMENTS.find((d) => d.id === id);
  return (
    <section id="tim" tabIndex={-1} aria-labelledby="tim-judul" className="scroll-mt-20 py-16 outline-none lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="tim" eyebrow="Tim" title="Delapan karakter, masing-masing dengan peran yang jelas." text="Setiap karyawan punya instruksi, kemampuan, izin tool, akses memori, dan anggaran token sendiri. Posisinya di kantor mengikuti status kerja yang sebenarnya." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_ROSTER.map((r, i) => {
            const d = dept(r.department_id);
            return (
              <motion.article key={r.id} {...reveal} transition={{ ...reveal.transition, delay: (i % 4) * 0.05 }} className="lift group rounded-[20px] border border-line bg-surface p-4">
                <div className="flex items-center gap-3">
                  <Avatar appearance={r.appearance} size={56} ceo={r.is_ceo} />
                  <div className="min-w-0">
                    <h3 className="font-extrabold leading-tight">{r.name}</h3>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-extrabold text-muted">
                      <i className="h-2 w-2 rounded-[2px]" style={{ background: d?.color ?? "#A83245" }} aria-hidden />
                      {r.is_ceo ? "CEO" : d?.short_name}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-accent-text">{r.role_title}</p>
                <p className="mt-1 text-sm text-muted">{r.blurb}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    { t: "Founder memberi objektif", d: "Tulis dengan bahasa biasa, misalnya “riset peluang konten animasi AI untuk pasar Indonesia”." },
    { t: "Alice menyusun rencana", d: "Objektif dipecah menjadi tugas dengan dependensi, lalu ditugaskan ke karyawan yang paling cocok." },
    { t: "Router memilih model", d: "Tiap langkah dijalankan lewat provider yang terhubung. Bila kena limit atau error, router mencoba provider cadangan." },
    { t: "Hasil direview & dilaporkan", d: "Alice mereview hasil penting, meminta revisi bila perlu, dan menulis briefing harian untuk Founder." },
  ];
  return (
    <section id="cara-kerja" tabIndex={-1} aria-labelledby="cara-kerja-judul" className="scroll-mt-20 border-y border-line bg-surface py-16 outline-none lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="cara-kerja" eyebrow="Cara kerja" title="Dari satu kalimat menjadi pekerjaan yang selesai." />
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.li key={s.t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className="relative rounded-[20px] border border-line bg-bg p-5">
              <span className="font-pixel grid h-10 w-10 place-items-center rounded-xl bg-accent text-lg text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.2)]">{i + 1}</span>
              <h3 className="mt-4 font-extrabold">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </motion.li>
          ))}
        </ol>
        <motion.p {...reveal} className="font-pixel mt-8 text-center text-sm text-muted">
          Tugas <span className="text-accent-text">→</span> Karyawan <span className="text-accent-text">→</span> Router <span className="text-accent-text">→</span> Provider <span className="text-accent-text">→</span> Model
        </motion.p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function Providers() {
  const points = [
    "Model khusus per karyawan, provider default, lalu urutan cadangan yang bisa diatur.",
    "Coba ulang singkat untuk 429, 5xx, dan timeout; provider yang bermasalah diberi jeda otomatis.",
    "Opsi “hanya provider gratis” agar provider berbayar tidak terpakai.",
    "Katalog Free AI Models: gratis terverifikasi, belum terverifikasi, atau tidak tersedia — tidak pernah ditebak.",
  ];
  return (
    <section id="provider" tabIndex={-1} aria-labelledby="provider-judul" className="scroll-mt-20 py-16 outline-none lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHead id="provider" eyebrow="Provider AI" title="Satu router, dua belas provider." text="Hubungkan provider yang kamu punya. Router memilih model per langkah kerja dan pindah ke cadangan saat satu provider sedang dibatasi." />
          <ul className="mt-6 space-y-2.5">
            {points.map((p) => (
              <motion.li key={p} {...reveal} className="flex gap-2.5 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" /> <span>{p}</span></motion.li>
            ))}
          </ul>
        </div>
        <motion.div {...reveal} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {PROVIDER_ORDER.map((p) => {
            const m = PROVIDER_META[p];
            return (
              <div key={p} className="lift flex flex-col items-center gap-2 rounded-[18px] border border-line bg-surface px-2 py-4 text-center">
                <ProviderBadge p={p} size={40} />
                <span className="text-xs font-extrabold leading-tight">{m.label}</span>
                <span className="text-[10px] font-bold text-muted">{m.tier === 1 ? "Utama" : "Tambahan"}{m.free ? " · ada tier gratis" : ""}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
      <p className="mx-auto mt-6 max-w-6xl px-4 text-[11px] text-muted sm:px-6">Monogram di atas adalah penanda buatan Kanasa, bukan logo resmi. Batas tier gratis mengikuti kebijakan masing-masing provider dan bisa berubah.</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
function DashboardPreview() {
  const rows = [
    { code: "TSK-201", t: "Riset tren konten animasi pendek", who: "emp-ri-01", s: "Selesai", tone: "text-ok bg-ok-soft" },
    { code: "TSK-202", t: "Draf kalender konten 2 minggu", who: "emp-mkt-01", s: "Berjalan", tone: "text-info bg-info-soft" },
    { code: "TSK-203", t: "Spesifikasi halaman katalog", who: "emp-swe-01", s: "Antre", tone: "text-muted bg-surface-2" },
    { code: "TSK-204", t: "Estimasi biaya token bulan ini", who: "emp-fin-01", s: "Butuh persetujuan", tone: "text-warn bg-warn-soft" },
  ];
  const who = (id: string) => DEMO_ROSTER.find((r) => r.id === id)!;
  return (
    <section aria-labelledby="dasbor-judul" className="border-y border-line bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="dasbor" eyebrow="Pusat kendali" title="Semua pekerjaan terlihat, termasuk yang gagal." text="Pusat Tugas menampilkan status, langkah, provider yang dipakai, sumber riset, dan biaya. Tugas yang butuh keputusan menunggu persetujuanmu." />
        <motion.div {...reveal} className="mt-10 overflow-hidden rounded-[22px] border border-line bg-bg shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-pixel text-sm">Pusat Tugas</span>
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-extrabold text-warn">Contoh tampilan</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const w = who(r.who);
              return (
                <li key={r.code} className="flex items-center gap-3 px-4 py-3">
                  <Avatar appearance={w.appearance} size={34} ring={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-extrabold">{r.t}</div>
                    <div className="truncate text-xs text-muted">{r.code} · {w.name}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${r.tone}`}>{r.s}</span>
                </li>
              );
            })}
          </ul>
          <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-3">
            {[{ l: "Token hari ini", v: 62 }, { l: "Anggaran USD harian", v: 18 }, { l: "Tugas selesai minggu ini", v: 74 }].map((b) => (
              <div key={b.l}>
                <div className="flex justify-between text-xs font-bold"><span className="text-muted">{b.l}</span><span>{b.v}%</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2"><motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} whileInView={{ width: `${b.v}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} /></div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function Features() {
  const items = [
    { i: IconOffice, t: "Kantor pixel art interaktif", d: "Karyawan berjalan ke meja, ruang rapat, atau lounge sesuai status nyata. Ketuk untuk membuka profil, tugas, dan chat." },
    { i: IconChat, t: "Chat & rapat", d: "Chat langsung dengan karyawan mana pun, atau rapat bersama Alice dan anggota tim yang relevan." },
    { i: IconTasks, t: "Tugas dengan dependensi", d: "Langkah kerja, percobaan ulang, dan riwayat provider tercatat per tugas." },
    { i: IconMemory, t: "Memori perusahaan", d: "Pengetahuan disimpan per departemen; karyawan hanya membaca cakupan yang diizinkan." },
    { i: IconFinance, t: "Anggaran token & biaya", d: "Batas harian per karyawan, estimasi biaya dari tarif yang kamu isi, dan laporan pemakaian per provider." },
    { i: IconBell, t: "Notifikasi push", d: "Kabar penting sampai ke HP walau aplikasi ditutup, diatur per tingkat prioritas." },
    { i: IconMusic, t: "Musik & efek suara", d: "Efek suara dibuat dengan ElevenLabs. Musik latar dari lagu milikmu sendiri, diputar berulang dan tersimpan di semua perangkat." },
    { i: IconTeam, t: "Karyawan yang bisa diatur", d: "Ubah instruksi, kepribadian, model, izin tool, dan anggaran tiap karyawan." },
    { i: IconSpark, t: "Jadwal harian otomatis", d: "Briefing pagi, siklus riset, produksi, dan laporan eksekutif sore berjalan sesuai jadwal WIB." },
  ];
  return (
    <section id="fitur" tabIndex={-1} aria-labelledby="fitur-judul" className="scroll-mt-20 py-16 outline-none lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="fitur" eyebrow="Fitur" title="Dirancang untuk dipakai setiap hari, di HP maupun laptop." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ i: I, t, d }, n) => (
            <motion.div key={t} {...reveal} transition={{ ...reveal.transition, delay: (n % 3) * 0.05 }} className="lift rounded-[20px] border border-line bg-surface p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent-text"><I size={24} /></span>
              <h3 className="mt-4 font-extrabold">{t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function Security() {
  const items = [
    "API key dikirim lewat HTTPS ke server, diuji, lalu disimpan terenkripsi di Supabase Vault.",
    "Key tidak pernah disimpan di browser, tidak tampil utuh di layar, dan tidak ditulis ke log.",
    "Data perusahaan dilindungi Row Level Security: hanya akun Founder yang bisa membacanya.",
    "Halaman ini hanya memakai data contoh dan tidak mengakses data perusahaan.",
  ];
  return (
    <section aria-labelledby="keamanan-judul" className="border-y border-line bg-surface py-16">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <motion.div {...reveal} className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ok-soft text-ok"><ShieldCheck className="h-6 w-6" /></span>
          <div>
            <div className="eyebrow">Keamanan</div>
            <h2 id="keamanan-judul" className="font-pixel mt-2 text-3xl leading-tight">Kunci API tetap di server.</h2>
          </div>
        </motion.div>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {items.map((t) => (
            <motion.li key={t} {...reveal} className="flex gap-2.5 rounded-2xl border border-line bg-bg p-4 text-sm"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-ok" /> {t}</motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
function FinalCta() {
  return (
    <section aria-labelledby="mulai-judul" className="py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div {...reveal} className="relative overflow-hidden rounded-[28px] bg-[#7E2938] px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:12px_12px]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end">
            <div>
              <h2 id="mulai-judul" className="font-pixel text-3xl leading-tight sm:text-4xl">Kantornya sudah buka. Alice menunggu objektif berikutnya.</h2>
              <p className="mt-3 max-w-xl text-white/80">Masuk dengan akun Founder di web, atau pasang sebagai aplikasi di HP lewat Chrome untuk notifikasi push.</p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col lg:items-stretch">
              <a href={LOGIN} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 font-extrabold text-[#7E2938] shadow-[inset_0_-4px_0_rgb(0_0_0/0.12)] transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Masuk sebagai Founder <ArrowRight className="h-5 w-5" />
              </a>
              <a href="https://github.com/KanasaStudio/kanasa-ai/releases/tag/android-latest" target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/30 px-5 font-extrabold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Download className="h-5 w-5" /> APK Android
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="flex items-center gap-2"><IconPlug size={16} /> © {new Date().getFullYear()} KANASA STUDIO · Autonomous AI Company</span>
        <span className="flex flex-wrap gap-4">
          <a href="https://kanasastudio.github.io/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold hover:text-text">Website Kanasa Studio <ExternalLink className="h-3.5 w-3.5" /></a>
          <a href="https://github.com/KanasaStudio/kanasa-ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold hover:text-text">GitHub <ExternalLink className="h-3.5 w-3.5" /></a>
        </span>
      </div>
    </footer>
  );
}
