import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";
import { sfx, useAudio } from "../audio/manager";
import { useMusic } from "../audio/music";
import logo from "../assets/logo-white.png";
import { navigate } from "../lib/router";
import { useLocalPref, useTheme } from "../lib/theme";
import { useStore } from "../store/useStore";
import {
  IconBell, IconCeo, IconCreative, IconDashboard, IconDepartments, IconFinance, IconIntel, IconKey, IconMemory, IconMoon, IconMore,
  IconMusic, IconOffice, IconSettings, IconSound, IconSun, IconTasks, IconTeam,
} from "./icons";
import { Sheet } from "./ui";

export const NAV = [
  { id: "kantor", label: "Kantor Virtual", short: "Kantor", icon: IconOffice },
  { id: "dashboard", label: "Dashboard Founder", short: "Dashboard", icon: IconDashboard },
  { id: "ceo", label: "Ruang CEO · Alice", short: "Alice", icon: IconCeo },
  { id: "karyawan", label: "Karyawan", short: "Tim", icon: IconTeam },
  { id: "departemen", label: "Departemen", short: "Departemen", icon: IconDepartments },
  { id: "tugas", label: "Pusat Tugas", short: "Tugas", icon: IconTasks },
  { id: "intel", label: "Intel Pasar", short: "Intel", icon: IconIntel },
  { id: "kreatif", label: "Proyek Kreatif", short: "Kreatif", icon: IconCreative },
  { id: "keuangan", label: "Keuangan", short: "Keuangan", icon: IconFinance },
  { id: "memori", label: "Memori Perusahaan", short: "Memori", icon: IconMemory },
  { id: "musik", label: "Musik & Suara", short: "Musik", icon: IconMusic },
  { id: "notifikasi", label: "Notifikasi", short: "Notifikasi", icon: IconBell },
  { id: "api", label: "API & Model AI", short: "API", icon: IconKey },
  { id: "pengaturan", label: "Pengaturan", short: "Pengaturan", icon: IconSettings },
] as const;

const BOTTOM = ["kantor", "dashboard", "tugas", "karyawan"];

export function LogoChip({ compact }: { compact?: boolean }) {
  return (
    <button onClick={() => { sfx("ui-click"); navigate("kantor"); }} className="flex items-center gap-2.5 rounded-2xl bg-ink py-1.5 pl-1.5 pr-3 text-ink-text shadow-card transition active:scale-95" aria-label="KANASA STUDIO — ke Kantor">
      <img src={logo} alt="" className="h-9 w-9" />
      {!compact && <span className="font-pixel text-left text-[14px] leading-[1.05]">KANASA<br /><span className="text-pink">STUDIO</span></span>}
    </button>
  );
}

const roundBtn = "grid h-11 w-11 place-items-center rounded-full border border-line bg-surface text-text shadow-card transition duration-150 hover:border-pink active:scale-90";

export function MusicButton() {
  const { tracks, playing, toggle, loaded } = useMusic();
  return (
    <button
      aria-label={playing ? "Jeda musik" : "Putar musik"}
      title={tracks.length ? (playing ? "Jeda musik" : "Putar playlist") : "Tambahkan musik"}
      onClick={() => { sfx("ui-click"); if (!tracks.length && loaded) navigate("musik"); else toggle(); }}
      className={`${roundBtn} ${playing ? "border-accent text-accent-text" : ""}`}
    >
      {playing ? <span className="eq"><i /><i /><i /></span> : <IconMusic size={20} />}
    </button>
  );
}

