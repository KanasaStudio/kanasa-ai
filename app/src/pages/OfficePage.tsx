import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { audio, sfx, useAudio } from "../audio/manager";
import { IconChat, IconCoffee, IconCookie, IconCube, IconGrid, IconKey, IconPlus, IconSpark, IconWave } from "../components/icons";
import { PixLoader } from "../components/ui";
import { rpc } from "../lib/api";
import { navigate } from "../lib/router";
import { useLocalPref, useTheme } from "../lib/theme";
import { buildContext } from "../office/bubbles";
import PixelOffice from "../office/pixel/PixelOffice";
import { webglAvailable } from "../office/webgl";
import { useStore } from "../store/useStore";

const Office3D = lazy(() => import("../office/Office3D"));

export default function OfficePage() {
  const employees = useStore((s) => s.employees);
  const departments = useStore((s) => s.departments);
  const tasks = useStore((s) => s.tasks);
  const approvals = useStore((s) => s.approvals);
  const providers = useStore((s) => s.providers);
  const dashboard = useStore((s) => s.dashboard);
  const settings = useStore((s) => s.settings);
  const selectedId = useStore((s) => s.selectedEmployeeId);
  const select = useStore((s) => s.selectEmployee);
  const openChat = useStore((s) => s.openChat);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const fxState = useStore((s) => s.officeFx);
  const fx = useStore((s) => s.fx);
  const toast = useStore((s) => s.toast);
  const { dark } = useTheme();
  const [view, setView] = useLocalPref<"pixel" | "3d">("kanasa-office-view", "pixel");
  const [quality] = useLocalPref<"high" | "low">("kanasa-quality", window.innerWidth < 768 ? "low" : "high");
  const [cardsOpen, setCardsOpen] = useLocalPref<boolean>("kanasa-office-cards", true);
  const [slowHint, setSlowHint] = useState(false);
  const ambience = useAudio((s) => s.ambience);

  const connected = providers.filter((p) => p.status === "connected" && p.enabled && p.default_model).length;
  const pending = approvals.filter((a) => a.status === "pending").length;
  const ctx = useMemo(() => buildContext(employees, tasks, pending, connected), [employees, tasks, pending, connected]);
  const bars = useMemo(() => departments.map((d) => tasks.filter((t) => t.department_id === d.id && t.status === "completed").length), [departments, tasks]);
  const typing = employees.filter((e) => e.status === "working").length;

  // Suasana kantor: ambience lembut + ketikan sesuai jumlah karyawan yang benar-benar bekerja.
  useEffect(() => {
    if (ambience <= 0) return;
    audio.startLoop("office-ambience", 0.8);
    return () => audio.stopLoop("office-ambience");
  }, [ambience]);
  useEffect(() => {
    if (typing > 0) audio.startLoop("office-typing", Math.min(1, 0.45 + typing * 0.18));
    else audio.stopLoop("office-typing");
    return () => audio.stopLoop("office-typing");
  }, [typing]);

  const t = dashboard?.tasks;
  const doneToday = t?.completed_today ?? 0;
  const touched = doneToday + (t?.failed_today ?? 0) + (t?.active ?? 0);
  const productivity = touched ? Math.round((doneToday / touched) * 100) : null;
  const working = dashboard?.employees.working ?? 0;
  const mood = settings?.emergency_stop
    ? { label: "Emergency stop aktif", face: "·_·" }
    : !connected ? { label: "Menunggu API terhubung", face: "-_-" }
    : (dashboard?.employees.failed ?? 0) > 0 || (t?.failed_today ?? 0) > 0 ? { label: "Ada kendala, perlu dicek", face: "o_o" }
    : working > 0 ? { label: "Seru & produktif!", face: "^o^" }
    : (dashboard?.employees.resting ?? 0) > 0 ? { label: "Lagi santai sejenak", face: "u_u" }
    : { label: "Tenang, siap tugas baru", face: "^_^" };

  const takeBreak = async () => {
    try {
      const n = await rpc<number>("ai_office_break", { p_minutes: 15 });
      toast(n ? `${n} karyawan ke ruang santai selama 15 menit` : "Semua karyawan sedang sibuk bekerja", n ? "ok" : "info");
    } catch (e) { toast((e as Error).message, "bad"); }
  };

  const actions = [
    { icon: IconWave, label: "Sapa Tim", onClick: () => { sfx("office-chirp"); fx("poke"); } },
    { icon: IconChat, label: "Rapat Tim", onClick: () => { sfx("office-meeting"); openChat("group"); } },
    { icon: IconCookie, label: "Camilan", onClick: () => { sfx("ui-confirm"); fx("snack"); } },
    { icon: IconPlus, label: "Tugas Baru", onClick: () => setCommandOpen(true), primary: true },
    { icon: IconCoffee, label: "Istirahat", onClick: takeBreak },
  ];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      <div className="absolute inset-0 md:left-[var(--rail,92px)]">
        {view === "pixel" || !webglAvailable() ? (
          <PixelOffice
            employees={employees}
            departments={departments}
            tasks={tasks}
            ctx={ctx}
            dark={dark}
            selectedId={selectedId}
            fx={fxState}
            onEmployee={select}
            onCeo={() => navigate("ceo")}
            onMeeting={() => openChat("group")}
            onTask={(id, emp) => (id ? navigate(`tugas/${id}`) : select(emp))}
            onBoard={() => navigate("dashboard")}
            onBreak={takeBreak}
            onServer={() => navigate("api")}
            onWhiteboard={() => navigate("tugas")}
            onSound={(n) => sfx(n as any)}
          />
        ) : (
          <Suspense fallback={<div className="grid h-full place-items-center gap-3 text-sm font-bold text-muted"><PixLoader /> Menyiapkan kantor 3D…</div>}>
            <Office3D employees={employees} ctx={ctx} dark={dark} quality={quality} selectedId={selectedId} onSelect={select} fx={fxState} bars={bars} onSlow={() => setSlowHint(true)} />
          </Suspense>
        )}
      </div>

      {/* Peringatan & pilihan tampilan */}
      <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+64px)] z-20 flex flex-col items-center gap-2 px-4 md:left-[var(--rail,92px)]">
        {!connected && (
          <motion.button initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onClick={() => navigate("api")} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl border border-accent/50 bg-surface/95 px-4 py-3 text-left shadow-card backdrop-blur">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white"><IconKey size={20} /></span>
            <span className="text-sm"><b>Tim belum bisa bekerja.</b> Hubungkan satu provider AI (ada yang gratis, misalnya OpenRouter atau Groq) agar karyawan mulai bekerja.</span>
          </motion.button>
        )}
        {slowHint && view === "3d" && (
          <button onClick={() => { setView("pixel"); setSlowHint(false); }} className="pointer-events-auto rounded-2xl border border-line bg-surface/95 px-4 py-2.5 text-sm font-bold shadow-card">
            Kantor 3D terasa berat? <span className="text-accent-text underline">Kembali ke pixel art</span>
          </button>
        )}
      </div>
      <div className="absolute left-3 top-[calc(env(safe-area-inset-top)+120px)] z-20 flex flex-col gap-1.5 md:left-[calc(var(--rail,92px)+12px)] md:top-[calc(env(safe-area-inset-top)+110px)]">
        <button onClick={() => { sfx("ui-tab"); setView(view === "pixel" ? "3d" : "pixel"); }} className="pix-btn w-auto px-2.5 text-[12px]" title={view === "pixel" ? "Lihat versi 3D" : "Lihat versi pixel art"} aria-label={view === "pixel" ? "Lihat versi 3D" : "Lihat versi pixel art"}>
          {view === "pixel" ? <IconCube size={18} /> : <IconGrid size={18} />}
        </button>
      </div>

      {/* Aksi & kartu bawah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-20 px-3 md:bottom-4 md:left-[var(--rail,92px)] md:px-6">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2.5">
            {actions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, type: "spring", stiffness: 360, damping: 24 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => { if (!a.primary) sfx("ui-click"); a.onClick(); }}
                className={`flex h-[66px] min-w-[70px] flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 text-[11px] font-extrabold shadow-card transition-colors ${a.primary ? "shine border-accent bg-accent text-white" : "border-line bg-surface/95 backdrop-blur hover:border-pink"}`}
              >
                <a.icon size={22} />
                <span className="whitespace-nowrap">{a.label}</span>
              </motion.button>
            ))}
          </div>
          {cardsOpen && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2.5">
              <button onClick={() => navigate("dashboard")} className="lift rounded-3xl border border-line bg-surface/95 p-3.5 text-left shadow-card backdrop-blur">
                <div className="eyebrow flex items-center gap-1.5"><IconSpark size={14} /> Produktivitas</div>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="text-2xl font-black">{productivity === null ? "—" : `${productivity}%`}</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                    <motion.span className="block h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${productivity ?? 0}%` }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }} />
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-muted">{touched ? `${doneToday} dari ${touched} tugas hari ini selesai` : "Belum ada tugas hari ini"}</div>
              </button>
              <button onClick={() => navigate("karyawan")} className="lift flex items-center gap-3 rounded-3xl border border-line bg-surface/95 p-3.5 text-left shadow-card backdrop-blur">
                <span className="font-pixel grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-[13px] text-white">{mood.face}</span>
                <span className="min-w-0">
                  <span className="eyebrow block">Mood kantor</span>
                  <span className="block text-sm font-bold leading-tight">{mood.label}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">{working} bekerja · {dashboard?.employees.resting ?? 0} istirahat</span>
                </span>
              </button>
            </motion.div>
          )}
          <button onClick={() => setCardsOpen(!cardsOpen)} className="mt-1.5 w-full text-center text-[11px] font-bold text-muted">
            {cardsOpen ? "Sembunyikan kartu" : "Tampilkan kartu ringkasan"}
          </button>
        </div>
      </div>
    </div>
  );
}