export function TopBar({ page, floating }: { page: string; floating?: boolean }) {
  const unread = useStore((s) => s.notifications.filter((n) => !n.read_at).length);
  const { dark, toggle } = useTheme();
  const muted = useAudio((s) => s.muted || !s.enabled);
  const setAudio = useAudio((s) => s.set);
  const nav = NAV.find((n) => n.id === page);
  return (
    <header className={`pt-safe z-30 ${floating ? "pointer-events-none absolute inset-x-0 top-0" : "sticky top-0 border-b border-line bg-bg/85 backdrop-blur-md"}`}>
      <div className="pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="md:hidden"><LogoChip compact={!floating} /></span>
          {!floating && (
            <motion.h1 key={page} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="truncate text-lg font-black md:text-xl">
              <span className="md:hidden">{nav?.short}</span><span className="hidden md:inline">{nav?.label}</span>
            </motion.h1>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <MusicButton />
          <button aria-label={muted ? "Nyalakan suara" : "Senyapkan suara"} title={muted ? "Nyalakan suara" : "Senyapkan"} onClick={() => { setAudio({ muted: !muted, enabled: true }); if (muted) setTimeout(() => sfx("ui-confirm"), 60); }} className={`${roundBtn} hidden sm:grid`}>
            <IconSound size={20} muted={muted} />
          </button>
          <button aria-label={dark ? "Mode terang" : "Mode gelap"} title={dark ? "Mode terang" : "Mode gelap"} onClick={() => { sfx("ui-tab"); toggle(); }} className={roundBtn}>
            <motion.span key={dark ? "sun" : "moon"} initial={{ rotate: -60, opacity: 0, scale: 0.6 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
              {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
            </motion.span>
          </button>
          <button aria-label="Notifikasi" onClick={() => { sfx("ui-click"); navigate("notifikasi"); }} className={`relative ${roundBtn}`}>
            <IconBell size={20} />
            <AnimatePresence>
              {unread > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-black text-white ring-2 ring-bg">
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button aria-label="Pengaturan" onClick={() => { sfx("ui-click"); navigate("pengaturan"); }} className={`${roundBtn} hidden sm:grid`}>
            <IconSettings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function useRailWidth() {
  const [open] = useLocalPref<boolean>("kanasa-rail-open", false);
  return open ? 232 : 92;
}

export function SideRail({ page }: { page: string }) {
  const pending = useStore((s) => s.approvals.filter((a) => a.status === "pending").length);
  const [open, setOpen] = useLocalPref<boolean>("kanasa-rail-open", false);
  return (
    <motion.aside
      animate={{ width: open ? 232 : 92 }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="fixed inset-y-0 left-0 z-40 hidden flex-col gap-3 px-3 py-4 md:flex"
    >
      <div className={`flex ${open ? "justify-start" : "justify-center"}`}><LogoChip compact={!open} /></div>
      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto rounded-[26px] border border-line bg-surface p-2 shadow-card">
        {NAV.map((n) => {
          const active = page === n.id;
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              title={n.label}
              aria-label={n.label}
              aria-current={active ? "page" : undefined}
              onClick={() => { sfx("ui-tab"); navigate(n.id); }}
              onPointerEnter={(e) => e.pointerType === "mouse" && sfx("ui-hover")}
              className={`group relative flex items-center rounded-2xl transition-colors duration-150 ${open ? "gap-3 px-3 py-2.5" : "flex-col gap-0.5 py-2"} ${active ? "text-white" : "text-muted hover:bg-surface-2 hover:text-text"}`}
            >
              {active && <motion.span layoutId="rail-active" className="absolute inset-0 rounded-2xl bg-accent shadow-[0_6px_16px_-8px_rgb(168_50_69/0.9)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative transition-transform duration-200 group-hover:scale-110 group-active:scale-95"><Icon size={21} /></span>
              <span className={`relative truncate font-extrabold ${open ? "text-[13px]" : "max-w-[64px] px-1 text-[10px]"}`}>{open ? n.label : n.short}</span>
              {n.id === "tugas" && pending > 0 && <span className={`absolute h-2 w-2 rounded-full bg-pink ring-2 ring-surface ${open ? "right-3 top-1/2 -translate-y-1/2" : "right-2 top-1.5"}`} />}
            </button>
          );
        })}
      </nav>
      <button onClick={() => { sfx("ui-tab"); setOpen(!open); }} className="flex h-9 items-center justify-center gap-1 rounded-2xl border border-line bg-surface text-xs font-bold text-muted shadow-card hover:text-text" aria-label={open ? "Ciutkan menu" : "Lebarkan menu"}>
        {open ? <><ChevronLeft className="h-4 w-4" /> Ciutkan</> : <ChevronRight className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}

export function BottomNav({ page }: { page: string }) {
  const [more, setMore] = useState(false);
  const pending = useStore((s) => s.approvals.filter((a) => a.status === "pending").length);
  const inMore = !BOTTOM.includes(page);
  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
          {NAV.filter((n) => BOTTOM.includes(n.id)).map((n) => {
            const active = page === n.id;
            const Icon = n.icon;
            return (
              <button key={n.id} onClick={() => { sfx("ui-tab"); navigate(n.id); }} className="relative flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-extrabold">
                <span className="relative grid h-9 w-12 place-items-center">
                  {active && <motion.span layoutId="bottom-active" className="absolute inset-0 rounded-2xl bg-accent" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className={`relative ${active ? "text-white" : "text-muted"}`}><Icon size={21} /></span>
                </span>
                <span className={active ? "text-text" : "text-muted"}>{n.short}</span>
                {n.id === "tugas" && pending > 0 && <span className="absolute right-4 top-1 h-2.5 w-2.5 rounded-full bg-pink ring-2 ring-surface" />}
              </button>
            );
          })}
          <button onClick={() => setMore(true)} className="flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-extrabold">
            <span className={`grid h-9 w-12 place-items-center rounded-2xl transition ${inMore ? "bg-accent text-white" : "text-muted"}`}>
              <IconMore size={21} />
            </span>
            <span className={inMore ? "text-text" : "text-muted"}>Lainnya</span>
          </button>
        </div>
      </nav>
      <Sheet open={more} onClose={() => setMore(false)} title="Menu">
        <div className="grid grid-cols-3 gap-2.5 pb-2">
          {NAV.map((n, i) => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.018, type: "spring", stiffness: 380, damping: 26 }}
                onClick={() => { sfx("ui-tab"); setMore(false); navigate(n.id); }}
                className={`flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-3xl border p-2 text-center text-xs font-extrabold transition active:scale-95 ${active ? "border-accent bg-accent-soft text-accent-text" : "border-line bg-surface-2"}`}
              >
                <Icon size={24} />
                {n.label}
              </motion.button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0px)] z-[60] flex flex-col items-center gap-2 p-3" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={`pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold shadow-xl ${t.tone === "bad" ? "bg-bad text-white" : t.tone === "ok" ? "bg-[#2c6b47] text-white" : "bg-ink text-ink-text ring-1 ring-white/10"}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-[2px] ${t.tone === "bad" ? "bg-white" : t.tone === "ok" ? "bg-[#9fe0b6]" : "bg-pink"}`} />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-3 md:pb-12">{children}</main>;
}
